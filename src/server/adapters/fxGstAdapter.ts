import { validateGstinChecksum } from '../pricing.js';

export interface FxRatesResponse {
  baseCurrency: 'INR';
  rates: Record<'INR' | 'USD' | 'EUR' | 'GBP' | 'AED', number>;
  updatedAt: string;
  source: 'live' | 'cached-reference';
  disclaimer: string;
}

let cachedFx: { data: FxRatesResponse; expiresAt: number } | null = null;

export async function getLiveFxRates(): Promise<FxRatesResponse> {
  if (cachedFx && Date.now() < cachedFx.expiresAt) {
    return cachedFx.data;
  }

  const fxUrl = process.env.FX_RATES_API_URL || 'https://open.er-api.com/v6/latest/INR';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const resp = await fetch(fxUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (resp.ok) {
      const json = (await resp.json()) as {
        rates?: Record<string, number>;
        time_last_update_utc?: string;
      };
      if (json.rates?.USD && json.rates?.EUR && json.rates?.GBP && json.rates?.AED) {
        const result: FxRatesResponse = {
          baseCurrency: 'INR',
          rates: {
            INR: 1,
            USD: Number(json.rates.USD.toFixed(5)),
            EUR: Number(json.rates.EUR.toFixed(5)),
            GBP: Number(json.rates.GBP.toFixed(5)),
            AED: Number(json.rates.AED.toFixed(5)),
          },
          updatedAt: json.time_last_update_utc
            ? new Date(json.time_last_update_utc).toISOString()
            : new Date().toISOString(),
          source: 'live',
          disclaimer: 'Display only. All orders are billed and settled in INR.',
        };
        cachedFx = { data: result, expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
        return result;
      }
    }
  } catch {
    // Use reference fallback if outbound FX lookup fails
  }

  const fallback: FxRatesResponse = {
    baseCurrency: 'INR',
    rates: {
      INR: 1,
      USD: 0.0119,
      EUR: 0.011,
      GBP: 0.0094,
      AED: 0.0437,
    },
    updatedAt: new Date().toISOString(),
    source: 'cached-reference',
    disclaimer: 'Display only (reference FX fallback). Final settlement occurs in INR.',
  };
  cachedFx = { data: fallback, expiresAt: Date.now() + 60 * 60 * 1000 };
  return fallback;
}

export async function verifyGstinStatus(gstin: string): Promise<{
  gstin: string;
  checksumValid: boolean;
  reason?: string;
  liveRegistryVerified: boolean;
  note: string;
}> {
  const clean = gstin.trim().toUpperCase();
  const check = validateGstinChecksum(clean);
  if (!check.valid) {
    return {
      gstin: clean,
      checksumValid: false,
      reason: check.reason,
      liveRegistryVerified: false,
      note: 'Failed mod-36 GSTIN structure/checksum check.',
    };
  }

  const gstApiUrl = process.env.GST_VERIFICATION_API_URL;
  const gstApiKey = process.env.GST_VERIFICATION_API_KEY;
  if (gstApiUrl && gstApiKey) {
    try {
      const resp = await fetch(`${gstApiUrl}?gstin=${encodeURIComponent(clean)}`, {
        headers: { Authorization: `Bearer ${gstApiKey}` },
      });
      if (resp.ok) {
        const data = (await resp.json()) as { active?: boolean; tradeName?: string };
        return {
          gstin: clean,
          checksumValid: true,
          liveRegistryVerified: Boolean(data.active),
          note: data.tradeName
            ? `Verified GSTN registration: ${data.tradeName}`
            : 'Checked against configured GST verification API.',
        };
      }
    } catch {
      // Graceful fallback
    }
  }

  return {
    gstin: clean,
    checksumValid: true,
    liveRegistryVerified: false,
    note: 'Format & mod-36 check digit verified. Live GSTN portal verification requires Admin API configuration.',
  };
}
