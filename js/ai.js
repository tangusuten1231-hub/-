// ツピの「本物のAI」：Anthropic 公式 SDK で Claude に質問する。
// APIキーは利用者が自分で取得し、この端末のブラウザ内にだけ保存する（バックアップには含めない）。
import { PLANTS, COLORS, TAGS } from './plants.js';
import { TYPE_JA } from './meta.js';
import { evaluate, findPlants, buildTasks, localMonth, LEVEL } from './garden.js';
import { pestsForPlant, pestTasks, regionRisks } from './pests.js';
import { describe, companions, bloomText } from './describe.js';
import { formatDoy } from './climate.js';
import { weatherAdvice } from './weather.js';
import { insights, EVENTS } from './diary.js';
import { findPlant } from './chat.js';

export const MODEL = 'claude-opus-5-5';
const KEY = 'pg:aikey';

export const getKey = () => { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } };
export function setKey(k) { try { if (k) localStorage.setItem(KEY, k.trim()); else localStorage.removeItem(KEY); } catch { /* 保存できない環境 */ } }
export const hasKey = () => !!getKey();

let sdkPromise = null;
/** SDK は使うときにだけ読み込む（約0.8MB） */
function loadSdk() {
  sdkPromise ||= import('./vendor/anthropic.js');
  return sdkPromise;
}
async function client() {
  const { Anthropic } = await loadSdk();
  // 個人利用の静的アプリのため、利用者自身のキーでブラウザから直接呼び出す
  return { Anthropic, api: new Anthropic({ apiKey: getKey(), dangerouslyAllowBrowser: true }) };
}

// ---------- ツピに渡す庭の情報 ----------
const strip = (s) => s.replace(/[（(].*?[）)]/g, '');

/** 変わらない部分（キャッシュ対象）：人格・ルール・図鑑の植物名一覧 */
export function stableSystem() {
  const groups = [...new Map(PLANTS.map((p) => [p.group, p])).values()];
  const byType = {};
  for (const p of groups) (byType[TYPE_JA[p.type] || 'その他'] ||= []).push(strip(p.groupJa));
  return `あなたは「ツピ」。庭づくりアプリの案内役をしているシジュウカラです。
利用者は日本で庭づくりを楽しむ個人で、園芸の初心者かもしれません。

# 話し方
- 一人称は「ぼく」。親しみやすい「〜だよ」「〜してね」という口調で、短く具体的に答える。
- まず結論、次に理由や手順。箇条書きは「・」を使い、見出しや表は使わない。太字は ** で囲んでよいが控えめに。
- 専門用語を使うときは、ひとこと説明を添える。
- 長くても300字程度を目安に。くわしく聞かれたら長くてよい。

# 答え方のルール
- 下の「利用者の庭の情報」と、ツールで調べた図鑑のデータを根拠にする。地域の気候（寒さ・暑さ・霜・蒸れ）に合わせて助言する。
- 植物の性質（草丈・花期・耐寒性など）を具体的に述べるときは、記憶に頼らずツールで図鑑を確認する。図鑑にない植物は、一般的な知識として答え、図鑑にないことを伝える。
- 薬用・食用の話では、体質や服薬で害になることがあると伝え、医師や薬剤師への相談をすすめる。有毒植物は必ず注意する。
- 農薬は商品名を挙げず、「その植物に使えると表示されたものをラベルの通りに」と伝える。
- 日本で栽培が禁止されている植物（特定外来生物、一部のケシなど）はすすめない。
- わからないことは、わからないと言う。庭と関係のない話題は、やさしく庭の話に戻す。

# 図鑑に載っている植物（${groups.length}種。品種はツールで確認できる）
${Object.entries(byType).map(([t, names]) => `【${t}】${names.join('、')}`).join('\n')}`;
}

