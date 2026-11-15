import test from 'node:test';
import assert from 'node:assert/strict';
import { polygonArea, inside, isSimple, siteShape, generateSite, siteSVG, bedDrifts } from '../js/site.js';

const climate = { zone: { value: 8.5, label: '8b' }, south: false, heatZone: 7, hotDays: 50, tropicalNights: 20, avgMinTemp: -3 };

test('多角形の面積・内外判定・交差チェック', () => {
  assert.equal(polygonArea([[0, 0], [4, 0], [4, 3], [0, 3]]), 12);
  assert.ok(inside(1, 1, [[0, 0], [4, 0], [4, 3], [0, 3]]));
  assert.ok(!inside(5, 1, [[0, 0], [4, 0], [4, 3], [0, 3]]));
  assert.ok(isSimple([[0, 0], [4, 0], [4, 3], [0, 3]]));
  assert.ok(!isSimple([[0, 0], [4, 3], [4, 0], [0, 3]]));
});

test('L字は長方形より小さく、面積指定で拡大縮小される', () => {
  const L = polygonArea(siteShape({ shape: 'L', width: 10, depth: 10 }));
  assert.ok(L < 100 && L > 70);
  const scaled = polygonArea(siteShape({ shape: 'poly', points: [[0, 0], [6, 0], [8, 5], [0, 6]], area: 120 }));
  assert.ok(Math.abs(scaled - 120) < 1);
});

test('庭まるごとプラン：構造物・花壇・案内・フォトスポット・生き物がそろう', () => {
  const s = generateSite({ shape: 'rect', width: 12, depth: 9, house: 'n', items: ['path', 'terrace', 'pergola', 'bench', 'water', 'pond', 'tree', 'lawn', 'compost'], text: 'ナチュラル', climate, wild: ['bird'] });
  const types = s.structs.map((x) => x.type);
  for (const t of ['pergola', 'bench', 'water', 'pond', 'tree', 'compost']) assert.ok(types.includes(t), t);
  assert.ok(s.beds.length >= 3);
  assert.ok(s.beds.every((b) => b.plan.species.length > 0));
  assert.ok(s.areas.path > 0 && s.areas.terrace > 0 && s.areas.lawn > 0);
  assert.ok(s.areas.bed + s.areas.path + s.areas.terrace + s.areas.lawn + s.areas.pond <= s.area + 1);
  assert.equal(s.tour[0].kind, 'terrace');
  assert.ok(s.photos.length >= 3);
  assert.equal(s.highlights.length, 5);
  assert.ok(s.bio.total > 0 && s.critters.length > 0);
  assert.ok(s.cost.total > 0);
  assert.ok(new Set(s.beds.map((b) => b.name)).size === s.beds.length, '花壇の名前が重ならない');
  // 家が北なら、南側の塀ぞいの花壇は日当たりが下がる
  const southBed = s.beds.find((b) => b.compass === 's');
  if (southBed) assert.notEqual(southBed.sun, 'full');
  assert.match(siteSVG(s, { tour: true, photos: true }), /^<svg/);
});

test('自由な形・家が南でも動き、小さな庭でも壊れない', () => {
  const s = generateSite({ shape: 'poly', points: [[0, 0], [14, 0], [16, 8], [6, 12], [0, 7]], house: 's', items: ['path', 'water'], climate });
  assert.ok(s.beds.length > 0);
  const tiny = generateSite({ shape: 'rect', width: 3, depth: 2, climate });
  assert.ok(tiny.beds.length >= 1);
});

test('平面図の花壇：すべてのマスを群れで塗り分け、植物ごとに番号札は1つ', () => {
  const s = generateSite({ shape: 'rect', width: 10, depth: 8, house: 'n', items: ['path', 'terrace', 'lawn', 'water'], text: 'ナチュラル', climate, style: 'matrix' });
  const ids = [...new Set(s.beds.flatMap((b) => b.plan.species.filter((x) => x.role !== 'under').map((x) => x.plant.id)))];
  const nums = new Map(ids.map((id, i) => [id, i + 1]));
  const r = bedDrifts(s, (x) => x, (y) => y, 40, nums);
  for (const b of s.beds) {
    const got = r.drifts.filter((d) => d.b === b).flatMap((d) => d.cells);
    assert.equal(got.length, b.cells.length, `花壇${b.id}のマスがすべて塗られる`);
    assert.equal(new Set(got).size, got.length, '同じマスを二重に塗らない');
  }
  assert.equal((r.tags.match(/data-jump="scast-/g) || []).length, new Set(r.drifts.map((d) => d.s.plant.id)).size);
  assert.match(siteSVG(s, { nums }), /clipPath id="bd/);
});
