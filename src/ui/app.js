// Gacha Lab page: settings on the left, the season's results on the right.

import {
  simulate,
  freeGemCost,
  tracePlayer,
  testRules,
  pityMoments,
  pityDistribution,
  featuredShareTheory,
  firstFeaturedPulls,
  firstSurePull,
  freeCopyPulls,
  goalFor,
  sparkPulls,
  BUDGET_LOW,
  BUDGET_HIGH,
  TYPES,
  WHALE,
  DOLPHIN,
  FREE,
  HOW,
  dotState,
} from '../engine.js';
import { PRESETS, DEFAULT_SETTINGS, SOURCES, presetById, presetSettings, presetsFor, dropLabOnly, rulesMatch, storeMatches } from '../presets.js';
import { testLevers, rank } from '../suggest.js';
import { checkRows } from '../mathcheck.js';
import { usd, int, pct, pctSome, signedPct, signedPts, copies, sharesOf, revenueShares, shownParts } from '../format.js';
import { createField } from './field.js';
import { revenueSplit, outcomeSplit, pityChart, sawtooth } from './charts.js';
import { strideFor } from './field.js';
import { logoSvg, drawLogo } from './logo.js';
import { trackingOn, sourceQuery, createTracker, beacon, countVisibleTime } from './stats.js';

const TYPE_NAMES = ['Whales', 'Dolphins', 'Pass buyers', 'Free players'];
const TYPE_ONE = ['Whale', 'Dolphin', 'Pass buyer', 'Free player'];
const SAMPLE_SIZES = [1000, 5000, 10000, 100000, 1000000];
// v5 since spending follows the banner (7 Oct 2026): a v4 save holds the old player mix (whales $750 wanting 7,
// dolphins $150 wanting 2) and would bring it back in #lab. Earlier saves are left behind on purpose, so a returning
// visitor never sees a preset's name over an old store or an old mix. (v4: preset stores and the researched mix; v3:
// free copies, copy caps and preset stores; v2: Custom rules and 30 days.)
const STORAGE_KEY = 'gacha-lab:settings:v5';
const CHECK_FIVES = 40000;
const SUGGEST_SAMPLE = 10000;
// Per player and season. Spend is kept in whole cents in 32 bits, which tops out at $42.9 million.
const MAX_BUDGET = 1000000;

const $ = (sel) => document.querySelector(sel);

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
  return el;
}

const css = getComputedStyle(document.documentElement);
const token = (name) => css.getPropertyValue(name).trim();
const COLORS = {
  ground: token('--ground'),
  panel: token('--panel'),
  ink: token('--ink'),
  ink2: token('--ink-2'),
  muted: token('--muted'),
  featured: token('--featured'),
  lost: token('--lost'),
  none: token('--none'),
  money: token('--money'),
  gem: token('--gem'),
  ramp: [token('--money-1'), token('--money-2'), token('--money-3')],
};

// ---------------------------------------------------------------------------------------------
// State

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // startGems went off the page (6 Oct 2026); a save can't keep a hidden amount. Saves from before the
      // preset fields existed take them from their preset.
      if (saved && saved.rules && saved.types && Array.isArray(saved.packs)) {
        const s = { ...structuredClone(DEFAULT_SETTINGS), ...saved, startGems: 0 };
        if (!('rulesFrom' in saved)) s.rulesFrom = s.preset;
        if (!('storeFrom' in saved)) s.storeFrom = s.preset;
        if (!('maxCopies' in saved)) s.maxCopies = presetSettings(s.preset).maxCopies;
        // a preset whose rules have changed since the save no longer describes them
        if (s.preset !== 'custom' && !rulesMatch(s.rules, presetById(s.preset).rules)) s.preset = 'custom';
        return s;
      }
    }
  } catch {
    // storage blocked or unreadable: start from the defaults
  }
  return structuredClone(DEFAULT_SETTINGS);
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
  } catch {
    // not saved; the page works the same
  }
}

// Lab mode (#lab at the end of the link): the math check, the sources and the full player trace.
// Hidden from everyone else for now.
const isLab = () => window.location.hash === '#lab';

const state = {
  lab: isLab(),
  settings: loadSettings(),
  run: null,
  selected: null,
  day: null,
  check: null,
  checkKey: '',
  suggestToken: 0,
};

const S = () => state.settings;

// What Reset all asks before it throws the visitor's settings away.
export const RESET_CONFIRM =
  'Reset everything to the defaults?\n\nThis puts the banner rules, the store and the player mix back as they started. Your changes are not kept.';

// Anonymous daily counters on the live site only (stats.js; the list of events is in server/report/index.js).
const stats = createTracker({
  on: trackingOn(location, navigator.webdriver),
  query: sourceQuery({ referrer: document.referrer, search: location.search, userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints }),
  send: beacon,
});

// ---------------------------------------------------------------------------------------------
// Info buttons: every explanation lives behind an (i) next to what it explains. One shared popover
// closes on a second click, a click elsewhere, Escape, or scrolling.

const infoPop = $('#info-pop');
let infoOpen = null;

function closeInfo() {
  if (!infoOpen) return;
  infoOpen.setAttribute('aria-expanded', 'false');
  infoOpen = null;
  infoPop.hidden = true;
}

function openInfo(btn, text) {
  closeInfo();
  infoOpen = btn;
  btn.setAttribute('aria-expanded', 'true');
  infoPop.textContent = text;
  infoPop.hidden = false;
  const r = btn.getBoundingClientRect();
  const w = infoPop.offsetWidth;
  const hgt = infoPop.offsetHeight;
  const left = Math.min(window.innerWidth - w - 12, Math.max(12, r.left - 12));
  let top = r.bottom + 8;
  if (top + hgt > window.innerHeight - 12) top = Math.max(12, r.top - hgt - 8);
  infoPop.style.transform = `translate(${left}px, ${top}px)`;
}

// The (i) is drawn, not typed: a font's "i" never sits quite right in a small circle, and faked italics
// look broken. The button's aria-label carries the meaning.
const INFO_GLYPH = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="4.7" r="1.15"></circle><path d="M8 7.4v4.5"></path></svg>';

function info(text, about) {
  const btn = h('button', { type: 'button', class: 'info-btn', 'aria-label': `About ${about}`, 'aria-expanded': 'false', html: INFO_GLYPH });
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (infoOpen === btn) closeInfo();
    else openInfo(btn, typeof text === 'function' ? text() : text);
  });
  return btn;
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest?.('.info-btn[data-info]');
  if (btn) {
    if (infoOpen === btn) closeInfo();
    else openInfo(btn, btn.dataset.info);
    return;
  }
  if (infoOpen && !infoPop.contains(e.target)) closeInfo();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeInfo();
});
document.addEventListener('scroll', closeInfo, { capture: true, passive: true });

// ---------------------------------------------------------------------------------------------
// Settings panel

const controls = [];
// Rebuilds the "Start from" list for the lab or not (buildSettings sets it).
let fillPresets = () => {};

function round(v, decimals) {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

// A label with its (i) and an optional short live readout under it.
function rowLabel(id, label, about, note) {
  const noteEl = note ? h('span', { class: 'note', id: `${id}-note` }) : null;
  if (noteEl) controls.push(() => (noteEl.textContent = note()));
  return h(
    'div',
    { class: 'row-label' },
    h('div', { class: 'row-title' }, h('label', { for: id, class: 'row-name' }, label), about ? info(about, label.toLowerCase()) : null),
    noteEl,
  );
}

function stepper({ id, label, aria, about, note, get, set, step, min, max, decimals = 0, prefix = '', suffix = '', format, rules = false }) {
  const name = aria || label.toLowerCase();
  // a step can follow the game: tens of gems where a pull costs 160, ones where it costs 3 Saint Quartz
  const stepOf = () => (typeof step === 'function' ? step() : step);
  const input = h('input', { id, type: 'text', inputmode: 'decimal', class: 'num', autocomplete: 'off', spellcheck: 'false', 'aria-label': aria || null });
  if (note) input.setAttribute('aria-describedby', `${id}-note`);
  const show = () => {
    const v = get();
    input.value = format ? format(v) : `${prefix}${decimals ? v.toFixed(decimals) : int(v)}${suffix}`;
  };
  const lo = () => (typeof min === 'function' ? min() : min);
  const hi = () => (typeof max === 'function' ? max() : max);
  // A typed value is rounded to the control's decimals; a step only loses float noise, so stepping away and
  // back lands on the exact value a preset set (Blue Archive's 23.333…%).
  const commit = (v, typed = false) => {
    const next = Math.min(hi(), Math.max(lo(), round(v, typed ? decimals : 9)));
    set(next);
    if (rules) markCustom();
    edited();
  };
  const minus = h('button', { type: 'button', class: 'step', 'aria-label': `Lower ${name}`, onclick: () => commit(get() - stepOf()) }, '−');
  const plus = h('button', { type: 'button', class: 'step', 'aria-label': `Raise ${name}`, onclick: () => commit(get() + stepOf()) }, '+');
  input.addEventListener('change', () => {
    const typed = input.value.trim().toLowerCase();
    const v = typed === 'off' ? 0 : typed === 'none' ? hi() : parseFloat(typed.replace(/[^0-9.\-]/g, ''));
    if (Number.isFinite(v)) commit(v, true);
    else show();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      commit(get() + (e.key === 'ArrowUp' ? stepOf() : -stepOf()));
    }
  });
  controls.push(show);
  return h('div', { class: 'row' }, rowLabel(id, label, about, note), h('div', { class: 'stepper' }, minus, input, plus));
}

function toggle({ id, label, about, get, set, rules = false }) {
  const input = h('input', { id, type: 'checkbox', class: 'switch' });
  controls.push(() => (input.checked = !!get()));
  input.addEventListener('change', () => {
    set(input.checked);
    if (rules) markCustom();
    edited();
  });
  return h('div', { class: 'row' }, rowLabel(id, label, about), input);
}

function segmented({ label, about, options, get, set, format, stack = false }) {
  const group = h('div', { class: 'segmented', role: 'group', 'aria-label': label });
  const buttons = options.map((opt) =>
    h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => { set(opt); edited(); } }, format(opt)),
  );
  group.append(...buttons);
  controls.push(() => buttons.forEach((b, k) => b.setAttribute('aria-pressed', String(options[k] === get()))));
  return h(
    'div',
    // Five sample sizes are wider than the sidebar leaves beside a label, so this row puts them underneath.
    { class: `row${stack ? ' stack' : ''}` },
    h('div', { class: 'row-label' }, h('div', { class: 'row-title' }, h('span', { class: 'row-name' }, label), about ? info(about, label.toLowerCase()) : null)),
    group,
  );
}

// Section icons: a star for the banner (the legendary), a gem for gems and the store, people for the player mix.
const ICONS = {
  star: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.2 9.59 6.42 14.09 6.62 10.57 9.43 11.76 13.78 8 11.3 4.24 13.78 5.43 9.43 1.91 6.62 6.41 6.42Z"></path></svg>',
  gem: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2.8h6l3 3.6L8 13.4 2 6.4zM2 6.4h12M6.4 2.8 5.4 6.4 8 13.4l2.6-7-1-3.6"></path></svg>',
  reset: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.3 8.6a4.8 4.8 0 1 0 1.4-4.1M3.4 2.2v2.9h2.9"></path></svg>',
  people: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="6" cy="5.4" r="2.3"></circle><path d="M1.8 13.2c.5-2.3 2.2-3.6 4.2-3.6s3.7 1.3 4.2 3.6"></path><circle cx="11.4" cy="6.1" r="1.8"></circle><path d="M11.7 9.6c1.5.2 2.5 1.4 2.7 3.1"></path></svg>',
};

// A sidebar section that folds. Each one stays as the reader left it: opening Gems and store no longer shuts
// Banner rules (her call, 18 Oct 2026, replacing the one-at-a-time rule of the 5 Oct sidebar pass, which kept the
// panel about a screen tall). A folded section shows a one-line summary of its settings.
function section({ title, icon, summary, open = false }, ...body) {
  const sum = h('span', { class: 'g-sum' });
  controls.push(() => (sum.textContent = summary()));
  return h(
    'details',
    { class: 'group', open },
    h('summary', {}, h('span', { class: `g-icon ${icon}`, html: ICONS[icon] }), h('span', { class: 'g-text' }, h('span', { class: 'g-title' }, title), sum)),
    h('div', { class: 'group-body' }, ...body),
  );
}

