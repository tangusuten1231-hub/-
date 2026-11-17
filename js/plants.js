// 宿根草データベース
// zone: USDA 耐寒性ゾーン [下限, 上限] / heat: AHS 暑さゾーン上限
// humid: 高温多湿（蒸れ）への強さ 1=弱い 2=普通 3=強い
// sun: full=日向 / part=半日陰 / shade=日陰, moist: dry / mid / wet
// h: 草丈 [最小, 最大] cm, spread: 株間 cm, bloom: 開花月（北半球）, color: 花色
// leaf: 葉色 green / silver / bronze / gold / variegated / blue
// form: 花の形（植栽デザインの要素） spike=穂・縦線 daisy=デイジー・単花 globe=球 plate=平たい花房
//       airy=霞・透け感 mound=こんもり・葉物 grass=グラス
// tags: 雰囲気・用途タグ（TAGS 参照）
// price: 苗1株（9〜10.5cmポット、球根は1球）の平均的な価格（円・目安）
// cut: after / chelsea / spring / leaves / none, div: spring / autumn / both / none
// type: herb / grass / subshrub / bulb, wiki: 画像取得用の Wikipedia（英語版）記事名

import { CULTIVARS as CV1, EXTRA_BASE } from './cultivars.js';
import { MORE_BASE, MORE_CULTIVARS } from './more.js';
import { ANNUAL_BASE, ANNUAL_CULTIVARS } from './annuals.js';
import { VEG_BASE, VEG_GROUPS_EXTRA } from './veg.js';
import { BALCONY_BASE, BALCONY_EXTRA } from './pots.js';
import { ALIASES, ORIGIN } from './origin.js';
import { rolesOf } from './roles.js';
import { HERB_BASE, WORLD_BASE, WORLD_ALIASES, WORLD_ORIGIN } from './world.js';
import { DESIGNER_BASE, DESIGNER_CULTIVARS, DESIGNER_ORIGIN, DESIGNER_ALIASES, DESIGNER_FAMILY, socOf, SALT_GROUPS } from './designer.js';
import { familyOf, USE_INDEX, HERB_GROUPS, NATIVE_GROUPS, MEDICINAL_GROUPS, TIPS } from './meta.js';
import { CLIMATE_FIX, climateTraits } from './fit.js';
import { OKINAWA_BASE } from './okinawa.js';

// 品種リストを統合（既存の種には追加、新しい種はそのまま）
const CULTIVARS = { ...CV1 };
for (const [k, v] of [...Object.entries(MORE_CULTIVARS), ...Object.entries(ANNUAL_CULTIVARS), ...Object.entries(DESIGNER_CULTIVARS)]) {
  CULTIVARS[k] = CULTIVARS[k] ? { ...CULTIVARS[k], ...(v.group ? { group: v.group } : {}), list: mergeLists(CULTIVARS[k].list, v.list) } : v;
}

