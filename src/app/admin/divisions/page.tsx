'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useToastFeedback } from '@/lib/toast-feedback';
import { CATALOG_CATEGORIES, formatZAR } from '@/lib/wallz-deckz-catalog';
import styles from '../admin-pages.module.css';

interface CloudinaryImageAsset {
  publicId: string;
  secureUrl: string;
  alt: string;
  width?: number;
  height?: number;
}

type Division = 'wallz' | 'deckz';
type CatalogKind = 'completed' | 'concept';

interface DivisionItem {
  id: string;
  division: Division;
  kind: CatalogKind;
  title: string;
  description: string;
  category: string;
  image: CloudinaryImageAsset | null;
  gallery: CloudinaryImageAsset[];
  startingPrice: number | null;
  costMaterials: number | null;
  costLabour: number | null;
  dimensions: string;
  materials: string[];
  finishes: { name: string; hex: string }[];
  inclusions: string[];
  leadTime: string;
  location: string;
  completedYear: number | null;
  status: 'Published' | 'Draft';
  displayOrder: number;
  updatedAt: string;
}

/**
 * Unified shape for the create & edit division form — the same grouped editor
 * serves both modes; numbers are strings so empty inputs stay empty.
 */
interface DivisionFormValues {
  division: Division;
  kind: CatalogKind;
  title: string;
  category: string;
  description: string;
  status: 'Published' | 'Draft';
  displayOrder: string;
  startingPrice: string;
  costMaterials: string;
  costLabour: string;
  dimensions: string;
  location: string;
  completedYear: string;
  leadTime: string;
  materials: string[];
  inclusions: string[];
  finishes: { name: string; hex: string }[];
  image: CloudinaryImageAsset | null;
  gallery: CloudinaryImageAsset[];
}

type UploadTarget = 'hero' | 'gallery';

const divisionLabel: Record<Division, string> = {
  wallz: 'WALLZ',
  deckz: 'DECKZ',
};

const HEX_PATTERN = /^#[0-9a-fA-F]{3,8}$/;

function toNumberOrNull(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : null;
}

function cleanList(values: string[]): string[] {
  return values.map((entry) => entry.trim()).filter(Boolean);
}

function cleanFinishes(finishes: { name: string; hex: string }[]) {
  return finishes
    .map((finish) => ({ name: finish.name.trim(), hex: finish.hex.trim() }))
    .filter((finish) => finish.name && HEX_PATTERN.test(finish.hex));
}

const defaultNewDivision: DivisionFormValues = {
  division: 'wallz',
  kind: 'completed',
  title: '',
  category: '',
  description: '',
  status: 'Published',
  displayOrder: '',
  startingPrice: '',
  costMaterials: '',
  costLabour: '',
  dimensions: '',
  location: '',
  completedYear: '',
  leadTime: '',
  materials: [],
  inclusions: [],
  finishes: [],
  image: null,
  gallery: [],
};

function formValuesFromRow(row: DivisionItem): DivisionFormValues {
  return {
    division: row.division,
    kind: row.kind,
    title: row.title,
    category: row.category,
    description: row.description,
    status: row.status,
    displayOrder: String(row.displayOrder),
    startingPrice: row.startingPrice === null ? '' : String(row.startingPrice),
    costMaterials: row.costMaterials === null ? '' : String(row.costMaterials),
    costLabour: row.costLabour === null ? '' : String(row.costLabour),
    dimensions: row.dimensions,
    location: row.location,
    completedYear: row.completedYear === null ? '' : String(row.completedYear),
    leadTime: row.leadTime,
    materials: [...row.materials],
    inclusions: [...row.inclusions],
    finishes: row.finishes.map((finish) => ({ ...finish })),
    image: row.image ? { ...row.image } : null,
    gallery: row.gallery.map((asset) => ({ ...asset })),
  };
}

function formatCatalogPrice(item: DivisionItem): string | null {
  if (item.startingPrice === null) return null;
  return item.kind === 'concept'
    ? `From ${formatZAR(item.startingPrice)}`
    : formatZAR(item.startingPrice);
}