// Keep "Start from" honest: the preset these rules came from while they still match it, otherwise Custom. It
// never jumps to another preset that happens to share the rules (Custom's defaults are Zenless Zone Zero's).
function markCustom() {
  const from = presetById(S().rulesFrom || S().preset);
  S().preset = from.rules && rulesMatch(S().rules, from.rules) ? from.id : 'custom';
}

const hasPassNow = () => S().pass.price > 0 || S().pass.upfront > 0 || S().pass.daily > 0;

// Gem steppers move in tens where a pull costs 100 or more gems, in ones where it costs a handful (Saint Quartz, Orbs).
const gemStep = () => (S().pullCost >= 100 ? 10 : 1);

// The most copies each type pulls for, as the run will use it: the goal, capped by the game's useful maximum. Each
// player of the type wants anywhere from 1 up to it (engine.js runPlayer).
// Copies of one thing (what the Goal control shows). What a player actually ends the season after is this times
// the things they chase: goalWins.
const goalOf = (key) => (S().extraCopies === false ? 1 : goalFor(S().types[key].goal, S().maxCopies));
const goalWins = (key) => (S().extraCopies === false ? 1 : goalFor(S().types[key].goal, S().maxCopies, S().types[key].chases));
const copyRange = (g) => (g > 1 ? `1 to ${g} copies` : '1 copy');

// The parts of a banner the sidebar has no setting for, in words: they ride along with a preset's rules.
function hiddenRules(r) {
  const parts = [];
  if (r.radiance?.on) parts.push('Capturing Radiance');
  const spark = sparkPulls(r);
  if (spark) parts.push(r.spark.resetOnFeatured ? `a ${int(spark)}-pull guarantee that restarts after each copy` : `a spark at ${int(spark)} pulls`);
  const free = freeCopyPulls(r);
  if (free.length) parts.push(`${free.length > 1 ? 'free copies' : 'a free copy'} at ${listAnd(free.map(int))} pulls`);
  return parts;
}

function listAnd(items) {
  return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items.join('');
}

// How often the hard pity is the pull that actually delivers the legendary, from the exact maths. Where soft pity
// climbs steeply the hard pity is a formality: on HoYoverse's rules the chance has reached 96.6% by pull 89, so
// 0.0000% of legendaries land on pull 90 and moving it changes nothing at all (her question, 19 Oct 2026: why does
// soft pity move revenue and hard pity not?). It starts to bite only when it comes down into the ramp: at pull 85
// it settles 0.25% of legendaries, at 83 1.9%, at 80 14%, at 75 60%.
function hardPityShare() {
  const r = S().rules;
  return pityDistribution(r)[r.hardPity] || 0;
}

// Store value of some gems at the best pack price, or null when nothing in the store has a price.
function gemValue(gems) {
  const priced = S().packs.filter((p) => p.price > 0 && p.gems > 0);
  if (!priced.length) return null;
  return usd(gems * Math.min(...priced.map((p) => (p.price * 100) / p.gems)));
}

