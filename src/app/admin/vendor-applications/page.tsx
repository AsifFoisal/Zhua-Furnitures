'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useToastFeedback } from '@/lib/toast-feedback';
import styles from '../admin-pages.module.css';

interface VendorApplicationRow {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string | null;
  category: string;
  message: string;
  status: 'new' | 'reviewing' | 'approved' | 'rejected' | 'archived';
  reviewedAt: string | null;
  createdAt: string;
}

const statusOptions: VendorApplicationRow['status'][] = [
  'new',
  'reviewing',
  'approved',
  'rejected',
  'archived',
];

export default function VendorApplicationsAdminPage() {
  const [applications, setApplications] = useState<VendorApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useToastFeedback({ error });

  const loadApplications = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/vendor-applications', { cache: 'no-store' });
      const data = (await res.json()) as { applications?: VendorApplicationRow[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Could not load vendor applications.');
      }

      setApplications(data.applications ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load vendor applications.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadApplications();
  }, []);

  const saveStatus = async (row: VendorApplicationRow) => {
    setSavingId(row.id);
    setError('');

    try {
      const res = await fetch(`/api/admin/vendor-applications/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: row.status }),
      });

      const data = (await res.json()) as { application?: VendorApplicationRow; error?: string };
      if (!res.ok || !data.application) {
        throw new Error(data.error ?? 'Could not update vendor application.');
      }

      setApplications((prev) => prev.map((item) => (item.id === row.id ? data.application! : item)));
      toast.success('Vendor application updated successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update vendor application.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>Vendor Applications</h2>
      {loading ? <p style={{ color: 'var(--text-dim)' }}>Loading applications...</p> : null}
      {error ? <p style={{ color: 'var(--status-danger)' }}>{error}</p> : null}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Business</th>
              <th>Contact</th>
              <th>Category</th>
              <th>Website</th>
              <th>Message</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((row) => (
              <tr key={row.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{row.businessName}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>{row.createdAt.slice(0, 10)}</div>
                </td>
                <td>
                  <div>{row.contactName}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>{row.email}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>{row.phone || '-'}</div>
                </td>
                <td>{row.category}</td>
                <td>
                  {row.website ? (
                    <a href={row.website} target="_blank" rel="noreferrer" style={{ color: '#8bb6ff' }}>
                      {row.website}
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td style={{ maxWidth: 260 }}>{row.message || '-'}</td>
                <td>
                  <select
                    className={styles.select}
                    value={row.status}
                    onChange={(event) =>
                      setApplications((prev) =>
                        prev.map((item) =>
                          item.id === row.id
                            ? { ...item, status: event.target.value as VendorApplicationRow['status'] }
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
