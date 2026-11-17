// 植栽プランのイメージ図（SVG）を描く：季節ごとの立面図・平面図・植物のイラスト
import { COLORS, LEAF } from './plants.js';
import { rng, LAYER_JA, bedShape, BED_SHAPES } from './plan.js';
import { localMonth } from './garden.js';

const GROWTH = [0.12, 0.15, 0.35, 0.6, 0.85, 1, 1, 1, 1, 0.95, 0.75, 0.3]; // 北半球の月ごとの生育度
const SKY = { winter: ['#dfe7ee', '#f3f1ea'], spring: ['#cfe5f5', '#f6f3e6'], summer: ['#a9d3f2', '#eef4ea'], autumn: ['#d9e3ea', '#f5ecdc'] };
const STRAW = '#c7ae78';
const SEED = '#5c4330';

const flowerHex = (c) => (c === 'white' ? '#f7f5ee' : COLORS[c]?.hex ?? '#999');
const r1 = (v) => Math.round(v * 10) / 10;

function seasonOf(nm) {
  if (nm === 12 || nm <= 2) return 'winter';
  if (nm <= 5) return 'spring';
  if (nm <= 8) return 'summer';
  return 'autumn';
}

// 実のなる野菜の、実の色
const FRUIT = { tomato: '#d6402f', 'mini-tomato': '#e0503a', eggplant: '#4a2a5a', pepper: '#3f7a2f', cucumber: '#4f7a2f', zucchini: '#3f6a2f', okra: '#6f9a3f', 'green-bean': '#6f9a3f', strawberry: '#d63a3a', blueberry: '#3a4a8a', lemon: '#f0d040', olive: '#4a5a2a', goya: '#5f9a3f', luffa: '#6f9a4f', watermelon: '#3f6a2f', sasage: '#6f9a3f', roselle: '#b8203a', corn: '#e8c84a' };
const AUTUMN = ['#b88a3a', '#c07a3a', '#a86a3a', '#b8963f'];

// 植物ごとの姿（シルエット）の描き分け
const SIL = {};
const silOf = (kind, ids) => ids.split(' ').forEach((id) => { SIL[id] = kind; });
silOf('sword', 'iris-germanica iris-sanguinea iris-ensata iris-japonica hemerocallis crocosmia agapanthus kniphofia dietes sisyrinchium-striatum phormium gladiolus tulbaghia dierama eucomis galtonia bulbine clivia hesperantha anigozanthos');
silOf('bigleaf', 'hosta bergenia rodgersia ligularia tsuwabuki petasites brunnera rhubarb artichoke begonia-grandis rohdea');
silOf('bell', 'digitalis campanula penstemon aquilegia adenophora polygonatum convallaria galanthus helleborus fritillaria platycodon cyclamen');
silOf('cup', 'tulipa papaver papaver-rhoeas crocus eschscholzia paeonia anemone-flaccida');
silOf('trumpet', 'lilium narcissus nicotiana zephyranthes');
silOf('spider', 'lycoris');
silOf('climber', 'clematis');
silOf('rosette', 'aloe');
const MOPHEAD = { 'hydrangea-arb': 'mop', 'hydrangea-serrata': 'lace', 'hydrangea-quercifolia': 'cone', 'hydrangea-paniculata': 'cone', buddleja: 'cone' };
const ROSES = new Set(['rosa-rugosa', 'rosa-gallica', 'mini-rose']);
// 小さな形のパーツ
const bellPath = (x, y, r, c, ex = '') => `<path d="M${r1(x - r * 0.45)},${r1(y)} Q${r1(x - r * 0.55)},${r1(y + r * 1.05)} ${r1(x - r * 0.75)},${r1(y + r * 1.35)} L${r1(x + r * 0.75)},${r1(y + r * 1.35)} Q${r1(x + r * 0.55)},${r1(y + r * 1.05)} ${r1(x + r * 0.45)},${r1(y)}Z" fill="${c}"${ex}/>`;
const cupPath = (x, y, r, c, ex = '') => `<path d="M${r1(x - r)},${r1(y - r)} Q${r1(x - r * 1.05)},${r1(y + r * 0.7)} ${r1(x)},${r1(y + r * 0.75)} Q${r1(x + r * 1.05)},${r1(y + r * 0.7)} ${r1(x + r)},${r1(y - r)} Q${r1(x + r * 0.45)},${r1(y - r * 0.45)} ${r1(x)},${r1(y - r * 1.1)} Q${r1(x - r * 0.45)},${r1(y - r * 0.45)} ${r1(x - r)},${r1(y - r)}Z" fill="${c}"${ex}/>`;
const star = (x, y, r, c, n = 6, ex = '', rot = 0) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + rot; const px = x + Math.cos(a) * r * 0.55, py = y + Math.sin(a) * r * 0.55; return `<ellipse cx="${r1(px)}" cy="${r1(py)}" rx="${r1(r * 0.55)}" ry="${r1(r * 0.2)}" transform="rotate(${r1((a * 180) / Math.PI)} ${r1(px)} ${r1(py)})" fill="${c}"${ex}/>`; }).join('');
const leafPath = (x, y, w, h, ang, c, rib) => `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(ang)})"><path d="M0,0 C${r1(w * 0.55)},${r1(-h * 0.15)} ${r1(w * 0.62)},${r1(-h * 0.8)} 0,${r1(-h)} C${r1(-w * 0.62)},${r1(-h * 0.8)} ${r1(-w * 0.55)},${r1(-h * 0.15)} 0,0Z" fill="${c}"/><path d="M0,0 L0,${r1(-h * 0.9)}" stroke="${rib}" stroke-width="1" opacity=".6"/></g>`;

/**
 * 姿ごとの描き分け（剣形の葉・大きな葉・釣鐘・カップ・ラッパ・ヒガンバナ・つる・ロゼット）。
 * 描いたら文字列を返す。対象外なら null
 */
