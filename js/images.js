// 植物の写真を Wikipedia / Wikimedia Commons から取得（APIキー不要）。取得できない場合はイラストで代替。
const API = 'https://en.wikipedia.org/w/api.php';
const KEY = 'pg:img:v1';

let cache = {};
try { cache = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { cache = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* 容量超過などは無視 */ } };

const pending = new Map();

async function query(titles) {
  const params = new URLSearchParams({
    action: 'query', prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '480',
    titles: titles.join('|'), redirects: '1', format: 'json', origin: '*',
  });
  const res = await fetch(`${API}?${params}`);
  if (!res.ok) throw new Error('image api');
  const j = await res.json();
  const map = new Map(titles.map((t) => [t, t]));
  for (const n of j.query?.normalized || []) for (const [k, v] of map) if (v === n.from) map.set(k, n.to);
  for (const r of j.query?.redirects || []) for (const [k, v] of map) if (v === r.from) map.set(k, r.to);
  const byTitle = new Map(Object.values(j.query?.pages || {}).map((p) => [p.title, p]));
  const out = {};
  for (const [orig, final] of map) {
    const page = byTitle.get(final);
    out[orig] = page?.thumbnail?.source ? { src: page.thumbnail.source, page: final } : null;
  }
  return out;
}

/** 植物リストの写真URLを取得（キャッシュ済みは即時）。戻り値: id → {src, page} | null */
export async function loadImages(plants) {
  const need = plants.filter((p) => !(p.id in cache) && !pending.has(p.id));
  if (need.length) {
    const job = (async () => {
      try {
        for (let i = 0; i < need.length; i += 40) {
          const chunk = need.slice(i, i + 40);
          const r = await query(chunk.map((p) => p.wiki));
          const missing = chunk.filter((p) => !r[p.wiki]);
          let r2 = {};
          if (missing.length) {
            const genus = [...new Set(missing.map((p) => p.latin.split(/[\s']/)[0]))];
            r2 = await query(genus);
          }
          for (const p of chunk) cache[p.id] = r[p.wiki] || r2[p.latin.split(/[\s']/)[0]] || null;
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
