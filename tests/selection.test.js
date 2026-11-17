import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLANTS, COLORS } from '../js/plants.js';
import { evaluate } from '../js/garden.js';
import { hardinessZone } from '../js/climate.js';
import { hardFails, siteOf, climateTraits, CLIMATE_FIX } from '../js/fit.js';
import { generateSite } from '../js/site.js';

// 気温の月平均はおおよその平年値（テスト用の固定値）
const mk = (avgMin, hotDays, tropical, snow, means, coastKm) => {
  const lim = [1, 8, 15, 31, 46, 61, 91, 121, 151, 181, 211];
  const i = lim.findIndex((l) => hotDays < l);
  return { zone: hardinessZone(avgMin), heatZone: i < 0 ? 12 : i + 1, hotDays, tropicalNights: tropical, annualSnow: snow, annualPrecip: 1500, south: false, coastKm,
    frostFree: avgMin > 3, lastFrost: 100, lastFrostSafe: 110, firstFrost: 300, monthly: means.map((m) => ({ tmax: m + 4, tmin: m - 4, prcp: 120 })) };
};
const ASAHI = mk(-2, 12, 8, 2, [5.6, 6.2, 9.1, 13.6, 17.6, 20.5, 24.2, 26, 23.4, 18.4, 13.1, 8.2], 3);
const SAPPORO = mk(-16.5, 9, 0, 184, [-3.2, -2.7, 1.1, 7.3, 13, 17, 21.1, 22.3, 18.6, 12.1, 5.2, -0.9], null);
const NAHA = mk(11.5, 100, 122, 0, [17.3, 17.5, 19.1, 21.5, 24.2, 27.2, 29.1, 29, 27.9, 25.5, 22.4, 19], 1);
const P = (id) => PLANTS.find((p) => p.id === id);
const K = { must: [], exclude: [], colors: ['white', 'blue'], colorMode: 'prefer', leafs: [], density: 'standard', variety: 'standard', maxH: 0, months: [5], winter: false };
const site = (c, seed) => generateSite({ width: 15, depth: 8, shape: 'rect', house: 'n', text: '白、青', style: 'border', sun: 'full', moist: '', climate: c, seed, k: K });

test('気候判定用の項目：図鑑の値を写し、データのないものは null', () => {
  assert.equal(ASAHI.zone.label, '9b'); assert.equal(SAPPORO.zone.label, '7a'); assert.equal(NAHA.zone.label, '12a');
  for (const p of PLANTS) {
    assert.deepEqual([p.fit.hardinessZoneMin, p.fit.hardinessZoneMax], p.zone, p.id);
    assert.equal(p.fit.heatZoneMax, p.heat, p.id);
  }
  assert.equal(P('tulipa').fit.chillRequirement, 'high');
  assert.equal(P('echinacea').fit.chillRequirement, null); // 出典のない値は作らない
  assert.equal(climateTraits(P('rosemary')).saltTolerance, 'strong');
  for (const [k, v] of Object.entries(CLIMATE_FIX)) assert.ok(v.src && PLANTS.some((p) => (p.id === k || p.group === k) && p.climateSrc === v.src), k);
});

test('ハードフィルター：札幌・那覇で育たない植物を外し、旭市では残す', () => {
  for (const id of ['verbena-tapien', 'ceanothus']) assert.ok(hardFails(P(id), SAPPORO).length, `札幌 ${id}`);
  for (const id of ['camassia', 'digitalis', 'matteuccia', 'actaea']) assert.ok(hardFails(P(id), NAHA).length, `那覇 ${id}`);
  for (const id of ['verbena-tapien', 'ceanothus', 'camassia', 'digitalis', 'matteuccia', 'actaea']) assert.equal(hardFails(P(id), ASAHI).length, 0, `旭市 ${id}`);
  // 図鑑の判定（△）とプランの除外は同じ基準
  for (const c of [ASAHI, SAPPORO, NAHA]) for (const p of PLANTS) assert.equal(evaluate(p, c).level === 1, hardFails(p, c).length > 0, p.id);
  assert.match(hardFails(P('tulipa'), NAHA).map((f) => f.text).join(), /低温/);
});

