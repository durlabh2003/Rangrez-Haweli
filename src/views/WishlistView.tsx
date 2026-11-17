import React, { useEffect, useState } from 'react';
import { CloudCheck, Heart, LogIn, Share2, ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { BandhaniSpinner, KathputliMascot } from '../components/RajasthaniMotifs';

export function WishlistView({ sharedIds }: { sharedIds?: string[] }) {
  const {
    wishlist,
    patronId,
    toggleWishlist,
    clearWishlist,
    addBundleToCart,
    setCartOpen,
    showToast,
    navigate,
    t,
    user,
    authBusy,
    signInWithGoogle,
  } = useStore();
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [sharedProducts, setSharedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      fetch(`/api/wishlist?patronId=${encodeURIComponent(patronId)}`).then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
    ])
      .then(([wishData, prodData]) => {
        if (!active) return;
        const allProducts = (prodData.products ?? []) as Product[];
        const serverProducts = (wishData.products ?? []) as Product[];
        const mergedIds = Array.from(
          new Set([...wishlist, ...serverProducts.map((p) => p.id)])
        );
        const hydrated = mergedIds
          .map((id) => allProducts.find((p) => p.id === id))
          .filter((p): p is Product => Boolean(p));
        setSavedProducts(hydrated);

        if (sharedIds && sharedIds.length > 0) {
          setSharedProducts(allProducts.filter((p) => sharedIds.includes(p.id)));
        } else {
          setSharedProducts([]);
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [patronId, wishlist, sharedIds]);

  const totalValue = savedProducts.reduce((sum, p) => sum + p.price, 0);

  const handleMoveAllToBag = () => {
    const inStockItems = savedProducts.filter((p) => p.variants.some((v) => v.stock > 0));
    if (inStockItems.length === 0) {
      showToast('No in-stock wishlist items to move right now.');
      return;
    }
    addBundleToCart(inStockItems, 'Pasand Wishlist');
    if (user) setCartOpen(true);
  };

  const handleShare = () => {
    const ids = savedProducts.map((p) => p.id).join(',');
    const url = `${window.location.origin}/wishlist${ids ? `?items=${ids}` : ''}`;
    navigator.clipboard?.writeText(url);
    showToast('Pasand wishlist link copied to clipboard!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[var(--rh-border)]">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--rh-primary)] inline-flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>{t('Pasand · Saved Crafts', 'पसंद · सहेजे गए शिल्प')}</span>
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">
            {t('Your Haveli Wishlist', 'आपकी हवेली विशलिस्ट')}
          </h1>
          <p className="text-sm text-[var(--rh-ink-muted)] mt-1 font-mono-num flex flex-wrap items-center gap-2">
            <span>
              {savedProducts.length} {savedProducts.length === 1 ? 'saved craft' : 'saved crafts'}
              {savedProducts.length > 0 && ` · Total value ₹${totalValue.toLocaleString('en-IN')}`}
            </span>
            {user ? (
              <span className="text-xs text-[var(--rh-peacock)] font-sans font-semibold inline-flex items-center gap-1">
                · <CloudCheck className="w-3.5 h-3.5" /> Synced to Google Cloud
              </span>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                disabled={authBusy}
                className="text-xs font-sans font-semibold text-[var(--rh-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                · <LogIn className="w-3.5 h-3.5" /> Sign in with Google to sync
              </button>
            )}
          </p>
        </div>

        {savedProducts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={handleShare}
              className="px-3.5 min-h-[42px] text-xs font-semibold rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)] hover:border-[var(--rh-primary)] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
            <button
              onClick={clearWishlist}
              className="px-3.5 min-h-[42px] text-xs font-semibold rounded-lg border border-[var(--rh-border)] text-[var(--rh-ink-muted)] hover:text-[var(--rh-primary)] hover:border-[var(--rh-primary)] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              onClick={handleMoveAllToBag}
              className="px-4 min-h-[42px] text-xs font-semibold rounded-lg bg-[var(--rh-primary)] text-white hover:bg-[var(--rh-primary-hover)] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Move All to Bag</span>
            </button>
          </div>
        )}
      </div>

      {/* Shared Wishlist Banner (when opened via ?items=...) */}
      {sharedProducts.length > 0 && (
        <section className="p-4 sm:p-6 rounded-2xl bg-[var(--rh-surface)] border border-[#C9A227]/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--rh-peacock)]">
                Shared Pasand Collection
              </p>
              <h2 className="font-display text-xl font-bold mt-0.5">
                {sharedProducts.length} curated crafts shared with you
              </h2>
            </div>
            <button
              onClick={() => {
                sharedProducts.forEach((p) => {
                  if (!wishlist.includes(p.id)) toggleWishlist(p.id, p);
                });
              }}
              className="px-4 min-h-[42px] text-xs font-semibold rounded-lg bg-[var(--rh-peacock)] text-white cursor-pointer self-start"
            >
              Save All to My Wishlist
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {sharedProducts.map((p) => (
              <ProductCard key={`shared-${p.id}`} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Main Saved Crafts Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-[var(--rh-ink-muted)]">
          <BandhaniSpinner size={28} />
          <span className="text-sm">Loading your saved crafts…</span>
        </div>
      ) : savedProducts.length === 0 ? (
        <div className="py-16 text-center bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl space-y-5 px-4">
          <KathputliMascot
            size={76}
            label="Pasand abhi khaali hai — tap the heart icon on any craft to save it here"
          />
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate({ page: 'shop' })}
              className="px-6 min-h-[44px] text-sm font-semibold rounded-lg bg-[var(--rh-primary)] text-white hover:bg-[var(--rh-primary-hover)] cursor-pointer"
            >
              Explore Shop Collection
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {savedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
