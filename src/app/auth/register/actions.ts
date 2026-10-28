'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSiteUrl } from '@/lib/supabase/site-url';
import { hasPublicSupabaseEnv, hasServiceSupabaseEnv } from '@/lib/supabase/env';
import { sendSignupConfirmationEmail } from '@/lib/auth-emails';
import { appendToastToPath } from '@/lib/toast-query';
import { logUserActivity } from '@/lib/user-activity';

export interface UserRegisterState {
  error?: string;
}

type AuthErrorLike =
  | { message?: string; code?: string; status?: number }
  | null
  | undefined;

type FallbackRegistration =
  | { status: 'confirmation-sent'; userId: string }
  | { status: 'confirmed'; userId: string }
  | { status: 'error'; error: string };

function sanitizeRedirectTo(rawValue: string, fallback = '/account'): string {
  const value = rawValue.trim();

  if (!value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  if (value.startsWith('/admin')) {
    return fallback;
  }

  return value;
}

function isEmailDeliveryFailure(error: AuthErrorLike): boolean {
  if (!error) {
    return false;
  }

  const message = String(error.message ?? '').toLowerCase();
  const code = String(error.code ?? '').toLowerCase();

  if (
    message.includes('sending confirmation email') ||
    message.includes('sending email') ||
    message.includes('smtp') ||
    message.includes('rate limit')
  ) {
    return true;
  }

  if (code === 'unexpected_failure' || code === 'over_email_send_rate_limit') {
    return true;
  }

  return Number(error.status ?? 0) >= 500 && code === 'unexpected_failure';
}

function isExistingAccountError(error: AuthErrorLike): boolean {
  if (!error) {
    return false;
  }

  const message = String(error.message ?? '').toLowerCase();

  return (
    String(error.code ?? '') === 'email_exists' ||
    message.includes('already registered') ||
    message.includes('already been registered') ||
    message.includes('already exists')
  );
}

async function provisionAccount(userId: string, fullName: string): Promise<void> {
  if (!hasServiceSupabaseEnv) {
    return;
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
    {
      id: userId,
      full_name: fullName,
      role: 'customer',
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    console.error('[register] Profile provisioning failed:', profileError.message);
  }

  const { error: preferencesError } = await supabaseAdmin.from('user_preferences').upsert(
    {
      user_id: userId,
      marketing_email: true,
      sms_notifications: false,
    },
    { onConflict: 'user_id' }
  );

  if (preferencesError) {
    console.error('[register] Preferences provisioning failed:', preferencesError.message);
  }

  await logUserActivity({
    userId,
    actionType: 'profile_updated',
    resourceType: 'profile',
    resourceId: userId,
    metadata: {
      source: 'register',
    },
  });
}

/**
 * Creates the account through the admin API and sends the confirmation email
 * with the app's own Resend integration. Used when Supabase's auth mailer is
 * unavailable (misconfigured SMTP, revoked provider key, rate limit).
 */
async function registerWithoutSupabaseMailer(input: {
  email: string;
  password: string;
  fullName: string;
  redirectTo: string;
  siteUrl: string;
}): Promise<FallbackRegistration> {
  if (!hasServiceSupabaseEnv) {
    return {
      status: 'error',
      error: 'Account creation is temporarily unavailable. Please try again shortly.',
    };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: false,
    user_metadata: {
      full_name: input.fullName,
    },
  });

  const wasJustCreated = Boolean(created?.user?.id);

  if (!wasJustCreated && createError && !isExistingAccountError(createError)) {
    return {
      status: 'error',
      error: createError.message,
    };
  }

  const redirectTo = `${input.siteUrl}/auth/callback?next=${encodeURIComponent(input.redirectTo)}`;

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'signup',
    email: input.email,
    password: input.password,
    options: {
      redirectTo,
      data: {
        full_name: input.fullName,
      },
    },
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    if (isExistingAccountError(linkError)) {
      return {
        status: 'error',
        error: 'An account with this email already exists. Please sign in instead.',
      };
    }

    return {
      status: 'error',
      error: 'We could not finish creating your account. Please try again.',
    };
  }

  const userId = created?.user?.id ?? linkData.user?.id ?? null;

  if (!userId) {
    return {
      status: 'error',
      error: 'We could not finish creating your account. Please try again.',
    };
  }

  if (!wasJustCreated) {
    // The address belonged to an unconfirmed signup from an earlier attempt.
    // Keep the password and name the customer just entered so sign-in works
    // once they open the confirmation link.
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: input.password,
      user_metadata: {
        full_name: input.fullName,
      },
    });

    if (updateError) {
      console.error('[register] Could not refresh unconfirmed account details:', updateError.message);
    }
  }

  const emailResult = await sendSignupConfirmationEmail({
    to: input.email,
    fullName: input.fullName,
    confirmUrl: `${input.siteUrl}/auth/callback?token_hash=${encodeURIComponent(
      linkData.properties.hashed_token
    )}&type=signup&next=${encodeURIComponent(input.redirectTo)}`,
  });

  if (emailResult.sent) {
    return { status: 'confirmation-sent', userId };
  }

  console.error(
    '[register] Confirmation email could not be sent; activating the account without email verification:',
    emailResult.reason
  );

  const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });

  if (confirmError) {
    return {
      status: 'error',
      error: 'We could not activate your account. Please try again shortly.',
    };
  }

  return { status: 'confirmed', userId };
}

