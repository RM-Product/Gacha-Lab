// Game presets, the defaults, and where every number comes from.
// The research briefs are docs/RESEARCH.md, docs/RESEARCH-OTHER-GAMES.md and docs/research/2026-10-06-*.md.
//   OFFICIAL    the publisher's own text (in-game Details pages, news, App Store listings)
//   WIKI        the publisher's numbers as a game wiki transcribes them
//   REPOST      the publisher's text reposted word for word by a fan site
//   COMMUNITY   measured from large sets of real pulls, or industry telemetry and studies
//   ESTIMATE    guides and surveys
//   GOVERNMENT  court and regulator filings
//
// Each preset can carry two short lines the page shows while it is in use: `rulesNote` under the banner
// rules (what the model approximates) and `storeNote` in Gems and store (whose prices these are, and what
// is an estimate).

// US prices on the App Store; gems include the bonus on repeat purchases. The first purchase of
// each pack gives double instead, once a year, and is left out (as for every preset); `bonus` is kept
// so the listed amount is still on record.
// gems is everything the pack gives; bonus is the part of it on top of the listed amount (330 = 300 + 30).
export const STORE_PACKS = [
  { price: 0.99, gems: 60, bonus: 0 },
  { price: 4.99, gems: 330, bonus: 30 },
  { price: 14.99, gems: 1090, bonus: 110 },
  { price: 29.99, gems: 2240, bonus: 260 },
  { price: 49.99, gems: 3880, bonus: 600 },
  { price: 99.99, gems: 8080, bonus: 1600 },
];

// Blessing of the Welkin Moon / Express Supply Pass / Inter-Knot Membership: the same in all three.
export const MONTHLY_PASS = { price: 4.99, upfront: 300, daily: 90, days: 30 };

// The store most presets share: HoYoverse's US packs and pass, 160 gems a pull, 300 free gems a day played.
// A preset with its own store lists the parts that differ under `store`.
export const GACHA_STORE = { pullCost: 160, freePerDay: 300, packs: STORE_PACKS, pass: MONTHLY_PASS };
// For a game without a monthly pass: all zero, which the engine reads as no pass.
export const NO_PASS = { price: 0, upfront: 0, daily: 0, days: 30 };

// Western games' own stores (docs/research/2026-10-06-western.md). Totals are what each pack gives.
// League RP, the US price table (in effect since 19 Aug 2022; "USA: No change" in 2024). Only totals are
// published, so no bonus split. The $244.99 and $429.99 bundles are left out: no official page lists them.
const LOL_RP_PACKS = [
  { price: 4.99, gems: 575, bonus: 0 },
  { price: 10.99, gems: 1380, bonus: 0 },
  { price: 21.99, gems: 2800, bonus: 0 },
  { price: 34.99, gems: 4500, bonus: 0 },
  { price: 49.99, gems: 6500, bonus: 0 },
  { price: 99.99, gems: 13500, bonus: 0 },
];
// Apex Coins, EA's web store on 6 Oct 2026 (the web-only extra coins left out; only the top bonus is official).
const APEX_COIN_PACKS = [
  { price: 4.99, gems: 500, bonus: 0 },
  { price: 9.99, gems: 1000, bonus: 0 },
  { price: 19.99, gems: 2150, bonus: 150 },
  { price: 39.99, gems: 4350, bonus: 350 },
  { price: 59.99, gems: 6700, bonus: 700 },
  { price: 99.99, gems: 11500, bonus: 1500 },
];
// Fire Emblem Heroes Orbs: amounts from the official 3 Oct 2022 notice, US prices from the App Store (6 Oct 2026; the
// 40-Orb price from the wiki). Docs: docs/research/2026-10-06-anime-b.md.
const FEH_ORB_PACKS = [
  { price: 1.99, gems: 3, bonus: 0 },
  { price: 5.99, gems: 11, bonus: 2 },
  { price: 12.99, gems: 25, bonus: 5 },
  { price: 19.99, gems: 40, bonus: 10 },
  { price: 26.99, gems: 54, bonus: 14 },
  { price: 39.99, gems: 83, bonus: 23 },
  { price: 74.99, gems: 170, bonus: 60 },
];
// Diablo Immortal Eternal Orbs: 1,650 and 7,200 from the US App Store (6 Oct 2026), the rest from a 2022 guide; the
// bonus split assumes 60 orbs a dollar.
const DI_ORB_PACKS = [
  { price: 0.99, gems: 60, bonus: 0 },
  { price: 4.99, gems: 315, bonus: 15 },
  { price: 9.99, gems: 630, bonus: 30 },
  { price: 24.99, gems: 1650, bonus: 150 },
  { price: 49.99, gems: 3450, bonus: 450 },
  { price: 99.99, gems: 7200, bonus: 1200 },
];
// Fate/Grand Order NA Saint Quartz, the six US App Store purchases (6 Oct 2026). The listing gives totals only.
const FGO_SQ_PACKS = [
  { price: 0.99, gems: 1, bonus: 0 },
  { price: 3.99, gems: 5, bonus: 0 },
  { price: 11.99, gems: 18, bonus: 0 },
  { price: 23.99, gems: 41, bonus: 0 },
  { price: 39.99, gems: 76, bonus: 0 },
  { price: 79.99, gems: 167, bonus: 0 },
];

const NO_RADIANCE = { on: false, chance: 0.03, sureAfter: 3 };
const NO_SPARK = { pulls: 0, resetOnFeatured: false };

// Character banners share the soft-pity model: 0.6% to pull 73, +6 points a pull from 74, certain
// at 90. It reproduces the published 1.6% (1.6052%).
const CHARACTER_PITY = { baseRate: 0.006, softPityStart: 74, softPityStep: 0.06, hardPity: 90 };

const HOYO_STORE_NOTE = "HoYoverse's US prices: Genshin Impact, Honkai: Star Rail and Zenless Zone Zero share them.";

