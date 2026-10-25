// The math check's rows: what a long pull test measured, what the exact maths says, what the publisher
// publishes (or where else the number comes from), and whether the test matches. Pure, so the tests can
// check the checker.

import { pityMoments, featuredShareTheory, fiftyFiftyTheory } from './engine.js';

// Is k hits out of n consistent with a chance p? Big counts: within four standard errors. Rare
// events (fewer than 10 expected either way): an exact Poisson tail, flagged below 1 in 10,000.
export function countFits(k, n, p) {
  if (n <= 0) return true;
  const mean = n * p;
  if (mean >= 10 && n * (1 - p) >= 10) return Math.abs(k - mean) <= 4 * Math.sqrt(n * p * (1 - p));
  const rareIsHit = p <= 0.5;
  const lambda = n * (rareIsHit ? p : 1 - p);
  const seen = rareIsHit ? k : n - k;
  return poissonTail(seen, lambda) >= 1e-4;
}

// Chance of a result at least as far from lambda as `k`, on k's side.
export function poissonTail(k, lambda) {
  let term = Math.exp(-lambda);
  let cdf = term;
  for (let i = 1; i <= k; i++) {
    term *= lambda / i;
    cdf += term;
  }
  return k >= lambda ? Math.max(0, 1 - cdf + term) : Math.min(1, cdf);
}

const pct = (x, d) => (Number.isFinite(x) ? `${(x * 100).toFixed(d)}%` : '–');
const trim = (x) => `${parseFloat((x * 100).toFixed(3))}%`;

export function tinyShare(x) {
  if (x === 0) return 'none';
  if (x >= 0.0001) return pct(x, 2);
  return `1 in ${Math.round(1 / x).toLocaleString('en-US')}`;
}

// `check` is a testRules() result for `rules`; `preset` is the matching game preset or null.
export function checkRows(rules, check, preset) {
  const c = check;
  const { mean, sd, dist } = pityMoments(rules);
  const share = featuredShareTheory(rules);
  const radiance = !!rules.radiance?.on;
  const pub = preset?.published || null;
  const official = (x) => `${trim(x)} official`;
  const okMean = Math.abs(c.meanPity - mean) <= (4 * sd) / Math.sqrt(c.fives) + 1e-12;
  const okShare = countFits(c.featured, c.fives, share);
  const hard = dist[rules.hardPity];
  const q = rules.featuredChance;
  const plain = c.count.WON + c.count.LOST;
  const w = fiftyFiftyTheory(rules);
  const rows = [
    { name: 'Legendary rate, pity included', measured: pct(c.rate, 3), expected: pct(1 / mean, 3), published: pub?.rate ? `${trim(pub.rate)} ${pub.rateLabel || 'official'}` : '–', ok: okMean },
    {
      name: 'Featured legendary per pull',
      measured: pct(c.featured / c.pulls, 3),
      expected: pct(share / mean, 3),
      published: pub?.featuredRate ? official(pub.featuredRate) : '–',
      ok: okMean && okShare,
    },
    { name: 'Average pulls per legendary', measured: c.meanPity.toFixed(2), expected: mean.toFixed(2), published: pub?.measured || '–', ok: okMean },
    {
      name: 'Longest wait for a legendary',
      // with no hard pity the model still ends a run at 999 (1 legendary in about 23,000 at Fate/Grand Order's 1%)
      measured: rules.hardPity >= 999 && c.longest >= 999 ? `999 pulls (the model's cap)` : `${c.longest} pulls`,
      expected: rules.hardPity >= 999 ? 'no limit' : `${rules.hardPity} at most`,
      published: pub?.hardPity ? `${pub.hardPity} ${pub.hardPityLabel || 'official'}` : '–',
      ok: c.longest <= rules.hardPity,
    },
    { name: 'Legendaries that were the featured one', measured: pct(c.featuredShare, 1), expected: pct(share, 1), published: '–', ok: okShare },
    {
      name: radiance ? '50/50s won, Radiance aside' : '50/50s won',
      measured: plain ? pct(c.wonShare, 1) : '–',
      expected: pct(q, 1),
      published: pub?.fiftyFifty || '–',
      ok: countFits(c.count.WON, plain, q),
    },
  ];
  if (radiance) {
    rows.push({
      name: '50/50s won with Capturing Radiance',
      measured: pct(c.winWithRadiance, 1),
      expected: pct(w, 1),
      published: pub?.withRadiance || '–',
      ok: countFits(c.count.WON + c.count.RADIANCE, c.attempts, w),
    });
  }
  rows.push(
    {
      name: 'Lost 50/50 followed by the featured legendary',
      measured: rules.guarantee ? (c.afterLossOk ? 'every time' : 'not always') : 'off',
      expected: rules.guarantee ? 'every time' : 'off',
      published: pub && pub.guarantee ? `guaranteed, ${pub.guaranteeLabel || 'official'}` : '–',
      ok: !rules.guarantee || c.afterLossOk,
    },
    // 999 is the model's cap for "no hard pity", not a real one
    rules.hardPity >= 999
      ? { name: 'Legendaries that needed hard pity', measured: '–', expected: 'no hard pity', published: '–', ok: true }
      : { name: 'Legendaries that needed hard pity', measured: tinyShare(c.hardPityShare), expected: tinyShare(hard), published: '–', ok: countFits(c.landed[rules.hardPity], c.fives, hard) },
  );
  return rows;
}
