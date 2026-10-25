// The Gacha Lab engine: banner rules, one player's season, and a whole sample of players.
// Pure and seeded. Nothing here touches the page, so the tests and the validation script run
// exactly the code the app runs.

import { makeRng } from './rng.js';

// Player types, in the order the dot field shows them. Free players take whatever share is left.
export const TYPES = ['whale', 'dolphin', 'pass', 'free'];
export const WHALE = 0;
export const DOLPHIN = 1;
export const PASS = 2;
export const FREE = 3;

// What a 5★ turned out to be. SPARK is a featured unit traded for pulls and FREE one handed out at a
// pull count (freeCopiesAt); neither is a 5★ from a pull.
export const HOW = { WON: 1, LOST: 2, GUARANTEED: 3, RADIANCE: 4, SPARK: 5, FREE: 6 };

// How often free players log in: each one's share of days comes from three bands, the shape found in top Japanese
// game apps (App Ape) and in a gacha game's own logs (CyberAgent; docs/research/2026-10-06-logins.md): many near-daily
// players, many who come on a few days, few in between. Light players log in on 3-33% of days, middle 33-67%, heavy
// 67-100%. At most averages the middle band holds 16% of free players, and the light and heavy shares are set so the
// average is the log-in rate (at 40%: 58% light, 26% heavy).
export const LOGIN_BANDS = [
  [0.03, 0.33],
  [0.33, 0.67],
  [0.67, 1],
];
export const MIDDLE_SHARE = 0.16;

// Free gems: about a fifth comes only on the days a player logs in (daily missions, like Genshin's 60 Primogems of
// about 300 a day; rounded to whole gems); the rest (events, endgame, story) is the week's share, collected in full at
// the week's first log-in (weeks are days 1-7, 8-14, ...; the last may be short). A week with no log-in loses it.
// Someone who logs in every day gets the full amount either way.
export const DAILY_SHARE = 0.2;

// The bands' shares (and ranges) for an average log-in rate m: [{ weight, lo, hi }]. Where the full shape can't
// reach m, the middle band gives way too, and beyond the light or heavy band's own average a single narrowed band
// holds everyone, so the average is always m.
export function loginMix(m) {
  const [light, middle, heavy] = LOGIN_BANDS;
  const mid = (band) => (band[0] + band[1]) / 2;
  const [mL, mM, mH] = [mid(light), mid(middle), mid(heavy)];
  const full = (MIDDLE_SHARE * mM + (1 - MIDDLE_SHARE) * mH - m) / (mH - mL); // light share with the middle at 16%
  if (full >= 0 && full <= 1 - MIDDLE_SHARE) {
    return [
      { weight: full, lo: light[0], hi: light[1] },
      { weight: MIDDLE_SHARE, lo: middle[0], hi: middle[1] },
      { weight: 1 - MIDDLE_SHARE - full, lo: heavy[0], hi: heavy[1] },
    ];
  }
  if (full > 1 - MIDDLE_SHARE) {
    // below the full shape: no heavy players
    if (m >= mL) {
      const w = (mM - m) / (mM - mL);
      return [
        { weight: w, lo: light[0], hi: light[1] },
        { weight: 1 - w, lo: middle[0], hi: middle[1] },
      ];
    }
    const lo = Math.min(light[0], m);
    return [{ weight: 1, lo, hi: 2 * m - lo }];
  }
  // above the full shape: no light players
  if (m <= mH) {
    const w = (mH - m) / (mH - mM);
    return [
      { weight: w, lo: middle[0], hi: middle[1] },
      { weight: 1 - w, lo: heavy[0], hi: heavy[1] },
    ];
  }
  return [{ weight: 1, lo: 2 * m - 1, hi: 1 }];
}

// One free player's chance of logging in on a day: a band by its share, then a point in it. Always two draws.
export function drawActivity(mix, rng) {
  const u = rng();
  const v = rng();
  let acc = 0;
  for (const band of mix) {
    acc += band.weight;
    if (u < acc) return band.lo + v * (band.hi - band.lo);
  }
  const last = mix[mix.length - 1];
  return last.lo + v * (last.hi - last.lo);
}

// Paying players' pack budgets spread evenly between these multiples of their type's budget. A budget is the most a
// whale or dolphin will spend on packs; most stop well short of it, at their goal (runPlayer), so what they spend
// follows the banner: a harsher one costs them more, a kinder one less (since 7 Oct 2026; before, budgets were small
// enough that everyone spent all of theirs whatever the rules, and revenue never moved).
export const BUDGET_LOW = 0.5;
export const BUDGET_HIGH = 1.5;

// ---------------------------------------------------------------------------------------------
// Banner rules

