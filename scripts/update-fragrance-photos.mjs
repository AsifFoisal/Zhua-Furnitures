import { readFile, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

// Swaps the illustrated mock Cloudinary assets for the real ScentaRiva
// product photos uploaded via upload-fragrance-photos.mjs. The first run
// backs up the previous images/colors values to
// scripts/fragrance-photo-backup.json; later runs leave that backup intact.

const env = Object.fromEntries(
  (await readFile('.env.local', 'utf8'))
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const photoAssets = JSON.parse(
  await readFile('scripts/fragrance-photo-assets.json', 'utf8')
);

function asset(filename) {
  const entry = photoAssets[filename];
  if (!entry) {
    throw new Error(`Missing photo asset: ${filename} (run upload-fragrance-photos.mjs first)`);
  }
  // Full CloudinaryImageAsset shape — the storefront normalizer requires
  // publicId as well as secureUrl.
  return { ...entry };
}

const replacements = {
  'zhua-scentariva-smart-commercial-scent-diffuser-machine': asset('scentariva-machine-photo.jpg'),
  'zhua-absolut-gold-150ml-reed-diffuser': asset('scentariva-absolut-gold-150ml.jpg'),
  'zhua-complete-scent-collection': asset('scentariva-collection-trio.jpg'),
  'zhua-scentariva-home-business-bundle': asset('scentariva-machine-photo.jpg'),
};

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const slugs = Object.keys(replacements);
const { data: products, error } = await supabase
  .from('products')
  .select('id, slug, images, colors')
  .in('slug', slugs);

if (error) {
  throw new Error(error.message);
}

const backupPath = 'scripts/fragrance-photo-backup.json';
try {
  await readFile(backupPath);
  console.log('Backup already exists; leaving it untouched.');
} catch {
  const backup = {};
  for (const product of products ?? []) {
    backup[product.slug] = { images: product.images, colors: product.colors };
  }
  await writeFile(backupPath, `${JSON.stringify(backup, null, 2)}\n`);
  console.log('Backed up current images to scripts/fragrance-photo-backup.json');
}

for (const product of products ?? []) {
  const replacement = replacements[product.slug];
  const newAsset = { ...replacement };

  const images = Array.isArray(product.images) && product.images.length > 0
    ? [newAsset, ...product.images.slice(1)]
    : [newAsset];

  const colors = Array.isArray(product.colors)
    ? product.colors.map((color) =>
        Array.isArray(color?.images) && color.images.length > 0
          ? { ...color, images: [newAsset, ...color.images.slice(1)] }
          : color
      )
    : [];

  const { error: updateError } = await supabase
    .from('products')
    .update({ images, colors })
    .eq('id', product.id);

  if (updateError) {
    throw new Error(`${product.slug}: ${updateError.message}`);
  }

  console.log(`${product.slug} -> ${replacement.secureUrl}`);
}

console.log('Done.');
