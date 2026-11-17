// 適性判定・開花リレー分析・作業カレンダー生成（純粋関数）
import { PLANTS } from './plants.js';
import { humidityStress, doyToDate } from './climate.js';
import { siteOf, hardFails, climateTraits } from './fit.js';

export const LEVEL = {
  3: { mark: '◎', label: 'よく育つ' },
  2: { mark: '○', label: '工夫すれば育つ' },
  1: { mark: '△', label: '難しい' },
};

/**
 * 地域への生育適性（6段階）。すべて図鑑の値（耐寒ゾーン・ヒートゾーン・高温多湿への強さ・低温要求・手間いらず）と
 * 場所の気象データ（ゾーン・ヒートゾーン・熱帯夜・いちばん寒い月の平均気温）から決める。
 */
export const GRADE = {
  6: { ja: '簡単に育つ', mark: '◎', note: '「よく育つ」の条件を満たし、図鑑で「手間いらず」の丈夫な植物' },
  5: { ja: 'よく育つ', mark: '◎', note: '冬の寒さ・夏の暑さ・蒸れ・冬の低温のどれも、植物の限界に近くない' },
  4: { ja: '育つ', mark: '○', note: '育つが、夏の暑さ・蒸れ・冬の低温のうち1つが限界に近いか、暖地での栽培の情報が少ない' },
  3: { ja: '育ちにくい', mark: '△', note: '耐寒性が限界に近い（冬の寒さが耐寒ゾーンの下限から半ゾーン以内）、または注意すべき条件が2つ以上ある' },
  2: { ja: '育てるには工夫が必要', mark: '△', note: 'このままでは育たないが、鉢で冬に取り込む・防寒・球根の冷蔵処理・夏の日よけなどで育てられる' },
  1: { ja: '育てられない', mark: '×', note: '冬の寒さ・夏の暑さ・蒸れ・冬の低温が、出典で確かめた植物の限界を大きく超えていて、工夫しても育てるのが難しい' },
};
/** 6段階 → 3段階（◎ よく育つ / ○ 工夫すれば育つ / △ 難しい）。プランや他の画面で使う */
export const levelOfGrade = (g) => (g >= 4 ? 3 : g === 3 ? 2 : 1);

/**
 * 地域の気候に対する植物の適性。
 * grade：6段階（GRADE）。grade 2 以下は、プランの候補から外すハードフィルター（fit.js の hardFails）に当たる植物。
 * level：3段階（LEVEL）。図鑑・マイ庭・プランで判定が食い違わないよう、どれもこの関数を使う。
 * tips：「工夫が必要」の植物で、育てるための具体的な工夫
 */