// Chance that pull number n since the last 5★ (n = 1, 2, ...) is a 5★. Soft pity climbs by
// `softPityStep` a pull from `softPityStart`; `moreRamps` lets the climb speed up later
// (Wuthering Waves: +4 points a pull from 66, +8 from 71, +10 from 76). Each step size holds until
// the next one starts.
export function fiveStarChance(n, rules) {
  if (n >= rules.hardPity) return 1;
  if (n < rules.softPityStart && !(rules.moreRamps && rules.moreRamps.length)) return rules.baseRate;
  const ramps = [{ start: rules.softPityStart, step: rules.softPityStep }, ...(rules.moreRamps || [])].sort((a, b) => a.start - b.start);
  let p = rules.baseRate;
  for (let k = 0; k < ramps.length; k++) {
    const { start, step } = ramps[k];
    if (n < start) break;
    const end = k + 1 < ramps.length ? ramps[k + 1].start - 1 : Infinity;
    p += step * (Math.min(n, end) - start + 1);
  }
  return Math.min(1, p);
}

export function chanceTable(rules) {
  const table = new Float64Array(rules.hardPity + 1);
  for (let n = 1; n <= rules.hardPity; n++) table[n] = fiveStarChance(n, rules);
  return table;
}

// Exact chance that the next 5★ lands on pull n (index n, 1..hardPity). Sums to 1.
export function pityDistribution(rules) {
  const dist = new Float64Array(rules.hardPity + 1);
  let survive = 1;
  for (let n = 1; n <= rules.hardPity; n++) {
    const p = fiveStarChance(n, rules);
    dist[n] = survive * p;
    survive *= 1 - p;
  }
  return dist;
}

export function pityMoments(rules) {
  const dist = pityDistribution(rules);
  let mean = 0;
  let meanSq = 0;
  for (let n = 1; n < dist.length; n++) {
    mean += n * dist[n];
    meanSq += n * n * dist[n];
  }
  return { dist, mean, sd: Math.sqrt(Math.max(0, meanSq - mean * mean)) };
}

// The banner state a player carries between pulls. `points` counts pulls toward the spark.
export function freshBanner() {
  return { pity: 0, guaranteed: false, streak: 0, lastPity: 0, points: 0 };
}

// The spark: after `pulls` pulls a player can trade them for the featured unit (Blue Archive and
// Umamusume: 200, Granblue Fantasy: 300). With `resetOnFeatured`, the count restarts whenever the
// featured unit drops, which makes it a guarantee of the featured unit within that many pulls
// (Fate/Grand Order's 330). 0 pulls means no spark.
export function sparkPulls(rules) {
  return rules.spark && rules.spark.pulls > 0 ? Math.round(rules.spark.pulls) : 0;
}

// Free copies at fixed pull counts on the banner, once each: Epic Seven gives the featured hero at
// 170 and 200 summons, Fire Emblem Heroes a free pick at 40, Arknights a free limited operator at 300.
// The count is every pull on the banner, whatever it gave, and it never starts again. Sorted, whole,
// positive; an empty list means none.
export function freeCopyPulls(rules) {
  return (rules.freeCopiesAt || [])
    .map((n) => Math.round(n))
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
}

// The pull by which the first featured copy is certain, or Infinity: the spark, the first free copy,
// or hard pity on a banner whose every legendary is the featured one.
export function firstSurePull(rules) {
  const free = freeCopyPulls(rules);
  return Math.min(sparkPulls(rules) || Infinity, free.length ? free[0] : Infinity, rules.featuredChance >= 1 && rules.hardPity < 999 ? rules.hardPity : Infinity);
}

// Decide whether a 5★ is the featured one. `streak` counts 50/50s lost in a row (a guaranteed 5★
// in between doesn't break the run). Capturing Radiance, as HoYoverse describes it: on a 5★ that
// isn't guaranteed it can trigger and turn the result into the featured unit; it is certain after
// `sureAfter` losses in a row. It is checked before the 50/50, so "won outright" stays a clean 50%
// ("50.000% … excluding the triggering of Capturing Radiance" in the official wording).
export function decideFeatured(st, rules, rng) {
  if (rules.guarantee && st.guaranteed) {
    st.guaranteed = false;
    return HOW.GUARANTEED;
  }
  const radiance = rules.radiance;
  if (radiance && radiance.on && (st.streak >= radiance.sureAfter || rng() < radiance.chance)) {
    st.streak = 0;
    return HOW.RADIANCE;
  }
  if (rng() < rules.featuredChance) {
    st.streak = 0;
    return HOW.WON;
  }
  st.guaranteed = rules.guarantee;
  st.streak += 1;
  return HOW.LOST;
}

// One pull. Returns 0 for no 5★, otherwise a HOW code; st.lastPity holds the pull count it landed on.
// The 5★ roll and the 50/50 can use separate dice, so a rule that changes one leaves the other alone.
export function pullOnce(st, chance, rules, rollRng, coinRng = rollRng) {
  st.pity += 1;
  if (rollRng() >= chance[st.pity]) return 0;
  st.lastPity = st.pity;
  st.pity = 0;
  return decideFeatured(st, rules, coinRng);
}