/** 会話ごとに変わる部分：気候・庭・ノート・天気 */
export function gardenContext(ctx) {
  const c = ctx.climate;
  const now = ctx.now || new Date();
  const month = now.getMonth() + 1;
  const lines = [`今日は${now.getFullYear()}年${month}月${now.getDate()}日。`];
  if (c) {
    lines.push(`場所：${ctx.locName || '未設定'}。耐寒性ゾーン ${c.zone.label}（年最低気温の平均 ${c.avgMinTemp}℃）、暑さゾーン ${c.heatZone}（30℃以上が年${Math.round(c.hotDays)}日、熱帯夜${Math.round(c.tropicalNights)}日）。`
      + (c.frostFree ? '霜はほぼ降りない。' : `最後の霜は${formatDoy(c.lastFrost)}頃、初霜は${formatDoy(c.firstFrost)}頃。`)
      + `年間降水量 約${c.annualPrecip}mm、年間降雪 約${c.annualSnow}cm。`);
    const risks = regionRisks(c).slice(0, 6).map((r) => r.pest.ja);
    if (risks.length) lines.push(`この地域で起きやすいトラブル：${risks.join('、')}。`);
  } else lines.push('場所はまだ設定されていない（気候に合わせた助言ができないので、ホームで場所を設定するよう促す）。');

  const g = ctx.garden;
  const plants = ctx.plants || [];
  if (g) {
    const SUN = { full: '日向', part: '半日陰', shade: '日陰' }, MOIST = { dry: '乾きぎみ', mid: '普通', wet: '湿りぎみ' };
    lines.push(`いま選んでいる庭：「${g.name}」（${g.area}㎡、日当たり：${SUN[g.sun] || '未設定'}、土：${MOIST[g.moist] || '未設定'}${g.memo ? `、メモ：${g.memo}` : ''}）。`);
    if (plants.length) {
      lines.push('この庭の植物：' + plants.map((p) => {
        const lv = c ? evaluate(p, c).level : null;
        return `${p.ja}（${bloomText(p.bloom) || '花なし'}・${p.h[1]}cm${lv ? `・適性${LEVEL[lv].mark}` : ''}${g.have?.[p.id] ? '・植え付け済み' : '・これから植える'}）`;
      }).join('、') + '。');
      if (c) {
        const tasks = [...buildTasks(c, plants), ...pestTasks(c, plants)].filter((t) => t.month === month).slice(0, 6);
        if (tasks.length) lines.push(`${month}月の作業の目安：${tasks.map((t) => t.title).join('、')}。`);
      }
    } else lines.push('この庭には、まだ植物が登録されていない。');
  }
  if (ctx.otherGardens?.length) lines.push(`ほかの庭：${ctx.otherGardens.join('、')}。`);

  if (ctx.forecast?.length) {
    lines.push('今週の天気予報：' + ctx.forecast.map((d) => `${d.date.slice(5).replace('-', '/')} ${Math.round(d.tmax)}/${Math.round(d.tmin)}℃${d.rain >= 1 ? ` 雨${Math.round(d.rain)}mm` : ''}`).join('、') + '。');
    const adv = weatherAdvice(ctx.forecast, c ? localMonth(month, c.south) : month).filter((a) => a.level >= 2).map((a) => a.title);
    if (adv.length) lines.push(`天気の注意：${adv.join('、')}。`);
  }

  const entries = ctx.entries || [];
  if (entries.length) {
    const nameOf = (id) => PLANTS.find((p) => p.id === id)?.ja || '不明な植物';
    const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25).map((e) => `${e.date} ${e.plants?.length ? e.plants.map(nameOf).join('・') : '庭全体'}：${(e.events || []).map((x) => EVENTS[x]?.ja).filter(Boolean).join('・')}${e.text ? `「${e.text.slice(0, 80)}」` : ''}`);
    lines.push(`園芸ノートの最近の記録（新しい順、全${entries.length}件）：\n${recent.join('\n')}`);
    const ins = insights(entries, now, nameOf).slice(0, 5).map((i) => `${i.title}（${i.text}）`);
    if (ins.length) lines.push(`過去の記録からのお知らせ：${ins.join(' / ')}`);
  } else lines.push('園芸ノートの記録はまだない。');
  return `# 利用者の庭の情報\n${lines.join('\n')}`;
}

