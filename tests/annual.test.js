import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLANTS } from '../js/plants.js';
import { hardinessZone } from '../js/climate.js';
import { evaluate, buildTasks, findPlants } from '../js/garden.js';
import { generatePlan } from '../js/plan.js';

const monthly = Array.from({ length: 12 }, () => ({ tmax: 20, tmin: 10, prcp: 120 }));
const tokyo = { zone: hardinessZone(-2), heatZone: 7, hotDays: 65, tropicalNights: 25, annualSnow: 0, annualPrecip: 1500, south: false, monthly, frostFree: false, lastFrost: 60, lastFrostSafe: 75, firstFrost: 340 };
const sapporo = { zone: hardinessZone(-17), heatZone: 3, hotDays: 8, tropicalNights: 0, annualSnow: 400, annualPrecip: 1100, south: false, monthly, frostFree: false, lastFrost: 120, lastFrostSafe: 130, firstFrost: 290 };
const by = (id) => PLANTS.find((p) => p.id === id);

test('一年草・ハーブ・薬用植物が収録されている', () => {
  assert.ok(PLANTS.length >= 740);
  assert.ok(PLANTS.filter((p) => p.type === 'annual').length >= 60);
  assert.ok(PLANTS.filter((p) => p.tags.includes('medicinal')).length >= 80);
  for (const id of ['orlaya', 'ocimum', 'calendula', 'lindera', 'bupleurum', 'rosemary']) assert.ok(by(id), id);
  assert.ok(PLANTS.filter((p) => p.type === 'annual').every((p) => p.sow === 'cool' || p.sow === 'warm'));
  assert.ok(PLANTS.filter((p) => p.group === 'rosemary').length >= 6);
});

test('一年草は寒冷地でも育てられ、種まき時期が地域で変わる', () => {
  const warm = evaluate(by('orlaya'), tokyo);
  const cold = evaluate(by('orlaya'), sapporo);
  assert.equal(warm.level, 3);
  assert.equal(cold.level, 3);
  assert.ok(warm.reasons.some((r) => r.includes('秋')));
  assert.ok(cold.reasons.some((r) => r.includes('春')));
  // 多年草のバジルではなく一年草扱い：冬の寒さで△にならない
  assert.equal(evaluate(by('ocimum'), sapporo).level, 3);
});

test('作業暦に種まきが入る', () => {
  const t = buildTasks(tokyo, [by('orlaya'), by('cosmos')]);
  assert.ok(t.some((x) => x.kind === 'sow' && x.title.includes('秋まき') && x.month === 10));
  assert.ok(t.some((x) => x.kind === 'sow' && x.title.includes('春まき')));
  const s = buildTasks(sapporo, [by('orlaya')]);
  assert.ok(s.some((x) => x.kind === 'sow' && x.title.includes('春まき')));
});

test('プランは標準では一年草を使わず、指定すると使う', () => {
  const o = { climate: tokyo, width: 4, depth: 1.5, sun: 'full' };
  for (const text of ['', 'ナチュラル', 'ハーブ']) {
    const p = generatePlan({ ...o, text });
    assert.ok(p.species.every((s) => s.plant.type !== 'annual'), text);
  }
  const withAnnual = [0, 1, 2, 3].map((seed) => generatePlan({ ...o, text: 'ナチュラル', annuals: true, seed }));
  assert.ok(withAnnual.some((p) => p.species.some((s) => s.plant.type === 'annual')));
  const herb = generatePlan({ ...o, text: 'ハーブガーデン' });
  assert.ok(herb.species.filter((s) => s.plant.tags.includes('herb')).length >= herb.species.length * 0.6, 'ハーブ中心');
  const med = generatePlan({ ...o, text: '薬草園' });
  assert.ok(med.species.filter((s) => s.plant.tags.includes('medicinal')).length >= med.species.length * 0.6, '薬用植物中心');
});

test('図鑑で一年草・薬用植物を絞り込める', () => {
  assert.ok(findPlants(null, { type: 'annual' }).length >= 60);
  assert.ok(findPlants(null, { tag: 'medicinal' }).every((r) => r.plant.tags.includes('medicinal')));
  assert.ok(findPlants(null, { q: 'ローズマリー' }).length >= 6);
});
