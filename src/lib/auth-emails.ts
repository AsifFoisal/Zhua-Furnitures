import 'server-only';

import { Resend } from 'resend';
import { getResendEnv, hasResendEnv } from '@/lib/supabase/env';

export type SignupConfirmationEmailResult =
  | { sent: true }
  | { sent: false; reason: string };

const resendClient = hasResendEnv ? new Resend(getResendEnv().apiKey) : null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendSignupConfirmationEmail(input: {
  to: string;
  fullName: string;
  confirmUrl: string;
}): Promise<SignupConfirmationEmailResult> {
  if (!resendClient) {
    return { sent: false, reason: 'Resend is not configured.' };
  }

  const { fromEmail } = getResendEnv();
  const safeName = escapeHtml(input.fullName || 'there');
  const safeConfirmUrl = escapeHtml(input.confirmUrl);

  const html = `
    <div style="margin:0;padding:0;background:#0f2742;font-family:Georgia,serif;color:#eaf0f8;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0f2742;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#163250;border:1px solid rgba(181,146,65,0.35);border-radius:14px;overflow:hidden;">
              <tr>
                <td style="padding:28px 28px 10px 28px;">
                  <p style="margin:0 0 10px 0;font-size:12px;letter-spacing:2px;color:#b59241;text-transform:uppercase;">Zhua Furnitures</p>
                  <h1 style="margin:0;font-size:34px;line-height:1.2;color:#eaf0f8;">Welcome to Zhua Furnitures</h1>
                  <p style="margin:16px 0 0 0;font-size:16px;line-height:1.6;color:#a9b7c9;">
                    Hi ${safeName}, thank you for creating your account. Please confirm your email to activate your profile.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:22px 28px;">
                  <a href="${safeConfirmUrl}" style="display:inline-block;background:#b59241;color:#0f2742;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:999px;">
                    Confirm Email
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:0 28px 28px 28px;">
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#8ca0b8;">
                    If you did not sign up for Zhua Furnitures, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  const text = [
    'Welcome to Zhua Furnitures',
    `Hi ${input.fullName || 'there'}, thanks for creating your account.`,
    'Confirm your email address to activate your profile:',
    input.confirmUrl,
    'If you did not sign up, you can safely ignore this email.',
  ].join('\n\n');

  try {
    const { error } = await resendClient.emails.send({
      from: `Zhua Furnitures <${fromEmail}>`,
      to: input.to,
      subject: 'Welcome to Zhua Furnitures - Confirm Your Email',
      html,
      text,
    });

    if (error) {
      return { sent: false, reason: error.message || 'Resend rejected the message.' };
    }

    return { sent: true };
  } catch (caughtError) {
    return {
      sent: false,
      reason: caughtError instanceof Error ? caughtError.message : 'Unknown email error.',
    };
  }
}
