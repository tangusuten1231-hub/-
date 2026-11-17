// 植物の解説文を、登録データ（姿・育て方・手入れ・使い方）から組み立てる。相性のよい植物も選ぶ。
import { PLANTS, COLORS } from './plants.js';
import { TYPE_JA, USES } from './meta.js';
import { heightClass } from './garden.js';
import { zoneRangeJa } from './fit.js';

/** 月のリストを「5〜6月と9〜10月」のような言い方に */
export function bloomText(months) {
  if (!months.length) return '';
  const set = new Set(months);
  if (set.size === 12) return '一年を通して';
  // 年をまたぐ場合（11,12,1,2）に備え、花のない月の次から数える
  let start = 1;
  for (let m = 1; m <= 12; m++) if (!set.has(m) && set.has((m % 12) + 1)) { start = (m % 12) + 1; break; }
  const runs = [];
  let cur = null;
  for (let i = 0; i < 12; i++) {
    const m = ((start - 1 + i) % 12) + 1;
    if (set.has(m)) { if (cur) cur[1] = m; else { cur = [m, m]; runs.push(cur); } } else cur = null;
  }
  return runs.map(([a, b]) => (a === b ? `${a}月` : `${a}〜${b}月`)).join('と');
}

const FORM_NOUN = { spike: '穂状の花', daisy: '花', globe: '丸くまとまった花', plate: '平たく広がる花房', airy: '細かな花', mound: '花', grass: '穂' };
const FORM_ROLE = {
  spike: '縦に伸びる花穂が、丸い花やこんもりした株と好対照になります。',
  daisy: 'はっきりした花の形が、視線を集める主役になります。',
  globe: '丸い花が、植栽にリズムと愛らしさを添えます。',
  plate: '水平に広がる花房が、穂状の花やグラスとよく合います。',
  airy: '透け感のある姿が、植物どうしをやわらかくつなぎます。',
  mound: 'こんもりした姿が、足元を引き締めます。',
  grass: '風に揺れる葉と穂が、花の間に動きと光を添えます。',
  fern: '繊細な葉が、日陰に涼しさと奥行きを添えます。',
};

function sunText(p) {
  const s = p.sun;
  if (s.length === 3) return '日向から日陰まで、場所をあまり選びません';
  if (s.includes('full') && s.includes('part')) return s[0] === 'part' ? '半日陰から日向で育ちます' : '日向を好みますが、半日陰でも育ちます';
  if (s.includes('part') && s.includes('shade')) return s[0] === 'shade' ? '日陰から半日陰の、直射日光の当たらない場所が向いています' : '半日陰から日陰の、強い日差しを避けた場所が向いています';
  if (s[0] === 'full') return '一日を通してよく日の当たる場所で育てます';
  if (s[0] === 'part') return '午前中だけ日が当たるような半日陰が適しています';
  return '日陰で育てます';
}
function moistText(p) {
  const m = p.moist;
  if (m.length === 3) return '土は乾きぎみから湿りぎみまで幅広く適応します';
  if (m.includes('dry') && m.includes('mid')) return '水はけのよい土を好み、やや乾きぎみに育てます';
  if (m.includes('mid') && m.includes('wet')) return '湿り気のある土を好み、水切れに注意します';
  if (m[0] === 'dry') return '水はけのよい乾いた土が欠かせません。過湿にすると根が傷みます';
  if (m[0] === 'wet') return '常に湿り気のある土を好み、乾燥を嫌います';
  return '水はけと水もちのよい、ふつうの庭土でよく育ちます';
}
function coldText(p) {
  if (p.type === 'annual') {
    return p.sow === 'cool'
      ? '涼しい季節に育つ一年草で、暖かい地域では秋に、寒い地域では春に種をまきます。'
      : '暖かくなってから種をまく一年草で、夏の暑さの中でよく育ちます。';
  }
  const z = p.zone[0];
  const t = z <= 4 ? '寒さにとても強く、寒冷地でも問題なく冬を越します'
    : z <= 6 ? '寒さに強く、多くの地域で屋外で冬越しできます'
    : z <= 7 ? '関東以西の平地なら屋外で冬越しできますが、寒冷地では防寒が必要です'
    : '寒さに弱いので、霜の降りる地域では鉢に上げるか、しっかり防寒します';
  return `耐寒性ゾーンは${zoneRangeJa(p.zone)}${p.fit?.zoneVerified ? '' : 'が目安'}で、${t}。`;
}
function humidText(p) {
  const h = p.fit?.heatHumidityTolerance;
  if (h === 'weak') return '高温多湿が苦手なので、梅雨から夏は風通しをよくし、水はけを良くして蒸れを防ぐことが大切です。';
  if (h === 'strong') return p.fit?.humidVerified ? '湿気の多い夏にも強いとされる植物です（米国南東部での評価）。' : '蒸し暑い夏にも比較的強い植物です（目安）。';
  return '';
}
function careText(p) {
  const out = [];
  const cut = {
    after: '花が終わったら花茎を切り戻すと株が整い、種類によってはもう一度咲きます。',
    chelsea: '5月末から6月に茎を半分ほど切る「摘心」をすると、草丈が抑えられて倒れにくくなり、花数も増えます。',
    spring: '冬の枯れ姿も見どころなので、刈り取りは新芽が動き出す前の早春に、地際で行います。',
    leaves: '傷んだ古い葉を取り除く程度で、強い剪定は必要ありません。',
    none: p.type === 'annual' ? '花がらをこまめに摘むと長く咲きます。種を採るなら、最後の花は残しておきます。' : '剪定はほとんど必要ありません。',
  }[p.cut];
  if (cut) out.push(cut);
  if (!['annual', 'shrub'].includes(p.type)) {
    const div = {
      spring: '株が込み合ってきたら、春の芽出しの頃に株分けして若返らせます。',
      autumn: '株分けは秋が適期です。',
      both: '株分けは春と秋のどちらでも行えます。',
      none: '移植や株分けを嫌うので、植える場所は最初によく考えて決めましょう。',
    }[p.div];
    if (div) out.push(div);
  }
  out.push(`株間は${p.spread}cmほどあけて植えます。`);
  return out.join('');
}

