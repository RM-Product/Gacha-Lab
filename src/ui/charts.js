// Small SVG charts, drawn at the container's real width so text stays a fixed size.
// Marks carry colour; every label and value uses the text colours.

import { HOW } from '../engine.js';
import { usd, pct, int, sharesOf, revenueShares, shownParts } from '../format.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function niceStep(max, ticks = 4) {
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return step * mag;
}

// One stacked bar: revenue by paying player type, biggest spenders first, with a legend underneath
// that names each part and gives its dollars and share.
// How the season ended for everyone, as one bar: got the featured legendary, got one but lost the 50/50, got none.
// The counts alone made the three hard to weigh against each other (her call, 19 Oct 2026), so they are drawn in
// proportion, in the field's own colours, and each carries its share as well as its count. Shares are rounded
// together (sharesOf), so they add to 100 and agree with the labels on the field.
export function outcomeSplit(el, counts, total, colors) {
  const parts = [
    { name: 'Got the featured legendary', color: colors.featured, n: counts.featured },
    { name: 'Got a legendary, but lost the 50/50', color: colors.lost, n: counts.off },
    { name: 'No legendary', color: colors.none, n: counts.none },
  ];
  const shares = sharesOf(parts.map((p) => p.n), 1);
  parts.forEach((p, k) => (p.shareText = p.n ? `${shares[k]}%` : '0%'));
  if (!total) {
    el.innerHTML = '';
    return;
  }
  const w = Math.max(200, el.clientWidth || 600);
  const h = 16;
  const gap = 2;
  const shown = parts.filter((p) => p.n > 0);
  const avail = w - gap * (shown.length - 1);
  let x = 0;
  const rects = shown
    .map((p, k) => {
      const pw = Math.max(2, (p.n / total) * avail);
      const first = k === 0;
      const last = k === shown.length - 1;
      const rx = 4;
      const d = `M${x + (first ? rx : 0)},0 H${x + pw - (last ? rx : 0)} ${last ? `Q${x + pw},0 ${x + pw},${rx} V${h - rx} Q${x + pw},${h} ${x + pw - rx},${h}` : `V${h}`} H${x + (first ? rx : 0)} ${first ? `Q${x},${h} ${x},${h - rx} V${rx} Q${x},0 ${x + rx},0` : `V0`} Z`;
      const out = `<path d="${d}" fill="${p.color}" data-tip="${esc(`${p.name}: ${int(p.n)} of ${int(total)} players, ${p.shareText}`)}"></path>`;
      x += pw + gap;
      return out;
    })
    .join('');
  el.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="How the season ended, by player">${rects}</svg>`;
}

export function revenueSplit(el, totals, colors) {
  const shares = revenueShares(totals);
  const parts = [
    { key: 'whale', name: 'Whales', color: colors.ramp[2] },
    { key: 'dolphin', name: 'Dolphins', color: colors.ramp[1] },
    { key: 'pass', name: 'Pass buyers', color: colors.ramp[0] },
  ].map((p, t) => ({ ...p, cents: totals.byType[t].spendCents, players: totals.byType[t].players, share: shares.whole[t], shareText: shares.text[t] }));
  const total = totals.revenueCents;
  // dollars as the tiles show them, so a tooltip, a tile and the total under the bar never differ by a rounding
  const shown = shownParts(parts.map((p) => p.cents));
  const money = (cents, compact = false) => usd(cents, { compact, wholeDollars: shown.whole });
  if (!total) {
    el.innerHTML = '<p class="quiet">Nobody paid this season, so there is no revenue to split.</p>';
    return;
  }
  const w = Math.max(200, el.clientWidth || 600);
  const h = 16;
  let x = 0;
  const gap = 2;
  const paid = parts.filter((p) => p.cents > 0);
  const avail = w - gap * (paid.length - 1);
  const rects = paid
    .map((p, k) => {
      const pw = Math.max(2, (p.cents / total) * avail);
      const first = k === 0;
      const last = k === paid.length - 1;
      const rx = 4;
      // rounded outer ends only
      const d = `M${x + (first ? rx : 0)},0 H${x + pw - (last ? rx : 0)} ${last ? `Q${x + pw},0 ${x + pw},${rx} V${h - rx} Q${x + pw},${h} ${x + pw - rx},${h}` : `V${h}`} H${x + (first ? rx : 0)} ${first ? `Q${x},${h} ${x},${h - rx} V${rx} Q${x},0 ${x + rx},0` : `V0`} Z`;
      const out = `<path d="${d}" fill="${p.color}" data-tip="${esc(`${p.name}: ${money(shown.cents[parts.indexOf(p)])} · ${p.shareText} of revenue`)}"></path>`;
      x += pw + gap;
      return out;
    })
    .join('');
  // The key names each colour with its share (whale and dolphin dollars are in the tiles above); then everyone who
  // paid, added up in one green figure (her call, 7 Oct 2026; it was whales + dolphins only): the whole revenue, gem
  // packs and monthly passes alike. It adds the parts as shown, so it matches the Revenue tile. A type that paid
  // nothing has no part, no key entry and no place in the total's name.
  const players = totals.byType.reduce((a, t) => a + t.players, 0);
  const allCents = shown.cents.reduce((a, b) => a + b, 0);
  const everyone = paid.map((p, k) => (k ? p.name.toLowerCase() : p.name)).join(' + ');
  const legend =
    paid
      .map(
        (p) => `<li><span class="swatch" style="background:${p.color}"></span><span class="lg-name">${p.name}</span>
        <span class="lg-share">${p.shareText}</span></li>`,
      )
      .join('') +
    `<li class="lg-total">${everyone}: <b>${money(allCents, true)}</b> from ${pct(totals.payers / players, 1)} of players</li>`;
  el.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Revenue by player type">${rects}</svg>
    <ul class="split-legend">${legend}</ul>`;
}

