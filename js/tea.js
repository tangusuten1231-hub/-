// ハーブティー：材料（庭で採れるもの・買うもの）とレシピ。気分・用途で探せる。
// ※ レシピ・解説はすべてオリジナル。効能をうたうものではなく、香りと味を楽しむための目安。
// 体質・持病・服薬・妊娠中や授乳中の場合は医師に相談のこと。

/** 材料：group は図鑑の植物（庭で育てられるもの）。store は買う材料 */
export const INGREDIENTS = {
  mint: { ja: 'ミント', group: 'mentha', part: '葉', harvest: '5〜10月、花が咲く前の若い葉', dry: '風通しのよい日陰で、茎ごと吊るして' },
  lemonbalm: { ja: 'レモンバーム', group: 'melissa', part: '葉', harvest: '5〜9月、朝露が乾いた午前中', dry: '香りが飛びやすいので、生のほうがおすすめ' },
  chamomile: { ja: 'ジャーマンカモミール', group: 'matricaria', part: '花', harvest: '4〜6月、花びらが平らに開いた頃', dry: '花だけを摘み、ざるに広げて日陰で' },
  rchamomile: { ja: 'ローマンカモミール', group: 'chamaemelum', part: '花', harvest: '5〜7月', dry: '花を摘んで日陰で。苦みがあるので少なめに' },
  lavender: { ja: 'ラベンダー', group: 'lavender', part: '花穂', harvest: '6〜7月、穂の下の花が2〜3輪開いた頃', dry: '束ねて逆さに吊るす' },
  rosemary: { ja: 'ローズマリー', group: 'rosemary', part: '葉', harvest: '一年中（新芽がやわらかくておすすめ）', dry: '枝ごと吊るし、乾いたら葉をしごく' },
  thyme: { ja: 'タイム', group: 'thymus', part: '葉', harvest: '4〜10月', dry: '枝ごと乾かし、葉だけを保存' },
  sage: { ja: 'セージ', group: 'salvia-officinalis', part: '葉', harvest: '4〜10月', dry: '1枚ずつ広げて日陰で' },
  verbena: { ja: 'レモンバーベナ', group: 'aloysia', part: '葉', harvest: '6〜10月', dry: '乾かしても香りがよく残る' },
  lemongrass: { ja: 'レモングラス', group: 'cymbopogon', part: '葉', harvest: '7〜10月', dry: '2〜3cmに切って乾かす' },
  bergamot: { ja: 'モナルダ（ベルガモット）', group: 'monarda', part: '花・葉', harvest: '6〜8月', dry: '花と葉を日陰で' },
  anisehyssop: { ja: 'アガスターシェ', group: 'agastache', part: '葉・花', harvest: '6〜9月', dry: '日陰で' },
  calendula: { ja: 'カレンデュラ', group: 'calendula', part: '花びら', harvest: '3〜6月', dry: '花びらをはずして広げる' },
  rugosa: { ja: 'ハマナス', group: 'rosa-rugosa', part: '花びら・実', harvest: '花は5〜6月、実は8〜10月', dry: '花びらは日陰で。実は半分に割って種と毛を取る' },
  gallica: { ja: 'アポテカリーローズ', group: 'rosa-gallica', part: '花びら', harvest: '5〜6月、開きはじめ', dry: '日陰でカラカラに' },
  echinacea: { ja: 'エキナセア', group: 'echinacea', part: '花・葉', harvest: '7〜9月', dry: '花を刻んで乾かす' },
  shiso: { ja: '赤ジソ', group: 'perilla', part: '葉', harvest: '6〜8月', dry: '生の葉を使うのが一般的' },
  dokudami: { ja: 'ドクダミ', group: 'houttuynia', part: '葉・茎', harvest: '5〜6月、花の咲く頃', dry: 'よく乾かすと独特のにおいが消える' },
  tea: { ja: '茶葉（チャノキ）', group: 'camellia-sinensis', part: '新芽', harvest: '4〜5月、新芽の一芯二葉', dry: '蒸すか炒ってから揉み、乾かす' },
  fennel: { ja: 'フェンネル', group: 'fennel', part: '種', harvest: '8〜10月、種が茶色くなったら', dry: '花ごと紙袋に入れて乾かす' },
  elder: { ja: 'エルダーフラワー', group: 'sambucus', part: '花', harvest: '5〜6月', dry: '房ごと日陰で（茎・葉・未熟な実は使わない）' },
  stevia: { ja: 'ステビア', group: 'stevia', part: '葉', harvest: '7〜9月', dry: '乾かすと甘さが増す。ごく少量で甘い' },
  mallow: { ja: 'マロウ', group: 'malva', part: '花', harvest: '6〜8月', dry: '花をそっと乾かす（色が残る）' },
  mountainmint: { ja: 'マウンテンミント', group: 'pycnanthemum', part: '葉', harvest: '6〜9月', dry: '日陰で' },
  kuromoji: { ja: 'クロモジ', group: 'lindera', part: '枝・葉', harvest: '一年中（剪定枝）', dry: '細く刻んで乾かす' },
  goji: { ja: 'クコの実', group: 'lycium', part: '実', harvest: '9〜11月', dry: '天日でしっかり乾かす' },
  strawleaf: { ja: 'ワイルドストロベリーの葉', group: 'fragaria', part: '葉', harvest: '5〜9月', dry: '完全に乾かしてから使う（半乾きは避ける）' },
  ginger: { ja: 'ショウガ', group: 'ginger', part: '根', harvest: '9〜10月', dry: '薄切りにして乾かすと保存できる' },
  lemon: { ja: 'レモン', group: 'lemon', part: '果汁・皮', harvest: '10〜12月', dry: '皮は白い部分を除いて乾かす' },
  peppermint: { ja: 'ペパーミント', group: 'mentha', ids: ['mentha-piperita'], part: '葉', harvest: '5〜10月、花の前', dry: '茎ごと吊るして' },
  applemint: { ja: 'アップルミント', group: 'mentha', ids: ['mentha-suaveolens'], part: '葉', harvest: '5〜10月', dry: '茎ごと吊るして' },
  roselle: { ja: 'ローゼルの萼（がく）', group: 'roselle', part: '萼', harvest: '10〜11月、花が終わって赤くふくらんだ萼', dry: '中の実を除き、ざるで天日干し' },
  catnip: { ja: 'キャットニップ', group: 'nepeta', ids: ['nepeta-cataria'], part: '葉・花', harvest: '6〜8月', dry: '日陰で（猫に見つからない場所で）' },
  lemonthyme: { ja: 'レモンタイム', group: 'thymus', ids: ['thymus-citriodorus'], part: '葉', harvest: '4〜10月', dry: '枝ごと乾かす' },
  pinesage: { ja: 'パイナップルセージ', group: 'salvia-indigo', ids: ['salvia-indigo-elegans'], part: '葉・花', harvest: '7〜11月', dry: '生がおすすめ' },
  rosegeranium: { ja: 'ローズゼラニウム', group: 'rose-geranium', part: '葉', harvest: '一年中', dry: '1枚ずつ広げて日陰で' },
  yomogi: { ja: 'ヨモギ', group: 'artemisia', ids: ['artemisia-princeps'], part: '若葉', harvest: '3〜5月の若い芽先', dry: 'さっと洗って日陰で、パリパリになるまで' },
  hakka: { ja: 'ニホンハッカ', group: 'mentha', ids: ['mentha-canadensis'], part: '葉', harvest: '6〜9月', dry: '茎ごと吊るして' },
  kakidooshi: { ja: 'カキドオシ', group: 'kakidooshi', part: '葉・茎', harvest: '4〜5月、花の咲く頃', dry: '刻んで日陰で' },
  tulsi: { ja: 'ホーリーバジル', group: 'ocimum', ids: ['ocimum-tenuiflorum'], part: '葉・花穂', harvest: '7〜10月', dry: '日陰で' },
  violet: { ja: 'ニオイスミレの花', group: 'sweet-violet', part: '花', harvest: '2〜4月', dry: '生のまま浮かべて' },
  jasmine: { ja: 'マツリカの花', group: 'jasmine', part: '花', harvest: '6〜9月、夕方に開く花', dry: '花を摘んで日陰で' },
  orangepeel: { ja: 'オレンジピール', store: true },
  greentea: { ja: '緑茶', store: true },
  rooibos: { ja: 'ルイボス', store: true },
  hibiscus: { ja: 'ハイビスカス（ローゼル）', store: true },
  rosehip: { ja: 'ローズヒップ', store: true },
  blacktea: { ja: '紅茶', store: true },
  cinnamon: { ja: 'シナモン', store: true },
  honey: { ja: 'はちみつ', store: true },
  milk: { ja: '牛乳・豆乳', store: true },
};

