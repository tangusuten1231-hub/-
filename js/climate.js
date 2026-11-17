// 気候データの取得と解析（Open-Meteo 過去気象 API、APIキー不要）

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

export const YEARS = 10;

/** 直近 YEARS 年分（完了した年）の日別データを取得 */
export async function fetchDaily(lat, lon, now = new Date()) {
  const endYear = now.getFullYear() - 1;
  const startYear = endYear - YEARS + 1;
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    start_date: `${startYear}-01-01`,
    end_date: `${endYear}-12-31`,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum',
    timezone: 'auto',
  });
  const res = await fetch(`${ARCHIVE_URL}?${params}`);
  if (!res.ok) throw new Error(`気象データを取得できませんでした (${res.status})`);
  const json = await res.json();
  if (!json.daily || !json.daily.time) throw new Error('気象データの形式が不正です');
  return json;
}

const PREF_RE = /^(北海道|東京都?|京都府?|大阪府?|[^\s都道府県]{2,3}県)/;
/**
 * 地名検索。「千葉県旭市」「千葉県 旭市」「旭市」「旭」のどれでも探せるよう、
 * 都道府県名を外した名前・「市区町村」を外した名前の順に試し、都道府県名があればその県の候補に絞る。
 */
export async function searchPlace(name, fetchFn = fetch) {
  const raw = String(name).normalize('NFKC').replace(/[　\s]+/g, ' ').trim();
  if (!raw) return [];
  let pref = '', rest = raw.replace(/ /g, '');
  const parts = raw.split(' ');
  if (parts.length > 1 && PREF_RE.test(parts[0])) { pref = parts[0]; rest = parts.slice(1).join(''); }
  const m = rest.match(PREF_RE);
  if (m && m[0] !== rest) { pref = pref || m[0]; rest = rest.slice(m[0].length); }
  const tries = [...new Set([raw.replace(/ /g, ''), rest, rest.replace(/(市|町|村|区|郡)$/, '')].filter((t) => t && t.length >= 1))];
  const prefKey = pref.replace(/[都道府県]$/, '');
  const okPref = (r) => !prefKey || (r.admin1 || '').includes(prefKey) || (r.admin2 || '').includes(prefKey);
  let lastErr = null;
  for (const t of tries) {
    try {
      const params = new URLSearchParams({ name: t, count: '20', language: 'ja', format: 'json' });
      const res = await fetchFn(`${GEOCODE_URL}?${params}`);
      if (!res.ok) throw new Error('地名検索に失敗しました');
      const json = await res.json();
      const list = (json.results || []).filter(okPref);
      // 日本の候補を先に、人口の多い順に
      list.sort((a, b) => (b.country_code === 'JP') - (a.country_code === 'JP') || (b.population || 0) - (a.population || 0));
      if (list.length) {
        return list.slice(0, 8).map((r) => ({ name: [r.name, r.admin1, r.country].filter(Boolean).join('、'), lat: r.latitude, lon: r.longitude }));
      }
    } catch (e) { lastErr = e; }
  }
  if (lastErr) throw lastErr;
  return [];
}

/**
 * 海からの距離の目安（km）。Open-Meteo の標高API（APIキー不要）で、まわり8方位・1〜8kmの地点の標高を調べ、
 * 標高0m以下（海面）の地点がいちばん近い距離を返す。8km以内に海がなければ null。
 */
export async function fetchCoast(lat, lon, fetchFn = fetch) {
  const dists = [1, 2, 4, 8];
  const pts = [];
  for (const d of dists) for (let k = 0; k < 8; k++) {
    const a = (k / 8) * 2 * Math.PI;
    pts.push({ d, lat: lat + (d / 111) * Math.cos(a), lon: lon + (d / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(a) });
  }
  const params = new URLSearchParams({ latitude: pts.map((p) => p.lat.toFixed(4)).join(','), longitude: pts.map((p) => p.lon.toFixed(4)).join(',') });
  const res = await fetchFn(`https://api.open-meteo.com/v1/elevation?${params}`);
  if (!res.ok) throw new Error('elevation');
  const j = await res.json();
  const el = j.elevation || [];
  const sea = pts.filter((p, i) => el[i] != null && el[i] <= 0);
  return sea.length ? Math.min(...sea.map((p) => p.d)) : null;
}

export async function reverseGeocode(lat, lon) {
  try {
    const params = new URLSearchParams({ latitude: lat, longitude: lon, localityLanguage: 'ja' });
    const res = await fetch(`${REVERSE_URL}?${params}`);
    if (!res.ok) return null;
    const j = await res.json();
    return [j.principalSubdivision, j.city || j.locality].filter(Boolean).join(' ') || null;
  } catch {
    return null;
  }
}

// ---------- 解析（純粋関数） ----------

/** 平均年最低気温(℃) → USDA 耐寒性ゾーン */
export function hardinessZone(tempC) {
  const f = tempC * 9 / 5 + 32;
  const x = (f + 60) / 10; // ゾーン1の下限 = -60°F
  let zone = Math.floor(x) + 1;
  let half = (f + 60) - Math.floor(x) * 10 >= 5 ? 'b' : 'a';
  if (zone < 1) { zone = 1; half = 'a'; }
  if (zone > 13) { zone = 13; half = 'b'; }
  return { zone, half, label: `${zone}${half}`, value: zone + (half === 'b' ? 0.5 : 0) };
}

/** 30℃以上の日数（年平均） → AHS 暑さゾーン */
export function heatZone(hotDays) {
  const limits = [1, 8, 15, 31, 46, 61, 91, 121, 151, 181, 211];
  for (let i = 0; i < limits.length; i++) if (hotDays < limits[i]) return i + 1;
  return 12;
}

const median = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const quantile = (a, q) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.round(q * (s.length - 1)))];
};