// Pull a long run of 5★s on one banner state and measure them. Checks the rules code against the
// exact maths and the published rates, separately from how any player behaves.
export function testRules(rules, fives, seed = 'rules') {
  const rng = makeRng(`${seed}#rules`);
  const chance = chanceTable(rules);
  const st = freshBanner();
  const landed = new Float64Array(rules.hardPity + 1);
  const count = { WON: 0, LOST: 0, GUARANTEED: 0, RADIANCE: 0 };
  let pulls = 0;
  let got = 0;
  let longest = 0;
  let afterLossOk = true;
  let lastWasLoss = false;
  while (got < fives) {
    pulls += 1;
    const how = pullOnce(st, chance, rules, rng);
    if (!how) continue;
    got += 1;
    landed[st.lastPity] += 1;
    if (st.lastPity > longest) longest = st.lastPity;
    if (how === HOW.WON) count.WON += 1;
    else if (how === HOW.LOST) count.LOST += 1;
    else if (how === HOW.GUARANTEED) count.GUARANTEED += 1;
    else count.RADIANCE += 1;
    if (rules.guarantee && lastWasLoss && how === HOW.LOST) afterLossOk = false;
    lastWasLoss = how === HOW.LOST;
  }
  const featured = count.WON + count.GUARANTEED + count.RADIANCE;
  const attempts = count.WON + count.LOST + count.RADIANCE;
  return {
    fives: got,
    pulls,
    landed,
    longest,
    count,
    featured,
    attempts,
    rate: got / pulls,
    meanPity: pulls / got,
    featuredShare: featured / got,
    // 50/50s won with Capturing Radiance set aside, the way HoYoverse states the 50%
    wonShare: count.WON + count.LOST ? count.WON / (count.WON + count.LOST) : 0,
    // 50/50s that gave the featured unit, Radiance included (HoYoverse's 55% for Genshin)
    winWithRadiance: attempts ? (count.WON + count.RADIANCE) / attempts : 0,
    radianceShare: attempts ? count.RADIANCE / attempts : 0,
    hardPityShare: landed[rules.hardPity] / got,
    afterLossOk,
  };
}

// Long-run share of 5★s that are the featured unit, worked out exactly from the same rules as
// decideFeatured. Without Capturing Radiance it is 1 / (2 - q) with the guarantee and q without.
// With it, the outcome depends on the losing streak, so this finds the steady state of the
// (guaranteed?, streak) chain over 5★s. A lazy step keeps the iteration from oscillating when
// q is 0 or 1.
export function featuredShareTheory(rules) {
  const q = rules.featuredChance;
  const radiance = rules.radiance && rules.radiance.on ? rules.radiance : null;
  const sure = radiance ? radiance.sureAfter : 0;
  const S = sure + 1;
  const featProb = (g, s) => {
    if (rules.guarantee && g) return 1;
    if (radiance && s >= sure) return 1;
    return radiance ? radiance.chance + (1 - radiance.chance) * q : q;
  };
  let pi = [new Float64Array(S), new Float64Array(S)];
  pi[0][0] = 1;
  for (let step = 0; step < 20000; step++) {
    const next = [new Float64Array(S), new Float64Array(S)];
    for (let g = 0; g < 2; g++) {
      for (let s = 0; s < S; s++) {
        const m = pi[g][s];
        if (!m) continue;
        next[g][s] += m / 2;
        const half = m / 2;
        if (rules.guarantee && g) {
          next[0][s] += half; // a guaranteed 5★ leaves the streak alone
          continue;
        }
        const win = featProb(g, s);
        next[0][0] += half * win;
        const lose = half * (1 - win);
        if (lose) next[rules.guarantee ? 1 : 0][radiance ? Math.min(sure, s + 1) : 0] += lose;
      }
    }
    let delta = 0;
    for (let g = 0; g < 2; g++) for (let s = 0; s < S; s++) delta += Math.abs(next[g][s] - pi[g][s]);
    pi = next;
    if (delta < 1e-15) break;
  }
  let share = 0;
  for (let g = 0; g < 2; g++) for (let s = 0; s < S; s++) share += pi[g][s] * featProb(g, s);
  return share;
}

// Average pulls to the first featured copy from a fresh start, worked out exactly. With a spark or a
// free copy at N pulls the copy is certain by pull N, so this is E[min(T, N)]; without one it is the
// long-run average. (Capturing Radiance only lives in the Genshin preset, which has neither; it is left
// out of the capped case.)
export function firstFeaturedPulls(rules) {
  const free = freeCopyPulls(rules);
  const N = Math.min(sparkPulls(rules) || Infinity, free.length ? free[0] : Infinity);
  if (N === Infinity) {
    const share = featuredShareTheory(rules);
    return share > 0 ? pityMoments(rules).mean / share : Infinity;
  }
  const chance = chanceTable(rules);
  const hard = rules.hardPity;
  let mass = [new Float64Array(hard + 1), new Float64Array(hard + 1)]; // [guaranteed][pity]
  mass[0][0] = 1;
  let expected = 0;
  for (let t = 1; t <= N; t++) {
    const next = [new Float64Array(hard + 1), new Float64Array(hard + 1)];
    for (let g = 0; g < 2; g++) {
      for (let p = 0; p < hard; p++) {
        const m = mass[g][p];
        if (!m) continue;
        const p5 = chance[p + 1];
        next[g][p + 1] += m * (1 - p5);
        const featured = rules.guarantee && g ? 1 : rules.featuredChance;
        expected += t * m * p5 * featured;
        next[rules.guarantee ? 1 : 0][0] += m * p5 * (1 - featured);
      }
    }
    mass = next;
  }
  let left = 0;
  for (let g = 0; g < 2; g++) for (let p = 0; p <= hard; p++) left += mass[g][p];
  return expected + N * left;
}

