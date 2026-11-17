// 鉢植え・ベランダ：ベランダ向きの植物と、植物ごとの「鉢植えガイド」（鉢の大きさ・深さ・用土の配合・水やり）
// tender: true は寒さに弱く、冬は室内や軒下に取り込めば越冬できるもの。
// ※ 解説文はすべてオリジナル。数値は一般的な目安。

const P = (id, ja, latin, type, o) => ({ id, ja, latin, wiki: o.wiki ?? latin.replace(/ '.*$/, ''), type, humid: 2, sun: ['full'], moist: ['mid'], leaf: 'green', cut: 'after', div: 'none', heat: 11, ...o, tags: ['balcony', ...(o.tags || [])] });

export const BALCONY_BASE = [
  P('pelargonium', 'ゼラニウム', 'Pelargonium × hortorum', 'herb', { wiki: 'Pelargonium × hortorum', zone: [10, 11], tender: true, moist: ['dry', 'mid'], h: [30, 50], spread: 30, bloom: [4, 5, 6, 9, 10, 11], color: ['red', 'pink', 'white'], form: 'globe', tags: ['easy'], price: 400, note: '乾かしぎみに育てると次々に咲く、ベランダの定番。冬は軒下や室内の日だまりへ。' }),
  P('petunia', 'ペチュニア', 'Petunia × atkinsiana', 'annual', { sow: 'warm', zone: [2, 11], h: [15, 30], spread: 40, bloom: [4, 5, 6, 7, 8, 9, 10], color: ['purple', 'pink', 'white', 'red'], form: 'mound', price: 250, note: '鉢からあふれるように咲く。梅雨前に半分ほど切り戻すと秋まで長持ち。' }),
  P('calibrachoa', 'カリブラコア', 'Calibrachoa', 'annual', { sow: 'warm', zone: [2, 11], h: [15, 25], spread: 35, bloom: [4, 5, 6, 7, 8, 9, 10], color: ['orange', 'yellow', 'pink', 'purple', 'red'], form: 'mound', tags: ['easy'], price: 300, note: 'ペチュニアに似た小輪の花が鉢いっぱいに。雨に比較的強い。' }),
  P('lobelia-erinus', 'ロベリア・エリヌス', 'Lobelia erinus', 'annual', { sow: 'cool', zone: [2, 11], sun: ['full', 'part'], h: [10, 20], spread: 20, bloom: [4, 5, 6], color: ['blue', 'white', 'purple'], form: 'mound', price: 150, note: '涼しげな青い小花が鉢の縁からこぼれる。真夏の暑さは苦手。' }),
  P('bacopa', 'バコパ', 'Chaenostoma cordatum', 'herb', { zone: [9, 11], tender: true, sun: ['full', 'part'], h: [10, 15], spread: 30, bloom: [3, 4, 5, 6, 9, 10, 11], color: ['white', 'pink', 'purple'], form: 'mound', price: 300, note: '小さな花が長く咲き、垂れ下がるのでハンギングや寄せ植えの縁に。' }),
  P('nemesia', 'ネメシア', 'Nemesia strumosa', 'annual', { sow: 'cool', zone: [2, 11], h: [15, 30], spread: 20, bloom: [3, 4, 5, 6], color: ['blue', 'pink', 'white', 'yellow', 'purple'], form: 'mound', tags: ['fragrant'], price: 250, note: '甘い香りの品種も。春の寄せ植えに。' }),
  P('catharanthus', 'ニチニチソウ', 'Catharanthus roseus', 'annual', { sow: 'warm', zone: [2, 11], humid: 3, moist: ['dry', 'mid'], h: [20, 40], spread: 25, bloom: [6, 7, 8, 9, 10], color: ['pink', 'white', 'red'], form: 'mound', tags: ['easy'], price: 150, note: '真夏の照り返しにも強い。全草有毒なので、子どもやペットの口に入らないように。' }),
  P('portulaca', 'ポーチュラカ', 'Portulaca oleracea', 'annual', { sow: 'warm', zone: [2, 11], humid: 3, moist: ['dry'], h: [10, 20], spread: 30, bloom: [6, 7, 8, 9, 10], color: ['pink', 'orange', 'yellow', 'red', 'white'], form: 'mound', tags: ['easy', 'dry'], price: 150, note: '多肉質の葉で乾燥にとても強い。晴れた日中に花が開く。' }),
  P('begonia-semp', 'ベゴニア・センパフローレンス', 'Begonia Semperflorens', 'annual', { wiki: 'Begonia semperflorens', sow: 'warm', zone: [2, 11], sun: ['full', 'part'], h: [15, 30], spread: 25, bloom: [5, 6, 7, 8, 9, 10, 11], color: ['red', 'pink', 'white'], leaf: 'bronze', form: 'mound', tags: ['easy'], price: 150, note: '日なたでも半日陰でも咲き続ける、手間いらずの花。' }),
  P('torenia', 'トレニア', 'Torenia fournieri', 'annual', { sow: 'warm', zone: [2, 11], sun: ['part', 'shade'], moist: ['mid', 'wet'], h: [15, 30], spread: 25, bloom: [6, 7, 8, 9, 10], color: ['blue', 'purple', 'pink', 'white'], form: 'mound', tags: ['shade'], price: 150, note: '日陰のベランダでも夏じゅう咲く。水切れに注意。' }),
  P('coleus', 'コリウス', 'Coleus scutellarioides', 'annual', { sow: 'warm', zone: [2, 11], sun: ['part', 'full'], h: [30, 60], spread: 30, bloom: [], color: ['green'], leaf: 'bronze', form: 'mound', tags: ['shade'], price: 200, note: '赤・黄・紫の模様の葉を楽しむ。花穂を摘むと葉が長くきれい。' }),
  P('blueberry', 'ブルーベリー', 'Vaccinium corymbosum', 'shrub', { zone: [4, 8], heat: 8, h: [100, 200], spread: 90, bloom: [4, 5], harvest: [6, 7, 8], color: ['white'], form: 'mound', tags: ['veg', 'pollinator'], acid: true, price: 1500, note: '酸性の土を好む果樹。2品種以上を近くに置くと実つきがよい。秋の紅葉も美しい。' }),
  P('olive', 'オリーブ', 'Olea europaea', 'shrub', { zone: [8, 10], heat: 10, moist: ['dry', 'mid'], h: [150, 300], spread: 120, bloom: [5, 6], harvest: [10, 11], color: ['white'], leaf: 'silver', form: 'globe', tags: ['evergreen', 'dry'], price: 3000, note: '銀色の葉が風に揺れる常緑樹。鉢なら大きさを保ちやすい。実をつけるには別品種を一緒に。' }),
  P('lemon', 'レモン', 'Citrus limon', 'shrub', { zone: [9, 11], tender: true, h: [100, 250], spread: 100, bloom: [5, 6], harvest: [10, 11, 12], color: ['white'], form: 'globe', tags: ['evergreen', 'fragrant', 'veg'], price: 3500, note: '香りのよい白い花と黄色い実。寒風に当てないよう、冬は軒下へ。アゲハの幼虫がつくことも。' }),
  P('muehlenbeckia', 'ワイヤープランツ', 'Muehlenbeckia complexa', 'subshrub', { zone: [8, 10], sun: ['full', 'part'], h: [10, 30], spread: 40, bloom: [], color: ['green'], form: 'mound', tags: ['easy', 'evergreen'], price: 300, note: '針金のような細い茎に小さな丸い葉。鉢の縁から垂らすと涼しげ。' }),
  P('hatsuyuki', 'ハツユキカズラ', "Trachelospermum asiaticum 'Hatsuyuki-kazura'", 'subshrub', { wiki: 'Trachelospermum asiaticum', zone: [7, 10], sun: ['full', 'part'], h: [10, 20], spread: 40, bloom: [], color: ['green'], leaf: 'variegated', form: 'mound', tags: ['wa', 'evergreen'], price: 400, note: '新芽が白やピンクに色づくつる性の葉もの。寄せ植えの名脇役。' }),
  P('hedera', 'アイビー', 'Hedera helix', 'subshrub', { zone: [5, 10], sun: ['full', 'part', 'shade'], h: [10, 30], spread: 40, bloom: [], color: ['green'], leaf: 'variegated', form: 'mound', tags: ['easy', 'evergreen', 'shade'], price: 300, note: '日陰にも強い常緑のつる。地植えだと壁や木を覆うほど広がるので、鉢で楽しむのがおすすめ。' }),
  P('cyclamen', 'ガーデンシクラメン', 'Cyclamen persicum', 'herb', { zone: [9, 11], tender: true, humid: 1, sun: ['full', 'part'], h: [10, 20], spread: 20, bloom: [11, 12, 1, 2, 3], color: ['red', 'pink', 'white', 'purple'], form: 'mound', price: 400, note: '寒さに比較的強い小型のシクラメン。冬のベランダを彩る。株元に水をかけないように。' }),
  P('primula-julian', 'プリムラ・ジュリアン', 'Primula × juliana', 'annual', { wiki: 'Primula × polyantha', sow: 'cool', zone: [2, 11], sun: ['full', 'part'], h: [10, 15], spread: 15, bloom: [12, 1, 2, 3, 4], color: ['yellow', 'pink', 'red', 'purple', 'white', 'blue'], form: 'mound', price: 200, note: '冬から春に色とりどりの花。小さな鉢にも収まる。' }),
  P('mini-rose', 'ミニバラ', "Rosa chinensis 'Minima'", 'shrub', { wiki: 'Miniature rose', zone: [5, 9], heat: 9, h: [20, 50], spread: 30, bloom: [5, 6, 9, 10, 11], color: ['pink', 'red', 'white', 'yellow'], form: 'mound', tags: ['fragrant', 'english'], price: 800, note: '鉢で楽しめる小さなバラ。風通しよく、花がらはこまめに。' }),
  P('dichondra', 'ディコンドラ', "Dichondra argentea 'Silver Falls'", 'herb', { wiki: 'Dichondra argentea', zone: [10, 11], tender: true, moist: ['dry', 'mid'], h: [5, 10], spread: 60, bloom: [], color: ['green'], leaf: 'silver', form: 'mound', price: 300, note: '銀色の小さな葉がカーテンのように垂れる。ハンギングの主役。' }),
  P('scaevola', 'スカエボラ', 'Scaevola aemula', 'herb', { zone: [10, 11], tender: true, moist: ['dry', 'mid'], h: [15, 30], spread: 40, bloom: [5, 6, 7, 8, 9, 10], color: ['blue', 'purple', 'white'], form: 'mound', tags: ['easy'], price: 400, note: '扇を開いたような形の花が、初夏から秋まで咲き続ける。' }),
];

/** もともと図鑑にある植物のうち、鉢・ベランダでも育てやすいもの（ベランダ向きのタグ） */
export const BALCONY_EXTRA = ['lavender', 'rosemary', 'thymus', 'salvia-officinalis', 'origanum', 'mentha', 'melissa', 'ocimum', 'perilla', 'petroselinum', 'chives', 'viola', 'lobularia', 'heuchera', 'sedum', 'erigeron', 'nemophila', 'calendula', 'tropaeolum', 'tagetes', 'zinnia', 'gomphrena', 'muscari', 'crocus', 'narcissus', 'tulipa', 'helleborus', 'carex', 'festuca', 'mini-tomato', 'pepper', 'strawberry', 'lettuce', 'arugula', 'radish', 'komatsuna', 'agapanthus', 'gaura', 'salvia-microphylla', 'nepeta', 'stachys', 'dianthus', 'armeria', 'cerastium', 'ajuga', 'lamium', 'hosta', 'ophiopogon', 'aloe', 'stevia', 'aloysia', 'chamaemelum', 'matricaria', 'borago', 'coriandrum', 'anethum', 'lysimachia-aurea', 'scabiosa', 'penstemon', 'echinacea', 'xerochrysum'];

// ---------- 鉢植えガイド ----------
const SOIL = {
  akadama: { ja: '赤玉土（小粒）', color: '#b5653f' },
  fuyodo: { ja: '腐葉土', color: '#6b4c2e' },
  karuishi: { ja: '軽石（小粒）', color: '#d9d3c4' },
  taihi: { ja: '完熟堆肥', color: '#3f3324' },
  kuntan: { ja: 'もみ殻くん炭', color: '#2b2a22' },
  kanuma: { ja: '鹿沼土', color: '#e0c060' },
  peat: { ja: 'ピートモス（無調整）', color: '#8a6a44' },
  perlite: { ja: 'パーライト', color: '#f4f1e6' },
};
const MIX = {
  standard: { ja: '草花の基本の土', parts: [['akadama', 5], ['fuyodo', 3], ['karuishi', 1], ['taihi', 1]] },
  dry: { ja: '水はけ重視の土（乾燥を好む植物）', parts: [['akadama', 4], ['karuishi', 3], ['fuyodo', 2], ['kuntan', 1]] },
  wet: { ja: '保水性の高い土（湿り気を好む植物）', parts: [['akadama', 5], ['fuyodo', 4], ['taihi', 1]] },
  woodland: { ja: '林の土に近い、ふかふかの土', parts: [['akadama', 4], ['fuyodo', 4], ['kanuma', 1], ['taihi', 1]] },
  acid: { ja: '酸性の土（ツツジ科など）', parts: [['kanuma', 4], ['peat', 4], ['akadama', 2]] },
  veg: { ja: '野菜の土（肥沃で水もちがよい）', parts: [['akadama', 4], ['fuyodo', 3], ['taihi', 2], ['perlite', 1]] },
  bulb: { ja: '球根の土（水はけよく）', parts: [['akadama', 6], ['fuyodo', 3], ['karuishi', 1]] },
  succulent: { ja: '多肉質の植物の土', parts: [['akadama', 4], ['karuishi', 4], ['kanuma', 2]] },
  grass: { ja: 'グラスの土', parts: [['akadama', 5], ['fuyodo', 3], ['karuishi', 2]] },
  tree: { ja: '鉢植えの木の土', parts: [['akadama', 6], ['fuyodo', 3], ['karuishi', 1]] },
};
const DRYLOVERS = ['gazania', 'westringia', 'grevillea', 'anigozanthos', 'lavender', 'rosemary', 'thymus', 'santolina', 'salvia-officinalis', 'origanum', 'helichrysum', 'olive', 'perovskia', 'stachys', 'artemisia', 'satureja', 'cerastium', 'dianthus', 'armeria', 'scaevola', 'dichondra', 'pelargonium'];
const SUCCULENT = ['sedum', 'aloe', 'portulaca', 'kalanchoe'];
const ACID = ['blueberry', 'gardenia', 'camellia-sinensis', 'hydrangea-serrata', 'lindera'];
const DEEP = ['carrot', 'daucus', 'platycodon', 'lupinus', 'baptisia', 'asclepias', 'eryngium', 'papaver', 'alcea', 'tomato', 'mini-tomato', 'eggplant', 'asparagus', 'rhubarb', 'potato', 'sweet-potato', 'okra', 'corn', 'artichoke', 'paeonia', 'agapanthus', 'kniphofia', 'hemerocallis', 'glycyrrhiza', 'lilium'];
const SPREADERS = ['kakidooshi', 'mentha', 'lysimachia-aurea', 'houttuynia', 'hedera', 'physostegia', 'monarda', 'tanacetum', 'equisetum', 'petasites'];

/** 号 → 容量（L）の目安（一般的な丸鉢） */
export const potLiters = (go) => Math.round(1.3 * (go / 5) ** 2.95 * 10) / 10;

/**
 * 植物を鉢で育てるときの目安
 * 戻り値：{ go, cm, liters, depth, mix:{ja, parts:[{ja,part,color,pct}]}, suit(1〜3), suitText, water, feed, repot, notes[], count }
 */
export function potGuide(p) {
  const g = p.group || p.id;
  const isVeg = p.tags.includes('veg') && p.harvest;
  let cat = 'standard';
  if (SUCCULENT.includes(g)) cat = 'succulent';
  else if (ACID.includes(g) || p.acid) cat = 'acid';
  else if (isVeg && p.type !== 'shrub') cat = 'veg';
  else if (p.type === 'shrub' && p.h[1] >= 150) cat = 'tree';
  else if (p.type === 'bulb') cat = 'bulb';
  else if (DRYLOVERS.includes(g) || (p.moist.length === 1 && p.moist[0] === 'dry') || p.tags.includes('dry')) cat = 'dry';
  else if (p.moist.includes('wet') && !p.moist.includes('dry')) cat = 'wet';
  else if (p.form === 'fern' || !p.sun.includes('full')) cat = 'woodland';
  else if (p.form === 'grass') cat = 'grass';

  const small = p.h[1] <= 30 && p.spread <= 25;
  let go = Math.round(p.spread / 6) + 1 + (p.h[1] >= 150 ? 1 : 0);
  if (p.type === 'bulb') go = p.h[1] <= 30 ? 5 : 7;
  go = Math.max(small ? 4 : 5, Math.min(15, go));
  const cm = go * 3;
  // 小さな草花・葉物野菜・小球根は、ひとつの鉢やプランターに数株まとめる
  const count = p.type === 'bulb' && p.h[1] <= 30 ? '5号鉢に5〜7球' : isVeg && p.spread <= 20 ? `65cmプランターに${Math.max(4, Math.round(60 / p.spread))}株ほど` : small ? '1株で4号、3株なら6号' : '1株';
  const depth = DEEP.includes(g) ? '深鉢（深さ30cm以上）' : (SUCCULENT.includes(g) || (p.h[1] <= 15 && p.type !== 'bulb')) ? '浅めの鉢でも可' : '普通の深さ';
  let suit = p.h[1] <= 80 && p.spread <= 50 ? 3 : p.h[1] <= 160 && p.spread <= 90 ? 2 : 1;
  if (p.tags.includes('balcony') || SPREADERS.includes(g)) suit = Math.max(suit, p.h[1] <= 200 ? 3 : 2);
  const suitText = { 3: '鉢植え向き', 2: '大きめの鉢なら育てられる', 1: '鉢では窮屈（大鉢か地植え向き）' }[suit];
  const water = p.moist.includes('wet') && !p.moist.includes('dry') ? '土を乾かさないように。夏は朝夕の2回が目安'
    : cat === 'dry' || cat === 'succulent' ? '土の表面が乾いてから、さらに1〜2日おいてたっぷり'
      : '土の表面が乾いたら、鉢底から流れるまでたっぷり';
  const feed = isVeg ? '植え付け時に元肥、実がつき始めたら2週間に1回追肥'
    : p.type === 'annual' && p.bloom.length >= 4 ? '花が咲いている間は、10日に1回ほど液体肥料'
      : cat === 'dry' || cat === 'succulent' ? '春に少量の緩効性肥料（多すぎると徒長）'
        : '春と秋に緩効性肥料を少量';
  const repot = p.type === 'annual' ? '毎年、新しい土で植え直す' : p.type === 'shrub' ? '2〜3年に1回、ひと回り大きな鉢へ' : p.type === 'bulb' ? '2〜3年に1回、植え替えて分球' : '1〜2年に1回（春か秋）、株分けを兼ねて';
  const notes = [];
  if (p.tender) notes.push('寒さに弱いので、冬は室内の明るい窓辺や軒下へ（5℃以上が目安）。');
  if (SPREADERS.includes(g)) notes.push('地下茎やつるで広がりやすいので、地植えより鉢植えがおすすめ。');
  if (cat === 'acid') notes.push('石灰を混ぜない。水道水のアルカリが気になるときは雨水も活用。');
  if (DEEP.includes(g)) notes.push('根がまっすぐ深く伸びるので、深さのある鉢を選ぶ。');
  if (p.h[1] >= 100) notes.push('背が高くなるので、重みのある鉢や支柱で倒れを防ぐ。');
  if (p.type === 'bulb') notes.push('鉢の深さの半分くらいに植え、球根2〜3個分の間をあける。');
  const total = MIX[cat].parts.reduce((t, [, n]) => t + n, 0);
  return {
    cat, go, cm, liters: potLiters(go), depth, count, suit, suitText, water, feed, repot, notes,
    mix: { ja: MIX[cat].ja, parts: MIX[cat].parts.map(([k, n]) => ({ key: k, ja: SOIL[k].ja, color: SOIL[k].color, part: n, pct: Math.round((n / total) * 100) })) },
  };
}

/** 鉢のサイズ比較と用土の配合（SVGのグラフ） */
export function potGuideSVG(g) {
  const sizes = [4, 5, 6, 8, 10, 12, 15];
  if (!sizes.includes(g.go)) sizes.push(g.go);
  sizes.sort((a, b) => a - b);
  const S = 2.0; // 1cm あたりの px
  let x = 8;
  const base = 104;
  const pots = sizes.map((go) => {
    const w = go * 3 * S * 0.5, h = go * 3 * S * 0.42 * (g.depth.startsWith('深鉢') && go === g.go ? 1.35 : 1);
    const on = go === g.go;
    const cx = x + w / 2;
    x += w + 6;
    return `<g><path d="M${(cx - w / 2).toFixed(1)} ${base - h} h${w.toFixed(1)} l-${(w * 0.1).toFixed(1)} ${h} h-${(w * 0.8).toFixed(1)}Z" fill="${on ? '#c07a4a' : '#e6dccb'}" stroke="${on ? '#8a4a2a' : '#c9bfa6'}" stroke-width="1"/>
      ${on ? `<path d="M${(cx - w / 2 + 2).toFixed(1)} ${base - h + 4} h${(w - 4).toFixed(1)}" stroke="#6b4c2e" stroke-width="3"/><path d="M${cx} ${base - h} q-6 -14 -2 -26 M${cx} ${base - h} q8 -10 10 -22" stroke="#6f8f4e" stroke-width="2" fill="none"/><ellipse cx="${cx - 2}" cy="${base - h - 26}" rx="6" ry="4" fill="#7aa95c"/><ellipse cx="${cx + 10}" cy="${base - h - 22}" rx="5" ry="3.4" fill="#7aa95c"/>` : ''}
      <text x="${cx}" y="${base + 12}" text-anchor="middle" font-size="${on ? 10 : 8.5}" font-weight="${on ? 700 : 400}" fill="${on ? '#8a4a2a' : '#8a8370'}">${go}号</text></g>`;
  }).join('');
  const W1 = x + 4;
  // ドーナツ
  const R = 34, r0 = 20, cx = W1 + 48, cy = 58;
  let a = -Math.PI / 2;
  const arcs = g.mix.parts.map((p) => {
    const a2 = a + (p.pct / 100) * Math.PI * 2;
    const large = a2 - a > Math.PI ? 1 : 0;
    const P1 = [cx + R * Math.cos(a), cy + R * Math.sin(a)], P2 = [cx + R * Math.cos(a2), cy + R * Math.sin(a2)];
    const Q1 = [cx + r0 * Math.cos(a2), cy + r0 * Math.sin(a2)], Q2 = [cx + r0 * Math.cos(a), cy + r0 * Math.sin(a)];
    const d = `M${P1[0].toFixed(1)} ${P1[1].toFixed(1)} A${R} ${R} 0 ${large} 1 ${P2[0].toFixed(1)} ${P2[1].toFixed(1)} L${Q1[0].toFixed(1)} ${Q1[1].toFixed(1)} A${r0} ${r0} 0 ${large} 0 ${Q2[0].toFixed(1)} ${Q2[1].toFixed(1)}Z`;
    a = a2;
    return `<path d="${d}" fill="${p.color}" stroke="#fbf8f0" stroke-width="1"><title>${p.ja} ${p.pct}%</title></path>`;
  }).join('');
  const legend = g.mix.parts.map((p, i) => `<g transform="translate(${cx + R + 12} ${22 + i * 15})"><rect width="10" height="10" rx="2" fill="${p.color}" stroke="#b9ad8e" stroke-width=".5"/><text x="14" y="9" font-size="9.5" fill="#2b2a22">${p.ja} ${p.part}</text></g>`).join('');
  const W = cx + R + 130;
  return `<svg class="pot-svg" viewBox="0 0 ${W.toFixed(0)} 124" role="img" aria-label="おすすめの鉢の大きさと用土の配合">
    <text x="8" y="12" font-size="9.5" fill="#8a8370">鉢の大きさ（1号＝直径3cm）</text>
    ${pots}
    <text x="${cx}" y="12" text-anchor="middle" font-size="9.5" fill="#8a8370">用土の配合</text>
    ${arcs}<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#2b2a22">${g.liters}L</text>
    ${legend}
  </svg>`;
}
