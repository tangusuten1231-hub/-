// NC State Extension Gardener Plant Toolbox（CC BY 4.0）のページから
// 植物の属性を取り出して data/sources/ncsu/<slug>.json に保存する。
// 使い方: node tools/fetch-ncsu.mjs monstera-deliciosa epipremnum-aureum ...
//         引数なしなら data/taxa の sources.ncsu に書かれた slug をすべて取得する。
import { writeFile, readdir, readFile } from 'node:fs/promises';

const BASE = 'https://plants.ces.ncsu.edu/plants/';

const decode = (s) => s
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  .replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ').trim();

/** ページ HTML から属性を取り出す（テストからも使う） */
export function parseNcsu(html) {
  const h1 = html.match(/<h1>([\s\S]*?)<small>/);
  const scientificName = h1 ? decode(h1[1]) : null;
  const commonNames = [...(html.match(/<ul[^>]*id="common_names"[^>]*>([\s\S]*?)<\/ul>/)?.[1] ?? '')
    .matchAll(/<a[^>]*>([^<]*)<\/a>/g)].map((m) => decode(m[1]));
  const desc = html.match(/<dt>Description<\/dt>\s*<dd>([\s\S]*?)<\/dd>/);
  const description = desc ? decode(desc[1].replace(/<\/p>/g, '\n')) : null;
  const start = html.indexOf('Attributes:');
  const attributes = {};
  if (start >= 0) {
    const body = html.slice(start);
    const re = /<dt>([^<]*?):?<\/dt>([\s\S]*?)(?=<dt>|<\/dl>)/g;
    for (const m of body.matchAll(re)) {
      const key = decode(m[1]).replace(/:$/, '');
      const values = [...m[2].matchAll(/<dd>([\s\S]*?)<\/dd>/g)].map((d) => decode(d[1])).filter(Boolean);
      if (values.length) attributes[key] = [...new Set([...(attributes[key] ?? []), ...values])];
    }
  }
  const cv = html.match(/<dt>Cultivars \/ Varieties:<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/);
  const cultivars = cv ? [...cv[1].matchAll(/<li[^>]*detail_cultivar[^>]*>([\s\S]*?)<\/li>/g)].map((m) => {
    const [name, note = ''] = m[1].split(/<br\s*\/?>/);
    return { name: decode(name).replace(/^'|'$/g, ''), note: decode(note) };
  }) : [];
  const tags = [...new Set([...html.matchAll(/>#([a-z0-9 -]+)</g)].map((m) => m[1].trim()))];
  return { scientificName, commonNames, description, cultivars, attributes, tags };
}

async function fetchOne(slug) {
  const res = await fetch(BASE + slug + '/', { redirect: 'follow' });
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  const html = await res.text();
  const parsed = parseNcsu(html);
  const finalSlug = new URL(res.url).pathname.split('/').filter(Boolean).pop();
  const out = {
    source: 'NC State Extension Gardener Plant Toolbox',
    license: 'CC BY 4.0',
    url: res.url,
    slug: finalSlug,
    retrieved: new Date().toISOString().slice(0, 10),
    ...parsed,
  };
  await writeFile(`data/sources/ncsu/${slug}.json`, JSON.stringify(out, null, 1) + '\n');
  return out;
}

async function slugsFromTaxa() {
  const out = new Set();
  for (const f of await readdir('data/taxa')) {
    if (!f.endsWith('.json')) continue;
    const t = JSON.parse(await readFile(`data/taxa/${f}`, 'utf8'));
    if (t.refs?.ncsu) out.add(t.refs.ncsu);
  }
  return [...out];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const slugs = process.argv.length > 2 ? process.argv.slice(2) : await slugsFromTaxa();
  for (const s of slugs) {
    try {
      const r = await fetchOne(s);
      console.log(`ok ${s} → ${r.scientificName} (${Object.keys(r.attributes).length} attrs)`);
    } catch (e) { console.error('NG', e.message); process.exitCode = 1; }
    await new Promise((r) => setTimeout(r, 400));
  }
}
