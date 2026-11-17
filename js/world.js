// 追加の植物：ハーブと、世界の各地域（アフリカ・南アフリカ・オーストラリア・北米西部・ヒマラヤ）の園芸植物
// ※ 解説文はすべてオリジナル。栽培が禁止・規制されている植物は掲載しない。
const W = (id, ja, latin, type, o) => ({
  id, ja, latin, wiki: o.wiki ?? latin.replace(/ (var|subsp)\..*$/, '').replace(/ '.*$/, ''), type,
  humid: 2, sun: ['full'], moist: ['mid'], leaf: 'green', heat: 10,
  cut: type === 'herb' ? 'after' : 'none', div: type === 'herb' ? 'spring' : 'none',
  ...(type === 'annual' ? { zone: [2, 11], heat: 12 } : {}),
  ...o,
});

// ---------- ハーブ ----------
export const HERB_BASE = [
  W('chervil', 'チャービル', 'Anthriscus cerefolium', 'annual', { sow: 'cool', sun: ['part', 'full'], h: [30, 50], spread: 20, bloom: [4, 5], color: ['white'], form: 'plate', tags: ['herb', 'balcony'], price: 200, note: '「美食家のパセリ」と呼ばれる繊細な香り。夏の強い日差しは苦手。' }),
  W('salad-burnet', 'サラダバーネット', 'Sanguisorba minor', 'herb', { zone: [4, 8], heat: 8, moist: ['dry', 'mid'], h: [30, 60], spread: 30, bloom: [5, 6], color: ['red'], form: 'globe', tags: ['herb', 'evergreen', 'balcony'], price: 300, note: 'キュウリのような香りの若葉をサラダに。ワレモコウの仲間で、冬も葉が残る。' }),
  W('rose-geranium', 'ローズゼラニウム', 'Pelargonium graveolens', 'herb', { zone: [10, 11], tender: true, moist: ['dry', 'mid'], h: [50, 90], spread: 50, bloom: [5, 6], color: ['pink'], form: 'mound', tags: ['herb', 'fragrant', 'balcony'], price: 500, note: '葉にバラのような香り。ジャムやお菓子の香りづけ、ポプリに。冬は室内へ。' }),
  W('summer-savory', 'サマーセイボリー', 'Satureja hortensis', 'annual', { sow: 'warm', moist: ['dry', 'mid'], h: [20, 40], spread: 20, bloom: [7, 8], color: ['white', 'pink'], form: 'airy', tags: ['herb', 'balcony'], price: 200, note: '豆料理と相性のよい、ピリッとした香り。' }),
  W('caraway', 'キャラウェイ', 'Carum carvi', 'herb', { zone: [3, 8], heat: 7, humid: 1, h: [40, 70], spread: 30, bloom: [5, 6], color: ['white'], form: 'plate', tags: ['herb', 'pollinator'], price: 300, note: '二年草。種はパンやザワークラウトの香りづけに。セリ科らしい白いレースの花。' }),
  W('anise', 'アニス', 'Pimpinella anisum', 'annual', { sow: 'cool', moist: ['dry', 'mid'], h: [30, 60], spread: 20, bloom: [6, 7], color: ['white'], form: 'plate', tags: ['herb', 'pollinator'], price: 250, note: '甘い香りの種は、お菓子やリキュールの香りづけに。移植を嫌うので直まきで。' }),
  W('cumin', 'クミン', 'Cuminum cyminum', 'annual', { sow: 'warm', moist: ['dry'], h: [20, 40], spread: 15, bloom: [6, 7], color: ['white', 'pink'], form: 'plate', tags: ['herb', 'dry'], price: 200, note: 'カレーに欠かせないスパイス。乾燥した暖かい場所で、雨に当てないように。' }),
  W('sweet-cicely', 'スイートシスリー', 'Myrrhis odorata', 'herb', { zone: [3, 7], heat: 6, humid: 1, sun: ['part', 'shade'], h: [60, 100], spread: 50, bloom: [5, 6], color: ['white'], form: 'plate', tags: ['herb', 'shade'], price: 500, note: 'シダのような葉に甘いアニスの香り。酸っぱい果物と煮ると甘みを補える。涼しい半日陰向き。' }),
  W('gotu-kola', 'ゴツコラ', 'Centella asiatica', 'herb', { zone: [9, 11], tender: true, sun: ['part', 'full'], moist: ['wet', 'mid'], h: [5, 15], spread: 40, bloom: [], color: ['green'], form: 'mound', tags: ['herb', 'balcony'], price: 400, note: 'ツボクサの仲間。アジアではサラダやジュースに使われる。湿り気を好み、這うように広がる。' }),
  W('vetiver', 'ベチバー', 'Chrysopogon zizanioides', 'grass', { zone: [9, 11], tender: true, humid: 3, h: [100, 150], spread: 60, bloom: [], color: ['green'], form: 'grass', tags: ['herb', 'fragrant'], price: 800, note: '根に深い土の香りがあり、香水や虫よけに。株はグラスとして観賞できる。' }),
  W('turmeric', 'ウコン', 'Curcuma longa', 'herb', { zone: [9, 11], tender: true, humid: 3, sun: ['full', 'part'], h: [60, 100], spread: 40, bloom: [8, 9], harvest: [10, 11], color: ['white', 'green'], form: 'mound', tags: ['herb', 'veg'], price: 300, note: '黄色い根茎はカレーのスパイス（ターメリック）に。秋に掘り上げ、冬は根茎を室内で保存。' }),
  W('roselle', 'ローゼル', 'Hibiscus sabdariffa', 'annual', { sow: 'warm', humid: 3, h: [100, 200], spread: 60, bloom: [9, 10], harvest: [10, 11], color: ['pink'], form: 'spike', tags: ['herb', 'veg'], price: 300, note: '赤い萼（がく）を乾かすと、真っ赤なハイビスカスティーに。秋に咲く花も美しい。' }),
  W('chicory', 'チコリー', 'Cichorium intybus', 'herb', { zone: [3, 9], heat: 9, moist: ['dry', 'mid'], h: [60, 120], spread: 40, bloom: [6, 7, 8, 9], color: ['blue'], form: 'spike', tags: ['herb', 'pollinator', 'natural'], price: 300, note: '朝に開いて昼に閉じる、澄んだ空色の花。根を焙ってコーヒーの代わりにすることも。' }),
  W('kakidooshi', 'カキドオシ', 'Glechoma hederacea subsp. grandis', 'herb', { wiki: 'Glechoma hederacea', zone: [4, 9], sun: ['part', 'full', 'shade'], h: [5, 20], spread: 50, bloom: [4, 5], color: ['purple'], form: 'mound', tags: ['herb', 'easy', 'shade'], price: 250, note: 'つるが垣根を通り抜けるほど伸びることが名の由来。春の淡紫の花と、さわやかな香り。' }),
  W('sweet-violet', 'ニオイスミレ', 'Viola odorata', 'herb', { zone: [5, 9], sun: ['part', 'full'], h: [10, 15], spread: 25, bloom: [2, 3, 4], color: ['purple', 'white'], form: 'mound', tags: ['herb', 'fragrant', 'balcony'], price: 300, note: '早春に甘い香りの花。花の砂糖漬けはヨーロッパの伝統菓子。' }),
  W('egoma', 'エゴマ', 'Perilla frutescens var. frutescens', 'annual', { wiki: 'Perilla frutescens', sow: 'warm', humid: 3, h: [60, 120], spread: 40, bloom: [8, 9], harvest: [7, 8, 9, 10], color: ['white'], form: 'spike', tags: ['herb', 'veg'], price: 150, note: 'シソの仲間。葉は焼き肉を包んで、種からはえごま油がとれる。' }),
  W('wasabi', 'ワサビ', 'Eutrema japonicum', 'herb', { zone: [6, 8], heat: 5, humid: 1, sun: ['shade', 'part'], moist: ['wet'], h: [20, 40], spread: 30, bloom: [3, 4], color: ['white'], form: 'mound', tags: ['herb', 'veg', 'shade', 'wa'], harvest: [3, 4, 5], price: 500, note: '涼しく湿った日陰を好む。庭や鉢では葉と花（花わさび）を楽しむのが手軽。' }),
];

// ---------- 世界の各地域の植物 ----------
export const WORLD_BASE = [
  // アフリカ（熱帯・マダガスカル）
  W('impatiens', 'インパチェンス', 'Impatiens walleriana', 'annual', { sow: 'warm', sun: ['part', 'shade'], moist: ['mid', 'wet'], h: [20, 40], spread: 30, bloom: [5, 6, 7, 8, 9, 10], color: ['pink', 'red', 'white', 'orange', 'purple'], form: 'mound', tags: ['shade', 'easy', 'balcony'], price: 150, note: '日陰を明るく彩る代表的な花。東アフリカの山地の森が故郷。水切れに注意。' }),
  W('pentas', 'ペンタス', 'Pentas lanceolata', 'annual', { sow: 'warm', humid: 3, h: [30, 60], spread: 30, bloom: [6, 7, 8, 9, 10], color: ['pink', 'red', 'white', 'purple'], form: 'plate', tags: ['pollinator', 'balcony', 'easy'], price: 250, note: '星形の小花が集まって咲く。暑さに強く、蝶がよく来る。' }),
  W('gloriosa', 'グロリオサ', 'Gloriosa superba', 'bulb', { zone: [9, 11], tender: true, humid: 3, h: [100, 200], spread: 30, bloom: [7, 8], color: ['red', 'yellow'], form: 'spike', tags: ['balcony'], price: 500, note: '炎のように反り返る花びら。つるを支柱に絡ませて。球根は有毒なので、食用のヤマイモと間違えないように。' }),
  W('sesame', 'ゴマ', 'Sesamum indicum', 'annual', { sow: 'warm', humid: 3, moist: ['dry', 'mid'], h: [80, 150], spread: 30, bloom: [7, 8], harvest: [9, 10], color: ['white', 'pink'], form: 'spike', tags: ['veg'], price: 50, note: '釣鐘形の花のあとにさやができ、熟すと種がはじける。乾燥と暑さに強い。' }),
  W('watermelon', 'スイカ', 'Citrullus lanatus', 'annual', { sow: 'warm', humid: 2, moist: ['dry', 'mid'], h: [30, 40], spread: 150, bloom: [6, 7], harvest: [7, 8], color: ['yellow'], form: 'mound', tags: ['veg'], price: 300, note: 'アフリカの乾いた土地が故郷。つるを広げるので場所が必要。小玉品種なら支柱で立体栽培も。' }),
  W('kalanchoe', 'カランコエ', 'Kalanchoe blossfeldiana', 'herb', { zone: [10, 11], tender: true, moist: ['dry'], h: [20, 30], spread: 25, bloom: [12, 1, 2, 3, 4], color: ['red', 'orange', 'yellow', 'pink'], form: 'globe', tags: ['balcony', 'dry'], price: 400, note: 'マダガスカル生まれの多肉植物。冬から春に咲く。乾かしぎみに育て、冬は室内へ。' }),
  W('sasage', 'ササゲ（十六ササゲ）', 'Vigna unguiculata', 'annual', { sow: 'warm', humid: 3, h: [100, 200], spread: 30, bloom: [7, 8], harvest: [7, 8, 9], color: ['purple', 'white'], form: 'spike', tags: ['veg', 'easy'], price: 60, note: '暑さに強いつる性の豆。長いさやを若どりして炒め物やおひたしに。' }),
  W('hyoutan', 'ヒョウタン', 'Lagenaria siceraria', 'annual', { sow: 'warm', humid: 3, h: [200, 400], spread: 60, bloom: [7, 8], color: ['white'], form: 'spike', tags: ['balcony'], price: 300, note: 'ネットに這わせると夏の緑のカーテンに。夕方に白い花が咲き、秋には実を加工して飾りに。' }),
  // 熱帯アジア
  W('goya', 'ゴーヤ', 'Momordica charantia', 'annual', { sow: 'warm', humid: 3, h: [200, 400], spread: 60, bloom: [7, 8, 9], harvest: [7, 8, 9], color: ['yellow'], form: 'spike', tags: ['veg', 'balcony', 'easy'], price: 200, note: 'ベランダの緑のカーテンの定番。暑さに強く、実がたくさんなる。' }),
  W('luffa', 'ヘチマ', 'Luffa aegyptiaca', 'annual', { sow: 'warm', humid: 3, h: [200, 500], spread: 60, bloom: [7, 8, 9], harvest: [8, 9], color: ['yellow'], form: 'spike', tags: ['veg', 'balcony'], price: 200, note: '大きな黄色い花が咲く緑のカーテン。若い実は食べられ、熟した実からはたわしができる。' }),
  W('curcuma', 'クルクマ', 'Curcuma alismatifolia', 'bulb', { zone: [10, 11], tender: true, humid: 3, h: [40, 70], spread: 30, bloom: [7, 8, 9], color: ['pink', 'white'], form: 'spike', tags: ['balcony'], price: 600, note: 'タイ生まれのショウガの仲間。花のように見えるのは苞。冬は球根を掘り上げて室内で。' }),
  W('ng-impatiens', 'ニューギニアインパチェンス', 'Impatiens hawkeri', 'annual', { sow: 'warm', sun: ['part', 'full'], moist: ['mid', 'wet'], h: [25, 40], spread: 35, bloom: [5, 6, 7, 8, 9, 10], color: ['red', 'pink', 'orange', 'white', 'purple'], form: 'mound', tags: ['balcony'], price: 300, note: '大輪の花と、つやのある葉。インパチェンスより日なたに強い。' }),
  W('jasmine', 'マツリカ（アラビアンジャスミン）', 'Jasminum sambac', 'shrub', { zone: [10, 11], tender: true, humid: 3, h: [50, 150], spread: 60, bloom: [6, 7, 8, 9], color: ['white'], form: 'globe', tags: ['fragrant', 'balcony', 'herb'], price: 1200, note: 'ジャスミン茶の香りづけに使われる花。夜に甘く香る。冬は室内へ。' }),
  // 南アフリカ
  W('gladiolus', 'グラジオラス', 'Gladiolus × hortulanus', 'bulb', { wiki: 'Gladiolus', zone: [8, 10], h: [80, 150], spread: 20, bloom: [6, 7, 8], color: ['red', 'pink', 'white', 'yellow', 'purple', 'orange'], form: 'spike', tags: [], price: 80, note: '剣のような葉と、まっすぐ立ち上がる花穂。植え付けを2週間ずつずらすと長く楽しめる。' }),
  W('gerbera', 'ガーベラ', 'Gerbera jamesonii', 'herb', { zone: [8, 11], tender: true, moist: ['dry', 'mid'], h: [20, 40], spread: 30, bloom: [4, 5, 6, 9, 10, 11], color: ['red', 'pink', 'orange', 'yellow', 'white'], form: 'daisy', tags: ['balcony'], price: 400, note: '明るい色の大きな花。株元を蒸らさないよう、水は土に。' }),
  W('gazania', 'ガザニア', 'Gazania rigens', 'herb', { zone: [8, 11], humid: 2, moist: ['dry'], h: [15, 30], spread: 30, bloom: [5, 6, 7, 8, 9, 10], color: ['yellow', 'orange', 'red', 'white'], form: 'daisy', leaf: 'silver', tags: ['dry', 'easy', 'balcony'], price: 250, note: '日が当たると花が開き、曇りや夜は閉じる。乾燥と照り返しに強い。' }),
  W('osteospermum', 'オステオスペルマム', 'Osteospermum ecklonis', 'herb', { zone: [8, 10], humid: 1, moist: ['dry', 'mid'], h: [30, 50], spread: 40, bloom: [3, 4, 5, 10, 11], color: ['white', 'purple', 'pink', 'yellow'], form: 'daisy', tags: ['balcony'], price: 300, note: '春と秋に咲く。真夏の蒸し暑さが苦手なので、梅雨前に切り戻して風通しよく。' }),
  W('dimorphotheca', 'ディモルフォセカ', 'Dimorphotheca sinuata', 'annual', { sow: 'cool', moist: ['dry', 'mid'], h: [20, 40], spread: 25, bloom: [3, 4, 5], color: ['orange', 'yellow', 'white'], form: 'daisy', tags: ['natural', 'easy'], price: 150, note: '南アフリカのナマクワランドで春の野原を埋め尽くす花。' }),
  W('plumbago', 'プルンバーゴ', 'Plumbago auriculata', 'subshrub', { zone: [9, 11], tender: true, humid: 3, h: [50, 150], spread: 80, bloom: [6, 7, 8, 9, 10], color: ['blue', 'white'], form: 'plate', tags: ['balcony', 'easy'], price: 600, note: '夏じゅう涼しげな水色の花が咲き続ける。枝が伸びるので、フェンスやオベリスクに沿わせても。' }),
  W('euryops', 'ユリオプスデージー', 'Euryops pectinatus', 'subshrub', { zone: [9, 11], moist: ['dry', 'mid'], h: [60, 100], spread: 80, bloom: [11, 12, 1, 2, 3, 4], color: ['yellow'], leaf: 'silver', form: 'daisy', tags: ['evergreen', 'easy'], price: 600, note: '銀色の葉に、冬から春にかけて黄色い花。花の少ない季節の主役。' }),
  W('phygelius', 'フィゲリウス', 'Phygelius capensis', 'herb', { zone: [7, 10], h: [60, 100], spread: 60, bloom: [6, 7, 8, 9, 10], color: ['red', 'orange', 'pink'], form: 'spike', tags: ['pollinator'], price: 500, note: '細い筒形の花が下向きに連なる。夏から秋まで長く咲く。' }),
  W('eucomis', 'ユーコミス', 'Eucomis comosa', 'bulb', { zone: [7, 10], h: [40, 60], spread: 30, bloom: [7, 8], color: ['white', 'purple'], form: 'spike', tags: ['balcony'], price: 600, note: '花穂のてっぺんに葉の冠があり、パイナップルのような姿。' }),
  W('galtonia', 'ガルトニア', 'Ornithogalum candicans', 'bulb', { wiki: 'Ornithogalum candicans', zone: [6, 10], h: [80, 120], spread: 25, bloom: [7, 8], color: ['white'], form: 'spike', tags: ['english'], price: 300, note: '夏に白い釣鐘形の花が穂になって下がる。ボーダーの後景に。' }),
  W('dierama', 'ディエラマ', 'Dierama pulcherrimum', 'herb', { zone: [7, 10], h: [100, 150], spread: 40, bloom: [6, 7], color: ['pink'], form: 'airy', tags: ['natural'], price: 800, note: '細くしなる茎の先に釣鐘形の花が揺れ、「釣り竿」にたとえられる。' }),
  W('clivia', 'クンシラン', 'Clivia miniata', 'herb', { zone: [9, 11], tender: true, sun: ['shade', 'part'], h: [40, 60], spread: 40, bloom: [3, 4, 5], color: ['orange'], form: 'globe', tags: ['shade', 'evergreen', 'balcony'], price: 1500, note: '日陰でも咲く常緑の花。冬は室内の明るい場所へ。' }),
  W('hesperantha', 'シゾスティリス', 'Hesperantha coccinea', 'herb', { zone: [6, 9], moist: ['mid', 'wet'], h: [40, 60], spread: 30, bloom: [9, 10, 11], color: ['red', 'pink'], form: 'spike', tags: ['natural'], price: 400, note: '晩秋に咲く、グラジオラスを小さくしたような花。水辺の近くが好き。' }),
  W('felicia', 'ブルーデージー', 'Felicia amelloides', 'subshrub', { zone: [9, 11], tender: true, moist: ['dry', 'mid'], h: [30, 50], spread: 40, bloom: [3, 4, 5, 6, 10, 11], color: ['blue'], form: 'daisy', tags: ['balcony'], price: 350, note: '空色の花びらに黄色い芯。春と秋によく咲く。' }),
  // オーストラリア・ニュージーランド
  W('brachyscome', 'ブラキカム', 'Brachyscome multifida', 'herb', { zone: [9, 11], tender: true, moist: ['dry', 'mid'], h: [15, 30], spread: 30, bloom: [4, 5, 6, 7, 8, 9, 10], color: ['purple', 'white', 'pink'], form: 'daisy', tags: ['balcony', 'easy'], price: 300, note: '細かい葉に小さな菊のような花が次々と。鉢の縁からこぼれるように咲く。' }),
  W('westringia', 'ウエストリンギア', 'Westringia fruticosa', 'shrub', { zone: [9, 11], moist: ['dry', 'mid'], h: [80, 150], spread: 100, bloom: [4, 5, 6, 9, 10], color: ['white'], leaf: 'silver', form: 'globe', tags: ['evergreen', 'dry'], price: 1200, note: 'ローズマリーに似た銀葉の低木。潮風や乾燥に強い。' }),
  W('anigozanthos', 'カンガルーポー', 'Anigozanthos', 'herb', { zone: [9, 11], tender: true, moist: ['dry'], h: [50, 100], spread: 40, bloom: [5, 6, 7], color: ['red', 'yellow', 'orange'], form: 'spike', tags: ['dry', 'balcony'], price: 800, note: '毛に覆われた筒形の花が、カンガルーの前足のよう。鳥が蜜を吸う花。' }),
  W('grevillea', 'グレビレア', "Grevillea 'Robyn Gordon'", 'shrub', { wiki: 'Grevillea', zone: [9, 11], moist: ['dry'], h: [100, 150], spread: 100, bloom: [4, 5, 6, 7, 8, 9, 10, 11], color: ['red', 'pink'], form: 'plate', tags: ['evergreen', 'dry', 'pollinator'], price: 1500, note: '細い筒状の花が房になった独特の姿。肥料のリン分を嫌うので、与えすぎないこと。' }),
  W('leptospermum', 'ギョリュウバイ', 'Leptospermum scoparium', 'shrub', { zone: [8, 10], moist: ['dry', 'mid'], h: [100, 200], spread: 80, bloom: [3, 4, 5], color: ['pink', 'white', 'red'], form: 'globe', tags: ['evergreen', 'pollinator'], price: 1000, note: '細い葉に梅のような小花がびっしり。ニュージーランドではマヌカの名で知られる。' }),
  W('phormium', 'ニューサイラン', 'Phormium tenax', 'herb', { zone: [8, 11], h: [100, 200], spread: 90, bloom: [], color: ['green'], leaf: 'bronze', form: 'grass', tags: ['evergreen'], price: 1200, note: '剣のような葉が立ち上がる、存在感のあるカラーリーフ。花壇の主役やアクセントに。' }),
  // 北アメリカ西部
  W('clarkia', 'ゴデチア', 'Clarkia amoena', 'annual', { sow: 'cool', moist: ['dry', 'mid'], h: [30, 60], spread: 25, bloom: [5, 6], color: ['pink', 'red', 'white'], form: 'daisy', tags: ['natural'], price: 200, note: 'つやのある花びらが光を受けて輝く。やせた土のほうがよく咲く。' }),
  W('limnanthes', 'リムナンテス', 'Limnanthes douglasii', 'annual', { sow: 'cool', h: [10, 20], spread: 20, bloom: [4, 5], color: ['yellow', 'white'], form: 'mound', tags: ['pollinator', 'easy'], price: 200, note: '黄色い中心に白い縁取りの花で、「ポーチドエッグ」の愛称。蜂やハナアブが集まる。' }),
  W('ceanothus', 'セアノサス', 'Ceanothus', 'shrub', { zone: [7, 10], humid: 1, moist: ['dry'], h: [100, 200], spread: 120, bloom: [4, 5], color: ['blue'], form: 'plate', tags: ['evergreen', 'pollinator', 'dry'], price: 1500, note: '春に青い小花が枝を覆う常緑樹。高温多湿が苦手なので、水はけのよい場所に。' }),
  W('gilia', 'ギリア', 'Gilia tricolor', 'annual', { sow: 'cool', moist: ['dry', 'mid'], h: [30, 50], spread: 20, bloom: [4, 5, 6], color: ['purple', 'blue'], form: 'airy', tags: ['natural', 'pollinator'], price: 200, note: '紫・白・黄の三色の小花。軽やかに揺れる野の花。' }),
  // ヒマラヤ
  W('primula-denticulata', 'プリムラ・デンティキュラータ', 'Primula denticulata', 'herb', { zone: [4, 8], heat: 6, humid: 1, sun: ['part'], moist: ['mid', 'wet'], h: [20, 40], spread: 25, bloom: [3, 4], color: ['purple', 'white', 'pink'], form: 'globe', tags: [], price: 400, note: 'まん丸い花が茎の先に咲く。夏は涼しい半日陰で。' }),
  W('euphorbia-griffithii', 'ユーフォルビア・グリフィシー', "Euphorbia griffithii 'Fireglow'", 'herb', { wiki: 'Euphorbia griffithii', zone: [5, 9], h: [60, 90], spread: 50, bloom: [5, 6], color: ['orange'], leaf: 'bronze', form: 'plate', tags: ['english'], price: 700, note: '炎のような朱色の苞と、赤みを帯びた茎。切ると出る白い汁でかぶれることがあるので手袋を。' }),
  W('bistorta-affinis', 'ペルシカリア・アフィニス', "Persicaria affinis 'Darjeeling Red'", 'herb', { wiki: 'Persicaria affinis', zone: [3, 8], h: [15, 25], spread: 40, bloom: [6, 7, 8, 9, 10], color: ['pink', 'red'], form: 'spike', tags: ['easy'], price: 400, note: '地面を覆いながら、小さな穂がピンクから赤へ変わる。冬は葉が赤銅色に。' }),
  W('incarvillea', 'インカルビレア', 'Incarvillea delavayi', 'herb', { zone: [5, 8], heat: 7, humid: 1, h: [40, 60], spread: 30, bloom: [5, 6], color: ['pink'], form: 'globe', tags: [], price: 600, note: 'グロキシニアに似たラッパ形の花。水はけのよい場所で、冬は地上部が消える。' }),
];

/** 別名・通称 */
export const WORLD_ALIASES = {
  caraway: ['ヒメウイキョウ'], anise: ['アニシード'], cumin: ['ウマゼリ'], 'sweet-cicely': ['ミルラ'], 'gotu-kola': ['ツボクサ'], vetiver: ['カスカスガヤ'], turmeric: ['ターメリック'],
  chervil: ['セルフィーユ'], 'salad-burnet': ['オランダワレモコウ'],
  'rose-geranium': ['ニオイテンジクアオイ'], catnip: ['イヌハッカ'], 'summer-savory': ['キダチハッカ'], chicory: ['キクニガナ'],
  peppermint: ['セイヨウハッカ'], 'apple-mint': ['マルバハッカ'], yomogi: ['モチグサ', '艾'], 'nihon-hakka': ['ハッカ', '薄荷'],
  kakidooshi: ['レンセンソウ（連銭草）'], 'sweet-violet': ['スイートバイオレット'], 'holy-basil': ['トゥルシー', 'カミメボウキ'],
  egoma: ['ジュウネン'], wasabi: ['山葵'], impatiens: ['アフリカホウセンカ'], pentas: ['クササンタンカ'], gloriosa: ['キツネユリ'],
  sesame: ['胡麻'], watermelon: ['西瓜'], kalanchoe: ['ベニベンケイ'], gerbera: ['オオセンボンヤリの仲間'], gazania: ['クンショウギク'],
  osteospermum: ['アフリカンデージー'], dimorphotheca: ['アフリカキンセンカ'], plumbago: ['ルリマツリ'], phygelius: ['ケープフクシア'],
  eucomis: ['パイナップルリリー'], galtonia: ['ツリガネオモト', 'ガルトニア・カンディカンス'], dierama: ['エンジェルフィッシングロッド'],
  clivia: ['クリビア', '君子蘭'], hesperantha: ['ヘスペランサ'], felicia: ['フェリシア'], brachyscome: ['ヒメコスモス'],
  westringia: ['オーストラリアンローズマリー'], anigozanthos: ['アニゴザントス'], leptospermum: ['マヌカ'], phormium: ['マオラン'],
  clarkia: ['イロマツヨイ'], limnanthes: ['ポーチドエッグプラント'], ceanothus: ['カリフォルニアライラック'],
  'primula-denticulata': ['タマザキサクラソウ'], incarvillea: ['ストロベリーグロキシニア'], 'bistorta-affinis': ['ヒマラヤ・ノットウィード'],
};

/** 原産地 */
export const WORLD_ORIGIN = {
  caraway: ['europe', 'westasia'], anise: ['med'], cumin: ['westasia'], 'sweet-cicely': ['europe'], 'gotu-kola': ['tropasia'], vetiver: ['tropasia'], turmeric: ['tropasia'],
  chervil: ['westasia'], 'salad-burnet': ['europe'], 'pineapple-sage': ['mexico'],
  'rose-geranium': ['safrica'], catnip: ['europe'], 'summer-savory': ['med'], roselle: ['africa'], chicory: ['europe'],
  peppermint: ['europe'], 'apple-mint': ['europe', 'med'], yomogi: ['japan'], 'nihon-hakka': ['japan'], kakidooshi: ['japan'],
  'sweet-violet': ['europe'], 'lemon-thyme': ['europe'], 'holy-basil': ['tropasia'], egoma: ['eastasia'], wasabi: ['japan'],
  impatiens: ['africa'], pentas: ['africa'], gloriosa: ['africa', 'tropasia'], sesame: ['africa'], watermelon: ['africa'], kalanchoe: ['africa'],
  gerbera: ['safrica'], gazania: ['safrica'], osteospermum: ['safrica'], dimorphotheca: ['safrica'], plumbago: ['safrica'], euryops: ['safrica'],
  phygelius: ['safrica'], eucomis: ['safrica'], galtonia: ['safrica'], dierama: ['safrica'], clivia: ['safrica'], hesperantha: ['safrica'], felicia: ['safrica'],
  sasage: ['africa'], hyoutan: ['africa'], goya: ['tropasia'], luffa: ['tropasia'], curcuma: ['tropasia'], 'ng-impatiens': ['tropasia'], jasmine: ['tropasia'], gladiolus: ['safrica'],
  brachyscome: ['aus'], westringia: ['aus'], anigozanthos: ['aus'], grevillea: ['aus'], leptospermum: ['aus'], phormium: ['aus'],
  clarkia: ['na_west'], limnanthes: ['na_west'], ceanothus: ['na_west'], gilia: ['na_west'],
  'primula-denticulata': ['himalaya'], 'euphorbia-griffithii': ['himalaya'], 'bistorta-affinis': ['himalaya'], incarvillea: ['himalaya'],
};
