# Product Requirements Document (PRD): Rangrez Haveli Admin Console

**Document Version:** 1.0 (Final Implementation Spec)  
**Route:** `/admin` (noindex, server-authenticated)  
**Primary Stakeholder / Default Admin Allowlist:** `durlabhdaryani70@gmail.com`  
**Database Targets:** Local Atomic JSON Store + Firebase Firestore (`ai-studio-rangrezhaveli-9969d5c1-ae97-431a-8ac6-38a5556fc07e`) + PostgreSQL DDL (`/DB_setup.sql`)

---

## 1. Executive Summary & Scope

The **Rangrez Haveli Admin Console** (`/admin`) is a single-pane-of-glass operational workstation for managing customer acquisition, fulfillment, catalog economics, customer support/grievances, B2B partner gating, and regulatory compliance.

### Core Functional Pillars
1. **Leads CRM (Primary Conversion Engine):** Captures authenticated patron intent signals across the storefront, scores leads automatically, tracks interested SKUs and chronological timelines, supports manual B2B/D2C lead entry, and tracks conversion through Orders.
2. **Orders & GST Fulfillment Management:** End-to-end D2C and B2B order lookup, fulfillment stage transitions, and India GST invoice verification (`CGST + SGST` intra-state vs. `IGST` inter-state).
3. **Product Catalogue Management:** Live SKU publishing with automatic HSN GST slab derivation (post-Sept 22, 2025 Indian GST rules: `0%, 3%, 5%, 18%, 40%`), inline price/stock/bestseller editing, automatic B2B tier recalculation, and SKU deletion.
4. **Queries, Reviews & Compliance Moderation:** Support & DPDP grievance ticketing queue (`TKT-26-XXXX`), verified purchase review moderation, and factual correction report tracking.
5. **B2B Partner Approvals, GI Claims & Store Config:** Team approval gate controlling B2B tier pricing and ordering visibility, GI Tag authenticity verification registry, checkout/COD/Mohar configuration, launch readiness telemetry, and security audit logs.

### Explicitly Excluded Scope
- **3D Studio & Craft Atlas / Encyclopedia Modules:** Completely removed from the storefront, routes (`/studio-3d`, `/crafts`), sitemap, and admin management scope.

---

## 2. Authentication, RBAC & Security Architecture

| Layer | Enforcement Mechanism | Behavior on Failure |
| :--- | :--- | :--- |
| **Client Gate** | Firebase Authentication ID Token (`Authorization: Bearer <token>`) attached via `authedFetch()` | Shows Google Sign-In prompt (`401`) or Access Denied notice (`403`) |
| **Server API Guard** | `requireAdmin` middleware verifies JWT via `firebase-admin` `verifyIdToken()` and checks `decoded.email` against server `ADMIN_EMAILS` allowlist (`durlabhdaryani70@gmail.com`). Client-side role flags are **never trusted**. | Returns `HTTP 401` (missing/invalid token) or `HTTP 403` (not in allowlist) |
| **Firestore Rules** | `firestore.rules` enforces default-deny globally; `isTokenAdmin()` / `admins/{uid}` governs admin reads; client writes are blocked (`allow create, update, delete: if false`) on `orders`, `products`, `leads`, `supportQueries`, `b2bApplications`, `quotes`, `reviews`, and `config`. | Permission denied at database layer |
| **SEO / Crawler Isolation** | SSR injects `<meta name="robots" content="noindex, nofollow">` for `/admin`; `robots.txt` declares `Disallow: /admin`. | Excluded from search engine indexing |
| **Mock Isolation** | `ENV=production` filters `isMock: true` rows from all public and admin metrics; seeding endpoint (`POST /api/admin/seed`) returns `403` in production. | Prevents demo data leakage in live environments |

---

## 3. Global Admin Layout & Executive KPI Strip

### 3.1 Top Action Bar
- Displays verified administrator email (`user.email`).
- **Non-Production Controls:**
  - `Load Demo Seed` (`POST /api/admin/seed` `{ reset: false }`)
  - `Reset Seed` (`POST /api/admin/seed` `{ reset: true }`)
