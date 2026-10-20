import type { Metadata } from 'next';
import DivisionLanding from '@/components/pages/DivisionLanding';
import { homeImagery } from '@/lib/home-imagery';

export const metadata: Metadata = {
  title: 'Curtains & Blinds — Made-to-Measure, Measured & Installed',
  description:
    'Made-to-measure ZHUA curtains and blinds: wave, pinch pleat, eyelet, sheer, blockout, roller, zebra, venetian, roman, vertical and motorised options — professionally measured, manufactured and installed.',
};

export default function CurtainsBlindsPage() {
  return (
    <DivisionLanding
      eyebrow="ZHUA Curtains & Blinds"
      title="Dress Your Windows"
      description="Made-to-measure curtains and blinds, professionally measured, manufactured and installed. You don't have to know exactly what you need — we guide you through the whole process."
      visual={homeImagery.divisionCurtains}
      ctas={[
        { label: 'Design My Curtains', href: '/design-studio/curtain-customizer' },
        { label: 'Shop Curtains & Blinds', href: '/shop/curtains', variant: 'outline' },
        { label: 'Book a Measure & Quote', href: '/book-installation', variant: 'outline' },
      ]}
      highlights={[
        {
          title: 'Wave & Pinch Pleat Curtains',
          description: 'Elegant heading styles tailored to your windows.',
        },
        {
          title: 'Sheers & Blockout',
          description: 'Light control from soft daytime filtering to full blackout.',
        },
        {
          title: 'Double-Layer Solutions',
          description: 'Pair sheers and blockouts on a single, coordinated track.',
        },
        {
          title: 'Roller & Zebra Blinds',
          description: 'Clean, contemporary window coverage for every room.',
        },
        {
          title: 'Venetian, Roman & Vertical',
          description: 'Classic blind styles made to measure.',
        },
        {
          title: 'Motorised Options',
          description: 'Convenient, child-safe operation at the touch of a button.',
        },
      ]}
    />
  );
}
