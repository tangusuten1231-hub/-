// 「ツピに聞く」：質問の言葉から話題を読み取り、気候・庭・記録・天気予報をもとに答えを組み立てる。
// 生成AIではなく、決まった話題に答える仕組み。
import { PLANTS } from './plants.js';
import { evaluate, bloomGaps, buildTasks, findPlants, sowAdvice, localMonth, LEVEL } from './garden.js';
import { PESTS, pestsForPlant, pestTasks } from './pests.js';
import { describe, companions, bloomText } from './describe.js';
import { formatDoy, humidityStress } from './climate.js';
import { weatherAdvice } from './weather.js';
import { insights, lastEvent } from './diary.js';

export const STARTERS = ['今週なにをすればいい？', '水やりは必要？', 'おすすめの植物は？', '花が少ない月は？', '元気がない株がある', '去年の記録からのお知らせ'];

const strip = (s) => s.replace(/[（(].*?[）)]/g, '').replace(/[‘’']/g, '');

/** 質問に出てくる植物を探す（庭の植物を優先、長い名前を優先） */
export function findPlant(text, gardenPlants = []) {
  const t = strip(text);
  let best = null;
  const consider = (p, bonus) => {
    for (const name of [p.cv && !p.custom ? `${strip(p.groupJa)}${strip(p.cv)}` : null, strip(p.ja), p.cv ? strip(p.cv) : null, strip(p.groupJa)]) {
      if (!name || name.length < 2 || !t.includes(name)) continue;
      const score = name.length + bonus;
      if (!best || score > best.score) best = { p, score };
    }
  };
  gardenPlants.forEach((p) => consider(p, 100));
  PLANTS.forEach((p) => consider(p, 0));
  return best?.p ?? null;
}

const SYMPTOMS = [
  { re: /白い粉|うどんこ/, pest: 'powdery' },
  { re: /ナメクジ|穴があ|食べられ|かじられ|食害/, pest: 'slug', also: 'armyworm' },
  { re: /アブラムシ|虫がびっしり|小さい虫/, pest: 'aphid' },
  { re: /ハダニ|かすり|色が抜け|白っぽく/, pest: 'mite' },
  { re: /カビ|灰色/, pest: 'botrytis' },
  { re: /さび|オレンジの粉/, pest: 'rust' },
  { re: /溶け|腐|黒く|蒸れ|夏越し/, pest: 'root-rot', also: 'southern-blight' },
  { re: /ぐらぐら|根がな/, pest: 'chafer' },
  { re: /霜柱|浮き上が/, pest: 'frost-heave' },
];

const p1 = (s) => `<p>${s}</p>`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pestHtml = (x) => `<p><b>${esc(x.ja)}</b>かもしれないね。${esc(x.sign)}</p><p>予防：${esc(x.prevent.slice(0, 2).join('。'))}。<br>出てしまったら：${esc(x.treat[0])}。</p>`;

/**
 * @param text 質問
 * @param ctx { climate, garden:{name,sun,moist}, plants:[庭の植物], entries:[記録], forecast:[予報]|null, now:Date }
 * 戻り値: { html, chips:[次の質問候補], actions:[{label, go?, find?, record?}] }
 */
export function reply(text, ctx) {
  const q = text.trim();
  const c = ctx.climate;
  const now = ctx.now || new Date();
  const month = now.getMonth() + 1;
  const north = c ? localMonth(month, c.south) : month;
  const plants = ctx.plants || [];
  const gname = ctx.garden?.name || '庭';
  const needLoc = () => ({ html: p1('その前に、庭の場所を教えてほしいな。場所がわかると、気候に合わせて答えられるよ。'), actions: [{ label: '場所を設定する', go: 'site' }], chips: [] });

  // --- あいさつ・自己紹介 ---
  if (/^(こんにちは|こんばんは|おはよう|やあ|はじめまして)/.test(q)) return { html: p1('こんにちは！ ツピだよ。庭のことなら何でも聞いてね。'), chips: STARTERS.slice(0, 4) };
  if (/ありがとう|助かった|サンキュー/.test(q)) return { html: p1('どういたしまして！ また何でも聞いてね。ツピツピ♪'), chips: [] };
  if (/(きみ|あなた|ツピ|君).*(誰|だれ|何者|なに)|自己紹介/.test(q)) return { html: p1('ぼくはシジュウカラのツピ。この庭の案内役だよ。きみの庭の気候や植物、ノートの記録を見ながら答えるよ。AIではないから、むずかしい質問は苦手なんだ。'), chips: STARTERS.slice(0, 4) };

  // --- 記録からのお知らせ ---
  if (/去年|記録|ノート|リマインド|お知らせ|思い出/.test(q)) {
    const nameOf = (id) => PLANTS.find((p) => p.id === id)?.ja || 'その植物';
    const ins = insights(ctx.entries || [], now, nameOf);
    if (!ins.length) {
      const n = (ctx.entries || []).length;
      return { html: p1(n ? `ノートは${n}件あるよ。来年の今頃になると、「去年は◯日に咲いたよ」「そろそろ切り戻しの頃だよ」とお知らせできるようになるんだ。咲き始めや作業の日を記録しておいてね。` : 'まだノートの記録がないみたい。咲き始めた日や作業した日を記録しておくと、来年ぼくが「そろそろだよ」とお知らせできるよ。'), actions: [{ label: '今日の記録を書く', record: true }], chips: ['今週なにをすればいい？'] };
    }
    return { html: p1('ノートを見返してみたよ。') + ins.slice(0, 5).map((i) => `<p><b>${esc(i.title)}</b><br>${esc(i.text)}</p>`).join(''), chips: ['今週なにをすればいい？', '水やりは必要？'], actions: [{ label: '今日の記録を書く', record: true }] };
  }

  // --- 症状 ---
  const plant = findPlant(q, plants);
  const symptom = SYMPTOMS.find((s) => s.re.test(q));
  if (symptom) {
    const xs = [symptom.pest, symptom.also].filter(Boolean).map((id) => PESTS.find((x) => x.id === id));
    return { html: xs.map(pestHtml).join('') + p1('薬を使うときは、その植物に使えると書かれたものを、ラベルの通りに使ってね。'), chips: ['今週なにをすればいい？'], actions: [{ label: 'ノートに記録する', record: true }] };
  }
  if (/元気がない|しおれ|ぐったり|枯れそう|枯れてき|弱っ|黄色|黄ばん/.test(q)) {
    const wet = c && (humidityStress(c) >= 2 && north >= 6 && north <= 9);
    return {
      html: p1(`${plant ? `${esc(plant.ja)}が` : ''}元気がないんだね。まず、この順番で見てみて。`)
        + `<p>1. <b>土の湿り具合</b>：指を2〜3cm差して、乾いていたら朝にたっぷり水を。湿っているのにしおれるなら、根が傷んでいるかも（水のやりすぎ・水はけ不足）。<br>2. <b>株元</b>：黒く腐っていたり、白いカビがあれば病気のサイン。<br>3. <b>葉の裏と新芽</b>：小さな虫がいないか。<br>4. <b>植えた時期</b>：植えて間もない株は、根付くまで葉が黄色くなることがあるよ。</p>`
        + (wet ? p1('今は蒸し暑い季節だから、<b>蒸れ</b>が原因のことが多いよ。込み合った茎を透かして、風を通してあげてね。') : '')
        + (plant && plant.humid === 1 ? p1(`${esc(plant.groupJa)}は高温多湿が苦手な植物だよ。水はけのよい場所に植え替えるか、鉢で管理するのも手だよ。`) : ''),
      chips: ['葉に白い粉がついている', '葉が食べられている', '株元が黒く腐っている'], actions: [{ label: 'ノートに記録する', record: true }],
    };
  }
  if (/咲かない|花がつかない|花が少ない(?!月)/.test(q) && !/月/.test(q)) {
    return { html: p1('花が咲かないときは、こんな原因が多いよ。') + '<p>・<b>日当たり不足</b>：日向を好む植物は、半日以上の日差しが必要。<br>・<b>肥料のやりすぎ</b>：窒素が多いと葉ばかり茂るよ。<br>・<b>株が若い／込みすぎ</b>：植えて1年目は咲きにくい。逆に古株は株分けで若返らせよう。<br>・<b>切る時期</b>：花芽ができた後に切ると、その年は咲かないよ。</p>', chips: ['株分けの時期は？', '肥料はいつあげる？'] };
  }
  if (/倒れ/.test(q)) return { html: p1('倒れやすいときは、①初夏（5月末〜6月）に茎を半分ほど切る「摘心」、②早めの支柱、③肥料と水を控えめにして締まった株に育てる、の3つが効くよ。背の高いグラスや丈夫な植物を隣に植えて、支え合わせるのもいい方法だよ。'), chips: ['今週なにをすればいい？'] };

  // --- 特定の植物について ---
  if (plant) {
    const d = describe(plant);
    const ev = c ? evaluate(plant, c) : null;
    const inGarden = plants.some((x) => x.id === plant.id);
    const head = `<p><b>${esc(plant.ja)}</b>${inGarden ? `（${esc(gname)}に植えているね）` : ''}${ev?.level ? `　この地域では <b>${LEVEL[ev.level].mark} ${LEVEL[ev.level].label}</b> だよ。` : ''}</p>`;
    const actions = [{ label: '図鑑で見る', find: plant.groupJa }];
    if (/切り戻|剪定|切る|刈|摘心/.test(q)) return { html: head + p1(esc(d[2].t)), actions, chips: [`${strip(plant.groupJa)}の病気や虫は？`] };
    if (/株分け|ふやし|増やし/.test(q)) return { html: head + p1(esc(d[2].t)) + (plant.uses?.includes('seed') ? p1('種でもふやせるよ。花がらを残して、茶色く乾いたら採ろう。') : ''), actions, chips: [] };
    if (/病気|虫|害虫/.test(q)) {
      const ps = pestsForPlant(plant, c).slice(0, 3);
      return { html: head + (ps.length ? p1('気をつけたいのはこのあたりだよ。') + ps.map(({ pest }) => `<p><b>${esc(pest.ja)}</b>：${esc(pest.prevent[0])}。</p>`).join('') : p1('特に出やすい病害虫は登録されていないよ。丈夫な植物だね。')), actions, chips: [] };
    }
    if (/相性|合わせ|隣|一緒に|組み合わせ/.test(q)) return { html: head + p1(`一緒に植えると映えるのは、${companions(plant).map((x) => esc(x.groupJa)).join('、')} だよ。同じ環境で育って、花の形が違うものを選んでいるよ。`), actions, chips: [] };
    if (/いつ|時期|植え|種まき|まく/.test(q)) {
      const when = plant.type === 'annual' && c ? sowAdvice(plant, c) : plantingWindow(c, north);
      return { html: head + p1(esc(when) + '。') + p1(`花は${esc(bloomText(plant.bloom) || '—')}に咲くよ。`), actions, chips: [] };
    }
    if (/冬|寒さ|越冬|霜/.test(q)) return { html: head + p1(esc(d[1].t.split('。').filter((x) => /耐寒|寒|一年草/.test(x)).join('。') + '。')), actions, chips: [] };
    if (/夏|暑さ|蒸れ|梅雨/.test(q)) return { html: head + p1(plant.humid === 1 ? '高温多湿が苦手だよ。梅雨の前に半分ほど切り戻して、株元に風を通してあげてね。水はけのよい場所か、盛り土をした場所が安心。' : plant.humid === 3 ? '日本の蒸し暑い夏にも強いから、あまり心配いらないよ。' : 'ふつうの強さだよ。株が込み合ってきたら、梅雨の前に少し透かしてあげてね。'), actions, chips: [] };
    return {
      html: head + (ev?.reasons?.length ? p1(esc(ev.reasons.join('。')) + '。') : '') + p1(esc(d[1].t)) + p1(esc(d[2].t)),
      actions, chips: [`${strip(plant.groupJa)}と相性のよい植物は？`, `${strip(plant.groupJa)}の病気や虫は？`, `${strip(plant.groupJa)}の切り戻しは？`],
    };
  }

  // --- 水やり ---
  if (/水やり|水をあげ|水は/.test(q)) {
    const days = ctx.forecast;
    const rainSoon = days?.slice(0, 3).some((d) => d.rain >= 5);
    const hot = days?.slice(0, 3).some((d) => d.tmax >= 30);
    const last = lastEvent(ctx.entries || [], 'water');
    const recent = (ctx.entries || []).filter((e) => (e.events || []).includes('plant') && (now - new Date(e.date)) / 86400000 <= 30);
    let html = p1('根付いた宿根草は、基本的に雨まかせで大丈夫だよ。水やりが必要なのは、<b>植えて1か月以内の株</b>、<b>鉢植え</b>、<b>真夏に何日も雨がないとき</b>。');
    if (days) html += p1(rainSoon ? 'この先3日のうちに雨の予報があるから、庭植えは水やりしなくて大丈夫そう。' : hot ? '暑くて雨のない日が続く予報だよ。植えたばかりの株と鉢植えは、朝のうちにたっぷりあげてね。' : 'しばらく雨の予報はないよ。土の表面が乾いていたら、植えたばかりの株にだけ水をあげよう。');
    if (recent.length) html += p1(`ノートによると、最近植え付けた株があるね。その株は土が乾いたら忘れずに。`);
    if (last) html += p1(`最後に水やりを記録したのは ${esc(last.slice(5).replace('-', '/'))} だよ。`);
    return { html, chips: ['今週なにをすればいい？'], actions: [{ label: '水やりを記録する', record: true }] };
  }

  // --- 今日・今週・今月すること ---
  if (/今日|今週|今月|何をすれば|なにをすれば|やること|作業/.test(q)) {
    if (!c) return needLoc();
    const tasks = [...buildTasks(c, plants), ...pestTasks(c, plants)].filter((t) => t.month === month).slice(0, 4);
    const adv = ctx.forecast ? weatherAdvice(ctx.forecast, north).filter((a) => a.level >= 2).slice(0, 2) : [];
    const ins = insights(ctx.entries || [], now, (id) => PLANTS.find((p) => p.id === id)?.ja || '').filter((i) => i.type !== 'memory').slice(0, 2);
    let html = '';
    if (adv.length) html += p1('まず天気のことから。') + adv.map((a) => `<p><b>${esc(a.title)}</b>：${esc(a.text)}</p>`).join('');
    html += tasks.length ? p1(`${month}月の${esc(gname)}の作業はこれだよ。`) + tasks.map((t) => `<p>・<b>${esc(t.title)}</b>　${esc(t.detail)}</p>`).join('') : p1(`${month}月は、急ぎの作業はないよ。庭をゆっくり眺めて、気づいたことをノートに書いてみてね。`);
    if (ins.length) html += p1('ノートからのお知らせ：') + ins.map((i) => `<p>・<b>${esc(i.title)}</b>　${esc(i.text)}</p>`).join('');
    return { html, actions: [{ label: '作業暦を見る', go: 'tasks' }, { label: '今日の記録を書く', record: true }], chips: ['水やりは必要？', '花が少ない月は？'] };
  }

  // --- 花が少ない月 ---
  if (/花が少ない月|途切れ|咲いていない月|リレー/.test(q)) {
    if (!plants.length) return { html: p1('まだ庭に植物が登録されていないよ。プランを作るか、図鑑から集めてみよう。'), actions: [{ label: 'プランをつくる', go: 'plan' }], chips: [] };
    const { gaps } = bloomGaps(plants, c, !!c?.south);
    if (!gaps.length) return { html: p1(`${esc(gname)}は、春から晩秋まで途切れずに花が咲く組み合わせになっているよ。すてきだね！`), chips: ['おすすめの植物は？'] };
    return { html: p1(`${esc(gname)}で花がないのは <b>${gaps.map((g) => g.month + '月').join('・')}</b> だよ。`) + gaps.slice(0, 3).map((g) => `<p>${g.month}月に咲くおすすめ：${g.suggestions.map((s) => esc(s.plant.groupJa)).join('、') || '—'}</p>`).join(''), actions: [{ label: 'マイ庭で追加する', go: 'garden' }], chips: [] };
  }

  // --- おすすめ ---
  if (/おすすめ|何を植え|なにを植え|向いている|合う植物|初心者/.test(q)) {
    if (!c) return needLoc();
    const g = ctx.garden || {};
    const have = new Set(plants.map((p) => p.group));
    const list = findPlants(c, { sun: g.sun || '', moist: g.moist || '', tag: /初心者|簡単|丈夫/.test(q) ? 'easy' : /日陰/.test(q) ? 'shade' : '' })
      .filter((r) => r.level === 3 && !have.has(r.plant.group) && r.plant.type !== 'annual');
    const seen = new Set();
    const pick = [];
    // 花の月がばらけるように選ぶ
    for (const m of [4, 6, 8, 10, 5, 7, 9]) {
      const r = list.find((x) => x.plant.bloom.includes(m) && !seen.has(x.plant.group) && x.plant.tags.includes('easy'));
      if (r) { seen.add(r.plant.group); pick.push(PLANTS.find((x) => x.group === r.plant.group && evaluate(x, c).level === 3) || r.plant); }
      if (pick.length >= 5) break;
    }
    return {
      html: p1(`この地域${g.sun ? `で、${{ full: '日向', part: '半日陰', shade: '日陰' }[g.sun]}の${esc(gname)}` : ''}に合う、丈夫な植物を選んだよ。花の時期がばらけるようにしてあるんだ。`) + pick.map((p) => `<p>・<b>${esc(p.ja)}</b>（${esc(bloomText(p.bloom))}）　${esc(p.note)}</p>`).join(''),
      actions: [{ label: '図鑑で探す', go: 'plants' }, { label: 'プランをつくる', go: 'plan' }], chips: pick.slice(0, 2).map((p) => `${strip(p.groupJa)}について教えて`),
    };
  }

  // --- 一般的な話題 ---
  if (/肥料|追肥|元肥/.test(q)) return { html: p1('宿根草は肥料が少なめのほうが、締まった丈夫な株になるよ。') + p1('・<b>春の芽出しの頃</b>に、緩効性の肥料を少し。<br>・<b>花の後</b>にお礼肥を少し（返り咲く植物に）。<br>・乾燥地の植物（ラベンダー、セダムなど）やグラスには、ほとんど不要。<br>・真夏と冬は与えないでね。'), chips: ['水やりは必要？'] };
  if (/植え付け|植える時期|いつ植え/.test(q)) return c ? { html: p1(esc(plantingWindow(c, north)) + '。') + p1('植える穴は根鉢の2倍、深植えしないこと。植えたらたっぷり水をあげて、2〜3週間は土が乾いたら水やりを。'), chips: ['おすすめの植物は？'] } : needLoc();
  if (/株分け/.test(q)) return { html: p1('株分けは、<b>春の芽出しの頃</b>か<b>秋</b>が基本だよ。春咲きの植物は秋に、夏〜秋咲きの植物は春に分けると、花を休ませずにすむんだ。3〜4年たって株の中心が枯れてきたら、分けどきのサイン。'), chips: [] };
  if (/種まき|種をまく/.test(q)) return { html: p1('涼しい季節に育つ一年草（オルレア、ニゲラなど）は、暖かい地域なら<b>秋まき</b>、寒い地域なら<b>春まき</b>。夏の花（コスモス、ジニアなど）は<b>遅霜が終わってから</b>まくよ。北米原産の宿根草の種は、冬の寒さに当てると芽が出やすくなるんだ。'), chips: [] };
  if (/霜|冬越し|防寒|寒さ/.test(q)) return c ? { html: p1(c.frostFree ? 'この地域は、霜がほとんど降りないよ。' : `この地域の初霜は${formatDoy(c.firstFrost)}頃、最後の霜は${formatDoy(c.lastFrost)}頃が目安だよ。`) + p1('寒さに弱い植物は、初霜の前に株元を腐葉土やバークで覆ってあげてね。枯れた茎は冬の間そのまま残すと、株を守ってくれるし、ぼくら鳥のごはんにもなるんだ。'), chips: [] } : needLoc();
  if (/夏越し|蒸れ|梅雨|暑さ/.test(q)) return { html: p1('夏の蒸れ対策は、①梅雨入り前に込み合った株を半分ほど切り戻す、②株元の枯れ葉を取る、③水やりは朝に株元へ、④水はけのよい場所や盛り土に植える、の4つだよ。'), chips: [] };
  if (/土|水はけ|土づくり/.test(q)) return { html: p1('深さ30cmの穴に水を入れて、翌日までに抜ければ水はけは合格。抜けないなら、腐葉土や軽石を混ぜて、花壇を10〜20cm高く盛ろう。植え付けの2週間前までに、腐葉土や堆肥を土の2〜3割混ぜておくといいよ。'), chips: [] };
  if (/マルチ/.test(q)) return { html: p1('マルチングは、株元を避けてバークチップや腐葉土を3〜5cm敷くこと。乾燥・雑草・冬の寒さを防いでくれるよ。乾燥地の植物には砂利がおすすめ。'), chips: [] };
  if (/雑草|草取り/.test(q)) return { html: p1('雑草は小さいうちに、雨上がりの柔らかい土のときに抜くのが楽だよ。株間を詰めて植えたり、マルチを敷いたりして土を見せないようにすると、生えにくくなるよ。'), chips: [] };
  if (/日陰|シェード/.test(q)) return { html: p1('日陰でも楽しめる植物はたくさんあるよ。ギボウシ、クリスマスローズ、シダ、アスチルベ、ヒューケラなど。葉の色や形の違いを組み合わせるのがコツだよ。'), actions: [{ label: '日陰の植物を図鑑で見る', go: 'plants' }], chips: [] };
  if (/使い方|どうやって|何ができる/.test(q)) return { html: p1('「プラン」で言葉から庭の案を作って、「マイ庭」に反映。「作業暦」で毎月の手入れを確認して、「＋記録」でノートをつけていくのがおすすめの使い方だよ。'), chips: STARTERS.slice(0, 3) };

  return { html: p1('ごめんね、その質問にはまだうまく答えられないや。植物の名前を入れて聞くか、下の話題から選んでみてね。'), chips: STARTERS };
}

function plantingWindow(c, north) {
  if (!c) return '植え付けは春（3〜5月）か秋（9〜11月）が適期だよ';
  const L = (m) => localMonth(m, c.south);
  if (c.frostFree) return `この地域は霜がほとんどないから、秋（${L(10)}〜${L(11)}月）と春（${L(3)}〜${L(4)}月）のどちらでも植えられるよ。秋植えだと冬の間に根が張るからおすすめ`;
  if (c.zone.value <= 6.5) return `寒い地域だから、春は${formatDoy(c.lastFrostSafe ?? c.lastFrost)}以降、秋は${L(9)}月中に植えて、冬までに根を張らせよう`;
  return `いちばんのおすすめは秋（${L(9)}月下旬〜${L(11)}月上旬）。春なら${formatDoy(c.lastFrostSafe ?? c.lastFrost)}以降、暑くなる前の${L(5)}月までに`;
}