- **Environment Hygiene Control (All Environments):**
  - `Purge Mock Data` (`POST /api/admin/purge-mock`): Removes all `isMock: true` records, recomputes real product rating/review counters, and writes an audit log entry.

### 3.2 Executive KPI Strip (5 Cards)
All KPIs are computed server-side in `GET /api/admin/overview`:
1. **CRM Pipeline Leads:** `totalLeads` (`openLeads` active · `highPriorityLeads` high priority)
2. **Est. Pipeline Value:** `pipelineValueInr` (sum of `estimatedValueInr` across non-`Lost` leads)
3. **Gross Order Revenue:** `totalRevenue` (`totalOrders` orders · `realOrders` live)
4. **Open Queries & B2B:** `openQueries` open tickets (`pendingB2BApps` B2B onboarding apps pending review)
5. **Catalogue SKUs:** `totalProducts` (`realProducts` live · `mockProducts` sample)

### 3.3 Tab Navigation
1. `Leads CRM (<totalLeads>)`
2. `Orders (<totalOrders>)`
3. `Products (<totalProducts>)`
4. `Queries & Reviews (<openQueries> open)`
5. `B2B Approvals (<pendingB2BApps>) & Config`

---

## 4. Module 1: Leads CRM (Customer & Trade Pipeline)

### 4.1 Automated Lead Capture & Login-First Gate
Whenever an unauthenticated visitor attempts a conversion or high-intent storefront action—**Product Click**, **Add to Bag**, **Wishlist Like**, **Buy Now**, **Add Bundle**, **Notify Me (Stock Alert)**, **Checkout Start**, or **B2B Onboarding Form Submit**—the client opens the Login-First Gate Modal (Google Sign-In or Mobile OTP). Upon authentication:
- The intended action resumes automatically.
- `POST /api/leads` (`requireAuth`) creates or updates the patron's Lead record in `leads` (and syncs to Firestore).
- Subsequent interactions by signed-in patrons log intent signals silently in the background.

### 4.2 Lead Scoring, Priority & Stage Automation
| Intent Signal (`LeadIntentType`) | Score Boost | Default Stage Effect |
| :--- | :---: | :--- |
| `product_click` | +10 | `New Lead` (if newly created) |
| `wishlist_like` | +15 | `New Lead` |
| `contact_query` | +15 | `New Lead` |
| `stock_alert` | +18 | `New Lead` |
| `add_to_cart` | +25 | `New Lead` |
| `buy_now` | +35 | `New Lead` |
| `checkout_start` | +35 | `New Lead` |
| `b2b_quote` | +40 | Forces stage -> `Proposal Sent`, channel -> `B2B` |
| `b2b_application` | +50 | Forces stage -> `Qualified`, channel -> `B2B` |

- **Deduplication Key:** Matches existing non-mock lead by `userId` OR normalized lowercase `email`.
- **Score Cap:** `min(100, existingScore + boost)`.
- **Auto-Priority Rule:** `High` if `leadScore >= 60` OR `channel === 'B2B'`; `Medium` if `leadScore >= 30`; otherwise `Low`.
- **Auto-Conversion Triggers:**
  - Placing an order (`POST /api/orders`) automatically moves the matching lead's stage to `Converted`, updates `estimatedValueInr`, and logs the order number (`RH-2026-XXXX`) in the activity timeline.
  - Admin B2B decision (`PATCH /api/admin/b2b/applications/:id`) sets stage to `Qualified` (`Approved`) or `Lost` (`Rejected`) and logs the credit limit/decision.

### 4.3 Search, Filtering & Manual Creation
- **Search Query:** Matches lead `name`, `email`, `phone`, `companyName`, or any `interestedProducts[].name`.
- **Filters:**
  - Stage (`all`, `New Lead`, `Contacted`, `Qualified`, `Proposal Sent`, `Converted`, `Lost`)
  - Last Intent (all 9 `LeadIntentType` values)
  - Channel (`all`, `D2C`, `B2B`)
