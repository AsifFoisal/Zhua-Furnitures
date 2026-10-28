import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasPublicSupabaseEnv } from '@/lib/supabase/env';
import { appendToastToPath } from '@/lib/toast-query';

const DEFAULT_NEXT_PATH = '/account';

type EmailOtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email';

const emailOtpTypes: EmailOtpType[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
];

function sanitizeNextPath(rawValue: string | null): string {
  const value = (rawValue ?? '').trim();

  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/admin')) {
    return DEFAULT_NEXT_PATH;
  }

  return value;
}

function buildRedirect(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.nextUrl.origin));
}

export async function GET(request: NextRequest) {
  const nextPath = sanitizeNextPath(request.nextUrl.searchParams.get('next'));
  const errorDescription =
    request.nextUrl.searchParams.get('error_description') ??
    request.nextUrl.searchParams.get('error');

  if (errorDescription) {
    return buildRedirect(
      request,
      appendToastToPath(
        `/auth/login?redirectTo=${encodeURIComponent(nextPath)}`,
        'error',
        'That link is invalid or has expired. Please try again.'
      )
    );
  }

  if (!hasPublicSupabaseEnv) {
    return buildRedirect(
      request,
      appendToastToPath('/auth/login', 'error', 'Supabase environment variables are missing.')
    );
  }

  const supabase = await createSupabaseServerClient();
  const code = request.nextUrl.searchParams.get('code');
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const rawType = request.nextUrl.searchParams.get('type');
  const type = emailOtpTypes.find((candidate) => candidate === rawType);

  let verified = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    verified = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    verified = !error;
  }

  if (!verified) {
    return buildRedirect(
      request,
      appendToastToPath(
        `/auth/login?redirectTo=${encodeURIComponent(nextPath)}`,
        'error',
        'We could not verify that link. Please sign in or request a new one.'
      )
    );
  }

  const isPasswordRecovery = nextPath.startsWith('/auth/update-password');

  return buildRedirect(
    request,
    appendToastToPath(
      nextPath,
      'success',
      isPasswordRecovery
        ? 'Reset link verified. Choose your new password.'
        : 'Email confirmed. You are now signed in.'
    )
  );
}
