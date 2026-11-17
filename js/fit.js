// 気候への適性（選定の土台）
// ・植物ごとの気候判定用の項目（耐寒ゾーン・ヒートゾーン・低温要求・高温多湿・塩風・必要な日照・pH）
// ・場所の気候から「育たない植物を候補から外す」ハードフィルター
// ・候補の中での「無理なく育つか」の度合い（気候への適合度）と、その地域らしさ
// 値は図鑑のデータから取る。根拠のない値は作らず、分からない項目は null（判定に使わない）にする。
import { humidityStress } from './climate.js';

/**
 * 図鑑データの訂正（出典を確認できたもの）。id か group で指定
 * zone: [耐寒ゾーンの下限, 上限]
 */
export const CLIMATE_FIX = {
  'verbena-tapien': { zone: [8, 11], src: 'サントリーフラワーズ「タピアン」育て方：冬越しは寒冷地を除く（寒冷地＝ゾーン7以下を対象外とした）' },
  ceanothus: { zone: [8, 10], src: 'Oregon State Univ. Landscape Plants（USDA Zone (7)8）、Horticopia（8A–11）、Everde ‘Skylark’（最低ゾーン8）' },
  camassia: { zone: [4, 9], src: 'World Plants（USDA 5a–9b）、White Flower Farm ‘Blue Danube’（5–9）、Gardenia（3–8）' },
  matteuccia: { zone: [3, 9], src: '熊本県農業研究センターの報告：日本では北海道から九州まで広く分布' },
};

/**
 * 春化・低温要求（冬に一定期間の低温に当たらないと、花芽ができない・球根が太らない）
 * high：冬の低温が欠かせない（暖地では咲かない・年々消える）、low：あれば望ましいが暖地でも咲く
 * 一般的な栽培書・球根の流通の栽培情報で広く知られているものに限る。ないものは null（データなし）
 */
export const CHILL = {
  high: ['tulipa', 'hyacinthus', 'crocus', 'galanthus', 'chionodoxa', 'fritillaria', 'camassia', 'digitalis', 'paeonia', 'lupinus', 'convallaria', 'syringa'],
  low: ['narcissus', 'muscari', 'allium'],
};
const CHILL_OF = new Map([...CHILL.high.map((g) => [g, 'high']), ...CHILL.low.map((g) => [g, 'low'])]);

const SUN_HOURS = { full: 6, part: 3, shade: 0 }; // 日当たりチェッカーと同じ区分（日向 6時間以上・半日陰 3〜6時間・日陰 3時間未満）
const HUMID = { 1: 'weak', 2: 'normal', 3: 'strong' };

/** 植物の気候判定用の項目（図鑑の値をそのまま写す。データのない項目は null） */
export function climateTraits(p, phOf = null) {
  const z = Array.isArray(p.zone) && p.zone.length === 2 ? p.zone : null;
  const ph = phOf ? phOf(p) : null;
  return {
    hardinessZoneMin: z ? z[0] : null,
    hardinessZoneMax: z ? z[1] : null,
    heatZoneMax: Number.isFinite(p.heat) ? p.heat : null,
    chillRequirement: CHILL_OF.get(p.group) ?? CHILL_OF.get(p.id) ?? null,
    heatHumidityTolerance: HUMID[p.humid] ?? null,
    saltTolerance: p.tags?.includes('salt') ? 'strong' : null,
    sunHoursMin: Array.isArray(p.sun) && p.sun.length ? Math.min(...p.sun.map((s) => SUN_HOURS[s])) : null,
    phRange: ph?.known ? ph.range : null,
  };
}
/** 気候判定に必要な項目（耐寒ゾーン・ヒートゾーン・高温多湿）がそろっているか */
export const hasClimateData = (p) => {
  const t = p.fit || climateTraits(p);
  return t.hardinessZoneMin != null && t.hardinessZoneMax != null && t.heatZoneMax != null && t.heatHumidityTolerance != null;
};

/** 場所の気候から、判定に使う値（すべて取得した気象データから） */
export function siteOf(climate) {
  if (!climate?.zone) return null;
  const means = (climate.monthly || []).map((m) => (m.tmax != null && m.tmin != null ? (m.tmax + m.tmin) / 2 : null)).filter((v) => v != null);
  return {
    zone: climate.zone.value, // 7a → 7、7b → 7.5
    zoneInt: climate.zone.zone,
    label: climate.zone.label,
    heat: climate.heatZone,
    stress: humidityStress(climate),
    coldMonth: means.length === 12 ? Math.round(Math.min(...means) * 10) / 10 : null, // いちばん寒い月の平均気温
    coastal: climate.coastKm != null && climate.coastKm <= 3,
  };
}

// 低温要求が高い植物を外す目安：いちばん寒い月の平均気温が 10℃ を超える（冬に低温に当たる期間がほとんどない）
export const CHILL_LIMIT = 10;

/**
 * ハードフィルター：この場所で育たない理由（なければ空）。
 * ・冬の寒さ：場所のゾーンが耐寒ゾーンの下限より寒い（積雪による保温は見込まない）
 * ・冬の暖かさ：場所のゾーンが上限を1ゾーンより大きく超える（米国の資料の上限は夏の暑さも含めて決められていることが多いため、
 *   暑さはヒートゾーンで別に判定し、冬の暖かさは1ゾーン分まで許して、低温要求のある植物は冬の気温で判定する）
 * ・夏の暑さ：場所のヒートゾーンが植物の上限を超える
 * ・低温要求（high）：いちばん寒い月の平均気温が 10℃ を超える
 * ・高温多湿に弱い：熱帯夜が年10日以上（蒸れストレス2以上）
 * 上限が11の植物には冬の暖かさの上限を設けない（USDA のゾーン12・13は2012年にハワイ・プエルトリコ向けに加わったもので、多くの資料は11までしか記さないため）。
 * 一年草は毎年種から育てるので、冬の寒さ・暖かさ・低温要求は判定しない。
 */
