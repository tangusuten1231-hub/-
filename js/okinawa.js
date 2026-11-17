// 沖縄など亜熱帯の地域向けの多年草・低木（団地のベランダや共用の植え込み、鉢でも育てやすいもの）
// ※ 解説文はすべてオリジナル。栽培が禁止・規制されている植物、侵略的な外来種として指定されている植物は掲載しない。
// 耐寒ゾーンは出典（climateSrc）で確認した値。熱帯の低地が原産の植物のヒートゾーンは、原産地の暑さから上限の12とした。
const K = (id, ja, latin, type, o) => ({
  id, ja, latin, wiki: o.wiki ?? latin.replace(/ '.*$/, ''), type,
  humid: 3, heat: 12, sun: ['full'], moist: ['mid'], leaf: 'green', cut: 'spring', div: 'none',
  ...o,
});

export const OKINAWA_BASE = [
  K('hibiscus', 'ハイビスカス', 'Hibiscus rosa-sinensis', 'shrub', {
    zone: [10, 11], tender: true, h: [80, 200], spread: 80, bloom: [5, 6, 7, 8, 9, 10, 11], color: ['red', 'pink', 'yellow', 'orange', 'white'], form: 'globe',
    tags: ['balcony', 'evergreen'], price: 1000, aka: ['ブッソウゲ（仏桑花）'], origin: ['tropasia'],
    climateSrc: 'PBS Victory Garden（USDA ゾーン10）。原産は熱帯アジア',
    note: '一日でしぼむ大輪の花が、暑い時期に次々と開く。鉢なら日当たりのよいベランダで。寒くなる地域では冬に室内へ。',
  }),
  K('bougainvillea', 'ブーゲンビレア', 'Bougainvillea glabra', 'shrub', {
    zone: [9, 11], moist: ['dry', 'mid'], h: [100, 300], spread: 100, bloom: [4, 5, 6, 7, 8, 9, 10, 11], color: ['pink', 'purple', 'red', 'white', 'orange'], form: 'plate',
    tags: ['balcony', 'evergreen'], price: 1200, aka: ['イカダカズラ'], origin: ['southam'], cut: 'after',
    climateSrc: 'NC State Extension（USDA 9a–11b）、SNWA 植物データベース（9a–11b）。原産は南アメリカ',
    note: '花に見える色の部分は葉が変化した苞（ほう）。乾かしぎみに育てると色づきがよい。枝にとげがあるので、通路ぎわを避けて。',
  }),
  K('ixora', 'サンダンカ', 'Ixora chinensis', 'shrub', {
    wiki: 'Ixora', zone: [10, 11], tender: true, h: [50, 150], spread: 60, bloom: [5, 6, 7, 8, 9, 10], color: ['red', 'orange', 'yellow', 'pink'], form: 'globe',
    tags: ['balcony', 'evergreen', 'pollinator'], price: 1000, aka: ['イクソラ'], origin: ['tropasia'], acid: true,
    climateSrc: 'Monrovia（サンダンカ属の品種：USDA 10–11）。原産は熱帯アジア',
    note: '小さな花が手まりのように集まって咲く。弱酸性の土を好み、沖縄では三大名花のひとつに数えられる。',
  }),
  K('alpinia-zerumbet', 'ゲットウ（月桃）', 'Alpinia zerumbet', 'herb', {
    zone: [9, 11], sun: ['full', 'part'], moist: ['mid', 'wet'], h: [150, 300], spread: 100, bloom: [5, 6, 7], color: ['white', 'pink'], form: 'globe',
    tags: ['native', 'fragrant', 'evergreen'], price: 1000, aka: ['サンニン'], origin: ['japan', 'tropasia'], div: 'spring',
    climateSrc: 'UF/IFAS ファクトシート（USDA 9B–11）。南西諸島に自生',
    note: '貝殻のような白い花が房になって垂れる。葉にはさわやかな香りがあり、沖縄ではムーチー（餅）を包むのに使う。大きくなるので大鉢か地植えで。',
  }),
  K('crinum-asiaticum', 'ハマユウ', 'Crinum asiaticum', 'bulb', {
    wiki: 'Crinum asiaticum', zone: [9, 11], moist: ['dry', 'mid'], h: [60, 100], spread: 80, bloom: [6, 7, 8, 9], color: ['white'], form: 'airy',
    tags: ['native', 'fragrant', 'evergreen', 'salt'], price: 1200, aka: ['ハマオモト'], origin: ['japan'], cut: 'none',
    climateSrc: 'gardenia.net ほか（USDA 9–11）。暖かい地域の海岸に自生',
    note: '夏の夕方、細い花びらの白い花が香る。海辺に自生するので潮風に強い。全体に毒があるので口に入れない。',
  }),
  K('alocasia-odora', 'クワズイモ', 'Alocasia odora', 'herb', {
    zone: [8, 11], sun: ['part', 'shade'], moist: ['mid', 'wet'], h: [60, 150], spread: 80, bloom: [], color: ['green'], form: 'mound',
    tags: ['native', 'shade', 'evergreen', 'balcony'], price: 800, origin: ['japan', 'tropasia'], cut: 'leaves', div: 'spring',
    climateSrc: 'UF/IFAS ファクトシート（USDA 8A–11）。南西諸島に自生',
    note: '大きなハート形の葉を楽しむ。日陰の通路や北向きのベランダでも育つ。名前のとおり食べられず、汁で手がかぶれることがある。',
  }),
  K('lilium-longiflorum', 'テッポウユリ', 'Lilium longiflorum', 'bulb', {
    zone: [7, 11], heat: 9, humid: 2, moist: ['mid'], h: [50, 100], spread: 25, bloom: [4, 5, 6], color: ['white'], form: 'spike',
    tags: ['native', 'fragrant', 'salt'], price: 300, origin: ['japan'], cut: 'after',
    climateSrc: '自生地：九州南部から沖縄の南西諸島の海岸（山と溪谷社・国土交通省 観光庁 多言語解説文）。耐寒の下限は一般的な栽培情報（USDA 7）',
    note: '沖縄では4月ごろ、白いラッパ形の花が香る。海辺の岩場に自生するユリで、伊江島のゆり祭りが有名。',
  }),
  K('euphorbia-milii', 'ハナキリン', 'Euphorbia milii', 'subshrub', {
    zone: [10, 11], tender: true, humid: 2, moist: ['dry'], h: [30, 90], spread: 40, bloom: [3, 4, 5, 6, 7, 8, 9, 10, 11], color: ['red', 'pink', 'yellow', 'white'], form: 'mound',
    tags: ['balcony', 'dry', 'evergreen'], price: 800, origin: ['africa'], cut: 'none',
    climateSrc: 'University of Arizona Arboretum（USDA 10–12）、UF/IFAS（9B–11）。原産はマダガスカル',
    note: 'とげのある茎に小さな花が長い期間咲く。乾燥に強く、水やりの少ない鉢向き。切ると出る白い汁はかぶれるので手袋を。',
  }),
];
