-- =============================================================================
-- RANGREZ HAVELI — Complete PostgreSQL Database Setup & Bootstrap Script
-- File: /DB_setup.sql
-- Dialect: PostgreSQL 15+
-- Notes:
--   * Zero 3D Studio tables (feature removed cleanly).
--   * GST slabs strictly enforce India Sept 22, 2025 rates: (0, 3, 5, 18, 40).
--   * Supports D2C Patron Login-First CRM Lead Capture, Strict B2B Team Approval
--     Workflow, HSN Tax Invoicing, Support Queries, Reviews & Audit Logging.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. SHARED TRIGGER FUNCTION (updated_at auto-maintenance)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 2. USERS & PATRON PROFILES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                TEXT PRIMARY KEY,                          -- Firebase Auth UID or UUID
  email             TEXT UNIQUE,
  phone             TEXT,
  display_name      TEXT NOT NULL DEFAULT 'Haveli Patron',
  preferred_theme   TEXT NOT NULL DEFAULT 'dhoop' CHECK (preferred_theme IN ('dhoop', 'raat')),
  preferred_lang    TEXT NOT NULL DEFAULT 'en' CHECK (preferred_lang IN ('en', 'hi')),
  mohar_balance     INTEGER NOT NULL DEFAULT 150 CHECK (mohar_balance >= 0),
  role              TEXT NOT NULL DEFAULT 'patron' CHECK (role IN ('patron', 'b2b_buyer', 'admin')),
  dpdp_analytics    BOOLEAN NOT NULL DEFAULT FALSE,
  dpdp_marketing    BOOLEAN NOT NULL DEFAULT FALSE,
  consent_version   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_addresses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label             TEXT NOT NULL DEFAULT 'Home',
  line1             TEXT NOT NULL,
  city              TEXT NOT NULL,
  state             TEXT NOT NULL,
  pincode           CHAR(6) NOT NULL CHECK (pincode ~ '^\d{6}$'),
  country           TEXT NOT NULL DEFAULT 'India',
  is_default        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. CATALOGUE, ARTISANS, CATEGORIES & GI CLAIMS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  slug              TEXT PRIMARY KEY CHECK (slug IN (
                      'textiles-apparel',
                      'home-furnishing',
                      'jewellery',
                      'footwear-leather',
                      'art-decor',
                      'gifting-festive'
                    )),
  name              TEXT NOT NULL,
  name_hi           TEXT NOT NULL,
  tagline           TEXT NOT NULL,
  hero_image        TEXT NOT NULL,
  sort_order        SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS artisans (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  village           TEXT NOT NULL,
  district          TEXT NOT NULL,
  craft             TEXT NOT NULL,
  years_experience  SMALLINT NOT NULL CHECK (years_experience >= 0),
  story             TEXT NOT NULL,
  co_operative      TEXT NOT NULL,
  avatar_color      TEXT NOT NULL DEFAULT '#B3123F',
  image_url         TEXT,
  is_mock           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claims_registry (
  id                TEXT PRIMARY KEY,
  claim_type        TEXT NOT NULL CHECK (claim_type IN (
                      'gi_tag', 'guild_count', 'artisan_share', 'shipping_coverage', 'testimonial'
                    )),
  subject           TEXT NOT NULL,
  statement         TEXT NOT NULL,
  fallback_text     TEXT NOT NULL,
  source_name       TEXT NOT NULL,
  source_url        TEXT,
  registry_ref      TEXT,
  verified          BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by       TEXT,
  verified_at       TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS products (
  id                     TEXT PRIMARY KEY,
  sku                    TEXT NOT NULL UNIQUE,
  slug                   TEXT NOT NULL UNIQUE,
  name                   TEXT NOT NULL,
  category_slug          TEXT NOT NULL REFERENCES categories(slug) ON UPDATE CASCADE,
  sub_category           TEXT NOT NULL,
  short_description      TEXT NOT NULL,
  long_description       TEXT NOT NULL,
  craft_type             TEXT NOT NULL,
  region                 TEXT NOT NULL,
  material               TEXT NOT NULL,
  care_instructions      TEXT NOT NULL,
  occasions              TEXT[] NOT NULL DEFAULT '{}',
  colors                 TEXT[] NOT NULL DEFAULT '{}',
  mrp_inr                INTEGER NOT NULL CHECK (mrp_inr > 0),
  price_inr              INTEGER NOT NULL CHECK (price_inr > 0),
  gst_rate               SMALLINT NOT NULL CHECK (gst_rate IN (0, 3, 5, 18, 40)),
  hsn_code               TEXT NOT NULL,
  weight_grams           INTEGER NOT NULL DEFAULT 400 CHECK (weight_grams > 0),
  dimensions             TEXT NOT NULL DEFAULT 'Standard',
  moq                    INTEGER NOT NULL DEFAULT 10 CHECK (moq >= 1),
  case_pack              INTEGER NOT NULL DEFAULT 10 CHECK (case_pack >= 1),
  lead_time_days         SMALLINT NOT NULL DEFAULT 12 CHECK (lead_time_days >= 1),
  customisable           BOOLEAN NOT NULL DEFAULT TRUE,
  artisan_id             TEXT NOT NULL REFERENCES artisans(id),
  hours_of_work          INTEGER NOT NULL DEFAULT 8,
  gi_tagged              BOOLEAN NOT NULL DEFAULT FALSE,
  gi_claim_id            TEXT REFERENCES claims_registry(id) ON DELETE SET NULL,
  country_of_origin      TEXT NOT NULL DEFAULT 'India',
  manufacturer_name      TEXT NOT NULL DEFAULT 'Partner Rajasthan Artisan Cooperative',
  images                 TEXT[] NOT NULL DEFAULT '{}',
  is_bestseller          BOOLEAN NOT NULL DEFAULT FALSE,
  is_curated_bestseller  BOOLEAN NOT NULL DEFAULT FALSE,
  is_new_arrival         BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured            BOOLEAN NOT NULL DEFAULT FALSE,
  is_festive             BOOLEAN NOT NULL DEFAULT FALSE,
  is_giftable            BOOLEAN NOT NULL DEFAULT TRUE,
  rating                 NUMERIC(3, 1) NOT NULL DEFAULT 0.0,
  review_count           INTEGER NOT NULL DEFAULT 0,
  real_rating            NUMERIC(3, 1) NOT NULL DEFAULT 0.0,
  real_review_count      INTEGER NOT NULL DEFAULT 0,
  artisan_share_pct      SMALLINT NOT NULL DEFAULT 52,
  materials_pct          SMALLINT NOT NULL DEFAULT 22,
  logistics_pct          SMALLINT NOT NULL DEFAULT 14,
  brand_pct              SMALLINT NOT NULL DEFAULT 12,
  is_mock                BOOLEAN NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id                TEXT PRIMARY KEY,
  product_id        TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label             TEXT NOT NULL,
  color             TEXT NOT NULL,
  color_hex         TEXT NOT NULL DEFAULT '#B3123F',
  stock             INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku_suffix        TEXT NOT NULL
);

-- Exposed only to server pricing engine & Admin-approved B2B trade accounts
CREATE TABLE IF NOT EXISTS product_b2b_tiers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  min_qty           INTEGER NOT NULL CHECK (min_qty >= 1),
  discount_percent  NUMERIC(5, 2) NOT NULL CHECK (discount_percent BETWEEN 0 AND 90),
  unit_price_inr    INTEGER NOT NULL CHECK (unit_price_inr > 0),
  UNIQUE (product_id, min_qty)
);

-- -----------------------------------------------------------------------------
-- 4. WISHLISTS, CARTS, BUNDLES & COUPONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlists (
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id        TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS carts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  cart_id           UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id        TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id        TEXT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  added_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cart_id, product_id, variant_id)
);