function buildSettings() {
  const root = $('#settings');
  root.innerHTML = '';

  // The banner to start from: game presets or custom rules. Built before the pinned block that shows it, and
  // rebuilt when #lab comes or goes, since the lab offers every preset (presetsFor).
  const presetSelect = h('select', { id: 'preset', class: 'select' });
  fillPresets = () => {
    const groups = [];
    for (const p of presetsFor(state.lab)) {
      let g = groups.find((x) => x.label === (p.group || ''));
      if (!g) groups.push((g = { label: p.group || '', presets: [] }));
      g.presets.push(p);
    }
    // Custom rules (no group) first: it's the default.
    groups.sort((a, b) => (a.label ? 1 : 0) - (b.label ? 1 : 0));
    const option = (p) => h('option', { value: p.id }, p.name);
    presetSelect.replaceChildren(...groups.flatMap((g) => (g.label ? [h('optgroup', { label: g.label }, g.presets.map(option))] : g.presets.map(option))));
    presetSelect.value = S().preset;
  };
  fillPresets();
  presetSelect.addEventListener('change', () => {
    // A preset sets its rules, its store, whether copies matter and how many are useful (presetSettings).
    // Custom starts from the default rules and store, so nothing a game preset carries and the page can't set
    // (a spark, free copies, Capturing Radiance) stays behind unseen.
    S().preset = presetSelect.value;
    S().rulesFrom = presetSelect.value;
    Object.assign(S(), presetSettings(presetSelect.value));
    stats.track('preset', presetSelect.value);
    changed();
  });
  controls.push(() => (presetSelect.value = S().preset));

  // Pinned at the top, always open: reset, the banner to start from, then the sample.
  root.append(
    h(
      'div',
      { class: 'pinned' },
      h(
        'div',
        { class: 'side-head' },
        h('span', { class: 'side-title' }, 'Settings'),
        h(
          'button',
          {
            type: 'button',
            class: 'reset-link',
            'aria-label': 'Reset all settings to the defaults',
            onclick: () => {
              // Asking first (her call, 19 Oct 2026): this throws away every banner rule, store price and player
              // share the visitor has set, and there is no undo.
              if (!window.confirm(RESET_CONFIRM)) return;
              state.settings = structuredClone(DEFAULT_SETTINGS);
              changed();
            },
          },
          h('span', { html: ICONS.reset }),
          'Reset all',
        ),
      ),
      h('div', { class: 'row stack' }, h('div', { class: 'row-label' }, h('div', { class: 'row-title' }, h('label', { for: 'preset', class: 'row-name' }, 'Start from'))), presetSelect),
      segmented({
        label: 'Sample size',
        about: 'How many pretend players to simulate. Bigger samples give steadier numbers. Past 12,000 the dot field draws one player in every few, so the dots stay big enough to see; every number still counts them all. A million takes a few seconds to play out.',
        options: SAMPLE_SIZES,
        stack: true,
        get: () => S().sampleSize,
        // a new sample has different players behind each number, so the card starts again on a typical whale
        set: (v) => {
          if (v !== S().sampleSize) state.selected = null;
          S().sampleSize = v;
        },
        format: (v) => `${int(v)}`,
      }),
      stepper({
        id: 'days',
        label: 'Season length',
        about: 'How many days the season runs: 30 by default. A Genshin Impact version is 42.',
        get: () => S().days,
        set: (v) => (S().days = v),
        step: 1,
        min: 7,
        max: 365,
        suffix: ' days',
      }),
    ),
  );

  // Banner rules
  const theory = h('p', { class: 'readout', id: 'theory' });
  controls.push(() => {
    const r = S().rules;
    const { mean } = pityMoments(r);
    const share = featuredShareTheory(r);
    const capped = sparkPulls(r) > 0 || freeCopyPulls(r).length > 0;
    const first = firstFeaturedPulls(r);
    const featured = capped
      ? `and the first featured copy in <b>${first.toFixed(1)}</b> pulls on average, never later than pull <b>${int(firstSurePull(r))}</b>`
      : share > 0
        ? `the featured one every <b>${first.toFixed(1)}</b>`
        : '<b>never</b> the featured one';
    // Capturing Radiance, sparks and free copies have no setting, so the readout says when they're on.
    const hidden = hiddenRules(r);
    const extra = hidden.length ? ` Includes ${listAnd(hidden)}.` : '';
    theory.innerHTML = `On average a legendary every <b>${mean.toFixed(1)}</b> pulls (<b>${pct(1 / mean, 2)}</b>), ${featured}.${extra}`;
  });
  // What the model approximates for the chosen game, while its rules are on.
  const rulesNote = h('p', { class: 'note sec-note', id: 'rules-note' });
  controls.push(() => {
    const text = S().preset !== 'custom' ? presetById(S().preset).rulesNote || '' : '';
    rulesNote.textContent = text;
    rulesNote.hidden = !text;
  });

  root.append(
    section(
      {
        title: 'Banner rules',
        icon: 'star',
        summary: () => `${presetById(S().preset).name}${S().extraCopies === false ? ' · first copy only' : ''}`,
        open: true,
      },
      stepper({
        id: 'base-rate',
        label: 'Base chance',
        about: 'The chance of a legendary on every pull before soft pity starts.',
        get: () => S().rules.baseRate * 100,
        set: (v) => (S().rules.baseRate = v / 100),
        step: 0.1,
        min: 0.01,
        max: 50,
        decimals: 3,
        // as many decimals as the value needs, up to three: 0.6%, 0.045%, 0.145%
        format: (v) => `${parseFloat(v.toFixed(3))}%`,
        rules: true,
      }),
      stepper({
        id: 'soft-start',
        label: 'Soft pity starts',
        about: 'The pull, counting from the last legendary, where the chance starts climbing.',
        get: () => S().rules.softPityStart,
        set: (v) => (S().rules.softPityStart = v),
        step: 1,
        min: 2,
        max: () => S().rules.hardPity,
        format: (v) => (v >= S().rules.hardPity ? 'none' : `pull ${int(v)}`),
        rules: true,
      }),
      stepper({
        id: 'soft-step',
        label: 'Soft pity climb',
        about: "How many percentage points the legendary chance rises with each pull, starting on the pull where soft pity starts. HoYoverse's character banners rise about 6 points a pull, measured from players' pulls.",
        note: () => (S().rules.moreRamps || []).map((m) => `then +${parseFloat((m.step * 100).toFixed(2))} pts from pull ${m.start}`).join(', '),
        get: () => S().rules.softPityStep * 100,
        set: (v) => (S().rules.softPityStep = v / 100),
        step: 0.5,
        min: 0,
        max: 100,
        decimals: 1,
        format: (v) => `+${v.toFixed(1)} pts`,
        rules: true,
      }),
      stepper({
        id: 'hard-pity',
        label: 'Hard pity',
        about: () => {
          const share = hardPityShare();
          const rare = share < 0.005;
          return (
            'A legendary is certain on this pull. Where soft pity climbs steeply it gets there first, and this ' +
            'setting is a formality: moving it then changes nothing, which is why it can leave revenue where it is ' +
            'while soft pity moves it. ' +
            (rare
              ? `On these rules it settles ${share > 0 ? pctSome(share, 2) : 'none'} of legendaries \u2014 bring it down into the climb before it does anything.`
              : `On these rules it settles ${pctSome(share)} of legendaries.`)
          );
        },
        // The control looked broken without this: she asked why hard pity never moved revenue (19 Oct 2026).
        note: () => {
          const share = hardPityShare();
          if (share >= 0.005) return `settles ${pctSome(share)} of legendaries`;
          return share > 0 ? `almost never reached (${pctSome(share, 2)})` : 'never reached: soft pity gets there first';
        },
        get: () => S().rules.hardPity,
        set: (v) => {
          S().rules.hardPity = v;
          if (S().rules.softPityStart > v) S().rules.softPityStart = v;
        },
        step: 1,
        min: 2,
        max: 999,
        format: (v) => (v >= 999 ? 'none' : `pull ${int(v)}`),
        rules: true,
      }),
      stepper({
        id: 'featured',
        label: 'Featured chance',
        about: 'The chance a legendary is the featured one rather than another: the 50/50.',
        get: () => S().rules.featuredChance * 100,
        set: (v) => (S().rules.featuredChance = v / 100),
        step: 5,
        min: 0,
        max: 100,
        decimals: 3,
        // as many decimals as the value needs, up to three: 50%, 56.25%, 78.125%
        format: (v) => `${parseFloat(v.toFixed(3))}%`,
        rules: true,
      }),
      toggle({
        id: 'guarantee',
        label: 'Guarantee after a loss',
        about: 'After a lost 50/50, the next legendary is always the featured one.',
        get: () => S().rules.guarantee,
        set: (v) => (S().rules.guarantee = v),
        rules: true,
      }),
      toggle({
        id: 'extra-copies',
        label: 'Extra copies',
        about: () => {
          const whale = goalFor(S().types.whale.goal, S().maxCopies);
          const dolphin = goalFor(S().types.dolphin.goal, S().maxCopies);
          const capped = whale < Math.round(S().types.whale.goal) ? ', the most that still help in this game,' : '';
          return `Whether players pull for more than one copy of the featured legendary. On: each whale wants ${copyRange(whale)}${capped}, each dolphin ${copyRange(dolphin)}. Off: everyone stops at their first copy. This is for games where duplicates don't matter.`;
        },
        get: () => S().extraCopies !== false,
        set: (v) => (S().extraCopies = v),
      }),
      theory,
      rulesNote,
    ),
  );

  // Players
  const grid = h('div', { class: 'type-grid', role: 'table', 'aria-label': 'Player types' });
  grid.append(
    h(
      'div',
      { class: 'tg-head', role: 'row' },
      h(
        'span',
        { role: 'columnheader' },
        'Type',
        info(
          () =>
            hasPassNow()
              ? 'Whales, dolphins and pass buyers buy the monthly pass. Free players take whatever share is left. Paying players log in every day.'
              : 'This game has no monthly pass, so pass buyers play as free players. Free players take whatever share is left. Paying players log in every day.',
          'player types',
        ),
      ),
      h('span', { role: 'columnheader' }, 'Share'),
      h(
        'span',
        { role: 'columnheader' },
        'Budget',
        info(
          // Same class of thing as the hard pity: a setting that does nothing until it bites, which looks broken
          // without saying so. On the default banner only 1% of whales ever reach their limit, so raising it from
          // $2,000 to $4,000 or $64,000 changes revenue by nothing at all: what a whale WANTS is the real cap.
          () =>
            "A whale's or dolphin's limit for gem packs this season, on top of the pass: each one's own limit is " +
            'between half and one and a half times this. They stop at their goal, so this only does anything once ' +
            'it is lower than what their goal costs \u2014 above that, raising it changes nothing. ' +
            (budgetBiteNote() || 'Nobody is held back by it here, so what they chase is what sets their spending.'),
          'pack budgets',
        ),
      ),
      h('span', { role: 'columnheader' }, 'Goal', info("The most copies a player of this type wants of one thing (Genshin's C6 is 7 copies): each wants anywhere from 1 up to this, spread evenly, and stops once they have theirs. A game whose copies stop helping sooner caps it there (Fate/Grand Order: 5). With Extra copies off, everyone stops at 1.", 'goals')),
      h(
        'span',
        { role: 'columnheader' },
        'Chases',
        info(
          'How many things a player of this type goes after in a season. A season is rarely one unit: Genshin and ' +
            'Honkai run two phases of featured characters and their weapon banners, and League\u2019s Sanctum has the ' +
            'skin, its border and the mythic essence \u2014 and a whale goes after more than one of them. To the pull ' +
            'maths a featured win is a featured win, whichever thing it was for, and pity and the guarantee carry ' +
            'across banners as they do in those games. This is what sets how much whales bring in: at one thing ' +
            'they are 43% of revenue, at eight they are 85%, which is where GameAnalytics puts them (86.6%).',
          'things chased',
        ),
      ),
    ),
  );
  const keys = ['whale', 'dolphin', 'pass', 'free'];
  keys.forEach((key, t) => {
    const share = h('input', { id: `share-${key}`, type: 'text', inputmode: 'decimal', class: 'num small', 'aria-label': `${TYPE_NAMES[t]} share of players` });
    const budget = h('input', { id: `budget-${key}`, type: 'text', inputmode: 'decimal', class: 'num small', 'aria-label': `${TYPE_NAMES[t]} pack budget for the season` });
    const goal = h('select', { id: `goal-${key}`, class: 'select small', 'aria-label': `${TYPE_NAMES[t]} goal` });
    const chases = h('input', { id: `chases-${key}`, type: 'text', inputmode: 'numeric', class: 'num small', 'aria-label': `${TYPE_NAMES[t]} things chased a season` });
    // up to 7 copies, or as many as the game finds useful (Fire Emblem Heroes: 11)
    const goalOptions = () => {
      // and never fewer than the goal in use, so a 10 carried over from Fire Emblem Heroes still shows
      const most = Math.max(1, Math.round(S().maxCopies || 7), goalOf(key));
      if (goal.options.length !== most) goal.replaceChildren(...Array.from({ length: most }, (_, c) => h('option', { value: c + 1 }, copies(c + 1))));
    };
    const isFree = key === 'free';
    const isPass = key === 'pass';
    if (isFree) {
      share.readOnly = true;
      share.setAttribute('aria-readonly', 'true');
      share.classList.add('derived');
    }
    if (isFree || isPass) {
      budget.readOnly = true;
      budget.classList.add('derived');
    }
    share.addEventListener('change', () => {
      const v = parseFloat(share.value.replace(/[^0-9.]/g, ''));
      if (Number.isFinite(v)) S().types[key].share = Math.min(1, Math.max(0, v / 100));
      edited();
    });
    budget.addEventListener('change', () => {
      const v = parseFloat(budget.value.replace(/[^0-9.]/g, ''));
      if (Number.isFinite(v)) S().types[key].budget = Math.min(MAX_BUDGET, Math.max(0, Math.round(v)));
      edited();
    });
    goal.addEventListener('change', () => {
      S().types[key].goal = Number(goal.value);
      edited();
    });
    chases.addEventListener('change', () => {
      const v = parseFloat(chases.value.replace(/[^0-9.]/g, ''));
      if (Number.isFinite(v)) S().types[key].chases = Math.min(99, Math.max(1, Math.round(v)));
      edited();
    });
    controls.push(() => {
      // with no pass, the pass buyers play free, so they count with the free players here
      const paying = S().types.whale.share + S().types.dolphin.share + (hasPassNow() ? S().types.pass.share : 0);
      const v = isFree ? Math.max(0, 1 - paying) : S().types[key].share;
      share.value = `${(v * 100).toFixed(1)}%`;
      budget.value = isFree ? 'none' : isPass ? (hasPassNow() ? 'pass' : 'no pass') : `$${int(S().types[key].budget)}`;
      goalOptions();
      goal.value = String(goalOf(key));
      chases.value = int(Math.max(1, Math.round(S().types[key].chases || 1)));
      chases.readOnly = isFree;
      chases.classList.toggle('derived', isFree);
    });
    grid.append(
      h(
        'div',
        { class: `tg-row${key === 'whale' ? ' is-whale' : ''}`, role: 'row' },
        h('span', { class: 'tg-name', role: 'rowheader' }, TYPE_NAMES[t]),
        h('span', { role: 'cell' }, share),
        h('span', { role: 'cell' }, budget),
        h('span', { role: 'cell' }, goal),
        h('span', { role: 'cell' }, chases),
      ),
    );
  });
  // The player mix is fixed to the defaults for everyone; only #lab can change it.
  const players = section(
      {
        title: 'Players',
        icon: 'people',
        summary: () => {
          const t = S().types;
          const share = (x) => `${(x * 100).toFixed(1)}%`;
          return `${share(t.whale.share)} whales · ${share(t.dolphin.share)} dolphins · ${hasPassNow() ? `${share(t.pass.share)} pass buyers` : 'no pass, so no pass buyers'}`;
        },
      },
      grid,
      stepper({
        id: 'login',
        label: 'Free players log in',
        about: "The share of days a free player logs in, on average: 35%, so that with paying players, who log in daily, everyone averages about 40%, the middle of gacha games' daily against monthly players in Korea, Japan and China. At most settings free players fall into light, middle and heavy groups rather than an even spread.",
        get: () => S().loginRate * 100,
        set: (v) => (S().loginRate = v / 100),
        step: 5,
        min: 5,
        max: 100,
        suffix: '%',
      }),
    );
  players.dataset.lab = '';
  players.hidden = !state.lab;
  root.append(players);

  const packRows = h('div', { class: 'pack-grid', role: 'table', 'aria-label': 'Gem packs' });
  const packHead = h(
    'div',
    { class: 'tg-head', role: 'row' },
    h('span', { role: 'columnheader' }, 'Price'),
    h('span', { role: 'columnheader' }, 'Gems'),
    h('span', { role: 'columnheader' }, 'Bonus'),
    h('span', { role: 'columnheader' }, 'Per pull'),
    h(
      'span',
      { role: 'columnheader' },
      'Of revenue',
      info(
        'How much of this season\u2019s gem-pack money came through this pack. Whales and dolphins pace their buying across the season, and each day\u2019s need sizes the pack they buy, so the money spreads across the ladder. Changing the price of a pack almost nobody buys changes almost nothing: raise the ones with the biggest shares, or the whole ladder. Pricing out a pack that sells moves its buyers to the next rate down, and that can take less, not more: a smaller pack leaves fewer gems bought and never spent.',
        'of revenue',
      ),
    ),
  );
  // A pack's total (what the model buys) is its listed gems plus its bonus; each part is edited on its own.
  const bonusOf = (p) => Math.min(p.gems, p.bonus || 0);
  const readInt = (input) => parseFloat(input.value.replace(/[^0-9.]/g, ''));
  const packRow = (k) => {
    const price = h('input', { id: `pack-price-${k}`, type: 'text', inputmode: 'decimal', class: 'num small', 'aria-label': `Pack ${k + 1} price` });
    const gems = h('input', { id: `pack-gems-${k}`, type: 'text', inputmode: 'decimal', class: 'num small', 'aria-label': `Pack ${k + 1} gems, before the bonus` });
    const bonus = h('input', { id: `pack-bonus-${k}`, type: 'text', inputmode: 'decimal', class: 'num small', 'aria-label': `Pack ${k + 1} bonus gems` });
    const per = h('span', { class: 'per-pull' });
    // Filled in after each run (renderPackShares), not here: these are results, not settings.
    const share = h('span', { class: 'per-pull pack-share', id: `pack-share-${k}` }, '\u2013');
    price.addEventListener('change', () => {
      const v = parseFloat(price.value.replace(/[^0-9.]/g, ''));
      if (Number.isFinite(v)) S().packs[k].price = Math.max(0, Math.round(v * 100) / 100);
      edited();
    });
    gems.addEventListener('change', () => {
      const v = readInt(gems);
      const p = S().packs[k];
      if (Number.isFinite(v)) p.gems = Math.max(0, Math.round(v)) + bonusOf(p);
      edited();
    });
    bonus.addEventListener('change', () => {
      const v = readInt(bonus);
      const p = S().packs[k];
      if (Number.isFinite(v)) {
        const listed = p.gems - bonusOf(p);
        p.bonus = Math.max(0, Math.round(v));
        p.gems = listed + p.bonus;
      }
      edited();
    });
    const row = h('div', { class: 'tg-row', role: 'row' }, h('span', { role: 'cell' }, price), h('span', { role: 'cell' }, gems), h('span', { role: 'cell' }, bonus), h('span', { role: 'cell' }, per), h('span', { role: 'cell' }, share));
    return { row, price, gems, bonus, per, share };
  };
  // Rows follow the store: a preset can bring more or fewer packs (Fire Emblem Heroes has seven).
  let packCells = [];
  controls.push(() => {
    const packs = S().packs;
    if (packCells.length !== packs.length) {
      packCells = packs.map((_, k) => packRow(k));
      packRows.replaceChildren(packHead, ...packCells.map((c) => c.row));
    }
    packCells.forEach((c, k) => {
      const p = packs[k];
      c.price.value = `$${p.price.toFixed(2)}`;
      c.gems.value = int(p.gems - bonusOf(p));
      c.bonus.value = `+${int(bonusOf(p))}`;
      // a pack with no price or no gems is never bought (engine.js prepare), so it has no price a pull
      c.per.textContent = p.gems > 0 && p.price > 0 ? usd(((p.price * 100) / p.gems) * S().pullCost) : '–';
    });
  });
  // What the store sold this season, under the prices that set it: the money, the pack most of it went through, and
  // whether spenders ran out of budget. This is where prices are edited, so it is the answer to "I changed a price,
  // why didn't revenue move?" without having to read it off the tiles. Filled in after each run (renderPackShares).
  const packSummary = h('p', { class: 'readout', id: 'pack-summary' });
  // What the pass is worth to a player who logs in on every day it runs.
  const passValue = h('p', { class: 'readout', id: 'pass-value' });
  controls.push(() => {
    const { pass, pullCost } = S();
    if (!(pass.price > 0 || pass.upfront > 0 || pass.daily > 0)) {
      passValue.textContent = 'This game has no monthly pass.';
      return;
    }
    const total = pass.upfront + pass.daily * pass.days;
    const worth = gemValue(total);
    const pulls = total / pullCost;
    const lead = pass.daily > 0 ? 'Logging in every day, the pass gives' : 'The pass gives';
    passValue.innerHTML = `${lead} <b>${int(total)}</b> gems: about <b>${pulls < 10 ? pulls.toFixed(1) : int(Math.round(pulls))}</b> pulls${worth ? `, worth <b>${worth}</b> at the best pack price` : ''}.`;
  });
  // Whose prices these are and what is an estimate, while the store is still the one a preset set.
  const storeNote = h('p', { class: 'note sec-note store-note', id: 'store-note' });
  controls.push(() => {
    const from = S().storeFrom || S().preset;
    const text = storeMatches(S(), from) ? presetById(from).storeNote || '' : '';
    storeNote.textContent = text;
    storeNote.hidden = !text;
  });
  // Gems and store: the free gems coming in, what a pull costs, and what's for sale, in one dropdown.
  root.append(
    section(
      { title: 'Gems and store', icon: 'gem', summary: () => `${int(S().freePerDay)} free gems a day · ${int(S().pullCost)} gems a pull` },
      storeNote,
      stepper({
        id: 'free-day',
        label: 'Free gems a day',
        about: "Free gems a player earns per day of the season, from daily tasks, events and endgame modes. About a fifth comes only on days they log in; the rest, the week's events and endgame, comes in full at their first log-in that week. Guides put Genshin at 70 to 95 free pulls a version.",
        note: () => (S().freePerDay === 0 ? 'none' : gemValue(S().freePerDay) ? `≈ ${gemValue(S().freePerDay)} a day` : 'no store price'),
        get: () => S().freePerDay,
        set: (v) => (S().freePerDay = v),
        step: gemStep,
        min: 0,
        max: 5000,
      }),
      stepper({
        id: 'pull-cost',
        label: 'Gems a pull',
        about: 'How much premium currency one pull costs. Genshin Impact, Honkai: Star Rail and Zenless Zone Zero use 160.',
        note: () => (gemValue(S().pullCost) ? `from ${gemValue(S().pullCost)} a pull` : 'no store price'),
        get: () => S().pullCost,
        set: (v) => (S().pullCost = v),
        step: gemStep,
        min: 1,
        max: 10000,
      }),
      h('div', { class: 'row-title sub-head' }, h('span', { class: 'row-name' }, 'Gem packs'), info('US prices. Each pack gives its gems plus the bonus shown. Whales and dolphins buy from these: when one pack covers everything they still need they take the cheapest of those, and otherwise the best value for money they can afford.', 'gem packs')),
      packRows,
      packSummary,
      h(
        'div',
        { class: 'row-title sub-head' },
        h('span', { class: 'row-name' }, 'Monthly pass'),
        info(
          () =>
            `Gems up front, then gems on each day the player logs in, for as long as it lasts. Gacha Lab only counts a pass that pays out the currency the banner uses. Whales, dolphins and pass buyers buy each new monthly pass.${hasPassNow() ? '' : ' With everything at zero, the game has no pass and pass buyers play as free players.'}`,
          'the monthly pass',
        ),
      ),
      stepper({ id: 'pass-price', label: 'Price', aria: 'monthly pass price', get: () => S().pass.price, set: (v) => (S().pass.price = v), step: 1, min: 0, max: 100, decimals: 2, prefix: '$' }),
      stepper({ id: 'pass-up', label: 'Gems up front', aria: 'monthly pass gems up front', get: () => S().pass.upfront, set: (v) => (S().pass.upfront = v), step: gemStep, min: 0, max: 100000 }),
      stepper({ id: 'pass-daily', label: 'Gems a day', aria: 'monthly pass gems a day', get: () => S().pass.daily, set: (v) => (S().pass.daily = v), step: gemStep, min: 0, max: 10000 }),
      stepper({ id: 'pass-days', label: 'Lasts', aria: 'monthly pass length', get: () => S().pass.days, set: (v) => (S().pass.days = v), step: 1, min: 1, max: 365, suffix: ' days' }),
      passValue,
    ),
  );

}

