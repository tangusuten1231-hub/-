// 植栽プラン生成：キーワード解析 → 植物選定（開花リレー・高さ・形のバランス）→ 配置 → 費用
import { PLANTS, COLORS } from './plants.js';
import { evaluate, heightClass, localMonth } from './garden.js';
import { STYLES, ROLE_JA, WARMTH } from './styles.js';

// ---------- 乱数（同じ条件なら同じプランになるようシード付き） ----------
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

// ---------- キーワード辞書 ----------
const DICT = [
  // 色
  { label: '白', words: ['白', 'ホワイト', '純白'], colors: ['white'] },
  { label: '青', words: ['青', 'ブルー', '水色', '空色'], colors: ['blue'] },
  { label: '紫', words: ['紫', 'パープル', '藤色', 'ラベンダー色'], colors: ['purple'] },
  { label: 'ピンク', words: ['ピンク', '桃色', '桜色'], colors: ['pink'] },
  { label: '赤', words: ['赤', 'レッド', 'ワイン', '深紅'], colors: ['red'] },
  { label: '黄', words: ['黄', 'イエロー', 'ゴールド', '金色'], colors: ['yellow'] },
  { label: 'オレンジ', words: ['オレンジ', '橙', 'アプリコット'], colors: ['orange'] },
  { label: 'パステル', words: ['パステル', 'やさしい', '優しい', 'ふんわり', '柔らか', 'かわいい', '可愛い'], colors: ['pink', 'blue', 'white', 'purple'] },
  { label: 'カラフル', words: ['カラフル', 'ビビッド', '元気', '鮮やか', '明るい', 'トロピカル', 'にぎやか', '賑やか'], colors: ['red', 'orange', 'yellow', 'purple', 'pink'] },
  { label: 'シック', words: ['シック', '大人', '落ち着', '渋い', 'モダン', 'おしゃれ', 'オシャレ', 'スタイリッシュ'], colors: ['purple', 'white', 'red'], leaf: ['bronze', 'silver'] },
  { label: '涼しげ', words: ['涼', 'クール', '爽やか', 'さわやか', '寒色'], colors: ['blue', 'white', 'purple'] },
  { label: '暖色', words: ['暖色', 'あたたか', '暖か', '温か', '夕焼け', 'ビタミンカラー'], colors: ['orange', 'yellow', 'red'] },
  { label: 'ホワイトガーデン', words: ['ホワイトガーデン', '白い庭', '白だけ', '白一色', '白の庭'], colors: ['white'], strictWhite: true },
  // 葉
  { label: '銀葉', words: ['シルバー', '銀葉', '銀色'], leaf: ['silver'] },
  { label: '銅葉', words: ['銅葉', 'ダークな葉', '黒葉', 'ブロンズ'], leaf: ['bronze'] },
  { label: 'カラーリーフ', words: ['カラーリーフ', '葉色', '葉っぱ', 'リーフ'], leaf: ['silver', 'bronze', 'gold', 'variegated', 'blue'] },
  // スタイル
  { label: 'ナチュラル', words: ['ナチュラル', '自然', '野原', '雑木', '素朴', 'ワイルド'], tags: ['natural'] },
  { label: 'イングリッシュ', words: ['イングリッシュ', '英国', 'イギリス', 'コテージ', 'ボーダー', 'ロマンチック'], tags: ['english'] },
  { label: '和風', words: ['和風', '和の', '和モダン', '日本', '侘', 'わび', 'さび', '山野草', '七草', '純和', '風情'], tags: ['wa'] },
  { label: 'プレーリー', words: ['プレーリー', '草原', 'ニューパーネル', 'グラス', '風に揺れ', 'オランダ', 'メドウ'], tags: ['prairie'] },
  { label: 'ドライガーデン', words: ['ドライ', '乾燥', 'ロック', '砂利', '地中海', '南欧', '石'], tags: ['dry'] },
  { label: 'シェード', words: ['日陰', 'シェード', '北側', '木陰', '日当たりが悪'], tags: ['shade'], sun: 'part' },
  { label: '蝶・蜂', words: ['蝶', 'ちょう', '蜂', 'ミツバチ', '虫', '生き物', '野鳥', 'ビオトープ'], tags: ['pollinator'] },
  { label: '香り', words: ['香り', 'ハーブ', '匂い', 'アロマ'], tags: ['fragrant'] },
  { label: '冬も緑', words: ['常緑', '一年中', '冬も', '冬でも'], tags: ['evergreen'] },
  { label: '手間いらず', words: ['手間', 'ずぼら', '簡単', '初心者', '丈夫', '放任', 'ローメンテ', '楽'], tags: ['easy'] },
  // 条件
  { label: '長く咲く', words: ['長く咲', 'ずっと', '長期間', '四季', '途切れ'], longbloom: true },
  { label: '低予算', words: ['安', '低予算', '節約', 'コスパ', 'お手頃', 'プチプラ'], budget: true },
  { label: 'ボリューム', words: ['ボリューム', '背の高', '迫力', 'ダイナミック', '大きな'], tall: true },
  { label: 'コンパクト', words: ['低い', 'コンパクト', '小さ', '背の低', '小花壇', 'ベランダ'], short: true },
  { label: '春', words: ['春'], season: [3, 4, 5] },
  { label: '初夏', words: ['初夏', '梅雨'], season: [5, 6] },
  { label: '夏', words: ['夏'], season: [6, 7, 8] },
  { label: '秋', words: ['秋'], season: [9, 10, 11] },
  { label: '冬', words: ['冬'], season: [12, 1, 2], tags: ['evergreen'] },
];