- **Add Manual Lead Form (`POST /api/admin/leads`):** Inputs for Contact Name*, Email*, Phone/WhatsApp, Company Name, Channel (`D2C`/`B2B`), Initial Stage, Estimated Value (INR), and Initial CRM Note.

### 4.4 Master-Detail Lead Inspector
- **Left Queue:** Scrollable list sorted by `updatedAt` descending; displays name/company, contact info, stage pill, score (`/100`), priority badge, channel, estimated value, last intent, touched SKU count, and timestamp.
- **Right Inspector:**
  1. **Identity Summary:** Name, channel badge, email, phone, company, city, GSTIN, large lead score readout.
  2. **CRM Pipeline Editor (`PATCH /api/admin/leads/:id`):** Editable `stage`, `priority`, `estimatedValueInr`, `assignedTo`, `nextFollowUpAt` (`datetime-local`), conditional `lossReason` (rendered when `stage === 'Lost'`), and free-text timeline note (Call/WhatsApp summary).
  3. **Interested Products Ledger:** Shows up to 25 most recently touched SKUs with intent label, touch timestamp, and INR price.
  4. **Chronological Activity Timeline:** Displays up to 60 logged events (`signal`, `stage_change`, `note`, `email`) with actor email/phone and timestamp.

---

## 5. Module 2: Orders & GST Invoice Management

### 5.1 Search & Filters
- **Search:** Order number (`RH-2026-XXXX`), customer name, email, or phone.
- **Status Filter:** `all`, `Confirmed`, `Artisan Packed`, `Shipped`, `Delivered`, `Cancelled`.
- **Channel Filter:** `all`, `D2C`, `B2B`.

### 5.2 Orders Table & Status Updates
- Columns: `Order #` + `D2C`/`B2B` tag, `Patron` (Name + City), `Payment` (Method + Status), `Total (INR)`, and inline `Fulfillment` `<select>`.
- Changing the inline `<select>` triggers `PATCH /api/admin/orders/:id` and appends an `UPDATE_ORDER_STATUS` audit log entry.

### 5.3 Order Detail & Tax Breakup Panel
- Customer contact header (`customerName`, `customerEmail`, `customerPhone`).
- Full shipping address (`line1`, `city`, `state`, `pincode`) + Buyer `GSTIN` (when provided).
- Itemized SKU list (`name`, `sku`, `variantLabel`, `quantity`, `hsnCode`, `gstRate%`, line subtotal).
- **GST Invoice Breakup:** `invoiceNumber`, `taxableValue`, intra-state Rajasthan `CGST + SGST` split or inter-state `IGST`, and `Grand Total`.

---

## 6. Module 3: Product Catalogue Management

### 6.1 Create Live Product Form (`POST /api/admin/products`)
- **Fields:** Product Title*, Category (`textiles-apparel`, `home-furnishing`, `jewellery`, `footwear-leather`, `art-decor`, `gifting-festive`), INR Price, Initial Stock, HSN Code, Region, Craft Type.
- **Server-Side Computation:**
  - Enforces valid India post-Sept 2025 GST slab (`0%, 3%, 5%, 18%, 40%`) via `getHsnGstRate()`.
  - Auto-generates unique slug, SKU (`RH-ADM-XXXX`), default variant stock, craft imagery, and 4 B2B tiers (`10+ -12%`, `25+ -22%`, `50+ -32%`, `100+ -40%`).
  - Records `CREATE_PRODUCT` in Audit Log.

### 6.2 Live Catalogue Manager Table
- **Filters:** Search by name, SKU, craft type, or region; Category dropdown.
- **Inline Editing (`PATCH /api/admin/products/:id`):**
  - Editable **Price (₹)** -> automatically recomputes `gstRate` and all 4 `b2bTiers` server-side.
  - Editable **Primary Variant Stock** (`>= 0` integer).
  - Toggleable **Bestseller** checkbox (`isCuratedBestseller`).
  - `Save` button commits changes and records `UPDATE_PRODUCT` audit log.
