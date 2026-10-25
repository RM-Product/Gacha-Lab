// Tests for everything around the pull rules: days, passes, budgets, buying, money, suggestions and
// the math checker. Written after the independent review (17 of 25 code mutations went unnoticed).
import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate, summarize, allocate, freeGemCost, freeCostRepeats, tracePlayer, testRules, featuredShareTheory, fiftyFiftyTheory, loginMix, drawActivity, pickPack, HOW, FREE, WHALE, DOLPHIN, PASS, DAILY_SHARE } from '../src/engine.js';
import { PRESETS, DEFAULT_SETTINGS, GACHA_STORE, NO_PASS, presetSettings } from '../src/presets.js';
import { rank, score, testLevers } from '../src/suggest.js';
import { checkRows, countFits, poissonTail } from '../src/mathcheck.js';
import { usd, signedPct, signedPts } from '../src/format.js';
import { makeRng } from '../src/rng.js';

const base = (over = {}) => ({ ...structuredClone(DEFAULT_SETTINGS), sampleSize: 3000, ...over });

test('every day of every traced player adds up, pass and pack days included', () => {
  const run = simulate(base({ types: { ...DEFAULT_SETTINGS.types, whale: { ...DEFAULT_SETTINGS.types.whale, share: 0.02 }, dolphin: { ...DEFAULT_SETTINGS.types.dolphin, share: 0.05 }, pass: { ...DEFAULT_SETTINGS.types.pass, share: 0.1 } } }));
  const { ctx } = run;
  for (let i = 0; i < ctx.N; i += 7) {
    const tr = tracePlayer(i, ctx);
    for (const d of tr.log.days) {
      assert.equal(d.gemsAtStart + d.free + d.pass + d.bought - d.pulls * ctx.s.pullCost, d.gemsAtEnd, `player ${i} day ${d.day}`);
      if (!d.played) {
        assert.equal(d.free + d.pass, 0, `player ${i} earned on a day off`);
        assert.equal(d.pulls, 0, `player ${i} pulled on a day off`);
      }
    }
  }
});

test('the day log splits gems the way the player card does: free, pass and bought add up to the totals', () => {
  const run = simulate(base({ sampleSize: 600, types: { ...DEFAULT_SETTINGS.types, whale: { ...DEFAULT_SETTINGS.types.whale, share: 0.05 } } }));
  for (let i = 0; i < run.ctx.N; i += 3) {
    const tr = tracePlayer(i, run.ctx);
    const sum = (k) => tr.log.days.reduce((a, d) => a + d[k], 0);
    assert.equal(sum('free'), tr.row.freeGems, `player ${i} free`);
    assert.equal(sum('pass'), tr.row.passGems, `player ${i} pass`);
    assert.equal(sum('bought'), tr.row.boughtGems, `player ${i} bought`);
  }
});

// What a player's free gems should be, worked out from the days they played: the day's own part on each day played
// (about a fifth), and each week's share (the rest, for every day of the week) if they logged in at all that week.
function expectedFree(s, days) {
  const dayPart = Math.round(s.freePerDay * DAILY_SHARE);
  const weekPart = s.freePerDay - dayPart;
  let total = s.startGems;
  for (let start = 1; start <= s.days; start += 7) {
    const end = Math.min(start + 6, s.days);
    let played = 0;
    for (let d = start; d <= end; d++) if (days[d - 1].played) played += 1;
    total += dayPart * played;
    if (played) total += weekPart * (end - start + 1);
  }
  return total;
}

test("free gems: about a fifth on the day itself, the week's share at any log-in that week, lost without one", () => {
  const s = base();
  const run = simulate(s);
  const { ctx, out } = run;
  let partWeeks = 0;
  for (let i = 0; i < ctx.N; i += 3) {
    const tr = tracePlayer(i, ctx);
    assert.equal(out.freeGems[i], expectedFree(s, tr.log.days), `player ${i} free gems`);
    // and a free player who skipped days got less than a full season's worth
    if (ctx.typeOf[i] === FREE && out.daysPlayed[i] < s.days) {
      assert.ok(out.freeGems[i] < s.freePerDay * s.days);
      partWeeks += 1;
    }
  }
  assert.ok(partWeeks > 100, 'plenty of free players skip days');
  // someone who plays every day gets exactly the full amount
  const daily = simulate(base({ sampleSize: 500, loginRate: 1 }));
  for (let i = 0; i < daily.ctx.N; i++) assert.equal(daily.out.freeGems[i], s.freePerDay * s.days, `daily player ${i}`);
});

test('the pass gives exactly what it says, and paying players play every day', () => {
  const s = base();
  const run = simulate(s);
  const { ctx, out } = run;
  for (let i = 0; i < ctx.N; i++) {
    const t = ctx.typeOf[i];
    if (t === FREE) continue;
    // paying players play every day and keep the pass running: one for each 30 days started
    assert.equal(out.daysPlayed[i], s.days);
    const passes = Math.ceil(s.days / s.pass.days);
    assert.equal(out.passes[i], passes, `player ${i} passes`);
    assert.equal(out.passGems[i], passes * s.pass.upfront + s.days * s.pass.daily, `player ${i} pass gems`);
    assert.equal(out.passCents[i], passes * Math.round(s.pass.price * 100));
  }
});

test('log-in rate is the average even near 5% and 100%', () => {
  for (const rate of [0.05, 0.1, 0.5, 0.9, 1]) {
    const run = simulate(base({ sampleSize: 10000, loginRate: rate }));
    const { ctx, out } = run;
    let days = 0;
    let n = 0;
    for (let i = 0; i < ctx.N; i++) {
      if (ctx.typeOf[i] !== FREE) continue;
      days += out.daysPlayed[i];
      n += 1;
    }
    const measured = days / (n * ctx.s.days);
    assert.ok(Math.abs(measured - rate) < 0.006, `setting ${rate}, measured ${measured}`);
  }
});

test('budgets spread from half to one and a half times, averaging the setting', () => {
  const run = simulate(base({ sampleSize: 10000, types: { ...DEFAULT_SETTINGS.types, dolphin: { ...DEFAULT_SETTINGS.types.dolphin, share: 0.2 } } }));
  const { ctx, out } = run;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < ctx.N; i++) {
    if (ctx.typeOf[i] !== DOLPHIN) continue;
    const x = out.budgetCents[i] / ctx.defs[DOLPHIN].budgetCents;
    assert.ok(x >= 0.5 && x <= 1.5);
    sum += x;
    n += 1;
  }
  assert.ok(Math.abs(sum / n - 1) < 0.02, `mean ${sum / n}`);
});

