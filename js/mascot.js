// 線画アイコンと、案内役の小鳥「ツピ」（シジュウカラ）。すべてオリジナルのSVG。

// ---------- 線画アイコン ----------
const P = {
  home: 'M12 3.2 3.5 10.5V20h17v-9.5L12 3.2Z M12 11.2a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6Z M12 15.8V20',
  book: 'M4 5.5c3-1.2 5.5-.8 8 1 2.5-1.8 5-2.2 8-1V19c-3-1.2-5.5-.8-8 1-2.5-1.8-5-2.2-8-1V5.5Z M12 6.5V20 M15 10.5c1-.6 2-.8 3-.7',
  plan: 'M4 20c5-1 9-5 12.5-12.5L19 5l-2 1c-7 3-11 7-13 14Z M4 20l5.5-6.5 M14 4.5l1 2 M20 10l-2-1',
  pot: 'M6.5 12h11l-1.2 8H7.7L6.5 12Z M5 12h14 M12 12V7.5 M12 9c-.5-2.5-2.5-4-5-4 0 2.5 2 4.3 5 4Z M12 7.5c.5-2 2-3.3 4.5-3.5 0 2.2-1.8 3.7-4.5 3.5Z',
  calendar: 'M4.5 6.5h15V20h-15V6.5Z M4.5 10.5h15 M8.5 4v4 M15.5 4v4 M9 14.5l2 2 4-4',
  cup: 'M5 10h11v4.5a5.5 5.5 0 0 1-11 0V10Z M16 11.5h1.5a2.3 2.3 0 0 1 0 4.6H16 M8 6.5c0-1 .8-1.3.8-2.3 M11.5 6.5c0-1 .8-1.3.8-2.3 M4 20.5h13',
  pin: 'M12 21s6.5-6 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5 6.5 11 6.5 11Z M12 7.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z',
  search: 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z M15.3 15.3 20 20',
  plus: 'M12 5v14 M5 12h14',
  cart: 'M4 5h2.2l2 10h9.3l1.7-7H7 M9.5 19.5a1 1 0 1 0 0-.01 M17 19.5a1 1 0 1 0 0-.01',
  cloud: 'M7.5 18.5a4 4 0 0 1-.6-7.95A5.5 5.5 0 0 1 17.6 9.6 4.5 4.5 0 0 1 17 18.5H7.5Z',
  note: 'M6 4h9l4 4v12H6V4Z M15 4v4h4 M9 12h7 M9 15.5h5',
  save: 'M5 4h11l3 3v13H5V4Z M8 4v5h7V4 M8.5 20v-6h7v6',
  sprout: 'M12 20v-8 M12 13c-.6-3-3-5-6.5-5 0 3.2 2.6 5.4 6.5 5Z M12 11c.6-2.6 2.6-4.3 6-4.5 0 2.9-2.3 4.8-6 4.5Z M6 20h12',
  bug: 'M12 8a4 4 0 0 0-4 4v3a4 4 0 0 0 8 0v-3a4 4 0 0 0-4-4Z M9.5 8.5 8 6 M14.5 8.5 16 6 M8 13H4.5 M16 13h3.5 M8.3 16.5 5.5 19 M15.7 16.5l2.8 2.5 M12 11v8',
  drop: 'M12 3.5s6 6.3 6 10.8a6 6 0 0 1-12 0C6 9.800 12 3.5 12 3.5Z',
  scissors: 'M7 7.2a2.2 2.2 0 1 0 0 .01 M7 16.800a2.200 2.200 0 1 0 0 .010 M8.800 8.500 20 17 M8.800 15.500 20 7',
  trowel: 'M13.5 10.5 19 5l.5 2.500-5 4.500 M13.5 10.500c-3.500-.500-7 2-8.500 8.500 6.500-1.500 9-5 8.500-8.500Z',
  divide: 'M12 20v-9 M12 14c-3 0-5-2-5.500-5 3 .2 5 2 5.500 5Z M12 12c.5-3 2.500-4.800 5.500-5 0 3-2.500 5-5.500 5Z M4 20h16 M12 4v3',
  scarf: 'M6 9c2 1.500 10 1.500 12 0v3.500c-2 1.500-10 1.500-12 0V9Z M14 13.200V20l2-1.500 2 1.500v-7.800 M9 6.500a3 3 0 0 1 6 0',
  feed: 'M8 4h8l-1 4.500 3 3V20H6v-8.500l3-3L8 4Z M9.500 14.500h5',
  eye: 'M2.500 12s3.500-6 9.500-6 9.500 6 9.500 6-3.500 6-9.500 6-9.500-6-9.500-6Z M12 9.200a2.800 2.800 0 1 0 0 5.600 2.800 2.800 0 0 0 0-5.600Z',
  spore: 'M12 12a3 3 0 1 0 0 .01 M5.500 7a1.200 1.200 0 1 0 0 .01 M18.500 6.500a1.200 1.200 0 1 0 0 .01 M6 17.500a1.200 1.200 0 1 0 0 .01 M18 17.500a1.200 1.200 0 1 0 0 .01',
  thermo: 'M12 4a2 2 0 0 0-2 2v8.200a4 4 0 1 0 4 0V6a2 2 0 0 0-2-2Z M12 10v7',
  refresh: 'M19 8a8 8 0 1 0 1.500 6 M19 3.500V8h-4.500',
  leaf: 'M5 19C5 10 10 5 19 5c0 9-5 14-14 14Z M5 19 14 10',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  bulb: 'M9 17.500h6 M10 20.500h4 M12 3.500a6 6 0 0 0-3.500 10.900c.6.5 1 1.200 1 2.100h5c0-.9.4-1.600 1-2.100A6 6 0 0 0 12 3.500Z',
  basket: 'M4 10h16l-1.6 9.5H5.6L4 10Z M8 10l3-5.5 M16 10l-3-5.5 M9 13v4 M12 13v4 M15 13v4',
  camera: 'M4 8h3.5l1.5-2.5h6L16.5 8H20v11H4V8Z M12 10.5a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Z',
  sun: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z M12 3v2 M12 19v2 M3 12h2 M19 12h2 M5.6 5.6 7 7 M17 17l1.4 1.4 M5.6 18.4 7 17 M17 7l1.4-1.4',
  butterfly: 'M12 8v11 M12 9c-2-4-8-5-8-1.5 0 3 3.5 4.5 8 4.5 M12 9c2-4 8-5 8-1.5 0 3-3.5 4.5-8 4.5 M12 12c-3 0-6 1.5-5 4s3.5 1 5-2 M12 12c3 0 6 1.5 5 4s-3.5 1-5-2 M11 7.5 9.5 5 M13 7.5 14.5 5',
  pen: 'M5 19l1-4L16 5l3 3L9 18l-4 1Z M14 7l3 3',
  trash: 'M5 7h14 M10 7V4.5h4V7 M7 7l1 13h8l1-13 M10.5 10.5v6 M13.5 10.5v6',
  list: 'M9 6h11 M9 12h11 M9 18h11 M4.5 6h.5 M4.5 12h.5 M4.5 18h.5',
  steps: 'M4 19h5v-5h5V9h6 M17 6l3 3-3 3',
  guide: 'M4.500 6.500 12 4l7.500 2.500v11L12 20l-7.500-2.500v-11Z M12 4v16',
};
export function icon(name, size = 20) {
  return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[name] || P.leaf}"/></svg>`;
}
export const TASK_ICON = { plant: 'trowel', divide: 'divide', cut: 'scissors', protect: 'scarf', feed: 'feed', water: 'drop', pest: 'eye', sow: 'sprout', harvest: 'basket' };
export const PEST_ICON = { '病気': 'spore', '害虫': 'bug', '生理障害': 'thermo' };

