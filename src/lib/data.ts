import { DEFAULT_DELIVERY_ZONES } from './delivery';

// Mock product data for Zhua Furniture

export interface ProductColor {
  name: string;
  hex: string;
  /** Images of this product in this specific colour/finish. */
  images?: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: 'furniture' | 'curtains' | 'accessories';
  subcategory: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  badge?: 'new' | 'sale' | 'custom' | 'bestseller';
  description: string;
  longDescription: string;
  images: string[];
  colors: ProductColor[];
  sizes?: string[];
  fabrics?: string[];
  inStock: boolean;
  isCustomizable: boolean;
  deliveryDays: string;
  weightKg?: number;
  dimensions?: {
    widthCm?: number;
    depthCm?: number;
    heightCm?: number;
  };
  features: string[];
}

export const products: Product[] = [
  {
    id: '1',
    slug: 'oslo-sectional-sofa',
    name: 'Oslo Sectional Sofa',
    category: 'furniture',
    subcategory: 'Sofas & Lounges',
    price: 24999,
    originalPrice: 32000,
    rating: 4.8,
    reviewCount: 124,
    badge: 'sale',
    description: 'Premium L-shaped sectional with deep-seated comfort and modular configuration.',
    longDescription: 'The Oslo Sectional is the centrepiece your living room deserves. Crafted with kiln-dried hardwood frame and wrapped in premium Italian bouclé fabric, this sofa is built to last a lifetime. The modular design allows you to rearrange sections to suit your space.',
    images: [
      '/images/zhua/furniture-featured-sofa.jpg',
      '/images/zhua/hero-complete-living.jpg',
      '/images/zhua/furniture-lounge.jpg',
    ],
    colors: [
      { name: 'Stone Bouclé', hex: '#C8BCA8' },
      { name: 'Mocha Velvet', hex: '#6B4F3A' },
      { name: 'Slate Blue', hex: '#5A6E8A' },
      { name: 'Forest Green', hex: '#3D5A4A' },
    ],
    sizes: ['2-Seater', '3-Seater', 'L-Shape', 'U-Shape'],
    fabrics: ['Boucle', 'Performance Velvet', 'Linen Blend'],
    inStock: true,
    isCustomizable: true,
    deliveryDays: '14-21 business days',
    features: ['Kiln-dried hardwood frame', 'Italian bouclé fabric', 'Modular configuration', '5-year structural warranty'],
  },
  {
    id: '2',
    slug: 'nordic-dining-table',
    name: 'Nordic Dining Table',
    category: 'furniture',
    subcategory: 'Dining',
    price: 18500,
    rating: 4.9,
    reviewCount: 87,
    badge: 'new',
    description: 'Solid white oak dining table with natural grain detail and blackened steel legs.',
    longDescription: 'The Nordic Dining Table brings Scandinavian minimalism to your dining space. Each table is made from solid white oak, hand-selected for its natural grain patterns. The blackened steel base provides a striking contrast.',
    images: ['/images/zhua/tile-dining-green.jpg', '/images/zhua/complete-room.jpg'],
    colors: [
      { name: 'Natural Oak', hex: '#C8A96E' },
      { name: 'Smoked Oak', hex: '#72614A' },
      { name: 'Whitewash', hex: '#EDE8DC' },
    ],
    sizes: ['6-Seater (180cm)', '8-Seater (220cm)', '10-Seater (260cm)'],
    fabrics: ['Natural Grain Seal', 'Matte Oil Finish', 'Satin Clear Coat'],
    inStock: true,
    isCustomizable: false,
    deliveryDays: '10-14 business days',
    features: ['Solid white oak', 'Blackened steel legs', 'Food-safe oil finish', 'Seats 6-10'],
  },
  {
    id: '3',
    slug: 'sahara-eyelet-curtains',
    name: 'Sahara Eyelet Curtains',
    category: 'curtains',
    subcategory: 'Block-Out Curtains',
    price: 3200,
    rating: 4.7,
    reviewCount: 203,
    badge: 'bestseller',
    description: 'Premium block-out curtains in rich desert tones. Available custom to any dimension.',
    longDescription: 'The Sahara Eyelet Curtains offer 100% light blocking performance without compromising on style. Made from heavyweight woven fabric with a thermal lining.',
    images: ['/images/zhua/curtains-window-living.jpg', '/images/zhua/curtains-sheer-living.jpg'],
    colors: [
      { name: 'Desert Sand', hex: '#C4A882' },
      { name: 'Rust Terracotta', hex: '#B85C38' },
      { name: 'Sage Green', hex: '#7A9E7E' },
      { name: 'Stone Grey', hex: '#8B8B8B' },
      { name: 'Midnight Navy', hex: '#2C3E6B' },
    ],
    sizes: ['140 x 220 cm', '180 x 220 cm', 'Custom Made'],
    fabrics: ['Linen Blend', 'Velvet', 'Sheer', 'Block-Out'],
    inStock: true,
    isCustomizable: true,
    deliveryDays: '7-10 business days',
    features: ['100% light blocking', 'Thermal lining', 'Custom dimensions', 'Machine washable'],
  },
  {
    id: '4',
    slug: 'wave-sheer-panels',
    name: 'Wave Sheer Panels',
    category: 'curtains',
    subcategory: 'Sheer Curtains',
    price: 1800,
    rating: 4.6,
    reviewCount: 156,
    badge: 'new',
    description: 'Flowing wave-headed sheers for a soft, modern look in any room.',
    longDescription: 'The Wave Sheer Panels create a beautiful, flowing effect when drawn. The S-fold heading allows for uniform folds that maintain their shape.',
    images: ['/images/zhua/curtains-sheer-living.jpg', '/images/zhua/curtains-window-living.jpg'],
    colors: [
      { name: 'Pure White', hex: '#F5F5F0' },
      { name: 'Warm Cream', hex: '#F0E8D5' },
      { name: 'Blush', hex: '#E8C4B8' },
    ],
    sizes: ['140 x 225 cm', '220 x 225 cm', 'Custom Made'],
    fabrics: ['Voile', 'Linen Sheer', 'Chiffon'],
    inStock: true,
    isCustomizable: true,
    deliveryDays: '5-8 business days',
    features: ['S-fold wave heading', 'UV protection', 'Machine washable', 'Custom widths'],
  },
  {
    id: '5',
    slug: 'luxe-roller-blind',
    name: 'Luxe Roller Blind',
    category: 'curtains',
    subcategory: 'Roller Blinds',
    price: 950,
    originalPrice: 1200,
    rating: 4.8,
    reviewCount: 312,
    badge: 'sale',
    description: 'Clean, modern roller blind with whisper-quiet mechanism and precision fit.',
    longDescription: 'The Luxe Roller Blind delivers clean lines and precision control. The whisper-quiet spring or chain mechanism ensures smooth operation every time.',
    images: ['/images/zhua/curtains-window-living.jpg', '/images/zhua/complete-room.jpg'],
    colors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Pearl Grey', hex: '#C8C8C8' },
      { name: 'Cappuccino', hex: '#C4A882' },
      { name: 'Charcoal', hex: '#3A3530' },
    ],
    sizes: ['600 mm width', '1200 mm width', 'Custom Made'],
    fabrics: ['Light-Filter', 'Sunscreen', 'Block-Out'],
    inStock: true,
    isCustomizable: true,
    deliveryDays: '5-7 business days',
    features: ['Whisper-quiet mechanism', 'UV-resistant fabric', 'Motorisation available', 'Custom cut'],
  },
  {
    id: '6',
    slug: 'palazzo-bed-frame',
    name: 'Palazzo Bed Frame',
    category: 'furniture',
    subcategory: 'Bedroom',
    price: 15800,
    rating: 4.9,
    reviewCount: 67,
    badge: 'new',
    description: 'Statement upholstered bed frame with tufted headboard and solid wood base.',
    longDescription: 'The Palazzo Bed Frame makes a statement without saying a word. The towering tufted headboard is upholstered in premium performance velvet, and the solid wood base ensures decades of durability.',
    images: ['/images/zhua/tile-bedroom-minimal.jpg', '/images/zhua/complete-room.jpg'],
    colors: [
      { name: 'Champagne Velvet', hex: '#C8A96E' },
      { name: 'Deep Teal', hex: '#1B4F5E' },
      { name: 'Blush Rose', hex: '#C48B8B' },
      { name: 'Graphite', hex: '#4A4A4A' },
    ],
    sizes: ['Queen (152cm)', 'King (183cm)', 'Super King (200cm)'],
    fabrics: ['Performance Velvet', 'Linen Blend', 'Leatherette'],
    inStock: true,
    isCustomizable: true,
    deliveryDays: '14-21 business days',
    features: ['Performance velvet', 'Solid wood base', 'Tufted headboard', '20-year frame warranty'],
  },
  {
    id: '7',
    slug: 'arco-floor-lamp',
    name: 'Arco Arc Floor Lamp',
    category: 'accessories',
    subcategory: 'Lighting',
    price: 4200,
    rating: 4.7,
    reviewCount: 45,
    description: 'Sculptural arc lamp with marble base and brushed brass finish.',
    longDescription: 'The Arco Arc Floor Lamp is a design classic reimagined. The natural marble base provides weight and elegance, while the brushed brass arm adds warmth.',
    images: ['/images/zhua/complete-room.jpg', '/images/zhua/furniture-lounge.jpg'],
    colors: [
      { name: 'Brass + White Marble', hex: '#C9A84C' },
      { name: 'Matte Black + Black Marble', hex: '#1A1A1A' },
    ],
    inStock: true,
    isCustomizable: false,
    deliveryDays: '5-8 business days',
    features: ['Natural marble base', 'Brushed brass finish', 'LED compatible', 'Adjustable arc'],
  },
  {
    id: '8',
    slug: 'atlas-coffee-table',
    name: 'Atlas Coffee Table',
    category: 'furniture',
    subcategory: 'Living Room',
    price: 8900,
    rating: 4.8,
    reviewCount: 93,
    badge: 'bestseller',
    description: 'Travertine-top coffee table with blackened steel base — artful and functional.',
    longDescription: 'The Atlas Coffee Table is a statement piece for the modern living room. Each travertine top is unique, with natural veining that makes it one-of-a-kind.',
    images: ['/images/zhua/furniture-lounge.jpg', '/images/zhua/tile-sofa-orange.jpg'],
    colors: [
      { name: 'Ivory Travertine', hex: '#E8DCC8' },
      { name: 'Walnut + Brass', hex: '#6B4F2A' },
    ],
    sizes: ['Small (90cm)', 'Medium (120cm)', 'Large (150cm)'],
    fabrics: ['Sealed Travertine', 'Brushed Walnut Veneer'],
    inStock: true,
    isCustomizable: false,
    deliveryDays: '7-10 business days',
    features: ['Natural travertine', 'Blackened steel base', 'Sealing included', 'Unique grain pattern'],
  },
];

