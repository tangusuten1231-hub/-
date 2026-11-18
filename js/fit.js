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
  // NC State の値と、ほかの複数の資料が2ゾーン以上食い違うもの（ほかの資料の値を採用）
  gaillardia: { zone: [3, 10], src: 'University of Wisconsin–Madison Extension（ゾーン3〜10。品種により異なる）。NC State は ×グランディフロラを7〜10とするが、ほかの資料と食い違うため採用せず' },
  nepeta: { zone: [3, 8], src: 'Missouri Botanical Garden（Rob\'s Plants 経由）・複数の園芸資料でゾーン3〜8。NC State は5〜9とするが、ほかの資料と食い違うため採用せず' },
};
/** NC State のページのうち、品種のページで種全体には当てはまらないもの（採用しない） */
export const NCSU_SKIP = new Set(['gazania linearis']);

/**
 * 春化・低温要求（冬に一定期間の低温に当たらないと、花芽ができない・球根が太らない）
 * high：冬の低温が欠かせない（暖地では咲かない・年々消える）、low：あれば望ましいが暖地でも咲く
 * 一般的な栽培書・球根の流通の栽培情報で広く知られているものに限る。ないものは null（データなし）
 */
export const CHILL = {
  // 冬の低温に当たらないと咲かない（出典で確かめたもの）。暖地では球根の冷蔵処理など工夫が必要
  high: ['hyacinthus', 'crocus', 'galanthus', 'chionodoxa', 'fritillaria', 'camassia', 'paeonia', 'convallaria', 'syringa',
    'digitalis', 'digitalis-pam-s-choice'], // ジギタリスは二年草タイプのプルプレアだけ（‘ダルメシアン’など1年目に咲く品種は低温不要）
  // 低温に当たると花つきがよくなるが、なくても咲く（暖地向きの品種がある）
  low: ['narcissus', 'muscari', 'lupinus', 'tulipa', 'paeonia-bartzella'], // 図鑑のチューリップは原種系（暖地向きとされる）、シャクヤクのイトー系は低温要求が少ない
};
// 品種ごとの例外（出典で確かめられないものは null＝データなし）
const CHILL_NONE = new Set(['paeonia-japonica']);
/** 出典（低温要求） */
export const CHILL_SRC = {
  tulipa: '原種系チューリップは暖地でも育てやすい（Longfield Gardens）。一般の園芸品種は UC Master Gardener（ゾーン9では冬の低温が足りない）',
  'paeonia-bartzella': 'NC State Extension ほか（イトー系〈インターセクショナル〉は低温の要求が少なく暖地向き）',
  hyacinthus: 'UC Master Gardener（ゾーン9では冬の低温が足りない）',
  crocus: '球根の低温処理の目安 12〜15週（Longfield Gardens ほか）',
  galanthus: '球根の低温処理の目安 約15週（Epic Gardening ほか）',
  chionodoxa: '球根の低温処理の目安 約15週（Longfield Gardens ほか）',
  fritillaria: '球根の低温処理の目安 12〜15週（Fine Gardening ほか）',
  camassia: 'Colorblends（ゾーン7b以上の暖地では冷蔵処理が必要）',
  paeonia: 'NC State Extension（低温の要求を満たしにくい暖地では育ちが悪い）、Monrovia（ゾーン9〜11では咲かない）',
  convallaria: 'garden.org（フロリダ北部でも暖かすぎ、それより南では栽培に向かない）',
  syringa: 'Proven Winners ほか（ライラックは冬の低温で花芽をつける。ゾーン7〜8より暖かい地域では咲きにくい）',
  digitalis: 'ミシガン州立大学の研究（二年草タイプのジギタリスは開花に低温が必要。1年目に咲く品種を除く）',
  'digitalis-pam-s-choice': 'ミシガン州立大学の研究（二年草タイプのジギタリスは開花に低温が必要）',
  narcissus: 'Longfield Gardens（暖地向きの品種あり）',
  muscari: 'Longfield Gardens（ゾーン8〜9で冷蔵処理なしで咲く）',
  lupinus: 'ミシガン州立大学・Walters Gardens（低温で花数が増えるが、必須ではない）',
};
const CHILL_OF = new Map([...CHILL.high.map((g) => [g, 'high']), ...CHILL.low.map((g) => [g, 'low'])]);

/** 耐寒ゾーンの表記：7 → '7a'、7.5 → '7b' */
export const zoneJa = (v) => (v == null ? '' : `${Math.floor(v)}${v % 1 ? 'b' : 'a'}`);
/** 耐寒ゾーンの範囲の表記（上限はそのゾーンの b まで）：[7, 10] → '7a〜10b'、[7.5, 9.5] → '7b〜9b' */
export const zoneRangeJa = (z) => (z ? `${zoneJa(z[0])}〜${Math.floor(z[1])}b` : '');