// `maxCopies`: the most copies that still make a unit stronger, where that is fewer than the 7 whales chase.
// Weapons, light cones and W-Engines stop at 5 (R5, S5, phase 5).
// `labOnly`: shown only with #lab. Everyone else gets HoYoverse's and League of Legends' banners; the other games
// wait for a check by someone who plays them, then come back one at a time (6 Oct 2026).
export const PRESETS = [
  {
    // Character Event Wish since 5.0: a 50/50 with a guarantee after a loss, plus Capturing Radiance. HoYoverse
    // says Radiance lifts the 50/50 to 55%; the rules it discloses give 54.5% (docs/RESEARCH.md §4).
    id: 'genshin-character',
    group: 'HoYoverse',
    name: 'Genshin Impact: character banner',
    rulesNote: 'With Capturing Radiance the 50/50 comes out at 54.5% here; HoYoverse says 55%.',
    storeNote: HOYO_STORE_NOTE,
    rules: { ...CHARACTER_PITY, featuredChance: 0.5, guarantee: true, radiance: { on: true, chance: 0.03, sureAfter: 3 } },
    published: { rate: 0.016, featuredRate: 0.01103, hardPity: 90, fiftyFifty: '50% official, Radiance aside', withRadiance: '55% official', guarantee: true, measured: "62.31, players' tally of 1.68 billion wishes" },
  },
  {
    // The losing half is drawn from 8 characters that include the featured one, so the 50/50 is really 56.25%.
    id: 'hsr-character',
    group: 'HoYoverse',
    name: 'Honkai: Star Rail: character warp',
    rulesNote: '56.25%: the losing half is drawn from 8 characters that include the featured one.',
    storeNote: HOYO_STORE_NOTE,
    rules: { ...CHARACTER_PITY, featuredChance: 0.5625, guarantee: true, radiance: NO_RADIANCE },
    published: { rate: 0.016, featuredRate: 0.01113, hardPity: 90, fiftyFifty: '56.25% (the official 1.113% implies it)', guarantee: true },
  },
  {
    // A true 50/50 with a guarantee after a loss.
    id: 'zzz-character',
    group: 'HoYoverse',
    name: 'Zenless Zone Zero: exclusive channel',
    storeNote: HOYO_STORE_NOTE,
    rules: { ...CHARACTER_PITY, featuredChance: 0.5, guarantee: true, radiance: NO_RADIANCE },
    published: { rate: 0.016, featuredRate: 0.01067, hardPity: 90, fiftyFifty: '50% official', guarantee: true },
  },
  {
    // Aiming at one weapon with Epitomized Path (1 Fate Point since 5.0): 75% featured split between two weapons,
    // so 37.5% for yours, then certain. The soft-pity model is certain by pull 77 and gives 1.878% overall, against
    // the official 80 and 1.85% (a known gap, docs/RESEARCH.md §3.3).
    id: 'genshin-weapon',
    group: 'HoYoverse',
    name: 'Genshin Impact: weapon banner',
    rulesNote: "37.5%: your weapon's half of the 75% featured share, with Epitomized Path after a miss. The model is certain by pull 77, not 80.",
    storeNote: HOYO_STORE_NOTE,
    rules: { baseRate: 0.007, softPityStart: 63, softPityStep: 0.07, hardPity: 80, featuredChance: 0.375, guarantee: true, radiance: NO_RADIANCE },
    maxCopies: 5,
    published: { rate: 0.0185, featuredRate: null, hardPity: 80, fiftyFifty: '37.5% (75% split between two weapons)', guarantee: true, measured: "54.40, players' tally of 423 million wishes" },
  },
  {
    // 75% featured, and the other 25% is drawn from 8 light cones that include it, so 78.125%.
    id: 'hsr-lightcone',
    group: 'HoYoverse',
    name: 'Honkai: Star Rail: light cone warp',
    rulesNote: '78.125%: the other 25% is drawn from 8 light cones that include the featured one.',
    storeNote: HOYO_STORE_NOTE,
    rules: { baseRate: 0.008, softPityStart: 66, softPityStep: 0.07, hardPity: 80, featuredChance: 0.78125, guarantee: true, radiance: NO_RADIANCE },
    maxCopies: 5,
    published: { rate: 0.0187, featuredRate: 0.01534, hardPity: 80, fiftyFifty: '78.125% (the official 1.534% implies it)', guarantee: true },
  },
  {
    // 1% base, a 75% featured chance and a guarantee after a miss.
    id: 'zzz-wengine',
    group: 'HoYoverse',
    name: 'Zenless Zone Zero: W-Engine channel',
    storeNote: HOYO_STORE_NOTE,
    rules: { baseRate: 0.01, softPityStart: 65, softPityStep: 0.06, hardPity: 80, featuredChance: 0.75, guarantee: true, radiance: NO_RADIANCE },
    maxCopies: 5,
    published: { rate: 0.02, featuredRate: 0.016, hardPity: 80, fiftyFifty: '75% official', guarantee: true },
  },
  {
    // The featured S-rank is the supply's only S-rank, certain by drop 90. HoYoverse publishes 1.50%; the Chinese
    // notice calls the A-rank figure in the same table consolidated, so 1.50% is read as the overall rate and the
    // base is 0.71% a drop with no soft pity (none is published). If 1.5% were the base, an S-rank would take 49.6
    // drops instead of 66.7. Not modelled: the half-price first 10 drops and the weapon supply players also want.
    // SSS is 7 copies (docs/research/2026-10-06-anime-a.md §A.7).
    id: 'hi3-battlesuit',
    group: 'HoYoverse',
    name: 'Honkai Impact 3rd: Battlesuit Supply',
    rulesNote: "1.50% is read as HoYoverse's overall rate, so the base is 0.71% with no soft pity.",
    storeNote: "Honkai Impact 3rd's US Crystal packs, 280 Crystals a drop. The Monthly Card and free Crystals are estimates.",
    rules: { baseRate: 0.0071, softPityStart: 90, softPityStep: 0, hardPity: 90, featuredChance: 1, guarantee: false, radiance: NO_RADIANCE, spark: NO_SPARK },
    store: {
      pullCost: 280,
      freePerDay: 338,
      packs: [
        { price: 0.99, gems: 65, bonus: 0 },
        { price: 4.99, gems: 330, bonus: 0 },
        { price: 9.99, gems: 710, bonus: 50 },
        { price: 19.99, gems: 1430, bonus: 110 },
        { price: 49.99, gems: 3860, bonus: 560 },
        { price: 99.99, gems: 8088, bonus: 1488 },
      ],
      pass: { price: 4.99, upfront: 300, daily: 93, days: 30 },
    },
    published: { rate: 0.015, rateTolerance: 0.0002, hardPity: 90, fiftyFifty: '100% (the only S-rank is the featured one)', guarantee: false },
  },
  // Other games: see docs/RESEARCH-OTHER-GAMES.md and docs/research/2026-10-06-anime-*.md. "5★" stands for each
  // game's top rarity.
  {
    // Featured Resonator Convene. Kuro publishes 0.8% base, 1.8% overall, a 5★ certain by pull 80 and a 50/50 with a
    // guarantee after a loss. The climb is GGanalysis's model: +4 points a pull from 66 and +8 from 71 match 476
    // million tracked pulls; the +10 from 76 is the model's own (tracked pulls run lower there, on small samples).
    // S6 is 7 copies. The store matches HoYoverse's ladder and pass (App Store, 6 Oct 2026).
    id: 'wuwa-character',
    group: 'Other games',
    labOnly: true,
    name: 'Wuthering Waves: featured character',
    rulesNote: 'Tracked pulls confirm the +4 and +8 climb; the +10 from pull 76 is a community model.',
    storeNote: "Wuthering Waves' US Lunite prices and pass match HoYoverse's; its repeat-purchase bonuses and free Astrite are assumed the same.",
    rules: { baseRate: 0.008, softPityStart: 66, softPityStep: 0.04, moreRamps: [{ start: 71, step: 0.08 }, { start: 76, step: 0.1 }], hardPity: 80, featuredChance: 0.5, guarantee: true, radiance: NO_RADIANCE, spark: NO_SPARK },
    published: { rate: 0.018, rateTolerance: 0.0006, hardPity: 80, fiftyFifty: '50% official', guarantee: true },
  },
  {
    // The top rarity is 6★: 2% a pull, and from pull 51 without one the chance rises 2 points a pull until it is
    // certain at 99 (implied by the rule). 70% of 6★s are the two rate-up operators, one limited and one standard,
    // so 35% for the limited one, with no guarantee. Every pull gives a contract; 300 buy the operator. Since
    // 31 Oct 2024 on Global, 300 pulls also give a free copy of the limited operator, once. Whether the
    // contract exchange can repeat within a banner isn't verified; here it does, every 300. Potential 6 is 6 copies.
    // Store (docs/research/2026-10-06-stores.md §1), counted in Orundum: 600 a pull, 180 per Originite Prime. Prices
    // from the US App Store; pack sizes and repeat bonuses from two wikis; the Monthly Card is 6 OP up front and 200
    // Orundum a day for 30 days. Free income: daily and weekly missions, Annihilation and the monthly sign-in permit,
    // about 449 a day, plus about 50 for events (an estimate). The once-a-month $25.99 Headhunting Pack is left out
    // (the engine's packs have no limit).
    id: 'arknights-limited',
    group: 'Other games',
    labOnly: true,
    name: 'Arknights: limited headhunting',
    rulesNote: "35% is the limited operator's half of the 70% rate-up.",
    storeNote: "Arknights' US prices, counted in Orundum: 600 a pull, 180 per Originite Prime. Pack sizes come from wikis, free Orundum is an estimate, and the once-a-month headhunting pack isn't modelled.",
    rules: { baseRate: 0.02, softPityStart: 51, softPityStep: 0.02, hardPity: 99, featuredChance: 0.35, guarantee: false, radiance: NO_RADIANCE, spark: { pulls: 300, resetOnFeatured: false }, freeCopiesAt: [300] },
    store: {
      pullCost: 600,
      freePerDay: 500,
      packs: [
        { price: 0.99, gems: 180, bonus: 0 },
        { price: 4.99, gems: 1260, bonus: 180 },
        { price: 14.99, gems: 4320, bonus: 720 },
        { price: 29.99, gems: 9000, bonus: 1800 },
        { price: 49.99, gems: 16200, bonus: 4320 },
        { price: 99.99, gems: 33300, bonus: 9900 },
      ],
      pass: { price: 4.99, upfront: 1080, daily: 200, days: 30 },
    },
    maxCopies: 6,
    published: { rate: null, hardPity: 99, hardPityLabel: 'implied', fiftyFifty: '35% (70% split between two)', guarantee: false },
  },
  {
    // 1% for a 5★ Servant and 0.8% for the featured one (the in-game tables, via the wiki), with no pity on luck
    // alone. The featured Servant is guaranteed within 330 summons, and the count starts again every time you get
    // it (NA since 4 Jul 2026). A summon is 3 Saint Quartz; an 11-summon costs 30 (2.73 a summon), not modelled.
    // FGO NA sells no monthly pass. Free Saint Quartz is an estimate: the weekly log-in and Master Missions give
    // about 24 a month, and events and story add more. NP5 is 5 copies.
    id: 'fgo-pickup',
    group: 'Other games',
    labOnly: true,
    name: 'Fate/Grand Order: limited pickup (NA)',
    rulesNote: "These are NA's rules since July 2026.",
    storeNote: "US Saint Quartz packs, 3 a summon (an 11-summon for 30 isn't modelled); no monthly pass. Free Saint Quartz is an estimate.",
    rules: { baseRate: 0.01, softPityStart: 999, softPityStep: 0, hardPity: 999, featuredChance: 0.8, guarantee: false, radiance: NO_RADIANCE, spark: { pulls: 330, resetOnFeatured: true } },
    store: { pullCost: 3, freePerDay: 3, packs: FGO_SQ_PACKS, pass: NO_PASS },
    maxCopies: 5,
    published: { rate: 0.01, rateLabel: 'in-game table, via wiki', hardPity: null, fiftyFifty: '80% (0.8% of 1%)', guarantee: false },
  },
  {
    // The top rarity is 3★: 3% a pull, 0.7% for the featured student, and no pity. After 200 pulls you can trade
    // them for the featured student. The newer system live in Japan since July 2026 is due on Global in late 2026.
    // Store (stores brief §2): 120 Pyroxene a pull. Pack contents from the game's own tables, prices from the US App
    // Store ($18.99 and $31.99 from 2022–23 copies of it; the 660 pack is left out, its price not found). The pass is the
    // $6.99 Monthly Pyroxene Pack: 392 up front, 40 a day for 30 days. Free income is a guide's middle estimate. The
    // "Monthly Pyroxene x6,600" ($64.99, five a month, $1.18 a pull) is left out: the engine's packs have no limit.
    id: 'bluearchive-pickup',
    group: 'Other games',
    labOnly: true,
    name: 'Blue Archive: pick-up recruitment (Global)',
    rulesNote: "Japan's newer system, due on Global in late 2026, isn't modelled.",
    storeNote: "Blue Archive's US prices, 120 Pyroxene a pull. Its $64.99 deal, sold five times a month, isn't modelled, so whales and dolphins pay about 15–35% more a pull here than in the game. Free Pyroxene is an estimate.",
    rules: { baseRate: 0.03, softPityStart: 999, softPityStep: 0, hardPity: 999, featuredChance: 0.7 / 3, guarantee: false, radiance: NO_RADIANCE, spark: { pulls: 200, resetOnFeatured: false } },
    store: {
      pullCost: 120,
      freePerDay: 175,
      packs: [
        { price: 0.99, gems: 60, bonus: 0 },
        { price: 2.99, gems: 179, bonus: 3 },
        { price: 6.99, gems: 420, bonus: 28 },
        { price: 18.99, gems: 1350, bonus: 174 },
        { price: 31.99, gems: 2300, bonus: 340 },
        { price: 64.99, gems: 4800, bonus: 800 },
      ],
      pass: { price: 6.99, upfront: 392, daily: 40, days: 30 },
    },
    published: { rate: 0.03, hardPity: null, fiftyFifty: '23.3% (0.7% of 3%)', guarantee: false },
  },
  {
    // The top rarity is 3★: 3% a pull and 0.75% for the spotlight trainee, from datamined odds. After 200 pulls you
    // can trade for them; that number comes from player guides.
    // Store (stores brief §3): 150 Carats a scout. Four packs on the US App Store, no repeat bonus seen (5,000 for $69.99
    // costs more than two 2,500 packs; unexplained). The pass is the $6.99 Daily Carat Pack, 500 up front and 50 a day
    // for 30 days (from guides). Free income is a guide's middle estimate. Anniversary-only Carat sales are left out.
    id: 'umamusume-scout',
    group: 'Other games',
    labOnly: true,
    name: 'Umamusume: spotlight scout (Global)',
    rulesNote: '3% and 0.75% are datamined odds; the 200-pull exchange comes from player guides.',
    storeNote: "Umamusume's US Carat packs, 150 a scout. The Daily Carat Pack's contents come from guides, and free Carats are an estimate. The $69.99 pack costs more than two $33.99 packs for the same Carats, so spenders here skip it.",
    rules: { baseRate: 0.03, softPityStart: 999, softPityStep: 0, hardPity: 999, featuredChance: 0.25, guarantee: false, radiance: NO_RADIANCE, spark: { pulls: 200, resetOnFeatured: false } },
    store: {
      pullCost: 150,
      freePerDay: 175,
      packs: [
        { price: 9.99, gems: 700, bonus: 0 },
        { price: 20.99, gems: 1500, bonus: 0 },
        { price: 33.99, gems: 2500, bonus: 0 },
        { price: 69.99, gems: 5000, bonus: 0 },
      ],
      pass: { price: 6.99, upfront: 500, daily: 50, days: 30 },
    },
    published: { rate: 0.03, rateLabel: 'datamined', hardPity: null, fiftyFifty: '25% (0.75% of 3%, datamined)', guarantee: false },
  },
  {
    // The top rarity is SSR: 4% a pull, and half of those are the featured Nikke (2%); a few banners give her 1%.
    // 200 Gold Mileage tickets trade for her; one ticket a pull comes from a fan site. In the game unused tickets
    // carry over to later banners, which isn't modelled.
    // Store (stores brief §4): 300 Gems a pull. Gem amounts from the official patch notes, US prices from 2022–23 copies
    // of the App Store page (no repeat bonus in any official text). The 30-Day Supply gives 3,300 Gems in all (a
    // guide); 300 up front and 100 a day is our split. Free income is a guide's middle estimate.
    id: 'nikke-recruit',
    group: 'Other games',
    labOnly: true,
    name: 'NIKKE: special recruit',
    rulesNote: 'Assumes a Gold Mileage ticket a pull; in the game unused tickets carry over to later banners.',
    storeNote: "NIKKE's US Gem packs (prices from 2022–23 App Store copies), 300 a pull. The 30-Day Supply's split and free Gems are estimates.",
    rules: { baseRate: 0.04, softPityStart: 999, softPityStep: 0, hardPity: 999, featuredChance: 0.5, guarantee: false, radiance: NO_RADIANCE, spark: { pulls: 200, resetOnFeatured: false } },
    store: {
      pullCost: 300,
      freePerDay: 390,
      packs: [
        { price: 4.99, gems: 320, bonus: 0 },
        { price: 9.99, gems: 720, bonus: 0 },
        { price: 19.99, gems: 1500, bonus: 0 },
        { price: 29.99, gems: 2300, bonus: 0 },
        { price: 54.99, gems: 4200, bonus: 0 },
        { price: 79.99, gems: 6200, bonus: 0 },
      ],
      pass: { price: 4.99, upfront: 300, daily: 100, days: 30 },
    },
    published: { rate: 0.04, hardPity: null, fiftyFifty: '50% (2% of 4%)', guarantee: false },
  },
  {
    // The top rarity is 6★: 1.5% a pull. After 60 pulls without one the chance goes to 4% and rises 2.5 points a
    // pull, certain at pull 70; Bluepoch publishes this. A 50/50 with a guarantee after a loss. A summon is 180
    // Clear Drops (paid Crystal Drops turn into them one for one). Store (stores brief §6): four of the six prices from
    // the US App Store (today and Oct–Nov 2023 copies), the ladder and repeat bonuses from two wikis (2023); the pass is
    // Roaring Month, 300 up front and 90 a day for 30 days. Free income counts events from one player's tally (Nov 2024);
    // a guide gives less than half. Portray 5 is 6 copies.
    id: 'r1999-limited',
    group: 'Other games',
    labOnly: true,
    name: 'Reverse: 1999: limited character',
    storeNote: "Reverse: 1999's US packs, 180 Clear Drops a summon. Free Clear Drops are an estimate from one player's tally; a guide gives less than half.",
    rules: { baseRate: 0.015, softPityStart: 61, softPityStep: 0.025, hardPity: 70, featuredChance: 0.5, guarantee: true, radiance: NO_RADIANCE, spark: NO_SPARK },
    store: {
      pullCost: 180,
      freePerDay: 460,
      packs: [
        { price: 0.99, gems: 60, bonus: 0 },
        { price: 4.99, gems: 330, bonus: 30 },
        { price: 14.99, gems: 1130, bonus: 150 },
        { price: 29.99, gems: 2380, bonus: 400 },
        { price: 49.99, gems: 4080, bonus: 800 },
        { price: 99.99, gems: 8380, bonus: 1900 },
      ],
      pass: { price: 4.99, upfront: 300, daily: 90, days: 30 },
    },
    maxCopies: 6,
    published: { rate: 0.0236, hardPity: 70, fiftyFifty: '50%', guarantee: true },
  },
  {
    // The limited hero is the banner's only 5★ hero: 1% a summon, and the 121st summon is guaranteed (the count
    // resets when you get the hero). The Total Summon Count Reward gives the hero free at 170 and 200 summons
    // (since 19 Feb 2026); the bookmark refunds at 80 and 110 summons and the Unknown Slate at 250 are left out.
    // Epic Seven's Skystone prices couldn't be verified, so it uses the shared store; free income is about 2,700
    // Skystones a month, about 0.95 summons a day (an estimate), so 150 here. SSS imprint is 5 copies.
    id: 'e7-limited',
    group: 'Other games',
    labOnly: true,
    name: 'Epic Seven: limited Drop Rate Up',
    rulesNote: "The bookmark refunds at 80 and 110 summons aren't modelled.",
    storeNote: "HoYoverse's US prices stand in: Epic Seven's couldn't be verified (a summon there costs 95 Skystones). Free income, about a summon a day, is an estimate.",
    rules: { baseRate: 0.01, softPityStart: 121, softPityStep: 0, hardPity: 121, featuredChance: 1, guarantee: false, radiance: NO_RADIANCE, spark: NO_SPARK, freeCopiesAt: [170, 200] },
    store: { freePerDay: 150 },
    maxCopies: 5,
    published: { rate: null, hardPity: 121, fiftyFifty: '100% (the limited hero is the only 5★ hero)', guarantee: false },
  },
  {
    // 6% a summon for a 5★ (3% focus, 3% other), rising 0.5 points every 5 summons without one (spread as 0.1 a
    // summon from the 4th); after 120 without one the next is certain (121 here). Your hero is one of four focus
    // heroes, 12.5% of 5★s; 14.5% stands in for Focus Charge, which the model can't run, and keeps each later copy
    // within about 2% of the exact rules (docs/research/2026-10-06-anime-b.md §2.10). 40 summons earn a free focus
    // hero of your choice, once. Duplicates merge up to +10, so 11 copies are useful. A summon averages 4 Orbs (a
    // session of five costs 20). Not modelled: sessions, colour choice, and the smaller drop after an off-focus 5★.
    id: 'feh-new-heroes',
    group: 'Other games',
    labOnly: true,
    name: 'Fire Emblem Heroes: New Heroes, one focus hero',
    rulesNote: "14.5% is your hero's official 12.5%, raised to stand in for Focus Charge.",
    storeNote: "Fire Emblem Heroes' US Orb packs at 4 Orbs a summon (a full session of five). The Feh Pass gives 10 Orbs a month; free Orbs are an estimate.",
    rules: { baseRate: 0.06, softPityStart: 4, softPityStep: 0.001, hardPity: 121, featuredChance: 0.145, guarantee: false, radiance: NO_RADIANCE, spark: NO_SPARK, freeCopiesAt: [40] },
    store: { pullCost: 4, freePerDay: 8, packs: FEH_ORB_PACKS, pass: { price: 9.49, upfront: 10, daily: 0, days: 30 } },
    maxCopies: 11,
    published: { rate: null, hardPity: 121, hardPityLabel: 'stands in for 120, then a certain session', fiftyFifty: '12.5% official (one of four focus heroes)', guarantee: false },
  },
  {
    // The featured S-rank is the only one in the pool: 0.5% a pull, certain by the 60th. Kuro publishes 0.50% and
    // 1.90% overall for the standard Member Target pool; the wiki gives the Themed pool the same numbers and the
    // 60-pull pity. 0.5% with pity at 60 gives 1.925%, which doesn't round to 1.90%: unresolved (pity on the 61st
    // pull would give 1.898%). One pull is 250 tickets, bought one for one with Black Cards. Not modelled: the
    // ticket refunds in the event pool and this version's free copy from the story. SSS+ is 11 copies.
    id: 'pgr-themed',
    group: 'Other games',
    labOnly: true,
    name: 'Punishing: Gray Raven: Themed Construct',
    rulesNote: "The Themed pool's 0.5% and 60-pull pity come from the wiki.",
    storeNote: "Punishing: Gray Raven's US packs, as Black Cards at 250 a pull. The pass and free income are estimates.",
    rules: { baseRate: 0.005, softPityStart: 60, softPityStep: 0, hardPity: 60, featuredChance: 1, guarantee: false, radiance: NO_RADIANCE, spark: NO_SPARK },
    store: {
      pullCost: 250,
      freePerDay: 300,
      packs: [
        { price: 0.99, gems: 50, bonus: 0 },
        { price: 4.99, gems: 280, bonus: 0 },
        { price: 5.99, gems: 340, bonus: 0 },
        { price: 9.99, gems: 590, bonus: 0 },
        { price: 11.99, gems: 710, bonus: 0 },
        { price: 19.99, gems: 1190, bonus: 0 },
        { price: 49.99, gems: 2990, bonus: 0 },
        { price: 99.99, gems: 6000, bonus: 0 },
      ],
      pass: { price: 4.99, upfront: 330, daily: 100, days: 30 },
    },
    published: { rate: 0.019, rateTolerance: 0.0003, rateLabel: 'official, standard pool', hardPity: 60, hardPityLabel: 'wiki', fiftyFifty: '100% (the only S-rank in the pool)', guarantee: false },
  },
  {
    // A one-memory limited wish: 1% a wish for a 5★ memory, 11% from wish 61 and 10 points more each wish, certain by
    // 70; a 50/50 with a guarantee after a loss; 2.1% overall. All as the wiki transcribes the in-game text. One wish
    // is 150 Diamonds. Pack amounts come from reseller listings (the App Store names its packs without amounts); the
    // pass and free income are estimates. Rank 3 is 4 copies.
    id: 'lads-limited',
    group: 'Other games',
    labOnly: true,
    name: 'Love and Deepspace: limited wish, one memory',
    rulesNote: 'Rules as the wiki transcribes the in-game text.',
    storeNote: 'Pack amounts come from reseller listings, not the App Store, at 150 Diamonds a wish. The pass and free Diamonds are estimates.',
    rules: { baseRate: 0.01, softPityStart: 61, softPityStep: 0.1, hardPity: 70, featuredChance: 0.5, guarantee: true, radiance: NO_RADIANCE, spark: NO_SPARK },
    store: {
      pullCost: 150,
      freePerDay: 100,
      packs: [
        { price: 0.99, gems: 60, bonus: 0 },
        { price: 4.99, gems: 330, bonus: 30 },
        { price: 6.99, gems: 540, bonus: 90 },
        { price: 14.99, gems: 1130, bonus: 150 },
        { price: 29.99, gems: 2340, bonus: 360 },
        { price: 49.99, gems: 4000, bonus: 720 },
        { price: 99.99, gems: 8080, bonus: 1600 },
      ],
      pass: { price: 4.99, upfront: 300, daily: 100, days: 30 },
    },
    maxCopies: 4,
    published: { rate: 0.021, rateTolerance: 0.0005, rateLabel: 'wiki', hardPity: 70, hardPityLabel: 'wiki', fiftyFifty: '50% (wiki)', guarantee: true, guaranteeLabel: 'wiki' },
  },
  {
    // One Ancient Spark (400 RP) is one draw. The Exalted skin is 0.5% a draw and certain by the 80th; League's
    // developers put the effective rate at 1.5%. One Exalted skin per banner and no duplicates, so everyone stops
    // at one. No free RP and no monthly pass. Progress toward the 80th carries over to the next Exalted banner in
    // the game; here every season starts at zero.
    id: 'lol-exalted',
    group: 'Western games',
    name: 'League of Legends: Sanctum, Exalted skin',
    rulesNote: 'In the game, progress toward the 80th draw carries over between banners; not here.',
    storeNote: "League of Legends' US RP prices, 400 RP a draw. No free RP and no monthly pass.",
    rules: { baseRate: 0.005, softPityStart: 80, softPityStep: 0, hardPity: 80, featuredChance: 1, guarantee: false, radiance: NO_RADIANCE, spark: NO_SPARK },
    extraCopies: false,
    store: { pullCost: 400, freePerDay: 0, packs: LOL_RP_PACKS, pass: NO_PASS },
    published: { rate: 0.015, rateTolerance: 0.0005, rateLabel: 'effective, official', hardPity: 80, fiftyFifty: '100% (one Exalted skin per banner)', guarantee: false },
  },
  {
    // The same draws as the Exalted banner with its own counter: 0.5% a draw, certain by the 40th. No duplicates,
    // no free RP, no monthly pass. Progress carries over within the banner type in the game; not here.
    id: 'lol-mythic-variant',
    group: 'Western games',
    name: 'League of Legends: Sanctum, Mythic Variant',
    rulesNote: 'In the game, progress toward the 40th draw carries over between banners; not here.',
    storeNote: "League of Legends' US RP prices, 400 RP a draw. No free RP and no monthly pass.",
    rules: { baseRate: 0.005, softPityStart: 40, softPityStep: 0, hardPity: 40, featuredChance: 1, guarantee: false, radiance: NO_RADIANCE, spark: NO_SPARK },
    extraCopies: false,
    store: { pullCost: 400, freePerDay: 0, packs: LOL_RP_PACKS, pass: NO_PASS },
    published: { rate: null, hardPity: 40, fiftyFifty: '100% (one Mythic Variant per banner)', guarantee: false },
  },
  {
    // Each Apex Pack (100 Apex Coins) has a 0.045% chance of 150 heirloom shards, enough for the heirloom of your
    // choice, and shards are certain within 500 packs. Duplicates are impossible, so a copy here is another
    // heirloom. The pass stands in for the $9.99 Ultimate Battle Pass over a 45-day split (8 packs up front, the
    // paid track's 1,100 coins and 7 packs spread over the days); the free income counts only the free track.
    id: 'apex-heirloom',
    group: 'Western games',
    labOnly: true,
    name: 'Apex Legends: Apex Packs for heirloom shards',
    rulesNote: '150 shards buy any heirloom you choose, so each copy here is another heirloom.',
    storeNote: "EA's US Apex Coin prices, 100 coins a pack. The pass stands in for the $9.99 Ultimate Battle Pass; it and the free coins are approximate.",
    rules: { baseRate: 0.00045, softPityStart: 500, softPityStep: 0, hardPity: 500, featuredChance: 1, guarantee: false, radiance: NO_RADIANCE, spark: NO_SPARK },
    extraCopies: true,
    store: { pullCost: 100, freePerDay: 20, packs: APEX_COIN_PACKS, pass: { price: 9.99, upfront: 800, daily: 40, days: 45 } },
    published: { rate: null, hardPity: 500, fiftyFifty: '100% (150 shards buy the heirloom you choose)', guarantee: false },
  },
  {
    // Each Eternal Legendary Crest (160 Eternal Orbs) gives a legendary gem: 4.5% a 5★, certain on the 50th crest
    // without one. In the featured pool (17 Sep to 17 Dec 2026) half of 5★s are the featured gem, with no guarantee
    // after a miss. Copies rank a gem up, so players want many. The game keeps separate counters for earned and
    // bought crests; the model has one. The Boon of Plenty pass and the free crest income are estimates.
    id: 'di-featured-gem',
    group: 'Western games',
    labOnly: true,
    name: 'Diablo Immortal: Legendary Crests, featured 5★ gem',
    rulesNote: 'Featured pool until 17 Dec 2026. Earned and bought crests share one pity here; the game keeps two.',
    storeNote: "Diablo Immortal's US Eternal Orb prices (three from a 2022 guide), 160 a crest. The Boon of Plenty pass and free crests are estimates.",
    rules: { baseRate: 0.045, softPityStart: 50, softPityStep: 0, hardPity: 50, featuredChance: 0.5, guarantee: false, radiance: NO_RADIANCE, spark: NO_SPARK },
    extraCopies: true,
    store: { pullCost: 160, freePerDay: 31, packs: DI_ORB_PACKS, pass: { price: 9.99, upfront: 300, daily: 37, days: 30 } },
    published: { rate: null, hardPity: 50, hardPityLabel: 'wiki', fiftyFifty: '50% official (featured pool), no guarantee', guarantee: false },
  },
  {
    id: 'custom',
    name: 'Custom rules',
    storeNote: HOYO_STORE_NOTE,
    rules: null,
    published: null,
  },
];

