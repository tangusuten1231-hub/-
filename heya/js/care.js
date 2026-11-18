// 室内栽培のロジック（画面に依存しない純粋な関数）
// - 置き場所の明るさの見積もり
// - 植物と置き場所の相性
// - 水やりの段階（生育期／冬）と「土を確かめる日」
// - 図鑑の検索
import { LIGHT, WATERING, SYMPTOMS } from './schema.js';

export const WINDOWS = { S: '南', E: '東', W: '西', N: '北', none: '窓なし' };
export const DISTANCES = {
  window: '窓辺（50cm以内）',
  near: '窓から1mくらい',
  mid: '窓から1〜2m',
  far: '窓から2m以上',
};

/** lux から明るさの段階へ */
export function lightFromLux(lux) {
  if (!(lux >= 0)) return null;
  if (lux >= LIGHT.direct.lux[0]) return 'direct';
  if (lux >= LIGHT.bright.lux[0]) return 'bright';
  if (lux >= LIGHT.medium.lux[0]) return 'medium';
  return 'low';
}

/**
 * 置き場所の明るさ（段階）と直射日光の当たり方を見積もる。
 * 実測の照度（lux）があればそれを優先する。窓の向きと距離からの見積もりは目安。
 * @returns {{ level: string, sun: 'none'|'morning'|'afternoon'|'midday', measured: boolean }}
 */
export function spotLight(spot) {
  const w = spot.window ?? 'none';
  const d = spot.distance ?? 'mid';
  let sun = 'none';
  if (d === 'window' && !spot.sheer && w !== 'none' && w !== 'N') sun = w === 'E' ? 'morning' : w === 'W' ? 'afternoon' : 'midday';
  if (Number.isFinite(spot.lux) && spot.lux > 0) return { level: lightFromLux(spot.lux), sun, measured: true };
  let level;
  if (w === 'none' || d === 'far') level = 'low';
  else if (d === 'mid') level = 'medium';
  else if (w === 'N') level = 'medium';
  else if (d === 'near') level = 'bright';
  else level = spot.sheer ? 'bright' : 'direct';
  return { level, sun, measured: false };
}

/**
 * 植物（図鑑の1件）と置き場所の相性。
 * @returns {{ light: 'good'|'ok'|'dark'|'bright', temp: 'good'|'slow'|'cold'|'unknown', notes: string[], score: number }}
 */
export function fit(entry, spot) {
  const c = entry.care;
  const sl = spotLight(spot);
  const notes = [];
  const lv = LIGHT[sl.level].order, best = LIGHT[c.light.best].order, min = LIGHT[c.light.min].order;
  let light;
  if (lv < min) { light = 'dark'; notes.push(`暗すぎます（${LIGHT[c.light.min].ja}以上が必要）`); }
  else if (lv < best) { light = 'ok'; notes.push(`育ちますが、${LIGHT[c.light.best].ja}のほうがよく育ちます`); }
  else light = 'good';
  if (sl.sun !== 'none') {
    if (c.light.directSun === 'avoid') { light = 'bright'; notes.push('直射日光が当たり、葉焼けのおそれがあります。レースカーテン越しにしましょう'); }
    else if (c.light.directSun === 'morning' && sl.sun !== 'morning') { light = 'bright'; notes.push('昼〜午後の強い日差しは避けたい植物です。レースカーテン越しにしましょう'); }
  }
  let temp = 'unknown';
  if (Number.isFinite(spot.winterMinC)) {
    if (spot.winterMinC < c.temperature.minC) { temp = 'cold'; notes.push(`冬は寒すぎます（${c.temperature.minC}℃以上を保ちたい植物）`); }
    else if (spot.winterMinC < c.temperature.idealC[0]) { temp = 'slow'; notes.push('冬は成長がゆっくりになります。水やりを控えめに'); }
    else temp = 'good';
  }
  const score = { good: 3, ok: 2, bright: 1, dark: 0 }[light] * 2 + { good: 2, slow: 1, unknown: 1, cold: -3 }[temp];
  return { light, temp, notes, score, spotLight: sl };
}

/** 冬（水やりを控える時期）かどうか。暖かい部屋なら冬でも生育期とみなす */
export function isWinterFor(entry, spot, date = new Date()) {
  const m = date.getMonth() + 1;
  const coldMonths = m >= 11 || m <= 3;
  if (!coldMonths) return false;
  if (spot && Number.isFinite(spot.winterMinC) && spot.winterMinC >= entry.care.temperature.idealC[0]) return false;
  return true;
}

/** 水やりの段階ごとの「土を確かめる」までの日数（目安。実際は土を触って判断する） */
export const CHECK_DAYS = { moist: 3, topdry: 5, halfdry: 7, dry: 14, soak: 7 };
export const WINTER_FACTOR = 1.5;

const DAY = 86400000;
export const toDateStr = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

