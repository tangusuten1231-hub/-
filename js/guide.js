// 案内役：ニホンヤモリの「ヤモ」
// 家を守る「家守（やもり）」から。窓辺や植木鉢のまわりで暮らす身近な生きもの。
// せりふの事実部分は、図鑑データ（出典つき）とユーザーの記録から作る。作り話の豆知識は言わせない。

export const GUIDE_NAME = 'ヤモ';

export const GUIDE_SVG = `<svg viewBox="0 0 120 120" class="yamo" role="img" aria-label="ヤモリのヤモ">
  <ellipse cx="60" cy="104" rx="44" ry="9" class="yamo-leaf"/>
  <path d="M83 86 q22 4 26 -14 q2 -8 -6 -8 q2 12 -18 14" class="yamo-body"/>
  <ellipse cx="62" cy="78" rx="26" ry="18" class="yamo-body"/>
  <g class="yamo-body">
    <path d="M40 86 l-12 10 m12 -10 l-8 13 m8 -13 l-2 14" stroke-width="5" stroke-linecap="round" class="yamo-limb"/>
    <path d="M78 90 l8 10 m-8 -10 l2 13 m-2 -13 l12 6" stroke-width="5" stroke-linecap="round" class="yamo-limb"/>
  </g>
  <circle cx="27" cy="97" r="3.5" class="yamo-pad"/><circle cx="31" cy="100" r="3.5" class="yamo-pad"/><circle cx="38" cy="101" r="3.5" class="yamo-pad"/>
  <circle cx="87" cy="101" r="3.5" class="yamo-pad"/><circle cx="80" cy="104" r="3.5" class="yamo-pad"/><circle cx="91" cy="96" r="3.5" class="yamo-pad"/>
  <ellipse cx="50" cy="48" rx="30" ry="25" class="yamo-body"/>
  <ellipse cx="58" cy="78" rx="12" ry="7" class="yamo-belly"/>
  <circle cx="37" cy="42" r="10" class="yamo-eye"/><circle cx="64" cy="42" r="10" class="yamo-eye"/>
  <ellipse cx="38" cy="43" rx="2.4" ry="7" class="yamo-pupil"/><ellipse cx="65" cy="43" rx="2.4" ry="7" class="yamo-pupil"/>
  <circle cx="40" cy="38" r="2.2" fill="#fff"/><circle cx="67" cy="38" r="2.2" fill="#fff"/>
  <path d="M42 60 q9 6 18 0" class="yamo-mouth"/>
  <circle cx="28" cy="56" r="4" class="yamo-cheek"/><circle cx="73" cy="56" r="4" class="yamo-cheek"/>
  <circle cx="54" cy="70" r="2" class="yamo-dot"/><circle cx="70" cy="74" r="2" class="yamo-dot"/><circle cx="64" cy="86" r="2" class="yamo-dot"/>
</svg>`;

const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];

/**
 * ホーム画面のせりふを選ぶ。
 * @param {object} s { plants: [{plant, entry, spot, check, fit}], today: Date, pets: {cats, dogs}, tipPool: [{entry, tip}] }
 * @returns {{ text: string, cite?: { label: string, url: string } }[]} 優先度順
 */
export function guideLines(s) {
  const out = [];
  const name = (x) => x.plant.nickname || x.entry.names.ja;
  const m = s.today.getMonth() + 1;

  if (!s.plants.length) {
    out.push({ text: 'はじめまして、ヤモリのヤモです。まずは「置き場所」を登録して、そこに合う植物を探してみよう。窓の向きと距離がわかれば、明るさを見積もれるよ。' });
  }
  const cold = s.plants.filter((x) => x.fit?.temp === 'cold');
  if (cold.length && (m >= 10 || m <= 4)) {
    out.push({ text: `${cold.map(name).join('、')}の置き場所は、冬の最低室温が低すぎるみたい。夜は窓辺から部屋の内側へ移してあげてね。` });
  }
  const due = s.plants.filter((x) => x.check?.due && x.check.overdueDays >= 0);
  if (due.length) {
    out.push({ text: `今日は ${due.map(name).join('、')} の土を確かめる日。指で触って、乾いていたら水をあげてね。湿っていたら「土を確認」を記録して、また数日後に。` });
  }
  const neverWatered = s.plants.filter((x) => !x.check?.due);
  if (neverWatered.length && !due.length) {
    out.push({ text: `${neverWatered.map(name).join('、')} は、まだ水やりの記録がないよ。最後に水をあげた日を記録すると、次に土を確かめる日を教えられるよ。` });
  }
  const bright = s.plants.filter((x) => x.fit?.light === 'bright');
  if (bright.length) out.push({ text: `${bright.map(name).join('、')} に強い日差しが当たっているかも。レースカーテン越しにすると葉焼けを防げるよ。` });
  const dark = s.plants.filter((x) => x.fit?.light === 'dark');
  if (dark.length) out.push({ text: `${dark.map(name).join('、')} には、いまの場所は暗すぎるみたい。もう少し窓に近づけてあげよう。` });
  if (s.pets?.cats || s.pets?.dogs) {
    const animal = s.pets.cats && s.pets.dogs ? '猫や犬' : s.pets.cats ? '猫' : '犬';
    const toxic = s.plants.filter((x) => (s.pets.cats && x.entry.toxicity?.cats === 'listed') || (s.pets.dogs && x.entry.toxicity?.dogs === 'listed'));
    if (toxic.length) out.push({ text: `${toxic.map(name).join('、')} は、出典で${animal}に害があると書かれているよ。かじられない場所に置いてね。` });
  }
  if (m === 12 || m === 1 || m === 2) out.push({ text: '冬は窓辺が夜にぐっと冷えるよ。暖房の風が直接当たる場所も、乾燥しすぎるので気をつけて。' });
  if (m >= 6 && m <= 8) out.push({ text: '夏に閉め切った部屋は思った以上に暑くなるよ。出かけるときは風通しを考えてあげてね。' });

  if (s.tipPool?.length) {
    const seed = Math.floor(s.today.getTime() / 86400000);
    const { entry, tip } = pick(s.tipPool, seed);
    out.push({ text: `${entry.names.ja}の豆知識：${tip.ja}`, cite: entry.ncsu ? { label: 'NC State Extension', url: entry.ncsu.url } : undefined });
  }
  return out;
}
