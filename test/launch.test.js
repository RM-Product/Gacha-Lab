// Tests for the pre-launch fixes of 6 Oct 2026: free copies at fixed pull counts, the cap on useful copies,
// games with no monthly pass, the preset fields the page relies on, and the rounding the page shows.
import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate, tracePlayer, prepare, firstFeaturedPulls, firstSurePull, freeCopyPulls, goalFor, HOW, WHALE, DOLPHIN, PASS, FREE } from '../src/engine.js';
import { PRESETS, DEFAULT_SETTINGS, NO_PASS, presetSettings, presetById, rulesMatch, storeMatches } from '../src/presets.js';
import { LEVERS } from '../src/suggest.js';
import { sharesOf, revenueShares, pctSome, shownParts, usd } from '../src/format.js';
import { strideFor } from '../src/ui/field.js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// the sizes the page offers, kept here so the field test can check 100,000 is one of them
const SAMPLE_SIZES = [...readFileSync(resolve(root, 'src/ui/app.js'), 'utf8').match(/const SAMPLE_SIZES = \[([^\]]+)\]/)[1].matchAll(/\d+/g)].map((m) => Number(m[0]));

const base = (over = {}) => ({ ...structuredClone(DEFAULT_SETTINGS), sampleSize: 2000, ...over });

// Everyone a whale with deep pockets, so every player pulls as far as their goal needs.
function allWhales(s, goal) {
  s.types = {
    whale: { share: 1, pass: true, budget: 1000000, goal },
    dolphin: { share: 0, pass: true, budget: 0, goal: 1 },
    pass: { share: 0, pass: true, budget: 0, goal: 1 },
    free: { share: 0, pass: false, budget: 0, goal: 1 },
  };
  return s;
}

// Luck almost never pays, so the free copies do the work.
const stingy = { baseRate: 0.0005, softPityStart: 999, softPityStep: 0, hardPity: 999, featuredChance: 0.5, guarantee: true, radiance: { on: false, chance: 0, sureAfter: 3 } };

test('free copies arrive exactly at their pull counts, once each, and never start again', () => {
  const s = allWhales(base({ sampleSize: 300, rules: { ...stingy, freeCopiesAt: [100, 40] } }), 3);
  const run = simulate(s);
  const { ctx, out } = run;
  let reached = 0;
  for (let i = 0; i < ctx.N; i++) {
    const tr = tracePlayer(i, ctx);
    const free = tr.log.fives.filter((f) => f.how === HOW.FREE);
    assert.equal(free.length, out.freeCopies[i], `player ${i}`);
    // sorted, so 40 comes first; each at most once
    free.forEach((f, k) => assert.equal(f.pull, [40, 100][k], `player ${i} free copy ${k}`));
    assert.ok(out.freeCopies[i] <= 2);
    // copies from pulls, sparks and free copies add up
    assert.equal(out.fives[i], out.featured[i] - out.sparked[i] - out.freeCopies[i] + out.offBanner[i]);
    if (out.pulls[i] >= 100) reached += 1;
  }
  assert.ok(reached > 0, 'some players reached pull 100');
});

test('the free-copy count is every pull, whatever it gave, and a copy past the goal is not handed out', () => {
  // generous luck: most players have the featured legendary well before pull 40, and the count still runs on
  const s = allWhales(base({ sampleSize: 400, rules: { ...stingy, baseRate: 0.05, freeCopiesAt: [40] } }), 2);
  const run = simulate(s);
  const { ctx, out } = run;
  let freeAfterLuck = 0;
  for (let i = 0; i < ctx.N; i++) {
    const tr = tracePlayer(i, ctx);
    const free = tr.log.fives.find((f) => f.how === HOW.FREE);
    if (free) {
      assert.equal(free.pull, 40);
      if (tr.log.fives.some((f) => f.how !== HOW.FREE && f.how !== HOW.LOST && f.pull < 40)) freeAfterLuck += 1;
    }
    assert.ok(out.featured[i] <= 2, `player ${i} has ${out.featured[i]} copies`);
  }
  assert.ok(freeAfterLuck > 0, 'a player who already had a copy still got the free one at 40');
  // with a goal of one, nobody who got lucky first is handed a second copy
  const one = simulate(allWhales(base({ sampleSize: 400, rules: { ...stingy, baseRate: 0.05, freeCopiesAt: [40] } }), 1));
  for (let i = 0; i < one.ctx.N; i++) assert.ok(one.out.featured[i] <= 1);
});

