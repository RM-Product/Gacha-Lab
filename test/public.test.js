// What the page offers outside #lab (6 Oct 2026): HoYoverse's and League of Legends' banners and Custom rules. The
// other games stay in the lab until someone who plays them has checked them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRESETS, DEFAULT_SETTINGS, presetSettings, presetsFor, dropLabOnly } from '../src/presets.js';

const PUBLIC = ['genshin-character', 'hsr-character', 'zzz-character', 'genshin-weapon', 'hsr-lightcone', 'zzz-wengine', 'hi3-battlesuit', 'lol-exalted', 'lol-mythic-variant', 'custom'];
const STORE_AND_RULES = ['preset', 'rulesFrom', 'storeFrom', 'rules', 'pullCost', 'freePerDay', 'packs', 'pass', 'extraCopies', 'maxCopies'];

// Settings as picking a preset in "Start from" leaves them.
const picked = (id) => ({ ...structuredClone(DEFAULT_SETTINGS), preset: id, rulesFrom: id, ...presetSettings(id) });

// The game's name, as the vocabulary writes it: "Reverse: 1999: limited character" is Reverse: 1999.
const game = (p) => p.name.slice(0, p.name.lastIndexOf(': '));

test('outside the lab: HoYoverse, League of Legends and Custom rules; the lab has every preset', () => {
  assert.deepEqual(presetsFor(false).map((p) => p.id), PUBLIC);
  assert.deepEqual(presetsFor(true), PRESETS);
  assert.equal(PRESETS.filter((p) => p.labOnly).length, PRESETS.length - PUBLIC.length);
});

test('a lab-only game left in the settings goes back to Custom rules, and nothing else changes', () => {
  const custom = picked('custom');
  for (const p of PRESETS.filter((x) => x.labOnly)) {
    const s = { ...picked(p.id), days: 45, sampleSize: 5000, seed: 'kept', loginRate: 0.5 };
    assert.equal(dropLabOnly(s), true, p.id);
    for (const k of STORE_AND_RULES) assert.deepEqual(s[k], custom[k], `${p.id}: ${k}`);
    assert.deepEqual([s.days, s.sampleSize, s.seed, s.loginRate], [45, 5000, 'kept', 0.5], p.id);
  }
});

test("only the rules, or only the store, of a lab-only game is enough to go back to Custom", () => {
  // Arknights' rules edited (so "Start from" already reads Custom) on Genshin Impact's store
  const rules = { ...picked('genshin-character'), preset: 'custom', rulesFrom: 'arknights-limited', rules: { ...presetSettings('arknights-limited').rules, baseRate: 0.03 } };
  assert.equal(dropLabOnly(rules), true);
  assert.deepEqual(rules.rules, DEFAULT_SETTINGS.rules);
  assert.equal(rules.storeFrom, 'custom');
  // Custom rules on NIKKE's store
  const { rules: _, ...nikkeStore } = presetSettings('nikke-recruit');
  const store = { ...picked('custom'), ...nikkeStore };
  assert.equal(store.storeFrom, 'nikke-recruit');
  assert.equal(dropLabOnly(store), true);
  assert.equal(store.pullCost, DEFAULT_SETTINGS.pullCost);
  assert.equal(store.storeFrom, 'custom');
});

test('HoYoverse, League of Legends and Custom settings are left as they are, edits included', () => {
  for (const id of PUBLIC) {
    const s = picked(id);
    const before = structuredClone(s);
    assert.equal(dropLabOnly(s), false, id);
    assert.deepEqual(s, before, id);
  }
  const edited = { ...picked('genshin-character'), preset: 'custom', rules: { ...presetSettings('genshin-character').rules, baseRate: 0.01 }, freePerDay: 120 };
  const before = structuredClone(edited);
  assert.equal(dropLabOnly(edited), false);
  assert.deepEqual(edited, before);
});

test('the vocabulary outside the lab names only the games offered there; the lab still names every game', () => {
  const html = readFileSync(new URL('../src/ui/page.html', import.meta.url), 'utf8');
  // everything the lab alone shows, gone
  const outside = html.replace(/<(\w+)\b[^>]*\bdata-lab\b[^>]*>[\s\S]*?<\/\1>/g, '');
  assert.ok(outside.length < html.length);
  for (const p of PRESETS.filter((x) => x.labOnly)) {
    assert.ok(!outside.includes(game(p)), `${game(p)} is named outside the lab`);
    assert.ok(html.includes(game(p)), `${game(p)} is missing from the lab's vocabulary`);
  }
  for (const p of presetsFor(false).filter((x) => x.group)) assert.ok(outside.includes(game(p)), `${game(p)} is missing outside the lab`);
  // the spark and free copies come only with lab-only games
  assert.ok(!/<dt>Spark<\/dt>|<dt>Free copies<\/dt>/.test(outside));
  for (const p of presetsFor(false)) assert.ok(!(p.rules?.spark?.pulls > 0) && !(p.rules?.freeCopiesAt || []).length, p.id);
});
