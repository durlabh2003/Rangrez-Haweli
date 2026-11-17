import type { AdminConfig, ClaimRecord } from '../types';

export interface CuratedGiFact {
  id: string;
  craft: string;
  region: string;
  giStatus: 'verified' | 'unverified';
  summary: string;
  careNote: string;
  referenceNote: string;
}

export const HERITAGE_GUILD_METRICS = {
  partnerGuildsCount: 12,
  documentedCraftRegions: 7,
  typicalArtisanSharePct: 52,
  typicalMaterialsPct: 22,
  typicalLogisticsPct: 14,
  typicalBrandPct: 12,
  methodologyNote:
    'Typical pre-discount full-price MRP unit split across 12 Rajasthani craft cooperatives. Promotional coupon discounts and COD/shipping fees adjust margin from the Haveli Studio share, not artisan guild pay.',
};

export const LEGAL_CONFIG_CLIENT_FALLBACK = {
  brandName: 'Rangrez Haveli',
  entityNamePlaceholder: 'LEGAL_ENTITY_NAME [Verify in Production Env]',
  registeredAddressPlaceholder: 'LEGAL_ADDRESS [Verify in Production Env]',
  gstinPlaceholder: 'LEGAL_GSTIN [Verify in Production Env]',
  grievanceOfficerPlaceholder: 'GRIEVANCE_OFFICER_NAME [Verify in Production Env]',
  grievanceEmailPlaceholder: 'grievance@example.invalid',
  responseSla: 'Acknowledgement within 48 hours · Resolution within 30 days',
};

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  prepaidIncentiveInr: 50,
  freeShippingThresholdInr: 1999,
  standardShippingFeeInr: 120,
  giftWrapFeeInr: 99,
  codEnabled: true,
  codMaxOrderInr: 15000,
  codFeeInr: 60,
  codBlockedPincodes: ['999999'],
  moharMaxRedeemPct: 10,
  moharEarnRatePct: 2,
  allowCouponStackWithMohar: false,
  lowStockUrgencyEnabled: false,
  defaultReturnWindowDays: 14,
};

export const DEFAULT_CLAIMS_REGISTRY: ClaimRecord[] = [
  {
    id: 'gi-thewa',
    claimType: 'gi_tag',
    subject: 'Pratapgarh Thewa',
    statement: 'Thewa art of Rajasthan holds a registered Geographical Indication.',
    fallbackText: 'Traditional craft of Pratapgarh, Rajasthan',
    sourceName: 'Geographical Indications Registry (India)',
    sourceUrl: 'https://search.ipindia.gov.in/GIRPublic/',
    registryReference: 'Verify Certificate # in Admin before launch',
    verified: false,
  },
  {
    id: 'gi-sanganeri',
    claimType: 'gi_tag',
    subject: 'Sanganeri Hand-Block Printing',
    statement: 'Sanganeri hand-block printing holds a Geographical Indication.',
    fallbackText: 'Traditional craft of Sanganer, Jaipur',
    sourceName: 'Geographical Indications Registry (India)',
    sourceUrl: 'https://search.ipindia.gov.in/GIRPublic/',
    registryReference: 'Verify Certificate # in Admin before launch',
    verified: false,
  },
  {
    id: 'gi-bagru',
    claimType: 'gi_tag',
    subject: 'Bagru Hand-Block Printing',
    statement: 'Bagru hand-block printing holds a Geographical Indication.',
    fallbackText: 'Traditional craft of Bagru, Jaipur',
    sourceName: 'Geographical Indications Registry (India)',
    sourceUrl: 'https://search.ipindia.gov.in/GIRPublic/',
    registryReference: 'Verify Certificate # in Admin before launch',
    verified: false,
  },
  {
    id: 'gi-blue-pottery',
    claimType: 'gi_tag',
    subject: 'Blue Pottery of Jaipur',
    statement: 'Blue Pottery of Jaipur holds a Geographical Indication.',
    fallbackText: 'Traditional craft of Jaipur & Kot Jewar',
    sourceName: 'Geographical Indications Registry (India)',
    sourceUrl: 'https://search.ipindia.gov.in/GIRPublic/',
    registryReference: 'Verify Certificate # in Admin before launch',
    verified: false,
  },
  {
    id: 'gi-kota-doria',
    claimType: 'gi_tag',
    subject: 'Kota Doria',
    statement: 'Kota Doria handloom weave holds a Geographical Indication.',
    fallbackText: 'Traditional handloom craft of Kaithoon, Kota',
    sourceName: 'Geographical Indications Registry (India)',
    sourceUrl: 'https://search.ipindia.gov.in/GIRPublic/',
    registryReference: 'Verify Certificate # in Admin before launch',
    verified: false,
  },
];

