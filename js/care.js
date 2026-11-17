// 室内栽培のロジック（画面に依存しない純粋な関数）
// - 置き場所の明るさの見積もり
// - 植物と置き場所の相性
// - 水やりの段階（生育期／冬）と「土を確かめる日」
// - 図鑑の検索
import { LIGHT, WATERING } from './schema.js';

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
export const CHECK_DAYS = { moist: 3, topdry: 5, halfdry: 7, dry: 14 };
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
