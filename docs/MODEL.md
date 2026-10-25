# The Gacha Lab model

Two layers, kept separate on purpose:

1. **Banner rules**: what happens on a pull. This layer follows each game's published rules (HoYoverse's
   character banners by default) and is checked against the publishers' numbers (`docs/VALIDATION.md`, and the
   Math check on the page).
2. **Players**: who pulls, how often and how much they pay. Only one gacha publisher has shared this, once
   (miHoYo's 2017 IPO filing), so the defaults lean on that filing, cross-game studies and market data (sources
   below), and are settings to change.

## Where the defaults come from (full brief: docs/RESEARCH.md)

| Setting | Default | Source |
|---|---|---|
| Base 5★, consolidated, hard pity | 0.6%, 1.6%, 90 | HoYoverse in-game Details pages (all three games) |
| Soft pity | +6 points a pull from 74 | GGanalysis (OneBST), 9.45M/15M/7M pulls; paimon.moe 1.68B wishes |
| Featured chance | Genshin 50% + Capturing Radiance (55%); Star Rail 56.25%; ZZZ 50% | Details pages; HoYoverse news 125274; implied by 1.113% / 1.067% |
| Capturing Radiance | 3% trigger on a 5★ that isn't guaranteed (our reading of 0.018% a pull), certain after 3 losses in a row (models to 54.5%) | HoYoverse news 125274 (0.018% a pull, 55%, three in a row) |
| Weapon banners | Genshin 0.7%/+7 from 63/80, 37.5% for the weapon you chart; Star Rail 0.8%/+7 from 66/80, 78.125%; ZZZ 1%/+6 from 65/80, 75% | Details pages; GGanalysis |
| Gems per pull, packs, monthly pass | 160; $0.99/60 … $99.99/8,080; $4.99 for 300 + 90 a day × 30 | App Store; game wikis; FTC complaint |
| Season | 30 days by default (decided 5 Oct 2026) | a Genshin Impact version is 42 days (7.0 → 7.1) |
| Default banner | Custom rules: 0.6% base, soft pity from 74 at +6 a pull, certain at 90, 50/50 with a guarantee; no Capturing Radiance, no spark (the same numbers as Zenless Zone Zero) | the HoYoverse standard; presets carry each game's own rules, including Radiance and sparks |
| Free gems | 300 a day of the season (about 79 pulls a version for a daily player); about a fifth only on days played, the rest (the week's share) in full at the week's first log-in | guides: 70–95 a version, range 50–107; Genshin's dailies are 60 of about 300 a day (docs/research/2026-10-06-logins.md, Q4) |
| Free players' log-ins | 35% of days on average, in three bands: light (3–33% of days), middle (33–67%, 16% of players at most averages) and heavy (67–100%); at 35%, 66% light and 18% heavy. With paying players logging in daily, everyone averages about 41% | daily ÷ monthly players: Korea's established gacha games about 0.35 (median of 84 game-months), Japan's top earners about 0.43, HoYoverse's games in China 0.46–0.55; the two-humped spread from App Ape (175 Japanese game apps) and CyberAgent's logs (docs/research/2026-10-06-logins.md): about 0.40 in the middle. Free players take the brief's correction for payers who log in daily, (0.40 − 0.093) ÷ 0.907 ≈ 0.34, rounded to 0.35. Until 6 Oct 2026: 70%, even spread |
| Paying players | 9.3% (pass buyers 8%, dolphins 1.1%, whales 0.2%) | miHoYo's 2017 IPO filing: 10–14% of Honkai Impact 3rd's monthly players paid in a regular month (12.5% on average, Jan–Jun 2017), most of them small amounts (docs/research/2026-10-06-spending.md). The all-genre studies give 1.35–2.3% (Swrve 2014–16, GameAnalytics 2015); for gacha the filing is the better source. Until 6 Oct 2026: 3.1%, then 2.1% |
| Whales | 0.2%; 2 things a season, up to 7 copies of each; budget (a ceiling) $1,500 | Share: five cross-game studies, 0.13–0.23% of players (mean 0.18%): Swrve Jan 2014 0.15%, Jul 2014 0.13%, Jan 2015 0.23%, Feb 2016 0.19%; GameAnalytics 2015 0.20%. Spend: the filing's top 0.2% of monthly players paid about ¥3,900 a month ($570 then, about $750 in 2025 dollars). Each whale chases **2 things** a season, up to 7 copies of each, spread evenly — a season is rarely one unit and nor is a banner (Genshin and Honkai run featured characters alongside their weapon banners; League's Sanctum has the skin, its border and the mythic essence), and the filing's figure covers a player's whole month. That is about **$1,040 each** and 52% of revenue. On GameAnalytics against the filing, see **Is this accurate?** below: they look like they disagree and do not. Until 7 Oct 2026: a $750 budget and goal 7 for every whale, which none could afford (7 copies cost about $1,295), so all spent their whole budget whatever the banner; until 6 Oct 2026: $2,000 |
| Dolphins | 1.1%; one thing, 1 copy; budget (a ceiling) $400 | The filing's next band (¥3,000–10,000 in six months): 1.13% of monthly players at about $166 a month in 2025 dollars; GameAnalytics 2015 counted 0.86%; Japan's 2022 survey of payers puts its ¥10,000–30,000 band near $152. Dolphins chase one thing and spend about **$137 each**, most of them reaching their copy. Their $400 budget is a ceiling nobody is pinned against: at $200 it bit one dolphin in five, which capped them for no reason in the sources. The budgets are set for HoYoverse's prices: where one copy costs more than a dolphin's limit, many spend their whole budget (League's Exalted skin: 55% of dolphins; Honkai Impact 3rd: 60%). Until 7 Oct 2026: $150 and goal 2; until 6 Oct 2026: 0.9% |

The shares lean on one game's numbers (Honkai Impact 3rd in miHoYo's filing) and on cross-game studies, and
concentration varies a lot by game (Zendle and others, 2023, 2,873 games: from even
spending to "hyper-Pareto" games, just under 12% of them, where the top 1% of spenders bring in about 38%; about
40% in SDU's summary).

**How solid the spending is.** The dollar amounts rest on one official source: miHoYo's 2017 IPO filing, the only
per-player spending a gacha publisher has published (Honkai Impact 3rd, Jan–Jun 2017, mostly China), turned into 2025
dollars with US consumer prices. Japan's 2022 government survey of payers agrees on the average (about $40 a month).
## Is this accurate?

The money side is **fitted to every per-player figure the research gives**, not to one of them, and
`test/engine.test.js` fails if any drifts outside its band (eight sets of dice, 10,000 players):

| Measure | The model | What the research says |
|---|---|---|
| ARPPU a month | **$42.84** | $35–64 in 2025 dollars (HoYoverse's 2017 filing) |
| ARPU a month | **$3.98** | about $3–15 (¥15–70 / ¥3–25, same filing) |
| Paying share | **9.30%** | 4–14% of monthly actives |
| The biggest tenth of payers | **84.0%** | 80.1% (filing) / 86.6% (GameAnalytics) |
| Whales each | **$1,038** | the filing's top 0.2%: about $750 |
| Dolphins each | **$137** | the filing's next 1.1%: about $166 |

**The two sources look like they disagree and do not.** GameAnalytics' "whales" are 0.20% of players in data where
only **2.09% pay at all**, so they are the top **9.6% of payers**, bringing 86.6%. The filing says the top **10.4% of
payers** brought 80.1% of top-ups. Both are saying that about the top tenth of payers brings 80–87%, and the model
lands at 84%. What neither says is that any 0.2% slice of *players* dominates: where 9.3% pay, as here, 0.2% of
players is only the top **2.2% of payers**, and that slice brings 52%. The page shows the tenth-of-payers figure
beside the revenue split for exactly this reason — it is the one that can be held against a published number.

**What is verified rather than fitted:** every banner rule. `scripts/validate.js` runs a million legendaries per rule
set against the exact maths, and `docs/VALIDATION.md` carries the result. The pity curves, the 50/50, the guarantee,
sparks and free copies are right to the decimal. The player shares (0.2% whales, 1.1% dolphins) come from five
cross-game studies.

**What is not checkable:** no gacha publisher has released revenue for a single banner, so there is no ground truth
for a season's total. The model gets each per-player figure inside its band and the right shape across payers; it
cannot be checked against a real banner's takings, and does not claim to be.

Before 19 Oct 2026 the season brought in about $39 per paying player against the filing's $40 then and $52 in 2025 dollars; whales bring in about 40% of revenue and
whales and dolphins together about 89%. Two gaps: the filing
has a band of about 2.7% of players paying around $40 a month that none of the three paying types covers, so revenue
per player lands a little under the filing's; and Japan and the US probably spend more per payer than 2017 China.

## 1. Banner rules (one pull)

- Pull number *n* since the last 5★ is a 5★ with chance `base` up to the soft-pity start, then
  `base + climb × (n − start + 1)`, and certainly at hard pity. HoYoverse character banner:
  0.6% base, soft pity from pull 74 climbing 6 points a pull, certain at pull 90. A banner with no hard pity
  uses 999, which the engine still treats as certain: at Fate/Grand Order's 1% that touches about 1 legendary
  in 23,000 (0.99^998), too few to move any result.
- A 5★ is the featured unit with the featured chance (50%). After a lost 50/50 the next 5★ is the
  featured unit (the guarantee). Pity and the guarantee carry over within the season.
- Capturing Radiance (Genshin 5.0+), when switched on: on a 5★ that isn't guaranteed it triggers with a
  set chance (3%, our reading of HoYoverse's 0.018% a pull) and gives the featured unit, and it is certain after a
  set number of lost 50/50s in a row (3). It is checked before the 50/50, so the plain 50/50 stays 50%.
- Spark (Blue Archive, Umamusume, Granblue Fantasy, NIKKE, Arknights limited banners): each pull earns a
  point; at the spark count a player trades the points for a featured copy if they still want one. With
  "resets on featured" the count restarts whenever the featured unit drops, which makes it a guarantee of
  the featured unit within that many pulls (Fate/Grand Order's 330). A traded copy counts as featured but
  not as a 5★ from a pull.
- Free copies (`freeCopiesAt`): the featured unit handed out at fixed pull counts on the banner, once each
  (Epic Seven at 170 and 200 summons, Fire Emblem Heroes' free pick at 40, Arknights' free limited operator at
  300). The count is every pull, whatever it gave, and never starts again. A free copy past a player's goal
  isn't handed out. Like a spark copy, it counts as featured but not as a 5★ from a pull.
- Exact maths: the chance the next 5★ lands on pull *n* is worked out directly (`pityDistribution`),
  which gives the average pulls per 5★ and the consolidated rate. The share of 5★s that are the
  featured unit is the steady state of the guarantee/streak chain (`featuredShareTheory`).

## 2. Players (a season)

- **Types**: whales, dolphins, pass buyers, free players. Shares are set on the page; free players
  take what is left. Each player's type is fixed by a seeded shuffle, so counts are exact.
- **Days**: each free player logs in on a share of days drawn from three bands (light 3–33%, middle 33–67%,
  heavy 67–100%; at most averages the middle holds 16% of free players and the other two are mixed so the average is
  the log-in rate; near the ends a narrower single band takes over).
  Paying players play every day. Pulls, passes and pack buys only happen on days a player plays.
- **Free gems**: every player starts with none (saved gems left the page, 6 Oct 2026). Of each day's free gems
  about a fifth (whole gems) comes only if the player logs in that day (daily missions). The rest is the week's share
  (events, endgame, story), paid in full at the week's first log-in (weeks are days 1–7, 8–14, …; the last may be
  short); a week with no log-in loses it. A player who logs in every day gets the full amount.
- **Monthly pass**: whales, dolphins and pass buyers buy each new monthly pass: the first on their first day,
  the next as soon as the last one ends, so it never lapses. It gives gems up front and gems on each day they log in
  while it lasts. A game with no pass
  (price and gems all zero) has no pass buyers: they play as free players.
- **Spending follows the banner** (since 7 Oct 2026): whales and dolphins buy what their goal takes and stop there,
  so a harsher banner costs them more and a kinder one less. On the default banner (10,000 players, 8 sets of dice):
  featured chance 25% +9%, base chance halved +8%, no guarantee +13%, pulls a quarter dearer +11%, packs a fifth
  dearer +10%; featured chance 100% −29%, base chance doubled −16%, hard pity at 60 −20%, pulls a quarter cheaper
  −19%. Before, budgets were too small for anyone's goal, so everyone spent all of theirs and revenue never moved.
- **Packs**: when a whale or dolphin can't afford a pull, they spend as little money as they can for the gems they
  still expect to need (the copies left at the long-run pulls a copy, less the pulls they're already into pity, less
  the gems in hand). When a pack they can afford covers the whole need they take the cheapest of those, since gems
  past the need are wasted; otherwise they take the best value for money they can afford — the lowest price a gem —
  and come back for more, which is what a store's bonus ladder is for. So the most anyone hands over at once is the
  price of the store's best value, and a pack another one beats outright is never bought. They pace it over the banner's run: each day they fund about what is left divided by the days left, and stop
  until tomorrow. That is what spreads buying across the season, so the gems the game hands out daily can stand in
  for a purchase; it also sizes the purchase, which is why the whole ladder sells rather than one pack. (A flat
  one-top-up-a-day rule, 19 Oct 2026, spread the buying but strangled anyone chasing a lot: a whale after 28
  featured pulls bought on 30 days of 30 and still only got there 60% of the time.) They stop when the budget
  covers no pack, or the season ends. On HoYoverse's store even one copy (about 93 pulls) needs more than the biggest pack, so they buy
  the biggest, which there is also the best value; on a kind banner a smaller one. Each one's budget, the most
  they'll spend on packs, is between half and one and a half times their type's; most stop well under it, at their
  goal.

  Because each day's share sizes the purchase, the money spreads across the ladder: on the default store no pack
  takes more than about a third of the pack money ($14.99 33%, $99.99 30%, $49.99 18%, $4.99 10%, $29.99 9%, $0.99
  under 1%; 10,000 players, 8 sets of dice, 23 Oct 2026). Until pacing (19 Oct 2026) one pack took 91%, and the price
  of a pack almost nobody bought barely moved revenue. The store shows each pack's share of the season's pack money
  for that reason. Raising the whole ladder a fifth raises revenue about 10%, not 20%: the pass is priced on its own
  (about 12% of revenue), and whales buy about 11% fewer gems at the dearer prices (pack money +12%, pulls −0.3%).
  Doubling it raises revenue about 40%. 8% of whales and dolphins use up their budget at the listed prices, 11% at a
  fifth dearer and 26% at double. Until 18 Oct
  2026 the second rule took the most gems whatever the price, so a store whose biggest pack was also its worst value
  still took nearly all the money, raising a pack's price could lower revenue, and a single pack big enough to
  finish the job was bought at any price. That changed no preset but four: Umamusume (−4.6%: its $69.99 pack for
  5,000 Carats costs more than two $33.99 packs for 2,500 each, so spenders now skip it, as players do), NIKKE
  (−0.2%), Love and Deepspace (−0.1%) and Diablo Immortal (−0.01%). The default banner's calibration is unchanged to
  the cent.
- **Sample size**: 1,000 to 1,000,000 players. Past 12,000 the dot field draws one player in `strideFor(N)` (9 at
  100,000, 84 at a million) — the same stride for every type, so the blocks keep their proportions — and the
  legend says so at full size rather than in small print. Every figure on the page still counts every player. A
  million takes about five seconds, so the page says it is working before it starts.

- **Free gems given away**: every gem the game hands out, and what it costs. How many gems are handed out never
  depends on the banner — free income is earned by logging in, not by pulling — so the count is the same under every
  rule. Pricing those gems at the shop's rate is not what the giveaway costs: it counts currency that mostly goes to
  players who would never have bought any. On the default banner it reads $80,930 against a real cost of $137, and on
  Honkai Impact 3rd $91,032 against $262, which is why the tile used to make no sense beside revenue (her report,
  18 Oct 2026). The cost is the revenue the giveaway takes away: the same season with nothing given away, against the
  one that was run (`freeGemCost`), with the same players and the same dice. That figure does follow the rules, the right way — free
  gems carry a player further on a kind banner, so they displace more spending (featured chance 100%: 11.6% of
  revenue) than on a harsh one (featured chance 25%: 2.1%). The tile leads with that cost in dollars (her call, 18 Oct 2026), then its share of revenue, then the gems and
  the pulls a player they buy (which compares across games whose pulls cost 3 to 600 gems); the shop-price figure
  stays in its (i).

  One season is far too noisy to read it from. With about 13 payers in 1,000, two whales crossing a pack boundary
  move the answer by $200: a single set of dice put the default banner's cost anywhere from $5 to $360, and two
  standard errors of luck reached zero on 120 of 168 preset-seeds, so the tile would have had to say "too close to
  tell" most of the time. So the cost is the average of `freeCostRepeats(sampleSize)` paired measurements — 8 sets
  of dice at 1,000 players, 2 at 5,000, 1 at 10,000, which keeps the work near constant (9–26 ms). That answers what
  the giveaway costs rather than what it cost this time, and New dice leaves it where it is: across five re-rolls
  revenue moved $3,239 to $4,280 while the cost held at $114 to $136. It is shown in whole dollars, because an
  average give or take tens of dollars has no cents in it, and the tile still says "too close to tell on this
  sample" when two standard errors would reach zero (Apex Legends, where the giveaway really does cost about
  nothing).

- **Goal**: how many copies of the featured unit a player pulls for. The page counts copies, not any one
  game's levels (Genshin C0–C6 = 1–7 copies, Star Rail E0–E6, Fate/Grand Order NP1–NP5). A type's goal is the most
  its players want: each wants anywhere from 1 up to it, spread evenly across the type (the k-th of n players draws
  from the k-th n-th of the range, so even 2 whales cover it fairly). A game whose copies stop helping sooner caps
  every goal there (`maxCopies`: weapons, light cones and W-Engines 5, Fate/Grand Order 5, Epic Seven 5, Love and
  Deepspace 4, Arknights and Reverse: 1999 6). With **Extra copies** off (games where duplicates don't matter),
  every goal is 1 copy. Players stop pulling when they reach theirs.
- **Daily gems stand in for purchases**: payers pace their buying over the season (since 19 Oct 2026), so every gem
  that arrives along the way (the daily free gems, the pass's daily gems) is one they don't have to buy. Giving the
  free gems away costs about 17% of revenue on the default banner: none at all raises revenue about 17%, double the
  free gems lowers it about 14%, and a pass with no daily gems raises it about 3.5% (10,000 players, 8 sets of dice,
  23 Oct 2026). The suggestion cards measure these live. Until 19 Oct everyone bought everything on day 1, and these
  settings moved revenue by about nothing.
- **Season length** moves revenue through the daily gems: a shorter season hands out fewer of them to stand in for
  purchases, so a 7-day season earns about 14% more than a 30-day one on the default banner. With no daily gems (free
  or pass) the two earn about the same, +0.7% (10,000 players, 8 sets of dice, 23 Oct 2026). The pass is bought again
  when it runs out.
- **Not modelled**: players quitting, several banners in one season, 4★s, weapons, first-purchase
  double gems, sales, and limited pack deals (once a month or a few times a month: the engine buys packs without limits).

## Dice

Every player has their own seeded dice (`seed#player`). Changing one setting only changes what that
setting touches, which is why the smart suggestions compare like with like. "New dice" changes the
seed: same settings, different luck.

## Presets and their stores (6 Oct 2026)

Choosing a preset sets its banner rules, its store, whether extra copies matter and how many are useful
(`presetSettings` in src/presets.js). A preset without its own store uses the shared one: HoYoverse's US packs and
monthly pass, 160 gems a pull, 300 free gems a day; the store note says so. Only Epic Seven still uses it in place of its own. A store whose pass
price and gems are all zero means the game has no monthly pass. While a preset's rules or store are on, the page
shows its short notes: what the model approximates, and whose prices these are. The page says "legendary" for the
top prize and "gems" for every game's premium currency (the vocabulary gives each game's own words).

"Exact" below means the model reproduces the published rule pull by pull; VALIDATION.md shows the engine matches the
model's own maths for every preset.

Since 6 Oct 2026 the page offers only the HoYoverse and League of Legends presets (and Custom rules) outside #lab.
Every other row below is `labOnly` until someone who plays that game has checked it; they stay modelled, validated
and tested.

| Preset | Rules fit | Store | Research |
|---|---|---|---|
| Genshin Impact, Honkai: Star Rail, Zenless Zone Zero character banners | the published rates (1.6%; 1.103%, 1.113%, 1.067% featured). Genshin's Capturing Radiance models to 54.5% against HoYoverse's 55% | shared (verified against all three games' App Store listings) | RESEARCH.md |
| Genshin weapon, Star Rail light cone, ZZZ W-Engine | light cone and W-Engine match; the weapon model is certain by pull 77 against the official 80 (1.878% vs 1.85%). Copies stop at 5 | shared | RESEARCH.md |
| Honkai Impact 3rd: Battlesuit Supply | base 0.71% inferred from the 1.50% overall rate (the Chinese notice calls the A-rank figure in that table consolidated); no soft pity published | own (Crystals); Monthly Card and free income estimated | research/2026-10-06-anime-a.md |
| Wuthering Waves: featured character | Kuro's 0.8%, 1.8%, 80, 50/50; the climb is GGanalysis's model (+4 and +8 confirmed by tracked pulls, +10 the model's), certain by 79; 1.848% against Kuro's rounded 1.8% | shared; matches Wuthering Waves' own US ladder and pass (bonuses and free income assumed) | RESEARCH-OTHER-GAMES.md |
| Arknights: limited headhunting | exact, with the 300-pull exchange and the free limited operator at 300 (whether the exchange can repeat isn't verified). Copies stop at 6 | own: US prices counted in Orundum (600 a pull, 180 per Originite Prime), pack sizes and bonuses from two wikis, the $4.99 Monthly Card; free income estimated (500 a day); the once-a-month $25.99 pack left out | RESEARCH-OTHER-GAMES.md; research/2026-10-06-stores.md |
| Fate/Grand Order: limited pickup (NA) | exact (330 repeats since Jul 2026). One gap: in the model the 330th summon is an ordinary pull that can also give an off-banner 5★, with the guaranteed copy on top; in the game that summon is the Servant. Copies stop at 5 | own: US Saint Quartz packs, 3 a summon (the 11-for-30 discount isn't modelled), no pass; free Saint Quartz estimated (3 a day) | RESEARCH-OTHER-GAMES.md |
| Blue Archive: pick-up recruitment (Global) | exact for Global's 200-point system; Japan's newer system is due on Global in Q4 2026 | own: 120 Pyroxene a pull, contents from the game's tables, $18.99 and $31.99 from 2022–23 App Store copies, the $6.99 Monthly Pyroxene Pack; free income estimated; the $64.99 deal sold five a month left out | RESEARCH-OTHER-GAMES.md; research/2026-10-06-stores.md |
| Umamusume: spotlight scout (Global) | datamined odds; the 200 exchange from player guides | own: 150 Carats a scout, four App Store packs, the $6.99 Daily Carat Pack (contents from guides); free income estimated | RESEARCH-OTHER-GAMES.md; research/2026-10-06-stores.md |
| NIKKE: special recruit | the published 4% and 2%; one ticket a pull from a fan site; tickets carry over between banners in the game, not here | own: 300 Gems a pull, official tiers at 2022–23 App Store prices, the $4.99 30-Day Supply (our 300 / 100 split); free income estimated | RESEARCH-OTHER-GAMES.md; research/2026-10-06-stores.md |
| Reverse: 1999: limited character | exact (2.359% vs 2.36%). Copies stop at 6 | own: 180 Clear Drops a summon, four App Store prices and the wikis' ladder and bonuses, Roaring Month; free income from one player's tally (a guide gives about half) | RESEARCH-OTHER-GAMES.md; research/2026-10-06-stores.md |
| Epic Seven: limited Drop Rate Up | exact, with the free copies at 170 and 200 summons; the bookmark refunds at 80 and 110 aren't modelled. Copies stop at 5 | shared (Skystone prices not found); free income estimated at about a summon a day | research/2026-10-06-anime-b.md |
| Fire Emblem Heroes: New Heroes | approximate: +0.5 every 5 summons spread as +0.1 a summon; 14.5% stands in for Focus Charge (later copies within about 2% of the exact rules, the first copy 33.4 summons against 34.18); the free pick at 40, once. Duplicates merge to +10 (11 copies) | own (Orb packs, Feh Pass); free Orbs estimated | research/2026-10-06-anime-b.md |
| Punishing: Gray Raven: Themed Construct | 0.5% and pity 60 from the wiki; Kuro's 1.90% is for the standard pool, and 0.5% with pity 60 gives 1.925%, which doesn't round to it (unresolved) | own (Black Cards); pass and free income estimated | research/2026-10-06-anime-a.md |
| Love and Deepspace: limited wish, one memory | exact against the wiki's transcription (2.117% vs 2.1%). Copies stop at 4 | own (Diamonds, reseller pack amounts); pass and free income estimated | research/2026-10-06-anime-a.md |
| League of Legends: Exalted skin / Mythic Variant | exact (1.514% vs the 1.5% effective rate); progress carrying over between banners isn't modelled | own (the US RP table; no free RP, no pass) | research/2026-10-06-western.md |
| Apex Legends: heirloom shards | exact for the rules | own (EA's coin store); the pass approximates the Ultimate Battle Pass; free income approximate | research/2026-10-06-western.md |
| Diablo Immortal: featured 5★ gem | close: the game counts earned and bought crests separately, the model once | own (orbs, three tiers from 2022); Boon of Plenty and free crests estimated | research/2026-10-06-western.md |

The model can't yet express: separate pity counters per currency, pity that carries between banners, a smaller
pity drop after an off-focus legendary, refunds of pulls (bookmarks, tickets), multi-pull discounts (Fate/Grand
Order's 11 summons for 30 Saint Quartz), and free income paid as pulls rather than currency.
