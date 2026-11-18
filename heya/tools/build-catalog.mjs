// data/taxa と data/sources から js/catalog.data.js を作る。
// 使い方: node tools/build-catalog.mjs        （生成）
//         node tools/build-catalog.mjs --check （生成物が最新か確認するだけ）
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { validateTaxon } from '../js/schema.js';
import { buildEntry, checkEvidence } from '../js/derive.js';

const readJsonDir = async (dir) => {
  const out = {};
  for (const f of (await readdir(dir)).sort()) if (f.endsWith('.json')) out[f.slice(0, -5)] = JSON.parse(await readFile(`${dir}/${f}`, 'utf8'));
  return out;
};

export async function loadAll() {
  const taxa = await readJsonDir('data/taxa');
  const sources = { ncsu: await readJsonDir('data/sources/ncsu'), gbif: await readJsonDir('data/sources/gbif'), images: await readJsonDir('data/sources/images'), hgic: await readJsonDir('data/sources/hgic') };
  return { taxa, byId: new Map(Object.values(taxa).map((t) => [t.id, t])), sources };
}

export async function build() {
  const { taxa, byId, sources } = await loadAll();
  const errors = [];
  for (const [file, t] of Object.entries(taxa)) {
    if (file !== t.id) errors.push(`${file}.json: ファイル名と id が違う`);
    errors.push(...validateTaxon(t).map((m) => `${t.id}: ${m}`));
    errors.push(...checkEvidence(t, byId, sources));
  }
  if (errors.length) throw new Error('データに問題があります:\n' + errors.join('\n'));
  const entries = [...byId.keys()].sort().map((id) => buildEntry(id, byId, sources));
  return '// 自動生成ファイル（編集しない）: node tools/build-catalog.mjs\n'
    + '// 出典: NC State Extension Gardener Plant Toolbox (CC BY 4.0) / Clemson Extension HGIC（引用） / GBIF Backbone Taxonomy (CC BY 4.0)\n'
    + `export const CATALOG = ${JSON.stringify(entries)};\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const js = await build();
    if (process.argv.includes('--check')) {
      const cur = await readFile('js/catalog.data.js', 'utf8').catch(() => '');
      if (cur !== js) { console.error('js/catalog.data.js が古い。node tools/build-catalog.mjs を実行してください'); process.exit(1); }
      console.log('ok: 最新');
    } else {
      await writeFile('js/catalog.data.js', js);
      console.log(`ok: js/catalog.data.js (${(js.length / 1024).toFixed(0)} KB)`);
    }
  } catch (e) { console.error(e.message); process.exit(1); }
}
