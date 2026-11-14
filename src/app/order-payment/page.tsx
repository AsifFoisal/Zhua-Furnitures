import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { formatPrice } from '@/lib/data';
import OrderPaymentActions from './actions';

export const dynamic = 'force-dynamic';

type SearchParams = {
  id?: string;
  payment?: string;
};

const pageStyle = { padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' } as const;
const cardStyle = {
  background: 'var(--charcoal)',
  border: '1px solid rgba(181,146,65,0.25)',
  borderRadius: 16,
  padding: '2rem',
  display: 'grid',
  gap: '1rem',
} as const;

const ORDER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function Notice({ title, message }: { title: string; message: string }) {
  return (
    <div style={cardStyle}>
      <h1 className="heading-md" style={{ color: 'var(--text-primary)', margin: 0 }}>{title}</h1>
      <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, margin: 0 }}>{message}</p>
      <Link href="/" className="btn btn-outline" style={{ justifyContent: 'center' }}>
        Back to Zhua Furnitures
      </Link>
    </div>
  );
}

export default async function OrderPaymentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { id, payment } = await searchParams;

  return (
    <div style={pageStyle}>
      <div className="container" style={{ maxWidth: 720 }}>
        <span className="label-accent">Order Payment</span>
        <h1 className="heading-xl" style={{ color: 'var(--text-primary)', margin: '1rem 0 1.5rem' }}>
          Complete Your <span className="heading-accent">Payment</span>
        </h1>

        {!hasServiceSupabaseEnv || !id || !ORDER_ID_PATTERN.test(id) ? (
          <Notice
            title="Payment link not found"
            message="This payment link is incomplete. Please use the link from your email, or contact us and we will send it again."
          />
        ) : (
          <OrderPaymentBody orderId={id} paymentStatus={payment} />
        )}
      </div>
    </div>
  );
}

async function OrderPaymentBody({
  orderId,
  paymentStatus,
}: {
  orderId: string;
  paymentStatus?: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: order, error } = await supabase
    .from('orders')
    .select('order_number, customer_name, city, total_cents, payment_status, fulfillment_status')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !order) {
    return (
      <Notice
        title="Payment link not found"
        message="We could not find an order for this link. Please double-check the link from your email, or contact us and we will send it again."
      />
    );
  }

  const totalCents = Number(order.total_cents ?? 0);

  if (order.payment_status === 'paid') {
    return (
      <div style={{ ...cardStyle, borderColor: 'rgba(63,191,127,0.4)' }}>
        <h2 className="heading-md" style={{ color: '#3fbf7f', margin: 0 }}>
          Payment received — thank you!
        </h2>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, margin: 0 }}>
          We have confirmed payment of{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{formatPrice(totalCents)}</strong> for order{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{order.order_number}</strong>. We have also emailed
          you a confirmation, and your order is now moving into fulfilment.
        </p>
        <Link href="/account/orders" className="btn btn-primary" style={{ justifyContent: 'center' }}>
          View Your Order
        </Link>
      </div>
    );
  }

  if (order.fulfillment_status === 'cancelled') {
    return (
      <Notice
        title="This order was cancelled"
        message={`Order ${order.order_number} is no longer active, so it can no longer be paid online. Please contact us if you still want these items.`}
      />
    );
  }

  if (!Number.isFinite(totalCents) || totalCents <= 0) {
    return (
      <Notice
        title="Nothing to pay right now"
        message={`Order ${order.order_number} does not have a payable amount. Please contact us and we will confirm the correct total.`}
      />
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {paymentStatus === 'cancelled' ? (
        <p style={{ color: 'var(--status-danger)', margin: 0 }}>
          Payment was cancelled — nothing has been charged. You can try again below.
        </p>
      ) : null}

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 className="heading-md" style={{ color: 'var(--text-primary)', margin: 0 }}>Order {order.order_number}</h2>
          <span style={{ color: 'var(--text-faint)', fontSize: '0.85rem' }}>
            Prepared for {order.customer_name}
            {order.city ? ` · ${order.city}` : ''}
          </span>
        </div>

        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
          Your items are reserved and your order is waiting for payment. Complete it securely below —
          production starts as soon as your payment is confirmed.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '0.6rem',
            fontWeight: 700,
            color: 'var(--gold)',
            fontSize: '1.05rem',
          }}
        >
          <span>Total due</span>
          <span>{formatPrice(totalCents)}</span>
        </div>

        <p style={{ color: 'var(--text-faint)', fontSize: '0.8rem', margin: 0 }}>
          Payments are processed securely through PayFast (Visa, Mastercard, EFT).
        </p>
      </div>

      <OrderPaymentActions orderId={orderId} orderNumber={order.order_number} />
    </div>
  );
}
