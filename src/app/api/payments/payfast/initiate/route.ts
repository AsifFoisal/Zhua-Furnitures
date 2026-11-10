import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  PayFastConfigError,
  getPayFastEnv,
  hasPayFastEnv,
  hasServiceSupabaseEnv,
} from '@/lib/supabase/env';
import {
  buildPayFastFields,
  generatePayFastSignature,
  getPayFastProcessUrl,
  PAYFAST_LIVE_MINIMUM_AMOUNT_CENTS,
  validatePayFastCallbackUrls,
} from '@/lib/payments/payfast';
import {
  DATABASE_OUT_OF_DATE_MESSAGE,
  isSchemaDriftError,
  logDatabaseError,
} from '@/lib/supabase/errors';
import { getSiteUrl } from '@/lib/supabase/site-url';

export const dynamic = 'force-dynamic';

const ORDER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FALLBACK_BASE_URL = 'http://localhost:3000';

function getNameParts(fullName: string): { firstName: string; lastName: string } {
  const tokens = fullName.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return { firstName: 'Customer', lastName: '' };
  }

  if (tokens.length === 1) {
    return { firstName: tokens[0], lastName: '' };
  }

  return {
    firstName: tokens[0],
    lastName: tokens.slice(1).join(' '),
  };
}

function safeUrl(value: string, base: string): URL | null {
  try {
    return new URL(value, base);
  } catch {
    return null;
  }
}

function buildCallbackUrl(
  configuredUrl: string,
  fallbackPath: string,
  siteUrl: string,
  params: Record<string, string>
): string {
  const base = siteUrl.trim() || FALLBACK_BASE_URL;
  const fallback = safeUrl(fallbackPath, base) ?? new URL(fallbackPath, FALLBACK_BASE_URL);
  const trimmedConfiguredUrl = configuredUrl.trim();
  const target = (trimmedConfiguredUrl ? safeUrl(trimmedConfiguredUrl, base) : null) ?? fallback;

  Object.entries(params).forEach(([key, value]) => {
    target.searchParams.set(key, value);
  });

  return target.toString();
}

async function handlePost(request: Request): Promise<NextResponse> {
  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase service role key is missing.' }, { status: 503 });
  }

  if (!hasPayFastEnv) {
    return NextResponse.json({ error: 'PayFast environment is not configured.' }, { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payment initiation payload.' }, { status: 400 });
  }

  const rawOrderId =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>).orderId
      : undefined;
  const orderId = typeof rawOrderId === 'string' ? rawOrderId.trim() : '';

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required.' }, { status: 400 });
  }

  if (!ORDER_ID_PATTERN.test(orderId)) {
    return NextResponse.json({ error: 'orderId is not a valid order id.' }, { status: 400 });
  }

  let payfastEnv: ReturnType<typeof getPayFastEnv>;
  try {
    payfastEnv = getPayFastEnv();
  } catch (error) {
    const message =
      error instanceof PayFastConfigError ? error.message : 'PayFast is not configured.';
    console.error('[PayFast Initiate] Configuration error.', { message });
    return NextResponse.json({ error: message }, { status: 503 });
  }

  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    console.error('[PayFast Initiate] Could not create database client.', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'PayFast is not available right now. Please try again later.' },
      { status: 503 }
    );
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(
      'id, order_number, customer_name, customer_email, total_cents, payment_status, payment_attempt_count'
    )
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    logDatabaseError('[PayFast Initiate] Could not load order.', orderError, { orderId });

    if (isSchemaDriftError(orderError)) {
      return NextResponse.json({ error: DATABASE_OUT_OF_DATE_MESSAGE }, { status: 503 });
    }

    if (!orderError || orderError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Could not load the order. Please try again.' },
      { status: 500 }
    );
  }

  if (order.payment_status === 'paid') {
    return NextResponse.json({ error: 'Order is already paid.' }, { status: 400 });
  }

  if (payfastEnv.mode === 'live' && order.total_cents < PAYFAST_LIVE_MINIMUM_AMOUNT_CENTS) {
    const minimum = (PAYFAST_LIVE_MINIMUM_AMOUNT_CENTS / 100).toFixed(2);
    return NextResponse.json(
      {
        error: `PayFast live payments require a minimum order total of R ${minimum}.`,
      },
      { status: 400 }
    );
  }

  const processUrl = getPayFastProcessUrl(payfastEnv.mode);
  const names = getNameParts(order.customer_name);
  const siteUrl = getSiteUrl(request.headers);

  const callbackParams = {
    order: order.order_number,
    orderId: order.id,
  };

  const returnUrl = buildCallbackUrl(
    payfastEnv.returnUrl,
    '/order-confirmation',
    siteUrl,
    callbackParams
  );

  const cancelUrl = buildCallbackUrl(
    payfastEnv.cancelUrl,
    '/checkout',
    siteUrl,
    {
      payment: 'cancelled',
      ...callbackParams,
    }
  );

  const urlError = validatePayFastCallbackUrls(
    { returnUrl, cancelUrl, notifyUrl: payfastEnv.notifyUrl },
    payfastEnv.mode
  );

  if (urlError) {
    console.error('[PayFast Initiate] Invalid callback URL configuration.', {
      orderId,
      mode: payfastEnv.mode,
      issue: urlError,
    });
    return NextResponse.json(
      { error: `PayFast is not configured correctly: ${urlError}` },
      { status: 503 }
    );
  }

  const fields = buildPayFastFields({
    merchantId: payfastEnv.merchantId,
    merchantKey: payfastEnv.merchantKey,
    returnUrl,
    cancelUrl,
    notifyUrl: payfastEnv.notifyUrl,
    firstName: names.firstName,
    lastName: names.lastName,
    email: order.customer_email,
    paymentId: order.id,
    amountCents: order.total_cents,
    itemName: `Order ${order.order_number}`,
    customStr1: order.order_number,
  });

  const signature = generatePayFastSignature(fields, payfastEnv.passphrase);

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_method: 'payfast',
      gateway_provider: 'payfast',
      payment_reference: order.order_number,
      payment_attempt_count: (order.payment_attempt_count ?? 0) + 1,
      last_payment_attempt_at: new Date().toISOString(),
      payment_status:
        order.payment_status === 'failed' || order.payment_status === 'placeholder'
          ? 'awaiting_payment'
          : order.payment_status,
    })
    .eq('id', order.id);

  if (updateError) {
    logDatabaseError('[PayFast Initiate] Could not record payment attempt.', updateError, {
      orderId: order.id,
      mode: payfastEnv.mode,
    });

    if (isSchemaDriftError(updateError)) {
      return NextResponse.json({ error: DATABASE_OUT_OF_DATE_MESSAGE }, { status: 503 });
    }

    return NextResponse.json(
      { error: 'Could not start PayFast checkout. Please try again.' },
      { status: 500 }
    );
  }

  console.info('[PayFast Initiate] Prepared payment form.', {
    orderId: order.id,
    mode: payfastEnv.mode,
    amountCents: order.total_cents,
  });

  const response = NextResponse.json({
    formAction: processUrl,
    fields: {
      ...fields,
      signature,
    },
  });

  response.cookies.set('ze_pending_order', `${order.id}|${order.order_number}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 2 * 60 * 60,
  });

  return response;
}

export async function POST(request: Request) {
  try {
    return await handlePost(request);
  } catch (error) {
    console.error('[PayFast Initiate] Unexpected failure.', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Could not start PayFast checkout. Please try again.' },
      { status: 500 }
    );
  }
}
