export {
  DATA_DIR,
  getAdminAllowlist,
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
  getFirestoreStatus,
  getPublicArtisans,
  getPublicBlogPosts,
  getPublicBundles,
  getPublicCoupons,
  getPublicProducts,
  getPublicReviews,
  isProductionEnv,
  loadStore,
  probeFirestoreConnection,
  purgeMockData,
  recomputeDerivedProductStats,
  recordAuditLog,
  runSeed,
  saveStore,
  syncStateToFirestore,
  withStoreLock,
  type DatabaseState,
} from './db.js';
import type { Product } from '../types.js';

function colorHexFromName(name: string | undefined, fallback: string): string {
  const n = (name ?? '').toLowerCase();
  if (n.includes('indigo') || n.includes('cobalt') || n.includes('lapis')) return '#1F3A93';
  if (n.includes('turquoise')) return '#0E9AA7';
  if (n.includes('peacock') || n.includes('emerald')) return '#0F7B6C';
  if (n.includes('marigold') || n.includes('kesariya') || n.includes('turmeric') || n.includes('amber')) return '#F28C1B';
  if (n.includes('gold') || n.includes('brass')) return '#C9A227';
  if (n.includes('terracotta') || n.includes('rust')) return '#B8532F';
  if (n.includes('silver') || n.includes('pearl') || n.includes('ivory') || n.includes('sand')) return '#D7C4A3';
  if (n.includes('maroon') || n.includes('crimson') || n.includes('ruby') || n.includes('sindoor') || n.includes('pink')) return '#B3123F';
  if (n.includes('tan') || n.includes('cognac') || n.includes('chestnut') || n.includes('teak') || n.includes('brown')) return '#8C5230';
  if (n.includes('black') || n.includes('charcoal') || n.includes('espresso')) return '#2A1D1B';
  return fallback;
}