export function hardFails(p, climate, site = siteOf(climate)) {
  if (!site) return [];
  const t = p.fit || climateTraits(p);
  const out = [];
  const annual = p.type === 'annual';
  if (!annual && t.hardinessZoneMin != null && site.zone < t.hardinessZoneMin) {
    out.push({ key: 'cold', text: `冬の寒さ（ゾーン${site.label}）が耐寒ゾーン${t.hardinessZoneMin}より厳しく、冬越しが難しい` });
  }
  if (!annual && t.hardinessZoneMax != null && t.hardinessZoneMax < 11 && site.zoneInt > t.hardinessZoneMax + 1) {
    out.push({ key: 'warm', text: `冬が暖かすぎる（ゾーン${site.label}。耐寒ゾーン${t.hardinessZoneMin}〜${t.hardinessZoneMax}の植物）` });
  }
  if (t.heatZoneMax != null && site.heat > t.heatZoneMax) {
    out.push({ key: 'heat', text: `夏の暑さ（ヒートゾーン${site.heat}）が、この植物の上限${t.heatZoneMax}を超える` });
  }
  if (!annual && t.chillRequirement === 'high' && site.coldMonth != null && site.coldMonth > CHILL_LIMIT) {
    out.push({ key: 'chill', text: `冬の低温が足りず花が咲きにくい（いちばん寒い月の平均${site.coldMonth}℃。冬に低温に当たる必要がある植物）` });
  }
  if (t.heatHumidityTolerance === 'weak' && site.stress >= 2) {
    out.push({ key: 'humid', text: `高温多湿に弱く、熱帯夜の多い夏に蒸れて傷みやすい（熱帯夜 年${Math.round(climateTropical(climate))}日）` });
  }
  return out;
}
const climateTropical = (c) => c?.tropicalNights ?? 0;

/** 候補に残るか（気候データがなければ判定しない＝残す） */
export const passes = (p, climate, site) => !hardFails(p, climate, site).length;

/**
 * 気候への適合度 0〜1：耐寒ゾーンの範囲の端に近いほど低く、真ん中に近いほど高い。ヒートゾーンの余裕・蒸れも加味。
 * ハードフィルターを通った植物に使う。
 */
export function climateFit(p, climate, site = siteOf(climate)) {
  if (!site) return 0.5;
  const t = p.fit || climateTraits(p);
  let zoneFit = 0.7;
  if (p.type !== 'annual' && t.hardinessZoneMin != null) {
    const lo = t.hardinessZoneMin, hi = (t.hardinessZoneMax >= 11 ? 13 : t.hardinessZoneMax) + 1; // ゾーン上限の「b」まで（11は上限なしとみなす）
    const half = Math.max(0.75, (hi - lo) / 2);
    const mid = (lo + hi) / 2;
    zoneFit = Math.max(0, 1 - Math.abs(site.zone + 0.25 - mid) / (half + 0.5));
  }
  const heatGap = t.heatZoneMax != null ? t.heatZoneMax - site.heat : 2;
  const heatFit = heatGap >= 3 ? 1 : heatGap === 2 ? 0.85 : heatGap === 1 ? 0.6 : 0.35;
  const humidFit = site.stress >= 2 ? (t.heatHumidityTolerance === 'strong' ? 1 : 0.6) : 1;
  return Math.round((zoneFit * 0.5 + heatFit * 0.3 + humidFit * 0.2) * 100) / 100;
}

// 「その地域らしさ」を測る基準の気候：関東の平野部に近い温暖地（ゾーン9b・ヒートゾーン6・熱帯夜が多い）
const BASE_SITE = { zone: 9.5, zoneInt: 9, label: '9b', heat: 6, stress: 3, coldMonth: 6, coastal: false };
/**
 * その地域でこそ育つ植物か：基準の温暖地では気候が原因で外れるのに、この場所では育つ。
 * 戻り値：'winter'（冬の寒さが必要・寒冷地向き）/ 'summer'（夏の暑さ・蒸れに弱い＝夏が涼しい地域向き）/ 'warm'（寒さに弱い＝暖地向き）/ null
 */
export function regionalKind(p, climate, site = siteOf(climate)) {
  if (!site || p.type === 'annual') return null;
  const base = hardFails(p, { tropicalNights: 30 }, BASE_SITE);
  if (!base.length) return null;
  const keys = base.map((f) => f.key);
  if (keys.includes('cold')) return site.zone > BASE_SITE.zone ? 'warm' : null;
  if (keys.includes('warm') || keys.includes('chill')) return 'winter';
  return 'summer';
}
export const REGIONAL_JA = { winter: '冬の寒さがある地域向き', summer: '夏が涼しい地域向き', warm: '暖かい地域向き' };

/** 選定理由に使う、気候の短い説明（実データのみ） */
export function climateReason(p, climate, site = siteOf(climate)) {
  if (!site) return null;
  const t = p.fit || climateTraits(p);
  if (p.type === 'annual') return `ヒートゾーン${site.heat}で育つ一年草`;
  return `ゾーン${site.label}に適合（耐寒${t.hardinessZoneMin}〜${t.hardinessZoneMax}）`;
}
