import type { Metadata } from 'next';
import DivisionLanding from '@/components/pages/DivisionLanding';
import WallzDeckzCatalog from '@/components/catalog/WallzDeckzCatalog';
import { homeImagery } from '@/lib/home-imagery';
import { getDivisionItems, toCatalogEntries } from '@/lib/division-items';
import { getCuratedCatalogEntries, type CatalogEntry } from '@/lib/wallz-deckz-catalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'DECKZ — Custom Decking & Outdoor Spaces',
  description:
    'DECKZ by ZHUA: completed decking projects and pre-designed concepts — wooden & composite decks, outdoor patios, pergolas, pool decks and entertainment areas, quoted transparently in ZAR.',
};

export default async function DeckzPage() {
  // Admin-managed completed work (division_items) renders alongside the
  // curated catalog; if the table isn't live yet the curated data stands alone.
  const { items, source } = await getDivisionItems('deckz');
  const entries: CatalogEntry[] =
    source === 'database'
      ? [...getCuratedCatalogEntries('deckz'), ...toCatalogEntries(items)]
      : getCuratedCatalogEntries('deckz');

  return (
    <DivisionLanding
      eyebrow="DECKZ by ZHUA"
      title={<>Take Your Living <span className="heading-accent">Outdoors</span></>}
      description="Custom decking and outdoor spaces designed for entertaining, relaxing and living — built to the same standard we bring to every ZHUA interior."
      note="Every catalog item can be customized to your space — request a quote from any detail and we'll confirm what's possible."
      visual={homeImagery.divisionDeckz}
      ctas={[
        { label: 'Request a Quote', href: '/contact' },
        { label: 'Book a Site Measurement', href: '/book-installation', variant: 'outline' },
      ]}
      highlights={[
        {
          title: 'Wooden & Composite Decks',
          description: 'Timber decks built for South African weather — or composite for zero-upkeep.',
        },
        {
          title: 'Outdoor Patios',
          description: 'Patios and deck zones designed around dining, lounging and entertaining.',
        },
        {
          title: 'Pergolas',
          description: 'Shaded structures with fixed or adjustable louvre roofs.',
        },
        {
          title: 'Pool Decks',
          description: 'Barefoot-friendly surrounds rated for wet zones and chlorinated water.',
        },
        {
          title: 'Entertainment Areas',
          description: 'Multi-level decks, braai counters and built-in seating that complete the outdoor room.',
        },
        {
          title: 'Fully Customizable',
          description: 'Start from a completed project or a pre-designed concept — we tailor either to your space.',
        },
      ]}
    >
      <WallzDeckzCatalog
        eyebrow="DECKZ Catalog"
        title="Completed Projects & Ready-to-Customize Concepts"
        lede="Browse real DECKZ installations for proven craftsmanship, or start from a pre-designed concept and customize it to your space — every item shows materials, finishes and transparent ZAR pricing."
        entries={entries}
        emptyNote="No DECKZ items match this filter — request a quote and yours could be the first."
      />
    </DivisionLanding>
  );
}
