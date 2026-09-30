import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type CurtainQuoteStatus = 'new' | 'reviewing' | 'quoted' | 'won' | 'lost' | 'archived';

function parseQuoteStatus(value: string): CurtainQuoteStatus {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'new' ||
    normalized === 'reviewing' ||
    normalized === 'quoted' ||
    normalized === 'won' ||
    normalized === 'lost' ||
    normalized === 'archived'
  ) {
    return normalized;
  }

  return 'new';
}

function parseLineItems(value: unknown): { label: string; amount: number }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const label = String((item as { label?: unknown }).label ?? '').trim().slice(0, 200);
      const amount = Number((item as { amount?: unknown }).amount);
      if (!label || !Number.isFinite(amount) || amount < 0) return null;
      return { label, amount: Math.round(amount) };
    })
    .filter((item): item is { label: string; amount: number } => item !== null)
    .slice(0, 40);
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
    status?: string;
    finalTotal?: number;
    finalLineItems?: unknown;
    quoteMessage?: string;
  };

  const update: Record<string, unknown> = {};

  if (payload.status !== undefined) {
    update.status = parseQuoteStatus(String(payload.status));
  }

  if (payload.finalTotal !== undefined) {
    const finalTotal = Number(payload.finalTotal);
    if (!Number.isFinite(finalTotal) || finalTotal < 0) {
      return NextResponse.json({ error: 'Final total must be a positive number.' }, { status: 400 });
    }
    update.final_total = Math.round(finalTotal);
  }

  if (payload.finalLineItems !== undefined) {
    update.final_line_items = parseLineItems(payload.finalLineItems);
  }

  if (payload.quoteMessage !== undefined) {
    update.quote_message = String(payload.quoteMessage ?? '').trim().slice(0, 2000);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('curtain_quotes')
    .update(update)
    .eq('id', id)
    .select('id, reference, full_name, email, status, final_total, final_line_items, quote_message, payment_status, payment_provider, payment_reference, paid_at, quote_sent_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not update quote.' }, { status: 500 });
  }

  return NextResponse.json({
    quote: {
      id: data.id,
      reference: data.reference,
      fullName: data.full_name,
      email: data.email,
      status: data.status,
      finalTotal: data.final_total === null ? null : Number(data.final_total),
      finalLineItems: data.final_line_items,
      quoteMessage: data.quote_message,
      paymentStatus: data.payment_status,
      paymentProvider: data.payment_provider,
      paymentReference: data.payment_reference,
      paidAt: data.paid_at,
      quoteSentAt: data.quote_sent_at,
    },
  });
}
