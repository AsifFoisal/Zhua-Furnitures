import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('curtain_quotes')
    .select('id, reference, user_id, full_name, email, phone, city, notes, configuration, estimated_total, status, admin_notes, final_total, final_line_items, quote_message, payment_status, payment_provider, payment_reference, quote_sent_at, paid_at, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const quotes = (data ?? []).map((row) => ({
    id: row.id,
    reference: row.reference,
    userId: row.user_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    notes: row.notes,
    configuration: row.configuration,
    estimatedTotal: Number(row.estimated_total ?? 0),
    status: row.status,
    adminNotes: row.admin_notes,
    finalTotal: row.final_total === null ? null : Number(row.final_total),
    finalLineItems: row.final_line_items,
    quoteMessage: row.quote_message,
    paymentStatus: row.payment_status,
    paymentProvider: row.payment_provider,
    paymentReference: row.payment_reference,
    quoteSentAt: row.quote_sent_at,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return NextResponse.json({ quotes });
}
