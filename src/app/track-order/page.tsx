'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const statuses = ['Placed', 'Confirmed', 'Dispatched', 'Out for Delivery', 'Delivered'];

type TrackedOrder = {
  orderNumber: string;
  placedAt: string;
  totalCents: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  progressStep: number;
  isCancelled: boolean;
};

function formatCurrency(cents: number): string {
  const amount = Math.max(0, cents) / 100;
  return `R ${amount.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<TrackOrderFallback />}>
      <TrackOrderContent />
    </Suspense>
  );
}

function TrackOrderFallback() {
  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        <span className="label-accent">Order Tracking</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.25rem' }}>
          Track Your Delivery
        </h1>
        <div
          style={{
            background: '#163250',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: '1.15rem',
          }}
        >
          <p style={{ color: '#A9B7C9', margin: 0 }}>Loading tracking details...</p>
        </div>
      </div>
    </div>
  );
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);

  useEffect(() => {
    const initialOrder = String(searchParams.get('order') ?? '').trim();
    if (initialOrder) {
      setOrderNumber(initialOrder);
    }
  }, [searchParams]);

  const handleTrack = async () => {
    if (!orderNumber.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          email,
          phone,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        order?: TrackedOrder;
      };

      if (!response.ok || !payload.order) {
        throw new Error(payload.error ?? 'Could not find this order.');
      }

      setTrackedOrder(payload.order);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not find this order. Check your details and try again.';
      setError(message);
      setTrackedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        <span className="label-accent">Order Tracking</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.25rem' }}>Track Your <span className="heading-accent">Delivery</span></h1>

        <div style={{ background: '#163250', border: '1px solid rgba(181,146,65,0.2)', borderRadius: 14, padding: '1.1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
            <input
              className="form-input"
              placeholder="Order number (e.g. ZE-2026-123456)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
            <input
              className="form-input"
              type="email"
              placeholder="Order email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="form-input"
              type="tel"
              placeholder="or phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => void handleTrack()} disabled={loading}>
              {loading ? 'Checking...' : 'Track Order'}
            </button>
            <span style={{ color: '#8ca0b8', fontSize: '0.82rem' }}>
              Enter order number and either the same email or phone used at checkout.
            </span>
          </div>
          {error ? <p style={{ color: '#f88f8f', margin: '0.75rem 0 0' }}>{error}</p> : null}
        </div>

        <div style={{ background: '#163250', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.15rem' }}>
          <p style={{ color: '#A9B7C9', marginBottom: '0.55rem' }}>
            Current progress for{' '}
            <strong style={{ color: '#B59241' }}>
              {trackedOrder?.orderNumber || orderNumber || 'ZE-2026-000000'}
            </strong>
          </p>
          {trackedOrder ? (
            <p style={{ color: '#A9B7C9', marginBottom: '0.9rem', fontSize: '0.9rem' }}>
              Placed {new Date(trackedOrder.placedAt).toLocaleString('en-ZA')} ·
              {' '}Total {formatCurrency(trackedOrder.totalCents)} ·
              {' '}Payment <span style={{ color: '#EAF0F8' }}>{trackedOrder.paymentStatus}</span> ·
              {' '}Fulfillment <span style={{ color: '#EAF0F8' }}>{trackedOrder.fulfillmentStatus}</span>
            </p>
          ) : null}
          <div style={{ display: 'grid', gap: '0.55rem' }}>
            {statuses.map((status, index) => {
              const active = index <= (trackedOrder?.progressStep ?? 0);
              return (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 999, background: active ? '#B59241' : '#3A5673' }} />
                  <span style={{ color: active ? '#EAF0F8' : '#8CA0B8', fontSize: '0.95rem' }}>{status}</span>
                </div>
              );
            })}
          </div>
          {trackedOrder?.isCancelled ? (
            <p style={{ color: '#f6c26d', marginTop: '0.85rem', fontSize: '0.9rem' }}>
              This order is currently marked as Cancelled. Contact support if you need assistance.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
