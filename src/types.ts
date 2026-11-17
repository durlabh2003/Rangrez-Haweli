export type CategorySlug =
  | 'textiles-apparel'
  | 'home-furnishing'
  | 'jewellery'
  | 'footwear-leather'
  | 'art-decor'
  | 'gifting-festive';

export type GstRate = 0 | 3 | 5 | 18 | 40;

export interface CategoryInfo {
  slug: CategorySlug;
  name: string;
  nameHi: string;
  tagline: string;
  heroImage: string;
  productCount?: number;
}

export interface Artisan {
  id: string;
  name: string;
  village: string;
  district: string;
  craft: string;
  yearsExperience: number;
  story: string;
  coOperative: string;
  avatarColor: string;
  image?: string;
  isMock: boolean;
}

export interface ProductVariant {
  id: string;
  label: string;
  color: string;
  colorHex: string;
  stock: number;
  skuSuffix: string;
}

export interface B2BTier {
  minQty: number;
  discountPercent: number;
  unitPriceInr: number;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category: CategorySlug;
  subCategory: string;
  shortDescription: string;
  longDescription: string;
  craftType: string;
  region: string;
  material: string;
  careInstructions: string;
  occasions: string[];
  colors: string[];
  mrp: number;
  price: number;
  gstRate: GstRate;
  hsnCode: string;
  weightGrams: number;
  dimensions: string;
  variants: ProductVariant[];
  b2bTiers: B2BTier[];
  moq: number;
  casePack: number;
  leadTimeDays: number;
  customisable: boolean;
  artisanId: string;
  hoursOfWork: number;
  giTagged: boolean;
  giClaimId?: string;
  countryOfOrigin?: string;
  manufacturerName?: string;
  images: string[];
  isBestseller: boolean;
  isCuratedBestseller?: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  isFestive: boolean;
  isGiftable: boolean;
  rating: number;
  reviewCount: number;
  realRating?: number;
  realReviewCount?: number;
  costBreakdown: {
    artisanShare: number;
    materials: number;
    logistics: number;
    brand: number;
  };
  isMock: boolean;
}

export type ReviewModerationStatus = 'approved' | 'pending' | 'rejected';

export interface Review {
  id: string;
  productId: string;
  userId?: string;
  orderId?: string;
  author: string;
  city: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  moderationStatus?: ReviewModerationStatus;
  createdAt: string;
  isMock: boolean;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  titleHi: string;
  category: 'Craft Stories' | 'Style Guides' | 'Home Inspiration' | 'Artisan Diaries' | 'Festivals' | 'Care Guides';
  excerpt: string;
  readingTimeMin: number;
  author: string;
  publishedAt: string;
  coverImage: string;
  sections: { heading: string; body: string }[];
  relatedSlugs: string[];
  isMock: boolean;
}

export interface Coupon {
  code: string;
  description: string;
  discountType: 'percent' | 'flat';
  value: number;
  minOrderInr: number;
  isB2BOnly: boolean;
  active?: boolean;
  isMock: boolean;
}

export interface Bundle {
  id: string;
  title: string;
  subtitle: string;
  productSlugs: string[];
  discountPercent: number;
  isMock: boolean;
}

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  variantId?: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  gstRate: GstRate;
  hsnCode: string;
  taxableValue?: number;
  gstAmount?: number;
  image: string;
}

export interface GstInvoiceBreakup {
  invoiceNumber: string;
  sellerName: string;
  sellerGstin: string;
  sellerState: string;
  buyerState: string;
  isIntraState: boolean;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGst: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  idempotencyKey?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  gstin?: string;
  paymentMethod: 'UPI' | 'Card' | 'Netbanking' | 'COD' | 'NEFT' | 'Net-30';
  paymentStatus: 'Paid' | 'Pending Payment' | 'Failed' | 'Pending COD Verification' | 'Net-30 Invoiced';
  paymentOrderId?: string;
  paymentId?: string;
  orderStatus: 'Confirmed' | 'Artisan Packed' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  prepaidDiscount?: number;
  codFee?: number;
  couponCode?: string;
  moharRedeemed: number;
  moharEarned?: number;
  giftWrap: boolean;
  giftMessage?: string;
  shippingFee: number;
  gstAmount: number;
  invoice?: GstInvoiceBreakup;
  total: number;
  channel: 'D2C' | 'B2B';
  createdAt: string;
  updatedAt?: string;
  isMock: boolean;
}