export const presetById = (id) => PRESETS.find((p) => p.id === id) || PRESETS[PRESETS.length - 1];

// The presets the page offers: all of them in the lab, the others only outside it.
export const presetsFor = (lab) => PRESETS.filter((p) => lab || !p.labOnly);

// Outside the lab, settings still carrying a lab-only game (its rules, its store, or both, from a save or from
// leaving #lab) go back to Custom rules, as if Custom had been picked, so no hidden game shows. True if they did.
export function dropLabOnly(s) {
  if (![s.preset, s.rulesFrom, s.storeFrom].some((id) => id && presetById(id).labOnly)) return false;
  Object.assign(s, { preset: 'custom', rulesFrom: 'custom' }, presetSettings('custom'));
  return true;
}

// Everything choosing a preset sets: its rules (Custom: the default rules), its store (its own, or the shared
// gacha store), whether extra copies matter (yes unless the preset says otherwise) and how many are useful.
// `storeFrom` remembers whose store this is, for the store note. The page applies this.
export function presetSettings(id) {
  const p = presetById(id);
  const store = { ...GACHA_STORE, ...(p.store || {}) };
  return {
    rules: structuredClone(p.rules || DEFAULT_SETTINGS.rules),
    pullCost: store.pullCost,
    freePerDay: store.freePerDay,
    packs: structuredClone(store.packs),
    pass: structuredClone(store.pass),
    extraCopies: p.extraCopies ?? true,
    maxCopies: p.maxCopies ?? null,
    storeFrom: p.id,
  };
}

