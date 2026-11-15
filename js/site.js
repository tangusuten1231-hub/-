// 庭まるごとプラン：敷地の形（長方形・L字・自由な多角形）から、小道・テラス・パーゴラ・水場などの構造と
// 花壇を配置し、花壇ごとの植栽、見どころ・園内の案内・フォトスポット・生き物をまとめる。
// 敷地は「家が上（y=0側）」の向きで計算し、方角は house（家がある側）から決める。
import { generatePlan } from './plan.js';
import { COLORS } from './plants.js';
import { localMonth } from './garden.js';
import { biodiversity, creaturesForGarden } from './wildlife.js';

/** 入れられる構造物（cost は材料費の目安。DIY想定） */
export const ITEMS = {
  path: { ja: '小道', perSqm: 4000, note: '砂利・踏み石' },
  terrace: { ja: 'テラス', perSqm: 9000, note: 'レンガ・石の敷き込み' },
  pergola: { ja: 'パーゴラ', cost: 90000, note: '木製キット' },
  bench: { ja: 'ベンチ', cost: 25000 },
  water: { ja: 'バードバス', cost: 8000, note: '水鉢でも可' },
  pond: { ja: '小さな池', cost: 30000, note: '防水シート・成形池' },
  tree: { ja: 'シンボルツリー', cost: 20000, note: '樹高2m前後の苗木' },
  lawn: { ja: '芝生・草はら', perSqm: 900, note: '芝の張り付け' },
  kitchen: { ja: 'ハーブ・菜園', note: '花壇として植栽費に含む' },
  compost: { ja: '堆肥・落ち葉置き場', cost: 5000 },
  habitat: { ja: '石積み・枯れ枝の山', cost: 2000 },
  winter: { ja: '冬も枯れ茎を残す', note: '管理方法' },
};
/** 花壇プランのときにも選べる「庭にあるもの」 */
export const BED_ITEMS = ['water', 'pond', 'tree', 'lawn', 'compost', 'habitat', 'winter'];
export const DEFAULT_ITEMS = ['path', 'terrace', 'bench', 'water', 'tree', 'lawn', 'compost'];

const DIRS = ['n', 'e', 's', 'w'];
export const DIR_JA = { n: '北', e: '東', s: '南', w: '西' };

// ---------- 幾何 ----------
/** 多角形の面積（靴ひも公式） */
export function polygonArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}
/** 点が多角形の内側か */
export function inside(x, y, pts) {
  let r = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) r = !r;
  }
  return r;
}
function segDist(px, py, [x1, y1], [x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
/** 辺どうしが交差していないか（自由な形の入力チェック） */
export function isSimple(pts) {
  const n = pts.length;
  if (n < 3) return false;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) continue;
      const c = pts[j], d = pts[(j + 1) % n];
      if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) return false;
    }
  }
  return true;
}

