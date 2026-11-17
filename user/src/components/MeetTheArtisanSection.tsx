import React, { useEffect, useState } from 'react';
import { ArrowRight, MapPin, Pause, Play, RotateCcw, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CRAFT_MEDIA_ASSETS as GENERATED_IMAGES } from '../config/heritageConstants';
import type { Artisan } from '../types';
import { ResilientImage } from './RajasthaniMotifs';

interface CraftFrame {
  label: string;
  detail: string;
  accentHex: string;
}

interface ArtisanReelConfig {
  artisanId: string;
  fallbackName: string;
  fallbackCraft: string;
  fallbackVillage: string;
  fallbackDistrict: string;
  fallbackYears: number;
  fallbackCoop: string;
  fallbackStory: string;
  image: string;
  shopRegion: string;
  motifType: 'bandhani' | 'mojari' | 'phad' | 'kotadoria';
  frames: CraftFrame[];
}

const ARTISAN_REELS: ArtisanReelConfig[] = [
  {
    artisanId: 'art-03',
    fallbackName: 'Rukhsana Khatoon',
    fallbackCraft: 'Bandhani Tie-Dye',
    fallbackVillage: 'Sikar',
    fallbackDistrict: 'Shekhawati',
    fallbackYears: 22,
    fallbackCoop: 'Shekhawati Bandhej Mahila Mandal',
    fallbackStory:
      'Tying over 4,000 tiny ekdali and shikari knots per dupatta by hand without mechanical stencils.',
    image: GENERATED_IMAGES.reelBandhani,
    shopRegion: 'Sikar',
    motifType: 'bandhani',
    frames: [
      {
        label: '01 · Fingertip Ekdali Knots',
        detail: 'Pinching raw Gajji silk with waxed cotton thread into tiny buds.',
        accentHex: '#B3123F',
      },
      {
        label: '02 · Natural Madder & Turmeric Dip',
        detail: 'Steeping knotted silk inside simmering copper dye cauldrons.',
        accentHex: '#F28C1B',
      },
      {
        label: '03 · Unfurling 4,000 Star Dots',
        detail: 'Snapping each thread open to reveal crisp undyed lotus constellations.',
        accentHex: '#0F7B6C',
      },
    ],
  },
  {
    artisanId: 'art-08',
    fallbackName: 'Bhanwar Lal Mochi',
    fallbackCraft: 'Jodhpuri Mojari',
    fallbackVillage: 'Jodhpur',
    fallbackDistrict: 'Jodhpur',
    fallbackYears: 35,
    fallbackCoop: 'Marwar Charmakar Samiti',
    fallbackStory:
      'Hand-stitching vegetable-tanned camel leather uppers with gold zari and silk resham using zero nails.',
    image: GENERATED_IMAGES.reelMojari,
    shopRegion: 'Jodhpur',
    motifType: 'mojari',
    frames: [
      {
        label: '01 · Vegetable-Tanned Camel Leather',
        detail: 'Curing supple leather hides in pomegranate bark & babul resin.',
        accentHex: '#C9A227',
      },
      {
        label: '02 · Gold Zari Paisley Stitching',
        detail: 'Piercing uppers with a fine steel katari awl and metallic zari.',
        accentHex: '#B3123F',
      },
      {
        label: '03 · Nail-Free Heirloom Sole Lock',
        detail: 'Whip-stitching curled toe soles with waxed hemp cord for all-day flex.',
        accentHex: '#0F7B6C',
      },
    ],
  },
  {
    artisanId: 'art-06',
    fallbackName: 'Kalyan Joshi',
    fallbackCraft: 'Phad Scroll Painting',
    fallbackVillage: 'Shahpura',
    fallbackDistrict: 'Bhilwara',
    fallbackYears: 29,
    fallbackCoop: 'Shahpura Chitrashala',
    fallbackStory:
      'Painting epic Rajasthani folk ballads on hand-starched khadi using stone pigments and squirrel-hair brushes.',
    image: GENERATED_IMAGES.reelPhad,
    shopRegion: 'Shahpura',
    motifType: 'phad',
    frames: [
      {
        label: '01 · Starched Khadi Burnishing',
        detail: 'Polishing handspun cotton with moonstone & wheat starch paste.',
        accentHex: '#F28C1B',
      },
      {
        label: '02 · Mineral Sindoor Linework',
        detail: 'Outlining royal steeds and folk ballads with ground cinnabar.',
        accentHex: '#B3123F',
      },
      {
        label: '03 · Lampblack Kallak Final Gaze',
        detail: 'Dotting each figure’s eyes last—bringing the living scroll alive.',
        accentHex: '#1F3A93',
      },
    ],
  },
  {
    artisanId: 'art-09',
    fallbackName: 'Shakuntala Devi',
    fallbackCraft: 'Kota Doria Weaving',
    fallbackVillage: 'Kaithoon',
    fallbackDistrict: 'Kota',
    fallbackYears: 24,
    fallbackCoop: 'Kaithoon Bunkar Sangh',
    fallbackStory:
      'Weaving featherlight cotton-silk khat check sarees on traditional throw-shuttle pit looms.',
    image: GENERATED_IMAGES.reelKota,
    shopRegion: 'Kaithoon',
    motifType: 'kotadoria',
    frames: [
      {
        label: '01 · Cotton & Silk Warp Dressing',
        detail: 'Pairing breathable cotton strength with lustrous mulberry silk khat.',
        accentHex: '#F4B400',
      },
      {
        label: '02 · Throw-Shuttle Pit Rhythm',
        detail: 'Sliding wooden shuttles across 300+ fine grid squares per yard.',
        accentHex: '#0F7B6C',
      },
      {
        label: '03 · Zari Border Pallu Finish',
        detail: 'Interlacing antique gold zari temple borders by hand.',
        accentHex: '#B3123F',
      },
    ],
  },
];

