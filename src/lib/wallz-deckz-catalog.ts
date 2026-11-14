/**
 * WALLZ & DECKZ hybrid catalog — shared data model and curated content.
 *
 * Every division page blends two kinds of entries:
 *  - `completed`  — real installations (past work) that build trust.
 *  - `concept`    — pre-designed, ready-to-customize starting points with
 *                   estimated "from" pricing in ZAR.
 *
 * Curated entries below are placeholder content for the South African market.
 * Completed items managed in /admin/divisions (the `division_items` table) are
 * merged in on the server and render alongside these.
 */

import { buildWhatsAppUrl } from '@/lib/whatsapp';

export type CatalogDivision = 'wallz' | 'deckz';
export type CatalogKind = 'completed' | 'concept';

export interface CatalogFinish {
  name: string;
  /** Swatch colour rendered in the detail view. */
  hex: string;
}

export interface CatalogGalleryImage {
  src: string;
  alt: string;
}

export interface CatalogCostBreakdown {
  materials: number;
  labour: number;
  /** Equals materials + labour; matches the entry's starting price. */
  total: number;
}

export interface CatalogEntry {
  id: string;
  division: CatalogDivision;
  kind: CatalogKind;
  title: string;
  /** Sub-category label — one of the division's CATALOG_CATEGORIES. */
  category: string;
  /** Short description shown on the catalog card. */
  summary: string;
  /** Longer description shown in the detail view. */
  overview: string;
  /** ZAR. Null renders as "Price on request" (e.g. minimal admin-added items). */
  startingPrice: number | null;
  dimensions: string | null;
  materials: string[];
  finishes: CatalogFinish[];
  /** What the price includes (measurement, installation, lighting, etc.). */
  inclusions: string[];
  gallery: CatalogGalleryImage[];
  costBreakdown: CatalogCostBreakdown | null;
  /** Concepts only — typical turnaround. */
  leadTime: string | null;
  /** Completed projects only — suburb / city of the installation. */
  location: string | null;
  /** Completed projects only — year handed over. */
  completedYear: number | null;
}

export const CATALOG_DIVISION_LABEL: Record<CatalogDivision, string> = {
  wallz: 'WALLZ',
  deckz: 'DECKZ',
};

export const CATALOG_CATEGORIES: Record<CatalogDivision, readonly string[]> = {
  wallz: [
    'TV & Media Walls',
    'Wooden & Timber Slat Panels',
    'Wallpaper Designs',
    'Decorative Wall Cladding',
    'Modern Wall Finishes',
  ],
  deckz: [
    'Wooden & Composite Decks',
    'Outdoor Patios',
    'Pergolas',
    'Pool Decks',
    'Outdoor Entertainment Areas',
  ],
};

export const CATALOG_KIND_LABEL: Record<CatalogKind, string> = {
  completed: 'Completed Project',
  concept: 'Pre-Designed Concept',
};

/** Shared pricing disclaimer shown under every cost breakdown. */
export const CATALOG_PRICE_NOTE =
  'Final pricing adjusts to your site measurements, chosen finishes and site conditions. A free on-site measurement locks in the exact quote.';

const sharedWallzInclusions = [
  'Free on-site measurement & design consultation',
  'Manufacture & professional installation by the ZHUA team',
  'Concealed cabling & LED lighting integration',
  'Site cleanup & final walkthrough',
];

const sharedDeckzInclusions = [
  'Free on-site measurement & level survey',
  'Engineered substructure & stainless fixings',
  'Installation, oiling/sealing & final inspection',
  'Maintenance guide for SA weather conditions',
];

function wallz(...images: CatalogGalleryImage[]): CatalogGalleryImage[] {
  return images;
}

/* ============================================================
   WALLZ — curated entries
   ============================================================ */