export function evaluate(plant, climate) {
  if (!climate) return { level: null, grade: null, reasons: [], tips: [] };
  const site = siteOf(climate);
  const t = plant.fit || climateTraits(plant);
  const annual = plant.type === 'annual';
  const fails = hardFails(plant, climate, site);
  const reasons = fails.map((f) => f.text);
  const tips = [];
  const deepSnow = climate.annualSnow >= 100;
  let grade;
  if (fails.length) {
    // 外れた理由が、すべて工夫で補えるものか
    const fix = (f) => {
      if (f.key === 'cold' && plant.tender) return '鉢植えにして、冬は室内や軒下に取り込めば育てられる';
      if (f.key === 'cold' && site.zone >= t.hardinessZoneMin - 1) {
        return deepSnow && ['herb', 'bulb', 'fern', 'grass'].includes(plant.type)
          ? `冬は株元を腐葉土などで厚くマルチングする。雪の多い地域（年${climate.annualSnow}cm）では、雪の下で冬を越せることもある`
          : '冬は株元を腐葉土やバークで厚くマルチングし、寒波の夜は不織布で覆う（耐寒ゾーン1つ分の寒さまでの目安）';
      }
      if (f.key === 'chill' && plant.type === 'bulb') return '球根を冷蔵庫（5℃前後）で8週間ほど冷やしてから植える（冷蔵処理）。花後は毎年植え替える';
      if (f.key === 'humid' && site.stress === 2) return '高植えや砂利マルチで水はけをよくし、梅雨前に切り戻して風通しを確保する';
      if (f.key === 'humid') return '鉢植えにして、梅雨から夏は雨の当たらない風通しのよい場所へ移す（地植えなら高植え・砂利マルチ・梅雨前の切り戻し）';
      if (f.key === 'heat' && annual && plant.sow === 'cool') return '秋に種をまき、暑くなる前に咲き終える一年草として育てる';
      if (f.key === 'heat' && site.heat === t.heatZoneMax + 1) return '夏は午後に日陰になる場所に植える（鉢なら夏は涼しい半日陰へ移す）';
      return null;
    };
    const fixes = fails.map(fix);
    if (fixes.every(Boolean)) { grade = 2; tips.push(...new Set(fixes)); reasons.push(...tips.map((x) => `工夫：${x}`)); } else grade = 1;
  } else {
    let edges = 0, hardEdge = false;
    const est = (v) => (v ? '' : '（目安・出典未確認）');
    if (!annual && site.zone < t.hardinessZoneMin + 0.5) { hardEdge = true; reasons.push(`耐寒性がぎりぎり。冬は株元をマルチングで保護${est(t.zoneVerified)}`); }
    // 夏の暑さ：出典で確かめた値は「上限いっぱい」で注意。推定値は、上回るときに注意（外す理由にはしない）
    if (t.heatZoneMax != null) {
      if (t.heatVerified && site.heat === t.heatZoneMax) { edges++; reasons.push('夏の暑さは上限いっぱい。午後に日陰になる場所だと安心'); }
      else if (!t.heatVerified && site.heat > t.heatZoneMax) { edges++; reasons.push('暑い地域では夏に弱ることがある（目安・出典未確認）。午後に日陰になる場所だと安心'); }
    }
    if (t.heatHumidityTolerance === 'weak' && (site.stress === 1 || (!t.humidVerified && site.stress >= 2))) { edges++; reasons.push(`蒸れに弱い。水はけをよくし梅雨前に透かす${est(t.humidVerified)}`); }
    else if (t.heatHumidityTolerance === 'normal' && site.stress === 3) { edges++; reasons.push('熱帯夜が多い地域。株間を広めにとり風通しを確保'); }
    // 出典（NC State）で、夏の暑い沿岸平野が推奨地域に入っていない（山地・丘陵向き）：暑い地域では注意
    if (plant.verified?.regionCool && site.heat >= 7 && !t.heatVerified) { edges++; reasons.push(`米国ノースカロライナ州では${plant.verified.region.includes('P') ? '丘陵・山地' : '山地'}向きとされ、夏の暑い沿岸平野は推奨地域外。暑い地域では午後に日陰になる場所が安心`); }
    // 米国の資料の栽培範囲（耐寒ゾーンの上限）より2ゾーン以上暖かい地域：暖地での栽培の情報が少ないので注意として表示（外す理由にはしない）
    // 3ゾーン以上外れる（例：那覇で、ゾーン8までの植物）ときは「育ちにくい」
    if (!annual && t.hardinessZoneMax < 11 && site.zoneInt >= Math.floor(t.hardinessZoneMax) + 2) {
      if (site.zoneInt >= Math.floor(t.hardinessZoneMax) + 3) hardEdge = true; else edges++;
      reasons.push(`米国の資料の栽培範囲（ゾーン${Math.floor(t.hardinessZoneMax)}まで）より暖かい地域で、栽培の情報が少ない。暖地では夏の暑さや蒸れで弱ることがある`);
    }
    if (!annual && t.chillRequirement === 'high' && site.coldMonth != null && site.coldMonth > 7) { edges++; reasons.push('冬の低温が少なめの地域。年々花が減るときは植え替えを'); }
    if (!annual && t.chillRequirement === 'low' && site.coldMonth != null && site.coldMonth > 10) { edges++; reasons.push(`冬の低温が少ない地域（いちばん寒い月の平均${site.coldMonth}℃）。花つきが落ちることがある`); }
    grade = hardEdge || edges >= 2 ? 3 : edges === 1 ? 4 : plant.tags?.includes('easy') ? 6 : 5;
    if (grade >= 5) reasons.push(grade === 6 ? '丈夫で手間がかからず、この地域の寒さ・暑さにも余裕がある' : annual ? 'この地域で育てやすい一年草です' : 'この地域の寒さ・暑さに余裕をもって合っています');
  }
  const level = levelOfGrade(grade);
  if (annual && level > 1) reasons.push(sowAdvice(plant, climate));
  return { level, grade, gradeJa: GRADE[grade].ja, reasons, fails, tips };
}

/** 一年草の種まき時期（地域の気候から） */
export function sowAdvice(plant, climate) {
  const warmWinter = climate.zone.value >= 8;
  if (plant.sow === 'cool') {
    return warmWinter
      ? '種まきは秋（9〜10月）がおすすめ。冬を越して春に大きく育つ'
      : `種まきは春、${formatMonthOf(climate.lastFrost)}頃から。寒冷地では秋まきだと冬越しが難しい`;
  }
  return climate.frostFree ? '種まきは4〜5月、暖かくなってから' : `種まきは遅霜が終わる${formatMonthOf(climate.lastFrostSafe ?? climate.lastFrost)}以降に`;
}
const formatMonthOf = (doy) => (doy == null ? '春' : `${doyToDate(doy).month}月`);

