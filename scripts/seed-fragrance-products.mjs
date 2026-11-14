import { readFile, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  (await readFile('.env.local', 'utf8'))
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const assetMap = JSON.parse(
  await readFile('scripts/fragrance-cloudinary-assets.json', 'utf8')
);

// Real product photos (uploaded via upload-fragrance-photos.mjs) take
// precedence over the illustrated mock assets for machine, reed and bundles.
const photoAssets = JSON.parse(
  await readFile('scripts/fragrance-photo-assets.json', 'utf8')
);

function image(key) {
  const asset = assetMap[key];
  if (!asset) {
    throw new Error(`Missing Cloudinary asset: ${key}`);
  }

  return { ...asset };
}

function photo(filename) {
  const asset = photoAssets[filename];
  if (!asset) {
    throw new Error(`Missing photo asset: ${filename} (run upload-fragrance-photos.mjs first)`);
  }

  return { ...asset };
}

const machineImage = photo('scentariva-machine-photo.jpg');
const amberNoirImage = image('fragrance-oil-amber-noir.jpg');
const whiteTeaImage = image('fragrance-oil-white-tea-fig.jpg');
const oudRoseImage = image('fragrance-oil-oud-rose.jpg');
const coastalImage = image('fragrance-oil-coastal-linen.jpg');
const reedImage = photo('scentariva-absolut-gold-150ml.jpg');
const bundleImage = photo('scentariva-machine-photo.jpg');
const completeImage = photo('scentariva-collection-trio.jpg');

const common = {
  category: 'accessories',
  rating: 5,
  review_count: 0,
  sizes: [],
  fabrics: [],
  in_stock: true,
  is_customizable: false,
  status: 'active',
};

const products = [
  {
    ...common,
    slug: 'zhua-scentariva-smart-commercial-scent-diffuser-machine',
    name: 'ZHUA ScentaRiva Smart Commercial Scent Diffuser Machine',
    subcategory: 'Scent Diffuser Machine',
    price_cents: 449900,
    original_price_cents: null,
    badge: 'new',
    description:
      'A smart, refillable scent diffuser that turns homes, offices, hotels and shops into a consistently beautiful fragrance experience.',
    long_description:
      'Turn every space into a beautiful fragrance experience. Imagine walking into your home, office, hotel or shop and being welcomed by a beautiful, refreshing fragrance.\n\nThe ZHUA ScentaRiva Smart Commercial Scent Diffuser Machine makes this possible. Designed to disperse fragrance automatically, this stylish machine helps create a consistently pleasant atmosphere without having to spray air freshener throughout the day. Its digital control panel lets you adjust the machine’s operating settings to suit your preferred fragrance experience.\n\nWith its sleek matte-black finish, ScentaRiva fits beautifully into modern homes and commercial spaces. Refill it with compatible ZHUA ScentaRiva fragrance oils and enjoy a welcoming atmosphere every day.\n\nYour space creates a first impression before you even say a word. With ZHUA ScentaRiva, make that impression unforgettable.',
    features: [
      'Automatic fragrance distribution — no repeated spraying',
      'Digital control panel with adjustable operating programmes',
      'Refillable with compatible ZHUA ScentaRiva fragrance oils',
      'Sleek matte-black finish for modern interiors',
      'Ideal for homes, offices, hotels, salons, showrooms and restaurants',
      'Commercial-ready ambient scenting',
      'Simple to position, fill and operate',
    ],
    images: [machineImage],
    colors: [{ name: 'Matte Black', hex: '#151412', images: [machineImage] }],
    delivery_days: '3–7 business days',
    stock: 25,
    sku: 'ZH-SCENT-MACH-01',
  },
  {
    ...common,
    slug: 'zhua-amber-noir-fragrance-oil-500ml',
    name: 'ZHUA Amber Noir Fragrance Oil — 500ml Refill',
    subcategory: 'Fragrance Oil Refill',
    price_cents: 39900,
    original_price_cents: null,
    badge: null,
    description:
      'A warm, enveloping blend of amber, oud and vanilla for living rooms, boutiques, lounges and evening spaces.',
    long_description:
      'Amber Noir is a rich, warming signature scent built around golden amber, smoky oud and soft vanilla. It creates an immediate sense of arrival — intimate, polished and memorable.\n\nFormulated for use with the ZHUA ScentaRiva Smart Commercial Scent Diffuser Machine, each 500ml refill delivers a consistent, long-lasting fragrance experience. Use it in living rooms, reception areas, boutique retail spaces, hotel lounges and anywhere that deserves a warmer atmosphere.',
    features: [
      '500ml fragrance oil refill',
      'Compatible with the ZHUA ScentaRiva diffuser machine',
      'Warm amber, oud and vanilla profile',
      'Ideal for living rooms, lounges, boutiques and reception areas',
      'Consistent, long-lasting ambient fragrance',
    ],
    images: [amberNoirImage],
    colors: [{ name: 'Amber Noir', hex: '#8B4A24', images: [amberNoirImage] }],
    delivery_days: '3–7 business days',
    stock: 60,
    sku: 'ZH-SCENT-OIL-AN',
  },
  {
    ...common,
    slug: 'zhua-white-tea-fig-fragrance-oil-500ml',
    name: 'ZHUA White Tea & Fig Fragrance Oil — 500ml Refill',
    subcategory: 'Fragrance Oil Refill',
    price_cents: 39900,
    original_price_cents: null,
    badge: null,
    description:
      'A clean, calm blend of white tea, ripe fig and cedar for homes, spas, offices and light-filled reception spaces.',
    long_description:
      'White Tea & Fig is an airy, refined signature scent that balances delicate white tea with the green sweetness of ripe fig and a soft cedar base. It feels fresh without being sharp — calm, cultured and quietly luxurious.\n\nFormulated for use with the ZHUA ScentaRiva Smart Commercial Scent Diffuser Machine, each 500ml refill delivers consistent, long-lasting fragrance. Use it in living rooms, treatment rooms, boutiques, offices and reception areas where a clean, welcoming first impression matters.',
    features: [
      '500ml fragrance oil refill',
      'Compatible with the ZHUA ScentaRiva diffuser machine',
      'Fresh white tea, fig and cedar profile',
      'Ideal for spas, offices, homes and reception areas',
      'Consistent, long-lasting ambient fragrance',
    ],
    images: [whiteTeaImage],
    colors: [{ name: 'White Tea & Fig', hex: '#8A8B68', images: [whiteTeaImage] }],
    delivery_days: '3–7 business days',
    stock: 60,
    sku: 'ZH-SCENT-OIL-WT',
  },
  {
    ...common,
    slug: 'zhua-oud-rose-fragrance-oil-500ml',
    name: 'ZHUA Oud & Rose Fragrance Oil — 500ml Refill',
    subcategory: 'Fragrance Oil Refill',
    price_cents: 39900,
    original_price_cents: null,
    badge: null,
    description:
      'An opulent rose, oud and patchouli blend for hotels, salons, formal dining rooms and memorable retail experiences.',
    long_description:
      'Oud & Rose is a deep, romantic signature scent that pairs velvety rose with smoky oud and earthy patchouli. It brings warmth and a sense of occasion to any interior.\n\nFormulated for use with the ZHUA ScentaRiva Smart Commercial Scent Diffuser Machine, each 500ml refill delivers a consistent, long-lasting fragrance experience. Use it in hotel suites, salons, formal dining rooms, boutiques and other spaces where you want a rich, unmistakable signature.',
    features: [
      '500ml fragrance oil refill',
      'Compatible with the ZHUA ScentaRiva diffuser machine',
      'Rose, oud and patchouli profile',
      'Ideal for hotels, salons, dining rooms and boutiques',
      'Consistent, long-lasting ambient fragrance',
    ],
    images: [oudRoseImage],
    colors: [{ name: 'Oud & Rose', hex: '#74323F', images: [oudRoseImage] }],
    delivery_days: '3–7 business days',
    stock: 60,
    sku: 'ZH-SCENT-OIL-OR',
  },
  {
    ...common,
    slug: 'zhua-coastal-linen-fragrance-oil-500ml',
    name: 'ZHUA Coastal Linen Fragrance Oil — 500ml Refill',
    subcategory: 'Fragrance Oil Refill',
    price_cents: 39900,
    original_price_cents: null,
    badge: null,
    description:
      'A crisp blend of sea salt, linen and driftwood for offices, homes, holiday rentals and relaxed retail spaces.',
    long_description:
      'Coastal Linen is a fresh, sunlit signature scent that combines sea salt, clean linen and soft driftwood. It brings an easy, open-air feeling to interiors — crisp, relaxed and instantly welcoming.\n\nFormulated for use with the ZHUA ScentaRiva Smart Commercial Scent Diffuser Machine, each 500ml refill delivers a consistent, long-lasting fragrance experience. Use it in offices, homes, holiday rentals, showrooms and relaxed retail environments.',
    features: [
      '500ml fragrance oil refill',
      'Compatible with the ZHUA ScentaRiva diffuser machine',
      'Fresh sea salt, linen and driftwood profile',
      'Ideal for offices, homes, rentals and showrooms',
      'Consistent, long-lasting ambient fragrance',
    ],
    images: [coastalImage],
    colors: [{ name: 'Coastal Linen', hex: '#5F7E86', images: [coastalImage] }],
    delivery_days: '3–7 business days',
    stock: 60,
    sku: 'ZH-SCENT-OIL-CL',
  },
  {
    ...common,
    slug: 'zhua-scentariva-home-business-bundle',
    name: 'ZHUA ScentaRiva Home & Business Bundle — Machine + 2 Oils',
    subcategory: 'Scent Bundle',
    price_cents: 499900,
    original_price_cents: 529700,
    badge: 'bestseller',
    description:
      'The complete ScentaRiva starter set: the smart diffuser machine plus two 500ml signature oils — Amber Noir and White Tea & Fig.',
    long_description:
      'The easiest way to begin your ZHUA ScentaRiva experience. This bundle pairs the Smart Commercial Scent Diffuser Machine with two of our most-loved 500ml signature fragrance oils: the warm, enveloping Amber Noir and the clean, calm White Tea & Fig.\n\nOne machine, two moods. Use Amber Noir in living rooms and lounges for warmth, and White Tea & Fig in reception areas, offices or bedrooms for a fresh, welcoming atmosphere. The bundle saves R298 compared with buying each item separately.\n\nIncludes:\n• 1 × ZHUA ScentaRiva Smart Commercial Scent Diffuser Machine\n• 1 × ZHUA Amber Noir Fragrance Oil 500ml\n• 1 × ZHUA White Tea & Fig Fragrance Oil 500ml',
    features: [
      'ScentaRiva Smart Commercial Scent Diffuser Machine included',
      'Two 500ml signature fragrance oils included',
      'Amber Noir — warm amber, oud and vanilla',
      'White Tea & Fig — fresh white tea, fig and cedar',
      'Save R298 compared with buying separately',
      'Ready for homes, offices and commercial spaces',
    ],
    images: [bundleImage],
    colors: [{ name: 'Signature Pairing', hex: '#B59241', images: [bundleImage] }],
    delivery_days: '3–7 business days',
    stock: 15,
    sku: 'ZH-SCENT-BUNDLE-02',
  },
  {
    ...common,
    slug: 'zhua-absolut-gold-150ml-reed-diffuser',
    name: 'ZHUA Absolut Gold 150ml Reed Diffuser',
    subcategory: 'Reed Diffuser',
    price_cents: 44900,
    original_price_cents: null,
    badge: 'new',
    description:
      'A flameless, continuously diffusing Absolut Gold reed diffuser in a 150ml gold-toned vessel — the finishing touch for any scented space.',
    long_description:
      'Absolut Gold is a warm, polished home fragrance designed to diffuse continuously without electricity or flames. The natural reeds draw fragrance up from the 150ml vessel and release it gently into the room, creating a subtle, welcoming atmosphere.\n\nPlace it in a hallway, bathroom, bedroom, office or reception area. For a more intense scent, turn the reeds after the first day. Absolut Gold is also the perfect low-maintenance companion to the ScentaRiva machine — use the machine for larger spaces and the reed diffuser for quiet corners, guest bathrooms and bedside tables.',
    features: [
      '150ml reed diffuser',
      'Flameless, continuous fragrance diffusion',
      'Natural reeds included',
      'Ideal for hallways, bedrooms, bathrooms and reception desks',
      'Pairs with the ScentaRiva machine for a complete scent story',
      'No electricity or plumbing required',
    ],
    images: [reedImage],
    colors: [{ name: 'Absolut Gold', hex: '#B58A3F', images: [reedImage] }],
    delivery_days: '3–7 business days',
    stock: 40,
    sku: 'ZH-SCENT-REED-AG',
  },
  {
    ...common,
    slug: 'zhua-complete-scent-collection',
    name: 'ZHUA Complete Home & Business Scent Collection',
    subcategory: 'Scent Bundle',
    price_cents: 529900,
    original_price_cents: 574600,
    badge: 'bestseller',
    description:
      'The full ZHUA scent story: ScentaRiva machine, two 500ml signature oils and the Absolut Gold 150ml reed diffuser — saving R447.',
    long_description:
      'Our most complete fragrance collection brings the ScentaRiva machine, two signature 500ml oils and the Absolut Gold reed diffuser together in one beautifully considered set.\n\nThe machine creates a consistent, automatic fragrance experience in larger rooms, while the reed diffuser adds a quiet layer of Absolut Gold to hallways, guest bathrooms and bedside tables. Use Amber Noir for warmth and Oud & Rose for a richer, more formal atmosphere.\n\nIncludes:\n• 1 × ZHUA ScentaRiva Smart Commercial Scent Diffuser Machine\n• 1 × ZHUA Amber Noir Fragrance Oil 500ml\n• 1 × ZHUA Oud & Rose Fragrance Oil 500ml\n• 1 × ZHUA Absolut Gold 150ml Reed Diffuser\n\nThe complete collection saves R447 compared with buying each item separately.',
    features: [
      'ScentaRiva Smart Commercial Scent Diffuser Machine included',
      'Two 500ml signature fragrance oils included',
      'Absolut Gold 150ml reed diffuser included',
      'Amber Noir and Oud & Rose scent profiles',
      'Save R447 compared with buying separately',
      'A complete fragrance wardrobe for home or business',
    ],
    images: [completeImage],
    colors: [{ name: 'Complete Collection', hex: '#B59241', images: [completeImage] }],
    delivery_days: '3–7 business days',
    stock: 10,
    sku: 'ZH-SCENT-COLLECTION-01',
  },
];

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { data, error } = await supabase
  .from('products')
  .upsert(products, { onConflict: 'slug' })
  .select('slug, name, price_cents, status');

if (error) {
  throw new Error(error.message);
}

for (const row of data ?? []) {
  console.log(`${row.slug} — R${Math.round(row.price_cents / 100)} — ${row.status}`);
}

function sqlValue(value) {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (Array.isArray(value)) {
    return `array[${value.map((entry) => `${sqlValue(entry)}`).join(',')}]::text[]`;
  }

  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlColumnValue(column, value) {
  if (column === 'images' || column === 'colors') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }

  return sqlValue(value);
}

const rows = products
  .map((product) => {
    const columns = [
      'slug',
      'name',
      'category',
      'subcategory',
      'price_cents',
      'original_price_cents',
      'rating',
      'review_count',
      'badge',
      'description',
      'long_description',
      'images',
      'colors',
      'sizes',
      'fabrics',
      'in_stock',
      'is_customizable',
      'delivery_days',
      'features',
      'stock',
      'sku',
      'status',
    ];
    const values = columns.map((column) => sqlColumnValue(column, product[column]));
    return `  (${values.join(',\n    ')})`;
  })
  .join(',\n');

const sql = `-- ZHUA ScentaRiva fragrance collection
-- Products are stored under the existing accessories category so the live
-- storefront schema does not need a category constraint migration.

insert into public.products (
  slug, name, category, subcategory, price_cents, original_price_cents,
  rating, review_count, badge, description, long_description, images, colors,
  sizes, fabrics, in_stock, is_customizable, delivery_days, features, stock, sku, status
) values
${rows}
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  subcategory = excluded.subcategory,
  price_cents = excluded.price_cents,
  original_price_cents = excluded.original_price_cents,
  rating = excluded.rating,
  review_count = excluded.review_count,
  badge = excluded.badge,
  description = excluded.description,
  long_description = excluded.long_description,
  images = excluded.images,
  colors = excluded.colors,
  sizes = excluded.sizes,
  fabrics = excluded.fabrics,
  in_stock = excluded.in_stock,
  is_customizable = excluded.is_customizable,
  delivery_days = excluded.delivery_days,
  features = excluded.features,
  stock = excluded.stock,
  sku = excluded.sku,
  status = excluded.status,
  updated_at = timezone('utc', now());
`;

await writeFile('supabase/migrations/20261113_0016_fragrance_collection.sql', sql);
console.log('Wrote fragrance collection migration.');
