import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fiveStarChance,
  pityDistribution,
  pityMoments,
  featuredShareTheory,
  fiftyFiftyTheory,
  firstFeaturedPulls,
  testRules,
  chanceTable,
  freshBanner,
  pullOnce,
  simulate,
  prepare,
  tracePlayer,
  FIELDS,
  TYPES,
  FREE,
  PASS,
  HOW,
  dotState,
} from '../src/engine.js';
import { makeRng } from '../src/rng.js';
import { PRESETS, DEFAULT_SETTINGS } from '../src/presets.js';

// HoYoverse character event banner: 0.6% base, a 5★ guaranteed by pull 90, 50/50 with the
// guarantee after a loss, and the community soft-pity model (+6 points a pull from pull 74).
const RULES = {
  baseRate: 0.006,
  softPityStart: 74,
  softPityStep: 0.06,
  hardPity: 90,
  featuredChance: 0.5,
  guarantee: true,
  radiance: { on: false, chance: 0, sureAfter: 99 },
};

function settings(over = {}) {
  return {
    seed: 'test',
    sampleSize: 2000,
    days: 42,
    rules: RULES,
    pullCost: 160,
    freePerDay: 250,
    startGems: 0,
    loginRate: 0.7,
    packs: [
      { price: 0.99, gems: 60 },
      { price: 4.99, gems: 330 },
      { price: 14.99, gems: 1090 },
      { price: 29.99, gems: 2240 },
      { price: 49.99, gems: 3880 },
      { price: 99.99, gems: 8080 },
    ],
    pass: { price: 4.99, upfront: 300, daily: 90, days: 30 },
    types: {
      whale: { share: 0.01, pass: true, budget: 2000, goal: 7 },
      dolphin: { share: 0.04, pass: true, budget: 100, goal: 2 },
      pass: { share: 0.1, pass: true, budget: 0, goal: 1 },
      free: { pass: false, budget: 0, goal: 1 },
    },
    ...over,
  };
}

test('5★ chance follows the base rate, the soft-pity ramp and hard pity', () => {
  assert.equal(fiveStarChance(1, RULES), 0.006);
  assert.equal(fiveStarChance(73, RULES), 0.006);
  assert.ok(Math.abs(fiveStarChance(74, RULES) - 0.066) < 1e-12);
  assert.ok(Math.abs(fiveStarChance(80, RULES) - 0.426) < 1e-12);
  assert.ok(Math.abs(fiveStarChance(89, RULES) - 0.966) < 1e-12);
  assert.equal(fiveStarChance(90, RULES), 1);
});

test('the exact maths gives the published 1.6% consolidated rate', () => {
  const dist = pityDistribution(RULES);
  const total = dist.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - 1) < 1e-12);
  const { mean } = pityMoments(RULES);
  // HoYoverse publishes 1.600% "including guarantees"; the soft-pity model gives 1 / 62.297.
  assert.ok(mean > 62.2 && mean < 62.4, `mean pulls per 5★ ${mean}`);
  assert.equal((100 / mean).toFixed(1), '1.6');
});

test('featured share theory: 2/3 with the guarantee, q without', () => {
  assert.ok(Math.abs(featuredShareTheory(RULES) - 2 / 3) < 1e-9);
  assert.ok(Math.abs(featuredShareTheory({ ...RULES, featuredChance: 0.75 }) - 0.8) < 1e-9);
  assert.ok(Math.abs(featuredShareTheory({ ...RULES, guarantee: false }) - 0.5) < 1e-9);
  assert.ok(Math.abs(featuredShareTheory({ ...RULES, featuredChance: 0 }) - 0.5) < 1e-9);
});