function buildSilhouetteSvg(product: Product | undefined, accent: string, secondary: string, frameNum: number): string {
  const text = `${product?.subCategory ?? ''} ${product?.name ?? ''} ${product?.craftType ?? ''}`.toLowerCase();

  if (frameNum === 2) {
    return `
      <rect x="135" y="155" width="330" height="270" rx="18" fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-width="2"/>
      <path d="M135 215 Q300 185 465 215 M135 275 Q300 305 465 275 M135 335 Q300 305 465 335" fill="none" stroke="${secondary}" stroke-width="2" stroke-dasharray="6 4"/>
      <circle cx="220" cy="245" r="34" fill="${accent}" fill-opacity="0.3" stroke="${secondary}" stroke-width="2"/>
      <circle cx="380" cy="245" r="34" fill="${secondary}" fill-opacity="0.3" stroke="${accent}" stroke-width="2"/>
      <circle cx="300" cy="340" r="42" fill="${accent}" fill-opacity="0.22" stroke="${accent}" stroke-width="2"/>
      <circle cx="300" cy="340" r="14" fill="${secondary}"/>`;
  }

  if (frameNum === 3) {
    return `
      <circle cx="300" cy="285" r="115" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="5 5"/>
      <polygon points="300,180 390,285 300,390 210,285" fill="${secondary}" fill-opacity="0.16" stroke="${secondary}" stroke-width="2"/>
      <circle cx="300" cy="285" r="46" fill="${accent}" fill-opacity="0.24" stroke="${accent}" stroke-width="2.5"/>
      <text x="300" y="292" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="700" fill="${accent}">52% ARTISAN</text>`;
  }

  if (text.includes('kurta') || text.includes('tunic') || text.includes('shirt') || text.includes('jacket') || text.includes('anarkali') || text.includes('frock') || text.includes('co-ord')) {
    return `
      <path d="M240 168 L272 152 L300 166 L328 152 L360 168 L420 210 L398 258 L368 242 L368 415 L232 415 L232 242 L202 258 L180 210 Z" fill="${accent}" fill-opacity="0.24" stroke="${accent}" stroke-width="2.5"/>
      <line x1="300" y1="166" x2="300" y2="255" stroke="${secondary}" stroke-width="2.5"/>
      <circle cx="272" cy="300" r="14" fill="none" stroke="${secondary}" stroke-width="1.8"/>
      <circle cx="328" cy="300" r="14" fill="none" stroke="${secondary}" stroke-width="1.8"/>
      <circle cx="300" cy="360" r="18" fill="${secondary}" fill-opacity="0.35"/>`;
  }
  if (text.includes('saree') || text.includes('dupatta') || text.includes('stole') || text.includes('scarf')) {
    return `
      <path d="M180 185 Q245 155 310 185 T425 185 L405 405 Q335 430 265 395 T175 405 Z" fill="${accent}" fill-opacity="0.24" stroke="${accent}" stroke-width="2.5"/>
      <path d="M190 365 L408 365 M192 385 L406 385" stroke="${secondary}" stroke-width="3"/>
      <circle cx="255" cy="255" r="18" fill="${secondary}" fill-opacity="0.38"/>
      <circle cx="345" cy="295" r="22" fill="${accent}" fill-opacity="0.35" stroke="${secondary}" stroke-width="1.8"/>`;
  }
  if (text.includes('razai') || text.includes('bedsheet') || text.includes('throw') || text.includes('curtain') || text.includes('dhurrie') || text.includes('rug') || text.includes('runner') || text.includes('cushion') || text.includes('pouf')) {
    return `
      <rect x="175" y="165" width="250" height="250" rx="10" fill="${accent}" fill-opacity="0.2" stroke="${accent}" stroke-width="2.5"/>
      <rect x="198" y="188" width="204" height="204" fill="none" stroke="${secondary}" stroke-width="2" stroke-dasharray="6 4"/>
      <polygon points="300,208 372,290 300,372 228,290" fill="${secondary}" fill-opacity="0.22" stroke="${accent}" stroke-width="2"/>
      <circle cx="300" cy="290" r="24" fill="${accent}" fill-opacity="0.5"/>`;
  }
  if (text.includes('mojari') || text.includes('jutti')) {
    return `
      <path d="M170 320 Q160 265 215 250 Q290 232 365 268 Q415 288 430 250 Q442 295 405 335 Q315 365 185 348 Z" fill="${accent}" fill-opacity="0.28" stroke="${accent}" stroke-width="2.5"/>
      <path d="M235 285 Q300 262 365 296" fill="none" stroke="${secondary}" stroke-width="3" stroke-dasharray="5 3"/>`;
  }
  if (text.includes('tote') || text.includes('bag') || text.includes('clutch') || text.includes('potli') || text.includes('sleeve') || text.includes('wallet') || text.includes('journal') || text.includes('passport')) {
    return `
      <path d="M250 205 Q300 140 350 205" fill="none" stroke="${secondary}" stroke-width="4"/>
      <rect x="195" y="205" width="210" height="190" rx="16" fill="${accent}" fill-opacity="0.25" stroke="${accent}" stroke-width="2.5"/>
      <line x1="195" y1="265" x2="405" y2="265" stroke="${secondary}" stroke-width="2"/>
      <circle cx="300" cy="315" r="20" fill="${secondary}" fill-opacity="0.45"/>`;
  }
  if (text.includes('jhumka') || text.includes('earring') || text.includes('chandbali') || text.includes('tikka')) {
    return `
      <circle cx="245" cy="195" r="22" fill="${secondary}" fill-opacity="0.35" stroke="${accent}" stroke-width="2.5"/>
      <path d="M205 285 Q245 220 285 285 Z" fill="${accent}" fill-opacity="0.32" stroke="${accent}" stroke-width="2.5"/>
      <circle cx="355" cy="195" r="22" fill="${secondary}" fill-opacity="0.35" stroke="${accent}" stroke-width="2.5"/>
      <path d="M315 285 Q355 220 395 285 Z" fill="${accent}" fill-opacity="0.32" stroke="${accent}" stroke-width="2.5"/>
      <circle cx="245" cy="315" r="8" fill="${secondary}"/>
      <circle cx="355" cy="315" r="8" fill="${secondary}"/>`;
  }
  if (text.includes('necklace') || text.includes('choker') || text.includes('pendant') || text.includes('bracelet') || text.includes('bangle') || text.includes('ring') || text.includes('anklet') || text.includes('haathphool')) {
    return `
      <path d="M195 205 Q300 325 405 205" fill="none" stroke="${secondary}" stroke-width="8" stroke-linecap="round"/>
      <polygon points="300,268 345,322 300,376 255,322" fill="${accent}" fill-opacity="0.35" stroke="${secondary}" stroke-width="3"/>
      <circle cx="300" cy="322" r="14" fill="${secondary}"/>`;
  }
  if (text.includes('vase') || text.includes('pottery') || text.includes('plate') || text.includes('coaster') || text.includes('kulhad') || text.includes('dish')) {
    return `
      <ellipse cx="300" cy="185" rx="44" ry="12" fill="${secondary}" fill-opacity="0.35" stroke="${accent}" stroke-width="2.5"/>
      <path d="M262 190 Q268 232 215 278 Q195 340 245 398 L355 398 Q405 340 385 278 Q332 232 338 190 Z" fill="${accent}" fill-opacity="0.22" stroke="${accent}" stroke-width="2.5"/>
      <circle cx="300" cy="315" r="36" fill="none" stroke="${secondary}" stroke-width="2"/>
      <circle cx="300" cy="315" r="14" fill="${secondary}" fill-opacity="0.5"/>`;
  }

  return `
    <rect x="180" y="175" width="240" height="225" rx="14" fill="${accent}" fill-opacity="0.2" stroke="${accent}" stroke-width="2.5"/>
    <path d="M180 245 L420 245" stroke="${secondary}" stroke-width="2.5"/>
    <path d="M270 175 Q300 135 330 175" fill="none" stroke="${secondary}" stroke-width="3"/>
    <circle cx="300" cy="318" r="44" fill="${secondary}" fill-opacity="0.25" stroke="${accent}" stroke-width="2"/>
    <polygon points="300,284 332,318 300,352 268,318" fill="${accent}" fill-opacity="0.5"/>`;
}

