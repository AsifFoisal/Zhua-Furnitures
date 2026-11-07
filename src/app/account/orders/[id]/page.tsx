import { notFound } from 'next/navigation';
import { requireAuthenticatedPage } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv, hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { linkGuestOrdersToUserByEmail, normalizeEmail } from '@/lib/order-linking';

function formatCurrency(cents: number): string {
  const amount = Math.max(0, cents) / 100;
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toTitle(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

type OrderDetail = {
  id: string;
  order_number: string;
  created_at: string;
  total_cents: number;
  payment_status: string;
  fulfillment_status: string;
  customer_email?: string | null;
  order_items: Array<{
    product_name: string;
    quantity: number;
    line_total_cents: number;
    selected_color: string | null;
    selected_size: string | null;
    selected_fabric: string | null;
  }>;
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuthenticatedPage('/auth/login');
  const normalizedUserEmail = normalizeEmail(user.email);
  const { id } = await params;

  let order: OrderDetail | null = null;

  const selectClause =
    'id, order_number, created_at, total_cents, payment_status, fulfillment_status, customer_email, order_items(product_name, quantity, line_total_cents, selected_color, selected_size, selected_fabric)';

  if (hasServiceSupabaseEnv) {
    const adminClient = createSupabaseAdminClient();

    if (normalizedUserEmail) {
      await linkGuestOrdersToUserByEmail(adminClient, user.id, normalizedUserEmail);
    }

    const { data: ownedOrder } = await adminClient
      .from('orders')
      .select(selectClause)
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (ownedOrder) {
      order = ownedOrder as OrderDetail;
    } else if (normalizedUserEmail) {
      const { data: fallbackOrder } = await adminClient
        .from('orders')
        .select(selectClause)
        .eq('id', id)
        .ilike('customer_email', normalizedUserEmail)
        .maybeSingle();

      if (
        fallbackOrder &&
        normalizeEmail((fallbackOrder as { customer_email?: string | null }).customer_email) ===
          normalizedUserEmail
      ) {
        order = fallbackOrder as OrderDetail;
      }
    }
  } else if (hasPublicSupabaseEnv) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('orders')
      .select(
        'id, order_number, created_at, total_cents, payment_status, fulfillment_status, order_items(product_name, quantity, line_total_cents, selected_color, selected_size, selected_fabric)'
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    order = data as OrderDetail | null;
  }

  if (!order) {
    notFound();
  }

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        <span className="label-accent">Account</span>
        <h1 className="heading-xl" style={{ color: 'var(--text-primary)', margin: '1rem 0 1.25rem' }}>
          Order {order.order_number}
        </h1>

        <article style={{ background: 'var(--charcoal)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '1rem', marginBottom: '1rem' }}>
          <p style={{ color: 'var(--text-dim)', margin: 0 }}>Placed: {new Date(order.created_at).toLocaleString('en-ZA')}</p>
          <p style={{ color: 'var(--text-dim)', margin: '0.4rem 0 0' }}>Status: {toTitle(order.fulfillment_status)}</p>
          <p style={{ color: 'var(--text-dim)', margin: '0.4rem 0 0' }}>Payment: {toTitle(order.payment_status)}</p>
          <p style={{ color: 'var(--text-primary)', margin: '0.8rem 0 0', fontWeight: 700 }}>Total: {formatCurrency(order.total_cents)}</p>
        </article>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {(order.order_items ?? []).map((item, index) => (
            <article key={`${item.product_name}-${index}`} style={{ background: 'var(--charcoal)', border: '1px solid var(--border-light)', borderRadius: 14, padding: '0.95rem 1rem', display: 'grid', gap: '0.35rem' }}>
              <p style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 600 }}>{item.product_name}</p>
              <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '0.9rem' }}>Quantity: {item.quantity}</p>
              {item.selected_color ? <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '0.9rem' }}>Color: {item.selected_color}</p> : null}
              {item.selected_size ? <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '0.9rem' }}>Size: {item.selected_size}</p> : null}
              {item.selected_fabric ? <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '0.9rem' }}>Fabric: {item.selected_fabric}</p> : null}
              <p style={{ color: 'var(--text-primary)', margin: '0.2rem 0 0', fontWeight: 600 }}>{formatCurrency(item.line_total_cents)}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
