import Link from 'next/link';
import { CheckCircle, Package, Truck, MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getPayFastEnv, hasPayFastEnv, hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { cookies } from 'next/headers';
import { getOptionalUser } from '@/lib/auth';
import { normalizeEmail } from '@/lib/order-linking';
import { applyPaidOrderStockDecrement } from '@/lib/inventory';
import ClearCartOnConfirmation from './ClearCartOnConfirmation';

type ConfirmationSearchParams = {
  order?: string;
  orderId?: string;
  m_payment_id?: string;
  custom_str1?: string;
  payment_status?: string;
};

type ConfirmedOrder = {
  id: string;
  order_number: string;
  created_at: string;
  total_cents: number;
  payment_status: string;
  fulfillment_status: string;
  customer_email?: string | null;
  order_items: Array<{
    product_id: string | null;
    product_name: string;
    quantity: number;
    line_total_cents: number;
  }>;
};

type PendingOrderCookie = {
  id: string;
  orderNumber: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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

function parsePendingOrderCookie(value: string | undefined): PendingOrderCookie | null {
  if (!value) {
    return null;
  }

  const parts = value.split('|');
  if (parts.length !== 2) {
    return null;
  }

  const id = parts[0]?.trim() ?? '';
  const orderNumber = parts[1]?.trim() ?? '';

  if (!id && !orderNumber) {
    return null;
  }

  return {
    id,
    orderNumber,
  };
}

async function getOrderForConfirmation(
  orderIdCandidate: string,
  orderNumberCandidate: string,
  fallbackUser: { id: string; email: string | null } | null,
  pendingOrder: PendingOrderCookie | null
): Promise<ConfirmedOrder | null> {
  if (!hasServiceSupabaseEnv) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const fallbackEmail = normalizeEmail(fallbackUser?.email);
  const lookbackIso = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const selectClause =
    'id, order_number, created_at, total_cents, payment_status, fulfillment_status, customer_email, order_items(product_id, product_name, quantity, line_total_cents)';

  if (isUuid(orderIdCandidate)) {
    const { data } = await supabase
      .from('orders')
      .select(selectClause)
      .eq('id', orderIdCandidate)
      .maybeSingle();

    if (data) {
      return data as ConfirmedOrder;
    }
  }

  if (orderNumberCandidate) {
    const { data } = await supabase
      .from('orders')
      .select(selectClause)
      .eq('order_number', orderNumberCandidate)
      .maybeSingle();

    if (data) {
      return data as ConfirmedOrder;
    }
  }

  if (pendingOrder?.id && isUuid(pendingOrder.id)) {
    const { data } = await supabase
      .from('orders')
      .select(selectClause)
      .eq('id', pendingOrder.id)
      .maybeSingle();

    if (data) {
      return data as ConfirmedOrder;
    }
  }

  if (pendingOrder?.orderNumber) {
    const { data } = await supabase
      .from('orders')
      .select(selectClause)
      .eq('order_number', pendingOrder.orderNumber)
      .maybeSingle();

    if (data) {
      return data as ConfirmedOrder;
    }
  }

  if (fallbackUser?.id) {
    const { data } = await supabase
      .from('orders')
      .select(selectClause)
      .eq('user_id', fallbackUser.id)
      .gte('created_at', lookbackIso)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      return data as ConfirmedOrder;
    }
  }

  if (fallbackEmail) {
    const { data } = await supabase
      .from('orders')
      .select(selectClause)
      .ilike('customer_email', fallbackEmail)
      .gte('created_at', lookbackIso)
      .order('created_at', { ascending: false })
      .limit(10);

    const exactMatch = (data ?? []).find(
      (row) => normalizeEmail((row as { customer_email?: string | null }).customer_email) === fallbackEmail
    );

    if (exactMatch) {
      return exactMatch as ConfirmedOrder;
    }
  }

  return null;
}

async function finalizeSandboxPendingPayment(
  order: ConfirmedOrder | null,
  pendingOrder: PendingOrderCookie | null
): Promise<ConfirmedOrder | null> {
  if (!order || !pendingOrder || !hasServiceSupabaseEnv || !hasPayFastEnv) {
    return order;
  }

  const payfastEnv = getPayFastEnv();
  if (payfastEnv.mode !== 'sandbox' || order.payment_status === 'paid') {
    return order;
  }

  const matchesPendingOrder =
    (pendingOrder.id && order.id === pendingOrder.id) ||
    (pendingOrder.orderNumber && order.order_number === pendingOrder.orderNumber);

  if (!matchesPendingOrder) {
    return order;
  }

  const nowIso = new Date().toISOString();
  const supabase = createSupabaseAdminClient();
  const idempotencyKey = `payfast:sandbox:return:${order.id}`;

  const { data: existingTransaction } = await supabase
    .from('payment_transactions')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (!existingTransaction?.id) {
    const { error: txInsertError } = await supabase.from('payment_transactions').insert({
      order_id: order.id,
      gateway: 'payfast',
      transaction_type: 'sale',
      status: 'succeeded',
      amount_cents: order.total_cents,
      idempotency_key: idempotencyKey,
      gateway_response: {
        source: 'sandbox_confirmation_fallback',
      },
      attempted_at: nowIso,
      completed_at: nowIso,
    });

    if (txInsertError) {
      console.error('[Order Confirmation] Could not insert sandbox fallback transaction.', {
        orderId: order.id,
        error: txInsertError.message,
      });
    }
  }

  const { error: orderUpdateError } = await supabase
    .from('orders')
    .update({
      payment_method: 'payfast',
      gateway_provider: 'payfast',
      payment_status: 'paid',
      payment_received_at: nowIso,
      payment_settled_at: nowIso,
      remaining_balance_cents: 0,
      payment_error_message: null,
    })
    .eq('id', order.id);

  if (orderUpdateError) {
    console.error('[Order Confirmation] Could not finalize sandbox order payment.', {
      orderId: order.id,
      error: orderUpdateError.message,
    });
    return order;
  }

  try {
    const stockResult = await applyPaidOrderStockDecrement({
      supabase,
      orderId: order.id,
      source: 'sandbox_confirmation',
    });

    console.info('[Order Confirmation] Applied stock decrement for sandbox paid fallback.', {
      orderId: order.id,
      ...stockResult,
    });
  } catch (stockError) {
    const errorMessage = stockError instanceof Error ? stockError.message : 'Stock decrement failed.';
    console.error('[Order Confirmation] Could not decrement stock during sandbox fallback.', {
      orderId: order.id,
      error: errorMessage,
    });
  }

  const selectClause =
    'id, order_number, created_at, total_cents, payment_status, fulfillment_status, customer_email, order_items(product_id, product_name, quantity, line_total_cents)';

  const { data: refreshedOrder } = await supabase
    .from('orders')
    .select(selectClause)
    .eq('id', order.id)
    .maybeSingle();

  return (refreshedOrder as ConfirmedOrder | null) ?? {
    ...order,
    payment_status: 'paid',
  };
}

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<ConfirmationSearchParams>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const pendingOrder = parsePendingOrderCookie(cookieStore.get('ze_pending_order')?.value);
  const user = await getOptionalUser();
  const orderIdCandidate = String(params.orderId ?? params.m_payment_id ?? '').trim();
  const orderNumberCandidate = String(params.order ?? params.custom_str1 ?? '').trim();
  const resolvedOrder = await getOrderForConfirmation(
    orderIdCandidate,
    orderNumberCandidate,
    user,
    pendingOrder
  );
  const confirmedOrder = await finalizeSandboxPendingPayment(resolvedOrder, pendingOrder);

  const resolvedOrderRef =
    confirmedOrder?.order_number || orderNumberCandidate || pendingOrder?.orderNumber;
  const orderNum = resolvedOrderRef || 'Pending Confirmation';
  const trackOrderHref = resolvedOrderRef
    ? `/track-order?order=${encodeURIComponent(resolvedOrderRef)}`
    : '/track-order';
  const paymentStatusLabel = confirmedOrder
    ? toTitleLabel(confirmedOrder.payment_status)
    : params.payment_status
      ? toTitleLabel(params.payment_status)
      : 'Pending';
  const fulfillmentStatusLabel = confirmedOrder
    ? toTitleLabel(confirmedOrder.fulfillment_status)
    : 'Pending';
  const orderItems = confirmedOrder?.order_items ?? [];
  const totalLabel = confirmedOrder ? formatOrderCurrency(confirmedOrder.total_cents) : null;
  const returningFromGateway = Boolean(orderIdCandidate || orderNumberCandidate || pendingOrder);

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <ClearCartOnConfirmation enabled={returningFromGateway} />
      <div className="container" style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
          <CheckCircle size={40} color="#4ECDC4" />
        </div>
        <span className="label-accent">Order Received</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0', fontSize: '2.5rem' }}>We Are Verifying Your <span className="heading-accent">Payment</span></h1>
        <p style={{ color: '#A9B7C9', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
          Your order <strong style={{ color: '#B59241' }}>{orderNum}</strong> has been created. We&apos;ll confirm payment and continue fulfillment as soon as your gateway response is received.
        </p>

        {confirmedOrder ? (
          <div
            style={{
              textAlign: 'left',
              background: '#163250',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ color: '#A9B7C9', margin: 0 }}>Order ID: <span style={{ color: '#EAF0F8' }}>{confirmedOrder.id}</span></p>
            <p style={{ color: '#A9B7C9', margin: '0.3rem 0 0' }}>Payment: <span style={{ color: '#EAF0F8' }}>{paymentStatusLabel}</span></p>
            <p style={{ color: '#A9B7C9', margin: '0.3rem 0 0' }}>Fulfillment: <span style={{ color: '#EAF0F8' }}>{fulfillmentStatusLabel}</span></p>
            {totalLabel ? (
              <p style={{ color: '#A9B7C9', margin: '0.3rem 0 0' }}>Total: <span style={{ color: '#EAF0F8' }}>{totalLabel}</span></p>
            ) : null}

            <div style={{ marginTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.7rem' }}>
              <p style={{ color: '#B59241', margin: '0 0 0.6rem', fontWeight: 700 }}>Ordered Products</p>
              {orderItems.length === 0 ? (
                <p style={{ color: '#A9B7C9', margin: 0 }}>No line items found yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: '0.6rem' }}>
                  {orderItems.map((item, index) => (
                    <div key={`${item.product_name}-${index}`} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '0.7rem' }}>
                      <p style={{ color: '#EAF0F8', margin: 0, fontWeight: 600 }}>{item.product_name}</p>
                      <p style={{ color: '#A9B7C9', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Product ID: {item.product_id ?? 'N/A'}</p>
                      <p style={{ color: '#A9B7C9', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                        Quantity: {item.quantity} · Line Total: {formatOrderCurrency(item.line_total_cents)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { icon: Package, label: 'Payment Verification', status: paymentStatusLabel, color: '#B59241' },
            { icon: Truck, label: 'Dispatched', status: fulfillmentStatusLabel, color: '#3A5673' },
            { icon: CheckCircle, label: 'Delivered', status: confirmedOrder?.fulfillment_status === 'delivered' ? 'Done' : 'Pending', color: '#3A5673' },
          ].map(({ icon: Icon, label, status, color }) => (
            <div key={label} style={{ padding: '1.25rem', background: '#163250', border: `1px solid ${color}30`, borderRadius: 12 }}>
              <Icon size={24} color={color} style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontFamily: 'var(--font-accent)', fontSize: '0.85rem', fontWeight: 600, color: color === '#3A5673' ? '#58708A' : '#EAF0F8' }}>{label}</div>
              <div style={{ fontSize: '0.72rem', color: color === '#B59241' ? '#B59241' : '#3A5673', marginTop: 2 }}>{status}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <Link href={trackOrderHref} className="btn btn-primary">Track Your Order</Link>
          <Link href="/shop" className="btn btn-outline">Continue Shopping</Link>
        </div>
        <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp" style={{ display: 'inline-flex' }}>
          <MessageCircle size={16} /> Questions? Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
