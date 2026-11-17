import type {
  AdminConfig,
  Coupon,
  GstInvoiceBreakup,
  GstRate,
  OrderItem,
  Product,
} from '../types.js';
import { DEFAULT_ADMIN_CONFIG } from '../config/heritageConstants.js';

export const ALLOWED_GST_RATES: readonly GstRate[] = [0, 3, 5, 18, 40] as const;

export const SELLER_HOME_STATE = 'Rajasthan';

/**
 * HSN-driven GST calculation aligned with India GST Council rationalisation
 * (effective 22 Sept 2025 — 12% slab abolished; allowed slabs: 0, 3, 5, 18, 40).
 */
export function getHsnGstRate(
  product: Pick<Product, 'hsnCode' | 'category' | 'craftType' | 'price'>,
  unitPriceInr?: number
): GstRate {
  const price = typeof unitPriceInr === 'number' ? unitPriceInr : product.price;
  const hsn = (product.hsnCode || '').trim();

  // Jewellery & precious metal / Thewa / Meenakari imitation or gold-fused (HSN 7113, 7117)
  if (product.category === 'jewellery' || hsn.startsWith('71')) {
    return 3;
  }

  // Apparel & made-ups (HSN 61xx, 62xx, 63xx): 5% up to ₹2,500 per piece; 18% above ₹2,500
  if (
    hsn.startsWith('61') ||
    hsn.startsWith('62') ||
    hsn.startsWith('63') ||
    product.category === 'textiles-apparel' ||
    product.category === 'home-furnishing'
  ) {
    return price > 2500 ? 18 : 5;
  }

  // Leather goods / Footwear (HSN 6403 / 4202): generally 5% under craft threshold or 18% luxury footwear > 2500
  if (product.category === 'footwear-leather' || hsn.startsWith('64') || hsn.startsWith('42')) {
    return price > 2500 ? 18 : 5;
  }

  // Handicrafts, Blue Pottery, Woodwork, Festive crafts (HSN 6913, 4420, 9505, 8306)
  return 5;
}

/**
 * Mod-36 GSTIN check digit validation (Official GSTN specification)
 */
const GSTIN_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function validateGstinChecksum(rawGstin: string): { valid: boolean; reason?: string } {
  const gstin = rawGstin.trim().toUpperCase();
  const formatRe = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!formatRe.test(gstin)) {
    return { valid: false, reason: 'GSTIN must be 15 characters matching 2-digit state code + PAN + Z + checksum.' };
  }
  const stateCode = Number(gstin.slice(0, 2));
  if (stateCode < 1 || stateCode > 38) {
    return { valid: false, reason: 'Invalid GSTIN state code (must be 01–38).' };
  }

  let factor = 1;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const codePoint = GSTIN_CHARS.indexOf(gstin[i]);
    if (codePoint === -1) {
      return { valid: false, reason: 'Invalid character in GSTIN.' };
    }
    let product = factor * codePoint;
    factor = factor === 2 ? 1 : 2;
    product = Math.floor(product / 36) + (product % 36);
    sum += product;
  }
  const remainder = sum % 36;
  const checkCodePoint = (36 - remainder) % 36;
  const expectedChar = GSTIN_CHARS[checkCodePoint];
  if (gstin[14] !== expectedChar) {
    return { valid: false, reason: `GSTIN checksum mismatch (expected '${expectedChar}' at position 15).` };
  }
  return { valid: true };
}

export interface ServerOrderCalculationInput {
  items: { product: Product; variantId?: string; variantLabel?: string; quantity: number }[];
  shippingState: string;
  pincode: string;
  paymentMethod: 'UPI' | 'Card' | 'Netbanking' | 'COD' | 'NEFT' | 'Net-30';
  coupon?: Coupon | null;
  isApprovedB2B: boolean;
  requestedMoharCoins: number;
  userMoharBalance: number;
  giftWrap: boolean;
  channel: 'D2C' | 'B2B';
  config?: AdminConfig;
  sellerInfo?: {
    legalName: string;
    gstin: string;
    state?: string;
  };
  invoiceNumber?: string;
}

export interface ServerOrderCalculationResult {
  lineItems: OrderItem[];
  subtotal: number;
  couponDiscount: number;
  prepaidDiscount: number;
  moharRedeemed: number;
  moharEarned: number;
  discount: number;
  giftWrapFee: number;
  codFee: number;
  shippingFee: number;
  gstAmount: number;
  total: number;
  invoice: GstInvoiceBreakup;
}

