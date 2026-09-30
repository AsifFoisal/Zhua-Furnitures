import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  sendAdminQuotePaymentNotification,
} from '@/lib/curtain-quote-notifications';

export type QuotePaymentWebhookResult = 'not_found' | 'processed' | 'ignored';

type QuotePaymentWebhookInput = {
  supabase: SupabaseClient;
  provider: 'payfast' | 'yoco';
  /** Already-mapped gateway status, e.g. 'paid' | 'failed' | 'pending'. */
  providerStatus: string;
  /** curtain_quotes.id taken from m_payment_id / metadata.orderId. */
  quoteId: string;
  /** Amount reported by the gateway, in cents. */
  amountCents: number;
  /** Gateway payment reference (pf_payment_id / Yoco session id). */
  paymentReference: string;
  /** payment_webhook_events.id already recorded for this delivery. */
  webhookEventId: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function markWebhookEvent(
  supabase: SupabaseClient,
  webhookEventId: string,
  processingStatus: 'processed' | 'ignored',
  errorMessage?: string
): Promise<void> {
  await supabase
    .from('payment_webhook_events')
    .update({
      processing_status: processingStatus,
      processed_at: new Date().toISOString(),
      error_message: errorMessage ?? null,
    })
    .eq('id', webhookEventId);
}

/**
 * Handles a gateway webhook that did not match an order. Quote payments reuse
 * the same gateway accounts, so this checks whether the reference belongs to a
 * curtain quote and, when a valid paid event arrives for the confirmed amount,
 * marks the quote as paid and notifies the admin inbox.
 */
export async function processCurtainQuotePaymentWebhook(
  input: QuotePaymentWebhookInput
): Promise<QuotePaymentWebhookResult> {
  const { supabase, provider, providerStatus, quoteId, amountCents, paymentReference, webhookEventId } = input;

  if (!isUuid(quoteId)) {
    return 'not_found';
  }

  const { data: quote, error: quoteError } = await supabase
    .from('curtain_quotes')
    .select('id, reference, full_name, email, phone, final_total, payment_status, status')
    .eq('id', quoteId)
    .maybeSingle();

  if (quoteError || !quote) {
    return 'not_found';
  }

  if (providerStatus !== 'paid') {
    await markWebhookEvent(supabase, webhookEventId, 'ignored', `Quote payment status: ${providerStatus}`);
    if (providerStatus === 'failed' && quote.payment_status !== 'paid') {
      try {
        await sendAdminQuotePaymentNotification({
          event: 'failed',
          reference: quote.reference,
          customerName: quote.full_name,
          customerEmail: quote.email,
          customerPhone: quote.phone,
          total: Math.round(Number(quote.final_total ?? 0)),
          provider,
          paymentReference,
        });
      } catch (err) {
        console.error('Could not send curtain quote payment-failure notification:', err);
      }
    }
    return 'ignored';
  }

  const expectedCents = Math.round(Number(quote.final_total ?? 0) * 100);
  const amountMatches =
    expectedCents > 0 &&
    (amountCents === expectedCents || amountCents === Math.round(expectedCents / 100));

  if (!amountMatches) {
    await markWebhookEvent(
      supabase,
      webhookEventId,
      'ignored',
      `Curtain quote ${quote.reference}: amount mismatch (received ${amountCents}, expected ${expectedCents})`
    );
    return 'ignored';
  }

  if (quote.payment_status === 'paid') {
    await markWebhookEvent(supabase, webhookEventId, 'processed');
    return 'processed';
  }

  const { error: updateError } = await supabase
    .from('curtain_quotes')
    .update({
      payment_status: 'paid',
      payment_provider: provider,
      payment_reference: paymentReference,
      paid_at: new Date().toISOString(),
      status: 'won',
    })
    .eq('id', quote.id);

  if (updateError) {
    await markWebhookEvent(supabase, webhookEventId, 'ignored', updateError.message);
    return 'ignored';
  }

  await markWebhookEvent(supabase, webhookEventId, 'processed');

  try {
    await sendAdminQuotePaymentNotification({
      event: 'received',
      reference: quote.reference,
      customerName: quote.full_name,
      customerEmail: quote.email,
      customerPhone: quote.phone,
      total: Math.round(Number(quote.final_total ?? 0)),
      provider,
      paymentReference,
    });
  } catch (err) {
    console.error('Could not send curtain quote payment notification:', err);
  }

  return 'processed';
}