function CategoryDatalist({ division }: { division: Division }) {
  return (
    <datalist id={`catalog-categories-${division}`}>
      {CATALOG_CATEGORIES[division].map((category) => (
        <option key={category} value={category} />
      ))}
    </datalist>
  );
}

interface FinishFieldsProps {
  finishes: { name: string; hex: string }[];
  onChange: (finishes: { name: string; hex: string }[]) => void;
}

function FinishFields({ finishes, onChange }: FinishFieldsProps) {
  const updateRow = (index: number, patch: Partial<{ name: string; hex: string }>) => {
    onChange(finishes.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  };

  if (finishes.length === 0) {
    return (
      <button
        className={styles.ghostButton}
        type="button"
        onClick={() => onChange([{ name: '', hex: '#B59241' }])}
      >
        + Add finish option
      </button>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      {finishes.map((finish, index) => (
        <div key={index} className={styles.inlineActions}>
          <input
            className={styles.input}
            placeholder="Finish name"
            value={finish.name}
            onChange={(e) => updateRow(index, { name: e.target.value })}
          />
          <input
            className={styles.input}
            type="color"
            aria-label={`${finish.name || 'Finish'} colour`}
            style={{ width: 44, height: 38, padding: 2, cursor: 'pointer' }}
            value={HEX_PATTERN.test(finish.hex) ? finish.hex : '#B59241'}
            onChange={(e) => updateRow(index, { hex: e.target.value })}
          />
          <button
            className={styles.ghostButton}
            type="button"
            onClick={() => onChange(finishes.filter((_, rowIndex) => rowIndex !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <div>
        <button
          className={styles.ghostButton}
          type="button"
          onClick={() => onChange([...finishes, { name: '', hex: '#B59241' }])}
        >
          + Add finish option
        </button>
      </div>
    </div>
  );
}

interface DivisionFormFieldsProps {
  values: DivisionFormValues;
  onPatch: (patch: Partial<DivisionFormValues>) => void;
  mode: 'create' | 'edit';
  uploading: UploadTarget | null;
  onUpload: (file: File, target: UploadTarget) => void;
  onRemoveHero: () => void;
  onRemoveGalleryImage: (publicId: string) => void;
}

function DivisionFormFields({
  values,
  onPatch,
  mode,
  uploading,
  onUpload,
  onRemoveHero,
  onRemoveGalleryImage,
}: DivisionFormFieldsProps) {
  const costSum =
    toNumberOrNull(values.costMaterials) !== null && toNumberOrNull(values.costLabour) !== null
      ? (toNumberOrNull(values.costMaterials) ?? 0) + (toNumberOrNull(values.costLabour) ?? 0)
      : null;
  const startingPriceValue = toNumberOrNull(values.startingPrice);

  return (
    <div>
      {/* — Basics — */}
      <div className={styles.fieldSection}>
        <h4 className={styles.fieldSectionTitle}>Basics</h4>
        <div className={styles.fieldGrid}>
          {mode === 'create' ? (
            <div className={styles.formRow}>
              <label className={styles.label}>Division</label>
              <select
                className={styles.select}
                value={values.division}
                onChange={(e) => onPatch({ division: e.target.value as Division })}
              >
                <option value="wallz">WALLZ</option>
                <option value="deckz">DECKZ</option>
              </select>
            </div>
          ) : null}
          <div className={styles.formRow}>
            <label className={styles.label}>Type</label>
            <select
              className={styles.select}
              value={values.kind}
              onChange={(e) => onPatch({ kind: e.target.value as CatalogKind })}
            >
              <option value="completed">Completed Project</option>
              <option value="concept">Pre-Designed Concept</option>
            </select>
          </div>
          <div className={`${styles.formRow} ${styles.fieldFull}`}>
            <label className={styles.label}>Title</label>
            <input
              className={styles.input}
              placeholder="e.g. Bryanston Home Cinema Media Wall"
              value={values.title}
              onChange={(e) => onPatch({ title: e.target.value })}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Category</label>
            <input
              className={styles.input}
              list={`catalog-categories-${values.division}`}
              placeholder="Pick a catalog category"
              value={values.category}
              onChange={(e) => onPatch({ category: e.target.value })}
            />
            <CategoryDatalist division={values.division} />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Status</label>
            <select
              className={styles.select}
              value={values.status}
              onChange={(e) => onPatch({ status: e.target.value as DivisionFormValues['status'] })}
            >
              <option>Published</option>
              <option>Draft</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Display order</label>
            <input
              className={styles.input}
              inputMode="numeric"
              placeholder="0"
              value={values.displayOrder}
              onChange={(e) => onPatch({ displayOrder: e.target.value })}
            />
          </div>
          <div className={`${styles.formRow} ${styles.fieldFull}`}>
            <label className={styles.label}>Short description</label>
            <textarea
              className={styles.textarea}
              rows={3}
              placeholder="Shown on the catalog card"
              value={values.description}
              onChange={(e) => onPatch({ description: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* — Pricing — */}
      <div className={styles.fieldSection}>
        <h4 className={styles.fieldSectionTitle}>Pricing</h4>
        <div className={styles.fieldGrid}>
          <div className={styles.formRow}>
            <label className={styles.label}>
              {values.kind === 'concept' ? 'Starting price (R)' : 'Project value (R)'}
            </label>
            <input
              className={styles.input}
              inputMode="numeric"
              placeholder="e.g. 54000"
              value={values.startingPrice}
              onChange={(e) => onPatch({ startingPrice: e.target.value })}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Materials cost (R)</label>
            <input
              className={styles.input}
              inputMode="numeric"
              placeholder="e.g. 31500"
              value={values.costMaterials}
              onChange={(e) => onPatch({ costMaterials: e.target.value })}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Labour &amp; installation (R)</label>
            <input
              className={styles.input}
              inputMode="numeric"
              placeholder="e.g. 22500"
              value={values.costLabour}
              onChange={(e) => onPatch({ costLabour: e.target.value })}
            />
          </div>
          <p className={`${styles.fieldHint} ${styles.fieldFull}`}>
            Leave empty for “Price on request”.{' '}
            {costSum !== null
              ? `Materials + labour = ${formatZAR(costSum)}${
                  startingPriceValue !== null && costSum !== startingPriceValue
                    ? ` — does not match the ${values.kind === 'concept' ? 'starting price' : 'project value'} of ${formatZAR(startingPriceValue)}.`
                    : ''
                }`
              : 'Materials and labour together show the cost breakdown in the catalog.'}
          </p>
        </div>
      </div>

      {/* — Specifications — */}
      <div className={styles.fieldSection}>
        <h4 className={styles.fieldSectionTitle}>Specifications</h4>
        <div className={styles.fieldGrid}>
          <div className={styles.formRow}>
            <label className={styles.label}>Dimensions</label>
            <input
              className={styles.input}
              placeholder="e.g. 3.6m W × 2.7m H or 25 sqm"
              value={values.dimensions}
              onChange={(e) => onPatch({ dimensions: e.target.value })}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Location (completed projects)</label>
            <input
              className={styles.input}
              placeholder="e.g. Sandton, Johannesburg"
              value={values.location}
              onChange={(e) => onPatch({ location: e.target.value })}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Completed year</label>
            <input
              className={styles.input}
              inputMode="numeric"
              placeholder="e.g. 2025"
              value={values.completedYear}
              onChange={(e) => onPatch({ completedYear: e.target.value })}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Lead time (concepts)</label>
            <input
              className={styles.input}
              placeholder="e.g. 4–6 weeks from approved design"
              value={values.leadTime}
              onChange={(e) => onPatch({ leadTime: e.target.value })}
            />
          </div>
          <div className={`${styles.formRow} ${styles.fieldFull}`}>
            <label className={styles.label}>Materials used (one per line)</label>
            <textarea
              className={styles.textarea}
              rows={4}
              placeholder={'SupaWood carcass\nOak-look slat cladding\nLED cove lighting'}
              value={values.materials.join('\n')}
              onChange={(e) => onPatch({ materials: e.target.value.split('\n') })}
            />
          </div>
          <div className={`${styles.formRow} ${styles.fieldFull}`}>
            <label className={styles.label}>Included with every install (one per line)</label>
            <textarea
              className={styles.textarea}
              rows={4}
              placeholder={'Free on-site measurement\nInstallation by the ZHUA team'}
              value={values.inclusions.join('\n')}
              onChange={(e) => onPatch({ inclusions: e.target.value.split('\n') })}
            />
          </div>
          <div className={`${styles.formRow} ${styles.fieldFull}`}>
            <label className={styles.label}>Available colours &amp; finishes</label>
            <FinishFields
              finishes={values.finishes}
              onChange={(finishes) => onPatch({ finishes })}
            />
          </div>
        </div>
      </div>

      {/* — Media — */}
      <div className={styles.fieldSection}>
        <h4 className={styles.fieldSectionTitle}>Media</h4>
        <div className={styles.fieldGrid}>
          <div className={styles.fieldFull}>
            <div className={styles.thumbStrip}>
              {values.image ? (
                <span className={styles.thumbBox}>
                  <img
                    src={values.image.secureUrl}
                    alt={values.image.alt || values.title || 'Hero image'}
                    style={{
                      width: 96,
                      height: 68,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '2px solid var(--gold)',
                      display: 'block',
                    }}
                  />
                  <span className={styles.thumbTag}>hero</span>
                  <button
                    type="button"
                    aria-label="Remove hero image"
                    className={styles.thumbRemove}
                    onClick={onRemoveHero}
                  >
                    ×
                  </button>
                </span>
              ) : null}
              {values.gallery.map((asset) => (
                <span key={asset.publicId} className={styles.thumbBox}>
                  <img
                    src={asset.secureUrl}
                    alt={asset.alt || values.title || 'Gallery image'}
                    style={{
                      width: 84,
                      height: 64,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid var(--border-light)',
                      display: 'block',
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Remove gallery image"
                    className={styles.thumbRemove}
                    onClick={() => onRemoveGalleryImage(asset.publicId)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
              <label
                className={styles.ghostButton}
                style={{ cursor: uploading ? 'wait' : 'pointer' }}
              >
                {uploading === 'hero'
                  ? 'Uploading...'
                  : values.image
                    ? mode === 'edit'
                      ? 'Replace hero'
                      : 'Upload hero'
                    : 'Upload hero image'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  disabled={uploading !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onUpload(file, 'hero');
                    }
                    e.target.value = '';
                  }}
                />
              </label>
              <label
                className={styles.ghostButton}
                style={{ cursor: uploading ? 'wait' : 'pointer' }}
              >
                {uploading === 'gallery' ? 'Uploading...' : 'Add gallery photo'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  disabled={uploading !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onUpload(file, 'gallery');
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <p className={styles.fieldHint} style={{ marginTop: '0.5rem' }}>
              The hero image fronts the catalog card; gallery photos fill the detail view.
              {mode === 'edit'
                ? ' Replacements and removals are applied to Cloudinary when you save.'
                : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDivisionsPage() {
  const [items, setItems] = useState<DivisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<UploadTarget | null>(null);
  const [activeDivision, setActiveDivision] = useState<Division>('wallz');
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [divisionForm, setDivisionForm] = useState<DivisionFormValues | null>(null);

  useToastFeedback({ error });

  const loadItems = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/division-items', { cache: 'no-store' });
      const data = (await res.json()) as { items?: DivisionItem[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Could not load division items.');
      }

      setItems(data.items ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load division items.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const formOpen = formMode !== null && divisionForm !== null;

  useEffect(() => {
    if (!formOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !(formMode === 'edit' && savingId === formId)) {
        closeForm();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formOpen, formMode, formId, savingId]);

  const visibleItems = useMemo(
    () => items.filter((item) => item.division === activeDivision),
    [items, activeDivision]
  );

  const patchLocal = (id: string, partial: Partial<DivisionItem>) => {
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, ...partial } : row)));
  };

  const updateItem = async (
    id: string,
    partial: Record<string, unknown>,
    successMessage = 'Division item updated successfully.'
  ): Promise<boolean> => {
    setSavingId(id);
    setError('');

    try {
      const res = await fetch(`/api/admin/division-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });

      const data = (await res.json()) as { item?: DivisionItem; error?: string };
      if (!res.ok || !data.item) {
        throw new Error(data.error ?? 'Could not update division item.');
      }

      setItems((prev) => prev.map((item) => (item.id === id ? data.item! : item)));
      toast.success(successMessage);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update division item.';
      setError(message);
      return false;
    } finally {
      setSavingId(null);
    }
  };

  const openCreateForm = () => {
    setError('');
    setFormMode('create');
    setFormId(null);
    setDivisionForm({ ...defaultNewDivision, division: activeDivision });
  };

  const openEditForm = (item: DivisionItem) => {
    setError('');
    setFormMode('edit');
    setFormId(item.id);
    setDivisionForm(formValuesFromRow(item));
  };

  const closeForm = () => {
    if (formMode === 'edit' && formId && savingId === formId) {
      return;
    }

    setFormMode(null);
    setFormId(null);
    setDivisionForm(null);
  };

  const buildPayload = (values: DivisionFormValues) => ({
    division: values.division,
    kind: values.kind,
    title: values.title.trim(),
    category: values.category.trim(),
    description: values.description.trim(),
    status: values.status.toLowerCase(),
    displayOrder: toNumberOrNull(values.displayOrder) ?? 0,
    startingPrice: toNumberOrNull(values.startingPrice),
    costMaterials: toNumberOrNull(values.costMaterials),
    costLabour: toNumberOrNull(values.costLabour),
    dimensions: values.dimensions.trim() || null,
    location: values.location.trim() || null,
    completedYear: toNumberOrNull(values.completedYear),
    leadTime: values.leadTime.trim() || null,
    materials: cleanList(values.materials),
    inclusions: cleanList(values.inclusions),
    finishes: cleanFinishes(values.finishes),
    image: values.image,
    gallery: values.gallery,
  });

  const saveForm = async () => {
    if (!divisionForm || !formMode) {
      return;
    }

    if (!divisionForm.title.trim()) {
      setError('Title is required.');
      return;
    }

    const payload = buildPayload(divisionForm);

    if (formMode === 'create') {
      setSavingId('new');
      setError('');

      try {
        const res = await fetch('/api/admin/division-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = (await res.json()) as { item?: DivisionItem; error?: string };
        if (!res.ok || !data.item) {
          throw new Error(data.error ?? 'Could not create division item.');
        }

        setItems((prev) => [data.item!, ...prev]);
        setFormMode(null);
        setFormId(null);
        setDivisionForm(null);
        setActiveDivision(data.item.division);
        toast.success('Division item created successfully.');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not create division item.';
        setError(message);
      } finally {
        setSavingId(null);
      }
      return;
    }

    if (!formId) {
      return;
    }

    const didSave = await updateItem(formId, payload, 'Division item saved successfully.');
    if (!didSave) {
      return;
    }

    setFormMode(null);
    setFormId(null);
    setDivisionForm(null);
  };

  const uploadFormImage = async (file: File, target: UploadTarget) => {
    if (!divisionForm) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Max file size is 10MB.');
      return;
    }

    setUploadingTarget(target);
    setError('');

    try {
      const baseName = `${divisionForm.division}-${divisionForm.title || 'item'}-${target}`;

      const signRes = await fetch('/api/admin/media/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'zhua/divisions', baseName }),
      });

      const signData = (await signRes.json()) as {
        apiKey?: string;
        timestamp?: number;
        signature?: string;
        folder?: string;
        publicId?: string;
        uploadUrl?: string;
        error?: string;
      };

      if (!signRes.ok || !signData.uploadUrl || !signData.apiKey || !signData.signature || !signData.timestamp) {
        throw new Error(signData.error ?? 'Could not prepare upload.');
      }

      const uploadBody = new FormData();
      uploadBody.append('file', file);
      uploadBody.append('api_key', signData.apiKey);
      uploadBody.append('timestamp', String(signData.timestamp));
      uploadBody.append('signature', signData.signature);
      uploadBody.append('folder', signData.folder ?? 'zhua/divisions');
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
        error?: { message?: string };
      };

      if (!uploadRes.ok || !uploadData.secure_url || !uploadData.public_id) {
        throw new Error(uploadData.error?.message ?? 'Cloudinary upload failed.');
      }

      const asset: CloudinaryImageAsset = {
        publicId: uploadData.public_id,
        secureUrl: uploadData.secure_url,
        alt: `${divisionForm.title || 'Division item'} — ZHUA ${divisionLabel[divisionForm.division]}`,
        width: uploadData.width,
        height: uploadData.height,
      };

      if (target === 'hero') {
        setDivisionForm((prev) => (prev ? { ...prev, image: asset } : prev));
      } else {
        setDivisionForm((prev) => (prev ? { ...prev, gallery: [...prev.gallery, asset] } : prev));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload image.';
      setError(message);
    } finally {
      setUploadingTarget(null);
    }
  };

  const deleteCloudinaryAsset = async (publicId: string) => {
    try {
      await fetch('/api/admin/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
      });
    } catch {
      // Non-fatal: the asset stays in Cloudinary but is removed from the form.
    }
  };

  const removeHero = async () => {
    if (!divisionForm?.image) {
      return;
    }

    // In create mode the hero is not persisted yet — delete it from
    // Cloudinary straight away. In edit mode the PATCH route handles the
    // replacement/removal cleanup when the form is saved.
    if (formMode === 'create') {
      await deleteCloudinaryAsset(divisionForm.image.publicId);
    }
    setDivisionForm((prev) => (prev ? { ...prev, image: null } : prev));
  };

  const removeGalleryImage = async (publicId: string) => {
    if (!divisionForm) {
      return;
    }

    if (formMode === 'create') {
      await deleteCloudinaryAsset(publicId);
    }
    setDivisionForm((prev) =>
      prev ? { ...prev, gallery: prev.gallery.filter((asset) => asset.publicId !== publicId) } : prev
    );
  };

  const toggleStatus = async (item: DivisionItem) => {
    const next = item.status === 'Published' ? 'Draft' : 'Published';
    await updateItem(item.id, { status: next }, `Status changed to ${next}.`);
  };

  const deleteItem = async (id: string) => {
    setSavingId(id);
    setError('');

    try {
      const res = await fetch(`/api/admin/division-items/${id}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not delete division item.');
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success('Division item deleted successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete division item.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const formSaving = savingId === (formMode === 'create' ? 'new' : formId);

  return (
    <>
      <section className={styles.card}>
        <div className={styles.toolbar}>
          {(['wallz', 'deckz'] as Division[]).map((division) => (
            <button
              key={division}
              type="button"
              className={`${styles.chip} ${activeDivision === division ? styles.chipGold : ''}`}
              style={{ cursor: 'pointer', padding: '0.3rem 0.8rem', fontSize: '0.72rem' }}
              onClick={() => setActiveDivision(division)}
            >
              {divisionLabel[division]} ({items.filter((item) => item.division === division).length})
            </button>
          ))}
          <button className={styles.primaryButton} type="button" onClick={openCreateForm}>
            + Add Item
          </button>
          <span className={styles.toolbarCount}>
            {loading ? 'Loading…' : `${visibleItems.length} item${visibleItems.length === 1 ? '' : 's'}`}
          </span>
        </div>
        {error ? <p style={{ color: 'var(--status-danger)', marginTop: '0.75rem' }}>{error}</p> : null}
        <p className={styles.fieldHint} style={{ marginTop: '0.6rem' }}>
          Published items appear in the public {divisionLabel[activeDivision]} catalog — use Edit for
          pricing, specifications, finishes and photos.
        </p>

        <div style={{ marginTop: '0.5rem' }}>
          {visibleItems.map((item) => {
            const price = formatCatalogPrice(item);

            return (
              <div key={item.id} className={styles.listRow}>
                {item.image ? (
                  <img className={styles.listThumb} src={item.image.secureUrl} alt={item.image.alt || item.title} />
                ) : (
                  <div className={styles.listThumbEmpty} aria-hidden="true" />
                )}

                <div className={styles.listMain}>
                  <span className={styles.listTitle}>{item.title}</span>
                  <span className={styles.listMeta}>
                    <span className={item.kind === 'concept' ? `${styles.chip} ${styles.chipGold}` : styles.chip}>
                      {item.kind === 'concept' ? 'Concept' : 'Completed'}
                    </span>
                    {item.category ? <span className={styles.chip}>{item.category}</span> : null}
                    {price ? <span>{price}</span> : <span>Price on request</span>}
                    <span>Updated {item.updatedAt}</span>
                  </span>
                </div>

                <div className={styles.listSide}>
                  <div className={styles.listActions}>
                    <button
                      type="button"
                      className={`${styles.chip} ${styles.chipToggle} ${item.status === 'Published' ? styles.chipGold : ''}`}
                      style={{ cursor: savingId === item.id ? 'wait' : 'pointer' }}
                      disabled={savingId === item.id}
                      onClick={() => void toggleStatus(item)}
                      aria-label={`Set ${item.title} to ${item.status === 'Published' ? 'draft' : 'published'}`}
                    >
                      {item.status}
                    </button>
                    <input
                      className={`${styles.input} ${styles.orderInput}`}
                      inputMode="numeric"
                      aria-label={`Display order of ${item.title}`}
                      value={String(item.displayOrder)}
                      onChange={(e) => {
                        const next = Number(e.target.value || 0);
                        patchLocal(item.id, {
                          displayOrder: Number.isFinite(next) ? next : item.displayOrder,
                        });
                      }}
                      onBlur={(e) => {
                        const next = Number(e.target.value || 0);
                        if (Number.isFinite(next) && next !== item.displayOrder) {
                          void updateItem(item.id, { displayOrder: next }, 'Display order updated.');
                        }
                      }}
                    />
                  </div>
                  <div className={styles.listActions}>
                    <button
                      className={styles.ghostButton}
                      disabled={savingId === item.id}
                      onClick={() => openEditForm(item)}
                    >
                      Edit
                    </button>
                    <button
                      className={`${styles.ghostButton} ${styles.dangerText}`}
                      disabled={savingId === item.id}
                      onClick={() => void deleteItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {!loading && visibleItems.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', padding: '1rem 0' }}>
              No {divisionLabel[activeDivision]} items yet — add the first one.
            </p>
          ) : null}
        </div>
      </section>

      {/* — Create / Edit division item form — */}
      {formOpen && divisionForm ? (
        <div className={styles.modalOverlay} onClick={closeForm}>
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="division-form-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h3 id="division-form-title" className={styles.modalTitle}>
                  {formMode === 'create' ? 'Add Division Item' : 'Edit Division Item'}
                </h3>
                <p className={styles.modalMeta}>
                  {formMode === 'edit'
                    ? `${divisionForm.title || 'Item'} · ${divisionLabel[divisionForm.division]}`
                    : `New ${divisionLabel[divisionForm.division]} catalog item — only the title is required to start.`}
                </p>
              </div>
              <button className={styles.ghostButton} onClick={closeForm} disabled={formSaving}>
                Close
              </button>
            </div>

            <div className={styles.modalBody}>
              <DivisionFormFields
                values={divisionForm}
                onPatch={(patch) =>
                  setDivisionForm((prev) => (prev ? { ...prev, ...patch } : prev))
                }
                mode={formMode}
                uploading={uploadingTarget}
                onUpload={(file, target) => void uploadFormImage(file, target)}
                onRemoveHero={() => void removeHero()}
                onRemoveGalleryImage={(publicId) => void removeGalleryImage(publicId)}
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
                disabled={formSaving || uploadingTarget !== null}
              >
                {formSaving
                  ? 'Saving...'
                  : formMode === 'create'
                    ? 'Create Item'
                    : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