CREATE TABLE IF NOT EXISTS bundles (
  id                TEXT PRIMARY KEY,
  title             TEXT NOT NULL,
  subtitle          TEXT NOT NULL,
  product_slugs     TEXT[] NOT NULL,
  discount_percent  NUMERIC(5, 2) NOT NULL DEFAULT 10,
  is_mock           BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS coupons (
  code              TEXT PRIMARY KEY,
  description       TEXT NOT NULL,
  discount_type     TEXT NOT NULL CHECK (discount_type IN ('percent', 'flat')),
  value             INTEGER NOT NULL CHECK (value > 0),
  min_order_inr     INTEGER NOT NULL DEFAULT 0,
  is_b2b_only       BOOLEAN NOT NULL DEFAULT FALSE,
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  is_mock           BOOLEAN NOT NULL DEFAULT FALSE
);

-- -----------------------------------------------------------------------------
-- 5. ORDERS, LINE ITEMS, GST INVOICE BREAKUP & PAYMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                    TEXT PRIMARY KEY,
  order_number          TEXT NOT NULL UNIQUE,
  user_id               TEXT REFERENCES users(id) ON DELETE SET NULL,
  idempotency_key       TEXT UNIQUE,
  customer_name         TEXT NOT NULL,
  customer_email        TEXT NOT NULL,
  customer_phone        TEXT NOT NULL,
  shipping_line1        TEXT NOT NULL,
  shipping_city         TEXT NOT NULL,
  shipping_state        TEXT NOT NULL,
  shipping_pincode      CHAR(6) NOT NULL,
  shipping_country      TEXT NOT NULL DEFAULT 'India',
  buyer_gstin           CHAR(15),
  payment_method        TEXT NOT NULL CHECK (payment_method IN ('UPI', 'Card', 'Netbanking', 'COD', 'NEFT', 'Net-30')),
  payment_status        TEXT NOT NULL CHECK (payment_status IN (
                          'Paid', 'Pending Payment', 'Failed', 'Pending COD Verification', 'Net-30 Invoiced'
                        )),
  payment_order_id      TEXT,
  payment_id            TEXT,
  order_status          TEXT NOT NULL DEFAULT 'Confirmed' CHECK (order_status IN (
                          'Confirmed', 'Artisan Packed', 'Shipped', 'Delivered', 'Cancelled'
                        )),
  subtotal_inr          INTEGER NOT NULL CHECK (subtotal_inr >= 0),
  discount_inr          INTEGER NOT NULL DEFAULT 0,
  prepaid_discount_inr  INTEGER NOT NULL DEFAULT 0,
  cod_fee_inr           INTEGER NOT NULL DEFAULT 0,
  coupon_code           TEXT REFERENCES coupons(code) ON DELETE SET NULL,
  mohar_redeemed        INTEGER NOT NULL DEFAULT 0,
  mohar_earned          INTEGER NOT NULL DEFAULT 0,
  gift_wrap             BOOLEAN NOT NULL DEFAULT FALSE,
  gift_message          TEXT,
  shipping_fee_inr      INTEGER NOT NULL DEFAULT 0,
  gst_amount_inr        INTEGER NOT NULL DEFAULT 0,
  -- Embedded GST Invoice Breakdown
  invoice_number        TEXT UNIQUE,
  seller_name           TEXT,
  seller_gstin          TEXT,
  seller_state          TEXT DEFAULT 'Rajasthan',
  is_intra_state        BOOLEAN DEFAULT FALSE,
  taxable_value_inr     INTEGER DEFAULT 0,
  cgst_amount_inr       INTEGER DEFAULT 0,
  sgst_amount_inr       INTEGER DEFAULT 0,
  igst_amount_inr       INTEGER DEFAULT 0,
  total_inr             INTEGER NOT NULL CHECK (total_inr >= 0),
  channel               TEXT NOT NULL DEFAULT 'D2C' CHECK (channel IN ('D2C', 'B2B')),
  is_mock               BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        TEXT NOT NULL REFERENCES products(id),
  sku               TEXT NOT NULL,
  name              TEXT NOT NULL,
  variant_id        TEXT,
  variant_label     TEXT NOT NULL,
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_inr    INTEGER NOT NULL CHECK (unit_price_inr >= 0),
  gst_rate          SMALLINT NOT NULL CHECK (gst_rate IN (0, 3, 5, 18, 40)),
  hsn_code          TEXT NOT NULL,
  taxable_value_inr INTEGER NOT NULL DEFAULT 0,
  gst_amount_inr    INTEGER NOT NULL DEFAULT 0,
  image_url         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  gateway           TEXT NOT NULL DEFAULT 'razorpay',
  gateway_order_id  TEXT,
  gateway_payment_id TEXT,
  amount_inr        INTEGER NOT NULL CHECK (amount_inr >= 0),
  currency          CHAR(3) NOT NULL DEFAULT 'INR',
  status            TEXT NOT NULL CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded')),
  raw_metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. VERIFIED REVIEWS & JOURNAL BLOG POSTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id                TEXT PRIMARY KEY,
  product_id        TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id           TEXT REFERENCES users(id) ON DELETE SET NULL,
  order_id          TEXT REFERENCES orders(id) ON DELETE SET NULL,
  author            TEXT NOT NULL,
  city              TEXT NOT NULL DEFAULT 'Jaipur',
  rating            SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title             TEXT NOT NULL,
  comment           TEXT NOT NULL,
  verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'pending', 'rejected')),
  is_mock           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id                TEXT PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  title_hi          TEXT NOT NULL,
  category          TEXT NOT NULL,
  excerpt           TEXT NOT NULL,
  reading_time_min  SMALLINT NOT NULL DEFAULT 4,
  author            TEXT NOT NULL,
  published_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cover_image       TEXT NOT NULL,
  sections          JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_slugs     TEXT[] NOT NULL DEFAULT '{}',
  is_mock           BOOLEAN NOT NULL DEFAULT FALSE
);

