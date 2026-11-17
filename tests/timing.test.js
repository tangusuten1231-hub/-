import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANTS } from '../js/plants.js';
import { plantingTime, monthsJa } from '../js/garden.js';
import { INGREDIENTS } from '../js/tea.js';

const tokyo = { zone: { value: 9 }, heatZone: 8, frostFree: false, lastFrost: 60, lastFrostSafe: 80, firstFrost: 340, south: false };
const cold = { zone: { value: 5 }, heatZone: 3, frostFree: false, lastFrost: 130, lastFrostSafe: 145, firstFrost: 280, south: false };
const byId = (id) => PLANTS.find((p) => p.id === id || p.group === id);

test('植え時：夏野菜は遅霜のあと、秋植え球根は秋、寒冷地の宿根草は春', () => {
  const t = plantingTime(byId('tomato'), tokyo);
  assert.ok(t.plant.best.every((m) => m >= 4 && m <= 6));
  assert.ok(plantingTime(byId('narcissus'), tokyo).plant.best.every((m) => m >= 9 && m <= 11));
  assert.ok(plantingTime(byId('garlic'), tokyo).plant.best.includes(10));
  const e = plantingTime(byId('echinacea'), cold);
  assert.ok(e.plant.best.some((m) => m === 5 || m === 6));
  assert.ok(!plantingTime(byId('echinacea'), tokyo).plant.best.some((m) => m === 1 || m === 2));
  assert.ok(plantingTime(byId('pelargonium'), tokyo).plant.best[0] >= 4);
});

test('南半球では季節が半年ずれる', () => {
  const south = { ...tokyo, south: true, lastFrost: 240, lastFrostSafe: 260, firstFrost: 160 };
  assert.ok(plantingTime(byId('tomato'), south).plant.best.every((m) => m >= 10 && m <= 12));
});

test('すべての植物に植え時がある', () => {
  for (const p of PLANTS) {
    const t = plantingTime(p, tokyo);
    assert.ok(t.plant.best.length && t.plant.best.every((m) => m >= 1 && m <= 12), p.ja);
    assert.ok(t.text.length > 4);
  }
  assert.equal(monthsJa([3, 4, 9, 10]), '3〜4月・9〜10月');
  assert.equal(monthsJa([11, 12, 1, 2]), '11〜2月');
});

test('図鑑に重複がなく、追加した地域・ハーブの植物がある', () => {
  const names = new Map();
  for (const p of PLANTS) { const k = p.ja.replace(/[‘’'（）()・\s]/g, ''); assert.ok(!names.has(k), `重複：${p.ja}`); names.set(k, p.id); }
  const count = (r) => new Set(PLANTS.filter((p) => p.origin.includes(r)).map((p) => p.group)).size;
  for (const r of ['africa', 'safrica', 'aus', 'na_west', 'himalaya', 'tropasia']) assert.ok(count(r) >= 9, r);
  for (const id of ['chervil', 'caraway', 'kakidooshi', 'roselle', 'gazania', 'brachyscome', 'goya']) assert.ok(byId(id), id);
  const ids = new Set(PLANTS.map((p) => p.id));
  for (const v of Object.values(INGREDIENTS)) for (const i of v.ids || []) assert.ok(ids.has(i), i);
});

test('つくる順番の予定月：下準備→構造物→植え付けの順で、月が分かれ、植え付けは適した月', async () => {
  const { scheduleSteps } = await import('../js/garden.js');
  const steps = [{ key: 'prep', ms: [1, 2, 8, 9] }, { key: 'build', ms: [] }, { key: 'pere', ms: [2, 3, 4, 9, 10, 11], free: true }, { key: 'bulb', ms: [10, 11], free: true }, { key: 'annual', ms: [3, 4], free: true }, { key: 'finish', ms: [], first: true }];
  const r = scheduleSteps(steps, new Date(2026, 10, 16));
  assert.deepEqual(r.map((x) => x.ym), ['2026-12', '2027-01', '2027-02', '2027-10', '2027-03', '2027-02']);
  assert.ok(new Set(r.map((x) => x.ym)).size >= 4, '同じ月に集まらない');
  const named = scheduleSteps([{ t: '下準備', ms: [] }, { t: '宿根草', ms: [3], free: true }], new Date(2026, 10, 16));
  assert.deepEqual(named.map((x) => x.t), ['下準備', '宿根草'], '手順の名前（t）を消さない');
  const r2 = scheduleSteps(steps.filter((s) => s.key !== 'build'), new Date(2026, 4, 1));
  assert.deepEqual(r2.map((x) => x.ym).slice(0, 2), ['2026-08', '2026-09']);
});
