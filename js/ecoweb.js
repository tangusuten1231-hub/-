// 生態系図（食べる・食べられるのつながり）。庭に来そうな生き物から組み立てる。
// 段：0=植物がつくるもの（蜜・葉・実・種・樹液・落ち葉）、1=植物を食べる生き物、2=虫を食べる生き物、3=鳥・コウモリ
import { INFO, ECO_NODES } from './critterinfo.js';
import { relation, CREATURES } from './wildlife.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const RES = ['nectar', 'leaf', 'fruit', 'seed', 'sap', 'litter'];
const MAX = [6, 5, 6, 6];

function tierOf(c) {
  if (c.kind === 'bird' || c.id === 'koumori') return 3;
  const eats = INFO[c.id]?.eats || [];
  return eats.every((e) => RES.includes(e)) ? 1 : 2;
}

/**
 * 生態系図のデータ
 * @param critters creaturesForGarden の結果（level 2 以上を使う）
 * @param plants 庭の植物
 * @param features 庭の環境
 */
export function foodWeb(critters, plants = [], features = {}) {
  const chosen = critters.filter((x) => x.level >= 2).map((x) => x.creature);
  const nodes = new Map();
  const add = (id, ja, tier, kind = 'res') => { if (!nodes.has(id)) nodes.set(id, { id, ja, tier, kind }); return nodes.get(id); };
  // 生き物（段ごとに上限まで、来そうな順）
  const perTier = [0, 0, 0, 0];
  const perKind = {};
  for (const c of chosen) {
    if (!INFO[c.id]) continue;
    const t = tierOf(c);
    const k = `${t}:${c.kind}`;
    if (perTier[t] >= MAX[t] || (perKind[k] || 0) >= 2) continue;
    perTier[t]++;
    perKind[k] = (perKind[k] || 0) + 1;
    add(c.id, c.ja, t, c.kind);
  }
  // イモムシ（幼虫の食草がある）・アブラムシ・小さな虫
  const hosts = CREATURES.filter((c) => (c.kind === 'butterfly' || c.kind === 'moth') && plants.some((p) => relation(c, p) === 'host'));
  const edges = [];
  const link = (from, to, type) => { if (nodes.has(from) && nodes.has(to) && from !== to && !edges.some((e) => e.from === from && e.to === to)) edges.push({ from, to, type }); };
  const used = new Set();
  for (const n of nodes.values()) for (const e of INFO[n.id]?.eats || []) used.add(e);
  if (hosts.length || used.has('caterpillar')) add('caterpillar', ECO_NODES.caterpillar.ja, 1, 'eco');
  if (used.has('aphid')) add('aphid', ECO_NODES.aphid.ja, 1, 'eco');
  if (used.has('smallbug')) add('smallbug', ECO_NODES.smallbug.ja, 1, 'eco');
  // 植物がつくるもの
  for (const r of RES) {
    const need = used.has(r) || (r === 'leaf' && (nodes.has('caterpillar') || nodes.has('aphid')));
    if (!need) continue;
    if (r === 'sap' && !features.tree) continue;
    if (r === 'fruit' && !plants.some((p) => p.uses?.includes('bird')) && !features.tree) continue;
    add(r, ECO_NODES[r].ja, 0);
  }
  // つながり
  for (const n of [...nodes.values()]) {
    for (const e of INFO[n.id]?.eats || []) {
      if (e.startsWith('k:')) {
        const kind = e.slice(2);
        [...nodes.values()].filter((m) => m.kind === kind).slice(0, 3).forEach((m) => link(m.id, n.id, 'eat'));
      } else link(e, n.id, RES.includes(e) ? 'plant' : 'eat');
    }
  }
  link('leaf', 'caterpillar', 'plant');
  link('leaf', 'aphid', 'plant');
  // 蝶 → イモムシ（親子）
  for (const n of nodes.values()) if (n.kind === 'butterfly' && hosts.some((h) => h.id === n.id)) link(n.id, 'caterpillar', 'life');
  // つながりのない資源を外す
  for (const n of [...nodes.values()]) if (n.tier === 0 && !edges.some((e) => e.from === n.id)) nodes.delete(n.id);
  return { nodes: [...nodes.values()], edges: edges.filter((e) => nodes.has(e.from) && nodes.has(e.to)) };
}

const TIER_JA = ['植物がつくるもの', '植物を食べる', '虫を食べる', '鳥・コウモリ'];
const KIND_FILL = { res: '#dfe8cf', eco: '#efe6d2', butterfly: '#f6e2c6', moth: '#ece2d4', bee: '#f4e8b8', beetle: '#f2d6cc', dragonfly: '#d6e6ee', hopper: '#e0ebd2', bird: '#e2dcef', other: '#e6e2d6' };
const EDGE = { plant: '#6f8f4e', eat: '#b5532f', life: '#c4831f' };

