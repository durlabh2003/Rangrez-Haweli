import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KathputliMascot } from './RajasthaniMotifs';

const MESSAGES = [
  'Chai ubal rahi hai…',
  'Camel ko parking mil rahi hai…',
  'Block pe rang chadh raha hai…',
  'Haveli ke darwaze khul rahe hain…',
  'Ghoomar ki taiyari chal rahi hai…',
];

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
function toDevanagari(num: number): string {
  return String(num)
    .split('')
    .map((d) => DEVANAGARI_DIGITS[Number(d)] ?? d)
    .join('');
}

export function BaraatLoader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const duration = 2000;
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (pct < 100) {
        rafId = requestAnimationFrame(tick);
      } else {
        setExiting(true);
        window.setTimeout(onDone, 360);
      }
    };

    rafId = requestAnimationFrame(tick);
    const msgTimer = window.setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 520);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(msgTimer);
    };
  }, [onDone]);

  const handleSkip = () => {
    setExiting(true);
    window.setTimeout(onDone, 180);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: exiting ? 0 : 1, scale: exiting ? 1.04 : 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-50 bg-[#0E1226] text-[#F6EBD6] flex flex-col items-center justify-between p-6 md:p-10"
        role="dialog"
        aria-label="Rangrez Haveli entrance"
      >
        <div className="w-full max-w-4xl flex items-center justify-between">
          <span className="font-display text-lg tracking-wide text-[#DFBA44]">Rangrez Haveli</span>
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-xs font-medium text-[#F6EBD6]/80 hover:text-[#F6EBD6] border border-[#F6EBD6]/20 rounded-md transition-colors cursor-pointer whitespace-nowrap"
          >
            Skip, mujhe jaldi hai
          </button>
        </div>

        <div className="flex flex-col items-center text-center max-w-md">
          {/* Jharokha Arch + Diya + Kathputli */}
          <div className="relative w-56 h-64 flex items-center justify-center">
            <svg viewBox="0 0 200 240" className="w-full h-full" aria-hidden="true">
              <motion.path
                d="M25 225 L25 95 Q25 55 58 45 Q80 30 100 16 Q120 30 142 45 Q175 55 175 95 L175 225 Z"
                fill="none"
                stroke="#DFBA44"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: progress / 100 }}
                transition={{ duration: 0.15 }}
              />
              {/* Bandhani Mandala dots */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, idx) => {
                const rad = (deg * Math.PI) / 180;
                const cx = 100 + Math.cos(rad) * 44;
                const cy = 115 + Math.sin(rad) * 44;
                const active = progress >= idx * 12;
                return (
                  <circle
                    key={deg}
                    cx={cx}
                    cy={cy}
                    r={active ? 4.5 : 2.5}
                    fill={idx % 2 === 0 ? '#D92658' : '#F79D38'}
                    opacity={active ? 0.95 : 0.25}
                  />
                );
              })}
              {/* Flickering Diya */}
              <path d="M84 198 Q100 212 116 198 Z" fill="#C9A227" />
              <motion.path
                d="M100 176 Q106 186 100 196 Q94 186 100 176 Z"
                fill="#F79D38"
                animate={{ scaleY: [1, 1.18, 0.96, 1.1] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
              />
            </svg>
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              className="absolute top-14"
            >
              <KathputliMascot size={54} />
            </motion.div>
          </div>

          <div className="mt-4 flex items-baseline gap-3 font-mono-num">
            <span className="text-3xl font-semibold text-[#DFBA44]">
              {progress < 65 ? `${toDevanagari(progress)}%` : `${progress}%`}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#F6EBD6]/80 min-h-[20px]">{MESSAGES[msgIndex]}</p>
        </div>

        {/* Camel Caravan Progress Line */}
        <div className="w-full max-w-xl">
          <div className="relative h-1.5 bg-[#1E2549] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#B3123F] via-[#F28C1B] to-[#C9A227] transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-[#C2B59B]">
            <span>Padharo Mhare Haveli</span>
            <span>Jaipur · Sanganer · Pratapgarh</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
