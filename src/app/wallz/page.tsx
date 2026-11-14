import type { Metadata } from 'next';
import DivisionLanding from '@/components/pages/DivisionLanding';
import WallzDeckzCatalog from '@/components/catalog/WallzDeckzCatalog';
import { homeImagery } from '@/lib/home-imagery';
import { getDivisionItems, toCatalogEntries } from '@/lib/division-items';
import { getCuratedCatalogEntries, type CatalogEntry } from '@/lib/wallz-deckz-catalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'WALLZ — Feature Walls & Wall Panelling',
  description:
    'WALLZ by ZHUA: completed feature wall projects and pre-designed concepts — TV & media walls, timber slat panels, wallpaper designs, decorative cladding and modern wall finishes, quoted transparently in ZAR.',
};

export default async function WallzPage() {
  // Admin-managed completed work (division_items) renders alongside the
  // curated catalog; if the table isn't live yet the curated data stands alone.
  const { items, source } = await getDivisionItems('wallz');
  const entries: CatalogEntry[] =
    source === 'database'
      ? [...getCuratedCatalogEntries('wallz'), ...toCatalogEntries(items)]
      : getCuratedCatalogEntries('wallz');

  return (
    <DivisionLanding
      eyebrow="WALLZ by ZHUA"
      title={<>Give Your Walls a <span className="heading-accent">New Identity</span></>}
      description="Feature walls, decorative panelling and wall finishes designed to transform ordinary spaces into statement spaces."
      note="Every catalog item can be customized to your space — request a quote from any detail and we'll confirm what's possible."
      visual={homeImagery.divisionWallz}
      showHero={false}
      ctas={[
        { label: 'Request a Quote', href: '/contact' },
        { label: 'Book a Site Measurement', href: '/book-installation', variant: 'outline' },
      ]}
      highlights={[
        {
          title: 'TV & Media Walls',
          description: 'Media walls with clean integration, shelving and finishes built around your screen.',
        },
        {
          title: 'Wooden & Timber Slat Panels',
          description: 'Warm, rhythmic linear panelling for living spaces and bedrooms.',
        },
        {
          title: 'Wallpaper Designs',
          description: 'Premium wallcoverings paired with panel reveals for a layered look.',
        },
        {
          title: 'Decorative Wall Cladding',
          description: 'Patterned and textured panels with depth and character.',
        },
        {
          title: 'Modern Wall Finishes',
          description: 'Contemporary finishes and materials, installed by our own team.',
        },
        {
          title: 'Fully Customizable',
          description: 'Start from a completed project or a pre-designed concept — we tailor either to your space.',
        },
      ]}
    >
      <WallzDeckzCatalog
        eyebrow="WALLZ Catalog"
        title="Completed Projects & Ready-to-Customize Concepts"
        lede="Browse real WALLZ installations for proven craftsmanship, or start from a pre-designed concept and customize it to your space — every item shows materials, finishes and transparent ZAR pricing."
        entries={entries}
        emptyNote="No WALLZ items match this filter — tell us what you're envisioning and we'll make yours the first."
      />
    </DivisionLanding>
  );
}