/**
 * 出典で確かめた暑さ・湿気への強さ（NC State Plant Toolbox の値から）。
 * ・ノースカロライナ州の推奨地域：沿岸平野（夏が最も暑く蒸す）・丘陵・山地（夏が涼しい）
 *   沿岸平野でも育つ → 暑さに強い証拠（ヒートゾーン HEAT_OF_REGION.C 以上）。
 *   推奨が丘陵・山地だけ → 注意の表示だけ（自生地を反映していることもあり、暑さに弱い証拠とまでは言えない）
 * ・暑さに弱い（外す理由になる）：本文に「暑さ・蒸し暑さに弱い」とはっきり書かれているもの（weak → 平地のゾーンより1つ下まで、deepsouth → 平地のゾーンまで）
 * ・Resistance to Challenges の Heat / Humidity / Salt / Drought
 * ・本文で「暑さ・湿気に弱い」と書かれているもの（本文を読んで確かめた結果）
 */
// 各地域のヒートゾーン：このアプリと同じ方法（Open-Meteo の過去10年〈2016〜2025年〉の日別データの、30℃以上の日数）で計算した実測値
// 沿岸平野：ウィルミントン6・グリーンビル7・フェイエットビル7、丘陵：ローリー7・シャーロット7、山地：アシュビル4・ブーン1
export const HEAT_OF_REGION = { C: 7, P: 7, M: 4 };
// 南西諸島（那覇）のヒートゾーン：同じ方法での実測値。熱帯夜は年122日
export const HEAT_RYUKYU = 7;
export function ncsuTraits(n) {
  if (!n) return null;
  const [zmin, zmax, reg, flags, heatWeak, humidWeak, slug, ph = ''] = n;
  // 暑さに弱いと判断するのは、本文にはっきり書かれているものだけ（推奨地域は自生地を反映していることもあるため、注意の表示にだけ使う）
  let heatMax = null;
  const regionCool = zmin <= 8 && reg && !reg.includes('C'); // 沿岸平野でも冬越しできる耐寒性なのに、推奨地域が丘陵・山地だけ
  // 本文に「米国南東部の暑さ・蒸し暑さに弱い」→ ノースカロライナ州の平地（ヒートゾーン7）では弱る → 上限は6
  if (heatWeak === 'weak') heatMax = Math.min(heatMax ?? HEAT_OF_REGION.P - 1, HEAT_OF_REGION.P - 1);
  // 本文に「米国深南部の夏には弱い」→ ノースカロライナ州の平地（7）までは育つ
  if (heatWeak === 'deepsouth') heatMax = Math.min(heatMax ?? HEAT_OF_REGION.C, HEAT_OF_REGION.C);
  const heatMin = reg.includes('C') || flags.includes('H') ? HEAT_OF_REGION.C : null;
  return {
    src: 'ncsu', url: `https://plants.ces.ncsu.edu/plants/${slug}/`, zone: [zmin, zmax], region: reg,
    heatMax, heatMin, regionCool, humid: humidWeak === 'weak' ? 'weak' : flags.includes('U') ? 'strong' : null,
    salt: flags.includes('S'), drought: flags.includes('D'), heatTolerant: flags.includes('H'), ph: [...new Set(ph)].join(''),
  };
}

/**
 * 日本での野外の採集記録（GBIF・植物標本館の標本）：[全国, 北海道（北緯42度以北）, 九州・四国など（北緯30〜34度）, 南西諸島（北緯30度未満）]
 * ・南西諸島で5件以上 → 冬に低温がなく、夏が長く蒸し暑い気候で野外に生える証拠（暑さ・湿気に強い、冬の暖かさの注意は不要）
 * ・北海道で3件以上 → 北海道の冬に野外で耐える証拠（表示のみ。積雪に守られることもあるため耐寒ゾーンは変えない）
 * ・九州・四国などの記録は山地の標本も含むので、判定には使わず表示だけ
 */
export function gbifTraits(r) {
  if (!r) return null;
  const [all, hokkaido, south, ryukyu] = r;
  return { all, hokkaido: hokkaido >= 3, south: south >= 3, ryukyu: ryukyu >= 5 };
}

const SUN_HOURS = { full: 6, part: 3, shade: 0 }; // 日当たりチェッカーと同じ区分（日向 6時間以上・半日陰 3〜6時間・日陰 3時間未満）
const HUMID = { 1: 'weak', 2: 'normal', 3: 'strong' };

