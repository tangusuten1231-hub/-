// 植栽プランのイメージ図（SVG）を描く：季節ごとの立面図・平面図・植物のイラスト
import { COLORS, LEAF } from './plants.js';
import { rng, LAYER_JA } from './plan.js';
import { localMonth } from './garden.js';

const GROWTH = [0.12, 0.15, 0.35, 0.6, 0.85, 1, 1, 1, 1, 0.95, 0.75, 0.3]; // 北半球の月ごとの生育度
const SKY = { winter: ['#dfe7ee', '#f3f1ea'], spring: ['#cfe5f5', '#f6f3e6'], summer: ['#a9d3f2', '#eef4ea'], autumn: ['#d9e3ea', '#f5ecdc'] };
const STRAW = '#c7ae78';
const SEED = '#5c4330';

const flowerHex = (c) => (c === 'white' ? '#f7f5ee' : COLORS[c]?.hex ?? '#999');
const r1 = (v) => Math.round(v * 10) / 10;

function seasonOf(nm) {
  if (nm === 12 || nm <= 2) return 'winter';
  if (nm <= 5) return 'spring';
  if (nm <= 8) return 'summer';
  return 'autumn';
}

/**
 * 1株を描く
 * @param p 植物, color 選んだ花色, cx/baseY 根元の位置(px), sc 1mあたりのpx, nm 北半球換算の月, seed 乱数
 */
