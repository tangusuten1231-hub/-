// 庭に遊びに来る仲間たち（ツピの友だち）。すべてオリジナルのキャラクター。
// months: 来る月（北半球）、critter: 生き物図鑑のID、lines: その日のひとこと（ctx に合わせて選ぶ）
const INK = '#2b2a22', CREAM = '#f7f1e3';
const s = `stroke="${INK}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"`;
const eyes = (x1, x2, y, r = 3) => `<circle cx="${x1}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x2}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x1 + 1}" cy="${y - 1.2}" r="1" fill="#fff"/><circle cx="${x2 + 1}" cy="${y - 1.2}" r="1" fill="#fff"/>`;
const cheeks = (x1, x2, y) => `<ellipse cx="${x1}" cy="${y}" rx="4.5" ry="2.6" fill="#e9a08a" opacity=".55"/><ellipse cx="${x2}" cy="${y}" rx="4.5" ry="2.6" fill="#e9a08a" opacity=".55"/>`;
const smile = (x, y, w = 8) => `<path d="M${x - w / 2} ${y} q${w / 2} ${w * 0.55} ${w} 0" fill="none" ${s}/>`;

const ART = {
  butterfly: () => `
    <path d="M58 52 Q30 14 16 30 Q6 46 28 60 Q10 70 20 86 Q34 98 56 70Z" fill="#f2cf5b" ${s}/>
    <path d="M62 52 Q90 14 104 30 Q114 46 92 60 Q110 70 100 86 Q86 98 64 70Z" fill="#f2cf5b" ${s}/>
    <path d="M22 34 q14 4 26 18 M98 34 q-14 4 -26 18 M26 78 q12 -4 24 -12 M94 78 q-12 -4 -24 -12" stroke="${INK}" stroke-width="2.4" fill="none"/>
    <circle cx="26" cy="82" r="4" fill="#5b8ee6"/><circle cx="94" cy="82" r="4" fill="#5b8ee6"/><circle cx="30" cy="86" r="3" fill="#d6463a"/><circle cx="90" cy="86" r="3" fill="#d6463a"/>
    <ellipse cx="60" cy="66" rx="7" ry="26" fill="#3b382e" ${s}/>
    <path d="M56 42 q-8 -16 -16 -20 M64 42 q8 -16 16 -20" fill="none" ${s}/><circle cx="40" cy="22" r="3" fill="${INK}"/><circle cx="80" cy="22" r="3" fill="${INK}"/>
    <circle cx="60" cy="46" r="11" fill="#3b382e" ${s}/><circle cx="56" cy="45" r="2.4" fill="#fff"/><circle cx="64" cy="45" r="2.4" fill="#fff"/>
    ${cheeks(51, 69, 51)}`,
  snail: () => `
    <path d="M14 96 Q14 80 30 80 L84 80 Q96 80 98 66 L100 52" fill="#d9c4a0" ${s}/>
    <path d="M14 96 H100 Q104 96 100 88 L98 70" fill="#d9c4a0" ${s}/>
    <circle cx="56" cy="62" r="28" fill="#c98b52" ${s}/>
    <path d="M56 62 m0 -4 a4 4 0 1 1 -4 4 a9 9 0 1 1 9 9 a15 15 0 1 1 -15 -15 a21 21 0 1 1 21 21" fill="none" stroke="#8a5a2e" stroke-width="2.4"/>
    <path d="M96 52 q-2 -14 -8 -20 M102 52 q4 -14 10 -18" fill="none" ${s}/><circle cx="88" cy="31" r="3.4" fill="${INK}"/><circle cx="112" cy="33" r="3.4" fill="${INK}"/>
    <circle cx="94" cy="66" r="2.4" fill="${INK}"/><circle cx="104" cy="66" r="2.4" fill="${INK}"/>${smile(99, 74, 7)}`,
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
  {
    id: 'haneru', name: 'ハネル', who: 'アゲハチョウ', art: 'butterfly', critter: 'ageha', months: [4, 5, 6, 7, 8, 9, 10],
    lines: (c) => [
      c.blooming.length ? `${c.blooming[Math.min(1, c.blooming.length - 1)]}の花、ちょっと寄り道していくね。` : 'ひらひら、きょうはどこで休もうかな。',
      c.has('fennel') || c.has('ruta') ? 'フェンネルの葉っぱ、子どもたちのゆりかごにさせてね。' : 'セリの仲間の葉っぱがあると、卵を産みに来られるの。',
      '赤や紫の、筒の形の花が好き。',
      '朝のうちは、日なたで羽をあたためているの。',
    ],
  },
  {
    id: 'nonno', name: 'ノンノ', who: 'カタツムリ', art: 'snail', critter: 'katatsumuri', months: [5, 6, 7, 9, 10],
    lines: (c) => [
      c.rain ? 'しっとりした日は、おさんぽ日和。' : '雨上がりに、またゆっくり来るね。',
      'のんびり、ゆっくり。庭は急がなくていいところ。',
      c.has('hosta') ? 'ギボウシの葉の裏、すずしくて好き……ちょっとだけかじっても、いい？' : '大きな葉っぱの裏は、ひんやり気持ちいいの。',
      '殻のぐるぐるは、生まれてからの時間の記録なんだ。',
    ],
  },
];

