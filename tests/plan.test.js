import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatePlan, parseKeywords } from '../js/plan.js';
import { hardinessZone } from '../js/climate.js';
import { elevationSVG, planSVG, plantThumbSVG } from '../js/illust.js';
import { PLANTS, FORMS, TAGS, LEAF } from '../js/plants.js';

const tokyo = { zone: hardinessZone(-2), heatZone: 7, hotDays: 65, tropicalNights: 25, annualSnow: 0, south: false };

test('キーワード解析', () => {
  const p = parseKeywords('白と青のナチュラルな庭。蝶が来て、手間いらず');
  assert.deepEqual([...p.colors].sort(), ['blue', 'white']);
  assert.ok(p.tags.has('natural') && p.tags.has('pollinator') && p.tags.has('easy'));
  const w = parseKeywords('ホワイトガーデン');
  assert.equal(w.strictWhite, true);
  assert.deepEqual([...w.colors], ['white']);
  assert.ok(!parseKeywords('初夏の庭').season.has(7)); // 「初夏」で「夏」を誤検出しない
});

test('プラン生成: 種類数・層・色・費用', () => {
  const plan = generatePlan({ climate: tokyo, text: '白と青のナチュラルな庭', width: 3, depth: 1.2, sun: 'full', view: 'border' });
  assert.ok(plan.species.length >= 5 && plan.species.length <= 8, `${plan.species.length}種`);
  const layers = new Set(plan.species.map((s) => s.layer));
  assert.ok(layers.has('back') && layers.has('middle') && layers.has('front'));
  assert.ok(plan.species.every((s) => ['white', 'blue'].includes(s.color) || s.plant.form === 'grass'));
  assert.ok(plan.species.some((s) => s.color === 'blue') && plan.species.some((s) => s.color === 'white'));
  assert.ok(plan.species.every((s) => s.level >= 2));
  assert.ok(plan.species.every((s) => s.qty >= 1 && s.qty === s.positions.length));
  const sum = plan.species.reduce((t, s) => t + s.qty * s.plant.price, 0);
  assert.equal(plan.cost.plants, sum);
  assert.ok(plan.cost.total > plan.cost.plants);
  // 株は花壇の中に収まる
  for (const s of plan.species) for (const p of s.positions) {
    assert.ok(p.x >= 0 && p.x <= 3 && p.y >= 0 && p.y <= 1.2);
  }
});

test('プラン生成: 同じ条件なら同じ結果、別の案は変わる', () => {
  const o = { climate: tokyo, text: 'イングリッシュ', width: 4, depth: 1.5, sun: 'full' };
  const a = generatePlan(o).species.map((s) => s.plant.id).join();
  const b = generatePlan(o).species.map((s) => s.plant.id).join();
  assert.equal(a, b);
  const others = [1, 2, 3].map((seed) => generatePlan({ ...o, seed }).species.map((s) => s.plant.id).join());
  assert.ok(others.some((x) => x !== a));
});

test('プラン生成: 日陰・ホワイトガーデン・狭い花壇', () => {
  const shade = generatePlan({ climate: tokyo, text: '', width: 2, depth: 1, sun: 'shade' });
  assert.ok(shade.species.every((s) => s.plant.sun.includes('shade')));
  const white = generatePlan({ climate: tokyo, text: 'ホワイトガーデン', width: 3, depth: 1.2, sun: 'full' });
  assert.ok(white.species.every((s) => s.color === 'white' || s.plant.form === 'grass' || ['silver', 'variegated'].includes(s.plant.leaf)));
  const narrow = generatePlan({ climate: tokyo, text: '', width: 2, depth: 0.5, sun: 'full' });
  assert.ok(narrow.species.every((s) => s.layer !== 'back'));
});

test('低予算ほど安くなる', () => {
  const o = { climate: tokyo, width: 3, depth: 1.2, sun: 'full' };
  const normal = generatePlan({ ...o, text: 'ナチュラル' });
  const cheap = generatePlan({ ...o, text: 'ナチュラル 低予算' });
  assert.ok(cheap.cost.plants < normal.cost.plants, `${cheap.cost.plants} < ${normal.cost.plants}`);
});

test('イメージ図のSVGが全ての月で生成できる', () => {
  const plan = generatePlan({ climate: tokyo, text: 'プレーリー', width: 5, depth: 2, sun: 'full', view: 'island' });
  for (let m = 1; m <= 12; m++) {
    const svg = elevationSVG(plan, m);
    assert.match(svg, /^<svg/);
    assert.ok(!svg.includes('NaN'), `NaN in month ${m}`);
  }
  assert.ok(!planSVG(plan).includes('NaN'));
  for (const p of PLANTS) assert.ok(!plantThumbSVG(p).includes('NaN'), p.id);
});

test('植物データの追加項目', () => {
  assert.ok(PLANTS.length >= 130);
  for (const p of PLANTS) {
    assert.ok(FORMS[p.form], p.id);
    assert.ok(LEAF[p.leaf], p.id);
    assert.ok(p.tags.every((t) => TAGS[t]), p.id);
    assert.ok(p.price > 0 && p.wiki, p.id);
  }
});

test('品種データ：種のデータを継承し、違いだけ上書き', async () => {
  const { GROUP_COUNT } = await import('../js/plants.js');
  assert.ok(PLANTS.length >= 400, `品種数 ${PLANTS.length}`);
  assert.ok(GROUP_COUNT >= 140);
  const ws = PLANTS.find((p) => p.id === 'echinacea-white-swan');
  assert.deepEqual(ws.color, ['white']);
  assert.equal(ws.group, 'echinacea');
  assert.deepEqual(ws.zone, [3, 9]); // 継承
  assert.equal(ws.latin, "Echinacea purpurea 'White Swan'");
  // 先頭の品種は旧IDを引き継ぐ（保存データ互換）
  assert.ok(PLANTS.find((p) => p.id === 'echinacea').cv);
  // 冷涼地向き品種と暑さに強い品種で判定が変わる
  const hidcote = PLANTS.find((p) => p.id === 'lavender-hidcote');
  const phenomenal = PLANTS.find((p) => p.id === 'lavender-phenomenal');
  const { evaluate } = await import('../js/garden.js');
  assert.ok(evaluate(phenomenal, tokyo).level > evaluate(hidcote, tokyo).level);
});

test('プランで同じ種の品種を重複させない', () => {
  for (const text of ['ナチュラル', '白と青', 'プレーリー', '和風']) {
    const plan = generatePlan({ climate: tokyo, text, width: 5, depth: 2, sun: 'full' });
    const groups = plan.species.map((s) => s.plant.group);
    assert.equal(new Set(groups).size, groups.length, text);
  }
});
