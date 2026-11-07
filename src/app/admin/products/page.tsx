'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/admin-data';
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
  images: CloudinaryImageAsset[];
  primaryImage: string | null;
  imageCount: number;
  modelUrl: string | null;
}

type ProductPatchPayload = {
  sku: string;
  slug: string;
  name: string;
  category: AdminCategory;
  subcategory: string;
  status: AdminStatus;
  badge: AdminBadge;
  price: string;
  offerPercentage: string;
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
  fabrics: string[];
  images: CloudinaryImageAsset[];
};

const DEFAULT_COLOR_HEX = 'var(--gold)';

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

const defaultNewProduct: ProductPatchPayload = {
  sku: '',
  slug: '',
  name: '',
  category: 'Furniture',
  subcategory: 'General',
  status: 'Active',
  badge: null,
  price: '',
  offerPercentage: '',
  stock: '',
  description: '',
  longDescription: '',
  deliveryDays: '7-10 business days',
  weightKg: '',
  widthCm: '',
  depthCm: '',
  heightCm: '',
  colors: [{ name: '', hex: DEFAULT_COLOR_HEX, images: [] }],
  sizes: [],
  fabrics: [],
  images: [],
};

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
    images: Array.isArray(row.images) ? row.images : [],
    primaryImage: row.primaryImage ?? null,
    imageCount: Number.isFinite(row.imageCount) ? row.imageCount : row.images?.length ?? 0,
    modelUrl: typeof row.modelUrl === 'string' && row.modelUrl.trim().length > 0 ? row.modelUrl : null,
  };
}

