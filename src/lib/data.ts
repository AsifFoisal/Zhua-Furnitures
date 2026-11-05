import { DEFAULT_DELIVERY_ZONES } from './delivery';

// Product catalogue types. Live catalogue is loaded from /api/products
// (Supabase); there is no mock product fallback.

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
  /** Public URL of the product's GLB 3D model, when one has been uploaded. */
  modelUrl?: string;
  weightKg?: number;
  dimensions?: {
    widthCm?: number;
    depthCm?: number;
    heightCm?: number;
  };
  features: string[];
}


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
