import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type {
  AdminConfig,
  Artisan,
  AuditEntry,
  B2BApplication,
  B2BQuote,
  BlogPost,
  Bundle,
  CategoryInfo,
  ClaimRecord,
  Coupon,
  HeritageMistakeReport,
  Lead,
  Order,
  Product,
  Review,
  SupportQuery,
} from '../types.js';
import {
  DEFAULT_ADMIN_CONFIG,
  DEFAULT_CLAIMS_REGISTRY,
} from '../config/heritageConstants.js';
import {
  ARTISANS,
  BLOG_POSTS,
  BUNDLES,
  CATEGORIES,
  COUPONS,
  SEED_B2B_APPLICATIONS,
  buildSeedB2BQuotes,
  buildSeedOrders,
  buildSeedProducts,
  buildSeedReviews,
} from './seedData.js';

export interface DatabaseState {
  artisans: Artisan[];
  categories: CategoryInfo[];
  products: Product[];
  reviews: Review[];
  blogPosts: BlogPost[];
  coupons: Coupon[];
  bundles: Bundle[];
  orders: Order[];
  b2bApplications: B2BApplication[];
  b2bQuotes: B2BQuote[];
  claims: ClaimRecord[];
  config: AdminConfig;
  auditLogs: AuditEntry[];
  heritageMistakeReports: HeritageMistakeReport[];
  leads: Lead[];
  supportQueries: SupportQuery[];
  wishlists: Record<string, string[]>;
  userMoharBalances: Record<string, number>;
  notifyAlerts: { productId: string; email: string; createdAt: string }[];
  newsletterSubscribers: { email: string; consentAccepted: boolean; createdAt: string }[];
  telemetrySummary: {
    vitalsCount: number;
    errorCount: number;
    lastUpdatedAt?: string;
  };
}

// Vercel functions only allow writes under /tmp (ephemeral, per instance).
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : process.env.VERCEL
    ? path.join(os.tmpdir(), 'rangrez-data')
    : path.resolve(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

export function isProductionEnv(): boolean {
  return (process.env.ENV || process.env.NODE_ENV || '').toLowerCase() === 'production';
}

export function getAdminAllowlist(): string[] {
  const raw = process.env.ADMIN_EMAILS || 'durlabhdaryani70@gmail.com';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// ---------- Firebase Admin Initialization ----------
let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;
let firestoreReachable = false;
let firestoreStatusNote = 'Not initialized yet';

function initFirebaseAdmin(): void {
  if (adminApp) return;
  try {
    let projectId = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0813412107';
    let databaseId =
      process.env.FIRESTORE_DATABASE_ID ||
      'ai-studio-rangrezhaveli-9969d5c1-ae97-431a-8ac6-38a5556fc07e';

    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      try {
        const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as {
          projectId?: string;
          firestoreDatabaseId?: string;
        };
        if (cfg.projectId) projectId = cfg.projectId;
        if (cfg.firestoreDatabaseId) databaseId = cfg.firestoreDatabaseId;
      } catch {
        // Use env/default
      }
    }

    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (getApps().length > 0) {
      adminApp = getApps()[0];
    } else if (saJson) {
      const parsed = JSON.parse(saJson);
      adminApp = initializeApp({
        credential: cert(parsed),
        projectId,
      });
    } else {
      adminApp = initializeApp({ projectId });
    }

    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp, databaseId);
    firestoreStatusNote = process.env.GOOGLE_APPLICATION_CREDENTIALS || saJson
      ? 'Firebase Admin SDK configured'
      : 'Firebase Admin SDK initialized (using public JWT verification; Firestore Admin writes require ADC/Service Account in sandbox)';
  } catch (err) {
    firestoreStatusNote = err instanceof Error ? err.message : 'Firebase Admin init warning';
  }
}

initFirebaseAdmin();

export function getFirebaseAdminAuth(): Auth | null {
  initFirebaseAdmin();
  return adminAuth;
}

export function getFirebaseAdminDb(): Firestore | null {
  initFirebaseAdmin();
  return adminDb;
}

export async function probeFirestoreConnection(): Promise<{
  connected: boolean;
  note: string;
}> {
  if (!adminDb) {
    return { connected: false, note: firestoreStatusNote };
  }
  // Without credentials the Firestore client rejects outside this try/catch
  // (an unhandled rejection inside google-gax) and crashes the process.
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    firestoreReachable = false;
    firestoreStatusNote = 'Firestore Admin skipped (no credentials configured). Local atomic cache active.';
    return { connected: false, note: firestoreStatusNote };
  }
  try {
    await adminDb.collection('config').doc('store').get();
    firestoreReachable = true;
    firestoreStatusNote = 'Connected to Cloud Firestore (Admin SDK)';
  } catch (err) {
    firestoreReachable = false;
    firestoreStatusNote =
      err instanceof Error
        ? `Firestore Admin offline (${err.message.slice(0, 120)}). Local atomic cache active.`
        : 'Firestore Admin offline. Local atomic cache active.';
  }
  return { connected: firestoreReachable, note: firestoreStatusNote };
}

