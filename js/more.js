// 追加の植物データ：作庭家がよく使う宿根草・ハーブ・小低木・シダ・植えっぱなし球根
// MORE_BASE: 新しい種、MORE_CULTIVARS: 品種（既存の種への追加、または新しい種の品種）
// ※ 解説文はすべてオリジナル。特定外来生物は掲載しない。

const B = (id, ja, latin, o) => ({ id, ja, latin, wiki: o.wiki ?? latin.replace(/ '.*$/, ''), leaf: 'green', tags: [], cut: 'after', div: 'spring', ...o });

export const MORE_BASE = [
  // ---- 早春の球根（3月の花の空白を埋める） ----
  B('galanthus', 'スノードロップ', 'Galanthus nivalis', { type: 'bulb', zone: [3, 8], heat: 7, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [10, 15], spread: 8, bloom: [2, 3], color: ['white'], form: 'daisy', tags: ['english', 'shade', 'natural'], price: 120, cut: 'none', div: 'spring', note: '落葉樹の下で毎年ふえる。花後すぐの株分けがよく根付く。' }),
  B('crocus', 'クロッカス・トマシニアヌス', 'Crocus tommasinianus', { type: 'bulb', zone: [3, 8], heat: 8, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [8, 10], spread: 8, bloom: [2, 3], color: ['purple'], form: 'daisy', tags: ['natural', 'pollinator', 'easy'], price: 50, cut: 'none', div: 'none', note: '原種系クロッカス。芝生や宿根草の間で自然にふえる。' }),
  B('chionodoxa', 'チオノドクサ', 'Chionodoxa forbesii', { wiki: 'Scilla forbesii', type: 'bulb', zone: [3, 8], heat: 8, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [10, 15], spread: 6, bloom: [3], color: ['blue'], form: 'daisy', tags: ['natural', 'easy'], price: 40, cut: 'none', div: 'none', note: '早春に星形の青い花。こぼれ種でじゅうたんのように広がる。' }),
  B('muscari', 'ムスカリ', 'Muscari armeniacum', { type: 'bulb', zone: [4, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['dry', 'mid'], h: [10, 20], spread: 8, bloom: [3, 4], color: ['blue'], form: 'spike', tags: ['easy', 'natural'], price: 40, cut: 'none', div: 'autumn', note: '植えっぱなしで毎年咲く。秋に葉が伸びるのも特徴。' }),
  B('narcissus', '原種系スイセン', 'Narcissus', { type: 'bulb', zone: [4, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['dry', 'mid'], h: [15, 35], spread: 10, bloom: [2, 3, 4], color: ['yellow'], form: 'daisy', tags: ['easy', 'natural', 'fragrant'], price: 60, cut: 'none', div: 'autumn', note: '葉は枯れるまで切らずに残すと翌年もよく咲く。全草有毒。' }),
  B('tulipa', '原種系チューリップ', 'Tulipa', { type: 'bulb', zone: [4, 8], heat: 8, humid: 1, sun: ['full'], moist: ['dry'], h: [10, 30], spread: 8, bloom: [3, 4], color: ['red', 'yellow', 'white', 'pink'], form: 'daisy', tags: ['natural', 'dry'], price: 60, cut: 'none', div: 'none', note: '小型で植えっぱなしにできる原種系。水はけのよい日向で。' }),
  B('camassia', 'カマシア', "Camassia leichtlinii 'Caerulea'", { type: 'bulb', zone: [4, 8], heat: 7, humid: 2, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [60, 90], spread: 15, bloom: [4, 5], color: ['blue'], form: 'spike', tags: ['prairie', 'natural', 'pollinator'], price: 150, cut: 'none', div: 'none', note: '湿った草原に咲く青い穂。宿根草が茂る前の主役。' }),
  B('fritillaria', 'フリチラリア・メレアグリス', 'Fritillaria meleagris', { type: 'bulb', zone: [4, 8], heat: 7, humid: 2, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [20, 30], spread: 8, bloom: [4], color: ['purple', 'white'], form: 'globe', tags: ['english', 'natural'], price: 80, cut: 'none', div: 'none', note: '市松模様の釣鐘形の花。湿り気のある草地に。' }),
  B('lilium', 'ユリ（日本のユリ）', 'Lilium auratum', { type: 'bulb', zone: [5, 8], heat: 8, humid: 2, sun: ['part', 'full'], moist: ['mid'], h: [100, 150], spread: 30, bloom: [7, 8], color: ['white'], form: 'daisy', tags: ['wa', 'fragrant'], price: 500, cut: 'after', div: 'none', note: '球根は深めに植え、株元は日陰、花は日向になる場所が理想。' }),

  // ---- 作庭家に好まれる宿根草 ----
  B('phlomis', 'フロミス', 'Phlomis russeliana', { type: 'herb', zone: [4, 9], heat: 9, humid: 2, sun: ['full', 'part'], moist: ['dry', 'mid'], h: [60, 90], spread: 60, bloom: [6, 7], color: ['yellow'], form: 'globe', tags: ['prairie', 'dry', 'natural'], price: 900, cut: 'spring', div: 'spring', note: '茎に段々に付く花が枯れても形を保ち、冬の庭の骨格になる。' }),
  B('pycnanthemum', 'ピクナンセマム', 'Pycnanthemum muticum', { type: 'herb', zone: [4, 8], heat: 8, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [60, 90], spread: 60, bloom: [7, 8, 9], color: ['white'], leaf: 'silver', form: 'plate', tags: ['prairie', 'pollinator', 'fragrant', 'natural'], price: 900, cut: 'spring', div: 'spring', note: '銀白色の苞に虫が群がる、送粉者に人気の植物。ミントの香り。' }),
  B('vernonia', 'ベルノニア', "Vernonia lettermannii 'Iron Butterfly'", { type: 'herb', zone: [4, 9], heat: 9, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [60, 90], spread: 60, bloom: [8, 9], color: ['purple'], form: 'plate', tags: ['prairie', 'pollinator', 'dry'], price: 1000, cut: 'spring', div: 'spring', note: '糸のように細い葉と濃紫の花。暑さと乾燥に強い。' }),
  B('gillenia', 'ギレニア', 'Gillenia trifoliata', { type: 'herb', zone: [4, 8], heat: 7, humid: 2, sun: ['part', 'full'], moist: ['mid'], h: [60, 90], spread: 60, bloom: [5, 6], color: ['white'], form: 'airy', tags: ['natural', 'english'], price: 1000, cut: 'spring', div: 'none', note: '赤い萼と白い星形の花が舞うように咲く。秋は紅葉。' }),
  B('angelica', 'アンゲリカ・ギガス', 'Angelica gigas', { type: 'herb', zone: [4, 8], heat: 7, humid: 2, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [100, 150], spread: 60, bloom: [8, 9], color: ['purple'], form: 'plate', tags: ['natural', 'pollinator'], price: 600, cut: 'none', div: 'none', note: '赤紫の大きな傘状の花。二年草〜短命で、こぼれ種で更新。' }),
  B('trifolium', 'トリフォリウム・ルベンス', 'Trifolium rubens', { type: 'herb', zone: [4, 8], heat: 7, humid: 2, sun: ['full'], moist: ['dry', 'mid'], h: [30, 45], spread: 40, bloom: [6, 7], color: ['pink', 'red'], form: 'spike', tags: ['prairie', 'pollinator', 'natural'], price: 700, cut: 'after', div: 'spring', note: 'クローバーの仲間。ふわふわの穂状の花が群れて咲く。' }),
  B('limonium', '宿根スターチス（リモニウム・プラティフィラム）', 'Limonium platyphyllum', { type: 'herb', zone: [3, 9], heat: 9, humid: 1, sun: ['full'], moist: ['dry'], h: [45, 60], spread: 50, bloom: [7, 8], color: ['purple'], form: 'airy', tags: ['dry'], price: 700, cut: 'none', div: 'none', note: '霞のような小花。ドライフラワーの定番。' }),
  B('ratibida', 'ラティビダ・ピンナタ', 'Ratibida pinnata', { type: 'herb', zone: [3, 9], heat: 9, humid: 2, sun: ['full'], moist: ['dry', 'mid'], h: [90, 150], spread: 45, bloom: [7, 8, 9], color: ['yellow'], form: 'daisy', tags: ['prairie', 'pollinator', 'dry'], price: 600, cut: 'spring', div: 'none', note: '垂れ下がる黄色い花弁と灰色の花芯。北米プレーリーの代表種。' }),
  B('parthenium', 'パルテニウム', 'Parthenium integrifolium', { type: 'herb', zone: [4, 8], heat: 8, humid: 2, sun: ['full'], moist: ['dry', 'mid'], h: [60, 90], spread: 45, bloom: [6, 7, 8, 9], color: ['white'], form: 'plate', tags: ['prairie', 'pollinator'], price: 900, cut: 'spring', div: 'none', note: '小さな白いボタンのような花房が長く続く。' }),
  B('molinia', 'モリニア', "Molinia caerulea subsp. arundinacea 'Transparent'", { wiki: 'Molinia caerulea', type: 'grass', zone: [4, 8], heat: 7, humid: 2, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [120, 180], spread: 50, bloom: [7, 8, 9], color: ['green'], form: 'grass', tags: ['prairie', 'natural'], price: 1000, cut: 'spring', div: 'spring', note: '細い花茎が高く伸び、向こう側が透けて見える。' }),
  B('sesleria', 'セスレリア・オータムナリス', 'Sesleria autumnalis', { type: 'grass', zone: [4, 8], heat: 8, humid: 2, sun: ['full', 'part'], moist: ['dry', 'mid'], h: [30, 45], spread: 35, bloom: [8, 9], color: ['white'], leaf: 'gold', form: 'grass', tags: ['prairie', 'natural', 'easy'], price: 900, cut: 'spring', div: 'spring', note: '明るい黄緑の葉。宿根草の間を埋める地模様のグラスとして優秀。' }),
  B('briza', '宿根コバンソウ（ブリザ・メディア）', 'Briza media', { type: 'grass', zone: [4, 8], heat: 7, humid: 2, sun: ['full'], moist: ['dry', 'mid'], h: [30, 60], spread: 30, bloom: [5, 6, 7], color: ['green'], form: 'grass', tags: ['natural', 'english'], price: 500, cut: 'after', div: 'spring', note: '小判形の穂が風に揺れる。ドライにしても形が残る。' }),
  B('stipa-gigantea', 'スティパ・ギガンテア', 'Stipa gigantea', { wiki: 'Celtica gigantea', type: 'grass', zone: [6, 9], heat: 7, humid: 1, sun: ['full'], moist: ['dry'], h: [150, 200], spread: 90, bloom: [6, 7, 8], color: ['yellow'], form: 'grass', tags: ['prairie', 'dry'], price: 1200, cut: 'leaves', div: 'none', note: '金色の大きな穂が光を受けて輝く。乾いた日向で。' }),
  B('eragrostis', 'エラグロスティス・スペクタビリス', 'Eragrostis spectabilis', { type: 'grass', zone: [5, 9], heat: 9, humid: 2, sun: ['full'], moist: ['dry'], h: [30, 60], spread: 40, bloom: [8, 9], color: ['pink'], form: 'grass', tags: ['prairie', 'dry'], price: 700, cut: 'spring', div: 'spring', note: '赤紫の霧のような穂。乾いた場所で。' }),
  B('papaver', 'オリエンタルポピー', 'Papaver orientale', { type: 'herb', zone: [3, 7], heat: 7, humid: 1, sun: ['full'], moist: ['dry', 'mid'], h: [60, 90], spread: 60, bloom: [5, 6], color: ['red', 'orange', 'pink', 'white'], form: 'daisy', tags: ['english'], price: 900, cut: 'after', div: 'none', note: '大輪の花の後は夏に地上部が消える。周りに後から茂る植物を。' }),
  B('centaurea', '宿根ヤグルマギク（セントーレア・モンタナ）', 'Centaurea montana', { type: 'herb', zone: [3, 8], heat: 7, humid: 2, sun: ['full', 'part'], moist: ['dry', 'mid'], h: [30, 60], spread: 45, bloom: [5, 6], color: ['blue'], form: 'daisy', tags: ['english', 'pollinator'], price: 500, cut: 'after', div: 'spring', note: '糸状の花弁が繊細な青い花。花後に刈ると返り咲く。' }),
  B('polemonium', 'ポレモニウム（ハナシノブ）', 'Polemonium caeruleum', { type: 'herb', zone: [3, 7], heat: 6, humid: 1, sun: ['part', 'full'], moist: ['mid'], h: [40, 60], spread: 40, bloom: [5, 6], color: ['blue'], form: 'airy', tags: ['english'], price: 600, cut: 'after', div: 'spring', note: 'はしご状の葉と青い小花。冷涼地向き。' }),
  B('clematis', '木立性クレマチス', 'Clematis integrifolia', { type: 'herb', zone: [3, 9], heat: 8, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [50, 80], spread: 60, bloom: [5, 6, 7, 8], color: ['blue'], form: 'daisy', tags: ['english', 'natural'], price: 1200, cut: 'spring', div: 'none', note: 'つるにならず、冬は地上部が枯れる宿根性のクレマチス。周りの植物にもたれて咲く。' }),
  B('chrysanthemum', '宿根の菊', "Chrysanthemum 'Clara Curtis'", { wiki: 'Chrysanthemum zawadskii', type: 'herb', zone: [4, 9], heat: 9, humid: 3, sun: ['full'], moist: ['mid'], h: [45, 60], spread: 45, bloom: [9, 10], color: ['pink'], form: 'daisy', tags: ['natural', 'pollinator', 'easy'], price: 600, cut: 'chelsea', div: 'spring', note: '秋の花壇の締めくくり。初夏の摘心でこんもり咲く。' }),
  B('filipendula', 'シモツケソウの仲間', 'Filipendula × purpurea', { wiki: 'Filipendula purpurea', type: 'herb', zone: [4, 8], heat: 7, humid: 2, sun: ['part', 'full'], moist: ['mid', 'wet'], h: [60, 100], spread: 50, bloom: [6, 7], color: ['pink'], form: 'plate', tags: ['wa', 'natural'], price: 700, cut: 'after', div: 'spring', note: '泡立つようなピンクの小花。湿り気のある半日陰を好む。' }),
  B('anemone-flaccida', 'ニリンソウ', 'Anemone flaccida', { type: 'herb', zone: [5, 8], heat: 7, humid: 2, sun: ['part', 'shade'], moist: ['mid', 'wet'], h: [15, 25], spread: 30, bloom: [4, 5], color: ['white'], form: 'daisy', tags: ['wa', 'shade', 'natural'], price: 400, cut: 'none', div: 'autumn', note: '春だけ地上に現れる「スプリング・エフェメラル」。落葉樹の下に。' }),
  B('convallaria', 'スズラン', 'Convallaria majalis', { type: 'herb', zone: [3, 8], heat: 7, humid: 2, sun: ['part', 'shade'], moist: ['mid'], h: [15, 25], spread: 30, bloom: [4, 5], color: ['white'], form: 'spike', tags: ['shade', 'fragrant', 'english'], price: 300, cut: 'none', div: 'autumn', note: '甘い香りの釣鐘形の花。全草有毒なので子どもやペットに注意。' }),
  B('adenophora', 'ツリガネニンジン', 'Adenophora triphylla var. japonica', { wiki: 'Adenophora triphylla', type: 'herb', zone: [4, 8], heat: 8, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [40, 100], spread: 30, bloom: [8, 9, 10], color: ['blue'], form: 'spike', tags: ['wa', 'natural'], price: 500, cut: 'spring', div: 'none', note: '秋の野に咲く淡い青の釣鐘。根が太く移植を嫌う。' }),
  B('asarum', 'カンアオイ', 'Asarum', { wiki: 'Asarum', type: 'herb', zone: [6, 9], heat: 9, humid: 3, sun: ['shade', 'part'], moist: ['mid'], h: [5, 15], spread: 25, bloom: [2, 3, 4], color: ['green'], leaf: 'variegated', form: 'mound', tags: ['wa', 'shade', 'evergreen'], price: 800, cut: 'none', div: 'spring', note: '模様のある常緑の葉を楽しむ。花は株元に隠れて咲く。' }),
  B('rohdea', 'オモト', 'Rohdea japonica', { type: 'herb', zone: [6, 10], heat: 10, humid: 3, sun: ['shade', 'part'], moist: ['mid'], h: [20, 40], spread: 30, bloom: [5, 6], color: ['green'], form: 'mound', tags: ['wa', 'shade', 'evergreen', 'easy'], price: 800, cut: 'none', div: 'spring', note: '冬に赤い実をつける常緑の縁起物。' }),
  B('pachysandra', 'フッキソウ', 'Pachysandra terminalis', { type: 'subshrub', zone: [4, 8], heat: 8, humid: 3, sun: ['shade', 'part'], moist: ['mid'], h: [15, 20], spread: 30, bloom: [4, 5], color: ['white'], form: 'mound', tags: ['wa', 'shade', 'evergreen', 'easy'], price: 250, cut: 'none', div: 'spring', note: '日陰の常緑グラウンドカバーの定番。' }),
  B('galium', 'クルマバソウ', 'Galium odoratum', { type: 'herb', zone: [4, 8], heat: 7, humid: 2, sun: ['shade', 'part'], moist: ['mid'], h: [15, 20], spread: 30, bloom: [4, 5], color: ['white'], form: 'mound', tags: ['shade', 'fragrant'], price: 400, cut: 'none', div: 'both', note: '乾かすと干し草のような甘い香りがする。日陰のグラウンドカバー。' }),

  // ---- ハーブ ----
  B('salvia-officinalis', 'セージ（コモンセージ）', 'Salvia officinalis', { type: 'subshrub', zone: [5, 9], heat: 8, humid: 1, sun: ['full'], moist: ['dry'], h: [40, 60], spread: 50, bloom: [5, 6], color: ['purple'], leaf: 'silver', form: 'spike', tags: ['fragrant', 'dry', 'pollinator'], price: 400, cut: 'after', div: 'none', note: '料理やお茶に。梅雨前に刈り込んで蒸れを防ぐ。' }),
  B('chives', 'チャイブ', 'Allium schoenoprasum', { type: 'bulb', zone: [3, 9], heat: 8, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [20, 40], spread: 25, bloom: [5, 6], color: ['pink', 'purple'], form: 'globe', tags: ['pollinator', 'easy'], price: 300, cut: 'after', div: 'both', note: '細い葉を料理に。花もサラダに使える。' }),
  B('allium-tuberosum', 'ニラ（花ニラ）', 'Allium tuberosum', { type: 'bulb', zone: [4, 10], heat: 10, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [30, 50], spread: 25, bloom: [8, 9], color: ['white'], form: 'globe', tags: ['pollinator', 'easy', 'wa'], price: 200, cut: 'after', div: 'spring', note: '晩夏に白い花火のような花。こぼれ種でふえやすいので花がらは摘む。' }),
  B('fennel', 'フェンネル', 'Foeniculum vulgare', { type: 'herb', zone: [4, 9], heat: 9, humid: 2, sun: ['full'], moist: ['dry', 'mid'], h: [100, 180], spread: 60, bloom: [6, 7, 8], color: ['yellow'], form: 'plate', tags: ['pollinator', 'natural', 'fragrant'], price: 400, cut: 'spring', div: 'none', note: '糸状の葉と黄色い傘状の花。キアゲハの幼虫の食草。' }),
  B('melissa', 'レモンバーム', 'Melissa officinalis', { type: 'herb', zone: [4, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [30, 60], spread: 45, bloom: [6, 7], color: ['white'], form: 'mound', tags: ['fragrant', 'easy', 'pollinator'], price: 300, cut: 'after', div: 'both', note: 'レモンの香りの葉でハーブティーに。こぼれ種でふえる。' }),
  B('mentha', 'ミント', 'Mentha', { wiki: 'Mentha', type: 'herb', zone: [3, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [30, 60], spread: 45, bloom: [7, 8], color: ['white', 'purple'], form: 'spike', tags: ['fragrant', 'easy', 'pollinator'], price: 250, cut: 'after', div: 'both', note: '地下茎で猛烈に広がるので、鉢やプランターごと埋めて植えるのが鉄則。' }),
  B('chamaemelum', 'ローマンカモミール', 'Chamaemelum nobile', { type: 'herb', zone: [4, 9], heat: 7, humid: 1, sun: ['full'], moist: ['dry', 'mid'], h: [10, 30], spread: 30, bloom: [5, 6], color: ['white'], form: 'mound', tags: ['fragrant', 'english'], price: 350, cut: 'after', div: 'spring', note: '踏むとリンゴのような香り。蒸れに弱いので水はけよく。' }),
  B('hyssopus', 'ヒソップ', 'Hyssopus officinalis', { type: 'subshrub', zone: [4, 9], heat: 8, humid: 2, sun: ['full'], moist: ['dry'], h: [40, 60], spread: 40, bloom: [6, 7, 8, 9], color: ['blue'], form: 'spike', tags: ['pollinator', 'fragrant', 'dry'], price: 400, cut: 'spring', div: 'none', note: '青い穂に蜂がよく集まる。' }),
  B('tanacetum', 'フィーバーフュー', 'Tanacetum parthenium', { type: 'herb', zone: [4, 9], heat: 8, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [30, 60], spread: 30, bloom: [5, 6, 7], color: ['white'], form: 'daisy', tags: ['english', 'easy', 'fragrant'], price: 300, cut: 'after', div: 'none', note: '白い小菊がこぼれ種であちこちに咲く。葉に独特の香り。' }),
  B('saponaria', 'ソープワート', 'Saponaria officinalis', { type: 'herb', zone: [3, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [40, 70], spread: 45, bloom: [6, 7, 8, 9], color: ['pink'], form: 'plate', tags: ['easy', 'natural', 'fragrant'], price: 400, cut: 'after', div: 'spring', note: '葉や根をもむと泡が立ち、昔は石けんの代わりにされた。地下茎で広がる。' }),
  B('symphytum', 'コンフリー', 'Symphytum officinale', { type: 'herb', zone: [4, 9], heat: 8, humid: 3, sun: ['part', 'full'], moist: ['mid', 'wet'], h: [60, 100], spread: 60, bloom: [5, 6], color: ['purple'], form: 'mound', tags: ['pollinator', 'easy'], price: 400, cut: 'after', div: 'none', note: '葉は堆肥や液肥の材料に。食用は国が禁止しているので食べないこと。' }),
  B('ruta', 'ルー', 'Ruta graveolens', { type: 'subshrub', zone: [4, 9], heat: 8, humid: 2, sun: ['full'], moist: ['dry'], h: [40, 60], spread: 40, bloom: [6, 7], color: ['yellow'], leaf: 'blue', form: 'mound', tags: ['dry'], price: 400, cut: 'spring', div: 'none', note: '青みのある美しい葉。汁が肌に付いて日光に当たると炎症を起こすので手袋を。' }),
  B('helichrysum', 'カレープラント', 'Helichrysum italicum', { type: 'subshrub', zone: [7, 10], heat: 9, humid: 1, sun: ['full'], moist: ['dry'], h: [30, 60], spread: 50, bloom: [6, 7], color: ['yellow'], leaf: 'silver', form: 'plate', tags: ['dry', 'fragrant', 'evergreen'], price: 400, cut: 'after', div: 'none', note: '銀葉にカレーのような香り。黄色い花はドライフラワーに。' }),
  B('cymbopogon', 'レモングラス', 'Cymbopogon citratus', { type: 'grass', zone: [9, 11], heat: 11, humid: 3, sun: ['full'], moist: ['mid'], h: [80, 120], spread: 60, bloom: [9], color: ['green'], form: 'grass', tags: ['fragrant'], price: 400, cut: 'spring', div: 'spring', note: 'レモンの香りの葉をお茶や料理に。寒冷地は鉢上げして冬越し。' }),
  B('zingiber', 'ミョウガ', 'Zingiber mioga', { type: 'herb', zone: [7, 10], heat: 10, humid: 3, sun: ['part', 'shade'], moist: ['mid', 'wet'], h: [40, 100], spread: 40, bloom: [8, 9], color: ['yellow'], form: 'mound', tags: ['wa', 'shade', 'easy'], price: 400, cut: 'spring', div: 'spring', note: '株元から出る花穂を食べる。半日陰の湿った場所でよくふえる。' }),
  B('petasites', 'フキ', 'Petasites japonicus', { type: 'herb', zone: [5, 9], heat: 9, humid: 3, sun: ['part', 'shade'], moist: ['wet'], h: [30, 60], spread: 60, bloom: [2, 3], color: ['white', 'green'], form: 'mound', tags: ['wa', 'shade', 'easy'], price: 300, cut: 'none', div: 'spring', note: '早春のフキノトウ、初夏のフキと季節の味が楽しめる。地下茎で広がる。' }),
  B('houttuynia', "ドクダミ‘カメレオン’", "Houttuynia cordata 'Chameleon'", { type: 'herb', zone: [5, 10], heat: 10, humid: 3, sun: ['part', 'shade', 'full'], moist: ['mid', 'wet'], h: [15, 30], spread: 40, bloom: [6], color: ['white'], leaf: 'variegated', form: 'mound', tags: ['shade', 'wa'], price: 300, cut: 'none', div: 'spring', note: '赤・黄・緑の斑入り葉。乾燥葉は「十薬」としてお茶に。非常に広がるので場所を区切って。' }),
  B('fragaria', 'ワイルドストロベリー', 'Fragaria vesca', { type: 'herb', zone: [4, 9], heat: 8, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [15, 20], spread: 30, bloom: [4, 5, 6, 7, 8, 9, 10], color: ['white'], form: 'mound', tags: ['easy', 'english'], price: 300, cut: 'none', div: 'both', note: '小さな甘い実が長く収穫できる。縁取りやグラウンドカバーに。' }),

  // ---- 小低木 ----
  B('hydrangea-arb', 'アメリカノリノキ（アナベル系）', "Hydrangea arborescens 'Annabelle'", { type: 'shrub', zone: [3, 9], heat: 9, humid: 3, sun: ['part', 'full'], moist: ['mid', 'wet'], h: [100, 150], spread: 120, bloom: [6, 7], color: ['white'], form: 'globe', tags: ['english', 'natural', 'easy'], price: 1200, cut: 'spring', div: 'none', note: '春に地際近くで切っても、その年の枝に花が咲く。ドライにも。' }),
  B('hydrangea-serrata', 'ヤマアジサイ', 'Hydrangea serrata', { type: 'shrub', zone: [6, 9], heat: 8, humid: 3, sun: ['part', 'shade'], moist: ['mid'], h: [60, 100], spread: 80, bloom: [6, 7], color: ['blue'], form: 'plate', tags: ['wa', 'shade'], price: 1200, cut: 'after', div: 'none', note: '日本の山に自生する小型のアジサイ。剪定は花後すぐに。' }),
  B('hydrangea-quercifolia', 'カシワバアジサイ', 'Hydrangea quercifolia', { type: 'shrub', zone: [5, 9], heat: 9, humid: 3, sun: ['part', 'full'], moist: ['mid'], h: [100, 200], spread: 150, bloom: [6, 7], color: ['white'], form: 'spike', tags: ['english', 'natural'], price: 1800, cut: 'after', div: 'none', note: '円錐形の花と、カシワのような葉の紅葉が見事。' }),
  B('hydrangea-paniculata', 'ノリウツギ', "Hydrangea paniculata", { type: 'shrub', zone: [3, 8], heat: 8, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [150, 200], spread: 150, bloom: [7, 8, 9], color: ['white'], form: 'spike', tags: ['natural', 'wa', 'easy'], price: 1500, cut: 'spring', div: 'none', note: '夏の円錐形の花が秋に色づき、そのままドライになる。早春に剪定。' }),
  B('buddleja', 'ブッドレア', 'Buddleja davidii', { type: 'shrub', zone: [5, 9], heat: 9, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [150, 300], spread: 150, bloom: [7, 8, 9, 10], color: ['purple'], form: 'spike', tags: ['pollinator', 'fragrant'], price: 800, cut: 'spring', div: 'none', note: '「バタフライブッシュ」と呼ばれるほど蝶が集まる。種が飛んで野生化しないよう花がらを摘む。' }),
  B('caryopteris', 'カリオプテリス', "Caryopteris × clandonensis", { type: 'shrub', zone: [5, 9], heat: 9, humid: 2, sun: ['full'], moist: ['dry'], h: [60, 90], spread: 80, bloom: [8, 9, 10], color: ['blue'], form: 'airy', tags: ['pollinator', 'dry', 'fragrant'], price: 800, cut: 'spring', div: 'none', note: '晩夏に青い霞のような花。早春に低く切り戻す。' }),
  B('spiraea', 'シモツケ', 'Spiraea japonica', { type: 'shrub', zone: [4, 9], heat: 8, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [50, 100], spread: 80, bloom: [5, 6], color: ['pink'], form: 'plate', tags: ['wa', 'easy'], price: 600, cut: 'spring', div: 'none', note: '日本原産。カラーリーフの品種も多く、宿根草とよくなじむ。' }),
  B('spiraea-thunbergii', 'ユキヤナギ', 'Spiraea thunbergii', { type: 'shrub', zone: [4, 8], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [100, 200], spread: 150, bloom: [3, 4], color: ['white'], form: 'airy', tags: ['wa', 'easy'], price: 700, cut: 'after', div: 'none', note: '早春に枝垂れる枝いっぱいの白花。花後すぐに剪定。' }),
  B('deutzia', 'ヒメウツギ', 'Deutzia gracilis', { type: 'shrub', zone: [5, 8], heat: 8, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [50, 80], spread: 80, bloom: [4, 5], color: ['white'], form: 'airy', tags: ['wa', 'natural', 'easy'], price: 700, cut: 'after', div: 'none', note: '小型で庭に使いやすいウツギ。初夏に白い小花。' }),
  B('callicarpa', 'コムラサキ', 'Callicarpa dichotoma', { type: 'shrub', zone: [5, 8], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [100, 150], spread: 120, bloom: [7], color: ['pink'], form: 'airy', tags: ['wa', 'natural', 'pollinator'], price: 800, cut: 'spring', div: 'none', note: '秋に紫の実が枝いっぱいに。野鳥も訪れる。' }),
  B('physocarpus', 'アメリカテマリシモツケ', "Physocarpus opulifolius", { type: 'shrub', zone: [3, 7], heat: 7, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [150, 250], spread: 150, bloom: [5, 6], color: ['white'], leaf: 'bronze', form: 'plate', tags: ['english', 'natural'], price: 1500, cut: 'after', div: 'none', note: 'カラーリーフの低木。宿根草の背景に。' }),
  B('hypericum', 'ヒペリカム', "Hypericum 'Hidcote'", { type: 'shrub', zone: [6, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [60, 100], spread: 90, bloom: [6, 7], color: ['yellow'], form: 'daisy', tags: ['easy'], price: 600, cut: 'spring', div: 'none', note: '初夏に明るい黄色の花。半常緑で丈夫。' }),
  B('abelia', 'アベリア‘カレイドスコープ’', "Abelia × grandiflora 'Kaleidoscope'", { type: 'shrub', zone: [6, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [60, 90], spread: 90, bloom: [6, 7, 8, 9, 10], color: ['white'], leaf: 'gold', form: 'mound', tags: ['easy', 'evergreen', 'pollinator', 'fragrant'], price: 900, cut: 'spring', div: 'none', note: '黄色い斑入り葉が秋冬に赤く色づく。花期が長い。' }),
  B('vitex', 'セイヨウニンジンボク', 'Vitex agnus-castus', { type: 'shrub', zone: [6, 9], heat: 10, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [150, 300], spread: 200, bloom: [7, 8, 9], color: ['blue'], form: 'spike', tags: ['pollinator', 'fragrant'], price: 1200, cut: 'spring', div: 'none', note: '真夏に青紫の穂。暑さに強い。' }),

  // ---- シダ ----
  B('athyrium', 'ニシキシダ‘ピクタム’', "Athyrium niponicum 'Pictum'", { type: 'fern', zone: [4, 8], heat: 8, humid: 2, sun: ['part', 'shade'], moist: ['mid', 'wet'], h: [30, 45], spread: 45, bloom: [], color: ['green'], leaf: 'silver', form: 'fern', tags: ['shade', 'wa'], price: 700, cut: 'leaves', div: 'spring', note: '銀色と赤紫を帯びた葉。日陰を明るくする日本原産のシダ。' }),
  B('dryopteris', 'ベニシダ', 'Dryopteris erythrosora', { type: 'fern', zone: [5, 9], heat: 9, humid: 3, sun: ['part', 'shade'], moist: ['mid'], h: [40, 60], spread: 45, bloom: [], color: ['green'], leaf: 'bronze', form: 'fern', tags: ['shade', 'wa', 'evergreen', 'easy'], price: 600, cut: 'leaves', div: 'spring', note: '新芽が赤く色づく常緑のシダ。' }),
  B('matteuccia', 'クサソテツ（コゴミ）', 'Matteuccia struthiopteris', { type: 'fern', zone: [3, 7], heat: 6, humid: 2, sun: ['part', 'shade'], moist: ['wet'], h: [60, 120], spread: 60, bloom: [], color: ['green'], form: 'fern', tags: ['shade', 'wa'], price: 500, cut: 'leaves', div: 'spring', note: '春の新芽「コゴミ」は山菜。湿った半日陰で大きく育つ。' }),
  B('adiantum', 'クジャクシダ', 'Adiantum pedatum', { type: 'fern', zone: [3, 8], heat: 7, humid: 2, sun: ['shade', 'part'], moist: ['mid'], h: [30, 60], spread: 40, bloom: [], color: ['green'], form: 'fern', tags: ['shade', 'wa'], price: 700, cut: 'leaves', div: 'spring', note: '孔雀が羽を広げたような繊細な葉。黒い茎も美しい。' }),
  B('equisetum', 'トクサ', 'Equisetum hyemale', { type: 'fern', zone: [4, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['wet'], h: [60, 100], spread: 30, bloom: [], color: ['green'], form: 'grass', tags: ['wa', 'evergreen'], price: 400, cut: 'none', div: 'spring', note: '和の庭の定番。地下茎で広がるので鉢やコンクリートで区切って。' }),
];

export const MORE_CULTIVARS = {
  // ---- 新しい種の品種 ----
  muscari: { group: 'ムスカリ', list: [
    { cv: 'アルメニアカム', en: 'armeniacum', ja: 'ムスカリ・アルメニアカム' },
    { cv: 'バレリーフィニス', en: 'Valerie Finnis', color: ['blue'], note: '淡い空色。' },
    { cv: 'ボトリオイデス・アルバム', en: 'botryoides Album', ja: 'ムスカリ・ボトリオイデス‘アルバム’', latin: "Muscari botryoides 'Album'", color: ['white'], note: '白花。' },
  ] },
  narcissus: { group: 'スイセン', list: [
    { cv: 'ティタテート', en: 'Tête-à-tête', h: [15, 20], bloom: [2, 3], note: '小型で花数が多い早咲き。' },
    { cv: 'タリア', en: 'Thalia', color: ['white'], h: [30, 35], bloom: [3, 4], note: '純白で香りのよい房咲き。' },
    { cv: 'ジョンキル', en: 'jonquilla', ja: 'ジョンキル（キズイセン）', latin: 'Narcissus jonquilla', color: ['yellow'], h: [25, 35], bloom: [3, 4], note: '甘い香りが強い。' },
    { cv: 'ニホンズイセン', en: 'tazetta chinensis', ja: 'ニホンズイセン', latin: 'Narcissus tazetta var. chinensis', wiki: 'Narcissus tazetta', color: ['white'], h: [20, 40], bloom: [12, 1, 2], zone: [7, 10], tags: ['wa', 'fragrant', 'easy'], note: '冬に咲く香りの強い房咲き。海辺の斜面に群生する。' },
  ] },
  tulipa: { group: '原種系チューリップ', list: [
    { cv: 'クルシアナ‘レディジェーン’', en: 'Lady Jane', ja: "チューリップ・クルシアナ‘レディジェーン’", latin: "Tulipa clusiana 'Lady Jane'", color: ['white', 'red'], h: [20, 30], note: '外側が赤、内側が白の細身の花。' },
    { cv: 'リトルビューティー', en: 'Little Beauty', ja: "チューリップ‘リトルビューティー’", color: ['pink'], h: [10, 15], note: 'ローズピンクに青い目の小型種。' },
    { cv: 'シルベストリス', en: 'sylvestris', ja: 'チューリップ・シルベストリス', latin: 'Tulipa sylvestris', color: ['yellow'], h: [20, 30], tags: ['natural', 'fragrant'], humid: 2, note: '香りのある黄花。半日陰にも耐えて広がる。' },
    { cv: 'タルダ', en: 'tarda', ja: 'チューリップ・タルダ', latin: 'Tulipa tarda', color: ['yellow', 'white'], h: [10, 15], note: '星形に開く黄と白の花。' },
  ] },
  lilium: { group: 'ユリ（日本のユリ）', list: [
    { cv: 'ヤマユリ', en: 'auratum', ja: 'ヤマユリ' },
    { cv: 'カノコユリ', en: 'speciosum', ja: 'カノコユリ', latin: 'Lilium speciosum', wiki: 'Lilium speciosum', color: ['pink'], bloom: [8], h: [80, 120], note: '鹿の子模様の反り返った花。' },
    { cv: 'ササユリ', en: 'japonicum', ja: 'ササユリ', latin: 'Lilium japonicum', wiki: 'Lilium japonicum', color: ['pink'], bloom: [6, 7], h: [50, 100], heat: 7, note: '淡いピンクの気品ある花。栽培はやや難しい。' },
  ] },
  phlomis: { group: 'フロミス', list: [
    { cv: 'ルッセリアナ', en: 'russeliana', ja: 'フロミス・ルッセリアナ' },
    { cv: 'アマゾン', en: 'Amazone', ja: "フロミス・ツベローサ‘アマゾン’", latin: "Phlomis tuberosa 'Amazone'", color: ['pink'], h: [90, 150], bloom: [6, 7], note: '濃い茎にピンクの花が段々に付く。' },
  ] },
  vernonia: { group: 'ベルノニア', list: [
    { cv: 'アイアンバタフライ', en: 'Iron Butterfly' },
    { cv: 'マムート', en: 'Mammuth', ja: "ベルノニア・アルカンサナ‘マムート’", latin: "Vernonia arkansana 'Mammuth'", h: [150, 200], spread: 90, note: '背丈を超える大型種。広い庭の背景に。' },
  ] },
  molinia: { group: 'モリニア', list: [
    { cv: 'トランスペアレント', en: 'Transparent' },
    { cv: 'モールヘクセ', en: 'Moorhexe', ja: "モリニア・カエルレア‘モールヘクセ’", latin: "Molinia caerulea 'Moorhexe'", h: [60, 90], spread: 40, note: '直立する小型の品種。' },
    { cv: 'バリエガータ', en: 'Variegata', ja: "モリニア・カエルレア‘バリエガータ’", latin: "Molinia caerulea 'Variegata'", leaf: 'variegated', h: [40, 60], spread: 40, note: 'クリーム色の縞斑。' },
  ] },
  papaver: { group: 'オリエンタルポピー', list: [
    { cv: 'ビューティーオブリバーミア', en: 'Beauty of Livermere', color: ['red'] },
    { cv: 'パティズプラム', en: "Patty's Plum", color: ['purple'], note: '珍しいくすんだプラム色。' },
    { cv: 'ロイヤルウェディング', en: 'Royal Wedding', color: ['white'], note: '白に黒い目。' },
  ] },
  clematis: { group: '木立性クレマチス', list: [
    { cv: 'インテグリフォリア', en: 'integrifolia', ja: 'クレマチス・インテグリフォリア' },
    { cv: 'アラベラ', en: 'Arabella', ja: "クレマチス‘アラベラ’", latin: "Clematis 'Arabella'", color: ['blue', 'purple'], bloom: [6, 7, 8, 9], note: '花期が長く、周りの植物の間を縫うように咲く。' },
    { cv: 'デュランディ', en: 'Durandii', ja: "クレマチス‘デュランディ’", latin: "Clematis × diversifolia 'Durandii'", color: ['blue'], h: [100, 150], note: '深い藍色の大輪。' },
  ] },
  chrysanthemum: { group: '宿根の菊', list: [
    { cv: 'クララカーティス', en: 'Clara Curtis', ja: "宿根菊‘クララカーティス’" },
    { cv: 'リュウノウギク', en: 'makinoi', ja: 'リュウノウギク', latin: 'Chrysanthemum makinoi', wiki: 'Chrysanthemum makinoi', color: ['white'], bloom: [10, 11], h: [30, 60], tags: ['wa', 'natural', 'fragrant'], note: '晩秋の野に咲く白い野菊。葉に樟脳のような香り。' },
    { cv: '小菊（伝統品種）', en: 'morifolium', ja: '小菊', latin: 'Chrysanthemum × morifolium', wiki: 'Chrysanthemum × morifolium', color: ['yellow', 'white', 'pink', 'red'], bloom: [10, 11], tags: ['wa', 'easy'], note: '日本の秋の定番。挿し芽で簡単にふやせる。' },
  ] },
  filipendula: { group: 'シモツケソウの仲間', list: [
    { cv: 'キョウガノコ', en: 'purpurea', ja: 'キョウガノコ' },
    { cv: 'シモツケソウ', en: 'multijuga', ja: 'シモツケソウ', latin: 'Filipendula multijuga', h: [30, 80], note: '日本の山に自生する。' },
    { cv: 'ベヌスタ', en: 'Venusta', ja: "フィリペンデュラ・ルブラ‘ベヌスタ’", latin: "Filipendula rubra 'Venusta'", h: [150, 200], spread: 80, sun: ['full', 'part'], tags: ['prairie', 'natural'], note: '「草原の女王」と呼ばれる大型種。' },
  ] },
  'salvia-officinalis': { group: 'セージ', list: [
    { cv: 'コモンセージ', en: 'officinalis', ja: 'セージ（コモンセージ）' },
    { cv: 'パープラセンス', en: 'Purpurascens', ja: "セージ‘パープラセンス’", leaf: 'bronze', note: '紫を帯びた葉。' },
    { cv: 'イクテリナ', en: 'Icterina', ja: "セージ‘イクテリナ’", leaf: 'gold', note: '黄色の斑入り葉。' },
    { cv: 'トリカラー', en: 'Tricolor', ja: "セージ‘トリカラー’", leaf: 'variegated', note: '白・ピンク・緑の3色の葉。' },
  ] },
  fennel: { group: 'フェンネル', list: [
    { cv: 'グリーン', en: 'vulgare', ja: 'フェンネル' },
    { cv: 'ブロンズフェンネル', en: 'Purpureum', ja: 'ブロンズフェンネル', leaf: 'bronze', note: '銅色の糸状の葉が美しく、観賞用にも人気。' },
  ] },
  mentha: { group: 'ミント', list: [
    { cv: 'スペアミント', en: 'spicata', ja: 'スペアミント', latin: 'Mentha spicata', wiki: 'Mentha spicata' },
    { cv: 'アップルミント', en: 'suaveolens', ja: 'アップルミント', latin: 'Mentha suaveolens', wiki: 'Mentha suaveolens', leaf: 'silver', note: '丸く柔らかい葉。リンゴのような香り。' },
    { cv: 'ペパーミント', en: 'piperita', ja: 'ペパーミント', latin: 'Mentha × piperita', wiki: 'Peppermint', leaf: 'bronze', color: ['purple'], note: '清涼感の強い香り。' },
    { cv: 'ニホンハッカ', en: 'canadensis', ja: 'ニホンハッカ', latin: 'Mentha canadensis', wiki: 'Mentha canadensis', tags: ['fragrant', 'easy', 'wa'], note: 'かつて日本の一大産業だった和種ハッカ。' },
  ] },
  'hydrangea-arb': { group: 'アメリカノリノキ', list: [
    { cv: 'アナベル', en: 'Annabelle' },
    { cv: 'インクレディボール', en: 'Incrediball', note: '花が大きく、茎が太く倒れにくい。' },
    { cv: 'ピンクアナベル', en: 'Invincibelle Spirit', ja: "アメリカノリノキ‘ピンクアナベル’", color: ['pink'], note: 'ピンク花のアナベル。' },
  ] },
  'hydrangea-serrata': { group: 'ヤマアジサイ', list: [
    { cv: '藍姫', en: 'Aihime', ja: 'ヤマアジサイ‘藍姫’', color: ['blue'], note: '濃い青の手まり咲き。' },
    { cv: '紅（くれない）', en: 'Kurenai', ja: 'ヤマアジサイ‘紅’', color: ['white', 'red'], note: '白から深紅に色が変わる。' },
    { cv: '七段花', en: 'Shichidanka', ja: 'ヤマアジサイ‘七段花’', color: ['blue'], note: '八重の装飾花が段になって咲く。シーボルトが紹介したことで知られる。' },
    { cv: 'クロヒメ', en: 'Kurohime', ja: 'ヤマアジサイ‘クロヒメ’', color: ['blue', 'purple'], note: '黒い茎に濃い青紫の花。' },
  ] },
  'hydrangea-quercifolia': { group: 'カシワバアジサイ', list: [
    { cv: '一重', en: 'quercifolia', ja: 'カシワバアジサイ（一重）' },
    { cv: 'スノーフレーク', en: 'Snowflake', ja: "カシワバアジサイ‘スノーフレーク’", note: '八重咲き。花房が重く垂れる。' },
    { cv: 'ルビースリッパーズ', en: 'Ruby Slippers', ja: "カシワバアジサイ‘ルビースリッパーズ’", color: ['white', 'pink'], h: [80, 120], spread: 120, note: '小型で、花が白から濃いピンクへ変わる。' },
  ] },
  'hydrangea-paniculata': { group: 'ノリウツギ', list: [
    { cv: 'ライムライト', en: 'Limelight', color: ['green', 'white'], note: 'ライムグリーンから白、秋はピンクに変わる。' },
    { cv: 'ピンキーウィンキー', en: 'Pinky Winky', color: ['white', 'pink'], note: '先端が白、下からピンクに染まる。' },
    { cv: 'リトルライム', en: 'Little Lime', color: ['green', 'white'], h: [90, 120], spread: 120, note: 'ライムライトの小型版。' },
    { cv: 'ノリウツギ（在来）', en: 'paniculata', ja: 'ノリウツギ（在来種）', tags: ['wa', 'natural', 'pollinator'], note: '日本の山野のノリウツギ。装飾花がまばらで野趣がある。' },
  ] },
  buddleja: { group: 'ブッドレア', list: [
    { cv: 'ブラックナイト', en: 'Black Knight', color: ['purple'], note: '最も濃い紫の一つ。' },
    { cv: 'ホワイトプロフュージョン', en: 'White Profusion', color: ['white'], note: '白花。' },
    { cv: 'バズ', en: 'Buzz', h: [90, 120], spread: 90, color: ['purple', 'pink', 'white'], note: '小型の品種群。種ができにくい。' },
  ] },
  caryopteris: { group: 'カリオプテリス', list: [
    { cv: 'ヘブンリーブルー', en: 'Heavenly Blue' },
    { cv: 'ウースターゴールド', en: 'Worcester Gold', leaf: 'gold', note: '黄金葉と青い花の組み合わせ。' },
    { cv: 'ダンギク', en: 'incana', ja: 'ダンギク', latin: 'Caryopteris incana', wiki: 'Caryopteris incana', tags: ['wa', 'pollinator'], note: '九州などに自生。秋に花が段々に咲く。' },
  ] },
  spiraea: { group: 'シモツケ', list: [
    { cv: 'ゴールドフレーム', en: 'Goldflame', leaf: 'gold', note: '新芽が赤銅色、のちに黄金色の葉。' },
    { cv: 'リトルプリンセス', en: 'Little Princess', h: [40, 60], spread: 60, note: '小型でまとまる。' },
    { cv: '白花', en: 'Albiflora', ja: 'シモツケ（白花）', color: ['white'], note: '白花。' },
  ] },
  physocarpus: { group: 'アメリカテマリシモツケ', list: [
    { cv: 'ディアボロ', en: 'Diabolo' },
    { cv: 'ダーツゴールド', en: "Dart's Gold", leaf: 'gold', h: [100, 150], note: '明るい黄金葉。' },
    { cv: 'リトルデビル', en: 'Little Devil', h: [90, 120], spread: 90, note: '小型の銅葉。宿根草の間にも使いやすい。' },
  ] },
  athyrium: { group: 'シダ（アティリウム）', list: [
    { cv: 'ピクタム', en: 'Pictum', ja: "ニシキシダ‘ピクタム’" },
    { cv: 'ゴーストシダ', en: 'Ghost', ja: "アティリウム‘ゴースト’", latin: "Athyrium 'Ghost'", h: [60, 90], heat: 9, humid: 3, note: '銀白色で直立する大型の交配種。暑さにも強い。' },
  ] },
  crocosmia: { group: 'クロコスミア', list: [
    { cv: 'ルシファー', en: 'Lucifer', ja: "クロコスミア‘ルシファー’" },
    { cv: 'ジョージダビソン', en: 'George Davison', color: ['yellow', 'orange'], h: [60, 80], note: '黄橙色。' },
    { cv: 'ソルファテア', en: 'Solfatare', color: ['orange', 'yellow'], leaf: 'bronze', h: [50, 70], note: '銅葉にアプリコット色の花。' },
  ] },

  allium: { group: 'アリウム', list: [
    { cv: 'パープルセンセーション', en: 'Purple Sensation', ja: "アリウム‘パープルセンセーション’" },
    { cv: 'グローブマスター', en: 'Globemaster', ja: "アリウム‘グローブマスター’", latin: "Allium 'Globemaster'", h: [80, 100], price: 900, note: '直径20cmほどの巨大な球形の花。' },
    { cv: 'マウントエベレスト', en: 'Mount Everest', ja: "アリウム‘マウントエベレスト’", latin: "Allium 'Mount Everest'", color: ['white'], h: [80, 100], price: 400, note: '白い大きな球。' },
    { cv: 'クリストフィー', en: 'christophii', ja: 'アリウム・クリストフィー', latin: 'Allium christophii', wiki: 'Allium cristophii', h: [40, 60], bloom: [5, 6], price: 200, note: '金属光沢のある星形の花が集まる大きな球。ドライに最適。' },
    { cv: 'スファエロセファロン（ドラムスティック）', en: 'sphaerocephalon', ja: 'アリウム・スファエロセファロン', latin: 'Allium sphaerocephalon', wiki: 'Allium sphaerocephalon', color: ['red'], h: [50, 70], bloom: [6, 7], price: 40, note: '卵形の赤紫の小さな花。宿根草の間に散らすと効果的。' },
    { cv: 'サマービューティー', en: 'Summer Beauty', ja: "アリウム‘サマービューティー’", latin: "Allium 'Summer Beauty'", color: ['purple'], h: [40, 50], spread: 30, bloom: [6, 7, 8], heat: 9, humid: 3, price: 700, note: '株で増える宿根性のアリウム。花期が長い。' },
    { cv: 'ミレニアム', en: 'Millenium', ja: "アリウム‘ミレニアム’", latin: "Allium 'Millenium'", color: ['purple'], h: [30, 40], spread: 30, bloom: [7, 8], heat: 9, humid: 3, price: 800, note: '真夏に咲く株性のアリウム。蝶や蜂が集まる。' },
  ] },

  // ---- 既存の種に追加する品種（作庭家・愛好家に定番のもの） ----
  echinacea: { list: [
    { cv: 'ファタールアトラクション', en: 'Fatal Attraction', color: ['pink'], leaf: 'bronze', h: [60, 80], note: '黒い茎に鮮やかなマゼンタ。' },
    { cv: 'ヴァージン', en: 'Virgin', color: ['white'], h: [50, 70], note: '緑の花芯の白花。花弁が水平に開く。' },
    { cv: 'ホットパパイヤ', en: 'Hot Papaya', color: ['orange', 'red'], h: [60, 80], humid: 1, price: 1300, note: '八重のオレンジレッド。' },
    { cv: 'キムズニーハイ', en: "Kim's Knee High", color: ['pink'], h: [40, 60], spread: 40, note: '膝丈の小型ピンク。' },
  ] },
  'salvia-nemorosa': { list: [
    { cv: 'マイナハト（メイナイト）', en: 'Mainacht', ja: "サルビア・ネモローサ‘マイナハト’", latin: "Salvia × sylvestris 'Mainacht'", color: ['purple'], h: [45, 60], note: '濃い藍紫で早咲き。宿根サルビアの代表品種。' },
    { cv: 'アメジスト', en: 'Amethyst', color: ['pink', 'purple'], h: [60, 75], note: '紫がかったピンク。' },
    { cv: 'パープルレイン', en: 'Purple Rain', ja: "サルビア・ベルティキラータ‘パープルレイン’", latin: "Salvia verticillata 'Purple Rain'", color: ['purple'], h: [45, 60], bloom: [6, 7, 8, 9], note: '輪状に付く紫の花が長く咲く。' },
  ] },
  achillea: { list: [
    { cv: 'ワルターファンケ', en: 'Walther Funcke', color: ['red', 'orange'], h: [50, 60], note: 'レンガ色に黄色の目。' },
    { cv: 'クレド', en: 'Credo', color: ['yellow'], h: [80, 100], note: '淡いクリームイエローの大型種。' },
    { cv: 'サマーワイン', en: 'Summerwine', color: ['red'], h: [60, 75], note: '深いワインレッド。' },
  ] },
  persicaria: { list: [
    { cv: 'ブラックフィールド', en: 'Blackfield', ja: "ペルシカリア‘ブラックフィールド’", color: ['red'], note: '濃い黒赤の穂。' },
    { cv: 'オレンジフィールド', en: 'Orangofield', ja: "ペルシカリア‘オレンジフィールド’", color: ['orange', 'pink'], note: 'サーモンオレンジ。' },
  ] },
  veronicastrum: { list: [
    { cv: 'エリカ', en: 'Erica', color: ['pink'], h: [100, 120], note: '淡いピンクの穂。' },
  ] },
  anemone: { list: [
    { cv: 'クイーンシャーロット', en: 'Königin Charlotte', latin: "Anemone × hybrida 'Königin Charlotte'", color: ['pink'], h: [60, 90], note: 'ピンクの半八重。古くからの名品種。' },
  ] },
  hosta: { list: [
    { cv: 'エンプレスウー', en: 'Empress Wu', leaf: 'green', h: [100, 120], spread: 180, price: 3000, note: '世界最大級のギボウシ。' },
    { cv: 'ファイアーアンドアイス', en: 'Fire and Ice', leaf: 'variegated', h: [30, 40], price: 1200, note: '白い中斑に緑の縁取り。' },
  ] },
  miscanthus: { list: [
    { cv: 'マレパルトス', en: 'Malepartus', leaf: 'green', color: ['red'], h: [150, 200], note: '赤紫の穂が早く出る。' },
    { cv: 'ジルバーフェーダー', en: 'Silberfeder', leaf: 'green', h: [180, 220], note: '銀色の羽のような穂。' },
  ] },
  digitalis: { list: [
    { cv: 'ルテア', en: 'lutea', ja: 'ジギタリス・ルテア', latin: 'Digitalis lutea', wiki: 'Digitalis lutea', color: ['yellow'], h: [60, 80], heat: 7, note: '小さなクリームイエローの花が並ぶ多年性の種。' },
    { cv: 'パルビフローラ', en: 'parviflora', ja: 'ジギタリス・パルビフローラ', latin: 'Digitalis parviflora', wiki: 'Digitalis parviflora', color: ['orange'], h: [45, 60], note: 'チョコレート色の小花が密に付く棒状の穂。' },
  ] },
  'geranium-rozanne': { list: [
    { cv: 'パトリシア', en: 'Patricia', ja: "ゲラニウム‘パトリシア’", color: ['pink'], h: [60, 80], bloom: [6, 7, 8], note: '黒い目のマゼンタ。' },
    { cv: 'オリオン', en: 'Orion', ja: "ゲラニウム‘オリオン’", color: ['blue'], h: [50, 60], bloom: [6, 7, 8], heat: 7, note: '大輪の青紫。' },
  ] },
  rudbeckia: { list: [
    { cv: 'ヘンリーアイラーズ', en: 'Henry Eilers', ja: "ルドベキア・スブトメントーサ‘ヘンリーアイラーズ’", latin: "Rudbeckia subtomentosa 'Henry Eilers'", h: [120, 150], bloom: [8, 9, 10], tags: ['prairie', 'natural', 'pollinator'], note: '細く巻いた花弁がユニーク。' },
    { cv: 'マキシマ', en: 'maxima', ja: 'ルドベキア・マキシマ', latin: 'Rudbeckia maxima', wiki: 'Rudbeckia maxima', leaf: 'blue', h: [150, 200], bloom: [7, 8], tags: ['prairie', 'pollinator'], note: '青白い大きな葉と長い花芯。' },
  ] },
  dianthus: { list: [
    { cv: 'カルトゥジアノルム', en: 'carthusianorum', ja: 'ダイアンサス・カルトゥジアノルム', latin: 'Dianthus carthusianorum', wiki: 'Dianthus carthusianorum', color: ['pink'], leaf: 'green', h: [30, 60], bloom: [6, 7, 8], form: 'airy', tags: ['prairie', 'natural', 'dry'], note: '細い茎の先に小さな花が浮かぶ。宿根草の間に散らすとよく映える。' },
  ] },
  campanula: { list: [
    { cv: 'グロメラータ', en: 'glomerata', ja: 'カンパニュラ・グロメラータ（ヤツシロソウ）', latin: 'Campanula glomerata', wiki: 'Campanula glomerata', color: ['purple'], h: [40, 60], form: 'globe', heat: 7, note: '紫の花が頭頂に集まって咲く。' },
  ] },
  paeonia: { list: [
    { cv: 'ヤマシャクヤク', en: 'japonica', ja: 'ヤマシャクヤク', latin: 'Paeonia japonica', wiki: 'Paeonia japonica', color: ['white'], h: [30, 50], bloom: [4, 5], sun: ['part', 'shade'], tags: ['wa', 'shade'], price: 1500, note: '日本の落葉樹林に咲く白い一重。秋の実も美しい。' },
  ] },
  hemerocallis: { list: [
    { cv: 'ユウスゲ', en: 'citrina vespertina', ja: 'ユウスゲ', latin: 'Hemerocallis citrina var. vespertina', color: ['yellow'], h: [100, 150], tags: ['wa', 'fragrant', 'natural'], note: '夕方に開く香りのよいレモン色の花。' },
  ] },
  aquilegia: { list: [
    { cv: 'ヤマオダマキ', en: 'buergeriana', ja: 'ヤマオダマキ', latin: 'Aquilegia buergeriana', wiki: 'Aquilegia buergeriana', color: ['purple', 'yellow'], h: [30, 60], tags: ['wa', 'natural'], note: '茶紫と黄色の野趣ある花。' },
  ] },
  sedum: { list: [
    { cv: 'ミセバヤ', en: 'sieboldii', ja: 'ミセバヤ', latin: 'Hylotelephium sieboldii', wiki: 'Hylotelephium sieboldii', color: ['pink'], leaf: 'blue', h: [10, 20], bloom: [10, 11], form: 'mound', tags: ['wa', 'dry'], note: '垂れ下がる茎の先に晩秋のピンク。古典園芸植物。' },
  ] },
  ophiopogon: { group: 'ジャノヒゲの仲間', list: [
    { cv: 'タマリュウ', en: 'Nanus' },
    { cv: '黒竜', en: 'Nigrescens', ja: 'コクリュウ（黒竜）', latin: "Ophiopogon planiscapus 'Nigrescens'", leaf: 'bronze', h: [15, 20], spread: 20, color: ['pink'], note: '黒い葉のグラウンドカバー。明るい葉物と組み合わせて。' },
  ] },
  thymus: { group: 'タイム', list: [
    { cv: 'クリーピングタイム', en: 'serpyllum', ja: 'クリーピングタイム' },
    { cv: 'コモンタイム', en: 'vulgaris', ja: 'コモンタイム', latin: 'Thymus vulgaris', wiki: 'Thymus vulgaris', h: [20, 30], color: ['white', 'pink'], note: '料理用の立性タイム。' },
    { cv: 'レモンタイム', en: 'citriodorus', ja: 'レモンタイム', latin: 'Thymus × citriodorus', wiki: 'Thymus citriodorus', h: [15, 30], leaf: 'gold', note: 'レモンの香り。黄斑の品種もある。' },
    { cv: 'ロンギカウリス', en: 'longicaulis', ja: 'タイム・ロンギカウリス', latin: 'Thymus longicaulis', h: [5, 10], humid: 2, note: '暑さ・蒸れに比較的強いほふく性。' },
  ] },
  origanum: { list: [
    { cv: 'ワイルドオレガノ', en: 'vulgare', ja: 'オレガノ（ワイルドオレガノ）', latin: 'Origanum vulgare', color: ['pink'], leaf: 'green', note: '料理に使うオレガノ。花も観賞価値が高い。' },
    { cv: 'スイートマジョラム', en: 'majorana', ja: 'スイートマジョラム', latin: 'Origanum majorana', wiki: 'Marjoram', color: ['white'], leaf: 'silver', zone: [9, 10], h: [20, 40], form: 'mound', note: '甘い香りの料理用ハーブ。寒さに弱い。' },
  ] },
  calamintha: { group: 'カラミンサ', list: [
    { cv: 'ネペタ', en: 'nepeta', ja: 'カラミンサ・ネペタ' },
    { cv: 'ブルークラウド', en: 'Blue Cloud', color: ['blue'], note: '淡い青の小花。' },
    { cv: 'ホワイトクラウド', en: 'White Cloud', color: ['white'], note: '白の小花。' },
  ] },
  solidago: { group: 'ソリダゴ', list: [
    { cv: 'ファイヤーワークス', en: 'Fireworks', ja: "ソリダゴ‘ファイヤーワークス’" },
    { cv: 'ゴールデンベビー', en: 'Golden Baby', ja: "ソリダゴ‘ゴールデンベビー’", latin: "Solidago 'Golden Baby'", h: [50, 60], spread: 40, note: '小型で切り花にも使われる。' },
    { cv: 'アキノキリンソウ', en: 'virgaurea asiatica', ja: 'アキノキリンソウ', latin: 'Solidago virgaurea subsp. asiatica', wiki: 'Solidago virgaurea', h: [30, 80], tags: ['wa', 'natural', 'pollinator'], note: '日本の秋の野に咲く在来のソリダゴ。' },
  ] },
  asclepias: { group: 'アスクレピアス', list: [
    { cv: 'ツベローサ', en: 'tuberosa', ja: 'アスクレピアス・ツベローサ' },
    { cv: 'アイスバレエ', en: 'Ice Ballet', ja: "アスクレピアス・インカルナータ‘アイスバレエ’", latin: "Asclepias incarnata 'Ice Ballet'", color: ['white'], moist: ['mid', 'wet'], h: [90, 120], bloom: [7, 8], note: '湿った場所を好む白花。' },
    { cv: 'シンデレラ', en: 'Cinderella', ja: "アスクレピアス・インカルナータ‘シンデレラ’", latin: "Asclepias incarnata 'Cinderella'", color: ['pink'], moist: ['mid', 'wet'], h: [90, 120], bloom: [7, 8], note: '香りのよいピンク。' },
  ] },
  'iris-ensata': { list: [
    { cv: 'ノハナショウブ', en: 'spontanea', ja: 'ノハナショウブ', latin: 'Iris ensata var. spontanea', color: ['purple'], tags: ['wa', 'natural'], note: 'ハナショウブの原種。赤紫の野趣ある花。' },
  ] },
  'aster-ageratoides': { list: [
    { cv: 'ヨメナ', en: 'yomena', ja: 'ヨメナ', latin: 'Aster yomena', color: ['purple', 'white'], note: '若菜は「嫁菜飯」として食べられてきた。' },
  ] },
  gaura: { list: [
    { cv: 'ロージージェーン', en: 'Rosyjane', color: ['white', 'pink'], h: [60, 80], note: '白に濃いピンクの縁取り。' },
  ] },
  agastache: { list: [
    { cv: 'アニスヒソップ', en: 'foeniculum', ja: 'アニスヒソップ', latin: 'Agastache foeniculum', wiki: 'Agastache foeniculum', color: ['purple'], h: [60, 90], note: 'アニスの香りの葉でお茶に。蜂がよく集まる。' },
  ] },
};
