'use server';

import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv } from '@/lib/supabase/env';
import { getSiteUrl } from '@/lib/supabase/site-url';

export interface ResetPasswordState {
  error?: string;
  success?: string;
}

export async function requestPasswordReset(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  if (!hasPublicSupabaseEnv) {
    return { error: 'Supabase environment variables are missing.' };
  }

  const email = String(formData.get('email') ?? '').trim();
  if (!email) {
    return { error: 'Email is required.' };
  }

  const headerStore = await headers();
  const baseUrl = getSiteUrl(headerStore);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent('/auth/update-password')}`,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: 'Password reset instructions have been sent if the email exists in our system.',
  };
}
