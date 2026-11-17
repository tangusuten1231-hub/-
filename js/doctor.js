// 症状から調べる：植物の不調を、見た目の症状・植物・季節・置き場所から推定する（すべてオリジナルの解説）
import { PESTS } from './pests.js';

export const SYMPTOMS = {
  yellow: '葉が黄色くなる',
  whitepowder: '葉に白い粉がつく',
  spots: '葉に斑点・まだら',
  holes: '葉に穴・かじられた跡',
  lines: '葉に白い線（落書きのような跡）',
  sticky: '新芽に小さな虫・ベタベタ',
  speckle: '葉がかすれたように白っぽい',
  orange: '葉の裏にオレンジや茶色の粉',
  wilt: 'しおれる・ぐったりする',
  rot: '株元や茎が茶色く腐る・溶ける',
  mold: '灰色のカビが生える',
  browntips: '葉先・葉の縁が茶色く枯れる',
  noflower: '花が咲かない・少ない',
  leggy: 'ひょろひょろ伸びて倒れる',
  center: '株の中心がはげる・枯れる',
  lifted: '株が浮き上がる・根が見える',
  sudden: '急に枯れた・株がぐらぐらする',
};

// 病害虫データ（pests.js）と症状の対応
const PEST_SYM = {
  powdery: ['whitepowder'], botrytis: ['mold', 'spots', 'rot'], 'southern-blight': ['rot', 'wilt'], 'root-rot': ['wilt', 'rot', 'yellow'],
  'soft-rot': ['rot'], rust: ['orange', 'spots'], 'blackspot-hellebore': ['spots'], aphid: ['sticky', 'yellow'], mite: ['speckle', 'yellow'],
  slug: ['holes'], armyworm: ['holes'], leafminer: ['lines'], chafer: ['sudden', 'wilt'], 'frost-heave': ['lifted'], 'snow-rot': ['rot', 'mold'],
};