function drawSpecial(p, sil, o) {
  const { cx, baseY, H, W, leaf, dark, light, fc, fr, show, seedheads, R, stroke, out } = o;
  const g = p.group;
  const stalk = (x0, x1, y1, w = 1.4, col = dark) => `<path d="M${r1(x0)},${baseY} Q${r1((x0 + x1) / 2 + (R() - 0.5) * 4)},${r1((baseY + y1) / 2)} ${r1(x1)},${r1(y1)}" stroke="${col}" stroke-width="${w}" fill="none"/>`;
  if (sil === 'sword') {
    // 剣のような細長い葉を扇形に
    const n = 9, lh = g === 'agapanthus' || g === 'hemerocallis' || g === 'clivia' ? 0.55 : g === 'kniphofia' || g === 'crocosmia' ? 0.6 : 0.75;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) - 0.5;
      const tx = cx + t * W * 1.05, ty = baseY - H * lh * (1 - Math.abs(t) * 0.55);
      const arch = g === 'hemerocallis' || g === 'agapanthus' || g === 'clivia' ? 0.5 : 0.15;
      out.push(`<path d="M${r1(cx + t * 5)},${baseY} Q${r1(cx + t * W * (0.2 + arch * 0.2))},${r1(baseY - H * lh * 0.95)} ${r1(tx + t * W * arch)},${r1(ty + H * lh * arch * 0.4)}" stroke="${i % 3 ? leaf : dark}" stroke-width="${r1(Math.max(2.2, fr * 0.55))}" fill="none" stroke-linecap="round"/>`);
    }
    if (!show) return out.join('');
    const tops = [-0.25, 0.05, 0.3].slice(0, W > 40 ? 3 : 2);
    for (const [k, t] of tops.entries()) {
      const x = cx + t * W * 0.8, y = baseY - H * (0.92 + R() * 0.08);
      if (seedheads) { out.push(stalk(cx + t * 6, x, y, 1.3, STRAW), `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(fr * 0.35)}" ry="${r1(fr * 0.7)}" fill="${SEED}"/>`); continue; }
      if (g === 'kniphofia') {
        // トーチ：先が濃く、下が淡い穂
        out.push(stalk(cx + t * 6, x, y + fr * 2, 1.8));
        for (let j = 0; j < 9; j++) out.push(`<ellipse cx="${r1(x)}" cy="${r1(y + j * fr * 0.45)}" rx="${r1(fr * (0.55 + j * 0.03))}" ry="${r1(fr * 0.35)}" fill="${shadeHex(j < 4 ? fc : '#efc93a', j < 4 ? -0.05 * j : 0.1)}"/>`);
      } else if (g === 'crocosmia' || g === 'dierama' || g === 'anigozanthos') {
        // 弓なりの花茎に小さな筒形の花が並ぶ
        const dx = (k % 2 ? 1 : -1) * W * 0.25;
        out.push(`<path d="M${r1(cx + t * 6)},${baseY} Q${r1(x)},${r1(y - fr)} ${r1(x + dx)},${r1(y + fr * 2.5)}" stroke="${dark}" stroke-width="1.3" fill="none"/>`);
        for (let j = 0; j < 7; j++) { const u = j / 6, px = x + dx * u, py = y - fr * 0.6 + fr * 3 * u * u; out.push(`<ellipse cx="${r1(px)}" cy="${r1(py + fr * 0.4)}" rx="${r1(fr * 0.28)}" ry="${r1(fr * 0.55)}" fill="${fc}"${stroke}/>`); }
      } else if (g.startsWith('iris') || g === 'dietes' || g === 'sisyrinchium-striatum') {
        // アヤメ形：上に立つ花弁と、垂れる花弁
        out.push(stalk(cx + t * 6, x, y, 1.4));
        const r = fr * (g === 'iris-germanica' ? 1.25 : 1);
        out.push(`<path d="M${r1(x)},${r1(y)} q${r1(-r * 0.5)},${r1(-r * 1.2)} 0,${r1(-r * 1.4)} q${r1(r * 0.5)},${r1(r * 0.2)} 0,${r1(r * 1.4)}Z" fill="${shadeHex(fc, 0.15)}"${stroke}/>`,
          `<path d="M${r1(x)},${r1(y)} q${r1(-r * 1.4)},${r1(r * 0.1)} ${r1(-r * 1.1)},${r1(r * 1)} q${r1(r * 0.5)},${r1(-r * 0.2)} ${r1(r * 1.1)},${r1(-r * 1)}Z M${r1(x)},${r1(y)} q${r1(r * 1.4)},${r1(r * 0.1)} ${r1(r * 1.1)},${r1(r * 1)} q${r1(-r * 0.5)},${r1(-r * 0.2)} ${r1(-r * 1.1)},${r1(-r * 1)}Z" fill="${fc}"${stroke}/>`,
          `<path d="M${r1(x - r * 0.2)},${r1(y + r * 0.2)} l${r1(-r * 0.4)},${r1(r * 0.35)}" stroke="#efc93a" stroke-width="1.2"/>`);
      } else if (g === 'agapanthus' || g === 'tulbaghia' || g === 'clivia') {
        // 花火のような丸い花房
        out.push(stalk(cx + t * 6, x, y, 1.6));
        for (let j = 0; j < 14; j++) { const a = (j / 14) * Math.PI * 2; const rr = fr * (g === 'tulbaghia' ? 0.9 : 1.6); out.push(`<path d="M${r1(x)},${r1(y)} l${r1(Math.cos(a) * rr)},${r1(Math.sin(a) * rr * 0.8)}" stroke="${dark}" stroke-width=".7"/><ellipse cx="${r1(x + Math.cos(a) * rr)}" cy="${r1(y + Math.sin(a) * rr * 0.8)}" rx="${r1(fr * 0.32)}" ry="${r1(fr * 0.22)}" fill="${fc}"${stroke}/>`); }
      } else if (g === 'hemerocallis') {
        out.push(stalk(cx + t * 6, x, y, 1.4), star(x, y, fr * 1.4, fc, 6, stroke), `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(fr * 0.3)}" fill="${shadeHex(fc, -0.3)}"/>`);
      } else {
        // 穂状（グラジオラス・ブルビネなど）
        out.push(stalk(cx + t * 6, x, y, 1.4));
        for (let j = 0; j < 6; j++) out.push(`<ellipse cx="${r1(x + (j % 2 ? 1 : -1) * fr * 0.3)}" cy="${r1(y + j * fr * 0.8)}" rx="${r1(fr * 0.55)}" ry="${r1(fr * 0.4)}" fill="${j % 2 ? shadeHex(fc, 0.12) : fc}"${stroke}/>`);
      }
    }
    return out.join('');
  }
  if (sil === 'bigleaf') {
    // 大きな葉が重なる株。葉脈つき
    const big = g === 'rhubarb' || g === 'rodgersia' || g === 'petasites' || g === 'artichoke';
    const lh = Math.min(H * 0.7, W * (big ? 0.55 : 0.45));
    const n = 7;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) - 0.5;
      const col = g === 'artichoke' ? (i % 2 ? '#a9b5a6' : '#93a39a') : i % 3 === 0 ? dark : i % 3 === 1 ? leaf : light;
      out.push(leafPath(cx + t * W * 0.55, baseY, lh * (g === 'artichoke' ? 0.45 : 0.75), lh * (1 - Math.abs(t) * 0.35), t * 95, col, shadeHex(col, -0.35)));
    }
    if (p.leaf === 'variegated') for (let i = 0; i < 10; i++) out.push(`<circle cx="${r1(cx + (R() - 0.5) * W * 0.8)}" cy="${r1(baseY - R() * lh * 0.8)}" r="1.8" fill="#f4f1e0" opacity=".85"/>`);
    if (!show) return out.join('');
    const k = W > 50 ? 3 : 2;
    for (let j = 0; j < k; j++) {
      const t = k === 1 ? 0 : j / (k - 1) - 0.5;
      const x = cx + t * W * 0.4, y = baseY - H * (0.9 + R() * 0.1);
      out.push(stalk(cx + t * 4, x, y, 1.4));
      if (seedheads) { out.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(fr * 0.5)}" fill="${SEED}"/>`); continue; }
      if (g === 'hosta' || g === 'rohdea') for (let m = 0; m < 5; m++) out.push(bellPath(x + (m % 2 ? fr * 0.45 : 0), y + m * fr * 0.9, fr * 0.6, fc, stroke));
      else if (g === 'tsuwabuki' || g === 'ligularia') { for (let m = 0; m < (g === 'ligularia' ? 7 : 3); m++) { const px = x + (g === 'ligularia' ? (m % 2 ? 1 : -1) * fr * 0.3 : (m - 1) * fr * 1.6), py = y + (g === 'ligularia' ? m * fr * 0.7 : Math.abs(m - 1) * fr * 0.6); out.push(star(px, py, fr * (g === 'ligularia' ? 0.8 : 1.3), fc, 8, ''), `<circle cx="${r1(px)}" cy="${r1(py)}" r="${r1(fr * 0.25)}" fill="#b07a2a"/>`); } }
      else if (g === 'artichoke') out.push(`<circle cx="${r1(x)}" cy="${r1(y + fr * 0.6)}" r="${r1(fr * 1.1)}" fill="#7f9a6a"/>`, `<path d="M${r1(x - fr)},${r1(y)} l${r1(fr * 0.25)},${r1(-fr * 1.2)} l${r1(fr * 0.4)},${r1(fr * 1)} l${r1(fr * 0.4)},${r1(-fr * 1.1)} l${r1(fr * 0.35)},${r1(fr * 1.1)} l${r1(fr * 0.25)},${r1(-fr)}" fill="${fc}" stroke="${fc}" stroke-width="1"/>`);
      else for (let m = 0; m < 9; m++) out.push(`<circle cx="${r1(x + (R() - 0.5) * fr * 2.4)}" cy="${r1(y + (R() - 0.3) * fr * 1.6)}" r="${r1(fr * 0.32)}" fill="${fc}"${stroke}/>`);
    }
    return out.join('');
  }
  if (sil === 'spider') {
    // ヒガンバナ：葉のない茎の先に、反り返る花びらと長い雄しべ
    if (!show) { for (let i = 0; i < 7; i++) { const t = i / 6 - 0.5; out.push(`<path d="M${r1(cx + t * 4)},${baseY} q${r1(t * W * 0.4)},${r1(-H * 0.25)} ${r1(t * W * 0.8)},${r1(-H * 0.18)}" stroke="${leaf}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`); } return out.join(''); }
    for (let j = 0; j < 3; j++) {
      const x = cx + (j - 1) * W * 0.3, y = baseY - H * (0.9 + R() * 0.1);
      out.push(`<line x1="${r1(cx + (j - 1) * 4)}" y1="${baseY}" x2="${r1(x)}" y2="${r1(y)}" stroke="#6f9a4f" stroke-width="1.6"/>`);
      for (let m = 0; m < 6; m++) { const a = (m / 6) * Math.PI * 2; out.push(`<path d="M${r1(x)},${r1(y)} q${r1(Math.cos(a) * fr * 1.2)},${r1(Math.sin(a) * fr * 0.6 - fr * 0.4)} ${r1(Math.cos(a) * fr * 1.6)},${r1(Math.sin(a) * fr * 0.9 - fr * 1.2)}" stroke="${fc}" stroke-width="${r1(fr * 0.3)}" fill="none" stroke-linecap="round"/><path d="M${r1(x)},${r1(y)} q${r1(Math.cos(a) * fr * 1.6)},${r1(-fr * 1.4)} ${r1(Math.cos(a) * fr * 2.2)},${r1(-fr * 1.6)}" stroke="${fc}" stroke-width=".6" fill="none"/>`); }
    }
    return out.join('');
  }
  if (sil === 'climber') {
    // つる植物：オベリスクに絡む
    const top = baseY - Math.max(H, (p.h[1] / 100) * o.sc * 0.8);
    out.push(`<path d="M${r1(cx - W * 0.25)},${baseY} L${r1(cx)},${r1(top - 8)} L${r1(cx + W * 0.25)},${baseY} M${r1(cx - W * 0.18)},${r1(baseY - (baseY - top) * 0.3)} h${r1(W * 0.36)} M${r1(cx - W * 0.1)},${r1(baseY - (baseY - top) * 0.62)} h${r1(W * 0.2)}" stroke="#8a6a44" stroke-width="2" fill="none"/>`);
    for (let i = 0; i < 3; i++) out.push(`<path d="M${r1(cx + (i - 1) * 4)},${baseY} ${Array.from({ length: 6 }, (_, k) => `Q${r1(cx + (k % 2 ? 1 : -1) * W * 0.3)},${r1(baseY - (baseY - top) * (k + 0.5) / 6)} ${r1(cx + (i - 1) * 3)},${r1(baseY - (baseY - top) * (k + 1) / 6)}`).join(' ')}" stroke="${i % 2 ? leaf : dark}" stroke-width="1.6" fill="none"/>`);
    if (!o.dormant) for (let i = 0; i < 12; i++) out.push(`<ellipse cx="${r1(cx + (R() - 0.5) * W * 0.6)}" cy="${r1(top + (baseY - top) * R() * 0.9)}" rx="${r1(fr * 0.55)}" ry="${r1(fr * 0.3)}" fill="${[leaf, dark, light][i % 3]}"/>`);
    if (show && !seedheads) for (let i = 0; i < 9; i++) { const x = cx + (R() - 0.5) * W * 0.6, y = top + (baseY - top) * R() * 0.8; out.push(star(x, y, fr * 1.1, fc, 4, stroke, R()), `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(fr * 0.22)}" fill="#efe1a0"/>`); }
    return out.join('');
  }
  if (sil === 'rosette') {
    for (let i = 0; i < 11; i++) { const t = i / 10 - 0.5; out.push(`<path d="M${r1(cx + t * 6)},${baseY} Q${r1(cx + t * W * 0.6)},${r1(baseY - H * 0.5)} ${r1(cx + t * W * 1.1)},${r1(baseY - H * 0.45 * (1 - Math.abs(t)))}" stroke="${i % 2 ? leaf : dark}" stroke-width="${r1(fr * 0.8)}" fill="none" stroke-linecap="round"/>`); }
    if (show) out.push(stalk(cx, cx + 2, baseY - H, 1.6), ...Array.from({ length: 7 }, (_, j) => `<ellipse cx="${r1(cx + 2)}" cy="${r1(baseY - H + j * fr * 0.6)}" rx="${r1(fr * 0.35)}" ry="${r1(fr * 0.45)}" fill="${shadeHex(fc, j * 0.05)}"/>`));
    return out.join('');
  }
  return null;
}
/** 釣鐘・カップ・ラッパの花（葉の茂みは共通の描き方のあとに重ねる） */
function drawFlowers(p, sil, o) {
  const { cx, baseY, H, W, dark, leaf, fc, fr, seedheads, R, stroke, fh } = o;
  const g = p.group;
  const out = [];
  const n = W > 50 ? 5 : 3;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1) - 0.5;
    const x = cx + t * W * 0.7 + (R() - 0.5) * 5, y = baseY - H * (0.82 + R() * 0.18);
    const bend = g === 'polygonatum' ? W * 0.35 * (t >= 0 ? 1 : -1) : 0;
    out.push(`<path d="M${r1(cx + t * W * 0.2)},${r1(baseY - fh * 0.5)} Q${r1(x - bend * 0.2)},${r1((baseY + y) / 2)} ${r1(x + bend)},${r1(y + (bend ? H * 0.25 : 0))}" stroke="${dark}" stroke-width="1.3" fill="none"/>`);
    if (seedheads) { out.push(`<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(fr * 0.35)}" ry="${r1(fr * 0.6)}" fill="${SEED}"/>`); continue; }
    if (sil === 'bell') {
      if (g === 'digitalis' || g === 'penstemon') {
        // 片側に筒形の花がずらりと並ぶ穂
        const len = (baseY - y) * 0.45, m = Math.max(5, Math.round(len / (fr * 0.85)));
        for (let j = 0; j < m; j++) { const u = j / (m - 1); out.push(bellPath(x + fr * 0.25, y + len * u, fr * (0.5 + u * 0.35), j % 2 ? shadeHex(fc, 0.1) : fc, stroke)); }
        out.push(`<line x1="${r1(x)}" y1="${r1(y)}" x2="${r1(x)}" y2="${r1(y + len)}" stroke="${dark}" stroke-width="1.2"/>`);
      } else if (g === 'polygonatum') {
        for (let j = 0; j < 6; j++) { const u = j / 6; out.push(bellPath(cx + t * W * 0.2 + (x + bend - cx - t * W * 0.2) * (0.35 + u * 0.6), (baseY - fh * 0.5) + (y + H * 0.25 - baseY + fh * 0.5) * (0.35 + u * 0.6) + fr * 0.3, fr * 0.5, fc, stroke)); }
      } else if (g === 'aquilegia' || g === 'helleborus' || g === 'cyclamen' || g === 'fritillaria' || g === 'galanthus' || g === 'convallaria') {
        const m = g === 'convallaria' ? 5 : 2;
        for (let j = 0; j < m; j++) { const px = x + (g === 'convallaria' ? fr * 0.4 : (j - 0.5) * fr * 1.6), py = y + j * fr * (g === 'convallaria' ? 0.8 : 0.4); out.push(`<path d="M${r1(x)},${r1(y)} q${r1((px - x) * 0.5)},${r1(-fr * 0.4)} ${r1(px - x)},${r1(py - y)}" stroke="${dark}" stroke-width=".9" fill="none"/>`, bellPath(px, py, fr * (g === 'convallaria' || g === 'galanthus' ? 0.45 : 0.8), fc, stroke)); }
      } else {
        // カンパニュラ・キキョウ：上向き〜横向きの鐘
        for (let j = 0; j < 4; j++) { const px = x + (j % 2 ? 1 : -1) * fr * 0.5, py = y + j * fr * 1.1; out.push(cupPath(px, py, fr * 0.65, j % 2 ? shadeHex(fc, 0.12) : fc, stroke)); }
      }
    } else if (sil === 'cup') {
      if (g === 'paeonia') {
        // シャクヤク：大きな八重の花
        const r = fr * 1.6;
        out.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${shadeHex(fc, -0.08)}"${stroke}/>`, `<circle cx="${r1(x - r * 0.2)}" cy="${r1(y - r * 0.15)}" r="${r1(r * 0.72)}" fill="${fc}"/>`, `<circle cx="${r1(x + r * 0.15)}" cy="${r1(y - r * 0.3)}" r="${r1(r * 0.4)}" fill="${shadeHex(fc, 0.2)}"/>`);
      } else if (g === 'papaver' || g === 'papaver-rhoeas' || g === 'eschscholzia' || g === 'anemone-flaccida') {
        const r = fr * (g === 'papaver' ? 1.5 : 1.05);
        out.push(cupPath(x, y, r, fc, stroke), `<circle cx="${r1(x)}" cy="${r1(y - r * 0.35)}" r="${r1(r * 0.28)}" fill="${g === 'eschscholzia' ? '#f2b02c' : '#2b2a22'}" opacity=".85"/>`);
      } else out.push(cupPath(x, y, fr * 0.95, fc, stroke), `<path d="M${r1(x)},${r1(y - fr)} v${r1(fr * 1.4)}" stroke="${shadeHex(fc, -0.2)}" stroke-width=".8"/>`);
    } else if (sil === 'trumpet') {
      if (g === 'narcissus') {
        out.push(star(x, y, fr * 1.2, g === 'narcissus' && fc === flowerHex('yellow') ? fc : '#f6f1df', 6, stroke), `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(fr * 0.45)}" fill="${fc === flowerHex('white') ? '#efc93a' : shadeHex(fc, -0.15)}"/>`);
      } else if (g === 'nicotiana' || g === 'zephyranthes') {
        out.push(star(x, y, fr * 0.85, fc, 5, stroke), `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(fr * 0.2)}" fill="${shadeHex(fc, -0.3)}"/>`);
      } else {
        // ユリ：横向きに開く6弁の大きな花
        for (let j = 0; j < 2; j++) { const px = x + (j ? 1 : -1) * fr * 1.2, py = y + j * fr * 0.8; out.push(star(px, py, fr * 1.6, fc, 6, stroke, 0.3), `<circle cx="${r1(px)}" cy="${r1(py)}" r="${r1(fr * 0.25)}" fill="#8a4a2a"/>`); }
      }
    }
    out.push(`<path d="M${r1((cx + x) / 2)},${r1((baseY + y) / 2)} l-4,-2 M${r1((cx + x) / 2)},${r1((baseY + y) / 2 + 6)} l4,-2" stroke="${leaf}" stroke-width="2" stroke-linecap="round"/>`);
  }
  return out.join('');
}