/** 仲間ごとの「ひみつ」（なかよしになると教えてくれる）と「おみやげ」（ときどき置いていく庭のコツ） */
export const FRIEND_EXTRA = {
  micchi: { likes: '小さな花がたくさん集まった花、浅い水場', secret: 'ミツバチは、花の場所を仲間に「ダンス」で伝えるんだ。8の字にお尻をふるのが合図だよ。', gifts: [
    { title: '花の切れ目をつくらない', text: '春から秋まで、どの月にも何か咲いているようにすると、ずっと庭に通えるの。開花リレーで確かめてみてね。' },
    { title: '同じ花はまとめて', text: '同じ花が群れで咲いていると、遠くからでも見つけやすいんだ。3株以上まとめて植えてね。' },
    { title: '薬はなるべく使わないで', text: '殺虫剤は、わたしたちにも効いてしまうの。困ったときは、まず手で取るか、テンテンに相談して。' },
  ] },
  tenten: { likes: 'アブラムシ、落ち葉の下の冬の宿', secret: 'テントウムシの幼虫は、成虫よりたくさんアブラムシを食べるんだよ。見た目はちょっとこわいけどね。', gifts: [
    { title: 'アブラムシは少し待って', text: 'アブラムシが出ても、すぐに薬をまかないで。1〜2週間で、ぼくたちが駆けつけるから。' },
    { title: '冬の宿を残して', text: '秋の片づけで、落ち葉や枯れた茎を全部片づけないで。ぼくたちの冬の布団なんだ。' },
    { title: 'セリ科の花は食堂', text: 'ノラニンジンみたいな平たい花には、小さな虫が集まるの。ぼくのごはん場になるよ。' },
  ] },
  amata: { likes: '雨、水辺、大きな葉っぱ', secret: 'アマガエルは、まわりの色に合わせて体の色を少し変えられるんだ。灰色になっていたら、石の上にいたってこと。', gifts: [
    { title: '小さな水辺をつくろう', text: '浅い水鉢ひとつでも、トンボやぼくたちの子どもが育つよ。端に石を入れて、出入りしやすくしてね。' },
    { title: '夜は灯りを少なめに', text: '明るすぎる灯りは、夜の虫やぼくたちを迷わせるんだ。足元だけの灯りがうれしい。' },
    { title: '株元は茂らせて', text: '暑い日は、葉の茂った株元でじっと休んでるよ。足元を覆う植物があると助かるな。' },
  ] },
  kana: { likes: '日なたの石、グラスの株元', secret: 'カナヘビのしっぽは、とても長くて体の2倍以上あるの。木登りのバランスをとるのに使うのよ。', gifts: [
    { title: '日なぼっこの石', text: '花壇のすみに平たい石をひとつ置いて。朝、体をあたためる場所になるの。' },
    { title: '石積みは最高の家', text: '石を少し積んで、すき間を残しておいて。暑い日も寒い日も、そこに逃げこめるから。' },
    { title: 'グラスは隠れ家', text: 'グラスの株元は、鳥から隠れるのにちょうどいいの。冬の枯れ姿も、春まで切らずに残してね。' },
  ] },
  koron: { likes: '落ち葉、湿った鉢の下', secret: 'ダンゴムシは、エビやカニの親戚なんだよ。だから湿ったところが好きなんだ。', gifts: [
    { title: '落ち葉は宝物', text: '集めた落ち葉は、すみに積んでおいて。1年たつと、ふかふかの腐葉土になるよ。' },
    { title: 'マルチングで土を守る', text: '株元を落ち葉やウッドチップで覆うと、土が乾かず、ぼくたちも暮らしやすいんだ。' },
    { title: '苗のそばだけは注意', text: '植えたばかりのやわらかい苗は、ぼくたちもかじっちゃうことがある。最初の数週間だけ見回ってね。' },
  ] },
  mejiro: { likes: '冬の花の蜜、ミカン、水浴び', secret: '目のまわりの白い輪は、羽毛でできているんだ。「メジロ押し」は、枝の上でぎゅっと並ぶ様子から生まれた言葉だよ。', gifts: [
    { title: '冬に咲く花を一つ', text: 'クリスマスローズやツバキの仲間など、冬に咲く花があると、蜜を吸いに来られるよ。' },
    { title: '実のなる木', text: '秋から冬に実がなる木があると、冬じゅう通えるんだ。' },
    { title: '冬も水場を', text: '冬は水が少なくて困るの。凍らない朝は、水場の水を入れ替えてくれるとうれしいな。' },
  ] },
  haneru: { likes: '筒形の赤や紫の花、セリ科の葉', secret: 'アゲハチョウは、前あしの先で葉っぱの「味」を確かめて、子どもが食べられる葉に卵を産むの。', gifts: [
    { title: '幼虫の食べ物も植えて', text: '花の蜜だけでなく、フェンネルやパセリなど、幼虫が食べる葉もあると、庭で生まれて育つのよ。' },
    { title: '風よけのある日なた', text: '風が強いと飛びにくいの。生け垣や塀の内側の、日なたの花壇が好き。' },
    { title: '水たまりも大事', text: '湿った土から、ミネラルを吸うことがあるの。少しだけぬかるんだ場所があってもいいのよ。' },
  ] },
  nonno: { likes: '雨上がり、大きな葉の裏', secret: 'カタツムリの殻は、生まれたときから背負っていて、体と一緒に大きくなるの。', gifts: [
    { title: 'ゆっくり見てまわる日', text: 'ときどきは作業しないで、庭をゆっくり眺める日をつくってね。いろんな仲間に会えるから。' },
    { title: '石や木切れの日陰', text: '庭のすみに、木切れや石で小さな日陰をつくって。乾く日の避難場所になるの。' },
    { title: 'やさしい対策', text: '大切な苗だけは、夕方に見回ってそっと遠くへ移してね。薬をまくと、ほかの仲間にも響いちゃう。' },
  ] },
};
/** なかよし度（会った日数で） */
export const FRIEND_LEVELS = [
  { min: 1, ja: 'はじめまして', hearts: 1 },
  { min: 3, ja: '顔なじみ', hearts: 2 },
  { min: 7, ja: 'なかよし', hearts: 3 },
  { min: 15, ja: '親友', hearts: 4 },
];
export function friendLevel(days = 0) {
  return [...FRIEND_LEVELS].reverse().find((l) => days >= l.min) || { min: 0, ja: 'まだ会っていない', hearts: 0 };
}

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