// ---------- 図鑑を調べるツール ----------
const TAG_KEYS = Object.keys(TAGS);
export const TOOLS = [
  {
    name: 'get_plants',
    description: '図鑑から、名前を指定して植物のくわしい情報（草丈・花期・花色・育て方・手入れ・病害虫・相性のよい植物・この地域での適性）を取得する。品種名でも種名でもよい。植物の性質を具体的に答える前に必ず使う。',
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: { names: { type: 'array', items: { type: 'string' }, description: '植物の名前（例：["エキナセア", "ホワイトスワン"]）。最大6つ。' } },
      required: ['names'],
      additionalProperties: false,
    },
  },
  {
    name: 'search_plants',
    description: '図鑑を条件で検索し、この地域で育てやすい順に候補を返す。おすすめの植物や、花の少ない月を埋める植物を探すときに使う。',
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: {
        sun: { type: 'string', enum: ['any', 'full', 'part', 'shade'], description: '日当たり。any=指定なし、full=日向、part=半日陰、shade=日陰' },
        bloom_month: { type: 'integer', description: '開花月（1〜12）。指定しないときは 0' },
        tag: { type: 'string', enum: ['any', ...TAG_KEYS], description: `雰囲気・用途。${TAG_KEYS.map((k) => `${k}=${TAGS[k]}`).join('、')}` },
        keyword: { type: 'string', description: '名前・科名などの検索語。なければ空文字' },
      },
      required: ['sun', 'bloom_month', 'tag', 'keyword'],
      additionalProperties: false,
    },
  },
];

function plantInfo(p, climate) {
  const d = describe(p);
  const ev = climate ? evaluate(p, climate) : null;
  return {
    名前: p.ja, 学名: p.latin, 科: p.family.ja, 種類: TYPE_JA[p.type],
    草丈cm: `${p.h[0]}〜${p.h[1]}`, 株間cm: p.spread, 開花: bloomText(p.bloom) || 'なし', 花色: p.color.map((c) => COLORS[c].ja).join('・'),
    この地域での適性: ev?.level ? `${LEVEL[ev.level].mark} ${LEVEL[ev.level].label}（${ev.reasons.join('。')}）` : '場所が未設定のため不明',
    特徴: `${p.note} ${d[0].t}`, 育て方: d[1].t, 手入れ: d[2].t, 使い方: d[3].t,
    注意したい病害虫: pestsForPlant(p, climate).slice(0, 3).map(({ pest }) => `${pest.ja}（予防：${pest.prevent[0]}）`),
    相性のよい植物: companions(p).map((q) => strip(q.groupJa)),
    同じ種のほかの品種: PLANTS.filter((q) => q.group === p.group && q.id !== p.id).map((q) => q.cv).filter(Boolean).slice(0, 12),
    豆知識: p.tips,
    価格の目安円: p.price,
  };
}

/** ツールの実行。入力は必ず検証する（ストリーミング時はサーバー側で検証されないため） */
export function runTool(name, input, ctx) {
  if (name === 'get_plants') {
    if (!input || !Array.isArray(input.names) || !input.names.every((n) => typeof n === 'string')) return { error: true, content: JSON.stringify({ INVALID_JSON: JSON.stringify(input ?? null) }) };
    const out = input.names.slice(0, 6).map((n) => {
      const p = findPlant(n, ctx.plants || []);
      return p ? plantInfo(p, ctx.climate) : { 名前: n, 結果: '図鑑に見つかりません' };
    });
    return { content: JSON.stringify(out) };
  }
  if (name === 'search_plants') {
    const ok = input && ['any', 'full', 'part', 'shade'].includes(input.sun) && Number.isInteger(input.bloom_month) && input.bloom_month >= 0 && input.bloom_month <= 12
      && (input.tag === 'any' || TAG_KEYS.includes(input.tag)) && typeof input.keyword === 'string';
    if (!ok) return { error: true, content: JSON.stringify({ INVALID_JSON: JSON.stringify(input ?? null) }) };
    const rs = findPlants(ctx.climate, { sun: input.sun === 'any' ? '' : input.sun, month: input.bloom_month || '', tag: input.tag === 'any' ? '' : input.tag, q: input.keyword })
      .filter((r) => r.level == null || r.level >= 2);
    const seen = new Set();
    const out = [];
    for (const r of rs) {
      if (seen.has(r.plant.group)) continue;
      seen.add(r.plant.group);
      const p = r.plant;
      out.push({ 名前: p.ja, 種類: TYPE_JA[p.type], 開花: bloomText(p.bloom) || 'なし', 草丈cm: p.h[1], 花色: p.color.map((c) => COLORS[c].ja).join('・'), 適性: r.level ? LEVEL[r.level].mark : '不明', ひとこと: p.note });
      if (out.length >= 14) break;
    }
    return { content: JSON.stringify({ 件数: seen.size, 候補: out }) };
  }
  return { error: true, content: `不明なツール: ${name}` };
}

