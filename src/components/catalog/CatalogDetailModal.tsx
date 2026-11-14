'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  CalendarCheck,
  Clock3,
  Ruler,
  Layers,
  Check,
  Info,
} from 'lucide-react';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import { tileSlot, type ImageryMotif } from '@/lib/home-imagery';
import {
  CATALOG_DIVISION_LABEL,
  CATALOG_KIND_LABEL,
  CATALOG_PRICE_NOTE,
  buildCatalogWhatsAppUrl,
  buildQuoteHref,
  formatZAR,
  type CatalogEntry,
} from '@/lib/wallz-deckz-catalog';
import styles from './CatalogDetailModal.module.css';

interface CatalogDetailModalProps {
  entry: CatalogEntry | null;
  onClose: () => void;
}

function normalizeIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (index < 0) return length - 1;
  if (index >= length) return 0;
  return index;
}

export default function CatalogDetailModal({ entry, onClose }: CatalogDetailModalProps) {
  // `key={entry.id}` on the wrapper resets this state per entry.
  const [activeImage, setActiveImage] = useState(0);
  const [finish, setFinish] = useState<string | null>(null);

  useEffect(() => {
    if (!entry) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [entry, onClose]);

  const quoteHref = useMemo(
    () => (entry ? buildQuoteHref(entry, finish ?? undefined) : ''),
    [entry, finish],
  );
  const whatsappUrl = useMemo(
    () => (entry ? buildCatalogWhatsAppUrl(entry, finish ?? undefined) : ''),
    [entry, finish],
  );

  if (!entry) return null;

  const motif: ImageryMotif = entry.division === 'wallz' ? 'wall' : 'deck';
  const gallery = entry.gallery;
  const safeIndex = normalizeIndex(activeImage, gallery.length);
  const currentImage = gallery[safeIndex];
  const breakdown = entry.costBreakdown;
  const materialsShare =
    breakdown && breakdown.total > 0
      ? Math.round((breakdown.materials / breakdown.total) * 100)
      : 50;

  return createPortal(
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        key={entry.id}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`${entry.title} — full details`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <span className={`${styles.kindBadge} ${entry.kind === 'completed' ? styles.kindCompleted : styles.kindConcept}`}>
            {CATALOG_KIND_LABEL[entry.kind]}
          </span>
          <div className={styles.headerTitle}>
            <span className={styles.headerDivision}>{CATALOG_DIVISION_LABEL[entry.division]}</span>
            <span className={styles.headerCategory}>{entry.category}</span>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </header>

        <div className={styles.body}>
          {/* — Visual gallery — */}
          <div className={styles.gallery}>
            <div className={styles.viewport}>
              {currentImage ? (
                <img
                  src={currentImage.src}
                  alt={currentImage.alt}
                  className={styles.mainImage}
                  loading="lazy"
                />
              ) : (
                <ImagePlaceholder
                  slot={tileSlot(entry.title, motif, entry.category)}
                  showCaption={false}
                  className={styles.mainImage}
                />
              )}

              {gallery.length > 1 ? (
                <>
                  <button
                    type="button"
                    className={`${styles.navButton} ${styles.navLeft}`}
                    onClick={() => setActiveImage(normalizeIndex(safeIndex - 1, gallery.length))}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.navButton} ${styles.navRight}`}
                    onClick={() => setActiveImage(normalizeIndex(safeIndex + 1, gallery.length))}
                    aria-label="Next image"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <span className={styles.counter}>
                    {safeIndex + 1} / {gallery.length}
                  </span>
                </>
              ) : null}
            </div>

            {gallery.length > 1 ? (
              <div className={styles.thumbRail}>
                {gallery.map((image, index) => (
                  <button
                    key={`${image.src}-${index}`}
                    type="button"
                    className={`${styles.thumbButton} ${index === safeIndex ? styles.thumbActive : ''}`}
                    onClick={() => setActiveImage(index)}
                    aria-label={`Show image ${index + 1}`}
                  >
                    <img src={image.src} alt={image.alt} className={styles.thumbImage} loading="lazy" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* — Details — */}
          <div className={styles.details}>
            <div className={styles.detailsScroll}>
              <h2 className={styles.title}>{entry.title}</h2>
              {entry.location || entry.leadTime ? (
                <div className={styles.metaRow}>
                  {entry.location ? (
                    <span className={styles.meta}>
                      <MapPin size={13} /> {entry.location}
                      {entry.completedYear ? ` · ${entry.completedYear}` : ''}
                    </span>
                  ) : null}
                  {entry.leadTime ? (
                    <span className={styles.meta}>
                      <Clock3 size={13} /> {entry.leadTime}
                    </span>
                  ) : null}
                </div>
              ) : null}

              <p className={styles.overview}>{entry.overview}</p>

              {/* — Specifications — */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Layers size={14} /> Specifications &amp; Options
                </h3>

                {entry.dimensions ? (
                  <div className={styles.specRow}>
                    <Ruler size={14} />
                    <div>
                      <span className={styles.specLabel}>
                        {entry.kind === 'concept' ? 'Standard dimensions' : 'Project dimensions'}
                      </span>
                      <span className={styles.specValue}>{entry.dimensions}</span>
                    </div>
                  </div>
                ) : null}

                {entry.materials.length > 0 ? (
                  <div className={styles.specBlock}>
                    <span className={styles.specLabel}>Materials used</span>
                    <ul className={styles.materialList}>
                      {entry.materials.map((material) => (
                        <li key={material}>
                          <Check size={13} /> {material}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {entry.inclusions.length > 0 ? (
                  <div className={styles.specBlock}>
                    <span className={styles.specLabel}>Included with every install</span>
                    <ul className={styles.materialList}>
                      {entry.inclusions.map((inclusion) => (
                        <li key={inclusion}>
                          <Check size={13} /> {inclusion}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {entry.finishes.length > 0 ? (
                  <div className={styles.specBlock}>
                    <span className={styles.specLabel}>Available colours &amp; finishes</span>
                    <div className={styles.swatchRow}>
                      {entry.finishes.map((finishOption) => (
                        <button
                          key={finishOption.name}
                          type="button"
                          className={`${styles.swatch} ${finish === finishOption.name ? styles.swatchActive : ''}`}
                          onClick={() =>
                            setFinish((current) =>
                              current === finishOption.name ? null : finishOption.name,
                            )
                          }
                          aria-pressed={finish === finishOption.name}
                          title={finishOption.name}
                        >
                          <span
                            className={styles.swatchDot}
                            style={{ background: finishOption.hex }}
                          />
                          <span className={styles.swatchName}>{finishOption.name}</span>
                        </button>
                      ))}
                    </div>
                    <p className={styles.swatchHint}>
                      {finish
                        ? `Selected: ${finish} — included in your enquiry.`
                        : 'Tap a finish to include it in your enquiry (optional).'}
                    </p>
                  </div>
                ) : null}
              </section>

              {/* — Cost breakdown — */}
              {breakdown ? (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    <CalendarCheck size={14} /> Transparent Cost Breakdown
                  </h3>
                  <div className={styles.costCard}>
                    <div className={styles.costRow}>
                      <span>Materials &amp; components</span>
                      <span>{formatZAR(breakdown.materials)}</span>
                    </div>
                    <div className={styles.costRow}>
                      <span>Labour &amp; installation</span>
                      <span>{formatZAR(breakdown.labour)}</span>
                    </div>
                    <div className={styles.costBar}>
                      <span
                        className={styles.costBarMaterials}
                        style={{ width: `${materialsShare}%` }}
                        aria-hidden="true"
                      />
                      <span
                        className={styles.costBarLabour}
                        style={{ width: `${100 - materialsShare}%` }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className={styles.costRow}>
                      <span className={styles.costTotalLabel}>Total {entry.kind === 'completed' ? 'project value' : 'estimated budget'}</span>
                      <span className={styles.costTotal}>{formatZAR(breakdown.total)}</span>
                    </div>
                  </div>
                </section>
              ) : (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    <CalendarCheck size={14} /> Pricing
                  </h3>
                  <div className={styles.costCard}>
                    <div className={styles.costRow}>
                      <span>{entry.kind === 'completed' ? 'As-built project value' : 'Estimated budget'}</span>
                      <span className={styles.costTotal}>Price on request</span>
                    </div>
                  </div>
                </section>
              )}

              <p className={styles.priceNote}>
                <Info size={13} /> {CATALOG_PRICE_NOTE}
              </p>
            </div>

            {/* — Conversion actions — */}
            <div className={styles.actionBar}>
              <Link href={quoteHref} className="btn btn-primary btn-sm">
                Customize &amp; Request a Quote
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp btn-sm"
              >
                Enquire on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