test('the rules code matches the exact maths over 200,000 5★s', () => {
  const r = testRules(RULES, 200000, 'big');
  const { mean, sd } = pityMoments(RULES);
  const se = sd / Math.sqrt(r.fives);
  assert.ok(Math.abs(r.meanPity - mean) < 4 * se, `mean pity ${r.meanPity} vs ${mean} (se ${se})`);
  assert.ok(r.longest <= 90, 'never more than 90 pulls without a 5★');
  assert.ok(r.afterLossOk, 'a lost 50/50 is always followed by a guaranteed featured 5★');
  const share = 2 / 3;
  const seShare = Math.sqrt((share * (1 - share)) / r.fives);
  assert.ok(Math.abs(r.featuredShare - share) < 4 * seShare, `featured share ${r.featuredShare}`);
  const seWon = Math.sqrt(0.25 / r.attempts);
  assert.ok(Math.abs(r.wonShare - 0.5) < 4 * seWon, `50/50 wins ${r.wonShare}`);
  // Every landing bucket within 5 standard errors of the exact distribution.
  const dist = pityDistribution(RULES);
  for (let n = 1; n <= 90; n++) {
    const expected = dist[n] * r.fives;
    const tol = 5 * Math.sqrt(expected) + 2;
    assert.ok(Math.abs(r.landed[n] - expected) < tol, `pull ${n}: ${r.landed[n]} vs ${expected.toFixed(1)}`);
  }
});

test('hard pity forces the 5★ on its own, with no soft pity to help', () => {
  const flat = { ...RULES, softPityStart: 999, softPityStep: 0 };
  assert.equal(fiveStarChance(89, flat), 0.006);
  assert.equal(fiveStarChance(90, flat), 1);
  const r = testRules(flat, 50000, 'flat');
  assert.ok(r.longest <= 90);
  // With a flat 0.6% the 90th pull catches everyone who missed 89 times: 0.994^89 = 58.5%.
  const atHard = Math.pow(0.994, 89);
  const se = Math.sqrt((atHard * (1 - atHard)) / r.fives);
  assert.ok(Math.abs(r.hardPityShare - atHard) < 4 * se, `hard pity share ${r.hardPityShare}`);
  assert.ok(Math.abs(pityDistribution(flat)[90] - atHard) < 1e-12);
});

test('a 75/25 banner with the guarantee features 80% of its 5★s', () => {
  const r = testRules({ ...RULES, featuredChance: 0.75 }, 100000, 'weapon');
  const se = Math.sqrt((0.8 * 0.2) / r.fives);
  assert.ok(Math.abs(r.featuredShare - 0.8) < 4 * se, `${r.featuredShare}`);
});

test('without the guarantee two losses in a row happen', () => {
  const r = testRules({ ...RULES, guarantee: false }, 20000, 'noguar');
  assert.equal(r.count.GUARANTEED, 0);
  assert.equal(r.afterLossOk, true); // the check only applies when the guarantee is on
  assert.ok(Math.abs(r.featuredShare - 0.5) < 0.02);
});

test('Capturing Radiance code matches its exact maths', () => {
  const rules = { ...RULES, radiance: { on: true, chance: 0.1, sureAfter: 3 } };
  const r = testRules(rules, 200000, 'radiance');
  const theory = featuredShareTheory(rules);
  const se = Math.sqrt((theory * (1 - theory)) / r.fives);
  assert.ok(Math.abs(r.featuredShare - theory) < 4 * se, `${r.featuredShare} vs ${theory}`);
  assert.ok(r.count.RADIANCE > 0);
  assert.ok(theory > 2 / 3);
});

test('a run is the same every time for the same seed', () => {
  const a = simulate(settings());
  const b = simulate(settings());
  for (const name of Object.keys(FIELDS)) assert.deepEqual(a.out[name], b.out[name], name);
  const c = simulate(settings({ seed: 'other' }));
  assert.notDeepEqual(a.out.pulls, c.out.pulls);
});

test('player types come out in exact counts', () => {
  const run = simulate(settings());
  const counts = TYPES.map((_, t) => run.ctx.typeOf.filter((x) => x === t).length);
  assert.deepEqual(counts, [20, 80, 200, 1700]);
  assert.deepEqual(run.totals.byType.map((t) => t.players), [20, 80, 200, 1700]);
});

