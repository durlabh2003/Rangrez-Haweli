import React, { useCallback, useEffect, useState } from 'react';
import {
  Award,
  Bell,
  Expand,
  Heart,
  MapPin,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Artisan, Bundle, Product, ProductVariant } from '../types';
import { HeritageSearchPanel } from '../components/HeritageSearchPanel';
import { ProductCard } from '../components/ProductCard';
import { ProductReviews, StarRatingDisplay } from '../components/ProductReviews';
import { BandhaniSpinner, ResilientImage } from '../components/RajasthaniMotifs';

export function ProductView({ slug }: { slug: string }) {
  const {
    addToCart,
    addBundleToCart,
    toggleWishlist,
    wishlist,
    recordViewed,
    showToast,
    navigate,
    isGiVerified,
    isProductionEnv,
    adminConfig,
    requireAuthForAction,
  } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [ratingSummary, setRatingSummary] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });
  const [similar, setSimilar] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<(Bundle & { products: Product[] })[]>([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [pincode, setPincode] = useState('302001');
  const [pincodeResult, setPincodeResult] = useState<string | null>(null);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.product) {
          const p = data.product as Product;
          setProduct(p);
          setArtisan(data.artisan);
          setRatingSummary({
            avg: p.realRating ?? 0,
            count: p.realReviewCount ?? 0,
          });
          setSimilar(data.similar ?? []);
          setBundles(data.bundles ?? []);
          setSelectedVariant(p.variants[0] ?? null);
          setActiveImageIdx(0);
          recordViewed(p);
          document.title = `${p.name} — Rangrez Haveli`;
        } else {
          setProduct(null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug, recordViewed]);

  const handleRatingUpdate = useCallback((avg: number, count: number) => {
    setRatingSummary({ avg, count });
  }, []);

  if (loading) {
    return (
      <div className="py-28 flex justify-center">
        <BandhaniSpinner size={32} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold">Craft piece not found</h1>
        <p className="text-sm text-[var(--rh-ink-muted)]">
          This piece may have been archived or moved. Explore all live pieces in our catalogue.
        </p>
        <button
          type="button"
          onClick={() => navigate({ page: 'shop' })}
          className="min-h-[44px] px-5 py-2.5 bg-[var(--rh-primary)] text-white rounded-lg cursor-pointer"
        >
          Back to Catalogue
        </button>
      </div>
    );
  }

  const isSaved = wishlist.includes(product.id);
  const currentStock = selectedVariant?.stock ?? 0;
  const verifiedGi = product.giTagged && isGiVerified(product.giClaimId);
  const showRealRatingHeader = ratingSummary.count >= 3 && ratingSummary.avg > 0;
  const activeImg = product.images[activeImageIdx] ?? product.images[0];

  const checkPincode = async () => {
    const res = await fetch(`/api/pincode/${encodeURIComponent(pincode)}`);
    const data = await res.json();
    if (!res.ok) {
      setPincodeResult(data.message || 'Invalid pincode');
      return;
    }
    if (!data.serviceable) {
      setPincodeResult(data.message || 'Not serviceable for this pincode.');
      return;
    }
    setPincodeResult(
      `Serviceable (${data.zone}) · ${data.estimatedDelivery} · ${data.codAllowed ? 'COD Available' : 'Prepaid Only'}`
    );
  };

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail.includes('@')) return;
    requireAuthForAction(
      {
        intent: 'stock_alert',
        product,
        sourcePath: window.location.pathname,
        note: `Restock alert requested for ${notifyEmail}`,
      },
      async () => {
        await fetch('/api/notify-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, email: notifyEmail }),
        });
        showToast('Alert set! We will notify you as soon as the artisan batch arrives.');
        setNotifyEmail('');
      }
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 pb-32 md:pb-24">
      {/* Main Contiguous PDP Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        {/* Sticky Gallery Left */}
        <div className="lg:col-span-6 lg:sticky lg:top-20 space-y-3 sm:space-y-4">
          <div className="relative aspect-square sm:aspect-[4/5] w-full rounded-2xl overflow-hidden border border-[var(--rh-border)] bg-[var(--rh-surface)] group">
            <ResilientImage
              src={activeImg}
              alt={product.name}
              width={720}
              height={900}
              priority
              sizes="(max-width: 1024px) 95vw, 48vw"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {!isProductionEnv && product.isMock && (
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#2A1410]/85 text-[#FBF3E4] text-xs font-semibold uppercase tracking-wider">
                Sample
              </span>
            )}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="Zoom craft photography"
              className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center cursor-pointer"
            >
              <Expand className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIdx(idx)}
                aria-label={`Select photo ${idx + 1}`}
                className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer ${
                  activeImageIdx === idx ? 'border-[var(--rh-primary)]' : 'border-transparent opacity-75 hover:opacity-100'
                }`}
              >
                <ResilientImage
                  src={img}
                  alt={`${product.name} view ${idx + 1}`}
                  width={180}
                  height={180}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Sticky Purchase Module Right */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <p className="text-xs font-medium text-[var(--rh-ink-muted)]">
              {product.craftType} · {product.region} · <span className="font-mono-num">{product.sku}</span>
              {verifiedGi ? (
                <span className="text-[var(--rh-peacock)] font-semibold"> · GI Verified</span>
              ) : (
                <span> · Traditional {product.region} Craft</span>
              )}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2 text-balance">{product.name}</h1>

            <div className="mt-3 flex items-center gap-3 text-sm">
              {showRealRatingHeader ? (
                <>
                  <StarRatingDisplay rating={ratingSummary.avg} size="md" />
                  <span className="font-mono-num font-semibold">{ratingSummary.avg.toFixed(1)}</span>
                  <button
                    type="button"
                    onClick={() => document.getElementById('patron-reviews')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-[var(--rh-ink-muted)] hover:text-[var(--rh-primary)] transition-colors cursor-pointer"
                  >
                    ({ratingSummary.count} verified reviews)
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => document.getElementById('patron-reviews')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-xs font-medium text-[var(--rh-primary)] hover:underline cursor-pointer"
                >
                  {ratingSummary.count > 0
                    ? `${ratingSummary.count} verified review(s) below →`
                    : 'Be the first to review after you receive this piece →'}
                </button>
              )}
            </div>
          </div>

          {/* Pricing (GST-inclusive) */}
          <div className="flex flex-wrap items-baseline gap-3 font-mono-num py-3 border-y border-[var(--rh-border)]">
            <span className="text-3xl font-bold text-[var(--rh-ink)]">₹{product.price.toLocaleString('en-IN')}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-base text-[var(--rh-ink-muted)] line-through">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-semibold text-[var(--rh-peacock)]">
                  Save {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% · Incl. {product.gstRate}% GST
                </span>
              </>
            )}
            {product.mrp <= product.price && (
              <span className="text-xs text-[var(--rh-ink-muted)]">Price inclusive of {product.gstRate}% GST</span>
            )}
          </div>

          <p className="text-sm text-[var(--rh-ink-muted)] leading-relaxed">{product.longDescription}</p>

          {/* Variants */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-medium">
              <div className="flex items-center gap-3">
                <span>Select Option: {selectedVariant?.label}</span>
                {product.category === 'textiles-apparel' && (
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="inline-flex items-center gap-1 text-[var(--rh-primary)] hover:underline cursor-pointer"
                  >
                    <Ruler className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Size Guide</span>
                  </button>
                )}
              </div>
              <span className={`font-mono-num ${currentStock === 0 ? 'text-[var(--rh-primary)]' : 'text-[var(--rh-peacock)]'}`}>
                {currentStock === 0
                  ? 'Out of Stock'
                  : adminConfig.lowStockUrgencyEnabled && currentStock <= 5
                    ? `Only ${currentStock} left in studio`
                    : `${currentStock} in stock`}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`px-4 min-h-[44px] py-2 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
                    selectedVariant?.id === v.id
                      ? 'border-[var(--rh-primary)] bg-[var(--rh-primary)] text-white'
                      : 'border-[var(--rh-border)] bg-[var(--rh-surface)] hover:border-[var(--rh-primary)]'
                  }`}
                >
                  {v.label} {v.stock === 0 ? '(Sold Out)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Actions or Back-in-Stock Notify */}
          {currentStock > 0 ? (
            <div className="flex gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => addToCart(product, selectedVariant ?? undefined)}
                className="flex-1 min-h-[48px] py-3.5 px-5 sm:px-6 text-sm font-semibold rounded-lg bg-[var(--rh-primary)] text-white hover:bg-[var(--rh-primary-hover)] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                <span>Add to Haveli Bag</span>
              </button>
              <button
                type="button"
                onClick={() => toggleWishlist(product.id, product)}
                aria-label="Toggle wishlist"
                className={`w-12 min-h-[48px] rounded-lg border flex items-center justify-center cursor-pointer shrink-0 ${
                  isSaved
                    ? 'bg-[var(--rh-primary)]/10 border-[var(--rh-primary)] text-[var(--rh-primary)]'
                    : 'border-[var(--rh-border)] bg-[var(--rh-surface)]'
                }`}
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleNotify} className="p-4 rounded-xl bg-[var(--rh-surface-muted)] border border-[var(--rh-border)] space-y-2">
              <p className="text-xs font-semibold inline-flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-[var(--rh-primary)]" aria-hidden="true" />
                This handcrafted batch is resting. Get a restock alert:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 min-h-[44px] px-3 py-2 text-sm rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)]"
                />
                <button type="submit" className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--rh-primary)] text-white cursor-pointer">
                  Notify Me
                </button>
              </div>
            </form>
          )}

          {/* Pincode delivery serviceability */}
          <div className="p-4 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)] space-y-2">
            <label htmlFor="pdp-pincode" className="text-xs font-semibold inline-flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[var(--rh-peacock)]" aria-hidden="true" />
              Check Delivery &amp; COD Serviceability
            </label>
            <div className="flex gap-2">
              <input
                id="pdp-pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                maxLength={6}
                placeholder="Enter 6-digit pincode"
                className="flex-1 min-h-[44px] px-3 py-2 text-sm font-mono-num rounded-lg border border-[var(--rh-border)] bg-[var(--rh-bg)]"
              />
              <button
                type="button"
                onClick={checkPincode}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--rh-border)] hover:border-[var(--rh-primary)] cursor-pointer shrink-0"
              >
                Check
              </button>
            </div>
            {pincodeResult && <p className="text-xs text-[var(--rh-peacock)] font-medium">{pincodeResult}</p>}
          </div>

          {/* Craft Passport + Statutory Origin & HSN Details */}
          <div className="p-5 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)] space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold inline-flex items-center gap-2">
                <Award className="w-5 h-5 text-[#C9A227]" aria-hidden="true" />
                Craft Passport &amp; Provenance
              </h2>
              {verifiedGi && (
                <span className="text-xs font-semibold text-[var(--rh-peacock)] inline-flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" /> GI Certified
                </span>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-[var(--rh-ink-muted)]">Master Artisan</dt>
                <dd className="font-semibold mt-0.5">{artisan?.name ?? 'Partner Guild'}</dd>
              </div>
              <div>
                <dt className="text-[var(--rh-ink-muted)]">Origin Village</dt>
                <dd className="font-semibold mt-0.5 inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" aria-hidden="true" /> {artisan?.village ?? product.region}, {artisan?.district ?? 'Rajasthan'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--rh-ink-muted)]">Manufacturer / Cooperative</dt>
                <dd className="font-semibold mt-0.5">{product.manufacturerName || artisan?.coOperative || 'Partner Rajasthan Guild'}</dd>
              </div>
              <div>
                <dt className="text-[var(--rh-ink-muted)]">Country of Origin</dt>
                <dd className="font-semibold mt-0.5">{product.countryOfOrigin || 'India'}</dd>
              </div>
              <div>
                <dt className="text-[var(--rh-ink-muted)]">Dimensions &amp; Weight</dt>
                <dd className="font-semibold font-mono-num mt-0.5">{product.dimensions} · {product.weightGrams}g</dd>
              </div>
              <div>
                <dt className="text-[var(--rh-ink-muted)]">HSN &amp; Tax Rate</dt>
                <dd className="font-semibold font-mono-num mt-0.5">HSN {product.hsnCode} · {product.gstRate}% GST</dd>
              </div>
            </dl>
            <p className="text-xs text-[var(--rh-ink-muted)] pt-2 border-t border-[var(--rh-border)]">
              <strong>Material &amp; Care:</strong> {product.material} — {product.careInstructions}
            </p>
            <div className="flex flex-wrap gap-3 text-[11px] text-[var(--rh-primary)] pt-1">
              <button type="button" onClick={() => navigate({ page: 'legal', doc: 'returns' })} className="hover:underline cursor-pointer">
                {adminConfig.defaultReturnWindowDays}-day return policy
              </button>
              <button type="button" onClick={() => navigate({ page: 'legal', doc: 'shipping' })} className="hover:underline cursor-pointer">
                Shipping terms
              </button>
            </div>
          </div>

          {/* B2B Partner Tier Teaser */}
          <div className="p-4 rounded-xl bg-[var(--rh-surface-muted)]/60 border border-[var(--rh-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="text-xs">
              <p className="font-semibold">Buying for a boutique, hotel, or corporate gift?</p>
              <p className="text-[var(--rh-ink-muted)] font-mono-num mt-0.5">
                MOQ {product.moq} units · Apply for B2B access to unlock tiered pricing after team approval
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate({ page: 'b2b' })}
              className="min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg border border-[var(--rh-primary)] text-[var(--rh-primary)] hover:bg-[var(--rh-primary)] hover:text-white transition-colors whitespace-nowrap cursor-pointer self-start sm:self-auto"
            >
              B2B Portal
            </button>
          </div>
        </div>
      </div>

      {/* Bundles */}
      {bundles.length > 0 && (
        <section className="mt-14 pt-8 border-t border-[var(--rh-border)]">
          <h2 className="font-display text-2xl font-bold mb-4">Buy the Haveli Set &amp; Save</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bundles.map((b) => (
              <div key={b.id} className="p-5 rounded-xl bg-[var(--rh-surface)] border border-[var(--rh-border)] flex flex-col justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[var(--rh-peacock)]">Save {b.discountPercent}% on bundle</p>
                  <h3 className="font-display text-xl font-bold mt-1">{b.title}</h3>
                  <p className="text-xs text-[var(--rh-ink-muted)] mt-1">
                    Includes: {b.products.map((bp) => bp.name).join(' + ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addBundleToCart(b.products, b.title)}
                  className="self-start min-h-[42px] px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--rh-primary)] text-white cursor-pointer"
                >
                  Add Complete Set
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Verified Product Reviews Component */}
      <ProductReviews
        productId={product.id}
        productSlug={product.slug}
        productName={product.name}
        onRatingUpdate={handleRatingUpdate}
      />

      {/* Grounded GI & Provenance Research */}
      <div className="mt-12">
        <HeritageSearchPanel
          craftContext={`${product.craftType} from ${product.region}, Rajasthan. Material: ${product.material}.`}
          title={`Research ${product.craftType} Heritage`}
          subtitle="Ask live questions verified with Google Search about Geographical Indication status, origin villages, and authentic material care."
          suggestedQueries={[
            `Origin and history of ${product.craftType} in ${product.region}`,
            `How to verify authentic ${product.craftType} handicrafts`,
            `Care guide for ${product.material} crafts`,
          ]}
        />
      </div>

      {/* Similar Crafts */}
      {similar.length > 0 && (
        <section className="mt-12 sm:mt-14 pt-8 border-t border-[var(--rh-border)]">
          <h2 className="font-display text-2xl font-bold mb-5 sm:mb-6">Similar Crafts from the Guild</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {similar.map((s) => (
              <ProductCard key={s.id} product={s} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky Mobile Add-to-Bag Bar */}
      {currentStock > 0 && (
        <div className="md:hidden fixed bottom-11 left-0 right-0 z-30 bg-[var(--rh-surface)]/98 border-t border-[var(--rh-border)] px-3 py-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{product.name}</p>
            <p className="text-xs font-mono-num font-bold text-[var(--rh-primary)]">
              ₹{product.price.toLocaleString('en-IN')} · {selectedVariant?.label}
            </p>
          </div>
          <button
            type="button"
            onClick={() => addToCart(product, selectedVariant ?? undefined)}
            className="min-h-[40px] px-4 rounded-lg bg-[var(--rh-primary)] text-white text-xs font-semibold shrink-0 cursor-pointer"
          >
            Add to Bag
          </button>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged product photo"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close zoom modal"
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-[var(--rh-surface)]">
            <ResilientImage
              src={activeImg}
              alt={product.name}
              width={1080}
              height={1350}
              className="w-full h-full max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* Apparel Size Guide Modal */}
      {sizeGuideOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Handloom Apparel Size Chart"
        >
          <div className="w-full max-w-md bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Handloom &amp; Mulmul Size Guide (Inches)</h2>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(false)}
                aria-label="Close size guide"
                className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--rh-surface-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <table className="w-full text-xs text-left font-mono-num">
              <thead className="border-b border-[var(--rh-border)] text-[var(--rh-ink-muted)] font-sans">
                <tr><th className="py-2">Size</th><th className="py-2">Chest</th><th className="py-2">Shoulder</th><th className="py-2">Length</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--rh-border)]">
                <tr><td className="py-2 font-semibold">S (36)</td><td>38"</td><td>15.0"</td><td>44"</td></tr>
                <tr><td className="py-2 font-semibold">M (38)</td><td>40"</td><td>15.5"</td><td>45"</td></tr>
                <tr><td className="py-2 font-semibold">L (40)</td><td>42"</td><td>16.2"</td><td>46"</td></tr>
                <tr><td className="py-2 font-semibold">XL (42)</td><td>44"</td><td>17.0"</td><td>47"</td></tr>
              </tbody>
            </table>
            <p className="text-[11px] text-[var(--rh-ink-muted)]">
              Pre-washed pure cotton mulmul allows gentle relaxation after first cold rinse.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
