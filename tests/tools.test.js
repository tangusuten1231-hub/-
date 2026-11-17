import test from 'node:test';
import assert from 'node:assert/strict';
import { seedlings, bedSoil, potLiters, potSoil, fertilizer, liquid, mulch, toICS, firstSaturday, waterAdvice } from '../js/tools.js';
import { diagnose, SYMPTOMS } from '../js/doctor.js';
import { PLANTS } from '../js/plants.js';

test('計算機：苗の数・土・鉢・肥料・マルチ', () => {
  assert.deepEqual(seedlings(1, 50), { tri: 5, square: 4 });
  assert.equal(bedSoil(2, 30).soil, 600);
  assert.equal(bedSoil(2, 30).compost, 150);
  assert.ok(potLiters(5) > 1 && potLiters(5) < 1.6, '5号は約1.3L');
  assert.ok(potLiters(10) > 9 && potLiters(10) < 12, '10号は約10L');
  assert.equal(potSoil(10, 2).bags14, 2);
  assert.equal(fertilizer(2).base, 160);
  assert.equal(liquid(2, 1000), 2);
  assert.deepEqual(mulch(4, 5), { liters: 200, bags40: 5 });
});

test('カレンダー書き出し：終日の予定と通知、各月の最初の土曜', () => {
  const d = firstSaturday(2026, 11);
  assert.equal(d.getDay(), 6);
  assert.equal(d.getDate(), 7);
  const ics = toICS([{ date: d, title: '株分け', detail: '春に、元気な外側を分ける。' }]);
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261107/);
  assert.match(ics, /TRIGGER:PT9H/);
  assert.ok(ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75), '75バイトで折り返す');
});

test('水やり：雨のあとは不要、真夏の鉢は2回、植えたばかりは必要', () => {
  const day = (o) => ({ date: '2026-07-01', tmax: 25, tmin: 18, rain: 0, pop: 10, ...o });
  const rainy = [day({ past: true, rain: 15 }), day({ past: true, rain: 5 }), day({})];
  assert.equal(waterAdvice(rainy, { month: 7 }).need, 'none');
  const hot = [day({ past: true }), day({ past: true }), day({ past: true }), day({ tmax: 34 })];
  assert.equal(waterAdvice(hot, { pot: true, month: 7 }).need, 'twice');
  assert.equal(waterAdvice(hot, { month: 7 }).need, 'yes');
  assert.equal(waterAdvice(hot, { young: true, month: 7 }).need, 'yes');
  assert.equal(waterAdvice([day({ tmax: 8 })], { month: 1 }).need, 'none');
});

test('症状から調べる：症状・植物・季節から原因を推定', () => {
  const phlox = PLANTS.find((p) => p.group === 'phlox-paniculata');
  const r = diagnose(['whitepowder'], phlox, 6);
  assert.equal(r[0].id, 'powdery');
  const hyd = PLANTS.find((p) => p.group === 'hydrangea-serrata');
  assert.equal(diagnose(['noflower'], hyd, 6)[0].id, 'prune', 'アジサイの花が咲かない＝剪定時期');
  const hosta = PLANTS.find((p) => p.group === 'hosta');
  assert.ok(diagnose(['browntips', 'spots'], hosta, 8).slice(0, 2).some((x) => x.id === 'sunburn'), '日陰の植物の葉焼け');
  assert.equal(diagnose(['holes'], null, 6).filter((x) => ['slug', 'armyworm'].includes(x.id)).length, 2);
  assert.equal(diagnose([], null, 6).length, 0);
  assert.ok(Object.keys(SYMPTOMS).length >= 15);
});

test('症状から調べる：どの植物・症状の組み合わせでもエラーにならない', () => {
  const syms = Object.keys(SYMPTOMS);
  for (const p of PLANTS.filter((_, i) => i % 7 === 0)) assert.ok(Array.isArray(diagnose(syms, p, 7, { pot: true })));
});
