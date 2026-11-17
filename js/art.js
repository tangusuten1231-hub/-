// 手描き風の植物画イラスト（インクの線＋水彩のにじみ）。すべてオリジナルのSVG。
// 線は var(--ink)、にじみは固定色の半透明。index.html の #wc（にじみ）と #rough（線の揺らぎ）フィルタを使う。

const W = (cx, cy, rx, ry, c, o = 0.32) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c}" opacity="${o}" filter="url(#wc)"/>`;
const ink = (d, w = 1.5) => `<path d="${d}" fill="none" stroke="var(--ink)" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" filter="url(#rough)"/>`;
const dot = (x, y, r, c, o = 0.9) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o}"/>`;
const leaf = (x, y, a, l = 14, c = '#7aa95c') => {
  const r = (a * Math.PI) / 180, ex = x + Math.cos(r) * l, ey = y + Math.sin(r) * l;
  const nx = -Math.sin(r) * l * 0.32, ny = Math.cos(r) * l * 0.32;
  const mx = (x + ex) / 2, my = (y + ey) / 2;
  return `<path d="M${x},${y} Q${(mx + nx).toFixed(1)},${(my + ny).toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)} Q${(mx - nx).toFixed(1)},${(my - ny).toFixed(1)} ${x},${y}Z" fill="${c}" opacity=".55" stroke="var(--ink)" stroke-width=".9" filter="url(#rough)"/>`;
};
const daisy = (x, y, r, c, center = '#7a5230') => {
  let s = '';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    s += `<ellipse cx="${(x + Math.cos(a) * r * 0.62).toFixed(1)}" cy="${(y + Math.sin(a) * r * 0.62).toFixed(1)}" rx="${(r * 0.42).toFixed(1)}" ry="${(r * 0.17).toFixed(1)}" transform="rotate(${((a * 180) / Math.PI).toFixed(0)} ${(x + Math.cos(a) * r * 0.62).toFixed(1)} ${(y + Math.sin(a) * r * 0.62).toFixed(1)})" fill="${c}" opacity=".85"/>`;
  }
  return s + dot(x, y, r * 0.3, center) + `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="var(--ink)" stroke-width=".7" opacity=".5" filter="url(#rough)"/>`;
};
const spike = (x, y, h, c) => {
  let s = '';
  for (let i = 0; i < 7; i++) s += dot(x + (i % 2 ? 2.2 : -2.2), y + i * (h / 7), 2.6 - i * 0.15, c, 0.85);
  return s;
};
const svg = (body, bg = '') => `<svg viewBox="0 0 200 140" class="art" role="img" aria-hidden="true">${bg}${body}</svg>`;

