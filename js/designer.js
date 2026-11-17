// ガーデンデザイナーがよく使う植物と品種の追加データ。
// ・自然風植栽（ピート・アウドルフ、レイナー＆ウェストなど）で定番のグラス・セリ科・プレーリーの植物
// ・ガザニアをはじめ南アフリカの乾燥に強い植物、日本の野の花
// ・soc（群れの大きさ）＝植物の「社会性」：1 単独で目立たせる／2 2〜3株／3 3〜5株／4 広い群れ／5 一面に敷きつめる
// ※ 解説文はすべてオリジナル。特定外来生物など栽培が規制されている植物は掲載しない。

const D = (id, ja, latin, type, o) => ({
  id, ja, latin, wiki: o.wiki ?? latin.replace(/ (var|subsp)\..*$/, '').replace(/ '.*$/, ''), type,
  humid: 2, sun: ['full'], moist: ['mid'], leaf: 'green', heat: 9,
  cut: type === 'herb' ? 'after' : type === 'grass' ? 'spring' : 'none', div: type === 'herb' || type === 'grass' ? 'spring' : 'none',
  ...o,
});

export const DESIGNER_BASE = [
  // ---- セリ科・透け感 ----
  D('selinum', 'セリナム・ワリキアナム', 'Selinum wallichianum', 'herb', { zone: [5, 8], heat: 7, humid: 1, sun: ['full', 'part'], h: [90, 130], spread: 60, bloom: [7, 8, 9], color: ['white'], form: 'plate', tags: ['natural', 'english', 'pollinator'], price: 1200, soc: 2, note: 'シダのように細かく切れ込んだ葉と、白いレースのような花房。夏の蒸れに弱いので、涼しい地域や風通しのよい場所で。' }),
  D('pimpinella', "ピンピネラ・メジャー‘ロゼア’", "Pimpinella major 'Rosea'", 'herb', { zone: [4, 8], heat: 7, humid: 1, sun: ['full', 'part'], h: [60, 90], spread: 40, bloom: [6, 7], color: ['pink'], form: 'plate', tags: ['natural', 'english', 'pollinator'], price: 1200, soc: 2, note: '淡いピンクの小さな傘形の花が、細い茎の先にふわりと浮かぶ。グラスの間に散らすと野の雰囲気に。' }),
  D('crambe', 'クランベ・コルディフォリア', 'Crambe cordifolia', 'herb', { zone: [4, 8], heat: 6, humid: 1, h: [150, 200], spread: 120, bloom: [5, 6], color: ['white'], form: 'airy', tags: ['english', 'natural', 'fragrant', 'pollinator'], price: 1500, soc: 1, note: '大きな葉の上に、白い小花が雲のように広がる。甘い香りもある。夏の暑さに弱く、冷涼な地域向き。' }),
  D('cephalaria', 'ケファラリア・ギガンテア', 'Cephalaria gigantea', 'herb', { zone: [3, 8], heat: 7, h: [150, 220], spread: 80, bloom: [6, 7], color: ['yellow'], form: 'airy', tags: ['english', 'natural', 'pollinator'], price: 1000, soc: 1, note: '背丈を超える細い茎の先に、淡いクリーム色の花。向こうが透けて見えるので、花壇の手前寄りに置いても奥を隠さない。' }),
  // ---- プレーリー・北米 ----
  D('silphium', 'シルフィウム・ラシニアツム（コンパスプラント）', 'Silphium laciniatum', 'herb', { zone: [4, 9], humid: 2, moist: ['dry', 'mid'], h: [150, 250], spread: 60, bloom: [7, 8, 9], color: ['yellow'], form: 'daisy', tags: ['prairie', 'natural', 'pollinator', 'dry'], price: 1500, soc: 1, use: ['seed', 'bird', 'winter'], note: '深く切れ込んだ大きな葉が南北を向いて立つことから「コンパスプラント」と呼ばれる。根が深く、乾燥に強いプレーリーの巨人。' }),
  D('zizia', 'ジジア・アウレア', 'Zizia aurea', 'herb', { zone: [3, 8], heat: 8, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [40, 70], spread: 40, bloom: [5, 6], color: ['yellow'], form: 'plate', tags: ['prairie', 'natural', 'pollinator'], price: 900, soc: 3, note: '春に黄色の小さな傘形の花。北米の野の花で、アゲハチョウの仲間の幼虫の食草になる。' }),
  D('dalea', 'ダレア・プルプレア', 'Dalea purpurea', 'herb', { zone: [3, 8], humid: 1, moist: ['dry'], h: [40, 80], spread: 30, bloom: [6, 7, 8], color: ['purple'], form: 'spike', tags: ['prairie', 'natural', 'pollinator', 'dry'], price: 1000, soc: 3, note: '細い茎の先の円筒形の花穂が、下から輪になって咲き上がる。マメ科でやせた土でも育つ。' }),
  D('callirhoe', 'カリロエ・インボルクラタ（ワインカップ）', 'Callirhoe involucrata', 'herb', { zone: [4, 8], humid: 1, moist: ['dry'], h: [15, 30], spread: 60, bloom: [6, 7, 8, 9], color: ['red'], form: 'mound', tags: ['prairie', 'natural', 'pollinator', 'dry'], price: 900, soc: 3, note: '地面を這うように広がり、ワインレッドのカップ形の花を夏じゅう咲かせる。乾いた日向のグラウンドカバーに。' }),
  D('eurybia', 'ユーリビア・ディバリカタ（ホワイトウッドアスター）', 'Eurybia divaricata', 'herb', { zone: [4, 8], heat: 8, sun: ['part', 'shade'], h: [40, 70], spread: 45, bloom: [8, 9, 10], color: ['white'], form: 'airy', tags: ['shade', 'natural', 'pollinator'], price: 800, soc: 4, note: '黒い細い茎に、白い星形の小花がふんわり咲く。木陰の秋を明るくする、日陰の地模様。' }),
  // ---- グラス ----
  D('bouteloua', "ブルーグラマ‘ブロンドアンビション’", "Bouteloua gracilis 'Blonde Ambition'", 'grass', { zone: [4, 9], humid: 1, moist: ['dry'], h: [60, 80], spread: 45, bloom: [7, 8, 9, 10], color: ['yellow'], form: 'grass', tags: ['prairie', 'dry', 'natural'], price: 1000, soc: 4, use: ['dry', 'winter'], note: 'まつ毛のような穂が横向きにぶら下がる、ユニークなグラス。乾燥にとても強く、金色の穂が冬まで残る。' }),
  D('anemanthele', 'アネマンセレ（フェザントグラス）', 'Anemanthele lessoniana', 'grass', { zone: [7, 10], sun: ['full', 'part'], h: [60, 90], spread: 70, bloom: [7, 8], color: ['green'], leaf: 'bronze', form: 'grass', tags: ['natural', 'evergreen'], price: 1000, soc: 3, use: ['winter'], note: '細い葉が弓なりに垂れる常緑のグラス。秋から冬に、葉がオレンジや銅色を帯びる。' }),
  D('luzula', 'ルズラ・ニベア', 'Luzula nivea', 'grass', { zone: [4, 9], heat: 7, sun: ['part', 'shade'], h: [30, 50], spread: 30, bloom: [5, 6], color: ['white'], form: 'grass', tags: ['shade', 'evergreen', 'natural'], price: 800, soc: 4, note: '日陰でも育つ常緑のグラス。白い綿毛のような花穂が、林の縁を明るくする。' }),
  D('chasmanthium', 'チャスマンティウム（ニセコバンソウ）', 'Chasmanthium latifolium', 'grass', { zone: [4, 9], humid: 3, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [60, 100], spread: 45, bloom: [7, 8, 9], color: ['green'], form: 'grass', tags: ['natural', 'shade'], price: 700, soc: 3, use: ['dry', 'winter'], note: '平たい小判形の穂が垂れて、風にさらさら揺れる。半日陰でも育ち、穂はドライフラワーにもなる。' }),
  // ---- ゲラニウム ----
  // ---- ヨーロッパ・西アジア ----
  D('salvia-pratensis', 'サルビア・プラテンシス', 'Salvia pratensis', 'herb', { zone: [3, 8], heat: 8, moist: ['dry', 'mid'], h: [50, 80], spread: 40, bloom: [5, 6, 7], color: ['blue'], form: 'spike', tags: ['natural', 'english', 'pollinator', 'dry'], price: 700, soc: 3, note: 'ヨーロッパの草原に自生する青いセージ。ネモローサより大きな花が、まばらに並ぶ。' }),
  D('teucrium-hircanicum', 'テウクリウム・ヒルカニクム', 'Teucrium hircanicum', 'herb', { zone: [5, 9], heat: 8, moist: ['dry', 'mid'], h: [40, 60], spread: 40, bloom: [6, 7, 8, 9], color: ['purple'], form: 'spike', tags: ['natural', 'pollinator', 'dry'], price: 800, soc: 3, note: '細い赤紫の穂が長く咲き、ミツバチがよく訪れる。乾いた土でも元気。' }),
  D('lysimachia-ephemerum', 'リシマキア・エフェメルム', 'Lysimachia ephemerum', 'herb', { zone: [6, 9], heat: 8, moist: ['mid', 'wet'], h: [60, 90], spread: 40, bloom: [6, 7, 8], color: ['white'], leaf: 'silver', form: 'spike', tags: ['english', 'natural'], price: 900, soc: 3, note: '灰緑色の葉と、白く細長い穂。オカトラノオの仲間だが、地下茎で広がりすぎない。' }),
  D('sisyrinchium-striatum', 'シシリンチウム・ストリアツム', 'Sisyrinchium striatum', 'herb', { zone: [7, 9], heat: 8, moist: ['dry', 'mid'], h: [40, 70], spread: 30, bloom: [5, 6, 7], color: ['yellow'], leaf: 'blue', form: 'spike', tags: ['dry', 'natural', 'english'], price: 700, soc: 2, note: 'アヤメに似た剣形の葉と、クリーム色の花が並ぶ穂。砂利の庭では、こぼれ種で自然にふえる。' }),
  D('cornus-sanguinea', "セイヨウミズキ‘ミッドウィンターファイア’", "Cornus sanguinea 'Midwinter Fire'", 'shrub', { zone: [4, 8], heat: 8, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [100, 150], spread: 100, bloom: [5, 6], color: ['white'], form: 'mound', tags: ['english', 'natural'], price: 2000, cut: 'spring', soc: 2, use: ['winter'], note: '葉が落ちると、枝が根元の黄色から先端の赤へ、炎のように色づく。早春に短く切り戻すと、毎年よく色づく若い枝が出る。' }),
  // ---- ヒマラヤ・東アジア・日本 ----
  D('kalimeris', "カリメリス‘マディバ’", "Kalimeris incisa 'Madiva'", 'herb', { zone: [4, 9], humid: 3, h: [50, 80], spread: 45, bloom: [6, 7, 8, 9, 10], color: ['blue'], form: 'daisy', tags: ['natural', 'easy', 'wa', 'pollinator'], price: 600, soc: 3, note: '淡い藤色の小菊が、初夏から秋まで咲き続ける。暑さにも強い長距離ランナー。' }),
  D('karigane', 'カリガネソウ', 'Caryopteris divaricata', 'herb', { zone: [5, 9], heat: 8, humid: 3, sun: ['part', 'full'], h: [60, 100], spread: 50, bloom: [8, 9], color: ['blue'], form: 'airy', tags: ['wa', 'native', 'natural', 'pollinator', 'shade'], price: 800, soc: 2, note: '雁が飛ぶ姿に見立てた青紫の花。雄しべが弓のように突き出す。葉に強い香りがある。' }),
  D('polystichum', 'イノデ', 'Polystichum polyblepharum', 'fern', { zone: [5, 9], heat: 8, humid: 3, sun: ['part', 'shade'], h: [40, 60], spread: 60, bloom: [], color: ['green'], form: 'fern', tags: ['shade', 'wa', 'evergreen', 'native'], price: 900, cut: 'leaves', soc: 2, note: '光沢のある常緑のシダ。春、毛に包まれた新芽がくるりとほどける姿が美しい。' }),
  // ---- 南アフリカ（乾燥に強い） ----
  D('arctotis', 'アークトチス', 'Arctotis × hybrida', 'herb', { wiki: 'Arctotis', zone: [9, 11], tender: true, humid: 1, moist: ['dry'], h: [30, 50], spread: 40, bloom: [4, 5, 6, 10, 11], color: ['orange', 'pink', 'red', 'white'], leaf: 'silver', form: 'daisy', tags: ['dry', 'balcony'], price: 500, soc: 3, note: '銀色の葉と、つやのある鮮やかな花。ガザニアと同じく日が当たると開く。蒸し暑さに弱いので水はけよく。' }),
  D('bulbine', 'ブルビネ', 'Bulbine frutescens', 'herb', { zone: [9, 11], tender: true, heat: 11, moist: ['dry'], h: [30, 50], spread: 40, bloom: [4, 5, 6, 7, 8, 9, 10], color: ['orange', 'yellow'], form: 'spike', tags: ['dry', 'balcony', 'easy'], price: 600, soc: 3, note: '多肉質の細い葉から、黄色やオレンジの小花の穂を長く咲かせる。乾燥にとても強い。' }),
  D('dietes', 'ディエテス', 'Dietes grandiflora', 'herb', { zone: [8, 11], heat: 10, moist: ['dry', 'mid'], h: [60, 100], spread: 60, bloom: [5, 6, 7, 8], color: ['white'], form: 'spike', tags: ['dry', 'evergreen', 'easy'], price: 900, soc: 2, note: 'アヤメに似た白い花が初夏から次々に咲く、常緑の丈夫な多年草。暖かい地域の乾いた場所に。' }),
];

/** 原産地（グループID → 地域） */
export const DESIGNER_ORIGIN = {
  selinum: ['himalaya'], pimpinella: ['europe'], crambe: ['westasia'], cephalaria: ['westasia'], silphium: ['prairie'], 'rudbeckia-maxima': ['na_east'],
  zizia: ['na_east', 'prairie'], dalea: ['prairie'], callirhoe: ['prairie'], eurybia: ['na_east'], bouteloua: ['prairie', 'na_west'],
  anemanthele: ['aus'], luzula: ['europe'], chasmanthium: ['na_east'], 
  'salvia-pratensis': ['europe'], 'teucrium-hircanicum': ['westasia'], 'lysimachia-ephemerum': ['europe'], 'sisyrinchium-striatum': ['southam'],
  'cornus-sanguinea': ['europe'], kalimeris: ['eastasia'], karigane: ['japan', 'eastasia'], polystichum: ['japan', 'eastasia'],
  arctotis: ['safrica'], bulbine: ['safrica'], dietes: ['safrica'],
};
/** 別名 */
export const DESIGNER_ALIASES = {
  silphium: ['コンパスプラント'], callirhoe: ['ワインカップ', 'ポピーマロウ'], eurybia: ['ホワイトウッドアスター'], anemanthele: ['フェザントグラス'],
  chasmanthium: ['ニセコバンソウ', 'インディアン・ウッド・オーツ'], bouteloua: ['ブルーグラマ'],  kalimeris: ['ユウガギクの仲間'], karigane: ['雁草'], arctotis: ['アフリカンデージー'],
  dietes: ['アフリカンアイリス'], polystichum: ['猪手'],
};
/** 新しい属の科 */
export const DESIGNER_FAMILY = {
  Selinum: { ja: 'セリ科', latin: 'Apiaceae' }, Pimpinella: { ja: 'セリ科', latin: 'Apiaceae' }, Zizia: { ja: 'セリ科', latin: 'Apiaceae' },
  Crambe: { ja: 'アブラナ科', latin: 'Brassicaceae' }, Cephalaria: { ja: 'スイカズラ科', latin: 'Caprifoliaceae' }, Silphium: { ja: 'キク科', latin: 'Asteraceae' },
  Dalea: { ja: 'マメ科', latin: 'Fabaceae' }, Callirhoe: { ja: 'アオイ科', latin: 'Malvaceae' }, Eurybia: { ja: 'キク科', latin: 'Asteraceae' }, Kalimeris: { ja: 'キク科', latin: 'Asteraceae' },
  Bouteloua: { ja: 'イネ科', latin: 'Poaceae' }, Anemanthele: { ja: 'イネ科', latin: 'Poaceae' }, Chasmanthium: { ja: 'イネ科', latin: 'Poaceae' }, Luzula: { ja: 'イグサ科', latin: 'Juncaceae' },
  Teucrium: { ja: 'シソ科', latin: 'Lamiaceae' }, Sisyrinchium: { ja: 'アヤメ科', latin: 'Iridaceae' }, Dietes: { ja: 'アヤメ科', latin: 'Iridaceae' }, Cornus: { ja: 'ミズキ科', latin: 'Cornaceae' },
  Caryopteris: { ja: 'シソ科', latin: 'Lamiaceae' }, Polystichum: { ja: 'オシダ科', latin: 'Dryopteridaceae' }, Arctotis: { ja: 'キク科', latin: 'Asteraceae' }, Bulbine: { ja: 'ツルボラン科', latin: 'Asphodelaceae' },
};

/** 品種（既存の種への追加と、新しい種の品種）。先頭は種そのもの */
export const DESIGNER_CULTIVARS = {
  gazania: { group: 'ガザニア', list: [
    { cv: '標準', en: 'rigens', ja: 'ガザニア' },
    { cv: 'キス・イエロー', en: 'Kiss Yellow', color: ['yellow'], h: [15, 25], price: 300, note: '鮮やかな黄色で、株が低くよくまとまるシリーズ。大きな花がたくさん咲く。' },
    { cv: 'キス・オレンジフレーム', en: 'Kiss Orange Flame', color: ['orange'], h: [15, 25], price: 300, note: 'オレンジの地に濃い色の筋が入る、炎のような花。' },
    { cv: 'キス・ホワイト', en: 'Kiss White', color: ['white'], h: [15, 25], price: 300, note: 'クリームがかった白。銀葉と合わせると涼しげな乾いた庭に。' },
    { cv: 'ニューデイ・ローズストライプ', en: 'New Day Rose Stripe', color: ['pink'], h: [20, 25], price: 350, note: 'ピンクの縞が入るやさしい色合い。真夏の暑さの中でも咲き続ける。' },
    { cv: 'ニューデイ・レッドシェード', en: 'New Day Red Shades', color: ['red'], h: [20, 25], price: 350, note: '深い赤。乾いた日向の縁取りを引き締める。' },
    { cv: 'タレント', en: 'Talent', leaf: 'silver', color: ['yellow', 'orange'], h: [20, 30], price: 350, note: '銀白色の葉がとくに美しく、花のない時期もカラーリーフとして楽しめる。' },
    { cv: 'ビッグキス・ホワイトフレーム', en: 'Big Kiss White Flame', color: ['white', 'red'], h: [20, 30], price: 400, note: '直径10cmを超える大輪。白地に赤い筋が入る。' },
    { cv: 'リネアリス‘コロラドゴールド’', en: 'linearis', ja: "ガザニア・リネアリス‘コロラドゴールド’", latin: "Gazania linearis 'Colorado Gold'", wiki: 'Gazania linearis', zone: [6, 10], color: ['yellow'], price: 600, note: 'ガザニアの中では寒さに強い種。寒冷地や高原の乾いた花壇でも冬を越しやすい。' },
  ] },
  deschampsia: { group: 'デスカンプシア', list: [
    { cv: 'ゴールドタウ', en: 'Goldtau' },
    { cv: 'ピクシーファウンテン', en: 'Pixie Fountain', h: [40, 60], spread: 35, note: '小さくまとまる品種。小さな庭の前景や鉢に。' },
    { cv: 'ブロンズシュライアー', en: 'Bronzeschleier', h: [80, 120], spread: 60, note: 'ブロンズ色を帯びた穂が、ベールのように大きく広がる。' },
  ] },
  sesleria: { group: 'セスレリア', list: [
    { cv: 'オータムナリス', en: 'autumnalis', ja: 'セスレリア・オータムナリス' },
    { cv: 'グリーンリー', en: 'Greenlee', ja: "セスレリア‘グリーンリー’", latin: "Sesleria 'Greenlee'", wiki: 'Sesleria', h: [30, 45], color: ['green'], note: '暑さにも寒さにも強い、低い常緑のグラス。地面を覆うマトリクス植栽の主力。' },
    { cv: 'ヘウフレリアナ', en: 'heufleriana', ja: 'セスレリア・ヘウフレリアナ', latin: 'Sesleria heufleriana', wiki: 'Sesleria heufleriana', h: [30, 50], color: ['green'], sun: ['full', 'part'], bloom: [3, 4], note: '早春に黒っぽい穂を出す。青緑の葉で、半日陰にも向く。' },
  ] },
  sporobolus: { group: 'スポロボルス', list: [
    { cv: 'ヘテロレピス', en: 'heterolepis', ja: 'スポロボルス・ヘテロレピス' },
    { cv: 'タラ', en: 'Tara', h: [50, 70], note: '穂がまっすぐ立ってまとまる、小ぶりの品種。' },
  ] },
  schizachyrium: { group: 'シザキリウム（リトルブルーステム）', list: [
    { cv: 'スコパリウム', en: 'scoparium', ja: 'シザキリウム（リトルブルーステム）' },
    { cv: 'スタンディングオベーション', en: 'Standing Ovation', leaf: 'blue', note: '倒れにくく直立する青緑の葉が、秋に赤やオレンジに染まる。' },
    { cv: 'ブルーヘブン', en: 'Blue Heaven', leaf: 'blue', note: '青い葉が秋に赤紫へと変わり、冬も色が残る。' },
  ] },
  echinops: { list: [
    { cv: 'ヒゴタイ', en: 'setifer', ja: 'ヒゴタイ', latin: 'Echinops setifer', wiki: 'Echinops setifer', zone: [6, 9], h: [60, 100], note: '日本の草原に自生する青い球形の花。野生では数が減っているので、園芸店で育てられた苗を選ぶ。' },
  ] },
  phlomis: { list: [
    { cv: 'トゥベローサ', en: 'tuberosa', ja: 'フロミス・トゥベローサ', latin: 'Phlomis tuberosa', wiki: 'Phlomis tuberosa', color: ['pink'], h: [90, 150], note: '黒っぽい茎に、ピンクの花が段になって咲く。段々の萼は冬まで形が残る。' },
  ] },
  sanguisorba: { list: [
    { cv: 'レッドサンダー', en: 'Red Thunder', h: [60, 90], note: '濃いワインレッドの小さな花穂が、たくさん立ち上がる。' },
  ] },
  astrantia: { list: [
    { cv: 'スターオブビリオン', en: 'Star of Billion', color: ['white'], note: '白い星形の花が次々に咲く。暑さにも比較的強い品種。' },
  ] },
  thalictrum: { list: [
    { cv: 'エリン', en: 'Elin', h: [180, 250], leaf: 'blue', note: '青みの葉と、背丈を超える高さで咲く淡い藤色の花。' },
    { cv: 'デラバイ', en: 'delavayi', ja: 'タリクトルム・デラバイ', latin: 'Thalictrum delavayi', wiki: 'Thalictrum delavayi', h: [100, 150], note: '細い茎に藤色の小花が無数に散る、透け感の代表格。' },
  ] },
  persicaria: { list: [
    { cv: 'ポリモルファ', en: 'polymorpha', ja: 'ペルシカリア・ポリモルファ', latin: 'Persicaria polymorpha', wiki: 'Persicaria polymorpha', color: ['white'], form: 'plate', h: [150, 200], spread: 120, bloom: [6, 7, 8, 9], note: '低木のように大きく育ち、初夏から白いふわふわの花房が長く咲く。花は次第に淡いピンクを帯びる。' },
  ] },
  aster: { list: [
    { cv: 'オクトーバースカイズ', en: 'October Skies', ja: "アスター‘オクトーバースカイズ’", latin: "Symphyotrichum oblongifolium 'October Skies'", color: ['blue'], h: [40, 60], note: '晩秋、青い小花がこんもりと株を覆う。乾燥に強く倒れにくい。' },
  ] },
  carex: { list: [
    { cv: 'ペンシルバニカ', en: 'pensylvanica', ja: 'カレックス・ペンシルバニカ', latin: 'Carex pensylvanica', wiki: 'Carex pensylvanica', h: [15, 25], sun: ['part', 'shade', 'full'], note: '芝生の代わりにもなる、細い葉の低いスゲ。日陰の地面をやわらかく覆う。' },
  ] },
  'iris-sanguinea': { list: [
    { cv: 'バターアンドシュガー', en: 'Butter and Sugar', ja: "シベリアアヤメ‘バターアンドシュガー’", latin: "Iris sibirica 'Butter and Sugar'", wiki: 'Iris sibirica', color: ['yellow', 'white'], zone: [3, 9], h: [60, 80], note: '白と淡い黄色の二色咲き。明るい色で、青い花の多い初夏の花壇を軽やかにする。' },
  ] },
  'geranium-rozanne': { list: [
    { cv: 'マクロリズム‘ホワイトネス’', en: 'White-Ness', ja: "ゲラニウム・マクロリズム‘ホワイトネス’", latin: "Geranium macrorrhizum 'White-Ness'", wiki: 'Geranium macrorrhizum', color: ['white'], h: [25, 40], spread: 50, sun: ['part', 'full', 'shade'], moist: ['dry', 'mid'], bloom: [5, 6], tags: ['shade', 'natural', 'fragrant', 'easy'], soc: 5, note: '香りのある葉で地面を覆う、白花のグラウンドカバー。乾いた日陰にも強い。' },
    { cv: 'ファエウム‘アルブム’', en: 'phaeum Album', ja: "ゲラニウム・ファエウム‘アルブム’", latin: "Geranium phaeum 'Album'", wiki: 'Geranium phaeum', color: ['white'], h: [50, 70], spread: 45, sun: ['part', 'shade'], bloom: [5, 6], tags: ['shade', 'natural', 'english'], note: '白い小花がうつむいて咲く。木陰の花壇に浮かび上がるように明るい。' },
    { cv: 'プラテンセ‘ブラックビューティー’', en: 'Black Beauty', ja: "ゲラニウム・プラテンセ‘ブラックビューティー’", latin: "Geranium pratense 'Black Beauty'", wiki: 'Geranium pratense', leaf: 'bronze', color: ['purple'], h: [40, 60], spread: 50, bloom: [6, 7], note: '黒に近い銅葉に、淡い藤色の花。花のない時期もカラーリーフとして映える。' },
  ] },
  'salvia-pratensis': { group: 'サルビア・プラテンシス', list: [
    { cv: '原種', en: 'pratensis', ja: 'サルビア・プラテンシス' },
    { cv: 'スワンレイク', en: 'Swan Lake', color: ['white'], note: '白花の品種。' },
    { cv: 'ローズラプソディ', en: 'Rose Rhapsody', color: ['pink'], note: 'やわらかなピンクの花。' },
  ] },
};

/** 群れの大きさ（植物の社会性）。データにないものは形・役割から決める */
export function socOf(p) {
  if (p.soc) return p.soc;
  const r = p.roles || [];
  if (p.type === 'shrub' || p.type === 'tree') return 1;
  if (r.includes('groundcover')) return 5;
  if (r.includes('matrix') || (p.form === 'grass' && p.h[1] <= 90)) return 4;
  if (p.type === 'bulb') return 4;
  if (r.includes('screen') || (r.includes('structure') && p.h[1] >= 150)) return 1;
  if (r.includes('accent') || r.includes('structure')) return 2;
  return 3;
}
export const SOC_JA = { 1: '1株で目立たせる', 2: '2〜3株の小さな群れ', 3: '3〜5株の群れ', 4: '7株以上の広い群れ', 5: '一面に敷きつめる' };

/** 潮風（塩分）に強い植物の仲間 */
export const SALT_GROUPS = new Set(['gazania', 'osteospermum', 'dimorphotheca', 'arctotis', 'agapanthus', 'phormium', 'rosemary', 'lavender', 'santolina', 'artemisia', 'helichrysum', 'armeria', 'limonium', 'erigeron', 'sedum', 'euphorbia', 'eryngium', 'crambe', 'rosa-rugosa', 'tsuwabuki', 'festuca', 'miscanthus', 'pennisetum', 'westringia', 'grevillea', 'leptospermum', 'olive', 'stachys', 'cerastium', 'achillea', 'gaillardia', 'euryops', 'felicia', 'dietes', 'aloe', 'kniphofia', 'tulbaghia', 'iberis', 'hedera', 'hemerocallis', 'dianthus', 'perovskia', 'verbena', 'salvia-microphylla', 'bulbine', 'anigozanthos', 'carex', 'ophiopogon', 'liriope', 'muehlenbeckia', 'scaevola', 'portulaca', 'tulipa', 'yucca']);