/** 入力から敷地の多角形（m）を作る */
export function siteShape(o) {
  const w = Math.min(60, Math.max(2, Number(o.width) || 10));
  const d = Math.min(60, Math.max(2, Number(o.depth) || 8));
  let pts;
  if (o.shape === 'poly' && Array.isArray(o.points) && o.points.length >= 3) {
    pts = o.points.map(([x, y]) => [Number(x), Number(y)]);
  } else if (o.shape === 'L') {
    const cw = w * 0.45, cd = d * 0.45;
    pts = o.cut === 'left'
      ? [[0, 0], [w, 0], [w, d], [cw, d], [cw, d - cd], [0, d - cd]]
      : [[0, 0], [w, 0], [w, d - cd], [w - cw, d - cd], [w - cw, d], [0, d]];
  } else {
    pts = [[0, 0], [w, 0], [w, d], [0, d]];
  }
  // 原点合わせ
  const minX = Math.min(...pts.map((p) => p[0])), minY = Math.min(...pts.map((p) => p[1]));
  pts = pts.map(([x, y]) => [x - minX, y - minY]);
  // 面積を指定したときは、形を保ったまま拡大縮小
  const want = Number(o.area);
  const a0 = polygonArea(pts);
  if (want > 0 && a0 > 0) {
    const k = Math.sqrt(Math.min(3000, Math.max(4, want)) / a0);
    pts = pts.map(([x, y]) => [x * k, y * k]);
  }
  return pts.map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const down = { full: 'part', part: 'shade', shade: 'shade' };

/**
 * 庭まるごとプランを生成
 * @param o { shape, width, depth, points, area, house:'n'|'e'|'s'|'w', items:[], text, style, sun, moist, wild:[], climate, seed, annuals, budget }
 */
export function generateSite(o) {
  const pts = siteShape(o);
  const area = polygonArea(pts);
  const W = Math.max(...pts.map((p) => p[0]));
  const H = Math.max(...pts.map((p) => p[1]));
  const items = new Set(Array.isArray(o.items) ? o.items.filter((k) => ITEMS[k]) : DEFAULT_ITEMS);
  // 小さな庭（15㎡未満）では、場所をとる構造物は入れない
  const skipped = [];
  if (area < 15) for (const k of ['terrace', 'pergola', 'pond', 'tree', 'lawn']) if (items.delete(k)) skipped.push(ITEMS[k].ja);
  const house = DIRS.includes(o.house) ? o.house : 'n';
  const hi = DIRS.indexOf(house);
  const screen = { up: DIRS[hi], right: DIRS[(hi + 1) % 4], down: DIRS[(hi + 2) % 4], left: DIRS[(hi + 3) % 4] };

  // 方眼（1マス c m）
  const c = clamp(Math.ceil(Math.sqrt((W * H) / 3000) * 4) / 4, 0.25, 1);
  const nx = Math.ceil(W / c), ny = Math.ceil(H / c);
  const cells = [];
  const grid = Array.from({ length: ny }, () => Array(nx).fill(null));
  const edges = pts.map((p, i) => [p, pts[(i + 1) % pts.length]]);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x = (i + 0.5) * c, y = (j + 0.5) * c;
    if (!inside(x, y, pts)) continue;
    let best = Infinity, bi = 0;
    edges.forEach((e, k) => { const dd = segDist(x, y, e[0], e[1]); if (dd < best) { best = dd; bi = k; } });
    const cell = { i, j, x, y, d: best, edge: bi, zone: 'lawn' };
    grid[j][i] = cell;
    cells.push(cell);
  }
  const at = (x, y) => grid[Math.floor(y / c)]?.[Math.floor(x / c)] || null;
  const minDim = Math.min(W, H, Math.sqrt(area));
  const bD = clamp(minDim * 0.16, 0.9, 2.2); // 花壇の奥行き
  const pW = minDim < 5 ? 0.6 : 0.9; // 小道の幅
  const ringPath = items.has('path') && minDim >= 6;
  const topRow = cells.filter((q) => q.y < Math.min(H * 0.25, 3));
  const cx = topRow.length ? topRow.reduce((t, q) => t + q.x, 0) / topRow.length : W / 2;

  // 辺の外向きの向き（画面上 → 方角）
  const sideOf = (k) => {
    const [[x1, y1], [x2, y2]] = edges[k];
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    let nxv = y2 - y1, nyv = -(x2 - x1);
    const L = Math.hypot(nxv, nyv) || 1; nxv /= L; nyv /= L;
    if (inside(mx + nxv * 0.05, my + nyv * 0.05, pts)) { nxv = -nxv; nyv = -nyv; }
    return Math.abs(nxv) > Math.abs(nyv) ? (nxv > 0 ? 'right' : 'left') : (nyv > 0 ? 'down' : 'up');
  };
  const edgeSide = edges.map((_, k) => sideOf(k));

  // 1) テラス
  const tD = clamp(H * 0.18, 1.6, 3.5), tW = clamp(W * 0.42, 2.4, 6);
  const terraceOn = items.has('terrace');
  // 2) ゾーン分け
  for (const q of cells) {
    if (terraceOn && q.y < tD && Math.abs(q.x - cx) < tW / 2) q.zone = 'terrace';
    else if (q.d < bD) q.zone = 'bed';
    else if (ringPath && q.d < bD + pW) q.zone = 'path';
    else q.zone = items.has('lawn') ? 'lawn' : 'meadow';
  }
  // 小さな庭・芝生なし：テラスから奥への小道（ゆるく曲げる）
  const farY = Math.max(...cells.map((q) => q.y));
  const wave = (y) => cx + Math.sin((y / Math.max(H, 1)) * Math.PI * 1.2) * Math.min(W * 0.12, 1.5);
  if (items.has('path') && (!ringPath || !items.has('lawn'))) {
    for (const q of cells) if (q.zone !== 'terrace' && Math.abs(q.x - wave(q.y)) < pW / 2 && q.y > (terraceOn ? tD - c : 0)) q.zone = 'path';
  }
  const structs = [];
  const near = (x, y, pred) => {
    let best = null, bd = Infinity;
    for (const q of cells) { if (!pred(q)) continue; const dd = Math.hypot(q.x - x, q.y - y); if (dd < bd) { bd = dd; best = q; } }
    return best;
  };
  const carve = (x, y, rx, ry, zone, pred = () => true) => {
    for (const q of cells) if (((q.x - x) / rx) ** 2 + ((q.y - y) / ry) ** 2 <= 1 && pred(q)) q.zone = zone;
  };

  // 3) パーゴラ（奥の小道の上、またはいちばん奥）とベンチ
  const farCell = near(cx, farY, (q) => q.zone === 'path') || near(cx, farY, (q) => q.zone === 'bed');
  if (items.has('pergola') && farCell) {
    const s = clamp(minDim * 0.22, 1.8, 3);
    const py = Math.min(farCell.y, farY - s / 2 + c);
    carve(farCell.x, py, s, s, 'paving', (q) => Math.abs(q.x - farCell.x) <= s / 2 && Math.abs(q.y - py) <= s / 2 && q.zone !== 'terrace');
    structs.push({ type: 'pergola', x: farCell.x, y: py, w: s, h: s });
    if (items.has('bench')) structs.push({ type: 'bench', x: farCell.x, y: py + s * 0.25, w: Math.min(1.5, s * 0.6), h: 0.45 });
  } else if (items.has('bench') && farCell) {
    carve(farCell.x, farCell.y, 0.9, 0.6, 'paving', (q) => q.zone !== 'terrace');
    structs.push({ type: 'bench', x: farCell.x, y: Math.min(farCell.y, farY - 0.3), w: 1.4, h: 0.45 });
  }
  const openZone = (q) => q.zone === 'lawn' || q.zone === 'meadow';
  // 4) 池（日の当たる芝生の端）
  if (items.has('pond')) {
    const r = clamp(Math.sqrt(area) * 0.08, 0.6, 1.4);
    const q = near(cx - W * 0.22, H * 0.55, (z) => openZone(z) && z.d > bD + r * 0.6) || near(cx - W * 0.22, H * 0.55, (z) => z.zone === 'bed');
    if (q) { carve(q.x, q.y, r * 1.25, r, 'pond', (z) => z.zone !== 'terrace' && z.zone !== 'path'); structs.push({ type: 'pond', x: q.x, y: q.y, rx: r * 1.25, ry: r }); }
  }
  // 5) バードバス（テラスから見える芝生の中ほど、花壇の近く）
  if (items.has('water')) {
    const q = near(cx + W * 0.2, H * 0.45, (z) => openZone(z) && z.d > bD + 0.4) || near(cx + W * 0.2, H * 0.5, (z) => z.zone === 'bed');
    if (q) structs.push({ type: 'water', x: q.x, y: q.y });
  }
  // 6) シンボルツリー（奥の角の花壇）
  if (items.has('tree')) {
    const q = near(bD * 0.8, farY - bD * 0.8, (z) => z.zone === 'bed' && z.d > bD * 0.45);
    if (q) structs.push({ type: 'tree', x: q.x, y: q.y, r: clamp(minDim * 0.18, 1.2, 2.5) });
  }
  // 7) 堆肥置き場（奥の反対の角・目立たない所）
  if (items.has('compost')) {
    const q = near(W, farY, (z) => z.zone === 'bed');
    if (q) { carve(q.x, q.y, 0.7, 0.7, 'compost', (z) => z.zone === 'bed'); structs.push({ type: 'compost', x: q.x, y: q.y }); }
  }
  // 8) 石積み（池か奥の花壇の近く）
  if (items.has('habitat')) {
    const pond = structs.find((s) => s.type === 'pond');
    const q = pond ? near(pond.x + pond.rx + 0.4, pond.y, (z) => openZone(z) || z.zone === 'bed') : near(W * 0.3, farY, (z) => z.zone === 'bed');
    if (q) structs.push({ type: 'habitat', x: q.x, y: q.y });
  }
  // 9) ハーブ・菜園（テラスの横、台所に近い所）
  if (items.has('kitchen')) {
    for (const q of cells) if (q.zone === 'bed' && q.y < (terraceOn ? tD + 1 : H * 0.3) && q.x > cx) q.zone = 'kitchen';
    if (!cells.some((q) => q.zone === 'kitchen')) carve(W * 0.8, H * 0.25, 1.2, 0.8, 'kitchen', openZone);
  }
  // 10) 芝生なしで中央が広い → 草はらの花壇（メドウ）。芝生が広い → 島花壇
  const open = cells.filter(openZone);
  if (items.has('lawn') && open.length * c * c > 30) {
    // 芝生の中で、構造物や花壇からいちばん離れた所に楕円の島花壇
    const r0 = Math.sqrt((open.length * c * c * 0.14) / Math.PI);
    let best = null, bc = 0;
    for (const q of open) {
      let cl = q.d - bD - (ringPath ? pW : 0);
      for (const s2 of structs) cl = Math.min(cl, Math.hypot(s2.x - q.x, s2.y - q.y) - (s2.rx || s2.w / 2 || 0.6) - 0.5);
      if (terraceOn) cl = Math.min(cl, q.y - tD);
      if (cl > bc) { bc = cl; best = q; }
    }
    const r = Math.min(r0, bc * 0.85);
    if (best && r >= 0.7) carve(best.x, best.y, r * 1.35, r * 0.8, 'island', (z) => z.zone === 'lawn');
  }

  // ---------- 花壇を分ける ----------
  const bedZones = ['bed', 'island', 'meadow', 'kitchen'];
  const sideKey = (q) => (q.zone === 'bed' ? edgeSide[q.edge] : q.zone);
  const seen = new Set();
  const regions = [];
  for (const q of cells) {
    if (!bedZones.includes(q.zone) || seen.has(q)) continue;
    const key = sideKey(q);
    const stack = [q]; const reg = [];
    seen.add(q);
    while (stack.length) {
      const a = stack.pop(); reg.push(a);
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const b = grid[a.j + dj]?.[a.i + di];
        if (b && !seen.has(b) && b.zone === a.zone && sideKey(b) === key) { seen.add(b); stack.push(b); }
      }
    }
    regions.push({ zone: q.zone, side: key, cells: reg });
  }
  // 小さすぎる断片は隣の芝生/草はらへ
  const minCells = Math.max(3, Math.round(0.6 / (c * c)));
  const keep = regions.filter((r) => r.cells.length >= minCells);
  for (const r of regions) if (!keep.includes(r)) r.cells.forEach((q) => { q.zone = items.has('lawn') ? 'lawn' : 'meadow'; });
  keep.sort((a, b) => b.cells.length - a.cells.length);
  const top = keep.slice(0, 8);
  for (const r of keep.slice(8)) r.cells.forEach((q) => { q.zone = items.has('lawn') ? 'lawn' : 'meadow'; });

  const tree = structs.find((s) => s.type === 'tree');
  const sunBase = o.sun || 'full';
  const LETTERS = 'ABCDEFGH';
  const beds = top
    .map((r) => {
      const n = r.cells.length;
      const bx = r.cells.reduce((t, q) => t + q.x, 0) / n;
      const by = r.cells.reduce((t, q) => t + q.y, 0) / n;
      return { ...r, x: bx, y: by, area: n * c * c };
    })
    .sort((a, b) => Math.atan2(a.y - H / 2, a.x - W / 2) - Math.atan2(b.y - H / 2, b.x - W / 2))
    .map((r, k) => {
      const compass = ['up', 'down', 'left', 'right'].includes(r.side) ? screen[r.side] : null;
      let sun = sunBase;
      const why = [];
      if (compass === 's') { sun = down[sun]; why.push('南側の塀やフェンスの影'); }
      if (r.side === 'up' && house === 's') { sun = down[sun]; why.push('家の北側'); }
      if (tree && r.cells.filter((q) => Math.hypot(q.x - tree.x, q.y - tree.y) < tree.r).length > n2(r) * 0.3) { sun = down[sun]; why.push('木陰'); }
      if (compass === 'n' && house !== 'n') why.push('南向きでよく日が当たる');
      const island = r.zone === 'island' || r.zone === 'meadow';
      const depth = island ? Math.max(1.2, Math.sqrt(r.area) * 0.8) : r.zone === 'kitchen' ? Math.min(bD, 1.2) : bD;
      const width = clamp(r.area / depth, 0.6, 30);
      const name = r.zone === 'kitchen' ? 'キッチンハーブの花壇'
        : r.zone === 'island' ? '芝生の島花壇'
          : r.zone === 'meadow' ? '草はらの花壇'
            : r.side === 'up' ? '家ぞいの花壇'
              : `${DIR_JA[compass]}側のボーダー`;
      const nearPond = structs.some((s) => s.type === 'pond' && Math.hypot(s.x - r.x, s.y - r.y) < s.rx + 2.5);
      return {
        id: LETTERS[k], name, zone: r.zone, side: r.side, compass, cells: r.cells, x: r.x, y: r.y,
        area: Math.round(r.area * 10) / 10, width: Math.round(width * 10) / 10, depth: Math.round(clamp(depth, 0.5, 10) * 10) / 10,
        sun, sunWhy: why, view: island ? 'island' : 'border', moist: nearPond && !o.moist ? 'wet' : o.moist || '',
      };
    });
  function n2(r) { return r.cells.length; }
  // 同じ名前の花壇は位置で呼び分ける
  for (const b of beds) {
    const same = beds.filter((x) => x.name === b.name);
    if (same.length < 2) continue;
    const spreadX = Math.max(...same.map((x) => x.x)) - Math.min(...same.map((x) => x.x));
    const spreadY = Math.max(...same.map((x) => x.y)) - Math.min(...same.map((x) => x.y));
    same.forEach((x) => { x.label = spreadX >= spreadY ? (x.x < W / 2 ? screen.left : screen.right) : (x.y < H / 2 ? screen.up : screen.down); });
    same.forEach((x) => { if (x.label) { x.name = `${x.name}（${DIR_JA[x.label]}寄り）`; delete x.label; } });
  }

  // ---------- 花壇ごとの植栽 ----------
  for (const [k, b] of beds.entries()) {
    const text = b.zone === 'kitchen' ? `ハーブ、香り、${o.text || ''}` : o.text || '';
    b.plan = generatePlan({
      climate: o.climate, sun: b.sun, moist: b.moist, width: b.width, depth: b.depth, text,
      view: b.view, style: b.zone === 'kitchen' ? 'border' : o.style, seed: (o.seed || 0) + k, annuals: o.annuals || b.zone === 'kitchen', wild: o.wild,
    });
  }

  // ---------- 面積と費用 ----------
  const zoneArea = (z) => Math.round(cells.filter((q) => q.zone === z).length * c * c * 10) / 10;
  const areas = {
    bed: Math.round(beds.reduce((t, b) => t + b.area, 0) * 10) / 10,
    path: Math.round((zoneArea('path') + zoneArea('paving')) * 10) / 10,
    terrace: zoneArea('terrace'), lawn: zoneArea('lawn'), pond: zoneArea('pond'),
  };
  const costs = [];
  const plantCost = beds.reduce((t, b) => t + (b.plan.species.length ? b.plan.cost.total : 0), 0);
  costs.push({ ja: `花壇の苗・土づくり（${areas.bed}㎡）`, cost: plantCost });
  if (areas.path) costs.push({ ja: `小道（${areas.path}㎡・${ITEMS.path.note}）`, cost: areas.path * ITEMS.path.perSqm });
  if (areas.terrace) costs.push({ ja: `テラス（${areas.terrace}㎡・${ITEMS.terrace.note}）`, cost: areas.terrace * ITEMS.terrace.perSqm });
  if (areas.lawn) costs.push({ ja: `芝生（${areas.lawn}㎡）`, cost: areas.lawn * ITEMS.lawn.perSqm });
  for (const s of structs) if (ITEMS[s.type]?.cost) costs.push({ ja: ITEMS[s.type].ja + (ITEMS[s.type].note ? `（${ITEMS[s.type].note}）` : ''), cost: ITEMS[s.type].cost });
  const total = costs.reduce((t, x) => t + x.cost, 0);

  // ---------- 生き物 ----------
  const allPlants = [...new Map(beds.flatMap((b) => b.plan.species.map((s) => [s.plant.id, s.plant]))).values()];
  const features = featuresOf(items, structs);
  const bio = biodiversity(allPlants, features, o.climate);
  const critters = creaturesForGarden(allPlants, features, o.climate);

  const site = {
    pts, area: Math.round(area * 10) / 10, W, H, c, cells, house, screen, items: [...items], structs, beds, areas,
    cost: { items: costs, total: Math.round(total), budget: Number(o.budget) || null }, skipped,
    plants: allPlants, features, bio, critters, cx, terrace: terraceOn ? { x: cx, y: tD / 2, w: tW, h: tD } : null,
  };
  site.tour = tourOf(site, o.climate);
  site.photos = photoSpots(site, o.climate);
  site.highlights = highlightsOf(site, o.climate);
  return site;
}

