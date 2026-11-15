// 庭に遊びに来る仲間たち（ツピの友だち）。すべてオリジナルのキャラクター。
// months: 来る月（北半球）、critter: 生き物図鑑のID、lines: その日のひとこと（ctx に合わせて選ぶ）
const INK = '#2b2a22', CREAM = '#f7f1e3';
const s = `stroke="${INK}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"`;
const eyes = (x1, x2, y, r = 3) => `<circle cx="${x1}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x2}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x1 + 1}" cy="${y - 1.2}" r="1" fill="#fff"/><circle cx="${x2 + 1}" cy="${y - 1.2}" r="1" fill="#fff"/>`;
const cheeks = (x1, x2, y) => `<ellipse cx="${x1}" cy="${y}" rx="4.5" ry="2.6" fill="#e9a08a" opacity=".55"/><ellipse cx="${x2}" cy="${y}" rx="4.5" ry="2.6" fill="#e9a08a" opacity=".55"/>`;
const smile = (x, y, w = 8) => `<path d="M${x - w / 2} ${y} q${w / 2} ${w * 0.55} ${w} 0" fill="none" ${s}/>`;

const ART = {
  bee: () => `
    <ellipse cx="38" cy="38" rx="17" ry="11" fill="#e8f2f6" opacity=".85" ${s} transform="rotate(-28 38 38)"/>
    <ellipse cx="82" cy="38" rx="17" ry="11" fill="#e8f2f6" opacity=".85" ${s} transform="rotate(28 82 38)"/>
    <ellipse cx="60" cy="70" rx="30" ry="27" fill="#f1c44a" ${s}/>
    <path d="M32 76 q28 7 56 0 M38 89 q22 6 44 0" stroke="${INK}" stroke-width="6" fill="none" opacity=".85"/>
    <path d="M88 76 l10 4 -10 3" fill="${INK}"/>
    <path d="M52 44 q-6 -16 -16 -20 M68 44 q6 -16 16 -20" fill="none" ${s}/><circle cx="35" cy="23" r="3.4" fill="${INK}"/><circle cx="85" cy="23" r="3.4" fill="${INK}"/>
    ${eyes(50, 70, 56)}${cheeks(42, 78, 64)}${smile(60, 63)}`,
  ladybird: () => `
    <path d="M30 78 h-10 M32 90 l-9 6 M90 78 h10 M88 90 l9 6" ${s}/>
    <path d="M24 76 Q24 40 60 38 Q96 40 96 76 Q96 100 60 100 Q24 100 24 76Z" fill="#d6463a" ${s}/>
    <path d="M60 40 V100" ${s}/>
    ${[[44, 60], [76, 60], [40, 82], [80, 82], [52, 92], [68, 92]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.4" fill="${INK}"/>`).join('')}
    <path d="M34 46 Q60 14 86 46 Q60 54 34 46Z" fill="${INK}" ${s}/>
    <circle cx="49" cy="36" r="5.6" fill="${CREAM}"/><circle cx="71" cy="36" r="5.6" fill="${CREAM}"/>${eyes(50, 72, 37, 2.6)}
    <path d="M52 30 q-8 -14 -16 -16 M68 30 q8 -14 16 -16" fill="none" ${s}/>`,
  frog: () => `
    <path d="M30 96 Q16 98 18 106 h16 M90 96 Q104 98 102 106 h-16" fill="#8fc25a" ${s}/>
    <ellipse cx="60" cy="80" rx="36" ry="26" fill="#8fc25a" ${s}/><ellipse cx="60" cy="88" rx="22" ry="14" fill="${CREAM}"/>
    <circle cx="40" cy="54" r="13" fill="#8fc25a" ${s}/><circle cx="80" cy="54" r="13" fill="#8fc25a" ${s}/>
    <circle cx="40" cy="53" r="7.6" fill="${CREAM}"/><circle cx="80" cy="53" r="7.6" fill="${CREAM}"/>${eyes(41, 81, 54, 4)}
    <path d="M26 60 L18 70 M94 60 L102 70" stroke="${INK}" stroke-width="3"/>
    ${cheeks(36, 84, 74)}${smile(60, 72, 14)}`,
  lizard: () => `
    <path d="M70 92 Q100 96 104 78 Q106 66 96 64" fill="none" stroke="#a9875a" stroke-width="10" stroke-linecap="round"/>
    <path d="M70 92 Q100 96 104 78 Q106 66 96 64" fill="none" ${s}/>
    <ellipse cx="58" cy="84" rx="22" ry="14" fill="#b8956a" ${s}/>
    <path d="M42 94 l-8 8 M72 96 l6 8 M44 76 l-10 -4" ${s}/>
    <ellipse cx="40" cy="62" rx="20" ry="16" fill="#b8956a" ${s}/>
    <path d="M44 84 q14 4 28 0" stroke="#8a6a44" stroke-width="2" fill="none"/>
    ${eyes(32, 48, 58, 3)}${cheeks(26, 54, 66)}${smile(40, 68, 9)}`,
  pillbug: () => `
    <path d="M18 98 Q16 48 60 44 Q104 48 102 98Z" fill="#8a8c92" ${s}/>
    ${[36, 48, 60, 72, 84].map((x) => `<path d="M${x} ${x === 60 ? 44 : 46} Q${x + (x - 60) * 0.25} 72 ${x + (x - 60) * 0.35} 98" stroke="#6e7076" stroke-width="2.2" fill="none"/>`).join('')}
    <path d="M14 98 h92" ${s}/>
    <ellipse cx="30" cy="84" rx="12" ry="11" fill="#9a9ca2" ${s}/>${eyes(26, 36, 82, 2.6)}${smile(31, 89, 6)}
    <path d="M22 76 q-8 -10 -14 -12 M28 74 q-2 -12 -8 -18" fill="none" ${s}/>`,
  whiteeye: () => `
    <path d="M30 92 12 104l20-3Z" fill="#8aa83a" ${s}/>
    <ellipse cx="60" cy="76" rx="32" ry="29" fill="#e9e1a0" ${s}/>
    <ellipse cx="34" cy="76" rx="9" ry="18" fill="#8aa83a" ${s} transform="rotate(14 34 76)"/>
    <ellipse cx="88" cy="76" rx="9" ry="18" fill="#8aa83a" ${s} transform="rotate(-14 88 76)"/>
    <path d="M30 60 Q34 30 60 30 Q86 30 90 60 Q76 52 60 52 Q44 52 30 60Z" fill="#9cbc3e" ${s}/>
    <circle cx="49" cy="46" r="7" fill="#fff" ${s}/><circle cx="71" cy="46" r="7" fill="#fff" ${s}/>${eyes(49, 71, 46, 3)}
    <path d="M56 54 L60 62 L64 54Z" fill="#4a4030" ${s}/>${cheeks(40, 80, 60)}`,
};

/**
 * 仲間たち
 * lines(ctx): ctx = { month, blooming:[植物名], plants:[植物], features:{}, rain:boolean, has(id) }
 */
export const FRIENDS = [
  {
    id: 'micchi', name: 'ミッチ', who: 'ミツバチ', art: 'bee', critter: 'mitsubachi', months: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    lines: (c) => [
      c.blooming.length ? `${c.blooming[0]}の蜜、とってもおいしいよ！` : null,
      '花から花へ、きょうも大いそがし。',
      c.features.water ? '水場、助かってるよ。浅いところがうれしいんだ。' : '浅いお皿に水と小石を置いてくれたら、飲みに来るよ。',
      '小さな花がたくさん集まって咲く花が好き。',
      c.has('lavender') ? 'ラベンダーの香り、遠くからでもわかるよ。' : null,
    ],
  },
  {
    id: 'tenten', name: 'テンテン', who: 'テントウムシ', art: 'ladybird', critter: 'tentou', months: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    lines: (c) => [
      'アブラムシを見つけたら、ぼくにまかせて！',
      'トゲトゲの黒い子がいたら、それはぼくの子どもだよ。踏まないでね。',
      [10, 11].includes(c.month) ? '落ち葉の下で冬を越すんだ。少し残しておいてね。' : null,
      c.features.compost ? '落ち葉置き場、冬の宿にぴったり。' : null,
    ],
  },
  {
    id: 'amata', name: 'アマタ', who: 'アマガエル', art: 'frog', critter: 'amagaeru', months: [4, 5, 6, 7, 8, 9, 10],
    lines: (c) => [
      c.rain ? 'もうすぐ雨のにおい。ケロケロ、うれしいな。' : '雨の日は、庭がいちばんにぎやかになるよ。',
      c.features.pond ? '池のおかげで、夜はみんなで合唱できるよ。' : '小さな水辺があったら、子どもたちが育つのになあ。',
      c.has('hosta') ? 'ギボウシの大きな葉っぱ、ひと休みにちょうどいい。' : '大きな葉っぱの上で、ひなたぼっこ中。',
      '虫をたくさん食べて、庭のお手伝いをしてるんだ。',
    ],
  },
  {
    id: 'kana', name: 'カナ', who: 'カナヘビ', art: 'lizard', critter: 'kanahebi', months: [4, 5, 6, 7, 8, 9, 10],
    lines: (c) => [
      '日なたの石の上が、わたしの特等席。',
      c.features.habitat ? '石積みのすき間、とっても住みやすいわ。' : '石を少し積んでくれたら、そこに住んじゃうかも。',
      'つかまえるときは、しっぽを持たないでね。',
      c.has('grass') ? 'グラスの株元は、かくれんぼにぴったり。' : null,
    ],
  },
  {
    id: 'koron', name: 'コロン', who: 'ダンゴムシ', art: 'pillbug', critter: 'dangomushi', months: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    lines: (c) => [
      '落ち葉、いただきます。ふかふかの土にしておくね。',
      c.features.compost ? '堆肥置き場、最高のごちそうだよ。' : '落ち葉を集めておく場所があると、うれしいな。',
      'びっくりすると、まるくなっちゃう。',
      '鉢の下、ちょっとおじゃましてます。',
    ],
  },
  {
    id: 'mejiro', name: 'メジロー', who: 'メジロ', art: 'whiteeye', critter: 'mejiro', months: [11, 12, 1, 2, 3, 4],
    lines: (c) => [
      '冬はツピたちと一緒に、群れで回ってるんだ。',
      'ミカンを半分に切って枝に刺しておいてくれたら、飛んでくるよ。',
      c.has('camellia-sinensis') || c.has('aloe') ? '冬の花の蜜は、ごちそうなんだ。' : '冬に咲く花の蜜を探してるところ。',
      c.features.water ? '水浴び、気持ちよかった！' : '水浴びできる場所があったらなあ。',
    ],
  },
];

/** キャラクターの絵 */
export function friendSVG(f, size = 64) {
  return `<svg class="friend-svg" width="${size}" height="${size}" viewBox="0 0 120 120" role="img" aria-label="${f.who}の${f.name}">${ART[f.art]()}</svg>`;
}

/**
 * きょう庭に来ている仲間（1〜3匹）。乱数は引数で渡す（テスト用）
 */
export function visitors(ctx, rand = Math.random) {
  const here = FRIENDS.filter((f) => f.months.includes(ctx.month));
  if (!here.length) return [];
  const n = Math.min(here.length, 1 + Math.floor(rand() * 3));
  const pool = [...here];
  const out = [];
  while (out.length < n && pool.length) {
    const f = pool.splice(Math.floor(rand() * pool.length), 1)[0];
    const lines = f.lines(ctx).filter(Boolean);
    out.push({ friend: f, line: lines[Math.floor(rand() * lines.length)] });
  }
  return out;
}
