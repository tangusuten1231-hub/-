import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { consultPrompt, imagePrompt, parseBedsReply, gardenContext, AI_APPS } from '../js/handoff.js';
import { PLANTS } from '../js/plants.js';
import { hardinessZone } from '../js/climate.js';

const monthly = Array.from({ length: 12 }, () => ({ tmax: 20, tmin: 10, prcp: 120 }));
const tokyo = { zone: hardinessZone(-2), avgMinTemp: -2, heatZone: 7, hotDays: 65, tropicalNights: 25, annualSnow: 0, annualPrecip: 1500, south: false, monthly, frostFree: false, lastFrost: 60, lastFrostSafe: 75, firstFrost: 340 };
const by = (id) => PLANTS.find((p) => p.id === id);
const ctx = { climate: tokyo, locName: '東京都', garden: { name: '前庭', area: 4, sun: 'full', moist: '', have: { echinacea: true } }, plants: [by('echinacea'), by('nepeta')], entries: [{ date: '2026-06-01', plants: ['echinacea'], events: ['bloom-start'], text: '咲いた' }], now: new Date(2026, 5, 5) };

test('課金につながる仕組みがアプリに含まれていない', () => {
  const files = ['index.html', 'sw.js', ...fs.readdirSync('js').filter((f) => f.endsWith('.js')).map((f) => `js/${f}`)];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    assert.ok(!/api\.anthropic\.com|api\.openai\.com|generativelanguage\.googleapis|x-api-key|sk-ant-|dangerouslyAllowBrowser/.test(src), `${f} にAIのAPI呼び出しが残っている`);
  }
  assert.ok(!fs.existsSync('js/vendor'), 'SDKを同梱しない');
  assert.ok(!JSON.parse(fs.readFileSync('package.json', 'utf8')).devDependencies, '依存パッケージなし');
});

test('相談文に庭の情報と質問が入る', () => {
  const p = consultPrompt('エキナセアが倒れるのはなぜ？', ctx);
  for (const w of ['エキナセアが倒れるのはなぜ？', '東京都', 'ゾーン 9b', '前庭', 'ネペタ', '咲き始め', '図鑑データ', 'キク科']) assert.ok(p.includes(w), w);
  assert.ok(!consultPrompt('肥料はいつ？', ctx).includes('図鑑データ'), '植物名がなければ図鑑データは付けない');
  assert.ok(gardenContext({ ...ctx, climate: null, garden: null, plants: [], entries: [] }).includes('今日'));
  assert.ok(AI_APPS.length >= 3 && AI_APPS.every((a) => a.url.startsWith('https://')));
});

test('画像の依頼文と、AIの答えの読み込み', () => {
  const p = imagePrompt('上が北', ctx);
  assert.ok(p.includes('上が北') && p.includes('"beds"') && p.includes('```json'));
  const reply = '画像を拝見しました。南向きの庭です。\n\n```json\n{"summary":"南向きの敷地","north":"上が北","beds":[{"name":"南の花壇","width_m":5,"depth_m":1.2,"sun":"full","moist":"mid","view":"border","keywords":"ナチュラル","reason":"日向"},{"name":"北の通路","width_m":"6.04","depth_m":99,"sun":"shade（日陰）","moist":"?","view":"border","keywords":"<b>和風</b>","reason":"影"}],"cautions":["寸法は現地で確認"]}\n```\nご参考まで。';
  const r = parseBedsReply(reply);
  assert.equal(r.result.beds.length, 2);
  assert.deepEqual([r.result.beds[1].width_m, r.result.beds[1].depth_m, r.result.beds[1].sun, r.result.beds[1].moist], [6, 10, 'shade', 'mid'], '値は安全な範囲に丸める');
  assert.ok(!r.result.beds[1].keywords.includes('<'), 'タグは取り除く');
  // コードブロックなしでも読める
  assert.equal(parseBedsReply('結果です {"beds":[{"name":"庭","width_m":3,"depth_m":1,"sun":"part","moist":"wet","view":"island"}]} 以上').result.beds[0].sun, 'part');
  assert.ok(parseBedsReply('').error);
  assert.ok(parseBedsReply('日当たりの良い庭ですね。').error);
  assert.ok(parseBedsReply('```json\n{"beds":[]}\n```').error);
});
