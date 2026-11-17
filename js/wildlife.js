// 庭で見られる可能性のある生き物と、生物多様性度の目安
// months: 成虫・成鳥が見られる月（北半球）、zone: よく見られる地域の耐寒性ゾーンの範囲、base: ふつうさ（3=どこにでも 1=まれ）
// host: 幼虫の食草（group ID）、hostFamily: 食草の科、nectar: 蜜や花粉を求めて来る植物（group / tag / form）
// food: 実や種を食べに来る植物（group / use）、feature: 庭の環境（下の FEATURES）への好み（数字が大きいほど重要）
// ※ 一般的な観察記録にもとづく目安。必ず見られるわけではない。

export const FEATURES = {
  water: '水場（バードバス・水鉢）',
  pond: '小さな池・ビオトープ',
  tree: '木（シンボルツリーなど）',
  shrub: '低木・生け垣',
  grass: 'グラス類の株',
  lawn: '芝生・ひらけた地面',
  compost: '落ち葉・堆肥置き場',
  habitat: '石積み・枯れ枝の山',
  structure: 'パーゴラ・壁・フェンス',
  winter: '冬も刈らずに残す枯れ茎',
};
export const KINDS = { butterfly: '蝶', moth: '蛾', bee: '蜂・アブ', beetle: '甲虫', dragonfly: 'トンボ', hopper: 'バッタ・カマキリ・セミ', bird: '野鳥', other: 'カエル・トカゲほか' };

