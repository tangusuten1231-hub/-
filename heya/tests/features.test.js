import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from '../js/catalog.data.js';
import { choose, diagnose, seasonalTips, wateringInterval } from '../js/care.js';
import { guideSvg, moodFor } from '../js/guide.js';

const get = (id) => CATALOG.find((e) => e.id === id);

test('植物選び：ペットに害の記載がある植物・暗すぎる・寒すぎる植物は出さない', () => {
  const r = choose(CATALOG, { spot: { window: 'N', distance: 'mid', winterMinC: 7 }, pets: { cats: true }, effort: 'normal' }, 200);
  assert.ok(r.length > 0);
  for (const { e, f } of r) {
    assert.notEqual(e.toxicity.cats, 'listed', e.id);
    assert.ok(!['dark', 'bright'].includes(f.light), e.id);
    assert.notEqual(f.temp, 'cold', e.id);
  }
});
test('植物選び：水やりが少なくてすむ植物を上位に', () => {
  const r = choose(CATALOG, { spot: { window: 'S', distance: 'window', sheer: true, winterMinC: 12 }, effort: 'rare' }, 5);
  for (const { e } of r) assert.ok(['halfdry', 'dry', 'soak'].includes(e.care.watering.growing), e.id);
});
test('植物選び：種類で絞り込める', () => {
  const r = choose(CATALOG, { spot: { window: 'S', distance: 'near' }, groups: ['fern'] }, 50);
  assert.ok(r.length > 0 && r.every(({ e }) => e.group === 'fern'));
});

test('水やりの平均間隔', () => {
  assert.equal(wateringInterval([{ type: 'water', date: '2027-01-01' }]), null);
  assert.equal(wateringInterval([{ type: 'water', date: '2027-01-01' }, { type: 'water', date: '2027-01-05' }, { type: 'water', date: '2027-01-09' }, { type: 'check', date: '2027-01-03' }]), 4);
});
test('困ったとき：出典の記載と、記録・置き場所からの判定を返す', () => {
  const e = get('goeppertia-orbifolia');
  const r = diagnose(e, 'brown', { spot: { window: 'S', distance: 'window', sheer: false, winterMinC: 8 },
    events: [{ type: 'water', date: '2027-07-01' }, { type: 'water', date: '2027-07-02' }, { type: 'water', date: '2027-07-03' }], today: new Date(2027, 6, 4) });
  assert.ok(r.tips.length > 0 && r.tips.every((t) => t.symptom === 'brown'));
  const text = r.checks.map((c) => c.text).join('\n');
  assert.match(text, /水のやりすぎ/); assert.match(text, /直射日光/); assert.match(text, /最低温度/); assert.match(text, /湿度/);
});
test('困ったとき：記録がなければ記録をすすめる', () => {
  const r = diagnose(get('epipremnum-aureum'), 'yellow', {});
  assert.ok(r.checks.some((c) => /記録/.test(c.text)));
  assert.ok(r.checks.some((c) => /置き場所を設定/.test(c.text)));
});
test('季節のお世話：出典の季節の記載を月に合わせて拾う', () => {
  const e = get('phalaenopsis');
  assert.ok(seasonalTips(e, 10).some((t) => /autumn/.test(t.quote)));
  assert.ok(!seasonalTips(e, 7).some((t) => /autumn/.test(t.quote)));
});
test('症状タグは全植物で既知の値', () => {
  for (const e of CATALOG) for (const t of e.tips) if (t.symptom) assert.ok(['yellow', 'brown', 'drop', 'curl', 'scorch', 'fade', 'leggy', 'spots', 'rot', 'pests', 'noflower'].includes(t.symptom), e.id);
});
test('写真：図鑑の写真はライセンスが改変・再配布可のものだけ', () => {
  for (const e of CATALOG) if (e.image) assert.match(e.image.license, /^(CC[ -]BY(-SA)? [\d.]+|CC0( [\d.]+)?|Public Domain Mark [\d.]+)$/, e.id);
  assert.ok(CATALOG.filter((e) => e.image).length >= 90);
});
test('ヤモの表情', () => {
  for (const m of ['normal', 'happy', 'worried', 'sleepy']) assert.match(guideSvg(m), /<svg[\s\S]*<\/svg>/);
  assert.equal(moodFor([{ level: 'warn' }]), 'worried');
  assert.equal(moodFor([{ level: 'good' }], new Date(2027, 0, 1, 12)), 'happy');
});
test('図鑑が参照する写真ファイルがすべてある', async () => {
  const { existsSync } = await import('node:fs');
  for (const e of CATALOG) if (e.image) assert.ok(existsSync(e.image.src), e.image.src);
});