/** 構造物から、生き物にとっての庭の環境を読み取る */
export function featuresOf(items, structs = []) {
  const has = (k) => items.has ? items.has(k) : items.includes(k);
  const f = {};
  if (has('water')) f.water = true;
  if (has('pond')) { f.pond = true; f.water = true; }
  if (has('tree')) { f.tree = true; f.shrub = true; }
  if (has('lawn')) f.lawn = true;
  if (has('compost')) f.compost = true;
  if (has('habitat')) f.habitat = true;
  if (has('winter')) f.winter = true;
  if (has('pergola') || structs.some((s) => s.type === 'pergola')) f.structure = true;
  return f;
}

// ---------- プレゼンテーション ----------
const SEASONS = [
  { key: 'spring', ja: '春', en: 'Spring', months: [3, 4, 5] },
  { key: 'early', ja: '初夏', en: 'Early Summer', months: [5, 6] },
  { key: 'summer', ja: '夏', en: 'Summer', months: [7, 8] },
  { key: 'autumn', ja: '秋', en: 'Autumn', months: [9, 10, 11] },
  { key: 'winter', ja: '冬', en: 'Winter', months: [12, 1, 2] },
];
const nameOf = (p) => p.groupJa?.replace(/（.*?）/g, '') || p.ja;
const has = (site, t) => site.structs.some((s) => s.type === t);

