import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANTS } from '../js/plants.js';
import { generatePlan } from '../js/plan.js';
import { buildTasks } from '../js/garden.js';
import { generateSite } from '../js/site.js';

const climate = { zone: { value: 8.5, label: '8b' }, south: false, heatZone: 7, hotDays: 50, tropicalNights: 20, avgMinTemp: -3, annualSnow: 0, frostFree: false, lastFrost: 80, firstFrost: 330, monthly: Array.from({ length: 12 }, () => ({ prcp: 120 })) };

test('野菜が図鑑に入り、科と収穫月を持つ', () => {
  const veg = PLANTS.filter((p) => p.tags.includes('veg'));
  assert.ok(veg.length >= 30);
  for (const p of veg.filter((x) => x.harvest)) {
    assert.notEqual(p.family.ja, 'その他', p.ja);
    assert.ok(p.harvest.every((m) => m >= 1 && m <= 12));
  }
  assert.ok(PLANTS.some((p) => p.ja === 'トマト'));
});

test('ふつうの花壇プランには一年生の野菜が入らない', () => {
  const plan = generatePlan({ climate, sun: 'full', width: 4, depth: 1.5, text: 'ナチュラル', style: 'border' });
  assert.ok(!plan.species.some((s) => s.plant.tags.includes('veg') && s.plant.type === 'annual'));
});

test('ポタジェは区画に分け、野菜・縁取り・花を組み合わせる', () => {
  const plan = generatePlan({ climate, sun: 'full', width: 4, depth: 2.5, text: '', style: 'potager' });
  assert.ok(plan.plots.length >= 2);
  assert.ok(plan.species.filter((s) => s.plant.harvest?.length).length >= 3);
  assert.ok(plan.species.some((s) => s.role === 'edge'));
  assert.ok(plan.species.every((s) => s.qty >= 1));
  assert.ok(plan.harvest.some((n) => n > 0));
});

test('「野菜」のキーワードで野菜が選ばれる', () => {
  const plan = generatePlan({ climate, sun: 'full', width: 3, depth: 1.2, text: '野菜', style: 'border' });
  assert.ok(plan.species.some((s) => s.plant.harvest?.length));
});

test('作業暦に野菜の植え付けと収穫が出る', () => {
  const plants = ['tomato', 'lettuce', 'asparagus'].map((id) => PLANTS.find((p) => p.id === id));
  const tasks = buildTasks(climate, plants);
  assert.ok(tasks.some((t) => t.kind === 'harvest' && t.title.includes('トマト')));
  assert.ok(tasks.some((t) => t.title === '夏野菜の植え付け'));
});

test('庭まるごと：キッチンガーデンはポタジェ、別の配置案で構造が変わる', () => {
  const base = { shape: 'rect', width: 12, depth: 9, house: 'n', items: ['path', 'terrace', 'pergola', 'bench', 'water', 'pond', 'tree', 'lawn', 'kitchen', 'compost'], climate };
  const a = generateSite({ ...base, layoutSeed: 0 });
  const k = a.beds.find((b) => b.zone === 'kitchen');
  assert.ok(k && k.plan.style === 'potager');
  const sig = (s) => JSON.stringify(s.structs.map((x) => [x.type, Math.round(x.x), Math.round(x.y)]));
  const others = [1, 2, 3, 4].map((ls) => generateSite({ ...base, layoutSeed: ls }));
  assert.ok(others.some((o) => sig(o) !== sig(a)), '配置が変わる');
  // 植栽だけ変える：配置は同じ
  const b = generateSite({ ...base, layoutSeed: 0, seed: 5 });
  assert.equal(sig(b), sig(a));
});