export const ART = {
  dry: () => svg(
    W(100, 70, 70, 48, '#e9c46a', 0.22) +
    ink('M30,14 L170,14', 1.2) +
    ['#c97b63', '#8e5fc4', '#e9c46a', '#5b8ee6'].map((c, i) => {
      const x = 60 + i * 26;
      return ink(`M${x},14 L${x},34`, 1) + ink(`M${x - 4},34 L${x + 4},34`, 2.2) +
        [0, 1, 2].map((k) => ink(`M${x},34 Q${x + (k - 1) * 6},70 ${x + (k - 1) * 10},${98 + k * 4}`, 1.1)).join('') +
        [0, 1, 2].map((k) => dot(x + (k - 1) * 10, 102 + k * 4, 5, c, 0.75)).join('') + leaf(x, 52, 140 + i * 10, 10, '#9aa77a');
    }).join(''),
  ),
  bouquet: () => svg(
    W(100, 82, 60, 50, '#e78fb3', 0.18) +
    ink('M78,92 L84,132 L116,132 L122,92 Z', 1.5) + `<path d="M80,104 L120,104 L117,130 L83,130Z" fill="#9cc4e8" opacity=".35"/>` +
    [[-30, 30], [-15, 18], [0, 12], [15, 20], [32, 34]].map(([dx, top]) => ink(`M100,96 Q${100 + dx * 0.4},60 ${100 + dx},${top}`, 1.1)).join('') +
    daisy(70, 30, 9, '#f6f3ea') + daisy(100, 12, 8, '#e78fb3') + daisy(132, 34, 8, '#efc93a', '#8a5a2b') + spike(85, 14, 18, '#8e5fc4') + spike(115, 18, 16, '#5b8ee6') +
    leaf(92, 70, 200) + leaf(108, 64, -20) + leaf(100, 84, 160, 12),
  ),
  seed: () => svg(
    W(96, 74, 64, 46, '#c9a66b', 0.25) +
    ink('M50,40 L130,40 L130,120 L50,120 Z', 1.4) + ink('M50,40 L90,64 L130,40', 1.2) +
    ink('M62,92 L118,92 M62,102 L104,102', 0.9) + daisy(90, 78, 7, '#efc93a') +
    [[146, 108], [154, 118], [140, 124], [160, 104], [150, 128]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="2" fill="#6b4a2a" transform="rotate(${x % 50} ${x} ${y})"/>`).join('') +
    ink('M140,70 Q160,40 172,20', 1) + dot(172, 18, 6, '#5c4330'),
  ),
  tea: () => svg(
    W(90, 86, 64, 40, '#a8c98a', 0.3) +
    ink('M50,70 Q50,118 88,118 Q126,118 126,70 Z', 1.5) + ink('M126,78 Q146,78 140,96 Q136,106 124,104', 1.3) + ink('M50,80 Q30,78 32,62', 1.3) +
    ink('M70,70 Q88,58 106,70', 1.2) + ink('M84,58 L92,58', 2.4) +
    ink('M150,112 Q150,126 164,126 Q178,126 178,112 Z', 1.3) +
    ink('M160,104 Q156,96 162,90 Q168,84 164,76', 0.9) + ink('M170,104 Q166,96 172,90', 0.9) +
    leaf(30, 116, -30, 16) + leaf(36, 120, -60, 14) + leaf(186, 96, 220, 12),
  ),
  lavender: () => svg(
    W(100, 70, 62, 52, '#b8a1e3', 0.28) +
    [-18, -9, 0, 9, 18].map((dx) => ink(`M100,124 Q${100 + dx * 0.4},80 ${100 + dx * 2},${30 + Math.abs(dx)}`, 1)).join('') +
    [-18, -9, 0, 9, 18].map((dx) => spike(100 + dx * 2, 18 + Math.abs(dx), 20, '#8e5fc4')).join('') +
    ink('M88,96 Q100,104 112,96', 2) + ink('M100,100 Q86,112 82,120 M100,100 Q114,112 120,118', 1.2),
  ),
  press: () => svg(
    W(100, 78, 76, 44, '#f1d7c4', 0.4) +
    ink('M20,40 Q60,30 100,44 Q140,30 180,40 L180,116 Q140,106 100,120 Q60,106 20,116 Z', 1.4) + ink('M100,44 L100,120', 1) +
    daisy(60, 74, 11, '#e78fb3') + leaf(60, 86, 100, 18) + leaf(56, 80, 150, 12) +
    ink('M140,92 Q138,70 146,56', 0.9) + [0, 1, 2, 3, 4].map((i) => leaf(146 - i * 1.6, 60 + i * 7, i % 2 ? 20 : 160, 8, '#7aa95c')).join(''),
  ),
  dye: () => svg(
    W(100, 96, 60, 30, '#efc93a', 0.35) +
    ink('M56,76 L144,76 L136,124 L64,124 Z', 1.5) + ink('M52,76 L148,76', 2) + `<path d="M60,84 L140,84 L134,120 L66,120Z" fill="#efc93a" opacity=".55"/>` +
    ink('M84,72 Q90,62 86,54 M104,72 Q110,60 104,50 M120,72 Q126,64 122,56', 0.9) +
    ink('M150,20 L190,20', 1.2) + `<path d="M156,20 L156,64 Q166,70 176,64 L176,20Z" fill="#efc93a" opacity=".6" stroke="var(--ink)" stroke-width="1" filter="url(#rough)"/>` +
    daisy(28, 104, 8, '#efc93a', '#a5772d') + daisy(36, 84, 6, '#efc93a', '#a5772d') + ink('M28,112 L30,132 M36,90 L32,132', 1),
  ),
  wreath: () => svg(
    W(100, 70, 56, 52, '#a8c98a', 0.25) +
    `<circle cx="100" cy="70" r="40" fill="none" stroke="#9aa77a" stroke-width="10" opacity=".35" filter="url(#wc)"/>` +
    Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return leaf(100 + Math.cos(a) * 40, 70 + Math.sin(a) * 40, (a * 180) / Math.PI + 70, 13, i % 3 ? '#7aa95c' : '#a9b5a6'); }).join('') +
    [0.3, 1.4, 2.6, 3.7, 5].map((a, i) => dot(100 + Math.cos(a) * 40, 70 + Math.sin(a) * 40, 5, ['#8e5fc4', '#e9c46a', '#c97b63', '#5b8ee6', '#f3f1ea'][i], 0.85)).join('') +
    ink('M92,112 Q100,104 108,112 M100,108 L92,128 M100,108 L110,128', 1.6),
  ),
  compost: () => svg(
    W(100, 96, 70, 30, '#a0835e', 0.35) +
    ink('M40,70 L160,70 L160,126 L40,126 Z', 1.4) + ink('M40,88 L160,88 M40,106 L160,106', 0.9) + ink('M60,70 L60,126 M100,70 L100,126 M140,70 L140,126', 0.6) +
    [[60, 62, 20], [80, 56, -30], [104, 60, 40], [126, 56, -10], [144, 62, 30], [92, 50, 60]].map(([x, y, a], i) => leaf(x, y, a, 16, ['#c97b63', '#e9c46a', '#a0835e', '#c97b63', '#d9a441', '#8a6a3a'][i])).join('') +
    ink('M170,40 Q176,52 172,64', 0.9) + leaf(172, 30, 120, 14, '#d9a441'),
  ),
  bonfire: () => svg(
    W(100, 100, 56, 30, '#e9852f', 0.3) +
    `<path d="M100,30 Q118,60 112,78 Q126,70 122,58 Q140,82 124,104 L76,104 Q60,84 78,62 Q80,76 90,80 Q82,56 100,30Z" fill="#e9852f" opacity=".75" filter="url(#wc)"/>` +
    `<path d="M100,58 Q110,76 104,90 Q96,92 94,84 Q92,72 100,58Z" fill="#efc93a" opacity=".9"/>` +
    ink('M54,116 L146,100 M54,100 L146,118 M70,124 L132,124', 2.2) +
    `<ellipse cx="160" cy="122" rx="14" ry="7" fill="#8e3b5b" opacity=".6"/>` + ink('M148,120 Q160,112 172,120', 0.8) +
    ink('M120,24 Q126,16 122,8 M84,22 Q78,14 84,6', 0.8),
  ),
  forage: () => svg(
    W(100, 96, 66, 34, '#a8c98a', 0.32) +
    ink('M46,86 L154,86 L144,128 L56,128 Z', 1.5) + ink('M52,96 L148,96 M56,108 L144,108 M60,118 L140,118', 0.7) + ink('M58,86 Q100,40 142,86', 1.3) +
    [70, 92, 114, 134].map((x, i) => ink(`M${x},86 Q${x - 4},${64 - i * 2} ${x + 6},${58 - i * 2} Q${x + 14},${56 - i * 2} ${x + 10},${66 - i * 2} Q${x + 6},${70 - i * 2} ${x + 4},${64 - i * 2}`, 1.3)).join('') +
    [70, 92, 114, 134].map((x, i) => `<path d="M${x},86 Q${x - 4},${64 - i * 2} ${x + 6},${58 - i * 2}" stroke="#7aa95c" stroke-width="4" fill="none" opacity=".45"/>`).join(''),
  ),
  bird: () => svg(
    W(104, 70, 62, 46, '#9cc4e8', 0.25) +
    ink('M150,136 Q146,100 152,62', 1.1) + dot(152, 60, 6, '#5c4330') + ink('M40,136 Q50,104 46,74', 1.1) + dot(46, 72, 5, '#5c4330') +
    ink('M100,136 Q102,110 100,96', 1.2) +
    `<path d="M74,72 Q86,52 106,58 Q122,62 122,74 Q112,90 90,86 Q78,84 74,72Z" fill="#c97b63" opacity=".6"/>` +
    `<path d="M88,66 Q100,60 112,72 Q100,74 88,66Z" fill="#8a6a4a" opacity=".55"/>` +
    ink('M74,72 Q86,52 106,58 Q122,62 122,74 Q112,90 90,86 Q78,84 74,72Z', 1.3) + ink('M120,64 L130,62 L121,70', 1) + dot(112, 64, 1.6, 'var(--ink)') +
    ink('M76,74 L58,66 L62,80 Z', 1.1) + ink('M94,86 L96,96 M102,86 L102,96 M88,96 L110,96', 1),
  ),
  butterfly: () => svg(
    W(100, 64, 62, 44, '#efc93a', 0.22) +
    `<path d="M100,60 Q70,20 52,40 Q42,62 100,66Z" fill="#e9852f" opacity=".6"/><path d="M100,60 Q130,20 148,40 Q158,62 100,66Z" fill="#e9852f" opacity=".6"/>` +
    `<path d="M100,66 Q74,70 70,88 Q82,98 100,72Z" fill="#efc93a" opacity=".6"/><path d="M100,66 Q126,70 130,88 Q118,98 100,72Z" fill="#efc93a" opacity=".6"/>` +
    ink('M100,60 Q70,20 52,40 Q42,62 100,66 M100,60 Q130,20 148,40 Q158,62 100,66 M100,66 Q74,70 70,88 Q82,98 100,72 M100,66 Q126,70 130,88 Q118,98 100,72', 1.1) +
    ink('M100,54 L100,80', 2) + ink('M100,54 Q94,40 88,36 M100,54 Q106,40 112,36', 0.9) +
    ink('M100,138 Q98,116 100,104', 1) + daisy(100, 104, 10, '#e78fb3') + leaf(100, 124, 200, 14) + leaf(100, 118, -20, 14),
  ),
  moon: () => svg(
    `<rect width="200" height="140" fill="#2f3b52" opacity=".12"/>` + `<circle cx="132" cy="44" r="24" fill="#f3e3a6" opacity=".9" filter="url(#wc)"/>` +
    [30, 46, 62, 78].map((x, i) => ink(`M${x},138 Q${x + 6},90 ${x + 26},${40 + i * 6}`, 1.1)).join('') +
    [30, 46, 62, 78].map((x, i) => `<path d="M${x + 26},${40 + i * 6} q-10,6 -14,18 q8,-4 14,-2 q-8,4 -10,14" fill="#e4d6ae" opacity=".8"/>`).join('') +
    ink('M148,138 L148,108', 1) + `<ellipse cx="148" cy="104" rx="16" ry="5" fill="#f6f3ea" stroke="var(--ink)" stroke-width="1"/>` +
    [[144, 98], [152, 98], [148, 92]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.6" fill="#f6f3ea" stroke="var(--ink)" stroke-width=".8"/>`).join(''),
  ),
  grass: () => svg(
    `<circle cx="150" cy="40" r="22" fill="#f3c66b" opacity=".55" filter="url(#wc)"/>` + W(100, 110, 90, 26, '#e4d6ae', 0.4) +
    Array.from({ length: 14 }, (_, i) => { const x = 24 + i * 12, t = 30 + (i % 4) * 12; return ink(`M${x},136 Q${x + 4},${t + 30} ${x + 14},${t}`, 1) + `<path d="M${x + 14},${t} q-3,8 -9,14 q6,-2 10,-8 q-3,8 -7,14" fill="#e8c88a" opacity=".85"/>`; }).join(''),
  ),
  frost: () => svg(
    `<rect width="200" height="140" fill="#cfe0ee" opacity=".25"/>` +
    [40, 70, 100, 130, 160].map((x, i) => ink(`M${x},136 L${x + (i % 2 ? 4 : -4)},${50 + (i % 3) * 14}`, 1.2) + dot(x + (i % 2 ? 4 : -4), 48 + (i % 3) * 14, 6, '#5c4330', 0.85)).join('') +
    [40, 70, 100, 130, 160].map((x, i) => `<circle cx="${x + (i % 2 ? 4 : -4)}" cy="${48 + (i % 3) * 14}" r="8" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="1 3" opacity=".9"/>`).join('') +
    [[30, 24], [176, 30], [120, 18], [86, 30]].map(([x, y]) => ink(`M${x - 6},${y} L${x + 6},${y} M${x},${y - 6} L${x},${y + 6} M${x - 4},${y - 4} L${x + 4},${y + 4} M${x - 4},${y + 4} L${x + 4},${y - 4}`, 0.8)).join(''),
  ),
  snowdrop: () => svg(
    W(100, 112, 80, 22, '#cfe0ee', 0.5) +
    [60, 92, 122, 148].map((x, i) => ink(`M${x},136 Q${x + 2},90 ${x + 12},${60 + i * 4}`, 1.1) + `<path d="M${x + 12},${62 + i * 4} q-6,6 -4,18 q4,4 8,0 q2,-12 -4,-18Z" fill="#ffffff" stroke="var(--ink)" stroke-width=".9"/>` + dot(x + 12, 80 + i * 4, 1.6, '#7aa95c')).join('') +
    leaf(66, 128, -80, 26, '#7f9ea0') + leaf(128, 130, -100, 24, '#7f9ea0'),
  ),
  sprout: () => svg(
    W(100, 112, 86, 22, '#a0835e', 0.4) + ink('M14,112 Q100,104 186,112', 1.2) +
    [44, 84, 124, 160].map((x, i) => ink(`M${x},112 Q${x - 2},96 ${x},${86 - i * 3}`, 1.2) + leaf(x, 88 - i * 3, -150, 14 + i * 2) + leaf(x, 88 - i * 3, -30, 14 + i * 2)).join('') +
    ink('M30,30 Q34,24 40,30 M150,24 Q154,18 160,24', 0.8),
  ),
  notebook: () => svg(
    W(100, 72, 70, 50, '#f1d7c4', 0.4) +
    ink('M40,24 L150,24 L150,124 L40,124 Z', 1.4) + ink('M52,24 L52,124', 0.8) +
    [44, 56, 68].map((y) => ink(`M62,${y} L138,${y}`, 0.6)).join('') +
    `<rect x="64" y="78" width="64" height="34" rx="6" fill="#a8c98a" opacity=".45"/>` + [72, 86, 100, 114].map((x, i) => dot(x, 96 - (i % 2) * 6, 4, ['#8e5fc4', '#efc93a', '#e78fb3', '#5b8ee6'][i], 0.8)).join('') +
    ink('M162,30 L180,112', 3) + ink('M178,104 L182,120 L174,110', 1),
  ),
  camera: () => svg(
    W(100, 76, 64, 44, '#9cc4e8', 0.25) +
    ink('M50,52 L150,52 L150,116 L50,116 Z', 1.5) + ink('M80,52 L88,40 L112,40 L120,52', 1.3) +
    `<circle cx="100" cy="84" r="20" fill="#9cc4e8" opacity=".4"/>` + ink('M120,84 A20,20 0 1 1 80,84 A20,20 0 1 1 120,84', 1.4) + daisy(100, 84, 8, '#e78fb3') +
    dot(138, 62, 3, '#e9852f'),
  ),
  shears: () => svg(
    W(96, 74, 66, 46, '#a8c98a', 0.25) +
    `<path d="M104,70 L52,46 Q48,48 52,52 Z" fill="#c9ced4" stroke="var(--ink)" stroke-width="1.2" filter="url(#rough)"/>` +
    `<path d="M104,70 L52,94 Q48,92 52,88 Z" fill="#c9ced4" stroke="var(--ink)" stroke-width="1.2" filter="url(#rough)"/>` +
    ink('M104,70 L138,44 M104,70 L138,96', 2.4) +
    `<ellipse cx="148" cy="38" rx="13" ry="9" fill="#c97b63" opacity=".55" stroke="var(--ink)" stroke-width="1.3" transform="rotate(-30 148 38)"/>` +
    `<ellipse cx="148" cy="102" rx="13" ry="9" fill="#c97b63" opacity=".55" stroke="var(--ink)" stroke-width="1.3" transform="rotate(30 148 102)"/>` +
    dot(104, 70, 2.6, 'var(--ink)') +
    [28, 40].map((x, i) => ink(`M${x},134 L${x + 6},${84 + i * 8}`, 1) + leaf(x + 4, 104 + i * 4, -60 - i * 30, 12)).join(''),
  ),
  spikes: () => svg(
    W(100, 78, 70, 50, '#e78fb3', 0.22) +
    [56, 80, 104, 128, 150].map((x, i) => ink(`M${x},136 Q${x - 2},90 ${x + 2},${34 + (i % 2) * 12}`, 1) + spike(x + 2, 34 + (i % 2) * 12, 34, '#d36a9a')).join(''),
  ),
  plan: () => svg(
    `<rect x="24" y="22" width="152" height="96" rx="10" fill="#a0835e" opacity=".25" filter="url(#wc)"/>` +
    [[50, 44, 14, '#8e5fc4'], [82, 40, 16, '#efc93a'], [116, 46, 14, '#e78fb3'], [150, 42, 13, '#7aa95c'], [60, 84, 12, '#5b8ee6'], [94, 90, 13, '#f3f1ea'], [128, 86, 12, '#8e5fc4'], [156, 92, 10, '#efc93a']].map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity=".7" stroke="var(--ink)" stroke-width=".8" filter="url(#rough)"/>`).join(''),
  ),
};

// 追加のイラスト（菜園・巣箱・虫の宿・夜の庭・スケッチ）
Object.assign(ART, {
  veg: () => svg(
    W(100, 100, 74, 30, '#a8c98a', 0.3) +
    ink('M40,92 L160,92 L148,130 L52,130 Z', 1.5) + ink('M46,104 L154,104 M50,116 L150,116', 0.7) + ink('M60,92 Q100,52 140,92', 1.3) +
    [[66, 84, 11, '#d6463a'], [88, 80, 12, '#e0573a'], [112, 84, 10, '#efc93a'], [132, 86, 9, '#d6463a']].map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity=".8" filter="url(#wc)"/>` + ink(`M${x - r * 0.9},${y} a${r * 0.9},${r * 0.9} 0 1,0 ${r * 1.8},0 a${r * 0.9},${r * 0.9} 0 1,0 -${r * 1.8},0`, 1) + ink(`M${x - 4},${y - r + 1} l4,-4 l4,4`, 0.9)).join('') +
    `<path d="M100,92 q-8,-26 -2,-40" stroke="#7aa95c" stroke-width="6" fill="none" opacity=".5"/>` + leaf(98, 54, -60, 16) + leaf(98, 60, 220, 14),
  ),
  nestbox: () => svg(
    W(100, 70, 60, 50, '#c9a87a', 0.28) +
    ink('M100,18 L100,138', 2.2) + `<rect x="74" y="52" width="52" height="58" fill="#c9a06a" opacity=".55"/>` +
    ink('M74,52 L126,52 L126,110 L74,110 Z', 1.5) + ink('M66,56 L100,30 L134,56', 1.8) + `<circle cx="100" cy="74" r="7" fill="#3a2e24" opacity=".85"/>` +
    ink('M90,90 L110,90', 1) + `<path d="M124,36 q10,-10 22,-6 q-4,8 -14,10 l6,6 q-10,2 -14,-4z" fill="#8d9c8a" opacity=".7"/>` + dot(140, 32, 1.4, 'var(--ink)'),
  ),
  bughotel: () => svg(
    W(100, 76, 66, 48, '#d9c49a', 0.3) +
    ink('M58,48 L100,22 L142,48 L142,124 L58,124 Z', 1.6) + ink('M58,72 L142,72 M58,98 L142,98 M100,48 L100,124', 1) +
    [[70, 60], [80, 62], [90, 58], [112, 60], [124, 62], [134, 58]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#8a6a44" opacity=".75"/>` + ink(`M${x - 3.5},${y} a3.5,3.5 0 1,0 7,0 a3.5,3.5 0 1,0 -7,0`, 0.7)).join('') +
    Array.from({ length: 6 }, (_, i) => ink(`M${62 + i * 6},76 L${62 + i * 6},94`, 0.8)).join('') + `<rect x="104" y="76" width="34" height="18" fill="#b5a079" opacity=".5"/>` +
    [[70, 110], [82, 112], [94, 108], [116, 110], [130, 112]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="4" fill="#a08a6a" opacity=".7"/>`).join('') +
    `<ellipse cx="154" cy="40" rx="5" ry="3" fill="#e8f2f6" stroke="var(--ink)" stroke-width=".8"/><ellipse cx="152" cy="46" rx="4" ry="6" fill="#efc93a" opacity=".85"/>`,
  ),
  night: () => svg(
    `<rect width="200" height="140" fill="#2f3b52" opacity=".16"/>` + `<circle cx="150" cy="34" r="16" fill="#f3e3a6" opacity=".85" filter="url(#wc)"/>` +
    [[30, 24], [60, 14], [92, 30], [118, 16], [176, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#f3e3a6"/>`).join('') +
    ink('M40,138 Q44,100 40,78', 1.1) + ink('M70,138 Q72,110 76,92', 1.1) + daisy(40, 76, 9, '#f6f3ea', '#e0c060') + daisy(76, 90, 8, '#f6f3ea', '#e0c060') +
    ink('M120,120 l10,-6 l10,6', 1.2) + `<path d="M118,122 q12,-12 24,0" fill="#e2a33a" opacity=".35"/>`,
  ),
  sketch: () => svg(
    W(100, 74, 70, 46, '#e4d6ae', 0.3) +
    ink('M40,34 L150,34 L150,124 L40,124 Z', 1.3) + ink('M95,34 L95,124', 0.8) +
    ink('M62,110 Q60,80 66,56', 1) + daisy(66, 54, 9, '#e78fb3') + leaf(64, 86, 200, 12) + leaf(63, 96, -20, 12) +
    ink('M106,56 h30 M106,66 h26 M106,76 h30 M106,86 h20', 0.7) +
    ink('M150,120 L176,72', 2) + `<path d="M176,72 l4,-8 l-1,10z" fill="var(--ink)"/>`,
  ),
});

