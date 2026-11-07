'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useToastFeedback } from '@/lib/toast-feedback';
import styles from '../admin-pages.module.css';

interface PromoCodeRow {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderCents: number;
  maxDiscountCents: number | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  timesUsed: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}

interface CreatePromoDraft {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minOrderCents: string;
  maxDiscountCents: string;
  usageLimit: string;
  usageLimitPerUser: string;
  startsAt: string;
  endsAt: string;
}

const defaultDraft: CreatePromoDraft = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderCents: '0',
  maxDiscountCents: '',
  usageLimit: '',
  usageLimitPerUser: '',
  startsAt: '',
  endsAt: '',
};

export default function PromoCodesAdminPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCodeRow[]>([]);
  const [draft, setDraft] = useState<CreatePromoDraft>(defaultDraft);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useToastFeedback({ error });

  const loadPromoCodes = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/promo-codes', { cache: 'no-store' });
      const data = (await res.json()) as { promoCodes?: PromoCodeRow[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Could not load promo codes.');
      }

      setPromoCodes(data.promoCodes ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load promo codes.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPromoCodes();
  }, []);

  const createPromoCode = async () => {
    setCreating(true);
    setError('');

    try {
      if (!draft.code.trim()) {
        throw new Error('Promo code is required.');
      }

      const discountValue = Number(draft.discountValue);
      if (!Number.isFinite(discountValue) || discountValue <= 0) {
        throw new Error('Discount value must be greater than zero.');
      }

      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: draft.code,
          description: draft.description,
          discountType: draft.discountType,
          discountValue,
          minOrderCents: Number(draft.minOrderCents || 0),
          maxDiscountCents: draft.maxDiscountCents ? Number(draft.maxDiscountCents) : null,
          usageLimit: draft.usageLimit ? Number(draft.usageLimit) : null,
          usageLimitPerUser: draft.usageLimitPerUser ? Number(draft.usageLimitPerUser) : null,
          startsAt: draft.startsAt || null,
          endsAt: draft.endsAt || null,
          isActive: true,
        }),
      });

      const data = (await res.json()) as { promoCode?: PromoCodeRow; error?: string };
      if (!res.ok || !data.promoCode) {
        throw new Error(data.error ?? 'Could not create promo code.');
      }

      setPromoCodes((prev) => [data.promoCode!, ...prev]);
      setDraft(defaultDraft);
      toast.success('Promo code created successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create promo code.';
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  const savePromoCode = async (row: PromoCodeRow) => {
    setSavingId(row.id);
    setError('');

    try {
      const res = await fetch(`/api/admin/promo-codes/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: row.description,
          discountType: row.discountType,
          discountValue: row.discountValue,
          minOrderCents: row.minOrderCents,
          maxDiscountCents: row.maxDiscountCents,
          usageLimit: row.usageLimit,
          usageLimitPerUser: row.usageLimitPerUser,
          startsAt: row.startsAt,
          endsAt: row.endsAt,
          isActive: row.isActive,
        }),
      });

      const data = (await res.json()) as { promoCode?: PromoCodeRow; error?: string };
      if (!res.ok || !data.promoCode) {
        throw new Error(data.error ?? 'Could not update promo code.');
      }

      setPromoCodes((prev) => prev.map((item) => (item.id === row.id ? data.promoCode! : item)));
      toast.success('Promo code updated successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update promo code.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const deletePromoCode = async (id: string) => {
    setSavingId(id);
    setError('');

    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, { method: 'DELETE' });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Could not delete promo code.');
      }

      setPromoCodes((prev) => prev.filter((item) => item.id !== id));
      toast.success('Promo code deleted successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not delete promo code.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Create Promo Code</h2>
        <div className={styles.formGrid}>
          <div className={styles.formRow}>
            <label className={styles.label}>Code</label>
            <input
              className={styles.input}
              value={draft.code}
              onChange={(event) => setDraft((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
              placeholder="WELCOME10"
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Description</label>
            <input
              className={styles.input}
              value={draft.description}
              onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Discount Type</label>
            <select
              className={styles.select}
              value={draft.discountType}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, discountType: event.target.value as CreatePromoDraft['discountType'] }))
              }
            >
              <option value="percentage">percentage</option>
              <option value="fixed">fixed</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Discount Value</label>
            <input
              className={styles.input}
              value={draft.discountValue}
              onChange={(event) => setDraft((prev) => ({ ...prev, discountValue: event.target.value }))}
              placeholder={draft.discountType === 'percentage' ? '10' : '50'}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Min Order Cents</label>
            <input
              className={styles.input}
              value={draft.minOrderCents}
              onChange={(event) => setDraft((prev) => ({ ...prev, minOrderCents: event.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Max Discount Cents</label>
            <input
              className={styles.input}
              value={draft.maxDiscountCents}
              onChange={(event) => setDraft((prev) => ({ ...prev, maxDiscountCents: event.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Usage Limit</label>
            <input
              className={styles.input}
              value={draft.usageLimit}
              onChange={(event) => setDraft((prev) => ({ ...prev, usageLimit: event.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Usage Limit Per User</label>
            <input
              className={styles.input}
              value={draft.usageLimitPerUser}
              onChange={(event) => setDraft((prev) => ({ ...prev, usageLimitPerUser: event.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Starts At (optional)</label>
            <input
              type="datetime-local"
              className={styles.input}
              value={draft.startsAt}
              onChange={(event) => setDraft((prev) => ({ ...prev, startsAt: event.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Ends At (optional)</label>
            <input
              type="datetime-local"
              className={styles.input}
              value={draft.endsAt}
              onChange={(event) => setDraft((prev) => ({ ...prev, endsAt: event.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Create</label>
            <button className={styles.ghostButton} type="button" onClick={() => void createPromoCode()} disabled={creating}>
              {creating ? 'Creating...' : 'Create Promo'}
            </button>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Promo Codes</h2>
        {loading ? <p style={{ color: 'var(--text-dim)' }}>Loading promo codes...</p> : null}
        {error ? <p style={{ color: 'var(--status-danger)' }}>{error}</p> : null}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Rules</th>
                <th>Windows</th>
                <th>Usage</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{row.code}</div>
                    <input
                      className={styles.input}
                      style={{ marginTop: '0.45rem' }}
                      value={row.description}
                      onChange={(event) =>
                        setPromoCodes((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? { ...item, description: event.target.value } : item
                          )
                        )
                      }
                    />
                  </td>
                  <td>
                    <select
                      className={styles.select}
                      value={row.discountType}
                      onChange={(event) =>
                        setPromoCodes((prev) =>
                          prev.map((item) =>
                            item.id === row.id
                              ? { ...item, discountType: event.target.value as PromoCodeRow['discountType'] }
                              : item
                          )
                        )
                      }
                    >
                      <option value="percentage">percentage</option>
                      <option value="fixed">fixed</option>
                    </select>
                    <input
                      className={styles.input}
                      style={{ marginTop: '0.45rem' }}
                      value={String(row.discountValue)}
                      onChange={(event) => {
                        const value = Number(event.target.value || 0);
                        setPromoCodes((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? { ...item, discountValue: Number.isFinite(value) ? value : item.discountValue } : item
                          )
                        );
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.input}
                      value={String(row.minOrderCents)}
                      onChange={(event) => {
                        const value = Number(event.target.value || 0);
                        setPromoCodes((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? { ...item, minOrderCents: Number.isFinite(value) ? value : item.minOrderCents } : item
                          )
                        );
                      }}
                    />
                    <input
                      className={styles.input}
                      style={{ marginTop: '0.45rem' }}
                      value={row.usageLimit ?? ''}
                      placeholder="Usage limit"
                      onChange={(event) => {
                        const raw = event.target.value;
                        setPromoCodes((prev) =>
                          prev.map((item) =>
                            item.id === row.id
                              ? {
                                  ...item,
                                  usageLimit: raw === '' ? null : Math.max(0, Math.round(Number(raw))),
                                }
                              : item
                          )
                        );
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="datetime-local"
                      className={styles.input}
                      value={row.startsAt ? row.startsAt.slice(0, 16) : ''}
                      onChange={(event) =>
                        setPromoCodes((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? { ...item, startsAt: event.target.value || null } : item
                          )
                        )
                      }
                    />
                    <input
                      type="datetime-local"
                      className={styles.input}
                      style={{ marginTop: '0.45rem' }}
                      value={row.endsAt ? row.endsAt.slice(0, 16) : ''}
                      onChange={(event) =>
                        setPromoCodes((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? { ...item, endsAt: event.target.value || null } : item
                          )
                        )
                      }
                    />
                  </td>
                  <td>
                    {row.timesUsed}
                    {row.usageLimit != null ? ` / ${row.usageLimit}` : ''}
                  </td>
                  <td>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <input
                        type="checkbox"
                        checked={row.isActive}
                        onChange={(event) =>
                          setPromoCodes((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, isActive: event.target.checked } : item
                            )
                          )
                        }
                      />
                      <span>{row.isActive ? 'active' : 'inactive'}</span>
                    </label>
                  </td>
                  <td>
                    <div className={styles.inlineActions}>
                      <button
                        className={styles.ghostButton}
                        disabled={savingId === row.id}
                        onClick={() => void savePromoCode(row)}
                      >
                        {savingId === row.id ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        className={styles.ghostButton}
                        disabled={savingId === row.id}
                        onClick={() => void deletePromoCode(row.id)}
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