export function drawPlant(p, color, cx, baseY, sc, nm, seed) {
  const R = rng(seed);
  const blooming = p.bloom.includes(nm);
  const ever = p.tags.includes('evergreen') || p.type === 'subshrub';
  let g = GROWTH[nm - 1];
  if (ever) g = Math.max(g, 0.7);
  if (blooming) g = Math.max(g, 0.9);
  const dormant = !ever && !blooming && (nm === 12 || nm <= 2);
  const lastBloom = p.bloom[p.bloom.length - 1];
  const afterBloom = !blooming && (nm > lastBloom || nm <= 2) && nm >= 8 - (lastBloom > 8 ? 0 : 0);
  const seedheads = !blooming && p.tags.includes('prairie') && (nm >= 10 || nm <= 2) && ['daisy', 'globe', 'plate', 'spike'].includes(p.form);

  const H = Math.max(4, (p.h[1] / 100) * sc * g);
  const W = Math.max(8, (p.spread / 100) * sc * 0.95);
  let leaf = LEAF[p.leaf]?.hex ?? '#5f8f4a';
  if (!ever && nm === 11) leaf = '#a08a4f';
  const fc = flowerHex(color);
  const out = [];

  // シダ：弓なりの葉（羽状の小葉付き）
  if (p.form === 'fern') {
    const col = dormant ? STRAW : leaf;
    const n = 9;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) - 0.5;
      const tx = cx + t * W * 1.15, ty = baseY - H * (0.55 + 0.4 * (1 - Math.abs(t) * 1.4)) * (0.85 + R() * 0.15);
      const qx = cx + t * W * 0.3, qy = baseY - H * 1.05;
      out.push(`<path d="M${r1(cx)},${baseY} Q${r1(qx)},${r1(qy)} ${r1(tx)},${r1(ty)}" stroke="${col}" stroke-width="1.4" fill="none"/>`);
      for (let k = 2; k < 9; k++) {
        const u = k / 9, x = (1 - u) ** 2 * cx + 2 * (1 - u) * u * qx + u * u * tx, y = (1 - u) ** 2 * baseY + 2 * (1 - u) * u * qy + u * u * ty;
        const len = 7 * (1 - u * 0.6);
        out.push(`<path d="M${r1(x)},${r1(y)} l${r1(-len * 0.7)},${r1(len * 0.5)} M${r1(x)},${r1(y)} l${r1(len * 0.7)},${r1(len * 0.5)}" stroke="${col}" stroke-width="1.6" stroke-linecap="round"/>`);
      }
    }
    return out.join('');
  }

  // グラス
  if (p.form === 'grass') {
    const n = 16;
    const col = dormant ? STRAW : leaf;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) - 0.5;
      const tx = cx + t * W * 1.2 + (R() - 0.5) * 4;
      const ty = baseY - H * (0.65 + 0.35 * R()) * (1 - Math.abs(t) * 0.5);
      out.push(`<path d="M${r1(cx + t * 6)},${baseY} Q${r1(cx + t * W * 0.25)},${r1(baseY - H * 0.95)} ${r1(tx)},${r1(ty)}" stroke="${col}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
      const plume = blooming || (afterBloom && nm >= p.bloom[0]) || (dormant && p.bloom[0] >= 7);
      if (plume && i % 2 === 0) {
        const pc = dormant || color === 'green' ? '#e4d6ae' : color === 'white' ? '#efe7d2' : fc;
        out.push(`<ellipse cx="${r1(tx)}" cy="${r1(ty - 4)}" rx="3" ry="7" fill="${pc}" opacity=".9" transform="rotate(${r1(t * 50)} ${r1(tx)} ${r1(ty)})"/>`);
      }
    }
    return out.join('');
  }

  // 休眠中
  if (dormant) {
    if (seedheads) {
      for (let i = 0; i < 4; i++) {
        const x = cx + (R() - 0.5) * W * 0.6;
        const top = baseY - (p.h[1] / 100) * sc * (0.7 + 0.25 * R());
        out.push(`<line x1="${r1(x)}" y1="${baseY}" x2="${r1(x)}" y2="${r1(top)}" stroke="${STRAW}" stroke-width="1.3"/><circle cx="${r1(x)}" cy="${r1(top)}" r="3.2" fill="${SEED}"/>`);
      }
    } else {
      out.push(`<path d="M${r1(cx - W * 0.25)},${baseY} q${r1(W * 0.25)},-6 ${r1(W * 0.5)},0Z" fill="#8a7458"/>`);
    }
    return out.join('');
  }

  // 葉の茂み
  const mound = p.form === 'mound';
  const fh = mound ? H : Math.min(H * 0.45, W * 0.45);
  out.push(`<path d="M${r1(cx - W / 2)},${baseY} C${r1(cx - W / 2)},${r1(baseY - fh * 1.25)} ${r1(cx + W / 2)},${r1(baseY - fh * 1.25)} ${r1(cx + W / 2)},${baseY}Z" fill="${leaf}"/>`);
  out.push(`<path d="M${r1(cx - W * 0.3)},${baseY} C${r1(cx - W * 0.28)},${r1(baseY - fh * 0.9)} ${r1(cx + W * 0.1)},${r1(baseY - fh * 1.05)} ${r1(cx + W * 0.2)},${baseY}Z" fill="#000" opacity=".08"/>`);

  const stems = (n, spread, hMin = 0.75) => Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0 : i / (n - 1) - 0.5;
    const x = cx + t * W * spread + (R() - 0.5) * 6;
    const y = baseY - H * (hMin + (1 - hMin) * R());
    return { x, y, bx: cx + t * W * 0.25 };
  });
  const stemLine = (s) => `<line x1="${r1(s.bx)}" y1="${r1(baseY - fh * 0.5)}" x2="${r1(s.x)}" y2="${r1(s.y)}" stroke="${leaf}" stroke-width="1.4"/>`;
  const show = blooming || seedheads;
  const head = seedheads ? SEED : fc;
  const stroke = color === 'white' ? ' stroke="#c9c3b2" stroke-width=".6"' : '';

  switch (p.form) {
    case 'spike': {
      for (const s of stems(5, 0.7)) {
        out.push(stemLine(s));
        if (show) {
          const len = Math.max(8, (s.y < baseY ? (baseY - s.y) : 10) * 0.35);
          out.push(`<line x1="${r1(s.x)}" y1="${r1(s.y + len)}" x2="${r1(s.x)}" y2="${r1(s.y)}" stroke="${head}" stroke-width="${seedheads ? 2.5 : 5}" stroke-linecap="round"/>`);
        }
      }
      break;
    }
    case 'daisy': {
      for (const s of stems(7, 0.85)) {
        out.push(stemLine(s));
        if (show) {
          out.push(seedheads
            ? `<circle cx="${r1(s.x)}" cy="${r1(s.y)}" r="2.6" fill="${SEED}"/>`
            : `<circle cx="${r1(s.x)}" cy="${r1(s.y)}" r="4.6" fill="${fc}"${stroke}/><circle cx="${r1(s.x)}" cy="${r1(s.y)}" r="1.6" fill="#6b4a2a"/>`);
        }
      }
      break;
    }
    case 'globe': {
      for (const s of stems(4, 0.6)) {
        out.push(stemLine(s));
        if (show) out.push(`<circle cx="${r1(s.x)}" cy="${r1(s.y)}" r="${seedheads ? 3.5 : 7}" fill="${head}"${seedheads ? '' : stroke}/>`);
      }
      break;
    }
    case 'plate': {
      for (const s of stems(5, 0.75)) {
        out.push(stemLine(s));
        if (show) out.push(`<ellipse cx="${r1(s.x)}" cy="${r1(s.y)}" rx="${seedheads ? 4 : 8}" ry="${seedheads ? 2 : 3.6}" fill="${head}"${seedheads ? '' : stroke}/>`);
      }
      break;
    }
    case 'airy': {
      for (const s of stems(5, 0.8, 0.85)) out.push(stemLine(s));
      if (show) {
        for (let i = 0; i < 34; i++) {
          const x = cx + (R() - 0.5) * W * 1.05;
          const y = baseY - H * (0.55 + 0.45 * R());
          out.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(1.4 + R() * 1.3)}" fill="${head}"/>`);
        }
      }
      break;
    }
    case 'mound':
    default: {
      if (show) {
        for (let i = 0; i < 18; i++) {
          const a = Math.PI * (0.1 + 0.8 * R());
          const rr = 0.75 + 0.25 * R();
          const x = cx - Math.cos(a) * (W / 2) * rr * 0.95;
          const y = baseY - Math.sin(a) * fh * rr * 0.95;
          out.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(2.2 + R() * 1.6)}" fill="${head}"${stroke}/>`);
        }
      }
    }
  }
  return out.join('');
}