/** 条件で絞り込み、適性順に並べる */
export function findPlants(climate, f = {}) {
  return PLANTS
    .filter((p) => !f.sun || p.sun.includes(f.sun))
    .filter((p) => !f.moist || p.moist.includes(f.moist))
    .filter((p) => !f.color || p.color.includes(f.color))
    .filter((p) => !f.month || p.bloom.includes(Number(f.month)))
    .filter((p) => !f.height || heightClass(p) === f.height)
    .filter((p) => !f.tag || p.tags.includes(f.tag))
    .filter((p) => !f.family || p.family?.ja === f.family)
    .filter((p) => !f.type || (f.type === 'veg' ? p.tags.includes('veg') : p.type === f.type))
    .filter((p) => !f.use || p.uses?.includes(f.use))
    .filter((p) => !f.role || p.roles?.includes(f.role))
    .filter((p) => !f.origin || p.origin?.includes(f.origin))
    .filter((p) => !f.q || (p.ja + p.latin + (p.groupJa || '') + (p.family?.ja || '') + (p.family?.latin || '') + (p.aka || []).join('')).toLowerCase().includes(f.q.toLowerCase()))
    .map((p) => ({ plant: p, ...evaluate(p, climate) }))
    .filter((r) => !f.minLevel || r.level == null || r.level >= f.minLevel)
    .filter((r) => gradeMatch(r.grade, f.grade))
    .sort((a, b) => (b.grade ?? 0) - (a.grade ?? 0) || a.plant.ja.localeCompare(b.plant.ja, 'ja'));
}

/** 育てやすさの条件：'6'〜'1'（その段階だけ）または 'ge5' など（その段階以上）。場所が未設定（grade なし）のときは絞り込まない */
export function gradeMatch(grade, cond) {
  if (!cond || grade == null) return true;
  const m = String(cond).match(/^(ge)?([1-6])$/);
  if (!m) return true;
  return m[1] ? grade >= Number(m[2]) : grade === Number(m[2]);
}

export function heightClass(p) {
  const avg = (p.h[0] + p.h[1]) / 2;
  if (avg >= 90) return 'back';
  if (avg >= 50) return 'middle';
  return 'front';
}
export const HEIGHT_LABEL = { back: '後景（高い）', middle: '中景', front: '前景（低い）' };

/** 季節を北半球の月に換算（南半球は6か月ずらす） */
export const localMonth = (m, south) => (south ? ((m + 5) % 12) + 1 : m);

/** 月ごとの開花数と、花の途切れる月に合う植物の提案 */
export function bloomGaps(gardenPlants, climate, south = false) {
  const counts = Array(12).fill(0);
  for (const p of gardenPlants) for (const m of p.bloom) counts[localMonth(m, south) - 1]++;
  // 北半球なら3〜11月、南半球ならその6か月ずれを「見頃にしたい期間」とする
  const season = [3, 4, 5, 6, 7, 8, 9, 10, 11].map((m) => localMonth(m, south));
  const ids = new Set(gardenPlants.map((p) => p.id));
  const gaps = season
    .filter((m) => counts[m - 1] === 0)
    .map((m) => {
      const north = localMonth(m, south); // 植物データ（北半球の月）へ戻す（6か月ずらしは自己逆）
      const suggestions = PLANTS
        .filter((p) => !ids.has(p.id) && p.bloom.includes(north))
        .map((p) => ({ plant: p, ...evaluate(p, climate) }))
        .filter((r) => r.level == null || r.level >= 2)
        .sort((a, b) => (b.level ?? 0) - (a.level ?? 0))
        .filter((r, i, arr) => arr.findIndex((x) => x.plant.group === r.plant.group) === i)
        .slice(0, 4);
      return { month: m, suggestions };
    });
  return { counts, gaps };
}

/**
 * 開花の月の実態に合わせた説明。counts：その土地の月ごとの開花数（12個）
 * 戻り値 { text, zero:[月], winter:boolean }
 */
export function relayText(counts) {
  const on = [], zero = [];
  counts.forEach((n, i) => (n ? on : zero).push(i + 1));
  if (!on.length) return { text: '花の咲く植物がありません。', zero, winter: false };
  if (!zero.length) return { text: '1年中、どの月も何かが咲く開花リレーです。', zero, winter: false };
  const winterOnly = zero.every((m) => [12, 1, 2].includes(m));
  return {
    text: `${monthsJa(on)}に花があり、${monthsJa(zero)}は花が途切れます。${winterOnly ? '冬は常緑の葉や実、枯れ姿や樹形を楽しむ構成です。' : 'その時期はグラスや葉の美しさを楽しむか、その月に咲く植物を加えましょう。'}`,
    zero, winter: winterOnly,
  };
}
/** 花のない月に咲く植物の提案（その地域で育つもの） */
export function fillSuggestions(zeroMonths, climate, south = false, exclude = new Set(), n = 4) {
  const north = zeroMonths.map((m) => localMonth(m, south));
  return PLANTS
    .filter((p) => !exclude.has(p.id) && p.bloom.some((m) => north.includes(m)))
    .map((p) => ({ plant: p, ...evaluate(p, climate) }))
    .filter((r) => r.level == null || r.level >= 2)
    .sort((a, b) => (b.level ?? 0) - (a.level ?? 0) || b.plant.bloom.filter((m) => north.includes(m)).length - a.plant.bloom.filter((m) => north.includes(m)).length)
    .filter((r, i, arr) => arr.findIndex((x) => x.plant.group === r.plant.group) === i)
    .slice(0, n);
}