export const ART_BY_ICON = {
  '❄️': 'frost', '🐦': 'bird', '📖': 'notebook', '🌱': 'snowdrop', '🔥': 'bonfire', '🌿': 'sprout', '🍃': 'tea', '🥢': 'forage',
  '💐': 'bouquet', '💜': 'lavender', '✂️': 'shears', '🦋': 'butterfly', '🌙': 'moon', '🪔': 'spikes', '🌰': 'seed', '🎑': 'moon',
  '🌾': 'grass', '🎨': 'dye', '🍂': 'compost', '🎄': 'wreath', '📷': 'camera',
  '🏠': 'nestbox', '🍅': 'veg', '🐝': 'bughotel', '🔦': 'night', '🔎': 'butterfly', '✏️': 'sketch', '🌼': 'seed', '🫙': 'tea',
  '🍊': 'bird', '🌌': 'night', '🐌': 'sprout', '🥕': 'veg', '🍓': 'veg',
};
export const ART_BY_RECIPE = { dry: 'dry', seed: 'seed', tea: 'tea', potpourri: 'lavender', press: 'press', dye: 'dye', cutflower: 'bouquet', wreath: 'wreath', compost: 'compost', bonfire: 'bonfire', forage: 'forage',
  nestbox: 'nestbox', bughotel: 'bughotel', harvest: 'veg', herbsalt: 'tea', seedball: 'seed', birdfeed: 'bird', survey: 'butterfly', sketch: 'sketch', potager: 'veg' };

