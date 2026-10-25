// Smart suggestions. Each lever is one change a designer controls. Every lever is tested on the
// same sample with the same dice as the current run, so the differences come from the change and
// not from luck, then the levers are ranked.

import { simulate, pairedSE, FREE, WHALE } from './engine.js';

// How much of each measured change could be luck. Both runs have the same players with the same
// dice, so compare each player with themselves.
function noise(base, after) {
  const { typeOf, N } = base.ctx;
  const free = [];
  const whale = [];
  const spend = [];
  for (let i = 0; i < N; i++) {
    spend.push(after.out.spendCents[i] - base.out.spendCents[i]);
    if (typeOf[i] === FREE) free.push((after.out.featured[i] > 0) - (base.out.featured[i] > 0));
    // each whale against their own goal (the same in both runs: same dice, same place among the whales)
    if (typeOf[i] === WHALE) whale.push((after.out.featured[i] >= after.out.goal[i]) - (base.out.featured[i] >= base.out.goal[i]));
  }
  const revenue = base.totals.revenueCents;
  return {
    freeSE: pairedSE(free),
    whaleSE: pairedSE(whale),
    revenueSE: revenue ? (pairedSE(spend) * N) / revenue : 0,
  };
}

const clone = (x) => structuredClone(x);
const round = (x, step) => Math.round(x / step) * step;
// Round a changed amount to a step that suits its size: tens for HoYoverse's 300 gems a day or 160 a pull,
// ones for Fire Emblem Heroes' 8 Orbs a day or 4 a summon.
const roundLike = (x, ref) => round(x, ref >= 100 ? 10 : 1);
// A rate as a percentage with three significant digits: 0.6%, 0.036% (Apex's 0.045% less a fifth).
const ratePct = (x) => `${parseFloat((x * 100).toPrecision(3))}%`;
const gems = (n, one) => `${n.toLocaleString('en-US')} ${n === 1 ? one : `${one}s`}`;

function withRules(s, patch) {
  const next = clone(s);
  Object.assign(next.rules, patch);
  next.preset = 'custom';
  return next;
}

// A spark that restarts after each featured copy is a guarantee (Fate/Grand Order's 330), so it's called one.
const sparkWord = (s) => (s.rules.spark?.resetOnFeatured ? 'Guarantee' : 'Spark');

// Whales and dolphins buy what they need on their first day, so gems that arrive later barely change what they pay:
// these levers mostly move free players.
const DAY_ONE = 'Whales and dolphins here buy what they need on day 1, so later daily gems barely change what they pay.';

// An all-zero pass means the game has none (engine.js prepare).
const hasPass = (s) => s.pass.price > 0 || s.pass.upfront > 0 || s.pass.daily > 0;

export const LEVERS = [
  {
    id: 'hard-later',
    title: (s) => `Hard pity at pull ${s.rules.hardPity + 10}`,
    apply: (s) => withRules(s, { hardPity: s.rules.hardPity + 10 }),
  },
  {
    id: 'hard-earlier',
    title: (s) => `Hard pity at pull ${s.rules.hardPity - 10}`,
    apply: (s) => (s.rules.hardPity - 10 > Math.min(s.rules.softPityStart, s.rules.hardPity - 1) ? withRules(s, { hardPity: s.rules.hardPity - 10 }) : null),
  },
  {
    id: 'soft-later',
    title: (s) => `Soft pity from pull ${s.rules.softPityStart + 4}`,
    apply: (s) => (s.rules.softPityStart + 4 < s.rules.hardPity ? withRules(s, { softPityStart: s.rules.softPityStart + 4 }) : null),
  },
  {
    id: 'soft-earlier',
    title: (s) => `Soft pity from pull ${s.rules.softPityStart - 4}`,
    apply: (s) => (s.rules.softPityStart - 4 >= 2 ? withRules(s, { softPityStart: s.rules.softPityStart - 4 }) : null),
  },
  {
    id: 'base-down',
    title: (s) => `Base legendary chance ${ratePct(s.rules.baseRate * 0.8)}`,
    apply: (s) => withRules(s, { baseRate: parseFloat((s.rules.baseRate * 0.8).toPrecision(3)) }),
  },
  {
    id: 'base-up',
    title: (s) => `Base legendary chance ${ratePct(s.rules.baseRate * 1.25)}`,
    apply: (s) => withRules(s, { baseRate: parseFloat((s.rules.baseRate * 1.25).toPrecision(3)) }),
  },
  {
    id: 'featured-up',
    title: (s) => `Featured chance ${Math.round(Math.min(1, s.rules.featuredChance + 0.05) * 100)}%`,
    apply: (s) => (s.rules.featuredChance < 1 ? withRules(s, { featuredChance: Math.min(1, round(s.rules.featuredChance + 0.05, 0.01)) }) : null),
  },
  {
    id: 'featured-down',
    title: (s) => `Featured chance ${Math.round(Math.max(0, s.rules.featuredChance - 0.05) * 100)}%`,
    apply: (s) => (s.rules.featuredChance > 0 ? withRules(s, { featuredChance: Math.max(0, round(s.rules.featuredChance - 0.05, 0.01)) }) : null),
  },
  {
    id: 'guarantee',
    title: (s) => (s.rules.guarantee ? 'Drop the guarantee after a lost 50/50' : 'Add a guarantee after a lost 50/50'),
    apply: (s) => withRules(s, { guarantee: !s.rules.guarantee }),
    // Taking a guarantee away breaks a promise players plan around; the model can't see that cost.
    removesProtection: (s) => s.rules.guarantee,
  },
  {
    id: 'spark-sooner',
    title: (s) => `${sparkWord(s)} at ${Math.max(50, (s.rules.spark?.pulls || 0) - 50)} pulls`,
    apply: (s) => ((s.rules.spark?.pulls || 0) > 50 ? withRules(s, { spark: { ...s.rules.spark, pulls: s.rules.spark.pulls - 50 } }) : null),
  },
  {
    id: 'spark-later',
    title: (s) => `${sparkWord(s)} at ${(s.rules.spark?.pulls || 0) + 50} pulls`,
    apply: (s) => ((s.rules.spark?.pulls || 0) > 0 ? withRules(s, { spark: { ...s.rules.spark, pulls: s.rules.spark.pulls + 50 } }) : null),
  },
  {
    id: 'daily-down',
    note: DAY_ONE,
    title: (s) => `${gems(fewerFree(s), 'free gem')} a day`,
    // a game with no free gems gets no free-gem suggestions: adding some is a new design, not a nudge
    apply: (s) => (s.freePerDay > 0 ? { ...clone(s), freePerDay: fewerFree(s) } : null),
  },
  {
    id: 'daily-up',
    note: DAY_ONE,
    title: (s) => `${gems(moreFree(s), 'free gem')} a day`,
    apply: (s) => (s.freePerDay > 0 ? { ...clone(s), freePerDay: moreFree(s) } : null),
  },
  {
    id: 'pass-richer',
    note: DAY_ONE,
    title: (s) => `Monthly pass gives ${gems(s.pass.daily + passExtra(s), 'gem')} a day`,
    apply: (s) => {
      if (!hasPass(s)) return null; // a game without a pass gets no pass suggestions
      const next = clone(s);
      next.pass.daily += passExtra(s);
      return next;
    },
  },
  {
    id: 'pass-price',
    note: 'Assumes the same players still buy the pass at the higher price.',
    title: (s) => `Monthly pass at $${(s.pass.price + 1).toFixed(2)}`,
    apply: (s) => {
      if (!hasPass(s)) return null;
      const next = clone(s);
      next.pass.price = Math.round((s.pass.price + 1) * 100) / 100;
      return next;
    },
  },
  {
    id: 'pull-dearer',
    note: 'Assumes players spend the same way when pulls cost more.',
    title: (s) => `${gems(dearerPull(s), 'gem')} a pull`,
    apply: (s) => ({ ...clone(s), pullCost: dearerPull(s) }),
  },
];