const C = (id, ja, kind, months, zone, base, o) => ({ id, ja, kind, months, zone, base, host: [], hostFamily: [], nectar: {}, food: {}, feature: {}, ...o });
const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const CREATURES = [
  // ---- 蝶 ----
  C('ageha', 'ナミアゲハ', 'butterfly', [4, 5, 6, 7, 8, 9, 10], [4, 11], 3, { hostFamily: ['ミカン科'], nectar: { groups: ['buddleja', 'lilium', 'lycoris', 'zinnia', 'cosmos', 'monarda', 'phlox-paniculata', 'abelia', 'verbena', 'agapanthus', 'tithonia'] }, feature: { water: 1 }, note: '赤やピンクの花によく来る。サンショウやルーの葉で幼虫が育つ。' }),
  C('kiageha', 'キアゲハ', 'butterfly', [4, 5, 6, 7, 8, 9, 10], [3, 11], 2, { hostFamily: ['セリ科'], nectar: { groups: ['buddleja', 'zinnia', 'cosmos', 'monarda', 'phlox-paniculata', 'verbena', 'echinacea', 'lilium'] }, note: 'フェンネルやパセリなどセリ科の葉に、しま模様の幼虫がつく。' }),
  C('kuroageha', 'クロアゲハ', 'butterfly', [4, 5, 6, 7, 8, 9], [6, 11], 2, { hostFamily: ['ミカン科'], nectar: { groups: ['lycoris', 'lilium', 'hosta', 'abelia', 'buddleja', 'impatiens-balsamina'] }, feature: { tree: 1, shrub: 1 }, note: '日陰を好み、木陰の花をゆったり飛ぶ。' }),
  C('aosuji', 'アオスジアゲハ', 'butterfly', [5, 6, 7, 8, 9, 10], [7, 11], 2, { host: ['laurus'], nectar: { groups: ['agapanthus', 'abelia', 'buddleja', 'verbena'] }, feature: { water: 1, tree: 1 }, note: 'クスノキの街路樹がある地域に多い。水たまりで吸水する姿も。' }),
  C('monshiro', 'モンシロチョウ', 'butterfly', [3, 4, 5, 6, 7, 8, 9, 10, 11], [3, 11], 3, { hostFamily: ['アブラナ科'], nectar: { groups: ['lavender', 'verbena', 'nepeta', 'erigeron', 'lobularia', 'centaurea-cyanus', 'thymus', 'origanum'], tags: ['pollinator'] }, feature: { lawn: 1 }, note: '春いちばんに現れる。低い位置の小花が好き。' }),
  C('tsumaguro', 'ツマグロヒョウモン', 'butterfly', [4, 5, 6, 7, 8, 9, 10, 11], [8, 11], 3, { host: ['viola'], nectar: { groups: ['zinnia', 'cosmos', 'tagetes', 'verbena', 'buddleja', 'eupatorium', 'echinacea', 'aster', 'chrysanthemum'] }, note: 'パンジーやビオラで黒と赤の幼虫が育つ。暖かい地域で一年を通して多い。' }),
  C('yamatoshijimi', 'ヤマトシジミ', 'butterfly', [4, 5, 6, 7, 8, 9, 10, 11], [6, 11], 3, { nectar: { groups: ['erigeron', 'calamintha', 'thymus', 'origanum', 'lobularia', 'chamaemelum', 'phlox-subulata'] }, feature: { lawn: 2 }, note: '足元を飛ぶ小さな青い蝶。食草のカタバミが生える地面が必要。' }),
  C('benishijimi', 'ベニシジミ', 'butterfly', [3, 4, 5, 6, 7, 8, 9, 10, 11], [3, 10], 2, { host: ['rumex'], nectar: { groups: ['leucanthemum', 'erigeron', 'chamaemelum', 'tanacetum', 'achillea', 'matricaria'] }, feature: { lawn: 1 }, note: 'オレンジ色の小さな蝶。ソレル（スイバ）が食草。' }),
  C('seseri', 'イチモンジセセリ', 'butterfly', [6, 7, 8, 9, 10], [6, 11], 3, { hostFamily: ['イネ科'], nectar: { groups: ['aster', 'zinnia', 'verbena', 'lespedeza', 'agastache', 'salvia-nemorosa', 'eupatorium', 'sedum', 'liatris'], tags: ['pollinator'] }, feature: { grass: 1 }, note: '秋の花に群がる茶色い小さな蝶。グラスの葉で育つ。' }),
  C('himeaka', 'ヒメアカタテハ', 'butterfly', [4, 5, 6, 7, 8, 9, 10, 11], [5, 11], 2, { host: ['artemisia'], nectar: { groups: ['cosmos', 'aster', 'chrysanthemum', 'sedum', 'verbena', 'zinnia', 'echinacea'] }, note: '秋に数がふえる。ヨモギが食草。' }),
  C('ruritateha', 'ルリタテハ', 'butterfly', [3, 4, 5, 6, 7, 8, 9, 10, 11], [4, 11], 1, { host: ['tricyrtis', 'lilium'], feature: { tree: 2 }, note: '瑠璃色の帯が美しい。ホトトギスやユリの葉で幼虫が育つ。花より樹液を好む。' }),
  C('asagimadara', 'アサギマダラ', 'butterfly', [5, 6, 9, 10], [5, 11], 1, { nectar: { groups: ['eupatorium', 'ageratina', 'eutrochium'] }, note: '海を越えて旅をする蝶。秋、フジバカマに立ち寄ることがある。' }),
  C('kichou', 'キタキチョウ', 'butterfly', [3, 4, 5, 6, 7, 8, 9, 10, 11], [6, 11], 2, { host: ['lespedeza'], nectar: { groups: ['aster', 'cosmos', 'lespedeza', 'chrysanthemum', 'verbena', 'tagetes'] }, feature: { shrub: 1 }, note: '黄色い蝶。ハギが食草で、成虫で冬を越す。' }),
  C('uranami', 'ウラナミシジミ', 'butterfly', [8, 9, 10, 11], [8, 11], 2, { host: ['lespedeza'], nectar: { groups: ['lespedeza', 'aster', 'chrysanthemum', 'sedum'] }, note: '秋に北へ広がる。ハギなどマメ科の花に来る。' }),
  // ---- 蛾 ----
  C('houjaku', 'ホシホウジャク', 'moth', [7, 8, 9, 10, 11], [5, 11], 2, { nectar: { groups: ['abelia', 'buddleja', 'zinnia', 'phlox-paniculata', 'verbena', 'impatiens-balsamina', 'salvia-guaranitica', 'nicotiana'] }, note: 'ハチドリのように空中で止まって蜜を吸う。夕方によく見られる。' }),
  C('oosukashiba', 'オオスカシバ', 'moth', [5, 6, 7, 8, 9], [7, 11], 2, { host: ['gardenia'], nectar: { groups: ['abelia', 'buddleja', 'lavender', 'monarda', 'salvia-nemorosa'] }, note: '透明な羽の昼に飛ぶ蛾。クチナシで幼虫が育つ。' }),
  // ---- 蜂・アブ ----
  C('mitsubachi', 'ミツバチ', 'bee', [3, 4, 5, 6, 7, 8, 9, 10, 11], [4, 11], 3, { nectar: { tags: ['pollinator', 'herb'], groups: ['lavender', 'thymus', 'borago', 'phacelia', 'trifolium-incarnatum', 'origanum', 'pycnanthemum', 'sedum', 'cosmos'] }, feature: { water: 1 }, note: 'ハーブや小花の群れに集まる。おとなしく、刺激しなければ刺さない。' }),
  C('maruhana', 'マルハナバチ', 'bee', [4, 5, 6, 7, 8, 9, 10], [3, 10], 2, { nectar: { groups: ['digitalis', 'salvia-nemorosa', 'lamium', 'aquilegia', 'penstemon', 'lupinus', 'symphytum', 'monarda', 'agastache', 'lavender', 'campanula', 'trifolium', 'stachys'], forms: ['spike'] }, feature: { habitat: 1 }, note: 'ずんぐりした毛深い蜂。筒形や釣鐘形の花にもぐりこむ。' }),
  C('kumabachi', 'クマバチ', 'bee', [4, 5, 6, 7, 8, 9, 10], [6, 11], 2, { nectar: { groups: ['lespedeza', 'baptisia', 'vitex', 'abelia', 'lavender', 'salvia-guaranitica', 'lupinus'] }, feature: { structure: 1 }, note: '大きな羽音だが、おとなしい。マメ科の花が好き。' }),
  C('hakiribachi', 'ハキリバチ', 'bee', [6, 7, 8, 9], [5, 11], 1, { host: ['rosa-rugosa', 'rosa-gallica'], nectar: { groups: ['lespedeza', 'vitex', 'lavender', 'agastache'] }, feature: { habitat: 2 }, note: 'バラの葉を丸く切り取って巣の材料にする。竹筒や枯れ枝に巣を作る。' }),
  C('hanaabu', 'ハナアブ', 'bee', [3, 4, 5, 6, 7, 8, 9, 10, 11], [3, 11], 3, { nectar: { forms: ['plate', 'daisy'], groups: ['achillea', 'fennel', 'orlaya', 'ammi', 'lobularia', 'erigeron', 'leucanthemum', 'anethum', 'coriandrum'] }, note: '平たく開いた花に来る。幼虫はアブラムシを食べてくれる。' }),
  // ---- 甲虫 ----
  C('tentou', 'テントウムシ', 'beetle', [3, 4, 5, 6, 7, 8, 9, 10, 11], [3, 11], 3, { nectar: { forms: ['plate'], groups: ['achillea', 'fennel', 'anethum', 'lupinus', 'rudbeckia', 'helianthus'] }, feature: { compost: 1, winter: 1 }, note: 'アブラムシを食べる頼もしい味方。落ち葉の下で冬を越す。' }),
  C('hanamuguri', 'ハナムグリ', 'beetle', [4, 5, 6, 7, 8, 9, 10], [4, 11], 2, { nectar: { groups: ['leucanthemum', 'achillea', 'spiraea', 'hydrangea-arb', 'hydrangea-paniculata', 'deutzia', 'aruncus', 'rosa-rugosa', 'paeonia', 'sambucus'] }, feature: { compost: 1 }, note: '白い花にもぐって花粉を食べる緑色の甲虫。' }),
  // ---- トンボ ----
  C('shiokara', 'シオカラトンボ', 'dragonfly', [5, 6, 7, 8, 9, 10], [4, 11], 2, { feature: { pond: 3, water: 1, lawn: 1 }, note: '水辺の近くの地面や石にとまる。小さな池でも繁殖する。' }),
  C('akiakane', 'アキアカネ（赤とんぼ）', 'dragonfly', [6, 7, 9, 10, 11], [3, 10], 2, { feature: { lawn: 1, pond: 1, winter: 1, structure: 1 }, note: '秋に山から下りてくる。支柱や枯れ茎の先にとまる。' }),
  C('itotonbo', 'イトトンボ', 'dragonfly', [4, 5, 6, 7, 8, 9, 10], [5, 11], 1, { feature: { pond: 3 }, needs: 'pond', note: '水草のある池にすむ、糸のように細いトンボ。' }),
  // ---- バッタ・カマキリ・セミ ----
  C('shouryou', 'ショウリョウバッタ', 'hopper', [7, 8, 9, 10], [6, 11], 2, { hostFamily: ['イネ科'], feature: { lawn: 2, grass: 1 }, note: '芝生や草地を歩くと飛び出す大きなバッタ。' }),
  C('koorogi', 'エンマコオロギ', 'hopper', [8, 9, 10, 11], [4, 11], 2, { feature: { compost: 1, habitat: 1, lawn: 1, grass: 1 }, note: '秋の夜に「コロコロリー」と鳴く。落ち葉や石の下にすむ。' }),
  C('kanetataki', 'カネタタキ', 'hopper', [8, 9, 10, 11], [7, 11], 2, { feature: { shrub: 2, tree: 1 }, note: '低木の中から「チン、チン」と小さな鉦の音。' }),
  C('kamakiri', 'カマキリ', 'hopper', [6, 7, 8, 9, 10, 11], [5, 11], 2, { feature: { grass: 1, shrub: 1, winter: 2 }, note: '花に来る虫を待ち伏せる。冬の枯れ茎に卵を産むので、刈らずに残すと翌年も会える。' }),
  C('semi', 'セミ', 'hopper', [7, 8, 9], [5, 11], 3, { feature: { tree: 3 }, needs: 'tree', note: '木があれば幹に抜け殻が見つかる。' }),
  // ---- 野鳥 ----
  C('suzume', 'スズメ', 'bird', ALL, [3, 11], 3, { hostFamily: [], food: { uses: ['bird'], forms: ['grass'] }, feature: { water: 2, shrub: 1, lawn: 1 }, note: 'グラスや花の種を食べに来る。水浴びや砂浴びも見られる。' }),
  C('mejiro', 'メジロ', 'bird', ALL, [6, 11], 3, { nectar: { groups: ['aloe', 'camellia-sinensis'] }, food: { groups: ['callicarpa', 'lycium', 'sambucus'] }, feature: { tree: 2, shrub: 1, water: 2 }, note: '冬から春に花の蜜を吸いに来る。冬はミカンを半分に切って置くと来てくれる。' }),
  C('hiyodori', 'ヒヨドリ', 'bird', ALL, [5, 11], 3, { food: { groups: ['callicarpa', 'rohdea', 'sambucus', 'lycium', 'rosa-rugosa'] }, feature: { tree: 2, water: 1 }, note: '実のなる木が大好き。にぎやかな声で鳴く。' }),
  C('shijuukara', 'シジュウカラ', 'bird', ALL, [3, 11], 3, { food: { groups: ['helianthus-annuus'] }, feature: { tree: 2, shrub: 1, water: 2, habitat: 1 }, note: 'ツピのモデル。「ツツピー」と鳴き、木や低木で虫を探す。巣箱を使うことも。' }),
  C('joubitaki', 'ジョウビタキ', 'bird', [10, 11, 12, 1, 2, 3], [5, 11], 2, { food: { groups: ['callicarpa'] }, feature: { lawn: 1, shrub: 1, water: 1, structure: 1 }, note: '冬に渡ってくるオレンジ色の小鳥。庭仕事をしていると近くに来る。' }),
  C('tsugumi', 'ツグミ', 'bird', [11, 12, 1, 2, 3, 4], [4, 11], 2, { food: { groups: ['callicarpa'] }, feature: { lawn: 2, compost: 1 }, note: '冬の芝生をホッピングしながらミミズを探す。' }),
  C('kawarahiwa', 'カワラヒワ', 'bird', ALL, [3, 11], 2, { food: { groups: ['helianthus-annuus', 'cosmos', 'echinacea', 'rudbeckia', 'zinnia', 'centaurea-cyanus'], uses: ['bird'] }, feature: { tree: 1, water: 1 }, note: 'ヒマワリやコスモスの種が大好き。飛ぶと羽の黄色が目立つ。' }),
  C('kijibato', 'キジバト', 'bird', ALL, [3, 11], 3, { food: { forms: ['grass'] }, feature: { lawn: 1, tree: 1, water: 1 }, note: '「デデッポッポー」と鳴く。地面で種を拾う。' }),
  C('uguisu', 'ウグイス', 'bird', ALL, [4, 11], 1, { feature: { shrub: 3 }, needs: 'shrub', note: '茂った低木の中を動き回る。姿は見えにくいが声でわかる。' }),
  C('sekirei', 'ハクセキレイ', 'bird', ALL, [3, 11], 2, { feature: { lawn: 2, water: 1, structure: 1 }, note: '尾を上下に振りながら、ひらけた地面を歩く。' }),
  C('mukudori', 'ムクドリ', 'bird', ALL, [4, 11], 2, { food: { groups: ['callicarpa', 'sambucus'] }, feature: { lawn: 2 }, note: '芝生に群れで降りて虫を探す。' }),
  C('enaga', 'エナガ', 'bird', [10, 11, 12, 1, 2, 3], [4, 10], 1, { feature: { tree: 3 }, needs: 'tree', note: '冬、シジュウカラと一緒に群れで木を渡り歩く。' }),
  // ---- カエル・トカゲほか ----
  C('amagaeru', 'アマガエル', 'other', [4, 5, 6, 7, 8, 9, 10], [3, 11], 2, { nectar: { groups: ['hosta', 'tsuwabuki', 'petasites', 'hydrangea-serrata', 'hydrangea-arb'] }, feature: { pond: 2, water: 1, shrub: 1 }, note: '大きな葉の上で休む。雨の前に鳴く。' }),
  C('kanahebi', 'カナヘビ', 'other', [4, 5, 6, 7, 8, 9, 10], [3, 10], 2, { feature: { habitat: 2, grass: 1, lawn: 1, shrub: 1 }, note: '日なたの石や草の上でひなたぼっこ。小さな虫を食べる。' }),
  C('tokage', 'ニホントカゲ', 'other', [4, 5, 6, 7, 8, 9, 10], [4, 10], 1, { feature: { habitat: 3 }, needs: 'habitat', note: '石積みのすき間にすむ。子どもは尾が青い。' }),
  C('yamori', 'ヤモリ', 'other', [5, 6, 7, 8, 9, 10], [7, 11], 2, { feature: { structure: 2 }, note: '夜、灯りに集まる虫を食べる「家守」。' }),
  C('koumori', 'アブラコウモリ', 'other', [4, 5, 6, 7, 8, 9, 10], [5, 11], 2, { feature: { water: 1, lawn: 1 }, note: '夕暮れに庭の上を飛び、蚊などを食べる。' }),
  C('mimizu', 'ミミズ', 'other', ALL, [3, 11], 3, { feature: { compost: 3, lawn: 1 }, note: '落ち葉を食べて土を耕す。豊かな土のしるし。' }),
  C('jorougumo', 'ジョロウグモ', 'other', [9, 10, 11], [5, 11], 2, { feature: { shrub: 2, tree: 1, structure: 1 }, note: '秋に大きな金色の網を張る。害虫を捕ってくれる。' }),
  C('dangomushi', 'ダンゴムシ', 'other', [3, 4, 5, 6, 7, 8, 9, 10, 11], [3, 11], 3, { feature: { compost: 3, habitat: 1 }, note: '落ち葉を食べて細かくし、土に還す分解者。' }),
  C('ashinaga', 'アシナガバチ', 'bee', [4, 5, 6, 7, 8, 9, 10], [4, 11], 2, { nectar: { groups: ['fennel', 'anethum', 'achillea', 'ammi'] }, feature: { structure: 1, shrub: 1 }, note: 'イモムシを狩って幼虫に与える庭の用心棒。巣には近づかないこと。' }),
  C('tsubame', 'ツバメ', 'bird', [3, 4, 5, 6, 7, 8, 9], [5, 11], 2, { feature: { structure: 2, lawn: 1, pond: 1 }, note: '春に南から渡ってきて、軒下に泥の巣を作る。飛びながら虫を捕る。' }),
  C('katatsumuri', 'カタツムリ', 'other', [5, 6, 7, 8, 9, 10], [4, 11], 2, { nectar: { groups: ['hydrangea-serrata', 'hydrangea-arb', 'hydrangea-quercifolia', 'hydrangea-paniculata'] }, feature: { shrub: 1, habitat: 1 }, note: '梅雨のアジサイの葉の上に。' }),
];

