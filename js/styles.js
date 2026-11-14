// 植栽デザインのスタイル（著名なガーデンデザイナーの手法を参考にしたもの）
// 各スタイルは「どんな植物を選ぶか」「植物の役割の割合」「配置のしかた」「マルチ等の費用」を持つ。

export const ROLE_JA = {
  back: '後景', middle: '中景', front: '前景',
  matrix: '地模様（マトリクス）', block: '群植ブロック', scatter: '散らし（点景）',
  structure: '骨格（ストラクチャー）', theme: '季節のテーマ', ground: 'グラウンドカバー',
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
    spacing: 1.0, matrixShare: 0.38, speciesFactor: 0.75,
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
    spacing: 0.8, speciesFactor: 0.9, roleShare: { ground: 0.5, theme: 0.37, structure: 0.13 },
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

STYLES.matrix.cost = { mulch: { ja: '初年度の薄いマルチ（2年目以降は不要）', perSqm: 400 } };

/** 色の暖かさ（ジーキル式グラデーション用） */
export const WARMTH = { blue: 0, purple: 0.6, white: 0.3, green: 1, pink: 1.2, yellow: 2, orange: 2.6, red: 3 };