/** 植物の気候判定用の項目（図鑑の値をそのまま写す。データのない項目は null） */
export function climateTraits(p, phOf = null) {
  const z = Array.isArray(p.zone) && p.zone.length === 2 ? p.zone : null;
  const ph = phOf ? phOf(p) : null;
  const v = p.verified || null; // 出典で確かめた値（verified.js）
  return {
    hardinessZoneMin: z ? z[0] : null,
    hardinessZoneMax: z ? z[1] : null,
    zoneVerified: !!(v?.zone || p.climateSrc),
    wildHokkaido: !!p.jp?.hokkaido,
    // 暑さ：出典で上限が分かるときはその値、ないときは図鑑の目安（推定・外す理由には使わない）
    heatZoneMax: v?.heatMax ?? (Number.isFinite(p.heat) ? Math.max(p.heat, v?.heatMin ?? 0, p.jp?.ryukyu ? HEAT_RYUKYU : 0) : null),
    heatVerified: v?.heatMax != null,
    heatMinVerified: v?.heatMin ?? (p.jp?.ryukyu ? HEAT_RYUKYU : null),
    warmOk: !!p.jp?.ryukyu, // 南西諸島で野外に生える → 冬が暖かい地域の注意は不要
    chillRequirement: CHILL_NONE.has(p.id) ? null : CHILL_OF.get(p.id) ?? (p.group === 'digitalis' ? null : CHILL_OF.get(p.group)) ?? null,
    heatHumidityTolerance: v?.humid ?? (p.jp?.ryukyu ? 'strong' : HUMID[p.humid]) ?? null,
    humidVerified: v?.humid != null || !!p.jp?.ryukyu,
    saltTolerance: p.tags?.includes('salt') || v?.salt ? 'strong' : null,
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
 * ・夏の暑さ：場所のヒートゾーンが植物の上限を超える（暑さへの強さを出典で確かめた植物だけ）
 * ・低温要求（high）：いちばん寒い月の平均気温が 10℃ を超える
 * ・高温多湿に弱い：熱帯夜が年10日以上（蒸れストレス2以上。蒸れへの弱さを出典で確かめた植物だけ）
 * 冬が暖かいこと自体では外さない。冬の暖かさで育たないのは、冬に低温に当たる必要がある植物（低温要求）に限られるため。
 * 一年草は毎年種から育てるので、冬の寒さ・低温要求は判定しない。
 */
export function hardFails(p, climate, site = siteOf(climate)) {
  if (!site) return [];
  const t = p.fit || climateTraits(p);
  const out = [];
  const annual = p.type === 'annual';
  // 北海道で野外に生える記録がある植物は、北海道の平地程度（ゾーン6以上）の寒さでは外さない
  if (!annual && t.hardinessZoneMin != null && site.zone < t.hardinessZoneMin && !(t.wildHokkaido && site.zone >= 6)) {
    out.push({ key: 'cold', text: `冬の寒さ（ゾーン${site.label}）が耐寒ゾーン${t.hardinessZoneMin}より厳しく、冬越しが難しい` });
  }
  // 冬の暖かさそのものでは外さない（米国の資料の「耐寒ゾーンの上限」は、その地域の夏の暑さで決まっていることが多いため）。
  // 冬の暖かさで外すのは、冬の低温が必要なことが確かめられた植物（下の低温要求）だけ。
  // 夏の暑さで外すのは、暑さへの強さを出典で確かめた植物だけ（heatSrc）。推定値は注意の表示にだけ使う
  if (t.heatZoneMax != null && t.heatVerified && site.heat > t.heatZoneMax) {
    out.push({ key: 'heat', text: `夏の暑さ（30℃以上の日が年${Math.round(climate?.hotDays ?? 0)}日・ヒートゾーン${site.heat}）が、この植物の目安（ヒートゾーン${t.heatZoneMax}まで）を超える` });
  }
  if (!annual && t.chillRequirement === 'high' && site.coldMonth != null && site.coldMonth > CHILL_LIMIT) {
    out.push({ key: 'chill', text: `冬の低温が足りず花が咲きにくい（いちばん寒い月の平均${site.coldMonth}℃。冬に低温に当たる必要がある植物）` });
  }
  if (t.heatHumidityTolerance === 'weak' && t.humidVerified && site.stress >= 2) {
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
  // 冬の寒さへの余裕：耐寒ゾーンの下限より何ゾーン暖かいか（上限側は使わない）
  let zoneFit = 0.7;
  if (p.type !== 'annual' && t.hardinessZoneMin != null) {
    const margin = site.zone - t.hardinessZoneMin;
    zoneFit = margin >= 2 ? 1 : margin >= 1 ? 0.85 : margin >= 0.5 ? 0.65 : 0.4;
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
  if (keys.includes('chill')) return 'winter';
  return 'summer';
}
export const REGIONAL_JA = { winter: '冬の寒さがある地域向き', summer: '夏が涼しい地域向き', warm: '暖かい地域向き' };

/** 選定理由に使う、気候の短い説明（実データのみ） */
export function climateReason(p, climate, site = siteOf(climate)) {
  if (!site) return null;
  const t = p.fit || climateTraits(p);
  if (p.type === 'annual') return `ヒートゾーン${site.heat}で育つ一年草`;
  return `ゾーン${site.label}で冬越しできる（耐寒${zoneJa(t.hardinessZoneMin)}まで）`;
}
