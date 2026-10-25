// The dot field: one dot per player, grouped into a block per player type (whales first), drawn
// on a canvas so 10,000 players stay smooth. Colour and shape both carry the state, so it reads
// without colour vision: a filled gold dot, a hollow pink ring, or a small grey dot.
// Block labels are page text laid over the canvas, so they can carry (i) buttons.

import { TYPES, dotState } from '../engine.js';
import { int, sharesOf, revenueShares } from '../format.js';

const NAMES = { whale: 'Whales', dolphin: 'Dolphins', pass: 'Pass buyers', free: 'Free players' };
const LABEL_H = 24;
const BLOCK_GAP = 10;
// On one screen the dots shrink to fit, but never below this; past it the field scrolls inside its panel.
const MIN_FIT_PITCH = 3.5;
// The most dots worth drawing. Past this the picture stops being a field of players: at 100,000 every dot has to
// shrink to about a pixel to fit one screen, and the blocks turn to mush. So the field draws one player in
// `strideFor(N)` instead — the same stride for every type, so the proportions are exactly right — and says so.
// The maths behind every number on the page still uses all of them.
const MOST_DOTS = 12000;
export const strideFor = (n) => Math.max(1, Math.ceil(n / MOST_DOTS));
// Room around the dots, so the highlight ring on a dot at the edge isn't cut off. The ring reaches at most
// about 2.5px past its dot's square at any dot size.
const EDGE = 4;

