const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..');
const SQ3 = Math.sqrt(3) / 2;

const C = {
  p50: '#EFF6FF', p100: '#DBEAFE', p200: '#BFDBFE', p300: '#93C5FD',
  p400: '#60A5FA', p500: '#2563EB', p600: '#1D4ED8', p700: '#1E40AF',
  p800: '#1E3A8A', p900: '#172554',
  g50: '#F9FAFB', g100: '#F3F4F6', g200: '#E5E7EB', g300: '#D1D5DB',
  g400: '#9CA3AF', g500: '#6B7280', g600: '#4B5563', g700: '#374151',
  g800: '#1F2937', g900: '#111827',
  green: '#22C55E', greenDark: '#16A34A', amber: '#F59E0B', red: '#EF4444',
  info: '#0EA5E9', white: '#FFFFFF',
  skin1: '#C98A5F', skin2: '#A96E3F', skin3: '#8D5A3B', skin4: '#6E4423',
  hair1: '#172554', hair2: '#1F2937', hair3: '#374151', hair4: '#7C2D12',
};

const DEFS = `
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.p50}"/><stop offset="1" stop-color="${C.p100}"/>
  </linearGradient>
  <linearGradient id="skyDeep" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.p100}"/><stop offset="1" stop-color="${C.p200}"/>
  </linearGradient>
  <linearGradient id="primary" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.p400}"/><stop offset="1" stop-color="${C.p500}"/>
  </linearGradient>
  <linearGradient id="primaryDeep" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.p500}"/><stop offset="1" stop-color="${C.p600}"/>
  </linearGradient>
  <linearGradient id="navy" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.p700}"/><stop offset="1" stop-color="${C.p900}"/>
  </linearGradient>
  <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="${C.p50}"/>
  </linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#FBBF24"/><stop offset="1" stop-color="${C.amber}"/>
  </linearGradient>
  <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="${C.amber}"/>
  </linearGradient>
  <linearGradient id="warm" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFBEB"/><stop offset="1" stop-color="#FEF3C7"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="${C.p300}" stop-opacity="0.55"/><stop offset="1" stop-color="${C.p300}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="glowWarm" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#FDE68A" stop-opacity="0.5"/><stop offset="1" stop-color="#FDE68A" stop-opacity="0"/>
  </radialGradient>
  <filter id="s1" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="${C.p700}" flood-opacity="0.10"/>
  </filter>
  <filter id="s2" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="${C.p700}" flood-opacity="0.14"/>
  </filter>
  <filter id="s3" x="-60%" y="-60%" width="220%" height="220%">
    <feDropShadow dx="0" dy="14" stdDeviation="20" flood-color="${C.p800}" flood-opacity="0.18"/>
  </filter>
</defs>`;

function svg(w, h, children) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Inter, Geist, 'Segoe UI', system-ui, sans-serif">${DEFS}${children}</svg>`;
}

function rr(x, y, w, h, r, fill, extra = '') {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
}

function poly(pts, fill, extra = '') {
  return `<path d="M ${pts.map(p => p.join(' ')).join(' L ')} Z" fill="${fill}" ${extra}/>`;
}

function sparkle(cx, cy, r, fill = C.p400) {
  const q = r * 0.42;
  return `<path d="M ${cx} ${cy - r} C ${cx + q} ${cy - r + q} ${cx + r} ${cy} C ${cx + q} ${cy + r - q} ${cx} ${cy + r} C ${cx - r + q} ${cy + r - q} ${cx - r} ${cy} C ${cx - r + q} ${cy - r + q} ${cx} ${cy - r} Z" fill="${fill}"/>`;
}

function shield(cx, cy, w, h, fill = C.p500) {
  return `<path d="M ${cx} ${cy - h} C ${cx + w * 0.36} ${cy - h * 0.92} ${cx + w * 0.5} ${cy - h * 0.5} ${cx + w * 0.5} ${cy - h * 0.06} L ${cx + w * 0.5} ${cy + h * 0.32} C ${cx + w * 0.5} ${cy + h * 0.54} ${cx + w * 0.22} ${cy + h * 0.62} ${cx} ${cy + h * 0.68} C ${cx - w * 0.22} ${cy + h * 0.62} ${cx - w * 0.5} ${cy + h * 0.54} ${cx - w * 0.5} ${cy + h * 0.32} L ${cx - w * 0.5} ${cy - h * 0.06} C ${cx - w * 0.5} ${cy - h * 0.5} ${cx - w * 0.36} ${cy - h * 0.92} ${cx} ${cy - h} Z" fill="${fill}"/>`;
}

function check(cx, cy, r, stroke = '#FFFFFF', w = 6) {
  return `<path d="M ${cx - r * 0.42} ${cy} L ${cx - r * 0.08} ${cy + r * 0.34} L ${cx + r * 0.46} ${cy - r * 0.34}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function badgeCircle(cx, cy, r, fill, ring = '#FFFFFF') {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${ring}" stroke-width="4"/>`;
}

function person({ x = 0, y = 0, s = 1, skin = C.skin1, hair = C.hair1, shirt = C.p500, pants = C.g800, pose = 'stand', flip = false } = {}) {
  let arms = '';
  if (pose === 'wave') {
    arms = `<g>
      <rect x="-58" y="-74" width="15" height="52" rx="7.5" fill="${C.p600}" transform="rotate(-42 -50.5 -48)"/>
      <circle cx="-54" cy="-22" r="8" fill="${skin}"/>
      <rect x="34" y="-60" width="15" height="54" rx="7.5" fill="${C.p600}"/>
      <circle cx="41.5" cy="-8" r="8" fill="${skin}"/>
    </g>`;
  } else if (pose === 'phone') {
    arms = `<g>
      <rect x="-46" y="-56" width="15" height="52" rx="7.5" fill="${C.p600}"/>
      <circle cx="-38.5" cy="-6" r="8" fill="${skin}"/>
      <rect x="28" y="-88" width="15" height="60" rx="7.5" fill="${C.p600}" transform="rotate(16 35.5 -58)"/>
      <circle cx="46" cy="-42" r="8" fill="${skin}"/>
      <rect x="40" y="-74" width="22" height="40" rx="6" fill="${C.g900}" stroke="${C.g300}" stroke-width="2"/>
      <rect x="43" y="-70" width="16" height="22" rx="3" fill="${C.p100}"/>
    </g>`;
  } else if (pose === 'carry') {
    arms = `<g>
      <rect x="-58" y="-52" width="15" height="44" rx="7.5" fill="${C.p600}" transform="rotate(-20 -50.5 -30)"/>
      <circle cx="-47" cy="-24" r="8" fill="${skin}"/>
      <rect x="43" y="-52" width="15" height="44" rx="7.5" fill="${C.p600}" transform="rotate(20 50.5 -30)"/>
      <circle cx="47" cy="-24" r="8" fill="${skin}"/>
    </g>`;
  } else {
    arms = `<g>
      <rect x="-48" y="-62" width="15" height="58" rx="7.5" fill="${C.p600}"/>
      <circle cx="-40.5" cy="-6" r="8" fill="${skin}"/>
      <rect x="33" y="-62" width="15" height="58" rx="7.5" fill="${C.p600}"/>
      <circle cx="40.5" cy="-6" r="8" fill="${skin}"/>
    </g>`;
  }
  const head = `<g>
    <circle cx="0" cy="-86" r="30" fill="${skin}"/>
    <path d="M -30,-84 A 30,30 0 0,1 30,-84 Q 24,-103 0,-105 Q -24,-103 -30,-84 Z" fill="${hair}"/>
    <path d="M -16,-88 Q -11,-92 -6,-88" fill="none" stroke="${hair}" stroke-width="3" stroke-linecap="round"/>
    <path d="M 6,-88 Q 11,-92 16,-88" fill="none" stroke="${hair}" stroke-width="3" stroke-linecap="round"/>
    <path d="M -9,-75 Q 0,-68 9,-75" fill="none" stroke="#B45309" stroke-width="3" stroke-linecap="round"/>
  </g>`;
  const legs = `<g>
    <rect x="-20" y="-2" width="16" height="54" rx="8" fill="${pants}"/>
    <rect x="4" y="-2" width="16" height="54" rx="8" fill="${pants}"/>
    <rect x="-26" y="46" width="21" height="12" rx="6" fill="${pants}"/>
    <rect x="2" y="46" width="21" height="12" rx="6" fill="${pants}"/>
  </g>`;
  const torso = `<rect x="-28" y="-62" width="56" height="64" rx="24" fill="${shirt}"/>`;
  const sc = flip ? `scale(-${s} ${s})` : `scale(${s})`;
  return `<g transform="translate(${x} ${y}) ${sc}">${legs}${arms}${torso}${head}</g>`;
}

