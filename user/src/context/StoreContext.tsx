import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  auth,
  completeRedirectAuth,
  ensurePatronFirestoreProfile,
  getPatronIdToken,
  signInWithGooglePatron,
  signOutPatron,
  subscribeUserProfile,
  syncWishlistToFirestore,
} from '../firebase';
import type {
  AdminConfig,
  CartItem,
  CategoryInfo,
  ClaimRecord,
  LeadIntentType,
  Product,
  ProductVariant,
} from '../types';
import {
  DEFAULT_ADMIN_CONFIG,
  DEFAULT_CLAIMS_REGISTRY,
  HERITAGE_GUILD_METRICS,
  LEGAL_CONFIG_CLIENT_FALLBACK,
} from '../config/heritageConstants';

export type ThemeMode = 'dhoop' | 'raat';
export type LangMode = 'en' | 'hi';

export type LegalPageKey =
  | 'privacy'
  | 'terms'
  | 'shipping'
  | 'returns'
  | 'cancellation'
  | 'contact'
  | 'faq'
  | 'fair-design';

export type RouteView =
  | { page: 'home' }
  | {
      page: 'shop';
      category?: string;
      craft?: string;
      region?: string;
      occasion?: string;
      color?: string;
      gi?: boolean;
      inStock?: boolean;
      bestseller?: boolean;
      newArrival?: boolean;
      minPrice?: number;
      maxPrice?: number;
      sort?: string;
      q?: string;
    }
  | { page: 'product'; slug: string }
  | { page: 'checkout' }
  | { page: 'wishlist'; sharedIds?: string[] }
  | { page: 'account' }
  | { page: 'b2b' }
  | { page: 'blog'; slug?: string }
  | { page: 'about' }
  | { page: 'admin' }
  | { page: 'track-order' }
  | { page: 'legal'; doc: LegalPageKey }
  | { page: 'not-found'; path: string };

export interface ServerLegalConfig {
  brandName: string;
  legalEntityName: string;
  legalAddress: string;
  legalGstin: string;
  grievanceOfficerName: string;
  grievanceOfficerEmail: string;
  grievanceOfficerPhone: string;
  supportEmail: string;
}

export interface PendingLeadIntent {
  intent: LeadIntentType;
  route?: RouteView;
  product?: Product;
  variant?: ProductVariant;
  qty?: number;
  productId?: string;
  bundleProducts?: Product[];
  bundleTitle?: string;
  sourcePath: string;
  phone?: string;
  note?: string;
  onAuthenticated?: () => void;
}

export interface LeadCapturePayload {
  intent: LeadIntentType;
  product?: Partial<Product>;
  productId?: string;
  productSlug?: string;
  productName?: string;
  category?: string;
  priceInr?: number;
  sourcePath?: string;
  phone?: string;
  note?: string;
  channel?: 'D2C' | 'B2B';
  companyName?: string;
  gstin?: string;
  city?: string;
}

