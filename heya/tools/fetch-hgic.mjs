// Clemson Cooperative Extension Home & Garden Information Center（HGIC）の室内植物のファクトシートから、
// 育て方（光・温度・水・湿度・肥料・植え替え・症状）に関わる段落だけを抜き出して
// data/sources/hgic/<slug>.json に保存する。全文は保存せず、引用の照合に必要な段落だけを残す。
// 使い方: node tools/fetch-hgic.mjs [slug ...]   （引数なしなら data/taxa の refs.hgic をすべて）
import { writeFile, readdir, readFile } from 'node:fs/promises';

const BASE = 'https://hgic.clemson.edu/factsheet/';
const KEY = /°|degree|temperat|cold|frost|draft|light|sun|shade|window|water|moist|dry|humid|mist|fertiliz|repot|transplant|root rot|rot\b|yellow|brown|drop|wilt|curl|scorch|spider mite|mealybug|scale|leggy|stretch|bloom|flower|dorman|rest|winter|summer|fall|spring|toxic|poison|pet/i;

const decode = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  .replace(/&#8217;|&#8216;|&rsquo;|&lsquo;|&#039;|&#39;/g, "'").replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"').replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, '-')
  .replace(/&deg;|&#176;/g, '°').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, ' ').trim();

/** ページの本文から、育て方に関わる文を抜き出す（テストからも使う） */
export function extractHgic(html) {
  const title = decode((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) ?? [])[1] ?? '');
  const id = (html.match(/HGIC\s*(\d{4})/) ?? [])[1] ?? null;
  const body = (html.match(/<article[\s\S]*?<\/article>/) ?? [html])[0];
  const paras = [...body.matchAll(/<(p|li|h2|h3)[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => decode(m[2])).filter(Boolean);
  const paragraphs = [];
  let heading = '';
  for (const p of paras) {
    if (p.length < 60 && !/[.!?]$/.test(p)) { heading = p; continue; }
    if (KEY.test(p) && p.length >= 20) paragraphs.push(heading ? { heading, text: p } : { text: p });
  }
  return { title, hgic: id, paragraphs };
}

async function slugsFromTaxa() {
  const out = new Set();
  for (const f of await readdir('data/taxa')) if (f.endsWith('.json')) { const t = JSON.parse(await readFile(`data/taxa/${f}`, 'utf8')); if (t.refs?.hgic) out.add(t.refs.hgic); }
  return [...out];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const slugs = process.argv.length > 2 ? process.argv.slice(2) : await slugsFromTaxa();
  for (const slug of slugs) {
    const res = await fetch(`${BASE}${slug}/`);
    if (!res.ok) { console.error(`NG ${slug}: HTTP ${res.status}`); process.exitCode = 1; continue; }
    const r = extractHgic(await res.text());
    await writeFile(`data/sources/hgic/${slug}.json`, JSON.stringify({
      source: 'Clemson Cooperative Extension, Home & Garden Information Center', url: res.url, slug,
      retrieved: new Date().toISOString().slice(0, 10), note: '育て方に関わる段落だけの抜粋（引用の照合用）', ...r,
    }, null, 1) + '\n');
    console.log(`ok ${slug}: ${r.title} (HGIC ${r.hgic ?? '-'}, ${r.paragraphs.length}段落)`);
    await new Promise((x) => setTimeout(x, 300));
  }
}
