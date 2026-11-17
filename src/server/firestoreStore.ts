import crypto from 'node:crypto';
import type { DatabaseState } from './db.js';

/**
 * Firestore-backed persistence for the in-memory DatabaseState.
 *
 * Every record is its own document (collection names match firestore.rules).
 * Writes are diff-based: only documents whose JSON changed since the last
 * hydrate/persist are written or deleted. A `_meta/version` token changes on
 * every write so other server instances know to re-hydrate.
 */

// ---- Minimal Firestore surface (matches firebase-admin; lets tests use a fake) ----
export interface FsDocSnap {
  id: string;
  exists: boolean;
  data(): Record<string, unknown> | undefined;
}
export interface FsDocRef {
  id: string;
  get(): Promise<FsDocSnap>;
}
export interface FsCollRef {
  doc(id: string): FsDocRef;
  get(): Promise<{ docs: FsDocSnap[] }>;
}
export interface FsWriter {
  set(ref: FsDocRef, data: Record<string, unknown>): unknown;
  delete(ref: FsDocRef): unknown;
}
export interface FsBatch extends FsWriter {
  commit(): Promise<unknown>;
}
export interface FsTxn extends FsWriter {
  get(ref: FsDocRef): Promise<FsDocSnap>;
}
export interface FsLike {
  collection(name: string): FsCollRef;
  batch(): FsBatch;
  runTransaction<T>(fn: (tx: FsTxn) => Promise<T>): Promise<T>;
}

// ---- Layout ----
type ArrayKey = {
  [K in keyof DatabaseState]: DatabaseState[K] extends unknown[] ? K : never;
}[keyof DatabaseState];

interface ArraySpec {
  key: Exclude<ArrayKey, 'claims'>;
  coll: string;
  idOf: (row: Record<string, unknown>) => string;
}

const byField = (field: string) => (row: Record<string, unknown>) => String(row[field] ?? '');

const ARRAY_SPECS: ArraySpec[] = [
  { key: 'artisans', coll: 'artisans', idOf: byField('id') },
  { key: 'categories', coll: 'categories', idOf: byField('slug') },
  { key: 'products', coll: 'products', idOf: byField('id') },
  { key: 'reviews', coll: 'reviews', idOf: byField('id') },
  { key: 'blogPosts', coll: 'blogPosts', idOf: byField('id') },
  { key: 'coupons', coll: 'coupons', idOf: byField('code') },
  { key: 'bundles', coll: 'bundles', idOf: byField('id') },
  { key: 'orders', coll: 'orders', idOf: byField('id') },
  { key: 'b2bApplications', coll: 'b2bApplications', idOf: byField('id') },
  { key: 'b2bQuotes', coll: 'quotes', idOf: byField('id') },
  { key: 'auditLogs', coll: 'auditLogs', idOf: byField('id') },
  { key: 'heritageMistakeReports', coll: 'heritageMistakeReports', idOf: byField('id') },
  { key: 'leads', coll: 'leads', idOf: byField('id') },
  { key: 'supportQueries', coll: 'supportQueries', idOf: byField('id') },
  { key: 'newsletterSubscribers', coll: 'newsletterSubscribers', idOf: byField('email') },
  {
    key: 'notifyAlerts',
    coll: 'notifyAlerts',
    idOf: (r) => `${String(r.productId ?? '')}|${String(r.email ?? '')}|${String(r.createdAt ?? '')}`,
  },
];

const MAP_SPECS: { key: 'wishlists' | 'userMoharBalances'; coll: string }[] = [
  { key: 'wishlists', coll: 'wishlists' },
  { key: 'userMoharBalances', coll: 'moharBalances' },
];

const META = '_meta';
const VERSION_DOC = 'version';
const CONFIG_PATH = 'config/store';
const TELEMETRY_PATH = `${META}/telemetry`;
const orderPath = (key: string) => `${META}/order_${key}`;

