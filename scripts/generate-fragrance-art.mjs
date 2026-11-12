import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const OUT_DIR = path.resolve('public/images/fragrance');
const CATEGORY_DIR = path.resolve('public/images/categories');

const PALETTES = {
  amberNoir: {
    bgA: '#2b211c',
    bgB: '#0c0a09',
    glow: '#c98b44',
    glassA: '#5a2f17',
    glassB: '#2a1209',
    glassC: '#8c5128',
    label: '#f3ead8',
    ink: '#2a1d14',
    accent: '#a9682f',
  },
  whiteTea: {
    bgA: '#20251f',
    bgB: '#0c0f0c',
    glow: '#c6c49b',
    glassA: '#7d8060',
    glassB: '#3c412f',
    glassC: '#a7aa88',
    label: '#f4efdf',
    ink: '#2c2d21',
    accent: '#9b9c72',
  },
  oudRose: {
    bgA: '#2a1a20',
    bgB: '#0e090c',
    glow: '#b46d78',
    glassA: '#54232f',
    glassB: '#1f0b11',
    glassC: '#8f4658',
    label: '#f4e7df',
    ink: '#331a20',
    accent: '#a75a67',
  },
  coastal: {
    bgA: '#1b252a',
    bgB: '#090d10',
    glow: '#8fb0b8',
    glassA: '#4a6870',
    glassB: '#1c2b30',
    glassC: '#89a8af',
    label: '#eef1e9',
    ink: '#203238',
    accent: '#698a92',
  },
};

function baseDefs(prefix = '') {
  return `
    <filter id="${prefix}soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="24"/>
    </filter>
    <filter id="${prefix}shadow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
    <filter id="${prefix}blur6" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
    <filter id="${prefix}blur2" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="1.6"/>
    </filter>
    <filter id="${prefix}grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.16"/></feComponentTransfer>
      <feBlend in="SourceGraphic" mode="soft-light"/>
    </filter>
    <radialGradient id="${prefix}halo" cx="50%" cy="42%" r="58%">
      <stop offset="0" stop-color="#d3a35f" stop-opacity="0.25"/>
      <stop offset="0.46" stop-color="#b67c3b" stop-opacity="0.1"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${prefix}vignette" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000000" stop-opacity="0.2"/>
      <stop offset="0.45" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.66"/>
    </linearGradient>`;
}

function background(w, h, palette, prefix = '') {
  return `
    <rect width="${w}" height="${h}" fill="${palette.bgB}"/>
    <rect width="${w}" height="${h}" fill="url(#${prefix}bg)"/>
    <rect width="${w}" height="${h}" fill="url(#${prefix}halo)"/>
    <ellipse cx="${w * 0.5}" cy="${h * 0.44}" rx="${w * 0.3}" ry="${h * 0.28}" fill="${palette.glow}" opacity="0.1" filter="url(#${prefix}soft)"/>`;
}

function grainOverlay(w, h, prefix = '') {
  return `<rect width="${w}" height="${h}" filter="url(#${prefix}grain)" opacity="0.24"/>`;
}

function surface(w, h, palette, prefix = '') {
  const y = h * 0.81;
  return `
    <rect x="0" y="${y}" width="${w}" height="${h - y}" fill="#080706" opacity="0.52"/>
    <line x1="${w * 0.1}" y1="${y}" x2="${w * 0.9}" y2="${y}" stroke="#f1d8ad" stroke-opacity="0.16"/>
    <ellipse cx="${w * 0.5}" cy="${y + 10}" rx="${w * 0.27}" ry="${h * 0.045}" fill="#000" opacity="0.5" filter="url(#${prefix}soft)"/>`;
}

function arch(w, h, palette) {
  const x = w * 0.18;
  const archW = w * 0.64;
  const top = h * 0.09;
  const bottom = h * 0.82;
  return `
    <path d="M ${x} ${bottom} L ${x} ${top + archW / 2} A ${archW / 2} ${archW / 2} 0 0 1 ${x + archW} ${top + archW / 2} L ${x + archW} ${bottom} Z"
      fill="${palette.glow}" opacity="0.035"/>
    <path d="M ${x} ${bottom} L ${x} ${top + archW / 2} A ${archW / 2} ${archW / 2} 0 0 1 ${x + archW} ${top + archW / 2} L ${x + archW} ${bottom}"
      fill="none" stroke="#f1d8ad" stroke-opacity="0.16" stroke-width="1.2"/>`;
}

