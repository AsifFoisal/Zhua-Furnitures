import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getPublicPayFastMode, hasResendEnv, hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { getOptionalUser } from '@/lib/auth';
import { findAuthUserIdByEmail } from '@/lib/order-linking';
import { validatePromoCode } from '@/lib/promo';
import { logUserActivity } from '@/lib/user-activity';
import { sendAdminNewOrderNotification } from '@/lib/order-notifications';
import { PAYFAST_LIVE_MINIMUM_AMOUNT_CENTS } from '@/lib/payments/payfast';
import {
  DEFAULT_DELIVERY_ZONES_DB,
  DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS,
  calculateDeliveryFeeCents,
  normalizeDeliveryType,
  normalizeProvinceCode,
} from '@/lib/delivery';

export const dynamic = 'force-dynamic';

type CheckoutItem = {
  productId?: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  selectedFabric?: string;
  customNote?: string;
};

type CheckoutPayload = {
  delivery: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    deliveryType: string;
  };
  paymentMethod: string;
  deliveryFee: number;
  total: number;
  promoCode?: string;
  items: CheckoutItem[];
};

type GatewayProvider = 'payfast' | 'yoco' | 'payflex' | 'placeholder';

function parseGatewayProvider(value: string): GatewayProvider {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'payfast' || normalized === 'yoco' || normalized === 'payflex') {
    return normalized;
  }

  return 'placeholder';
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeOrderEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase service role key is missing.' }, { status: 503 });
  }

  let payload: CheckoutPayload;
  try {
    payload = (await request.json()) as CheckoutPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid checkout payload.' }, { status: 400 });
  }

  if (!payload?.delivery || !Array.isArray(payload.items) || payload.items.length === 0) {
    return NextResponse.json({ error: 'Invalid checkout payload.' }, { status: 400 });
  }

  const delivery = payload.delivery;
  if (
    !delivery.name ||
    !delivery.email ||
    !delivery.phone ||
    !delivery.address ||
    !delivery.city ||
    !delivery.province ||
    !delivery.postalCode
  ) {
    return NextResponse.json({ error: 'Delivery details are incomplete.' }, { status: 400 });
  }

  const normalizedDeliveryEmail = normalizeOrderEmail(delivery.email);
  if (!normalizedDeliveryEmail.includes('@')) {
    return NextResponse.json({ error: 'A valid delivery email is required.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: settingsData } = await supabase
    .from('store_settings')
    .select('order_prefix, free_shipping_threshold_cents')
    .eq('id', 'default')
    .maybeSingle();

  const prefix = settingsData?.order_prefix ?? `ZE-${new Date().getFullYear()}`;
  const orderNumber = `${prefix}-${Date.now().toString().slice(-6)}`;

  const authCookieHint = request.headers.get('cookie') ?? '';
  const hasSupabaseAuthCookie = /sb-[^=;]+-auth-token/i.test(authCookieHint);

  let userId = (await getOptionalUser())?.id ?? null;
  if (!userId && hasSupabaseAuthCookie) {
    const matchedUserId = await findAuthUserIdByEmail(supabase, normalizedDeliveryEmail);
    if (matchedUserId) {
      userId = matchedUserId;
      console.info('[Orders API] Recovered authenticated user for checkout using email match.', {
        userId,
      });
    } else {
      console.warn('[Orders API] Auth cookie present but no matching user found for checkout email.');
    }
  }

  const normalizedItems = payload.items.map((item) => {
    const unitPriceCents = Math.max(0, Math.round(item.unitPrice * 100));
    const quantity = Math.max(1, Math.round(item.quantity));

    return {
      productId: item.productId && isUuid(item.productId) ? item.productId : null,
      productName: item.productName,
      unitPriceCents,
      quantity,
      lineTotalCents: unitPriceCents * quantity,
      selectedColor: item.selectedColor ?? null,
      selectedSize: item.selectedSize ?? null,
      selectedFabric: item.selectedFabric ?? null,
      customNote: item.customNote ?? null,
    };
  });

  if (normalizedItems.some((item) => !item.productId)) {
    return NextResponse.json(
      { error: 'Cart contains invalid products. Please refresh your cart and try again.' },
      { status: 400 }
    );
  }

  const productIds = Array.from(
    new Set(
      normalizedItems
        .map((item) => item.productId)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (productIds.length > 0) {
    const { data: productRows, error: productError } = await supabase
      .from('products')
      .select('id, name, in_stock, status')
      .in('id', productIds);

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 });
    }

    const productMap = new Map((productRows ?? []).map((row) => [row.id, row]));
    const unavailableProductNames = Array.from(
      new Set(
        normalizedItems
          .map((item) => {
            const product = productMap.get(item.productId as string);
            if (!product) {
              return item.productName;
            }

            if (!product.in_stock || product.status !== 'active') {
              return product.name || item.productName;
            }

            return null;
          })
          .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
      )
    );

    if (unavailableProductNames.length > 0) {
      return NextResponse.json(
        {
          error: `Some items are out of stock: ${unavailableProductNames.slice(0, 3).join(', ')}. Please update your cart and try again.`,
        },
        { status: 400 }
      );
    }
  }

  const subtotalCents = normalizedItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const normalizedProvince = normalizeProvinceCode(delivery.province);
  const normalizedDeliveryType = normalizeDeliveryType(delivery.deliveryType || 'standard');
  const freeShippingThresholdCents =
    settingsData?.free_shipping_threshold_cents ?? DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS;

  const { data: zoneData, error: zoneError } = await supabase
    .from('delivery_zones')
    .select('province_code, standard_fee_cents, express_fee_cents, is_active')
    .eq('is_active', true);

  if (zoneError) {
    return NextResponse.json({ error: zoneError.message }, { status: 500 });
  }

  const activeZones = (zoneData ?? []).map((zone) => ({
    province_code: zone.province_code,
    standard_fee_cents: zone.standard_fee_cents,
    express_fee_cents: zone.express_fee_cents,
  }));

  const zones = activeZones.length > 0 ? activeZones : DEFAULT_DELIVERY_ZONES_DB;
  const selectedZone = zones.find((zone) => zone.province_code === normalizedProvince);

  if (!selectedZone) {
    return NextResponse.json({ error: 'Unsupported delivery province.' }, { status: 400 });
  }

  const deliveryFeeCents = calculateDeliveryFeeCents({
    subtotalCents,
    freeShippingThresholdCents,
    zone: selectedZone,
    deliveryType: normalizedDeliveryType,
  });

  const requestedPromoCode = String(payload.promoCode ?? '').trim();
  let appliedPromo:
    | {
        id: string;
        code: string;
        discountCents: number;
      }
    | null = null;

  if (requestedPromoCode) {
    const promoValidation = await validatePromoCode({
      supabase,
      code: requestedPromoCode,
      subtotalCents,
      userId,
    });

    if (!promoValidation.valid) {
      return NextResponse.json({ error: promoValidation.error }, { status: 400 });
    }

    appliedPromo = {
      id: promoValidation.promo.id,
      code: promoValidation.promo.code,
      discountCents: promoValidation.promo.discountCents,
    };
  }

  const finalTotalCents = Math.max(
    0,
    subtotalCents + deliveryFeeCents - (appliedPromo?.discountCents ?? 0)
  );
  const gatewayProvider = parseGatewayProvider(String(payload.paymentMethod ?? 'placeholder'));

  if (gatewayProvider === 'payfast' && getPublicPayFastMode() === 'live') {
    if (finalTotalCents < PAYFAST_LIVE_MINIMUM_AMOUNT_CENTS) {
      const minimum = (PAYFAST_LIVE_MINIMUM_AMOUNT_CENTS / 100).toFixed(2);
      return NextResponse.json(
        {
          error: `PayFast live payments require a minimum order total of R ${minimum}.`,
        },
        { status: 400 }
      );
    }
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: userId,
      customer_name: delivery.name,
      customer_email: normalizedDeliveryEmail,
      customer_phone: delivery.phone,
      address: delivery.address,
      city: delivery.city,
      province: normalizedProvince,
      postal_code: delivery.postalCode,
      delivery_type: normalizedDeliveryType,
      delivery_fee_cents: deliveryFeeCents,
      total_cents: finalTotalCents,
      promo_code_id: appliedPromo?.id ?? null,
      promo_discount_cents: appliedPromo?.discountCents ?? 0,
      payment_method: gatewayProvider,
      payment_status: 'awaiting_payment',
      gateway_provider: gatewayProvider,
      payment_reference: orderNumber,
      remaining_balance_cents: finalTotalCents,
      fulfillment_status: 'pending',
    })
    .select('id, order_number')
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? 'Could not create order.' }, { status: 500 });
  }

  const orderItems = normalizedItems.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.productName,
    unit_price_cents: item.unitPriceCents,
    quantity: item.quantity,
    line_total_cents: item.lineTotalCents,
    selected_color: item.selectedColor,
    selected_size: item.selectedSize,
    selected_fabric: item.selectedFabric,
    custom_note: item.customNote,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  if (userId) {
    await logUserActivity({
      userId,
      actionType: 'order_created',
      resourceType: 'order',
      resourceId: order.id,
      metadata: {
        orderNumber: order.order_number,
      },
    });
  }

  if (hasResendEnv) {
    try {
      await sendAdminNewOrderNotification({
        event: 'placement',
        orderNumber: order.order_number,
        customerName: delivery.name,
        customerEmail: normalizedDeliveryEmail,
        customerPhone: delivery.phone,
        address: delivery.address,
        city: delivery.city,
        province: normalizedProvince,
        postalCode: delivery.postalCode,
        deliveryType: normalizedDeliveryType,
        paymentMethod: gatewayProvider,
        paymentStatus: 'awaiting_payment',
        subtotalCents,
        deliveryFeeCents,
        discountCents: appliedPromo?.discountCents ?? 0,
        promoCode: appliedPromo?.code ?? null,
        totalCents: finalTotalCents,
        items: normalizedItems.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          selectedFabric: item.selectedFabric,
          customNote: item.customNote,
        })),
      });
    } catch (notificationError) {
      console.error('[Orders API] Failed to send admin new-order email.', {
        orderId: order.id,
        orderNumber: order.order_number,
        error:
          notificationError instanceof Error
            ? notificationError.message
            : 'Unknown notification error',
      });
    }
  }

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.order_number,
  });
}
