import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLANTS, GROUP_COUNT } from '../js/plants.js';
import { ideasFor, plantsForNeed, RECIPES, SEASON_IDEAS } from '../js/enjoy.js';
import { weatherAdvice } from '../js/weather.js';
import { findPlants } from '../js/garden.js';

test('図鑑データ：品種数・科・ハーブ・小低木・シダ・球根', () => {
  assert.ok(PLANTS.length >= 600, `${PLANTS.length}`);
  assert.ok(GROUP_COUNT >= 200);
  assert.ok(PLANTS.every((p) => p.family && p.family.ja !== 'その他'), '全植物に科');
  for (const t of ['shrub', 'fern', 'bulb', 'subshrub', 'grass']) assert.ok(PLANTS.some((p) => p.type === t), t);
  assert.ok(PLANTS.filter((p) => p.tags.includes('herb')).length >= 50);
  assert.ok(PLANTS.some((p) => p.tips.length));
});

test('図鑑検索：科・種類・用途・キーワード', () => {
  const kiku = findPlants(null, { family: 'キク科' });
  assert.ok(kiku.length > 50 && kiku.every((r) => r.plant.family.ja === 'キク科'));
  const ferns = findPlants(null, { type: 'fern' });
  assert.ok(ferns.length >= 4);
  const dry = findPlants(null, { use: 'dry' });
  assert.ok(dry.every((r) => r.plant.uses.includes('dry')));
  assert.ok(findPlants(null, { q: 'シソ科' }).length > 20, '科名でも検索できる');
  assert.ok(findPlants(null, { q: 'Echinacea' }).length >= 10, '学名で検索できる');
});

test('季節の楽しみとレシピ', () => {
  for (let m = 1; m <= 12; m++) assert.ok(ideasFor(m).length >= 1, `${m}月`);
  assert.ok(SEASON_IDEAS.every((i) => !i.recipe || RECIPES[i.recipe]), 'レシピ参照が正しい');
  const dryPlants = plantsForNeed('dry', PLANTS);
  assert.ok(dryPlants.length > 30);
  assert.ok(plantsForNeed('group:miscanthus', PLANTS).every((p) => p.group === 'miscanthus'));
  assert.ok(RECIPES.bonfire.tips.some((t) => t.includes('条例')), '焚き火の注意事項');
});

test('天気アドバイス', () => {
  const day = (o) => ({ date: '2026-04-10', code: 0, tmax: 20, tmin: 8, rain: 0, gust: 10, ...o });
  const frost = weatherAdvice([day({ tmin: 0 }), day({}), day({})], 4);
  assert.ok(frost.some((a) => a.title.includes('霜')));
  const heat = weatherAdvice([day({ tmax: 36 })], 8);
  assert.ok(heat.some((a) => a.title.includes('猛暑')));
  const storm = weatherAdvice([day({ rain: 80, gust: 75 })], 9);
  assert.ok(storm.some((a) => a.title.includes('大雨')) && storm.some((a) => a.title.includes('強風')));
  const nice = weatherAdvice([day({}), day({})], 10);
  assert.ok(nice.some((a) => a.title.includes('日和')));
});