function mist(cx, topY, palette, prefix = '', scale = 1) {
  return `
    <g opacity="0.62" filter="url(#${prefix}blur6)">
      <path d="M ${cx - 6 * scale} ${topY} C ${cx - 52 * scale} ${topY - 55 * scale}, ${cx + 54 * scale} ${topY - 92 * scale}, ${cx - 10 * scale} ${topY - 158 * scale} C ${cx - 51 * scale} ${topY - 209 * scale}, ${cx + 27 * scale} ${topY - 245 * scale}, ${cx + 8 * scale} ${topY - 305 * scale}"
        fill="none" stroke="${palette.glow}" stroke-opacity="0.36" stroke-width="${8 * scale}" stroke-linecap="round"/>
      <path d="M ${cx + 15 * scale} ${topY - 8 * scale} C ${cx + 65 * scale} ${topY - 64 * scale}, ${cx - 22 * scale} ${topY - 101 * scale}, ${cx + 39 * scale} ${topY - 167 * scale} C ${cx + 77 * scale} ${topY - 206 * scale}, ${cx + 6 * scale} ${topY - 260 * scale}, ${cx + 22 * scale} ${topY - 314 * scale}"
        fill="none" stroke="#f4e3c4" stroke-opacity="0.2" stroke-width="${4 * scale}" stroke-linecap="round"/>
    </g>`;
}

function machine(cx, baseY, scale = 1, palette = PALETTES.amberNoir, prefix = '') {
  const bodyW = 252 * scale;
  const bodyH = 585 * scale;
  const x = cx - bodyW / 2;
  const y = baseY - bodyH;
  return `
    <g>
      <ellipse cx="${cx + 14 * scale}" cy="${baseY + 10 * scale}" rx="${bodyW * 0.73}" ry="${28 * scale}" fill="#000" opacity="0.72" filter="url(#${prefix}soft)"/>
      <path d="M ${x + 34 * scale} ${baseY - 8 * scale} L ${x + bodyW - 34 * scale} ${baseY - 8 * scale} L ${x + bodyW - 20 * scale} ${baseY + 12 * scale} L ${x + 20 * scale} ${baseY + 12 * scale} Z" fill="#0a0a0a"/>
      <rect x="${x}" y="${y}" width="${bodyW}" height="${bodyH}" rx="${34 * scale}" fill="url(#${prefix}machineBody)"/>
      <rect x="${x + 2 * scale}" y="${y + 3 * scale}" width="${bodyW - 4 * scale}" height="${bodyH - 6 * scale}" rx="${32 * scale}" fill="none" stroke="#f3d7a4" stroke-opacity="0.13"/>
      <path d="M ${x + 28 * scale} ${y + 46 * scale} C ${x + 8 * scale} ${y + 224 * scale}, ${x + 12 * scale} ${y + 438 * scale}, ${x + 33 * scale} ${y + bodyH - 34 * scale}" fill="none" stroke="#ffffff" stroke-opacity="0.1" stroke-width="${7 * scale}" stroke-linecap="round"/>
      <path d="M ${x + bodyW - 24 * scale} ${y + 80 * scale} C ${x + bodyW - 5 * scale} ${y + 250 * scale}, ${x + bodyW - 10 * scale} ${y + 460 * scale}, ${x + bodyW - 38 * scale} ${y + bodyH - 48 * scale}" fill="none" stroke="#f2c27d" stroke-opacity="0.1" stroke-width="${5 * scale}" stroke-linecap="round"/>
      <rect x="${cx - 86 * scale}" y="${y - 18 * scale}" width="${172 * scale}" height="${35 * scale}" rx="${17 * scale}" fill="url(#${prefix}gold)"/>
      <rect x="${cx - 76 * scale}" y="${y - 12 * scale}" width="${152 * scale}" height="${23 * scale}" rx="${11 * scale}" fill="#1b1610"/>
      <rect x="${cx - 109 * scale}" y="${y + 35 * scale}" width="${218 * scale}" height="${34 * scale}" rx="${17 * scale}" fill="#080808"/>
      <rect x="${cx - 109 * scale}" y="${y + 35 * scale}" width="${218 * scale}" height="${34 * scale}" rx="${17 * scale}" fill="none" stroke="#f1c57f" stroke-opacity="0.22"/>
      <g>
        <rect x="${cx - 110 * scale}" y="${y + 160 * scale}" width="${220 * scale}" height="${146 * scale}" rx="${20 * scale}" fill="#050505" stroke="#f1c57f" stroke-opacity="0.15"/>
        <rect x="${cx - 82 * scale}" y="${y + 185 * scale}" width="${164 * scale}" height="${62 * scale}" rx="${10 * scale}" fill="#1a130b"/>
        <rect x="${cx - 74 * scale}" y="${y + 195 * scale}" width="${96 * scale}" height="${7 * scale}" rx="3.5" fill="#dca65c" opacity="0.92"/>
        <rect x="${cx - 74 * scale}" y="${y + 211 * scale}" width="${70 * scale}" height="${5 * scale}" rx="2.5" fill="#f4ddb7" opacity="0.55"/>
        <rect x="${cx - 74 * scale}" y="${y + 224 * scale}" width="${112 * scale}" height="${5 * scale}" rx="2.5" fill="#f4ddb7" opacity="0.35"/>
        <circle cx="${cx + 64 * scale}" cy="${y + 216 * scale}" r="${13 * scale}" fill="none" stroke="#dca65c" stroke-width="${2 * scale}"/>
        <path d="M ${cx + 57 * scale} ${y + 216 * scale} L ${cx + 63 * scale} ${y + 222 * scale} L ${cx + 72 * scale} ${y + 209 * scale}" fill="none" stroke="#dca65c" stroke-width="${2 * scale}" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="${cx}" y="${y + 277 * scale}" text-anchor="middle" fill="#f2ddbb" font-family="Georgia, serif" font-size="${15 * scale}" letter-spacing="${4 * scale}">SCENTARIVA</text>
        <text x="${cx}" y="${y + 294 * scale}" text-anchor="middle" fill="#bca57c" font-family="Georgia, serif" font-size="${7.5 * scale}" letter-spacing="${2.9 * scale}">SMART SCENT SYSTEM</text>
      </g>
      <g opacity="0.8">
        <rect x="${cx - 26 * scale}" y="${y + 346 * scale}" width="${52 * scale}" height="${4 * scale}" rx="2" fill="#f1d7a6" opacity="0.5"/>
        <circle cx="${cx}" cy="${y + 386 * scale}" r="${8 * scale}" fill="none" stroke="#f1d7a6" stroke-width="${1.3 * scale}" opacity="0.7"/>
        <circle cx="${cx}" cy="${y + 386 * scale}" r="${3 * scale}" fill="#f1d7a6" opacity="0.9"/>
      </g>
      <g opacity="0.42">
        <line x1="${x + 54 * scale}" y1="${y + 445 * scale}" x2="${x + bodyW - 54 * scale}" y2="${y + 445 * scale}" stroke="#fff" stroke-opacity="0.2"/>
        <line x1="${x + 60 * scale}" y1="${y + 461 * scale}" x2="${x + bodyW - 60 * scale}" y2="${y + 461 * scale}" stroke="#fff" stroke-opacity="0.14"/>
        <line x1="${x + 66 * scale}" y1="${y + 477 * scale}" x2="${x + bodyW - 66 * scale}" y2="${y + 477 * scale}" stroke="#fff" stroke-opacity="0.1"/>
      </g>
      <ellipse cx="${cx}" cy="${y + bodyH - 28 * scale}" rx="${bodyW * 0.38}" ry="${7 * scale}" fill="#f1d7a6" opacity="0.1" filter="url(#${prefix}blur6)"/>
    </g>`;
}

