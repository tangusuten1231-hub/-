// 画面（ハッシュで切り替える1ページのアプリ）
import { CATALOG } from './catalog.data.js';
import { LIGHT, DIRECT_SUN, WATERING, HUMIDITY, GROUPS, SYMPTOMS } from './schema.js';
import { WINDOWS, DISTANCES, spotLight, fit, nextCheck, search, recommend, toDateStr, choose, diagnose, seasonalTips, isWinterFor } from './care.js';
import * as db from './db.js';
import { guideSvg, GUIDE_NAME, guideLines, moodFor } from './guide.js';

const byId = new Map(CATALOG.map((e) => [e.id, e]));
const childrenOf = (id) => CATALOG.filter((e) => e.parent === id);
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const today = () => toDateStr(new Date());
const fmtDate = (s) => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${y}年${Number(m)}月${Number(d)}日`; };
const fmtShort = (s) => { if (!s) return ''; const [, m, d] = s.split('-'); return `${Number(m)}/${Number(d)}`; };

// ---- 出典の英語表記の日本語訳 ----
const GROWTH = { Slow: '遅い', Medium: 'ふつう', Rapid: '速い' };
const MAINT = { Low: ['やさしい', 'ok'], Medium: ['ふつう', 'mid'], High: ['手がかかる', 'ng'] };
const PROPAGATION = { Division: '株分け', 'Stem Cutting': '挿し木', 'Leaf Cutting': '葉挿し', Layering: '取り木', Seed: '種まき', 'Root Cutting': '根挿し', Offsets: '子株', Cuttings: '挿し木', 'Air Layering': '取り木' };
const HABIT = { Climbing: 'よじ登る', Creeping: '這う', Spreading: '横に広がる', Erect: '直立', Cascading: '垂れ下がる', Clumping: '株立ち', Arching: '弓なり', Rounded: '丸くまとまる', Dense: '密に茂る', 'Multi-stemmed': '株元から複数の茎', 'Multi-trunked': '多幹', Vase: '花瓶形', Weeping: '枝垂れる', Mounding: 'こんもり', Prostrate: '地を這う', Ascending: '斜めに立ち上がる', Open: 'まばら', Irregular: '不規則', Horizontal: '水平に広がる', Upright: '直立', Columnar: '円柱形', Rosette: 'ロゼット', Pyramidal: '円錐形', Climbing: 'よじ登る', 'Upright/Erect': '直立' };
const SEVERITY = { Low: '弱い', Medium: '中程度', High: '強い' };
const PRINCIPLE = [[/calcium oxalate/i, 'シュウ酸カルシウムの結晶'], [/saponin/i, 'サポニン'], [/anthraquinone/i, 'アントラキノン配糖体'], [/cyanogenic/i, '青酸配糖体'], [/psoralen/i, 'ソラレン'], [/cyclopropenoid/i, 'シクロプロペン脂肪酸'], [/cycasin/i, 'サイカシン'], [/cardiac glycoside/i, '強心配糖体'], [/diterpene|phorbol/i, 'ジテルペン（ホルボールエステル）'], [/bufadienolide/i, 'ブファジエノリド'], [/GI irritant/i, '胃腸への刺激物'], [/unknown/i, '不明']];
const SRC_LABEL = { ncsu: 'NC State', hgic: 'Clemson' };
const quoteBlock = (x) => `<details class="ev"><summary>原文（${SRC_LABEL[x.src] ?? ''}）</summary><q lang="en">${esc(x.quote)}</q></details>`;
const tr = (map, v) => (v == null ? '' : map[v] ?? v);
const principleJa = (p) => { if (!p) return ''; const hit = PRINCIPLE.find(([re]) => re.test(p)); return hit ? `${hit[1]}（${p}）` : p; };

// ---- 状態 ----
let S = { spots: [], plants: [], events: [], photos: [], pets: { cats: false, dogs: false }, seenIntro: false };
async function load() {
  const [spots, plants, events, photos, pets, seenIntro] = await Promise.all([db.all('spots'), db.all('plants'), db.all('events'), db.all('photos'),
    db.getSetting('pets', { cats: false, dogs: false }), db.getSetting('seenIntro', false)]);
  S = { spots: spots.sort((a, b) => a.createdAt - b.createdAt), plants: plants.sort((a, b) => a.createdAt - b.createdAt), events, photos, pets, seenIntro };
}
const spotOf = (p) => S.spots.find((s) => s.id === p.spotId) ?? null;
const eventsOf = (p) => S.events.filter((e) => e.plantId === p.id).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
const photosOf = (p) => S.photos.filter((x) => x.plantId === p.id).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
const activePlants = () => S.plants.filter((p) => !p.archivedAt);
function plantState(p) {
  const entry = byId.get(p.taxonId);
  if (!entry) return null;
  const spot = spotOf(p);
  return { plant: p, entry, spot, fit: spot ? fit(entry, spot) : null, check: nextCheck(entry, spot, eventsOf(p)) };
}
const nameOf = (x) => x.plant.nickname || x.entry.names.ja;

// ---- 部品 ----
function placeholder(group) {
  const g = GROUPS[group] ?? GROUPS.foliage;
  return `<div class="ph-img" aria-hidden="true"><span>${g.icon}</span></div>`;
}
/** 図鑑の写真（なければグループの絵） */
function photo(e, cls = '') {
  if (!e.image) return `<div class="img ${cls}">${placeholder(e.group)}</div>`;
  return `<div class="img ${cls}"><img src="${esc(e.image.src)}" alt="${esc(e.names.ja)}の写真" loading="lazy" decoding="async"></div>`;
}
/** マイ植物の写真：自分で撮った最新の写真 → 図鑑の写真 */
function myPhoto(x, cls = '') {
  const own = photosOf(x.plant)[0];
  if (own) return `<div class="img ${cls}"><img src="${own.data}" alt="${esc(nameOf(x))}の写真"></div>`;
  return photo(x.entry, cls);
}
function credit(e) {
  if (!e.image) return '';
  return `<p class="credit">写真：${esc(e.image.author || '不明')}／<a href="${esc(e.image.licenseUrl)}" target="_blank" rel="noopener">${esc(e.image.license)}</a>（NC State Extension 掲載）${e.image.ofParent ? '・写真は親の種のもの' : ''}</p>`;
}
const SUN = '<svg viewBox="0 0 16 16" class="ic"><circle cx="8" cy="8" r="3.4"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3"/></svg>';
const DROP = '<svg viewBox="0 0 16 16" class="ic"><path d="M8 1.5C6 4.5 3.5 7 3.5 10a4.5 4.5 0 0 0 9 0C12.5 7 10 4.5 8 1.5z"/></svg>';
function meter(n, max, icon, label) {
  return `<span class="meter" role="img" aria-label="${esc(label)}">${Array.from({ length: max }, (_, i) => `<span class="${i < n ? 'on' : ''}">${icon}</span>`).join('')}</span>`;
}
const lightMeter = (k) => meter(LIGHT[k].order + 1, 4, SUN, `明るさ ${LIGHT[k].ja}`);
const waterMeter = (k) => meter(k === 'soak' ? 2 : 4 - WATERING[k].order, 4, DROP, `水やり ${WATERING[k].ja}`);
function quickFacts(e) {
  return `<div class="qf">
    <div><span class="qf-l">明るさ</span>${lightMeter(e.care.light.best)}<span class="qf-v">${LIGHT[e.care.light.best].ja}</span></div>
    <div><span class="qf-l">水やり</span>${waterMeter(e.care.watering.growing)}<span class="qf-v">${WATERING[e.care.watering.growing].ja}</span></div>
    <div><span class="qf-l">冬の温度</span><span class="qf-big">${e.care.temperature.minC}℃</span><span class="qf-v">以上を保つ</span></div>
  </div>`;
}
function badge(field, entry) {
  const ev = entry.evidence[field] ?? [];
  const src = ev.some((x) => x.src !== 'estimate'), est = ev.some((x) => x.src === 'estimate');
  const two = new Set(ev.filter((x) => x.src !== 'estimate').map((x) => x.src)).size > 1;
  if (two && !est) return '<span class="badge src">出典2つ</span>';
  return src && est ? '<span class="badge mix">出典＋目安</span>' : src ? '<span class="badge src">出典</span>' : '<span class="badge est">目安</span>';
}
function evidenceBlock(field, entry) {
  const ev = entry.evidence[field] ?? [];
  const from = entry.inherited[field] ? `<p class="inherit">「${esc(byId.get(entry.inherited[field])?.names.ja)}」の値を引き継いでいます</p>` : '';
  return `<details class="ev"><summary>根拠</summary>${from}<ul>${ev.map((x) => x.src !== 'estimate'
    ? `<li><span class="badge src">${SRC_LABEL[x.src]}</span> <q lang="en">${esc(x.quote)}</q>${x.fahrenheit ? ` <small>（${x.fahrenheit.map((f) => `${f}°F`).join('〜')} を℃に換算）</small>` : ''}</li>`
    : `<li><span class="badge est">目安</span> ${esc(x.reason)}</li>`).join('')}</ul>${ev.filter((x) => x.src !== 'estimate').length > 1 && field.startsWith('temperature') ? '<p class="small muted">出典によって数値が違うときは、植物にとって安全な側（寒さに弱い側）の値を使っています。</p>' : ''}</details>`;
}
function careRow(label, value, field, entry) {
  return `<div class="care-row"><div class="care-head"><span class="care-label">${label}</span>${badge(field, entry)}</div><div class="care-value">${value}</div>${evidenceBlock(field, entry)}</div>`;
}
const lightText = (k) => `${LIGHT[k].ja}<small>${LIGHT[k].where}（${LIGHT[k].lux[0].toLocaleString()}〜${LIGHT[k].lux[1].toLocaleString()} lux）</small>`;
function toxBadge(v, label) {
  if (v === 'listed') return `<li class="tox-yes">⚠️ ${label}：害あり（出典に記載）</li>`;
  if (v === 'not-listed') return `<li class="tox-unk">${label}：記載なし <small>（安全とは限りません）</small></li>`;
  return `<li class="tox-unk">${label}：情報なし</li>`;
}
const petWarn = (e) => (S.pets.cats && e.toxicity?.cats === 'listed') || (S.pets.dogs && e.toxicity?.dogs === 'listed');
function plantCard(e, extra = '', href = `#/zukan/${e.id}`) {
  return `<a class="card pcard" href="${href}">${photo(e, 'thumb')}
    <div class="pc-body"><div class="pc-name">${esc(e.names.ja)}</div>
    <div class="pc-sci"><i>${esc(e.scientificName)}</i></div>
    <div class="pc-tags">${e.rank === 'cultivar' ? '<span class="badge">品種</span>' : ''}<span class="badge g">${GROUPS[e.group]?.icon ?? ''} ${GROUPS[e.group]?.ja ?? ''}</span>${petWarn(e) ? '<span class="badge warn">ペット注意</span>' : ''}</div>
    <div class="pc-icons">${lightMeter(e.care.light.best)} ${waterMeter(e.care.watering.growing)} <span class="mini">${e.care.temperature.minC}℃〜</span></div>${extra}</div></a>`;
}
function fitBadges(f) {
  if (!f) return '<span class="badge">置き場所未設定</span>';
  const L = { good: ['ok', '明るさ ◎'], ok: ['mid', '明るさ ○'], dark: ['ng', '暗すぎ'], bright: ['ng', '日差し注意'] }[f.light];
  const T = { good: ['ok', '冬の室温 ◎'], slow: ['mid', '冬は休眠気味'], cold: ['ng', '冬は寒すぎ'], unknown: ['', '室温未入力'] }[f.temp];
  return `<span class="badge ${L[0]}">${L[1]}</span> <span class="badge ${T[0]}">${T[1]}</span>`;
}
function dueText(c) {
  if (!c.due) return '水やりの記録なし';
  if (c.overdueDays > 0) return `土を確かめる日を${c.overdueDays}日過ぎています`;
  if (c.overdueDays === 0) return '今日、土を確かめる日';
  return `次に土を確かめる日：${fmtShort(c.due)}`;
}