function phone(x, y, s = 1, screen = '') {
  return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#s2)">
    <rect x="-105" y="-212" width="210" height="424" rx="42" fill="${C.g800}"/>
    <rect x="-96" y="-203" width="192" height="406" rx="34" fill="#FFFFFF"/>
    <circle cx="0" cy="-179" r="6" fill="${C.g800}"/>
    ${screen}
  </g>`;
}

function card(x, y, w, h, color, children = '', rotate = 0) {
  const inner = `translate(${x + w / 2} ${y + h / 2}) rotate(${rotate}) translate(${-w / 2} ${-h / 2})`;
  return `<g filter="url(#s2)"><g transform="${inner}"><rect width="${w}" height="${h}" rx="16" fill="#FFFFFF"/><rect width="${w}" height="${h}" rx="16" fill="${color}" opacity="0.55"/>${children}</g></g>`;
}

function chip(x, y, w, h, text, fill, tc = '#FFFFFF') {
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" filter="url(#s1)"/><text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="central" font-size="15" font-weight="600" fill="${tc}">${text}</text></g>`;
}

function isoPt(fx, fy, u, v, h = 0) {
  return [fx + (u - v) * SQ3, fy + (u + v) * 0.5 - h];
}

function isoBox(fx, fy, w, d, h, c) {
  const top = [isoPt(fx, fy, 0, 0, h), isoPt(fx, fy, w, 0, h), isoPt(fx, fy, w, d, h), isoPt(fx, fy, 0, d, h)];
  const right = [isoPt(fx, fy, 0, 0, 0), isoPt(fx, fy, w, 0, 0), isoPt(fx, fy, w, 0, h), isoPt(fx, fy, 0, 0, h)];
  const left = [isoPt(fx, fy, 0, 0, 0), isoPt(fx, fy, 0, d, 0), isoPt(fx, fy, 0, d, h), isoPt(fx, fy, 0, 0, h)];
  return poly(left, c.left) + poly(right, c.right) + poly(top, c.top);
}

function isoWindowR(fx, fy, w, z1, z2, w1, w2) {
  return poly([
    isoPt(fx, fy, w1, 0, z1),
    isoPt(fx, fy, w2, 0, z1),
    isoPt(fx, fy, w2, 0, z2),
    isoPt(fx, fy, w1, 0, z2),
  ], '#DBEAFE', 'opacity="0.9"');
}

function isoWindowL(fx, fy, d, z1, z2, d1, d2) {
  return poly([
    isoPt(fx, fy, 0, d1, z1),
    isoPt(fx, fy, 0, d2, z1),
    isoPt(fx, fy, 0, d2, z2),
    isoPt(fx, fy, 0, d1, z2),
  ], '#DBEAFE', 'opacity="0.9"');
}

function connector(x1, y1, x2, y2, ctrlY, dash = false, color = C.p400, w = 3) {
  const d = dash ? ` stroke-dasharray="2 9"` : '';
  return `<path d="M ${x1} ${y1} C ${x1} ${ctrlY}, ${x2} ${ctrlY}, ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"${d}/>`;
}

function groundBlob(w, h, cy, color = C.p200, op = 0.45) {
  return `<ellipse cx="${w / 2}" cy="${cy}" rx="${w * 0.36}" ry="${(h - cy) * 0.55}" fill="${color}" opacity="${op}"/>`;
}

function base(w, h, blobs = [], sky = 'sky') {
  let b = `<rect width="${w}" height="${h}" fill="url(#${sky})"/>`;
  b += `<ellipse cx="${w * 0.5}" cy="${h * 0.42}" rx="${w * 0.34}" ry="${h * 0.3}" fill="url(#glow)"/>`;
  blobs.forEach(g => b += g);
  return b;
}

function car(x, y, s, color = C.p600) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="16" rx="78" ry="14" fill="${C.p900}" opacity="0.12"/>
    <path d="M -70 6 Q -70 -16 -46 -16 L -38 -26 Q -34 -34 -20 -34 L 26 -34 Q 42 -34 52 -18 L 66 -16 Q 74 -16 74 -4 L 74 6 Z" fill="${color}"/>
    <path d="M -36 -16 L -20 -34 L 26 -34 L 42 -16 Z" fill="${C.p200}" opacity="0.85"/>
    <rect x="-70" y="-4" width="144" height="12" rx="6" fill="${C.p800}" opacity="0.25"/>
    <circle cx="-42" cy="8" r="14" fill="${C.g900}"/><circle cx="-42" cy="8" r="6" fill="${C.g500}"/>
    <circle cx="44" cy="8" r="14" fill="${C.g900}"/><circle cx="44" cy="8" r="6" fill="${C.g500}"/>
  </g>`;
}

function lamp(x, y, s, color = C.amber, baseC = C.p700) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="64" rx="52" ry="12" fill="${C.p900}" opacity="0.14"/>
    <rect x="-10" y="18" width="20" height="46" rx="8" fill="${baseC}"/>
    <path d="M -46 18 Q 0 -26 46 18 Z" fill="${color}"/>
    <rect x="-6" y="8" width="12" height="14" rx="4" fill="${baseC}"/>
  </g>`;
}

function teapot(x, y, s, body = C.p300, accent = C.p700) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="46" rx="44" ry="10" fill="${C.p900}" opacity="0.16"/>
    <path d="M -34 30 A 34 34 0 0 1 34 30 L 26 46 L -26 46 Z" fill="${body}"/>
    <path d="M -34 30 A 34 34 0 0 1 34 30" fill="none" stroke="${accent}" stroke-width="5"/>
    <rect x="-18" y="-14" width="36" height="18" rx="7" fill="${accent}"/>
    <path d="M 34 20 Q 58 20 52 40 Q 46 52 30 46" fill="none" stroke="${body}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="-2" cy="38" r="5" fill="${accent}"/>
  </g>`;
}

function cup(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="20" rx="24" ry="8" fill="${C.g800}" opacity="0.12"/>
    <path d="M -20 4 L 20 4 L 14 36 L -14 36 Z" fill="#FFFFFF" stroke="${C.p300}" stroke-width="3"/>
    <path d="M 20 10 Q 34 12 30 24 Q 26 32 14 30" fill="none" stroke="${C.p300}" stroke-width="3" stroke-linecap="round"/>
    <path d="M -10 -14 C -16 -6 -10 -2 -4 -8 M -4 -14 C -10 -6 -4 -2 2 -8" fill="none" stroke="${C.p400}" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}

function sofa(x, y, s, color = C.p700, cushion = C.p400) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="70" rx="150" ry="18" fill="${C.g900}" opacity="0.12"/>
    <rect x="-150" y="-40" width="300" height="108" rx="30" fill="${color}"/>
    <rect x="-124" y="-58" width="70" height="34" rx="14" fill="${color}"/>
    <rect x="54" y="-58" width="70" height="34" rx="14" fill="${color}"/>
    <rect x="-136" y="-30" width="64" height="58" rx="18" fill="${cushion}" opacity="0.85"/>
    <rect x="72" y="-30" width="64" height="58" rx="18" fill="${cushion}" opacity="0.85"/>
    <rect x="-150" y="-30" width="300" height="20" rx="10" fill="${color}" opacity="0.7"/>
    <rect x="-18" y="-70" width="36" height="44" rx="12" fill="${color}" opacity="0.5"/>
  </g>`;
}

