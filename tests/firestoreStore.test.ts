import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Isolate file I/O and disable refresh throttling before the store module loads.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'rh-fs-test-'));
process.env.STORE_SYNC_INTERVAL_MS = '0';
delete process.env.ENV;
process.env.NODE_ENV = 'test';

const { FirestoreStateStore, flattenState } = await import('../src/server/firestoreStore.js');
const db = await import('../src/server/db.js');
type FsLike = import('../src/server/firestoreStore.js').FsLike;
type DatabaseState = import('../src/server/db.js').DatabaseState;

// ---- In-memory Firestore stand-in (returns fields in sorted key order, like Firestore) ----
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.keys(v as object)
        .sort()
        .map((k) => [k, sortKeys((v as Record<string, unknown>)[k])])
    );
  }
  return v;
}

class FakeFirestore implements FsLike {
  colls = new Map<string, Map<string, string>>();
  failNextCommit = false;
  commits = 0;

  private snap(coll: string, id: string) {
    const raw = this.colls.get(coll)?.get(id);
    return {
      id,
      exists: raw !== undefined,
      data: () => (raw === undefined ? undefined : (sortKeys(JSON.parse(raw)) as Record<string, unknown>)),
    };
  }
  private apply(ops: [string, { coll: string; id: string }, unknown][]) {
    if (this.failNextCommit) {
      this.failNextCommit = false;
      throw new Error('simulated Firestore outage');
    }
    this.commits++;
    for (const [kind, ref, data] of ops) {
      if (!this.colls.has(ref.coll)) this.colls.set(ref.coll, new Map());
      if (kind === 'set') this.colls.get(ref.coll)!.set(ref.id, JSON.stringify(data));
      else this.colls.get(ref.coll)!.delete(ref.id);
    }
  }
  collection(coll: string) {
    return {
      doc: (id: string) => ({ id, coll, get: async () => this.snap(coll, id) }),
      get: async () => ({ docs: [...(this.colls.get(coll)?.keys() ?? [])].map((id) => this.snap(coll, id)) }),
    };
  }
  batch() {
    const ops: [string, { coll: string; id: string }, unknown][] = [];
    return {
      set: (ref: any, d: unknown) => ops.push(['set', ref, d]),
      delete: (ref: any) => ops.push(['delete', ref, null]),
      commit: async () => this.apply(ops),
    };
  }
  async runTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    const ops: [string, { coll: string; id: string }, unknown][] = [];
    const r = await fn({
      get: (ref: any) => ref.get(),
      set: (ref: any, d: unknown) => ops.push(['set', ref, d]),
      delete: (ref: any) => ops.push(['delete', ref, null]),
    });
    this.apply(ops);
    return r;
  }
  count(coll: string) {
    return this.colls.get(coll)?.size ?? 0;
  }
}

function seededState(): DatabaseState {
  return db.runSeed({ reset: true }).state;
}
const empty = () => seededState(); // emptyState factory isn't under test here
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

test('uninitialized database hydrates to null', async () => {
  const s = new FirestoreStateStore(new FakeFirestore(), empty);
  assert.equal(await s.hydrate(), null);
});

test('round-trips full state, preserving array order, and re-persist is a no-op', async () => {
  const fake = new FakeFirestore();
  const a = new FirestoreStateStore(fake, empty);
  const state = seededState();
  const r = await a.persist(state); // > 450 docs: chunked batch path
  assert.ok(r.written > 450, `expected batch path, wrote ${r.written}`);
  assert.equal(fake.count('products'), state.products.length);
  assert.equal(fake.count('quotes'), state.b2bQuotes.length);

  const b = new FirestoreStateStore(fake, empty);
  const loaded = (await b.hydrate())!;
  assert.deepEqual(loaded.products.map((p) => p.id), state.products.map((p) => p.id));
  assert.deepEqual(loaded.reviews.map((x) => x.id), state.reviews.map((x) => x.id));
  assert.deepEqual(sortKeys(clone(loaded)), sortKeys(clone(state)));

  // Firestore returns keys in a different order; that must not count as a change.
  assert.deepEqual(await b.persist(loaded), { written: 0, deleted: 0, foreign: false });
});