// ---- 画面 ----
const views = {};

views.home = () => {
  const ps = activePlants().map(plantState).filter(Boolean);
  const tipPool = [];
  const ids = new Set(ps.map((x) => x.entry.id));
  for (const e of CATALOG) if (ids.size === 0 || ids.has(e.id)) for (const tip of e.tips) tipPool.push({ entry: e, tip });
  const lines = guideLines({ plants: ps, today: new Date(), pets: S.pets, tipPool });
  const mood = moodFor(lines);
  const [first, ...rest] = lines;
  const due = ps.filter((x) => x.check.due && x.check.overdueDays >= 0);
  const noRecord = ps.filter((x) => !x.check.due);
  const upcoming = ps.filter((x) => x.check.due && x.check.overdueDays < 0).sort((a, b) => a.check.due.localeCompare(b.check.due)).slice(0, 6);
  const m = new Date().getMonth() + 1;
  const season = [];
  for (const x of ps) for (const t of seasonalTips(x.entry, m)) season.push({ x, t });
  const winterSwitch = (m === 11 || m === 4) && ps.length;
  return `<section class="hero">
      <div class="guide-face">${guideSvg(mood)}</div>
      <div class="bubble"><b>${GUIDE_NAME}</b><p>${esc(first.text)}</p>${first.cite ? `<small>出典：<a href="${esc(first.cite.url)}" target="_blank" rel="noopener">${esc(first.cite.label)}</a></small>` : ''}</div>
    </section>
    ${rest.length ? `<ul class="guide-more">${rest.map((l) => `<li class="${l.level ?? ''}">${esc(l.text)}${l.cite ? ` <small>（<a href="${esc(l.cite.url)}" target="_blank" rel="noopener">出典</a>）</small>` : ''}</li>`).join('')}</ul>` : ''}
    ${!ps.length ? `<h2>はじめかた</h2><ol class="steps">
      <li><a href="#/spot/new"><b>置き場所を登録</b><span>窓の向き・距離・冬の室温から、明るさと寒さを見積もります</span></a></li>
      <li><a href="#/choose"><b>植物を選ぶ</b><span>置き場所・ペット・手間から、合う植物を提案します</span></a></li>
      <li><a href="#/zukan"><b>図鑑から追加</b><span>持っている植物を探して「マイ植物に追加」</span></a></li>
      <li><span class="nolink"><b>水やりを記録</b><span>次に土を確かめる日を、季節と部屋の温度に合わせて教えます</span></span></li></ol>` : `
    <h2>今日のお世話 <small class="muted">${due.length ? `${due.length}鉢` : ''}</small></h2>
    ${due.length ? `<form id="bulk-form" class="card bulk">
        ${due.map((x) => `<label class="bulk-row">${myPhoto(x, 'mini-img')}<span class="bulk-name"><b>${esc(nameOf(x))}</b><small>${WATERING[x.check.style].ja}${x.check.winter ? '（冬）' : ''}・${dueText(x.check)}</small></span><input type="checkbox" name="p" value="${x.plant.id}" checked aria-label="${esc(nameOf(x))}を選ぶ"></label>`).join('')}
        <p class="small muted">指で土を触って、乾いていた植物にチェックを残して記録します。湿っていた植物は「まだ湿っていた」で記録すると、数日後にまたお知らせします。</p>
        <div class="row"><button class="primary" data-bulk="water">💧 チェックした植物に水やり</button><button class="sub" data-bulk="check">👆 まだ湿っていた</button></div></form>`
      : `<p class="card soft">今日、土を確かめる植物はありません。🌿</p>`}
    ${noRecord.length ? `<p class="small">まだ水やりの記録がない植物：${noRecord.map((x) => `<a href="#/my/${x.plant.id}">${esc(nameOf(x))}</a>`).join('、')}</p>` : ''}
    ${upcoming.length ? `<h3>これから</h3><ul class="upcoming">${upcoming.map((x) => `<li><a href="#/my/${x.plant.id}">${esc(nameOf(x))}</a><span>${fmtShort(x.check.due)}</span></li>`).join('')}</ul>` : ''}
    ${winterSwitch || season.length ? `<h2>${m}月のお世話</h2>
      ${winterSwitch ? `<div class="card soft"><b>${m === 11 ? '冬の水やりに切り替わります' : '生育期の水やりに戻ります'}</b><p class="small">${m === 11 ? '寒い部屋では成長がゆっくりになり、水を吸う量が減ります。暖かい部屋（よく育つ温度を保てる部屋）の植物は、冬も生育期として扱います。' : '暖かくなると成長が始まります。土の乾き方が早くなるので、こまめに土を確かめましょう。'}</p></div>` : ''}
      ${season.length ? `<ul class="season">${season.map(({ x, t }) => `<li><b>${esc(nameOf(x))}</b>：${esc(t.ja)}${quoteBlock(t)}</li>`).join('')}</ul>` : ''}` : ''}`}
    <h2>こんなときは</h2>
    <div class="shortcuts">
      <a href="#/choose" class="sc"><span>🔍</span>どれを買えばいい？<small>植物選び</small></a>
      <a href="#/help" class="sc"><span>🩺</span>元気がない<small>困ったとき</small></a>
      <a href="#/zukan" class="sc"><span>📖</span>育て方を調べる<small>図鑑</small></a>
      <a href="#/spots" class="sc"><span>🪟</span>置き場所を見直す<small>置き場所</small></a>
    </div>
    <p class="note">「土を確かめる日」は水やりの段階から出した目安です。水をやる前に、必ず指で土の乾き具合を確かめてください。</p>`;
};