export interface B2BApplication {
  id: string;
  userId?: string;
  businessName: string;
  businessType: 'Retail Boutique' | 'Interior Designer' | 'Hotel / Resort' | 'Corporate Gifting' | 'Export Importer';
  gstin: string;
  iecCode?: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  expectedMonthlyVolume: string;
  status: 'Pending Review' | 'Approved' | 'Rejected';
  creditLimitInr: number;
  createdAt: string;
  isMock: boolean;
}

export interface B2BQuote {
  id: string;
  quoteNumber: string;
  companyName: string;
  contactEmail: string;
  category: string;
  quantity: number;
  customBranding: boolean;
  packagingType: string;
  targetBudgetInr: number;
  notes: string;
  status: 'Draft' | 'Quoted' | 'Approved' | 'Converted';
  quotedTotalInr: number;
  createdAt: string;
  isMock: boolean;
}

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface ClaimRecord {
  id: string;
  claimType: 'gi_tag' | 'guild_count' | 'artisan_share' | 'shipping_coverage' | 'testimonial';
  subject: string;
  statement: string;
  fallbackText: string;
  sourceName: string;
  sourceUrl?: string;
  registryReference?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface AdminConfig {
  prepaidIncentiveInr: number;
  freeShippingThresholdInr: number;
  standardShippingFeeInr: number;
  giftWrapFeeInr: number;
  codEnabled: boolean;
  codMaxOrderInr: number;
  codFeeInr: number;
  codBlockedPincodes: string[];
  moharMaxRedeemPct: number;
  moharEarnRatePct: number;
  allowCouponStackWithMohar: boolean;
  lowStockUrgencyEnabled: boolean;
  defaultReturnWindowDays: number;
}

export interface ConsentPreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
  version: string;
}

export interface AuditEntry {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface HeritageMistakeReport {
  id: string;
  query: string;
  answerExcerpt: string;
  note: string;
  reporterEmail?: string;
  createdAt: string;
}

export type LeadIntentType =
  | 'product_click'
  | 'add_to_cart'
  | 'wishlist_like'
  | 'buy_now'
  | 'checkout_start'
  | 'stock_alert'
  | 'b2b_application'
  | 'b2b_quote'
  | 'contact_query';

export type LeadStage =
  | 'New Lead'
  | 'Contacted'
  | 'Qualified'
  | 'Proposal Sent'
  | 'Converted'
  | 'Lost';

export type LeadPriority = 'Low' | 'Medium' | 'High';

export interface LeadActivity {
  id: string;
  type: 'signal' | 'note' | 'stage_change' | 'email';
  intent?: LeadIntentType;
  productId?: string;
  productName?: string;
  summary: string;
  actor?: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  city?: string;
  gstin?: string;
  channel: 'D2C' | 'B2B';
  stage: LeadStage;
  priority: LeadPriority;
  leadScore: number;
  estimatedValueInr: number;
  lastIntent: LeadIntentType;
  sourcePath: string;
  assignedTo?: string;
  nextFollowUpAt?: string;
  lossReason?: string;
  interestedProducts: {
    productId: string;
    slug?: string;
    name: string;
    category?: string;
    priceInr?: number;
    intent: LeadIntentType;
    touchedAt: string;
  }[];
  activities: LeadActivity[];
  createdAt: string;
  updatedAt: string;
  isMock: boolean;
}

export interface SupportQuery {
  id: string;
  ticketNumber: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  category: 'Order & Shipping' | 'Product Care' | 'B2B Inquiry' | 'Return / Damage' | 'Grievance (DPDP)';
  orderNumber?: string;
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
  isMock: boolean;
}