function stars(site, months, south) {
  const m = new Set(months);
  const score = new Map();
  for (const b of site.beds) for (const sp of b.plan.species) {
    if (!sp.plant.bloom.some((x) => m.has(localMonth(x, south)))) continue;
    const key = nameOf(sp.plant);
    const share = sp.plant.bloom.filter((x) => m.has(localMonth(x, south))).length / sp.plant.bloom.length;
    const cur = score.get(key) || { p: sp.plant, color: sp.color, qty: 0, w: 0, beds: new Set() };
    cur.qty += sp.qty; cur.w += sp.qty * (0.3 + share); cur.beds.add(b.id);
    score.set(key, cur);
  }
  return [...score.values()].sort((a, b) => b.w - a.w);
}

/** 季節ごとの見どころ */
export function highlightsOf(site, climate) {
  const south = !!climate?.south;
  const out = [];
  const grasses = site.plants.filter((p) => p.form === 'grass');
  for (const s of SEASONS) {
    const months = s.months;
    const st = stars(site, months, south).slice(0, 4);
    const crit = site.critters.filter((x) => x.level >= 2 && x.creature.months.some((m) => months.includes(south ? ((m + 5) % 12) + 1 : m)))
      .sort((a, b) => (a.creature.months.length === 12) - (b.creature.months.length === 12) || b.score - a.score).slice(0, 3);
    const lines = [];
    if (st.length) {
      const names = st.slice(0, 3).map((x) => nameOf(x.p)).join('、');
      const bedName = site.beds.find((b) => st[0].beds.has(b.id))?.name;
      lines.push(s.key === 'spring' ? `${bedName ? bedName + 'から' : ''}${names}が咲きはじめ、庭が目を覚まします。`
        : s.key === 'early' ? `いちばん花の多い季節。${names}が重なり合い、${has(site, 'pergola') ? 'パーゴラの下から眺める花壇' : '小道ぞいの花壇'}が見せ場です。`
          : s.key === 'summer' ? `暑さに強い${names}が庭を支えます。${has(site, 'water') || has(site, 'pond') ? '水辺がある庭は、真夏も涼しげ。' : '朝夕の水やりの時間が楽しみに。'}`
            : s.key === 'autumn' ? `${names}が咲き、${grasses.length ? `${nameOf(grasses[0])}の穂が光を受けて輝きます。` : '庭の色が深まります。'}`
              : `${names}が冬の庭に色を添えます。`);
    } else if (s.key === 'winter') {
      lines.push(site.items.includes('winter') || grasses.length ? '枯れた茎や穂を残した庭に霜がおりると、銀色の彫刻のような景色に。' : '静かに休む季節。株元の芽を見つけるのが楽しみです。');
    }
    if (s.key === 'winter' && (has(site, 'water') || has(site, 'tree'))) lines.push(`${has(site, 'water') ? 'バードバス' : 'シンボルツリー'}に小鳥が集まる季節です。`);
    if (crit.length) lines.push(`${crit.map((x) => x.creature.ja).join('・')}に会えるかもしれません。`);
    out.push({ ...s, stars: st, text: lines.join('') });
  }
  return out;
}

