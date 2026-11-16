import test from 'node:test';
import assert from 'node:assert/strict';
import { searchPlace } from '../js/climate.js';

// Open-Meteo の地名検索は「旭市」には答えるが「千葉県旭市」には答えない（実際の挙動に合わせたモック）
const DB = [
  { name: '旭市', admin1: '千葉県', country: '日本', country_code: 'JP', latitude: 35.72, longitude: 140.65, population: 64000 },
  { name: '旭', admin1: '北海道', country: '日本', country_code: 'JP', latitude: 43.7, longitude: 142.4, population: 1000 },
];
const fakeFetch = async (url) => {
  const q = new URL(url).searchParams.get('name');
  return { ok: true, json: async () => ({ results: DB.filter((r) => r.name === q || r.name.startsWith(q) && q.length >= 1) }) };
};

test('地名検索：都道府県名つき・区切り・なしのどれでも見つかる', async () => {
  for (const q of ['千葉県旭市', '千葉県 旭市', '千葉県　旭市', '旭市']) {
    const r = await searchPlace(q, fakeFetch);
    assert.ok(r.length >= 1, q);
    assert.match(r[0].name, /旭市、千葉県/, q);
  }
  const hk = await searchPlace('北海道 旭', fakeFetch);
  assert.ok(hk.every((x) => x.name.includes('北海道')), '県で絞り込む');
});

test('海からの距離：標高0m以下の地点がいちばん近い距離', async () => {
  const { fetchCoast } = await import('../js/climate.js');
  // 東側（経度が大きい方）2km先から海
  const f = (lat0, lon0) => async (url) => {
    const u = new URL(url);
    const lats = u.searchParams.get('latitude').split(',').map(Number), lons = u.searchParams.get('longitude').split(',').map(Number);
    return { ok: true, json: async () => ({ elevation: lats.map((la, i) => (lons[i] - lon0 > 0.018 ? 0 : 5)) }) };
  };
  assert.equal(await fetchCoast(35.72, 140.65, f(35.72, 140.65)), 2);
  const inland = async (url) => ({ ok: true, json: async () => ({ elevation: new URL(url).searchParams.get('latitude').split(',').map(() => 30) }) });
  assert.equal(await fetchCoast(36, 138, inland), null);
});
