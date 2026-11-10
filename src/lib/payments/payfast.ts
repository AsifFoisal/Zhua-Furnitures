import { createHash } from 'crypto';

export type PayFastMode = 'sandbox' | 'live';
export const PAYFAST_LIVE_MINIMUM_AMOUNT_CENTS = 500;

/**
 * PayFast signatures are built with PHP's urlencode(), which differs from
 * encodeURIComponent: spaces become "+", and characters such as ' ! ( ) * ~
 * are percent-encoded.
 */
function encode(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!'()*~]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, '+');
}

/**
 * Build signature string
 */
function buildSignatureString(
  payload: Record<string, unknown>,
  passphrase: string,
  sortKeys: boolean = false
): string {
  let entries = Object.entries(payload)
    .filter(([key, value]) =>
      key !== 'signature' &&
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ''
    );

  // 🔑 IMPORTANT:
  // - NO sorting for payment request
  // - SORTED for ITN verification
  if (sortKeys) {
    entries = entries.sort(([a], [b]) => a.localeCompare(b));
  }

  const pairs = entries.map(([key, value]) => {
    return `${encode(key)}=${encode(String(value).trim())}`;
  });

  // Append passphrase if exists
  const cleanPassphrase = passphrase?.trim();
  if (cleanPassphrase) {
    pairs.push(`passphrase=${encode(cleanPassphrase)}`);
  }

  const signatureString = pairs.join('&');

  // 🧪 Debug (VERY IMPORTANT for fixing mismatch issues)
  // console.log('Signature String:', signatureString);

  return signatureString;
}

/**
 * Generate signature
 */
export function generatePayFastSignature(
  payload: Record<string, unknown>,
  passphrase: string,
  sortKeys: boolean = false
): string {
  const signatureString = buildSignatureString(payload, passphrase, sortKeys);

  return createHash('md5')
    .update(signatureString)
    .digest('hex');
}

export type PayFastFieldInput = {
  merchantId: string;
  merchantKey: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  firstName: string;
  lastName: string;
  email: string;
  paymentId: string;
  amountCents: number;
  itemName: string;
  customStr1?: string;
};

/**
 * PayFast requires the posted form to contain exactly the fields used to build
 * the signature, in the same order, with empty values omitted. Posting an empty
 * input that is absent from the signature makes PayFast reject the payment.
 */
export function buildPayFastFields(input: PayFastFieldInput): Record<string, string> {
  const firstName = input.firstName.trim() || 'Customer';
  const lastName = input.lastName.trim() || firstName;

  const fields: Record<string, string> = {
    merchant_id: input.merchantId.trim(),
    merchant_key: input.merchantKey.trim(),
    return_url: input.returnUrl.trim(),
    cancel_url: input.cancelUrl.trim(),
    notify_url: input.notifyUrl.trim(),
    name_first: firstName,
    name_last: lastName,
    email_address: input.email.trim(),
    m_payment_id: input.paymentId.trim(),
    amount: (input.amountCents / 100).toFixed(2),
    item_name: input.itemName.trim(),
    custom_str1: input.customStr1?.trim() ?? '',
  };

  const nonEmptyFields: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== '') {
      nonEmptyFields[key] = value;
    }
  }

  return nonEmptyFields;
}

function isLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.endsWith('.local')
  );
}

/**
 * Live PayFast payments are rejected when a callback URL is not publicly
 * reachable over HTTPS. Checking here turns a gateway-side failure into an
 * actionable configuration error on our side.
 */
export function validatePayFastCallbackUrls(
  urls: { returnUrl: string; cancelUrl: string; notifyUrl: string },
  mode: PayFastMode
): string | null {
  const entries = [
    ['PAYFAST_RETURN_URL', urls.returnUrl],
    ['PAYFAST_CANCEL_URL', urls.cancelUrl],
    ['PAYFAST_NOTIFY_URL', urls.notifyUrl],
  ] as const;

  for (const [name, value] of entries) {
    let parsed: URL;

    try {
      parsed = new URL(value.trim());
    } catch {
      return `${name} must be an absolute URL.`;
    }

    if (mode !== 'live') {
      continue;
    }

    if (parsed.protocol !== 'https:') {
      return `${name} must use https for live payments.`;
    }

    if (isLocalHostname(parsed.hostname)) {
      return `${name} must be publicly reachable for live payments.`;
    }
  }

  return null;
}

/**
 * Verify ITN signature (PayFast callback).
 *
 * PayFast hashes the variables in the order they were posted (not sorted),
 * includes empty values, excludes "signature" and everything after it, and
 * appends the passphrase last. This mirrors PayFast's official PHP SDK.
 */
export function verifyPayFastSignature(
  payload: Record<string, unknown>,
  passphrase: string
): boolean {
  const incomingSignature = String(payload.signature || '')
    .trim()
    .toLowerCase();

  if (!incomingSignature) return false;

  const pairs: string[] = [];

  for (const [key, value] of Object.entries(payload)) {
    if (key === 'signature') {
      break;
    }

    pairs.push(`${key}=${encode(String(value))}`);
  }

  const cleanPassphrase = passphrase?.trim();
  if (cleanPassphrase) {
    pairs.push(`passphrase=${encode(cleanPassphrase)}`);
  }

  const expectedSignature = createHash('md5')
    .update(pairs.join('&'))
    .digest('hex')
    .toLowerCase();

  return incomingSignature === expectedSignature;
}

/**
 * PayFast process URL
 */
export function getPayFastProcessUrl(mode: PayFastMode): string {
  return mode === 'live'
    ? 'https://www.payfast.co.za/eng/process'
    : 'https://sandbox.payfast.co.za/eng/process';
}

/**
 * Normalize payment status
 */
export function mapPayFastPaymentStatus(
  value: string
): 'paid' | 'pending' | 'failed' {
  const normalized = value?.trim().toUpperCase();

  if (normalized === 'COMPLETE') return 'paid';

  if (normalized === 'FAILED' || normalized === 'CANCELLED') {
    return 'failed';
  }

  return 'pending';
}