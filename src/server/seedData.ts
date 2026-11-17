import type {
  Artisan,
  B2BApplication,
  B2BQuote,
  BlogPost,
  Bundle,
  CategoryInfo,
  CategorySlug,
  Coupon,
  Order,
  Product,
  Review,
} from '../types';
import { getHsnGstRate } from './pricing';

export const GENERATED_IMAGES = {
  // Hero & About Courtyard (2)
  hero: '/src/assets/images/hero_jharokha_palace_1794546842058.jpg',
  aboutCourtyard: '/src/assets/images/about_haveli_artisan_guild_1794554889737.jpg',

  // 6 Category Hero Photos (6)
  textiles: '/src/assets/images/craft_sanganeri_textiles_1794546842861.jpg',
  homeFurnishing: '/src/assets/images/home_furnishing_razai_1794554507328.jpg',
  jewellery: '/src/assets/images/craft_meenakari_jewellery_1794546841024.jpg',
  footwear: '/src/assets/images/craft_leather_mojari_gifting_1794546843670.jpg',
  decor: '/src/assets/images/craft_blue_pottery_decor_1794546842865.jpg',
  festiveHamper: '/src/assets/images/craft_festive_diwali_hamper_1794554509452.jpg',

  // 4 Interactive Studio Slide Photos (4)
  slideTeakwoodBlocks: '/src/assets/images/slide_teakwood_blocks_1794554882397.jpg',
  slideHaveliRoom: '/src/assets/images/slide_haveli_living_room_1794554882877.jpg',
  slideJewelTray: '/src/assets/images/slide_meenakari_velvet_tray_1794554883927.jpg',
  slideCorporateHamper: '/src/assets/images/slide_corporate_hamper_box_1794554883879.jpg',

  // 4 Artisan Community Carousel Workshop Photos (4)
  workshopSanganer: '/src/assets/images/workshop_sanganer_blockprint_1794549326509.jpg',
  workshopBagru: '/src/assets/images/workshop_bagru_indigo_vat_1794549327374.jpg',
  workshopBluePottery: '/src/assets/images/workshop_jaipur_blue_pottery_1794549329793.jpg',
  workshopThewa: '/src/assets/images/workshop_pratapgarh_thewa_1794549329260.jpg',

  // 4 Meet the Artisan Video Reel Photos (4)
  reelBandhani: '/src/assets/images/reel_bandhani_sikar_1794554879984.jpg',
  reelMojari: '/src/assets/images/reel_mojari_jodhpur_1794554880342.jpg',
  reelPhad: '/src/assets/images/reel_phad_shahpura_1794554879665.jpg',
  reelKota: '/src/assets/images/reel_kota_kaithoon_1794554881367.jpg',

  // 6 Blog Journal Cover Photos (6)
  bagruIndigo: '/src/assets/images/craft_bagru_indigo_dabu_1794554510528.jpg',
  thewa: '/src/assets/images/craft_thewa_emerald_1794554509790.jpg',
  blogWashCare: '/src/assets/images/blog_wash_care_indigo_1794554881404.jpg',
  blogGiftingBoxes: '/src/assets/images/blog_gifting_boxes_gota_1794554881877.jpg',
  blogQuartzPottery: '/src/assets/images/blog_quartz_pottery_clay_1794554881770.jpg',
  phad: '/src/assets/images/craft_phad_painting_1794554508960.jpg',

  // 12 Unique Flagship Product Showcase Photos (6 Bestsellers + 6 New Arrivals)
  prodSanganeriKurta: '/src/assets/images/prod_sanganeri_kurta_1794554883969.jpg',
  prodBagruKurtaSet: '/src/assets/images/prod_bagru_kurta_set_1794554885004.jpg',
  bandhani: '/src/assets/images/craft_bandhani_leheriya_1794554507399.jpg',
  prodKotaDoriaSaree: '/src/assets/images/prod_kota_doria_saree_1794554885555.jpg',
  prodMensBagruKurta: '/src/assets/images/prod_mens_bagru_kurta_1794554885657.jpg',
  prodSanganeriBedsheet: '/src/assets/images/prod_sanganeri_bedsheet_1794554886602.jpg',
  prodBlockAnarkali: '/src/assets/images/prod_block_anarkali_1794554886833.jpg',
  prodLeheriyaDupatta: '/src/assets/images/prod_leheriya_dupatta_1794554887026.jpg',
  prodMulmulSaree: '/src/assets/images/prod_mulmul_saree_1794554888185.jpg',
  prodKidsFrock: '/src/assets/images/prod_kids_frock_1794554887689.jpg',
  prodBandhaniCoord: '/src/assets/images/prod_bandhani_coord_1794554888986.jpg',
  kathputliBrass: '/src/assets/images/craft_kathputli_brass_1794554511189.jpg',
};

export const CATEGORIES: CategoryInfo[] = [
  {
    slug: 'textiles-apparel',
    name: 'Textiles & Apparel',
    nameHi: 'वस्त्र और परिधान',
    tagline: 'Sanganeri florals, Bagru indigo Dabu, Bandhani & Leheriya',
    heroImage: GENERATED_IMAGES.textiles,
  },
  {
    slug: 'home-furnishing',
    name: 'Home Furnishing',
    nameHi: 'गृह सज्जा वस्त्र',
    tagline: 'Jaipuri razai quilts, hand-block bedlinen & woven dhurries',
    heroImage: GENERATED_IMAGES.homeFurnishing,
  },
  {
    slug: 'jewellery',
    name: 'Jewellery',
    nameHi: 'आभूषण',
    tagline: 'Meenakari enamel, Pratapgarh GI Thewa, Kundan & lac bangles',
    heroImage: GENERATED_IMAGES.jewellery,
  },
  {
    slug: 'footwear-leather',
    name: 'Footwear & Leather',
    nameHi: 'मोजरी और चर्म शिल्प',
    tagline: 'Embroidered Jodhpuri mojari, camel-leather totes & potlis',
    heroImage: GENERATED_IMAGES.footwear,
  },
  {
    slug: 'art-decor',
    name: 'Art & Collectibles',
    nameHi: 'कला और सजावट',
    tagline: 'Jaipur Blue Pottery, Shahpura Phad scrolls & Kathputli sets',
    heroImage: GENERATED_IMAGES.decor,
  },
  {
    slug: 'gifting-festive',
    name: 'Gifting & Festive',
    nameHi: 'त्योहार और उपहार',
    tagline: 'Curated Diwali hampers, brass diyas & corporate gift boxes',
    heroImage: GENERATED_IMAGES.festiveHamper,
  },
];

export const ARTISANS: Artisan[] = [
  {
    id: 'art-01',
    name: 'Ramgopal Chippa',
    village: 'Sanganer',
    district: 'Jaipur',
    craft: 'Sanganeri Block Print',
    yearsExperience: 34,
    story: 'Third-generation master printer carving fine floral gadh, rekh, and datta teakwood blocks using soft river-washed cotton.',
    coOperative: 'Sanganer Rangrez Sangh',
    avatarColor: '#B3123F',
    image: GENERATED_IMAGES.workshopSanganer,
    isMock: true,
  },
  {
    id: 'art-02',
    name: 'Suleman Khan',
    village: 'Bagru',
    district: 'Jaipur',
    craft: 'Bagru & Dabu Mud-Resist',
    yearsExperience: 28,
    story: 'Specialist in fermented iron-jaggery black dye and river-clay Dabu resist printing cured under the desert sun.',
    coOperative: 'Bagru Chhipa Collective',
    avatarColor: '#1F3A93',
    image: GENERATED_IMAGES.workshopBagru,
    isMock: true,
  },
  {
    id: 'art-03',
    name: 'Rukhsana Khatoon',
    village: 'Sikar',
    district: 'Shekhawati',
    craft: 'Bandhani Tie-Dye',
    yearsExperience: 22,
    story: 'Ties over 4,000 tiny ekdali and shikari knots per dupatta by hand without mechanical stencils.',
    coOperative: 'Shekhawati Bandhej Mahila Mandal',
    avatarColor: '#B3123F',
    image: GENERATED_IMAGES.reelBandhani,
    isMock: true,
  },
  {
    id: 'art-04',
    name: 'Mahendra Soni',
    village: 'Pratapgarh',
    district: 'Pratapgarh',
    craft: 'Thewa Gold-on-Glass',
    yearsExperience: 31,
    story: 'Master of the GI-tagged 23k gold leaf fusing technique onto Belgian emerald and ruby glass panels.',
    coOperative: 'Pratapgarh Thewa Kala Kendra',
    avatarColor: '#0F7B6C',
    image: GENERATED_IMAGES.workshopThewa,
    isMock: true,
  },
  {
    id: 'art-05',
    name: 'Gopal Kumhar',
    village: 'Kot Jewar',
    district: 'Jaipur',
    craft: 'Jaipur Blue Pottery',
    yearsExperience: 26,
    story: 'Fires quartz-stoneware without clay, glazed in cobalt oxide and copper-turquoise mineral pigments.',
    coOperative: 'Jaipur Neela Kumhar Guild',
    avatarColor: '#1F3A93',
    image: GENERATED_IMAGES.workshopBluePottery,
    isMock: true,
  },
  {
    id: 'art-06',
    name: 'Kalyan Joshi',
    village: 'Shahpura',
    district: 'Bhilwara',
    craft: 'Phad Scroll Painting',
    yearsExperience: 29,
    story: 'Paints epic Rajasthani folk ballads on hand-starched khadi using stone pigments and squirrel-hair brushes.',
    coOperative: 'Shahpura Chitrashala',
    avatarColor: '#F28C1B',
    image: GENERATED_IMAGES.reelPhad,
    isMock: true,
  },
  {
    id: 'art-07',
    name: 'Zarina Begum',
    village: 'Johari Bazaar',
    district: 'Jaipur',
    craft: 'Meenakari & Lac',
    yearsExperience: 19,
    story: 'Hand-fires vitreous enamel onto silver and brass jhumkas and sets kundan stones with heritage lac.',
    coOperative: 'Jaipur Meena Karigar Guild',
    avatarColor: '#0F7B6C',
    image: GENERATED_IMAGES.slideJewelTray,
    isMock: true,
  },
  {
    id: 'art-08',
    name: 'Bhanwar Lal Mochi',
    village: 'Jodhpur',
    district: 'Jodhpur',
    craft: 'Jodhpuri Mojari',
    yearsExperience: 35,
    story: 'Hand-stitches vegetable-tanned camel leather uppers with zari and silk resham motifs using zero nails.',
    coOperative: 'Marwar Charmakar Samiti',
    avatarColor: '#C9A227',
    image: GENERATED_IMAGES.reelMojari,
    isMock: true,
  },
  {
    id: 'art-09',
    name: 'Shakuntala Devi',
    village: 'Kaithoon',
    district: 'Kota',
    craft: 'Kota Doria Weaving',
    yearsExperience: 24,
    story: 'Weaves featherlight cotton-silk khat check sarees on traditional throw-shuttle pit looms.',
    coOperative: 'Kaithoon Bunkar Sangh',
    avatarColor: '#F4B400',
    image: GENERATED_IMAGES.reelKota,
    isMock: true,
  },
  {
    id: 'art-10',
    name: 'Pappu Bhat',
    village: 'Kathputli Colony',
    district: 'Jaipur',
    craft: 'Kathputli & Woodcraft',
    yearsExperience: 27,
    story: 'Carves mango-wood puppet heads and dresses royal court pairs in recycled brocade and gota patti.',
    coOperative: 'Rajasthan Natya Kala Mandal',
    avatarColor: '#B3123F',
    image: GENERATED_IMAGES.kathputliBrass,
    isMock: true,
  },
  {
    id: 'art-11',
    name: 'Om Prakash Sharma',
    village: 'Kishangarh',
    district: 'Ajmer',
    craft: 'Miniature & Pichwai',
    yearsExperience: 30,
    story: 'Creates fine lotus-pond Pichwai panels and court miniatures finished with natural mineral gold.',
    coOperative: 'Kishangarh Kalam Atelier',
    avatarColor: '#0F7B6C',
    image: GENERATED_IMAGES.phad,
    isMock: true,
  },
  {
    id: 'art-12',
    name: 'Meera Kanwar',
    village: 'Barmer',
    district: 'Barmer',
    craft: 'Mirror-Work & Quilting',
    yearsExperience: 21,
    story: 'Leads 45 rural women artisans hand-tacking cotton razai quilts and shisha mirror-work torans.',
    coOperative: 'Thar Mahila Shilp Sangathan',
    avatarColor: '#F28C1B',
    image: GENERATED_IMAGES.homeFurnishing,
    isMock: true,
  },
];

