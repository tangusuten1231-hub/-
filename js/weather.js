// 今週の天気予報から庭仕事のアドバイスを作る（Open-Meteo 予報API、APIキー不要）

const URL_ = 'https://api.open-meteo.com/v1/forecast';

export async function fetchForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat.toFixed(3), longitude: lon.toFixed(3), timezone: 'auto', forecast_days: '7', past_days: '3',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max',
  });
  const res = await fetch(`${URL_}?${params}`);
  if (!res.ok) throw new Error('forecast');
  const j = await res.json();
  const d = j.daily;
  const n = new Date();
  const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  return d.time.map((t, i) => ({
    past: t < today, date: t, code: d.weather_code[i], tmax: d.temperature_2m_max[i], tmin: d.temperature_2m_min[i],
    rain: d.precipitation_sum[i] ?? 0, pop: d.precipitation_probability_max?.[i] ?? null, gust: d.wind_gusts_10m_max?.[i] ?? 0,
  }));
}

export function weatherIcon(code) {
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code === 3 || code === 45 || code === 48) return '☁️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 95) return '⛈️';
  if (code >= 51) return '🌧️';
  return '☁️';
}

const wd = (s) => '日月火水木金土'[new Date(s + 'T00:00:00').getDay()];
const md = (s) => `${Number(s.slice(5, 7))}/${Number(s.slice(8, 10))}(${wd(s)})`;

/** 予報から庭仕事のアドバイス */
export function weatherAdvice(days, month) {
  const out = [];
  const frost = days.filter((d) => d.tmin <= 2);
  const hardFrost = days.filter((d) => d.tmin <= -5);
  const heat = days.filter((d) => d.tmax >= 35);
  const hot = days.filter((d) => d.tmax >= 30);
  const heavy = days.filter((d) => d.rain >= 50);
  const wind = days.filter((d) => d.gust >= 60);
  const rainy = days.filter((d) => d.rain >= 1);
  const dryRun = (() => { let m = 0, c = 0; for (const d of days) { c = d.rain < 1 ? c + 1 : 0; m = Math.max(m, c); } return m; })();
  const good = days.filter((d) => d.rain < 1 && d.tmax >= 12 && d.tmax <= 27 && d.gust < 40);

  if (hardFrost.length) out.push({ level: 3, icon: '🥶', title: '強い冷え込み', text: `${hardFrost.map((d) => md(d.date)).join('・')}に${Math.min(...hardFrost.map((d) => d.tmin)).toFixed(0)}℃。植えたばかりの株や鉢は株元をマルチングし、鉢は軒下へ。` });
  else if (frost.length && [3, 4, 5, 10, 11].includes(month)) out.push({ level: 2, icon: '🧊', title: '霜に注意', text: `${frost.map((d) => md(d.date)).join('・')}の朝は霜が降りるかも。芽吹いたばかりの株や植えたての苗には、前日の夕方に不織布をかけて。` });
  if (heat.length) out.push({ level: 3, icon: '🥵', title: '猛暑日', text: `${heat.map((d) => md(d.date)).join('・')}は35℃以上の予想。水やりは朝か夕方に。植え付けや株分けは避け、作業は涼しい時間に。` });
  else if (hot.length >= 3 && dryRun >= 4) out.push({ level: 2, icon: '💧', title: '暑くて雨なし', text: '30℃超えで雨のない日が続きます。植えて1年以内の株と鉢植えは、朝にたっぷり水を。' });
  else if (dryRun >= 6) out.push({ level: 1, icon: '💧', title: '晴れ続き', text: '1週間ほど雨がない予報。根付く前の苗には水やりを。' });
  if (heavy.length) out.push({ level: 3, icon: '☔', title: '大雨', text: `${heavy.map((d) => md(d.date)).join('・')}に大雨の予報。背の高い植物に支柱を、排水口や水の通り道の確認を。` });
  if (wind.length) out.push({ level: 3, icon: '🌀', title: '強風', text: `${wind.map((d) => md(d.date)).join('・')}は強い風。背の高い宿根草は支柱で支え、鉢は倒れないように。` });
  if (rainy.length >= 5) out.push({ level: 2, icon: '🍄', title: '雨続き', text: '雨の日が多い1週間。蒸れや灰色かび病、ナメクジが出やすいので、晴れ間に花がら摘みと株元の整理を。' });
  if (good.length && !heavy.length) out.push({ level: 0, icon: '🌱', title: '庭仕事日和', text: `${good.slice(0, 3).map((d) => md(d.date)).join('・')}は穏やかな天気。植え付け・株分け・切り戻しに向いています。` });
  return out;
}

export { md };
