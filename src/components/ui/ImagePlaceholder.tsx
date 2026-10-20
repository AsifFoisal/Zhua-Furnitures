'use client';

import type { CSSProperties } from 'react';
import type { ImageryMotif, ImagerySlot } from '@/lib/home-imagery';
import styles from './ImagePlaceholder.module.css';

interface ImagePlaceholderProps {
  slot: ImagerySlot;
  /** Show the small caption tag that marks this visual as awaiting official photography. */
  showCaption?: boolean;
  className?: string;
  style?: CSSProperties;
  loading?: 'lazy' | 'eager';
}

/**
 * Architectural line-art motifs used while official ZHUA photography is
 * unavailable. Each is intentionally minimal: gold strokes over a deep
 * gradient so placeholders read as intentional art direction, not missing
 * images.
 */
function Motif({ motif }: { motif: ImageryMotif }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (motif) {
    case 'room':
      return (
        <svg viewBox="0 0 400 260" aria-hidden="true" className={styles.motif}>
          {/* floor + ceiling */}
          <path {...common} d="M20 228 H380" />
          <path {...common} d="M20 32 H380" opacity={0.5} />
          {/* window + curtains, left */}
          <rect {...common} x="42" y="52" width="92" height="140" rx="2" opacity={0.7} />
          <path {...common} d="M88 52 V192" opacity={0.5} />
          <path {...common} d="M36 44 C60 60 60 90 38 104 C62 118 60 150 38 164 C64 178 60 196 40 200" opacity={0.9} />
          <path {...common} d="M140 44 C120 62 122 92 142 106 C118 120 122 152 142 166 C118 180 122 196 140 200" opacity={0.9} />
          <path {...common} d="M32 40 H146" strokeWidth={2.4} />
          {/* sofa, centre */}
          <path {...common} d="M168 196 V172 Q168 158 182 158 H286 Q300 158 300 172 V196" />
          <path {...common} d="M158 196 V178 Q150 178 150 186 Q150 196 160 196" />
          <path {...common} d="M310 196 V178 Q318 178 318 186 Q318 196 308 196" />
          <path {...common} d="M168 176 H300" opacity={0.6} />
          <path {...common} d="M232 158 V128 Q232 120 240 120 H262 Q270 120 270 128 V158" opacity={0.55} />
          <path {...common} d="M176 208 H292" opacity={0.6} />
          {/* slat feature wall, right */}
          <g opacity={0.8}>
            <path {...common} d="M330 52 V196" />
            <path {...common} d="M342 52 V196" />
            <path {...common} d="M354 52 V196" />
            <path {...common} d="M366 52 V196" />
          </g>
        </svg>
      );
    case 'living':
      return (
        <svg viewBox="0 0 400 260" aria-hidden="true" className={styles.motif}>
          <path {...common} d="M30 226 H370" />
          {/* rug */}
          <ellipse {...common} cx="200" cy="228" rx="150" ry="14" opacity={0.45} />
          {/* art frame */}
          <rect {...common} x="160" y="48" width="80" height="56" rx="2" opacity={0.6} />
          <path {...common} d="M168 92 L192 66 L214 88" opacity={0.5} />
          {/* sofa */}
          <path {...common} d="M120 178 V128 Q120 112 138 112 H262 Q280 112 280 128 V178" />
          <path {...common} d="M108 178 V146 Q96 146 96 160 Q96 178 112 178" />
          <path {...common} d="M292 178 V146 Q304 146 304 160 Q304 178 288 178" />
          <path {...common} d="M120 148 H280" opacity={0.6} />
          <path {...common} d="M178 112 V148" opacity={0.5} />
          <path {...common} d="M222 112 V148" opacity={0.5} />
          {/* cushions */}
          <path {...common} d="M136 112 Q130 130 138 146" opacity={0.7} />
          <path {...common} d="M264 112 Q270 130 262 146" opacity={0.7} />
          {/* legs */}
          <path {...common} d="M126 178 V192 M274 178 V192" />
          {/* floor lamp */}
          <path {...common} d="M330 192 V96 M312 96 H348 M318 88 H342 L336 68 H324 Z" opacity={0.8} />
        </svg>
      );
    case 'dining':
      return (
        <svg viewBox="0 0 400 260" aria-hidden="true" className={styles.motif}>
          <path {...common} d="M30 226 H370" />
          {/* pendant */}
          <path {...common} d="M200 40 V92 M186 92 H214 L208 110 H192 Z" opacity={0.8} />
          {/* table */}
          <path {...common} d="M120 150 H280 M132 150 V210 M268 150 V210" />
          <path {...common} d="M120 150 L104 138 M280 150 L296 138" opacity={0.5} />
          {/* chairs */}
          <path {...common} d="M84 138 V196 M84 164 H124 M116 138 V196" opacity={0.8} />
          <path {...common} d="M316 138 V196 M316 164 H276 M284 138 V196" opacity={0.8} />
          {/* place settings */}
          <circle {...common} cx="170" cy="146" r="8" opacity={0.5} />
          <circle {...common} cx="230" cy="146" r="8" opacity={0.5} />
        </svg>
      );
    case 'bedroom':
      return (
        <svg viewBox="0 0 400 260" aria-hidden="true" className={styles.motif}>
          <path {...common} d="M30 226 H370" />
          {/* headboard wall */}
          <rect {...common} x="120" y="70" width="160" height="70" rx="2" opacity={0.5} />
          <path {...common} d="M160 70 V140 M200 70 V140 M240 70 V140" opacity={0.35} />
          {/* bed */}
          <path {...common} d="M96 190 V150 Q96 138 108 138 H292 Q304 138 304 150 V190" />
          <path {...common} d="M96 162 H304" opacity={0.6} />
          <path {...common} d="M132 138 Q126 150 132 160 M268 138 Q274 150 268 160" opacity={0.7} />
          {/* side tables + lamps */}
          <path {...common} d="M60 190 V168 H88 V190 M66 168 V154 H82 L78 146 H70 Z" opacity={0.8} />
          <path {...common} d="M312 190 V168 H340 V190 M318 168 V154 H334 L330 146 H322 Z" opacity={0.8} />
          <path {...common} d="M108 210 H292" opacity={0.5} />
        </svg>
      );
    case 'cabinetry':
      return (
        <svg viewBox="0 0 400 260" aria-hidden="true" className={styles.motif}>
          <path {...common} d="M30 226 H370" />
          {/* wall units */}
          <rect {...common} x="70" y="52" width="110" height="56" rx="2" opacity={0.8} />
          <rect {...common} x="220" y="52" width="110" height="56" rx="2" opacity={0.8} />
          <path {...common} d="M125 52 V108 M275 52 V108" opacity={0.5} />
          {/* base units */}
          <rect {...common} x="70" y="150" width="110" height="76" rx="2" opacity={0.8} />
          <rect {...common} x="220" y="150" width="110" height="76" rx="2" opacity={0.8} />
          <path {...common} d="M125 150 V226 M275 150 V226" opacity={0.5} />
          <path {...common} d="M92 188 h14 M158 188 h14 M242 188 h14 M308 188 h14" strokeWidth={2.2} />
          {/* counter line */}
          <path {...common} d="M60 150 H340" strokeWidth={2.2} />
        </svg>
      );
    case 'window':
      return (
        <svg viewBox="0 0 400 260" aria-hidden="true" className={styles.motif}>
          <path {...common} d="M30 232 H370" />
          {/* track */}
          <path {...common} d="M60 34 H340" strokeWidth={2.4} />
          {/* window frame */}
          <rect {...common} x="110" y="48" width="180" height="176" rx="2" opacity={0.55} />
          <path {...common} d="M200 48 V224 M110 136 H290" opacity={0.4} />
          {/* wave curtains */}
          <path {...common} d="M100 42 C76 66 78 100 102 122 C76 144 80 186 100 206 C82 218 86 228 96 224" />
          <path {...common} d="M118 42 C100 70 104 104 122 126 C100 148 106 188 120 206" opacity={0.75} />
          <path {...common} d="M300 42 C324 66 322 100 298 122 C324 144 320 186 300 206 C318 218 314 228 304 224" />
          <path {...common} d="M282 42 C300 70 296 104 278 126 C300 148 294 188 280 206" opacity={0.75} />
        </svg>
      );
    case 'wall':
      return (
        <svg viewBox="0 0 400 260" aria-hidden="true" className={styles.motif}>
          <path {...common} d="M30 232 H370" />
          {/* slat panel */}
          <g opacity={0.9}>
            {Array.from({ length: 9 }).map((_, i) => (
              <path key={i} {...common} d={`M${96 + i * 26} 44 V216`} />
            ))}
          </g>
          {/* TV */}
          <rect {...common} x="158" y="86" width="120" height="70" rx="3" strokeWidth={2} />
          <path {...common} d="M218 156 V172 M198 172 H238" opacity={0.7} />
          {/* console */}
          <path {...common} d="M150 196 H286 M158 196 V216 M278 196 V216" opacity={0.8} />
        </svg>
      );
    case 'deck':
      return (
        <svg viewBox="0 0 400 260" aria-hidden="true" className={styles.motif}>
          {/* sun */}
          <circle {...common} cx="316" cy="64" r="22" opacity={0.7} />
          <path {...common} d="M316 30 V18 M316 110 V98 M282 64 H270 M362 64 H350 M292 40 L284 32 M348 88 L340 80 M340 40 L348 32 M284 88 L292 80" opacity={0.5} />
          {/* horizon + railing */}
          <path {...common} d="M30 118 H370" opacity={0.4} />
          <path {...common} d="M30 128 H370" strokeWidth={2} />
          <path {...common} d="M52 128 V196 M120 128 V196 M188 128 V196 M256 128 V196 M324 128 V196" opacity={0.75} />
          {/* deck boards */}
          <path {...common} d="M30 208 H370" strokeWidth={2} />
          <path {...common} d="M30 222 H370" opacity={0.7} />
          <path {...common} d="M60 208 L46 222 M140 208 L130 222 M220 208 L214 222 M300 208 L296 222" opacity={0.4} />
          {/* planter */}
          <path {...common} d="M96 128 V112 H120 V128 M108 112 Q102 98 108 88 M108 112 Q114 96 124 92" opacity={0.8} />
        </svg>
      );
    case 'outdoor':
      return (
        <svg viewBox="0 0 400 260" aria-hidden="true" className={styles.motif}>
          <path {...common} d="M30 226 H370" />
          {/* pergola */}
          <path {...common} d="M60 52 H340" strokeWidth={2.4} />
          <path {...common} d="M90 52 V226 M310 52 V226" opacity={0.8} />
          <path {...common} d="M130 52 V40 M180 52 V40 M230 52 V40 M280 52 V40" opacity={0.5} />
          {/* lounge chairs */}
          <path {...common} d="M120 200 L150 158 H196 L182 200 Z" opacity={0.9} />
          <path {...common} d="M150 158 L140 138 H160" opacity={0.6} />
          <path {...common} d="M240 200 L262 170 H300 L288 200 Z" opacity={0.9} />
          <path {...common} d="M262 170 L256 152 H272" opacity={0.6} />
          {/* plant */}
          <path {...common} d="M330 200 V180 M330 180 Q318 168 322 152 M330 180 Q342 166 338 150 M330 180 Q330 162 330 154" opacity={0.8} />
          {/* string lights */}
          <path {...common} d="M90 74 Q200 100 310 74" opacity={0.4} />
          <circle {...common} cx="150" cy="88" r="3" opacity={0.6} />
          <circle {...common} cx="200" cy="92" r="3" opacity={0.6} />
          <circle {...common} cx="250" cy="88" r="3" opacity={0.6} />
        </svg>
      );
    case 'workshop':
      return (
        <svg viewBox="0 0 400 260" aria-hidden="true" className={styles.motif}>
          <path {...common} d="M30 226 H370" />
          {/* fabric rolls */}
          <path {...common} d="M64 226 V96 M64 96 Q88 84 112 96 V226" opacity={0.9} />
          <path {...common} d="M64 130 Q88 118 112 130 M64 164 Q88 152 112 164" opacity={0.5} />
          <path {...common} d="M136 226 V120 M136 120 Q156 110 176 120 V226" opacity={0.8} />
          {/* workbench */}
          <path {...common} d="M200 150 H352 M212 150 V226 M340 150 V226" />
          <path {...common} d="M228 150 V122 H296 V150" opacity={0.7} />
          <rect {...common} x="244" y="94" width="36" height="28" rx="2" opacity={0.6} />
          {/* hanging tool silhouette */}
          <path {...common} d="M318 122 V110 M310 110 H326" opacity={0.6} />
        </svg>
      );
  }
}

export default function ImagePlaceholder({
  slot,
  showCaption = true,
  className = '',
  style,
  loading = 'lazy',
}: ImagePlaceholderProps) {
  if (slot.src) {
    return (
      <img
        src={slot.src}
        alt={slot.alt}
        loading={loading}
        className={`${styles.image} ${className}`}
        style={style}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={slot.alt}
      className={`noise-overlay ${styles.placeholder} ${className}`}
      style={{
        background: `radial-gradient(120% 90% at 70% 20%, ${slot.placeholder.tones[1]} 0%, ${slot.placeholder.tones[0]} 70%)`,
        ...style,
      }}
    >
      <Motif motif={slot.placeholder.motif} />
      {showCaption ? (
        <span className={styles.caption}>
          {slot.placeholder.caption} · photography coming soon
        </span>
      ) : null}
    </div>
  );
}