function syncSettings() {
  for (const show of controls) show();
}

// ---------------------------------------------------------------------------------------------
// Running

let runTimer = 0;
// How many players make a run slow enough that the page should say it is working. The run blocks the page while
// it happens, so the word has to be on screen before it starts: `changed` paints it, and the 60ms wait before the
// run gives the browser time to do that.
const SLOW_SAMPLE = 100000;

function changed() {
  syncSettings();
  saveSettings();
  document.body.classList.toggle('is-working', S().sampleSize >= SLOW_SAMPLE);
  clearTimeout(runTimer);
  runTimer = setTimeout(run, 60);
}

// A setting the visitor changed by hand: counted once a visit, then the usual update.
function edited() {
  stats.once('edit');
  changed();
}

// A typical player of a type: the one with the median spend (luck aside, the most ordinary).
function typicalOfType(t) {
  const { typeOf } = state.run.ctx;
  const { spendCents } = state.run.out;
  const pool = [];
  for (let i = 0; i < typeOf.length; i++) if (typeOf[i] === t) pool.push(i);
  if (!pool.length) return 0;
  pool.sort((a, b) => spendCents[a] - spendCents[b] || a - b);
  return pool[Math.floor(pool.length / 2)];
}

function run() {
  stopReplay();
  const t0 = performance.now();
  state.run = simulate(S());
  state.freeCost = freeGemCost(S(), state.run);
  state.ms = performance.now() - t0;
  document.body.classList.remove('is-working');
  if (state.selected === null) state.selected = typicalOfType(WHALE);
  else if (state.selected >= state.run.ctx.N) state.selected = -1;
  renderRun();
  scheduleCheck();
  scheduleSuggestions();
}

// ---------------------------------------------------------------------------------------------
// Results

function renderRun() {
  const { run } = state;
  const { ctx, totals } = run;
  const free = totals.byType[FREE];
  $('#run-summary').innerHTML = `<b>${int(ctx.N)}</b> players · <b>${ctx.s.days}</b> days · <span id="day-label">Day ${state.day ?? ctx.s.days} of ${ctx.s.days}</span>`;
  field.setRun(run);
  field.setSelected(state.selected);
  $('#field').setAttribute(
    'aria-label',
    `${int(ctx.N)} players. ${TYPE_NAMES.map((n, t) => `${n}: ${int(totals.byType[t].players)}, ${int(totals.byType[t].gotFeatured)} got the featured legendary`).join('. ')}.`,
  );
  const states = [0, 0, 0];
  for (let i = 0; i < ctx.N; i++) {
    if (run.out.featured[i] > 0) states[1] += 1;
    else if (run.out.fives[i] > 0) states[2] += 1;
    else states[0] += 1;
  }
  $('#share-warning').hidden = !ctx.overfull;
  // Past about 12,000 players the field draws one in every few, or the dots shrink to mush. The counts beside each
  // outcome, and every number on the page, still come from all of them — so the lead has to stop saying otherwise.
  const stride = strideFor(ctx.N);
  const lead = $('#legend-lead');
  lead.classList.toggle('is-thinned', stride > 1);
  if (stride > 1) lead.innerHTML = `Each dot is <b>${int(stride)} players</b>`;
  else lead.textContent = 'Each dot is one player:';
  state.endCounts = states;
  paintCounts(states);
  $('#live').textContent = `Season done: ${pctSome(free.gotFeatured / Math.max(1, free.players))} of free players got the featured legendary. Revenue ${usd(totals.revenueCents)}.`;
  renderInspector();
  renderMoney();
  renderOutcomes();
}

function renderMoney() {
  const { totals, ctx } = state.run;
  const rev = totals.revenueCents;
  // Whales and dolphins are who the banner is built for, so their income gets its own tiles; the colour
  // swatch matches their part of the revenue bar below.
  // Every tile reads the same way: label, value, then the key share on one line and the detail under it.
  // Only Revenue is green, so the eye lands there first; the others are plain ink with a small mark.
  // Revenue shares are rounded together (revenueShares), so the tiles, the bar's key and the dot labels agree
  // and add up to 100%.
  const shares = revenueShares(totals);
  // the dollars too: whale + dolphin tiles add up to the total under the bar, and with no pass buyers to revenue
  const shown = shownParts([0, 1, 2].map((t) => totals.byType[t].spendCents));
  const money = (cents) => usd(cents, { compact: true, wholeDollars: shown.whole });
  const spender = (t, label, name, swatch) => {
    const g = totals.byType[t];
    return {
      label,
      swatch,
      about: spenderAbout(name),
      value: money(shown.cents[t]),
      main: rev ? `${shares.text[t]} of revenue` : 'no revenue',
      detail: `${int(g.players)} of ${int(ctx.N)} players`,
    };
  };
  const priced = totals.freeGemsValueCents != null;
  const noFreeGems = ctx.s.freePerDay === 0 && !ctx.s.startGems;
  // Free gems a player, in pulls: the one figure that compares across games, whose pulls cost anything from 3 gems
  // (Fate/Grand Order) to 600 (Arknights).
  const freePulls = totals.freeGems / ctx.N / ctx.s.pullCost;
  const freeCost = state.freeCost;
  // Revenue is one whole number: everything players paid, gem packs and monthly passes added together (her call,
  // 7 Oct 2026). The words under it say what's in it; separate amounts for packs and passes read as extra income, so
  // none are shown. The average a payer spent is in its (i).
  const tiles = [
    {
      label: 'Revenue',
      about: `All the real money players spent this season${ctx.pass ? ': gem packs plus monthly passes' : ', all on gem packs'}.${totals.payers ? ` ${int(totals.payers)} players paid, ${usd(rev / totals.payers)} each on average.` : ''}`,
      value: usd(rev, { compact: true }),
      main: !rev ? 'nobody paid' : ctx.pass ? 'packs + monthly passes' : 'all from packs',
      detail: totals.payers ? `paid by ${pct(totals.payers / ctx.N, 1)} of players` : '',
      money: true,
    },
    spender(WHALE, 'Whales', 'whale', COLORS.ramp[2]),
    spender(DOLPHIN, 'Dolphins', 'dolphin', COLORS.ramp[1]),
    noFreeGems
      ? { label: 'Free gems given away', value: 'None', main: 'no free gems in this game', detail: 'free players never pull', gem: true }
      : {
          label: 'Free gems given away',
          // The money figure is what the giveaway COSTS, not what the gems would sell for (her call, 18 Oct 2026).
          // It is a difference between two seasons, so on a small sample a lot of it can be luck: with only about
          // 13 payers in 1,000, two whales crossing a pack boundary move it by $200. When two standard errors
          // would reach zero, the tile says so instead of letting a precise-looking figure stand.
          about:
            `What the giveaway costs: the same season with nothing given away, against this one, with the same players and the same dice.` +
            (freeCost == null
              ? ''
              : ` It brings in ${usd(Math.abs(freeCost.cents), { wholeDollars: true })} ${freeCost.cents >= 0 ? 'more' : 'less'} without them, ${pctSome(Math.abs(freeCost.cents) / Math.max(1, rev))} of this season, give or take ${usd(Math.round(2 * freeCost.seCents), { wholeDollars: true })} of luck. With so few payers a single season swings too much to read, so this is the average over ${int(freeCost.dice)} ${freeCost.dice === 1 ? 'set' : 'sets'} of dice: it answers what the giveaway costs, not what it cost this time, and New dice leaves it where it is. A bigger sample narrows it further.`) +
            ` The game handed out ${int(totals.freeGems)} gems, ${freePulls.toFixed(1)} pulls a player, which is how games of different gem prices compare.` +
            (priced ? ` At the cheapest repeat price in the store they would have sold for ${usd(totals.freeGemsValueCents)}, but that prices currency that mostly goes to players who would never have bought any, so it is not what the giveaway costs.` : ''),
          // whole dollars: this is an average over several sets of dice, give or take tens of dollars of luck,
          // so cents would be precision it does not have
          value: freeCost == null ? int(totals.freeGems) : usd(Math.max(0, freeCost.cents), { compact: true, wholeDollars: true }),
          main:
            freeCost == null
              ? `${freePulls < 10 ? freePulls.toFixed(1) : int(Math.round(freePulls))} pulls a player`
              : Math.abs(freeCost.cents) < 2 * freeCost.seCents
                ? 'too close to tell on this sample'
                : `${pctSome(Math.abs(freeCost.cents) / Math.max(1, rev))} of revenue, given up`,
          detail: `${int(totals.freeGems)} gems, ${freePulls < 10 ? freePulls.toFixed(1) : int(Math.round(freePulls))} pulls a player`,
          gem: true,
        },
  ];
  $('#tiles').innerHTML = tiles
    .map(
      (t) => `<div class="tile"><span class="tile-label">${t.gem ? '<svg class="gem-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2.8h6l3 3.6L8 13.4 2 6.4zM2 6.4h12M6.4 2.8 5.4 6.4 8 13.4l2.6-7-1-3.6"></path></svg>' : ''}${t.swatch ? `<span class="swatch" style="background:${t.swatch}" aria-hidden="true"></span>` : ''}${t.label}${t.about ? infoHtml(t.about, t.label.toLowerCase()) : ''}</span>
      <span class="tile-value${t.money ? ' is-money' : ''}">${t.value}</span><span class="tile-sub">${[t.main].flat().map((line) => `<span class="ts-main">${line}</span>`).join('')}<span class="ts-detail">${t.detail}</span></span></div>`,
    )
    .join('');
  renderHud(tiles, rev, ctx.N);
  revenueSplit($('#split'), totals, COLORS);
  renderPackShares();
  // The packs and passes are in the Revenue tile now; the line beside the heading only explains a game without a
  // pass, whose would-be pass buyers play free (engine.js prepare), since that lowers who pays.
  // The figure the published numbers are about, so the page can be held against them: a player type's share is not
  // comparable (the 0.2% called whales is only the top 2.2% of payers where 9.3% pay).
  $('#top-tenth').innerHTML = rev
    ? `The biggest <b>tenth of payers</b> brings <b>${pctSome(totals.topTenthShare)}</b> of revenue.${
        totals.topTenthShare >= 0.8 && totals.topTenthShare <= 0.87
          ? ` Mobile studies put that at 80\u201387%${infoHtml('HoYoverse\u2019s 2017 filing: the top 10.4% of payers brought 80.1% of top-ups. GameAnalytics 2015: the top 0.20% of players, where only 2.09% paid at all, brought 86.6% \u2014 the same tenth of payers, read another way. This is the figure to compare a game against, not any one type\u2019s share.', 'the biggest tenth of payers')}.`
          : ''
      }`
    : '';
  const passShare = ctx.s.types.pass.share;
  $('#money-note').textContent = !rev
    ? 'Nobody paid this season.'
    : ctx.pass || !(passShare > 0)
      ? ''
      : `This game has no monthly pass, so the ${parseFloat((passShare * 100).toFixed(1))}% of players who'd buy one play free here.`;
}