-- -----------------------------------------------------------------------------
-- 7. STRICT B2B ONBOARDING & APPROVAL WORKFLOW
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS b2b_applications (
  id                      TEXT PRIMARY KEY,
  user_id                 TEXT REFERENCES users(id) ON DELETE SET NULL,
  business_name           TEXT NOT NULL,
  business_type           TEXT NOT NULL CHECK (business_type IN (
                            'Retail Boutique', 'Interior Designer', 'Hotel / Resort', 'Corporate Gifting', 'Export Importer'
                          )),
  gstin                   CHAR(15) NOT NULL,
  iec_code                TEXT,
  contact_name            TEXT NOT NULL,
  email                   TEXT NOT NULL,
  phone                   TEXT NOT NULL,
  city                    TEXT NOT NULL,
  expected_monthly_volume TEXT NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'Pending Review' CHECK (status IN ('Pending Review', 'Approved', 'Rejected')),
  credit_limit_inr        INTEGER NOT NULL DEFAULT 0 CHECK (credit_limit_inr >= 0),
  reviewed_by             TEXT,
  reviewed_at             TIMESTAMPTZ,
  is_mock                 BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS b2b_quotes (
  id                TEXT PRIMARY KEY,
  quote_number      TEXT NOT NULL UNIQUE,
  company_name      TEXT NOT NULL,
  contact_email     TEXT NOT NULL,
  category          TEXT NOT NULL,
  quantity          INTEGER NOT NULL CHECK (quantity >= 10),
  custom_branding   BOOLEAN NOT NULL DEFAULT FALSE,
  packaging_type    TEXT NOT NULL,
  target_budget_inr INTEGER NOT NULL CHECK (target_budget_inr >= 0),
  notes             TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'Quoted' CHECK (status IN ('Draft', 'Quoted', 'Approved', 'Converted')),
  quoted_total_inr  INTEGER NOT NULL CHECK (quoted_total_inr >= 0),
  is_mock           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. CRM LEADS, ACTIVITIES & CUSTOMER SUPPORT QUERIES DESK
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT REFERENCES users(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  company_name        TEXT,
  city                TEXT,
  gstin               CHAR(15),
  channel             TEXT NOT NULL DEFAULT 'D2C' CHECK (channel IN ('D2C', 'B2B')),
  stage               TEXT NOT NULL DEFAULT 'New Lead' CHECK (stage IN (
                        'New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Converted', 'Lost'
                      )),
  priority            TEXT NOT NULL DEFAULT 'Low' CHECK (priority IN ('Low', 'Medium', 'High')),
  lead_score          SMALLINT NOT NULL DEFAULT 10 CHECK (lead_score BETWEEN 0 AND 100),
  estimated_value_inr INTEGER NOT NULL DEFAULT 0 CHECK (estimated_value_inr >= 0),
  last_intent         TEXT NOT NULL CHECK (last_intent IN (
                        'product_click', 'add_to_cart', 'wishlist_like', 'buy_now',
                        'checkout_start', 'stock_alert', 'b2b_application', 'b2b_quote', 'contact_query'
                      )),
  source_path         TEXT NOT NULL DEFAULT '/',
  assigned_to         TEXT,
  next_follow_up_at   TIMESTAMPTZ,
  loss_reason         TEXT,
  interested_products JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_mock             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_activities (
  id                TEXT PRIMARY KEY,
  lead_id           TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type     TEXT NOT NULL CHECK (activity_type IN ('signal', 'note', 'stage_change', 'email')),
  intent            TEXT,
  product_id        TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name      TEXT,
  summary           TEXT NOT NULL,
  actor             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_queries (
  id                TEXT PRIMARY KEY,
  ticket_number     TEXT NOT NULL UNIQUE,
  user_id           TEXT REFERENCES users(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  category          TEXT NOT NULL CHECK (category IN (
                      'Order & Shipping', 'Product Care', 'B2B Inquiry', 'Return / Damage', 'Grievance (DPDP)'
                    )),
  order_number      TEXT,
  subject           TEXT NOT NULL,
  message           TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  admin_reply       TEXT,
  is_mock           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS heritage_mistake_reports (
  id                TEXT PRIMARY KEY,
  query             TEXT NOT NULL,
  answer_excerpt    TEXT NOT NULL,
  note              TEXT NOT NULL,
  reporter_email    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. STORE CONFIG, SUBSCRIPTIONS, ALERTS, AUDIT LOGS & TELEMETRY
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_config (
  id                          TEXT PRIMARY KEY DEFAULT 'store',
  prepaid_incentive_inr       INTEGER NOT NULL DEFAULT 50,
  free_shipping_threshold_inr INTEGER NOT NULL DEFAULT 1999,
  standard_shipping_fee_inr   INTEGER NOT NULL DEFAULT 120,
  gift_wrap_fee_inr           INTEGER NOT NULL DEFAULT 99,
  cod_enabled                 BOOLEAN NOT NULL DEFAULT TRUE,
  cod_max_order_inr           INTEGER NOT NULL DEFAULT 15000,
  cod_fee_inr                 INTEGER NOT NULL DEFAULT 60,
  cod_blocked_pincodes        TEXT[] NOT NULL DEFAULT ARRAY['999999'],
  mohar_max_redeem_pct        SMALLINT NOT NULL DEFAULT 10,
  mohar_earn_rate_pct         SMALLINT NOT NULL DEFAULT 2,
  allow_coupon_stack_mohar    BOOLEAN NOT NULL DEFAULT FALSE,
  low_stock_urgency_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  default_return_window_days  SMALLINT NOT NULL DEFAULT 14,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email             TEXT PRIMARY KEY,
  consent_accepted  BOOLEAN NOT NULL CHECK (consent_accepted = TRUE),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_alerts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  email             TEXT NOT NULL,
  notified          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id                TEXT PRIMARY KEY,
  actor_email       TEXT NOT NULL,
  action            TEXT NOT NULL,
  target_type       TEXT NOT NULL,
  target_id         TEXT NOT NULL,
  details           TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telemetry_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type        TEXT NOT NULL,
  route             TEXT,
  payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 10. INDEXES FOR FAST CRM, CATALOGUE & ORDER QUERIES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_craft ON products(craft_type);
CREATE INDEX IF NOT EXISTS idx_products_mock ON products(is_mock);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_b2b_apps_email ON b2b_applications(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_b2b_apps_status ON b2b_applications(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_updated ON leads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_queries_status ON support_queries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- -----------------------------------------------------------------------------
-- 11. TRIGGERS
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_carts_updated_at ON carts;
CREATE TRIGGER trg_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_queries_updated_at ON support_queries;
CREATE TRIGGER trg_queries_updated_at BEFORE UPDATE ON support_queries FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_store_config_updated_at ON store_config;
CREATE TRIGGER trg_store_config_updated_at BEFORE UPDATE ON store_config FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 12. ANALYTICAL & ADMIN CRM VIEWS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_crm_lead_pipeline AS
SELECT
  l.id,
  l.name,
  l.email,
  l.phone,
  l.company_name,
  l.channel,
  l.stage,
  l.priority,
  l.lead_score,
  l.estimated_value_inr,
  l.last_intent,
  l.assigned_to,
  l.next_follow_up_at,
  jsonb_array_length(l.interested_products) AS interested_sku_count,
  COUNT(a.id) AS activity_count,
  l.updated_at
FROM leads l
LEFT JOIN lead_activities a ON a.lead_id = l.id
GROUP BY l.id;

CREATE OR REPLACE VIEW v_catalog_summary AS
SELECT
  p.id,
  p.sku,
  p.slug,
  p.name,
  c.name AS category_name,
  p.price_inr,
  p.gst_rate,
  p.hsn_code,
  COALESCE(SUM(v.stock), 0) AS total_stock,
  p.real_rating,
  p.real_review_count,
  p.is_curated_bestseller,
  p.is_mock
FROM products p
JOIN categories c ON c.slug = p.category_slug
LEFT JOIN product_variants v ON v.product_id = p.id
GROUP BY p.id, c.name;

CREATE OR REPLACE VIEW v_order_gst_summary AS
SELECT
  o.id,
  o.order_number,
  o.channel,
  o.customer_name,
  o.buyer_gstin,
  o.order_status,
  o.payment_method,
  o.payment_status,
  o.taxable_value_inr,
  o.cgst_amount_inr,
  o.sgst_amount_inr,
  o.igst_amount_inr,
  o.gst_amount_inr,
  o.total_inr,
  o.created_at
FROM orders o;

-- -----------------------------------------------------------------------------
-- 13. INITIAL BOOTSTRAP SEED DATA (Idempotent)
-- -----------------------------------------------------------------------------
INSERT INTO store_config (id) VALUES ('store') ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (slug, name, name_hi, tagline, hero_image, sort_order) VALUES
  ('textiles-apparel', 'Textiles & Apparel', 'वस्त्र और परिधान', 'Sanganeri florals, Bagru indigo Dabu, Bandhani & Leheriya', '/src/assets/images/craft_sanganeri_textiles_1794546842861.jpg', 1),
  ('home-furnishing', 'Home Furnishing', 'गृह सज्जा वस्त्र', 'Jaipuri razai quilts, hand-block bedlinen & woven dhurries', '/src/assets/images/home_furnishing_razai_1794554507328.jpg', 2),
  ('jewellery', 'Jewellery', 'आभूषण', 'Meenakari enamel, Pratapgarh GI Thewa, Kundan & lac bangles', '/src/assets/images/craft_meenakari_jewellery_1794546841024.jpg', 3),
  ('footwear-leather', 'Footwear & Leather', 'मोजरी और चर्म शिल्प', 'Embroidered Jodhpuri mojari, camel-leather totes & potlis', '/src/assets/images/craft_leather_mojari_gifting_1794546843670.jpg', 4),
  ('art-decor', 'Art & Collectibles', 'कला और सजावट', 'Jaipur Blue Pottery, Shahpura Phad scrolls & Kathputli sets', '/src/assets/images/craft_blue_pottery_decor_1794546842865.jpg', 5),
  ('gifting-festive', 'Gifting & Festive', 'त्योहार और उपहार', 'Curated Diwali hampers, brass diyas & corporate gift boxes', '/src/assets/images/craft_festive_diwali_hamper_1794554509452.jpg', 6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO artisans (id, name, village, district, craft, years_experience, story, co_operative, avatar_color, image_url, is_mock) VALUES
  ('art-01', 'Ramgopal Chippa', 'Sanganer', 'Jaipur', 'Sanganeri Block Print', 34, 'Third-generation master printer carving fine floral gadh, rekh, and datta teakwood blocks.', 'Sanganer Rangrez Sangh', '#B3123F', '/src/assets/images/workshop_sanganer_blockprint_1794549326509.jpg', TRUE),
  ('art-02', 'Suleman Khan', 'Bagru', 'Jaipur', 'Bagru & Dabu Mud-Resist', 28, 'Specialist in fermented iron-jaggery black dye and river-clay Dabu resist printing.', 'Bagru Chhipa Collective', '#1F3A93', '/src/assets/images/workshop_bagru_indigo_vat_1794549327374.jpg', TRUE),
  ('art-03', 'Rukhsana Khatoon', 'Sikar', 'Shekhawati', 'Bandhani Tie-Dye', 22, 'Ties over 4,000 tiny ekdali knots per dupatta by hand without stencils.', 'Shekhawati Bandhej Mahila Mandal', '#B3123F', '/src/assets/images/reel_bandhani_sikar_1794554879984.jpg', TRUE),
  ('art-04', 'Mahendra Soni', 'Pratapgarh', 'Pratapgarh', 'Thewa Gold-on-Glass', 30, 'Master goldsmith fusing pierced 23k gold sheet motifs onto coloured Belgian glass.', 'Pratapgarh Thewa Guild', '#0F7B6C', '/src/assets/images/workshop_pratapgarh_thewa_1794549329260.jpg', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO claims_registry (id, claim_type, subject, statement, fallback_text, source_name, source_url, registry_ref, verified) VALUES
  ('gi-thewa', 'gi_tag', 'Pratapgarh Thewa', 'Thewa art of Rajasthan holds a registered Geographical Indication.', 'Traditional craft of Pratapgarh, Rajasthan', 'Geographical Indications Registry (India)', 'https://search.ipindia.gov.in/GIRPublic/', 'Verify Certificate # in Admin before launch', FALSE),
  ('gi-sanganeri', 'gi_tag', 'Sanganeri Hand-Block Printing', 'Sanganeri hand-block printing holds a Geographical Indication.', 'Traditional craft of Sanganer, Jaipur', 'Geographical Indications Registry (India)', 'https://search.ipindia.gov.in/GIRPublic/', 'Verify Certificate # in Admin before launch', FALSE),
  ('gi-bagru', 'gi_tag', 'Bagru Hand-Block Printing', 'Bagru hand-block printing holds a Geographical Indication.', 'Traditional craft of Bagru, Jaipur', 'Geographical Indications Registry (India)', 'https://search.ipindia.gov.in/GIRPublic/', 'Verify Certificate # in Admin before launch', FALSE),
  ('gi-blue-pottery', 'gi_tag', 'Blue Pottery of Jaipur', 'Blue Pottery of Jaipur holds a Geographical Indication.', 'Traditional craft of Jaipur & Kot Jewar', 'Geographical Indications Registry (India)', 'https://search.ipindia.gov.in/GIRPublic/', 'Verify Certificate # in Admin before launch', FALSE),
  ('gi-kota-doria', 'gi_tag', 'Kota Doria', 'Kota Doria handloom weave holds a Geographical Indication.', 'Traditional handloom craft of Kaithoon, Kota', 'Geographical Indications Registry (India)', 'https://search.ipindia.gov.in/GIRPublic/', 'Verify Certificate # in Admin before launch', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO coupons (code, description, discount_type, value, min_order_inr, is_b2b_only, active, is_mock) VALUES
  ('PADHARO10', 'Welcome patron 10% savings above ₹1,500', 'percent', 10, 1500, FALSE, TRUE, TRUE),
  ('HAVELI15', '15% off on orders above ₹4,000', 'percent', 15, 4000, FALSE, TRUE, TRUE),
  ('JAIPUR250', 'Flat ₹250 off above ₹1,999', 'flat', 250, 1999, FALSE, TRUE, TRUE),
  ('TRADE500', 'Approved B2B trade discount ₹500', 'flat', 500, 15000, TRUE, TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO products (
  id, sku, slug, name, category_slug, sub_category, short_description, long_description,
  craft_type, region, material, care_instructions, mrp_inr, price_inr, gst_rate, hsn_code,
  artisan_id, gi_claim_id, images, is_bestseller, is_curated_bestseller, is_featured, is_mock
) VALUES
  (
    'prod-01', 'RH-TXT-001', 'sanganeri-floral-indigo-handblock-kurta',
    'Sanganeri Floral Indigo Handblock Kurta', 'textiles-apparel', 'Kurtas',
    'Hand-stamped lotus & marigold blocks on breathable Jaipur mulmul cotton.',
    'Stamped using carved teakwood rekh and datta blocks in Sanganer with cold river-washed finish.',
    'Sanganeri Block Print', 'Sanganer, Jaipur', '100% Pure Mulmul Cotton',
    'Gentle cold handwash separately; dry in shade.',
    2899, 2199, 5, '6204', 'art-01', 'gi-sanganeri',
    ARRAY['/src/assets/images/prod_sanganeri_kurta_1794554883969.jpg'], TRUE, TRUE, TRUE, TRUE
  ),
  (
    'prod-02', 'RH-ART-002', 'jaipur-blue-pottery-peacock-vase',
    'Jaipur Blue Pottery Cobalt Vase', 'art-decor', 'Blue Pottery',
    'Quartz-paste hand-painted vase glazed with mineral cobalt & turquoise oxides.',
    'Fired in wood-ash kilns around Kot Jewar and Jaipur using crushed quartz and katira gum.',
    'Jaipur Blue Pottery', 'Jaipur', 'Crushed Quartz & Mineral Oxide Glaze',
    'Hand wash gently with soft sponge; avoid thermal shock.',
    2499, 1899, 5, '6913', 'art-01', 'gi-blue-pottery',
    ARRAY['/src/assets/images/craft_blue_pottery_decor_1794546842865.jpg'], TRUE, TRUE, TRUE, TRUE
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_variants (id, product_id, label, color, color_hex, stock, sku_suffix) VALUES
  ('var-01-std', 'prod-01', 'M / Indigo Floral', 'Indigo', '#1D4E89', 24, 'M-IND'),
  ('var-02-std', 'prod-02', 'Standard 10-inch', 'Cobalt Blue', '#1D4E89', 18, 'STD')
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_b2b_tiers (product_id, min_qty, discount_percent, unit_price_inr) VALUES
  ('prod-01', 10, 12, 1935),
  ('prod-01', 25, 22, 1715),
  ('prod-01', 50, 32, 1495),
  ('prod-01', 100, 40, 1319),
  ('prod-02', 10, 12, 1671),
  ('prod-02', 25, 22, 1481),
  ('prod-02', 50, 32, 1291),
  ('prod-02', 100, 40, 1139)
ON CONFLICT (product_id, min_qty) DO NOTHING;

COMMIT;