const STRUCT_TOUR = {
  terrace: { title: 'テラス', text: () => 'ここが庭の入り口。お茶を飲みながら、庭全体を見渡せます。' },
  pergola: { title: 'パーゴラ', text: (s) => `${has(s, 'bench') ? 'ベンチに腰かけてひと休み。' : ''}振り返ると、花壇ごしに家とテラスが額縁のように見えます。つるバラやクレマチスをからませても。` },
  bench: { title: 'ベンチ', text: () => '奥のベンチは、庭をいちばん長く眺められる特等席です。' },
  water: { title: 'バードバス', text: () => '小鳥の水飲み場。冬の朝は、シジュウカラやメジロが順番に水浴びに来ます。水は毎日入れ替えて。' },
  pond: { title: '小さな池', text: () => 'トンボやカエルの暮らす場所。水面に空と花が映ります。' },
  tree: { title: 'シンボルツリー', text: () => '庭に高さと木陰をつくる一本。セミや野鳥のよりどころになります。' },
  compost: { title: '堆肥置き場', text: () => '落ち葉と刈った草を積んでおく場所。ミミズやテントウムシが冬を越し、やがて花壇の土に。' },
  habitat: { title: '石積み', text: () => '石や枯れ枝のすき間は、トカゲやカエル、蜂の隠れ家です。' },
};

/** 園内の案内（テラスから小道をめぐる順） */
export function tourOf(site) {
  const stops = [];
  if (site.terrace) stops.push({ kind: 'terrace', x: site.terrace.x, y: site.terrace.y });
  else stops.push({ kind: 'start', x: site.cx, y: 0.6 });
  for (const b of site.beds) stops.push({ kind: 'bed', bed: b, x: b.x, y: b.y });
  for (const s of site.structs) if (STRUCT_TOUR[s.type] && !(s.type === 'bench' && has(site, 'pergola'))) stops.push({ kind: s.type, x: s.x, y: s.y });
  // テラスから時計回り（家から見て）
  const [ox, oy] = [site.W / 2, site.H / 2];
  const ang = (p) => { let a = Math.atan2(p.y - oy, p.x - ox) + Math.PI / 2; if (a < 0) a += Math.PI * 2; return a; };
  const first = stops.shift();
  stops.sort((a, b) => ang(a) - ang(b));
  stops.unshift(first);
  return stops.map((st, i) => {
    let title, text;
    if (st.kind === 'bed') {
      const b = st.bed;
      const peak = b.plan.peak;
      const top = [...b.plan.species].sort((x, y) => y.qty - x.qty).slice(0, 3).map((sp) => nameOf(sp.plant));
      title = `${b.id}　${b.name}`;
      text = b.plan.species.length
        ? `${peak}月ごろが見頃。${top.join('、')}が主役です。${b.sunWhy.length ? `（${b.sunWhy[0]}のため${b.sun === 'full' ? '日向' : b.sun === 'part' ? '半日陰' : '日陰'}向けの植物）` : ''}`
        : '条件に合う植物が少ない場所です。グラウンドカバーや鉢で楽しみましょう。';
    } else if (st.kind === 'start') {
      title = '庭の入り口'; text = 'ここから庭をめぐります。';
    } else {
      title = STRUCT_TOUR[st.kind].title; text = STRUCT_TOUR[st.kind].text(site);
    }
    return { no: i + 1, x: st.x, y: st.y, kind: st.kind, title, text };
  });
}

/** 画面上の向き（ラジアン）から方角の日本語 */
function dirJa(site, angle) {
  const a = ((angle * 180) / Math.PI + 360) % 360; // 0=右, 90=下
  const k = Math.round(a / 90) % 4; // 0右 1下 2左 3上
  return DIR_JA[site.screen[['right', 'down', 'left', 'up'][k]]];
}
/** ある方角を向く画面上の角度 */
function angleTo(site, compass) {
  const k = ['right', 'down', 'left', 'up'].findIndex((s) => site.screen[s] === compass);
  return (k * Math.PI) / 2;
}