function CraftMotionOverlay({
  type,
  frameIdx,
  isPlaying,
  accentHex,
}: {
  type: ArtisanReelConfig['motifType'];
  frameIdx: number;
  isPlaying: boolean;
  accentHex: string;
}) {
  if (type === 'bandhani') {
    const dots = [
      [54, 48], [86, 48], [118, 48], [150, 48], [182, 48],
      [70, 78], [102, 78], [134, 78], [166, 78],
      [54, 108], [86, 108], [118, 108], [150, 108], [182, 108],
    ];
    return (
      <svg viewBox="0 0 240 160" className="w-full h-full opacity-95" aria-hidden="true">
        {dots.map(([cx, cy], idx) => (
          <g key={idx}>
            <circle
              cx={cx}
              cy={cy}
              r={frameIdx === 2 ? 9 : frameIdx === 1 ? 6 : 4}
              fill="none"
              stroke="#FBF3E4"
              strokeWidth="1.4"
              strokeDasharray="2 2"
              className={isPlaying ? 'transition-all duration-700' : ''}
            />
            <circle
              cx={cx}
              cy={cy}
              r={frameIdx === 0 ? 2 : 3.2}
              fill={idx % 2 === 0 ? accentHex : '#F4B400'}
            />
          </g>
        ))}
      </svg>
    );
  }

  if (type === 'mojari') {
    return (
      <svg viewBox="0 0 240 160" className="w-full h-full opacity-95" aria-hidden="true">
        <path
          d="M36 104 Q72 48 134 58 Q188 68 206 96 Q178 122 110 120 Q56 118 36 104 Z"
          fill={accentHex}
          fillOpacity="0.22"
          stroke="#F4B400"
          strokeWidth="2"
        />
        <path
          d="M64 95 Q105 64 148 82 Q165 92 178 96"
          fill="none"
          stroke="#FBF3E4"
          strokeWidth="2.2"
          strokeDasharray={frameIdx === 0 ? '4 8' : frameIdx === 1 ? '8 4' : '140 0'}
          className={isPlaying ? 'transition-all duration-700' : ''}
        />
        <circle cx={64 + frameIdx * 52} cy={frameIdx === 1 ? 74 : 94} r="5" fill="#F4B400" />
      </svg>
    );
  }

  if (type === 'phad') {
    return (
      <svg viewBox="0 0 240 160" className="w-full h-full opacity-95" aria-hidden="true">
        <rect x="28" y="34" width="184" height="92" rx="4" fill={accentHex} fillOpacity="0.18" stroke="#F4B400" strokeWidth="1.8" />
        {[0, 1, 2].map((panel) => (
          <g key={panel} opacity={frameIdx >= panel ? 1 : 0.3} className="transition-opacity duration-500">
            <rect x={38 + panel * 58} y="44" width="48" height="72" fill="none" stroke="#FBF3E4" strokeWidth="1.2" />
            <circle cx={62 + panel * 58} cy="72" r="12" fill="#F28C1B" fillOpacity="0.5" stroke="#FBF3E4" strokeWidth="1.2" />
            <path d={`M${48 + panel * 58} 102 L${62 + panel * 58} 86 L${76 + panel * 58} 102`} fill="none" stroke="#F4B400" strokeWidth="1.5" />
          </g>
        ))}
      </svg>
    );
  }

  // kotadoria khat weave
  return (
    <svg viewBox="0 0 240 160" className="w-full h-full opacity-95" aria-hidden="true">
      {[42, 64, 86, 108].map((y) => (
        <line key={`h-${y}`} x1="36" y1={y} x2="204" y2={y} stroke="#FBF3E4" strokeWidth="1.2" strokeOpacity="0.7" />
      ))}
      {[56, 88, 120, 152, 184].map((x) => (
        <line key={`v-${x}`} x1={x} y1="30" x2={x} y2="130" stroke="#F4B400" strokeWidth="1.4" strokeOpacity="0.8" />
      ))}
      <rect
        x={frameIdx === 0 ? 48 : frameIdx === 1 ? 104 : 158}
        y="69"
        width="34"
        height="12"
        rx="6"
        fill={accentHex}
        stroke="#FBF3E4"
        strokeWidth="1.6"
        className={isPlaying ? 'transition-all duration-700' : ''}
      />
    </svg>
  );
}

