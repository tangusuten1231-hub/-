// 図鑑データの正確さのテスト：スキーマ・出典の原文・換算・学名・矛盾のチェック
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateTaxon } from '../js/schema.js';
import { checkEvidence, buildEntry } from '../js/derive.js';
import { loadAll, build } from '../tools/build-catalog.mjs';

const { taxa, byId, sources } = await loadAll();
const list = Object.values(taxa);
const base = list.filter((t) => t.rank !== 'cultivar');

test('すべての植物データがスキーマに合う', () => {
  const errs = list.flatMap((t) => validateTaxon(t).map((m) => `${t.id}: ${m}`));
  assert.deepEqual(errs, []);
});

test('ファイル名と id が一致し、id は重複しない', async () => {
  for (const [file, t] of Object.entries(taxa)) assert.equal(file, t.id);
  assert.equal(new Set(list.map((t) => t.id)).size, list.length);
});

test('出典の原文がすべて出典スナップショットにあり、°F→℃ の換算が合う', () => {
  const errs = list.flatMap((t) => checkEvidence(t, byId, sources.ncsu));
  assert.deepEqual(errs, []);
});

test('品種の親が存在し、種か属である', () => {
  for (const t of list.filter((x) => x.rank === 'cultivar')) {
    const p = byId.get(t.parent);
    assert.ok(p, `${t.id} の親 ${t.parent} がない`);
    assert.notEqual(p.rank, 'cultivar');
    assert.ok(t.id.startsWith(`${t.parent}-`), `${t.id} は親の id で始める`);
  }
});

test('出典スナップショットの学名と一致する', () => {
  for (const t of base) {
    const snap = sources.ncsu[t.refs.ncsu];
    assert.ok(snap, `${t.id}: NC State のスナップショットがない`);
    assert.equal(snap.scientificName, t.scientificName, `${t.id}: 学名が出典と違う`);
  }
});

test('GBIF で学名が見つかり、受理名でなければ注記がある', () => {
  for (const t of base) {
    const g = sources.gbif[t.id];
    assert.ok(g && g.matchType === 'EXACT', `${t.id}: GBIF で完全一致しない`);
    assert.ok(g.family, `${t.id}: 科がない`);
    if (g.status !== 'ACCEPTED') assert.ok(t.note?.includes(g.acceptedName), `${t.id}: GBIF の正式名 ${g.acceptedName} を note で説明する`);
  }
});

test('最低温度が出典の耐寒性ゾーンより寒さに強い値になっていない', async () => {
  const { CATALOG } = await import('../js/catalog.data.js');
  for (const e of CATALOG) {
    if (e.facts?.hardinessMinC == null) continue;
    assert.ok(e.care.temperature.minC >= Math.floor(e.facts.hardinessMinC) - 0.5,
      `${e.id}: 最低温度 ${e.care.temperature.minC}℃ が耐寒ゾーンの ${e.facts.hardinessMinC}℃ より低い`);
  }
});

test('明るさ・水やりの値が出典の性質と矛盾しない', () => {
  for (const t of base) {
    const a = sources.ncsu[t.refs.ncsu].attributes;
    const light = (a.Light ?? []).join(' ');
    // 出典に「日向（Full sun）」がないのに、直射日光が最適としない
    if (t.care.light.best === 'direct') assert.match(light, /Full sun/, `${t.id}: 出典に Full sun がない`);
    // 出典の土の条件が「乾き気味」なのに「乾かしすぎない」としない
    const drain = (a['Soil Drainage'] ?? []).join(' ');
    if (/Very Dry/.test(drain) && !/Moist/.test(drain)) assert.notEqual(t.care.watering.growing, 'moist', `${t.id}`);
  }
});

test('別名が複数の植物で重複しない（検索で取り違えないため）', () => {
  const seen = new Map();
  for (const t of list) for (const n of [t.names.ja, ...(t.names.aliases ?? [])]) {
    assert.ok(!seen.has(n) || seen.get(n) === t.id, `「${n}」が ${seen.get(n)} と ${t.id} で重複`);
    seen.set(n, t.id);
  }
});

test('生成済みの js/catalog.data.js が最新', async () => {
  assert.equal(await readFile('js/catalog.data.js', 'utf8'), await build(), 'node tools/build-catalog.mjs を実行してください');
});

test('品種は親の育て方と根拠を引き継ぎ、上書きした項目だけ自分の根拠になる', () => {
  const e = buildEntry('monstera-deliciosa-thai-constellation', byId, sources);
  assert.equal(e.scientificName, "Monstera deliciosa 'Thai Constellation'");
  assert.equal(e.care.light.min, 'bright');
  assert.equal(e.care.temperature.minC, byId.get('monstera-deliciosa').care.temperature.minC);
  assert.equal(e.inherited['temperature.minC'], 'monstera-deliciosa');
  assert.equal(e.inherited['light.min'], undefined);
  assert.equal(e.family, 'Araceae');
  assert.equal(e.toxicity.cats, 'listed');
});

test('毒性：出典に記載がなければ「記載なし」で、安全とはしない', () => {
  const e = buildEntry('chlorophytum-comosum', byId, sources);
  assert.equal(e.toxicity.cats, 'not-listed');
  const d = buildEntry('dieffenbachia-seguine', byId, sources);
  assert.equal(d.toxicity.cats, 'listed');
  assert.equal(d.toxicity.severity, 'High');
});

test('図鑑の全件に画面で使う項目がそろっている', async () => {
  const { CATALOG } = await import('../js/catalog.data.js');
  for (const e of CATALOG) {
    assert.ok(Array.isArray(e.tips) && Array.isArray(e.parentTips), `${e.id}: tips`);
    assert.ok(Array.isArray(e.names.aliases), `${e.id}: aliases`);
    assert.ok(e.toxicity && e.facts && e.ncsu && e.taxonomy && e.family, `${e.id}: 出典由来の項目`);
  }
});