function plant(x, y, s, pot = C.p500, leaf = C.green) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M 0 -46 C 14 -40 20 -26 18 -12 C 30 -22 40 -20 46 -8 C 46 -28 36 -46 24 -56 C 34 -56 44 -50 50 -40 C 44 -60 28 -66 14 -62 C 20 -70 14 -78 4 -76 C 12 -82 24 -82 30 -76 C 18 -90 2 -88 -8 -78 C 0 -92 -14 -94 -22 -84 C -12 -96 -30 -92 -34 -80 C -28 -90 -40 -80 -42 -68 C -34 -76 -46 -68 -46 -56 C -38 -64 -44 -52 -38 -44 C -30 -52 -20 -52 -12 -46 Z" fill="${leaf}"/>
    <path d="M -34 0 L 34 0 L 28 34 L -28 34 Z" fill="${pot}"/>
    <rect x="-22" y="34" width="44" height="18" rx="6" fill="${C.p700}"/>
  </g>`;
}

const scenes = {
  'signature-vintech-hero': () => {
    const W = 1600, H = 1000;
    let out = base(W, H, [
      `<circle cx="170" cy="140" r="90" fill="url(#sun)"/>`,
      `<circle cx="170" cy="140" r="130" fill="url(#glowWarm)"/>`,
    ]);
    out += `<ellipse cx="800" cy="990" rx="720" ry="90" fill="${C.p100}" opacity="0.8"/>`;
    out += `<path d="M 60 920 Q 800 880 1540 920 L 1540 1000 L 60 1000 Z" fill="${C.p200}" opacity="0.5"/>`;

    out += isoBox(720, 560, 300, 240, 240, { left: C.p400, right: C.p600, top: C.p200 });
    for (let i = 0; i < 3; i++) {
      out += isoWindowR(720, 560, 300, 60 + i * 60, 60 + i * 60 + 40, 50, 130);
      out += isoWindowL(720, 560, 240, 60 + i * 60, 60 + i * 60 + 40, 50, 130);
    }
    out += isoBox(720, 320, 90, 80, 46, { left: C.p500, right: C.p700, top: C.p300 });
    out += `<path d="M 1000 88 L 1090 88" stroke="${C.p400}" stroke-width="5" stroke-linecap="round"/>`;

    out += isoBox(330, 830, 260, 200, 330, { left: C.p400, right: C.p500, top: C.p200 });
    for (let i = 0; i < 4; i++) {
      out += isoWindowR(330, 830, 260, 60 + i * 68, 60 + i * 68 + 42, 55, 150);
      out += isoWindowL(330, 830, 200, 60 + i * 68, 60 + i * 68 + 42, 55, 150);
    }
    out += isoBox(330, 500, 60, 60, 30, { left: C.p500, right: C.p700, top: C.p300 });

    out += isoBox(1130, 830, 260, 200, 380, { left: C.p400, right: C.p600, top: C.p200 });
    for (let i = 0; i < 4; i++) {
      out += isoWindowR(1130, 830, 260, 60 + i * 76, 60 + i * 76 + 44, 55, 150);
      out += isoWindowL(1130, 830, 200, 60 + i * 76, 60 + i * 76 + 44, 55, 150);
    }
    out += isoBox(1130, 450, 40, 40, 60, { left: C.p400, right: C.p600, top: C.p200 });

    out += car(300, 908, 0.8, C.p600);
    out += car(1240, 942, 0.7, C.p800);

    out += person({ x: 505, y: 948, s: 0.62, skin: C.skin2, hair: C.hair3, shirt: C.p500, pose: 'carry', flip: true });
    out += person({ x: 760, y: 958, s: 0.66, skin: C.skin1, hair: C.hair1, shirt: C.p700, pose: 'stand' });
    out += person({ x: 1095, y: 952, s: 0.6, skin: C.skin3, hair: C.hair4, shirt: C.g800, pose: 'phone', flip: true });

    out += connector(505, 918, 290, 560, 640);
    out += connector(1095, 922, 1170, 500, 700, false, C.p300);
    out += connector(1170, 420, 700, 250, 360, true, C.p300, 3);

    out += card(210, 430, 160, 200, '#BFDBFE', `<g>
      <rect x="14" y="14" width="132" height="100" rx="12" fill="${C.p300}"/>
      <rect x="14" y="126" width="96" height="12" rx="6" fill="${C.g200}"/>
      <rect x="14" y="146" width="72" height="12" rx="6" fill="${C.g300}"/>
      ${chip(96, 160, 60, 26, 'ETB 4,500', C.p700)}
    </g>`, -5);
    out += `<g>${badgeCircle(160, 398, 26, C.p500)}${check(160, 398, 13)}</g>`;

    out += card(1160, 380, 160, 200, '#DBEAFE', `<g>
      <rect x="14" y="14" width="132" height="100" rx="12" fill="${C.p400}"/>
      <rect x="14" y="126" width="96" height="12" rx="6" fill="${C.g200}"/>
      <rect x="14" y="146" width="72" height="12" rx="6" fill="${C.g300}"/>
      ${chip(90, 160, 64, 26, 'ETB 1,850', C.p700)}
    </g>`, 4);
    out += `<g>${shield(1320, 340, 44, 54, C.p500)}${check(1320, 344, 15)}</g>`;

    out += card(600, 120, 150, 190, '#93C5FD', `<g>
      <rect x="14" y="14" width="122" height="92" rx="12" fill="${C.p300}"/>
      <rect x="14" y="120" width="88" height="12" rx="6" fill="${C.g200}"/>
      <rect x="14" y="142" width="66" height="12" rx="6" fill="${C.g300}"/>
      ${chip(84, 98, 58, 26, 'ETB 850', C.p600)}
    </g>`);

    out += `${badgeCircle(612, 96, 30, C.green, '#FFFFFF')}${check(612, 96, 15, '#FFFFFF', 7)}`;
    out += sparkle(700, 200, 20, C.amber);
    out += sparkle(300, 300, 26, C.p500);
    out += sparkle(1150, 260, 22, C.amber);
    out += sparkle(500, 470, 18, C.p300);
    out += sparkle(1380, 160, 30, C.p500);
    out += sparkle(170, 470, 24, C.p400);
    out += sparkle(1560, 620, 20, C.amber);
    out += sparkle(120, 700, 18, C.p300);
    out += chip(70, 830, 150, 34, 'Trusted Seller', C.green);
    out += chip(1010, 250, 160, 34, 'AI Assisted', C.p600);
    return svg(W, H, out);
  },

  'onboarding-create-account': () => {
    const W = 1200, H = 1000;
    let out = base(W, H, [groundBlob(W, H, 940), sparkle(250, 220, 24, C.p400), sparkle(980, 200, 20, C.amber), sparkle(200, 620, 16, C.p300)]);
    out += person({ x: 340, y: 720, s: 1.05, skin: C.skin2, hair: C.hair2, shirt: C.p700, pose: 'wave', flip: true });
    out += `<g>${badgeCircle(470, 470, 34, C.green)}${check(470, 470, 17)}</g>`;
    out += sparkle(520, 430, 18, C.amber);
    out += `<g>${shield(180, 520, 40, 50, C.p500)}${check(180, 524, 13)}</g>`;
    out += phone(780, 430, 1.12, `<g>
      <circle cx="0" cy="-140" r="34" fill="${C.p100}"/>
      <circle cx="0" cy="-140" r="26" fill="${C.p300}"/>
      <path d="M -8 -140 L 8 -140 M 0 -148 L 0 -132" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
      <rect x="-74" y="-86" width="148" height="52" rx="14" fill="${C.p100}"/>
      <rect x="-60" y="-70" width="56" height="20" rx="10" fill="${C.p500}"/>
      ${input(-74, -16, 148, 40)}
      ${input(-74, 40, 148, 40)}
      <rect x="-74" y="98" width="148" height="46" rx="14" fill="${C.p500}"/>
      <rect x="-54" y="112" width="108" height="18" rx="9" fill="${C.p300}" opacity="0.7"/>
    </g>`);
    out += chip(500, 150, 220, 36, 'Create your account', C.p700);
    out += sparkle(960, 220, 20, C.p300);
    out += sparkle(940, 640, 22, C.p500);
    return svg(W, H, out);
  },

  'onboarding-list-item': () => {
    const W = 1200, H = 1000;
    let out = base(W, H, [groundBlob(W, H, 950), sparkle(230, 220, 22, C.amber), sparkle(980, 260, 20, C.p400)]);
    out += person({ x: 330, y: 730, s: 1.02, skin: C.skin1, hair: C.hair1, shirt: C.p500, pose: 'phone' });
    out += lamp(500, 740, 0.95);
    out += connector(395, 640, 600, 560, 600, true, C.p300, 3);
    out += sparkle(470, 600, 16, C.p300);
    out += card(640, 380, 240, 280, '#BFDBFE', `<g>
      <rect x="16" y="16" width="208" height="150" rx="14" fill="${C.p300}"/>
      <path d="M 60 166 L 180 166" stroke="${C.p100}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="200" cy="32" r="14" fill="${C.amber}"/><circle cx="200" cy="32" r="5" fill="#FFFFFF"/>
      <rect x="16" y="186" width="120" height="16" rx="8" fill="${C.g200}"/>
      <rect x="16" y="214" width="160" height="14" rx="7" fill="${C.g300}"/>
      ${chip(150, 236, 80, 30, 'ETB 3,200', C.p700)}
    </g>`, -3);
    out += `<g>${badgeCircle(655, 360, 28, C.green)}${check(655, 360, 14)}</g>`;
    out += chip(700, 240, 210, 36, 'Your item is now live', C.green);
    out += sparkle(960, 660, 24, C.p500);
    out += sparkle(300, 480, 18, C.p300);
    out += sparkle(1040, 500, 18, C.amber);
    return svg(W, H, out);
  },

  'onboarding-receive-offers': () => {
    const W = 1200, H = 1000;
    let out = base(W, H, [groundBlob(W, H, 950), sparkle(230, 210, 22, C.p500), sparkle(1020, 210, 20, C.amber)]);
    out += person({ x: 330, y: 730, s: 1.02, skin: C.skin1, hair: C.hair1, shirt: C.p700, pose: 'phone' });
    out += person({ x: 880, y: 735, s: 0.98, skin: C.skin3, hair: C.hair4, shirt: C.g800, pose: 'wave', flip: true });
    out += badgeCircle(250, 560, 30, C.p500);
    out += check(250, 560, 15);
    out += connector(470, 680, 790, 680, 700);
    out += connector(470, 660, 790, 660, 620, true, C.p300, 3);
    out += card(470, 300, 280, 190, '#DBEAFE', `<g>
      <circle cx="52" cy="52" r="26" fill="${C.p300}"/>
      <path d="M 36 40 A 12 12 0 0 1 56 58 L 40 64 L 44 52 Z" fill="${C.p500}"/>
      <rect x="92" y="34" width="120" height="14" rx="7" fill="${C.g300}"/>
      <rect x="92" y="58" width="90" height="14" rx="7" fill="${C.g200}"/>
      <rect x="40" y="92" width="210" height="48" rx="14" fill="#FFFFFF" stroke="${C.p200}" stroke-width="2"/>
      <rect x="56" y="108" width="70" height="16" rx="8" fill="${C.p500}"/>
      <rect x="140" y="108" width="70" height="16" rx="8" fill="${C.p500}"/>
      ${chip(150, 160, 110, 28, 'Offer · ETB 2,900', C.p600)}
    </g>`, -2);
    out += chip(600, 250, 210, 36, 'New offer received!', C.green);
    out += sparkle(880, 560, 18, C.amber);
    out += sparkle(620, 220, 20, C.p300);
    out += sparkle(1080, 620, 22, C.p500);
    out += `<circle cx="900" cy="520" r="30" fill="${C.green}" stroke="#FFFFFF" stroke-width="5"/><text x="900" y="526" text-anchor="middle" dominant-baseline="central" font-size="30" font-weight="700" fill="#FFFFFF">+</text>`;
    return svg(W, H, out);
  },

  'empty-search-results': () => {
    const W = 1024, H = 1024;
    let out = base(W, H, [sparkle(220, 250, 22, C.p300), sparkle(830, 240, 24, C.amber), sparkle(180, 780, 18, C.p400)]);
    out += `<ellipse cx="512" cy="930" rx="320" ry="54" fill="${C.p100}" opacity="0.7"/>`;
    out += card(262, 250, 500, 500, '#DBEAFE', `<g>
      <rect x="40" y="40" width="420" height="64" rx="16" fill="#FFFFFF" stroke="${C.p200}" stroke-width="2"/>
      <circle cx="80" cy="72" r="20" fill="none" stroke="${C.p400}" stroke-width="7"/>
      <path d="M 94 86 L 112 104" stroke="${C.p400}" stroke-width="7" stroke-linecap="round"/>
      <rect x="126" y="62" width="150" height="20" rx="10" fill="${C.g300}"/>
      <circle cx="408" cy="72" r="18" fill="${C.p100}"/>
      <path d="M 398 68 L 412 76 M 408 66 L 416 72 M 402 76 L 410 66" stroke="${C.p400}" stroke-width="4" stroke-linecap="round"/>
      <g transform="translate(250 250)">
        <circle cx="0" cy="0" r="110" fill="none" stroke="${C.p200}" stroke-width="10" stroke-dasharray="16 14"/>
        <circle cx="0" cy="0" r="74" fill="${C.p100}"/>
        <circle cx="0" cy="0" r="52" fill="${C.p200}"/>
        <path d="M 66 -58 L 92 -84" stroke="${C.p500}" stroke-width="14" stroke-linecap="round"/>
        <path d="M -30 -30 L 30 30 M 30 -30 L -30 30" stroke="${C.p400}" stroke-width="12" stroke-linecap="round"/>
      </g>
      ${chip(150, 398, 200, 48, 'No results found', C.p700)}
      ${chip(140, 458, 220, 44, 'Try a different search', C.p500)}
    </g>`, 1);
    out += sparkle(300, 250, 20, C.p500);
    out += sparkle(720, 300, 22, C.p300);
    out += sparkle(760, 720, 20, C.amber);
    return svg(W, H, out);
  },

  'empty-favorites': () => {
    const W = 1024, H = 1024;
    let out = base(W, H, [sparkle(200, 260, 22, C.amber), sparkle(850, 260, 20, C.p300), sparkle(200, 780, 18, C.p400)]);
    out += `<ellipse cx="512" cy="930" rx="320" ry="54" fill="${C.p100}" opacity="0.7"/>`;
    out += card(262, 250, 500, 500, '#DBEAFE', `<g>
      <g transform="translate(250 230)">
        <path d="M 0 74 C -96 24 -128 -52 -64 -100 C -28 -126 0 -104 0 -86 C 0 -104 28 -126 64 -100 C 128 -52 96 24 0 74 Z" fill="${C.p300}"/>
        <path d="M 0 54 C -72 16 -98 -40 -50 -78 C -24 -95 0 -80 0 -66 C 0 -80 24 -95 50 -78 C 98 -40 72 16 0 54 Z" fill="#FFFFFF"/>
        <path d="M 0 40 C -10 32 -18 20 -18 8 C -18 -4 -8 -10 0 -6 C 8 -10 18 -4 18 8 C 18 20 10 32 0 40 Z" fill="${C.red}"/>
        <path d="M -18 -120 L -30 -138 M 18 -120 L 30 -138 M -46 -96 L -66 -106 M 46 -96 L 66 -106" stroke="${C.p200}" stroke-width="6" stroke-linecap="round"/>
        ${sparkle(70, -130, 18, C.amber)}
        ${sparkle(-70, -140, 14, C.p500)}
      </g>
      ${chip(150, 396, 200, 48, 'No favorites yet', C.p700)}
      ${chip(120, 456, 260, 44, 'Tap the heart to save items', C.p500)}
    </g>`, -1);
    out += sparkle(300, 300, 20, C.p300);
    out += sparkle(740, 300, 22, C.amber);
    out += sparkle(700, 760, 20, C.p500);
    return svg(W, H, out);
  },

  'empty-listings': () => {
    const W = 1024, H = 1024;
    let out = base(W, H, [sparkle(210, 260, 22, C.p300), sparkle(840, 300, 20, C.amber)]);
    out += `<ellipse cx="512" cy="940" rx="340" ry="52" fill="${C.p100}" opacity="0.7"/>`;
    out += card(212, 230, 600, 540, '#DBEAFE', `<g>
      ${[0, 1, 2].map(i => {
        const x = 60 + i * 180;
        return `<g>
          <rect x="${x}" y="60" width="120" height="150" rx="14" fill="none" stroke="${C.p300}" stroke-width="4" stroke-dasharray="12 12"/>
          <rect x="${x + 14}" y="80" width="92" height="70" rx="10" fill="${C.p100}"/>
          <path d="M ${x + 34} ${110} L ${x + 86} ${110} M ${x + 34} ${130} L ${x + 70} ${130}" stroke="${C.p300}" stroke-width="6" stroke-linecap="round"/>
          <rect x="${x + 14}" y="162" width="60" height="12" rx="6" fill="${C.g300}"/>
          <rect x="${x + 14}" y="182" width="40" height="12" rx="6" fill="${C.g200}"/>
        </g>`;
      }).join('')}
      <rect x="240" y="256" width="120" height="46" rx="23" fill="${C.p500}" filter="url(#s1)"/>
      <path d="M 284 279 L 316 279 M 300 265 L 300 293" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round"/>
      ${chip(240, 330, 220, 40, 'Your listings appear here', C.g500, C.g800)}
      ${chip(240, 386, 180, 40, 'Start with "List an item"', C.p700)}
    </g>`);
    out += sparkle(300, 300, 20, C.p400);
    out += sparkle(720, 300, 22, C.amber);
    out += sparkle(760, 780, 20, C.p300);
    return svg(W, H, out);
  },

  'empty-offers': () => {
    const W = 1024, H = 1024;
    let out = base(W, H, [sparkle(210, 260, 22, C.amber), sparkle(850, 300, 20, C.p400)]);
    out += `<ellipse cx="512" cy="930" rx="320" ry="54" fill="${C.p100}" opacity="0.7"/>`;
    out += card(262, 250, 500, 500, '#DBEAFE', `<g>
      <g transform="translate(250 250)">
        <path d="M 0 -120 Q 96 -120 96 -52 Q 96 -18 64 0 L 64 26 L 34 6 Q 18 8 0 8 Q -96 8 -96 -52 Q -96 -120 0 -120 Z" fill="#FFFFFF" stroke="${C.p300}" stroke-width="8"/>
        <path d="M 26 -52 L 26 -52 Q 26 -26 0 -26 Q -26 -26 -26 -52 Q -26 -78 0 -78 Q 14 -78 26 -70" fill="none" stroke="${C.p400}" stroke-width="9" stroke-linecap="round"/>
        ${sparkle(86, -110, 18, C.amber)}
      </g>
      ${chip(150, 396, 200, 48, 'No offers yet', C.p700)}
      ${chip(110, 456, 280, 44, 'Buyers will message you here', C.p500)}
    </g>`);
    out += sparkle(300, 300, 20, C.p300);
    out += sparkle(740, 760, 20, C.amber);
    return svg(W, H, out);
  },

  'error-404': () => {
    const W = 1024, H = 1024;
    let out = base(W, H, [sparkle(200, 300, 22, C.p300), sparkle(850, 340, 20, C.red), sparkle(840, 760, 20, C.p400)]);
    out += `<ellipse cx="512" cy="940" rx="340" ry="52" fill="${C.p100}" opacity="0.7"/>`;
    out += `<text x="512" y="330" text-anchor="middle" font-size="240" font-weight="800" fill="${C.p100}" transform="translate(0 12)">404</text>`;
    out += `<text x="512" y="330" text-anchor="middle" font-size="240" font-weight="800" fill="url(#primary)">404</text>`;
    out += card(262, 420, 500, 210, '#DBEAFE', `<g>
      <g transform="translate(120 60)">
        <circle cx="0" cy="0" r="42" fill="${C.p300}"/>
        <path d="M 0 42 L 0 84 M 0 84 Q 26 110 56 110 M 0 84 Q -26 110 -56 110" fill="none" stroke="${C.p400}" stroke-width="9" stroke-linecap="round"/>
        <path d="M 0 -4 L 0 18 M -24 10 L -12 26 M 24 10 L 12 26" stroke="${C.p700}" stroke-width="8" stroke-linecap="round"/>
      </g>
      <text x="180" y="70" font-size="26" font-weight="700" fill="${C.g800}">This page is off the map</text>
      <rect x="180" y="90" width="230" height="14" rx="7" fill="${C.g300}"/>
      <rect x="180" y="114" width="180" height="14" rx="7" fill="${C.g200}"/>
      ${chip(180, 148, 170, 40, 'Back to Home', C.p600)}
    </g>`);
    out += chip(690, 380, 90, 36, 'Error', C.red);
    return svg(W, H, out);
  },

  'error-500': () => {
    const W = 1024, H = 1024;
    let out = base(W, H, [sparkle(210, 320, 22, C.amber), sparkle(850, 340, 20, C.red)]);
    out += `<ellipse cx="512" cy="940" rx="340" ry="52" fill="${C.p100}" opacity="0.7"/>`;
    out += `<text x="512" y="330" text-anchor="middle" font-size="240" font-weight="800" fill="${C.p100}" transform="translate(0 12)">500</text>`;
    out += `<text x="512" y="330" text-anchor="middle" font-size="240" font-weight="800" fill="url(#navy)">500</text>`;
    out += card(262, 420, 500, 210, '#DBEAFE', `<g>
      <g transform="translate(120 66)">
        <rect x="-44" y="40" width="88" height="26" rx="8" fill="${C.p600}"/>
        <rect x="-52" y="0" width="104" height="30" rx="8" fill="${C.p400}"/>
        <rect x="-60" y="-40" width="120" height="30" rx="8" fill="${C.p300}"/>
        <circle cx="0" cy="-74" r="14" fill="${C.amber}"/>
        <path d="M -46 -24 L -66 -14 M -66 -14 L -54 -2 M -46 -24 L -56 -22" stroke="${C.g600}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <text x="180" y="70" font-size="26" font-weight="700" fill="${C.g800}">Something went wrong on our side</text>
      <rect x="180" y="90" width="240" height="14" rx="7" fill="${C.g300}"/>
      <rect x="180" y="114" width="190" height="14" rx="7" fill="${C.g200}"/>
      ${chip(180, 148, 170, 40, 'Try again', C.p600)}
    </g>`);
    out += chip(690, 380, 90, 36, 'Error', C.red);
    return svg(W, H, out);
  },

  'error-offline': () => {
    const W = 1024, H = 1024;
    let out = base(W, H, [sparkle(210, 320, 22, C.p300), sparkle(860, 360, 20, C.red)]);
    out += `<ellipse cx="512" cy="940" rx="340" ry="52" fill="${C.p100}" opacity="0.7"/>`;
    out += `<g transform="translate(512 300)">
      <path d="M 0 -110 Q -90 -110 -90 -40 Q -90 -10 -60 0 L 60 0 Q 90 -10 90 -40 Q 90 -110 0 -110 Z" fill="${C.p300}"/>
      <path d="M 0 -88 Q -60 -88 -60 -40 Q -60 -18 -40 -12 L 40 -12 Q 60 -18 60 -40 Q 60 -88 0 -88 Z" fill="${C.p400}"/>
      <path d="M -56 60 A 78 78 0 0 1 56 60 M -30 60 A 46 46 0 0 1 30 60 M -4 60 A 18 18 0 0 1 4 60" fill="none" stroke="${C.p600}" stroke-width="10" stroke-linecap="round"/>
      <path d="M -66 84 L 66 84" stroke="${C.red}" stroke-width="14" stroke-linecap="round"/>
    </g>`;
    out += card(262, 480, 500, 180, '#DBEAFE', `<g>
      <g transform="translate(120 44)">
        <rect x="-46" y="-30" width="92" height="66" rx="18" fill="${C.p700}"/>
        <circle cx="0" cy="-70" r="22" fill="${C.p500}" stroke="#FFFFFF" stroke-width="5"/>
        <rect x="-20" y="-12" width="40" height="28" rx="6" fill="${C.p100}"/>
      </g>
      <text x="180" y="60" font-size="26" font-weight="700" fill="${C.g800}">You appear to be offline</text>
      <rect x="180" y="80" width="220" height="14" rx="7" fill="${C.g300}"/>
      ${chip(180, 116, 190, 40, 'Reconnect to browse', C.p600)}
    </g>`);
    out += chip(700, 400, 90, 36, 'Offline', C.red);
    return svg(W, H, out);
  },

  'ai-before-after': () => {
    const W = 1600, H = 800;
    let out = base(W, H, [sparkle(300, 220, 22, C.p300), sparkle(1340, 220, 22, C.amber), sparkle(620, 560, 18, C.p400), sparkle(1010, 620, 18, C.p300)]);
    out += `<rect x="60" y="180" width="600" height="380" rx="20" fill="#FFFFFF" filter="url(#s2)"/>`;
    out += `<g transform="translate(80 200)">
      <rect x="0" y="0" width="560" height="300" rx="12" fill="${C.g100}"/>
      <rect x="30" y="30" width="380" height="220" rx="10" fill="${C.g300}"/>
      ${teapot(260, 170, 0.85, C.g500, C.g400)}
      <rect x="430" y="30" width="100" height="90" rx="8" fill="${C.g200}"/>
      <rect x="430" y="130" width="100" height="90" rx="8" fill="${C.g300}"/>
      <path d="M 30 270 L 590 270" stroke="${C.g400}" stroke-width="3" stroke-dasharray="10 10"/>
      <rect x="30" y="282" width="26" height="26" rx="4" fill="${C.g400}"/>
      <path d="M 30 295 L 30 310 M 43 295 L 43 310 M 56 295 L 56 310 M 30 302 L 56 302 M 30 306 L 56 306" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
    </g>`;
    out += chip(90, 130, 110, 36, 'BEFORE · RAW', C.g500, '#FFFFFF');
    out += chip(560, 170, 74, 34, 'Photo', C.g400, '#FFFFFF');

    out += `<g transform="translate(770 360)"><path d="M -90 0 H 110 M 82 -24 L 118 0 L 82 24" fill="none" stroke="${C.p500}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    out += `<circle cx="770" cy="250" r="48" fill="${C.p600}"/><circle cx="770" cy="250" r="36" fill="${C.p500}"/><text x="770" y="254" text-anchor="middle" dominant-baseline="central" font-size="34" font-weight="800" fill="#FFFFFF">AI</text>`;
    out += sparkle(640, 300, 20, C.amber);

    out += card(880, 180, 620, 400, '#BFDBFE', `<g>
      <rect x="20" y="20" width="580" height="280" rx="14" fill="${C.p100}"/>
      ${teapot(250, 110, 1.05, C.p400, C.p700)}
      <rect x="20" y="320" width="230" height="18" rx="9" fill="${C.p600}"/>
      <rect x="20" y="350" width="170" height="14" rx="7" fill="${C.p300}"/>
      ${chip(400, 320, 150, 42, 'ETB 1,850', C.p700)}
      ${chip(480, 372, 110, 36, 'Listed', C.green)}
    </g>`, -2);
    out += `<g>${badgeCircle(1440, 150, 30, C.green)}${check(1440, 150, 15)}</g>`;
    out += chip(900, 150, 110, 34, 'AFTER · LIVE', C.green);
    out += sparkle(930, 120, 18, C.p300);
    return svg(W, H, out);
  },

  'trust-verified-seller': () => {
    const W = 1200, H = 1000;
    let out = base(W, H, [groundBlob(W, H, 960), sparkle(230, 230, 22, C.p400), sparkle(1020, 220, 20, C.amber)]);
    out += person({ x: 250, y: 780, s: 0.9, skin: C.skin2, hair: C.hair3, shirt: C.p700, pose: 'stand' });
    out += `<g transform="translate(400 560)"><g>${shield(0, 0, 110, 132, C.p500)}${shield(0, 0, 86, 106, C.p400)}</g><circle cx="0" cy="26" r="34" fill="${C.p100}"/><circle cx="0" cy="26" r="25" fill="${C.skin2}"/><path d="M -25 26 A 25 25 0 0 1 25 26 Q 20 15 0 13 Q -20 15 -25 26 Z" fill="${C.hair3}"/></g>`;
    out += badgeCircle(455, 540, 26, C.green);
    out += check(455, 540, 13);
    out += card(600, 420, 420, 300, '#DBEAFE', `<g>
      <rect x="30" y="34" width="120" height="120" rx="16" fill="${C.p300}"/>
      <circle cx="90" cy="94" r="30" fill="${C.skin1}"/>
      <rect x="60" y="120" width="60" height="18" rx="9" fill="${C.hair1}"/>
      <rect x="180" y="50" width="140" height="20" rx="10" fill="${C.g800}"/>
      <rect x="180" y="86" width="100" height="16" rx="8" fill="${C.g400}"/>
      <rect x="180" y="114" width="70" height="16" rx="8" fill="${C.g300}"/>
      ${chip(180, 152, 150, 40, 'Verified Seller', C.green)}
      ${sparkle(370, 40, 16, C.amber)}
    </g>`, -3);
    out += `<g>${badgeCircle(600, 400, 34, C.p500)}${check(600, 400, 17)}</g>`;
    out += chip(680, 230, 240, 40, 'Fayda verified identity', C.p700);
    out += sparkle(980, 700, 24, C.p300);
    out += sparkle(150, 420, 18, C.amber);
    return svg(W, H, out);
  },

  'trust-safe-transactions': () => {
    const W = 1200, H = 1000;
    let out = base(W, H, [groundBlob(W, H, 960), sparkle(210, 230, 22, C.p400), sparkle(1000, 240, 20, C.amber)]);
    out += `<g transform="translate(400 700)"><rect x="-70" y="-40" width="140" height="64" rx="30" fill="${C.skin3}"/><rect x="90" y="-40" width="140" height="64" rx="30" fill="${C.skin1}"/></g>`;
    out += `<g transform="translate(600 470) rotate(-4)" filter="url(#s2)">
      <rect x="-115" y="-232" width="230" height="464" rx="46" fill="${C.g800}"/>
      <rect x="-105" y="-222" width="210" height="444" rx="36" fill="#FFFFFF"/>
      <rect x="-70" y="-190" width="140" height="100" rx="14" fill="${C.p100}"/>
      <rect x="-50" y="-168" width="100" height="56" rx="10" fill="${C.p400}"/>
      <path d="M -30 -160 L -20 -146 L -2 -168 M 0 -140 L 12 -152 M 26 -160 L 18 -146" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" fill="none"/>
      <rect x="-70" y="-60" width="140" height="120" rx="14" fill="${C.p50}" stroke="${C.p300}" stroke-width="2"/>
      <path d="M -50 -40 L -10 -10 L 50 -60" fill="none" stroke="${C.green}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="-40" y="80" width="80" height="40" rx="8" fill="${C.g800}"/>
      <rect x="-34" y="74" width="68" height="34" rx="6" fill="${C.g500}"/>
      <path d="M -18 100 L 18 100" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
    </g>`;
    out += `<g transform="translate(600 330)">${shield(0, 0, 120, 146, C.p600)}${shield(0, 0, 96, 120, C.p500)}${check(0, 6, 30, '#FFFFFF', 12)}</g>`;
    out += `<circle cx="430" cy="280" r="40" fill="${C.amber}"/><text x="430" y="282" text-anchor="middle" dominant-baseline="central" font-size="22" font-weight="700" fill="#FFFFFF">ETB</text>`;
    out += `<circle cx="770" cy="280" r="40" fill="${C.green}"/><path d="M 752 280 L 764 292 L 790 268" stroke="#FFFFFF" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    out += chip(470, 760, 260, 42, 'Pay on handover, in-app', C.p700);
    out += sparkle(350, 180, 18, C.p300);
    out += sparkle(880, 180, 18, C.amber);
    out += sparkle(1000, 760, 22, C.p400);
    return svg(W, H, out);
  },

  'trust-community-marketplace': () => {
    const W = 1200, H = 1000;
    let out = base(W, H, [groundBlob(W, H, 970), sparkle(210, 220, 22, C.p400), sparkle(1030, 230, 20, C.amber)]);
    out += person({ x: 260, y: 800, s: 0.85, skin: C.skin2, hair: C.hair4, shirt: C.g800, pose: 'carry' });
    out += person({ x: 940, y: 800, s: 0.85, skin: C.skin3, hair: C.hair2, shirt: C.p600, pose: 'phone', flip: true });
    out += person({ x: 600, y: 840, s: 0.9, skin: C.skin1, hair: C.hair1, shirt: C.p700, pose: 'wave' });
    out += `<g transform="translate(600 560)">
      <rect x="-80" y="-64" width="160" height="34" rx="10" fill="${C.p500}"/>
      <rect x="-70" y="-40" width="140" height="120" rx="12" fill="${C.p300}"/>
      <rect x="-40" y="-30" width="80" height="52" rx="6" fill="${C.p100}"/>
      <path d="M -70 30 L 70 30" stroke="${C.p400}" stroke-width="6" stroke-linecap="round"/>
      <path d="M -16 30 L -16 80 L 16 80 L 16 30" fill="${C.p500}"/>
    </g>`;
    out += connector(260, 700, 520, 570, 620);
    out += connector(940, 700, 680, 570, 620);
    out += connector(600, 700, 600, 590, 640, true, C.p300, 3);
    out += badgeCircle(300, 620, 30, C.green);
    out += check(300, 620, 15);
    out += badgeCircle(900, 620, 30, C.p500);
    out += check(900, 620, 15);
    out += sparkle(600, 380, 22, C.amber);
    out += sparkle(430, 430, 18, C.p300);
    out += sparkle(780, 430, 18, C.p300);
    out += sparkle(200, 560, 16, C.p400);
    out += sparkle(1020, 560, 16, C.p400);
    return svg(W, H, out);
  },

  'photo-modern-apartment': () => {
    const W = 1600, H = 1200;
    let out = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
    out += `<rect width="${W}" height="${H}" fill="url(#glowWarm)" opacity="0.6"/>`;
    out += `<rect x="0" y="0" width="900" height="560" fill="#FFFFFF" opacity="0.85"/>`;
    out += `<rect x="110" y="140" width="680" height="360" rx="16" fill="${C.p200}"/>`;
    out += `<rect x="140" y="170" width="620" height="300" rx="10" fill="${C.p400}"/>`;
    out += `<circle cx="220" cy="230" r="34" fill="url(#sun)"/>`;
    out += `<path d="M 160 470 Q 300 380 440 470" fill="none" stroke="${C.p300}" stroke-width="6" stroke-linecap="round"/>`;
    out += `<rect x="900" y="0" width="700" height="1200" fill="${C.p100}" opacity="0.5"/>`;
    out += `<rect x="0" y="940" width="${W}" height="260" fill="${C.g100}"/>`;
    out += `<path d="M 0 940 Q 800 900 1600 940 L 1600 1200 L 0 1200 Z" fill="${C.g200}"/>`;
    out += sofa(500, 880, 1.15, C.p700, C.p400);
    out += plant(1050, 900, 1.1);
    out += plant(380, 940, 0.8);
    out += `<g transform="translate(880 880)">
      <ellipse cx="0" cy="60" rx="120" ry="20" fill="${C.p900}" opacity="0.10"/>
      <path d="M -96 40 L 96 40 L 96 62 L -96 62 Z" fill="${C.p600}"/>
      <path d="M -120 62 L 120 62 L 110 74 L -110 74 Z" fill="${C.p500}"/>
      <path d="M -80 30 Q -40 40 0 30 Q 40 40 80 30" fill="none" stroke="${C.p300}" stroke-width="8" stroke-linecap="round"/>
    </g>`;
    out += teapot(880, 830, 1.0, C.p300, C.p700);
    out += lamp(120, 820, 1.0, C.amber, C.p700);
    out += `<g transform="translate(1400 200) rotate(6)">
      <rect x="-80" y="-100" width="160" height="200" rx="10" fill="#FFFFFF" filter="url(#s1)"/>
      <rect x="-64" y="-84" width="128" height="120" rx="8" fill="${C.p400}"/>
      <path d="M -40 -60 Q 0 -20 40 -60 M -40 -30 Q 0 10 40 -30" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round"/>
    </g>`;
    out += sparkle(1500, 560, 22, C.amber);
    out += sparkle(100, 300, 20, C.p400);
    return svg(W, H, out);
  },

  'photo-seller-taking-photos': () => {
    const W = 1600, H = 1200;
    let out = `<rect width="${W}" height="${H}" fill="url(#skyDeep)"/>`;
    out += `<ellipse cx="${W / 2}" cy="${H * 0.42}" rx="${W * 0.3}" ry="${H * 0.3}" fill="url(#glow)"/>`;
    out += `<rect x="0" y="880" width="${W}" height="320" fill="${C.g100}"/>`;
    out += `<path d="M 0 880 Q 800 830 1600 880 L 1600 1200 L 0 1200 Z" fill="${C.g200}"/>`;
    out += `<g transform="translate(1120 300)">
      <circle cx="0" cy="0" r="130" fill="${C.g900}"/>
      <circle cx="0" cy="0" r="112" fill="#FFFFFF"/>
      <circle cx="0" cy="0" r="70" fill="${C.p500}"/>
      <circle cx="0" cy="0" r="30" fill="#FFFFFF" opacity="0.9"/>
      <rect x="-6" y="120" width="12" height="452" rx="6" fill="${C.g300}"/>
      <rect x="-90" y="560" width="180" height="20" rx="10" fill="${C.g400}"/>
    </g>`;
    out += lamp(460, 810, 1.15);
    out += `<g transform="translate(1200 780)"><ellipse cx="0" cy="60" rx="110" ry="18" fill="${C.p900}" opacity="0.12"/><rect x="-90" y="0" width="180" height="120" rx="14" fill="${C.g800}"/><path d="M -60 20 Q -30 44 0 20 Q 30 44 60 20 M -44 52 Q 0 74 44 52" stroke="${C.p400}" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="-40" y="70" width="80" height="12" rx="6" fill="${C.g500}"/></g>`;
    out += person({ x: 420, y: 813, s: 1.15, skin: C.skin1, hair: C.hair1, shirt: C.p500, pose: 'phone' });
    out += connector(500, 800, 860, 640, 720, true, C.p300, 4);
    out += sparkle(700, 420, 22, C.amber);
    out += sparkle(1000, 560, 20, C.p400);
    out += sparkle(1500, 700, 24, C.p300);
    out += chip(520, 560, 180, 40, 'Listing photo mode', C.p700);
    return svg(W, H, out);
  },

  'photo-buyer-meeting-seller': () => {
    const W = 1600, H = 1200;
    let out = `<rect width="${W}" height="${H}" fill="url(#warm)"/>`;
    out += `<ellipse cx="${W * 0.5}" cy="${H * 0.4}" rx="${W * 0.32}" ry="${H * 0.3}" fill="url(#glowWarm)"/>`;
    out += `<rect x="0" y="880" width="${W}" height="320" fill="${C.g100}"/>`;
    out += `<path d="M 0 880 Q 800 830 1600 880 L 1600 1200 L 0 1200 Z" fill="${C.g200}"/>`;
    out += `<rect x="1050" y="240" width="450" height="300" rx="16" fill="${C.p200}" opacity="0.9"/>`;
    out += `<circle cx="1220" cy="320" r="40" fill="url(#sun)"/>`;
    out += `<path d="M 1110 500 Q 1250 400 1380 500" fill="none" stroke="${C.p300}" stroke-width="6" stroke-linecap="round"/>`;
    out += plant(180, 900, 1.0);
    out += plant(1480, 920, 0.9);
    out += `<g transform="translate(800 640)">
      <ellipse cx="0" cy="90" rx="200" ry="26" fill="${C.p900}" opacity="0.12"/>
      <rect x="-190" y="-10" width="380" height="200" rx="20" fill="#FFFFFF" filter="url(#s1)"/>
      <rect x="-170" y="10" width="340" height="150" rx="12" fill="${C.p100}"/>
      <g transform="translate(0 40)">
        <ellipse cx="0" cy="80" rx="80" ry="18" fill="${C.p700}" opacity="0.12"/>
        <path d="M -62 54 A 62 62 0 0 1 62 54 L 48 84 L -48 84 Z" fill="${C.p300}"/>
        <path d="M -62 54 A 62 62 0 0 1 62 54" fill="none" stroke="${C.p700}" stroke-width="6"/>
        <rect x="-30" y="18" width="60" height="26" rx="8" fill="${C.p700}"/>
        <path d="M -30 84 L 30 84" stroke="${C.p400}" stroke-width="4"/>
      </g>
    </g>`;
    out += cup(620, 640, 1);
    out += cup(980, 640, 1);
    out += person({ x: 480, y: 816, s: 1.1, skin: C.skin2, hair: C.hair2, shirt: C.p600, pose: 'stand' });
    out += person({ x: 1120, y: 816, s: 1.1, skin: C.skin3, hair: C.hair3, shirt: C.g800, pose: 'wave', flip: true });
    out += badgeCircle(800, 540, 34, C.green);
    out += check(800, 540, 17);
    out += sparkle(420, 520, 22, C.amber);
    out += sparkle(1200, 520, 22, C.amber);
    out += sparkle(1450, 760, 20, C.p400);
    return svg(W, H, out);
  },
};

function input(x, y, w, h, bar = C.g200) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#FFFFFF" stroke="${bar}" stroke-width="2"/><rect x="${x + 14}" y="${y + h / 2 - 4}" width="${w * 0.45}" height="9" rx="4.5" fill="${C.g300}"/>`;
}

