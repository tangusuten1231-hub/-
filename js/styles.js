import { POTAGER_FLOWERS } from './veg.js';

// 植栽デザインのスタイル（著名なガーデンデザイナーの手法を参考にしたもの）
// 各スタイルは「どんな植物を選ぶか」「植物の役割の割合」「配置のしかた」「マルチ等の費用」を持つ。

export const ROLE_JA = {
  back: '後景', middle: '中景', front: '前景',
  matrix: '地模様（マトリクス）', block: '群植ブロック', scatter: '散らし（点景）',
  structure: '骨格（ストラクチャー）', theme: '季節のテーマ', ground: 'グラウンドカバー',
  crop: '野菜の区画', edge: '縁取り（ハーブ・花）', accent: 'アクセント',
  point: '点（目を引く1株・小さな群れ）', line: '線（縁取り・流れるリボン）', plane: '面（地を覆う広がり）',
};

const tall = (p) => p.h[1] >= 100;
const avgH = (p) => (p.h[0] + p.h[1]) / 2;
const structural = (p) => ['spike', 'plate', 'globe', 'airy', 'grass'].includes(p.form);

export const STYLES = {
  border: {
    ja: 'レイヤードボーダー（基本）',
    by: '',
    summary: '手前から奥へ低・中・高と段々に重ね、開花リレーが途切れないように組む、もっとも扱いやすい花壇。',
    principles: ['背の高い植物を奥、低い植物を手前に', '同じ植物を3株以上まとめて植える', '花の形（穂・丸・平たい花）を混ぜてリズムを出す'],
    layout: 'bands',
  },
  oudolf: {
    ja: 'ニューパレニアル（ピート・アウドルフの手法を参考）',
    by: 'Piet Oudolf',
    summary: 'グラスを地模様にして、形のはっきりした宿根草を群れと点で配置する自然風の植栽。色より「形」と「季節の移ろい」、枯れ姿まで楽しむ。',
    principles: [
      '花色より草姿（穂・平たい花房・球・霞）の組み合わせを重視',
      'グラスを全体の3〜5割の「地模様」にし、その中に主役を群れで配置',
      '背の高い植物を少数、全体に散らして奥行きとリズムを出す',
      '秋冬の枯れ姿・種の頭も景色。刈り込みは早春にまとめて',
      '同じ組み合わせを繰り返して統一感を出す',
    ],
    layout: 'blocks',
    roleOf: (p) => (p.form === 'grass' && p.h[1] <= 120) || (p.form === 'airy' && p.h[1] <= 60) ? 'matrix' : tall(p) && p.form !== 'mound' ? 'scatter' : 'block',
    targets: (n) => ({ matrix: n >= 7 ? 2 : 1, scatter: n >= 6 ? 2 : 1, block: n - (n >= 7 ? 2 : 1) - (n >= 6 ? 2 : 1) }),
    bonus: (p) => {
      let s = 0;
      if (structural(p)) s += 1.5;
      if (p.tags.includes('prairie')) s += 2;
      if (p.tags.includes('natural')) s += 0.8;
      if (p.form === 'mound') s -= 1.5;
      if (p.tags.includes('english') && !p.tags.includes('natural')) s -= 1;
      if (p.cut === 'spring') s += 0.6; // 枯れ姿を残せる
      return s;
    },
    why: (p) => (p.tags.includes('prairie') ? ['枯れ姿も美しい'] : structural(p) ? ['形が際立つ'] : []),
    spacing: 1.0, matrixShare: 0.38, speciesFactor: 0.75, needsGrass: true,
  },
  matrix: {
    ja: 'マトリクス植栽（レイナー＆ウェスト『ポストワイルド』の手法を参考）',
    by: 'Thomas Rainer & Claudia West',
    summary: '野原の植物群落のように、骨格・季節のテーマ・グラウンドカバーの3層を密に混ぜ植えし、土を見せない。雑草が生えにくく手間が少ない。',
    principles: [
      '骨格（背の高い直立する植物）を1〜2割',
      '季節のテーマ（花の主役）を3〜4割',
      'グラウンドカバー（地面を覆う低い植物）を約5割',
      '株間を詰めて土を見せない＝雑草とマルチ不要',
      '植物は層ごとに混ぜ植えし、こぼれ種での移ろいも受け入れる',
    ],
    layout: 'intermingle',
    roleOf: (p) => (avgH(p) >= 80 && (structural(p) || p.form === 'daisy') ? 'structure' : p.h[1] <= 45 || (p.form === 'mound' && p.h[1] <= 60) ? 'ground' : 'theme'),
    targets: (n) => {
      const structure = Math.max(1, Math.round(n * 0.2));
      const ground = Math.max(2, Math.round(n * 0.3));
      return { structure, ground, theme: n - structure - ground };
    },
    bonus: (p) => {
      let s = 0;
      if (p.tags.includes('easy')) s += 1;
      if (p.tags.includes('natural') || p.tags.includes('prairie')) s += 1;
      if (p.h[1] <= 45 && (p.tags.includes('evergreen') || p.form === 'mound')) s += 1.2;
      return s;
    },
    why: (p) => (p.h[1] <= 45 ? ['地面を覆う'] : []),
    spacing: 0.8, speciesFactor: 0.9, roleShare: { ground: 0.56, theme: 0.32, structure: 0.12 },
  },
  jekyll: {
    ja: 'カラーグラデーション・ボーダー（ガートルード・ジーキルの手法を参考）',
    by: 'Gertrude Jekyll',
    summary: '花壇の両端を青・白・淡いピンクの寒色、中央を黄・オレンジ・赤の暖色にして、色が滑らかに移り変わる英国式ボーダー。',
    principles: [
      '両端は寒色・淡い色、中央に向かって暖色へ',
      '植物は細長い帯（ドリフト）状にして隣と重ねる',
      '銀葉や白花で色と色の間をつなぐ',
      '高さは奥から手前へ段々に',
    ],
    layout: 'gradient',
    bonus: (p) => (p.tags.includes('english') ? 1.5 : 0) + (p.color[0] !== 'green' ? 0.8 : -1) + (p.bloom.length >= 4 ? 0.5 : 0),
    why: () => [],
    allColors: true,
  },
  chatto: {
    ja: 'グラベルガーデン（ベス・チャトーの手法を参考）',
    by: 'Beth Chatto',
    summary: '「適材適所」—乾いた場所には乾燥に強い植物だけを選び、砂利を敷いて水やりなしで育てる庭。銀葉や多肉質の葉が主役。',
    principles: [
      '乾燥に強い植物だけを選ぶ（植えたら水やりは根付くまで）',
      '土は砂利・軽石で水はけを良くし、表面も砂利でマルチ',
      '株と株の間に砂利の余白を残し、群れで植える',
      '銀葉・青みの葉・細い葉で質感の違いを楽しむ',
    ],
    layout: 'clusters',
    filter: (p) => p.moist.includes('dry'),
    bonus: (p) => (p.tags.includes('dry') ? 2.5 : 0) + (['silver', 'blue'].includes(p.leaf) ? 1.5 : 0) + (p.tags.includes('evergreen') ? 0.6 : 0),
    why: (p) => (p.tags.includes('dry') ? ['乾燥に強い'] : []),
    spacing: 1.1, speciesFactor: 0.7,
    cost: { soil: { ja: '水はけ改良（砂利・軽石・川砂）', perSqm: 1800 }, mulch: { ja: '砂利マルチ（厚さ5cm）', perSqm: 2500 } },
  },
};

