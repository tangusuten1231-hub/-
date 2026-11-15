import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANTS } from '../js/plants.js';
import { findPlants } from '../js/garden.js';
import { INGREDIENTS, MOODS, TEA_RECIPES, teaStatus } from '../js/tea.js';
import { REGIONS, worldMapSVG, sceneSVG } from '../js/origin.js';
import { ROLES } from '../js/roles.js';
import { tsupiLine } from '../js/tsupiwords.js';

const groups = new Set(PLANTS.map((p) => p.group));

test('ハーブティー：材料は図鑑の植物か市販品、気分タグも正しい', () => {
  assert.ok(TEA_RECIPES.length >= 30);
  for (const r of TEA_RECIPES) {
    for (const i of r.ings) { const ing = INGREDIENTS[i.k]; assert.ok(ing, `${r.id}:${i.k}`); if (!ing.store) assert.ok(groups.has(ing.group), ing.group); }
    for (const m of r.moods) assert.ok(MOODS[m]);
    assert.ok(r.steps.length && r.temp && r.time);
  }
  const st = teaStatus(TEA_RECIPES.find((r) => r.id === 'fresh-mint'), new Set(['mentha']));
  assert.ok(st.canMake && st.all);
  assert.ok(!teaStatus(TEA_RECIPES.find((r) => r.id === 'fresh-mint'), new Set()).canMake);
});

test('原産地：すべての植物に地域があり、地図と風景を描ける', () => {
  for (const p of PLANTS) { assert.ok(p.origin.length, p.ja); for (const o of p.origin) assert.ok(REGIONS[o], `${p.ja}:${o}`); }
  assert.match(worldMapSVG({ selected: 'japan', counts: { japan: 3 } }), /<svg/);
  for (const id of Object.keys(REGIONS)) assert.match(sceneSVG(id), /<svg/);
  assert.ok(findPlants(null, { origin: 'med' }).every((r) => r.plant.origin.includes('med')));
});

test('別名で検索できる（ムラサキバレンギク → エキナセア、マンネンロウ → ローズマリー）', () => {
  assert.ok(findPlants(null, { q: 'ムラサキバレンギク' }).some((r) => r.plant.group === 'echinacea'));
  assert.ok(findPlants(null, { q: 'マンネンロウ' }).some((r) => r.plant.group === 'rosemary'));
});

test('植栽での役割：グラウンドカバーで絞り込める', () => {
  const gc = findPlants(null, { role: 'groundcover' });
  assert.ok(gc.length >= 20);
  assert.ok(gc.every((r) => r.plant.roles.includes('groundcover')));
  assert.ok(gc.some((r) => r.plant.group === 'thymus'));
  for (const p of PLANTS) for (const r of p.roles) assert.ok(ROLES[r]);
});

test('ツピのセリフは毎回ちがうものが出る', () => {
  const ctx = { month: 6, blooming: ['ラベンダー'], harvest: [], tasks: ['梅雨前の切り戻し'], seen: 3, empty: false };
  const set = new Set(Array.from({ length: 40 }, () => tsupiLine(ctx)));
  assert.ok(set.size >= 8);
});