test('payers buy the cheapest pack that covers what they still expect to need, or the biggest they can afford', () => {
  // On the default banner even one copy (about 93 pulls) needs more gems than the biggest pack holds, so payers buy
  // the biggest; on a kind banner with plenty of free gems the need is small and they buy a pack that just covers it.
  const types = { ...DEFAULT_SETTINGS.types, whale: { ...DEFAULT_SETTINGS.types.whale, share: 0.05 } };
  const kind = { ...DEFAULT_SETTINGS.rules, featuredChance: 1, softPityStart: 30, hardPity: 40 };
  let biggest = 0;
  let smaller = 0;
  for (const s of [base({ types }), base({ types, rules: kind, freePerDay: 600 })]) {
    const { ctx } = simulate(s);
    for (let i = 0; i < ctx.N; i++) {
      const t = ctx.typeOf[i];
      if (t !== WHALE && t !== DOLPHIN) continue;
      const tr = tracePlayer(i, ctx);
      let left = tr.row.budgetCents;
      for (const b of tr.log.buys) {
        if (b.kind !== 'pack') continue;
        const affordable = ctx.packs.filter((p) => p.cents <= left);
        const covering = affordable.filter((p) => p.gems >= b.need).sort((a, c) => a.cents - c.cents);
        const top = affordable.reduce((m, p) => (p.gems > m.gems || (p.gems === m.gems && p.cents < m.cents) ? p : m));
        const want = covering[0] || top;
        assert.equal(b.cents, want.cents, `player ${i} bought ${b.cents} needing ${b.need} gems with ${left} left`);
        assert.equal(pickPack(ctx.packs, left, b.need).cents, b.cents);
        if (b.gems < top.gems) smaller += 1;
        else biggest += 1;
        left -= b.cents;
      }
    }
  }
  assert.ok(biggest > 0 && smaller > 0, `${biggest} biggest, ${smaller} smaller packs`);
});

test('the pack choice: cheapest covering the need, else the best value for money, else none', () => {
  const packs = [
    { cents: 9999, gems: 8080 },
    { cents: 2999, gems: 2240 },
    { cents: 499, gems: 330 },
  ];
  assert.equal(pickPack(packs, 100000, 300).cents, 499);
  assert.equal(pickPack(packs, 100000, 2000).cents, 2999);
  assert.equal(pickPack(packs, 100000, 50000).cents, 9999, 'nothing covers it: the best value for money');
  assert.equal(pickPack(packs, 5000, 50000).cents, 2999, 'the best value the budget covers');
  assert.equal(pickPack(packs, 5000, 8000).cents, 2999, 'the covering pack is out of budget');
  assert.equal(pickPack(packs, 400, 100), null, 'nothing affordable');
  // at the same price a gem, the bigger pack, so one top-up does the work of two, whatever order the store is in
  assert.equal(pickPack([{ cents: 1000, gems: 800 }, { cents: 2000, gems: 1600 }], 5000, Infinity).gems, 1600);
  assert.equal(pickPack([{ cents: 2000, gems: 1600 }, { cents: 1000, gems: 800 }], 5000, Infinity).gems, 1600);
  assert.equal(pickPack([{ cents: 1000, gems: 800 }, { cents: 1000, gems: 1600 }], 5000, Infinity).gems, 1600);
  assert.equal(pickPack([{ cents: 5000, gems: 3000 }, { cents: 3000, gems: 4000 }], 10000, Infinity).cents, 3000);
  assert.equal(pickPack([{ cents: 3000, gems: 4000 }, { cents: 2000, gems: 4000 }], 10000, Infinity).cents, 2000);
});

test('a top-up buys the best value for money, not the most gems: the biggest pack can be the wrong buy', () => {
  // the bug of 18 Oct 2026: with no pack covering the need, the choice was the most gems whatever it cost, so a
  // store whose biggest pack was also its worst value still took nearly all the money
  const cheapRate = { cents: 5000, gems: 3880 }; // 1.29c a gem
  const dearBiggest = { cents: 50000, gems: 8080 }; // 6.19c a gem, but the most gems
  assert.equal(pickPack([cheapRate, dearBiggest], 1000000, Infinity).cents, 5000, 'the better rate, not the bigger pack');
  assert.equal(pickPack([dearBiggest, cheapRate], 1000000, Infinity).cents, 5000, 'and the store order never decides');
  // a pack another affordable one beats outright is never bought, under either rule
  assert.equal(pickPack([{ cents: 3000, gems: 2000 }, { cents: 3000, gems: 4000 }], 100000, 1500).gems, 4000, 'more gems for the same money');
  assert.equal(pickPack([{ cents: 4000, gems: 4000 }, { cents: 3000, gems: 4000 }], 100000, 3500).cents, 3000, 'the same gems for less money');
  // but gems past the need are wasted, so a pack that finishes the job still beats a better rate that overshoots
  const finishes = { cents: 1500, gems: 1090 };
  const betterRate = { cents: 9999, gems: 8080 };
  assert.equal(pickPack([finishes, betterRate], 1000000, 1000).cents, 1500, 'no reason to pay for gems they will not use');
  // the budget still rules: when the best rate is out of reach, the best rate they can afford
  assert.equal(pickPack([{ cents: 100, gems: 60 }, { cents: 5000, gems: 3880 }], 4999, Infinity).cents, 100);
});

test('raising the whole ladder always takes more, and buyers move to the next best rate', () => {
  // her report, 18 Oct 2026: raising a gem pack's price left revenue where it was, or moved it the wrong way.
  // The ladder as a whole is the monotone one. A single pack is not, and should not be: pricing out the pack that
  // sells moves buyers to the next rate down, which can take less, because a smaller pack strands fewer gems
  // (bought and never spent: 21% of what whales buy on the default store, 19% when the $49.99 pack takes over).
  const take = (patch) => {
    let cents = 0;
    for (const seed of ['p1', 'p2', 'p3']) {
      const s = base({ sampleSize: 10000, seed });
      patch(s);
      cents += simulate(s).totals.packRevenueCents;
    }
    return cents;
  };
  const at = take(() => {});
  let last = at;
  for (const m of [1.1, 1.25, 1.5, 2, 3]) {
    const up = take((s) => s.packs.forEach((p) => (p.price = Math.round(p.price * m * 100) / 100)));
    assert.ok(up > last, `the whole ladder ${m}x should take more than the step before (${up} vs ${last})`);
    last = up;
  }
  assert.ok(take((s) => s.packs.forEach((p) => (p.price = Math.round(p.price * 120) / 100))) > at * 1.05, 'a fifth dearer brings in more');

  // the pack that carries the money is the store's best value: price it out and buyers move to the next one down
  const share = (patch) => {
    const s = base({ sampleSize: 10000, seed: 'p1' });
    patch(s);
    const { totals } = simulate(s);
    const total = totals.packSales.reduce((acc, q) => acc + q.cents, 0);
    return totals.packSales.map((q) => (total ? q.cents / total : 0));
  };
  // Pacing spread the ladder: a player funds a day at a time, so the size they need varies and so does the pack
  // they buy. Before it, one pack took 91% of the money and the other five were all but dead.
  const before = share(() => {});
  const sold = before.filter((x) => x > 0.02).length;
  assert.ok(sold >= 3, `the store sells across the ladder, not through one pack (${before.map((x) => (x * 100).toFixed(0) + '%').join('/')})`);
  assert.ok(Math.max(...before) < 0.8, `and no single pack takes nearly all of it (${Math.max(...before)})`);
  // price one out and its buyers move on, without the store's takings falling
  const after = share((s) => (s.packs[5].price = 499.99)); // 6.19c a gem: now the worst value in the store
  assert.ok(after[5] < before[5] / 2, `priced out, it sells far less (${after[5]} against ${before[5]})`);
});