// ポタジェ（フランス式の菜園花壇）：野菜・ハーブ・花を区画ごとに美しく混植する
const isVeg = (p) => p.tags.includes('veg');
STYLES.potager = {
  ja: 'ポタジェ（野菜・ハーブ・花の菜園花壇）',
  by: 'Potager',
  summary: '小さな区画に野菜を植え、ハーブや花で縁取るフランス式の菜園花壇。眺めて美しく、摘んで食べられ、花が受粉や害虫の天敵を呼び込む。',
  principles: [
    '花壇を小さな区画に分け、通路から手が届く幅（1.2m以内）にする',
    '区画ごとに野菜を1〜2種類、縁取りに低いハーブや花をぐるりと植える',
    'マリーゴールド・ナスタチウム・ボリジなどの花を混ぜて、虫を呼び、彩りを添える',
    'トウモロコシやつるのインゲンなど背の高いものは北側か区画の中心に',
    '同じ科の野菜を同じ場所に続けて植えない（連作を避けて区画を回す）',
  ],
  layout: 'potager',
  potager: true,
  filter: (p) => isVeg(p) || p.tags.includes('herb') || POTAGER_FLOWERS.includes(p.group),
  roleOf: (p) => (isVeg(p) && p.h[1] > 25 ? 'crop' : p.h[1] <= 45 ? 'edge' : 'accent'),
  targets: (n) => {
    const edge = Math.max(2, Math.round(n * 0.3));
    const accent = Math.max(1, Math.round(n * 0.15));
    return { edge, accent, crop: Math.max(2, n - edge - accent) };
  },
  bonus: (p) => (isVeg(p) ? 2.5 + (p.harvest?.length ? 2 + p.harvest.length * 0.25 : 0) : 0) + (p.tags.includes('herb') ? 1.2 : 0) + (POTAGER_FLOWERS.includes(p.group) ? 1.5 : 0) + (p.tags.includes('easy') ? 0.5 : 0),
  why: (p) => (isVeg(p) ? [p.harvest?.length ? `収穫 ${p.harvest[0]}月〜` : '食べられる'] : POTAGER_FLOWERS.includes(p.group) ? ['野菜の仲間（コンパニオン）'] : p.tags.includes('herb') ? ['摘んで使えるハーブ'] : []),
  spacing: 1.0, speciesFactor: 1.15,
  cost: { soil: { ja: '土づくり（堆肥たっぷり・菜園用）', perSqm: 2200 }, mulch: { ja: '区画の縁取り材・通路のウッドチップ', perSqm: 1400 } },
};