// ---------- 小鳥のツピ ----------
// pose: hello（手を振る）/ idle / happy（にっこり）/ think（首をかしげる）/ alert（びっくり）/ sleep（うとうと）/ sprout（芽を持つ）
export function tsupi(pose = 'idle', size = 72) {
  const ink = '#2b2a22', cream = '#f7f1e3', wing = '#8d9c8a', ochre = '#d99a3a';
  const tilt = pose === 'think' ? -9 : pose === 'happy' ? 4 : 0;
  const eyes = pose === 'happy' || pose === 'sleep'
    ? `<path d="M45 44q4 ${pose === 'sleep' ? 3 : -4} 8 0 M67 44q4 ${pose === 'sleep' ? 3 : -4} 8 0" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`
    : `<circle cx="49" cy="43" r="${pose === 'alert' ? 3.8 : 3.1}" fill="${ink}"/><circle cx="71" cy="43" r="${pose === 'alert' ? 3.8 : 3.1}" fill="${ink}"/><circle cx="50.200" cy="41.800" r="1" fill="#fff"/><circle cx="72.200" cy="41.800" r="1" fill="#fff"/>`;
  const rightWing = pose === 'hello'
    ? `<ellipse cx="93" cy="58" rx="9" ry="17" fill="${wing}" stroke="${ink}" stroke-width="1.600" transform="rotate(38 88 70)"><animateTransform attributeName="transform" type="rotate" values="38 88 70;22 88 70;38 88 70" dur="1.200s" repeatCount="3"/></ellipse>`
    : `<ellipse cx="89" cy="76" rx="9" ry="18" fill="${wing}" stroke="${ink}" stroke-width="1.600" transform="rotate(-14 89 76)"/>`;
  const extra = {
    alert: `<path d="M98 16v12" stroke="#b5653f" stroke-width="3.400" stroke-linecap="round"/><circle cx="98" cy="35" r="2" fill="#b5653f"/>`,
    think: `<path d="M94 18c0-5 8-5 8 0 0 3.500-4 3.500-4 7" fill="none" stroke="#b5653f" stroke-width="2.600" stroke-linecap="round"/><circle cx="98" cy="30.500" r="1.700" fill="#b5653f"/>`,
    happy: `<path transform="translate(8 -4)" d="M96 14v10c-3.500-1.500-6 2.500-2 3.500 2.500.5 4-1 4-3" fill="none" stroke="#b5653f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    sleep: `<path d="M90 22h7l-7 8h7 M101 10h5l-5 6h5" fill="none" stroke="#8a8472" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round"/>`,
    sprout: `<path d="M97 80V62" stroke="#4f6f4a" stroke-width="2" stroke-linecap="round"/><path d="M97 66c-1-5-5-7-9-7 0 5 4 8 9 7Z M97 63c1-4 4-6 8-6 0 4-3 7-8 6Z" fill="#8fb07a" stroke="#4f6f4a" stroke-width="1.200" stroke-linejoin="round"/>`,
  }[pose] || '';
  return `<svg class="tsupi-svg" width="${size}" height="${size}" viewBox="0 0 120 120" role="img" aria-label="小鳥のツピ">
    <path d="M30 92 12 104l20-3Z" fill="${wing}" stroke="${ink}" stroke-width="1.600" stroke-linejoin="round"/>
    <ellipse cx="60" cy="76" rx="32" ry="29" fill="${cream}" stroke="${ink}" stroke-width="1.800"/>
    <path d="M60 62v32" stroke="${ink}" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="31" cy="76" rx="9" ry="18" fill="${wing}" stroke="${ink}" stroke-width="1.600" transform="rotate(14 31 76)"/>
    ${rightWing}
    <g transform="rotate(${tilt} 60 60)">
      <circle cx="60" cy="42" r="25" fill="${ink}"/>
      <ellipse cx="47" cy="47" rx="12.500" ry="11" fill="#fffdf6"/><ellipse cx="73" cy="47" rx="12.500" ry="11" fill="#fffdf6"/>
      <circle cx="42" cy="52" r="3.600" fill="#e7a3a0" opacity=".65"/><circle cx="78" cy="52" r="3.600" fill="#e7a3a0" opacity=".65"/>
      ${eyes}
      <path d="M55.500 49h9L60 56Z" fill="${ochre}" stroke="${ink}" stroke-width="1.200" stroke-linejoin="round"/>
    </g>
    <path d="M50 104v7m-4 0h8 M70 104v7m-4 0h8" stroke="${ochre}" stroke-width="2.400" stroke-linecap="round"/>
    ${extra}
  </svg>`;
}