// What share of the season's gem-pack money came through each row of the store. The store is a setting, so its
// cells are drawn with the settings; these are results, so they are filled in after each run. A pack nobody bought
// shows a dash, not 0%, so "sold nothing" and "sold a rounding error" don't look the same.
function renderPackShares() {
  const { totals, ctx } = state.run;
  const packTotal = totals.packSales.reduce((acc, p) => acc + p.cents, 0);
  let top = null;
  totals.packSales.forEach((p, k) => {
    const cell = document.getElementById(`pack-share-${k}`);
    if (cell) {
      cell.textContent = p.count && packTotal ? pctSome(p.cents / packTotal) : '\u2013';
      cell.title = p.count ? `${int(p.count)} sold, ${usd(p.cents)}` : 'nobody bought this pack';
    }
    if (p.count && (!top || p.cents > top.cents)) top = p;
  });
  const summary = $('#pack-summary');
  if (!summary) return;
  if (!ctx.packs.length) {
    summary.textContent = 'Nothing in the store has both a price and gems, so nobody can buy gems.';
    return;
  }
  if (!top) {
    summary.textContent = 'Nobody bought a gem pack this season.';
    return;
  }
  // Whales and dolphins are the only ones with a pack budget (engine.js prepare).
  const spenders = totals.byType[WHALE].players + totals.byType[DOLPHIN].players;
  const spent = totals.byType[WHALE].spendCents + totals.byType[DOLPHIN].spendCents - totals.byType[WHALE].passCents - totals.byType[DOLPHIN].passCents;
  const outOfBudget = totals.byType[WHALE].outOfBudget + totals.byType[DOLPHIN].outOfBudget;
  // The budget line is the answer to "I raised a price and revenue barely moved": past a point the wallet, not the
  // price, is what sets revenue.
  const budgetLine = outOfBudget
    ? ` <b>${int(outOfBudget)}</b> of <b>${int(spenders)}</b> used up their budget, so raising prices past this adds less and less.`
    : '';
  const share = `<b>${pctSome(top.cents / packTotal)}</b> of it on the <b>${usd(Math.round(top.price * 100))}</b> pack`;
  // Packs a spender, averaged over everyone with a budget, bought or not: the figure she asked for (19 Oct 2026),
  // and it only means anything now that buying is spread across the season rather than finished on day 1.
  const packsEach = spenders ? (totals.byType[WHALE].packs + totals.byType[DOLPHIN].packs) / spenders : 0;
  summary.innerHTML =
    `Whales and dolphins bought <b>${packsEach < 10 ? packsEach.toFixed(1) : int(Math.round(packsEach))}</b> gem packs each, <b>${usd(spent)}</b> in all, ${share}. ` +
    `They buy the best value for money they can afford, one top-up a day.${budgetLine}`;
}

// The three outcomes, written the same way wherever they are shown: at the end of a season and on every day of a
// replay. Counts alone made them hard to weigh against each other (her call, 19 Oct 2026), so each now carries its
// share and the bar above draws them in proportion. `counts` is indexed the way dotState is: 0 none, 1 featured,
// 2 a legendary that lost the 50/50.
function paintCounts(counts) {
  const total = counts[0] + counts[1] + counts[2];
  const shares = sharesOf([counts[1], counts[2], counts[0]], 1);
  const put = (id, n, k) => {
    $(`#count-${id}`).textContent = int(n);
    $(`#share-${id}`).textContent = total ? `${shares[k]}%` : '';
  };
  put('featured', counts[1], 0);
  put('off', counts[2], 1);
  put('none', counts[0], 2);
  outcomeSplit($('#outcome-split'), { featured: counts[1], off: counts[2], none: counts[0] }, total, COLORS);
}

// How many spenders the budget is actually holding back, for the Budget (i). Empty before the first run.
function budgetBiteNote() {
  if (!state.run) return '';
  const { totals } = state.run;
  const spenders = totals.byType[WHALE].players + totals.byType[DOLPHIN].players;
  const out = totals.byType[WHALE].outOfBudget + totals.byType[DOLPHIN].outOfBudget;
  if (!spenders) return '';
  return out
    ? `Here it holds back ${int(out)} of ${int(spenders)} spenders (${pctSome(out / spenders)}).`
    : '';
}

function renderOutcomes() {
  const { totals, ctx } = state.run;
  const rows = totals.byType.map((t, k) => {
    if (!t.players) return ''; // a type nobody is, like pass buyers in a game with no pass
    const def = ctx.defs[k];
    const payers = t.payers;
    return `<tr${k === WHALE ? ' class="is-whale"' : ''}>
      <th scope="row">${TYPE_NAMES[k]}</th>
      <td>${int(t.players)}</td>
      <td>${t.players ? pctSome(t.gotFeatured / t.players) : '–'}</td>
      <td>${t.players ? pctSome(t.goalMet / t.players) : '–'} <span class="quiet">(${copyRange(def.goal)})</span></td>
      <td>${t.players ? (t.copies / t.players).toFixed(2) : '–'}</td>
      <td>${t.players ? usd(t.spendCents / t.players) : '–'}</td>
      <td>${payers ? usd(t.maxSpendCents) : '–'}</td>
    </tr>`;
  });
  const all = totals;
  const allFeat = totals.byType.reduce((a, t) => a + t.gotFeatured, 0);
  rows.push(`<tr class="total"><th scope="row">Everyone</th><td>${int(all.players)}</td><td>${pctSome(allFeat / all.players)}</td><td>–</td>
    <td>${(all.copies / all.players).toFixed(2)}</td><td>${usd(all.revenueCents / all.players)}</td><td>${usd(Math.max(...totals.byType.map((t) => t.maxSpendCents)))}</td></tr>`);
  $('#outcome-table').innerHTML = `<thead><tr><th scope="col">Player type</th><th scope="col">Players</th><th scope="col">Got the featured legendary</th>
    <th scope="col">Reached their goal</th><th scope="col">Copies each</th><th scope="col">Spend each</th><th scope="col">Top spender</th></tr></thead>
    <tbody>${rows.join('')}</tbody>`;
}

// ---------------------------------------------------------------------------------------------
// Player inspector

function describeHow(how, rules) {
  if (how === HOW.WON && rules?.featuredChance >= 1) return 'Featured';
  if (how === HOW.SPARK && rules?.spark?.resetOnFeatured) return `Guarantee at ${int(sparkPulls(rules))}`;
  return { [HOW.WON]: 'Won 50/50', [HOW.LOST]: 'Lost 50/50', [HOW.GUARANTEED]: 'Guaranteed', [HOW.RADIANCE]: 'Radiance', [HOW.SPARK]: 'Spark', [HOW.FREE]: 'Free copy' }[how];
}

// Why a player stopped short of their goal.
function shortfall(trace, ctx) {
  const { row, log } = trace;
  const lastPlayed = [...log.days].reverse().find((d) => d.played);
  if (!lastPlayed) return 'never logged in';
  if (row.budgetCents) {
    // with nothing priced in the store, a budget can't buy anything
    if (!ctx.packs.length) return 'nothing in the store has a price';
    const cheapest = Math.min(...ctx.packs.map((p) => p.cents));
    if (row.budgetCents - (row.spendCents - row.passCents) < cheapest) return 'ran out of budget';
  }
  // a player who logged in but never had a gem: only possible when the game gives no free gems
  if (!row.freeGems && !row.passGems && !row.boughtGems) return 'no gems to pull with: this game gives no free gems';
  if (lastPlayed.gemsAtEnd < ctx.s.pullCost) return 'ran out of gems';
  return 'the season ended first';
}

