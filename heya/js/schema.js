// 植物データの決まり（スキーマ）。
// data/taxa/<id>.json はすべてここで検証する。アプリ・ツール・テストが同じ定義を使う。
//
// ■ 方針
// - 手で書くのは「日本語名」と「室内での育て方」だけ。
//   科・受理学名・旧学名は GBIF、毒性・原産地・殖やし方などは NC State から自動で取り込む（tools/build-catalog.mjs）。
// - 育て方の値には必ず根拠（evidence）を付ける。
//   { src: 'ncsu', quote: '出典の原文そのまま' } … テストで出典スナップショットに原文があるか照合する
//   { src: 'estimate', reason: 'なぜこの値にしたか' } … アプリでは「目安」と表示する
// - 品種（cultivar）は親の種の値を引き継ぎ、書いた項目だけを上書きする。

/**
 * 室内の明るさの段階。lux はアプリでの定義（晴れた日の昼の目安）。
 * 出典の光の表現（"bright indirect light" など）をこの段階に当てはめる。
 */
export const LIGHT = {
  low:    { order: 0, ja: '暗め',         lux: [300, 1000],    where: '窓から2m以上離れた場所・北向きの部屋の奥' },
  medium: { order: 1, ja: 'やや明るい',   lux: [1000, 5000],   where: '窓から1〜2m・北向きの窓辺' },
  bright: { order: 2, ja: '明るい日陰',   lux: [5000, 20000],  where: '東・南・西向きの窓辺（レースカーテン越し）' },
  direct: { order: 3, ja: '直射日光',     lux: [20000, 100000], where: '南・西向きの窓辺でガラス越しに日が当たる' },
};

/** 直射日光への強さ */
export const DIRECT_SUN = {
  avoid:   { ja: '直射日光は避ける（葉焼けしやすい）' },
  morning: { ja: '朝の弱い日差しなら当ててよい' },
  ok:      { ja: '直射日光に当ててよい' },
};

/** 水やりの段階（乾かし具合）。order が大きいほど乾かす */
export const WATERING = {
  moist:   { order: 0, ja: '乾かしすぎない', how: '土の表面が乾きかけたら水をやる。鉢の中が乾き切らないようにする' },
  topdry:  { order: 1, ja: '表面が乾いたら', how: '土の表面から2〜3cmが乾いたら、鉢底から流れ出るまでたっぷり水をやる' },
  halfdry: { order: 2, ja: '半分乾いたら',   how: '鉢の土が半分くらいの深さまで乾いてから水をやる' },
  dry:     { order: 3, ja: 'しっかり乾かす', how: '鉢の土が中まで完全に乾いてから水をやる' },
};

/** 好む湿度 */
export const HUMIDITY = {
  low:    { order: 0, ja: '乾燥に強い' },
  medium: { order: 1, ja: 'ふつう（40〜60%）' },
  high:   { order: 2, ja: '高い湿度を好む（60%以上）' },
};

export const RANKS = ['genus', 'species', 'cultivar'];
export const SOURCES = { ncsu: 'NC State Extension Gardener Plant Toolbox', estimate: '目安（出典なし）' };

/** 根拠が必要な育て方の項目（evidence のキー） */
export const CARE_FIELDS = [
  'light.best', 'light.min', 'light.directSun',
  'temperature.minC', 'temperature.idealC',
  'humidity',
  'watering.growing', 'watering.winter',
];

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
export const getPath = (o, path) => path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);

/** 華氏 → 摂氏（整数に丸める） */
export const fToC = (f) => Math.round(((f - 32) * 5) / 9);

/**
 * 1件の植物データを検証する。問題があればメッセージの配列を返す（空なら合格）。
 * @param {object} t 植物データ
 * @param {{ partial?: boolean }} [opt] partial=true は品種など、親から引き継ぐので care が一部だけでよい
 */
