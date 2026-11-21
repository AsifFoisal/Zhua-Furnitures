import 'server-only';

import { getAdminNotificationEmail } from '@/lib/supabase/env';
import { sendResendEmail } from '@/lib/resend';

type ContactEnquiryNotificationInput = {
  enquiryId: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  source: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEnquiryEmailContent(input: ContactEnquiryNotificationInput): {
  subject: string;
  html: string;
  text: string;
} {
  const safeFullName = escapeHtml(input.fullName || 'Unknown');
  const safeEmail = escapeHtml(input.email);
  const safePhone = escapeHtml(input.phone || '—');
  const safeMessage = escapeHtml(input.message).replace(/\r?\n/g, '<br />');
  const safeSource = escapeHtml(input.source || 'website');

  const html = `
    <div style="margin:0;padding:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#1b2b3a;">
      <div style="max-width:640px;margin:0 auto;padding:40px 20px;">
        <div style="background:#163250;border-radius:20px;padding:32px;border:1px solid rgba(181,146,65,0.18);">
          <p style="margin:0 0 12px;color:#b59241;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">Zhua Furnitures · Admin</p>
          <h1 style="margin:0 0 16px;color:#eaf0f8;font-size:28px;line-height:1.25;">New website enquiry</h1>
          <p style="margin:0 0 18px;color:#a9b7c9;font-size:16px;line-height:1.7;">A new enquiry was submitted through the website contact form.</p>
          <p style="margin:0 0 6px;color:#eaf0f8;font-size:14px;line-height:1.6;">Enquiry ID: <strong>${escapeHtml(input.enquiryId)}</strong></p>
          <p style="margin:0;color:#a9b7c9;font-size:13px;line-height:1.6;">Source: <strong style="color:#eaf0f8;">${safeSource}</strong></p>
          <h2 style="margin:20px 0 6px;color:#b59241;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;">Contact details</h2>
          <p style="margin:0;color:#eaf0f8;font-size:14px;line-height:1.7;"><strong>${safeFullName}</strong></p>
          <p style="margin:0;color:#a9b7c9;font-size:14px;line-height:1.7;">${safeEmail}${input.phone ? ` · ${safePhone}` : ''}</p>
          <h2 style="margin:20px 0 6px;color:#b59241;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;">Message</h2>
          <p style="margin:0;color:#a9b7c9;font-size:14px;line-height:1.8;white-space:normal;">${safeMessage}</p>
          <p style="margin:22px 0 0;color:#8ca0b8;font-size:12px;line-height:1.6;">Reply directly to this email to contact the enquirer.</p>
        </div>
      </div>
    </div>`;

  const text = [
    'New website enquiry',
    `Enquiry ID: ${input.enquiryId}`,
    `Source: ${input.source || 'website'}`,
    '',
    'Contact details',
    input.fullName || 'Unknown',
    `${input.email}${input.phone ? ` · ${input.phone}` : ''}`,
    '',
    'Message',
    input.message,
    '',
    'Reply directly to this email to contact the enquirer.',
  ].join('\n');

  return {
    subject: `New website enquiry — ${input.fullName || 'Unknown'}`,
    html,
    text,
  };
}

export async function sendAdminContactEnquiryNotification(
  input: ContactEnquiryNotificationInput
): Promise<void> {
  const content = buildEnquiryEmailContent(input);

  await sendResendEmail({
    to: getAdminNotificationEmail(),
    replyTo: input.email || undefined,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });
}
