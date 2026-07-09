import 'server-only';

import { Resend } from 'resend';
import { getCanonicalSiteUrl } from '@/lib/site-url';
import { getAdminNotificationEmail, getResendEnv, hasResendEnv } from '@/lib/supabase/env';

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

type AdminOrderEvent = 'placement' | 'paid';

export type AdminOrderItem = {
  productName: string;
  quantity: number;
  unitPriceCents: number;
  selectedColor?: string | null;
  selectedSize?: string | null;
  selectedFabric?: string | null;
  customNote?: string | null;
};

export type AdminNewOrderNotificationInput = {
  event: AdminOrderEvent;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  deliveryType: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents?: number;
  promoCode?: string | null;
  totalCents: number;
  items: AdminOrderItem[];
};

type AdminOrderCopy = {
  subject: string;
  heading: string;
  intro: string;
  accent: string;
};

const adminOrderCopy: Record<AdminOrderEvent, AdminOrderCopy> = {
  placement: {
    subject: 'New Zhua Furnitures order received',
    heading: 'New order received',
    intro: 'A customer just placed a new order. Review the details below and start fulfilment.',
    accent: '#b59241',
  },
  paid: {
    subject: 'Payment received for Zhua Furnitures order',
    heading: 'Payment received',
    intro: 'Payment has been confirmed for the order below. You can begin fulfilment.',
    accent: '#3fbf7f',
  },
};

function formatCents(cents: number): string {
  const safe = Number.isFinite(cents) ? Math.max(0, Math.round(cents)) : 0;
  return `R ${(safe / 100).toFixed(2)}`;
}

