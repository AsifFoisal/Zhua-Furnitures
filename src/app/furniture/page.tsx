import type { Metadata } from 'next';
import DivisionLanding from '@/components/pages/DivisionLanding';
import { homeImagery } from '@/lib/home-imagery';

export const metadata: Metadata = {
  title: 'Furniture — Custom Sofas, Beds, Dining & Cabinetry',
  description:
    'Custom ZHUA furniture made around your space: sofas and lounges, modular sofas, beds and headboards, dining, TV units, cabinetry, outdoor furniture and reupholstery.',
};

export default function FurniturePage() {
  return (
    <DivisionLanding
      eyebrow="ZHUA Furniture"
      title="Furniture Made Around You"
      description="From statement modular sofas to dining furniture, beds, TV units and custom cabinetry — every ZHUA piece is designed around your space, your style and how you live."
      visual={homeImagery.divisionFurniture}
      ctas={[
        { label: 'Shop Furniture', href: '/shop/furniture' },
        { label: 'Request Custom Furniture', href: '/contact', variant: 'outline' },
      ]}
      highlights={[
        {
          title: 'Sofas & Lounges',
          description: 'Statement pieces, custom sizes, fabrics and configurations.',
        },
        {
          title: 'Modular Sofas',
          description: 'Flexible seating that adapts to your room and your life.',
        },
        {
          title: 'Beds & Headboards',
          description: 'Upholstered beds and headboards made to your dimensions.',
        },
        {
          title: 'Dining',
          description: 'Tables and seating for everyday meals and entertaining.',
        },
        {
          title: 'TV Units & Cabinets',
          description: 'Custom cabinetry and media units tailored to your walls.',
        },
        {
          title: 'Outdoor & Reupholstery',
          description: 'Outdoor furniture and a new lease on life for pieces you love.',
        },
      ]}
    />
  );
}
