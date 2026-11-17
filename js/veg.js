// 野菜（品種ではなく種類ごと）。ポタジェ（菜園花壇）・キッチンガーデン用。
// 一年で収穫する野菜は type: 'annual'（sow: 'warm' 夏野菜 / 'cool' 秋〜春の野菜）、何年も収穫できる野菜は type: 'herb'（宿根草）。
// bloom は花の咲く月（収穫を優先すると咲かない葉物は空）、harvest は収穫の目安の月（北半球・一般地）。
// price は苗1株（種から育てるものは1株あたりの種代の目安）。※ 解説文はすべてオリジナル。

const V = (id, ja, latin, sow, o) => ({ id, ja, latin, wiki: o.wiki ?? latin.replace(/ (var|subsp)\..*$/, '').replace(/ '.*$/, ''), type: 'annual', sow, zone: [2, 11], heat: 12, humid: 2, sun: ['full'], moist: ['mid'], spread: 40, leaf: 'green', form: 'mound', color: ['green'], tags: ['veg'], cut: 'none', div: 'none', ...o, tags: ['veg', ...(o.tags || [])] });
const VP = (id, ja, latin, o) => ({ id, ja, latin, wiki: o.wiki ?? latin.replace(/ (var|subsp)\..*$/, ''), type: 'herb', humid: 2, sun: ['full'], moist: ['mid'], leaf: 'green', cut: 'after', div: 'spring', ...o, tags: ['veg', ...(o.tags || [])] });

export const VEG_BASE = [
  // ---- 夏野菜（暖かくなってから植える） ----
  V('tomato', 'トマト', 'Solanum lycopersicum', 'warm', { h: [100, 180], spread: 50, bloom: [6, 7, 8], harvest: [7, 8, 9], color: ['yellow'], form: 'spike', price: 250, note: '支柱に誘引して育てる夏野菜の主役。雨よけをすると実割れが減る。わき芽はこまめに摘む。' }),
  V('mini-tomato', 'ミニトマト', "Solanum lycopersicum var. cerasiforme", 'warm', { h: [100, 200], spread: 50, bloom: [6, 7, 8, 9], harvest: [7, 8, 9, 10], color: ['yellow'], form: 'spike', tags: ['easy'], price: 200, note: '大玉より育てやすく、たくさん実る。赤・黄・オレンジの実を混ぜると彩りのよい菜園に。' }),
  V('eggplant', 'ナス', 'Solanum melongena', 'warm', { h: [60, 100], spread: 60, bloom: [6, 7, 8, 9], harvest: [7, 8, 9, 10], color: ['purple'], form: 'mound', price: 200, note: '「水で育つ」といわれるほど水と肥料を好む。7月末に切り戻すと秋ナスが楽しめる。' }),
  V('pepper', 'ピーマン・シシトウ', 'Capsicum annuum', 'warm', { h: [50, 80], spread: 45, bloom: [6, 7, 8, 9], harvest: [7, 8, 9, 10], color: ['white'], form: 'mound', tags: ['easy'], price: 150, note: '暑さに強く、秋まで長く収穫できる。株が疲れないよう、若どりを心がける。' }),
  V('cucumber', 'キュウリ', 'Cucumis sativus', 'warm', { h: [150, 200], spread: 50, bloom: [6, 7, 8], harvest: [6, 7, 8], color: ['yellow'], form: 'spike', price: 150, note: 'ネットや支柱をよじ登る。とり遅れると株が弱るので、毎朝の収穫を習慣に。' }),
  V('zucchini', 'ズッキーニ', 'Cucurbita pepo', 'warm', { h: [50, 80], spread: 90, bloom: [6, 7, 8], harvest: [6, 7, 8], color: ['yellow'], form: 'mound', price: 250, note: '大きな葉と黄色い花が見ごたえ十分。花も詰め物をして揚げると美味。' }),
  V('okra', 'オクラ', 'Abelmoschus esculentus', 'warm', { h: [100, 150], spread: 40, bloom: [7, 8, 9], harvest: [7, 8, 9], color: ['yellow'], form: 'spike', tags: ['easy'], price: 150, note: 'フヨウに似たクリーム色の花は一日でしぼむ。花のあと数日で実をとる。' }),
  V('green-bean', 'インゲン', 'Phaseolus vulgaris', 'warm', { h: [50, 180], spread: 30, bloom: [6, 7, 8], harvest: [6, 7, 8, 9], color: ['white', 'pink'], form: 'spike', tags: ['easy'], price: 50, note: 'つるあり種は支柱やオベリスクに絡ませると、菜園の立体的なアクセントに。マメ科なので土を肥やす。' }),
  V('edamame', 'エダマメ', 'Glycine max', 'warm', { h: [40, 70], spread: 30, bloom: [6, 7], harvest: [7, 8], color: ['purple', 'white'], form: 'mound', price: 40, note: '花が咲く頃に水切れすると実が入らない。とれたてをすぐゆでるのが家庭菜園の特権。' }),
  V('corn', 'トウモロコシ', 'Zea mays', 'warm', { h: [150, 200], spread: 35, bloom: [7], harvest: [7, 8], color: ['yellow'], form: 'grass', price: 60, note: '風で受粉するので、1列ではなく四角く固めて植える。グラスのような草姿。' }),
  V('sweet-potato', 'サツマイモ', 'Ipomoea batatas', 'warm', { h: [30, 50], spread: 70, bloom: [], harvest: [9, 10, 11], form: 'mound', moist: ['dry', 'mid'], tags: ['easy'], price: 60, note: 'やせた土でも育ち、肥料が多いとつるばかり茂る。秋の焼き芋は庭の焚き火で。' }),
  V('ginger', 'ショウガ', 'Zingiber officinale', 'warm', { sun: ['part', 'full'], moist: ['mid', 'wet'], h: [40, 60], spread: 30, bloom: [], harvest: [8, 9, 10], form: 'grass', price: 100, note: '半日陰と湿り気を好む。夏の葉ショウガ、秋の根ショウガと2回楽しめる。' }),
  // ---- 涼しい季節の野菜（春・秋） ----
  V('lettuce', 'レタス・リーフレタス', 'Lactuca sativa', 'cool', { sun: ['full', 'part'], h: [15, 30], spread: 25, bloom: [], harvest: [4, 5, 6, 10, 11], form: 'mound', tags: ['easy'], price: 80, note: '赤や緑の葉を交互に植えると花壇の縁取りに。外葉からかき取れば長く収穫できる。' }),
  V('arugula', 'ルッコラ', 'Eruca vesicaria', 'cool', { sun: ['full', 'part'], h: [20, 40], spread: 20, bloom: [4, 5], harvest: [4, 5, 10, 11], color: ['white'], form: 'mound', tags: ['easy', 'herb'], price: 30, note: 'ゴマのような香りの葉。種まきから1か月で収穫でき、白い花も食べられる。' }),
  V('spinach', 'ホウレンソウ', 'Spinacia oleracea', 'cool', { h: [20, 30], spread: 15, bloom: [], harvest: [11, 12, 1, 2, 3], form: 'mound', price: 20, note: '寒さに当たると甘みが増す。酸性の土を嫌うので、苦土石灰で調整を。' }),
  V('komatsuna', 'コマツナ', 'Brassica rapa var. perviridis', 'cool', { sun: ['full', 'part'], h: [20, 30], spread: 15, bloom: [], harvest: [4, 5, 10, 11, 12], form: 'mound', tags: ['easy'], price: 20, note: 'ほぼ一年中まけて、1か月ほどで収穫。初心者の最初の一歩に。' }),
  V('radish', 'ラディッシュ（ハツカダイコン）', 'Raphanus sativus var. sativus', 'cool', { sun: ['full', 'part'], h: [10, 20], spread: 10, bloom: [], harvest: [4, 5, 10, 11], form: 'mound', tags: ['easy'], price: 10, note: '種まきから約1か月。赤い根が土から顔を出す様子は子どもにも人気。' }),
  V('turnip', 'カブ', 'Brassica rapa var. rapa', 'cool', { h: [20, 30], spread: 15, bloom: [], harvest: [5, 6, 11, 12], form: 'mound', price: 20, note: '小カブなら狭い区画でも育つ。葉もおいしい。' }),
  V('carrot', 'ニンジン', 'Daucus carota subsp. sativus', 'cool', { h: [30, 50], spread: 10, bloom: [], harvest: [6, 7, 11, 12], form: 'airy', price: 15, note: '細かな葉が軽やかで、花壇の中でもきれい。キアゲハの幼虫がつくことも。' }),
  V('chard', 'スイスチャード（フダンソウ）', 'Beta vulgaris subsp. vulgaris', 'cool', { sun: ['full', 'part'], h: [30, 50], spread: 30, bloom: [], harvest: [5, 6, 7, 8, 9, 10, 11], color: ['red', 'yellow'], leaf: 'bronze', form: 'mound', tags: ['easy'], price: 100, note: '赤・黄・ピンクの茎が美しく、カラーリーフとしても一流。暑さにも寒さにも強い。' }),
  V('kale', 'ケール', 'Brassica oleracea var. sabellica', 'cool', { h: [50, 100], spread: 50, bloom: [], harvest: [10, 11, 12, 1, 2, 3], leaf: 'blue', form: 'mound', price: 150, note: '縮れた青緑の葉は冬の菜園の彫刻のよう。下葉から少しずつかき取る。' }),
  V('broccoli', 'ブロッコリー', 'Brassica oleracea var. italica', 'cool', { h: [50, 80], spread: 50, bloom: [], harvest: [11, 12, 1, 2], leaf: 'blue', form: 'mound', price: 100, note: '頂花蕾をとったあと、わき芽の小さな蕾も長く収穫できる。' }),
  V('snap-pea', 'エンドウ（スナップエンドウ）', 'Pisum sativum', 'cool', { h: [100, 180], spread: 25, bloom: [4, 5], harvest: [5, 6], color: ['white', 'purple'], form: 'spike', price: 30, note: '秋にまいて冬を越し、春に花と実。紫花のさやエンドウは観賞価値も高い。' }),
  V('broad-bean', 'ソラマメ', 'Vicia faba', 'cool', { h: [60, 100], spread: 40, bloom: [3, 4], harvest: [5, 6], color: ['white'], form: 'spike', price: 60, note: '白に黒い斑の花が愛らしい。アブラムシがつきやすいので、先端を摘むと防げる。' }),
  V('onion', 'タマネギ', 'Allium cepa', 'cool', { h: [40, 60], spread: 12, bloom: [], harvest: [5, 6], form: 'grass', price: 15, note: '秋に苗を植えて冬越し。葉が倒れたら収穫どき。吊るして保存。' }),
  V('garlic', 'ニンニク', 'Allium sativum', 'cool', { h: [50, 80], spread: 15, bloom: [], harvest: [5, 6], form: 'grass', tags: ['easy'], price: 50, note: '秋に1片ずつ植える。バラの近くに植えるとよいとする言い伝えもある。' }),
  V('potato', 'ジャガイモ', 'Solanum tuberosum', 'cool', { h: [50, 80], spread: 35, bloom: [5, 6], harvest: [6, 7], color: ['white', 'purple'], form: 'mound', price: 80, note: '春に種イモを植え、梅雨入り前に掘る。白や紫の花も可憐。' }),
  // ---- 何年も収穫できる野菜（宿根） ----
  VP('asparagus', 'アスパラガス', 'Asparagus officinalis', { zone: [3, 9], heat: 9, h: [100, 150], spread: 50, bloom: [5, 6], harvest: [4, 5, 6], color: ['green'], form: 'airy', price: 400, note: '植えて3年目から春に収穫。夏以降の霞のような茂みはグラスのように美しい。' }),
  VP('rhubarb', 'ルバーブ', 'Rheum rhabarbarum', { zone: [3, 8], heat: 6, humid: 1, h: [60, 100], spread: 90, bloom: [5, 6], harvest: [5, 6, 7, 9], color: ['white'], form: 'mound', price: 600, note: '赤い葉柄はジャムに。葉は食べられない。暑さと蒸れが苦手で、冷涼地向き。' }),
  VP('artichoke', 'アーティチョーク', 'Cynara cardunculus var. scolymus', { zone: [7, 10], heat: 9, moist: ['dry', 'mid'], h: [120, 180], spread: 90, bloom: [6, 7], harvest: [5, 6], color: ['purple'], leaf: 'silver', form: 'globe', tags: ['pollinator'], price: 600, note: '銀色の大きな葉と、アザミのような紫の花。食べるのは開く前の蕾。花壇の主役級。' }),
  VP('strawberry', 'イチゴ', 'Fragaria × ananassa', { zone: [4, 10], heat: 8, sun: ['full', 'part'], h: [15, 25], spread: 30, bloom: [3, 4, 5], harvest: [5, 6], color: ['white'], form: 'mound', tags: ['easy'], price: 300, note: '縁取りにすると、春は白い花、初夏は赤い実が並ぶ。ランナーで株を更新。' }),
];

/** すでに図鑑にある植物のうち、野菜としても育てるもの（野菜タグを付ける） */
export const VEG_GROUPS_EXTRA = ['zingiber', 'allium-tuberosum', 'chives', 'petasites', 'cryptotaenia', 'fragaria', 'rumex', 'perilla', 'ocimum', 'coriandrum', 'petroselinum'];
/** ポタジェで野菜と一緒に植えるとよい花（コンパニオン・虫を呼ぶ・食べられる花） */
export const POTAGER_FLOWERS = ['tagetes', 'tropaeolum', 'calendula', 'borago', 'cosmos', 'zinnia', 'centaurea-cyanus', 'lobularia', 'helianthus-annuus', 'viola', 'phacelia', 'trifolium-incarnatum', 'chamaemelum', 'matricaria', 'echinacea', 'lavender', 'nepeta', 'achillea'];
