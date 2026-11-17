// 画面（ハッシュで切り替える1ページのアプリ）
import { CATALOG } from './catalog.data.js';
import { LIGHT, DIRECT_SUN, WATERING, HUMIDITY, CARE_FIELDS, getPath } from './schema.js';
import { WINDOWS, DISTANCES, spotLight, fit, nextCheck, search, recommend, toDateStr } from './care.js';
import * as db from './db.js';
import { GUIDE_SVG, GUIDE_NAME, guideLines } from './guide.js';

const byId = new Map(CATALOG.map((e) => [e.id, e]));
const childrenOf = (id) => CATALOG.filter((e) => e.parent === id);
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const today = () => toDateStr(new Date());
const fmtDate = (s) => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${y}年${Number(m)}月${Number(d)}日`; };

// ---- 出典の英語表記の日本語訳 ----
const GROWTH = { Slow: '遅い', Medium: 'ふつう', Rapid: '速い' };
const PROPAGATION = { Division: '株分け', 'Stem Cutting': '挿し木', 'Leaf Cutting': '葉挿し', Layering: '取り木', Seed: '種まき', 'Root Cutting': '根挿し' };
const HABIT = { Climbing: 'よじ登る', Creeping: '這う', Spreading: '横に広がる', Erect: '直立', Cascading: '垂れ下がる', Clumping: '株立ち', Arching: '弓なり', Rounded: '丸くまとまる', Dense: '密に茂る', 'Multi-stemmed': '多幹（株元から複数の茎）', 'Multi-trunked': '多幹', Vase: '花瓶形', Weeping: '枝垂れる', Mounding: 'こんもり', Prostrate: '地を這う', Ascending: '斜めに立ち上がる', Open: 'まばら', Irregular: '不規則', Horizontal: '水平に広がる' };
const SEVERITY = { Low: '弱い', Medium: '中程度', High: '強い' };
const PRINCIPLE = [[/calcium oxalate/i, 'シュウ酸カルシウムの結晶'], [/saponin/i, 'サポニン'], [/anthraquinone/i, 'アントラキノン配糖体'], [/cyanogenic/i, '青酸配糖体'], [/psoralen/i, 'ソラレン（タンパク質分解酵素も）'], [/cyclopropenoid/i, 'シクロプロペン脂肪酸（種子・可能性）'], [/GI irritant/i, '胃腸への刺激物'], [/unknown/i, '不明']];
const tr = (map, v) => (v == null ? '' : map[v] ?? v);
const principleJa = (p) => { if (!p) return ''; const hit = PRINCIPLE.find(([re]) => re.test(p)); return hit ? `${hit[1]}（${p}）` : p; };

// ---- 状態 ----
let S = { spots: [], plants: [], events: [], pets: { cats: false, dogs: false } };
async function load() {
  const [spots, plants, events, pets] = await Promise.all([db.all('spots'), db.all('plants'), db.all('events'), db.getSetting('pets', { cats: false, dogs: false })]);
  S = { spots: spots.sort((a, b) => a.createdAt - b.createdAt), plants: plants.sort((a, b) => a.createdAt - b.createdAt), events, pets };
}
const spotOf = (p) => S.spots.find((s) => s.id === p.spotId) ?? null;
const eventsOf = (p) => S.events.filter((e) => e.plantId === p.id).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
function plantState(p) {
  const entry = byId.get(p.taxonId);
  if (!entry) return null;
  const spot = spotOf(p);
  return { plant: p, entry, spot, fit: spot ? fit(entry, spot) : null, check: nextCheck(entry, spot, eventsOf(p)) };
}

// ---- 部品 ----
function badge(field, entry) {
  const ev = entry.evidence[field] ?? [];
  const sourced = ev.some((x) => x.src === 'ncsu');
  const estimateOnly = ev.every((x) => x.src === 'estimate');
  return estimateOnly ? '<span class="badge est">目安</span>' : sourced && ev.some((x) => x.src === 'estimate') ? '<span class="badge mix">出典＋目安</span>' : '<span class="badge src">出典</span>';
}
function evidenceBlock(field, entry) {
  const ev = entry.evidence[field] ?? [];
  const from = entry.inherited[field] ? `<p class="inherit">「${esc(byId.get(entry.inherited[field])?.names.ja)}」の値を引き継いでいます</p>` : '';
  return `<details class="ev"><summary>根拠</summary>${from}<ul>${ev.map((x) => x.src === 'ncsu'
    ? `<li><span class="badge src">NC State</span> <q lang="en">${esc(x.quote)}</q>${x.fahrenheit ? ` <small>（${x.fahrenheit.map((f) => `${f}°F`).join('〜')} を℃に換算）</small>` : ''}</li>`
    : `<li><span class="badge est">目安</span> ${esc(x.reason)}</li>`).join('')}</ul></details>`;
}
function careRow(label, value, field, entry) {
  return `<div class="care-row"><div class="care-head"><span class="care-label">${label}</span>${badge(field, entry)}</div><div class="care-value">${value}</div>${evidenceBlock(field, entry)}</div>`;
}
const lightText = (k) => `${LIGHT[k].ja}<small>（${LIGHT[k].where}・${LIGHT[k].lux[0].toLocaleString()}〜${LIGHT[k].lux[1].toLocaleString()} lux）</small>`;
function toxBadge(v, label) {
  if (v === 'listed') return `<li class="tox-yes">⚠️ ${label}：害あり（出典に記載）</li>`;
  if (v === 'not-listed') return `<li class="tox-unk">${label}：記載なし <small>（安全とは限りません）</small></li>`;
  return `<li class="tox-unk">${label}：情報なし</li>`;
}
function plantCard(e, extra = '') {
  const t = e.toxicity;
  const petMark = (S.pets.cats && t?.cats === 'listed') || (S.pets.dogs && t?.dogs === 'listed') ? '<span class="badge warn" title="ペットに害あり（出典に記載）">ペット注意</span>' : '';
  return `<a class="card plant" href="#/zukan/${e.id}">
    <div class="pc-name">${esc(e.names.ja)} ${e.rank === 'cultivar' ? '<span class="badge">品種</span>' : e.rank === 'genus' ? '<span class="badge">属</span>' : ''}${petMark}</div>
    <div class="pc-sci"><i>${esc(e.scientificName)}</i></div>
    <div class="pc-icons">☀️ ${LIGHT[e.care.light.best].ja} ・ 🌡️ ${e.care.temperature.minC}℃以上 ・ 💧 ${WATERING[e.care.watering.growing].ja}</div>${extra}</a>`;
}
function fitBadges(f) {
  if (!f) return '<span class="badge">置き場所未設定</span>';
  const L = { good: ['ok', '明るさ ◎'], ok: ['mid', '明るさ ○'], dark: ['ng', '暗すぎ'], bright: ['ng', '日差し注意'] }[f.light];
  const T = { good: ['ok', '冬の室温 ◎'], slow: ['mid', '冬は休眠気味'], cold: ['ng', '冬は寒すぎ'], unknown: ['', '室温未入力'] }[f.temp];
  return `<span class="badge ${L[0]}">${L[1]}</span> <span class="badge ${T[0]}">${T[1]}</span>`;
}

// ---- 画面 ----
const views = {};

views.home = () => {
  const ps = S.plants.filter((p) => !p.archivedAt).map(plantState).filter(Boolean);
  const tipPool = [];
  const ids = new Set(ps.map((x) => x.entry.id));
  for (const e of CATALOG) if (ids.size === 0 || ids.has(e.id)) for (const tip of e.tips) tipPool.push({ entry: e, tip });
  const lines = guideLines({ plants: ps, today: new Date(), pets: S.pets, tipPool });
  const [first, ...rest] = lines;
  const due = ps.filter((x) => x.check.due && x.check.overdueDays >= 0);
  const upcoming = ps.filter((x) => x.check.due && x.check.overdueDays < 0).sort((a, b) => a.check.due.localeCompare(b.check.due)).slice(0, 5);
  return `<section class="guide">
      <div class="guide-face">${GUIDE_SVG}</div>
      <div class="bubble"><b>${GUIDE_NAME}</b><p>${esc(first.text)}</p>${first.cite ? `<small>出典：<a href="${esc(first.cite.url)}" target="_blank" rel="noopener">${esc(first.cite.label)}</a></small>` : ''}</div>
    </section>
    ${rest.length ? `<ul class="guide-more">${rest.map((l) => `<li>${esc(l.text)}${l.cite ? ` <small>（<a href="${esc(l.cite.url)}" target="_blank" rel="noopener">出典</a>）</small>` : ''}</li>`).join('')}</ul>` : ''}
    <h2>今日のお世話</h2>
    ${due.length ? due.map((x) => `<div class="card task"><a href="#/my/${x.plant.id}"><b>${esc(x.plant.nickname || x.entry.names.ja)}</b></a>
        <p>土を確かめる日です（${WATERING[x.check.style].ja}${x.check.winter ? '・冬' : ''}）。${esc(x.check.how)}</p>
        <div class="row"><button data-act="quick" data-type="water" data-id="${x.plant.id}">💧 水をやった</button><button class="sub" data-act="quick" data-type="check" data-id="${x.plant.id}">👆 まだ湿っていた</button></div></div>`).join('')
      : `<p class="muted">${ps.length ? '今日、土を確かめる植物はありません。' : 'マイ植物を登録すると、ここにお世話の予定が出ます。'}</p>`}
    ${upcoming.length ? `<h3>これから</h3><ul class="plain">${upcoming.map((x) => `<li><a href="#/my/${x.plant.id}">${esc(x.plant.nickname || x.entry.names.ja)}</a>：${fmtDate(x.check.due)}</li>`).join('')}</ul>` : ''}
    <p class="note">「土を確かめる日」は水やりの段階から出した目安です。水をやる前に、必ず指で土の乾き具合を確かめてください。</p>`;
};

views.zukan = (_, q) => {
  const params = new URLSearchParams(q);
  const query = params.get('q') ?? '';
  const f = { lowLight: params.has('low'), dryAir: params.has('dry'), cold: params.has('cold'), noPetListing: params.has('pet'), rank: params.has('cv') ? undefined : 'base' };
  const list = search(CATALOG, query, f).sort((a, b) => a.names.ja.localeCompare(b.names.ja, 'ja'));
  const chk = (k, label) => `<label class="chip"><input type="checkbox" name="${k}" ${params.has(k) ? 'checked' : ''}> ${label}</label>`;
  return `<h1>図鑑</h1>
    <form id="zukan-form" class="search"><input type="search" name="q" value="${esc(query)}" placeholder="名前・学名・旧学名で検索" aria-label="検索">
      <div class="chips">${chk('low', '暗めの場所でも育つ')}${chk('dry', '乾燥に強い')}${chk('cold', '寒さに強い（5℃以下まで）')}${chk('pet', '猫・犬への害の記載なし')}${chk('cv', '品種も表示')}</div></form>
    ${f.noPetListing ? '<p class="note">「記載なし」は、出典に害があると書かれていないという意味です。安全を保証するものではありません。</p>' : ''}
    <p class="muted">${list.length}件</p><div class="grid">${list.map((e) => plantCard(e)).join('')}</div>`;
};

views.detail = (id) => {
  const e = byId.get(id);
  if (!e) return '<p>見つかりません。</p>';
  const c = e.care;
  const kids = childrenOf(e.id);
  const t = e.toxicity;
  const f = e.facts;
  const tipList = [...e.tips.map((x) => ({ ...x, own: true })), ...e.parentTips];
  return `<p class="crumb"><a href="#/zukan">図鑑</a>${e.parent ? ` › <a href="#/zukan/${e.parent}">${esc(byId.get(e.parent).names.ja)}</a>` : ''}</p>
    <h1>${esc(e.names.ja)}</h1>
    <p class="sci"><i>${esc(e.scientificName)}</i>${e.family ? `　${esc(e.family)}（科）` : ''}</p>
    ${e.names.aliases.length ? `<p class="aliases">別名・流通名：${e.names.aliases.map(esc).join('、')}</p>` : ''}
    ${e.note || e.parentNote ? `<p class="note">${esc(e.note ?? e.parentNote)}</p>` : ''}
    <button data-act="add" data-id="${e.id}" class="primary">＋ マイ植物に追加</button>
    <h2>室内での育て方</h2>
    <div class="care">
      ${careRow('いちばんよい明るさ', lightText(c.light.best), 'light.best', e)}
      ${careRow('育つ最低限の明るさ', lightText(c.light.min), 'light.min', e)}
      ${careRow('直射日光', DIRECT_SUN[c.light.directSun].ja, 'light.directSun', e)}
      ${careRow('最低温度', `${c.temperature.minC}℃<small>（これより下がると傷むおそれ）</small>`, 'temperature.minC', e)}
      ${careRow('よく育つ温度', `${c.temperature.idealC[0]}〜${c.temperature.idealC[1]}℃`, 'temperature.idealC', e)}
      ${careRow('湿度', HUMIDITY[c.humidity].ja, 'humidity', e)}
      ${careRow('水やり（生育期）', `${WATERING[c.watering.growing].ja}<small>：${WATERING[c.watering.growing].how}</small>`, 'watering.growing', e)}
      ${careRow('水やり（冬・寒い部屋）', `${WATERING[c.watering.winter].ja}<small>：${WATERING[c.watering.winter].how}</small>`, 'watering.winter', e)}
    </div>
    <h2>人やペットへの害</h2>
    ${t ? `<ul class="tox">${toxBadge(t.cats, '猫')}${toxBadge(t.dogs, '犬')}${toxBadge(t.children, '子ども')}${toxBadge(t.humans, '人')}${t.dermatitis ? '<li class="tox-yes">⚠️ 汁で皮ふがかぶれることがある</li>' : ''}</ul>
      ${t.severity || t.principle ? `<p>${t.severity ? `毒性の強さ：${tr(SEVERITY, t.severity)}　` : ''}${t.principle ? `成分：${esc(principleJa(t.principle))}` : ''}</p>` : ''}
      ${t.symptoms ? `<details><summary>症状（出典の原文）</summary><p lang="en">${esc(t.symptoms)}</p></details>` : ''}
      <p class="note">出典（NC State Extension）の記載をそのまま表示しています。「記載なし」は安全という意味ではありません。口にした場合は医師・獣医師に相談してください。</p>` : '<p>出典の情報がありません。</p>'}
    ${tipList.length ? `<h2>育てるコツ</h2><ul class="tips">${tipList.map((x) => `<li>${esc(x.ja)}<details class="ev"><summary>原文</summary><q lang="en">${esc(x.quote)}</q></details></li>`).join('')}</ul>` : ''}
    ${f ? `<h2>基本データ</h2><dl class="facts">
      ${f.origin ? `<dt>原産地</dt><dd lang="en">${esc(f.origin)}</dd>` : ''}
      ${f.growthRate ? `<dt>成長の速さ</dt><dd>${tr(GROWTH, f.growthRate)}</dd>` : ''}
      ${f.habit.length ? `<dt>姿</dt><dd>${f.habit.map((h) => tr(HABIT, h)).join('・')}</dd>` : ''}
      ${f.propagation.length ? `<dt>ふやし方</dt><dd>${f.propagation.map((h) => tr(PROPAGATION, h)).join('・')}</dd>` : ''}
      ${f.hardinessZones.length ? `<dt>耐寒性ゾーン（USDA）</dt><dd>${f.hardinessZones[0]}〜${f.hardinessZones.at(-1)}<small>（屋外で約${Math.round(f.hardinessMinC)}℃まで）</small></dd>` : ''}
      ${e.taxonomy?.synonyms.length ? `<dt>旧学名など</dt><dd><i>${e.taxonomy.synonyms.slice(0, 8).map(esc).join(', ')}</i>${e.taxonomy.synonyms.length > 8 ? ' ほか' : ''}</dd>` : ''}
      ${e.taxonomy && e.taxonomy.status !== 'ACCEPTED' ? `<dt>分類の扱い</dt><dd>GBIF では <i>${esc(e.taxonomy.acceptedName)}</i> を正式名としています</dd>` : ''}
    </dl>` : ''}
    ${kids.length ? `<h2>品種</h2><div class="grid">${kids.map((k) => plantCard(k)).join('')}</div>` : ''}
    <h2>出典</h2><ul class="src-list">
      ${e.ncsu ? `<li><a href="${esc(e.ncsu.url)}" target="_blank" rel="noopener">NC State Extension Gardener Plant Toolbox</a>（CC BY 4.0・${esc(e.ncsu.retrieved)} 取得）</li>` : ''}
      ${e.taxonomy ? `<li><a href="${esc(e.taxonomy.url)}" target="_blank" rel="noopener">GBIF Backbone Taxonomy</a>（CC BY 4.0・${esc(e.taxonomy.retrieved)} 取得）</li>` : ''}
    </ul>
    <p class="note">「目安」は出典に記載がない項目を、理由を明記したうえで補った値です。「根拠」を開くと出典の原文や理由を確認できます。</p>`;
};

views.add = (taxonId) => {
  const e = byId.get(taxonId);
  if (!e) return '<p>見つかりません。</p>';
  return `<h1>マイ植物に追加</h1><p><b>${esc(e.names.ja)}</b> <i class="muted">${esc(e.scientificName)}</i></p>
    <form id="add-form" class="form" data-taxon="${e.id}">
      <label>呼び名（任意）<input name="nickname" placeholder="例：リビングのモンステラ"></label>
      <label>置き場所<select name="spotId"><option value="">（あとで決める）</option>${S.spots.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label>
      ${S.spots.length ? '' : '<p class="muted">置き場所はまだありません。「置き場所」タブで登録できます。</p>'}
      <label>迎えた日<input type="date" name="acquiredOn" value="${today()}"></label>
      <label>最後に水をやった日（わかれば）<input type="date" name="lastWater"></label>
      <label>鉢の直径 cm（任意）<input type="number" name="potCm" min="3" max="100" inputmode="numeric"></label>
      <button class="primary">追加する</button></form>
    <div id="add-fit"></div>`;
};

views.my = () => {
  const ps = S.plants.filter((p) => !p.archivedAt).map(plantState).filter(Boolean);
  if (!ps.length) return `<h1>マイ植物</h1><p>まだ登録がありません。<a href="#/zukan">図鑑</a>から追加してください。</p>`;
  const groups = new Map();
  for (const x of ps) { const k = x.spot?.id ?? ''; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(x); }
  return `<h1>マイ植物</h1>${[...groups].map(([k, xs]) => `<h2>${esc(k ? xs[0].spot.name : '置き場所未設定')}</h2>
    ${xs.map((x) => `<a class="card plant" href="#/my/${x.plant.id}"><div class="pc-name">${esc(x.plant.nickname || x.entry.names.ja)}</div>
      ${x.plant.nickname ? `<div class="pc-sci">${esc(x.entry.names.ja)}</div>` : ''}
      <div>${fitBadges(x.fit)}</div>
      <div class="pc-icons">${x.check.due ? `次に土を確かめる日：${fmtDate(x.check.due)}${x.check.overdueDays > 0 ? `（${x.check.overdueDays}日過ぎ）` : x.check.overdueDays === 0 ? '（今日）' : ''}` : '水やりの記録なし'}</div></a>`).join('')}`).join('')}`;
};

views.myDetail = (id) => {
  const p = S.plants.find((x) => x.id === id);
  const x = p && plantState(p);
  if (!x) return '<p>見つかりません。</p>';
  const evs = eventsOf(p);
  return `<p class="crumb"><a href="#/my">マイ植物</a></p>
    <h1>${esc(p.nickname || x.entry.names.ja)}</h1>
    <p><a href="#/zukan/${x.entry.id}">${esc(x.entry.names.ja)}</a> <i class="muted">${esc(x.entry.scientificName)}</i></p>
    <div class="card"><h3>置き場所</h3>
      <select data-act="move" data-id="${p.id}"><option value="">（未設定）</option>${S.spots.map((s) => `<option value="${s.id}" ${s.id === p.spotId ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>
      <div>${fitBadges(x.fit)}</div>${x.fit?.notes.length ? `<ul>${x.fit.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      ${x.fit && !x.fit.spotLight.measured ? '<p class="muted small">明るさは窓の向きと距離からの見積もりです。照度計アプリなどで測った値を置き場所に入れると正確になります。</p>' : ''}</div>
    <div class="card"><h3>水やり</h3>
      <p>いまは<b>${x.check.winter ? '冬（水を控える時期）' : '生育期'}</b>：${WATERING[x.check.style].ja}。${esc(x.check.how)}</p>
      <p>${x.check.due ? `次に土を確かめる日：<b>${fmtDate(x.check.due)}</b>（${x.check.days}日ごとの目安）` : '水やりを記録すると、次に土を確かめる日を表示します。'}</p>
      <div class="row"><button data-act="quick" data-type="water" data-id="${p.id}">💧 今日水をやった</button><button class="sub" data-act="quick" data-type="check" data-id="${p.id}">👆 土を確認（まだ湿っていた）</button></div></div>
    <div class="card"><h3>記録する</h3><form id="event-form" class="form" data-id="${p.id}">
      <label>内容<select name="type">${Object.entries(db.EVENT_TYPES).map(([k, v]) => `<option value="${k}">${v.icon} ${v.ja}</option>`).join('')}</select></label>
      <label>日付<input type="date" name="date" value="${today()}" required></label>
      <label>メモ<input name="memo" placeholder="任意"></label><button>記録</button></form></div>
    <h2>記録</h2>${evs.length ? `<ul class="log">${evs.map((ev) => `<li><span>${fmtDate(ev.date)}</span> ${db.EVENT_TYPES[ev.type]?.icon ?? ''} ${db.EVENT_TYPES[ev.type]?.ja ?? esc(ev.type)}${ev.memo ? `：${esc(ev.memo)}` : ''} <button class="link" data-act="del-event" data-id="${ev.id}" aria-label="削除">×</button></li>`).join('')}</ul>` : '<p class="muted">まだ記録はありません。</p>'}
    <details class="card"><summary>呼び名・情報の変更</summary><form id="plant-form" class="form" data-id="${p.id}">
      <label>呼び名<input name="nickname" value="${esc(p.nickname)}"></label>
      <label>迎えた日<input type="date" name="acquiredOn" value="${esc(p.acquiredOn)}"></label>
      <label>鉢の直径 cm<input type="number" name="potCm" value="${esc(p.potCm ?? '')}" min="3" max="100"></label>
      <label>メモ<textarea name="memo">${esc(p.memo)}</textarea></label><button>保存</button></form>
      <button class="danger" data-act="del-plant" data-id="${p.id}">この植物を削除</button></details>`;
};

views.spots = () => `<h1>置き場所</h1>
  <p class="muted">植物を置く場所ごとに、窓の向き・窓からの距離・冬の最低室温を登録します。明るさの見積もりと、合う植物の提案に使います。</p>
  ${S.spots.map((s) => { const L = spotLight(s); const n = S.plants.filter((p) => p.spotId === s.id && !p.archivedAt).length;
    return `<a class="card" href="#/spot/${s.id}"><div class="pc-name">${esc(s.name)}</div>
      <div class="pc-icons">${WINDOWS[s.window]}${s.window !== 'none' ? `向き・${DISTANCES[s.distance]}` : ''}${s.sheer ? '・レース越し' : ''}</div>
      <div>☀️ ${LIGHT[L.level].ja}${L.measured ? '（実測）' : '（見積もり）'}　🌡️ 冬の最低 ${Number.isFinite(s.winterMinC) ? `${s.winterMinC}℃` : '未入力'}　🪴 ${n}鉢</div></a>`; }).join('')}
  <a class="button primary" href="#/spot/new">＋ 置き場所を追加</a>`;

views.spot = (id) => {
  const s = id === 'new' ? { id: '', name: '', window: 'S', distance: 'near', sheer: true } : S.spots.find((x) => x.id === id);
  if (!s) return '<p>見つかりません。</p>';
  const opt = (obj, cur) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${v}</option>`).join('');
  const recs = s.id ? recommend(CATALOG, s) : [];
  return `<p class="crumb"><a href="#/spots">置き場所</a></p><h1>${s.id ? esc(s.name) : '置き場所を追加'}</h1>
    <form id="spot-form" class="form" data-id="${s.id}">
      <label>名前<input name="spotName" value="${esc(s.name)}" required placeholder="例：リビングの南の窓"></label>
      <label>窓の向き<select name="window">${opt(WINDOWS, s.window)}</select></label>
      <label>窓からの距離<select name="distance">${opt(DISTANCES, s.distance)}</select></label>
      <label class="check"><input type="checkbox" name="sheer" ${s.sheer ? 'checked' : ''}> レースカーテン越し（直射日光が当たらない）</label>
      <label>昼の明るさ（lux・任意）<input type="number" name="lux" min="0" max="120000" value="${esc(s.lux ?? '')}" inputmode="numeric" placeholder="照度計で測った値"></label>
      <label>冬の夜の最低室温（℃・任意）<input type="number" name="winterMinC" min="-15" max="30" step="1" value="${esc(s.winterMinC ?? '')}" inputmode="numeric" placeholder="例：8"></label>
      <p class="muted small">冬の最低室温は、明け方の窓辺がいちばん冷えます。最高最低温度計で測るのが確実です。</p>
      <button class="primary">保存</button></form>
    <div id="spot-preview"></div>
    ${s.id ? `<h2>この場所に合う植物</h2>${recs.length ? `<div class="grid">${recs.map(({ e }) => plantCard(e)).join('')}</div>` : '<p class="muted">明るさ・室温の両方に合う植物が見つかりませんでした。</p>'}
      <button class="danger" data-act="del-spot" data-id="${s.id}">この置き場所を削除</button>` : ''}`;
};

views.settings = () => `<h1>設定</h1>
  <div class="card"><h3>一緒に暮らす動物</h3><p class="muted small">選ぶと、害があると記載された植物に印をつけます。</p>
    <label class="check"><input type="checkbox" data-act="pet" name="cats" ${S.pets.cats ? 'checked' : ''}> 猫</label>
    <label class="check"><input type="checkbox" data-act="pet" name="dogs" ${S.pets.dogs ? 'checked' : ''}> 犬</label></div>
  <div class="card"><h3>バックアップ</h3><p class="muted small">データはこの端末のブラウザの中だけに保存されています。機種変更の前などに書き出してください。</p>
    <div class="row"><button data-act="export">書き出す</button><label class="button sub">読み込む<input type="file" accept="application/json" data-act="import" hidden></label></div></div>
  <div class="card"><h3>図鑑のデータについて</h3>
    <p>${CATALOG.filter((e) => e.rank !== 'cultivar').length}種類・${CATALOG.filter((e) => e.rank === 'cultivar').length}品種。</p>
    <ul class="small">
      <li>育て方・毒性・原産地などは <a href="https://plants.ces.ncsu.edu/" target="_blank" rel="noopener">NC State Extension Gardener Plant Toolbox</a>（CC BY 4.0）の記載に基づきます。</li>
      <li>学名・科・旧学名は <a href="https://www.gbif.org/" target="_blank" rel="noopener">GBIF Backbone Taxonomy</a>（CC BY 4.0）に基づきます。</li>
      <li>出典の原文は「根拠」から確認できます。出典に記載のない項目は「目安」と表示し、理由を添えています。</li>
      <li>日本語名・明るさの段階（lux）の定義・水やりの日数の目安は、このアプリ独自のものです。</li></ul></div>`;

// ---- ルーター ----
const nav = [['', '🏠', 'ホーム'], ['zukan', '📖', '図鑑'], ['my', '🪴', 'マイ植物'], ['spots', '🪟', '置き場所'], ['settings', '⚙️', '設定']];
async function render() {
  const [path, q = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const [a, b] = path.split('/');
  const v = a === '' ? views.home() : a === 'zukan' && b ? views.detail(b) : a === 'zukan' ? views.zukan(null, q) : a === 'add' ? views.add(b)
    : a === 'my' && b ? views.myDetail(b) : a === 'my' ? views.my() : a === 'spots' ? views.spots() : a === 'spot' ? views.spot(b) : a === 'settings' ? views.settings() : '<p>ページがありません。</p>';
  $('#view').innerHTML = v;
  const tab = a === 'add' ? 'zukan' : a === 'spot' ? 'spots' : a;
  $('#nav').innerHTML = nav.map(([k, i, l]) => `<a href="#/${k}" class="${k === tab ? 'on' : ''}" ${k === tab ? 'aria-current="page"' : ''}><span>${i}</span>${l}</a>`).join('');
  if (a === 'add') updateAddFit();
  if (a === 'spot') updateSpotPreview();
}
const go = (h) => { if (location.hash === h) render(); else location.hash = h; };
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); }

function updateAddFit() {
  const form = $('#add-form'); if (!form) return;
  const spot = S.spots.find((s) => s.id === form.spotId.value);
  const e = byId.get(form.dataset.taxon);
  $('#add-fit').innerHTML = spot ? (() => { const f = fit(e, spot); return `<div class="card"><h3>「${esc(spot.name)}」との相性</h3>${fitBadges(f)}${f.notes.length ? `<ul>${f.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : '<p>よく合っています。</p>'}</div>`; })() : '';
}
const spotFromForm = (form) => ({ window: form.window.value, distance: form.distance.value, sheer: form.sheer.checked,
  lux: form.lux.value === '' ? undefined : Number(form.lux.value), winterMinC: form.winterMinC.value === '' ? undefined : Number(form.winterMinC.value) });
function updateSpotPreview() {
  const form = $('#spot-form'); if (!form) return;
  form.distance.disabled = form.window.value === 'none';
  const L = spotLight(spotFromForm(form));
  const sunJa = { none: '当たらない', morning: '朝に当たる', afternoon: '午後に当たる', midday: '昼に当たる' }[L.sun];
  $('#spot-preview').innerHTML = `<div class="card"><b>明るさ：${LIGHT[L.level].ja}</b>${L.measured ? '（実測値から）' : '（見積もり）'}<br><small>${LIGHT[L.level].where}／直射日光：${sunJa}</small></div>`;
}

// ---- 操作 ----
document.addEventListener('click', async (ev) => {
  const el = ev.target.closest('[data-act]'); if (!el || el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
  const { act, id, type } = el.dataset;
  if (act === 'add') go(`#/add/${id}`);
  if (act === 'quick') { await db.put('events', { id: db.uid(), plantId: id, type, date: today(), memo: '', createdAt: Date.now() }); await load(); render(); toast(type === 'water' ? '水やりを記録しました' : '確認を記録しました'); }
  if (act === 'del-event' && confirm('この記録を削除しますか？')) { await db.del('events', id); await load(); render(); }
  if (act === 'del-plant' && confirm('この植物と記録をすべて削除しますか？')) { await db.deletePlant(id); await load(); go('#/my'); }
  if (act === 'del-spot' && confirm('この置き場所を削除しますか？（植物は削除されません）')) { await db.deleteSpot(id); await load(); go('#/spots'); }
  if (act === 'export') {
    const blob = new Blob([JSON.stringify(await db.exportAll(), null, 1)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `heyamidori-${today()}.json` });
    a.click(); URL.revokeObjectURL(a.href);
  }
});
document.addEventListener('change', async (ev) => {
  const el = ev.target;
  if (el.dataset.act === 'move') {
    const p = S.plants.find((x) => x.id === el.dataset.id);
    await db.put('plants', { ...p, spotId: el.value || null });
    const to = S.spots.find((s) => s.id === el.value);
    await db.put('events', { id: db.uid(), plantId: p.id, type: 'move', date: today(), memo: to ? to.name : '未設定', createdAt: Date.now() });
    await load(); render(); toast('置き場所を変更しました');
  }
  if (el.dataset.act === 'pet') { S.pets = { ...S.pets, [el.name]: el.checked }; await db.setSetting('pets', S.pets); toast('保存しました'); }
  if (el.dataset.act === 'import' && el.files[0]) {
    try {
      const data = JSON.parse(await el.files[0].text());
      const err = db.checkBackup(data); if (err) throw new Error(err);
      if (!confirm(`植物${data.plants.length}件・置き場所${data.spots.length}件を読み込みます。いまのデータは置き換わります。よろしいですか？`)) return;
      await db.importAll(data); await load(); toast('読み込みました'); go('#/');
    } catch (e) { alert(`読み込めませんでした：${e.message}`); }
  }
  if (el.closest('#add-form')) updateAddFit();
  if (el.closest('#spot-form')) updateSpotPreview();
  if (el.closest('#zukan-form') && el.type === 'checkbox') submitZukan(el.form);
});
document.addEventListener('input', (ev) => {
  if (ev.target.closest('#spot-form')) updateSpotPreview();
  if (ev.target.name === 'q' && ev.target.closest('#zukan-form')) { clearTimeout(submitZukan.t); submitZukan.t = setTimeout(() => submitZukan(ev.target.form, true), 250); }
});
function submitZukan(form, keepFocus) {
  const p = new URLSearchParams();
  if (form.q.value) p.set('q', form.q.value);
  for (const k of ['low', 'dry', 'cold', 'pet', 'cv']) if (form[k].checked) p.set(k, '1');
  const pos = form.q.selectionStart;
  history.replaceState(null, '', `#/zukan${p.size ? `?${p}` : ''}`);
  render();
  if (keepFocus) { const q = $('#zukan-form').q; q.focus(); q.setSelectionRange(pos, pos); }
}
document.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const f = ev.target;
  if (f.id === 'zukan-form') return submitZukan(f);
  if (f.id === 'add-form') {
    const plant = { id: db.uid(), taxonId: f.dataset.taxon, nickname: f.nickname.value.trim(), spotId: f.spotId.value || null, acquiredOn: f.acquiredOn.value || today(),
      potCm: f.potCm.value ? Number(f.potCm.value) : undefined, memo: '', createdAt: Date.now() };
    await db.put('plants', plant);
    if (f.lastWater.value) await db.put('events', { id: db.uid(), plantId: plant.id, type: 'water', date: f.lastWater.value, memo: '', createdAt: Date.now() });
    await load(); toast('追加しました'); go(`#/my/${plant.id}`);
  }
  if (f.id === 'event-form') {
    await db.put('events', { id: db.uid(), plantId: f.dataset.id, type: f.type.value, date: f.date.value, memo: f.memo.value.trim(), createdAt: Date.now() });
    await load(); render(); toast('記録しました');
  }
  if (f.id === 'plant-form') {
    const p = S.plants.find((x) => x.id === f.dataset.id);
    await db.put('plants', { ...p, nickname: f.nickname.value.trim(), acquiredOn: f.acquiredOn.value, potCm: f.potCm.value ? Number(f.potCm.value) : undefined, memo: f.memo.value });
    await load(); render(); toast('保存しました');
  }
  if (f.id === 'spot-form') {
    const old = S.spots.find((s) => s.id === f.dataset.id);
    const s = { ...(old ?? { id: db.uid(), createdAt: Date.now() }), name: f.spotName.value.trim(), ...spotFromForm(f) };
    await db.put('spots', s); await load(); toast('保存しました'); go(`#/spot/${s.id}`);
  }
});

window.addEventListener('hashchange', render);
await load();
render();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
