import 'server-only';
import crypto from 'node:crypto';
import { getCloudinaryEnv } from '@/lib/supabase/env';

const allowedFolders = [
  'zhua/products',
  'zhua/content',
  'zhua/gallery',
  'zhua/testimonials',
  'zhua/curtain-customizer',
] as const;

function isAllowedFolder(folder: string): boolean {
  return allowedFolders.some((base) => folder === base || folder.startsWith(`${base}/`));
}

function buildSignature(params: Record<string, string | number>, apiSecret: string): string {
  const toSign = Object.entries(params)
    .filter(([, value]) => value !== '' && value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return crypto.createHash('sha1').update(`${toSign}${apiSecret}`).digest('hex');
}

export function createUploadSignature(options: { folder: string; publicId: string }) {
  const folder = options.folder.trim();
  const publicId = options.publicId.trim();

  if (!isAllowedFolder(folder)) {
    throw new Error('Folder is not allowed.');
  }

  if (!publicId || publicId.includes('..')) {
    throw new Error('Invalid public ID.');
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryEnv();
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = buildSignature(
    {
      folder,
      public_id: publicId,
      timestamp,
    },
    apiSecret
  );

  return {
    cloudName,
    apiKey,
    folder,
    publicId,
    timestamp,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  };
}

export async function destroyCloudinaryImage(publicId: string): Promise<{ result: string }> {
  const normalized = publicId.trim();
  if (!normalized || normalized.includes('..')) {
    throw new Error('Invalid public ID.');
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryEnv();
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = buildSignature(
    {
      public_id: normalized,
      timestamp,
      invalidate: 'true',
    },
    apiSecret
  );

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      public_id: normalized,
      timestamp: String(timestamp),
      signature,
      api_key: apiKey,
      invalidate: 'true',
    }),
  });

  const body = (await response.json()) as { result?: string; error?: { message?: string } };

  if (!response.ok || body.error?.message) {
    throw new Error(body.error?.message ?? 'Cloudinary delete request failed.');
  }

  return {
    result: body.result ?? 'unknown',
  };
}

export function buildPublicId(folder: string, baseName: string): string {
  const safeBaseName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return `${folder}/${safeBaseName}-${Date.now()}`;
}
