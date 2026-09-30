import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasServiceSupabaseEnv } from '@/lib/supabase/env';
import {
  DEFAULT_CURTAIN_CUSTOMIZER_CONFIG,
  normalizeCurtainCustomizerConfig,
} from '@/lib/curtain-customizer-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({ config: DEFAULT_CURTAIN_CUSTOMIZER_CONFIG });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('store_settings')
    .select('curtain_customizer_config')
    .eq('id', 'default')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    config: normalizeCurtainCustomizerConfig(data?.curtain_customizer_config),
  });
}

export async function PATCH(request: Request) {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Normalize repairs any malformed values (bad numbers, missing names,
  // empty lists) so only a valid config is ever persisted.
  const config = normalizeCurtainCustomizerConfig(payload);

  const supabase = createSupabaseAdminClient();

  // store_settings requires non-null store columns, so update the existing
  // row first and only insert a complete defaults row when none exists yet.
  const { data, error } = await supabase
    .from('store_settings')
    .update({ curtain_customizer_config: config })
    .eq('id', 'default')
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    const { error: insertError } = await supabase.from('store_settings').insert({
      id: 'default',
      store_name: 'Zhua Furniture',
      support_email: 'zhuaenterprise@gmail.com',
      currency: 'ZAR',
      order_prefix: 'ZE-2026',
      curtain_customizer_config: config,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ config });
}
