import { test } from 'node:test';
import assert from 'node:assert/strict';
import { insights, actualBloom, yearStats, lastEvent, EVENTS, EVENT_GROUPS } from '../js/diary.js';
import { reply, findPlant, STARTERS } from '../js/chat.js';
import { PLANTS } from '../js/plants.js';
import { hardinessZone } from '../js/climate.js';

const monthly = Array.from({ length: 12 }, () => ({ tmax: 20, tmin: 10, prcp: 120 }));
const tokyo = { zone: hardinessZone(-2), heatZone: 7, hotDays: 65, tropicalNights: 25, annualSnow: 0, annualPrecip: 1500, south: false, monthly, frostFree: false, lastFrost: 60, lastFrostSafe: 75, firstFrost: 340 };
const by = (id) => PLANTS.find((p) => p.id === id);
const nameOf = (id) => by(id)?.ja || id;
const E = (date, plants, events, extra = {}) => ({ id: date + events.join(), date, plants, events, ...extra });

test('できごとの定義', () => {
  assert.ok(Object.values(EVENTS).every((e) => EVENT_GROUPS[e.group] && e.ja));
});

test('去年の記録から、開花・作業・トラブルを前もって知らせる', () => {
  const entries = [
    E('2025-06-12', ['echinacea'], ['bloom-start']),
    E('2025-06-20', ['nepeta'], ['cut']),
    E('2025-06-25', ['phlox-paniculata'], ['disease'], { text: 'うどんこ病' }),
    E('2025-06-03', [], ['butterfly'], { text: 'アゲハが来た' }),
    E('2025-10-01', ['aster'], ['bloom-start']),
    E('2026-06-01', ['echinacea'], ['water']), // 今年の記録は対象外
  ];
  const ins = insights(entries, new Date(2026, 5, 5), nameOf);
  const types = ins.map((i) => i.type);
  assert.ok(ins.some((i) => i.type === 'bloom' && i.title.includes('エキナセア') && i.text.includes('6/12')));
  assert.ok(ins.some((i) => i.type === 'work' && i.title.includes('切り戻し')));
  assert.ok(ins.some((i) => i.type === 'trouble' && i.text.includes('風通し')));
  assert.ok(ins.some((i) => i.type === 'memory' && i.text.includes('アゲハ')));
  assert.ok(!ins.some((i) => i.title.includes('アスター')), '時期が違う記録は出さない');
  assert.equal(types[0], 'trouble', 'トラブルの予防を最初に');
  assert.equal(insights(entries, new Date(2026, 0, 10), nameOf).length, 0);
  assert.equal(insights([], new Date(), nameOf).length, 0);
});

test('年をまたぐ時期と、枯れた記録からの提案', () => {
  const ins = insights([E('2025-01-03', ['helleborus'], ['bloom-start'])], new Date(2025, 11, 25), nameOf);
  assert.equal(ins.length, 0, '同じ年は対象外');
  const ins2 = insights([E('2025-01-03', ['helleborus'], ['bloom-start'])], new Date(2026, 11, 25), nameOf);
  assert.ok(ins2.some((i) => i.type === 'bloom'), '12月末に1月初めの開花を予告');
  const dead = insights([E('2025-08-10', ['lavender-hidcote'], ['dead'])], new Date(2026, 3, 1), nameOf);
  assert.ok(dead.some((i) => i.type === 'lesson'));
});

test('実際の開花月・年間まとめ・最後のできごと', () => {
  const entries = [E('2025-06-12', ['echinacea'], ['bloom-start']), E('2025-07-20', ['echinacea'], ['peak'], { photo: 'x' }), E('2025-07-21', ['echinacea'], ['water'])];
  assert.deepEqual([...actualBloom(entries).get('echinacea')].sort(), [6, 7]);
  const st = yearStats(entries, 2025);
  assert.equal(st.days, 3); assert.equal(st.bloomed, 1); assert.equal(st.photos, 1);
  assert.equal(lastEvent(entries, 'water'), '2025-07-21');
});

test('ツピの応答：植物名の認識', () => {
  assert.equal(findPlant('エキナセアの切り戻しは？').group, 'echinacea');
  assert.equal(findPlant('ホワイトスワンについて').id, 'echinacea-white-swan');
  assert.equal(findPlant('ギボウシを育てたい').group, 'hosta');
  assert.equal(findPlant('今日は何をすればいい？'), null);
});

test('ツピの応答：話題ごとに答える', () => {
  const ctx = { climate: tokyo, garden: { name: '前庭', sun: 'full' }, plants: [by('echinacea'), by('nepeta')], entries: [], forecast: null, now: new Date(2026, 5, 5) };
  for (const q of [...STARTERS, 'エキナセアについて教えて', 'ネペタの切り戻しは？', '葉に白い粉がついている', '肥料はいつ？', '株分けの時期は？', '霜はいつ？', 'こんにちは', 'ありがとう']) {
    const r = reply(q, ctx);
    assert.ok(r.html && r.html.length > 20, q);
    assert.ok(!/undefined|NaN/.test(r.html), q + r.html);
  }
  assert.match(reply('葉に白い粉がついている', ctx).html, /うどんこ病/);
  assert.match(reply('エキナセアと相性のよい植物は？', ctx).html, /一緒に植える/);
  assert.match(reply('今週なにをすればいい？', ctx).html, /6月/);
  assert.match(reply('今日の晩ごはんは？', ctx).html, /今日|6月|答えられない/);
  // 場所がないときは場所設定を促す
  assert.ok(reply('おすすめの植物は？', { ...ctx, climate: null }).actions.some((a) => a.go === 'site'));
  // 予報があれば水やりの答えに反映
  const dry = reply('水やりは必要？', { ...ctx, forecast: [{ rain: 0, tmax: 33 }, { rain: 0, tmax: 34 }, { rain: 0, tmax: 32 }] });
  assert.match(dry.html, /暑くて雨のない/);
});