export const PRESETS = ['ナチュラル', 'イングリッシュ', '和風', 'プレーリー', 'ドライ', '日陰', 'ホワイトガーデン', 'パステル', 'カラフル', 'シック', '涼しげ', '蝶・蜂', '香り', '長く咲く', '手間いらず', '低予算'];

/** 自由入力のイメージ文から好みを読み取る */
export function parseKeywords(text = '') {
  const pref = { colors: new Set(), tags: new Set(), leaf: new Set(), season: new Set(), matched: [], strictWhite: false, longbloom: false, budget: false, tall: false, short: false, sun: null };
  const t = text.replace(/\s+/g, '');
  for (const d of DICT) {
    if (!d.words.some((w) => t.includes(w))) continue;
    // 「夏」が「初夏」だけに含まれる場合などの重複を避ける
    if (d.label === '夏' && !/(^|[^初])夏/.test(t)) continue;
    if (d.label === '白' && pref.strictWhite) continue;
    pref.matched.push(d.label);
    d.colors?.forEach((c) => pref.colors.add(c));
    d.tags?.forEach((c) => pref.tags.add(c));
    d.leaf?.forEach((c) => pref.leaf.add(c));
    d.season?.forEach((c) => pref.season.add(c));
    if (d.strictWhite) pref.strictWhite = true;
    if (d.longbloom) pref.longbloom = true;
    if (d.budget) pref.budget = true;
    if (d.tall) pref.tall = true;
    if (d.short) pref.short = true;
    if (d.sun) pref.sun = d.sun;
  }
  if (pref.strictWhite) { pref.colors = new Set(['white']); pref.matched = pref.matched.filter((m) => m !== '白'); }
  return pref;
}

// ---------- 費用の目安 ----------
export const COST = {
  soil: { ja: '土づくり（腐葉土・堆肥・改良材）', perSqm: 1500 },
  mulch: { ja: 'マルチング（バークチップ等）', perSqm: 800 },
  fert: { ja: '元肥', perSqm: 200 },
};

// ---------- 植物の選定 ----------
const LAYERS = ['back', 'middle', 'front'];
const LAYER_JA = { back: '後景', middle: '中景', front: '前景' };

function chosenColor(p, pref) {
  return p.color.find((c) => pref.colors.has(c)) ?? p.color[0];
}

/**
 * 植栽プランを生成
 * @param o { climate, sun, moist, width, depth, text, view: 'border'|'island', style, budget, seed }
 */
