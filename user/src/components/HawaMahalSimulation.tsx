import React, { Suspense, lazy, useState } from 'react';
import { ArrowRight, Compass, FastForward, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const LazyWalkthroughCanvas = lazy(() => import('./HawaMahalWalkthroughCanvas'));

export function HawaMahalSimulation() {
  const { theme, reduceMotion, navigate, t } = useStore();
  const [walkthroughRequested, setWalkthroughRequested] = useState(false);
  const [canvasUnavailable, setCanvasUnavailable] = useState(false);

  const showLiveCanvas = walkthroughRequested && !canvasUnavailable;

  const scrollToShopCollection = () => {
    const target = document.getElementById('home-finder-section');
    if (target) {
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    } else {
      navigate({ page: 'shop', bestseller: true });
    }
  };

  return (
    <section
      aria-label="Hawa Mahal Architectural Hero Banner"
      className="relative w-full h-[50vh] min-h-[340px] sm:h-[58vh] sm:min-h-[420px] md:h-[68vh] md:min-h-[480px] max-h-[640px] overflow-hidden bg-[#22120E]"
    >
      {/* Static Hero Banner Image — No Animation, No Visual Effects */}
      <img
        src="/assets/aistudio/image_18a0c646.png"
        alt="Hawa Mahal pink sandstone facade and panoramic Jaipur skyline"
        width={2048}
        height={861}
        loading="eager"
        decoding="sync"
        fetchPriority="high"
        className="w-full h-full object-cover object-center"
      />

      {/* Optional 3D Walkthrough Only When Explicitly Requested by User */}
      {showLiveCanvas && (
        <div className="absolute inset-0 z-[5]">
          <Suspense fallback={null}>
            <LazyWalkthroughCanvas
              theme={theme}
              onUnavailable={() => setCanvasUnavailable(true)}
            />
          </Suspense>
        </div>
      )}

      {/* Compact Bottom Text Scrim Solely for Headline Contrast */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 sm:h-48 z-10 bg-gradient-to-t from-[#160A08]/85 via-[#160A08]/40 to-transparent"
        aria-hidden="true"
      />

      {/* Top-Right Compact Controls */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-6 z-20 flex flex-wrap items-center gap-2">
        {showLiveCanvas ? (
          <button
            type="button"
            onClick={() => setWalkthroughRequested(false)}
            className="min-h-[44px] sm:min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#160A08]/80 backdrop-blur-sm text-[#FBF3E4] border border-white/25 hover:border-[#F4B400] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to banner</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setCanvasUnavailable(false);
              setWalkthroughRequested(true);
            }}
            className="min-h-[44px] sm:min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#160A08]/80 backdrop-blur-sm text-[#FBF3E4] border border-[#F4B400]/60 hover:bg-[#B3123F] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-[#F4B400]" aria-hidden="true" />
            <span>{t('Walk through Hawa Mahal', 'हवा महल की सैर करें')}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate({ page: 'shop' })}
          className="min-h-[44px] sm:min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#B3123F] text-white hover:bg-[#8E0D31] text-xs font-semibold inline-flex items-center gap-1.5 shadow-lg cursor-pointer"
        >
          <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Shop now</span>
        </button>
      </div>

      {/* Bottom Headline, Value Prop & Dual CTAs */}
      <div className="absolute inset-x-0 bottom-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 pb-5 sm:pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="max-w-xl text-[#FBF3E4]">
          <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight drop-shadow-sm">
            {t('Rajasthan, crafted by hand.', 'राजस्थान की असली हस्तकला, सीधे कारीगरों से।')}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#FBF3E4]/90 leading-relaxed max-w-lg">
            {t(
              'Direct-from-guild block prints, Jaipur Blue Pottery, Pratapgarh Thewa, and heirloom textiles with transparent craft provenance.',
              'सांगानेर, बगरू, प्रतापगढ़ और जयपुर के शिल्पकारों से सीधे प्रामाणिक हस्तशिल्प।'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate({ page: 'shop', bestseller: true })}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#B3123F] hover:bg-[#8E0D31] text-white text-sm font-semibold inline-flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <span>{t('Shop bestsellers', 'लोकप्रिय शिल्प देखें')}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={scrollToShopCollection}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#160A08]/80 hover:bg-[#160A08] text-[#FBF3E4] border border-white/25 text-sm font-semibold cursor-pointer"
          >
            {t('Browse by craft', 'शिल्प चुनें')}
          </button>
        </div>
      </div>
    </section>
  );
}
