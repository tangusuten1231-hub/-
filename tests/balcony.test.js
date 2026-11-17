import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANTS } from '../js/plants.js';
import { generateBalcony, sunHours, sunPos } from '../js/balcony.js';
import { potGuide, potLiters } from '../js/pots.js';
import { generatePlan } from '../js/plan.js';
import { evaluate } from '../js/garden.js';

const climate = { zone: { value: 9, label: '9a' }, south: false, heatZone: 7, hotDays: 50, tropicalNights: 25, avgMinTemp: -1, annualSnow: 0 };
const base = { width: 3.6, railH: 1.1, railType: 'solid', roof: true, ceilH: 2.5, obstacle: 'none' };

test('太陽の位置：東京の夏至の正午は高度約78°、真南', () => {
  const p = sunPos(35.7, 23.44, 12);
  assert.ok(Math.abs(p.alt - 77.7) < 1);
  assert.ok(Math.abs(p.az - 180) < 1);
});

test('日照：南向きは北向きより長く、格子の手すりや屋根なしで日が増える', () => {
  const s = sunHours({ ...base, facing: 's' }, 35.7, 0, 0.9, 0.25);
  const n = sunHours({ ...base, facing: 'n' }, 35.7, 0, 0.9, 0.25);
  assert.ok(s > n);
  const solid = sunHours({ ...base, facing: 's' }, 35.7, 0, 0.3, 0.25);
  const open = sunHours({ ...base, facing: 's', railType: 'open' }, 35.7, 0, 0.3, 0.25);
  assert.ok(open > solid);
  const roof = sunHours({ ...base, facing: 's' }, 35.7, 23.44, 0.6, 0.25);
  const noRoof = sunHours({ ...base, facing: 's', roof: false }, 35.7, 23.44, 0.6, 0.25);
  assert.ok(noRoof >= roof);
  // 手すりより高い棚の上は、床より日が当たる（冬）
  assert.ok(sunHours({ ...base, facing: 's' }, 35.7, -23.44, 1.0, 1.0) > sunHours({ ...base, facing: 's' }, 35.7, -23.44, 1.0, 0.25));
});

test('ベランダプラン：棚・手すり掛け・鉢の大きさ・重さ・費用', () => {
  const b = generateBalcony({ width: 3.6, depth: 1.2, facing: 's', floor: 3, railType: 'solid', railH: 110, roof: true, shelf: 3, hang: true, climate, lat: 35.7 });
  assert.ok(b.slots.length >= 8);
  assert.ok(b.slots.some((s) => s.zone === 'shelf') && b.slots.some((s) => s.zone === 'hang'));
  for (const s of b.slots) {
    assert.ok(s.plant.sun.includes(s.spot.sun) || (s.spot.sun === 'full' && s.plant.sun.includes('part')), s.plant.ja);
    if (s.zone === 'hang') assert.ok(s.plant.roles.includes('hanging'));
    if (s.zone === 'shelf') assert.ok(s.plant.h[1] <= 45);
  }
  assert.ok(b.weight > 0 && b.soilL > 0 && b.cost.total > 0);
  assert.ok(b.notes.some((t) => t.includes('避難')));
  // 高層階は背の高い植物を手すりぎわに置かない
  const high = generateBalcony({ width: 4, depth: 1.5, facing: 'e', floor: 15, railType: 'open', railH: 110, roof: true, climate, lat: 35.7 });
  assert.ok(high.slots.filter((s) => s.zone === 'rail').every((s) => s.plant.h[1] <= 70));
});

test('鉢植えガイド：小さな草花は小さな鉢、木は大きな鉢、乾燥を好む植物は水はけのよい土', () => {
  const g = (id) => potGuide(PLANTS.find((p) => p.id === id));
  assert.ok(g('viola').go <= 5);
  assert.ok(g('olive').go >= 12);
  assert.equal(g('rosemary').cat, 'dry');
  assert.equal(g('blueberry').cat, 'acid');
  assert.equal(g('tomato').cat, 'veg');
  assert.match(g('carrot').depth, /深鉢/);
  for (const p of PLANTS) { const x = potGuide(p); assert.ok(x.go >= 4 && x.go <= 15 && x.mix.parts.reduce((t, y) => t + y.pct, 0) >= 98, p.ja); }
  assert.ok(potLiters(10) > potLiters(5) * 6);
});

test('寒さに弱いベランダ植物は「取り込めば育つ」と判定', () => {
  const zone8 = { ...climate, zone: { value: 8, label: '8a' } };
  const r = evaluate(PLANTS.find((p) => p.id === 'pelargonium'), zone8);
  assert.equal(r.level, 1); // 地植えの候補からは外れる（気候のハードフィルター）
  assert.ok(r.fails.every((f) => f.key === 'cold'));
  assert.ok(r.reasons.some((t) => t.includes('取り込め')));
});

test('コテージガーデンとグラウンドカバー', () => {
  const plan = generatePlan({ climate, sun: 'full', width: 4, depth: 1.5, text: '', style: 'cottage' });
  assert.ok(plan.species.length >= 6);
  const g = generatePlan({ climate, sun: 'full', width: 3, depth: 1.5, text: '', style: 'border', roles: ['groundcover'] });
  assert.ok(g.species.some((s) => s.plant.roles.includes('groundcover')));
  assert.ok(g.roleCount.groundcover >= 1);
});