test('every player obeys the spending and goal rules, and gems add up', () => {
  const s = settings();
  const run = simulate(s);
  const { ctx, out } = run;
  let revenue = 0;
  for (let i = 0; i < ctx.N; i++) {
    const t = ctx.typeOf[i];
    const def = ctx.defs[t];
    const packCents = out.spendCents[i] - out.passCents[i];
    assert.ok(packCents <= out.budgetCents[i], `player ${i} spent past their budget`);
    assert.ok(out.budgetCents[i] >= Math.round(def.budgetCents * 0.5) && out.budgetCents[i] <= Math.round(def.budgetCents * 1.5), `player ${i} budget out of range`);
    if (t === FREE) {
      assert.equal(out.spendCents[i], 0);
      assert.equal(out.passGems[i], 0);
      assert.equal(out.boughtGems[i], 0);
    }
    if (t === PASS) assert.equal(out.spendCents[i], out.passes[i] * 499);
    // each player's own goal sits between 1 and their type's, and nobody pulls past it
    assert.ok(out.goal[i] >= 1 && out.goal[i] <= def.goal, `player ${i} goal ${out.goal[i]} outside 1..${def.goal}`);
    assert.ok(out.featured[i] <= out.goal[i], `player ${i} pulled past their goal`);
    assert.equal(out.fives[i], out.featured[i] - out.sparked[i] + out.offBanner[i]);
    const gemsIn = out.freeGems[i] + out.passGems[i] + out.boughtGems[i];
    assert.equal(gemsIn, out.pulls[i] * s.pullCost + out.gemsLeft[i], `player ${i} gems don't add up`);
    if (out.featured[i] >= out.goal[i]) assert.ok(out.goalDay[i] > 0);
    assert.ok(out.pityEnd[i] < s.rules.hardPity);
    revenue += out.spendCents[i];
  }
  assert.equal(run.totals.revenueCents, revenue);
});

test('a player who ends the season without reaching their goal could not afford another pull', () => {
  const s = settings();
  const run = simulate(s);
  const { ctx, out } = run;
  const cheapest = Math.min(...ctx.packs.map((p) => p.cents));
  for (let i = 0; i < ctx.N; i++) {
    if (out.featured[i] >= out.goal[i]) continue;
    const budgetLeft = out.budgetCents[i] - (out.spendCents[i] - out.passCents[i]);
    // Unfinished players either ran out of gems and budget, or never played after their last top-up.
    const trace = tracePlayer(i, ctx);
    const lastPlayed = [...trace.log.days].reverse().find((d) => d.played);
    if (!lastPlayed) continue;
    assert.ok(lastPlayed.gemsAtEnd < s.pullCost, `player ${i} stopped with gems to spare`);
    assert.ok(budgetLeft < cheapest, `player ${i} stopped with budget to spare`);
  }
});

test('the inspector trace reproduces the bulk row exactly', () => {
  const run = simulate(settings());
  for (const i of [0, 7, 99, 512, 1999]) {
    const trace = tracePlayer(i, run.ctx);
    for (const name of Object.keys(FIELDS)) {
      assert.equal(trace.row[name], run.out[name][i], `player ${i} ${name}`);
    }
    assert.equal(trace.log.fives.length, run.out.fives[i]);
    const pulled = trace.log.days.reduce((a, d) => a + d.pulls, 0);
    assert.equal(pulled, run.out.pulls[i]);
    // pity count in the log matches the rule: each 5★ landed at or before hard pity
    for (const f of trace.log.fives) assert.ok(f.pity >= 1 && f.pity <= 90);
    // a lost 50/50 is always followed by a guaranteed featured 5★
    for (let k = 1; k < trace.log.fives.length; k++) {
      if (trace.log.fives[k - 1].how === HOW.LOST) assert.equal(trace.log.fives[k].how, HOW.GUARANTEED);
    }
  }
});

test('free players play about as often as the log-in rate says', () => {
  const run = simulate(settings({ sampleSize: 5000 }));
  const { ctx, out } = run;
  let days = 0;
  let n = 0;
  for (let i = 0; i < ctx.N; i++) {
    if (ctx.typeOf[i] !== FREE) continue;
    days += out.daysPlayed[i];
    n += 1;
  }
  const rate = days / (n * 42);
  assert.ok(Math.abs(rate - 0.7) < 0.01, `log-in rate ${rate}`);
});

test('more generous rules give more players the featured unit', () => {
  const base = simulate(settings());
  const kinder = simulate(settings({ rules: { ...RULES, baseRate: 0.012 } }));
  const free = (r) => r.totals.byType[FREE].gotFeatured;
  assert.ok(free(kinder) > free(base));
});

test('dot state follows the first-5★ and first-featured days', () => {
  const run = simulate(settings());
  const { out } = run;
  for (let i = 0; i < 200; i++) {
    const end = dotState(out, i, 42);
    if (out.featured[i] > 0) assert.equal(end, 1);
    else if (out.fives[i] > 0) assert.equal(end, 2);
    else assert.equal(end, 0);
    assert.equal(dotState(out, i, 0), 0);
  }
});