/** 生態系図のSVG */
export function foodWebSVG(web) {
  if (!web.nodes.length) return '<p class="hint">生き物が少ないため、生態系図を描けません。植物や水場を加えてみましょう。</p>';
  const maxRow = Math.max(...[0, 1, 2, 3].map((t) => web.nodes.filter((n) => n.tier === t).length));
  const W = Math.max(560, 70 + maxRow * 88), rowH = 92, top = 26;
  const H = top + rowH * 4 + 6;
  const pos = new Map();
  for (let t = 0; t < 4; t++) {
    const row = web.nodes.filter((n) => n.tier === t);
    const bw = Math.min(84, (W - 70) / Math.max(row.length, 1) - 8);
    row.forEach((n, i) => {
      const x = 70 + ((W - 70) / row.length) * (i + 0.5);
      const y = top + rowH * (3 - t) + rowH / 2;
      pos.set(n.id, { x, y, w: bw, h: 34 });
    });
  }
  const edges = web.edges.map((e) => {
    const a = pos.get(e.from), b = pos.get(e.to);
    if (!a || !b) return '';
    const up = b.y < a.y;
    const y1 = a.y + (up ? -a.h / 2 : a.h / 2), y2 = b.y + (up ? b.h / 2 : -b.h / 2);
    const my = (y1 + y2) / 2;
    const d = a.y === b.y
      ? `M${a.x} ${a.y - a.h / 2} Q${(a.x + b.x) / 2} ${a.y - 40} ${b.x} ${b.y - b.h / 2}`
      : `M${a.x.toFixed(1)} ${y1.toFixed(1)} C${a.x.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${y2.toFixed(1)}`;
    return `<path d="${d}" fill="none" stroke="${EDGE[e.type]}" stroke-width="1.4" stroke-opacity=".55" ${e.type === 'life' ? 'stroke-dasharray="3 3"' : ''} marker-end="url(#fw-${e.type})"/>`;
  }).join('');
  const nodes = web.nodes.map((n) => {
    const p = pos.get(n.id);
    const label = n.ja.replace(/（.*?）/g, '');
    const lines = label.length > 6 ? [label.slice(0, Math.ceil(label.length / 2)), label.slice(Math.ceil(label.length / 2), 14)] : [label];
    return `<g><title>${esc(n.ja)}</title><rect x="${(p.x - p.w / 2).toFixed(1)}" y="${p.y - p.h / 2}" width="${p.w.toFixed(1)}" height="${p.h}" rx="9" fill="${KIND_FILL[n.kind] || '#eee'}" stroke="#8c8471" stroke-width=".8"/>
      ${lines.map((l, i) => `<text x="${p.x.toFixed(1)}" y="${(p.y + 4 + (i - (lines.length - 1) / 2) * 12).toFixed(1)}" text-anchor="middle" font-size="10.5" fill="#2b2a22">${esc(l)}</text>`).join('')}</g>`;
  }).join('');
  const rows = TIER_JA.map((t, i) => `<text x="6" y="${top + rowH * (3 - i) + rowH / 2 + 4}" font-size="10" fill="#8a8370">${t.length > 5 ? `<tspan x="6" dy="-6">${t.slice(0, 5)}</tspan><tspan x="6" dy="12">${t.slice(5)}</tspan>` : t}</text><line x1="0" x2="${W}" y1="${top + rowH * (3 - i) + rowH}" y2="${top + rowH * (3 - i) + rowH}" stroke="#e3dccb" stroke-dasharray="2 4"/>`).join('');
  const marker = (k) => `<marker id="fw-${k}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="${EDGE[k]}" opacity=".7"/></marker>`;
  return `<svg class="foodweb" viewBox="0 0 ${W} ${H}" role="img" aria-label="庭の生態系図">
    <defs>${marker('plant')}${marker('eat')}${marker('life')}</defs>
    <rect width="${W}" height="${H}" fill="#fbf8f0"/>
    <text x="${W - 8}" y="16" text-anchor="end" font-size="10" fill="#8a8370">→ は「食べる」の向き</text>
    ${rows}${edges}${nodes}
  </svg>`;
}

/** 生態系図の説明（つながりの数など） */
export function foodWebSummary(web) {
  const eats = web.edges.filter((e) => e.type === 'eat').length;
  const top = web.nodes.filter((n) => n.tier === 3).map((n) => n.ja);
  const helpers = web.nodes.filter((n) => ['tentou', 'hanaabu', 'ashinaga', 'kamakiri', 'jorougumo'].includes(n.id)).map((n) => n.ja);
  const out = [];
  out.push(`${web.nodes.length}の要素が、${web.edges.length}本の「食べる・食べられる」でつながっています。`);
  if (helpers.length) out.push(`${helpers.join('・')}は、アブラムシやイモムシを食べてくれる庭の味方。農薬を控えるほど、この網は太くなります。`);
  if (top.length) out.push(`いちばん上には${top.slice(0, 3).join('・')}。鳥が来るのは、その下の虫たちが豊かなしるしです。`);
  if (!eats) out.push('虫を食べる生き物がまだいません。水場や石積み、低木を加えると、つながりがふえます。');
  return out;
}