function bottle({ cx, baseY, scale, palette, name, notes, volume = '500 ml', prefix = '', wide = false }) {
  const w = (wide ? 238 : 218) * scale;
  const h = 490 * scale;
  const x = cx - w / 2;
  const y = baseY - h;
  const neckW = 70 * scale;
  const shoulder = 60 * scale;
  const capW = 88 * scale;
  const capH = 80 * scale;
  const labelY = y + 205 * scale;
  const labelH = 168 * scale;
  const labelInset = 18 * scale;
  return `
    <g>
      <ellipse cx="${cx + 8 * scale}" cy="${baseY + 12 * scale}" rx="${w * 0.74}" ry="${26 * scale}" fill="#000" opacity="0.7" filter="url(#${prefix}soft)"/>
      <path d="M ${x + 14 * scale} ${y + shoulder} Q ${x + 14 * scale} ${y + 12 * scale} ${x + 48 * scale} ${y + 12 * scale} L ${cx - neckW / 2} ${y + 12 * scale} L ${cx - neckW / 2} ${y - 24 * scale} L ${cx + neckW / 2} ${y - 24 * scale} L ${cx + neckW / 2} ${y + 12 * scale} L ${x + w - 48 * scale} ${y + 12 * scale} Q ${x + w - 14 * scale} ${y + 12 * scale} ${x + w - 14 * scale} ${y + shoulder} L ${x + w - 22 * scale} ${baseY - 14 * scale} Q ${x + w - 25 * scale} ${baseY} ${cx} ${baseY} Q ${x + 25 * scale} ${baseY} ${x + 22 * scale} ${baseY - 14 * scale} Z"
        fill="url(#${prefix}bottleGlass)"/>
      <path d="M ${x + 34 * scale} ${y + 92 * scale} C ${x + 12 * scale} ${y + 205 * scale}, ${x + 20 * scale} ${y + 363 * scale}, ${x + 35 * scale} ${baseY - 38 * scale}"
        fill="none" stroke="#fff" stroke-opacity="0.3" stroke-width="${8 * scale}" stroke-linecap="round"/>
      <path d="M ${x + w - 42 * scale} ${y + 128 * scale} C ${x + w - 14 * scale} ${y + 248 * scale}, ${x + w - 29 * scale} ${y + 363 * scale}, ${x + w - 40 * scale} ${baseY - 52 * scale}"
        fill="none" stroke="${palette.glassC}" stroke-opacity="0.32" stroke-width="${5 * scale}" stroke-linecap="round"/>
      <rect x="${cx - capW / 2}" y="${y - capH - 20 * scale}" width="${capW}" height="${capH}" rx="${8 * scale}" fill="url(#${prefix}cap)"/>
      <g opacity="0.7">
        ${Array.from({ length: 6 }, (_, i) => `<line x1="${cx - capW / 2 + 11 * scale}" y1="${y - capH - 10 * scale + i * 12 * scale}" x2="${cx + capW / 2 - 11 * scale}" y2="${y - capH - 10 * scale + i * 12 * scale}" stroke="#fff" stroke-opacity="0.12" stroke-width="${1.2 * scale}"/>`).join('')}
      </g>
      <rect x="${x + labelInset}" y="${labelY}" width="${w - labelInset * 2}" height="${labelH}" rx="${3 * scale}" fill="${palette.label}"/>
      <rect x="${x + labelInset + 8 * scale}" y="${labelY + 8 * scale}" width="${w - labelInset * 2 - 16 * scale}" height="${labelH - 16 * scale}" rx="${1.5 * scale}" fill="none" stroke="${palette.ink}" stroke-opacity="0.26"/>
      <text x="${cx}" y="${labelY + 34 * scale}" text-anchor="middle" fill="${palette.ink}" font-family="Georgia, serif" font-size="${9 * scale}" letter-spacing="${3.4 * scale}">ZHUA</text>
      <line x1="${cx - 22 * scale}" y1="${labelY + 46 * scale}" x2="${cx + 22 * scale}" y2="${labelY + 46 * scale}" stroke="${palette.accent}" stroke-width="${1 * scale}"/>
      <text x="${cx}" y="${labelY + 81 * scale}" text-anchor="middle" fill="${palette.ink}" font-family="Georgia, serif" font-size="${name.length > 14 ? 17 * scale : 21 * scale}" letter-spacing="${1.2 * scale}">${name}</text>
      <text x="${cx}" y="${labelY + 103 * scale}" text-anchor="middle" fill="${palette.ink}" fill-opacity="0.68" font-family="Georgia, serif" font-size="${6.4 * scale}" letter-spacing="${1.7 * scale}">${notes}</text>
      <line x1="${cx - 35 * scale}" y1="${labelY + 119 * scale}" x2="${cx + 35 * scale}" y2="${labelY + 119 * scale}" stroke="${palette.ink}" stroke-opacity="0.18"/>
      <text x="${cx}" y="${labelY + 139 * scale}" text-anchor="middle" fill="${palette.ink}" fill-opacity="0.72" font-family="Georgia, serif" font-size="${8 * scale}" letter-spacing="${2 * scale}">${volume.toUpperCase()}</text>
      <text x="${cx}" y="${labelY + 153 * scale}" text-anchor="middle" fill="${palette.ink}" fill-opacity="0.48" font-family="Georgia, serif" font-size="${5.6 * scale}" letter-spacing="${1.2 * scale}">PREMIUM FRAGRANCE OIL</text>
      <path d="M ${x + 30 * scale} ${y + 46 * scale} Q ${cx} ${y + 31 * scale} ${x + w - 30 * scale} ${y + 55 * scale}" fill="none" stroke="#fff" stroke-opacity="0.26" stroke-width="${5 * scale}" stroke-linecap="round"/>
      <rect x="${x + 10 * scale}" y="${baseY - 35 * scale}" width="${w - 20 * scale}" height="${22 * scale}" rx="${10 * scale}" fill="#fff" opacity="0.035"/>
    </g>`;
}