const wallzEntries: CatalogEntry[] = [
  {
    id: 'wallz-bryanston-cinema-media-wall',
    division: 'wallz',
    kind: 'completed',
    title: 'Bryanston Home Cinema Media Wall',
    category: 'TV & Media Walls',
    summary: 'Full-height media wall with floating TV niche, concealed LED cove and matte-oak slat cladding.',
    overview:
      'A 4.2m statement wall built around a floating 65″ TV niche for a Bryanston family room. The carcass is SupaWood with a hand-finished matte lacquer, wrapped in oak-look slats that continue onto the ceiling bulkhead. Cabling, soundbar and decoder storage are fully concealed behind push-to-open joinery, and a warm LED cove washes the wall at night. The same layout scales up or down for lounges, townhouses and entertainment rooms.',
    startingPrice: 68500,
    dimensions: '4.2m W × 2.8m H (as built)',
    materials: [
      '16mm SupaWood carcass, matte lacquer finish',
      'Oak-look PVC/WPC slat cladding',
      'Marble-look porcelain feature panel',
      'Warm-white LED cove & spotlights',
      'Soft-close push-to-open storage',
    ],
    finishes: [
      { name: 'Warm Oak', hex: '#A9805B' },
      { name: 'Natural Oak', hex: '#C8A472' },
      { name: 'Walnut', hex: '#6B4A32' },
      { name: 'Matte Charcoal', hex: '#3E4348' },
      { name: 'Ivory', hex: '#EFEAE2' },
    ],
    inclusions: sharedWallzInclusions,
    gallery: wallz(
      { src: '/images/zhua/wallz-media-wall-warm.jpg', alt: 'Warm media wall with built-in TV niche and slat cladding' },
      { src: '/images/zhua/wallz-tv-unit-wall.jpg', alt: 'TV unit and feature wall in a styled lounge' },
      { src: '/images/zhua/showcase-wallz-builtins.jpg', alt: 'Built-in joinery detailing around the media wall' },
    ),
    costBreakdown: { materials: 39800, labour: 28700, total: 68500 },
    leadTime: null,
    location: 'Bryanston, Johannesburg',
    completedYear: 2025,
  },
  {
    id: 'wallz-sandton-loft-slat-wall',
    division: 'wallz',
    kind: 'completed',
    title: 'Sandton Loft Timber Slat Feature Wall',
    category: 'Wooden & Timber Slat Panels',
    summary: '5.4m walnut slat wall with acoustic felt backing and integrated shelf lighting.',
    overview:
      'Installed in a Sandton loft living space, this full-width slat wall runs 5.4m end-to-end with walnut-look slats over black acoustic felt. A floating timber shelf breaks the rhythm and carries concealed strip lighting, while the slat layout hides the TV mounting plate and speaker cabling. The client chose a matte walnut finish to tie into their existing ZHUA media unit.',
    startingPrice: 42800,
    dimensions: '5.4m W × 2.7m H (as built)',
    materials: [
      'Walnut-look PVC/WPC slats, 30mm pitch',
      'Black acoustic felt backing',
      'Floating timber shelf with LED strip',
      'Aluminium mounting rails & trims',
    ],
    finishes: [
      { name: 'Walnut', hex: '#6B4A32' },
      { name: 'Natural Oak', hex: '#C8A472' },
      { name: 'Charcoal', hex: '#3E4348' },
      { name: 'Matte Black', hex: '#26282B' },
    ],
    inclusions: sharedWallzInclusions,
    gallery: wallz(
      { src: '/images/zhua/wallz-slat-wall-dark.jpg', alt: 'Dark timber slat feature wall with integrated lighting' },
      { src: '/images/zhua/showcase-wallz-slat-partition.jpg', alt: 'Slat wall panelling behind a dining area' },
      { src: '/images/zhua/hero-complete-living.jpg', alt: 'Living space with slat feature wall and modular sofa' },
    ),
    costBreakdown: { materials: 24300, labour: 18500, total: 42800 },
    leadTime: null,
    location: 'Sandton, Johannesburg',
    completedYear: 2025,
  },
  {
    id: 'wallz-umhlanga-headboard-wall',
    division: 'wallz',
    kind: 'completed',
    title: 'Umhlanga Panelled Headboard Wall',
    category: 'Decorative Wall Cladding',
    summary: 'Upholstered and fluted panel mix framing a custom ZHUA bed, with bedside wall lights.',
    overview:
      'A primary-bedroom headboard wall in Umhlanga combining fluted PVC panels with two upholstered muted-velvet inserts. Timber reveal trims frame each section, and wall-mounted bedside lights are wired through the panel carcass so no cables are visible. The design is easily adapted to any bedroom width and pairs naturally with a custom ZHUA bed and bedding.',
    startingPrice: 31900,
    dimensions: '3.8m W × 2.4m H (as built)',
    materials: [
      'Fluted PVC wall panels',
      'Muted-velvet upholstered inserts',
      'Timber reveal trims & shadow gaps',
      'Integrated bedside wall lights',
    ],
    finishes: [
      { name: 'Greige', hex: '#B8AFA4' },
      { name: 'Ivory', hex: '#EFEAE2' },
      { name: 'Sage', hex: '#8A9B84' },
      { name: 'Natural Oak', hex: '#C8A472' },
    ],
    inclusions: sharedWallzInclusions,
    gallery: wallz(
      { src: '/images/zhua/showcase-wallz-headboard.jpg', alt: 'Bedroom with a panelled headboard wall' },
      { src: '/images/zhua/showcase-wallz-accent.jpg', alt: 'Accent wall detailing in a styled bedroom' },
      { src: '/images/zhua/showcase-wallz-formal.jpg', alt: 'Panelled wall and built-ins beside the bedroom' },
    ),
    costBreakdown: { materials: 18400, labour: 13500, total: 31900 },
    leadTime: null,
    location: 'Umhlanga, KwaZulu-Natal',
    completedYear: 2024,
  },
  {
    id: 'wallz-velocity-media-wall-concept',
    division: 'wallz',
    kind: 'concept',
    title: 'Velocity Floating Media Wall',
    category: 'TV & Media Walls',
    summary: 'Ready-to-customize media wall concept — floating console, TV niche and open shelving on a 3.6m module.',
    overview:
      'Our most requested media wall layout, pre-designed as a 3.6m × 2.7m module and customized to your room. The floating console carries up to a 75″ TV on a recessed niche with hidden cable routes; two open shelves flank the screen for soundbars and décor. Choose matte, satin or wood-look finishes, add a stone-look feature panel behind the TV, and we adjust width, storage and lighting to your space before manufacture.',
    startingPrice: 54000,
    dimensions: 'Standard 3.6m W × 2.7m H (resized to your wall)',
    materials: [
      'SupaWood/MDF carcass — matte, satin or wood-look finish',
      'Optional marble/stone-look feature panel',
      'Warm-white LED cove & shelf lighting',
      'Concealed cable management & ventilation',
    ],
    finishes: [
      { name: 'Matte Charcoal', hex: '#3E4348' },
      { name: 'Warm Oak', hex: '#A9805B' },
      { name: 'Natural Oak', hex: '#C8A472' },
      { name: 'Ivory', hex: '#EFEAE2' },
      { name: 'Walnut', hex: '#6B4A32' },
    ],
    inclusions: sharedWallzInclusions,
    gallery: wallz(
      { src: '/images/zhua/wallz-media-wall-warm.jpg', alt: 'Media wall concept with TV niche and slat detail' },
      { src: '/images/zhua/wallz-tv-unit-wall.jpg', alt: 'Floating console and feature wall layout' },
      { src: '/images/zhua/showcase-wallz-builtins.jpg', alt: 'Open shelving detail of the media wall' },
    ),
    costBreakdown: { materials: 31500, labour: 22500, total: 54000 },
    leadTime: '4–6 weeks from approved design',
    location: null,
    completedYear: null,
  },
  {
    id: 'wallz-luna-fluted-wallpaper-concept',
    division: 'wallz',
    kind: 'concept',
    title: 'Luna Fluted & Wallpaper Feature Wall',
    category: 'Wallpaper Designs',
    summary: 'Fluted panel feature wall with a premium wallpaper inset — a fast, high-impact accent wall concept.',
    overview:
      'The Luna concept pairs vertical fluted panels with a premium non-woven wallpaper inset framed in timber reveals. Designed for bedrooms, passages and lounge accent walls, it installs over a single visit with minimal disruption. Choose your fluted panel colour and wallpaper from our SA supplier library — sage, greige and terracotta tones are client favourites — and we scale the panel rhythm to your wall width.',
    startingPrice: 18900,
    dimensions: 'Standard 3.0m W × 2.7m H (resized to your wall)',
    materials: [
      'Fluted PVC wall panels, colour of choice',
      'Premium non-woven wallpaper (washable)',
      'Timber reveal trims & shadow gaps',
      'Optional LED cove above the feature band',
    ],
    finishes: [
      { name: 'Fluted Ivory', hex: '#EFEAE2' },
      { name: 'Fluted Greige', hex: '#B8AFA4' },
      { name: 'Sage Wallpaper', hex: '#8A9B84' },
      { name: 'Terracotta Wallpaper', hex: '#B0664C' },
      { name: 'Charcoal Wallpaper', hex: '#3E4348' },
    ],
    inclusions: sharedWallzInclusions,
    gallery: wallz(
      { src: '/images/zhua/showcase-wallz-accent.jpg', alt: 'Fluted and wallpaper accent wall in a lounge' },
      { src: '/images/zhua/furniture-lounge.jpg', alt: 'Styled lounge with the accent wall as backdrop' },
      { src: '/images/zhua/showcase-wallz-formal.jpg', alt: 'Formal space with panelled and wallpapered wall' },
    ),
    costBreakdown: { materials: 9800, labour: 9100, total: 18900 },
    leadTime: '2–3 weeks from approved design',
    location: null,
    completedYear: null,
  },
  {
    id: 'wallz-metro-slat-accent-concept',
    division: 'wallz',
    kind: 'concept',
    title: 'Metro Slat Accent Wall Package',
    category: 'Wooden & Timber Slat Panels',
    summary: 'Entry-level 2.4m slat wall package — quick to install, easy to extend, fully customizable.',
    overview:
      'The Metro package is our most affordable way into the slat-wall look: a 2.4m × 2.7m slat panel module on acoustic felt, framed with shadow-gap reveals. Perfect behind beds, sofas and desks — and modules repeat cleanly to cover any wall length. Pick your slat tone, add a floating shelf or LED strip, and we confirm final dimensions at the free site measurement.',
    startingPrice: 12500,
    dimensions: 'Standard 2.4m W × 2.7m H (modules repeat to any width)',
    materials: [
      'PVC/WPC slats on acoustic felt backing',
      'MDF shadow-gap reveal frame',
      'Optional floating shelf & LED strip',
      'Aluminium mounting rails',
    ],
    finishes: [
      { name: 'Natural Oak', hex: '#C8A472' },
      { name: 'Walnut', hex: '#6B4A32' },
      { name: 'Charcoal', hex: '#3E4348' },
      { name: 'Matte Black', hex: '#26282B' },
    ],
    inclusions: sharedWallzInclusions,
    gallery: wallz(
      { src: '/images/zhua/showcase-wallz-slat-partition.jpg', alt: 'Slat accent wall behind a dining space' },
      { src: '/images/zhua/wallz-slat-wall-dark.jpg', alt: 'Dark slat accent wall with LED lighting' },
      { src: '/images/zhua/showcase-wallz-headboard.jpg', alt: 'Slat module used as a headboard wall' },
    ),
    costBreakdown: { materials: 6900, labour: 5600, total: 12500 },
    leadTime: '1–2 weeks from approved design',
    location: null,
    completedYear: null,
  },
];

