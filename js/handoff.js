// 無料のAIチャットへの相談：庭の情報を含めた「相談文」を作り、利用者が自分でAIアプリに貼り付ける。
// このアプリからAIのサービスに接続することはなく、APIキーも課金の仕組みも持たない。
import { PLANTS, COLORS } from './plants.js';
import { TYPE_JA } from './meta.js';
import { evaluate, buildTasks, localMonth, LEVEL } from './garden.js';
import { pestsForPlant, pestTasks, regionRisks } from './pests.js';
import { describe, bloomText } from './describe.js';
import { formatDoy } from './climate.js';
import { weatherAdvice } from './weather.js';
import { EVENTS } from './diary.js';
import { findPlant } from './chat.js';

/**
 * 無料プランのあるAIチャット（開くだけ。このアプリからは何も送信しない）
 * q: 相談文を入れた状態で開くためのURLパラメータ。スマホにアプリが入っていれば、リンクからアプリが開く（ユニバーサルリンク）。
 */
export const AI_APPS = [
  { name: 'Claude', url: 'https://claude.ai/new', q: 'q' },
  { name: 'ChatGPT', url: 'https://chatgpt.com/', q: 'q' },
  { name: 'Gemini', url: 'https://gemini.google.com/app' },
];
/** URLに入れられる長さの上限（長すぎると開けないことがあるため。超えたら貼り付けてもらう） */
export const PREFILL_MAX = 12000;

/** URLに入る長さに収める（後ろの行から省き、省いたことを書き添える） */
export function fitForUrl(text, max = PREFILL_MAX) {
  if (encodeURIComponent(text).length <= max) return text;
  const note = '\n（長いため一部を省略しました）';
  const lines = text.split('\n');
  while (lines.length > 1 && encodeURIComponent(lines.join('\n') + note).length > max) lines.pop();
  let out = lines.join('\n');
  while (out && encodeURIComponent(out + note).length > max) out = out.slice(0, -20);
  return out + note;
}

/** URL用に短くした相談文（天気・ノートを減らし、図鑑データは残す） */
export function consultPromptShort(question, ctx) {
  return consultPrompt(question, { ...ctx, forecast: (ctx.forecast || []).slice(0, 3), entries: (ctx.entries || []).slice(0, 3) });
}

/** 相談文を入れた状態で開くリンク（対応していないアプリや長すぎる文は、そのまま開く） */
export function aiLink(app, text = '') {
  if (!app.q || !text) return app.url;
  return `${app.url}?${app.q}=${encodeURIComponent(fitForUrl(text))}`;
}

const SUN = { full: '日向', part: '半日陰', shade: '日陰' };
const MOIST = { dry: '乾きぎみ', mid: '普通', wet: '湿りぎみ' };

