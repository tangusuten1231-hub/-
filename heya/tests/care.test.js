import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from '../js/catalog.data.js';
import { spotLight, lightFromLux, fit, nextCheck, isWinterFor, search, normalizeKana, recommend } from '../js/care.js';

const get = (id) => CATALOG.find((e) => e.id === id);

test('明るさの見積もり：窓の向きと距離', () => {
  assert.equal(spotLight({ window: 'S', distance: 'window', sheer: false }).level, 'direct');
  assert.equal(spotLight({ window: 'S', distance: 'window', sheer: false }).sun, 'midday');
  assert.equal(spotLight({ window: 'E', distance: 'window', sheer: false }).sun, 'morning');
  assert.equal(spotLight({ window: 'S', distance: 'window', sheer: true }).level, 'bright');
  assert.equal(spotLight({ window: 'S', distance: 'window', sheer: true }).sun, 'none');
  assert.equal(spotLight({ window: 'N', distance: 'window' }).level, 'medium');
  assert.equal(spotLight({ window: 'E', distance: 'near' }).level, 'bright');
  assert.equal(spotLight({ window: 'W', distance: 'mid' }).level, 'medium');
  assert.equal(spotLight({ window: 'S', distance: 'far' }).level, 'low');
  assert.equal(spotLight({ window: 'none' }).level, 'low');
});
test('実測の照度があれば優先する', () => {
  assert.equal(lightFromLux(800), 'low'); assert.equal(lightFromLux(3000), 'medium'); assert.equal(lightFromLux(12000), 'bright'); assert.equal(lightFromLux(40000), 'direct');
  const r = spotLight({ window: 'none', lux: 8000 });
  assert.equal(r.level, 'bright'); assert.ok(r.measured);
});

test('相性：直射日光を避けたい植物を南の窓辺（カーテンなし）に置くと注意', () => {
  const f = fit(get('maranta-leuconeura'), { window: 'S', distance: 'window', sheer: false });
  assert.equal(f.light, 'bright');
});
test('相性：朝日ならよい植物は東の窓辺で問題なし、西日では注意', () => {
  const e = get('chamaedorea-elegans');
  assert.notEqual(fit(e, { window: 'E', distance: 'window', sheer: false }).light, 'bright');
  assert.equal(fit(e, { window: 'W', distance: 'window', sheer: false }).light, 'bright');
});
test('相性：暗い場所と寒い部屋', () => {
  const e = get('beaucarnea-recurvata');
  assert.equal(fit(e, { window: 'N', distance: 'far' }).light, 'dark');
  assert.equal(fit(e, { window: 'S', distance: 'window', winterMinC: 3 }).temp, 'cold');
  assert.equal(fit(get('aspidistra-elatior'), { window: 'N', distance: 'far', winterMinC: 3 }).temp, 'slow');
});

test('冬の判定：寒い月でも、部屋が適温なら生育期', () => {
  const e = get('monstera-deliciosa');
  const jan = new Date(2027, 0, 10), jul = new Date(2027, 6, 10);
  assert.equal(isWinterFor(e, null, jan), true);
  assert.equal(isWinterFor(e, null, jul), false);
  assert.equal(isWinterFor(e, { winterMinC: 20 }, jan), false);
  assert.equal(isWinterFor(e, { winterMinC: 8 }, jan), true);
});

test('土を確かめる日：最後の水やりから数え、冬は間隔を延ばす', () => {
  const e = get('monstera-deliciosa'); // 生育期 topdry=5日、冬 halfdry=7×1.5≒11日
  const ev = [{ type: 'water', date: '2027-07-01' }, { type: 'fertilize', date: '2027-07-04' }];
  const r = nextCheck(e, null, ev, new Date(2027, 6, 8));
  assert.equal(r.style, 'topdry'); assert.equal(r.due, '2027-07-06'); assert.equal(r.overdueDays, 2);
  const w = nextCheck(e, null, [{ type: 'water', date: '2027-01-01' }], new Date(2027, 0, 5));
  assert.equal(w.style, 'halfdry'); assert.equal(w.days, 11); assert.equal(w.due, '2027-01-12'); assert.equal(w.overdueDays, -7);
  assert.equal(nextCheck(e, null, [], new Date()).due, null);
});
test('「土を確認」の記録からも数え直す', () => {
  const e = get('monstera-deliciosa');
  const r = nextCheck(e, null, [{ type: 'water', date: '2027-07-01' }, { type: 'check', date: '2027-07-06' }], new Date(2027, 6, 8));
  assert.equal(r.due, '2027-07-11');
});

test('検索：ひらがな・カタカナ・旧学名・英名・品種', () => {
  assert.equal(normalizeKana('もんすてら'), normalizeKana('モンステラ'));
  const ids = (q, f) => search(CATALOG, q, f).map((e) => e.id);
  assert.ok(ids('もんすてら').includes('monstera-deliciosa'));
  assert.ok(ids('Sansevieria').includes('dracaena-trifasciata'));
  assert.ok(ids('calathea').includes('goeppertia-ornata'));
  assert.ok(ids('pothos').includes('epipremnum-aureum'));
  assert.ok(ids('幸福の木').includes('dracaena-fragrans-massangeana'));
  assert.ok(ids('かぽっく').includes('heptapleurum-arboricola'));
  assert.ok(!ids('', { rank: 'base' }).some((id) => byRank(id) === 'cultivar'));
});
const byRank = (id) => CATALOG.find((e) => e.id === id).rank;

test('絞り込み：暗い場所・ペット', () => {
  for (const e of search(CATALOG, '', { lowLight: true })) assert.equal(e.care.light.min, 'low');
  for (const e of search(CATALOG, '', { noPetListing: true })) { assert.equal(e.toxicity.cats, 'not-listed'); assert.equal(e.toxicity.dogs, 'not-listed'); }
});

test('置き場所に合う植物の提案は、明るさが合い寒すぎないものだけ', () => {
  const spot = { window: 'N', distance: 'mid', winterMinC: 8 };
  const r = recommend(CATALOG, spot, 50);
  assert.ok(r.length > 0);
  for (const { e, f } of r) { assert.equal(f.light, 'good', e.id); assert.notEqual(f.temp, 'cold', e.id); }
});