/* ============================================================
   DECKZ — curated entries
   ============================================================ */

const deckzEntries: CatalogEntry[] = [
  {
    id: 'deckz-sandton-entertainment-deck',
    division: 'deckz',
    kind: 'completed',
    title: 'Sandton Multi-Level Entertainment Deck',
    category: 'Outdoor Entertainment Areas',
    summary: '62sqm two-level hardwood deck with built-in seating, planter boxes and LED step lighting.',
    overview:
      'A two-level entertainment deck built for a Sandton home that hosts regularly. The upper level carries dining and a built-in bench around the perimeter; three steps down, a lower lounge deck frames a fire pit zone. Garapa hardwood boards are secretly fixed over a galvanised steel substructure, with LED riser lighting on every step and planter boxes cast into the corners. Built for Joburg highveld sun and afternoon thunderstorms.',
    startingPrice: 186000,
    dimensions: '62 sqm across two levels (as built)',
    materials: [
      '19mm × 90mm Garapa hardwood decking, secret-fixed',
      'Galvanised steel substructure on adjustable feet',
      'Built-in timber seating & planter boxes',
      'LED step & riser lighting, weatherproof',
    ],
    finishes: [
      { name: 'Sealed Balau (honey)', hex: '#B98A54' },
      { name: 'Oiled Walnut', hex: '#6B4A32' },
      { name: 'Composite Grey', hex: '#8D9094' },
      { name: 'Composite Ash', hex: '#B7BCC1' },
    ],
    inclusions: sharedDeckzInclusions,
    gallery: wallz(
      { src: '/images/zhua/showcase-deckz-terrace.jpg', alt: 'Two-level terrace deck with lounge seating and pool' },
      { src: '/images/zhua/deckz-pool-deck-dusk.jpg', alt: 'Entertainment deck at dusk with lighting' },
      { src: '/images/zhua/showcase-deckz-garden.jpg', alt: 'Garden side of the multi-level deck' },
    ),
    costBreakdown: { materials: 112000, labour: 74000, total: 186000 },
    leadTime: null,
    location: 'Sandton, Johannesburg',
    completedYear: 2025,
  },
  {
    id: 'deckz-centurion-pool-deck',
    division: 'deckz',
    kind: 'completed',
    title: 'Centurion Wraparound Pool Deck',
    category: 'Pool Decks',
    summary: '48sqm barefoot-friendly composite deck wrapping the pool, with a shaded lounging bay.',
    overview:
      'A full wraparound pool deck in Centurion using wood-plastic composite boards rated for continuous wet-zone use — no splinters, no annual sanding. The deck steps around the pool on a single level with a raised lounging bay under a shade sail, and drainage gaps are set on 6mm centres so water sheds cleanly. Concealed fasteners and colour-matched trims keep the surface clean underfoot and to the eye.',
    startingPrice: 142500,
    dimensions: '48 sqm wraparound (as built)',
    materials: [
      'Wood-plastic composite (WPC) boards, non-slip profile',
      'Aluminium substructure with levelling feet',
      'Colour-matched trims & concealed fasteners',
      'Shade-sail mounting posts',
    ],
    finishes: [
      { name: 'Composite Grey', hex: '#8D9094' },
      { name: 'Composite Ash', hex: '#B7BCC1' },
      { name: 'Composite Walnut', hex: '#7A5C42' },
      { name: 'Sand', hex: '#D9C7A7' },
    ],
    inclusions: sharedDeckzInclusions,
    gallery: wallz(
      { src: '/images/zhua/showcase-deckz-pool.jpg', alt: 'Composite pool deck wrapping a modern swimming pool' },
      { src: '/images/zhua/deckz-pool-deck-day.jpg', alt: 'Pool deck and outdoor lounge in daylight' },
      { src: '/images/zhua/showcase-deckz-residential.jpg', alt: 'Residential deck and pool setting' },
    ),
    costBreakdown: { materials: 84500, labour: 58000, total: 142500 },
    leadTime: null,
    location: 'Centurion, Gauteng',
    completedYear: 2024,
  },
  {
    id: 'deckz-pretoria-patio-deck',
    division: 'deckz',
    kind: 'completed',
    title: 'Pretoria East Covered Patio & Braai Deck',
    category: 'Outdoor Patios',
    summary: '34sqm covered patio converted into an outdoor living room with a built-in braai counter.',
    overview:
      'An existing paved patio in Pretoria East lifted into a true outdoor room: balau decking over a treated-pine substructure, a built-in braai counter with granite top, and a bench seat running the one wall. The deck sits level with the interior floor, so the living space flows through double doors without a step. Ceiling-mounted lighting and a fan point were wired in during the build.',
    startingPrice: 96800,
    dimensions: '34 sqm covered patio (as built)',
    materials: [
      '19mm Balau hardwood decking',
      'H3 treated pine substructure',
      'Built-in braai counter with granite top',
      'Built-in bench seating',
    ],
    finishes: [
      { name: 'Sealed Balau (honey)', hex: '#B98A54' },
      { name: 'Oiled Walnut', hex: '#6B4A32' },
      { name: 'Composite Grey', hex: '#8D9094' },
    ],
    inclusions: sharedDeckzInclusions,
    gallery: wallz(
      { src: '/images/zhua/showcase-deckz-patio.jpg', alt: 'Covered patio deck with outdoor lounge furniture' },
      { src: '/images/zhua/showcase-deckz-balcony.jpg', alt: 'Deck seating detail on the covered patio' },
      { src: '/images/zhua/deckz-pool-deck-dusk.jpg', alt: 'Patio deck lit for evening entertaining' },
    ),
    costBreakdown: { materials: 52300, labour: 44500, total: 96800 },
    leadTime: null,
    location: 'Pretoria East, Gauteng',
    completedYear: 2024,
  },
  {
    id: 'deckz-horizon-timber-deck-concept',
    division: 'deckz',
    kind: 'concept',
    title: 'Horizon Timber Entertainment Deck',
    category: 'Wooden & Composite Decks',
    summary: 'Ready-to-customize 30sqm hardwood deck concept — dining and lounge zones on one clean level.',
    overview:
      'The Horizon concept lays out a 6m × 5m (30sqm) deck with a dining zone and a lounge zone separated by a change in board direction. Built in your choice of balau, garapa or low-maintenance composite over a treated substructure, it can include built-in seating, planter edges and step lighting. We adapt the footprint, height and levels to your garden at the free site measurement, then quote exact.',
    startingPrice: 78000,
    dimensions: 'Base design 6m × 5m (30 sqm) — resized to your space',
    materials: [
      'Balau / Garapa hardwood or WPC composite boards',
      'H3 treated pine substructure on concrete piers',
      'Stainless steel secret fixings',
      'Optional built-in seating, planters & LED lighting',
    ],
    finishes: [
      { name: 'Sealed Balau (honey)', hex: '#B98A54' },
      { name: 'Oiled Walnut', hex: '#6B4A32' },
      { name: 'Composite Grey', hex: '#8D9094' },
      { name: 'Composite Ash', hex: '#B7BCC1' },
    ],
    inclusions: sharedDeckzInclusions,
    gallery: wallz(
      { src: '/images/zhua/showcase-deckz-terrace.jpg', alt: 'Timber entertainment deck with dining and lounge zones' },
      { src: '/images/zhua/showcase-deckz-residential.jpg', alt: 'Residential timber deck and lawn' },
      { src: '/images/zhua/showcase-deckz-garden.jpg', alt: 'Deck integrated with garden planting' },
    ),
    costBreakdown: { materials: 44000, labour: 34000, total: 78000 },
    leadTime: '3–5 weeks from approved design',
    location: null,
    completedYear: null,
  },
  {
    id: 'deckz-shade-pergola-concept',
    division: 'deckz',
    kind: 'concept',
    title: 'Shade Pergola & Lounge Package',
    category: 'Pergolas',
    summary: '4m × 3m pergola with adjustable louvre roof over a raised deck platform — shade when you want it, sun when you don’t.',
    overview:
      'The Shade package combines a 4m × 3m pergola with a raised timber deck platform beneath it. Choose a powder-coated aluminium or hardwood frame, and top it with fixed beams or motorised adjustable louvres that close out summer rain. Under-pergola lighting, a ceiling fan point and drop-down sides turn it into a usable outdoor room most of the year. Footprint and heights adjust to your patio.',
    startingPrice: 64500,
    dimensions: 'Base design 4m × 3m — footprint adjustable',
    materials: [
      'Powder-coated aluminium or hardwood frame',
      'Fixed-beam or motorised louvre roof',
      'Timber deck platform, 19mm boards',
      'Integrated LED lighting & fan point',
    ],
    finishes: [
      { name: 'Matte White', hex: '#F4F2EE' },
      { name: 'Charcoal', hex: '#3E4348' },
      { name: 'Natural Timber', hex: '#C8A472' },
      { name: 'Bronze', hex: '#8C6D46' },
    ],
    inclusions: sharedDeckzInclusions,
    gallery: wallz(
      { src: '/images/zhua/final-cta-architecture.jpg', alt: 'Pergola structure on a modern home exterior' },
      { src: '/images/zhua/showcase-deckz-patio.jpg', alt: 'Lounge zone under a covered pergola' },
      { src: '/images/zhua/deckz-pool-deck-day.jpg', alt: 'Shaded deck beside the pool' },
    ),
    costBreakdown: { materials: 35500, labour: 29000, total: 64500 },
    leadTime: '4–6 weeks from approved design',
    location: null,
    completedYear: null,
  },
  {
    id: 'deckz-lagoon-pool-deck-concept',
    division: 'deckz',
    kind: 'concept',
    title: 'Lagoon Composite Pool Deck',
    category: 'Pool Decks',
    summary: '25sqm composite pool surround concept — barefoot-safe, chlorinated-water rated, zero annual sanding.',
    overview:
      'The Lagoon concept is a 25sqm pool surround in wood-plastic composite, profiled for grip when wet and rated for chlorinated water splash zones. Boards run parallel to the pool with 6mm drainage gaps and colour-matched trims; an optional sun-lounger bay extends one corner. Composite means no splinters and no yearly sand-and-seal cycle — a hose down keeps it new. Sizing and shape adjust to your pool at measurement.',
    startingPrice: 88900,
    dimensions: 'Base design 25 sqm — shaped to your pool',
    materials: [
      'WPC composite boards, wet-zone rated non-slip profile',
      'Aluminium substructure with levelling feet',
      'Colour-matched trims & concealed fasteners',
      'Optional corner sun-lounger bay',
    ],
    finishes: [
      { name: 'Composite Grey', hex: '#8D9094' },
      { name: 'Composite Ash', hex: '#B7BCC1' },
      { name: 'Composite Walnut', hex: '#7A5C42' },
      { name: 'Sand', hex: '#D9C7A7' },
    ],
    inclusions: sharedDeckzInclusions,
    gallery: wallz(
      { src: '/images/zhua/deckz-pool-deck-day.jpg', alt: 'Composite pool deck in daylight' },
      { src: '/images/zhua/showcase-deckz-pool.jpg', alt: 'Pool deck wraparound with loungers' },
      { src: '/images/zhua/deckz-pool-deck-dusk.jpg', alt: 'Pool deck at dusk with lighting' },
    ),
    costBreakdown: { materials: 52900, labour: 36000, total: 88900 },
    leadTime: '3–4 weeks from approved design',
    location: null,
    completedYear: null,
  },
];