/** その月に、その株が地上に見えているか（北半球の月） */
function presence(p, nm) {
  const first = Math.min(...(p.bloom.length ? p.bloom : [6]));
  const last = Math.max(...(p.bloom.length ? p.bloom : [6]));
  if (p.type === 'annual') {
    if (p.sow === 'cool') return !(nm >= 7 && nm <= 9); // 秋〜初夏。夏には枯れて片付ける
    return nm >= 5 && nm <= 10; // 春に植えて秋まで
  }
  if (p.type === 'bulb' && last <= 6 && !p.tender) {
    // 春咲き球根：冬に芽を出し、花後1〜2か月で葉が消える
    if (nm > last + 1 && nm <= 10) return false;
    if (nm >= 11 || nm < first - 2) return 'shoot';
  }
  if (p.tender && p.type !== 'annual' && (nm === 12 || nm <= 2)) return 'shoot';
  return true;
}

/**
 * 1株を描く
 * @param p 植物, color 選んだ花色, cx/baseY 根元の位置(px), sc 1mあたりのpx, nm 北半球換算の月, seed 乱数
 */
export function drawPlant(p, color, cx, baseY, sc, nm, seed) {
  const R = rng(seed);
  const here = presence(p, nm);
  if (!here) return '';
  const blooming = p.bloom.includes(nm);
  const ever = p.tags.includes('evergreen') || p.type === 'subshrub';
  let g = GROWTH[nm - 1];
  if (ever) g = Math.max(g, 0.7);
  if (blooming) g = Math.max(g, 0.9);
  if (here === 'shoot') g = 0.18;
  const winter = nm === 12 || nm <= 2;
  const dormant = !ever && !blooming && (winter || here === 'shoot');
  const lastBloom = p.bloom[p.bloom.length - 1];
  const afterBloom = !blooming && (nm > lastBloom || nm <= 2) && nm >= 8;
  const keeps = p.tags.includes('prairie') || p.uses?.includes('winter') || p.uses?.includes('seed') || p.cut === 'spring';
  const seedheads = !blooming && keeps && (nm >= 10 || nm <= 2) && ['daisy', 'globe', 'plate', 'spike'].includes(p.form);

  const H = Math.max(4, (p.h[1] / 100) * sc * g);
  const W = Math.max(8, (p.spread / 100) * sc * 0.95);
  let leaf = LEAF[p.leaf]?.hex ?? '#5f8f4a';
  const turning = !ever && p.form !== 'grass' && (nm === 10 || nm === 11);
  if (turning) leaf = AUTUMN[Math.floor(R() * AUTUMN.length)];
  const dark = shadeHex(leaf, -0.22), light = shadeHex(leaf, 0.18);
  const fc = flowerHex(color);
  const fr = Math.max(3.6, Math.min(8.5, sc * 0.034 * (p.h[1] >= 100 ? 1.2 : 1))); // 花の大きさ（図の縮尺に合わせる）
  const out = [`<ellipse cx="${r1(cx)}" cy="${r1(baseY + 1)}" rx="${r1(W * 0.5)}" ry="${r1(Math.max(2, W * 0.07))}" fill="#000" opacity=".12"/>`];

  // 球根の芽・寒さよけ中の株
  if (here === 'shoot' && p.form !== 'grass') {
    for (let i = 0; i < 4; i++) out.push(`<path d="M${r1(cx + (i - 1.5) * 3)},${baseY} q${r1((i - 1.5) * 2)},-6 ${r1((i - 1.5) * 3)},-${r1(6 + R() * 5)}" stroke="${p.type === 'bulb' ? '#6f9a4f' : dark}" stroke-width="2" fill="none" stroke-linecap="round"/>`);
    return out.join('');
  }

  // シダ：弓なりの葉（羽状の小葉付き）
  if (p.form === 'fern') {
    const col = dormant ? STRAW : leaf;
    const n = 9;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) - 0.5;
      const tx = cx + t * W * 1.15, ty = baseY - H * (0.55 + 0.4 * (1 - Math.abs(t) * 1.4)) * (0.85 + R() * 0.15);
      const qx = cx + t * W * 0.3, qy = baseY - H * 1.05;
      out.push(`<path d="M${r1(cx)},${baseY} Q${r1(qx)},${r1(qy)} ${r1(tx)},${r1(ty)}" stroke="${col}" stroke-width="1.4" fill="none"/>`);
      for (let k = 2; k < 9; k++) {
        const u = k / 9, x = (1 - u) ** 2 * cx + 2 * (1 - u) * u * qx + u * u * tx, y = (1 - u) ** 2 * baseY + 2 * (1 - u) * u * qy + u * u * ty;
        const len = 7 * (1 - u * 0.6);
        out.push(`<path d="M${r1(x)},${r1(y)} l${r1(-len * 0.7)},${r1(len * 0.5)} M${r1(x)},${r1(y)} l${r1(len * 0.7)},${r1(len * 0.5)}" stroke="${i % 2 ? dark : col}" stroke-width="1.6" stroke-linecap="round"/>`);
      }
    }
    return out.join('');
  }

  // グラス：細い葉の束と、季節の穂
  if (p.form === 'grass') {
    const n = 18;
    const col = dormant ? STRAW : leaf;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) - 0.5;
      const tx = cx + t * W * 1.2 + (R() - 0.5) * 4;
      const ty = baseY - H * (0.65 + 0.35 * R()) * (1 - Math.abs(t) * 0.5);
      out.push(`<path d="M${r1(cx + t * 6)},${baseY} Q${r1(cx + t * W * 0.25)},${r1(baseY - H * 0.95)} ${r1(tx)},${r1(ty)}" stroke="${i % 3 === 0 ? (dormant ? '#b39a62' : dark) : col}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
      const plume = blooming || (afterBloom && nm >= p.bloom[0]) || (dormant && p.bloom[0] >= 7);
      if (plume && i % 2 === 0) {
        const pc = dormant || color === 'green' ? '#e4d6ae' : color === 'white' ? '#efe7d2' : fc;
        out.push(`<ellipse cx="${r1(tx)}" cy="${r1(ty - 4)}" rx="${r1(fr * 0.6)}" ry="${r1(fr * 1.5)}" fill="${pc}" opacity=".9" transform="rotate(${r1(t * 50)} ${r1(tx)} ${r1(ty)})"/>`);
      }
    }
    return out.join('');
  }

  // 低木：幹と枝、葉の茂み。落葉樹は冬に枝だけ
  if (p.type === 'shrub') {
    const trunks = 3 + Math.floor(R() * 2);
    const branch = [];
    for (let i = 0; i < trunks; i++) {
      const t = i / (trunks - 1) - 0.5;
      const tx = cx + t * W * 0.7, ty = baseY - (p.h[1] / 100) * sc * (0.75 + R() * 0.2);
      branch.push(`<path d="M${r1(cx + t * 6)},${baseY} Q${r1(cx + t * W * 0.2)},${r1(baseY - (baseY - ty) * 0.5)} ${r1(tx)},${r1(ty)}" stroke="#6b4c2e" stroke-width="${dormant ? 1.6 : 2.2}" fill="none"/>`);
      if (dormant) branch.push(`<path d="M${r1(tx)},${r1(ty)} l${r1(-6 - R() * 6)},-8 M${r1(tx)},${r1(ty + 10)} l${r1(6 + R() * 6)},-7" stroke="#6b4c2e" stroke-width="1"/>`);
    }
    out.push(branch.join(''));
    if (!dormant) {
      const topY = baseY - (p.h[1] / 100) * sc * Math.max(g, 0.85);
      for (let i = 0; i < 9; i++) {
        const x = cx + (R() - 0.5) * W * 0.95, y = topY + (baseY - topY) * (0.12 + R() * 0.55);
        out.push(`<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(W * (0.18 + R() * 0.1))}" ry="${r1((baseY - topY) * (0.16 + R() * 0.08))}" fill="${[leaf, dark, light][i % 3]}"/>`);
      }
      const mop = MOPHEAD[p.group];
      if (blooming && mop) {
        // アジサイ：手まり咲き・額咲き・円錐形の花房
        for (let i = 0; i < 7; i++) {
          const x = cx + (R() - 0.5) * W * 0.85, y = topY + (baseY - topY) * (0.12 + R() * 0.4);
          if (mop === 'cone') { for (let j = 0; j < 7; j++) out.push(`<circle cx="${r1(x + (R() - 0.5) * fr * (1.6 - j * 0.2))}" cy="${r1(y - j * fr * 0.55)}" r="${r1(fr * (0.6 - j * 0.05))}" fill="${j % 2 ? shadeHex(fc, 0.15) : fc}"/>`); }
          else if (mop === 'lace') { out.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(fr * 0.9)}" fill="${shadeHex(fc, -0.2)}" opacity=".8"/>`); for (let j = 0; j < 6; j++) { const a = (j / 6) * Math.PI * 2; out.push(star(x + Math.cos(a) * fr * 1.3, y + Math.sin(a) * fr * 0.9, fr * 0.6, fc, 4)); } }
          else { out.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(fr * 1.7)}" fill="${fc}"/>`); for (let j = 0; j < 8; j++) out.push(`<circle cx="${r1(x + (R() - 0.5) * fr * 2.4)}" cy="${r1(y + (R() - 0.5) * fr * 2.2)}" r="${r1(fr * 0.42)}" fill="${shadeHex(fc, j % 2 ? 0.2 : -0.12)}"/>`); }
        }
      } else if (blooming && ROSES.has(p.group)) {
        // バラ：花びらの重なる丸い花
        for (let i = 0; i < 12; i++) { const x = cx + (R() - 0.5) * W * 0.85, y = topY + (baseY - topY) * (0.08 + R() * 0.5); out.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(fr * 0.95)}" fill="${shadeHex(fc, -0.1)}"/><circle cx="${r1(x - fr * 0.15)}" cy="${r1(y - fr * 0.15)}" r="${r1(fr * 0.6)}" fill="${fc}"/><path d="M${r1(x - fr * 0.3)},${r1(y)} q${r1(fr * 0.3)},${r1(-fr * 0.5)} ${r1(fr * 0.6)},0" stroke="${shadeHex(fc, -0.3)}" stroke-width=".7" fill="none"/>`); }
      } else if (blooming) for (let i = 0; i < 16; i++) out.push(`<circle cx="${r1(cx + (R() - 0.5) * W * 0.9)}" cy="${r1(topY + (baseY - topY) * (0.1 + R() * 0.5))}" r="${r1(fr * 0.7)}" fill="${fc}"/>`);
      if (p.harvest?.includes(nm) && FRUIT[p.group]) for (let i = 0; i < 8; i++) out.push(`<circle cx="${r1(cx + (R() - 0.5) * W * 0.8)}" cy="${r1(topY + (baseY - topY) * (0.2 + R() * 0.5))}" r="${r1(fr * 0.7)}" fill="${FRUIT[p.group]}"/>`);
    }
    return out.join('');
  }

  const sil = SIL[p.group];
  const showF = blooming || seedheads;
  const strokeF = color === 'white' ? ' stroke="#c9c3b2" stroke-width=".6"' : '';
  if (sil && !['bell', 'cup', 'trumpet'].includes(sil) && !(dormant && sil !== 'rosette' && sil !== 'climber')) {
    const r = drawSpecial(p, sil, { cx, baseY, H, W, leaf, dark, light, fc, fr, show: showF, seedheads, R, stroke: strokeF, out, sc, dormant });
    if (r != null) return r;
  }

  // 休眠中（冬）
  if (dormant) {
    if (seedheads) {
      for (let i = 0; i < 5; i++) {
        const x = cx + (R() - 0.5) * W * 0.6;
        const top = baseY - (p.h[1] / 100) * sc * (0.7 + 0.25 * R());
        out.push(`<line x1="${r1(x)}" y1="${baseY}" x2="${r1(x)}" y2="${r1(top)}" stroke="${STRAW}" stroke-width="1.3"/><circle cx="${r1(x)}" cy="${r1(top)}" r="${r1(fr * 0.6)}" fill="${SEED}"/>`);
      }
    } else {
      out.push(`<path d="M${r1(cx - W * 0.22)},${baseY} q${r1(W * 0.22)},-5 ${r1(W * 0.44)},0Z" fill="#8a7458"/>`);
    }
    return out.join('');
  }

  // 葉の茂み（重なった葉の房で質感を出す）
  const mound = p.form === 'mound';
  const fh = mound ? H : Math.min(H * 0.42, W * 0.42);
  out.push(`<path d="M${r1(cx - W / 2)},${baseY} C${r1(cx - W / 2)},${r1(baseY - fh * 1.25)} ${r1(cx + W / 2)},${r1(baseY - fh * 1.25)} ${r1(cx + W / 2)},${baseY}Z" fill="${leaf}"/>`);
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (0.15 + 0.7 * (i / 5));
    const x = cx - Math.cos(a) * W * 0.32, y = baseY - Math.sin(a) * fh * 0.7;
    out.push(`<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(W * 0.16)}" ry="${r1(Math.max(2, fh * 0.28))}" fill="${i % 2 ? dark : light}" opacity=".55"/>`);
  }
  if (p.leaf === 'variegated') for (let i = 0; i < 8; i++) out.push(`<circle cx="${r1(cx + (R() - 0.5) * W * 0.8)}" cy="${r1(baseY - R() * fh * 0.9)}" r="1.6" fill="#f4f1e0" opacity=".8"/>`);

  const stems = (n, spread, hMin = 0.75) => Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0 : i / (n - 1) - 0.5;
    const x = cx + t * W * spread + (R() - 0.5) * 6;
    const y = baseY - H * (hMin + (1 - hMin) * R());
    return { x, y, bx: cx + t * W * 0.25 };
  });
  const stemLine = (st) => `<path d="M${r1(st.bx)},${r1(baseY - fh * 0.5)} Q${r1((st.bx + st.x) / 2 + (R() - 0.5) * 4)},${r1((baseY - fh * 0.5 + st.y) / 2)} ${r1(st.x)},${r1(st.y)}" stroke="${dark}" stroke-width="1.3" fill="none"/>`
    + `<path d="M${r1((st.bx + st.x) / 2)},${r1((baseY - fh * 0.5 + st.y) / 2)} l-4,-2 M${r1((st.bx + st.x) / 2)},${r1((baseY - fh * 0.5 + st.y) / 2 + 6)} l4,-2" stroke="${leaf}" stroke-width="2" stroke-linecap="round"/>`;
  const show = blooming || seedheads;
  const head = seedheads ? SEED : fc;
  const stroke = color === 'white' ? ' stroke="#c9c3b2" stroke-width=".6"' : '';
  const tint = (i) => (seedheads ? SEED : i % 3 === 1 ? shadeHex(fc, 0.15) : i % 3 === 2 ? shadeHex(fc, -0.1) : fc);

  if (['bell', 'cup', 'trumpet'].includes(sil)) {
    if (show) out.push(drawFlowers(p, sil, { cx, baseY, H, W, dark, leaf, fc, fr, seedheads, R, stroke, fh }));
    return out.join('');
  }
  switch (p.form) {
    case 'spike': {
      for (const [k, st] of stems(5, 0.7).entries()) {
        out.push(stemLine(st));
        if (show) {
          // 小花が下から上へ細くなりながら並ぶ穂
          const len = Math.max(10, (baseY - st.y) * 0.4);
          const n = Math.max(4, Math.round(len / (fr * 0.9)));
          for (let j = 0; j < n; j++) {
            const u = j / (n - 1);
            out.push(`<circle cx="${r1(st.x + (j % 2 ? 1 : -1) * fr * 0.35 * (1 - u))}" cy="${r1(st.y + len * (1 - u))}" r="${r1((seedheads ? 0.45 : 0.75) * fr * (1 - u * 0.55))}" fill="${tint(k + j)}"/>`);
          }
        }
      }
      break;
    }
    case 'daisy': {
      for (const [k, st] of stems(7, 0.85).entries()) {
        out.push(stemLine(st));
        if (!show) continue;
        if (seedheads) { out.push(`<circle cx="${r1(st.x)}" cy="${r1(st.y)}" r="${r1(fr * 0.55)}" fill="${SEED}"/>`); continue; }
        // 花びらの輪と中心
        for (let j = 0; j < 8; j++) {
          const a = (j / 8) * Math.PI * 2;
          out.push(`<ellipse cx="${r1(st.x + Math.cos(a) * fr * 0.62)}" cy="${r1(st.y + Math.sin(a) * fr * 0.4)}" rx="${r1(fr * 0.45)}" ry="${r1(fr * 0.22)}" transform="rotate(${r1((a * 180) / Math.PI)} ${r1(st.x + Math.cos(a) * fr * 0.62)} ${r1(st.y + Math.sin(a) * fr * 0.4)})" fill="${tint(k)}"${stroke}/>`);
        }
        out.push(`<circle cx="${r1(st.x)}" cy="${r1(st.y)}" r="${r1(fr * 0.32)}" fill="#6b4a2a"/>`);
      }
      break;
    }
    case 'globe': {
      for (const [k, st] of stems(4, 0.6).entries()) {
        out.push(stemLine(st));
        if (show) out.push(`<circle cx="${r1(st.x)}" cy="${r1(st.y)}" r="${r1(seedheads ? fr * 0.6 : fr * 1.25)}" fill="${tint(k)}"${seedheads ? '' : stroke}/>${seedheads ? '' : `<circle cx="${r1(st.x - fr * 0.35)}" cy="${r1(st.y - fr * 0.35)}" r="${r1(fr * 0.4)}" fill="#fff" opacity=".25"/>`}`);
      }
      break;
    }
    case 'plate': {
      for (const [k, st] of stems(5, 0.75).entries()) {
        out.push(stemLine(st));
        if (!show) continue;
        // 小花が集まった平たい花房
        for (let j = 0; j < 9; j++) out.push(`<circle cx="${r1(st.x + (j - 4) * fr * 0.32)}" cy="${r1(st.y - Math.cos(((j - 4) / 4) * 1.2) * fr * 0.45)}" r="${r1(fr * (seedheads ? 0.28 : 0.38))}" fill="${tint(k + j)}"${seedheads ? '' : stroke}/>`);
      }
      break;
    }
    case 'airy': {
      for (const st of stems(6, 0.8, 0.85)) out.push(stemLine(st));
      if (show) {
        for (let i = 0; i < 40; i++) {
          const x = cx + (R() - 0.5) * W * 1.05;
          const y = baseY - H * (0.55 + 0.45 * R());
          out.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(fr * (0.22 + R() * 0.2))}" fill="${tint(i)}"/>`);
        }
      }
      break;
    }
    case 'mound':
    default: {
      if (show) {
        for (let i = 0; i < 20; i++) {
          const a = Math.PI * (0.1 + 0.8 * R());
          const rr = 0.72 + 0.28 * R();
          const x = cx - Math.cos(a) * (W / 2) * rr * 0.95;
          const y = baseY - Math.sin(a) * fh * rr * 0.95;
          out.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(fr * (0.45 + R() * 0.3))}" fill="${tint(i)}"${stroke}/>`);
        }
      }
    }
  }
  // 野菜の実（収穫の時期）
  if (p.harvest?.includes(nm) && FRUIT[p.group]) {
    for (let i = 0; i < 6; i++) out.push(`<ellipse cx="${r1(cx + (R() - 0.5) * W * 0.7)}" cy="${r1(baseY - H * (0.25 + R() * 0.5))}" rx="${r1(fr * 0.7)}" ry="${r1(fr * (['cucumber', 'okra', 'green-bean', 'sasage', 'luffa', 'goya', 'zucchini', 'eggplant'].includes(p.group) ? 1.4 : 0.8))}" fill="${FRUIT[p.group]}"/>`);
  }
  return out.join('');
}
function shadeHex(hex, f) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(f >= 0 ? c + (255 - c) * f : c * (1 + f)));
  return '#' + ch.map((c) => c.toString(16).padStart(2, '0')).join('');
}