function formatProvince(value: string): string {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDeliveryType(value: string): string {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildAdminOrderRows(items: AdminOrderItem[]): string {
  return items
    .map((item) => {
      const safeName = escapeHtml(item.productName || 'Product');
      const variants = [
        item.selectedColor ? `Color: ${escapeHtml(item.selectedColor)}` : null,
        item.selectedSize ? `Size: ${escapeHtml(item.selectedSize)}` : null,
        item.selectedFabric ? `Fabric: ${escapeHtml(item.selectedFabric)}` : null,
        item.customNote ? `Note: ${escapeHtml(item.customNote)}` : null,
      ]
        .filter(Boolean)
        .join(' • ');
      const variantLine = variants ? `<div style="font-size:12px;color:#8ca0b8;margin-top:2px;">${variants}</div>` : '';
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid rgba(181,146,65,0.18);color:#eaf0f8;font-size:14px;vertical-align:top;">
            <div>${safeName}</div>
            ${variantLine}
          </td>
          <td align="center" style="padding:10px 12px;border-bottom:1px solid rgba(181,146,65,0.18);color:#a9b7c9;font-size:14px;vertical-align:top;">${item.quantity}</td>
          <td align="right" style="padding:10px 12px;border-bottom:1px solid rgba(181,146,65,0.18);color:#eaf0f8;font-size:14px;vertical-align:top;">${formatCents(item.unitPriceCents)}</td>
          <td align="right" style="padding:10px 12px;border-bottom:1px solid rgba(181,146,65,0.18);color:#eaf0f8;font-size:14px;vertical-align:top;">${formatCents(item.unitPriceCents * item.quantity)}</td>
        </tr>`;
    })
    .join('');
}

function buildAdminEmailContent(input: AdminNewOrderNotificationInput): {
  subject: string;
  html: string;
  text: string;
} {
  const copy = adminOrderCopy[input.event];
  const safeOrderNumber = escapeHtml(input.orderNumber);
  const safeCustomerName = escapeHtml(input.customerName || 'Customer');
  const safeCustomerEmail = escapeHtml(input.customerEmail || '');
  const safeCustomerPhone = escapeHtml(input.customerPhone || '');
  const safeAddress = escapeHtml(input.address || '');
  const safeCity = escapeHtml(input.city || '');
  const safeProvince = escapeHtml(formatProvince(input.province));
  const safePostalCode = escapeHtml(input.postalCode || '');
  const safeDeliveryType = escapeHtml(formatDeliveryType(input.deliveryType));
  const safePaymentMethod = escapeHtml((input.paymentMethod || '').toUpperCase());
  const safePaymentStatus = escapeHtml(input.paymentStatus || '');
  const safePromoCode = input.promoCode ? escapeHtml(input.promoCode) : '';
  const itemRows = buildAdminOrderRows(input.items);
  const discountRow =
    input.discountCents && input.discountCents > 0
      ? `
        <tr>
          <td colspan="3" align="right" style="padding:8px 12px;color:#a9b7c9;font-size:14px;">Promo ${safePromoCode ? `(${safePromoCode})` : ''}</td>
          <td align="right" style="padding:8px 12px;color:#eaf0f8;font-size:14px;">-${formatCents(input.discountCents)}</td>
        </tr>`
      : '';
  const itemsTable = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:18px;">
      <thead>
        <tr>
          <th align="left" style="padding:10px 12px;border-bottom:1px solid rgba(181,146,65,0.35);color:#b59241;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">Item</th>
          <th align="center" style="padding:10px 12px;border-bottom:1px solid rgba(181,146,65,0.35);color:#b59241;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">Qty</th>
          <th align="right" style="padding:10px 12px;border-bottom:1px solid rgba(181,146,65,0.35);color:#b59241;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">Unit</th>
          <th align="right" style="padding:10px 12px;border-bottom:1px solid rgba(181,146,65,0.35);color:#b59241;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr>
          <td colspan="3" align="right" style="padding:10px 12px;color:#a9b7c9;font-size:14px;">Subtotal</td>
          <td align="right" style="padding:10px 12px;color:#eaf0f8;font-size:14px;">${formatCents(input.subtotalCents)}</td>
        </tr>
        <tr>
          <td colspan="3" align="right" style="padding:6px 12px;color:#a9b7c9;font-size:14px;">Delivery${safeDeliveryType ? ` (${safeDeliveryType})` : ''}</td>
          <td align="right" style="padding:6px 12px;color:#eaf0f8;font-size:14px;">${formatCents(input.deliveryFeeCents)}</td>
        </tr>
        ${discountRow}
        <tr>
          <td colspan="3" align="right" style="padding:12px 12px 0 12px;color:#b59241;font-size:14px;font-weight:700;">Total</td>
          <td align="right" style="padding:12px 12px 0 12px;color:${copy.accent};font-size:18px;font-weight:700;">${formatCents(input.totalCents)}</td>
        </tr>
      </tbody>
    </table>`;

  const html = `
    <div style="margin:0;padding:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#1b2b3a;">
      <div style="max-width:680px;margin:0 auto;padding:40px 20px;">
        <div style="background:#163250;border-radius:20px;padding:32px;border:1px solid rgba(181,146,65,0.18);">
          <p style="margin:0 0 12px;color:#b59241;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">Zhua Furnitures · Admin</p>
          <h1 style="margin:0 0 16px;color:#eaf0f8;font-size:28px;line-height:1.25;">${copy.heading}</h1>
          <p style="margin:0 0 18px;color:#a9b7c9;font-size:16px;line-height:1.7;">${copy.intro}</p>
          <p style="margin:0 0 6px;color:#eaf0f8;font-size:14px;line-height:1.6;">Order number: <strong>${safeOrderNumber}</strong></p>
          <p style="margin:0;color:#a9b7c9;font-size:13px;line-height:1.6;">Payment: <strong style="color:#eaf0f8;">${safePaymentMethod}</strong> · Status: <strong style="color:${copy.accent};">${safePaymentStatus}</strong></p>
          <h2 style="margin:24px 0 6px;color:#b59241;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;">Customer</h2>
          <p style="margin:0;color:#eaf0f8;font-size:14px;line-height:1.7;"><strong>${safeCustomerName}</strong></p>
          <p style="margin:0;color:#a9b7c9;font-size:14px;line-height:1.7;">${safeCustomerEmail}${safeCustomerPhone ? ` · ${safeCustomerPhone}` : ''}</p>
          <h2 style="margin:20px 0 6px;color:#b59241;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;">Delivery</h2>
          <p style="margin:0;color:#eaf0f8;font-size:14px;line-height:1.7;">${safeAddress}</p>
          <p style="margin:0;color:#a9b7c9;font-size:14px;line-height:1.7;">${safeCity}${safeProvince ? `, ${safeProvince}` : ''}${safePostalCode ? ` · ${safePostalCode}` : ''}</p>
          ${itemsTable}
          <p style="margin:22px 0 0;color:#8ca0b8;font-size:12px;line-height:1.6;">Reply directly to this email to contact the customer.</p>
        </div>
      </div>
    </div>`;

  const textLines = [
    copy.heading,
    copy.intro,
    `Order: ${input.orderNumber}`,
    `Payment: ${(input.paymentMethod || '').toUpperCase()} · ${input.paymentStatus}`,
    '',
    'Customer',
    `${input.customerName || 'Customer'}`,
    `${input.customerEmail}${input.customerPhone ? ` · ${input.customerPhone}` : ''}`,
    '',
    'Delivery',
    `${input.address}`,
    `${input.city}${input.province ? `, ${formatProvince(input.province)}` : ''}${input.postalCode ? ` · ${input.postalCode}` : ''}`,
    `Type: ${formatDeliveryType(input.deliveryType) || 'standard'}`,
    '',
    'Items',
    ...input.items.map((item) => {
      const variants = [
        item.selectedColor ? `Color: ${item.selectedColor}` : null,
        item.selectedSize ? `Size: ${item.selectedSize}` : null,
        item.selectedFabric ? `Fabric: ${item.selectedFabric}` : null,
        item.customNote ? `Note: ${item.customNote}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      return `- ${item.productName} × ${item.quantity} @ ${formatCents(item.unitPriceCents)}${variants ? ` (${variants})` : ''}`;
    }),
    '',
    `Subtotal: ${formatCents(input.subtotalCents)}`,
    `Delivery: ${formatCents(input.deliveryFeeCents)}`,
    ...(input.discountCents && input.discountCents > 0
      ? [`Promo${input.promoCode ? ` (${input.promoCode})` : ''}: -${formatCents(input.discountCents)}`]
      : []),
    `Total: ${formatCents(input.totalCents)}`,
  ];

  return {
    subject: `${copy.subject} — ${input.orderNumber}`,
    html,
    text: textLines.join('\n'),
  };
}

export async function sendAdminNewOrderNotification(input: AdminNewOrderNotificationInput): Promise<void> {
  if (!resendClient) {
    throw new Error('Resend is not configured.');
  }

  const { fromEmail } = getResendEnv();
  const adminEmail = getAdminNotificationEmail();
  const content = buildAdminEmailContent(input);

  await resendClient.emails.send({
    from: `Zhua Furnitures <${fromEmail}>`,
    to: adminEmail,
    replyTo: input.customerEmail || undefined,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });
}