test('what the free gems cost is the revenue they take away, not what they would sell for', () => {
  // her report, 18 Oct 2026: the free-gems figure made no sense next to revenue, and differed between Honkai and
  // Genshin for no reason. It priced every free gem at the shop's rate, counting currency that mostly goes to
  // players who would never have bought any, and it never moved when the rules changed.
  const cost = (patch) => {
    const s = base({ sampleSize: 6000 });
    patch(s);
    return freeGemCost(s, simulate(s));
  };
  const at = cost(() => {});
  assert.ok(at.cents > 0, `free gems take revenue away (${at.cents})`);
  assert.ok(at.seCents > 0 && at.seCents < at.cents, `and the figure carries how much could be luck (${at.seCents})`);

  // it is a real counterfactual: the same season with nothing given away
  const s = base({ sampleSize: 6000 });
  const none = structuredClone(s);
  none.freePerDay = 0;
  none.startGems = 0;
  assert.equal(at.cents, simulate(none).totals.revenueCents - simulate(s).totals.revenueCents);

  // the page hands it the live settings, so it must not touch them: a mutation here would zero the free gems
  // the user set, on screen, for the rest of the session
  const guard = base({ sampleSize: 500 });
  const before = JSON.stringify(guard);
  freeGemCost(guard, simulate(guard));
  assert.equal(JSON.stringify(guard), before, 'the settings it was handed are untouched');

  // a bigger sample narrows the luck, as the (i) tells the reader it will
  const small = freeGemCost(base({ sampleSize: 2000 }), simulate(base({ sampleSize: 2000 })));
  const big = freeGemCost(base({ sampleSize: 20000 }), simulate(base({ sampleSize: 20000 })));
  assert.ok(big.seCents / big.cents < small.seCents / small.cents, 'ten times the players, a tighter figure');

  // a game that gives nothing away has no figure to show, with or without starting gems
  assert.equal(cost((x) => { x.freePerDay = 0; x.startGems = 0; }), null);
  assert.ok(cost((x) => { x.freePerDay = 0; x.startGems = 5000; }).cents > 0, 'starting gems alone still cost something');

  // and unlike the old figure it moves with the rules, the right way: on a kind banner free gems carry a player
  // most of the way, so they displace more spending; on a harsh one they barely dent what a whale must pay
  const share = (patch) => {
    const x = base({ sampleSize: 6000 });
    patch(x);
    const run = simulate(x);
    return freeGemCost(x, run).cents / run.totals.revenueCents;
  };
  const kind = share((x) => (x.rules.featuredChance = 1));
  const harsh = share((x) => (x.rules.featuredChance = 0.25));
  assert.ok(kind > harsh * 1.5, `a kind banner makes the giveaway cost more (${kind} against ${harsh})`);
  assert.ok(share((x) => (x.freePerDay = 600)) > share((x) => (x.freePerDay = 150)), 'giving more away costs more');

  // the old figure is still there for the (i), and is the one that does NOT move
  const a = simulate(base({ sampleSize: 6000 })).totals;
  const b = simulate(base({ sampleSize: 6000, rules: { ...structuredClone(DEFAULT_SETTINGS.rules), featuredChance: 1 } })).totals;
  assert.equal(a.freeGems, b.freeGems, 'gems handed out never depend on the banner');
  // the shop-rate figure is still wildly bigger than what the giveaway really costs, which is the whole point
  const real = freeGemCost(base({ sampleSize: 6000 }), simulate(base({ sampleSize: 6000 })));
  assert.ok(a.freeGemsValueCents > 50 * real.cents, `shop rate ${a.freeGemsValueCents} against a real cost of ${real.cents}`);
});

test('what free gems cost is steady across dice, not a figure that swings with luck', () => {
  // With about 13 payers in 1,000, two whales crossing a pack boundary move the answer by $200: one set of dice
  // put the cost anywhere from $5 to $360 on the default banner, and the tile would have had to say "too close to
  // tell" on 120 of 168 preset-seeds. Averaging over several sets is what makes it readable, so pin both the
  // number of sets and the steadiness it buys.
  assert.equal(freeCostRepeats(1000), 8, 'the default sample needs the most dice');
  assert.equal(freeCostRepeats(5000), 2);
  assert.equal(freeCostRepeats(10000), 1, 'a big sample is steady on its own');
  assert.ok(freeCostRepeats(500) >= freeCostRepeats(50000), 'fewer players, more dice');

  const costs = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'].map((seed) => {
    const s = base({ sampleSize: 1000, seed });
    const c = freeGemCost(s, simulate(s));
    assert.equal(c.dice, 8, `${seed}: says how many sets of dice it used`);
    // two standard errors of luck must not reach zero, or the page cannot show the figure at all
    assert.ok(Math.abs(c.cents) > 2 * c.seCents, `${seed}: $${c.cents / 100} stands clear of its noise (${c.seCents / 100})`);
    return c.cents;
  });
  const spread = Math.max(...costs) / Math.min(...costs);
  assert.ok(spread < 2, `the figure barely moves between dice (${spread.toFixed(2)}x)`);
});

test('payers pace their spending over the season instead of finishing on day 1', () => {
  // 19 Oct 2026. Before this every payer bought everything on day 1 — 100% of pack money before the
  // season's second day — so the gems a player is given each day could never stand in for a purchase. A flat
  // one-top-up-a-day rule fixed that but strangled anyone chasing a lot, so what a player funds in a day is now
  // their remaining need over the days left.
  const s = base({ sampleSize: 8000 });
  const { ctx, out } = simulate(s);
  let buys = 0, onDay1 = 0, spenders = 0, packs = 0;
  const days = new Set();
  for (let i = 0; i < ctx.N; i++) {
    if (ctx.typeOf[i] !== WHALE && ctx.typeOf[i] !== DOLPHIN) continue;
    spenders += 1;
    packs += out.packs[i];
    for (const b of tracePlayer(i, ctx).log.buys) {
      if (b.kind !== 'pack') continue;
      buys += 1;
      days.add(b.day);
      if (b.day === 1) onDay1 += 1;
    }
  }
  assert.ok(days.size > 5, `packs are bought on many days, not one (${days.size})`);
  assert.ok(onDay1 / buys < 0.6, `day 1 is no longer the whole season (${((onDay1 / buys) * 100).toFixed(0)}%)`);
  assert.ok(packs / spenders > 1, `and spenders still buy more than one pack each (${(packs / spenders).toFixed(2)})`);
  assert.equal(packs, buys, 'the per-player count and the logged buys agree');

  // the pace has to let a heavy spender through: the flat one-a-day rule it replaced capped a whale at one pack a
  // day, so someone chasing a lot bought on every day of the season and still fell short
  const heavy = base({ sampleSize: 4000 });
  heavy.types.whale = { ...heavy.types.whale, chases: 8, budget: 20000 };
  const hr = simulate(heavy);
  let most = 0;
  for (let i = 0; i < hr.ctx.N; i++) if (hr.ctx.typeOf[i] === WHALE) most = Math.max(most, hr.out.packs[i]);
  assert.ok(most > heavy.days, `a whale after a lot buys more packs (${most}) than there are days (${heavy.days})`);

  // the point of it: gems given out each day now stand in for a purchase, so those settings move revenue
  const rev = (patch) => {
    let cents = 0;
    for (const seed of ['b1', 'b2', 'b3']) {
      const x = base({ sampleSize: 8000, seed });
      patch(x);
      cents += simulate(x).totals.revenueCents;
    }
    return cents;
  };
  const at = rev(() => {});
  assert.ok(rev((x) => (x.pass.daily = 0)) > at, 'a pass that gives nothing a day brings in more');
  assert.ok(rev((x) => (x.freePerDay = 0)) > at, 'no free gems a day brings in more');
  assert.ok(rev((x) => (x.freePerDay = 600)) < at, 'twice the free gems brings in less');
});