export function createField(canvas, { colors, onPick, onHover, about, fitHeight }) {
  const ctx2d = canvas.getContext('2d');
  const wrap = canvas.parentElement;
  const labels = document.createElement('div');
  labels.className = 'field-labels';
  wrap.append(labels);
  let run = null;
  let groups = []; // the players of each type, in type order; empty types left out
  let day = null;
  let selected = -1;
  let hovered = -1;
  let layout = null;

  function blocksFor(cols, pitch) {
    const blocks = [];
    let y = 0;
    for (const { t, members, total } of groups) {
      const rows = Math.ceil(members.length / cols);
      blocks.push({ t, members, total, top: y, dotsTop: y + LABEL_H, rows });
      y += LABEL_H + rows * pitch + BLOCK_GAP;
    }
    return { blocks, height: Math.max(0, Math.ceil(y - BLOCK_GAP + EDGE)) };
  }

  // The biggest dots that fit the width and, when the page is one screen, the height left for them.
  function computeLayout() {
    const width = canvas.clientWidth || wrap.clientWidth || 600;
    const inner = width - 2 * EDGE;
    const N = run.ctx.N;
    const room = fitHeight?.();
    const target = room || Math.max(240, Math.min(520, width * 0.66));
    let pitch = Math.max(4, Math.min(22, Math.sqrt((inner * target) / N)));
    let cols = Math.max(10, Math.floor(inner / pitch));
    let fit = blocksFor(cols, pitch);
    while (room && pitch > MIN_FIT_PITCH && fit.height > room) {
      pitch *= 0.97;
      cols = Math.max(10, Math.floor(inner / pitch));
      fit = blocksFor(cols, pitch);
    }
    return { width, height: fit.height, pitch, cols, blocks: fit.blocks };
  }

  function placeLabels() {
    const { ctx, totals } = run;
    labels.innerHTML = '';
    // Shares of players to one decimal, rounded together so the blocks add up to 100%; the whale revenue share
    // is the one the money tiles show.
    // shares and counts come from the real totals, never from how many dots were drawn
    const shares = sharesOf(layout.blocks.map((b) => b.total ?? b.members.length), 1);
    const revenue = revenueShares(totals);
    layout.blocks.forEach((b, k) => {
      const name = TYPES[b.t];
      const count = b.total ?? b.members.length;
      const row = document.createElement('div');
      row.className = 'field-label';
      row.style.top = `${b.top}px`;
      row.style.left = row.style.right = `${EDGE}px`; // lined up with the dots
      const info = about?.(name);
      row.innerHTML = `<span class="fl-name">${NAMES[name]}</span>${info || ''}<span class="fl-count">${int(count)} of ${int(ctx.N)}<span class="fl-players"> players</span> · ${shares[k].toFixed(1)}%</span>${
        name === 'whale' && totals.revenueCents > 0 ? `<span class="fl-money">${revenue.text[b.t]} of revenue</span>` : ''
      }`;
      labels.append(row);
    });
  }

  function resize() {
    if (!run) return;
    layout = computeLayout();
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.style.height = `${layout.height}px`;
    canvas.width = Math.round(layout.width * dpr);
    canvas.height = Math.round(layout.height * dpr);
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    placeLabels();
    draw();
  }

  function draw() {
    if (!run || !layout) return;
    const { pitch, cols, blocks, width, height } = layout;
    const { out, ctx } = run;
    const endDay = day ?? ctx.s.days;
    ctx2d.clearRect(0, 0, width, height);
    const r = pitch * 0.38;
    const ring = Math.max(1, pitch * 0.12);
    const small = Math.max(1.2, pitch * 0.27);
    const marked = [];
    for (const b of blocks) {
      for (let k = 0; k < b.members.length; k++) {
        const i = b.members[k];
        const cx = EDGE + (k % cols) * pitch + pitch / 2;
        const cy = b.dotsTop + Math.floor(k / cols) * pitch + pitch / 2;
        const state = dotState(out, i, endDay);
        ctx2d.beginPath();
        if (state === 1) {
          ctx2d.fillStyle = colors.featured;
          ctx2d.arc(cx, cy, r, 0, Math.PI * 2);
          ctx2d.fill();
        } else if (state === 2) {
          ctx2d.strokeStyle = colors.lost;
          ctx2d.lineWidth = ring;
          ctx2d.arc(cx, cy, r - ring / 2, 0, Math.PI * 2);
          ctx2d.stroke();
        } else {
          ctx2d.fillStyle = colors.none;
          ctx2d.arc(cx, cy, small, 0, Math.PI * 2);
          ctx2d.fill();
        }
        if (i === selected || i === hovered) marked.push([i, cx, cy]);
      }
    }
    // Highlight rings go on last, so no neighbouring dot is drawn over them.
    for (const [i, cx, cy] of marked) {
      ctx2d.beginPath();
      ctx2d.strokeStyle = i === selected ? colors.ink : colors.muted;
      ctx2d.lineWidth = Math.max(1.5, pitch * 0.1);
      ctx2d.arc(cx, cy, r + Math.max(2, pitch * 0.18), 0, Math.PI * 2);
      ctx2d.stroke();
    }
  }

  function playerAt(x, y) {
    if (!layout) return -1;
    const { pitch, cols, blocks } = layout;
    for (const b of blocks) {
      if (y < b.dotsTop || y >= b.dotsTop + b.rows * pitch) continue;
      const col = Math.floor((x - EDGE) / pitch);
      const row = Math.floor((y - b.dotsTop) / pitch);
      if (col < 0 || col >= cols) return -1;
      const k = row * cols + col;
      return k < b.members.length ? b.members[k] : -1;
    }
    return -1;
  }

  function pointer(e) {
    const rect = canvas.getBoundingClientRect();
    return playerAt(e.clientX - rect.left, e.clientY - rect.top);
  }

  canvas.addEventListener('pointermove', (e) => {
    const i = pointer(e);
    if (i !== hovered) {
      hovered = i;
      draw();
    }
    onHover?.(i, e);
  });
  canvas.addEventListener('pointerleave', () => {
    hovered = -1;
    draw();
    onHover?.(-1, null);
  });
  canvas.addEventListener('click', (e) => {
    const i = pointer(e);
    if (i >= 0) onPick?.(i);
  });

  const ro = new ResizeObserver(() => resize());
  ro.observe(wrap);

  return {
    setRun(next) {
      run = next;
      const stride = strideFor(run.ctx.N);
      groups = TYPES.map((_, t) => ({ t, members: [], total: 0 }));
      for (let i = 0; i < run.ctx.N; i++) {
        const g = groups[run.ctx.typeOf[i]];
        // every stride-th player OF THIS TYPE, so each block is thinned by the same factor and the blocks keep
        // their proportions; a type too small to survive the stride still shows its first player
        if (g.total % stride === 0) g.members.push(i);
        g.total += 1;
      }
      groups = groups.filter((g) => g.total);
      resize();
    },
    setDay(d) {
      day = d;
      draw();
    },
    setSelected(i) {
      selected = i;
      draw();
    },
    resize,
    draw,
    // Draw the field into another canvas context (the post image) at a given box.
    paint(target, box, palette) {
      if (!run) return;
      const N = run.ctx.N;
      const sizes = TYPES.map((_, t) => run.ctx.typeOf.reduce((a, x) => a + (x === t ? 1 : 0), 0)).filter((n) => n > 0);
      // Largest dot pitch at which every block, its label and the gaps fit inside the box.
      const height = (p) => {
        const c = Math.floor(box.w / p);
        return sizes.reduce((a, n) => a + 24 + Math.ceil(n / c) * p + 12, -12);
      };
      let pitch = Math.max(3, Math.min(20, Math.sqrt((box.w * box.h * 0.82) / N)));
      while (pitch > 3 && height(pitch) > box.h) pitch *= 0.97;
      const cols = Math.floor(box.w / pitch);
      let y = box.y;
      target.textBaseline = 'alphabetic';
      for (let t = 0; t < TYPES.length; t++) {
        const members = [];
        for (let i = 0; i < N; i++) if (run.ctx.typeOf[i] === t) members.push(i);
        if (!members.length) continue;
        target.fillStyle = palette.ink;
        target.font = '650 15px "Bricolage Grotesque", system-ui, sans-serif';
        target.fillText(NAMES[TYPES[t]], box.x, y + 15);
        const tw = target.measureText(NAMES[TYPES[t]]).width;
        target.fillStyle = palette.muted;
        target.font = '400 14px "Bricolage Grotesque", system-ui, sans-serif';
        target.fillText(int(members.length), box.x + tw + 10, y + 15);
        y += 24;
        const rr = pitch * 0.38;
        for (let k = 0; k < members.length; k++) {
          const state = dotState(run.out, members[k], run.ctx.s.days);
          const cx = box.x + (k % cols) * pitch + pitch / 2;
          const cy = y + Math.floor(k / cols) * pitch + pitch / 2;
          target.beginPath();
          if (state === 1) {
            target.fillStyle = palette.featured;
            target.arc(cx, cy, rr, 0, Math.PI * 2);
            target.fill();
          } else if (state === 2) {
            target.strokeStyle = palette.lost;
            target.lineWidth = Math.max(1, pitch * 0.12);
            target.arc(cx, cy, rr - target.lineWidth / 2, 0, Math.PI * 2);
            target.stroke();
          } else {
            target.fillStyle = palette.none;
            target.arc(cx, cy, Math.max(1, pitch * 0.27), 0, Math.PI * 2);
            target.fill();
          }
        }
        y += Math.ceil(members.length / cols) * pitch + 12;
      }
    },
  };
}