export function generatePlan(o) {
  const width = Math.max(0.5, Number(o.width) || 3);
  const depth = Math.max(0.4, Number(o.depth) || 1.2);
  const area = width * depth;
  const pref = parseKeywords(o.text);
  const sun = o.sun || pref.sun || 'full';
  const moist = o.moist || '';
  const south = !!o.climate?.south;
  const styleId = STYLES[o.style] ? o.style : 'border';
  const style = STYLES[styleId];
  const rand = rng(hash(`${o.text}|${sun}|${moist}|${width}|${depth}|${o.view}|${styleId}`) + (o.seed || 0) * 7919);

  // 候補
  let cands = PLANTS.filter((p) => p.sun.includes(sun) && (!moist || p.moist.includes(moist)));
  if (style.filter) cands = cands.filter(style.filter);
  if (pref.strictWhite) cands = cands.filter((p) => p.color.includes('white') || p.form === 'grass' || p.leaf === 'silver' || p.leaf === 'variegated');
  const evals = new Map(cands.map((p) => [p.id, evaluate(p, o.climate)]));
  if (o.climate) cands = cands.filter((p) => evals.get(p.id).level >= 2);
  if (depth < 0.6 || pref.short) cands = cands.filter((p) => p.h[1] <= Math.max(60, depth * 120));

  const score = (p) => {
    const lv = evals.get(p.id).level;
    let s = lv === 3 ? 3 : lv === 2 ? 1.2 : 2;
    const why = [];
    const tagHits = p.tags.filter((t) => pref.tags.has(t));
    s += Math.min(3, tagHits.length) * 2.2;
    if (pref.tags.size && !tagHits.length) s -= 1.5;
    if (pref.colors.size) {
      const hits = p.color.filter((c) => pref.colors.has(c));
      if (hits.length) { s += 2.5 + hits.length / p.color.length; why.push(`${COLORS[hits[0]].ja}の花`); }
      else if (p.form !== 'grass' && p.color[0] !== 'green') s -= 3;
    }
    if (pref.leaf.size && pref.leaf.has(p.leaf)) { s += 1.8; why.push('葉色'); }
    if (pref.longbloom) s += (p.bloom.length - 3) * 0.7;
    // 費用は「1㎡あたりの苗代」（価格 ÷ 株間²）で比べる
    const perSqm = p.price / (p.spread / 100) ** 2;
    s -= pref.budget ? perSqm / 2400 + p.price / 400 : perSqm / 12000 + p.price / 3000;
    if (pref.tall && p.h[1] >= 100) s += 1.2;
    if (pref.season.size && p.bloom.some((m) => pref.season.has(m))) { s += 1.5; }
    if (lv === 3 && o.climate) why.unshift('気候に合う');
    if (tagHits.length) why.push(...tagHits.map((t) => TAG_REASON[t]));
    if (p.bloom.length >= 5) why.push('長く咲く');
    if (style.bonus) { s += style.bonus(p); why.push(...style.why(p)); }
    return { s: s + rand() * 1.5, why };
  };
  const scored = cands.map((p) => ({ p, ...score(p) }));

  // 種類数と層の目標
  const n = Math.max(3, Math.min(12, Math.round((3 + area * 1.1) * (style.speciesFactor || 1))));
  const layersUsed = depth < 0.6 ? ['middle', 'front'] : LAYERS;
  let target = depth < 0.6
    ? { back: 0, middle: Math.ceil(n / 2), front: Math.floor(n / 2) }
    : { back: Math.max(1, Math.round(n * 0.3)), front: Math.max(1, Math.round(n * 0.3)), middle: 0 };
  if (depth >= 0.6) target.middle = n - target.back - target.front;
  let layerOf = (p) => {
    const l = heightClass(p);
    return layersUsed.includes(l) ? l : 'middle';
  };
  // スタイル独自の役割（地模様・群植・散らし、骨格・テーマ・グラウンドカバー など）
  if (style.roleOf) { layerOf = style.roleOf; target = style.targets(n); }

  const want = [3, 4, 5, 6, 7, 8, 9, 10, 11].map((m) => localMonth(m, south));
  const covered = new Set();
  const picked = [];
  const count = Object.fromEntries(Object.keys(target).map((k) => [k, 0]));
  const forms = {};
  const pool = [...scored];
  const needGrass = pref.tags.has('prairie') || pref.tags.has('natural');
  const colorUse = {};
  // 指定色のうち、まだ使われていない色を優先して割り当てる
  const palette = pref.colors.size ? pref.colors : style.allColors ? new Set(Object.keys(WARMTH).filter((c) => c !== 'green')) : pref.colors;
  const pickColor = (p) => {
    const opts = p.color.filter((c) => palette.has(c));
    if (!opts.length) return p.color[0];
    return opts.reduce((a, b) => ((colorUse[b] || 0) < (colorUse[a] || 0) ? b : a));
  };

  while (picked.length < n && pool.length) {
    let best = null, bestV = -Infinity;
    for (const c of pool) {
      const L = layerOf(c.p);
      const local = c.p.bloom.map((m) => localMonth(m, south));
      const gain = local.filter((m) => want.includes(m) && !covered.has(m)).length;
      let v = c.s + gain * 1.6;
      v += (count[L] ?? 0) < (target[L] ?? 0) ? 3 : -4;
      v += forms[c.p.form] ? -0.9 * forms[c.p.form] : 1;
      if (picked.some((x) => x.plant.group === c.p.group)) v -= 6; // 同じ種の品種は重ねない
      if (needGrass && c.p.form === 'grass' && !forms.grass) v += 1.5;
      if (palette.size > 1) {
        const col = pickColor(c.p);
        if (palette.has(col)) v += 1.5 - (colorUse[col] || 0) * 0.8;
      }
      if (v > bestV) { bestV = v; best = c; }
    }
    pool.splice(pool.indexOf(best), 1);
    const L = layerOf(best.p);
    const local = best.p.bloom.map((m) => localMonth(m, south));
    const fills = local.filter((m) => want.includes(m) && !covered.has(m));
    local.forEach((m) => covered.add(m));
    count[L] = (count[L] ?? 0) + 1;
    forms[best.p.form] = (forms[best.p.form] || 0) + 1;
    const why = [...best.why];
    if (fills.length && picked.length) why.push(`${fills.sort((a, b) => a - b).map((m) => m + '月').join('・')}の花を担当`);
    const color = palette.size ? pickColor(best.p) : chosenColor(best.p, pref);
    colorUse[color] = (colorUse[color] || 0) + 1;
    picked.push({ plant: best.p, layer: L, color, level: evals.get(best.p.id).level, why: [...new Set(why)].slice(0, 4) });
  }

  // 配置
  const island = o.view === 'island';
  const layout = style.layout === 'bands' || style.layout === 'gradient'
    ? layoutBed(picked, width, depth, island, rand, style.layout === 'gradient')
    : layoutNatural(picked, width, depth, island, rand, style);
  const species = picked.map((s, i) => ({ ...s, role: s.layer, roleJa: ROLE_JA[s.layer], no: i + 1, positions: layout.positions[i], qty: layout.positions[i].length }));
  // 番号は役割の順（後景→前景、骨格→地模様など）に振り直す
  const ORDER = ['back', 'scatter', 'structure', 'middle', 'block', 'theme', 'front', 'matrix', 'ground'];
  species.sort((a, b) => ORDER.indexOf(a.role) - ORDER.indexOf(b.role));
  species.forEach((s, i) => { s.no = i + 1; s.subtotal = s.qty * s.plant.price; });

  const plantsCost = species.reduce((t, s) => t + s.subtotal, 0);
  const extras = Object.entries(COST).map(([k, c]) => {
    const cc = style.cost?.[k] ?? c;
    return { key: k, ja: cc.ja, cost: Math.round(cc.perSqm * area / 10) * 10 };
  });
  const total = plantsCost + extras.reduce((t, e) => t + e.cost, 0);
  const counts = Array(12).fill(0);
  species.forEach((s) => s.plant.bloom.forEach((m) => counts[localMonth(m, south) - 1]++));
  const peak = counts.indexOf(Math.max(...counts)) + 1;

  return {
    width, depth, area, sun, moist, view: o.view === 'island' ? 'island' : 'border', pref, style: styleId,
    species, bands: layout.bands, counts, peak,
    gaps: want.filter((m) => !counts[m - 1]),
    cost: { plants: plantsCost, extras, total, perSqm: Math.round(total / area), budget: Number(o.budget) || null },
    totalPlants: species.reduce((t, s) => t + s.qty, 0),
  };
}