/** 立面図（正面から見たイメージ）。month はその土地の月 */
export function elevationSVG(plan, month, south = false, opts = {}) {
  const VW = 640, VH = opts.height || 320, ground = VH - 34, depthPx = 46;
  const maxH = Math.max(1.2, ...plan.species.map((s) => s.plant.h[1] / 100));
  const sx = (VW - 40) / plan.width;
  const sh = Math.min(sx, (ground - depthPx - 20) / maxH);
  const nm = localMonth(month, south);
  const [sky1, sky2] = SKY[seasonOf(nm)];
  const items = [];
  plan.species.forEach((s, si) => s.positions.forEach((pt, pi) => items.push({ s, pt, seed: si * 1000 + pi * 37 + 11 })));
  // アイランド花壇は奥行きの中央を「奥」とみなす
  const depthOf = (y) => (plan.view === 'island' ? 1 - Math.abs(y / plan.depth - 0.5) * 2 : y / plan.depth);
  items.sort((a, b) => depthOf(b.pt.y) - depthOf(a.pt.y));
  const body = items.map(({ s, pt, seed }) => {
    const d = depthOf(pt.y);
    const k = 1 - 0.18 * d;
    const cx = 20 + pt.x * sx;
    const by = ground - d * depthPx;
    return drawPlant(s.plant, s.color, cx, by, sh * k, nm, seed);
  }).join('');
  return `<svg class="illust" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${month}月の花壇のイメージ図">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient></defs>
    <rect width="${VW}" height="${VH}" fill="url(#sky)"/>
    <path d="M0,${ground - depthPx - 6} L${VW},${ground - depthPx - 6} L${VW},${VH} L0,${VH}Z" fill="${nm === 12 || nm <= 2 ? '#b9b39c' : '#9fb779'}"/>
    ${plan.view === 'border' ? `<g opacity=".28">${Array.from({ length: Math.ceil(VW / 18) }, (_, i) => `<rect x="${i * 18 + 2}" y="${ground - depthPx - 6 - Math.min(150, sh * 1.1)}" width="14" height="${Math.min(150, sh * 1.1)}" fill="#c9b79a" rx="2"/>`).join('')}<rect x="0" y="${ground - depthPx - 6 - Math.min(150, sh * 1.1) + 10}" width="${VW}" height="5" fill="#b5a080"/></g>` : ''}
    <path d="M14,${ground + 4} L${VW - 14},${ground + 4} L${VW - 14 - 18},${ground - depthPx - 4} L${14 + 18},${ground - depthPx - 4}Z" fill="#6d5640"/>
    ${body}
    <rect x="0" y="${ground + 4}" width="${VW}" height="${VH - ground - 4}" fill="${nm === 12 || nm <= 2 ? '#c9c2a8' : '#a9c286'}"/>
    ${opts.label === false ? '' : `<text x="${VW - 12}" y="${VH - 12}" text-anchor="end" font-size="14" fill="#3b4a33" opacity=".8">${month}月のイメージ</text>`}
    ${opts.extra || ''}
  </svg>`;
}

