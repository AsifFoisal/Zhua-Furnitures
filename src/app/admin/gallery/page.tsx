'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useToastFeedback } from '@/lib/toast-feedback';
import styles from '../admin-pages.module.css';

interface CloudinaryImageAsset {
  publicId: string;
  secureUrl: string;
  alt: string;
  width?: number;
  height?: number;
}

interface GalleryItem {
  id: string;
  title: string;
  location: string;
  project: string;
  beforeImage: CloudinaryImageAsset | null;
  afterImage: CloudinaryImageAsset | null;
  status: 'Published' | 'Draft';
  displayOrder: number;
  updatedAt: string;
}

type NewGalleryItem = {
  title: string;
  location: string;
  project: string;
};

function statusClass(status: string): string {
  return status === 'Published'
    ? `${styles.badge} ${styles.badgeSuccess}`
    : `${styles.badge} ${styles.badgeWarn}`;
}

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<NewGalleryItem>({
    title: '',
    location: '',
    project: '',
  });

  useToastFeedback({ error });

  const loadItems = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/gallery', { cache: 'no-store' });
      const data = (await res.json()) as { items?: GalleryItem[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Could not load gallery items.');
      }

      setItems(data.items ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load gallery items.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const updateItem = async (id: string, partial: Partial<GalleryItem>) => {
    setSavingId(id);
    setError('');

    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });

      const data = (await res.json()) as { item?: GalleryItem; error?: string };
      if (!res.ok || !data.item) {
        throw new Error(data.error ?? 'Could not update gallery item.');
      }

      setItems((prev) => prev.map((item) => (item.id === id ? data.item! : item)));
      toast.success('Gallery item updated successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update gallery item.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const createItem = async () => {
    setError('');

    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      const data = (await res.json()) as { item?: GalleryItem; error?: string };
      if (!res.ok || !data.item) {
        throw new Error(data.error ?? 'Could not create gallery item.');
      }

      setItems((prev) => [data.item!, ...prev]);
      setNewItem({ title: '', location: '', project: '' });
      toast.success('Gallery item created successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create gallery item.';
      setError(message);
    }
  };

  const deleteItem = async (id: string) => {
    setSavingId(id);
    setError('');

    try {
      const res = await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not delete gallery item.');
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success('Gallery item deleted successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete gallery item.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const uploadImage = async (
    item: GalleryItem,
    slot: 'beforeImage' | 'afterImage',
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

    setUploadingSlot(`${item.id}:${slot}`);
    setError('');

    try {
      const signRes = await fetch('/api/admin/media/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: 'zhua/gallery',
          baseName: `${item.title}-${slot}`,
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
      uploadBody.append('folder', signData.folder ?? 'zhua/gallery');
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

      await updateItem(item.id, {
        [slot]: {
          publicId: uploadData.public_id,
          secureUrl: uploadData.secure_url,
          alt: `${item.title} ${slot === 'beforeImage' ? 'before' : 'after'}`,
          width: uploadData.width,
          height: uploadData.height,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload image.';
      setError(message);
    } finally {
      setUploadingSlot(null);
    }
  };

  return (
    <>
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Add Gallery Item</h2>
        <div className={styles.formGrid}>
          <div className={styles.formRow}>
            <label className={styles.label}>Title</label>
            <input
              className={styles.input}
              value={newItem.title}
              onChange={(e) => setNewItem((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Location</label>
            <input
              className={styles.input}
              value={newItem.location}
              onChange={(e) => setNewItem((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Project</label>
            <input
              className={styles.input}
              value={newItem.project}
              onChange={(e) => setNewItem((prev) => ({ ...prev, project: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Create</label>
            <button className={styles.ghostButton} type="button" onClick={() => void createItem()}>
              Create Item
            </button>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Gallery Items</h2>
        {loading ? <p style={{ color: 'var(--text-dim)' }}>Loading gallery items...</p> : null}
        {error ? <p style={{ color: 'var(--status-danger)' }}>{error}</p> : null}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Location</th>
                <th>Status</th>
                <th>Before</th>
                <th>After</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      className={styles.input}
                      value={item.title}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((row) =>
                            row.id === item.id ? { ...row, title: e.target.value } : row
                          )
                        )
                      }
                    />
                    <div style={{ marginTop: '0.3rem', color: 'var(--text-dim)', fontSize: '0.72rem' }}>{item.project}</div>
                  </td>
                  <td>
                    <input
                      className={styles.input}
                      value={item.location}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((row) =>
                            row.id === item.id ? { ...row, location: e.target.value } : row
                          )
                        )
                      }
                    />
                  </td>
                  <td>
                    <span className={statusClass(item.status)}>{item.status}</span>
                    <select
                      className={styles.select}
                      style={{ marginTop: '0.45rem' }}
                      value={item.status}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((row) =>
                            row.id === item.id
                              ? {
                                  ...row,
                                  status: e.target.value as GalleryItem['status'],
                                }
                              : row
                          )
                        )
                      }
                    >
                      <option>Published</option>
                      <option>Draft</option>
                    </select>
                  </td>
                  <td>
                    {item.beforeImage ? (
                      <img
                        src={item.beforeImage.secureUrl}
                        alt={item.beforeImage.alt || item.title}
                        style={{ width: 80, height: 52, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-light)' }}
                      />
                    ) : (
                      <div style={{ width: 80, height: 52, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.22)' }} />
                    )}
                    <div className={styles.inlineActions} style={{ marginTop: '0.4rem' }}>
                      <label className={styles.ghostButton} style={{ cursor: uploadingSlot === `${item.id}:beforeImage` ? 'wait' : 'pointer' }}>
                        {uploadingSlot === `${item.id}:beforeImage` ? 'Uploading...' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              void uploadImage(item, 'beforeImage', file);
                            }
                            e.currentTarget.value = '';
                          }}
                        />
                      </label>
                      <button
                        className={styles.ghostButton}
                        type="button"
                        disabled={!item.beforeImage || savingId === item.id}
                        onClick={() =>
                          void updateItem(item.id, {
                            beforeImage: null,
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                  <td>
                    {item.afterImage ? (
                      <img
                        src={item.afterImage.secureUrl}
                        alt={item.afterImage.alt || item.title}
                        style={{ width: 80, height: 52, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-light)' }}
                      />
                    ) : (
                      <div style={{ width: 80, height: 52, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.22)' }} />
                    )}
                    <div className={styles.inlineActions} style={{ marginTop: '0.4rem' }}>
                      <label className={styles.ghostButton} style={{ cursor: uploadingSlot === `${item.id}:afterImage` ? 'wait' : 'pointer' }}>
                        {uploadingSlot === `${item.id}:afterImage` ? 'Uploading...' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              void uploadImage(item, 'afterImage', file);
                            }
                            e.currentTarget.value = '';
                          }}
                        />
                      </label>
                      <button
                        className={styles.ghostButton}
                        type="button"
                        disabled={!item.afterImage || savingId === item.id}
                        onClick={() =>
                          void updateItem(item.id, {
                            afterImage: null,
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                  <td>
                    <input
                      className={styles.input}
                      inputMode="numeric"
                      style={{ maxWidth: 84 }}
                      value={String(item.displayOrder)}
                      onChange={(e) => {
                        const next = Number(e.target.value || 0);
                        setItems((prev) =>
                          prev.map((row) =>
                            row.id === item.id
                              ? {
                                  ...row,
                                  displayOrder: Number.isFinite(next) ? next : row.displayOrder,
                                }
                              : row
                          )
                        );
                      }}
                    />
                  </td>
                  <td>
                    <div className={styles.inlineActions}>
                      <button
                        className={styles.ghostButton}
                        type="button"
                        disabled={savingId === item.id}
                        onClick={() => void updateItem(item.id, item)}
                      >
                        {savingId === item.id ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        className={styles.ghostButton}
                        type="button"
                        disabled={savingId === item.id}
                        onClick={() => void deleteItem(item.id)}
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
    </>
  );
}