// Whether the store in `s` is still exactly the one `presetSettings(id)` set.
export function storeMatches(s, id) {
  const p = presetSettings(id);
  return s.pullCost === p.pullCost && s.freePerDay === p.freePerDay && JSON.stringify(s.packs) === JSON.stringify(p.packs) && JSON.stringify(s.pass) === JSON.stringify(p.pass);
}

export function rulesMatch(a, b) {
  if (!a || !b) return false;
  const keys = ['baseRate', 'softPityStart', 'softPityStep', 'hardPity', 'featuredChance', 'guarantee'];
  if (keys.some((k) => Math.abs(Number(a[k]) - Number(b[k])) > 1e-9)) return false;
  const ma = JSON.stringify(a.moreRamps || []);
  const mb = JSON.stringify(b.moreRamps || []);
  if (ma !== mb) return false;
  if (JSON.stringify(a.freeCopiesAt || []) !== JSON.stringify(b.freeCopiesAt || [])) return false;
  const sa = a.spark || NO_SPARK;
  const sb = b.spark || NO_SPARK;
  if ((sa.pulls || 0) !== (sb.pulls || 0) || (!!sa.resetOnFeatured && sa.pulls > 0) !== (!!sb.resetOnFeatured && sb.pulls > 0)) return false;
  const ra = a.radiance || NO_RADIANCE;
  const rb = b.radiance || NO_RADIANCE;
  if (!!ra.on !== !!rb.on) return false;
  return !ra.on || (Math.abs(ra.chance - rb.chance) < 1e-9 && ra.sureAfter === rb.sureAfter);
}