interface StoreContextValue {
  theme: ThemeMode;
  festiveMode: boolean;
  toggleFestiveMode: () => void;
  lang: LangMode;
  toggleLang: () => void;
  t: (en: string, hi: string) => string;
  reduceMotion: boolean;
  toggleReduceMotion: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  playChime: () => void;
  route: RouteView;
  navigate: (next: RouteView, opts?: { replace?: boolean; product?: Product }) => void;
  isTransitioning: boolean;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, variant?: ProductVariant, qty?: number) => void;
  addBundleToCart: (products: Product[], title?: string) => void;
  updateCartQty: (productId: string, variantId: string, delta: number) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  clearCart: () => void;
  wishlist: string[];
  patronId: string;
  toggleWishlist: (productId: string, product?: Product) => void;
  clearWishlist: () => void;
  recentlyViewed: Product[];
  recordViewed: (product: Product) => void;
  moharCoins: number;
  refreshAccountMetrics: () => Promise<void>;
  categories: CategoryInfo[];
  toast: string | null;
  showToast: (msg: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  // Store config, claims & legal
  isProductionEnv: boolean;
  adminConfig: AdminConfig;
  claimsRegistry: ClaimRecord[];
  legalConfig: ServerLegalConfig;
  guildMetrics: typeof HERITAGE_GUILD_METRICS;
  isGiVerified: (claimId?: string) => boolean;
  refreshStoreConfig: () => Promise<void>;
  // Firebase Auth & Login-First Lead Gate
  user: User | null;
  authReady: boolean;
  authBusy: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  authGateOpen: boolean;
  pendingIntent: PendingLeadIntent | null;
  openAuthGate: (intent: PendingLeadIntent) => void;
  closeAuthGate: () => void;
  updatePendingLeadMeta: (meta: { phone?: string; note?: string }) => void;
  recordLead: (payload: LeadCapturePayload) => Promise<void>;
  requireAuthForAction: (intent: PendingLeadIntent, onReady: () => void) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const LEGAL_PAGES: readonly LegalPageKey[] = [
  'privacy',
  'terms',
  'shipping',
  'returns',
  'cancellation',
  'contact',
  'faq',
  'fair-design',
];

function parsePathAndQuery(pathname: string, search: string): RouteView {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const parts = clean.split('/').filter(Boolean);
  const params = new URLSearchParams(search);

  if (parts.length === 0) return { page: 'home' };
  if (parts[0] === 'shop') {
    return {
      page: 'shop',
      category: params.get('category') ?? undefined,
      craft: params.get('craft') ?? undefined,
      region: params.get('region') ?? undefined,
      occasion: params.get('occasion') ?? undefined,
      color: params.get('color') ?? undefined,
      gi: params.get('gi') === 'true' ? true : undefined,
      inStock: params.get('inStock') === 'true' ? true : undefined,
      bestseller: params.get('bestseller') === 'true' ? true : undefined,
      newArrival: params.get('newArrival') === 'true' ? true : undefined,
      minPrice: params.get('minPrice') ? Number(params.get('minPrice')) : undefined,
      maxPrice: params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined,
      sort: params.get('sort') ?? undefined,
      q: params.get('q') ?? undefined,
    };
  }
  if (parts[0] === 'product' && parts[1]) {
    return { page: 'product', slug: decodeURIComponent(parts[1]) };
  }
  if (parts[0] === 'checkout') return { page: 'checkout' };
  if (parts[0] === 'wishlist') {
    const itemsParam = params.get('items');
    return {
      page: 'wishlist',
      sharedIds: itemsParam ? itemsParam.split(',').filter(Boolean) : undefined,
    };
  }
  if (parts[0] === 'account') return { page: 'account' };
  if (parts[0] === 'b2b') return { page: 'b2b' };
  if (parts[0] === 'blog') {
    return { page: 'blog', slug: parts[1] ? decodeURIComponent(parts[1]) : undefined };
  }
  if (parts[0] === 'about') return { page: 'about' };
  if (parts[0] === 'admin') return { page: 'admin' };
  if (parts[0] === 'track-order') return { page: 'track-order' };
  if (LEGAL_PAGES.includes(parts[0] as LegalPageKey)) {
    return { page: 'legal', doc: parts[0] as LegalPageKey };
  }
  return { page: 'not-found', path: clean };
}

export function buildPathUrl(route: RouteView): string {
  switch (route.page) {
    case 'home':
      return '/';
    case 'shop': {
      const p = new URLSearchParams();
      if (route.category && route.category !== 'all') p.set('category', route.category);
      if (route.craft && route.craft !== 'all') p.set('craft', route.craft);
      if (route.region && route.region !== 'all') p.set('region', route.region);
      if (route.occasion && route.occasion !== 'all') p.set('occasion', route.occasion);
      if (route.color && route.color !== 'all') p.set('color', route.color);
      if (route.gi) p.set('gi', 'true');
      if (route.inStock) p.set('inStock', 'true');
      if (route.bestseller) p.set('bestseller', 'true');
      if (route.newArrival) p.set('newArrival', 'true');
      if (route.minPrice && route.minPrice > 0) p.set('minPrice', String(route.minPrice));
      if (route.maxPrice && route.maxPrice < 16000) p.set('maxPrice', String(route.maxPrice));
      if (route.sort && route.sort !== 'featured') p.set('sort', route.sort);
      if (route.q) p.set('q', route.q);
      const qs = p.toString();
      return qs ? `/shop?${qs}` : '/shop';
    }
    case 'product':
      return `/product/${encodeURIComponent(route.slug)}`;
    case 'checkout':
      return '/checkout';
    case 'wishlist':
      return route.sharedIds?.length ? `/wishlist?items=${route.sharedIds.join(',')}` : '/wishlist';
    case 'account':
      return '/account';
    case 'b2b':
      return '/b2b';
    case 'blog':
      return route.slug ? `/blog/${encodeURIComponent(route.slug)}` : '/blog';
    case 'about':
      return '/about';
    case 'admin':
      return '/admin';
    case 'track-order':
      return '/track-order';
    case 'legal':
      return `/${route.doc}`;
    case 'not-found':
      return route.path || '/';
  }
}

function getInitialRouteWithLegacyRedirect(): RouteView {
  if (typeof window === 'undefined') return { page: 'home' };
  const hash = window.location.hash;
  if (hash && hash.startsWith('#/')) {
    const raw = hash.slice(1);
    const [p, q] = raw.split('?');
    const targetUrl = q ? `${p}?${q}` : p;
    window.history.replaceState(null, '', targetUrl);
    return parsePathAndQuery(p, q ? `?${q}` : '');
  }
  return parsePathAndQuery(window.location.pathname, window.location.search);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Light theme only.
  const theme: ThemeMode = 'dhoop';
  const [festiveMode, setFestiveMode] = useState<boolean>(false);
  const [lang, setLang] = useState<LangMode>(() => (localStorage.getItem('rh-lang') === 'hi' ? 'hi' : 'en'));
  const [reduceMotion, setReduceMotion] = useState<boolean>(() =>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [route, setRoute] = useState<RouteView>(() => getInitialRouteWithLegacyRedirect());
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('rh-cart') || '[]');
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [guestPatronId] = useState<string>(() => {
    const existing = localStorage.getItem('rh-patron-id');
    if (existing) return existing;
    const created = `patron-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('rh-patron-id', created);
    return created;
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('rh-wishlist') || '[]');
    } catch {
      return [];
    }
  });
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [moharCoins, setMoharCoins] = useState<number>(0);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const [isProductionEnv, setIsProductionEnv] = useState<boolean>(false);
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(DEFAULT_ADMIN_CONFIG);
  const [claimsRegistry, setClaimsRegistry] = useState<ClaimRecord[]>(DEFAULT_CLAIMS_REGISTRY);
  const [legalConfig, setLegalConfig] = useState<ServerLegalConfig>({
    brandName: LEGAL_CONFIG_CLIENT_FALLBACK.brandName,
    legalEntityName: LEGAL_CONFIG_CLIENT_FALLBACK.entityNamePlaceholder,
    legalAddress: LEGAL_CONFIG_CLIENT_FALLBACK.registeredAddressPlaceholder,
    legalGstin: LEGAL_CONFIG_CLIENT_FALLBACK.gstinPlaceholder,
    grievanceOfficerName: LEGAL_CONFIG_CLIENT_FALLBACK.grievanceOfficerPlaceholder,
    grievanceOfficerEmail: LEGAL_CONFIG_CLIENT_FALLBACK.grievanceEmailPlaceholder,
    grievanceOfficerPhone: 'GRIEVANCE_OFFICER_PHONE [Verify in Production Env]',
    supportEmail: 'support@rangrezhaveli.example',
  });

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);

  // Login-First Gate & Pending Intent state
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<PendingLeadIntent | null>(null);
  const pendingMetaRef = useRef<{ phone?: string; note?: string }>({});

  const latestLocalRef = useRef({ moharCoins, theme, wishlist });
  useEffect(() => {
    latestLocalRef.current = { moharCoins, theme, wishlist };
  }, [moharCoins, theme, wishlist]);

  const patronId = user ? user.uid : guestPatronId;

  const refreshStoreConfig = useCallback(async () => {
    try {
      const [cfgResp, claimsResp] = await Promise.all([
        fetch('/api/config').then((r) => r.json()),
        fetch('/api/claims').then((r) => r.json()),
      ]);
      if (typeof cfgResp.isProduction === 'boolean') setIsProductionEnv(cfgResp.isProduction);
      if (cfgResp.adminConfig) setAdminConfig(cfgResp.adminConfig);
      if (cfgResp.legal) setLegalConfig(cfgResp.legal);
      if (Array.isArray(claimsResp.claims)) setClaimsRegistry(claimsResp.claims);
    } catch {
      // Fallback to defaults
    }
  }, []);

  const refreshAccountMetrics = useCallback(async () => {
    const token = await getPatronIdToken();
    if (!token) {
      setMoharCoins(0);
      return;
    }
    try {
      const resp = await fetch('/api/orders/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = (await resp.json()) as { moharBalance?: number };
        if (typeof data.moharBalance === 'number') {
          setMoharCoins(data.moharBalance);
        }
      }
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    void refreshStoreConfig();
  }, [refreshStoreConfig]);

  useEffect(() => {
    void completeRedirectAuth();
    const unsubAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (nextUser) {
        try {
          await ensurePatronFirestoreProfile(nextUser, {
            moharCoins: latestLocalRef.current.moharCoins,
            preferredTheme: latestLocalRef.current.theme,
            wishlistIds: latestLocalRef.current.wishlist,
          });
        } catch {
          // Handled safely
        }
        void refreshAccountMetrics();
      } else {
        setMoharCoins(0);
      }
    });
    return () => unsubAuth();
  }, [refreshAccountMetrics]);

  useEffect(() => {
    if (!authReady || !user) return;
    const unsubProfile = subscribeUserProfile(user.uid, (profile) => {
      if (profile.wishlistIds.length > 0) {
        setWishlist((prev) => Array.from(new Set([...profile.wishlistIds, ...prev])).slice(0, 100));
      }
    });
    return () => unsubProfile();
  }, [authReady, user]);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    try {
      localStorage.removeItem('rh-theme');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  useEffect(() => {
    localStorage.setItem('rh-lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('rh-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('rh-wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/wishlist?patronId=${encodeURIComponent(patronId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.productIds) && data.productIds.length > 0) {
          setWishlist((prev) => Array.from(new Set([...prev, ...data.productIds])));
        }
      })
      .catch(() => {});
  }, [patronId]);

  useEffect(() => {
    const onPopState = () => {
      setRoute(parsePathAndQuery(window.location.pathname, window.location.search));
    };
    const onHash = () => {
      if (window.location.hash.startsWith('#/')) {
        const raw = window.location.hash.slice(1);
        const [p, q] = raw.split('?');
        const url = q ? `${p}?${q}` : p;
        window.history.replaceState(null, '', url);
        setRoute(parsePathAndQuery(p, q ? `?${q}` : ''));
      }
    };
    window.addEventListener('popstate', onPopState);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('hashchange', onHash);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((curr) => (curr === msg ? null : curr)), 3200);
  }, []);

  const recordLead = useCallback(async (payload: LeadCapturePayload) => {
    const token = await getPatronIdToken();
    if (!token) return;
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          intent: payload.intent,
          productId: payload.productId ?? payload.product?.id,
          productSlug: payload.productSlug ?? payload.product?.slug,
          productName: payload.productName ?? payload.product?.name,
          category: payload.category ?? payload.product?.category,
          priceInr: payload.priceInr ?? payload.product?.price,
          sourcePath: payload.sourcePath || `${window.location.pathname}${window.location.search}`,
          phone: payload.phone,
          note: payload.note,
          channel: payload.channel || 'D2C',
          companyName: payload.companyName,
          gstin: payload.gstin,
          city: payload.city,
        }),
      });
    } catch {
      // Non-blocking background CRM sync
    }
  }, []);

  const openAuthGate = useCallback((intent: PendingLeadIntent) => {
    pendingMetaRef.current = { phone: intent.phone, note: intent.note };
    setPendingIntent(intent);
    setAuthGateOpen(true);
  }, []);

  const closeAuthGate = useCallback(() => {
    setAuthGateOpen(false);
    setPendingIntent(null);
    pendingMetaRef.current = {};
  }, []);

  const updatePendingLeadMeta = useCallback((meta: { phone?: string; note?: string }) => {
    pendingMetaRef.current = meta;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthBusy(true);
    try {
      const signedInUser = await signInWithGooglePatron();
      if (signedInUser) {
        showToast(`Padharo, ${signedInUser.displayName || 'Patron'}!`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in could not complete.';
      if (!msg.includes('popup-closed-by-user')) {
        showToast(msg);
      }
    } finally {
      setAuthBusy(false);
    }
  }, [showToast]);

  const signOutUser = useCallback(async () => {
    setAuthBusy(true);
    try {
      await signOutPatron();
      setMoharCoins(0);
      showToast('Signed out of Haveli account.');
    } finally {
      setAuthBusy(false);
    }
  }, [showToast]);

  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {
      // Ignore audio block
    }
  }, [soundEnabled]);

  const performNavigate = useCallback(
    (next: RouteView, opts?: { replace?: boolean }) => {
      const targetUrl = buildPathUrl(next);
      const currentFull = `${window.location.pathname}${window.location.search}`;
      if (currentFull !== targetUrl) {
        if (opts?.replace) {
          window.history.replaceState(null, '', targetUrl);
        } else {
          window.history.pushState(null, '', targetUrl);
        }
      }
      if (!reduceMotion) {
        setIsTransitioning(true);
        window.setTimeout(() => setIsTransitioning(false), 220);
      }
      setRoute(next);
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    },
    [reduceMotion]
  );

  const navigate = useCallback(
    (next: RouteView, opts?: { replace?: boolean; product?: Product }) => {
      if (next.page === 'product' && !user) {
        openAuthGate({
          intent: 'product_click',
          route: next,
          product: opts?.product,
          sourcePath: window.location.pathname,
        });
        return;
      }
      if (next.page === 'product' && user) {
        void recordLead({
          intent: 'product_click',
          product: opts?.product,
          productSlug: next.slug,
          sourcePath: window.location.pathname,
        });
      }
      performNavigate(next, opts);
    },
    [user, openAuthGate, performNavigate, recordLead]
  );

  // Keep document title synchronized on client transitions
  useEffect(() => {
    const titleMap: Record<RouteView['page'], string> = {
      home: 'Rangrez Haveli — Rajasthan, crafted by hand',
      shop: 'Shop Handcrafted Rajasthani Creations — Rangrez Haveli',
      product: 'Handcrafted Creation — Rangrez Haveli',
      checkout: 'Secure Checkout — Rangrez Haveli',
      wishlist: 'Pasand Wishlist — Rangrez Haveli',
      account: 'Patron Account & Mohar — Rangrez Haveli',
      b2b: 'B2B Partner Portal — Rangrez Haveli',
      blog: 'Heritage Craft Journal — Rangrez Haveli',
      about: 'About Our Haveli — Rangrez Haveli',
      admin: 'Admin Console — Rangrez Haveli',
      'track-order': 'Track Order — Rangrez Haveli',
      legal: 'Store Policy & Transparency — Rangrez Haveli',
      'not-found': 'Page Not Found — Rangrez Haveli',
    };
    if (route.page !== 'product' && route.page !== 'blog') {
      document.title = titleMap[route.page];
    }
  }, [route]);

  const toggleFestiveMode = useCallback(() => {
    setFestiveMode((prev) => !prev);
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'hi' : 'en'));
  }, []);

  const t = useCallback((en: string, hi: string) => (lang === 'hi' ? hi : en), [lang]);

  const executeAddToCart = useCallback(
    (product: Product, variant?: ProductVariant, qty = 1, skipLead = false) => {
      const chosen = variant ?? product.variants.find((v) => v.stock > 0) ?? product.variants[0];
      if (!chosen || chosen.stock <= 0) {
        showToast('Currently out of stock — set a Back-in-Stock alert on the product page.');
        return;
      }
      setCart((prev) => {
        const idx = prev.findIndex((i) => i.product.id === product.id && i.variant.id === chosen.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty };
          return copy;
        }
        return [...prev, { product, variant: chosen, quantity: qty }];
      });
      playChime();
      showToast(`Added ${product.name} to bag`);
      if (!skipLead) {
        void recordLead({
          intent: 'add_to_cart',
          product,
          sourcePath: window.location.pathname,
          note: `Qty ${qty} · Variant ${chosen.label}`,
        });
      }
    },
    [playChime, recordLead, showToast]
  );

  const addToCart = useCallback(
    (product: Product, variant?: ProductVariant, qty = 1) => {
      if (!user) {
        openAuthGate({
          intent: 'add_to_cart',
          product,
          variant,
          qty,
          sourcePath: window.location.pathname,
        });
        return;
      }
      executeAddToCart(product, variant, qty);
    },
    [user, openAuthGate, executeAddToCart]
  );

  const addBundleToCart = useCallback(
    (products: Product[], title?: string) => {
      if (products.length === 0) return;
      if (!user) {
        openAuthGate({
          intent: 'add_to_cart',
          product: products[0],
          bundleProducts: products,
          bundleTitle: title,
          sourcePath: window.location.pathname,
          note: title ? `Bundle / Multi-item: ${title}` : undefined,
        });
        return;
      }
      products.forEach((p, idx) => executeAddToCart(p, undefined, 1, idx > 0));
      if (title) showToast(`Added ${title} items to bag`);
    },
    [user, openAuthGate, executeAddToCart, showToast]
  );

  const updateCartQty = useCallback((productId: string, variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId && item.variant.id === variantId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId: string, variantId: string) => {
    setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.variant.id === variantId)));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const executeToggleWishlist = useCallback(
    (productId: string, product?: Product, uidOverride?: string, skipLead = false) => {
      const targetPatronId = uidOverride || patronId;
      setWishlist((prev) => {
        const exists = prev.includes(productId);
        const next = exists ? prev.filter((id) => id !== productId) : [productId, ...prev];
        showToast(exists ? 'Removed from Pasand wishlist' : 'Saved to Pasand wishlist');
        if (uidOverride || user) {
          syncWishlistToFirestore(uidOverride || user!.uid, next).catch(() => {});
        }
        return next;
      });
      fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patronId: targetPatronId, productId }),
      }).catch(() => {});
      if (!skipLead) {
        void recordLead({
          intent: 'wishlist_like',
          productId,
          product,
          sourcePath: window.location.pathname,
        });
      }
    },
    [patronId, recordLead, showToast, user]
  );

  const toggleWishlist = useCallback(
    (productId: string, product?: Product) => {
      if (!user) {
        openAuthGate({
          intent: 'wishlist_like',
          productId,
          product,
          sourcePath: window.location.pathname,
        });
        return;
      }
      executeToggleWishlist(productId, product);
    },
    [user, openAuthGate, executeToggleWishlist]
  );

  const clearWishlist = useCallback(() => {
    setWishlist([]);
    if (user) {
      syncWishlistToFirestore(user.uid, []).catch(() => {});
    }
    fetch(`/api/wishlist?patronId=${encodeURIComponent(patronId)}`, { method: 'DELETE' }).catch(() => {});
    showToast('Cleared Pasand wishlist');
  }, [patronId, showToast, user]);

  const requireAuthForAction = useCallback(
    (intent: PendingLeadIntent, onReady: () => void) => {
      if (!user) {
        openAuthGate({
          ...intent,
          onAuthenticated: onReady,
        });
        return;
      }
      void recordLead({
        intent: intent.intent,
        product: intent.product,
        productId: intent.productId,
        sourcePath: intent.sourcePath,
        note: intent.note,
      });
      onReady();
    },
    [user, openAuthGate, recordLead]
  );

  // Resume pending intent & punch lead immediately upon authentication
  useEffect(() => {
    if (!user || !pendingIntent) return;
    const intentSnapshot = pendingIntent;
    const meta = pendingMetaRef.current;
    setPendingIntent(null);
    setAuthGateOpen(false);
    pendingMetaRef.current = {};

    const phone = meta.phone || intentSnapshot.phone || user.phoneNumber || undefined;
    const note = meta.note || intentSnapshot.note;

    void (async () => {
      await recordLead({
        intent: intentSnapshot.intent,
        product: intentSnapshot.product,
        productId: intentSnapshot.productId ?? intentSnapshot.product?.id,
        productSlug:
          intentSnapshot.product?.slug ||
          (intentSnapshot.route?.page === 'product' ? intentSnapshot.route.slug : undefined),
        sourcePath: intentSnapshot.sourcePath,
        phone,
        note,
      });

      if (intentSnapshot.intent === 'product_click' && intentSnapshot.route) {
        performNavigate(intentSnapshot.route);
      } else if (intentSnapshot.intent === 'add_to_cart') {
        if (intentSnapshot.bundleProducts && intentSnapshot.bundleProducts.length > 0) {
          intentSnapshot.bundleProducts.forEach((bp) => executeAddToCart(bp, undefined, 1, true));
          if (intentSnapshot.bundleTitle) {
            showToast(`Added ${intentSnapshot.bundleTitle} items to bag`);
          }
        } else if (intentSnapshot.product) {
          executeAddToCart(intentSnapshot.product, intentSnapshot.variant, intentSnapshot.qty ?? 1, true);
        }
      } else if (intentSnapshot.intent === 'wishlist_like') {
        const pid = intentSnapshot.productId ?? intentSnapshot.product?.id;
        if (pid) executeToggleWishlist(pid, intentSnapshot.product, user.uid, true);
      } else if (intentSnapshot.intent === 'checkout_start') {
        setCartOpen(false);
        performNavigate({ page: 'checkout' });
      } else if (intentSnapshot.onAuthenticated) {
        intentSnapshot.onAuthenticated();
      }
    })();
  }, [
    user,
    pendingIntent,
    recordLead,
    performNavigate,
    executeAddToCart,
    executeToggleWishlist,
    showToast,
  ]);

  const recordViewed = useCallback(
    (product: Product) => {
      setRecentlyViewed((prev) => [product, ...prev.filter((p) => p.id !== product.id)].slice(0, 6));
      if (user) {
        void recordLead({
          intent: 'product_click',
          product,
          sourcePath: window.location.pathname,
        });
      }
    },
    [recordLead, user]
  );

  const isGiVerified = useCallback(
    (claimId?: string) => {
      if (!claimId) return false;
      const claim = claimsRegistry.find((c) => c.id === claimId);
      return Boolean(claim?.verified);
    },
    [claimsRegistry]
  );

  return (
    <StoreContext.Provider
      value={{
        theme,
        festiveMode,
        toggleFestiveMode,
        lang,
        toggleLang,
        t,
        reduceMotion,
        toggleReduceMotion: () => setReduceMotion((p) => !p),
        soundEnabled,
        toggleSound: () => setSoundEnabled((p) => !p),
        playChime,
        route,
        navigate,
        isTransitioning,
        cart,
        cartOpen,
        setCartOpen,
        addToCart,
        addBundleToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        wishlist,
        patronId,
        toggleWishlist,
        clearWishlist,
        recentlyViewed,
        recordViewed,
        moharCoins,
        refreshAccountMetrics,
        categories,
        toast,
        showToast,
        searchOpen,
        setSearchOpen,
        isProductionEnv,
        adminConfig,
        claimsRegistry,
        legalConfig,
        guildMetrics: HERITAGE_GUILD_METRICS,
        isGiVerified,
        refreshStoreConfig,
        user,
        authReady,
        authBusy,
        signInWithGoogle,
        signOutUser,
        authGateOpen,
        pendingIntent,
        openAuthGate,
        closeAuthGate,
        updatePendingLeadMeta,
        recordLead,
        requireAuthForAction,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