/** 図鑑の検索結果だけを作る（入力欄は作り直さない：日本語入力の変換中に消えないように） */
function zukanResults(params) {
  const groups = params.getAll('g');
  const f = { lowLight: params.has('low'), dryAir: params.has('dry'), cold: params.has('cold'), noPetListing: params.has('pet'), rank: params.has('cv') ? undefined : 'base' };
  let list = search(CATALOG, params.get('q') ?? '', f);
  if (groups.length) list = list.filter((e) => groups.includes(e.group));
  list.sort((a, b) => a.names.ja.localeCompare(b.names.ja, 'ja'));
  return `${f.noPetListing ? '<p class="note">「記載なし」は、出典に害があると書かれていないという意味です。安全を保証するものではありません。</p>' : ''}
    <p class="muted">${list.length}件</p>${list.length ? `<div class="grid">${list.map((e) => plantCard(e)).join('')}</div>` : '<p class="card soft">見つかりませんでした。ひらがな・カタカナ・学名でも探せます。</p>'}`;
}
views.zukan = (_, q) => {
  const params = new URLSearchParams(q);
  const groups = params.getAll('g');
  const chk = (k, label) => `<label class="chip"><input type="checkbox" name="${k}" ${params.has(k) ? 'checked' : ''}> ${label}</label>`;
  return `<h1>図鑑</h1>
    <form id="zukan-form" class="search" role="search"><input type="search" name="q" value="${esc(params.get('q') ?? '')}" placeholder="名前・学名・旧学名で検索（例：さんすべりあ）" aria-label="検索" enterkeyhint="search" autocomplete="off">
      <div class="chips scroll">${Object.entries(GROUPS).map(([k, g]) => `<label class="chip g"><input type="checkbox" name="g" value="${k}" ${groups.includes(k) ? 'checked' : ''}> ${g.icon} ${g.ja}</label>`).join('')}</div>
      <div class="chips">${chk('low', '暗めでも育つ')}${chk('dry', '乾燥に強い')}${chk('cold', '寒さに強い（5℃以下）')}${chk('pet', '猫・犬への害の記載なし')}${chk('cv', '品種も表示')}</div></form>
    <div id="zukan-results">${zukanResults(params)}</div>`;
};

