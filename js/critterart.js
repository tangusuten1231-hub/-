// 生き物図鑑のイラスト（形の種類 × 色で描く、オリジナルのSVG）
import { INFO } from './critterinfo.js';

const INK = '#2b2a22';
const st = `stroke="${INK}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"`;
const eye = (x, y, r = 1.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`;
const ant = (x, y, dx, dy) => `<path d="M${x} ${y} q${dx / 2} ${dy - 3} ${dx} ${dy}" fill="none" ${st}/><circle cx="${x + dx}" cy="${y + dy}" r="1.3" fill="${INK}"/>`;

const SHAPES = {
  butterfly: ([a, b, c]) => `
    <path d="M50 38 C38 14 14 14 16 30 C17 40 34 42 50 40Z" fill="${a}" ${st}/><path d="M50 38 C62 14 86 14 84 30 C83 40 66 42 50 40Z" fill="${a}" ${st}/>
    <path d="M50 41 C36 44 26 58 34 62 C42 65 48 54 50 44Z" fill="${a}" ${st}/><path d="M50 41 C64 44 74 58 66 62 C58 65 52 54 50 44Z" fill="${a}" ${st}/>
    <path d="M22 24 q6 4 12 2 M78 24 q-6 4 -12 2" stroke="${b}" stroke-width="3" fill="none" opacity=".8"/>
    <circle cx="33" cy="56" r="2.6" fill="${c}"/><circle cx="67" cy="56" r="2.6" fill="${c}"/>
    <path d="M50 30 L50 56" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>${ant(50, 30, -7, -10)}${ant(50, 30, 7, -10)}`,
  swallowtail: ([a, b, c]) => SHAPES.butterfly([a, b, c]) + `<path d="M36 61 l-3 9 M64 61 l3 9" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M24 22 L40 36 M30 18 L44 34 M76 22 L60 36 M70 18 L56 34" stroke="${b}" stroke-width="1.6" opacity=".9"/>`,
  small: ([a, b, c]) => `<g transform="translate(50 42) scale(.72) translate(-50 -42)">${SHAPES.butterfly([a, b, c])}</g>`,
  skipper: ([a, b, c]) => `
    <path d="M50 40 L22 26 Q16 34 26 42Z" fill="${a}" ${st}/><path d="M50 40 L78 26 Q84 34 74 42Z" fill="${a}" ${st}/>
    <path d="M50 42 L32 50 Q34 58 46 50Z" fill="${b}" ${st}/><path d="M50 42 L68 50 Q66 58 54 50Z" fill="${b}" ${st}/>
    <circle cx="36" cy="51" r="1.4" fill="${c}"/><circle cx="64" cy="51" r="1.4" fill="${c}"/>
    <ellipse cx="50" cy="44" rx="4" ry="12" fill="${b}" ${st}/>${eye(48, 34, 1.4)}${eye(52, 34, 1.4)}${ant(48, 32, -8, -8)}${ant(52, 32, 8, -8)}`,
  hawkmoth: ([a, b, c]) => `
    <path d="M50 38 L18 30 Q14 40 30 44Z" fill="${a}" ${st}/><path d="M50 38 L82 30 Q86 40 70 44Z" fill="${a}" ${st}/>
    <path d="M50 42 L30 48 Q32 54 46 48Z" fill="${b}" ${st}/><path d="M50 42 L70 48 Q68 54 54 48Z" fill="${b}" ${st}/>
    <ellipse cx="50" cy="46" rx="6" ry="16" fill="${a}" ${st}/><path d="M45 50 h10 M45 55 h10" stroke="${c}" stroke-width="1.6"/>
    ${eye(47, 33)}${eye(53, 33)}<path d="M50 30 q-2 -8 -10 -12" fill="none" ${st}/>`,
  bee: ([a, b, c]) => `
    <ellipse cx="38" cy="30" rx="12" ry="7" fill="${c}" opacity=".7" ${st} transform="rotate(-25 38 30)"/><ellipse cx="62" cy="30" rx="12" ry="7" fill="${c}" opacity=".7" ${st} transform="rotate(25 62 30)"/>
    <ellipse cx="50" cy="48" rx="13" ry="16" fill="${a}" ${st}/><path d="M38 44 h24 M37 51 h26 M40 58 h20" stroke="${b}" stroke-width="3.4"/>
    <circle cx="50" cy="30" r="7" fill="${b}" ${st}/>${eye(47, 29)}${eye(53, 29)}${ant(47, 25, -6, -8)}${ant(53, 25, 6, -8)}`,
  bumble: ([a, b, c]) => `
    <ellipse cx="36" cy="28" rx="12" ry="7" fill="#e8f0f2" opacity=".7" ${st} transform="rotate(-25 36 28)"/><ellipse cx="64" cy="28" rx="12" ry="7" fill="#e8f0f2" opacity=".7" ${st} transform="rotate(25 64 28)"/>
    <ellipse cx="50" cy="48" rx="17" ry="18" fill="${a}" ${st}/><path d="M35 40 q15 -6 30 0" stroke="${b}" stroke-width="6" fill="none"/><path d="M38 58 q12 5 24 0" stroke="${c}" stroke-width="5" fill="none"/>
    <circle cx="50" cy="30" r="8" fill="${a}" ${st}/>${eye(47, 29)}${eye(53, 29)}${ant(47, 24, -6, -8)}${ant(53, 24, 6, -8)}`,
  hover: ([a, b, c]) => `
    <ellipse cx="34" cy="38" rx="16" ry="6" fill="${c}" opacity=".7" ${st} transform="rotate(-10 34 38)"/><ellipse cx="66" cy="38" rx="16" ry="6" fill="${c}" opacity=".7" ${st} transform="rotate(10 66 38)"/>
    <ellipse cx="50" cy="50" rx="9" ry="15" fill="${a}" ${st}/><path d="M42 46 h16 M41 53 h18 M43 60 h14" stroke="${b}" stroke-width="2.6"/>
    <circle cx="50" cy="32" r="7" fill="#b5532f" ${st}/>`,
  wasp: ([a, b, c]) => `
    <ellipse cx="36" cy="30" rx="13" ry="5" fill="${c}" opacity=".7" ${st} transform="rotate(-20 36 30)"/><ellipse cx="64" cy="30" rx="13" ry="5" fill="${c}" opacity=".7" ${st} transform="rotate(20 64 30)"/>
    <ellipse cx="50" cy="36" rx="6" ry="7" fill="${b}" ${st}/><ellipse cx="50" cy="55" rx="8" ry="12" fill="${a}" ${st}/><path d="M43 52 h14 M43 58 h14" stroke="${b}" stroke-width="2.6"/>
    <path d="M44 62 l-8 14 M56 62 l8 14" ${st}/><circle cx="50" cy="26" r="5.5" fill="${a}" ${st}/>${eye(48, 25, 1.3)}${eye(52, 25, 1.3)}${ant(48, 21, -6, -7)}${ant(52, 21, 6, -7)}`,
  ladybird: ([a, b]) => `
    <path d="M30 44 h-8 M30 52 h-9 M32 60 l-7 6 M70 44 h8 M70 52 h9 M68 60 l7 6" ${st}/>
    <ellipse cx="50" cy="50" rx="20" ry="18" fill="${a}" ${st}/><path d="M50 33 V68" ${st}/>
    ${[[42, 44], [58, 44], [40, 56], [60, 56], [50, 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${b}"/>`).join('')}
    <path d="M38 34 Q50 24 62 34Z" fill="${INK}"/><circle cx="44" cy="31" r="1.6" fill="#fff"/><circle cx="56" cy="31" r="1.6" fill="#fff"/>`,
  beetle: ([a, b]) => `
    <path d="M32 44 h-9 M32 54 h-10 M34 62 l-7 7 M68 44 h9 M68 54 h10 M66 62 l7 7" ${st}/>
    <ellipse cx="50" cy="52" rx="17" ry="20" fill="${a}" ${st}/><path d="M50 36 V71" ${st}/>
    ${[[43, 50], [57, 50], [44, 60], [56, 60], [46, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${b}"/>`).join('')}
    <path d="M40 34 Q50 24 60 34 Q50 38 40 34Z" fill="${a}" ${st}/>${ant(46, 28, -6, -6)}${ant(54, 28, 6, -6)}`,
  dragonfly: ([a, b, c]) => `
    <ellipse cx="32" cy="32" rx="18" ry="5" fill="${c}" opacity=".7" ${st} transform="rotate(-8 32 32)"/><ellipse cx="68" cy="32" rx="18" ry="5" fill="${c}" opacity=".7" ${st} transform="rotate(8 68 32)"/>
    <ellipse cx="33" cy="42" rx="16" ry="5" fill="${c}" opacity=".7" ${st} transform="rotate(10 33 42)"/><ellipse cx="67" cy="42" rx="16" ry="5" fill="${c}" opacity=".7" ${st} transform="rotate(-10 67 42)"/>
    <rect x="47" y="30" width="6" height="44" rx="3" fill="${a}" ${st}/><path d="M47 66 h6 M47 70 h6" stroke="${b}" stroke-width="2"/>
    <circle cx="46" cy="27" r="4.4" fill="${a}" ${st}/><circle cx="54" cy="27" r="4.4" fill="${a}" ${st}/>`,
  damsel: ([a, b, c]) => `
    <path d="M50 34 L22 26 Q20 30 48 36Z M50 34 L78 26 Q80 30 52 36Z" fill="${c}" opacity=".7" ${st}/>
    <rect x="48.5" y="30" width="3" height="46" rx="1.5" fill="${a}" ${st}/><path d="M48.5 70 h3" stroke="${b}" stroke-width="2"/>
    <circle cx="46" cy="28" r="3" fill="${a}" ${st}/><circle cx="54" cy="28" r="3" fill="${a}" ${st}/>`,
  grasshopper: ([a, b]) => `
    <path d="M20 46 L76 36 L84 40 L76 46 Z" fill="${a}" ${st}/><path d="M28 44 L70 38" stroke="${b}" stroke-width="1.6"/>
    <path d="M50 44 L58 60 L66 62 M42 45 L40 58 M60 42 L70 56 L56 70" fill="none" ${st}/>
    <circle cx="80" cy="39" r="1.5" fill="${INK}"/><path d="M84 38 q8 -8 12 -16 M83 37 q4 -10 4 -18" fill="none" ${st}/>`,
  cricket: ([a, b]) => `
    <ellipse cx="50" cy="48" rx="20" ry="10" fill="${a}" ${st}/><path d="M34 44 q16 -6 30 0" stroke="${b}" stroke-width="2" fill="none"/>
    <circle cx="72" cy="46" r="7" fill="${a}" ${st}/>${eye(75, 44)}<path d="M76 41 q10 -14 22 -18 M74 40 q2 -14 10 -22" fill="none" ${st}/>
    <path d="M40 54 L30 66 L22 64 M54 56 L52 68 M62 55 L68 66" fill="none" ${st}/><path d="M30 46 l-12 -4 M30 50 l-12 2" ${st}/>`,
  mantis: ([a, b]) => `
    <path d="M30 66 Q44 52 54 42" stroke="${a}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M30 66 Q44 52 54 42" ${st} fill="none" opacity=".6"/>
    <path d="M54 42 L62 22" stroke="${a}" stroke-width="4" stroke-linecap="round"/>
    <path d="M58 30 L48 22 L44 30 M60 32 L54 20 L48 24" fill="none" stroke="${b}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M58 16 L68 14 L64 22Z" fill="${a}" ${st}/>${eye(60, 16, 1.4)}${eye(66, 15, 1.4)}
    <path d="M44 54 L38 70 M50 48 L60 64" ${st}/>`,
  cicada: ([a, b, c]) => `
    <path d="M50 30 L26 62 Q34 70 48 48Z" fill="${c}" opacity=".75" ${st}/><path d="M50 30 L74 62 Q66 70 52 48Z" fill="${c}" opacity=".75" ${st}/>
    <ellipse cx="50" cy="44" rx="9" ry="16" fill="${a}" ${st}/><path d="M43 34 q7 -6 14 0" stroke="${b}" stroke-width="2" fill="none"/>
    <circle cx="41" cy="30" r="3.4" fill="${b}" ${st}/><circle cx="59" cy="30" r="3.4" fill="${b}" ${st}/>`,
  bird: ([a, b, c]) => `
    <path d="M24 62 L10 72 L28 68Z" fill="${a}" ${st}/>
    <ellipse cx="46" cy="52" rx="24" ry="18" fill="${b}" ${st}/><path d="M28 46 Q40 34 60 42 Q54 58 36 60Z" fill="${a}" ${st}/>
    <circle cx="66" cy="34" r="12" fill="${a}" ${st}/><path d="M77 32 L86 34 L77 37Z" fill="${c === INK ? '#6e5a3a' : c}" ${st}/>
    <circle cx="69" cy="32" r="2" fill="${INK}"/><path d="M44 70 v6 M52 70 v6" ${st}/>`,
  longtail: ([a, b, c]) => `<path d="M30 58 L4 70 L6 74 L32 64Z" fill="${INK}" ${st}/>` + SHAPES.bird([b, a, c]).replace(/<path d="M24 62 L10 72 L28 68Z"[^>]*\/>/, '') + `<path d="M60 26 q6 -4 12 0" stroke="${INK}" stroke-width="2.2" fill="none"/>`,
  swallow: ([a, b, c]) => `
    <path d="M30 52 L4 66 L16 56 L2 58 L28 48Z" fill="${a}" ${st}/>
    <path d="M44 46 L20 22 L58 40Z" fill="${a}" ${st}/><path d="M48 46 L80 26 L62 46Z" fill="${a}" ${st}/>
    <ellipse cx="48" cy="52" rx="20" ry="10" fill="${c}" ${st}/><path d="M32 48 Q48 40 66 46 Q56 54 34 54Z" fill="${a}" ${st}/>
    <circle cx="68" cy="46" r="8" fill="${a}" ${st}/><path d="M64 52 q4 3 9 0" stroke="${b}" stroke-width="3.4" fill="none"/>${eye(70, 44)}<path d="M76 45 l5 1 -5 2" fill="${INK}"/>`,
  wagtail: ([a, b, c]) => `
    <path d="M28 56 L2 50 L2 55 L28 60Z" fill="${b}" ${st}/>
    <ellipse cx="44" cy="54" rx="20" ry="11" fill="${a}" ${st}/><path d="M28 50 Q42 42 58 48 Q52 58 32 58Z" fill="${c}" ${st}/>
    <circle cx="62" cy="42" r="10" fill="${a}" ${st}/><path d="M56 34 q8 -4 14 2 l-2 4 q-6 -3 -12 0Z" fill="${b}"/><path d="M58 50 q6 2 10 -2" stroke="${b}" stroke-width="3" fill="none"/>
    ${eye(65, 41)}<path d="M71 42 l7 1 -7 2" fill="${INK}"/><path d="M42 64 v8 M50 64 v8" ${st}/>`,
  pigeon: ([a, b, c]) => `
    <path d="M22 58 L6 64 L24 66Z" fill="${b}" ${st}/>
    <ellipse cx="44" cy="52" rx="26" ry="16" fill="${a}" ${st}/>
    ${[[34, 46], [42, 44], [50, 46], [38, 54], [46, 54]].map(([x, y]) => `<path d="M${x} ${y} q3 3 6 0" stroke="${b}" stroke-width="1.6" fill="none"/>`).join('')}
    <circle cx="68" cy="38" r="10" fill="${a}" ${st}/><path d="M60 44 h8 M60 47 h8" stroke="${c}" stroke-width="1.8"/>${eye(71, 36)}<path d="M77 38 l6 1 -6 2" fill="${INK}"/><path d="M42 66 v6 M50 66 v6" stroke="#c94a4a" stroke-width="1.6"/>`,
  frog: ([a, b]) => `
    <path d="M26 64 Q16 66 18 72 h12 M74 64 Q84 66 82 72 h-12" fill="${a}" ${st}/>
    <ellipse cx="50" cy="54" rx="24" ry="17" fill="${a}" ${st}/><ellipse cx="50" cy="60" rx="15" ry="9" fill="${b}"/>
    <circle cx="38" cy="38" r="8" fill="${a}" ${st}/><circle cx="62" cy="38" r="8" fill="${a}" ${st}/><circle cx="38" cy="37" r="3.2" fill="${INK}"/><circle cx="62" cy="37" r="3.2" fill="${INK}"/>
    <path d="M30 42 L22 50 M70 42 L78 50" stroke="${INK}" stroke-width="2.6"/><path d="M42 52 q8 5 16 0" fill="none" ${st}/>`,
  lizard: ([a, b]) => `
    <path d="M18 50 Q34 40 50 48 Q66 56 82 46 Q90 42 96 48" fill="none" stroke="${a}" stroke-width="10" stroke-linecap="round"/>
    <path d="M70 52 Q84 48 96 48" fill="none" stroke="${b}" stroke-width="5" stroke-linecap="round" opacity=".8"/>
    <path d="M30 48 l-4 10 M30 46 l-2 -10 M54 50 l2 10 M54 48 l4 -10" ${st}/>
    <ellipse cx="14" cy="50" rx="9" ry="6" fill="${a}" ${st}/>${eye(11, 48)}`,
  gecko: ([a, b]) => `
    <path d="M50 18 Q46 40 50 60 Q54 74 46 82" fill="none" stroke="${a}" stroke-width="9" stroke-linecap="round"/>
    <path d="M48 32 L34 24 M52 32 L66 24 M48 56 L34 64 M52 56 L66 64" stroke="${a}" stroke-width="3.4" stroke-linecap="round"/>
    ${[[33, 23], [67, 23], [33, 65], [67, 65]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${b}"/>`).join('')}
    <ellipse cx="50" cy="16" rx="7" ry="8" fill="${a}" ${st}/>${eye(47, 14)}${eye(53, 14)}`,
  bat: ([a, b]) => `
    <path d="M50 40 Q36 26 10 32 Q18 38 16 44 Q24 42 28 48 Q34 44 40 50 Q44 44 50 46Z" fill="${a}" ${st}/>
    <path d="M50 40 Q64 26 90 32 Q82 38 84 44 Q76 42 72 48 Q66 44 60 50 Q56 44 50 46Z" fill="${a}" ${st}/>
    <ellipse cx="50" cy="44" rx="7" ry="10" fill="${b}" ${st}/><path d="M45 34 l-2 -7 4 4 M55 34 l2 -7 -4 4" fill="${b}" ${st}/>${eye(47, 39, 1.3)}${eye(53, 39, 1.3)}`,
  worm: ([a, b]) => `
    <path d="M14 56 Q26 40 40 54 Q54 68 68 52 Q78 42 88 50" fill="none" stroke="${a}" stroke-width="8" stroke-linecap="round"/>
    <path d="M58 60 l4 -6" stroke="${b}" stroke-width="7" stroke-linecap="round"/>
    <path d="M30 44 l1 6 M46 60 l-2 6 M76 46 l0 6" stroke="${b}" stroke-width="1.2" opacity=".6"/>`,
  spider: ([a, b, c]) => `
    <path d="M30 20 L70 70 M70 20 L30 70 M50 14 V76 M22 45 H78" stroke="#c9c3b0" stroke-width=".8"/>
    <path d="M44 40 L26 28 L20 36 M44 46 L22 46 L18 56 M56 40 L74 28 L80 36 M56 46 L78 46 L82 56 M45 50 L32 62 M55 50 L68 62" fill="none" ${st}/>
    <ellipse cx="50" cy="54" rx="8" ry="13" fill="${a}" ${st}/><path d="M43 50 h14 M43 56 h14" stroke="${b}" stroke-width="2.4"/><circle cx="50" cy="64" r="2.6" fill="${c}"/>
    <circle cx="50" cy="38" r="5" fill="${b}" ${st}/>`,
  snail: ([a, b, c]) => `
    <path d="M18 66 Q20 58 34 58 L72 58 Q84 58 86 46 L90 40" fill="${c}" ${st}/>
    <path d="M86 46 L84 34 M90 42 L94 32" ${st}/><circle cx="84" cy="33" r="1.6" fill="${INK}"/><circle cx="94" cy="31" r="1.6" fill="${INK}"/>
    <circle cx="50" cy="44" r="18" fill="${a}" ${st}/><path d="M50 44 m0 -12 a12 12 0 1 1 -11 8 a8 8 0 1 1 10 6 a4 4 0 1 1 1 -6" fill="none" stroke="${b}" stroke-width="2"/>`,
  pillbug: ([a, b]) => `
    <path d="M22 60 Q22 30 50 28 Q78 30 78 60Z" fill="${a}" ${st}/>
    ${[34, 42, 50, 58, 66].map((x) => `<path d="M${x} ${x === 50 ? 28 : 30} Q${x + (x - 50) * 0.2} 44 ${x + (x - 50) * 0.3} 60" stroke="${b}" stroke-width="1.6" fill="none"/>`).join('')}
    <path d="M24 62 h52" ${st}/><path d="M20 56 q-6 -4 -10 -12 M22 58 q-8 0 -12 -4" fill="none" ${st}/>`,
};

/** 生き物のイラスト */
export function critterSVG(id, size = 72) {
  const inf = INFO[id];
  if (!inf) return '';
  const draw = SHAPES[inf.shape] || SHAPES.butterfly;
  return `<svg class="critter-svg" viewBox="0 0 100 82" width="${size}" height="${Math.round(size * 0.82)}" role="img" aria-hidden="true">${draw(inf.col)}</svg>`;
}
