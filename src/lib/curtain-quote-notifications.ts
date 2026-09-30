import 'server-only';

import { Resend } from 'resend';
import { getAdminNotificationEmail, getResendEnv, hasResendEnv } from '@/lib/supabase/env';

const resendClient = hasResendEnv ? new Resend(getResendEnv().apiKey) : null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type CurtainQuoteEstimateLine = { label: string; amount: number };

export type AdminCurtainQuoteNotificationInput = {
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCity: string;
  notes: string;
  configurationSummary: { label: string; value: string }[];
  estimateTotal: number;
  estimateLines: CurtainQuoteEstimateLine[];
};

function formatRand(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  return `R ${safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
}

function buildAdminCurtainQuoteEmailContent(input: AdminCurtainQuoteNotificationInput): {
  subject: string;
  html: string;
  text: string;
} {
  const safeReference = escapeHtml(input.reference);
  const safeCustomerName = escapeHtml(input.customerName || 'Customer');
  const safeCustomerEmail = escapeHtml(input.customerEmail || '');
  const safeCustomerPhone = escapeHtml(input.customerPhone || '');
  const safeCustomerCity = escapeHtml(input.customerCity || '');
  const safeNotes = escapeHtml(input.notes || '');

  const configRows = input.configurationSummary
    .map(
      (row) => `
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid rgba(181,146,65,0.14);color:#a9b7c9;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(row.label)}</td>
          <td style="padding:6px 12px;border-bottom:1px solid rgba(181,146,65,0.14);color:#eaf0f8;font-size:13px;vertical-align:top;">${escapeHtml(row.value)}</td>
        </tr>`
    )
    .join('');

  const estimateRows = input.estimateLines
    .map(
      (line) => `
        <tr>
          <td style="padding:6px 12px;color:#a9b7c9;font-size:13px;">${escapeHtml(line.label)}</td>
          <td align="right" style="padding:6px 12px;color:#eaf0f8;font-size:13px;">${formatRand(line.amount)}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="margin:0;padding:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#1b2b3a;">
      <div style="max-width:680px;margin:0 auto;padding:40px 20px;">
        <div style="background:#163250;border-radius:20px;padding:32px;border:1px solid rgba(181,146,65,0.18);">
          <p style="margin:0 0 12px;color:#b59241;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">Zhua Furnitures · Admin</p>
          <h1 style="margin:0 0 16px;color:#eaf0f8;font-size:28px;line-height:1.25;">New curtain quote enquiry</h1>
          <p style="margin:0 0 18px;color:#a9b7c9;font-size:16px;line-height:1.7;">A customer submitted a Curtain Customizer configuration for review. Confirm the final measurements and quotation before requesting payment.</p>
          <p style="margin:0 0 6px;color:#eaf0f8;font-size:14px;line-height:1.6;">Reference: <strong>${safeReference}</strong></p>
          <p style="margin:0;color:#a9b7c9;font-size:13px;line-height:1.6;">Estimated total: <strong style="color:#b59241;">${formatRand(input.estimateTotal)}</strong> (estimate only — not confirmed)</p>
          <h2 style="margin:24px 0 6px;color:#b59241;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;">Customer</h2>
          <p style="margin:0;color:#eaf0f8;font-size:14px;line-height:1.7;"><strong>${safeCustomerName}</strong></p>
          <p style="margin:0;color:#a9b7c9;font-size:14px;line-height:1.7;">${safeCustomerEmail}${safeCustomerPhone ? ` · ${safeCustomerPhone}` : ''}${safeCustomerCity ? ` · ${safeCustomerCity}` : ''}</p>
          <h2 style="margin:20px 0 6px;color:#b59241;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;">Configuration</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:6px;">
            <tbody>${configRows}</tbody>
          </table>
          <h2 style="margin:20px 0 6px;color:#b59241;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;">Estimate Breakdown</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:6px;">
            <tbody>
              ${estimateRows}
              <tr>
                <td style="padding:10px 12px 0 12px;color:#b59241;font-size:14px;font-weight:700;">Estimated Total</td>
                <td align="right" style="padding:10px 12px 0 12px;color:#b59241;font-size:18px;font-weight:700;">${formatRand(input.estimateTotal)}</td>
              </tr>
            </tbody>
          </table>
          ${
            safeNotes
              ? `<h2 style="margin:20px 0 6px;color:#b59241;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;">Customer Notes</h2>
          <p style="margin:0;color:#eaf0f8;font-size:14px;line-height:1.7;white-space:pre-line;">${safeNotes}</p>`
              : ''
          }
          <p style="margin:22px 0 0;color:#8ca0b8;font-size:12px;line-height:1.6;">Reply directly to this email to contact the customer, or manage the quote in the admin dashboard.</p>
        </div>
      </div>
    </div>`;

  const textLines = [
    'New curtain quote enquiry',
    `Reference: ${input.reference}`,
    `Estimated total: ${formatRand(input.estimateTotal)} (estimate only — not confirmed)`,
    '',
    'Customer',
    input.customerName || 'Customer',
    `${input.customerEmail}${input.customerPhone ? ` · ${input.customerPhone}` : ''}${input.customerCity ? ` · ${input.customerCity}` : ''}`,
    '',
    'Configuration',
    ...input.configurationSummary.map((row) => `${row.label}: ${row.value}`),
    '',
    'Estimate breakdown',
    ...input.estimateLines.map((line) => `${line.label}: ${formatRand(line.amount)}`),
    `Estimated total: ${formatRand(input.estimateTotal)}`,
    ...(input.notes ? ['', 'Customer notes', input.notes] : []),
  ];

  return {
    subject: `New curtain quote enquiry — ${input.reference}`,
    html,
    text: textLines.join('\n'),
  };
}

export async function sendAdminCurtainQuoteNotification(input: AdminCurtainQuoteNotificationInput): Promise<void> {
  if (!resendClient) {
    throw new Error('Resend is not configured.');
  }

  const { fromEmail } = getResendEnv();
  const adminEmail = getAdminNotificationEmail();
  const content = buildAdminCurtainQuoteEmailContent(input);

  await resendClient.emails.send({
    from: `Zhua Furnitures <${fromEmail}>`,
    to: adminEmail,
    replyTo: input.customerEmail || undefined,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });
}

type FinalQuoteLine = { label: string; amount: number };

type CustomerFinalQuoteInput = {
  reference: string;
  customerName: string;
  customerEmail: string;
  lines: FinalQuoteLine[];
  total: number;
  message: string;
  paymentUrl: string;
};

function buildFinalQuoteLinesHtml(lines: FinalQuoteLine[]): string {
  return lines
    .map(
      (line) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid rgba(181,146,65,0.14);color:#a9b7c9;font-size:14px;">${escapeHtml(line.label)}</td>
          <td align="right" style="padding:8px 12px;border-bottom:1px solid rgba(181,146,65,0.14);color:#eaf0f8;font-size:14px;">${formatRand(line.amount)}</td>
        </tr>`
    )
    .join('');
}

