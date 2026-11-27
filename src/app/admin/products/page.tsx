'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/admin-data';
import { fabricOptions, headingStyles } from '@/lib/data';
import { useToastFeedback } from '@/lib/toast-feedback';
import styles from '../admin-pages.module.css';

type AdminCategory = 'Furniture' | 'Curtains' | 'Accessories';
type AdminStatus = 'Active' | 'Draft' | 'Archived';
type AdminBadge = 'new' | 'sale' | 'custom' | 'bestseller' | null;

interface CloudinaryImageAsset {
  publicId: string;
  secureUrl: string;
  alt: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  createdAt?: string;
}

interface AdminProductColor {
  name: string;
  hex: string;
  images: CloudinaryImageAsset[];
}

interface AdminProductRow {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category: AdminCategory;
  subcategory: string;
  stock: number;
  price: number;
  offerPrice: number;
  originalPrice: number | null;
  offerPercentage: number;
  badge: AdminBadge;
  description: string;
  longDescription: string;
  deliveryDays: string;
  weightKg: number;
  widthCm: number;
  depthCm: number;
  heightCm: number;
  status: AdminStatus;
  colors: AdminProductColor[];
  sizes: string[];
  fabrics: string[];
  lightFiltration: string[];
  topStyles: string[];
  images: CloudinaryImageAsset[];
  primaryImage: string | null;
  imageCount: number;
  modelUrl: string | null;
}

/**
 * Unified shape for the create & edit product form — every numeric input is a
 * string so the fields behave identically in both modes and empty inputs stay
 * empty instead of flashing "0".
 */
interface ProductFormValues {
  sku: string;
  slug: string;
  name: string;
  category: AdminCategory;
  subcategory: string;
  status: AdminStatus;
  badge: AdminBadge;
  price: string;
  offerPercentage: string;
  discountPrice: string;
  stock: string;
  description: string;
  longDescription: string;
  deliveryDays: string;
  weightKg: string;
  widthCm: string;
  depthCm: string;
  heightCm: string;
  colors: AdminProductColor[];
  sizes: string[];
  /** Structured curtain measurements — serialised into `sizes` on save. */
  measurements: CurtainMeasurementValue[];
  fabrics: string[];
  lightFiltration: string[];
  topStyles: string[];
  images: CloudinaryImageAsset[];
}

type MeasurementUnit = 'cm' | 'in' | 'ft';

interface CurtainMeasurementValue {
  width: string;
  drop: string;
  unit: MeasurementUnit;
  /** Legacy free-text size entry that is not a width × drop pair. */
  label?: string;
}

const DEFAULT_COLOR_HEX = 'var(--gold)';

const CURTAIN_FABRIC_SUGGESTIONS = fabricOptions.map((fabric) => fabric.name);
const CURTAIN_LIGHT_FILTRATION_SUGGESTIONS = [
  'Sheer',
  'Light Filtering',
  'Room Darkening',
  'Blockout',
  'Sheer + Blockout',
];
const CURTAIN_TOP_STYLE_SUGGESTIONS = headingStyles.map((style) => style.name);
/**
 * Common panel sizes in width × drop order (the convention curtain makers
 * quote in). "Made to measure" covers products sold purely custom so the
 * storefront card still shows a measurement.
 */
const CURTAIN_SIZE_SUGGESTIONS = [
  '140 × 220 cm',
  '180 × 220 cm',
  '220 × 260 cm',
  '260 × 260 cm',
  '300 × 260 cm',
  'Made to measure',
];

const MEASUREMENT_UNITS: { value: MeasurementUnit; label: string }[] = [
  { value: 'cm', label: 'cm' },
  { value: 'in', label: 'inches' },
  { value: 'ft', label: 'feet' },
];

const MEASUREMENT_UNIT_ALIASES: Record<string, MeasurementUnit> = {
  cm: 'cm',
  cms: 'cm',
  centimeter: 'cm',
  centimeters: 'cm',
  centimetre: 'cm',
  centimetres: 'cm',
  in: 'in',
  inch: 'in',
  inches: 'in',
  '"': 'in',
  '”': 'in',
  ft: 'ft',
  foot: 'ft',
  feet: 'ft',
  "'": 'ft',
};

/**
 * Parses a saved size such as "220 × 260 cm", "55 × 87 in" or "5.5 × 7 ft"
 * back into the structured row. Anything that is not a width × drop pair
 * (e.g. "Made to measure") becomes a free-text label row so existing values
 * are never dropped on edit.
 */
function parseMeasurementValue(raw: string): CurtainMeasurementValue {
  const value = raw.trim();
  const match = value.match(
    /^(\d+(?:[.,]\d+)?)\s*(cm|cms|centimet(?:er|re)s?|in|inch(?:es)?|"|”|ft|feet|foot|')?\s*[×xX*]\s*(\d+(?:[.,]\d+)?)\s*(cm|cms|centimet(?:er|re)s?|in|inch(?:es)?|"|”|ft|feet|foot|')?$/i
  );

  if (!match) {
    return { width: '', drop: '', unit: 'cm', label: value };
  }

  const unit = (match[4] || match[2] || 'cm').toLowerCase();

  return {
    width: match[1].replace(',', '.'),
    drop: match[3].replace(',', '.'),
    unit: MEASUREMENT_UNIT_ALIASES[unit] ?? 'cm',
  };
}

function parseMeasurements(sizes: string[]): CurtainMeasurementValue[] {
  return sizes
    .filter((entry) => typeof entry === 'string' && entry.trim().length > 0)
    .map(parseMeasurementValue);
}

function normalizeMeasurementDimension(value: string): string {
  const parsed = Number(value.trim().replace(',', '.'));

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return '';
  }

  return String(parsed);
}

/** One row → the storefront-facing string, or '' when the row is incomplete. */
function serializeMeasurement(row: CurtainMeasurementValue): string {
  if (typeof row.label === 'string' && row.label.trim().length > 0) {
    return row.label.trim();
  }

  const width = normalizeMeasurementDimension(row.width);
  const drop = normalizeMeasurementDimension(row.drop);

  if (!width || !drop) {
    return '';
  }

  return `${width} × ${drop} ${row.unit}`;
}

function serializeMeasurements(rows: CurtainMeasurementValue[]): string[] {
  return normalizeStringList(rows.map(serializeMeasurement));
}

function isCurtainCategory(category: AdminCategory): boolean {
  return category === 'Curtains';
}

/** Percentage saved when a curtain product has an explicit discount price. */
function curtainDiscountPercentage(price: string, discountPrice: string): number {
  const base = Number(price) || 0;
  const discount = Number(discountPrice) || 0;

  if (base <= 0 || discount <= 0 || discount >= base) {
    return 0;
  }

  return Math.round(((base - discount) / base) * 10000) / 100;
}

function toSafeColorHex(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) {
    return DEFAULT_COLOR_HEX;
  }

  return raw.toUpperCase();
}

function normalizeColorImages(value: unknown): CloudinaryImageAsset[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry): CloudinaryImageAsset | null => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const item = entry as Record<string, unknown>;
      const publicId = typeof item.publicId === 'string' ? item.publicId.trim() : '';
      const secureUrl = typeof item.secureUrl === 'string' ? item.secureUrl.trim() : '';
      if (!publicId || !secureUrl) {
        return null;
      }

      return {
        publicId,
        secureUrl,
        alt: typeof item.alt === 'string' ? item.alt : '',
        width: typeof item.width === 'number' ? item.width : undefined,
        height: typeof item.height === 'number' ? item.height : undefined,
        format: typeof item.format === 'string' ? item.format : undefined,
        bytes: typeof item.bytes === 'number' ? item.bytes : undefined,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
      };
    })
    .filter((entry): entry is CloudinaryImageAsset => entry !== null);
}

function normalizeProductColors(value: unknown): AdminProductColor[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const item = entry as Record<string, unknown>;
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      if (!name) {
        return null;
      }

      return {
        name,
        hex: toSafeColorHex(item.hex),
        images: normalizeColorImages(item.images),
      };
    })
    .filter((entry): entry is AdminProductColor => entry !== null);
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0);
}

const defaultNewProduct: ProductFormValues = {
  sku: '',
  slug: '',
  name: '',
  category: 'Furniture',
  subcategory: 'General',
  status: 'Active',
  badge: null,
  price: '',
  offerPercentage: '',
  discountPrice: '',
  stock: '',
  description: '',
  longDescription: '',
  deliveryDays: '7-10 business days',
  weightKg: '',
  widthCm: '',
  depthCm: '',
  heightCm: '',
  colors: [],
  sizes: [],
  measurements: [],
  fabrics: [],
  lightFiltration: [],
  topStyles: [],
  images: [],
};