function reedBottle(cx, baseY, scale = 1, prefix = '') {
  const w = 226 * scale;
  const h = 306 * scale;
  const x = cx - w / 2;
  const y = baseY - h;
  const reedTop = y - 365 * scale;
  return `
    <g>
      <ellipse cx="${cx + 10 * scale}" cy="${baseY + 13 * scale}" rx="${w * 0.82}" ry="${25 * scale}" fill="#000" opacity="0.68" filter="url(#${prefix}soft)"/>
      <g stroke-linecap="round">
        ${[
          [-58, 12, -340],
          [-37, 12, -365],
          [-14, 12, -348],
          [12, 12, -370],
          [37, 12, -346],
          [59, 12, -333],
        ]
          .map(
            ([sx, sy, ey]) =>
              `<line x1="${cx + sx * scale}" y1="${y + sy * scale}" x2="${cx + sx * 0.72 * scale}" y2="${y + ey * scale}" stroke="#9a7449" stroke-width="${6 * scale}" opacity="0.82"/>`
          )
          .join('')}
      </g>
      <rect x="${cx - 56 * scale}" y="${y - 28 * scale}" width="${112 * scale}" height="${56 * scale}" rx="${8 * scale}" fill="url(#${prefix}gold)"/>
      <rect x="${cx - 49 * scale}" y="${y - 21 * scale}" width="${98 * scale}" height="${42 * scale}" rx="${5 * scale}" fill="#19130c"/>
      <path d="M ${x + 16 * scale} ${y + 18 * scale} Q ${x + 16 * scale} ${y} ${x + 46 * scale} ${y} L ${x + w - 46 * scale} ${y} Q ${x + w - 16 * scale} ${y} ${x + w - 16 * scale} ${y + 18 * scale} L ${x + w - 25 * scale} ${baseY - 10 * scale} Q ${x + w - 30 * scale} ${baseY} ${cx} ${baseY} Q ${x + 30 * scale} ${baseY} ${x + 25 * scale} ${baseY - 10 * scale} Z"
        fill="url(#${prefix}reedGlass)"/>
      <path d="M ${x + 33 * scale} ${y + 38 * scale} C ${x + 16 * scale} ${y + 110 * scale}, ${x + 25 * scale} ${y + 219 * scale}, ${x + 39 * scale} ${baseY - 26 * scale}"
        fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="${8 * scale}" stroke-linecap="round"/>
      <path d="M ${x + w - 44 * scale} ${y + 66 * scale} C ${x + w - 18 * scale} ${y + 148 * scale}, ${x + w - 28 * scale} ${y + 218 * scale}, ${x + w - 41 * scale} ${baseY - 38 * scale}"
        fill="none" stroke="#d6a85d" stroke-opacity="0.28" stroke-width="${5 * scale}" stroke-linecap="round"/>
      <rect x="${x + 19 * scale}" y="${y + 118 * scale}" width="${w - 38 * scale}" height="${126 * scale}" rx="${3 * scale}" fill="#f5edd9"/>
      <rect x="${x + 28 * scale}" y="${y + 127 * scale}" width="${w - 56 * scale}" height="${108 * scale}" rx="1.5" fill="none" stroke="#322416" stroke-opacity="0.26"/>
      <text x="${cx}" y="${y + 150 * scale}" text-anchor="middle" fill="#2e2217" font-family="Georgia, serif" font-size="${8 * scale}" letter-spacing="${3 * scale}">ZHUA</text>
      <text x="${cx}" y="${y + 179 * scale}" text-anchor="middle" fill="#2e2217" font-family="Georgia, serif" font-size="${19 * scale}" letter-spacing="${1.4 * scale}">Absolut Gold</text>
      <text x="${cx}" y="${y + 198 * scale}" text-anchor="middle" fill="#8e6a2f" font-family="Georgia, serif" font-size="${7 * scale}" letter-spacing="${2.2 * scale}">REED DIFFUSER</text>
      <line x1="${cx - 36 * scale}" y1="${y + 208 * scale}" x2="${cx + 36 * scale}" y2="${y + 208 * scale}" stroke="#b98d42" stroke-width="${1.2 * scale}"/>
      <text x="${cx}" y="${y + 225 * scale}" text-anchor="middle" fill="#5f4a2b" font-family="Georgia, serif" font-size="${7 * scale}" letter-spacing="${1.7 * scale}">150 ML</text>
      <rect x="${x + 8 * scale}" y="${baseY - 34 * scale}" width="${w - 16 * scale}" height="${24 * scale}" rx="${10 * scale}" fill="#fff" opacity="0.04"/>
    </g>`;
}

