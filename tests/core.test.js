import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hardinessZone, heatZone, analyzeClimate, formatDoy } from '../js/climate.js';
import { evaluate, findPlants, bloomGaps, buildTasks } from '../js/garden.js';
import { noonAltitude, dayLength, TILT } from '../js/sun.js';
import { PLANTS, COLORS } from '../js/plants.js';

/** 正弦波で合成した日別データ（mean: 年平均, amp: 年較差の半分, dtr: 日較差の半分） */
function synth({ years = 10, mean = 16, amp = 11, dtr = 4, startYear = 2016, south = false } = {}) {
  const time = [], tmax = [], tmin = [], prcp = [], snow = [];
  for (let y = startYear; y < startYear + years; y++) {
    for (let d = new Date(Date.UTC(y, 0, 1)); d.getUTCFullYear() === y; d.setUTCDate(d.getUTCDate() + 1)) {
      const doy = (d - Date.UTC(y, 0, 1)) / 86400000;
      const phase = south ? Math.PI : 0;
      const t = mean - amp * Math.cos((2 * Math.PI * (doy - 20)) / 365 + phase);
      time.push(d.toISOString().slice(0, 10));
      tmax.push(t + dtr);
      tmin.push(t - dtr);
      prcp.push(4);
      snow.push(t - dtr < 0 ? 0.5 : 0);
    }
  }
  return { time, temperature_2m_max: tmax, temperature_2m_min: tmin, precipitation_sum: prcp, snowfall_sum: snow };
}

test('USDA ゾーン換算', () => {
  assert.equal(hardinessZone(-3).label, '9b'); // 東京付近
  assert.equal(hardinessZone(-12).label, '8a');
  assert.equal(hardinessZone(-30).label, '4b');
  assert.equal(hardinessZone(-25).label, '5b');
  assert.equal(hardinessZone(5).label, '11a');
});

test('AHS 暑さゾーン換算', () => {
  assert.equal(heatZone(0), 1);
  assert.equal(heatZone(20), 4);
  assert.equal(heatZone(60), 6);
  assert.equal(heatZone(75), 7);
  assert.equal(heatZone(250), 12);
});

test('温暖地の気候解析', () => {
  const c = analyzeClimate(synth(), 35);
  assert.equal(c.years, 10);
  assert.equal(c.avgMinTemp, 1); // 16 - 11 - 4
  assert.equal(c.frostFree, true);
  assert.equal(c.monthly.length, 12);
  assert.ok(c.monthly[7].tmax > c.monthly[0].tmax);
  assert.equal(c.annualPrecip, 1461);
});

test('寒冷地: 終霜・初霜・積雪', () => {
  const c = analyzeClimate(synth({ mean: 2, amp: 18 }), 43);
  assert.equal(c.frostFree, false);
  assert.ok(c.lastFrost > 90 && c.lastFrost < 150, `終霜 ${c.lastFrost}`);
  assert.ok(c.firstFrost > 280 && c.firstFrost < 330, `初霜 ${c.firstFrost}`);
  assert.ok(c.growingDays > 130 && c.growingDays < 240);
  assert.equal(c.zone.label, '6b');
  assert.match(formatDoy(c.lastFrost), /^\d+月(上|中|下)旬$/);
});

test('南半球でも霜の時期が逆転して解析できる', () => {
  const c = analyzeClimate(synth({ mean: 8, amp: 14, south: true }), -43);
  assert.equal(c.south, true);
  assert.ok(c.lastFrost > 240, `南半球の終霜 ${c.lastFrost}`); // 9〜11月頃
  assert.ok(c.firstFrost < 160, `南半球の初霜 ${c.firstFrost}`);
  assert.ok(c.growingDays > 100 && c.growingDays < 260);
});

test('適性判定: 暑い地域で冷涼地向きの植物は難しい', () => {
  const hot = { zone: hardinessZone(-2), heatZone: 9, hotDays: 100, tropicalNights: 40, annualSnow: 0, south: false };
  const delph = PLANTS.find((p) => p.id === 'delphinium');
  const rud = PLANTS.find((p) => p.id === 'rudbeckia');
  assert.equal(evaluate(delph, hot).level, 1);
  assert.equal(evaluate(rud, hot).level, 3);
});

test('適性判定: 積雪の保温効果を考慮', () => {
  const snowy = { zone: hardinessZone(-30), heatZone: 2, hotDays: 3, tropicalNights: 0, annualSnow: 300, south: false };
  const gaura = PLANTS.find((p) => p.id === 'gaura'); // zone 5〜
  const r = evaluate(gaura, snowy);
  assert.equal(snowy.zone.label, '4b');
  assert.equal(r.level, 2);
});

test('絞り込み', () => {
  const shade = findPlants(null, { sun: 'shade' });
  assert.ok(shade.length > 5);
  assert.ok(shade.every((r) => r.plant.sun.includes('shade')));
});

test('開花リレーの空白月と提案', () => {
  const garden = ['echinacea', 'rudbeckia'].map((id) => PLANTS.find((p) => p.id === id));
  const { counts, gaps } = bloomGaps(garden, null);
  assert.equal(counts[6], 2);
  assert.ok(gaps.some((g) => g.month === 4));
  const april = gaps.find((g) => g.month === 4);
  assert.ok(april.suggestions.every((s) => s.plant.bloom.includes(4)));
});

test('作業カレンダー生成', () => {
  const c = analyzeClimate(synth({ mean: 2, amp: 18 }), 43);
  const garden = ['aster', 'nepeta', 'panicum'].map((id) => PLANTS.find((p) => p.id === id));
  const tasks = buildTasks(c, garden);
  assert.ok(tasks.length > 5);
  assert.ok(tasks.every((t) => t.month >= 1 && t.month <= 12));
  assert.ok(tasks.some((t) => t.title.includes('チェルシーチョップ')));
  assert.ok(tasks.some((t) => t.title.includes('防寒')));
});

test('太陽計算', () => {
  assert.equal(Math.round(noonAltitude(35, -TILT)), 32); // 東京の冬至 ≈ 31.6°
  assert.equal(Math.round(dayLength(0, 10)), 12);
});

test('植物データの整合性', () => {
  const ids = new Set();
  for (const p of PLANTS) {
    assert.ok(!ids.has(p.id), `重複ID ${p.id}`);
    ids.add(p.id);
    assert.ok(p.zone[0] <= p.zone[1], p.id);
    assert.ok(p.h[0] <= p.h[1], p.id);
    assert.ok(p.bloom.every((m) => m >= 1 && m <= 12), p.id);
    assert.ok(p.color.every((c) => COLORS[c]), p.id);
    assert.ok([1, 2, 3].includes(p.humid), p.id);
  }
});