interface RawProductSpec {
  name: string;
  category: CategorySlug;
  subCategory: string;
  craftType: string;
  region: string;
  material: string;
  price: number;
  mrp: number;
  artisanId: string;
  giTagged?: boolean;
  colors: string[];
  occasions: string[];
  sizes?: string[];
  outOfStock?: boolean;
  bestseller?: boolean;
  newArrival?: boolean;
  featured?: boolean;
  festive?: boolean;
  giftable?: boolean;
}

const RAW_PRODUCTS: RawProductSpec[] = [
  // 1. Textiles and Apparel (20)
  { name: 'Sanganeri Floral Cotton Kurta', category: 'textiles-apparel', subCategory: 'Kurtas', craftType: 'Sanganeri Block Print', region: 'Sanganer', material: '100% Cambric Cotton', price: 1899, mrp: 2499, artisanId: 'art-01', giTagged: true, colors: ['Ivory', 'Jaipur Pink'], occasions: ['Dailywear', 'Brunch'], sizes: ['XS', 'S', 'M', 'L', 'XL'], bestseller: true, featured: true },
  { name: 'Bagru Indigo Dabu Kurta Set', category: 'textiles-apparel', subCategory: 'Kurta Sets', craftType: 'Bagru Dabu Print', region: 'Bagru', material: 'Handspun Slub Cotton', price: 2999, mrp: 3699, artisanId: 'art-02', giTagged: true, colors: ['Bagru Indigo', 'Sand'], occasions: ['Workwear', 'Festive'], sizes: ['S', 'M', 'L', 'XL'], bestseller: true, featured: true },
  { name: 'Jaipuri Block-Print Anarkali', category: 'textiles-apparel', subCategory: 'Dresses', craftType: 'Sanganeri Block Print', region: 'Jaipur', material: 'Mulmul Cotton', price: 3499, mrp: 4499, artisanId: 'art-01', giTagged: true, colors: ['Maroon', 'Gold'], occasions: ['Festive', 'Wedding'], sizes: ['XS', 'S', 'M', 'L', 'XL'], newArrival: true },
  { name: 'Bandhani Silk Dupatta in Rani Pink', category: 'textiles-apparel', subCategory: 'Dupattas', craftType: 'Bandhani', region: 'Sikar', material: 'Pure Gajji Silk', price: 2799, mrp: 3499, artisanId: 'art-03', colors: ['Rani Pink', 'Turmeric'], occasions: ['Wedding', 'Festive'], bestseller: true, featured: true, giftable: true },
  { name: 'Leheriya Chiffon Dupatta', category: 'textiles-apparel', subCategory: 'Dupattas', craftType: 'Leheriya', region: 'Jaipur', material: 'Pure Georgette Chiffon', price: 1699, mrp: 2199, artisanId: 'art-03', colors: ['Kesariya', 'Marigold'], occasions: ['Teej', 'Dailywear'], newArrival: true, festive: true },
  { name: 'Kota Doria Saree in Marigold', category: 'textiles-apparel', subCategory: 'Sarees', craftType: 'Kota Doria', region: 'Kaithoon', material: 'Cotton-Silk Khat Weave', price: 4899, mrp: 5999, artisanId: 'art-09', giTagged: true, colors: ['Marigold', 'Gold'], occasions: ['Festive', 'Formal'], bestseller: true, featured: true },
  { name: 'Mulmul Block-Print Saree', category: 'textiles-apparel', subCategory: 'Sarees', craftType: 'Sanganeri Block Print', region: 'Sanganer', material: '120-Count Mulmul', price: 3299, mrp: 3999, artisanId: 'art-01', giTagged: true, colors: ['Sand Ivory', 'Peacock Green'], occasions: ['Dailywear', 'Office'], newArrival: true },
  { name: 'Bagru Hand-Block Palazzo', category: 'textiles-apparel', subCategory: 'Bottoms', craftType: 'Bagru Block Print', region: 'Bagru', material: 'Organic Cotton', price: 1299, mrp: 1599, artisanId: 'art-02', giTagged: true, colors: ['Indigo', 'Charcoal'], occasions: ['Dailywear'], sizes: ['S', 'M', 'L', 'XL'] },
  { name: "Men's Sanganeri Nehru Jacket", category: 'textiles-apparel', subCategory: 'Menswear', craftType: 'Sanganeri Block Print', region: 'Jaipur', material: 'Quilted Cotton Linen', price: 2699, mrp: 3299, artisanId: 'art-01', giTagged: true, colors: ['Ivory', 'Indigo'], occasions: ['Wedding', 'Festive'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], featured: true },
  { name: "Men's Bagru Cotton Kurta", category: 'textiles-apparel', subCategory: 'Menswear', craftType: 'Bagru Block Print', region: 'Bagru', material: 'Breathable Khadi Cotton', price: 1599, mrp: 1999, artisanId: 'art-02', giTagged: true, colors: ['Indigo', 'Sand'], occasions: ['Dailywear', 'Festive'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], bestseller: true, featured: true },
  { name: 'Block-Print Kids Frock', category: 'textiles-apparel', subCategory: 'Kidswear', craftType: 'Sanganeri Block Print', region: 'Sanganer', material: 'Soft Organic Mulmul', price: 899, mrp: 1199, artisanId: 'art-01', giTagged: true, colors: ['Turmeric', 'Pink'], occasions: ['Play', 'Festive'], sizes: ['2-3Y', '4-5Y', '6-7Y', '8-9Y'], newArrival: true },
  { name: 'Kids Bandhani Kurta Set', category: 'textiles-apparel', subCategory: 'Kidswear', craftType: 'Bandhani', region: 'Sikar', material: 'Pure Cotton', price: 1299, mrp: 1599, artisanId: 'art-03', colors: ['Kesariya', 'Peacock'], occasions: ['Diwali', 'Wedding'], sizes: ['2-3Y', '4-5Y', '6-7Y'], festive: true },
  { name: 'Leheriya Georgette Saree', category: 'textiles-apparel', subCategory: 'Sarees', craftType: 'Leheriya', region: 'Jaipur', material: 'Viscose Georgette', price: 4299, mrp: 5299, artisanId: 'art-03', colors: ['Rani Pink', 'Kesariya'], occasions: ['Teej', 'Wedding'], festive: true },
  { name: 'Bandhani Cotton Co-ord Set', category: 'textiles-apparel', subCategory: 'Co-ords', craftType: 'Bandhani', region: 'Sikar', material: 'Cambric Cotton', price: 2499, mrp: 2999, artisanId: 'art-03', colors: ['Peacock Green', 'Ivory'], occasions: ['Resort', 'Travel'], sizes: ['XS', 'S', 'M', 'L'], newArrival: true },
  { name: 'Hand-Block Print Scarf', category: 'textiles-apparel', subCategory: 'Accessories', craftType: 'Sanganeri Block Print', region: 'Sanganer', material: 'Voile Cotton', price: 599, mrp: 799, artisanId: 'art-01', giTagged: true, colors: ['Sand', 'Crimson'], occasions: ['Everyday'], giftable: true },
  { name: 'Jaipuri Cotton Shirt for Men', category: 'textiles-apparel', subCategory: 'Menswear', craftType: 'Sanganeri Block Print', region: 'Jaipur', material: '60s Cotton', price: 1499, mrp: 1899, artisanId: 'art-01', giTagged: true, colors: ['White', 'Indigo'], occasions: ['Casual', 'Resort'], sizes: ['S', 'M', 'L', 'XL'] },
  { name: 'Bagru Wrap Skirt', category: 'textiles-apparel', subCategory: 'Bottoms', craftType: 'Bagru Dabu Print', region: 'Bagru', material: 'Heavy Cotton Twill', price: 1699, mrp: 2199, artisanId: 'art-02', giTagged: true, colors: ['Indigo', 'Rust'], occasions: ['Casual', 'Travel'], sizes: ['Free Size'] },
  { name: 'Dabu Mud-Resist Tunic', category: 'textiles-apparel', subCategory: 'Kurtas', craftType: 'Bagru Dabu Print', region: 'Bagru', material: 'Linen Cotton', price: 1999, mrp: 2499, artisanId: 'art-02', giTagged: true, colors: ['Indigo', 'Ivory'], occasions: ['Workwear'], sizes: ['S', 'M', 'L', 'XL'], outOfStock: true },
  { name: 'Kota Doria Dupatta', category: 'textiles-apparel', subCategory: 'Dupattas', craftType: 'Kota Doria', region: 'Kaithoon', material: 'Cotton-Silk Zari', price: 1399, mrp: 1799, artisanId: 'art-09', giTagged: true, colors: ['Ivory', 'Gold'], occasions: ['Formal', 'Festive'] },
  { name: 'Block-Print Cotton Stole', category: 'textiles-apparel', subCategory: 'Accessories', craftType: 'Sanganeri Block Print', region: 'Sanganer', material: 'Mulmul Cotton', price: 699, mrp: 899, artisanId: 'art-01', giTagged: true, colors: ['Turmeric', 'Maroon'], occasions: ['Everyday', 'Gifting'], giftable: true },

  // 2. Home Furnishing (18)
  { name: 'Sanganeri Block-Print Double Bedsheet Set', category: 'home-furnishing', subCategory: 'Bedlinen', craftType: 'Sanganeri Block Print', region: 'Sanganer', material: '220 TC Pure Cotton', price: 2499, mrp: 3199, artisanId: 'art-01', giTagged: true, colors: ['Ivory', 'Jaipur Pink'], occasions: ['Home'], bestseller: true, featured: true },
  { name: 'Bagru King Bedsheet Set', category: 'home-furnishing', subCategory: 'Bedlinen', craftType: 'Bagru Block Print', region: 'Bagru', material: '240 TC Cotton', price: 2899, mrp: 3599, artisanId: 'art-02', giTagged: true, colors: ['Bagru Indigo', 'Sand'], occasions: ['Home'] },
  { name: 'Jaipuri Razai Quilt (Double)', category: 'home-furnishing', subCategory: 'Quilts', craftType: 'Hand-Quilted Razai', region: 'Jaipur', material: 'Mulmul & Pure Cotton Wool', price: 4499, mrp: 5499, artisanId: 'art-12', colors: ['Indigo', 'Marigold'], occasions: ['Winter', 'Gifting'], bestseller: true, featured: true },
  { name: 'Jaipuri Razai Quilt (Single)', category: 'home-furnishing', subCategory: 'Quilts', craftType: 'Hand-Quilted Razai', region: 'Jaipur', material: 'Mulmul & Pure Cotton Wool', price: 3199, mrp: 3899, artisanId: 'art-12', colors: ['Peacock Green', 'Ivory'], occasions: ['Winter'] },
  { name: 'Hand-Block Cushion Cover Set of 5', category: 'home-furnishing', subCategory: 'Cushions', craftType: 'Sanganeri Block Print', region: 'Sanganer', material: 'Slub Cotton', price: 1199, mrp: 1599, artisanId: 'art-01', giTagged: true, colors: ['Maroon', 'Turmeric'], occasions: ['Living Room', 'Festive'], giftable: true },
  { name: 'Bandhani Cushion Cover Set of 2', category: 'home-furnishing', subCategory: 'Cushions', craftType: 'Bandhani', region: 'Sikar', material: 'Cotton Silk', price: 799, mrp: 999, artisanId: 'art-03', colors: ['Rani Pink', 'Kesariya'], occasions: ['Festive'] },
  { name: 'Cotton Dhurrie 4x6 in Geometric Weave', category: 'home-furnishing', subCategory: 'Rugs & Dhurries', craftType: 'Punja Dhurrie Weave', region: 'Jodhpur', material: 'Handspun Cotton', price: 3899, mrp: 4799, artisanId: 'art-12', colors: ['Indigo', 'Sand'], occasions: ['Home'], featured: true },
  { name: 'Jute-Cotton Runner', category: 'home-furnishing', subCategory: 'Rugs & Dhurries', craftType: 'Handloom Weave', region: 'Jodhpur', material: 'Jute & Cotton', price: 1499, mrp: 1899, artisanId: 'art-12', colors: ['Natural Sand', 'Charcoal'], occasions: ['Home'] },
  { name: 'Hand-Knotted Wool Rug 5x8', category: 'home-furnishing', subCategory: 'Rugs & Dhurries', craftType: 'Hand-Knotted Carpet', region: 'Jaipur', material: 'Bikaner Wool & Cotton', price: 12499, mrp: 15499, artisanId: 'art-12', colors: ['Crimson', 'Gold'], occasions: ['Luxury Home'], newArrival: true },
  { name: 'Block-Print Table Runner', category: 'home-furnishing', subCategory: 'Table Linen', craftType: 'Bagru Block Print', region: 'Bagru', material: 'Cotton Canvas', price: 699, mrp: 899, artisanId: 'art-02', giTagged: true, colors: ['Indigo', 'Ivory'], occasions: ['Dining'] },
  { name: 'Marigold Napkin Set of 6', category: 'home-furnishing', subCategory: 'Table Linen', craftType: 'Sanganeri Block Print', region: 'Sanganer', material: 'Cambric Cotton', price: 549, mrp: 749, artisanId: 'art-01', giTagged: true, colors: ['Marigold', 'Ivory'], occasions: ['Dining', 'Gifting'], giftable: true },
  { name: 'Block-Print Tablecloth for 6', category: 'home-furnishing', subCategory: 'Table Linen', craftType: 'Sanganeri Block Print', region: 'Sanganer', material: '200 TC Cotton', price: 1499, mrp: 1899, artisanId: 'art-01', giTagged: true, colors: ['Peacock', 'Ivory'], occasions: ['Dining'] },
  { name: 'Block-Print Curtains (Pair)', category: 'home-furnishing', subCategory: 'Curtains', craftType: 'Sanganeri Block Print', region: 'Sanganer', material: 'Heavy Cotton', price: 2199, mrp: 2799, artisanId: 'art-01', giTagged: true, colors: ['Sand', 'Crimson'], occasions: ['Home'] },
  { name: 'Leheriya Door Curtain', category: 'home-furnishing', subCategory: 'Curtains', craftType: 'Leheriya', region: 'Jaipur', material: 'Sheer Cotton Voile', price: 999, mrp: 1299, artisanId: 'art-03', colors: ['Kesariya', 'Turmeric'], occasions: ['Festive'] },
  { name: 'Block-Print Cotton Throw', category: 'home-furnishing', subCategory: 'Throws', craftType: 'Bagru Dabu Print', region: 'Bagru', material: 'Waffle Cotton', price: 1799, mrp: 2299, artisanId: 'art-02', giTagged: true, colors: ['Indigo', 'Sand'], occasions: ['Living Room'] },
  { name: 'Block-Print Wall Tapestry', category: 'home-furnishing', subCategory: 'Wall Decor', craftType: 'Sanganeri Block Print', region: 'Sanganer', material: 'Cotton Tapestry', price: 1199, mrp: 1499, artisanId: 'art-01', giTagged: true, colors: ['Maroon', 'Gold'], occasions: ['Home'] },
  { name: 'Pouf Cover in Bagru Print', category: 'home-furnishing', subCategory: 'Cushions', craftType: 'Bagru Block Print', region: 'Bagru', material: 'Heavy Canvas Cotton', price: 1399, mrp: 1799, artisanId: 'art-02', giTagged: true, colors: ['Indigo', 'Rust'], occasions: ['Living Room'], outOfStock: true },
  { name: 'Mirror-Work Door Toran', category: 'home-furnishing', subCategory: 'Festive Decor', craftType: 'Barmer Mirror-Work', region: 'Barmer', material: 'Cotton, Mirrors & Beads', price: 749, mrp: 999, artisanId: 'art-12', colors: ['Crimson', 'Turmeric'], occasions: ['Diwali', 'Wedding'], festive: true },

  // 3. Jewellery (18)
  { name: 'Meenakari Peacock Jhumka', category: 'jewellery', subCategory: 'Earrings', craftType: 'Meenakari', region: 'Jaipur', material: 'Gold-Plated Brass & Enamel', price: 1499, mrp: 1999, artisanId: 'art-07', colors: ['Peacock Green', 'Ruby'], occasions: ['Wedding', 'Festive'], bestseller: true, featured: true },
  { name: 'Meenakari Choker Set', category: 'jewellery', subCategory: 'Necklaces', craftType: 'Meenakari', region: 'Jaipur', material: 'Brass, Enamel & Pearls', price: 3499, mrp: 4499, artisanId: 'art-07', colors: ['Jaipur Pink', 'Gold'], occasions: ['Wedding'], festive: true },
  { name: 'Kundan Polki Necklace Set', category: 'jewellery', subCategory: 'Necklaces', craftType: 'Kundan Jadau', region: 'Jaipur', material: '22k Micron Gold Plate & Glass Polki', price: 6999, mrp: 8999, artisanId: 'art-07', colors: ['Gold', 'Ivory'], occasions: ['Bridal', 'Wedding'], bestseller: true },
  { name: 'Kundan Maang Tikka', category: 'jewellery', subCategory: 'Headpieces', craftType: 'Kundan Jadau', region: 'Jaipur', material: 'Brass & Kundan Stones', price: 1199, mrp: 1599, artisanId: 'art-07', colors: ['Gold', 'Pearl'], occasions: ['Wedding'] },
  { name: 'Thewa Peacock Pendant', category: 'jewellery', subCategory: 'Pendants', craftType: 'Thewa Art', region: 'Pratapgarh', material: '23k Gold Foil & Emerald Glass', price: 5499, mrp: 6899, artisanId: 'art-04', giTagged: true, colors: ['Emerald Green', 'Gold'], occasions: ['Heritage', 'Gifting'], bestseller: true, featured: true },
  { name: 'Thewa Earrings', category: 'jewellery', subCategory: 'Earrings', craftType: 'Thewa Art', region: 'Pratapgarh', material: '23k Gold Foil & Ruby Glass', price: 4299, mrp: 5299, artisanId: 'art-04', giTagged: true, colors: ['Ruby', 'Gold'], occasions: ['Festive', 'Gifting'], newArrival: true },
  { name: 'Lac Bangle Set of 12', category: 'jewellery', subCategory: 'Bangles', craftType: 'Jaipur Lac', region: 'Jaipur', material: 'Natural Lac & Glass Stones', price: 699, mrp: 899, artisanId: 'art-07', colors: ['Kesariya', 'Rani Pink'], occasions: ['Teej', 'Gangaur'], sizes: ['2.4', '2.6', '2.8'], festive: true },
  { name: 'Lac Bridal Chooda', category: 'jewellery', subCategory: 'Bangles', craftType: 'Jaipur Lac', region: 'Jaipur', material: 'Natural Lac & Kundan', price: 1899, mrp: 2499, artisanId: 'art-07', colors: ['Sindoor Red', 'Gold'], occasions: ['Bridal'], sizes: ['2.4', '2.6', '2.8'] },
  { name: 'Silver Tribal Anklet Pair', category: 'jewellery', subCategory: 'Anklets', craftType: 'Tribal Silver', region: 'Jodhpur', material: '92.5 Sterling Silver', price: 4499, mrp: 5499, artisanId: 'art-07', colors: ['Oxidised Silver'], occasions: ['Festive', 'Dailywear'] },
  { name: 'Oxidised Silver Rakhdi Maang Tikka', category: 'jewellery', subCategory: 'Headpieces', craftType: 'Tribal Silver', region: 'Jodhpur', material: 'German Silver & Meena', price: 899, mrp: 1199, artisanId: 'art-07', colors: ['Silver', 'Maroon'], occasions: ['Gangaur', 'Festive'] },
  { name: 'Jadau Cocktail Ring', category: 'jewellery', subCategory: 'Rings', craftType: 'Kundan Jadau', region: 'Jaipur', material: 'Gold-Plated Silver Alloy', price: 1299, mrp: 1699, artisanId: 'art-07', colors: ['Gold', 'Emerald'], occasions: ['Cocktail', 'Wedding'], newArrival: true },
  { name: 'Silver Chandbali Earrings', category: 'jewellery', subCategory: 'Earrings', craftType: 'Tribal Silver', region: 'Jaipur', material: '92.5 Silver & Pearls', price: 2999, mrp: 3699, artisanId: 'art-07', colors: ['Silver', 'Pearl'], occasions: ['Festive'] },
  { name: 'Gold-Plated Aad Necklace', category: 'jewellery', subCategory: 'Necklaces', craftType: 'Rajputana Aad', region: 'Jaipur', material: '22k Gold-Plated Copper', price: 4999, mrp: 6299, artisanId: 'art-07', colors: ['Gold', 'Red'], occasions: ['Wedding', 'Royal'], outOfStock: true },
  { name: 'Pearl Kundan Bracelet', category: 'jewellery', subCategory: 'Bracelets', craftType: 'Kundan Jadau', region: 'Jaipur', material: 'Freshwater Pearl & Brass', price: 1599, mrp: 1999, artisanId: 'art-07', colors: ['Pearl', 'Gold'], occasions: ['Festive', 'Gifting'], giftable: true },
  { name: 'Meenakari Hair Pin Set', category: 'jewellery', subCategory: 'Hair Accessories', craftType: 'Meenakari', region: 'Jaipur', material: 'Brass & Vitreous Enamel', price: 549, mrp: 749, artisanId: 'art-07', colors: ['Peacock', 'Crimson'], occasions: ['Wedding'] },
  { name: 'Temple-Style Haathphool', category: 'jewellery', subCategory: 'Hand Harness', craftType: 'Kundan Jadau', region: 'Jaipur', material: 'Gold-Plated Brass', price: 1799, mrp: 2299, artisanId: 'art-07', colors: ['Gold', 'Red'], occasions: ['Mehendi', 'Wedding'] },
  { name: 'Silver Toe Rings', category: 'jewellery', subCategory: 'Anklets', craftType: 'Tribal Silver', region: 'Jodhpur', material: '92.5 Sterling Silver', price: 499, mrp: 649, artisanId: 'art-07', colors: ['Silver'], occasions: ['Dailywear'] },
  { name: 'Beaded Tribal Necklace', category: 'jewellery', subCategory: 'Necklaces', craftType: 'Banjara Craft', region: 'Barmer', material: 'Glass Beads & Coin Brass', price: 999, mrp: 1299, artisanId: 'art-12', colors: ['Turquoise', 'Crimson'], occasions: ['Boho', 'Travel'], newArrival: true },

  // 4. Footwear and Leather (17)
  { name: 'Embroidered Mojari for Women', category: 'footwear-leather', subCategory: 'Mojari', craftType: 'Jodhpuri Mojari', region: 'Jodhpur', material: 'Camel Leather & Silk Thread', price: 1699, mrp: 2199, artisanId: 'art-08', colors: ['Rani Pink', 'Gold'], occasions: ['Festive', 'Wedding'], sizes: ['UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8'], bestseller: true, featured: true },
  { name: "Men's Jodhpuri Leather Mojari", category: 'footwear-leather', subCategory: 'Mojari', craftType: 'Jodhpuri Mojari', region: 'Jodhpur', material: 'Vegetable-Tanned Leather', price: 1999, mrp: 2499, artisanId: 'art-08', colors: ['Tan', 'Maroon'], occasions: ['Wedding', 'Festive'], sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10'], bestseller: true },
  { name: 'Kids Mojari', category: 'footwear-leather', subCategory: 'Kidswear', craftType: 'Jodhpuri Mojari', region: 'Jodhpur', material: 'Soft Cushioned Leather', price: 899, mrp: 1199, artisanId: 'art-08', colors: ['Kesariya', 'Gold'], occasions: ['Festive'], sizes: ['K 8', 'K 10', 'K 12'] },
  { name: 'Camel Leather Zari Jutti', category: 'footwear-leather', subCategory: 'Jutti', craftType: 'Zari Embroidery', region: 'Jodhpur', material: 'Camel Leather & Metallic Zari', price: 2199, mrp: 2799, artisanId: 'art-08', colors: ['Sand Gold', 'Ivory'], occasions: ['Bridal', 'Festive'], sizes: ['UK 4', 'UK 5', 'UK 6', 'UK 7'], newArrival: true },
  { name: 'Bridal Kundan Mojari', category: 'footwear-leather', subCategory: 'Bridal Footwear', craftType: 'Kundan Mojari', region: 'Jaipur', material: 'Velvet, Leather & Kundan', price: 2899, mrp: 3599, artisanId: 'art-08', colors: ['Sindoor Red', 'Gold'], occasions: ['Bridal'], sizes: ['UK 4', 'UK 5', 'UK 6', 'UK 7'], festive: true },
  { name: 'Leather Potli Bag', category: 'footwear-leather', subCategory: 'Bags', craftType: 'Zari Leathercraft', region: 'Jaipur', material: 'Supple Goat Leather & Silk', price: 1499, mrp: 1899, artisanId: 'art-08', colors: ['Maroon', 'Gold'], occasions: ['Wedding', 'Gifting'], giftable: true },
  { name: 'Camel Leather Tote', category: 'footwear-leather', subCategory: 'Bags', craftType: 'Tooled Camel Leather', region: 'Bikaner', material: 'Full-Grain Camel Leather', price: 3899, mrp: 4899, artisanId: 'art-08', colors: ['Cognac Tan'], occasions: ['Work', 'Travel'], featured: true },
  { name: 'Embroidered Sling Bag', category: 'footwear-leather', subCategory: 'Bags', craftType: 'Barmer Embroidery', region: 'Barmer', material: 'Leather & Cotton Patchwork', price: 1599, mrp: 1999, artisanId: 'art-12', colors: ['Multi', 'Maroon'], occasions: ['Travel', 'Casual'], newArrival: true },
  { name: 'Mirror-Work Clutch', category: 'footwear-leather', subCategory: 'Clutches', craftType: 'Barmer Mirror-Work', region: 'Barmer', material: 'Raw Silk & Shisha Mirrors', price: 1199, mrp: 1499, artisanId: 'art-12', colors: ['Peacock', 'Gold'], occasions: ['Sangeet', 'Festive'] },
  { name: 'Leather Passport Holder', category: 'footwear-leather', subCategory: 'Travel Goods', craftType: 'Embossed Leather', region: 'Bikaner', material: 'Camel Leather', price: 899, mrp: 1199, artisanId: 'art-08', colors: ['Tan', 'Indigo'], occasions: ['Travel', 'Gifting'], giftable: true },
  { name: 'Camel Leather Bifold Wallet', category: 'footwear-leather', subCategory: 'Wallets', craftType: 'Tooled Camel Leather', region: 'Bikaner', material: 'Full-Grain Camel Leather', price: 1099, mrp: 1399, artisanId: 'art-08', colors: ['Chestnut', 'Espresso'], occasions: ['Everyday', 'Gifting'] },
  { name: 'Block-Embossed Leather Belt', category: 'footwear-leather', subCategory: 'Belts', craftType: 'Embossed Leather', region: 'Jodhpur', material: 'Buffalo & Camel Leather', price: 999, mrp: 1299, artisanId: 'art-08', colors: ['Tan', 'Dark Brown'], occasions: ['Casual', 'Formal'], sizes: ['30', '32', '34', '36'] },
  { name: 'Leather Laptop Sleeve', category: 'footwear-leather', subCategory: 'Tech Accessories', craftType: 'Tooled Camel Leather', region: 'Bikaner', material: 'Camel Leather & Felt', price: 2499, mrp: 2999, artisanId: 'art-08', colors: ['Cognac'], occasions: ['Work', 'Corporate'], outOfStock: true },
  { name: 'Brass-Buckle Belt', category: 'footwear-leather', subCategory: 'Belts', craftType: 'Cast Brass & Leather', region: 'Jodhpur', material: 'Vegetable-Tanned Leather', price: 1199, mrp: 1499, artisanId: 'art-08', colors: ['Black', 'Brass'], occasions: ['Casual'] },
  { name: 'Banjara Pouch Set', category: 'footwear-leather', subCategory: 'Pouches', craftType: 'Banjara Craft', region: 'Barmer', material: 'Cotton, Shells & Leather Trim', price: 799, mrp: 999, artisanId: 'art-12', colors: ['Rust', 'Indigo'], occasions: ['Travel', 'Gifting'], giftable: true },
  { name: 'Leather Journal Cover', category: 'footwear-leather', subCategory: 'Stationery', craftType: 'Embossed Leather', region: 'Jaipur', material: 'Camel Leather & Handmade Paper', price: 849, mrp: 1099, artisanId: 'art-08', colors: ['Saddle Tan'], occasions: ['Work', 'Gifting'], giftable: true },
  { name: 'Jute Mirror-Work Shoulder Bag', category: 'footwear-leather', subCategory: 'Bags', craftType: 'Barmer Mirror-Work', region: 'Barmer', material: 'Woven Jute & Leather Straps', price: 1399, mrp: 1799, artisanId: 'art-12', colors: ['Sand', 'Crimson'], occasions: ['Resort', 'Casual'] },

  // 5. Art, Decor and Collectibles (18)
  { name: 'Phad Painting, Pabuji ki Phad (Small)', category: 'art-decor', subCategory: 'Paintings', craftType: 'Phad Scroll Art', region: 'Shahpura', material: 'Mineral Pigments on Khadi', price: 2999, mrp: 3699, artisanId: 'art-06', colors: ['Sindoor Red', 'Ochre'], occasions: ['Home Decor'], bestseller: true },
  { name: 'Phad Painting (Medium)', category: 'art-decor', subCategory: 'Paintings', craftType: 'Phad Scroll Art', region: 'Shahpura', material: 'Mineral Pigments on Khadi', price: 6499, mrp: 7999, artisanId: 'art-06', colors: ['Crimson', 'Turmeric'], occasions: ['Collectible'] },
  { name: 'Miniature Painting, Rajput Court Scene', category: 'art-decor', subCategory: 'Paintings', craftType: 'Rajput Miniature', region: 'Kishangarh', material: 'Wasli Paper & Natural Stone Ink', price: 4999, mrp: 6299, artisanId: 'art-11', colors: ['Ivory', 'Gold'], occasions: ['Collectible'] },
  { name: 'Miniature Painting, Elephant Procession', category: 'art-decor', subCategory: 'Paintings', craftType: 'Rajput Miniature', region: 'Kishangarh', material: 'Wasli Paper & Gold Leaf', price: 5499, mrp: 6899, artisanId: 'art-11', colors: ['Gold', 'Indigo'], occasions: ['Collectible'], newArrival: true },
  { name: 'Pichwai Painting, Lotus Pond', category: 'art-decor', subCategory: 'Paintings', craftType: 'Pichwai Art', region: 'Nathdwara', material: 'Natural Pigments on Cotton', price: 8999, mrp: 10999, artisanId: 'art-11', colors: ['Peacock Green', 'Pink'], occasions: ['Luxury Decor'], featured: true },
  { name: 'Blue Pottery Vase', category: 'art-decor', subCategory: 'Blue Pottery', craftType: 'Jaipur Blue Pottery', region: 'Jaipur', material: 'Quartz Stoneware & Cobalt Glaze', price: 1699, mrp: 2199, artisanId: 'art-05', giTagged: true, colors: ['Cobalt Blue', 'Turquoise'], occasions: ['Home Decor', 'Gifting'], bestseller: true, featured: true },
  { name: 'Blue Pottery Dinner Plate Set of 4', category: 'art-decor', subCategory: 'Blue Pottery', craftType: 'Jaipur Blue Pottery', region: 'Jaipur', material: 'Lead-Free Glazed Quartz', price: 2499, mrp: 3199, artisanId: 'art-05', giTagged: true, colors: ['Cobalt Blue', 'Ivory'], occasions: ['Dining', 'Gifting'] },
  { name: 'Blue Pottery Coaster Set', category: 'art-decor', subCategory: 'Blue Pottery', craftType: 'Jaipur Blue Pottery', region: 'Jaipur', material: 'Glazed Quartz & Brass Rim', price: 699, mrp: 899, artisanId: 'art-05', giTagged: true, colors: ['Turquoise', 'Cobalt'], occasions: ['Gifting'], giftable: true },
  { name: 'Blue Pottery Soap Dish and Tray', category: 'art-decor', subCategory: 'Blue Pottery', craftType: 'Jaipur Blue Pottery', region: 'Jaipur', material: 'Glazed Quartz Stoneware', price: 849, mrp: 1099, artisanId: 'art-05', giTagged: true, colors: ['Cobalt', 'White'], occasions: ['Bath Decor'] },
  { name: 'Kathputli Puppet Pair (Raja-Rani)', category: 'art-decor', subCategory: 'Folk Craft', craftType: 'Kathputli', region: 'Jaipur', material: 'Mango Wood & Brocade Silk', price: 799, mrp: 999, artisanId: 'art-10', colors: ['Crimson', 'Gold'], occasions: ['Decor', 'Gifting'], giftable: true },
  { name: 'Wooden Kathputli Wall Set', category: 'art-decor', subCategory: 'Folk Craft', craftType: 'Kathputli', region: 'Jaipur', material: 'Carved Wood & Cotton', price: 1299, mrp: 1599, artisanId: 'art-10', colors: ['Kesariya', 'Peacock'], occasions: ['Decor'] },
  { name: 'Brass Peacock Figurine', category: 'art-decor', subCategory: 'Metalcraft', craftType: 'Jaipur Brassware', region: 'Jaipur', material: 'Solid Sand-Cast Brass', price: 2299, mrp: 2899, artisanId: 'art-10', colors: ['Antique Brass'], occasions: ['Home Decor', 'Festive'], featured: true, newArrival: true },
  { name: 'Marble Inlay Coaster Set', category: 'art-decor', subCategory: 'Stonecraft', craftType: 'Makrana Marble Inlay', region: 'Jaipur', material: 'Makrana Marble & Semi-Precious Stone', price: 1499, mrp: 1899, artisanId: 'art-05', colors: ['White Marble', 'Lapis'], occasions: ['Gifting'] },
  { name: 'Jharokha Wooden Wall Frame', category: 'art-decor', subCategory: 'Woodcraft', craftType: 'Shekhawati Woodwork', region: 'Churu', material: 'Seasoned Sheesham Wood', price: 3299, mrp: 4199, artisanId: 'art-10', colors: ['Teak Brown'], occasions: ['Home Decor'], newArrival: true },
  { name: 'Mirror-Work Wall Hanging', category: 'art-decor', subCategory: 'Textiles Decor', craftType: 'Barmer Mirror-Work', region: 'Barmer', material: 'Cotton & Glass Shisha', price: 1199, mrp: 1499, artisanId: 'art-12', colors: ['Maroon', 'Gold'], occasions: ['Home Decor'] },
  { name: 'Terracotta Molela Plate', category: 'art-decor', subCategory: 'Terracotta', craftType: 'Molela Clay Plaque', region: 'Molela', material: 'Hand-Moulded River Clay', price: 1899, mrp: 2399, artisanId: 'art-05', colors: ['Terracotta', 'Ivory'], occasions: ['Collectible'] },
  { name: 'Hand-Painted Camel Leather Lampshade', category: 'art-decor', subCategory: 'Lighting', craftType: 'Usta & Leather Art', region: 'Bikaner', material: 'Translucent Camel Parchment', price: 3699, mrp: 4599, artisanId: 'art-08', colors: ['Amber Glow', 'Gold'], occasions: ['Lighting'] },
  { name: 'Brass Wall Plate', category: 'art-decor', subCategory: 'Metalcraft', craftType: 'Engraved Brass', region: 'Jaipur', material: 'Etched Brass Sheet', price: 2199, mrp: 2799, artisanId: 'art-10', colors: ['Gold Brass'], occasions: ['Home Decor'] },

  // 6. Gifting and Festive (17)
  { name: 'Classic Diwali Hamper', category: 'gifting-festive', subCategory: 'Festival Hampers', craftType: 'Curated Craft Box', region: 'Jaipur', material: 'Brass, Terracotta & Soy Wax', price: 1999, mrp: 2499, artisanId: 'art-10', colors: ['Marigold', 'Gold'], occasions: ['Diwali', 'Gifting'], bestseller: true, festive: true, giftable: true },
  { name: 'Luxury Diwali Hamper', category: 'gifting-festive', subCategory: 'Festival Hampers', craftType: 'Curated Craft Box', region: 'Jaipur', material: 'Blue Pottery, Brass & Block-Print Linen', price: 4499, mrp: 5499, artisanId: 'art-05', colors: ['Crimson', 'Gold'], occasions: ['Diwali', 'Corporate'], featured: true, festive: true, giftable: true },
  { name: 'Brass Diya Set of 6', category: 'gifting-festive', subCategory: 'Puja & Lamps', craftType: 'Sand-Cast Brass', region: 'Jaipur', material: 'Solid Brass', price: 899, mrp: 1199, artisanId: 'art-10', colors: ['Brass Gold'], occasions: ['Diwali', 'Puja'], festive: true },
  { name: 'Brass Puja Thali Set', category: 'gifting-festive', subCategory: 'Puja & Lamps', craftType: 'Meenakari Brass', region: 'Jaipur', material: 'Etched Brass', price: 1699, mrp: 2199, artisanId: 'art-07', colors: ['Gold', 'Red'], occasions: ['Diwali', 'Wedding'], festive: true },
  { name: 'Kulhad Chai Set of 6', category: 'gifting-festive', subCategory: 'Chaiware', craftType: 'Jaipur Terracotta', region: 'Jaipur', material: 'Fired Terracotta & Glazed Rim', price: 599, mrp: 799, artisanId: 'art-05', colors: ['Terracotta', 'Turquoise'], occasions: ['Everyday', 'Gifting'], bestseller: true, giftable: true },
  { name: 'Kulhad Gift Box', category: 'gifting-festive', subCategory: 'Chaiware', craftType: 'Glazed Terracotta', region: 'Jaipur', material: 'Terracotta & Brass Tray', price: 1299, mrp: 1699, artisanId: 'art-05', colors: ['Terracotta', 'Gold'], occasions: ['Housewarming', 'Gifting'], giftable: true },
  { name: 'Wedding Return-Gift Potli Box', category: 'gifting-festive', subCategory: 'Wedding Favours', craftType: 'Gota Patti Brocade', region: 'Jaipur', material: 'Silk Brocade & Lac Bangles', price: 1499, mrp: 1899, artisanId: 'art-07', colors: ['Rani Pink', 'Gold'], occasions: ['Wedding'], festive: true, giftable: true },
  { name: 'Bridal Trousseau Box', category: 'gifting-festive', subCategory: 'Wedding Favours', craftType: 'Velvet Zardozi Box', region: 'Jaipur', material: 'Silk Velvet & Brass Clasp', price: 2999, mrp: 3799, artisanId: 'art-07', colors: ['Maroon', 'Gold'], occasions: ['Bridal'], festive: true },
  { name: 'Corporate Gift Box, Starter', category: 'gifting-festive', subCategory: 'Corporate Gifting', craftType: 'Block-Print Stationery', region: 'Sanganer', material: 'Cotton Paper & Brass Pen', price: 1199, mrp: 1499, artisanId: 'art-01', colors: ['Indigo', 'Kraft'], occasions: ['Corporate'], giftable: true },
  { name: 'Corporate Gift Box, Premium', category: 'gifting-festive', subCategory: 'Corporate Gifting', craftType: 'Heritage Executive Set', region: 'Jaipur', material: 'Camel Leather, Brass & Blue Pottery', price: 3299, mrp: 3999, artisanId: 'art-08', colors: ['Tan', 'Cobalt'], occasions: ['Corporate'], giftable: true },
  { name: 'Rakhi Gift Set', category: 'gifting-festive', subCategory: 'Festival Hampers', craftType: 'Gota & Meenakari', region: 'Jaipur', material: 'Silk Thread, Meena & Brass', price: 799, mrp: 999, artisanId: 'art-07', colors: ['Kesariya', 'Maroon'], occasions: ['Rakhi'], festive: true },
  { name: 'Spice and Tea Gift Set', category: 'gifting-festive', subCategory: 'Gourmet Gifts', craftType: 'Rajasthani Tea Chest', region: 'Jaipur', material: 'Sheesham Box & Brass Spoon', price: 1399, mrp: 1799, artisanId: 'art-10', colors: ['Teak', 'Gold'], occasions: ['Gifting'], giftable: true },
  { name: 'Block-Print Notebook Set', category: 'gifting-festive', subCategory: 'Stationery', craftType: 'Sanganeri Cotton Paper', region: 'Sanganer', material: 'Recycled Cotton Kagzi Paper', price: 499, mrp: 649, artisanId: 'art-01', giTagged: true, colors: ['Ivory', 'Pink'], occasions: ['Stationery', 'Gifting'], newArrival: true, giftable: true },
  { name: 'Rajasthani Rose Candle Set', category: 'gifting-festive', subCategory: 'Candles', craftType: 'Pushkar Rose & Brass', region: 'Pushkar', material: 'Beeswax, Soy & Damask Rose Oil', price: 899, mrp: 1149, artisanId: 'art-10', colors: ['Rose', 'Brass'], occasions: ['Festive', 'Self-Care'], newArrival: true, giftable: true },
  { name: 'Marigold Scented Candle', category: 'gifting-festive', subCategory: 'Candles', craftType: 'Hand-Poured Urli Candle', region: 'Jaipur', material: 'Soy Wax in Hammered Brass Urli', price: 699, mrp: 899, artisanId: 'art-10', colors: ['Marigold', 'Brass'], occasions: ['Diwali', 'Gifting'], festive: true },
  { name: 'Brass Ghanti Set', category: 'gifting-festive', subCategory: 'Puja & Lamps', craftType: 'Temple Bell Brass', region: 'Jaipur', material: 'Solid Bell Metal', price: 949, mrp: 1249, artisanId: 'art-10', colors: ['Brass'], occasions: ['Puja', 'Home'] },
  { name: 'Bandhani Gift Pouch Set', category: 'gifting-festive', subCategory: 'Packaging', craftType: 'Bandhani Silk', region: 'Sikar', material: 'Art Silk & Zari Drawstring', price: 449, mrp: 599, artisanId: 'art-03', colors: ['Multi'], occasions: ['Wedding', 'Gifting'], giftable: true },
];

const CAT_CODE: Record<CategorySlug, string> = {
  'textiles-apparel': 'TXT',
  'home-furnishing': 'HOM',
  'jewellery': 'JWL',
  'footwear-leather': 'FTW',
  'art-decor': 'ART',
  'gifting-festive': 'GFT',
};

const UNIQUE_PRODUCT_PHOTO_MAP: Record<string, string> = {
  // 1. Textiles & Apparel (20)
  'sanganeri-floral-cotton-kurta': GENERATED_IMAGES.prodSanganeriKurta,
  'bagru-indigo-dabu-kurta-set': GENERATED_IMAGES.prodBagruKurtaSet,
  'jaipuri-block-print-anarkali': GENERATED_IMAGES.prodBlockAnarkali,
  'bandhani-silk-dupatta-in-rani-pink': '/src/assets/images/prod_bandhani_dupatta_1794556629284.jpg',
  'leheriya-chiffon-dupatta': GENERATED_IMAGES.prodLeheriyaDupatta,
  'kota-doria-saree-in-marigold': GENERATED_IMAGES.prodKotaDoriaSaree,
  'mulmul-block-print-saree': GENERATED_IMAGES.prodMulmulSaree,
  'bagru-hand-block-palazzo': '/src/assets/images/prod_bagru_palazzo_1794555325996.jpg',
  'men-s-sanganeri-nehru-jacket': '/src/assets/images/prod_nehru_jacket_1794555327026.jpg',
  'men-s-bagru-cotton-kurta': GENERATED_IMAGES.prodMensBagruKurta,
  'block-print-kids-frock': GENERATED_IMAGES.prodKidsFrock,
  'kids-bandhani-kurta-set': '/src/assets/images/prod_kids_bandhani_set_1794555327465.jpg',
  'leheriya-georgette-saree': '/src/assets/images/prod_leheriya_saree_1794555326124.jpg',
  'bandhani-cotton-co-ord-set': GENERATED_IMAGES.prodBandhaniCoord,
  'hand-block-print-scarf': '/src/assets/images/prod_block_scarf_1794555328130.jpg',
  'jaipuri-cotton-shirt-for-men': '/src/assets/images/prod_mens_jaipuri_shirt_1794555328270.jpg',
  'bagru-wrap-skirt': '/src/assets/images/prod_bagru_wrap_skirt_1794555329351.jpg',
  'dabu-mud-resist-tunic': '/src/assets/images/prod_dabu_tunic_1794555327315.jpg',
  'kota-doria-dupatta': '/src/assets/images/prod_kota_dupatta_1794555329882.jpg',
  'block-print-cotton-stole': '/src/assets/images/prod_block_stole_1794555329824.jpg',

  // 2. Home Furnishing (18)
  'sanganeri-block-print-double-bedsheet-set': GENERATED_IMAGES.prodSanganeriBedsheet,
  'bagru-king-bedsheet-set': '/src/assets/images/prod_bagru_king_bedsheet_1794555330631.jpg',
  'jaipuri-razai-quilt-double': '/src/assets/images/prod_razai_double_1794555330173.jpg',
  'jaipuri-razai-quilt-single': '/src/assets/images/prod_razai_single_1794555331037.jpg',
  'hand-block-cushion-cover-set-of-5': '/src/assets/images/prod_block_cushions_5_1794555330635.jpg',
  'bandhani-cushion-cover-set-of-2': '/src/assets/images/prod_bandhani_cushions_2_1794555332152.jpg',
  'cotton-dhurrie-4x6-in-geometric-weave': '/src/assets/images/prod_cotton_dhurrie_1794555332297.jpg',
  'jute-cotton-runner': '/src/assets/images/prod_jute_runner_1794555332089.jpg',
  'hand-knotted-wool-rug-5x8': '/src/assets/images/prod_handknotted_wool_rug_1794555332501.jpg',
  'block-print-table-runner': '/src/assets/images/prod_block_table_runner_1794555333181.jpg',
  'marigold-napkin-set-of-6': '/src/assets/images/prod_marigold_napkins_6_1794555333029.jpg',
  'block-print-tablecloth-for-6': '/src/assets/images/prod_block_tablecloth_1794555334744.jpg',
  'block-print-curtains-pair': '/src/assets/images/prod_block_curtains_pair_1794555334525.jpg',
  'leheriya-door-curtain': '/src/assets/images/prod_leheriya_curtain_1794555335273.jpg',
  'block-print-cotton-throw': '/src/assets/images/prod_bagru_cotton_throw_1794555335564.jpg',
  'block-print-wall-tapestry': '/src/assets/images/prod_block_tapestry_1794555359231.jpg',
  'pouf-cover-in-bagru-print': '/src/assets/images/prod_bagru_pouf_1794555359896.jpg',
  'mirror-work-door-toran': '/src/assets/images/prod_mirror_toran_1794555359561.jpg',

  // 3. Jewellery (18)
  'meenakari-peacock-jhumka': '/src/assets/images/prod_meenakari_jhumka_1794555360263.jpg',
  'meenakari-choker-set': '/src/assets/images/prod_meenakari_choker_1794555360990.jpg',
  'kundan-polki-necklace-set': '/src/assets/images/prod_kundan_polki_set_1794555361431.jpg',
  'kundan-maang-tikka': '/src/assets/images/prod_kundan_maang_tikka_1794555362738.jpg',
  'thewa-peacock-pendant': '/src/assets/images/prod_thewa_pendant_1794555362742.jpg',
  'thewa-earrings': '/src/assets/images/prod_thewa_earrings_1794555362827.jpg',
  'lac-bangle-set-of-12': '/src/assets/images/prod_lac_bangles_12_1794555363300.jpg',
  'lac-bridal-chooda': '/src/assets/images/prod_lac_chooda_1794555363364.jpg',
  'silver-tribal-anklet-pair': '/src/assets/images/prod_silver_anklets_1794555364849.jpg',
  'oxidised-silver-rakhdi-maang-tikka': '/src/assets/images/prod_silver_rakhdi_1794555363650.jpg',
  'jadau-cocktail-ring': '/src/assets/images/prod_jadau_ring_1794555365013.jpg',
  'silver-chandbali-earrings': '/src/assets/images/prod_silver_chandbali_1794555364663.jpg',
  'gold-plated-aad-necklace': '/src/assets/images/prod_aad_necklace_1794555364961.jpg',
  'pearl-kundan-bracelet': '/src/assets/images/prod_pearl_bracelet_1794555366094.jpg',
  'meenakari-hair-pin-set': '/src/assets/images/prod_meenakari_hairpins_1794555366216.jpg',
  'temple-style-haathphool': '/src/assets/images/prod_haathphool_1794555366853.jpg',
  'silver-toe-rings': '/src/assets/images/prod_silver_toerings_1794555367963.jpg',
  'beaded-tribal-necklace': '/src/assets/images/prod_tribal_necklace_1794555366469.jpg',

  // 4. Footwear & Leather (17)
  'embroidered-mojari-for-women': '/src/assets/images/prod_womens_mojari_1794555367858.jpg',
  'men-s-jodhpuri-leather-mojari': '/src/assets/images/prod_mens_mojari_1794555368295.jpg',
  'kids-mojari': '/src/assets/images/prod_kids_mojari_1794555369000.jpg',
  'camel-leather-zari-jutti': '/src/assets/images/prod_zari_jutti_1794555389761.jpg',
  'bridal-kundan-mojari': '/src/assets/images/prod_kundan_mojari_1794555389432.jpg',
  'leather-potli-bag': '/src/assets/images/prod_leather_potli_1794555391000.jpg',
  'camel-leather-tote': '/src/assets/images/prod_camel_tote_1794555391044.jpg',
  'embroidered-sling-bag': '/src/assets/images/prod_embroidered_sling_1794555391000.jpg',
  'mirror-work-clutch': '/src/assets/images/prod_mirror_clutch_1794555391623.jpg',
  'leather-passport-holder': '/src/assets/images/prod_passport_holder_1794555392391.jpg',
  'camel-leather-bifold-wallet': '/src/assets/images/prod_bifold_wallet_1794555391741.jpg',
  'block-embossed-leather-belt': '/src/assets/images/prod_embossed_belt_1794555392449.jpg',
  'leather-laptop-sleeve': '/src/assets/images/prod_laptop_sleeve_1794555393223.jpg',
  'brass-buckle-belt': '/src/assets/images/prod_brass_belt_1794555394184.jpg',
  'banjara-pouch-set': '/src/assets/images/prod_banjara_pouches_1794555394088.jpg',
  'leather-journal-cover': '/src/assets/images/prod_leather_journal_1794555394660.jpg',
  'jute-mirror-work-shoulder-bag': '/src/assets/images/prod_jute_shoulder_bag_1794555394888.jpg',

  // 5. Art, Decor & Collectibles (18)
  'phad-painting-pabuji-ki-phad-small': '/src/assets/images/prod_phad_small_1794555395982.jpg',
  'phad-painting-medium': '/src/assets/images/prod_phad_medium_1794555396488.jpg',
  'miniature-painting-rajput-court-scene': '/src/assets/images/prod_miniature_court_1794555397302.jpg',
  'miniature-painting-elephant-procession': '/src/assets/images/prod_miniature_elephant_1794555397332.jpg',
  'pichwai-painting-lotus-pond': '/src/assets/images/prod_pichwai_lotus_1794555397288.jpg',
  'blue-pottery-vase': '/src/assets/images/prod_blue_pottery_vase_1794555397544.jpg',
  'blue-pottery-dinner-plate-set-of-4': '/src/assets/images/prod_blue_pottery_plates_1794555397496.jpg',
  'blue-pottery-coaster-set': '/src/assets/images/prod_blue_pottery_coasters_1794555398474.jpg',
  'blue-pottery-soap-dish-and-tray': '/src/assets/images/prod_blue_pottery_soaptray_1794555397910.jpg',
  'kathputli-puppet-pair-raja-rani': '/src/assets/images/prod_kathputli_pair_1794555399526.jpg',
  'wooden-kathputli-wall-set': '/src/assets/images/prod_kathputli_wall_set_1794555417971.jpg',
  'brass-peacock-figurine': '/src/assets/images/prod_brass_peacock_1794556629291.jpg',
  'marble-inlay-coaster-set': '/src/assets/images/prod_marble_coasters_1794555418362.jpg',
  'jharokha-wooden-wall-frame': '/src/assets/images/prod_jharokha_frame_1794555417459.jpg',
  'mirror-work-wall-hanging': '/src/assets/images/prod_mirror_wall_hanging_1794555418993.jpg',
  'terracotta-molela-plate': '/src/assets/images/prod_molela_terracotta_1794555420139.jpg',
  'hand-painted-camel-leather-lampshade': '/src/assets/images/prod_leather_lampshade_1794555420365.jpg',
  'brass-wall-plate': '/src/assets/images/prod_brass_wall_plate_1794555420708.jpg',

  // 6. Gifting & Festive (17)
  'classic-diwali-hamper': '/src/assets/images/prod_classic_diwali_hamper_1794555421452.jpg',
  'luxury-diwali-hamper': '/src/assets/images/prod_luxury_diwali_hamper_1794555421428.jpg',
  'brass-diya-set-of-6': '/src/assets/images/prod_brass_diya_6_1794555421684.jpg',
  'brass-puja-thali-set': '/src/assets/images/prod_brass_puja_thali_1794555421944.jpg',
  'kulhad-chai-set-of-6': '/src/assets/images/prod_kulhad_chai_6_1794555423236.jpg',
  'kulhad-gift-box': '/src/assets/images/prod_kulhad_gift_box_1794555423722.jpg',
  'wedding-return-gift-potli-box': '/src/assets/images/prod_wedding_potli_box_1794555423779.jpg',
  'bridal-trousseau-box': '/src/assets/images/prod_bridal_trousseau_box_1794555424611.jpg',
  'corporate-gift-box-starter': '/src/assets/images/prod_corp_box_starter_1794555424746.jpg',
  'corporate-gift-box-premium': '/src/assets/images/prod_corp_box_premium_1794555424626.jpg',
  'rakhi-gift-set': '/src/assets/images/prod_rakhi_gift_set_1794555425494.jpg',
  'spice-and-tea-gift-set': '/src/assets/images/prod_spice_tea_set_1794555426733.jpg',
  'block-print-notebook-set': '/src/assets/images/prod_notebook_set_1794555426357.jpg',
  'rajasthani-rose-candle-set': '/src/assets/images/prod_rose_candle_set_1794555427638.jpg',
  'marigold-scented-candle': '/src/assets/images/prod_marigold_candle_1794555426494.jpg',
  'brass-ghanti-set': '/src/assets/images/prod_brass_ghanti_1794555428537.jpg',
  'bandhani-gift-pouch-set': '/src/assets/images/prod_bandhani_pouches_1794555427275.jpg',
};

export function resolveCraftImages(
  _spec: { name: string; category: CategorySlug; subCategory?: string; craftType: string },
  slug: string
): string[] {
  const uniquePhoto = UNIQUE_PRODUCT_PHOTO_MAP[slug];
  const plate1 = `/api/craft-art/${slug}/1.svg`;
  const plate2 = `/api/craft-art/${slug}/2.svg`;
  const plate3 = `/api/craft-art/${slug}/3.svg`;
  const plate4 = `/api/craft-art/${slug}/4.svg`;

  if (uniquePhoto) {
    return [uniquePhoto, plate2, plate3, plate4];
  }
  return [plate1, plate2, plate3, plate4];
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function buildSeedProducts(): Product[] {
  return RAW_PRODUCTS.map((spec, index) => {
    const slug = slugify(spec.name);
    const craftCode = spec.craftType
      .replace(/[^A-Za-z]/g, '')
      .slice(0, 3)
      .toUpperCase();
    const num = String(index + 1).padStart(3, '0');
    const sku = `RH-${CAT_CODE[spec.category]}-${craftCode}-${num}`;

    const sizes = spec.sizes ?? ['Standard'];
    const variants = sizes.map((sz, vIdx) => ({
      id: `${sku}-V${vIdx + 1}`,
      label: sz,
      color: spec.colors[vIdx % spec.colors.length] ?? spec.colors[0],
      colorHex:
        spec.colors[0]?.toLowerCase().includes('indigo')
          ? '#1F3A93'
          : spec.colors[0]?.toLowerCase().includes('peacock') || spec.colors[0]?.toLowerCase().includes('emerald')
            ? '#0F7B6C'
            : spec.colors[0]?.toLowerCase().includes('marigold') || spec.colors[0]?.toLowerCase().includes('kesariya')
              ? '#F28C1B'
              : spec.colors[0]?.toLowerCase().includes('gold') || spec.colors[0]?.toLowerCase().includes('brass')
                ? '#C9A227'
                : '#B3123F',
      stock: spec.outOfStock ? 0 : ((index + vIdx) % 7 === 0 ? 3 : 14 + ((index * 3 + vIdx) % 24)),
      skuSuffix: sz.replace(/\s+/g, '').toUpperCase(),
    }));

    const images = resolveCraftImages(spec, slug);

    const b2bTiers = [
      { minQty: 10, discountPercent: 12, unitPriceInr: Math.round(spec.price * 0.88) },
      { minQty: 25, discountPercent: 22, unitPriceInr: Math.round(spec.price * 0.78) },
      { minQty: 50, discountPercent: 32, unitPriceInr: Math.round(spec.price * 0.68) },
      { minQty: 100, discountPercent: 40, unitPriceInr: Math.round(spec.price * 0.6) },
    ];

    const artisan = ARTISANS.find((a) => a.id === spec.artisanId) ?? ARTISANS[0];
    const shortDescription = `Handcrafted in ${spec.region}, Rajasthan using authentic ${spec.craftType} on ${spec.material.toLowerCase()}.`;
    const longDescription = `Born in the workshops of ${spec.region}, this ${spec.name} celebrates centuries of living Rajasthani skill. Crafted by ${artisan.name} and the ${artisan.coOperative}, each piece undergoes patient handwork over ${6 + (index % 18)} hours before sun-curing and hand-finishing. Subtle organic variations in motif and dye depth are the signature of genuine human craftsmanship—no two pieces leave the haveli identical.`;

    const hsnCode =
      spec.category === 'textiles-apparel'
        ? '6204'
        : spec.category === 'home-furnishing'
          ? '6304'
          : spec.category === 'jewellery'
            ? '7117'
            : spec.category === 'footwear-leather'
              ? '6403'
              : spec.category === 'art-decor'
                ? '6913'
                : '9505';
    const computedGstRate = getHsnGstRate(
      { category: spec.category, craftType: spec.craftType, hsnCode, price: spec.price },
      spec.price
    );
    const craftLower = spec.craftType.toLowerCase();
    const giClaimId = craftLower.includes('thewa')
      ? 'gi-thewa'
      : craftLower.includes('sanganeri')
        ? 'gi-sanganeri'
        : craftLower.includes('bagru')
          ? 'gi-bagru'
          : craftLower.includes('blue pottery')
            ? 'gi-blue-pottery'
            : craftLower.includes('kota')
              ? 'gi-kota-doria'
              : undefined;

    return {
      id: `prod-${num}`,
      sku,
      slug,
      name: spec.name,
      category: spec.category,
      subCategory: spec.subCategory,
      shortDescription,
      longDescription,
      craftType: spec.craftType,
      region: spec.region,
      material: spec.material,
      careInstructions:
        spec.category === 'textiles-apparel' || spec.category === 'home-furnishing'
          ? 'Gentle cold hand-wash separately with mild detergent. Dry in shade away from harsh afternoon sun.'
          : spec.category === 'jewellery'
            ? 'Wipe gently with a soft dry muslin cloth after wear. Store in the lined cotton pouch away from moisture.'
            : 'Dust gently with a dry soft cloth. Avoid abrasive cleansers or prolonged direct moisture.',
      occasions: spec.occasions,
      colors: spec.colors,
      mrp: spec.mrp,
      price: spec.price,
      gstRate: computedGstRate,
      hsnCode,
      weightGrams: spec.category === 'home-furnishing' ? 950 : spec.category === 'jewellery' ? 120 : 420,
      dimensions: spec.category === 'home-furnishing' ? '220 x 250 cm' : 'Standard Craft Dimensions',
      variants,
      b2bTiers,
      moq: spec.price > 5000 ? 5 : 10,
      casePack: spec.price > 5000 ? 5 : 10,
      leadTimeDays: 10 + (index % 12),
      customisable: true,
      artisanId: spec.artisanId,
      hoursOfWork: 6 + (index % 20),
      giTagged: Boolean(spec.giTagged),
      giClaimId,
      countryOfOrigin: 'India',
      manufacturerName: artisan.coOperative,
      images,
      isBestseller: Boolean(spec.bestseller),
      isCuratedBestseller: Boolean(spec.bestseller),
      isNewArrival: Boolean(spec.newArrival),
      isFeatured: Boolean(spec.featured),
      isFestive: Boolean(spec.festive),
      isGiftable: Boolean(spec.giftable),
      rating: 0,
      reviewCount: 0,
      realRating: 0,
      realReviewCount: 0,
      costBreakdown: {
        artisanShare: 52,
        materials: 22,
        logistics: 14,
        brand: 12,
      },
      isMock: true,
    };
  });
}

const REVIEW_CITIES = ['Jaipur', 'Mumbai', 'Bengaluru', 'New Delhi', 'Udaipur', 'Pune', 'Hyderabad', 'London', 'Singapore', 'Ahmedabad'];
const REVIEW_NAMES = ['Ananya Sharma', 'Vikram Rathore', 'Meera Nair', 'Rohan Kulkarni', 'Priya Singhania', 'Kabir Mehta', 'Nandini Joshi', 'Aarav Patel', 'Divya Bansal', 'Siddharth Jain'];
const REVIEW_SNIPPETS = [
  'Bilkul asli Sanganeri feel! The cotton breathes beautifully even in humid weather.',
  'Gifted this to my mother for Diwali and she loved the craft passport card inside.',
  'Rich natural dyes and super neat stitching. Worth every rupee knowing 52% goes to the artisan.',
  'Arrived packed in reusable muslin cloth with zero plastic. Padharo vibes right out of the box!',
  'Colours are even deeper in person than on screen. Truly heirloom quality.',
];

export function buildSeedReviews(products: Product[]): Review[] {
  const reviews: Review[] = [];
  let counter = 1;
  products.forEach((product, pIdx) => {
    const num = 3 + (pIdx % 2); // 3 to 4 reviews per product -> ~378 reviews total
    for (let i = 0; i < num; i++) {
      reviews.push({
        id: `rev-${String(counter++).padStart(4, '0')}`,
        productId: product.id,
        author: REVIEW_NAMES[(pIdx + i) % REVIEW_NAMES.length],
        city: REVIEW_CITIES[(pIdx * 2 + i) % REVIEW_CITIES.length],
        rating: (pIdx + i) % 5 === 0 ? 4 : 5,
        title: i === 0 ? `Genuine ${product.craftType} craftsmanship` : 'Loved the provenance & finish',
        comment: REVIEW_SNIPPETS[(pIdx + i) % REVIEW_SNIPPETS.length],
        verifiedPurchase: false,
        moderationStatus: 'approved',
        createdAt: new Date(Date.now() - ((pIdx + i) * 86400000 * 2)).toISOString(),
        isMock: true,
      });
    }
  });
  return reviews;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog-01',
    slug: 'sanganer-vs-bagru-how-to-tell-them-apart',
    title: 'Sanganer vs Bagru: How to Tell Two Jaipur Block Prints Apart',
    titleHi: 'सांगानेर बनाम बगरू: दो जयपुर ब्लॉक प्रिंट में अंतर कैसे पहचानें',
    category: 'Craft Stories',
    excerpt: 'Just twenty kilometres apart outside Jaipur, Sanganer and Bagru evolved unmistakably distinct palettes, motifs, and mud-resist alchemy.',
    readingTimeMin: 5,
    author: 'Nandini Rathore · Craft Archivist',
    publishedAt: '2026-10-18',
    coverImage: GENERATED_IMAGES.bagruIndigo,
    sections: [
      {
        heading: 'The Background Tells the First Story',
        body: 'Sanganeri prints are traditionally stamped on crisp white or soft off-white mulmul and cambric, allowing fine delicate poppies, irises, and creepers to bloom cleanly. Bagru, by contrast, embraces deep earthy backgrounds dyed in madder, pomegranate rind, and fermented iron-jaggery black.',
      },
      {
        heading: 'Gadh, Rekh, and Datta Wooden Blocks',
        body: 'Every multi-colour Sanganeri or Bagru textile uses three carved teakwood blocks: the rekh defines the fine outline, the gadh lays down the background tone, and the datta stamps the inner petal fills. In Bagru, artisans also apply Dabu—a paste of black river clay, gum, and wheat chaff—to resist dye before dipping fabric into indigo vats.',
      },
    ],
    relatedSlugs: ['sanganeri-floral-cotton-kurta', 'bagru-indigo-dabu-kurta-set'],
    isMock: true,
  },
  {
    id: 'blog-02',
    slug: 'what-makes-pratapgarh-thewa-special',
    title: 'Inside Pratapgarh: How 23-Karat Gold Fuses Onto Glass in Thewa',
    titleHi: 'प्रतापगढ़ की थेवा कला: कांच पर 23 कैरेट सोने की नक्काशी',
    category: 'Craft Stories',
    excerpt: 'Awarded a Geographical Indication tag in 2014, Thewa remains one of India’s most guarded miniature jewellery traditions.',
    readingTimeMin: 4,
    author: 'Mahendra Soni · Guest Master',
    publishedAt: '2026-10-10',
    coverImage: GENERATED_IMAGES.thewa,
    sections: [
      {
        heading: 'No Glue, Only Heat & Patience',
        body: 'Using a razor-sharp steel stylus called a sooi, artisans pierce paper-thin sheets of pure gold into scenes of royal processions and forest peacocks. The gold fretwork is then laid over molten Belgian emerald or ruby glass so both fuse permanently without adhesive.',
      },
    ],
    relatedSlugs: ['thewa-peacock-pendant', 'thewa-earrings'],
    isMock: true,
  },
  {
    id: 'blog-03',
    slug: 'how-to-wash-natural-block-prints',
    title: 'Chai pe Charcha: Washing Natural-Dyed Block Prints So Colours Last Decades',
    titleHi: 'प्राकृतिक रंगों वाले ब्लॉक प्रिंट की देखभाल कैसे करें',
    category: 'Care Guides',
    excerpt: 'Indigo and madder root are living dyes. Here is the simple three-step Jaipur wash ritual to keep cottons vibrant.',
    readingTimeMin: 3,
    author: 'Rangrez Studio Care Team',
    publishedAt: '2026-09-28',
    coverImage: GENERATED_IMAGES.blogWashCare,
    sections: [
      {
        heading: 'Cold Water & Shade Drying',
        body: 'Always soak new hand-block cottons briefly in cool water for the first wash, using mild pH-neutral soap. Never wring hard or hang under direct noon sun—let desert breezes dry them inside-out in shade.',
      },
    ],
    relatedSlugs: ['sanganeri-block-print-double-bedsheet-set', 'bagru-hand-block-palazzo'],
    isMock: true,
  },
  {
    id: 'blog-04',
    slug: 'rajasthani-festive-gifting-guide',
    title: 'A Modern Haveli Guide to Festive & Corporate Gifting',
    titleHi: 'त्योहार और कॉर्पोरेट उपहारों की राजस्थानी मार्गदर्शिका',
    category: 'Festivals',
    excerpt: 'Replace forgettable plastic hampers with Blue Pottery coasters, brass diyas, Pushkar rose candles, and hand-stamped linen.',
    readingTimeMin: 4,
    author: 'Aditi Shekhawat · Curation Lead',
    publishedAt: '2026-10-25',
    coverImage: GENERATED_IMAGES.blogGiftingBoxes,
    sections: [
      {
        heading: 'Heirlooms Over Disposable Hampers',
        body: 'Thoughtful gifting honors both the recipient and the maker. Pair a hand-cast brass diya with Sanganeri cotton napkins and a provenance card sharing the artisan village.',
      },
    ],
    relatedSlugs: ['classic-diwali-hamper', 'luxury-diwali-hamper', 'kulhad-chai-set-of-6'],
    isMock: true,
  },
  {
    id: 'blog-05',
    slug: 'jaipur-blue-pottery-quartz-mystery',
    title: 'Zero Clay, Pure Quartz: The Science of Jaipur Blue Pottery',
    titleHi: 'बिना मिट्टी की कला: जयपुर ब्लू पॉटरी का रहस्य',
    category: 'Home Inspiration',
    excerpt: 'Why authentic Jaipur Blue Pottery never cracks in summer heat and glows with unmistakable cobalt and turquoise.',
    readingTimeMin: 4,
    author: 'Gopal Kumhar · Kot Jewar',
    publishedAt: '2026-09-14',
    coverImage: GENERATED_IMAGES.blogQuartzPottery,
    sections: [
      {
        heading: 'A Dough of Stone, Glass & Gum',
        body: 'Unlike conventional earthenware, Blue Pottery is shaped from powdered quartz stone, raw glaze, multani mitti, and katira gum—making each vase cool to the touch and luminous beneath lead-free mineral glaze.',
      },
    ],
    relatedSlugs: ['blue-pottery-vase', 'blue-pottery-dinner-plate-set-of-4'],
    isMock: true,
  },
  {
    id: 'blog-06',
    slug: 'seven-hundred-years-of-phad-scrolls',
    title: 'Walking Epic: Seven Hundred Years of Shahpura Phad Painting',
    titleHi: 'सात सौ वर्षों की परंपरा: शाहपुरा की फड़ चित्रकला',
    category: 'Artisan Diaries',
    excerpt: 'Before cinema, Bhopa storytellers unrolled 15-foot painted scrolls at night under oil lamps to sing the ballads of Rajasthan.',
    readingTimeMin: 6,
    author: 'Kalyan Joshi · Shahpura',
    publishedAt: '2026-08-30',
    coverImage: GENERATED_IMAGES.phad,
    sections: [
      {
        heading: 'Every Inch Tells a Chorus',
        body: 'In a traditional Phad, no space is empty—floral borders, folk deities, steeds, and musicians interweave seamlessly using mineral vermilion, orpiment yellow, and lampblack.',
      },
    ],
    relatedSlugs: ['phad-painting-pabuji-ki-phad-small', 'phad-painting-medium'],
    isMock: true,
  },
];

export const COUPONS: Coupon[] = [
  { code: 'PADHARO10', description: '10% off on your first Haveli order', discountType: 'percent', value: 10, minOrderInr: 999, isB2BOnly: false, isMock: true },
  { code: 'DIWALI15', description: '15% festive savings above ₹2,999', discountType: 'percent', value: 15, minOrderInr: 2999, isB2BOnly: false, isMock: true },
  { code: 'FIRST500', description: 'Flat ₹500 off above ₹3,999', discountType: 'flat', value: 500, minOrderInr: 3999, isB2BOnly: false, isMock: true },
  { code: 'HAVELI20', description: '20% off heritage Art & Decor orders above ₹5,999', discountType: 'percent', value: 20, minOrderInr: 5999, isB2BOnly: false, isMock: true },
  { code: 'GIFTING12', description: '12% off on festive gifting & hampers', discountType: 'percent', value: 12, minOrderInr: 1499, isB2BOnly: false, isMock: true },
  { code: 'RAAT10', description: '10% late-evening Raat collection privilege', discountType: 'percent', value: 10, minOrderInr: 1500, isB2BOnly: false, isMock: true },
  { code: 'FREESHIP', description: 'Flat ₹150 shipping waiver', discountType: 'flat', value: 150, minOrderInr: 799, isB2BOnly: false, isMock: true },
  { code: 'B2B40', description: 'Approved B2B tier extra 5% launch credit', discountType: 'percent', value: 5, minOrderInr: 25000, isB2BOnly: true, isMock: true },
];

export const BUNDLES: Bundle[] = [
  { id: 'bun-01', title: 'Jaipur Morning Chai & Linen Set', subtitle: 'Save 15% when bundled', productSlugs: ['kulhad-chai-set-of-6', 'block-print-table-runner', 'marigold-napkin-set-of-6'], discountPercent: 15, isMock: true },
  { id: 'bun-02', title: 'Sanganer Kurta & Leheriya Drape', subtitle: 'Complete festive ensemble', productSlugs: ['sanganeri-floral-cotton-kurta', 'leheriya-chiffon-dupatta', 'embroidered-mojari-for-women'], discountPercent: 12, isMock: true },
  { id: 'bun-03', title: 'Haveli Guestroom Refresh', subtitle: 'Bedsheet, Razai & Cushion trio', productSlugs: ['sanganeri-block-print-double-bedsheet-set', 'jaipuri-razai-quilt-double', 'hand-block-cushion-cover-set-of-5'], discountPercent: 14, isMock: true },
  { id: 'bun-04', title: 'Meenakari & Lac Bridal Edit', subtitle: 'Curated jewellery pairing', productSlugs: ['meenakari-peacock-jhumka', 'lac-bangle-set-of-12', 'mirror-work-clutch'], discountPercent: 12, isMock: true },
  { id: 'bun-05', title: 'Blue Pottery Dining Table', subtitle: 'Vase, Plates & Coaster curation', productSlugs: ['blue-pottery-vase', 'blue-pottery-dinner-plate-set-of-4', 'blue-pottery-coaster-set'], discountPercent: 15, isMock: true },
  { id: 'bun-06', title: 'Executive Heritage Desk Suite', subtitle: 'Leather sleeve, journal & brass', productSlugs: ['leather-journal-cover', 'brass-peacock-figurine', 'block-print-notebook-set'], discountPercent: 10, isMock: true },
];

export function buildSeedOrders(products: Product[]): Order[] {
  const statuses: Order['orderStatus'][] = ['Confirmed', 'Artisan Packed', 'Shipped', 'Delivered'];
  const cities = [
    { city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
    { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
    { city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
    { city: 'New Delhi', state: 'Delhi', pincode: '110001' },
    { city: 'Udaipur', state: 'Rajasthan', pincode: '313001' },
  ];
  return Array.from({ length: 15 }).map((_, i) => {
    const p = products[(i * 5) % products.length];
    const loc = cities[i % cities.length];
    const qty = i % 3 === 0 ? 2 : 1;
    const subtotal = p.price * qty;
    const taxableValue = Math.round((subtotal / (1 + p.gstRate / 100)) * 100) / 100;
    const gstAmount = Math.round(subtotal - taxableValue);
    const shippingFee = subtotal >= 1999 ? 0 : 120;
    const paymentMethod = i % 4 === 0 ? 'COD' : 'UPI';
    const prepaidDiscount = paymentMethod === 'UPI' ? 50 : 0;
    const codFee = paymentMethod === 'COD' ? 60 : 0;
    const total = Math.max(0, subtotal - prepaidDiscount + codFee + shippingFee);
    const isIntraState = loc.state === 'Rajasthan';
    return {
      id: `ord-${String(i + 1).padStart(3, '0')}`,
      orderNumber: `RH-2026-${1041 + i}`,
      idempotencyKey: `seed-ord-${i + 1}`,
      customerName: REVIEW_NAMES[i % REVIEW_NAMES.length],
      customerEmail: `guest${i + 1}@example.com`,
      customerPhone: `+91 98290 ${10000 + i * 111}`,
      shippingAddress: {
        line1: `${14 + i}, Johari Haveli Lane`,
        city: loc.city,
        state: loc.state,
        pincode: loc.pincode,
        country: 'India',
      },
      paymentMethod,
      paymentStatus: i % 4 === 0 ? 'Pending COD Verification' : 'Paid',
      orderStatus: statuses[i % statuses.length],
      items: [
        {
          productId: p.id,
          sku: p.sku,
          name: p.name,
          variantLabel: p.variants[0]?.label ?? 'Standard',
          quantity: qty,
          unitPrice: p.price,
          gstRate: p.gstRate,
          hsnCode: p.hsnCode,
          image: p.images[0],
        },
      ],
      subtotal,
      discount: 0,
      prepaidDiscount,
      codFee,
      moharRedeemed: 0,
      moharEarned: Math.floor(total / 25),
      giftWrap: i % 2 === 0,
      shippingFee,
      gstAmount,
      total,
      invoice: {
        invoiceNumber: `INV-RH-SEED-${1041 + i}`,
        sellerName: 'LEGAL_ENTITY_NAME',
        sellerGstin: 'LEGAL_GSTIN',
        sellerState: 'Rajasthan',
        buyerState: loc.state,
        isIntraState,
        taxableValue: Math.round(taxableValue),
        cgstAmount: isIntraState ? Math.round((gstAmount / 2) * 100) / 100 : 0,
        sgstAmount: isIntraState ? Math.round((gstAmount / 2) * 100) / 100 : 0,
        igstAmount: isIntraState ? 0 : gstAmount,
        totalGst: gstAmount,
      },
      channel: i % 5 === 0 ? 'B2B' : 'D2C',
      createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
      isMock: true,
    };
  });
}

export const SEED_B2B_APPLICATIONS: B2BApplication[] = [
  {
    id: 'b2b-app-01',
    businessName: 'Rambagh Heritage Boutique',
    businessType: 'Hotel / Resort',
    gstin: '08AABCR1234F1ZS',
    iecCode: '0512098711',
    contactName: 'Devika Singhania',
    email: 'procurement@rambaghboutique.example',
    phone: '+91 98291 44501',
    city: 'Jaipur',
    expectedMonthlyVolume: '₹2,50,000 – ₹5,00,000',
    status: 'Approved',
    creditLimitInr: 500000,
    createdAt: '2026-09-12T10:00:00Z',
    isMock: true,
  },
  {
    id: 'b2b-app-02',
    businessName: 'Atelier Marwar Interiors',
    businessType: 'Interior Designer',
    gstin: '27AADCA8876K1Z2',
    contactName: 'Kabir Malhotra',
    email: 'studio@marwarinteriors.example',
    phone: '+91 98201 77812',
    city: 'Mumbai',
    expectedMonthlyVolume: '₹1,00,000 – ₹2,50,000',
    status: 'Pending Review',
    creditLimitInr: 0,
    createdAt: '2026-11-05T14:20:00Z',
    isMock: true,
  },
];

export function buildSeedB2BQuotes(): B2BQuote[] {
  const companies = [
    'Taj Lakeview Curated Shop',
    'Amara Design Studio London',
    'Veda Corporate Gifting',
    'Neemrana Resort Suites',
    'Saffron & Loom Melbourne',
  ];
  const cats = ['Textiles & Apparel', 'Home Furnishing', 'Gifting & Festive', 'Art & Collectibles'];
  const statuses: B2BQuote['status'][] = ['Quoted', 'Approved', 'Draft', 'Converted'];
  return Array.from({ length: 20 }).map((_, i) => ({
    id: `rfq-${String(i + 1).padStart(3, '0')}`,
    quoteNumber: `RFQ-26-${301 + i}`,
    companyName: companies[i % companies.length],
    contactEmail: `buyer${i + 1}@partner.example`,
    category: cats[i % cats.length],
    quantity: 50 + (i % 5) * 25,
    customBranding: i % 2 === 0,
    packagingType: i % 2 === 0 ? 'Custom Foil Haveli Box' : 'Reusable Muslin Pouch',
    targetBudgetInr: 75000 + i * 12500,
    notes: 'Include artisan provenance cards and export HS codes.',
    status: statuses[i % statuses.length],
    quotedTotalInr: 68000 + i * 11800,
    createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
    isMock: true,
  }));
}
