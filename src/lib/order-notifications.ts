import 'server-only';

import { Resend } from 'resend';
import { getCanonicalSiteUrl } from '@/lib/site-url';
import { getResendEnv, hasResendEnv } from '@/lib/supabase/env';

type OrderStatusNotificationInput = {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  fulfillmentStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled';
};

type StatusEmailCopy = {
  subject: string;
  heading: string;
  intro: string;
  body: string;
  ctaLabel: string;
};

const statusCopy: Record<OrderStatusNotificationInput['fulfillmentStatus'], StatusEmailCopy> = {
  processing: {
    subject: 'Your Zhua Furnitures order is confirmed',
    heading: 'Your order is confirmed',
    intro: 'We have received your order update and your items are now being prepared.',
    body: 'You can follow the latest order progress using the tracking link below.',
    ctaLabel: 'Track your order',
  },
  shipped: {
    subject: 'Your Zhua Furnitures order has shipped',
    heading: 'Your order has shipped',
    intro: 'Your order is on the way and should be moving through delivery now.',
    body: 'Use the tracking link below to check the latest shipping progress.',
    ctaLabel: 'View delivery progress',
  },
  delivered: {
    subject: 'Your Zhua Furnitures order has been delivered',
    heading: 'Your order has been delivered',
    intro: 'Your delivery has been completed and the order is now marked as delivered.',
    body: 'If you need help with anything after delivery, reply to this message or contact support.',
    ctaLabel: 'Review your order',
  },
  cancelled: {
    subject: 'Your Zhua Furnitures order has been cancelled',
    heading: 'Your order has been cancelled',
    intro: 'This order is no longer being processed.',
    body: 'If this looks unexpected, please contact support and share your order number.',
    ctaLabel: 'Check order details',
  },
};

const resendClient = hasResendEnv ? new Resend(getResendEnv().apiKey) : null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildTrackOrderUrl(orderNumber: string): string {
  const baseUrl = getCanonicalSiteUrl();
  return `${baseUrl}/track-order?order=${encodeURIComponent(orderNumber)}`;
}

function buildEmailContent(input: OrderStatusNotificationInput): { subject: string; html: string; text: string } {
  const copy = statusCopy[input.fulfillmentStatus];
  const trackOrderUrl = buildTrackOrderUrl(input.orderNumber);
  const safeCustomerName = escapeHtml(input.customerName || 'Customer');
  const safeOrderNumber = escapeHtml(input.orderNumber);
  const safeTrackOrderUrl = escapeHtml(trackOrderUrl);

  const html = `
    <div style="margin:0;padding:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#1b2b3a;">
      <div style="max-width:640px;margin:0 auto;padding:40px 20px;">
        <div style="background:#163250;border-radius:20px;padding:32px;border:1px solid rgba(181,146,65,0.18);">
          <p style="margin:0 0 12px;color:#b59241;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">Zhua Furnitures</p>
          <h1 style="margin:0 0 16px;color:#eaf0f8;font-size:28px;line-height:1.25;">${copy.heading}</h1>
          <p style="margin:0 0 14px;color:#a9b7c9;font-size:16px;line-height:1.7;">Hi ${safeCustomerName},</p>
          <p style="margin:0 0 14px;color:#a9b7c9;font-size:16px;line-height:1.7;">${copy.intro}</p>
          <p style="margin:0 0 18px;color:#a9b7c9;font-size:16px;line-height:1.7;">Order number: <strong style="color:#eaf0f8;">${safeOrderNumber}</strong></p>
          <p style="margin:0 0 26px;color:#a9b7c9;font-size:16px;line-height:1.7;">${copy.body}</p>
          <a href="${safeTrackOrderUrl}" style="display:inline-block;background:#b59241;color:#0f1720;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;">${copy.ctaLabel}</a>
        </div>
      </div>
    </div>
  `;

  const text = [
    copy.heading,
    `Hi ${input.customerName || 'Customer'},`,
    copy.intro,
    `Order number: ${input.orderNumber}`,
    copy.body,
    `Track your order: ${trackOrderUrl}`,
  ].join('\n\n');

  return {
    subject: copy.subject,
    html,
    text,
  };
}

export async function sendOrderStatusNotification(input: OrderStatusNotificationInput): Promise<void> {
  if (!resendClient) {
    throw new Error('Resend is not configured.');
  }

  const { fromEmail } = getResendEnv();
  const content = buildEmailContent(input);

  await resendClient.emails.send({
    from: `Zhua Furnitures <${fromEmail}>`,
    to: input.customerEmail,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });
}