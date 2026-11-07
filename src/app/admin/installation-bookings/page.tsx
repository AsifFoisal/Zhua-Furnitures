'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useToastFeedback } from '@/lib/toast-feedback';
import styles from '../admin-pages.module.css';

interface InstallationBookingRow {
  id: string;
  productName: string;
  address: string;
  preferredDate: string;
  preferredSlot: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string | null;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

const statusOptions: InstallationBookingRow['status'][] = [
  'pending',
  'scheduled',
  'completed',
  'cancelled',
];

export default function InstallationBookingsAdminPage() {
  const [bookings, setBookings] = useState<InstallationBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useToastFeedback({ error });

  const loadBookings = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/installation-bookings', { cache: 'no-store' });
      const data = (await res.json()) as { bookings?: InstallationBookingRow[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Could not load installation bookings.');
      }

      setBookings(data.bookings ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load installation bookings.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  const saveStatus = async (row: InstallationBookingRow) => {
    setSavingId(row.id);
    setError('');

    try {
      const res = await fetch(`/api/admin/installation-bookings/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: row.status }),
      });

      const data = (await res.json()) as { booking?: InstallationBookingRow; error?: string };
      if (!res.ok || !data.booking) {
        throw new Error(data.error ?? 'Could not update installation booking.');
      }

      setBookings((prev) => prev.map((item) => (item.id === row.id ? data.booking! : item)));
      toast.success('Installation booking updated successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update installation booking.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>Installation Bookings</h2>
      {loading ? <p style={{ color: 'var(--text-dim)' }}>Loading bookings...</p> : null}
      {error ? <p style={{ color: 'var(--status-danger)' }}>{error}</p> : null}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Product</th>
              <th>Address</th>
              <th>Preferred Slot</th>
              <th>Notes</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((row) => (
              <tr key={row.id}>
                <td>{row.customerName}</td>
                <td>
                  <div>{row.customerEmail}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>{row.customerPhone}</div>
                </td>
                <td>{row.productName}</td>
                <td style={{ maxWidth: 220 }}>{row.address}</td>
                <td>
                  {row.preferredDate} / {row.preferredSlot}
                </td>
                <td style={{ maxWidth: 220 }}>{row.notes || '-'}</td>
                <td>
                  <select
                    className={styles.select}
                    value={row.status}
                    onChange={(event) =>
                      setBookings((prev) =>
                        prev.map((item) =>
                          item.id === row.id
                            ? { ...item, status: event.target.value as InstallationBookingRow['status'] }
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
