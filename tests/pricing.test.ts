import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_GST_RATES,
  computeServerOrderCalculation,
  getHsnGstRate,
  validateGstinChecksum,
} from '../src/server/pricing';
import { DEFAULT_ADMIN_CONFIG } from '../src/config/heritageConstants';
import type { Coupon, Product } from '../src/types';

function makeSampleProduct(overrides: Partial<Product>): Product {
  return {
    id: 'test-prod-1',
    sku: 'RH-TST-01',
    slug: 'test-kurta',
    name: 'Test Handloom Kurta',
    category: 'textiles-apparel',
    subCategory: 'Kurtas',
    shortDescription: 'Handcrafted cotton kurta.',
    longDescription: 'Handcrafted cotton kurta.',
    craftType: 'Sanganeri Block Print',
    region: 'Jaipur',
    material: 'Cotton',
    careInstructions: 'Cold wash',
    occasions: ['Festive'],
    colors: ['Indigo'],
    mrp: 2800,
    price: 1800,
    gstRate: 5,
    hsnCode: '6204',
    weightGrams: 300,
    dimensions: 'M',
    variants: [{ id: 'v1', label: 'M', color: 'Indigo', colorHex: '#1F3A93', stock: 10, skuSuffix: 'M' }],
    b2bTiers: [{ minQty: 10, discountPercent: 12, unitPriceInr: 1584 }],
    moq: 10,
    casePack: 10,
    leadTimeDays: 7,
    customisable: false,
    artisanId: 'art-01',
    hoursOfWork: 8,
    giTagged: false,
    images: ['/api/craft-art/test-kurta/1.svg'],
    isBestseller: false,
    isNewArrival: false,
    isFeatured: false,
    isFestive: false,
    isGiftable: false,
    rating: 0,
    reviewCount: 0,
    costBreakdown: { artisanShare: 52, materials: 22, logistics: 14, brand: 12 },
    isMock: false,
    ...overrides,
  };
}

test('HSN GST slab rules eliminate 12% and enforce Post-Sept-2025 slabs (0, 3, 5, 18, 40)', () => {
  const apparelLow = makeSampleProduct({ category: 'textiles-apparel', hsnCode: '6204', price: 2400 });
  const apparelHigh = makeSampleProduct({ category: 'textiles-apparel', hsnCode: '6204', price: 3200 });
  const jewellery = makeSampleProduct({ category: 'jewellery', hsnCode: '7117', price: 4200 });
  const pottery = makeSampleProduct({ category: 'art-decor', hsnCode: '6913', price: 3900 });

  const rates = [
    getHsnGstRate(apparelLow),
    getHsnGstRate(apparelHigh),
    getHsnGstRate(jewellery),
    getHsnGstRate(pottery),
  ];

  assert.equal(rates[0], 5, 'Apparel <= 2500 must be 5%');
  assert.equal(rates[1], 18, 'Apparel > 2500 must be 18%');
  assert.equal(rates[2], 3, 'Jewellery (HSN 71xx) must be 3%');
  assert.equal(rates[3], 5, 'Handicraft pottery must be 5%');
  for (const r of rates) {
    assert.ok(ALLOWED_GST_RATES.includes(r));
    assert.notEqual(r as number, 12, '12% GST slab must never be returned');
  }
});

test('GSTIN Mod-36 checksum validator accepts valid GSTIN and rejects tampered check digit', () => {
  assert.equal(validateGstinChecksum('08AABCR1234F1ZS').valid, true);
  const tampered = validateGstinChecksum('08AABCR1234F1Z9');
  assert.equal(tampered.valid, false);
  assert.match(tampered.reason || '', /checksum/i);
  assert.equal(validateGstinChecksum('INVALID').valid, false);
});

test('Server pricing computes prepaid incentive, intra-state CGST+SGST, inter-state IGST, and rejects coupon stacking', () => {
  const prod = makeSampleProduct({ price: 2200, hsnCode: '6204' });

  const intra = computeServerOrderCalculation({
    items: [{ product: prod, quantity: 1 }],
    shippingState: 'Rajasthan',
    pincode: '302006',
    paymentMethod: 'UPI',
    coupon: null,
    isApprovedB2B: false,
    requestedMoharCoins: 0,
    userMoharBalance: 0,
    giftWrap: false,
    channel: 'D2C',
    config: DEFAULT_ADMIN_CONFIG,
  });

  assert.equal(intra.subtotal, 2200);
  assert.equal(intra.prepaidDiscount, DEFAULT_ADMIN_CONFIG.prepaidIncentiveInr);
  assert.equal(intra.shippingFee, 0);
  assert.equal(intra.total, 2150);
  assert.equal(intra.invoice.isIntraState, true);
  assert.ok(intra.invoice.cgstAmount > 0 && intra.invoice.sgstAmount > 0);
  assert.equal(intra.invoice.igstAmount, 0);

  const inter = computeServerOrderCalculation({
    items: [{ product: prod, quantity: 1 }],
    shippingState: 'Maharashtra',
    pincode: '400001',
    paymentMethod: 'COD',
    coupon: null,
    isApprovedB2B: false,
    requestedMoharCoins: 0,
    userMoharBalance: 0,
    giftWrap: true,
    channel: 'D2C',
    config: DEFAULT_ADMIN_CONFIG,
  });

  assert.equal(inter.codFee, DEFAULT_ADMIN_CONFIG.codFeeInr);
  assert.equal(inter.giftWrapFee, DEFAULT_ADMIN_CONFIG.giftWrapFeeInr);
  assert.equal(inter.invoice.isIntraState, false);
  assert.equal(inter.invoice.cgstAmount, 0);
  assert.ok(inter.invoice.igstAmount > 0);

  const coupon: Coupon = {
    code: 'PADHARO10',
    description: '10% off',
    discountType: 'percent',
    value: 10,
    minOrderInr: 1000,
    isB2BOnly: false,
    active: true,
    isMock: false,
  };

  assert.throws(() => {
    computeServerOrderCalculation({
      items: [{ product: prod, quantity: 1 }],
      shippingState: 'Rajasthan',
      pincode: '302006',
      paymentMethod: 'UPI',
      coupon,
      isApprovedB2B: false,
      requestedMoharCoins: 100,
      userMoharBalance: 500,
      giftWrap: false,
      channel: 'D2C',
      config: DEFAULT_ADMIN_CONFIG,
    });
  }, /combined with a promotional coupon/i);
});
