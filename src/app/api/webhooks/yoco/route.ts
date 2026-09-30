import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getYocoEnv, hasServiceSupabaseEnv, hasYocoEnv } from '@/lib/supabase/env';
import { findAuthUserIdByEmail, linkGuestOrdersToUserByEmail } from '@/lib/order-linking';
import {
  getYocoWebhookSignature,
  mapYocoPaymentStatus,
  verifyYocoWebhookSignature,
} from '@/lib/payments/yoco';
import { applyPaidOrderStockDecrement } from '@/lib/inventory';
import { processCurtainQuotePaymentWebhook } from '@/lib/quote-payments';

export const dynamic = 'force-dynamic';

type Path = Array<string>;

function readPath(payload: unknown, path: Path): unknown {
  let value: unknown = payload;

  for (const key of path) {
    if (typeof value !== 'object' || value === null || !(key in (value as Record<string, unknown>))) {
      return null;
    }
    value = (value as Record<string, unknown>)[key];
  }

  return value;
}

function firstString(payload: unknown, paths: Path[]): string | null {
  for (const path of paths) {
    const value = readPath(payload, path);
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function firstNumber(payload: unknown, paths: Path[]): number | null {
  for (const path of paths) {
    const value = readPath(payload, path);

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function toCents(payload: unknown): number {
  const amountInCents = firstNumber(payload, [
    ['amountInCents'],
    ['amount_in_cents'],
    ['data', 'amountInCents'],
    ['data', 'amount_in_cents'],
  ]);

  if (amountInCents !== null) {
    return Math.max(0, Math.round(amountInCents));
  }

  const amount = firstNumber(payload, [
    ['amount'],
    ['data', 'amount'],
    ['payment', 'amount'],
  ]);

  if (amount === null) {
    return 0;
  }

  return Math.max(0, Math.round(amount * 100));
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request) {
  if (!hasServiceSupabaseEnv || !hasYocoEnv) {
    console.error('[Yoco Webhook] Missing required environment configuration.');
    return new NextResponse('Configuration missing', { status: 503 });
  }

  const yocoEnv = getYocoEnv();
  const rawBody = await request.text();
  const signature = getYocoWebhookSignature(request.headers);

  if (!verifyYocoWebhookSignature(rawBody, signature, yocoEnv.webhookSecret)) {
    console.warn('[Yoco Webhook] Invalid signature.');
    return new NextResponse('Invalid signature', { status: 400 });
  }

  let payload: unknown;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return new NextResponse('Invalid payload', { status: 400 });
  }

  const providerStatus = mapYocoPaymentStatus(
    firstString(payload, [
      ['status'],
      ['paymentStatus'],
      ['payment_status'],
      ['data', 'status'],
      ['data', 'paymentStatus'],
      ['data', 'payment_status'],
      ['eventType'],
      ['event_type'],
      ['type'],
    ]) ?? 'pending'
  );

  const orderReference = firstString(payload, [
    ['metadata', 'orderId'],
    ['metadata', 'order_id'],
    ['data', 'metadata', 'orderId'],
    ['data', 'metadata', 'order_id'],
    ['orderId'],
    ['order_id'],
    ['reference'],
    ['data', 'reference'],
  ]);

  if (!orderReference) {
    console.warn('[Yoco Webhook] Missing order reference in payload.');
    return new NextResponse('Missing order reference', { status: 400 });
  }

  const eventId =
    firstString(payload, [
      ['eventId'],
      ['event_id'],
      ['id'],
      ['data', 'eventId'],
      ['data', 'event_id'],
      ['data', 'id'],
    ]) ?? 'evt';

  const gatewayTransactionId = firstString(payload, [
    ['chargeId'],
    ['charge_id'],
    ['paymentId'],
    ['payment_id'],
    ['data', 'chargeId'],
    ['data', 'charge_id'],
    ['data', 'paymentId'],
    ['data', 'payment_id'],
    ['id'],
  ]);

  const webhookId = `${eventId}:${orderReference}:${gatewayTransactionId ?? 'none'}:${providerStatus}`;
  const supabase = createSupabaseAdminClient();

  const { data: existingEvent } = await supabase
    .from('payment_webhook_events')
    .select('id')
    .eq('gateway', 'yoco')
    .eq('webhook_id', webhookId)
    .maybeSingle();

  if (existingEvent?.id) {
    console.info('[Yoco Webhook] Duplicate event received; skipping.', {
      webhookId,
      orderReference,
    });
    return new NextResponse('OK', { status: 200 });
  }

  const eventType =
    firstString(payload, [
      ['eventType'],
      ['event_type'],
      ['type'],
      ['status'],
      ['data', 'status'],
    ]) ?? 'unknown';

  const { data: createdEvent, error: createdEventError } = await supabase
    .from('payment_webhook_events')
    .insert({
      gateway: 'yoco',
      webhook_id: webhookId,
      event_type: eventType,
      processing_status: 'received',
      payload,
    })
    .select('id')
    .single();

  if (createdEventError || !createdEvent) {
    console.error('[Yoco Webhook] Could not record webhook event.', {
      webhookId,
      orderReference,
      error: createdEventError?.message,
    });
    return new NextResponse(createdEventError?.message ?? 'Could not record webhook event', {
      status: 500,
    });
  }

  const orderLookup = isUuid(orderReference)
    ? supabase
        .from('orders')
        .select(
          'id, order_number, user_id, customer_email, promo_code_id, promo_discount_cents, delivery_fee_cents, total_cents, payment_status'
        )
        .eq('id', orderReference)
        .single()
    : supabase
        .from('orders')
        .select(
          'id, order_number, user_id, customer_email, promo_code_id, promo_discount_cents, delivery_fee_cents, total_cents, payment_status'
        )
        .eq('order_number', orderReference)
        .single();

  const { data: order, error: orderError } = await orderLookup;

  if (orderError || !order) {
    // Not an order — curtain quote payments send metadata.orderId set to the
    // curtain quote id, so check for a quote payment before giving up.
    const quoteAmount = firstNumber(payload, [
      ['amount'],
      ['data', 'amount'],
      ['data', 'payment_amount'],
      ['data', 'amount_cents'],
    ]);

    const quoteResult = await processCurtainQuotePaymentWebhook({
      supabase,
      provider: 'yoco',
      providerStatus,
      quoteId: isUuid(orderReference) ? orderReference : '',
      amountCents: quoteAmount ?? 0,
      paymentReference: firstString(payload, [
        ['data', 'id'],
        ['paymentId'],
        ['data', 'paymentId'],
      ]) ?? '',
      webhookEventId: createdEvent.id,
    });

    if (quoteResult !== 'not_found') {
      return new NextResponse('OK', { status: 200 });
    }

    console.warn('[Yoco Webhook] Order not found for webhook event.', {
      webhookId,
      orderReference,
      error: orderError?.message,
    });

    await supabase
      .from('payment_webhook_events')
      .update({
        processing_status: 'ignored',
        processed_at: new Date().toISOString(),
        error_message: orderError?.message ?? 'Order not found',
      })
      .eq('id', createdEvent.id);

    return new NextResponse('OK', { status: 200 });
  }

  const nowIso = new Date().toISOString();
  const paymentStatus =
    order.payment_status === 'paid' && providerStatus !== 'failed' ? 'paid' : providerStatus;
  const isFirstPaidTransition = paymentStatus === 'paid' && order.payment_status !== 'paid';
  let resolvedUserId = order.user_id;

  if (paymentStatus === 'paid' && !resolvedUserId) {
    const matchedUserId = await findAuthUserIdByEmail(supabase, order.customer_email);

    if (matchedUserId) {
      const linkedCount = await linkGuestOrdersToUserByEmail(
        supabase,
        matchedUserId,
        order.customer_email
      );
      console.info('[Yoco Webhook] Linked guest orders to authenticated user.', {
        orderId: order.id,
        matchedUserId,
        linkedCount,
      });
      resolvedUserId = matchedUserId;
    } else {
      console.info('[Yoco Webhook] No auth user found for order email during linking.', {
        orderId: order.id,
      });
    }
  }

  const amountCents = Math.max(0, toCents(payload)) || order.total_cents;
  const transactionStatus =
    paymentStatus === 'paid' ? 'succeeded' : paymentStatus === 'failed' ? 'failed' : 'pending';
  const idempotencyKey = gatewayTransactionId
    ? `yoco:tx:${gatewayTransactionId}`
    : `yoco:webhook:${webhookId}`;

  const { data: existingTransactionByKey } = await supabase
    .from('payment_transactions')
    .select('id, attempted_at')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  let existingTransaction = existingTransactionByKey;

  if (!existingTransaction?.id && gatewayTransactionId) {
    const { data: existingTransactionByGateway } = await supabase
      .from('payment_transactions')
      .select('id, attempted_at')
      .eq('gateway', 'yoco')
      .eq('gateway_transaction_id', gatewayTransactionId)
      .maybeSingle();

    existingTransaction = existingTransactionByGateway;
  }

  if (existingTransaction?.id) {
    const { error: transactionUpdateError } = await supabase
      .from('payment_transactions')
      .update({
        status: transactionStatus,
        amount_cents: amountCents,
        gateway_response: payload,
        error_message: paymentStatus === 'failed' ? 'Yoco marked payment as failed.' : null,
        attempted_at: existingTransaction.attempted_at ?? nowIso,
        completed_at: paymentStatus === 'pending' ? null : nowIso,
      })
      .eq('id', existingTransaction.id);

    if (transactionUpdateError) {
      console.error('[Yoco Webhook] Could not update transaction record.', {
        webhookId,
        orderId: order.id,
        transactionId: existingTransaction.id,
        error: transactionUpdateError.message,
      });

      await supabase
        .from('payment_webhook_events')
        .update({
          processing_status: 'failed',
          processed_at: nowIso,
          error_message: transactionUpdateError.message,
          related_order_id: order.id,
        })
        .eq('id', createdEvent.id);

      return new NextResponse(transactionUpdateError.message, { status: 500 });
    }

    console.info('[Yoco Webhook] Reconciled existing payment transaction.', {
      webhookId,
      orderId: order.id,
      transactionId: existingTransaction.id,
      transactionStatus,
    });
  } else {
    const { error: transactionError } = await supabase.from('payment_transactions').insert({
      order_id: order.id,
      gateway: 'yoco',
      transaction_type: 'sale',
      status: transactionStatus,
      amount_cents: amountCents,
      gateway_transaction_id: gatewayTransactionId,
      idempotency_key: idempotencyKey,
      gateway_response: payload,
      error_message: paymentStatus === 'failed' ? 'Yoco marked payment as failed.' : null,
      attempted_at: nowIso,
      completed_at: paymentStatus === 'pending' ? null : nowIso,
    });

    if (transactionError) {
      console.error('[Yoco Webhook] Could not insert transaction record.', {
        webhookId,
        orderId: order.id,
        error: transactionError.message,
      });

      await supabase
        .from('payment_webhook_events')
        .update({
          processing_status: 'failed',
          processed_at: nowIso,
          error_message: transactionError.message,
          related_order_id: order.id,
        })
        .eq('id', createdEvent.id);

      return new NextResponse(transactionError.message, { status: 500 });
    }

    console.info('[Yoco Webhook] Recorded new payment transaction.', {
      webhookId,
      orderId: order.id,
      transactionStatus,
    });
  }

  const paymentSessionId = firstString(payload, [
    ['checkoutId'],
    ['checkout_id'],
    ['sessionId'],
    ['session_id'],
    ['data', 'checkoutId'],
    ['data', 'checkout_id'],
    ['data', 'sessionId'],
    ['data', 'session_id'],
  ]);

  const { error: orderUpdateError } = await supabase
    .from('orders')
    .update({
      user_id: resolvedUserId,
      payment_method: 'yoco',
      gateway_provider: 'yoco',
      payment_status: paymentStatus,
      payment_session_id: paymentSessionId,
      gateway_transaction_id: gatewayTransactionId,
      payment_error_message: paymentStatus === 'failed' ? 'Yoco marked the payment as failed.' : null,
      payment_received_at: paymentStatus === 'paid' ? nowIso : null,
      payment_settled_at: paymentStatus === 'paid' ? nowIso : null,
      remaining_balance_cents: paymentStatus === 'paid' ? 0 : order.total_cents,
    })
    .eq('id', order.id);

  if (orderUpdateError) {
    console.error('[Yoco Webhook] Could not update order payment fields.', {
      webhookId,
      orderId: order.id,
      error: orderUpdateError.message,
    });

    await supabase
      .from('payment_webhook_events')
      .update({
        processing_status: 'failed',
        processed_at: nowIso,
        error_message: orderUpdateError.message,
        related_order_id: order.id,
      })
      .eq('id', createdEvent.id);

    return new NextResponse(orderUpdateError.message, { status: 500 });
  }

  if (paymentStatus === 'paid' && order.promo_code_id) {
    const { data: redemption } = await supabase
      .from('promo_code_redemptions')
      .select('id')
      .eq('order_id', order.id)
      .eq('promo_code_id', order.promo_code_id)
      .maybeSingle();

    if (!redemption?.id) {
      const { data: promoCode } = await supabase
        .from('promo_codes')
        .select('id, code, times_used')
        .eq('id', order.promo_code_id)
        .maybeSingle();

      if (promoCode?.id) {
        const subtotalCents = Math.max(
          0,
          order.total_cents - order.delivery_fee_cents + order.promo_discount_cents
        );

        const { error: insertRedemptionError } = await supabase.from('promo_code_redemptions').insert({
          promo_code_id: promoCode.id,
          order_id: order.id,
          user_id: resolvedUserId,
          code_snapshot: promoCode.code,
          subtotal_cents: subtotalCents,
          discount_cents: order.promo_discount_cents,
        });

        if (!insertRedemptionError) {
          await supabase
            .from('promo_codes')
            .update({ times_used: (promoCode.times_used ?? 0) + 1 })
            .eq('id', promoCode.id);
        }
      }
    }
  }

  if (isFirstPaidTransition) {
    try {
      const stockResult = await applyPaidOrderStockDecrement({
        supabase,
        orderId: order.id,
        source: 'yoco_webhook',
      });

      console.info('[Yoco Webhook] Applied stock decrement for first paid transition.', {
        webhookId,
        orderId: order.id,
        ...stockResult,
      });
    } catch (stockError) {
      const errorMessage = stockError instanceof Error ? stockError.message : 'Stock decrement failed.';
      console.error('[Yoco Webhook] Could not decrement stock for paid order.', {
        webhookId,
        orderId: order.id,
        error: errorMessage,
      });

      await supabase
        .from('payment_webhook_events')
        .update({
          processing_status: 'failed',
          processed_at: nowIso,
          related_order_id: order.id,
          error_message: errorMessage,
        })
        .eq('id', createdEvent.id);

      return new NextResponse(errorMessage, { status: 500 });
    }
  }

  await supabase
    .from('payment_webhook_events')
    .update({
      processing_status: 'processed',
      processed_at: nowIso,
      related_order_id: order.id,
      processor_attempt_count: 1,
      error_message: null,
    })
    .eq('id', createdEvent.id);

  console.info('[Yoco Webhook] Processed successfully.', {
    webhookId,
    orderId: order.id,
    paymentStatus,
  });

  return new NextResponse('OK', { status: 200 });
}