/** 相性のよい植物（同じ環境で育ち、花期が重なり、姿が対照的なもの） */
const compCache = new Map();
export function companions(p, n = 4) {
  if (compCache.has(p.id)) return compCache.get(p.id);
  const best = new Map();
  for (const q of PLANTS) {
    if (q.group === p.group || q.custom) continue;
    if (!q.sun.some((s) => p.sun.includes(s)) || !q.moist.some((m) => p.moist.includes(m))) continue;
    if ((q.type === 'annual') !== (p.type === 'annual') && q.type === 'annual') continue;
    const overlap = q.bloom.filter((m) => p.bloom.includes(m)).length;
    if (!overlap && q.form !== 'grass' && p.form !== 'grass' && q.form !== 'fern') continue;
    let s = Math.min(overlap, 3) * 0.8;
    if (q.form !== p.form) s += 2;
    if (heightClass(q) !== heightClass(p)) s += 1;
    s += q.tags.filter((t) => p.tags.includes(t) && !['easy', 'pollinator'].includes(t)).length * 1.2;
    if (Math.abs(q.humid - p.humid) >= 2) s -= 1.5;
    if (q.color[0] === p.color[0]) s -= 0.5;
    // 名前で結果が偏らないよう、IDから決まる小さな値を足す
    s += ((q.id.length * 7 + q.id.charCodeAt(0)) % 10) / 20;
    const prev = best.get(q.group);
    if (!prev || s > prev.s) best.set(q.group, { q, s });
  }
  const out = [...best.values()].sort((a, b) => b.s - a.s).slice(0, n).map((x) => x.q);
  compCache.set(p.id, out);
  return out;
}

/** 解説文（見出し付きの段落） */
export function describe(p) {
  const colors = p.color.map((c) => COLORS[c].ja).join('・');
  const LEAF_TEXT = { silver: '銀色がかった葉', bronze: '銅色の葉', gold: '黄金色の葉', variegated: '斑入りの葉', blue: '青みがかった葉' };
  const leaf = LEAF_TEXT[p.leaf] ? `${LEAF_TEXT[p.leaf]}が美しく、花のない時期にも見どころがあります。` : '';
  const ever = p.tags.includes('evergreen') ? '冬も葉が残る常緑性です。' : '';
  const long = p.bloom.length >= 5 ? '花期がとても長いのも魅力です。' : '';
  const flower = p.form === 'fern'
    ? 'シダの仲間で花は咲かず、葉の姿を楽しみます。'
    : !p.bloom.length
      ? (p.harvest?.length ? '花は観賞の対象ではなく、育てて収穫を楽しむ植物です。' : '花は観賞の対象ではなく、葉の色や形を楽しむ植物です。')
    : p.form === 'grass' && p.color[0] === 'green'
      ? `${bloomText(p.bloom)}に穂を出します。`
      : `${bloomText(p.bloom)}に、${colors}の${FORM_NOUN[p.form] || '花'}が咲きます。`;
  const layer = { back: '花壇の後方や背景に向く、背の高い植物です。', middle: '花壇の中ほどで主役や準主役になる高さです。', front: '花壇の手前や縁取りに向く、低めの植物です。' }[heightClass(p)];
  const extra = [
    p.tags.includes('pollinator') ? '蝶や蜂がよく訪れます。' : '',
    p.tags.includes('fragrant') ? '香りも楽しめます。' : '',
    p.uses?.length ? `${p.uses.map((u) => USES[u].ja).join('・')}にも向いています。` : '',
  ].join('');
  return [
    { h: '特徴', t: `${p.family.ja}の${TYPE_JA[p.type] || '植物'}で、草丈は${p.h[0]}〜${p.h[1]}cmほどになります。${flower}${long}${leaf}${ever}` },
    { h: '育て方', t: `${sunText(p)}。${moistText(p)}。${humidText(p)}${coldText(p)}` },
    { h: '手入れ', t: careText(p) },
    { h: '庭での使い方', t: `${layer}${FORM_ROLE[p.form] || ''}${extra}` },
  ];
}
