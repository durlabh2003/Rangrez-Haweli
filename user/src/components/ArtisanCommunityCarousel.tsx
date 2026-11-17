import React, { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CRAFT_MEDIA_ASSETS as GENERATED_IMAGES } from '../config/heritageConstants';
import { ResilientImage } from './RajasthaniMotifs';

interface WorkshopStory {
  id: string;
  chapter: string;
  artisanName: string;
  village: string;
  district: string;
  yearsExperience: number;
  cooperative: string;
  craftTitle: string;
  headline: string;
  story: string;
  image: string;
  imageAlt: string;
  shopRegion: string;
  claimId: string;
}

const WORKSHOP_STORIES: WorkshopStory[] = [
  {
    id: 'ws-sanganer',
    chapter: '01',
    artisanName: 'Ramgopal Chippa',
    village: 'Sanganer',
    district: 'Jaipur',
    yearsExperience: 34,
    cooperative: 'Sanganer Rangrez Sangh',
    craftTitle: 'Sanganeri Hand-Block Printing',
    headline: 'Three teakwood blocks per petal, stamped by hand before noon.',
    story:
      'In Ramgopal-ji’s sunlit courtyard, every floral vine passes under carved rekh, gadh, and datta blocks dipped in madder root and pomegranate rind—washed in river-soft water so crisp ivory cotton stays breathable for decades.',
    image: GENERATED_IMAGES.workshopSanganer,
    imageAlt: 'Master printer Ramgopal Chippa stamping carved teakwood block print motifs onto cotton in Sanganer',
    shopRegion: 'Sanganer',
    claimId: 'gi-sanganeri',
  },
  {
    id: 'ws-bagru',
    chapter: '02',
    artisanName: 'Suleman Khan',
    village: 'Bagru',
    district: 'Jaipur',
    yearsExperience: 28,
    cooperative: 'Bagru Chhipa Collective',
    craftTitle: 'Bagru & Dabu Mud-Resist Indigo',
    headline: 'Living indigo vats fermented with jaggery, lime, and desert patience.',
    story:
      'Suleman-ji mixes black river clay, acacia gum, and wheat chaff to paste Dabu resist motifs onto handspun cotton before lowering each length into deep earthen indigo vats and curing it under open Bagru skies.',
    image: GENERATED_IMAGES.workshopBagru,
    imageAlt: 'Artisan Suleman Khan lifting Dabu mud-resist cotton from an earthen indigo dye vat in Bagru',
    shopRegion: 'Bagru',
    claimId: 'gi-bagru',
  },
  {
    id: 'ws-blue-pottery',
    chapter: '03',
    artisanName: 'Gopal Kumhar',
    village: 'Kot Jewar',
    district: 'Jaipur',
    yearsExperience: 26,
    cooperative: 'Jaipur Neela Kumhar Guild',
    craftTitle: 'Jaipur Blue Pottery',
    headline: 'Zero clay, pure crushed quartz glazed in cobalt and turquoise.',
    story:
      'Shaped from powdered quartz stone, raw glass, and katira gum instead of clay, Gopal-ji’s vessels are hand-painted with squirrel-hair brushes and fired once so their mineral blue lustre never fades.',
    image: GENERATED_IMAGES.workshopBluePottery,
    imageAlt: 'Master potter Gopal Kumhar hand-painting cobalt floral motifs onto a Jaipur Blue Pottery vase',
    shopRegion: 'Jaipur',
    claimId: 'gi-blue-pottery',
  },
  {
    id: 'ws-thewa',
    chapter: '04',
    artisanName: 'Mahendra Soni',
    village: 'Pratapgarh',
    district: 'Pratapgarh',
    yearsExperience: 31,
    cooperative: 'Pratapgarh Thewa Kala Kendra',
    craftTitle: 'Thewa Gold-on-Glass',
    headline: '23-karat pierced gold leaf fused permanently onto emerald glass.',
    story:
      'Using a razor-fine steel sooi stylus, Mahendra-ji pierces paper-thin gold sheets into royal peacock scenes and heat-fuses them onto Belgian emerald glass—preserving Pratapgarh’s royal miniature craft.',
    image: GENERATED_IMAGES.workshopThewa,
    imageAlt: 'Master jeweller Mahendra Soni fusing 23k gold filigree onto emerald glass in Pratapgarh',
    shopRegion: 'Pratapgarh',
    claimId: 'gi-thewa',
  },
];