/**
 * 次に土を確かめる日。最後の水やり（なければ迎えた日）から数える。
 * @returns {{ style: string, winter: boolean, days: number, due: string|null, overdueDays: number }}
 */
export function nextCheck(entry, spot, events, today = new Date()) {
  const winter = isWinterFor(entry, spot, today);
  const style = winter ? entry.care.watering.winter : entry.care.watering.growing;
  const days = Math.round(CHECK_DAYS[style] * (winter ? WINTER_FACTOR : 1));
  const last = events.filter((e) => e.type === 'water' || e.type === 'check').map((e) => e.date).sort().pop();
  if (!last) return { style, winter, days, due: null, overdueDays: 0, how: WATERING[style].how };
  const due = new Date(parseDate(last).getTime() + days * DAY);
  const t0 = parseDate(toDateStr(today));
  return { style, winter, days, due: toDateStr(due), overdueDays: Math.round((t0 - due) / DAY), how: WATERING[style].how };
}

/** 検索用の正規化：全角半角・ひらがな/カタカナ・記号・大文字小文字の違いを無視 */
export function normalizeKana(s) {
  return String(s).normalize('NFKC').toLowerCase()
    .replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
    .replace(/[・･\s'‘’"“”（）()「」\-‐]/g, '');
}

export function searchText(entry) {
  return normalizeKana([
    entry.names.ja, ...entry.names.aliases, entry.scientificName, entry.cultivar ?? '', entry.parentName ?? '',
    entry.family ?? '', ...(entry.taxonomy?.synonyms ?? []), ...(entry.ncsu?.commonNames ?? []),
  ].join('|'));
}

/** 図鑑の検索。q は空白区切りで AND 検索 */
export function search(catalog, q, filters = {}) {
  const words = String(q ?? '').split(/\s+/).map(normalizeKana).filter(Boolean);
  return catalog.filter((e) => {
    if (filters.rank === 'base' && e.rank === 'cultivar') return false;
    if (filters.lowLight && e.care.light.min !== 'low') return false;
    if (filters.dryAir && e.care.humidity !== 'low') return false;
    if (filters.cold && e.care.temperature.minC > 5) return false;
    if (filters.noPetListing && (e.toxicity?.cats !== 'not-listed' || e.toxicity?.dogs !== 'not-listed')) return false;
    const text = searchText(e);
    return words.every((w) => text.includes(w));
  });
}

/** 置き場所に合う植物を相性の高い順に */
export function recommend(catalog, spot, limit = 8) {
  return catalog.filter((e) => e.rank !== 'cultivar')
    .map((e) => ({ e, f: fit(e, spot) }))
    .filter((x) => x.f.light === 'good' && x.f.temp !== 'cold')
    .sort((a, b) => b.f.score - a.f.score || a.e.names.ja.localeCompare(b.e.names.ja, 'ja'))
    .slice(0, limit);
}

// ---------------------------------------------------------------
// 植物選び：答えに合う植物を、理由つきで相性の高い順に返す
// answers: { spot: {window, distance, sheer, lux, winterMinC}, pets: {cats, dogs}, effort: 'often'|'normal'|'rare',
//            groups: string[] (空なら全部), beginner: boolean }
// ---------------------------------------------------------------
const MAINT = { Low: 0, Medium: 1, High: 2 };
export function choose(catalog, a, limit = 12) {
  const out = [];
  for (const e of catalog) {
    if (e.rank === 'cultivar') continue;
    if (a.groups?.length && !a.groups.includes(e.group)) continue;
    const f = fit(e, a.spot);
    if (f.light === 'dark' || f.light === 'bright' || f.temp === 'cold') continue;
    if (a.pets?.cats && e.toxicity?.cats === 'listed') continue;
    if (a.pets?.dogs && e.toxicity?.dogs === 'listed') continue;
    const reasons = [];
    let score = f.light === 'good' ? 4 : 2;
    reasons.push(f.light === 'good' ? `明るさがちょうどよい（${LIGHT[e.care.light.best].ja}）` : `明るさは足りる（最適は${LIGHT[e.care.light.best].ja}）`);
    if (f.temp === 'good') { score += 2; reasons.push('冬の室温でも育ち続ける'); }
    else if (f.temp === 'slow') { score += 1; reasons.push(`冬も${e.care.temperature.minC}℃以上なら大丈夫`); }
    const w = WATERING[e.care.watering.growing].order;
    if (a.effort === 'rare') { score += w >= 2 ? 3 : w === 1 ? 0 : -3; if (w >= 2) reasons.push('水やりの回数が少なくてすむ'); }
    if (a.effort === 'often' && w <= 1) { score += 1; reasons.push('こまめな水やりが合う'); }
    const m = MAINT[e.facts?.maintenance];
    if (a.beginner) { if (m === 0) { score += 2; reasons.push('手間が少ない（出典の手入れ：Low）'); } if (m === 2) score -= 3; }
    if (a.pets?.cats || a.pets?.dogs) reasons.push('出典にペットへの害の記載なし（安全とは限りません）');
    out.push({ e, f, score, reasons });
  }
  return out.sort((x, y) => y.score - x.score || x.e.names.ja.localeCompare(y.e.names.ja, 'ja')).slice(0, limit);
}

// ---------------------------------------------------------------
// 困ったとき：症状から、その植物の出典の記載と、記録・置き場所からわかることを返す
// ---------------------------------------------------------------
const DAY_MS = 86400000;
/** 最近の水やりの平均間隔（日）。記録が2回未満なら null */
export function wateringInterval(events, n = 6) {
  const ds = [...new Set(events.filter((e) => e.type === 'water').map((e) => e.date))].sort().slice(-n);
  if (ds.length < 2) return null;
  const t = ds.map((d) => parseDate(d).getTime());
  return Math.round((t.at(-1) - t[0]) / DAY_MS / (t.length - 1) * 10) / 10;
}

export function diagnose(entry, symptom, { spot = null, events = [], today = new Date() } = {}) {
  const tips = [...entry.tips, ...entry.parentTips].filter((t) => t.symptom === symptom);
  const checks = [];
  const add = (level, text) => checks.push({ level, text });
  const f = spot ? fit(entry, spot) : null;
  const nc = nextCheck(entry, spot, events, today);
  const iv = wateringInterval(events);
  const underWater = ['curl', 'brown', 'drop'];
  if (iv != null) {
    if (symptom !== 'pests' && iv < nc.days * 0.6) add('warn', `最近の水やりは平均${iv}日ごと。この植物の目安（${nc.days}日ごとに土を確かめる）より短く、水のやりすぎの可能性があります。土が乾いてから水をやりましょう。`);
    else if (underWater.includes(symptom) && iv > nc.days * 2) add('warn', `最近の水やりは平均${iv}日ごと。目安（${nc.days}日ごとに土を確かめる）より長く、水不足の可能性があります。`);
    else add('ok', `最近の水やりの間隔（平均${iv}日）は、目安（${nc.days}日ごとに土を確かめる）から大きく外れていません。`);
  } else if (['yellow', 'rot', 'curl', 'drop', 'brown'].includes(symptom)) {
    add('info', '水やりを2回以上記録すると、水やりの間隔が原因かどうかを判定できます。');
  }
  if (f) {
    if (f.light === 'dark' && ['leggy', 'fade', 'yellow', 'drop', 'noflower'].includes(symptom)) add('warn', `置き場所が暗すぎます（${LIGHT[entry.care.light.min].ja}以上が必要）。窓に近づけましょう。`);
    if (f.light === 'ok' && ['leggy', 'fade', 'noflower'].includes(symptom)) add('info', `いまの場所でも育ちますが、${LIGHT[entry.care.light.best].ja}のほうが症状が出にくくなります。`);
    if (f.light === 'bright' && ['scorch', 'fade', 'brown', 'yellow'].includes(symptom)) add('warn', '直射日光が当たる場所です。葉焼けの可能性があります。レースカーテン越しにしましょう。');
    if (f.temp === 'cold' && ['drop', 'yellow', 'curl', 'brown', 'rot'].includes(symptom)) add('warn', `冬の最低室温が、この植物の最低温度（${entry.care.temperature.minC}℃）を下回っています。寒さで傷んでいる可能性があります。`);
    if (f.temp === 'slow' && ['rot', 'yellow'].includes(symptom) && nc.winter) add('info', '冬で成長がゆっくりな時期です。水を吸う量が減るので、土が乾くまで待ちましょう。');
  } else {
    add('info', '置き場所を設定すると、明るさや寒さが原因かどうかも判定できます。');
  }
  if (['brown', 'curl'].includes(symptom) && entry.care.humidity === 'high') add('info', 'この植物は高い湿度（60%以上）を好みます。暖房や冷房で空気が乾く季節は、加湿器や水を張った受け皿（小石の上に鉢を置く）で湿度を上げましょう。');
  return { symptom: SYMPTOMS[symptom], tips, checks };
}

// ---------------------------------------------------------------
// 季節のお世話：出典の記載のうち、季節に関わるものを月ごとに拾う
// ---------------------------------------------------------------
const SEASON_RE = [
  ['spring', /\bspring\b|repot/i, [3, 4, 5, 6]],
  ['summer', /\bsummer\b/i, [6, 7, 8]],
  ['autumn', /\bfall\b|\bautumn\b/i, [9, 10, 11]],
  ['winter', /\bwinter\b/i, [11, 12, 1, 2]],
];
export function seasonOfTip(tip) { return SEASON_RE.filter(([, re]) => re.test(tip.quote)).map(([k]) => k); }
export function seasonalTips(entry, month) {
  const seasons = SEASON_RE.filter(([, , ms]) => ms.includes(month)).map(([k]) => k);
  return [...entry.tips, ...entry.parentTips].filter((t) => seasonOfTip(t).some((k) => seasons.includes(k)));
}
