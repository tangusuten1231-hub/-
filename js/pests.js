// 病害虫・生理障害の知識ベースと、地域の気候からのリスク推定
import { humidityStress } from './climate.js';
import { localMonth } from './garden.js';

// hosts: 対象の植物（group ID の配列、または判定関数）
// months: 発生しやすい月（北半球）
// risk(c): 地域の気候から 0〜3 の発生しやすさ
export const PESTS = [
  {
    id: 'powdery', ja: 'うどんこ病', kind: '病気', months: [5, 6, 9, 10],
    hosts: ['phlox-paniculata', 'monarda', 'aster', 'aster-ageratoides', 'pulmonaria', 'verbena', 'achillea', 'helenium', 'agastache', 'coreopsis', 'rudbeckia-hirta', 'eupatorium', 'sanguisorba', 'geum', 'scabiosa', 'knautia'],
    risk: (c) => 1 + (c.hotDays >= 30 ? 1 : 0) + (c.annualPrecip < 1400 ? 1 : 0),
    sign: '葉や茎が白い粉をまぶしたようになる。昼夜の寒暖差がある乾いた時期に多い。',
    prevent: ['株間を広くとって風通しを確保', '耐病性の品種を選ぶ（フロックス‘デビッド’‘ジーナ’、モナルダ‘ジェイコブクライン’など）', '窒素肥料を控えめに', '夏の乾燥で株を弱らせない'],
    treat: ['白くなった葉を早めに取り除く', '初期なら炭酸水素カリウム（重曹系）の薬剤が有効', '広がったら花後に地際近くまで切り戻す'],
  },
  {
    id: 'botrytis', ja: '灰色かび病', kind: '病気', months: [3, 4, 5, 6, 10, 11],
    hosts: ['paeonia', 'helleborus', 'heuchera', 'astilbe', 'campanula', 'delphinium', 'lupinus', 'leucanthemum', 'dianthus', 'stachys', 'lavender', 'gypsophila', 'aquilegia'],
    risk: (c) => 1 + (c.monthly?.[5]?.prcp >= 150 ? 1 : 0) + (c.annualPrecip >= 1600 ? 1 : 0),
    sign: '花やつぼみ、葉が茶色く腐り、灰色のカビが生える。雨が続く涼しい時期に多い。',
    prevent: ['咲き終わった花がらをこまめに摘む', '株元の枯れ葉を取り除く', '水やりは株元に、夕方より朝に'],
    treat: ['発病した部分を袋に入れて処分', '雨が続く前に殺菌剤を予防的に散布'],
  },
  {
    id: 'southern-blight', ja: '白絹病', kind: '病気', months: [6, 7, 8, 9],
    hosts: ['hosta', 'platycodon', 'iris-germanica', 'iris-sanguinea', 'sedum', 'aster', 'echinacea', 'rudbeckia', 'achillea', 'phlox-paniculata', 'helleborus', 'campanula', 'monarda', 'delphinium'],
    risk: (c) => Math.min(3, humidityStress(c)),
    sign: '株元が急にしおれて腐り、地際に白い絹糸状のカビと茶色い粒（菌核）ができる。高温多湿の夏に発生。',
    prevent: ['水はけのよい土にし、高植えにする', '株元に有機物マルチを厚く敷きすぎない（夏は薄く）', '梅雨前に株元を透かして風を通す'],
    treat: ['発病株は周りの土ごと取り除く', '同じ場所に同じ植物をすぐ植えない'],
  },
  {
    id: 'root-rot', ja: '根腐れ・夏越し不良（蒸れ）', kind: '生理障害', months: [6, 7, 8, 9],
    hosts: (p) => p.humid === 1 || (p.moist.length === 1 && p.moist[0] === 'dry'),
    risk: (c) => Math.max(humidityStress(c), c.annualPrecip >= 1800 ? 2 : 0),
    sign: '梅雨〜真夏に下葉から黒く傷み、株が溶けるように枯れる。乾燥地原産の植物に多い。',
    prevent: ['花壇を周囲より10〜20cm高く盛り土する', '砂利・軽石を混ぜて水はけを改善', '梅雨入り前に半分ほど切り戻して風通しをよくする', '株元のマルチは砂利など乾きやすいものに'],
    treat: ['傷んだ葉・茎を取り除き、水やりを控える', '鉢に上げて雨の当たらない場所で夏越しさせる'],
  },
  {
    id: 'soft-rot', ja: '軟腐病', kind: '病気', months: [6, 7, 8, 9],
    hosts: ['iris-germanica', 'iris-sanguinea', 'agapanthus', 'kniphofia', 'hosta'],
    risk: (c) => humidityStress(c) >= 2 ? 2 : 1,
    sign: '根茎や株元が柔らかく腐り、強い悪臭がする細菌病。',
    prevent: ['根茎を浅植えにして日に当てる（ジャーマンアイリス）', '株分けの切り口は乾かしてから植える', '水はけを良くし、傷をつけない'],
    treat: ['腐った部分を清潔な刃物で削り取り、切り口を乾かす', 'ひどい株は処分する'],
  },
  {
    id: 'rust', ja: 'さび病', kind: '病気', months: [5, 6, 9, 10],
    hosts: ['hemerocallis', 'aster', 'aster-tataricus', 'iris-sanguinea', 'achillea', 'agastache', 'echinops'],
    risk: (c) => c.annualPrecip >= 1400 ? 2 : 1,
    sign: '葉の裏にオレンジや茶色の粉状の斑点ができる。',
    prevent: ['風通しを良くする', '葉を濡らす水やりを避ける', '秋に枯れ葉を片付ける'],
    treat: ['発病した葉を取り除く', '広がる場合は登録のある殺菌剤を使う'],
  },
  {
    id: 'blackspot-hellebore', ja: '黒斑病（クリスマスローズ）', kind: '病気', months: [4, 5, 6, 9, 10],
    hosts: ['helleborus'],
    risk: (c) => c.annualPrecip >= 1400 ? 2 : 1,
    sign: '葉に黒褐色の丸い斑点が広がる。',
    prevent: ['古い葉を秋〜冬（12月頃）に切り取る', '株元の風通しを良くする'],
    treat: ['斑点の出た葉を切り取り処分する'],
  },
  {
    id: 'aphid', ja: 'アブラムシ', kind: '害虫', months: [3, 4, 5, 6, 9, 10],
    hosts: ['lupinus', 'delphinium', 'aquilegia', 'achillea', 'helianthus', 'rudbeckia', 'aster', 'eupatorium', 'monarda', 'verbena', 'digitalis', 'salvia-nemorosa', 'phlox-paniculata', 'heliopsis', 'patrinia', 'campanula', 'leucanthemum'],
    risk: () => 2,
    sign: '新芽やつぼみに小さな虫が群がり、汁を吸って生育を妨げる。ウイルス病も媒介する。',
    prevent: ['新芽・つぼみを週1回チェック', '窒素肥料を与えすぎない', 'テントウムシなど天敵を殺さない'],
    treat: ['少ないうちは指でつぶすか水で洗い流す', '多い場合は登録のある殺虫剤やでんぷん系の薬剤を使う'],
  },
  {
    id: 'mite', ja: 'ハダニ', kind: '害虫', months: [6, 7, 8, 9],
    hosts: ['salvia-nemorosa', 'salvia-guaranitica', 'salvia-indigo', 'salvia-microphylla', 'verbena', 'lavender', 'agastache', 'phlox-paniculata', 'heuchera', 'nepeta', 'monarda', 'perovskia', 'origanum', 'rosemary'],
    risk: (c) => (c.hotDays >= 60 ? 2 : 1) + (c.monthly?.[6]?.prcp < 120 ? 1 : 0),
    sign: '葉にかすり状の白い点が出て色が抜ける。高温で乾燥し、雨の当たらない場所で多い。',
    prevent: ['乾く時期は夕方に葉の裏へ散水する', '軒下など雨の当たらない場所は特に注意'],
    treat: ['葉裏を水で強めに洗い流す', '多発したら被害葉を除き、ハダニ用の薬剤を使う'],
  },
  {
    id: 'slug', ja: 'ナメクジ・カタツムリ', kind: '害虫', months: [3, 4, 5, 6, 9, 10],
    hosts: ['hosta', 'helleborus', 'delphinium', 'lupinus', 'ligularia', 'campanula', 'primula-japonica', 'tsuwabuki', 'pulmonaria', 'brunnera', 'heuchera', 'tricyrtis', 'begonia-grandis', 'astilbe', 'dicentra'],
    risk: (c) => (c.annualPrecip >= 1400 ? 2 : 1) + (humidityStress(c) >= 2 ? 1 : 0),
    sign: '新芽や若い葉が夜のうちに食べられ、光る筋が残る。雨の多い時期に活発。',
    prevent: ['株元の落ち葉や鉢の下など隠れ場所を減らす', '雨の夜に懐中電灯で見回る'],
    treat: ['見つけしだい捕殺', 'リン酸第二鉄の誘引剤（ペットや野鳥に比較的安全）を株元に置く'],
  },
  {
    id: 'armyworm', ja: 'ヨトウムシ', kind: '害虫', months: [4, 5, 6, 9, 10, 11],
    hosts: ['aster', 'aster-ageratoides', 'dianthus', 'leucanthemum', 'gaillardia', 'echinacea', 'heuchera', 'hosta', 'rudbeckia', 'erigeron', 'lychnis', 'geranium-rozanne'],
    risk: () => 2,
    sign: '一晩で葉や花が大きく食べられる。昼は土の中に隠れている。',
    prevent: ['葉裏の卵のかたまりを見つけたら取り除く', '防虫ネットで覆う（春の植え付け直後）'],
    treat: ['食害された株の周りの浅い土を探して捕殺', '多い場合は BT 剤など登録のある薬剤を使う'],
  },
  {
    id: 'leafminer', ja: 'ハモグリバエ（絵かき虫）', kind: '害虫', months: [4, 5, 6, 9, 10],
    hosts: ['aquilegia', 'gaillardia', 'aster', 'leucanthemum', 'helenium', 'verbena', 'dianthus'],
    risk: () => 1,
    sign: '葉に白い曲がりくねった線が描かれる。',
    prevent: ['被害葉を早めに摘み取る'],
    treat: ['被害が広がる場合は登録のある殺虫剤を使う'],
  },
  {
    id: 'chafer', ja: 'コガネムシの幼虫', kind: '害虫', months: [8, 9, 10, 4, 5],
    hosts: ['heuchera', 'sedum', 'hosta', 'helleborus', 'carex', 'phlox-subulata', 'dianthus', 'tiarella'],
    risk: () => 1,
    sign: '元気だった株が急にぐらつき、引くと根がない。土の中に白いイモムシがいる。',
    prevent: ['未熟な堆肥を使わない', '成虫を見かけたら捕殺'],
    treat: ['株を掘り上げて幼虫を取り除き、植え直す'],
  },
  {
    id: 'frost-heave', ja: '霜柱による浮き上がり', kind: '生理障害', months: [12, 1, 2, 3],
    hosts: (p) => ['heuchera', 'tiarella', 'helleborus', 'dianthus', 'phlox-subulata', 'armeria', 'erigeron', 'heucherella'].includes(p.group) || p.h[1] <= 30,
    risk: (c) => (c.zone.value <= 8 && c.annualSnow < 50 ? 2 : c.zone.value <= 9 ? 1 : 0),
    sign: '冬に霜柱で株が持ち上がり、根が露出して乾き枯れる。秋植えの株や浅根の植物に多い。',
    prevent: ['秋の植え付けは早めにして根を張らせる', '冬前に株元を腐葉土やバークでマルチング'],
    treat: ['浮いた株は土を寄せて押さえ込む'],
  },
  {
    id: 'snow-rot', ja: '雪解け後の腐れ・灰色かび', kind: '病気', months: [3, 4],
    hosts: (p) => p.tags.includes('evergreen') || p.form === 'mound',
    risk: (c) => (c.annualSnow >= 150 ? 3 : c.annualSnow >= 60 ? 2 : 0),
    sign: '長く雪に覆われた常緑の葉が、雪解け後に腐ったりカビたりする。',
    prevent: ['秋に傷んだ葉を整理しておく', '雪解け後すぐに枯れ葉を取り除き日光を当てる'],
    treat: ['腐った部分を取り除き、新芽の伸びを待つ'],
  },
];

