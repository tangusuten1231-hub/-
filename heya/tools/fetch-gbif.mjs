// GBIF Backbone Taxonomy（CC BY 4.0）で学名を照合し、
// 受理名・科・シノニム（旧学名）を data/sources/gbif/<id>.json に保存する。
// 使い方: node tools/fetch-gbif.mjs   （data/taxa の species / genus をすべて照合）
import { writeFile, readdir, readFile } from 'node:fs/promises';

const API = 'https://api.gbif.org/v1/species';
const get = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(`HTTP ${r.status} ${u}`); return r.json(); };

async function lookup(name, rank) {
  const m = await get(`${API}/match?strict=true&rank=${rank.toUpperCase()}&kingdom=Plantae&name=${encodeURIComponent(name)}`);
  if (!m.usageKey) return { query: name, matchType: 'NONE' };
  const acceptedKey = m.acceptedUsageKey ?? m.usageKey;
  const acc = await get(`${API}/${acceptedKey}`);
  const syn = await get(`${API}/${acceptedKey}/synonyms?limit=100`);
  return {
    query: name,
    matchType: m.matchType,
    status: m.status,
    usageKey: m.usageKey,
    acceptedKey,
    acceptedName: acc.canonicalName,
    authorship: acc.authorship || '',
    rank: acc.rank,
    family: acc.family,
    genus: acc.genus,
    synonyms: [...new Set(syn.results.filter((s) => s.rank === acc.rank).map((s) => s.canonicalName))].sort(),
  };
}

const all = [];
for (const f of await readdir('data/taxa')) if (f.endsWith('.json')) all.push(JSON.parse(await readFile(`data/taxa/${f}`, 'utf8')));
for (const t of all) {
  if (!['species', 'genus'].includes(t.rank)) continue;
  if (process.argv.length > 2 && !process.argv.slice(2).includes(t.id)) continue;
  try {
    const rank = / var\. /.test(t.scientificName) ? 'variety' : t.rank;
    const r = await lookup(t.scientificName.replace(/ x /, ' × '), rank);
    await writeFile(`data/sources/gbif/${t.id}.json`, JSON.stringify({
      source: 'GBIF Backbone Taxonomy', license: 'CC BY 4.0',
      url: r.acceptedKey ? `https://www.gbif.org/species/${r.acceptedKey}` : null,
      retrieved: new Date().toISOString().slice(0, 10), ...r,
    }, null, 1) + '\n');
    console.log(`${t.id}: ${r.matchType} ${r.status ?? ''} → ${r.acceptedName ?? '-'} [${r.family ?? ''}]`);
  } catch (e) { console.error('NG', t.id, e.message); process.exitCode = 1; }
}