export const categories = [
  {
    id: 'furniture',
    name: 'Furniture',
    description: 'Premium pieces crafted for longevity and elegance',
    count: 84,
    slug: 'furniture',
  },
  {
    id: 'curtains',
    name: 'Curtains & Blinds',
    description: 'Custom window dressings tailored to your space',
    count: 126,
    slug: 'curtains',
  },
  {
    id: 'accessories',
    name: 'Home Accessories',
    description: 'Curated décor to complete your interior story',
    count: 52,
    slug: 'accessories',
  },
];

export const testimonials = [
  {
    id: 1,
    name: 'Naledi Mokoena',
    location: 'Johannesburg, GP',
    avatar: '/images/avatar-1.jpg',
    rating: 5,
    text: 'Zhua transformed our living room completely. The Oslo sofa is even more stunning in person, and the installation team was professional and on time. We couldn\'t be happier!',
    project: 'Living Room Renovation',
    before: '/images/before-1.jpg',
    after: '/images/after-1.jpg',
  },
  {
    id: 2,
    name: 'Pieter van der Berg',
    location: 'Cape Town, WC',
    avatar: '/images/avatar-2.jpg',
    rating: 5,
    text: 'The curtain customizer on their website made it so easy to visualise what the curtains would look like. The final product exceeded my expectations. Delivered ahead of schedule too!',
    project: 'Master Bedroom Curtains',
    before: '/images/before-2.jpg',
    after: '/images/after-2.jpg',
  },
  {
    id: 3,
    name: 'Fatima Patel',
    location: 'Durban, KZN',
    avatar: '/images/avatar-3.jpg',
    rating: 5,
    text: 'From the moment I used the room visualizer to the final delivery, the entire Zhua experience was world-class. The team even helped me choose the right curtain heading for my high ceilings.',
    project: 'Full Home Styling',
    before: '/images/before-3.jpg',
    after: '/images/after-3.jpg',
  },
  {
    id: 4,
    name: 'Marco Ferreira',
    location: 'Pretoria, GP',
    avatar: '/images/avatar-4.jpg',
    rating: 5,
    text: 'The Atlas coffee table is an absolute showstopper. Every guest asks about it. The travertine top is even more beautiful in person, and delivery to Pretoria was flawless.',
    project: 'Dining & Living',
    before: '/images/before-4.jpg',
    after: '/images/after-4.jpg',
  },
];

