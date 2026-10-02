import type { Metadata } from 'next';
import DivisionLanding from '@/components/pages/DivisionLanding';
import DivisionShowcase from '@/components/pages/DivisionShowcase';
import { homeImagery } from '@/lib/home-imagery';
import { getDivisionItems } from '@/lib/division-items';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'DECKZ — Custom Decking & Outdoor Spaces',
  description:
    'DECKZ by ZHUA: custom decking and outdoor spaces — residential decking, pool decks, entertainment areas, patios and balconies designed for living outdoors.',
};

export default async function DeckzPage() {
  const { items, source } = await getDivisionItems('deckz');

  return (
    <DivisionLanding
      eyebrow="DECKZ by ZHUA"
      title="Take Your Living Outdoors"
      description="Custom decking and outdoor spaces designed for entertaining, relaxing and living — built to the same standard we bring to every ZHUA interior."
      visual={homeImagery.divisionDeckz}
      ctas={[
        { label: 'Request a Quote', href: '/contact' },
        { label: 'Book a Site Measurement', href: '/book-installation', variant: 'outline' },
      ]}
      highlights={[
        {
          title: 'Wooden Decking',
          description: 'Timber decks built for South African weather, sealed and finished to last.',
        },
        {
          title: 'Composite Decking',
          description: 'Low-maintenance composite boards with the look of wood and none of the upkeep.',
        },
        {
          title: 'Outdoor Platforms',
          description: 'Raised platforms and levelled surfaces that make awkward spaces usable.',
        },
        {
          title: 'Patio & Deck Areas',
          description: 'Patios and deck zones designed around dining, lounging and entertaining.',
        },
        {
          title: 'Custom Deck Designs',
          description: 'Decks shaped around your home — pool surrounds, balconies, entertainment areas.',
        },
        {
          title: 'Built-In Seating & Finishes',
          description: 'Integrated seating, lighting and finishes that complete the outdoor room.',
        },
      ]}
    >
      <DivisionShowcase
        eyebrow="DECKZ in Real Spaces"
        title="Recent DECKZ Work"
        lede="Decks and outdoor spaces built by the ZHUA team — from pool surrounds to full entertainment areas."
        items={items}
        source={source}
        motif="deck"
        emptyNote="No published DECKZ items yet — request a quote and yours could be the first."
      />
    </DivisionLanding>
  );
}
