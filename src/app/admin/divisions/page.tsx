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
}

type Division = 'wallz' | 'deckz';

interface DivisionItem {
  id: string;
  division: Division;
  title: string;
  description: string;
  category: string;
  image: CloudinaryImageAsset | null;
  status: 'Published' | 'Draft';
  displayOrder: number;
  updatedAt: string;
}

type NewDivisionItem = {
  division: Division;
  title: string;
  category: string;
  description: string;
};

const divisionLabel: Record<Division, string> = {
  wallz: 'WALLZ',
  deckz: 'DECKZ',
};

function statusClass(status: string): string {
  return status === 'Published'
    ? `${styles.badge} ${styles.badgeSuccess}`
    : `${styles.badge} ${styles.badgeWarn}`;
}

export default function AdminDivisionsPage() {
  const [items, setItems] = useState<DivisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [activeDivision, setActiveDivision] = useState<Division>('wallz');
  const [newItem, setNewItem] = useState<NewDivisionItem>({
    division: 'wallz',
    title: '',
    category: '',
    description: '',
  });

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

  const visibleItems = useMemo(
    () => items.filter((item) => item.division === activeDivision),
    [items, activeDivision]
  );

  const updateItem = async (id: string, partial: Partial<DivisionItem>) => {
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
      toast.success('Division item updated successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update division item.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const createItem = async () => {
    setError('');

    try {
      const res = await fetch('/api/admin/division-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newItem, status: 'published' }),
      });

      const data = (await res.json()) as { item?: DivisionItem; error?: string };
      if (!res.ok || !data.item) {
        throw new Error(data.error ?? 'Could not create division item.');
      }

      setItems((prev) => [data.item!, ...prev]);
      setNewItem((prev) => ({ ...prev, title: '', category: '', description: '' }));
      setActiveDivision(data.item.division);
      toast.success('Division item created successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create division item.';
      setError(message);
    }
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

  const uploadImage = async (item: DivisionItem, file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Max file size is 10MB.');
      return;
    }

    setUploadingSlot(item.id);
    setError('');

    try {
      const signRes = await fetch('/api/admin/media/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: 'zhua/divisions',
          baseName: `${item.division}-${item.title}`,
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

      await updateItem(item.id, {
        image: {
          publicId: uploadData.public_id,
          secureUrl: uploadData.secure_url,
          alt: `${item.title} — ZHUA ${divisionLabel[item.division]}`,
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
        <h2 className={styles.sectionTitle}>Add Division Item</h2>
        <p style={{ color: '#a9b7c9', marginBottom: '1rem', fontSize: '0.85rem' }}>
          Content saved here appears on the public <strong>WALLZ</strong> and <strong>DECKZ</strong> landing
          pages (published rows only, ordered by display order).
        </p>
        <div className={styles.formGrid}>
          <div className={styles.formRow}>
            <label className={styles.label}>Division</label>
            <select
              className={styles.select}
              value={newItem.division}
              onChange={(e) => setNewItem((prev) => ({ ...prev, division: e.target.value as Division }))}
            >
              <option value="wallz">WALLZ</option>
              <option value="deckz">DECKZ</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Title</label>
            <input
              className={styles.input}
              value={newItem.title}
              onChange={(e) => setNewItem((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Category</label>
            <input
              className={styles.input}
              placeholder="e.g. Slat walls / Pool decks"
              value={newItem.category}
              onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Description</label>
            <input
              className={styles.input}
              value={newItem.description}
              onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Create</label>
            <button
              className={styles.ghostButton}
              type="button"
              disabled={!newItem.title.trim()}
              onClick={() => void createItem()}
            >
              Create Item
            </button>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Division Items</h2>
        <div className={styles.inlineActions} style={{ marginBottom: '1rem' }}>
          {(['wallz', 'deckz'] as Division[]).map((division) => (
            <button
              key={division}
              type="button"
              className={styles.ghostButton}
              style={
                activeDivision === division
                  ? { borderColor: 'rgba(181,146,65,0.6)', color: '#D0AF63' }
                  : undefined
              }
              onClick={() => setActiveDivision(division)}
            >
              {divisionLabel[division]} ({items.filter((item) => item.division === division).length})
            </button>
          ))}
        </div>
        {loading ? <p style={{ color: '#a9b7c9' }}>Loading division items...</p> : null}
        {error ? <p style={{ color: '#ffd0d0' }}>{error}</p> : null}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Description</th>
                <th>Status</th>
                <th>Image</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
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
                    <div style={{ marginTop: '0.3rem', color: '#a9b7c9', fontSize: '0.72rem' }}>
                      Updated {item.updatedAt}
                    </div>
                  </td>
                  <td>
                    <input
                      className={styles.input}
                      value={item.category}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((row) =>
                            row.id === item.id ? { ...row, category: e.target.value } : row
                          )
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      className={styles.input}
                      value={item.description}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((row) =>
                            row.id === item.id ? { ...row, description: e.target.value } : row
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
                                  status: e.target.value as DivisionItem['status'],
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
                    {item.image ? (
                      <img
                        src={item.image.secureUrl}
                        alt={item.image.alt || item.title}
                        style={{ width: 80, height: 52, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.12)' }}
                      />
                    ) : (
                      <div style={{ width: 80, height: 52, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.22)' }} />
                    )}
                    <div className={styles.inlineActions} style={{ marginTop: '0.4rem' }}>
                      <label className={styles.ghostButton} style={{ cursor: uploadingSlot === item.id ? 'wait' : 'pointer' }}>
                        {uploadingSlot === item.id ? 'Uploading...' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              void uploadImage(item, file);
                            }
                            e.currentTarget.value = '';
                          }}
                        />
                      </label>
                      <button
                        className={styles.ghostButton}
                        type="button"
                        disabled={!item.image || savingId === item.id}
                        onClick={() => void updateItem(item.id, { image: null })}
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
              {!loading && visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ color: '#a9b7c9', padding: '1rem' }}>
                    No {divisionLabel[activeDivision]} items yet — create the first one above.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