/** Row → form values (numbers become strings, ready for the unified form). */
function formValuesFromRow(row: AdminProductRow): ProductFormValues {
  return {
    sku: row.sku,
    slug: row.slug,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    status: row.status,
    badge: row.badge,
    price: String(row.price),
    offerPercentage: String(row.offerPercentage),
    discountPrice: row.offerPercentage > 0 ? String(row.offerPrice) : '',
    stock: String(row.stock),
    description: row.description,
    longDescription: row.longDescription,
    deliveryDays: row.deliveryDays,
    weightKg: String(row.weightKg),
    widthCm: String(row.widthCm),
    depthCm: String(row.depthCm),
    heightCm: String(row.heightCm),
    colors: row.colors.map((color) => ({
      ...color,
      images: (color.images ?? []).map((image) => ({ ...image })),
    })),
    sizes: [...row.sizes],
    measurements: parseMeasurements(row.sizes),
    fabrics: [...row.fabrics],
    lightFiltration: [...(row.lightFiltration ?? [])],
    topStyles: [...(row.topStyles ?? [])],
    images: row.images.map((image) => ({ ...image })),
  };
}

function toSafeMeasure(value: unknown): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.round(parsed * 100) / 100);
}

function clampOfferPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value * 100) / 100));
}

function calculateOfferPrice(basePrice: number, offerPercentage: number): number {
  const safeBasePrice = Number.isFinite(basePrice) ? Math.max(0, basePrice) : 0;
  const safeOfferPercentage = clampOfferPercentage(offerPercentage);

  return Math.max(0, Math.round(safeBasePrice * ((100 - safeOfferPercentage) / 100)));
}

/** Price/offer edits auto-manage the sale badge, mirroring the server rules. */
function withOffer(
  values: ProductFormValues,
  nextPrice: string,
  nextOfferPercentage: string
): ProductFormValues {
  const pct = clampOfferPercentage(Number(nextOfferPercentage) || 0);
  const badge =
    pct > 0
      ? values.badge ?? 'sale'
      : values.badge === 'sale'
        ? null
        : values.badge;

  return {
    ...values,
    price: nextPrice,
    offerPercentage: nextOfferPercentage,
    badge,
  };
}

/** Price/discount edits auto-manage the sale badge for curtain products. */
function withCurtainDiscount(
  values: ProductFormValues,
  nextPrice: string,
  nextDiscountPrice: string
): ProductFormValues {
  const hasDiscount = curtainDiscountPercentage(nextPrice, nextDiscountPrice) > 0;
  const badge = hasDiscount
    ? values.badge ?? 'sale'
    : values.badge === 'sale'
      ? null
      : values.badge;

  return {
    ...values,
    price: nextPrice,
    discountPrice: nextDiscountPrice,
    badge,
  };
}

/**
 * Carry the discount across category switches so the admin does not have to
 * re-enter it: curtains use an explicit discount price, other categories use
 * an offer percentage.
 */
function withCategory(values: ProductFormValues, nextCategory: AdminCategory): ProductFormValues {
  if (nextCategory === values.category) {
    return values;
  }

  const leavingCurtains = isCurtainCategory(values.category);
  const enteringCurtains = isCurtainCategory(nextCategory);

  if (enteringCurtains) {
    const percentage = clampOfferPercentage(Number(values.offerPercentage) || 0);
    return {
      ...values,
      category: nextCategory,
      measurements: parseMeasurements(values.sizes),
      discountPrice:
        percentage > 0
          ? String(calculateOfferPrice(Number(values.price) || 0, percentage))
          : '',
    };
  }

  if (leavingCurtains) {
    const percentage = curtainDiscountPercentage(values.price, values.discountPrice);
    return {
      ...values,
      category: nextCategory,
      sizes: serializeMeasurements(values.measurements),
      offerPercentage: percentage > 0 ? String(percentage) : '',
    };
  }

  return { ...values, category: nextCategory };
}

function normalizeProductRow(row: AdminProductRow): AdminProductRow {
  const safeBasePrice = Number.isFinite(row.price) ? Math.max(0, row.price) : 0;
  const safeOfferPercentage = clampOfferPercentage(Number(row.offerPercentage ?? 0));
  const nextOfferPrice =
    Number.isFinite(row.offerPrice) && row.offerPrice >= 0
      ? Math.round(row.offerPrice)
      : calculateOfferPrice(safeBasePrice, safeOfferPercentage);

  const nextBadge =
    safeOfferPercentage > 0
      ? row.badge ?? 'sale'
      : row.badge === 'sale'
        ? null
        : row.badge;

  return {
    ...row,
    sku: row.sku ?? '',
    slug: row.slug ?? '',
    subcategory: row.subcategory?.trim() || 'General',
    price: Math.round(safeBasePrice),
    offerPrice: nextOfferPrice,
    originalPrice: safeOfferPercentage > 0 ? Math.round(safeBasePrice) : null,
    offerPercentage: safeOfferPercentage,
    badge: nextBadge,
    description: row.description ?? '',
    longDescription: row.longDescription ?? '',
    deliveryDays: row.deliveryDays?.trim() || '7-10 business days',
    weightKg: toSafeMeasure(row.weightKg),
    widthCm: toSafeMeasure(row.widthCm),
    depthCm: toSafeMeasure(row.depthCm),
    heightCm: toSafeMeasure(row.heightCm),
    colors: normalizeProductColors(row.colors),
    sizes: normalizeStringList(row.sizes),
    fabrics: normalizeStringList(row.fabrics),
    lightFiltration: normalizeStringList(row.lightFiltration),
    topStyles: normalizeStringList(row.topStyles),
    images: Array.isArray(row.images) ? row.images : [],
    primaryImage: row.primaryImage ?? null,
    imageCount: Number.isFinite(row.imageCount) ? row.imageCount : row.images?.length ?? 0,
    modelUrl: typeof row.modelUrl === 'string' && row.modelUrl.trim().length > 0 ? row.modelUrl : null,
  };
}

function buildSavePayload(values: ProductFormValues) {
  const isCurtain = isCurtainCategory(values.category);
  const price = Math.max(0, Math.round(Number(values.price) || 0));
  const discountPercentage = isCurtain
    ? curtainDiscountPercentage(values.price, values.discountPrice)
    : 0;

  return {
    sku: values.sku.trim(),
    slug: values.slug.trim(),
    name: values.name.trim(),
    category: values.category,
    subcategory: values.subcategory.trim() || 'General',
    status: values.status,
    badge: values.badge,
    price,
    // Curtains price per metre with an explicit discount price; the other
    // categories keep the percentage-based offer model.
    ...(isCurtain
      ? {
          discountPrice:
            discountPercentage > 0
              ? Math.round((Number(values.discountPrice) || 0) * 100) / 100
              : null,
        }
      : { offerPercentage: clampOfferPercentage(Number(values.offerPercentage) || 0) }),
    stock: Math.max(0, Math.round(Number(values.stock) || 0)),
    description: values.description.trim(),
    longDescription: values.longDescription.trim(),
    deliveryDays: values.deliveryDays.trim() || '7-10 business days',
    weightKg: toSafeMeasure(values.weightKg),
    widthCm: toSafeMeasure(values.widthCm),
    depthCm: toSafeMeasure(values.depthCm),
    heightCm: toSafeMeasure(values.heightCm),
    colors: normalizeProductColors(values.colors),
    sizes: isCurtain
      ? serializeMeasurements(values.measurements)
      : normalizeStringList(values.sizes),
    fabrics: normalizeStringList(values.fabrics),
    ...(isCurtain
      ? {
          lightFiltration: normalizeStringList(values.lightFiltration),
          topStyles: normalizeStringList(values.topStyles),
        }
      : {}),
    images: values.images,
  };
}

function validateImageFiles(files: File[]): string | null {
  if (files.some((file) => !file.type.startsWith('image/'))) {
    return 'Only image files are allowed.';
  }

  if (files.some((file) => file.size > 10 * 1024 * 1024)) {
    return 'Max file size is 10MB.';
  }

  return null;
}

async function uploadImageAsset(file: File, baseName: string): Promise<CloudinaryImageAsset> {
  const validationError = validateImageFiles([file]);
  if (validationError) {
    throw new Error(validationError);
  }

  const signRes = await fetch('/api/admin/media/sign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      folder: 'zhua/products',
      baseName,
    }),
  });

  const signData = (await signRes.json()) as {
    cloudName?: string;
    apiKey?: string;
    timestamp?: number;
    signature?: string;
    folder?: string;
    publicId?: string;
    uploadUrl?: string;
    error?: string;
  };

  if (
    !signRes.ok ||
    !signData.uploadUrl ||
    !signData.apiKey ||
    !signData.signature ||
    !signData.timestamp
  ) {
    throw new Error(signData.error ?? 'Could not prepare upload.');
  }

  const uploadBody = new FormData();
  uploadBody.append('file', file);
  uploadBody.append('api_key', signData.apiKey);
  uploadBody.append('timestamp', String(signData.timestamp));
  uploadBody.append('signature', signData.signature);
  uploadBody.append('folder', signData.folder ?? 'zhua/products');
  uploadBody.append('public_id', signData.publicId ?? 'asset');

  const uploadRes = await fetch(signData.uploadUrl, {
    method: 'POST',
    body: uploadBody,
  });

  const uploadData = (await uploadRes.json()) as {
    secure_url?: string;
    public_id?: string;
    width?: number;
    height?: number;
    format?: string;
    bytes?: number;
    error?: { message?: string };
  };

  if (!uploadRes.ok || !uploadData.secure_url || !uploadData.public_id) {
    throw new Error(uploadData.error?.message ?? 'Cloudinary upload failed.');
  }

  return {
    publicId: uploadData.public_id,
    secureUrl: uploadData.secure_url,
    alt: baseName,
    width: uploadData.width,
    height: uploadData.height,
    format: uploadData.format,
    bytes: uploadData.bytes,
    createdAt: new Date().toISOString(),
  };
}

