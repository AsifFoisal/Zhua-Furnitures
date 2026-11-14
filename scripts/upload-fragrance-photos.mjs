import { readFile, writeFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';

// Uploads the real ScentaRiva product photos to Cloudinary under NEW public
// ids (the illustrated mock assets keep their own ids so nothing is
// overwritten) and records the result in a separate asset map.

const env = Object.fromEntries(
  (await readFile('.env.local', 'utf8'))
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const cloudName = env.CLOUDINARY_CLOUD_NAME;
const apiKey = env.CLOUDINARY_API_KEY;
const apiSecret = env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error('Cloudinary environment is incomplete.');
}

const assets = [
  ['scentariva-machine-photo.jpg', 'scentariva-machine-photo', 'ScentaRiva smart commercial scent diffuser machine in matte black on a kitchen counter'],
  ['scentariva-collection-trio.jpg', 'scentariva-collection-trio', 'ScentaRiva reed diffuser collection — ZHUA Signature, Vertical Pulse and Absolut Gold'],
  ['scentariva-absolut-gold-150ml.jpg', 'scentariva-absolut-gold-150ml', 'Absolut Gold 150ml ScentaRiva reed diffuser with gold cap and gift box'],
  ['scentariva-vertical-pulse-150ml.jpg', 'scentariva-vertical-pulse-150ml', 'Vertical Pulse 150ml ScentaRiva reed diffuser with gold cap and gift box'],
  ['scentariva-zhua-signature-150ml.jpg', 'scentariva-zhua-signature-150ml', 'ZHUA Signature 150ml ScentaRiva reed diffuser with gold cap and gift box'],
];

function signature(params, secret) {
  const toSign = Object.entries(params)
    .filter(([, value]) => value !== '' && value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return crypto.createHash('sha1').update(`${toSign}${secret}`).digest('hex');
}

const existing = JSON.parse(
  await readFile('scripts/fragrance-photo-assets.json', 'utf8').catch(() => '{}')
);

const results = { ...existing };
for (const [filename, publicId, alt] of assets) {
  const folder = 'zhua/products/fragrance';
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    folder,
    public_id: publicId,
    timestamp,
    overwrite: 'true',
    invalidate: 'true',
  };
  const form = new FormData();
  form.append('file', new Blob([await readFile(path.join('public/images/fragrance', filename))]), filename);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('public_id', publicId);
  form.append('overwrite', 'true');
  form.append('invalidate', 'true');
  form.append('signature', signature(params, apiSecret));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const body = await response.json();
  if (!response.ok || body.error) {
    throw new Error(`${filename}: ${body.error?.message ?? 'Cloudinary upload failed'}`);
  }

  results[filename] = {
    publicId: body.public_id,
    secureUrl: body.secure_url,
    alt,
    width: body.width,
    height: body.height,
    format: body.format,
    bytes: body.bytes,
    createdAt: body.created_at,
  };
  console.log(`Uploaded ${filename} -> ${body.secure_url}`);
}

await writeFile('scripts/fragrance-photo-assets.json', `${JSON.stringify(results, null, 2)}\n`);
console.log('Saved photo asset map.');
