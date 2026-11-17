import React, { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Gift,
  Globe,
  Layers,
  Lock,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { getPatronIdToken } from '../firebase';
import type { B2BApplication, B2BQuote, Product } from '../types';

type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'AED' | 'GBP';

interface FxPayload {
  base: 'INR';
  rates: Record<CurrencyCode, number>;
  updatedAt: string;
  disclaimer: string;
}

const SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  AED: 'AED ',
  GBP: '£',
};

export function B2BView() {
  const { showToast, user, requireAuthForAction } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [applications, setApplications] = useState<B2BApplication[]>([]);
  const [quotes, setQuotes] = useState<B2BQuote[]>([]);
  const [isApprovedTradeAccount, setIsApprovedTradeAccount] = useState(false);

  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [fxData, setFxData] = useState<FxPayload>({
    base: 'INR',
    rates: { INR: 1, USD: 0.012, EUR: 0.011, AED: 0.044, GBP: 0.0095 },
    updatedAt: '',
    disclaimer: 'Display estimates only. All export and B2B orders are invoiced and settled in INR.',
  });

  // Strict B2B-first workflow: only the onboarding form is shown until Admin approves
  const [activeTab, setActiveTab] = useState<'quick-order' | 'gifting' | 'apply' | 'dashboard'>('quick-order');

  // Bulk Quick Order state
  const [bulkQty, setBulkQty] = useState<Record<string, number>>({});
  const [poSubmitting, setPoSubmitting] = useState(false);
  const [poConsent, setPoConsent] = useState(false);

  // Corporate Gifting Builder
  const [giftBudget, setGiftBudget] = useState(1500);
  const [giftQty, setGiftQty] = useState(100);
  const [giftCompany, setGiftCompany] = useState('Maharaja Hospitality Group');
  const [giftEmail, setGiftEmail] = useState('procurement@maharajahotels.example');
  const [customLogo, setCustomLogo] = useState(true);

  // B2B Application form + live Mod-36 GSTIN check
  const [appForm, setAppForm] = useState({
    businessName: '',
    businessType: 'Retail Boutique',
    gstin: '',
    iecCode: '',
    contactName: '',
    email: '',
    phone: '',
    city: 'Jaipur',
    expectedMonthlyVolume: '₹1,00,000 – ₹2,50,000',
  });
  const [gstinCheck, setGstinCheck] = useState<{ valid: boolean; reason?: string } | null>(null);
  const [appError, setAppError] = useState('');
  const [appSubmitting, setAppSubmitting] = useState(false);

  const loadB2BOverview = useCallback(async () => {
    const token = await getPatronIdToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const ovRes = await fetch('/api/b2b/overview', { headers });
      const d = await ovRes.json();
      setApplications(d.applications ?? []);
      setQuotes(d.quotes ?? []);
      const approved = Boolean(d.isApprovedTradeAccount);
      setIsApprovedTradeAccount(approved);

      if (approved) {
        const prodRes = await fetch('/api/products', { headers });
        const prodPayload = await prodRes.json();
        setProducts((prodPayload.products ?? []).slice(0, 18));
      } else {
        setProducts([]);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetch('/api/fx')
      .then((r) => r.json())
      .then((d) => {
        if (d?.rates) setFxData(d);
      })
      .catch(() => {});
    void loadB2BOverview();
  }, [loadB2BOverview, user]);

  useEffect(() => {
    if (!user) return;
    setAppForm((prev) => ({
      ...prev,
      contactName: prev.contactName || user.displayName || '',
      email: prev.email || user.email || '',
      phone: prev.phone || user.phoneNumber || '',
    }));
    if (user.email) {
      setGiftEmail((prev) => (prev === 'procurement@maharajahotels.example' ? user.email! : prev));
    }
  }, [user]);

  const fmt = (inr: number) => {
    const rate = fxData.rates[currency] ?? 1;
    const val = Math.round(inr * rate * 100) / 100;
    return `${SYMBOLS[currency]}${val.toLocaleString('en-IN')}`;
  };

  const getTierPrice = (p: Product, qty: number) => {
    if (!isApprovedTradeAccount) return p.price;
    let unit = p.price;
    for (const tier of p.b2bTiers) {
      if (qty >= tier.minQty) unit = tier.unitPriceInr;
    }
    return unit;
  };

  const bulkLines = products
    .map((p) => {
      const q = bulkQty[p.id] ?? 0;
      return q > 0 ? { product: p, qty: q, unitPrice: getTierPrice(p, q) } : null;
    })
    .filter(Boolean) as { product: Product; qty: number; unitPrice: number }[];

  const bulkTotal = bulkLines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  const handleVerifyGstin = async (val: string) => {
    const trimmed = val.trim().toUpperCase();
    if (trimmed.length !== 15) {
      setGstinCheck({ valid: false, reason: 'Enter 15-character GSTIN to validate Mod-36 checksum.' });
      return;
    }
    const res = await fetch('/api/b2b/gstin-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gstin: trimmed }),
    });
    const data = await res.json();
    setGstinCheck(data);
  };

  const submitBulkOrder = async () => {
    if (!isApprovedTradeAccount) {
      showToast('B2B pricing and ordering unlock only after our team approves your B2B form.');
      return;
    }
    if (bulkLines.length === 0) return;
    if (!poConsent) {
      showToast('Please accept B2B data & invoicing consent before placing a B2B PO.');
      return;
    }
    setPoSubmitting(true);
    try {
      const token = await getPatronIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const approvedApp = applications.find((a) => a.status === 'Approved');
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          idempotencyKey: `b2b-po-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          customerName: approvedApp?.businessName || user?.displayName || 'B2B Partner',
          customerEmail: approvedApp?.email || user?.email || 'procurement@b2b.example',
          customerPhone: approvedApp?.phone || '+91 98291 44501',
          shippingAddress: {
            line1: 'Bhawani Singh Road',
            city: approvedApp?.city || 'Jaipur',
            state: 'Rajasthan',
            pincode: '302005',
            country: 'India',
          },
          shippingState: 'Rajasthan',
          pincode: '302005',
          gstin: approvedApp?.gstin || undefined,
          paymentMethod: 'Net-30',
          dpdpConsentAccepted: true,
          channel: 'B2B',
          items: bulkLines.map((l) => ({
            productId: l.product.id,
            variantId: l.product.variants[0]?.id,
            variantLabel: 'B2B Case Pack',
            quantity: l.qty,
          })),
        }),
      });
      const ord = await res.json();
      if (!res.ok) {
        showToast(ord.error || 'Could not submit B2B order.');
        return;
      }
      setBulkQty({});
      showToast(`B2B PO ${ord.orderNumber} recorded (Total ₹${ord.total.toLocaleString('en-IN')})!`);
    } finally {
      setPoSubmitting(false);
    }
  };

  const submitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApprovedTradeAccount) {
      showToast('Submit your B2B form and await team approval to unlock custom B2B quotes.');
      return;
    }
    const token = await getPatronIdToken();
    if (!token) {
      showToast('Sign in to generate an official B2B RFQ.');
      return;
    }
    const res = await fetch('/api/b2b/quotes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        companyName: giftCompany,
        contactEmail: giftEmail,
        category: 'Gifting & Festive',
        quantity: giftQty,
        customBranding: customLogo,
        packagingType: 'Custom Gold-Foil Haveli Box',
        targetBudgetInr: giftBudget * giftQty,
        notes: `Per-box target ₹${giftBudget}. Custom brand card: ${customLogo ? 'Yes' : 'No'}`,
      }),
    });
    const q = await res.json();
    if (!res.ok) {
      showToast(q.error || 'Unable to create B2B RFQ');
      return;
    }
    setQuotes((prev) => [q, ...prev]);
    showToast(`Instant B2B RFQ ${q.quoteNumber} generated!`);
    setActiveTab('dashboard');
  };

  const handleQuoteTransition = async (id: string, status: 'Approved' | 'Converted') => {
    const token = await getPatronIdToken();
    if (!token) {
      showToast('Sign in with your B2B account to update RFQ status.');
      return;
    }
    const res = await fetch(`/api/b2b/quotes/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok) {
      setQuotes((prev) => prev.map((q) => (q.id === id ? data : q)));
      showToast(`B2B RFQ updated to ${status}`);
    } else {
      showToast(data.error || 'Update not permitted.');
    }
  };

  const executeSubmitApplication = async () => {
    setAppError('');
    setAppSubmitting(true);
    try {
      const token = await getPatronIdToken();
      if (!token) {
        setAppError('Please sign in to submit your B2B onboarding application.');
        return;
      }
      const res = await fetch('/api/b2b/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(appForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setAppError(data.error || 'Submission failed');
        return;
      }
      setApplications((prev) => [data, ...prev]);
      showToast('B2B application submitted! Further B2B features will appear once our team approves your account.');
    } finally {
      setAppSubmitting(false);
    }
  };

  const submitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    requireAuthForAction(
      {
        intent: 'b2b_application',
        sourcePath: '/b2b',
        phone: appForm.phone || undefined,
        note: appForm.businessName ? `B2B Application: ${appForm.businessName}` : 'B2B Partner Onboarding',
      },
      () => {
        void executeSubmitApplication();
      }
    );
  };

  const latestApplication = applications[0];
  const approvedApplication = applications.find((a) => a.status === 'Approved');

  const renderOnboardingFormSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <form
        onSubmit={submitApplication}
        className="lg:col-span-7 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-6 space-y-4 text-sm"
      >
        <div>
          <h2 className="font-display text-2xl font-bold">B2B Account Onboarding Form (Mod-36 GSTIN Checked)</h2>
          <p className="text-xs text-[var(--rh-ink-muted)] mt-1">
            Submit your business details first. Only after our team reviews and approves your application will B2B
            pricing tiers, bulk ordering, and corporate gifting quotes be shown.
          </p>
        </div>
        {appError && <p className="text-xs text-[var(--rh-primary)] font-medium">{appError}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            required
            value={appForm.businessName}
            onChange={(e) => setAppForm({ ...appForm, businessName: e.target.value })}
            placeholder="Registered Business Name *"
            className="px-3 py-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
          />
          <select
            value={appForm.businessType}
            onChange={(e) => setAppForm({ ...appForm, businessType: e.target.value })}
            className="px-3 py-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
          >
            <option>Retail Boutique</option>
            <option>Interior Designer</option>
            <option>Hotel / Resort</option>
            <option>Corporate Gifting</option>
            <option>Export Importer</option>
          </select>

          <div className="sm:col-span-2 space-y-1.5">
            <div className="flex gap-2">
              <input
                required
                maxLength={15}
                value={appForm.gstin}
                onChange={(e) => {
                  const next = e.target.value.toUpperCase();
                  setAppForm({ ...appForm, gstin: next });
                  setGstinCheck(null);
                }}
                placeholder="15-Char GSTIN (e.g. 08AABCR1234F1ZS) *"
                className="flex-1 px-3 py-2.5 font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              />
              <button
                type="button"
                onClick={() => handleVerifyGstin(appForm.gstin)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface-muted)] hover:border-[var(--rh-primary)] cursor-pointer inline-flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Verify Checksum
              </button>
            </div>
            {gstinCheck && (
              <p
                className={`text-xs inline-flex items-center gap-1 ${
                  gstinCheck.valid ? 'text-[var(--rh-peacock)]' : 'text-[var(--rh-primary)]'
                }`}
              >
                {gstinCheck.valid && <CheckCircle2 className="w-3.5 h-3.5" />}
                {gstinCheck.valid ? 'GSTIN format and Mod-36 check digit verified.' : gstinCheck.reason}
              </p>
            )}
          </div>

          <input
            value={appForm.iecCode}
            onChange={(e) => setAppForm({ ...appForm, iecCode: e.target.value })}
            placeholder="IEC Code (Exporters optional)"
            className="px-3 py-2.5 font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
          />
          <input
            required
            value={appForm.contactName}
            onChange={(e) => setAppForm({ ...appForm, contactName: e.target.value })}
            placeholder="Primary Buyer Name *"
            className="px-3 py-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
          />
          <input
            required
            type="email"
            value={appForm.email}
            onChange={(e) => setAppForm({ ...appForm, email: e.target.value })}
            placeholder="Business Email *"
            className="px-3 py-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
          />
          <input
            required
            value={appForm.phone}
            onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })}
            placeholder="WhatsApp / Phone *"
            className="px-3 py-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
          />
          <input
            value={appForm.city}
            onChange={(e) => setAppForm({ ...appForm, city: e.target.value })}
            placeholder="City"
            className="px-3 py-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
          />
          <select
            value={appForm.expectedMonthlyVolume}
            onChange={(e) => setAppForm({ ...appForm, expectedMonthlyVolume: e.target.value })}
            className="px-3 py-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
          >
            <option>₹50,000 – ₹1,00,000</option>
            <option>₹1,00,000 – ₹2,50,000</option>
            <option>₹2,50,000 – ₹10,00,000</option>
            <option>₹10,00,000+ / Export</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={appSubmitting}
          className="px-6 py-3 text-sm font-semibold rounded-lg bg-[var(--rh-primary)] text-white cursor-pointer disabled:opacity-50"
        >
          {appSubmitting
            ? 'Submitting B2B Form…'
            : user
              ? 'Submit B2B Application'
              : 'Sign In & Submit B2B Application'}
        </button>
      </form>

      <div className="lg:col-span-5 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-xl font-bold">Your B2B Onboarding Status</h3>
          {!isApprovedTradeAccount && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#C9A227]/15 text-[#B86E00] text-[11px] font-semibold">
              <Lock className="w-3 h-3" /> Approval Gated
            </span>
          )}
        </div>

        {applications.length === 0 ? (
          <div className="space-y-3 text-xs text-[var(--rh-ink-muted)] leading-relaxed">
            <p>
              Every buyer starts here by submitting the B2B Onboarding Form. Once our Jaipur B2B desk reviews your
              GSTIN and approves your account, further B2B pricing tiers, bulk PO ordering, and corporate gifting quotes
              will appear automatically on this page.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.slice(0, 4).map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-xl bg-[var(--rh-bg)] border border-[var(--rh-border)] space-y-1.5 text-xs"
              >
                <div className="flex justify-between font-semibold text-sm">
                  <span>{app.businessName}</span>
                  <span
                    className={`inline-flex items-center gap-1 ${
                      app.status === 'Approved'
                        ? 'text-[var(--rh-peacock)]'
                        : app.status === 'Rejected'
                          ? 'text-[var(--rh-primary)]'
                          : 'text-[#B86E00]'
                    }`}
                  >
                    {app.status === 'Approved' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : app.status === 'Rejected' ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    {app.status}
                  </span>
                </div>
                <p className="font-mono-num text-[var(--rh-ink-muted)]">GSTIN: {app.gstin}</p>
                <p className="text-[var(--rh-ink-muted)]">
                  Submitted: {new Date(app.createdAt).toLocaleDateString('en-IN')}
                </p>
                {app.status === 'Pending Review' && (
                  <p className="text-[11px] text-[#B86E00] pt-0.5">
                    Under review by our team. B2B pricing and bulk ordering will appear once approved.
                  </p>
                )}
                {app.status === 'Rejected' && (
                  <p className="text-[11px] text-[var(--rh-primary)] pt-0.5">
                    Application was not approved. You may update your details and submit again.
                  </p>
                )}
                {app.status === 'Approved' && (
                  <p className="inline-flex items-center gap-1 text-[var(--rh-peacock)] font-medium pt-1">
                    <Check className="w-3.5 h-3.5" /> B2B Pricing Unlocked · Credit Limit: ₹
                    {app.creditLimitInr.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div className="bg-[#2A1410] dark:bg-[#171C3A] text-[#FBF3E4] rounded-2xl p-5 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#F4B400]">
            Rangrez Haveli · B2B &amp; Export Portal
          </p>
          <h1 className="font-display text-2xl sm:text-4xl font-bold">
            B2B Crafts, White-Label &amp; Hospitality Sourcing
          </h1>
          <p className="text-xs sm:text-sm text-[#F6EBD6]/80">
            {isApprovedTradeAccount
              ? `Approved B2B Partner${approvedApplication ? `: ${approvedApplication.businessName}` : ''}. Access tiered B2B pricing, corporate gifting quotes, and Net-30 invoicing.`
              : 'Complete the B2B onboarding form first. Only after getting approval from our Jaipur team will B2B pricing, bulk orders, and custom RFQs be shown.'}
          </p>
          {isApprovedTradeAccount && currency !== 'INR' && (
            <p className="text-[11px] text-[#F4B400] font-mono-num">
              {fxData.disclaimer}{' '}
              {fxData.updatedAt ? `· Rates refreshed ${new Date(fxData.updatedAt).toLocaleDateString('en-IN')}` : ''}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {isApprovedTradeAccount ? (
            <>
              <div className="inline-flex items-center gap-2 bg-white/10 px-3 min-h-[42px] rounded-lg text-xs">
                <Globe className="w-4 h-4 text-[#F4B400]" />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  aria-label="Export display currency"
                  className="bg-transparent font-mono-num font-semibold focus:outline-none cursor-pointer"
                >
                  {(['INR', 'USD', 'EUR', 'AED', 'GBP'] as CurrencyCode[]).map((c) => (
                    <option key={c} value={c} className="text-[#2A1410]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => showToast('B2B Line-Sheet summary prepared from your approved tier view')}
                className="px-4 min-h-[42px] text-xs font-semibold rounded-lg bg-[#F28C1B] text-[#2A1410] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> B2B Line-Sheet
              </button>
            </>
          ) : (
            <span className="px-3.5 py-2 rounded-lg bg-white/10 border border-white/20 text-xs font-semibold inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#F4B400]" />
              {latestApplication ? `Status: ${latestApplication.status}` : 'B2B Form & Team Approval Required'}
            </span>
          )}
        </div>
      </div>

      {/* BEFORE APPROVAL: Only show the B2B onboarding form & approval status — hide further B2B tabs/pricing/RFQs */}
      {!isApprovedTradeAccount ? (
        <div className="space-y-5">
          {latestApplication && latestApplication.status === 'Pending Review' && (
            <div className="p-4 sm:p-5 rounded-xl bg-[#C9A227]/12 border border-[#C9A227]/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#B86E00] shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="font-semibold text-[var(--rh-ink)]">
                    B2B Form Received for {latestApplication.businessName} (Pending Team Approval)
                  </p>
                  <p className="text-xs text-[var(--rh-ink-muted)] mt-0.5">
                    Our Jaipur B2B desk is reviewing GSTIN <span className="font-mono-num">{latestApplication.gstin}</span>.
                    B2B pricing, bulk ordering, and corporate gifting quotes will unlock automatically once approved.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-md bg-[var(--rh-surface)] border border-[var(--rh-border)] text-xs font-semibold text-[#B86E00] shrink-0 self-start sm:self-center">
                Pending Review
              </span>
            </div>
          )}

          {renderOnboardingFormSection()}
        </div>
      ) : (
        <>
          {/* AFTER APPROVAL: Show further B2B tabs, tiered pricing, bulk PO ordering & gifting RFQs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'quick-order' as const, label: 'B2B Pricing & Bulk Order', icon: FileSpreadsheet },
              { id: 'gifting' as const, label: 'Corporate Gifting RFQs', icon: Gift },
              { id: 'dashboard' as const, label: `B2B Status & Quotes (${quotes.length})`, icon: Layers },
              { id: 'apply' as const, label: 'B2B Onboarding Form', icon: Building2 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 min-h-[42px] py-2 text-xs font-semibold rounded-lg inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[var(--rh-primary)] text-white'
                      : 'bg-[var(--rh-surface)] border border-[var(--rh-border)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === 'quick-order' && (
            <div className="space-y-6">
              <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--rh-surface-muted)]/60 text-xs uppercase text-[var(--rh-ink-muted)]">
                    <tr>
                      <th className="py-3 px-4">SKU &amp; Craft</th>
                      <th className="py-3 px-4">HSN / GST</th>
                      <th className="py-3 px-4">Retail (INR/FX)</th>
                      <th className="py-3 px-4">10+ (-12%)</th>
                      <th className="py-3 px-4">25+ (-22%)</th>
                      <th className="py-3 px-4">50+ (-32%)</th>
                      <th className="py-3 px-4">100+ (-40%)</th>
                      <th className="py-3 px-4">Order Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--rh-border)] font-mono-num">
                    {products.map((p) => {
                      const q = bulkQty[p.id] ?? 0;
                      return (
                        <tr key={p.id} className="hover:bg-[var(--rh-surface-muted)]/30">
                          <td className="py-3 px-4 font-sans">
                            <p className="font-semibold text-[var(--rh-ink)]">{p.name}</p>
                            <p className="text-xs text-[var(--rh-ink-muted)] font-mono-num">
                              {p.sku} · MOQ {p.moq} · {p.leadTimeDays}d lead
                            </p>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {p.hsnCode} · {p.gstRate}%
                          </td>
                          <td className="py-3 px-4 text-xs">{fmt(p.price)}</td>
                          {p.b2bTiers.map((tier) => (
                            <td key={tier.minQty} className="py-3 px-4 text-xs">
                              {fmt(tier.unitPriceInr)}
                            </td>
                          ))}
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min={0}
                              step={5}
                              aria-label={`B2B quantity for ${p.name}`}
                              value={q}
                              onChange={(e) =>
                                setBulkQty((prev) => ({
                                  ...prev,
                                  [p.id]: Math.max(0, Number(e.target.value)),
                                }))
                              }
                              className="w-20 px-2 py-1.5 text-xs rounded border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-5 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)] space-y-4">
                <label className="flex items-start gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={poConsent}
                    onChange={(e) => setPoConsent(e.target.checked)}
                    className="mt-0.5 accent-[#B3123F]"
                  />
                  <span className="text-[var(--rh-ink-muted)]">
                    I authorise Rangrez Haveli to process our business GSTIN &amp; B2B contact details for invoice
                    issuance in INR (server recomputes HSN GST breakup).
                  </span>
                </label>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-[var(--rh-ink-muted)]">
                      Estimated Ex-Jaipur B2B Total ({bulkLines.length} SKUs · Settled in INR)
                    </p>
                    <p className="font-mono-num text-2xl font-bold">{fmt(bulkTotal)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={submitBulkOrder}
                    disabled={bulkLines.length === 0 || poSubmitting}
                    className="px-6 py-3 text-sm font-semibold rounded-lg bg-[var(--rh-primary)] text-white disabled:opacity-40 cursor-pointer"
                  >
                    {poSubmitting ? 'Submitting PO…' : 'Place Net-30 B2B Order'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gifting' && (
            <form onSubmit={submitQuote} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-6 space-y-5">
                <h2 className="font-display text-2xl font-bold">Corporate &amp; Wedding Gifting Builder</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <label className="text-xs text-[var(--rh-ink-muted)]">Company / Event Name</label>
                    <input
                      required
                      value={giftCompany}
                      onChange={(e) => setGiftCompany(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[var(--rh-ink-muted)]">Contact Email</label>
                    <input
                      required
                      type="email"
                      value={giftEmail}
                      onChange={(e) => setGiftEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[var(--rh-ink-muted)]">Budget per Box (INR): ₹{giftBudget}</label>
                    <input
                      type="range"
                      min={500}
                      max={5000}
                      step={250}
                      value={giftBudget}
                      onChange={(e) => setGiftBudget(Number(e.target.value))}
                      className="w-full accent-[#B3123F]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-[var(--rh-ink-muted)]">Box Quantity (Min 25): {giftQty}</label>
                    <input
                      type="number"
                      min={25}
                      value={giftQty}
                      onChange={(e) => setGiftQty(Number(e.target.value))}
                      className="w-full px-3 py-2 font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customLogo}
                    onChange={(e) => setCustomLogo(e.target.checked)}
                    className="accent-[#B3123F]"
                  />
                  <span>Include custom company logo foil-stamp &amp; artisan story card</span>
                </label>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-semibold rounded-lg bg-[var(--rh-primary)] text-white cursor-pointer"
                >
                  Generate Instant B2B Quote
                </button>
              </div>

              <div className="lg:col-span-5 bg-[var(--rh-surface)] border border-[#C9A227]/40 rounded-2xl p-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--rh-peacock)]">
                  Live Packaging Preview
                </p>
                <div className="p-6 rounded-xl bg-[#2A1410] text-[#FBF3E4] text-center space-y-2 border border-[#C9A227]">
                  <p className="text-xs tracking-widest uppercase text-[#F4B400]">Custom Gold-Foil Sleeve</p>
                  <p className="font-display text-2xl font-bold">{customLogo ? giftCompany : 'Rangrez Haveli'}</p>
                  <p className="text-xs opacity-75">Curated with Jaipur Blue Pottery, Brass Diya &amp; Kulhad Set</p>
                </div>
                <div className="text-sm space-y-1 font-mono-num">
                  <div className="flex justify-between">
                    <span>Estimated Order Value</span>
                    <span>{fmt(giftBudget * giftQty)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--rh-peacock)]">
                    <span>Quoted Corporate Total (-8%)</span>
                    <span>{fmt(Math.round(giftBudget * giftQty * 0.92))}</span>
                  </div>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-6 space-y-4">
                <h2 className="font-display text-xl font-bold">Recent B2B RFQs &amp; Custom Quotes</h2>
                {quotes.length === 0 ? (
                  <p className="text-xs text-[var(--rh-ink-muted)]">No B2B quotes scoped to your session yet.</p>
                ) : (
                  <div className="divide-y divide-[var(--rh-border)] text-sm">
                    {quotes.slice(0, 10).map((q) => (
                      <div key={q.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{q.companyName}</p>
                          <p className="text-xs text-[var(--rh-ink-muted)] font-mono-num">
                            {q.quoteNumber} · {q.quantity} units · {q.category} · {q.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-num font-bold">{fmt(q.quotedTotalInr)}</span>
                          {q.status === 'Quoted' && (
                            <button
                              type="button"
                              onClick={() => handleQuoteTransition(q.id, 'Approved')}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded bg-[var(--rh-peacock)] text-white cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {q.status === 'Approved' && (
                            <button
                              type="button"
                              onClick={() => handleQuoteTransition(q.id, 'Converted')}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded bg-[var(--rh-primary)] text-white cursor-pointer"
                            >
                              Convert PO
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-6 space-y-4">
                <h2 className="font-display text-xl font-bold">B2B Account Status</h2>
                {applications.slice(0, 6).map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-lg bg-[var(--rh-bg)] border border-[var(--rh-border)] space-y-1 text-xs"
                  >
                    <div className="flex justify-between font-semibold text-sm">
                      <span>{app.businessName}</span>
                      <span
                        className={
                          app.status === 'Approved'
                            ? 'text-[var(--rh-peacock)]'
                            : app.status === 'Rejected'
                              ? 'text-[var(--rh-primary)]'
                              : 'text-[var(--rh-kesariya)]'
                        }
                      >
                        {app.status}
                      </span>
                    </div>
                    <p className="font-mono-num text-[var(--rh-ink-muted)]">GSTIN: {app.gstin}</p>
                    {app.creditLimitInr > 0 && (
                      <p className="inline-flex items-center gap-1 text-[var(--rh-peacock)] font-medium">
                        <Check className="w-3.5 h-3.5" /> Net-30 Credit Approved: {fmt(app.creditLimitInr)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'apply' && renderOnboardingFormSection()}
        </>
      )}
    </div>
  );
}
