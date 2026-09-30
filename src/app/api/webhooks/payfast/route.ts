import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  getPayFastEnv,
  hasPayFastEnv,
  hasResendEnv,
  hasServiceSupabaseEnv,
} from '@/lib/supabase/env';
import { findAuthUserIdByEmail, linkGuestOrdersToUserByEmail } from '@/lib/order-linking';
import {
  mapPayFastPaymentStatus,
  verifyPayFastSignature,
} from '@/lib/payments/payfast';
import { applyPaidOrderStockDecrement } from '@/lib/inventory';
import { sendAdminNewOrderNotification } from '@/lib/order-notifications';
import { processCurtainQuotePaymentWebhook } from '@/lib/quote-payments';

export const dynamic = 'force-dynamic';

function toCents(value: string): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.max(0, Math.round(amount * 100));
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request) {
  if (!hasServiceSupabaseEnv || !hasPayFastEnv) {
    console.error('[PayFast Webhook] Missing required environment configuration.');
    return new NextResponse('Configuration missing', { status: 503 });
  }

  const payfastEnv = getPayFastEnv();
  const raw = await request.text();
  const params = new URLSearchParams(raw);

  const payload: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    payload[key] = value;
  }

  const orderId = String(payload.m_payment_id ?? '').trim();
  const payfastPaymentId = String(payload.pf_payment_id ?? '').trim();
  const providerStatus = mapPayFastPaymentStatus(String(payload.payment_status ?? ''));

  if (!orderId) {
    console.warn('[PayFast Webhook] Missing order reference in payload.');
    return new NextResponse('Missing order reference', { status: 400 });
  }

  if (!verifyPayFastSignature(payload, payfastEnv.passphrase)) {
    console.warn('[PayFast Webhook] Invalid signature.', {
      orderId,
      payfastPaymentId,
      providerStatus,
    });
    return new NextResponse('Invalid signature', { status: 400 });
  }

  const webhookId = `${orderId}:${payfastPaymentId || 'none'}:${providerStatus}`;
  const supabase = createSupabaseAdminClient();

  const { data: existingEvent } = await supabase
    .from('payment_webhook_events')
    .select('id')
    .eq('gateway', 'payfast')
    .eq('webhook_id', webhookId)
    .maybeSingle();

  if (existingEvent?.id) {
    console.info('[PayFast Webhook] Duplicate event received; skipping.', {
      webhookId,
      orderId,
    });
    return new NextResponse('OK', { status: 200 });
  }

  const { data: createdEvent, error: createdEventError } = await supabase
    .from('payment_webhook_events')
    .insert({
      gateway: 'payfast',
      webhook_id: webhookId,
      event_type: String(payload.payment_status ?? 'unknown'),
      related_order_id: isUuid(orderId) ? orderId : null,
      processing_status: 'received',
      payload,
    })
    .select('id')
    .single();

  if (createdEventError || !createdEvent) {
    console.error('[PayFast Webhook] Could not record webhook event.', {
      webhookId,
      orderId,
      error: createdEventError?.message,
    });
    return new NextResponse(createdEventError?.message ?? 'Could not record webhook event', {
      status: 500,
    });
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(
      'id, order_number, user_id, customer_name, customer_email, customer_phone, address, city, province, postal_code, delivery_type, payment_method, gateway_provider, promo_code_id, promo_discount_cents, delivery_fee_cents, total_cents, payment_status'
    )
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    // Not an order — curtain quote payments reuse the same PayFast account and
    // notify URL, with m_payment_id set to the curtain quote id.
    const quoteResult = await processCurtainQuotePaymentWebhook({
      supabase,
      provider: 'payfast',
      providerStatus,
      quoteId: orderId,
      amountCents: toCents(payload.amount ?? '0'),
      paymentReference: payfastPaymentId,
      webhookEventId: createdEvent.id,
    });

    if (quoteResult !== 'not_found') {
      return new NextResponse('OK', { status: 200 });
    }

    console.warn('[PayFast Webhook] Order not found for webhook event.', {
      webhookId,
      orderId,
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
      console.info('[PayFast Webhook] Linked guest orders to authenticated user.', {
        orderId: order.id,
        matchedUserId,
        linkedCount,
      });
      resolvedUserId = matchedUserId;
    } else {
      console.info('[PayFast Webhook] No auth user found for order email during linking.', {
        orderId: order.id,
      });
    }
  }

  const amountCents = toCents(String(payload.amount_gross ?? '0'));
  const transactionStatus =
    paymentStatus === 'paid' ? 'succeeded' : paymentStatus === 'failed' ? 'failed' : 'pending';
  const idempotencyKey = payfastPaymentId
    ? `payfast:tx:${payfastPaymentId}`
    : `payfast:webhook:${webhookId}`;

  const { data: existingTransactionByKey } = await supabase
    .from('payment_transactions')
    .select('id, attempted_at')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  let existingTransaction = existingTransactionByKey;

  if (!existingTransaction?.id && payfastPaymentId) {
    const { data: existingTransactionByGateway } = await supabase
      .from('payment_transactions')
      .select('id, attempted_at')
      .eq('gateway', 'payfast')
      .eq('gateway_transaction_id', payfastPaymentId)
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
        error_message: paymentStatus === 'failed' ? 'PayFast marked payment as failed.' : null,
        attempted_at: existingTransaction.attempted_at ?? nowIso,
        completed_at: paymentStatus === 'pending' ? null : nowIso,
      })
      .eq('id', existingTransaction.id);

    if (transactionUpdateError) {
      console.error('[PayFast Webhook] Could not update transaction record.', {
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

    console.info('[PayFast Webhook] Reconciled existing payment transaction.', {
      webhookId,
      orderId: order.id,
      transactionId: existingTransaction.id,
      transactionStatus,
    });
  } else {
    const { error: transactionError } = await supabase.from('payment_transactions').insert({
      order_id: order.id,
      gateway: 'payfast',
      transaction_type: 'sale',
      status: transactionStatus,
      amount_cents: amountCents,
      gateway_transaction_id: payfastPaymentId || null,
      idempotency_key: idempotencyKey,
      gateway_response: payload,
      error_message: paymentStatus === 'failed' ? 'PayFast marked payment as failed.' : null,
      attempted_at: nowIso,
      completed_at: paymentStatus === 'pending' ? null : nowIso,
    });

    if (transactionError) {
      console.error('[PayFast Webhook] Could not insert transaction record.', {
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

    console.info('[PayFast Webhook] Recorded new payment transaction.', {
      webhookId,
      orderId: order.id,
      transactionStatus,
    });
  }

  const { error: orderUpdateError } = await supabase
    .from('orders')
    .update({
      user_id: resolvedUserId,
      payment_method: 'payfast',
      gateway_provider: 'payfast',
      payment_reference: order.order_number,
      payment_status: paymentStatus,
      gateway_transaction_id: payfastPaymentId || null,
      payment_error_message:
        paymentStatus === 'failed' ? 'PayFast marked the payment as failed.' : null,
      payment_received_at: paymentStatus === 'paid' ? nowIso : null,
      payment_settled_at: paymentStatus === 'paid' ? nowIso : null,
      remaining_balance_cents: paymentStatus === 'paid' ? 0 : order.total_cents,
    })
    .eq('id', order.id);

  if (orderUpdateError) {
    console.error('[PayFast Webhook] Could not update order payment fields.', {
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
        source: 'payfast_webhook',
      });

      console.info('[PayFast Webhook] Applied stock decrement for first paid transition.', {
        webhookId,
        orderId: order.id,
        ...stockResult,
      });
    } catch (stockError) {
      const errorMessage = stockError instanceof Error ? stockError.message : 'Stock decrement failed.';
      console.error('[PayFast Webhook] Could not decrement stock for paid order.', {
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

    if (hasResendEnv) {
      try {
        const { data: orderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .select(
            'product_name, quantity, unit_price_cents, selected_color, selected_size, selected_fabric, custom_note'
          )
          .eq('order_id', order.id);

        if (orderItemsError) {
          throw new Error(orderItemsError.message);
        }

        let promoCode: string | null = null;
        if (order.promo_code_id) {
          const { data: promoRow } = await supabase
            .from('promo_codes')
            .select('code')
            .eq('id', order.promo_code_id)
            .maybeSingle();
          promoCode = promoRow?.code ?? null;
        }

        const items = (orderItems ?? []).map((item) => ({
          productName: item.product_name,
          quantity: item.quantity,
          unitPriceCents: item.unit_price_cents,
          selectedColor: item.selected_color,
          selectedSize: item.selected_size,
          selectedFabric: item.selected_fabric,
          customNote: item.custom_note,
        }));

        const subtotalCents = Math.max(
          0,
          order.total_cents - order.delivery_fee_cents + order.promo_discount_cents
        );

        await sendAdminNewOrderNotification({
          event: 'paid',
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone,
          address: order.address,
          city: order.city,
          province: order.province,
          postalCode: order.postal_code,
          deliveryType: order.delivery_type,
          paymentMethod: order.gateway_provider || order.payment_method || 'payfast',
          paymentStatus: 'paid',
          subtotalCents,
          deliveryFeeCents: order.delivery_fee_cents,
          discountCents: order.promo_discount_cents,
          promoCode,
          totalCents: order.total_cents,
          items,
        });
      } catch (notificationError) {
        console.error('[PayFast Webhook] Failed to send admin paid-order email.', {
          webhookId,
          orderId: order.id,
          orderNumber: order.order_number,
          error:
            notificationError instanceof Error
              ? notificationError.message
              : 'Unknown notification error',
        });
      }
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

  console.info('[PayFast Webhook] Processed successfully.', {
    webhookId,
    orderId: order.id,
    paymentStatus,
  });

  return new NextResponse('OK', { status: 200 });
}