test('how many packs each type bought is counted, and adds up to the players', () => {
  const s = base({ sampleSize: 4000 });
  const { ctx, out, totals } = simulate(s);
  const seen = [0, 0, 0, 0];
  for (let i = 0; i < ctx.N; i++) seen[ctx.typeOf[i]] += out.packs[i];
  totals.byType.forEach((t, k) => assert.equal(t.packs, seen[k], t.name));
  assert.equal(totals.byType[FREE].packs, 0, 'free players buy nothing');
  assert.equal(
    totals.byType.reduce((a, t) => a + t.packs, 0),
    totals.packSales.reduce((a, q) => a + q.count, 0),
    'the per-type counts and the per-pack sales agree',
  );
});

test('what each pack sold adds up to the pack revenue, and only a full run counts it', () => {
  const s = base({ sampleSize: 5000 });
  const { ctx, out, totals } = simulate(s);
  assert.equal(totals.packSales.length, s.packs.length, 'one row per pack in the store, in the page\u2019s order');
  const cents = totals.packSales.reduce((acc, p) => acc + p.cents, 0);
  const count = totals.packSales.reduce((acc, p) => acc + p.count, 0);
  assert.equal(cents, totals.packRevenueCents);
  assert.equal(cents, totals.revenueCents - totals.passRevenueCents);
  let packs = 0;
  for (let i = 0; i < ctx.N; i++) packs += out.packs[i];
  assert.equal(count, packs, 'every pack a player bought is counted once');
  totals.packSales.forEach((p, k) => {
    assert.equal(p.price, s.packs[k].price);
    assert.ok(p.count === 0 || p.cents === p.count * Math.round(p.price * 100), `pack ${k}: ${p.count} at ${p.price}`);
  });
  // a caller that builds its own rows (tracePlayer) gets an empty tally, never a wrong one
  const traced = summarize(ctx, allocate(ctx.N));
  assert.equal(traced.packSalesCounted, false);
  assert.ok(traced.packSales.every((p) => p.count === 0 && p.cents === 0));
  assert.equal(totals.packSalesCounted, true);
});

test('out of budget counts the spenders whose budget no longer covers the cheapest pack', () => {
  const s = base({ sampleSize: 5000 });
  const { ctx, out, totals } = simulate(s);
  const cheapest = Math.min(...ctx.packs.map((p) => p.cents));
  const seen = [0, 0, 0, 0];
  for (let i = 0; i < ctx.N; i++) {
    if (out.budgetCents[i] > 0 && out.budgetCents[i] - (out.spendCents[i] - out.passCents[i]) < cheapest) seen[ctx.typeOf[i]] += 1;
  }
  totals.byType.forEach((t, k) => assert.equal(t.outOfBudget, seen[k], t.name));
  assert.equal(totals.byType[PASS].outOfBudget, 0, 'pass buyers have no pack budget');
  assert.equal(totals.byType[FREE].outOfBudget, 0, 'free players have no pack budget');
  // At the defaults the budget is a ceiling nobody is pinned against; squeeze it and it starts to bite.
  const tight = base({ sampleSize: 5000 });
  tight.types.dolphin = { ...tight.types.dolphin, budget: 50 };
  assert.ok(simulate(tight).totals.byType[DOLPHIN].outOfBudget > 0, 'a budget below what a copy costs does bite');
  // dearer packs empty more wallets
  const dearer = base({ sampleSize: 5000 });
  dearer.packs.forEach((p) => (p.price = p.price * 3));
  const far = simulate(dearer).totals;
  assert.ok(far.byType[DOLPHIN].outOfBudget > totals.byType[DOLPHIN].outOfBudget, 'three times the price empties more wallets');
});

test('a payer\'s need: today\'s share of the copies left, less pity progress, less the gems in hand', () => {
  // one whale, one-pull packs, 100 gems in hand at every top-up, and a banner where a copy is exactly 15 pulls: a
  // legendary certain at pull 10, half of them featured, the guarantee after a loss (10 / (2/3))
  const rules = { baseRate: 0, softPityStart: 10, softPityStep: 0, hardPity: 10, featuredChance: 0.5, guarantee: true, radiance: { on: false, chance: 0, sureAfter: 3 } };
  for (const seed of ['n1', 'n2', 'n3']) {
    const s = base({ seed, sampleSize: 1, startGems: 100, freePerDay: 0, pullCost: 160, packs: [{ price: 1, gems: 160, bonus: 0 }], pass: NO_PASS, rules, types: { whale: { share: 1, pass: true, budget: 100000, goal: 6, chases: 1 }, dolphin: { share: 0, pass: true, budget: 0, goal: 1 }, pass: { share: 0, pass: true, budget: 0, goal: 1 }, free: { share: 0, pass: false, budget: 0, goal: 1 } } });
    const run = simulate(s);
    assert.ok(Math.abs(run.ctx.pullsPerCopy - 15) < 1e-9, `${run.ctx.pullsPerCopy} pulls a copy`);
    const tr = tracePlayer(0, run.ctx);
    const buys = tr.log.buys.filter((b) => b.kind === 'pack');
    assert.equal(buys.length, tr.row.pulls, 'one top-up before every pull');
    buys.forEach((b, k) => {
      // before pull k + 1: copies so far and pulls since the last legendary
      const before = tr.log.fives.filter((f) => f.pull <= k);
      const featured = before.filter((f) => f.how !== HOW.LOST).length;
      const pity = k - (before.length ? before[before.length - 1].pull : 0);
      // what is left, spread over the days left (the pace), then less the 100 gems in hand
      const pullsLeft = Math.max(1, Math.ceil((tr.row.goal - featured) * 15 - pity));
      const daysLeft = Math.max(1, s.days - b.day + 1);
      const todaysPulls = Math.max(1, Math.ceil(pullsLeft / daysLeft));
      const need = Math.max(160 - 100, todaysPulls * 160 - 100);
      assert.equal(b.need, need, `${seed}: top-up ${k + 1}`);
    });
  }
});