test('a free copy caps the first featured copy: the exact maths and the players agree', () => {
  // flat 1%, every legendary featured, no pity: E[min(T, 40)] = (1 - 0.99^40) / 0.01
  const rules = { ...stingy, baseRate: 0.01, featuredChance: 1, guarantee: false, freeCopiesAt: [40] };
  const exact = (1 - 0.99 ** 40) / 0.01;
  assert.ok(Math.abs(firstFeaturedPulls(rules) - exact) < 1e-9, `${firstFeaturedPulls(rules)} vs ${exact}`);
  assert.equal(firstSurePull(rules), 40);
  const run = simulate(allWhales(base({ sampleSize: 4000, rules }), 1));
  let sum = 0;
  for (let i = 0; i < run.ctx.N; i++) sum += tracePlayer(i, run.ctx).log.fives.find((f) => f.how !== HOW.LOST).pull;
  const mean = sum / run.ctx.N;
  const sd = 13; // the spread of min(T, 40) at 1%, about 12.9
  assert.ok(Math.abs(mean - exact) < (4 * sd) / Math.sqrt(run.ctx.N), `players ${mean} vs ${exact}`);
});

test('Arknights: pull 300 brings the free operator and the exchange together', () => {
  const ak = presetById('arknights-limited');
  assert.deepEqual(ak.rules.freeCopiesAt, [300]);
  assert.equal(ak.rules.spark.pulls, 300);
  const s = allWhales(base({ sampleSize: 200, ...presetSettings('arknights-limited'), rules: { ...ak.rules, baseRate: 0.0005, softPityStart: 999, hardPity: 999 } }), 6);
  const run = simulate(s);
  let both = 0;
  for (let i = 0; i < run.ctx.N; i++) {
    const at300 = tracePlayer(i, run.ctx).log.fives.filter((f) => f.pull === 300 && (f.how === HOW.SPARK || f.how === HOW.FREE));
    if (at300.length === 2) both += 1;
  }
  assert.ok(both > 0, 'whales reaching 300 get two copies there');
});

test('a game with no monthly pass has no pass buyers: they play as free players', () => {
  const withPass = simulate(base());
  const without = simulate(base({ pass: structuredClone(NO_PASS) }));
  assert.equal(without.ctx.counts[PASS], 0);
  assert.equal(without.totals.byType[PASS].players, 0);
  assert.equal(without.ctx.counts[FREE], withPass.ctx.counts[FREE] + withPass.ctx.counts[PASS]);
  // whales and dolphins keep their places, so only the would-be pass buyers changed
  for (let i = 0; i < withPass.ctx.N; i++) {
    const t = withPass.ctx.typeOf[i];
    if (t === WHALE || t === DOLPHIN) assert.equal(without.ctx.typeOf[i], t, `player ${i}`);
    if (t === PASS) assert.equal(without.ctx.typeOf[i], FREE, `player ${i}`);
  }
  // League: nobody is a pass buyer
  const lol = simulate(base({ ...presetSettings('lol-exalted') }));
  assert.equal(lol.totals.byType[PASS].players, 0);
});