/** 平面図用の色：同じ花色の植物どうしも見分けられるよう、明るさを少しずつ変える */
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(f >= 0 ? c + (255 - c) * f : c * (1 + f)));
  return '#' + ch.map((c) => c.toString(16).padStart(2, '0')).join('');
}
export function mapColors(plan) {
  const seen = {};
  const steps = [0, -0.22, 0.28, -0.4, 0.45, 0.14];
  const out = new Map();
  for (const sp of plan.species) {
    const base = sp.color === 'green' ? LEAF[sp.plant.leaf]?.hex || '#7aa95c' : flowerHex(sp.color);
    const k = (seen[base] = (seen[base] ?? -1) + 1);
    out.set(sp.no, shade(base === '#f7f5ee' ? '#e8e2d0' : base, steps[k % steps.length]));
  }
  return out;
}
/** 同じ植物の株を、近いものどうしで群れ（ドリフト）に分ける */
function clustersOf(positions, link) {
  const left = positions.map((p, i) => i);
  const out = [];
  while (left.length) {
    const group = [left.shift()];
    for (let k = 0; k < group.length; k++) {
      const a = positions[group[k]];
      for (let j = left.length - 1; j >= 0; j--) {
        const b = positions[left[j]];
        if (Math.hypot(a.x - b.x, a.y - b.y) <= link) group.push(left.splice(j, 1)[0]);
      }
    }
    out.push(group.map((i) => positions[i]));
  }
  return out;
}