/** 立面図（正面から見たイメージ）。month はその土地の月 */
export function elevationSVG(plan, month, south = false, opts = {}) {
  const VW = 640, VH = opts.height || 320, ground = VH - 34, depthPx = 46;
  const maxH = Math.max(1.2, ...plan.species.map((s) => s.plant.h[1] / 100));
  const sx = (VW - 40) / plan.width;
  const sh = Math.min(sx, (ground - depthPx - 20) / maxH);
  const nm = localMonth(month, south);
  const [sky1, sky2] = SKY[seasonOf(nm)];
  const items = [];
  plan.species.forEach((s, si) => s.positions.forEach((pt, pi) => items.push({ s, pt, seed: si * 1000 + pi * 37 + 11 })));
  // アイランド花壇は奥行きの中央を「奥」とみなす
  const depthOf = (y) => (plan.view === 'island' ? 1 - Math.abs(y / plan.depth - 0.5) * 2 : y / plan.depth);
  items.sort((a, b) => depthOf(b.pt.y) - depthOf(a.pt.y));
  const body = items.map(({ s, pt, seed }) => {
    const d = depthOf(pt.y);
    const k = 1 - 0.18 * d;
    const cx = 20 + pt.x * sx;
    const by = ground - d * depthPx;
    return drawPlant(s.plant, s.color, cx, by, sh * k, nm, seed);
  }).join('');
  return `<svg class="illust" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${month}月の花壇のイメージ図">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient></defs>
    <rect width="${VW}" height="${VH}" fill="url(#sky)"/>
    <path d="M0,${ground - depthPx - 6} L${VW},${ground - depthPx - 6} L${VW},${VH} L0,${VH}Z" fill="${nm === 12 || nm <= 2 ? '#b9b39c' : '#9fb779'}"/>
    <path d="M14,${ground + 4} L${VW - 14},${ground + 4} L${VW - 14 - 18},${ground - depthPx - 4} L${14 + 18},${ground - depthPx - 4}Z" fill="#6d5640"/>
    ${body}
    <rect x="0" y="${ground + 4}" width="${VW}" height="${VH - ground - 4}" fill="${nm === 12 || nm <= 2 ? '#c9c2a8' : '#a9c286'}"/>
    ${opts.label === false ? '' : `<text x="${VW - 12}" y="${VH - 12}" text-anchor="end" font-size="14" fill="#3b4a33" opacity=".8">${month}月のイメージ</text>`}
    ${opts.extra || ''}
  </svg>`;
}

