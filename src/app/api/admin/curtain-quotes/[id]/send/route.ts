import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasResendEnv } from '@/lib/supabase/env';
import { getCanonicalSiteUrl } from '@/lib/site-url';
import { sendCustomerFinalQuote } from '@/lib/curtain-quote-notifications';

export const dynamic = 'force-dynamic';

type FinalQuoteLine = { label: string; amount: number };

function parseFinalLineItems(value: unknown): FinalQuoteLine[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as { label?: unknown; amount?: unknown };
      const label = String(record.label ?? '').trim();
      const amount = Number(record.amount);
      if (!label || !Number.isFinite(amount) || amount < 0) return null;
      return { label, amount: Math.round(amount) };
    })
    .filter((item): item is FinalQuoteLine => item !== null);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  if (!hasResendEnv) {
    return NextResponse.json({ error: 'Resend is not configured.' }, { status: 503 });
  }

  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: quote, error: quoteError } = await supabase
    .from('curtain_quotes')
    .select('id, reference, full_name, email, phone, final_total, final_line_items, quote_message, payment_token, payment_status, status')
    .eq('id', id)
    .maybeSingle();

  if (quoteError || !quote) {
    return NextResponse.json({ error: quoteError?.message ?? 'Quote not found.' }, { status: 404 });
  }

  if (quote.payment_status === 'paid') {
    return NextResponse.json({ error: 'This quote has already been paid.' }, { status: 400 });
  }

  const finalTotal = Math.round(Number(quote.final_total ?? 0));
  if (!Number.isFinite(finalTotal) || finalTotal <= 0) {
    return NextResponse.json(
      { error: 'Set a final total before sending the quotation to the customer.' },
      { status: 400 }
    );
  }

  const lines = parseFinalLineItems(quote.final_line_items);

  // Reuse the stored token so links already shared stay valid; mint a fresh
  // token on first send (or after a re-confirmation) so the link is not
  // guessable from the reference alone.
  const paymentToken = quote.payment_token || randomBytes(24).toString('hex');
  const paymentUrl = `${getCanonicalSiteUrl()}/quote-payment?ref=${encodeURIComponent(quote.reference)}&token=${paymentToken}`;

  try {
    await sendCustomerFinalQuote({
      reference: quote.reference,
      customerName: quote.full_name,
      customerEmail: quote.email,
      lines: lines.length > 0 ? lines : [{ label: 'Confirmed quotation', amount: finalTotal }],
      total: finalTotal,
      message: quote.quote_message ?? '',
      paymentUrl,
    });
  } catch (err) {
    console.error('Could not send final curtain quote email:', err);
    return NextResponse.json({ error: 'Could not send the quotation email. Please try again.' }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from('curtain_quotes')
    .update({
      payment_token: paymentToken,
      status: quote.status === 'quoted' || quote.status === 'won' ? quote.status : 'quoted',
      quote_sent_at: new Date().toISOString(),
    })
    .eq('id', quote.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, paymentUrl });
}