test('goals are spread exactly: 7 whales want 1 to 7 copies, one each; 2 whales split the range', () => {
  // one thing chased, so a goal is just the copies: the spread is what this checks
  const whales = (n, seed) => {
    const run = simulate(base({ seed, sampleSize: 1000, types: { ...DEFAULT_SETTINGS.types, whale: { ...DEFAULT_SETTINGS.types.whale, share: n / 1000, chases: 1 } } }));
    return [...run.out.goal].filter((_, i) => run.ctx.typeOf[i] === WHALE).sort((a, b) => a - b);
  };
  for (const seed of ['a', 'b', 'c']) {
    assert.deepEqual(whales(7, seed), [1, 2, 3, 4, 5, 6, 7], seed);
    const [low, high] = whales(2, seed);
    assert.ok(low >= 1 && low <= 4 && high >= 4 && high <= 7, `${seed}: ${low}, ${high}`);
  }
});

test('one-copy types make no goal draw: free players keep exactly the log-in dice they had', () => {
  for (const s of [base({ sampleSize: 3000 }), base({ sampleSize: 3000, ...presetSettings('lol-exalted') })]) {
    const run = simulate(s);
    const { ctx, out } = run;
    let checked = 0;
    for (let i = 0; i < ctx.N && checked < 300; i++) {
      if (ctx.typeOf[i] !== FREE) continue;
      const rng = makeRng(`${s.seed}#${i}`);
      const activity = drawActivity(ctx.loginMix, rng);
      assert.equal(out.activity[i], Math.fround(activity), `player ${i}`);
      assert.equal(tracePlayer(i, ctx).log.days[0].played, rng() < activity, `player ${i} day 1`);
      checked += 1;
    }
    assert.equal(checked, 300);
  }
});

test('suggestions judge whales by their own goals', () => {
  const settings = base({ sampleSize: 4000, types: { ...DEFAULT_SETTINGS.types, whale: { ...DEFAULT_SETTINGS.types.whale, share: 0.05 } } });
  const before = simulate(settings);
  const lever = [...testLevers(settings, before)].find((r) => r.id === 'guarantee');
  const after = simulate(lever.settings);
  const diffs = [];
  for (let i = 0; i < before.ctx.N; i++) {
    if (before.ctx.typeOf[i] === WHALE) diffs.push((after.out.featured[i] >= after.out.goal[i]) - (before.out.featured[i] >= before.out.goal[i]));
  }
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const se = Math.sqrt(diffs.reduce((a, b) => a + (b - mean) ** 2, 0) / (diffs.length - 1) / diffs.length);
  assert.ok(se > 0);
  assert.ok(Math.abs(lever.whaleSE - se) < 1e-12, `${lever.whaleSE} vs ${se}`);
});

test('each whale wants anywhere from 1 copy to the type\'s goal, evenly', () => {
  // one thing chased, so the range is 1 to 7 and the evenness is readable
  const run = simulate(base({ sampleSize: 20000, types: { ...DEFAULT_SETTINGS.types, whale: { ...DEFAULT_SETTINGS.types.whale, share: 0.5, chases: 1 } } }));
  const { ctx, out } = run;
  const seen = new Array(8).fill(0);
  let whales = 0;
  for (let i = 0; i < ctx.N; i++) {
    const t = ctx.typeOf[i];
    if (t === WHALE) {
      seen[out.goal[i]] += 1;
      whales += 1;
    } else assert.equal(out.goal[i], ctx.defs[t].goal, 'every other type here wants exactly its one copy');
  }
  for (let g = 1; g <= 7; g++) assert.ok(Math.abs(seen[g] / whales - 1 / 7) < 0.012, `goal ${g}: ${seen[g] / whales}`);
  // a game whose copies stop helping at 5 caps it, and with extra copies off everyone wants 1
  const capped = simulate(base({ sampleSize: 4000, maxCopies: 5, types: { ...DEFAULT_SETTINGS.types, whale: { ...DEFAULT_SETTINGS.types.whale, share: 0.5, chases: 1 } } }));
  assert.ok(Math.max(...capped.out.goal) === 5);
  // chasing several multiplies it: five copies each of three things
  const many = simulate(base({ sampleSize: 4000, maxCopies: 5, types: { ...DEFAULT_SETTINGS.types, whale: { ...DEFAULT_SETTINGS.types.whale, share: 0.5, chases: 3 } } }));
  assert.equal(Math.max(...many.out.goal), 15);
  const off = simulate(base({ sampleSize: 4000, extraCopies: false, types: { ...DEFAULT_SETTINGS.types, whale: { ...DEFAULT_SETTINGS.types.whale, share: 0.5 } } }));
  assert.ok(off.out.goal.every((g) => g === 1));
});

test('revenue follows the banner: harsher rules bring in more, kinder rules less', () => {
  // the bug of 7 Oct 2026: budgets nobody could fill made revenue ignore the rules entirely
  const revenue = (patch) => {
    let cents = 0;
    for (const seed of ['r1', 'r2', 'r3']) {
      const s = base({ sampleSize: 10000, seed });
      patch(s);
      cents += simulate(s).totals.revenueCents;
    }
    return cents;
  };
  const at = revenue(() => {});
  const harsher = [
    ['featured chance 25%', (s) => (s.rules.featuredChance = 0.25)],
    ['base chance halved', (s) => (s.rules.baseRate = 0.003)],
    ['no guarantee', (s) => (s.rules.guarantee = false)],
    ['pulls a quarter dearer', (s) => (s.pullCost = 200)],
    ['packs a fifth dearer', (s) => s.packs.forEach((p) => (p.price = Math.round(p.price * 120) / 100))],
  ];
  const kinder = [
    ['featured chance 100%', (s) => (s.rules.featuredChance = 1)],
    ['base chance doubled', (s) => (s.rules.baseRate = 0.012)],
    ['hard pity at 60', (s) => ((s.rules.hardPity = 60), (s.rules.softPityStart = 50))],
    ['pulls a quarter cheaper', (s) => (s.pullCost = 120)],
  ];
  for (const [label, patch] of harsher) assert.ok(revenue(patch) > at * 1.03, `${label} should bring in more`);
  for (const [label, patch] of kinder) assert.ok(revenue(patch) < at * 0.95, `${label} should bring in less`);
});

test('reaching the goal means each player\'s own goal, in the totals too', () => {
  const run = simulate(base({ sampleSize: 4000, types: { ...DEFAULT_SETTINGS.types, whale: { ...DEFAULT_SETTINGS.types.whale, share: 0.05 } } }));
  const { ctx, out, totals } = run;
  const met = [0, 0, 0, 0];
  for (let i = 0; i < ctx.N; i++) if (out.featured[i] >= out.goal[i]) met[ctx.typeOf[i]] += 1;
  assert.deepEqual(totals.byType.map((t) => t.goalMet), met);
  // whales with smaller goals count once they have them: far more than the seventh who want all 7
  const wantAll = [...out.goal].filter((g, i) => ctx.typeOf[i] === WHALE && g === 7).length;
  assert.ok(totals.byType[WHALE].goalMet > 2 * wantAll, `${totals.byType[WHALE].goalMet} at goal, ${wantAll} want 7`);
});

