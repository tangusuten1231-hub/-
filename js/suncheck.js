// 日当たりチェッカー：まわりの建物や木の「見上げる角度」を方位ごとに測り、太陽の通り道と重ねて日照時間を計算する
import { declination } from './sun.js';
import { sunPos } from './balcony.js';

/**
 * 測った点（{ az: 方位°（北0・時計回り）, alt: 見上げる角度° }）から、方位→障害物の高さ（度）の関数をつくる。
 * 隣り合う点の間（60°以内）は直線でつなぎ、測っていない方位は開けている（0°）とみなす。
 */
export function horizonFn(points) {
  const pts = (points || []).filter((p) => Number.isFinite(p.az) && Number.isFinite(p.alt)).map((p) => ({ az: ((p.az % 360) + 360) % 360, alt: Math.max(0, Math.min(89, p.alt)) })).sort((a, b) => a.az - b.az);
  if (!pts.length) return () => 0;
  return (az) => {
    const a = ((az % 360) + 360) % 360;
    let best = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      if (Math.abs(p.az - a) <= 5 || Math.min(Math.abs(p.az - a), 360 - Math.abs(p.az - a)) <= 5) best = Math.max(best, p.alt);
      let span = q.az - p.az; if (span <= 0) span += 360;
      if (pts.length === 1 || span > 60) continue;
      let d = a - p.az; if (d < 0) d += 360;
      if (d <= span) best = Math.max(best, p.alt + ((q.alt - p.alt) * d) / span);
    }
    return best;
  };
}

/** ある日の直射日光の時間（時間）。6分ごとに太陽が障害物より上にあるかを数える */
export function sunHours(lat, horizon, decl) {
  let n = 0;
  for (let t = 3; t <= 21; t += 0.1) {
    const s = sunPos(lat, decl, t);
    if (s.alt > 0 && s.alt > horizon(s.az)) n++;
  }
  return Math.round(n * 0.1 * 10) / 10;
}

/** 月ごとの日照時間（各月15日）と、生育期（4〜9月）の平均、日当たりの区分 */
export function sunReport(lat, points, year = 2026) {
  const h = horizonFn(points);
  const open = horizonFn([]);
  const months = Array.from({ length: 12 }, (_, i) => {
    const decl = declination(new Date(year, i, 15));
    return { m: i + 1, hours: sunHours(lat, h, decl), open: sunHours(lat, open, decl) };
  });
  const south = lat < 0;
  const grow = (south ? [10, 11, 12, 1, 2, 3] : [4, 5, 6, 7, 8, 9]).map((m) => months[m - 1].hours);
  const avg = Math.round((grow.reduce((t, v) => t + v, 0) / grow.length) * 10) / 10;
  const sun = avg >= 6 ? 'full' : avg >= 3 ? 'part' : 'shade';
  return { months, avg, sun, winter: months[south ? 5 : 11].hours, summer: months[south ? 11 : 5].hours };
}

/** 高さ H m・距離 D m の障害物を、地面近く（0.5m）から見上げる角度 */
export const angleOf = (H, D) => (D > 0 ? Math.round((Math.atan(Math.max(0, H - 0.5) / D) * 180) / Math.PI) : 0);

/** 太陽の通り道（日の出〜日の入り）の点列 */
export function sunPath(lat, decl) {
  const out = [];
  for (let t = 3; t <= 21; t += 0.25) { const s = sunPos(lat, decl, t); if (s.alt > -1) out.push(s); }
  return out;
}