// コテージガーデン（英国の田舎家の庭）：花・ハーブ・野菜をすき間なく混ぜ植えする素朴な庭
const COTTAGE_SEEDERS = ['orlaya', 'nigella', 'digitalis', 'alcea', 'myosotis', 'aquilegia', 'centaurea-cyanus', 'papaver-rhoeas', 'calendula', 'borago', 'lunaria', 'verbascum', 'consolida', 'lychnis', 'centranthus', 'erigeron', 'viola'];
STYLES.cottage = {
  ja: 'コテージガーデン（英国の田舎家の庭）',
  by: 'Cottage Garden',
  summary: '花・ハーブ・ときには野菜まで、すき間なく混ぜ植えする素朴でにぎやかな庭。背の高い穂の花、香りのよい花、こぼれ種で毎年少しずつ景色が変わる一年草が主役。',
  principles: [
    'すき間なく植えて土を見せない（雑草も生えにくい）',
    'ジギタリスやタチアオイなど、背の高い穂の花をところどころに立ち上げる',
    'ラベンダーやバラ、ハーブなど香りのよい植物を小道の近くに',
    'こぼれ種で増える一年草・二年草を受け入れ、毎年の偶然を楽しむ',
    '整えすぎない。色は混ざってもよいが、白い花で全体をつなぐ',
  ],
  layout: 'intermingle',
  cottage: true,
  roleOf: (p) => (p.h[1] >= 100 && ['spike', 'globe', 'daisy'].includes(p.form) ? 'structure' : p.h[1] <= 40 ? 'ground' : 'theme'),
  targets: (n) => {
    const structure = Math.max(1, Math.round(n * 0.25));
    const ground = Math.max(1, Math.round(n * 0.25));
    return { structure, ground, theme: n - structure - ground };
  },
  roleShare: { structure: 0.2, theme: 0.5, ground: 0.3 },
  bonus: (p) => (p.tags.includes('english') ? 2 : 0) + (p.tags.includes('fragrant') ? 1.5 : 0) + (p.tags.includes('herb') ? 1 : 0) + (COTTAGE_SEEDERS.includes(p.group) ? 1.5 : 0) + (p.form === 'spike' && p.h[1] >= 100 ? 1 : 0) - (p.form === 'grass' ? 1.5 : 0) - (p.tags.includes('veg') && p.type === 'annual' ? 1 : 0),
  why: (p) => (COTTAGE_SEEDERS.includes(p.group) ? ['こぼれ種で増える'] : p.tags.includes('fragrant') ? ['香りがよい'] : p.tags.includes('english') ? ['英国の庭の定番'] : []),
  spacing: 0.85, speciesFactor: 1.2,
};