/** フォトスポット：どこから、何を、いつ撮るか */
export function photoSpots(site, climate) {
  const south = !!climate?.south;
  const out = [];
  const all = stars(site, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], south);
  const counts = Array(12).fill(0);
  site.beds.forEach((b) => b.plan.counts?.forEach((n, i) => { counts[i] += n; }));
  const peak = counts.indexOf(Math.max(...counts)) + 1;
  const far = site.structs.find((s) => s.type === 'pergola') || site.structs.find((s) => s.type === 'bench');
  const start = site.terrace || { x: site.cx, y: 0.5 };
  if (far) {
    const a = Math.atan2(far.y - start.y, far.x - start.x);
    out.push({ x: start.x, y: start.y + (site.terrace ? site.terrace.h * 0.3 : 0), dir: a, title: '小道の奥行き', shot: `テラスから奥の${far.type === 'pergola' ? 'パーゴラ' : 'ベンチ'}へ続く小道を、花壇ごしに。道の線が視線を奥へ導き、庭が実際より広く写ります。`, when: `${peak}月・朝のやわらかい斜光`, tip: 'しゃがんで手前の花を少し入れると奥行きが出ます。' });
  }
  const perg = site.structs.find((s) => s.type === 'pergola');
  if (perg) out.push({ x: perg.x, y: perg.y, dir: -Math.PI / 2, title: 'パーゴラの額縁', shot: 'パーゴラの柱と梁を額縁にして、花壇とテラスを振り返る一枚。', when: `${peak}月・夕方`, tip: '柱を画面の左右に入れ、中央に花壇の主役を置きます。' });
  const grassBed = [...site.beds].sort((a, b) => b.plan.species.filter((s) => s.plant.form === 'grass').length - a.plan.species.filter((s) => s.plant.form === 'grass').length)[0];
  const grass = grassBed?.plan.species.find((s) => s.plant.form === 'grass');
  if (grass) {
    const west = angleTo(site, 'w');
    out.push({ x: grassBed.x - Math.cos(west) * 1.5, y: grassBed.y - Math.sin(west) * 1.5, dir: west, title: '逆光に光る穂', shot: `${nameOf(grass.plant)}の穂を、沈む夕日の方向（${dirJa(site, west)}）に向かって低い位置から。穂の輪郭が金色に光ります。`, when: `${localMonth(10, south)}月・日没の30分前`, tip: '太陽を穂の陰に隠すと、まぶしさが和らぎます。' });
  }
  const water = site.structs.find((s) => s.type === 'water');
  if (water) out.push({ x: start.x, y: start.y, dir: Math.atan2(water.y - start.y, water.x - start.x), title: '水浴びする小鳥', shot: 'バードバスに来るシジュウカラやメジロ。テラスや窓辺から静かに待ちます。', when: `${localMonth(1, south)}月・晴れた朝`, tip: 'ズームで少し離れて撮ると、鳥が安心して来てくれます。' });
  const pond = site.structs.find((s) => s.type === 'pond');
  if (pond) out.push({ x: pond.x + pond.rx + 0.6, y: pond.y, dir: Math.PI, title: '水面のうつり込み', shot: '池のふちから水面すれすれに。空と周りの花が映り込み、トンボがとまる瞬間も。', when: `${localMonth(7, south)}月・風のない朝`, tip: 'スマホを逆さに持つとレンズが水面に近づきます。' });
  const bf = site.critters.find((x) => (x.creature.kind === 'butterfly' || x.creature.kind === 'bee') && x.level >= 2);
  const bfBed = bf && site.beds.find((b) => b.plan.species.length);
  if (bf && bfBed) {
    const flower = all.find((x) => bf.why.some((w) => w.includes(nameOf(x.p))))?.p || bfBed.plan.species[0].plant;
    const m = flower.bloom.find((x) => bf.creature.months.includes(x)) || flower.bloom[0];
    const b = site.beds.find((bb) => bb.plan.species.some((s) => s.plant.id === flower.id)) || bfBed;
    out.push({ x: b.x, y: b.y, dir: -Math.PI / 2, title: `${bf.creature.ja}と${nameOf(flower)}`, shot: `${nameOf(flower)}の花に来る${bf.creature.ja}のクローズアップ。`, when: `${localMonth(m || 6, south)}月・晴れて風の弱い午前`, tip: '花にピントを合わせて待ち、来た瞬間に連写します。' });
  }
  if (site.items.includes('winter') || site.plants.some((p) => p.uses?.includes('winter'))) {
    const b = site.beds[0];
    if (b) out.push({ x: b.x, y: b.y, dir: Math.PI / 2, title: '霜の朝', shot: '刈らずに残した花がらやシードヘッドに霜がおりた、冬だけの景色。', when: `${localMonth(1, south)}月・冷えこんだ朝の日の出直後`, tip: '日が当たると霜はすぐ溶けます。早起きして。' });
  }
  const placed = [];
  for (const p of out) {
    while (placed.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 0.9)) p.x += 0.9;
    placed.push(p);
  }
  return out.slice(0, 6).map((p, i) => ({ ...p, no: i + 1 }));
}

// ---------- 描画 ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const ZONE_FILL = { lawn: '#cfdcae', meadow: '#d9d3a6', path: '#e8dcc0', paving: '#ddcfb0', terrace: '#d3bf98', pond: '#9cc4cf', bed: '#b9a079', island: '#b9a079', kitchen: '#b39a6f', compost: '#8f7653' };