test('a big sample thins the field but never the numbers', () => {
  // 100,000 players would need dots about a pixel wide to fit one screen, and the blocks turn to mush. The field
  // draws one player in `strideFor(N)` instead; every count on the page still comes from all of them.
  assert.equal(strideFor(1000), 1, 'the sizes people normally use draw every player');
  assert.equal(strideFor(5000), 1);
  assert.equal(strideFor(10000), 1);
  assert.equal(strideFor(12000), 1, 'right up to the limit');
  assert.ok(strideFor(100000) > 1, 'and 100,000 is thinned');
  assert.equal(strideFor(100000), 9);
  assert.equal(strideFor(1000000), 84);
  // the same stride for every type, so the blocks keep their proportions
  const run = simulate(base({ sampleSize: 100000 }));
  const stride = strideFor(run.ctx.N);
  const drawn = [0, 0, 0, 0];
  const total = [0, 0, 0, 0];
  for (let i = 0; i < run.ctx.N; i++) {
    const t = run.ctx.typeOf[i];
    if (total[t] % stride === 0) drawn[t] += 1;
    total[t] += 1;
  }
  total.forEach((n, t) => {
    if (!n) return;
    assert.equal(drawn[t], Math.ceil(n / stride), `type ${t}`);
    assert.ok(Math.abs(drawn[t] / n - 1 / stride) < 0.01, `type ${t} is thinned by the same factor as the rest`);
  });
  // and the page says so rather than claiming each dot is a player
  const app = readFileSync(resolve(root, 'src/ui/app.js'), 'utf8');
  assert.match(app, /Each dot is <b>\$\{int\(stride\)\} players<\/b>/, 'the legend lead says how many players a dot is');
  assert.match(app, /classList\.toggle\('is-thinned', stride > 1\)/, 'and is marked so it reads at full size, not as small print');
  assert.match(readFileSync(resolve(root, 'src/ui/styles.css'), 'utf8'), /\.legend-lead\.is-thinned/, 'which the stylesheet carries');
  assert.ok(SAMPLE_SIZES.includes(100000), '100,000 is offered');
  assert.ok(SAMPLE_SIZES.includes(1000000), 'and a million');
  // a million blocks the page for about five seconds, so it has to say it is working before it starts
  assert.match(app, /const SLOW_SAMPLE = 100000;/, 'the slow threshold is named');
  assert.match(app, /classList\.toggle\('is-working', S\(\)\.sampleSize >= SLOW_SAMPLE\)/, 'set before the run');
  assert.match(app, /classList\.remove\('is-working'\)/, 'and cleared when it lands');
});

test('a game whose copies stop helping caps every goal there', () => {
  assert.equal(goalFor(7, null), 7);
  assert.equal(goalFor(7, 0), 7);
  assert.equal(goalFor(7, 5), 5);
  assert.equal(goalFor(2, 5), 2);
  assert.equal(goalFor(7, 11), 7);
  assert.equal(goalFor(0, 5), 1);
  // the cap is per thing, so chasing several multiplies what a season is worth (her point, 19 Oct 2026)
  assert.equal(goalFor(7, 5, 8), 40, 'five copies each of eight things');
  assert.equal(goalFor(7, null, 8), 56);
  assert.equal(goalFor(7, 5, 1), 5, 'one thing is the old behaviour');
  assert.equal(goalFor(7, 5, 0), 5, 'a missing or silly count means one thing');
  const caps = { 'fgo-pickup': 5, 'e7-limited': 5, 'lads-limited': 4, 'arknights-limited': 6, 'r1999-limited': 6, 'genshin-weapon': 5, 'hsr-lightcone': 5, 'zzz-wengine': 5, 'feh-new-heroes': 11 };
  for (const [id, cap] of Object.entries(caps)) {
    assert.equal(presetSettings(id).maxCopies, cap, id);
    const ctx = prepare(base({ ...presetSettings(id) }));
    const chases = DEFAULT_SETTINGS.types.whale.chases;
    assert.equal(ctx.defs[WHALE].goal, Math.min(7, cap) * chases, id);
    assert.equal(ctx.defs[DOLPHIN].goal, 1, id);
  }
  const fgo = simulate(allWhales(base({ sampleSize: 300, ...presetSettings('fgo-pickup') }), 7));
  for (let i = 0; i < fgo.ctx.N; i++) assert.ok(fgo.out.featured[i] <= 5, `player ${i} has ${fgo.out.featured[i]}`);
  assert.ok([...fgo.out.featured].some((n) => n === 5), 'deep-pocketed whales reach NP5');
  // Custom has no cap, and extra copies off still means one
  assert.equal(prepare(base()).defs[WHALE].goal, 7 * DEFAULT_SETTINGS.types.whale.chases);
  assert.equal(prepare(base({ types: { ...DEFAULT_SETTINGS.types, whale: { ...DEFAULT_SETTINGS.types.whale, chases: 1 } } })).defs[WHALE].goal, 7);
  assert.equal(prepare(base({ ...presetSettings('fgo-pickup'), extraCopies: false })).defs[WHALE].goal, 1);
});