test('the random stream is uniform enough', () => {
  const rng = makeRng('uniform');
  const bins = new Array(20).fill(0);
  const n = 400000;
  for (let i = 0; i < n; i++) bins[Math.floor(rng() * 20)] += 1;
  const expected = n / 20;
  const chi = bins.reduce((a, b) => a + ((b - expected) ** 2) / expected, 0);
  assert.ok(chi < 43.8, `chi-square ${chi} (19 df, p=0.001 cut-off 43.8)`);
});

test('prepare scales shares back when they add up to more than everyone', () => {
  const ctx = prepare(settings({ types: { ...settings().types, pass: { share: 1.2, pass: true, budget: 0, goal: 1 } } }));
  assert.equal(ctx.counts.reduce((a, b) => a + b, 0), 2000);
  assert.ok(ctx.counts[3] >= 0);
});

test('every HoYoverse preset reproduces its published rates', () => {
  for (const preset of PRESETS) {
    if (!preset.rules) continue;
    const { mean } = pityMoments(preset.rules);
    // The models land within 0.03 points of the published consolidated rate (Wuthering Waves: 0.06,
    // where tracked pulls disagree with Kuro's rounder 1.8%).
    if (preset.published.rate) {
      const tol = preset.published.rateTolerance || 0.0003;
      assert.ok(Math.abs(1 / mean - preset.published.rate) < tol, `${preset.id}: ${100 / mean}% vs ${preset.published.rate * 100}%`);
    }
    if (preset.published.featuredRate) {
      const perPull = featuredShareTheory(preset.rules) / mean;
      assert.ok(Math.abs(perPull - preset.published.featuredRate) < 0.00005, `${preset.id}: featured ${perPull * 100}% vs ${preset.published.featuredRate * 100}%`);
    }
    assert.equal(fiveStarChance(preset.rules.hardPity, preset.rules), 1);
  }
});

test('weapon-type banners follow their soft-pity ramps', () => {
  const by = (id) => PRESETS.find((p) => p.id === id).rules;
  const gw = by('genshin-weapon');
  assert.equal(fiveStarChance(62, gw), 0.007);
  assert.ok(Math.abs(fiveStarChance(63, gw) - 0.077) < 1e-12);
  assert.ok(Math.abs(fiveStarChance(76, gw) - 0.987) < 1e-12);
  assert.equal(fiveStarChance(77, gw), 1); // the model is certain at 77, before the official 80
  const lc = by('hsr-lightcone');
  assert.equal(fiveStarChance(65, lc), 0.008);
  assert.ok(Math.abs(fiveStarChance(66, lc) - 0.078) < 1e-12);
  assert.ok(Math.abs(fiveStarChance(79, lc) - 0.988) < 1e-12);
  const we = by('zzz-wengine');
  assert.equal(fiveStarChance(64, we), 0.01);
  assert.ok(Math.abs(fiveStarChance(65, we) - 0.07) < 1e-12);
  assert.ok(Math.abs(fiveStarChance(79, we) - 0.91) < 1e-12);
});

test('Capturing Radiance as disclosed gives a 54.5% 50/50, against the published 55%', () => {
  const rules = PRESETS.find((p) => p.id === 'genshin-character').rules;
  const w = fiftyFiftyTheory(rules);
  assert.ok(Math.abs(w - 0.54516) < 0.0005, `w ${w}`);
  assert.equal(fiftyFiftyTheory({ ...rules, radiance: { ...rules.radiance, on: false } }), 0.5);
  const r = testRules(rules, 200000, 'cr');
  // the plain 50/50 stays 50% with Radiance set aside, as HoYoverse states it
  const plain = r.count.WON + r.count.LOST;
  assert.ok(Math.abs(r.wonShare - 0.5) < 4 * Math.sqrt(0.25 / plain), `won ${r.wonShare}`);
  assert.ok(Math.abs(r.winWithRadiance - w) < 4 * Math.sqrt((w * (1 - w)) / r.attempts), `with radiance ${r.winWithRadiance}`);
  assert.ok(r.count.RADIANCE > 0);
  // never four lost 50/50s in a row: after three, the next 50/50 is certain
  const rng = makeRng('streak');
  const chance = chanceTable(rules);
  const st = freshBanner();
  let losses = 0;
  let worst = 0;
  let sure = 0;
  for (let k = 0; k < 2000000; k++) {
    const how = pullOnce(st, chance, rules, rng);
    if (!how || how === HOW.GUARANTEED) continue;
    if (how === HOW.LOST) {
      losses += 1;
      worst = Math.max(worst, losses);
    } else {
      if (how === HOW.RADIANCE && losses >= 3) sure += 1;
      losses = 0;
    }
  }
  assert.equal(worst, 3);
  assert.ok(sure > 0, 'the certain trigger after three losses happens');
});

