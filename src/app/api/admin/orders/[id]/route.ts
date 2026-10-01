import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import {
  displayFulfillmentStatus,
  displayPaymentStatus,
  parseFulfillmentStatus,
  parsePaymentStatus,
} from '@/lib/admin-api';
import { sendOrderStatusNotification } from '@/lib/order-notifications';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logUserActivity } from '@/lib/user-activity';

export const dynamic = 'force-dynamic';

type OrderItemRow = {
  product_name: string;
  quantity: number;
  line_total_cents: number;
  selected_color: string | null;
  selected_size: string | null;
  selected_fabric: string | null;
};

type AdminOrderRow = {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  created_at: string;
  delivery_type: string;
  delivery_fee_cents: number;
  total_cents: number;
  payment_method: string;
  payment_reference: string | null;
  payment_received_at: string | null;
  payment_settled_at: string | null;
  promo_discount_cents: number;
  payment_status:
    | 'awaiting_payment'
    | 'pending'
    | 'paid'
    | 'partial'
    | 'failed'
    | 'placeholder';
  fulfillment_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  order_items: OrderItemRow[] | null;
};

const adminOrderSelect =
  'id, order_number, user_id, customer_name, customer_email, customer_phone, address, city, province, postal_code, created_at, delivery_type, delivery_fee_cents, total_cents, payment_method, payment_reference, payment_received_at, payment_settled_at, promo_discount_cents, payment_status, fulfillment_status, order_items(product_name, quantity, line_total_cents, selected_color, selected_size, selected_fabric)';

function mapAdminOrderRow(data: AdminOrderRow) {
  const orderItems = (data.order_items ?? []) as OrderItemRow[];
  const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: data.id,
    orderNumber: data.order_number,
    customer: data.customer_name,
    customerEmail: data.customer_email,
    customerPhone: data.customer_phone,
    address: data.address,
    city: data.city,
    province: data.province,
    postalCode: data.postal_code,
    date: data.created_at.slice(0, 10),
    deliveryType: data.delivery_type,
    deliveryFee: Math.round(data.delivery_fee_cents / 100),
    total: Math.round(data.total_cents / 100),
    paymentMethod: data.payment_method,
    paymentReference: data.payment_reference,
    paymentReceivedAt: data.payment_received_at,
    paymentSettledAt: data.payment_settled_at,
    promoDiscount: Math.round(data.promo_discount_cents / 100),
    items: itemCount,
    orderItems: orderItems.map((item) => ({
      productName: item.product_name,
      quantity: item.quantity,
      lineTotal: Math.round(item.line_total_cents / 100),
      selectedColor: item.selected_color,
      selectedSize: item.selected_size,
      selectedFabric: item.selected_fabric,
    })),
    payment: displayPaymentStatus(data.payment_status),
    fulfillment: displayFulfillmentStatus(data.fulfillment_status),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const { id } = await params;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from('orders').select(adminOrderSelect).eq('id', id).maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  return NextResponse.json({ order: mapAdminOrderRow(data as AdminOrderRow) });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const { id } = await params;
  const payload = (await request.json()) as {
    fulfillment?: string;
    payment?: string;
  };
  const nextFulfillmentStatus = payload.fulfillment ? parseFulfillmentStatus(payload.fulfillment) : null;

  const updateData: {
    fulfillment_status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    payment_status?: 'awaiting_payment' | 'pending' | 'paid' | 'partial' | 'failed' | 'placeholder';
  } = {};

  if (nextFulfillmentStatus) {
    updateData.fulfillment_status = nextFulfillmentStatus;
  }

  if (payload.payment) {
    updateData.payment_status = parsePaymentStatus(payload.payment);
  }

  const supabase = createSupabaseAdminClient();
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('payment_status, fulfillment_status')
    .eq('id', id)
    .maybeSingle();

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', id)
    .select(adminOrderSelect)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not update order.' }, { status: 500 });
  }

  if (data.user_id) {
    await logUserActivity({
      userId: data.user_id,
      actionType: 'order_status_changed',
      resourceType: 'order',
      resourceId: data.id,
      metadata: {
        paymentStatus: data.payment_status,
        fulfillmentStatus: data.fulfillment_status,
      },
    });
  }

  const previousPaymentStatus = existingOrder?.payment_status ?? null;
  const previousFulfillmentStatus = existingOrder?.fulfillment_status ?? null;
  const nextPaymentStatus = updateData.payment_status ?? null;

  const paymentChanged =
    nextPaymentStatus !== null && nextPaymentStatus !== previousPaymentStatus;
  const fulfillmentChanged =
    nextFulfillmentStatus !== null && nextFulfillmentStatus !== previousFulfillmentStatus;

  if (fulfillmentChanged && nextFulfillmentStatus !== 'pending') {
    try {
      await sendOrderStatusNotification({
        customerEmail: data.customer_email,
        customerName: data.customer_name,
        orderNumber: data.order_number,
        fulfillmentStatus: nextFulfillmentStatus,
      });
    } catch (notificationError) {
      console.error('[Admin Order Update] Failed to send order status email.', {
        orderId: data.id,
        orderNumber: data.order_number,
        customerEmail: data.customer_email,
        fulfillmentStatus: data.fulfillment_status,
        error:
          notificationError instanceof Error ? notificationError.message : 'Unknown notification error',
      });
    }
  }

  if (
    paymentChanged &&
    (nextPaymentStatus === 'paid' || nextPaymentStatus === 'partial' || nextPaymentStatus === 'failed')
  ) {
    try {
      await sendOrderStatusNotification({
        customerEmail: data.customer_email,
        customerName: data.customer_name,
        orderNumber: data.order_number,
        paymentStatus: nextPaymentStatus,
      });
    } catch (notificationError) {
      console.error('[Admin Order Update] Failed to send payment status email.', {
        orderId: data.id,
        orderNumber: data.order_number,
        customerEmail: data.customer_email,
        paymentStatus: nextPaymentStatus,
        error:
          notificationError instanceof Error ? notificationError.message : 'Unknown notification error',
      });
    }
  }

  return NextResponse.json({ order: mapAdminOrderRow(data as AdminOrderRow) });
}
