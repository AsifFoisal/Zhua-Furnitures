import 'server-only';

import { Resend } from 'resend';
import { getResendEnv, hasResendEnv } from '@/lib/supabase/env';

type ResendEmailPayload = {
  to: string;
  replyTo?: string | null;
  subject: string;
  html: string;
  text: string;
};

const resendClient = hasResendEnv ? new Resend(getResendEnv().apiKey) : null;

/**
 * Sends an email through Resend and throws when the API rejects it.
 *
 * The Resend SDK (v4+) resolves with { data, error } instead of throwing for
 * API-level failures such as an invalid or restricted key, an unverified
 * sending domain, or exhausted quota. Callers that ignore the resolved error
 * would drop the email silently with no log entry and no trace in the Resend
 * dashboard, so the error is surfaced here.
 */
export async function sendResendEmail(payload: ResendEmailPayload): Promise<string> {
  if (!resendClient) {
    throw new Error('Resend is not configured.');
  }

  const { fromEmail } = getResendEnv();

  const { data, error } = await resendClient.emails.send({
    from: `Zhua Furnitures <${fromEmail}>`,
    to: payload.to,
    replyTo: payload.replyTo || undefined,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });

  if (error) {
    throw new Error(
      `Resend rejected the email (${error.name}, status ${error.statusCode ?? 'unknown'}): ${error.message}`
    );
  }

  if (!data?.id) {
    throw new Error('Resend accepted the email but returned no message id.');
  }

  return data.id;
}
