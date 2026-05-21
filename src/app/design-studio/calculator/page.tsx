'use client';
import { useMemo, useState } from 'react';
import { fabricOptions, formatPrice } from '@/lib/data';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import ComingSoonPanel from '@/components/ui/ComingSoonPanel';
import { DESIGN_STUDIO_FEATURE } from '@/lib/features';

const headingMultipliers: Record<string, number> = {
  eyelet: 2,
  'pinch-pleat': 2.3,
  wave: 2,
  tab: 1.8,
};

export default function CurtainCalculatorPage() {
  if (!DESIGN_STUDIO_FEATURE.enabled) {
    return (
      <ComingSoonPanel
        title="Curtain Calculator Is Coming Soon"
        message={DESIGN_STUDIO_FEATURE.message}
        primaryCta={{ label: 'Shop Curtains', href: '/shop/curtains' }}
        secondaryCta={{ label: 'WhatsApp Us', href: '/contact' }}
      />
    );
  }

  return <CurtainCalculatorWorkspace />;
}

function CurtainCalculatorWorkspace() {
  const [width, setWidth] = useState(240);
  const [drop, setDrop] = useState(260);
  const [panels, setPanels] = useState(2);
  const [heading, setHeading] = useState<'eyelet' | 'pinch-pleat' | 'wave' | 'tab'>('wave');
  const [fabricId, setFabricId] = useState(fabricOptions[0].id);

  const selectedFabric = fabricOptions.find((f) => f.id === fabricId) || fabricOptions[0];

  const estimate = useMemo(() => {
    const fullness = headingMultipliers[heading] || 2;
    const metres = ((width / 100) * fullness * panels).toFixed(1);
    const fabricMetres = Number(metres);
    const base = fabricMetres * selectedFabric.price;
    const making = Math.round(drop * 2.5);
    const total = Math.round(base + making);
    const rodSize = Math.ceil((width / 100) * 1.1 * 10) / 10;
    return { fullness, fabricMetres, total, rodSize };
  }, [width, drop, panels, heading, selectedFabric.price]);

  const message =
    `Hi! I need a curtain quote. Width: ${width}cm, Drop: ${drop}cm, Panels: ${panels}, Heading: ${heading}, Fabric: ${selectedFabric.name}, Estimated metres: ${estimate.fabricMetres}m, Estimated total: ${formatPrice(estimate.total)}.`
  ;

  return (
    <div style={{ padding: '140px 0 6rem', minHeight: '100vh', background: 'var(--midnight)' }}>
      <div className="container" style={{ maxWidth: '980px' }}>
        <span className="label-accent">Design Studio</span>
        <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '1rem 0 1.25rem' }}>Curtain Measurement Calculator</h1>

        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1.1fr 0.9fr' }}>
          <div style={{ background: '#163250', border: '1px solid rgba(181,146,65,0.18)', borderRadius: 14, padding: '1.1rem', display: 'grid', gap: '0.8rem' }}>
            <div className="form-group">
              <label className="form-label">Rail Width (cm)</label>
              <input type="number" className="form-input" value={width} onChange={(e) => setWidth(Number(e.target.value || 0))} min={60} />
            </div>
            <div className="form-group">
              <label className="form-label">Drop Length (cm)</label>
              <input type="number" className="form-input" value={drop} onChange={(e) => setDrop(Number(e.target.value || 0))} min={80} />
            </div>
            <div className="form-group">
              <label className="form-label">Number of Panels</label>
              <input type="number" className="form-input" value={panels} onChange={(e) => setPanels(Number(e.target.value || 1))} min={1} max={8} />
            </div>
            <div className="form-group">
              <label className="form-label">Heading Type</label>
              <select className="form-select" value={heading} onChange={(e) => setHeading(e.target.value as 'eyelet' | 'pinch-pleat' | 'wave' | 'tab')}>
                <option value="eyelet">Eyelet</option>
                <option value="pinch-pleat">Pinch Pleat</option>
                <option value="wave">Wave</option>
                <option value="tab">Tab Top</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fabric</label>
              <select className="form-select" value={fabricId} onChange={(e) => setFabricId(e.target.value)}>
                {fabricOptions.map((fabric) => (
                  <option key={fabric.id} value={fabric.id}>{fabric.name} ({formatPrice(fabric.price)}/m)</option>
                ))}
              </select>
            </div>
          </div>

          <aside style={{ background: '#163250', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.1rem' }}>
            <h2 className="heading-md" style={{ color: '#EAF0F8', fontSize: '1.2rem', marginBottom: '0.7rem' }}>Estimate</h2>
            <div style={{ display: 'grid', gap: '0.45rem', marginBottom: '1rem' }}>
              <p style={{ color: '#A9B7C9' }}>Fullness Ratio: <strong style={{ color: '#EAF0F8' }}>{estimate.fullness}x</strong></p>
              <p style={{ color: '#A9B7C9' }}>Fabric Required: <strong style={{ color: '#EAF0F8' }}>{estimate.fabricMetres}m</strong></p>
              <p style={{ color: '#A9B7C9' }}>Recommended Rod: <strong style={{ color: '#EAF0F8' }}>{estimate.rodSize}m</strong></p>
              <p style={{ color: '#A9B7C9' }}>Estimated Cost: <strong style={{ color: '#B59241' }}>{formatPrice(estimate.total)}</strong></p>
            </div>
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              <button className="btn btn-primary" style={{ justifyContent: 'center' }}>Add Estimate to Cart</button>
              <a className="btn btn-whatsapp" href={buildWhatsAppUrl(message)} target="_blank" rel="noopener noreferrer" style={{ justifyContent: 'center' }}>
                Send via WhatsApp
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
