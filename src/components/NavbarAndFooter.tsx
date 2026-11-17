import React, { useEffect, useState } from 'react';
import {
  Building2,
  Compass,
  Heart,
  Home,
  LogIn,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useConsent } from '../context/ConsentContext';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types';
import { BlockPrintBorder, KathputliMascot } from './RajasthaniMotifs';

export function HeaderShell() {
  const {
    festiveMode,
    toggleFestiveMode,
    lang,
    toggleLang,
    t,
    route,
    navigate,
    cart,
    setCartOpen,
    wishlist,
    setSearchOpen,
    isTransitioning,
    user,
    authBusy,
    signInWithGoogle,
    signOutUser,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [route.page]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

      {isTransitioning && (
        <div
          className="fixed top-0 left-0 right-0 h-1 z-50 bg-gradient-to-r from-[#B3123F] via-[#F28C1B] to-[#0F7B6C]"
          aria-hidden="true"
        />
      )}

      {festiveMode && <BlockPrintBorder />}

      {/* Compact Sticky Top Bar (44px mobile + 44px bottom nav = 88px combined sticky mobile chrome) */}
      <header className="sticky top-0 z-40 bg-[var(--rh-bg)]/95 backdrop-blur-md border-b border-[var(--rh-border)]">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-11 md:h-16 flex items-center justify-between gap-2 sm:gap-8">
          <div className="flex items-center gap-1 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="md:hidden w-11 h-11 -ml-1 rounded-lg flex items-center justify-center text-[var(--rh-ink)] hover:bg-[var(--rh-surface-muted)] transition-colors cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'home' })}
              className="font-display text-base sm:text-2xl font-bold tracking-tight text-[var(--rh-ink)] whitespace-nowrap shrink-0 cursor-pointer truncate"
            >
              {t('Rangrez Haveli', 'रंगरेज़ हवेली')}
            </button>
          </div>

          <nav
            className="hidden md:flex items-center gap-5 text-sm font-medium text-[var(--rh-ink-muted)]"
            aria-label="Primary navigation"
          >
            <button
              type="button"
              onClick={() => navigate({ page: 'shop' })}
              className={`hover:text-[var(--rh-primary)] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                route.page === 'shop' ? 'text-[var(--rh-primary)] font-semibold' : ''
              }`}
            >
              {t('Shop', 'दुकान')}
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'b2b' })}
              className={`hover:text-[var(--rh-primary)] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                route.page === 'b2b' ? 'text-[var(--rh-primary)] font-semibold' : ''
              }`}
            >
              {t('B2B', 'B2B व्यापार')}
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'blog' })}
              className={`hover:text-[var(--rh-primary)] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                route.page === 'blog' ? 'text-[var(--rh-primary)] font-semibold' : ''
              }`}
            >
              {t('Journal', 'पत्रिका')}
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'about' })}
              className={`hover:text-[var(--rh-primary)] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                route.page === 'about' ? 'text-[var(--rh-primary)] font-semibold' : ''
              }`}
            >
              {t('About', 'परिचय')}
            </button>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search crafts"
              className="w-11 h-11 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-[var(--rh-ink)] hover:bg-[var(--rh-surface-muted)] transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'wishlist' })}
              aria-label="Pasand wishlist"
              className={`hidden sm:flex w-10 h-10 rounded-lg items-center justify-center transition-colors relative cursor-pointer ${
                route.page === 'wishlist'
                  ? 'text-[var(--rh-primary)] bg-[var(--rh-surface-muted)]'
                  : 'text-[var(--rh-ink)] hover:bg-[var(--rh-surface-muted)]'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${wishlist.length > 0 ? 'fill-current text-[var(--rh-primary)]' : ''}`}
                aria-hidden="true"
              />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--rh-primary)] text-white text-[10px] font-mono-num flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>
            {user ? (
              <button
                type="button"
                onClick={() => navigate({ page: 'account' })}
                aria-label="Patron Account"
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 h-9 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  route.page === 'account'
                    ? 'border-[var(--rh-primary)] text-[var(--rh-primary)] bg-[var(--rh-surface-muted)]'
                    : 'border-[var(--rh-border)] text-[var(--rh-ink)] hover:border-[var(--rh-primary)]'
                }`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Patron'}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover"
                    width={20}
                    height={20}
                  />
                ) : (
                  <User className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span className="max-w-[84px] truncate">
                  {user.displayName?.split(' ')[0] || 'Patron'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                disabled={authBusy}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[var(--rh-border)] text-xs font-medium text-[var(--rh-ink)] hover:border-[var(--rh-primary)] transition-colors cursor-pointer whitespace-nowrap"
              >
                <User className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{authBusy ? 'Signing in…' : t('Sign in', 'लॉगिन')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="px-3 sm:px-4 min-h-[38px] sm:min-h-[40px] text-xs sm:text-sm font-medium bg-[var(--rh-primary)] text-white rounded-lg hover:bg-[var(--rh-primary-hover)] transition-colors inline-flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              <span>{t('Bag', 'थैला')}</span>
              <span className="font-mono-num">({cartCount})</span>
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          <div className="w-[82vw] max-w-xs h-full bg-[var(--rh-surface)] text-[var(--rh-ink)] border-r border-[var(--rh-border)] flex flex-col shadow-2xl overflow-y-auto">
            <div className="px-4 py-3.5 border-b border-[var(--rh-border)] flex items-center justify-between">
              <div>
                <p className="font-display text-lg font-bold">{t('Rangrez Haveli', 'रंगरेज़ हवेली')}</p>
                <p className="text-[11px] text-[var(--rh-ink-muted)]">Jaipur Heritage House</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="w-11 h-11 -mr-1.5 rounded-lg flex items-center justify-center hover:bg-[var(--rh-surface-muted)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-3 space-y-1 flex-1" aria-label="Mobile full navigation">
              {[
                { label: t('Hawa Mahal Entrance', 'हवा महल प्रवेश'), route: { page: 'home' as const }, active: route.page === 'home' },
                { label: t('Shop All Crafts', 'सभी शिल्प खरीदें'), route: { page: 'shop' as const }, active: route.page === 'shop' },
                { label: t('B2B & Hotels', 'B2B व्यापार'), route: { page: 'b2b' as const }, active: route.page === 'b2b' },
                { label: t('Heritage Journal', 'पत्रिका'), route: { page: 'blog' as const }, active: route.page === 'blog' },
                { label: t('Track Order', 'ऑर्डर ट्रैक करें'), route: { page: 'track-order' as const }, active: route.page === 'track-order' },
                { label: t('Our Guilds & Story', 'हमारी कहानी'), route: { page: 'about' as const }, active: route.page === 'about' },
                { label: t('Pasand Wishlist', 'पसंद विशलिस्ट'), route: { page: 'wishlist' as const }, active: route.page === 'wishlist' },
                { label: t('Patron Account & Mohar', 'ग्राहक खाता'), route: { page: 'account' as const }, active: route.page === 'account' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(item.route);
                  }}
                  className={`w-full min-h-[44px] px-3.5 rounded-xl text-left text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    item.active
                      ? 'bg-[var(--rh-primary)] text-white font-semibold'
                      : 'text-[var(--rh-ink)] hover:bg-[var(--rh-surface-muted)]'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-[var(--rh-border)] space-y-3 bg-[var(--rh-bg)]/50">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={toggleLang}
                  className="min-h-[44px] px-2 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)] text-xs font-semibold cursor-pointer"
                >
                  {lang === 'en' ? 'हिन्दी' : 'English'}
                </button>
                <button
                  type="button"
                  onClick={toggleFestiveMode}
                  className={`min-h-[44px] px-2 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer ${
                    festiveMode
                      ? 'border-[#F4B400] bg-[#F4B400]/15 text-[var(--rh-ink)]'
                      : 'border-[var(--rh-border)] bg-[var(--rh-surface)]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tyohaar</span>
                </button>
              </div>

              {user ? (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{user.displayName || 'Patron'}</p>
                    <p className="text-[11px] text-[var(--rh-ink-muted)] truncate">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => signOutUser()}
                    disabled={authBusy}
                    className="min-h-[40px] px-3 rounded-lg border border-[var(--rh-border)] text-xs font-semibold cursor-pointer shrink-0"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signInWithGoogle();
                  }}
                  disabled={authBusy}
                  className="w-full min-h-[44px] rounded-xl bg-[var(--rh-primary)] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{authBusy ? 'Connecting Google…' : 'Sign in with Google'}</span>
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label="Close menu backdrop"
            onClick={() => setMobileMenuOpen(false)}
            className="flex-1 cursor-default"
          />
        </div>
      )}
    </>
  );
}

export function MobileBottomNav() {
  const { route, navigate, cart, setCartOpen, wishlist } = useStore();
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--rh-surface)]/98 backdrop-blur-md border-t border-[var(--rh-border)] px-1 pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile quick navigation"
    >
      <div className="h-11 flex items-center justify-around">
        <button
          type="button"
          onClick={() => navigate({ page: 'home' })}
          className={`flex flex-col items-center justify-center min-w-[52px] min-h-[44px] text-[10px] leading-tight cursor-pointer ${
            route.page === 'home' ? 'text-[var(--rh-primary)] font-semibold' : 'text-[var(--rh-ink-muted)]'
          }`}
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          <span>Home</span>
        </button>
        <button
          type="button"
          onClick={() => navigate({ page: 'shop' })}
          className={`flex flex-col items-center justify-center min-w-[52px] min-h-[44px] text-[10px] leading-tight cursor-pointer ${
            route.page === 'shop' ? 'text-[var(--rh-primary)] font-semibold' : 'text-[var(--rh-ink-muted)]'
          }`}
        >
          <Compass className="w-4 h-4" aria-hidden="true" />
          <span>Shop</span>
        </button>
        <button
          type="button"
          onClick={() => navigate({ page: 'b2b' })}
          className={`flex flex-col items-center justify-center min-w-[52px] min-h-[44px] text-[10px] leading-tight cursor-pointer ${
            route.page === 'b2b' ? 'text-[var(--rh-primary)] font-semibold' : 'text-[var(--rh-ink-muted)]'
          }`}
        >
          <Building2 className="w-4 h-4" aria-hidden="true" />
          <span>B2B</span>
        </button>
        <button
          type="button"
          onClick={() => navigate({ page: 'wishlist' })}
          className={`flex flex-col items-center justify-center min-w-[52px] min-h-[44px] text-[10px] leading-tight relative cursor-pointer ${
            route.page === 'wishlist' ? 'text-[var(--rh-primary)] font-semibold' : 'text-[var(--rh-ink-muted)]'
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'fill-current text-[var(--rh-primary)]' : ''}`} aria-hidden="true" />
          <span>Saved{wishlist.length ? ` (${wishlist.length})` : ''}</span>
        </button>
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="flex flex-col items-center justify-center min-w-[52px] min-h-[44px] text-[10px] leading-tight text-[var(--rh-ink-muted)] relative cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" aria-hidden="true" />
          <span>Bag ({cartCount})</span>
        </button>
      </div>
    </nav>
  );
}

export function SearchModal() {
  const { searchOpen, setSearchOpen, navigate } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (!searchOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [searchOpen, setSearchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/products?q=${encodeURIComponent(trimmed)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((data) => setResults((data.products ?? []).slice(0, 6)))
        .catch(() => {});
    }, 180);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, searchOpen]);

  if (!searchOpen) return null;

  const trending = ['Sanganeri', 'Bagru Indigo', 'Thewa', 'Blue Pottery', 'Jaipuri Razai', 'Mojari'];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-6 sm:pt-16 px-3 sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search Rangrez Haveli"
    >
      <div className="w-full max-w-2xl bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-4 sm:p-6 shadow-xl max-h-[84vh] flex flex-col">
        <div className="flex items-center gap-3 border-b border-[var(--rh-border)] pb-3">
          <Search className="w-5 h-5 text-[var(--rh-ink-muted)] shrink-0" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                setSearchOpen(false);
                navigate({ page: 'shop', q: query.trim() });
              }
            }}
            placeholder="Search Sanganeri kurta, Thewa, Blue Pottery, SKU..."
            aria-label="Search craft catalog"
            className="flex-1 min-w-0 bg-transparent text-base text-[var(--rh-ink)] placeholder:text-[var(--rh-ink-muted)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="w-11 h-11 -mr-2 flex items-center justify-center text-[var(--rh-ink-muted)] hover:text-[var(--rh-ink)] cursor-pointer shrink-0"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 overflow-y-auto">
          {!query.trim() ? (
            <div>
              <p className="text-xs font-medium text-[var(--rh-ink-muted)] mb-3">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {trending.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      navigate({ page: 'shop', q: term });
                    }}
                    className="px-3.5 min-h-[40px] text-xs font-medium rounded-lg bg-[var(--rh-surface-muted)] text-[var(--rh-ink)] hover:bg-[var(--rh-primary)] hover:text-white transition-colors cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center">
              <KathputliMascot size={48} label="Kuch nahi mila — try 'Bagru' or 'Meenakari'" />
            </div>
          ) : (
            <div className="divide-y divide-[var(--rh-border)]">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    navigate({ page: 'product', slug: p.slug }, { product: p });
                  }}
                  className="w-full py-3 min-h-[56px] flex items-center justify-between gap-4 text-left hover:bg-[var(--rh-surface-muted)]/50 px-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--rh-ink)] truncate">{p.name}</p>
                    <p className="text-xs text-[var(--rh-ink-muted)] truncate">
                      {p.craftType} · {p.region} · {p.sku}
                    </p>
                  </div>
                  <span className="font-mono-num text-sm font-semibold text-[var(--rh-primary)] shrink-0">
                    ₹{p.price.toLocaleString('en-IN')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  const {
    navigate,
    reduceMotion,
    toggleReduceMotion,
    soundEnabled,
    toggleSound,
    showToast,
    legalConfig,
  } = useStore();
  const { openPreferences } = useConsent();
  const [email, setEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    if (!marketingConsent) {
      showToast('Please tick the consent box to receive seasonal updates.');
      return;
    }
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, consentAccepted: true }),
    });
    if (res.ok) {
      showToast('Padharo! Code PADHARO10 unlocked for 10% off.');
      setEmail('');
      setMarketingConsent(false);
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'Could not subscribe.');
    }
  };

  return (
    <footer className="mt-14 sm:mt-20 border-t border-[var(--rh-border)] bg-[var(--rh-surface)] text-[var(--rh-ink)] pb-24 md:pb-8">
      <BlockPrintBorder />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10">
        <div className="md:col-span-4 space-y-4">
          <div className="flex items-center gap-4">
            <KathputliMascot size={46} />
            <div>
              <h2 className="font-display text-2xl font-bold">Rangrez Haveli</h2>
              <p className="text-xs text-[var(--rh-ink-muted)]">
                Rajasthan, crafted by hand. Delivered to your door.
              </p>
            </div>
          </div>
          <p className="text-sm text-[var(--rh-ink-muted)] leading-relaxed">
            Direct artisan-first D2C & B2B heritage house partnering with 12 cooperatives across Sanganer, Bagru,
            Pratapgarh, Shahpura, Jodhpur, and Kot Jewar.
          </p>
          <form onSubmit={handleSubscribe} className="space-y-2.5">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email for newsletter dispatches"
                placeholder="Email for 10% first-order privilege"
                className="flex-1 min-h-[44px] px-3 py-2 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              />
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 text-sm font-medium rounded-lg bg-[var(--rh-primary)] text-white hover:bg-[var(--rh-primary-hover)] transition-colors cursor-pointer whitespace-nowrap"
              >
                Join
              </button>
            </div>
            <label className="flex items-start gap-2 text-xs text-[var(--rh-ink-muted)] cursor-pointer">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#B3123F]"
              />
              <span>I consent to receive seasonal craft updates under the Privacy Policy (optional).</span>
            </label>
          </form>
        </div>

        <div className="md:col-span-2 space-y-2.5 text-sm">
          <h3 className="font-semibold text-[var(--rh-ink)]">Shop & Patron Care</h3>
          <ul className="space-y-1.5 text-[var(--rh-ink-muted)]">
            <li><button type="button" onClick={() => navigate({ page: 'shop', category: 'textiles-apparel' })} className="py-1 hover:text-[var(--rh-primary)] cursor-pointer text-left">Textiles & Apparel</button></li>
            <li><button type="button" onClick={() => navigate({ page: 'shop', category: 'home-furnishing' })} className="py-1 hover:text-[var(--rh-primary)] cursor-pointer text-left">Home Furnishing</button></li>
            <li><button type="button" onClick={() => navigate({ page: 'shop', category: 'jewellery' })} className="py-1 hover:text-[var(--rh-primary)] cursor-pointer text-left">Meenakari & Thewa</button></li>
            <li><button type="button" onClick={() => navigate({ page: 'track-order' })} className="py-1 hover:text-[var(--rh-primary)] cursor-pointer text-left font-medium text-[var(--rh-ink)]">Track Your Order</button></li>
            <li><button type="button" onClick={() => navigate({ page: 'wishlist' })} className="py-1 hover:text-[var(--rh-primary)] cursor-pointer text-left">Pasand Wishlist</button></li>
          </ul>
        </div>

        <div className="md:col-span-3 space-y-2.5 text-sm">
          <h3 className="font-semibold text-[var(--rh-ink)]">Haveli, Trade & Policies</h3>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[var(--rh-ink-muted)] text-xs sm:text-sm">
            <li><button type="button" onClick={() => navigate({ page: 'b2b' })} className="py-1 hover:text-[var(--rh-primary)] cursor-pointer text-left">B2B Portal</button></li>
            <li><button type="button" onClick={() => navigate({ page: 'blog' })} className="py-1 hover:text-[var(--rh-primary)] cursor-pointer text-left">Journal</button></li>
            <li><button type="button" onClick={() => navigate({ page: 'legal', doc: 'privacy' })} className="py-1 hover:text-[var(--rh-primary)] cursor-pointer text-left">Privacy (DPDP)</button></li>
            <li><button type="button" onClick={() => navigate({ page: 'legal', doc: 'terms' })} className="py-1 hover:text-[var(--rh-primary)] cursor-pointer text-left">Terms of Sale</button></li>
            <li><button type="button" onClick={() => navigate({ page: 'legal', doc: 'shipping' })} className="py-1 hover:text-[var(--rh-primary)] cursor-pointer text-left">Shipping</button></li>
            <li><button type="button" onClick={() => navigate({ page: 'legal', doc: 'returns' })} className="py-1 hover:text-[var(--rh-primary)] cursor-pointer text-left">Returns</button></li>
            <li><button type="button" onClick={() => navigate({ page: 'legal', doc: 'cancellation' })} className="py-1 hover:text-[var(--rh-primary)] cursor-pointer text-left">Cancellations</button></li>
            <li><button type="button" onClick={() => navigate({ page: 'legal', doc: 'faq' })} className="py-1 hover:text-[var(--rh-primary)] cursor-pointer text-left">FAQ</button></li>
            <li><button type="button" onClick={() => navigate({ page: 'legal', doc: 'contact' })} className="py-1 hover:text-[var(--rh-primary)] cursor-pointer text-left">Contact & Grievance</button></li>
            <li><button type="button" onClick={() => navigate({ page: 'legal', doc: 'fair-design' })} className="py-1 hover:text-[var(--rh-primary)] cursor-pointer text-left">Fair Design</button></li>
            <li><button type="button" onClick={() => navigate({ page: 'admin' })} className="py-1 hover:text-[var(--rh-primary)] cursor-pointer text-left">Admin Console</button></li>
          </ul>
        </div>

        <div className="md:col-span-3 space-y-3 text-xs text-[var(--rh-ink-muted)]">
          <h3 className="text-sm font-semibold text-[var(--rh-ink)]">Preferences & Legal Info</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleSound}
              className="px-3 min-h-[40px] py-1.5 rounded-lg border border-[var(--rh-border)] hover:border-[var(--rh-primary)] inline-flex items-center gap-1.5 cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" aria-hidden="true" /> : <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>{soundEnabled ? 'Chime On' : 'Muted'}</span>
            </button>
            <button
              type="button"
              onClick={toggleReduceMotion}
              className="px-3 min-h-[40px] py-1.5 rounded-lg border border-[var(--rh-border)] hover:border-[var(--rh-primary)] cursor-pointer"
            >
              {reduceMotion ? 'Animations Reduced' : 'Reduce Animations'}
            </button>
            <button
              type="button"
              onClick={openPreferences}
              className="px-3 min-h-[40px] py-1.5 rounded-lg border border-[var(--rh-border)] hover:border-[var(--rh-primary)] cursor-pointer"
            >
              Cookie Preferences
            </button>
          </div>
          <div className="space-y-1 leading-relaxed text-[11px]">
            <p>Entity: {legalConfig.legalEntityName}</p>
            <p>Address: {legalConfig.legalAddress}</p>
            <p>GSTIN: {legalConfig.legalGstin}</p>
            <p>
              Grievance Officer: {legalConfig.grievanceOfficerName} ({legalConfig.grievanceOfficerEmail})
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--rh-border)] px-4 sm:px-6 py-4 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--rh-ink-muted)] text-center sm:text-left">
        <span>© 2026 {legalConfig.legalEntityName}</span>
        <span>Payments: UPI · RuPay · Visa · Mastercard · Netbanking · COD</span>
      </div>
    </footer>
  );
}
