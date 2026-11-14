// 植物の写真を Wikimedia Commons / Wikipedia から取得（APIキー不要）。
// 品種は Commons で「属名＋品種名」の写真を探し、なければ種の Wikipedia 記事の写真を使う。
// どちらもなければイラストで代替。
const WP = 'https://en.wikipedia.org/w/api.php';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const KEY = 'pg:img:v2';

let cache = {};
try { cache = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { cache = {}; }
let saveTimer = null;
const save = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* 容量超過などは無視 */ } }, 500);
};

const pending = new Map();

async function wikiThumbs(titles) {
  const params = new URLSearchParams({
    action: 'query', prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '480',
    titles: titles.join('|'), redirects: '1', format: 'json', origin: '*',
  });
  const res = await fetch(`${WP}?${params}`);
  if (!res.ok) throw new Error('image api');
  const j = await res.json();
  const map = new Map(titles.map((t) => [t, t]));
  for (const n of j.query?.normalized || []) for (const [k, v] of map) if (v === n.from) map.set(k, n.to);
  for (const r of j.query?.redirects || []) for (const [k, v] of map) if (v === r.from) map.set(k, r.to);
  const byTitle = new Map(Object.values(j.query?.pages || {}).map((p) => [p.title, p]));
  const out = {};
  for (const [orig, final] of map) {
    const page = byTitle.get(final);
    out[orig] = page?.thumbnail?.source
      ? { src: page.thumbnail.source, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(final)}`, site: 'Wikipedia' }
      : null;
  }
  return out;
}

const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Commons でファイル名に「属名」と「品種名」を含む写真を探す */
async function commonsCultivar(p) {
  const genus = p.latin.split(/[\s']/)[0].replace(/^×/, '');
  const params = new URLSearchParams({
    action: 'query', generator: 'search', gsrnamespace: '6', gsrlimit: '6',
    gsrsearch: `intitle:"${genus}" intitle:"${p.en}" filetype:bitmap`,
    prop: 'imageinfo', iiprop: 'url', iiurlwidth: '480', format: 'json', origin: '*',
  });
  const res = await fetch(`${COMMONS}?${params}`);
  if (!res.ok) return null;
  const j = await res.json();
  const pages = Object.values(j.query?.pages || {}).sort((a, b) => a.index - b.index);
  const want = norm(p.en);
  const hit = pages.find((pg) => norm(pg.title).includes(want) && pg.imageinfo?.[0]?.thumburl);
  return hit ? { src: hit.imageinfo[0].thumburl, url: hit.imageinfo[0].descriptionurl, site: 'Wikimedia Commons', cv: true } : null;
}

const isCultivar = (p) => p.cv && p.en && /^[A-Z]/.test(p.en) && !/hybrids|Single|Double|Red|Edo|Higo|Ise/.test(p.en);

async function limit(tasks, n) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < tasks.length) { const k = i++; out[k] = await tasks[k](); }
  }));
  return out;
}

/** 写真を取得（キャッシュ済みは即時）。戻り値: id → {src, url, site, cv?} | null */
export async function loadImages(plants) {
  const need = plants.filter((p) => !(p.id in cache) && !pending.has(p.id));
  if (need.length) {
    const job = (async () => {
      try {
        // 1) 品種の写真を Commons で探す
        const cvs = need.filter(isCultivar);
        const found = await limit(cvs.map((p) => () => commonsCultivar(p).catch(() => null)), 4);
        cvs.forEach((p, k) => { if (found[k]) cache[p.id] = found[k]; });
        // 2) 残りは種の Wikipedia 記事の写真
        const rest = need.filter((p) => !cache[p.id]);
        for (let i = 0; i < rest.length; i += 40) {
          const chunk = rest.slice(i, i + 40);
          const titles = [...new Set(chunk.map((p) => p.wiki))];
          const r = await wikiThumbs(titles);
          const missing = chunk.filter((p) => !r[p.wiki]);
          let r2 = {};
          const genusOf = (p) => p.latin.split(/[\s']/)[0];
          if (missing.length) r2 = await wikiThumbs([...new Set(missing.map(genusOf))]);
          for (const p of chunk) {
            const hit = r[p.wiki] || r2[genusOf(p)] || null;
            cache[p.id] = hit && isCultivar(p) ? { ...hit, speciesOnly: true } : hit;
          }
        }
        save();
      } catch {
        // オフラインなど：今回は諦め、次回また試す
      }
    })();
    need.forEach((p) => pending.set(p.id, job));
    await job;
    need.forEach((p) => pending.delete(p.id));
  }
  return Object.fromEntries(plants.map((p) => [p.id, cache[p.id] ?? null]));
}

export const imageOf = (id) => cache[id] ?? null;