views.detail = (id) => {
  const e = byId.get(id);
  if (!e) return '<p>見つかりません。</p>';
  const c = e.care;
  const kids = childrenOf(e.id);
  const t = e.toxicity;
  const f = e.facts;
  const allTips = [...e.tips, ...e.parentTips];
  const bySym = {};
  for (const tip of allTips) if (tip.symptom) (bySym[tip.symptom] ??= []).push(tip);
  const plain = allTips.filter((x) => !x.symptom);
  const maint = f?.maintenance ? MAINT[f.maintenance] : null;
  return `<div class="detail-hero">${photo(e, 'hero-img')}
      <div class="dh-text"><p class="crumb"><a href="#/zukan">図鑑</a>${e.parent ? ` › <a href="#/zukan/${e.parent}">${esc(byId.get(e.parent).names.ja)}</a>` : ''}</p>
      <h1>${esc(e.names.ja)}</h1>
      <p class="sci"><i>${esc(e.scientificName)}</i>${e.family ? `　${esc(e.family)}` : ''}</p></div></div>
    ${credit(e)}
    <div class="pc-tags"><span class="badge g">${GROUPS[e.group].icon} ${GROUPS[e.group].ja}</span>${maint ? `<span class="badge ${maint[1]}">手入れ：${maint[0]}</span>` : ''}${petWarn(e) ? '<span class="badge warn">ペット注意</span>' : ''}${e.rank === 'cultivar' ? '<span class="badge">品種</span>' : e.rank === 'genus' ? '<span class="badge">属（仲間）</span>' : ''}</div>
    ${e.names.aliases.length ? `<p class="aliases">別名・流通名：${e.names.aliases.map(esc).join('、')}</p>` : ''}
    ${e.note || e.parentNote ? `<p class="note">${esc(e.note ?? e.parentNote)}</p>` : ''}
    ${quickFacts(e)}
    <button data-act="add" data-id="${e.id}" class="primary wide">＋ マイ植物に追加</button>
    <h2>室内での育て方</h2>
    <div class="care">
      ${careRow('いちばんよい明るさ', lightText(c.light.best), 'light.best', e)}
      ${careRow('育つ最低限の明るさ', lightText(c.light.min), 'light.min', e)}
      ${careRow('直射日光', DIRECT_SUN[c.light.directSun].ja, 'light.directSun', e)}
      ${careRow('最低温度', `${c.temperature.minC}℃<small>これより下がると傷むおそれ</small>`, 'temperature.minC', e)}
      ${careRow('よく育つ温度', `${c.temperature.idealC[0]}〜${c.temperature.idealC[1]}℃<small>冬もこの温度を保てる部屋なら、生育期として水やりします</small>`, 'temperature.idealC', e)}
      ${careRow('湿度', HUMIDITY[c.humidity].ja, 'humidity', e)}
      ${careRow('水やり（生育期）', `${WATERING[c.watering.growing].ja}<small>${WATERING[c.watering.growing].how}</small>`, 'watering.growing', e)}
      ${careRow('水やり（冬・寒い部屋）', `${WATERING[c.watering.winter].ja}<small>${WATERING[c.watering.winter].how}</small>`, 'watering.winter', e)}
    </div>
    ${plain.length ? `<h2>育てるコツ</h2><ul class="tips">${plain.map((x) => `<li>${esc(x.ja)}${quoteBlock(x)}</li>`).join('')}</ul>` : ''}
    ${Object.keys(bySym).length ? `<h2>こんな症状が出たら</h2><div class="symlist">${Object.entries(bySym).map(([k, ts]) => `<div class="card sym"><b>${esc(SYMPTOMS[k].ja)}</b><ul>${ts.map((x) => `<li>${esc(x.ja)}${quoteBlock(x)}</li>`).join('')}</ul></div>`).join('')}</div>` : ''}
    <h2>人やペットへの害</h2>
    ${t ? `<ul class="tox">${toxBadge(t.cats, '猫')}${toxBadge(t.dogs, '犬')}${toxBadge(t.children, '子ども')}${toxBadge(t.humans, '人')}${t.dermatitis ? '<li class="tox-yes">⚠️ 汁で皮ふがかぶれることがある</li>' : ''}</ul>
      ${t.severity || t.principle ? `<p>${t.severity ? `毒性の強さ：${tr(SEVERITY, t.severity)}　` : ''}${t.principle ? `成分：${esc(principleJa(t.principle))}` : ''}</p>` : ''}
      ${t.extra?.length ? `<ul class="small">${t.extra.map((x) => `<li><span class="badge src">${SRC_LABEL[x.src]}</span> <q lang="en">${esc(x.quote)}</q></li>`).join('')}</ul>` : ''}
      ${t.symptoms ? `<details><summary>症状（出典の原文）</summary><p lang="en">${esc(t.symptoms)}</p></details>` : ''}
      <p class="note">出典（NC State Extension${t.extra?.length ? '・Clemson Extension' : ''}）の記載をもとに表示しています。どちらかの出典に害があると書かれていれば「害あり」とします。「記載なし」は安全という意味ではありません。口にした場合は医師・獣医師に相談してください。</p>` : '<p>出典の情報がありません。</p>'}
    ${f ? `<h2>基本データ</h2><dl class="facts">
      ${f.origin ? `<dt>原産地</dt><dd lang="en">${esc(f.origin)}</dd>` : ''}
      ${f.growthRate ? `<dt>成長の速さ</dt><dd>${tr(GROWTH, f.growthRate)}</dd>` : ''}
      ${f.habit.length ? `<dt>姿</dt><dd>${f.habit.map((h) => tr(HABIT, h)).join('・')}</dd>` : ''}
      ${f.propagation.length ? `<dt>ふやし方</dt><dd>${f.propagation.map((h) => tr(PROPAGATION, h)).join('・')}</dd>` : ''}
      ${f.hardinessZones.length ? `<dt>耐寒性ゾーン</dt><dd>USDA ${f.hardinessZones[0]}〜${f.hardinessZones.at(-1)}<small>（屋外で約${Math.round(f.hardinessMinC)}℃まで）</small></dd>` : ''}
      ${e.taxonomy?.synonyms.length ? `<dt>旧学名など</dt><dd><i>${e.taxonomy.synonyms.slice(0, 8).map(esc).join(', ')}</i>${e.taxonomy.synonyms.length > 8 ? ' ほか' : ''}</dd>` : ''}
      ${e.taxonomy && e.taxonomy.status !== 'ACCEPTED' ? `<dt>分類の扱い</dt><dd>GBIF では <i>${esc(e.taxonomy.acceptedName)}</i> を正式名としています</dd>` : ''}
    </dl>` : ''}
    ${kids.length ? `<h2>品種</h2><div class="grid">${kids.map((k) => plantCard(k)).join('')}</div>` : ''}
    <h2>出典</h2><ul class="src-list">
      ${e.ncsu ? `<li><a href="${esc(e.ncsu.url)}" target="_blank" rel="noopener">NC State Extension Gardener Plant Toolbox</a>（CC BY 4.0・${esc(e.ncsu.retrieved)} 取得）</li>` : ''}
      ${e.hgic ? `<li><a href="${esc(e.hgic.url)}" target="_blank" rel="noopener">Clemson Extension HGIC ${esc(e.hgic.id ?? '')}「${esc(e.hgic.title)}」</a>（${esc(e.hgic.retrieved)} 取得・必要な文の引用）</li>` : ''}
      ${e.taxonomy ? `<li><a href="${esc(e.taxonomy.url)}" target="_blank" rel="noopener">GBIF Backbone Taxonomy</a>（CC BY 4.0・${esc(e.taxonomy.retrieved)} 取得）</li>` : ''}
    </ul>
    <p class="note">「目安」は出典に記載がない項目を、理由を明記したうえで補った値です。「根拠」を開くと出典の原文や理由を確認できます。</p>`;
};

views.add = (taxonId) => {
  const e = byId.get(taxonId);
  if (!e) return '<p>見つかりません。</p>';
  return `<h1>マイ植物に追加</h1>
    <div class="card pcard flat">${photo(e, 'thumb')}<div class="pc-body"><div class="pc-name">${esc(e.names.ja)}</div><div class="pc-sci"><i>${esc(e.scientificName)}</i></div></div></div>
    <form id="add-form" class="form" data-taxon="${e.id}">
      <label>呼び名（任意）<input name="nickname" placeholder="例：リビングのモンステラ"></label>
      <label>置き場所<select name="spotId"><option value="">（あとで決める）</option>${S.spots.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label>
      ${S.spots.length ? '' : '<p class="muted small">置き場所はまだありません。あとで「置き場所」から登録できます。</p>'}
      <label>迎えた日<input type="date" name="acquiredOn" value="${today()}"></label>
      <label>最後に水をやった日（わかれば）<input type="date" name="lastWater"></label>
      <label>鉢の直径 cm（任意）<input type="number" name="potCm" min="3" max="100" inputmode="numeric"></label>
      <button class="primary">追加する</button></form>
    <div id="add-fit"></div>`;
};

