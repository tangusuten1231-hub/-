import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stableSystem, gardenContext, runTool, TOOLS, mdToHtml, MODEL } from '../js/ai.js';
import { PLANTS } from '../js/plants.js';
import { hardinessZone } from '../js/climate.js';

const monthly = Array.from({ length: 12 }, () => ({ tmax: 20, tmin: 10, prcp: 120 }));
const tokyo = { zone: hardinessZone(-2), avgMinTemp: -2, heatZone: 7, hotDays: 65, tropicalNights: 25, annualSnow: 0, annualPrecip: 1500, south: false, monthly, frostFree: false, lastFrost: 60, lastFrostSafe: 75, firstFrost: 340 };
const by = (id) => PLANTS.find((p) => p.id === id);
const ctx = { climate: tokyo, locName: '東京都', garden: { name: '前庭', area: 4, sun: 'full', moist: '', have: { echinacea: true } }, plants: [by('echinacea'), by('nepeta')], entries: [{ date: '2026-06-01', plants: ['echinacea'], events: ['bloom-start'], text: '咲いた' }], now: new Date(2026, 5, 5) };

test('モデルとツール定義', () => {
  assert.equal(MODEL, 'claude-opus-5-5');
  for (const t of TOOLS) {
    assert.equal(t.strict, true);
    assert.equal(t.input_schema.additionalProperties, false);
    assert.deepEqual(Object.keys(t.input_schema.properties).sort(), [...t.input_schema.required].sort());
  }
});

test('システムプロンプト：安定部分は毎回同じ（キャッシュが効く）', () => {
  assert.equal(stableSystem(), stableSystem());
  assert.ok(stableSystem().includes('エキナセア'));
  assert.ok(!/\d{4}年\d+月/.test(stableSystem()), '日付など変わるものを含めない');
});

test('庭の情報が文脈に入る', () => {
  const s = gardenContext(ctx);
  for (const w of ['東京都', 'ゾーン 9b', '前庭', 'エキナセア', '植え付け済み', '咲き始め', '2026年6月5日']) assert.ok(s.includes(w), w);
  assert.ok(gardenContext({ ...ctx, climate: null }).includes('場所はまだ設定されていない'));
});

test('ツールの実行と入力の検証', () => {
  const r = JSON.parse(runTool('get_plants', { names: ['エキナセア', 'そんな植物はない'] }, ctx).content);
  assert.equal(r[0].科, 'キク科');
  assert.ok(r[0].この地域での適性.includes('◎'));
  assert.equal(r[1].結果, '図鑑に見つかりません');
  const s = JSON.parse(runTool('search_plants', { sun: 'shade', bloom_month: 0, tag: 'any', keyword: '' }, ctx).content);
  assert.ok(s.候補.length >= 5);
  assert.ok(runTool('get_plants', { names: 'エキナセア' }, ctx).error, '配列でなければエラー');
  assert.ok(runTool('search_plants', { sun: 'sunny', bloom_month: 0, tag: 'any', keyword: '' }, ctx).error);
  assert.ok(runTool('search_plants', { sun: 'any', bloom_month: 6 }, ctx).error, '途中で切れた入力はエラー');
  assert.ok(runTool('unknown', {}, ctx).error);
});

test('AIの文章を安全にHTMLへ', () => {
  assert.equal(mdToHtml('**大事**だよ\n・一つ\n\n<script>alert(1)</script>'), '<p><b>大事</b>だよ<br>・一つ</p><p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  assert.equal(mdToHtml('- a\n- b'), '<p>・a<br>・b</p>');
});
