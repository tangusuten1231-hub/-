// 植栽プラン生成：キーワード解析 → 植物選定（開花リレー・高さ・形のバランス）→ 配置 → 費用
import { PLANTS, COLORS, LEAF } from './plants.js';
import { evaluate, heightClass, localMonth } from './garden.js';
import { siteOf, hardFails, climateFit, regionalKind, REGIONAL_JA, climateReason, hasClimateData } from './fit.js';
import { STYLES, ROLE_JA, WARMTH } from './styles.js';
import { wildScore, WILD_GOALS } from './wildlife.js';

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
  { label: '香り', words: ['香り', '匂い', 'アロマ'], tags: ['fragrant'] },
  { label: 'ハーブ', words: ['ハーブ', 'キッチン', '料理', 'お茶', 'ティー'], tags: ['herb'] },
  { label: '薬草', words: ['薬草', '薬用', 'メディカル', '生薬', '漢方'], tags: ['medicinal'] },
  { label: '在来種', words: ['在来', '自生', '日本の野草', '野の花'], tags: ['native'] },
  { label: 'グラウンドカバー', words: ['グラウンドカバー', 'グランドカバー', '地面を覆', '雑草よけ', '雑草対策', '下草', 'じゅうたん'], roles: ['groundcover'] },
  { label: '縁取り', words: ['縁取り', 'エッジ', 'ふちどり', '縁どり'], roles: ['edging'] },
  { label: '目隠し', words: ['目隠し', '背の高い背景', 'スクリーン', '視線を遮'], roles: ['screen'], tall: true },
  { label: '野菜', words: ['野菜', '菜園', 'ポタジェ', 'キッチンガーデン', '収穫', '家庭菜園', '食べられる'], tags: ['veg'], veg: true },
  { label: '一年草も', words: ['一年草', '種まき', 'こぼれ種', '切り花畑'], annual: true },
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

export const PRESETS = ['野菜', 'ハーブ', '薬草', 'ナチュラル', 'イングリッシュ', '和風', 'プレーリー', 'ドライ', '日陰', 'ホワイトガーデン', 'パステル', 'カラフル', 'シック', '涼しげ', '蝶・蜂', '香り', '長く咲く', '手間いらず', '低予算'];