test('the default player mix follows the cited numbers (docs/research/2026-10-06-spending.md)', () => {
  const t = DEFAULT_SETTINGS.types;
  const paying = t.whale.share + t.dolphin.share + t.pass.share;
  assert.ok(Math.abs(paying - 0.093) < 1e-9, 'about 9% of players pay (miHoYo filing: 10–14% of monthly players a month)');
  assert.ok(t.whale.share >= 0.0013 && t.whale.share <= 0.0023, 'whales sit in the studies\' 0.13% to 0.23%');
  assert.ok(t.dolphin.share >= 0.0086 && t.dolphin.share <= 0.0115, 'dolphins between GameAnalytics\' 0.86% and the filing\'s 1.13%');
  assert.equal(DEFAULT_SETTINGS.loginRate, 0.35, 'free players log in on 35% of days, so everyone averages about 40% (daily ÷ monthly players)');
  // with paying players logging in daily, the whole base averages about 0.40 (the brief's anchor)
  const all = simulate({ ...DEFAULT_SETTINGS, sampleSize: 10000 });
  const days = all.out.daysPlayed.reduce((a, b) => a + b, 0) / (all.ctx.N * all.ctx.s.days);
  assert.ok(Math.abs(days - 0.41) < 0.015, `everyone logs in on ${days} of days`);
  // Every money figure the research gives, checked at once (docs/research/2026-10-06-spending.md). The defaults are
  // fitted to all of them rather than to one: miss any and the calculator is quietly wrong about real money.
  // Averaged over eight sets of dice, because one season's luck moves these by a few per cent.
  const seeds = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'];
  const avg = (f) => seeds.reduce((acc, seed) => acc + f(simulate({ ...DEFAULT_SETTINGS, sampleSize: 10000, seed })), 0) / seeds.length;
  const band = (value, lo, hi, what) => assert.ok(value >= lo && value <= hi, `${what}: ${value} is outside ${lo}–${hi}`);

  band(avg((r) => r.totals.revenueCents / 100 / r.totals.payers), 35, 64, 'ARPPU a month (the filing: $35–64 in 2025 dollars)');
  band(avg((r) => r.totals.revenueCents / 100 / r.totals.players), 3, 15, 'ARPU a month (the filing: $3–15)');
  band(avg((r) => (100 * r.totals.payers) / r.totals.players), 4, 14, 'paying share (the filing: 4–14% of monthly actives)');
  band(avg((r) => r.totals.byType[0].spendCents / 100 / r.totals.byType[0].players), 600, 1100, 'whales each (the filing’s top 0.2%: about $750)');
  band(avg((r) => r.totals.byType[1].spendCents / 100 / r.totals.byType[1].players), 130, 200, 'dolphins each (the filing’s next 1.1%: about $166)');
  // The figure the published numbers are actually about: both sources say about the top tenth of payers brings
  // 80–87% (the filing 80.1% of the top 10.4%; GameAnalytics 86.6%, which is the same tenth read another way).
  band(avg((r) => 100 * r.totals.topTenthShare), 80, 87, 'the biggest tenth of payers');
  // and the type called whales, 0.2% of players, is only the top 2.2% of payers here, so it is NOT that figure
  const run = simulate({ ...DEFAULT_SETTINGS, sampleSize: 10000 });
  const whaleShare = run.totals.byType[0].spendCents / run.totals.revenueCents;
  assert.ok(whaleShare > 0.4 && whaleShare < 0.65, `whales bring in ${whaleShare} of revenue`);
  assert.ok(run.totals.byType[0].spendCents > run.totals.byType[1].spendCents, 'whales out-earn dolphins');
});

