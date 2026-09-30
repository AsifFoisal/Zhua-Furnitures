// Single source of truth for the Curtain Customizer options and pricing.
// The full config lives in store_settings.curtain_customizer_config and is
// editable from the admin dashboard; the customer page falls back to these
// defaults whenever the stored config is missing or partially invalid.

export type CurtainCustomizerFabric = {
  id: string;
  name: string;
  swatch: string;
  pricePerMetre: number;
};

export type CurtainCustomizerHeading = {
  id: string;
  name: string;
  description: string;
  fullness: number;
};

export type CurtainCustomizerLining = {
  id: string;
  name: string;
  pricePerMetre: number;
};

export type CurtainCustomizerLayer = {
  id: string;
  name: string;
  description: string;
  pricePerMetre: number;
  requiresDoubleTrack: boolean;
};

export type CurtainCustomizerTrack = {
  id: string;
  name: string;
  pricePerMetre: number;
  motorisable: boolean;
};

export type CurtainCustomizerInstallation = {
  id: string;
  name: string;
  pricePerWindow: number;
};

export type CurtainCustomizerColor = {
  id: string;
  name: string;
  hex: string;
};

export type CurtainCustomizerConfig = {
  enabled: boolean;
  makingChargePerCmDrop: number;
  motorPrice: number;
  fabrics: CurtainCustomizerFabric[];
  headings: CurtainCustomizerHeading[];
  linings: CurtainCustomizerLining[];
  layers: CurtainCustomizerLayer[];
  tracks: CurtainCustomizerTrack[];
  installations: CurtainCustomizerInstallation[];
  colors: CurtainCustomizerColor[];
};

export function slugifyId(value: string, fallback: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

function toPositiveNumber(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : fallback;
}

function toHexColor(value: unknown, fallback: string): string {
  const str = String(value ?? '').trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(str) ? str : fallback;
}

function normalizeList<T>(
  value: unknown,
  fallback: T[],
  mapItem: (raw: Record<string, unknown>, index: number) => T | null
): T[] {
  if (!Array.isArray(value)) return fallback;
  const mapped = value
    .map((item, index) =>
      item && typeof item === 'object' ? mapItem(item as Record<string, unknown>, index) : null
    )
    .filter((item): item is T => item !== null);
  return mapped.length > 0 ? mapped : fallback;
}

export function normalizeCurtainCustomizerConfig(value: unknown): CurtainCustomizerConfig {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const defaults = DEFAULT_CURTAIN_CUSTOMIZER_CONFIG;

  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : defaults.enabled,
    makingChargePerCmDrop: toPositiveNumber(raw.makingChargePerCmDrop, defaults.makingChargePerCmDrop),
    motorPrice: toPositiveNumber(raw.motorPrice, defaults.motorPrice),
    fabrics: normalizeList<CurtainCustomizerFabric>(raw.fabrics, defaults.fabrics, (item, index) => {
      const name = String(item.name ?? '').trim();
      if (!name) return null;
      return {
        id: slugifyId(String(item.id ?? name), `fabric-${index}`),
        name,
        swatch: toHexColor(item.swatch, defaults.fabrics[0].swatch),
        pricePerMetre: toPositiveNumber(item.pricePerMetre, 0),
      };
    }),
    headings: normalizeList<CurtainCustomizerHeading>(raw.headings, defaults.headings, (item, index) => {
      const name = String(item.name ?? '').trim();
      if (!name) return null;
      return {
        id: slugifyId(String(item.id ?? name), `heading-${index}`),
        name,
        description: String(item.description ?? '').trim(),
        fullness: toPositiveNumber(item.fullness, 2) || 2,
      };
    }),
    linings: normalizeList<CurtainCustomizerLining>(raw.linings, defaults.linings, (item, index) => {
      const name = String(item.name ?? '').trim();
      if (!name) return null;
      return {
        id: slugifyId(String(item.id ?? name), `lining-${index}`),
        name,
        pricePerMetre: toPositiveNumber(item.pricePerMetre, 0),
      };
    }),
    layers: normalizeList<CurtainCustomizerLayer>(raw.layers, defaults.layers, (item, index) => {
      const name = String(item.name ?? '').trim();
      if (!name) return null;
      return {
        id: slugifyId(String(item.id ?? name), `layer-${index}`),
        name,
        description: String(item.description ?? '').trim(),
        pricePerMetre: toPositiveNumber(item.pricePerMetre, 0),
        requiresDoubleTrack: item.requiresDoubleTrack === true,
      };
    }),
    tracks: normalizeList<CurtainCustomizerTrack>(raw.tracks, defaults.tracks, (item, index) => {
      const name = String(item.name ?? '').trim();
      if (!name) return null;
      return {
        id: slugifyId(String(item.id ?? name), `track-${index}`),
        name,
        pricePerMetre: toPositiveNumber(item.pricePerMetre, 0),
        motorisable: item.motorisable === true,
      };
    }),
    installations: normalizeList<CurtainCustomizerInstallation>(
      raw.installations,
      defaults.installations,
      (item, index) => {
        const name = String(item.name ?? '').trim();
        if (!name) return null;
        return {
          id: slugifyId(String(item.id ?? name), `installation-${index}`),
          name,
          pricePerWindow: toPositiveNumber(item.pricePerWindow, 0),
        };
      }
    ),
    colors: normalizeList<CurtainCustomizerColor>(raw.colors, defaults.colors, (item, index) => {
      const name = String(item.name ?? '').trim();
      if (!name) return null;
      return {
        id: slugifyId(String(item.id ?? name), `color-${index}`),
        name,
        hex: toHexColor(item.hex, defaults.colors[0].hex),
      };
    }),
  };
}

