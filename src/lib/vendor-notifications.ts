import 'server-only';

import { getAdminNotificationEmail } from '@/lib/supabase/env';
import { sendResendEmail } from '@/lib/resend';

type VendorApplicationNotificationInput = {
  applicationId: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  category: string;
  message: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildVendorEmailContent(input: VendorApplicationNotificationInput): {
  subject: string;
  html: string;
  text: string;
} {
  const safeApplicationId = escapeHtml(input.applicationId);
  const safeBusinessName = escapeHtml(input.businessName);
  const safeContactName = escapeHtml(input.contactName);
  const safeEmail = escapeHtml(input.email);
  const safePhone = escapeHtml(input.phone || '—');
  const safeWebsite = input.website
    ? `<a href="${escapeHtml(input.website)}" style="color:#b59241;text-decoration:underline;">${escapeHtml(input.website)}</a>`
    : '—';
  const safeCategory = escapeHtml(input.category || 'General');
  const safeMessage = input.message
    ? escapeHtml(input.message).replace(/\r?\n/g, '<br />')
    : '—';

  const html = `
    <div style="margin:0;padding:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#1b2b3a;">
      <div style="max-width:640px;margin:0 auto;padding:40px 20px;">
        <div style="background:#163250;border-radius:20px;padding:32px;border:1px solid rgba(181,146,65,0.18);">
          <p style="margin:0 0 12px;color:#b59241;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">Zhua Furnitures · Admin</p>
          <h1 style="margin:0 0 16px;color:#eaf0f8;font-size:28px;line-height:1.25;">New vendor application</h1>
          <p style="margin:0 0 18px;color:#a9b7c9;font-size:16px;line-height:1.7;">A business applied to join the marketplace through the website.</p>
          <p style="margin:0 0 6px;color:#eaf0f8;font-size:14px;line-height:1.6;">Application ID: <strong>${safeApplicationId}</strong></p>
          <p style="margin:0;color:#a9b7c9;font-size:13px;line-height:1.6;">Category: <strong style="color:#eaf0f8;">${safeCategory}</strong></p>
          <h2 style="margin:20px 0 6px;color:#b59241;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;">Business</h2>
          <p style="margin:0;color:#eaf0f8;font-size:14px;line-height:1.7;"><strong>${safeBusinessName}</strong></p>
          <p style="margin:0;color:#a9b7c9;font-size:14px;line-height:1.7;">Contact: ${safeContactName} · ${safeEmail}${input.phone ? ` · ${safePhone}` : ''}</p>
          <p style="margin:0;color:#a9b7c9;font-size:14px;line-height:1.7;">Website: ${safeWebsite}</p>
          <h2 style="margin:20px 0 6px;color:#b59241;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;">Message</h2>
          <p style="margin:0;color:#a9b7c9;font-size:14px;line-height:1.8;">${safeMessage}</p>
          <p style="margin:22px 0 0;color:#8ca0b8;font-size:12px;line-height:1.6;">Reply directly to this email to contact the applicant.</p>
        </div>
      </div>
    </div>`;

  const text = [
    'New vendor application',
    `Application ID: ${input.applicationId}`,
    `Category: ${input.category || 'General'}`,
    '',
    'Business',
    input.businessName,
    `Contact: ${input.contactName} · ${input.email}${input.phone ? ` · ${input.phone}` : ''}`,
    `Website: ${input.website || '—'}`,
    '',
    'Message',
    input.message || '—',
    '',
    'Reply directly to this email to contact the applicant.',
  ].join('\n');

  return {
    subject: `New vendor application — ${input.businessName}`,
    html,
    text,
  };
}

export async function sendAdminVendorApplicationNotification(
  input: VendorApplicationNotificationInput
): Promise<void> {
  const content = buildVendorEmailContent(input);

  await sendResendEmail({
    to: getAdminNotificationEmail(),
    replyTo: input.email || undefined,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });
}