/** SDK の例外を、利用者向けの日本語にする */
function explain(err, Anthropic) {
  if (err instanceof Anthropic.AuthenticationError) return 'APIキーが正しくないようです。「データ」タブのAI設定で、キーを確認してください。';
  if (err instanceof Anthropic.PermissionDeniedError) return 'このAPIキーでは利用が許可されていません。Anthropic Console で権限や支払い設定を確認してください。';
  if (err instanceof Anthropic.RateLimitError) return '利用が集中しているか、上限に達しました。少し待ってからもう一度お試しください。';
  if (err instanceof Anthropic.BadRequestError) return `リクエストが受け付けられませんでした（${err.message}）。残高不足の可能性もあります。`;
  if (err instanceof Anthropic.APIConnectionError) return 'AIに接続できませんでした。通信環境を確認してください。';
  if (err instanceof Anthropic.APIError) return `AIのサーバーでエラーが起きました（${err.status ?? ''}）。しばらくしてからお試しください。`;
  return `うまくいきませんでした（${err?.message || '不明なエラー'}）。`;
}

/**
 * ツピ（AI）に質問する。messages は会話履歴（この関数が追記する）。
 * onText: 文章が届くたびに呼ばれる。戻り値: { text, usage } / 失敗時は { error }
 */
export async function askAI(messages, userText, ctx, onText = () => {}) {
  const { Anthropic, api } = await client();
  messages.push({ role: 'user', content: userText });
  const system = [
    { type: 'text', text: stableSystem(), cache_control: { type: 'ephemeral' } }, // ここまでをキャッシュ
    { type: 'text', text: gardenContext(ctx) },
  ];
  let text = '';
  let jsonRetries = 0;
  const usage = { input: 0, output: 0, cacheRead: 0 };
  try {
    for (let turn = 0; turn < 6; turn++) {
      const stream = api.beta.messages.stream({
        model: MODEL,
        max_tokens: 64000,
        system,
        tools: TOOLS,
        messages,
        output_config: { effort: 'low' }, // 会話なので軽め（Opus 5.5 は思考が常時オン。深さは effort で調整）
        // 安全上の理由で応答が断られたとき、別のモデルで自動的に再実行する
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      });
      stream.on('text', (delta) => { text += delta; onText(text); });
      let message;
      try {
        message = await stream.finalMessage();
        jsonRetries = 0;
      } catch (err) {
        // ツール入力が壊れていた場合だけやり直す。APIのエラーはそのまま外へ
        if (err instanceof Anthropic.APIError || jsonRetries++ >= 2) throw err;
        continue;
      }
      usage.input += message.usage.input_tokens; usage.output += message.usage.output_tokens; usage.cacheRead += message.usage.cache_read_input_tokens || 0;

      if (message.stop_reason === 'refusal') {
        messages.pop(); // この質問は履歴に残さない
        return { error: 'ごめんね、その質問には答えられないんだ。庭や植物のことなら何でも聞いてね。' };
      }
      messages.push({ role: 'assistant', content: message.content }); // 思考ブロックも含めてそのまま戻す
      if (message.stop_reason === 'pause_turn') continue;
      const toolUses = message.content.filter((b) => b.type === 'tool_use');
      if (!toolUses.length || message.stop_reason === 'end_turn') return { text, usage };
      if (message.stop_reason === 'max_tokens') return { text, usage, error: '答えが長くなりすぎて途中で止まりました。' };

      // ツールの結果は、1つのユーザーメッセージにまとめて返す
      messages.push({
        role: 'user',
        content: toolUses.map((t) => {
          const r = runTool(t.name, t.input, ctx);
          return { type: 'tool_result', tool_use_id: t.id, content: r.content, ...(r.error ? { is_error: true } : {}) };
        }),
      });
      if (text) { text += '\n\n'; onText(text); }
    }
    return { text, usage };
  } catch (err) {
    // 失敗した質問は履歴から外す（次の質問で壊れた履歴を送らないため）
    while (messages.length && !(messages[messages.length - 1].role === 'user' && messages[messages.length - 1].content === userText)) messages.pop();
    messages.pop();
    return { error: explain(err, Anthropic) };
  }
}