export function ArtisanCommunityCarousel() {
  const { navigate, reduceMotion, t, isGiVerified } = useStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduceMotion || paused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % WORKSHOP_STORIES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [reduceMotion, paused]);

  const current = WORKSHOP_STORIES[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + WORKSHOP_STORIES.length) % WORKSHOP_STORIES.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % WORKSHOP_STORIES.length);
  };

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 py-10"
      aria-labelledby="artisan-community-heading"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-medium text-[var(--rh-primary)] uppercase tracking-wider">
            {t('Artisan Community · Workshop Stories', 'कारीगर समुदाय · कार्यशाला कहानियाँ')}
          </p>
          <h2 id="artisan-community-heading" className="font-display text-2xl sm:text-3xl font-bold mt-1">
            {t('Inside the Guild Courtyards', 'हस्तशिल्प संघों के आंगन से')}
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous workshop story"
            className="w-10 h-10 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)] hover:border-[var(--rh-primary)] flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 text-xs font-mono-num text-[var(--rh-ink-muted)]">
            {current.chapter} / 0{WORKSHOP_STORIES.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next workshop story"
            className="w-10 h-10 rounded-lg border border-[var(--rh-border)] bg-[var(--rh-surface)] hover:border-[var(--rh-primary)] flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel Main Showcase */}
      <div className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* 4:3 Workshop Documentary Photo */}
          <div className="lg:col-span-6 relative aspect-[4/3] lg:aspect-auto lg:min-h-[380px] bg-[var(--rh-surface-muted)] overflow-hidden">
            <ResilientImage
              src={current.image}
              alt={current.imageAlt}
              fallbackTitle={current.craftTitle}
              width={800}
              height={600}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent flex items-end p-5 sm:p-6">
              <div className="text-white space-y-1">
                <p className="text-xs text-[#F4B400] font-medium">
                  {current.cooperative}
                  {isGiVerified(current.claimId) ? ' · Verified GI Origin' : ' · Craft Guild Origin'}
                </p>
                <p className="font-display text-lg sm:text-xl font-semibold">
                  {current.artisanName}
                </p>
              </div>
            </div>
          </div>

          {/* Story Content */}
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <p className="text-xs text-[var(--rh-ink-muted)] flex flex-wrap items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--rh-primary)]" />
                <span>
                  {current.village}, {current.district}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num">{current.yearsExperience} yrs craft mastery</span>
                <span aria-hidden="true">·</span>
                <span className="text-[var(--rh-peacock)] font-medium">{current.craftTitle}</span>
              </p>

              <h3 className="font-display text-2xl sm:text-3xl font-bold leading-snug text-balance">
                {current.headline}
              </h3>

              <p className="text-sm sm:text-base text-[var(--rh-ink-muted)] leading-relaxed">
                {current.story}
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate({ page: 'shop', region: current.shopRegion })}
                  className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-[var(--rh-primary)] text-white hover:bg-[var(--rh-primary-hover)] transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Shop {current.shopRegion} Crafts</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'about' })}
                  className="px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--rh-border)] hover:border-[var(--rh-primary)] transition-colors cursor-pointer"
                >
                  Meet All 12 Guilds
                </button>
              </div>

              {/* Chapter Switcher Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-[var(--rh-border)]">
                {WORKSHOP_STORIES.map((ws, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`text-left px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                        isActive
                          ? 'border-[var(--rh-primary)] bg-[var(--rh-surface-muted)]/70'
                          : 'border-transparent hover:bg-[var(--rh-surface-muted)]/40'
                      }`}
                    >
                      <span className="block text-[11px] font-mono-num text-[var(--rh-primary)]">
                        {ws.chapter}
                      </span>
                      <span className="block text-xs font-semibold truncate text-[var(--rh-ink)]">
                        {ws.village}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