// Long-run chance that a 5★ which is not guaranteed turns out to be the featured unit, Capturing
// Radiance included. Without Radiance it is the featured chance itself. With the guarantee on, a
// share F of all 5★s are featured and those 5★s are 50/50s plus guaranteed ones, so the 50/50 win
// rate w satisfies F = 1 / (2 - w).
export function fiftyFiftyTheory(rules) {
  const radiance = rules.radiance && rules.radiance.on;
  if (!radiance) return rules.featuredChance;
  const F = featuredShareTheory(rules);
  return rules.guarantee ? 2 - 1 / F : F;
}

// ---------------------------------------------------------------------------------------------
// Players

const toCents = (dollars) => Math.round(dollars * 100);

// How many featured pulls a player of a type is after in a season: the copies they want of one thing, capped by
// the game's useful maximum when it has one (`maxCopies`: null or 0 means none), times the number of things they
// chase. A banner season is rarely one unit — Genshin and Honkai run several featured characters and their
// weapons, League's Sanctum has the skin, its border and the mythic essence — and a whale goes after more than
// one of them (her point, 19 Oct 2026). To the pull maths a featured win is a featured win, whichever thing it
// was for, and pity and the guarantee carry across banners as they do in those games.
export function goalFor(goal, maxCopies, chases = 1) {
  const g = Math.max(1, Math.round(goal || 1));
  const capped = maxCopies > 0 ? Math.min(g, Math.round(maxCopies)) : g;
  return capped * Math.max(1, Math.round(chases || 1));
}

// Turn the settings into everything a run needs, including which player is which type.
export function prepare(settings) {
  // The run keeps its own copy, so later edits to the settings can't change what it describes.
  const s = structuredClone(settings);
  const N = s.sampleSize;
  // A game with no monthly pass has its price and gems all at zero: nobody buys one then, and the
  // players who would only have bought the pass are free players.
  const hasPass = s.pass.price > 0 || s.pass.upfront > 0 || s.pass.daily > 0;
  const shares = [s.types.whale.share, s.types.dolphin.share, s.types.pass.share];
  const counts = shares.map((x) => Math.round(N * x));
  let paying = counts[0] + counts[1] + counts[2];
  const overfull = paying > N;
  if (overfull) {
    // Shares above 100% are scaled back so the sample size holds; the rounding leftover goes to the
    // paying types, so nobody becomes a free player by accident.
    const scale = N / paying;
    for (let t = 0; t < 3; t++) counts[t] = Math.floor(counts[t] * scale);
    for (let t = 0; N - (counts[0] + counts[1] + counts[2]) > 0; t = (t + 1) % 3) if (shares[t] > 0) counts[t] += 1;
    paying = counts[0] + counts[1] + counts[2];
  }
  counts.push(N - paying);
  if (!hasPass) {
    counts[FREE] += counts[PASS];
    counts[PASS] = 0;
  }

  const typeOf = new Uint8Array(N);
  let k = 0;
  for (let t = 0; t < 4; t++) for (let j = 0; j < counts[t]; j++) typeOf[k++] = t;
  const shuffle = makeRng(`${s.seed}#types`);
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(shuffle() * (i + 1));
    const tmp = typeOf[i];
    typeOf[i] = typeOf[j];
    typeOf[j] = tmp;
  }
  // Each player's place among their type, so goals can be spread evenly across a type even when it has only a few
  // players (2 whales in 1,000): see runPlayer.
  const rank = new Uint32Array(N);
  const seen = [0, 0, 0, 0];
  for (let i = 0; i < N; i++) rank[i] = seen[typeOf[i]]++;

  // With extra copies off (a game where duplicates don't matter), everyone stops at their first copy.
  // A game whose copies stop helping at some count (Fate/Grand Order's NP5 is 5 copies) caps every goal there.
  const firstOnly = s.extraCopies === false;
  const defs = TYPES.map((name) => {
    const d = s.types[name];
    return {
      name,
      pass: !!d.pass,
      budgetCents: toCents(d.budget || 0),
      goal: firstOnly ? 1 : goalFor(d.goal, s.maxCopies, d.chases),
    };
  });

  // `k` is the pack's row in the store, kept through the sort so sales can be reported against the row the
  // page shows (packSales). Packs with no price or no gems are never bought, so they are dropped here.
  const packs = s.packs
    .map((p, k) => ({ k, cents: toCents(p.price), gems: Math.round(p.gems) }))
    .filter((p) => p.cents > 0 && p.gems > 0)
    .sort((a, b) => b.cents - a.cents);
  // The best store price for a gem, or null when nothing in the store has a price.
  const centsPerGem = packs.length ? Math.min(...packs.map((p) => p.cents / p.gems)) : null;
  // What one featured copy costs in pulls in the long run, from the exact maths: how a player judges how many gems
  // they still need when they top up (Infinity when the featured unit never comes).
  const share = featuredShareTheory(s.rules);
  const pullsPerCopy = share > 0 ? pityMoments(s.rules).mean / share : Infinity;

  return {
    s,
    N,
    counts,
    overfull,
    typeOf,
    rank,
    defs,
    packs,
    centsPerGem,
    pullsPerCopy,
    pass: hasPass ? { cents: toCents(s.pass.price), upfront: s.pass.upfront, daily: s.pass.daily, days: s.pass.days } : null,
    rules: s.rules,
    chance: chanceTable(s.rules),
    loginMix: loginMix(s.loginRate),
  };
}