/** 1㎡あたりの株数の目安 */
export function plantsPerSqm(p) {
  const s = p.spread / 100;
  return Math.max(1, Math.round(1 / (s * s)));
}

// ---------- 作業カレンダー ----------

const monthOf = (doy) => (doy == null ? null : doyToDate(doy).month);
const wrap = (m) => ((m - 1 + 12) % 12) + 1;

/**
 * 地域の気候とマイガーデンの植物から、月ごとの作業を生成
 * 返り値: [{ month, kind, title, detail, plants? }]
 */
export function buildTasks(climate, gardenPlants = []) {
  if (!climate) return [];
  const south = climate.south;
  const L = (m) => localMonth(m, south);
  const tasks = [];
  const add = (month, kind, title, detail, plants) => tasks.push({ month: wrap(month), kind, title, detail, plants });

  const lastM = monthOf(climate.lastFrost) ?? L(2);
  const safeM = monthOf(climate.lastFrostSafe ?? climate.lastFrost) ?? L(3);
  const firstM = monthOf(climate.firstFrost);
  const cold = climate.zone.value <= 6.5;
  const hot = climate.heatZone >= 7;
  const stress = humidityStress(climate);

  // 植え付け
  const springStart = climate.frostFree ? L(3) : wrap(safeM);
  add(springStart, 'plant', '春の植え付け開始',
    climate.frostFree ? '霜の心配がほぼない地域。芽が動き出したら植え付けOK。'
      : '遅霜の心配がなくなる頃。苗の植え付け・移植を始めましょう。');
  if (hot) {
    add(L(5), 'plant', '春植えはこの月までに', '真夏前に根を張らせるため、植え付けは早めに済ませます。');
  }
  if (cold) {
    add(L(9), 'plant', '秋植えは早めに', `初霜（${firstM ?? '-'}月頃）の1か月以上前までに植え付け、根を張らせます。`);
  } else {
    add(L(10), 'plant', '秋の植え付け適期', '暑さが和らぎ根がよく張る時期。宿根草の植え付けに最適です。');
  }

  // 一年草の種まきと種取り
  const isVeg = (p) => p.tags.includes('veg');
  const cool = gardenPlants.filter((p) => p.type === 'annual' && p.sow === 'cool' && !isVeg(p));
  const warm = gardenPlants.filter((p) => p.type === 'annual' && p.sow === 'warm' && !isVeg(p));
  // 野菜：植え付け・種まきと収穫
  const vWarm = gardenPlants.filter((p) => isVeg(p) && p.type === 'annual' && p.sow === 'warm');
  const vCool = gardenPlants.filter((p) => isVeg(p) && p.type === 'annual' && p.sow === 'cool');
  if (vWarm.length) add(wrap(safeM + (climate.frostFree ? 0 : 1)), 'plant', '夏野菜の植え付け', '遅霜の心配がなくなり、地温が上がってから。支柱やネットも一緒に準備します。', vWarm);
  if (vCool.length) {
    add(L(3), 'sow', '春の野菜の種まき・植え付け', '葉物や根菜は、とう立ちする前に収穫できるよう早めにまきます。', vCool);
    add(cold ? L(8) : L(9), 'sow', '秋冬野菜の種まき・植え付け', '暑さが和らいだら。寒さに当たった葉物は甘みが増します。', vCool);
  }
  const byHarvest = new Map();
  for (const p of gardenPlants.filter((x) => isVeg(x) && x.harvest?.length)) {
    const m = p.harvest[0];
    if (!byHarvest.has(m)) byHarvest.set(m, []);
    byHarvest.get(m).push(p);
  }
  for (const [m, list] of byHarvest) add(L(m), 'harvest', `収穫がはじまる：${list.map((p) => p.groupJa.replace(/（.*?）/g, '')).join('・')}`, 'とりどきを逃さず、こまめに収穫すると株が長持ちします。', list);
  if (cool.length) {
    if (climate.zone.value >= 8) add(L(10), 'sow', '秋まき一年草の種まき', '涼しくなったら種まき。小さな苗で冬を越し、春に一気に育ちます。', cool);
    else add(springStart, 'sow', '一年草の種まき（春まき）', '寒冷地では春にまきます。室内で早めに育苗しても。', cool);
    add(L(6), 'sow', '一年草の種を採る', '花がらを残して種を採ります。こぼれ種で来年も咲かせるなら、そのまま枯れるまで待ちましょう。', cool);
  }
  if (warm.length) {
    add(wrap(safeM + (climate.frostFree ? 1 : 0)), 'sow', '春まき一年草の種まき', '遅霜の心配がなくなってから。直まきか、ポットで育苗して植え付けます。', warm);
    add(L(10), 'sow', '一年草の種を採る', '枯れる前に種を採って、来年用に保存しましょう。', warm);
  }

  // 株分け
  const springDiv = gardenPlants.filter((p) => p.div === 'spring' || p.div === 'both');
  const autumnDiv = gardenPlants.filter((p) => p.div === 'autumn' || p.div === 'both');
  add(springStart, 'divide', '春の株分け', '込み合った株は芽が伸び始める前に分けて若返らせます。', springDiv);
  add(cold ? L(9) : L(10), 'divide', '秋の株分け', '春咲きの植物はこの時期に。', autumnDiv);

  // 切り戻し・剪定
  const chelsea = gardenPlants.filter((p) => p.cut === 'chelsea');
  if (chelsea.length) {
    add(L(cold ? 6 : 5), 'cut', 'チェルシーチョップ（摘心）', '夏〜秋咲きの背の高い植物を1/3〜半分に切ると、倒れにくくこんもり咲きます。', chelsea);
  }
  if (stress >= 2) {
    add(L(6), 'cut', '梅雨前の切り戻し・透かし',
      '熱帯夜の多い地域。込み合った株を透かし、蒸れや病気を防ぎます。',
      gardenPlants.filter((p) => p.humid <= 2));
  }
  for (const p of gardenPlants.filter((x) => x.cut === 'after')) {
    const end = Math.max(...p.bloom);
    add(L(end), 'cut', `${p.ja} の花後の切り戻し`, '花が終わった茎を切ると株が整い、返り咲くものもあります。', [p]);
  }
  const springCut = gardenPlants.filter((p) => p.cut === 'spring' || p.type === 'grass');
  add(wrap(lastM - 1), 'cut', '冬枯れの刈り取り', '新芽が出る前に枯れた茎やグラスを地際で刈ります。', springCut);
  const leaves = gardenPlants.filter((p) => p.cut === 'leaves');
  if (leaves.length) add(L(12), 'cut', '古葉の整理', '傷んだ古葉を取り、新しい葉や花芽に光を当てます。', leaves);

  // 冬支度
  if (firstM) {
    add(firstM, 'protect', '冬枯れ株はそのまま残す',
      '枯れた茎や種は冬の景色になり、株元の防寒・野鳥の餌にもなります。刈るのは早春に。');
  }
  if (cold) {
    add(firstM ? wrap(firstM) : L(11), 'protect', '防寒マルチング', '腐葉土やバークで株元を覆い、凍結から根を守ります。');
  }

  // 施肥・水やり
  add(springStart, 'feed', '芽出しの追肥', '緩効性肥料を少量。宿根草は肥料過多だと倒れやすくなります。');
  if (hot) {
    add(L(7), 'water', '夏の水やりと暑さ対策', '朝夕の涼しい時間にたっぷり。地温上昇を防ぐマルチングも有効です。');
  }
  const julyPrecip = climate.monthly[L(7) - 1]?.prcp ?? 100;
  if (julyPrecip < 80) {
    add(L(7), 'water', '乾燥期の水やり', '夏の降水が少ない地域。植え付け1年目の株は特に水切れに注意。');
  }

  return tasks.filter((t) => !t.plants || t.plants.length);
}