// 点・線・面の構成：花壇を3つの造形要素で組み立てる
const pointLike = (p) => p.type === 'shrub' || ((p.roles?.includes('structure') || p.roles?.includes('accent')) && p.h[1] >= 70 && p.form !== 'mound') || ((p.soc || 3) <= 2 && p.h[1] >= 60);
const planeLike = (p) => p.roles?.includes('groundcover') || p.roles?.includes('matrix') || (p.form === 'grass' && p.h[1] <= 90) || (p.soc || 3) >= 4;
STYLES.composition = {
  ja: '点・線・面の構成（デザイナーの構成法）',
  by: 'Point · Line · Plane',
  summary: '花壇を「点（目を引く1株）」「線（縁取りや流れるリボン状の群れ）」「面（地面を覆う広がり）」の3つの要素で組み立てる構成法。形の違う植物を役割ごとに選び、種類が多くても散らからない景色をつくる。',
  principles: [
    '点：形の強い植物を1〜3株ずつ、間をあけて置き、視線の止まる場所をつくる',
    '線：手前の縁取りと、花壇を斜めに横切るリボン状の群れで、視線の流れをつくる',
    '面：グラスやグラウンドカバーを大きく広げ、点と線を受け止める「地」にする',
    '点・線・面それぞれで形（穂・球・平たい花・霞・グラス）の違う植物を選ぶ',
    '同じ線の植物を離れた場所でもう一度使い、全体をつなぐ',
  ],
  layout: 'composition',
  roleOf: (p) => (pointLike(p) ? 'point' : planeLike(p) ? 'plane' : 'line'),
  targets: (n) => {
    const point = Math.max(2, Math.round(n * 0.25));
    const plane = Math.max(2, Math.round(n * 0.3));
    return { point, plane, line: Math.max(2, n - point - plane) };
  },
  bonus: (p) => (structural(p) ? 1 : 0) + (p.tags.includes('natural') ? 0.5 : 0) + (p.leaf !== 'green' ? 0.4 : 0),
  why: (p) => (pointLike(p) ? ['点として目を引く'] : planeLike(p) ? ['面として地を覆う'] : ['線をつくる']),
  spacing: 1.0, speciesFactor: 1.0,
};

STYLES.matrix.cost = { mulch: { ja: '初年度の薄いマルチ（2年目以降は不要）', perSqm: 400 } };

/** スタイルごとの「向いている庭・暮らし」 */
const FIT = {
  border: 'はじめての花壇づくりに。塀ぞいの細長い花壇で、季節ごとに花を楽しみたい人',
  oudolf: '広めの庭で、風に揺れるグラスと秋冬の枯れ姿まで楽しみたい人。手入れは早春の刈り込みが中心',
  matrix: '雑草取りや水やりの手間を減らしたい人。土を見せない密な植栽で、自然の草原のように',
  jekyll: '色の移ろいにこだわりたい人。長いボーダーで、寒色から暖色へのグラデーションを',
  chatto: '日当たりがよく乾きやすい場所、水やりをしたくない人。砂利と銀葉の植物の庭',
  potager: '野菜やハーブを育てて食べたい人。台所の近くの、眺めても美しい菜園に',
  cottage: '花をたくさん咲かせたい人。こぼれ種や香りの花で、にぎやかで素朴な庭に',
  composition: '庭の見せ方にこだわりたい人。目を引く植物と流れる群れで、整理された自然風の花壇に',
};
for (const [k, v] of Object.entries(FIT)) if (STYLES[k]) STYLES[k].fit = v;

/** 色の暖かさ（ジーキル式グラデーション用） */
export const WARMTH = { blue: 0, purple: 0.6, white: 0.3, green: 1, pink: 1.2, yellow: 2, orange: 2.6, red: 3 };