test('the goal day is the day the last wanted copy arrived', () => {
  const run = simulate(base({ types: { ...DEFAULT_SETTINGS.types, whale: { ...DEFAULT_SETTINGS.types.whale, share: 0.05 } } }));
  const { ctx } = run;
  for (let i = 0; i < ctx.N; i++) {
    if (ctx.typeOf[i] !== WHALE) continue;
    const tr = tracePlayer(i, ctx);
    const goal = tr.row.goal;
    const featured = tr.log.fives.filter((f) => f.how !== 2);
    if (featured.length >= goal) assert.equal(tr.row.goalDay, featured[goal - 1].day);
    else assert.equal(tr.row.goalDay, 0);
  }
});

test('with the guarantee off, nobody ends the season guaranteed', () => {
  const s = base();
  s.rules = { ...s.rules, guarantee: false };
  const run = simulate(s);
  assert.ok(run.out.guaranteedEnd.every((g) => g === 0));
});

test('money totals match the players, and free gems use the best store price', () => {
  const s = base({ sampleSize: 500 });
  const run = simulate(s);
  const { ctx, out, totals } = run;
  let revenue = 0;
  let pass = 0;
  let payers = 0;
  let free = 0;
  for (let i = 0; i < ctx.N; i++) {
    revenue += out.spendCents[i];
    pass += out.passCents[i];
    if (out.spendCents[i] > 0) payers += 1;
    free += out.freeGems[i];
  }
  assert.equal(totals.revenueCents, revenue);
  assert.equal(totals.passRevenueCents, pass);
  assert.equal(totals.packRevenueCents, revenue - pass);
  assert.equal(totals.payers, payers);
  assert.equal(totals.freeGems, free);
  // $99.99 for 8,080 gems is the cheapest gem in the store
  assert.ok(Math.abs(totals.centsPerGem - 9999 / 8080) < 1e-12);
  assert.ok(Math.abs(totals.freeGemsValueCents - free * (9999 / 8080)) < 1e-6);
  // with no priced pack there is no store value
  const none = simulate({ ...s, packs: s.packs.map((p) => ({ ...p, price: 0 })) });
  assert.equal(none.totals.freeGemsValueCents, null);
});

test('changing a pull rule moves nobody\'s log-in days (separate dice)', () => {
  const a = simulate(base());
  const b = simulate(base({ pullCost: 180 }));
  assert.deepEqual(a.out.daysPlayed, b.out.daysPlayed);
  const c = simulate(base({ rules: { ...DEFAULT_SETTINGS.rules, featuredChance: 0.6 } }));
  assert.deepEqual(a.out.daysPlayed, c.out.daysPlayed);
  // and the 5★ rolls don't move when only the 50/50 changes
  for (const i of [3, 50, 700]) {
    const ta = tracePlayer(i, a.ctx).log.fives.map((f) => f.pull);
    const tc = tracePlayer(i, c.ctx).log.fives.map((f) => f.pull);
    const n = Math.min(ta.length, tc.length, 1);
    assert.deepEqual(ta.slice(0, n), tc.slice(0, n));
  }
});

test('shares over 100% are scaled to fit, with no stray free players', () => {
  const s = base({ sampleSize: 1000 });
  s.types = { ...s.types, whale: { ...s.types.whale, share: 0.5 }, dolphin: { ...s.types.dolphin, share: 0.5 }, pass: { ...s.types.pass, share: 0.2 } };
  const run = simulate(s);
  assert.equal(run.ctx.overfull, true);
  assert.equal(run.ctx.counts[FREE], 0);
  assert.equal(run.ctx.counts.reduce((x, y) => x + y, 0), 1000);
});

test('suggestion ranking keeps both guardrails, including exactly at the line', () => {
  const r = (id, revenue, freeFeatured, whaleGoal) => ({ id, revenue, freeFeatured, whaleGoal, revenueCents: 0, freeFeaturedAfter: 0 });
  const results = [
    r('ok', 0.05, -0.03, -0.1), // exactly on both lines: allowed
    r('free-too-far', 0.2, -0.031, 0),
    r('whale-too-far', 0.2, 0, 0.7 - 0.8 - 0.001),
    r('float-line', 0.03, 0, 0.7 - 0.8), // -0.10000000000000009 must still count as -0.1
    r('tiny', 0.004, 0, 0),
    r('kind', -0.01, 0.05, 0),
    r('win-win', 0.01, 0.01, 0),
  ];
  const ranked = rank(results);
  assert.deepEqual(ranked.earn.map((x) => x.id), ['ok', 'float-line', 'win-win']);
  assert.ok(ranked.keep.map((x) => x.id).includes('kind'));
  assert.ok(!ranked.keep.some((x) => ranked.earn.includes(x)));
});

test('score reads revenue, free players and whales from a run', () => {
  const run = simulate(base({ sampleSize: 2000 }));
  const sc = score(run);
  const free = run.totals.byType[FREE];
  assert.equal(sc.revenueCents, run.totals.revenueCents);
  assert.equal(sc.freeFeatured, free.gotFeatured / free.players);
  assert.equal(sc.whaleGoal, run.totals.byType[WHALE].goalMet / run.totals.byType[WHALE].players);
});

test('the math checker passes good rules and catches a mismatch', () => {
  for (const preset of PRESETS.filter((p) => p.rules)) {
    const check = testRules(preset.rules, 40000, 'checker');
    const rows = checkRows(preset.rules, check, preset);
    for (const row of rows) assert.ok(row.ok, `${preset.id}: ${row.name} ${row.measured} vs ${row.expected}`);
  }
  // results from one rule set checked against another must fail somewhere
  const genshin = PRESETS[0];
  const wrong = testRules({ ...genshin.rules, baseRate: 0.009 }, 40000, 'checker');
  assert.ok(checkRows(genshin.rules, wrong, genshin).some((row) => !row.ok));
  const noGuarantee = testRules({ ...genshin.rules, guarantee: false }, 40000, 'checker');
  assert.ok(checkRows(genshin.rules, noGuarantee, genshin).some((row) => !row.ok));
});

test('rare-event checks use an exact tail', () => {
  assert.ok(Math.abs(poissonTail(0, 2) - Math.exp(-2)) < 1e-12);
  assert.ok(countFits(1, 40000, 0.014 / 40000)); // one hit against 0.014 expected: rare but possible
  assert.ok(!countFits(5, 40000, 0.014 / 40000)); // five is not
  assert.ok(countFits(0, 40000, 0)); // impossible and never seen
  assert.ok(!countFits(1, 40000, 0)); // impossible but seen
  assert.ok(countFits(20000, 40000, 0.5));
  assert.ok(!countFits(21000, 40000, 0.5));
});

test('dollars keep their cents under $1,000', () => {
  assert.equal(usd(12345), '$123.45');
  assert.equal(usd(499), '$4.99');
  assert.equal(usd(123456), '$1,235');
  assert.equal(usd(19252500, { compact: true }), '$192.5K');
});

test('every player type appears in exact numbers at every sample size', () => {
  for (const N of [1000, 5000, 10000]) {
    const run = simulate(base({ sampleSize: N }));
    const want = [Math.round(N * 0.002), Math.round(N * 0.011), Math.round(N * 0.08)];
    assert.deepEqual(run.ctx.counts.slice(0, 3), want);
    assert.equal(run.ctx.counts[FREE], N - want.reduce((a, b) => a + b, 0));
  }
});

