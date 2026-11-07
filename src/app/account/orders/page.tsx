import Link from 'next/link';
import { requireAuthenticatedPage } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv, hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { linkGuestOrdersToUserByEmail, normalizeEmail } from '@/lib/order-linking';

interface AccountOrder {
  id: string;
  orderNumber: string;
  date: string;
  total: string;
  status: string;
  payment: string;
}

function toTitleLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatOrderCurrency(totalCents: number): string {
  const amount = Math.max(0, totalCents) / 100;
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type OrderRow = {
  id: string;
  order_number: string;
  created_at: string;
  total_cents: number;
  fulfillment_status: string;
  payment_status: string;
  customer_email?: string | null;
};

export default async function OrdersPage() {
  const user = await requireAuthenticatedPage('/auth/login');
  const normalizedUserEmail = normalizeEmail(user.email);
  let orders: AccountOrder[] = [];

  if (hasServiceSupabaseEnv) {
    const adminClient = createSupabaseAdminClient();

    if (normalizedUserEmail) {
      await linkGuestOrdersToUserByEmail(adminClient, user.id, normalizedUserEmail);
    }

    const { data: ownedData } = await adminClient
      .from('orders')
      .select('id, order_number, created_at, total_cents, fulfillment_status, payment_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const byId = new Map<string, OrderRow>();
    for (const row of ownedData ?? []) {
      byId.set(row.id, row as OrderRow);
    }

    if (normalizedUserEmail) {
      const { data: fallbackData } = await adminClient
        .from('orders')
        .select('id, order_number, created_at, total_cents, fulfillment_status, payment_status, customer_email')
        .ilike('customer_email', normalizedUserEmail)
        .order('created_at', { ascending: false })
        .limit(40);

      const safeMatches = (fallbackData ?? []).filter(
        (row) => normalizeEmail(row.customer_email) === normalizedUserEmail
      );

      for (const row of safeMatches) {
        byId.set(row.id, row as OrderRow);
      }
    }

    const mergedRows = Array.from(byId.values()).sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    );

    orders = mergedRows.map((entry) => ({
      id: entry.id,
      orderNumber: entry.order_number,
      date: new Date(entry.created_at).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      total: formatOrderCurrency(entry.total_cents),
      status: toTitleLabel(entry.fulfillment_status),
      payment: toTitleLabel(entry.payment_status),
    }));
  } else if (hasPublicSupabaseEnv) {

    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, created_at, total_cents, fulfillment_status, payment_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    orders = (data ?? []).map((entry) => ({
      id: entry.id,
      orderNumber: entry.order_number,
      date: new Date(entry.created_at).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      total: formatOrderCurrency(entry.total_cents),
      status: toTitleLabel(entry.fulfillment_status),
      payment: toTitleLabel(entry.payment_status),
    }));
  }

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <span className="label-accent">Account</span>
        <h1 className="heading-xl" style={{ color: 'var(--text-primary)', margin: '1rem 0 1.25rem' }}>Order History</h1>

        {orders.length === 0 ? (
          <div style={{ background: 'var(--charcoal)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '1.2rem' }}>
            <p style={{ color: 'var(--text-dim)', marginBottom: '0.8rem' }}>No orders found for this account yet.</p>
            <Link href="/shop" className="btn btn-primary btn-sm">Browse Shop</Link>
          </div>
        ) : (
          <div style={{ background: 'var(--charcoal)', border: '1px solid var(--border-light)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: '0.6rem', padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-light)', color: 'var(--gold)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <span>Order</span><span>Date</span><span>Total</span><span>Status</span><span>Payment</span>
            </div>
            {orders.map((order) => (
              <div key={order.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: '0.6rem', padding: '0.95rem 1rem', borderBottom: '1px solid var(--border-light)' }}>
                <Link href={`/account/orders/${order.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                  {order.orderNumber}
                </Link>
                <span style={{ color: 'var(--text-dim)' }}>{order.date}</span>
                <span style={{ color: 'var(--text-primary)' }}>{order.total}</span>
                <span style={{ color: order.status === 'Delivered' ? '#4ECDC4' : 'var(--gold)' }}>{order.status}</span>
                <span style={{ color: 'var(--text-dim)' }}>{order.payment}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
