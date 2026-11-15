// ベランダ・鉢植えプラン：向き・階・手すり・上の階のバルコニー・前の建物から、場所ごとの日照時間を計算し、
// 鉢の配置と植物・鉢の大きさ・用土・重さ・費用をまとめる。
import { PLANTS, COLORS } from './plants.js';
import { evaluate, localMonth } from './garden.js';
import { parseKeywords, rng } from './plan.js';
import { STYLES } from './styles.js';
import { potGuide, potLiters } from './pots.js';
import { wildScore, creaturesForGarden, biodiversity } from './wildlife.js';

const RAD = Math.PI / 180;
export const FACING = { n: ['北', 0], ne: ['北東', 45], e: ['東', 90], se: ['南東', 135], s: ['南', 180], sw: ['南西', 225], w: ['西', 270], nw: ['北西', 315] };
export const OBSTACLE = { none: ['なし', 0], far: ['少し離れて建物や木がある', 15], near: ['近くに建物がある', 30] };

/** 太陽の高度と方位（度。方位は北=0°・時計回り）。t は太陽時（時） */
export function sunPos(lat, decl, t) {
  const H = 15 * (t - 12) * RAD, phi = lat * RAD, d = decl * RAD;
  const sinA = Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(H);
  const alt = Math.asin(sinA);
  let cosAz = (Math.sin(d) - sinA * Math.sin(phi)) / (Math.cos(alt) * Math.cos(phi) || 1e-9);
  cosAz = Math.max(-1, Math.min(1, cosAz));
  let az = Math.acos(cosAz) / RAD;
  if (H > 0) az = 360 - az;
  return { alt: alt / RAD, az };
}

/**
 * ある位置の直射日光の時間（時間）
 * x: 手すりからの距離(m) h: 床からの高さ(m)
 * b: { facing, railH(m), railType:'solid'|'open', roof, ceilH(m), obstacle }
 */
export function sunHours(b, lat, decl, x, h) {
  const face = FACING[b.facing]?.[1] ?? 180;
  const obst = OBSTACLE[b.obstacle]?.[1] ?? 0;
  let hours = 0;
  const step = 0.25;
  for (let t = 4; t <= 20; t += step) {
    const { alt, az } = sunPos(lat, decl, t);
    if (alt <= 2 || alt < obst) continue;
    const delta = ((az - face + 540) % 360) - 180; // 壁の正面からのずれ（度）
    if (Math.abs(delta) >= 88) continue; // 建物の裏側
    // 両端の仕切り板（隔て板）：横から差す光は、手すりに届く前に仕切り板にさえぎられる（ベランダ中央の位置で判定）
    if (x > 0 && x * Math.abs(Math.tan(delta * RAD)) > (b.width || 3.6) / 2) continue;
    const tb = Math.tan(alt * RAD) / Math.cos(delta * RAD); // 壁に直角な面に投影した太陽の高さ
    const atRail = h + x * tb; // 光が手すりの位置を通る高さ
    let w = 1;
    if (x > 0 && atRail < b.railH) w = b.railType === 'open' ? 0.6 : 0;
    if (b.roof && atRail > b.ceilH) w = 0;
    hours += w * step;
  }
  return Math.round(hours * 10) / 10;
}
const sunClass = (hrs) => (hrs >= 5 ? 'full' : hrs >= 2.5 ? 'part' : 'shade');
export const SUN_JA = { full: '日向', part: '半日陰', shade: '日陰' };