/** ツピの吹き出し */
export function tsupiSays(text, pose = 'idle', extraHtml = '') {
  return `<div class="tsupi"><div class="tsupi-bird">${tsupi(pose, 76)}</div><div class="bubble"><span class="who">ツピ</span><p>${text}</p>${extraHtml}</div></div>`;
}

// 月ごとのひとこと（北半球の月）
export const MONTHLY_WORDS = [
  '霜の朝は、枯れ姿がいちばんきれいな時間だよ。温かい飲みものを持って庭へどうぞ。',
  '土の下では、もう新芽が動きはじめているよ。スノードロップを探してみて。',
  '芽吹きの季節！ 枯れた茎を刈ったら、新芽に光を当ててあげよう。',
  'ぐんぐん伸びる季節。株分けや植え付けにぴったりだよ。',
  '花がいっせいに咲きはじめたね。背の高くなる花は、今のうちに摘心しておこう。',
  '梅雨の前に、込み合った株を透かして風を通してあげてね。',
  '暑い日の水やりは朝か夕方に。蝶や蜂がたくさん遊びに来る季節だよ。',
  '夕暮れの庭がきもちいい季節。種が実ってきたら、少し集めておこう。',
  '秋の七草が咲く頃。十五夜にはススキを飾ってみない？',
  'グラスの穂が光を受けてきらきらする季節。秋植えにもいい時期だよ。',
  '落ち葉は宝もの。集めて堆肥にしよう。種の頭は、ぼくらのごはんに少し残してね。',
  '1年おつかれさま。写真を見返して、来年の庭を思い描こう。',
];
