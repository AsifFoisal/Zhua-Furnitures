'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { formatPrice } from '@/lib/data';
import { toast } from 'sonner';
import { CheckCircle2, MessageCircle, Send } from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import ComingSoonPanel from '@/components/ui/ComingSoonPanel';
import {
  DEFAULT_CURTAIN_CUSTOMIZER_CONFIG,
  normalizeCurtainCustomizerConfig,
  type CurtainCustomizerConfig,
} from '@/lib/curtain-customizer-config';
import styles from './page.module.css';

type QuoteSubmission = {
  reference: string;
  estimateTotal: number;
};

export default function CurtainCustomizerPage() {
  const [config, setConfig] = useState<CurtainCustomizerConfig>(DEFAULT_CURTAIN_CUSTOMIZER_CONFIG);

  // Measurements
  const [width, setWidth] = useState(240);
  const [drop, setDrop] = useState(260);
  const [windows, setWindows] = useState(1);
  const [panelsPerWindow, setPanelsPerWindow] = useState(2);

  // Option selections (by id — resolved against the admin-managed config)
  const [fabricId, setFabricId] = useState(DEFAULT_CURTAIN_CUSTOMIZER_CONFIG.fabrics[0].id);
  const [colorId, setColorId] = useState(DEFAULT_CURTAIN_CUSTOMIZER_CONFIG.colors[0].id);
  const [headingId, setHeadingId] = useState('wave');
  const [layerId, setLayerId] = useState(DEFAULT_CURTAIN_CUSTOMIZER_CONFIG.layers[0].id);
  const [liningId, setLiningId] = useState(DEFAULT_CURTAIN_CUSTOMIZER_CONFIG.linings[0].id);
  const [trackId, setTrackId] = useState(DEFAULT_CURTAIN_CUSTOMIZER_CONFIG.tracks[0].id);
  const [installationId, setInstallationId] = useState(DEFAULT_CURTAIN_CUSTOMIZER_CONFIG.installations[0].id);
  const [doubleTrack, setDoubleTrack] = useState(false);
  const [motorised, setMotorised] = useState(false);

  // Enquiry
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<QuoteSubmission | null>(null);

  // Load the admin-managed configuration (fabrics, prices, headings, etc.)
  useEffect(() => {
    let ignore = false;

    const loadConfig = async () => {
      try {
        const res = await fetch('/api/curtain-customizer-config', { cache: 'no-store' });
        const data = (await res.json()) as { config?: unknown };
        if (!res.ok || !data.config) {
          return;
        }
        if (!ignore) {
          setConfig(normalizeCurtainCustomizerConfig(data.config));
        }
      } catch {
        // Keep the built-in defaults when the config endpoint is unreachable.
      }
    };

    void loadConfig();
    return () => {
      ignore = true;
    };
  }, []);

  const { fabrics, colors, headings, layers, linings, tracks, installations } = config;

  const selectedFabric = fabrics.find((f) => f.id === fabricId) ?? fabrics[0];
  const selectedColor = colors.find((c) => c.id === colorId) ?? colors[0];
  const selectedHeading = headings.find((h) => h.id === headingId) ?? headings[0];
  const selectedLayer = layers.find((l) => l.id === layerId) ?? layers[0];
  const selectedLining = linings.find((l) => l.id === liningId) ?? linings[0];
  const selectedTrack = tracks.find((t) => t.id === trackId) ?? tracks[0];
  const selectedInstallation = installations.find((i) => i.id === installationId) ?? installations[0];

  const estimate = useMemo(() => {
    const fullness = selectedHeading?.fullness ?? 2;
    const safeWidth = Math.max(60, width || 0);
    const safeDrop = Math.max(80, drop || 0);
    const safeWindows = Math.max(1, Math.min(20, windows || 1));
    const safePanels = Math.max(1, Math.min(8, panelsPerWindow || 1));

    const metresPerWindow = +((safeWidth / 100) * fullness * safePanels).toFixed(1);
    const totalMetres = +(metresPerWindow * safeWindows).toFixed(1);
    const trackLengthPerWindow = Math.ceil(((safeWidth / 100) * 1.1 + 0.3) * 10) / 10;
    const trackSets = doubleTrack ? 2 : 1;

    const lines = [
      {
        label: `Main fabric (${totalMetres}m @ ${formatPrice(selectedFabric.pricePerMetre)}/m)`,
        amount: Math.round(totalMetres * selectedFabric.pricePerMetre),
      },
      ...(selectedLayer.pricePerMetre > 0
        ? [
            {
              label: `${selectedLayer.name} underlay (${totalMetres}m @ ${formatPrice(selectedLayer.pricePerMetre)}/m)`,
              amount: Math.round(totalMetres * selectedLayer.pricePerMetre),
            },
          ]
        : []),
      ...(selectedLining.pricePerMetre > 0
        ? [
            {
              label: `${selectedLining.name} (${totalMetres}m @ ${formatPrice(selectedLining.pricePerMetre)}/m)`,
              amount: Math.round(totalMetres * selectedLining.pricePerMetre),
            },
          ]
        : []),
      {
        label: `Making & finishing (${safeWindows} window${safeWindows > 1 ? 's' : ''})`,
        amount: Math.round(safeDrop * config.makingChargePerCmDrop * safeWindows),
      },
      {
        label: `${selectedTrack.name} (${trackLengthPerWindow}m × ${trackSets} per window)`,
        amount: Math.round(trackLengthPerWindow * selectedTrack.pricePerMetre * trackSets * safeWindows),
      },
      ...(motorised && selectedTrack.motorisable
        ? [
            {
              label: `Motorisation (${trackSets} × ${safeWindows} track${trackSets * safeWindows > 1 ? 's' : ''})`,
              amount: config.motorPrice * trackSets * safeWindows,
            },
          ]
        : []),
      ...(selectedInstallation.pricePerWindow > 0
        ? [
            {
              label: `${selectedInstallation.name} (${safeWindows} window${safeWindows > 1 ? 's' : ''})`,
              amount: selectedInstallation.pricePerWindow * safeWindows,
            },
          ]
        : []),
    ];

    const total = lines.reduce((sum, line) => sum + line.amount, 0);

    return { fullness, totalMetres, trackLengthPerWindow, lines, total };
  }, [width, drop, windows, panelsPerWindow, selectedFabric, selectedLayer, selectedLining, selectedTrack, selectedHeading, selectedInstallation, doubleTrack, motorised, config.makingChargePerCmDrop, config.motorPrice]);

  const handleLayerChange = (id: string) => {
    setLayerId(id);
    if (layers.find((l) => l.id === id)?.requiresDoubleTrack) {
      setDoubleTrack(true);
    }
  };

  const handleTrackChange = (id: string) => {
    setTrackId(id);
    if (!tracks.find((t) => t.id === id)?.motorisable) {
      setMotorised(false);
    }
  };

  const buildConfiguration = () => ({
    widthCm: Math.max(60, width || 0),
    dropCm: Math.max(80, drop || 0),
    windows: Math.max(1, Math.min(20, windows || 1)),
    panelsPerWindow: Math.max(1, Math.min(8, panelsPerWindow || 1)),
    heading: selectedHeading.name,
    fabric: selectedFabric.name,
    fabricPricePerMetre: selectedFabric.pricePerMetre,
    colour: selectedColor.name,
    layers: selectedLayer.name,
    lining: selectedLining.name,
    trackType: selectedTrack.name,
    trackCount: doubleTrack ? 'Double track' : 'Single track',
    motorised,
    installation: selectedInstallation.name,
    totalFabricMetres: estimate.totalMetres,
    trackLengthPerWindow: estimate.trackLengthPerWindow,
    estimateLines: estimate.lines,
    estimateTotal: estimate.total,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fullName.trim() || !email.trim()) {
      toast.error('Please provide your name and email address.');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Please provide a valid email address.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/curtain-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          city: city.trim(),
          notes: notes.trim(),
          configuration: buildConfiguration(),
        }),
      });

      const data = (await res.json()) as { reference?: string; error?: string };
      if (!res.ok || !data.reference) {
        throw new Error(data.error ?? 'Could not submit your enquiry.');
      }

      setSubmitted({ reference: data.reference, estimateTotal: estimate.total });
      toast.success('Enquiry sent! We will confirm your final quotation shortly.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit your enquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappMessage = `Hi! I'd like a curtain quote. Width: ${width}cm, Drop: ${drop}cm, Windows: ${windows}, Panels: ${panelsPerWindow}, Heading: ${selectedHeading.name}, Fabric: ${selectedFabric.name} (${selectedColor.name}), Layers: ${selectedLayer.name}, Lining: ${selectedLining.name}, Track: ${selectedTrack.name}${doubleTrack ? ' (double)' : ''}${motorised ? ' (motorised)' : ''}, Installation: ${selectedInstallation.name}. Estimated total: ${formatPrice(estimate.total)}.`;

  if (!config.enabled) {
    return (
      <ComingSoonPanel
        label="Back Soon"
        title="Curtain Customizer Is Temporarily Unavailable"
        message="Our curtain customizer is being updated right now. Please check back soon, or contact us and we will put a quote together for you directly."
        primaryCta={{ label: 'Contact Us', href: '/contact' }}
        secondaryCta={{ label: 'Shop Curtains', href: '/shop/curtains' }}
      />
    );
  }

  return (
    <div className={styles.page}>
      <div className="container-wide">
        <div className={styles.header}>
          <span className="label-accent">Design Studio</span>
          <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '0.75rem 0 0.5rem' }}>Curtain Customizer</h1>
          <p style={{ color: '#A9B7C9' }}>
            Enter your window measurements, choose your options, and see an estimated price update live — then
            submit an enquiry and we&apos;ll confirm the final quotation.
          </p>
          <div className={styles.disclaimer}>
            <strong>Estimate only — no payment is taken here.</strong> Curtains are custom-made, so ZHUA reviews
            every configuration, confirms the final measurements and specifications, and then sends you the final
            quotation and payment request.
          </div>
        </div>

        {submitted ? (
          <div className={styles.successCard}>
            <CheckCircle2 size={44} color="#B59241" />
            <h2 className="heading-md" style={{ color: '#EAF0F8' }}>Enquiry received — reference {submitted.reference}</h2>
            <p style={{ color: '#A9B7C9', lineHeight: 1.7 }}>
              Thank you! Your estimated price was <strong style={{ color: '#B59241' }}>{formatPrice(submitted.estimateTotal)}</strong>.
              Our team will review your measurements and requirements, confirm the final quotation, and contact you
              with a payment request. No payment is due until then.
            </p>
            <div className={styles.successSteps}>
              <div className={styles.step}><span>1</span><p>We review your measurements and specifications.</p></div>
              <div className={styles.step}><span>2</span><p>We confirm the final quote with you (and verify measurements if needed).</p></div>
              <div className={styles.step}><span>3</span><p>You approve and pay — then production begins.</p></div>
            </div>
            <div className={styles.ctaGroup}>
              <button
                className="btn btn-outline"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setSubmitted(null)}
              >
                Configure Another Set
              </button>
              <a
                href={buildWhatsAppUrl(whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <MessageCircle size={15} /> Follow Up on WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <div className={styles.workspace}>
            {/* Options Panel */}
            <div className={styles.panel}>
              {/* Measurements */}
              <div className={styles.group}>
                <h3 className={styles.groupTitle}>Window Measurements</h3>
                <div className={styles.fieldGrid}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="cc-width">Rail Width (cm)</label>
                    <input id="cc-width" type="number" className="form-input" value={width} min={60} max={800}
                      onChange={(e) => setWidth(Number(e.target.value || 0))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="cc-drop">Drop / Height (cm)</label>
                    <input id="cc-drop" type="number" className="form-input" value={drop} min={80} max={600}
                      onChange={(e) => setDrop(Number(e.target.value || 0))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="cc-windows">Number of Windows</label>
                    <input id="cc-windows" type="number" className="form-input" value={windows} min={1} max={20}
                      onChange={(e) => setWindows(Number(e.target.value || 1))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="cc-panels">Panels per Window</label>
                    <input id="cc-panels" type="number" className="form-input" value={panelsPerWindow} min={1} max={8}
                      onChange={(e) => setPanelsPerWindow(Number(e.target.value || 1))} />
                  </div>
                </div>
              </div>

              {/* Heading */}
              <div className={styles.group}>
                <h3 className={styles.groupTitle}>Curtain Type &amp; Heading</h3>
                <div className={styles.headingGrid}>
                  {headings.map((h) => (
                    <button key={h.id} type="button"
                      className={`${styles.headingChip} ${h.id === selectedHeading.id ? styles.headingChipActive : ''}`}
                      onClick={() => setHeadingId(h.id)}>
                      <div className={styles.headingName}>{h.name}</div>
                      <div className={styles.headingDesc}>{h.description} · {h.fullness}× fullness</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layers */}
              <div className={styles.group}>
                <h3 className={styles.groupTitle}>Sheer &amp; Blockout</h3>
                <div className={styles.pillRow}>
                  {layers.map((l) => (
                    <button key={l.id} type="button" title={l.description}
                      className={`${styles.pill} ${l.id === selectedLayer.id ? styles.pillActive : ''}`}
                      onClick={() => handleLayerChange(l.id)}>{l.name}</button>
                  ))}
                </div>
                <p className={styles.hint}>{selectedLayer.description}</p>
              </div>

              {/* Fabric */}
              <div className={styles.group}>
                <h3 className={styles.groupTitle}>Fabric <span className={styles.priceTag}>{formatPrice(selectedFabric.pricePerMetre)}/m</span></h3>
                <div className={styles.fabricGrid}>
                  {fabrics.map((f) => (
                    <button key={f.id} type="button"
                      className={`${styles.fabricChip} ${f.id === selectedFabric.id ? styles.fabricChipActive : ''}`}
                      onClick={() => setFabricId(f.id)}>
                      {f.imageUrl ? (
                        <Image src={f.imageUrl} alt="" width={18} height={18}
                          className={styles.fabricSwatch} style={{ objectFit: 'cover' }} />
                      ) : (
                        <div className={styles.fabricSwatch} style={{ background: f.swatch }} />
                      )}
                      <span>{f.name}</span>
                    </button>
                  ))}
                </div>
                {selectedFabric.imageUrl || selectedFabric.description ? (
                  <div className={styles.fabricPreview} key={selectedFabric.id}>
                    {selectedFabric.imageUrl ? (
                      <Image
                        src={selectedFabric.imageUrl}
                        alt={selectedFabric.description ? `${selectedFabric.name} fabric` : `${selectedFabric.name} fabric sample`}
                        width={112}
                        height={112}
                        className={styles.fabricPreviewImg}
                      />
                    ) : (
                      <div className={styles.fabricPreviewSwatch} style={{ background: selectedFabric.swatch }} />
                    )}
                    <div className={styles.fabricPreviewCopy}>
                      <strong>{selectedFabric.name} — {formatPrice(selectedFabric.pricePerMetre)}/m</strong>
                      {selectedFabric.description ? <p>{selectedFabric.description}</p> : null}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Colour */}
              <div className={styles.group}>
                <h3 className={styles.groupTitle}>Colour: <span style={{ color: '#EAF0F8', fontWeight: 400 }}>{selectedColor.name}</span></h3>
                <div className={styles.colorRow}>
                  {colors.map((c) => (
                    <button key={c.id} type="button" title={c.name} aria-label={c.name}
                      className={`${styles.colorDot} ${c.id === selectedColor.id ? styles.colorDotActive : ''}`}
                      style={{ background: c.hex }} onClick={() => setColorId(c.id)} />
                  ))}
                </div>
              </div>

              {/* Lining */}
              <div className={styles.group}>
                <h3 className={styles.groupTitle}>Lining</h3>
                <div className={styles.pillRow}>
                  {linings.map((l) => (
                    <button key={l.id} type="button"
                      className={`${styles.pill} ${l.id === selectedLining.id ? styles.pillActive : ''}`}
                      onClick={() => setLiningId(l.id)}>{l.name}</button>
                  ))}
                </div>
              </div>

              {/* Track / Rod */}
              <div className={styles.group}>
                <h3 className={styles.groupTitle}>Track or Rod</h3>
                <div className={styles.pillRow}>
                  {tracks.map((t) => (
                    <button key={t.id} type="button"
                      className={`${styles.pill} ${t.id === selectedTrack.id ? styles.pillActive : ''}`}
                      onClick={() => handleTrackChange(t.id)}>{t.name}</button>
                  ))}
                </div>
                <div className={styles.pillRow} style={{ marginTop: '0.75rem' }}>
                  <button type="button"
                    className={`${styles.pill} ${!doubleTrack ? styles.pillActive : ''}`}
                    onClick={() => setDoubleTrack(false)}>Single Track</button>
                  <button type="button"
                    className={`${styles.pill} ${doubleTrack ? styles.pillActive : ''}`}
                    onClick={() => setDoubleTrack(true)}>Double Track</button>
                </div>
                {selectedTrack.motorisable ? (
                  <label className={styles.checkRow}>
                    <input type="checkbox" checked={motorised} onChange={(e) => setMotorised(e.target.checked)} />
                    <span>Motorise my tracks (+{formatPrice(config.motorPrice)} per track set)</span>
                  </label>
                ) : (
                  <p className={styles.hint}>{selectedTrack.name} cannot be motorised — choose a motorisable track for automation.</p>
                )}
              </div>

              {/* Installation */}
              <div className={styles.group}>
                <h3 className={styles.groupTitle}>Installation</h3>
                <div className={styles.pillRow}>
                  {installations.map((i) => (
                    <button key={i.id} type="button"
                      className={`${styles.pill} ${i.id === selectedInstallation.id ? styles.pillActive : ''}`}
                      onClick={() => setInstallationId(i.id)}>{i.name}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Estimate + Enquiry */}
            <div>
              {/* Estimate */}
              <div className={styles.priceSummary}>
                <h3 className={styles.groupTitle} style={{ marginBottom: '0.25rem' }}>Estimated Price</h3>
                {estimate.lines.map((line) => (
                  <div key={line.label} className={styles.priceRow}><span>{line.label}</span><span>{formatPrice(line.amount)}</span></div>
                ))}
                <div className={`${styles.priceRow} ${styles.priceTotal}`}><span>Estimated Total</span><span>{formatPrice(estimate.total)}</span></div>
                <p className={styles.hint}>
                  Estimate only — the final quotation is confirmed by ZHUA after reviewing your measurements and
                  specifications. No payment is taken through this form.
                </p>
              </div>

              {/* Enquiry Form */}
              <form className={styles.quoteForm} onSubmit={handleSubmit}>
                <h3 className={styles.groupTitle}>Request Your Final Quotation</h3>
                <div className={styles.fieldGrid}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="cc-name">Full Name *</label>
                    <input id="cc-name" className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="cc-email">Email *</label>
                    <input id="cc-email" type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="cc-phone">Phone</label>
                    <input id="cc-phone" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="cc-city">City / Suburb</label>
                    <input id="cc-city" className="form-input" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cc-notes">Notes (optional)</label>
                  <textarea id="cc-notes" className="form-input" rows={3} value={notes}
                    placeholder="Anything we should know — window access, existing tracks, preferred dates..."
                    onChange={(e) => setNotes(e.target.value)} />
                </div>
                <div className={styles.ctaGroup}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submitting}>
                    <Send size={15} /> {submitting ? 'Sending...' : 'Submit Enquiry for Final Quote'}
                  </button>
                  <a href={buildWhatsAppUrl(whatsappMessage)} target="_blank" rel="noopener noreferrer"
                    className="btn btn-whatsapp" style={{ flex: 1, justifyContent: 'center' }}>
                    <MessageCircle size={15} /> WhatsApp Instead
                  </a>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