- **Delete (`DELETE /api/admin/products/:id`):** Removes SKU cleanly and records `DELETE_PRODUCT` audit log.

---

## 7. Module 4: Queries, Reviews & Heritage Mistake Reports

### 7.1 Customer Support & Grievance Queries Desk
- **Ingress:** Populated via `POST /api/queries` from `/contact` and DPDP Grievance forms. Auto-assigns `TKT-26-XXXX` and logs a `contact_query` CRM Lead signal.
- **Filters:** Text search (`ticketNumber`, `name`, `email`, `subject`, `message`) and Status filter (`all`, `Open`, `In Progress`, `Resolved`, `Closed`).
- **Triage Actions (`PATCH /api/admin/queries/:id`):** Inline admin resolution reply input + ticket status dropdown + `Update Ticket` CTA. Logs `UPDATE_SUPPORT_QUERY` in Audit Log.

### 7.2 Review Moderation Queue
- Displays customer reviews (`author`, `city`, star rating, Verified Purchase vs. Sample tag, `title`, `comment`).
- One-click moderation toggles: `approved`, `pending`, `rejected` (`PATCH /api/admin/reviews/:id`).
- Calls `recomputeDerivedProductStats(state)` so product `realRating` and `realReviewCount` reflect only approved, non-mock reviews.

### 7.3 Heritage Mistake Reports
- Read-only feed of patron-submitted factual correction reports from Heritage Search (`query`, `note`, `createdAt`).

---

## 8. Module 5: B2B Approvals, GI Claims Registry & Store Config

### 8.1 B2B Partner Approval Queue (`PATCH /api/admin/b2b/applications/:id`)
- **Strict Gating Rule:** All users visiting `/b2b` see **only the B2B Onboarding Form** until an Admin approves their real (`!isMock`) application (`status = 'Approved'`). There is no admin/mock bypass on `/b2b`.
- **Admin Actions:**
  - **Approve & Unlock Pricing:** Sets `status = 'Approved'`, allocates default ₹3,00,000 Net-30 credit limit, unlocks `b2bTiers` pricing, B2B bulk ordering, Corporate Gifting RFQs, and Net-30 POs for that partner's `userId` / `email`.
  - **Reject:** Sets `status = 'Rejected'`, resets `creditLimitInr = 0`, keeps pricing/RFQs hidden.
  - **CRM & Audit Sync:** Logs the approval/rejection onto the linked B2B Lead's activity timeline and writes `UPDATE_B2B_APPLICATION` to Audit Log.

### 8.2 GI Tag & Authenticity Claims Registry (`PATCH /api/admin/claims/:id`)
- Editable `registryReference`, `sourceUrl` (official IP India link), and `verified` boolean.
- Storefront GI badges appear **strictly** when `claim.verified === true`.

### 8.3 Storefront Checkout, COD & Mohar Config (`PATCH /api/admin/config`)
- Editable rules: `prepaidIncentiveInr`, `codFeeInr`, `codMaxOrderInr`, `moharMaxRedeemPct`, `codBlockedPincodes` (CSV), `codEnabled` toggle, `lowStockUrgencyEnabled` toggle (`stock <= 3` on real inventory).

### 8.4 Launch Readiness, Anti-Dark-Pattern & Audit Panels
- **Launch Readiness (`GET /api/admin/launch-readiness`):** Automated readiness checks for legal entity env vars, grievance officer details, Razorpay keys, TRAI SMS DLT config, courier API, GI claim verification count, Firestore connectivity, and CA GST sign-off.
- **Anti-Dark-Pattern Audit Checklist:** Displays active ethical commerce rules from `DARK_PATTERN_CHECKLIST`.
- **Recent Security & Admin Audit Log:** Chronological feed of the latest 60 privileged actions (`action`, `actorEmail`, `details`).

---

## 9. Backend API & Persistence Reference