test('with extra copies off, every player stops at their first featured copy', () => {
  const on = simulate(base());
  const off = simulate(base({ extraCopies: false }));
  // off means one copy full stop, whatever anyone chases
  for (const d of off.ctx.defs) assert.equal(d.goal, 1);
  for (let i = 0; i < off.ctx.N; i++) assert.ok(off.out.featured[i] <= 1, `player ${i} has ${off.out.featured[i]} copies`);
  // with it on, whales chase 7 copies: some players hold more than one, and whales spend more
  assert.ok([...on.out.featured].some((n) => n > 1), 'someone holds a second copy when extra copies are on');
  assert.ok(off.totals.byType[WHALE].spendCents < on.totals.byType[WHALE].spendCents, 'whales spend less when one copy is enough');
  // settings saved before the switch existed have no extraCopies at all, and keep the goals they had
  const saved = base();
  delete saved.extraCopies;
  assert.equal(simulate(saved).ctx.defs[WHALE].goal, DEFAULT_SETTINGS.types.whale.goal * DEFAULT_SETTINGS.types.whale.chases);
  // and one with no `chases` either, from before a season could hold more than one thing, means one thing
  const older = base();
  delete older.types.whale.chases;
  assert.equal(simulate(older).ctx.defs[WHALE].goal, DEFAULT_SETTINGS.types.whale.goal);
});

test('a game with no monthly pass: nobody buys one and pass buyers spend nothing', () => {
  const run = simulate(base({ pass: structuredClone(NO_PASS) }));
  for (let i = 0; i < run.ctx.N; i++) assert.equal(run.out.passes[i], 0, `player ${i} bought a pass`);
  assert.equal(run.totals.passRevenueCents, 0);
  assert.equal(run.totals.byType[PASS].spendCents, 0);
  // and the same settings with the usual pass do sell it
  assert.ok(simulate(base()).totals.passRevenueCents > 0);
});

test('choosing a preset sets its rules, its store and whether copies matter', () => {
  for (const p of PRESETS) {
    const s = presetSettings(p.id);
    assert.deepEqual(s.rules, p.rules || DEFAULT_SETTINGS.rules, p.id);
    const store = { ...GACHA_STORE, ...(p.store || {}) };
    assert.equal(s.pullCost, store.pullCost, p.id);
    assert.equal(s.freePerDay, store.freePerDay, p.id);
    assert.deepEqual(s.packs, store.packs, p.id);
    assert.deepEqual(s.pass, store.pass, p.id);
    assert.equal(s.extraCopies, p.extraCopies ?? true, p.id);
    // a copy, so editing the page can't change the preset itself
    assert.notEqual(s.packs, store.packs);
  }
  // Custom is the page's defaults
  const c = presetSettings('custom');
  assert.deepEqual(c.rules, DEFAULT_SETTINGS.rules);
  assert.deepEqual(c.packs, DEFAULT_SETTINGS.packs);
  assert.equal(c.pullCost, DEFAULT_SETTINGS.pullCost);
});

test('a League Exalted season: one skin at most, no pass, free players never draw, no whale overpays', () => {
  const run = simulate(base({ ...presetSettings('lol-exalted') }));
  const { ctx, out } = run;
  for (let i = 0; i < ctx.N; i++) {
    assert.ok(out.featured[i] <= 1, `player ${i} has ${out.featured[i]} copies`);
    assert.equal(out.passes[i], 0, `player ${i} bought a pass`);
    if (ctx.typeOf[i] === FREE) assert.equal(out.pulls[i], 0, `free player ${i} drew without RP`);
    // 80 draws are 32,000 RP: three $99.99 packs (13,500 RP each) always cover it
    if (ctx.typeOf[i] === WHALE) assert.ok(out.spendCents[i] <= 3 * 9999, `whale ${i} spent ${out.spendCents[i]}`);
  }
  assert.ok(run.totals.byType[WHALE].gotFeatured > 0, 'some whales got the skin');
});

test('a pass lasts exactly its days: 61 days take three passes', () => {
  const run = simulate(base({ days: 61, sampleSize: 1000 }));
  const { ctx, out } = run;
  for (let i = 0; i < ctx.N; i++) if (ctx.typeOf[i] !== FREE) assert.equal(out.passes[i], 3, `player ${i}`);
});