test('プラン：違反0件・見ごろの月がピーク・理由は実データどおり・地域で顔ぶれが変わる', () => {
  const sets = [];
  for (const c of [ASAHI, SAPPORO, NAHA]) {
    const s = site(c, 0);
    const lab = siteOf(c).label;
    assert.ok(s.peakNote?.ok, s.peakNote?.text);
    for (const b of s.beds) for (const sp of b.plan.species) {
      assert.equal(hardFails(sp.plant, c).length, 0, `${lab} ${sp.plant.id}`);
      assert.ok(sp.why.length, sp.plant.id);
      for (const w of sp.why) {
        let m;
        if ((m = w.match(/^ゾーン(\w+)に適合（耐寒(\d+)〜(\d+)）$/))) assert.deepEqual([m[1], +m[2], +m[3]], [lab, ...sp.plant.zone], w);
        if ((m = w.match(/^(\d+)月の(.+)花$/))) { assert.ok(sp.plant.bloom.includes(+m[1]), w); assert.ok(sp.plant.color.some((x) => COLORS[x].ja === m[2]), w); }
      }
      if (sp.role !== 'under' && (sp.plant.soc ?? 3) >= 3) assert.ok(sp.qty >= 3, `${sp.plant.ja} ${sp.qty}株`);
    }
    sets.push(new Set(s.plants.map((p) => p.group)));
  }
  const common = [...sets[0]].filter((g) => sets[1].has(g) && sets[2].has(g)).length;
  assert.ok(common / sets[0].size <= 0.2, `3地域共通 ${common}`);
  const a = new Set(site(ASAHI, 1).plants.map((p) => p.group));
  const share = [...a].filter((g) => sets[0].has(g)).length / ((a.size + sets[0].size) / 2);
  assert.ok(share >= 0.3 && share <= 0.75, `同条件2プランの共通 ${Math.round(share * 100)}%`);
});

test('育てやすさの6段階：決め方と図鑑の絞り込み', async () => {
  const { GRADE, gradeMatch, findPlants } = await import('../js/garden.js');
  assert.deepEqual(Object.keys(GRADE).map(Number).sort(), [1, 2, 3, 4, 5, 6]);
  for (const c of [ASAHI, SAPPORO, NAHA]) for (const p of PLANTS) {
    const r = evaluate(p, c);
    assert.ok(r.grade >= 1 && r.grade <= 6, p.id);
    assert.equal(r.grade <= 2, hardFails(p, c).length > 0, p.id); // 工夫が必要・育てられない ＝ プランの候補から外れる植物
    if (r.grade === 6) assert.ok(p.tags.includes('easy'), p.id);
    if (r.grade === 2) assert.ok(r.tips.length, p.id);
  }
  assert.equal(evaluate(P('pelargonium'), SAPPORO).grade, 2); // 鉢で取り込めば育つ
  assert.equal(evaluate(P('tulipa'), NAHA).grade, 1);
  assert.equal(evaluate(P('echinacea'), ASAHI).grade, 6);
  assert.ok(gradeMatch(5, 'ge4') && !gradeMatch(3, 'ge4') && gradeMatch(2, '2') && !gradeMatch(2, '1') && gradeMatch(1, ''));
  const easy = findPlants(ASAHI, { grade: '6' });
  assert.ok(easy.length && easy.every((r) => r.grade === 6));
  const ge4 = findPlants(SAPPORO, { grade: 'ge4' });
  assert.ok(ge4.every((r) => r.grade >= 4));
  const all = findPlants(NAHA, {});
  for (let i = 1; i < all.length; i++) assert.ok(all[i - 1].grade >= all[i].grade); // おすすめ順は育てやすい順
});
