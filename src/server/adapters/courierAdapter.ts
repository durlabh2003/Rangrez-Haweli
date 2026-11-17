import type { AdminConfig } from '../../types.js';
import { DEFAULT_ADMIN_CONFIG } from '../../config/heritageConstants.js';

export interface PincodeServiceabilityResult {
  pincode: string;
  serviceable: boolean;
  codAvailable: boolean;
  codBlockedReason?: string;
  courierMode: 'live' | 'unconfigured';
  zone: string;
  estimatedDelivery: string;
  message: string;
}

export async function checkPincodeServiceability(
  rawCode: string,
  config: AdminConfig = DEFAULT_ADMIN_CONFIG
): Promise<PincodeServiceabilityResult> {
  const pincode = rawCode.trim();
  if (!/^\d{6}$/.test(pincode)) {
    return {
      pincode,
      serviceable: false,
      codAvailable: false,
      courierMode: 'unconfigured',
      zone: 'Invalid',
      estimatedDelivery: 'Invalid pincode',
      message: 'Enter a valid 6-digit Indian pincode.',
    };
  }

  const codBlocked =
    !config.codEnabled || config.codBlockedPincodes.includes(pincode);
  const codBlockedReason = !config.codEnabled
    ? 'COD is temporarily disabled by store settings.'
    : config.codBlockedPincodes.includes(pincode)
      ? 'Cash on Delivery is unavailable for this pincode; UPI & Cards accepted.'
      : undefined;

  const courierEndpoint = process.env.COURIER_API_URL;
  const courierToken = process.env.COURIER_API_TOKEN;

  if (courierEndpoint && courierToken) {
    try {
      const resp = await fetch(`${courierEndpoint}?pincode=${encodeURIComponent(pincode)}`, {
        headers: { Authorization: `Bearer ${courierToken}` },
      });
      if (resp.ok) {
        const live = (await resp.json()) as {
          serviceable?: boolean;
          cod?: boolean;
          etd?: string;
          zone?: string;
        };
        return {
          pincode,
          serviceable: live.serviceable !== false,
          codAvailable: !codBlocked && live.cod !== false,
          codBlockedReason,
          courierMode: 'live',
          zone: live.zone || 'India Courier Network',
          estimatedDelivery: live.etd || 'Delivery time confirmed at checkout',
          message:
            live.serviceable !== false
              ? 'Serviceable via partner courier.'
              : 'Currently unserviceable via partner courier.',
        };
      }
    } catch {
      // Fallback honestly without inventing ETAs
    }
  }

  // Honest fallback when live courier API is not configured (no invented ETAs)
  return {
    pincode,
    serviceable: true,
    codAvailable: !codBlocked,
    codBlockedReason,
    courierMode: 'unconfigured',
    zone: pincode.startsWith('3') ? 'Rajasthan Origin Dispatch (Jaipur)' : 'Pan-India Dispatch',
    estimatedDelivery: 'Delivery time confirmed at checkout',
    message:
      'Live courier ETA API is not configured; delivery timeline and tracking are confirmed at checkout.',
  };
}