// Is pack `a` better value for money than `b`: a lower price a gem, compared as whole cents and gems so no rounding
// decides it. At the same price a gem, the bigger pack, which is also the dearer one (same rate and same gems means
// the same price), so one top-up does the work of two. The order the store is in never decides.
function betterValue(a, b) {
  const left = a.cents * b.gems;
  const right = b.cents * a.gems;
  return left === right ? a.gems > b.gems : left < right;
}

// The pack a player buys when they run out of gems. They spend as little money as they can for the gems they still
// expect to need (runPlayer works out the need):
//   - when a pack they can afford covers the whole need, the cheapest of those, since gems past the need are wasted;
//   - when none does, or when the one that does costs more than simply taking the best value for money and coming
//     back, they buy the best value they can afford: the lowest price a gem, which is what a bonus ladder is for.
// So the most a player ever hands over at once is the price of the store's best value. Without that second clause a
// single pack big enough to finish the job is bought at any price, however many cheaper ones would add up to it.
// A pack another affordable pack beats outright (as many gems for less, or more gems for the same) is never bought
// under either clause: beating it outright always means a better price a gem and never a higher price.
// Until 18 Oct 2026 the choice took the most gems whatever it cost, so a store whose biggest pack was also its worst
// value still took nearly all the money, and raising a pack's price could lower revenue.
// null when the budget covers no pack. A need of Infinity or NaN covers nothing, so it falls to the best value.
export function pickPack(packs, budgetCents, needGems) {
  let best = null; // best value for money
  let fits = null; // cheapest that covers the whole need
  for (const p of packs) {
    if (p.cents > budgetCents) continue;
    if (!best || betterValue(p, best)) best = p;
    if (p.gems >= needGems && (!fits || p.cents < fits.cents || (p.cents === fits.cents && p.gems > fits.gems))) fits = p;
  }
  return fits && fits.cents <= best.cents ? fits : best;
}

export const FIELDS = {
  activity: Float32Array,
  daysPlayed: Uint32Array,
  pulls: Uint32Array,
  fives: Uint32Array,
  featured: Uint32Array,
  sparked: Uint32Array,
  freeCopies: Uint32Array,
  offBanner: Uint32Array,
  first5Day: Uint32Array,
  firstFeaturedDay: Uint32Array,
  goalDay: Uint32Array,
  goal: Uint8Array,
  budgetCents: Uint32Array,
  spendCents: Uint32Array,
  passCents: Uint32Array,
  packs: Uint32Array,
  passes: Uint32Array,
  freeGems: Uint32Array,
  passGems: Uint32Array,
  boughtGems: Uint32Array,
  gemsLeft: Uint32Array,
  pityEnd: Uint32Array,
  guaranteedEnd: Uint8Array,
};

export function allocate(N) {
  const out = {};
  for (const [name, Type] of Object.entries(FIELDS)) out[name] = new Type(N);
  return out;
}

