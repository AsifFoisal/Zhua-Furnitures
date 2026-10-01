'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Save, Trash2, ImagePlus } from 'lucide-react';
import {
  DEFAULT_CURTAIN_CUSTOMIZER_CONFIG,
  normalizeCurtainCustomizerConfig,
  type CurtainCustomizerConfig,
} from '@/lib/curtain-customizer-config';
import { formatPrice } from '@/lib/data';
import styles from '../admin-pages.module.css';

type ListName = 'fabrics' | 'headings' | 'linings' | 'layers' | 'tracks' | 'installations' | 'colors';

const numberFromInput = (value: string, fallback = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : fallback;
};

export default function CurtainCustomizerAdminPage() {
  const [config, setConfig] = useState<CurtainCustomizerConfig>(DEFAULT_CURTAIN_CUSTOMIZER_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingFabricKey, setUploadingFabricKey] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch('/api/admin/curtain-customizer-config', { cache: 'no-store' });
        const data = (await res.json()) as { config?: CurtainCustomizerConfig; error?: string };

        if (!res.ok || !data.config) {
          throw new Error(data.error ?? 'Could not load the Curtain Customizer configuration.');
        }

        setConfig(normalizeCurtainCustomizerConfig(data.config));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not load the Curtain Customizer configuration.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadConfig();
  }, []);

  const patchListItem = (list: ListName, index: number, patch: Record<string, unknown>) => {
    setConfig((current) => ({
      ...current,
      [list]: (current[list] as Record<string, unknown>[]).map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    }) as CurtainCustomizerConfig);
  };

  const removeListItem = (list: ListName, index: number) => {
    setConfig((current) => ({
      ...current,
      [list]: (current[list] as unknown[]).filter((_, i) => i !== index),
    }) as CurtainCustomizerConfig);
  };

  const addListItem = (list: ListName, item: Record<string, unknown>) => {
    setConfig((current) => ({
      ...current,
      [list]: [...(current[list] as unknown[]), item],
    }) as CurtainCustomizerConfig);
  };

  // Best-effort Cloudinary cleanup — a failed delete must never block editing.
  const destroyFabricImage = async (publicId: string) => {
    if (!publicId) return;
    try {
      await fetch('/api/admin/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
      });
    } catch {
      // Leave the asset orphaned rather than surfacing an edit-blocking error.
    }
  };

  const uploadFabricImage = async (index: number, file: File) => {
    const key = `${index}-${config.fabrics[index]?.id ?? ''}`;
    setUploadingFabricKey(key);
    setError('');

    try {
      const signRes = await fetch('/api/admin/media/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: 'zhua/curtain-customizer',
          baseName: config.fabrics[index]?.name ?? 'fabric',
        }),
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
        throw new Error(signData.error ?? 'Could not prepare the image upload.');
      }

      const uploadBody = new FormData();
      uploadBody.append('file', file);
      uploadBody.append('api_key', signData.apiKey);
      uploadBody.append('timestamp', String(signData.timestamp));
      uploadBody.append('signature', signData.signature);
      uploadBody.append('folder', signData.folder ?? 'zhua/curtain-customizer');
      uploadBody.append('public_id', signData.publicId ?? 'fabric');

      const uploadRes = await fetch(signData.uploadUrl, { method: 'POST', body: uploadBody });
      const uploadData = (await uploadRes.json()) as {
        secure_url?: string;
        public_id?: string;
        error?: { message?: string };
      };

      if (!uploadRes.ok || !uploadData.secure_url || !uploadData.public_id) {
        throw new Error(uploadData.error?.message ?? 'Cloudinary upload failed.');
      }

      const previous = config.fabrics[index];
      if (previous?.imagePublicId && previous.imagePublicId !== uploadData.public_id) {
        void destroyFabricImage(previous.imagePublicId);
      }

      patchListItem('fabrics', index, {
        imageUrl: uploadData.secure_url,
        imagePublicId: uploadData.public_id,
      });
      toast.success('Fabric image uploaded. Remember to save the configuration.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload the fabric image.';
      setError(message);
      toast.error(message);
    } finally {
      setUploadingFabricKey(null);
    }
  };

  const removeFabricImage = (index: number) => {
    const fabric = config.fabrics[index];
    if (!fabric) return;
    void destroyFabricImage(fabric.imagePublicId);
    patchListItem('fabrics', index, { imageUrl: '', imagePublicId: '' });
  };

  const removeFabric = (index: number) => {
    const fabric = config.fabrics[index];
    if (fabric?.imagePublicId) {
      void destroyFabricImage(fabric.imagePublicId);
    }
    removeListItem('fabrics', index);
  };

  const saveConfig = async () => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/curtain-customizer-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = (await res.json()) as { config?: CurtainCustomizerConfig; error?: string };
      if (!res.ok || !data.config) {
        throw new Error(data.error ?? 'Could not save the configuration.');
      }

      setConfig(normalizeCurtainCustomizerConfig(data.config));
      toast.success('Curtain Customizer configuration saved.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save the configuration.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const rowStyle = { display: 'grid', gap: '0.5rem', alignItems: 'center' } as const;
  const iconButton = (label: string, onClick: () => void) => (
    <button
      className={styles.ghostButton}
      type="button"
      aria-label={label}
      title={label}
      style={{ color: '#ff8a8a', justifyContent: 'center' }}
      onClick={onClick}
    >
      <Trash2 size={15} />
    </button>
  );

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>Curtain Customizer Settings</h2>
      <p style={{ color: '#a9b7c9', marginBottom: '1.25rem' }}>
        Control everything customers see and every price used by the Curtain Customizer estimator. Changes apply
        immediately for new visitors after saving. Existing quote enquiries keep the configuration they were
        submitted with.
      </p>
      {loading ? <p style={{ color: '#a9b7c9' }}>Loading configuration...</p> : null}
      {error ? <p style={{ color: '#ffd0d0' }}>{error}</p> : null}

      {!loading ? (
        <>
          {/* Availability */}
          <div className={styles.cardTitle} style={{ marginTop: '0.5rem' }}>Availability</div>
          <label className={styles.switchRow} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig((current) => ({ ...current, enabled: e.target.checked }))}
            />
            <span className={styles.switchCopy} style={{ color: '#eaf0f8' }}>
              Customizer enabled — when off, customers see a temporarily unavailable notice instead of the tool.
            </span>
          </label>

          {/* Global charges */}
          <div className={styles.cardTitle} style={{ marginTop: '1.5rem' }}>Global Charges</div>
          <div className={styles.formGrid}>
            <div className={styles.formRow} style={{ display: 'grid', gap: '0.35rem' }}>
              <label className={styles.label} htmlFor="cc-making">Making &amp; finishing charge (R per cm of drop, per window)</label>
              <input
                id="cc-making"
                className={styles.input}
                type="number"
                min={0}
                step={0.5}
                value={config.makingChargePerCmDrop}
                onChange={(e) =>
                  setConfig((current) => ({ ...current, makingChargePerCmDrop: numberFromInput(e.target.value) }))
                }
              />
            </div>
            <div className={styles.formRow} style={{ display: 'grid', gap: '0.35rem' }}>
              <label className={styles.label} htmlFor="cc-motor">Motorisation price (R per motorised track set)</label>
              <input
                id="cc-motor"
                className={styles.input}
                type="number"
                min={0}
                value={config.motorPrice}
                onChange={(e) => setConfig((current) => ({ ...current, motorPrice: numberFromInput(e.target.value) }))}
              />
            </div>
          </div>

          {/* Fabrics */}
          <div className={styles.cardTitle} style={{ marginTop: '1.5rem' }}>Fabrics</div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {config.fabrics.map((fabric, index) => {
              const uploadKey = `${index}-${fabric.id}`;
              const uploading = uploadingFabricKey === uploadKey;

              return (
                <div
                  key={fabric.id + index}
                  style={{
                    display: 'grid',
                    gap: '0.6rem',
                    padding: '0.75rem',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={{ ...rowStyle, gridTemplateColumns: '56px 1.4fr 0.8fr auto' }}>
                    {fabric.imageUrl ? (
                      <img
                        src={fabric.imageUrl}
                        alt={`${fabric.name} swatch photo`}
                        style={{
                          width: 56,
                          height: 56,
                          objectFit: 'cover',
                          borderRadius: 8,
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      />
                    ) : (
                      <div
                        aria-hidden
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 8,
                          background: /^#[0-9a-fA-F]{6}$/.test(fabric.swatch) ? fabric.swatch : '#888888',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      />
                    )}
                    <input
                      className={styles.input}
                      value={fabric.name}
                      onChange={(e) => patchListItem('fabrics', index, { name: e.target.value })}
                      aria-label="Fabric name"
                    />
                    <input
                      className={styles.input}
                      type="number"
                      min={0}
                      value={fabric.pricePerMetre}
                      onChange={(e) => patchListItem('fabrics', index, { pricePerMetre: numberFromInput(e.target.value) })}
                      aria-label="Price per metre"
                    />
                    <button
                      className={styles.ghostButton}
                      type="button"
                      aria-label={`Remove ${fabric.name}`}
                      title={`Remove ${fabric.name}`}
                      style={{ color: '#ff8a8a', justifyContent: 'center' }}
                      onClick={() => removeFabric(index)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <input
                    className={styles.input}
                    value={fabric.description}
                    placeholder="Short description shown to customers when this fabric is selected"
                    onChange={(e) => patchListItem('fabrics', index, { description: e.target.value })}
                    aria-label="Fabric description"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <label
                      className={styles.ghostButton}
                      style={{ cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.6 : 1 }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadFabricImage(index, file);
                          e.target.value = '';
                        }}
                      />
                      <ImagePlus size={14} /> {uploading ? 'Uploading...' : fabric.imageUrl ? 'Replace Image' : 'Upload Image'}
                    </label>
                    {fabric.imageUrl ? (
                      <button
                        className={styles.ghostButton}
                        type="button"
                        style={{ color: '#ff8a8a' }}
                        onClick={() => removeFabricImage(index)}
                      >
                        <Trash2 size={14} /> Remove Image
                      </button>
                    ) : (
                      <span className={styles.label}>Optional photo — shown with the description when customers select this fabric.</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className={styles.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      Swatch colour
                    </span>
                    <input
                      className={styles.input}
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(fabric.swatch) ? fabric.swatch : '#888888'}
                      onChange={(e) => patchListItem('fabrics', index, { swatch: e.target.value })}
                      aria-label={`${fabric.name} swatch colour`}
                      style={{ width: 44, height: 28, padding: 2 }}
                    />
                  </div>
                </div>
              );
            })}
            <div>
              <button
                className={styles.ghostButton}
                type="button"
                onClick={() =>
                  addListItem('fabrics', {
                    id: `fabric-${Date.now().toString(36)}`,
                    name: 'New Fabric',
                    swatch: '#888888',
                    pricePerMetre: 0,
                    description: '',
                    imageUrl: '',
                    imagePublicId: '',
                  })
                }
              >
                <Plus size={14} /> Add Fabric
              </button>
            </div>
            <p className={styles.label}>
              Prices are per metre. The swatch colour is used on the customer&apos;s fabric chips; the optional photo
              and description appear when a customer selects the fabric.
            </p>
          </div>

          {/* Colours */}
          <div className={styles.cardTitle} style={{ marginTop: '1.5rem' }}>Curtain Colours</div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {config.colors.map((color, index) => (
              <div key={color.id + index} style={{ ...rowStyle, gridTemplateColumns: '48px 1.4fr auto' }}>
                <input
                  className={styles.input}
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(color.hex) ? color.hex : '#888888'}
                  onChange={(e) => patchListItem('colors', index, { hex: e.target.value })}
                  aria-label={`${color.name} colour`}
                />
                <input
                  className={styles.input}
                  value={color.name}
                  onChange={(e) => patchListItem('colors', index, { name: e.target.value })}
                  aria-label="Colour name"
                />
                <button
                  className={styles.ghostButton}
                  type="button"
                  aria-label={`Remove ${color.name}`}
                  title={`Remove ${color.name}`}
                  style={{ color: '#ff8a8a', justifyContent: 'center' }}
                  onClick={() => removeListItem('colors', index)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <div>
              <button
                className={styles.ghostButton}
                type="button"
                onClick={() =>
                  addListItem('colors', {
                    id: `color-${Date.now().toString(36)}`,
                    name: 'New Colour',
                    hex: '#888888',
                  })
                }
              >
                <Plus size={14} /> Add Colour
              </button>
            </div>
          </div>

          {/* Headings */}
          <div className={styles.cardTitle} style={{ marginTop: '1.5rem' }}>Curtain Types &amp; Headings</div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {config.headings.map((heading, index) => (
              <div key={heading.id + index} style={{ ...rowStyle, gridTemplateColumns: '1fr 1.6fr 0.7fr auto' }}>
                <input
                  className={styles.input}
                  value={heading.name}
                  onChange={(e) => patchListItem('headings', index, { name: e.target.value })}
                  aria-label="Heading name"
                />
                <input
                  className={styles.input}
                  value={heading.description}
                  onChange={(e) => patchListItem('headings', index, { description: e.target.value })}
                  aria-label="Heading description"
                />
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  step={0.1}
                  value={heading.fullness}
                  onChange={(e) => patchListItem('headings', index, { fullness: numberFromInput(e.target.value, 2) || 2 })}
                  aria-label="Fullness multiplier"
                />
                <button
                  className={styles.ghostButton}
                  type="button"
                  aria-label={`Remove ${heading.name}`}
                  title={`Remove ${heading.name}`}
                  style={{ color: '#ff8a8a', justifyContent: 'center' }}
                  onClick={() => removeListItem('headings', index)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <div>
              <button
                className={styles.ghostButton}
                type="button"
                onClick={() =>
                  addListItem('headings', {
                    id: `heading-${Date.now().toString(36)}`,
                    name: 'New Heading',
                    description: '',
                    fullness: 2,
                  })
                }
              >
                <Plus size={14} /> Add Heading
              </button>
            </div>
            <p className={styles.label}>The third field is the fullness multiplier — how much fabric width is used relative to the rail width (e.g. 2.3×).</p>
          </div>

          {/* Linings */}
          <div className={styles.cardTitle} style={{ marginTop: '1.5rem' }}>Linings</div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {config.linings.map((lining, index) => (
              <div key={lining.id + index} style={{ ...rowStyle, gridTemplateColumns: '1.6fr 0.8fr auto' }}>
                <input
                  className={styles.input}
                  value={lining.name}
                  onChange={(e) => patchListItem('linings', index, { name: e.target.value })}
                  aria-label="Lining name"
                />
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  value={lining.pricePerMetre}
                  onChange={(e) => patchListItem('linings', index, { pricePerMetre: numberFromInput(e.target.value) })}
                  aria-label="Price per metre"
                />
                {iconButton(`Remove ${lining.name}`, () => removeListItem('linings', index))}
              </div>
            ))}
            <div>
              <button
                className={styles.ghostButton}
                type="button"
                onClick={() =>
                  addListItem('linings', {
                    id: `lining-${Date.now().toString(36)}`,
                    name: 'New Lining',
                    pricePerMetre: 0,
                  })
                }
              >
                <Plus size={14} /> Add Lining
              </button>
            </div>
            <p className={styles.label}>Prices are per metre of curtain.</p>
          </div>

          {/* Layers (sheer/blockout) */}
          <div className={styles.cardTitle} style={{ marginTop: '1.5rem' }}>Sheer &amp; Blockout Layers</div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {config.layers.map((layer, index) => (
              <div key={layer.id + index} style={{ ...rowStyle, gridTemplateColumns: '1fr 1.6fr 0.8fr auto auto' }}>
                <input
                  className={styles.input}
                  value={layer.name}
                  onChange={(e) => patchListItem('layers', index, { name: e.target.value })}
                  aria-label="Layer name"
                />
                <input
                  className={styles.input}
                  value={layer.description}
                  onChange={(e) => patchListItem('layers', index, { description: e.target.value })}
                  aria-label="Layer description"
                />
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  value={layer.pricePerMetre}
                  onChange={(e) => patchListItem('layers', index, { pricePerMetre: numberFromInput(e.target.value) })}
                  aria-label="Extra cost per metre"
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a9b7c9', fontSize: 12, whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={layer.requiresDoubleTrack}
                    onChange={(e) => patchListItem('layers', index, { requiresDoubleTrack: e.target.checked })}
                  />
                  Double track
                </label>
                {iconButton(`Remove ${layer.name}`, () => removeListItem('layers', index))}
              </div>
            ))}
            <div>
              <button
                className={styles.ghostButton}
                type="button"
                onClick={() =>
                  addListItem('layers', {
                    id: `layer-${Date.now().toString(36)}`,
                    name: 'New Layer',
                    description: '',
                    pricePerMetre: 0,
                    requiresDoubleTrack: false,
                  })
                }
              >
                <Plus size={14} /> Add Layer
              </button>
            </div>
            <p className={styles.label}>The price field is the extra underlay cost per metre of curtain added on top of the main fabric. &quot;Double track&quot; auto-selects the double-track option for customers.</p>
          </div>

          {/* Tracks */}
          <div className={styles.cardTitle} style={{ marginTop: '1.5rem' }}>Tracks &amp; Rods</div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {config.tracks.map((track, index) => (
              <div key={track.id + index} style={{ ...rowStyle, gridTemplateColumns: '1.4fr 0.8fr auto auto' }}>
                <input
                  className={styles.input}
                  value={track.name}
                  onChange={(e) => patchListItem('tracks', index, { name: e.target.value })}
                  aria-label="Track name"
                />
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  value={track.pricePerMetre}
                  onChange={(e) => patchListItem('tracks', index, { pricePerMetre: numberFromInput(e.target.value) })}
                  aria-label="Price per metre"
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a9b7c9', fontSize: 12, whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={track.motorisable}
                    onChange={(e) => patchListItem('tracks', index, { motorisable: e.target.checked })}
                  />
                  Motorisable
                </label>
                {iconButton(`Remove ${track.name}`, () => removeListItem('tracks', index))}
              </div>
            ))}
            <div>
              <button
                className={styles.ghostButton}
                type="button"
                onClick={() =>
                  addListItem('tracks', {
                    id: `track-${Date.now().toString(36)}`,
                    name: 'New Track',
                    pricePerMetre: 0,
                    motorisable: false,
                  })
                }
              >
                <Plus size={14} /> Add Track / Rod
              </button>
            </div>
            <p className={styles.label}>Prices are per metre. Motorisable tracks show the motorisation add-on (set under Global Charges).</p>
          </div>

          {/* Installation */}
          <div className={styles.cardTitle} style={{ marginTop: '1.5rem' }}>Installation Options</div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {config.installations.map((installation, index) => (
              <div key={installation.id + index} style={{ ...rowStyle, gridTemplateColumns: '1.6fr 0.8fr auto' }}>
                <input
                  className={styles.input}
                  value={installation.name}
                  onChange={(e) => patchListItem('installations', index, { name: e.target.value })}
                  aria-label="Installation option name"
                />
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  value={installation.pricePerWindow}
                  onChange={(e) => patchListItem('installations', index, { pricePerWindow: numberFromInput(e.target.value) })}
                  aria-label="Price per window"
                />
                {iconButton(`Remove ${installation.name}`, () => removeListItem('installations', index))}
              </div>
            ))}
            <div>
              <button
                className={styles.ghostButton}
                type="button"
                onClick={() =>
                  addListItem('installations', {
                    id: `installation-${Date.now().toString(36)}`,
                    name: 'New Option',
                    pricePerWindow: 0,
                  })
                }
              >
                <Plus size={14} /> Add Installation Option
              </button>
            </div>
            <p className={styles.label}>Prices are per window.</p>
          </div>

          {/* Save */}
          <div style={{ marginTop: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className={styles.ghostButton} type="button" disabled={saving} onClick={() => void saveConfig()}>
              <Save size={15} /> {saving ? 'Saving...' : 'Save Configuration'}
            </button>
            <span style={{ color: '#8ca0b8', fontSize: 12 }}>
              Estimated cost preview with current values: a 240cm × 260cm window (2 panels, 2× fullness, cheapest
              fabric) plus making charge ={' '}
              {formatPrice(
                Math.round(
                  (240 / 100) *
                    2 *
                    2 *
                    Math.min(...config.fabrics.map((f) => f.pricePerMetre)) +
                    260 * config.makingChargePerCmDrop
                )
              )}
              .
            </span>
          </div>
        </>
      ) : null}
    </section>
  );
}