function svgFrame({ w, h, palette, prefix, body, title, extraDefs = '' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">
    <defs>
      ${baseDefs(prefix)}
      ${extraDefs}
      <linearGradient id="${prefix}bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${palette.bgA}"/>
        <stop offset="0.55" stop-color="${palette.bgA}"/>
        <stop offset="1" stop-color="${palette.bgB}"/>
      </linearGradient>
      <linearGradient id="${prefix}machineBody" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#050505"/>
        <stop offset="0.18" stop-color="#161412"/>
        <stop offset="0.55" stop-color="#24201c"/>
        <stop offset="0.82" stop-color="#0a0908"/>
        <stop offset="1" stop-color="#020202"/>
      </linearGradient>
      <linearGradient id="${prefix}gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#8f6c2d"/>
        <stop offset="0.28" stop-color="#e1bd78"/>
        <stop offset="0.56" stop-color="#b78c44"/>
        <stop offset="0.8" stop-color="#f6ddb0"/>
        <stop offset="1" stop-color="#8d682c"/>
      </linearGradient>
      <linearGradient id="${prefix}cap" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#050505"/>
        <stop offset="0.35" stop-color="#2c2823"/>
        <stop offset="0.62" stop-color="#151310"/>
        <stop offset="1" stop-color="#030303"/>
      </linearGradient>
      <linearGradient id="${prefix}bottleGlass" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${palette.glassB}"/>
        <stop offset="0.18" stop-color="${palette.glassA}"/>
        <stop offset="0.48" stop-color="${palette.glassC}"/>
        <stop offset="0.72" stop-color="${palette.glassA}"/>
        <stop offset="1" stop-color="${palette.glassB}"/>
      </linearGradient>
      <linearGradient id="${prefix}reedGlass" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#5d4120"/>
        <stop offset="0.25" stop-color="#b08345"/>
        <stop offset="0.52" stop-color="#d9b577"/>
        <stop offset="0.76" stop-color="#8b622e"/>
        <stop offset="1" stop-color="#4e351a"/>
      </linearGradient>
      <linearGradient id="${prefix}fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity=".65"/>
      </linearGradient>
    </defs>
    ${body}
    ${grainOverlay(w, h, prefix)}
  </svg>`;
}

function productScene({ palette, prefix, title, content, w = 1200, h = 1200, withArch = true, withSurface = true, extraDefs = '' }) {
  const body = `
    ${background(w, h, palette, prefix)}
    ${withArch ? arch(w, h, palette) : ''}
    ${withSurface ? surface(w, h, palette, prefix) : ''}
    ${content}
    <rect width="${w}" height="${h}" fill="url(#${prefix}vignette)"/>`;
  return svgFrame({ w, h, palette, prefix, body, title, extraDefs });
}

const machineScene = productScene({
  palette: PALETTES.amberNoir,
  prefix: 'm',
  title: 'ZHUA ScentaRiva Smart Commercial Scent Diffuser Machine in matte black with rising fragrance mist',
  content: `${mist(600, 340, PALETTES.amberNoir, 'm', 1.05)}
    ${machine(600, 1000, 1, PALETTES.amberNoir, 'm')}
    <text x="600" y="1123" text-anchor="middle" fill="#f0dfc4" font-family="Georgia, serif" font-size="18" letter-spacing="7">SCENTARIVA</text>
    <text x="600" y="1151" text-anchor="middle" fill="#c9b18c" fill-opacity=".8" font-family="Georgia, serif" font-size="10" letter-spacing="4.2">SMART COMMERCIAL SCENT DIFFUSER</text>`,
});

function oilScene(palette, prefix, name, notes, title) {
  return productScene({
    palette,
    prefix,
    title,
    content: `${mist(600, 470, palette, prefix, 0.65)}
      ${bottle({ cx: 600, baseY: 1002, scale: 1, palette, name, notes, prefix })}
      <text x="600" y="1110" text-anchor="middle" fill="#f1e6d2" fill-opacity=".88" font-family="Georgia, serif" font-size="13" letter-spacing="5.8">ZHUA SIGNATURE SCENTS</text>`,
  });
}

const amberNoirScene = oilScene(PALETTES.amberNoir, 'an', 'Amber Noir', 'AMBER · OUD · VANILLA', 'ZHUA Amber Noir premium 500 ml fragrance oil bottle');
const whiteTeaScene = oilScene(PALETTES.whiteTea, 'wt', 'White Tea &amp; Fig', 'WHITE TEA · FIG · CEDAR', 'ZHUA White Tea and Fig premium 500 ml fragrance oil bottle');
const oudRoseScene = oilScene(PALETTES.oudRose, 'or', 'Oud &amp; Rose', 'ROSE · OUD · PATCHOULI', 'ZHUA Oud and Rose premium 500 ml fragrance oil bottle');
const coastalScene = oilScene(PALETTES.coastal, 'cl', 'Coastal Linen', 'SEA SALT · LINEN · DRIFTWOOD', 'ZHUA Coastal Linen premium 500 ml fragrance oil bottle');

const reedScene = productScene({
  palette: { ...PALETTES.amberNoir, bgA: '#2c2416', glow: '#d3a85e' },
  prefix: 'rd',
  title: 'ZHUA Absolut Gold 150 ml reed diffuser with natural reeds',
  content: `${reedBottle(600, 996, 1, 'rd')}
    <text x="600" y="1112" text-anchor="middle" fill="#f3e7cf" font-family="Georgia, serif" font-size="15" letter-spacing="6">ABSOLUT GOLD</text>
    <text x="600" y="1139" text-anchor="middle" fill="#c9ae7d" fill-opacity=".78" font-family="Georgia, serif" font-size="9.5" letter-spacing="4">150 ML REED DIFFUSER</text>`,
});

const bundleScene = productScene({
  palette: PALETTES.amberNoir,
  prefix: 'bd',
  title: 'ZHUA ScentaRiva home and business bundle with diffuser machine and two fragrance oils',
  content: `${mist(531, 395, PALETTES.amberNoir, 'bd', 0.7)}
    ${machine(510, 992, 0.72, PALETTES.amberNoir, 'bd')}
    ${bottle({ cx: 805, baseY: 997, scale: 0.66, palette: PALETTES.amberNoir, name: 'Amber Noir', notes: 'AMBER · OUD · VANILLA', prefix: 'bd' })}
    ${bottle({ cx: 975, baseY: 997, scale: 0.66, palette: PALETTES.whiteTea, name: 'White Tea', notes: 'WHITE TEA · FIG · CEDAR', prefix: 'bd' })}
    <text x="600" y="1110" text-anchor="middle" fill="#f1e6d2" fill-opacity=".9" font-family="Georgia, serif" font-size="14" letter-spacing="5">THE SIGNATURE PAIRING</text>`,
});

const completeScene = productScene({
  palette: { ...PALETTES.amberNoir, bgA: '#2b2219', glow: '#d3a35f' },
  prefix: 'cc',
  title: 'ZHUA complete home and business scent collection with machine, fragrance oils and reed diffuser',
  content: `${mist(450, 410, PALETTES.amberNoir, 'cc', 0.62)}
    ${machine(405, 976, 0.64, PALETTES.amberNoir, 'cc')}
    ${bottle({ cx: 663, baseY: 981, scale: 0.54, palette: PALETTES.amberNoir, name: 'Amber Noir', notes: 'AMBER · OUD · VANILLA', prefix: 'cc' })}
    ${bottle({ cx: 801, baseY: 981, scale: 0.54, palette: PALETTES.oudRose, name: 'Oud &amp; Rose', notes: 'ROSE · OUD · PATCHOULI', prefix: 'cc' })}
    ${reedBottle(952, 981, 0.56, 'cc')}
    <text x="600" y="1100" text-anchor="middle" fill="#f1e6d2" fill-opacity=".9" font-family="Georgia, serif" font-size="14" letter-spacing="5">THE COMPLETE SCENT COLLECTION</text>`,
});

const heroScene = productScene({
  palette: { ...PALETTES.amberNoir, bgA: '#201a15', bgB: '#080706' },
  prefix: 'hero',
  title: 'ZHUA ScentaRiva fragrance collection for homes and businesses',
  w: 1600,
  h: 1050,
  extraDefs: `
    <linearGradient id="herovignette" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity=".12"/>
      <stop offset=".55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".6"/>
    </linearGradient>
    <linearGradient id="heroLeftFade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0a0908" stop-opacity=".88"/>
      <stop offset=".52" stop-color="#0a0908" stop-opacity=".2"/>
      <stop offset="1" stop-color="#0a0908" stop-opacity="0"/>
    </linearGradient>`,
  content: `
    <path d="M 94 850 L 94 378 A 348 348 0 0 1 790 378 L 790 850 Z" fill="#c99a55" opacity=".05"/>
    <path d="M 94 850 L 94 378 A 348 348 0 0 1 790 378 L 790 850" fill="none" stroke="#e8c995" stroke-opacity=".14"/>
    ${mist(1084, 294, PALETTES.amberNoir, 'hero', 1.1)}
    ${machine(1084, 812, 0.9, PALETTES.amberNoir, 'hero')}
    ${bottle({ cx: 760, baseY: 817, scale: 0.53, palette: PALETTES.amberNoir, name: 'Amber Noir', notes: 'AMBER · OUD · VANILLA', prefix: 'hero' })}
    ${bottle({ cx: 910, baseY: 817, scale: 0.53, palette: PALETTES.whiteTea, name: 'White Tea &amp; Fig', notes: 'WHITE TEA · FIG · CEDAR', prefix: 'hero' })}
    ${reedBottle(1305, 817, 0.58, 'hero')}
    <text x="148" y="700" fill="#f3e6d1" fill-opacity=".9" font-family="Georgia, serif" font-size="19" letter-spacing="9">ZHUA</text>
    <line x1="148" y1="727" x2="380" y2="727" stroke="#d4ad70" stroke-opacity=".55"/>
    <text x="148" y="764" fill="#cbb38d" fill-opacity=".8" font-family="Georgia, serif" font-size="11" letter-spacing="4.4">THE ART OF ATMOSPHERE</text>
    <rect width="1600" height="1050" fill="url(#herovignette)"/>
    <rect x="0" y="0" width="720" height="1050" fill="url(#heroLeftFade)"/>`,
});

const categoryScene = productScene({
  palette: { ...PALETTES.amberNoir, bgA: '#211b16', bgB: '#0a0908' },
  prefix: 'cat',
  title: 'ZHUA fragrance collection with ScentaRiva diffuser machine, fragrance oils and reed diffuser',
  w: 1600,
  h: 800,
  extraDefs: `
    <linearGradient id="catvignette" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity=".12"/>
      <stop offset=".6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".58"/>
    </linearGradient>`,
  content: `
    <path d="M 730 660 L 730 290 A 328 328 0 0 1 1386 290 L 1386 660 Z" fill="#c99a55" opacity=".05"/>
    <path d="M 730 660 L 730 290 A 328 328 0 0 1 1386 290 L 1386 660" fill="none" stroke="#e8c995" stroke-opacity=".12"/>
    ${mist(1106, 180, PALETTES.amberNoir, 'cat', 0.7)}
    ${machine(1106, 647, 0.62, PALETTES.amberNoir, 'cat')}
    ${bottle({ cx: 835, baseY: 650, scale: 0.38, palette: PALETTES.amberNoir, name: 'Amber Noir', notes: 'AMBER · OUD · VANILLA', prefix: 'cat' })}
    ${reedBottle(1302, 650, 0.4, 'cat')}
    <text x="160" y="425" fill="#f3e6d1" fill-opacity=".9" font-family="Georgia, serif" font-size="17" letter-spacing="8">SCENTARIVA</text>
    <line x1="160" y1="451" x2="378" y2="451" stroke="#d4ad70" stroke-opacity=".5"/>
    <text x="160" y="487" fill="#cbb38d" fill-opacity=".76" font-family="Georgia, serif" font-size="10" letter-spacing="4">HOME &amp; BUSINESS FRAGRANCE</text>
    <rect width="1600" height="800" fill="url(#catvignette)"/>`,
});

// Hero-specific left-side fade for text legibility.
async function render(name, svg, { width, height, format = 'jpg' } = {}) {
  const svgPath = path.join(OUT_DIR, `${name}.svg`);
  await writeFile(svgPath, svg.replace(/[ \t]+$/gm, ''), 'utf8');
  const image = sharp(Buffer.from(svg), { density: 144 }).resize(width, height, { fit: 'cover' });
  if (format === 'jpg') {
    await image.jpeg({ quality: 91, mozjpeg: true }).toFile(path.join(OUT_DIR, `${name}.jpg`));
  } else {
    await image.png({ compressionLevel: 9 }).toFile(path.join(OUT_DIR, `${name}.png`));
  }
}

await mkdir(OUT_DIR, { recursive: true });
await mkdir(CATEGORY_DIR, { recursive: true });

await Promise.all([
  render('scentariva-machine', machineScene),
  render('fragrance-oil-amber-noir', amberNoirScene),
  render('fragrance-oil-white-tea-fig', whiteTeaScene),
  render('fragrance-oil-oud-rose', oudRoseScene),
  render('fragrance-oil-coastal-linen', coastalScene),
  render('absolut-gold-reed-diffuser', reedScene),
  render('scentariva-home-business-bundle', bundleScene),
  render('complete-scent-collection', completeScene),
  render('fragrance-hero', heroScene, { width: 1600, height: 1050 }),
  render('fragrance-collection', categoryScene, { width: 1600, height: 800 }),
]);

// The category card lives with the other home-category artwork.
await sharp(Buffer.from(categoryScene), { density: 144 })
  .resize(1600, 800, { fit: 'cover' })
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(path.join(CATEGORY_DIR, 'fragrance-scent.jpg'));

console.log('Fragrance artwork generated.');