export function getFirestoreStatus() {
  return {
    connected: firestoreReachable,
    note: firestoreStatusNote,
  };
}

// ---------- Atomic Mutex Lock for Store Operations ----------
let lockTail: Promise<void> = Promise.resolve();

export async function withStoreLock<T>(fn: (state: DatabaseState) => Promise<T> | T): Promise<T> {
  const prev = lockTail;
  let release!: () => void;
  lockTail = new Promise<void>((res) => {
    release = res;
  });
  await prev;
  try {
    const state = loadStore();
    const result = await fn(state);
    recomputeDerivedProductStats(state);
    saveStore(state);
    return result;
  } finally {
    release();
  }
}

function createInitialEmptyState(): DatabaseState {
  return {
    artisans: [],
    categories: CATEGORIES,
    products: [],
    reviews: [],
    blogPosts: [],
    coupons: [],
    bundles: [],
    orders: [],
    b2bApplications: [],
    b2bQuotes: [],
    claims: [...DEFAULT_CLAIMS_REGISTRY],
    config: { ...DEFAULT_ADMIN_CONFIG },
    auditLogs: [],
    heritageMistakeReports: [],
    leads: [],
    supportQueries: [],
    wishlists: {},
    userMoharBalances: {},
    notifyAlerts: [],
    newsletterSubscribers: [],
    telemetrySummary: { vitalsCount: 0, errorCount: 0 },
  };
}

let memoryState: DatabaseState | null = null;

/**
 * Recompute product realRating/realReviewCount and visible rating/reviewCount.
 * In production, mock reviews are NEVER counted, averaged, or displayed.
 */
export function recomputeDerivedProductStats(state: DatabaseState): void {
  const prod = isProductionEnv();
  const reviewsByProd = new Map<string, Review[]>();
  const realReviewsByProd = new Map<string, Review[]>();

  for (const r of state.reviews) {
    if (r.moderationStatus === 'rejected' || r.moderationStatus === 'pending') continue;
    if (!r.isMock) {
      const list = realReviewsByProd.get(r.productId) ?? [];
      list.push(r);
      realReviewsByProd.set(r.productId, list);
    }
    if (!prod || !r.isMock) {
      const list = reviewsByProd.get(r.productId) ?? [];
      list.push(r);
      reviewsByProd.set(r.productId, list);
    }
  }

  for (const p of state.products) {
    const realList = realReviewsByProd.get(p.id) ?? [];
    p.realReviewCount = realList.length;
    p.realRating =
      realList.length > 0
        ? Number((realList.reduce((sum, r) => sum + r.rating, 0) / realList.length).toFixed(1))
        : 0;

    if (prod) {
      p.reviewCount = p.realReviewCount;
      p.rating = p.realRating;
    } else {
      const visibleList = reviewsByProd.get(p.id) ?? [];
      p.reviewCount = visibleList.length;
      p.rating =
        visibleList.length > 0
          ? Number((visibleList.reduce((sum, r) => sum + r.rating, 0) / visibleList.length).toFixed(1))
          : 0;
    }
  }
}

function reconcileSeedAssets(state: DatabaseState): boolean {
  let changed = false;

  if (!state.claims || state.claims.length === 0) {
    state.claims = [...DEFAULT_CLAIMS_REGISTRY];
    changed = true;
  }
  if (!state.config) {
    state.config = { ...DEFAULT_ADMIN_CONFIG };
    changed = true;
  }
  if (!state.auditLogs) {
    state.auditLogs = [];
    changed = true;
  }
  if (!state.heritageMistakeReports) {
    state.heritageMistakeReports = [];
    changed = true;
  }
  if (!state.leads) {
    state.leads = [];
    changed = true;
  }
  if (!state.supportQueries) {
    state.supportQueries = [];
    changed = true;
  }
  if (!state.userMoharBalances) {
    state.userMoharBalances = {};
    changed = true;
  }
  if (!state.telemetrySummary) {
    state.telemetrySummary = { vitalsCount: 0, errorCount: 0 };
    changed = true;
  }

  const prevCatJson = JSON.stringify(state.categories);
  const nextCatJson = JSON.stringify(CATEGORIES);
  if (prevCatJson !== nextCatJson) {
    state.categories = CATEGORIES;
    changed = true;
  }

  const seedProducts = buildSeedProducts();
  const productById = new Map(seedProducts.map((p) => [p.id, p]));
  for (const prod of state.products) {
    if (prod.isMock) {
      const canonical = productById.get(prod.id);
      if (canonical) {
        if (JSON.stringify(prod.images) !== JSON.stringify(canonical.images)) {
          prod.images = canonical.images;
          changed = true;
        }
        if (prod.gstRate !== canonical.gstRate) {
          prod.gstRate = canonical.gstRate;
          changed = true;
        }
        if (!prod.countryOfOrigin) {
          prod.countryOfOrigin = canonical.countryOfOrigin;
          prod.manufacturerName = canonical.manufacturerName;
          prod.giClaimId = canonical.giClaimId;
          prod.isCuratedBestseller = canonical.isCuratedBestseller;
          changed = true;
        }
      }
    }
  }

  const beforeLen = state.products.length;
  if (beforeLen > 0) {
    recomputeDerivedProductStats(state);
  }
  return changed;
}

