import type { Metadata } from 'next';
import HeroSection from '@/components/home/HeroSection';
import OneSpaceOneZhua from '@/components/home/OneSpaceOneZhua';
import FurnitureSection from '@/components/home/FurnitureSection';
import CurtainsBlindsSection from '@/components/home/CurtainsBlindsSection';
import WallzSection from '@/components/home/WallzSection';
import DeckzSection from '@/components/home/DeckzSection';
import FragranceSection from '@/components/home/FragranceSection';
import CompleteYourRoom from '@/components/home/CompleteYourRoom';
import DesignStudioSection from '@/components/home/DesignStudioSection';
import HowItWorks from '@/components/home/HowItWorks';
import AudienceSection from '@/components/home/AudienceSection';
import ProjectsGallery from '@/components/home/ProjectsGallery';
import Testimonials from '@/components/home/Testimonials';
import FinalCTA from '@/components/home/FinalCTA';

export const metadata: Metadata = {
  title: 'Zhua Furniture — Complete Spaces, Made for You | South Africa',
  description:
    'ZHUA creates complete spaces: custom furniture, made-to-measure curtains & blinds, WALLZ feature walls, DECKZ outdoor decking and the ScentaRiva home & business fragrance collection — designed, manufactured and installed across South Africa.',
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <OneSpaceOneZhua />
      <FurnitureSection />
      <CurtainsBlindsSection />
      <WallzSection />
      <DeckzSection />
      <FragranceSection />
      <CompleteYourRoom />
      <DesignStudioSection />
      <HowItWorks />
      <AudienceSection />
      <ProjectsGallery />
      <Testimonials />
      <FinalCTA />
    </>
  );
}
