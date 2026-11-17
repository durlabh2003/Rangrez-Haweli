export type ChamberId =
  | 'facade-gate'
  | 'anand-pol'
  | 'inner-courtyard'
  | 'ratan-mandir'
  | 'hawa-mandir';

export type TimeOfDayId = 'dawn' | 'noon' | 'sunset' | 'night';

export interface ChamberSceneSpec {
  id: ChamberId;
  index: number;
  floorLevel: string;
  label: string;
  title: string;
  hindiTitle: string;
  subtitle: string;
  imageUrl: string;
  craftHighlight: string;
  craftFilter: { page: 'shop'; category?: string; craft?: string };
  /** UV [0..1] anchor inside the panoramic dome where the doorway/stairs forward portal sits */
  forwardPortal?: {
    u: number;
    v: number;
    label: string;
    targetChamber: ChamberId;
  };
  /** Optional secondary portal inside the same chamber (e.g. side gallery) */
  secondaryPortal?: {
    u: number;
    v: number;
    label: string;
    targetChamber: ChamberId;
  };
  /** Stained glass vs golden dust volumetric light beam palette */
  beamStyle: 'golden' | 'corridor' | 'courtyard' | 'stained-glass' | 'breeze-terrace';
  /** Base horizontal yaw (radians) when entering this chamber */
  initialYaw: number;
  initialPitch: number;
}

export const HAWA_MAHAL_CHAMBERS: ChamberSceneSpec[] = [
  {
    id: 'facade-gate',
    index: 1,
    floorLevel: 'Sireh Deori Approach',
    label: '1. Facade Gate',
    title: 'Hawa Mahal · Exterior Facade',
    hindiTitle: 'हवा महल · मुख्य प्रांगण',
    subtitle:
      'Stand before the five-storey pink sandstone honeycomb facade built in 1799. Step forward through the central Anand Pol archway to enter the palace.',
    imageUrl: '/src/assets/images/hawa_01_exterior_facade_1794558716226.jpg',
    craftHighlight: 'Explore All 108 Crafts',
    craftFilter: { page: 'shop' },
    forwardPortal: {
      u: 0.5,
      v: 0.34,
      label: 'Enter Anand Pol Gate',
      targetChamber: 'anand-pol',
    },
    beamStyle: 'golden',
    initialYaw: 0,
    initialPitch: -0.035,
  },
  {
    id: 'anand-pol',
    index: 2,
    floorLevel: 'Level 1 · Gateway',
    label: '2. Anand Pol Entry',
    title: 'Stepping Through Anand Pol',
    hindiTitle: 'आनंद पोल प्रवेश द्वार',
    subtitle:
      'You have crossed the threshold past the swung brass-studded teakwood doors. Follow the shaded sandstone colonnade ahead into the inner courtyard.',
    imageUrl: '/src/assets/images/hawa_02_anand_pol_entry_1794558716816.jpg',
    craftHighlight: 'Shop Sanganeri & Bagru Textiles',
    craftFilter: { page: 'shop', category: 'textiles-apparel' },
    forwardPortal: {
      u: 0.51,
      v: 0.44,
      label: 'Walk into Courtyard',
      targetChamber: 'inner-courtyard',
    },
    beamStyle: 'corridor',
    initialYaw: 0,
    initialPitch: -0.04,
  },
  {
    id: 'inner-courtyard',
    index: 3,
    floorLevel: 'Level 1–2 · Charbagh',
    label: '3. Inner Courtyard',
    title: 'Inside the Hawa Mahal Courtyard',
    hindiTitle: 'आंतरिक चारबाग़ आँगन',
    subtitle:
      'Standing inside the sunlit heart of Hawa Mahal—encircled by scalloped sandstone arcades, painted floral arches, and the octagonal Makrana marble fountain.',
    imageUrl: '/src/assets/images/hawa_03_inner_courtyard_1794558717757.jpg',
    craftHighlight: 'Shop Blue Pottery & Home Linen',
    craftFilter: { page: 'shop', category: 'home-furnishing' },
    forwardPortal: {
      u: 0.22,
      v: 0.56,
      label: 'Ascend to Ratan Mandir',
      targetChamber: 'ratan-mandir',
    },
    secondaryPortal: {
      u: 0.5,
      v: 0.7,
      label: 'Ascend to Hawa Crown',
      targetChamber: 'hawa-mandir',
    },
    beamStyle: 'courtyard',
    initialYaw: 0,
    initialPitch: -0.04,
  },
  {
    id: 'ratan-mandir',
    index: 4,
    floorLevel: 'Level 2 · Ratan Mandir',
    label: '4. Ratan Glass Hall',
    title: 'Ratan Mandir Stained-Glass Hall',
    hindiTitle: 'रतन मंदिर शीश महल',
    subtitle:
      'Inside the jewel-toned gallery where emerald, ruby, cobalt, and amber Belgian glass panels flood cool marble floors with desert sunlight.',
    imageUrl: '/src/assets/images/hawa_04_ratan_stained_glass_1794558717567.jpg',
    craftHighlight: 'Shop Thewa & Meenakari Jewellery',
    craftFilter: { page: 'shop', category: 'jewellery' },
    forwardPortal: {
      u: 0.58,
      v: 0.5,
      label: 'Ascend to Hawa Mandir Balcony',
      targetChamber: 'hawa-mandir',
    },
    beamStyle: 'stained-glass',
    initialYaw: -0.04,
    initialPitch: -0.04,
  },
  {
    id: 'hawa-mandir',
    index: 5,
    floorLevel: 'Level 5 · Wind Crown',
    label: '5. Hawa Balcony',
    title: 'Hawa Mandir · Palace of Winds Pavilion',
    hindiTitle: 'हवा मंदिर · शीर्ष झरोखा',
    subtitle:
      'Standing at the uppermost wind-swept pavilion surrounded by carved sandstone jaali screens overlooking Jantar Mantar, Pink City Jaipur, and the Aravalli hills.',
    imageUrl: '/src/assets/images/hawa_05_hawa_mandir_balcony_1794558719068.jpg',
    craftHighlight: 'Shop Heritage Decor & Gifting',
    craftFilter: { page: 'shop', category: 'art-decor' },
    forwardPortal: {
      u: 0.5,
      v: 0.36,
      label: 'Return to Exterior Gate',
      targetChamber: 'facade-gate',
    },
    beamStyle: 'breeze-terrace',
    initialYaw: 0,
    initialPitch: -0.035,
  },
];

