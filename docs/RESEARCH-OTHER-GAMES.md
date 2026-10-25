# Gacha Lab: non-HoYoverse banner presets, sourced brief

Researched 5 Oct 2026 (UTC). Covers Wuthering Waves, Arknights, Fate/Grand Order (NA), Blue Archive (Global), Umamusume: Pretty Derby (Global), Goddess of Victory: NIKKE, Granblue Fantasy and Reverse: 1999. Companion to `research.md` (HoYoverse).

## How to read this brief

| Tag | Meaning |
|---|---|
| **OFFICIAL** | The publisher's own text, fetched from the publisher: official site or news API, official web notice, official forum post, or an official social post reproduced verbatim with attribution. |
| **OFFICIAL via wiki** | In-game Details text as transcribed (sometimes paraphrased) by a fan wiki. |
| **OFFICIAL via repost** | Official patch notes or banner text copied verbatim by a third-party site. |
| **COMMUNITY-DATA** | Large pull datasets, data mining (including verbatim client strings), reverse engineering (GGanalysis). |
| **ESTIMATE** | Guides, press, calculators, opinion. |
| **DERIVED** | My arithmetic on cited inputs. Not a new source. Scripts and raw data: `scratchpad/lootlab/src2/` (`analyze_wuwatracker.py`, `wuwatracker_analysis.txt`, `derived.py`, `derived_out.txt`, `gga/`, `ak_data/`, `ba/`, `uma/`, `fgo/`, `gbf/`, `r1999/`, `verify/`). |

Access notes:
- Fandom wikis and bluearchive.wiki were read through their MediaWiki API (`api.php?action=parse`), so wiki quotes come from the raw wikitext. Templates are shown as their plain-text output: `{{ItemCard|Pyroxene|quantity=120}}` is quoted as "120 Pyroxene".
- arknights.wiki.gg and games.gg block scripted requests. I read them with the WebFetch tool and asked for character-for-character copies. Treat those quotes as very likely verbatim, but they passed through a summariser.
- gbf.wiki blocks all automated access (Cloudflare). I used the Wayback Machine snapshot of 29 Jul 2026.
- Prydwen returns HTTP 403, and its blog now redirects to its home page. Bilibili's API returned "请求过于频繁" (rate-limited), so GGanalysis's linked write-ups could not be read.
- Official pages fetched directly:
  - FGO NA: `webview.fate-go.us`
  - Blue Archive Global: the Nexon forum JSON API `forum.nexon.com/api/v1/thread/<id>?alias=bluearchive-en`
  - Blue Archive JP: `api-web.bluearchive.jp/api/news/detail?id=<id>`
  - Umamusume Global: `umamusume.com/api/ajax/pr_info_detail?format=json`, POST `{"announce_id":N}`
  - Arknights: in-game announcement endpoints (Global and CN). These turned out to be image-only.
- All scripted requests used a generic browser User-Agent and no credentials.
- Nothing below is filled from memory. Anything I could not check is marked **not verified**.

---

## 1. Wuthering Waves (Kuro Games): Featured Resonator Convene

### 1.1 Official rules

| Parameter | Value | Quote / row | Source | Tag |
|---|---|---|---|---|
| Base 5★ rate | 0.8% | table row "5-star Resonator \| 0.8% \| 1.8%" (columns: Base Rate, Average Rate including Guarantee) | [WW-1] Fandom "Featured Resonator Convene", https://wutheringwaves.fandom.com/wiki/Featured_Resonator_Convene | OFFICIAL via wiki |
| Consolidated 5★ | 1.8% | same row; also "The average drop rate (including the Guarantee) is 1.8%." | [WW-1]; [WW-2] wutheringwaves.gg "Convene Details", 29 May 2024, https://wutheringwaves.gg/convene-details/ | OFFICIAL via wiki |
| Hard pity | 80 | "One 5-Star Resonator is guaranteed every 80 Convenes." | [WW-1] | OFFICIAL via wiki |
| Featured chance | 50% | "There is the 50% chance of obtaining the promotional 5-star." | [WW-1] | OFFICIAL via wiki |
| Guarantee after a miss | yes | "If the 5-star obtained is not the promotional 5-star, the next 5-star is guaranteed to be the promotional 5-star." | [WW-1] | OFFICIAL via wiki |
| Pity shared across banners | yes | "The guarantee count is shared among all [Anniversary Resonator Convene] and [Featured Resonator Convene] event banners." | [WW-3] Kuro Games press release, v2.3 Phase II, 22 May 2025, via Game Developer: https://www.gamedeveloper.com/press-release/wuthering-waves-fiery-arpeggio-of-summer-reunion-version-2-3-phase-ii-available-now | OFFICIAL |
| Base / consolidated 4★ | 6.0% / 12.0% | row "4-star Resonator or Weapon \| 6.0% \| 12.0%"; "Every 10 convenes, at least one Resonator or Weapon of 4-star or higher rarity is guaranteed." | [WW-1] | OFFICIAL via wiki |
| Astrite per pull | 160 | Radiant Tide: "Bought for 160 Astrites in the Tidal Exchange". Convene page: "Players can buy either of the two Tides for 160 Astrite each" | [WW-4] https://wutheringwaves.fandom.com/wiki/Radiant_Tide and https://wutheringwaves.fandom.com/wiki/Convene | OFFICIAL via wiki |

I could not retrieve the in-game Convene Details text itself. The wiki paraphrases it, and the fan site [WW-2] gives the same numbers.

### 1.2 Soft pity: community data

**Model (GGanalysis).** Code from https://github.com/OneBST/GGanalysis/blob/main/GGanalysis/games/wuthering_waves/gacha_model.py:

```python
PITY_5STAR = np.zeros(80)
PITY_5STAR[1:66] = 0.008
PITY_5STAR[66:71] = np.arange(1, 5+1) * 0.04 + PITY_5STAR[65]
PITY_5STAR[71:76] = np.arange(1, 5+1) * 0.08 + PITY_5STAR[70]
PITY_5STAR[76:80] = np.arange(1, 4+1) * 0.1 + PITY_5STAR[75]
PITY_5STAR[79] = 1
```