/** 庭の情報（気候・庭・植物・天気・ノート）を文章にまとめる */
export function gardenContext(ctx) {
  const c = ctx.climate;
  const now = ctx.now || new Date();
  const month = now.getMonth() + 1;
  const lines = [`・今日：${now.getFullYear()}年${month}月${now.getDate()}日`];
  if (c) {
    lines.push(`・場所：${ctx.locName || '日本'}（耐寒性ゾーン ${c.zone.label}、年最低気温の平均 ${c.avgMinTemp}℃、30℃以上の日が年${Math.round(c.hotDays)}日、熱帯夜 年${Math.round(c.tropicalNights)}日、`
      + (c.frostFree ? '霜はほぼ降りない' : `最後の霜 ${formatDoy(c.lastFrost)}頃・初霜 ${formatDoy(c.firstFrost)}頃`)
      + `、年間降水量 約${c.annualPrecip}mm、年間降雪 約${c.annualSnow}cm）`);
    const risks = regionRisks(c).slice(0, 5).map((r) => r.pest.ja);
    if (risks.length) lines.push(`・この地域で起きやすいトラブル：${risks.join('、')}`);
  }
  const g = ctx.garden;
  const plants = ctx.plants || [];
  if (g) {
    lines.push(`・庭：「${g.name}」（約${g.area}㎡、日当たり ${SUN[g.sun] || '未設定'}、土 ${MOIST[g.moist] || '未設定'}${g.memo ? `、${g.memo}` : ''}）`);
    if (plants.length) {
      lines.push('・植えている（植える予定の）植物：' + plants.map((p) => `${p.ja}［${bloomText(p.bloom) || '花なし'}・高さ${p.h[1]}cm${g.have?.[p.id] ? '' : '・これから植える'}］`).join('、'));
      if (c) {
        const tasks = [...buildTasks(c, plants), ...pestTasks(c, plants)].filter((t) => t.month === month).slice(0, 5);
        if (tasks.length) lines.push(`・${month}月の作業の目安：${tasks.map((t) => t.title).join('、')}`);
      }
    }
  }
  if (ctx.forecast?.length) {
    lines.push('・今週の天気予報：' + ctx.forecast.map((d) => `${d.date.slice(5).replace('-', '/')} ${Math.round(d.tmax)}/${Math.round(d.tmin)}℃${d.rain >= 1 ? ` 雨${Math.round(d.rain)}mm` : ''}`).join('、'));
    const adv = weatherAdvice(ctx.forecast, c ? localMonth(month, c.south) : month).filter((a) => a.level >= 2).map((a) => a.title);
    if (adv.length) lines.push(`・天気の注意：${adv.join('、')}`);
  }
  const entries = ctx.entries || [];
  if (entries.length) {
    const nameOf = (id) => PLANTS.find((p) => p.id === id)?.ja || '不明な植物';
    const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12)
      .map((e) => `  ${e.date} ${e.plants?.length ? e.plants.map(nameOf).join('・') : '庭全体'}：${(e.events || []).map((x) => EVENTS[x]?.ja).filter(Boolean).join('・')}${e.text ? `「${e.text.slice(0, 60)}」` : ''}`);
    lines.push(`・園芸ノートの最近の記録：\n${recent.join('\n')}`);
  }
  return lines.join('\n');
}

/** 質問に出てくる植物の、図鑑のデータ（AIが正確に答えられるように添える） */
function plantFacts(question, ctx) {
  const p = findPlant(question, ctx.plants || []);
  if (!p) return '';
  const d = describe(p);
  const ev = ctx.climate ? evaluate(p, ctx.climate) : null;
  const pests = pestsForPlant(p, ctx.climate).slice(0, 3).map(({ pest }) => pest.ja);
  return `\n# 質問に出てくる植物の図鑑データ\n・${p.ja}（${p.latin}、${p.family.ja}、${TYPE_JA[p.type]}）\n・草丈 ${p.h[0]}〜${p.h[1]}cm、開花 ${bloomText(p.bloom) || 'なし'}、花色 ${p.color.map((c) => COLORS[c].ja).join('・')}\n`
    + (ev?.level ? `・この地域での適性：${LEVEL[ev.level].mark} ${LEVEL[ev.level].label}（${ev.reasons.join('。')}）\n` : '')
    + `・育て方：${d[1].t}\n・手入れ：${d[2].t}\n${pests.length ? `・注意したい病害虫：${pests.join('、')}\n` : ''}`;
}

/** AIチャットに貼り付ける相談文 */
export function consultPrompt(question, ctx) {
  return `あなたは日本の家庭園芸にくわしいアドバイザーです。下の「私の庭の情報」をふまえて、質問に答えてください。
園芸の初心者にもわかるように、結論を先に、具体的な手順や時期を添えて、やさしい日本語で答えてください。
わからないことは推測で断定せず、確かめる方法を教えてください。

# 質問
${question.trim()}

# 私の庭の情報
${gardenContext(ctx)}
${plantFacts(question, ctx)}`;
}