/* ============================================================
   Helpers
   ============================================================ */

export function getCuratedCatalogEntries(division: CatalogDivision): CatalogEntry[] {
  return division === 'wallz' ? wallzEntries : deckzEntries;
}

/**
 * Map a free-text category (e.g. from admin-managed division items) onto the
 * canonical catalog sub-categories so the filter pills stay clean. Unmatched
 * labels pass through unchanged.
 */
export function normalizeCatalogCategory(division: CatalogDivision, rawCategory: string): string {
  const value = rawCategory.trim().toLowerCase();
  const canonical = CATALOG_CATEGORIES[division];
  const pick = (index: number) => canonical[Math.min(index, canonical.length - 1)];

  if (division === 'wallz') {
    if (/tv|media/.test(value)) return canonical[0]; // TV & Media Walls
    if (/slat|timber/.test(value)) return canonical[1]; // Wooden & Timber Slat Panels
    if (/wallpaper/.test(value)) return canonical[2]; // Wallpaper Designs
    if (/cladding|headboard|panel/.test(value)) return canonical[3]; // Decorative Wall Cladding
    if (/accent|finish|commercial|paint/.test(value)) return canonical[4]; // Modern Wall Finishes
    return canonical.includes(rawCategory) ? rawCategory : pick(4);
  }

  if (/pool/.test(value)) return canonical[3]; // Pool Decks
  if (/pergola|shade|louvre/.test(value)) return canonical[2]; // Pergolas
  if (/patio|braai|cover/.test(value)) return canonical[1]; // Outdoor Patios
  if (/entertain|seating|braai|lounge/.test(value)) return canonical[4]; // Outdoor Entertainment Areas
  if (/deck|composite|balcony|platform|timber|wood/.test(value)) return canonical[0]; // Wooden & Composite Decks
  return canonical.includes(rawCategory) ? rawCategory : pick(0);
}