function buildCustomerFinalQuoteEmailContent(input: CustomerFinalQuoteInput): {
  subject: string;
  html: string;
  text: string;
} {
  const safeCustomerName = escapeHtml(input.customerName || 'Customer');
  const safeReference = escapeHtml(input.reference);
  const safePaymentUrl = escapeHtml(input.paymentUrl);
  const lineRows = buildFinalQuoteLinesHtml(input.lines);
  const safeMessage = escapeHtml(input.message || '');

  const html = `
    <div style="margin:0;padding:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#1b2b3a;">
      <div style="max-width:640px;margin:0 auto;padding:40px 20px;">
        <div style="background:#163250;border-radius:20px;padding:32px;border:1px solid rgba(181,146,65,0.18);">
          <p style="margin:0 0 12px;color:#b59241;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">Zhua Furnitures</p>
          <h1 style="margin:0 0 16px;color:#eaf0f8;font-size:28px;line-height:1.25;">Your curtain quotation is ready</h1>
          <p style="margin:0 0 14px;color:#a9b7c9;font-size:16px;line-height:1.7;">Hi ${safeCustomerName},</p>
          <p style="margin:0 0 14px;color:#a9b7c9;font-size:16px;line-height:1.7;">We have reviewed your curtain configuration and confirmed the final quotation below (reference <strong style="color:#eaf0f8;">${safeReference}</strong>).</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:14px;">
            <tbody>${lineRows}</tbody>
          </table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:8px;">
            <tbody>
              <tr>
                <td style="padding:12px 12px 0 12px;color:#b59241;font-size:15px;font-weight:700;">Total</td>
                <td align="right" style="padding:12px 12px 0 12px;color:#b59241;font-size:22px;font-weight:700;">${formatRand(input.total)}</td>
              </tr>
            </tbody>
          </table>
          ${safeMessage ? `<p style="margin:18px 0 0;color:#a9b7c9;font-size:14px;line-height:1.7;white-space:pre-line;">${safeMessage}</p>` : ''}
          <p style="margin:18px 0 22px;color:#a9b7c9;font-size:14px;line-height:1.7;">Once you are happy with the quote, pay securely through our website using the button below — production starts as soon as payment is received.</p>
          <a href="${safePaymentUrl}" style="display:inline-block;background:#b59241;color:#0f1720;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:999px;">Pay Your Quote — ${formatRand(input.total)}</a>
        </div>
      </div>
    </div>`;

  const textLines = [
    'Your curtain quotation is ready',
    `Hi ${input.customerName || 'Customer'},`,
    `Reference: ${input.reference}`,
    '',
    ...input.lines.map((line) => `${line.label}: ${formatRand(line.amount)}`),
    `Total: ${formatRand(input.total)}`,
    ...(input.message ? ['', input.message] : []),
    '',
    `Pay securely here: ${input.paymentUrl}`,
  ];

  return {
    subject: `Your curtain quotation — ${input.reference}`,
    html,
    text: textLines.join('\n'),
  };
}