/** Firestore doc ids may not contain '/', be '.'/'..', or match __.*__. */
export function toDocId(raw: string): string {
  const ok =
    raw.length > 0 &&
    raw.length <= 700 &&
    !raw.includes('/') &&
    raw !== '.' &&
    raw !== '..' &&
    !/^__.*__$/.test(raw);
  return ok ? raw : `h_${crypto.createHash('sha1').update(raw).digest('hex')}`;
}

/** Flatten state into { "collection/docId": json }. */
export function flattenState(state: DatabaseState): Map<string, string> {
  const out = new Map<string, string>();
  for (const spec of ARRAY_SPECS) {
    const rows = (state[spec.key] ?? []) as unknown as Record<string, unknown>[];
    const ids: string[] = [];
    for (const row of rows) {
      const id = toDocId(spec.idOf(row));
      if (out.has(`${spec.coll}/${id}`)) continue; // keep first occurrence, like the array order
      ids.push(id);
      out.set(`${spec.coll}/${id}`, JSON.stringify(row));
    }
    out.set(orderPath(spec.key), JSON.stringify({ ids }));
  }
  for (const spec of MAP_SPECS) {
    const rec = (state[spec.key] ?? {}) as Record<string, unknown>;
    for (const [key, value] of Object.entries(rec)) {
      out.set(`${spec.coll}/${toDocId(key)}`, JSON.stringify({ key, value }));
    }
  }
  out.set(CONFIG_PATH, JSON.stringify({ config: state.config, claims: state.claims }));
  out.set(TELEMETRY_PATH, JSON.stringify(state.telemetrySummary ?? { vitalsCount: 0, errorCount: 0 }));
  return out;
}

export interface PersistResult {
  written: number;
  deleted: number;
  /** True when another instance wrote since our last hydrate/persist. */
  foreign: boolean;
}

const TXN_LIMIT = 450;

export class FirestoreStateStore {
  private last = new Map<string, string>();
  private token: string | null = null;
  private lastCheckAt = 0;

  constructor(
    private readonly db: FsLike,
    private readonly emptyState: () => DatabaseState
  ) {}

  private ref(docPath: string): FsDocRef {
    const [coll, id] = docPath.split('/');
    return this.db.collection(coll).doc(id);
  }

  private versionRef(): FsDocRef {
    return this.db.collection(META).doc(VERSION_DOC);
  }

  /** Mark the in-memory copy as matching `state` without writing (after local seeding etc.). */
  private remember(state: DatabaseState, token: string | null) {
    this.last = flattenState(state);
    this.token = token;
    this.lastCheckAt = Date.now();
  }

  /** Load full state from Firestore. Returns null if the database was never initialized. */
  async hydrate(): Promise<DatabaseState | null> {
    // Read the version first: a write landing mid-hydrate then shows up as a token change later.
    const versionSnap = await this.versionRef().get();
    if (!versionSnap.exists) {
      this.token = null;
      this.lastCheckAt = Date.now();
      return null;
    }
    const token = String(versionSnap.data()?.token ?? '');

    const state = this.emptyState();
    const metaSnap = await this.db.collection(META).get();
    const meta = new Map(metaSnap.docs.map((d) => [d.id, d.data() ?? {}]));

    await Promise.all(
      ARRAY_SPECS.map(async (spec) => {
        const snap = await this.db.collection(spec.coll).get();
        const byId = new Map(snap.docs.map((d) => [d.id, d.data() as Record<string, unknown>]));
        const order = (meta.get(`order_${spec.key}`)?.ids as string[] | undefined) ?? [];
        const rows: Record<string, unknown>[] = [];
        for (const id of order) {
          const row = byId.get(id);
          if (row) {
            rows.push(row);
            byId.delete(id);
          }
        }
        // Docs missing from the order list (e.g. concurrent writers) go last, by id.
        for (const id of [...byId.keys()].sort()) rows.push(byId.get(id)!);
        (state as unknown as Record<string, unknown>)[spec.key] = rows;
      })
    );

    await Promise.all(
      MAP_SPECS.map(async (spec) => {
        const snap = await this.db.collection(spec.coll).get();
        const rec: Record<string, unknown> = {};
        for (const d of snap.docs) {
          const data = d.data() ?? {};
          rec[String(data.key ?? d.id)] = data.value;
        }
        (state as unknown as Record<string, unknown>)[spec.key] = rec;
      })
    );

    const configSnap = await this.ref(CONFIG_PATH).get();
    const cfg = configSnap.data() ?? {};
    if (cfg.config) state.config = cfg.config as DatabaseState['config'];
    if (Array.isArray(cfg.claims)) state.claims = cfg.claims as DatabaseState['claims'];
    const telemetry = meta.get('telemetry');
    if (telemetry) state.telemetrySummary = telemetry as DatabaseState['telemetrySummary'];

    this.remember(state, token);
    return state;
  }