export const deliveryProvinces = DEFAULT_DELIVERY_ZONES;

export const fabricOptions = [
  { id: 'linen', name: 'Linen Blend', texture: '#D4C4A8', price: 180 },
  { id: 'velvet', name: 'Premium Velvet', texture: '#8B6B8B', price: 280 },
  { id: 'sheer-voile', name: 'Voile Sheer', texture: '#F0EDE8', price: 120 },
  { id: 'blockout', name: 'Block-Out', texture: '#4A4A4A', price: 220 },
  { id: 'jacquard', name: 'Jacquard', texture: '#C4A882', price: 350 },
  { id: 'cotton', name: 'Cotton Canvas', texture: '#E8D8B8', price: 160 },
  { id: 'chenille', name: 'Chenille', texture: '#8B7B6B', price: 240 },
  { id: 'silk-look', name: 'Faux Silk', texture: '#C8BAA0', price: 300 },
];

export const headingStyles = [
  { id: 'eyelet', name: 'Eyelet', description: 'Clean, modern rings' },
  { id: 'pinch-pleat', name: 'Pinch Pleat', description: 'Classic tailored look' },
  { id: 'wave', name: 'S-Fold Wave', description: 'Flowing, uniform folds' },
  { id: 'tab-top', name: 'Tab Top', description: 'Casual, relaxed style' },
  { id: 'pencil-pleat', name: 'Pencil Pleat', description: 'Traditional gathered look' },
];

export const formatPrice = (price: number): string => {
  const rounded = Math.round(price);
  const grouped = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `R ${grouped}`;
};
