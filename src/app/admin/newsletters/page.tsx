'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useToastFeedback } from '@/lib/toast-feedback';
import styles from '../admin-pages.module.css';

interface NewsletterRow {
  id: string;
  email: string;
  source: string;
  status: 'subscribed' | 'unsubscribed';
  unsubscribedAt: string | null;
  createdAt: string;
}

const statusOptions: NewsletterRow['status'][] = ['subscribed', 'unsubscribed'];

export default function NewslettersAdminPage() {
  const [subscriptions, setSubscriptions] = useState<NewsletterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useToastFeedback({ error });

  const loadSubscriptions = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/newsletters', { cache: 'no-store' });
      const data = (await res.json()) as { subscriptions?: NewsletterRow[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Could not load newsletter subscriptions.');
      }

      setSubscriptions(data.subscriptions ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load newsletter subscriptions.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSubscriptions();
  }, []);

  const saveStatus = async (row: NewsletterRow) => {
    setSavingId(row.id);
    setError('');

    try {
      const res = await fetch(`/api/admin/newsletters/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: row.status }),
      });

      const data = (await res.json()) as { subscription?: NewsletterRow; error?: string };
      if (!res.ok || !data.subscription) {
        throw new Error(data.error ?? 'Could not update subscription.');
      }

      setSubscriptions((prev) => prev.map((item) => (item.id === row.id ? data.subscription! : item)));
      toast.success('Subscription updated successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update subscription.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>Newsletter Subscriptions</h2>
      {loading ? <p style={{ color: 'var(--text-dim)' }}>Loading subscriptions...</p> : null}
      {error ? <p style={{ color: 'var(--status-danger)' }}>{error}</p> : null}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Source</th>
              <th>Status</th>
              <th>Created</th>
              <th>Unsubscribed</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((row) => (
              <tr key={row.id}>
                <td>{row.email}</td>
                <td>{row.source}</td>
                <td>
                  <select
                    className={styles.select}
                    value={row.status}
                    onChange={(event) =>
                      setSubscriptions((prev) =>
                        prev.map((item) =>
                          item.id === row.id
                            ? { ...item, status: event.target.value as NewsletterRow['status'] }
                            : item
                        )
                      )
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{row.createdAt.slice(0, 10)}</td>
                <td>{row.unsubscribedAt ? row.unsubscribedAt.slice(0, 10) : '-'}</td>
                <td>
                  <button
                    className={styles.ghostButton}
                    disabled={savingId === row.id}
                    onClick={() => void saveStatus(row)}
                  >
                    {savingId === row.id ? 'Saving...' : 'Save'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
