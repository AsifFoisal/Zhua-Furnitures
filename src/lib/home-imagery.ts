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
    alt: 'Complete ZHUA living space with custom sofa, sheer curtains and a feature wall',
    placeholder: { motif: 'room', caption: 'ZHUA complete living space', tones: deepTones },
  },
  divisionFurniture: {
    alt: 'Styled ZHUA lounge with a custom modular sofa',
    placeholder: { motif: 'living', caption: 'ZHUA furniture', tones: spaceTones },
  },
  divisionCurtains: {
    alt: 'Floor-to-ceiling ZHUA curtains dressing a large window',
    placeholder: { motif: 'window', caption: 'ZHUA curtains & blinds', tones: warmTones },
  },
  divisionWallz: {
    alt: 'ZHUA WALLZ feature wall with decorative slat panelling',
    placeholder: { motif: 'wall', caption: 'ZHUA WALLZ', tones: deepTones },
  },
  divisionDeckz: {
    alt: 'ZHUA DECKZ outdoor entertainment deck at dusk',
    placeholder: { motif: 'deck', caption: 'ZHUA DECKZ', tones: outdoorTones },
  },
  furnitureFeatured: {
    alt: 'Statement ZHUA modular sofa in a styled living room',
    placeholder: { motif: 'living', caption: 'Sofas & lounges', tones: spaceTones },
  },
  curtainsVisual: {
    alt: 'Layered sheer and blockout ZHUA curtains in a finished room',
    placeholder: { motif: 'window', caption: 'Made-to-measure curtains', tones: warmTones },
  },
  wallzVisual: {
    alt: 'ZHUA WALLZ feature wall transforming a lounge',
    placeholder: { motif: 'wall', caption: 'Feature walls & panelling', tones: deepTones },
  },
  deckzVisual: {
    alt: 'ZHUA DECKZ entertainment area with custom outdoor seating',
    placeholder: { motif: 'outdoor', caption: 'Outdoor living', tones: outdoorTones },
  },
  completeRoom: {
    alt: 'Complete room showing ZHUA furniture, curtains, WALLZ feature wall and DECKZ outdoor space',
    placeholder: { motif: 'room', caption: 'One room, four ZHUA solutions', tones: deepTones },
  },
  finalCta: {
    alt: 'Architectural ZHUA interior at dusk',
    placeholder: { motif: 'room', caption: 'Your space, next', tones: ['#0A1830', '#122A45'] },
  },
} satisfies Record<string, ImagerySlot>;

export function tileSlot(alt: string, motif: ImageryMotif, caption: string, tones?: [string, string]): ImagerySlot {
  return { alt, placeholder: { motif, caption, tones: tones ?? warmTones } };
}
