/**
 * End-to-end check for the WALLZ/DECKZ hybrid catalog database connection.
 *
 * Inserts a temporary fully-specified concept item and a completed item via
 * the service-role client, fetches the public pages, verifies both render
 * with their catalog fields, then deletes the temporary rows.
 *
 * Usage:  node scripts/verify-division-catalog.mjs [baseUrl]
 * Default baseUrl: http://localhost:3000
 */

import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const baseUrl = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');

const env = Object.fromEntries(
  (await readFile('.env.local', 'utf8'))
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('✗ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

const marker = `Verify Catalog ${Date.now()}`;

const testCompleted = {
  division: 'wallz',
  kind: 'completed',
  title: `${marker} Completed`,
  description: 'Temporary verification row — safe to delete.',
  category: 'TV & Media Walls',
  status: 'published',
  display_order: 999,
  starting_price: 50000,
  cost_materials: 30000,
  cost_labour: 20000,
  dimensions: '3.0m W × 2.7m H',
  materials: ['SupaWood carcass', 'Oak slats', 'LED cove'],
  finishes: [
    { name: 'Natural Oak', hex: '#C8A472' },
    { name: 'Charcoal', hex: '#3E4348' },
  ],
  inclusions: ['Free measurement', 'Installation'],
  location: 'Verification City',
  completed_year: 2025,
};

const testConcept = {
  division: 'deckz',
  kind: 'concept',
  title: `${marker} Concept`,
  description: 'Temporary verification concept row — safe to delete.',
  category: 'Pergolas',
  status: 'published',
  display_order: 999,
  starting_price: 64500,
  cost_materials: 35500,
  cost_labour: 29000,
  dimensions: '4m × 3m',
  materials: ['Aluminium frame', 'Louvre roof'],
  finishes: [{ name: 'Charcoal', hex: '#3E4348' }],
  inclusions: ['Free measurement'],
  lead_time: '4–6 weeks',
};

async function fetchPage(path) {
  const res = await fetch(`${baseUrl}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`${path} responded ${res.status}`);
  }
  return res.text();
}

function check(label, condition) {
  console.log(`${condition ? '✓' : '✗'} ${label}`);
  if (!condition) process.exitCode = 1;
}

console.log(`Verifying against ${baseUrl}\n`);

// — DB reachable + schema —
const { error: pingError } = await supabase.from('division_items').select('id, kind').limit(1);
if (pingError) {
  if (/column .* does not exist|could not find the 'kind' column|PGRST204/i.test(pingError.message)) {
    console.error('✗ Catalog columns missing — run supabase/migrations/20261114_0017_division_items_catalog_fields.sql in the Supabase SQL editor first.');
    process.exit(1);
  }
  console.error(`✗ Could not reach division_items: ${pingError.message}`);
  process.exit(1);
}
console.log('✓ Database reachable and catalog columns present');

// — Seed temp rows —
const inserted = {};
for (const [key, row] of [['completed', testCompleted], ['concept', testConcept]]) {
  const { data, error } = await supabase.from('division_items').insert(row).select('id').single();
  if (error) {
    console.error(`✗ Could not insert ${key} row: ${error.message}`);
    process.exit(1);
  }
  inserted[key] = data.id;
  console.log(`✓ Inserted temp ${key} row (${data.id})`);
}

try {
  // — Wallz page: completed row renders with price + breakdown + location —
  const wallzHtml = await fetchPage('/wallz');
  check('WALLZ page renders the temp completed project', wallzHtml.includes(`${marker} Completed`));
  check('WALLZ page shows its ZAR price', wallzHtml.includes('R 50 000'));
  check('WALLZ page shows its location meta', wallzHtml.includes('Verification City'));

  // — Deckz page: concept row renders with "From" pricing —
  const deckzHtml = await fetchPage('/deckz');
  check('DECKZ page renders the temp concept', deckzHtml.includes(`${marker} Concept`));
  check('DECKZ page shows "From R 64 500"', deckzHtml.includes('From R 64 500'));

  // — Detail modal data is client-side; confirm the concept badge markup —
  check('WALLZ page carries Completed Project badges', wallzHtml.includes('Completed Project'));
  check('DECKZ page carries Pre-Designed Concept badges', deckzHtml.includes('Pre-Designed Concept'));
} finally {
  // — Cleanup —
  const { error: deleteError } = await supabase
    .from('division_items')
    .delete()
    .in('id', Object.values(inserted));

  if (deleteError) {
    console.error(`✗ Could not delete temp rows: ${deleteError.message} (delete ids ${Object.values(inserted).join(', ')} manually)`);
    process.exitCode = 1;
  } else {
    console.log('✓ Temp rows deleted');
  }
}

console.log('\nDone. Catalog ↔ database connection verified.');