  /** Cheap staleness check (one doc read, throttled). Returns fresh state if another instance wrote. */
  async refreshIfChanged(minIntervalMs: number): Promise<DatabaseState | null> {
    if (Date.now() - this.lastCheckAt < minIntervalMs) return null;
    this.lastCheckAt = Date.now();
    const snap = await this.versionRef().get();
    const remoteToken = snap.exists ? String(snap.data()?.token ?? '') : null;
    if (remoteToken === this.token) return null;
    return this.hydrate();
  }

  /** Write only what changed since the last hydrate/persist. */
  async persist(state: DatabaseState): Promise<PersistResult> {
    const next = flattenState(state);
    const sets: [string, string][] = [];
    const deletes: string[] = [];
    for (const [p, json] of next) {
      if (this.last.get(p) !== json) sets.push([p, json]);
    }
    for (const p of this.last.keys()) {
      if (!next.has(p)) deletes.push(p);
    }
    if (sets.length === 0 && deletes.length === 0) {
      return { written: 0, deleted: 0, foreign: false };
    }

    const newToken = crypto.randomUUID();
    const versionData = { token: newToken, updatedAt: new Date().toISOString() };
    const apply = (w: FsWriter, from: number, to: number) => {
      const all = [...sets.map((s) => ({ set: s })), ...deletes.map((d) => ({ del: d }))];
      for (const op of all.slice(from, to)) {
        if ('set' in op) w.set(this.ref(op.set[0]), JSON.parse(op.set[1]));
        else w.delete(this.ref(op.del));
      }
      return all.length;
    };
    const total = sets.length + deletes.length;
    let foreign = false;

    if (total <= TXN_LIMIT) {
      await this.db.runTransaction(async (tx) => {
        const v = await tx.get(this.versionRef());
        const remoteToken = v.exists ? String(v.data()?.token ?? '') : null;
        foreign = remoteToken !== this.token;
        apply(tx, 0, total);
        tx.set(this.versionRef(), versionData);
      });
    } else {
      // Large writes (first upload / reseed) exceed one transaction; use chunked batches.
      const v = await this.versionRef().get();
      const remoteToken = v.exists ? String(v.data()?.token ?? '') : null;
      foreign = remoteToken !== this.token;
      for (let i = 0; i < total; i += TXN_LIMIT) {
        const batch = this.db.batch();
        apply(batch, i, i + TXN_LIMIT);
        await batch.commit();
      }
      const vb = this.db.batch();
      vb.set(this.versionRef(), versionData);
      await vb.commit();
    }

    this.last = next;
    this.token = newToken;
    this.lastCheckAt = Date.now();
    return { written: sets.length, deleted: deletes.length, foreign };
  }

  /** Forget the remembered snapshot so the next refresh re-hydrates. */
  invalidate() {
    this.token = '__invalid__';
    this.lastCheckAt = 0;
  }
}