/** 平面図（上から見た配置）。○が植える位置、うすい色の範囲が育ったときの広がり、番号は植物リストと対応 */
export function planSVG(plan) {
  const VW = 640;
  const sc = Math.min((VW - 110) / plan.width, 430 / plan.depth);
  const bw = plan.width * sc, bd = plan.depth * sc;
  const ox = 46 + (VW - 110 - bw) / 2, oy = 46;
  const VH = bd + oy + 66;
  const X = (x) => ox + x * sc, Y = (y) => oy + bd - y * sc; // 手前（y=0）が下
  const col = mapColors(plan);
  const mask = plan.outline ? { loops: plan.outline } : bedShape(plan.shape, plan.width, plan.depth);
  const shapeD = mask ? (mask.loops || [mask.outline]).map((L) => 'M' + L.map(([x, y]) => `${r1(X(x))} ${r1(Y(y))}`).join('L') + 'Z').join('') : '';
  const uid = (mask ? plan.shape : '') + 'pl' + Math.round(plan.width * 100) + Math.round(plan.depth * 100) + plan.species.length;
  // 方眼（50cmごと）と目盛り
  let grid = '';
  for (let x = 0; x <= plan.width + 1e-6; x += 0.5) grid += `<line x1="${r1(X(x))}" y1="${oy}" x2="${r1(X(x))}" y2="${r1(oy + bd)}" stroke="#fff" stroke-opacity="${Math.abs(x - Math.round(x)) < 1e-6 ? 0.22 : 0.1}"/>`;
  for (let y = 0; y <= plan.depth + 1e-6; y += 0.5) grid += `<line x1="${ox}" y1="${r1(Y(y))}" x2="${r1(ox + bw)}" y2="${r1(Y(y))}" stroke="#fff" stroke-opacity="${Math.abs(y - Math.round(y)) < 1e-6 ? 0.22 : 0.1}"/>`;
  const stepX = plan.width > 8 ? 2 : plan.width > 3 ? 1 : 0.5;
  let ticks = '';
  for (let x = 0; x <= plan.width + 1e-6; x += stepX) ticks += `<text x="${r1(X(x))}" y="${oy - 8}" text-anchor="middle" font-size="14" fill="currentColor" opacity=".6">${+x.toFixed(1)}m</text>`;
  for (let y = 0; y <= plan.depth + 1e-6; y += plan.depth > 3 ? 1 : 0.5) ticks += `<text x="${ox - 6}" y="${r1(Y(y) + 4)}" text-anchor="end" font-size="15" fill="currentColor" opacity=".6">${+y.toFixed(1)}</text>`;
  // 層の境目（ボーダー）
  const bandLines = plan.view === 'border' ? plan.bands.slice(1).map((b) => `<line x1="${ox}" x2="${r1(ox + bw)}" y1="${r1(Y(b.y0))}" y2="${r1(Y(b.y0))}" stroke="#fff" stroke-opacity=".45" stroke-dasharray="6 5"/>`).join('') : '';
  const bandLabels = plan.view === 'border' ? plan.bands.map((b) => `<text x="${r1(ox + bw + 6)}" y="${r1(Y((b.y0 + b.y1) / 2) + 4)}" font-size="15" fill="currentColor" opacity=".65">${LAYER_JA[b.layer] || ''}</text>`).join('') : '';
  // 区画（ポタジェ）
  const plots = (plan.plots || []).map((p) => `<rect x="${r1(X(p.x0))}" y="${r1(Y(p.y1))}" width="${r1((p.x1 - p.x0) * sc)}" height="${r1((p.y1 - p.y0) * sc)}" rx="4" fill="#6d5640" stroke="#a07a4f" stroke-width="3"/>`).join('');
  // 育ったときの広がり（群れごとにひとまとまりの形に見える）
  const spreads = [], dots = [], labels = [], bulbs = [];
  for (const sp of plan.species) {
    const c = col.get(sp.no);
    const R = (sp.plant.spread / 200) * sc;
    if (sp.role === 'under') {
      for (const pt of sp.positions) bulbs.push(`<circle cx="${r1(X(pt.x))}" cy="${r1(Y(pt.y))}" r="2.6" fill="${c}" stroke="#2b2a22" stroke-width=".8"/>`);
      for (const g of clustersOf(sp.positions, 0.35)) {
        const m = g.reduce((a, p) => ({ x: a.x + p.x / g.length, y: a.y + p.y / g.length }), { x: 0, y: 0 });
        labels.push({ x: X(m.x), y: Y(m.y), no: sp.no, c, small: true });
      }
      continue;
    }
    spreads.push(`<g fill="${c}" opacity=".42">${sp.positions.map((pt) => `<circle cx="${r1(X(pt.x))}" cy="${r1(Y(pt.y))}" r="${r1(R)}"/>`).join('')}</g>`);
    for (const pt of sp.positions) dots.push(`<circle cx="${r1(X(pt.x))}" cy="${r1(Y(pt.y))}" r="${r1(Math.max(3, R * 0.32))}" fill="${c}" stroke="#fff" stroke-width="1.3"/>`);
    const groups = clustersOf(sp.positions, (sp.plant.spread / 100) * 1.6).sort((a, b) => b.length - a.length);
    // 番号は大きな群れと、2株以上の群れにだけ付ける（1株だけの群れは凡例の色で見分ける）
    for (const g of groups.filter((g, k) => k === 0 || g.length >= 2).slice(0, 4)) {
      const m = g.reduce((a, p) => ({ x: a.x + p.x / g.length, y: a.y + p.y / g.length }), { x: 0, y: 0 });
      const near = g.reduce((b, p) => (Math.hypot(p.x - m.x, p.y - m.y) < Math.hypot(b.x - m.x, b.y - m.y) ? p : b), g[0]);
      labels.push({ x: X(near.x), y: Y(near.y), no: sp.no, c });
    }
  }
  // 番号札（重ならないように少しずらす）
  const placed = [];
  const tags = labels.map((l) => {
    let { x, y } = l;
    for (let t = 0; t < 8 && placed.some((q) => Math.hypot(q.x - x, q.y - y) < 26); t++) { x += 9 * Math.cos(t * 2.1); y += 9 * Math.sin(t * 2.1); }
    placed.push({ x, y });
    const r = l.small ? 11 : 14;
    return `<g class="tap" data-jump="cast-${l.no}"><circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="#22291f" fill-opacity=".86" stroke="${l.c}" stroke-width="2.5"/><text x="${r1(x)}" y="${r1(y + (l.small ? 5 : 6))}" text-anchor="middle" font-size="${l.small ? 14 : 17}" font-weight="700" fill="#fff">${l.no}</text></g>`;
  }).join('');
  const sbar = [0.5, 1, 2].find((v) => v * sc >= 50) || 2;
  const front = mask && plan.view === 'island' ? `${BED_SHAPES[plan.shape].ja}・四方から眺める花壇${plan.plots ? '（区画の間は通路）' : ''}` : plan.plots ? 'ポタジェ：区画の間は通路（ウッドチップなど）' : plan.view === 'island' ? '四方から眺める花壇' : '▼ 手前（通路・眺める側）';
  return `<svg class="illust plan" viewBox="0 0 ${VW} ${r1(VH)}" role="img" aria-label="花壇の平面図">
    <defs><clipPath id="${uid}">${mask ? `<path d="${shapeD}" clip-rule="evenodd"/>` : `<rect x="${ox}" y="${oy}" width="${r1(bw)}" height="${r1(bd)}" rx="10"/>`}</clipPath>
      <pattern id="${uid}m" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#6d5640"/><circle cx="2" cy="3" r=".9" fill="#7f6650"/><circle cx="6.5" cy="7" r=".7" fill="#5f4a37"/></pattern></defs>
    ${plan.view === 'border' && !plan.plots ? `<text x="${r1(ox + bw / 2)}" y="18" text-anchor="middle" font-size="15" fill="currentColor" opacity=".7">奥（塀・フェンス側）</text>` : ''}
    ${mask ? `<rect x="${ox}" y="${oy}" width="${r1(bw)}" height="${r1(bd)}" rx="10" fill="#cfdcae" opacity=".55"/><path d="${shapeD}" fill-rule="evenodd" fill="${plan.plots ? '#d9ccb0' : `url(#${uid}m)`}"/>` : `<rect x="${ox}" y="${oy}" width="${r1(bw)}" height="${r1(bd)}" rx="10" fill="${plan.plots ? '#d9ccb0' : `url(#${uid}m)`}"/>`}
    <g clip-path="url(#${uid})">${plots}${grid}${bandLines}${spreads.join('')}${bulbs.join('')}${dots.join('')}</g>
    ${mask ? `<path d="${shapeD}" fill="none" stroke="#7d6a48" stroke-width="3" stroke-linejoin="round"/>` : ''}
    ${tags}${ticks}${bandLabels}
    <g transform="translate(${ox} ${r1(VH - 38)})"><path d="M0 0h${r1(sbar * sc)}M0 -4v4M${r1(sbar * sc)} -4v4" stroke="currentColor" stroke-width="1.4" opacity=".7"/><text x="${r1(sbar * sc + 6)}" y="5" font-size="15" fill="currentColor" opacity=".7">${sbar >= 1 ? sbar + 'm' : sbar * 100 + 'cm'}</text></g>
    <text x="${r1(ox + bw)}" y="${r1(VH - 32)}" text-anchor="end" font-size="15" fill="currentColor" opacity=".75">${front}</text>
    <text x="${r1(ox + bw)}" y="${r1(VH - 10)}" text-anchor="end" font-size="13" fill="currentColor" opacity=".6">${mask ? `${BED_SHAPES[plan.shape].ja} 約${plan.area}㎡（外枠 ` : ''}幅${plan.width}m × 奥行き${plan.depth}m${mask ? '）' : ''}・方眼は50cm</text>
  </svg>`;
}

/** 植物1種のイラスト（写真がないときのサムネイル） */
export function plantThumbSVG(p, color = p.color[0], month = p.bloom.length ? p.bloom[Math.floor(p.bloom.length / 2)] : 6) {
  const VW = 160, VH = 120, base = VH - 14;
  const sc = Math.min((VH - 30) / (p.h[1] / 100), (VW - 40) / (p.spread / 100));
  return `<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid slice" class="thumb-svg" role="img" aria-label="${p.ja}のイラスト">
    <rect width="${VW}" height="${VH}" fill="#eef2e6"/><rect y="${base}" width="${VW}" height="${VH - base}" fill="#b9a383"/>
    ${drawPlant(p, color, VW / 2, base, sc, month, p.id.length * 97)}
  </svg>`;
}
