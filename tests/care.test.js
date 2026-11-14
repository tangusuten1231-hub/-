import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLANTS, addCustom, removeCustom } from '../js/plants.js';
import { hardinessZone } from '../js/climate.js';
import { pestsForPlant, regionRisks, pestTasks, PESTS } from '../js/pests.js';
import { guideSteps } from '../js/guide.js';
import { generatePlan } from '../js/plan.js';
import { STYLES } from '../js/styles.js';
import { elevationSVG, planSVG } from '../js/illust.js';

const monthly = Array.from({ length: 12 }, (_, i) => ({ tmax: 20, tmin: 10, prcp: i === 5 ? 200 : 100 }));
const tokyo = { zone: hardinessZone(-2), heatZone: 7, hotDays: 65, tropicalNights: 30, annualSnow: 0, annualPrecip: 1600, south: false, monthly, frostFree: false, lastFrost: 60, lastFrostSafe: 75 };
const snowy = { zone: hardinessZone(-15), heatZone: 3, hotDays: 10, tropicalNights: 0, annualSnow: 300, annualPrecip: 2500, south: false, monthly, frostFree: false, lastFrost: 110, lastFrostSafe: 120 };
const byId = (id) => PLANTS.find((p) => p.id === id);

test('地域ごとに病害虫リスクが変わる', () => {
  const t = regionRisks(tokyo).map((r) => r.pest.id);
  const s = regionRisks(snowy).map((r) => r.pest.id);
  assert.ok(t.includes('southern-blight'), '暖地は白絹病');
  assert.ok(!s.includes('southern-blight'), '寒冷地は白絹病リスク低');
  assert.ok(s.includes('snow-rot'), '多雪地は雪解け後の腐れ');
});

test('植物ごとの病害虫', () => {
  const phlox = pestsForPlant(byId('phlox-paniculata'), tokyo).map((r) => r.pest.id);
  assert.ok(phlox.includes('powdery'));
  const lav = pestsForPlant(byId('lavender-hidcote'), tokyo).map((r) => r.pest.id);
  assert.ok(lav.includes('root-rot'), '蒸れに弱い品種は夏越し不良');
  assert.ok(PESTS.every((p) => p.prevent.length && p.treat.length && p.months.length));
});

test('作業暦に病害虫の見回りが入る', () => {
  const tasks = pestTasks(tokyo, ['hosta', 'phlox-paniculata'].map(byId));
  assert.ok(tasks.some((t) => t.title.includes('ナメクジ')));
  assert.ok(tasks.every((t) => t.month >= 1 && t.month <= 12 && t.plants.length));
});

test('はじめてガイド', () => {
  const steps = guideSteps({ climate: tokyo, garden: [] });
  assert.ok(steps.length >= 8);
  assert.equal(steps.find((s) => s.id === 'loc').done, true);
  assert.equal(steps.find((s) => s.id === 'plan').done, false);
  assert.ok(steps.every((s) => s.body.length));
});

test('全スタイルでプランが生成でき、図も描ける', () => {
  for (const style of Object.keys(STYLES)) {
    for (const view of ['border', 'island']) {
      const plan = generatePlan({ climate: tokyo, text: '', width: 4, depth: 1.5, sun: 'full', view, style });
      assert.ok(plan.species.length >= 3, `${style} ${view}`);
      assert.ok(plan.species.every((s) => s.qty >= 1 && s.positions.every((p) => p.x >= 0 && p.x <= 4 && p.y >= 0 && p.y <= 1.5)), `${style} positions`);
      assert.ok(!elevationSVG(plan, 7).includes('NaN') && !planSVG(plan).includes('NaN'), `${style} svg`);
    }
  }
});

test('スタイルの特徴が反映される', () => {
  const o = { climate: tokyo, text: '', width: 5, depth: 2, sun: 'full' };
  const oud = generatePlan({ ...o, style: 'oudolf' });
  assert.ok(oud.species.some((s) => s.role === 'matrix' && s.plant.form === 'grass'), 'アウドルフ：グラスの地模様');
  const chatto = generatePlan({ ...o, style: 'chatto' });
  assert.ok(chatto.species.every((s) => s.plant.moist.includes('dry')), 'チャトー：乾燥に強い植物のみ');
  assert.ok(chatto.cost.extras.some((e) => e.ja.includes('砂利')));
  const mat = generatePlan({ ...o, style: 'matrix' });
  const ground = mat.species.filter((s) => s.role === 'ground').reduce((t, s) => t + s.qty, 0);
  assert.ok(ground / mat.totalPlants > 0.3, 'マトリクス：グラウンドカバーが多い');
});

test('品種の登録と削除', () => {
  const before = PLANTS.length;
  const n0 = PLANTS.filter((x) => x.group === 'echinacea').length;
  const p = addCustom({ uid: 't1', group: 'echinacea', cv: 'テスト', color: ['orange'], bloom: [7, 8], h: [50, 70], price: 1500 });
  assert.equal(PLANTS.length, before + 1);
  assert.deepEqual(p.color, ['orange']);
  assert.deepEqual(p.zone, [3, 9]);
  assert.ok(PLANTS.filter((x) => x.group === 'echinacea').every((x) => x.cvCount === n0 + 1));
  removeCustom(p.id);
  assert.equal(PLANTS.length, before);
});