test('the Western games match their research brief (docs/research/2026-10-06-western.md)', () => {
  const by = (id) => PRESETS.find((p) => p.id === id);
  const mean = (id) => pityMoments(by(id).rules).mean;
  // League: 0.5% a draw, flat, certain by the 80th (Exalted) or 40th (Mythic Variant); Riot's effective rate 1.5%
  const ex = by('lol-exalted').rules;
  assert.equal(fiveStarChance(1, ex), 0.005);
  assert.equal(fiveStarChance(79, ex), 0.005);
  assert.equal(fiveStarChance(80, ex), 1);
  assert.ok(Math.abs(mean('lol-exalted') - 66.06) < 0.05);
  assert.ok(Math.abs(1 / mean('lol-exalted') - 0.015) < 0.0005, 'Riot: about 1.5% effective');
  assert.ok(Math.abs(mean('lol-mythic-variant') - 36.34) < 0.05);
  // Apex: 0.045% a pack, certain within 500
  assert.ok(Math.abs(mean('apex-heirloom') - 447.8) < 0.1);
  // Diablo Immortal: 4.5% a crest, certain on the 50th; half of 5★s are the featured gem
  assert.ok(Math.abs(mean('di-featured-gem') - 20.0) < 0.01);
  assert.equal(by('di-featured-gem').rules.featuredChance, 0.5);
  // League's store: 400 RP a draw, no free RP, no pass; duplicates don't matter
  for (const id of ['lol-exalted', 'lol-mythic-variant']) {
    const p = by(id);
    assert.equal(p.store.pullCost, 400);
    assert.equal(p.store.freePerDay, 0);
    assert.equal(p.store.pass.price + p.store.pass.upfront + p.store.pass.daily, 0);
    assert.equal(p.extraCopies, false);
  }
});

test('Epic Seven and Fire Emblem Heroes match their research brief (docs/research/2026-10-06-anime-b.md)', () => {
  const by = (id) => PRESETS.find((p) => p.id === id);
  const mean = (id) => pityMoments(by(id).rules).mean;
  // Epic Seven: 1% flat, the 121st summon certain: 70.36 summons a copy (1.421%)
  const e7 = by('e7-limited').rules;
  assert.equal(fiveStarChance(120, e7), 0.01);
  assert.equal(fiveStarChance(121, e7), 1);
  assert.ok(Math.abs(mean('e7-limited') - 70.36) < 0.01);
  // the Total Summon Count Reward: the hero free at 170 and 200 summons, once each; SSS imprint is 5 copies
  assert.deepEqual(e7.freeCopiesAt, [170, 200]);
  assert.equal(e7.spark.pulls, 0);
  assert.equal(by('e7-limited').maxCopies, 5);
  // Fire Emblem Heroes: 6%, +0.1 a summon from the 4th (the +0.5 every 5 spread out): 14.31 summons a 5★
  const feh = by('feh-new-heroes');
  assert.ok(Math.abs(fiveStarChance(3, feh.rules) - 0.06) < 1e-12);
  assert.ok(Math.abs(fiveStarChance(8, feh.rules) - 0.065) < 1e-12, 'pulls 6-10 average the official 6.5%');
  assert.ok(Math.abs(mean('feh-new-heroes') - 14.31) < 0.02);
  // the brief's merging variant: 14.5% for Focus Charge, duplicates merge (11 copies), and the free pick at 40 once
  assert.equal(feh.rules.featuredChance, 0.145);
  assert.deepEqual(feh.rules.freeCopiesAt, [40]);
  assert.equal(feh.rules.spark.pulls, 0);
  assert.equal(feh.extraCopies ?? true, true);
  assert.equal(feh.maxCopies, 11);
  assert.equal(feh.store.pullCost, 4);
  // the brief's exact first copy with the free pick is 34.18 summons; 14.5% with the pick lands within 3%
  const first = firstFeaturedPulls(feh.rules);
  assert.ok(Math.abs(first - 34.18) / 34.18 < 0.03, `first copy ${first}`);
});