test('diff writes: only changed docs, deletes propagate, other instance sees it', async () => {
  const fake = new FakeFirestore();
  const a = new FirestoreStateStore(fake, empty);
  const state = seededState();
  await a.persist(state);
  const b = new FirestoreStateStore(fake, empty);
  await b.hydrate();

  const removed = state.reviews.shift()!;
  state.products[0].price = 12345;
  const r = await a.persist(state);
  // product doc + review delete + reviews order doc
  assert.equal(r.written, 2);
  assert.equal(r.deleted, 1);
  assert.equal(r.foreign, false);

  const fresh = (await b.refreshIfChanged(0))!;
  assert.ok(fresh, 'b should re-hydrate after a foreign write');
  assert.equal(fresh.products[0].price, 12345);
  assert.ok(!fresh.reviews.some((x) => x.id === removed.id));
  assert.equal(await b.refreshIfChanged(0), null, 'no change -> no re-hydrate');
});

test('concurrent writers on different docs both survive', async () => {
  const fake = new FakeFirestore();
  const seed = seededState();
  await new FirestoreStateStore(fake, empty).persist(seed);
  const a = new FirestoreStateStore(fake, empty);
  const b = new FirestoreStateStore(fake, empty);
  const sa = (await a.hydrate())!;
  const sb = (await b.hydrate())!;

  sa.coupons.push({ ...clone(sa.coupons[0]), code: 'FROM-A' });
  sb.coupons.push({ ...clone(sb.coupons[0]), code: 'FROM-B' });
  assert.equal((await a.persist(sa)).foreign, false);
  assert.equal((await b.persist(sb)).foreign, true, 'b must detect a wrote first');

  const merged = (await new FirestoreStateStore(fake, empty).hydrate())!;
  const codes = merged.coupons.map((c) => c.code);
  assert.ok(codes.includes('FROM-A') && codes.includes('FROM-B'), codes.join(','));
});

test('maps, odd keys and singletons round-trip', async () => {
  const fake = new FakeFirestore();
  const a = new FirestoreStateStore(fake, empty);
  const state = seededState();
  state.wishlists['user/with/slashes'] = ['prod-001'];
  state.wishlists['__weird__'] = ['prod-002'];
  state.userMoharBalances['uid-1'] = 42;
  state.telemetrySummary = { vitalsCount: 3, errorCount: 1 };
  state.config = { ...state.config };
  await a.persist(state);
  const loaded = (await new FirestoreStateStore(fake, empty).hydrate())!;
  assert.deepEqual(loaded.wishlists, state.wishlists);
  assert.equal(loaded.userMoharBalances['uid-1'], 42);
  assert.deepEqual(loaded.telemetrySummary, state.telemetrySummary);
  assert.deepEqual(sortKeys(loaded.config), sortKeys(clone(state.config)));
  assert.deepEqual(loaded.claims.map((c) => c.id), state.claims.map((c) => c.id));
  assert.equal(flattenState(loaded).size, flattenState(state).size);
});

test('db wiring: init uploads, writes persist, foreign writes are picked up, failures roll back', async () => {
  const fake = new FakeFirestore();
  db.__setFirestoreForTests(fake);
  await db.initStore();
  assert.ok(db.isFirestoreBackend());
  assert.ok(fake.count('products') >= 100, 'first init uploads the (dev-seeded) store');

  // A write through the lock lands in Firestore.
  await db.withStoreLock((s) => {
    s.coupons.push({ ...clone(s.coupons[0]), code: 'LOCKED-WRITE' });
  });
  assert.ok(fake.colls.get('coupons')!.has('LOCKED-WRITE'));

  // Another instance writes; this instance sees it on the next request.
  const other = new FirestoreStateStore(fake, empty);
  const os2 = (await other.hydrate())!;
  os2.coupons.push({ ...clone(os2.coupons[0]), code: 'OTHER-INSTANCE' });
  await other.persist(os2);
  await db.refreshStoreIfStale();
  assert.ok(db.loadStore().coupons.some((c) => c.code === 'OTHER-INSTANCE'));

  // A failed commit surfaces as an error and the phantom change is dropped.
  fake.failNextCommit = true;
  await assert.rejects(
    db.withStoreLock((s) => {
      s.coupons.push({ ...clone(s.coupons[0]), code: 'NEVER-SAVED' });
    }),
    /simulated Firestore outage/
  );
  await db.refreshStoreIfStale();
  assert.ok(!db.loadStore().coupons.some((c) => c.code === 'NEVER-SAVED'));
  assert.ok(db.loadStore().coupons.some((c) => c.code === 'OTHER-INSTANCE'));

  db.__setFirestoreForTests(null);
});