test('the store note follows the store, and every preset says whose prices it uses', () => {
  for (const p of PRESETS) {
    const s = { ...base(), ...presetSettings(p.id) };
    assert.equal(s.storeFrom, p.id);
    assert.ok(storeMatches(s, p.id), p.id);
    assert.ok(p.storeNote && p.storeNote.length > 20, `${p.id} has a store note`);
    const edited = structuredClone(s);
    edited.packs[0].price += 1;
    assert.ok(!storeMatches(edited, p.id), `${p.id}: an edited store no longer matches`);
  }
  // Epic Seven still borrows HoYoverse's store and says so; the researched games carry their own, in their own units
  assert.match(presetById('e7-limited').storeNote, /stand in/);
  const own = { 'arknights-limited': 600, 'bluearchive-pickup': 120, 'umamusume-scout': 150, 'nikke-recruit': 300, 'r1999-limited': 180 };
  for (const [id, cost] of Object.entries(own)) {
    const s = presetSettings(id);
    assert.equal(s.pullCost, cost, id);
    assert.notDeepEqual(s.packs, presetSettings('custom').packs, `${id} has its own packs`);
    assert.doesNotMatch(presetById(id).storeNote, /stand in/, id);
    assert.match(presetById(id).storeNote, /estimate/, `${id} says its free income is an estimate`);
  }
  // the stores brief's numbers (docs/research/2026-10-06-stores.md)
  assert.deepEqual(presetSettings('arknights-limited').pass, { price: 4.99, upfront: 1080, daily: 200, days: 30 });
  assert.deepEqual(presetSettings('bluearchive-pickup').pass, { price: 6.99, upfront: 392, daily: 40, days: 30 });
  assert.deepEqual(presetSettings('nikke-recruit').packs.map((p) => [p.price, p.gems]), [[4.99, 320], [9.99, 720], [19.99, 1500], [29.99, 2300], [54.99, 4200], [79.99, 6200]]);
  assert.equal(presetSettings('r1999-limited').packs.at(-1).gems, 8380);
  // labels follow the sources: Diablo's 50th-crest pity and LADS's numbers are the wiki's
  assert.equal(presetById('di-featured-gem').published.hardPityLabel, 'wiki');
  assert.equal(presetById('lads-limited').published.hardPityLabel, 'wiki');
});

test('rules that differ only in their free copies are different rules', () => {
  const e7 = presetById('e7-limited').rules;
  assert.ok(rulesMatch(e7, structuredClone(e7)));
  assert.ok(!rulesMatch(e7, { ...e7, freeCopiesAt: [170] }));
  assert.ok(!rulesMatch(e7, { ...e7, freeCopiesAt: [] }));
  assert.deepEqual(freeCopyPulls({ freeCopiesAt: [200, 170.4, 0, -3] }), [170, 200]);
});

test('shares are rounded together so they add up to 100', () => {
  // the review's cases: a player's gems 7.19 / 2.40 / 90.41, Apex revenue 71.51 / 24.74 / 3.75
  assert.deepEqual(sharesOf([719, 240, 9041]), [7, 2, 91]);
  assert.deepEqual(sharesOf([7151, 2474, 375]), [71, 25, 4]);
  assert.deepEqual(sharesOf([2, 9, 20, 969], 1), [0.2, 0.9, 2, 96.9]);
  assert.deepEqual(sharesOf([0, 0]), [0, 0]);
  for (let k = 0; k < 200; k++) {
    const v = [Math.random() * 1000, Math.random() * 10, Math.random() * 100, Math.random()];
    assert.equal(sharesOf(v).reduce((a, b) => a + b, 0), 100);
    assert.ok(Math.abs(sharesOf(v, 1).reduce((a, b) => a + b, 0) - 100) < 1e-9);
  }
  const shares = revenueShares({ byType: [{ spendCents: 999000 }, { spendCents: 1000 }, { spendCents: 0 }] });
  assert.deepEqual(shares.text, ['100%', '<1%', '0%']);
});