/** ベランダの場所ごとの日照（夏至・春秋分・冬至） */
export function sunMap(b, lat) {
  const south = lat < 0;
  const D = b.depth;
  const decls = { summer: south ? -23.44 : 23.44, equinox: 0, winter: south ? 23.44 : -23.44 };
  const spots = [
    { id: 'rail', ja: '手すりぎわ（床）', x: 0.25, h: 0.25 },
    { id: 'mid', ja: '中央（床）', x: D / 2, h: 0.25 },
    { id: 'wall', ja: '窓・壁ぎわ（床）', x: Math.max(0.3, D - 0.3), h: 0.25 },
  ];
  for (let k = 1; k <= (b.shelf || 0); k++) {
    const x = b.shelfAt === 'rail' ? 0.3 : Math.max(0.3, D - 0.25);
    spots.push({ id: `shelf${k}`, ja: `棚の${k}段目（${b.shelfAt === 'rail' ? '手すり側' : '壁側'}）`, x, h: 0.2 + k * 0.35, tier: k });
  }
  if (b.railType === 'solid') spots.push({ id: 'stand', ja: 'スタンド上（60cm・中ほど）', x: Math.max(0.3, D * 0.5), h: 0.65 });
  if (b.hang) spots.push({ id: 'hang', ja: '手すり掛け', x: 0.1, h: b.railH + 0.1, hang: true });
  return spots.map((s) => {
    const hrs = Object.fromEntries(Object.entries(decls).map(([k, d]) => [k, sunHours(b, lat, d, s.x, s.h)]));
    const grow = (hrs.summer + hrs.equinox) / 2; // 生育期の目安
    return { ...s, hrs, grow: Math.round(grow * 10) / 10, sun: sunClass(grow) };
  });
}

const potPrice = (go) => Math.round((go * go * 14 + 150) / 10) * 10; // プラスチック鉢の目安
const SOIL_YEN = 45; // 1Lあたり（培養土・配合土）

/**
 * ベランダプランを生成
 * o: { width, depth, facing, floor, railType, railH(cm), roof, ceilH(cm), obstacle, shelf, shelfAt, hang, text, style, wild, climate, lat, seed, annuals, budget, water }
 */