/* ============================================================
   Field editors (colours, string lists, 3D model)
   ============================================================ */

interface ProductColorFieldsProps {
  colors: AdminProductColor[];
  onChange: (colors: AdminProductColor[]) => void;
  uploadBaseName: string;
  galleryImages?: CloudinaryImageAsset[];
}

function ProductColorFields({
  colors,
  onChange,
  uploadBaseName,
  galleryImages = [],
}: ProductColorFieldsProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const rows = colors.length > 0 ? colors : [];

  const updateRow = (index: number, patch: Partial<AdminProductColor>) => {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    onChange([...rows, { name: '', hex: DEFAULT_COLOR_HEX, images: [] }]);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  };

  const removeImage = (index: number, publicId: string) => {
    updateRow(index, {
      images: (rows[index]?.images ?? []).filter((image) => image.publicId !== publicId),
    });
  };

  const toggleGalleryImage = (index: number, image: CloudinaryImageAsset) => {
    const images = rows[index]?.images ?? [];
    const isAttached = images.some((entry) => entry.publicId === image.publicId);

    updateRow(index, {
      images: isAttached
        ? images.filter((entry) => entry.publicId !== image.publicId)
        : [...images, image],
    });
  };

  const uploadColorImages = async (index: number, files: FileList) => {
    const list = Array.from(files);
    if (list.length === 0) {
      return;
    }

    const validationError = validateImageFiles(list);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploadingIndex(index);
    try {
      const assets: CloudinaryImageAsset[] = [];
      for (const file of list) {
        assets.push(await uploadImageAsset(file, uploadBaseName.trim() || 'product'));
      }

      onChange(
        rows.map((row, rowIndex) =>
          rowIndex === index
            ? { ...row, images: [...(row.images ?? []), ...assets] }
            : row
        )
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not upload image.');
    } finally {
      setUploadingIndex(null);
    }
  };

  if (rows.length === 0) {
    return (
      <button className={styles.ghostButton} type="button" onClick={addRow}>
        + Add colour option
      </button>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '0.55rem' }}>
      {rows.map((color, index) => (
        <div
          key={index}
          style={{
            display: 'grid',
            gap: '0.5rem',
            padding: '0.65rem',
            border: '1px solid var(--border-light)',
            borderRadius: '10px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 170px) auto',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            <input
              className={styles.input}
              placeholder="Colour name"
              value={color.name}
              onChange={(event) => updateRow(index, { name: event.target.value })}
            />
            <input
              className={styles.input}
              type="color"
              aria-label={`Select swatch colour ${index + 1}`}
              value={toSafeColorHex(color.hex)}
              onChange={(event) => updateRow(index, { hex: event.target.value })}
              style={{ minHeight: '40px', padding: '0.15rem' }}
            />
            <button
              className={styles.ghostButton}
              type="button"
              onClick={() => removeRow(index)}
            >
              Remove
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            {(color.images ?? []).map((image) => (
              <span key={image.publicId} className={styles.thumbBox}>
                <img
                  src={image.secureUrl}
                  alt={`${color.name || 'Colour'} preview`}
                  style={{
                    width: '52px',
                    height: '52px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light)',
                    display: 'block',
                  }}
                />
                <button
                  type="button"
                  aria-label={`Remove ${color.name || 'colour'} image`}
                  className={styles.thumbRemove}
                  onClick={() => removeImage(index, image.publicId)}
                >
                  ×
                </button>
              </span>
            ))}
            <label
              className={styles.ghostButton}
              style={{ cursor: uploadingIndex === index ? 'wait' : 'pointer' }}
            >
              {uploadingIndex === index ? 'Uploading...' : 'Add image'}
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                disabled={uploadingIndex !== null}
                onChange={(event) => {
                  const files = event.currentTarget.files;
                  if (files) {
                    void uploadColorImages(index, files);
                  }
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </div>

          {galleryImages.length > 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                flexWrap: 'wrap',
                borderTop: '1px dashed var(--border-light)',
                paddingTop: '0.5rem',
              }}
            >
              <span className={styles.fieldHint}>Attach from product images:</span>
              {galleryImages.map((image) => {
                const isAttached = (color.images ?? []).some(
                  (entry) => entry.publicId === image.publicId
                );

                return (
                  <button
                    key={image.publicId}
                    type="button"
                    onClick={() => toggleGalleryImage(index, image)}
                    aria-pressed={isAttached}
                    aria-label={
                      isAttached
                        ? `Detach gallery image from ${color.name || 'colour'}`
                        : `Attach gallery image to ${color.name || 'colour'}`
                    }
                    title={isAttached ? 'Attached — click to detach' : 'Click to attach'}
                    style={{
                      padding: 0,
                      border: isAttached
                        ? '2px solid var(--gold)'
                        : '2px solid var(--border-light)',
                      borderRadius: '6px',
                      background: 'none',
                      cursor: 'pointer',
                      lineHeight: 0,
                    }}
                  >
                    <img
                      src={image.secureUrl}
                      alt=""
                      style={{
                        width: '44px',
                        height: '44px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        opacity: isAttached ? 1 : 0.6,
                        display: 'block',
                      }}
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ))}
      <div>
        <button className={styles.ghostButton} type="button" onClick={addRow}>
          + Add colour option
        </button>
      </div>
    </div>
  );
}

interface ProductStringListFieldsProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  addLabel: string;
  /** Quick-add chips for common industry values. */
  suggestions?: string[];
}

function ProductStringListFields({
  values,
  onChange,
  placeholder,
  addLabel,
  suggestions = [],
}: ProductStringListFieldsProps) {
  const rows = values.length > 0 ? values : [];

  const updateRow = (index: number, value: string) => {
    onChange(rows.map((entry, entryIndex) => (entryIndex === index ? value : entry)));
  };

  const addRow = () => {
    onChange([...rows, '']);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, entryIndex) => entryIndex !== index));
  };

  const toggleSuggestion = (suggestion: string) => {
    onChange(
      rows.includes(suggestion)
        ? rows.filter((entry) => entry !== suggestion)
        : [...rows, suggestion]
    );
  };

  const visibleRows = rows.filter((value) => value.trim().length > 0);
  const unusedSuggestions = suggestions.filter(
    (suggestion) => !visibleRows.some((value) => value.toLowerCase() === suggestion.toLowerCase())
  );

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      {rows.map((value, index) => (
        <div
          key={index}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          <input
            className={styles.input}
            placeholder={placeholder}
            value={value}
            onChange={(event) => updateRow(index, event.target.value)}
          />
          <button
            className={styles.ghostButton}
            type="button"
            onClick={() => removeRow(index)}
          >
            Remove
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button className={styles.ghostButton} type="button" onClick={addRow}>
          + {addLabel}
        </button>
        {unusedSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            className={styles.ghostButton}
            type="button"
            onClick={() => toggleSuggestion(suggestion)}
            title={`Add ${suggestion}`}
          >
            + {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ProductMeasurementFieldsProps {
  values: CurtainMeasurementValue[];
  onChange: (values: CurtainMeasurementValue[]) => void;
}

const MEASUREMENT_ROW_GRID = 'minmax(0, 1fr) minmax(0, 1fr) 108px auto';

/**
 * Curtain sizes as explicit Width × Drop rows, each with its own unit. The
 * rows are serialised into the shared `sizes` column on save so the product
 * page and storefront cards keep working unchanged.
 */
function ProductMeasurementFields({ values, onChange }: ProductMeasurementFieldsProps) {
  const updateRow = (index: number, patch: Partial<CurtainMeasurementValue>) => {
    onChange(
      values.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
    );
  };

  const addRow = (row: CurtainMeasurementValue = { width: '', drop: '', unit: 'cm' }) => {
    onChange([...values, row]);
  };

  const removeRow = (index: number) => {
    onChange(values.filter((_, rowIndex) => rowIndex !== index));
  };

  const savedValues = serializeMeasurements(values);
  const unusedSuggestions = CURTAIN_SIZE_SUGGESTIONS.filter(
    (suggestion) => !savedValues.some((value) => value.toLowerCase() === suggestion.toLowerCase())
  );

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      {values.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: MEASUREMENT_ROW_GRID,
            gap: '0.5rem',
          }}
        >
          <span className={styles.label}>Width</span>
          <span className={styles.label}>Drop</span>
          <span className={styles.label}>Unit</span>
          <span aria-hidden="true" />
        </div>
      ) : null}

      {values.map((row, index) => (
        <div
          key={index}
          style={{
            display: 'grid',
            gridTemplateColumns: MEASUREMENT_ROW_GRID,
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          {row.label !== undefined ? (
            <>
              <input
                className={styles.input}
                style={{ gridColumn: '1 / 4' }}
                placeholder="e.g. Made to measure"
                aria-label={`Measurement ${index + 1}`}
                value={row.label}
                onChange={(event) => updateRow(index, { label: event.target.value })}
              />
              <button
                className={styles.ghostButton}
                type="button"
                onClick={() => removeRow(index)}
              >
                Remove
              </button>
            </>
          ) : (
            <>
              <input
                className={styles.input}
                inputMode="decimal"
                placeholder="e.g. 140"
                aria-label={`Width for size ${index + 1}`}
                value={row.width}
                onChange={(event) => updateRow(index, { width: event.target.value })}
              />
              <input
                className={styles.input}
                inputMode="decimal"
                placeholder="e.g. 220"
                aria-label={`Drop for size ${index + 1}`}
                value={row.drop}
                onChange={(event) => updateRow(index, { drop: event.target.value })}
              />
              <select
                className={styles.select}
                aria-label={`Unit for size ${index + 1}`}
                value={row.unit}
                onChange={(event) =>
                  updateRow(index, { unit: event.target.value as MeasurementUnit })
                }
              >
                {MEASUREMENT_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
              <button
                className={styles.ghostButton}
                type="button"
                onClick={() => removeRow(index)}
              >
                Remove
              </button>
            </>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button className={styles.ghostButton} type="button" onClick={() => addRow()}>
          + Add size
        </button>
        {unusedSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            className={styles.ghostButton}
            type="button"
            onClick={() => addRow(parseMeasurementValue(suggestion))}
            title={`Add ${suggestion}`}
          >
            + {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

const MAX_MODEL_BYTES = 50 * 1024 * 1024;

interface ProductModelFieldsProps {
  productId: string;
  modelUrl: string | null;
  onModelChange: (modelUrl: string | null) => void;
  onError: (message: string) => void;
}

function ProductModelFields({ productId, modelUrl, onModelChange, onError }: ProductModelFieldsProps) {
  const [busy, setBusy] = useState(false);

  const uploadModel = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.glb')) {
      onError('Only .glb model files are allowed.');
      return;
    }

    if (file.size <= 0 || file.size > MAX_MODEL_BYTES) {
      onError('Model files must be between 1 byte and 50MB.');
      return;
    }

    // Validate the glTF header locally before uploading — reads only the
    // first 4 bytes, so large files are not buffered fully.
    const header = await file.slice(0, 4).arrayBuffer();
    if (header.byteLength < 4 || new DataView(header).getUint32(0, true) !== 0x46546c67) {
      onError('That file is not a valid GLB model (missing glTF header).');
      return;
    }

    setBusy(true);
    onError('');

    try {
      // Mirror the image flow: browser -> sign endpoint -> Cloudinary (raw)
      // -> JSON persist. The .glb bytes never travel through Next.js, so
      // the 1MB Server Actions / proxy body limits cannot trigger a 413.
      const signRes = await fetch('/api/admin/media/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: 'zhua/products/models',
          baseName: productId,
          resourceType: 'raw',
        }),
      });

      const signData = (await signRes.json().catch(() => ({}))) as {
        cloudName?: string;
        apiKey?: string;
        timestamp?: number;
        signature?: string;
        folder?: string;
        publicId?: string;
        uploadUrl?: string;
        error?: string;
      };

      if (
        !signRes.ok ||
        !signData.uploadUrl ||
        !signData.apiKey ||
        !signData.signature ||
        !signData.timestamp ||
        !signData.publicId
      ) {
        throw new Error(signData.error ?? 'Could not prepare model upload.');
      }

      const uploadBody = new FormData();
      uploadBody.append('file', file);
      uploadBody.append('api_key', signData.apiKey);
      uploadBody.append('timestamp', String(signData.timestamp));
      uploadBody.append('signature', signData.signature);
      uploadBody.append('folder', signData.folder ?? 'zhua/products/models');
      uploadBody.append('public_id', signData.publicId);

      const uploadRes = await fetch(signData.uploadUrl, {
        method: 'POST',
        body: uploadBody,
      });

      const uploadData = (await uploadRes.json().catch(() => ({}))) as {
        secure_url?: string;
        public_id?: string;
        format?: string;
        bytes?: number;
        error?: { message?: string };
      };

      if (!uploadRes.ok || !uploadData.secure_url || !uploadData.public_id) {
        throw new Error(
          uploadData.error?.message ?? 'Could not upload the 3D model to Cloudinary.'
        );
      }

      if (typeof uploadData.bytes === 'number' && uploadData.bytes > MAX_MODEL_BYTES) {
        throw new Error('Model files must be between 1 byte and 50MB.');
      }

      const format = (uploadData.format ?? '').toLowerCase();
      if (format && format !== 'glb') {
        throw new Error('Only .glb model files are allowed.');
      }

      const res = await fetch(`/api/admin/products/${productId}/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelUrl: uploadData.secure_url,
          publicId: uploadData.public_id,
          bytes: uploadData.bytes,
          format: uploadData.format,
        }),
      });
      const data = (await res.json()) as { modelUrl?: string | null; error?: string };

      if (!res.ok || typeof data.modelUrl !== 'string') {
        throw new Error(data.error ?? 'Could not upload the 3D model.');
      }

      onModelChange(data.modelUrl);
      toast.success('3D model uploaded. Customers can now view it on the product page.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not upload the 3D model.');
    } finally {
      setBusy(false);
    }
  };

  const removeModel = async () => {
    setBusy(true);
    onError('');

    try {
      const res = await fetch(`/api/admin/products/${productId}/model`, { method: 'DELETE' });
      const data = (await res.json()) as { modelUrl?: string | null; error?: string };

      if (!res.ok || data.modelUrl !== null) {
        throw new Error(data.error ?? 'Could not remove the 3D model.');
      }

      onModelChange(null);
      toast.success('3D model removed from the product.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not remove the 3D model.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <span className={styles.fieldHint}>
        {modelUrl
          ? '3D model attached — it shows as a “View 3D” card on the product page.'
          : 'No 3D model yet. Upload a .glb file (max 50MB) to show a “View 3D” card on the product page.'}
      </span>

      {modelUrl ? (
        <a
          href={modelUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.74rem', color: 'var(--gold)', wordBreak: 'break-all' }}
        >
          Open current model file
        </a>
      ) : null}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <label className={styles.ghostButton} style={{ cursor: busy ? 'wait' : 'pointer' }}>
          {busy ? 'Working...' : modelUrl ? 'Replace model' : 'Upload GLB'}
          <input
            type="file"
            accept=".glb,model/gltf-binary"
            style={{ display: 'none' }}
            disabled={busy}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) {
                void uploadModel(file);
              }
              event.currentTarget.value = '';
            }}
          />
        </label>

        {modelUrl ? (
          <button
            className={styles.ghostButton}
            type="button"
            onClick={() => void removeModel()}
            disabled={busy}
          >
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ============================================================
   Unified product form (create + edit) — grouped sections
   ============================================================ */

interface ProductMediaFieldsProps {
  values: ProductFormValues;
  mode: 'create' | 'edit';
  productId?: string;
  modelUrl?: string | null;
  onModelChange?: (modelUrl: string | null) => void;
  onError: (message: string) => void;
  uploading: boolean;
  uploadProgress: { done: number; total: number } | null;
  onUploadImages: (files: File[], asMain: boolean) => void;
  onRemoveImage?: (publicId: string) => void;
}

/** Shared image uploader used by both the standard and curtain layouts. */
function ProductMediaFields({
  values,
  mode,
  productId,
  modelUrl,
  onModelChange,
  onError,
  uploading,
  uploadProgress,
  onUploadImages,
  onRemoveImage,
}: ProductMediaFieldsProps) {
  const uploadLabel = uploading
    ? uploadProgress && uploadProgress.total > 1
      ? `Uploading ${uploadProgress.done}/${uploadProgress.total}...`
      : 'Uploading...'
    : null;

  return (
    <div className={styles.fieldGrid}>
      <div className={styles.fieldFull}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label className={styles.ghostButton} style={{ cursor: uploading ? 'wait' : 'pointer' }}>
            {uploadLabel ?? (mode === 'create' ? 'Upload main image' : 'Upload images')}
            <input
              type="file"
              accept="image/*"
              multiple={mode === 'edit'}
              style={{ display: 'none' }}
              disabled={uploading}
              onChange={(e) => {
                const files = Array.from(e.currentTarget.files ?? []);
                if (files.length > 0) {
                  onUploadImages(files, mode === 'create');
                }
                e.currentTarget.value = '';
              }}
            />
          </label>
          {mode === 'create' ? (
            <label className={styles.ghostButton} style={{ cursor: uploading ? 'wait' : 'pointer' }}>
              {uploadLabel ?? 'Upload gallery images'}
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                disabled={uploading}
                onChange={(e) => {
                  const files = Array.from(e.currentTarget.files ?? []);
                  if (files.length > 0) {
                    onUploadImages(files, false);
                  }
                  e.currentTarget.value = '';
                }}
              />
            </label>
          ) : null}
          <span className={styles.fieldHint}>
            {mode === 'create'
              ? 'The main image is shown first on the product page.'
              : 'New images are added after you save. Remove images from the list row → Images.'}
          </span>
        </div>

        {values.images.length > 0 ? (
          <div className={styles.thumbStrip} style={{ marginTop: '0.65rem' }}>
            {values.images.map((image, imageIndex) => (
              <span key={image.publicId} className={styles.thumbBox}>
                <img
                  src={image.secureUrl}
                  alt={imageIndex === 0 ? 'Main product image' : `Product image ${imageIndex + 1}`}
                  style={{
                    width: '84px',
                    height: '64px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border:
                      imageIndex === 0 ? '2px solid var(--gold)' : '1px solid var(--border-light)',
                    display: 'block',
                  }}
                />
                <span className={styles.thumbTag}>
                  {imageIndex === 0 ? 'Main' : `#${imageIndex + 1}`}
                </span>
                {mode === 'create' && onRemoveImage ? (
                  <button
                    type="button"
                    aria-label={`Remove product image ${imageIndex + 1}`}
                    className={styles.thumbRemove}
                    disabled={uploading}
                    onClick={() => onRemoveImage(image.publicId)}
                  >
                    ×
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        ) : (
          <p className={styles.fieldHint} style={{ marginTop: '0.55rem' }}>
            No images yet.
          </p>
        )}
      </div>

      {mode === 'edit' && productId ? (
        <div className={styles.fieldFull}>
          <ProductModelFields
            productId={productId}
            modelUrl={modelUrl ?? null}
            onModelChange={(url) => onModelChange?.(url)}
            onError={onError}
          />
        </div>
      ) : null}
    </div>
  );
}

interface ProductFormFieldsProps {
  values: ProductFormValues;
  onPatch: (patch: Partial<ProductFormValues>) => void;
  mode: 'create' | 'edit';
  productId?: string;
  modelUrl?: string | null;
  onModelChange?: (modelUrl: string | null) => void;
  onError: (message: string) => void;
  uploading: boolean;
  uploadProgress: { done: number; total: number } | null;
  onUploadImages: (files: File[], asMain: boolean) => void;
  onRemoveImage?: (publicId: string) => void;
}

function ProductFormFields({
  values,
  onPatch,
  mode,
  productId,
  modelUrl,
  onModelChange,
  onError,
  uploading,
  uploadProgress,
  onUploadImages,
  onRemoveImage,
}: ProductFormFieldsProps) {
  const offerPrice = calculateOfferPrice(
    Number(values.price) || 0,
    Number(values.offerPercentage) || 0
  );
  const curtainDiscount = curtainDiscountPercentage(values.price, values.discountPrice);
  const curtainPrice = Math.max(0, Number(values.price) || 0);
  const curtainDiscountPrice = Math.max(0, Number(values.discountPrice) || 0);

  // Curtain products use a dedicated layout so the fields customers and
  // merchandisers care about appear in a predictable, curtain-first order.
  if (isCurtainCategory(values.category)) {
    return (
      <div>
        {/* — Product details — */}
        <div className={styles.fieldSection}>
          <h4 className={styles.fieldSectionTitle}>Curtain Product</h4>
          <div className={styles.fieldGrid}>
            <div className={`${styles.formRow} ${styles.fieldFull}`}>
              <label className={styles.label}>Product Title</label>
              <input
                className={styles.input}
                placeholder="e.g. Sahara Eyelet Curtains"
                value={values.name}
                onChange={(e) => onPatch({ name: e.target.value })}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>SKU</label>
              <input
                className={styles.input}
                placeholder="Auto-generated when empty"
                value={values.sku}
                onChange={(e) => onPatch({ sku: e.target.value })}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Category</label>
              <select
                className={styles.select}
                value={values.category}
                onChange={(e) => onPatch(withCategory(values, e.target.value as AdminCategory))}
              >
                <option>Furniture</option>
                <option>Curtains</option>
                <option>Accessories</option>
              </select>
            </div>
          </div>
        </div>

        {/* — Curtain specifications — */}
        <div className={styles.fieldSection}>
          <h4 className={styles.fieldSectionTitle}>Curtain Specifications</h4>
          <div className={styles.fieldGrid}>
            <div className={`${styles.formRow} ${styles.fieldFull}`}>
              <label className={styles.label}>Fabric</label>
              <ProductStringListFields
                values={values.fabrics}
                onChange={(fabrics) => onPatch({ fabrics })}
                placeholder="e.g. Linen Blend"
                addLabel="Add fabric"
                suggestions={CURTAIN_FABRIC_SUGGESTIONS}
              />
            </div>
            <div className={`${styles.formRow} ${styles.fieldFull}`}>
              <label className={styles.label}>Light Filtration</label>
              <ProductStringListFields
                values={values.lightFiltration}
                onChange={(lightFiltration) => onPatch({ lightFiltration })}
                placeholder="e.g. Room Darkening"
                addLabel="Add light filtration"
                suggestions={CURTAIN_LIGHT_FILTRATION_SUGGESTIONS}
              />
            </div>
            <div className={`${styles.formRow} ${styles.fieldFull}`}>
              <label className={styles.label}>Colour</label>
              <ProductColorFields
                colors={values.colors}
                onChange={(colors) => onPatch({ colors })}
                uploadBaseName={values.name || 'curtain'}
                galleryImages={mode === 'edit' ? values.images : []}
              />
            </div>
            <div className={`${styles.formRow} ${styles.fieldFull}`}>
              <label className={styles.label}>Top Style</label>
              <ProductStringListFields
                values={values.topStyles}
                onChange={(topStyles) => onPatch({ topStyles })}
                placeholder="e.g. Pinch Pleat"
                addLabel="Add top style"
                suggestions={CURTAIN_TOP_STYLE_SUGGESTIONS}
              />
            </div>
            <div className={`${styles.formRow} ${styles.fieldFull}`}>
              <label className={styles.label}>Measurements / Sizes</label>
              <ProductMeasurementFields
                values={values.measurements}
                onChange={(measurements) => onPatch({ measurements })}
              />
              <p className={styles.fieldHint}>
                Width × drop per panel, in cm, inches or feet. Add as many sizes as the product
                comes in — they become the size options on the product page and the measurement
                shown on curtain cards. Rows missing a width or drop are ignored.
              </p>
            </div>
          </div>
        </div>

        {/* — Pricing — */}
        <div className={styles.fieldSection}>
          <h4 className={styles.fieldSectionTitle}>Pricing</h4>
          <div className={styles.fieldGrid}>
            <div className={styles.formRow}>
              <label className={styles.label}>Price (per metre)</label>
              <input
                className={styles.input}
                inputMode="decimal"
                placeholder="e.g. 420"
                value={values.price}
                onChange={(e) =>
                  onPatch(withCurtainDiscount(values, e.target.value, values.discountPrice))
                }
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Discount Price (per metre)</label>
              <input
                className={styles.input}
                inputMode="decimal"
                placeholder="Optional — e.g. 349"
                value={values.discountPrice}
                onChange={(e) =>
                  onPatch(withCurtainDiscount(values, values.price, e.target.value))
                }
              />
            </div>
            <p className={`${styles.fieldHint} ${styles.fieldFull}`}>
              {curtainDiscount > 0
                ? `Customers pay ${formatCurrency(curtainDiscountPrice)}/m — ${curtainDiscount}% off ${formatCurrency(curtainPrice)}/m. The “sale” badge is applied automatically.`
                : curtainPrice > 0 && curtainDiscountPrice >= curtainPrice
                  ? 'The discount price must be lower than the price — it is ignored when saving.'
                  : 'Leave the discount price empty for no sale. Curtain prices are per metre.'}
            </p>
          </div>
        </div>

        {/* — Image — */}
        <div className={styles.fieldSection}>
          <h4 className={styles.fieldSectionTitle}>Image</h4>
          <ProductMediaFields
            values={values}
            mode={mode}
            productId={productId}
            modelUrl={modelUrl}
            onModelChange={onModelChange}
            onError={onError}
            uploading={uploading}
            uploadProgress={uploadProgress}
            onUploadImages={onUploadImages}
            onRemoveImage={onRemoveImage}
          />
        </div>

        {/* — Description — */}
        <div className={styles.fieldSection}>
          <h4 className={styles.fieldSectionTitle}>Description</h4>
          <div className={styles.fieldGrid}>
            <div className={`${styles.formRow} ${styles.fieldFull}`}>
              <label className={styles.label}>Description</label>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="A short summary shown near the product title"
                value={values.description}
                onChange={(e) => onPatch({ description: e.target.value })}
              />
            </div>
            <div className={`${styles.formRow} ${styles.fieldFull}`}>
              <label className={styles.label}>Long description (optional)</label>
              <textarea
                className={styles.textarea}
                rows={5}
                placeholder="Detailed copy for the product detail page"
                value={values.longDescription}
                onChange={(e) => onPatch({ longDescription: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* — Additional details — */}
        <div className={styles.fieldSection}>
          <h4 className={styles.fieldSectionTitle}>Additional Details</h4>
          <div className={styles.fieldGrid}>
            <div className={styles.formRow}>
              <label className={styles.label}>Subcategory</label>
              <input
                className={styles.input}
                placeholder="e.g. Block-Out Curtains"
                value={values.subcategory}
                onChange={(e) => onPatch({ subcategory: e.target.value })}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Slug (optional)</label>
              <input
                className={styles.input}
                placeholder="auto-generated when empty"
                value={values.slug}
                onChange={(e) => onPatch({ slug: e.target.value })}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Status</label>
              <select
                className={styles.select}
                value={values.status}
                onChange={(e) => onPatch({ status: e.target.value as AdminStatus })}
              >
                <option>Active</option>
                <option>Draft</option>
                <option>Archived</option>
              </select>
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Badge</label>
              <select
                className={styles.select}
                value={values.badge ?? ''}
                onChange={(e) =>
                  onPatch({ badge: e.target.value ? (e.target.value as Exclude<AdminBadge, null>) : null })
                }
              >
                <option value="">None</option>
                <option value="new">new</option>
                <option value="sale">sale</option>
                <option value="custom">custom</option>
                <option value="bestseller">bestseller</option>
              </select>
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Stock</label>
              <input
                className={styles.input}
                inputMode="numeric"
                placeholder="e.g. 12"
                value={values.stock}
                onChange={(e) => onPatch({ stock: e.target.value })}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Delivery estimate</label>
              <input
                className={styles.input}
                placeholder="7-10 business days"
                value={values.deliveryDays}
                onChange={(e) => onPatch({ deliveryDays: e.target.value })}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Weight (kg)</label>
              <input
                className={styles.input}
                inputMode="decimal"
                placeholder="0"
                value={values.weightKg}
                onChange={(e) => onPatch({ weightKg: e.target.value })}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Width (cm)</label>
              <input
                className={styles.input}
                inputMode="decimal"
                placeholder="0"
                value={values.widthCm}
                onChange={(e) => onPatch({ widthCm: e.target.value })}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Depth (cm)</label>
              <input
                className={styles.input}
                inputMode="decimal"
                placeholder="0"
                value={values.depthCm}
                onChange={(e) => onPatch({ depthCm: e.target.value })}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Height (cm)</label>
              <input
                className={styles.input}
                inputMode="decimal"
                placeholder="0"
                value={values.heightCm}
                onChange={(e) => onPatch({ heightCm: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* — Identity — */}
      <div className={styles.fieldSection}>
        <h4 className={styles.fieldSectionTitle}>Identity</h4>
        <div className={styles.fieldGrid}>
          <div className={`${styles.formRow} ${styles.fieldFull}`}>
            <label className={styles.label}>Name</label>
            <input
              className={styles.input}
              placeholder="Product name"
              value={values.name}
              onChange={(e) => onPatch({ name: e.target.value })}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Category</label>
            <select
              className={styles.select}
              value={values.category}
              onChange={(e) => onPatch(withCategory(values, e.target.value as AdminCategory))}
            >
              <option>Furniture</option>
              <option>Curtains</option>
              <option>Accessories</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Subcategory</label>
            <input
              className={styles.input}
              placeholder="General"
              value={values.subcategory}
              onChange={(e) => onPatch({ subcategory: e.target.value })}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>SKU (optional)</label>
            <input
              className={styles.input}
              placeholder="ZH-XXXX-000"
              value={values.sku}
              onChange={(e) => onPatch({ sku: e.target.value })}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Slug (optional)</label>
            <input
              className={styles.input}
              placeholder="auto-generated when empty"
              value={values.slug}
              onChange={(e) => onPatch({ slug: e.target.value })}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Status</label>
            <select
              className={styles.select}
              value={values.status}
              onChange={(e) => onPatch({ status: e.target.value as AdminStatus })}
            >
              <option>Active</option>
              <option>Draft</option>
              <option>Archived</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Badge</label>
            <select
              className={styles.select}
              value={values.badge ?? ''}
              onChange={(e) =>
                onPatch({ badge: e.target.value ? (e.target.value as Exclude<AdminBadge, null>) : null })
              }
            >
              <option value="">None</option>
              <option value="new">new</option>
              <option value="sale">sale</option>
              <option value="custom">custom</option>
              <option value="bestseller">bestseller</option>
            </select>
          </div>
        </div>
      </div>

      {/* — Pricing & stock — */}
      <div className={styles.fieldSection}>
        <h4 className={styles.fieldSectionTitle}>Pricing &amp; Stock</h4>
        <div className={styles.fieldGrid}>
          <div className={styles.formRow}>
            <label className={styles.label}>Price (R)</label>
            <input
              className={styles.input}
              inputMode="numeric"
              placeholder="e.g. 4999"
              value={values.price}
              onChange={(e) => onPatch(withOffer(values, e.target.value, values.offerPercentage))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Offer (%)</label>
            <input
              className={styles.input}
              inputMode="decimal"
              placeholder="0"
              value={values.offerPercentage}
              onChange={(e) => onPatch(withOffer(values, values.price, e.target.value))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Stock</label>
            <input
              className={styles.input}
              inputMode="numeric"
              placeholder="e.g. 12"
              value={values.stock}
              onChange={(e) => onPatch({ stock: e.target.value })}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Delivery estimate</label>
            <input
              className={styles.input}
              placeholder="7-10 business days"
              value={values.deliveryDays}
              onChange={(e) => onPatch({ deliveryDays: e.target.value })}
            />
          </div>
          <p className={`${styles.fieldHint} ${styles.fieldFull}`}>
            Selling price at this offer: <strong>{formatCurrency(offerPrice)}</strong>
            {Number(values.offerPercentage) > 0
              ? ` — ${values.offerPercentage}% off ${formatCurrency(Number(values.price) || 0)}. The “sale” badge is applied automatically.`
              : ''}
          </p>
        </div>
      </div>

      {/* — Media — */}
      <div className={styles.fieldSection}>
        <h4 className={styles.fieldSectionTitle}>Media</h4>
        <ProductMediaFields
          values={values}
          mode={mode}
          productId={productId}
          modelUrl={modelUrl}
          onModelChange={onModelChange}
          onError={onError}
          uploading={uploading}
          uploadProgress={uploadProgress}
          onUploadImages={onUploadImages}
          onRemoveImage={onRemoveImage}
        />
      </div>

      {/* — Options — */}
      <div className={styles.fieldSection}>
        <h4 className={styles.fieldSectionTitle}>Options</h4>
        <div className={styles.fieldGrid}>
          <div className={`${styles.formRow} ${styles.fieldFull}`}>
            <label className={styles.label}>Colour options</label>
            <ProductColorFields
              colors={values.colors}
              onChange={(colors) => onPatch({ colors })}
              uploadBaseName={values.name || 'product'}
              galleryImages={mode === 'edit' ? values.images : []}
            />
          </div>
          <div className={`${styles.formRow} ${styles.fieldFull}`}>
            <label className={styles.label}>Size options</label>
            <ProductStringListFields
              values={values.sizes}
              onChange={(sizes) => onPatch({ sizes })}
              placeholder="e.g. Queen (152cm)"
              addLabel="Add size"
            />
          </div>
          <div className={`${styles.formRow} ${styles.fieldFull}`}>
            <label className={styles.label}>Fabric options</label>
            <ProductStringListFields
              values={values.fabrics}
              onChange={(fabrics) => onPatch({ fabrics })}
              placeholder="e.g. Linen Blend"
              addLabel="Add fabric"
            />
          </div>
        </div>
      </div>

      {/* — Dimensions — */}
      <div className={styles.fieldSection}>
        <h4 className={styles.fieldSectionTitle}>Dimensions</h4>
        <div className={styles.fieldGrid}>
          <div className={styles.formRow}>
            <label className={styles.label}>Weight (kg)</label>
            <input
              className={styles.input}
              inputMode="decimal"
              placeholder="0"
              value={values.weightKg}
              onChange={(e) => onPatch({ weightKg: e.target.value })}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Width (cm)</label>
            <input
              className={styles.input}
              inputMode="decimal"
              placeholder="0"
              value={values.widthCm}
              onChange={(e) => onPatch({ widthCm: e.target.value })}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Depth (cm)</label>
            <input
              className={styles.input}
              inputMode="decimal"
              placeholder="0"
              value={values.depthCm}
              onChange={(e) => onPatch({ depthCm: e.target.value })}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Height (cm)</label>
            <input
              className={styles.input}
              inputMode="decimal"
              placeholder="0"
              value={values.heightCm}
              onChange={(e) => onPatch({ heightCm: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* — Description — */}
      <div className={styles.fieldSection}>
        <h4 className={styles.fieldSectionTitle}>Description</h4>
        <div className={styles.fieldGrid}>
          <div className={`${styles.formRow} ${styles.fieldFull}`}>
            <label className={styles.label}>Short description</label>
            <textarea
              className={styles.textarea}
              rows={3}
              placeholder="A short summary shown near the product title"
              value={values.description}
              onChange={(e) => onPatch({ description: e.target.value })}
            />
          </div>
          <div className={`${styles.formRow} ${styles.fieldFull}`}>
            <label className={styles.label}>Long description (optional)</label>
            <textarea
              className={styles.textarea}
              rows={5}
              placeholder="Detailed copy for the product detail page"
              value={values.longDescription}
              onChange={(e) => onPatch({ longDescription: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsAdminPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [formProductId, setFormProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormValues | null>(null);
  const [imageManagerProductId, setImageManagerProductId] = useState<string | null>(null);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [deletingImages, setDeletingImages] = useState(false);

  useToastFeedback({ error });

  const loadProducts = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/products', { cache: 'no-store' });
      const data = (await res.json()) as { products?: AdminProductRow[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Could not load products.');
      }

      setProducts((data.products ?? []).map((row) => normalizeProductRow(row)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load products.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const formOpen = formMode !== null && productForm !== null;

  useEffect(() => {
    if (!formOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !(formMode === 'edit' && savingId === formProductId)) {
        closeForm();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formOpen, formMode, formProductId, savingId]);

  useEffect(() => {
    if (!imageManagerProductId) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deletingImages) {
        setImageManagerProductId(null);
        setSelectedImageIds([]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [imageManagerProductId, deletingImages]);

  const imageManagerProduct = imageManagerProductId
    ? (products.find((product) => product.id === imageManagerProductId) ?? null)
    : null;

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === 'All' || product.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, category]);

  const updateProduct = async (
    id: string,
    partial: Record<string, unknown>,
    successMessage = 'Product updated successfully.'
  ): Promise<boolean> => {
    setSavingId(id);
    setError('');

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });

      const data = (await res.json()) as { product?: AdminProductRow; error?: string };
      if (!res.ok || !data.product) {
        throw new Error(data.error ?? 'Could not update product.');
      }

      setProducts((prev) =>
        prev.map((product) =>
          product.id === id ? normalizeProductRow(data.product!) : product
        )
      );
      if (successMessage) {
        toast.success(successMessage);
      }
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update product.';
      setError(message);
      return false;
    } finally {
      setSavingId(null);
    }
  };

  const adjustProductStock = async (product: AdminProductRow, delta: number) => {
    const nextStock = Math.max(0, Math.round(product.stock + delta));
    if (nextStock === product.stock) {
      return;
    }

    await updateProduct(product.id, { stock: nextStock }, `Stock updated to ${nextStock}.`);
  };

  const openCreateForm = () => {
    setError('');
    setFormMode('create');
    setFormProductId(null);
    setProductForm({ ...defaultNewProduct, colors: [] });
  };

  const openEditForm = (product: AdminProductRow) => {
    setError('');
    setFormMode('edit');
    setFormProductId(product.id);
    setProductForm(formValuesFromRow(product));
  };

  const closeForm = () => {
    if (formMode === 'edit' && formProductId && savingId === formProductId) {
      return;
    }

    setFormMode(null);
    setFormProductId(null);
    setProductForm(null);
  };

  const saveForm = async () => {
    if (!productForm || !formMode) {
      return;
    }

    if (!productForm.name.trim()) {
      setError('Product name is required.');
      return;
    }

    const payload = buildSavePayload(productForm);

    if (formMode === 'create') {
      setSavingId('new');
      setError('');

      try {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = (await res.json()) as { product?: AdminProductRow; error?: string };
        if (!res.ok || !data.product) {
          throw new Error(data.error ?? 'Could not create product.');
        }

        setProducts((prev) => [normalizeProductRow(data.product!), ...prev]);
        setFormMode(null);
        setFormProductId(null);
        setProductForm(null);
        toast.success('Product created successfully.');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not create product.';
        setError(message);
      } finally {
        setSavingId(null);
      }
      return;
    }

    if (!formProductId) {
      return;
    }

    const didSave = await updateProduct(
      formProductId,
      payload,
      'Product changes saved successfully.'
    );
    if (!didSave) {
      return;
    }

    setFormMode(null);
    setFormProductId(null);
    setProductForm(null);
  };

  const patchForm = (patch: Partial<ProductFormValues>) => {
    setProductForm((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const applyModelChange = (productId: string, modelUrl: string | null) => {
    setProducts((prev) =>
      prev.map((row) => (row.id === productId ? { ...row, modelUrl } : row))
    );
  };

  const uploadFormImages = async (files: File[], asMain: boolean) => {
    if (!productForm || files.length === 0) {
      return;
    }

    const picked = asMain ? files.slice(0, 1) : files;
    const validationError = validateImageFiles(picked);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setUploadProgress({ done: 0, total: picked.length });
    setError('');

    try {
      const assets: CloudinaryImageAsset[] = [];

      for (const file of picked) {
        assets.push(await uploadImageAsset(file, productForm.name.trim() || 'product'));
        setUploadProgress({ done: assets.length, total: picked.length });
      }

      if (assets.length === 0) {
        return;
      }

      if (asMain) {
        const [newMain, ...extra] = assets;
        const previousMain = productForm.images[0];
        // Replace the current main image — delete the old main asset and
        // drop any staged copy of it so images[0] stays the single main.
        if (previousMain && previousMain.publicId !== newMain.publicId) {
          try {
            await fetch('/api/admin/media/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ publicId: previousMain.publicId }),
            });
          } catch {
            // Non-fatal: keep the new main image even if the old delete fails.
          }
        }
        patchForm({ images: [newMain, ...extra, ...productForm.images.slice(1)] });
        toast.success('Main product image uploaded.');
      } else {
        patchForm({ images: [...productForm.images, ...assets] });
        toast.success(
          `${assets.length} gallery image${assets.length === 1 ? '' : 's'} uploaded.`
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload image.';
      setError(message);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const removeFormImage = async (publicId: string) => {
    setError('');

    try {
      const deleteRes = await fetch('/api/admin/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
      });

      const deleteData = (await deleteRes.json()) as { error?: string };
      if (!deleteRes.ok) {
        throw new Error(deleteData.error ?? 'Could not delete image from Cloudinary.');
      }

      setProductForm((prev) =>
        prev
          ? {
              ...prev,
              images: prev.images.filter((image) => image.publicId !== publicId),
            }
          : prev
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not remove image.';
      setError(message);
    }
  };

  const openImageManager = (product: AdminProductRow) => {
    setError('');
    setSelectedImageIds([]);
    setImageManagerProductId(product.id);
  };

  const closeImageManager = () => {
    if (deletingImages) {
      return;
    }
    setImageManagerProductId(null);
    setSelectedImageIds([]);
  };

  const toggleSelectedImage = (publicId: string) => {
    setSelectedImageIds((prev) =>
      prev.includes(publicId)
        ? prev.filter((entry) => entry !== publicId)
        : [...prev, publicId]
    );
  };

  const deleteSelectedImages = async () => {
    const product = imageManagerProduct;
    if (!product || selectedImageIds.length === 0) {
      return;
    }

    setDeletingImages(true);
    setError('');

    try {
      for (const publicId of selectedImageIds) {
        const deleteRes = await fetch('/api/admin/media/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId }),
        });

        const deleteData = (await deleteRes.json()) as { error?: string };
        if (!deleteRes.ok) {
          throw new Error(deleteData.error ?? 'Could not delete image from Cloudinary.');
        }
      }

      const remainingImages = product.images.filter(
        (image) => !selectedImageIds.includes(image.publicId)
      );
      const cleanedColors = product.colors.map((color) => ({
        ...color,
        images: (color.images ?? []).filter(
          (image) => !selectedImageIds.includes(image.publicId)
        ),
      }));

      const didSave = await updateProduct(
        product.id,
        { images: remainingImages, colors: cleanedColors },
        `${selectedImageIds.length} product image${selectedImageIds.length === 1 ? '' : 's'} removed successfully.`
      );

      if (didSave) {
        setImageManagerProductId(null);
        setSelectedImageIds([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not remove image.';
      setError(message);
    } finally {
      setDeletingImages(false);
    }
  };

  const deleteProduct = async (id: string) => {
    setSavingId(id);
    setError('');

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not delete product.');
      }

      setProducts((prev) => prev.filter((product) => product.id !== id));
      toast.success('Product deleted successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete product.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const formSaving = savingId === (formMode === 'create' ? 'new' : formProductId);

  return (
    <>
      {/* — Catalog toolbar + list — */}
      <section className={styles.card}>
        <div className={styles.toolbar}>
          <input
            className={`${styles.input} ${styles.toolbarSearch}`}
            placeholder="Search products"
            aria-label="Search products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className={styles.select}
            style={{ maxWidth: 170 }}
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>All</option>
            <option>Furniture</option>
            <option>Curtains</option>
            <option>Accessories</option>
          </select>
          <button className={styles.primaryButton} type="button" onClick={openCreateForm}>
            + Add Product
          </button>
          <span className={styles.toolbarCount}>
            {loading ? 'Loading…' : `${filtered.length} of ${products.length}`}
          </span>
        </div>
        {error ? <p style={{ color: 'var(--status-danger)', marginTop: '0.75rem' }}>{error}</p> : null}

        <div style={{ marginTop: '0.75rem' }}>
          {filtered.map((product) => (
            <div key={product.id} className={styles.listRow}>
              {product.primaryImage ? (
                <img
                  className={styles.listThumb}
                  src={product.primaryImage}
                  alt={product.name}
                />
              ) : (
                <div className={styles.listThumbEmpty} aria-hidden="true" />
              )}

              <div className={styles.listMain}>
                <span className={styles.listTitle}>{product.name}</span>
                <span className={styles.listMeta}>
                  <span className={styles.chip}>{product.category}</span>
                  {product.subcategory && product.subcategory !== 'General' ? (
                    <span className={styles.chip}>{product.subcategory}</span>
                  ) : null}
                  {product.badge ? (
                    <span className={`${styles.chip} ${styles.chipGold}`}>{product.badge}</span>
                  ) : null}
                  <span className={styles.chip}>{product.status}</span>
                  {product.category === 'Curtains' && product.sizes.length > 0 ? (
                    <span className={styles.chip}>
                      {product.sizes.length} measurement{product.sizes.length === 1 ? '' : 's'}
                    </span>
                  ) : null}
                  {product.sku ? <span>{product.sku}</span> : null}
                  {product.imageCount > 0 ? <span>{product.imageCount} image{product.imageCount === 1 ? '' : 's'}</span> : null}
                </span>
              </div>

              <div className={styles.listSide}>
                <div className={styles.listActions}>
                  <span style={{ textAlign: 'right' }}>
                    <span className={styles.listStatLabel}>
                      {product.category === 'Curtains' ? 'Price / m' : 'Price'}
                    </span>
                    <div className={styles.listStat}>
                      {product.offerPercentage > 0 ? (
                        <>
                          <span style={{ color: 'var(--gold)' }}>{formatCurrency(product.offerPrice)}</span>{' '}
                          <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                            {formatCurrency(product.originalPrice ?? product.price)}
                          </span>
                        </>
                      ) : (
                        formatCurrency(product.price)
                      )}
                    </div>
                  </span>
                  <span style={{ textAlign: 'right' }}>
                    <span className={styles.listStatLabel}>Stock</span>
                    <div className={styles.listStat}>{product.stock}</div>
                  </span>
                  <div className={styles.listActions}>
                    <button
                      className={styles.ghostButton}
                      disabled={savingId === product.id || product.stock <= 0}
                      onClick={() => void adjustProductStock(product, -1)}
                      aria-label={`Decrease stock of ${product.name}`}
                    >
                      −
                    </button>
                    <button
                      className={styles.ghostButton}
                      disabled={savingId === product.id}
                      onClick={() => void adjustProductStock(product, +1)}
                      aria-label={`Increase stock of ${product.name}`}
                    >
                      +
                    </button>
                  </div>
                  <div className={styles.listActions}>
                    <button
                      className={styles.ghostButton}
                      disabled={savingId === product.id}
                      onClick={() => openEditForm(product)}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.ghostButton}
                      disabled={savingId === product.id || product.images.length === 0}
                      onClick={() => openImageManager(product)}
                    >
                      Images
                    </button>
                    <button
                      className={`${styles.ghostButton} ${styles.dangerText}`}
                      disabled={savingId === product.id}
                      onClick={() => void deleteProduct(product.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', padding: '1rem 0' }}>
              {products.length === 0
                ? 'No products yet — add the first one.'
                : 'No products match this search.'}
            </p>
          ) : null}
        </div>
      </section>

      {/* — Image manager — */}
      {imageManagerProduct ? (
        <div className={styles.modalOverlay} onClick={closeImageManager}>
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-images-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h3 id="remove-images-title" className={styles.modalTitle}>Remove Product Images</h3>
                <p className={styles.modalMeta}>
                  {imageManagerProduct.name} — select the images to delete.
                </p>
              </div>
              <button className={styles.ghostButton} onClick={closeImageManager} disabled={deletingImages}>
                Close
              </button>
            </div>

            <div className={styles.modalBody}>
              {imageManagerProduct.images.length === 0 ? (
                <p style={{ color: 'var(--text-dim)' }}>This product has no images yet.</p>
              ) : (
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {imageManagerProduct.images.map((image, imageIndex) => {
                    const isSelected = selectedImageIds.includes(image.publicId);

                    return (
                      <button
                        key={image.publicId}
                        type="button"
                        onClick={() => toggleSelectedImage(image.publicId)}
                        aria-pressed={isSelected}
                        aria-label={
                          isSelected
                            ? `Deselect ${imageIndex === 0 ? 'main' : `image ${imageIndex + 1}`}`
                            : `Select ${imageIndex === 0 ? 'main' : `image ${imageIndex + 1}`} for deletion`
                        }
                        title={isSelected ? 'Selected — click to deselect' : 'Click to select'}
                        disabled={deletingImages}
                        style={{
                          position: 'relative',
                          padding: 0,
                          border: isSelected
                            ? '3px solid var(--gold)'
                            : '3px solid var(--border-light)',
                          borderRadius: '10px',
                          background: 'none',
                          cursor: 'pointer',
                          lineHeight: 0,
                        }}
                      >
                        <img
                          src={image.secureUrl}
                          alt={imageIndex === 0 ? 'Main product image' : `Product image ${imageIndex + 1}`}
                          style={{
                            width: '120px',
                            height: '92px',
                            objectFit: 'cover',
                            borderRadius: '7px',
                            opacity: isSelected ? 1 : 0.85,
                            display: 'block',
                          }}
                        />
                        <span className={styles.thumbTag}>
                          {imageIndex === 0 ? 'Main' : `#${imageIndex + 1}`}
                        </span>
                        {isSelected ? (
                          <span
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: 'var(--gold)',
                              color: 'var(--midnight)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                              fontWeight: 700,
                              lineHeight: 1,
                            }}
                          >
                            ✓
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className={styles.fieldHint} style={{ marginTop: '0.75rem' }}>
                {selectedImageIds.length} image{selectedImageIds.length === 1 ? '' : 's'} selected.
                Deleting removes the image from Cloudinary and the product.
              </p>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.ghostButton} onClick={closeImageManager} disabled={deletingImages}>
                Cancel
              </button>
              <button
                className={styles.ghostButton}
                onClick={() => void deleteSelectedImages()}
                disabled={deletingImages || selectedImageIds.length === 0}
              >
                {deletingImages
                  ? 'Deleting...'
                  : `Delete selected${selectedImageIds.length > 0 ? ` (${selectedImageIds.length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* — Create / Edit product form — */}
      {formOpen && productForm ? (
        <div className={styles.modalOverlay} onClick={closeForm}>
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h3 id="product-form-title" className={styles.modalTitle}>
                  {formMode === 'create' ? 'Add Product' : 'Edit Product'}
                </h3>
                <p className={styles.modalMeta}>
                  {formMode === 'edit'
                    ? `${productForm.name || 'Product'} · ID: ${formProductId}`
                    : 'Fill in the details below — only the name is required to start.'}
                </p>
              </div>
              <button className={styles.ghostButton} onClick={closeForm} disabled={formSaving}>
                Close
              </button>
            </div>

            <div className={styles.modalBody}>
              <ProductFormFields
                values={productForm}
                onPatch={patchForm}
                mode={formMode}
                productId={formMode === 'edit' ? formProductId ?? undefined : undefined}
                modelUrl={formMode === 'edit' ? products.find((p) => p.id === formProductId)?.modelUrl ?? null : null}
                onModelChange={(url) =>
                  formProductId ? applyModelChange(formProductId, url) : undefined
                }
                onError={setError}
                uploading={uploading}
                uploadProgress={uploadProgress}
                onUploadImages={(files, asMain) => void uploadFormImages(files, asMain)}
                onRemoveImage={formMode === 'create' ? (publicId) => void removeFormImage(publicId) : undefined}
              />
              {error && formMode === 'edit' ? (
                <p style={{ color: 'var(--status-danger)', marginTop: '0.75rem' }}>{error}</p>
              ) : null}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.ghostButton} onClick={closeForm} disabled={formSaving}>
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                onClick={() => void saveForm()}
                disabled={formSaving || uploading}
              >
                {formSaving
                  ? 'Saving...'
                  : formMode === 'create'
                    ? 'Create Product'
                    : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