export const CURATED_GI_FACTS: CuratedGiFact[] = [
  {
    id: 'fact-sanganer',
    craft: 'Sanganeri Block Print',
    region: 'Sanganer, Jaipur',
    giStatus: 'unverified',
    summary:
      'Hand-block printing from Sanganer is characterised by fine dark outlines (rekh) and floral/botanical filler blocks (datta) stamped onto light-ground cotton and mulmul.',
    careNote: 'Cold hand wash separately in mild pH-neutral detergent; dry in shade.',
    referenceNote: 'Registry verification pending in Admin Claims Registry.',
  },
  {
    id: 'fact-bagru',
    craft: 'Bagru & Dabu Mud-Resist',
    region: 'Bagru, Jaipur',
    giStatus: 'unverified',
    summary:
      'Bagru artisans use a black river-clay Dabu resist paste mixed with acacia gum and wheat chaff before dipping textiles in natural indigo and madder vats.',
    careNote: 'Rinse cool before first wear; expect slight natural indigo softening over time.',
    referenceNote: 'Registry verification pending in Admin Claims Registry.',
  },
  {
    id: 'fact-thewa',
    craft: 'Pratapgarh Thewa',
    region: 'Pratapgarh, Rajasthan',
    giStatus: 'unverified',
    summary:
      'Thewa pairs pierced 23k gold sheet fretwork (carved with steel sooi tools) fused onto molten Belgian coloured glass inside a silver frame.',
    careNote: 'Wipe with dry soft muslin; avoid ultrasonic cleaners or perfume spray.',
    referenceNote: 'Registry verification pending in Admin Claims Registry.',
  },
  {
    id: 'fact-blue-pottery',
    craft: 'Jaipur Blue Pottery',
    region: 'Jaipur & Kot Jewar',
    giStatus: 'unverified',
    summary:
      'Shaped from crushed quartz, powdered glass, fuller’s earth (multani mitti), and katira gum rather than conventional clay, decorated with cobalt and copper mineral oxides.',
    careNote: 'Hand clean gently with soft sponge; avoid sudden thermal shock.',
    referenceNote: 'Registry verification pending in Admin Claims Registry.',
  },
  {
    id: 'fact-kota-doria',
    craft: 'Kota Doria Weaving',
    region: 'Kaithoon, Kota',
    giStatus: 'unverified',
    summary:
      'Woven on throw-shuttle pit looms combining breathable cotton for strength and pure mulberry silk for translucency in small square khat checks.',
    careNote: 'Dry clean or gentle cold dip; press under muslin cloth.',
    referenceNote: 'Registry verification pending in Admin Claims Registry.',
  },
  {
    id: 'fact-meenakari',
    craft: 'Jaipur Meenakari',
    region: 'Johari Bazaar, Jaipur',
    giStatus: 'unverified',
    summary:
      'Vitreous glass-powder enamel fused in kilns onto engraved gold, silver, or brass grooves featuring peacock and floral motifs.',
    careNote: 'Store separately in soft cotton pouches to prevent scratching.',
    referenceNote: 'Registry verification pending in Admin Claims Registry.',
  },
];

export const GLOSSARY_TERMS: Record<
  'Mohar' | 'Pasand' | 'Padharo' | 'Tyohaar',
  { title: string; meaning: string }
