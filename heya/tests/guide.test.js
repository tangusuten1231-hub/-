import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from '../js/catalog.data.js';
import { guideLines } from '../js/guide.js';
import { checkBackup, SCHEMA_VERSION } from '../js/db.js';
import { fit } from '../js/care.js';

const e = CATALOG.find((x) => x.id === 'monstera-deliciosa');

test('はじめては置き場所の登録をすすめる', () => {
  const l = guideLines({ plants: [], today: new Date(2027, 4, 1), pets: {}, tipPool: [] });
  assert.match(l[0].text, /置き場所/);
});
test('土を確かめる日・寒さ・ペットの注意を言う', () => {
  const spot = { window: 'S', distance: 'window', sheer: true, winterMinC: 3 };
  const p = { plant: { nickname: 'もんちゃん' }, entry: e, spot, fit: fit(e, spot), check: { due: '2027-01-01', overdueDays: 2 } };
  const l = guideLines({ plants: [p], today: new Date(2027, 0, 3), pets: { cats: true }, tipPool: [] }).map((x) => x.text).join('\n');
  assert.match(l, /室温が低すぎる/); assert.match(l, /土を確かめる日/); assert.match(l, /猫/);
});
test('豆知識は出典つきの tips から選ぶ', () => {
  const tipPool = e.tips.map((tip) => ({ entry: e, tip }));
  const l = guideLines({ plants: [], today: new Date(2027, 4, 1), pets: {}, tipPool });
  const t = l.find((x) => x.text.includes('豆知識'));
  assert.ok(t && e.tips.some((x) => t.text.includes(x.ja)));
  assert.match(t.cite.url, /plants\.ces\.ncsu\.edu|hgic\.clemson\.edu/);
});

test('バックアップの形の確認', () => {
  assert.equal(checkBackup({ app: 'heyamidori', schemaVersion: SCHEMA_VERSION, spots: [], plants: [{ id: 'a' }], events: [], meta: [] }), null);
  assert.ok(checkBackup({ app: 'other' }));
  assert.ok(checkBackup({ app: 'heyamidori', schemaVersion: SCHEMA_VERSION + 1, spots: [], plants: [], events: [], meta: [] }));
  assert.ok(checkBackup({ app: 'heyamidori', schemaVersion: 1, spots: [{}], plants: [], events: [], meta: [] }));
});
