import React, { createContext, useCallback, useContext, useState } from 'react';
import type { ConsentPreferences } from '../types';

interface ConsentContextValue {
  consent: ConsentPreferences | null;
  bannerOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (analytics: boolean, marketing: boolean) => void;
}

const STORAGE_KEY = 'rh-dpdp-consent-v1';
const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentPreferences | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as ConsentPreferences;
    } catch {
      return null;
    }
  });
  const [bannerOpen, setBannerOpen] = useState<boolean>(() => !localStorage.getItem(STORAGE_KEY));

  const persist = useCallback((analytics: boolean, marketing: boolean) => {
    const prefs: ConsentPreferences = {
      necessary: true,
      analytics,
      marketing,
      updatedAt: new Date().toISOString(),
      version: '1.0',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setConsent(prefs);
    setBannerOpen(false);
  }, []);

  return (
    <ConsentContext.Provider
      value={{
        consent,
        bannerOpen,
        openPreferences: () => setBannerOpen(true),
        closePreferences: () => setBannerOpen(false),
        acceptAll: () => persist(true, true),
        rejectNonEssential: () => persist(false, false),
        savePreferences: persist,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used inside ConsentProvider');
  return ctx;
}
