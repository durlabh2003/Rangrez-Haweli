import React, { useState } from 'react';
import { ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import { useConsent } from '../context/ConsentContext';
import { useStore } from '../context/StoreContext';

export function ConsentBanner() {
  const { bannerOpen, closePreferences, acceptAll, rejectNonEssential, savePreferences, consent } = useConsent();
  const { navigate } = useStore();
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState<boolean>(consent?.analytics ?? false);
  const [marketing, setMarketing] = useState<boolean>(consent?.marketing ?? false);

  if (!bannerOpen) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-12 md:bottom-4 left-3 right-3 sm:left-4 sm:max-w-lg z-[55] rounded-2xl bg-[var(--rh-surface)] border border-[var(--rh-border)] shadow-2xl p-4 sm:p-5 text-[var(--rh-ink)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0F7B6C] shrink-0" aria-hidden="true" />
          <p className="font-display text-sm font-semibold">Privacy & Consent Preferences (DPDP Act)</p>
        </div>
        {consent && (
          <button
            type="button"
            onClick={closePreferences}
            aria-label="Close privacy preferences"
            className="p-1.5 rounded-lg hover:bg-[var(--rh-surface-muted)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="mt-1.5 text-xs text-[var(--rh-ink-muted)] leading-relaxed">
        We use strictly necessary storage for your shopping bag and security. Optional analytics help measure Web Vitals, and marketing tracks newsletter offers only with your explicit opt-in.{' '}
        <button
          type="button"
          onClick={() => navigate({ page: 'legal', doc: 'privacy' })}
          className="underline font-medium text-[var(--rh-primary)]"
        >
          Privacy Policy
        </button>
      </p>

      {customize && (
        <div className="mt-3 space-y-2 rounded-xl bg-[var(--rh-surface-muted)]/60 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span>Strictly Necessary (Bag, Auth, Security)</span>
            <span className="font-mono-num text-[11px] font-semibold text-[#0F7B6C]">Always Active</span>
          </div>
          <label className="flex items-center justify-between gap-2 cursor-pointer">
            <span>Performance & Web Vitals Analytics</span>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              className="w-4 h-4 accent-[#B3123F]"
            />
          </label>
          <label className="flex items-center justify-between gap-2 cursor-pointer">
            <span>Seasonal Dispatches & Offers</span>
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="w-4 h-4 accent-[#B3123F]"
            />
          </label>
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={rejectNonEssential}
          className="px-3.5 py-2 rounded-lg border border-[var(--rh-border)] text-xs font-semibold hover:bg-[var(--rh-surface-muted)] min-h-[40px]"
        >
          Reject Optional
        </button>
        {customize ? (
          <button
            type="button"
            onClick={() => savePreferences(analytics, marketing)}
            className="px-3.5 py-2 rounded-lg bg-[#0F7B6C] text-white text-xs font-semibold hover:opacity-95 min-h-[40px]"
          >
            Save Preferences
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCustomize(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--rh-border)] text-xs font-medium hover:bg-[var(--rh-surface-muted)] min-h-[40px]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            Customize
          </button>
        )}
        <button
          type="button"
          onClick={acceptAll}
          className="ml-auto px-4 py-2 rounded-lg bg-[#B3123F] text-white text-xs font-semibold hover:bg-[#8E0D31] min-h-[40px]"
        >
          Accept All
        </button>
      </div>
    </aside>
  );
}