// One player's season. Writes the player's row into `out` at index i. With a `log` object it also
// records every day, purchase and 5★, which is how the player inspector shows its working.
export function runPlayer(i, ctx, out, log) {
  const { s, defs, packs, pass, rules, chance } = ctx;
  const type = ctx.typeOf[i];
  const def = defs[type];
  // Three sets of dice per player: who they are and which days they play; their 5★ rolls; their
  // 50/50s. A change that alters how many pulls happen moves nobody's log-in days, so two runs that
  // differ in one setting differ only because of it.
  const rng = makeRng(`${s.seed}#${i}`);
  const rollRng = makeRng(`${s.seed}#${i}#pull`);
  const coinRng = makeRng(`${s.seed}#${i}#coin`);
  // A free player's share of days from the log-in bands (loginMix); paying players log in every day.
  const activity = type === FREE ? drawActivity(ctx.loginMix, rng) : 1;
  // Each whale's or dolphin's own budget: between half and one and a half times their type's.
  const budgetCents = def.budgetCents ? Math.round(def.budgetCents * (BUDGET_LOW + rng() * (BUDGET_HIGH - BUDGET_LOW))) : 0;
  // And their own goal: anywhere from 1 copy to their type's goal (whales 1 to 7), spread evenly across the type: the
  // k-th of n players draws from the k-th n-th of the range, so even 2 or 20 whales cover it fairly (stratified). One
  // copy needs no draw, so free players and pass buyers keep exactly the dice they had.
  const goal = def.goal > 1 ? 1 + Math.floor(((ctx.rank[i] + rng()) / ctx.counts[type]) * def.goal) : def.goal;
  const cost = s.pullCost;
  const st = freshBanner();
  const sparkAt = sparkPulls(rules);
  const sparkResets = !!rules.spark?.resetOnFeatured;
  const freeAt = freeCopyPulls(rules);
  let nextFree = 0;

  let gems = s.startGems;
  let freeGems = s.startGems;
  // free gems: the day's own part on each day played, and the week's share at the week's first log-in (DAILY_SHARE)
  const dayPart = Math.round(s.freePerDay * DAILY_SHARE);
  const weekPart = s.freePerDay - dayPart;
  let weekCollected = false;
  let passGems = 0;
  let boughtGems = 0;
  let budget = budgetCents;
  let spend = 0;
  let passSpend = 0;
  let packsBought = 0;
  let passesBought = 0;
  let passLeft = 0;
  let pulls = 0;
  let fives = 0;
  let featured = 0;
  let sparked = 0;
  let freeCopies = 0;
  let offBanner = 0;
  let first5Day = 0;
  let firstFeaturedDay = 0;
  let goalDay = 0;
  let daysPlayed = 0;

  for (let day = 1; day <= s.days; day++) {
    const played = rng() < activity;
    const gemsAtStart = gems;
    const pullsAtStart = pulls;
    // the day's gems by source, the way the player card splits them: free, the pass (up front and daily), packs
    let freeToday = 0;
    let passToday = 0;
    let boughtToday = 0;
    if ((day - 1) % 7 === 0) weekCollected = false; // a new week
    if (played) {
      daysPlayed += 1;
      if (pass && def.pass && passLeft === 0) {
        passLeft = pass.days;
        passesBought += 1;
        spend += pass.cents;
        passSpend += pass.cents;
        gems += pass.upfront;
        passGems += pass.upfront;
        passToday += pass.upfront;
        if (log) log.buys.push({ day, kind: 'pass', cents: pass.cents, gems: pass.upfront });
      }
      let free = dayPart;
      if (!weekCollected) {
        const weekStart = day - ((day - 1) % 7);
        free += weekPart * Math.min(7, s.days - weekStart + 1);
        weekCollected = true;
      }
      gems += free;
      freeGems += free;
      freeToday += free;
      if (passLeft > 0) {
        gems += pass.daily;
        passGems += pass.daily;
        passToday += pass.daily;
      }
    }
    if (passLeft > 0) passLeft -= 1;

    if (played) {
      while (featured < goal) {
        if (gems < cost) {
          // A player paces their spending over the banner's run: they mean to get there by the time it ends, so
          // each day they fund about what is left divided by the days left, and stop until tomorrow. (One top-up
          // a day, which this replaced on 19 Oct 2026, spread the buying but strangled anyone chasing a lot: a
          // whale after 28 featured pulls bought on 30 days of 30 and still only got there 60% of the time.)
          // The day's share also sizes the purchase, which is why the whole store sells rather than one pack.
          const pullsLeft = Math.max(1, Math.ceil((goal - featured) * ctx.pullsPerCopy - st.pity));
          const daysLeft = Math.max(1, s.days - day + 1);
          const todaysPulls = Math.max(1, Math.ceil(pullsLeft / daysLeft));
          // what they expect to need today: today's pulls, less the gems in hand; always at least one more pull
          const needGems = Math.max(cost - gems, todaysPulls * cost - gems);
          // today's funding is done: either they have gems to pull with, or they wait for tomorrow
          if (boughtToday > 0 && (gems >= cost || boughtToday >= needGems)) break;
          const pack = pickPack(packs, budget, needGems);
          if (!pack) break;
          budget -= pack.cents;
          spend += pack.cents;
          gems += pack.gems;
          boughtGems += pack.gems;
          boughtToday += pack.gems;
          packsBought += 1;
          // what each row of the store sold, for the page's per-pack share (simulate sets this up; tracePlayer,
          // which re-runs one player on its own row, leaves it out)
          if (out.packSales) {
            out.packSales.count[pack.k] += 1;
            out.packSales.cents[pack.k] += pack.cents;
          }
          if (log) log.buys.push({ day, kind: 'pack', cents: pack.cents, gems: pack.gems, need: needGems });
          continue;
        }
        gems -= cost;
        pulls += 1;
        const how = pullOnce(st, chance, rules, rollRng, coinRng);
        if (how) {
          fives += 1;
          if (!first5Day) first5Day = day;
          if (how !== HOW.LOST) {
            featured += 1;
            if (!firstFeaturedDay) firstFeaturedDay = day;
            if (featured === goal) goalDay = day;
          } else {
            offBanner += 1;
          }
          if (log) log.fives.push({ pull: pulls, day, pity: st.lastPity, how });
        }
        if (sparkAt) {
          st.points += 1;
          if (sparkResets && how && how !== HOW.LOST) st.points = 0;
          if (featured < goal && st.points >= sparkAt) {
            st.points -= sparkAt;
            featured += 1;
            sparked += 1;
            if (!firstFeaturedDay) firstFeaturedDay = day;
            if (featured === goal) goalDay = day;
            if (log) log.fives.push({ pull: pulls, day, pity: st.pity, how: HOW.SPARK });
          }
        }
        // a free copy at this pull count; one past the goal isn't wanted, but the count is used up either way
        while (nextFree < freeAt.length && pulls >= freeAt[nextFree]) {
          nextFree += 1;
          if (featured >= goal) continue;
          featured += 1;
          freeCopies += 1;
          if (!firstFeaturedDay) firstFeaturedDay = day;
          if (featured === goal) goalDay = day;
          if (log) log.fives.push({ pull: pulls, day, pity: st.pity, how: HOW.FREE });
        }
      }
    }
    if (log) {
      log.days.push({
        day,
        played,
        gemsAtStart,
        free: freeToday,
        pass: passToday,
        bought: boughtToday,
        pulls: pulls - pullsAtStart,
        gemsAtEnd: gems,
        pity: st.pity,
      });
    }
  }

  out.activity[i] = activity;
  out.daysPlayed[i] = daysPlayed;
  out.pulls[i] = pulls;
  out.fives[i] = fives;
  out.featured[i] = featured;
  out.sparked[i] = sparked;
  out.freeCopies[i] = freeCopies;
  out.offBanner[i] = offBanner;
  out.first5Day[i] = first5Day;
  out.firstFeaturedDay[i] = firstFeaturedDay;
  out.goalDay[i] = goalDay;
  out.goal[i] = goal;
  out.budgetCents[i] = budgetCents;
  out.spendCents[i] = spend;
  out.passCents[i] = passSpend;
  out.packs[i] = packsBought;
  out.passes[i] = passesBought;
  out.freeGems[i] = freeGems;
  out.passGems[i] = passGems;
  out.boughtGems[i] = boughtGems;
  out.gemsLeft[i] = gems;
  out.pityEnd[i] = st.pity;
  out.guaranteedEnd[i] = st.guaranteed ? 1 : 0;
}