views.my = () => {
  const ps = activePlants().map(plantState).filter(Boolean);
  if (!ps.length) return `<h1>マイ植物</h1><div class="empty">${guideSvg('normal')}<p>まだ植物が登録されていません。</p><div class="row center"><a class="button primary" href="#/choose">植物を選ぶ</a><a class="button sub" href="#/zukan">図鑑から探す</a></div></div>`;
  const groups = new Map();
  for (const x of ps) { const k = x.spot?.id ?? ''; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(x); }
  return `<div class="title-row"><h1>マイ植物 <small class="muted">${ps.length}鉢</small></h1><a class="button sub small-btn" href="#/spots">🪟 置き場所</a></div>
    ${[...groups].map(([k, xs]) => `<h2>${esc(k ? xs[0].spot.name : '置き場所未設定')}</h2><div class="grid">
    ${xs.map((x) => `<a class="card pcard" href="#/my/${x.plant.id}">${myPhoto(x, 'thumb')}<div class="pc-body"><div class="pc-name">${esc(nameOf(x))}</div>
      ${x.plant.nickname ? `<div class="pc-sci">${esc(x.entry.names.ja)}</div>` : ''}
      <div class="pc-tags">${fitBadges(x.fit)}</div>
      <div class="pc-icons ${x.check.due && x.check.overdueDays >= 0 ? 'due' : ''}">${dueText(x.check)}</div></div></a>`).join('')}</div>`).join('')}`;
};