// The player card: only what explains the economy. Who they are, what they got, what it cost, and
// where the gems behind their pulls came from. The full trace is for #lab.
function renderInspector() {
  const el = $('#inspector');
  const { run } = state;
  const i = state.selected;
  if (i == null || i < 0) {
    el.innerHTML = `<p class="insp-empty">No player selected.</p>
      <div class="insp-pick">
        <button type="button" class="btn small" data-typical="${WHALE}">Show a typical whale</button>
        <button type="button" class="btn small" data-typical="${DOLPHIN}">Show a typical dolphin</button>
        <button type="button" class="btn small" data-typical="${FREE}">Show a typical free player</button>
      </div>`;
    el.querySelectorAll('[data-typical]').forEach((b) => (b.onclick = () => pick(typicalOfType(Number(b.dataset.typical)))));
    return;
  }
  const trace = tracePlayer(i, run.ctx);
  const { row } = trace;
  const t = trace.type;
  const goal = row.goal; // this player's own goal
  let result;
  const about = infoHtml(copiesAbout(run.ctx), 'copies');
  if (row.featured >= goal) {
    result = goal === 1 ? `<b>Got the featured legendary</b> · by day ${row.goalDay}` : `<b>${copies(goal)}</b>${about} · all they wanted, by day ${row.goalDay}`;
  } else if (row.featured > 0) result = `<b>${row.featured} of ${goal} copies</b>${about} · ${shortfall(trace, run.ctx)}`;
  else if (row.fives > 0) result = `<b>Lost the 50/50</b> · a legendary, but not the featured one; ${shortfall(trace, run.ctx)}`;
  else result = `<b>No legendary</b> · ${shortfall(trace, run.ctx)}`;
  const gems = [
    { key: 'free', name: 'free', value: row.freeGems, color: COLORS.gem },
    { key: 'pass', name: 'pass', value: row.passGems, color: COLORS.ramp[0] },
    { key: 'bought', name: 'bought', value: row.boughtGems, color: COLORS.ramp[1] },
  ].filter((g) => g.value > 0);
  const total = gems.reduce((a, g) => a + g.value, 0) || 1;
  // Whole percentages that add up to 100; a sliver shows as "<1%".
  const whole = sharesOf(gems.map((g) => g.value));
  const shareText = (k) => (whole[k] === 0 ? '<1%' : `${whole[k]}%`);
  el.innerHTML = `
    <div class="insp-head">
      <div><span class="insp-title">Player ${int(i + 1)}</span> <span class="chip${t === WHALE ? ' whale' : ''}">${TYPE_ONE[t]}</span></div>
      <div class="insp-nav">
        <button type="button" class="btn small" id="prev-player" aria-label="Previous player">‹</button>
        <button type="button" class="btn small" id="next-player" aria-label="Next player">›</button>
        <button type="button" class="btn small" id="close-player" aria-label="Close player card">×</button>
      </div>
    </div>
    <p class="insp-result"><span class="mini ${row.featured ? 'dot' : row.fives ? 'ring' : 'none'}" aria-hidden="true"></span>${result}</p>
    <div class="insp-stats">
      <div><span class="v is-money">${usd(row.spendCents)}</span><span class="l">spent</span></div>
      <div><span class="v">${int(row.pulls)}</span><span class="l">pulls</span></div>
      <div><span class="v">${row.daysPlayed}/${run.ctx.s.days}</span><span class="l">days played</span></div>
    </div>
    <div class="insp-gems">
      <span class="l">Their gems came from</span>
      ${
        gems.length
          ? `<div class="gem-bar" role="img" aria-label="${gems.map((g, k) => `${shareText(k)} ${g.name}`).join(', ')}">${gems
              .map((g) => `<span style="width:${(g.value / total) * 100}%;background:${g.color}"></span>`)
              .join('')}</div>
      <ul class="gem-legend">${gems.map((g, k) => `<li><span class="swatch" style="background:${g.color}"></span>${shareText(k)} ${g.name}</li>`).join('')}</ul>`
          : '<p class="quiet gem-none">No gems this season.</p>'
      }
    </div>
    ${state.lab ? labTrace(trace) : ''}`;
  if (state.lab) sawtooth($('#saw'), trace, run.ctx.rules, COLORS);
  $('#prev-player').onclick = () => pick((i - 1 + run.ctx.N) % run.ctx.N);
  $('#next-player').onclick = () => pick((i + 1) % run.ctx.N);
  $('#close-player').onclick = () => pick(-1);
}

// A spark trade or a free copy: a featured copy that didn't come from a pull, so it has no pity.
const notPulled = (f) => f.how === HOW.SPARK || f.how === HOW.FREE;

// Everything about one player, for checking the logic (#lab only).
function labTrace(trace) {
  const { row, log } = trace;
  const ctx = state.run.ctx;
  const fiveRows = log.fives.length
    ? log.fives
        .map(
          (f, k) => `<tr><td>${k + 1}</td><td>${int(f.pull)}</td><td>${f.day}</td><td>${notPulled(f) ? '–' : f.pity}${!notPulled(f) && f.pity >= ctx.rules.hardPity ? ' <span class="quiet">hard</span>' : !notPulled(f) && f.pity >= ctx.rules.softPityStart ? ' <span class="quiet">soft</span>' : ''}</td>
          <td><span class="mini ${f.how === HOW.LOST ? 'ring' : 'dot'}" aria-hidden="true"></span>${describeHow(f.how, ctx.rules)}</td></tr>`,
        )
        .join('')
    : '<tr><td colspan="5" class="quiet">No legendary this season.</td></tr>';
  const dayRows = log.days
    .map(
      (d) => `<tr${d.played ? '' : ' class="quiet"'}><td>${d.day}</td><td>${d.played ? 'yes' : 'no'}</td><td>${int(d.gemsAtStart)}</td>
      <td>${d.free ? `+${int(d.free)}` : '–'}</td><td>${d.pass ? `+${int(d.pass)}` : '–'}</td><td>${d.bought ? `+${int(d.bought)}` : '–'}</td><td>${d.pulls || '–'}</td><td>${int(d.gemsAtEnd)}</td><td>${d.pity}</td></tr>`,
    )
    .join('');
  return `<div class="lab-trace">
    <p class="lab-tag">Lab: full trace</p>
    <dl class="facts">
      <div><dt>Budget</dt><dd>${row.budgetCents ? usd(row.budgetCents) : '–'}</dd></div>
      <div><dt>Gems in</dt><dd>${int(row.freeGems)} free + ${int(row.passGems)} pass + ${int(row.boughtGems)} bought</dd></div>
      <div><dt>Gems left</dt><dd>${int(row.gemsLeft)}</dd></div>
      <div><dt>Pity now</dt><dd>${row.pityEnd}${row.guaranteedEnd ? ', next legendary guaranteed featured' : ''}</dd></div>
    </dl>
    <div class="insp-chart" id="saw"></div>
    <div class="table-wrap"><table class="mini-table"><caption>Every legendary</caption>
      <thead><tr><th scope="col">#</th><th scope="col">Pull</th><th scope="col">Day</th><th scope="col">Pity</th><th scope="col">Result</th></tr></thead>
      <tbody>${fiveRows}</tbody></table></div>
    <details class="days"><summary>Day by day</summary>
      <div class="table-wrap"><table class="mini-table"><thead><tr><th scope="col">Day</th><th scope="col">Played</th><th scope="col">Gems at start</th><th scope="col">Free</th><th scope="col">Pass</th><th scope="col">Bought</th><th scope="col">Pulls</th><th scope="col">Gems at end</th><th scope="col">Pity</th></tr></thead>
      <tbody>${dayRows}</tbody></table></div></details>
  </div>`;
}

// What whales and dolphins are, for the (i) on their money tiles: one line with who they are, their share, the
// copies they want and the most they'd spend, then the source in a few words (only while the numbers are the
// defaults). Kept short at her call (7 Oct 2026); the full reasoning is in docs/MODEL.md.
function spenderAbout(name) {
  const d = S().types[name];
  const share = `${parseFloat((d.share * 100).toFixed(2))}%`;
  const defaults = d.share === DEFAULT_SETTINGS.types[name].share && d.budget === DEFAULT_SETTINGS.types[name].budget && d.goal === DEFAULT_SETTINGS.types[name].goal;
  const who = name === 'whale' ? 'The biggest spenders' : 'Mid-size spenders';
  const source = name === 'whale' ? " From mobile-game studies and HoYoverse's 2017 filing." : " From HoYoverse's 2017 filing.";
  // each one's own limit is half to one and a half times the type's budget (engine.js BUDGET_LOW / BUDGET_HIGH)
  return `${who}: ${share} of players. Each wants ${copyRange(goalOf(name))} and buys what it takes, within a limit of $${int(d.budget * BUDGET_LOW)} to $${int(d.budget * BUDGET_HIGH)}.${defaults ? source : ''}`;
}

// Why players pull for more copies, for the (i) beside a player's copies: the goals this run used.
function copiesAbout(ctx) {
  const whale = ctx.defs[WHALE].goal;
  const dolphin = ctx.defs[DOLPHIN].goal;
  return `How many copies of the featured legendary this player has (Genshin's C6 is 7 copies). Each whale here wants ${copyRange(whale)}, each dolphin ${copyRange(dolphin)}. If duplicates don't matter in your game, turn off Extra copies in Banner rules.`;
}

// Where the numbers come from, for the (i) after the tagline. No credit line: it came out on 7 Oct 2026.
const SOURCES_ABOUT =
  "The banner rules come from each game's published odds, or wikis that copy the in-game text, and from player-run datasets of millions of pulls. Who pays and how much follows HoYoverse's own 2017 IPO filing and large industry studies (Swrve, GameAnalytics); how often players log in follows market data from Korea, Japan and China. Games vary a lot (a 2023 study of 2,873 mobile games). It's a model, so treat the results as a starting point, not a forecast.";

// Select a player, or -1 to close the card. Picking the selected player again closes it.
function pick(i) {
  state.selected = i >= 0 && i === state.selected ? -1 : i;
  if (state.selected >= 0) stats.once('player');
  field.setSelected(state.selected);
  renderInspector();
}

// ---------------------------------------------------------------------------------------------
// Math check

let checkTimer = 0;
function scheduleCheck() {
  clearTimeout(checkTimer);
  if (!state.lab) return;
  const rules = structuredClone(S().rules);
  const key = JSON.stringify(rules);
  if (key === state.checkKey && state.check) {
    renderCheck();
    return;
  }
  $('#math-table').classList.add('stale');
  checkTimer = setTimeout(() => {
    state.check = testRules(rules, CHECK_FIVES, S().seed);
    state.checkRules = rules;
    state.checkKey = key;
    renderCheck();
  }, 120);
}

function renderCheck() {
  const rules = state.checkRules;
  const c = state.check;
  const preset = PRESETS.find((p) => p.rules && rulesMatch(rules, p.rules)) || null;
  const rows = checkRows(rules, c, preset);
  $('#math-table').classList.remove('stale');
  $('#math-table').innerHTML = `<thead><tr><th scope="col">Check</th><th scope="col">This test</th><th scope="col">Exact maths</th><th scope="col">Published</th><th scope="col">Result</th></tr></thead>
    <tbody>${rows
      .map(
        (r) => `<tr><th scope="row">${r.name}</th><td>${r.measured}</td><td>${r.expected}</td><td class="quiet">${r.published}</td>
        <td><span class="status ${r.ok ? 'ok' : 'off'}">${r.ok ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"></path></svg>Matches' : '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"></path></svg>Off'}</span></td></tr>`,
      )
      .join('')}</tbody>`;
  const whose = !preset
    ? ' These are custom rules, so there is nothing published to compare with.'
    : preset.id === S().preset
      ? ` These are the ${preset.name} rules, so the publisher's numbers are shown beside them.`
      : ` These rules match ${preset.name}, so its publisher's numbers are shown beside them.`;
  $('#math-note').textContent = `${int(c.fives)} legendaries (${int(c.pulls)} pulls) on the rules from the left panel, separate from the players. "Matches" means within four standard errors of the exact maths (for rare events, an exact test instead).${whose}${sparkPulls(rules) || freeCopyPulls(rules).length ? ' It checks the pull rules only; the spark and free copies come on top.' : ''}`;
  pityChart($('#pity-chart'), c, pityDistribution(rules), rules, COLORS);
}

// ---------------------------------------------------------------------------------------------
// Smart suggestions

let suggestTimer = 0;
function scheduleSuggestions() {
  clearTimeout(suggestTimer);
  const token = ++state.suggestToken;
  if (!state.lab) return; // lab-only for now: nothing is computed while it's hidden
  const body = $('#suggest-body');
  body.classList.add('stale');
  suggestTimer = setTimeout(() => {
    // Always 10,000 players, whatever the sample on screen: enough whales for the whale guard to mean
    // something, and the same dice as the run so the differences come from the change.
    const settings = structuredClone(state.run.ctx.s);
    settings.sampleSize = SUGGEST_SAMPLE;
    const base = settings.sampleSize === state.run.ctx.N ? state.run : simulate(settings);
    const results = [];
    const iter = testLevers(settings, base);
    const stepOnce = () => {
      if (token !== state.suggestToken) return;
      const t0 = performance.now();
      while (performance.now() - t0 < 30) {
        const next = iter.next();
        if (next.done) {
          renderSuggestions(rank(results), base);
          return;
        }
        results.push(next.value);
      }
      setTimeout(stepOnce, 0);
    };
    stepOnce();
  }, 250);
}