// Re-run one player with full logging. Same dice, so it reproduces the player's row exactly.
export function tracePlayer(i, ctx) {
  const log = { days: [], buys: [], fives: [] };
  const row = allocate(ctx.N);
  runPlayer(i, ctx, row, log);
  const flat = {};
  for (const name of Object.keys(FIELDS)) flat[name] = row[name][i];
  return { i, type: ctx.typeOf[i], row: flat, log };
}

export function simulate(settings) {
  const ctx = prepare(settings);
  const out = allocate(ctx.N);
  // One slot per row of the store as the page lists it, so a row that sells nothing can say so.
  out.packSales = { count: new Uint32Array(ctx.s.packs.length), cents: new Float64Array(ctx.s.packs.length) };
  for (let i = 0; i < ctx.N; i++) runPlayer(i, ctx, out, null);
  return { ctx, out, totals: summarize(ctx, out) };
}

// Paired standard error of a mean difference: the same players, before and after. Used for what the free gems cost
// and, in suggest.js, for how much of a lever's measured change could be luck.
export function pairedSE(diffs) {
  const n = diffs.length;
  if (n < 2) return 0;
  const mean = diffs.reduce((a, b) => a + b, 0) / n;
  const variance = diffs.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  return Math.sqrt(variance / n);
}

// How many sets of dice to measure the free-gem cost over, so the work stays about the same whatever the sample
// size: 8 at 1,000 players, 2 at 5,000, 1 at 10,000. One set is far too few at the small end — with about 13 payers
// in 1,000, two whales crossing a pack boundary move the answer by $200, and on the default banner a single set
// of dice puts the cost anywhere from $5 to $360.
export const freeCostRepeats = (sampleSize) => Math.max(1, Math.min(8, Math.round(8000 / Math.max(1, sampleSize))));

// What the free gems cost in revenue: the same season with nothing given away, against the one that was run.
// Each set of dice gives a paired difference — the same players, the same luck, with and without the giveaway — and
// the answer is the average over `freeCostRepeats` sets, so it is a property of the settings and does not jump when
// the dice are re-rolled. `seCents` is how much of it could still be luck (the measure the suggestions use).
// null when the game gives nothing away.
// This is the honest money figure for a giveaway. Pricing the gems at the shop's rate instead counts currency that
// mostly goes to players who would never have bought any: on the default banner that reads $80,930 against a real
// cost of about $137, and on Honkai Impact 3rd $91,032 against about $262 (1,000 players).
export function freeGemCost(settings, run) {
  if (!(settings.freePerDay > 0 || settings.startGems > 0)) return null;
  const repeats = freeCostRepeats(settings.sampleSize);
  let total = 0;
  let variance = 0; // of the sum over all sets, so the standard error of their mean is sqrt(variance) / repeats
  for (let r = 0; r < repeats; r++) {
    // the first set reuses the season already on screen; the rest get their own dice
    const withFree = r === 0 ? run : simulate({ ...structuredClone(settings), seed: `${settings.seed}#fg${r}` });
    const without = structuredClone(settings);
    without.freePerDay = 0;
    without.startGems = 0;
    if (r > 0) without.seed = `${settings.seed}#fg${r}`;
    const other = simulate(without);
    const N = withFree.ctx.N;
    // Mean and variance of the per-player difference in one pass (Welford), so a million players do not need a
    // million-entry array just to get a standard error out.
    let mean = 0;
    let m2 = 0;
    let sum = 0;
    for (let i = 0; i < N; i++) {
      const d = other.out.spendCents[i] - withFree.out.spendCents[i];
      sum += d;
      const delta = d - mean;
      mean += delta / (i + 1);
      m2 += delta * (d - mean);
    }
    total += sum;
    // the same figure pairedSE gives: sqrt(variance / N), scaled to the whole sample
    variance += N > 1 ? (m2 / (N - 1)) * N : 0;
  }
  return { cents: total / repeats, seCents: Math.sqrt(variance) / repeats, dice: repeats };
}