// ---------- 今日・いまの判定（季節・時刻・天気） ----------
/** 均時差（分） */
export function equationOfTime(date) {
  const n = (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 864e5;
  const B = ((2 * Math.PI) / 365) * (n - 81);
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}
/** 時計の時刻（その土地の標準時、時） → 太陽時（時） */
export function solarHour(clockH, lon, date, tzHours = tzFor(date, lon)) {
  return clockH + (lon - 15 * tzHours) / 15 + equationOfTime(date) / 60;
}
/** 時差：ふつうは端末の設定。庭の経度から大きく離れているとき（旅行中など）は経度から求める */
export function tzFor(date, lon) {
  const dev = -date.getTimezoneOffset() / 60;
  return Math.abs(lon - 15 * dev) > 30 ? Math.round(lon / 15) : dev;
}
/** 空の見える割合（水平面に届く散乱光の割合の目安）：方位ごとの cos²(障害物の角度) の平均 */
export function skyView(points) {
  const h = horizonFn(points);
  let s = 0, n = 0;
  for (let az = 0; az < 360; az += 5) { const a = (h(az) * Math.PI) / 180; s += Math.cos(a) ** 2; n++; }
  return Math.round((s / n) * 100) / 100;
}
/** 今日、この場所に直射日光が当たる時間帯（時計の時刻） */
export function sunWindows(lat, lon, points, date = new Date()) {
  const h = horizonFn(points);
  const decl = declination(date);
  const wins = [];
  let cur = null, total = 0;
  for (let t = 4; t <= 20; t += 0.1) {
    const s = sunPos(lat, decl, solarHour(t, lon, date));
    const lit = s.alt > 0 && s.alt > h(s.az);
    if (lit) { total += 0.1; if (!cur) cur = { from: t, to: t }; cur.to = t; } else if (cur) { wins.push(cur); cur = null; }
  }
  if (cur) wins.push(cur);
  return { hours: Math.round(total * 10) / 10, wins };
}
export const clockJa = (t) => `${Math.floor(t)}:${String(Math.round((t % 1) * 60)).padStart(2, '0')}`.replace(/:60$/, ':59');
/** いまの太陽：高さ・方位と、この場所に日が当たっているか */
export function sunNow(lat, lon, points, date = new Date()) {
  const s = sunPos(lat, declination(date), solarHour(date.getHours() + date.getMinutes() / 60, lon, date));
  const blocked = s.alt <= 0 || s.alt <= horizonFn(points)(s.az);
  return { alt: Math.round(s.alt), az: Math.round(s.az), up: s.alt > 0, lit: !blocked };
}

/**
 * 日射の予報（1時間ごと：直達日射・散乱日射 W/㎡、雲量%）と、この場所の障害物から、
 * 今日の光の量（植物が使う光の1日の合計 mol/㎡/日・目安）と、いまの推定照度（ルクス）を出す。
 * hourly: [{ time: 'YYYY-MM-DDTHH:00', direct, diffuse, cloud }]（その時刻までの1時間の平均）
 */
export function lightToday(hourly, lat, lon, points, date = new Date()) {
  const h = horizonFn(points), svf = skyView(points);
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const decl = declination(date);
  const rows = (hourly || []).filter((r) => r.time.startsWith(day));
  if (!rows.length) return null;
  let spot = 0, open = 0, cloudSum = 0, cloudN = 0, nowLux = null;
  const PAR = 2.06 * 3600 / 1e6; // 日射 1 W/㎡ を1時間 → 光合成に使える光（mol/㎡）
  const nowH = date.getHours() + date.getMinutes() / 60;
  const hours = rows.map((r) => {
    const hr = Number(r.time.slice(11, 13));
    const s = sunPos(lat, decl, solarHour(hr - 0.5, lon, date));
    const lit = s.alt > 0 && s.alt > h(s.az);
    const w = (lit ? r.direct : 0) + r.diffuse * svf;
    spot += w * PAR; open += (r.direct + r.diffuse) * PAR;
    if (s.alt > 0) { cloudSum += r.cloud ?? 0; cloudN++; }
    if (nowH > hr - 1 && nowH <= hr) nowLux = Math.round(w * 110);
    return { hr, w: Math.round(w), lit };
  });
  const cloud = cloudN ? Math.round(cloudSum / cloudN) : null;
  return { dli: Math.round(spot * 10) / 10, openDli: Math.round(open * 10) / 10, ratio: open ? Math.round((spot / open) * 100) : 0, cloud, nowLux, svf, hours,
    sky: cloud == null ? '' : cloud >= 80 ? 'くもり' : cloud >= 40 ? '晴れ時々くもり' : '晴れ' };
}
/** 照度のことば */
export function luxJa(lx) {
  if (lx == null) return '';
  if (lx >= 50000) return '真夏の直射日光なみ';
  if (lx >= 20000) return '明るい日なた';
  if (lx >= 5000) return '明るい日陰〜くもりの屋外';
  if (lx >= 1000) return '日陰（木陰・北側）';
  return '暗い（夕方・深い日陰）';
}

// ---------- 植物との相性 ----------
const SUN_RANK = { shade: 0, part: 1, full: 2 };
/** その場所の日当たり（spotSun）で、植物が育つか */
export function plantFit(p, spotSun, avgHours) {
  const ranks = p.sun.map((x) => SUN_RANK[x]);
  const lo = Math.min(...ranks), hi = Math.max(...ranks), s = SUN_RANK[spotSun];
  if (s >= lo && s <= hi) return { level: 3, mark: '◎', text: '日当たりが合っています。' };
  if (s > hi) {
    return s - hi >= 2
      ? { level: 1, mark: '×', text: '日差しが強すぎます。葉焼けして弱るおそれ。日陰になる場所か、木の下などに。' }
      : { level: 2, mark: '△', text: '日差しがやや強め。夏の午後に葉焼けしやすいので、西日が当たらなければ育ちます。' };
  }
  return lo - s >= 2
    ? { level: 1, mark: '×', text: `光が足りません（生育期の直射日光は1日約${avgHours}時間。この植物は6時間以上ほしい）。` }
    : { level: 2, mark: '△', text: `やや光が足りません（生育期の直射日光は1日約${avgHours}時間）。育ちますが、花が少なく、株が間のびしやすい。` };
}