export function generateBalcony(o) {
  const b = {
    width: Math.min(20, Math.max(1, Number(o.width) || 3.6)), depth: Math.min(4, Math.max(0.6, Number(o.depth) || 1.2)),
    facing: FACING[o.facing] ? o.facing : 's', floor: Math.max(1, Math.min(60, Number(o.floor) || 2)),
    railType: o.railType === 'open' ? 'open' : 'solid', railH: Math.min(1.6, Math.max(0.6, (Number(o.railH) || 110) / 100)),
    roof: o.roof !== false, ceilH: Math.min(4, Math.max(2, (Number(o.ceilH) || 250) / 100)),
    obstacle: OBSTACLE[o.obstacle] ? o.obstacle : 'none', shelf: Math.max(0, Math.min(5, Number(o.shelf) || 0)), shelfAt: o.shelfAt === 'rail' ? 'rail' : 'wall', hang: !!o.hang,
  };
  const lat = o.lat ?? 35.7;
  const spots = sunMap(b, lat);
  const wind = b.floor >= 8 ? 3 : b.floor >= 4 ? 2 : 1;
  const face = FACING[b.facing][1];
  const westish = face >= 225 && face <= 315;
  const hot = (o.climate?.hotDays ?? 40) >= 30 && (face >= 135 && face <= 270) && b.railType === 'solid';
  const rand = rng((o.seed || 0) * 7919 + Math.round(b.width * 100) + b.shelf * 31 + face);
  const pref = parseKeywords(o.text || '');
  const style = STYLES[o.style] || STYLES.border;

  // ---------- 鉢を置く場所（スロット） ----------
  const slots = [];
  const spot = (id) => spots.find((s) => s.id === id);
  const shelfW = b.shelf ? Math.min(0.9, b.width * 0.3) : 0;
  const aisle = b.depth >= 1.1; // 床に2列置ける
  // 窓・壁ぎわ：大きめの鉢（シンボルになる木や大株）を両端に
  if (aisle || b.depth < 0.9) {
    const s = spot(b.depth < 0.9 ? 'rail' : 'wall');
    const n = b.width >= 3 ? 2 : 1;
    for (let i = 0; i < n; i++) slots.push({ zone: 'big', spot: s, maxGo: b.depth >= 1.2 ? 12 : 10, x: i === 0 ? (b.shelf && b.shelfAt === 'wall' ? b.width - 0.35 : 0.35) : b.width - 0.35 - (b.shelf && b.shelfAt === 'wall' ? shelfW + 0.1 : 0) });
  }
  // 手すりぎわの床：中くらいの鉢を並べる（避難はしご・仕切り板の前はあける）
  {
    const s = spot('rail');
    const usable = b.width - (b.shelf && b.shelfAt === 'rail' ? shelfW + 0.1 : 0) - 0.9; // 片側は避難のためにあける
    const n = Math.max(1, Math.min(8, Math.floor(usable / 0.42)));
    // 壁のような手すりで床が暗いときは、スタンドで鉢を持ち上げる
    const st = spot('stand');
    const useStand = st && st.grow >= s.grow + 1.5;
    for (let i = 0; i < n; i++) slots.push({ zone: 'rail', spot: useStand && i % 2 === 0 ? st : s, stand: useStand && i % 2 === 0, maxGo: aisle ? 8 : 7, x: 0.3 + i * (usable / n) + (b.shelf && b.shelfAt === 'rail' ? shelfW + 0.1 : 0) });
  }
  // 棚：小さな鉢（段ごとに2〜3鉢）
  for (let k = 1; k <= b.shelf; k++) {
    const s = spot(`shelf${k}`);
    const per = shelfW >= 0.8 ? 3 : 2;
    for (let i = 0; i < per; i++) slots.push({ zone: 'shelf', tier: k, spot: s, maxGo: 5, x: (b.shelfAt === 'wall' ? b.width - shelfW : 0.05) + (shelfW / per) * (i + 0.5) });
  }
  // 手すり掛けのプランター
  if (b.hang) {
    const s = spot('hang');
    const n = Math.max(1, Math.min(3, Math.floor(b.width / 1.4)));
    for (let i = 0; i < n; i++) slots.push({ zone: 'hang', spot: s, maxGo: 6, planter: true, x: 0.6 + i * ((b.width - 1.2) / Math.max(1, n - 1 || 1)) });
  }

  // ---------- 植物を選ぶ ----------
  const allowAnnual = o.annuals || pref.annual || style.cottage || pref.veg;
  const cands = PLANTS.filter((p) => {
    if (p.type === 'annual' && !allowAnnual && !p.tags.includes('balcony')) return false;
    if (p.tags.includes('veg') && p.type === 'annual' && !pref.veg && !p.tags.includes('balcony')) return false;
    if (o.climate && evaluate(p, o.climate).level < 2) return false;
    return true;
  });
  const guide = new Map(cands.map((p) => [p.id, potGuide(p)]));
  const used = new Map();
  const covered = new Set();
  const south = !!o.climate?.south;
  const want = [3, 4, 5, 6, 7, 8, 9, 10, 11].map((m) => localMonth(m, south));
  const fit = (p, slot) => {
    const g = guide.get(p.id);
    const sun = slot.spot.sun;
    if (!p.sun.includes(sun) && !(sun === 'full' && p.sun.includes('part') && slot.zone !== 'hang')) return false;
    if (slot.zone === 'hang' && !p.roles?.includes('hanging')) return false;
    if (slot.zone === 'shelf' && (p.h[1] > 45 || g.go > 6)) return false;
    if (slot.zone === 'rail' && (g.go > slot.maxGo + 1 || p.h[1] > (wind >= 3 ? 70 : 120))) return false;
    if (slot.zone === 'big' && (g.go < 6 || p.h[1] > (wind >= 3 ? 150 : 250))) return false;
    if (g.suit < 2) return false;
    return true;
  };
  const score = (p, slot) => {
    const g = guide.get(p.id);
    let s = (o.climate ? (evaluate(p, o.climate).level === 3 ? 2.5 : 1) : 1.5) + g.suit;
    if (p.tags.includes('balcony')) s += 2;
    const tagHits = p.tags.filter((t) => pref.tags.has(t)).length;
    s += Math.min(2, tagHits) * 2;
    if (pref.tags.size && !tagHits) s -= 1.2;
    if (pref.colors.size) s += p.color.some((c) => pref.colors.has(c)) ? 2.5 : p.color[0] === 'green' ? 0 : -2;
    if (pref.veg && p.harvest?.length) s += 3;
    if (style.bonus) s += style.bonus(p) * 0.7;
    s += wildScore(p, o.wild || [], o.climate) * 0.8;
    s += p.bloom.map((m) => localMonth(m, south)).filter((m) => want.includes(m) && !covered.has(m)).length * 0.9;
    if (slot.zone === 'big' && (p.type === 'shrub' || p.roles?.includes('accent') || p.tags.includes('evergreen'))) s += 2.5;
    if (slot.zone === 'hang') s += 1.5;
    if (p.tender) s -= 0.6; // 冬の取り込みが必要
    if (p.sun.includes(slot.spot.sun) && slot.spot.sun !== 'full') s += 1; // 日陰向きは日陰に
    const n = used.get(p.group) || 0;
    s -= n ? 3 + n * 2 : 0; // 同じ種類を重ねすぎない
    return s + rand() * 1.4;
  };
  for (const slot of slots) {
    let best = null, bv = -Infinity;
    for (const p of cands) {
      if (!fit(p, slot)) continue;
      const v = score(p, slot);
      if (v > bv) { bv = v; best = p; }
    }
    if (!best) continue;
    used.set(best.group, (used.get(best.group) || 0) + 1);
    best.bloom.forEach((m) => covered.add(localMonth(m, south)));
    const g = guide.get(best.id);
    const go = slot.planter ? null : Math.max(4, Math.min(slot.maxGo, g.go));
    const liters = slot.planter ? 12 : potLiters(go);
    const qty = slot.planter ? Math.max(2, Math.round(60 / Math.max(15, best.spread))) : g.count.startsWith('1株') ? 1 : best.h[1] <= 30 && best.spread <= 25 ? (go >= 6 ? 3 : 1) : 1;
    const col = best.color.find((c) => pref.colors.has(c)) || best.color[0];
    slot.plant = best; slot.go = go; slot.liters = liters; slot.qty = qty; slot.color = col; slot.guide = g;
    slot.cost = { plant: best.price * qty, pot: slot.planter ? 1800 : potPrice(go), soil: Math.round(liters * SOIL_YEN) };
  }
  const filled = slots.filter((s) => s.plant);
  filled.forEach((s, i) => { s.no = i + 1; });

  // ---------- 集計 ----------
  const plants = [...new Map(filled.map((s) => [s.plant.id, s.plant])).values()];
  const soilL = Math.round(filled.reduce((t, s) => t + s.liters, 0));
  const weight = Math.round(filled.reduce((t, s) => t + s.liters * 1.15 + (s.planter ? 1.5 : s.go * 0.15), 0));
  const area = b.width * b.depth;
  const cost = {
    plants: filled.reduce((t, s) => t + s.cost.plant, 0),
    pots: filled.reduce((t, s) => t + s.cost.pot, 0),
    soil: filled.reduce((t, s) => t + s.cost.soil, 0),
    extras: [{ ja: '鉢皿・すのこ・鉢底石', cost: filled.length * 250 }, ...(b.shelf ? [{ ja: `園芸用の棚（${b.shelf}段）`, cost: 2500 + b.shelf * 1200 }] : []), ...(b.hang ? [{ ja: '手すり用ハンガー', cost: 1200 * filled.filter((s) => s.zone === 'hang').length }] : [])],
  };
  cost.total = cost.plants + cost.pots + cost.soil + cost.extras.reduce((t, e) => t + e.cost, 0);
  cost.budget = Number(o.budget) || null;
  const counts = Array(12).fill(0);
  plants.forEach((p) => p.bloom.forEach((m) => counts[localMonth(m, south) - 1]++));
  const harvest = Array(12).fill(0);
  plants.forEach((p) => (p.harvest || []).forEach((m) => harvest[localMonth(m, south) - 1]++));
  const features = o.water ? { water: true } : {};
  const critters = creaturesForGarden(plants, features, o.climate).filter((x) => ['butterfly', 'moth', 'bee', 'beetle', 'bird', 'dragonfly'].includes(x.creature.kind) && !x.creature.needs);
  const bio = biodiversity(plants, features, o.climate);

  // ---------- 注意とアドバイス ----------
  const notes = [];
  const sunRail = spot('rail');
  notes.push(`手すりぎわの床は、春〜秋に1日約${sunRail.grow}時間の日当たり（${SUN_JA[sunRail.sun]}）。冬至は約${sunRail.hrs.winter}時間です。`);
  if (b.railType === 'solid' && sunRail.grow < spot('mid').grow) notes.push('壁のような手すりの影で、手すりのすぐ近くの床は日が当たりにくくなっています。棚やスタンドで鉢の高さを上げると、日照がのびます。');
  if (b.shelf) { const top = spot(`shelf${b.shelf}`); notes.push(`棚のいちばん上（約${Math.round(top.h * 100)}cm）は約${top.grow}時間。日が当たりやすい上段に花もの、下段に葉ものや日陰に強い植物を。`); }
  if (b.roof && (FACING[b.facing][1] >= 135 && FACING[b.facing][1] <= 225)) notes.push('上の階のバルコニーが夏の高い日差しをさえぎるので、夏は奥まで日が届きません。冬は低い日差しが部屋の近くまで差し込みます。');
  if (westish) notes.push('西日が当たるベランダです。真夏の午後は鉢の中が高温になるので、鉢を二重にする・すだれで日よけをするなどの対策を。');
  if (hot) notes.push('コンクリートの照り返しで夏はとても暑くなります。すのこやレンガで鉢を床から浮かせ、夏は朝夕の2回水やりを。');
  if (wind >= 2) notes.push(`${b.floor}階は風が強くなりやすい高さです。背の高い植物は低めのものを選び、鉢は重めのものに。強風の予報の日は鉢を床に下ろしてください。`);
  if (FACING[b.facing][1] <= 45 || FACING[b.facing][1] >= 315) notes.push('北向きのベランダでは、日陰に強い葉ものや、明るい日陰で咲く花が中心になります。');
  notes.push('避難はしごのハッチや隣との仕切り板（隔て板）の前、排水口のまわりには鉢を置かないでください。');
  if (b.hang) notes.push('手すりの外側に鉢をかけることは、多くのマンションの管理規約で禁止されています。かける場合は内側に、落下しないようしっかり固定を。');
  if (weight > area * 60) notes.push(`鉢と土の重さは水やり後で約${weight}kg。ベランダ1㎡あたりの目安を大きく超えないよう、重い鉢は手すりから離し、壁ぎわに分散して置いて。`);
  const watering = [
    { season: '春・秋', text: '土の表面が乾いたら、鉢底から流れるまでたっぷり（2〜3日に1回が目安）' },
    { season: '夏', text: hot || westish ? '朝と夕方の2回。日中の水やりは鉢の中が煮えるので避ける' : '毎朝1回。乾きが早い鉢は夕方にも' },
    { season: '冬', text: '乾いてから数日おいて、暖かい日の午前中に' },
  ];

  return {
    ...b, lat, area: Math.round(area * 10) / 10, spots, slots: filled, plants, soilL, weight, cost, counts, harvest, critters, bio, features, notes, watering, wind,
    peak: counts.indexOf(Math.max(...counts)) + 1, pref, style: o.style,
    tender: plants.filter((p) => p.tender),
  };
}

