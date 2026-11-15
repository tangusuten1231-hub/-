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
    // 宿根草・グラス・亜低木・シダ
    if (p.tender) { best = [S4, wrapM(S4 + 1)]; ok = [wrapM(S4 + 2)]; why = '寒さに弱いので、遅霜のあとに'; }
    else {
      const spring = cold ? [safe, wrapM(safe + 1)] : [S3, wrapM(S3 + 1)];
      if (p.form === 'grass') { best = spring; ok = autumn; why = 'グラスは春植えが根付きやすい'; }
      else if (p.humid === 1 && hot) { best = autumn; ok = spring; why = '暑さに弱いので、夏までに時間のある秋植えがおすすめ'; }
      else if (cold) { best = spring; ok = autumn; why = '寒冷地は春植え。秋植えは早めに'; }
      else { best = [...spring, ...autumn]; why = '春と秋の2回。夏越しの体力がつく秋植えも◎'; }
    }
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
