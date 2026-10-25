// The Gacha Lab mark: a round potion vial with a cork, gem-cyan liquid, a pink 5★ star floating in it,
// bubbles, a shine on the glass and two sparkles. Drawn on a 32 × 32 grid. One list of shapes feeds
// the header (SVG), the post image (canvas) and the favicon.

const circle = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;

export const LOGO_SHAPES = [
  // liquid, and the light along its surface
  { d: 'M7.65 18.6 C9.6 17.4 11.4 19.6 13.6 18.6 S17.6 17.3 19.8 18.5 S23.2 19.4 24.35 18.6 A8.4 8.4 0 1 1 7.65 18.6 Z', fill: '#69d7ff' },
  { d: 'M7.65 18.6 C9.6 17.4 11.4 19.6 13.6 18.6 S17.6 17.3 19.8 18.5 S23.2 19.4 24.35 18.6', stroke: '#bdefff', width: 1 },
  // the star
  { d: 'M15.04 17.3 L16.83 19.93 L19.98 19.5 L18.04 22.01 L19.42 24.88 L16.43 23.81 L14.13 26 L14.22 22.82 L11.43 21.32 L14.48 20.43 Z', fill: '#ff6b9c', stroke: '#ff6b9c', width: 1.3 },
  // bubbles
  { d: circle(21.2, 23.6, 1.05), fill: '#f6f8fc' },
  { d: circle(10.9, 22.9, 0.75), fill: '#f6f8fc' },
  // the glass, and its shine
  { d: 'M13.5 6.2 V10.33 A9.5 9.5 0 1 0 18.5 10.33 V6.2', stroke: '#f6f8fc', width: 1.9 },
  { d: 'M9.4 15.9 A7.1 7.1 0 0 1 12.1 12.8', stroke: '#ffffff', width: 1.5, opacity: 0.75 },
  // cork
  { d: 'M14 2.4 H18 A1.8 1.8 0 0 1 19.8 4.2 V5.2 A1.8 1.8 0 0 1 18 7 H14 A1.8 1.8 0 0 1 12.2 5.2 V4.2 A1.8 1.8 0 0 1 14 2.4 Z', fill: '#c98f5a' },
  { d: 'M14.2 3.2 H14.4 A1 1 0 0 1 15.4 4.2 V5.2 A1 1 0 0 1 14.4 6.2 H14.2 A1 1 0 0 1 13.2 5.2 V4.2 A1 1 0 0 1 14.2 3.2 Z', fill: '#e3b384' },
  // sparkles
  { d: 'M26 3.4 L26.75 5.55 L28.9 6.3 L26.75 7.05 L26 9.2 L25.25 7.05 L23.1 6.3 L25.25 5.55 Z', fill: '#ff6b9c' },
  { d: 'M5.6 7.6 L6.05 8.95 L7.4 9.4 L6.05 9.85 L5.6 11.2 L5.15 9.85 L3.8 9.4 L5.15 8.95 Z', fill: '#69d7ff', opacity: 0.9 },
];

export function logoSvg(attrs = '') {
  const paths = LOGO_SHAPES.map((s) => {
    const stroke = s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round"` : '';
    const opacity = s.opacity ? ` opacity="${s.opacity}"` : '';
    return `<path d="${s.d}" fill="${s.fill || 'none'}"${stroke}${opacity}></path>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"${attrs ? ` ${attrs}` : ''}>${paths}</svg>`;
}

// Draw the mark onto a canvas at (x, y), `size` pixels square.
export function drawLogo(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 32, size / 32);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of LOGO_SHAPES) {
    const path = new Path2D(s.d);
    ctx.globalAlpha = s.opacity || 1;
    if (s.fill) {
      ctx.fillStyle = s.fill;
      ctx.fill(path);
    }
    if (s.stroke) {
      ctx.strokeStyle = s.stroke;
      ctx.lineWidth = s.width;
      ctx.stroke(path);
    }
  }
  ctx.restore();
}