export interface TimeLightingMood {
  id: TimeOfDayId;
  label: string;
  tintRgb: [number, number, number];
  brightness: number;
  nightFactor: number;
  beamOpacity: number;
  ambientTempC: number;
  skyBackdropHex: string;
}

export const TIME_LIGHTING_MOODS: Record<TimeOfDayId, TimeLightingMood> = {
  dawn: {
    id: 'dawn',
    label: 'Dawn',
    tintRgb: [1.06, 0.94, 0.88],
    brightness: 0.96,
    nightFactor: 0.1,
    beamOpacity: 0.42,
    ambientTempC: 26,
    skyBackdropHex: '#2C1713',
  },
  noon: {
    id: 'noon',
    label: 'Noon',
    tintRgb: [1.0, 1.0, 1.0],
    brightness: 1.04,
    nightFactor: 0.0,
    beamOpacity: 0.52,
    ambientTempC: 38,
    skyBackdropHex: '#231411',
  },
  sunset: {
    id: 'sunset',
    label: 'Sunset',
    tintRgb: [1.14, 0.88, 0.72],
    brightness: 0.95,
    nightFactor: 0.22,
    beamOpacity: 0.62,
    ambientTempC: 31,
    skyBackdropHex: '#2A120D',
  },
  night: {
    id: 'night',
    label: 'Night',
    tintRgb: [0.46, 0.54, 0.86],
    brightness: 0.72,
    nightFactor: 0.85,
    beamOpacity: 0.2,
    ambientTempC: 21,
    skyBackdropHex: '#0D1226',
  },
};
