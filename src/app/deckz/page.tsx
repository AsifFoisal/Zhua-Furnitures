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
        { label: 'Explore DECKZ Possibilities', href: '/contact' },
        { label: 'Request a Quote', href: '/contact', variant: 'outline' },
      ]}
      highlights={[
        {
          title: 'Residential Decking',
          description: 'Custom decks sized and shaped around your home.',
        },
        {
          title: 'Pool Decks',
          description: 'Durable, barefoot-friendly surfaces around water.',
        },
        {
          title: 'Entertainment Areas',
          description: 'Purpose-built spaces for hosting and gathering.',
        },
        {
          title: 'Patio Decking',
          description: 'Turn covered patios into true outdoor rooms.',
        },
        {
          title: 'Balcony Decking',
          description: 'Warm underfoot finishes for elevated outdoor corners.',
        },
        {
          title: 'Outdoor Seating Areas',
          description: 'Built-in seating and layouts that invite you to stay.',
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