export async function sendCustomerFinalQuote(input: CustomerFinalQuoteInput): Promise<void> {
  if (!resendClient) {
    throw new Error('Resend is not configured.');
  }

  const { fromEmail } = getResendEnv();
  const content = buildCustomerFinalQuoteEmailContent(input);

  await resendClient.emails.send({
    from: `Zhua Furnitures <${fromEmail}>`,
    to: input.customerEmail,
    replyTo: getAdminNotificationEmail(),
    subject: content.subject,
    html: content.html,
    text: content.text,
  });
}

type QuotePaymentEvent = 'received' | 'failed';

type QuotePaymentNotificationInput = {
  event: QuotePaymentEvent;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  provider: string;
  paymentReference: string;
};

function buildQuotePaymentEmailContent(
  input: QuotePaymentNotificationInput
): { subject: string; html: string; text: string } {
  const isPaid = input.event === 'received';
  const heading = isPaid ? 'Curtain quote payment received' : 'Curtain quote payment failed';
  const intro = isPaid
    ? 'A customer paid their curtain quotation. You can begin production.'
    : 'A curtain quote payment attempt failed or was cancelled. No money has been captured.';
  const accent = isPaid ? '#3fbf7f' : '#ff8a8a';
  const safeReference = escapeHtml(input.reference);
  const safeCustomerName = escapeHtml(input.customerName || 'Customer');
  const safeCustomerEmail = escapeHtml(input.customerEmail || '');
  const safeCustomerPhone = escapeHtml(input.customerPhone || '');
  const safeProvider = escapeHtml((input.provider || '').toUpperCase());
  const safePaymentReference = escapeHtml(input.paymentReference || '');

  const html = `
    <div style="margin:0;padding:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#1b2b3a;">
      <div style="max-width:640px;margin:0 auto;padding:40px 20px;">
        <div style="background:#163250;border-radius:20px;padding:32px;border:1px solid rgba(181,146,65,0.18);">
          <p style="margin:0 0 12px;color:#b59241;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">Zhua Furnitures · Admin</p>
          <h1 style="margin:0 0 16px;color:#eaf0f8;font-size:28px;line-height:1.25;">${heading}</h1>
          <p style="margin:0 0 18px;color:#a9b7c9;font-size:16px;line-height:1.7;">${intro}</p>
          <p style="margin:0 0 6px;color:#eaf0f8;font-size:14px;line-height:1.6;">Reference: <strong>${safeReference}</strong></p>
          <p style="margin:0 0 6px;color:#eaf0f8;font-size:14px;line-height:1.6;">Amount: <strong style="color:${accent};">${formatRand(input.total)}</strong></p>
          <p style="margin:0;color:#a9b7c9;font-size:13px;line-height:1.6;">Gateway: <strong style="color:#eaf0f8;">${safeProvider}</strong>${safePaymentReference ? ` · Payment ref: ${safePaymentReference}` : ''}</p>
          <h2 style="margin:24px 0 6px;color:#b59241;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;">Customer</h2>
          <p style="margin:0;color:#eaf0f8;font-size:14px;line-height:1.7;"><strong>${safeCustomerName}</strong></p>
          <p style="margin:0;color:#a9b7c9;font-size:14px;line-height:1.7;">${safeCustomerEmail}${safeCustomerPhone ? ` · ${safeCustomerPhone}` : ''}</p>
        </div>
      </div>
    </div>`;

  const text = [
    heading,
    intro,
    `Reference: ${input.reference}`,
    `Amount: ${formatRand(input.total)}`,
    `Gateway: ${(input.provider || '').toUpperCase()}${input.paymentReference ? ` · Payment ref: ${input.paymentReference}` : ''}`,
    'Customer',
    input.customerName || 'Customer',
    `${input.customerEmail}${input.customerPhone ? ` · ${input.customerPhone}` : ''}`,
  ].join('\n');

  return {
    subject: `${heading} — ${input.reference}`,
    html,
    text,
  };
}

export async function sendAdminQuotePaymentNotification(input: QuotePaymentNotificationInput): Promise<void> {
  if (!resendClient) {
    throw new Error('Resend is not configured.');
  }

  const { fromEmail } = getResendEnv();
  const adminEmail = getAdminNotificationEmail();
  const content = buildQuotePaymentEmailContent(input);

  await resendClient.emails.send({
    from: `Zhua Furnitures <${fromEmail}>`,
    to: adminEmail,
    replyTo: input.customerEmail || undefined,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });
}
