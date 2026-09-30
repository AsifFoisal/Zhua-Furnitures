import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasServiceSupabaseEnv } from '@/lib/supabase/env';
import {
  DEFAULT_CURTAIN_CUSTOMIZER_CONFIG,
  normalizeCurtainCustomizerConfig,
} from '@/lib/curtain-customizer-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!hasServiceSupabaseEnv) {
    return NextResponse.json({ config: DEFAULT_CURTAIN_CUSTOMIZER_CONFIG });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('store_settings')
    .select('curtain_customizer_config')
    .eq('id', 'default')
    .maybeSingle();

  // A missing column (migration not applied yet) or missing row must not break
  // the customer-facing customizer — fall back to the in-app defaults.
  if (error) {
    return NextResponse.json({ config: DEFAULT_CURTAIN_CUSTOMIZER_CONFIG });
  }

  return NextResponse.json({
    config: normalizeCurtainCustomizerConfig(data?.curtain_customizer_config),
  });
}