- The file header warns: "注意，本模块使用概率模型仅为根据游戏测试阶段推测，不能保证完全准确" ("the model was inferred during the game's test phase; accuracy not guaranteed").
- The write-up it links (https://www.bilibili.com/read/cv34870533/) was rate-limited and not read.
- In words: 0.8% to pull 65, then +4 pp/pull for 66–70 (4.8% → 20.8%), +8 pp/pull for 71–75 (28.8% → 60.8%), +10 pp/pull for 76–78 (70.8%, 80.8%, 90.8%), and 100% at **79**.
- Tag: COMMUNITY-DATA.

**Independent check: wuwatracker.com global stats** [WW-7].
- I pulled the "5✦ Pulls per Pity" histogram embedded in each Featured Resonator banner page, `https://wuwatracker.com/tracker/stats/100001` … `/100043` (23 May 2024 → current banner, fetched 5 Oct 2026).
- Totals: 43 banners; per-banner tracked pulls sum to **476,096,327**; **8,918,482 5★ outcomes**.
- Empirical hazard = 5★ obtained at pity n ÷ 5★ spells that reached pity n. Tags: COMMUNITY-DATA + DERIVED aggregation.

| Pity n | 1 | 30 | 60 | 65 | **66** | 67 | 68 | 69 | 70 | **71** | 72 | 73 | 74 | 75 | 76 | 77 | 78 | 79 | 80 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| wuwatracker | 0.969% | 0.923% | 0.943% | 0.983% | **4.952%** | 8.932% | 12.911% | 16.864% | 20.842% | **28.814%** | 36.710% | 44.644% | 52.433% | 60.077% | 69.208% | 76.498% | 77.257% | 66.436% | 100% |
| GGanalysis | 0.8% | 0.8% | 0.8% | 0.8% | 4.8% | 8.8% | 12.8% | 16.8% | 20.8% | 28.8% | 36.8% | 44.8% | 52.8% | 60.8% | 70.8% | 80.8% | 90.8% | 100% | — |
| Spells at risk | 8.92M | 6.77M | 5.15M | 4.90M | 4.85M | 4.61M | 4.20M | 3.66M | 3.04M | 2.41M | 1.71M | 1.08M | 601k | 286k | 114k | 35k | 8.3k | 1.9k | 630 |

What the check shows:
- The step at 66 and the +4 pp (66–70) and +8 pp (71–75) ramps reproduce within 0.8 pp.
- The flat region reads ~0.93% instead of 0.8%. This is the same artifact seen in paimon.moe (`research.md` 3.4): imported histories that start mid-spell understate pity and push high-pity 5★ into low bins.
- Beyond 75 the data fall below the model, and 630 spells are recorded at pity 80. Samples are small, and wuwatracker itself flags "This pity number is invalid, due to a pull history inconsistency" for some records.
- The 50/50 looks genuine. Standard 5★ (Verina, Encore, Calcharo, Lingyang, Jianxin) are **32.914%** of all 5★, against 33.333% expected for a true 50/50 with guarantee. That implies a 50.9% win rate (DERIVED), so there is no hidden boost like Genshin's Capturing Radiance.

**Consolidated-rate check (DERIVED, `derived.py`).**
- The GGanalysis model gives 54.10 pulls per 5★ = **1.848%**, against the official 1.8% (55.6 pulls). Median 68, p90 73, p99 76.
- Expected pulls per featured = 1.5 × E = **81.2** (model) or 83.3 (official 1.8%). Worst case 160.

### 1.3 What doesn't fit the simple model

- **Featured Weapon Convene is 100% featured:** "There is the 100% chance of obtaining the promotional 5-star." Fandom, OFFICIAL via wiki: https://wutheringwaves.fandom.com/wiki/Featured_Weapon_Convene. Also stated officially: "The 5-Star Weapon you Convene is guaranteed to be Woodland Aria" [WW-3].
- **Losing the 50/50 pays a currency refund.** The Afterglow Coral page [WW-5] (https://wutheringwaves.fandom.com/wiki/Afterglow_Coral; OFFICIAL via wiki) says:
  - "Obtaining a 5-Star Resonator for the 1st-7th time: 15 Afterglow Corals"
  - "When obtaining a non-featured 5-Star Resonator, you will get an additional 30 Afterglow Corals"
  - Store: "One Radiant Tide for 8 Afterglow Corals"
  - So a lost 50/50 returns 45 corals ≈ **5.6 pulls**; a won one returns 1.9 pulls (DERIVED).
- **Concurrent banners share one counter.** Several featured banners often run at once (e.g. "Hsin, Chisa, Iuno") and share pity [WW-3].
- **No standard rate-up banner.** The Standard Resonator Convene and Beginner's Choice have no featured unit, so there is no separate preset.

---

## 2. Arknights (Hypergryph / Yostar)

### 2.1 6★ rate and pity

**Official CN banner rules** [AK-1]. Arknights' official Weibo post for the CN 5th-anniversary limited banner 【何以为我】 (1–15 May 2024), reproduced by Sina: https://sina.cn/news/detail/5027883972561994.html. Tag: OFFICIAL (CN server, reposted verbatim).
- 「在所有【限定寻访】中，如果连续50次没有获得6星干员，则下一次获得6星干员的概率将从原本的2%提升至4%，如果该次还没有寻访到6星干员，则下一次寻访获得6星的概率由4%提升到6%。依此类推，每次提高2%获得6星干员的概率，直至达到100%时必定获得6星干员」
  - ("In all Limited Headhunting, if no 6★ in 50 consecutive pulls, the next pull's 6★ chance rises from 2% to 4%, then 6%, … +2% each pull until 100%.")
- 「在任意两个不同的【限定寻访】中，没有获得6星干员的累计次数不会累计，该次数会因为【限定寻访】的结束而清零。」
  - ("Pity does not carry between two different Limited banners; it clears when the banner ends.")

**Global wording** (OFFICIAL via wiki):
- arknights.wiki.gg [AK-2], https://arknights.wiki.gg/wiki/Headhunting: rates table "6★ \| 2% \| 1:50"; "If a 6★ Operator does not appear after 50 pulls, each subsequent pull will increase the 6★ Operators' rate by 2%, up to 100%."
- Fandom (marked "very outdated") [AK-3], https://arknights.fandom.com/wiki/Headhunting: "the 6★ Operator rate will be 4% at the 51st pull, 6% at the 52nd pull, 10% at the 54th pull, 20% at the 59th pull, 50% at the 74th pull, and 100% (guaranteed) at the 99th pull".

**Carry-over.** wiki.gg [AK-2]: "The pull count and increased rate will be reset as soon as a 6★ Operator appears on any pull, and is carried over across different headhunting banners of the same series … with the exception of Limited Headhunting, Special Headhunting, and Celebration - Kernel banners where the pull count and increased rate is independent to each banner."

**So:** base 2%; soft pity from pull **51** at **+2 pp per pull** (4% at 51); hard pity **99** (implied: 2% + 48×2% = 98% at 98, 100% at 99). DERIVED (`derived.py`): **34.59 pulls per 6★ = 2.89%**, median 35, p90 60. This matches GGanalysis's documented 34.5946 (COMMUNITY-DATA). No consolidated rate is published.

### 2.2 Featured share by banner type

| Banner | 6★ featured share | Quote | Source / tag |
|---|---|---|---|
| Limited Headhunting (CN example) | **70%** split by two | 「★★★★★★：维什戴尔 [限定] \ 逻各斯（占6★出率的70%）」 | [AK-1] OFFICIAL |
| Limited (Global wording) | 70% = 35% each; remaining 30% weighted | "Primary rate-up accounts for 70%, split between the new limited and non-limited one (35% each). The remaining 30% is split between the standard Operators and limited Operators of the same series, with the secondary rate-up having their rate quintupled." | [AK-4] wiki.gg Headhunting/Banners, https://arknights.wiki.gg/wiki/Headhunting/Banners, OFFICIAL via wiki |
| Standard Headhunting rate-up (single, "Limited-Time" banner; or dual, "Standard Pool") | **50%**, split equally | "The rate-up 6★ and 5★ Operators have a 50% chance (divided equally if there are multiple) to be the Operator of said rarity appearing in a pull" | [AK-4] OFFICIAL via wiki |
| Joint Operation | 100% among featured | "the 6★ and 5★ that appear on a pull in the Joint Operation banner will only be the rate-up ones" | [AK-4] OFFICIAL via wiki |
| Model check | limited 0.35 per unit | `limited_up_6star = PityBernoulliModel(PITY_6STAR, 0.35)` | [AK-5] GGanalysis `arknights/gacha_model.py`, COMMUNITY-DATA |

### 2.3 Guarantee after a miss

**There is no "lost 50/50 → next is featured" rule.** Instead there is **Focused Selection**, quoted from [AK-4] (OFFICIAL via wiki):
- Limited-Time (single rate-up) banners: "The All Quiet Under the Thunder update introduces **Focused Selection** to Limited-Time banners, where after 150 pulls without the rate-up 6★ Operator appearing, the next 6★ that appear is guaranteed to be the rate-up one."
  - Global event ended 7 Nov 2023 (search snippet of the wiki.gg event list; exact start not verified).
- Standard Pool and Kernel banners: "The When Elegies Are Ashes update introduces **Focused Selection** to Standard Pool banners, where after 150 pulls without either of the rate-up 6★ Operators appearing, the next 6★ that appear is guaranteed to be one of the rate-up ones; after 300 pulls, the other rate-up 6★ Operator is guaranteed to be the next 6★ that appear." The same wording is given for Kernel banners.
  - Global dates: "2025/08/28–2025/09/11" (wiki.gg Event/2025 table, https://arknights.wiki.gg/wiki/Event/2025).

GGanalysis models the single rate-up case at 66.16 expected pulls with Focused Selection (COMMUNITY-DATA), against 69.2 without (DERIVED).

### 2.4 Limited banner: 300-pull exchange (spark) and the free 300th-pull copy

**Contracts** (official CN text [AK-1], OFFICIAL):
- 「在所有【限定寻访】中，每进行一次寻访，可获取一张【寻访数据契约】」 (one Headhunting Data Contract per pull)
- Shop prices in that banner: 「★★★★★★（300寻访数据契约）：维什戴尔 \ 逻各斯 …」 and 「★★★★★★（200寻访数据契约）：W」 (older limited units were cut to 200)
- 「剩余未兑换的【寻访数据契约】将会被自动兑换成【寻访参数模型】，每张【寻访数据契约】自动兑换成六张【寻访参数模型】」 (leftover contracts convert at 6 Parametric Models each)

**Global client text** (verbatim datamined string, `en_US/gamedata/excel/gamedata_const.json`, Kengxxiao/ArknightsGameData_YoStar; repo last pushed 13 Nov 2025) [AK-6]. Tag: COMMUNITY-DATA.
- "During [Limited Headhunting] banners, you will obtain 1 [Headhunting Data Contract] for each roll you perform."
- "After the current [Headhunting Data Contract Shop] closes, any unredeemed [Headhunting Data Contracts] will be converted into [Headhunting Parametric Models]. Each [Headhunting Data Contract] will be converted into 6 [Headhunting Parametric Models]."
- wiki.gg [AK-7] (https://arknights.wiki.gg/wiki/Headhunting_Data_Contract): "Headhunting Data Contracts cannot be saved or otherwise transferred to another limited headhunting banner." OFFICIAL via wiki.

**Free copy at 300 pulls (newer rule).**
- CN official [AK-1]: 「在本期【限定寻访】中，累计寻访300次，可以额外获得限定干员维什戴尔（仅限一次）。该次6星限定干员的获取是额外赠送，不产出【寻访数据契约】，同时也不会影响本期【限定寻访】获得下一个6星干员的概率，该累计次数会在本期【限定寻访】的结束时清零（后续【春节】、【庆典】、【夏季】系列限定寻访都将应用同类规则…不会跨寻访继承）」
  - ("After 300 cumulative pulls you additionally receive the limited operator, once; it yields no contracts and does not affect the next 6★ chance; the count clears when the banner ends; the rule applies to later Spring Festival, Celebration and Summer limited banners; it is not inherited across banners.")
- Global, wiki.gg [AK-4], starting with the "Our Kind" banner: "The limited Operator introduced in that banner can be claimed _for free_ from the banner menu after the player has done a total of 300 pulls on it, regardless of whether they were pulled already. This guarantees any player able to make 300 pulls on the banner will receive a minimum of two limited Operators, one of which can be freely chosen." OFFICIAL via wiki.
- Datamine cross-check [AK-6]: Global `gacha_table.json` carries `"limitParam": {"freeCount": 300, "hasFreeChar": true, …}` on every limited pool from `LIMITED_EN_30_0_5` "OUR KIND" (opened 2024-10-31) onward, and `false` on all earlier ones. CN data turns it on at `LIMITED_50_0_1` 何以为我 (2024-05-01). COMMUNITY-DATA.

**Answer to "does the counter reset?"**
- Contracts accrue per pull regardless of result, so they **do not reset when you get the featured unit**.
- They do **not carry to the next limited banner**, and convert at banner end.
- The free-copy counter is one-time per banner and clears at banner end.

DERIVED: expected pulls for one *specific* 35% limited unit with the 300 spark is **95.7**; P(needing the spark) = 3.6%.

### 2.5 Currency

| Item | Value | Quote | Source / tag |
|---|---|---|---|
| Orundum per pull | 600 | "Each headhunting pull costs 600 Orundum or one Headhunting Permit … ten consecutive pulls for 6000 Orundum" | [AK-3] Fandom, OFFICIAL via wiki |
| Same, client constant | 600 | `"advancedGachaCrystalCost": 600` | [AK-6] COMMUNITY-DATA |
| Originite Prime → Orundum | 180 | `"diamondToShdRate": 180` | [AK-6] COMMUNITY-DATA |

### 2.6 What doesn't fit the simple model

- **Pity is per series.** Limited pity is independent per banner; standard pity carries across standard banners (2.1).
- **No 50/50 guarantee.** Use Focused Selection at 150 (non-limited banners only), plus the limited spark and the free copy at 300.
- **The 30% off-rate on limited banners is weighted.** Older limited units of the same series get 5× weight.
- **First-ten guarantee.** "A 6★ or 5★ Operator is guaranteed to appear in any of the first ten pulls on a headhunting banner." [AK-3] Fandom, OFFICIAL via wiki.
- **Statistical "type hard pity" (COMMUNITY-DATA, not verified).** GGanalysis reports one found statistically on standard dual-rate-up banners, triggering around pulls 202/402 (source video https://www.bilibili.com/video/BV1ib411f7YF/, not accessed). This predates Focused Selection on Standard Pool banners.

---

## 3. Fate/Grand Order (NA)

### 3.1 Rates

**Rates table** [FGO-1] (Fandom "Summoning", https://fategrandorder.fandom.com/wiki/Summoning; OFFICIAL via wiki, server not specified on the page). In-game probability list:

| ★ | Servant | Craft Essence |
|---|---|---|
| 5 | 1% | 4% |
| 4 | 3% | 12% |
| 3 | 40% | 40% |

**Featured rate.** Same page: in-game rate-up list, one featured per rarity: "5 \| 0.8% \| 2.8%" (Servant / CE). Also: "The chance of summoning a 5★ Servant is still 1%, but, if you were to summon a 5★, there is a higher chance it will be a rate-up Servant." So the featured share is **80%** of 5★ Servants (DERIVED).

**Official NA web notices** say the rates are only in-game: "Please tap the "Summon Info" button at the bottom left corner of the Saint Quartz Summon screen for a full list of available Servants and Craft Essences." [FGO-2]

### 3.2 The 330-summon guarantee (NA)

Rules today (since **4 Jul 2026**). Official NA notice "Lostbelt No.5 Clear Support Pickup Summon", 2026-09-30 → 10-15 PDT [FGO-2], https://webview.fate-go.us/2026/0928_lb5_clear_cp_pu/ (OFFICIAL):
- "In the case that you perform a Limited Time Pickup Summon 329 times without summoning the Pickup ★5 (SSR) Servant even once, the 330th Summon is guaranteed to be one copy of the Pickup ★5 (SSR) Servant."
- "The Summon Count for the "Guaranteed Summon" feature will be reset under either of the following conditions. - You summon the Pickup ★5 (SSR) Servant within 329 Summons. - The Guaranteed Summon goes into effect on the 330th Summon and you summon the Pickup ★5 (SSR) Servant. * Once the Summon Count for the "Guaranteed Summon" feature is reset, a new count to 330 Summons will begin from the next Summon."
- "Your Summon Count will not be carried over to other Summons when the Limited Time Pickup Summon ends."
- "in a Daily Pickup Summon where the Pickup Lineup changes each day at 21:00 PDT (GMT -7), your Summon Count will be reset at the moment the Pickup Lineup changes."
- "The "+1 Bonus Summon" performed with each 10x Summon and the once a day "1x Summon" using Paid Saint Quartz are also included in your Summon Count."
- "Story Summon and Friend Point Summon are not eligible for the "Guaranteed Summon" feature."

When it changed. Official "9th Anniversary Space Ereshkigal Pickup Summon" [FGO-3], https://webview.fate-go.us/2026/0704_9th_anniversary_pu/ (OFFICIAL): "Up until now, the "Guaranteed Summon" feature guaranteed the 330th Summon to be one copy of the ★5 (SSR) Pickup Servant one time only … However, as of 2026-07-04 18:00 PDT (GMT -7), the "Guaranteed Summon" feature is no longer limited to one time only!"

Old rule (NA, 21 Nov 2022 – 4 Jul 2026). Official NA notice, 2026-05-10 → 05-17 [FGO-4], https://webview.fate-go.us/iframe/2026/0507_interlude_cp19_pu/ (OFFICIAL):
- "the 330th time you perform the summon is guaranteed to be one copy of the Pickup ★5 (SSR) Servant one time only."
- If "You summon the Pickup ★5 (SSR) Servant within 329 summons", "the "Guaranteed Summon" function will be disabled for that Summon."

Start date and JP history (ESTIMATE):
- Siliconera, 21 Nov 2022 [FGO-5], https://www.siliconera.com/english-version-of-fgo-to-get-pity-system-early/: "The chapter goes live on November 21, 2022, and the pity system will apply to its limited summon banners. The system arrives early compared to the Japanese edition".
- JP introduced 330 by 2 Jan 2022 (Siliconera, https://www.siliconera.com/fate-grand-order-implements-a-pity-system-in-gacha/).
- JP made it repeatable at its 9th anniversary (Aug 2024): "No longer a 1-time limit, now happens every 329 summons without the rate-up SSR / Counter resets each time the rate-up servant is obtained" (Fandom "Fate/Grand Order ～9th Anniversary～/10 Great Campaigns"). OFFICIAL via wiki.

**Answers.**
- Servers: NA has the guarantee since 21 Nov 2022; JP since about Jan 2022.
- Repeatable and **resets when you get the featured unit (by luck or by the guarantee)**: NA since 4 Jul 2026, JP since Aug 2024.
- The count is lost when the banner or lineup ends.

### 3.3 Saint Quartz per summon

| Item | Value | Quote | Source / tag |
|---|---|---|---|
| Single summon | 3 SQ | "Three Saint Quartz can be used to perform one Saint Quartz Summon … a 10x Summon that uses up thirty Saint Quartz will guarantee a ★4 or above card and a ★3 or above Servant." | [FGO-6] official NA "Learning with Manga! Episode 3", https://fate-go.us/manga_fgo/comic03.html; OFFICIAL |
| 10x summon | 30 SQ → **11 summons** | "Every 11x Summon (10x Summon and +1 Bonus Summon) will award 50 Mana Prisms" [FGO-2]. Fandom: "After the 4th Anniversary of the JP server a 10x summon gives a free extra roll (becoming an 11x summon) while still only costing 30 Saint Quartz … The NA server received this update with its 4th Anniversary." | OFFICIAL; OFFICIAL via wiki |
| Effective cost | **2.73 SQ per summon** with 11x | 30/11 | DERIVED |
| Daily paid single | 1 paid SQ, once a day per lineup | "Once a day only, you can expend one Paid Saint Quartz to perform a "1x Summon"." | [FGO-2] OFFICIAL |

### 3.4 Derived and what doesn't fit

- DERIVED, featured 0.8% with 330 guarantee:
  - Expected pulls per featured **116.2** (125 uncapped).
  - P(reaching the 330th summon) = 7.1%.
  - With the new reset rule, 116.2 is also the long-run cost per copy.
- **No soft pity, no 50/50 guarantee.** A non-featured 5★ changes nothing. Fandom: "Getting a non Rate-Up SSR before you get the Rate-Up SSR will NOT reset the pity" (https://fategrandorder.fandom.com/wiki/Rate-Up_SSR_Pity_System, OFFICIAL via wiki).
- **Multi-featured banners.** Each lineup page counts separately ("counted individually for each Pickup Summon (each page on the Summon Screen)"). Daily rotating lineups reset the count each day.
- **The multi-summon guarantee** is per 11x: "one ★4 (SR) or above card and one ★3 (R) or above Servant". The 330 guarantee "goes into effect separately".
- **Rate splits with two featured 5★** are not verified (Fandom documents splits only for 4★: "2 \| 1.4%", "3 \| 0.8%").

---

## 4. Blue Archive (Global)

### 4.1 Rates and cost

| Parameter | Value | Quote | Source / tag |
|---|---|---|---|
| 3★ rate | 3% | Fest notice: "During Fest Recruitment, the acquisition probability of the 3★ student group is doubled. (Existing: 3.000000% → Fest Recruitment Period: 6.000000%)" | [BA-1] official Global notice "6/9(Tue) Fest Pick-Up Recruitments", 8 Jun 2026, Nexon forum thread 3469094 (https://forum.nexon.com/bluearchive-en/board_view?board=3218&thread=3469094); OFFICIAL |
| Pick-up per featured student | 0.7% | "A single character will have a boosted rate of 0.7%." | [BA-2] bluearchive.wiki "Recruit", https://bluearchive.wiki/wiki/Recruit; OFFICIAL via wiki |
| Same, model | 0.007 | `P_3UP = 0.007`; `EXCHANGE_PULL = 200` | [BA-3] GGanalysis `blue_archive/gacha_model.py`; COMMUNITY-DATA |
| Pyroxene per pull | 120 | "A single roll costs 120 Pyroxene. A 10-roll uses 1200 Pyroxene with the 10th roll being 2★ or better." | [BA-2] OFFICIAL via wiki |
| Rates come from in-game only | — | "Find details on student probabilities via In-Game Lobby → Recruit → Rate Info (bottom left)." | [BA-4] official "9/15(Tue) Patch Notes", thread 3541757; OFFICIAL |

### 4.2 The 200-pull exchange (current Global system)

Official Global guide "Recruitment" [BA-5] (thread 2720669, "up to date as of 08/19/2026"; https://forum.nexon.com/bluearchive-en/board_view?board=3222&thread=2720669). OFFICIAL:
- "When you recruit, you can obtain 1 [Point] of the corresponding recruitment per [Recruitment], depending on the recruitment type. With 200 of each [Point], you can select and recruit one student of your choice from among the target students"
- "Except for Archive Points, each point is converted into 1 [Keystone Fragment] per [Point] when its usage period ends, and sent to your mailbox."
- Recruitment Point usage period: "The corresponding Pick-Up Recruitment period".

Patch notes [BA-4] (OFFICIAL): "When Pick-Up Recruitment ends, Recruitment Points will be converted to Keystone Pieces, at a 1:1 ratio, and sent to your mailbox." The schedule table lists "Recruitment Points Reset" at each banner end.

**So:** points accrue per pull regardless of result. They **do not reset when you get the featured unit**, they **do reset (convert) when the pick-up period ends**, and they do not carry over.

### 4.3 Change coming to Global in Q4 2026 (already live on JP)

**Global timing.** Official Global "Blue Archive Fall Developer's Letter", Executive Producer Kim YongHa, posted 23 Sep 2026 (thread 3550470; the text is an image, read directly) [BA-6]. OFFICIAL:
- "the revamped recruitment system is scheduled to go live for global service during the fourth quarter."
- "we plan to fully explain the ins-and-outs of the update in our official live stream."

**JP rules** (official JP notice 「生徒募集システムのリニューアルについて」, 2026-07-28 [BA-7], https://bluearchive.jp/news/newsJump/679, fetched via `api-web.bluearchive.jp/api/news/detail?id=679`). OFFICIAL. Live on JP from 29 Jul 2026:
- 「「呼び出しチャージ」のカウント数が「100」に達する募集を行った際、必ず★3生徒が登場し、50%の確率でピックアップ生徒をお迎えできます。また、「呼び出しチャージ」のカウント数が「200」に達する募集の際には、必ずピックアップ対象の生徒がお迎えできます。」
  - ("On the pull where the charge reaches 100, a ★3 is guaranteed, with a 50% chance it is the pick-up; on the pull where it reaches 200, the pick-up is guaranteed.")
- 「「呼び出しチャージ」がリセットされるタイミングは、同種類の任意のピックアップ募集でピックアップ対象をお迎えした時のみで…新たなピックアップ募集に切り替わっても、それまでの「呼び出しチャージ」は引き継がれます。」
  - (Resets only when you get a pick-up target; carries into later banners.)
- 「※ピックアップ募集でピックアップ対象外の★3生徒をお迎えしても「呼び出しチャージ」はリセットされません。」
  - (An off-target ★3 does not reset it.)
- 「※募集1回毎における募集確率に関しては、従来通りで変更はございません。」
  - (Per-pull rates unchanged.)
- Two separate counters: normal pick-ups, and 「限定・呼び出しチャージ」 for limited, anniversary, Recollect and Encore banners.
- 「募集回数特典」 (Recruitment Count Rewards) give 期間限定10回募集チケット (limited 10-pull tickets) at 70, 130, 150 and 170 pulls in the first 200, then at 270, 330, 350 and 370. These reset each pick-up period.

DERIVED:
- Global system (0.7%, spark 200): expected pulls to the featured unit **107.8** (GGanalysis prints 107.80); P(reaching the spark) = 24.7%.
- JP charge system: expected **90.1**; P(reaching pull 200) = 12.4%.

### 4.4 What doesn't fit

- **Fest banners use a different split.** 6% 3★ with the featured unit still 0.7%. Wiki [BA-2]: "a 0.7% drop chance for the featured character, 0.9% divided equally among non-rate-up anniversary characters, and 4.4% divided equally among regular pool 3★ characters". The featured share is therefore 11.7% of 3★ (DERIVED).
- **Concurrent banners share one point pool.** Wiki [BA-2]: "If two rate-up banners are active concurrently, their Recruitment Point pool is shared, and players get a choice of claiming either rate-up character."
- **History.** Wiki [BA-2], JP dates: spark lowered from 300 to 200 on 2021/04/29 ("Global version of the game launched with this improvement already in place"); "After 2022/07/20, 3★ student drop rate was permanently raised from 2.5% to 3%."

---

## 5. Umamusume: Pretty Derby (Global)

| Parameter | Value | Quote / row | Source / tag |
|---|---|---|---|
| 3★ rate (character scout) | 3% | "The gacha rates in Uma Musume are 3% for an SSR card (or a 3☆ character), 18% for an SR card (or a 2☆ character), and 79% for an R card (or a 1☆ character)." | [UMA-1] GameTora, https://gametora.com/umamusume/gacha (updated 2026-10-01); ESTIMATE |
| Same, from odds data | 3.000% | Banner 30132 (28 Sep → 12 Oct 2026, Vodka + Daiwa Scarlet): `"pickups": [[100802, 7500, true], [100902, 7500, true]]`; groups `{'172': 51, '173': 36, '7500': 2, '20000': 9, '98750': 8}` in parts per million. 3★ total = 2×7500 + 51×172 + 36×173 = 30,000 ppm | [UMA-2] GameTora data file https://gametora.com/data/umamusume/en/gacha/char-standard.6f67828f.json; COMMUNITY-DATA (datamined odds) + DERIVED sum |
| Pick-up per spotlight trainee | **0.75%** (25% of 3★) | 7500 ppm per pickup on every recent Global banner, single- or dual-pickup (30120, 30122, 30124, 30126, 30128, 30132) | [UMA-2] COMMUNITY-DATA |
| Exchange (spark) | 200 points | "Reaching 200 pulls on a single banner lets you spark (exchange) for the featured SSR. Sparks do not carry over between banners." | [UMA-3] games.gg banner guide, 17 Mar 2026 (via WebFetch); ESTIMATE |
| Points expire, no carry-over | — | "Trainee Exchange Points and Support Card Exchange Points from this Spotlight Scout cannot be carried over to future Scouts or other Scouts currently in progress." "…not utilized during the Spotlight Scout availability period will automatically be converted into Clovers." | [UMA-4] official umamusume.com news, announce_id 1073, "Spotlight Pretty Derby and Spotlight Support Card Scouts out now!", 28 Sep 2026 (via the site's `api/ajax/pr_info_detail`); OFFICIAL |
| Carats per pull | 150 (1,500 per 10) | "A single Scout will cost 150 Carats, but a separate single Scout can be made once per day, per banner for 50 Paid Carats." GameTora: "a normal 10-pull (1500 carats)" | [UMA-5] uma.guide, https://uma.guide/guides/beginners-tutorial; GameTora half-anniversary guide; ESTIMATE |
| Rates are in-game only | — | "For more details on Scouts, specific rates, and other important information, tap Details on the Scout screen." | [UMA-4] OFFICIAL |

**So:**
- No soft or hard pity; spark at 200.
- The exchange-point counter **does not reset when you get the featured unit**.
- It is per banner and expires into Clovers.
- DERIVED: expected pulls for one spotlight trainee with the 200 exchange is **103.8**; P(reaching 200) = 22.4%.

**What doesn't fit:**
- Two spotlight trainees each keep 0.75%, so the combined featured share is 50% on dual banners.
- A daily 50-paid-carat single scout per banner (ESTIMATE [UMA-5]).
- Paid-only guaranteed scouts: "A scout can be performed on each scout banner at the cost of 1,500 paid carats" and "You will not obtain Trainee Exchange Points or Support Card Exchange Points for scouts on the 3★ Guaranteed Head Start Scout…" (official announce_id 122, 26 Jun 2025; OFFICIAL).
- Support-card scouts have their own separate exchange points.

---

## 6. Goddess of Victory: NIKKE

Official patch notes, reposted verbatim by nikke.gg (re-fetched with curl and checked). OFFICIAL via repost:
- **"October 8 Patch Notes Summary"** [NK-1] (2026; page published 2026-10-05), https://nikke.gg/october-8-patch-notes-summary:
  - "① You can use Gems (Free/Paid) or Advanced Recruit Vouchers to recruit in Special Recruit. (Ordinary Recruit Vouchers cannot be used)"
  - "② There is a 4% chance of acquiring SSR Nikkes in Special Recruit and a 2% chance of acquiring SSR Belorta: Pumpkin Witch."
  - "③ You can get Gold Mileage Tickets when recruiting in Special Recruit."
  - "④ You can exchange 200 Gold Mileage Tickets for Belorta: Pumpkin Witch in the Mileage Shop."
  - "⑤ When Special Recruit ends, unused Gold Mileage Tickets will not disappear."
- **"May 14 Update Patchnotes"** [NK-2] (2026), https://nikke.gg/may-14-update-patchnotes/: same wording for Mint (Special Recruit), and for EVE and Raven: "There is a 4% chance of acquiring SSR Nikkes in Limited-Time Recruitment, and a 2% chance for SSR EVE."
- **"December 30 Update Patch Notes"** [NK-3] (published 2025-12-29), https://nikke.gg/december-30-update-patch-notes/:
  - "There is a 4% chance of acquiring SSR Nikkes in Special Recruit and a **1%** chance of acquiring SSR Snow White: Heavy Arms."
  - Same **1%** for "SSR Rapi: Red Hood".
  - "Gold Mileage Tickets not used during Special Recruit will not expire."

| Parameter | Value | Source / tag |
|---|---|---|
| SSR rate | 4% | [NK-1–3] OFFICIAL via repost |
| Pick-up rate | 2% (50% of SSR) on most banners; **1% on some** (both Special Recruits in the 30 Dec 2025 notes) | [NK-1–3] OFFICIAL via repost |
| Gold Mileage exchange | 200 tickets → the featured unit | [NK-1] OFFICIAL via repost |
| Tickets per pull | 1 (ESTIMATE). The official text says only "You can get Gold Mileage Tickets when recruiting in Special Recruit", and the wiki says "Special draws earn Gold Mileage Tickets" without a count. Fan site: "Every pull on a Special or Limited Recruit banner grants one Gold Mileage Ticket. Once you collect 200 tickets, you can exchange them in the Mileage Shop for the featured SSR." The same fan page: "The game does not include any official language in its Rate Info or Recruit Info screens that suggests probabilities increase after a certain number of pulls." | [NK-4] (OFFICIAL via wiki); [NK-5] nikke.gg "Soft Pity and Guaranteed Pull Mechanics in NIKKE Recruitment", 13 Jan 2026, https://nikke.gg/soft-pity-and-guaranteed-pull-mechanics-in-nikke-recruitment/ (ESTIMATE) |
| Carry-over | Never expires, usable on future banners: "Gold Mileage Tickets do not expire, and can be saved for a future Special Recruit." | [NK-4] OFFICIAL via wiki; [NK-1] OFFICIAL via repost |
| Gems per pull | 300 (3,000 per 10): "Premium draws cost 300 Gems per draw, or 3000 Gems for a 10-draw." | [NK-4] OFFICIAL via wiki |

**So:**
- No soft or hard pity; spark at 200 tickets.
- The counter **does not reset when you get the featured unit**, and **does not expire between banners**.

DERIVED:
- Single banner, 2%: expected pulls to the featured unit **49.1** (P(reaching 200) = 1.8%).
- Single banner, 1%: **86.6** (13.5%).
- Long run, if every ticket is eventually spent on a wanted unit, the carry-over spark acts like an extra 1/200 per pull: 1/(0.02 + 0.005) = **40.0** pulls per copy at 2%, and 66.7 at 1%.

**What doesn't fit:**
- The featured rate varies by banner (2% vs 1%).
- Step Up Recruit gives no mileage: "You cannot get Gold Mileage Tickets or Silver Mileage Tickets when recruiting in Step Up Recruit." [NK-3]
- Ordinary Recruit earns Silver Mileage, which buys spare bodies, not units [NK-4].
- Bonus Recruit: "Using 100 points allow the player to recruit an SSR Nikke from the listed lineup" (Ordinary Recruit exchange points) [NK-4].

---

## 7. Granblue Fantasy

The source is gbf.wiki "Draw", Wayback snapshot 29 Jul 2026, https://web.archive.org/web/20260729041400/https://gbf.wiki/Draw [GBF-1]. Tag: OFFICIAL via wiki. In the archived text the rarity icons render as "03", in SSR / SR / R order.

| Parameter | Value | Quote |
|---|---|---|
| Normal SSR rate | 3% | "The standard Premium draw rates are as follows. [SSR]: 3% [SR]: 15% [R]: 82%" |
| Premium Gala (Legend Festival) | 6% | "During Premium Gala (known in Japanese as Legend Festival or Legfest), SSR rates are doubled to 6%" |
| Flash Gala (Grande Fes) | 6% | "A Flash Gala (known in Japanese as Grande Fest) has a 6% SSR draw rate like a Premium Gala, but the draw pool includes a separate selection of Grand Series characters." |
| Crystals per draw | 300 (3,000 per 10) | "Premium Draw (single) Costs Crystal ×300 …"; "Premium 10-Part Draw … Costs Crystal ×3,000" |
| Spark | 300 | "For every draw made in the Premium section, you will receive 1 Cerulean Spark. Until the end of the current draw promotion, you can exchange 300 Cerulean Sparks for any item in the current exchange list." |
| Spark expiry | at the end of each promotion | "If you do not spend your Cerulean Sparks before the end of the promotion, and have less than 300, they will automatically be converted into Cerulean Stones … If you manage to collect 300 Cerulean Sparks within a promotion, you will not lose your Cerulean Sparks when the promotion ends. Instead, you will be barred from drawing further until you spend your Cerulean Sparks on an item from the current exchange list." |

**So:**
- No soft or hard pity; spark at 300.
- The counter **does not reset when you get the featured unit**.
- It **expires at the end of the draw promotion**.

**Featured SSR rate: not verified.** The wiki says only "Current draw rates can be checked by navigating to the desired Premium Draw section and tapping the Draw Rates button." I found no archived per-item rate for a featured character. JP press (gamebiz, gameranbu) gives only the 3%→6% doubling.

**What doesn't fit:**
- You draw items (weapons and summons that unlock characters), and the spark list includes the whole banner pool, not just the featured unit.
- Collab draws use separate "Aureate Sparks", and Classic draws use "Vermilion Sparks" (same 300 / expiry rules) [GBF-1].
- "Spark Milestones" give rewards at 50, 100, 150, 200 and 250 sparks [GBF-1].
- 10-part draws guarantee one SR or better: "At least 1 draw will be guaranteed [SR] or better" [GBF-1].

---

## 8. Reverse: 1999 (Bluepoch)

The official banner text is reproduced verbatim by dotgg.gg for "The Changeling Awaits" (v1.2, 28 Dec 2023 – 18 Jan 2024; page published 26 Dec 2023) [R99-1], https://dotgg.gg/reverse-1999/the-changeling-awaits-time-limited-character-summoning-event/. Re-fetched and checked. Tag: OFFICIAL via repost.
- "Basic rate of summoning 6⭐ characters: 1.5%. Overall rate (including Guarantee): 2.36%;"
- "In this banner, the rate of summoning 6-star rate-up character [Jessica] takes up 50% of the rate of summoning 6-star characters. If the first 6-star character obtained from this banner is not the rate-up one, then the next 6-star character obtained from this banner is guaranteed to be the rate-up character."
- "if you have not obtained any 6-star characters after 60 consecutive summons, the rate of summoning a 6-star character in the next summon will rise from 1.5% to 4%. After that, every summon that doesn't grant a 6-star character will increase the rate by 2.5%."
- "Every 70 summons guarantees 1 6-star character."
- "This banner is a [time-limited character summoning event] which shares the 6-star character guarantee count with other similar banners. Even after the banner expires, both the count and the rate bonus it brings will be inherited by the next [time-limited character summoning event]."

The current wiki repeats the same rules: Fandom "Summons/Details", https://reverse1999.fandom.com/wiki/Summons/Details [R99-2] (OFFICIAL via wiki): "Basic rate of summoning 6✦ characters: 1.5% … Overall rate (including guarantee): 2.36%".

Currency [R99-2], https://reverse1999.fandom.com/wiki/Summons (OFFICIAL via wiki):
- "One summon costs 1 Unilog"
- "Exchanging 180 Clear Drops for 1 Unilog - Crystal Drops can also be bought … 1 Crystal Drop = 1 Clear Drop."

**Soft pity.** It is officially disclosed (61st pull = 4%, then +2.5 pp per pull: 6.5%, 9% … 24% at 69; 100% at 70). GGanalysis encodes the same: `PITY_6STAR[61:71] = np.arange(1, 11) * 0.025 + 0.015` with `PITY_6STAR[70] = 1`. Its stationary solution gives `P_6s = 0.0235922` (https://github.com/OneBST/GGanalysis/blob/main/GGanalysis/games/reverse_1999/gacha_model.py) [R99-3]. Tag: COMMUNITY-DATA.

DERIVED: **42.39 pulls per 6★ = 2.359%**, matching the official 2.36%. Median 46, p90 70; P(reaching 70) = 10.1%. Expected pulls per featured = **63.6**; worst case 140.

I found **no large community pull dataset** to test the ramp empirically (not verified). The official disclosure makes one less necessary.

**What doesn't fit:**
- **Does the "lost 50/50" guarantee survive a banner change?** The official wording ties it to "this banner", and only "the count and the rate bonus" are explicitly inherited. Secondary guides claim it carries over (ESTIMATE, conflicting; not verified).
- **"Selected" banners.** A guide reports the first 6★ there is your pre-selected unit (ESTIMATE, search snippet; not verified).
- **5★ rate-ups take 50% of the 5★ rate**, split equally between featured 5★ [R99-1].

---

## 9. Where sources disagree

1. **WuWa consolidated rate.** Official 1.8% vs the community model's 1.848%. The model reaches 100% at pull **79** (array length 80), while the official hard pity is 80. wuwatracker data fall below the model at 76–79 and record 630 spells at pity 80 (small samples, possible miscounts).
2. **WuWa flat rate in tracker data:** 0.93% observed vs 0.8% official. This is an import-truncation artifact, as with paimon.moe.
3. **FGO "first copy only" vs repeatable.**
   - Siliconera (2022) and the old official NA text: "one time only".
   - Official NA text since 4 Jul 2026: the count resets and "a new count to 330 Summons will begin".
   - The Fandom "Rate-Up SSR Pity System" page mixes both ("Pity Counter will reset each time…" alongside "Only eligible for the FIRST INSTANCE…").
   - Use the official 2026 text.
4. **Blue Archive Global vs JP.**
   - Global (today): 200 points, reset each banner.
   - JP (since 29 Jul 2026): 100/200 charge, resets only on the featured unit, carries over.
   - Global switch announced for "the fourth quarter" (2026).
   - Gacha Go! (24 Sep 2026, ESTIMATE) notes the dual-banner drawback: "pulling one of them just before 200 now wipes the progress that used to be spent on the other."
5. **NIKKE pick-up rate:** 2% on most banners vs 1% on the two 30 Dec 2025 Special Recruits (official notes). Pick per banner.
6. **NIKKE Advanced Recruit Vouchers.** Officially usable in Special Recruit. A top-up blog (bittopup, ESTIMATE) says they "don't generate Gold Mileage Tickets"; the official text says only "You can get Gold Mileage Tickets when recruiting in Special Recruit". Not verified.
7. **Reverse: 1999 guarantee carry-over:** official wording ("from this banner") vs guides claiming it carries over. Not verified.
8. **Arknights spark price.** The wiki says "300 (200 for older ones)". The official CN post explains: older limited units are cut to 200 (W from the 2024 anniversary; Rosmontis and Nian announced later).

## 10. Not verified

- **WuWa:** the verbatim in-game Convene Details text; whether the featured guarantee carries to the next banner (the wiki wording implies it does); GGanalysis's Bilibili write-up (rate-limited).
- **Arknights:**
  - Exact Global in-game wording. Covered by official CN text, wiki.gg, and Global datamined strings.
  - Whether Focused Selection progress carries between banners.
  - The meaning of `"version": 1` in recent `limitParam` entries.
  - The exact start date of Focused Selection on Global Limited-Time banners. "All Quiet Under the Thunder" ended 7 Nov 2023 per a search snippet.
- **FGO:** NA rates (1% / 0.8%) come from the wiki's in-game tables only, because official web notices point to the in-game "Summon Info". Rate splits with two featured 5★ are not verified.
- **Blue Archive:**
  - 0.7% and 120 Pyroxene come from the wiki and GGanalysis only; Nexon points to in-game "Rate Info".
  - The Global go-live date and English names for the new system.
- **Umamusume:**
  - 150 carats per pull and the 200-point exchange come from guides (ESTIMATE). Official notices confirm the points exist, don't carry over and convert to Clovers.
  - 0.75% comes from GameTora's datamined odds, not an official text.
- **NIKKE:** 300 gems per pull (wiki only); exactly 1 Gold Mileage ticket per pull (fan site only); why some banners are 1%; whether vouchers grant mileage.
- **Granblue Fantasy:** per-item featured rates; any official text (gbf.wiki blocks bots, so an archived copy was used).
- **Reverse: 1999:** guarantee carry-over across banners; an empirical soft-pity dataset; the "Selected" banner rules.

---

## Numbers to use

"Spark" means an exchange or guarantee reached by pull count. "Spark resets on featured" means the counter goes back to zero when you get the featured unit (by luck or otherwise).

| Game / banner | Base rate | Soft pity start | Soft pity climb per pull | Hard pity | Featured chance (on a top-rarity pull) | Guarantee after a miss | Spark pulls | Spark resets on featured | Currency per pull | Published consolidated rate | Sources | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Wuthering Waves, Featured Resonator Convene | 0.8% | pull 66 | +4 pp (66–70: 4.8% → 20.8%); +8 pp (71–75: → 60.8%); +10 pp (76–78, model only) | 80 (official); model 100% at 79 | 50% (losing pool = 5 standard units) | Yes | none | n/a | 160 Astrite | 1.8% (model 1.848%) | [WW-1] [WW-2] [WW-3] [WW-4] [WW-6] [WW-7] | OFFICIAL via wiki (rates, 80, 50/50, 160); COMMUNITY-DATA (soft pity: GGanalysis + 8.9M wuwatracker 5★) |
| Wuthering Waves, Featured Weapon Convene | 0.8% | 66 in the model (GGanalysis reuses the character table: `up_5star_weapon = PityModel(PITY_5STAR)`); not checked against data | same as character (model only) | 80 | 100% | n/a | none | n/a | 1 Forging Tide, "Used to Convene one time in Featured Weapon Convene", bought with Astrite. The Astrite price is not quoted on the wiki page, so **not verified** | 1.8% | [WW-6] [WW-8]; https://wutheringwaves.fandom.com/wiki/Forging_Tide | OFFICIAL via wiki (rates, 100%); COMMUNITY-DATA (ramp, unchecked) |
| Arknights, Limited Headhunting | 2% | pull 51 (4%) | +2 pp | 99 (implied) | 70% split by two (35% each); remaining 30% weighted, older limited ×5 | No | 300 (contracts → exchange); plus a free limited copy at 300 pulls (CN since May 2024, Global since 31 Oct 2024) | No (1 contract per pull; contracts expire at banner end → 6 Parametric Models each); pity does not carry between limited banners | 600 Orundum (1 OP = 180 Orundum) | none (derived 2.89%) | [AK-1] [AK-2] [AK-4] [AK-6] [AK-7] | OFFICIAL (CN post) / OFFICIAL via wiki / COMMUNITY-DATA (datamine) |
| Arknights, Standard rate-up ("Limited-Time" single / "Standard Pool" dual) | 2% | pull 51 | +2 pp | 99 | 50% (split equally if two) | No; Focused Selection: first 6★ after 150 pulls without a featured is featured (dual: second featured after 300) | 150 / 300 (Focused Selection) | Moot once the featured appears: it only fires "after 150 pulls without the rate-up 6★ Operator appearing". Whether progress carries between banners is not verified | 600 Orundum | none | [AK-2] [AK-4] | OFFICIAL via wiki |
| Fate/Grand Order NA, Limited-Time Pickup (single 5★) | 1% (5★ Servant) | none | none | 330 (featured guaranteed) | 80% (0.8% of 1%) | No | 330 (guarantee, not exchange) | Yes (NA since 4 Jul 2026; before: one-time); lost at banner/lineup end | 3 SQ (30 SQ = 11 summons → 2.73 SQ) | none | [FGO-1] [FGO-2] [FGO-3] [FGO-4] [FGO-6] | OFFICIAL (330 rules, SQ); OFFICIAL via wiki (1%, 0.8%) |
| Blue Archive Global, Pick-Up (current) | 3% | none | none | none | 0.7% per student (23.3% of 3★) | No | 200 points | No (points reset at banner end → 1:1 Keystone Pieces) | 120 Pyroxene | none | [BA-1] [BA-2] [BA-3] [BA-4] [BA-5] | OFFICIAL (3%, points); OFFICIAL via wiki + COMMUNITY-DATA (0.7%, 120) |
| Blue Archive, Fest | 6% | none | none | none | 0.7% (11.7% of 3★) | No | 200 points | No | 120 Pyroxene | none | [BA-1] [BA-2] | OFFICIAL / OFFICIAL via wiki |
| Blue Archive JP (Global from Q4 2026), Recruitment Charge | 3% | none (one-shot at 100) | n/a | 200 (featured) | 0.7% per pull; 50% on the 100th pull | No (the 100th pull is a 3★ with 50% featured) | 100 / 200 (charge) | Yes; carries across banners | 120 Pyroxene | none | [BA-6] [BA-7] | OFFICIAL |
| Umamusume Global, Spotlight character scout | 3% | none | none | none | 0.75% per spotlight trainee (25% of 3★; 50% total with two) | No | 200 exchange points | No (points expire at banner end → Clovers) | 150 carats | none | [UMA-1] [UMA-2] [UMA-3] [UMA-4] [UMA-5] | COMMUNITY-DATA (odds); OFFICIAL (expiry); ESTIMATE (200, 150) |
| NIKKE, Special / Limited-Time Recruit | 4% (SSR) | none | none | none | 2% (50% of SSR); 1% on some banners | No | 200 Gold Mileage tickets (= 200 pulls at 1 ticket per pull; the per-pull count is from a fan site) | No (tickets never expire; carry to future banners) | 300 gems | none | [NK-1] [NK-2] [NK-3] [NK-4] [NK-5] | OFFICIAL via repost (rates, 200 tickets, no expiry); OFFICIAL via wiki (300 gems); ESTIMATE (1 ticket per pull) |
| Granblue Fantasy, Premium Draw | 3% SSR | none | none | none | not verified (in-game Draw Rates only) | No | 300 Cerulean Sparks (exchange from the whole banner list) | No (expire at promotion end → Cerulean Stones if < 300) | 300 crystals | none | [GBF-1] | OFFICIAL via wiki (archived) |
| Granblue Fantasy, Premium Gala / Flash Gala | 6% SSR | none | none | none | not verified | No | 300 | No | 300 crystals | none | [GBF-1] | OFFICIAL via wiki (archived) |
| Reverse: 1999, time-limited character summon | 1.5% | pull 61 (4%) | +2.5 pp | 70 | 50% | Yes (official wording "from this banner"; carry-over across banners not verified) | none | n/a | 180 Clear Drops (= 1 Unilog) | 2.36% (model 2.359%) | [R99-1] [R99-2] [R99-3] | OFFICIAL via repost / via wiki; COMMUNITY-DATA (model check) |

### Derived expected pulls (sanity checks for the simulator; DERIVED, `src2/derived.py`)

| Preset | Expected pulls per top-rarity unit | Expected pulls per featured | Worst case for featured |
|---|---|---|---|
| WuWa | 54.1 (model) / 55.6 (1/1.8%) | 81.2 / 83.3 | 160 |
| Arknights limited, specific 35% unit | 34.6 | 95.7 with spark at 300 (98.8 without) | 300 |
| Arknights standard, single rate-up | 34.6 | 69.2 without Focused Selection; 66.16 with it (GGanalysis) | ≤ 249 (an off-rate 6★ at pull 150, then the next 6★ within 99) |
| FGO NA | 100 | 116.2 | 330 |
| Blue Archive Global | 33.3 | 107.8 | 200 |
| Blue Archive JP charge | 33.3 | 90.1 | 200 |
| Umamusume Global | 33.3 | 103.8 | 200 |
| NIKKE 2% / 1% | 25 | 49.1 / 86.6 per banner; 40.0 / 66.7 long-run with carried tickets | 200 |
| Granblue Fantasy | 33.3 (3%) / 16.7 (6%) | not verified | 300 |
| Reverse: 1999 | 42.4 | 63.6 | 140 |

### Source index

- **[WW-1]** https://wutheringwaves.fandom.com/wiki/Featured_Resonator_Convene
- **[WW-2]** https://wutheringwaves.gg/convene-details/ (29 May 2024)
- **[WW-3]** Kuro Games v2.3 Phase II press release, 22 May 2025: https://www.gamedeveloper.com/press-release/wuthering-waves-fiery-arpeggio-of-summer-reunion-version-2-3-phase-ii-available-now
- **[WW-4]** https://wutheringwaves.fandom.com/wiki/Radiant_Tide and https://wutheringwaves.fandom.com/wiki/Convene
- **[WW-5]** https://wutheringwaves.fandom.com/wiki/Afterglow_Coral
- **[WW-6]** https://github.com/OneBST/GGanalysis/blob/main/GGanalysis/games/wuthering_waves/gacha_model.py
- **[WW-7]** https://wuwatracker.com/tracker/stats/100001 … /100043, fetched 5 Oct 2026
- **[WW-8]** https://wutheringwaves.fandom.com/wiki/Featured_Weapon_Convene
- **[AK-1]** Arknights official Weibo post via Sina: https://sina.cn/news/detail/5027883972561994.html
- **[AK-2]** https://arknights.wiki.gg/wiki/Headhunting
- **[AK-3]** https://arknights.fandom.com/wiki/Headhunting
- **[AK-4]** https://arknights.wiki.gg/wiki/Headhunting/Banners
- **[AK-5]** https://github.com/OneBST/GGanalysis/blob/main/GGanalysis/games/arknights/gacha_model.py and https://github.com/OneBST/GGanalysis/blob/main/docs/source/games/arknights/index.rst
- **[AK-6]** https://github.com/Kengxxiao/ArknightsGameData_YoStar (`en_US/gamedata/excel/gamedata_const.json`, `gacha_table.json`) and https://github.com/Kengxxiao/ArknightsGameData (`zh_CN/...`)
- **[AK-7]** https://arknights.wiki.gg/wiki/Headhunting_Data_Contract
- **[FGO-1]** https://fategrandorder.fandom.com/wiki/Summoning
- **[FGO-2]** https://webview.fate-go.us/2026/0928_lb5_clear_cp_pu/
- **[FGO-3]** https://webview.fate-go.us/2026/0704_9th_anniversary_pu/
- **[FGO-4]** https://webview.fate-go.us/iframe/2026/0507_interlude_cp19_pu/
- **[FGO-5]** https://www.siliconera.com/english-version-of-fgo-to-get-pity-system-early/
- **[FGO-6]** https://fate-go.us/manga_fgo/comic03.html
- **[BA-1]** Nexon forum thread 3469094 (Fest notice, 8 Jun 2026)
- **[BA-2]** https://bluearchive.wiki/wiki/Recruit
- **[BA-3]** https://github.com/OneBST/GGanalysis/blob/main/GGanalysis/games/blue_archive/gacha_model.py
- **[BA-4]** Nexon forum thread 3541757 (9/15 Patch Notes)
- **[BA-5]** Nexon forum thread 2720669 (Recruitment guide, 19 Aug 2026)
- **[BA-6]** Nexon forum thread 3550470 (Fall Developer's Letter, 23 Sep 2026)
- **[BA-7]** https://bluearchive.jp/news/newsJump/679 (28 Jul 2026)
- **[UMA-1]** https://gametora.com/umamusume/gacha
- **[UMA-2]** https://gametora.com/data/umamusume/en/gacha/char-standard.6f67828f.json
- **[UMA-3]** https://games.gg/umamusume-pretty-derby/guides/umamusume-pretty-derby-banner-guide/
- **[UMA-4]** umamusume.com official news, announce_id 1073 (28 Sep 2026) and 899 (22 Jul 2026), via https://umamusume.com/api/ajax/pr_info_detail?format=json
- **[UMA-5]** https://uma.guide/guides/beginners-tutorial and https://gametora.com/umamusume/guides/half-anni-survival-guide
- **[NK-1]** https://nikke.gg/october-8-patch-notes-summary
- **[NK-2]** https://nikke.gg/may-14-update-patchnotes/
- **[NK-3]** https://nikke.gg/december-30-update-patch-notes/
- **[NK-4]** https://nikke-goddess-of-victory-international.fandom.com/wiki/Recruit
- **[NK-5]** https://nikke.gg/soft-pity-and-guaranteed-pull-mechanics-in-nikke-recruitment/ (13 Jan 2026)
- **[GBF-1]** https://web.archive.org/web/20260729041400/https://gbf.wiki/Draw
- **[R99-1]** https://dotgg.gg/reverse-1999/the-changeling-awaits-time-limited-character-summoning-event/
- **[R99-2]** https://reverse1999.fandom.com/wiki/Summons and https://reverse1999.fandom.com/wiki/Summons/Details
- **[R99-3]** https://github.com/OneBST/GGanalysis/blob/main/GGanalysis/games/reverse_1999/gacha_model.py
