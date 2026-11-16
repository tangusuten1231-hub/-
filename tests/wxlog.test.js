import test from 'node:test';
import { PLANTS as PLANTS_FOR_TEST } from '../js/plants.js';
import assert from 'node:assert/strict';
import { mergeLog, pastDaysNeeded, lastDays, logSummary, compareJa } from '../js/wxlog.js';

test('天気の記録：終わった日だけためる・足りない日数・まとめ', () => {
  const today = new Date(2026, 10, 16);
  let log = mergeLog({}, [{ date: '2026-11-15', past: true, tmax: 17.2, tmin: 8.1, rain: 3 }, { date: '2026-11-16', past: false, tmax: 18, tmin: 9, rain: 0 }]);
  assert.deepEqual(Object.keys(log), ['2026-11-15'], '今日（予報）はためない');
  assert.equal(pastDaysNeeded({}, today), 92);
  assert.equal(pastDaysNeeded(log, today), 1);
  assert.equal(pastDaysNeeded({ '2026-10-01': {} }, today), 46);
  // 10月をまるごと＋11月前半
  const days = [];
  for (let d = new Date(2026, 9, 1); d < today; d.setDate(d.getDate() + 1)) days.push({ date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, past: true, tmax: 20, tmin: 10, rain: d.getDate() % 5 === 0 ? 10 : 0 });
  log = mergeLog(log, days);
  const monthly = Array.from({ length: 12 }, () => ({ tmax: 19, tmin: 9, prcp: 150 }));
  const sm = logSummary(log, monthly, today);
  assert.equal(sm.months[0].m, 10);
  assert.equal(sm.months[0].rain, 60);
  assert.equal(sm.monthDays, 15);
  assert.equal(sm.monthNormalToDate, 75);
  assert.equal(lastDays(log, 30, today).length, 30);
  assert.equal(compareJa(60, 150), 'かなり少ない');
  assert.equal(compareJa(100, 150), 'やや少ない');
  assert.equal(compareJa(150, 150), '平年並み');
});

test('ショートカット連携：URLの指示と記録ファイルの読み取り', async () => {
  const { parseAction, parseShortcutLog, eventOf, morningURL } = await import('../js/links.js');
  assert.deepEqual(parseAction('?do=water&plant=lavender'), { act: 'water', plant: 'lavender', spot: '', garden: '', memo: '' });
  assert.equal(parseAction('?do=hack'), null);
  assert.equal(parseAction(''), null);
  assert.equal(eventOf('水やりした'), 'water');
  assert.equal(eventOf('植え付け'), 'plant');
  const rows = parseShortcutLog('2026-11-16T07:30:00+09:00,水やり\n2026/11/15 18:02,水やり,ラベンダー\n2026年11月14日,咲き始め,バラ,いい香り\nこれは記録ではない');
  assert.equal(rows.length, 3);
  assert.deepEqual([rows[0].date, rows[0].time, rows[0].event], ['2026-11-16', '07:30', 'water']);
  assert.equal(rows[1].plantName, 'ラベンダー');
  assert.equal(rows[2].event, 'bloom-start');
  assert.equal(rows[2].memo, 'いい香り');
  assert.match(morningURL(35.72, 140.65), /precipitation_sum/);
});

test('日当たりチェッカー：障害物がないと季節どおり、南に高い建物があると冬は日陰', async () => {
  const { sunReport, horizonFn, angleOf } = await import('../js/suncheck.js');
  const open = sunReport(35.7, []);
  assert.equal(open.sun, 'full');
  assert.ok(open.summer > 13 && open.summer < 15, `夏至 ${open.summer}`);
  assert.ok(open.winter > 9 && open.winter < 10.5, `冬至 ${open.winter}`);
  // 南側（東南〜南西）に見上げ角40°の建物
  const wall = [{ az: 120, alt: 40 }, { az: 150, alt: 40 }, { az: 180, alt: 40 }, { az: 210, alt: 40 }, { az: 240, alt: 40 }];
  const r = sunReport(35.7, wall);
  assert.ok(r.winter < 1.5, `冬至 ${r.winter}`);
  assert.ok(r.summer > 5, '夏は太陽が高いので当たる');
  assert.equal(horizonFn(wall)(165), 40);
  assert.equal(horizonFn(wall)(0), 0, '北は開けている');
  assert.equal(angleOf(6.5, 6), 45);
});

test('iNaturalist：近くの観察記録を読み、図鑑と結びつける', async () => {
  const { fetchNearby, matchLocal, inatURL } = await import('../js/inat.js');
  assert.match(inatURL(35.72, 140.65, 'butterfly'), /taxon_id=47224/);
  const fake = async () => ({ ok: true, json: async () => ({ results: [
    { count: 120, taxon: { id: 1, name: 'Parus minor', preferred_common_name: 'シジュウカラ', default_photo: { square_url: 'https://x/1.jpg', attribution: '(c) someone' } } },
    { count: 3, taxon: { id: 2, name: 'Lavandula angustifolia', preferred_common_name: 'ラベンダー' } },
  ] }) });
  const list = await fetchNearby(35.7, 140.6, 'bird', fake);
  assert.equal(list[0].ja, 'シジュウカラ');
  const { CREATURES } = await import('../js/wildlife.js');
  const m = matchLocal(list, CREATURES, PLANTS_FOR_TEST);
  assert.equal(m[0].critter, 'shijuukara');
  assert.ok(m[1].plant, '植物図鑑と学名で結びつく');
});