const WAYS = { host: '幼虫の食草', nectar: '蜜・花粉', food: '実・種', rest: 'すみか' };

/** 植物と生き物の関係（なければ null）。戻り値: 'host' | 'nectar' | 'food' | 'rest' */
export function relation(c, p) {
  if (c.host.includes(p.group) || c.hostFamily.includes(p.family?.ja)) return 'host';
  const n = c.nectar;
  if (n.groups?.includes(p.group)) return c.kind === 'other' ? 'rest' : 'nectar';
  if (c.food.groups?.includes(p.group)) return 'food';
  if (c.food.uses?.some((u) => p.uses?.includes(u))) return 'food';
  if (c.food.forms?.includes(p.form) && p.bloom.length) return 'food';
  if (p.bloom.length && (n.tags?.some((t) => p.tags.includes(t)) && (!n.forms || n.forms.includes(p.form) || n.tags.includes('pollinator')))) return 'nectar';
  if (p.bloom.length && n.forms?.includes(p.form) && p.tags.includes('pollinator')) return 'nectar';
  return null;
}

const inZone = (c, climate) => !climate || (climate.zone.value >= c.zone[0] && climate.zone.value <= c.zone[1] + 0.5);

/** この植物に来る生き物（図鑑用） */
export function creaturesForPlant(p, climate) {
  return CREATURES.filter((c) => inZone(c, climate))
    .map((c) => ({ c, way: relation(c, p) }))
    .filter((x) => x.way)
    .sort((a, b) => (a.way === 'host' ? -1 : 0) - (b.way === 'host' ? -1 : 0) || b.c.base - a.c.base)
    .map((x) => ({ creature: x.c, way: x.way, wayJa: WAYS[x.way] }));
}

