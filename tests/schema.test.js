import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTaxon, fToC } from '../js/schema.js';
import { zoneMinC, normText, checkEvidence } from '../js/derive.js';

const ok = () => ({
  id: 'x-y', rank: 'species', scientificName: 'Xus yus', names: { ja: 'テスト' }, refs: { ncsu: 'x-y' },
  care: { light: { best: 'bright', min: 'low', directSun: 'avoid' }, temperature: { minC: 10, idealC: [18, 27] }, humidity: 'medium', watering: { growing: 'topdry', winter: 'halfdry' } },
  evidence: Object.fromEntries(['light.best', 'light.min', 'light.directSun', 'temperature.minC', 'temperature.idealC', 'humidity', 'watering.growing', 'watering.winter'].map((k) => [k, [{ src: 'estimate', reason: 'テストの理由です' }]])),
});

test('正しいデータは合格', () => assert.deepEqual(validateTaxon(ok()), []));

test('値に根拠がないと不合格', () => {
  const t = ok(); delete t.evidence.humidity;
  assert.ok(validateTaxon(t).some((m) => m.includes('humidity')));
});
test('目安に理由がないと不合格', () => {
  const t = ok(); t.evidence.humidity = [{ src: 'estimate' }];
  assert.ok(validateTaxon(t).some((m) => m.includes('理由')));
});
test('未知の値・項目は不合格', () => {
  const t = ok(); t.care.light.best = 'super'; t.foo = 1;
  const e = validateTaxon(t);
  assert.ok(e.some((m) => m.includes('light.best')));
  assert.ok(e.some((m) => m.includes('foo')));
});
test('矛盾：最低限の明るさが最適より明るい／冬のほうが水が多い／最低温度が適温より高い', () => {
  const t = ok(); t.care.light.min = 'direct'; t.care.watering.winter = 'moist'; t.care.temperature.minC = 20;
  const e = validateTaxon(t);
  assert.ok(e.some((m) => m.includes('light.min')));
  assert.ok(e.some((m) => m.includes('冬の水やり')));
  assert.ok(e.some((m) => m.includes('minC は idealC')));
});
test('品種は care が一部でよいが、学名は書かない', () => {
  assert.deepEqual(validateTaxon({ id: 'x-y-z', rank: 'cultivar', parent: 'x-y', cultivar: 'Z', names: { ja: 'ゼット' } }), []);
  assert.ok(validateTaxon({ id: 'x-y-z', rank: 'cultivar', parent: 'x-y', cultivar: 'Z', scientificName: 'Xus', names: { ja: 'ゼット' } }).length);
});

test('°F→℃ の換算', () => {
  assert.equal(fToC(50), 10); assert.equal(fToC(45), 7); assert.equal(fToC(60), 16); assert.equal(fToC(85), 29);
});
test('USDA ゾーンの最低気温', () => {
  assert.equal(zoneMinC('10a'), -1.1); assert.equal(zoneMinC('11a'), 4.4); assert.equal(zoneMinC('9b'), -3.9); assert.equal(zoneMinC('x'), null);
});
test('引用の照合は空白・引用符・大文字小文字を無視し、それ以外は厳密', () => {
  assert.equal(normText('It’s  Bright'), normText("it's bright"));
  const snap = { 'x-y': { description: 'Keep temperatures above 45 degrees F.', attributes: {}, cultivars: [] } };
  const t = ok(); t.care.temperature.minC = 7;
  t.evidence['temperature.minC'] = [{ src: 'ncsu', quote: 'keep temperatures above 45 degrees F.', fahrenheit: [45] }];
  assert.deepEqual(checkEvidence(t, new Map([[t.id, t]]), snap), []);
  t.evidence['temperature.minC'] = [{ src: 'ncsu', quote: 'Keep temperatures above 40 degrees F.', fahrenheit: [40] }];
  assert.equal(checkEvidence(t, new Map([[t.id, t]]), snap).length, 2);
});