/** 育て方の問題（生理障害・管理） */
export const CARE_CAUSES = [
  { id: 'dry', ja: '水切れ', kind: '育て方', sym: ['wilt', 'browntips', 'yellow'], months: [5, 6, 7, 8, 9], pot: 1.5,
    check: ['土の中まで乾いていないか（指を第2関節まで入れてみる）', '夕方にしおれて、朝には戻るか'],
    fix: ['朝、鉢底から流れ出るまでたっぷり水をやる', '真夏の鉢は朝夕の2回。マルチングで乾燥を防ぐ', '何度も水切れする鉢は、ひと回り大きな鉢へ'] },
  { id: 'wet', ja: '水のやりすぎ・水はけが悪い', kind: '育て方', sym: ['yellow', 'wilt', 'rot'], pot: 1.2,
    check: ['土がいつも湿っていないか', '鉢皿に水がたまったままになっていないか', '下の葉から黄色くなり、土が湿っているのにしおれる'],
    fix: ['土の表面が乾いてから水をやる', '鉢皿の水は捨てる', '地植えは土を盛って高くするか、軽石や腐葉土を混ぜて水はけをよくする'] },
  { id: 'sunburn', ja: '葉焼け（強すぎる日差し）', kind: '育て方', sym: ['browntips', 'spots'], months: [6, 7, 8, 9], sunLover: false,
    check: ['日の当たる側の葉だけが白〜茶色に抜けていないか', '半日陰を好む植物を、西日の当たる場所に置いていないか'],
    fix: ['夏は午後の日差しを避けられる場所へ（鉢なら移動）', 'よしずや寒冷紗で日よけをする', '傷んだ葉は少しずつ取り除く'] },
  { id: 'shade', ja: '日当たり不足', kind: '育て方', sym: ['leggy', 'noflower', 'yellow'], sunLover: true,
    check: ['1日に何時間日が当たっているか（日向の植物は5〜6時間以上ほしい）', '茎が光の方へ傾いていないか'],
    fix: ['日当たりのよい場所へ移す（鉢なら簡単）', 'まわりの枝を透かして光を入れる', '日陰では、日陰に強い植物に植え替える'] },
  { id: 'nitrogen', ja: '肥料のやりすぎ（とくに窒素）', kind: '育て方', sym: ['noflower', 'leggy', 'sticky'],
    check: ['葉ばかり茂って濃い緑になっていないか', '株が大きくやわらかく育ち、倒れやすくないか'],
    fix: ['しばらく肥料を止める', '宿根草はもともと少なめの肥料で育つ。春に緩効性肥料を少しで十分', '花を咲かせたいときは、リン酸の多い肥料に'] },
  { id: 'hunger', ja: '肥料切れ', kind: '育て方', sym: ['yellow', 'noflower'], pot: 1.4,
    check: ['葉全体が淡い黄緑になっていないか', '鉢植えで、植え替えや追肥を長くしていないか'],
    fix: ['生育期に緩効性肥料を置くか、液体肥料を2週間に1回', '鉢植えは1〜2年に1回、新しい土で植え替える'] },
  { id: 'rootbound', ja: '根詰まり（鉢植え）', kind: '育て方', sym: ['wilt', 'yellow', 'noflower'], potOnly: true,
    check: ['鉢底の穴から根が出ていないか', '水をやってもすぐに乾く、しみこみにくい'],
    fix: ['春か秋に、ひと回り大きな鉢へ植え替える', '大きくしたくないときは、根を1/3ほど切って同じ鉢に新しい土で植え直す'] },
  { id: 'cold', ja: '寒さ・霜の害', kind: '育て方', sym: ['browntips', 'spots', 'wilt'], months: [11, 12, 1, 2, 3], tender: 2,
    check: ['冷え込んだ朝のあとに、葉が黒っぽく透けたようになっていないか', '寒さに弱い植物（暖地向け）ではないか'],
    fix: ['寒さに弱い植物は、鉢なら軒下や室内へ', '地植えは株元を腐葉土やわらで覆う（マルチング）', '傷んだ葉は春に新芽が出てから切る'] },
  { id: 'heat', ja: '暑さ・蒸れ（夏バテ）', kind: '育て方', sym: ['wilt', 'browntips', 'center', 'rot'], months: [7, 8, 9], humid: true,
    check: ['夏の夜も気温が下がらない日が続いていないか', '株が混み合って、中が蒸れていないか'],
    fix: ['梅雨前に半分ほど切り戻して風通しをよくする', '鉢は風通しのよい明るい日陰へ移す', '暑さに強い品種へ植え替えるのも一つの方法'] },
  { id: 'natural', ja: '季節の自然な変化（休眠・落葉）', kind: '自然なこと', sym: ['yellow', 'browntips'], months: [10, 11, 12], deciduous: true,
    check: ['秋から冬で、ほかの葉も同じように色づいていないか', '球根植物で、花が終わって1〜2か月たっていないか'],
    fix: ['心配いりません。冬は地上部が枯れて、春にまた芽を出す', '枯れた茎は春の芽出し前に切る（種の頭を楽しむなら残す）', '球根の葉は、黄色くなるまで切らずに残す'] },
  { id: 'young', ja: '植えて1年目（根づく途中）', kind: '自然なこと', sym: ['noflower'],
    check: ['植えてから1年たっていないか'],
    fix: ['宿根草は、1年目は根を張り、2〜3年目から本領発揮', '水切れに気をつけて、ゆっくり待つ'] },
  { id: 'prune', ja: '剪定の時期が違う', kind: '育て方', sym: ['noflower'], shrub: true,
    check: ['秋や冬に枝を切らなかったか（アジサイなど、前の年の枝に花芽をつける低木）'],
    fix: ['アジサイは花のすぐ後（7月まで）に剪定する', 'ノリウツギやアナベルなど新しい枝に咲くものは、冬〜早春に切ってよい', '植物ごとの剪定時期は図鑑と作業暦で確かめる'] },
  { id: 'old', ja: '株の老化（株分けの時期）', kind: '育て方', sym: ['center', 'noflower', 'leggy'],
    check: ['植えてから3〜5年以上たっていないか', '株の中心が枯れて、外側だけが育っていないか'],
    fix: ['春か秋に掘り上げて、元気な外側の部分を株分けして植え直す', '中心の古い部分は処分する', '植え直すときに堆肥を混ぜて土を新しくする'] },
];