### 9.1 Admin Endpoints (All protected by `requireAdmin`)
| Method & Path | Purpose | Side Effects |
| :--- | :--- | :--- |
| `GET /api/admin/overview` | Hydrates KPI stats, leads, orders, products, queries, B2B apps, reviews, claims, config, audit logs | Filters `isMock` rows when `ENV=production` |
| `GET /api/admin/launch-readiness` | Live env/Firestore/claims readiness diagnostics | Probes Firestore connection |
| `POST /api/admin/leads` | Manual CRM lead creation | Upserts lead, writes `CREATE_CRM_LEAD` audit |
| `PATCH /api/admin/leads/:id` | Stage, priority, owner, follow-up, value & timeline note update | Appends timeline entries, writes `UPDATE_CRM_LEAD` audit |
| `PATCH /api/admin/orders/:id` | Updates fulfillment status | Updates `updatedAt`, writes `UPDATE_ORDER_STATUS` audit |
| `POST /api/admin/products` | Creates live SKU with HSN GST & B2B tiers | Writes `CREATE_PRODUCT` audit |
| `PATCH /api/admin/products/:id` | Updates price, stock, curated bestseller flag | Recomputes HSN GST & 4 `b2bTiers`, writes `UPDATE_PRODUCT` audit |
| `DELETE /api/admin/products/:id` | Deletes SKU | Writes `DELETE_PRODUCT` audit |
| `PATCH /api/admin/queries/:id` | Updates support/DPDP ticket status & reply | Writes `UPDATE_SUPPORT_QUERY` audit |
| `PATCH /api/admin/b2b/applications/:id` | Approves or rejects B2B onboarding app | Unlocks/locks B2B portal, logs to CRM Lead & Audit Log |
| `PATCH /api/admin/reviews/:id` | Moderates review status | Recomputes derived product ratings, writes audit |
| `PATCH /api/admin/claims/:id` | Updates GI claim verification & certificate reference | Writes `UPDATE_CLAIM_VERIFICATION` audit |
| `PATCH /api/admin/config` | Updates COD, prepaid & Mohar parameters | Writes `UPDATE_ADMIN_CONFIG` audit |
| `POST /api/admin/seed` | Demo seed loader (non-prod only) | Syncs state to Firestore if connected |
| `POST /api/admin/purge-mock` | Purges all mock records | Recomputes product stats & logs audit |

### 9.2 SQL Schema Alignment (`/DB_setup.sql`)
Core relational tables backing these admin workflows:
- `leads`, `lead_interested_products`, `lead_activities` (+ `v_crm_lead_pipeline` view)
- `orders`, `order_items`, `order_gst_invoices` (+ `v_order_gst_summary` view)
- `products`, `product_variants`, `product_b2b_tiers` (+ `v_catalog_summary` view)
- `support_queries`, `reviews`, `heritage_mistake_reports`
- `b2b_applications`, `b2b_quotes`
- `claims_registry`, `store_config`, `audit_logs`

---

## 10. Acceptance Criteria

1. **RBAC Isolation:** Any unauthenticated call to `/api/admin/*` returns `401`; any authenticated non-allowlisted email returns `403`.
2. **CRM Pipeline Integrity:** Storefront login-gated interactions punch lead data into `leads`; manual CRM notes/stage transitions persist in the lead timeline; placing an order marks the buyer's lead `Converted`.
3. **B2B Gate Coupling:** Unapproved users see `b2bTiers: []` and only the onboarding form on `/b2b`. Approving their application in `/admin` immediately enables tiered pricing, RFQ generation, and Net-30 B2B PO placement.
4. **GST & Pricing Integrity:** Creating or editing product pricing in `/admin` enforces valid HSN slabs (`0, 3, 5, 18, 40`) and synchronizes all 4 B2B discount tiers.
5. **Production Safety:** With `ENV=production`, demo seed actions are blocked (`403`) and zero `isMock: true` records appear in storefront APIs or `sitemap.xml`.
