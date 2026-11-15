// 生き物・生物多様性の表示（図鑑・マイ庭・プラン・楽しむ で共通）
import { KINDS, LEVEL_JA, FEATURES, creaturesForRegion } from './wildlife.js';
import { critterSVG } from './critterart.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KIND_COLOR = { butterfly: '#d08a2e', moth: '#9a7a5a', bee: '#c9a227', beetle: '#b5532f', dragonfly: '#4f8aa0', hopper: '#6f8f4e', bird: '#7a6a9a', other: '#7d8c6a' };
const shiftMonth = (m, south) => (south ? ((m + 5) % 12) + 1 : m);

export function kindTag(kind) {
  return `<span class="kind" style="--k:${KIND_COLOR[kind]}">${esc(KINDS[kind])}</span>`;
}
export function monthsText(months, south) {
  if (months.length === 12) return '一年中';
  const ms = months.map((m) => shiftMonth(m, south)).sort((a, b) => a - b);
  // 連続した月をまとめる（年をまたぐ場合も）
  const runs = [];
  for (const m of ms) { const r = runs[runs.length - 1]; if (r && m === r[1] + 1) r[1] = m; else runs.push([m, m]); }
  if (runs.length > 1 && runs[0][0] === 1 && runs[runs.length - 1][1] === 12) { const last = runs.pop(); runs[0][0] = last[0]; }
  return runs.map(([a, b]) => (a === b ? `${a}月` : `${a}〜${b}月`)).join('・');
}

/** 植物図鑑：この植物に来る生き物 */
export function plantCritters(list) {
  if (!list.length) return '';
  const host = list.filter((x) => x.way === 'host');
  const rest = list.filter((x) => x.way !== 'host');
  return `<h4>この植物に来る生き物</h4>
    <div class="critters">${[...host, ...rest].slice(0, 10).map((x) => `<button type="button" class="critter${x.way === 'host' ? ' host' : ''}" data-critter="${x.creature.id}" title="${esc(x.creature.note || '')}">${esc(x.creature.ja)}<small>${esc(x.wayJa)}</small></button>`).join('')}</div>
    ${host.length ? `<p class="hint" style="margin:4px 0 0">「幼虫の食草」は、葉が少し食べられる代わりに、庭で蝶が育ちます。</p>` : ''}`;
}

function ring(total) {
  const r = 34, L = 2 * Math.PI * r;
  const col = total >= 80 ? '#4f7a3a' : total >= 60 ? '#6f8f4e' : total >= 40 ? '#c9a227' : '#c4831f';
  return `<svg viewBox="0 0 84 84" class="bio-ring" aria-hidden="true"><circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--line, #e3dccb)" stroke-width="8"/><circle cx="42" cy="42" r="${r}" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${((total / 100) * L).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 42 42)"/><text x="42" y="48" text-anchor="middle" font-size="22" font-weight="700" fill="currentColor">${total}</text></svg>`;
}

/** 生物多様性度のカード（内訳・ヒント） */
export function bioHtml(bio) {
  return `<div class="bio">
    <div class="bio-head">${ring(bio.total)}<div><span class="bio-label">${esc(bio.label)}</span><p class="hint" style="margin:2px 0 0">生物多様性度（100点満点の目安）・来そうな生き物 ${bio.expected}種</p></div></div>
    <ul class="bio-parts">${bio.parts.map((x) => `<li><span class="pn">${esc(x.ja)}</span><span class="bar"><i style="width:${Math.round((x.score / x.max) * 100)}%"></i></span><span class="ps">${x.score}/${x.max}</span><small>${esc(x.detail)}</small></li>`).join('')}</ul>
    ${bio.tips.length ? `<div class="bio-tips"><b>もっと豊かにするには</b><ul>${bio.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
  </div>`;
}

/** 庭に来そうな生き物の一覧 */
export function crittersHtml(critters, south, max = 12, seen = new Set()) {
  if (!critters.length) return '<p class="hint">植物を加えると、来そうな生き物が表示されます。</p>';
  const card = (x) => `<article class="crit-card lv${x.level}${seen.has(x.creature.id) ? ' seen' : ''}" data-critter="${x.creature.id}" role="button" tabindex="0" aria-label="${esc(x.creature.ja)}を生き物図鑑で見る">
    <div class="ch">${kindTag(x.creature.kind)}<span class="clv">${seen.has(x.creature.id) ? '✓ 見た' : LEVEL_JA[x.level]}</span></div>
    <div class="cart">${critterSVG(x.creature.id, 54)}</div>
    <h3>${esc(x.creature.ja)}</h3>
    <p class="cm">${monthsText(x.creature.months, south)}</p>
    ${x.why.length ? `<p class="cw">${x.why.map(esc).join(' ／ ')}</p>` : ''}
    <p class="cn">${esc(x.creature.note || '')}</p>
  </article>`;
  const main = critters.slice(0, max);
  const more = critters.slice(max);
  return `<div class="crit-grid">${main.map(card).join('')}</div>
    ${more.length ? `<details class="more-crit"><summary>ほかに ${more.length}種（条件がそろえば）</summary><div class="crit-grid">${more.map(card).join('')}</div></details>` : ''}
    <p class="note">一般的な観察例にもとづく目安です。周りの環境（緑地・水辺・農薬の使用など）で大きく変わります。</p>`;
}

/** 庭の環境（水場・池など）の切り替えチップ */
export function featureChips(features, keys = Object.keys(FEATURES)) {
  return `<div class="chips feat-chips">${keys.map((k) => `<button type="button" class="chip${features?.[k] ? ' on' : ''}" data-feat="${k}">${features?.[k] ? '✓ ' : ''}${esc(FEATURES[k])}</button>`).join('')}</div>`;
}

/** 地域で見られる生き物（季節ごと） */
export function regionHtml(climate, month, south) {
  const nm = shiftMonth(month, south); // データは北半球の月。南半球は半年ずらす
  const list = creaturesForRegion(climate, nm).sort((a, b) => b.base - a.base);
  const by = {};
  for (const c of list) (by[c.kind] = by[c.kind] || []).push(c);
  return Object.keys(KINDS).filter((k) => by[k]).map((k) => `<div class="reg-kind"><h3>${kindTag(k)}</h3><div class="critters">${by[k].map((c) => `<button type="button" class="critter" data-critter="${c.id}" title="${esc(c.note || '')}">${esc(c.ja)}${c.base === 1 ? '<small>まれ</small>' : ''}</button>`).join('')}</div></div>`).join('')
    || '<p class="hint">この月に見られる生き物のデータがありません。</p>';
}