> = {
  Mohar: {
    title: 'Mohar Rewards',
    meaning: 'Rangrez Haveli loyalty points (1 Mohar = ₹1 credit, capped per order on non-coupon purchases).',
  },
  Pasand: {
    title: 'Pasand Wishlist',
    meaning: 'Your saved collection of favourite Rajasthani crafts.',
  },
  Padharo: {
    title: 'Padharo (पधारो)',
    meaning: 'Rajasthani greeting meaning "Welcome warmly into our courtyard."',
  },
  Tyohaar: {
    title: 'Tyohaar Mode',
    meaning: 'Toggles warm marigold festive accents and borders across the storefront.',
  },
};

export const DARK_PATTERN_CHECKLIST = [
  { id: 'dp-01', rule: 'Zero pre-ticked paid add-ons (gift wrap starts unchecked)', verified: true },
  { id: 'dp-02', rule: 'No fake countdown timers or artificial stock scarcity', verified: true },
  { id: 'dp-03', rule: 'COD handling fee and prepaid incentive disclosed before final step', verified: true },
  { id: 'dp-04', rule: 'Granular cookie/analytics consent banner with Reject option', verified: true },
  { id: 'dp-05', rule: 'Marketing newsletter consent unchecked by default', verified: true },
  { id: 'dp-06', rule: 'Sample/mock items clearly tagged and excluded in production', verified: true },
];

export const CRAFT_MEDIA_ASSETS = {
  hero: '/src/assets/images/hero_jharokha_palace_1794546842058.jpg',
  aboutCourtyard: '/src/assets/images/about_haveli_artisan_guild_1794554889737.jpg',
  textiles: '/src/assets/images/craft_sanganeri_textiles_1794546842861.jpg',
  homeFurnishing: '/src/assets/images/home_furnishing_razai_1794554507328.jpg',
  jewellery: '/src/assets/images/craft_meenakari_jewellery_1794546841024.jpg',
  footwear: '/src/assets/images/craft_leather_mojari_gifting_1794546843670.jpg',
  decor: '/src/assets/images/craft_blue_pottery_decor_1794546842865.jpg',
  festiveHamper: '/src/assets/images/craft_festive_diwali_hamper_1794554509452.jpg',
  slideTeakwoodBlocks: '/src/assets/images/slide_teakwood_blocks_1794554882397.jpg',
  slideHaveliRoom: '/src/assets/images/slide_haveli_living_room_1794554882877.jpg',
  slideJewelTray: '/src/assets/images/slide_meenakari_velvet_tray_1794554883927.jpg',
  slideCorporateHamper: '/src/assets/images/slide_corporate_hamper_box_1794554883879.jpg',
  workshopSanganer: '/src/assets/images/workshop_sanganer_blockprint_1794549326509.jpg',
  workshopBagru: '/src/assets/images/workshop_bagru_indigo_vat_1794549327374.jpg',
  workshopBluePottery: '/src/assets/images/workshop_jaipur_blue_pottery_1794549329793.jpg',
  workshopThewa: '/src/assets/images/workshop_pratapgarh_thewa_1794549329260.jpg',
  reelBandhani: '/src/assets/images/reel_bandhani_sikar_1794554879984.jpg',
  reelMojari: '/src/assets/images/reel_mojari_jodhpur_1794554880342.jpg',
  reelPhad: '/src/assets/images/reel_phad_shahpura_1794554879665.jpg',
  reelKota: '/src/assets/images/reel_kota_kaithoon_1794554881367.jpg',
  bagruIndigo: '/src/assets/images/craft_bagru_indigo_dabu_1794554510528.jpg',
  thewa: '/src/assets/images/craft_thewa_emerald_1794554509790.jpg',
  phad: '/src/assets/images/craft_phad_painting_1794554508960.jpg',
  bandhani: '/src/assets/images/craft_bandhani_leheriya_1794554507399.jpg',
} as const;