export const DEFAULT_CURTAIN_CUSTOMIZER_CONFIG: CurtainCustomizerConfig = {
  enabled: true,
  makingChargePerCmDrop: 2.5,
  motorPrice: 2950,
  fabrics: [
    { id: 'linen', name: 'Linen Blend', swatch: '#D4C4A8', pricePerMetre: 180 },
    { id: 'velvet', name: 'Premium Velvet', swatch: '#8B6B8B', pricePerMetre: 280 },
    { id: 'sheer-voile', name: 'Voile Sheer', swatch: '#F0EDE8', pricePerMetre: 120 },
    { id: 'blockout', name: 'Block-Out', swatch: '#4A4A4A', pricePerMetre: 220 },
    { id: 'jacquard', name: 'Jacquard', swatch: '#C4A882', pricePerMetre: 350 },
    { id: 'cotton', name: 'Cotton Canvas', swatch: '#E8D8B8', pricePerMetre: 160 },
    { id: 'chenille', name: 'Chenille', swatch: '#8B7B6B', pricePerMetre: 240 },
    { id: 'silk-look', name: 'Faux Silk', swatch: '#C8BAA0', pricePerMetre: 300 },
  ],
  headings: [
    { id: 'eyelet', name: 'Eyelet', description: 'Clean, modern rings', fullness: 2 },
    { id: 'pinch-pleat', name: 'Pinch Pleat', description: 'Classic tailored look', fullness: 2.3 },
    { id: 'wave', name: 'S-Fold Wave', description: 'Flowing, uniform folds', fullness: 2 },
    { id: 'tab-top', name: 'Tab Top', description: 'Casual, relaxed style', fullness: 1.8 },
    { id: 'pencil-pleat', name: 'Pencil Pleat', description: 'Traditional gathered look', fullness: 2.2 },
  ],
  linings: [
    { id: 'none', name: 'No Lining', pricePerMetre: 0 },
    { id: 'thermal', name: 'Thermal Lining', pricePerMetre: 45 },
    { id: 'blockout-lining', name: 'Block-Out Lining', pricePerMetre: 65 },
    { id: 'interlined', name: 'Interlined (Premium)', pricePerMetre: 120 },
  ],
  layers: [
    { id: 'decorative', name: 'Decorative Only', description: 'Main curtain fabric on its own', pricePerMetre: 0, requiresDoubleTrack: false },
    { id: 'sheer', name: '+ Sheer Layer', description: 'Adds a sheer underlay (double track recommended)', pricePerMetre: 120, requiresDoubleTrack: true },
    { id: 'blockout', name: '+ Blockout Layer', description: 'Adds a blockout underlay for room darkening', pricePerMetre: 95, requiresDoubleTrack: false },
    { id: 'sheer-blockout', name: 'Sheer + Blockout', description: 'Full double-layer setup (double track)', pricePerMetre: 215, requiresDoubleTrack: true },
  ],
  tracks: [
    { id: 'track', name: 'Standard Track', pricePerMetre: 420, motorisable: true },
    { id: 'rod', name: 'Decorative Rod', pricePerMetre: 380, motorisable: false },
  ],
  installations: [
    { id: 'none', name: 'No Installation (DIY)', pricePerWindow: 0 },
    { id: 'professional', name: 'Professional Installation', pricePerWindow: 450 },
    { id: 'measure-check', name: 'Installation + Measure Check', pricePerWindow: 650 },
  ],
  colors: [
    { id: 'stone-beige', name: 'Stone Beige', hex: '#C8BCA8' },
    { id: 'ivory-white', name: 'Ivory White', hex: '#F0EAD6' },
    { id: 'rust-terracotta', name: 'Rust Terracotta', hex: '#B85C38' },
    { id: 'sage-green', name: 'Sage Green', hex: '#7A9E7E' },
    { id: 'midnight-navy', name: 'Midnight Navy', hex: '#2C3E6B' },
    { id: 'charcoal', name: 'Charcoal', hex: '#3A3530' },
    { id: 'pale-blush', name: 'Pale Blush', hex: '#E8C4B8' },
    { id: 'warm-gold', name: 'Warm Gold', hex: '#C9A84C' },
  ],
};
