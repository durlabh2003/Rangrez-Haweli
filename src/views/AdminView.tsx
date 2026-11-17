import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Database,
  Lock,
  LogIn,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { getPatronIdToken } from '../firebase';
import { DARK_PATTERN_CHECKLIST } from '../config/heritageConstants';
import type {
  AdminConfig,
  AuditEntry,
  B2BApplication,
  CategorySlug,
  ClaimRecord,
  HeritageMistakeReport,
  Lead,
  LeadIntentType,
  LeadPriority,
  LeadStage,
  Order,
  Product,
  Review,
  SupportQuery,
} from '../types';

interface AdminOverview {
  isProduction: boolean;
  stats: {
    totalProducts: number;
    mockProducts: number;
    realProducts: number;
    totalOrders: number;
    realOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    pendingB2BApps: number;
    activeQuotes: number;
    pendingReviews: number;
    verifiedClaims: number;
    totalClaims: number;
    totalLeads: number;
    openLeads: number;
    highPriorityLeads: number;
    pipelineValueInr: number;
    openQueries: number;
  };
  products: Product[];
  orders: Order[];
  applications: B2BApplication[];
  leads: Lead[];
  supportQueries: SupportQuery[];
  reviews: Review[];
  claims: ClaimRecord[];
  config: AdminConfig;
  auditLogs: AuditEntry[];
  heritageMistakeReports: HeritageMistakeReport[];
}

interface LaunchReadiness {
  firestore: { connected: boolean; note: string };
  todos: { id: string; label: string; done: boolean }[];
  readyCount: number;
  totalCount: number;
}

const LEAD_STAGES: LeadStage[] = [
  'New Lead',
  'Contacted',
  'Qualified',
  'Proposal Sent',
  'Converted',
  'Lost',
];

const LEAD_PRIORITIES: LeadPriority[] = ['Low', 'Medium', 'High'];

const STAGE_STYLE: Record<LeadStage, string> = {
  'New Lead': 'bg-[#F28C1B]/15 text-[#B86E00]',
  Contacted: 'bg-[#1D4E89]/15 text-[#1D4E89]',
  Qualified: 'bg-[#0F7B6C]/15 text-[#0F7B6C]',
  'Proposal Sent': 'bg-[#C9A227]/20 text-[#8A6D00]',
  Converted: 'bg-[#0F7B6C] text-white',
  Lost: 'bg-[var(--rh-surface-muted)] text-[var(--rh-ink-muted)]',
};

const INTENT_DISPLAY: Record<LeadIntentType, string> = {
  product_click: 'Product Click',
  add_to_cart: 'Add to Bag',
  wishlist_like: 'Wishlist Like',
  buy_now: 'Buy Now',
  checkout_start: 'Checkout Start',
  stock_alert: 'Stock Alert',
  b2b_application: 'B2B Onboarding',
  b2b_quote: 'B2B Quote',
  contact_query: 'Support Query',
};