/** 地域で見られる可能性のある生き物（月を指定するとその季節のもの） */
export function creaturesForRegion(climate, month = null) {
  return CREATURES.filter((c) => inZone(c, climate) && (month == null || c.months.includes(month)));
}

/** 植物から読み取れる庭の環境 */
export function featuresFromPlants(plants) {
  const f = {};
  if (plants.some((p) => p.type === 'shrub' && p.h[1] >= 250)) f.tree = true;
  if (plants.some((p) => p.type === 'shrub' || (p.type === 'subshrub' && p.h[1] >= 60))) f.shrub = true;
  if (plants.some((p) => p.form === 'grass' && p.h[1] >= 40)) f.grass = true;
  // 「冬も刈らずに残す」は管理のしかたなので、植物からは決めない（庭の設定で選んだときだけ）
  return f;
}

/**
 * この庭に来そうな生き物
 * @param features { water:true, pond:true, ... }（庭の環境）
 * 戻り値: [{ creature, score, level(3=来そう 2=来るかも 1=条件がそろえば), why:[理由] }]
 */
export function creaturesForGarden(plants, features = {}, climate = null) {
  const fromPlants = featuresFromPlants(plants);
  const feat = { ...fromPlants, ...features };
  if (feat.pond) feat.water = true;
  const out = [];
  for (const c of CREATURES) {
    if (!inZone(c, climate)) continue;
    let score = 0;
    const why = [];
    const byWay = { host: [], nectar: [], food: [], rest: [] };
    for (const p of plants) { const w = relation(c, p); if (w) byWay[w].push(p); }
    const names = (arr) => [...new Set(arr.map((p) => p.groupJa.replace(/（.*?）/g, '')))].slice(0, 3).join('・');
    if (byWay.host.length) { score += 2.5; why.push(`食草：${names(byWay.host)}`); }
    if (byWay.nectar.length) { score += Math.min(2.5, 1 + byWay.nectar.length * 0.5); why.push(`蜜：${names(byWay.nectar)}`); }
    if (byWay.food.length) { score += Math.min(2, 1 + byWay.food.length * 0.4); why.push(`実・種：${names(byWay.food)}`); }
    if (byWay.rest.length) { score += 1; why.push(`すみか：${names(byWay.rest)}`); }
    for (const [k, w] of Object.entries(c.feature)) if (feat[k]) { score += w * 0.8; why.push(FEATURES[k].replace(/（.*?）/g, '')); }
    if (c.needs && !feat[c.needs]) score = Math.min(score, 0.9);
    if (!score) continue;
    score += (c.base - 2) * 0.6;
    const level = score >= 3.2 ? 3 : score >= 1.6 ? 2 : 1;
    out.push({ creature: c, score, level, why: why.slice(0, 3) });
  }
  return out.sort((a, b) => b.score - a.score);
}
export const LEVEL_JA = { 3: '来そう', 2: '来るかも', 1: '条件がそろえば' };