export const DEFAULT_SETTINGS = {
  // Custom rules by default (decided 5 Oct 2026): the HoYoverse standard most banners start from (0.6% base, soft
  // pity from pull 74 at +6 a pull, certain at 90, a 50/50 with a guarantee), without Genshin's Capturing Radiance
  // and with no spark. These happen to be Zenless Zone Zero's rules too.
  preset: 'custom',
  seed: 'gacha-lab',
  sampleSize: 1000,
  // 30 days by default (decided 5 Oct 2026). One Genshin Impact version is 42: 7.0 went live 12 Aug 2026, 7.1 on 23 Sep.
  days: 30,
  rules: structuredClone({ ...CHARACTER_PITY, featuredChance: 0.5, guarantee: true, radiance: NO_RADIANCE }),
  pullCost: GACHA_STORE.pullCost,
  // 300 a day is about 79 pulls a version for a player who logs in daily. Guides put Genshin at
  // 70 to 95 (range 50 to 107); the recurring sources alone give about 47. A fifth needs a log-in on the day, the rest
  // a log-in that week (engine.js DAILY_SHARE).
  freePerDay: GACHA_STORE.freePerDay,
  startGems: 0,
  // How often free players log in, on average: 35% of days, in light, middle and heavy bands (engine.js LOGIN_BANDS).
  // For everyone active in a month the average is daily ÷ monthly players, which market data puts at about 0.35 for
  // established gacha games in Korea (median of 84 game-months, 2024–25), about 0.43 for Japan's top earners and
  // 0.46–0.55 for HoYoverse's games in China (docs/research/2026-10-06-logins.md): about 0.40 in the middle. Paying
  // players (9.3%) log in daily here, so free players take the brief's correction, (0.40 − 0.093) ÷ 0.907 ≈ 0.34,
  // rounded to 0.35: everyone then averages about 41%. It was 70% until 6 Oct 2026.
  loginRate: 0.35,
  // Players pull for extra copies of the featured unit, as most gacha games make a unit stronger with each.
  // Off is for games where duplicates don't matter: everyone stops at their first copy.
  extraCopies: true,
  // No cap on copies beyond each type's goal; a game preset can set one (Fate/Grand Order: 5).
  maxCopies: null,
  // Which preset the rules and the store came from, so "Start from" and the store note stay honest after edits.
  rulesFrom: 'custom',
  storeFrom: 'custom',
  packs: structuredClone(GACHA_STORE.packs),
  pass: structuredClone(GACHA_STORE.pass),
  // Who pays, and how much, a season (docs/research/2026-10-06-spending.md). The anchor is the only per-player spending
  // a gacha publisher has published: miHoYo's 2017 IPO filing, for Honkai Impact 3rd (Jan–Jun 2017, mostly China).
  // - Whales 0.2% of players (five cross-game studies put them at 0.13% to 0.23%; GameAnalytics 2015 0.20%).
  //   Each chases 2 things a season, up to 7 copies of each, within a budget of $1,500 (each whale's own limit is
  //   half to one and a half times it): about $1,038 each. A season is rarely one unit and nor is a banner —
  //   Genshin and Honkai run featured characters alongside their weapon banners, League's Sanctum has the skin,
  //   its border and the mythic essence — and the filing's own figure covers a player's whole month.
  //   On GameAnalytics against the filing: they look like they disagree and do not. GameAnalytics' whales are
  //   0.20% of players where only 2.09% pay at all, so they are the top 9.6% OF PAYERS, taking 86.6% of revenue;
  //   the filing says the top 10.4% of payers brought 80.1% of top-ups. Both say about the top tenth of payers
  //   brings 80-87%, and the model lands at 83%. What they do not say is that any 0.2% slice of PLAYERS dominates:
  //   where 9.3% pay, as here, 0.2% of players is only the top 2.2% of payers.
  // - Dolphins 1.1%: the filing's next band (¥3,000–10,000 in six months) is 1.1% of monthly players at about $166 a
  //   month in 2025 dollars; Japan's 2022 survey of payers has its ¥10,000–30,000 band near $152. Each wants 1 copy,
  //   within a budget of $400: about $137 each.
  // - Pass buyers 8%: in the filing 10–14% of monthly players paid in a regular month (12.5% on average, Jan–Jun
  //   2017), most of them small amounts, so 9.3% pay in all. (The all-genre studies give 1.35–2.3%; for gacha the
  //   filing is the better source.)
  // The defaults are fitted to every figure the research gives (docs/research/2026-10-06-spending.md): $43 a paying
  // player against the filing's $35-64 in 2025 dollars, $3.98 a player against its $3-15, the top 10.4% of payers
  // bringing 83% against 80-87%, whales $1,038 each against $600-1,100, dolphins $137 against $130-200 (as
  // test/engine.test.js measures them, 23 Oct 2026). Spending follows the banner (engine.js runPlayer): most whales and dolphins reach their goal and
  // stop, so harsher rules cost them more and kinder ones less. Payers pace their buying over the banner's run, each
  // day funding about what is left divided by the days left (a flat one-top-up-a-day rule came first and capped heavy
  // spenders), so buying is spread across the season and the gems given out daily stand in for a purchase; until 19 Oct 2026 everyone bought
  // everything on day 1 and those settings moved revenue by about nothing. Until 7 Oct 2026 budgets were $750 and $150 with goals
  // of 7 and 2 copies, which nobody could afford, so everyone spent their whole budget and revenue never moved; until
  // 6 Oct 2026 whales were $2,000, dolphins 0.9% and pass buyers 2%, then 1%. One band of the filing has no type
  // here: about 2.7% of players paying around $40 a month. Budgets are per season.
  types: {
    whale: { share: 0.002, pass: true, budget: 1500, goal: 7, chases: 2 },
    dolphin: { share: 0.011, pass: true, budget: 400, goal: 1, chases: 1 },
    pass: { share: 0.08, pass: true, budget: 0, goal: 1, chases: 1 },
    free: { share: 0, pass: false, budget: 0, goal: 1, chases: 1 },
  },
};