/** 平面図（上から見た配置） */
export function planSVG(plan) {
  const VW = 640;
  const sc = Math.min((VW - 40) / plan.width, 420 / plan.depth);
  const bw = plan.width * sc, bd = plan.depth * sc;
  const ox = (VW - bw) / 2, oy = 22;
  const VH = bd + oy + 34;
  // y=0（手前）を図の下側に
  const X = (x) => ox + x * sc, Y = (y) => oy + bd - y * sc;
  const circles = [];
  const labels = [];
  for (const s of plan.species) {
    const r = Math.max(3, (s.plant.spread / 200) * sc * 0.92);
    const fc = s.color === 'green' ? LEAF[s.plant.leaf].hex : flowerHex(s.color);
    for (const pt of s.positions) {
      circles.push(`<circle cx="${r1(X(pt.x))}" cy="${r1(Y(pt.y))}" r="${r1(r)}" fill="${fc}" fill-opacity=".88" stroke="${LEAF[s.plant.leaf].hex}" stroke-width="2"/>`);
    }
    // ラベルは株のまとまりの中心付近に
    const mx = s.positions.reduce((t, p) => t + p.x, 0) / s.positions.length;
    const my = s.positions.reduce((t, p) => t + p.y, 0) / s.positions.length;
    const near = s.positions.reduce((b, p) => ((p.x - mx) ** 2 + (p.y - my) ** 2 < (b.x - mx) ** 2 + (b.y - my) ** 2 ? p : b), s.positions[0]);
    labels.push(`<g><circle cx="${r1(X(near.x))}" cy="${r1(Y(near.y))}" r="10" fill="#22291f" fill-opacity=".85"/><text x="${r1(X(near.x))}" y="${r1(Y(near.y) + 4)}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${s.no}</text></g>`);
  }
  const bandLines = plan.bands.slice(1).map((b) => `<line x1="${ox}" x2="${ox + bw}" y1="${r1(Y(b.y0))}" y2="${r1(Y(b.y0))}" stroke="#fff" stroke-opacity=".25" stroke-dasharray="4 4"/>`).join('');
  const bandLabels = plan.view === 'border'
    ? plan.bands.map((b) => `<text x="${ox + bw + 4}" y="${r1(Y((b.y0 + b.y1) / 2) + 4)}" font-size="11" fill="currentColor" opacity=".6">${LAYER_JA[b.layer]}</text>`).join('')
    : '';
  const ticks = [];
  for (let m = 0; m <= plan.width + 1e-6; m += plan.width > 6 ? 2 : 1) ticks.push(`<text x="${r1(X(m))}" y="${r1(oy - 8)}" text-anchor="middle" font-size="10" fill="currentColor" opacity=".55">${m}m</text>`);
  return `<svg class="illust plan" viewBox="0 0 ${VW} ${r1(VH)}" role="img" aria-label="花壇の平面図">
    <rect x="${ox}" y="${oy}" width="${r1(bw)}" height="${r1(bd)}" rx="10" fill="#6d5640"/>
    ${bandLines}${circles.join('')}${labels.join('')}${ticks.join('')}${bandLabels}
    <text x="${VW / 2}" y="${r1(VH - 8)}" text-anchor="middle" font-size="12" fill="currentColor" opacity=".7">${plan.view === 'island' ? '四方から眺める花壇' : '▼ こちらから眺める（手前）'}　幅${plan.width}m × 奥行き${plan.depth}m</text>
  </svg>`;
}

/** 植物1種のイラスト（写真がないときのサムネイル） */
export function plantThumbSVG(p, color = p.color[0], month = p.bloom.length ? p.bloom[Math.floor(p.bloom.length / 2)] : 6) {
  const VW = 160, VH = 120, base = VH - 14;
  const sc = Math.min((VH - 30) / (p.h[1] / 100), (VW - 40) / (p.spread / 100));
  return `<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid slice" class="thumb-svg" role="img" aria-label="${p.ja}のイラスト">
    <rect width="${VW}" height="${VH}" fill="#eef2e6"/><rect y="${base}" width="${VW}" height="${VH - base}" fill="#b9a383"/>
    ${drawPlant(p, color, VW / 2, base, sc, month, p.id.length * 97)}
  </svg>`;
}