/** 敷地図（SVG）。opts.tour / opts.photos で案内とフォトスポットを重ねる */
export function siteSVG(site, opts = {}) {
  const pad = 28, top = 34;
  const S = Math.min(560 / site.W, 520 / site.H, 60);
  const VW = site.W * S + pad * 2, VH = site.H * S + top + pad + 8;
  const X = (x) => pad + x * S, Y = (y) => top + y * S;
  const c = site.c;
  const uid = 's' + Math.round(site.area * 10) + site.beds.length;
  // 行ごとに同じゾーンのマスをまとめて描く
  const rows = new Map();
  for (const q of site.cells) { if (!rows.has(q.j)) rows.set(q.j, []); rows.get(q.j).push(q); }
  let rects = '';
  for (const row of rows.values()) {
    row.sort((a, b) => a.i - b.i);
    let run = null;
    const flush = () => { if (run) rects += `<rect x="${X(run.i0 * c).toFixed(1)}" y="${Y(run.j * c).toFixed(1)}" width="${((run.i1 - run.i0 + 1) * c * S + 0.6).toFixed(1)}" height="${(c * S + 0.6).toFixed(1)}" fill="${run.fill}"/>`; };
    for (const q of row) {
      const z = q.zone === 'paving' ? 'paving' : q.zone;
      const fill = z === 'path' || z === 'paving' ? `url(#${uid}g)` : z === 'terrace' ? `url(#${uid}t)` : ZONE_FILL[z];
      if (run && run.fill === fill && q.i === run.i1 + 1) run.i1 = q.i;
      else { flush(); run = { i0: q.i, i1: q.i, j: q.j, fill }; }
    }
    flush();
  }
  // 植栽（背の高いものを花壇の奥＝塀側、島花壇は中央に）
  let plants = '';
  for (const b of site.beds) {
    const sp = [...b.plan.species].sort((a, b2) => b2.plant.h[1] - a.plant.h[1]);
    if (!sp.length) continue;
    const order = [...b.cells].sort((a, q) => (b.view === 'island' ? Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y) : a.d - q.d));
    const step = Math.max(1, Math.round(0.45 / c));
    const pick = order.filter((q) => (q.i + q.j * 2) % step === 0 || step === 1);
    const tot = sp.reduce((t, s) => t + s.qty, 0);
    let k = 0;
    sp.forEach((s) => {
      const nn = Math.max(1, Math.round((s.qty / tot) * pick.length));
      for (let t = 0; t < nn && k < pick.length; t++, k++) {
        const q = pick[k];
        const r = Math.max(2.2, Math.min(9, (s.plant.spread / 100) * S * 0.42));
        const col = s.plant.form === 'grass' ? '#c9b77a' : COLORS[s.color]?.hex || '#8a9a5b';
        const jx = ((q.i * 7 + q.j * 3) % 5) / 10 - 0.2, jy = ((q.i * 3 + q.j * 5) % 5) / 10 - 0.2;
        plants += `<circle cx="${X(q.x + jx * c).toFixed(1)}" cy="${Y(q.y + jy * c).toFixed(1)}" r="${r.toFixed(1)}" fill="${col}" fill-opacity=".85" stroke="#5d6b3a" stroke-opacity=".35" stroke-width=".6"/>`;
      }
    });
  }
  // 構造物
  let st = '', under = '';
  for (const s of site.structs) {
    if (s.type === 'pergola') {
      const x0 = X(s.x - s.w / 2), y0 = Y(s.y - s.h / 2), w = s.w * S, h = s.h * S;
      st += `<g stroke="#7a5a3a" stroke-width="2" fill="none"><rect x="${x0}" y="${y0}" width="${w}" height="${h}" stroke-dasharray="0" fill="#7a5a3a" fill-opacity=".06"/>${[0.2, 0.4, 0.6, 0.8].map((t) => `<line x1="${x0}" y1="${y0 + h * t}" x2="${x0 + w}" y2="${y0 + h * t}" stroke-width="1.2"/>`).join('')}</g>${[[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b2]) => `<rect x="${x0 + a * w - 3}" y="${y0 + b2 * h - 3}" width="6" height="6" fill="#6b4c2e"/>`).join('')}`;
    } else if (s.type === 'bench') {
      st += `<rect x="${X(s.x - s.w / 2)}" y="${Y(s.y - s.h / 2)}" width="${s.w * S}" height="${Math.max(5, s.h * S)}" rx="2" fill="#a07a4f" stroke="#6b4c2e"/>`;
    } else if (s.type === 'water') {
      st += `<circle cx="${X(s.x)}" cy="${Y(s.y)}" r="${Math.max(7, 0.35 * S)}" fill="#e9e2d0" stroke="#8c8471" stroke-width="1.5"/><circle cx="${X(s.x)}" cy="${Y(s.y)}" r="${Math.max(4.5, 0.24 * S)}" fill="#8fc0cf"/>`;
    } else if (s.type === 'pond') {
      st += `<ellipse cx="${X(s.x)}" cy="${Y(s.y)}" rx="${s.rx * S}" ry="${s.ry * S}" fill="none" stroke="#7d9aa0" stroke-width="2.5" stroke-dasharray="3 2"/><path d="M${X(s.x - s.rx * 0.4)} ${Y(s.y - s.ry * 0.2)} q${s.rx * S * 0.2} -4 ${s.rx * S * 0.4} 0" stroke="#fff" stroke-opacity=".7" fill="none" stroke-width="1.5"/>`;
    } else if (s.type === 'tree') {
      under += `<circle cx="${X(s.x)}" cy="${Y(s.y)}" r="${s.r * S}" fill="#6f8f4e" fill-opacity=".32" stroke="#57733b" stroke-opacity=".6" stroke-dasharray="4 3"/><circle cx="${X(s.x)}" cy="${Y(s.y)}" r="4" fill="#6b4c2e"/>`;
    } else if (s.type === 'compost') {
      st += `<rect x="${X(s.x) - 9}" y="${Y(s.y) - 9}" width="18" height="18" fill="#7d6343" stroke="#4f3d27"/><path d="M${X(s.x) - 9} ${Y(s.y) - 3}h18M${X(s.x) - 9} ${Y(s.y) + 3}h18" stroke="#4f3d27"/>`;
    } else if (s.type === 'habitat') {
      st += [[-6, 2, 5], [3, 3, 6], [-1, -4, 4.5], [7, -2, 3.5]].map(([dx, dy, r]) => `<circle cx="${X(s.x) + dx}" cy="${Y(s.y) + dy}" r="${r}" fill="#b5b0a3" stroke="#7f7a6c"/>`).join('');
    }
  }
  // 花壇のラベル
  const labels = site.beds.map((b) => `<g><circle cx="${X(b.x)}" cy="${Y(b.y)}" r="9" fill="#fffaf0" stroke="#5d6b3a" stroke-width="1.2"/><text x="${X(b.x)}" y="${Y(b.y) + 3.6}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#3f4a26">${b.id}</text></g>`).join('');
  // 案内ルート
  let tour = '';
  if (opts.tour && site.tour?.length) {
    const d = site.tour.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
    tour = `<path d="${d}" fill="none" stroke="#b5532f" stroke-width="1.8" stroke-dasharray="5 4" stroke-linejoin="round" opacity=".85"/>`
      + site.tour.map((p) => `<g><circle cx="${X(p.x) + 11}" cy="${Y(p.y) - 11}" r="7.5" fill="#b5532f"/><text x="${X(p.x) + 11}" y="${Y(p.y) - 8}" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">${p.no}</text></g>`).join('');
  }
  let photos = '';
  if (opts.photos && site.photos?.length) {
    photos = site.photos.map((p) => {
      const px = X(p.x), py = Y(p.y), a = p.dir, L = 26, sp = 0.42;
      const p1 = [px + Math.cos(a - sp) * L, py + Math.sin(a - sp) * L], p2 = [px + Math.cos(a + sp) * L, py + Math.sin(a + sp) * L];
      return `<g><path d="M${px} ${py} L${p1[0].toFixed(1)} ${p1[1].toFixed(1)} A${L} ${L} 0 0 1 ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} Z" fill="#e2a33a" fill-opacity=".28" stroke="#c4831f" stroke-width=".8"/><rect x="${px - 8}" y="${py - 6}" width="16" height="12" rx="2.5" fill="#2f3a24"/><circle cx="${px}" cy="${py}" r="3.4" fill="#e2a33a"/><text x="${px + 10}" y="${py + 14}" font-size="9.5" font-weight="700" fill="#8a5a12">${p.no}</text></g>`;
    }).join('');
  }
  // 方位記号（北の向き）
  const nAngle = { n: 0, e: -90, s: 180, w: 90 }[site.house];
  const compass = `<g transform="translate(${VW - pad - 4} ${top + 16}) rotate(${nAngle})"><circle r="13" fill="#fffaf0" stroke="#8c8471"/><path d="M0 -10 L4 4 L0 1 L-4 4Z" fill="#3f4a26"/><text y="-15" text-anchor="middle" font-size="9" fill="#3f4a26" transform="rotate(${-nAngle} 0 -18)">N</text></g>`;
  const sc = Math.max(1, [1, 2, 5, 10].find((v) => v * S >= 50) || 10);
  const scale = `<g transform="translate(${pad} ${VH - 10})"><path d="M0 0h${sc * S}M0 -4v4M${sc * S} -4v4" stroke="#5d6b3a" stroke-width="1.4"/><text x="${sc * S + 5}" y="3" font-size="9.5" fill="#5d6b3a">${sc}m</text></g>`;
  const poly = site.pts.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' ');
  return `<svg class="site-svg" viewBox="0 0 ${VW.toFixed(0)} ${VH.toFixed(0)}" role="img" aria-label="庭の平面図">
    <defs>
      <clipPath id="${uid}c"><polygon points="${poly}"/></clipPath>
      <pattern id="${uid}g" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#e8dcc0"/><circle cx="2" cy="2" r="1" fill="#c9b994"/><circle cx="6" cy="5.5" r=".8" fill="#bfae88"/></pattern>
      <pattern id="${uid}t" width="${Math.max(8, S * 0.5)}" height="${Math.max(8, S * 0.5)}" patternUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="#d6c29c"/><path d="M0 0H${Math.max(8, S * 0.5)}M0 0V${Math.max(8, S * 0.5)}" stroke="#b9a37a" stroke-width="1"/></pattern>
    </defs>
    <rect x="0" y="0" width="${VW}" height="${VH}" fill="#f4efe2"/>
    <rect x="${pad}" y="6" width="${site.W * S}" height="${top - 12}" rx="3" fill="#e2d7c0" stroke="#b5a785"/>
    <text x="${pad + 8}" y="${top - 12}" font-size="11" fill="#6b5d3e">家（${DIR_JA[site.house]}側）</text>
    <g clip-path="url(#${uid}c)">${rects}${plants}${under}</g>
    <polygon points="${poly}" fill="none" stroke="#5d6b3a" stroke-width="2"/>
    ${st}${labels}${tour}${photos}${compass}${scale}
  </svg>`;
}

