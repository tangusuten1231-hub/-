// 一年草・二年草、ハーブ、薬用植物、暮らしに役立つ小低木
// type: 'annual' は一年草・二年草。sow: 'cool'＝涼しい季節に育つ（暖地は秋まき、寒冷地は春まき）、'warm'＝暖かくなってから種まき
// 一年草の zone は目安（毎年種から育てるので耐寒性の判定は行わない）
// ※ 解説文はすべてオリジナル。栽培が禁止・規制されている植物は掲載しない。

const A = (id, ja, latin, sow, o) => ({ id, ja, latin, wiki: o.wiki ?? latin.replace(/ '.*$/, ''), type: 'annual', sow, zone: [2, 11], heat: sow === 'cool' ? 12 : 12, humid: 2, sun: ['full'], moist: ['mid'], spread: 30, leaf: 'green', tags: [], cut: 'none', div: 'none', ...o });
const B = (id, ja, latin, o) => ({ id, ja, latin, wiki: o.wiki ?? latin.replace(/ '.*$/, ''), leaf: 'green', tags: [], cut: 'after', div: 'spring', humid: 2, sun: ['full'], moist: ['mid'], ...o });

export const ANNUAL_BASE = [
  // ---- 宿根草の間を埋める、ナチュラルな一年草 ----
  A('orlaya', 'オルレア', 'Orlaya grandiflora', 'cool', { sun: ['full', 'part'], h: [40, 70], bloom: [4, 5, 6], color: ['white'], form: 'plate', tags: ['natural', 'english', 'pollinator'], price: 300, note: 'レースのような白花。こぼれ種でよくふえ、宿根草の間を自然に埋める。' }),
  A('ammi', 'アンミ（ホワイトレースフラワー）', 'Ammi majus', 'cool', { h: [80, 120], spread: 40, bloom: [5, 6, 7], color: ['white'], form: 'plate', tags: ['natural', 'english', 'pollinator'], price: 300, note: '背の高い白いレース状の花。切り花にも人気。' }),
  A('daucus', "ダウカス‘ダーラ’", "Daucus carota 'Dara'", 'cool', { wiki: 'Daucus carota', h: [80, 120], spread: 35, bloom: [6, 7, 8], color: ['pink', 'red'], form: 'plate', tags: ['natural', 'pollinator'], price: 350, note: 'ニンジンの仲間。白からワイン色に変わるレース状の花。' }),
  A('nigella', 'ニゲラ（クロタネソウ）', 'Nigella damascena', 'cool', { h: [40, 60], spread: 25, bloom: [5, 6], color: ['blue', 'white', 'pink'], form: 'airy', tags: ['english', 'natural'], price: 250, note: '糸のような葉に包まれた花。風船形の実はドライフラワーに。' }),
  A('centaurea-cyanus', 'ヤグルマギク（コーンフラワー）', 'Centaurea cyanus', 'cool', { h: [50, 90], bloom: [4, 5, 6], color: ['blue', 'pink', 'white', 'purple'], form: 'daisy', tags: ['natural', 'english', 'pollinator', 'easy'], price: 250, note: '澄んだ青の花。花びらは乾かしてお茶やポプリの彩りに。' }),
  A('papaver-rhoeas', 'シャーレーポピー（ヒナゲシ）', 'Papaver rhoeas', 'cool', { h: [50, 80], spread: 25, bloom: [4, 5, 6], color: ['red', 'pink', 'white'], form: 'daisy', tags: ['natural', 'english'], price: 250, note: '薄紙のような花びら。移植を嫌うので直まきで。' }),
  A('eschscholzia', 'カリフォルニアポピー（ハナビシソウ）', 'Eschscholzia californica', 'cool', { moist: ['dry'], h: [30, 45], bloom: [4, 5, 6], color: ['orange', 'yellow'], leaf: 'blue', form: 'daisy', tags: ['natural', 'dry', 'easy'], price: 250, note: '乾いた日向で輝くオレンジ。曇りや夜は花を閉じる。' }),
  A('consolida', 'ラークスパー（チドリソウ）', 'Consolida ajacis', 'cool', { h: [60, 100], spread: 25, bloom: [5, 6], color: ['blue', 'pink', 'white', 'purple'], form: 'spike', tags: ['english', 'natural'], price: 250, note: 'デルフィニウムに似た穂。暖地でも育てやすい。全草有毒。' }),
  A('agrostemma', 'アグロステンマ（ムギセンノウ）', 'Agrostemma githago', 'cool', { h: [60, 90], spread: 25, bloom: [5, 6], color: ['pink', 'white'], form: 'daisy', tags: ['natural', 'english'], price: 250, note: '細い茎の先に揺れる花。種は有毒。' }),
  A('cerinthe', 'セリンセ', "Cerinthe major 'Purpurascens'", 'cool', { wiki: 'Cerinthe major', h: [40, 60], spread: 35, bloom: [4, 5], color: ['purple'], leaf: 'blue', form: 'mound', tags: ['english', 'pollinator'], price: 350, note: '青みがかった葉と、うつむく紫の花。' }),
  A('myosotis', 'ワスレナグサ', 'Myosotis sylvatica', 'cool', { sun: ['full', 'part'], h: [15, 30], spread: 20, bloom: [3, 4, 5], color: ['blue', 'pink', 'white'], form: 'mound', tags: ['english', 'natural'], price: 200, note: '春の球根と相性抜群。こぼれ種でふえる。' }),
  A('viola', 'ビオラ・パンジー', 'Viola × wittrockiana', 'cool', { sun: ['full', 'part'], h: [10, 25], spread: 20, bloom: [11, 12, 1, 2, 3, 4, 5], color: ['purple', 'yellow', 'blue', 'white', 'orange', 'red'], form: 'mound', tags: ['easy', 'english'], price: 150, note: '晩秋から春まで咲き続ける。花がら摘みで長持ち。' }),
  A('nemophila', 'ネモフィラ', 'Nemophila menziesii', 'cool', { h: [10, 20], bloom: [3, 4, 5], color: ['blue'], form: 'mound', tags: ['natural', 'easy'], price: 200, note: '空色の小花がじゅうたんのように広がる。' }),
  A('lobularia', 'スイートアリッサム', 'Lobularia maritima', 'cool', { h: [10, 15], bloom: [10, 11, 12, 3, 4, 5], color: ['white', 'purple', 'pink'], form: 'mound', tags: ['fragrant', 'pollinator', 'easy'], price: 150, note: '甘い香りの小花。害虫の天敵になる小さな虫を呼ぶ。' }),
  A('antirrhinum', 'キンギョソウ', 'Antirrhinum majus', 'cool', { h: [20, 90], spread: 25, bloom: [4, 5, 6, 10, 11], color: ['pink', 'red', 'yellow', 'white', 'orange'], form: 'spike', tags: ['english'], price: 200, note: '切り戻すと秋にも咲く。暖地では冬を越すことも。' }),
  A('gypsophila-elegans', 'カスミソウ（一年草）', 'Gypsophila elegans', 'cool', { moist: ['dry', 'mid'], h: [30, 50], spread: 25, bloom: [5, 6], color: ['white', 'pink'], form: 'airy', tags: ['english', 'natural'], price: 250, note: '種まきから短期間で咲く。時期をずらしてまくと長く楽しめる。' }),
  A('scabiosa-atro', 'セイヨウマツムシソウ', 'Scabiosa atropurpurea', 'cool', { h: [60, 90], bloom: [5, 6, 7], color: ['purple', 'red', 'pink', 'white'], form: 'daisy', tags: ['english', 'pollinator'], price: 300, note: '黒に近いワイン色の品種が人気。切り花に。' }),
  A('salvia-viridis', 'ペインテッドセージ', 'Salvia viridis', 'cool', { h: [40, 60], spread: 25, bloom: [5, 6, 7], color: ['purple', 'pink', 'white'], form: 'spike', tags: ['english', 'natural'], price: 250, note: '色づくのは花ではなく苞。ドライにしても色が残る。' }),
  A('limonium-sinuatum', 'スターチス', 'Limonium sinuatum', 'cool', { heat: 8, moist: ['dry', 'mid'], h: [40, 70], bloom: [5, 6, 7], color: ['purple', 'pink', 'yellow', 'white', 'blue'], form: 'plate', tags: ['dry'], price: 250, note: 'カサカサした花は、そのままドライフラワーになる。' }),
  A('lunaria', 'ルナリア（ゴウダソウ）', 'Lunaria annua', 'cool', { sun: ['part', 'full'], h: [60, 90], bloom: [4, 5], color: ['purple', 'white'], form: 'plate', tags: ['english', 'natural'], price: 300, note: '二年草。花後にできる銀色の円い実が飾りになる。' }),
  A('lagurus', 'ラグラス（ウサギノオ）', 'Lagurus ovatus', 'cool', { moist: ['dry', 'mid'], h: [30, 50], spread: 20, bloom: [5, 6], color: ['white'], form: 'grass', tags: ['natural', 'dry'], price: 250, note: 'うさぎのしっぽのような穂。ドライの定番。' }),
  A('alcea', 'タチアオイ（ホリホック）', 'Alcea rosea', 'cool', { h: [150, 250], spread: 50, bloom: [6, 7, 8], color: ['pink', 'red', 'white', 'yellow', 'purple'], form: 'spike', tags: ['wa', 'english'], price: 400, note: '二年草〜短命な多年草。梅雨入りとともに咲き始める。' }),
  A('verbascum', 'バーバスカム', 'Verbascum', 'cool', { wiki: 'Verbascum', moist: ['dry', 'mid'], h: [60, 180], spread: 45, bloom: [6, 7, 8], color: ['yellow'], leaf: 'silver', form: 'spike', tags: ['natural', 'english', 'dry'], price: 500, note: '銀色のロゼットから高い花穂が立ち上がる二年草。' }),
  A('trifolium-incarnatum', 'クリムソンクローバー', 'Trifolium incarnatum', 'cool', { h: [30, 50], spread: 25, bloom: [4, 5, 6], color: ['red'], form: 'spike', tags: ['natural', 'pollinator', 'easy'], price: 200, note: 'いちごのような赤い穂。土を肥やす緑肥としても使える。' }),
  A('phacelia', 'ファセリア（ハゼリソウ）', 'Phacelia tanacetifolia', 'cool', { h: [50, 80], bloom: [5, 6], color: ['purple'], form: 'globe', tags: ['natural', 'pollinator'], price: 200, note: '蜜源植物として名高い。緑肥にもなる。' }),
  A('cosmos', 'コスモス', 'Cosmos bipinnatus', 'warm', { h: [60, 150], spread: 40, bloom: [7, 8, 9, 10, 11], color: ['pink', 'white', 'red'], form: 'daisy', tags: ['natural', 'easy', 'pollinator'], price: 200, note: '痩せた土でもよく咲く。肥料が多いと葉ばかり茂る。' }),
  A('zinnia', 'ジニア（ヒャクニチソウ）', 'Zinnia elegans', 'warm', { humid: 2, h: [30, 90], bloom: [6, 7, 8, 9, 10], color: ['pink', 'red', 'orange', 'yellow', 'white'], form: 'daisy', tags: ['easy', 'pollinator'], price: 200, note: '暑さに強く、百日咲くといわれるほど花期が長い。' }),
  A('helianthus-annuus', 'ヒマワリ', 'Helianthus annuus', 'warm', { humid: 3, h: [60, 250], spread: 45, bloom: [7, 8, 9], color: ['yellow'], form: 'daisy', tags: ['easy', 'pollinator'], price: 200, note: '種は野鳥のごちそう。移植を嫌うので直まきで。' }),
  A('tagetes', 'マリーゴールド', 'Tagetes patula', 'warm', { humid: 3, h: [20, 40], spread: 25, bloom: [5, 6, 7, 8, 9, 10, 11], color: ['orange', 'yellow', 'red'], form: 'globe', tags: ['easy'], price: 150, note: '根が土の中のセンチュウを減らすといわれ、野菜と一緒に植えられる。' }),
  A('gomphrena', 'センニチコウ', 'Gomphrena globosa', 'warm', { humid: 3, moist: ['dry', 'mid'], h: [30, 60], bloom: [6, 7, 8, 9, 10], color: ['pink', 'purple', 'white', 'red'], form: 'globe', tags: ['easy', 'pollinator'], price: 200, note: '真夏に強い。丸い花は色あせないドライフラワーに。' }),
  A('celosia', 'ケイトウ（セロシア）', 'Celosia argentea', 'warm', { humid: 3, h: [30, 90], bloom: [7, 8, 9, 10], color: ['red', 'pink', 'orange', 'yellow'], form: 'spike', tags: ['easy', 'wa'], price: 200, note: '炎のような花穂。ドライにしても鮮やか。' }),
  A('xerochrysum', 'ムギワラギク（ヘリクリサム）', 'Xerochrysum bracteatum', 'warm', { moist: ['dry', 'mid'], h: [40, 90], bloom: [5, 6, 7, 8, 9, 10], color: ['yellow', 'orange', 'pink', 'red', 'white'], form: 'daisy', tags: ['dry'], price: 250, note: '紙細工のような花。ドライフラワーの代表格。' }),
  A('cleome', 'クレオメ（セイヨウフウチョウソウ）', 'Cleome hassleriana', 'warm', { humid: 3, h: [80, 120], spread: 45, bloom: [7, 8, 9, 10], color: ['pink', 'white', 'purple'], form: 'globe', tags: ['natural', 'pollinator'], price: 250, note: '蝶が舞うような花。こぼれ種でふえる。' }),
  A('nicotiana', 'ニコチアナ（ハナタバコ）', 'Nicotiana', 'warm', { wiki: 'Nicotiana alata', sun: ['full', 'part'], h: [40, 150], spread: 35, bloom: [6, 7, 8, 9, 10], color: ['white', 'green', 'pink', 'red'], form: 'daisy', tags: ['fragrant', 'natural'], price: 250, note: '夕方から香る。全草有毒なので口にしない。' }),
  A('amaranthus', 'アマランサス', 'Amaranthus caudatus', 'warm', { humid: 3, h: [80, 150], spread: 45, bloom: [8, 9, 10], color: ['red', 'green'], form: 'spike', tags: ['natural'], price: 250, note: '垂れ下がるひも状の花穂。切り花やドライに。' }),
  A('salvia-farinacea', 'ブルーサルビア', 'Salvia farinacea', 'warm', { humid: 3, h: [40, 60], bloom: [6, 7, 8, 9, 10], color: ['blue', 'white'], form: 'spike', tags: ['easy', 'pollinator'], price: 200, note: '夏の暑さに強い青い穂。暖地では冬を越すことも。' }),
  A('salvia-coccinea', 'サルビア・コクシネア', 'Salvia coccinea', 'warm', { humid: 3, h: [50, 80], bloom: [6, 7, 8, 9, 10], color: ['red', 'pink', 'white'], form: 'spike', tags: ['natural', 'pollinator', 'easy'], price: 250, note: 'すらりとした草姿。こぼれ種で毎年咲く。' }),
  A('tithonia', 'チトニア（メキシコヒマワリ）', 'Tithonia rotundifolia', 'warm', { humid: 3, h: [100, 180], spread: 60, bloom: [8, 9, 10], color: ['orange'], form: 'daisy', tags: ['pollinator', 'natural'], price: 250, note: '鮮やかな朱色に蝶が集まる。背景に。' }),
  A('panicum-frosted', "パニカム‘フロステッドエクスプロージョン’", "Panicum elegans 'Frosted Explosion'", 'warm', { wiki: 'Panicum', h: [60, 80], spread: 35, bloom: [7, 8, 9, 10], color: ['green'], form: 'grass', tags: ['natural', 'prairie'], price: 300, note: '花火のように弾ける穂。花束の名脇役。' }),
  A('impatiens-balsamina', 'ホウセンカ', 'Impatiens balsamina', 'warm', { humid: 3, sun: ['full', 'part'], h: [30, 60], bloom: [7, 8, 9], color: ['red', 'pink', 'white', 'purple'], form: 'spike', tags: ['wa', 'easy'], price: 200, note: '熟した実に触れると種が弾け飛ぶ。' }),
  A('carthamus', 'ベニバナ', 'Carthamus tinctorius', 'cool', { moist: ['dry', 'mid'], h: [60, 100], bloom: [6, 7], color: ['orange', 'yellow'], form: 'globe', tags: ['wa'], price: 250, note: '黄色から紅色に変わる花。染料・切り花・ドライに。' }),
  A('persicaria-tinctoria', 'アイ（タデアイ）', 'Persicaria tinctoria', 'warm', { humid: 3, moist: ['mid', 'wet'], h: [50, 70], bloom: [9, 10], color: ['pink'], form: 'spike', tags: ['wa'], price: 300, note: '藍染めの原料。葉をもんで生葉染めも楽しめる。' }),

  // ---- 一年草のハーブ ----
  A('ocimum', 'バジル', 'Ocimum basilicum', 'warm', { humid: 3, h: [30, 60], bloom: [7, 8, 9], color: ['white'], form: 'spike', tags: ['fragrant', 'easy'], price: 200, note: '摘心して脇芽を伸ばすと収穫が増える。花穂は早めに摘む。' }),
  A('perilla', 'シソ', 'Perilla frutescens var. crispa', 'warm', { wiki: 'Perilla frutescens', humid: 3, sun: ['full', 'part'], h: [50, 80], spread: 35, bloom: [9], color: ['white', 'pink'], form: 'spike', tags: ['wa', 'fragrant', 'easy'], price: 150, note: 'こぼれ種で毎年生える。花穂や実も薬味に。' }),
  A('coriandrum', 'コリアンダー（パクチー）', 'Coriandrum sativum', 'cool', { h: [40, 60], spread: 25, bloom: [5, 6], color: ['white'], form: 'plate', tags: ['fragrant', 'pollinator'], price: 200, note: '葉も種も使える。暑くなるとすぐ花が咲くので秋まきが楽。' }),
  A('anethum', 'ディル', 'Anethum graveolens', 'cool', { h: [60, 100], spread: 30, bloom: [6, 7], color: ['yellow'], form: 'plate', tags: ['fragrant', 'pollinator', 'natural'], price: 200, note: '魚料理やピクルスに。黄色い傘状の花は花壇でも美しい。' }),
  A('petroselinum', 'パセリ（イタリアンパセリ）', 'Petroselinum crispum', 'cool', { sun: ['full', 'part'], h: [20, 40], spread: 25, bloom: [6], color: ['green', 'yellow'], form: 'mound', tags: ['easy'], price: 200, note: '二年草。外側の葉から摘むと長く収穫できる。' }),
  A('borago', 'ボリジ', 'Borago officinalis', 'cool', { h: [40, 80], spread: 45, bloom: [4, 5, 6, 7], color: ['blue'], form: 'airy', tags: ['pollinator', 'natural'], price: 300, note: '星形の青い花は食べられる。こぼれ種でふえる。' }),
  A('calendula', 'カレンデュラ（キンセンカ）', 'Calendula officinalis', 'cool', { h: [30, 60], bloom: [12, 1, 2, 3, 4, 5], color: ['orange', 'yellow'], form: 'daisy', tags: ['easy'], price: 200, note: '冬から春の庭を明るくする。花びらは料理の彩りやオイル漬けに。' }),
  A('matricaria', 'ジャーマンカモミール', 'Matricaria chamomilla', 'cool', { h: [30, 60], spread: 25, bloom: [4, 5, 6], color: ['white'], form: 'daisy', tags: ['fragrant', 'easy'], price: 200, note: 'リンゴのような香りの花をお茶に。こぼれ種でよくふえる。' }),
  A('tropaeolum', 'ナスタチウム（キンレンカ）', 'Tropaeolum majus', 'warm', { heat: 8, h: [20, 40], spread: 50, bloom: [5, 6, 7, 9, 10], color: ['orange', 'yellow', 'red'], form: 'mound', tags: ['easy'], price: 200, note: '花も葉もピリッと辛く、サラダに。真夏は半日陰で休ませる。' }),

  // ---- 多年草のハーブ・薬用植物 ----
  B('linum', '宿根アマ（フラックス）', 'Linum perenne', { type: 'herb', zone: [5, 8], heat: 7, humid: 1, moist: ['dry', 'mid'], h: [40, 60], spread: 30, bloom: [5, 6, 7], color: ['blue'], form: 'airy', tags: ['natural', 'dry'], price: 400, note: '朝に開いて昼に散る空色の花が次々と咲く。' }),
  B('stevia', 'ステビア', 'Stevia rebaudiana', { type: 'herb', zone: [8, 11], heat: 11, humid: 3, h: [50, 80], spread: 40, bloom: [9, 10], color: ['white'], form: 'airy', tags: ['easy'], price: 350, note: '葉に強い甘みがある。乾燥させてお茶の甘味づけに。' }),
  B('satureja', 'ウィンターセイボリー', 'Satureja montana', { type: 'subshrub', zone: [5, 9], heat: 8, moist: ['dry'], h: [20, 40], spread: 35, bloom: [7, 8, 9], color: ['white'], form: 'mound', tags: ['fragrant', 'dry', 'evergreen', 'pollinator'], price: 400, cut: 'spring', div: 'none', note: '豆料理に合う香り。常緑で縁取りにも。' }),
  B('levisticum', 'ラベージ', 'Levisticum officinale', { type: 'herb', zone: [4, 8], heat: 7, h: [120, 200], spread: 80, bloom: [6, 7], color: ['yellow'], form: 'plate', tags: ['fragrant', 'pollinator'], price: 500, note: 'セロリに似た香りの大型ハーブ。スープに。' }),
  B('rumex', 'ソレル（スイバ）', 'Rumex acetosa', { type: 'herb', zone: [4, 9], heat: 8, sun: ['full', 'part'], h: [30, 80], spread: 35, bloom: [5, 6], color: ['red', 'green'], form: 'spike', tags: ['easy'], price: 300, note: '酸味のある若葉をサラダやスープに。' }),
  B('cryptotaenia', 'ミツバ', 'Cryptotaenia japonica', { type: 'herb', zone: [4, 9], heat: 9, humid: 3, sun: ['part', 'shade'], moist: ['mid', 'wet'], h: [30, 60], spread: 30, bloom: [6, 7], color: ['white'], form: 'airy', tags: ['wa', 'shade', 'easy'], price: 200, note: '日陰でよく育つ和のハーブ。こぼれ種でふえる。' }),
  B('aralia', 'ウド', 'Aralia cordata', { type: 'herb', zone: [4, 8], heat: 8, humid: 3, sun: ['part', 'shade'], moist: ['mid', 'wet'], h: [150, 250], spread: 150, bloom: [8, 9], color: ['white'], form: 'globe', tags: ['wa', 'shade', 'pollinator'], price: 800, cut: 'spring', note: '春の若芽は山菜に。夏は大きな葉、秋は黒い実と見どころが多い。' }),
  B('malva', 'マロウ', 'Malva sylvestris', { type: 'herb', zone: [4, 8], heat: 8, h: [100, 150], spread: 60, bloom: [5, 6, 7, 8], color: ['purple', 'pink'], form: 'spike', tags: ['natural', 'english', 'pollinator'], price: 400, div: 'none', note: '花を乾かしてお茶に。短命だがこぼれ種で続く。' }),
  B('valeriana', 'バレリアン', 'Valeriana officinalis', { type: 'herb', zone: [4, 9], heat: 8, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [100, 150], spread: 50, bloom: [5, 6, 7], color: ['white', 'pink'], form: 'plate', tags: ['natural', 'fragrant', 'pollinator'], price: 500, note: '背の高い白い花房が透けて見え、花壇の後ろで美しい。' }),
  B('hypericum-perforatum', 'セントジョーンズワート', 'Hypericum perforatum', { type: 'herb', zone: [4, 8], heat: 8, moist: ['dry', 'mid'], h: [40, 80], spread: 40, bloom: [6, 7, 8], color: ['yellow'], form: 'daisy', tags: ['natural', 'pollinator'], price: 400, note: '夏至の頃に黄色い花が咲く。地下茎で広がる。' }),
  B('inula', 'エレカンペーン（オオグルマ）', 'Inula helenium', { type: 'herb', zone: [4, 8], heat: 7, sun: ['full', 'part'], h: [150, 200], spread: 90, bloom: [7, 8], color: ['yellow'], form: 'daisy', tags: ['natural', 'pollinator'], price: 600, note: '大きな葉と細い花びらの黄花。存在感のある大型草。' }),
  B('bupleurum', 'ミシマサイコ', 'Bupleurum falcatum', { type: 'herb', zone: [5, 9], heat: 8, moist: ['dry', 'mid'], h: [40, 80], spread: 30, bloom: [8, 9, 10], color: ['yellow'], form: 'airy', tags: ['wa', 'natural'], price: 500, div: 'none', note: '細い茎に黄色い小花が霞のように咲く。日本の草原の植物。' }),
  B('atractylodes', 'オケラ', 'Atractylodes ovata', { type: 'herb', zone: [5, 8], heat: 8, sun: ['part', 'full'], moist: ['dry', 'mid'], h: [40, 80], spread: 35, bloom: [9, 10], color: ['white'], form: 'globe', tags: ['wa', 'natural'], price: 700, div: 'none', note: '魚の骨のような苞に包まれた白い花。明るい林の縁に。' }),
  B('coptis', 'セリバオウレン', 'Coptis japonica', { type: 'herb', zone: [5, 8], heat: 7, sun: ['shade', 'part'], h: [10, 25], spread: 25, bloom: [2, 3], color: ['white'], form: 'airy', tags: ['wa', 'shade', 'evergreen'], price: 700, cut: 'none', note: '早春の林床に白い星のような花。常緑のグラウンドカバー。' }),
  B('glycyrrhiza', 'カンゾウ（甘草）', 'Glycyrrhiza uralensis', { type: 'herb', zone: [5, 9], heat: 8, humid: 1, moist: ['dry'], h: [50, 100], spread: 50, bloom: [6, 7], color: ['purple'], form: 'spike', tags: ['dry'], price: 800, div: 'none', note: '根に強い甘みがある。水はけのよい深い土で。' }),
  B('prunella', 'ウツボグサ', 'Prunella vulgaris subsp. asiatica', { wiki: 'Prunella vulgaris', type: 'herb', zone: [4, 9], heat: 8, humid: 3, sun: ['full', 'part'], h: [10, 30], spread: 35, bloom: [6, 7, 8], color: ['purple'], form: 'spike', tags: ['wa', 'natural', 'pollinator', 'easy'], price: 400, note: '夏に花穂が枯れて黒くなる姿から「夏枯草」とも。' }),
  B('aloe', 'キダチアロエ', 'Aloe arborescens', { type: 'subshrub', zone: [9, 11], heat: 11, humid: 3, moist: ['dry'], h: [50, 150], spread: 60, bloom: [12, 1, 2], color: ['red'], form: 'spike', tags: ['dry', 'evergreen', 'easy'], price: 500, cut: 'none', div: 'spring', note: '冬に朱色の花。霜に弱いので寒冷地は鉢で。' }),

  // ---- 香り・お茶・染料になる小低木 ----
  B('aloysia', 'レモンバーベナ', 'Aloysia citrodora', { type: 'shrub', zone: [8, 10], heat: 10, h: [100, 200], spread: 100, bloom: [7, 8], color: ['white'], form: 'airy', tags: ['fragrant'], price: 600, cut: 'spring', div: 'none', note: 'レモンの香りが最も強いハーブの一つ。葉をお茶やポプリに。' }),
  B('lindera', 'クロモジ', 'Lindera umbellata', { type: 'shrub', zone: [5, 8], heat: 8, humid: 3, sun: ['part', 'shade'], h: [200, 300], spread: 200, bloom: [3, 4], color: ['yellow'], form: 'airy', tags: ['wa', 'shade', 'fragrant'], price: 1500, cut: 'after', div: 'none', note: '枝葉に清々しい香り。雑木の庭の下木に。' }),
  B('camellia-sinensis', 'チャノキ', 'Camellia sinensis', { type: 'shrub', zone: [7, 9], heat: 9, humid: 3, sun: ['full', 'part'], h: [100, 200], spread: 120, bloom: [10, 11], color: ['white'], form: 'daisy', tags: ['wa', 'evergreen'], price: 800, cut: 'after', div: 'none', note: '秋に小さな白い花。新芽を摘んで自家製のお茶に。' }),
  B('rosa-rugosa', 'ハマナス', 'Rosa rugosa', { type: 'shrub', zone: [2, 8], heat: 7, moist: ['dry', 'mid'], h: [100, 150], spread: 120, bloom: [5, 6, 7, 8], color: ['pink', 'white'], form: 'daisy', tags: ['wa', 'fragrant', 'pollinator'], price: 1200, cut: 'spring', div: 'none', note: '香りのよい花のあと、赤い実（ローズヒップ）がなる。' }),
  B('rosa-gallica', 'アポテカリーローズ', "Rosa gallica 'Officinalis'", { wiki: 'Rosa gallica', type: 'shrub', zone: [4, 8], heat: 8, h: [90, 120], spread: 100, bloom: [5, 6], color: ['pink', 'red'], form: 'daisy', tags: ['english', 'fragrant'], price: 2500, cut: 'after', div: 'none', note: '一季咲きの古いバラ。乾かしても香りが残る。' }),
  B('sambucus', 'エルダー（セイヨウニワトコ）', 'Sambucus nigra', { type: 'shrub', zone: [4, 8], heat: 8, sun: ['full', 'part'], h: [250, 400], spread: 250, bloom: [5, 6], color: ['white'], form: 'plate', tags: ['english', 'natural', 'fragrant', 'pollinator'], price: 1800, cut: 'spring', div: 'none', note: '初夏の白い花房でコーディアル（シロップ）を作る。' }),
  B('gardenia', 'クチナシ', 'Gardenia jasminoides', { type: 'shrub', zone: [8, 10], heat: 10, humid: 3, sun: ['part', 'full'], h: [100, 200], spread: 120, bloom: [6, 7], color: ['white'], form: 'daisy', tags: ['wa', 'fragrant', 'evergreen'], price: 1000, cut: 'after', div: 'none', note: '梅雨の頃に甘く香る。橙色の実は染料や着色料に。' }),
  B('zanthoxylum', 'サンショウ', 'Zanthoxylum piperitum', { type: 'shrub', zone: [6, 9], heat: 9, humid: 3, sun: ['part', 'full'], h: [150, 300], spread: 150, bloom: [4, 5], color: ['green', 'yellow'], form: 'airy', tags: ['wa', 'fragrant'], price: 1200, cut: 'none', div: 'none', note: '若葉（木の芽）、花、実と季節ごとに使える。アゲハの幼虫が葉を食べに来る。' }),
  B('laurus', 'ゲッケイジュ（ローリエ）', 'Laurus nobilis', { type: 'shrub', zone: [8, 10], heat: 10, humid: 3, sun: ['full', 'part'], h: [200, 500], spread: 200, bloom: [4, 5], color: ['yellow'], form: 'mound', tags: ['evergreen', 'fragrant', 'easy'], price: 1200, cut: 'after', div: 'none', note: '葉を乾かして煮込み料理に。刈り込んで小さく保てる。' }),
  B('lycium', 'クコ', 'Lycium chinense', { type: 'shrub', zone: [6, 9], heat: 9, humid: 3, h: [100, 200], spread: 150, bloom: [7, 8, 9, 10], color: ['purple'], form: 'airy', tags: ['wa', 'easy'], price: 800, cut: 'spring', div: 'none', note: '秋に赤い実がなる。地下茎や挿し木でよくふえる。' }),
];

export const ANNUAL_CULTIVARS = {
  'centaurea-cyanus': { group: 'ヤグルマギク', list: [
    { cv: 'ブルーボーイ', en: 'Blue Boy', color: ['blue'] },
    { cv: 'ブラックボール', en: 'Black Ball', color: ['purple'], note: '黒に近い濃い紫。シックな花束に。' },
    { cv: 'クラシックロマンティック', en: 'Classic Romantic', color: ['pink', 'white'], note: 'くすんだピンクの混合。' },
  ] },
  ammi: { group: 'アンミ', list: [
    { cv: 'マユス', en: 'majus', ja: 'アンミ・マユス（ホワイトレースフラワー）' },
    { cv: 'グリーンミスト', en: 'Green Mist', ja: "アンミ・ビスナガ‘グリーンミスト’", latin: "Ammi visnaga 'Green Mist'", wiki: 'Visnaga daucoides', color: ['green', 'white'], note: '細かい葉と緑がかった花。暑さにやや強い。' },
  ] },
  cosmos: { group: 'コスモス', list: [
    { cv: 'センセーション', en: 'Sensation' },
    { cv: 'ソナタ', en: 'Sonata', h: [40, 60], spread: 30, note: '背が低く倒れにくい。' },
    { cv: 'ダブルクリック', en: 'Double Click', h: [80, 120], note: '八重咲き。切り花に。' },
    { cv: 'キバナコスモス', en: 'sulphureus', ja: 'キバナコスモス', latin: 'Cosmos sulphureus', wiki: 'Cosmos sulphureus', color: ['orange', 'yellow'], h: [40, 100], humid: 3, bloom: [6, 7, 8, 9, 10], note: '暑さにとても強い。黄〜橙の花は草木染めにも。' },
  ] },
  zinnia: { group: 'ジニア', list: [
    { cv: 'エレガンス（高性）', en: 'elegans', ja: 'ジニア・エレガンス' },
    { cv: 'クイーンライム', en: 'Queen Lime', color: ['green', 'pink'], h: [60, 80], note: 'ライムグリーンにくすんだピンクが混じる人気品種。' },
    { cv: 'プロフュージョン', en: 'Profusion', ja: "ジニア‘プロフュージョン’", latin: "Zinnia marylandica 'Profusion'", h: [20, 30], spread: 30, humid: 3, note: '病気に強く、花がら摘みなしで咲き続ける。' },
    { cv: 'リネアリス', en: 'angustifolia', ja: 'ジニア・リネアリス', latin: 'Zinnia angustifolia', wiki: 'Zinnia angustifolia', color: ['orange', 'white', 'yellow'], h: [20, 30], spread: 30, humid: 3, note: '細い葉の小輪。乾燥と暑さに強い。' },
  ] },
  'helianthus-annuus': { group: 'ヒマワリ', list: [
    { cv: 'サンリッチ', en: 'Sunrich', h: [120, 170], note: '花粉が出ない切り花向きの品種。' },
    { cv: 'ロシア', en: 'Mammoth Russian', h: [200, 300], note: '種がたくさん採れる大型種。野鳥の餌に。' },
    { cv: 'テディベア', en: 'Teddy Bear', h: [40, 80], note: '八重咲きの小型種。' },
    { cv: 'プラドレッド', en: 'Prado Red', color: ['red'], h: [100, 150], note: '赤褐色の花。枝分かれして多花。' },
  ] },
  gomphrena: { group: 'センニチコウ', list: [
    { cv: 'グロボーサ', en: 'globosa', ja: 'センニチコウ' },
    { cv: 'ファイヤーワークス', en: 'Fireworks', ja: "ゴンフレナ‘ファイヤーワークス’", latin: "Gomphrena pulchella 'Fireworks'", color: ['pink'], h: [80, 100], spread: 40, form: 'airy', note: '細い茎の先にピンクの花が花火のように浮かぶ。' },
    { cv: 'ストロベリーフィールズ', en: 'Strawberry Fields', ja: "キバナセンニチコウ‘ストロベリーフィールズ’", latin: "Gomphrena haageana 'Strawberry Fields'", color: ['red'], h: [50, 70], note: 'いちごのような赤い花。' },
  ] },
  ocimum: { group: 'バジル', list: [
    { cv: 'スイートバジル', en: 'Genovese', ja: 'スイートバジル' },
    { cv: 'ダークオパール', en: 'Dark Opal', leaf: 'bronze', color: ['pink'], note: '紫の葉。ビネガーに漬けると赤く染まる。' },
    { cv: 'ブッシュバジル', en: 'minimum', ja: 'ブッシュバジル', latin: "Ocimum basilicum 'Minimum'", h: [15, 30], spread: 25, note: '小さな葉がこんもり茂る。鉢や縁取りに。' },
    { cv: 'ホーリーバジル（トゥルシー）', en: 'tenuiflorum', ja: 'ホーリーバジル（トゥルシー）', latin: 'Ocimum tenuiflorum', wiki: 'Ocimum tenuiflorum', color: ['purple'], note: 'インドで神聖な植物とされる。お茶に。' },
  ] },
  perilla: { group: 'シソ', list: [
    { cv: '青ジソ（大葉）', en: 'viridis', ja: '青ジソ（大葉）' },
    { cv: '赤ジソ', en: 'purpurea', ja: '赤ジソ', leaf: 'bronze', color: ['pink'], note: '梅干しの色づけやシソジュースに。' },
  ] },
  verbascum: { group: 'バーバスカム', list: [
    { cv: 'マレイン（ビロードモウズイカ）', en: 'thapsus', ja: 'マレイン（ビロードモウズイカ）', latin: 'Verbascum thapsus', wiki: 'Verbascum thapsus', h: [100, 180] },
    { cv: 'サザンチャーム', en: 'Southern Charm', ja: "バーバスカム‘サザンチャーム’", latin: "Verbascum 'Southern Charm'", color: ['pink', 'yellow'], leaf: 'green', h: [60, 90], note: 'アプリコットやピンクの淡い色合い。' },
    { cv: 'ウェディングキャンドルズ', en: 'Wedding Candles', ja: "バーバスカム‘ウェディングキャンドルズ’", latin: "Verbascum chaixii 'Wedding Candles'", wiki: 'Verbascum chaixii', color: ['white'], leaf: 'green', h: [80, 100], note: '白い花穂の多年性の種類。' },
  ] },
  nicotiana: { group: 'ニコチアナ', list: [
    { cv: 'ライムグリーン', en: 'Lime Green', ja: "ニコチアナ‘ライムグリーン’", latin: "Nicotiana alata 'Lime Green'", color: ['green'], h: [50, 70] },
    { cv: 'シルベストリス', en: 'sylvestris', ja: 'ニコチアナ・シルベストリス', latin: 'Nicotiana sylvestris', wiki: 'Nicotiana sylvestris', color: ['white'], h: [100, 150], spread: 60, note: '長い筒状の白花が垂れ下がり、夜に強く香る。' },
  ] },
  malva: { group: 'マロウ', list: [
    { cv: 'コモンマロウ（ウスベニアオイ）', en: 'sylvestris', ja: 'コモンマロウ（ウスベニアオイ）' },
    { cv: 'ゼブリナ', en: 'Zebrina', color: ['pink', 'purple'], h: [60, 100], note: '淡いピンクに濃い筋。' },
    { cv: 'マーシュマロウ', en: 'officinalis', ja: 'マーシュマロウ（ウスベニタチアオイ）', latin: 'Althaea officinalis', wiki: 'Althaea officinalis', color: ['pink', 'white'], leaf: 'silver', moist: ['mid', 'wet'], h: [100, 150], note: '柔らかい毛に覆われた葉と淡い花。湿った場所を好む。' },
  ] },
  valeriana: { group: 'カノコソウの仲間', list: [
    { cv: 'バレリアン（セイヨウカノコソウ）', en: 'officinalis', ja: 'バレリアン（セイヨウカノコソウ）' },
    { cv: 'カノコソウ', en: 'fauriei', ja: 'カノコソウ', latin: 'Valeriana fauriei', wiki: 'Valeriana fauriei', color: ['pink'], h: [40, 80], bloom: [5, 6], tags: ['wa', 'natural', 'fragrant', 'pollinator'], note: '日本の湿った草地に咲く。つぼみが鹿の子絞りのよう。' },
  ] },
  'hypericum-perforatum': { group: 'オトギリソウの仲間', list: [
    { cv: 'セントジョーンズワート', en: 'perforatum', ja: 'セントジョーンズワート（セイヨウオトギリ）' },
    { cv: 'オトギリソウ', en: 'erectum', ja: 'オトギリソウ', latin: 'Hypericum erectum', wiki: 'Hypericum erectum', h: [30, 60], tags: ['wa', 'natural'], note: '日本の野山に咲く在来種。' },
  ] },
  sambucus: { group: 'エルダー', list: [
    { cv: 'ニグラ', en: 'nigra', ja: 'エルダー（セイヨウニワトコ）' },
    { cv: 'ブラックレース', en: 'Black Lace', leaf: 'bronze', color: ['pink'], h: [200, 300], spread: 200, price: 2500, note: '黒紫の切れ込んだ葉とピンクの花。観賞価値が高い。' },
  ] },
  'rosa-rugosa': { group: 'ハマナス', list: [
    { cv: 'ハマナス', en: 'rugosa', ja: 'ハマナス' },
    { cv: '白花', en: 'Alba', ja: 'ハマナス（白花）', color: ['white'], note: '白花。' },
  ] },
  // 既存の種への追加
  rosemary: { list: [
    { cv: 'マリンブルー', en: 'Marine Blue', h: [100, 150], note: '濃い青の花。丈夫でよく伸びる立性。' },
    { cv: 'ミスジェサップ', en: "Miss Jessopp's Upright", h: [120, 180], note: 'まっすぐ直立する。生け垣にも。' },
    { cv: 'サンタバーバラ', en: 'Santa Barbara', h: [20, 40], spread: 100, note: '花付きのよいほふく性。' },
  ] },
  nepeta: { list: [
    { cv: 'キャットニップ（イヌハッカ）', en: 'cataria', ja: 'キャットニップ（イヌハッカ）', latin: 'Nepeta cataria', wiki: 'Nepeta cataria', color: ['white'], leaf: 'green', h: [50, 100], humid: 2, note: '猫が特に好む種類。葉をお茶にも。' },
  ] },
  filipendula: { list: [
    { cv: 'メドウスイート', en: 'ulmaria', ja: 'メドウスイート（セイヨウナツユキソウ）', latin: 'Filipendula ulmaria', wiki: 'Filipendula ulmaria', color: ['white'], h: [90, 150], tags: ['natural', 'english', 'fragrant'], note: '甘い香りのクリーム色の花房。湿った場所に。' },
  ] },
  angelica: { group: 'アンゲリカ', list: [
    { cv: 'ギガス', en: 'gigas', ja: 'アンゲリカ・ギガス' },
    { cv: 'アシタバ', en: 'keiskei', ja: 'アシタバ', latin: 'Angelica keiskei', wiki: 'Angelica keiskei', color: ['white'], zone: [8, 10], heat: 9, humid: 3, sun: ['part', 'full'], h: [60, 120], bloom: [8, 9, 10], tags: ['wa', 'easy'], note: '「今日摘んでも明日には芽が出る」といわれるほど丈夫。若葉を天ぷらやおひたしに。' },
    { cv: 'トウキ', en: 'acutiloba', ja: 'トウキ（当帰）', latin: 'Angelica acutiloba', wiki: 'Angelica acutiloba', color: ['white'], sun: ['part', 'full'], h: [40, 80], bloom: [6, 7], tags: ['wa', 'fragrant'], note: 'セロリに似た強い香り。葉を入浴剤やお茶に。' },
  ] },
  artemisia: { group: 'アルテミシア（ヨモギの仲間）', list: [
    { cv: 'ポウイスキャッスル', en: 'Powis Castle', ja: "アルテミシア‘ポウイスキャッスル’" },
    { cv: 'ヨモギ', en: 'princeps', ja: 'ヨモギ', latin: 'Artemisia indica var. maximowiczii', wiki: 'Artemisia princeps', type: 'herb', zone: [4, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['mid'], leaf: 'green', h: [50, 100], spread: 60, tags: ['wa', 'fragrant', 'easy'], price: 300, note: '春の若葉を草餅に。地下茎で広がるので場所を区切って。' },
    { cv: 'ワームウッド（ニガヨモギ）', en: 'absinthium', ja: 'ワームウッド（ニガヨモギ）', latin: 'Artemisia absinthium', wiki: 'Artemisia absinthium', zone: [4, 9], h: [60, 100], note: '銀白色の葉。強い苦みと香りがある。' },
    { cv: 'フレンチタラゴン', en: 'dracunculus', ja: 'フレンチタラゴン', latin: 'Artemisia dracunculus', wiki: 'Tarragon', type: 'herb', zone: [5, 8], heat: 7, leaf: 'green', h: [40, 60], spread: 40, note: '甘い香りの料理用ハーブ。高温多湿が苦手。' },
  ] },
  aralia: { group: 'ウド', list: [
    { cv: 'ウド', en: 'cordata', ja: 'ウド' },
    { cv: 'サンキング', en: 'Sun King', leaf: 'gold', h: [90, 150], spread: 120, price: 2000, note: '黄金色の葉が日陰を明るく照らす。' },
  ] },
};
