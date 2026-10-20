import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MessageCircle, CalendarCheck, Images, GitCompareArrows } from 'lucide-react';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import { homeImagery } from '@/lib/home-imagery';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Wallz & Deckz — Feature Walls, Panelling & Custom Decking | ZHUA',
  description:
    'WALLZ & DECKZ by ZHUA: feature walls, TV/media walls, slat walls, decorative panels, accent walls, wooden & composite decking, outdoor platforms and custom deck designs — built, finished and installed.',
};

const wallzServices = [
  {
    title: 'Feature Walls',
    description: 'Statement walls that anchor the room and set the tone for everything around them.',
  },
  {
    title: 'TV & Media Walls',
    description: 'Media walls with clean cable integration, shelving and finishes made to frame your screen.',
  },
  {
    title: 'Slat Walls',
    description: 'Warm, rhythmic linear slat panelling for living rooms, bedrooms and passages.',
  },
  {
    title: 'Decorative Wall Panels',
    description: 'Patterned and textured panels that add depth and character to plain walls.',
  },
  {
    title: 'Accent Walls',
    description: 'A single wall, done properly — colour, texture and proportion chosen to lift the whole space.',
  },
  {
    title: 'Custom Wall Finishes',
    description: 'Cladding, panelling and finishes tailored to your space, measured and installed by our team.',
  },
];

const deckzServices = [
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
    description: 'Raised platforms and levelled outdoor surfaces that make awkward spaces usable.',
  },
  {
    title: 'Patio & Deck Areas',
    description: 'Patios and deck zones designed around dining, lounging and entertaining.',
  },
  {
    title: 'Custom Deck Designs',
    description: 'Decks shaped around your home — pool surrounds, balconies, entertainment areas.',
  },
];

const finishOptions = {
  wallz: [
    'Wood-look slat panelling',
    'MDF & PVC decorative panels',
    'Acoustic slat panels',
    'Laminate & veneer cladding',
    'UV-printed & fluted panels',
    'Painted & textured finishes',
  ],
  deckz: [
    'Hardwood decking',
    'Composite deck boards',
    'Treated pine decking',
    'Deck lighting integration',
    'Non-slip & pool-safe finishes',
    'Oil, seal & stain options',
  ],
};

export default function WallzDeckzPage() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <span className="label-accent">WALLZ &amp; DECKZ by ZHUA</span>
            <h1 className={styles.title}>
              Walls &amp; Decks, Built In
            </h1>
            <p className={styles.description}>
              The construction side of a complete ZHUA space: feature walls, panelling and custom
              finishes inside — decks, platforms and outdoor rooms outside. Measured, built and
              installed by our own team.
            </p>
            <div className={styles.ctaGroup}>
              <Link href="/contact" className="btn btn-primary">
                Request a Quote <ArrowRight size={16} />
              </Link>
              <Link href="/book-installation" className="btn btn-outline">
                <CalendarCheck size={16} /> Book a Site Measurement
              </Link>
            </div>
          </div>
          <div className={styles.heroStack}>
            <div className={styles.heroVisual}>
              <ImagePlaceholder slot={homeImagery.divisionWallz} loading="eager" />
            </div>
            <div className={styles.heroVisualSecondary}>
              <ImagePlaceholder slot={homeImagery.divisionDeckz} loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* WALLZ */}
      <section className={`section ${styles.serviceSection}`}>
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="label-accent">WALLZ</span>
            <h2 className={styles.sectionTitle}>Feature Walls &amp; Wall Construction</h2>
            <p className={styles.sectionLede}>
              Wall installations that change how a room feels — from a single accent wall to a full
              media wall with integrated storage and finishes.
            </p>
          </div>
          <div className={styles.grid}>
            {wallzServices.map((item) => (
              <div key={item.title} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
          <div className={styles.sectionFoot}>
            <Link href="/wallz" className={styles.textLink}>
              See WALLZ in real spaces <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* DECKZ */}
      <section className={`section ${styles.serviceSectionAlt}`}>
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="label-accent">DECKZ</span>
            <h2 className={styles.sectionTitle}>Decking &amp; Outdoor Installations</h2>
            <p className={styles.sectionLede}>
              Decks and outdoor spaces built to the same standard we bring indoors — designed around
              how you entertain, relax and live outside.
            </p>
          </div>
          <div className={styles.grid}>
            {deckzServices.map((item) => (
              <div key={item.title} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
          <div className={styles.sectionFoot}>
            <Link href="/deckz" className={styles.textLink}>
              See DECKZ in real spaces <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Materials & Finishes */}
      <section className={`section ${styles.finishSection}`}>
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="label-accent">Materials &amp; Finishes</span>
            <h2 className={styles.sectionTitle}>Choose the Look, We Handle the Build</h2>
            <p className={styles.sectionLede}>
              Every install starts with the right material for the space and the budget. These are
              the options we work with most — tell us what you&apos;re picturing and we&apos;ll
              confirm what&apos;s possible.
            </p>
          </div>
          <div className={styles.finishGrid}>
            <div className={styles.finishCard}>
              <h3>WALLZ finishes</h3>
              <ul>
                {finishOptions.wallz.map((option) => (
                  <li key={option}>{option}</li>
                ))}
              </ul>
            </div>
            <div className={styles.finishCard}>
              <h3>DECKZ materials</h3>
              <ul>
                {finishOptions.deckz.map((option) => (
                  <li key={option}>{option}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Before & After / Gallery / Measurement */}
      <section className={`section-sm ${styles.exploreSection}`}>
        <div className={`container ${styles.exploreGrid}`}>
          <Link href="/projects" className={styles.exploreCard}>
            <GitCompareArrows size={22} />
            <h3>Before &amp; After Projects</h3>
            <p>See full transformations — walls, decks and complete spaces — in our project gallery.</p>
            <span className={styles.exploreLink}>
              View projects <ArrowRight size={14} />
            </span>
          </Link>
          <Link href="/gallery" className={styles.exploreCard}>
            <Images size={22} />
            <h3>Gallery</h3>
            <p>Browse finished WALLZ and DECKZ installations alongside our furniture and curtain work.</p>
            <span className={styles.exploreLink}>
              Open the gallery <ArrowRight size={14} />
            </span>
          </Link>
          <Link href="/book-installation" className={styles.exploreCard}>
            <CalendarCheck size={22} />
            <h3>Book a Site Measurement</h3>
            <p>We come to you, measure the space properly, and quote from real numbers — not guesses.</p>
            <span className={styles.exploreLink}>
              Book a visit <ArrowRight size={14} />
            </span>
          </Link>
        </div>
      </section>

      {/* Quote band */}
      <section className={`section-sm ${styles.quoteBand}`}>
        <div className={`container ${styles.quoteInner}`}>
          <div>
            <h2 className={styles.quoteTitle}>Ready to build?</h2>
            <p className={styles.quoteText}>
              Tell us about your walls or your outdoor space — we&apos;ll measure, advise and quote.
            </p>
          </div>
          <div className={styles.quoteActions}>
            <Link href="/contact" className="btn btn-primary">
              Get a Quote <ArrowRight size={16} />
            </Link>
            <Link href="/book-installation" className="btn btn-outline">
              <CalendarCheck size={16} /> Book Site Measurement
            </Link>
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
            >
              <MessageCircle size={16} /> WhatsApp ZHUA
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
