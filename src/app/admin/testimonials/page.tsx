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

interface TestimonialRow {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  project: string;
  avatarImage: CloudinaryImageAsset | null;
  beforeImage: CloudinaryImageAsset | null;
  afterImage: CloudinaryImageAsset | null;
  status: 'Published' | 'Draft';
  displayOrder: number;
  updatedAt: string;
}

function statusClass(status: string): string {
  return status === 'Published'
    ? `${styles.badge} ${styles.badgeSuccess}`
    : `${styles.badge} ${styles.badgeWarn}`;
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    name: '',
    location: '',
    text: '',
    project: '',
  });

  useToastFeedback({ error });

  const loadTestimonials = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/testimonials', { cache: 'no-store' });
      const data = (await res.json()) as { testimonials?: TestimonialRow[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Could not load testimonials.');
      }

      setTestimonials(data.testimonials ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load testimonials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTestimonials();
  }, []);

  const updateTestimonial = async (id: string, partial: Partial<TestimonialRow>) => {
    setSavingId(id);
    setError('');

    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });

      const data = (await res.json()) as { testimonial?: TestimonialRow; error?: string };
      if (!res.ok || !data.testimonial) {
        throw new Error(data.error ?? 'Could not update testimonial.');
      }

      setTestimonials((prev) =>
        prev.map((item) => (item.id === id ? data.testimonial! : item))
      );
      toast.success('Testimonial updated successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update testimonial.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const createTestimonial = async () => {
    setError('');

    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      const data = (await res.json()) as { testimonial?: TestimonialRow; error?: string };
      if (!res.ok || !data.testimonial) {
        throw new Error(data.error ?? 'Could not create testimonial.');
      }

      setTestimonials((prev) => [data.testimonial!, ...prev]);
      setNewItem({ name: '', location: '', text: '', project: '' });
      toast.success('Testimonial created successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create testimonial.';
      setError(message);
    }
  };

  const deleteTestimonial = async (id: string) => {
    setSavingId(id);
    setError('');

    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not delete testimonial.');
      }

      setTestimonials((prev) => prev.filter((item) => item.id !== id));
      toast.success('Testimonial deleted successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete testimonial.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const uploadImage = async (
    item: TestimonialRow,
    slot: 'avatarImage' | 'beforeImage' | 'afterImage',
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

    const folder = slot === 'avatarImage' ? 'zhua/testimonials/avatars' : 'zhua/testimonials/projects';

    setUploadingSlot(`${item.id}:${slot}`);
    setError('');

    try {
      const signRes = await fetch('/api/admin/media/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder,
          baseName: `${item.name}-${slot}`,
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
      uploadBody.append('folder', signData.folder ?? folder);
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

      await updateTestimonial(item.id, {
        [slot]: {
          publicId: uploadData.public_id,
          secureUrl: uploadData.secure_url,
          alt: `${item.name} ${slot}`,
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
        <h2 className={styles.sectionTitle}>Add Testimonial</h2>
        <div className={styles.formGrid}>
          <div className={styles.formRow}>
            <label className={styles.label}>Name</label>
            <input
              className={styles.input}
              value={newItem.name}
              onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
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
          <div className={styles.formRow} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.label}>Testimonial</label>
            <textarea
              className={styles.textarea}
              value={newItem.text}
              onChange={(e) => setNewItem((prev) => ({ ...prev, text: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Create</label>
            <button className={styles.ghostButton} type="button" onClick={() => void createTestimonial()}>
              Create Testimonial
            </button>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Testimonials</h2>
        {loading ? <p style={{ color: 'var(--text-dim)' }}>Loading testimonials...</p> : null}
        {error ? <p style={{ color: 'var(--status-danger)' }}>{error}</p> : null}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Avatar</th>
                <th>Before</th>
                <th>After</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      className={styles.input}
                      value={item.name}
                      onChange={(e) =>
                        setTestimonials((prev) =>
                          prev.map((row) =>
                            row.id === item.id ? { ...row, name: e.target.value } : row
                          )
                        )
                      }
                    />
                    <div style={{ marginTop: '0.3rem', color: 'var(--text-dim)', fontSize: '0.72rem' }}>{item.project}</div>
                  </td>
                  <td>
                    <input
                      className={styles.input}
                      inputMode="numeric"
                      style={{ maxWidth: 78 }}
                      value={String(item.rating)}
                      onChange={(e) => {
                        const next = Number(e.target.value || 0);
                        setTestimonials((prev) =>
                          prev.map((row) =>
                            row.id === item.id
                              ? {
                                  ...row,
                                  rating: Number.isFinite(next) ? next : row.rating,
                                }
                              : row
                          )
                        );
                      }}
                    />
                    <select
                      className={styles.select}
                      style={{ marginTop: '0.45rem' }}
                      value={item.status}
                      onChange={(e) =>
                        setTestimonials((prev) =>
                          prev.map((row) =>
                            row.id === item.id
                              ? {
                                  ...row,
                                  status: e.target.value as TestimonialRow['status'],
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
                    <span className={statusClass(item.status)}>{item.status}</span>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: '0.35rem' }}>{item.updatedAt}</div>
                  </td>
                  {(['avatarImage', 'beforeImage', 'afterImage'] as const).map((slot) => (
                    <td key={slot}>
                      {item[slot] ? (
                        <img
                          src={item[slot]!.secureUrl}
                          alt={item[slot]!.alt || item.name}
                          style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-light)' }}
                        />
                      ) : (
                        <div style={{ width: 72, height: 48, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.22)' }} />
                      )}
                      <div className={styles.inlineActions} style={{ marginTop: '0.35rem' }}>
                        <label className={styles.ghostButton} style={{ cursor: uploadingSlot === `${item.id}:${slot}` ? 'wait' : 'pointer' }}>
                          {uploadingSlot === `${item.id}:${slot}` ? 'Uploading...' : 'Upload'}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                void uploadImage(item, slot, file);
                              }
                              e.currentTarget.value = '';
                            }}
                          />
                        </label>
                        <button
                          className={styles.ghostButton}
                          type="button"
                          disabled={!item[slot] || savingId === item.id}
                          onClick={() =>
                            void updateTestimonial(item.id, {
                              [slot]: null,
                            })
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  ))}
                  <td>
                    <div className={styles.inlineActions}>
                      <button
                        className={styles.ghostButton}
                        type="button"
                        disabled={savingId === item.id}
                        onClick={() => void updateTestimonial(item.id, item)}
                      >
                        {savingId === item.id ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        className={styles.ghostButton}
                        type="button"
                        disabled={savingId === item.id}
                        onClick={() => void deleteTestimonial(item.id)}
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
