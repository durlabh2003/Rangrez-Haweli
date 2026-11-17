import { initStore, loadStore, purgeMockData, runSeed, syncStateToFirestore } from './db.js';

const args = process.argv.slice(2);

async function main() {
  if (args.includes('--firestore')) {
    // Operate on the live Firestore data (uploads the local store on first use).
    await initStore();
  }

  if (args.includes('--verify')) {
    const store = loadStore();
    const categories: Record<string, number> = {};
    for (const p of store.products) {
      categories[p.category] = (categories[p.category] ?? 0) + 1;
    }
    console.log('Rangrez Haveli Seed Verification Report:');
    console.log({
      products: store.products.length,
      artisans: store.artisans.length,
      reviews: store.reviews.length,
      blogPosts: store.blogPosts.length,
      coupons: store.coupons.length,
      bundles: store.bundles.length,
      orders: store.orders.length,
      b2bQuotes: store.b2bQuotes.length,
      claims: store.claims.length,
      categories,
      firstFiveUrls: store.products.slice(0, 5).map((p) => `/product/${p.slug}`),
    });
    if (store.products.length < 100) {
      console.error(`ERROR: Expected >= 100 products, found ${store.products.length}`);
      process.exit(1);
    }
    process.exit(0);
  }

  if (args.includes('--purge')) {
    const result = purgeMockData();
    console.log('Mock data purged:', result);
    if (args.includes('--firestore')) {
      const sync = await syncStateToFirestore(loadStore());
      console.log('Firestore sync:', sync);
    }
    process.exit(0);
  }

  if (args.includes('--reset')) {
    if (process.env.ENV === 'production' || process.env.NODE_ENV === 'production') {
      console.error('seed:reset is blocked in production');
      process.exit(1);
    }
    const { state, summary } = runSeed({ reset: true });
    console.log('Database reset & seeded:', summary);
    if (args.includes('--firestore')) {
      const sync = await syncStateToFirestore(state);
      console.log('Firestore sync:', sync);
    }
    process.exit(0);
  }

  const { state, summary } = runSeed({ reset: false });
  console.log('Idempotent seed completed:', summary);
  if (args.includes('--firestore')) {
    const sync = await syncStateToFirestore(state);
    console.log('Firestore sync:', sync);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