export const TASK_KIND = {
  plant: { ja: '植え付け', icon: '🌱' },
  divide: { ja: '株分け', icon: '✂︎' },
  cut: { ja: '切り戻し', icon: '✂️' },
  protect: { ja: '冬支度', icon: '🧣' },
  feed: { ja: '施肥', icon: '🧪' },
  water: { ja: '水やり', icon: '💧' },
  pest: { ja: '病害虫', icon: '🔍' },
  sow: { ja: '種まき', icon: '🌰' },
  harvest: { ja: '収穫', icon: '🧺' },
};

// ---------- 植え時（植え付け・種まきの適期） ----------
const wrapM = (m) => ((m - 1 + 120) % 12) + 1;
const run = (a, n) => Array.from({ length: n }, (_, i) => wrapM(a + i));
const SPRING_BULB_SUMMER = ['lilium', 'galtonia', 'eucomis', 'gladiolus', 'gloriosa', 'curcuma', 'crocosmia', 'zephyranthes', 'lycoris'];
/** 月の配列を「3〜4月・9〜10月」のような文字に */
export function monthsJa(ms) {
  if (!ms.length) return '';
  const set = [...new Set(ms)].sort((a, b) => a - b);
  const runs = [];
  for (const m of set) { const r = runs[runs.length - 1]; if (r && m === r[1] + 1) r[1] = m; else runs.push([m, m]); }
  if (runs.length > 1 && runs[0][0] === 1 && runs[runs.length - 1][1] === 12) { const last = runs.pop(); runs[0][0] = last[0]; }
  return runs.map(([a, b]) => (a === b ? `${a}月` : `${a}〜${b}月`)).join('・');
}