const TAG_REASON = {
  natural: 'ナチュラル', english: 'イングリッシュ', wa: '和の雰囲気', prairie: 'プレーリー', dry: '乾燥に強い',
  shade: '日陰向き', pollinator: '蝶・蜂が来る', fragrant: '香り', evergreen: '冬も緑', easy: '手間いらず',
};

/**
 * 花壇のレイアウト。帯（前景・中景・後景）ごとに植物を左右に並べ、
 * 株間に合わせた六角格子で株の位置を決める（単位: m、x=幅方向、y=奥行き 0=手前）
 */
export function layoutBed(picked, W, D, island, rand, gradient = false) {
  const has = (l) => picked.some((p) => p.layer === l);
  let bands;
  if (island) {
    const seq = [['front', 0.17], ['middle', 0.2], ['back', 0.26], ['middle', 0.2], ['front', 0.17]].filter(([l]) => has(l));
    bands = normalize(seq);
  } else {
    const seq = [['front', 0.3], ['middle', 0.36], ['back', 0.34]].filter(([l]) => has(l));
    bands = normalize(seq);
  }
  function normalize(seq) {
    const sum = seq.reduce((t, [, f]) => t + f, 0);
    let y = 0;
    return seq.map(([layer, f]) => { const h = (f / sum) * D; const b = { layer, y0: y, y1: y + h }; y += h; return b; });
  }

  const positions = picked.map(() => []);
  bands.forEach((band, bi) => {
    const idx = picked.map((p, i) => (p.layer === band.layer ? i : -1)).filter((i) => i >= 0);
    // 帯ごとに並び順をずらし、幅が広ければ同じ植物を2か所に分けて繰り返す（リズムと色の混ざり）
    let order = [...idx];
    const shift = (bi * Math.ceil(order.length / 2)) % Math.max(1, order.length);
    order = [...order.slice(shift), ...order.slice(0, shift)];
    if (bi % 2) order.reverse();
    if (gradient) {
      // 暖色を中央、寒色を両端へ（ジーキル式）
      const sorted = [...idx].sort((a, b) => WARMTH[picked[a].color] - WARMTH[picked[b].color]);
      const left = [], right = [];
      sorted.forEach((i, k) => (k % 2 ? right : left).push(i));
      order = [...left, ...right.reverse()];
    }
    const repeat = !gradient && order.length >= 2 && W / (idx.reduce((t, i) => t + picked[i].plant.spread, 0) / 100) >= 1.8;
    if (repeat) {
      const half = Math.ceil(order.length / 2);
      order = [...order, ...order.slice(half), ...order.slice(0, half)];
    }
    const weights = order.map((i) => picked[i].plant.spread / (repeat ? 2 : 1));
    const wsum = weights.reduce((a, b) => a + b, 0);
    let x = 0;
    order.forEach((i, k) => {
      const w = (weights[k] / wsum) * W;
      const seg = { x0: x, x1: x + w, y0: band.y0, y1: band.y1 };
      positions[i].push(...hexFill(seg, picked[i].plant.spread / 100, rand));
      x += w;
    });
  });
  return { bands, positions };
}