export function MeetTheArtisanSection({ artisans }: { artisans: Artisan[] }) {
  const { navigate, reduceMotion, t } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  useEffect(() => {
    if (!activeId || !isPlaying) return;

    if (reduceMotion) {
      setStepProgress(100);
      return;
    }

    const tickMs = 80;
    const stepDurationMs = 2600;
    const increment = (tickMs / stepDurationMs) * 100;

    const timer = window.setInterval(() => {
      setStepProgress((prev) => {
        if (prev + increment >= 100) {
          setFrameIndex((f) => (f + 1) % 3);
          return 0;
        }
        return prev + increment;
      });
    }, tickMs);

    return () => clearInterval(timer);
  }, [activeId, isPlaying, reduceMotion]);

  const handleOpenReel = (artisanId: string) => {
    setActiveId(artisanId);
    setFrameIndex(0);
    setStepProgress(0);
    setIsPlaying(true);
  };

  const handleCloseReel = () => {
    setActiveId(null);
    setIsPlaying(false);
    setFrameIndex(0);
    setStepProgress(0);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10" aria-labelledby="meet-artisan-heading">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-medium text-[var(--rh-primary)] uppercase tracking-wider">
            {t('Meet the Artisan · Craft in Motion', 'शिल्पकारों से मिलें · जीवंत कार्यशाला')}
          </p>
          <h2 id="meet-artisan-heading" className="font-display text-2xl sm:text-3xl font-bold mt-1">
            {t('Hands Behind Every Heirloom', 'हर विरासत के पीछे के सधे हाथ')}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate({ page: 'about' })}
          className="text-sm font-medium text-[var(--rh-primary)] hover:underline self-start md:self-auto cursor-pointer"
        >
          {t('All 12 Craft Guilds →', 'सभी १२ शिल्प संघ →')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {ARTISAN_REELS.map((reel) => {
          const matched = artisans.find((a) => a.id === reel.artisanId);
          const name = matched?.name ?? reel.fallbackName;
          const craft = matched?.craft ?? reel.fallbackCraft;
          const village = matched?.village ?? reel.fallbackVillage;
          const district = matched?.district ?? reel.fallbackDistrict;
          const years = matched?.yearsExperience ?? reel.fallbackYears;
          const story = matched?.story ?? reel.fallbackStory;

          const isReelOpen = activeId === reel.artisanId;
          const currentFrame = reel.frames[frameIndex] ?? reel.frames[0];

          return (
            <article
              key={reel.artisanId}
              className="bg-[var(--rh-surface)] border border-[var(--rh-border)] rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              {/* Image + Play Button Overlay OR Stylized Craft Reel */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#171C3A]">
                <ResilientImage
                  src={reel.image}
                  alt={`${name} crafting ${craft} in ${village}`}
                  fallbackTitle={craft}
                  className={`w-full h-full object-cover transition-transform duration-1000 ${
                    isReelOpen && isPlaying && !reduceMotion
                      ? frameIndex === 0
                        ? 'scale-105'
                        : frameIndex === 1
                          ? 'scale-110 -translate-x-1.5'
                          : 'scale-105 translate-x-1'
                      : 'scale-100'
                  }`}
                />

                {!isReelOpen ? (
                  <>
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/15"
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      onClick={() => handleOpenReel(reel.artisanId)}
                      aria-label={`Play craft showcase for ${name} (${craft})`}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4B400]"
                    >
                      <span className="w-14 h-14 rounded-full bg-[#FBF3E4]/95 text-[#2A1410] shadow-lg border-2 border-[#C9A227] flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-hover:bg-[#B3123F] group-hover:text-white group-hover:border-white">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </span>
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-white drop-shadow">
                        Watch Craft Clip
                      </span>
                    </button>
                    <p className="absolute bottom-3 left-3 right-3 text-xs font-medium text-[#FBF3E4] pointer-events-none truncate">
                      {craft}
                    </p>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex flex-col justify-between p-3 text-white">
                    {/* Top Reel Controls */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono-num uppercase tracking-wider text-[#F4B400] truncate">
                        {currentFrame.label}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsPlaying((p) => !p)}
                          aria-label={isPlaying ? 'Pause craft reel' : 'Resume craft reel'}
                          className="w-9 h-9 sm:w-8 sm:h-8 rounded-md bg-black/55 hover:bg-black/80 flex items-center justify-center cursor-pointer"
                        >
                          {isPlaying ? <Pause className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <Play className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFrameIndex(0);
                            setStepProgress(0);
                            setIsPlaying(true);
                          }}
                          aria-label="Restart craft reel"
                          className="w-9 h-9 sm:w-8 sm:h-8 rounded-md bg-black/55 hover:bg-black/80 flex items-center justify-center cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCloseReel}
                          aria-label="Close craft reel"
                          className="w-9 h-9 sm:w-8 sm:h-8 rounded-md bg-black/55 hover:bg-[#B3123F] flex items-center justify-center cursor-pointer"
                        >
                          <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Animated Craft Vector Layer */}
                    <div className="flex-1 flex items-center justify-center min-h-0 my-1">
                      <CraftMotionOverlay
                        type={reel.motifType}
                        frameIdx={frameIndex}
                        isPlaying={isPlaying}
                        accentHex={currentFrame.accentHex}
                      />
                    </div>

                    {/* Caption + 3-Step Timeline Scrubber */}
                    <div className="space-y-1.5">
                      <p className="text-xs leading-snug text-[#FBF3E4] line-clamp-2">{currentFrame.detail}</p>
                      <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label="Craft reel steps">
                        {reel.frames.map((fr, idx) => {
                          const widthPct =
                            idx < frameIndex ? 100 : idx === frameIndex ? Math.min(100, stepProgress) : 0;
                          return (
                            <button
                              key={fr.label}
                              type="button"
                              onClick={() => {
                                setFrameIndex(idx);
                                setStepProgress(0);
                              }}
                              aria-label={fr.label}
                              className="py-1.5 cursor-pointer group"
                            >
                              <span className="block h-1.5 rounded-full bg-white/25 overflow-hidden">
                                <span
                                  className="block h-full bg-[#F4B400] transition-all duration-75"
                                  style={{ width: `${widthPct}%` }}
                                />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Unboxed Metadata + Story */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs text-[var(--rh-ink-muted)] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[var(--rh-primary)] shrink-0" />
                    <span className="truncate">
                      {village}, {district} · <span className="font-mono-num">{years} yrs</span>
                    </span>
                  </p>
                  <h3 className="font-display text-lg font-bold text-[var(--rh-ink)] leading-snug">{name}</h3>
                  <p className="text-xs text-[var(--rh-ink-muted)] leading-relaxed line-clamp-3">{story}</p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate({ page: 'shop', region: reel.shopRegion })}
                  className="text-xs font-semibold text-[var(--rh-primary)] hover:underline inline-flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <span>Shop {reel.shopRegion} Crafts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