views.myDetail = (id) => {
  const p = S.plants.find((x) => x.id === id);
  const x = p && plantState(p);
  if (!x) return '<p>見つかりません。</p>';
  const evs = eventsOf(p);
  const phs = photosOf(p);
  return `<div class="detail-hero">${myPhoto(x, 'hero-img')}
      <div class="dh-text"><p class="crumb"><a href="#/my">マイ植物</a></p><h1>${esc(nameOf(x))}</h1>
      <p class="sci"><a href="#/zukan/${x.entry.id}">${esc(x.entry.names.ja)}</a>${p.acquiredOn ? `・${fmtDate(p.acquiredOn)}から` : ''}</p></div></div>
    <div class="card"><h3>💧 水やり</h3>
      <p>いまは<b>${x.check.winter ? '冬（水を控える時期）' : '生育期'}</b>：${WATERING[x.check.style].ja}。<span class="small">${esc(x.check.how)}</span></p>
      <p>${x.check.due ? `次に土を確かめる日：<b>${fmtDate(x.check.due)}</b>（${x.check.days}日ごとの目安）` : '水やりを記録すると、次に土を確かめる日を表示します。'}</p>
      <div class="row"><button class="primary" data-act="quick" data-type="water" data-id="${p.id}">💧 今日水をやった</button><button class="sub" data-act="quick" data-type="check" data-id="${p.id}">👆 まだ湿っていた</button></div></div>
    <div class="card"><h3>🪟 置き場所</h3>
      <select data-act="move" data-id="${p.id}" aria-label="置き場所"><option value="">（未設定）</option>${S.spots.map((s) => `<option value="${s.id}" ${s.id === p.spotId ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>
      <div class="pc-tags">${fitBadges(x.fit)}</div>${x.fit?.notes.length ? `<ul>${x.fit.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : x.fit ? '<p class="small">この場所はよく合っています。</p>' : ''}
      ${!S.spots.length ? '<p class="small"><a href="#/spot/new">置き場所を登録する</a>と、明るさと寒さの相性がわかります。</p>' : ''}
      ${x.fit && !x.fit.spotLight.measured ? '<p class="muted small">明るさは窓の向きと距離からの見積もりです。照度計アプリなどで測った値を置き場所に入れると正確になります。</p>' : ''}</div>
    <div class="row"><a class="button sub" href="#/help?plant=${p.id}">🩺 元気がないときは</a><a class="button sub" href="#/zukan/${x.entry.id}">📖 育て方を見る</a></div>
    <h2>📷 成長の記録</h2>
    <label class="button sub photo-btn">写真を追加<input type="file" accept="image/*" data-act="photo" data-id="${p.id}" hidden></label>
    ${phs.length ? `<div class="gallery">${phs.map((ph) => `<figure><img src="${ph.data}" alt="${fmtDate(ph.date)}の写真" loading="lazy"><figcaption>${fmtShort(ph.date)}<button class="link" data-act="del-photo" data-id="${ph.id}" aria-label="写真を削除">×</button></figcaption></figure>`).join('')}</div>` : '<p class="muted small">写真を残すと、成長や変化を見比べられます。写真は端末の中だけに保存されます。</p>'}
    <h2>📝 記録</h2>
    <form id="event-form" class="card form compact" data-id="${p.id}">
      <div class="row"><select name="type" aria-label="内容">${Object.entries(db.EVENT_TYPES).map(([k, v]) => `<option value="${k}">${v.icon} ${v.ja}</option>`).join('')}</select>
      <input type="date" name="date" value="${today()}" required aria-label="日付"></div>
      <input name="memo" placeholder="メモ（任意）" aria-label="メモ"><button>記録する</button></form>
    ${evs.length ? `<ul class="log">${evs.map((ev) => `<li><span>${fmtShort(ev.date)}</span> ${db.EVENT_TYPES[ev.type]?.icon ?? ''} ${db.EVENT_TYPES[ev.type]?.ja ?? esc(ev.type)}${ev.memo ? `：${esc(ev.memo)}` : ''} <button class="link" data-act="del-event" data-id="${ev.id}" aria-label="削除">×</button></li>`).join('')}</ul>` : '<p class="muted">まだ記録はありません。</p>'}
    <details class="card"><summary>呼び名・情報の変更</summary><form id="plant-form" class="form" data-id="${p.id}">
      <label>呼び名<input name="nickname" value="${esc(p.nickname)}"></label>
      <label>迎えた日<input type="date" name="acquiredOn" value="${esc(p.acquiredOn)}"></label>
      <label>鉢の直径 cm<input type="number" name="potCm" value="${esc(p.potCm ?? '')}" min="3" max="100"></label>
      <label>メモ<textarea name="memo">${esc(p.memo)}</textarea></label><button>保存</button></form>
      <button class="danger" data-act="del-plant" data-id="${p.id}">この植物を削除</button></details>`;
};

// ---- 植物選び ----
views.choose = () => {
  const opt = (obj, cur) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${v}</option>`).join('');
  return `<h1>植物を選ぶ</h1>
    <p class="muted">置く場所と暮らし方に合う植物を、図鑑の${CATALOG.filter((e) => e.rank !== 'cultivar').length}種類から提案します。</p>
    <form id="choose-form" class="form">
      <fieldset><legend>① どこに置く？</legend>
        ${S.spots.length ? `<label>登録した置き場所<select name="spotId"><option value="">（下で指定する）</option>${S.spots.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label>` : ''}
        <div class="manual">
        <label>窓の向き<select name="window">${opt(WINDOWS, 'E')}</select></label>
        <label>窓からの距離<select name="distance">${opt(DISTANCES, 'near')}</select></label>
        <label class="check"><input type="checkbox" name="sheer" checked> レースカーテン越し</label>
        <label>冬の夜の最低室温<select name="winterMinC"><option value="">わからない</option><option value="3">5℃より下がる</option><option value="7">5〜10℃</option><option value="12">10〜15℃</option><option value="17">15℃以上</option></select></label></div>
      </fieldset>
      <fieldset><legend>② 一緒に暮らす動物</legend>
        <label class="check"><input type="checkbox" name="cats" ${S.pets.cats ? 'checked' : ''}> 猫</label>
        <label class="check"><input type="checkbox" name="dogs" ${S.pets.dogs ? 'checked' : ''}> 犬</label></fieldset>
      <fieldset><legend>③ お世話のペース</legend>
        <label class="check"><input type="radio" name="effort" value="rare"> 水やりはたまにしかできない</label>
        <label class="check"><input type="radio" name="effort" value="normal" checked> ふつう</label>
        <label class="check"><input type="radio" name="effort" value="often"> こまめにお世話したい</label>
        <label class="check"><input type="checkbox" name="beginner" checked> はじめてなので育てやすいものがいい</label></fieldset>
      <fieldset><legend>④ どんな植物？（複数可・選ばなければ全部）</legend>
        <div class="chips">${Object.entries(GROUPS).map(([k, g]) => `<label class="chip g"><input type="checkbox" name="g" value="${k}"> ${g.icon} ${g.ja}</label>`).join('')}</div></fieldset>
      <button class="primary wide">提案を見る</button></form>
    <div id="choose-results"></div>`;
};
function chooseFromForm(f) {
  const spot = f.spotId?.value ? S.spots.find((s) => s.id === f.spotId.value)
    : { window: f.window.value, distance: f.distance.value, sheer: f.sheer.checked, winterMinC: f.winterMinC.value === '' ? undefined : Number(f.winterMinC.value) };
  const answers = { spot, pets: { cats: f.cats.checked, dogs: f.dogs.checked }, effort: f.effort.value, beginner: f.beginner.checked,
    groups: [...f.querySelectorAll('input[name=g]:checked')].map((x) => x.value) };
  const res = choose(CATALOG, answers, 12);
  const L = spotLight(spot);
  $('#choose-results').innerHTML = `<h2>おすすめ ${res.length}種類</h2>
    <p class="small muted">この場所の明るさ：<b>${LIGHT[L.level].ja}</b>（${LIGHT[L.level].where}）${spot.winterMinC == null ? '。冬の室温がわからないため、寒さとの相性は判定していません' : ''}</p>
    ${res.length ? `<div class="grid">${res.map(({ e, reasons }) => plantCard(e, `<ul class="reasons">${reasons.slice(0, 3).map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`)).join('')}</div>`
      : '<p class="card soft">条件に合う植物が見つかりませんでした。明るい場所を選ぶか、植物の種類の条件を外してみてください。</p>'}
    <p class="note">提案は図鑑のデータ（出典と目安）から機械的に選んだものです。お店では、葉の色つやがよく、虫や傷のない株を選びましょう。</p>`;
  $('#choose-results').scrollIntoView({ behavior: 'smooth' });
}

// ---- 困ったとき ----
views.help = (_, q) => {
  const params = new URLSearchParams(q);
  const pid = params.get('plant') ?? '';
  const sym = params.get('s') ?? '';
  const ps = activePlants().map(plantState).filter(Boolean);
  const taxon = params.get('taxon') ?? '';
  const x = ps.find((y) => y.plant.id === pid);
  const entry = x?.entry ?? byId.get(taxon);
  let result = '';
  if (entry && sym) {
    const r = diagnose(entry, sym, { spot: x?.spot ?? null, events: x ? eventsOf(x.plant) : [] });
    const others = CATALOG.filter((e) => e.rank !== 'cultivar' && e.id !== entry.id && e.group === entry.group && [...e.tips].some((t) => t.symptom === sym)).slice(0, 4);
    result = `<h2>「${esc(r.symptom.ja)}」の原因の候補</h2>
      ${r.checks.length ? `<h3>あなたの記録・置き場所から</h3><ul class="checks">${r.checks.map((c) => `<li class="${c.level}">${esc(c.text)}</li>`).join('')}</ul>` : ''}
      <h3>${esc(entry.names.ja)}について出典に書かれていること</h3>
      ${r.tips.length ? `<ul class="tips">${r.tips.map((t) => `<li>${esc(t.ja)}${quoteBlock(t)}</li>`).join('')}</ul>`
        : `<p class="card soft">この植物について、この症状の記載は出典にありません。上の判定や、下の同じ仲間での記載も参考にしてください。</p>`}
      ${others.length ? `<h3>同じ仲間（${GROUPS[entry.group].ja}）での記載</h3><ul class="tips">${others.map((e) => e.tips.filter((t) => t.symptom === sym).map((t) => `<li><b>${esc(e.names.ja)}</b>：${esc(t.ja)}</li>`).join('')).join('')}</ul>` : ''}
      <p class="note">ここに出る内容は、出典（NC State Extension・Clemson Extension）の記載と、あなたの記録からの判定です。枯れそうなときや判断に迷うときは、購入店や園芸店に相談してください。</p>`;
  }
  return `<h1>困ったとき</h1>
    <div class="hero small-hero"><div class="guide-face">${guideSvg('worried')}</div><div class="bubble"><b>${GUIDE_NAME}</b><p>どの植物に、どんな症状が出ているか教えて。出典の記載と、記録からわかることを一緒に探すよ。</p></div></div>
    <form id="help-form" class="form">
      <label>植物<select name="plant">${ps.length ? `<optgroup label="マイ植物">${ps.map((y) => `<option value="p:${y.plant.id}" ${y.plant.id === pid ? 'selected' : ''}>${esc(nameOf(y))}</option>`).join('')}</optgroup>` : ''}
        <optgroup label="図鑑から">${CATALOG.filter((e) => e.rank !== 'cultivar').sort((a, b) => a.names.ja.localeCompare(b.names.ja, 'ja')).map((e) => `<option value="t:${e.id}" ${!pid && e.id === taxon ? 'selected' : ''}>${esc(e.names.ja)}</option>`).join('')}</optgroup></select></label>
      <fieldset><legend>症状</legend><div class="chips">${Object.entries(SYMPTOMS).map(([k, s]) => `<label class="chip"><input type="radio" name="s" value="${k}" ${k === sym ? 'checked' : ''}> ${esc(s.ja)}</label>`).join('')}</div></fieldset>
    </form>
    <div id="help-result">${result || '<p class="muted">植物と症状を選ぶと、原因の候補を表示します。</p>'}</div>`;
};

views.spots = () => `<h1>置き場所</h1>
  <p class="muted">植物を置く場所ごとに、窓の向き・窓からの距離・冬の最低室温を登録します。明るさの見積もりと、合う植物の提案に使います。</p>
  ${S.spots.map((s) => { const L = spotLight(s); const n = activePlants().filter((p) => p.spotId === s.id).length;
    return `<a class="card spot" href="#/spot/${s.id}"><div class="pc-name">${esc(s.name)}</div>
      <div class="pc-icons">${WINDOWS[s.window]}${s.window !== 'none' ? `向き・${DISTANCES[s.distance]}` : ''}${s.sheer ? '・レース越し' : ''}</div>
      <div class="spot-meta">${lightMeter(L.level)} ${LIGHT[L.level].ja}${L.measured ? '（実測）' : '（見積もり）'}　🌡️ 冬の最低 ${Number.isFinite(s.winterMinC) ? `${s.winterMinC}℃` : '未入力'}　🪴 ${n}鉢</div></a>`; }).join('')}
  <a class="button primary" href="#/spot/new">＋ 置き場所を追加</a>`;

views.spot = (id) => {
  const s = id === 'new' ? { id: '', name: '', window: 'S', distance: 'near', sheer: true } : S.spots.find((x) => x.id === id);
  if (!s) return '<p>見つかりません。</p>';
  const opt = (obj, cur) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${v}</option>`).join('');
  const recs = s.id ? recommend(CATALOG.filter((e) => !petWarn(e)), s, 8) : [];
  return `<p class="crumb"><a href="#/spots">置き場所</a></p><h1>${s.id ? esc(s.name) : '置き場所を追加'}</h1>
    <form id="spot-form" class="form" data-id="${s.id}">
      <label>名前<input name="spotName" value="${esc(s.name)}" required placeholder="例：リビングの南の窓"></label>
      <label>窓の向き<select name="window">${opt(WINDOWS, s.window)}</select></label>
      <label>窓からの距離<select name="distance">${opt(DISTANCES, s.distance)}</select></label>
      <label class="check"><input type="checkbox" name="sheer" ${s.sheer ? 'checked' : ''}> レースカーテン越し（直射日光が当たらない）</label>
      <label>昼の明るさ（lux・任意）<input type="number" name="lux" min="0" max="120000" value="${esc(s.lux ?? '')}" inputmode="numeric" placeholder="照度計で測った値"></label>
      <label>冬の夜の最低室温（℃・任意）<input type="number" name="winterMinC" min="-15" max="30" step="1" value="${esc(s.winterMinC ?? '')}" inputmode="numeric" placeholder="例：8"></label>
      <p class="muted small">冬の最低室温は、明け方の窓辺がいちばん冷えます。最高最低温度計で測るのが確実です。</p>
      <div id="spot-preview"></div>
      <button class="primary">保存</button></form>
    ${s.id ? `<h2>この場所に合う植物</h2>${recs.length ? `<div class="grid">${recs.map(({ e }) => plantCard(e)).join('')}</div>` : '<p class="muted">明るさ・室温の両方に合う植物が見つかりませんでした。</p>'}
      ${S.pets.cats || S.pets.dogs ? '<p class="small muted">ペットに害の記載がある植物は除いています。</p>' : ''}
      <button class="danger" data-act="del-spot" data-id="${s.id}">この置き場所を削除</button>` : ''}`;
};

views.menu = () => `<h1>メニュー</h1>
  <div class="menu">
    <a href="#/choose"><span>🔍</span><b>植物を選ぶ</b><small>置き場所・ペット・手間から提案</small></a>
    <a href="#/help"><span>🩺</span><b>困ったとき</b><small>症状から原因を探す</small></a>
    <a href="#/spots"><span>🪟</span><b>置き場所</b><small>明るさと冬の室温</small></a>
    <a href="#/basics"><span>📗</span><b>このアプリの使い方</b><small>水やりの目安・明るさの段階</small></a>
    <a href="#/settings"><span>⚙️</span><b>設定</b><small>ペット・バックアップ・データの出典</small></a>
  </div>`;

views.basics = () => `<h1>このアプリの使い方</h1>
  <div class="card"><h3>☀️ 明るさの段階</h3><dl class="facts">${Object.values(LIGHT).map((l) => `<dt>${l.ja}</dt><dd>${l.where}<small>（${l.lux[0].toLocaleString()}〜${l.lux[1].toLocaleString()} lux）</small></dd>`).join('')}</dl>
    <p class="small muted">lux の値はこのアプリでの定義（晴れた日の昼の目安）です。照度計アプリで測った値を置き場所に入れると、見積もりより正確になります。</p></div>
  <div class="card"><h3>💧 水やりの段階</h3><dl class="facts">${Object.values(WATERING).map((w) => `<dt>${w.ja}</dt><dd>${w.how}</dd>`).join('')}</dl>
    <p class="small muted">植物ごとに、生育期と冬（寒い部屋）の段階を図鑑に載せています。「土を確かめる日」は段階ごとの日数（3〜14日、冬は1.5倍）から出した目安で、実際は土を触って判断します。</p></div>
  <div class="card"><h3>🌡️ 冬の扱い</h3><p>11〜3月は冬として水を控えめにします。ただし置き場所の「冬の夜の最低室温」がその植物の「よく育つ温度」以上なら、冬も生育期として扱います。</p></div>
  <div class="card"><h3>📚 データの正確さ</h3><p>育て方の値には、出典（NC State Extension・Clemson Extension）の原文か、出典がない場合は「目安」とその理由を付けています。図鑑の各項目の「根拠」から確認できます。出典によって温度が違うときは、植物にとって安全な側の値を使います。</p></div>`;

views.settings = () => `<h1>設定</h1>
  <div class="card"><h3>一緒に暮らす動物</h3><p class="muted small">選ぶと、害があると記載された植物に印をつけ、提案から外します。</p>
    <label class="check"><input type="checkbox" data-act="pet" name="cats" ${S.pets.cats ? 'checked' : ''}> 猫</label>
    <label class="check"><input type="checkbox" data-act="pet" name="dogs" ${S.pets.dogs ? 'checked' : ''}> 犬</label></div>
  <div class="card"><h3>バックアップ</h3><p class="muted small">データはこの端末のブラウザの中だけに保存されています（写真を含む）。機種変更の前などに書き出してください。</p>
    <div class="row"><button data-act="export">書き出す</button><label class="button sub">読み込む<input type="file" accept="application/json" data-act="import" hidden></label></div></div>
  <div class="card"><h3>図鑑のデータについて</h3>
    <p>${CATALOG.filter((e) => e.rank !== 'cultivar').length}種類・${CATALOG.filter((e) => e.rank === 'cultivar').length}品種。</p>
    <ul class="small">
      <li>育て方・毒性・原産地などは <a href="https://plants.ces.ncsu.edu/" target="_blank" rel="noopener">NC State Extension Gardener Plant Toolbox</a>（CC BY 4.0）の記載に基づきます。</li>
      <li>温度・水やり・湿度などは <a href="https://hgic.clemson.edu/" target="_blank" rel="noopener">Clemson Cooperative Extension HGIC</a> のファクトシートとも照らし合わせています。出典によって温度が違うときは、植物にとって安全な側の値を使います。</li>
      <li>写真は NC State Extension 掲載の写真のうち、CC BY・CC BY-SA・CC0・パブリックドメインのものを縮小して使っています。撮影者とライセンスは各ページに表示しています。</li>
      <li>学名・科・旧学名は <a href="https://www.gbif.org/" target="_blank" rel="noopener">GBIF Backbone Taxonomy</a>（CC BY 4.0）に基づきます。</li>
      <li>出典に記載のない項目は「目安」と表示し、理由を添えています。</li>
      <li>日本語名・明るさの段階（lux）の定義・水やりの日数の目安・植物のグループ分けは、このアプリ独自のものです。</li></ul></div>
  <div class="card"><h3>庭づくりアプリ</h3><p class="small">屋外の宿根草ガーデンは <a href="../">庭づくりアプリ</a> で。</p></div>`;

// ---- ルーター ----
const nav = [['', '🏠', 'ホーム'], ['zukan', '📖', '図鑑'], ['my', '🪴', 'マイ植物'], ['help', '🩺', '困ったとき'], ['menu', '☰', 'メニュー']];
const TAB_OF = { add: 'zukan', spot: 'my', spots: 'my', choose: 'menu', settings: 'menu', basics: 'menu' };
async function render() {
  const [path, q = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const [a, b] = path.split('/');
  const v = a === '' ? views.home() : a === 'zukan' && b ? views.detail(b) : a === 'zukan' ? views.zukan(null, q) : a === 'add' ? views.add(b)
    : a === 'my' && b ? views.myDetail(b) : a === 'my' ? views.my() : a === 'spots' ? views.spots() : a === 'spot' ? views.spot(b)
    : a === 'choose' ? views.choose() : a === 'help' ? views.help(null, q) : a === 'menu' ? views.menu() : a === 'basics' ? views.basics()
    : a === 'settings' ? views.settings() : '<p>ページがありません。</p>';
  $('#view').innerHTML = v;
  const tab = TAB_OF[a] ?? a;
  $('#nav').innerHTML = nav.map(([k, i, l]) => `<a href="#/${k}" class="${k === tab ? 'on' : ''}" ${k === tab ? 'aria-current="page"' : ''}><span>${i}</span>${l}</a>`).join('');
  if (a === 'add') updateAddFit();
  if (a === 'spot') updateSpotPreview();
  if (render.last !== path) { window.scrollTo(0, 0); render.last = path; }
}
const go = (h) => { if (location.hash === h) render(); else location.hash = h; };
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); }

function updateAddFit() {
  const form = $('#add-form'); if (!form) return;
  const spot = S.spots.find((s) => s.id === form.spotId.value);
  const e = byId.get(form.dataset.taxon);
  $('#add-fit').innerHTML = spot ? (() => { const f = fit(e, spot); return `<div class="card"><h3>「${esc(spot.name)}」との相性</h3><div class="pc-tags">${fitBadges(f)}</div>${f.notes.length ? `<ul>${f.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : '<p>よく合っています。</p>'}</div>`; })() : '';
}
const spotFromForm = (form) => ({ window: form.window.value, distance: form.distance.value, sheer: form.sheer.checked,
  lux: form.lux.value === '' ? undefined : Number(form.lux.value), winterMinC: form.winterMinC.value === '' ? undefined : Number(form.winterMinC.value) });
function updateSpotPreview() {
  const form = $('#spot-form'); if (!form) return;
  form.distance.disabled = form.window.value === 'none';
  const L = spotLight(spotFromForm(form));
  const sunJa = { none: '当たらない', morning: '朝に当たる', afternoon: '午後に当たる', midday: '昼に当たる' }[L.sun];
  $('#spot-preview').innerHTML = `<div class="card soft"><b>明るさ：${LIGHT[L.level].ja}</b> ${lightMeter(L.level)}${L.measured ? '（実測値から）' : '（見積もり）'}<br><small>${LIGHT[L.level].where}／直射日光：${sunJa}</small></div>`;
}
async function addEvents(ids, type) {
  const now = Date.now();
  for (const id of ids) await db.put('events', { id: db.uid(), plantId: id, type, date: today(), memo: '', createdAt: now });
  await load(); render();
  toast(type === 'water' ? `${ids.length}鉢の水やりを記録しました` : `${ids.length}鉢の確認を記録しました`);
}

// ---- 操作 ----
document.addEventListener('click', async (ev) => {
  const bulk = ev.target.closest('[data-bulk]');
  if (bulk) {
    ev.preventDefault();
    const ids = [...document.querySelectorAll('#bulk-form input[name=p]:checked')].map((x) => x.value);
    if (!ids.length) return toast('植物を選んでください');
    return addEvents(ids, bulk.dataset.bulk);
  }
  const el = ev.target.closest('[data-act]'); if (!el || el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
  const { act, id, type } = el.dataset;
  if (act === 'add') go(`#/add/${id}`);
  if (act === 'quick') addEvents([id], type);
  if (act === 'del-event' && confirm('この記録を削除しますか？')) { await db.del('events', id); await load(); render(); }
  if (act === 'del-photo' && confirm('この写真を削除しますか？')) { await db.del('photos', id); await load(); render(); }
  if (act === 'del-plant' && confirm('この植物と記録・写真をすべて削除しますか？')) { await db.deletePlant(id); await load(); go('#/my'); }
  if (act === 'del-spot' && confirm('この置き場所を削除しますか？（植物は削除されません）')) { await db.deleteSpot(id); await load(); go('#/spots'); }
  if (act === 'export') {
    const blob = new Blob([JSON.stringify(await db.exportAll())], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `heyamidori-${today()}.json` });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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
  if (el.dataset.act === 'photo' && el.files[0]) {
    try {
      const data = await db.shrinkImage(el.files[0]);
      await db.put('photos', { id: db.uid(), plantId: el.dataset.id, date: today(), data, memo: '', createdAt: Date.now() });
      await load(); render(); toast('写真を追加しました');
    } catch (e) { alert(e.message); }
  }
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
  if (el.closest('#help-form')) submitHelp(el.form);
  if (el.closest('#choose-form') && el.name === 'spotId') el.form.querySelector('.manual').hidden = !!el.value;
});
document.addEventListener('input', (ev) => {
  if (ev.target.closest('#spot-form')) updateSpotPreview();
  // 日本語入力の変換中（isComposing）は検索しない。確定したら compositionend で検索する
  if (ev.target.name === 'q' && ev.target.closest('#zukan-form') && !ev.isComposing) { clearTimeout(submitZukan.t); submitZukan.t = setTimeout(() => submitZukan(ev.target.form), 250); }
});
document.addEventListener('compositionend', (ev) => {
  if (ev.target.name === 'q' && ev.target.closest('#zukan-form')) { clearTimeout(submitZukan.t); submitZukan.t = setTimeout(() => submitZukan(ev.target.form), 250); }
});
/** 図鑑の条件を URL に残し、結果の一覧だけを入れ替える（入力欄・フォーカスはそのまま） */
function submitZukan(form) {
  const p = new URLSearchParams();
  if (form.q.value) p.set('q', form.q.value);
  for (const g of form.querySelectorAll('input[name=g]:checked')) p.append('g', g.value);
  for (const k of ['low', 'dry', 'cold', 'pet', 'cv']) if (form[k].checked) p.set(k, '1');
  history.replaceState(null, '', `#/zukan${p.toString() ? `?${p}` : ''}`);
  const box = $('#zukan-results');
  if (box) box.innerHTML = zukanResults(p);
}
function submitHelp(form) {
  const p = new URLSearchParams();
  const v = form.plant.value;
  if (v.startsWith('p:')) p.set('plant', v.slice(2)); else p.set('taxon', v.slice(2));
  const s = form.querySelector('input[name=s]:checked');
  if (s) p.set('s', s.value);
  history.replaceState(null, '', `#/help?${p}`);
  render();
  if (s) $('#help-result')?.scrollIntoView({ behavior: 'smooth' });
}
document.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const f = ev.target;
  if (f.id === 'zukan-form') return submitZukan(f);
  if (f.id === 'choose-form') {
    if (f.cats.checked !== S.pets.cats || f.dogs.checked !== S.pets.dogs) { S.pets = { cats: f.cats.checked, dogs: f.dogs.checked }; await db.setSetting('pets', S.pets); }
    return chooseFromForm(f);
  }
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