const escAttr = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// An (i) button inside HTML built as a string; a delegated click handler opens it.
function infoHtml(text, about) {
  return `<button type="button" class="info-btn" data-info="${escAttr(text)}" aria-label="About ${escAttr(about)}" aria-expanded="false">${INFO_GLYPH}</button>`;
}

function suggestionCard(r) {
  return `<li class="suggestion">
    <div class="sg-title">${r.title}</div>
    ${r.note ? `<p class="sg-note">${r.note}</p>` : ''}
    <div class="sg-effects">
      <span><span class="sg-k">Revenue</span> <b>${signedPct(r.revenue)}</b></span>
      <span><span class="sg-k">Free players with the featured legendary</span> <b>${signedPts(r.freeFeatured)}</b></span>
      ${Math.abs(r.whaleGoal) >= 0.005 ? `<span><span class="sg-k">Whales reaching their goal</span> <b>${signedPts(r.whaleGoal)}</b></span>` : ''}
      ${r.closeCall ? `<span class="close-call">Close call${infoHtml('This one sits close to a limit. With different dice it could land on the other side.', 'close calls')}</span>` : ''}
    </div>
    <button type="button" class="btn small" data-apply="${r.id}">Use this</button>
  </li>`;
}

function renderSuggestions(ranked, base) {
  const body = $('#suggest-body');
  body.classList.remove('stale');
  const all = [...ranked.earn, ...ranked.keep];
  const free = base.totals.byType[FREE];
  state.suggestAbout = `Each change was tested on ${int(SUGGEST_SAMPLE)} pretend players with the same dice as this run, so most of each difference comes from the change itself. On those players, revenue was ${usd(base.totals.revenueCents)} and ${pct(free.gotFeatured / Math.max(1, free.players))} of free players got the featured legendary.`;
  const earnAbout = `The biggest revenue gains that cost free players at most ${Math.round(ranked.guard * 100)} points of their chance at the featured legendary, and whales at most ${Math.round(ranked.whaleGuard * 100)} points of their chance at reaching their goal. Changes that take away a player protection are never suggested.`;
  const keepAbout = 'The biggest gains for free players for the least revenue given up.';
  body.innerHTML = `
    <div class="sg-col"><h3>Earn more${infoHtml(earnAbout, 'earn more')}</h3>
      <ul>${ranked.earn.length ? ranked.earn.map(suggestionCard).join('') : '<li class="quiet">No single change raises revenue without hurting free players or whales more than the limits allow.</li>'}</ul>
      ${ranked.leftOut
        .map((r) => `<p class="left-out">Left out: ${r.title} (${signedPct(r.revenue)} revenue)${infoHtml("It would raise revenue, but it takes away a protection players count on, and this model can't measure what that costs in trust.", 'why it was left out')}</p>`)
        .join('')}</div>
    <div class="sg-col"><h3>Keep free players${infoHtml(keepAbout, 'keep free players')}</h3>
      <ul>${ranked.keep.length ? ranked.keep.map(suggestionCard).join('') : '<li class="quiet">No single change helps free players here.</li>'}</ul></div>`;
  body.querySelectorAll('[data-apply]').forEach((b) => {
    b.onclick = () => {
      const r = all.find((x) => x.id === b.dataset.apply);
      if (!r) return;
      state.settings = structuredClone(r.settings);
      state.settings.sampleSize = state.run.ctx.N; // keep the sample size on screen
      markCustom();
      changed();
      toast(`Using: ${r.title}`);
    };
  });
}

// ---------------------------------------------------------------------------------------------
// The money bar (tablets and phones)

// One column puts the settings above the results, so the figures leave the screen as soon as a section opens.
// This bar keeps revenue, the player outcomes and what the last change did floating at the bottom while the
// settings are in use, and hides itself the moment the Money card is back on screen.
const hudEl = $('#hud');
const hudPanel = $('#hud-panel');
const hudToggle = $('#hud-toggle');
const narrow = window.matchMedia('(max-width: 1000px), (max-width: 1366px) and (pointer: coarse)');
// Revenue as the previous run left it. Only runs of the same size compare: moving from 1,000 players to 10,000
// multiplies every figure, and the difference would say nothing about the banner.
let lastRevenue = null;
let moneyOnScreen = true;
let hudTiles = [];

hudToggle.addEventListener('click', () => {
  const open = hudToggle.getAttribute('aria-expanded') !== 'true';
  hudToggle.setAttribute('aria-expanded', String(open));
  hudToggle.setAttribute('aria-label', open ? 'Hide the money and player totals' : 'Show the money and player totals');
  hudPanel.hidden = !open;
  if (open) {
    renderHudPanel();
    stats.once('hud');
  }
});

function renderHud(tiles, revenueCents, n) {
  hudTiles = tiles;
  $('#hud-rev').textContent = usd(revenueCents, { compact: true });
  const delta = $('#hud-delta');
  const moved = lastRevenue && lastRevenue.n === n ? revenueCents - lastRevenue.cents : 0;
  // Under a dollar either way is rounding, not a change worth a chip.
  delta.hidden = Math.abs(moved) < 100;
  // An arrow on its own did not say what it meant (her question, 18 Oct 2026), so the chip says it: the sign
  // carries the direction and the words carry the rest.
  if (!delta.hidden) {
    const amount = `${moved > 0 ? '+' : '−'}${usd(Math.abs(moved), { compact: true, wholeDollars: true })}`;
    delta.innerHTML = `<b>${amount}</b><span>from your last change</span>`;
  }
  lastRevenue = { n, cents: revenueCents };
  hudCounts(state.endCounts || [0, 0, 0]);
  renderHudPanel();
  updateHud();
}

// The three outcomes, in the legend's own marks and order, each with the word for what it is: a mark and a
// number alone said nothing (her note, 18 Oct 2026). The replay calls this on every day it draws, so the bar
// counts up with the dots.
function hudCounts(counts) {
  const item = (cls, mark, n, word) =>
    `<span class="${cls}"><span class="mini ${mark}" aria-hidden="true"></span><b>${int(n)}</b><span class="hd-word">${word}</span></span>`;
  $('#hud-dots').innerHTML =
    item('hd-featured', 'dot', counts[1], 'featured') +
    item('hd-off', 'ring', counts[2], 'lost the 50/50') +
    item('hd-none', 'none', counts[0], 'no legendary');
  if (hudToggle.getAttribute('aria-expanded') === 'true') renderHudPanel();
}

// The four money figures, and nothing else: the bar's own rows already carry the outcomes and the change,
// and both stay in view while the panel is open.
function renderHudPanel() {
  if (hudPanel.hidden) return;
  hudPanel.innerHTML =
    `<div class="hud-grid">${hudTiles
      .map((t) => `<div class="hud-cell"><span class="hc-label">${t.label}</span><span class="hc-value${t.money ? ' is-money' : ''}">${t.value}</span></div>`)
      .join('')}</div>`;
}

// Show it on one-column screens, and only while the money figures themselves are off screen, so a number is
// never on the page twice. It watches the tiles rather than the whole Money card: the card's bar and key run on
// well below the last figure, and on a tablet that tail alone would keep the bar away for the whole page.
function updateHud() {
  const show = narrow.matches && !moneyOnScreen && !!state.run;
  hudEl.hidden = !show;
  document.body.classList.toggle('hud-on', show);
}
narrow.addEventListener('change', updateHud);
new IntersectionObserver(
  ([entry]) => {
    moneyOnScreen = entry.isIntersecting;
    updateHud();
  },
  // The card has to be properly on screen, not a sliver behind the bar, before the bar steps aside.
  { rootMargin: '0px 0px -140px 0px' },
).observe($('#tiles'));

// ---------------------------------------------------------------------------------------------
// Season replay

let replay = null;
// Legend counts for a given day of the replay (or the season's end).
function showCounts(day) {
  const { out, ctx } = state.run;
  const counts = [0, 0, 0];
  for (let i = 0; i < ctx.N; i++) counts[dotState(out, i, day)] += 1;
  paintCounts(counts);
  hudCounts(counts);
}

function stopReplay() {
  if (replay) cancelAnimationFrame(replay.raf);
  const wasPlaying = !!replay;
  replay = null;
  state.day = null;
  if (wasPlaying && state.run) showCounts(state.run.ctx.s.days);
  const btn = $('#play');
  if (btn) btn.textContent = 'Play the season';
  if (state.run) {
    field.setDay(null);
    const label = $('#day-label');
    if (label) label.textContent = `Day ${state.run.ctx.s.days} of ${state.run.ctx.s.days}`;
  }
}

