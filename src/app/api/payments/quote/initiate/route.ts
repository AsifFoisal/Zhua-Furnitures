import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  getPayFastEnv,
  getYocoEnv,
  hasPayFastEnv,
  hasServiceSupabaseEnv,
  hasYocoEnv,
} from '@/lib/supabase/env';
import {
  generatePayFastSignature,
  getPayFastProcessUrl,
  PAYFAST_LIVE_MINIMUM_AMOUNT_CENTS,
} from '@/lib/payments/payfast';
import { getYocoCheckoutApiUrl, parseYocoCheckoutResponse } from '@/lib/payments/yoco';
import { getSiteUrl } from '@/lib/supabase/site-url';

export const dynamic = 'force-dynamic';

type QuotePaymentRow = {
  id: string;
  reference: string;
  full_name: string;
  email: string;
  final_total: number | null;
  payment_token: string;
  payment_status: string;
  status: string;
};

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

export async function POST(request: Request) {
  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase service role key is missing.' }, { status: 503 });
  }

  let payload: { reference?: string; token?: string; provider?: string };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: 'Invalid payment initiation payload.' }, { status: 400 });
  }

  const reference = String(payload.reference ?? '').trim();
  const token = String(payload.token ?? '').trim();
  const provider = String(payload.provider ?? '').trim().toLowerCase();

  if (!reference || !token || (provider !== 'payfast' && provider !== 'yoco')) {
    return NextResponse.json({ error: 'A valid quote reference, token, and payment provider are required.' }, { status: 400 });
  }

  if (provider === 'payfast' && !hasPayFastEnv) {
    return NextResponse.json({ error: 'PayFast is not configured.' }, { status: 503 });
  }

  if (provider === 'yoco' && !hasYocoEnv) {
    return NextResponse.json({ error: 'Yoco is not configured.' }, { status: 503 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: quote, error: quoteError } = await supabase
    .from('curtain_quotes')
    .select('id, reference, full_name, email, final_total, payment_token, payment_status, status')
    .eq('reference', reference)
    .maybeSingle() as { data: QuotePaymentRow | null; error: { message: string } | null };

  if (quoteError || !quote) {
    return NextResponse.json({ error: 'Quote not found.' }, { status: 404 });
  }

  if (!quote.payment_token || quote.payment_token !== token) {
    return NextResponse.json({ error: 'This payment link is not valid.' }, { status: 403 });
  }

  if (quote.payment_status === 'paid') {
    return NextResponse.json({ error: 'This quote has already been paid.' }, { status: 400 });
  }

  const finalTotalCents = Math.round(Number(quote.final_total ?? 0) * 100);
  if (quote.status !== 'quoted' || !Number.isFinite(finalTotalCents) || finalTotalCents <= 0) {
    return NextResponse.json({ error: 'The final quotation for this enquiry has not been confirmed yet.' }, { status: 400 });
  }

  const siteUrl = getSiteUrl(request.headers);
  const paymentPageParams = `ref=${encodeURIComponent(quote.reference)}&token=${encodeURIComponent(token)}`;

  if (provider === 'payfast') {
    const payfastEnv = getPayFastEnv();

    if (payfastEnv.mode === 'live' && finalTotalCents < PAYFAST_LIVE_MINIMUM_AMOUNT_CENTS) {
      const minimum = (PAYFAST_LIVE_MINIMUM_AMOUNT_CENTS / 100).toFixed(2);
      return NextResponse.json(
        { error: `PayFast live payments require a minimum amount of R ${minimum}.` },
        { status: 400 }
      );
    }

    const names = getNameParts(quote.full_name);
    const fields: Record<string, string> = {
      merchant_id: payfastEnv.merchantId,
      merchant_key: payfastEnv.merchantKey,
      return_url: `${siteUrl}/quote-payment?${paymentPageParams}&payment=success`,
      cancel_url: `${siteUrl}/quote-payment?${paymentPageParams}&payment=cancelled`,
      notify_url: payfastEnv.notifyUrl,
      name_first: names.firstName,
      name_last: names.lastName,
      email_address: quote.email,
      m_payment_id: quote.id,
      amount: (finalTotalCents / 100).toFixed(2),
      item_name: `Curtain quote ${quote.reference}`,
      custom_str1: quote.reference,
    };

    const signature = generatePayFastSignature(fields, payfastEnv.passphrase);

    await supabase
      .from('curtain_quotes')
      .update({ payment_provider: 'payfast' })
      .eq('id', quote.id);

    return NextResponse.json({
      formAction: getPayFastProcessUrl(payfastEnv.mode),
      fields: { ...fields, signature },
    });
  }

  const yocoEnv = getYocoEnv();
  const successUrl = `${siteUrl}/quote-payment?${paymentPageParams}&payment=success`;
  const cancelUrl = `${siteUrl}/quote-payment?${paymentPageParams}&payment=cancelled`;

  let yocoResponse: Response;
  try {
    yocoResponse = await fetch(getYocoCheckoutApiUrl(yocoEnv.mode), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${yocoEnv.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: finalTotalCents,
        currency: 'ZAR',
        successUrl,
        cancelUrl,
        failureUrl: cancelUrl,
        metadata: {
          orderId: quote.id,
          kind: 'curtain_quote',
          quoteReference: quote.reference,
        },
        reference: quote.reference,
      }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'Could not connect to Yoco.' }, { status: 502 });
  }

  const responseText = await yocoResponse.text();
  let responseJson: unknown = {};

  if (responseText) {
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = {};
    }
  }

  if (!yocoResponse.ok) {
    const message =
      typeof responseJson === 'object' && responseJson !== null && 'message' in responseJson
        ? String((responseJson as { message?: string }).message ?? '').trim()
        : '';

    return NextResponse.json(
      { error: message || 'Could not initialize Yoco checkout.' },
      { status: 502 }
    );
  }

  const checkout = parseYocoCheckoutResponse(responseJson);
  if (!checkout.redirectUrl) {
    return NextResponse.json({ error: 'Yoco checkout URL is missing.' }, { status: 502 });
  }

  await supabase
    .from('curtain_quotes')
    .update({ payment_provider: 'yoco' })
    .eq('id', quote.id);

  return NextResponse.json({ redirectUrl: checkout.redirectUrl });
}