/**
 * 植物ごとの植え時（地域の霜と暑さから）
 * 戻り値：{ plant:{best,ok}, sow:{best}|null, avoid:[月], text, pot }
 */
export function plantingTime(p, climate) {
  const south = !!climate?.south;
  const L = (m) => localMonth(m, south);
  const zone = climate?.zone?.value ?? 8;
  const cold = zone <= 6.5;
  const warmWinter = zone >= 8;
  const hot = (climate?.heatZone ?? 7) >= 7;
  const safe = !climate ? L(4) : climate.frostFree ? L(3) : (monthOf(climate.lastFrostSafe ?? climate.lastFrost) ?? L(4));
  const autumn = cold ? [L(9)] : hot && warmWinter ? [L(10), L(11)] : [L(9), L(10)];
  // 早すぎないように：宿根草は3月から、夏野菜・寒さに弱い植物は4月から（北半球の月で）
  const sN = localMonth(safe, south);
  const S3 = L(Math.max(3, sN)), S4 = L(Math.max(4, sN));
  const g = p.group || p.id;
  const isVeg = p.tags?.includes('veg') && p.harvest;
  let best = [], ok = [], sow = null, why = '';

  if (isVeg && p.type === 'annual') {
    if (['garlic'].includes(g)) { best = [L(9), L(10)]; why = '秋に植えて冬を越し、初夏に収穫'; }
    else if (g === 'onion') { best = [L(11)]; ok = [L(10)]; why = '秋に苗を植えて冬を越す'; }
    else if (g === 'potato') { best = cold ? [wrapM(safe - 1), safe] : [L(2), L(3)]; ok = warmWinter ? [L(8), L(9)] : []; why = warmWinter ? '春植えのほか、暖地では晩夏植え（秋じゃが）も' : '芽が出るころに遅霜に当てないように'; }
    else if (['snap-pea', 'broad-bean'].includes(g)) { sow = { best: zone >= 7 ? [L(10), L(11)] : [wrapM(safe - 1), safe] }; best = sow.best; why = zone >= 7 ? '秋にまいて小さな苗で冬を越す' : '寒冷地では春まき'; }
    else if (p.sow === 'warm') { best = [S4, wrapM(S4 + 1)]; ok = [wrapM(S4 + 2)]; sow = { best: [S4, wrapM(S4 + 1)] }; why = '遅霜の心配がなくなり、地温が上がってから'; }
    else { sow = { best: cold ? [wrapM(safe - 1), safe, L(8)] : [L(3), L(9)] }; best = cold ? [safe, L(8)] : [L(3), L(4), L(9), L(10)]; ok = cold ? [] : [L(2), L(11)]; why = '涼しい春と秋が育てやすい'; }
  } else if (p.type === 'annual') {
    if (p.sow === 'cool') {
      if (warmWinter) { sow = { best: [L(9), L(10)] }; best = [L(10), L(11)]; ok = [L(3)]; why = '秋まきで冬を越すと、春に大株になる'; }
      else { sow = { best: [wrapM(safe - 1), safe] }; best = [safe, wrapM(safe + 1)]; why = '寒冷地では春まき・春植え'; }
    } else { sow = { best: [S4, wrapM(S4 + 1)] }; best = [wrapM(S4 + 1), wrapM(S4 + 2)]; ok = [S4]; why = '暖かくなってから。真夏前に根を張らせる'; }
  } else if (p.type === 'bulb') {
    const summer = SPRING_BULB_SUMMER.includes(g) || p.tender || Math.min(...p.bloom) >= 6;
    if (g === 'lilium') { best = [L(10), L(11)]; ok = [L(3)]; why = '秋植えが基本。春植えもできる'; }
    else if (g === 'lycoris') { best = [L(7), L(8)]; why = '夏の休眠中に植える'; }
    else if (summer) { best = [S4, wrapM(S4 + 1)]; why = '春植え球根。霜の心配がなくなってから'; }
    else { best = warmWinter ? [L(10), L(11)] : [L(9), L(10)]; ok = warmWinter ? [L(12)] : []; why = '秋植え球根。寒さに当てることで春に咲く'; }
  } else if (p.type === 'shrub') {
    if (p.tender) { best = [S4, wrapM(S4 + 1)]; why = '寒さに弱いので、暖かくなってから'; }
    else if (p.tags?.includes('evergreen')) { best = cold ? [safe, wrapM(safe + 1)] : [L(3), L(4), L(9), L(10)]; ok = [L(6)]; why = '常緑樹は芽が動く前の春か、暑さが和らいだ秋'; }
    else { best = cold ? [safe, L(10)] : [L(11), L(2), L(3)]; ok = cold ? [] : [L(12), L(1)]; why = '落葉樹は葉を落として休んでいる時期に'; }
  } else {
    // 宿根草・グラス・亜低木・シダ：植物の性質ごとに適期を分ける
    const spring = cold ? [safe, wrapM(safe + 1)] : [S3, wrapM(S3 + 1)];
    const lateSpring = cold ? [wrapM(safe + 1), wrapM(safe + 2)] : [S4, wrapM(S4 + 1)];
    const first = p.bloom.length ? Math.min(...p.bloom) : 6;
    const dryMed = p.moist.length === 1 && p.moist[0] === 'dry';
    if (p.tender) { best = [S4, wrapM(S4 + 1)]; ok = [wrapM(S4 + 2)]; why = '寒さに弱いので、遅霜のあとに'; }
    else if (p.form === 'fern' || p.type === 'fern') { best = lateSpring; ok = [autumn[0]]; why = '新しい葉が伸び始める春の終わりに。乾かさないように'; }
    else if (p.form === 'grass' && WARM_GRASS.includes(g)) { best = cold ? [wrapM(safe + 1), wrapM(safe + 2)] : [L(4), L(5), L(6)]; why = '暖かい季節に育つグラス。地温が上がる晩春〜初夏に植えると根付きやすい'; }
    else if (p.form === 'grass') { best = spring; ok = autumn; why = '涼しい季節に育つグラス。春か秋の涼しい時期に'; }
    else if (p.humid === 1 && hot) { best = autumn; ok = spring; why = '暑さに弱いので、夏までに時間のある秋植えがおすすめ'; }
    else if (dryMed) { best = cold ? spring : [L(4), L(5)]; ok = [autumn[0]]; why = '乾燥を好む植物。冬の長雨に当てないよう、暖かくなってから植えると根腐れしにくい'; }
    else if (!p.sun.includes('full')) { best = cold ? spring : [L(3), autumn[0]]; ok = [L(4), autumn[1] || autumn[0]]; why = '日陰の植物。芽出し前の早春か、暑さが和らぐ初秋に'; }
    else if (cold) { best = spring; ok = autumn; why = '寒冷地は春植え。秋植えは早めに'; }
    else if (first <= 5) { best = autumn; ok = [S3]; why = `春（${first}月ごろ）に咲くので、前の年の秋に植えて根を張らせると花つきがよい`; }
    else if (first >= 8) { best = spring; ok = [autumn[0]]; why = `${first}月ごろから咲く遅咲き。春に植えればその年から咲く`; }
    else if (p.heat >= 10 || p.tags?.includes('prairie')) { best = [S3 === L(3) ? L(4) : S3, wrapM(Math.max(4, S3) + 1)]; ok = autumn; why = '暑さに強い夏の花。暖かくなり始める春に植えると夏までに大株に'; }
    else { best = [...spring, autumn[0]]; ok = [autumn[1] || autumn[0]]; why = '春と秋の2回。夏越しの体力がつく秋植えも◎'; }
  }
  const avoid = [];
  if (hot) avoid.push(L(7), L(8));
  if (!climate?.frostFree && !warmWinter) avoid.push(L(1), L(2));
  best = [...new Set(best)];
  ok = [...new Set(ok)].filter((m) => !best.includes(m));
  const text = `${p.type === 'annual' && sow ? '苗の植え付け' : '植え付け'} ${monthsJa(best)}${ok.length ? `（${monthsJa(ok)}も可）` : ''}${sow && p.type === 'annual' ? `・種まき ${monthsJa(sow.best)}` : ''}`;
  const pot = '鉢植えは、真夏と真冬を避ければほぼいつでも植え付けられます。根鉢をくずさずに植えると失敗しにくい。';
  return { plant: { best, ok }, sow, avoid: avoid.filter((m) => !best.includes(m)), text, why, pot };
}