function writeFile(name, content) {
  const p = path.join(OUT, name);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log('wrote', name, content.length, 'bytes');
}

const illustrations = [
  ['illustrations/signature-vintech-hero.svg', scenes['signature-vintech-hero']],
  ['illustrations/onboarding-create-account.svg', scenes['onboarding-create-account']],
  ['illustrations/onboarding-list-item.svg', scenes['onboarding-list-item']],
  ['illustrations/onboarding-receive-offers.svg', scenes['onboarding-receive-offers']],
  ['illustrations/empty-search-results.svg', scenes['empty-search-results']],
  ['illustrations/empty-favorites.svg', scenes['empty-favorites']],
  ['illustrations/empty-listings.svg', scenes['empty-listings']],
  ['illustrations/empty-offers.svg', scenes['empty-offers']],
  ['illustrations/error-404.svg', scenes['error-404']],
  ['illustrations/error-500.svg', scenes['error-500']],
  ['illustrations/error-offline.svg', scenes['error-offline']],
  ['illustrations/ai-before-after.svg', scenes['ai-before-after']],
  ['illustrations/trust-verified-seller.svg', scenes['trust-verified-seller']],
  ['illustrations/trust-safe-transactions.svg', scenes['trust-safe-transactions']],
  ['illustrations/trust-community-marketplace.svg', scenes['trust-community-marketplace']],
  ['photos/photo-modern-apartment.svg', scenes['photo-modern-apartment']],
  ['photos/photo-seller-taking-photos.svg', scenes['photo-seller-taking-photos']],
  ['photos/photo-buyer-meeting-seller.svg', scenes['photo-buyer-meeting-seller']],
];

illustrations.forEach(([name, fn]) => writeFile(name, fn()));