test('a share that is not zero never reads 0%', () => {
  assert.equal(pctSome(1 / 969), '<1%');
  assert.equal(pctSome(0), '0%');
  assert.equal(pctSome(0.5), '50%');
  assert.equal(pctSome(0.0004, 1), '<0.1%');
});

test('the money figures add up: the shown parts make the shown total, which the green line under the bar repeats', () => {
  const show = (parts) => {
    const s = shownParts(parts);
    return { s, text: s.cents.map((c) => usd(c, { wholeDollars: s.whole })) };
  };
  // Fate/Grand Order: no pass buyers, so whales + dolphins are all of revenue. $2,319.60 and $1,246.80 round on
  // their own to $2,320 and $1,247 ($3,567) against revenue of $3,566; rounded together the bigger remainder
  // (the dolphins' .80) takes the dollar: $2,319 and $1,247.
  const fgo = show([231960, 124680, 0]);
  assert.deepEqual(fgo.text, ['$2,319', '$1,247', '$0']);
  assert.equal(usd(fgo.s.cents[0] + fgo.s.cents[1], { wholeDollars: true }), usd(231960 + 124680));
  // a part under $1,000 next to one over it: whole dollars both, so they still add up (the reviewers' $2,319.71 +
  // $984.63, and League's $399.96 + $1,236.85)
  const mixed = show([231971, 98463, 0]);
  assert.deepEqual(mixed.text, ['$2,320', '$984', '$0']);
  assert.equal(usd(mixed.s.cents[0] + mixed.s.cents[1], { wholeDollars: true }), usd(231971 + 98463));
  const lol = show([39996, 123685, 0]);
  assert.deepEqual(lol.text, ['$400', '$1,237', '$0']);
  // under $1,000 in all, every part keeps its cents
  assert.deepEqual(show([39996, 9000, 0]).text, ['$399.96', '$90.00', '$0.00']);
  // any split: each shown part within a dollar of the exact one, and the parts add up to the shown total
  for (let k = 0; k < 2000; k++) {
    const parts = [Math.round(Math.random() * 3e6), Math.round(Math.random() * 3e5), Math.round(Math.random() * 9e4)];
    const { cents, whole } = shownParts(parts);
    cents.forEach((v, i) => assert.ok(Math.abs(v - parts[i]) < 100, `${v} vs ${parts[i]}`));
    const total = parts[0] + parts[1] + parts[2];
    if (whole) assert.equal(cents[0] + cents[1] + cents[2], Math.round(total / 100) * 100);
    else assert.deepEqual(cents, parts);
    assert.equal(whole, total >= 100000);
  }
});

test('suggestions scale to the game: distinct free-gem changes, none for a game without free gems', () => {
  const lever = (id) => LEVERS.find((l) => l.id === id);
  const feh = { ...base(), ...presetSettings('feh-new-heroes') };
  const down = lever('daily-down').apply(feh);
  const up = lever('daily-up').apply(feh);
  // 15% either side of 8 Orbs a day, in whole Orbs: 7 and 9 (the old tens rounding made both 10)
  assert.equal(down.freePerDay, 7);
  assert.equal(up.freePerDay, 9);
  assert.ok(lever('pull-dearer').apply(feh).pullCost <= 5, 'a summon goes from 4 to 5 Orbs, not 24');
  assert.ok(lever('pass-richer').apply(feh).pass.daily <= 1);
  const lol = { ...base(), ...presetSettings('lol-exalted') };
  assert.equal(lever('daily-down').apply(lol), null);
  assert.equal(lever('daily-up').apply(lol), null);
  // the default store keeps its familiar steps
  const def = base();
  assert.equal(lever('daily-down').apply(def).freePerDay, 260);
  assert.equal(lever('daily-up').apply(def).freePerDay, 350);
  assert.equal(lever('pull-dearer').apply(def).pullCost, 180);
  assert.equal(lever('pass-richer').apply(def).pass.daily, 120);
});