function buildSavePayload(product: AdminProductRow) {
  return {
    sku: product.sku.trim(),
    slug: product.slug.trim(),
    name: product.name.trim(),
    category: product.category,
    subcategory: product.subcategory.trim() || 'General',
    status: product.status,
    badge: product.badge,
    price: Math.max(0, Math.round(product.price)),
    offerPercentage: clampOfferPercentage(product.offerPercentage),
    stock: Math.max(0, Math.round(product.stock)),
    description: product.description.trim(),
    longDescription: product.longDescription.trim(),
    deliveryDays: product.deliveryDays.trim() || '7-10 business days',
    weightKg: toSafeMeasure(product.weightKg),
    widthCm: toSafeMeasure(product.widthCm),
    depthCm: toSafeMeasure(product.depthCm),
    heightCm: toSafeMeasure(product.heightCm),
    colors: normalizeProductColors(product.colors),
    sizes: normalizeStringList(product.sizes),
    fabrics: normalizeStringList(product.fabrics),
    images: product.images,
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
  const rows = colors.length > 0 ? colors : [{ name: '', hex: DEFAULT_COLOR_HEX, images: [] }];

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

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      {rows.map((color, index) => (
        <div
          key={index}
          style={{
            display: 'grid',
            gap: '0.45rem',
            padding: '0.6rem',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            borderRadius: '10px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 180px) auto',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            <input
              className={styles.input}
              placeholder="Color name"
              value={color.name}
              onChange={(event) => updateRow(index, { name: event.target.value })}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '50px minmax(0, 1fr)', gap: '0.4rem' }}>
              <input
                className={styles.input}
                type="color"
                aria-label={`Select swatch color ${index + 1}`}
                value={toSafeColorHex(color.hex)}
                onChange={(event) => updateRow(index, { hex: event.target.value })}
                style={{ minHeight: '40px', padding: '0.15rem' }}
              />
              <input
                className={styles.input}
                placeholder="var(--gold)"
                value={color.hex}
                onChange={(event) => updateRow(index, { hex: event.target.value })}
              />
            </div>
            <button
              className={styles.ghostButton}
              type="button"
              onClick={() => removeRow(index)}
              disabled={rows.length === 1}
            >
              Remove
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            {(color.images ?? []).map((image) => (
              <div key={image.publicId} style={{ position: 'relative' }}>
                <img
                  src={image.secureUrl}
                  alt={`${color.name || 'Colour'} preview`}
                  style={{
                    width: '52px',
                    height: '52px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    border: '1px solid rgba(148, 163, 184, 0.4)',
                    display: 'block',
                  }}
                />
                <button
                  type="button"
                  aria-label={`Remove ${color.name || 'colour'} image`}
                  onClick={() => removeImage(index, image.publicId)}
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: 'none',
                    background: '#1F2937',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    lineHeight: 1,
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <label
              className={styles.ghostButton}
              style={{ cursor: uploadingIndex === index ? 'wait' : 'pointer' }}
            >
              {uploadingIndex === index ? 'Uploading...' : 'Add colour image'}
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
            <span style={{ fontSize: '0.72rem', opacity: 0.65 }}>
              Shown on the product page when this colour is selected.
            </span>
          </div>

          {galleryImages.length > 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                flexWrap: 'wrap',
                borderTop: '1px dashed rgba(148, 163, 184, 0.3)',
                paddingTop: '0.45rem',
              }}
            >
              <span style={{ fontSize: '0.72rem', opacity: 0.65 }}>Attach from gallery:</span>
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
                    title={isAttached ? 'Attached - click to detach' : 'Click to attach'}
                    style={{
                      padding: 0,
                      border: isAttached
                        ? '2px solid var(--gold)'
                        : '2px solid rgba(148, 163, 184, 0.35)',
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
          Add Color
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
}

function ProductStringListFields({ values, onChange, placeholder, addLabel }: ProductStringListFieldsProps) {
  const rows = values.length > 0 ? values : [''];

  const updateRow = (index: number, value: string) => {
    onChange(rows.map((entry, entryIndex) => (entryIndex === index ? value : entry)));
  };

  const addRow = () => {
    onChange([...rows, '']);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, entryIndex) => entryIndex !== index));
  };

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
            disabled={rows.length === 1}
          >
            Remove
          </button>
        </div>
      ))}
      <div>
        <button className={styles.ghostButton} type="button" onClick={addRow}>
          {addLabel}
        </button>
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        border: '1px dashed rgba(148, 163, 184, 0.4)',
        borderRadius: '8px',
        padding: '0.75rem',
      }}
    >
      <span style={{ fontSize: '0.78rem', opacity: 0.85 }}>
        {modelUrl
          ? '3D model attached — it shows as a “View 3D” card on the product page.'
          : 'No 3D model yet. Upload a .glb file (max 50MB) to show a “View 3D” card on the product page.'}
      </span>

      {modelUrl ? (
        <a
          href={modelUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.72rem', color: 'var(--gold)', wordBreak: 'break-all' }}
        >
          Open current model file
        </a>
      ) : null}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
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

export default function ProductsAdminPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingNew, setUploadingNew] = useState(false);
  const [newUploadProgress, setNewUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<AdminProductRow | null>(null);
  const [newProduct, setNewProduct] = useState<ProductPatchPayload>(defaultNewProduct);
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

  useEffect(() => {
    if (!editingProductId) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && savingId !== editingProductId) {
        setEditingProductId(null);
        setEditDraft(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingProductId, savingId]);

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

  const setLocalProduct = (
    id: string,
    updater: (current: AdminProductRow) => AdminProductRow
  ) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? normalizeProductRow(updater(product)) : product
      )
    );
  };

  const applyOfferToProduct = (
    product: AdminProductRow,
    nextBasePrice: number,
    nextOfferPercentage: number
  ): AdminProductRow => {
    const safeBasePrice = Number.isFinite(nextBasePrice) ? Math.max(0, Math.round(nextBasePrice)) : product.price;
    const safeOfferPercentage = clampOfferPercentage(nextOfferPercentage);
    const nextOfferPrice = calculateOfferPrice(safeBasePrice, safeOfferPercentage);
    const nextBadge =
      safeOfferPercentage > 0
        ? product.badge ?? 'sale'
        : product.badge === 'sale'
          ? null
          : product.badge;

    return {
      ...product,
      price: safeBasePrice,
      offerPercentage: safeOfferPercentage,
      offerPrice: nextOfferPrice,
      originalPrice: safeOfferPercentage > 0 ? safeBasePrice : null,
      badge: nextBadge,
    };
  };

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

  const openEditModal = (product: AdminProductRow) => {
    setError('');
    setEditingProductId(product.id);
    setEditDraft(
      normalizeProductRow({
        ...product,
        colors: product.colors.map((color) => ({
          ...color,
          images: (color.images ?? []).map((image) => ({ ...image })),
        })),
        sizes: [...product.sizes],
        fabrics: [...product.fabrics],
        images: product.images.map((image) => ({ ...image })),
      })
    );
  };

  const closeEditModal = () => {
    if (editingProductId && savingId === editingProductId) {
      return;
    }

    setEditingProductId(null);
    setEditDraft(null);
  };

  const saveEditModal = async () => {
    if (!editingProductId || !editDraft) {
      return;
    }

    const didSave = await updateProduct(
      editingProductId,
      buildSavePayload(editDraft),
      'Product changes saved successfully.'
    );
    if (!didSave) {
      return;
    }

    setEditingProductId(null);
    setEditDraft(null);
  };

  const applyModelChange = (productId: string, modelUrl: string | null) => {
    setProducts((prev) =>
      prev.map((row) => (row.id === productId ? { ...row, modelUrl } : row))
    );
    setEditDraft((prev) => (prev && prev.id === productId ? { ...prev, modelUrl } : prev));
  };

  const uploadNewProductImages = async (files: File[], asMain: boolean) => {
    if (files.length === 0) {
      return;
    }

    const picked = asMain ? files.slice(0, 1) : files;
    const validationError = validateImageFiles(picked);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploadingNew(true);
    setNewUploadProgress({ done: 0, total: picked.length });
    setError('');

    try {
      const assets: CloudinaryImageAsset[] = [];

      for (const file of picked) {
        assets.push(await uploadImageAsset(file, newProduct.name.trim() || 'product'));
        setNewUploadProgress({ done: assets.length, total: picked.length });
      }

      if (assets.length === 0) {
        return;
      }

      if (asMain) {
        const [newMain, ...extra] = assets;
        const previousMain = newProduct.images[0];
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
        setNewProduct((prev) => ({
          ...prev,
          images: [newMain, ...extra, ...prev.images.slice(1)],
        }));
        toast.success('Main product image uploaded.');
      } else {
        setNewProduct((prev) => ({ ...prev, images: [...prev.images, ...assets] }));
        toast.success(
          `${assets.length} gallery image${assets.length === 1 ? '' : 's'} uploaded.`
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload image.';
      setError(message);
    } finally {
      setUploadingNew(false);
      setNewUploadProgress(null);
    }
  };

  const removeNewProductImage = async (publicId: string) => {
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

      setNewProduct((prev) => ({
        ...prev,
        images: prev.images.filter((image) => image.publicId !== publicId),
      }));
      toast.success('Product image removed.');
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

  const createProduct = async () => {
    setError('');

    if (!newProduct.name.trim()) {
      setError('Product name is required.');
      return;
    }

    const basePrice = Number(newProduct.price || 0);
    const offerPercentage = clampOfferPercentage(Number(newProduct.offerPercentage || 0));
    const badge = newProduct.badge ?? (offerPercentage > 0 ? 'sale' : null);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          slug: newProduct.slug,
          sku: newProduct.sku,
          category: newProduct.category,
          subcategory: newProduct.subcategory,
          status: newProduct.status,
          badge,
          price: Number.isFinite(basePrice) ? Math.max(0, basePrice) : 0,
          offerPercentage,
          stock: Number(newProduct.stock || 0),
          colors: normalizeProductColors(newProduct.colors),
          sizes: normalizeStringList(newProduct.sizes),
          fabrics: normalizeStringList(newProduct.fabrics),
          images: newProduct.images,
          deliveryDays: newProduct.deliveryDays,
          weightKg: Number(newProduct.weightKg || 0),
          widthCm: Number(newProduct.widthCm || 0),
          depthCm: Number(newProduct.depthCm || 0),
          heightCm: Number(newProduct.heightCm || 0),
          description: newProduct.description,
          longDescription: newProduct.longDescription,
        }),
      });

      const data = (await res.json()) as { product?: AdminProductRow; error?: string };
      if (!res.ok || !data.product) {
        throw new Error(data.error ?? 'Could not create product.');
      }

      setProducts((prev) => [normalizeProductRow(data.product!), ...prev]);
      setNewProduct(defaultNewProduct);
      toast.success('Product created successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create product.';
      setError(message);
    }
  };

  return (
    <>
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Catalog Controls</h2>
        <div className={styles.formGrid}>
          <div className={styles.formRow}>
            <label className={styles.label}>Search Products</label>
            <input
              className={styles.input}
              placeholder="Type product name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Category</label>
            <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>All</option>
              <option>Furniture</option>
              <option>Curtains</option>
              <option>Accessories</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>New Product Name</label>
            <input
              className={styles.input}
              placeholder="New product name"
              value={newProduct.name}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>New Product Slug (Optional)</label>
            <input
              className={styles.input}
              placeholder="auto-generated-when-empty"
              value={newProduct.slug}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, slug: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>New Product SKU (Optional)</label>
            <input
              className={styles.input}
              placeholder="ZH-XXXX-000"
              value={newProduct.sku}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, sku: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>New Product Category</label>
            <select
              className={styles.select}
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct((prev) => ({
                  ...prev,
                  category: e.target.value as 'Furniture' | 'Curtains' | 'Accessories',
                }))
              }
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
              value={newProduct.subcategory}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, subcategory: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Original Price (R)</label>
            <input
              className={styles.input}
              inputMode="numeric"
              value={newProduct.price}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Offer Percentage (%)</label>
            <input
              className={styles.input}
              inputMode="decimal"
              placeholder="0"
              value={newProduct.offerPercentage}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, offerPercentage: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>New Product Stock</label>
            <input
              className={styles.input}
              inputMode="numeric"
              value={newProduct.stock}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Status</label>
            <select
              className={styles.select}
              value={newProduct.status}
              onChange={(e) =>
                setNewProduct((prev) => ({
                  ...prev,
                  status: e.target.value as AdminStatus,
                }))
              }
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
              value={newProduct.badge ?? ''}
              onChange={(e) =>
                setNewProduct((prev) => ({
                  ...prev,
                  badge: e.target.value ? (e.target.value as Exclude<AdminBadge, null>) : null,
                }))
              }
            >
              <option value="">None</option>
              <option value="new">new</option>
              <option value="sale">sale</option>
              <option value="custom">custom</option>
              <option value="bestseller">bestseller</option>
            </select>
          </div>
          <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.label}>Color Options</label>
            <ProductColorFields
              colors={newProduct.colors}
              onChange={(colors) => setNewProduct((prev) => ({ ...prev, colors }))}
              uploadBaseName={newProduct.name || 'product'}
            />
          </div>
          <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.label}>Size Options</label>
            <ProductStringListFields
              values={newProduct.sizes}
              onChange={(sizes) => setNewProduct((prev) => ({ ...prev, sizes }))}
              placeholder="e.g. Queen (152cm)"
              addLabel="Add Size"
            />
          </div>
          <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.label}>Fabric Options</label>
            <ProductStringListFields
              values={newProduct.fabrics}
              onChange={(fabrics) => setNewProduct((prev) => ({ ...prev, fabrics }))}
              placeholder="e.g. Linen Blend"
              addLabel="Add Fabric"
            />
          </div>
          <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.label}>Product Images</label>
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <label className={styles.ghostButton} style={{ cursor: uploadingNew ? 'wait' : 'pointer' }}>
                  {uploadingNew
                    ? newUploadProgress && newUploadProgress.total > 1
                      ? `Uploading ${newUploadProgress.done}/${newUploadProgress.total}...`
                      : 'Uploading...'
                    : 'Upload main image'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={uploadingNew}
                    onChange={(e) => {
                      const files = Array.from(e.currentTarget.files ?? []);
                      if (files.length > 0) {
                        void uploadNewProductImages(files, true);
                      }
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
                <label className={styles.ghostButton} style={{ cursor: uploadingNew ? 'wait' : 'pointer' }}>
                  {uploadingNew
                    ? newUploadProgress && newUploadProgress.total > 1
                      ? `Uploading ${newUploadProgress.done}/${newUploadProgress.total}...`
                      : 'Uploading...'
                    : 'Upload gallery images'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    disabled={uploadingNew}
                    onChange={(e) => {
                      const files = Array.from(e.currentTarget.files ?? []);
                      if (files.length > 0) {
                        void uploadNewProductImages(files, false);
                      }
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
                <span style={{ fontSize: '0.72rem', opacity: 0.65 }}>
                  The main image is shown first on the product page.
                </span>
              </div>

              {newProduct.images.length > 0 ? (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {newProduct.images.map((image, imageIndex) => (
                    <div key={image.publicId} style={{ position: 'relative' }}>
                      <img
                        src={image.secureUrl}
                        alt={imageIndex === 0 ? 'Main product image' : `Product image ${imageIndex + 1}`}
                        style={{
                          width: '84px',
                          height: '64px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: imageIndex === 0
                            ? '2px solid var(--gold)'
                            : '1px solid rgba(148, 163, 184, 0.4)',
                          display: 'block',
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          left: '4px',
                          bottom: '4px',
                          fontSize: '0.62rem',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '999px',
                          background: 'rgba(0,0,0,0.65)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {imageIndex === 0 ? 'Main' : `#${imageIndex + 1}`}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove product image ${imageIndex + 1}`}
                        disabled={uploadingNew}
                        onClick={() => void removeNewProductImage(image.publicId)}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: 'none',
                          background: '#1F2937',
                          color: '#FFFFFF',
                          fontSize: '13px',
                          lineHeight: 1,
                          cursor: 'pointer',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: '0.78rem', opacity: 0.65 }}>
                  No images yet — upload a main image and gallery images above.
                </span>
              )}
            </div>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Delivery Days</label>
            <input
              className={styles.input}
              placeholder="7-10 business days"
              value={newProduct.deliveryDays}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, deliveryDays: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Weight (kg)</label>
            <input
              className={styles.input}
              inputMode="decimal"
              placeholder="0"
              value={newProduct.weightKg}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, weightKg: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Width (cm)</label>
            <input
              className={styles.input}
              inputMode="decimal"
              placeholder="0"
              value={newProduct.widthCm}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, widthCm: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Depth (cm)</label>
            <input
              className={styles.input}
              inputMode="decimal"
              placeholder="0"
              value={newProduct.depthCm}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, depthCm: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Height (cm)</label>
            <input
              className={styles.input}
              inputMode="decimal"
              placeholder="0"
              value={newProduct.heightCm}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, heightCm: e.target.value }))}
            />
          </div>
          <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.label}>Short Description</label>
            <textarea
              className={styles.textarea}
              placeholder="A short summary shown near the product title"
              value={newProduct.description}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.label}>Long Description (Optional)</label>
            <textarea
              className={styles.textarea}
              placeholder="Detailed copy for the product detail page"
              value={newProduct.longDescription}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, longDescription: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Create</label>
            <button className={styles.ghostButton} type="button" onClick={createProduct}>
              Add Product
            </button>
          </div>
        </div>
        {error ? <p style={{ color: 'var(--status-danger)', marginTop: '0.75rem' }}>{error}</p> : null}
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Products ({filtered.length})</h2>
        {loading ? <p style={{ color: 'var(--text-dim)' }}>Loading products...</p> : null}
        <div className={`${styles.tableWrap} ${styles.productTableWrap}`}>
          <table className={`${styles.table} ${styles.productTable}`}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Media</th>
                <th>Stock</th>
                <th>Specs</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id}>
                  <td data-label="SKU">
                    <input
                      className={styles.input}
                      readOnly
                      value={product.sku}
                      onChange={(e) =>
                        setLocalProduct(product.id, (current) => ({
                          ...current,
                          sku: e.target.value,
                        }))
                      }
                    />
                  </td>
                  <td data-label="Name">
                    <div style={{ display: 'grid', gap: '0.4rem', minWidth: '220px' }}>
                      <input
                        className={styles.input}
                        readOnly
                        value={product.name}
                        onChange={(e) =>
                          setLocalProduct(product.id, (current) => ({
                            ...current,
                            name: e.target.value,
                          }))
                        }
                      />
                      <input
                        className={styles.input}
                        readOnly
                        value={product.slug}
                        onChange={(e) =>
                          setLocalProduct(product.id, (current) => ({
                            ...current,
                            slug: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </td>
                  <td data-label="Category">
                    <div style={{ display: 'grid', gap: '0.4rem', minWidth: '180px' }}>
                      <select
                        className={styles.select}
                        disabled
                        value={product.category}
                        onChange={(e) =>
                          setLocalProduct(product.id, (current) => ({
                            ...current,
                            category: e.target.value as AdminCategory,
                          }))
                        }
                      >
                        <option>Furniture</option>
                        <option>Curtains</option>
                        <option>Accessories</option>
                      </select>
                      <input
                        className={styles.input}
                        readOnly
                        value={product.subcategory}
                        onChange={(e) =>
                          setLocalProduct(product.id, (current) => ({
                            ...current,
                            subcategory: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </td>
                  <td data-label="Media">
                    <div style={{ display: 'grid', gap: '0.42rem' }}>
                      {product.primaryImage ? (
                        <img
                          src={product.primaryImage}
                          alt={product.name}
                          style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      ) : (
                        <div style={{ width: 60, height: 40, borderRadius: 6, background: 'rgba(255,255,255,0.08)', border: '1px dashed rgba(255,255,255,0.2)' }} />
                      )}
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>{product.imageCount} image(s)</span>
                    </div>
                  </td>
                  <td data-label="Stock">
                    <input
                      className={styles.input}
                      style={{ maxWidth: '88px' }}
                      readOnly
                      inputMode="numeric"
                      value={String(product.stock)}
                      onChange={(e) => {
                        const stock = Number(e.target.value || 0);
                        setProducts((prev) =>
                          prev.map((row) =>
                            row.id === product.id
                              ? {
                                  ...row,
                                  stock: Number.isFinite(stock) ? stock : row.stock,
                                }
                              : row
                          )
                        );
                      }}
                    />
                  </td>
                  <td data-label="Specs">
                    <div style={{ display: 'grid', gap: '0.4rem', minWidth: '170px' }}>
                      <input
                        className={styles.input}
                        readOnly
                        inputMode="decimal"
                        placeholder="Weight kg"
                        value={String(product.weightKg)}
                        onChange={(e) => {
                          const next = toSafeMeasure(e.target.value);
                          setLocalProduct(product.id, (current) => ({
                            ...current,
                            weightKg: next,
                          }));
                        }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.35rem' }}>
                        <input
                          className={styles.input}
                          readOnly
                          inputMode="decimal"
                          placeholder="W"
                          value={String(product.widthCm)}
                          onChange={(e) => {
                            const next = toSafeMeasure(e.target.value);
                            setLocalProduct(product.id, (current) => ({
                              ...current,
                              widthCm: next,
                            }));
                          }}
                        />
                        <input
                          className={styles.input}
                          readOnly
                          inputMode="decimal"
                          placeholder="D"
                          value={String(product.depthCm)}
                          onChange={(e) => {
                            const next = toSafeMeasure(e.target.value);
                            setLocalProduct(product.id, (current) => ({
                              ...current,
                              depthCm: next,
                            }));
                          }}
                        />
                        <input
                          className={styles.input}
                          readOnly
                          inputMode="decimal"
                          placeholder="H"
                          value={String(product.heightCm)}
                          onChange={(e) => {
                            const next = toSafeMeasure(e.target.value);
                            setLocalProduct(product.id, (current) => ({
                              ...current,
                              heightCm: next,
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td data-label="Price">
                    <div style={{ display: 'grid', gap: '0.45rem', minWidth: '180px' }}>
                      <input
                        className={styles.input}
                        readOnly
                        inputMode="numeric"
                        value={String(product.price)}
                        onChange={(e) => {
                          const nextPrice = Number(e.target.value || 0);
                          setLocalProduct(product.id, (current) =>
                            applyOfferToProduct(
                              current,
                              Number.isFinite(nextPrice) ? nextPrice : current.price,
                              current.offerPercentage
                            )
                          );
                        }}
                      />
                      <input
                        className={styles.input}
                        readOnly
                        inputMode="decimal"
                        placeholder="Offer %"
                        value={String(product.offerPercentage)}
                        onChange={(e) => {
                          const nextOffer = Number(e.target.value || 0);
                          setLocalProduct(product.id, (current) =>
                            applyOfferToProduct(
                              current,
                              current.price,
                              Number.isFinite(nextOffer) ? nextOffer : current.offerPercentage
                            )
                          );
                        }}
                      />
                    </div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: '0.3rem', display: 'grid', gap: '0.2rem' }}>
                      <span>Original: {formatCurrency(product.price)}</span>
                      <span>Offer Price: {formatCurrency(product.offerPrice)}</span>
                    </div>
                  </td>
                  <td data-label="Status">
                    <div style={{ display: 'grid', gap: '0.4rem', minWidth: '145px' }}>
                      <select
                        className={styles.select}
                        disabled
                        value={product.status}
                        onChange={(e) =>
                          setLocalProduct(product.id, (current) => ({
                            ...current,
                            status: e.target.value as AdminStatus,
                          }))
                        }
                      >
                        <option>Active</option>
                        <option>Draft</option>
                        <option>Archived</option>
                      </select>
                      <select
                        className={styles.select}
                        disabled
                        value={product.badge ?? ''}
                        onChange={(e) =>
                          setLocalProduct(product.id, (current) => ({
                            ...current,
                            badge: e.target.value ? (e.target.value as Exclude<AdminBadge, null>) : null,
                          }))
                        }
                      >
                        <option value="">No Badge</option>
                        <option value="new">new</option>
                        <option value="sale">sale</option>
                        <option value="custom">custom</option>
                        <option value="bestseller">bestseller</option>
                      </select>
                    </div>
                  </td>
                  <td data-label="Actions">
                    <div className={styles.inlineActions}>
                      <button
                        className={styles.ghostButton}
                        disabled={
                          savingId === product.id ||
                          (editingProductId !== null && editingProductId !== product.id) ||
                          product.stock <= 0
                        }
                        onClick={() => void adjustProductStock(product, -1)}
                      >
                        -1 Stock
                      </button>
                      <button
                        className={styles.ghostButton}
                        disabled={
                          savingId === product.id ||
                          (editingProductId !== null && editingProductId !== product.id)
                        }
                        onClick={() => void adjustProductStock(product, 1)}
                      >
                        +1 Stock
                      </button>
                    </div>
                    <div className={styles.inlineActions}>
                      <button
                        className={styles.ghostButton}
                        disabled={
                          savingId === product.id ||
                          (editingProductId !== null && editingProductId !== product.id)
                        }
                        onClick={() => openEditModal(product)}
                      >
                        {editingProductId === product.id ? 'Editing...' : 'Edit'}
                      </button>
                      <button
                        className={styles.ghostButton}
                        disabled={savingId === product.id || product.images.length === 0}
                        onClick={() => openImageManager(product)}
                      >
                        Remove Img
                      </button>
                      <button
                        className={styles.ghostButton}
                        disabled={savingId === product.id}
                        onClick={() => deleteProduct(product.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
                            : '3px solid rgba(148, 163, 184, 0.35)',
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
                        <span
                          style={{
                            position: 'absolute',
                            left: '6px',
                            bottom: '6px',
                            fontSize: '0.62rem',
                            padding: '0.15rem 0.4rem',
                            borderRadius: '999px',
                            background: 'rgba(0,0,0,0.65)',
                            color: 'var(--text-primary)',
                            lineHeight: 1.4,
                          }}
                        >
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
                              color: '#1F2937',
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
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.75rem' }}>
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

      {editingProductId && editDraft ? (
        <div className={styles.modalOverlay} onClick={closeEditModal}>
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-product-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h3 id="edit-product-title" className={styles.modalTitle}>Edit Product</h3>
                <p className={styles.modalMeta}>ID: {editingProductId}</p>
              </div>
              <button className={styles.ghostButton} onClick={closeEditModal} disabled={savingId === editingProductId}>
                Close
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formRow}>
                  <label className={styles.label}>SKU</label>
                  <input
                    className={styles.input}
                    value={editDraft.sku}
                    onChange={(e) =>
                      setEditDraft((prev) => (prev ? { ...prev, sku: e.target.value } : prev))
                    }
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Name</label>
                  <input
                    className={styles.input}
                    value={editDraft.name}
                    onChange={(e) =>
                      setEditDraft((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                    }
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Slug</label>
                  <input
                    className={styles.input}
                    value={editDraft.slug}
                    onChange={(e) =>
                      setEditDraft((prev) => (prev ? { ...prev, slug: e.target.value } : prev))
                    }
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Category</label>
                  <select
                    className={styles.select}
                    value={editDraft.category}
                    onChange={(e) =>
                      setEditDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              category: e.target.value as AdminCategory,
                            }
                          : prev
                      )
                    }
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
                    value={editDraft.subcategory}
                    onChange={(e) =>
                      setEditDraft((prev) => (prev ? { ...prev, subcategory: e.target.value } : prev))
                    }
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Status</label>
                  <select
                    className={styles.select}
                    value={editDraft.status}
                    onChange={(e) =>
                      setEditDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              status: e.target.value as AdminStatus,
                            }
                          : prev
                      )
                    }
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
                    value={editDraft.badge ?? ''}
                    onChange={(e) =>
                      setEditDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              badge: e.target.value ? (e.target.value as Exclude<AdminBadge, null>) : null,
                            }
                          : prev
                      )
                    }
                  >
                    <option value="">No Badge</option>
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
                    value={String(editDraft.stock)}
                    onChange={(e) => {
                      const nextStock = Number(e.target.value || 0);
                      setEditDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              stock: Number.isFinite(nextStock) ? nextStock : prev.stock,
                            }
                          : prev
                      );
                    }}
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Price (R)</label>
                  <input
                    className={styles.input}
                    inputMode="numeric"
                    value={String(editDraft.price)}
                    onChange={(e) => {
                      const nextPrice = Number(e.target.value || 0);
                      setEditDraft((prev) =>
                        prev
                          ? applyOfferToProduct(
                              prev,
                              Number.isFinite(nextPrice) ? nextPrice : prev.price,
                              prev.offerPercentage
                            )
                          : prev
                      );
                    }}
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Offer Percentage (%)</label>
                  <input
                    className={styles.input}
                    inputMode="decimal"
                    value={String(editDraft.offerPercentage)}
                    onChange={(e) => {
                      const nextOffer = Number(e.target.value || 0);
                      setEditDraft((prev) =>
                        prev
                          ? applyOfferToProduct(
                              prev,
                              prev.price,
                              Number.isFinite(nextOffer) ? nextOffer : prev.offerPercentage
                            )
                          : prev
                      );
                    }}
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Delivery Days</label>
                  <input
                    className={styles.input}
                    value={editDraft.deliveryDays}
                    onChange={(e) =>
                      setEditDraft((prev) => (prev ? { ...prev, deliveryDays: e.target.value } : prev))
                    }
                  />
                </div>

                <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Color Options</label>
                  <ProductColorFields
                    colors={editDraft.colors}
                    onChange={(colors) =>
                      setEditDraft((prev) => (prev ? { ...prev, colors } : prev))
                    }
                    uploadBaseName={editDraft.name || 'product'}
                    galleryImages={editDraft.images}
                  />
                </div>

                <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Size Options</label>
                  <ProductStringListFields
                    values={editDraft.sizes}
                    onChange={(sizes) =>
                      setEditDraft((prev) => (prev ? { ...prev, sizes } : prev))
                    }
                    placeholder="e.g. Queen (152cm)"
                    addLabel="Add Size"
                  />
                </div>

                <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Fabric Options</label>
                  <ProductStringListFields
                    values={editDraft.fabrics}
                    onChange={(fabrics) =>
                      setEditDraft((prev) => (prev ? { ...prev, fabrics } : prev))
                    }
                    placeholder="e.g. Linen Blend"
                    addLabel="Add Fabric"
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Weight (kg)</label>
                  <input
                    className={styles.input}
                    inputMode="decimal"
                    value={String(editDraft.weightKg)}
                    onChange={(e) =>
                      setEditDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              weightKg: toSafeMeasure(e.target.value),
                            }
                          : prev
                      )
                    }
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Width (cm)</label>
                  <input
                    className={styles.input}
                    inputMode="decimal"
                    value={String(editDraft.widthCm)}
                    onChange={(e) =>
                      setEditDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              widthCm: toSafeMeasure(e.target.value),
                            }
                          : prev
                      )
                    }
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Depth (cm)</label>
                  <input
                    className={styles.input}
                    inputMode="decimal"
                    value={String(editDraft.depthCm)}
                    onChange={(e) =>
                      setEditDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              depthCm: toSafeMeasure(e.target.value),
                            }
                          : prev
                      )
                    }
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Height (cm)</label>
                  <input
                    className={styles.input}
                    inputMode="decimal"
                    value={String(editDraft.heightCm)}
                    onChange={(e) =>
                      setEditDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              heightCm: toSafeMeasure(e.target.value),
                            }
                          : prev
                      )
                    }
                  />
                </div>

                <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Short Description</label>
                  <textarea
                    className={styles.textarea}
                    value={editDraft.description}
                    onChange={(e) =>
                      setEditDraft((prev) => (prev ? { ...prev, description: e.target.value } : prev))
                    }
                  />
                </div>

                <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Long Description</label>
                  <textarea
                    className={styles.textarea}
                    value={editDraft.longDescription}
                    onChange={(e) =>
                      setEditDraft((prev) => (prev ? { ...prev, longDescription: e.target.value } : prev))
                    }
                  />
                </div>

                <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>3D Model (GLB)</label>
                  {editingProductId ? (
                    <ProductModelFields
                      productId={editingProductId}
                      modelUrl={editDraft.modelUrl}
                      onModelChange={(modelUrl) => applyModelChange(editingProductId, modelUrl)}
                      onError={setError}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.ghostButton} onClick={closeEditModal} disabled={savingId === editingProductId}>
                Cancel
              </button>
              <button className={styles.ghostButton} onClick={saveEditModal} disabled={savingId === editingProductId}>
                {savingId === editingProductId ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