export function AdminView() {
  const { showToast, user, authReady, authBusy, signInWithGoogle, refreshStoreConfig } = useStore();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [readiness, setReadiness] = useState<LaunchReadiness | null>(null);
  const [authError, setAuthError] = useState<'unauthenticated' | 'forbidden' | null>(null);
  const [tab, setTab] = useState<'crm' | 'orders' | 'products' | 'queries' | 'b2b-config'>('crm');
  const [busy, setBusy] = useState(false);

  // CRM Leads state
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStageFilter, setLeadStageFilter] = useState<string>('all');
  const [leadIntentFilter, setLeadIntentFilter] = useState<string>('all');
  const [leadChannelFilter, setLeadChannelFilter] = useState<'all' | 'D2C' | 'B2B'>('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [manualLead, setManualLead] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    city: 'Jaipur',
    channel: 'D2C' as 'D2C' | 'B2B',
    stage: 'New Lead' as LeadStage,
    priority: 'Medium' as LeadPriority,
    estimatedValueInr: 2500,
    note: '',
  });
  const [leadDraft, setLeadDraft] = useState<{
    stage: LeadStage;
    priority: LeadPriority;
    assignedTo: string;
    nextFollowUpAt: string;
    estimatedValueInr: number;
    lossReason: string;
    note: string;
  }>({
    stage: 'New Lead',
    priority: 'Medium',
    assignedTo: '',
    nextFollowUpAt: '',
    estimatedValueInr: 0,
    lossReason: '',
    note: '',
  });

  // Orders Management state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderChannelFilter, setOrderChannelFilter] = useState<'all' | 'D2C' | 'B2B'>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Products Management state
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productEdits, setProductEdits] = useState<
    Record<string, { price: number; stock: number; isCuratedBestseller: boolean }>
  >({});
  const [newProd, setNewProd] = useState({
    name: '',
    category: 'textiles-apparel' as CategorySlug,
    price: 1899,
    stock: 15,
    region: 'Jaipur',
    craftType: 'Sanganeri Block Print',
    hsnCode: '6204',
  });

  // Support Queries Management state
  const [queryStatusFilter, setQueryStatusFilter] = useState<string>('all');
  const [querySearch, setQuerySearch] = useState('');
  const [queryReplies, setQueryReplies] = useState<
    Record<string, { status: SupportQuery['status']; adminReply: string }>
  >({});

  // Config & GI Claims state
  const [configDraft, setConfigDraft] = useState<AdminConfig | null>(null);
  const [claimDrafts, setClaimDrafts] = useState<
    Record<string, { sourceUrl: string; registryReference: string; verified: boolean }>
  >({});

  const authedFetch = useCallback(async (url: string, init?: RequestInit) => {
    const token = await getPatronIdToken();
    const headers: Record<string, string> = {
      ...(init?.headers as Record<string, string> | undefined),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, { ...init, headers });
  }, []);

  const load = useCallback(async () => {
    if (!authReady) return;
    if (!user) {
      setAuthError('unauthenticated');
      setData(null);
      return;
    }
    const [ovRes, lrRes] = await Promise.all([
      authedFetch('/api/admin/overview'),
      authedFetch('/api/admin/launch-readiness'),
    ]);
    if (ovRes.status === 401) {
      setAuthError('unauthenticated');
      return;
    }
    if (ovRes.status === 403) {
      setAuthError('forbidden');
      return;
    }
    if (ovRes.ok) {
      setAuthError(null);
      const ov = (await ovRes.json()) as AdminOverview;
      setData(ov);
      setConfigDraft(ov.config);

      const drafts: Record<string, { sourceUrl: string; registryReference: string; verified: boolean }> = {};
      for (const c of ov.claims) {
        drafts[c.id] = {
          sourceUrl: c.sourceUrl || '',
          registryReference: c.registryReference || '',
          verified: c.verified,
        };
      }
      setClaimDrafts(drafts);

      const qEdits: Record<string, { status: SupportQuery['status']; adminReply: string }> = {};
      for (const q of ov.supportQueries || []) {
        qEdits[q.id] = { status: q.status, adminReply: q.adminReply || '' };
      }
      setQueryReplies(qEdits);

      const pEdits: Record<string, { price: number; stock: number; isCuratedBestseller: boolean }> = {};
      for (const p of ov.products || []) {
        pEdits[p.id] = {
          price: p.price,
          stock: p.variants[0]?.stock ?? 0,
          isCuratedBestseller: Boolean(p.isCuratedBestseller),
        };
      }
      setProductEdits(pEdits);

      if (ov.leads?.length && !selectedLeadId) {
        setSelectedLeadId(ov.leads[0].id);
      }
      if (ov.orders?.length && !selectedOrderId) {
        setSelectedOrderId(ov.orders[0].id);
      }
    }
    if (lrRes.ok) {
      setReadiness(await lrRes.json());
    }
  }, [authReady, user, authedFetch, selectedLeadId, selectedOrderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedLead = useMemo(
    () => data?.leads.find((l) => l.id === selectedLeadId) ?? data?.leads[0] ?? null,
    [data, selectedLeadId]
  );

  useEffect(() => {
    if (!selectedLead) return;
    setLeadDraft({
      stage: selectedLead.stage,
      priority: selectedLead.priority,
      assignedTo: selectedLead.assignedTo || '',
      nextFollowUpAt: selectedLead.nextFollowUpAt || '',
      estimatedValueInr: selectedLead.estimatedValueInr || 0,
      lossReason: selectedLead.lossReason || '',
      note: '',
    });
  }, [selectedLead]);

  const filteredLeads = useMemo(() => {
    if (!data) return [];
    const q = leadSearch.trim().toLowerCase();
    return data.leads.filter((l) => {
      if (leadStageFilter !== 'all' && l.stage !== leadStageFilter) return false;
      if (leadIntentFilter !== 'all' && l.lastIntent !== leadIntentFilter) return false;
      if (leadChannelFilter !== 'all' && l.channel !== leadChannelFilter) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.phone || '').toLowerCase().includes(q) ||
        (l.companyName || '').toLowerCase().includes(q) ||
        l.interestedProducts.some((p) => p.name.toLowerCase().includes(q))
      );
    });
  }, [data, leadSearch, leadStageFilter, leadIntentFilter, leadChannelFilter]);

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    const q = orderSearch.trim().toLowerCase();
    return data.orders.filter((o) => {
      if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) return false;
      if (orderChannelFilter !== 'all' && o.channel !== orderChannelFilter) return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q)
      );
    });
  }, [data, orderSearch, orderStatusFilter, orderChannelFilter]);

  const selectedOrder = useMemo(
    () => filteredOrders.find((o) => o.id === selectedOrderId) ?? filteredOrders[0] ?? null,
    [filteredOrders, selectedOrderId]
  );

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    const q = productSearch.trim().toLowerCase();
    return data.products.filter((p) => {
      if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.craftType.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q)
      );
    });
  }, [data, productSearch, productCategoryFilter]);

  const filteredQueries = useMemo(() => {
    if (!data) return [];
    const q = querySearch.trim().toLowerCase();
    return data.supportQueries.filter((row) => {
      if (queryStatusFilter !== 'all' && row.status !== queryStatusFilter) return false;
      if (!q) return true;
      return (
        row.ticketNumber.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.subject.toLowerCase().includes(q) ||
        row.message.toLowerCase().includes(q)
      );
    });
  }, [data, querySearch, queryStatusFilter]);

  if (!authReady) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-sm text-[var(--rh-ink-muted)]">
        Verifying administrator session…
      </div>
    );
  }

  if (authError === 'unauthenticated') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-8 text-center space-y-4">
          <Lock className="w-10 h-10 text-[var(--rh-primary)] mx-auto" />
          <h1 className="font-display text-2xl font-bold">Admin Console Authentication Required</h1>
          <p className="text-sm text-[var(--rh-ink-muted)]">
            Sign in with an authorised administrator Google account verified against the server{' '}
            <span className="font-mono-num">ADMIN_EMAILS</span> allowlist.
          </p>
          <button
            type="button"
            disabled={authBusy}
            onClick={() => signInWithGoogle()}
            className="px-6 min-h-[44px] rounded-xl bg-[var(--rh-primary)] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" /> Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (authError === 'forbidden') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-[var(--rh-surface)] border border-[var(--rh-primary)]/50 rounded-2xl p-8 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-[var(--rh-primary)] mx-auto" />
          <h1 className="font-display text-2xl font-bold">403 — Admin Access Denied</h1>
          <p className="text-sm text-[var(--rh-ink-muted)]">
            Signed in as <span className="font-mono-num font-semibold">{user?.email || 'unknown'}</span>, which is not
            in the server-side <span className="font-mono-num">ADMIN_EMAILS</span> allowlist. Client role claims are
            never trusted.
          </p>
        </div>
      </div>
    );
  }

  const handleSeed = async (reset = false) => {
    setBusy(true);
    const res = await authedFetch('/api/admin/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset }),
    });
    setBusy(false);
    if (res.ok) {
      const json = await res.json();
      showToast(`Seeded ${json.summary.products} products & ${json.summary.reviews} reviews`);
      void load();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || 'Seed operation failed');
    }
  };

  const handlePurge = async () => {
    setBusy(true);
    const res = await authedFetch('/api/admin/purge-mock', { method: 'POST' });
    setBusy(false);
    if (res.ok) {
      showToast('Purged mock demo rows & recomputed derived stats');
      void load();
    }
  };

  const createManualLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authedFetch('/api/admin/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(manualLead),
    });
    const payload = await res.json();
    if (!res.ok) {
      showToast(payload.error || 'Could not add CRM lead');
      return;
    }
    showToast(`Added CRM lead for ${payload.name}`);
    setSelectedLeadId(payload.id);
    setShowAddLead(false);
    setManualLead({
      name: '',
      email: '',
      phone: '',
      companyName: '',
      city: 'Jaipur',
      channel: 'D2C',
      stage: 'New Lead',
      priority: 'Medium',
      estimatedValueInr: 2500,
      note: '',
    });
    void load();
  };

  const saveLeadUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    const res = await authedFetch(`/api/admin/leads/${selectedLead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadDraft),
    });
    if (res.ok) {
      showToast(`CRM Lead updated (${leadDraft.stage})`);
      void load();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || 'Failed to update lead');
    }
  };

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name) return;
    const res = await authedFetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProd),
    });
    if (res.ok) {
      showToast(`Created live SKU for ${newProd.name}`);
      setNewProd({
        name: '',
        category: 'textiles-apparel',
        price: 1899,
        stock: 15,
        region: 'Jaipur',
        craftType: 'Sanganeri Block Print',
        hsnCode: '6204',
      });
      void load();
    }
  };

  const saveProductEdit = async (id: string) => {
    const draft = productEdits[id];
    if (!draft) return;
    const res = await authedFetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      showToast('Updated product price/stock');
      void load();
    } else {
      showToast('Could not update product');
    }
  };

  const deleteProduct = async (id: string, name: string) => {
    const res = await authedFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast(`Deleted "${name}"`);
      void load();
    }
  };

  const updateOrderStatus = async (id: string, orderStatus: Order['orderStatus']) => {
    await authedFetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderStatus }),
    });
    showToast(`Updated order status to ${orderStatus}`);
    void load();
  };

  const saveQueryUpdate = async (id: string) => {
    const draft = queryReplies[id];
    if (!draft) return;
    const res = await authedFetch(`/api/admin/queries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      showToast(`Saved response (${draft.status})`);
      void load();
    }
  };

  const approveB2B = async (id: string, status: 'Approved' | 'Rejected') => {
    await authedFetch(`/api/admin/b2b/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, creditLimitInr: 300000 }),
    });
    showToast(`B2B application marked ${status} (B2B pricing synced)`);
    void load();
  };

  const moderateReview = async (id: string, moderationStatus: 'approved' | 'pending' | 'rejected') => {
    await authedFetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moderationStatus }),
    });
    showToast(`Review set to ${moderationStatus}`);
    void load();
  };

  const saveClaim = async (id: string) => {
    const draft = claimDrafts[id];
    if (!draft) return;
    const res = await authedFetch(`/api/admin/claims/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      showToast('Updated GI Claims Registry record');
      void refreshStoreConfig();
      void load();
    }
  };

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configDraft) return;
    const res = await authedFetch('/api/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configDraft),
    });
    if (res.ok) {
      showToast('Saved checkout, COD & Mohar store configuration');
      void refreshStoreConfig();
      void load();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--rh-border)]">
        <div>
          <p className="text-xs font-medium text-[var(--rh-primary)] uppercase tracking-wider inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Server-Authenticated Haveli Operations ({user?.email})
          </p>
          <h1 className="font-display text-3xl font-bold mt-1">Admin CRM, Orders, Queries &amp; Catalogue Console</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {!data?.isProduction && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleSeed(false)}
                className="min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--rh-peacock)] text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Database className="w-4 h-4" /> Load Demo Seed
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleSeed(true)}
                className="min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--rh-border)] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Reset Seed
              </button>
            </>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={handlePurge}
            className="min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--rh-primary)] text-[var(--rh-primary)] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Purge Mock Data
          </button>
        </div>
      </div>

      {/* Executive KPI Strip */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 font-mono-num">
          <div className="p-4 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)]">
            <p className="text-xs font-sans text-[var(--rh-ink-muted)]">CRM Pipeline Leads</p>
            <p className="text-2xl font-bold mt-1">{data.stats.totalLeads}</p>
            <p className="text-[11px] font-sans text-[var(--rh-peacock)] mt-0.5">
              {data.stats.openLeads} active · {data.stats.highPriorityLeads} high priority
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)]">
            <p className="text-xs font-sans text-[var(--rh-ink-muted)]">Est. Pipeline Value</p>
            <p className="text-2xl font-bold mt-1">₹{data.stats.pipelineValueInr.toLocaleString('en-IN')}</p>
            <p className="text-[11px] font-sans text-[var(--rh-ink-muted)] mt-0.5">Captured buyer intent</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)]">
            <p className="text-xs font-sans text-[var(--rh-ink-muted)]">Gross Order Revenue</p>
            <p className="text-2xl font-bold mt-1">₹{data.stats.totalRevenue.toLocaleString('en-IN')}</p>
            <p className="text-[11px] font-sans text-[var(--rh-ink-muted)] mt-0.5">
              {data.stats.totalOrders} orders ({data.stats.realOrders} live)
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)]">
            <p className="text-xs font-sans text-[var(--rh-ink-muted)]">Open Queries &amp; B2B</p>
            <p className="text-2xl font-bold mt-1">{data.stats.openQueries} open</p>
            <p className="text-[11px] font-sans text-[#B86E00] mt-0.5">
              {data.stats.pendingB2BApps} B2B apps pending
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)] col-span-2 lg:col-span-1">
            <p className="text-xs font-sans text-[var(--rh-ink-muted)]">Catalogue SKUs</p>
            <p className="text-2xl font-bold mt-1">{data.stats.totalProducts}</p>
            <p className="text-[11px] font-sans text-[var(--rh-ink-muted)] mt-0.5">
              {data.stats.realProducts} live · {data.stats.mockProducts} sample
            </p>
          </div>
        </div>
      )}

      {/* Primary Section Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'crm' as const, label: `Leads CRM (${data?.stats.totalLeads ?? 0})`, icon: Users },
          { id: 'orders' as const, label: `Orders (${data?.stats.totalOrders ?? 0})`, icon: ShoppingBag },
          { id: 'products' as const, label: `Products (${data?.stats.totalProducts ?? 0})`, icon: Package },
          { id: 'queries' as const, label: `Queries & Reviews (${data?.stats.openQueries ?? 0} open)`, icon: MessageSquare },
          { id: 'b2b-config' as const, label: `B2B Approvals (${data?.stats.pendingB2BApps ?? 0}) & Config`, icon: Building2 },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 min-h-[42px] text-xs font-semibold rounded-xl inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                tab === t.id
                  ? 'bg-[var(--rh-primary)] text-white'
                  : 'bg-[var(--rh-surface)] border border-[var(--rh-border)] hover:border-[var(--rh-primary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. LEADS CRM TAB */}
      {tab === 'crm' && data && (
        <div className="space-y-4">
          {/* Toolbar & Filters */}
          <div className="p-4 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-[var(--rh-ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Search lead name, email, phone, or SKU..."
                  className="w-full min-h-[38px] pl-9 pr-3 text-xs rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                />
              </div>
              <select
                value={leadStageFilter}
                onChange={(e) => setLeadStageFilter(e.target.value)}
                className="min-h-[38px] px-2.5 text-xs rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              >
                <option value="all">All Stages</option>
                {LEAD_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <select
                value={leadIntentFilter}
                onChange={(e) => setLeadIntentFilter(e.target.value)}
                className="min-h-[38px] px-2.5 text-xs rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              >
                <option value="all">All Intents</option>
                {(Object.keys(INTENT_DISPLAY) as LeadIntentType[]).map((intent) => (
                  <option key={intent} value={intent}>
                    {INTENT_DISPLAY[intent]}
                  </option>
                ))}
              </select>
              <select
                value={leadChannelFilter}
                onChange={(e) => setLeadChannelFilter(e.target.value as 'all' | 'D2C' | 'B2B')}
                className="min-h-[38px] px-2.5 text-xs rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              >
                <option value="all">D2C + B2B</option>
                <option value="D2C">D2C</option>
                <option value="B2B">B2B</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowAddLead((v) => !v)}
              className="min-h-[38px] px-4 rounded-lg bg-[var(--rh-peacock)] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer self-start lg:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5" /> {showAddLead ? 'Close Form' : 'Add Manual Lead'}
            </button>
          </div>

          {showAddLead && (
            <form
              onSubmit={createManualLead}
              className="p-5 rounded-xl bg-[var(--rh-surface)] border border-[#0F7B6C]/40 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
            >
              <input
                required
                value={manualLead.name}
                onChange={(e) => setManualLead({ ...manualLead, name: e.target.value })}
                placeholder="Contact Name *"
                className="min-h-[38px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              />
              <input
                required
                type="email"
                value={manualLead.email}
                onChange={(e) => setManualLead({ ...manualLead, email: e.target.value })}
                placeholder="Email *"
                className="min-h-[38px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              />
              <input
                value={manualLead.phone}
                onChange={(e) => setManualLead({ ...manualLead, phone: e.target.value })}
                placeholder="Phone / WhatsApp"
                className="min-h-[38px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)] font-mono-num"
              />
              <input
                value={manualLead.companyName}
                onChange={(e) => setManualLead({ ...manualLead, companyName: e.target.value })}
                placeholder="Company (if B2B)"
                className="min-h-[38px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              />
              <select
                value={manualLead.channel}
                onChange={(e) => setManualLead({ ...manualLead, channel: e.target.value as 'D2C' | 'B2B' })}
                className="min-h-[38px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              >
                <option value="D2C">D2C Patron</option>
                <option value="B2B">B2B Trade</option>
              </select>
              <select
                value={manualLead.stage}
                onChange={(e) => setManualLead({ ...manualLead, stage: e.target.value as LeadStage })}
                className="min-h-[38px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              >
                {LEAD_STAGES.map((st) => (
                  <option key={st}>{st}</option>
                ))}
              </select>
              <input
                type="number"
                value={manualLead.estimatedValueInr}
                onChange={(e) => setManualLead({ ...manualLead, estimatedValueInr: Number(e.target.value) })}
                placeholder="Est. Value (INR)"
                className="min-h-[38px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)] font-mono-num"
              />
              <input
                value={manualLead.note}
                onChange={(e) => setManualLead({ ...manualLead, note: e.target.value })}
                placeholder="Initial CRM Note"
                className="min-h-[38px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              />
              <div className="sm:col-span-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 min-h-[38px] rounded-lg bg-[var(--rh-primary)] text-white font-semibold cursor-pointer"
                >
                  Save Lead to CRM
                </button>
              </div>
            </form>
          )}

          {/* Split Master-Detail CRM Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Leads List */}
            <div className="lg:col-span-6 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--rh-border)] flex items-center justify-between text-xs font-semibold">
                <span>Captured Leads ({filteredLeads.length})</span>
                <span className="text-[var(--rh-ink-muted)] font-normal">Sorted by latest activity</span>
              </div>

              {filteredLeads.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--rh-ink-muted)] space-y-1">
                  <p className="font-semibold text-[var(--rh-ink)]">No leads captured yet matching these filters</p>
                  <p>
                    Whenever patrons sign in upon clicking a craft, adding to bag, liking to Pasand, or submitting B2B
                    forms, their scored lead dossier appears here automatically.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--rh-border)] max-h-[680px] overflow-y-auto">
                  {filteredLeads.map((lead) => {
                    const active = selectedLead?.id === lead.id;
                    return (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => setSelectedLeadId(lead.id)}
                        className={`w-full text-left p-4 transition-colors cursor-pointer space-y-2 ${
                          active ? 'bg-[var(--rh-primary)]/8 border-l-4 border-l-[var(--rh-primary)]' : 'hover:bg-[var(--rh-surface-muted)]/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {lead.name}{' '}
                              {lead.companyName && (
                                <span className="text-xs font-normal text-[var(--rh-ink-muted)]">
                                  · {lead.companyName}
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] font-mono-num text-[var(--rh-ink-muted)] truncate">
                              {lead.email}
                              {lead.phone ? ` · ${lead.phone}` : ''}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                              STAGE_STYLE[lead.stage]
                            }`}
                          >
                            {lead.stage}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-num">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-[var(--rh-surface-muted)]">
                              Score {lead.leadScore}/100
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                lead.priority === 'High'
                                  ? 'bg-[#B3123F]/15 text-[#B3123F] font-semibold'
                                  : 'bg-[var(--rh-surface-muted)]'
                              }`}
                            >
                              {lead.priority}
                            </span>
                            <span className="text-[var(--rh-ink-muted)]">{lead.channel}</span>
                          </div>
                          <span className="font-semibold text-[var(--rh-ink)]">
                            Est. ₹{lead.estimatedValueInr.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <p className="text-[11px] text-[var(--rh-ink-muted)] truncate">
                          Last intent: <strong>{INTENT_DISPLAY[lead.lastIntent]}</strong> ·{' '}
                          {lead.interestedProducts.length} SKU(s) ·{' '}
                          {new Date(lead.updatedAt).toLocaleString('en-IN')}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Lead Inspector Panel */}
            <div className="lg:col-span-6 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-5 space-y-5">
              {!selectedLead ? (
                <p className="text-xs text-[var(--rh-ink-muted)]">Select a lead to inspect full CRM history.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--rh-border)]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-2xl font-bold">{selectedLead.name}</h2>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono-num bg-[var(--rh-surface-muted)]">
                          {selectedLead.channel}
                        </span>
                      </div>
                      <p className="text-xs font-mono-num text-[var(--rh-ink-muted)] mt-0.5">
                        {selectedLead.email}
                        {selectedLead.phone ? ` · ${selectedLead.phone}` : ''}
                      </p>
                      {(selectedLead.companyName || selectedLead.gstin || selectedLead.city) && (
                        <p className="text-xs text-[var(--rh-ink-muted)] mt-1">
                          {selectedLead.companyName ? `${selectedLead.companyName} · ` : ''}
                          {selectedLead.city || ''}
                          {selectedLead.gstin ? ` · GSTIN ${selectedLead.gstin}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="text-right font-mono-num">
                      <p className="text-xs text-[var(--rh-ink-muted)]">Lead Score</p>
                      <p className="text-2xl font-bold text-[var(--rh-primary)]">{selectedLead.leadScore}/100</p>
                    </div>
                  </div>

                  {/* CRM Pipeline Editor */}
                  <form onSubmit={saveLeadUpdate} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <label className="space-y-1">
                        <span className="text-[var(--rh-ink-muted)]">Pipeline Stage</span>
                        <select
                          value={leadDraft.stage}
                          onChange={(e) => setLeadDraft({ ...leadDraft, stage: e.target.value as LeadStage })}
                          className="w-full min-h-[38px] px-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                        >
                          {LEAD_STAGES.map((st) => (
                            <option key={st}>{st}</option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-[var(--rh-ink-muted)]">Priority</span>
                        <select
                          value={leadDraft.priority}
                          onChange={(e) => setLeadDraft({ ...leadDraft, priority: e.target.value as LeadPriority })}
                          className="w-full min-h-[38px] px-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                        >
                          {LEAD_PRIORITIES.map((pr) => (
                            <option key={pr}>{pr}</option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-[var(--rh-ink-muted)]">Est. Value (₹)</span>
                        <input
                          type="number"
                          value={leadDraft.estimatedValueInr}
                          onChange={(e) => setLeadDraft({ ...leadDraft, estimatedValueInr: Number(e.target.value) })}
                          className="w-full min-h-[38px] px-2.5 font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[var(--rh-ink-muted)]">Assigned Owner</span>
                        <input
                          value={leadDraft.assignedTo}
                          onChange={(e) => setLeadDraft({ ...leadDraft, assignedTo: e.target.value })}
                          placeholder="e.g. Jaipur Concierge"
                          className="w-full min-h-[38px] px-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                        />
                      </label>
                      <label className="space-y-1 col-span-2">
                        <span className="text-[var(--rh-ink-muted)]">Next Follow-Up Date/Note</span>
                        <input
                          type="datetime-local"
                          value={leadDraft.nextFollowUpAt}
                          onChange={(e) => setLeadDraft({ ...leadDraft, nextFollowUpAt: e.target.value })}
                          className="w-full min-h-[38px] px-2.5 font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                        />
                      </label>
                    </div>

                    {leadDraft.stage === 'Lost' && (
                      <input
                        value={leadDraft.lossReason}
                        onChange={(e) => setLeadDraft({ ...leadDraft, lossReason: e.target.value })}
                        placeholder="Loss reason (e.g. Budget, MOQ, Timeline)"
                        className="w-full min-h-[38px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                      />
                    )}

                    <textarea
                      rows={2}
                      value={leadDraft.note}
                      onChange={(e) => setLeadDraft({ ...leadDraft, note: e.target.value })}
                      placeholder="Log WhatsApp/call summary or follow-up note to timeline..."
                      className="w-full p-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                    />

                    <button
                      type="submit"
                      className="px-4 min-h-[38px] rounded-lg bg-[var(--rh-primary)] text-white font-semibold cursor-pointer"
                    >
                      Save CRM Update
                    </button>
                  </form>

                  {/* Interested Products */}
                  <div className="space-y-2 pt-2 border-t border-[var(--rh-border)]">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--rh-ink-muted)]">
                      Interested Products ({selectedLead.interestedProducts.length})
                    </h3>
                    {selectedLead.interestedProducts.length === 0 ? (
                      <p className="text-xs text-[var(--rh-ink-muted)]">No specific product touches logged yet.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {selectedLead.interestedProducts.map((item) => (
                          <div
                            key={`${item.productId}-${item.touchedAt}`}
                            className="p-2.5 rounded-lg bg-[var(--rh-bg)] border border-[var(--rh-border)] flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{item.name}</p>
                              <p className="text-[11px] text-[var(--rh-ink-muted)]">
                                {INTENT_DISPLAY[item.intent]} · {new Date(item.touchedAt).toLocaleString('en-IN')}
                              </p>
                            </div>
                            {item.priceInr !== undefined && (
                              <span className="font-mono-num font-semibold shrink-0">
                                ₹{item.priceInr.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chronological Activity Timeline */}
                  <div className="space-y-2 pt-2 border-t border-[var(--rh-border)]">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--rh-ink-muted)]">
                      Activity Timeline ({selectedLead.activities.length})
                    </h3>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedLead.activities.map((act) => (
                        <div
                          key={act.id}
                          className="p-2.5 rounded-lg bg-[var(--rh-bg)] border border-[var(--rh-border)] text-xs space-y-0.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold capitalize">{act.type.replace('_', ' ')}</span>
                            <span className="text-[10px] font-mono-num text-[var(--rh-ink-muted)]">
                              {new Date(act.createdAt).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <p className="text-[var(--rh-ink)]">{act.summary}</p>
                          {act.actor && <p className="text-[10px] text-[var(--rh-ink-muted)]">By: {act.actor}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. ORDERS MANAGEMENT TAB */}
      {tab === 'orders' && data && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)] flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-[var(--rh-ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search order #, patron name, email, or phone..."
                className="w-full min-h-[38px] pl-9 pr-3 text-xs rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              />
            </div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="min-h-[38px] px-2.5 text-xs rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
            >
              <option value="all">All Order Stages</option>
              <option>Confirmed</option>
              <option>Artisan Packed</option>
              <option>Shipped</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
            <select
              value={orderChannelFilter}
              onChange={(e) => setOrderChannelFilter(e.target.value as 'all' | 'D2C' | 'B2B')}
              className="min-h-[38px] px-2.5 text-xs rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
            >
              <option value="all">D2C + B2B</option>
              <option value="D2C">D2C</option>
              <option value="B2B">B2B</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--rh-border)] bg-[var(--rh-surface-muted)]/40 text-[var(--rh-ink-muted)] uppercase">
                  <tr>
                    <th className="py-3 px-3">Order</th>
                    <th className="py-3 px-3">Patron</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3">Total</th>
                    <th className="py-3 px-3">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--rh-border)]">
                  {filteredOrders.map((ord) => (
                    <tr
                      key={ord.id}
                      onClick={() => setSelectedOrderId(ord.id)}
                      className={`cursor-pointer ${
                        selectedOrder?.id === ord.id ? 'bg-[var(--rh-primary)]/8' : 'hover:bg-[var(--rh-surface-muted)]/30'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono-num font-semibold">
                        {ord.orderNumber}
                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-[var(--rh-surface-muted)]">
                          {ord.channel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-medium">{ord.customerName}</p>
                        <p className="text-[11px] text-[var(--rh-ink-muted)]">{ord.shippingAddress.city}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        {ord.paymentMethod} · {ord.paymentStatus}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num font-semibold">
                        ₹{ord.total.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={ord.orderStatus}
                          onChange={(e) => updateOrderStatus(ord.id, e.target.value as Order['orderStatus'])}
                          className="px-2 py-1 rounded border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                        >
                          <option>Confirmed</option>
                          <option>Artisan Packed</option>
                          <option>Shipped</option>
                          <option>Delivered</option>
                          <option>Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-5 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-5 space-y-4 text-xs">
              {!selectedOrder ? (
                <p className="text-[var(--rh-ink-muted)]">Select an order to view items &amp; GST invoice breakup.</p>
              ) : (
                <>
                  <div className="flex items-start justify-between pb-3 border-b border-[var(--rh-border)]">
                    <div>
                      <h2 className="font-display text-xl font-bold font-mono-num">{selectedOrder.orderNumber}</h2>
                      <p className="text-[var(--rh-ink-muted)] mt-0.5">
                        {selectedOrder.customerName} · {selectedOrder.customerEmail} · {selectedOrder.customerPhone}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded font-semibold bg-[var(--rh-surface-muted)]">
                      {selectedOrder.orderStatus}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="font-semibold">Shipping Destination</p>
                    <p className="text-[var(--rh-ink-muted)]">
                      {selectedOrder.shippingAddress.line1}, {selectedOrder.shippingAddress.city},{' '}
                      {selectedOrder.shippingAddress.state} – {selectedOrder.shippingAddress.pincode}
                    </p>
                    {selectedOrder.gstin && (
                      <p className="font-mono-num text-[var(--rh-peacock)]">Buyer GSTIN: {selectedOrder.gstin}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <p className="font-semibold">Line Items ({selectedOrder.items.length})</p>
                    {selectedOrder.items.map((item, i) => (
                      <div
                        key={`${item.productId}-${i}`}
                        className="p-2.5 rounded-lg bg-[var(--rh-bg)] border border-[var(--rh-border)] flex justify-between gap-2"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-[11px] font-mono-num text-[var(--rh-ink-muted)]">
                            {item.sku} · {item.variantLabel} × {item.quantity} · HSN {item.hsnCode} ({item.gstRate}% GST)
                          </p>
                        </div>
                        <span className="font-mono-num font-semibold shrink-0">
                          ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {selectedOrder.invoice && (
                    <div className="p-3 rounded-lg bg-[var(--rh-bg)] border border-[var(--rh-border)] space-y-1 font-mono-num">
                      <p className="font-sans font-semibold">GST Invoice ({selectedOrder.invoice.invoiceNumber})</p>
                      <div className="flex justify-between">
                        <span>Taxable Value</span>
                        <span>₹{selectedOrder.invoice.taxableValue.toLocaleString('en-IN')}</span>
                      </div>
                      {selectedOrder.invoice.isIntraState ? (
                        <div className="flex justify-between">
                          <span>CGST + SGST (Intra-State RJ)</span>
                          <span>
                            ₹{selectedOrder.invoice.cgstAmount} + ₹{selectedOrder.invoice.sgstAmount}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span>IGST (Inter-State)</span>
                          <span>₹{selectedOrder.invoice.igstAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold pt-1 border-t border-[var(--rh-border)]">
                        <span>Grand Total</span>
                        <span>₹{selectedOrder.total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. PRODUCTS MANAGEMENT TAB */}
      {tab === 'products' && data && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={createProduct}
            className="lg:col-span-4 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-5 space-y-3 text-xs"
          >
            <h2 className="font-display text-xl font-bold inline-flex items-center gap-2">
              <Plus className="w-5 h-5 text-[var(--rh-primary)]" /> Add Live Product
            </h2>
            <input
              required
              value={newProd.name}
              onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
              placeholder="Product Title *"
              className="w-full min-h-[40px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
            />
            <select
              value={newProd.category}
              onChange={(e) => setNewProd({ ...newProd, category: e.target.value as CategorySlug })}
              className="w-full min-h-[40px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
            >
              <option value="textiles-apparel">Textiles &amp; Apparel</option>
              <option value="home-furnishing">Home Furnishing</option>
              <option value="jewellery">Jewellery (HSN 71xx → 3%)</option>
              <option value="footwear-leather">Footwear &amp; Leather</option>
              <option value="art-decor">Art &amp; Collectibles (HSN 6913 → 5%)</option>
              <option value="gifting-festive">Gifting &amp; Festive</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={newProd.price}
                onChange={(e) => setNewProd({ ...newProd, price: Number(e.target.value) })}
                placeholder="INR Price"
                className="min-h-[40px] px-3 font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              />
              <input
                type="number"
                value={newProd.stock}
                onChange={(e) => setNewProd({ ...newProd, stock: Number(e.target.value) })}
                placeholder="Initial Stock"
                className="min-h-[40px] px-3 font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              />
              <input
                value={newProd.hsnCode}
                onChange={(e) => setNewProd({ ...newProd, hsnCode: e.target.value })}
                placeholder="HSN"
                className="min-h-[40px] px-3 font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              />
              <input
                value={newProd.region}
                onChange={(e) => setNewProd({ ...newProd, region: e.target.value })}
                placeholder="Region"
                className="min-h-[40px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              />
            </div>
            <input
              value={newProd.craftType}
              onChange={(e) => setNewProd({ ...newProd, craftType: e.target.value })}
              placeholder="Craft Type (e.g. Sanganeri Block Print)"
              className="w-full min-h-[40px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
            />
            <p className="text-[11px] text-[var(--rh-ink-muted)]">
              Server automatically computes HSN GST slab (0%, 3%, 5%, 18%, or 40%) and 4 B2B tiers.
            </p>
            <button
              type="submit"
              className="w-full min-h-[42px] px-5 text-xs font-semibold rounded-lg bg-[var(--rh-primary)] text-white cursor-pointer"
            >
              Publish Live SKU
            </button>
          </form>

          <div className="lg:col-span-8 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">Product Catalogue Manager ({filteredProducts.length})</h2>
              <div className="flex flex-wrap gap-2">
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search SKU or title..."
                  className="min-h-[36px] px-3 text-xs rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                />
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="min-h-[36px] px-2.5 text-xs rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                >
                  <option value="all">All Categories</option>
                  <option value="textiles-apparel">Textiles &amp; Apparel</option>
                  <option value="home-furnishing">Home Furnishing</option>
                  <option value="jewellery">Jewellery</option>
                  <option value="footwear-leather">Footwear &amp; Leather</option>
                  <option value="art-decor">Art &amp; Decor</option>
                  <option value="gifting-festive">Gifting &amp; Festive</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--rh-border)] text-[var(--rh-ink-muted)] uppercase">
                  <tr>
                    <th className="py-2 pr-3">Product</th>
                    <th className="py-2 pr-3">GST</th>
                    <th className="py-2 pr-3">Price (₹)</th>
                    <th className="py-2 pr-3">Stock</th>
                    <th className="py-2 pr-3">Bestseller</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--rh-border)]">
                  {filteredProducts.slice(0, 50).map((p) => {
                    const draft = productEdits[p.id] ?? {
                      price: p.price,
                      stock: p.variants[0]?.stock ?? 0,
                      isCuratedBestseller: Boolean(p.isCuratedBestseller),
                    };
                    return (
                      <tr key={p.id}>
                        <td className="py-2.5 pr-3">
                          <p className="font-semibold">{p.name}</p>
                          <p className="text-[11px] font-mono-num text-[var(--rh-ink-muted)]">
                            {p.sku} · {p.craftType} {p.isMock ? '(Sample)' : '· Live'}
                          </p>
                        </td>
                        <td className="py-2.5 pr-3 font-mono-num">{p.gstRate}%</td>
                        <td className="py-2.5 pr-3">
                          <input
                            type="number"
                            value={draft.price}
                            onChange={(e) =>
                              setProductEdits((prev) => ({
                                ...prev,
                                [p.id]: { ...draft, price: Number(e.target.value) },
                              }))
                            }
                            className="w-20 px-2 py-1 font-mono-num rounded border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                          />
                        </td>
                        <td className="py-2.5 pr-3">
                          <input
                            type="number"
                            value={draft.stock}
                            onChange={(e) =>
                              setProductEdits((prev) => ({
                                ...prev,
                                [p.id]: { ...draft, stock: Number(e.target.value) },
                              }))
                            }
                            className="w-16 px-2 py-1 font-mono-num rounded border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                          />
                        </td>
                        <td className="py-2.5 pr-3">
                          <input
                            type="checkbox"
                            checked={draft.isCuratedBestseller}
                            onChange={(e) =>
                              setProductEdits((prev) => ({
                                ...prev,
                                [p.id]: { ...draft, isCuratedBestseller: e.target.checked },
                              }))
                            }
                            className="accent-[#B3123F] cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 text-right whitespace-nowrap space-x-1.5">
                          <button
                            type="button"
                            onClick={() => saveProductEdit(p.id)}
                            className="px-2.5 py-1 rounded bg-[var(--rh-peacock)] text-white font-semibold cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProduct(p.id, p.name)}
                            aria-label={`Delete ${p.name}`}
                            className="p-1.5 rounded border border-[var(--rh-border)] text-[var(--rh-primary)] cursor-pointer align-middle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. QUERIES & REVIEWS TAB */}
      {tab === 'queries' && data && (
        <div className="space-y-6">
          <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">Customer Support &amp; Grievance Queries Desk</h2>
                <p className="text-xs text-[var(--rh-ink-muted)]">
                  Tickets submitted via Contact / About / DPDP Grievance forms. Replying automatically tracks audit logs.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  value={querySearch}
                  onChange={(e) => setQuerySearch(e.target.value)}
                  placeholder="Search ticket #, email, or subject..."
                  className="min-h-[36px] px-3 text-xs rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                />
                <select
                  value={queryStatusFilter}
                  onChange={(e) => setQueryStatusFilter(e.target.value)}
                  className="min-h-[36px] px-2.5 text-xs rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                >
                  <option value="all">All Statuses</option>
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                  <option>Closed</option>
                </select>
              </div>
            </div>

            {filteredQueries.length === 0 ? (
              <p className="text-xs text-[var(--rh-ink-muted)]">No patron support or grievance queries found.</p>
            ) : (
              <div className="space-y-3">
                {filteredQueries.map((q) => {
                  const draft = queryReplies[q.id] ?? { status: q.status, adminReply: q.adminReply || '' };
                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl bg-[var(--rh-bg)] border border-[var(--rh-border)] space-y-2.5 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-mono-num font-bold text-[var(--rh-primary)]">{q.ticketNumber}</span> ·{' '}
                          <span className="font-semibold text-sm">{q.subject}</span>
                          <span className="ml-2 px-2 py-0.5 rounded bg-[var(--rh-surface-muted)]">{q.category}</span>
                        </div>
                        <span className="text-[11px] font-mono-num text-[var(--rh-ink-muted)]">
                          {new Date(q.createdAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="font-mono-num text-[var(--rh-ink-muted)]">
                        {q.name} ({q.email}
                        {q.phone ? ` · ${q.phone}` : ''}){q.orderNumber ? ` · Order ${q.orderNumber}` : ''}
                      </p>
                      <p className="text-[var(--rh-ink)] leading-relaxed">{q.message}</p>

                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <input
                          value={draft.adminReply}
                          onChange={(e) =>
                            setQueryReplies((prev) => ({
                              ...prev,
                              [q.id]: { ...draft, adminReply: e.target.value },
                            }))
                          }
                          placeholder="Resolution note or patron reply..."
                          className="flex-1 min-h-[38px] px-3 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)]"
                        />
                        <select
                          value={draft.status}
                          onChange={(e) =>
                            setQueryReplies((prev) => ({
                              ...prev,
                              [q.id]: { ...draft, status: e.target.value as SupportQuery['status'] },
                            }))
                          }
                          className="min-h-[38px] px-2.5 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)]"
                        >
                          <option>Open</option>
                          <option>In Progress</option>
                          <option>Resolved</option>
                          <option>Closed</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => saveQueryUpdate(q.id)}
                          className="px-4 min-h-[38px] rounded-lg bg-[var(--rh-primary)] text-white font-semibold cursor-pointer"
                        >
                          Update Ticket
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-5 space-y-4">
              <h2 className="font-display text-xl font-bold">Review Moderation Queue</h2>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {data.reviews.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-lg bg-[var(--rh-bg)] border border-[var(--rh-border)] space-y-1.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">
                        {r.author} ({r.city}) · {r.rating}★ · {r.isMock ? 'Sample' : 'Verified Purchase'}
                      </span>
                      <div className="flex gap-1.5">
                        {(['approved', 'pending', 'rejected'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => moderateReview(r.id, st)}
                            className={`px-2 py-1 rounded text-[11px] capitalize cursor-pointer ${
                              (r.moderationStatus || 'approved') === st
                                ? 'bg-[var(--rh-peacock)] text-white font-semibold'
                                : 'border border-[var(--rh-border)]'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="font-semibold">{r.title}</p>
                    <p className="text-[var(--rh-ink-muted)]">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-5 space-y-4">
              <h2 className="font-display text-xl font-bold">Heritage AI Mistake Reports</h2>
              {data.heritageMistakeReports.length === 0 ? (
                <p className="text-xs text-[var(--rh-ink-muted)]">No patron correction reports submitted.</p>
              ) : (
                <div className="space-y-3">
                  {data.heritageMistakeReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-3.5 rounded-lg bg-[var(--rh-bg)] border border-[var(--rh-border)] text-xs space-y-1"
                    >
                      <p className="font-semibold">Query: {rep.query}</p>
                      <p className="text-[var(--rh-primary)]">Note: {rep.note}</p>
                      <p className="text-[var(--rh-ink-muted)] font-mono-num">
                        {new Date(rep.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. B2B APPROVALS, GI CLAIMS & CONFIG TAB */}
      {tab === 'b2b-config' && data && (
        <div className="space-y-6">
          {/* B2B Applications Queue */}
          <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-6 space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold">B2B Applications &amp; Pricing Unlock Queue</h2>
              <p className="text-xs text-[var(--rh-ink-muted)]">
                Approving an application immediately unlocks tiered B2B pricing, RFQ generation, and Net-30 PO
                ordering for that partner.
              </p>
            </div>
            <div className="space-y-3">
              {data.applications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-lg bg-[var(--rh-bg)] border border-[var(--rh-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-sm">
                      {app.businessName} · {app.businessType} {app.isMock && '(Sample)'}
                    </p>
                    <p className="font-mono-num text-[var(--rh-ink-muted)]">
                      GSTIN: {app.gstin} · {app.email} · {app.phone} · {app.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{app.status}</span>
                    {app.status !== 'Approved' && (
                      <button
                        type="button"
                        onClick={() => approveB2B(app.id, 'Approved')}
                        className="px-3 py-1.5 rounded bg-[var(--rh-peacock)] text-white font-semibold cursor-pointer"
                      >
                        Approve &amp; Unlock Pricing
                      </button>
                    )}
                    {app.status !== 'Rejected' && (
                      <button
                        type="button"
                        onClick={() => approveB2B(app.id, 'Rejected')}
                        className="px-3 py-1.5 rounded border border-[var(--rh-border)] cursor-pointer"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GI Claims Registry */}
          <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-5 space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold">GI Tag &amp; Authenticity Claims Registry</h2>
              <p className="text-xs text-[var(--rh-ink-muted)]">
                Only claims marked verified (with official IP India registry URL &amp; reference) show &ldquo;GI
                Tagged&rdquo; badges across storefront cards and product pages.
              </p>
            </div>
            <div className="space-y-3">
              {data.claims.map((c) => {
                const draft = claimDrafts[c.id] ?? {
                  sourceUrl: c.sourceUrl || '',
                  registryReference: c.registryReference || '',
                  verified: c.verified,
                };
                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-[var(--rh-bg)] border border-[var(--rh-border)] grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
                  >
                    <div className="md:col-span-4 space-y-1">
                      <p className="font-semibold text-sm">{c.subject}</p>
                      <p className="text-[var(--rh-ink-muted)]">{c.statement}</p>
                    </div>
                    <input
                      value={draft.registryReference}
                      onChange={(e) =>
                        setClaimDrafts((prev) => ({
                          ...prev,
                          [c.id]: { ...draft, registryReference: e.target.value },
                        }))
                      }
                      placeholder="Certificate / Registry #"
                      className="md:col-span-3 min-h-[38px] px-2.5 rounded border border-[var(--rh-border)] bg-[var(--rh-surface)] font-mono-num"
                    />
                    <input
                      value={draft.sourceUrl}
                      onChange={(e) =>
                        setClaimDrafts((prev) => ({
                          ...prev,
                          [c.id]: { ...draft, sourceUrl: e.target.value },
                        }))
                      }
                      placeholder="Official Registry URL"
                      className="md:col-span-3 min-h-[38px] px-2.5 rounded border border-[var(--rh-border)] bg-[var(--rh-surface)]"
                    />
                    <div className="md:col-span-2 flex items-center justify-end gap-2">
                      <label className="inline-flex items-center gap-1 cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          checked={draft.verified}
                          onChange={(e) =>
                            setClaimDrafts((prev) => ({
                              ...prev,
                              [c.id]: { ...draft, verified: e.target.checked },
                            }))
                          }
                          className="accent-[#0F7B6C]"
                        />
                        Verified
                      </label>
                      <button
                        type="button"
                        onClick={() => saveClaim(c.id)}
                        className="px-3 py-1.5 rounded bg-[var(--rh-primary)] text-white font-semibold cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Checkout Config, Launch Readiness & Audit Log */}
          {configDraft && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={saveConfig}
                className="lg:col-span-6 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-5 space-y-3 text-xs"
              >
                <h2 className="font-display text-xl font-bold">Checkout, COD &amp; Mohar Rules</h2>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span>Prepaid Incentive (₹)</span>
                    <input
                      type="number"
                      value={configDraft.prepaidIncentiveInr}
                      onChange={(e) => setConfigDraft({ ...configDraft, prepaidIncentiveInr: Number(e.target.value) })}
                      className="w-full min-h-[38px] px-2.5 font-mono-num rounded border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                    />
                  </label>
                  <label className="space-y-1">
                    <span>COD Fee (₹)</span>
                    <input
                      type="number"
                      value={configDraft.codFeeInr}
                      onChange={(e) => setConfigDraft({ ...configDraft, codFeeInr: Number(e.target.value) })}
                      className="w-full min-h-[38px] px-2.5 font-mono-num rounded border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                    />
                  </label>
                  <label className="space-y-1">
                    <span>COD Max Order (₹)</span>
                    <input
                      type="number"
                      value={configDraft.codMaxOrderInr}
                      onChange={(e) => setConfigDraft({ ...configDraft, codMaxOrderInr: Number(e.target.value) })}
                      className="w-full min-h-[38px] px-2.5 font-mono-num rounded border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                    />
                  </label>
                  <label className="space-y-1">
                    <span>Mohar Max Redeem (%)</span>
                    <input
                      type="number"
                      value={configDraft.moharMaxRedeemPct}
                      onChange={(e) => setConfigDraft({ ...configDraft, moharMaxRedeemPct: Number(e.target.value) })}
                      className="w-full min-h-[38px] px-2.5 font-mono-num rounded border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                    />
                  </label>
                </div>

                <label className="block space-y-1">
                  <span>Blocked COD Pincodes (comma-separated)</span>
                  <input
                    value={configDraft.codBlockedPincodes.join(', ')}
                    onChange={(e) =>
                      setConfigDraft({
                        ...configDraft,
                        codBlockedPincodes: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full min-h-[38px] px-2.5 font-mono-num rounded border border-[var(--rh-border)] bg-[var(--rh-bg)]"
                  />
                </label>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={configDraft.codEnabled}
                    onChange={(e) => setConfigDraft({ ...configDraft, codEnabled: e.target.checked })}
                    className="accent-[#B3123F]"
                  />
                  <span>Enable Cash on Delivery</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configDraft.lowStockUrgencyEnabled}
                    onChange={(e) => setConfigDraft({ ...configDraft, lowStockUrgencyEnabled: e.target.checked })}
                    className="accent-[#B3123F]"
                  />
                  <span>Show Low-Stock Indicator When Verified Real Inventory &le; 3</span>
                </label>

                <button
                  type="submit"
                  className="px-5 min-h-[40px] rounded-lg bg-[var(--rh-primary)] text-white font-semibold cursor-pointer"
                >
                  Save Store Config
                </button>
              </form>

              <div className="lg:col-span-6 space-y-4">
                {readiness && (
                  <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Launch Readiness Checklist</span>
                      <span className="font-mono-num text-[var(--rh-peacock)]">
                        {readiness.readyCount}/{readiness.totalCount} Ready
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {readiness.todos.map((item) => (
                        <div key={item.id} className="flex items-start gap-1.5">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                              item.done ? 'text-[var(--rh-peacock)]' : 'text-[var(--rh-ink-muted)] opacity-45'
                            }`}
                          />
                          <span className={item.done ? 'text-[var(--rh-ink-muted)] line-through' : ''}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-5 space-y-2">
                  <h3 className="font-display text-lg font-bold">Anti-Dark-Pattern Audit Checklist</h3>
                  {DARK_PATTERN_CHECKLIST.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--rh-peacock)] shrink-0" />
                      <span>{r.rule}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-5 space-y-2">
                  <h3 className="font-display text-lg font-bold">Recent Security &amp; Admin Audit Log</h3>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto text-[11px] font-mono-num">
                    {data.auditLogs.map((log) => (
                      <div key={log.id} className="p-2 rounded bg-[var(--rh-bg)] border border-[var(--rh-border)]">
                        <strong>{log.action}</strong> · {log.actorEmail} · {log.details}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
