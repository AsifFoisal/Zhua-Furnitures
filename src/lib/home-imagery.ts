/**
 * Central imagery map for the ZHUA "Complete Space" homepage and division pages.
 *
 * ZHUA does not yet have official photography for most of these slots, so every
 * slot carries a `placeholder` describing a brand-styled visual rendered by
 * `<ImagePlaceholder />`. When real photography becomes available, add a `src`
 * (project image or Cloudinary URL) to the slot — components pick it up
 * automatically and no section code needs to change.
 */

export type ImageryMotif =
  | 'room'
  | 'living'
  | 'dining'
  | 'bedroom'
  | 'cabinetry'
  | 'window'
  | 'wall'
  | 'deck'
  | 'outdoor'
  | 'workshop';

export interface ImageryPlaceholder {
  /** Architectural line-art motif drawn over the gradient. */
  motif: ImageryMotif;
  /** Short caption shown as a small tag so slots are clearly marked as placeholders. */
  caption: string;
  /** Gradient tones (dark → light) for the placeholder backdrop. */
  tones: [string, string];
}

export interface ImagerySlot {
  /** Real image URL once official ZHUA photography exists (local /public path or Cloudinary URL). */
  src?: string;
  alt: string;
  placeholder: ImageryPlaceholder;
}

const spaceTones: [string, string] = ['#122A45', '#1E3C5F'];
const warmTones: [string, string] = ['#1A2C40', '#33465C'];
const deepTones: [string, string] = ['#0C1E33', '#163250'];
const outdoorTones: [string, string] = ['#152B3E', '#2C445A'];

export const homeImagery = {
  hero: {
    src: '/images/zhua/hero-complete-living.jpg',
    alt: 'Modern living room with a timber slat feature wall and modular sofa',
    placeholder: { motif: 'room', caption: 'ZHUA complete living space', tones: deepTones },
  },
  divisionFurniture: {
    src: '/images/zhua/furniture-lounge.jpg',
    alt: 'Styled lounge with sofa, armchairs and a gallery wall',
    placeholder: { motif: 'living', caption: 'ZHUA furniture', tones: spaceTones },
  },
  divisionCurtains: {
    src: '/images/zhua/curtains-window-living.jpg',
    alt: 'Bright living room with full-height window treatments',
    placeholder: { motif: 'window', caption: 'ZHUA curtains & blinds', tones: warmTones },
  },
  divisionWallz: {
    src: '/images/zhua/wallz-slat-wall-dark.jpg',
    alt: 'Feature wall with timber slat panelling and integrated lighting',
    placeholder: { motif: 'wall', caption: 'ZHUA WALLZ', tones: deepTones },
  },
  divisionDeckz: {
    src: '/images/zhua/deckz-pool-deck-dusk.jpg',
    alt: 'Pool deck at dusk with outdoor lounge seating',
    placeholder: { motif: 'deck', caption: 'ZHUA DECKZ', tones: outdoorTones },
  },
  furnitureFeatured: {
    src: '/images/zhua/furniture-featured-sofa.jpg',
    alt: 'Open-plan lounge with a large modular sofa',
    placeholder: { motif: 'living', caption: 'Sofas & lounges', tones: spaceTones },
  },
  curtainsVisual: {
    src: '/images/zhua/curtains-sheer-living.jpg',
    alt: 'Sheer curtains dressing a bright living-room window',
    placeholder: { motif: 'window', caption: 'Made-to-measure curtains', tones: warmTones },
  },
  wallzVisual: {
    src: '/images/zhua/wallz-media-wall-warm.jpg',
    alt: 'Warm media wall with a built-in TV niche in a lounge',
    placeholder: { motif: 'wall', caption: 'Feature walls & panelling', tones: deepTones },
  },
  deckzVisual: {
    src: '/images/zhua/deckz-pool-deck-day.jpg',
    alt: 'Pool deck and covered outdoor living area',
    placeholder: { motif: 'outdoor', caption: 'Outdoor living', tones: outdoorTones },
  },
  completeRoom: {
    src: '/images/zhua/complete-room.jpg',
    alt: 'Complete living room with custom sofa, wall finishes and window treatments',
    placeholder: { motif: 'room', caption: 'One room, four ZHUA solutions', tones: deepTones },
  },
  finalCta: {
    src: '/images/zhua/final-cta-architecture.jpg',
    alt: 'Architectural home exterior with timber and dark cladding',
    placeholder: { motif: 'room', caption: 'Your space, next', tones: ['#0A1830', '#122A45'] },
  },
} satisfies Record<string, ImagerySlot>;

export function tileSlot(
  alt: string,
  motif: ImageryMotif,
  caption: string,
  src?: string,
  tones?: [string, string],
): ImagerySlot {
  return { src, alt, placeholder: { motif, caption, tones: tones ?? warmTones } };
}