/** 自由な形の入力用：方眼と点のSVG */
export function polyEditorSVG(points, size) {
  const S = 300 / size, pad = 14, V = 300 + pad * 2;
  const X = (v) => pad + v * S;
  let grid = '';
  for (let k = 0; k <= size; k++) grid += `<path d="M${X(k)} ${pad}V${pad + 300}M${pad} ${X(k)}H${pad + 300}" stroke="${k % 5 ? '#e3dccb' : '#c9bfa6'}" stroke-width="${k % 5 ? 0.6 : 1}"/>`;
  const poly = points.map(([x, y]) => `${X(x)},${X(y)}`).join(' ');
  return `<svg viewBox="0 0 ${V} ${V}" class="poly-svg" data-size="${size}" data-pad="${pad}" data-s="${S}">
    <rect width="${V}" height="${V}" fill="#fbf8f0"/>${grid}
    <rect x="${pad}" y="2" width="300" height="9" fill="#e2d7c0"/><text x="${pad + 150}" y="9.5" font-size="7.5" text-anchor="middle" fill="#6b5d3e">家の側（上）</text>
    ${points.length >= 3 ? `<polygon points="${poly}" fill="#cfdcae" fill-opacity=".7" stroke="#5d6b3a" stroke-width="1.6"/>` : points.length === 2 ? `<polyline points="${poly}" fill="none" stroke="#5d6b3a" stroke-width="1.6"/>` : ''}
    ${points.map(([x, y], i) => `<circle cx="${X(x)}" cy="${X(y)}" r="${i === 0 ? 5 : 4}" fill="${i === 0 ? '#b5532f' : '#3f4a26'}"/>`).join('')}
    <text x="${pad + 2}" y="${V - 3}" font-size="7.5" fill="#8c8471">1マス = 1m（太線 = 5m）</text>
  </svg>`;
}

export { esc as escSite };