/**
 * 衛星写真や図面の画像から、植栽できそうな場所を読み取る（構造化出力）
 * @param image { mediaType, data(base64) }
 */
export async function analyzeGardenImage(image, note, ctx) {
  const { Anthropic, api } = await client();
  const { z, betaZodOutputFormat } = await loadSdk();
  const Bed = z.object({
    name: z.string().describe('場所の呼び名（例：南側の花壇、玄関アプローチ沿い）'),
    width_m: z.number().describe('幅の推定（m）'),
    depth_m: z.number().describe('奥行きの推定（m）'),
    sun: z.enum(['full', 'part', 'shade']).describe('日当たりの推定。full=日向、part=半日陰、shade=日陰'),
    moist: z.enum(['dry', 'mid', 'wet']).describe('土の湿り気の推定'),
    view: z.enum(['border', 'island']).describe('border=片側から眺める、island=四方から眺める'),
    keywords: z.string().describe('この場所に合う植栽イメージの言葉（例：「ナチュラル、蝶が来る、手間いらず」）。日本語で短く'),
    reason: z.string().describe('日当たりや広さをそう判断した理由と、この場所の植栽の考え方。2〜3文'),
  });
  const Result = z.object({
    summary: z.string().describe('画像から読み取れた敷地全体の様子。3〜4文'),
    north: z.string().describe('方角をどう判断したか。判断できない場合はその旨'),
    beds: z.array(Bed).describe('植栽できそうな場所。1〜5か所'),
    cautions: z.array(z.string()).describe('画像からは判断できない点、現地で確かめてほしい点'),
  });
  const c = ctx.climate;
  try {
    const message = await api.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: 'medium', format: betaZodOutputFormat(Result) },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: 'あなたは日本の個人庭を手がける植栽デザイナーです。利用者が送る画像（衛星写真・航空写真のスクリーンショット、家と庭の図面、手描きの見取り図、庭の写真のいずれか）から、植栽できそうな場所を読み取ります。建物・塀・樹木の位置と方角から、各場所の日当たりを推定してください（日本では建物の北側は日陰、南側は日向、東側は午前だけ日が当たる半日陰になりやすい）。寸法は画像内の縮尺・車・ドア・駐車スペースなどを手がかりに控えめに見積もり、不確かな点は cautions に正直に書いてください。すべて日本語で答えます。',
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.data } },
          { type: 'text', text: `この画像から、宿根草などを植えられそうな場所を読み取ってください。\n${c ? `場所：${ctx.locName || ''}（北半球・耐寒性ゾーン${c.zone.label}、暑さゾーン${c.heatZone}）。` : ''}\n利用者からの補足：${note || 'なし'}` },
        ],
      }],
    });
    if (message.stop_reason === 'refusal') return { error: 'この画像は読み取れませんでした。別の画像でお試しください。' };
    if (!message.parsed_output) return { error: '画像の読み取り結果を解釈できませんでした。もう一度お試しください。' };
    return { result: message.parsed_output };
  } catch (err) {
    return { error: explain(err, Anthropic) };
  }
}

/** AIの文章を安全にHTMLへ（**太字** と改行・箇条書きだけ対応） */
export function mdToHtml(text) {
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  return esc(text).trim().split(/\n{2,}/).map((para) => `<p>${para.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^#+\s*/gm, '').replace(/^[-*]\s+/gm, '・').replace(/\n/g, '<br>')}</p>`).join('');
}