export function validateTaxon(t, opt = {}) {
  const e = [];
  const need = (cond, msg) => { if (!cond) e.push(msg); };
  const allowedTop = ['id', 'rank', 'parent', 'scientificName', 'cultivar', 'names', 'refs', 'care', 'evidence', 'tips', 'note'];
  for (const k of Object.keys(t)) need(allowedTop.includes(k), `未知の項目 "${k}"`);

  need(typeof t.id === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.id), 'id は小文字英数字とハイフン');
  need(RANKS.includes(t.rank), `rank は ${RANKS.join('/')}`);
  if (t.rank === 'cultivar') need(t.scientificName === undefined, '品種の学名は親から決まるので scientificName は書かない');
  else need(typeof t.scientificName === 'string' && t.scientificName.length > 2, 'scientificName が必要');
  if (t.rank === 'species') need(/^[A-Z][a-z]+ [a-z-]+$/.test(t.scientificName), `種の学名は「属名 種小名」: ${t.scientificName}`);
  if (t.rank === 'genus') need(/^[A-Z][a-z]+$/.test(t.scientificName), `属の学名は1語: ${t.scientificName}`);
  if (t.rank === 'cultivar') {
    need(typeof t.parent === 'string', '品種には親（parent）の種が必要');
    need(typeof t.cultivar === 'string' && t.cultivar.length > 0, '品種には cultivar（品種名）が必要');
  }
  if (t.parent != null) need(typeof t.parent === 'string', 'parent は id の文字列');

  need(isObj(t.names) && typeof t.names.ja === 'string' && t.names.ja.length > 0, 'names.ja が必要');
  if (isObj(t.names)) {
    for (const k of Object.keys(t.names)) need(['ja', 'aliases'].includes(k), `names の未知の項目 "${k}"`);
    if (t.names.aliases != null) need(Array.isArray(t.names.aliases) && t.names.aliases.every((a) => typeof a === 'string' && a), 'names.aliases は文字列の配列');
  }
  if (t.refs != null) {
    need(isObj(t.refs), 'refs はオブジェクト');
    if (isObj(t.refs)) for (const k of Object.keys(t.refs)) need(['ncsu'].includes(k), `refs の未知の項目 "${k}"`);
  }

  const partial = opt.partial ?? t.rank === 'cultivar';
  const care = t.care ?? {};
  if (!partial) need(isObj(t.care), 'care が必要');
  if (isObj(care)) {
    for (const k of Object.keys(care)) need(['light', 'temperature', 'humidity', 'watering'].includes(k), `care の未知の項目 "${k}"`);
    const present = CARE_FIELDS.filter((p) => getPath(care, p) !== undefined);
    if (!partial) for (const p of CARE_FIELDS) need(present.includes(p), `care.${p} が必要`);

    const L = care.light;
    if (L) {
      for (const k of Object.keys(L)) need(['best', 'min', 'directSun'].includes(k), `care.light の未知の項目 "${k}"`);
      if (L.best !== undefined) need(L.best in LIGHT, `light.best は ${Object.keys(LIGHT).join('/')}`);
      if (L.min !== undefined) need(L.min in LIGHT, `light.min は ${Object.keys(LIGHT).join('/')}`);
      if (L.best in LIGHT && L.min in LIGHT) need(LIGHT[L.min].order <= LIGHT[L.best].order, 'light.min は light.best 以下');
      if (L.directSun !== undefined) need(L.directSun in DIRECT_SUN, `light.directSun は ${Object.keys(DIRECT_SUN).join('/')}`);
      if (L.best === 'direct' && L.directSun !== undefined) need(L.directSun !== 'avoid', '直射日光が最適なのに避けるになっている');
    }
    const T = care.temperature;
    if (T) {
      for (const k of Object.keys(T)) need(['minC', 'idealC'].includes(k), `care.temperature の未知の項目 "${k}"`);
      if (T.minC !== undefined) need(Number.isInteger(T.minC) && T.minC >= -20 && T.minC <= 25, 'temperature.minC は -20〜25 の整数');
      if (T.idealC !== undefined) need(Array.isArray(T.idealC) && T.idealC.length === 2 && T.idealC.every(Number.isInteger) && T.idealC[0] < T.idealC[1] && T.idealC[0] >= 5 && T.idealC[1] <= 40, 'temperature.idealC は [下限, 上限] の整数');
      if (Number.isInteger(T.minC) && Array.isArray(T.idealC)) need(T.minC <= T.idealC[0], 'minC は idealC の下限以下');
    }
    if (care.humidity !== undefined) need(care.humidity in HUMIDITY, `humidity は ${Object.keys(HUMIDITY).join('/')}`);
    const W = care.watering;
    if (W) {
      for (const k of Object.keys(W)) need(['growing', 'winter'].includes(k), `care.watering の未知の項目 "${k}"`);
      for (const k of ['growing', 'winter']) if (W[k] !== undefined) need(W[k] in WATERING, `watering.${k} は ${Object.keys(WATERING).join('/')}`);
      if (W.growing in WATERING && W.winter in WATERING) need(WATERING[W.winter].order >= WATERING[W.growing].order, '冬の水やりは生育期より乾かし気味（同じか乾かす側）');
    }

    // 根拠：書いた値すべてに必要。値のない根拠も不可
    const ev = t.evidence ?? {};
    need(isObj(ev), 'evidence はオブジェクト');
    for (const p of present) need(Array.isArray(ev[p]) && ev[p].length > 0, `care.${p} に根拠（evidence）がない`);
    for (const [p, list] of Object.entries(ev)) {
      need(CARE_FIELDS.includes(p), `evidence の未知の項目 "${p}"`);
      need(present.includes(p), `evidence["${p}"] に対応する値がない`);
      if (!Array.isArray(list)) continue;
      for (const x of list) {
        need(isObj(x) && x.src in SOURCES, `evidence["${p}"] の src は ${Object.keys(SOURCES).join('/')}`);
        if (x?.src === 'ncsu') {
          need(typeof x.quote === 'string' && x.quote.length >= 8, `evidence["${p}"] に原文（quote）が必要`);
          need(t.refs?.ncsu || t.parent, `evidence["${p}"] は ncsu を使うが refs.ncsu がない`);
        }
        if (x?.src === 'estimate') need(typeof x.reason === 'string' && x.reason.length >= 6, `evidence["${p}"] の目安には理由（reason）が必要`);
        if (x?.fahrenheit !== undefined) need(Array.isArray(x.fahrenheit) && x.fahrenheit.every(Number.isFinite), `evidence["${p}"].fahrenheit は数値の配列`);
        if (x) for (const k of Object.keys(x)) need(['src', 'quote', 'reason', 'fahrenheit'].includes(k), `evidence["${p}"] の未知の項目 "${k}"`);
      }
    }
  }

  if (t.tips != null) {
    need(Array.isArray(t.tips), 'tips は配列');
    for (const tip of t.tips ?? []) {
      need(isObj(tip) && typeof tip.ja === 'string' && tip.ja.length > 0, 'tip には ja が必要');
      need(tip?.src === 'ncsu' && typeof tip.quote === 'string', 'tip には出典の原文（src: ncsu, quote）が必要');
    }
  }
  if (t.note != null) need(typeof t.note === 'string', 'note は文字列');
  return e;
}