export const MOODS = {
  relax: 'ほっとひと息',
  refresh: 'すっきりしたい',
  sleep: '眠る前に',
  morning: '朝の目覚めに',
  meal: '食後に',
  warm: '寒い日に温まる',
  focus: '集中したいとき',
  guest: 'おもてなし',
  iced: 'アイスティー向き',
  kids: 'カフェインなし・やさしい味',
  color: '色を楽しむ',
  season: '季節を味わう',
};

const R = (id, name, moods, ings, o) => ({ id, name, moods, ings: ings.map(([k, amt]) => ({ k, amt })), ...o });
/** temp: お湯の温度、time: 蒸らす時間、color: お茶の色 */
export const TEA_RECIPES = [
  R('fresh-mint', '摘みたてミントティー', ['refresh', 'meal', 'iced', 'kids'], [['mint', '生の葉 10〜15枚']], { temp: '95℃', time: '3〜5分', color: '#c9d98a', taste: '清涼感のある、すっきりした香り。', steps: ['ミントを茎ごと摘み、さっと洗う。', '手で軽くもんで香りを出し、ポットへ。', '熱湯を注いで3〜5分。'], tip: '暑い日は濃いめに淹れて、氷を入れたグラスに注ぐとアイスに。' }),
  R('balm-mint', 'レモンバームとミントのブレンド', ['relax', 'refresh', 'kids'], [['lemonbalm', '生の葉 10枚'], ['mint', '生の葉 5枚']], { temp: '95℃', time: '5分', color: '#d6dc9a', taste: 'レモンのような香りに、ミントのすっきり感。', steps: ['葉を軽くもんでポットへ。', '熱湯を注ぎ、ふたをして5分。'], tip: 'レモンバームは生のほうが香りが豊か。' }),
  R('chamo-milk', 'カモミールミルクティー', ['sleep', 'relax', 'kids'], [['chamomile', '乾燥花 大さじ1（生なら花15個）'], ['milk', '150ml'], ['honey', 'お好みで']], { temp: '少量の熱湯＋温めた牛乳', time: '3分＋1分', color: '#f0e3b8', taste: 'りんごのような甘い香りの、やさしいミルクティー。', steps: ['カモミールに少量の熱湯を注いで3分蒸らす。', '温めた牛乳を加えてさらに1分。', '茶こしでこし、はちみつを添える。'], tip: '牛乳は沸騰させないのがコツ。', caution: 'キク科アレルギーのある人は避けて。' }),
  R('chamo-lav', 'カモミールとラベンダーの夜のお茶', ['sleep', 'relax'], [['chamomile', '乾燥花 小さじ2'], ['lavender', '乾燥花 ひとつまみ']], { temp: '95℃', time: '4分', color: '#ecdca8', taste: 'やわらかな甘い香りに、ほのかなラベンダー。', steps: ['材料をポットに入れ、熱湯を注ぐ。', 'ふたをして4分。'], tip: 'ラベンダーは入れすぎると苦く、石けんのような香りになるのでひとつまみで。', caution: 'キク科アレルギーのある人は避けて。' }),
  R('rosemary-lemon', 'ローズマリーとレモン', ['morning', 'focus', 'refresh'], [['rosemary', '生の枝先 5cm'], ['lemon', '輪切り 1枚']], { temp: '95℃', time: '3分', color: '#dfe2a6', taste: '森のような力強い香りと、レモンの酸味。', steps: ['ローズマリーを軽くたたいてポットへ。', '熱湯を注いで3分、レモンを浮かべる。'], tip: '長く蒸らすと苦みが出るので短めに。', caution: '妊娠中は多量に飲まないで。' }),
  R('thyme-honey', 'タイムのはちみつ湯', ['warm', 'season'], [['thyme', '生の枝 3〜4本（乾燥なら小さじ1）'], ['honey', '小さじ1']], { temp: '95℃', time: '5分', color: '#e6d49a', taste: 'すっとした香りの、冬にうれしい一杯。', steps: ['タイムに熱湯を注ぎ5分。', '少し冷ましてからはちみつを溶かす。'], tip: 'はちみつは1歳未満の子どもには与えないで。' }),
  R('sage-tea', 'セージティー', ['meal', 'focus'], [['sage', '生の葉 3〜4枚'], ['honey', 'お好みで']], { temp: '95℃', time: '3〜5分', color: '#d8d49a', taste: 'ほろ苦く、きりっとした香り。', steps: ['葉を手でちぎってポットへ。', '熱湯を注いで3〜5分。'], tip: 'レモンやはちみつを加えると飲みやすい。', caution: '妊娠中・授乳中は避けて。毎日たくさん飲むのも控えて。' }),
  R('verbena', 'レモンバーベナティー', ['relax', 'meal', 'iced'], [['verbena', '生の葉 6〜8枚（乾燥なら小さじ1）']], { temp: '95℃', time: '4分', color: '#e5e0a0', taste: 'レモンよりやさしい、甘くさわやかな香り。', steps: ['葉をポットに入れ、熱湯を注いで4分。'], tip: 'フランスでは食後の定番。乾燥葉でも香りが長持ち。' }),
  R('lemongrass-ginger', 'レモングラスとショウガ', ['warm', 'meal'], [['lemongrass', '生の葉 2〜3本（刻む）'], ['ginger', '薄切り 2枚']], { temp: '95℃', time: '5分', color: '#ead8a0', taste: 'レモンの香りに、ショウガのぽかぽか感。', steps: ['レモングラスを2cmに切り、ショウガと鍋へ。', '水から火にかけ、沸いたら弱火で3分。'], tip: 'はちみつを加えてもおいしい。' }),
  R('akajiso', '赤ジソのピンクティー', ['iced', 'color', 'season'], [['shiso', '生の葉 20枚'], ['lemon', '果汁 少々']], { temp: '沸騰したお湯で煮出す', time: '3分', color: '#c86a8a', taste: 'さわやかな香り。レモンを入れると鮮やかなピンク色に変わる。', steps: ['赤ジソの葉を洗い、沸騰した湯で3分煮出す。', '葉を取り出し、レモン果汁を数滴。色の変化を楽しむ。'], tip: '砂糖を加えて冷やすと、夏のシソジュースに。' }),
  R('dokudami', '焙じドクダミ茶', ['meal', 'season'], [['dokudami', '乾燥葉 大さじ1']], { temp: '煮出す', time: '5〜10分', color: '#b08a5a', taste: '香ばしく、くせの少ないお茶。', steps: ['よく乾かしたドクダミをフライパンで軽く炒って香ばしくする。', 'やかんで5〜10分煮出す。'], tip: '花の咲く頃に刈り取って乾かすのが昔ながらのやり方。', caution: '持病のある人や服薬中の人は医師に相談を。' }),
  R('rosehip-hibiscus', 'ローズヒップとハイビスカス', ['morning', 'color', 'iced'], [['rosehip', '小さじ1'], ['hibiscus', '小さじ1'], ['rugosa', 'ハマナスの実があれば少し']], { temp: '95℃', time: '5分', color: '#b8303a', taste: '真っ赤な色と、きゅっとした酸味。', steps: ['材料をポットに入れ熱湯を注ぐ。', '5分蒸らす。はちみつを加えても。'], tip: '飲んだあとのローズヒップは、そのまま食べられる。' }),
  R('hamanasu', 'ハマナスの花茶', ['guest', 'color', 'season'], [['rugosa', '花びら ひとつかみ（乾燥なら小さじ2）'], ['blacktea', 'お好みで']], { temp: '90℃', time: '3分', color: '#e6a2a8', taste: 'バラの甘い香り。紅茶に加えればローズティーに。', steps: ['花びらに熱湯を注ぐ。', '3分蒸らす。'], tip: '開いたばかりの花の香りがいちばん。' }),
  R('mallow-blue', 'マロウブルー（色が変わるお茶）', ['guest', 'kids', 'color'], [['mallow', '乾燥花 5〜6個'], ['lemon', '果汁 少々']], { temp: '95℃', time: '3分', color: '#4a62b0', taste: 'くせのない味。青からむらさき、レモンでピンクへと色が変わる。', steps: ['透明なポットに花を入れ、熱湯を注ぐ。', '青く色づいたらカップへ。', 'レモンを数滴たらして色の変化を楽しむ。'], tip: '時間がたつと色が変わっていくので、目の前で淹れるのがおすすめ。' }),
  R('calendula-chamo', 'カレンデュラとカモミール', ['relax', 'color'], [['calendula', '乾燥花びら 小さじ1'], ['chamomile', '乾燥花 小さじ1']], { temp: '95℃', time: '4分', color: '#f0c860', taste: 'やさしい甘い香り。黄色い花びらが美しい。', steps: ['材料に熱湯を注ぎ4分。'], tip: 'カレンデュラは香りより色を楽しむハーブ。', caution: 'キク科アレルギーのある人は避けて。' }),
  R('bergamot', 'モナルダ（ベルガモット）ティー', ['relax', 'guest'], [['bergamot', '生の葉と花 ひとつかみ'], ['blacktea', 'お好みで']], { temp: '95℃', time: '4分', color: '#d89a7a', taste: '柑橘のような香り。紅茶に加えると華やか。', steps: ['葉と花をポットへ。熱湯を注ぎ4分。'], tip: '北米の先住民が利用してきた植物で、「オスウィーゴ・ティー」とも呼ばれた。' }),
  R('anise-hyssop', 'アガスターシェのやさしいお茶', ['meal', 'kids', 'relax'], [['anisehyssop', '生の葉 8〜10枚']], { temp: '95℃', time: '4分', color: '#d2d894', taste: 'アニスのような甘い香り。砂糖なしでもほんのり甘い。', steps: ['葉をもんでポットへ。熱湯を注ぎ4分。'], tip: '花穂を浮かべると見た目も楽しい。' }),
  R('fennel-seed', 'フェンネルシードティー', ['meal'], [['fennel', '種 小さじ1']], { temp: '95℃', time: '5分', color: '#e4dca0', taste: '甘くスパイシーな香り。', steps: ['種をスプーンの背で軽くつぶす。', '熱湯を注いで5分。'], tip: '自分の庭で採った種なら、香りが格別。', caution: '妊娠中は多量に飲まないで。' }),
  R('elderflower', 'エルダーフラワーティー', ['guest', 'season', 'iced'], [['elder', '乾燥花 小さじ2'], ['lemon', '輪切り 1枚']], { temp: '95℃', time: '5分', color: '#efe4b0', taste: 'マスカットのような甘い香り。', steps: ['花に熱湯を注ぎ5分。', 'レモンを添える。'], tip: '砂糖とレモンで煮詰めれば、炭酸水で割るコーディアルに。', caution: '花以外（茎・葉・未熟な実）は使わないこと。' }),
  R('home-green-tea', '庭の新茶（手づくり緑茶）', ['guest', 'season', 'focus'], [['tea', '新芽 ひとつかみ']], { temp: '70〜80℃', time: '1分', color: '#b8c86a', taste: '香ばしく、みずみずしい手づくりの緑茶。', steps: ['新芽の一芯二葉を摘む。', '電子レンジで30秒ほど加熱するか、フライパンで炒って酵素を止める。', '手でよく揉んでから、フライパンの弱火で乾かす。', '少し冷ましたお湯で1分。'], tip: '揉んで少しおいてから乾かすと、紅茶のような香りにもなる。カフェインを含む。' }),
  R('kuromoji', 'クロモジ茶', ['relax', 'guest'], [['kuromoji', '小枝 10cm分（刻む）']], { temp: '煮出す', time: '10分', color: '#d8a878', taste: '上品なクスノキ科の香り。和菓子によく合う。', steps: ['小枝を細かく刻む。', '水から鍋で煮出し、沸いたら弱火で10分。'], tip: '高級なつまようじの材料にもなる木。剪定した枝を有効活用。' }),
  R('goji-ginger', 'クコの実とショウガのお茶', ['warm', 'season'], [['goji', '乾燥した実 10粒'], ['ginger', '薄切り 2枚'], ['honey', 'お好みで']], { temp: '95℃', time: '5分', color: '#e8a060', taste: 'ほんのり甘く、体が温まる。', steps: ['材料に熱湯を注ぎ5分。', '実はそのまま食べられる。'], tip: '寒い季節の朝に。', caution: '服薬中の人は医師に相談を。' }),
  R('strawberry-leaf', 'ワイルドストロベリーの葉のお茶', ['kids', 'meal'], [['strawleaf', '乾燥葉 小さじ2'], ['mint', 'お好みで少し']], { temp: '95℃', time: '5分', color: '#d6c890', taste: 'くせが少なく、ほんのり紅茶のような香り。', steps: ['完全に乾かした葉に熱湯を注ぐ。', '5分蒸らす。'], tip: '半乾きの葉は使わず、カラカラに乾かしてから。' }),
  R('echinacea-lemon', 'エキナセアとレモン', ['season', 'warm'], [['echinacea', '乾燥した花と葉 小さじ1'], ['lemon', '輪切り 1枚'], ['honey', 'お好みで']], { temp: '95℃', time: '5分', color: '#d8c890', taste: '草のような素朴な味。レモンとはちみつで飲みやすく。', steps: ['材料に熱湯を注ぎ5分。'], tip: '欧米で冬によく飲まれてきたハーブ。', caution: 'キク科アレルギーのある人、持病のある人は避けて。' }),
  R('lavender-milk', 'ラベンダーミルク', ['sleep', 'relax'], [['lavender', '乾燥花 小さじ1/2'], ['milk', '200ml'], ['honey', '小さじ1']], { temp: '温めた牛乳', time: '3分', color: '#ece2e8', taste: 'ふんわりラベンダーが香る、温かいミルク。', steps: ['牛乳を沸騰直前まで温め、ラベンダーを入れて火を止める。', '3分おいてこし、はちみつを溶かす。'], tip: '料理用・食用に育てたラベンダーを使って。' }),
  R('mint-lemongrass-ice', 'ミントとレモングラスのアイスティー', ['iced', 'refresh', 'kids'], [['mint', '生の葉 15枚'], ['lemongrass', '生の葉 2本']], { temp: '熱湯で濃く', time: '5分', color: '#d0dc90', taste: '夏にぴったりの、すっきり冷たいお茶。', steps: ['熱湯で濃いめに5分淹れる。', '氷をたっぷり入れたピッチャーに一気に注ぐ。'], tip: 'ミントの葉を浮かべて。' }),
  R('rosemary-orange', 'ローズマリーとオレンジ', ['morning', 'focus'], [['rosemary', '生の枝先 5cm'], ['orangepeel', 'ひとつまみ']], { temp: '95℃', time: '3分', color: '#ecc890', taste: 'すっきりした香りに、オレンジの甘い香り。', steps: ['材料に熱湯を注ぎ3分。'], tip: '朝の一杯に。' }),
  R('rooibos-mint', 'ルイボスとミント', ['kids', 'relax', 'iced'], [['rooibos', '小さじ2'], ['mint', '生の葉 5枚']], { temp: '95℃', time: '5分', color: '#c86a3a', taste: 'まろやかなルイボスに、ミントの香り。', steps: ['材料に熱湯を注ぎ5分。'], tip: 'ルイボスはカフェインなしで、子どもも飲みやすい。' }),
  R('ginger-lemon-honey', 'ショウガとレモンのはちみつ湯', ['warm', 'kids'], [['ginger', 'すりおろし 小さじ1/2'], ['lemon', '果汁 小さじ1'], ['honey', '小さじ1']], { temp: '熱湯', time: 'すぐ', color: '#f0d28a', taste: 'ぽかぽか温まる、甘酸っぱい一杯。', steps: ['カップに材料を入れ、熱湯を注いで混ぜる。'], tip: '自家製のショウガとレモンなら格別。はちみつは1歳未満には与えないで。' }),
  R('garden-welcome', '庭のおもてなしブレンド', ['guest', 'relax', 'color'], [['verbena', '生の葉 4枚'], ['mint', '生の葉 4枚'], ['calendula', '花びら 少し']], { temp: '95℃', time: '4分', color: '#e4dca0', taste: 'さわやかで甘い香り。花びらが浮かんで華やか。', steps: ['透明なポットに材料を入れ、熱湯を注ぐ。', '4分蒸らし、テーブルで注ぐ。'], tip: 'その日の庭で摘めるものを少しずつ加えて、自分だけのブレンドに。' }),
  R('mountain-mint', 'マウンテンミントティー', ['refresh', 'meal'], [['mountainmint', '生の葉 10枚']], { temp: '95℃', time: '4分', color: '#cad88c', taste: 'ミントより力強く、ほのかに甘い香り。', steps: ['葉をもんでポットへ。熱湯を注ぎ4分。'], tip: '花の時期は蜂がたくさん来るので、摘むときはそっと。' }),
  R('stevia-sweet', 'ステビアで甘いハーブティー', ['kids'], [['stevia', '乾燥葉 1〜2枚'], ['mint', '生の葉 8枚']], { temp: '95℃', time: '4分', color: '#cddc90', taste: '砂糖なしで甘い、ミントティー。', steps: ['ステビアの葉はごく少量で十分甘くなる。', 'ミントと一緒に熱湯を注ぎ4分。'], tip: '入れすぎると後味に苦みが出るので少しずつ。' }),
  R('peppermint', 'ペパーミントティー', ['refresh', 'meal', 'focus', 'iced'], [['peppermint', '生の葉 8〜10枚（乾燥なら小さじ1）']], { temp: '95℃', time: '3分', color: '#c4d488', taste: 'メントールのきいた、すっと鼻に抜ける香り。', steps: ['葉を軽くもんでポットへ。', '熱湯を注いで3分。'], tip: 'スペアミントより清涼感が強いので、少なめから。' }),
  R('applemint-apple', 'アップルミントとりんご', ['kids', 'relax', 'guest'], [['applemint', '生の葉 10枚'], ['honey', 'お好みで']], { temp: '95℃', time: '5分', color: '#d6dc9a', taste: 'りんごのような甘い香りの、やさしいミント。', steps: ['葉をポットに入れ熱湯を注ぐ。', '5分蒸らす。薄切りのりんごを加えても。'], tip: 'ミントの中でも刺激がやわらかく、子どもにも人気。' }),
  R('garden-roselle', '庭のローゼルティー', ['color', 'iced', 'morning'], [['roselle', '乾燥した萼 4〜5個'], ['honey', 'お好みで']], { temp: '95℃', time: '5分', color: '#b8203a', taste: 'ルビーのような赤色と、甘酸っぱい味。', steps: ['乾かした萼に熱湯を注ぐ。', '5分おいて、はちみつで甘みを。'], tip: '生の萼は砂糖で煮るとジャムにもなる。' }),
  R('yomogi-tea', 'ヨモギ茶', ['season', 'meal', 'warm'], [['yomogi', '乾燥葉 大さじ1']], { temp: '煮出す', time: '5分', color: '#a8a860', taste: '春の野原のような、ほろ苦く香ばしいお茶。', steps: ['乾かした葉をフライパンで軽く炒る。', 'やかんで5分煮出す。'], tip: '春の若い芽を摘むのがいちばん香りがよい。', caution: 'キク科アレルギーのある人、妊娠中の人は避けて。' }),
  R('hakka-tea', '和ハッカ茶', ['refresh', 'meal', 'iced'], [['hakka', '生の葉 8枚'], ['greentea', 'お好みで少し']], { temp: '90℃', time: '3分', color: '#c8d690', taste: 'すっきりした和のミント。緑茶に少し加えても。', steps: ['葉をもんで急須へ。', '少し冷ましたお湯で3分。'], tip: '昔は暑気払いの飲みものとして親しまれた。' }),
  R('kakidooshi-tea', 'カキドオシ茶', ['season', 'meal'], [['kakidooshi', '乾燥した葉と茎 大さじ1']], { temp: '煮出す', time: '5分', color: '#b8b070', taste: 'ミントに似たさわやかさと、ほのかな苦み。', steps: ['乾かしたカキドオシをやかんで5分煮出す。'], tip: '春の花の時期に刈り取って乾かすのが昔ながらのやり方。', caution: '持病のある人や服薬中の人は医師に相談を。' }),
  R('pinesage', 'パイナップルセージティー', ['relax', 'guest', 'kids'], [['pinesage', '生の葉 6〜8枚と花少し']], { temp: '95℃', time: '4分', color: '#e4d8a0', taste: 'パイナップルのような甘い香り。赤い花を浮かべて。', steps: ['葉と花をポットに入れ、熱湯を注いで4分。'], tip: '花は甘い蜜があり、そのまま食べられる。' }),
  R('rosegeranium-black', 'ローズゼラニウム香る紅茶', ['guest', 'relax'], [['blacktea', 'ティースプーン 1杯'], ['rosegeranium', '生の葉 1〜2枚']], { temp: '95℃', time: '3分', color: '#b8603a', taste: 'いつもの紅茶が、バラの香りの紅茶に。', steps: ['紅茶の葉とローズゼラニウムの葉をポットへ。', '熱湯を注いで3分。'], tip: '砂糖壺に葉を1枚入れておくと、香りの砂糖になる。' }),
  R('tulsi', 'トゥルシーティー', ['relax', 'warm'], [['tulsi', '生の葉 10枚（乾燥なら小さじ1）'], ['ginger', '薄切り 1枚']], { temp: '95℃', time: '5分', color: '#c8b878', taste: 'クローブのようなスパイシーな香り。', steps: ['葉とショウガに熱湯を注いで5分。'], tip: 'インドでは毎日のお茶として親しまれている。', caution: '妊娠中は避けて。' }),
  R('lemonthyme-honey', 'レモンタイムのはちみつティー', ['warm', 'refresh'], [['lemonthyme', '生の枝 4〜5本'], ['honey', '小さじ1']], { temp: '95℃', time: '4分', color: '#e6dc9a', taste: 'レモンの香りのタイム。やさしい酸味の香り。', steps: ['枝ごと熱湯を注ぎ4分。', 'はちみつを溶かす。'], tip: 'はちみつは1歳未満の子どもには与えないで。' }),
  R('catnip-balm', 'キャットニップとレモンバーム', ['sleep', 'relax'], [['catnip', '乾燥葉 小さじ1'], ['lemonbalm', '生の葉 5枚']], { temp: '95℃', time: '5分', color: '#d0d494', taste: 'ミントに似た穏やかな香り。夜の一杯に。', steps: ['材料に熱湯を注ぎ5分。'], tip: '乾燥中や保存中は、猫が寄ってこない場所で。', caution: '妊娠中は避けて。' }),
  R('jasmine-green', '庭のジャスミン茶', ['guest', 'relax'], [['greentea', 'ティースプーン 1杯'], ['jasmine', '花 5〜6輪']], { temp: '80℃', time: '2分', color: '#d8d890', taste: '緑茶に、甘く華やかな花の香り。', steps: ['夕方に開いた花を摘む。', '緑茶の葉と一緒に、80℃のお湯で2分。'], tip: '密閉容器で茶葉と花を一晩いっしょにしておくと、香りが移る。' }),
  R('violet-honey', 'スミレの花のはちみつ湯', ['season', 'kids', 'color'], [['violet', '花 10輪'], ['honey', '小さじ1']], { temp: '90℃', time: '3分', color: '#c8b0d8', taste: 'かすかな甘い香り。浮かぶ紫の花が春らしい。', steps: ['カップに花とはちみつを入れ、お湯を注ぐ。'], tip: '早春だけの楽しみ。農薬を使っていない花で。' }),
];

