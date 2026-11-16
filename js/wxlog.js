// わたしの庭の天気の記録：毎日の最高・最低気温と雨量を端末にためて、平年と比べる（Open-Meteo、APIキー不要）
// 値は約10km格子の気象解析値で、庭で測った値ではない。

const KEEP_DAYS = 1100; // 約3年分

/** 予報データ（past: true の日＝終わった日）を記録に加える。新しい記録を返す */
export function mergeLog(log, days) {
  const out = { ...(log || {}) };
  for (const d of days || []) {
    if (!d.past || d.tmax == null) continue;
    out[d.date] = { tmax: round1(d.tmax), tmin: round1(d.tmin), rain: round1(d.rain || 0) };
  }
  const keys = Object.keys(out).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - KEEP_DAYS))) delete out[k];
  return out;
}
const round1 = (v) => Math.round(v * 10) / 10;
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** 取り寄せる過去の日数（記録の最後の日から今日まで。最大92日） */
export function pastDaysNeeded(log, today = new Date()) {
  const keys = Object.keys(log || {}).sort();
  if (!keys.length) return 92;
  const last = new Date(keys[keys.length - 1] + 'T00:00:00');
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(1, Math.min(92, Math.round((t - last) / 864e5)));
}

/** 直近 n 日（昨日まで）の記録 */
export function lastDays(log, n, today = new Date()) {
  const out = [];
  for (let i = n; i >= 1; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const k = ymd(d);
    out.push({ date: k, ...(log?.[k] || {}) });
  }
  return out;
}

/**
 * 記録のまとめ。monthly：平年の月別（climate.monthly：{ tmax, tmin, prcp }）
 */
export function logSummary(log, monthly, today = new Date()) {
  const keys = Object.keys(log || {}).sort();
  if (!keys.length) return null;
  const y = today.getFullYear(), m = today.getMonth() + 1;
  const sum = (arr, f) => arr.reduce((t, x) => t + (f(x) || 0), 0);
  const inMonth = (yy, mm) => keys.filter((k) => k.startsWith(`${yy}-${String(mm).padStart(2, '0')}`)).map((k) => ({ date: k, ...log[k] }));
  const thisMonth = inMonth(y, m);
  const dim = new Date(y, m, 0).getDate();
  const normalMonth = monthly?.[m - 1]?.prcp ?? null;
  const days7 = lastDays(log, 7, today).filter((d) => d.tmax != null);
  // 晴れ続き（雨1mm未満）の日数
  let dry = 0;
  for (let i = keys.length - 1; i >= 0 && (log[keys[i]].rain || 0) < 1; i--) dry++;
  // 終わった月ごとの合計（最大12か月）と平年
  const months = [];
  for (let k = 1; k <= 12; k++) {
    const d = new Date(y, m - 1 - k, 1);
    const list = inMonth(d.getFullYear(), d.getMonth() + 1);
    if (list.length < 25) continue; // ほぼ1か月分ある月だけ
    const n = monthly?.[d.getMonth()];
    months.push({ y: d.getFullYear(), m: d.getMonth() + 1, rain: Math.round(sum(list, (x) => x.rain)), normal: n ? Math.round(n.prcp) : null,
      tmax: round1(sum(list, (x) => x.tmax) / list.length), normalTmax: n?.tmax ?? null, days: list.length });
  }
  const hot = keys.reduce((b, k) => (log[k].tmax > (b?.v ?? -99) ? { v: log[k].tmax, date: k } : b), null);
  const cold = keys.reduce((b, k) => (log[k].tmin < (b?.v ?? 99) ? { v: log[k].tmin, date: k } : b), null);
  return {
    first: keys[0], count: keys.length,
    monthRain: Math.round(sum(thisMonth, (x) => x.rain)), monthDays: thisMonth.length,
    monthNormalToDate: normalMonth != null ? Math.round((normalMonth * thisMonth.length) / dim) : null,
    rain7: Math.round(sum(days7, (x) => x.rain)), dry, months, hot, cold,
  };
}

/** 平年との比較のことば */
export function compareJa(v, normal) {
  if (normal == null || normal === 0) return '';
  const r = v / normal;
  return r >= 1.5 ? 'かなり多い' : r >= 1.15 ? 'やや多い' : r > 0.85 ? '平年並み' : r > 0.5 ? 'やや少ない' : 'かなり少ない';
}
