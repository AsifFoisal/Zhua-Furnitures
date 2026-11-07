'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useToastFeedback } from '@/lib/toast-feedback';
import styles from '../admin-pages.module.css';

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

interface ContentPayload {
  headline?: string;
  cta?: string;
  supportingCopy?: string;
  heroImage?: CloudinaryImageAsset;
  secondaryImage?: CloudinaryImageAsset;
}

interface ContentBlockRow {
  id: string;
  title: string;
  route: string;
  status: 'Published' | 'Scheduled' | 'Draft';
  updatedAt: string;
  payload: ContentPayload;
}

function statusClass(status: string): string {
  if (status === 'Published') return `${styles.badge} ${styles.badgeSuccess}`;
  if (status === 'Scheduled') return `${styles.badge} ${styles.badgeInfo}`;
  return `${styles.badge} ${styles.badgeWarn}`;
}

function toStatusApi(status: ContentBlockRow['status']): 'published' | 'scheduled' | 'draft' {
  if (status === 'Published') return 'published';
  if (status === 'Scheduled') return 'scheduled';
  return 'draft';
}

export default function ContentAdminPage() {
  const [blocks, setBlocks] = useState<ContentBlockRow[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  useToastFeedback({ error });

  const loadBlocks = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/content', { cache: 'no-store' });
      const data = (await res.json()) as { blocks?: ContentBlockRow[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Could not load content blocks.');
      }

      const rows = data.blocks ?? [];
      setBlocks(rows);
      if (rows.length > 0) {
        setSelectedBlockId((current) => current || rows[0].id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load content blocks.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBlocks();
  }, []);

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.id === selectedBlockId) ?? blocks[0] ?? null,
    [blocks, selectedBlockId]
  );

  const updateSelected = (updater: (current: ContentBlockRow) => ContentBlockRow) => {
    if (!selectedBlock) {
      return;
    }

    setBlocks((prev) =>
      prev.map((row) => (row.id === selectedBlock.id ? updater(row) : row))
    );
  };

  const saveBlock = async (block: ContentBlockRow) => {
    setSavingId(block.id);
    setError('');

    try {
      const res = await fetch(`/api/admin/content/${block.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: block.title,
          route: block.route,
          status: toStatusApi(block.status),
          payload: block.payload,
        }),
      });

      const data = (await res.json()) as { block?: ContentBlockRow; error?: string };
      if (!res.ok || !data.block) {
        throw new Error(data.error ?? 'Could not save content block.');
      }

      setBlocks((prev) => prev.map((row) => (row.id === block.id ? data.block! : row)));
      toast.success('Content block saved successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save content block.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const uploadImage = async (
    block: ContentBlockRow,
    slot: 'heroImage' | 'secondaryImage',
    file: File
  ) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Max file size is 10MB.');
      return;
    }

    setUploadingSlot(`${block.id}:${slot}`);
    setError('');

    try {
      const signRes = await fetch('/api/admin/media/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: 'zhua/content',
          baseName: `${block.title}-${slot}`,
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
        throw new Error(signData.error ?? 'Could not prepare upload.');
      }

      const uploadBody = new FormData();
      uploadBody.append('file', file);
      uploadBody.append('api_key', signData.apiKey);
      uploadBody.append('timestamp', String(signData.timestamp));
      uploadBody.append('signature', signData.signature);
      uploadBody.append('folder', signData.folder ?? 'zhua/content');
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

      const nextBlock: ContentBlockRow = {
        ...block,
        payload: {
          ...block.payload,
          [slot]: {
            publicId: uploadData.public_id,
            secureUrl: uploadData.secure_url,
            alt: block.title,
            width: uploadData.width,
            height: uploadData.height,
            format: uploadData.format,
            bytes: uploadData.bytes,
            createdAt: new Date().toISOString(),
          },
        },
      };

      await saveBlock(nextBlock);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload image.';
      setError(message);
    } finally {
      setUploadingSlot(null);
    }
  };

  const removeImage = async (block: ContentBlockRow, slot: 'heroImage' | 'secondaryImage') => {
    const current = block.payload[slot];
    if (!current) {
      return;
    }

    setSavingId(block.id);
    setError('');

    try {
      const deleteRes = await fetch('/api/admin/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: current.publicId }),
      });

      const deleteData = (await deleteRes.json()) as { error?: string };
      if (!deleteRes.ok) {
        throw new Error(deleteData.error ?? 'Could not delete image from Cloudinary.');
      }

      const nextPayload: ContentPayload = { ...block.payload };
      delete nextPayload[slot];
      await saveBlock({ ...block, payload: nextPayload });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not remove image.';
      setError(message);
      setSavingId(null);
    }
  };

  return (
    <>
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Content Block Editor</h2>
        {loading ? <p style={{ color: 'var(--text-dim)' }}>Loading content blocks...</p> : null}
        {error ? <p style={{ color: 'var(--status-danger)' }}>{error}</p> : null}

        {selectedBlock ? (
          <div className={styles.formGrid}>
            <div className={styles.formRow}>
              <label className={styles.label}>Title</label>
              <input
                className={styles.input}
                value={selectedBlock.title}
                onChange={(e) =>
                  updateSelected((row) => ({
                    ...row,
                    title: e.target.value,
                  }))
                }
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Route</label>
              <input
                className={styles.input}
                value={selectedBlock.route}
                onChange={(e) =>
                  updateSelected((row) => ({
                    ...row,
                    route: e.target.value,
                  }))
                }
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Status</label>
              <select
                className={styles.select}
                value={selectedBlock.status}
                onChange={(e) =>
                  updateSelected((row) => ({
                    ...row,
                    status: e.target.value as ContentBlockRow['status'],
                  }))
                }
              >
                <option>Published</option>
                <option>Scheduled</option>
                <option>Draft</option>
              </select>
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Headline</label>
              <input
                className={styles.input}
                value={selectedBlock.payload.headline ?? ''}
                onChange={(e) =>
                  updateSelected((row) => ({
                    ...row,
                    payload: {
                      ...row.payload,
                      headline: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>CTA</label>
              <input
                className={styles.input}
                value={selectedBlock.payload.cta ?? ''}
                onChange={(e) =>
                  updateSelected((row) => ({
                    ...row,
                    payload: {
                      ...row.payload,
                      cta: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.label}>Supporting Copy</label>
              <textarea
                className={styles.textarea}
                value={selectedBlock.payload.supportingCopy ?? ''}
                onChange={(e) =>
                  updateSelected((row) => ({
                    ...row,
                    payload: {
                      ...row.payload,
                      supportingCopy: e.target.value,
                    },
                  }))
                }
              />
            </div>

            <div className={styles.formRow}>
              <label className={styles.label}>Hero Image</label>
              {selectedBlock.payload.heroImage ? (
                <img
                  src={selectedBlock.payload.heroImage.secureUrl}
                  alt={selectedBlock.payload.heroImage.alt || selectedBlock.title}
                  style={{ width: '100%', maxWidth: 220, borderRadius: 10, border: '1px solid var(--border-light)' }}
                />
              ) : (
                <div style={{ width: '100%', maxWidth: 220, height: 124, borderRadius: 10, border: '1px dashed rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.03)' }} />
              )}
              <div className={styles.inlineActions}>
                <label className={styles.ghostButton} style={{ cursor: uploadingSlot === `${selectedBlock.id}:heroImage` ? 'wait' : 'pointer' }}>
                  {uploadingSlot === `${selectedBlock.id}:heroImage` ? 'Uploading...' : 'Upload Hero'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void uploadImage(selectedBlock, 'heroImage', file);
                      }
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
                <button
                  className={styles.ghostButton}
                  type="button"
                  disabled={!selectedBlock.payload.heroImage || savingId === selectedBlock.id}
                  onClick={() => void removeImage(selectedBlock, 'heroImage')}
                >
                  Remove Hero
                </button>
              </div>
            </div>

            <div className={styles.formRow}>
              <label className={styles.label}>Secondary Image</label>
              {selectedBlock.payload.secondaryImage ? (
                <img
                  src={selectedBlock.payload.secondaryImage.secureUrl}
                  alt={selectedBlock.payload.secondaryImage.alt || selectedBlock.title}
                  style={{ width: '100%', maxWidth: 220, borderRadius: 10, border: '1px solid var(--border-light)' }}
                />
              ) : (
                <div style={{ width: '100%', maxWidth: 220, height: 124, borderRadius: 10, border: '1px dashed rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.03)' }} />
              )}
              <div className={styles.inlineActions}>
                <label className={styles.ghostButton} style={{ cursor: uploadingSlot === `${selectedBlock.id}:secondaryImage` ? 'wait' : 'pointer' }}>
                  {uploadingSlot === `${selectedBlock.id}:secondaryImage` ? 'Uploading...' : 'Upload Secondary'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void uploadImage(selectedBlock, 'secondaryImage', file);
                      }
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
                <button
                  className={styles.ghostButton}
                  type="button"
                  disabled={!selectedBlock.payload.secondaryImage || savingId === selectedBlock.id}
                  onClick={() => void removeImage(selectedBlock, 'secondaryImage')}
                >
                  Remove Secondary
                </button>
              </div>
            </div>

            <div className={styles.formRow}>
              <label className={styles.label}>Save</label>
              <button
                className={styles.ghostButton}
                type="button"
                disabled={savingId === selectedBlock.id}
                onClick={() => void saveBlock(selectedBlock)}
              >
                {savingId === selectedBlock.id ? 'Saving...' : 'Save Block'}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Content Blocks</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Route</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Media</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => {
                const mediaCount = [block.payload.heroImage, block.payload.secondaryImage].filter(Boolean).length;
                return (
                  <tr key={block.id}>
                    <td>{block.title}</td>
                    <td>{block.route}</td>
                    <td><span className={statusClass(block.status)}>{block.status}</span></td>
                    <td>{block.updatedAt}</td>
                    <td>{mediaCount} image(s)</td>
                    <td>
                      <div className={styles.inlineActions}>
                        <button
                          className={styles.ghostButton}
                          type="button"
                          onClick={() => setSelectedBlockId(block.id)}
                        >
                          Edit
                        </button>
                        <button
                          className={styles.ghostButton}
                          type="button"
                          disabled={savingId === block.id}
                          onClick={() => void saveBlock(block)}
                        >
                          Save
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