export function generateCraftSvg(product: Product | undefined, frame: string): string {
  const paletteMap: Record<string, { bg: string; accent: string; secondary: string; ink: string }> = {
    'textiles-apparel': { bg: '#FBF3E4', accent: '#B3123F', secondary: '#0F7B6C', ink: '#2A1410' },
    'home-furnishing': { bg: '#F6EBD6', accent: '#1F3A93', secondary: '#F28C1B', ink: '#2A1410' },
    jewellery: { bg: '#2A1410', accent: '#C9A227', secondary: '#0F7B6C', ink: '#FBF3E4' },
    'footwear-leather': { bg: '#F4E8D1', accent: '#8E0D31', secondary: '#C9A227', ink: '#2A1410' },
    'art-decor': { bg: '#EEF4FA', accent: '#1F3A93', secondary: '#0F7B6C', ink: '#1E2549' },
    'gifting-festive': { bg: '#FFF5E1', accent: '#F28C1B', secondary: '#B3123F', ink: '#2A1410' },
  };
  const basePal = paletteMap[product?.category ?? 'textiles-apparel'] ?? paletteMap['textiles-apparel'];
  const accent = colorHexFromName(product?.colors?.[0], basePal.accent);
  const secondary = colorHexFromName(product?.colors?.[1], basePal.secondary);
  const frameNum = Number(frame || 1);
  const title = (product?.name ?? 'Rangrez Haveli Craft').replace(/&/g, '&amp;').slice(0, 34);
  const craft = (product?.craftType ?? 'Handcrafted Rajasthan').replace(/&/g, '&amp;');
  const region = (product?.region ?? 'Jaipur').replace(/&/g, '&amp;');
  const sku = (product?.sku ?? 'RH-CRAFT').replace(/&/g, '&amp;');
  const seedNum = (product?.sku.charCodeAt(product.sku.length - 1) ?? 7) + frameNum * 13;
  const silhouette = buildSilhouetteSvg(product, accent, secondary, frameNum);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 720" width="600" height="720">
  <defs>
    <pattern id="jaali-${seedNum}" width="${34 + (seedNum % 12)}" height="${34 + (seedNum % 12)}" patternUnits="userSpaceOnUse">
      <circle cx="18" cy="18" r="3" fill="${accent}" opacity="0.2"/>
      <path d="M18 0 L36 18 L18 36 L0 18 Z" fill="none" stroke="${secondary}" stroke-width="1" opacity="0.22"/>
    </pattern>
    <clipPath id="archClip-${seedNum}">
      <path d="M72 620 L72 228 Q72 132 152 110 Q228 84 300 48 Q372 84 448 110 Q528 132 528 228 L528 620 Z"/>
    </clipPath>
  </defs>
  <rect width="600" height="720" fill="${basePal.bg}"/>
  <rect x="22" y="22" width="556" height="676" rx="12" fill="none" stroke="${accent}" stroke-opacity="0.26" stroke-width="1.5"/>
  <rect x="34" y="34" width="532" height="652" rx="8" fill="url(#jaali-${seedNum})"/>
  <path d="M72 620 L72 228 Q72 132 152 110 Q228 84 300 48 Q372 84 448 110 Q528 132 528 228 L528 620 Z" fill="${basePal.bg}" stroke="${accent}" stroke-width="2.5"/>
  <g clip-path="url(#archClip-${seedNum})">
    ${silhouette}
  </g>
  <text x="300" y="514" text-anchor="middle" font-family="Georgia, serif" font-size="21" font-weight="600" fill="${basePal.ink}">${title}</text>
  <text x="300" y="546" text-anchor="middle" font-family="sans-serif" font-size="12" letter-spacing="2" fill="${accent}">${craft.toUpperCase()} · ${region.toUpperCase()}</text>
  <text x="300" y="576" text-anchor="middle" font-family="monospace" font-size="11" fill="${basePal.ink}" opacity="0.65">${sku} · PLATE 0${frameNum}</text>
</svg>`;
}