test('free players fall into light, middle and heavy groups, as the log-in research found', () => {
  // At 40% (the brief's figure for everyone): about half on fewer than 10 of 30 days, a fifth on 10 to 19, a quarter
  // on 20 or more, and a spread of about 0.30 (docs/research/2026-10-06-logins.md, Q5).
  const run = simulate(base({ sampleSize: 10000, loginRate: 0.4 }));
  const { ctx, out } = run;
  const shares = [];
  let few = 0;
  let many = 0;
  for (let i = 0; i < ctx.N; i++) {
    if (ctx.typeOf[i] !== FREE) continue;
    shares.push(out.daysPlayed[i] / ctx.s.days);
    if (out.daysPlayed[i] < 10) few += 1;
    if (out.daysPlayed[i] >= 20) many += 1;
  }
  const n = shares.length;
  const mean = shares.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(shares.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  assert.ok(sd > 0.27 && sd < 0.33, `spread of days played ${sd}`);
  assert.ok(Math.abs(few / n - 0.52) < 0.03, `fewer than 10 days: ${few / n}`);
  assert.ok(Math.abs(many / n - 0.26) < 0.03, `20 days or more: ${many / n}`);
});

test('the log-in mix always averages the log-in rate, and at 40% is 58% light, 16% middle, 26% heavy', () => {
  for (let m = 0.02; m <= 1.0001; m += 0.01) {
    const mix = loginMix(m);
    const weight = mix.reduce((a, b) => a + b.weight, 0);
    const mean = mix.reduce((a, b) => a + (b.weight * (b.lo + b.hi)) / 2, 0);
    assert.ok(Math.abs(weight - 1) < 1e-9, `weights at ${m}`);
    assert.ok(Math.abs(mean - m) < 1e-9, `mean at ${m}: ${mean}`);
    for (const b of mix) assert.ok(b.weight >= -1e-12 && b.lo >= 0 && b.hi <= 1 + 1e-12 && b.lo <= b.hi + 1e-12, `band at ${m}`);
  }
  const at40 = loginMix(0.4);
  assert.deepEqual(at40.map((b) => [b.lo, b.hi]), [[0.03, 0.33], [0.33, 0.67], [0.67, 1]]);
  assert.ok(Math.abs(at40[0].weight - 0.582) < 0.001 && at40[1].weight === 0.16 && Math.abs(at40[2].weight - 0.258) < 0.001);
  // and draws follow the mix
  const rng = (() => { let x = 0.5; return () => (x = (x * 9301 + 49297) % 233280) / 233280; })();
  let light = 0;
  let heavy = 0;
  for (let k = 0; k < 20000; k++) {
    const a = drawActivity(at40, rng);
    if (a < 0.33) light += 1;
    else if (a >= 0.67) heavy += 1;
  }
  assert.ok(Math.abs(light / 20000 - 0.582) < 0.02 && Math.abs(heavy / 20000 - 0.258) < 0.02, `${light} light, ${heavy} heavy`);
});

test('each suggestion reports the revenue change it really makes', () => {
  const s = base({ sampleSize: 2000 });
  const before = simulate(s);
  const results = [...testLevers(s, before)];
  assert.ok(results.length >= 10);
  for (const r of results.slice(0, 5)) {
    const after = simulate(r.settings);
    const change = after.totals.revenueCents / before.totals.revenueCents - 1;
    assert.ok(Math.abs(r.revenue - change) < 1e-12, `${r.id}: ${r.revenue} vs ${change}`);
    assert.equal(r.revenueCents, after.totals.revenueCents);
  }
});

test('dropping a protection is never suggested to earn more, only listed', () => {
  const r = (id, revenue, removesProtection) => ({ id, revenue, freeFeatured: 0, whaleGoal: 0, removesProtection, revenueCents: 0, freeFeaturedAfter: 0 });
  const ranked = rank([r('guarantee', 0.07, true), r('price', 0.015, false)]);
  assert.deepEqual(ranked.earn.map((x) => x.id), ['price']);
  assert.deepEqual(ranked.leftOut.map((x) => x.id), ['guarantee']);
});

test('signed changes only carry a sign when they round to something', () => {
  assert.equal(signedPct(-0.0001), '±0.0%');
  assert.equal(signedPct(0.0151), '+1.5%');
  assert.equal(signedPct(-0.0102), '−1.0%');
  assert.equal(signedPts(0.1059), '+10.6 pts');
  assert.equal(signedPts(0), '±0.0 pts');
});

test('Capturing Radiance without the guarantee: the exact maths matches a long run', () => {
  const rules = { ...PRESETS[0].rules, guarantee: false };
  const r = testRules(rules, 200000, 'cr-noguar');
  const F = featuredShareTheory(rules);
  assert.equal(fiftyFiftyTheory(rules), F); // every 5★ is a 50/50 when nothing is guaranteed
  assert.ok(F > 0.5 && F < 0.6, `featured share ${F}`);
  assert.ok(countFits(r.featured, r.fives, F), `${r.featuredShare} vs ${F}`);
});

test('the rare-event line sits at 1 in 10,000', () => {
  const n = 40000;
  // two hits against 0.05 expected: a 1-in-800 chance, inside the line
  assert.ok(Math.abs(poissonTail(2, 0.05) - 0.00121) < 0.00002);
  assert.ok(countFits(2, n, 0.05 / n));
  // two hits against 0.014 expected: about 1 in 10,300, just outside it
  assert.ok(poissonTail(2, 0.014) < 1e-4);
  assert.ok(!countFits(2, n, 0.014 / n));
});

test('a run keeps its own copy of the settings', () => {
  const s = base({ sampleSize: 500 });
  const run = simulate(s);
  s.freePerDay = 9999;
  s.rules.baseRate = 0.5;
  assert.equal(run.ctx.s.freePerDay, DEFAULT_SETTINGS.freePerDay);
  assert.equal(run.ctx.s.rules.baseRate, DEFAULT_SETTINGS.rules.baseRate);
});

test('suggestions carry their noise, and close calls are marked', () => {
  const s = base({ sampleSize: 2000 });
  const before = simulate(s);
  const results = [...testLevers(s, before)];
  for (const r of results) {
    assert.ok(r.freeSE >= 0 && r.revenueSE >= 0 && r.whaleSE >= 0, r.id);
  }
  const fake = (id, revenue, freeFeatured, freeSE) => ({ id, revenue, freeFeatured, freeSE, whaleGoal: 0, whaleSE: 0, revenueSE: 0.001, revenueCents: 0, freeFeaturedAfter: 0 });
  const ranked = rank([fake('edge', 0.05, -0.029, 0.002), fake('clear', 0.04, 0, 0.002)]);
  assert.equal(ranked.earn.find((x) => x.id === 'edge').closeCall, true);
  assert.equal(ranked.earn.find((x) => x.id === 'clear').closeCall, false);
});

// A banner where luck almost never pays: the spark does nearly all the work.
const stingy = { baseRate: 0.0005, softPityStart: 999, softPityStep: 0, hardPity: 999, featuredChance: 0.5, guarantee: true, radiance: { on: false, chance: 0, sureAfter: 3 } };

test('a spark trades every N pulls for the featured unit, points carrying over', () => {
  const s = base({ sampleSize: 1000, rules: { ...stingy, spark: { pulls: 200, resetOnFeatured: false } } });
  s.types = { ...s.types, whale: { ...s.types.whale, share: 0.05 } };
  const run = simulate(s);
  const { ctx, out } = run;
  let sparkedAny = 0;
  for (let i = 0; i < ctx.N; i++) {
    const tr = tracePlayer(i, ctx);
    const sparks = tr.log.fives.filter((f) => f.how === HOW.SPARK);
    assert.equal(sparks.length, out.sparked[i]);
    // non-resetting: the k-th spark lands exactly on pull 200 * k
    sparks.forEach((f, k) => assert.equal(f.pull, 200 * (k + 1), `player ${i} spark ${k}`));
    assert.ok(out.sparked[i] <= Math.floor(out.pulls[i] / 200));
    assert.ok(out.featured[i] <= ctx.defs[ctx.typeOf[i]].goal);
    sparkedAny += out.sparked[i];
  }
  assert.ok(sparkedAny > 0, 'some players reached a spark');
});

test('a resetting spark guarantees the featured unit within N pulls', () => {
  const s = base({ sampleSize: 1000, rules: { ...stingy, baseRate: 0.01, spark: { pulls: 330, resetOnFeatured: true } } });
  s.types = { ...s.types, whale: { ...s.types.whale, share: 0.05 } };
  const run = simulate(s);
  const { ctx } = run;
  for (let i = 0; i < ctx.N; i++) {
    if (ctx.typeOf[i] !== WHALE) continue;
    const tr = tracePlayer(i, ctx);
    let last = 0;
    for (const f of tr.log.fives) {
      if (f.how === HOW.LOST) continue;
      assert.ok(f.pull - last <= 330, `player ${i}: ${f.pull - last} pulls without the featured unit`);
      if (f.how === HOW.SPARK) assert.equal(f.pull - last, 330);
      last = f.pull;
    }
  }
});

test('without a spark nothing is traded', () => {
  const run = simulate(base({ sampleSize: 2000 }));
  assert.ok(run.out.sparked.every((x) => x === 0));
});

test('spark levers only appear when the banner has a spark', () => {
  const plain = base({ sampleSize: 1000 });
  const ids = [...testLevers(plain, simulate(plain))].map((r) => r.id);
  assert.ok(!ids.includes('spark-sooner') && !ids.includes('spark-later'));
  const sparky = base({ sampleSize: 1000, rules: { ...DEFAULT_SETTINGS.rules, spark: { pulls: 200, resetOnFeatured: false } } });
  const results = [...testLevers(sparky, simulate(sparky))];
  const sooner = results.find((r) => r.id === 'spark-sooner');
  assert.equal(sooner.settings.rules.spark.pulls, 150);
  assert.equal(results.find((r) => r.id === 'spark-later').settings.rules.spark.pulls, 250);
});