const WARM_GRASS = ['miscanthus', 'panicum', 'pennisetum', 'schizachyrium', 'sporobolus', 'bouteloua', 'muhlenbergia', 'imperata', 'hakonechloa', 'eragrostis', 'chasmanthium', 'panicum-frosted', 'vetiver', 'cymbopogon'];

/** 耐寒温度の目安（℃）：植物の耐寒ゾーンの下限から。一年草は null */
export function coldTemp(p) {
  if (p.type === 'annual') return null;
  const z = p.zone[0];
  const f = -60 + (Math.floor(z) - 1) * 10 + (z % 1 ? 5 : 0);
  return Math.round(((f - 32) * 5) / 9);
}
/** 日照時間の目安 */
export function sunHours(p) {
  const s = p.sun;
  if (s.includes('full') && s.includes('shade')) return '日向〜日陰（2〜6時間以上）';
  if (s.includes('full') && s.includes('part')) return '1日3〜6時間以上';
  if (s.includes('full')) return '1日6時間以上';
  if (s.includes('part') && s.includes('shade')) return '1日2〜4時間・明るい日陰';
  if (s.includes('part')) return '1日3〜5時間（午前中の日が理想）';
  return '1日2時間以下・明るい日陰';
}
/** 土の酸度（pH）の好み。データのない植物は個別データなしと明示 */
const PH_ACID = new Set(['blueberry', 'camellia-sinensis', 'gardenia', 'hydrangea-serrata', 'lupinus', 'gentiana', 'kirengeshoma', 'astilbe', 'athyrium', 'dryopteris', 'matteuccia', 'polystichum', 'tricyrtis', 'primula-japonica', 'iris-ensata', 'adiantum', 'epimedium', 'pachysandra', 'asarum', 'cornus-sanguinea']);
const PH_ALK = new Set(['lavender', 'rosemary', 'santolina', 'dianthus', 'gypsophila', 'gypsophila-elegans', 'scabiosa', 'knautia', 'clematis', 'salvia-officinalis', 'thymus', 'origanum', 'verbascum', 'echinops', 'eryngium', 'centranthus', 'helleborus', 'iris-germanica', 'artemisia', 'perovskia', 'stachys', 'cerastium', 'armeria', 'limonium', 'crambe', 'sedum', 'papaver', 'alcea', 'euphorbia', 'nepeta', 'achillea', 'teucrium-hircanicum', 'dianthus-carthusianorum', 'aubrieta', 'iberis', 'lunaria', 'cephalaria', 'salvia-pratensis']);
export function soilPH(p) {
  // 出典（NC State）の土の酸度：A 酸性（pH 6.0未満）・N 中性（6.0〜8.0）・L アルカリ性（8.0超）
  const v = p.verified?.ph;
  if (v) {
    const T = { A: ['6.0未満', '酸性を好む'], N: ['6.0〜8.0', '中性を好む（酸性の土は苦土石灰で調整）'], L: ['8.0超', 'アルカリ性を好む'], AN: ['6.0未満〜8.0', '酸性〜中性（幅広く対応）'], NL: ['6.0〜8.0超', '中性〜アルカリ性'], ANL: ['6.0未満〜8.0超', '幅広く対応'] };
    const [range, ja] = T[v] || T.ANL;
    return { range, ja: `${ja}（出典：NC State）`, known: true };
  }
  const g = p.group || p.id;
  if (PH_ACID.has(g)) return { range: '5.0〜6.0', ja: '酸性を好む', known: true };
  if (PH_ALK.has(g)) return { range: '6.5〜8.0', ja: '中性〜弱アルカリ性を好む（苦土石灰で調整）', known: true };
  return { range: '6.0〜7.0', ja: '弱酸性〜中性（一般的な草花の目安。この植物の個別データは準備中）', known: false };
}
// 気候判定用の項目に、個別データのある土の酸度（pH）を加える
for (const p of PLANTS) if (p.fit) { const ph = soilPH(p); p.fit.phRange = ph.known ? ph.range : null; }