function playSeason() {
  if (replay) {
    stopReplay();
    return;
  }
  stats.track('play');
  const days = state.run.ctx.s.days;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const perDay = reduce ? 450 : Math.max(60, Math.min(160, 5000 / days));
  const stride = reduce ? 7 : 1;
  const start = performance.now();
  $('#play').textContent = 'Stop';
  replay = { raf: 0 };
  const frame = (now) => {
    let d = Math.min(days, Math.max(1, Math.floor((now - start) / perDay) * stride + 1));
    if (d > days) d = days;
    state.day = d;
    field.setDay(d);
    $('#day-label').textContent = `Day ${d} of ${days}`;
    showCounts(d);
    if (d >= days) {
      replay = null;
      state.day = null;
      $('#play').textContent = 'Play the season';
      showCounts(days);
      return;
    }
    replay.raf = requestAnimationFrame(frame);
  };
  field.setDay(1);
  replay.raf = requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------------------------
// Files: the post image and the players CSV

// The parts wrapped in preview-only marker comments exist only for the private claude.ai preview; the public build
// (scripts/build-public.js) leaves them out.
/* preview-only */
let downloads = null;
const inViewer = typeof window.claude?.use === 'function';
/* end preview-only */

async function saveFile(filename, data) {
  /* preview-only */
  if (downloads) {
    try {
      await downloads.save({ filename, data });
    } catch (e) {
      if (e?.code === 'declined') return;
      if (e?.code === 'rate_limited') toast('A save is already waiting for you to confirm.');
      else toast('That file could not be saved here.');
    }
    return;
  }
  /* end preview-only */
  const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function playersCsv() {
  const { ctx, out } = state.run;
  const head = ['player', 'type', 'days_played', 'pulls', 'legendaries', 'featured_copies', 'goal_copies', 'sparked_copies', 'free_copies', 'lost_50_50', 'first_legendary_day', 'first_featured_day', 'goal_day', 'spend_usd', 'pass_usd', 'packs', 'passes', 'free_gems', 'pass_gems', 'bought_gems', 'gems_left', 'pity_at_end', 'guaranteed_at_end'];
  const lines = [head.join(',')];
  for (let i = 0; i < ctx.N; i++) {
    lines.push(
      [
        i + 1,
        TYPES[ctx.typeOf[i]] === 'pass' ? 'pass_buyer' : TYPES[ctx.typeOf[i]],
        out.daysPlayed[i],
        out.pulls[i],
        out.fives[i],
        out.featured[i],
        out.goal[i],
        out.sparked[i],
        out.freeCopies[i],
        out.offBanner[i],
        out.first5Day[i] || '',
        out.firstFeaturedDay[i] || '',
        out.goalDay[i] || '',
        (out.spendCents[i] / 100).toFixed(2),
        (out.passCents[i] / 100).toFixed(2),
        out.packs[i],
        out.passes[i],
        out.freeGems[i],
        out.passGems[i],
        out.boughtGems[i],
        out.gemsLeft[i],
        out.pityEnd[i],
        out.guaranteedEnd[i],
      ].join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}

async function postImage() {
  await document.fonts?.ready;
  const W = 1200;
  const H = 675;
  const canvas = document.createElement('canvas');
  canvas.width = W * 2;
  canvas.height = H * 2;
  const g = canvas.getContext('2d');
  g.scale(2, 2);
  g.fillStyle = COLORS.ground;
  g.fillRect(0, 0, W, H);
  const { totals, ctx } = state.run;
  const r = ctx.rules;
  const free = totals.byType[FREE];
  const whale = totals.byType[WHALE];
  // mark
  drawLogo(g, 50, 40, 44);
  g.fillStyle = COLORS.ink;
  g.font = '750 26px "Bricolage Grotesque", system-ui, sans-serif';
  g.fillText('Gacha Lab', 102, 72);
  g.fillStyle = COLORS.muted;
  g.font = '400 16px "Bricolage Grotesque", system-ui, sans-serif';
  g.fillText(presetById(ctx.s.preset).name, 56, 130);
  g.fillStyle = COLORS.ink2;
  // the players, the season and the banner rules in the sidebar's words, wrapped to stay inside the left column
  const num = (x) => `${parseFloat((x * 100).toFixed(3))}`;
  const parts = [
    `${int(ctx.N)} players`,
    `${ctx.s.days} days`,
    `${num(r.baseRate)}% base`,
    r.softPityStart < r.hardPity ? `soft pity ${r.softPityStart}` : 'no soft pity',
    r.hardPity < 999 ? `hard pity ${r.hardPity}` : 'no hard pity',
  ];
  if (r.featuredChance < 1) parts.push(`${num(r.featuredChance)}/${num(1 - r.featuredChance)}${r.guarantee ? ' + guarantee' : ''}`);
  if (r.radiance?.on) parts.push('Capturing Radiance');
  if (sparkPulls(r)) parts.push(r.spark.resetOnFeatured ? `featured by ${sparkPulls(r)}` : `spark ${sparkPulls(r)}`);
  const freeAt = freeCopyPulls(r);
  if (freeAt.length) parts.push(`free ${freeAt.length > 1 ? 'copies' : 'copy'} at ${freeAt.join(', ')}`);
  if (state.run.ctx.s.extraCopies === false) parts.push('first copy only');
  let line = '';
  let ly = 156;
  for (const part of parts) {
    const next = line ? `${line} · ${part}` : part;
    if (line && g.measureText(next).width > 450) {
      g.fillText(line, 56, ly);
      ly += 24;
      line = part;
    } else line = next;
  }
  g.fillText(line, 56, ly);
  const stats = [
    { v: pctSome(free.gotFeatured / Math.max(1, free.players)), l: 'of free players got', l2: 'the featured legendary' },
    { v: totals.revenueCents ? revenueShares(totals).text[WHALE] : '–', l: `of revenue from whales`, l2: `(${pct(whale.players / ctx.N, 1)} of players)` },
    { v: usd(totals.revenueCents), l: 'revenue this season', l2: `${pct(totals.payers / ctx.N, 1)} of players paid`, money: true },
  ];
  stats.forEach((s, k) => {
    const y = 250 + k * 120;
    g.fillStyle = s.money ? COLORS.money : COLORS.ink;
    g.font = '650 54px "Bricolage Grotesque", system-ui, sans-serif';
    g.fillText(s.v, 56, y);
    g.fillStyle = COLORS.muted;
    g.font = '400 18px "Bricolage Grotesque", system-ui, sans-serif';
    g.fillText(s.l, 56, y + 30);
    g.fillText(s.l2, 56, y + 54);
  });
  g.fillStyle = COLORS.muted;
  g.font = '400 15px "Bricolage Grotesque", system-ui, sans-serif';
  g.fillText('Made with Gacha Lab', 56, H - 40);
  // field + legend
  field.paint(g, { x: 560, y: 56, w: 584, h: 500 }, COLORS);
  const legend = [
    ['dot', 'Got the featured legendary'],
    ['ring', 'Lost the 50/50'],
    ['none', 'No legendary'],
  ];
  let lx = 560;
  legend.forEach(([kind, label]) => {
    g.beginPath();
    if (kind === 'dot') {
      g.fillStyle = COLORS.featured;
      g.arc(lx + 7, H - 46, 7, 0, Math.PI * 2);
      g.fill();
    } else if (kind === 'ring') {
      g.strokeStyle = COLORS.lost;
      g.lineWidth = 2;
      g.arc(lx + 7, H - 46, 6, 0, Math.PI * 2);
      g.stroke();
    } else {
      g.fillStyle = COLORS.none;
      g.arc(lx + 7, H - 46, 4, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = COLORS.ink2;
    g.font = '400 15px "Bricolage Grotesque", system-ui, sans-serif';
    g.fillText(label, lx + 20, H - 41);
    lx += 24 + g.measureText(label).width + 26;
  });
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

// ---------------------------------------------------------------------------------------------
// Tooltip and toast

const tip = $('#tip');
function showTip(text, x, y) {
  tip.textContent = text;
  tip.hidden = false;
  const r = tip.getBoundingClientRect();
  const left = Math.min(window.innerWidth - r.width - 8, x + 14);
  const top = y + 16 + r.height > window.innerHeight ? y - r.height - 10 : y + 16;
  tip.style.transform = `translate(${Math.max(8, left)}px, ${Math.max(8, top)}px)`;
}
document.addEventListener('pointermove', (e) => {
  const target = e.target.closest?.('[data-tip]');
  if (target) showTip(target.getAttribute('data-tip'), e.clientX, e.clientY);
  else if (!e.target.closest?.('#field')) tip.hidden = true;
});

let toastTimer = 0;
function toast(text) {
  const el = $('#toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2600);
}

// ---------------------------------------------------------------------------------------------
// Sources

function renderSources() {
  const kinds = { OFFICIAL: 'Publisher', WIKI: 'Publisher, via wiki', REPOST: 'Publisher, reposted', COMMUNITY: 'Measured data', ESTIMATE: 'Estimate', GOVERNMENT: 'US government' };
  $('#sources-body').innerHTML = `<ul class="sources">${SOURCES.map(
    (s) => `<li><span class="src-kind ${s.kind.toLowerCase()}">${kinds[s.kind]}</span>
      <div><a href="${s.url}" target="_blank" rel="noopener">${s.title}</a>${(s.more || []).map(([label, url]) => ` · <a href="${url}" target="_blank" rel="noopener">${label}</a>`).join('')}
      <p>${s.supports}</p></div></li>`,
  ).join('')}</ul>`;
}

// ---------------------------------------------------------------------------------------------
// Start

const field = createField($('#field'), {
  colors: COLORS,
  fitHeight: () => (document.body.classList.contains('fit') ? $('.field-wrap').clientHeight : null),
  onPick: (i) => pick(i),
  onHover: (i, e) => {
    if (i < 0 || !e) {
      tip.hidden = true;
      return;
    }
    const { out, ctx } = state.run;
    const t = ctx.typeOf[i];
    const goal = out.goal[i]; // this player's own goal
    tip.hidden = false;
    showTip(
      `Player ${int(i + 1)} · ${TYPE_ONE[t]} · ${out.featured[i] ? (goal > 1 ? `${out.featured[i]} of ${goal} copies` : 'got the featured legendary') : out.fives[i] ? 'lost the 50/50' : 'no legendary'} · ${usd(out.spendCents[i])} spent`,
      e.clientX,
      e.clientY,
    );
  },
});

$('#play').addEventListener('click', playSeason);
$('#reroll').addEventListener('click', () => {
  S().seed = `dice-${Math.random().toString(36).slice(2, 7)}`;
  stats.track('dice');
  changed();
  toast('New dice: same settings, different luck.');
});

// Vocabulary: a native dialog, so Escape closes it and focus comes back to the button; a click on the dimmed
// backdrop closes it too.
const vocab = $('#vocab');
$('#vocab-open').addEventListener('click', () => {
  closeInfo();
  vocab.showModal();
  stats.once('vocab');
});
$('#vocab-close').addEventListener('click', () => vocab.close());
vocab.addEventListener('click', (e) => {
  if (e.target === vocab) vocab.close();
});

$('#save-csv').addEventListener('click', () => {
  stats.track('csv');
  saveFile('gacha-lab-players.csv', playersCsv());
});
$('#save-image').addEventListener('click', async () => {
  stats.track('image');
  saveFile('gacha-lab.png', await postImage());
});

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!state.run) return;
    revenueSplit($('#split'), state.run.totals, COLORS);
    if (state.check) pityChart($('#pity-chart'), state.check, pityDistribution(state.checkRules), state.checkRules, COLORS);
    renderInspector();
  }, 150);
});

// One screen on desktops wide enough for the player card beside the dots and tall enough for the dots
// to stay readable. The lab scrolls instead, for its extra sections.
const fitQuery = window.matchMedia('(min-width: 1241px) and (min-height: 660px)');
function applyFit() {
  document.body.classList.toggle('fit', !state.lab && fitQuery.matches);
  if (state.run) field.resize();
}
fitQuery.addEventListener('change', applyFit);

function applyLab() {
  state.lab = isLab();
  document.querySelectorAll('[data-lab]').forEach((el) => (el.hidden = !state.lab));
  // text written for outside the lab, naming only the games offered there (the vocabulary)
  document.querySelectorAll('[data-public]').forEach((el) => (el.hidden = state.lab));
  fillPresets();
  applyFit();
}

// Outside the lab nobody can change the player mix, so it is always the defaults, and a lab-only game's rules
// or store go back to Custom rules (dropLabOnly).
function usePublicSettings() {
  S().types = structuredClone(DEFAULT_SETTINGS.types);
  S().loginRate = DEFAULT_SETTINGS.loginRate;
  dropLabOnly(S());
}

window.addEventListener('hashchange', () => {
  const wasLab = state.lab;
  applyLab();
  if (state.lab) stats.once('lab');
  if (!state.run) return;
  if (wasLab && !state.lab) {
    usePublicSettings();
    changed();
    return;
  }
  renderInspector();
  scheduleCheck();
  scheduleSuggestions();
});

if (!state.lab) usePublicSettings();
$('#mark').innerHTML = logoSvg(); // decorative: the name sits right beside it
// The vocabulary's section headers carry the sidebar's icon for the same topic (decorative, like the logo).
document.querySelectorAll('[data-icon]').forEach((el) => {
  el.innerHTML = ICONS[el.dataset.icon];
  el.setAttribute('aria-hidden', 'true');
});
buildSettings();
syncSettings();
applyLab();
// On narrow screens the settings start folded, so the money is on the first screen.
if (window.matchMedia('(max-width: 1000px)').matches) {
  document.querySelectorAll('#settings details.group').forEach((d) => (d.open = false));
}
renderSources();
$('#suggest-title').after(info(() => state.suggestAbout || 'Testing changes on 10,000 pretend players…', 'smart suggestions'));
$('.tagline').append(info(SOURCES_ABOUT, 'where the numbers come from'));
$('#reroll').after(
  info(
    "New dice re-rolls the luck, not the odds. Every setting stays the same: the legendary rate, pity, the 50/50, the store and the player mix. What changes is every random roll: which pulls land a legendary, who wins their 50/50, which days, and how often, each free player logs in, and how much each spender has to spend (from half to 1.5× the usual for their type). Use it to see how much a season swings on luck alone. Changing a setting keeps the same dice, so any difference you see comes from your change.",
    'new dice',
  ),
);
run();
stats.track('visit');
if (state.lab) stats.once('lab');
countVisibleTime(stats);

/* preview-only */
if (inViewer) {
  // Inside the claude.ai viewer, files can only be offered through the downloads capability.
  $('#save-csv').disabled = true;
  $('#save-image').disabled = true;
  window.claude
    .use('downloads')
    .then((api) => {
      downloads = api;
      $('#save-csv').disabled = !api;
      $('#save-image').disabled = !api;
      if (!api) {
        $('#save-csv').title = 'Saving files is not available in this view.';
        $('#save-image').title = 'Saving files is not available in this view.';
      }
    })
    .catch(() => {});
}
/* end preview-only */
