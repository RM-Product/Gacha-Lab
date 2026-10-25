# Gacha Lab: HoYoverse gacha economy research brief

Researched 4–5 Oct 2026 (UTC). Covers Genshin Impact (GI, live version 7.1), Honkai: Star Rail (HSR) and Zenless Zone Zero (ZZZ), as served to the US region on that date.

## How to read this brief

Every number carries a confidence tag:

| Tag | Meaning |
|---|---|
| **OFFICIAL** | HoYoverse's own text. Best: the in-game **Details** page as served by HoYoverse's own endpoint (`operation-webstatic.hoyoverse.com/gacha_info/...`, the JSON the in-game page loads), HoYoverse news posts (fetched through the official site's content API), and the official App Store listing. "OFFICIAL via wiki" means in-game values transcribed by a fan wiki, not fetched from HoYoverse directly. |
| **OFFICIAL-GOV** | A US government filing (FTC complaint/press release). These are allegations in a settled case, not HoYoverse's words. |
| **COMMUNITY-DATA** | Measured from large pull datasets or reverse engineering: GGanalysis/OneBST, paimon.moe. For topic 7 it also covers industry telemetry (Swrve, GameAnalytics) and peer-reviewed studies. |
| **ESTIMATE** | Journalists, guide sites, calculators, top-up-shop blogs, self-selected surveys, opinion. |
| **DERIVED** | My own arithmetic on cited inputs. It is not a new source. Scripts and raw data are in `scratchpad/lootlab/src/` (`models.py`, `cr_models.py`, `analyze_paimon.py`, `gga_run.py`, `paimon/*.json`, `gacha_info/*.json`). |

Access notes:
- The Fandom wikis, Prydwen, Icy Veins, Game8 and Sportskeeda block automated fetches (HTTP 402/403/405).
- I read Fandom through its MediaWiki API (`api.php?action=parse`). Fetch failures for the other sites are noted where they matter.
- Nothing below is filled from memory. Anything I could not check is marked **not verified**.

---

## 1. Character banners: Genshin Character Event Wish, HSR Character Event Warp, ZZZ Exclusive Channel

### 1.1 Official sources: the live in-game Details text

- **[GI-301]** Genshin 7.1 Character Event Wish "When Warm Winds Cavort" (Vesna), 2026‑09‑22 → 2026‑10‑13: https://operation-webstatic.hoyoverse.com/gacha_info/hk4e/os_usa/79a292d76f0cf33b9e30babec9fac01c1860d45d/en-us.json
- **[GI-400]** Genshin 7.1 Character Event Wish‑2 "Surging Ballad": https://operation-webstatic.hoyoverse.com/gacha_info/hk4e/os_usa/758a570f162a0ffb4ec8410b6dfa47db353d1a01/en-us.json
- **[HSR-11]** HSR Character Event Warp "An Ocean in a Pearl" (details format `version_switch 3.4.0`), 2026‑09‑27 → 2026‑11‑10: https://operation-webstatic.hoyoverse.com/gacha_info/hkrpg/prod_official_usa/5cc0167d3d91324655049adad752618bc6ca969c/en-us.json
- **[ZZZ-2002]** ZZZ Exclusive Channel "Cindernight Respite" (Roxy), 2026‑09‑30 → 2026‑10‑20: https://operation-webstatic.hoyoverse.com/gacha_info/nap/prod_gf_us/57afc3f1b18d6e149970e6240e627b02aeb7c355/en-us.json
- Banner lists: `.../hk4e/os_usa/gacha/list.json`, `.../hkrpg/prod_official_usa/gacha/list.json`, `.../nap/prod_gf_us/gacha/list.json`. I found these endpoints in open-source tools: [hoyo-buddy](https://github.com/seriaati/hoyo-buddy/blob/main/hoyo_buddy/hoyo/auto_tasks/update_standard_items.py) and [FuriaPaladins/Hoyoverse-Data](https://github.com/FuriaPaladins/Hoyoverse-Data/blob/main/main.py).

### 1.2 Parameters

| Parameter | Genshin CEW | HSR Character Event Warp | ZZZ Exclusive Channel | Tag |
|---|---|---|---|---|
| Base 5★ / S rate | 0.600% | 0.600% | 0.600% | OFFICIAL |
| Consolidated 5★ (incl. guarantee) | 1.600% | 1.600% | 1.600% | OFFICIAL |
| Hard pity | 90 | 90 | 90 | OFFICIAL |
| Stated featured chance on a non-guaranteed 5★ | 50.000% "(excluding the triggering of Capturing Radiance)" | 50% | 50.000% | OFFICIAL |
| **Effective** featured chance on a non-guaranteed 5★ | **55.000%** consolidated incl. Capturing Radiance (topic 4) | **56.25%**, implied by the official 1.113% (see 1.4) | 50% (official 1.067% = 1.6%/1.5 exactly) | OFFICIAL / DERIVED |
| Guarantee after a lost 50/50 | next 5★ is featured | next 5★ is featured | next S is featured | OFFICIAL |
| Official consolidated rate for the *featured* unit | 1.103% | 1.113% | 1.067% | OFFICIAL |
| Base 4★ / A rate | 5.100% (2.550% char + 2.550% weapon) | 5.100% (2.550% char + 2.550% LC) | **9.400%** (7.050% agent + 2.350% W‑Engine) | OFFICIAL |
| Consolidated 4★ / A | 13.000% | 13.000% | **14.400%** | OFFICIAL |
| 4★ hard pity | 10 (guarantee draw: 99.400% 4★ / 0.600% 5★) | 10 (99.400% / 0.600%) | 10 ("A-Rank or higher"; split not stated) | OFFICIAL |
| Featured 4★ rule | 50.000%; guarantee after a miss; equal odds among the 3 featured | 50%; guarantee after a miss; equal among 3 | 50.000%; guarantee after a miss; equal among 2 | OFFICIAL |
| Pity and guarantee carry over? | Yes: shared by CEW and CEW‑2 and carried into future CEWs; separate from weapon and standard | Yes, across all Character Event Warps | Yes, across all Exclusive Channels | OFFICIAL |

Verbatim quotes:
- **GI [GI-301]:** "Base probability of winning 5-star character = 0.600%; consolidated probability (incl. guarantee) = 1.600%; guaranteed to win 5-star character at least once per 90 attempts." … "The first time you win a 5-star item in this event wish, there is a 50.000% chance (excluding the triggering of "Capturing Radiance") it will be the promotional character" … "If the first 5-star character you win in this event wish is not the promotional character, then the next 5-star character you win is guaranteed to be the promotional character." … "Consolidated probability of winning 5-star character (incl. guarantee and Capturing Radiance) = 1.103%." … "Base probability of winning 4-star item = 5.100%; base probability of winning 4-star character = 2.550%, and base probability of winning 4-star weapon = 2.550%; consolidated probability (incl. guarantee) of winning 4-star item = 13.000%; guaranteed to win 4-star or above item at least once per 10 attempts; probability of winning 4-star item through the guarantee = 99.400%, and probability of winning 5-star item through the guarantee = 0.600%." … "※ This is for "Character Event Wish." The wish guarantee count for "Character Event Wish" and "Character Event Wish-2" is shared … This wish guarantee count is independent of the guarantee counts of other types of wishes."
- **GI carry-over to future banners:** official notice "Character Event Wish-2 (New Type) Mechanics Description", 12 Nov 2021, https://genshin.hoyoverse.com/en/news/detail/104088: "Even after the end of this period's "Character Event Wish-2," the wish guarantee count will carry over for future Character Event Wishes and Character Event Wishes-2." (OFFICIAL)
- **HSR [HSR-11]:** "the base chance of obtaining 5-star characters is 0.600%, and the consolidated chance including the guarantee is 1.600%. Within 90 Warps, at least one 5-star character is guaranteed." … "there is a 50% chance that it will be the featured rate-up 5-star character … And there is a 50% chance that it will be any of the obtainable 5-star characters of the current Warp phase, with equal chance among them." … "The consolidated chance of obtaining the featured rate-up 5-star character (including guarantees) is 1.113%." … "※ This Warp is considered a Character Event Warp. The cumulative Warp count for a guaranteed 5-star character in any Character Event Warp will always be carried over to other Character Event Warps, but is independent of and unaffected by other types of Warps."
- **ZZZ [ZZZ-2002]:** "the base probability of an S-Rank Agent is 0.600%. Within 90 Signal Searches, at least one S-Rank Agent is guaranteed. The overall probability of an S-Rank Agent (including the guarantee) is 1.600%. The combined probability (including pity) for the current limited S-Rank Agent is 1.067%." … "the base probability of an A-Rank Signal is 9.400%, where the base probability for an A-Rank Agent is 7.050% and the base probability for an A-Rank W-Engine is 2.350%. Within 10 Signal Searches, at least one A-Rank or higher Signal is guaranteed. The overall probability of A-Rank Signals (including the guarantee) is 14.400%." … "The Search count for guaranteed Signals is cumulative across all Exclusive Channels but is independent of and unaffected by other types of Channels."

### 1.3 Differences between the three games

1. **The featured 5★ chance is effectively different in each game, despite the shared "50%" headline.**
   - GI adds Capturing Radiance: 55% official (topic 4).
   - HSR's losing 50% is drawn from a pool that **includes** the featured character. The current pool is 8 characters (Pearl plus Himeko, Welt, Bronya, Gepard, Clara, Yanqing, Bailu; field `items_avatar_star_5` in [HSR-11]). The effective rate is 0.5 + 0.5 × 1/8 = 56.25%. The official 1.113% equals 1.6%/(2 − 0.5625) = 1.113% (DERIVED check).
   - ZZZ is a true 50% (1.6%/1.5 = 1.067%, the official figure).
2. **ZZZ's 4★-tier (A-rank) rates are higher:** 9.4% base and 14.4% consolidated, against 5.1% and 13% in GI/HSR. GGanalysis also reports that in ZZZ "**A级保底会被S级重置**" (the A-rank pity counter is reset by an S-rank). With that coupling its model reproduces the official 14.4%: coupled stationary rates are S 1.6052%, A 14.391%, B 84.003% (DERIVED by running GGanalysis `stationary_p.py`). COMMUNITY-DATA. Source: https://github.com/OneBST/GGanalysis/blob/main/docs/source/games/zenless_zone_zero/index.rst
3. **Off-banner pool customization (HSR and ZZZ only):**
   - HSR: "obtainable 5-star characters include the featured 5-star character with a boosted drop rate and the custom characters from "Celestial Invitation."" [HSR-11]
   - ZZZ: "Proxies can use the Custom Search function to customize the non-rate-up S-Rank Agents and boosted A-Rank Agents." [ZZZ-2002]
   - The ZZZ wiki says the player picks 6 S-rank agents for the losing pool. OFFICIAL via wiki: https://zenless-zone-zero.fandom.com/wiki/Exclusive_Channel
   - GI has no equivalent. Its losing pool is the standard roster, currently 8 characters including Yumemizuki Mizuki (`r5_prob_list` in [GI-301]).
4. **Two banners share one counter in GI.** Character Event Wish and Character Event Wish‑2 share pity and the guarantee. Since 5.3, new characters can also appear on Wish‑2 (Fandom citing HoYoverse news 127690).
5. **ZZZ "Exclusive Rescreening" (since 2.5)** is a discounted rerun channel: "The first S-Rank Signal obtained from the Exclusive Rescreening channel is guaranteed to be the currently selected limited S-Rank Agent", and "the first 10-Signal Searches will be 20% off". OFFICIAL via wiki: https://zenless-zone-zero.fandom.com/wiki/Exclusive_Rescreening

### 1.4 Nuances worth modelling (lower confidence)

- **Non-featured 4★ split.** The GI wiki claims the non-featured 4★ on the character banner are "heavily towards 4★ weapons": 15% characters and 85% weapons, or 66.67% featured / 5% off-banner characters / 28.33% weapons overall. No source is cited, and it contradicts the official "evenly distributed" wording. Treat as **COMMUNITY-DATA (unsourced, not verified)**: https://genshin-impact.fandom.com/wiki/Wish/Expanded_Wish_Probabilities
- **"平稳机制" (stabilisation).** GGanalysis notes a mechanism that forces character/weapon type balance on the standard banners, and on event-banner 4★ off-rates. It is not modelled in their event-banner code. COMMUNITY-DATA: https://github.com/OneBST/GGanalysis/blob/main/docs/source/games/genshin_impact/gacha_models.rst

---

## 2. Weapon, light cone and W-Engine banners

Official Details pages, live versions:
- **[GI-302]** Genshin Epitome Invocation 7.1: https://operation-webstatic.hoyoverse.com/gacha_info/hk4e/os_usa/f259ad94b245b2c51ec6a3de2b226c6209492cf7/en-us.json
- **[HSR-12]** HSR "Brilliant Fixation": https://operation-webstatic.hoyoverse.com/gacha_info/hkrpg/prod_official_usa/f8078dcc5eeecd4e41659b82cc5e8b2c6503e0f3/en-us.json
- **[ZZZ-3002]** ZZZ "Crimson Moon Casket": https://operation-webstatic.hoyoverse.com/gacha_info/nap/prod_gf_us/129af5085b8d7cfe7a57981a6a05622d828555eb/en-us.json

| Parameter | GI Epitome Invocation | HSR Light Cone Event Warp | ZZZ W-Engine Channel | Tag |
|---|---|---|---|---|
| Base 5★ / S | 0.700% | 0.800% | 1.000% | OFFICIAL |
| Consolidated 5★ / S | 1.850% | **1.870%** (not 2.1%) | 2.000% | OFFICIAL |
| Hard pity | 80 | 80 | 80 | OFFICIAL |
| Featured chance | 75.000%, split between **two** featured weapons | 75%; the other 25% is drawn from all 8 obtainable LCs **including** the featured one, so 78.125% effective | 75.000% | OFFICIAL / DERIVED |
| Guarantee after a lost 75/25 | yes | yes | yes | OFFICIAL |
| Official consolidated rate for the featured item | 1.480% (either of the two) | 1.534% (implies 78.125%) | 1.600% | OFFICIAL |
| Pick a specific item | **Epitomized Path**: 1 Fate Point since 5.0 | none | none ("Custom Search" only customizes the off-rate pool) | OFFICIAL |
| Base 4★ / A | 6.000% (3.000% char + 3.000% weapon) | 6.600% (3.300% + 3.300%) | 15.000% (13.125% W‑Engine + 1.875% agent) | OFFICIAL |
| Consolidated 4★ / A | 14.500% | 14.800% | 18.000% | OFFICIAL |
| 4★ guarantee | 10 (99.300% / 0.700%) | 10 (99.200% / 0.800%) | 10 | OFFICIAL |
| Featured 4★ | 75.000% + guarantee (5 featured) | 75% + guarantee (3 featured) | **75.000%** + guarantee (2 featured) | OFFICIAL |
| Carry-over | count and guarantee carry within weapon banners; **Fate Points reset when the banner ends** | carries across LC Event Warps | carries across W‑Engine Channels | OFFICIAL |

Verbatim quotes:
- **GI [GI-302]:** "Base probability of winning 5-star weapon = 0.700%; consolidated probability (incl. guarantee) = 1.850%; guaranteed to win 5-star weapon at least once per 80 attempts. The first time you win a 5-star weapon in this event wish, there is a 75.000% chance it will be one of the promotional weapons …" … "after charting a course towards a chosen weapon with "Epitomized Path," if you obtain a 5-star weapon that was not your chosen weapon, you will receive 1 Fate Point. Once you have reached the maximum amount of Fate Points, the next 5-star weapon will be guaranteed to be your chosen weapon." … "Consolidated probability of winning Beyond the Chrysalis (Sword) or Hymn of the Maelstrom (Catalyst) (incl. guarantee) = 1.480%." … "※ The Fate Points for this Wish are only valid for the current period … Once the Wish event is over, the number of Fate Points will reset to 0".
- **Max Fate Points = 1 since 5.0.** Official news, 16 Aug 2024: "the number of Fate Points needed for "Epitome Invocation" has been adjusted to 1" (https://genshin.hoyoverse.com/en/news/detail/125274). OFFICIAL. Before 5.0 it was 2 (GGanalysis code comment "2.0后至5.0前命定值为2"). COMMUNITY-DATA.
- **HSR [HSR-12]:** "the base chance of obtaining 5-star Light Cones is 0.800%, and the consolidated chance including the guarantee is 1.870%. Within 80 Warps, at least one 5-star Light Cone is guaranteed." … "there is a 75% chance that it will be the featured 5-star Light Cone … And there is a 25% chance that it will be any of the obtainable 5-star Light Cones of the current Warp phase, with equal chance among them." … "The consolidated chance of obtaining the featured rate-up 5-star Light Cone (including guarantees) is 1.534%."
- **ZZZ [ZZZ-3002]:** "the base probability of an S-Rank W-Engine is 1.000%. Within 80 Signal Searches, at least one S-Rank W-Engine is guaranteed. The overall probability of an S-Rank W-Engine (including the guarantee) is 2.000%. The combined probability (including pity) for the current limited S-Rank W-Engine is 1.600%." … "there is a 75.000% probability that the obtained A-Rank Signal will be one of the currently boosted A-Rank W-Engines."

> **⚠ Sources disagree (ZZZ A-rank):** The ZZZ Fandom page says a featured A-rank W-Engine is "a 50% chance" (https://zenless-zone-zero.fandom.com/wiki/W-Engine_Channel). The official Details text says **75.000%**. Use the official figure.

---

## 3. Soft pity: the community model

### 3.1 Primary analyses and their size

| Game | Primary analysis | Sample | Date | Tag |
|---|---|---|---|---|
| GI | OneBST (一棵平衡树), "用一千万抽，揭示原神抽卡系统全部细节" ("revealing every detail of Genshin's gacha with 10M wishes"), https://www.bilibili.com/video/BV19Y411W7W5. The Fandom wiki cites it as "Community estimation of gacha rates based on 9.45M total Wishes". Write-ups: https://www.bilibili.com/read/cv10468091 and NGA https://bbs.nga.cn/read.php?tid=26754637 (not accessed: login wall). | ~9.45M wishes | 19 Dec 2021 | COMMUNITY-DATA |
| HSR | OneBST, "用1500万抽暴力破解星穹铁道抽卡系统", https://www.bilibili.com/video/BV1nt421w7FE (data from feixiaoqiu.com and starrailstation.com) | 15M warps | 2 May 2024 | COMMUNITY-DATA |
| ZZZ | OneBST, "用700万抽破解绝区零抽卡隐藏机制", https://www.bilibili.com/video/BV1oW42197RR | 7M pulls | 21 Jul 2024 | COMMUNITY-DATA |
| All | GGanalysis toolkit encoding the models: https://github.com/OneBST/GGanalysis (241★, last push 3 Oct 2026) | — | — | COMMUNITY-DATA |
| GI (independent check) | My aggregation of paimon.moe's public tally API, e.g. https://api.paimon.moe/wish?banner=300106: **1,675,557,051 character-banner wishes** (98 banner phases, 26.9M 5★) and 422,950,235 weapon-banner wishes | 1.68B wishes | snapshot 28 Sep – 5 Oct 2026 | COMMUNITY-DATA + DERIVED |
| GI (older) | Keqing Mains evidence vault, "Soft pity is 74 on the featured character/standard banner, and 63 on the weapon banner" (v1.5, 3 Jun 2021, evidence = paimon.moe tally): https://library.keqingmains.com/evidence/general-mechanics/gacha | — | 2021 | COMMUNITY-DATA |

### 3.2 The formulas (exact code from GGanalysis)

From `GGanalysis/games/genshin_impact/gacha_model.py` (the same character table appears in the HSR and ZZZ modules):

```python
PITY_5STAR[1:74] = 0.006
PITY_5STAR[74:90] = np.arange(1, 17) * 0.06 + 0.006
PITY_5STAR[90] = 1
PITY_4STAR[1:9] = 0.051;  PITY_4STAR[9] = 0.051 + 0.51;  PITY_4STAR[10] = 1
PITY_W5STAR[1:63] = 0.007
PITY_W5STAR[63:77] = np.arange(1, 15) * 0.07 + 0.007
PITY_W5STAR[77] = 1
PITY_W4STAR[1:8] = 0.06;  PITY_W4STAR[8] = 0.06 + 0.6;  PITY_W4STAR[9] = 1
```

| Banner (pull n = pulls since the last 5★, counting this one) | P(5★ on pull n) | Source / tag |
|---|---|---|
| GI / HSR / ZZZ character | 0.6% for n ≤ 73; **0.6% + 6% × (n − 73)** for 74 ≤ n ≤ 89 (6.6% at 74, 12.6% at 75 … 96.6% at 89); 100% at 90 | GGanalysis; GI Fandom table "74 ≤ X ≤ 89: 0.6% + (X − 73) × 6%". COMMUNITY-DATA |
| GI weapon | 0.7% for n ≤ 62; **0.7% + 7% × (n − 62)** for 63 ≤ n ≤ 76; **100% at 77** (the official hard pity of 80 is never reached in the model) | GGanalysis; Fandom "X = 77: 100%". COMMUNITY-DATA |
| HSR light cone | 0.8% for n ≤ 65; 0.8% + 7% × (n − 65) for 66 ≤ n ≤ 79; 100% at 80 | GGanalysis `honkai_star_rail/gacha_model.py`. COMMUNITY-DATA |
| ZZZ W-Engine | 1.0% for n ≤ 64; 1.0% + 6% × (n − 64) for 65 ≤ n ≤ 79; 100% at 80 | GGanalysis `zenless_zone_zero/gacha_model.py`. COMMUNITY-DATA. That file's header still says the model is "根据游戏测试阶段推测" (inferred during testing), while the docs say it was refit on 7M pulls. |
| 4★: GI and HSR character | 5.1% for n ≤ 8; 56.1% at 9; 100% at 10 | GGanalysis; Fandom. COMMUNITY-DATA |
| 4★: GI weapon | 6% for n ≤ 7; 66% at 8; 100% at 9 | same |
| 4★: HSR light cone | 6.6% for n ≤ 7; 46.6% at 8; 86.6% at 9; 100% at 10 | GGanalysis |
| A-rank: ZZZ | flat 9.4% (agent channel) or 15% (W-Engine channel) until a guaranteed 10th pull; counter reset by an S-rank | GGanalysis |

Your belief is confirmed for the character banner: +6 percentage points per pull from pull 74. For the GI weapon banner the ramp starts at **63** but rises **+7 points per pull**, not +6.

### 3.3 Does it reproduce the official consolidated rates?

DERIVED (`models.py`), computing expected pulls per 5★ E and consolidated rate = 1/E:

| Banner | E (pulls per 5★) | Model consolidated | Official | Verdict |
|---|---|---|---|---|
| GI/HSR/ZZZ character | **62.297** | 1.6052% | 1.600% | matches (the wiki's community estimate is also 1.6052%) |
| GI weapon | 53.250 | 1.8779% | 1.850% | model ~1.5% high in relative terms (wiki community estimate 1.8779% also exceeds the official figure). Minor unresolved gap. |
| HSR light cone | 53.411 | 1.8723% | 1.870% | matches |
| ZZZ W-Engine | 49.893 | 2.0043% | 2.000% | matches |
| GI character 4★, coupled with 5★ (GGanalysis `stationary_p.py`) | — | 13.057% | 13.000% | matches |
| GI weapon 4★, coupled | — | 14.857% | 14.500% | model slightly high |
| ZZZ agent channel A, coupled with counter reset | — | 14.391% | 14.400% | matches |
| ZZZ W-Engine A, coupled | — | 18.135% | 18.000% | matches |

Distribution of pulls per 5★ on the character banner (DERIVED from the model): median 76, 90th percentile 80, 99th percentile 83. P(no 5★ by pull 73) = 64.45%, which is why most 5★ land between 74 and 80.

### 3.4 Independent check against 1.68 billion paimon.moe wishes (COMMUNITY-DATA, DERIVED aggregation)

I pooled every available character-banner phase (v1.3–7.1). Banners 300001–300008 and 400001–400007 return HTTP 400 because they predate the tally. The empirical hazard is pityCount[n] / pulls made at pity n:

| Pity n | 1 | 30 | 60 | 73 | **74** | 75 | 76 | 77 | 78 | 79 | 80 | 81 | 82 | 83 | 84 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| paimon.moe | 0.711% | 0.908% | 0.813% | 0.762% | **6.900%** | 12.946% | 18.953% | 24.907% | 30.881% | 36.832% | 42.784% | 48.716% | 54.549% | 60.240% | 65.551% |
| model | 0.6% | 0.6% | 0.6% | 0.6% | 6.6% | 12.6% | 18.6% | 24.6% | 30.6% | 36.6% | 42.6% | 48.6% | 54.6% | 60.6% | 66.6% |

- The step at 74 and the increments of +5.9 to +6.1 points per pull reproduce exactly. Sample sizes: 15.6M pulls at pity 74; 1.04M at 82.
- The flat region reads 0.71–0.91% instead of 0.6%. This is an artifact: when a user's imported history does not start right after a 5★, paimon understates their pity, which pushes high-pity 5★ into low-pity bins. Pities 85–90 have fewer than 70k pulls and are distorted the same way.
- Weapon banner: a jump from 1.41% at pity 62 to **8.37% at 63**, then 15.34, 22.27, 29.22, 36.09, 42.96, 49.74, 56.26 (about +7 points per pull). This confirms the weapon model.

**Average pulls per 5★, character banner:**

| Measure | Value | Tag |
|---|---|---|
| Model expectation | 62.297 (1.6052%) | COMMUNITY-DATA |
| paimon.moe raw ratio (all wishes ÷ all 5★) | 62.307 (1,675,557,051 / 26,891,911 = 1.6050%) | COMMUNITY-DATA |
| Median pity per banner (paimon) | 75–76 | COMMUNITY-DATA |
| Weighted mean of paimon's displayed `pityAverage` | 60.3, biased low by the truncation artifact above. Don't use it. | COMMUNITY-DATA |
| Weapon banner raw ratio | 54.40 pulls per 5★ (1.838%) vs model 53.25 | COMMUNITY-DATA |

---

## 4. Capturing Radiance (Genshin 5.0+)

### 4.1 What HoYoverse officially says (OFFICIAL)

1. **News post** "Capturing Radiance" Mechanic: You Ask, I Answer!, created 14 Aug 2024, published 16 Aug 2024, **updated 10 Feb 2025**: https://genshin.hoyoverse.com/en/news/detail/125274 (text fetched via the site's content API). The update reads: "The base probability of triggering "Capturing Radiance" is 0.018%. Including the possibility of triggering "Capturing Radiance," when winning a 5-star character in the event wish, there is a consolidated probability of 55.000% it will be the promotional character. If the promotional 5-star character is the second 5-star character you obtain on three consecutive occasions, the "Capturing Radiance" mechanic is guaranteed to be triggered the next time you obtain a 5-star character in a Wish."
2. **The live in-game Details [GI-301]**, 7.1, adds: "If it is not guaranteed to win the promotional 5-star character during this event wish, when winning a 5-star character, there is a chance of triggering the "Capturing Radiance" mechanic. If "Capturing Radiance" is triggered, the 5-star character you win in this event wish will be the promotional 5-star character." It also gives "Consolidated probability of winning 5-star character (incl. guarantee and Capturing Radiance) = 1.103%". Note that 1.103% = 1.6% / 1.45 = 1.6% / (2 − 0.55), i.e. HoYoverse's own figures assume a 55% win rate (DERIVED check).
3. **Japanese press** confirmed the February 2025 disclosure (Automaton, 12 Feb 2025): https://automaton-media.com/articles/newsjp/genshin-20250212-328100/ (ESTIMATE, reporting OFFICIAL).

So the **official facts** are:
- CR applies only to non-guaranteed ("50/50") 5★.
- It converts the result to the featured character.
- Base trigger probability 0.018%; consolidated featured rate 55.000%.
- Guaranteed trigger after three consecutive "lose, then get the featured via guarantee" cycles.

**Not disclosed:** any counter, how the trigger chance varies with state, or how the state resets.

Inference (DERIVED, not confirmed by HoYoverse): 0.018% = 0.6% × 3%. That is, the base chance per non-guaranteed 5★ is likely about 3%, expressed per pull like the 0.6% base rate.

### 4.2 Community reverse engineering (COMMUNITY-DATA unless noted)

- **OneBST, "用400万抽拆解捕获明光系统，比公示的更复杂"** ("4M pulls to take apart Capturing Radiance; more complex than disclosed"), 22 Nov 2024: https://www.bilibili.com/video/BV13XBiYZErT/. Sample about 4M pulls. The description says it "初步建立" (preliminarily establishes) a model.
- **GGanalysis's encoding of that model** (`CapturingRadianceModel`, commit 3d7c4f7066, 27 Nov 2024, parameterized in 0cef5a2956, 23 Feb 2025):
  - A counter with values 0–3.
  - +1 on a lost 50/50; −1 on a 50/50 won naturally (floor 0).
  - At counter 3, CR is certain (`CR_P = [0, 0, 0, 1]`); after a CR trigger the counter returns to 1.
  - Default starting counter is 1.
  - The code warns: "捕获明光机制还没有完全解析，模型计算出来的所需抽数会比实际更高" ("CR is not fully decoded; the model's pull counts will be higher than reality").
  - Before 27 Nov 2024 the code used a speculative table, `CR_PITY = [0, 0.5, 0.55, 0.95, 1]` (chance of not losing after k consecutive losses).
  - Source: https://github.com/OneBST/GGanalysis/blob/main/GGanalysis/games/genshin_impact/gacha_model.py

**Third-party claims (ESTIMATE, mutually inconsistent):**

| Claim | Source | Note |
|---|---|---|
| "a 10% chance to trigger Capturing Radiance" on a loss, "from 50/50 to 55/45" | Codashop, 27 Aug 2024: https://news.codashop.com/sg/?p=19221 | A flat 10% on losses gives exactly 55%, but contradicts the 0.018% / 3-streak disclosure |
| "连续歪2次后，下次75%不歪 … 连续歪3次后，下次100%不歪" (75% after 2 straight losses, 100% after 3) | 17173, 17 May 2025: https://news.17173.com/z/ys/content/05172025/104007773.shtml | The same article misstates 55% as the trigger probability |
| "33.333% … 66.667% … 100%" after the 1st, 2nd and 3rd consecutive loss, attributed to a "HoYoLAB community Q&A" | shattered.io, updated 30 Sep 2026: https://shattered.io/genshin-impact-50-50-odds-pity-2026/ | Low credibility: gives 5.0's date as "August 28, 2025" (actually 2024). I found no such Q&A. |

### 4.3 What each model implies (DERIVED, `cr_models.py`)

Steady state over non-guaranteed 5★. Pulls per featured = 62.297 × (2 − w).

| Model | Effective featured rate w | Pulls per featured | Featured rate per pull |
|---|---|---|---|
| No CR (pre-5.0; also ZZZ) | 50.000% | 93.45 | 1.070% |
| GGanalysis counter, CR only at counter 3 | 54.545% | 90.61 | 1.1036% |
| Consecutive-loss streak, guaranteed at 3, plus a flat 3% trigger (= 0.018%/0.6%) | 54.516% | 90.63 | **1.1034%** (closest to the official 1.103%) |
| Counter model plus a 3% trigger at counters 0–2 | 55.786% | 89.84 | — |
| 17173 claim (75% after 2, 100% after 3) | 55.172% | 90.22 | 1.108% |
| Flat 10% of losses converted (Codashop) | 55.000% | 90.33 | 1.107% |
| shattered.io claim (33/67/100) | ≈59.0% | — | — (contradicts the official 55%) |
| **Official** | **55.000%** | 90.66 (from 1/1.103%) | 1.103% |
| GGanalysis full model, C6 run (7 copies, start counter 1) | — | 637.09 per 7 copies = 91.0 each | — |

### 4.4 What paimon.moe actually observes (COMMUNITY-DATA, DERIVED aggregation)

I used paimon.moe's own formula, win = (featured − featured-via-guarantee) / (all 5★ − guaranteed 5★), the same one shown on its tally page.

| Era | Banner phases | 50/50 events | Observed win rate |
|---|---|---|---|
| pre‑5.0 (v1.3–4.8; true rate 50%) | 61 | 13,333,452 | **51.90%**. The +1.9 point bias comes from paimon treating the first tracked 5★ as non-guaranteed (`rateUp` starts false in `src/functions/wish.js`), so about 3.8% of "50/50s" are really guarantees. |
| 5.0–5.4 | 10 | 1,756,570 | 53.99% (≈52.2% after the same bias correction) |
| **5.5–7.1** | 27 | 3,533,590 | **58.69%** (≈**57.05%** bias-corrected) |

Per version (two banners each):
- 5.0: 52.00 / 51.87
- 5.1: 53.02 / 53.51
- 5.2: 54.23 / 54.44
- 5.3: 55.21 / 55.88
- 5.4: 54.65 / 55.43
- **5.5: 58.31 / 58.13**
- then flat at 58.1–59.7 through 7.1 (7.1: 58.86)

> **⚠ Sources disagree.** HoYoverse states 55.000%, and every model consistent with the official disclosure lands at 54.5–55.8%. paimon.moe data since 5.5 (March 2025) shows about 57% after correcting for its known bias, about 2 points above the official figure. The abrupt step at 5.5 points to either an undisclosed change or a tracking artifact I could not identify; I found no announcement of a 5.5 change. The 5.0–5.4 ramp is consistent with counters starting empty at 5.0.

### 4.5 Recommendation for the simulator

- Use a **counter / streak model** (the official 3-loss guarantee plus a small base trigger). It produces the right streak behaviour and lands at about 54.5–55% (matching the official 1.103%).
- Expose the effective rate as a sensitivity parameter, **55% (official) to 57% (paimon-observed)**.
- Label it "streak mechanics inferred; HoYoverse discloses only 0.018%, 55% and the 3-streak guarantee".

---

## 5. Currency and store (US)

### 5.1 Premium currency per pull: 160 in all three games

| Game | Rule | Source | Tag |
|---|---|---|---|
| GI | Intertwined Fate costs 160 Primogems: "Purchase 1 with 160 Primogems (unlimited)" | https://genshin-impact.fandom.com/wiki/Intertwined_Fate | OFFICIAL via wiki |
| GI | FTC ¶58: "Players can exchange Genesis Crystals for Primogems at a 1:1 ratio, meaning they can in effect spend 160 Genesis Crystals to buy a Wish token." | https://www.ftc.gov/system/files/ftc_gov/pdf/cognosphere_complaint.pdf | OFFICIAL-GOV |
| HSR | "Purchasing Star Rail Pass or Star Rail Special Pass … for Stellar Jade ×160 each." | https://honkai-star-rail.fandom.com/wiki/Stellar_Jade | OFFICIAL via wiki |
| ZZZ | Signal Shop "Master Tape Exchange": "Encrypted Master Tape ;; 160" Polychromes | https://zenless-zone-zero.fandom.com/wiki/Signal_Shop | OFFICIAL via wiki |

Paid currency converts 1:1: Genesis Crystal → Primogem, Oneiric Shard → Stellar Jade, Monochrome → Polychrome (same wiki pages).

### 5.2 US top-up ladder (identical in all three games)

| Price (USD) | Base | Bonus (normal) | Total (normal) | First purchase (double) | $/pull normal | $/pull first-time |
|---|---|---|---|---|---|---|
| $0.99 | 60 | 0 | 60 | 120 | $2.640 | $1.320 |
| $4.99 | 300 | 30 | 330 | 600 | $2.419 | $1.331 |
| $14.99 | 980 | 110 | 1,090 | 1,960 | $2.200 | $1.224 |
| $29.99 | 1,980 | 260 | 2,240 | 3,960 | $2.142 | $1.212 |
| $49.99 | 3,280 | 600 | 3,880 | 6,560 | $2.061 | $1.219 |
| $99.99 | 6,480 | 1,600 | 8,080 | 12,960 | **$1.980** | $1.234 |

Sources and tags:
- **Prices:** the official App Store listings (US storefront, accessed 4 Oct 2026; OFFICIAL):
  - GI: "60 Genesis Crystals | $0.99 … 300 | $4.99 … 980 | $14.99 … 1980 | $29.99 … 3280 | $49.99 … 6480 | $99.99", https://apps.apple.com/us/app/genshin-impact/id1517783697
  - HSR: "Oneiric Shard ×60 | $0.99 … ×6480 | $99.99", https://apps.apple.com/us/app/honkai-star-rail/id1599719154
  - ZZZ: "Monochrome ×60 | $0.99 … ×6480 | $99.99", https://apps.apple.com/us/app/zenless-zone-zero/id1606356401
  - FTC ¶58 lists the same six GI bundles: "60, 300, 980, 1,980, 3,280, and 6,480 Genesis Crystals, costing $0.99, $4.99, $14.99, $29.99, $49.99, and $99.99, respectively." (OFFICIAL-GOV)
- **Bonus and first-time amounts:** OFFICIAL via wiki ("assumes direct purchase on PC"):
  - https://genshin-impact.fandom.com/wiki/Genesis_Crystal
  - https://honkai-star-rail.fandom.com/wiki/Oneiric_Shard
  - https://zenless-zone-zero.fandom.com/wiki/Monochrome_Market
- **The first-time double is official:** "each top-up level of Genesis Crystals in the Crystal Top-Up page will be reset to provide a double bonus for the first top-up" (Initial Top-Up Bonus Reset notice, 15 Sep 2023, https://genshin.hoyoverse.com/en/news/detail/113023). OFFICIAL.
- **GI reset dates** (OFFICIAL via wiki): 28 Sep 2020, 1 Sep 2021, 28 Sep 2022, 27 Sep 2023, 28 Aug 2024, 10 Sep 2025, 23 Sep 2026. The 7.1 reset is also in the official "Version 7.1 Benefits Overview" (12 Sep 2026): "a reset of the Genesis Crystal first top-up bonus" (https://genshin.hoyoverse.com/en/news/detail/166086).
- **Using all six first-time bonuses once:** $200.94 for 26,160 = 163.5 pulls at $1.229/pull (DERIVED).
- **Tax:** since 3 Jun 2024 US prices are shown before sales tax. "The item purchase page for U.S. Travelers will then display the base price of the item, as well as the associated taxes and fees." Sources: https://genshin.hoyoverse.com/en/news/detail/123751 and HSR https://hsr.hoyoverse.com/en-us/news/123738. OFFICIAL.
- **Regional prices differ.** Examples: iOS EUR is €1.19…€119.99; CNY is ¥6…¥648 (OFFICIAL via wiki).
- The GI App Store list also shows "**Intertwined Fate ×10 | $21.99**". I could not verify what this item is (bundle, limited offer, or direct sale). **Not verified.**

### 5.3 Monthly pass

| | GI Blessing of the Welkin Moon | HSR Express Supply Pass | ZZZ Inter-Knot Membership | Tag |
|---|---|---|---|---|
| Price | $4.99 (App Store "Blessings Bundle \| $4.99"; wiki "US$4.99") | $4.99 (App Store "Express Supply Pass \| $4.99") | $4.99 (App Store "Inter-Knot Membership \| $4.99") | OFFICIAL |
| Up front | 300 Genesis Crystals | 300 Oneiric Shards | 300 Monochrome | OFFICIAL via wiki |
| Daily | 90 Primogems per login day | 90 Stellar Jade | 90 Polychromes | OFFICIAL via wiki |
| Days | 30, and **must log in**: "Failure to log in will result in a day being deducted … without the player receiving any Primogems" | 30 | 30 | OFFICIAL via wiki |
| Total | 3,000 (= 18.75 pulls, $0.266/pull) | 3,000 | 3,000 | DERIVED |
| Stacking cap | up to 180 days | up to 180 days | stackable (cap not stated) | OFFICIAL via wiki |

Wiki pages: https://genshin-impact.fandom.com/wiki/Blessing_of_the_Welkin_Moon · https://honkai-star-rail.fandom.com/wiki/Express_Supply_Pass · https://zenless-zone-zero.fandom.com/wiki/Inter-Knot_Membership

### 5.4 Battle pass (about one per version, roughly 6 weeks)

| | Price (App Store, OFFICIAL) | Premium currency and pulls | Other | Tag for contents |
|---|---|---|---|---|
| GI Gnostic Hymn | $9.99 | **680 Primogems + 4 Intertwined Fates** = 8.25 limited pulls ($1.21/pull, gems only, DERIVED) | 4★ BP weapon choice at level 30, materials. Free tier: 5 Acquaint (standard) Fates. Gnostic Chorus $19.99 (wiki: "$11.99 USD if the player has already purchased Gnostic Hymn") adds 10 levels and cosmetics. | OFFICIAL via wiki: https://genshin-impact.fandom.com/wiki/Battle_Pass |
| HSR Nameless Glory | $9.99 | **680 Stellar Jade + 4 Star Rail Special Passes** = 8.25 pulls | 4★ LC choice at level 30. Free Nameless Gift: 5 Star Rail Passes (standard). Nameless Medal $19.99 ($11.99 upgrade) adds 200 Jade. | OFFICIAL via wiki: https://honkai-star-rail.fandom.com/wiki/Nameless_Honor |
| ZZZ Growth Plan | $9.99 | **1,480 Polychromes**, "only … 680 of the Polychromes are given immediately", = 9.25 pulls, **no tapes listed** | Free Basic Plan: 5 Master Tapes (standard). Premium Plan: wiki "$21.99 (USD $19.99 First Premium Plan Purchase)"; App Store shows "Premium Plan \| $19.99". | OFFICIAL via wiki: https://zenless-zone-zero.fandom.com/wiki/New_Eridu_City_Fund |

> ⚠ The ZZZ Premium Plan price differs: wiki $21.99 (or $19.99 first purchase) vs App Store $19.99. The App Store may show the first-purchase price. ZZZ Growth Plan contents are from the wiki only (not cross-verified).

---

## 6. Free-to-play income

### 6.1 Genshin: recurring sources (per 42-day version)

| Source | Amount | Source / tag |
|---|---|---|
| Daily Commissions | 60/day: "Completing all 4 Daily Commissions and speaking to Katheryne rewards an additional 20 Primogems, giving a total of 60 Primogems each day" → 2,520 per 42 days | OFFICIAL via wiki: https://genshin-impact.fandom.com/wiki/Primogem |
| Spiral Abyss | 800 per monthly reset (16th of each month) → avg 1,120 per 42 days (800 or 1,600 depending on how many resets fall in the version) | OFFICIAL via wiki |
| Imaginarium Theater | 1,000 per monthly season (1st of each month) → avg 1,400 | OFFICIAL via wiki |
| Stygian Onslaught | 3 × 150 = 450 per iteration (about one per version) | OFFICIAL via wiki: https://genshin-impact.fandom.com/wiki/Stygian_Onslaught |
| HoYoLAB check-in | 60/month → avg 84 | OFFICIAL via wiki |
| Update compensation | **"Maintenance Compensation: Primogems ×300 (60 Primogems per hour the servers are down)"** and **"Issue Fix Compensation: Primogems ×300"** = 600 per version | OFFICIAL, 7.0 Update Details, 12 Aug 2026: https://genshin.hoyoverse.com/en/news/detail/165655 |
| Livestream codes | ~300 per version | ESTIMATE (Icy Veins 6.1, Gurugamer 6.3) |
| Monthly shop fates | Paimon's Bargains Stardust exchange: Intertwined Fate 75 Masterless Stardust, **5 per month** (≈7 per version). Starglitter exchange: 5 Starglitter per Fate, no monthly cap (funded by your own pulls; see 8.4). | OFFICIAL via wiki: https://genshin-impact.fandom.com/wiki/Paimon%27s_Bargains |
| **Recurring baseline** | 6,474 Primogems + 7 Fates ≈ **47.5 pulls per version**, before events, story and exploration | DERIVED |

### 6.2 Genshin: whole-version F2P estimates (ESTIMATE; most rely on the dataminer "hiragara")

| Version | Estimate | Source |
|---|---|---|
| 6.1 "Luna II" (22 Oct – 3 Dec 2025) | "9380 Primogems + 12 Intertwined (70 Wishes)". Welkin: "13160 … (94 Wishes)". Welkin + BP: "13840 … + 16 Intertwined (102 Wishes)". Breakdown: dailies 2,520; IT 2,000; Stygian 450; Abyss 800; shop 10 Intertwined; events 950 + 420 + 420; livestream 300; compensation 600; story 650 + 2 Fates. | Icy Veins, 16 Sep 2025: https://wp-prod.icy-veins.com/genshin-impact-6-1-primogem-overview-how-much-you-can-earn-next-patch/ |
| 6.3 "Luna IV" (Lantern Rite version) | 14,540 Primogems + 17 Intertwined (10 from Lantern Rite) → "~107 limited pulls". Breakdown: dailies 2,520; Abyss 1,600; Stygian 450; IT 1,000; Archon Quest 590; World Quests 400; exploration 1,850; Offering 950; achievements 290; maintenance 600; codes 300; events 1,840; Lantern Rite 1,600; other 550 | Gurugamer, 10 Dec 2025: https://gurugamer.com/mobile-games/genshin-impact-luna-iv-primogems-count-and-total-pulls-revealed-26029/amp |
| 7.0 | "14,120 Primogems" + "7 Fates"; the article says "105.25 Total Pulls", but 14,120/160 + 7 = **95.25**, so the stated total is internally inconsistent | topuplive, 5 Aug 2026: https://www.topuplive.com/news/genshin-impact-7-0-pull-count.html |
| 4.3 | "~50 pulls", described as the lowest ever (search snippet only, not fetched) | Sportskeeda: https://sportskeeda.com/esports/news-genshin-impact-4-3-primogems-leak-hints-less-rewarding-patch |

**Range across sources: about 50 to 107 limited pulls per version F2P; about 70–95 typical.** Welkin adds about 20–24 pulls per version and BP about 8 more. The per-month equivalent is ×30/42 (about 0.71), so roughly **35–75 pulls per month**. Big-region and Lantern Rite versions sit at the top of that range. DERIVED.

### 6.3 HSR F2P estimates (ESTIMATE)

| Version | Estimate | Source |
|---|---|---|
| Generic, per 42-day patch | "9,000 to 13,000 Stellar Jade … roughly 60 to 80 warps". Breakdown: daily ~2,520; Memory of Chaos, Pure Fiction and Apocalyptic Shadow "up to 800" each; events 3,000–5,000; codes ~300–500; Simulated/Divergent Universe ~200–400; mail/maintenance 300–600. ⚠ It also lists "Nameless Honor free track ~680", but per the wiki the free track gives 5 Star Rail Passes, not 680 Jade. | hostedgg (undated): https://hostedgg.com/blog/honkai-star-rail-stellar-jade-f2p-income-guide |
| 4.4 | "13,345 Star Jades (83 Spins)" F2P. ⚠ Its own table subtotal (15,385) doesn't match. | wotpack, 14 Jul 2026: https://wotpack.ru/en/podschet-zvezdnyh-nefritov-za-patch-4-4-v-honkai-star-rail/ |
| 4.5 (a **5-week** patch) | "about 9,990 Stellar Jade, 15 Star Rail Special Passes, and 15 Star Rail Passes … roughly 77 limited pulls". Express Supply Pass → 96; plus BP → 104. | allthings.how, 17 Aug 2026: https://allthings.how/honkai-star-rail-4-5-stellar-jade-count-and-total-pulls-explained/ |

Structural facts:
- Daily Training gives 60/day (ESTIMATE sources; consistent with GI).
- Pure Fiction and Apocalyptic Shadow each "refreshes every 6 weeks". OFFICIAL via wiki: https://honkai-star-rail.fandom.com/wiki/Pure_Fiction and https://honkai-star-rail.fandom.com/wiki/Apocalyptic_Shadow
- Embers Exchange sells Star Rail Special Passes, **5 per month**. OFFICIAL via wiki: https://honkai-star-rail.fandom.com/wiki/Embers_Exchange

**HSR range: about 60–83 limited pulls per version F2P, or about 43–60 per month.**

**Not verified:** a Deconstructor of Fun claim, surfaced by a search tool, that GI free income covers "~70% of the pulls needed for a guaranteed 5-star" per month, "with a single $20 purchase" closing the gap. The cited DoF article (https://www.deconstructoroffun.com/blog/2021/1/15/2021-predictions-3-rpg) does not contain it.

---

## 7. Spending behaviour in free-to-play mobile games

### 7.1 Payer conversion and concentration

| Statistic | Value | Source, date | Tag |
|---|---|---|---|
| Monthly payer share | "1.9 percent of all players made a purchase with real money during the month, an increase from 1.5 percent of players back in January 2014" | Swrve 2016 Monetization Report via Adweek; "over 20 million players in more than 40 free-to-play titles during the month of February 2016": https://www.adweek.com/performance-marketing/report-0-19-of-players-account-for-48-of-free-to-play-game-revenue/ | COMMUNITY-DATA (industry telemetry) |
| Concentration | "0.19 percent of all players account for 48 percent of all in-app purchase revenue"; "64 percent of paying players made just one purchase" | same | COMMUNITY-DATA |
| Concentration (2015) | "60 percent of all in-game revenues" from "only 0.23 percent of all players"; 2.3% paid in Jan 2015; top 10% of payers = 64% of revenue; average $29.17 per payer per month; average purchase $8.27 | Swrve 2015 via GamesBeat, 9 Apr 2015 (20M players, 40+ titles, Jan 2015): https://gamesbeat.com/in-mobile-games-60-of-revenues-come-from-0-23-of-players/ | COMMUNITY-DATA |
| Concentration (2014) | "0.13% of players are responsible for 60% of revenue"; 1.35% of MAU paid in July 2014; top 10% of payers = 62%; $24.93 per payer per month | Swrve via WN Hub, 24 Sep 2014: https://wnhub.io/news/finance/item-8701 | COMMUNITY-DATA |
| Concentration (Jan 2014) | "the top decile represents only 0.15 percent of all players" and generated "50.8 percent of in-game revenue"; "only 1.5 percent of active players" paid that month | Swrve monthly monetisation report via PocketGamer.biz, 26 Feb 2014: https://www.pocketgamer.biz/chart-of-the-week-half-of-in-game-revenue-generated-by-just-015-of-players/ | COMMUNITY-DATA |
| Spender cohorts (2015) | ~175M users over three months: "Defaulters = 114 million – 97.91%", "Minnows = 1.2 million – 1.03%", "Dolphins = 1 million – 0.86%", "Whales = 230 thousand – 0.20%"; whales "about 86.6%" of income. Tiers by spend: minnows under $1, dolphins $1–$32, whales over $32 | GameAnalytics (Bilas, Colom, Gheza) via WN Hub "How to recognize a whale?", 30 Sep 2015: https://wnhub.io/news/other/item-10360; thresholds via SiliconANGLE, 7 Sep 2015: https://siliconangle.com/?p=246580 | COMMUNITY-DATA |
| Variation between games | $4.7B of spending by 69M players in 2,873 mobile games (Aug 2020 – Apr 2022, with Unity). Four clusters: uniform, sub-Pareto, quasi-Pareto, hyper-Pareto; hyper-Pareto is "just under 12%" of games, with the top 1% of spenders giving about 40% of revenue | SDU (Games Globally / Metaverse Lab) white paper: https://gamesglobally.sdu.dk/project-2_white-paper.html; paper in ACM Games, https://doi.org/10.1145/3582927 (ACM page returned 403; figures from the SDU page and search summaries) | COMMUNITY-DATA (peer-reviewed) |
| Conversion by genre | top 15% of games convert "0.8-1.2%"; **Role Playing "3%"**, Strategy "2.5%"; other genres "rarely convert more than 1%". ARPPU: top 15% "about $20"; Action and RPG "$27-31" | GameAnalytics Mobile Gaming Benchmarks 2019 (75K+ games, 3B users, Jun 2018 – May 2019) via Game World Observer, 1 Jul 2019: https://gameworldobserver.com/?p=1979 | COMMUNITY-DATA |
| Loot-box spend concentration (academic) | Top 5% of loot-box spenders (> $100/month) generate about half of loot-box revenue; spend correlates with problem gambling (ρ = 0.34); n = 7,767 purchasers (self-report) | Close, Spicer, Nicklin, Uther, Lloyd & Lloyd (2021), *Addictive Behaviors* 117:106851, https://doi.org/10.1016/j.addbeh.2021.106851. Figures are from search-result summaries of the repository pages (https://pureportal.bcu.ac.uk/en/publications/secondary-analysis-of-loot-box-data-are-high-spending-whales-weal/). I could not retrieve the abstract itself (the page shows metadata only; the Plymouth copy returns 404). | COMMUNITY-DATA (peer-reviewed survey) |
| GI scale | "HoYoverse has grossed more than $4 billion by selling in-game digital content to players"; "downloaded over 120 million times worldwide" | FTC complaint ¶¶25–27, filed 17 Jan 2025 | OFFICIAL-GOV |
| GI mobile revenue | "$3 billion in global lifetime player spending across the App Store and Google Play"; "averaged revenue of $1 billion every six months"; China 30.7%, Japan 23.7%, US 19.7% | Sensor Tower, May 2022: https://sensortower.com/blog/genshin-impact-three-billion-revenue | ESTIMATE (model-based store estimates) |

### 7.2 Minnow / dolphin / whale definitions

| Definition | Source | Tag |
|---|---|---|
| Whales spend "more than $25 per month in-game"; dolphins "between $5 and $24.99 per month"; minnows are implicitly under $5/month. Survey split: iOS 3% whales / 19% dolphins; Android 3% / 15%. | EEDAR via PocketGamer.biz, 21 Nov 2012: https://www.pocketgamer.biz/r/PG.Biz/EEDAR+news/feature.asp?c=46751 | ESTIMATE (survey) |
| Whales > $100 (period unspecified); "mega whales" > $1,000; whales are "1-2% of the total player base" contributing "50% to 70%" of revenue (no primary source given) | Udonis blog, 3 Jul 2024: https://blog.udonis.co/mobile-marketing/mobile-games/mobile-games-whales | ESTIMATE |
| Relative definition: top 10% of payers = 62–64% of revenue | Swrve 2014–2015 (above) | COMMUNITY-DATA |

### 7.3 Gacha- and HoYoverse-specific data

- **Not verified / not public.** I found no HoYoverse payer-conversion or ARPPU figure. HoYoverse is private and doesn't publish them, and analyst searches turned up none.
- The closest genre benchmark is GameAnalytics' RPG conversion of about 3% (2019).
- Self-selected surveys of gacha players report about two-thirds having spent (e.g. "32.33% … don't spend"; ScienceDirect paper S2451958824000381, fetch blocked). These sample engaged fans and measure "ever paid", so they are **not comparable** to monthly payer rates. ESTIMATE, not verified.

---

## 8. Cost of a featured 5★ (C0) and a maxed one (C6) in USD

### 8.1 Official and government figures

- **HoYoverse disclosure to US players** (from the 5.6 update, May 2025, after the FTC action):
  - Event-exclusive 5★ character: "**$1.98 to $475.2**".
  - Featured 5★ weapon: "**$1.98 to $422.4**".
  - Reported by ixbt.games, 7 May 2025 (https://ixbt.games/en/news/2025/05/07/avtorov-genshin-impact-zastavili-raskryt-cenu-vybivaniya-geroev-v-gace-v-ssa-34-tysyaci-rublei-ne-pr.html) and Pocket Tactics (updated 8 May 2025): "the cost of obtaining a five-star event-exclusive character may vary from $1.98 to $475.2 (if purchased in USD)" (https://www.pockettactics.com/genshin-impact/five-star-cost).
  - Tag: OFFICIAL as reported. The text is not present in the `gacha_info` JSON I fetched, so I could not see the original wording.
  - The math decomposes exactly (DERIVED): $1.98 = 1 pull at the $99.99 rate (160 × 99.99/8080); $475.20 = 180 pulls at the $0.99 rate (28,800 × 0.99/60); $422.40 = 160 pulls at the $0.99 rate.
- **FTC complaint** (US v. Cognosphere, No. 2:25-cv-00447, filed 17 Jan 2025): https://www.ftc.gov/system/files/ftc_gov/pdf/cognosphere_complaint.pdf. OFFICIAL-GOV, allegations in a case settled for $20M. Press release: https://www.ftc.gov/news-events/news/press-releases/2025/01/genshin-impact-game-developer-will-be-banned-selling-lootboxes-teens-under-16-without-parental
  - ¶58: "the true cost to open a loot box is generally between $2 to $3, depending on the virtual currency bundle purchased"
  - ¶78: "HoYoverse offers consumers only a 0.3% (three in one thousand) chance of obtaining the specific featured hero when they open loot boxes … even if a consumer opens 50 loot boxes in a row, the consumer has odds of less than 15%". This is the 0.6% × 50% base rate; it ignores soft pity, guarantees and CR.
  - ¶80: "a consumer may need to open as many as 180 loot boxes, at a cost of $2–3 per loot box (or as much as $360–540 in total), simply to get the prize that HoYoverse features on the Event Banner."

### 8.2 Commonly cited journalist figures (ESTIMATE)

| Figure | Method | Source |
|---|---|---|
| "$475.2" worst case per limited 5★; "$21k, or more" for all 44 limited 5★ ("44 x 180 (max pity) = 7,920 wishes"; "44 x $475.2 = $20,908.8") | Worst-case pity at the $0.99 rate (the official disclosure) | Pocket Tactics, updated 8 May 2025 (above) |
| "180 wishes … an estimated US$500" per 5★; C6 "at most US$3,000 in a worst-case scenario" | ⚠ Multiplies by **6**, but C6 needs **7 copies** (C0 + 6), so its own logic gives 1,260 wishes | ONE Esports, 6 Dec 2024: https://www.oneesports.gg/genshin-impact/alden-richards-c6-kamisato-ayato/ |
| C6 "$3,000" worst case; "$2,000 with good pity and losing three 50/50s" | not fetched (HTTP 403); search snippet only, **not verified** | Pro Game Guides: https://progameguides.com/genshin-impact/how-much-does-it-cost-to-c6-a-5-star-in-genshin-impact/ |

### 8.3 Expected and worst case (DERIVED)

Pull counts are from the official consolidated rates and GGanalysis (`gga_run.py`). Prices: $1.98/pull is the best normal rate ($99.99 pack); $2.64/pull is the worst ($0.99 pack).

| Target | Expected pulls | $ at $1.98 | $ at $2.64 | Worst-case pulls | Worst $ ($1.98 / $2.64) |
|---|---|---|---|---|---|
| GI featured C0 (CR era) | **90.7** (official 1/1.103%); 91.0 (GGanalysis CR model); 93.4 pre‑5.0 | **$180** | $239 | 180 | $356 / **$475** |
| GI C6 (7 copies) | **634.6** (7 × official); 637.1 (GGanalysis CR model); 654.1 pre‑5.0 | **$1,257** | $1,675 | 1,260 | $2,495 / $3,326 |
| GI chosen 5★ weapon R1 (Epitomized Path) | 86.5 | $171 | $228 | 160 | $317 / $422 |
| GI chosen weapon R5 | 432.7 | $857 | $1,142 | 800 | $1,584 / $2,112 |
| HSR featured E0 | 89.8 (1/1.113%); 89.55 GGanalysis | $178 | $237 | 180 | $356 / $475 |
| HSR E6 (7 copies) | 626.9 | $1,241 | $1,655 | 1,260 | $2,495 / $3,326 |
| ZZZ featured M0 | 93.7 (1/1.067%) | $186 | $247 | 180 | $356 / $475 |
| ZZZ M6 | 654.1 | $1,295 | $1,727 | 1,260 | $2,495 / $3,326 |

GGanalysis quantiles for GI (CR model):
- C0, pulls at [10, 25, 50, 75, 90, 99]th percentiles: [34, 75, 80, 135, 155, 161].
- C6: [503, 569, 640, 709, 768, 856].

### 8.4 What the common figures leave out

All of these reduce real-money cost. DERIVED unless tagged.

1. **F2P income and pity carried in** (topic 6).
2. **First-time doubles:** about $1.23/pull for the first 163 pulls after each reset.
3. **Welkin:** $0.27/pull, capped at 18.75 pulls per 30 days.
4. **Battle pass:** $1.21/pull for 8.25 pulls.
5. **Duplicate refunds.** The official refund rules ([GI-301]/[GI-302]):
   - 4★ weapon: Starglitter ×2.
   - Duplicate 4★ character: ×2, or ×5 after C6.
   - 5★ weapon or duplicate 5★: ×10, or ×25 after C6.
   - An Intertwined Fate costs 5 Starglitter (wiki).
   - HSR equivalent: Undying Starlight ×8 per 4★ and ×40 per 5★; a Special Pass costs 20 Starlight (wiki, https://honkai-star-rail.fandom.com/wiki/Starlight_Exchange).
   - ZZZ equivalent: Residual Signal ×8 per A-rank and ×40 per S-rank; a tape costs 20 Residual Signals.
   - With about 13% of pulls being 4★, refunds return roughly 2% (new account) to about 12% (veteran with C6 4★s) of pulls. That is a cost multiplier of about 0.88–0.98. These rough assumptions rely on the unsourced 4★ split in 1.4.

---

## 9. Where sources disagree

1. **GI effective 50/50 with CR:** official 55.000% vs paimon.moe observed 58.7% raw (≈57.0% bias-corrected) since 5.5. Third-party claims range from "10% flat" to "33/67/100%". Section 4.
2. **HSR "50%" headline vs the official 1.113%:** the latter implies 56.25%, because the featured character is inside the 8-character loss pool. The GGanalysis/OneBST 15M-pull study had found "UP rates higher than officially published" (2 May 2024). Today's official Details text discloses the higher consolidated figure, so they agree.
3. **HSR light cone consolidated rate is 1.870%**, not 2.1%. The featured LC is effectively 78.125% (official 1.534%).
4. **ZZZ featured A-rank W-Engine:** Fandom says 50%; official says 75.000%.
5. **GI weapon consolidated:** official 1.850% vs the community model's 1.8779%. The model also reaches 100% at pull 77, not 80. Minor, unresolved.
6. **ZZZ A-rank:** official 14.4% vs a naive no-coupling model's 14.98%. Resolved by GGanalysis's "S-rank resets the A-rank counter" (coupled model 14.39%).
7. **ZZZ Premium Plan price:** wiki $21.99 ($19.99 first) vs App Store $19.99.
8. **F2P counts:** wotpack 4.4 (table subtotal ≠ total), topuplive 7.0 (sum ≠ stated total), hostedgg (free BP "680 Jade" contradicts the wiki).
9. **C6 cost:** ONE Esports uses 6 copies instead of 7.
10. **Your premise "~pull 63, similar to +6pp" for the GI weapon banner:** the community model is +7pp per pull from 63.

## 10. Not verified

- Original wording and placement of the US cost disclosure ($1.98–$475.20 / $422.40). Seen only via press; the `gacha_info` JSON for US banners doesn't contain it.
- The internal CR mechanics: counter, per-state trigger chances, starting state. HoYoverse doesn't disclose them. The community model is self-described as incomplete. The cause of the 5.5 step in observed win rate is unknown.
- What the GI App Store item "Intertwined Fate ×10 | $21.99" is.
- Any HoYoverse-specific payer conversion, ARPPU or whale share.
- The Deconstructor of Fun "70% / $20" claim.
- Close et al. 2021 exact abstract wording (summary only).
- Sportskeeda 4.3 (~50 pulls) and Pro Game Guides C6 figures (search snippets only; sites block fetches).
- ZZZ Growth Plan contents (wiki only; not cross-checked).
- NGA write-up of the GI model (tid 26754637): login wall.

---

## Numbers to use as defaults

"Pulls per featured" uses E = 62.297 pulls per 5★ unless noted.

| Parameter | Value | Source | Confidence |
|---|---|---|---|
| Gems per pull (all three games) | 160 | wikis; FTC ¶58 | OFFICIAL (via wiki / OFFICIAL-GOV) |
| Char banner base 5★ | 0.6% | [GI-301], [HSR-11], [ZZZ-2002] | OFFICIAL |
| Char banner consolidated 5★ | 1.6% (model 1.6052%) | same | OFFICIAL |
| Char banner hard pity | 90 | same | OFFICIAL |
| Char banner soft pity | p(n) = 0.6% for n ≤ 73; 0.6% + 6%·(n−73) for 74–89; 100% at 90 | GGanalysis; 9.45M-wish study; paimon 1.68B wishes | COMMUNITY-DATA |
| Expected pulls per 5★, char banner | 62.3 (median 76) | GGanalysis; paimon raw 62.31 | COMMUNITY-DATA |
| GI 50/50 (non-guaranteed featured chance) | 55% (sensitivity 54.5–57%) | [GI-301]; news 125274 | OFFICIAL (sensitivity: COMMUNITY-DATA) |
| GI CR guaranteed trigger | after 3 consecutive lost 50/50 cycles | same | OFFICIAL |
| GI CR base trigger | 0.018% per pull (≈3% per non-guaranteed 5★, inferred) | same | OFFICIAL / DERIVED |
| HSR 50/50 effective | 56.25% (50% + 50% × 1/8) | [HSR-11] (1.113%) | OFFICIAL (implied) |
| ZZZ 50/50 | 50% | [ZZZ-2002] (1.067%) | OFFICIAL |
| Guarantee after a lost 50/50 | next 5★ featured, all three games | Details pages | OFFICIAL |
| Pity and guarantee carry-over | yes, within banner type (GI CEW + CEW‑2 shared); GI Fate Points reset per banner | Details pages; news 104088 | OFFICIAL |
| Char banner base 4★ | GI/HSR 5.1%; ZZZ 9.4% | Details pages | OFFICIAL |
| Char banner consolidated 4★ | GI/HSR 13%; ZZZ 14.4% | Details pages | OFFICIAL |
| 4★ soft pity, char | 5.1% to pull 8; 56.1% at 9; 100% at 10 (ZZZ: flat 9.4%, 100% at 10, reset by S) | GGanalysis | COMMUNITY-DATA |
| Featured 4★ (char banner) | 50% + guarantee | Details pages | OFFICIAL |
| GI weapon base / consolidated / hard | 0.7% / 1.85% / 80 | [GI-302] | OFFICIAL |
| GI weapon soft pity | 0.7% to 62; 0.7% + 7%·(n−62) for 63–76; 100% at 77 | GGanalysis; paimon | COMMUNITY-DATA |
| GI weapon featured | 75% (either of 2); Epitomized Path = 1 Fate Point; chosen-weapon E = 86.5 pulls, worst 160 | [GI-302]; news 125274; GGanalysis | OFFICIAL / COMMUNITY-DATA |
| HSR light cone base / consolidated / hard | 0.8% / 1.87% / 80 | [HSR-12] | OFFICIAL |
| HSR light cone soft pity | 0.8% to 65; +7%/pull from 66; 100% at 80 | GGanalysis (15M) | COMMUNITY-DATA |
| HSR light cone featured effective | 78.125% (75% + 25% × 1/8; official 1.534%) | [HSR-12] | OFFICIAL (implied) |
| ZZZ W-Engine base / consolidated / hard | 1.0% / 2.0% / 80 | [ZZZ-3002] | OFFICIAL |
| ZZZ W-Engine soft pity | 1% to 64; +6%/pull from 65; 100% at 80 | GGanalysis (7M) | COMMUNITY-DATA |
| ZZZ W-Engine featured | 75% (official 1.600%) | [ZZZ-3002] | OFFICIAL |
| Weapon-type banner 4★ | GI 6% / 14.5%; HSR 6.6% / 14.8%; ZZZ 15% / 18%; featured 75% in all | Details pages | OFFICIAL |
| Expected pulls per featured char | GI 90.7; HSR 89.8; ZZZ 93.7 | 1 / official featured rate | OFFICIAL / DERIVED |
| Expected pulls for C6 | GI ≈ 635 (GGanalysis 637); HSR ≈ 627; ZZZ ≈ 654 | GGanalysis | DERIVED |
| Worst-case pulls | 180 (C0); 1,260 (C6); 160 (GI chosen weapon) | rules | OFFICIAL / DERIVED |
| US price ladder | $0.99/60; $4.99/300+30; $14.99/980+110; $29.99/1,980+260; $49.99/3,280+600; $99.99/6,480+1,600 | App Store + wikis | OFFICIAL / OFFICIAL via wiki |
| First purchase per tier | double base (60+60 … 6,480+6,480), resets yearly (GI last 23 Sep 2026) | news 113023, 166086 | OFFICIAL |
| $ per pull | $1.98 (best normal); $2.64 (worst); ~$1.23 (first-time) | DERIVED from ladder | DERIVED |
| Monthly pass | $4.99 → 300 up front + 90/day × 30 days = 3,000 (log-in required) | App Store + wikis | OFFICIAL / OFFICIAL via wiki |
| Battle pass | $9.99 → GI/HSR 680 + 4 limited pulls; ZZZ 1,480 Polychromes | App Store + wikis | OFFICIAL / OFFICIAL via wiki |
| Version length | ~42 days. GI 7.0 went live 12 Aug 2026 and 7.1 on 23 Sep 2026 (42 days). HSR 4.5 was a 5-week patch. | news 165593, 166086; allthings.how | OFFICIAL / DERIVED (HSR: ESTIMATE) |
| GI F2P per version | ~70–95 limited pulls (range 50–107); recurring floor ≈ 47 | estimates; wiki-derived floor | ESTIMATE / DERIVED |
| HSR F2P per version | ~70–80 limited pulls (range 60–83) | estimates | ESTIMATE |
| Update compensation (GI) | 600 per version (300 + 300) | news 165655 | OFFICIAL |
| Monthly payer conversion | 1.5–2.3% (all F2P mobile); ~3% for RPGs | Swrve 2014–16; GameAnalytics 2019 | COMMUNITY-DATA |
| Revenue concentration | 0.13–0.23% of players → 48–60% of revenue; top 10% of payers → 62–64% | Swrve | COMMUNITY-DATA |
| Whale / dolphin share of all players | whales 0.13–0.23% across five studies (mean 0.18%; GameAnalytics 0.20%); dolphins 0.86% (GameAnalytics, the only measured figure). Varies a lot by game (SDU/Unity). | Swrve 2014–16; GameAnalytics 2015; SDU/Unity (ACM Games, data 2020–22) | COMMUNITY-DATA |
| Spender tiers | minnow < $5/mo; dolphin $5–24.99/mo; whale ≥ $25/mo. Alternative high-spender cut: > $100/mo (Close et al.'s top-5% threshold; Udonis "whale" > $100). | EEDAR 2012; Close et al. 2021; Udonis 2024 | ESTIMATE / COMMUNITY-DATA |
| Duplicate refunds | 4★ → 2 Starglitter (5 at C6+); 5★ dup/weapon → 10 (25 at C6+); 1 Fate = 5 Starglitter | [GI-301]/[GI-302]; wiki | OFFICIAL / OFFICIAL via wiki |
