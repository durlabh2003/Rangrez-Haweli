import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Info, MapPin, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Artisan, BlogPost, Product } from '../types';
import { CRAFT_MEDIA_ASSETS as GENERATED_IMAGES } from '../config/heritageConstants';
import { HawaMahalSimulation } from '../components/HawaMahalSimulation';
import { JaaliDivider, ResilientImage } from '../components/RajasthaniMotifs';
import { LandingProductFinder } from '../components/LandingProductFinder';
import { TermGloss } from '../components/TermGloss';

const ArtisanCommunityCarousel = lazy(() =>
  import('../components/ArtisanCommunityCarousel').then((m) => ({
    default: m.ArtisanCommunityCarousel,
  }))
);
const MeetTheArtisanSection = lazy(() =>
  import('../components/MeetTheArtisanSection').then((m) => ({
    default: m.MeetTheArtisanSection,
  }))
);

function LazyBelowFold({
  children,
  minHeight = 320,
}: {
  children: React.ReactNode;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '280px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible]);

  return (
    <div ref={ref} style={!visible ? { minHeight } : undefined}>
      {visible ? (
        <Suspense
          fallback={
            <div
              className="max-w-7xl mx-auto px-4 py-12 text-center text-xs text-[var(--rh-ink-muted)]"
              style={{ minHeight }}
            >
              Loading artisan stories…
            </div>
          }
        >
          {children}
        </Suspense>
      ) : null}
    </div>
  );
}

const MAP_TOWNS = [
  {
    name: 'Sanganer',
    x: 60,
    y: 44,
    craft: 'Sanganeri Block Print',
    claimId: 'gi-sanganeri',
    note: 'Fine floral motifs stamped with carved teakwood gadh, rekh, and datta blocks on crisp ivory cotton.',
  },
  {
    name: 'Bagru',
    x: 54,
    y: 47,
    craft: 'Bagru & Dabu Indigo',
    claimId: 'gi-bagru',
    note: 'River-clay Dabu mud-resist dyed in fermented indigo and madder vats under the Jaipur sun.',
  },
  {
    name: 'Jaipur',
    x: 62,
    y: 39,
    craft: 'Blue Pottery & Meenakari',
    claimId: 'gi-blue-pottery',
    note: 'Lead-free quartz stoneware fired in cobalt oxide alongside fired-enamel Meenakari jewellery.',
  },
  {
    name: 'Pratapgarh',
    x: 63,
    y: 79,
    craft: 'Thewa Gold-on-Glass',
    claimId: 'gi-thewa',
    note: '23k gold filigree fused onto molten Belgian emerald and ruby glass panels.',
  },
  {
    name: 'Shahpura',
    x: 53,
    y: 62,
    craft: 'Phad Scroll Painting',
    claimId: undefined,
    note: 'Seven-century-old narrative folk scrolls painted with mineral pigments on starched khadi.',
  },
  {
    name: 'Jodhpur',
    x: 33,
    y: 50,
    craft: 'Jodhpuri Mojari & Dhurries',
    claimId: undefined,
    note: 'Hand-stitched vegetable-tanned camel leather mojaris and Punja-woven cotton dhurries.',
  },
  {
    name: 'Bikaner',
    x: 34,
    y: 26,
    craft: 'Tooled Camel Leather & Usta',
    claimId: undefined,
    note: 'Heirloom leather totes, travel folios, and translucent camel parchment lampshades.',
  },
];

const BANDHANI_SWATCHES = [
  { name: 'Rani Pink', hex: '#B3123F' },
  { name: 'Kesariya', hex: '#F28C1B' },
  { name: 'Peacock Green', hex: '#0F7B6C' },
  { name: 'Bagru Indigo', hex: '#1F3A93' },
];

export function HomeView() {
  const {
    navigate,
    t,
    categories,
    addToCart,
    guildMetrics,
    isGiVerified,
  } = useStore();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showMethodNote, setShowMethodNote] = useState(false);

  const [blockReveal, setBlockReveal] = useState(58);
  const [stampedMotifs, setStampedMotifs] = useState<{ x: number; y: number; id: number }[]>([
    { x: 28, y: 42, id: 1 },
    { x: 64, y: 60, id: 2 },
  ]);
  const [bandhaniSwatch, setBandhaniSwatch] = useState(BANDHANI_SWATCHES[0]);
  const [activeHotspot, setActiveHotspot] = useState<'vase' | 'razai'>('vase');
  const [mouseTilt, setMouseTilt] = useState({ x: 50, y: 50 });
  const [activeTown, setActiveTown] = useState(MAP_TOWNS[0]);

  useEffect(() => {
    fetch('/api/products?sort=featured')
      .then((r) => r.json())
      .then((d) => setFeatured((d.products ?? []).slice(0, 12)))
      .catch(() => {});
    fetch('/api/artisans')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setArtisans(d))
      .catch(() => {});
    fetch('/api/blog')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setPosts(d.slice(0, 3)))
      .catch(() => {});
  }, []);

  const hotspotProduct =
    featured.find((p) =>
      activeHotspot === 'vase'
        ? p.slug.includes('blue-pottery-vase')
        : p.slug.includes('jaipuri-razai')
    ) ?? featured[0];

  const totalCatalogCount = categories.reduce((sum, c) => sum + (c.productCount ?? 0), 0);

  return (
    <div className="paper-grain">
      {/* 1. HAWA MAHAL HTML-FIRST LCP POSTER + GATED WALKTHROUGH */}
      <HawaMahalSimulation />

      {/* 1B. INSIDE THE HAVELI WELCOME & TRANSPARENCY STRIP */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 pt-6 sm:pt-10 pb-6 sm:pb-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 sm:gap-6 pb-6 sm:pb-8">
          <div className="space-y-2.5 sm:space-y-3 max-w-2xl">
            <p className="text-xs font-medium tracking-wider uppercase text-[var(--rh-primary)]">
              <TermGloss term="Padharo">
                {t(
                  `Padharo · ${guildMetrics.partnerGuildsCount} partner cooperatives · ${guildMetrics.documentedCraftRegions} craft regions`,
                  `पधारो · राजस्थान के ${guildMetrics.partnerGuildsCount} शिल्प संघों से सीधे आपके द्वार`
                )}
              </TermGloss>
            </p>
            <h2 className="font-display text-2xl sm:text-4xl lg:text-[2.75rem] font-bold leading-[1.12] text-[var(--rh-ink)] text-balance">
              {t('Wear the desert. Gift a palace.', 'मरुधरा पहनें। राजसी विरासत भेंट करें।')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--rh-ink-muted)] leading-relaxed">
              Hand-blocked Sanganeri cottons, Pratapgarh Thewa gold-on-glass, Jaipur Blue Pottery,
              and Jodhpuri mojaris—with transparent artisan unit economics and domestic + global B2B.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate({ page: 'shop' })}
              className="px-4 sm:px-6 min-h-[44px] py-2.5 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg bg-[var(--rh-primary)] text-white hover:bg-[var(--rh-primary-hover)] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>{t('Shop Collection', 'संग्रह देखें')}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'b2b' })}
              className="px-4 sm:px-5 min-h-[44px] py-2.5 sm:py-3 text-xs sm:text-sm font-medium rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)] text-[var(--rh-peacock)] hover:border-[var(--rh-primary)] transition-colors cursor-pointer whitespace-nowrap"
            >
              {t('Apply for B2B', 'B2B आवेदन')}
            </button>
          </div>
        </div>

        {/* Full-width 4-column Trust & Transparency Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 border-y border-[var(--rh-border)] py-4 sm:py-5">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <ShieldCheck className="w-5 h-5 text-[var(--rh-peacock)] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs sm:text-sm font-semibold font-mono-num">
                {guildMetrics.typicalArtisanSharePct}% Typical Maker Share
              </p>
              <p className="text-[11px] sm:text-xs text-[var(--rh-ink-muted)]">
                Pre-discount full-price unit split
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 sm:gap-3">
            <Sparkles className="w-5 h-5 text-[var(--rh-kesariya)] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs sm:text-sm font-semibold">Traditional Regional Crafts</p>
              <p className="text-[11px] sm:text-xs text-[var(--rh-ink-muted)]">
                Documented origin & material provenance
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 sm:gap-3">
            <Truck className="w-5 h-5 text-[var(--rh-primary)] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs sm:text-sm font-semibold">Free Delivery ₹1,999+</p>
              <p className="text-[11px] sm:text-xs text-[var(--rh-ink-muted)]">
                UPI, Cards, Netbanking & eligible COD
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 sm:gap-3">
            <Check className="w-5 h-5 text-[var(--rh-indigo)] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs sm:text-sm font-semibold">Export & B2B Ready</p>
              <p className="text-[11px] sm:text-xs text-[var(--rh-ink-muted)]">
                Tiered trade margins · HSN GST invoices
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 1C. DIRECT LANDING PAGE PRODUCT FINDER */}
      <LandingProductFinder />

      {/* 2. INTERACTIVE CRAFT STUDIO CAROUSEL */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5 sm:mb-6">
          <div>
            <p className="text-xs font-medium text-[var(--rh-primary)] uppercase tracking-wider">
              Interactive Craft Studio
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">
              Touch the technique before you wear it
            </h2>
          </div>
          <div className="flex items-center gap-1.5 bg-[var(--rh-surface-muted)] p-1 rounded-lg overflow-x-auto no-scrollbar max-w-full">
            {['Block Print', 'Bandhani Dye', 'Shop the Room', 'Meenakari', 'Festive Boxes'].map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className={`px-3 min-h-[38px] text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSlide === idx
                    ? 'bg-[var(--rh-surface)] text-[var(--rh-ink)] shadow-xs font-semibold'
                    : 'text-[var(--rh-ink-muted)] hover:text-[var(--rh-ink)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-4 sm:p-8">
          {activeSlide === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <h3 className="font-display text-2xl font-semibold">Sanganeri Block-Print Studio</h3>
                <p className="text-sm text-[var(--rh-ink-muted)] leading-relaxed">
                  Drag the reveal bar to watch raw unbleached cotton transform under carved teakwood blocks, or click
                  anywhere on the fabric canvas to stamp a floral lotus motif.
                </p>
                <div className="space-y-2">
                  <label htmlFor="block-reveal-slider" className="text-xs font-medium flex justify-between">
                    <span>Reveal Printed Cotton</span>
                    <span className="font-mono-num">{blockReveal}%</span>
                  </label>
                  <input
                    id="block-reveal-slider"
                    type="range"
                    min={10}
                    max={100}
                    value={blockReveal}
                    onChange={(e) => setBlockReveal(Number(e.target.value))}
                    className="w-full accent-[#B3123F]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'shop', craft: 'Sanganeri' })}
                  className="min-h-[44px] px-5 py-2.5 text-sm font-medium bg-[var(--rh-primary)] text-white rounded-lg hover:bg-[var(--rh-primary-hover)] cursor-pointer"
                >
                  Shop Sanganeri Collection
                </button>
              </div>
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                  const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                  setStampedMotifs((prev) => [...prev.slice(-7), { x, y, id: Date.now() }]);
                }}
                className="lg:col-span-6 relative h-72 rounded-xl overflow-hidden border border-[var(--rh-border)] cursor-crosshair bg-[#FBF3E4]"
                title="Click to stamp a woodblock motif"
              >
                <ResilientImage
                  src={GENERATED_IMAGES.slideTeakwoodBlocks}
                  alt="Carved Sagwan teakwood Sanganeri printing blocks beside madder and ochre dye trays"
                  width={720}
                  height={480}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-y-0 right-0 bg-[#F4E8D1] border-l-2 border-[#B3123F] flex items-center justify-center"
                  style={{ width: `${100 - blockReveal}%` }}
                >
                  <span className="text-xs font-medium text-[#2A1410] px-2 text-center">Raw Unbleached Mulmul</span>
                </div>
                {stampedMotifs.map((m) => (
                  <span
                    key={m.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: `${m.x}%`, top: `${m.y}%` }}
                  >
                    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
                      <circle cx="14" cy="14" r="10" fill="#B3123F" fillOpacity="0.25" stroke="#B3123F" strokeWidth="1.5" />
                      <circle cx="14" cy="14" r="3" fill="#0F7B6C" />
                    </svg>
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeSlide === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <h3 className="font-display text-2xl font-semibold">Shekhawati Bandhani Dye Lab</h3>
                <p className="text-sm text-[var(--rh-ink-muted)] leading-relaxed">
                  Select a traditional natural-vat shade below to preview hand-tied ekdali dots across Gajji silk.
                </p>
                <div className="flex flex-wrap gap-3">
                  {BANDHANI_SWATCHES.map((sw) => (
                    <button
                      key={sw.name}
                      type="button"
                      onClick={() => setBandhaniSwatch(sw)}
                      className={`px-3.5 min-h-[40px] py-2 text-xs font-medium rounded-lg border flex items-center gap-2 cursor-pointer ${
                        bandhaniSwatch.name === sw.name
                          ? 'border-[var(--rh-ink)] bg-[var(--rh-surface-muted)]'
                          : 'border-[var(--rh-border)]'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: sw.hex }} />
                      <span>{sw.name}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'shop', craft: 'Bandhani' })}
                  className="min-h-[44px] px-5 py-2.5 text-sm font-medium bg-[var(--rh-primary)] text-white rounded-lg hover:bg-[var(--rh-primary-hover)] cursor-pointer"
                >
                  Shop Bandhani in {bandhaniSwatch.name}
                </button>
              </div>
              <div
                className="lg:col-span-6 h-72 rounded-xl border border-[var(--rh-border)] flex items-center justify-center transition-colors duration-300 relative overflow-hidden"
                style={{ backgroundColor: bandhaniSwatch.hex }}
              >
                <svg viewBox="0 0 320 200" className="w-full h-full opacity-90" aria-hidden="true">
                  {Array.from({ length: 48 }).map((_, i) => {
                    const cx = 24 + (i % 8) * 38;
                    const cy = 24 + Math.floor(i / 8) * 30;
                    return (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r="5" fill="none" stroke="#FBF3E4" strokeWidth="1.6" strokeDasharray="2 2" />
                        <circle cx={cx} cy={cy} r="1.8" fill="#F4B400" />
                      </g>
                    );
                  })}
                </svg>
                <span className="absolute bottom-3 right-3 text-xs font-mono-num text-white/90 bg-black/35 px-3 py-1 rounded">
                  Ekdali knot motif · {bandhaniSwatch.name}
                </span>
              </div>
            </div>
          )}

          {activeSlide === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 relative h-72 rounded-xl overflow-hidden border border-[var(--rh-border)]">
                <ResilientImage
                  src={GENERATED_IMAGES.slideHaveliRoom}
                  alt={
                    activeHotspot === 'razai'
                      ? 'Jaipur haveli room featuring hand-blocked indigo cushions and carved wooden console'
                      : 'Jaipur haveli room styled with Punja wool dhurrie, terracotta planter, and stoneware'
                  }
                  width={720}
                  height={480}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setActiveHotspot('razai')}
                  aria-label="Inspect Jaipuri Razai Quilt"
                  className={`absolute left-[22%] top-[58%] w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold cursor-pointer transition-transform ${
                    activeHotspot === 'razai' ? 'bg-[#B3123F] text-white scale-110' : 'bg-white text-[#2A1410]'
                  }`}
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHotspot('vase')}
                  aria-label="Inspect Blue Pottery Vase"
                  className={`absolute left-[50%] top-[48%] w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold cursor-pointer transition-transform ${
                    activeHotspot === 'vase' ? 'bg-[#B3123F] text-white scale-110' : 'bg-white text-[#2A1410]'
                  }`}
                >
                  2
                </button>
              </div>
              <div className="lg:col-span-6 space-y-4">
                <p className="text-xs font-medium text-[var(--rh-peacock)] uppercase">Shop the Haveli Room</p>
                <h3 className="font-display text-2xl font-semibold">
                  {hotspotProduct ? hotspotProduct.name : 'Blue Pottery & Hand-Quilted Razai'}
                </h3>
                <p className="text-sm text-[var(--rh-ink-muted)]">
                  {hotspotProduct?.shortDescription ||
                    'Select either numbered pin on the haveli console to inspect its live artisan product card.'}
                </p>
                {hotspotProduct && (
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <span className="font-mono-num text-xl font-bold">
                      ₹{hotspotProduct.price.toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      onClick={() => addToCart(hotspotProduct)}
                      className="min-h-[42px] px-4 py-2 text-sm font-medium rounded-lg bg-[var(--rh-primary)] text-white hover:bg-[var(--rh-primary-hover)] cursor-pointer"
                    >
                      Add to Bag
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigate({ page: 'product', slug: hotspotProduct.slug }, { product: hotspotProduct })
                      }
                      className="text-sm font-medium underline underline-offset-4 hover:text-[var(--rh-primary)] cursor-pointer"
                    >
                      View Craft Passport
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSlide === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <h3 className="font-display text-2xl font-semibold">Meenakari &amp; Pratapgarh Thewa Heritage</h3>
                <p className="text-sm text-[var(--rh-ink-muted)] leading-relaxed">
                  Move your cursor across the jewel plate to preview how vitreous enamel and 23k fused gold catch warm
                  diya light.
                </p>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'shop', category: 'jewellery' })}
                  className="min-h-[44px] px-5 py-2.5 text-sm font-medium bg-[var(--rh-primary)] text-white rounded-lg hover:bg-[var(--rh-primary-hover)] cursor-pointer"
                >
                  Explore Heritage Jewellery
                </button>
              </div>
              <div
                onMouseMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setMouseTilt({
                    x: ((e.clientX - r.left) / r.width) * 100,
                    y: ((e.clientY - r.top) / r.height) * 100,
                  });
                }}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  if (!touch) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  setMouseTilt({
                    x: Math.max(0, Math.min(100, ((touch.clientX - r.left) / r.width) * 100)),
                    y: Math.max(0, Math.min(100, ((touch.clientY - r.top) / r.height) * 100)),
                  });
                }}
                className="lg:col-span-6 relative h-64 sm:h-72 rounded-xl overflow-hidden border border-[#C9A227]/40"
              >
                <ResilientImage
                  src={GENERATED_IMAGES.slideJewelTray}
                  alt="Velvet jeweller tray displaying Meenakari peacock earrings, Kundan choker, and lac bangles"
                  width={720}
                  height={480}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle 140px at ${mouseTilt.x}% ${mouseTilt.y}%, rgba(255,245,200,0.28), transparent 70%)`,
                  }}
                />
              </div>
            </div>
          )}

          {activeSlide === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <h3 className="font-display text-2xl font-semibold">Festive Hampers &amp; Corporate Gifting</h3>
                <p className="text-sm text-[var(--rh-ink-muted)] leading-relaxed">
                  Heirloom gift boxes pairing brass diyas, terracotta kulhads, Pushkar rose candles, and hand-stamped
                  linen—ready for Diwali, weddings, and bespoke corporate orders.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate({ page: 'shop', category: 'gifting-festive' })}
                    className="min-h-[44px] px-5 py-2.5 text-sm font-medium bg-[var(--rh-primary)] text-white rounded-lg hover:bg-[var(--rh-primary-hover)] cursor-pointer"
                  >
                    Shop Gift Boxes
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate({ page: 'b2b' })}
                    className="min-h-[44px] px-5 py-2.5 text-sm font-medium rounded-lg border border-[var(--rh-border)] hover:border-[var(--rh-primary)] cursor-pointer"
                  >
                    Open Corporate Gift Builder
                  </button>
                </div>
              </div>
              <div className="lg:col-span-6 h-72 rounded-xl overflow-hidden border border-[var(--rh-border)]">
                <ResilientImage
                  src={GENERATED_IMAGES.slideCorporateHamper}
                  alt="Bespoke corporate walnut heritage hamper with camel-leather folio, brass peacock, and kulhad mugs"
                  width={720}
                  height={480}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <JaaliDivider />

      {/* 3. SHOP BY CATEGORY (6 Arched Tiles) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-7 sm:py-8">
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            <p className="text-xs font-medium text-[var(--rh-primary)] uppercase tracking-wider">6 Craft Houses</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">Shop by Category</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate({ page: 'shop' })}
            className="text-xs sm:text-sm font-medium text-[var(--rh-primary)] hover:underline cursor-pointer whitespace-nowrap"
          >
            View all {totalCatalogCount > 0 ? totalCatalogCount : 'crafts'} →
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => navigate({ page: 'shop', category: cat.slug })}
              className="group text-left bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl p-2.5 sm:p-3 hover:border-[var(--rh-primary)] transition-all cursor-pointer"
            >
              <div className="aspect-[3/4] w-full jharokha-clip overflow-hidden bg-[var(--rh-surface-muted)]">
                <ResilientImage
                  src={cat.heroImage}
                  alt={cat.name}
                  width={360}
                  height={480}
                  sizes="(max-width: 768px) 44vw, 180px"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-[var(--rh-ink)] group-hover:text-[var(--rh-primary)] truncate">
                {cat.name}
              </p>
              <p className="text-xs text-[var(--rh-ink-muted)] font-mono-num">
                {cat.productCount ?? 0} crafts
              </p>
            </button>
          ))}
        </div>
      </section>

      <JaaliDivider />

      {/* 5. INTERACTIVE RAJASTHAN CRAFT EXPLORER + WHERE YOUR MONEY GOES */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* Stylised Rajasthan Craft Map */}
          <div className="lg:col-span-7 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-4 sm:p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--rh-primary)] uppercase tracking-wider">Craft Explorer</p>
              <h2 className="font-display text-2xl font-bold mt-1">
                {guildMetrics.documentedCraftRegions} Towns, Living Traditions
              </h2>
            </div>

            <div className="mt-5 sm:mt-6 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
              <div className="md:col-span-7 relative aspect-[4/3] rounded-xl bg-[var(--rh-surface-muted)]/60 border border-[var(--rh-border)] overflow-hidden">
                <svg viewBox="0 0 100 100" className="w-full h-full" role="img" aria-label="Interactive map of Rajasthani craft towns">
                  <path
                    d="M22 25 L48 12 L75 24 L82 48 L70 86 L46 88 L20 68 L12 44 Z"
                    fill="#F4E8D1"
                    stroke="#C9A227"
                    strokeWidth="1.2"
                    className="dark:fill-[#1E2549]"
                  />
                  {MAP_TOWNS.map((town) => {
                    const selected = activeTown.name === town.name;
                    return (
                      <g
                        key={town.name}
                        role="button"
                        tabIndex={0}
                        aria-label={`Select ${town.name}: ${town.craft}`}
                        onClick={() => setActiveTown(town)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setActiveTown(town);
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={town.x}
                          cy={town.y}
                          r={selected ? 5.2 : 3.6}
                          fill={selected ? '#B3123F' : '#0F7B6C'}
                          stroke="#FFFFFF"
                          strokeWidth="1"
                        />
                        <text
                          x={town.x + 5}
                          y={town.y + 1.5}
                          fontSize="4.4"
                          fontWeight={selected ? '700' : '500'}
                          fill="currentColor"
                        >
                          {town.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="md:col-span-5 space-y-3">
                <div className="flex items-center gap-2 text-[var(--rh-primary)]">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider">{activeTown.name}</span>
                </div>
                <h3 className="font-display text-xl font-bold">{activeTown.craft}</h3>
                <p className="text-sm text-[var(--rh-ink-muted)] leading-relaxed">{activeTown.note}</p>
                {activeTown.claimId && isGiVerified(activeTown.claimId) ? (
                  <p className="text-xs font-medium text-[var(--rh-peacock)]">
                    Verified Geographical Indication (GI) Origin
                  </p>
                ) : (
                  <p className="text-xs font-medium text-[var(--rh-ink-muted)]">
                    Traditional Regional Craft Origin
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => navigate({ page: 'shop', region: activeTown.name })}
                  className="px-4 min-h-[44px] py-2 text-xs font-semibold rounded-lg bg-[var(--rh-primary)] text-white hover:bg-[var(--rh-primary-hover)] cursor-pointer"
                >
                  Shop {activeTown.name} Crafts
                </button>
              </div>
            </div>
          </div>

          {/* Transparent Rupee Breakdown */}
          <div className="lg:col-span-5 bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl p-4 sm:p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--rh-peacock)] uppercase tracking-wider">Price Transparency</p>
              <h2 className="font-display text-2xl font-bold mt-1">Where Your Rupee Goes</h2>
              <p className="text-sm text-[var(--rh-ink-muted)] mt-2">
                Typical pre-discount full-price MRP unit split across our cooperative workshops.
              </p>
            </div>

            <div className="my-6 flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
              <svg viewBox="0 0 120 120" className="w-28 h-28 sm:w-32 sm:h-32 shrink-0" aria-hidden="true">
                <circle cx="60" cy="60" r="44" fill="none" stroke="#B3123F" strokeWidth="18" strokeDasharray="143.7 276.4" strokeDashoffset="0" />
                <circle cx="60" cy="60" r="44" fill="none" stroke="#F28C1B" strokeWidth="18" strokeDasharray="60.8 276.4" strokeDashoffset="-143.7" />
                <circle cx="60" cy="60" r="44" fill="none" stroke="#0F7B6C" strokeWidth="18" strokeDasharray="38.7 276.4" strokeDashoffset="-204.5" />
                <circle cx="60" cy="60" r="44" fill="none" stroke="#1F3A93" strokeWidth="18" strokeDasharray="33.2 276.4" strokeDashoffset="-243.2" />
                <text x="60" y="64" textAnchor="middle" fontSize="16" fontWeight="700" fill="currentColor" className="font-mono-num">
                  {guildMetrics.typicalArtisanSharePct}%
                </text>
              </svg>
              <ul className="space-y-2 text-xs flex-1 w-full">
                <li className="flex justify-between font-medium">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-xs bg-[#B3123F]" />Artisan Guild Pay</span>
                  <span className="font-mono-num">{guildMetrics.typicalArtisanSharePct}%</span>
                </li>
                <li className="flex justify-between font-medium">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-xs bg-[#F28C1B]" />Natural Dyes &amp; Craft Material</span>
                  <span className="font-mono-num">{guildMetrics.typicalMaterialsPct}%</span>
                </li>
                <li className="flex justify-between font-medium">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-xs bg-[#0F7B6C]" />Plastic-Free Packing &amp; Courier</span>
                  <span className="font-mono-num">{guildMetrics.typicalLogisticsPct}%</span>
                </li>
                <li className="flex justify-between font-medium">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-xs bg-[#1F3A93]" />Haveli Studio &amp; Care</span>
                  <span className="font-mono-num">{guildMetrics.typicalBrandPct}%</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-3 border-t border-[var(--rh-border)] text-xs text-[var(--rh-ink-muted)]">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowMethodNote((v) => !v)}
                  className="inline-flex items-center gap-1 text-[var(--rh-peacock)] font-medium hover:underline cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Calculation methodology</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'about' })}
                  className="font-medium text-[var(--rh-primary)] hover:underline cursor-pointer"
                >
                  Artisan Impact &amp; Charter →
                </button>
              </div>
              {showMethodNote && (
                <p className="text-[11px] leading-relaxed p-2.5 rounded-lg bg-[var(--rh-bg)] border border-[var(--rh-border)]">
                  {guildMetrics.methodologyNote}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <JaaliDivider />

      {/* 6. LAZY BELOW-THE-FOLD COMMUNITY CAROUSEL */}
      <LazyBelowFold minHeight={360}>
        <ArtisanCommunityCarousel />
      </LazyBelowFold>

      <JaaliDivider />

      {/* 7. LAZY BELOW-THE-FOLD MEET THE ARTISAN */}
      <LazyBelowFold minHeight={420}>
        <MeetTheArtisanSection artisans={artisans} />
      </LazyBelowFold>

      {/* 8. B2B PARTNER TEASER & JOURNAL HIGHLIGHTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        <div className="rounded-2xl bg-[#2A1410] dark:bg-[#171C3A] text-[#FBF3E4] p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border border-[#C9A227]/30">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-widest text-[#F4B400]">
              Trade, Hospitality &amp; Corporate Gifting
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              Hotels, boutiques, and global importers: source direct at tiered B2B pricing after onboarding approval.
            </h2>
            <p className="text-sm text-[#F6EBD6]/80">
              Tiered MOQ breaks starting at 10 units, custom white-label packaging, multi-currency INR/USD/EUR/GBP
              estimates, Net-30 credit for approved GSTIN accounts, and export HS-code documentation.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate({ page: 'b2b' })}
              className="min-h-[44px] px-6 py-3 text-sm font-semibold rounded-lg bg-[#F28C1B] text-[#2A1410] hover:bg-[#F4B400] transition-colors cursor-pointer"
            >
              Open B2B Portal
            </button>
          </div>
        </div>

        {/* Chai pe Charcha Blog Highlights */}
        {posts.length > 0 && (
          <div>
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-medium text-[var(--rh-primary)] uppercase tracking-wider">Chai pe Charcha</p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">Rang aur Rivaaz Journal</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate({ page: 'blog' })}
                className="text-sm font-medium text-[var(--rh-primary)] hover:underline cursor-pointer"
              >
                All stories →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden">
                    <ResilientImage
                      src={post.coverImage}
                      alt={post.title}
                      width={640}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <p className="text-xs text-[var(--rh-ink-muted)]">
                        {post.category} · {post.readingTimeMin} min read
                      </p>
                      <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug">
                        <button
                          type="button"
                          onClick={() => navigate({ page: 'blog', slug: post.slug })}
                          className="text-left hover:text-[var(--rh-primary)] cursor-pointer"
                        >
                          {post.title}
                        </button>
                      </h3>
                      <p className="mt-2 text-xs text-[var(--rh-ink-muted)] line-clamp-2">{post.excerpt}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate({ page: 'blog', slug: post.slug })}
                      className="text-xs font-semibold text-[var(--rh-primary)] self-start hover:underline cursor-pointer"
                    >
                      Read essay →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