/**
 * つくる順番の予定月。
 * まず主な植え付け（宿根草、なければ最初の植え付けの手順）の月 P を、準備の期間（下準備1か月＋構造物1か月）をとったうえで、
 * 適した月のうち最も早い月に決める。下準備は P の2か月前（構造物がなければ1か月前）、構造物は P の1か月前、
 * ほかの植え付けは P 以降の適した月、仕上げ（first）は最初の植え付けの月。
 */
export function scheduleSteps(steps, now = new Date()) {
  const fmt = (t) => `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
  const next = (t, ms) => { const ok = (ms || []).filter(Boolean); if (!ok.length) return t; for (let k = 0; k < 24; k++) if (ok.includes(((t + k) % 12) + 1)) return t + k; return t; };
  const t0 = now.getFullYear() * 12 + now.getMonth();
  const out = steps.map((st) => ({ ...st }));
  const seq = out.filter((st) => !st.free && !st.first);
  const free = out.filter((st) => st.free);
  const lead = Math.max(1, seq.length);
  const main = free.find((st) => st.key === 'pere') || free[0];
  const P = main ? next(t0 + lead, main.ms) : t0 + lead;
  seq.forEach((st, i) => { st._t = Math.max(t0, P - (seq.length - i)); });
  free.forEach((st) => { st._t = st === main ? P : next(P, st.ms); });
  const firstT = free.length ? Math.min(...free.map((st) => st._t)) : P;
  out.filter((st) => st.first).forEach((st) => { st._t = firstT; });
  return out.map(({ _t, ...st }) => ({ ...st, ym: fmt(_t) }));
}
