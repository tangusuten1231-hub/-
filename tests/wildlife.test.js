import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANTS } from '../js/plants.js';
import { CREATURES, creaturesForPlant, creaturesForGarden, creaturesForRegion, biodiversity, wildScore } from '../js/wildlife.js';
import { generatePlan } from '../js/plan.js';

const groups = new Set(PLANTS.map((p) => p.group));
const climate = { zone: { value: 8.5, label: '8b' }, south: false, heatZone: 7, hotDays: 50, tropicalNights: 20, avgMinTemp: -3 };

test('生き物データが参照する植物は図鑑に存在する', () => {
  for (const c of CREATURES) {
    for (const g of [...c.host, ...(c.nectar.groups || []), ...(c.food.groups || [])]) assert.ok(groups.has(g), `${c.ja}: ${g}`);
  }
});

test('フェンネルはキアゲハの食草、ビオラはツマグロヒョウモンの食草', () => {
  const fennel = PLANTS.find((p) => p.group === 'fennel');
  const viola = PLANTS.find((p) => p.group === 'viola');
  assert.ok(creaturesForPlant(fennel, climate).some((x) => x.creature.ja === 'キアゲハ' && x.way === 'host'));
  if (viola) assert.ok(creaturesForPlant(viola, climate).some((x) => x.creature.ja === 'ツマグロヒョウモン' && x.way === 'host'));
});

test('地域・季節の生き物：寒い地域ではツマグロヒョウモンは出ない、冬はジョウビタキ', () => {
  const cold = { ...climate, zone: { value: 4, label: '4a' } };
  assert.ok(!creaturesForRegion(cold).some((c) => c.id === 'tsumaguro'));
  assert.ok(creaturesForRegion(climate, 1).some((c) => c.id === 'joubitaki'));
  assert.ok(!creaturesForRegion(climate, 1).some((c) => c.id === 'semi'));
});

test('水場や池を加えると生物多様性度が上がり、トンボが来やすくなる', () => {
  const plants = PLANTS.filter((p) => ['fennel', 'echinacea', 'lavender', 'eupatorium'].includes(p.group)).slice(0, 6);
  const a = biodiversity(plants, {}, climate);
  const b = biodiversity(plants, { water: true, pond: true, compost: true }, climate);
  assert.ok(b.total > a.total);
  assert.ok(a.total >= 0 && b.total <= 100);
  const dragon = (f) => creaturesForGarden(plants, f, climate).find((x) => x.creature.id === 'shiokara');
  assert.ok((dragon({ pond: true })?.score || 0) > (dragon({})?.score || 0));
  assert.equal(biodiversity([], {}, climate).total, 0);
});

test('木が必要な生き物は、木がなければ「条件がそろえば」どまり', () => {
  const plants = PLANTS.filter((p) => p.type !== 'shrub').slice(0, 10);
  const semi = creaturesForGarden(plants, {}, climate).find((x) => x.creature.id === 'semi');
  assert.ok(!semi || semi.level === 1);
});

test('呼びたい生き物を選ぶと、食草や蜜源の植物が選ばれやすくなる', () => {
  const fennel = PLANTS.find((p) => p.group === 'fennel');
  assert.ok(wildScore(fennel, ['butterfly'], climate) > 0);
  assert.equal(wildScore(fennel, [], climate), 0);
  const o = { climate, sun: 'full', width: 4, depth: 1.5, text: '', style: 'border' };
  const score = (plan) => plan.species.reduce((t, s) => t + wildScore(s.plant, ['butterfly'], climate), 0);
  assert.ok(score(generatePlan({ ...o, wild: ['butterfly'] })) >= score(generatePlan(o)));
});
