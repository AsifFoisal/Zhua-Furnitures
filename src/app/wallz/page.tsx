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
        { label: 'Request a Quote', href: '/contact' },
        { label: 'Book a Site Measurement', href: '/book-installation', variant: 'outline' },
      ]}
      highlights={[
        {
          title: 'Feature Walls',
          description: 'Statement walls that anchor the room and set the tone.',
        },
        {
          title: 'TV & Media Walls',
          description: 'Media walls with clean integration, shelving and finishes built around your screen.',
        },
        {
          title: 'Slat Walls',
          description: 'Warm, rhythmic linear panelling for living spaces and bedrooms.',
        },
        {
          title: 'Decorative Wall Panels',
          description: 'Patterned and textured panels with depth and character.',
        },
        {
          title: 'Accent Walls',
          description: 'Single walls, done properly — texture and colour that change the whole room.',
        },
        {
          title: 'Custom Wall Finishes',
          description: 'Cladding, panelling and finishes tailored to your space, installed by our team.',
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