// Where the 5★s landed: share of 5★s on each pull count, from the rules test (bars) against the
// exact maths (line). The soft-pity bump is the thing to look for.
export function pityChart(el, check, expected, rules, colors) {
  const W = Math.max(280, el.clientWidth || 640);
  const H = 230;
  const m = { l: 44, r: 12, t: 16, b: 34 };
  const pw = W - m.l - m.r;
  const ph = H - m.t - m.b;
  const hard = rules.hardPity;
  const measured = [];
  let maxV = 0;
  for (let n = 1; n <= hard; n++) {
    const v = check.landed[n] / check.fives;
    measured[n] = v;
    maxV = Math.max(maxV, v, expected[n]);
  }
  const step = niceStep(maxV * 1.1);
  const top = Math.ceil((maxV * 1.1) / step) * step || step;
  const y = (v) => m.t + ph - (v / top) * ph;
  const band = pw / hard;
  const bw = Math.max(1, band - 2);
  const xAt = (n) => m.l + (n - 1) * band;

  // enough decimals that every gridline's label is exact (2.5% steps need one)
  const whole = (x) => Math.abs(x - Math.round(x)) < 1e-9;
  const tickDecimals = whole(step * 100) ? 0 : whole(step * 1000) ? 1 : 2;
  let grid = '';
  for (let v = 0; v <= top + 1e-12; v += step) {
    grid += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" class="grid"></line>
      <text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end" class="tick">${(v * 100).toFixed(tickDecimals)}%</text>`;
  }
  const xticks = [1, ...Array.from({ length: Math.floor(hard / 10) }, (_, k) => (k + 1) * 10)].filter((n) => n <= hard);
  if (!xticks.includes(hard)) xticks.push(hard);
  const xt = xticks
    .map((n) => `<text x="${xAt(n) + band / 2}" y="${H - m.b + 16}" text-anchor="middle" class="tick">${n}</text>`)
    .join('');
  const bars = [];
  for (let n = 1; n <= hard; n++) {
    const v = measured[n];
    const top4 = Math.min(2, bw / 2);
    const yy = y(v);
    const hgt = m.t + ph - yy;
    if (hgt <= 0) {
      bars.push(`<rect x="${xAt(n)}" y="${m.t}" width="${band}" height="${ph}" fill="transparent" data-tip="${esc(`Pull ${n}: no legendaries here (exact maths: ${pct(expected[n], 2)})`)}"></rect>`);
      continue;
    }
    bars.push(
      `<path d="M${xAt(n) + 1},${m.t + ph} V${yy + top4} Q${xAt(n) + 1},${yy} ${xAt(n) + 1 + top4},${yy} H${xAt(n) + 1 + bw - top4} Q${xAt(n) + 1 + bw},${yy} ${xAt(n) + 1 + bw},${yy + top4} V${m.t + ph} Z" fill="${colors.featured}"></path>
       <rect x="${xAt(n)}" y="${m.t}" width="${band}" height="${ph}" fill="transparent" data-tip="${esc(`Pull ${n}: ${pct(v, 2)} of legendaries landed here (exact maths: ${pct(expected[n], 2)})`)}"></rect>`,
    );
  }
  let line = '';
  for (let n = 1; n <= hard; n++) line += `${n === 1 ? 'M' : 'L'}${(xAt(n) + band / 2).toFixed(1)},${y(expected[n]).toFixed(1)} `;
  const marker = (n, label) => {
    if (n < 1 || n > hard) return '';
    const xx = xAt(n);
    return `<line x1="${xx}" x2="${xx}" y1="${m.t}" y2="${m.t + ph}" class="mark"></line>
      <text x="${xx - 4}" y="${m.t + 12}" text-anchor="end" class="tick">${label}</text>`;
  };
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img"
      aria-label="Share of legendaries landing on each pull since the last legendary. The bars from this test follow the exact maths line.">
    ${grid}
    ${rules.softPityStart < rules.hardPity ? marker(rules.softPityStart, `soft pity ${rules.softPityStart}`) : ''}
    ${bars.join('')}
    <path d="${line}" fill="none" stroke="${colors.ink2}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>
    <line x1="${m.l}" x2="${W - m.r}" y1="${m.t + ph}" y2="${m.t + ph}" class="axis"></line>
    ${xt}
    <text x="${m.l + pw / 2}" y="${H - 2}" text-anchor="middle" class="tick">Pulls since the last legendary</text>
  </svg>
  <ul class="chart-legend">
    <li><span class="swatch" style="background:${colors.featured}"></span>This test</li>
    <li><span class="swatch line" style="background:${colors.ink2}"></span>Exact maths</li>
  </ul>`;
}

// One player's pity count across their pulls: it climbs one a pull and drops to zero at each 5★.
export function sawtooth(el, trace, rules, colors) {
  const pulls = trace.row.pulls;
  if (!pulls) {
    el.innerHTML = '<p class="quiet">This player never had enough gems for a pull.</p>';
    return;
  }
  const W = Math.max(240, el.clientWidth || 320);
  const H = 150;
  const m = { l: 30, r: 10, t: 10, b: 26 };
  const pw = W - m.l - m.r;
  const ph = H - m.t - m.b;
  const hard = rules.hardPity;
  const fives = trace.log.fives;
  // Banners without hard pity (999) scale to the longest run this player had, so the line isn't flattened.
  let longest = 0;
  let since = 0;
  for (const f of fives) {
    if (f.how === HOW.SPARK || f.how === HOW.FREE) continue;
    longest = Math.max(longest, f.pull - since);
    since = f.pull;
  }
  longest = Math.max(longest, pulls - since);
  const top = hard < 999 ? hard : Math.max(10, longest);
  const x = (p) => m.l + (p / pulls) * pw;
  const y = (v) => m.t + ph - (v / top) * ph;
  let d = `M${x(0)},${y(0)}`;
  let prev = 0;
  const at = []; // where each legendary sits on the line
  // a spark trade or a free copy isn't a pull result: pity carries on through it
  const notPulled = (f) => f.how === HOW.SPARK || f.how === HOW.FREE;
  for (const f of fives) {
    if (notPulled(f)) {
      at.push(f.pull - prev);
      continue;
    }
    d += ` L${x(f.pull)},${y(f.pity)} L${x(f.pull)},${y(0)}`;
    at.push(f.pity);
    prev = f.pull;
  }
  const tail = pulls - prev;
  if (tail > 0) d += ` L${x(pulls)},${y(tail)}`;
  const dots = fives
    .map((f, k) => {
      const lost = f.how === HOW.LOST;
      const spark = rules.spark?.resetOnFeatured ? `the guarantee at ${int(rules.spark.pulls)} pulls` : 'traded with the spark';
      const how = { [HOW.WON]: rules.featuredChance >= 1 ? 'the featured one' : 'won the 50/50', [HOW.LOST]: 'lost the 50/50', [HOW.GUARANTEED]: 'guaranteed', [HOW.RADIANCE]: 'Capturing Radiance', [HOW.SPARK]: spark, [HOW.FREE]: `free at ${int(f.pull)} pulls` }[f.how];
      const tip = esc(notPulled(f) ? `Legendary #${k + 1}: pull ${int(f.pull)}, day ${f.day}, ${how}` : `Legendary #${k + 1}: pull ${int(f.pull)}, day ${f.day}, at pity ${f.pity}, ${how}`);
      return lost
        ? `<circle cx="${x(f.pull)}" cy="${y(at[k])}" r="4.5" fill="${colors.panel}" stroke="${colors.lost}" stroke-width="2" data-tip="${tip}"></circle>`
        : `<circle cx="${x(f.pull)}" cy="${y(at[k])}" r="5" fill="${colors.featured}" stroke="${colors.panel}" stroke-width="2" data-tip="${tip}"></circle>`;
    })
    .join('');
  const hline = (v, label) =>
    v > 0 && v <= top
      ? `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" class="grid"></line><text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end" class="tick">${label}</text>`
      : '';
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pity count over this player's ${int(pulls)} pulls">
    ${hard < 999 ? hline(hard, hard) : hline(top, top)}${rules.softPityStart < hard ? hline(rules.softPityStart, rules.softPityStart) : ''}
    <line x1="${m.l}" x2="${W - m.r}" y1="${y(0)}" y2="${y(0)}" class="axis"></line>
    <text x="${m.l - 6}" y="${y(0) + 4}" text-anchor="end" class="tick">0</text>
    <path d="${d}" fill="none" stroke="${colors.ink2}" stroke-width="1.5" stroke-linejoin="round"></path>
    ${dots}
    <text x="${m.l}" y="${H - 6}" class="tick">pull 1</text>
    <text x="${W - m.r}" y="${H - 6}" text-anchor="end" class="tick">pull ${int(pulls)}</text>
  </svg>`;
}

