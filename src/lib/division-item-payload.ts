import { normalizeCloudinaryImageAsset, type CloudinaryImageAsset } from '@/lib/media';
import type { CatalogKind } from '@/lib/wallz-deckz-catalog';

/**
 * Shared parsing/validation for the optional catalog fields accepted by the
 * admin division-items API (POST + PATCH). Returns only the fields present in
 * the payload, already mapped to their `division_items` column names.
 */
export interface ParsedCatalogFields {
  kind?: CatalogKind;
  starting_price?: number | null;
  cost_materials?: number | null;
  cost_labour?: number | null;
  dimensions?: string | null;
  materials?: string[];
  finishes?: { name: string; hex: string }[];
  inclusions?: string[];
  gallery?: CloudinaryImageAsset[];
  lead_time?: string | null;
  location?: string | null;
  completed_year?: number | null;
}

const HEX_PATTERN = /^#[0-9a-fA-F]{3,8}$/;

function parsePriceField(value: unknown, label: string, errors: string[]): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    errors.push(`${label} must be a positive amount or null.`);
    return undefined;
  }
  return Math.round(value);
}

function parseTextField(value: unknown, label: string, errors: string[]): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    errors.push(`${label} must be text.`);
    return undefined;
  }
  return value.trim() || null;
}

function parseStringList(value: unknown, label: string, errors: string[]): string[] | undefined {
  if (value === undefined) return undefined;
  // Accept either an array of strings or a single newline-separated string.
  const entries = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split('\n')
      : null;

  if (!entries) {
    errors.push(`${label} must be a list of strings.`);
    return undefined;
  }

  return entries
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseFinishList(
  value: unknown,
  label: string,
  errors: string[],
): { name: string; hex: string }[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    errors.push(`${label} must be a list of { name, hex } entries.`);
    return undefined;
  }

  const finishes: { name: string; hex: string }[] = [];
  for (const entry of value) {
    const candidate = entry as { name?: unknown; hex?: unknown };
    const name = typeof candidate?.name === 'string' ? candidate.name.trim() : '';
    const hex = typeof candidate?.hex === 'string' ? candidate.hex.trim() : '';

    if (!name) continue; // silently drop empty rows from the editor
    if (!HEX_PATTERN.test(hex)) {
      errors.push(`${label}: "${name}" needs a hex colour like #B59241.`);
      return undefined;
    }
    finishes.push({ name, hex });
  }
  return finishes;
}

function parseGalleryList(value: unknown, label: string, errors: string[]): CloudinaryImageAsset[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    errors.push(`${label} must be a list of images.`);
    return undefined;
  }

  const assets = value
    .map((entry) => normalizeCloudinaryImageAsset(entry))
    .filter((asset): asset is CloudinaryImageAsset => asset !== null);
  return assets;
}

export function parseCatalogFieldPayload(
  payload: Record<string, unknown>,
  { requireKind = false }: { requireKind?: boolean } = {},
): { fields: ParsedCatalogFields; error?: string } {
  const errors: string[] = [];
  const fields: ParsedCatalogFields = {};

  if (payload.kind !== undefined || requireKind) {
    if (payload.kind === 'completed' || payload.kind === 'concept') {
      fields.kind = payload.kind;
    } else {
      errors.push('Kind must be "completed" or "concept".');
    }
  }

  const startingPrice = parsePriceField(payload.startingPrice, 'Starting price', errors);
  if (startingPrice !== undefined) fields.starting_price = startingPrice;

  const costMaterials = parsePriceField(payload.costMaterials, 'Materials cost', errors);
  if (costMaterials !== undefined) fields.cost_materials = costMaterials;

  const costLabour = parsePriceField(payload.costLabour, 'Labour cost', errors);
  if (costLabour !== undefined) fields.cost_labour = costLabour;

  const dimensions = parseTextField(payload.dimensions, 'Dimensions', errors);
  if (dimensions !== undefined) fields.dimensions = dimensions;

  const materials = parseStringList(payload.materials, 'Materials', errors);
  if (materials !== undefined) fields.materials = materials;

  const finishes = parseFinishList(payload.finishes, 'Finishes', errors);
  if (finishes !== undefined) fields.finishes = finishes;

  const inclusions = parseStringList(payload.inclusions, 'Inclusions', errors);
  if (inclusions !== undefined) fields.inclusions = inclusions;

  const gallery = parseGalleryList(payload.gallery, 'Gallery', errors);
  if (gallery !== undefined) fields.gallery = gallery;

  const leadTime = parseTextField(payload.leadTime, 'Lead time', errors);
  if (leadTime !== undefined) fields.lead_time = leadTime;

  const location = parseTextField(payload.location, 'Location', errors);
  if (location !== undefined) fields.location = location;

  if (payload.completedYear !== undefined) {
    if (payload.completedYear === null) {
      fields.completed_year = null;
    } else if (
      typeof payload.completedYear === 'number' &&
      Number.isFinite(payload.completedYear)
    ) {
      const year = Math.round(payload.completedYear);
      if (year < 1990 || year > 2100) {
        errors.push('Completed year must be a realistic year.');
      } else {
        fields.completed_year = year;
      }
    } else {
      errors.push('Completed year must be a number or null.');
    }
  }

  if (errors.length > 0) {
    return { fields: {}, error: errors[0] };
  }

  return { fields };
}

export function missingCatalogColumnsMessage(error: { code?: string; message?: string }): boolean {
  return (
    error.code === 'PGRST204' ||
    error.code === '42703' ||
    /column .* does not exist|could not find the '(kind|gallery|starting_price)' column/i.test(
      error.message ?? '',
    )
  );
}

export const CATALOG_MIGRATION_HINT =
  'The catalog fields are not in the database yet — run migration 20261114_0017_division_items_catalog_fields.sql in the Supabase SQL editor first.';