test('Honkai Impact 3rd, Punishing: Gray Raven and Love and Deepspace match their brief (docs/research/2026-10-06-anime-a.md)', () => {
  const by = (id) => PRESETS.find((p) => p.id === id);
  const mean = (id) => pityMoments(by(id).rules).mean;
  // HI3: 0.71% flat, certain by 90: the published 1.50% overall
  assert.ok(Math.abs(mean('hi3-battlesuit') - 66.67) < 0.02);
  assert.ok(Math.abs(1 / mean('hi3-battlesuit') - 0.015) < 0.0002);
  // PGR: 0.5% flat, certain by 60: 1.925% against the published 1.90%
  assert.ok(Math.abs(mean('pgr-themed') - 51.95) < 0.02);
  assert.ok(Math.abs(1 / mean('pgr-themed') - 0.019) < 0.0003);
  // LADS: 1%, 11% at wish 61, 91% at 69, certain at 70; 2.117% against the published 2.1%
  const lads = by('lads-limited').rules;
  assert.ok(Math.abs(fiveStarChance(60, lads) - 0.01) < 1e-12);
  assert.ok(Math.abs(fiveStarChance(61, lads) - 0.11) < 1e-12);
  assert.ok(Math.abs(fiveStarChance(69, lads) - 0.91) < 1e-12);
  assert.equal(fiveStarChance(70, lads), 1);
  assert.ok(Math.abs(mean('lads-limited') - 47.24) < 0.02);
  assert.ok(Math.abs(1 / mean('lads-limited') - 0.021) < 0.0005);
  // each carries its own store
  assert.equal(by('hi3-battlesuit').store.pullCost, 280);
  assert.equal(by('pgr-themed').store.pullCost, 250);
  assert.equal(by('lads-limited').store.pullCost, 150);
});

test('the other games match the research brief', () => {
  const by = (id) => PRESETS.find((p) => p.id === id).rules;
  const ww = by('wuwa-character');
  assert.ok(Math.abs(fiveStarChance(66, ww) - 0.048) < 1e-12);
  assert.ok(Math.abs(fiveStarChance(70, ww) - 0.208) < 1e-12);
  assert.ok(Math.abs(fiveStarChance(71, ww) - 0.288) < 1e-12);
  assert.ok(Math.abs(fiveStarChance(76, ww) - 0.708) < 1e-12);
  assert.equal(fiveStarChance(79, ww), 1);
  // pulls per top-rarity unit (docs/RESEARCH-OTHER-GAMES.md, derived table)
  const mean = (id) => pityMoments(by(id)).mean;
  assert.ok(Math.abs(mean('wuwa-character') - 54.10) < 0.01);
  assert.ok(Math.abs(mean('arknights-limited') - 34.6) < 0.05);
  assert.ok(Math.abs(mean('r1999-limited') - 42.4) < 0.05);
  assert.ok(Math.abs(mean('r1999-limited') * 1.5 - 63.6) < 0.1);
  assert.ok(Math.abs(mean('bluearchive-pickup') - 33.33) < 0.05);
  assert.ok(Math.abs(mean('nikke-recruit') - 25) < 0.01);
  assert.ok(Math.abs(mean('fgo-pickup') - 100) < 0.01);
  // Arknights: 4% at pull 51, certain by 99, 35% for the operator you want, no guarantee
  const ak = by('arknights-limited');
  assert.equal(fiveStarChance(51, ak), 0.04);
  assert.ok(Math.abs(fiveStarChance(98, ak) - 0.98) < 1e-12);
  assert.equal(ak.guarantee, false);
  assert.equal(ak.spark.pulls, 300);
  // Fate/Grand Order: the 330 count restarts with each featured Servant
  assert.deepEqual(by('fgo-pickup').spark, { pulls: 330, resetOnFeatured: true });
});

test('pulls to the first featured copy, spark included, match the research brief', () => {
  const by = (id) => PRESETS.find((p) => p.id === id).rules;
  const close = (id, want, tol = 0.15) => {
    const got = firstFeaturedPulls(by(id));
    assert.ok(Math.abs(got - want) < tol, `${id}: ${got} vs ${want}`);
  };
  close('fgo-pickup', 116.2);
  close('bluearchive-pickup', 107.8);
  close('umamusume-scout', 103.8);
  close('nikke-recruit', 49.1);
  close('arknights-limited', 95.7);
  close('r1999-limited', 63.6);
  close('wuwa-character', 81.2);
  // a spark caps it: never more than N
  assert.ok(firstFeaturedPulls({ ...by('fgo-pickup'), spark: { pulls: 50, resetOnFeatured: true } }) < 50);
});
