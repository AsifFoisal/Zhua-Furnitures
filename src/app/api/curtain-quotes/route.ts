import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { getOptionalUser } from '@/lib/auth';
import { sendAdminCurtainQuoteNotification, type CurtainQuoteEstimateLine } from '@/lib/curtain-quote-notifications';

export const dynamic = 'force-dynamic';

type CurtainQuoteConfig = {
  widthCm?: number;
  dropCm?: number;
  windows?: number;
  panelsPerWindow?: number;
  heading?: string;
  fabric?: string;
  fabricPricePerMetre?: number;
  colour?: string;
  layers?: string;
  lining?: string;
  trackType?: string;
  trackCount?: string;
  motorised?: boolean;
  installation?: string;
  totalFabricMetres?: number;
  trackLengthPerWindow?: number;
  estimateLines?: CurtainQuoteEstimateLine[];
  estimateTotal?: number;
};

type CurtainQuotePayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  city?: string;
  notes?: string;
  configuration?: CurtainQuoteConfig;
};

function buildQuoteReference(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CQ-${stamp}${random}`;
}

export async function POST(request: Request) {
  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({ error: 'Supabase service role key is missing.' }, { status: 503 });
  }

  let payload: CurtainQuotePayload;
  try {
    payload = (await request.json()) as CurtainQuotePayload;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const fullName = String(payload.fullName ?? '').trim();
  const email = String(payload.email ?? '').trim().toLowerCase();
  const phone = String(payload.phone ?? '').trim();
  const city = String(payload.city ?? '').trim();
  const notes = String(payload.notes ?? '').trim().slice(0, 2000);
  const configuration = payload.configuration ?? {};

  if (!fullName || !email) {
    return NextResponse.json({ error: 'Full name and email are required.' }, { status: 400 });
  }

  if (!email.includes('@')) {
    return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }

  if (!configuration || typeof configuration !== 'object' || !configuration.widthCm || !configuration.dropCm) {
    return NextResponse.json({ error: 'Window measurements are required.' }, { status: 400 });
  }

  const estimatedTotal = Number.isFinite(Number(configuration.estimateTotal))
    ? Math.max(0, Math.round(Number(configuration.estimateTotal)))
    : 0;

  const userId = (await getOptionalUser())?.id ?? null;
  const reference = buildQuoteReference();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('curtain_quotes')
    .insert({
      reference,
      user_id: userId,
      full_name: fullName,
      email,
      phone,
      city,
      notes,
      configuration,
      estimated_total: estimatedTotal,
      status: 'new',
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    return NextResponse.json({ error: error?.message ?? 'Could not submit quote enquiry.' }, { status: 500 });
  }

  // Notify the admin inbox via Resend. The enquiry is already saved, so an
  // email failure must not fail the customer's submission.
  let emailSent = false;
  try {
    await sendAdminCurtainQuoteNotification({
      reference,
      customerName: fullName,
      customerEmail: email,
      customerPhone: phone,
      customerCity: city,
      notes,
      configurationSummary: [
        { label: 'Window width', value: `${configuration.widthCm} cm` },
        { label: 'Drop / height', value: `${configuration.dropCm} cm` },
        { label: 'Windows', value: String(configuration.windows ?? 1) },
        { label: 'Panels per window', value: String(configuration.panelsPerWindow ?? 2) },
        { label: 'Heading style', value: configuration.heading ?? '-' },
        { label: 'Fabric', value: configuration.fabric ?? '-' },
        { label: 'Colour', value: configuration.colour ?? '-' },
        { label: 'Layers', value: configuration.layers ?? '-' },
        { label: 'Lining', value: configuration.lining ?? '-' },
        { label: 'Track / rod', value: configuration.trackType ?? '-' },
        { label: 'Track setup', value: configuration.trackCount ?? '-' },
        { label: 'Motorised', value: configuration.motorised ? 'Yes' : 'No' },
        { label: 'Installation', value: configuration.installation ?? '-' },
      ],
      estimateTotal: estimatedTotal,
      estimateLines: Array.isArray(configuration.estimateLines) ? configuration.estimateLines : [],
    });
    emailSent = true;
  } catch (err) {
    console.error('Failed to send curtain quote admin notification:', err);
  }

  return NextResponse.json({ id: data.id, reference, success: true, emailSent });
}