export function loadStore(): DatabaseState {
  if (memoryState) return memoryState;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      memoryState = JSON.parse(raw) as DatabaseState;
      if (!memoryState.wishlists) memoryState.wishlists = {};
      if (memoryState.products.length === 0 && !isProductionEnv()) {
        return runSeed({ reset: false }).state;
      }
      if (reconcileSeedAssets(memoryState)) {
        saveStore(memoryState);
      }
      return memoryState;
    }
  } catch {
    // Fallback cleanly
  }
  if (isProductionEnv()) {
    const empty = createInitialEmptyState();
    saveStore(empty);
    return empty;
  }
  return runSeed({ reset: false }).state;
}

export function saveStore(state: DatabaseState): void {
  memoryState = state;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmpPath, STORE_PATH);
}

export async function syncStateToFirestore(state: DatabaseState): Promise<{
  synced: boolean;
  collectionsWritten: number;
  note: string;
}> {
  const db = getFirebaseAdminDb();
  if (!db) {
    return { synced: false, collectionsWritten: 0, note: 'Firestore Admin not initialized.' };
  }
  try {
    await db.collection('config').doc('store').set({
      config: state.config,
      claims: state.claims,
      updatedAt: new Date().toISOString(),
    });

    const writeCollectionChunked = async <T extends { id?: string; code?: string }>(
      colName: string,
      rows: T[],
      keyFn: (row: T) => string
    ) => {
      const chunkSize = 350;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const batch = db.batch();
        const slice = rows.slice(i, i + chunkSize);
        for (const row of slice) {
          batch.set(db.collection(colName).doc(keyFn(row)), JSON.parse(JSON.stringify(row)));
        }
        await batch.commit();
      }
    };

    await writeCollectionChunked('products', state.products, (p) => p.id);
    await writeCollectionChunked('reviews', state.reviews, (r) => r.id);
    await writeCollectionChunked('orders', state.orders, (o) => o.id);
    await writeCollectionChunked('b2bApplications', state.b2bApplications, (a) => a.id);
    await writeCollectionChunked('quotes', state.b2bQuotes, (q) => q.id);
    await writeCollectionChunked('coupons', state.coupons, (c) => c.code);
    await writeCollectionChunked('leads', state.leads, (l) => l.id);
    await writeCollectionChunked('supportQueries', state.supportQueries, (s) => s.id);

    firestoreReachable = true;
    return { synced: true, collectionsWritten: 9, note: 'Firestore synced successfully.' };
  } catch (err) {
    return {
      synced: false,
      collectionsWritten: 0,
      note: err instanceof Error ? err.message : 'Firestore sync failed.',
    };
  }
}