function hexFill(seg, s, rand) {
  const pts = [];
  const w = seg.x1 - seg.x0, h = seg.y1 - seg.y0;
  const dy = s * 0.866;
  const rows = Math.max(1, Math.floor(h / dy + 0.35));
  const oy = seg.y0 + (h - (rows - 1) * dy) / 2;
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? s / 2 : 0;
    const cols = Math.max(1, Math.floor((w - off) / s + 0.35));
    const ox = seg.x0 + off + (w - off - (cols - 1) * s) / 2;
    for (let c = 0; c < cols; c++) {
      const j = s * 0.12;
      pts.push({ x: clamp(ox + c * s + (rand() - 0.5) * j, seg.x0, seg.x1), y: clamp(oy + r * dy + (rand() - 0.5) * j, seg.y0, seg.y1) });
    }
  }
  return pts;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export { LAYER_JA };

/**
 * 自然風の配置（ブロック＋地模様＋散らし／混ぜ植え／群植＋余白）
 * 花壇全体に一定間隔の格子点を置き、各点にどの植物を植えるかを割り当てる。
 */
export function layoutNatural(picked, W, D, island, rand, style) {
  const spreads = picked.map((p) => p.plant.spread / 100).sort((a, b) => a - b);
  const s = Math.min(0.9, Math.max(0.25, spreads[Math.floor(spreads.length / 2)] * (style.spacing || 1)));
  const pts = [];
  const dy = s * 0.866;
  for (let r = 0, y = dy / 2; y < D; r++, y += dy) {
    for (let x = (r % 2 ? s : s / 2); x < W; x += s) {
      pts.push({ x: clamp(x + (rand() - 0.5) * s * 0.3, 0.02, W - 0.02), y: clamp(y + (rand() - 0.5) * s * 0.3, 0.02, D - 0.02), owner: -1 });
    }
  }
  if (!pts.length) pts.push({ x: W / 2, y: D / 2, owner: -1 });

  // 奥行き方向の「好ましい位置」：背が高いほど奥（アイランドは中央）
  const hNorm = (p) => clamp(((p.h[0] + p.h[1]) / 2 - 15) / 140, 0, 1);
  const prefY = (p, j) => island
    ? D / 2 + (j % 2 ? 1 : -1) * (1 - hNorm(p)) * D * 0.42 * (0.6 + rand() * 0.4)
    : D * clamp(0.12 + hNorm(p) * 0.78 + (rand() - 0.5) * 0.15, 0.08, 0.92);

  const idxOf = (role) => picked.map((p, i) => (p.layer === role ? i : -1)).filter((i) => i >= 0);
  const pickFrom = (arr) => arr[Math.floor(rand() * arr.length)];

  if (style.layout === 'intermingle') {
    // 3層を比率に従ってランダムに混ぜ植え
    const roles = Object.entries(style.roleShare).filter(([r]) => idxOf(r).length);
    const total = roles.reduce((t, [, w]) => t + w, 0);
    for (const pt of pts) {
      let u = rand() * total, role = roles[0][0];
      for (const [r, w] of roles) { if ((u -= w) <= 0) { role = r; break; } }
      // 骨格は手前の縁に置かない
      if (role === 'structure' && !island && pt.y < D * 0.25 && idxOf('theme').length) role = 'theme';
      if (role === 'structure' && island && Math.abs(pt.y - D / 2) > D * 0.3 && idxOf('theme').length) role = 'theme';
      pt.owner = pickFrom(idxOf(role));
    }
  } else {
    // ブロック（群れ）の中心を配置し、各点を最寄りの中心に割り当てる（ボロノイ分割）
    const blockIdx = style.layout === 'blocks' ? idxOf('block') : picked.map((_, i) => i);
    const useIdx = blockIdx.length ? blockIdx : picked.map((_, i) => i);
    const k = W * D >= (style.layout === 'clusters' ? 10 : 6) ? 2 : 1; // 広い花壇では同じ植物を2か所に繰り返す
    const centers = [];
    useIdx.forEach((i, n) => {
      for (let j = 0; j < k; j++) {
        const fx = ((j + ((n * 0.618 + rand() * 0.25) % 1)) / k);
        centers.push({ i, x: fx * W, y: prefY(picked[i].plant, j) });
      }
    });
    for (const pt of pts) {
      let best = null, d1 = Infinity, d2 = Infinity;
      for (const c of centers) {
        const d = Math.hypot(pt.x - c.x, (pt.y - c.y) * 1.6);
        if (d < d1) { d2 = d1; d1 = d; best = c; } else if (d < d2) d2 = d;
      }
      pt.owner = best.i;
      pt.edge = d2 - d1; // ブロックの境界に近いほど小さい
    }
    if (style.layout === 'blocks') {
      // 地模様のグラス等を全体に散りばめる
      const mIdx = idxOf('matrix');
      if (mIdx.length) for (const pt of pts) if (rand() < style.matrixShare) pt.owner = pickFrom(mIdx);
      // 背の高い植物を点々と散らす
      const sIdx = idxOf('scatter');
      for (const i of sIdx) {
        const want = Math.max(2, Math.round(W * D * 0.6));
        const cand = pts.filter((pt) => (island ? Math.abs(pt.y - D / 2) < D * 0.35 : pt.y > D * 0.3));
        for (let t = 0; t < want && cand.length; t++) cand.splice(Math.floor(rand() * cand.length), 1)[0].owner = i;
      }
    }
    if (style.layout === 'clusters') {
      // 群れの境目に砂利の余白をつくる
      for (const pt of pts) if (pt.edge < s * 0.3 && rand() < 0.6) pt.owner = -1;
    }
  }

  const positions = picked.map(() => []);
  for (const pt of pts) if (pt.owner >= 0) positions[pt.owner].push({ x: pt.x, y: pt.y });
  // どの植物も最低1株は植わるように
  positions.forEach((arr, i) => {
    if (arr.length) return;
    const donor = positions.reduce((b, a, j) => (a.length > positions[b].length ? j : b), 0);
    if (positions[donor].length > 1) arr.push(positions[donor].splice(Math.floor(rand() * positions[donor].length), 1)[0]);
    else arr.push({ x: rand() * W, y: rand() * D });
  });
  return { bands: [], positions };
}