/** 画像から庭を読み取ってもらうための依頼文（答えを、このアプリが読み込める形で返してもらう） */
export function imagePrompt(note, ctx) {
  const c = ctx.climate;
  return `添付した画像は、私の家と庭の画像です（航空写真・図面・見取り図・庭の写真のいずれか）。
この画像から、草花を植えられそうな場所を1〜5か所読み取ってください。

建物・塀・樹木の位置と方角から、それぞれの場所の日当たりを推定してください（日本では、建物の北側は日陰、南側は日向、東側や西側は半日陰になりやすい）。
広さは、画像の縮尺・車・ドア・駐車スペースなどを手がかりに、控えめに見積もってください。

${c ? `場所：${ctx.locName || '日本'}（耐寒性ゾーン ${c.zone.label}）\n` : ''}補足：${note?.trim() || 'なし'}

まず、読み取った内容を日本語で簡単に説明してください。
そのあと最後に、次の形式のデータを「コードブロック」で1つだけ出力してください（庭づくりアプリに貼り付けて使います）。

\`\`\`json
{
  "summary": "敷地全体の様子を2〜3文で",
  "north": "方角をどう判断したか",
  "beds": [
    {
      "name": "場所の呼び名（例：南側の花壇）",
      "width_m": 4.0,
      "depth_m": 1.2,
      "sun": "full か part か shade（日向・半日陰・日陰）",
      "moist": "dry か mid か wet（乾きぎみ・普通・湿りぎみ）",
      "view": "border か island（片側から眺める・四方から眺める）",
      "keywords": "合いそうな雰囲気（例：ナチュラル、蝶が来る、手間いらず）",
      "reason": "そう判断した理由を1〜2文で"
    }
  ],
  "cautions": ["画像からは判断できず、現地で確かめてほしい点"]
}
\`\`\``;
}

const num = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n * 10) / 10)) : d; };
const pick = (v, list, d) => { const s = String(v ?? '').toLowerCase(); return list.find((x) => s.includes(x)) || d; };
const str = (v, max) => String(v ?? '').replace(/[<>]/g, '').slice(0, max);

/**
 * AIの答え（貼り付けられた文章）から、場所のデータを取り出す。
 * 形式が多少くずれていても読めるようにし、値は安全な範囲に丸める。
 */
export function parseBedsReply(text) {
  if (!text || !text.trim()) return { error: 'AIの答えを貼り付けてください。' };
  const t = text.replace(/[“”]/g, '"');
  const cands = [];
  const fence = /```(?:json)?\s*([\s\S]*?)```/g;
  let m;
  while ((m = fence.exec(t))) cands.push(m[1]);
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) cands.push(t.slice(a, b + 1));
  let data = null;
  for (const cnd of cands) {
    try { const j = JSON.parse(cnd.trim()); if (j && Array.isArray(j.beds)) { data = j; break; } } catch { /* 次の候補へ */ }
  }
  if (!data) return { error: 'データの部分を読み取れませんでした。AIの答えを、最後のコードブロックまで全部コピーして貼り付けてください。' };
  const beds = data.beds.slice(0, 5).map((x, i) => ({
    name: str(x?.name, 40) || `場所${i + 1}`,
    width_m: num(x?.width_m, 0.5, 30, 3),
    depth_m: num(x?.depth_m, 0.4, 10, 1.2),
    sun: pick(x?.sun, ['full', 'part', 'shade'], 'full'),
    moist: pick(x?.moist, ['dry', 'mid', 'wet'], 'mid'),
    view: pick(x?.view, ['border', 'island'], 'border'),
    keywords: str(x?.keywords, 80),
    reason: str(x?.reason, 300),
  }));
  if (!beds.length) return { error: '植えられる場所が見つかりませんでした。別の画像や、補足を足して試してみてください。' };
  return { result: { summary: str(data.summary, 500), north: str(data.north, 200), beds, cautions: (Array.isArray(data.cautions) ? data.cautions : []).slice(0, 8).map((x) => str(x, 200)) } };
}
