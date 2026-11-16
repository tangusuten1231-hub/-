// 庭仕事の計算機（苗の数・土・堆肥・鉢の土・肥料・マルチ）と、作業暦のカレンダー書き出し（.ics）、水やりの判断

/** 苗の数：面積（㎡）と株間（cm）。千鳥植え（三角形の格子）とます目植え */
export function seedlings(area, spacingCm) {
  const s = spacingCm / 100;
  if (!(area > 0 && s > 0)) return { tri: 0, square: 0 };
  return { tri: Math.ceil(area / (s * s * 0.866)), square: Math.ceil(area / (s * s)) };
}
/** 花壇の土づくり：耕す深さ（cm）の土の量と、混ぜる堆肥・腐葉土（体積の25%） */
export function bedSoil(area, depthCm = 30, ratio = 0.25) {
  const soil = area * (depthCm / 100) * 1000;
  return { soil: Math.round(soil), compost: Math.round(soil * ratio), bags40: Math.ceil((soil * ratio) / 40) };
}
/** 鉢の容量（L）：号数（直径3cm刻み）から、標準的な鉢のおおよその容量 */
export const potLiters = (gou) => Math.round(0.0105 * gou ** 3 * 10) / 10;
export function potSoil(gou, n = 1) {
  const l = potLiters(gou) * n;
  return { liters: Math.round(l * 10) / 10, bags14: Math.ceil(l / 14), stone: Math.round(l * 0.1 * 10) / 10 };
}
/** 肥料の目安：地植え（緩効性化成肥料 g/㎡）と鉢（置き肥 g/鉢） */
export function fertilizer(area = 0, gou = 0, n = 1) {
  return {
    base: Math.round(area * 80), // 植え付け時の元肥（80g/㎡）
    top: Math.round(area * 30), // 春の追肥（30g/㎡）
    pot: gou ? Math.round(gou * 1.2 * n) : 0, // 置き肥（号数×約1.2g）
  };
}
/** 液体肥料：水の量（L）と倍率から原液の量（mL） */
export const liquid = (waterL, times = 1000) => Math.round(((waterL * 1000) / times) * 10) / 10;
/** マルチング：面積と厚さ（cm）から必要な量（L）と40L袋の数 */
export function mulch(area, cm = 5) {
  const l = area * (cm / 100) * 1000;
  return { liters: Math.round(l), bags40: Math.ceil(l / 40) };
}

// ---------- カレンダー書き出し ----------
const pad = (n) => String(n).padStart(2, '0');
const icsText = (s) => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
/** 長い行は75オクテットで折り返す（RFC 5545） */
function fold(line) {
  const out = [];
  let cur = '', bytes = 0;
  for (const ch of line) {
    const b = new TextEncoder().encode(ch).length;
    if (bytes + b > 73) { out.push(cur); cur = ' ' + ch; bytes = 1 + b; } else { cur += ch; bytes += b; }
  }
  out.push(cur);
  return out.join('\r\n');
}
/** その月の最初の土曜日 */
export function firstSaturday(y, m) {
  const d = new Date(y, m - 1, 1);
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  return d;
}
/**
 * 作業を iCalendar（.ics）にする。events: [{ date: Date, title, detail }]。終日の予定で、当日の朝9時に通知
 */
export function toICS(events, name = '庭づくりアプリの作業暦') {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//garden-nav//JA', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${icsText(name)}`];
  events.forEach((e, i) => {
    const d = e.date, n = new Date(d); n.setDate(n.getDate() + 1);
    const ymd = (x) => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}`;
    lines.push('BEGIN:VEVENT', `UID:${ymd(d)}-${i}-${Math.abs(hashStr(e.title))}@garden-nav`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(d)}`, `DTEND;VALUE=DATE:${ymd(n)}`,
      fold(`SUMMARY:${icsText('🌿 ' + e.title)}`), fold(`DESCRIPTION:${icsText(e.detail || '')}`),
      'BEGIN:VALARM', 'ACTION:DISPLAY', fold(`DESCRIPTION:${icsText(e.title)}`), 'TRIGGER:PT9H', 'END:VALARM', 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
function hashStr(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }

// ---------- 水やりの判断 ----------
/**
 * 今日の水やり。days: 予報（過去の日は past: true）。opts: { pot, month(北半球), young: 植えて1か月以内か }
 * 戻り値 { need: 'none'|'check'|'yes'|'twice', title, text }
 */
export function waterAdvice(days, opts = {}) {
  const today = days.find((d) => !d.past) || days[0];
  if (!today) return null;
  const past = days.filter((d) => d.past);
  const recent = past.slice(-2).reduce((t, d) => t + (d.rain || 0), 0);
  const todayRain = (today.rain || 0) >= 3 && (today.pop ?? 70) >= 60 ? today.rain : 0;
  const wet = recent + todayRain;
  const t = today.tmax;
  const winter = [12, 1, 2].includes(opts.month);
  let dryDays = 0;
  for (let i = past.length - 1; i >= 0 && (past[i].rain || 0) < 1; i--) dryDays++;
  if (opts.pot) {
    if (wet >= 8 && t < 28) return { need: 'none', title: '鉢植え：今日は水やりなしでOK', text: `最近の雨（約${Math.round(wet)}mm）で鉢の土も湿っています。軒下の鉢だけ、土を触って確かめて。` };
    if (t >= 30) return { need: 'twice', title: '鉢植え：朝と夕方の2回', text: `最高${Math.round(t)}℃の予想。朝たっぷり、夕方に土が乾いていればもう一度。昼の水やりは根を傷めるので避けて。` };
    if (t >= 22) return { need: 'yes', title: '鉢植え：朝に1回たっぷり', text: '鉢底から流れ出るまで、朝のうちに。受け皿の水は捨てましょう。' };
    if (winter || t < 10) return { need: 'check', title: '鉢植え：控えめに', text: '寒い時期は、土が乾いて2〜3日たってから、晴れた日の午前中に。夕方の水やりは凍結の原因に。' };
    return { need: 'check', title: '鉢植え：土が乾いていたら', text: '表面の土が白っぽく乾いていたら、たっぷりと。湿っていれば明日まで待って。' };
  }
  if (opts.young) {
    if (wet >= 8) return { need: 'none', title: '植えたばかりの株も今日はOK', text: `雨（約${Math.round(wet)}mm）で十分です。` };
    return { need: 'yes', title: '植えたばかりの株に水やりを', text: '根づくまでの1か月ほどは、土の表面が乾いたらたっぷりと。' };
  }
  if (wet >= 10 || winter) return { need: 'none', title: '地植え：水やり不要', text: winter ? '冬の地植えは、雨が少なくてもほとんど水やりは要りません。' : `最近の雨（約${Math.round(wet)}mm）で十分です。` };
  if (t >= 30 && dryDays >= 3) return { need: 'yes', title: '地植え：朝にたっぷり', text: `暑さと${dryDays}日以上の晴れ続き。株元にゆっくり、深くしみこむまで。毎日少しずつより、間をあけてたっぷりが根を強くします。` };
  return { need: 'check', title: '地植え：基本は不要', text: '根づいた株は雨だけで育ちます。葉がしおれていたら、朝にたっぷりと。' };
}
