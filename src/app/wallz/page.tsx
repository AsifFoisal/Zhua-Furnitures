import type { Metadata } from 'next';
import DivisionLanding from '@/components/pages/DivisionLanding';
import DivisionShowcase from '@/components/pages/DivisionShowcase';
import { homeImagery } from '@/lib/home-imagery';
import { getDivisionItems } from '@/lib/division-items';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'WALLZ — Feature Walls & Wall Panelling',
  description:
    'WALLZ by ZHUA: feature walls, decorative panelling, cladding and wall finishes that transform ordinary spaces into statement spaces.',
};

export default async function WallzPage() {
  const { items, source } = await getDivisionItems('wallz');

  return (
    <DivisionLanding
      eyebrow="WALLZ by ZHUA"
      title="Give Your Walls a New Identity"
      description="Feature walls, decorative panelling and wall finishes designed to transform ordinary spaces into statement spaces."
      note="WALLZ offerings are growing — tell us what you're envisioning and we'll confirm what's possible for your space."
      visual={homeImagery.divisionWallz}
      ctas={[
        { label: 'Explore WALLZ Possibilities', href: '/contact' },
        { label: 'Request a Quote', href: '/contact', variant: 'outline' },
      ]}
      highlights={[
        {
          title: 'TV Feature Walls',
          description: 'Make the media wall the centrepiece of the room.',
        },
        {
          title: 'Slat Walls',
          description: 'Warm, rhythmic linear panelling for living spaces.',
        },
        {
          title: 'Decorative Wall Panels',
          description: 'Patterned and textured panels with depth and character.',
        },
        {
          title: 'Wood-Look Cladding',
          description: 'The warmth of timber looks, applied with precision.',
        },
        {
          title: 'Accent & Headboard Walls',
          description: 'Single walls that change the whole feel of a room.',
        },
        {
          title: 'Commercial Installations',
          description: 'Wall solutions for offices, hospitality and retail.',
        },
      ]}
    >
      <DivisionShowcase
        eyebrow="WALLZ in Real Spaces"
        title="Recent WALLZ Work"
        lede="A look at recent feature walls, panelling and finishes completed by the ZHUA team."
        items={items}
        source={source}
        motif="wall"
        emptyNote="No published WALLZ items yet — tell us what you're envisioning and we'll make yours the first."
      />
    </DivisionLanding>
  );
}