export async function registerUser(
  _prevState: UserRegisterState,
  formData: FormData
): Promise<UserRegisterState> {
  if (!hasPublicSupabaseEnv) {
    return {
      error: 'Supabase environment variables are missing. Add them in .env.local first.',
    };
  }

  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');
  const redirectToRaw = String(formData.get('redirectTo') ?? '/account');
  const redirectTo = sanitizeRedirectTo(redirectToRaw);

  if (!fullName || !email || !password || !confirmPassword) {
    return {
      error: 'All fields are required.',
    };
  }

  if (fullName.length < 2) {
    return {
      error: 'Name must be at least 2 characters long.',
    };
  }

  if (password.length < 8) {
    return {
      error: 'Password must be at least 8 characters long.',
    };
  }

  if (password !== confirmPassword) {
    return {
      error: 'Passwords do not match.',
    };
  }

  const headerStore = await headers();
  const siteUrl = getSiteUrl(headerStore);

  const supabase = await createSupabaseServerClient();
  const emailRedirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    if (!isEmailDeliveryFailure(error)) {
      return {
        error: error.message,
      };
    }

    console.error(
      '[register] Supabase could not send the confirmation email; using the app mailer instead:',
      error.message
    );

    const fallback = await registerWithoutSupabaseMailer({
      email,
      password,
      fullName,
      redirectTo,
      siteUrl,
    });

    if (fallback.status === 'error') {
      return {
        error: fallback.error,
      };
    }

    await provisionAccount(fallback.userId, fullName);

    if (fallback.status === 'confirmed') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (!signInError) {
        await logUserActivity({
          userId: fallback.userId,
          actionType: 'login',
          resourceType: 'auth',
          resourceId: fallback.userId,
          metadata: {
            source: 'register',
          },
        });

        redirect(appendToastToPath(redirectTo, 'success', 'Account created successfully.'));
      }

      redirect(
        appendToastToPath(
          '/auth/login',
          'success',
          'Account created successfully. Please sign in.'
        )
      );
    }

    redirect(
      appendToastToPath(
        `/auth/login?registered=1&redirectTo=${encodeURIComponent(redirectTo)}`,
        'info',
        'Check your mailbox to confirm your registration.'
      )
    );
  }

  const isNewSignup = Boolean(data.user && (data.user.identities?.length ?? 0) > 0);

  if (data.session) {
    if (data.user && isNewSignup) {
      await provisionAccount(data.user.id, fullName);
      await logUserActivity({
        userId: data.user.id,
        actionType: 'login',
        resourceType: 'auth',
        resourceId: data.user.id,
        metadata: {
          source: 'register',
        },
      });
    }

    redirect(appendToastToPath(redirectTo, 'success', 'Account created successfully.'));
  }

  if (data.user && isNewSignup) {
    await provisionAccount(data.user.id, fullName);
  }

  const loginPath = `/auth/login?registered=1&redirectTo=${encodeURIComponent(redirectTo)}`;
  redirect(
    appendToastToPath(
      loginPath,
      'info',
      'Check your mailbox to confirm your registration.'
    )
  );
}
