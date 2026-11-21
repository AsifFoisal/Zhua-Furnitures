import 'server-only';

import { getAdminNotificationEmail } from '@/lib/supabase/env';
import { sendResendEmail } from '@/lib/resend';

type InstallationBookingNotificationInput = {
  bookingId: string;
  productName: string;
  address: string;
  preferredDate: string;
  preferredSlot: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildBookingEmailContent(input: InstallationBookingNotificationInput): {
  subject: string;
  html: string;
  text: string;
} {
  const safeBookingId = escapeHtml(input.bookingId);
  const safeProductName = escapeHtml(input.productName || 'Unknown product');
  const safeAddress = escapeHtml(input.address);
  const safeCustomerName = escapeHtml(input.customerName || 'Customer');
  const safeCustomerEmail = escapeHtml(input.customerEmail);
  const safeCustomerPhone = escapeHtml(input.customerPhone);
  const safeNotes = input.notes
    ? escapeHtml(input.notes).replace(/\r?\n/g, '<br />')
    : '—';

  const html = `
    <div style="margin:0;padding:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#1b2b3a;">
      <div style="max-width:640px;margin:0 auto;padding:40px 20px;">
        <div style="background:#163250;border-radius:20px;padding:32px;border:1px solid rgba(181,146,65,0.18);">
          <p style="margin:0 0 12px;color:#b59241;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">Zhua Furnitures · Admin</p>
          <h1 style="margin:0 0 16px;color:#eaf0f8;font-size:28px;line-height:1.25;">New installation booking</h1>
          <p style="margin:0 0 18px;color:#a9b7c9;font-size:16px;line-height:1.7;">A customer requested a product installation through the website.</p>
          <p style="margin:0 0 6px;color:#eaf0f8;font-size:14px;line-height:1.6;">Booking ID: <strong>${safeBookingId}</strong></p>
          <p style="margin:0;color:#a9b7c9;font-size:13px;line-height:1.6;">Preferred slot: <strong style="color:#eaf0f8;">${escapeHtml(input.preferredDate)} · ${escapeHtml(input.preferredSlot)}</strong></p>
          <h2 style="margin:20px 0 6px;color:#b59241;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;">Customer</h2>
          <p style="margin:0;color:#eaf0f8;font-size:14px;line-height:1.7;"><strong>${safeCustomerName}</strong></p>
          <p style="margin:0;color:#a9b7c9;font-size:14px;line-height:1.7;">${safeCustomerEmail} · ${safeCustomerPhone}</p>
          <h2 style="margin:20px 0 6px;color:#b59241;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;">Product &amp; address</h2>
          <p style="margin:0;color:#eaf0f8;font-size:14px;line-height:1.7;"><strong>${safeProductName}</strong></p>
          <p style="margin:0;color:#a9b7c9;font-size:14px;line-height:1.7;">${safeAddress}</p>
          <h2 style="margin:20px 0 6px;color:#b59241;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;">Notes</h2>
          <p style="margin:0;color:#a9b7c9;font-size:14px;line-height:1.8;">${safeNotes}</p>
          <p style="margin:22px 0 0;color:#8ca0b8;font-size:12px;line-height:1.6;">Reply directly to this email to contact the customer.</p>
        </div>
      </div>
    </div>`;

  const text = [
    'New installation booking',
    `Booking ID: ${input.bookingId}`,
    `Preferred slot: ${input.preferredDate} · ${input.preferredSlot}`,
    '',
    'Customer',
    input.customerName || 'Customer',
    `${input.customerEmail} · ${input.customerPhone}`,
    '',
    'Product & address',
    input.productName || 'Unknown product',
    input.address,
    '',
    'Notes',
    input.notes || '—',
    '',
    'Reply directly to this email to contact the customer.',
  ].join('\n');

  return {
    subject: `New installation booking — ${input.customerName || 'Customer'} (${input.preferredDate})`,
    html,
    text,
  };
}

export async function sendAdminInstallationBookingNotification(
  input: InstallationBookingNotificationInput
): Promise<void> {
  const content = buildBookingEmailContent(input);

  await sendResendEmail({
    to: getAdminNotificationEmail(),
    replyTo: input.customerEmail || undefined,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });
}