// The sizes of the changes, scaled to the game: 15% fewer or more free gems, a pull an eighth dearer (160 to
// 180), and the pass's extra gems a day worth about a fifth of a pull (30 at 160).
// Always a real change: at least one gem, where rounding would land back on the same number (3 a day).
function fewerFree(s) {
  return Math.max(0, Math.min(s.freePerDay - 1, roundLike(s.freePerDay * 0.85, s.freePerDay)));
}
function moreFree(s) {
  return Math.max(s.freePerDay + 1, roundLike(s.freePerDay * 1.15, s.freePerDay));
}
function dearerPull(s) {
  return Math.max(s.pullCost + 1, roundLike(s.pullCost * 1.125, s.pullCost));
}
function passExtra(s) {
  return Math.max(1, roundLike(s.pullCost * 0.1875, s.pullCost));
}

// What we measure for each version of the economy.
export function score(run) {
  const free = run.totals.byType[FREE];
  const whale = run.totals.byType[WHALE];
  return {
    revenueCents: run.totals.revenueCents,
    freeFeatured: free.players ? free.gotFeatured / free.players : 0,
    whaleGoal: whale.players ? whale.goalMet / whale.players : 0,
  };
}

// Run every lever. `step` lets the page spread the work over several frames.
export function* testLevers(settings, base) {
  const before = score(base);
  for (const lever of LEVERS) {
    const changed = lever.apply(settings);
    if (!changed) continue;
    const run = simulate(changed);
    const after = score(run);
    yield {
      ...noise(base, run),
      id: lever.id,
      title: lever.title(settings),
      note: lever.note || '',
      removesProtection: !!lever.removesProtection?.(settings),
      settings: changed,
      revenue: before.revenueCents ? after.revenueCents / before.revenueCents - 1 : 0,
      revenueCents: after.revenueCents,
      freeFeatured: after.freeFeatured - before.freeFeatured,
      freeFeaturedAfter: after.freeFeatured,
      whaleGoal: after.whaleGoal - before.whaleGoal,
    };
  }
}

// Ranking. "Earn more": the biggest revenue gains that cost free players at most `guard` of their
// chance at the featured unit and cost whales at most `whaleGuard` of their chance at reaching
// their goal (they bring in most of the money, so a change that strands them is not a gain).
// "Keep players": the biggest gains for free players per point of revenue given up.
// Changes that take away a player protection (the guarantee) are never suggested to earn more; they
// are listed separately with their numbers.
export function rank(results, { guard = 0.03, whaleGuard = 0.1 } = {}) {
  const passes = (r) => r.revenue > 0.005 && r.freeFeatured >= -guard - 1e-9 && r.whaleGoal >= -whaleGuard - 1e-9;
  const earn = results
    .filter((r) => passes(r) && !r.removesProtection)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);
  const leftOut = results.filter((r) => passes(r) && r.removesProtection);
  // A close call: about two standard errors of luck would put it on the other side of a line.
  const near = (value, line, se) => Math.abs(value - line) < 2 * (se || 0);
  for (const r of earn) r.closeCall = near(r.revenue, 0.005, r.revenueSE) || near(r.freeFeatured, -guard, r.freeSE) || near(r.whaleGoal, -whaleGuard, r.whaleSE);
  const keep = results
    .filter((r) => r.freeFeatured > 0.005 && !earn.includes(r))
    .map((r) => ({ ...r, value: r.freeFeatured / Math.max(0.005, -Math.min(0, r.revenue)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);
  return { earn, keep, leftOut, guard, whaleGuard };
}