export function summarize(ctx, out) {
  const byType = TYPES.map((name) => ({
    name,
    players: 0,
    payers: 0,
    gotFeatured: 0,
    gotAnyFive: 0,
    goalMet: 0,
    outOfBudget: 0,
    copies: 0,
    fives: 0,
    pulls: 0,
    spendCents: 0,
    passCents: 0,
    packs: 0,
    maxSpendCents: 0,
    freeGems: 0,
    passGems: 0,
    boughtGems: 0,
    gemsLeft: 0,
    daysPlayed: 0,
  }));
  // A spender is out of budget when what is left of it no longer covers the cheapest pack in the store: they stop
  // buying whatever the banner does next, which is why dearer packs stop raising revenue past a point.
  const cheapestPack = ctx.packs.length ? Math.min(...ctx.packs.map((p) => p.cents)) : Infinity;
  for (let i = 0; i < ctx.N; i++) {
    const t = byType[ctx.typeOf[i]];
    t.players += 1;
    if (out.spendCents[i] > 0) t.payers += 1;
    if (out.budgetCents[i] > 0 && out.budgetCents[i] - (out.spendCents[i] - out.passCents[i]) < cheapestPack) t.outOfBudget += 1;
    if (out.featured[i] > 0) t.gotFeatured += 1;
    if (out.fives[i] > 0) t.gotAnyFive += 1;
    if (out.featured[i] >= out.goal[i]) t.goalMet += 1; // their own goal
    t.copies += out.featured[i];
    t.fives += out.fives[i];
    t.pulls += out.pulls[i];
    t.spendCents += out.spendCents[i];
    t.passCents += out.passCents[i];
    t.packs += out.packs[i];
    if (out.spendCents[i] > t.maxSpendCents) t.maxSpendCents = out.spendCents[i];
    t.freeGems += out.freeGems[i];
    t.passGems += out.passGems[i];
    t.boughtGems += out.boughtGems[i];
    t.gemsLeft += out.gemsLeft[i];
    t.daysPlayed += out.daysPlayed[i];
  }
  const sum = (key) => byType.reduce((acc, t) => acc + t[key], 0);
  const revenueCents = sum('spendCents');
  // What the biggest tenth of payers brings in. This is the figure the published numbers are actually about, and
  // the one to compare against them: GameAnalytics' "whales" are 0.20% of players where only 2.09% pay, so they are
  // the top 9.6% of PAYERS taking 86.6% of revenue, and HoYoverse's filing says the top 10.4% of payers brought
  // 80.1% of top-ups. A player type's share is not comparable: where 9.3% pay, as in the defaults, the 0.2% of
  // players called whales is only the top 2.2% of payers.
  const paid = [];
  for (let i = 0; i < ctx.N; i++) if (out.spendCents[i] > 0) paid.push(out.spendCents[i]);
  paid.sort((a, b) => b - a);
  const topTenth = paid.slice(0, Math.max(1, Math.round(paid.length * 0.1)));
  const topTenthShare = revenueCents ? topTenth.reduce((a, b) => a + b, 0) / revenueCents : 0;
  const freeGems = sum('freeGems');
  // What each row of the store sold, in the order the page lists it. Only a run from `simulate` counts sales, so a
  // caller that assembled its own rows gets an empty list rather than a wrong one.
  const sales = out.packSales;
  const packSales = ctx.s.packs.map((p, k) => ({
    price: p.price,
    gems: Math.round(p.gems),
    count: sales ? sales.count[k] : 0,
    cents: sales ? sales.cents[k] : 0,
  }));
  return {
    byType,
    topTenthShare,
    packSales,
    packSalesCounted: !!sales,
    players: ctx.N,
    payers: sum('payers'),
    revenueCents,
    passRevenueCents: sum('passCents'),
    packRevenueCents: revenueCents - sum('passCents'),
    freeGems,
    passGems: sum('passGems'),
    boughtGems: sum('boughtGems'),
    freeGemsValueCents: ctx.centsPerGem == null ? null : freeGems * ctx.centsPerGem,
    centsPerGem: ctx.centsPerGem,
    pulls: sum('pulls'),
    fives: sum('fives'),
    copies: sum('copies'),
  };
}

// The state of a player's dot on a given day: 0 = no 5★ yet, 1 = has the featured unit,
// 2 = has a 5★ but not the featured one.
export function dotState(out, i, day) {
  const feat = out.firstFeaturedDay[i];
  if (feat && feat <= day) return 1;
  const five = out.first5Day[i];
  if (five && five <= day) return 2;
  return 0;
}