export function runSeed(opts: { reset?: boolean } = {}): {
  state: DatabaseState;
  summary: {
    artisans: number;
    products: number;
    reviews: number;
    blogPosts: number;
    coupons: number;
    bundles: number;
    orders: number;
    b2bQuotes: number;
    b2bApplications: number;
    categoriesCount: Record<string, number>;
    firstFiveUrls: string[];
  };
} {
  let current: DatabaseState;
  if (opts.reset || !fs.existsSync(STORE_PATH)) {
    current = createInitialEmptyState();
  } else {
    try {
      current = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')) as DatabaseState;
      if (!current.claims) current.claims = [...DEFAULT_CLAIMS_REGISTRY];
      if (!current.config) current.config = { ...DEFAULT_ADMIN_CONFIG };
      if (!current.auditLogs) current.auditLogs = [];
      if (!current.heritageMistakeReports) current.heritageMistakeReports = [];
      if (!current.leads) current.leads = [];
      if (!current.supportQueries) current.supportQueries = [];
      if (!current.userMoharBalances) current.userMoharBalances = {};
      if (!current.telemetrySummary) current.telemetrySummary = { vitalsCount: 0, errorCount: 0 };
    } catch {
      current = createInitialEmptyState();
    }
  }

  const seedProducts = buildSeedProducts();
  const seedReviews = buildSeedReviews(seedProducts);
  const seedOrders = buildSeedOrders(seedProducts);
  const seedQuotes = buildSeedB2BQuotes();

  const upsertById = <T extends { id: string }>(existing: T[], incoming: T[]): T[] => {
    const map = new Map(existing.map((item) => [item.id, item]));
    for (const item of incoming) {
      map.set(item.id, item);
    }
    return Array.from(map.values());
  };

  current.categories = CATEGORIES;
  current.artisans = upsertById(current.artisans, ARTISANS);
  current.products = upsertById(current.products, seedProducts);
  current.reviews = upsertById(current.reviews, seedReviews);
  current.blogPosts = upsertById(current.blogPosts, BLOG_POSTS);
  current.bundles = upsertById(current.bundles, BUNDLES);
  current.orders = upsertById(current.orders, seedOrders);
  current.b2bApplications = upsertById(current.b2bApplications, SEED_B2B_APPLICATIONS);
  current.b2bQuotes = upsertById(current.b2bQuotes, seedQuotes);

  const couponMap = new Map(current.coupons.map((c) => [c.code, c]));
  for (const c of COUPONS) couponMap.set(c.code, c);
  current.coupons = Array.from(couponMap.values());

  recomputeDerivedProductStats(current);
  saveStore(current);

  const categoriesCount: Record<string, number> = {};
  for (const p of current.products) {
    categoriesCount[p.category] = (categoriesCount[p.category] ?? 0) + 1;
  }

  return {
    state: current,
    summary: {
      artisans: current.artisans.length,
      products: current.products.length,
      reviews: current.reviews.length,
      blogPosts: current.blogPosts.length,
      coupons: current.coupons.length,
      bundles: current.bundles.length,
      orders: current.orders.length,
      b2bQuotes: current.b2bQuotes.length,
      b2bApplications: current.b2bApplications.length,
      categoriesCount,
      firstFiveUrls: current.products.slice(0, 5).map((p) => `/product/${p.slug}`),
    },
  };
}

export function purgeMockData(): {
  remainingProducts: number;
  remainingReviews: number;
  remainingOrders: number;
  purged: boolean;
} {
  const current = loadStore();
  current.artisans = current.artisans.filter((x) => !x.isMock);
  current.products = current.products.filter((x) => !x.isMock);
  current.reviews = current.reviews.filter((x) => !x.isMock);
  current.blogPosts = current.blogPosts.filter((x) => !x.isMock);
  current.coupons = current.coupons.filter((x) => !x.isMock);
  current.bundles = current.bundles.filter((x) => !x.isMock);
  current.orders = current.orders.filter((x) => !x.isMock);
  current.b2bApplications = current.b2bApplications.filter((x) => !x.isMock);
  current.b2bQuotes = current.b2bQuotes.filter((x) => !x.isMock);
  current.leads = current.leads.filter((x) => !x.isMock);
  current.supportQueries = current.supportQueries.filter((x) => !x.isMock);
  recomputeDerivedProductStats(current);
  saveStore(current);
  return {
    remainingProducts: current.products.length,
    remainingReviews: current.reviews.length,
    remainingOrders: current.orders.length,
    purged: true,
  };
}

export function recordAuditLog(
  state: DatabaseState,
  entry: Omit<AuditEntry, 'id' | 'createdAt'>
): void {
  state.auditLogs.unshift({
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...entry,
    createdAt: new Date().toISOString(),
  });
  if (state.auditLogs.length > 300) {
    state.auditLogs = state.auditLogs.slice(0, 300);
  }
}

export function getPublicProducts(state: DatabaseState): Product[] {
  const prod = isProductionEnv();
  return prod ? state.products.filter((p) => !p.isMock) : state.products;
}

export function getPublicReviews(state: DatabaseState, productId?: string): Review[] {
  const prod = isProductionEnv();
  return state.reviews.filter((r) => {
    if (productId && r.productId !== productId) return false;
    if (r.moderationStatus === 'rejected' || r.moderationStatus === 'pending') return false;
    if (prod && r.isMock) return false;
    return true;
  });
}

export function getPublicBlogPosts(state: DatabaseState): BlogPost[] {
  const prod = isProductionEnv();
  return prod ? state.blogPosts.filter((b) => !b.isMock) : state.blogPosts;
}

export function getPublicArtisans(state: DatabaseState): Artisan[] {
  const prod = isProductionEnv();
  return prod ? state.artisans.filter((a) => !a.isMock) : state.artisans;
}

export function getPublicCoupons(state: DatabaseState): Coupon[] {
  const prod = isProductionEnv();
  return state.coupons.filter((c) => c.active !== false && (!prod || !c.isMock));
}

export function getPublicBundles(state: DatabaseState): Bundle[] {
  const prod = isProductionEnv();
  return prod ? state.bundles.filter((b) => !b.isMock) : state.bundles;
}
