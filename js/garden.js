// 適性判定・開花リレー分析・作業カレンダー生成（純粋関数）
import { PLANTS } from './plants.js';
import { humidityStress, doyToDate } from './climate.js';

export const LEVEL = {
  3: { mark: '◎', label: 'よく育つ' },
  2: { mark: '○', label: '工夫すれば育つ' },
  1: { mark: '△', label: '難しい' },
};

/** 地域の気候に対する植物の適性 */
export function evaluate(plant, climate) {
  if (!climate) return { level: null, reasons: [] };
  let level = 3;
  const reasons = [];
  const site = climate.zone.value;
  const deepSnow = climate.annualSnow >= 100 && plant.type !== 'subshrub';
  const coldSite = deepSnow ? site + 1 : site;
  const [zMin, zMax] = plant.zone;
  const annual = plant.type === 'annual';

  // 一年草は毎年種から育てるので、冬の寒さの判定はしない
  if (annual) {
    // 何もしない
  } else if (coldSite < zMin && plant.tender) {
    level = Math.min(level, 2);
    reasons.push('寒さに弱い。鉢植えにして、冬は室内や軒下に取り込めば育つ');
  } else if (coldSite < zMin) {
    if (coldSite >= zMin - 0.5) {
      level = Math.min(level, 2);
      reasons.push('耐寒性がぎりぎり。冬は株元をマルチングで保護');
    } else {
      level = 1;
      reasons.push(`冬の寒さが厳しすぎる（耐寒ゾーン${zMin}以上向き）`);
    }
  } else if (deepSnow && site < zMin) {
    level = Math.min(level, 2);
    reasons.push('積雪の保温効果で越冬できる見込み。雪の少ない年は防寒を');
  }
  if (!annual && site > zMax + 1) {
    level = Math.min(level, 2);
    reasons.push('冬の寒さが足りず、休眠不足で弱ることがある');
  }

  const heatDiff = climate.heatZone - plant.heat;
  if (heatDiff >= 2) {
    level = 1;
    reasons.push('夏の暑さで夏越しが難しい');
  } else if (heatDiff === 1) {
    level = Math.min(level, 2);
    reasons.push('夏の暑さに注意。午後に日陰になる場所がおすすめ');
  }

  const stress = humidityStress(climate);
  if (plant.humid === 1 && stress >= 2) {
    level = Math.min(level, 2);
    reasons.push(stress === 3
      ? '蒸れにとても弱い。高植え・砂利マルチ・梅雨前の切り戻しが必須'
      : '蒸れに弱い。水はけをよくし梅雨前に透かす');
  } else if (plant.humid === 2 && stress === 3) {
    reasons.push('熱帯夜が多い地域。株間を広めにとり風通しを確保');
  }

  if (!reasons.length) reasons.push(annual ? 'この地域で育てやすい一年草です' : 'この地域の寒さ・暑さに合っています');
  if (annual) reasons.push(sowAdvice(plant, climate));
  return { level, reasons };
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
    .sort((a, b) => (b.level ?? 0) - (a.level ?? 0) || a.plant.ja.localeCompare(b.plant.ja, 'ja'));
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
  const g = p.group || p.id;
  if (PH_ACID.has(g)) return { range: '5.0〜6.0', ja: '酸性を好む', known: true };
  if (PH_ALK.has(g)) return { range: '6.5〜8.0', ja: '中性〜弱アルカリ性を好む（苦土石灰で調整）', known: true };
  return { range: '6.0〜7.0', ja: '弱酸性〜中性（一般的な草花の目安。この植物の個別データは準備中）', known: false };
}

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