export const SOURCES = [
  {
    kind: 'OFFICIAL',
    title: 'miHoYo draft IPO prospectus, filed with the China Securities Regulatory Commission (19 Dec 2017)',
    url: 'https://www.csrc.gov.cn/csrc/c101803/c1006201/1006201/files/%E4%B8%8A%E6%B5%B7%E7%B1%B3%E5%93%88%E6%B8%B8%E7%BD%91%E7%BB%9C%E7%A7%91%E6%8A%80%E8%82%A1%E4%BB%BD%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8%E9%A6%96%E6%AC%A1%E5%85%AC%E5%BC%80%E5%8F%91%E8%A1%8C%E8%82%A1%E7%A5%A8%E6%8B%9B%E8%82%A1%E8%AF%B4%E6%98%8E%E4%B9%A6%EF%BC%88%E7%94%B3%E6%8A%A5%E7%A8%BF2017%E5%B9%B412%E6%9C%8819%E6%97%A5%E6%8A%A5%E9%80%81%EF%BC%89.pdf',
    supports: 'The only per-player spending a gacha publisher has published: miHoYo, now HoYoverse. Honkai Impact 3rd, Jan–Jun 2017 (mostly China): 10–14% of monthly players paid in a regular month (12.5% on average), about ¥272 per payer; the top 0.2% of players about ¥3,900 a month ($750 in 2025 dollars) and the next 1.1% about $166. The basis for whales, dolphins and pass buyers.',
  },
  {
    kind: 'GOVERNMENT',
    title: "Japan's Consumer Affairs Agency: survey of online-game payers (Mar 2022)",
    url: 'https://www.caa.go.jp/policies/policy/consumer_policy/caution/internet/assets/consumer_policy_cms106_220630_09.pdf',
    supports: 'Payers average about ¥5,200–5,500 a month (about $40), in line with the filing; 10.9% of payers spend ¥10,000 or more a month.',
    more: [['National random sample, past 30 days (Ministry of Health grant, 2025 survey)', 'https://www.ncasa-japan.jp/pdf/document114.pdf']],
  },
  {
    kind: 'ESTIMATE',
    title: 'Daily ÷ monthly players for gacha games: Mobile Index (Korea, via thisisgame), Sensor Tower Japan, QuestMobile (China)',
    url: 'https://www.thisisgame.com/articles/211866',
    supports: 'Established gacha games in Korea have about 0.35 of their monthly players on a given day (median of 84 game-months, 2024–25); Japan\'s top earners are used on about 13 days a month; HoYoverse\'s games in China 0.46–0.55. About 0.40 in the middle: with paying players logging in daily, free players log in on 35% of days.',
    more: [['Sensor Tower Japan', 'https://sensortower.com/ja/blog/fgo-9th-anniversary'], ['QuestMobile 2025 game report', 'https://www.questmobile.com.cn/research/report/1980474117065904130']],
  },
  {
    kind: 'COMMUNITY',
    title: "How often players log in: CyberAgent's own logs from a gacha card game (IPSJ, 2014) and App Ape's panel of 175 Japanese game apps (2019)",
    url: 'https://ipsj.ixsq.nii.ac.jp/records/102979',
    supports: 'Many near-daily players, many who come on a few days, few in between: the light, middle and heavy bands. CyberAgent: log-in days a week with quartiles of 1, 3 and 7. App Ape (a panel estimate): the stickiest apps\' users 36% light, 16% middle, 48% heavy.',
    more: [['App Ape (archived)', 'https://web.archive.org/web/20200401233823id_/https://lab.appa.pe/2020-03/mobile-game-apps-cluster-analytics.html']],
  },
  {
    kind: 'OFFICIAL',
    title: 'Arknights on the US App Store, with the store tables from arknights.wiki.gg',
    url: 'https://apps.apple.com/us/app/arknights/id1464872022',
    supports: 'Six Originite Prime packs from $0.99 to $99.99 and the $4.99 Monthly Card (prices); pack sizes, repeat bonuses, the card\'s 6 OP and 200 Orundum a day, and the daily, weekly and Annihilation Orundum from the wiki.',
    more: [['Originium Store (wiki)', 'https://arknights.wiki.gg/wiki/Originium_Store'], ['Packs Store (wiki)', 'https://arknights.wiki.gg/wiki/Packs_Store'], ['Orundum (wiki)', 'https://arknights.wiki.gg/wiki/Orundum']],
  },
  {
    kind: 'OFFICIAL',
    title: "Blue Archive on the US App Store, with the game's own shop tables (extracted by players)",
    url: 'https://apps.apple.com/us/app/blue-archive/id1571873795',
    supports: 'Pyroxene packs and the $6.99 Monthly Pyroxene Pack (392 up front, 40 a day); pack contents from the Global client\'s tables; the $18.99 and $31.99 prices from 2022–23 copies of the App Store page.',
    more: [['Game data (ba-data)', 'https://github.com/electricgoat/ba-data']],
  },
  {
    kind: 'OFFICIAL',
    title: 'Umamusume: Pretty Derby on the US App Store',
    url: 'https://apps.apple.com/us/app/umamusume-pretty-derby/id6480433538',
    supports: 'Carat packs of 700, 1,500, 2,500 and 5,000 from $9.99 to $69.99 and the $6.99 Daily Carat Pack; its 500 up front and 50 a day come from guides, and free Carats from a guide\'s estimate.',
    more: [['Cash shop guide', 'https://deltiasgaming.com/?p=279310'], ['Free income estimate', 'https://gachapulls.com/umamusume-pulls-per-month']],
  },
  {
    kind: 'REPOST',
    title: 'NIKKE Gem tiers (official patch notes, reposted by nikke.gg) and 2022 copies of the US App Store page',
    url: 'https://nikke.gg/december-30-update-patch-notes/',
    supports: 'Gem tiers of 320 to 6,200; US prices from $4.99 to $79.99 on the App Store in 2022–23; the 30-Day Supply\'s 3,300 Gems from a 2022 guide.',
    more: [['App Store, Nov 2022 (archived)', 'https://web.archive.org/web/20221102184936/https://apps.apple.com/us/app/id1585915174'], ['Spender guide, 2022 (archived)', 'https://web.archive.org/web/20221107151308/https://www.prydwen.gg/nikke/guides/spender-guide/']],
  },
  {
    kind: 'OFFICIAL',
    title: 'Reverse: 1999 on the US App Store, with the pack ladder from the wikis',
    url: 'https://apps.apple.com/us/app/reverse-1999/id1672933190',
    supports: 'Crystal Drop packs from $0.99 to $99.99 (four prices on the App Store, the ladder and repeat bonuses from two wikis) and Roaring Month (300 up front, 90 a day). Free income from one player\'s tally of a year\'s events.',
    more: [['Puddle of Rain (wiki)', 'https://reverse1999.fandom.com/wiki/Puddle_of_Rain'], ['The Teller Machine (wiki)', 'https://reverse1999.fandom.com/wiki/The_Teller_Machine'], ["A player's tally (TapTap)", 'https://www.taptap.io/post/8447881']],
  },
  {
    kind: 'OFFICIAL',
    title: 'Honkai Impact 3rd: Mars Newsletter, Part 2 Development Special No. 3 (HoYoLAB, 15 Dec 2023)',
    url: 'https://www.hoyolab.com/article/23606392',
    supports: 'The S-rank rate stays 1.50% while its guarantee drops from 100 to 90 drops. The Chinese original calls the raised A-rank figure in the same table a consolidated rate (综合概率), so 1.50% is read as the overall rate, not the base.',
    more: [['Chinese original', 'https://www.miyoushe.com/bh3/article/46320404']],
  },
  {
    kind: 'OFFICIAL',
    title: 'Punishing: Gray Raven: Member Target Instructions and Drop Details (Kuro Games)',
    url: 'https://pgr.kurogame.net/news/2677',
    supports: 'For the standard Member Target pool: 0.50% a pull and 1.90% overall for an S-rank. The wiki gives the Themed pool the same 0.50% and 1.90% and a 60-pull pity; 250 tickets a pull from the 17 Apr 2026 notes.',
    more: [['17 Apr 2026 notes', 'https://pgr.kurogame.net/news/4527'], ["Gray Ravens wiki: Beginner's Guide (Themed pool)", 'https://grayravens.com/wiki/Guides/Beginner%27s_Guide']],
  },
  {
    kind: 'WIKI',
    title: 'Love and Deepspace: limited wish rules (gamerch JP wiki, updated 2 Oct 2026)',
    url: 'https://gamerch.com/loveanddeepspace/841087',
    supports: '1% a wish, rising from wish 61, certain by 70, a 50/50 with a guarantee and 2.1% overall, as the wiki transcribes the in-game text.',
  },
  {
    kind: 'REPOST',
    title: 'Epic Seven GM notice: Haru limited Drop Rate Up, 16 Sep 2026 (mirrored word for word by epic7db.com)',
    url: 'https://epic7db.com/news/haru-custom-made-power-anchor-limited-drop-rate-up',
    supports: 'The limited hero is the only 5★ hero at 1%, the 121st summon is guaranteed, and free copies come at 170 and 200 summons (since 19 Feb 2026).',
    more: [['2/19 update notes (the summon count rewards)', 'https://epic7db.com/news/219-thu-update-content']],
  },
  {
    kind: 'OFFICIAL',
    title: 'Fire Emblem Heroes official guide: Learn How Summoning Works',
    url: 'https://new-guide.fire-emblem-heroes.com/en-US/feh-2020.html',
    supports: "3% focus and 3% other 5★ and +0.5 points every 5 summons without a 5★; the 8 Dec 2020 notice adds the certain 5★ after 120; the free focus hero at 40 summons; merges up to +10. Orb amounts from the 3 Oct 2022 notice with US App Store prices; the 40-Orb price and the Feh Pass's 10 Orbs a month come from the wiki.",
    more: [['8 Dec 2020 notice (wiki copy)', 'https://feheroes.fandom.com/wiki/Feh_Channel_Supplement:_Regarding_Summoning_Event_Appearance_Rates_(Notification)'], ['Free 5★ after 40 summons', 'https://new-guide.fire-emblem-heroes.com/en-US/feh-3020.html'], ['Merging allies', 'https://new-guide.fire-emblem-heroes.com/en-US/feh-2220.html']],
  },
  {
    kind: 'OFFICIAL',
    title: 'League of Legends support: What Is the Sanctum? (updated 24 May 2026)',
    url: 'https://support.riotgames.com/en-us/league-of-legends/store/the-sanctum',
    supports: 'Ancient Sparks at 400 RP; the Exalted skin at 0.5% a draw, guaranteed by the 80th; the Mythic Variant at 0.5%, guaranteed by the 40th; progress carries over within each banner type.',
    more: [['League dev blog, 16 Oct 2024 (1.5% effective rate)', 'https://www.leagueoflegends.com/en-us/news/game-updates/dev-exalted-skins-the-mythic-shop-and-nexus-finishers/'], ['RP prices (2022, unchanged in the US in 2024)', 'https://www.leagueoflegends.com/en-us/news/game-updates/2022-rp-tft-coin-price-changes/']],
  },
  {
    kind: 'OFFICIAL',
    title: 'EA: Apex Legends minimum global drop rates (8 Oct 2024)',
    url: 'https://www.ea.com/games/apex-legends/apex-legends/news/global-drop-rates',
    supports: 'Heirloom shards at 0.045% an Apex Pack, certain within 500 packs; Apex Coin bundles and the $9.99 Ultimate Battle Pass from EA\'s store (6 Oct 2026).',
    more: [['EA store', 'https://store.ea.com/apex-legends/en'], ['Apex FAQ', 'https://www.ea.com/games/apex-legends/about/frequently-asked-questions']],
  },
  {
    kind: 'OFFICIAL',
    title: 'Blizzard: Diablo Immortal featured gem pool (14 Sep 2026)',
    url: 'https://news.blizzard.com/en-us/article/24304159/made-to-suffer-pain-and-anguish-descend-on-lut-gholein',
    supports: 'A 50% chance at the featured gem from 17 Sep to 17 Dec 2026. The 5★ gem certain on the 50th crest and the 4.5% base rate are from the in-game panel via the Diablo wiki.',
    more: [['Diablo wiki: Crests', 'https://diablo.fandom.com/wiki/Crests']],
  },
  {
    kind: 'OFFICIAL',
    title: 'Genshin Impact 7.1 Character Event Wish details (HoYoverse)',
    url: 'https://operation-webstatic.hoyoverse.com/gacha_info/hk4e/os_usa/79a292d76f0cf33b9e30babec9fac01c1860d45d/en-us.json',
    supports: '0.6% base, 1.6% with pity, a 5★ within 90 pulls, a 50% featured chance with Capturing Radiance set aside, the guarantee after a loss, and 1.103% for the featured character.',
  },
  {
    kind: 'OFFICIAL',
    title: 'Capturing Radiance: You Ask, I Answer! (HoYoverse news, updated 10 Feb 2025)',
    url: 'https://genshin.hoyoverse.com/en/news/detail/125274',
    supports: 'Radiance triggers at a base 0.018% a pull (about 3% of legendaries that aren\'t guaranteed, our reading of it), lifts the featured chance to 55%, and is certain after three losses in a row. Also: Epitomized Path needs 1 Fate Point since 5.0.',
  },
  {
    kind: 'OFFICIAL',
    title: 'Honkai: Star Rail character warp details (HoYoverse)',
    url: 'https://operation-webstatic.hoyoverse.com/gacha_info/hkrpg/prod_official_usa/5cc0167d3d91324655049adad752618bc6ca969c/en-us.json',
    supports: 'The same 0.6%, 1.6% and 90 as Genshin, a losing pool that includes the featured character, and 1.113% for the featured character, which means a 56.25% effective 50/50.',
  },
  {
    kind: 'OFFICIAL',
    title: 'Zenless Zone Zero exclusive channel details (HoYoverse)',
    url: 'https://operation-webstatic.hoyoverse.com/gacha_info/nap/prod_gf_us/57afc3f1b18d6e149970e6240e627b02aeb7c355/en-us.json',
    supports: 'The same pity rules with a true 50/50: 1.067% for the featured agent.',
  },
  {
    kind: 'OFFICIAL',
    title: 'Weapon, light cone and W-Engine banner details (HoYoverse)',
    url: 'https://operation-webstatic.hoyoverse.com/gacha_info/hk4e/os_usa/f259ad94b245b2c51ec6a3de2b226c6209492cf7/en-us.json',
    more: [
      ['Star Rail', 'https://operation-webstatic.hoyoverse.com/gacha_info/hkrpg/prod_official_usa/f8078dcc5eeecd4e41659b82cc5e8b2c6503e0f3/en-us.json'],
      ['Zenless Zone Zero', 'https://operation-webstatic.hoyoverse.com/gacha_info/nap/prod_gf_us/129af5085b8d7cfe7a57981a6a05622d828555eb/en-us.json'],
    ],
    supports: 'Genshin: 0.7% base, 1.85% with pity, within 80 pulls, 75% featured. Star Rail: 0.8%, 1.87%, 80, and 1.534% for the featured light cone. Zenless Zone Zero: 1%, 2%, 80, and 1.6% for the featured W-Engine.',
  },
  {
    kind: 'COMMUNITY',
    title: 'GGanalysis by OneBST: gacha models fitted to 9.45M, 15M and 7M real pulls',
    url: 'https://github.com/OneBST/GGanalysis',
    supports: 'The soft-pity formulas: +6 points a pull from pull 74 on character banners, +7 from 63 on the Genshin weapon banner, +7 from 66 on light cones, +6 from 65 on W-Engines.',
  },
  {
    kind: 'COMMUNITY',
    title: 'paimon.moe wish tally: 1,675,557,051 Genshin character-banner wishes',
    url: 'https://paimon.moe/wish/tally',
    supports: '62.31 pulls per 5★ against 62.30 from the model, and the same jump at pull 74 (6.9% measured, 6.6% modelled), rising about 6 points a pull. The total is our sum over 98 banners from the site\'s public data; the page shows the current banner.',
  },
  {
    kind: 'OFFICIAL',
    title: 'Genshin Impact on the US App Store',
    url: 'https://apps.apple.com/us/app/genshin-impact/id1517783697',
    supports: 'Top-up prices from $0.99 for 60 to $99.99 for 6,480 crystals, and the $4.99 monthly pass. Star Rail and Zenless Zone Zero use the same ladder.',
  },
  {
    kind: 'WIKI',
    title: 'Genesis Crystal and Blessing of the Welkin Moon (Genshin Impact wiki)',
    url: 'https://genshin-impact.fandom.com/wiki/Genesis_Crystal',
    supports: 'Bonus crystals on repeat purchases (+30 to +1,600, so $1.98 a pull at best) and the monthly pass: 300 up front and 90 a day for 30 days, only on days you log in.',
  },
  {
    kind: 'ESTIMATE',
    title: 'Genshin Impact 6.1 primogem overview (Icy Veins)',
    url: 'https://wp-prod.icy-veins.com/genshin-impact-6-1-primogem-overview-how-much-you-can-earn-next-patch/',
    supports: 'About 70 free pulls in a version. Across guides the range is 50 to 107, typically 70 to 95.',
  },
  {
    kind: 'COMMUNITY',
    title: 'Swrve monetization report, Feb 2016, 20M players (via Adweek)',
    url: 'https://www.adweek.com/performance-marketing/report-0-19-of-players-account-for-48-of-free-to-play-game-revenue/',
    supports: '1.9% of players paid in a month, and 0.19% of players made 48% of revenue. Swrve\'s 2014 and 2015 reports: 0.13% to 0.23% of players made 51% to 60%.',
  },
  {
    kind: 'COMMUNITY',
    title: 'GameAnalytics, "How to recognize a whale?" (via WN Hub, Sep 2015)',
    url: 'https://wnhub.io/news/other/item-10360',
    supports: 'Of about 116 million players in the groups counted (175 million users studied): whales 0.20%, dolphins 0.86%, minnows 1.03%, non-payers 97.91%, with whales making about 86.6% of revenue. Tiers by spend: whales over $32, dolphins $1 to $32, minnows under $1.',
  },
  {
    kind: 'COMMUNITY',
    title: 'The Many Faces of Monetisation (Zendle and others, Games: Research and Practice, 2023): 2,873 mobile games, 2020 to 2022',
    url: 'https://doi.org/10.1145/3582927',
    supports: 'How concentrated spending is varies a lot by game: from games where spenders pay about the same, to "hyper-Pareto" games (just under 12% of games) where the top 1% of spenders bring in about 38% of revenue (about 40% in SDU\'s summary).',
    more: [['SDU summary', 'https://gamesglobally.sdu.dk/project-2_white-paper.html']],
  },
  {
    kind: 'COMMUNITY',
    title: 'GameAnalytics mobile benchmarks 2019 (via Game World Observer)',
    url: 'https://gameworldobserver.com/?p=1979',
    supports: 'Role-playing games convert best of any genre: on a given day about 3% of a top role-playing game\'s players make a purchase, where top games in most genres rarely pass 1%.',
  },
  {
    kind: 'GOVERNMENT',
    title: 'FTC complaint, United States v. Cognosphere (Genshin Impact), Jan 2025',
    url: 'https://www.ftc.gov/system/files/ftc_gov/pdf/cognosphere_complaint.pdf',
    supports: 'Allegations in a case that settled: a pull costs $2 to $3 depending on the pack, and a featured character can take up to 180 pulls. The same filing gives the six US crystal packs and prices.',
  },
  {
    kind: 'OFFICIAL',
    title: 'Wuthering Waves: Convene Details (Kuro Games)',
    url: 'https://wutheringwaves.kurogames.com/en/main/news/detail/758',
    supports: '0.8% base, 1.8% with the guarantee, a 5★ within 80 convenes, a 50% featured chance and the guarantee after a loss; duplicates count up to the 7th copy.',
    more: [['Wiki: Featured Resonator Convene', 'https://wutheringwaves.fandom.com/wiki/Featured_Resonator_Convene']],
  },
  {
    kind: 'COMMUNITY',
    title: 'wuwatracker global stats: 476 million tracked Wuthering Waves pulls',
    url: 'https://wuwatracker.com/tracker/stats/100001',
    supports: 'Soft pity starting at pull 66 and climbing about 4, then 8 points a pull, within 0.8 points of the GGanalysis model. The total is our sum over 43 banners; the link shows one.',
  },
  {
    kind: 'WIKI',
    title: 'Arknights headhunting rules (wiki.gg) and the official CN announcement',
    url: 'https://arknights.wiki.gg/wiki/Headhunting',
    supports: '2% for a 6★, +2 points a pull from pull 51, 70% of 6★s split between the two rate-up operators (one limited, one standard), the 300-pull exchange, and the free limited operator at 300 pulls (Global since 31 Oct 2024).',
    more: [['Limited banners (wiki.gg)', 'https://arknights.wiki.gg/wiki/Headhunting/Banners'], ['CN announcement (Sina repost)', 'https://sina.cn/news/detail/5027883972561994.html']],
  },
  {
    kind: 'OFFICIAL',
    title: 'Fate/Grand Order NA: summoning campaign notice with the 330-summon rule (Jul 2026)',
    url: 'https://webview.fate-go.us/2026/0704_9th_anniversary_pu/',
    supports: 'The featured Servant is guaranteed within 330 summons and a new count to 330 begins each time. The 1% and 0.8% rates come from the in-game tables, via the wiki. 3 Saint Quartz a summon; US Saint Quartz prices from the App Store.',
    more: [['3 Saint Quartz a summon (official manga)', 'https://fate-go.us/manga_fgo/comic03.html'], ['US App Store', 'https://apps.apple.com/us/app/fate-grand-order-english/id1183802626']],
  },
  {
    kind: 'WIKI',
    title: 'Blue Archive recruitment (wiki) and Nexon notices',
    url: 'https://bluearchive.wiki/wiki/Recruit',
    supports: '3% for a 3★, 0.7% for the featured student and the 200-pull exchange, with points reset at the end of each banner.',
  },
  {
    kind: 'COMMUNITY',
    title: 'Umamusume gacha odds (GameTora, datamined)',
    url: 'https://gametora.com/umamusume/gacha',
    supports: '3% for a 3★ and 0.75% for a spotlight trainee. The 200-pull exchange comes from a player guide.',
    more: [['games.gg banner guide (200-pull exchange)', 'https://games.gg/umamusume-pretty-derby/guides/umamusume-pretty-derby-banner-guide/']],
  },
  {
    kind: 'REPOST',
    title: 'NIKKE patch notes (reposted by nikke.gg)',
    url: 'https://nikke.gg/october-8-patch-notes-summary',
    supports: '4% for an SSR, 2% for the featured Nikke, and 200 Gold Mileage tickets to trade for her. One ticket a pull comes from a fan guide.',
    more: [['nikke.gg guide (one ticket a pull)', 'https://nikke.gg/soft-pity-and-guaranteed-pull-mechanics-in-nikke-recruitment/']],
  },
  {
    kind: 'REPOST',
    title: 'Reverse: 1999 summon details (official text for a Dec 2023 banner, reposted by dotgg; the current wiki repeats it)',
    url: 'https://dotgg.gg/reverse-1999/the-changeling-awaits-time-limited-character-summoning-event/',
    supports: '1.5% base, 4% after 60 misses rising 2.5 points a pull, certain at 70, and 2.36% with pity. A summon is 180 Clear Drops.',
    more: [['Wiki: Summons/Details', 'https://reverse1999.fandom.com/wiki/Summons/Details'], ['Wiki: Summons (180 Clear Drops)', 'https://reverse1999.fandom.com/wiki/Summons']],
  },
];