export function computeServerOrderCalculation(
  input: ServerOrderCalculationInput
): ServerOrderCalculationResult {
  const cfg = input.config ?? DEFAULT_ADMIN_CONFIG;
  const isB2B = input.channel === 'B2B';

  if (input.items.length === 0) {
    throw new Error('Order must include at least one valid product line.');
  }

  let rawSubtotal = 0;
  const computedLines: (OrderItem & { lineGross: number })[] = [];

  for (const row of input.items) {
    const qty = Math.max(1, Math.trunc(row.quantity));
    let unitPrice = row.product.price;

    if (isB2B && input.isApprovedB2B && Array.isArray(row.product.b2bTiers)) {
      for (const tier of row.product.b2bTiers) {
        if (qty >= tier.minQty) {
          unitPrice = tier.unitPriceInr;
        }
      }
    }

    const gstRate = getHsnGstRate(row.product, unitPrice);
    const lineGross = unitPrice * qty;
    rawSubtotal += lineGross;

    computedLines.push({
      productId: row.product.id,
      sku: row.product.sku,
      name: row.product.name,
      variantId: row.variantId,
      variantLabel: row.variantLabel || row.product.variants[0]?.label || 'Standard',
      quantity: qty,
      unitPrice,
      gstRate,
      hsnCode: row.product.hsnCode,
      image: row.product.images[0] || '',
      lineGross,
    });
  }

  // Validate and apply coupon
  let couponDiscount = 0;
  if (input.coupon && input.coupon.active !== false) {
    if (input.coupon.isB2BOnly && (!isB2B || !input.isApprovedB2B)) {
      throw new Error(`Coupon ${input.coupon.code} is restricted to approved B2B trade accounts.`);
    }
    if (rawSubtotal < input.coupon.minOrderInr) {
      throw new Error(
        `Coupon ${input.coupon.code} requires a minimum order of ₹${input.coupon.minOrderInr}.`
      );
    }
    couponDiscount =
      input.coupon.discountType === 'percent'
        ? Math.round((rawSubtotal * input.coupon.value) / 100)
        : Math.min(rawSubtotal, input.coupon.value);
  }

  // Prepaid incentive (UPI / Card / Netbanking) shown transparently inline
  const isPrepaidD2C =
    !isB2B &&
    (input.paymentMethod === 'UPI' ||
      input.paymentMethod === 'Card' ||
      input.paymentMethod === 'Netbanking');
  const prepaidDiscount =
    isPrepaidD2C && rawSubtotal >= 499 ? Math.min(cfg.prepaidIncentiveInr, rawSubtotal - couponDiscount) : 0;

  // Mohar loyalty coins cap & stacking rule
  let moharRedeemed = 0;
  if (input.requestedMoharCoins > 0) {
    if (couponDiscount > 0 && !cfg.allowCouponStackWithMohar) {
      throw new Error('Mohar coin redemption cannot be combined with a promotional coupon code.');
    }
    const maxCapByPct = Math.round((rawSubtotal * cfg.moharMaxRedeemPct) / 100);
    const maxAvailableAfterDiscount = Math.max(0, rawSubtotal - couponDiscount - prepaidDiscount);
    moharRedeemed = Math.max(
      0,
      Math.min(
        Math.trunc(input.requestedMoharCoins),
        Math.trunc(input.userMoharBalance),
        maxCapByPct,
        maxAvailableAfterDiscount
      )
    );
  }

  const totalDiscounts = couponDiscount + prepaidDiscount + moharRedeemed;
  const discountedGoodsTotal = Math.max(0, rawSubtotal - totalDiscounts);

  // Delivery / COD rules
  const shippingFee =
    isB2B || discountedGoodsTotal >= cfg.freeShippingThresholdInr ? 0 : cfg.standardShippingFeeInr;
  const giftWrapFee = input.giftWrap ? cfg.giftWrapFeeInr : 0;

  let codFee = 0;
  if (input.paymentMethod === 'COD') {
    if (!cfg.codEnabled) {
      throw new Error('Cash on Delivery is currently disabled by store configuration.');
    }
    if (discountedGoodsTotal > cfg.codMaxOrderInr) {
      throw new Error(
        `Cash on Delivery is available up to ₹${cfg.codMaxOrderInr.toLocaleString('en-IN')}. Choose UPI or Card.`
      );
    }
    if (cfg.codBlockedPincodes.includes(input.pincode.trim())) {
      throw new Error(`Cash on Delivery is not available for pincode ${input.pincode}. Please use UPI or Card.`);
    }
    codFee = cfg.codFeeInr;
  }

  // Prices are GST-inclusive: back-calculate taxable value and GST component proportionally
  const discountRatio = rawSubtotal > 0 ? discountedGoodsTotal / rawSubtotal : 1;
  let totalTaxable = 0;
  let totalGst = 0;

  const lineItems: OrderItem[] = computedLines.map((line) => {
    const netInclusive = line.lineGross * discountRatio;
    const taxable = netInclusive / (1 + line.gstRate / 100);
    const gst = netInclusive - taxable;
    totalTaxable += taxable;
    totalGst += gst;
    return {
      productId: line.productId,
      sku: line.sku,
      name: line.name,
      variantId: line.variantId,
      variantLabel: line.variantLabel,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      gstRate: line.gstRate,
      hsnCode: line.hsnCode,
      taxableValue: Math.round(taxable * 100) / 100,
      gstAmount: Math.round(gst * 100) / 100,
      image: line.image,
    };
  });

  const roundedGst = Math.round(totalGst);
  const sellerState = input.sellerInfo?.state || SELLER_HOME_STATE;
  const isIntraState =
    input.shippingState.trim().toLowerCase() === sellerState.trim().toLowerCase();

  const cgstAmount = isIntraState ? Math.round((roundedGst / 2) * 100) / 100 : 0;
  const sgstAmount = isIntraState ? Math.round((roundedGst - cgstAmount) * 100) / 100 : 0;
  const igstAmount = isIntraState ? 0 : roundedGst;

  const grandTotal = Math.max(0, Math.round(discountedGoodsTotal + shippingFee + giftWrapFee + codFee));
  const moharEarned = isB2B ? 0 : Math.round((grandTotal * cfg.moharEarnRatePct) / 100);

  return {
    lineItems,
    subtotal: rawSubtotal,
    couponDiscount,
    prepaidDiscount,
    moharRedeemed,
    moharEarned,
    discount: totalDiscounts,
    giftWrapFee,
    codFee,
    shippingFee,
    gstAmount: roundedGst,
    total: grandTotal,
    invoice: {
      invoiceNumber: input.invoiceNumber || `INV-RH-${Date.now().toString().slice(-6)}`,
      sellerName: input.sellerInfo?.legalName || 'LEGAL_ENTITY_NAME',
      sellerGstin: input.sellerInfo?.gstin || 'LEGAL_GSTIN',
      sellerState,
      buyerState: input.shippingState || sellerState,
      isIntraState,
      taxableValue: Math.round(totalTaxable),
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalGst: roundedGst,
    },
  };
}
