'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useToastFeedback } from '@/lib/toast-feedback';
import styles from '../admin-pages.module.css';

interface ContactEnquiryRow {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  status: 'new' | 'in_progress' | 'resolved' | 'archived';
  createdAt: string;
}

const statusOptions: ContactEnquiryRow['status'][] = ['new', 'in_progress', 'resolved', 'archived'];

export default function ContactEnquiriesAdminPage() {
  const [enquiries, setEnquiries] = useState<ContactEnquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useToastFeedback({ error });

  const loadEnquiries = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/contact-enquiries', { cache: 'no-store' });
      const data = (await res.json()) as { enquiries?: ContactEnquiryRow[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Could not load enquiries.');
      }

      setEnquiries(data.enquiries ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load enquiries.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEnquiries();
  }, []);

  const saveStatus = async (row: ContactEnquiryRow) => {
    setSavingId(row.id);
    setError('');

    try {
      const res = await fetch(`/api/admin/contact-enquiries/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: row.status }),
      });

      const data = (await res.json()) as { enquiry?: ContactEnquiryRow; error?: string };
      if (!res.ok || !data.enquiry) {
        throw new Error(data.error ?? 'Could not update enquiry.');
      }

      setEnquiries((prev) => prev.map((item) => (item.id === row.id ? data.enquiry! : item)));
      toast.success('Enquiry updated successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update enquiry.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>Contact Enquiries</h2>
      {loading ? <p style={{ color: 'var(--text-dim)' }}>Loading enquiries...</p> : null}
      {error ? <p style={{ color: 'var(--status-danger)' }}>{error}</p> : null}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Source</th>
              <th>Message</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((row) => (
              <tr key={row.id}>
                <td>{row.fullName}</td>
                <td>{row.email}</td>
                <td>{row.phone || '-'}</td>
                <td>{row.source}</td>
                <td style={{ maxWidth: 260 }}>{row.message}</td>
                <td>
                  <select
                    className={styles.select}
                    value={row.status}
                    onChange={(event) =>
                      setEnquiries((prev) =>
                        prev.map((item) =>
                          item.id === row.id
                            ? { ...item, status: event.target.value as ContactEnquiryRow['status'] }
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
