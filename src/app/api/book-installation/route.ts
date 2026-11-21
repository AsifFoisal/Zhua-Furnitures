import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasResendEnv, hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { getOptionalUser } from '@/lib/auth';
import { sendAdminInstallationBookingNotification } from '@/lib/installation-notifications';

export const dynamic = 'force-dynamic';

type BookingPayload = {
  productId?: string;
  productName?: string;
  address?: string;
  preferredDate?: string;
  preferredSlot?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
};

export async function POST(request: Request) {
  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase service role key is missing.' }, { status: 503 });
  }

  const payload = (await request.json()) as BookingPayload;
  const productId = String(payload.productId ?? '').trim();
  const productName = String(payload.productName ?? '').trim();
  const address = String(payload.address ?? '').trim();
  const preferredDate = String(payload.preferredDate ?? '').trim();
  const preferredSlot = String(payload.preferredSlot ?? '').trim();
  const customerName = String(payload.customerName ?? '').trim();
  const customerEmail = String(payload.customerEmail ?? '').trim().toLowerCase();
  const customerPhone = String(payload.customerPhone ?? '').trim();
  const notes = String(payload.notes ?? '').trim();

  if (!productName || !address || !preferredDate || !preferredSlot || !customerName || !customerEmail || !customerPhone) {
    return NextResponse.json({ error: 'Please complete all required booking fields.' }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
    return NextResponse.json({ error: 'Preferred date is invalid.' }, { status: 400 });
  }

  if (!customerEmail.includes('@')) {
    return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }

  const userId = (await getOptionalUser())?.id ?? null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('installation_bookings')
    .insert({
      user_id: userId,
      product_id: productId || null,
      product_name: productName,
      address,
      preferred_date: preferredDate,
      preferred_slot: preferredSlot,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      notes: notes || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    return NextResponse.json({ error: error?.message ?? 'Could not create booking.' }, { status: 500 });
  }

  if (hasResendEnv) {
    try {
      await sendAdminInstallationBookingNotification({
        bookingId: data.id,
        productName,
        address,
        preferredDate,
        preferredSlot,
        customerName,
        customerEmail,
        customerPhone,
        notes,
      });
    } catch (notificationError) {
      console.error('[Book Installation API] Failed to send admin booking email.', {
        bookingId: data.id,
        error:
          notificationError instanceof Error
            ? notificationError.message
            : 'Unknown notification error',
      });
    }
  } else {
    console.warn('[Book Installation API] RESEND_API_KEY/RESEND_FROM_EMAIL missing; booking email skipped.', {
      bookingId: data.id,
    });
  }

  return NextResponse.json({ id: data.id, success: true });
}
