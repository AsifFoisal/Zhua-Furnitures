import { NextResponse } from 'next/server';
import { ensureAdminApiAccess } from '@/lib/admin-api-auth';
import { sendResendEmail } from '@/lib/resend';
import {
  getAdminNotificationEmail,
  getResendEnv,
  hasResendEnv,
} from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) {
    return 'invalid-email';
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}

function maskSecret(value: string): string {
  if (value.length <= 8) {
    return `${value.slice(0, 2)}***`;
  }

  return `${value.slice(0, 5)}…${value.slice(-4)}`;
}

const resendErrorHints: Record<string, string> = {
  missing_api_key: 'RESEND_API_KEY is not set for this environment. In Vercel, check the variable exists under the Production (and Preview) environments, then redeploy.',
  invalid_api_key: 'The API key is wrong or was revoked. Compare the masked key below with the key in your Resend dashboard and re-create it if needed.',
  restricted_api_key: 'The API key exists but is not allowed to send emails. In Resend, create a key with "Sending access" (full access) permission.',
  invalid_access: 'The key belongs to a different Resend region or team than the one you are checking. Verify the domain and key in the same Resend team that owns RESEND_FROM_EMAIL.',
  invalid_from_address: 'RESEND_FROM_EMAIL uses a domain that is not verified in Resend, or the sandbox sender (onboarding@resend.dev) is used for non-owner recipients. Verify your sending domain in Resend and set RESEND_FROM_EMAIL to an address on it.',
  invalid_region: 'The key was created for a different Resend region than this account uses. Re-create the key in the correct region.',
  monthly_quota_exceeded: 'The Resend account has used its monthly email quota. Upgrade the plan or wait for the reset.',
  daily_quota_exceeded: 'The Resend account has used its daily email quota. Wait for the reset or upgrade the plan.',
  rate_limit_exceeded: 'Resend is rate limiting this account. Retry after a short delay.',
  security_error: 'Resend blocked the send for security reasons. Check the account status in the Resend dashboard.',
};

export async function GET() {
  const access = await ensureAdminApiAccess();
  if (access instanceof NextResponse) {
    return access;
  }

  const report: Record<string, unknown> = {
    checkedAt: new Date().toISOString(),
    resendConfigured: hasResendEnv,
    adminNotificationEmail: getAdminNotificationEmail(),
  };

  if (!hasResendEnv) {
    report.hint =
      'RESEND_API_KEY or RESEND_FROM_EMAIL is missing on this deployment. All order, quote and status emails are skipped. Set both in Vercel (Production environment) and redeploy.';
    return NextResponse.json(report);
  }

  const { apiKey, fromEmail } = getResendEnv();
  report.fromEmail = maskEmail(fromEmail);
  report.apiKey = {
    mask: maskSecret(apiKey),
    length: apiKey.length,
    looksLikeResendKey: apiKey.startsWith('re_'),
  };

  try {
    const messageId = await sendResendEmail({
      to: getAdminNotificationEmail(),
      subject: 'Zhua Furnitures email diagnostics — test email',
      html: '<p>This is a test email from the Zhua Furnitures admin email diagnostics endpoint. If you received it, Resend is configured and sending correctly.</p>',
      text: 'Zhua Furnitures email diagnostics — test email. If you received it, Resend is configured and sending correctly.',
    });

    report.testSend = { ok: true, messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';
    const codeMatch = message.match(/\(([a-z_]+),/);
    report.testSend = {
      ok: false,
      error: message,
      hint: codeMatch ? resendErrorHints[codeMatch[1]] ?? null : null,
    };
  }

  return NextResponse.json(report);
}
