import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  Send,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { useStore, type LegalPageKey } from '../context/StoreContext';
import { useConsent } from '../context/ConsentContext';
import { getPatronIdToken } from '../firebase';
import { DARK_PATTERN_CHECKLIST } from '../config/heritageConstants';
import type { SupportQuery } from '../types';

const DOC_TABS: { id: LegalPageKey; label: string }[] = [
  { id: 'privacy', label: 'Privacy & DPDP' },
  { id: 'terms', label: 'Terms of Use' },
  { id: 'shipping', label: 'Shipping Policy' },
  { id: 'returns', label: 'Returns & Refunds' },
  { id: 'cancellation', label: 'Cancellations' },
  { id: 'contact', label: 'Contact & Grievance' },
  { id: 'faq', label: 'Buyer FAQ' },
  { id: 'fair-design', label: 'Fair Design & GI Claims' },
];

export function LegalDocView({ doc }: { doc: LegalPageKey }) {
  const { legalConfig, adminConfig, claimsRegistry, guildMetrics, navigate, user, showToast } = useStore();
  const { openPreferences, consent } = useConsent();

  const [ticketForm, setTicketForm] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
    category: 'Order & Shipping' as SupportQuery['category'],
    orderNumber: '',
    subject: '',
    message: '',
  });
  const [ticketBusy, setTicketBusy] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<SupportQuery | null>(null);

  useEffect(() => {
    if (!user) return;
    setTicketForm((prev) => ({
      ...prev,
      name: prev.name || user.displayName || '',
      email: prev.email || user.email || '',
      phone: prev.phone || user.phoneNumber || '',
    }));
  }, [user]);

  const submitSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketBusy(true);
    try {
      const token = await getPatronIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers,
        body: JSON.stringify(ticketForm),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Could not submit support ticket.');
        return;
      }
      setSubmittedTicket(data.query);
      setTicketForm((prev) => ({ ...prev, orderNumber: '', subject: '', message: '' }));
      showToast(`Support ticket ${data.query.ticketNumber} created.`);
    } finally {
      setTicketBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="border-b border-[var(--rh-border)] pb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--rh-primary)] inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Store Transparency &amp; Legal Charter
        </p>
        <h1 className="font-display text-3xl font-bold mt-1">
          {DOC_TABS.find((t) => t.id === doc)?.label || 'Store Policy'}
        </h1>
        <p className="text-xs text-[var(--rh-ink-muted)] mt-1 font-mono-num">
          Entity: {legalConfig.legalEntityName} · GSTIN: {legalConfig.legalGstin}
        </p>
      </div>

      {/* Navigation between legal pages */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" role="tablist" aria-label="Policy Documents">
        {DOC_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={doc === tab.id}
            onClick={() => navigate({ page: 'legal', doc: tab.id })}
            className={`px-3.5 min-h-[40px] text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer border ${
              doc === tab.id
                ? 'bg-[var(--rh-primary)] text-white border-[var(--rh-primary)]'
                : 'bg-[var(--rh-surface)] border-[var(--rh-border)] text-[var(--rh-ink)] hover:border-[var(--rh-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-6 sm:p-8 space-y-6 text-sm leading-relaxed">
        {doc === 'privacy' && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--rh-surface-muted)]/60 border border-[var(--rh-border)]">
              <div>
                <p className="font-semibold">Digital Personal Data Protection (DPDP Act) Preferences</p>
                <p className="text-xs text-[var(--rh-ink-muted)] mt-0.5">
                  Analytics: {consent?.analytics ? 'Consented' : 'Off'} · Marketing:{' '}
                  {consent?.marketing ? 'Consented' : 'Off'}
                </p>
              </div>
              <button
                type="button"
                onClick={openPreferences}
                className="px-4 min-h-[40px] rounded-lg bg-[var(--rh-primary)] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer self-start"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Manage Consent
              </button>
            </div>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-bold">1. Data Fiduciary &amp; Purpose</h2>
              <p className="text-[var(--rh-ink-muted)]">
                Personal data collected during checkout or account sign-in (name, delivery address, phone, email, and
                optional GSTIN) is processed strictly to fulfil handcrafted orders, generate HSN GST tax invoices,
                coordinate courier dispatch, and prevent COD fraud.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-bold">2. Right to Access, Export &amp; Erasure</h2>
              <p className="text-[var(--rh-ink-muted)]">
                Signed-in patrons can download a machine-readable JSON copy of all personal orders, reviews, wishlist
                IDs, and Mohar balances—or trigger immediate account erasure and order-record anonymisation—directly
                from{' '}
                <button
                  type="button"
                  onClick={() => navigate({ page: 'account' })}
                  className="text-[var(--rh-primary)] font-semibold underline cursor-pointer"
                >
                  Account → Privacy &amp; Data Controls
                </button>
                .
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl font-bold">3. Grievance Officer</h2>
              <p className="text-[var(--rh-ink-muted)]">
                Officer: <span className="font-mono-num">{legalConfig.grievanceOfficerName}</span> · Email:{' '}
                <span className="font-mono-num">{legalConfig.grievanceOfficerEmail}</span> · Phone:{' '}
                <span className="font-mono-num">{legalConfig.grievanceOfficerPhone}</span>
              </p>
            </section>
          </>
        )}

        {doc === 'terms' && (
          <>
            <section className="space-y-2">
              <h2 className="font-display text-xl font-bold">1. Artisan Handmade Variance</h2>
              <p className="text-[var(--rh-ink-muted)]">
                Every creation is crafted by hand using natural mineral pigments, carved teak blocks, or handloom
                shuttles. Subtle variations in motif registration or glaze depth reflect authentic craft rather than
                defects.
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="font-display text-xl font-bold">2. Pricing, GST &amp; Order Acceptance</h2>
              <p className="text-[var(--rh-ink-muted)]">
                All displayed D2C prices are inclusive of applicable Indian GST calculated per HSN classification (0%,
                3%, 5%, 18%, or 40% as notified by the GST Council; the 12% slab was discontinued on 22 September
                2025). Server-side verification governs final order totals, stock reservation, and coupon eligibility.
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="font-display text-xl font-bold">3. Legal Entity Disclosure</h2>
              <p className="text-[var(--rh-ink-muted)] font-mono-num text-xs">
                Legal Name: {legalConfig.legalEntityName} · Registered Office: {legalConfig.legalAddress} · GSTIN:{' '}
                {legalConfig.legalGstin}
              </p>
            </section>
          </>
        )}

        {doc === 'shipping' && (
          <>
            <section className="space-y-2">
              <h2 className="font-display text-xl font-bold">Dispatch &amp; Serviceability</h2>
              <p className="text-[var(--rh-ink-muted)]">
                Orders ship from our Jaipur fulfilment hub. Free standard shipping applies on orders of ₹
                {adminConfig.freeShippingThresholdInr.toLocaleString('en-IN')} or above; orders below this threshold
                carry a flat ₹{adminConfig.standardShippingFeeInr} courier fee. Live pincode serviceability and transit
                windows are confirmed via our courier partner API at checkout.
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="font-display text-xl font-bold">Cash on Delivery Rules</h2>
              <p className="text-[var(--rh-ink-muted)]">
                {adminConfig.codEnabled
                  ? `COD is eligible on orders up to ₹${adminConfig.codMaxOrderInr.toLocaleString(
                      'en-IN'
                    )} for serviceable pincodes with an explicit ₹${
                      adminConfig.codFeeInr
                    } COD handling fee disclosed prior to checkout confirmation.`
                  : 'Cash on Delivery is currently disabled.'}
              </p>
            </section>
          </>
        )}

        {doc === 'returns' && (
          <>
            <section className="space-y-2">
              <h2 className="font-display text-xl font-bold">
                {adminConfig.defaultReturnWindowDays}-Day Return &amp; Transit Breakage Policy
              </h2>
              <p className="text-[var(--rh-ink-muted)]">
                Unused items in original packaging with tags intact are eligible for return or exchange within{' '}
                {adminConfig.defaultReturnWindowDays} days of delivery. Fragile crafts such as Jaipur Blue Pottery or
                Pratapgarh Thewa damaged in transit are replaced or refunded in full upon unboxing photo verification
                within 48 hours of delivery.
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="font-display text-xl font-bold">Refund Timeline</h2>
              <p className="text-[var(--rh-ink-muted)]">
                Prepaid UPI/Card/Netbanking refunds are credited to the original payment instrument within 5–7 business
                days after quality check. Custom monogrammed or bulk B2B orders follow the signed RFQ terms.
              </p>
            </section>
          </>
        )}

        {doc === 'cancellation' && (
          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold">Order Cancellation</h2>
            <p className="text-[var(--rh-ink-muted)]">
              Orders in the &ldquo;Confirmed&rdquo; stage may be cancelled for a full refund before courier manifest.
              Write to <span className="font-mono-num">{legalConfig.supportEmail}</span> quoting your{' '}
              <span className="font-mono-num">RH-2026-XXXX</span> order number.
            </p>
          </section>
        )}

        {doc === 'contact' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-[var(--rh-bg)] border border-[var(--rh-border)] space-y-2">
                <h2 className="font-display text-lg font-bold inline-flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[var(--rh-primary)]" /> Patron Concierge &amp; Trade Desk
                </h2>
                <p className="text-xs text-[var(--rh-ink-muted)]">
                  Support Email: <span className="font-mono-num">{legalConfig.supportEmail}</span>
                </p>
                <p className="text-xs text-[var(--rh-ink-muted)]">
                  Registered Address: <span className="font-mono-num">{legalConfig.legalAddress}</span>
                </p>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'track-order' })}
                  className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--rh-primary)] text-white cursor-pointer"
                >
                  Track Existing Order
                </button>
              </div>

              <div className="p-5 rounded-xl bg-[var(--rh-bg)] border border-[var(--rh-border)] space-y-2">
                <h2 className="font-display text-lg font-bold inline-flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--rh-peacock)]" /> Statutory Grievance Officer
                </h2>
                <p className="text-xs text-[var(--rh-ink-muted)]">
                  Officer: <span className="font-mono-num">{legalConfig.grievanceOfficerName}</span>
                </p>
                <p className="text-xs text-[var(--rh-ink-muted)]">
                  Email: <span className="font-mono-num">{legalConfig.grievanceOfficerEmail}</span>
                </p>
                <p className="text-xs text-[var(--rh-ink-muted)]">
                  Phone: <span className="font-mono-num">{legalConfig.grievanceOfficerPhone}</span>
                </p>
                <p className="text-xs text-[var(--rh-ink-muted)] inline-flex items-center gap-1 pt-1">
                  <Clock className="w-3.5 h-3.5" /> Acknowledgement within 48h · Resolution within 30 days
                </p>
              </div>
            </div>

            <form
              onSubmit={submitSupportTicket}
              className="p-5 sm:p-6 rounded-xl bg-[var(--rh-bg)] border border-[var(--rh-border)] space-y-4"
            >
              <div>
                <h2 className="font-display text-xl font-bold">Submit a Customer Query or Grievance Ticket</h2>
                <p className="text-xs text-[var(--rh-ink-muted)] mt-0.5">
                  Tickets route straight to our Jaipur Admin Queries &amp; CRM Desk for rapid resolution.
                </p>
              </div>

              {submittedTicket && (
                <div className="p-3.5 rounded-lg bg-[#0F7B6C]/15 border border-[#0F7B6C]/40 text-xs text-[#0F7B6C] space-y-0.5">
                  <p className="font-semibold">
                    Ticket Recorded: <span className="font-mono-num">{submittedTicket.ticketNumber}</span>
                  </p>
                  <p>Subject: {submittedTicket.subject} · Our concierge team will respond shortly.</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <input
                  required
                  value={ticketForm.name}
                  onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                  placeholder="Full Name *"
                  className="min-h-[42px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)]"
                />
                <input
                  required
                  type="email"
                  value={ticketForm.email}
                  onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                  placeholder="Email Address *"
                  className="min-h-[42px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)]"
                />
                <input
                  value={ticketForm.phone}
                  onChange={(e) => setTicketForm({ ...ticketForm, phone: e.target.value })}
                  placeholder="Phone / WhatsApp (+91...)"
                  className="min-h-[42px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)] font-mono-num"
                />
                <select
                  value={ticketForm.category}
                  onChange={(e) =>
                    setTicketForm({ ...ticketForm, category: e.target.value as SupportQuery['category'] })
                  }
                  className="min-h-[42px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)]"
                >
                  <option value="Order & Shipping">Order &amp; Shipping</option>
                  <option value="Product Care">Product Care</option>
                  <option value="B2B Inquiry">B2B Inquiry</option>
                  <option value="Return / Damage">Return / Damage</option>
                  <option value="Grievance (DPDP)">Grievance (DPDP)</option>
                </select>
                <input
                  value={ticketForm.orderNumber}
                  onChange={(e) => setTicketForm({ ...ticketForm, orderNumber: e.target.value })}
                  placeholder="Order Number (optional, e.g. RH-2026-1024)"
                  className="min-h-[42px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)] font-mono-num"
                />
                <input
                  required
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  placeholder="Subject *"
                  className="min-h-[42px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)]"
                />
              </div>

              <textarea
                required
                rows={4}
                value={ticketForm.message}
                onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                placeholder="Describe your order question, craft inquiry, return request, or grievance..."
                className="w-full p-3 text-xs rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)]"
              />

              <button
                type="submit"
                disabled={ticketBusy}
                className="px-5 min-h-[42px] rounded-lg bg-[var(--rh-primary)] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{ticketBusy ? 'Submitting Ticket…' : 'Submit Support Query'}</span>
              </button>
            </form>
          </div>
        )}

        {doc === 'faq' && (
          <div className="space-y-3">
            {[
              {
                q: 'How are product reviews verified?',
                a: 'Reviews marked "Verified Purchase" can only be posted by a patron whose order for that exact SKU has reached the Delivered stage. Any seeded demonstration reviews are clearly labelled "Sample review" and excluded in production.',
              },
              {
                q: 'How does the Mohar loyalty credit work?',
                a: `Signed-in patrons earn ${adminConfig.moharEarnRatePct}% back in Mohar coins on completed orders (1 Mohar = ₹1) and may redeem up to ${adminConfig.moharMaxRedeemPct}% of order value when not combining with a coupon code.`,
              },
              {
                q: 'Why do some products show 5% GST and others 18% or 3%?',
                a: 'Indian GST slabs are driven strictly by HSN tariff codes: Thewa & artisan jewellery carry 3% GST; apparel and home made-ups carry 5% up to ₹2,500 per piece and 18% above ₹2,500; Blue Pottery and wooden handicrafts carry 5%.',
              },
              {
                q: 'How is the 52% maker share calculated?',
                a: guildMetrics.methodologyNote,
              },
            ].map((item) => (
              <details key={item.q} className="p-4 rounded-xl bg-[var(--rh-bg)] border border-[var(--rh-border)]">
                <summary className="font-semibold cursor-pointer">{item.q}</summary>
                <p className="text-xs text-[var(--rh-ink-muted)] mt-2">{item.a}</p>
              </details>
            ))}
          </div>
        )}

        {doc === 'fair-design' && (
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold">Anti-Dark-Pattern Compliance Standards</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DARK_PATTERN_CHECKLIST.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-3.5 rounded-xl bg-[var(--rh-bg)] border border-[var(--rh-border)] flex items-start gap-2.5 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[var(--rh-peacock)] shrink-0 mt-0.5" />
                    <span>{rule.rule}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold">Geographical Indication (GI) Claims Registry</h2>
              <p className="text-xs text-[var(--rh-ink-muted)]">
                &ldquo;GI Tagged&rdquo; badges render on storefront cards ONLY when the backing claim record carries an
                Admin-verified IP India registry URL and certificate reference. Otherwise cards display traditional craft
                origin wording.
              </p>
              <div className="overflow-x-auto border border-[var(--rh-border)] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--rh-surface-muted)]/60 uppercase text-[var(--rh-ink-muted)]">
                    <tr>
                      <th className="py-2.5 px-3">Craft Subject</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Registry Reference</th>
                      <th className="py-2.5 px-3">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--rh-border)]">
                    {claimsRegistry.map((c) => (
                      <tr key={c.id}>
                        <td className="py-2.5 px-3 font-semibold">{c.subject}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold ${
                              c.verified
                                ? 'bg-[#0F7B6C]/15 text-[#0F7B6C]'
                                : 'bg-[var(--rh-surface-muted)] text-[var(--rh-ink-muted)]'
                            }`}
                          >
                            {c.verified ? 'Verified GI' : 'Pending Registry Audit'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono-num">{c.registryReference || 'Pending'}</td>
                        <td className="py-2.5 px-3">
                          {c.sourceUrl ? (
                            <a
                              href={c.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[var(--rh-primary)] hover:underline"
                            >
                              {c.sourceName} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            c.sourceName
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
