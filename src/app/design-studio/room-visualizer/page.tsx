'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Upload, Download, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import ComingSoonPanel from '@/components/ui/ComingSoonPanel';
import { DESIGN_STUDIO_FEATURE } from '@/lib/features';
import styles from './page.module.css';

const furnitureOverlays = [
  { id: 'sofa', label: 'L-Shape Sofa', color: '#C8B89A', emoji: '🛋️' },
  { id: 'table', label: 'Dining Table', color: '#8B6B4A', emoji: '🪑' },
  { id: 'curtain-l', label: 'Curtain (Left)', color: '#6B4F3A', emoji: '🪟' },
  { id: 'curtain-r', label: 'Curtain (Right)', color: '#5A4030', emoji: '🪟' },
  { id: 'bed', label: 'King Bed', color: '#C4B8A4', emoji: '🛏️' },
  { id: 'lamp', label: 'Floor Lamp', color: '#C9A84C', emoji: '💡' },
  { id: 'rug', label: 'Area Rug', color: '#8B7B6B', emoji: '🟫' },
  { id: 'plant', label: 'Plant', color: '#3D5A4A', emoji: '🌿' },
];

interface Overlay { id: string; type: string; x: number; y: number; w: number; h: number; color: string; emoji: string; label: string; }

export default function RoomVisualizerPage() {
  if (!DESIGN_STUDIO_FEATURE.enabled) {
    return (
      <ComingSoonPanel
        title="Room Visualizer Is Almost Ready"
        message={DESIGN_STUDIO_FEATURE.message}
        primaryCta={{ label: 'Shop Furniture', href: '/shop/furniture' }}
        secondaryCta={{ label: 'See the Gallery', href: '/gallery' }}
      />
    );
  }

  return <RoomVisualizerWorkspace />;
}

function RoomVisualizerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayIdRef = useRef(1);
  const [roomImage, setRoomImage] = useState<HTMLImageElement | null>(null);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (roomImage) {
      ctx.drawImage(roomImage, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#1E3C5F';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#3A5673';
      ctx.font = '18px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Upload a room photo to get started', canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = '14px Outfit, sans-serif';
      ctx.fillStyle = '#58708A';
      ctx.fillText('Then drag furniture overlays onto your room', canvas.width / 2, canvas.height / 2 + 20);
    }
    overlays.forEach(ov => {
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = ov.color;
      ctx.fillRect(ov.x, ov.y, ov.w, ov.h);
      ctx.globalAlpha = 1;
      ctx.font = `${Math.min(ov.w, ov.h) * 0.5}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ov.emoji, ov.x + ov.w / 2, ov.y + ov.h / 2);
      if (ov.id === selected) {
        ctx.strokeStyle = '#B59241';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(ov.x - 2, ov.y - 2, ov.w + 4, ov.h + 4);
      }
      ctx.restore();
    });
  }, [overlays, selected, roomImage]);

  useEffect(() => { draw(); }, [draw]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => setRoomImage(img);
    img.src = URL.createObjectURL(file);
  };

  const addOverlay = (item: typeof furnitureOverlays[0]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newId = `ov-${overlayIdRef.current}`;
    overlayIdRef.current += 1;
    const newOv: Overlay = { id: newId, type: item.id, x: canvas.width * 0.2, y: canvas.height * 0.5, w: 120, h: 80, color: item.color, emoji: item.emoji, label: item.label };
    setOverlays(prev => [...prev, newOv]);
    setSelected(newOv.id);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const hit = [...overlays].reverse().find(ov => mx >= ov.x && mx <= ov.x + ov.w && my >= ov.y && my <= ov.y + ov.h);
    if (hit) {
      setSelected(hit.id);
      setDragging(true);
      setDragStart({ x: mx - hit.x, y: my - hit.y });
    } else {
      setSelected(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging || !selected) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    setOverlays(prev => prev.map(ov => ov.id === selected ? { ...ov, x: mx - dragStart.x, y: my - dragStart.y } : ov));
  };

  const handleMouseUp = () => setDragging(false);

  const resize = (delta: number) => {
    setOverlays(prev => prev.map(ov => ov.id === selected ? { ...ov, w: Math.max(40, ov.w + delta), h: Math.max(30, ov.h + delta * 0.67) } : ov));
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'zhua-room-design.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className={styles.page}>
      <div className="container-wide">
        <div className={styles.header}>
          <div>
            <span className="label-accent">Design Studio</span>
            <h1 className="heading-xl" style={{ color: '#EAF0F8', margin: '0.75rem 0 0.5rem' }}>Room Visualizer</h1>
            <p style={{ color: '#A9B7C9' }}>Upload your room photo, then drag furniture and curtain overlays to preview your design.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
              <Upload size={15} /> Upload Room Photo
              <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
            </label>
            <button className="btn btn-ghost btn-sm" onClick={() => setOverlays([])}><RotateCcw size={15} /> Clear All</button>
            <button className="btn btn-primary btn-sm" onClick={handleDownload}><Download size={15} /> Download</button>
          </div>
        </div>

        <div className={styles.workspace}>
          {/* Furniture Palette */}
          <div className={styles.palette}>
            <h3 className={styles.paletteTitle}>Furniture & Accessories</h3>
            <p className={styles.paletteSub}>Click to add to canvas</p>
            <div className={styles.paletteGrid}>
              {furnitureOverlays.map(item => (
                <button key={item.id} className={styles.paletteItem} onClick={() => addOverlay(item)} title={`Add ${item.label}`}>
                  <span className={styles.paletteEmoji}>{item.emoji}</span>
                  <span className={styles.paletteLabel}>{item.label}</span>
                </button>
              ))}
            </div>

            {selected && (
              <div className={styles.controls}>
                <h4 className={styles.controlsTitle}>Selected Item</h4>
                <div className={styles.controlsRow}>
                  <button className={styles.controlBtn} onClick={() => resize(-20)}><ZoomOut size={14} /></button>
                  <span style={{ fontSize: '0.8rem', color: '#7B8EA6' }}>Resize</span>
                  <button className={styles.controlBtn} onClick={() => resize(20)}><ZoomIn size={14} /></button>
                </div>
                <button className={`${styles.controlBtn} ${styles.removeBtn}`} onClick={() => { setOverlays(prev => prev.filter(o => o.id !== selected)); setSelected(null); }}>
                  Remove Item
                </button>
              </div>
            )}

            <div className={styles.tips}>
              <h4 className={styles.tipsTitle}>Tips</h4>
              <ul className={styles.tipsList}>
                <li>Click furniture to add it to your room</li>
                <li>Click an item on canvas to select it</li>
                <li>Click & drag selected items to move them</li>
                <li>Use resize buttons to scale items</li>
                <li>Download your design to share</li>
              </ul>
            </div>
          </div>

          {/* Canvas */}
          <div className={styles.canvasWrap}>
            <canvas
              ref={canvasRef}
              width={900}
              height={600}
              className={styles.canvas}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: dragging ? 'grabbing' : 'default' }}
            />
            {!roomImage && (
              <label className={styles.uploadOverlay}>
                <Upload size={32} color="#3A5673" />
                <span>Click to upload your room photo</span>
                <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