/**
 * 診断。sym：症状IDの配列、p：植物（任意）、month：北半球換算の月、opts：{ pot, humidHot, climate }
 * 戻り値：[{ id, ja, kind, score, why:[理由], check:[], fix:[], pest? }]
 */
export function diagnose(sym, p, month, opts = {}) {
  if (!sym.length) return [];
  const out = [];
  for (const pe of PESTS) {
    const ps = PEST_SYM[pe.id] || [];
    const hit = sym.filter((s) => ps.includes(s));
    if (!hit.length) continue;
    let score = hit.length * 3;
    const why = [`症状「${hit.map((s) => SYMPTOMS[s]).join('・')}」`];
    if (p && (typeof pe.hosts === 'function' ? pe.hosts(p) : pe.hosts?.includes(p.group))) { score += 3; why.push(`${p.groupJa || p.ja}によく出る`); }
    if (pe.months?.includes(month)) { score += 1.5; why.push('今の季節に多い'); }
    if (opts.climate && pe.risk) { const r = pe.risk(opts.climate); if (r >= 2) { score += r - 1; why.push('この地域で出やすい'); } }
    out.push({ id: pe.id, ja: pe.ja, kind: pe.kind, score, why, check: [pe.sign], fix: [...(pe.treat || []), ...(pe.prevent || []).slice(0, 2)], pest: true });
  }
  for (const c of CARE_CAUSES) {
    const hit = sym.filter((s) => c.sym.includes(s));
    if (!hit.length) continue;
    let score = hit.length * 2.6;
    const why = [`症状「${hit.map((s) => SYMPTOMS[s]).join('・')}」`];
    if (c.months?.includes(month)) { score += 1.5; why.push('今の季節に多い'); } else if (c.months) score -= 1.5;
    if (opts.pot && c.pot) { score += c.pot; why.push('鉢植えで起きやすい'); }
    if (c.potOnly && !opts.pot) score -= 4;
    if (p) {
      if (c.sunLover === true && p.sun.includes('full') && !p.sun.includes('shade')) { score += 1; why.push('日向を好む植物'); }
      if (c.sunLover === false && !p.sun.includes('full')) { score += 2.5; why.push('半日陰〜日陰を好む植物'); }
      if (c.tender && (p.tender || p.zone[0] >= 8)) { score += c.tender; why.push('寒さに弱い植物'); }
      if (c.humid && p.humid <= 1) { score += 2; why.push('蒸れに弱い植物'); }
      if (c.deciduous && !p.tags.includes('evergreen')) score += 1;
      if (c.shrub && p.type !== 'shrub') score -= 4;
      if (c.shrub && /hydrangea/.test(p.group)) { score += 3; why.push('アジサイは剪定の時期で花が変わる'); }
    } else if (c.shrub) score -= 1.5;
    if (c.humid && opts.humidHot) score += 1;
    if (c.id === 'young' && opts.firstYear) { score += 3; why.push('植えて1年以内'); }
    if (c.id === 'old' && opts.years >= 3) { score += 2; why.push(`植えて${opts.years}年`); }
    out.push({ id: c.id, ja: c.ja, kind: c.kind, score, why, check: c.check, fix: c.fix });
  }
  out.sort((a, b) => b.score - a.score);
  const top = out[0]?.score || 1;
  return out.slice(0, 6).map((x) => ({ ...x, level: x.score >= top * 0.85 ? 'high' : x.score >= top * 0.6 ? 'mid' : 'low' }));
}
