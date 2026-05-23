const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME ?? '';
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY ?? '';
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET ?? '';
const publicCloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
const payfastMerchantId = process.env.PAYFAST_MERCHANT_ID ?? '';
const payfastMerchantKey = process.env.PAYFAST_MERCHANT_KEY ?? '';
const payfastPassphrase = process.env.PAYFAST_PASSPHRASE ?? '';
const payfastReturnUrl = process.env.PAYFAST_RETURN_URL ?? '';
const payfastCancelUrl = process.env.PAYFAST_CANCEL_URL ?? '';
const payfastNotifyUrl = process.env.PAYFAST_NOTIFY_URL ?? '';
const yocoSecretKey = process.env.YOCO_SECRET_KEY ?? '';
const yocoWebhookSecret = process.env.YOCO_WEBHOOK_SECRET ?? '';
const yocoSuccessUrl = process.env.YOCO_SUCCESS_URL ?? '';
const yocoCancelUrl = process.env.YOCO_CANCEL_URL ?? '';
const resendApiKey = process.env.RESEND_API_KEY ?? '';
const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? '';
const publicPayfastMode = process.env.NEXT_PUBLIC_PAYFAST_MODE ?? 'sandbox';
const publicYocoMode = process.env.NEXT_PUBLIC_YOCO_MODE ?? 'sandbox';

export const hasPublicSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
export const hasServiceSupabaseEnv = Boolean(supabaseUrl && supabaseServiceRoleKey);
export const hasCloudinaryEnv = Boolean(
  cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret
);
export const hasPayFastEnv = Boolean(
  payfastMerchantId &&
    payfastMerchantKey &&
    payfastPassphrase &&
    payfastReturnUrl &&
    payfastCancelUrl &&
    payfastNotifyUrl
);
export const hasYocoEnv = Boolean(yocoSecretKey && yocoWebhookSecret);
export const hasResendEnv = Boolean(resendApiKey && resendFromEmail);

function normalizePaymentMode(value: string): 'sandbox' | 'live' {
  return value.trim().toLowerCase() === 'live' ? 'live' : 'sandbox';
}

export function getPublicPayFastMode(): 'sandbox' | 'live' {
  return normalizePaymentMode(publicPayfastMode);
}

export function getPublicSupabaseEnv(): { url: string; anonKey: string } {
  if (!hasPublicSupabaseEnv) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  };
}

export function getServiceSupabaseEnv(): { url: string; serviceRoleKey: string } {
  if (!hasServiceSupabaseEnv) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY.');
  }

  return {
    url: supabaseUrl,
    serviceRoleKey: supabaseServiceRoleKey,
  };
}

export function getAdminEmailAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getCloudinaryEnv(): {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  publicCloudName: string;
} {
  if (!hasCloudinaryEnv) {
    throw new Error('Missing Cloudinary credentials in environment variables.');
  }

  return {
    cloudName: cloudinaryCloudName,
    apiKey: cloudinaryApiKey,
    apiSecret: cloudinaryApiSecret,
    publicCloudName: publicCloudinaryCloudName || cloudinaryCloudName,
  };
}

export function getPayFastEnv(): {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  mode: 'sandbox' | 'live';
} {
  if (!hasPayFastEnv) {
    throw new Error('Missing PayFast credentials in environment variables.');
  }

  return {
    merchantId: payfastMerchantId,
    merchantKey: payfastMerchantKey,
    passphrase: payfastPassphrase,
    returnUrl: payfastReturnUrl,
    cancelUrl: payfastCancelUrl,
    notifyUrl: payfastNotifyUrl,
    mode: getPublicPayFastMode(),
  };
}

export function getYocoEnv(): {
  secretKey: string;
  webhookSecret: string;
  successUrl: string | null;
  cancelUrl: string | null;
  mode: 'sandbox' | 'live';
} {
  if (!hasYocoEnv) {
    throw new Error('Missing Yoco credentials in environment variables.');
  }

  return {
    secretKey: yocoSecretKey,
    webhookSecret: yocoWebhookSecret,
    successUrl: yocoSuccessUrl || null,
    cancelUrl: yocoCancelUrl || null,
    mode: normalizePaymentMode(publicYocoMode),
  };
}

export function getResendEnv(): { apiKey: string; fromEmail: string } {
  if (!hasResendEnv) {
    throw new Error('Missing RESEND_API_KEY or RESEND_FROM_EMAIL.');
  }

  return {
    apiKey: resendApiKey,
    fromEmail: resendFromEmail,
  };
}