/** 自由入力のイメージ文から好みを読み取る */
export function parseKeywords(text = '') {
  const pref = { colors: new Set(), tags: new Set(), leaf: new Set(), season: new Set(), roles: new Set(), matched: [], annual: false, strictWhite: false, longbloom: false, budget: false, tall: false, short: false, sun: null };
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
    d.roles?.forEach((c) => pref.roles.add(c));
    if (d.strictWhite) pref.strictWhite = true;
    if (d.longbloom) pref.longbloom = true;
    if (d.budget) pref.budget = true;
    if (d.tall) pref.tall = true;
    if (d.short) pref.short = true;
    if (d.sun) pref.sun = d.sun;
    if (d.annual) pref.annual = true;
    if (d.veg) pref.veg = true;
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

/** 主に料理・薬用に使う植物（観賞用の花壇には入れない） */
const KITCHEN_ONLY = new Set(['laurus', 'zanthoxylum', 'camellia-sinensis', 'cryptotaenia', 'rumex', 'levisticum', 'petroselinum', 'coriandrum', 'anethum', 'ocimum', 'perilla', 'satureja', 'summer-savory', 'stevia', 'cymbopogon', 'zingiber', 'petasites', 'lindera', 'lycium', 'wasabi', 'egoma', 'turmeric', 'cumin', 'anise', 'caraway', 'chervil', 'sweet-cicely', 'mentha', 'melissa', 'houttuynia', 'symphytum', 'gotu-kola', 'vetiver', 'glycyrrhiza', 'coptis', 'atractylodes', 'bupleurum', 'aralia', 'allium-tuberosum']);

/** 花壇の形 */
export const BED_SHAPES = {
  rect: { ja: '長方形', text: 'いちばん基本の形。塀ぞいのボーダーにも' },
  circle: { ja: '円形', text: '芝生や広場の中に。どこから見ても主役になる' },
  oval: { ja: '楕円形', text: '細長い場所に。やわらかい印象の島花壇' },
  half: { ja: '半円形', text: '塀や壁を背にした、まっすぐな奥と丸い手前' },
  kidney: { ja: 'そら豆形', text: '手前がくぼんだ曲線。イングリッシュガーデンの定番' },
  custom: { ja: '庭に合わせた形', text: '庭まるごとプランで、小道や芝生に合わせて決めた形' },
  wave: { ja: '曲線ボーダー', text: '奥はまっすぐ、手前の縁がゆるく波打つボーダー' },
};
/** 植え付けの間隔＝育ったときの株張り × この係数（育つと隣と触れ合い、地面が見えなくなる密度。プロの植栽設計の目安） */
export const PLANT_GAP = 0.85;
/**
 * 園芸の腕前に合わせたプラン。育てやすさ（6段階：garden.js の GRADE）で候補を選ぶ。
 * min：候補にする育てやすさの下限、tough：「工夫が必要」の植物を入れてよい割合
 * 人気の目安：図鑑に収録している品種の数（多くの品種が流通している植物ほど人気が高いとみなす）
 */
export const SKILLS = {
  beginner: { ja: 'はじめて', text: '「簡単に育つ」植物だけで作る（足りないときだけ「よく育つ」植物を加え、そのことを表示）', min: 6 },
  standard: { ja: 'ふつう', text: '「育つ」以上を中心に。「育ちにくい」植物は点数を下げて、なるべく選ばない', min: 3 },
  skilled: { ja: '慣れている', text: '手入れで補える「育ちにくい」植物も、ほかと同じ扱いで選ぶ。人気の植物（品種が多いもの）を少し優先', min: 3 },
  challenge: { ja: '挑戦したい', text: '「育てるには工夫が必要」な人気の植物も、全体の3割まで工夫のしかたつきで入れる（「育てられない」植物は入れない）', min: 3, tough: 0.3 },
};
export const popularity = (p) => Math.min(1, Math.max(0, ((p.cvCount || 1) - 1) / 5));
/** こだわり設定：植栽密度（間隔の係数）と種類の数 */
export const DENSITY = { airy: { ja: 'ゆったり', k: 1.18 }, standard: { ja: '標準', k: 1 }, dense: { ja: 'しっかり', k: 0.88 }, tight: { ja: '密植', k: 0.76 } };
export const VARIETY = { few: { ja: '少なめ', k: 0.7 }, standard: { ja: '標準', k: 1 }, many: { ja: '多め', k: 1.35 } };
let GAP = PLANT_GAP;

/**
 * 任意の形（閉じた折れ線のリスト、花壇の座標 x=左→右・y=手前0→奥）から、配置に使う「形」をつくる。
 * 庭まるごとプランの花壇（曲線の縁、L字の角など）に使う。内外判定は5cm角のラスターで高速に行う。
 */
export function polygonMask(loops, W, D) {
  const res = 0.05;
  const nx = Math.max(1, Math.ceil(W / res)), ny = Math.max(1, Math.ceil(D / res));
  const grid = new Uint8Array(nx * ny);
  const inPoly = (x, y) => {
    let c = false;
    for (const L of loops) for (let i = 0, j = L.length - 1; i < L.length; j = i++) {
      const [xi, yi] = L[i], [xj, yj] = L[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  // 行ごとに交点を求めて塗る（走査線）
  for (let j = 0; j < ny; j++) {
    const y = (j + 0.5) * res;
    const xs = [];
    for (const L of loops) for (let i = 0, k = L.length - 1; i < L.length; k = i++) {
      const [xi, yi] = L[i], [xk, yk] = L[k];
      if ((yi > y) !== (yk > y)) xs.push(xi + ((y - yi) * (xk - xi)) / (yk - yi));
    }
    xs.sort((a, b) => a - b);
    for (let t = 0; t + 1 < xs.length; t += 2) {
      const a = Math.max(0, Math.ceil(xs[t] / res - 0.5)), b = Math.min(nx - 1, Math.floor(xs[t + 1] / res - 0.5));
      for (let i = a; i <= b; i++) grid[j * nx + i] = 1;
    }
  }
  const cell = (x, y) => { const i = Math.floor(x / res), j = Math.floor(y / res); return i >= 0 && j >= 0 && i < nx && j < ny ? grid[j * nx + i] : 0; };
  const inside = (x, y) => cell(x, y) === 1;
  // 縁からの距離（チャンファー距離変換）
  const dist = new Float32Array(nx * ny);
  for (let k = 0; k < nx * ny; k++) dist[k] = grid[k] ? 1e9 : 0;
  const d1 = res, d2 = res * Math.SQRT2;
  const at = (i, j) => (i < 0 || j < 0 || i >= nx || j >= ny ? 0 : dist[j * nx + i]);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; if (!grid[k]) continue; dist[k] = Math.min(dist[k], at(i - 1, j) + d1, at(i, j - 1) + d1, at(i - 1, j - 1) + d2, at(i + 1, j - 1) + d2); }
  for (let j = ny - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) { const k = j * nx + i; if (!grid[k]) continue; dist[k] = Math.min(dist[k], at(i + 1, j) + d1, at(i, j + 1) + d1, at(i + 1, j + 1) + d2, at(i - 1, j + 1) + d2); }
  let maxD = res, area = 0, sx = 0, sy = 0;
  for (let k = 0; k < nx * ny; k++) if (grid[k]) { area++; maxD = Math.max(maxD, dist[k]); sx += (k % nx + 0.5) * res; sy += (Math.floor(k / nx) + 0.5) * res; }
  const cx = area ? sx / area : W / 2, cy = area ? sy / area : D / 2;
  area *= res * res;
  // 列ごとの手前・奥の縁
  const lo = new Float32Array(nx).fill(NaN), hi = new Float32Array(nx).fill(NaN);
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) if (grid[j * nx + i]) { const y = (j + 0.5) * res; if (Number.isNaN(lo[i])) lo[i] = y; hi[i] = y; }
  const col = (x) => {
    let i = clamp(Math.floor(x / res), 0, nx - 1);
    for (let k = 0; k < nx && Number.isNaN(lo[i]); k++) { const a = i - k, b = i + k; if (a >= 0 && !Number.isNaN(lo[a])) { i = a; break; } if (b < nx && !Number.isNaN(lo[b])) { i = b; break; } }
    return i;
  };
  const loF = (x) => lo[col(x)] - res / 2, hiF = (x) => hi[col(x)] + res / 2;
  // 島花壇の深さ＝縁からの距離（中央ほど1）
  const depthOf = (x, y, island) => {
    if (island) { const i = Math.floor(x / res), j = Math.floor(y / res); return i >= 0 && j >= 0 && i < nx && j < ny ? clamp(dist[j * nx + i] / maxD, 0, 1) : 0; }
    const a = loF(x), b = hiF(x);
    return clamp((y - a) / Math.max(0.05, b - a), 0, 1);
  };
  const latOf = (x, y, island) => (island ? (Math.atan2(y - cy, x - cx) + Math.PI) / (2 * Math.PI) : clamp(x / W, 0, 1));
  // 群れの中心を置くための見本点
  const samples = [];
  const step = Math.max(1, Math.round(0.15 / res));
  for (let j = 0; j < ny; j += step) for (let i = 0; i < nx; i += step) if (grid[j * nx + i]) { const x = (i + 0.5) * res, y = (j + 0.5) * res; samples.push({ x, y, l: latOf(x, y, true), d: dist[j * nx + i] / maxD }); }
  const place = (f, t, island) => {
    if (!island) { const x = clamp(f * W, 0.02, W - 0.02); const a = loF(x), b = hiF(x); if (Number.isFinite(a)) return { x, y: a + clamp(t, 0, 1) * (b - a) }; }
    let best = samples[0] || { x: cx, y: cy }, bs = Infinity;
    const ff = ((f % 1) + 1) % 1;
    for (const p of samples) { let dl = Math.abs(p.l - ff); dl = Math.min(dl, 1 - dl); const sc = dl * dl * 4 + (p.d - t) ** 2; if (sc < bs) { bs = sc; best = p; } }
    return { x: best.x, y: best.y };
  };
  const outline = loops.reduce((a, b) => (b.length > a.length ? b : a), loops[0] || []);
  return { shape: 'custom', lo: loF, hi: hiF, inside, depthOf, latOf, place, area, outline, loops, radial: true };
}

/** 形の上下の縁（x ごとの手前 lo と奥 hi、単位 m）。長方形は null（従来どおりの配置） */
export function bedShape(shape, W, D) {
  if (!BED_SHAPES[shape] || shape === 'rect' || shape === 'custom') return null;
  const U = (x) => clamp((x - W / 2) / (W / 2), -1, 1);
  const ov = (x) => Math.sqrt(Math.max(0, 1 - U(x) ** 2));
  let lo, hi;
  if (shape === 'circle' || shape === 'oval') { lo = (x) => (D / 2) * (1 - ov(x)); hi = (x) => (D / 2) * (1 + ov(x)); }
  else if (shape === 'half') { lo = (x) => D * (1 - ov(x)); hi = () => D; }
  else if (shape === 'kidney') {
    const r = 0.55, v0 = -1.12;
    lo = (x) => { const u = U(x); const base = (D / 2) * (1 - ov(x)); if (Math.abs(u) >= r) return base; return Math.max(base, (D / 2) * (1 + v0 + Math.sqrt(r * r - u * u))); };
    hi = (x) => (D / 2) * (1 + ov(x));
  } else { lo = (x) => D * 0.3 * (0.5 + 0.5 * Math.sin((2 * Math.PI * x / W) * 1.25 + 0.6)); hi = () => D; }
  const inside = (x, y) => x >= 0 && x <= W && y >= lo(x) - 1e-9 && y <= hi(x) + 1e-9 && hi(x) - lo(x) > 0.02;
  const radial = shape !== 'wave' && shape !== 'half';
  // 奥行きの深さ（0=手前の縁、1=奥／中央）と横方向の位置（0〜1）
  const depthOf = (x, y, island) => {
    const a = lo(x), b = hi(x), h = Math.max(0.01, b - a);
    if (!island) return clamp((y - a) / h, 0, 1);
    const u = U(x), v = clamp((y - (a + b) / 2) / (h / 2), -1, 1);
    return radial ? clamp(1 - Math.hypot(u, v * ov(x) || v * 0), 0, 1) : clamp(1 - Math.abs(v), 0, 1);
  };
  const latOf = (x, y, island) => {
    if (!island) return x / W;
    const a = lo(x), b = hi(x);
    return (Math.atan2((y - (a + b) / 2) / Math.max(0.01, D / 2), U(x)) + Math.PI) / (2 * Math.PI);
  };
  // 横位置 f と深さ t から座標へ（群れの中心を置くのに使う）
  const place = (f, t, island) => {
    if (!island) { const x = clamp(f * W, 0.02, W - 0.02); return { x, y: lo(x) + clamp(t, 0, 1) * (hi(x) - lo(x)) }; }
    const ang = f * 2 * Math.PI - Math.PI, rho = clamp(1 - t, 0, 0.95);
    const x = clamp(W / 2 + Math.cos(ang) * rho * (W / 2), 0.02, W - 0.02);
    const mid = (lo(x) + hi(x)) / 2, half = (hi(x) - lo(x)) / 2;
    return { x, y: mid + Math.sin(ang) * rho * half };
  };
  let area = 0;
  const N = 200;
  for (let k = 0; k < N; k++) { const x = ((k + 0.5) / N) * W; area += Math.max(0, hi(x) - lo(x)) * (W / N); }
  // 輪郭（m 座標の点列：手前の縁を左→右、奥の縁を右→左）
  const outline = [];
  for (let k = 0; k <= 60; k++) { const x = (k / 60) * W; outline.push([x, lo(x)]); }
  for (let k = 60; k >= 0; k--) { const x = (k / 60) * W; outline.push([x, hi(x)]); }
  return { shape, lo, hi, inside, depthOf, latOf, place, area, outline, radial };
}

/**
 * 植栽プランを生成
 * @param o { climate, sun, moist, width, depth, text, view: 'border'|'island', style, budget, seed }
 */
export function generatePlan(o) {
  const shapeId = o.mask ? 'custom' : BED_SHAPES[o.shape] ? o.shape : 'rect';
  const width = Math.max(0.5, Number(o.width) || 3);
  const depth = shapeId === 'circle' ? width : Math.max(0.4, Number(o.depth) || 1.2);
  const mask = o.mask || bedShape(shapeId, width, depth);
  const area = mask ? Math.round(mask.area * 100) / 100 : width * depth;
  const pref = parseKeywords(o.text);
  // こだわり設定（入れたい植物・避けたい植物・色・葉色・密度・種類の数・最大草丈・咲かせたい月・冬も楽しむ）
  const k = { must: [], exclude: [], colors: [], colorMode: 'prefer', leafs: [], density: 'standard', variety: 'standard', maxH: 0, months: [], winter: false, ...(o.k || {}) };
  k.colors.forEach((c) => pref.colors.add(c));
  k.leafs.forEach((c) => pref.leaf.add(c));
  const south = !!o.climate?.south;
  k.months.forEach((m) => pref.season.add(localMonth(m, south)));
  GAP = PLANT_GAP * (DENSITY[k.density]?.k || 1);
  const sun = o.sun || pref.sun || 'full';
  const moist = o.moist || '';
  const styleId = STYLES[o.style] ? o.style : 'border';
  const wild = Array.isArray(o.wild) ? o.wild.filter((g) => WILD_GOALS[g]) : [];
  const style = STYLES[styleId];
  const rand = rng(hash(`${o.text}|${sun}|${moist}|${width}|${depth}|${o.view}|${styleId}${shapeId === 'rect' ? '' : '|' + shapeId}${shapeId === 'custom' ? '|' + Math.round(mask.area * 10) : ''}|${wild.join()}|${o.k ? JSON.stringify({ ...o.k, density: undefined }) : ''}`) + (o.seed || 0) * 7919);

  // 候補
  let cands = PLANTS.filter((p) => p.sun.includes(sun) && (!moist || p.moist.includes(moist)));
  // 一年草は、指定があるときだけ使う（毎年の種まきが必要なため）
  const vegOK = style.potager || pref.veg;
  if (!o.annuals && !pref.annual && !vegOK && !style.cottage) cands = cands.filter((p) => p.type !== 'annual');
  // 野菜は、ポタジェか「野菜」の指定があるときだけ
  if (!vegOK) cands = cands.filter((p) => !p.tags.includes('veg') || ['zingiber', 'petasites', 'cryptotaenia', 'fragaria', 'rumex', 'chives', 'allium-tuberosum', 'perilla', 'ocimum', 'coriandrum', 'petroselinum'].includes(p.group));
  else if (!style.potager && pref.veg) cands = cands.filter((p) => p.type !== 'annual' || p.tags.includes('veg') || p.tags.includes('herb') || o.annuals || pref.annual);
  // 料理・薬用が主な植物（観賞用の花壇では目立たない・広がりすぎる）は、ハーブや薬草の指定があるときだけ
  if (!vegOK && !pref.tags.has('herb') && !pref.tags.has('medicinal')) cands = cands.filter((p) => !KITCHEN_ONLY.has(p.group));
  // こだわり：避けたい植物・最大草丈・この色だけ
  const exSet = new Set(k.exclude);
  cands = cands.filter((p) => !exSet.has(p.id) && !exSet.has(p.group));
  if (k.maxH) cands = cands.filter((p) => p.h[1] <= k.maxH);
  if (k.colors.length && k.colorMode === 'only') cands = cands.filter((p) => p.color.some((c) => k.colors.includes(c)) || p.form === 'grass' || p.form === 'fern' || p.color.includes('green'));
  // 大きくなる低木は狭い花壇には入れない
  cands = cands.filter((p) => p.type !== 'shrub' || p.h[1] <= 200 || area >= 8);
  if (style.filter) cands = cands.filter(style.filter);
  if (pref.strictWhite) cands = cands.filter((p) => p.color.includes('white') || p.form === 'grass' || p.leaf === 'silver' || p.leaf === 'variegated');
  // ---------- 気候のハードフィルター（育たない植物は候補から外す） ----------
  // スタイルや色の点数がいくら高くても、この場所の冬の寒さ・暖かさ・夏の暑さ・低温要求・高温多湿に合わない植物は選ばない
  const site = siteOf(o.climate);
  const failsOf = new Map(cands.map((p) => [p.id, site ? hardFails(p, o.climate, site) : []]));
  // 園芸の腕前（こだわり設定の「挑戦枠」は「挑戦したい」と同じ扱い）
  const skillId = SKILLS[o.skill] ? o.skill : k.challenge ? 'challenge' : 'standard';
  const skill = SKILLS[skillId];
  // 「挑戦したい」の候補：外れた理由がすべて工夫で補える植物（育てやすさ「育てるには工夫が必要」）
  const challengers = site && skill.tough ? cands.filter((p) => failsOf.get(p.id).length && evaluate(p, o.climate).grade === 2) : [];
  cands = cands.filter((p) => !failsOf.get(p.id).length);
  // 気候判定に必要なデータ（耐寒ゾーン・ヒートゾーン・高温多湿）がない植物は「判定保留」。主役（後景・中景）には選ばない
  if (site) cands = cands.filter((p) => hasClimateData(p) || heightClass(p) === 'front');
  let evals = new Map(cands.map((p) => [p.id, evaluate(p, o.climate)]));
  if (depth < 0.6 || pref.short) cands = cands.filter((p) => p.h[1] <= Math.max(60, depth * 120));
  const warnings = [];
  // 「はじめて」：簡単に育つ植物だけ。少なすぎるときは「よく育つ」植物まで広げて、そのことを表示する
  if (site && skill.min > 3) {
    const easy = cands.filter((p) => evals.get(p.id).grade >= skill.min);
    const need = Math.max(8, Math.round((3 + area * 1.1) * 2));
    if (easy.length >= need) cands = easy;
    else {
      // 足りなければ「よく育つ」、それでも足りなければ「育つ」まで広げる
      const good = cands.filter((p) => evals.get(p.id).grade >= 5);
      const add = good.length >= need ? 'よく育つ' : 'よく育つ・育つ';
      cands = good.length >= need ? good : cands.filter((p) => evals.get(p.id).grade >= 4);
      warnings.push(`この場所の条件（日当たり・土・気候・希望）では「簡単に育つ」植物が${new Set(easy.map((p) => p.group)).size}種しかないため、「${add}」植物も加えました。`);
    }
  }
  // 「ふつう」：「育ちにくい」植物は使わない。候補が足りないときだけ加え、そのことを表示する
  if (site && skillId === 'standard') {
    const ok = cands.filter((p) => evals.get(p.id).grade >= 4);
    const need = Math.max(8, Math.round((3 + area * 1.1) * 2));
    if (ok.length >= need) cands = ok;
    else if (cands.length > ok.length) warnings.push(`この場所の条件（日当たり・土・気候・希望）では「育つ」以上の植物が${new Set(ok.map((p) => p.group)).size}種しかないため、「育ちにくい」植物も候補に入れています（理由は植物ごとに表示）。`);
  }
  const monthsWanted = [...pref.season];

  // ---------- スコア（100点満点の目安）----------
  // 気候への適合度 30・希望との一致 25・生物多様性 10・手間とコスト 10 は植物ごとに決まる点。
  // 開花リレーの穴埋め 15・構造の多様さ 10 は、選んでいる途中のプラン全体を見て加える（下の選定ループ）。
  const W8 = { climate: 30, wish: 25, relay: 15, structure: 10, bio: 10, care: 10 };
  const score = (p) => {
    const why = [];
    // 気候への適合度：ゾーンの範囲の真ん中ほど高い。その地域でこそ育つ植物は積極的に加点
    const regional = site ? regionalKind(p, o.climate, site) : null;
    const cf = site ? climateFit(p, o.climate, site) : 0.5;
    const grade = site ? (evals.get(p.id) || evaluate(p, o.climate)).grade : null;
    // 育てやすさ：ふつうは「育ちにくい」を下げ、慣れている・挑戦したいは下げない
    const gradeAdj = grade == null ? 0 : skillId === 'standard' ? { 6: 3, 5: 2, 4: 0, 3: -8 }[grade] ?? 0 : skillId === 'beginner' ? { 6: 3, 5: 0 }[grade] ?? 0 : { 6: 2, 5: 1, 4: 0, 3: -3 }[grade] ?? 0; // 慣れている・挑戦したいも、同じ条件なら育てやすいほうを少し優先
    const climateS = Math.max(0, W8.climate * Math.min(1, cf * 0.7 + (regional ? 0.45 : 0)) + gradeAdj);
    // 希望との一致
    let wish = 0;
    const tagHits = p.tags.filter((t) => pref.tags.has(t));
    wish += Math.min(2, tagHits.length) * 6;
    if (pref.tags.size && !tagHits.length) wish -= pref.tags.has('herb') || pref.tags.has('medicinal') ? 18 : 9; // ハーブ園・薬草園は、その植物が中心になるように
    let colorHit = null;
    if (pref.colors.size) {
      const hits = p.color.filter((c) => pref.colors.has(c));
      if (hits.length) { wish += 8 + (2 * hits.length) / p.color.length; colorHit = hits[0]; }
      else if (p.form !== 'grass' && p.color[0] !== 'green') wish -= 10;
    }
    const inSeason = monthsWanted.filter((m) => p.bloom.includes(m));
    if (inSeason.length) wish += 6;
    if (pref.leaf.size && pref.leaf.has(p.leaf)) { wish += 3; why.push(LEAF[p.leaf]?.ja || '葉色'); }
    if (pref.longbloom) wish += Math.max(0, p.bloom.length - 3) * 1.2;
    if (pref.tall && p.h[1] >= 100) wish += 2;
    const roleHit = [...pref.roles, ...(o.roles || [])].filter((r) => p.roles?.includes(r));
    if (roleHit.length) wish += 6;
    if (pref.veg && p.harvest?.length) wish += 3;
    if (k.winter && (p.tags.includes('evergreen') || p.uses?.includes('winter') || p.uses?.includes('seed'))) wish += 3;
    if (o.palette?.includes(p.id)) wish += 7; // 庭まるごと：ほかの花壇と同じ植物をくり返す（リピート）
    if (style.bonus) wish += style.bonus(p) * 1.5;
    if (skillId === 'skilled' || skillId === 'challenge') wish += popularity(p) * 5; // 人気の植物（品種が多い）を少し優先
    // 低予算の希望：1㎡あたりの苗代が安いほど高く（希望との一致として扱う）
    const perSqm0 = p.price / (p.spread / 100) ** 2;
    if (pref.budget) wish -= Math.min(16, perSqm0 / 350);
    // 呼びたい生き物（蝶・蜂・野鳥など）の希望
    if (wild.length) wish += Math.min(8, wildScore(p, wild, o.climate) * 2.5);
    wish = Math.max(-12, Math.min(W8.wish, wish));
    // 生物多様性：蜜源・食草・実もの（野鳥）・在来種
    let bio = 0;
    if (p.tags.includes('pollinator')) bio += 4;
    if (p.tags.includes('native')) bio += 3;
    if (p.uses?.includes('bird') || p.uses?.includes('seed')) bio += 2;
    const ws = wildScore(p, wild, o.climate);
    bio = Math.min(W8.bio, bio + ws * 2);
    // 手間とコスト：1㎡あたりの苗代（価格 ÷ 株間²）と、手間いらずの希望
    const perSqm = p.price / (p.spread / 100) ** 2;
    let care = W8.care - Math.min(6, perSqm / (pref.budget ? 900 : 3000)) - (pref.budget ? p.price / 500 : 0);
    if (pref.tags.has('easy') && !p.tags.includes('easy')) care -= 4;
    if (site?.coastal && p.tags.includes('salt')) care += 3; // 海に近い庭では潮風に強い植物を優先
    care = Math.max(0, Math.min(W8.care, care));
    // 選定の理由（すべて図鑑のデータと気象データから）
    if (site) why.push(climateReason(p, o.climate, site));
    if (regional) why.push(REGIONAL_JA[regional]);
    if (p.tags.includes('pollinator')) why.push('蜜源');
    if (tagHits.length) why.push(...tagHits.filter((t) => t !== 'pollinator').map((t) => TAG_REASON[t]));
    if (roleHit.length) why.push(ROLE_REASON[roleHit[0]]);
    if (ws >= 1.2) why.push(`${wild.map((g) => WILD_GOALS[g]).join('・')}を呼ぶ`);
    if (site?.coastal && p.tags.includes('salt')) why.push('潮風に強い');
    if (p.tags.includes('native') && !tagHits.includes('native')) why.push('日本の在来種');
    if (o.palette?.includes(p.id)) why.unshift('庭全体でくり返す');
    if (style.why) why.push(...style.why(p));
    const s = climateS + wish + bio + care;
    return { s, why: [...new Set(why.filter(Boolean))], parts: { climate: climateS, wish, bio, care }, regional };
  };
  const scored = cands.map((p) => ({ p, ...score(p) }));

  // 種類数と層の目標
  const n = Math.max(3, Math.min(16, Math.round((3 + area * 1.1) * (style.speciesFactor || 1) * (VARIETY[k.variety]?.k || 1))));
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

  // こだわり：入れたい植物は先に入れる（条件に合わない場合は注意を出す）
  for (const id of k.must) {
    const p = PLANTS.find((q) => q.id === id);
    if (!p || picked.some((x) => x.plant.group === p.group && x.plant.id === p.id)) continue;
    const L = layerOf(p);
    const ev = evaluate(p, o.climate);
    if (!p.sun.includes(sun)) warnings.push(`${p.ja}は${{ full: '日向', part: '半日陰', shade: '日陰' }[sun]}が苦手です。`);
    else if (o.climate && ev.level < 2) warnings.push(`${p.ja}は、この地域の気候では育てにくい植物です（${ev.reasons[0]}）。`);
    const col = palette.size ? pickColor(p) : chosenColor(p, pref);
    colorUse[col] = (colorUse[col] || 0) + 1;
    count[L] = (count[L] ?? 0) + 1;
    forms[p.form] = (forms[p.form] || 0) + 1;
    p.bloom.map((m) => localMonth(m, south)).forEach((m) => covered.add(m));
    picked.push({ plant: p, layer: L, color: col, level: ev.level, why: ['指定した植物', ...(score(p).why || [])], score: 99, must: true });
    const j = pool.findIndex((c) => c.p.id === p.id);
    if (j >= 0) pool.splice(j, 1);
  }
  const nAll = Math.max(n, picked.length + 2);
  const heights = {};
  const leafUse = {};
  const genusOf = (p) => p.latin.replace(/^×\s*/, '').split(/[\s']/)[0];
  const genusCap = Math.max(1, Math.floor(nAll * 0.3));
  const genusUse = {};
  picked.forEach((x) => { const g = genusOf(x.plant); genusUse[g] = (genusUse[g] || 0) + 1; });
  const famUse = {};
  // 花色の比率：指定色の花が7割前後、差し色は3割まで
  const flowering = (p) => p.form !== 'grass' && p.form !== 'fern' && p.color[0] !== 'green' && p.bloom.length;
  const colorStat = () => {
    const fl = picked.filter((x) => flowering(x.plant));
    return { all: fl.length, hit: fl.filter((x) => pref.colors.has(x.color)).length };
  };
  const tgtMonths = k.months.map((m) => localMonth(m, south)); // 植物データ（北半球の月）
  const monthCount = () => { const a = Array(13).fill(0); picked.forEach((x) => x.plant.bloom.forEach((m) => a[m]++)); return a; };
  // 入れ替えてよいか（同じ種・属の上限・差し色の比率を守る）
  const okSwap = (out, p) => {
    const rest = picked.filter((x) => x !== out);
    if (rest.some((x) => x.plant.group === p.group)) return false;
    if (rest.filter((x) => genusOf(x.plant) === genusOf(p)).length >= genusCap) return false;
    if (pref.colors.size && flowering(p) && !p.color.some((c) => pref.colors.has(c))) {
      const fl = rest.filter((x) => flowering(x.plant));
      const miss = fl.filter((x) => !pref.colors.has(x.color)).length + 1;
      if (miss / (fl.length + 1) > 0.3) return false;
    }
    return true;
  };
  // 開花リレーの穴埋め・構造の多様さ（プラン全体を見て加える点）
  const dynamic = (c) => {
    const L = layerOf(c.p);
    const local = c.p.bloom.map((m) => localMonth(m, south));
    const gain = local.filter((m) => want.includes(m) && !covered.has(m)).length;
    let relay = Math.min(W8.relay, gain * 5);
    let struct = 0;
    struct += forms[c.p.form] ? -2 * forms[c.p.form] : 4;
    const hk = heightClass(c.p) + c.p.form;
    if (heights[hk]) struct -= 2.5 * heights[hk];
    if (c.p.leaf !== 'green' && !leafUse[c.p.leaf]) struct += 1.5;
    const fam = c.p.family?.ja;
    if (fam && famUse[fam]) struct -= 2 * famUse[fam]; else struct += 2;
    if (needGrass && c.p.form === 'grass' && !forms.grass) struct += 3;
    struct = Math.max(-W8.structure, Math.min(W8.structure, struct));
    // 層の目標（後景3：中景4：前景3）を守るための大きな加減点
    let v = c.s + relay + struct + ((count[L] ?? 0) < (target[L] ?? 0) ? 12 : -15);
    // 見ごろの月：指定した月より、ほかの月の開花数が多くならないように
    if (tgtMonths.length) {
      const a = monthCount();
      const tMax = Math.max(...tgtMonths.map((m) => a[m]));
      const inT = c.p.bloom.some((m) => tgtMonths.includes(m));
      if (inT) v += 4;
      else if (c.p.bloom.some((m) => a[m] + 1 > tMax)) v -= 30;
    }
    if (palette.size > 1) {
      const col = pickColor(c.p);
      if (palette.has(col)) v += 3 - (colorUse[col] || 0) * 1.5;
    }
    return { v, fills: local.filter((m) => want.includes(m) && !covered.has(m)) };
  };
  // 選んではいけない組み合わせ（同じ種の品種の重複・同じ属が3割を超える・差し色が3割を超える）
  const blocked = (c) => {
    if (picked.some((x) => x.plant.group === c.p.group)) return true;
    if ((genusUse[genusOf(c.p)] || 0) >= genusCap) return true;
    if (pref.colors.size && flowering(c.p) && !c.p.color.some((x) => pref.colors.has(x))) {
      const st = colorStat();
      if ((st.all - st.hit + 1) / (st.all + 1) > 0.3) return true;
    }
    return false;
  };
  // 重み付き抽選：その時点の最高点から BAND 点以内の候補だけを、点数を重みにして選ぶ。
  // 点の低い候補が紛れ込まないよう、最高点から BAND 点を超えて低い候補は抽選に入れない（＝候補群の下限）。
  const BAND = o.band ?? 17;
  while (picked.length < nAll && pool.length) {
    const ev = pool.filter((c) => !blocked(c)).map((c) => ({ c, ...dynamic(c) }));
    if (!ev.length) break;
    const top = Math.max(...ev.map((x) => x.v));
    const group = ev.filter((x) => x.v >= top - BAND);
    const weights = group.map((x) => x.v - (top - BAND) + 1);
    let r = rand() * weights.reduce((t, w) => t + w, 0);
    let ch = group[group.length - 1];
    for (let i = 0; i < group.length; i++) { r -= weights[i]; if (r <= 0) { ch = group[i]; break; } }
    const best = ch.c;
    pool.splice(pool.indexOf(best), 1);
    const L = layerOf(best.p);
    const local = best.p.bloom.map((m) => localMonth(m, south));
    const fills = ch.fills;
    local.forEach((m) => covered.add(m));
    count[L] = (count[L] ?? 0) + 1;
    forms[best.p.form] = (forms[best.p.form] || 0) + 1;
    heights[heightClass(best.p) + best.p.form] = (heights[heightClass(best.p) + best.p.form] || 0) + 1;
    leafUse[best.p.leaf] = (leafUse[best.p.leaf] || 0) + 1;
    genusUse[genusOf(best.p)] = (genusUse[genusOf(best.p)] || 0) + 1;
    if (best.p.family?.ja) famUse[best.p.family.ja] = (famUse[best.p.family.ja] || 0) + 1;
    const why = [...best.why];
    if (fills.length && picked.length) why.push(`${fills.sort((a, b) => a - b).map((m) => m + '月').join('・')}の花を担当`);
    const color = palette.size ? pickColor(best.p) : chosenColor(best.p, pref);
    colorUse[color] = (colorUse[color] || 0) + 1;
    picked.push({ plant: best.p, layer: L, color, level: evals.get(best.p.id).level, why: [...new Set(why)], score: best.s, regional: best.regional });
  }
  // グラスの地模様が要のスタイルでは、グラスを必ず1種入れる
  if (style.needsGrass && !picked.some((x) => x.plant.form === 'grass' && x.layer === 'matrix')) {
    const g = scored.filter((c) => c.p.form === 'grass' && layerOf(c.p) === 'matrix' && okSwap(null, c.p)).sort((a, b) => b.s - a.s)[0];
    const L = g && layerOf(g.p);
    const out = g && (picked.filter((x) => !x.must && x.layer === L)[0] || picked.filter((x) => !x.must).sort((a, b) => a.score - b.score)[0]);
    if (out) picked.splice(picked.indexOf(out), 1, { plant: g.p, layer: L, color: g.p.color[0], level: evals.get(g.p.id).level, why: ['地模様のグラス', ...g.why], score: g.s });
  }
  // 指定された役割（グラウンドカバーなど）の植物が入っていなければ、同じ層の植物と入れ替える
  for (const need of new Set([...pref.roles, ...(o.roles || [])])) {
    if (picked.some((x) => x.plant.roles?.includes(need))) continue;
    const cand = scored.filter((c) => c.p.roles?.includes(need) && okSwap(null, c.p)).sort((a, b) => b.s - a.s)[0];
    if (!cand) continue;
    const L = layerOf(cand.p);
    const same = picked.filter((x) => !x.must && x.layer === L && !x.plant.roles?.some((r) => pref.roles.has(r) || o.roles?.includes(r)));
    const pickable = same.length ? same : picked.filter((x) => !x.must);
    if (!pickable.length) continue;
    const out = pickable.reduce((a, b) => (b.score < a.score ? b : a));
    picked.splice(picked.indexOf(out), 1, { plant: cand.p, layer: L, color: palette.size ? pickColor(cand.p) : chosenColor(cand.p, pref), level: evals.get(cand.p.id).level, why: [ROLE_REASON[need], ...cand.why], score: cand.s });
  }

  // こだわり：とくに咲かせたい月が、プランの開花のピークになるよう入れ替える
  if (k.months.length) {
    const tgt = k.months.map((m) => localMonth(m, south)); // 植物データ（北半球の月）
    const cnt = () => { const a = Array(13).fill(0); picked.forEach((x) => x.plant.bloom.forEach((m) => a[m]++)); return a; };
    for (let it = 0; it < picked.length; it++) {
      const a = cnt();
      const tMax = Math.max(...tgt.map((m) => a[m]));
      const others = a.map((v, m) => (m && !tgt.includes(m) ? v : 0));
      const oMax = Math.max(...others);
      if (tMax >= oMax + (o.peakMargin || 0)) break;
      const peakM = others.indexOf(oMax);
      const outs = picked.filter((x) => !x.must && !x.plant.bloom.some((m) => tgt.includes(m)) && x.plant.bloom.includes(peakM) && !(style.needsGrass && x.plant.form === 'grass' && x.layer === 'matrix'));
      let done = false;
      for (const out of outs.sort((a2, b2) => a2.score - b2.score)) {
        const inn = scored.filter((c2) => c2.p.bloom.some((m) => tgt.includes(m)) && layerOf(c2.p) === out.layer && okSwap(out, c2.p)).sort((a2, b2) => b2.s - a2.s)[0];
        if (!inn) continue;
        picked.splice(picked.indexOf(out), 1, { plant: inn.p, layer: out.layer, color: palette.size ? pickColor(inn.p) : chosenColor(inn.p, pref), level: evals.get(inn.p.id).level, why: [...inn.why], score: inn.s });
        done = true;
        break;
      }
      if (!done) break;
    }
  }

  // セミオート：利用者が選んだ植物に差し替える（枠の役割・配置はそのまま）
  picked.forEach((x) => { x.orig = x.plant.id; });
  for (const x of picked) {
    const to = o.swaps?.[x.orig];
    if (!to || to === x.plant.id) continue;
    const p = PLANTS.find((q) => q.id === to);
    if (!p) continue;
    x.plant = p;
    x.color = palette.size ? pickColor(p) : chosenColor(p, pref);
    x.level = evaluate(p, o.climate).level;
    x.why = ['自分で選んだ植物', ...score(p).why];
    x.chosen = true;
  }

  // 「挑戦したい」：工夫すれば育てられる人気の植物を、全体の3割まで入れる（工夫のしかたを理由と注意に表示）
  if (skill.tough && site && !challengers.length) warnings.push('この場所の条件（日当たり・土・気候・希望）では、「育てるには工夫が必要」な植物の候補がありませんでした。気候に合う植物だけで作っています。');
  if (skill.tough && challengers.length) {
    const room = Math.floor(picked.length * skill.tough);
    const ch = challengers.filter((p) => okSwap(null, p))
      .map((p) => ({ p, ...score(p), pop: popularity(p) })).sort((a2, b2) => b2.pop - a2.pop || b2.s - a2.s);
    for (let i = 0; i < room && ch.length; i++) {
      const c = ch.shift();
      if (picked.some((x) => x.plant.group === c.p.group)) { i--; continue; }
      const L = layerOf(c.p);
      const outs = picked.filter((x) => !x.must && !x.chosen && !x.challenge && x.layer === L && okSwap(x, c.p)).sort((a2, b2) => a2.score - b2.score);
      if (!outs.length) { i--; continue; }
      const ev = evaluate(c.p, o.climate);
      picked.splice(picked.indexOf(outs[0]), 1, { plant: c.p, layer: L, color: palette.size ? pickColor(c.p) : chosenColor(c.p, pref), level: 1, grade: 2, challenge: true, why: ['工夫が必要（挑戦）', `工夫：${ev.tips[0]}`, ev.fails[0].text], score: c.s, orig: c.p.id });
      warnings.push(`挑戦：${c.p.ja}は、この場所ではそのままでは育ちません（${ev.fails.map((f) => f.text).join('／')}）。工夫：${ev.tips.join('／')}。`);
    }
  }
  // 選定理由の仕上げ：割り当てた花色と、見ごろの月を、気候の理由のすぐ後に入れる（どちらも図鑑のデータどおり）
  const COLOR_WHY = /^(\d+月の.+花|.+の花|\d+月に咲く)$/;
  for (const x of picked) {
    if (x.challenge) continue;
    if (site) x.grade = evaluate(x.plant, o.climate).grade;
    const base = x.why.filter((w) => !COLOR_WHY.test(w));
    const sm = tgtMonths.length ? tgtMonths.find((m) => x.plant.bloom.includes(m)) : [...pref.season].find((m) => x.plant.bloom.includes(m));
    const col = x.plant.color.includes(x.color) && x.color !== 'green' ? COLORS[x.color].ja : null;
    const cw = sm && col && pref.colors.has(x.color) ? `${localMonth(sm, south)}月の${col}花` : col && pref.colors.has(x.color) ? `${col}の花` : sm ? `${localMonth(sm, south)}月に咲く` : null;
    const i = base.findIndex((w) => /^(ゾーン|ヒートゾーン)/.test(w));
    if (cw) base.splice(i >= 0 ? i + 1 : Math.min(1, base.length), 0, cw);
    x.why = [...new Set(base)].slice(0, 4);
  }

  // 配置
  const island = shapeId === 'custom' ? o.view === 'island' : mask ? (['circle', 'oval'].includes(shapeId) || (o.view === 'island' && shapeId === 'kidney')) : o.view === 'island';
  // 春咲きの球根は、花後に葉が消えるので専用の場所をとらず、宿根草の株間に群れで植え込む
  const under = (p) => p.type === 'bulb' && Math.min(...p.bloom) <= 5 && !style.potager;
  const doLayout = () => {
    const main = picked.filter((x) => !under(x.plant));
    const bulbs = picked.filter((x) => under(x.plant));
    const lay = main.length ? (style.layout === 'bands' || style.layout === 'gradient'
      ? (mask ? layoutBedShaped(main, width, depth, island, rand, style.layout === 'gradient', mask) : layoutBed(main, width, depth, island, rand, style.layout === 'gradient'))
      : style.layout === 'composition' ? layoutComposition(main, width, depth, island, rand, mask || polygonMask([[[0, 0], [width, 0], [width, depth], [0, depth]]], width, depth))
      : style.layout === 'potager' ? layoutPotager(main, width, depth, island, rand)
        : layoutNatural(main, width, depth, island, rand, style, mask)) : { bands: [], positions: [] };
    if (mask) fitToShape(lay.positions, mask, rand);
    if (style.layout === 'bands' || style.layout === 'gradient') thinClose(lay.positions, main);
    return { main, bulbs, lay, bulbPos: interplantBulbs(bulbs, width, depth, island, rand, mask) };
  };
  let { main, bulbs, lay, bulbPos } = doLayout();
  // 株のまとまり：群れで植える植物（3〜5株の群れ以上）が1〜2株ずつに散らばるときは、花壇の広さに対して種類が多すぎる。
  // 種類を減らして配置し直し、1種あたりの株数を確保する（1株で目立たせる低木・主役、指定・自分で選んだ植物は対象外）
  if (!['potager', 'composition'].includes(style.layout)) {
    for (let it = 0; it < 8; it++) {
      const thin = main.filter((x, i) => !x.must && !x.chosen && !x.challenge && !(style.needsGrass && x.layer === 'matrix' && x.plant.form === 'grass' && main.filter((y) => y.layer === 'matrix' && y.plant.form === 'grass').length <= 1) && (x.plant.soc ?? 3) >= 3 && lay.positions[i].length < 3 && main.filter((y) => y.layer === x.layer).length > 1);
      if (!thin.length || picked.length <= 4) break;
      const key = (x) => (tgtMonths.some((m) => x.plant.bloom.includes(m)) ? 2 : 0) + (pref.colors.has(x.color) ? 1 : 0) + x.score / 1000;
      const out = thin.sort((a2, b2) => key(a2) - key(b2))[0];
      picked.splice(picked.indexOf(out), 1);
      ({ main, bulbs, lay, bulbPos } = doLayout());
    }
  }
  // 種類を減らしたあとも、「工夫が必要」な植物が決めた割合を超えないように
  while (picked.filter((x) => x.challenge).length > Math.floor(picked.length * (skill.tough || 0))) {
    const ch = picked.filter((x) => x.challenge).pop();
    picked.splice(picked.indexOf(ch), 1);
    warnings.splice(warnings.findIndex((w) => w.includes(ch.plant.ja)), 1);
    ({ main, bulbs, lay, bulbPos } = doLayout());
  }
  const layout = { bands: lay.bands, plots: lay.plots, positions: picked.map((x) => (under(x.plant) ? bulbPos[bulbs.indexOf(x)] : lay.positions[main.indexOf(x)])) };
  const species = picked.map((s, i) => ({ ...s, role: under(s.plant) ? 'under' : s.layer, roleJa: under(s.plant) ? '株間に植え込む球根' : ROLE_JA[s.layer], no: i + 1, positions: layout.positions[i], qty: layout.positions[i].length }));
  // 番号は役割の順（後景→前景、骨格→地模様など）に振り直す
  const ORDER = ['back', 'scatter', 'structure', 'point', 'accent', 'crop', 'middle', 'block', 'theme', 'line', 'front', 'edge', 'matrix', 'ground', 'plane', 'under'];
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
  // 指定した見ごろの月と、実際のピーク
  let peakNote = null;
  if (k.months.length) {
    const mx = Math.max(...counts);
    const best = Math.max(...k.months.map((m) => counts[m - 1]));
    const peaks = counts.map((v, i) => (v === mx ? i + 1 : 0)).filter(Boolean);
    peakNote = best >= mx
      ? { ok: true, text: `指定した${k.months.join('・')}月が開花のピークです（${best}種が咲きます）。` }
      : { ok: false, text: `${k.months.join('・')}月に咲くのは${best}種で、ピークは${peaks.join('・')}月（${mx}種）になりました。日当たり・土・気候の条件に合い、${k.months.join('・')}月に咲く植物の候補が足りないためです。` };
  }

  const harvest = Array(12).fill(0);
  species.forEach((s) => (s.plant.harvest || []).forEach((m) => harvest[localMonth(m, south) - 1]++));

  const roleCount = {};
  for (const sp of species) for (const r of sp.plant.roles || []) roleCount[r] = (roleCount[r] || 0) + 1;

  return {
    harvest, plots: layout.plots, roleCount, warnings, k, peakNote, skill: skillId,
    gradeCount: species.reduce((t, x) => { if (x.grade) t[x.grade] = (t[x.grade] || 0) + 1; return t; }, {}),
    width, depth, area, shape: shapeId, outline: shapeId === 'custom' ? mask.loops : undefined, sun, moist, view: island ? 'island' : 'border', pref, style: styleId, wild,
    species, bands: layout.bands, counts, peak,
    gaps: want.filter((m) => !counts[m - 1]),
    cost: { plants: plantsCost, extras, total, perSqm: Math.round(total / area), budget: Number(o.budget) || null },
    totalPlants: species.reduce((t, s) => t + s.qty, 0),
  };
}

/** 春咲き球根を、宿根草の株間に群れ（5〜9球）で植え込む。手前〜中ほど（アイランドは周囲）に */
export function interplantBulbs(bulbs, W, D, island, rand, mask = null) {
  const out = bulbs.map(() => []);
  if (!bulbs.length) return out;
  const clusters = Math.max(1, Math.round((W * D) / (1.6 * bulbs.length)));
  const centers = [];
  bulbs.forEach((b, i) => {
    const n = b.plant.h[1] <= 30 ? 9 : b.plant.h[1] <= 60 ? 7 : 5;
    const gap = Math.max(0.08, b.plant.spread / 100);
    for (let c = 0; c < clusters; c++) {
      let cx = 0, cy = 0;
      for (let t = 0; t < 12; t++) {
        cx = W * (0.08 + 0.84 * ((c + 0.5) / clusters + (rand() - 0.5) * 0.3)) % W;
        cy = island ? (rand() < 0.5 ? D * (0.15 + rand() * 0.2) : D * (0.65 + rand() * 0.2)) : D * (0.12 + rand() * (b.plant.h[1] > 60 ? 0.55 : 0.4));
        if (mask) { const pt = mask.place(rand(), island ? 0.15 + rand() * 0.3 : 0.12 + rand() * 0.45, island); cx = pt.x; cy = pt.y; }
        if (centers.every((q) => Math.hypot(q.x - cx, q.y - cy) > 0.45)) break;
      }
      centers.push({ x: cx, y: cy });
      for (let k = 0; k < n; k++) {
        const a = k * 2.4, r = gap * Math.sqrt(k) * 0.9;
        const pt = { x: clamp(cx + Math.cos(a) * r, 0.03, W - 0.03), y: clamp(cy + Math.sin(a) * r, 0.03, D - 0.03), under: true };
        if (!mask || mask.inside(pt.x, pt.y)) out[i].push(pt);
      }
    }
  });
  if (mask) out.forEach((arr) => { if (!arr.length) { const pt = mask.place(rand(), 0.3, island); arr.push({ ...pt, under: true }); } });
  return out;
}

/** 帯や区切りの境目で、隣の植物と近すぎる株を間引く（どの植物も最低1株は残す） */
export function thinClose(positions, picked) {
  const spr = picked.map((p) => p.plant.spread / 100);
  const order = picked.map((_, i) => i).sort((a, b) => spr[b] - spr[a]);
  const kept = [];
  for (const i of order) {
    const keep = [];
    for (const p of positions[i]) {
      const close = kept.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < ((spr[i] + spr[q.i]) / 2) * 0.62 * (GAP / PLANT_GAP));
      if (!close || !keep.length && p === positions[i][positions[i].length - 1]) { keep.push(p); kept.push({ x: p.x, y: p.y, i }); }
    }
    positions[i] = keep;
  }
}

/** 形からはみ出した株を除き、どの植物も最低1株は残す */
export function fitToShape(positions, mask, rand) {
  positions.forEach((arr, i) => {
    const keep = arr.filter((p) => mask.inside(p.x, p.y));
    if (!keep.length && arr.length) {
      // いちばん内側に近い株を、形の中へ寄せる
      const p = arr[0];
      const y = clamp(p.y, mask.lo(p.x) + 0.05, mask.hi(p.x) - 0.05);
      keep.push(mask.inside(p.x, y) ? { x: p.x, y } : mask.place(0.5, 0.5, false));
    }
    positions[i] = keep;
    void rand;
  });
}

/**
 * 曲線の形の花壇（円・楕円・半円・そら豆・曲線ボーダー）の帯状配置。
 * 縁からの深さで前景・中景・後景に分け（アイランドは中央ほど高く）、各帯の中で横方向（アイランドは周回方向）に植物を並べる。
 */
export function layoutBedShaped(picked, W, D, island, rand, gradient, mask) {
  const has = (l) => picked.some((p) => p.layer === l);
  const seq = [['front', 0.3], ['middle', 0.4], ['back', 0.3]].filter(([l]) => has(l));
  const sum = seq.reduce((t, [, f]) => t + f, 0) || 1;
  // 帯の境目は「面積」の比（前景3：中景4：後景3）で決める。アイランド花壇や曲線の花壇では、奥行きの比と面積の比が一致しないため
  const ds = [];
  for (let x = 0.025; x < W; x += Math.max(0.05, W / 120)) for (let y = 0.025; y < D; y += Math.max(0.05, D / 60)) if (mask.inside(x, y)) ds.push(mask.depthOf(x, y, island));
  ds.sort((a, b) => a - b);
  const q = (f) => (ds.length ? ds[Math.min(ds.length - 1, Math.floor(f * ds.length))] : f);
  let acc = 0;
  const bands = seq.map(([layer, f], i) => { const t0 = i === 0 ? 0 : q(acc); acc += f / sum; return { layer, t0, t1: i === seq.length - 1 ? 1.0001 : q(acc) }; });
  const positions = picked.map(() => []);
  bands.forEach((band, bi) => {
    const idx = picked.map((p, i) => (p.layer === band.layer ? i : -1)).filter((i) => i >= 0);
    let order = [...idx];
    const shift = (bi * Math.ceil(order.length / 2)) % Math.max(1, order.length);
    order = [...order.slice(shift), ...order.slice(0, shift)];
    if (gradient) {
      const sorted = [...idx].sort((a, b) => WARMTH[picked[a].color] - WARMTH[picked[b].color]);
      const left = [], right = [];
      sorted.forEach((i, k) => (k % 2 ? right : left).push(i));
      order = [...left, ...right.reverse()];
    }
    const ring = island ? 2 * Math.PI * Math.sqrt(mask.area / Math.PI) * (1 - (band.t0 + band.t1) / 2) : W;
    const repeat = !gradient && order.length >= 2 && ring / (idx.reduce((t, i) => t + picked[i].plant.spread, 0) / 100) >= 1.8;
    if (repeat) { const half = Math.ceil(order.length / 2); order = [...order, ...order.slice(half), ...order.slice(0, half)]; }
    const weights = order.map((i) => picked[i].plant.spread);
    const wsum = weights.reduce((a, b) => a + b, 0) || 1;
    const last = bi === bands.length - 1;
    // 帯ごとに共通の六角格子（帯の植物の株張りの中央値 × 係数）を敷き、横方向の区切りで植物に振り分ける（細い区切りでも株が抜けない）
    const sp = idx.map((i) => picked[i].plant.spread / 100).sort((a, b) => a - b);
    const grid = hexFill({ x0: 0, x1: W, y0: 0, y1: D }, (sp[Math.floor(sp.length / 2)] || 0.4) * GAP, rand)
      .filter((p) => { if (!mask.inside(p.x, p.y)) return false; const d = mask.depthOf(p.x, p.y, island); return d >= band.t0 && (d < band.t1 || (last && d <= 1)); });
    let f = island ? rand() : 0;
    const segs = order.map((i, k) => { const w = weights[k] / wsum; const s0 = { i, f0: f, f1: f + w }; f += w; return s0; });
    const inSeg = (g, x, y) => { let l = mask.latOf(x, y, island); if (island && l < g.f0) l += 1; return l >= g.f0 && l < g.f1; };
    for (const p of grid) {
      const g = segs.find((q) => inSeg(q, p.x, p.y)) || segs[segs.length - 1];
      positions[g.i].push(p);
    }
    for (const g of segs) if (!positions[g.i].length) positions[g.i].push(mask.place(island ? ((g.f0 + g.f1) / 2) % 1 : (g.f0 + g.f1) / 2, (band.t0 + band.t1) / 2, island));
  });
  return { bands: [], positions };
}

/**
 * セミオート：プランのある枠（植物）に合う、ほかの候補。
 * 同じ日当たり・湿り気・気候で育ち、同じ役割（スタイルの層・高さの段）に入る植物を、似た大きさ順に並べる。
 */
export function slotCandidates(plan, no, o = {}) {
  const sp = plan.species.find((x) => x.no === no);
  if (!sp) return [];
  const style = STYLES[plan.style] || STYLES.border;
  const used = new Set(plan.species.filter((x) => x !== sp).map((x) => x.plant.group));
  const h = sp.plant.h[1];
  const roleOk = (p) => {
    if (sp.role === 'under') return p.type === 'bulb' && Math.min(...p.bloom) <= 5;
    if (p.type === 'bulb' && Math.min(...p.bloom) <= 5 && !style.potager) return false;
    return style.roleOf ? style.roleOf(p) === sp.layer : heightClass(p) === sp.layer;
  };
  const list = PLANTS.filter((p) => p.id !== sp.plant.id && !used.has(p.group) && !p.custom
    && p.sun.includes(plan.sun) && (!plan.moist || p.moist.includes(plan.moist))
    && (o.annuals || style.cottage || style.potager || p.type !== 'annual')
    && (style.potager || !p.tags.includes('veg')) && !KITCHEN_ONLY.has(p.group) && (!style.filter || style.filter(p))
    && roleOk(p) && p.h[1] >= h * 0.55 && p.h[1] <= h * 1.6)
    .map((p) => {
      const ev = evaluate(p, o.climate);
      const sim = Math.abs(Math.log(p.h[1] / h)) + Math.abs(Math.log(p.spread / sp.plant.spread)) * 0.7;
      const same = [];
      if (p.form === sp.plant.form) same.push('同じ形');
      if (p.color.some((c) => sp.plant.color.includes(c))) same.push('同じ色');
      if (p.bloom.some((m) => sp.plant.bloom.includes(m))) same.push('同じ時期に咲く');
      return { p, level: ev.level, same, s: (o.climate ? ev.level * 1.5 : 3) - sim * 2 + same.length * 0.3 };
    })
    .filter((x) => !o.climate || x.level >= 2)
    .sort((a, b) => b.s - a.s);
  // 同じ種の品種は3つまで
  const per = {};
  return list.filter((x) => (per[x.p.group] = (per[x.p.group] || 0) + 1) <= 3).slice(0, 36);
}

/**
 * 点・線・面の構成。
 * 点：形の強い植物を、間をあけた「点」に1株（2〜3株の小群）ずつ。背の高いものほど奥（アイランドは中央寄り）。
 * 線：いちばん低い線の植物で手前の縁（アイランドは外周）を縁取り、ほかの線の植物は花壇を斜めに横切るリボン状に。
 * 面：残りを、地を覆う植物の大きな群れ（ボロノイの面）で埋める。
 */
export function layoutComposition(picked, W, D, island, rand, mask) {
  const positions = picked.map(() => []);
  const spr = picked.map((p) => p.plant.spread / 100);
  const occ = []; // { x, y, i }
  const free = (x, y, i, k = 0.9) => mask.inside(x, y) && occ.every((q) => Math.hypot(q.x - x, q.y - y) >= ((spr[i] + spr[q.i]) / 2) * GAP * k);
  const put = (x, y, i) => { positions[i].push({ x, y }); occ.push({ x, y, i }); };
  const of = (role) => picked.map((p, i) => (p.layer === role ? i : -1)).filter((i) => i >= 0);
  const pts = of('point').sort((a, b) => picked[b].plant.h[1] - picked[a].plant.h[1]);
  const lines = of('line').sort((a, b) => picked[a].plant.h[1] - picked[b].plant.h[1]);
  const planes = of('plane');
  const area = mask.area;
  // ---- 点 ----
  if (pts.length) {
    const K = Math.max(pts.length, Math.min(16, Math.round(area * 0.45)));
    const minD = Math.max(0.9, Math.sqrt(area / K) * 0.85);
    const spots = [];
    for (let t = 0; t < K * 40 && spots.length < K; t++) {
      const i = pts[spots.length % pts.length];
      const h = clamp((picked[i].plant.h[1] - 50) / 150, 0, 1);
      const p = mask.place(rand(), island ? 0.45 + h * 0.45 + (rand() - 0.5) * 0.2 : 0.35 + h * 0.5 + (rand() - 0.5) * 0.2, island);
      if (!mask.inside(p.x, p.y) || spots.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < minD)) continue;
      spots.push({ ...p, i });
    }
    for (const sp of spots) {
      const n = (picked[sp.i].plant.soc || 2) <= 1 ? 1 : 3;
      const g = spr[sp.i] * GAP;
      const cand = n === 1 ? [[0, 0]] : [[0, 0], [g, 0], [g / 2, g * 0.87]].map(([dx, dy]) => [dx - g / 2, dy - g * 0.29]);
      for (const [dx, dy] of cand) if (free(sp.x + dx, sp.y + dy, sp.i)) put(sp.x + dx, sp.y + dy, sp.i);
    }
  }
  // 縁取りに使う線の植物（いちばん低く、50cm以下）。リボンを先に置き、縁取りはそのあと
  const edgeI = lines.length && picked[lines[0]].plant.h[1] <= 50 ? lines[0] : -1;
  const ribbons = edgeI >= 0 ? lines.slice(1) : lines;
  // ---- 線（リボン） ----
  if (ribbons.length) {
    const reps = area >= 8 && ribbons.length <= 3 ? 2 : 1;
    const list = [];
    for (let r = 0; r < reps; r++) ribbons.forEach((i) => list.push(i));
    list.forEach((i, j) => {
      const m = list.length;
      const fc = (j + 0.5) / m;
      const len = island ? 0.28 : Math.min(0.6, 1.6 / m + 0.2);
      const dir = j % 2 ? 1 : -1;
      const t0 = island ? 0.25 + rand() * 0.2 : 0.2 + rand() * 0.15, t1 = island ? 0.55 + rand() * 0.25 : 0.7 + rand() * 0.15;
      const ph = rand() * 6.28;
      const line = [];
      for (let u = 0; u <= 1.0001; u += 0.05) {
        const f = island ? (fc + dir * (u - 0.5) * len + 1) % 1 : clamp(fc + (u - 0.5) * len, 0.02, 0.98);
        const t = clamp(t0 + (t1 - t0) * (dir > 0 ? u : 1 - u) + 0.06 * Math.sin(u * 9 + ph), 0.05, 0.95);
        line.push(mask.place(f, t, island));
      }
      const half = Math.max(0.3, spr[i] * 1.1);
      const segD = (x, y) => { let d = Infinity; for (let k = 1; k < line.length; k++) { const a = line[k - 1], b = line[k]; const vx = b.x - a.x, vy = b.y - a.y; const L2 = vx * vx + vy * vy || 1e-6; const t = clamp(((x - a.x) * vx + (y - a.y) * vy) / L2, 0, 1); d = Math.min(d, Math.hypot(x - a.x - t * vx, y - a.y - t * vy)); } return d; };
      for (const p of hexFill({ x0: 0, x1: W, y0: 0, y1: D }, spr[i] * GAP, rand)) if (segD(p.x, p.y) <= half && free(p.x, p.y, i)) put(p.x, p.y, i);
    });
  }
  // ---- 線（縁取り） ----
  if (edgeI >= 0) {
    const e = edgeI;
    const g = spr[e] * GAP;
    for (const p of hexFill({ x0: 0, x1: W, y0: 0, y1: D }, g, rand)) {
      if (!mask.inside(p.x, p.y)) continue;
      const out = island ? [[g, 0], [-g, 0], [0, g], [0, -g]].some(([dx, dy]) => !mask.inside(p.x + dx * 0.9, p.y + dy * 0.9)) : !mask.inside(p.x, p.y - g * 0.9);
      if (out && free(p.x, p.y, e)) put(p.x, p.y, e);
    }
  }
  // ---- 面 ----
  const fillers = planes.length ? planes : lines.length ? lines : picked.map((_, i) => i);
  const s = (fillers.map((i) => spr[i]).sort((a, b) => a - b)[Math.floor(fillers.length / 2)] || 0.4) * GAP;
  const centers = [];
  fillers.forEach((i) => { for (let c = 0; c < (area >= 6 ? 2 : 1); c++) centers.push({ i, ...mask.place(rand(), 0.15 + rand() * 0.7, island) }); });
  for (const p of hexFill({ x0: 0, x1: W, y0: 0, y1: D }, s, rand)) {
    if (!mask.inside(p.x, p.y)) continue;
    let best = centers[0], bd = Infinity;
    for (const c of centers) { const d = Math.hypot(c.x - p.x, (c.y - p.y) * 1.3); if (d < bd) { bd = d; best = c; } }
    if (best && free(p.x, p.y, best.i, 0.85)) put(p.x, p.y, best.i);
  }
  // どの植物も最低1株：空いている場所を探して置く（見つからなければ、いちばん近い株と入れ替える）
  positions.forEach((arr, i) => {
    if (arr.length) return;
    for (let t = 0; t < 60; t++) { const p = mask.place(rand(), 0.2 + rand() * 0.6, island); if (free(p.x, p.y, i)) { put(p.x, p.y, i); return; } }
    const donor = positions.reduce((b, a, j) => (a.length > positions[b].length ? j : b), 0);
    if (positions[donor].length > 1) arr.push(positions[donor].splice(Math.floor(rand() * positions[donor].length), 1)[0]);
    else arr.push(mask.place(rand(), 0.5, island));
  });
  return { bands: [], positions };
}

/**
 * ポタジェの配置：花壇を手の届く大きさの区画に分け、区画の中に野菜、縁にハーブや花、中心にアクセント。
 * 区画の間は細い通路（植えない）。
 */
export function layoutPotager(picked, W, D, island, rand) {
  const idxOf = (role) => picked.map((p, i) => (p.layer === role ? i : -1)).filter((i) => i >= 0);
  const crops = idxOf('crop'), edges = idxOf('edge'), accents = idxOf('accent');
  const all = picked.map((_, i) => i);
  const gap = W >= 2.4 || D >= 2.4 ? 0.35 : 0.2;
  const nx = Math.max(1, Math.round(W / 1.8)), ny = Math.max(1, Math.round(D / 1.4));
  const pw = (W - gap * (nx - 1)) / nx, ph = (D - gap * (ny - 1)) / ny;
  const plots = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) plots.push({ x0: i * (pw + gap), y0: j * (ph + gap), x1: i * (pw + gap) + pw, y1: j * (ph + gap) + ph });
  const positions = picked.map(() => []);
  const cropList = crops.length ? crops : all;
  const edgeList = edges.length ? edges : all;
  // 背の高い野菜から順に、奥（北側）の区画へ。野菜の種類が区画より多ければ区画を左右に分ける
  const sorted = [...cropList].sort((a, b) => picked[b].plant.h[1] - picked[a].plant.h[1]);
  const order = plots.map((_, k) => k).sort((a, b) => (island ? 0 : plots[b].y0 - plots[a].y0) || a - b);
  const split = sorted.length > plots.length;
  let ci = 0;
  order.forEach((k, n) => {
    const pl = plots[k];
    const edge = edgeList[n % edgeList.length];
    pl.edge = edge;
    const es = Math.min(0.25, Math.max(0.18, picked[edge].plant.spread / 100));
    // 縁取り（通路に面した手前と奥の縁）
    const back = island || ny > 1;
    const ring = [];
    for (let x = pl.x0 + es / 2; x < pl.x1; x += es) { ring.push({ x, y: pl.y0 + es / 2 }); if (back) ring.push({ x, y: pl.y1 - es / 2 }); }
    positions[edge].push(...ring);
    const inner = { x0: pl.x0 + 0.05, x1: pl.x1 - 0.05, y0: pl.y0 + es, y1: pl.y1 - (back ? es : 0) };
    if (inner.x1 - inner.x0 <= 0.15 || inner.y1 - inner.y0 <= 0.15) return;
    const parts = split ? [{ ...inner, x1: (inner.x0 + inner.x1) / 2 }, { ...inner, x0: (inner.x0 + inner.x1) / 2 }] : [inner];
    pl.crops = [];
    parts.forEach((part, pi) => {
      const crop = sorted[ci++ % sorted.length];
      pl.crops.push(crop);
      const pts = hexFill(part, Math.min(picked[crop].plant.spread / 100, Math.max(0.2, (part.x1 - part.x0) * 0.9)), rand);
      // アクセントを区画の中心に1株
      if (accents.length && pi === 0 && n % 2 === 0 && pts.length > 2) {
        const cx = (inner.x0 + inner.x1) / 2, cy = (inner.y0 + inner.y1) / 2;
        const c = pts.reduce((bb, p) => (Math.hypot(p.x - cx, p.y - cy) < Math.hypot(bb.x - cx, bb.y - cy) ? p : bb));
        pts.splice(pts.indexOf(c), 1);
        positions[accents[(n / 2) % accents.length]].push(c);
      }
      positions[crop].push(...pts);
    });
  });
  positions.forEach((arr, i) => { if (!arr.length) { const pl = plots[Math.floor(rand() * plots.length)]; arr.push({ x: (pl.x0 + pl.x1) / 2 + (rand() - 0.5) * 0.2, y: (pl.y0 + pl.y1) / 2 }); } });
  return { bands: [], positions, plots };
}

const ROLE_REASON = { groundcover: '地面を覆う', edging: '縁取りに', screen: '目隠しに', accent: '主役になる', structure: '骨格になる', filler: 'すき間を埋める', hanging: '垂れて広がる' };

const TAG_REASON = {
  natural: 'ナチュラル', english: 'イングリッシュ', wa: '和の雰囲気', prairie: 'プレーリー', dry: '乾燥に強い',
  veg: '食べられる', shade: '日陰向き', pollinator: '蝶・蜂が来る', fragrant: '香り', evergreen: '冬も緑', easy: '手間いらず', herb: 'ハーブ', medicinal: '薬用植物', native: '在来種',
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
    const seq = [['front', 0.3], ['middle', 0.4], ['back', 0.3]].filter(([l]) => has(l));
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
      positions[i].push(...hexFill(seg, (picked[i].plant.spread / 100) * GAP, rand));
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
export function layoutNatural(picked, W, D, island, rand, style, mask = null) {
  const spreads = picked.map((p) => p.plant.spread / 100).sort((a, b) => a - b);
  // 混ぜ植え（マトリクス・コテージ）は、スタイルの間隔の係数がすでに密植の値
  const gap = style.layout === 'intermingle' ? GAP / PLANT_GAP : GAP;
  const s = Math.min(0.8, Math.max(0.22, spreads[Math.floor(spreads.length / 2)] * (style.spacing || 1) * gap));
  const pts = [];
  const dy = s * 0.866;
  for (let r = 0, y = dy / 2; y < D; r++, y += dy) {
    for (let x = (r % 2 ? s : s / 2); x < W; x += s) {
      pts.push({ x: clamp(x + (rand() - 0.5) * s * 0.3, 0.02, W - 0.02), y: clamp(y + (rand() - 0.5) * s * 0.3, 0.02, D - 0.02), owner: -1 });
    }
  }
  if (mask) for (let k = pts.length - 1; k >= 0; k--) if (!mask.inside(pts[k].x, pts[k].y)) pts.splice(k, 1);
  if (!pts.length) pts.push({ x: W / 2, y: D / 2, owner: -1 });
  // 縁からの深さ（0=手前の縁、1=奥／中央）
  const dep = (pt) => (mask ? mask.depthOf(pt.x, pt.y, island) : island ? 1 - Math.abs(pt.y - D / 2) / (D / 2) : pt.y / D);

  // 奥行き方向の「好ましい位置」：背が高いほど奥（アイランドは中央）
  const hNorm = (p) => clamp(((p.h[0] + p.h[1]) / 2 - 15) / 140, 0, 1);
  const prefY = (p, j) => island
    ? D / 2 + (j % 2 ? 1 : -1) * (1 - hNorm(p)) * D * 0.42 * (0.6 + rand() * 0.4)
    : D * clamp(0.12 + hNorm(p) * 0.78 + (rand() - 0.5) * 0.15, 0.08, 0.92);

  const idxOf = (role) => picked.map((p, i) => (p.layer === role ? i : -1)).filter((i) => i >= 0);
  const pickFrom = (arr) => arr[Math.floor(rand() * arr.length)];

  if (style.layout === 'intermingle') {
    // 3層を比率に従って混ぜ植え。同じ植物は2〜3株の小さな群れにする（1株ずつ散らすと景色がまとまらない）
    const roles = Object.entries(style.roleShare).filter(([r]) => idxOf(r).length);
    const total = roles.reduce((t, [, w]) => t + w, 0);
    const order = pts.map((_, k) => k).sort(() => rand() - 0.5);
    for (const k of order) {
      const pt = pts[k];
      if (pt.owner >= 0) continue;
      let u = rand() * total, role = roles[0][0];
      for (const [r, w] of roles) { if ((u -= w) <= 0) { role = r; break; } }
      // 骨格は手前の縁に置かない
      if (role === 'structure' && !island && dep(pt) < 0.25 && idxOf('theme').length) role = 'theme';
      if (role === 'structure' && island && dep(pt) < 0.4 && idxOf('theme').length) role = 'theme';
      const sp = pickFrom(idxOf(role));
      // 群れの大きさは植物の社会性（soc）で：単独で見せる植物は1株、地面を覆う植物は大きな群れ
      const clump = role === 'structure' ? 1 : [3, 1, 2, 3, 5, 7][picked[sp].plant.soc || 3];
      const near = pts.map((q, j) => ({ q, j, d: Math.hypot(q.x - pt.x, q.y - pt.y) })).filter((o) => o.q.owner < 0).sort((a, b) => a.d - b.d).slice(0, clump);
      for (const o of near) if (o.d < s * 2.2) o.q.owner = sp;
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
        if (mask) { const c = mask.place(fx, island ? 0.1 + hNorm(picked[i].plant) * 0.8 : clamp(0.12 + hNorm(picked[i].plant) * 0.78 + (rand() - 0.5) * 0.15, 0.08, 0.92), island); centers.push({ i, ...c }); continue; }
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
        const cand = pts.filter((pt) => dep(pt) > 0.3);
        for (let t = 0; t < want && cand.length; t++) cand.splice(Math.floor(rand() * cand.length), 1)[0].owner = i;
      }
    }
    if (style.layout === 'clusters') {
      // 群れの境目に砂利の余白をつくる
      for (const pt of pts) if (pt.edge < s * 0.3 && rand() < 0.6) pt.owner = -1;
    }
  }

  // 株の大きさに合わせて間隔をあける：近すぎる株は、小さな植物（地模様・グラウンドカバー）に替えるか、植えずにあけておく
  const spr = picked.map((p) => (p.plant.spread / 100) * (style.spacing || 1) * gap);
  const small = picked.map((p, i) => i).filter((i) => ['matrix', 'ground', 'edge'].includes(picked[i].layer)).sort((a, b) => spr[a] - spr[b]);
  const placed = [];
  const fits = (pt, i) => placed.every((q) => Math.hypot(q.x - pt.x, q.y - pt.y) >= ((spr[i] + spr[q.owner]) / 2) * 0.82);
  const byBig = pts.filter((pt) => pt.owner >= 0).sort((a, b) => spr[b.owner] - spr[a.owner] || rand() - 0.5);
  for (const pt of byBig) {
    if (!fits(pt, pt.owner)) {
      const alt = small.find((i) => fits(pt, i));
      if (alt == null) { pt.owner = -1; continue; }
      pt.owner = alt;
    }
    placed.push(pt);
  }
  const positions = picked.map(() => []);
  for (const pt of pts) if (pt.owner >= 0) positions[pt.owner].push({ x: pt.x, y: pt.y });
  // どの植物も最低1株は植わるように
  positions.forEach((arr, i) => {
    if (arr.length) return;
    const donor = positions.reduce((b, a, j) => (a.length > positions[b].length ? j : b), 0);
    if (positions[donor].length > 1) arr.push(positions[donor].splice(Math.floor(rand() * positions[donor].length), 1)[0]);
    else arr.push(mask ? mask.place(rand(), 0.5, island) : { x: rand() * W, y: rand() * D });
    // 入れた株のまわりで近すぎる株をよける（各植物は1株以上残す）
    const q = arr[0];
    positions.forEach((other, j) => {
      if (j === i) return;
      for (let t = other.length - 1; t >= 0 && other.length > 1; t--) if (Math.hypot(other[t].x - q.x, other[t].y - q.y) < ((spr[i] + spr[j]) / 2) * 0.82) other.splice(t, 1);
    });
  });
  return { bands: [], positions };
}
