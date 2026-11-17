import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';

const STORE_PATH = path.resolve(process.cwd(), '.data', 'store.json');

async function waitForServer(baseUrl: string, timeoutMs = 20000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${baseUrl}/api/config`);
      if (r.ok) return;
    } catch {
      // Retry
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timed out waiting for test server at ${baseUrl}`);
}

function spawnServer(port: number, extraEnv: Record<string, string> = {}): ChildProcess {
  const tsxBin = path.resolve(process.cwd(), 'node_modules', '.bin', 'tsx');
  return spawn(tsxBin, ['server.ts'], {
    env: {
      ...process.env,
      PORT: String(port),
      ...extraEnv,
    },
    stdio: 'pipe',
  });
}

async function stopServer(proc: ChildProcess | null) {
  if (!proc) return;
  proc.kill('SIGTERM');
  await new Promise<void>((resolve) => {
    const t = setTimeout(() => {
      proc.kill('SIGKILL');
      resolve();
    }, 3000);
    proc.once('exit', () => {
      clearTimeout(t);
      resolve();
    });
  });
}

async function runAcceptance() {
  const hadStore = fs.existsSync(STORE_PATH);
  const storeBackup = hadStore ? fs.readFileSync(STORE_PATH, 'utf-8') : null;
  let devProc: ChildProcess | null = null;
  let prodProc: ChildProcess | null = null;
  const results: string[] = [];

  try {
    // ------------------------------------------------------------------
    // 1. DEV / NON-PRODUCTION CHECKS (Port 3199)
    // ------------------------------------------------------------------
    const devUrl = 'http://127.0.0.1:3199';
    devProc = spawnServer(3199, { NODE_ENV: 'development', ENV: 'development' });
    await waitForServer(devUrl);

    // Fetch public products & blog slugs
    const prodList = (await fetch(`${devUrl}/api/products`).then((r) => r.json())) as {
      products: { id: string; slug: string; b2bTiers: unknown[]; variants: { id: string; stock: number }[] }[];
    };
    assert.ok(prodList.products.length > 0, 'Seeded products must exist in non-production');
    const sampleProd = prodList.products[0];
    assert.deepEqual(
      sampleProd.b2bTiers,
      [],
      'Unauthenticated/unapproved callers must never receive B2B b2bTiers pricing'
    );

    // Phase 1 SSR SEO, Canonical, JSON-LD & 404 Checks
    const homeHtml = await fetch(`${devUrl}/`).then((r) => r.text());
    assert.match(homeHtml, /<title>Rangrez Haveli/i);
    assert.match(homeHtml, /<link rel="canonical"/i);
    assert.match(homeHtml, /rel="preload"[\s\S]*as="image"[\s\S]*fetchpriority="high"/i);
    results.push('PASS Phase 1/2: Home SSR shell has title, canonical & fetchpriority=high poster preload');

    const prodResp = await fetch(`${devUrl}/product/${sampleProd.slug}`);
    assert.equal(prodResp.status, 200);
    const prodHtml = await prodResp.text();
    assert.match(prodHtml, /"@type":"Product"/);
    assert.doesNotMatch(
      prodHtml,
      /"@type":"AggregateRating"/,
      'Product JSON-LD must NOT emit AggregateRating from mock reviews'
    );
    results.push('PASS Phase 1: Product SSR omits AggregateRating when 0 real reviews exist');

    const unknownResp = await fetch(`${devUrl}/product/nonexistent-sku-slug-404`);
    assert.equal(unknownResp.status, 404, 'Unknown product slug must return HTTP 404');

    const removedStudioResp = await fetch(`${devUrl}/studio-3d`);
    assert.equal(removedStudioResp.status, 404, 'Removed /studio-3d route must return HTTP 404');

    const removedCraftsResp = await fetch(`${devUrl}/crafts`);
    assert.equal(removedCraftsResp.status, 404, 'Removed /crafts route must return HTTP 404');

    const adminHtml = await fetch(`${devUrl}/admin`).then((r) => r.text());
    assert.match(adminHtml, /content="noindex/i, '/admin shell must emit noindex');

    const filteredComboHtml = await fetch(`${devUrl}/shop?craft=Sanganeri&color=Blue`).then((r) => r.text());
    assert.match(filteredComboHtml, /content="noindex/i, 'Duplicate/multi filter combo must emit noindex');

    const robotsTxt = await fetch(`${devUrl}/robots.txt`).then((r) => r.text());
    assert.match(robotsTxt, /Disallow: \/admin/);
    assert.match(robotsTxt, /Disallow: \/checkout/);

    const devSitemap = await fetch(`${devUrl}/sitemap.xml`).then((r) => r.text());
    assert.match(devSitemap, /<urlset/);
    assert.match(devSitemap, /\/b2b/);
    assert.doesNotMatch(devSitemap, /\/studio-3d/, 'Sitemap must not include removed /studio-3d route');
    assert.doesNotMatch(devSitemap, /\/crafts/, 'Sitemap must not include removed /crafts route');
    results.push('PASS Phase 1: 404 status, noindex rules, robots.txt, and sitemap.xml validated');

    // Phase 3 Security, CRM Lead Gate & Strict B2B Approval Checks
    const unauthedAdmin = await fetch(`${devUrl}/api/admin/overview`);
    assert.equal(unauthedAdmin.status, 401, 'Admin overview must reject unauthenticated calls with 401');

    const unauthedLead = await fetch(`${devUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent: 'product_click', productId: sampleProd.id }),
    });
    assert.equal(unauthedLead.status, 401, 'CRM lead capture must require Firebase authentication');

    const unapprovedQuote = await fetch(`${devUrl}/api/b2b/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Test Co',
        contactEmail: 'test@example.com',
        category: 'Gifting',
        quantity: 25,
        customBranding: false,
        packagingType: 'Standard',
        targetBudgetInr: 25000,
      }),
    });
    assert.ok(
      [401, 403].includes(unapprovedQuote.status),
      'B2B quotes must reject unauthenticated/unapproved callers'
    );

    const unapprovedB2BOrder = await fetch(`${devUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotencyKey: `b2b-unapproved-${Date.now()}`,
        customerName: 'Unapproved Buyer',
        customerEmail: 'buyer@example.com',
        customerPhone: '+919829055412',
        shippingAddress: {
          line1: '12 Johari Bazaar',
          city: 'Jaipur',
          state: 'Rajasthan',
          pincode: '302003',
          country: 'India',
        },
        shippingState: 'Rajasthan',
        pincode: '302003',
        paymentMethod: 'Net-30',
        dpdpConsentAccepted: true,
        channel: 'B2B',
        items: [{ productId: sampleProd.id, variantId: sampleProd.variants[0].id, quantity: 10 }],
      }),
    });
    assert.equal(unapprovedB2BOrder.status, 403, 'B2B orders must reject unapproved buyers with 403');

    const qryResp = await fetch(`${devUrl}/api/queries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Patron Test',
        email: 'patron@example.com',
        category: 'Product Care',
        subject: 'Indigo wash test',
        message: 'Checking cold wash instructions for Sanganeri cotton kurta.',
      }),
    });
    assert.equal(qryResp.status, 201, 'Support query submission must return 201');
    const qryJson = (await qryResp.json()) as { query: { ticketNumber: string } };
    assert.match(qryJson.query.ticketNumber, /^TKT-26-/);
    results.push('PASS CRM/B2B Gates: b2bTiers stripped, 401/403 enforced, support query ticket created');

    // Verify server ignores client-sent forged total & applies authoritative pricing + idempotency
    const idemKey = `test-idem-${Date.now()}`;
    const orderPayload = {
      idempotencyKey: idemKey,
      customerName: 'Test Buyer',
      customerEmail: 'buyer@example.com',
      customerPhone: '+919829055412',
      shippingAddress: {
        line1: '12 Johari Bazaar',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302003',
        country: 'India',
      },
      shippingState: 'Rajasthan',
      pincode: '302003',
      paymentMethod: 'UPI',
      giftWrap: false,
      dpdpConsentAccepted: true,
      channel: 'D2C',
      // Attempt client-side total tampering:
      total: 1,
      subtotal: 1,
      items: [{ productId: sampleProd.id, variantId: sampleProd.variants[0].id, quantity: 1 }],
    };

    const ord1Resp = await fetch(`${devUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    assert.equal(ord1Resp.status, 201);
    const ord1 = (await ord1Resp.json()) as { id: string; total: number; prepaidDiscount: number };
    assert.ok(ord1.total > 100, 'Server must ignore client-forged total=1 and compute authoritative price');
    assert.equal(ord1.prepaidDiscount, 50, 'Server applies prepaid incentive automatically');

    // Repeating same idempotencyKey returns existing order cleanly (200)
    const ordDupResp = await fetch(`${devUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    assert.equal(ordDupResp.status, 200);
    const ordDup = (await ordDupResp.json()) as { id: string };
    assert.equal(ordDup.id, ord1.id, 'Idempotent retry must return exact same order ID');

    // Concurrent race exceeding variant stock -> only allowed order succeeds, excess gets 409 Conflict
    const targetProd =
      prodList.products.find(
        (p) => p.id !== sampleProd.id && p.variants[0].stock >= 2 && p.variants[0].stock <= 20
      ) ||
      prodList.products.find((p) => p.id !== sampleProd.id && p.variants[0].stock >= 1) ||
      sampleProd;
    const freshTarget = (await fetch(`${devUrl}/api/products/${targetProd.slug}`).then((r) =>
      r.json()
    )) as { product: { variants: { id: string; stock: number }[] } };
    const avail = freshTarget.product.variants[0].stock;
    const [raceA, raceB] = await Promise.all([
      fetch(`${devUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderPayload,
          idempotencyKey: `race-a-${Date.now()}`,
          items: [{ productId: targetProd.id, variantId: targetProd.variants[0].id, quantity: avail }],
        }),
      }),
      fetch(`${devUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderPayload,
          idempotencyKey: `race-b-${Date.now()}`,
          items: [{ productId: targetProd.id, variantId: targetProd.variants[0].id, quantity: avail }],
        }),
      }),
    ]);
    const statuses = [raceA.status, raceB.status].sort();
    assert.deepEqual(statuses, [201, 409], 'Concurrent full-stock claims must serialize cleanly (one 201, one 409)');
    results.push('PASS Phase 3: Admin 401 guard, server-authoritative pricing, idempotency, and stock race lock');

    // Phase 5 DPDP Consent Enforcement
    const badNewsletter = await fetch(`${devUrl}/api/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', consentAccepted: false }),
    });
    assert.equal(badNewsletter.status, 400, 'Newsletter must reject consentAccepted: false');

    const badOrderConsent = await fetch(`${devUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...orderPayload, idempotencyKey: `no-cons-${Date.now()}`, dpdpConsentAccepted: false }),
    });
    assert.equal(badOrderConsent.status, 400, 'Order creation must require dpdpConsentAccepted: true');
    results.push('PASS Phase 5: Explicit DPDP consent enforced on newsletter & orders');

    await stopServer(devProc);
    devProc = null;

    // ------------------------------------------------------------------
    // 2. PRODUCTION MOCK-ISOLATION CHECKS (Port 3200 with ENV=production)
    // ------------------------------------------------------------------
    const prodUrl = 'http://127.0.0.1:3200';
    prodProc = spawnServer(3200, { NODE_ENV: 'development', ENV: 'production' });
    await waitForServer(prodUrl);

    const prodApiRes = (await fetch(`${prodUrl}/api/products`).then((r) => r.json())) as {
      total: number;
      products: { isMock: boolean }[];
    };
    assert.equal(
      prodApiRes.products.some((p) => p.isMock),
      false,
      'ENV=production must never return isMock=true products'
    );

    const prodSitemap = await fetch(`${prodUrl}/sitemap.xml`).then((r) => r.text());
    assert.doesNotMatch(
      prodSitemap,
      /\/product\/sanganeri-floral-indigo-handblock-kurta/,
      'Production sitemap must exclude mock products'
    );
    results.push('PASS Mock Isolation: ENV=production excludes mock products from API & sitemap.xml');

    for (const line of results) console.log(line);
  } finally {
    await stopServer(devProc);
    await stopServer(prodProc);
    if (hadStore && storeBackup !== null) {
      fs.writeFileSync(STORE_PATH, storeBackup, 'utf-8');
    }
  }
}

runAcceptance().catch((err) => {
  console.error('ACCEPTANCE FAILURE:', err);
  process.exit(1);
});