function dayOfYear(y, m, d) {
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1;
}

/** 年内通算日 → { month, day }（平年で換算） */
export function doyToDate(doy) {
  const d = new Date(Date.UTC(2023, 0, 1) + (Math.round(doy) - 1) * 86400000);
  return { month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function formatDoy(doy) {
  if (doy == null) return '—';
  const { month, day } = doyToDate(doy);
  const part = day <= 10 ? '上旬' : day <= 20 ? '中旬' : '下旬';
  return `${month}月${part}`;
}

/**
 * 日別データを解析して庭づくり用の気候指標を返す
 * @param daily Open-Meteo の daily オブジェクト
 * @param lat 緯度（南半球対応のため）
 */
export function analyzeClimate(daily, lat = 35) {
  const { time } = daily;
  const tmax = daily.temperature_2m_max;
  const tmin = daily.temperature_2m_min;
  const prcp = daily.precipitation_sum || [];
  const snow = daily.snowfall_sum || [];
  const south = lat < 0;

  const years = new Map();
  const monthly = Array.from({ length: 12 }, () => ({ tmax: [], tmin: [], prcp: new Map() }));

  for (let i = 0; i < time.length; i++) {
    const [y, m, d] = time[i].split('-').map(Number);
    if (!years.has(y)) {
      years.set(y, { days: 0, minT: Infinity, hot: 0, veryHot: 0, tropical: 0, prcp: 0, snow: 0, spring: null, autumn: null });
    }
    const Y = years.get(y);
    const hi = tmax[i], lo = tmin[i];
    if (hi == null || lo == null) continue;
    Y.days++;
    if (lo < Y.minT) Y.minT = lo;
    if (hi >= 30) Y.hot++;
    if (hi >= 35) Y.veryHot++;
    if (lo >= 25) Y.tropical++;
    Y.prcp += prcp[i] || 0;
    Y.snow += snow[i] || 0;
    const doy = dayOfYear(y, m, d);
    if (lo <= 0) {
      // 北半球: 1〜7月の最後の霜 = 終霜、8〜12月の最初の霜 = 初霜（南半球は逆）
      const inSpringHalf = south ? m >= 7 : m <= 7;
      if (inSpringHalf) Y.spring = doy;
      else if (Y.autumn == null) Y.autumn = doy;
    }
    const M = monthly[m - 1];
    M.tmax.push(hi);
    M.tmin.push(lo);
    M.prcp.set(y, (M.prcp.get(y) || 0) + (prcp[i] || 0));
  }

  const full = [...years.values()].filter((Y) => Y.days >= 360);
  if (!full.length) throw new Error('解析に十分な気象データがありません');

  const avgMin = mean(full.map((Y) => Y.minT));
  const hotDays = mean(full.map((Y) => Y.hot));
  const springs = full.map((Y) => Y.spring).filter((v) => v != null);
  const autumns = full.map((Y) => Y.autumn).filter((v) => v != null);
  const frostYears = full.filter((Y) => Y.spring != null || Y.autumn != null).length;
  const frostFree = frostYears < full.length / 2;

  const lastFrost = frostFree ? null : median(springs);
  const firstFrost = frostFree ? null : median(autumns);
  const zone = hardinessZone(avgMin);

  return {
    years: full.length,
    avgMinTemp: round1(avgMin),
    coldestTemp: round1(Math.min(...full.map((Y) => Y.minT))),
    zone,
    hotDays: round1(hotDays),
    veryHotDays: round1(mean(full.map((Y) => Y.veryHot))),
    tropicalNights: round1(mean(full.map((Y) => Y.tropical))),
    heatZone: heatZone(hotDays),
    annualPrecip: Math.round(mean(full.map((Y) => Y.prcp))),
    annualSnow: Math.round(mean(full.map((Y) => Y.snow))),
    frostFree,
    frostYears,
    // 霜がまれな地域でも、霜が降りた年の終霜・初霜の目安
    lastFrostTypical: springs.length ? median(springs) : null,
    firstFrostTypical: autumns.length ? median(autumns) : null,
    lastFrost,
    lastFrostSafe: frostFree ? null : (south ? null : quantile(springs, 0.8)),
    firstFrost,
    growingDays: lastFrost != null && firstFrost != null
      ? (south ? 365 - (lastFrost - firstFrost) : firstFrost - lastFrost) : 365,
    monthly: monthly.map((M) => ({
      tmax: round1(mean(M.tmax)),
      tmin: round1(mean(M.tmin)),
      prcp: Math.round(mean([...M.prcp.values()]) ?? 0),
    })),
    south,
  };
}

const round1 = (v) => (v == null ? null : Math.round(v * 10) / 10);

/** 蒸れストレス 0〜3（熱帯夜の日数から） */
export function humidityStress(c) {
  if (c.tropicalNights >= 30) return 3;
  if (c.tropicalNights >= 10) return 2;
  if (c.tropicalNights >= 1 || c.hotDays >= 30) return 1;
  return 0;
}