// ---------- 描画 ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** 断面図：手すり・上の階・太陽の光（夏至と冬至の正午）と、場所ごとの日当たり */
export function sectionSVG(bp) {
  const S = 110; // 1m = 110px
  const D = bp.depth, ox = 70, floorY = 250;
  const X = (x) => ox + (D - x) * S; // 左が窓（壁）、右が手すり
  const Y = (h) => floorY - h * S;
  const W = Math.max(X(-1.6), 420);
  const face = FACING[bp.facing][1];
  const noon = (decl) => {
    const { alt, az } = sunPos(bp.lat, decl, 12);
    const delta = ((az - face + 540) % 360) - 180;
    if (Math.abs(delta) >= 88) return null;
    return Math.atan(Math.tan(alt * RAD) / Math.cos(delta * RAD));
  };
  const south = bp.lat < 0;
  const rays = [['夏至', noon(south ? -23.44 : 23.44), '#e9852f'], ['冬至', noon(south ? 23.44 : -23.44), '#5b8ee6']].filter(([, a]) => a != null).map(([n, a, c]) => {
    const x0 = X(-0.5), y0 = Y(bp.railH) - Math.tan(a) * 0.5 * S;
    const len = 2.2 * S;
    const x1 = x0 - Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
    return `<path d="M${(x0 + Math.cos(a) * 60).toFixed(1)} ${(y0 - Math.sin(a) * 60).toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${c}" stroke-width="2" stroke-dasharray="6 4" opacity=".8"/><text x="${(x0 + Math.cos(a) * 64).toFixed(1)}" y="${(y0 - Math.sin(a) * 64 - 4).toFixed(1)}" font-size="11" fill="${c}" text-anchor="end">${n}の正午 ${Math.round(a / RAD)}°</text>`;
  }).join('');
  const shelf = bp.shelf ? (() => {
    const x0 = bp.shelfAt === 'rail' ? 0.05 : D - 0.4, x1 = x0 + 0.35;
    return Array.from({ length: bp.shelf }, (_, k) => `<rect x="${X(x1)}" y="${Y(0.2 + (k + 1) * 0.35)}" width="${0.35 * S}" height="4" fill="#a07a4f"/>`).join('') + `<path d="M${X(x1)} ${floorY} V${Y(0.25 + bp.shelf * 0.35)} M${X(x0)} ${floorY} V${Y(0.25 + bp.shelf * 0.35)}" stroke="#a07a4f" stroke-width="2"/>`;
  })() : '';
  const dots = bp.spots.filter((s) => !s.hang).map((s) => `<g><circle cx="${X(s.x)}" cy="${Y(s.h)}" r="9" fill="${s.sun === 'full' ? '#efc93a' : s.sun === 'part' ? '#c9c3a0' : '#8a8a8e'}" stroke="#2b2a22" stroke-width="1"/><text x="${X(s.x)}" y="${Y(s.h) + 3.5}" font-size="9" text-anchor="middle" font-weight="700" fill="#2b2a22">${Math.round(s.grow)}</text></g>`).join('');
  const rail = bp.railType === 'solid'
    ? `<rect x="${X(0) - 4}" y="${Y(bp.railH)}" width="10" height="${bp.railH * S}" fill="#b8b2a4" stroke="#8a8370"/>`
    : `<path d="M${X(0)} ${floorY} V${Y(bp.railH)} M${X(0) - 6} ${Y(bp.railH)} H${X(0) + 6}" stroke="#6e6a5a" stroke-width="3"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${X(0) + 1} ${Y(bp.railH * (i + 0.5) / 6)} h2" stroke="#6e6a5a"/>`).join('')}<rect x="${X(0) - 2}" y="${Y(bp.railH)}" width="4" height="${bp.railH * S}" fill="#cfe0ea" opacity=".5"/>`;
  return `<svg class="balcony-section" viewBox="0 0 ${W.toFixed(0)} 290" role="img" aria-label="ベランダの断面図と日当たり">
    <rect width="${W}" height="290" fill="#eef3f4"/>
    <rect x="0" y="${Y(bp.ceilH + 0.2)}" width="${ox}" height="${(bp.ceilH + 0.2) * S}" fill="#e2d7c0" stroke="#b5a785"/><text x="${ox / 2}" y="${Y(1.2)}" font-size="12" fill="#6b5d3e" text-anchor="middle">部屋</text>
    <rect x="${ox - 6}" y="${Y(2)}" width="6" height="${2 * S}" fill="#cfe0ea" stroke="#8aa0b0"/>
    <rect x="${ox}" y="${floorY}" width="${D * S + 20}" height="14" fill="#c9c3b0"/>
    ${bp.roof ? `<rect x="${ox}" y="${Y(bp.ceilH) - 14}" width="${D * S + 20}" height="14" fill="#c9c3b0"/><text x="${ox + 8}" y="${Y(bp.ceilH) - 3}" font-size="10" fill="#6b5d3e">上の階のバルコニー</text>` : ''}
    ${rail}${shelf}${rays}${dots}
    <text x="${X(0) + 8}" y="${Y(bp.railH) + 14}" font-size="10.5" fill="#6b5d3e">手すり ${Math.round(bp.railH * 100)}cm</text>
    <text x="${ox + 6}" y="${floorY + 30}" font-size="10.5" fill="#6b5d3e">奥行き ${bp.depth}m・${FACING[bp.facing][0]}向き・外 →</text>
    <g transform="translate(${W - 150} 16)"><circle r="6" cx="6" cy="0" fill="#efc93a" stroke="#2b2a22"/><text x="16" y="4" font-size="10" fill="#2b2a22">数字＝春〜秋の日照（時間）</text></g>
  </svg>`;
}

/** 正面図：部屋から見たベランダ。鉢と植物の配置 */
export function frontSVG(bp) {
  const S = Math.min(150, 560 / bp.width);
  const ox = 20, floorY = 230;
  const X = (x) => ox + x * S;
  const W = bp.width * S + 40;
  const railTop = floorY - bp.railH * S * 0.9;
  const pots = bp.slots.map((s) => {
    const d = s.planter ? 0.6 : s.go * 0.03; // 直径(m)
    const ph = s.planter ? 0.16 : d * 0.85;
    let baseY = floorY, cx = X(s.x);
    if (s.zone === 'shelf') baseY = floorY - (0.2 + s.tier * 0.35) * S * 0.9;
    if (s.zone === 'hang') baseY = railTop + ph * S;
    if (s.zone === 'big' || s.zone === 'rail') baseY = floorY - (s.stand ? 0.6 * S * 0.9 : 0);
    const pw = d * S;
    const col = COLORS[s.color]?.hex || '#7aa95c';
    const plantH = Math.min(1.6, s.plant.h[1] / 100) * S * 0.75;
    const leafW = Math.max(pw * 1.1, (Math.min(s.plant.spread, 90) / 100) * S * 0.8);
    const flowers = s.plant.bloom.length ? Array.from({ length: 5 }, (_, i) => `<circle cx="${(cx + (i - 2) * leafW * 0.18).toFixed(1)}" cy="${(baseY - ph * S - plantH * (0.6 + (i % 2) * 0.25)).toFixed(1)}" r="${Math.max(2.5, leafW * 0.08).toFixed(1)}" fill="${col}"/>`).join('') : '';
    const trail = s.plant.roles?.includes('hanging') ? `<path d="M${(cx - pw / 2).toFixed(1)} ${(baseY - ph * S).toFixed(1)} q-6 ${(ph * S + 20).toFixed(1)} 4 ${(ph * S + 34).toFixed(1)} M${(cx + pw / 2).toFixed(1)} ${(baseY - ph * S).toFixed(1)} q6 ${(ph * S + 18).toFixed(1)} -2 ${(ph * S + 30).toFixed(1)}" stroke="#6f8f4e" stroke-width="3" fill="none"/>` : '';
    const stand = s.stand ? `<path d="M${(cx - pw * 0.45).toFixed(1)} ${floorY} L${(cx - pw * 0.3).toFixed(1)} ${baseY.toFixed(1)} M${(cx + pw * 0.45).toFixed(1)} ${floorY} L${(cx + pw * 0.3).toFixed(1)} ${baseY.toFixed(1)} M${(cx - pw * 0.4).toFixed(1)} ${baseY.toFixed(1)} H${(cx + pw * 0.4).toFixed(1)}" stroke="#4a4a44" stroke-width="2"/>` : '';
    return `<g class="bp-pot" data-jump="pot-${s.no}">${stand}
      <ellipse cx="${cx.toFixed(1)}" cy="${(baseY - ph * S - plantH * 0.55).toFixed(1)}" rx="${(leafW / 2).toFixed(1)}" ry="${(plantH * 0.55).toFixed(1)}" fill="${s.plant.leaf === 'silver' ? '#a9b4a0' : s.plant.leaf === 'bronze' ? '#7a5a4a' : '#7aa95c'}" opacity=".9"/>
      ${trail}${flowers}
      <path d="M${(cx - pw / 2).toFixed(1)} ${(baseY - ph * S).toFixed(1)} h${pw.toFixed(1)} l-${(pw * 0.1).toFixed(1)} ${(ph * S).toFixed(1)} h-${(pw * 0.8).toFixed(1)}Z" fill="${s.planter ? '#8a6a44' : '#c07a4a'}" stroke="#6b4c2e"/>
      <circle cx="${cx.toFixed(1)}" cy="${(baseY - ph * S / 2).toFixed(1)}" r="7" fill="#fffaf0" stroke="#2b2a22" stroke-width=".8"/><text x="${cx.toFixed(1)}" y="${(baseY - ph * S / 2 + 3).toFixed(1)}" font-size="8.5" text-anchor="middle" font-weight="700">${s.no}</text>
    </g>`;
  }).join('');
  const shelf = bp.shelf ? (() => {
    const w = Math.min(0.9, bp.width * 0.3) * S, x0 = bp.shelfAt === 'wall' ? X(bp.width - Math.min(0.9, bp.width * 0.3)) : X(0.05);
    return `<path d="M${x0} ${floorY} V${floorY - (0.25 + bp.shelf * 0.35) * S * 0.9} M${x0 + w} ${floorY} V${floorY - (0.25 + bp.shelf * 0.35) * S * 0.9}" stroke="#a07a4f" stroke-width="3"/>` + Array.from({ length: bp.shelf }, (_, k) => `<rect x="${x0}" y="${floorY - (0.2 + (k + 1) * 0.35) * S * 0.9}" width="${w}" height="5" fill="#a07a4f"/>`).join('');
  })() : '';
  const rail = bp.railType === 'solid'
    ? `<rect x="${ox}" y="${railTop}" width="${bp.width * S}" height="${floorY - railTop}" fill="#d6d0c2" opacity=".55"/>`
    : `<path d="M${ox} ${railTop} H${ox + bp.width * S}" stroke="#6e6a5a" stroke-width="4"/>${Array.from({ length: Math.round(bp.width * 8) }, (_, i) => `<path d="M${ox + (i + 0.5) * (bp.width * S) / Math.round(bp.width * 8)} ${railTop} V${floorY}" stroke="#8a8370" stroke-width="1.2" opacity=".6"/>`).join('')}`;
  return `<svg class="balcony-front" viewBox="0 0 ${W.toFixed(0)} 250" role="img" aria-label="ベランダの正面図（部屋から見た鉢の配置）">
    <rect width="${W}" height="250" fill="#dfeaf0"/>
    <rect x="0" y="${floorY}" width="${W}" height="20" fill="#c9c3b0"/>
    ${rail}${shelf}${pots}
    <rect x="${X(bp.width) - 0.8 * S}" y="${floorY - 3}" width="${0.7 * S}" height="3" fill="#b5532f" opacity=".6"/><text x="${X(bp.width) - 0.45 * S}" y="${floorY + 14}" font-size="9.5" text-anchor="middle" fill="#8a4a2a">避難のためあける</text>
    <text x="${ox}" y="16" font-size="10.5" fill="#6b5d3e">部屋から見た配置（幅 ${bp.width}m）・番号は下のリストと対応</text>
  </svg>`;
}

/** 場所ごとの日照時間のグラフ */
export function sunChartSVG(bp) {
  const rows = bp.spots;
  const W = 400, rowH = 24, top = 26, L = 168;
  const max = 12;
  const bar = (v, y, c, dy) => `<rect x="${L}" y="${y + dy}" width="${((Math.min(v, max) / max) * (W - L - 34)).toFixed(1)}" height="6" rx="3" fill="${c}"/>`;
  return `<svg class="sun-chart" viewBox="0 0 ${W} ${top + rows.length * rowH + 10}" role="img" aria-label="場所ごとの日照時間">
    <g font-size="9.5" fill="#6b5d3e"><rect x="${L}" y="6" width="10" height="6" fill="#e9852f"/><text x="${L + 14}" y="12">夏至</text><rect x="${L + 50}" y="6" width="10" height="6" fill="#7aa95c"/><text x="${L + 64}" y="12">春分・秋分</text><rect x="${L + 130}" y="6" width="10" height="6" fill="#5b8ee6"/><text x="${L + 144}" y="12">冬至（時間）</text></g>
    ${rows.map((s, i) => { const y = top + i * rowH; return `<text x="0" y="${y + 13}" font-size="10" fill="#2b2a22">${esc(s.ja)}</text>${bar(s.hrs.summer, y, '#e9852f', 0)}${bar(s.hrs.equinox, y, '#7aa95c', 7)}${bar(s.hrs.winter, y, '#5b8ee6', 14)}<text x="${W - 30}" y="${y + 13}" font-size="10" fill="#2b2a22">${esc(SUN_JA[s.sun])}</text>`; }).join('')}
  </svg>`;
}