/** レシピの材料のうち、庭にあるもの・ないもの */
/** その材料が庭にあるか（品種の指定があれば品種で、なければ種で判定）。owned は植物IDと種IDの集合 */
export const ingOwned = (ing, owned) => (ing.ids ? ing.ids.some((i) => owned.has(i)) : owned.has(ing.group));
export function teaStatus(recipe, gardenGroups) {
  const garden = recipe.ings.filter((x) => INGREDIENTS[x.k] && !INGREDIENTS[x.k].store);
  const have = garden.filter((x) => ingOwned(INGREDIENTS[x.k], gardenGroups));
  const store = recipe.ings.filter((x) => INGREDIENTS[x.k]?.store);
  // 主な材料（最初の材料）が庭にあれば「作れる」
  const main = recipe.ings[0];
  const mainOk = INGREDIENTS[main.k]?.store || ingOwned(INGREDIENTS[main.k], gardenGroups);
  return { garden, have, store, missing: garden.filter((x) => !have.includes(x)), canMake: mainOk && have.length >= Math.max(1, garden.length - 1) && garden.length > 0, all: have.length === garden.length && garden.length > 0 };
}

/** 庭の植物で使えるハーブティーの材料 */
export function teaIngredientsFor(p) {
  return Object.entries(INGREDIENTS).filter(([, v]) => (v.ids ? v.ids.includes(p.id) : v.group === p.group)).map(([k, v]) => ({ k, ...v, recipes: TEA_RECIPES.filter((r) => r.ings.some((x) => x.k === k)) }));
}

/** カップのイラスト（お茶の色） */
export function teaCupSVG(color, size = 64) {
  return `<svg class="cup-svg" width="${size}" height="${Math.round(size * 0.8)}" viewBox="0 0 80 64" aria-hidden="true">
    <path d="M20 14 q4 -6 0 -10 M32 14 q4 -6 0 -10 M44 14 q4 -6 0 -10" stroke="#b9ad8e" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M10 20 H58 V38 a24 18 0 0 1 -48 0Z" fill="#fbf8f0" stroke="#2b2a22" stroke-width="1.6"/>
    <ellipse cx="34" cy="22" rx="22" ry="4" fill="${color}"/>
    <path d="M58 26 q14 0 12 10 q-2 8 -14 6" fill="none" stroke="#2b2a22" stroke-width="1.6"/>
    <ellipse cx="34" cy="58" rx="30" ry="4" fill="#e6dccb" stroke="#2b2a22" stroke-width="1.2"/>
  </svg>`;
}
