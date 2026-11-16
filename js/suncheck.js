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