export function art(key) { return (ART[key] || ART.sprout)(); }

// ---------- 季節のことば ----------
export const MONTH_OLD = ['睦月', '如月', '弥生', '卯月', '皐月', '水無月', '文月', '葉月', '長月', '神無月', '霜月', '師走'];
export const SEASON_EN = ['Midwinter', 'Late Winter', 'Early Spring', 'Spring', 'Late Spring', 'Early Summer', 'Midsummer', 'Late Summer', 'Early Autumn', 'Autumn', 'Late Autumn', 'Early Winter'];

// 二十四節気（おおよその日付）
const SEKKI = [
  [1, 5, '小寒', '寒の入り。寒さが本格的になる頃'], [1, 20, '大寒', '一年でもっとも寒さが厳しい頃'],
  [2, 4, '立春', '暦の上で春が始まる頃'], [2, 19, '雨水', '雪が雨に変わり、氷が解けはじめる頃'],
  [3, 5, '啓蟄', '土の中の虫たちが目覚める頃'], [3, 20, '春分', '昼と夜の長さがほぼ同じになる頃'],
  [4, 4, '清明', '万物が清らかで生き生きとする頃'], [4, 20, '穀雨', '穀物を潤す春の雨が降る頃'],
  [5, 5, '立夏', '夏の気配が感じられる頃'], [5, 21, '小満', '草木が茂り、天地に満ちはじめる頃'],
  [6, 5, '芒種', '穂の出る植物の種をまく頃'], [6, 21, '夏至', '一年でもっとも昼が長い頃'],
  [7, 7, '小暑', '本格的な暑さが始まる頃'], [7, 22, '大暑', '一年でもっとも暑さが厳しい頃'],
  [8, 7, '立秋', '暦の上で秋が始まる頃'], [8, 23, '処暑', '暑さがおさまりはじめる頃'],
  [9, 7, '白露', '草花に朝露が宿りはじめる頃'], [9, 23, '秋分', '昼と夜の長さがほぼ同じになる頃'],
  [10, 8, '寒露', '露が冷たく感じられる頃'], [10, 23, '霜降', '朝夕に霜が降りはじめる頃'],
  [11, 7, '立冬', '冬の気配が立ちはじめる頃'], [11, 22, '小雪', '山に初雪が舞いはじめる頃'],
  [12, 7, '大雪', '雪が本格的に降りはじめる頃'], [12, 21, '冬至', '一年でもっとも昼が短い頃'],
];
export function sekkiOf(date = new Date()) {
  const m = date.getMonth() + 1, d = date.getDate();
  let cur = SEKKI[SEKKI.length - 1];
  for (const s of SEKKI) if (m > s[0] || (m === s[0] && d >= s[1])) cur = s;
  return { name: cur[2], text: cur[3] };
}
