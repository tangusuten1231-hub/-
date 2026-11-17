// 太陽の動き（植栽位置・建物の影の検討用）

const RAD = Math.PI / 180;
export const TILT = 23.44;

/** 日付の太陽赤緯（度） */
export function declination(date) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const n = (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000;
  return -TILT * Math.cos((2 * Math.PI / 365) * (n + 10));
}

/** 南中高度（度） */
export function noonAltitude(lat, decl) {
  return 90 - Math.abs(lat - decl);
}

/** 日の長さ（時間） */
export function dayLength(lat, decl) {
  const x = -Math.tan(lat * RAD) * Math.tan(decl * RAD);
  if (x <= -1) return 24;
  if (x >= 1) return 0;
  return (2 * Math.acos(x)) / RAD / 15;
}

/** 日の出の方位（北=0°、時計回り） */
export function sunriseAzimuth(lat, decl) {
  const x = Math.sin(decl * RAD) / Math.cos(lat * RAD);
  return Math.acos(Math.max(-1, Math.min(1, x))) / RAD;
}

/** 高さ1mの物体が南中時に落とす影の長さ（m） */
export function shadowRatio(altitude) {
  if (altitude <= 0) return Infinity;
  return 1 / Math.tan(altitude * RAD);
}

export function compass(az) {
  const names = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
  return names[Math.round(((az % 360) + 360) % 360 / 22.5) % 16];
}

/** 季節ごとの太陽データ */
export function sunSeasons(lat, today = new Date()) {
  const south = lat < 0;
  const list = [
    { key: 'summer', label: south ? '夏至（12月）' : '夏至（6月）', decl: south ? -TILT : TILT },
    { key: 'equinox', label: '春分・秋分', decl: 0 },
    { key: 'winter', label: south ? '冬至（6月）' : '冬至（12月）', decl: south ? TILT : -TILT },
    { key: 'today', label: `今日（${today.getMonth() + 1}/${today.getDate()}）`, decl: declination(today) },
  ];
  return list.map((s) => {
    const alt = noonAltitude(lat, s.decl);
    const rise = sunriseAzimuth(lat, s.decl);
    return {
      ...s,
      altitude: alt,
      dayLength: dayLength(lat, s.decl),
      shadow: shadowRatio(alt),
      sunrise: compass(rise),
      sunset: compass(360 - rise),
    };
  });
}