export const KIND_ICON = { '病気': '🦠', '害虫': '🐛', '生理障害': '🌡️' };

function hostsOf(pest, p) {
  return typeof pest.hosts === 'function' ? pest.hosts(p) : pest.hosts.includes(p.group);
}

/** 植物ごとに注意したい病害虫 */
export function pestsForPlant(p, climate) {
  return PESTS.filter((x) => hostsOf(x, p))
    .map((x) => ({ pest: x, risk: climate ? x.risk(climate) : 1 }))
    .filter((r) => r.risk > 0)
    .sort((a, b) => b.risk - a.risk);
}

/** 地域の気候から、特に注意したい病害虫（植物によらない） */
export function regionRisks(climate) {
  if (!climate) return [];
  return PESTS.map((x) => ({ pest: x, risk: x.risk(climate) }))
    .filter((r) => r.risk >= 2)
    .sort((a, b) => b.risk - a.risk);
}

/** 作業暦用：その月に見回るべき病害虫と対象の植物 */
export function pestTasks(climate, plants) {
  if (!climate) return [];
  const south = climate.south;
  const out = [];
  for (const x of PESTS) {
    const risk = x.risk(climate);
    if (risk <= 0) continue;
    const targets = plants.filter((p) => hostsOf(x, p));
    if (!targets.length) continue;
    // 発生期の最初の月に「予防」、リスクが高ければ最盛期にも「見回り」
    const months = x.months.map((m) => localMonth(m, south));
    out.push({ month: months[0], kind: 'pest', title: `${x.ja}の予防`, detail: x.prevent[0] + '。' + (x.prevent[1] ? x.prevent[1] + '。' : ''), plants: targets, pest: x, risk });
    if (risk >= 2 && months.length > 2) {
      const peak = months[Math.floor(months.length / 2)];
      out.push({ month: peak, kind: 'pest', title: `${x.ja}の見回り`, detail: x.sign + ' 見つけたら：' + x.treat[0] + '。', plants: targets, pest: x, risk });
    }
  }
  return out;
}

export const RISK_JA = ['', '注意', 'やや多い', '多い'];