/**
 * 生物多様性度（0〜100の目安）と内訳、改善のヒント
 */
export function biodiversity(plants, features = {}, climate = null) {
  const feat = { ...featuresFromPlants(plants), ...features };
  if (feat.pond) feat.water = true;
  const south = !!climate?.south;
  const shift = (m) => (south ? ((m + 5) % 12) + 1 : m);
  // 1. 蜜源のリレー（3〜11月のうち、虫の来る花が咲いている月）
  const nectarPlants = plants.filter((p) => p.tags.includes('pollinator') || CREATURES.some((c) => ['butterfly', 'bee', 'moth'].includes(c.kind) && relation(c, p) === 'nectar'));
  const months = new Set(nectarPlants.flatMap((p) => p.bloom.map(shift)));
  const season = [3, 4, 5, 6, 7, 8, 9, 10, 11].map(shift);
  const relay = season.filter((m) => months.has(m)).length;
  // 2. 植物の多様さ
  const families = new Set(plants.map((p) => p.family?.ja)).size;
  // 3. 高さ・姿の層
  const layers = [plants.some((p) => p.h[1] <= 30), plants.some((p) => p.h[1] > 30 && p.h[1] < 100), plants.some((p) => p.h[1] >= 100 && p.type !== 'shrub'), !!feat.grass, !!feat.shrub || !!feat.tree].filter(Boolean).length;
  // 4. 在来種
  const native = plants.length ? plants.filter((p) => p.tags.includes('native')).length / plants.length : 0;
  // 5. 食べもの（食草・実・種）
  const hostFor = new Set(CREATURES.filter((c) => inZone(c, climate) && plants.some((p) => relation(c, p) === 'host')).map((c) => c.id)).size;
  const foodPlants = plants.filter((p) => CREATURES.some((c) => c.kind === 'bird' && relation(c, p) === 'food')).length;
  // 6. すみか
  const habitat = (feat.water ? 6 : 0) + (feat.pond ? 3 : 0) + (feat.compost ? 3 : 0) + (feat.habitat ? 3 : 0) + (feat.winter ? 2 : 0) + (feat.tree ? 2 : 0);

  const parts = [
    { key: 'relay', ja: '蜜源のリレー', max: 20, score: Math.round((relay / 9) * 20), detail: `虫の来る花が咲くのは 9か月中 ${relay}か月` },
    { key: 'variety', ja: '植物の多様さ', max: 15, score: Math.round((Math.min(families, 10) / 10) * 15), detail: `${families}つの科` },
    { key: 'layers', ja: '高さと姿の層', max: 15, score: Math.round((layers / 5) * 15), detail: `地面〜低木まで 5層中 ${layers}層` },
    { key: 'native', ja: '在来種', max: 15, score: Math.round(Math.min(1, native / 0.4) * 15), detail: `在来種は ${Math.round(native * 100)}%` },
    { key: 'food', ja: '食べもの', max: 20, score: Math.round((Math.min(hostFor, 4) / 4) * 10 + (Math.min(foodPlants, 3) / 3) * 10), detail: `幼虫が育つ蝶など ${hostFor}種、鳥の実・種 ${foodPlants}種` },
    { key: 'habitat', ja: 'すみか', max: 15, score: Math.min(15, habitat), detail: Object.keys(FEATURES).filter((k) => feat[k]).map((k) => FEATURES[k].replace(/（.*?）/g, '') + (features[k] ? '' : '（植えた植物から）')).join('・') || 'まだありません' },
  ];
  const total = plants.length ? parts.reduce((t, x) => t + x.score, 0) : 0;
  const tips = [];
  if (!feat.water) tips.push('バードバスや水鉢を置くと、野鳥・蜂・蝶が水を飲みに来ます（すみか +6）。');
  if (relay < 8) tips.push(`${season.filter((m) => !months.has(m)).slice(0, 3).map((m) => m + '月').join('・')}に咲く、虫の来る花を足しましょう。`);
  if (hostFor < 3) tips.push('蝶の幼虫が育つ植物（フェンネル、ビオラ、ホトトギス、サンショウ、ハギなど）を加えると、蝶が庭で世代をつなぎます。');
  if (foodPlants < 2) tips.push('種や実を残す植物（エキナセア、ヒマワリ、グラス、コムラサキなど）で、秋冬に野鳥が来ます。');
  if (native < 0.25) tips.push('日本の在来種（フジバカマ、オミナエシ、ノコンギク、ワレモコウなど）をふやすと、地域の虫が利用しやすくなります。');
  if (layers < 4) tips.push('グラスや低木を加えて高さの違いを作ると、隠れ場所がふえます。');
  if (!feat.compost) tips.push('落ち葉を集めておく場所を作ると、土の生き物やテントウムシの越冬場所になります。');
  if (!feat.winter) tips.push('枯れた茎を冬の間残すと、カマキリの卵や虫の越冬場所、野鳥のえさ場になります。');
  const label = total >= 80 ? 'とても豊か' : total >= 60 ? '豊か' : total >= 40 ? 'これから育つ' : 'はじめの一歩';
  return { total, label, parts, tips: tips.slice(0, 4), expected: creaturesForGarden(plants, features, climate).filter((x) => x.level >= 2).length };
}

/** 生き物の目標（蝶・蜂・野鳥・水辺）に対する、植物の貢献度（プラン生成用） */
export const WILD_GOALS = { butterfly: '蝶', bee: '蜂・アブ', bird: '野鳥', water: 'トンボ・カエル（水辺）' };
export function wildScore(p, goals, climate) {
  if (!goals?.length) return 0;
  let s = 0;
  for (const c of CREATURES) {
    if (!inZone(c, climate)) continue;
    const kind = c.kind === 'moth' ? 'butterfly' : c.kind === 'dragonfly' || c.kind === 'other' ? 'water' : c.kind;
    if (!goals.includes(kind)) continue;
    const w = relation(c, p);
    if (w === 'host') s += 1.2; else if (w) s += 0.5;
  }
  return Math.min(4, s);
}