const BASE = [
  // ---- 日向の主役・夏〜秋 ----
  { id: 'echinacea', ja: 'エキナセア', latin: 'Echinacea purpurea', wiki: 'Echinacea purpurea', type: 'herb', zone: [3, 9], heat: 9, humid: 2, sun: ['full'], moist: ['dry', 'mid'], h: [60, 100], spread: 45, bloom: [6, 7, 8, 9], color: ['pink', 'white'], leaf: 'green', form: 'daisy', tags: ['natural', 'prairie', 'pollinator', 'easy'], price: 700, cut: 'after', div: 'spring', note: '花がら摘みで長く咲く。冬は種を残すと野鳥が来る。' },
  { id: 'rudbeckia', ja: 'ルドベキア・フルギダ', latin: "Rudbeckia fulgida 'Goldsturm'", wiki: 'Rudbeckia fulgida', type: 'herb', zone: [3, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['dry', 'mid'], h: [50, 75], spread: 45, bloom: [7, 8, 9, 10], color: ['yellow'], leaf: 'green', form: 'daisy', tags: ['natural', 'prairie', 'pollinator', 'easy'], price: 500, cut: 'after', div: 'both', note: '丈夫で暑さにも強い。夏〜秋の主役。' },
  { id: 'rudbeckia-triloba', ja: "ルドベキア‘タカオ’", latin: 'Rudbeckia triloba', wiki: 'Rudbeckia triloba', type: 'herb', zone: [4, 8], heat: 9, humid: 3, sun: ['full'], moist: ['mid'], h: [80, 150], spread: 50, bloom: [7, 8, 9, 10], color: ['yellow'], leaf: 'green', form: 'airy', tags: ['natural', 'prairie', 'pollinator', 'easy'], price: 400, cut: 'chelsea', div: 'spring', note: '小花が無数に咲く。こぼれ種でふえる。' },
  { id: 'salvia-nemorosa', ja: 'サルビア・ネモローサ', latin: 'Salvia nemorosa', wiki: 'Salvia nemorosa', type: 'herb', zone: [4, 8], heat: 8, humid: 2, sun: ['full'], moist: ['dry', 'mid'], h: [40, 60], spread: 45, bloom: [5, 6, 9, 10], color: ['purple', 'pink', 'white'], leaf: 'green', form: 'spike', tags: ['english', 'natural', 'pollinator', 'dry'], price: 600, cut: 'after', div: 'spring', note: '花後すぐ切り戻すと秋に返り咲く。' },
  { id: 'salvia-guaranitica', ja: 'サルビア・ガラニチカ（メドーセージ）', latin: 'Salvia guaranitica', wiki: 'Salvia guaranitica', type: 'herb', zone: [7, 10], heat: 10, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [90, 150], spread: 60, bloom: [6, 7, 8, 9, 10], color: ['blue'], leaf: 'green', form: 'spike', tags: ['natural', 'pollinator', 'easy'], price: 500, cut: 'after', div: 'spring', note: '暖地向きで夏の高温多湿に強い。地下茎で広がる。' },
  { id: 'salvia-indigo', ja: "サルビア‘インディゴスパイア’", latin: "Salvia 'Indigo Spires'", wiki: "Salvia 'Indigo Spires'", type: 'herb', zone: [7, 10], heat: 10, humid: 3, sun: ['full'], moist: ['mid'], h: [90, 150], spread: 70, bloom: [6, 7, 8, 9, 10, 11], color: ['blue', 'purple'], leaf: 'green', form: 'spike', tags: ['natural', 'pollinator', 'easy'], price: 500, cut: 'after', div: 'spring', note: '初夏から晩秋まで咲き続ける暖地の強い味方。' },
  { id: 'salvia-leucantha', ja: 'サルビア・レウカンサ（アメジストセージ）', latin: 'Salvia leucantha', wiki: 'Salvia leucantha', type: 'herb', zone: [8, 10], heat: 10, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [80, 120], spread: 70, bloom: [9, 10, 11], color: ['purple'], leaf: 'silver', form: 'spike', tags: ['natural', 'pollinator'], price: 500, cut: 'chelsea', div: 'spring', note: '秋の花壇を彩る。寒冷地では鉢上げして冬越し。' },
  { id: 'salvia-microphylla', ja: 'チェリーセージ', latin: 'Salvia microphylla', wiki: 'Salvia microphylla', type: 'subshrub', zone: [7, 10], heat: 10, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [60, 100], spread: 60, bloom: [5, 6, 7, 8, 9, 10, 11], color: ['red', 'pink', 'white'], leaf: 'green', form: 'mound', tags: ['natural', 'pollinator', 'fragrant', 'easy', 'dry'], price: 500, cut: 'spring', div: 'none', note: '葉に甘い香り。春から晩秋まで咲く。' },
  { id: 'salvia-uliginosa', ja: 'ボッグセージ', latin: 'Salvia uliginosa', wiki: 'Salvia uliginosa', type: 'herb', zone: [7, 10], heat: 10, humid: 3, sun: ['full'], moist: ['mid', 'wet'], h: [100, 180], spread: 60, bloom: [7, 8, 9, 10], color: ['blue'], leaf: 'green', form: 'airy', tags: ['natural', 'pollinator', 'easy'], price: 500, cut: 'chelsea', div: 'spring', note: '空色の小花が風に揺れる。湿り気のある土を好む。' },
  { id: 'nepeta', ja: 'ネペタ（キャットミント）', latin: 'Nepeta × faassenii', wiki: 'Nepeta racemosa', type: 'herb', zone: [3, 8], heat: 8, humid: 1, sun: ['full'], moist: ['dry', 'mid'], h: [30, 60], spread: 60, bloom: [5, 6, 7, 9], color: ['blue', 'purple'], leaf: 'silver', form: 'mound', tags: ['english', 'natural', 'pollinator', 'fragrant', 'dry'], price: 600, cut: 'after', div: 'spring', note: '梅雨前に半分ほど切り戻して蒸れを防ぐ。' },
  { id: 'geranium-rozanne', ja: "ゲラニウム‘ロザンネイ’", latin: "Geranium 'Rozanne'", wiki: 'Geranium', type: 'herb', zone: [5, 8], heat: 8, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [40, 50], spread: 60, bloom: [5, 6, 7, 8, 9, 10], color: ['blue'], leaf: 'green', form: 'mound', tags: ['english', 'natural', 'easy'], price: 1200, cut: 'after', div: 'spring', note: '花期が非常に長いグラウンドカバー。暖地では午後日陰に。' },
  { id: 'geranium-sanguineum', ja: 'アケボノフウロ', latin: 'Geranium sanguineum', wiki: 'Geranium sanguineum', type: 'herb', zone: [4, 8], heat: 8, humid: 2, sun: ['full', 'part'], moist: ['dry', 'mid'], h: [20, 40], spread: 45, bloom: [5, 6, 7], color: ['pink'], leaf: 'green', form: 'mound', tags: ['english', 'natural'], price: 600, cut: 'after', div: 'spring', note: '秋の紅葉も楽しめる丈夫なフウロソウ。' },
  { id: 'gaura', ja: 'ガウラ', latin: 'Oenothera lindheimeri', wiki: 'Oenothera lindheimeri', type: 'herb', zone: [5, 9], heat: 10, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [60, 120], spread: 60, bloom: [5, 6, 7, 8, 9, 10], color: ['white', 'pink'], leaf: 'green', form: 'airy', tags: ['natural', 'prairie', 'dry', 'easy', 'pollinator'], price: 500, cut: 'after', div: 'spring', note: '風に揺れる花。暑さに強く長く咲く。' },
  { id: 'oenothera-speciosa', ja: 'ヒルザキツキミソウ', latin: 'Oenothera speciosa', wiki: 'Oenothera speciosa', type: 'herb', zone: [5, 9], heat: 9, humid: 3, sun: ['full'], moist: ['dry'], h: [30, 50], spread: 45, bloom: [5, 6, 7], color: ['pink', 'white'], leaf: 'green', form: 'daisy', tags: ['natural', 'dry', 'easy'], price: 300, cut: 'after', div: 'spring', note: '地下茎で旺盛に広がるので場所を区切って。' },
  { id: 'penstemon', ja: "ペンステモン‘ハスカーレッド’", latin: "Penstemon digitalis 'Husker Red'", wiki: 'Penstemon digitalis', type: 'herb', zone: [3, 8], heat: 8, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [60, 90], spread: 45, bloom: [5, 6], color: ['white'], leaf: 'bronze', form: 'spike', tags: ['natural', 'english', 'prairie', 'pollinator'], price: 700, cut: 'after', div: 'spring', note: '銅葉と白花のコントラストが美しい。' },
  { id: 'digitalis', ja: 'ジギタリス', latin: 'Digitalis purpurea', wiki: 'Digitalis purpurea', type: 'herb', zone: [4, 8], heat: 7, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [80, 150], spread: 45, bloom: [5, 6], color: ['pink', 'white', 'purple'], leaf: 'green', form: 'spike', tags: ['english', 'pollinator'], price: 400, cut: 'after', div: 'none', note: '二年草〜短命な多年草。こぼれ種で更新。有毒。' },
  { id: 'veronica', ja: 'ベロニカ・ロンギフォリア', latin: 'Veronica longifolia', wiki: 'Veronica longifolia', type: 'herb', zone: [4, 8], heat: 8, humid: 2, sun: ['full'], moist: ['mid'], h: [50, 90], spread: 45, bloom: [6, 7, 8], color: ['blue', 'purple', 'white', 'pink'], leaf: 'green', form: 'spike', tags: ['english', 'natural', 'pollinator'], price: 600, cut: 'after', div: 'both', note: '縦のラインをつくる穂状の花。' },
  { id: 'veronicastrum', ja: 'ベロニカストラム', latin: 'Veronicastrum virginicum', wiki: 'Veronicastrum virginicum', type: 'herb', zone: [3, 8], heat: 8, humid: 3, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [100, 180], spread: 60, bloom: [7, 8], color: ['white', 'pink', 'purple'], leaf: 'green', form: 'spike', tags: ['natural', 'prairie', 'pollinator'], price: 900, cut: 'spring', div: 'spring', note: '背の高いナチュラルガーデンの骨格。' },
  { id: 'achillea', ja: 'アキレア（ヤロウ）', latin: 'Achillea millefolium', wiki: 'Achillea millefolium', type: 'herb', zone: [3, 9], heat: 9, humid: 2, sun: ['full'], moist: ['dry', 'mid'], h: [40, 80], spread: 50, bloom: [5, 6, 7], color: ['yellow', 'pink', 'red', 'white'], leaf: 'green', form: 'plate', tags: ['natural', 'prairie', 'dry', 'pollinator', 'easy'], price: 500, cut: 'after', div: 'both', note: '乾燥に強い。肥料は控えめに。' },
  { id: 'phlox-paniculata', ja: 'フロックス・パニキュラータ', latin: 'Phlox paniculata', wiki: 'Phlox paniculata', type: 'herb', zone: [4, 8], heat: 8, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [60, 120], spread: 60, bloom: [7, 8, 9], color: ['pink', 'white', 'purple'], leaf: 'green', form: 'globe', tags: ['english', 'fragrant', 'pollinator'], price: 700, cut: 'chelsea', div: 'both', note: '香りのよい夏花。うどんこ病対策に風通しを。' },
  { id: 'monarda', ja: 'モナルダ（ベルガモット）', latin: 'Monarda didyma', wiki: 'Monarda didyma', type: 'herb', zone: [4, 9], heat: 8, humid: 2, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [60, 120], spread: 60, bloom: [6, 7, 8], color: ['red', 'pink', 'purple', 'white'], leaf: 'green', form: 'globe', tags: ['natural', 'prairie', 'pollinator', 'fragrant'], price: 600, cut: 'after', div: 'spring', note: 'ハーブ。うどんこ病に注意し風通しよく。' },
  { id: 'agastache', ja: 'アガスターシェ', latin: 'Agastache', wiki: 'Agastache', type: 'herb', zone: [5, 9], heat: 9, humid: 2, sun: ['full'], moist: ['dry', 'mid'], h: [60, 100], spread: 45, bloom: [7, 8, 9, 10], color: ['purple', 'blue', 'orange', 'pink'], leaf: 'green', form: 'spike', tags: ['natural', 'prairie', 'pollinator', 'fragrant', 'dry'], price: 600, cut: 'spring', div: 'spring', note: '葉にアニスの香り。蝶や蜂がよく集まる。' },
  { id: 'liatris', ja: 'リアトリス', latin: 'Liatris spicata', wiki: 'Liatris spicata', type: 'bulb', zone: [3, 9], heat: 9, humid: 3, sun: ['full'], moist: ['mid'], h: [60, 90], spread: 30, bloom: [7, 8], color: ['purple', 'white'], leaf: 'green', form: 'spike', tags: ['prairie', 'natural', 'pollinator', 'easy'], price: 200, cut: 'after', div: 'spring', note: '上から咲き進む穂。球根で安価に植えられる。' },
  { id: 'physostegia', ja: 'ハナトラノオ', latin: 'Physostegia virginiana', wiki: 'Physostegia virginiana', type: 'herb', zone: [3, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [60, 100], spread: 45, bloom: [8, 9, 10], color: ['pink', 'white'], leaf: 'green', form: 'spike', tags: ['natural', 'easy', 'pollinator'], price: 400, cut: 'chelsea', div: 'spring', note: '非常に丈夫。地下茎で広がる。' },
  { id: 'persicaria', ja: 'ペルシカリア・アンプレキシカウリス', latin: 'Persicaria amplexicaulis', wiki: 'Persicaria amplexicaulis', type: 'herb', zone: [5, 8], heat: 8, humid: 3, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [90, 120], spread: 70, bloom: [7, 8, 9, 10], color: ['red', 'pink'], leaf: 'green', form: 'spike', tags: ['natural', 'prairie', 'pollinator'], price: 900, cut: 'spring', div: 'spring', note: '夏から秋まで細い穂が長く咲く。' },
  { id: 'echinops', ja: 'エキノプス（ルリタマアザミ）', latin: 'Echinops ritro', wiki: 'Echinops ritro', type: 'herb', zone: [3, 8], heat: 8, humid: 2, sun: ['full'], moist: ['dry'], h: [80, 120], spread: 50, bloom: [7, 8], color: ['blue'], leaf: 'silver', form: 'globe', tags: ['natural', 'prairie', 'dry', 'pollinator'], price: 800, cut: 'after', div: 'none', note: '金属的な青い球形の花。ドライフラワーにも。' },
  { id: 'eryngium', ja: 'エリンジウム', latin: 'Eryngium planum', wiki: 'Eryngium planum', type: 'herb', zone: [5, 9], heat: 8, humid: 1, sun: ['full'], moist: ['dry'], h: [50, 90], spread: 40, bloom: [6, 7, 8], color: ['blue'], leaf: 'silver', form: 'globe', tags: ['natural', 'dry', 'pollinator'], price: 900, cut: 'after', div: 'none', note: '直根性で移植を嫌う。痩せた乾燥地で。' },
  { id: 'allium', ja: "アリウム‘パープルセンセーション’", latin: "Allium hollandicum 'Purple Sensation'", wiki: 'Allium hollandicum', type: 'bulb', zone: [4, 9], heat: 8, humid: 2, sun: ['full'], moist: ['dry', 'mid'], h: [60, 90], spread: 15, bloom: [5], color: ['purple'], leaf: 'green', form: 'globe', tags: ['english', 'natural', 'pollinator', 'easy'], price: 150, cut: 'none', div: 'none', note: '秋に球根を植える。宿根草の間から丸い花が浮かぶ。' },
  { id: 'sedum', ja: "セダム‘オータムジョイ’", latin: "Hylotelephium 'Herbstfreude'", wiki: 'Hylotelephium spectabile', type: 'herb', zone: [3, 9], heat: 9, humid: 2, sun: ['full'], moist: ['dry'], h: [40, 60], spread: 45, bloom: [8, 9, 10], color: ['pink', 'red'], leaf: 'blue', form: 'plate', tags: ['prairie', 'dry', 'pollinator', 'easy'], price: 500, cut: 'chelsea', div: 'spring', note: '乾燥に非常に強い。冬の枯れ姿も美しい。' },
  { id: 'hemerocallis', ja: 'ヘメロカリス（デイリリー）', latin: 'Hemerocallis', wiki: 'Daylily', type: 'herb', zone: [3, 9], heat: 10, humid: 3, sun: ['full', 'part'], moist: ['dry', 'mid', 'wet'], h: [40, 90], spread: 60, bloom: [6, 7, 8], color: ['yellow', 'orange', 'red', 'pink'], leaf: 'green', form: 'daisy', tags: ['easy', 'wa', 'natural'], price: 700, cut: 'after', div: 'both', note: '非常に丈夫。場所を選ばない。' },
  { id: 'crocosmia', ja: "クロコスミア‘ルシファー’", latin: "Crocosmia 'Lucifer'", wiki: 'Crocosmia', type: 'bulb', zone: [6, 9], heat: 9, humid: 3, sun: ['full'], moist: ['mid'], h: [60, 100], spread: 20, bloom: [7, 8], color: ['red', 'orange'], leaf: 'green', form: 'spike', tags: ['natural', 'easy'], price: 300, cut: 'spring', div: 'spring', note: '剣状の葉と燃えるような赤い花。' },
  { id: 'kniphofia', ja: 'クニフォフィア（トリトマ）', latin: 'Kniphofia uvaria', wiki: 'Kniphofia uvaria', type: 'herb', zone: [6, 9], heat: 9, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [60, 120], spread: 50, bloom: [6, 7, 8], color: ['orange', 'red', 'yellow'], leaf: 'green', form: 'spike', tags: ['natural', 'pollinator', 'dry'], price: 800, cut: 'after', div: 'spring', note: 'たいまつのような花。冬の過湿を嫌う。' },
  { id: 'heliopsis', ja: 'ヘリオプシス', latin: 'Heliopsis helianthoides', wiki: 'Heliopsis helianthoides', type: 'herb', zone: [3, 9], heat: 9, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [90, 150], spread: 60, bloom: [6, 7, 8, 9], color: ['yellow'], leaf: 'green', form: 'daisy', tags: ['prairie', 'natural', 'easy', 'pollinator'], price: 700, cut: 'after', div: 'spring', note: '暑さに強く夏中咲く。' },
  { id: 'helianthus', ja: 'ヤナギバヒマワリ', latin: 'Helianthus salicifolius', wiki: 'Helianthus salicifolius', type: 'herb', zone: [4, 9], heat: 9, humid: 3, sun: ['full'], moist: ['mid'], h: [150, 250], spread: 70, bloom: [9, 10], color: ['yellow'], leaf: 'green', form: 'daisy', tags: ['prairie', 'natural', 'easy', 'pollinator'], price: 600, cut: 'chelsea', div: 'spring', note: '細い葉が涼しげ。秋に背丈を超えて咲く。' },
  { id: 'helenium', ja: 'ヘレニウム', latin: 'Helenium autumnale', wiki: 'Helenium autumnale', type: 'herb', zone: [3, 8], heat: 8, humid: 2, sun: ['full'], moist: ['mid', 'wet'], h: [60, 120], spread: 50, bloom: [7, 8, 9, 10], color: ['yellow', 'orange', 'red'], leaf: 'green', form: 'daisy', tags: ['prairie', 'natural', 'pollinator'], price: 700, cut: 'chelsea', div: 'spring', note: '乾燥に弱い。摘心で草丈を抑える。' },
  { id: 'coreopsis', ja: 'コレオプシス・バーティシラータ', latin: 'Coreopsis verticillata', wiki: 'Coreopsis verticillata', type: 'herb', zone: [3, 9], heat: 9, humid: 2, sun: ['full'], moist: ['dry', 'mid'], h: [30, 60], spread: 45, bloom: [6, 7, 8, 9], color: ['yellow'], leaf: 'green', form: 'airy', tags: ['natural', 'prairie', 'dry', 'easy'], price: 500, cut: 'after', div: 'spring', note: '細い葉と小花。花後の刈り込みで再び咲く。' },
  { id: 'gaillardia', ja: 'ガイラルディア', latin: 'Gaillardia × grandiflora', wiki: 'Gaillardia × grandiflora', type: 'herb', zone: [3, 10], heat: 10, humid: 2, sun: ['full'], moist: ['dry'], h: [30, 60], spread: 45, bloom: [6, 7, 8, 9, 10], color: ['red', 'orange', 'yellow'], leaf: 'green', form: 'daisy', tags: ['prairie', 'dry', 'pollinator'], price: 450, cut: 'after', div: 'spring', note: 'やや短命。水はけ重視。' },
  { id: 'solidago', ja: "ソリダゴ‘ファイヤーワークス’", latin: "Solidago rugosa 'Fireworks'", wiki: 'Solidago rugosa', type: 'herb', zone: [4, 9], heat: 9, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [60, 100], spread: 50, bloom: [8, 9, 10], color: ['yellow'], leaf: 'green', form: 'airy', tags: ['prairie', 'natural', 'pollinator', 'easy'], price: 600, cut: 'spring', div: 'spring', note: '花火のように広がる黄色い花穂。' },
  { id: 'eutrochium', ja: 'ユーパトリウム（ジョーパイウィード）', latin: "Eutrochium maculatum 'Atropurpureum'", wiki: 'Eutrochium maculatum', type: 'herb', zone: [4, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [150, 200], spread: 70, bloom: [8, 9], color: ['pink'], leaf: 'green', form: 'plate', tags: ['prairie', 'natural', 'pollinator'], price: 900, cut: 'spring', div: 'spring', note: '大型で蝶が群がる。広い庭の背景に。' },
  { id: 'knautia', ja: 'クナウティア・マケドニカ', latin: 'Knautia macedonica', wiki: 'Knautia macedonica', type: 'herb', zone: [5, 9], heat: 8, humid: 2, sun: ['full'], moist: ['dry', 'mid'], h: [50, 80], spread: 40, bloom: [6, 7, 8, 9], color: ['red', 'pink'], leaf: 'green', form: 'globe', tags: ['natural', 'english', 'pollinator'], price: 700, cut: 'after', div: 'none', note: 'ワインレッドの小花がナチュラルに咲く。' },
  { id: 'scabiosa', ja: 'スカビオサ・コーカシカ', latin: 'Scabiosa caucasica', wiki: 'Scabiosa caucasica', type: 'herb', zone: [4, 8], heat: 7, humid: 1, sun: ['full'], moist: ['dry', 'mid'], h: [40, 70], spread: 40, bloom: [6, 7, 8, 9], color: ['blue', 'purple', 'white'], leaf: 'green', form: 'daisy', tags: ['english', 'pollinator'], price: 700, cut: 'after', div: 'spring', note: '高温多湿に弱い。アルカリ寄りの水はけよい土で。' },
  { id: 'leucanthemum', ja: 'シャスターデージー', latin: 'Leucanthemum × superbum', wiki: 'Leucanthemum × superbum', type: 'herb', zone: [5, 9], heat: 8, humid: 2, sun: ['full'], moist: ['mid'], h: [40, 90], spread: 45, bloom: [5, 6, 7], color: ['white'], leaf: 'green', form: 'daisy', tags: ['english', 'easy'], price: 450, cut: 'after', div: 'both', note: '丈夫な白花。2〜3年ごとの株分けで若返り。' },
  { id: 'erigeron', ja: 'エリゲロン（源平小菊）', latin: 'Erigeron karvinskianus', wiki: 'Erigeron karvinskianus', type: 'herb', zone: [7, 10], heat: 10, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [15, 30], spread: 45, bloom: [4, 5, 6, 7, 8, 9, 10, 11], color: ['white', 'pink'], leaf: 'green', form: 'mound', tags: ['natural', 'english', 'easy', 'dry'], price: 400, cut: 'after', div: 'spring', note: '白からピンクに変わる小菊。石垣や縁取りに。' },
  { id: 'persicaria-filiformis', ja: 'ペルシカリア・ミズヒキ', latin: 'Persicaria filiformis', wiki: 'Persicaria filiformis', type: 'herb', zone: [5, 9], heat: 9, humid: 3, sun: ['part', 'shade'], moist: ['mid'], h: [40, 80], spread: 40, bloom: [8, 9, 10], color: ['red'], leaf: 'green', form: 'airy', tags: ['wa', 'shade', 'easy', 'natural'], price: 400, cut: 'spring', div: 'spring', note: '日本の山野草。細い穂に小さな赤い花。' },
  { id: 'linaria', ja: 'リナリア・プルプレア', latin: 'Linaria purpurea', wiki: 'Linaria purpurea', type: 'herb', zone: [5, 9], heat: 8, humid: 2, sun: ['full'], moist: ['dry', 'mid'], h: [60, 90], spread: 30, bloom: [5, 6, 7, 8], color: ['purple', 'pink'], leaf: 'blue', form: 'spike', tags: ['english', 'natural', 'dry', 'pollinator'], price: 500, cut: 'after', div: 'none', note: '細く繊細な穂。こぼれ種でふえる。' },
  { id: 'lychnis', ja: 'リクニス・コロナリア（スイセンノウ）', latin: 'Lychnis coronaria', wiki: 'Silene coronaria', type: 'herb', zone: [4, 8], heat: 8, humid: 2, sun: ['full'], moist: ['dry'], h: [50, 80], spread: 40, bloom: [5, 6, 7], color: ['pink', 'white'], leaf: 'silver', form: 'daisy', tags: ['english', 'dry'], price: 400, cut: 'after', div: 'none', note: '銀葉に鮮やかなマゼンタ。短命だがこぼれ種で続く。' },
  { id: 'centranthus', ja: 'セントランサス', latin: 'Centranthus ruber', wiki: 'Centranthus ruber', type: 'herb', zone: [5, 9], heat: 8, humid: 2, sun: ['full'], moist: ['dry'], h: [50, 80], spread: 45, bloom: [5, 6, 7, 9], color: ['red', 'pink', 'white'], leaf: 'blue', form: 'plate', tags: ['english', 'dry', 'pollinator'], price: 600, cut: 'after', div: 'none', note: '石垣のすき間でも育つ。花後の切り戻しで返り咲き。' },
  { id: 'gypsophila', ja: '宿根カスミソウ', latin: 'Gypsophila paniculata', wiki: 'Gypsophila paniculata', type: 'herb', zone: [3, 9], heat: 7, humid: 1, sun: ['full'], moist: ['dry'], h: [60, 90], spread: 60, bloom: [6, 7], color: ['white', 'pink'], leaf: 'green', form: 'airy', tags: ['english', 'dry'], price: 600, cut: 'after', div: 'none', note: 'アルカリ性の水はけよい土で。暖地は難しい。' },
  { id: 'calamintha', ja: 'カラミンサ', latin: 'Clinopodium nepeta', wiki: 'Clinopodium nepeta', type: 'herb', zone: [5, 9], heat: 9, humid: 2, sun: ['full'], moist: ['dry', 'mid'], h: [30, 45], spread: 45, bloom: [7, 8, 9, 10], color: ['white', 'blue'], leaf: 'green', form: 'airy', tags: ['natural', 'prairie', 'pollinator', 'fragrant', 'dry', 'easy'], price: 600, cut: 'spring', div: 'spring', note: '夏〜秋に白い霞のような小花。ミントの香り。' },
  { id: 'origanum', ja: "オレガノ‘ヘーレンハウゼン’", latin: "Origanum 'Herrenhausen'", wiki: 'Origanum vulgare', type: 'herb', zone: [5, 9], heat: 8, humid: 2, sun: ['full'], moist: ['dry'], h: [30, 60], spread: 45, bloom: [7, 8, 9], color: ['pink', 'purple'], leaf: 'bronze', form: 'plate', tags: ['natural', 'prairie', 'pollinator', 'fragrant', 'dry'], price: 500, cut: 'spring', div: 'spring', note: '銅葉と紫の花穂。蜂がよく訪れる。' },
  { id: 'lavender', ja: 'ラベンダー（ラバンディン系）', latin: 'Lavandula × intermedia', wiki: 'Lavandula × intermedia', type: 'subshrub', zone: [5, 9], heat: 9, humid: 2, sun: ['full'], moist: ['dry'], h: [50, 90], spread: 60, bloom: [6, 7], color: ['purple'], leaf: 'silver', form: 'spike', tags: ['english', 'fragrant', 'dry', 'pollinator', 'evergreen'], price: 700, cut: 'after', div: 'none', note: '暖地は蒸れに強いラバンディン系、寒冷地はアングスティフォリア系がおすすめ。' },
  { id: 'perovskia', ja: 'ペロブスキア（ロシアンセージ）', latin: 'Salvia yangii', wiki: 'Salvia yangii', type: 'subshrub', zone: [4, 9], heat: 9, humid: 2, sun: ['full'], moist: ['dry'], h: [80, 120], spread: 80, bloom: [7, 8, 9, 10], color: ['blue', 'purple'], leaf: 'silver', form: 'airy', tags: ['prairie', 'dry', 'pollinator', 'fragrant'], price: 800, cut: 'spring', div: 'none', note: '早春に20〜30cmまで切り詰める。' },
  { id: 'rosemary', ja: 'ローズマリー', latin: 'Salvia rosmarinus', wiki: 'Rosemary', type: 'subshrub', zone: [7, 10], heat: 10, humid: 2, sun: ['full'], moist: ['dry'], h: [40, 150], spread: 70, bloom: [11, 12, 1, 2, 3, 4], color: ['blue'], leaf: 'silver', form: 'mound', tags: ['fragrant', 'dry', 'evergreen', 'easy'], price: 500, cut: 'after', div: 'none', note: '冬にも咲く常緑ハーブ。立性・ほふく性を使い分けて。' },
  { id: 'santolina', ja: 'サントリナ', latin: 'Santolina chamaecyparissus', wiki: 'Santolina chamaecyparissus', type: 'subshrub', zone: [6, 9], heat: 9, humid: 1, sun: ['full'], moist: ['dry'], h: [30, 60], spread: 60, bloom: [6, 7], color: ['yellow'], leaf: 'silver', form: 'mound', tags: ['dry', 'fragrant', 'evergreen'], price: 500, cut: 'after', div: 'none', note: '銀白色の葉がドライガーデンのアクセント。' },
  { id: 'artemisia', ja: "アルテミシア‘ポウイスキャッスル’", latin: "Artemisia 'Powis Castle'", wiki: 'Artemisia (plant)', type: 'subshrub', zone: [6, 9], heat: 9, humid: 1, sun: ['full'], moist: ['dry'], h: [60, 90], spread: 80, bloom: [8], color: ['green'], leaf: 'silver', form: 'mound', tags: ['dry', 'english', 'fragrant'], price: 600, cut: 'spring', div: 'none', note: '花より葉を楽しむ。銀葉で花色を引き立てる。' },
  { id: 'stachys', ja: 'ラムズイヤー', latin: 'Stachys byzantina', wiki: 'Stachys byzantina', type: 'herb', zone: [4, 8], heat: 8, humid: 1, sun: ['full'], moist: ['dry'], h: [20, 45], spread: 45, bloom: [6, 7], color: ['pink'], leaf: 'silver', form: 'mound', tags: ['english', 'dry'], price: 450, cut: 'leaves', div: 'both', note: '銀葉。梅雨時は傷んだ下葉を取り蒸れを防ぐ。' },
  { id: 'erysimum', ja: "エリシマム‘ボウルズモーヴ’", latin: "Erysimum 'Bowles's Mauve'", wiki: 'Erysimum', type: 'subshrub', zone: [6, 9], heat: 8, humid: 2, sun: ['full'], moist: ['dry', 'mid'], h: [60, 80], spread: 60, bloom: [3, 4, 5, 6], color: ['purple'], leaf: 'silver', form: 'spike', tags: ['english', 'dry', 'evergreen', 'pollinator'], price: 600, cut: 'after', div: 'none', note: '早春から長く咲く。花の少ない時期に貴重。' },
  { id: 'euphorbia', ja: 'ユーフォルビア・カラシアス', latin: 'Euphorbia characias', wiki: 'Euphorbia characias', type: 'subshrub', zone: [7, 10], heat: 9, humid: 1, sun: ['full'], moist: ['dry'], h: [60, 100], spread: 70, bloom: [3, 4, 5], color: ['green', 'yellow'], leaf: 'blue', form: 'globe', tags: ['dry', 'evergreen'], price: 1000, cut: 'after', div: 'none', note: '花後に花茎を地際で切る。白い樹液は肌に注意。' },

  // ---- 春〜初夏 ----
  { id: 'iris-germanica', ja: 'ジャーマンアイリス', latin: 'Iris germanica', wiki: 'Iris germanica', type: 'bulb', zone: [3, 9], heat: 9, humid: 1, sun: ['full'], moist: ['dry'], h: [60, 90], spread: 45, bloom: [5], color: ['purple', 'blue', 'yellow', 'white', 'pink'], leaf: 'blue', form: 'daisy', tags: ['english', 'dry'], price: 900, cut: 'after', div: 'autumn', note: '根茎を半分出して浅植えに。多湿を嫌う。' },
  { id: 'iris-sanguinea', ja: 'アヤメ', latin: 'Iris sanguinea', wiki: 'Iris sanguinea', type: 'bulb', zone: [3, 9], heat: 9, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [30, 60], spread: 30, bloom: [5], color: ['purple', 'white'], leaf: 'green', form: 'daisy', tags: ['wa', 'easy'], price: 500, cut: 'after', div: 'autumn', note: '日本の初夏の風物詩。乾いた土でも育つ。' },
  { id: 'iris-ensata', ja: 'ハナショウブ', latin: 'Iris ensata', wiki: 'Iris ensata', type: 'bulb', zone: [4, 9], heat: 9, humid: 3, sun: ['full'], moist: ['wet'], h: [60, 90], spread: 40, bloom: [6], color: ['purple', 'white', 'pink'], leaf: 'green', form: 'daisy', tags: ['wa'], price: 800, cut: 'after', div: 'autumn', note: '湿った場所向き。花後すぐの株分けも可。' },
  { id: 'paeonia', ja: 'シャクヤク', latin: 'Paeonia lactiflora', wiki: 'Paeonia lactiflora', type: 'herb', zone: [3, 8], heat: 8, humid: 2, sun: ['full'], moist: ['mid'], h: [60, 100], spread: 70, bloom: [5, 6], color: ['pink', 'white', 'red'], leaf: 'green', form: 'globe', tags: ['english', 'wa', 'fragrant'], price: 2000, cut: 'after', div: 'autumn', note: '植え付け・株分けは秋。芽を深く埋めすぎない。' },
  { id: 'lupinus', ja: 'ルピナス', latin: 'Lupinus polyphyllus', wiki: 'Lupinus polyphyllus', type: 'herb', zone: [4, 7], heat: 5, humid: 1, sun: ['full'], moist: ['mid'], h: [60, 120], spread: 45, bloom: [5, 6], color: ['purple', 'pink', 'yellow', 'white', 'red'], leaf: 'green', form: 'spike', tags: ['english', 'pollinator'], price: 600, cut: 'after', div: 'none', note: '冷涼地向き。暖地では一年草扱い。' },
  { id: 'delphinium', ja: 'デルフィニウム', latin: 'Delphinium elatum', wiki: 'Delphinium elatum', type: 'herb', zone: [3, 7], heat: 5, humid: 1, sun: ['full'], moist: ['mid'], h: [90, 180], spread: 45, bloom: [6, 7], color: ['blue', 'purple', 'white', 'pink'], leaf: 'green', form: 'spike', tags: ['english'], price: 800, cut: 'after', div: 'spring', note: '冷涼地向き。支柱が必要。' },
  { id: 'campanula', ja: 'カンパニュラ・ラクティフローラ', latin: 'Campanula lactiflora', wiki: 'Campanula lactiflora', type: 'herb', zone: [4, 8], heat: 6, humid: 1, sun: ['full', 'part'], moist: ['mid'], h: [80, 120], spread: 45, bloom: [6, 7], color: ['blue', 'white', 'purple'], leaf: 'green', form: 'globe', tags: ['english'], price: 700, cut: 'after', div: 'spring', note: '暑さに弱く冷涼地向き。' },
  { id: 'aquilegia', ja: 'オダマキ', latin: 'Aquilegia', wiki: 'Aquilegia vulgaris', type: 'herb', zone: [3, 8], heat: 8, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [30, 80], spread: 35, bloom: [4, 5, 6], color: ['blue', 'purple', 'pink', 'white', 'yellow', 'red'], leaf: 'blue', form: 'airy', tags: ['english', 'wa', 'natural'], price: 500, cut: 'after', div: 'none', note: '短命だがこぼれ種で更新。' },
  { id: 'astrantia', ja: 'アストランティア', latin: 'Astrantia major', wiki: 'Astrantia major', type: 'herb', zone: [4, 7], heat: 6, humid: 1, sun: ['part'], moist: ['mid', 'wet'], h: [45, 75], spread: 45, bloom: [5, 6, 7], color: ['pink', 'white', 'red'], leaf: 'green', form: 'plate', tags: ['english', 'natural'], price: 1000, cut: 'after', div: 'spring', note: '繊細な星形の花。冷涼な半日陰向き。' },
  { id: 'geum', ja: 'ゲウム', latin: 'Geum', wiki: 'Geum', type: 'herb', zone: [5, 8], heat: 7, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [30, 50], spread: 40, bloom: [5, 6], color: ['orange', 'red', 'yellow'], leaf: 'green', form: 'airy', tags: ['english', 'natural'], price: 700, cut: 'after', div: 'autumn', note: '鮮やかな暖色の差し色。' },
  { id: 'alchemilla', ja: 'アルケミラ・モリス', latin: 'Alchemilla mollis', wiki: 'Alchemilla mollis', type: 'herb', zone: [3, 8], heat: 7, humid: 1, sun: ['full', 'part'], moist: ['mid'], h: [30, 45], spread: 50, bloom: [5, 6], color: ['yellow', 'green'], leaf: 'green', form: 'airy', tags: ['english'], price: 600, cut: 'after', div: 'spring', note: '縁取りに。暖地では午後日陰で夏越し。' },
  { id: 'amsonia', ja: 'アムソニア（チョウジソウ）', latin: 'Amsonia tabernaemontana', wiki: 'Amsonia tabernaemontana', type: 'herb', zone: [4, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [60, 90], spread: 60, bloom: [5, 6], color: ['blue'], leaf: 'green', form: 'plate', tags: ['natural', 'prairie', 'easy'], price: 900, cut: 'after', div: 'spring', note: '秋の黄葉が美しく、長寿命。' },
  { id: 'baptisia', ja: 'バプティシア', latin: 'Baptisia australis', wiki: 'Baptisia australis', type: 'herb', zone: [3, 9], heat: 9, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [90, 120], spread: 90, bloom: [5, 6], color: ['blue', 'purple'], leaf: 'blue', form: 'spike', tags: ['prairie', 'natural', 'easy', 'pollinator'], price: 1500, cut: 'none', div: 'none', note: '根が深く移植を嫌うが、一度根付けば非常に丈夫。' },
  { id: 'tradescantia', ja: 'ムラサキツユクサ', latin: 'Tradescantia virginiana', wiki: 'Tradescantia virginiana', type: 'herb', zone: [4, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [40, 60], spread: 45, bloom: [5, 6, 7], color: ['purple', 'blue', 'white'], leaf: 'green', form: 'mound', tags: ['easy', 'natural', 'wa'], price: 400, cut: 'after', div: 'both', note: '朝咲いて昼にしぼむ一日花。非常に丈夫。' },
  { id: 'phlox-subulata', ja: 'シバザクラ', latin: 'Phlox subulata', wiki: 'Phlox subulata', type: 'herb', zone: [3, 9], heat: 9, humid: 2, sun: ['full'], moist: ['dry', 'mid'], h: [5, 15], spread: 50, bloom: [4, 5], color: ['pink', 'white', 'purple'], leaf: 'green', form: 'mound', tags: ['easy', 'evergreen', 'dry'], price: 250, cut: 'after', div: 'autumn', note: '春のグラウンドカバー。花後に軽く刈り込む。' },
  { id: 'dianthus', ja: 'ダイアンサス（宿根ナデシコ）', latin: 'Dianthus gratianopolitanus', wiki: 'Dianthus gratianopolitanus', type: 'herb', zone: [4, 9], heat: 8, humid: 2, sun: ['full'], moist: ['dry'], h: [15, 30], spread: 30, bloom: [4, 5, 6], color: ['pink', 'red', 'white'], leaf: 'blue', form: 'mound', tags: ['english', 'fragrant', 'dry', 'evergreen'], price: 400, cut: 'after', div: 'autumn', note: '銀青色の葉と香りのよい花。縁取りに。' },
  { id: 'dianthus-superbus', ja: 'カワラナデシコ', latin: 'Dianthus superbus', wiki: 'Dianthus superbus', type: 'herb', zone: [4, 9], heat: 9, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [30, 60], spread: 30, bloom: [6, 7, 8], color: ['pink'], leaf: 'green', form: 'airy', tags: ['wa', 'natural', 'fragrant'], price: 400, cut: 'after', div: 'spring', note: '秋の七草。細く裂けた花弁が繊細。' },
  { id: 'armeria', ja: 'アルメリア', latin: 'Armeria maritima', wiki: 'Armeria maritima', type: 'herb', zone: [4, 8], heat: 7, humid: 1, sun: ['full'], moist: ['dry'], h: [15, 30], spread: 25, bloom: [4, 5, 6], color: ['pink', 'white'], leaf: 'green', form: 'globe', tags: ['dry', 'evergreen'], price: 300, cut: 'after', div: 'autumn', note: 'ボール状の花。水はけのよい場所で。' },
  { id: 'iberis', ja: 'イベリス・センパービレンス', latin: 'Iberis sempervirens', wiki: 'Iberis sempervirens', type: 'subshrub', zone: [4, 8], heat: 8, humid: 2, sun: ['full'], moist: ['dry', 'mid'], h: [15, 30], spread: 40, bloom: [3, 4, 5], color: ['white'], leaf: 'green', form: 'mound', tags: ['english', 'evergreen', 'dry'], price: 450, cut: 'after', div: 'none', note: '早春に純白の花で覆われる常緑の縁取り。' },
  { id: 'cerastium', ja: 'セラスチウム（シロミミナグサ）', latin: 'Cerastium tomentosum', wiki: 'Cerastium tomentosum', type: 'herb', zone: [3, 8], heat: 7, humid: 1, sun: ['full'], moist: ['dry'], h: [10, 20], spread: 45, bloom: [5, 6], color: ['white'], leaf: 'silver', form: 'mound', tags: ['dry', 'evergreen'], price: 350, cut: 'after', div: 'autumn', note: '銀葉のグラウンドカバー。蒸れに注意。' },
  { id: 'thymus', ja: 'クリーピングタイム', latin: 'Thymus serpyllum', wiki: 'Thymus serpyllum', type: 'subshrub', zone: [4, 9], heat: 9, humid: 1, sun: ['full'], moist: ['dry'], h: [5, 10], spread: 40, bloom: [5, 6], color: ['pink', 'purple'], leaf: 'green', form: 'mound', tags: ['dry', 'fragrant', 'evergreen', 'pollinator'], price: 350, cut: 'after', div: 'spring', note: '踏むと香る。敷石の間やドライガーデンに。' },
  { id: 'bletilla', ja: 'シラン', latin: 'Bletilla striata', wiki: 'Bletilla striata', type: 'bulb', zone: [5, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [30, 60], spread: 30, bloom: [4, 5], color: ['purple', 'white', 'pink'], leaf: 'green', form: 'spike', tags: ['wa', 'easy'], price: 400, cut: 'spring', div: 'both', note: '日本原産のラン。丈夫で育てやすい。' },

  // ---- 半日陰・日陰 ----
  { id: 'astilbe', ja: 'アスチルベ', latin: 'Astilbe × arendsii', wiki: 'Astilbe', type: 'herb', zone: [4, 8], heat: 7, humid: 3, sun: ['part', 'shade'], moist: ['mid', 'wet'], h: [40, 90], spread: 45, bloom: [6, 7], color: ['pink', 'white', 'red'], leaf: 'green', form: 'spike', tags: ['shade', 'english', 'wa'], price: 600, cut: 'after', div: 'both', note: '乾燥に弱い。半日陰の湿り気ある場所で。' },
  { id: 'hosta', ja: 'ギボウシ（ホスタ）', latin: 'Hosta', wiki: 'Hosta', type: 'herb', zone: [3, 9], heat: 9, humid: 3, sun: ['part', 'shade'], moist: ['mid', 'wet'], h: [20, 90], spread: 60, bloom: [6, 7, 8], color: ['white', 'purple'], leaf: 'variegated', form: 'mound', tags: ['shade', 'wa', 'easy'], price: 800, cut: 'none', div: 'both', note: '日本原産。葉色・斑入りが豊富で日陰の主役。' },
  { id: 'helleborus', ja: 'クリスマスローズ', latin: 'Helleborus × hybridus', wiki: 'Helleborus orientalis', type: 'herb', zone: [4, 9], heat: 9, humid: 2, sun: ['part', 'shade'], moist: ['mid'], h: [30, 50], spread: 45, bloom: [1, 2, 3, 4], color: ['white', 'pink', 'purple', 'green'], leaf: 'green', form: 'mound', tags: ['shade', 'english', 'evergreen'], price: 1500, cut: 'leaves', div: 'autumn', note: '冬〜早春の貴重な花。12月頃に古葉を切ると花が映える。' },
  { id: 'heuchera', ja: 'ヒューケラ', latin: 'Heuchera', wiki: 'Heuchera', type: 'herb', zone: [4, 9], heat: 8, humid: 2, sun: ['part', 'shade'], moist: ['mid'], h: [20, 40], spread: 35, bloom: [5, 6], color: ['pink', 'red', 'white'], leaf: 'bronze', form: 'mound', tags: ['shade', 'evergreen', 'english'], price: 900, cut: 'leaves', div: 'autumn', note: 'カラーリーフ。水はけのよい土で根腐れを防ぐ。' },
  { id: 'tiarella', ja: 'ティアレラ', latin: 'Tiarella cordifolia', wiki: 'Tiarella cordifolia', type: 'herb', zone: [4, 9], heat: 7, humid: 2, sun: ['part', 'shade'], moist: ['mid'], h: [20, 40], spread: 35, bloom: [4, 5], color: ['white', 'pink'], leaf: 'green', form: 'spike', tags: ['shade', 'evergreen', 'natural'], price: 800, cut: 'leaves', div: 'autumn', note: '泡のような小花の穂。日陰の縁取りに。' },
  { id: 'brunnera', ja: 'ブルンネラ', latin: 'Brunnera macrophylla', wiki: 'Brunnera macrophylla', type: 'herb', zone: [3, 8], heat: 7, humid: 1, sun: ['part', 'shade'], moist: ['mid'], h: [30, 45], spread: 45, bloom: [4, 5], color: ['blue'], leaf: 'silver', form: 'airy', tags: ['shade', 'english'], price: 1000, cut: 'leaves', div: 'spring', note: 'シルバーリーフ。暖地では夏越しが難しい。' },
  { id: 'pulmonaria', ja: 'プルモナリア', latin: 'Pulmonaria', wiki: 'Pulmonaria officinalis', type: 'herb', zone: [3, 8], heat: 7, humid: 2, sun: ['part', 'shade'], moist: ['mid'], h: [20, 30], spread: 40, bloom: [3, 4], color: ['blue', 'pink', 'white'], leaf: 'variegated', form: 'mound', tags: ['shade', 'english'], price: 900, cut: 'leaves', div: 'autumn', note: '早春の日陰を彩る。斑入り葉も楽しめる。' },
  { id: 'lamium', ja: 'ラミウム', latin: 'Lamium maculatum', wiki: 'Lamium maculatum', type: 'herb', zone: [4, 8], heat: 8, humid: 2, sun: ['part', 'shade'], moist: ['mid'], h: [15, 25], spread: 45, bloom: [4, 5], color: ['pink', 'white'], leaf: 'silver', form: 'mound', tags: ['shade', 'easy'], price: 400, cut: 'after', div: 'both', note: '銀葉が日陰を明るくするグラウンドカバー。' },
  { id: 'ajuga', ja: 'アジュガ', latin: 'Ajuga reptans', wiki: 'Ajuga reptans', type: 'herb', zone: [3, 9], heat: 9, humid: 2, sun: ['part', 'shade'], moist: ['mid'], h: [10, 20], spread: 40, bloom: [4, 5], color: ['blue', 'purple'], leaf: 'bronze', form: 'spike', tags: ['shade', 'easy', 'evergreen'], price: 300, cut: 'after', div: 'both', note: '日陰のグラウンドカバー。ランナーで広がる。' },
  { id: 'vinca', ja: 'ビンカ・ミノール', latin: 'Vinca minor', wiki: 'Vinca minor', type: 'subshrub', zone: [4, 8], heat: 8, humid: 3, sun: ['part', 'shade'], moist: ['mid'], h: [10, 15], spread: 45, bloom: [3, 4, 5], color: ['blue', 'white'], leaf: 'green', form: 'mound', tags: ['shade', 'evergreen', 'easy'], price: 300, cut: 'after', div: 'both', note: '常緑のつる性グラウンドカバー。' },
  { id: 'bergenia', ja: 'ベルゲニア（ヒマラヤユキノシタ）', latin: 'Bergenia', wiki: 'Bergenia cordifolia', type: 'herb', zone: [3, 9], heat: 8, humid: 2, sun: ['full', 'part', 'shade'], moist: ['mid'], h: [30, 45], spread: 45, bloom: [2, 3, 4], color: ['pink', 'white'], leaf: 'green', form: 'mound', tags: ['shade', 'evergreen', 'easy'], price: 600, cut: 'leaves', div: 'autumn', note: '光沢のある大きな葉。冬は赤く色づく。' },
  { id: 'epimedium', ja: 'イカリソウ', latin: 'Epimedium', wiki: 'Epimedium', type: 'herb', zone: [4, 8], heat: 8, humid: 2, sun: ['part', 'shade'], moist: ['dry', 'mid'], h: [20, 40], spread: 40, bloom: [3, 4], color: ['yellow', 'white', 'pink', 'purple'], leaf: 'green', form: 'airy', tags: ['shade', 'wa'], price: 1200, cut: 'leaves', div: 'autumn', note: '錨形の花。早春に古葉を切ると花が見やすい。' },
  { id: 'dicentra', ja: 'タイツリソウ（ケマンソウ）', latin: 'Lamprocapnos spectabilis', wiki: 'Lamprocapnos', type: 'herb', zone: [3, 8], heat: 7, humid: 2, sun: ['part', 'shade'], moist: ['mid'], h: [60, 90], spread: 50, bloom: [4, 5], color: ['pink', 'white'], leaf: 'green', form: 'airy', tags: ['shade', 'wa', 'english'], price: 900, cut: 'none', div: 'autumn', note: 'ハート形の花が連なる。夏は地上部が消える。' },
  { id: 'polygonatum', ja: 'ナルコユリ', latin: 'Polygonatum odoratum', wiki: 'Polygonatum odoratum', type: 'herb', zone: [4, 8], heat: 8, humid: 3, sun: ['part', 'shade'], moist: ['mid'], h: [40, 80], spread: 40, bloom: [4, 5], color: ['white'], leaf: 'variegated', form: 'airy', tags: ['shade', 'wa'], price: 700, cut: 'spring', div: 'spring', note: '弓なりの茎に吊り下がる花。日陰に気品を。' },
  { id: 'iris-japonica', ja: 'シャガ', latin: 'Iris japonica', wiki: 'Iris japonica', type: 'bulb', zone: [7, 9], heat: 9, humid: 3, sun: ['part', 'shade'], moist: ['mid', 'wet'], h: [30, 60], spread: 40, bloom: [4, 5], color: ['white', 'blue'], leaf: 'green', form: 'daisy', tags: ['shade', 'wa', 'evergreen', 'easy'], price: 300, cut: 'leaves', div: 'both', note: '常緑で日陰の斜面を覆う。' },
  { id: 'saxifraga', ja: 'ユキノシタ', latin: 'Saxifraga stolonifera', wiki: 'Saxifraga stolonifera', type: 'herb', zone: [6, 9], heat: 9, humid: 3, sun: ['part', 'shade'], moist: ['mid', 'wet'], h: [10, 30], spread: 30, bloom: [5, 6], color: ['white'], leaf: 'variegated', form: 'airy', tags: ['shade', 'wa', 'evergreen', 'easy'], price: 300, cut: 'none', div: 'both', note: '湿った日陰のグラウンドカバー。' },
  { id: 'ophiopogon', ja: 'タマリュウ', latin: "Ophiopogon japonicus 'Nanus'", wiki: 'Ophiopogon japonicus', type: 'grass', zone: [6, 10], heat: 10, humid: 3, sun: ['full', 'part', 'shade'], moist: ['mid'], h: [5, 15], spread: 15, bloom: [7], color: ['white'], leaf: 'green', form: 'grass', tags: ['wa', 'shade', 'evergreen', 'easy'], price: 150, cut: 'none', div: 'spring', note: '和の庭の定番グラウンドカバー。' },
  { id: 'liriope', ja: 'ヤブラン', latin: 'Liriope muscari', wiki: 'Liriope muscari', type: 'herb', zone: [5, 10], heat: 10, humid: 3, sun: ['full', 'part', 'shade'], moist: ['dry', 'mid'], h: [30, 40], spread: 40, bloom: [8, 9], color: ['purple'], leaf: 'variegated', form: 'spike', tags: ['wa', 'shade', 'evergreen', 'easy'], price: 400, cut: 'leaves', div: 'spring', note: '常緑で丈夫。早春に古葉を刈ると新葉がきれい。' },
  { id: 'tsuwabuki', ja: 'ツワブキ', latin: 'Farfugium japonicum', wiki: 'Farfugium japonicum', type: 'herb', zone: [7, 10], heat: 11, humid: 3, sun: ['part', 'shade'], moist: ['mid', 'wet'], h: [30, 60], spread: 60, bloom: [10, 11, 12], color: ['yellow'], leaf: 'green', form: 'daisy', tags: ['wa', 'shade', 'evergreen', 'easy'], price: 600, cut: 'leaves', div: 'spring', note: '日本原産。日陰の晩秋を明るくする常緑の葉。' },
  { id: 'tricyrtis', ja: 'ホトトギス', latin: 'Tricyrtis hirta', wiki: 'Tricyrtis hirta', type: 'herb', zone: [4, 9], heat: 9, humid: 3, sun: ['part', 'shade'], moist: ['mid', 'wet'], h: [40, 80], spread: 40, bloom: [9, 10, 11], color: ['purple', 'white'], leaf: 'green', form: 'airy', tags: ['wa', 'shade'], price: 500, cut: 'spring', div: 'spring', note: '日本原産。乾燥と強光を嫌う。' },
  { id: 'begonia-grandis', ja: 'シュウカイドウ', latin: 'Begonia grandis', wiki: 'Begonia grandis', type: 'bulb', zone: [6, 9], heat: 9, humid: 3, sun: ['part', 'shade'], moist: ['mid', 'wet'], h: [40, 70], spread: 40, bloom: [8, 9, 10], color: ['pink'], leaf: 'green', form: 'airy', tags: ['wa', 'shade', 'easy'], price: 400, cut: 'spring', div: 'spring', note: '球根ベゴニア。むかごでふえる。' },
  { id: 'actaea', ja: 'アクタエア（サラシナショウマ）', latin: 'Actaea simplex', wiki: 'Actaea simplex', type: 'herb', zone: [4, 8], heat: 7, humid: 2, sun: ['part', 'shade'], moist: ['mid', 'wet'], h: [100, 180], spread: 60, bloom: [9, 10], color: ['white'], leaf: 'bronze', form: 'spike', tags: ['shade', 'wa', 'fragrant'], price: 1200, cut: 'spring', div: 'spring', note: '秋の日陰に白い穂が立ち上がる。銅葉品種も人気。' },
  { id: 'aruncus', ja: 'ヤマブキショウマ', latin: 'Aruncus dioicus', wiki: 'Aruncus dioicus', type: 'herb', zone: [3, 7], heat: 7, humid: 2, sun: ['part', 'shade'], moist: ['mid', 'wet'], h: [60, 150], spread: 70, bloom: [5, 6], color: ['white'], leaf: 'green', form: 'spike', tags: ['shade', 'wa', 'natural'], price: 800, cut: 'after', div: 'spring', note: '初夏の日陰にふわりとした白い花穂。' },
  { id: 'rodgersia', ja: 'ヤグルマソウ（ロジャーシア）', latin: 'Rodgersia podophylla', wiki: 'Rodgersia podophylla', type: 'herb', zone: [5, 8], heat: 6, humid: 2, sun: ['part', 'shade'], moist: ['wet'], h: [60, 100], spread: 70, bloom: [6, 7], color: ['white', 'pink'], leaf: 'bronze', form: 'plate', tags: ['shade', 'wa'], price: 1200, cut: 'spring', div: 'spring', note: '大きな葉が迫力。冷涼で湿った半日陰に。' },
  { id: 'kirengeshoma', ja: 'キレンゲショウマ', latin: 'Kirengeshoma palmata', wiki: 'Kirengeshoma palmata', type: 'herb', zone: [5, 8], heat: 7, humid: 2, sun: ['part', 'shade'], moist: ['wet'], h: [60, 100], spread: 60, bloom: [8, 9], color: ['yellow'], leaf: 'green', form: 'globe', tags: ['shade', 'wa'], price: 1200, cut: 'spring', div: 'spring', note: '日本原産。クリーム色のつぼみが下向きに咲く。' },
  { id: 'ligularia', ja: 'リグラリア', latin: 'Ligularia dentata', wiki: 'Ligularia dentata', type: 'herb', zone: [4, 8], heat: 7, humid: 2, sun: ['part', 'shade'], moist: ['wet'], h: [60, 100], spread: 60, bloom: [7, 8], color: ['orange', 'yellow'], leaf: 'bronze', form: 'daisy', tags: ['shade'], price: 800, cut: 'after', div: 'spring', note: '水切れに弱い。湿った半日陰で。' },
  { id: 'anemone', ja: 'シュウメイギク', latin: 'Anemone hupehensis var. japonica', wiki: 'Anemone hupehensis', type: 'herb', zone: [5, 8], heat: 8, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [50, 120], spread: 60, bloom: [9, 10], color: ['pink', 'white'], leaf: 'green', form: 'daisy', tags: ['wa', 'english', 'easy', 'shade'], price: 600, cut: 'spring', div: 'spring', note: '地下茎で広がる。秋の半日陰を明るくする。' },
  { id: 'agapanthus', ja: 'アガパンサス', latin: 'Agapanthus', wiki: 'Agapanthus', type: 'herb', zone: [6, 11], heat: 11, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [50, 120], spread: 50, bloom: [6, 7], color: ['blue', 'white'], leaf: 'green', form: 'globe', tags: ['easy', 'natural'], price: 900, cut: 'after', div: 'spring', note: '落葉性品種は寒さに強く、常緑性は暖地向き。' },
  { id: 'tulbaghia', ja: 'ツルバキア', latin: 'Tulbaghia violacea', wiki: 'Tulbaghia violacea', type: 'bulb', zone: [7, 10], heat: 10, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [30, 60], spread: 30, bloom: [5, 6, 7, 8, 9, 10], color: ['purple', 'pink'], leaf: 'green', form: 'globe', tags: ['easy', 'dry', 'natural'], price: 500, cut: 'after', div: 'spring', note: '初夏から秋まで長く咲く。葉はニラのような香り。' },
  { id: 'zephyranthes', ja: 'タマスダレ', latin: 'Zephyranthes candida', wiki: 'Zephyranthes candida', type: 'bulb', zone: [7, 10], heat: 10, humid: 3, sun: ['full'], moist: ['mid'], h: [20, 30], spread: 15, bloom: [8, 9, 10], color: ['white'], leaf: 'green', form: 'daisy', tags: ['wa', 'easy', 'evergreen'], price: 100, cut: 'none', div: 'spring', note: '雨のあとに一斉に咲く。縁取りに。' },

  // ---- 日本の秋・和の庭 ----
  { id: 'platycodon', ja: 'キキョウ', latin: 'Platycodon grandiflorus', wiki: 'Platycodon', type: 'herb', zone: [3, 9], heat: 9, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [40, 80], spread: 35, bloom: [6, 7, 8, 9], color: ['blue', 'white', 'pink'], leaf: 'green', form: 'daisy', tags: ['wa', 'natural'], price: 450, cut: 'after', div: 'none', note: '太い根で移植を嫌う。秋の七草。' },
  { id: 'patrinia', ja: 'オミナエシ', latin: 'Patrinia scabiosifolia', wiki: 'Patrinia scabiosifolia', type: 'herb', zone: [5, 9], heat: 9, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [60, 120], spread: 40, bloom: [8, 9, 10], color: ['yellow'], leaf: 'green', form: 'plate', tags: ['wa', 'natural', 'pollinator'], price: 500, cut: 'chelsea', div: 'spring', note: '秋の七草。透け感のある黄色。' },
  { id: 'eupatorium', ja: 'フジバカマ', latin: 'Eupatorium japonicum', wiki: 'Eupatorium japonicum', type: 'herb', zone: [5, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [100, 150], spread: 50, bloom: [9, 10], color: ['pink', 'white'], leaf: 'green', form: 'plate', tags: ['wa', 'natural', 'pollinator', 'fragrant'], price: 500, cut: 'chelsea', div: 'spring', note: '秋の七草。渡りの蝶アサギマダラが訪れる。' },
  { id: 'sanguisorba', ja: 'ワレモコウ（サンギソルバ）', latin: 'Sanguisorba officinalis', wiki: 'Sanguisorba officinalis', type: 'herb', zone: [4, 8], heat: 8, humid: 3, sun: ['full'], moist: ['mid', 'wet'], h: [60, 120], spread: 45, bloom: [8, 9, 10], color: ['red'], leaf: 'green', form: 'airy', tags: ['wa', 'prairie', 'natural', 'pollinator'], price: 700, cut: 'spring', div: 'spring', note: '揺れる小さな花穂。グラスと好相性。' },
  { id: 'aster-ageratoides', ja: 'ノコンギク', latin: 'Aster ageratoides', wiki: 'Aster ageratoides', type: 'herb', zone: [4, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [30, 80], spread: 45, bloom: [9, 10, 11], color: ['purple', 'white'], leaf: 'green', form: 'airy', tags: ['wa', 'natural', 'easy', 'pollinator'], price: 400, cut: 'chelsea', div: 'spring', note: '日本の野菊。秋の庭に素朴な彩り。' },
  { id: 'aster-tataricus', ja: 'シオン', latin: 'Aster tataricus', wiki: 'Aster tataricus', type: 'herb', zone: [3, 8], heat: 9, humid: 3, sun: ['full'], moist: ['mid', 'wet'], h: [100, 200], spread: 60, bloom: [9, 10], color: ['purple'], leaf: 'green', form: 'plate', tags: ['wa', 'natural', 'pollinator', 'easy'], price: 500, cut: 'chelsea', div: 'spring', note: '背の高い秋の野菊。花壇の背景に。' },
  { id: 'miyakowasure', ja: 'ミヤコワスレ', latin: 'Aster savatieri', wiki: 'Aster savatieri', type: 'herb', zone: [5, 8], heat: 7, humid: 2, sun: ['part'], moist: ['mid'], h: [20, 40], spread: 30, bloom: [4, 5, 6], color: ['purple', 'white', 'pink'], leaf: 'green', form: 'daisy', tags: ['wa', 'shade'], price: 400, cut: 'after', div: 'autumn', note: '春の和の花。夏の西日を避けて。' },
  { id: 'gentiana', ja: 'リンドウ', latin: 'Gentiana scabra', wiki: 'Gentiana scabra', type: 'herb', zone: [5, 8], heat: 7, humid: 2, sun: ['full', 'part'], moist: ['mid'], h: [30, 60], spread: 30, bloom: [9, 10, 11], color: ['blue'], leaf: 'green', form: 'spike', tags: ['wa'], price: 600, cut: 'spring', div: 'spring', note: '秋の深い青。日当たりと水はけのよい場所で。' },
  { id: 'lycoris', ja: 'ヒガンバナ（リコリス）', latin: 'Lycoris radiata', wiki: 'Lycoris radiata', type: 'bulb', zone: [6, 10], heat: 10, humid: 3, sun: ['full', 'part'], moist: ['dry', 'mid'], h: [30, 50], spread: 15, bloom: [9], color: ['red', 'white'], leaf: 'green', form: 'globe', tags: ['wa', 'easy'], price: 200, cut: 'none', div: 'none', note: '秋の彼岸に咲く。花後に葉が出て冬を越す。' },
  { id: 'lespedeza', ja: 'ハギ', latin: 'Lespedeza thunbergii', wiki: 'Lespedeza thunbergii', type: 'subshrub', zone: [5, 9], heat: 9, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [100, 200], spread: 120, bloom: [8, 9, 10], color: ['pink', 'white'], leaf: 'green', form: 'airy', tags: ['wa', 'natural', 'easy'], price: 1200, cut: 'spring', div: 'none', note: '秋の七草。早春に地際で切ると毎年きれいに咲く。' },
  { id: 'lysimachia', ja: 'オカトラノオ', latin: 'Lysimachia clethroides', wiki: 'Lysimachia clethroides', type: 'herb', zone: [3, 8], heat: 8, humid: 3, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [60, 90], spread: 50, bloom: [6, 7], color: ['white'], leaf: 'green', form: 'spike', tags: ['wa', 'natural', 'easy'], price: 500, cut: 'after', div: 'spring', note: '弓なりの白い穂が揃って咲く。広がりやすい。' },
  { id: 'lysimachia-aurea', ja: "リシマキア・ヌンムラリア‘オーレア’", latin: "Lysimachia nummularia 'Aurea'", wiki: 'Lysimachia nummularia', type: 'herb', zone: [3, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['mid', 'wet'], h: [5, 10], spread: 50, bloom: [6, 7], color: ['yellow'], leaf: 'gold', form: 'mound', tags: ['easy', 'evergreen', 'natural'], price: 350, cut: 'none', div: 'both', note: '黄金葉のグラウンドカバー。足元を明るく。' },

  // ---- グラス類 ----
  { id: 'hakonechloa', ja: 'フウチソウ', latin: 'Hakonechloa macra', wiki: 'Hakonechloa', type: 'grass', zone: [5, 9], heat: 9, humid: 3, sun: ['full', 'part', 'shade'], moist: ['mid'], h: [30, 60], spread: 50, bloom: [8, 9], color: ['green'], leaf: 'gold', form: 'grass', tags: ['wa', 'shade', 'natural'], price: 700, cut: 'spring', div: 'spring', note: '日本原産のグラス。半日陰で葉色が美しい。' },
  { id: 'panicum', ja: 'パニカム（スイッチグラス）', latin: 'Panicum virgatum', wiki: 'Panicum virgatum', type: 'grass', zone: [4, 9], heat: 9, humid: 3, sun: ['full'], moist: ['dry', 'mid', 'wet'], h: [90, 180], spread: 60, bloom: [8, 9, 10], color: ['green', 'red'], leaf: 'blue', form: 'grass', tags: ['prairie', 'natural', 'easy'], price: 900, cut: 'spring', div: 'spring', note: '秋の紅葉と穂。冬も刈らずに残すと美しい。' },
  { id: 'miscanthus', ja: 'ススキ（ミスカンツス）', latin: 'Miscanthus sinensis', wiki: 'Miscanthus sinensis', type: 'grass', zone: [5, 9], heat: 9, humid: 3, sun: ['full'], moist: ['mid'], h: [100, 200], spread: 90, bloom: [9, 10, 11], color: ['white'], leaf: 'variegated', form: 'grass', tags: ['wa', 'prairie', 'natural', 'easy'], price: 900, cut: 'spring', div: 'spring', note: '斑入りや小型品種が庭向き。' },
  { id: 'pennisetum', ja: 'ペニセタム（チカラシバ）', latin: 'Pennisetum alopecuroides', wiki: 'Cenchrus alopecuroides', type: 'grass', zone: [5, 9], heat: 9, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [50, 90], spread: 60, bloom: [8, 9, 10], color: ['white', 'pink'], leaf: 'green', form: 'grass', tags: ['prairie', 'natural', 'wa', 'easy'], price: 700, cut: 'spring', div: 'spring', note: 'ふさふさの穂が秋の光に映える。' },
  { id: 'calamagrostis', ja: "カラマグロスティス‘カールフォースター’", latin: "Calamagrostis × acutiflora 'Karl Foerster'", wiki: 'Calamagrostis × acutiflora', type: 'grass', zone: [4, 9], heat: 8, humid: 2, sun: ['full'], moist: ['mid', 'wet'], h: [120, 150], spread: 60, bloom: [6, 7, 8, 9, 10], color: ['white'], leaf: 'green', form: 'grass', tags: ['prairie', 'natural'], price: 1000, cut: 'spring', div: 'spring', note: 'まっすぐ立つ穂が縦のリズムをつくる。' },
  { id: 'muhlenbergia', ja: 'ミューレンベルギア（ピンクミューリー）', latin: 'Muhlenbergia capillaris', wiki: 'Muhlenbergia capillaris', type: 'grass', zone: [6, 10], heat: 10, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [60, 90], spread: 60, bloom: [9, 10, 11], color: ['pink'], leaf: 'green', form: 'grass', tags: ['prairie', 'dry', 'natural'], price: 900, cut: 'spring', div: 'spring', note: '秋にピンクの霞のような穂。' },
  { id: 'stipa', ja: 'スティパ・テヌイッシマ', latin: 'Nassella tenuissima', wiki: 'Nassella tenuissima', type: 'grass', zone: [7, 10], heat: 8, humid: 1, sun: ['full'], moist: ['dry'], h: [40, 60], spread: 40, bloom: [6, 7, 8], color: ['white'], leaf: 'green', form: 'grass', tags: ['prairie', 'dry', 'natural'], price: 500, cut: 'spring', div: 'none', note: '髪のように細い葉が風になびく。' },
  { id: 'festuca', ja: 'ブルーフェスキュー', latin: 'Festuca glauca', wiki: 'Festuca glauca', type: 'grass', zone: [4, 8], heat: 8, humid: 1, sun: ['full'], moist: ['dry'], h: [20, 30], spread: 30, bloom: [6], color: ['green'], leaf: 'blue', form: 'grass', tags: ['dry', 'evergreen'], price: 400, cut: 'leaves', div: 'spring', note: '青白い葉のクッション。ドライガーデンの縁取りに。' },
  { id: 'imperata', ja: "チガヤ‘レッドバロン’", latin: "Imperata cylindrica 'Red Baron'", wiki: 'Imperata cylindrica', type: 'grass', zone: [5, 9], heat: 9, humid: 3, sun: ['full', 'part'], moist: ['mid'], h: [30, 50], spread: 40, bloom: [6], color: ['green'], leaf: 'bronze', form: 'grass', tags: ['wa', 'natural'], price: 700, cut: 'spring', div: 'spring', note: '葉先が赤く染まる。逆光で美しい。' },
  { id: 'carex', ja: "カレックス‘エバーゴールド’", latin: "Carex oshimensis 'Evergold'", wiki: 'Carex oshimensis', type: 'grass', zone: [5, 9], heat: 9, humid: 3, sun: ['part', 'shade'], moist: ['mid'], h: [20, 30], spread: 40, bloom: [4], color: ['green'], leaf: 'gold', form: 'grass', tags: ['shade', 'evergreen', 'wa', 'easy'], price: 500, cut: 'leaves', div: 'spring', note: '常緑のカラーリーフ。春に傷んだ葉を整理。' },

  // ---- その他 ----
  { id: 'aster', ja: '宿根アスター（ユウゼンギク）', latin: 'Symphyotrichum novi-belgii', wiki: 'Symphyotrichum novi-belgii', type: 'herb', zone: [3, 8], heat: 8, humid: 2, sun: ['full'], moist: ['mid'], h: [50, 120], spread: 50, bloom: [9, 10, 11], color: ['purple', 'pink', 'white'], leaf: 'green', form: 'daisy', tags: ['natural', 'english', 'pollinator'], price: 500, cut: 'chelsea', div: 'spring', note: '初夏に摘心すると倒れにくくこんもり咲く。' },
  { id: 'verbena', ja: 'バーベナ・ボナリエンシス', latin: 'Verbena bonariensis', wiki: 'Verbena bonariensis', type: 'herb', zone: [7, 11], heat: 11, humid: 3, sun: ['full'], moist: ['dry', 'mid'], h: [90, 150], spread: 45, bloom: [6, 7, 8, 9, 10], color: ['purple'], leaf: 'green', form: 'airy', tags: ['natural', 'prairie', 'pollinator', 'easy'], price: 400, cut: 'spring', div: 'none', note: '透け感のある草姿。こぼれ種でふえる。' },
  { id: 'thalictrum', ja: 'タリクトラム（カラマツソウ）', latin: 'Thalictrum rochebruneanum', wiki: 'Thalictrum rochebruneanum', type: 'herb', zone: [4, 8], heat: 7, humid: 2, sun: ['part'], moist: ['mid'], h: [120, 200], spread: 45, bloom: [7, 8], color: ['purple'], leaf: 'green', form: 'airy', tags: ['english', 'natural', 'wa'], price: 900, cut: 'spring', div: 'spring', note: '霞のような花。背景に。' },
];

// 同じ品種名（先頭の基本種など）は重複させない
function mergeLists(a, b) {
  const seen = new Set(a.map((x) => x.en));
  return [...a, ...b.filter((x) => !seen.has(x.en))];
}

// ---- 種と品種を1つのリストに展開 ----
const speciesPart = (latin) => latin.replace(/\s*'[^']*'.*$/, '').trim();
const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function expand(bases) {
  const out = [];
  for (const b of bases) {
    const c = CULTIVARS[b.id];
    if (!c) { out.push({ ...b, group: b.id, groupJa: b.ja, cv: null, cvCount: 1 }); continue; }
    c.list.forEach((v, i) => {
      const { cv, en, ...ov } = v;
      const isSpecies = /^[a-z]/.test(en); // 小文字始まり＝種名（品種名ではない）
      out.push({
        ...b, ...ov,
        id: v.id ?? (i === 0 ? b.id : `${b.id}-${slug(en)}`),
        group: b.id, groupJa: c.group, cv, en, cvCount: c.list.length,
        ja: v.ja ?? `${c.group}‘${cv}’`,
        latin: v.latin ?? (isSpecies ? b.latin : `${speciesPart(b.latin)} '${en}'`),
        note: v.note ?? b.note,
        wiki: v.wiki ?? (v.latin ? speciesPart(v.latin).replace(/ (var|subsp)\..*$/, '') : b.wiki),
      });
    });
  }
  return out;
}

/** 全植物（品種ごとに1件） */
export const PLANTS = expand([...BASE, ...EXTRA_BASE, ...MORE_BASE, ...ANNUAL_BASE, ...VEG_BASE, ...BALCONY_BASE, ...HERB_BASE, ...WORLD_BASE, ...DESIGNER_BASE, ...OKINAWA_BASE]).map(decorate);

/** 科・用途・ハーブ/在来種タグ・豆知識を付与 */
function decorate(p) {
  const tags = new Set(p.tags);
  if (HERB_GROUPS.has(p.group)) tags.add('herb');
  if (NATIVE_GROUPS.has(p.group)) tags.add('native');
  if (MEDICINAL_GROUPS.has(p.group)) tags.add('medicinal');
  if (VEG_GROUPS_EXTRA.includes(p.group)) tags.add('veg');
  if (BALCONY_EXTRA.includes(p.group)) tags.add('balcony');
  if (SALT_GROUPS.has(p.group)) tags.add('salt');
  let family = familyOf(p.latin);
  if (!family.latin) family = DESIGNER_FAMILY[p.latin.replace(/^×\s*/, '').split(/[\s']/)[0]] || family;
  const q = { ...p, tags: [...tags], family, uses: [...new Set([...(USE_INDEX[p.group] || []), ...(p.use || [])])], tips: TIPS[p.group] || [], aka: ALIASES[p.group] || WORLD_ALIASES[p.group] || DESIGNER_ALIASES[p.group] || p.aka || [], origin: ORIGIN[p.group] || WORLD_ORIGIN[p.group] || DESIGNER_ORIGIN[p.group] || p.origin || [] };
  q.roles = rolesOf(q);
  q.soc = socOf(q);
  // 気候データの訂正（出典を確認できたもの）と、気候判定用の項目
  const fix = CLIMATE_FIX[q.id] || CLIMATE_FIX[q.group];
  if (fix) { if (fix.zone) q.zone = fix.zone; q.climateSrc = fix.src; }
  q.fit = climateTraits(q);
  return q;
}
/** 自分で登録した品種を追加（種のデータを引き継ぐ） */
export function addCustom(c) {
  const members = PLANTS.filter((p) => p.group === c.group);
  const base = members[0];
  if (!base || !c.cv) return null;
  const p = {
    ...base,
    id: `my-${c.uid}`, cv: c.cv, en: '', custom: true,
    ja: `${base.groupJa}‘${c.cv}’`, latin: `${speciesPart(base.latin)} (${c.cv})`,
    color: c.color?.length ? c.color : base.color,
    h: c.h?.[0] && c.h?.[1] ? [Math.min(c.h[0], c.h[1]), Math.max(c.h[0], c.h[1])] : base.h,
    bloom: c.bloom?.length ? [...c.bloom].sort((a, b) => a - b) : base.bloom,
    price: c.price > 0 ? c.price : base.price,
    note: c.memo || '自分で登録した品種です。育て方は同じ種の他の品種を参考にしてください。', shop: c.shop || '', url: /^https?:\/\//.test(c.url || '') ? c.url : '',
  };
  p.family = base.family; p.uses = base.uses; p.tips = base.tips;
  const lastIdx = PLANTS.lastIndexOf(members[members.length - 1]);
  PLANTS.splice(lastIdx + 1, 0, p);
  const n = members.length + 1;
  for (const m of [...members, p]) m.cvCount = n;
  if (n === 2 && !base.cv) { base.cv = '標準'; }
  return p;
}
export function removeCustom(id) {
  const i = PLANTS.findIndex((p) => p.id === id && p.custom);
  if (i < 0) return;
  const g = PLANTS[i].group;
  PLANTS.splice(i, 1);
  const members = PLANTS.filter((p) => p.group === g);
  for (const m of members) m.cvCount = members.length;
}

/** 種（グループ）の数 */
export const GROUP_COUNT = new Set(PLANTS.map((p) => p.group)).size;

export const COLORS = {
  white: { ja: '白', hex: '#ebe7da' },
  pink: { ja: 'ピンク', hex: '#e78fb3' },
  red: { ja: '赤', hex: '#c73a4a' },
  orange: { ja: 'オレンジ', hex: '#e9852f' },
  yellow: { ja: '黄', hex: '#efc93a' },
  blue: { ja: '青', hex: '#5b8ee6' },
  purple: { ja: '紫', hex: '#8e5fc4' },
  green: { ja: '緑', hex: '#7aa95c' },
};

export const LEAF = {
  green: { ja: '緑葉', hex: '#5f8f4a' },
  silver: { ja: '銀葉', hex: '#a9b5a6' },
  bronze: { ja: '銅葉', hex: '#7a4a3e' },
  gold: { ja: '黄金葉', hex: '#b9b23c' },
  variegated: { ja: '斑入り', hex: '#8fb07a' },
  blue: { ja: '青みの葉', hex: '#7f9ea0' },
};

export const FORMS = {
  spike: { ja: '穂（縦のライン）' },
  daisy: { ja: 'デイジー・単花' },
  globe: { ja: '球・まとまり' },
  plate: { ja: '平たい花房' },
  airy: { ja: '霞・透け感' },
  mound: { ja: 'こんもり・葉物' },
  grass: { ja: 'グラス' },
  fern: { ja: 'シダの葉' },
};

export const TAGS = {
  natural: 'ナチュラル',
  english: 'イングリッシュ',
  wa: '和風',
  prairie: 'プレーリー',
  dry: 'ドライガーデン',
  shade: 'シェードガーデン',
  pollinator: '蝶・蜂が来る',
  fragrant: '香り',
  evergreen: '冬も緑',
  easy: '手間いらず',
  herb: 'ハーブ',
  native: '日本の在来種',
  medicinal: '薬用植物（生薬・民間薬）',
  veg: '野菜・食べられる',
  balcony: 'ベランダ・鉢植え向き',
  salt: '潮風に強い',
};

export const SUN = { full: '日向', part: '半日陰', shade: '日陰' };
export const MOIST = { dry: '乾きぎみ', mid: '普通', wet: '湿りぎみ' };