export function formatZAR(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA')}`;
}

export function formatCatalogPrice(entry: CatalogEntry): string {
  if (entry.startingPrice === null) return 'Price on request';
  return entry.kind === 'completed'
    ? `Project value ${formatZAR(entry.startingPrice)}`
    : `From ${formatZAR(entry.startingPrice)}`;
}

/** /contact URL that pre-fills the enquiry with this specific entry. */
export function buildQuoteHref(entry: CatalogEntry, finishName?: string): string {
  const params = new URLSearchParams({
    division: CATALOG_DIVISION_LABEL[entry.division],
    category: entry.category,
    item: entry.title,
    kind: CATALOG_KIND_LABEL[entry.kind],
  });
  if (finishName) params.set('finish', finishName);
  return `/contact?${params.toString()}`;
}

/** WhatsApp message that references this specific entry. */
export function buildCatalogWhatsAppUrl(entry: CatalogEntry, finishName?: string): string {
  const lines = [
    `Hi ZHUA! I'm interested in the "${entry.title}" (${entry.category}) from your ${CATALOG_DIVISION_LABEL[entry.division]} range.`,
  ];
  if (finishName) lines.push(`Preferred finish: ${finishName}.`);
  if (entry.startingPrice !== null) {
    lines.push(
      entry.kind === 'concept'
        ? `I see it starts from ${formatZAR(entry.startingPrice)} — could you help me customize it for my space?`
        : `Could I get a similar quote for my own space?`,
    );
  } else {
    lines.push('Could you help me with a quote?');
  }
  return buildWhatsAppUrl(lines.join(' '));
}
