import { PLANTS, COLORS, SUN, MOIST, TAGS, LEAF, FORMS, addCustom, removeCustom } from './plants.js';
import { STYLES } from './styles.js';
import { pestsForPlant, regionRisks, pestTasks, KIND_ICON, RISK_JA } from './pests.js';
import { guideSteps } from './guide.js';
import { generatePlan, PRESETS, LAYER_JA } from './plan.js';
import { elevationSVG, planSVG, plantThumbSVG } from './illust.js';
import { loadImages, imageOf } from './images.js';
import { TYPE_JA, USES, FAMILY } from './meta.js';
import { ideasFor, RECIPES, plantsForNeed } from './enjoy.js';
import { icon, tsupi, tsupiSays, TASK_ICON, PEST_ICON, MONTHLY_WORDS } from './mascot.js';
import { art, ART_BY_ICON, ART_BY_RECIPE, MONTH_OLD, SEASON_EN, sekkiOf } from './art.js';
import { fetchForecast, weatherAdvice, weatherIcon, md } from './weather.js';
import { listNotes, saveNote, deleteNote, shrinkImage, requestPersist, storageInfo, exportAll, importAll, saveFile, listPhotos, savePhoto, deletePhoto, svgToPngBlob } from './db.js';
import { describe, companions } from './describe.js';
import { EVENTS, EVENT_GROUPS, insights, actualBloom, yearStats } from './diary.js';
import { reply as tsupiReply, STARTERS } from './chat.js';
import { consultPrompt, consultPromptShort, imagePrompt, parseBedsReply, AI_APPS, aiLink } from './handoff.js';
import { fetchDaily, analyzeClimate, searchPlace, reverseGeocode, formatDoy, humidityStress } from './climate.js';
import { sunSeasons } from './sun.js';
import { generateSite, siteSVG, polyEditorSVG, polygonArea, isSimple, ITEMS, BED_ITEMS, DEFAULT_ITEMS, DIR_JA } from './site.js';
import { creaturesForPlant, creaturesForGarden, biodiversity, WILD_GOALS, FEATURES } from './wildlife.js';
import { plantCritters, bioHtml, crittersHtml, featureChips, regionHtml, kindTag, monthsText } from './wildview.js';
import { CREATURES, KINDS, relation, creaturesForRegion, LEVEL_JA } from './wildlife.js';
import { INFO } from './critterinfo.js';
import { critterSVG } from './critterart.js';
import { foodWeb, foodWebSVG, foodWebSummary } from './ecoweb.js';
import { visitors, friendSVG } from './friends.js';
import {
  LEVEL, findPlants, evaluate, heightClass, HEIGHT_LABEL, bloomGaps, plantsPerSqm,
  buildTasks, TASK_KIND, localMonth,
} from './garden.js';

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byId = new Map();
const ORDER = new Map();
function reindex() {
  byId.clear(); ORDER.clear();
  PLANTS.forEach((p, i) => { byId.set(p.id, p); ORDER.set(p.id, i); });
}
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

// ---------- 保存（ブラウザ内） ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('pg:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('pg:' + k, JSON.stringify(v)); } catch { /* 保存不可でも動作は継続 */ } },
};

// 自分で登録した品種を読み込む
let customList = [];
try { customList = JSON.parse(localStorage.getItem('pg:custom') || '[]'); } catch { customList = []; }
customList.forEach(addCustom);
reindex();

// 庭は複数持てる。旧データ（1つの庭）からは自動で引き継ぐ
function loadGardens() {
  let gs = store.get('gardens', null);
  if (!Array.isArray(gs) || !gs.length) gs = [{ id: 'g1', name: 'わたしの庭', plants: store.get('garden', []), area: store.get('area', 3), sun: '', moist: '', have: {} }];
  for (const g of gs) { g.plants = (g.plants || []).filter((id) => byId.has(id)); g.have = g.have || {}; g.area = g.area || 3; g.features = g.features || {}; }
  return gs;
}

const state = {
  gardens: loadGardens(),
  gardenId: store.get('gardenId', null),
  loc: store.get('loc', null),
  climate: null,
  filters: { sun: '', moist: '', height: '', month: '', color: '', q: '', tag: '', family: '', type: '', use: '', sort: 'fit', view: 'list', ...store.get('filters', {}) },
  planInput: { style: 'border', ...store.get('planInput', { text: '', width: 3, depth: 1.2, view: 'border', sun: 'full', moist: '', budget: '', seed: 0 }) },
  plan: null,
  planMonth: null,
  site: null, // 庭まるごとプラン
  siteBed: null, // 庭まるごとプランの中で詳しく見ている花壇
  siteLayer: 'tour',
  zukan: 'plants', // 図鑑：植物 / 生き物
  critF: { kind: '', show: 'all', q: '' },
  sightings: store.get('sightings', []), // 生き物の観察記録 [{ id, c: 生き物ID, date, g: 庭ID, n: 数, memo }]
  showHard: false,
  view: 'site',
  shop: store.get('shopName', ''),
  shopSite: store.get('shopSite', 'rakuten'),
  theme: store.get('theme', 'auto'),
  gardenTab: 'plants',
  diaryFilter: { plant: '', photo: false },
  diaryShown: 30,
  openCards: new Set(),
  guideDone: store.get('guideDone', {}),
  cvSel: {},
  shown: 24,
  groupResults: null,
};

// プラン入力の既定値（古い保存データにない項目を補う）
{
  const pi = state.planInput;
  pi.mode = pi.mode === 'site' ? 'site' : 'bed';
  pi.site = { shape: 'rect', width: 10, depth: 8, cut: 'right', points: [], size: 15, area: '', house: 'n', ...(pi.site || {}) };
  pi.items = Array.isArray(pi.items) ? pi.items.filter((k) => ITEMS[k]) : [...DEFAULT_ITEMS];
  pi.wild = Array.isArray(pi.wild) ? pi.wild.filter((k) => WILD_GOALS[k]) : [];
  pi.layoutSeed = Number(pi.layoutSeed) || 0;
}

const activeGarden = () => state.gardens.find((g) => g.id === state.gardenId) || state.gardens[0];
function saveGardens() { store.set('gardens', state.gardens); store.set('gardenId', activeGarden().id); }
// 既存のコードが使う state.garden / state.area は「いま選んでいる庭」を指す
Object.defineProperty(state, 'garden', { get: () => activeGarden().plants, set: (v) => { activeGarden().plants = v; saveGardens(); } });
Object.defineProperty(state, 'area', { get: () => activeGarden().area, set: (v) => { activeGarden().area = v; saveGardens(); } });
const userPhotos = new Map(); // 植物ID → 自分で設定した写真

// ---------- ナビゲーション ----------
function go(view) {
  state.view = view;
  document.querySelectorAll('.view').forEach((v) => { v.hidden = v.dataset.view !== view; });
  document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.go === view));
  $('#fabRecord').hidden = view === 'plan' || view === 'plants';
  render();
  window.scrollTo({ top: 0 });
}
document.addEventListener('click', (e) => {
  const g = e.target.closest('[data-go]');
  if (g) go(g.dataset.go);
});

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2200);
}

// ---------- 場所の設定 ----------
const statusEl = $('#siteStatus');
function setStatus(html, isError = false) {
  statusEl.innerHTML = html;
  statusEl.classList.toggle('error', isError);
}

$('#btnGeo').addEventListener('click', () => {
  if (!('geolocation' in navigator)) return setStatus('この端末では位置情報が使えません。地名で検索してください。', true);
  setStatus('<span class="spinner"></span>現在地を取得しています…');
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const name = await reverseGeocode(lat, lon);
      setLocation({ lat, lon, name: name || '現在地' });
    },
    (err) => {
      const msg = err.code === 1 ? '位置情報の利用が許可されませんでした。' : '現在地を取得できませんでした。';
      setStatus(msg + '地名で検索してください。', true);
    },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
  );
});

$('#searchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = $('#searchInput').value.trim();
  if (!q) return;
  const ul = $('#searchResults');
  ul.innerHTML = '';
  setStatus('<span class="spinner"></span>検索中…');
  try {
    const list = await searchPlace(q);
    setStatus(list.length ? '' : '見つかりませんでした。別の表記で試してください。', !list.length);
    ul.innerHTML = list.map((r, i) => `<li><button type="button" data-i="${i}">${esc(r.name)}</button></li>`).join('');
    ul.onclick = (ev) => {
      const b = ev.target.closest('button[data-i]');
      if (!b) return;
      ul.innerHTML = '';
      setLocation(list[Number(b.dataset.i)]);
    };
  } catch (err) {
    setStatus(esc(err.message), true);
  }
});

async function setLocation(loc) {
  state.loc = loc;
  store.set('loc', loc);
  await loadClimate();
}

async function loadClimate() {
  const { lat, lon } = state.loc;
  const key = `climate:${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = store.get(key, null);
  if (cached && cached.v === 1) {
    state.climate = cached.data;
    if (state.plan) computePlan();
    setStatus('');
    $('#locCard').open = false;
    render();
    return;
  }
  setStatus('<span class="spinner"></span>過去10年の気象データを解析しています…');
  try {
    const json = await fetchDaily(lat, lon);
    state.climate = { ...analyzeClimate(json.daily, lat), elevation: json.elevation };
    store.set(key, { v: 1, data: state.climate });
    if (state.plan) computePlan();
    setStatus('');
    $('#locCard').open = false;
  } catch (err) {
    setStatus(esc(err.message) + '　通信環境を確認してもう一度お試しください。', true);
  }
  render();
}

// ---------- 描画 ----------
function render() {
  const chip = $('#locChip');
  chip.innerHTML = icon('pin', 15) + esc(state.loc ? `${state.loc.name}${state.climate ? `・ゾーン${state.climate.zone.label}` : ''}` : '場所を設定');
  $('#locSummary').textContent = state.loc ? `${state.loc.name}（タップで変更）` : '';
  const badge = $('#gardenBadge');
  badge.hidden = !state.garden.length;
  badge.textContent = state.garden.length;

  if (state.view === 'site') renderSite();
  if (state.view === 'plants') renderZukan();
  if (state.view === 'garden') renderGarden();
  if (state.view === 'tasks') renderTasks();
  if (state.view === 'plan') renderPlan();
  if (state.view === 'enjoy') renderEnjoy();
  if (state.view === 'garden') {
    const t = state.gardenTab;
    document.querySelectorAll('#gardenTabs button').forEach((b) => b.classList.toggle('on', b.dataset.v === t));
    $('#gardenBox').hidden = t !== 'plants';
    $('#journalBox').hidden = t !== 'diary';
    $('#backupBox').hidden = t !== 'data';
    if (t === 'diary') renderJournal();
    if (t === 'data') renderBackup();
  }
}

function siteAdvice(c) {
  const out = [];
  const z = c.zone.value;
  if (z <= 5) out.push('冬の寒さが厳しい地域。耐寒性の高い北米・ヨーロッパ原産の宿根草がよく育ちます。');
  else if (z <= 7.5) out.push('冬はしっかり冷え込み、多くの宿根草が休眠できる恵まれた気候です。');
  else out.push('冬が温暖な地域。寒さに弱い暖地向きの宿根草も楽しめますが、冷涼地向きの植物は休眠不足に注意。');
  if (c.annualSnow >= 100) out.push(`年間降雪は約${c.annualSnow}cm。積雪が断熱材になり、雪の下の宿根草は数値より寒さに耐えられます。`);
  const stress = humidityStress(c);
  if (stress === 3) out.push(`熱帯夜が年${Math.round(c.tropicalNights)}日。日本の宿根草づくりの最大の敵は「夏の蒸れ」。水はけのよい土・株間を広く・梅雨前の切り戻しを。`);
  else if (stress === 2) out.push('夏はやや蒸し暑くなります。蒸れに弱い植物は風通しのよい場所へ。');
  if (c.heatZone >= 8) out.push(`30℃以上の日が年${Math.round(c.hotDays)}日。西日を避けられる場所が宿根草の夏越しに有利です。`);
  if (c.frostFree) out.push('霜がほとんど降りない地域。秋植えでも冬の間に根を張れます。');
  else if (c.lastFrostSafe) out.push(`寒さに弱い苗の植え付けは、遅霜の心配が少ない${formatDoy(c.lastFrostSafe)}以降が安心です。`);
  if (c.annualPrecip >= 1800) out.push(`年間降水量は約${c.annualPrecip}mm と多め。花壇は周囲より高く盛り土して水はけを確保しましょう。`);
  else if (c.annualPrecip < 900) out.push(`年間降水量は約${c.annualPrecip}mm と少なめ。乾燥に強い植物が向いています。`);
  return out;
}

function renderSite() {
  renderHome();
  const box = $('#climateBox');
  const c = state.climate;
  if (!state.loc) { box.innerHTML = ''; return; }
  if (!c) { box.innerHTML = ''; return; }
  const { lat, lon } = state.loc;
  const frost = c.frostFree
    ? '<div class="v">ほぼなし</div><div class="s">霜が降りる年は半分未満</div>'
    : `<div class="v">${formatDoy(c.lastFrost)}</div><div class="s">初霜 ${formatDoy(c.firstFrost)}・無霜期間 約${Math.round(c.growingDays)}日</div>`;
  const seasons = sunSeasons(lat);

  box.innerHTML = `
    <div class="card">
      <h2>${esc(state.loc.name)} の庭の気候</h2>
      <p class="hint">${lat >= 0 ? '北緯' : '南緯'} ${Math.abs(lat).toFixed(2)}° / ${lon >= 0 ? '東経' : '西経'} ${Math.abs(lon).toFixed(2)}°${c.elevation != null ? `・標高 約${Math.round(c.elevation)}m` : ''}・過去${c.years}年の平均</p>
      <div class="tiles">
        <div class="tile"><div class="k">耐寒性ゾーン（USDA）</div><div class="v">${c.zone.label}</div><div class="s">年最低気温の平均 ${c.avgMinTemp}℃</div></div>
        <div class="tile"><div class="k">暑さゾーン（AHS）</div><div class="v">${c.heatZone}</div><div class="s">30℃以上 年${Math.round(c.hotDays)}日</div></div>
        <div class="tile"><div class="k">終霜（0℃以下の最終日）</div>${frost}</div>
        <div class="tile"><div class="k">熱帯夜（最低25℃以上）</div><div class="v">${Math.round(c.tropicalNights)}<small>日</small></div><div class="s">猛暑日 年${Math.round(c.veryHotDays)}日</div></div>
        <div class="tile"><div class="k">年間降水量</div><div class="v">${c.annualPrecip.toLocaleString()}<small>mm</small></div><div class="s">梅雨〜夏の過湿に注意</div></div>
        <div class="tile"><div class="k">年間降雪量</div><div class="v">${c.annualSnow}<small>cm</small></div><div class="s">過去最低 ${c.coldestTemp}℃</div></div>
      </div>
    </div>
    <div class="card">
      <h2>この地域の宿根草づくりのポイント</h2>
      <ul class="advice">${siteAdvice(c).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <div class="row" style="margin-top:10px"><button class="btn primary" type="button" data-go="plants">この気候に合う植物を見る →</button></div>
    </div>
    ${regionPestCard(c)}
    <div class="card">
      <h2>月別の平均気温</h2>
      <div class="legend"><span><i style="background:var(--tmax)"></i>最高気温</span><span><i style="background:var(--tmin)"></i>最低気温</span></div>
      <div class="chart-wrap">${tempChart(c.monthly)}</div>
      <h2 style="margin-top:14px">月別の降水量</h2>
      <div class="chart-wrap">${precipChart(c.monthly)}</div>
      <details><summary>表で見る</summary>
        <div class="scroll-x"><table class="data">
          <tr><th>月</th><th>最高℃</th><th>最低℃</th><th>降水mm</th></tr>
          ${c.monthly.map((m, i) => `<tr><td>${i + 1}月</td><td>${m.tmax}</td><td>${m.tmin}</td><td>${m.prcp}</td></tr>`).join('')}
        </table></div>
      </details>
    </div>
    <div class="card">
      <h2>日当たりと影の目安</h2>
      <p class="hint">建物や塀の北側がどれだけ日陰になるかの参考に。影の長さは南中時（正午ごろ）のものです。</p>
      <div class="scroll-x"><table class="data">
        <tr><th></th><th>南中高度</th><th>日の長さ</th><th>高さ2mの塀の影</th><th>日の出／入り</th></tr>
        ${seasons.map((s) => `<tr><td>${s.label}</td><td>${s.altitude.toFixed(0)}°</td><td>${s.dayLength.toFixed(1)}時間</td><td>${Number.isFinite(s.shadow) ? (s.shadow * 2).toFixed(1) + 'm' : '—'}</td><td>${s.sunrise}／${s.sunset}</td></tr>`).join('')}
      </table></div>
      <p class="note">冬至に影になる場所は「日陰〜半日陰」向き、夏至だけ日が当たる場所は「半日陰」向きの植物を選びましょう。</p>
    </div>
    <p class="note">気象データ：Open-Meteo（ERA5 再解析）。約10km格子の値のため、市街地・谷・斜面など庭の微気候とは差が出ることがあります。</p>
  `;
  bindChartHover(box);
}

// --- グラフ（SVG） ---
const CW = 340, CH = 150, PL = 30, PR = 8, PT = 8, PB = 22;
const xAt = (i) => PL + ((CW - PL - PR) / 12) * (i + 0.5);

function scale(min, max, step) {
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(v);
  return { lo, hi, ticks, y: (v) => PT + (CH - PT - PB) * (1 - (v - lo) / (hi - lo || 1)) };
}

function axes(s, unit) {
  const grid = s.ticks.map((t) => `<line class="grid" x1="${PL}" x2="${CW - PR}" y1="${s.y(t)}" y2="${s.y(t)}"/><text x="${PL - 4}" y="${s.y(t) + 3}" text-anchor="end">${t}${unit}</text>`).join('');
  const xl = MONTHS.map((m, i) => (m % 2 ? `<text x="${xAt(i)}" y="${CH - 6}" text-anchor="middle">${m}月</text>` : '')).join('');
  return grid + xl;
}

function hits(rows) {
  const w = (CW - PL - PR) / 12;
  return rows.map((tip, i) => `<rect class="hit" x="${PL + w * i}" y="${PT}" width="${w}" height="${CH - PT - PB}" data-x="${xAt(i)}" data-tip="${esc(tip)}"/>`).join('');
}

function tempChart(monthly) {
  const vals = monthly.flatMap((m) => [m.tmax, m.tmin]);
  const s = scale(Math.min(...vals, 0), Math.max(...vals), 10);
  const path = (k) => monthly.map((m, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(1)},${s.y(m[k]).toFixed(1)}`).join('');
  const zero = s.lo < 0 ? `<line x1="${PL}" x2="${CW - PR}" y1="${s.y(0)}" y2="${s.y(0)}" stroke="var(--muted)" stroke-width="1"/>` : '';
  const pts = (k, col) => monthly.map((m, i) => `<circle cx="${xAt(i)}" cy="${s.y(m[k])}" r="3" fill="${col}" stroke="var(--surface)" stroke-width="1.5"/>`).join('');
  return `<svg class="chart" viewBox="0 0 ${CW} ${CH}" role="img" aria-label="月別の平均最高・最低気温">
    ${axes(s, '°')}${zero}
    <line class="cross" x1="0" x2="0" y1="${PT}" y2="${CH - PB}" visibility="hidden"/>
    <path class="line" d="${path('tmax')}" stroke="var(--tmax)"/>
    <path class="line" d="${path('tmin')}" stroke="var(--tmin)"/>
    ${pts('tmax', 'var(--tmax)')}${pts('tmin', 'var(--tmin)')}
    ${hits(monthly.map((m, i) => `${i + 1}月｜最高 ${m.tmax}℃・最低 ${m.tmin}℃`))}
  </svg>`;
}

function precipChart(monthly) {
  const max = Math.max(...monthly.map((m) => m.prcp), 50);
  const step = max > 300 ? 100 : 50;
  const s = scale(0, max, step);
  const w = (CW - PL - PR) / 12 - 6;
  const bars = monthly.map((m, i) => {
    const y = s.y(m.prcp), h = s.y(0) - y;
    const r = Math.min(4, w / 2, h);
    const x = xAt(i) - w / 2;
    return `<path d="M${x},${s.y(0)}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${s.y(0)}Z" fill="var(--prcp)"/>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${CW} ${CH}" role="img" aria-label="月別の平均降水量">
    ${axes(s, '')}${bars}
    <line class="cross" x1="0" x2="0" y1="${PT}" y2="${CH - PB}" visibility="hidden"/>
    ${hits(monthly.map((m, i) => `${i + 1}月｜降水量 ${m.prcp}mm`))}
  </svg>`;
}

function bindChartHover(root) {
  const tip = $('#tooltip');
  root.querySelectorAll('svg.chart').forEach((svg) => {
    const cross = svg.querySelector('.cross');
    svg.addEventListener('pointermove', (e) => {
      const r = e.target.closest('.hit');
      if (!r) return;
      tip.textContent = r.dataset.tip;
      tip.hidden = false;
      const tw = tip.offsetWidth;
      tip.style.left = Math.max(8, Math.min(window.innerWidth - tw - 8, e.clientX - tw / 2)) + 'px';
      tip.style.top = (e.clientY - 44) + 'px';
      cross.setAttribute('x1', r.dataset.x); cross.setAttribute('x2', r.dataset.x);
      cross.setAttribute('visibility', 'visible');
    });
    svg.addEventListener('pointerleave', () => { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); });
  });
}

// ---------- 植物を探す ----------
function initFilters() {
  const fMonth = $('#fMonth');
  fMonth.innerHTML = '<option value="">すべて</option>' + MONTHS.map((m) => `<option value="${m}">${m}月</option>`).join('');
  $('#fTag').innerHTML = '<option value="">すべて</option>' + Object.entries(TAGS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  $('#fTag').addEventListener('change', (e) => { state.filters.tag = e.target.value; saveFilters(); });
  const famCount = {};
  for (const p of PLANTS) famCount[p.family.ja] = (famCount[p.family.ja] || new Set()).add(p.group);
  const fams = Object.entries(famCount).sort((a, b) => b[1].size - a[1].size);
  $('#fFamily').innerHTML = '<option value="">すべての科</option>' + fams.map(([k, v]) => `<option value="${k}">${k}（${v.size}種）</option>`).join('');
  $('#fType').innerHTML = '<option value="">すべて</option>' + Object.entries(TYPE_JA).map(([k, v]) => `<option value="${k}">${v}</option>`).join('') + '<option value="veg">野菜・食べられる植物</option>';
  $('#fUse').innerHTML = '<option value="">すべて</option>' + Object.entries(USES).map(([k, v]) => `<option value="${k}">${v.icon} ${v.ja}</option>`).join('');
  for (const [id, key] of [['#fFamily', 'family'], ['#fType', 'type'], ['#fUse', 'use'], ['#fSort', 'sort']]) {
    $(id).addEventListener('change', (e) => { state.filters[key] = e.target.value; saveFilters(); });
  }
  $('#fView').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) { state.filters.view = b.dataset.v; saveFilters(); }
  });
  $('#fReset').addEventListener('click', () => {
    Object.assign(state.filters, { sun: '', moist: '', height: '', month: '', color: '', q: '', tag: '', family: '', type: '', use: '' });
    saveFilters();
  });
  $('#fColor').innerHTML = Object.entries(COLORS).map(([k, c]) => `<button type="button" class="chip" data-v="${k}"><span class="dot" style="background:${c.hex}"></span>${c.ja}</button>`).join('');

  const f = state.filters;
  document.querySelectorAll('#filters .seg').forEach((seg) => {
    const key = seg.dataset.filter;
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      f[key] = b.dataset.v;
      saveFilters();
    });
  });
  $('#fColor').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    f.color = f.color === b.dataset.v ? '' : b.dataset.v;
    saveFilters();
  });
  fMonth.addEventListener('change', () => { f.month = fMonth.value; saveFilters(); });
  $('#fQ').addEventListener('input', (e) => { f.q = e.target.value; saveFilters(); });
  $('#fShowHard').addEventListener('change', (e) => { state.showHard = e.target.checked; renderPlants(); });
}
function saveFilters() { store.set('filters', state.filters); renderPlants(); }

function monthBar(p, south) {
  const on = new Set(p.bloom.map((m) => localMonth(m, south)));
  const col = COLORS[p.color[0]].hex;
  return `<div class="months" aria-label="開花 ${[...on].sort((a, b) => a - b).join('・')}月">${MONTHS.map((m) => `<span${on.has(m) ? ` style="background:${col}"` : ''}></span>`).join('')}</div>
    <div class="months-label" aria-hidden="true">${MONTHS.map((m) => `<span>${m % 3 === 1 ? m : ''}</span>`).join('')}</div>`;
}

function plantCard(rs) {
  const group = rs[0].plant.group;
  const r = rs.find((x) => x.plant.id === state.cvSel[group]) || rs[0];
  const p = r.plant;
  const south = state.climate?.south;
  const inGarden = state.garden.includes(p.id);
  const multi = p.cvCount > 1;
  const lv = r.level ? `<span class="lv lv-${r.level}">${LEVEL[r.level].mark} ${LEVEL[r.level].label}</span>` : '';
  const chips = multi ? `<div class="cv-row">
      <span class="label" style="margin:0">品種 ${rs.length < p.cvCount ? `（条件に合う ${rs.length}/${p.cvCount}）` : `（${p.cvCount}）`}</span>
      <div class="chips">${rs.map((x) => `<button type="button" class="chip cv${x.plant.id === p.id ? ' on' : ''}" data-cv="${x.plant.id}" data-group="${group}"><span class="dot" style="background:${COLORS[x.plant.color[0]].hex}"></span>${esc(x.plant.cv)}${x.level && x.level < 3 ? ` <small>${LEVEL[x.level].mark}</small>` : ''}${state.garden.includes(x.plant.id) ? ' ✓' : ''}</button>`).join('')}</div>
    </div>` : '';
  return `<article class="plant" data-card="${group}">
    ${photoHtml(p)}
    <div class="top">
      <div>
        <div class="name">${esc(multi ? p.groupJa : p.ja)}</div>
        ${multi ? `<div class="cvname">${esc(p.ja)}</div>` : ''}
        <div class="latin">${esc(p.latin)}</div>
        <div class="dots">${p.color.map((c) => `<span class="dot" title="${COLORS[c].ja}" style="background:${COLORS[c].hex}"></span>`).join('')}</div>
      </div>
      ${lv}
    </div>
    ${chips}
    <div class="famline">${esc(p.family.ja)}・${esc(p.tags.includes('veg') && p.harvest ? (p.type === 'annual' ? '野菜' : '野菜（多年草）') : TYPE_JA[p.type] || '')}${p.tags.includes('native') ? '・日本の在来種' : ''}${p.tags.includes('herb') ? '・ハーブ' : ''}</div>
    ${r.level ? `<ul class="reasons">${r.reasons.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    ${monthBar(p, south)}
    <div class="meta">
      <span>草丈 ${p.h[0]}〜${p.h[1]}cm</span>
      <span>${p.sun.map((s) => SUN[s]).join('・')}</span>
      <span>土：${p.moist.map((m) => MOIST[m]).join('・')}</span>
      <span>${p.type === 'annual' ? (p.sow === 'cool' ? '涼しい季節に育つ' : '暖かい季節に育つ') : `耐寒 ${p.zone[0]}〜${p.zone[1]}・耐暑 ${p.heat}`}</span>
      <span>蒸れ ${['', '弱い', '普通', '強い'][p.humid]}</span>
      <span>${FORMS[p.form].ja}</span>
      <span>${LEAF[p.leaf].ja}</span>
      <span>株間 ${p.spread}cm</span>
      <span class="price">${yen(p.price)}／${p.type === 'bulb' && p.price <= 300 ? '球' : '株'}</span>
    </div>
    <div class="tagrow">${p.tags.map((t) => `<span class="tag">${TAGS[t]}</span>`).join('')}</div>
    <p class="note-p lead-note">${esc(p.note)}</p>
    <div class="desc">${describe(p).map((d) => `<h4>${d.h}</h4><p>${esc(d.t)}</p>`).join('')}
      <h4>相性のよい植物</h4><div class="comp">${companions(p).map((q) => `<button type="button" class="chip" data-find="${esc(q.groupJa)}"><span class="dot" style="background:${COLORS[q.color[0]].hex}"></span>${esc(q.groupJa)}</button>`).join('')}</div>
      ${plantCritters(creaturesForPlant(p, state.climate))}
    </div>
    ${p.uses?.length ? `<div class="uses">${p.uses.map((u) => `<span class="use" data-use="${u}">${USES[u].icon} ${USES[u].ja}</span>`).join('')}</div>` : ''}
    ${p.tags.includes('veg') && p.harvest?.length ? `<p class="note-p annual-note veg-note">${icon('basket', 15)}野菜：収穫は${monthsText(p.harvest, south)}ごろ。${p.type === 'annual' ? '種まき・植え付けの時期は作業暦に表示されます。' : '植えたら何年も収穫できます。'}</p>`
      : p.type === 'annual' ? `<p class="note-p annual-note">${icon('sprout', 15)}一年草・二年草：毎年の種まき、またはこぼれ種で更新します。</p>` : ''}
    ${p.tags.includes('medicinal') ? `<p class="note-p med-note">${icon('guide', 15)}薬用として知られる植物です。体質や服薬によっては害になることがあります。利用する前に医師・薬剤師に相談し、自己判断で病気の治療に使わないでください。</p>` : ''}
    ${p.tips?.length ? `<div class="tipbox">${p.tips.map((t) => `<p>${icon('bulb', 15)}${esc(t)}</p>`).join('')}</div>` : ''}
    ${pestBox(p)}
    ${p.custom ? `<p class="note-p" style="color:var(--muted)">マイ品種${p.shop ? `・購入店：${esc(p.shop)}` : ''}${p.url ? `・<a href="${esc(p.url)}" target="_blank" rel="noopener">商品ページ</a>` : ''}</p>` : ''}
    <div class="actions">
      ${p.custom ? `<button type="button" class="btn small" data-delcustom="${p.id}">削除</button>` : ''}
      <label class="btn small">${icon('plus', 15)}${userPhotos.has(p.id) ? '写真を変更' : '自分の写真'}<input type="file" accept="image/*" data-myphoto="${p.id}" hidden></label>
      ${userPhotos.has(p.id) ? `<button type="button" class="btn small" data-delphoto="${p.id}">写真を外す</button>` : ''}
      <a class="btn small" href="${shopUrl(p)}" target="_blank" rel="noopener">${icon('cart', 16)}${esc(shopLabel())}で探す</a>
      ${state.filters.view === 'list' ? `<button type="button" class="btn small" data-close="${group}">閉じる</button>` : ''}
      <button type="button" class="btn small ${inGarden ? 'added' : ''}" data-toggle="${p.id}">${inGarden ? '✓ マイ庭に追加済み' : '＋ マイ庭に追加'}</button>
    </div>
  </article>`;
}

const PAGE = 24;
function renderPlants(keepPage = false) {
  const f = state.filters;
  document.querySelectorAll('#filters .seg').forEach((seg) => {
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === (f[seg.dataset.filter] || '')));
  });
  document.querySelectorAll('#fColor .chip').forEach((b) => b.classList.toggle('on', b.dataset.v === f.color));
  $('#fMonth').value = f.month || '';
  $('#fTag').value = f.tag || '';
  $('#fFamily').value = f.family || '';
  $('#fType').value = f.type || '';
  $('#fUse').value = f.use || '';
  $('#fSort').value = f.sort || 'fit';
  document.querySelectorAll('#fView button').forEach((b) => b.classList.toggle('on', b.dataset.v === (f.view || 'list')));
  if ($('#fQ').value !== (f.q || '')) $('#fQ').value = f.q || '';
  if (!keepPage) state.shown = PAGE;

  const all = findPlants(state.climate, f);
  const list = state.showHard ? all : all.filter((r) => r.level !== 1);
  const groups = new Map();
  for (const r of list) {
    if (!groups.has(r.plant.group)) groups.set(r.plant.group, []);
    groups.get(r.plant.group).push(r);
  }
  for (const rs of groups.values()) rs.sort((a, b) => ORDER.get(a.plant.id) - ORDER.get(b.plant.id));
  state.groupResults = groups;
  const arr = sortGroups([...groups.values()], f.sort);
  const hiddenGroups = new Set(all.map((r) => r.plant.group)).size - arr.length;
  $('#plantCount').textContent = (state.climate ? '' : '※ 場所を設定すると、地域に合うかどうかを判定します。 ')
    + `${arr.length}種・${list.length}品種${hiddenGroups > 0 ? `（育てにくい${hiddenGroups}種を非表示）` : ''}`;
  const shown = arr.slice(0, state.shown);
  const asList = (f.view || 'list') === 'list';
  let lastFam = '';
  $('#plantList').classList.toggle('as-list', asList);
  $('#plantList').innerHTML = (shown.map((rs) => {
    const fam = f.sort === 'family' && rs[0].plant.family.ja !== lastFam ? `<h3 class="fam-head">${esc((lastFam = rs[0].plant.family.ja))} <small>${esc(rs[0].plant.family.latin)}</small></h3>` : '';
    return fam + (asList && !state.openCards.has(rs[0].plant.group) ? plantRow(rs) : plantCard(rs));
  }).join('') || '<p class="empty">条件に合う植物がありません。条件をゆるめてみてください。</p>')
    + (arr.length > shown.length ? `<button type="button" class="btn more" id="btnMore">さらに表示（残り${arr.length - shown.length}種）</button>` : '');
  hydratePhotos($('#plantList'), shown.map((rs) => (rs.find((x) => x.plant.id === state.cvSel[rs[0].plant.group]) || rs[0]).plant));
}

document.addEventListener('click', (e) => {
  if (e.target.closest('#btnMore')) {
    state.shown += PAGE;
    const y = window.scrollY;
    renderPlants(true);
    window.scrollTo({ top: y });
    return;
  }
  const c = e.target.closest('[data-cv]');
  if (!c) return;
  const group = c.dataset.group;
  state.cvSel[group] = c.dataset.cv;
  const rs = state.groupResults?.get(group);
  const card = document.querySelector(`[data-card="${group}"]`);
  if (rs && card) {
    card.outerHTML = plantCard(rs);
    const el = document.querySelector(`[data-card="${group}"]`);
    hydratePhotos(el, [byId.get(c.dataset.cv)]);
  }
});

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-toggle]');
  if (!b) return;
  const id = b.dataset.toggle;
  const i = state.garden.indexOf(id);
  if (i >= 0) state.garden.splice(i, 1); else state.garden.push(id);
  saveGardens();
  toast(i >= 0 ? `${byId.get(id).ja} を外しました` : `${byId.get(id).ja} を「${activeGarden().name}」に追加しました`);
  if (state.view === 'plants') {
    const y = window.scrollY;
    renderPlants(true);
    window.scrollTo({ top: y });
    const badge = $('#gardenBadge');
    badge.hidden = !state.garden.length;
    badge.textContent = state.garden.length;
  } else render();
});

// ---------- マイガーデン ----------
function renderGarden() {
  const box = $('#gardenBox');
  const plants = state.garden.map((id) => byId.get(id));
  if (!plants.length) {
    box.innerHTML = `${gardenBar()}${tsupiSays('まだ植物がないみたい。プランを作るか、図鑑から気になる植物を集めてみよう！', 'sprout')}<div class="card empty"><div class="row" style="justify-content:center"><button class="btn primary" type="button" data-go="plan">${icon('plan', 17)}プランをつくる</button><button class="btn" type="button" data-go="plants">植物を探す</button></div></div>`;
    return;
  }
  const c = state.climate;
  const south = c?.south;
  const now = new Date().getMonth() + 1;
  const { counts, gaps } = bloomGaps(plants, c, south);
  const sorted = [...plants].sort((a, b) => Math.min(...a.bloom.map((m) => localMonth(m, south))) - Math.min(...b.bloom.map((m) => localMonth(m, south))));

  const actual = actualBloom(diaryCache);
  const cal = `<div class="cal" role="table" aria-label="開花カレンダー">
    <div></div>${MONTHS.map((m) => `<div class="h">${m}</div>`).join('')}
    ${sorted.map((p) => {
      const on = new Set(p.bloom.map((m) => localMonth(m, south)));
      const col = COLORS[p.color[0]].hex;
      const act = actual.get(p.id);
      return `<div class="n" title="${esc(p.ja)}">${esc(p.ja)}</div>${MONTHS.map((m) => `<div class="c${m === now ? ' now' : ''}"${on.has(m) ? ` style="background:${col}"` : ''} title="${m}月${on.has(m) ? '：開花' : ''}${act?.has(m) ? '（ノートに開花の記録あり）' : ''}">${act?.has(m) ? '<i class="act"></i>' : ''}</div>`).join('')}`;
    }).join('')}
    <div class="n" style="color:var(--muted);font-size:.72rem">咲いている種類</div>${counts.map((n) => `<div class="sum${n ? '' : ' zero'}">${n}</div>`).join('')}
  </div>`;

  const gapHtml = gaps.length
    ? gaps.map((g) => `<div class="gap"><strong>${g.month}月</strong> は咲いている花がありません。${g.suggestions.length ? 'おすすめ：' : ''}
        <div class="sugg">${g.suggestions.map((s) => `<button type="button" class="chip" data-toggle="${s.plant.id}"><span class="dot" style="background:${COLORS[s.plant.color[0]].hex}"></span>＋ ${esc(s.plant.ja)}${s.level ? ` ${LEVEL[s.level].mark}` : ''}</button>`).join('')}</div></div>`).join('')
    : '<p class="hint">春から晩秋まで、途切れずに花が咲くリレーになっています。</p>';

  const layers = ['back', 'middle', 'front'].map((k) => {
    const list = plants.filter((p) => heightClass(p) === k);
    if (!list.length) return '';
    return `<div class="layer"><h3>${HEIGHT_LABEL[k]}<small>${k === 'back' ? '花壇の奥・北側' : k === 'front' ? '手前・縁取り' : '中ほど'}</small></h3>
      ${list.map((p) => {
        const r = evaluate(p, c);
        const per = plantsPerSqm(p);
        const share = state.area / plants.length;
        const qty = qtyFor(p, plants);
        return `<div class="gplant">
          <span class="dot" style="background:${COLORS[p.color[0]].hex}"></span>
          <div class="grow"><div>${esc(p.ja)} ${r.level ? `<span class="lv lv-${r.level}" style="margin-left:4px">${LEVEL[r.level].mark}</span>` : ''}</div>
          <div class="sub">株間 約${p.spread}cm・1㎡に${per}株・${p.h[0]}〜${p.h[1]}cm</div></div>
          <span class="qty">約${qty}株</span>
          <button type="button" class="icon-btn rec-btn" data-record="${p.id}" aria-label="${esc(p.ja)}の記録を書く">${icon('note', 17)}</button>
          <button type="button" class="have ${activeGarden().have[p.id] ? 'on' : ''}" data-have="${p.id}">${activeGarden().have[p.id] ? '植えた' : 'ほしい'}</button>
          <button type="button" class="icon-btn" data-toggle="${p.id}" aria-label="${esc(p.ja)}を外す">✕</button>
        </div>`;
      }).join('')}</div>`;
  }).join('');

  box.innerHTML = `
    ${gardenBar()}
    ${shoppingCard(plants)}
    <div class="card">
      <h2>開花リレー</h2>
      <p class="hint">植物ごとの開花月。枠線は今月です。${actual.size ? '●はノートに開花を記録した月です。' : ''}</p>
      <div class="scroll-x">${cal}</div>
    </div>
    <div class="card">
      <h2>花の途切れる月</h2>
      ${c ? '' : '<p class="hint">場所を設定すると、地域に合う植物だけを提案します。</p>'}
      ${gapHtml}
    </div>
    <div class="card bio-card">
      <h2>${icon('butterfly', 19)} 生き物と生物多様性</h2>
      <p class="hint">庭にあるものを選ぶと、来そうな生き物と生物多様性度に反映されます。</p>
      ${featureChips(activeGarden().features)}
      ${bioHtml(biodiversity(plants, activeGarden().features, c))}
      ${gardenSeenHtml()}
      <details class="crit-details"${state.critOpen ? ' open' : ''}><summary>来そうな生き物を見る（${creaturesForGarden(plants, activeGarden().features, c).filter((x) => x.level >= 2).length}種）</summary>${crittersHtml(creaturesForGarden(plants, activeGarden().features, c), south, 12, seenSet())}</details>
      ${webHtml(creaturesForGarden(plants, activeGarden().features, c), plants, activeGarden().features)}
    </div>
    <div class="card">
      <h2>配置と株数の目安</h2>
      <label class="area">花壇の面積 <input type="number" id="area" min="0.5" step="0.5" value="${state.area}" inputmode="decimal"> ㎡</label>
      <p class="hint" style="margin-top:6px">面積を植物の種類数で等分した場合の株数です。同じ植物を3〜5株まとめて植えると自然で見栄えがよくなります。</p>
      ${layers}
      ${gardenCost(plants)}
    </div>`;

  box.querySelector('.feat-chips')?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-feat]');
    if (!b) return;
    const g = activeGarden();
    g.features[b.dataset.feat] = !g.features[b.dataset.feat];
    if (!g.features[b.dataset.feat]) delete g.features[b.dataset.feat];
    saveGardens();
    const y = window.scrollY;
    state.critOpen = box.querySelector('.crit-details')?.open;
    renderGarden();
    window.scrollTo({ top: y });
  });
  $('#area').addEventListener('change', (e) => {
    const v = parseFloat(e.target.value);
    if (v > 0) { state.area = v; renderGarden(); }
  });
}

// ---------- 作業暦 ----------
function renderTasks() {
  const box = $('#tasksBox');
  const c = state.climate;
  if (!c) {
    box.innerHTML = tsupiSays('庭の場所を教えてくれたら、その土地の霜や暑さに合わせた作業カレンダーを作るよ。', 'think') + guideCard() + `<div class="card empty"><p>場所を設定すると、作業カレンダーが表示されます。</p><button class="btn primary" type="button" data-go="site">場所を設定</button></div>`;
    return;
  }
  const plants = state.garden.map((id) => byId.get(id));
  const tasks = [...buildTasks(c, plants), ...pestTasks(c, plants)];
  const now = new Date().getMonth() + 1;
  const order = MONTHS.map((_, i) => ((now - 1 + i) % 12) + 1);
  const blooming = plants.filter((p) => p.bloom.map((m) => localMonth(m, c.south)).includes(now));

  box.innerHTML = gardenPicker() + '<div id="wxSlot"></div>' + guideCard()
    + (plants.length ? '' : `<div class="card"><p class="hint" style="margin:0">マイ庭に植物を追加すると、植物ごとの切り戻し・株分け・病害虫の見回り時期も表示されます。</p></div>`)
    + order.map((m) => {
      const list = tasks.filter((t) => t.month === m);
      const cur = m === now;
      if (!list.length && !cur) return '';
      return `<div class="card month-block${cur ? ' current' : ''}">
        <h2>${m}月${cur ? '<span class="pill">今月</span>' : ''}</h2>
        ${cur && blooming.length ? `<div class="blooming" style="margin-bottom:6px">${blooming.map((p) => `<span class="chip"><span class="dot" style="background:${COLORS[p.color[0]].hex}"></span>${esc(p.ja)} が見頃</span>`).join('')}</div>` : ''}
        ${list.map((t) => `<div class="task"><div class="ic" aria-hidden="true">${icon(TASK_ICON[t.kind] || 'leaf', 18)}</div><div>
          <div class="t">${esc(t.title)}${t.risk ? ` <span class="risk r${t.risk}">${RISK_JA[t.risk]}</span>` : ''}</div><div class="d">${esc(t.detail)}</div>
          ${t.plants && !(t.plants.length === 1 && t.title.startsWith(t.plants[0].ja)) ? `<div class="p">対象：${t.plants.map((p) => esc(p.ja)).join('、')}</div>` : ''}
        </div></div>`).join('') || '<p class="hint">特別な作業はありません。庭を観察して楽しみましょう。</p>'}
      </div>`;
    }).join('')
    + `<p class="note">時期は${esc(state.loc.name)}の過去10年の終霜・初霜・暑さから計算した目安です。その年の天候に合わせて調整してください。</p>`;
  weatherCard().then((h) => { const el = $('#wxSlot'); if (el) el.innerHTML = h; });
}


// ---------- 写真 ----------
const yen = (n) => '¥' + Math.round(n).toLocaleString('ja-JP');

function photoHtml(p, cls = 'photo', color) {
  const mine = userPhotos.get(p.id);
  const im = mine ? null : imageOf(p.id);
  const inner = mine
    ? `<img src="${mine}" alt="${esc(p.ja)}の写真（自分で撮影）" loading="lazy"><span class="credit">マイ写真</span>`
    : im
    ? `<img src="${esc(im.src)}" alt="${esc(p.ja)}の写真" loading="lazy"><a class="credit" href="${esc(im.url || '#')}" target="_blank" rel="noopener">${esc(im.site || 'Wikipedia')}</a>${im.speciesOnly && cls === 'photo' ? '<span class="fallback-note">写真は同じ種の代表的な姿</span>' : ''}`
    : plantThumbSVG(p, color);
  return `<div class="${cls}" data-photo="${p.id}" data-color="${color || ''}">${inner}</div>`;
}

/** 写真を非同期で取得し、表示中の要素を差し替える */
async function hydratePhotos(root, plants) {
  const missing = plants.filter((p) => !imageOf(p.id));
  if (!missing.length) return;
  await loadImages(missing);
  for (const p of missing) {
    if (!imageOf(p.id)) continue;
    root.querySelectorAll(`[data-photo="${p.id}"]`).forEach((el) => {
      el.outerHTML = photoHtml(p, el.className, el.dataset.color || undefined);
    });
  }
}
// 読み込みに失敗した写真はイラストに戻す
document.addEventListener('error', (e) => {
  const img = e.target;
  if (img.tagName !== 'IMG') return;
  const box = img.closest('[data-photo]');
  const p = box && byId.get(box.dataset.photo);
  if (p) box.innerHTML = plantThumbSVG(p, box.dataset.color || undefined);
}, true);

// ---------- 費用（マイガーデン） ----------
function qtyFor(p, plants) {
  const share = state.area / plants.length;
  return Math.max(1, Math.round(plantsPerSqm(p) * share));
}
function gardenCost(plants) {
  const plantsCost = plants.reduce((t, p) => t + qtyFor(p, plants) * p.price, 0);
  const extras = state.area * (1500 + 800 + 200);
  return `<table class="cost-table" style="margin-top:10px">
    <tr><td>苗代（上の株数 × 平均価格）</td><td>${yen(plantsCost)}</td></tr>
    <tr><td>土づくり・マルチ・元肥（${state.area}㎡）</td><td>${yen(extras)}</td></tr>
    <tr class="total"><td>概算合計</td><td>${yen(plantsCost + extras)}</td></tr>
  </table>`;
}

// ---------- 開花リレー表 ----------
function calHtml(rows, south, counts) {
  const now = new Date().getMonth() + 1;
  return `<div class="cal" role="table" aria-label="開花カレンダー">
    <div></div>${MONTHS.map((m) => `<div class="h">${m}</div>`).join('')}
    ${rows.map(({ p, color, label }) => {
      const on = new Set(p.bloom.map((m) => localMonth(m, south)));
      const col = COLORS[color || p.color[0]].hex;
      return `<div class="n" title="${esc(p.ja)}">${label ? label + ' ' : ''}${esc(p.ja)}</div>${MONTHS.map((m) => `<div class="c${m === now ? ' now' : ''}"${on.has(m) ? ` style="background:${col}"` : ''} title="${m}月${on.has(m) ? '：開花' : ''}"></div>`).join('')}`;
    }).join('')}
    <div class="n" style="color:var(--muted);font-size:.72rem">咲いている種類</div>${counts.map((n) => `<div class="sum${n ? '' : ' zero'}">${n}</div>`).join('')}
  </div>`;
}

// ---------- 植栽プラン ----------
function initPlanForm() {
  const pi = state.planInput;
  $('#planText').value = pi.text;
  $('#planW').value = pi.width;
  $('#planD').value = pi.depth;
  $('#planBudget').value = pi.budget || '';
  $('#planAnnuals').checked = !!pi.annuals;
  $('#siteW').value = pi.site.width;
  $('#siteD').value = pi.site.depth;
  $('#siteArea').value = pi.site.area || '';
  $('#polySize').value = String(pi.site.size || 15);
  $('#planStyle').innerHTML = Object.entries(STYLES).map(([k, v]) => `<option value="${k}">${v.ja}</option>`).join('');
  $('#planStyle').value = pi.style || 'border';
  const syncStyle = () => { $('#styleDesc').textContent = STYLES[$('#planStyle').value].summary; };
  $('#planStyle').addEventListener('change', () => { state.planInput.style = $('#planStyle').value; syncStyle(); });
  syncStyle();
  $('#planPresets').innerHTML = PRESETS.map((w) => `<button type="button" class="chip" data-w="${w}">${w}</button>`).join('');
  $('#planPresets').addEventListener('click', (e) => {
    const b = e.target.closest('[data-w]');
    if (!b) return;
    const t = $('#planText');
    const w = b.dataset.w;
    t.value = t.value.includes(w) ? t.value.replace(w, '').replace(/、{2,}/g, '、').replace(/^、|、$/g, '') : (t.value ? t.value.replace(/[、。\s]*$/, '') + '、' : '') + w;
    syncPresetChips();
  });
  $('#planText').addEventListener('input', syncPresetChips);
  document.querySelectorAll('[data-plan]').forEach((seg) => {
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      state.planInput[seg.dataset.plan] = b.dataset.v;
      syncPlanSegs();
    });
  });
  document.querySelectorAll('[data-site]').forEach((seg) => {
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      state.planInput.site[seg.dataset.site] = b.dataset.v;
      syncPlanSegs();
    });
  });
  $('#planMode').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.dataset.v === state.planInput.mode) return;
    state.planInput.mode = b.dataset.v;
    store.set('planInput', state.planInput);
    syncPlanSegs();
    renderPlan();
  });
  // 入れたいもの・呼びたい生き物（複数選択）
  $('#planItems').addEventListener('click', (e) => {
    const b = e.target.closest('[data-item]');
    if (!b) return;
    const arr = state.planInput.items;
    const i = arr.indexOf(b.dataset.item);
    if (i >= 0) arr.splice(i, 1); else arr.push(b.dataset.item);
    syncPlanSegs();
  });
  $('#planWild').addEventListener('click', (e) => {
    const b = e.target.closest('[data-wild]');
    if (!b) return;
    const arr = state.planInput.wild;
    const i = arr.indexOf(b.dataset.wild);
    if (i >= 0) arr.splice(i, 1); else arr.push(b.dataset.wild);
    syncPlanSegs();
  });
  // 自由な形：方眼をタップして角を打つ
  $('#polyEd').addEventListener('click', (e) => {
    const svg = e.target.closest('svg');
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const V = svg.viewBox.baseVal.width;
    const k = V / r.width;
    const pad = Number(svg.dataset.pad), S = Number(svg.dataset.s), size = Number(svg.dataset.size);
    const snap = size > 20 ? 1 : 0.5;
    const x = Math.round(((e.clientX - r.left) * k - pad) / S / snap) * snap;
    const y = Math.round(((e.clientY - r.top) * k - pad) / S / snap) * snap;
    if (x < 0 || y < 0 || x > size || y > size) return;
    const pts = state.planInput.site.points;
    const last = pts[pts.length - 1];
    if (last && last[0] === x && last[1] === y) return;
    pts.push([x, y]);
    drawPoly();
  });
  $('#polyUndo').addEventListener('click', () => { state.planInput.site.points.pop(); drawPoly(); });
  $('#polyClear').addEventListener('click', () => { state.planInput.site.points = []; drawPoly(); });
  $('#polySize').addEventListener('change', (e) => {
    const size = Number(e.target.value);
    const old = state.planInput.site.size || 15;
    state.planInput.site.points = state.planInput.site.points.map(([x, y]) => [Math.min(size, Math.round((x * size) / old * 2) / 2), Math.min(size, Math.round((y * size) / old * 2) / 2)]);
    state.planInput.site.size = size;
    drawPoly();
  });
  $('#btnPlan').addEventListener('click', () => makePlan(0));
  $('#btnPlanAlt').addEventListener('click', () => makePlan(state.planInput.seed + 1));
  syncPlanSegs();
  syncPresetChips();
}
function drawPoly() {
  const s = state.planInput.site;
  const size = s.size || 15;
  $('#polyEd').innerHTML = polyEditorSVG(s.points, size);
  const info = $('#polyInfo');
  if (s.points.length < 3) info.textContent = s.points.length ? `あと${3 - s.points.length}点以上打ってください。` : '最初の角をタップしてください。';
  else if (!isSimple(s.points)) info.textContent = '辺が交差しています。「1つ戻す」で直してください。';
  else info.textContent = `${s.points.length}角形・約${Math.round(polygonArea(s.points))}㎡${s.area ? `（面積の指定 ${s.area}㎡ に合わせて拡大縮小します）` : ''}`;
}
function syncPlanSegs() {
  const pi = state.planInput;
  document.querySelectorAll('[data-plan]').forEach((seg) => {
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === (pi[seg.dataset.plan] || '')));
  });
  document.querySelectorAll('[data-site]').forEach((seg) => {
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === (pi.site[seg.dataset.site] || '')));
  });
  const site = pi.mode === 'site';
  $('#planMode').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === pi.mode));
  $('#planForm').classList.toggle('is-site', site);
  document.querySelectorAll('#view-plan .site-only').forEach((el) => { el.hidden = !site; });
  document.querySelectorAll('#view-plan .bed-only').forEach((el) => { el.hidden = site; });
  $('#planFormTitle').textContent = site ? '庭まるごとプランをつくる' : '植栽プランをつくる';
  $('#btnPlanLabel').textContent = site ? '庭のプランをつくる' : 'プランをつくる';
  const shape = pi.site.shape;
  $('#siteFields .shape-wd').hidden = shape === 'poly';
  $('#siteFields .shape-L').hidden = shape !== 'L';
  $('#siteFields .shape-poly').hidden = shape !== 'poly';
  if (site && shape === 'poly') drawPoly();
  const keys = site ? Object.keys(ITEMS) : BED_ITEMS;
  $('#planItems').innerHTML = keys.map((k) => {
    const on = pi.items.includes(k);
    const label = site ? ITEMS[k].ja : FEATURES[k] ? FEATURES[k].replace(/（.*?）/g, '') : ITEMS[k].ja;
    return `<button type="button" class="chip${on ? ' on' : ''}" data-item="${k}" aria-pressed="${on}">${on ? '✓ ' : ''}${esc(label)}</button>`;
  }).join('');
  $('#planWild').innerHTML = Object.entries(WILD_GOALS).map(([k, v]) => {
    const on = pi.wild.includes(k);
    return `<button type="button" class="chip${on ? ' on' : ''}" data-wild="${k}" aria-pressed="${on}">${on ? '✓ ' : ''}${esc(v)}</button>`;
  }).join('');
}
function syncPresetChips() {
  const t = $('#planText').value;
  document.querySelectorAll('#planPresets .chip').forEach((c) => c.classList.toggle('on', t.includes(c.dataset.w)));
}
function readPlanForm() {
  const pi = state.planInput;
  pi.text = $('#planText').value.trim();
  pi.width = Math.min(30, Math.max(0.5, parseFloat($('#planW').value) || 3));
  pi.depth = Math.min(10, Math.max(0.4, parseFloat($('#planD').value) || 1.2));
  pi.budget = $('#planBudget').value;
  pi.annuals = $('#planAnnuals').checked;
  pi.site.width = Math.min(60, Math.max(2, parseFloat($('#siteW').value) || 10));
  pi.site.depth = Math.min(60, Math.max(2, parseFloat($('#siteD').value) || 8));
  const a = parseFloat($('#siteArea').value);
  pi.site.area = a > 0 ? Math.min(3000, Math.max(4, a)) : '';
}
/** 花壇プランのときの「庭にあるもの」→ 生き物用の環境 */
function planFeatures() {
  const f = {};
  for (const k of state.planInput.items) if (FEATURES[k]) f[k] = true;
  if (f.pond) f.water = true;
  return f;
}
function makePlan(seed, layoutSeed = 0) {
  readPlanForm();
  const pi = state.planInput;
  pi.layoutSeed = layoutSeed;
  if (pi.mode === 'site' && pi.site.shape === 'poly' && (pi.site.points.length < 3 || !isSimple(pi.site.points))) {
    toast('敷地の形を3点以上で、辺が交差しないように描いてください');
    $('#polyEd').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  pi.seed = seed;
  store.set('planInput', pi);
  computePlan();
  state.planMonth = state.plan?.peak ?? 6;
  renderPlan();
  $('#planBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function computePlan() {
  const pi = state.planInput;
  if (pi.mode === 'site') {
    state.site = generateSite({ ...pi.site, items: pi.items, wild: pi.wild, text: pi.text, style: pi.style, sun: pi.sun, moist: pi.moist, climate: state.climate, seed: pi.seed, layoutSeed: pi.layoutSeed, annuals: pi.annuals, budget: pi.budget });
    state.siteBed = null;
    state.plan = null;
    return;
  }
  state.plan = generatePlan({ ...pi, climate: state.climate });
}

function renderPlan() {
  const box = $('#planBox');
  if (state.planInput.mode === 'site' && !state.siteBed) { renderSitePlan(); return; }
  const plan = state.plan;
  const bedOfSite = state.planInput.mode === 'site' ? state.site?.beds.find((b) => b.id === state.siteBed) : null;
  $('#btnPlanAlt').hidden = !plan;
  if (!plan) {
    box.innerHTML = tsupiSays(state.climate
      ? 'どんな庭にしたい？ 色や雰囲気を言葉で教えてね。「白と青」「蝶が来る」みたいな感じで大丈夫だよ。'
      : '先に「ホーム」で庭の場所を教えてくれると、その土地で育ちやすい植物だけでプランを作れるよ。', 'think');
    return;
  }
  if (!plan.species.length) {
    box.innerHTML = '<div class="card empty">条件に合う植物が見つかりませんでした。日当たりや土の条件、キーワードを変えてみてください。</div>';
    return;
  }
  const south = !!state.climate?.south;
  const m = state.planMonth || plan.peak;
  const c = plan.cost;
  const budgetMsg = c.budget
    ? (c.total <= c.budget
      ? `<div class="alert ok">予算 ${yen(c.budget)} 内に収まっています（残り ${yen(c.budget - c.total)}）。</div>`
      : `<div class="alert warn">予算 ${yen(c.budget)} を ${yen(c.total - c.budget)} 超えています。キーワードに「低予算」を加えるか、花壇を小さくする、苗を少なめに植えて株が広がるのを待つ、などで調整できます。</div>`)
    : '';
  const read = plan.pref.matched.length
    ? plan.pref.matched.map((w) => `<span class="tag">${esc(w)}</span>`).join('')
    : '<span class="tag">指定なし（気候とバランス重視）</span>';
  const seasons = [['春', 4], ['初夏', 6], ['夏', 8], ['秋', 10], ['冬', 1]].map(([n, mm]) => [n, localMonth(mm, south)]);

  const title = planTitle(plan.pref.matched, plan.style);
  const share = {};
  plan.species.forEach((sp) => { share[sp.color] = (share[sp.color] || 0) + sp.qty; });
  const palette = Object.entries(share).sort((a, b) => b[1] - a[1]);
  const gallery = [['春', 4], ['初夏', 6], ['盛夏', 8], ['秋', 10], ['冬', 1]].map(([n, mm]) => [n, localMonth(mm, south)]);

  const bio = biodiversity(plan.species.map((sp) => sp.plant), planFeatures(), state.climate);
  const crit = creaturesForGarden(plan.species.map((sp) => sp.plant), planFeatures(), state.climate);
  box.innerHTML = `
    ${bedOfSite ? `<div class="site-back"><button type="button" class="btn small" id="btnSiteBack">← 庭全体のプランに戻る</button><span>花壇 <b>${bedOfSite.id}</b>　${esc(bedOfSite.name)}</span></div>` : ''}
    <section class="hero plan-hero">
      <div class="hero-art" id="elev">${elevationSVG(plan, m, south, { label: false })}</div>
      <div class="hero-text">
        <span class="kicker">Garden Plan · ${esc(STYLES[plan.style].by || 'Layered Border')}</span>
        <h1>${esc(title)}</h1>
        <p class="sekki">${esc(STYLES[plan.style].ja)}</p>
        <div class="month-slider"><input type="range" id="planMonth" min="1" max="12" step="1" value="${m}" aria-label="表示する月"><b id="planMonthLabel">${m}月</b></div>
      </div>
    </section>

    <div class="figures">
      <div><span class="fig">${plan.species.length}</span><span class="cap">種類・${plan.totalPlants}株</span></div>
      <div><span class="fig">${Math.round(plan.area * 10) / 10}<small>㎡</small></span><span class="cap">${plan.width}×${plan.depth}m・${SUN[plan.sun]}</span></div>
      <div><span class="fig">${yen(c.total)}</span><span class="cap">概算・1㎡ ${yen(c.perSqm)}</span></div>
    </div>
    ${plan.gaps.length ? `<p class="pnote warn">${plan.gaps.map((g) => g + '月').join('・')}は花が少なめ。グラスや葉の美しさを楽しむ時期です。</p>` : '<p class="pnote ok">春から晩秋まで、どの月も何かが咲く開花リレーです。</p>'}

    <section class="mag">
      ${secHead('Season Gallery', '季節の移ろい', '同じ花壇の一年。タップすると上の絵が切り替わります。')}
      <div class="carousel gallery season-btns">${gallery.map(([n, mm]) => `<button type="button" class="gal" data-month="${mm}">${elevationSVG(plan, mm, south, { label: false })}<span>${n}<small>${mm}月</small></span></button>`).join('')}</div>
    </section>

    <section class="mag">
      ${secHead('Palette', '色の構成')}
      <div class="palette">${palette.map(([col, n]) => `<div style="flex:${n}"><span class="sw" style="background:${COLORS[col].hex}"></span><span class="pl">${COLORS[col].ja}<small>${Math.round((n / plan.totalPlants) * 100)}%</small></span></div>`).join('')}</div>
      <p class="lead">読み取ったイメージ：${plan.pref.matched.length ? plan.pref.matched.map(esc).join('、') : '指定なし（気候とバランスを重視）'}</p>
    </section>

    <section class="mag">
      ${secHead('Design Notes', 'このスタイルの考え方', esc(STYLES[plan.style].summary))}
      <ol class="steps-num">${STYLES[plan.style].principles.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
    </section>

    <section class="mag">
      ${secHead('Planting List', '植える植物')}
      <div class="cast">${plan.species.map((sp) => `<article class="cast-card">
        <div class="cast-art">${photoHtml(sp.plant, 'cast-photo', sp.color)}<span class="no">${sp.no}</span></div>
        <div class="cbody">
          <span class="role">${esc(sp.roleJa)}</span>
          <h3>${esc(sp.plant.ja)}</h3>
          <p class="latin">${esc(sp.plant.latin)}</p>
          <p class="calc"><span class="dot" style="background:${COLORS[sp.color].hex};width:9px;height:9px"></span> ${COLORS[sp.color].ja}・${sp.plant.h[0]}〜${sp.plant.h[1]}cm${sp.level ? `・${LEVEL[sp.level].mark}` : ''}</p>
          ${monthBar({ ...sp.plant, color: [sp.color] }, south)}
          <p class="calc">${sp.qty}株 × ${yen(sp.plant.price)} = <b>${yen(sp.subtotal)}</b></p>
          <div class="why">${sp.why.map((w) => `<span>${esc(w)}</span>`).join('')}</div>
        </div>
      </article>`).join('')}</div>
    </section>

    <section class="mag paper">
      ${secHead('Planting Plan', '配置図', '○ ひとつが苗1株。番号は上のリストと対応しています。円は数年後の株の広がりの目安です。')}
      ${planSVG(plan)}
    </section>

    <section class="mag">
      ${secHead('Bloom Relay', '開花リレー')}
      <div class="scroll-x">${calHtml(plan.species.map((sp) => ({ p: sp.plant, color: sp.color, label: sp.no })), south, plan.counts)}</div>
    </section>

    <section class="mag">
      ${secHead('Wildlife', '来てくれる生き物', plan.wild?.length ? `「${plan.wild.map((g) => WILD_GOALS[g]).join('・')}」を呼べるよう、食草や蜜源になる植物を優先しました。` : 'この花壇の植物に集まりそうな生き物と、生物多様性度の目安です。')}
      ${bioHtml(bio)}
      ${crittersHtml(crit, south, 8, seenSet())}
      ${webHtml(crit, plan.species.map((sp) => sp.plant), planFeatures())}
    </section>
    ${plan.harvest?.some(Boolean) ? `<section class="mag">
      ${secHead('Harvest', '収穫カレンダー', '野菜やハーブを収穫できる月の目安です。')}
      <div class="scroll-x">${harvestCal(plan.species.filter((sp) => sp.plant.harvest?.length).map((sp) => sp.plant), south)}</div>
    </section>` : ''}

    <section class="mag receipt">
      ${secHead('Estimate', '概算費用')}
      <ul>
        <li><span>苗代（${plan.totalPlants}株）</span><i></i><b>${yen(c.plants)}</b></li>
        ${c.extras.map((e) => `<li><span>${esc(e.ja)}</span><i></i><b>${yen(e.cost)}</b></li>`).join('')}
        <li class="total"><span>合計の目安</span><i></i><b>${yen(c.total)}</b></li>
      </ul>
      ${budgetMsg}
      <p class="note">苗は9〜10.5cmポット苗（球根は1球）の一般的な価格の目安です。株を少なめに植えて数年かけて広げると費用を抑えられます。</p>
    </section>

    <div class="big-row">
      <button class="btn primary" type="button" id="btnApply">「${esc(activeGarden().name)}」に反映</button>
      <button class="btn" type="button" id="btnApplyNew">新しい庭として保存</button>
      <button class="btn" type="button" id="btnPlanImg">${icon('save', 16)}絵を保存</button>
      <button class="btn" type="button" id="btnAlt2">別の案をつくる</button>
    </div>`;

  const setMonth = (mm) => {
    state.planMonth = mm;
    $('#elev').innerHTML = elevationSVG(plan, mm, south, { label: false });
    $('#planMonth').value = mm;
    $('#planMonthLabel').textContent = `${mm}月`;
  };
  $('#planMonth').addEventListener('input', (e) => setMonth(Number(e.target.value)));
  box.querySelector('.season-btns').addEventListener('click', (e) => {
    const b = e.target.closest('[data-month]');
    if (b) { setMonth(Number(b.dataset.month)); $('.plan-hero').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  $('#btnAlt2').addEventListener('click', () => makePlan(state.planInput.seed + 1));
  $('#btnSiteBack')?.addEventListener('click', () => { const id = state.siteBed; state.siteBed = null; renderPlan(); document.querySelector(`[data-bedcard="${id}"]`)?.scrollIntoView({ block: 'center' }); });
  const applyTo = (g) => {
    g.plants = plan.species.map((sp) => sp.plant.id);
    g.area = Math.round(plan.area * 10) / 10;
    g.sun = plan.sun;
    g.moist = plan.moist || g.moist || '';
    g.features = { ...(g.features || {}), ...planFeatures() };
    state.gardenId = g.id;
    saveGardens();
    toast(`「${g.name}」にプランを反映しました`);
    go('garden');
  };
  $('#btnApply').addEventListener('click', () => {
    const g = activeGarden();
    if (g.plants.length && !confirm(`「${g.name}」の植物をこのプランで置き換えます。よろしいですか？`)) return;
    applyTo(g);
  });
  $('#btnApplyNew').addEventListener('click', () => {
    const name = prompt('新しい庭の名前', bedOfSite?.name || state.planBedName || title);
    if (!name) return;
    const g = { id: 'g' + Date.now().toString(36), name: name.trim().slice(0, 30), plants: [], area: 3, sun: '', moist: '', have: {} };
    state.gardens.push(g);
    applyTo(g);
  });
  $('#btnPlanImg').addEventListener('click', async () => {
    try {
      const blob = await svgToPngBlob($('#elev svg'));
      const r = await saveFile(`garden-plan-${m}gatsu.png`, blob, 'image/png');
      if (r !== 'cancel') toast('絵を保存しました');
    } catch (err) { toast(err.message); }
  });
  hydratePhotos(box, plan.species.map((s) => s.plant));
}


// ---------- 庭まるごとプラン（プレゼンテーション） ----------
const SITE_LAYERS = { plain: '平面図', tour: '園内の案内', photo: 'フォトスポット' };
const SHAPE_JA = { rect: '長方形', L: 'L字', poly: '自由な形' };
function renderSitePlan() {
  const box = $('#planBox');
  const s = state.site;
  $('#btnPlanAlt').hidden = true;
  if (!s) {
    box.innerHTML = tsupiSays('敷地の形と大きさ、入れたいものを選んでね。小道や花壇の配置から、見どころ・フォトスポット・来てくれる生き物まで、庭まるごと提案するよ。', 'think');
    return;
  }
  const pi = state.planInput;
  const south = !!state.climate?.south;
  const words = s.beds[0]?.plan.pref.matched || [];
  const title = planTitle(words, pi.style);
  const nPlants = s.plants.length;
  const totalQty = s.beds.reduce((t, b) => t + b.plan.totalPlants, 0);
  const layer = state.siteLayer;
  const structNames = [...new Set(s.structs.map((x) => ITEMS[x.type]?.ja).filter(Boolean))];
  const c = s.cost;
  const budgetMsg = c.budget
    ? (c.total <= c.budget ? `<div class="alert ok">予算 ${yen(c.budget)} 内に収まっています。</div>`
      : `<div class="alert warn">予算 ${yen(c.budget)} を ${yen(c.total - c.budget)} 超えています。構造物を後から少しずつ加える、テラスを小さくする、苗を少なめに植えて広げる、などで調整できます。</div>`)
    : '';
  const midMonth = (h) => localMonth(h.months[Math.floor(h.months.length / 2)], south);
  const bedFor = (h) => s.beds.find((b) => h.stars[0] && b.plan.species.some((sp) => sp.plant.id === h.stars[0].p.id)) || s.beds[0];

  box.innerHTML = `
    <section class="hero plan-hero site-hero">
      <div class="hero-art site-art" id="siteArt">${siteSVG(s, { tour: layer === 'tour', photos: layer === 'photo' })}</div>
      <div class="hero-text">
        <span class="kicker">Garden Design · ${esc(STYLES[pi.style]?.by || 'Whole Garden')}</span>
        <h1>${esc(title)}</h1>
        <p class="sekki">${esc(SHAPE_JA[pi.site.shape])}の敷地・家は${DIR_JA[s.house]}側・${esc(STYLES[pi.style]?.ja || '')}</p>
        <div class="seg small" id="siteLayer">${Object.entries(SITE_LAYERS).map(([k, v]) => `<button type="button" data-v="${k}" class="${k === layer ? 'on' : ''}">${v}</button>`).join('')}</div>
        <div class="alt-row"><span>別の案：</span><button type="button" class="btn small" data-sitealt="plants">${icon('leaf', 15)}植栽だけ変える</button><button type="button" class="btn small" data-sitealt="layout">${icon('refresh', 15)}配置も変える</button></div>
      </div>
    </section>
    <div class="legend">${[['#cfdcae', '芝生'], ['#b9a079', '花壇'], ['#e8dcc0', '小道'], ['#d6c29c', 'テラス'], ['#9cc4cf', '水辺']].map(([col, t]) => `<span><i style="background:${col}"></i>${t}</span>`).join('')}${layer === 'tour' ? '<span><i class="ln"></i>案内ルート</span>' : ''}${layer === 'photo' ? '<span><i class="cam"></i>撮影位置と向き</span>' : ''}</div>

    <div class="figures four">
      <div><span class="fig">${s.area}<small>㎡</small></span><span class="cap">敷地・約${Math.round(s.W * 10) / 10}×${Math.round(s.H * 10) / 10}m</span></div>
      <div><span class="fig">${s.beds.length}<small>か所</small></span><span class="cap">花壇 ${s.areas.bed}㎡・${nPlants}種${totalQty}株</span></div>
      <div><span class="fig">${yen(c.total)}</span><span class="cap">概算（材料費・DIY）</span></div>
      <div><span class="fig">${s.bio.total}<small>点</small></span><span class="cap">生物多様性度・${esc(s.bio.label)}</span></div>
    </div>
    ${s.skipped?.length ? `<p class="pnote warn">敷地が小さいため、${s.skipped.map(esc).join('・')}は入れずに、花壇を優先しました。</p>` : ''}
    ${structNames.length ? `<p class="pnote">庭にあるもの：${structNames.map(esc).join('・')}</p>` : ''}

    <section class="mag">
      ${secHead('Highlights', '季節の見どころ', '一年を通して、この庭がいちばん輝く瞬間。')}
      <div class="carousel hl-cards">${s.highlights.map((h) => { const b = bedFor(h); return `<article class="hl-card">
        <div class="hl-art">${b ? elevationSVG(b.plan, midMonth(h), south, { label: false }) : ''}</div>
        <div class="hb"><span class="en">${h.en}</span><h3>${h.ja}</h3><p>${esc(h.text)}</p>
        ${h.stars.length ? `<div class="hl-stars">${h.stars.slice(0, 4).map((x) => `<span class="chip"><span class="dot" style="background:${COLORS[x.color]?.hex}"></span>${esc(x.p.groupJa.replace(/（.*?）/g, ''))}</span>`).join('')}</div>` : ''}</div>
      </article>`; }).join('')}</div>
    </section>

    <section class="mag">
      ${secHead('Garden Tour', '園内の案内', 'テラスから小道をたどって、庭をひとめぐり。番号は平面図の「園内の案内」と対応しています。')}
      <ol class="tour">${s.tour.map((t) => `<li><span class="tno">${t.no}</span><div><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p></div></li>`).join('')}</ol>
    </section>

    <section class="mag">
      ${secHead('Photo Spots', 'フォトスポット', '平面図の「フォトスポット」で、撮る位置と向きを確認できます。')}
      <div class="photo-spots">${s.photos.map((ph) => `<article class="ps-card">
        <div class="ps-no">${icon('camera', 16)}<b>${ph.no}</b></div>
        <div><h3>${esc(ph.title)}</h3><p>${esc(ph.shot)}</p><p class="ps-when">${icon('sun', 14)}${esc(ph.when)}</p><p class="ps-tip">${esc(ph.tip)}</p></div>
      </article>`).join('') || '<p class="hint">パーゴラや水場を入れると、フォトスポットがふえます。</p>'}</div>
    </section>

    <section class="mag">
      ${secHead('Wildlife', '生き物と生物多様性', pi.wild.length ? `「${pi.wild.map((g) => WILD_GOALS[g]).join('・')}」を呼べるよう植物を選びました。` : '植物と庭の環境（水場・木・堆肥置き場など）から、来てくれそうな生き物を見積もりました。')}
      ${bioHtml(s.bio)}
      ${crittersHtml(s.critters, south, 12, seenSet())}
      ${webHtml(s.critters, s.plants, s.features, true)}
    </section>

    <section class="mag">
      ${secHead('Beds', '花壇ごとの植栽', '塀や家・木の影を考えて、花壇ごとに日当たりを判断しています。')}
      <div class="bed-cards">${s.beds.map((b) => `<article class="bed-card" data-bedcard="${b.id}">
        <div class="bc-art">${b.plan.species.length ? elevationSVG(b.plan, b.plan.peak, south, { label: false }) : ''}</div>
        <div class="bc-body">
          <h3><span class="bid">${b.id}</span>${esc(b.name)}</h3>
          <p class="calc">${b.area}㎡（約${b.width}×${b.depth}m）・${SUN[b.sun]}${b.sunWhy.length ? `<small>（${esc(b.sunWhy.join('・'))}）</small>` : ''}・${b.plan.species.length}種${b.plan.totalPlants}株</p>
          <div class="hl-stars">${b.plan.species.slice(0, 8).map((sp) => `<span class="chip"><span class="dot" style="background:${COLORS[sp.color].hex}"></span>${esc(sp.plant.ja)}</span>`).join('')}</div>
          <button type="button" class="btn small" data-sitebed="${b.id}">${icon('plan', 15)}この花壇を詳しく</button>
        </div>
      </article>`).join('')}</div>
    </section>

    <section class="mag receipt">
      ${secHead('Estimate', '概算費用')}
      <ul>
        ${c.items.map((e) => `<li><span>${esc(e.ja)}</span><i></i><b>${yen(e.cost)}</b></li>`).join('')}
        <li class="total"><span>合計の目安</span><i></i><b>${yen(c.total)}</b></li>
      </ul>
      ${budgetMsg}
      <p class="note">構造物は材料を買ってDIYする場合の大まかな目安です。業者に頼む場合は施工費が加わります。一度に作らず、数年かけて少しずつ育てるのもおすすめです。</p>
    </section>

    <div class="big-row">
      <button class="btn primary" type="button" id="btnSiteNew">新しい庭として保存</button>
      <button class="btn" type="button" id="btnSiteApply">「${esc(activeGarden().name)}」に反映</button>
      <button class="btn" type="button" id="btnSiteImg">${icon('save', 16)}平面図を保存</button>
      <button class="btn" type="button" data-consult="${esc(`庭まるごとプラン（敷地 約${s.area}㎡、家は${DIR_JA[s.house]}側、${structNames.join('・')}、花壇${s.beds.length}か所、植物：${s.plants.slice(0, 12).map((p) => p.groupJa.replace(/（.*?）/g, '')).join('・')}）を、もっと魅力的にするアイデアを教えてください。`)}">${icon('search', 16)}AIに相談</button>
    </div>
    <div class="alt-box">
      <b>別の案をつくる</b>
      <p class="hint">構造物の配置はそのままで植物だけ選び直すか、小道の形やテラス・池・木の位置も含めて配置から考え直すかを選べます。</p>
      <div class="row"><button type="button" class="btn" data-sitealt="plants">${icon('leaf', 16)}植栽だけ変える</button><button type="button" class="btn" data-sitealt="layout">${icon('refresh', 16)}配置も変える</button></div>
    </div>`;

  $('#siteLayer').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    state.siteLayer = b.dataset.v;
    renderSitePlan();
    $('.site-hero').scrollIntoView({ block: 'start' });
  });
  box.querySelectorAll('[data-sitebed]').forEach((b) => b.addEventListener('click', () => {
    const bed = s.beds.find((x) => x.id === b.dataset.sitebed);
    state.siteBed = bed.id;
    state.plan = bed.plan;
    state.planMonth = bed.plan.peak;
    renderPlan();
    $('#planBox').scrollIntoView({ block: 'start' });
  }));
  box.querySelectorAll('[data-sitealt]').forEach((b) => b.addEventListener('click', () => {
    const pi2 = state.planInput;
    if (b.dataset.sitealt === 'layout') makePlan(pi2.seed + 1, pi2.layoutSeed + 1);
    else makePlan(pi2.seed + 1, pi2.layoutSeed);
    toast(b.dataset.sitealt === 'layout' ? '配置と植栽を考え直しました' : '配置はそのままで、植栽を選び直しました');
  }));
  const applyTo = (g) => {
    g.plants = s.plants.map((p) => p.id);
    g.area = s.areas.bed;
    g.sun = pi.sun || '';
    g.moist = pi.moist || '';
    g.features = { ...s.features };
    state.gardenId = g.id;
    saveGardens();
    toast(`「${g.name}」に庭のプランを反映しました`);
    go('garden');
  };
  $('#btnSiteApply').addEventListener('click', () => {
    const g = activeGarden();
    if (g.plants.length && !confirm(`「${g.name}」の植物をこのプランで置き換えます。よろしいですか？`)) return;
    applyTo(g);
  });
  $('#btnSiteNew').addEventListener('click', () => {
    const name = prompt('新しい庭の名前', title);
    if (!name) return;
    const g = { id: 'g' + Date.now().toString(36), name: name.trim().slice(0, 30), plants: [], area: 3, sun: '', moist: '', have: {}, features: {} };
    state.gardens.push(g);
    applyTo(g);
  });
  $('#btnSiteImg').addEventListener('click', async () => {
    try {
      const blob = await svgToPngBlob($('#siteArt svg'));
      const r = await saveFile('garden-site-plan.png', blob, 'image/png');
      if (r !== 'cancel') toast('平面図を保存しました');
    } catch (err) { toast(err.message); }
  });
}


// ---------- 生き物図鑑・観察記録 ----------
const seenSet = (gid = null) => new Set(state.sightings.filter((x) => !gid || x.g === gid).map((x) => x.c));
function saveSightings() { store.set('sightings', state.sightings); }
const crById = new Map(CREATURES.map((c) => [c.id, c]));
const dShort = (s) => { const d = new Date(s + 'T00:00:00'); return `${d.getFullYear() === new Date().getFullYear() ? '' : `${d.getFullYear()}年`}${d.getMonth() + 1}月${d.getDate()}日`; };

function renderZukan() {
  document.querySelectorAll('#zukanTabs button').forEach((b) => b.classList.toggle('on', b.dataset.v === state.zukan));
  $('#plantPane').hidden = state.zukan !== 'plants';
  $('#critterPane').hidden = state.zukan !== 'critters';
  if (state.zukan === 'critters') renderCritters(); else renderPlants();
}
$('#zukanTabs').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  state.zukan = b.dataset.v;
  renderZukan();
  window.scrollTo({ top: 0 });
});

/** 生き物を呼ぶ植物（図鑑から） */
function plantsForCritter(cr) {
  const host = new Map(), other = new Map();
  for (const p of PLANTS) {
    const w = relation(cr, p);
    if (!w) continue;
    (w === 'host' ? host : other).set(p.group, p.groupJa.replace(/（.*?）/g, ''));
  }
  return { host: [...host.values()].slice(0, 8), other: [...other.values()].slice(0, 10) };
}
const EAT_JA = { nectar: '花の蜜・花粉', leaf: '葉', fruit: '木の実', seed: '種', sap: '樹液', litter: '落ち葉', aphid: 'アブラムシ', caterpillar: 'イモムシ', smallbug: '小さな虫' };
function eatsText(id) {
  return (INFO[id]?.eats || []).map((e) => (e.startsWith('k:') ? KINDS[e.slice(2)] : EAT_JA[e] || crById.get(e)?.ja || e)).join('・');
}
function monthCells(months, south) {
  const on = new Set(months.map((m) => localMonth(m, south)));
  const now = new Date().getMonth() + 1;
  return `<div class="mbar" aria-label="見られる月">${MONTHS.map((m) => `<span class="${on.has(m) ? 'on' : ''}${m === now ? ' now' : ''}">${m}</span>`).join('')}</div>`;
}

function critterEntry(cr, ctx) {
  const inf = INFO[cr.id] || {};
  const recs = state.sightings.filter((x) => x.c === cr.id).sort((a, b) => b.date.localeCompare(a.date));
  const lv = ctx.garden.get(cr.id);
  const pl = plantsForCritter(cr);
  const open = state.critF.q && cr.ja.includes(state.critF.q);
  return `<article class="crit-entry${recs.length ? ' is-seen' : ''}" id="cr-${cr.id}">
    <div class="ce-art">${critterSVG(cr.id, 92)}</div>
    <div class="ce-body">
      <div class="ce-head">${kindTag(cr.kind)}${lv ? `<span class="ce-lv">この庭に${LEVEL_JA[lv]}</span>` : ''}${recs.length ? `<span class="ce-seen">✓ 見つけた${recs.length > 1 ? `（${recs.length}回）` : ''}</span>` : ''}</div>
      <h3>${esc(cr.ja)}${cr.base === 1 ? '<small>まれ</small>' : ''}</h3>
      <p class="ce-size">${esc(inf.size || '')}</p>
      ${monthCells(cr.months, ctx.south)}
      <p class="ce-look"><b>見分け方</b>${esc(inf.look || '')}</p>
      <details${open ? ' open' : ''}><summary>くわしく見る</summary>
        ${inf.similar ? `<p><b>似ている生き物</b>${esc(inf.similar)}</p>` : ''}
        ${inf.tip ? `<p><b>観察のコツ</b>${esc(inf.tip)}</p>` : ''}
        <p><b>庭での暮らし</b>${esc(cr.note || '')}</p>
        <p><b>食べもの</b>${esc(eatsText(cr.id))}</p>
        ${pl.host.length ? `<p><b>幼虫が育つ植物</b></p><div class="chips">${pl.host.map((n) => `<button type="button" class="chip" data-find="${esc(n)}">${esc(n)}</button>`).join('')}</div>` : ''}
        ${pl.other.length ? `<p><b>呼びよせる植物</b></p><div class="chips">${pl.other.map((n) => `<button type="button" class="chip" data-find="${esc(n)}">${esc(n)}</button>`).join('')}</div>` : ''}
        ${Object.keys(cr.feature).length ? `<p><b>あるとうれしい環境</b>${Object.keys(cr.feature).map((k) => esc(FEATURES[k].replace(/（.*?）/g, ''))).join('・')}</p>` : ''}
        ${recs.length ? `<p><b>観察の記録</b></p><ul class="rec-list">${recs.slice(0, 8).map((r) => `<li>${dShort(r.date)}・${esc(state.gardens.find((g) => g.id === r.g)?.name || '')}${r.n > 1 ? `・${r.n}匹` : ''}${r.memo ? `「${esc(r.memo)}」` : ''}<button type="button" class="icon-btn" data-delsaw="${r.id}" aria-label="この記録を消す">✕</button></li>`).join('')}</ul>` : ''}
      </details>
      <div class="ce-acts"><button type="button" class="btn small primary" data-saw="${cr.id}">${icon('eye', 15)}見た！記録する</button>${recs.length ? `<span class="hint">最後に見たのは ${dShort(recs[0].date)}</span>` : ''}</div>
    </div>
  </article>`;
}

function renderCritters() {
  const box = $('#critterPane');
  const c = state.climate;
  const south = !!c?.south;
  const now = new Date().getMonth() + 1;
  const nm = localMonth(now, south);
  const plants = state.garden.map((id) => byId.get(id)).filter(Boolean);
  const garden = new Map(creaturesForGarden(plants, activeGarden().features, c).filter((x) => x.level >= 2).map((x) => [x.creature.id, x.level]));
  const region = creaturesForRegion(c);
  const seen = seenSet();
  const f = state.critF;
  let list = region.filter((cr) => (!f.kind || cr.kind === f.kind || (f.kind === 'butterfly' && cr.kind === 'moth')));
  if (f.show === 'now') list = list.filter((cr) => cr.months.includes(nm));
  if (f.show === 'garden') list = list.filter((cr) => garden.has(cr.id));
  if (f.show === 'seen') list = list.filter((cr) => seen.has(cr.id));
  if (f.show === 'unseen') list = list.filter((cr) => !seen.has(cr.id));
  if (f.q) list = list.filter((cr) => cr.ja.includes(f.q) || KINDS[cr.kind].includes(f.q));
  list.sort((a, b) => (garden.get(b.id) || 0) - (garden.get(a.id) || 0) || b.base - a.base);
  const found = region.filter((cr) => seen.has(cr.id)).length;
  const pct = region.length ? Math.round((found / region.length) * 100) : 0;
  const KIND_TABS = { '': 'すべて', butterfly: '蝶・蛾', bee: '蜂・アブ', beetle: '甲虫', dragonfly: 'トンボ', hopper: 'バッタなど', bird: '野鳥', other: 'カエルほか' };
  box.innerHTML = `
    <section class="card crit-top">
      <div class="crit-progress">
        <div><span class="en">Field Guide</span><h2>庭の生き物図鑑</h2>
        <p class="hint" style="margin:2px 0 0">${state.loc ? `${esc(state.loc.name)}で` : ''}庭に来る可能性のある ${region.length}種。見つけたら「見た！」で記録しよう。</p></div>
        <div class="found"><b>${found}</b><small>/ ${region.length}種</small><span class="bar"><i style="width:${pct}%"></i></span></div>
      </div>
      <div class="chips kind-tabs">${Object.entries(KIND_TABS).map(([k, v]) => `<button type="button" class="chip${f.kind === k ? ' on' : ''}" data-ckind="${k}">${v}</button>`).join('')}</div>
      <div class="seg small crit-show">${[['all', 'すべて'], ['now', '今月'], ['garden', 'この庭に来そう'], ['seen', '見つけた'], ['unseen', 'まだ']].map(([k, v]) => `<button type="button" data-cshow="${k}" class="${f.show === k ? 'on' : ''}">${v}</button>`).join('')}</div>
      <input type="search" id="critQ" placeholder="名前で探す（例：アゲハ、トンボ）" value="${esc(f.q)}" aria-label="生き物を名前で探す">
    </section>
    <p class="count">${list.length}種</p>
    <div class="crit-list">${list.map((cr) => critterEntry(cr, { garden, south })).join('') || '<p class="empty">条件に合う生き物がいません。</p>'}</div>
    <p class="note">見られる月や地域は一般的な目安です。生き物はそっと観察し、捕まえたら元の場所に返しましょう。</p>`;
  box.querySelector('.kind-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-ckind]'); if (b) { f.kind = b.dataset.ckind; renderCritters(); } });
  box.querySelector('.crit-show').addEventListener('click', (e) => { const b = e.target.closest('[data-cshow]'); if (b) { f.show = b.dataset.cshow; renderCritters(); } });
  $('#critQ').addEventListener('change', (e) => { f.q = e.target.value.trim(); renderCritters(); });
}

/** 観察を記録するシート */
function openSaw(cid) {
  const cr = crById.get(cid);
  if (!cr) return;
  const recs = state.sightings.filter((x) => x.c === cid);
  openSheet(`${critterSVG(cid, 34)} ${esc(cr.ja)}を見た！`, `
    <div class="saw-form">
      <div class="grid2">
        <label class="field"><span class="label">日付</span><input type="date" id="sawDate" value="${todayStr()}"></label>
        <label class="field"><span class="label">数</span><select id="sawN"><option value="1">1匹（羽）</option><option value="2">2〜5</option><option value="6">6以上</option></select></label>
      </div>
      <label class="field"><span class="label">場所</span><select id="sawG">${state.gardens.map((g) => `<option value="${g.id}"${g.id === activeGarden().id ? ' selected' : ''}>${esc(g.name)}</option>`).join('')}</select></label>
      <label class="field"><span class="label">メモ（任意）</span><input type="text" id="sawMemo" maxlength="80" placeholder="例：ラベンダーで吸蜜していた"></label>
      <button type="button" class="btn primary" id="sawSave">記録する</button>
      <p class="hint">${recs.length ? `これまでに${recs.length}回記録しています。` : 'はじめての記録です。'}</p>
    </div>`);
  $('#sawSave').addEventListener('click', () => {
    const date = $('#sawDate').value || todayStr();
    state.sightings.push({ id: 's' + Date.now().toString(36), c: cid, date, g: $('#sawG').value, n: Number($('#sawN').value), memo: $('#sawMemo').value.trim().slice(0, 80) });
    saveSightings();
    closeSheet();
    toast(recs.length ? `${cr.ja}を記録しました` : `はじめて ${cr.ja} を見つけました！ 図鑑に登録しました`);
    rerenderForSightings();
  });
}
function rerenderForSightings() {
  const y = window.scrollY;
  if (state.view === 'plants') renderZukan();
  else if (state.view === 'garden') renderGarden();
  else if (state.view === 'enjoy') renderEnjoy();
  window.scrollTo({ top: y });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-saw]');
  if (a) { openSaw(a.dataset.saw); return; }
  const d = e.target.closest('[data-delsaw]');
  if (d) {
    if (!confirm('この観察記録を消しますか？')) return;
    state.sightings = state.sightings.filter((x) => x.id !== d.dataset.delsaw);
    saveSightings();
    rerenderForSightings();
    return;
  }
  const cc = e.target.closest('[data-critter]');
  if (cc) {
    const cr = crById.get(cc.dataset.critter);
    if (!cr) return;
    state.critF = { kind: '', show: 'all', q: cr.ja };
    state.zukan = 'critters';
    if (state.view === 'plants') renderZukan(); else go('plants');
    setTimeout(() => document.getElementById(`cr-${cr.id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60);
  }
});

/** マイ庭：この庭で記録した生き物 */
function gardenSeenHtml() {
  const g = activeGarden();
  const recs = state.sightings.filter((x) => x.g === g.id);
  const ids = [...new Set(recs.map((x) => x.c))];
  return `<div class="seen-box">
    <b>${icon('eye', 16)} この庭で見つけた生き物 ${ids.length}種</b>
    ${ids.length ? `<div class="critters">${ids.map((id) => `<button type="button" class="critter host" data-critter="${id}">${esc(crById.get(id)?.ja || id)}<small>${recs.filter((x) => x.c === id).length}回</small></button>`).join('')}</div>` : '<p class="hint" style="margin:4px 0 0">生き物図鑑の「見た！」で記録すると、ここに集まります。</p>'}
    <button type="button" class="link" data-zukan-critters>生き物図鑑を開く ${icon('arrow', 14)}</button>
  </div>`;
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-zukan-critters]')) { state.zukan = 'critters'; state.critF = { kind: '', show: 'garden', q: '' }; go('plants'); }
});

/** 生態系図（折りたたみ） */
function webHtml(critters, plants, features, open = false) {
  const web = foodWeb(critters, plants, features);
  if (!web.nodes.length) return '';
  return `<details class="web-details"${open ? ' open' : ''}><summary>${icon('leaf', 16)}生態系図（食べる・食べられるのつながり）</summary>
    <div class="scroll-x web-scroll">${foodWebSVG(web)}</div>
    <ul class="web-notes">${foodWebSummary(web).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    <p class="hint"><span class="lg g"></span>植物を食べる　<span class="lg r"></span>虫や動物を食べる　<span class="lg o"></span>幼虫になる</p>
  </details>`;
}

/** 収穫カレンダー */
function harvestCal(plants, south) {
  const now = new Date().getMonth() + 1;
  return `<div class="cal harvest-cal"><div></div>${MONTHS.map((m) => `<div class="h">${m}</div>`).join('')}
    ${plants.map((p) => { const on = new Set(p.harvest.map((m) => localMonth(m, south))); return `<div class="n">${esc(p.groupJa.replace(/（.*?）/g, ''))}</div>${MONTHS.map((m) => `<div class="c${m === now ? ' now' : ''}"${on.has(m) ? ' style="background:#c9a24a"' : ''}></div>`).join('')}`; }).join('')}
  </div>`;
}

/** ホーム：今日の庭のお客さん */
function visitorsHtml(mine, north, c) {
  const groups = new Set(mine.map((p) => p.group));
  const ctx = {
    month: north,
    blooming: [...new Set(mine.filter((p) => p.bloom.includes(north)).map((p) => p.groupJa.replace(/（.*?）/g, '')))],
    plants: mine, features: activeGarden().features || {}, rain: false,
    has: (id) => (id === 'grass' ? mine.some((p) => p.form === 'grass') : groups.has(id)),
  };
  const vs = visitors(ctx);
  if (!vs.length) return '';
  return `<section class="visitors">
    <header><span class="en">Garden Friends</span><h3>今日の庭のお客さん</h3></header>
    <div class="vis-row">${vs.map((v) => `<button type="button" class="visitor" data-critter="${v.friend.critter}" aria-label="${esc(v.friend.who)}を生き物図鑑で見る">
      <span class="v-art">${friendSVG(v.friend, 60)}</span>
      <span class="v-say"><b>${esc(v.friend.who)}の${esc(v.friend.name)}</b>${esc(v.line)}</span>
    </button>`).join('')}</div>
  </section>`;
}

/** 楽しむ：今月の生き物さがし */
function missionHtml(north) {
  const c = state.climate;
  const seen = seenSet();
  const plants = state.garden.map((id) => byId.get(id)).filter(Boolean);
  const likely = new Map(creaturesForGarden(plants, activeGarden().features, c).map((x) => [x.creature.id, x.score]));
  const now = creaturesForRegion(c, north).sort((a, b) => (seen.has(a.id) - seen.has(b.id)) || (likely.get(b.id) || 0) - (likely.get(a.id) || 0) || b.base - a.base).slice(0, 3);
  if (!now.length) return '';
  return `<div class="mission">
    <b>${icon('search', 16)} 今月の生き物さがし</b>
    <div class="mission-row">${now.map((cr) => `<div class="m-item${seen.has(cr.id) ? ' done' : ''}">
      <button type="button" class="m-art" data-critter="${cr.id}">${critterSVG(cr.id, 64)}</button>
      <span>${esc(cr.ja)}</span>
      ${seen.has(cr.id) ? '<small>✓ 見つけた</small>' : `<button type="button" class="btn small" data-saw="${cr.id}">見た！</button>`}
    </div>`).join('')}</div>
  </div>`;
}


// ---------- 病害虫 ----------
function regionPestCard(c) {
  const risks = regionRisks(c);
  if (!risks.length) return '';
  return `<div class="card">
    <h2>この地域で注意したい病害虫</h2>
    <p class="hint">過去10年の気温・雨・雪から、起きやすいトラブルを推定しています。タップで対策を表示。</p>
    ${risks.map(({ pest, risk }) => `<details class="pest">
      <summary>${icon(PEST_ICON[pest.kind], 17)} <b>${esc(pest.ja)}</b> <span class="risk r${risk}">${RISK_JA[risk]}</span></summary>
      <p class="d">${esc(pest.sign)}</p>
      <div class="pl"><b>予防</b><ul>${pest.prevent.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
      <div class="pl"><b>出てしまったら</b><ul>${pest.treat.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
    </details>`).join('')}
  </div>`;
}
function pestBox(p) {
  const list = pestsForPlant(p, state.climate).slice(0, 4);
  if (!list.length) return '';
  return `<details class="pest small"><summary>注意したい病害虫：${list.map(({ pest, risk }) => `${esc(pest.ja)}${risk >= 2 ? '⚠︎' : ''}`).join('・')}</summary>
    ${list.map(({ pest }) => `<div class="pl"><b>${esc(pest.ja)}</b>：${esc(pest.prevent[0])}。</div>`).join('')}
  </details>`;
}

// ---------- はじめてガイド ----------
function guideCard() {
  const steps = guideSteps({ climate: state.climate, loc: state.loc, garden: state.garden });
  const isDone = (st) => st.done === true || (st.done === null && state.guideDone[st.id]);
  const n = steps.filter(isDone).length;
  return `<details class="card guide" ${n < steps.length ? 'open' : ''}>
    <summary><h2 style="display:inline">${icon('guide', 19)} はじめての宿根草ガーデン <small>${n}/${steps.length}</small></h2></summary>
    <div class="progress"><span style="width:${(n / steps.length) * 100}%"></span></div>
    <ol class="steps">${steps.map((st) => `<li class="${isDone(st) ? 'done' : ''}">
      <label class="st">${st.done === null ? `<input type="checkbox" data-guide="${st.id}" ${isDone(st) ? 'checked' : ''}>` : `<span class="auto">${st.done ? '✓' : '・'}</span>`}<b>${esc(st.title)}</b></label>
      <ul>${st.body.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      ${st.go && !isDone(st) ? `<button type="button" class="btn small" data-go="${st.go}">開く →</button>` : ''}
    </li>`).join('')}</ol>
  </details>`;
}
document.addEventListener('change', (e) => {
  const cb = e.target.closest('[data-guide]');
  if (!cb) return;
  state.guideDone[cb.dataset.guide] = cb.checked;
  store.set('guideDone', state.guideDone);
  const open = cb.closest('details')?.open;
  renderTasks();
  if (open) document.querySelector('.guide').open = true;
});

// ---------- お店で探す・品種登録 ----------
function shopUrl(p) {
  const name = p.cv && !p.custom ? `${p.groupJa.replace(/（.*?）/g, '')} ${p.cv.replace(/（.*?）/g, '')}` : p.ja.replace(/[‘’（）()]/g, ' ');
  const q = encodeURIComponent(`${name} 苗`.trim());
  switch (state.shopSite) {
    case 'yahoo': return `https://shopping.yahoo.co.jp/search?p=${q}`;
    case 'amazon': return `https://www.amazon.co.jp/s?k=${q}`;
    case 'google': return `https://www.google.com/search?q=${encodeURIComponent(`${state.shop || ''} ${name}`.trim())}`;
    default: return `https://search.rakuten.co.jp/search/mall/${q}/`;
  }
}
function shopLabel() {
  return { rakuten: '楽天市場', yahoo: 'Yahoo!ショッピング', amazon: 'Amazon', google: state.shop || 'Google' }[state.shopSite] || '楽天市場';
}

function initCustomForm() {
  const groups = [...new Map(PLANTS.map((p) => [p.group, p.groupJa])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'ja'));
  $('#cGroup').innerHTML = groups.map(([g, ja]) => `<option value="${g}">${esc(ja)}</option>`).join('');
  $('#cColor').innerHTML = Object.entries(COLORS).map(([k, c]) => `<button type="button" class="chip" data-v="${k}"><span class="dot" style="background:${c.hex}"></span>${c.ja}</button>`).join('');
  $('#cBloom').innerHTML = MONTHS.map((m) => `<button type="button" class="chip" data-v="${m}">${m}月</button>`).join('');
  for (const id of ['#cColor', '#cBloom']) {
    $(id).addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (b) b.classList.toggle('on'); });
  }
  $('#shopName').value = state.shop;
  $('#shopSite').value = state.shopSite;
  $('#shopName').addEventListener('change', (e) => { state.shop = e.target.value.trim(); store.set('shopName', state.shop); renderPlants(true); });
  $('#shopSite').addEventListener('change', (e) => { state.shopSite = e.target.value; store.set('shopSite', state.shopSite); renderPlants(true); });
  $('#btnCustom').addEventListener('click', () => { $('#customForm').hidden = !$('#customForm').hidden; });
  $('#cCancel').addEventListener('click', () => { $('#customForm').hidden = true; });
  $('#cSave').addEventListener('click', () => {
    const cv = $('#cName').value.trim();
    if (!cv) { toast('品種名を入力してください'); return; }
    const c = {
      uid: Date.now().toString(36), group: $('#cGroup').value, cv,
      color: [...document.querySelectorAll('#cColor .chip.on')].map((b) => b.dataset.v),
      bloom: [...document.querySelectorAll('#cBloom .chip.on')].map((b) => Number(b.dataset.v)),
      h: [Number($('#cHmin').value) || 0, Number($('#cHmax').value) || 0],
      price: Number($('#cPrice').value) || 0, shop: $('#cShop').value.trim(), url: $('#cUrl').value.trim(), memo: $('#cMemo').value.trim(),
    };
    const p = addCustom(c);
    if (!p) return;
    customList.push(c);
    try { localStorage.setItem('pg:custom', JSON.stringify(customList)); } catch { /* 保存できない環境 */ }
    reindex();
    state.cvSel[p.group] = p.id;
    ['#cName', '#cHmin', '#cHmax', '#cPrice', '#cUrl', '#cMemo'].forEach((s) => { $(s).value = ''; });
    document.querySelectorAll('#cColor .chip.on, #cBloom .chip.on').forEach((b) => b.classList.remove('on'));
    $('#customForm').hidden = true;
    state.filters.q = p.groupJa.replace(/（.*?）/g, '');
    store.set('filters', state.filters);
    renderPlants();
    toast(`${p.ja} を登録しました`);
  });
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-delcustom]');
  if (!b) return;
  const id = b.dataset.delcustom;
  const p = byId.get(id);
  if (!confirm(`${p.ja} を削除しますか？`)) return;
  removeCustom(id);
  customList = customList.filter((c) => `my-${c.uid}` !== id);
  try { localStorage.setItem('pg:custom', JSON.stringify(customList)); } catch { /* 保存できない環境 */ }
  for (const g of state.gardens) g.plants = g.plants.filter((x) => x !== id);
  saveGardens();
  delete state.cvSel[p.group];
  reindex();
  renderPlants(true);
});


// ---------- 図鑑：並べ替え・一覧表示 ----------
function sortGroups(arr, sort) {
  const first = (rs) => rs[0].plant;
  const by = {
    name: (a, b) => first(a).groupJa.localeCompare(first(b).groupJa, 'ja'),
    bloom: (a, b) => (Math.min(...first(a).bloom, 13) - Math.min(...first(b).bloom, 13)) || by.name(a, b),
    height: (a, b) => first(b).h[1] - first(a).h[1],
    price: (a, b) => Math.min(...a.map((r) => r.plant.price)) - Math.min(...b.map((r) => r.plant.price)),
    family: (a, b) => first(a).family.ja.localeCompare(first(b).family.ja, 'ja') || by.name(a, b),
  };
  return by[sort] ? [...arr].sort(by[sort]) : arr;
}
function plantRow(rs) {
  const r = rs.find((x) => x.plant.id === state.cvSel[rs[0].plant.group]) || rs[0];
  const p = r.plant;
  const multi = p.cvCount > 1;
  const inG = rs.some((x) => state.garden.includes(x.plant.id));
  return `<button type="button" class="prow" data-open="${p.group}">
    ${photoHtml(p, 'mini-photo')}
    <span class="pbody">
      <span class="pname">${esc(multi ? p.groupJa : p.ja)}${inG ? ' <span class="ing">✓</span>' : ''}</span>
      <span class="psub">${esc(p.family.ja)}・${esc(p.tags.includes('veg') && p.harvest ? '野菜' : TYPE_JA[p.type] || '')}${multi ? `・${rs.length < p.cvCount ? `${rs.length}/` : ''}${p.cvCount}品種` : ''}・${p.h[0]}〜${p.h[1]}cm</span>
      ${monthBar(p, state.climate?.south)}
    </span>
    ${r.level ? `<span class="lv lv-${r.level}">${LEVEL[r.level].mark}</span>` : ''}
  </button>`;
}
document.addEventListener('click', (e) => {
  const o = e.target.closest('[data-open]');
  if (o) {
    state.openCards.add(o.dataset.open);
    const rs = state.groupResults?.get(o.dataset.open);
    if (rs) { o.outerHTML = plantCard(rs); hydratePhotos($(`[data-card="${o.dataset.open}"]`), [rs[0].plant]); }
    return;
  }
  const c = e.target.closest('[data-close]');
  if (c) {
    state.openCards.delete(c.dataset.close);
    const rs = state.groupResults?.get(c.dataset.close);
    const card = $(`[data-card="${c.dataset.close}"]`);
    if (rs && card) card.outerHTML = plantRow(rs);
    return;
  }
  const u = e.target.closest('[data-use]');
  if (u && state.view === 'plants') {
    state.filters.use = u.dataset.use;
    saveFilters();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// ---------- 楽しむ ----------
let tipIndex = Math.floor(Math.random() * 1000);
function allTips() {
  const mine = state.garden.map((id) => byId.get(id)).filter(Boolean);
  const src = (mine.some((p) => p.tips.length) ? mine : PLANTS);
  const seen = new Set();
  const out = [];
  for (const p of src) for (const t of p.tips) if (!seen.has(t)) { seen.add(t); out.push({ t, p }); }
  return out;
}
function heroScene(plants, month, south) {
  // 庭の植物（なければ代表的な宿根草）で季節の情景を描く
  const base = plants.length ? plants : ['miscanthus', 'echinacea', 'salvia-nemorosa', 'sedum', 'hakonechloa', 'aster', 'rudbeckia', 'panicum', 'gaura']
    .map((id) => byId.get(id)).filter(Boolean);
  const list = [...base].sort((a, b) => b.h[1] - a.h[1]).slice(0, 10);
  const W = 5;
  const yOf = (p) => ({ back: 0.82, middle: 0.5, front: 0.18 }[heightClass(p)]);
  const species = list.map((p, i) => ({
    plant: p, color: p.color[0],
    positions: [0, 1].map((k) => ({ x: ((i * 0.618 + k * 0.5) % 1) * W * 0.92 + W * 0.04, y: Math.min(0.95, Math.max(0.05, yOf(p) + (k ? 0.08 : -0.06))) })),
  }));
  const nm = localMonth(month, south);
  const winter = nm === 12 || nm <= 2;
  const extra = `<circle cx="560" cy="62" r="30" fill="${winter ? '#f4efe0' : '#f6d27a'}" opacity=".75" filter="url(#wc)"/>
    <path d="M90,60 q8,-7 16,0 q8,-7 16,0 M140,40 q6,-5 12,0 q6,-5 12,0" fill="none" stroke="#3b4a33" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>`;
  return elevationSVG({ width: W, depth: 1, view: 'border', species }, month, south, { label: false, height: 300, extra });
}

/** 読み取ったキーワードから、プランの題名を自然な言葉で */
function planTitle(words, style = '') {
  if (words.includes('ホワイトガーデン')) return 'ホワイトガーデン';
  if (style === 'potager') return words.includes('ハーブ') ? 'ハーブと野菜のポタジェ' : words.some((w) => ['白', '青', '紫', 'ピンク', '赤', '黄', 'オレンジ', 'カラフル', 'パステル'].includes(w)) ? '花で彩るポタジェ' : '摘んで味わうポタジェ';
  const COLOR = ['白', '青', '紫', 'ピンク', '赤', '黄', 'オレンジ'];
  const DESC = {
    '蝶・蜂': '蝶が舞う', 香り: '香りに包まれる', 長く咲く: '長く咲き続ける', 手間いらず: '手間いらずの', 冬も緑: '冬も緑の',
    パステル: 'パステルカラーの', カラフル: 'カラフルな', シック: 'シックな', 涼しげ: '涼しげな', 暖色: 'あたたかな色の',
    銀葉: '銀葉の', 銅葉: '銅葉の', カラーリーフ: '葉色を楽しむ', ボリューム: 'ボリュームのある', コンパクト: '小さな',
    春: '春の', 初夏: '初夏の', 夏: '夏の', 秋: '秋の', 冬: '冬の',
    ナチュラル: 'ナチュラルな', イングリッシュ: 'イングリッシュ風の', 和風: '和の', プレーリー: '草原のような',
    ドライガーデン: '乾いた砂利の', シェード: '木陰の', 低予算: '',
    ハーブ: 'ハーブの', 薬草: '薬草の', 在来種: '野の花の', 野菜: '野菜も育つ',
  };
  const colors = words.filter((w) => COLOR.includes(w));
  const STYLE = ['ナチュラル', 'イングリッシュ', '和風', 'プレーリー', 'ドライガーデン', 'シェード'];
  const descs = [...words.filter((w) => DESC[w] && !STYLE.includes(w)), ...words.filter((w) => STYLE.includes(w))].map((w) => DESC[w]).slice(0, 2);
  if (!colors.length && !descs.length) return 'あなたの庭のプラン';
  return `${colors.length ? colors.join('と') + 'の' : ''}${descs.join('')}庭`;
}

function secHead(en, ja, lead = '') {
  return `<header class="sec"><span class="en">${en}</span><h2>${ja}</h2>${lead ? `<p class="lead">${lead}</p>` : ''}</header>`;
}

function renderEnjoy() {
  const box = $('#enjoyBox');
  const c = state.climate;
  const south = !!c?.south;
  const now = new Date().getMonth() + 1;
  const north = localMonth(now, south);
  const mine = state.garden.map((id) => byId.get(id)).filter(Boolean);
  const blooming = mine.filter((p) => p.bloom.includes(north));
  const ideas = ideasFor(north);
  const tips = allTips();
  const tip = tips.length ? tips[tipIndex % tips.length] : null;
  const recipeIds = [...new Set(ideas.map((i) => i.recipe).filter(Boolean))];
  const sekki = sekkiOf();
  const examples = (need) => {
    const m = plantsForNeed(need, mine);
    if (m.length) return `<p class="mine">あなたの庭では — ${[...new Set(m.map((p) => p.groupJa))].slice(0, 5).map(esc).join('、')}</p>`;
    const any = [...new Map(plantsForNeed(need, PLANTS).map((p) => [p.group, p.groupJa])).values()].slice(0, 5);
    return any.length ? `<p class="mine muted">向いている植物 — ${any.map(esc).join('、')}</p>` : '';
  };
  const recipeCard = (id, open = false) => {
    const r = RECIPES[id];
    return `<details class="rcard" ${open ? 'open' : ''}>
      <summary><div class="art-box">${art(ART_BY_RECIPE[id])}</div><div class="rhead"><span class="en">Recipe</span><h3>${esc(r.title)}</h3>${examples(r.need)}</div></summary>
      <ol class="steps-num">${r.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      <div class="rnote">${r.tips.map((x) => `<p>${esc(x)}</p>`).join('')}</div>
    </details>`;
  };

  box.innerHTML = `
    <section class="hero">
      <div class="hero-art">${heroScene(mine, now, south)}</div>
      <div class="hero-text">
        <span class="kicker">${SEASON_EN[north - 1]} · ${MONTH_OLD[now - 1]}</span>
        <h1>${now}月の庭を楽しむ</h1>
        ${south ? '' : `<p class="sekki"><b>${sekki.name}</b>　${esc(sekki.text)}</p>`}
      </div>
    </section>

    ${blooming.length ? `<section class="mag">
      ${secHead('In Bloom', 'いま見頃の花')}
      <div class="bloom-row">${blooming.map((p) => `<figure class="bloom-item">${photoHtml(p, 'round-photo')}<figcaption>${esc(p.cv || p.groupJa)}</figcaption></figure>`).join('')}</div>
    </section>` : ''}

    <section class="mag">
      ${secHead('This Month', '今月の楽しみ', '季節の移ろいとともに、庭からはじまる小さな楽しみを。')}
      <div class="carousel">${ideas.map((i, k) => `<article class="idea-card">
        <div class="art-box">${art(ART_BY_ICON[i.icon])}</div>
        <div class="ibody"><span class="num">No.${String(k + 1).padStart(2, '0')}</span><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p>${i.need ? examples(i.need) : ''}</div>
      </article>`).join('')}</div>
    </section>

    <section class="mag">
      ${secHead('Wildlife', '季節の生き物', `${state.loc ? esc(state.loc.name) + 'で' : ''}庭に来る可能性のある生き物。植物図鑑で、どの植物に来るかも確かめられます。`)}
      <div class="row region-row"><label class="inline">月 <select id="regionMonth">${MONTHS.map((m) => `<option value="${m}"${m === now ? ' selected' : ''}>${m}月</option>`).join('')}</select></label></div>
      ${missionHtml(north)}
      <div id="regionList">${regionHtml(c, now, south)}</div>
    </section>

    ${tip ? `<section class="mag quote">
      <div class="quote-bird">${tsupi('happy', 68)}</div>
      <span class="en">Tsupi's Garden Notes</span>
      <blockquote>${esc(tip.t)}</blockquote>
      <p class="who">— ${esc(tip.p.groupJa)}</p>
      <button type="button" class="btn small ghost" id="nextTip">次の豆知識 →</button>
    </section>` : ''}

    ${recipeIds.length ? `<section class="mag">${secHead('Recipes for Living', '今月の暮らしのレシピ')}${recipeIds.map((id) => recipeCard(id, true)).join('')}</section>` : ''}

    <section class="mag">
      ${secHead('Library', '暮らしのレシピ集', '宿根草の庭から広がる、自然と季節を味わう暮らしのアイデア。')}
      ${Object.keys(RECIPES).filter((id) => !recipeIds.includes(id)).map((id) => recipeCard(id)).join('')}
    </section>

    <section class="mag">
      ${secHead('Calendar', '一年の楽しみ')}
      <ol class="year">${MONTHS.map((m) => {
        const list = ideasFor(localMonth(m, south));
        return `<li class="${m === now ? 'cur' : ''}"><span class="m">${m}</span><span class="old">${MONTH_OLD[m - 1]}</span><span class="what">${list.map((i) => esc(i.title)).join(' ／ ') || '—'}</span></li>`;
      }).join('')}</ol>
    </section>`;
  $('#nextTip')?.addEventListener('click', () => { tipIndex++; renderEnjoy(); });
  $('#regionMonth').addEventListener('change', (e) => { $('#regionList').innerHTML = regionHtml(c, Number(e.target.value), south); });
  hydratePhotos(box, blooming);
}

// ---------- 庭ノート（写真付きの記録） ----------
let diaryCache = [];
/** 記録を読み込む（古い形式のノートも同じ形に揃える） */
async function loadDiary() {
  const list = await listNotes();
  diaryCache = list.map((n) => ({ ...n, plants: n.plants || (n.plant ? [n.plant] : []), events: n.events || [] }));
  return diaryCache;
}
const nameOfPlant = (id) => byId.get(id)?.ja || '（図鑑にない植物）';
const dateJa = (s) => { const d = new Date(s + 'T00:00:00'); return `${d.getFullYear() === new Date().getFullYear() ? '' : `${d.getFullYear()}年`}${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`; };
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function entryHtml(n) {
  return `<div class="entry">
    ${n.photo ? `<img src="${n.photo}" alt="" loading="lazy">` : ''}
    <div class="eb">
      <div class="ewho">${n.plants.length ? n.plants.map((id) => esc(nameOfPlant(id))).join('、') : '庭全体'}${n.garden && state.gardens.length > 1 ? `<small>${esc(n.garden)}</small>` : ''}</div>
      ${n.events.length ? `<div class="echips">${n.events.map((ev) => (EVENTS[ev] ? `<span class="ev ev-${EVENTS[ev].group}">${EVENTS[ev].ja}</span>` : '')).join('')}</div>` : ''}
      ${n.text ? `<div class="nt">${esc(n.text)}</div>` : ''}
    </div>
    <button type="button" class="icon-btn" data-delnote="${n.id}" aria-label="この記録を削除">✕</button>
  </div>`;
}

async function renderJournal() {
  const box = $('#journalBox');
  const notes = await loadDiary();
  const f = state.diaryFilter;
  const list = notes.filter((n) => (!f.plant || n.plants.includes(f.plant)) && (!f.photo || n.photo));
  const plantsInNotes = [...new Set(notes.flatMap((n) => n.plants))].filter((id) => byId.has(id));
  const st = yearStats(notes, new Date().getFullYear());
  const shown = list.slice(0, state.diaryShown);
  let last = '';
  box.innerHTML = `<div class="card diary">
    <h2>${icon('note', 19)} 園芸ノート</h2>
    <p class="hint">その日の庭や植物の様子を記録しておくと、来年の同じ時期に「そろそろ咲く頃」「去年はこの頃に切り戻した」とお知らせします。</p>
    <button type="button" class="btn primary wide" data-record="">${icon('plus', 17)}今日の記録を書く</button>
    ${st.entries ? `<div class="dstats"><div><b>${st.days}</b><span>日記録</span></div><div><b>${st.bloomed}</b><span>種が開花</span></div><div><b>${st.photos}</b><span>枚の写真</span></div></div>` : ''}
    ${notes.length ? `<div class="dfilter">
      <select id="dPlant" aria-label="植物で絞り込み"><option value="">すべての記録</option>${plantsInNotes.map((id) => `<option value="${id}" ${f.plant === id ? 'selected' : ''}>${esc(nameOfPlant(id))}</option>`).join('')}</select>
      <label class="toggle"><input type="checkbox" id="dPhoto" ${f.photo ? 'checked' : ''}> 写真のみ</label>
    </div>` : ''}
    <div class="timeline">${shown.map((n) => {
      const head = n.date !== last ? `<h3 class="dday">${dateJa(n.date)}${n.weather ? `<small>${weatherIcon(n.weather.code)} ${Math.round(n.weather.tmax)}° / ${Math.round(n.weather.tmin)}°</small>` : ''}</h3>` : '';
      last = n.date;
      return head + entryHtml(n);
    }).join('') || (notes.length ? '<p class="hint">条件に合う記録がありません。</p>' : '')}</div>
    ${list.length > shown.length ? `<button type="button" class="btn more" id="dMore">さらに表示（残り${list.length - shown.length}件）</button>` : ''}
  </div>`;
  $('#dPlant')?.addEventListener('change', (e) => { f.plant = e.target.value; renderJournal(); });
  $('#dPhoto')?.addEventListener('change', (e) => { f.photo = e.target.checked; renderJournal(); });
  $('#dMore')?.addEventListener('click', () => { state.diaryShown += 30; renderJournal(); });
}
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-delnote]');
  if (!b || !confirm('この記録を削除しますか？')) return;
  await deleteNote(b.dataset.delnote);
  await loadDiary();
  render();
});

// ---------- 下から出るシート（記録・チャット共通） ----------
function openSheet(title, html, cls = '') {
  $('#sheetTitle').innerHTML = title;
  $('#sheetBody').innerHTML = html;
  $('#sheet').className = `sheet ${cls}`;
  $('#sheet').hidden = false;
  $('#sheetBack').hidden = false;
  document.body.classList.add('sheet-open');
}
function closeSheet() {
  $('#sheet').hidden = true;
  $('#sheetBack').hidden = true;
  document.body.classList.remove('sheet-open');
}
$('#sheetClose').addEventListener('click', closeSheet);
$('#sheetBack').addEventListener('click', closeSheet);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

// ---------- 記録を書く ----------
function openRecord(plantId = '') {
  const g = activeGarden();
  const mine = g.plants.map((id) => byId.get(id)).filter(Boolean);
  const groups = Object.entries(EVENT_GROUPS).map(([gk, gja]) => `<div class="evgroup"><span class="label">${gja}</span><div class="chips">${Object.entries(EVENTS).filter(([, v]) => v.group === gk).map(([k, v]) => `<button type="button" class="chip ev-pick" data-ev="${k}">${v.ja}</button>`).join('')}</div></div>`).join('');
  openSheet(`${icon('note', 19)} 記録を書く`, `
    <div class="rec">
      <div class="rec-top"><input type="date" id="rDate" value="${todayStr()}" max="${todayStr()}" aria-label="日付">${state.gardens.length > 1 ? `<span class="rec-garden">${icon('pot', 15)}${esc(g.name)}</span>` : ''}</div>
      <span class="label">どこの記録？（複数選べます）</span>
      <div class="chips who">
        <button type="button" class="chip who-pick ${plantId ? '' : 'on'}" data-who="">庭全体</button>
        ${mine.map((p) => `<button type="button" class="chip who-pick ${p.id === plantId ? 'on' : ''}" data-who="${p.id}"><span class="dot" style="background:${COLORS[p.color[0]].hex}"></span>${esc(p.cv && !p.custom ? `${p.groupJa.replace(/（.*?）/g, '')}・${p.cv}` : p.ja)}</button>`).join('')}
      </div>
      ${mine.length ? '' : '<p class="hint">マイ庭に植物を追加すると、植物ごとの記録ができます。</p>'}
      <span class="label" style="margin-top:12px">できごと（タップで選ぶ）</span>
      ${groups}
      <label class="field" style="margin-top:12px"><span class="label">メモ</span><textarea id="rText" rows="2" maxlength="2000" placeholder="気づいたこと、様子など"></textarea></label>
      <label class="btn photo-btn">${icon('plus', 16)}<span id="rPhotoLabel">写真を添える</span><input type="file" id="rPhoto" accept="image/*" hidden></label>
      <button type="button" class="btn primary wide" id="rSave">保存する</button>
    </div>`, 'sheet-record');
  const body = $('#sheetBody');
  body.onclick = (e) => {
    const w = e.target.closest('.who-pick');
    if (w) {
      if (w.dataset.who === '') { body.querySelectorAll('.who-pick').forEach((x) => x.classList.toggle('on', x === w)); }
      else { w.classList.toggle('on'); body.querySelector('.who-pick[data-who=""]').classList.toggle('on', !body.querySelector('.who-pick.on:not([data-who=""])')); }
      return;
    }
    const ev = e.target.closest('.ev-pick');
    if (ev) ev.classList.toggle('on');
  };
  $('#rPhoto').addEventListener('change', (e) => { $('#rPhotoLabel').textContent = e.target.files[0] ? '写真を選びました' : '写真を添える'; });
  $('#rSave').addEventListener('click', async () => {
    const plants = [...body.querySelectorAll('.who-pick.on')].map((x) => x.dataset.who).filter(Boolean);
    const events = [...body.querySelectorAll('.ev-pick.on')].map((x) => x.dataset.ev);
    const text = $('#rText').value.trim();
    const file = $('#rPhoto').files[0];
    if (!events.length && !text && !file) { toast('できごと・メモ・写真のどれかを入れてください'); return; }
    let photo = null;
    try { if (file) photo = await shrinkImage(file); } catch (err) { toast(err.message); return; }
    const date = $('#rDate').value || todayStr();
    // 今日の記録には、その日の天気を添える
    let weather = null;
    const days = date === todayStr() ? await getForecast() : null;
    const d0 = days?.find((d) => d.date === date);
    if (d0) weather = { code: d0.code, tmax: d0.tmax, tmin: d0.tmin, rain: d0.rain };
    await saveNote({ id: Date.now().toString(36), date, plants, events, text, photo, weather, garden: g.name, gardenId: g.id });
    // 「植え付け」を記録した植物は「植えた」にする
    if (events.includes('plant')) { plants.forEach((id) => { g.have[id] = true; }); saveGardens(); }
    await loadDiary();
    closeSheet();
    toast('記録しました');
    render();
  });
}
document.addEventListener('click', (e) => {
  const r = e.target.closest('[data-record]');
  if (r) openRecord(r.dataset.record || '');
});
$('#fabRecord').addEventListener('click', () => openRecord(''));
$('#gardenTabs').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) { state.gardenTab = b.dataset.v; render(); }
});
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-gotab]');
  if (b) { state.gardenTab = b.dataset.gotab; go('garden'); }
});

// ---------- ツピに聞く ----------
const chatLog = [];
function chatContext() {
  const g = activeGarden();
  let forecast = null;
  try { const k = state.loc && `pg:wx:${state.loc.lat.toFixed(2)},${state.loc.lon.toFixed(2)}`; forecast = k ? JSON.parse(sessionStorage.getItem(k) || 'null')?.d ?? null : null; } catch { forecast = null; }
  return { climate: state.climate, locName: state.loc?.name, garden: g, plants: g.plants.map((id) => byId.get(id)).filter(Boolean), entries: diaryCache, forecast, now: new Date() };
}
function chatHtml() {
  return `<div class="chat-log" id="chatLog">${chatLog.map((m) => (m.me
    ? `<div class="msg me"><p>${esc(m.text)}</p></div>`
    : `<div class="msg bird"><span class="av">${tsupi(m.pose || 'idle', 40)}</span><div class="mb">${m.html}${m.actions?.length ? `<div class="macts">${m.actions.map((a) => `<button type="button" class="btn small" ${a.go ? `data-chatgo="${a.go}"` : a.find ? `data-chatfind="${esc(a.find)}"` : a.consult != null ? `data-consult="${esc(a.consult)}"` : 'data-chatrecord'}>${esc(a.label)}</button>`).join('')}</div>` : ''}</div></div>`)).join('')}</div>
    <div class="chat-chips" id="chatChips">${(chatLog[chatLog.length - 1]?.chips?.length ? chatLog[chatLog.length - 1].chips : STARTERS).map((c) => `<button type="button" class="chip" data-ask="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <form class="chat-form" id="chatForm"><input id="chatInput" type="text" placeholder="例：エキナセアの切り戻しは？" autocomplete="off" aria-label="ツピへの質問"><button class="btn primary" type="submit">聞く</button></form>
    <p class="chat-note">ツピは、気候・庭の植物・ノート・天気予報をもとに、決まった話題に答えます。もっと自由に相談したいときは、答えの下の「AIに相談」から、無料のAIチャットに庭の情報ごと相談文を渡せます。</p>`;
}
function ask(text) {
  if (!text.trim()) return;
  const q = text.trim();
  chatLog.push({ me: true, text: q });
  const r = tsupiReply(q, chatContext());
  const miss = /ごめんね/.test(r.html);
  chatLog.push({
    html: r.html + (miss ? '<p>この質問は、庭の情報をつけてAIチャットに相談するのがおすすめだよ。</p>' : ''),
    chips: r.chips || [], pose: miss ? 'think' : /かもしれないね/.test(r.html) ? 'alert' : 'happy',
    actions: [...(r.actions || []), { label: miss ? 'AIに相談する（無料）' : 'AIにくわしく相談', consult: q }],
  });
  drawChat();
}
function drawChat() {
  $('#sheetBody').innerHTML = chatHtml();
  const log = $('#chatLog');
  const lastMe = log.querySelectorAll('.msg.me');
  if (lastMe.length) lastMe[lastMe.length - 1].scrollIntoView({ block: 'start' }); else log.scrollTop = 0;
  $('#chatForm').addEventListener('submit', (e) => { e.preventDefault(); ask($('#chatInput').value); });
}
async function openChat(first = '') {
  if (!diaryCache.length) await loadDiary();
  if (!chatLog.length) chatLog.push({ html: '<p>ツピだよ。庭のこと、何でも聞いてね。植物の名前を入れて聞くと、その植物のことを答えるよ。</p>', chips: STARTERS, pose: 'hello' });
  openSheet(`${tsupi('idle', 30)} ツピに聞く`, '', 'sheet-chat');
  drawChat();
  if (first) ask(first);
}

// ---------- 無料のAIチャットに相談（相談文を作って渡す。このアプリからは送信しない） ----------
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* 古いブラウザ向けの方法へ */ }
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  ta.remove();
  return ok;
}
// AIアプリのボタン。押すと相談文をコピーし、対応アプリには相談文を入れた状態で開く（アプリが入っていればアプリが開く）
const aiTexts = {};
const aiAppButtons = (src) => AI_APPS.map((a, i) => `<a class="btn small ai-app" data-ai="${i}" data-src="${src}" href="${a.url}" target="_blank" rel="noopener">${esc(a.name)}</a>`).join('')
  + (navigator.share ? `<button type="button" class="btn small" data-aishare="${src}">${icon('arrow', 15)}共有から選ぶ</button>` : '');
document.addEventListener('click', (e) => {
  const a = e.target.closest('a.ai-app');
  if (a) {
    const app = AI_APPS[Number(a.dataset.ai)];
    const t = aiTexts[a.dataset.src]?.() || '';
    const full = typeof t === 'string' ? t : t.text;
    a.href = aiLink(app, typeof t === 'string' ? t : t.url || t.text); // このクリックで開くリンクを、相談文入りに差し替える
    copyText(full).then((ok) => {
      const pre = a.href !== app.url;
      toast(pre ? `${app.name}を開きます。相談文が入っていなければ、貼り付けてください（全文コピー済み）` : ok ? `相談文をコピーしました。${app.name}で貼り付けて送ってください` : `${app.name}を開きます`);
    });
    return;
  }
  const sh = e.target.closest('[data-aishare]');
  if (sh) { const t = aiTexts[sh.dataset.aishare]?.() || ''; navigator.share({ text: typeof t === 'string' ? t : t.text }).catch(() => {}); }
});
function openConsult(question = '') {
  openSheet(`${icon('search', 19)} AIに相談する`, `
    <div class="consult">
      <p class="hint">あなたの庭の情報（気候・植物・ノート・天気）を含めた相談文を作り、スマホのAIアプリ（無料で使えるもの）に渡します。このアプリからAIに送信はせず、料金もかかりません。</p>
      <ol class="howto steps3">
        <li><b>聞きたいことを書く</b>
          <textarea id="cqText" rows="3" maxlength="600" placeholder="例：夏に枯れやすいラベンダーを、うちの庭で長持ちさせるには？">${esc(question)}</textarea>
        </li>
        <li><b>AIアプリを選ぶ</b>
          <div class="row ai-apps">${aiAppButtons('consult')}</div>
          <p class="hint" style="margin:6px 0 0">スマホにアプリが入っていれば、アプリが開きます。Claude と ChatGPT は相談文が入った状態で開くので、そのまま送信してください。Gemini や、文が入っていないときは、長押しして「ペースト」してください（ボタンを押すと相談文がコピーされます）。「共有から選ぶ」では、入っているアプリの一覧から送れます。</p>
        </li>
        <li><b>うまく開けないとき</b>
          <div class="row"><button type="button" class="btn small" id="cqCopy">相談文をコピーだけする</button></div>
        </li>
      </ol>
      <details><summary>相談文の中身を見る</summary><pre class="prompt-view" id="cqView"></pre></details>
      <p class="note">各AIアプリは無料で使える範囲があります。有料プランに申し込む必要はありません。</p>
    </div>`, 'sheet-consult');
  const build = () => consultPrompt($('#cqText').value || 'いまの庭で、気をつけることやおすすめの作業を教えてください。', chatContext());
  aiTexts.consult = () => ({ text: build(), url: consultPromptShort($('#cqText').value || 'いまの庭で、気をつけることやおすすめの作業を教えてください。', chatContext()) });
  const sync = () => { $('#cqView').textContent = build(); };
  sync();
  $('#cqText').addEventListener('input', sync);
  $('#cqCopy').addEventListener('click', async () => { toast((await copyText(build())) ? 'コピーしました。AIアプリに貼り付けてください' : 'コピーできませんでした。「相談文の中身を見る」から選んでコピーしてください'); });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-ask]');
  if (a) { if ($('#sheet').hidden || !$('#sheet').classList.contains('sheet-chat')) openChat(a.dataset.ask); else ask(a.dataset.ask); return; }
  const g = e.target.closest('[data-chatgo]');
  if (g) { closeSheet(); go(g.dataset.chatgo); return; }
  const f = e.target.closest('[data-chatfind]');
  if (f) {
    closeSheet();
    Object.assign(state.filters, { q: f.dataset.chatfind.replace(/（.*?）/g, ''), sun: '', moist: '', height: '', month: '', color: '', tag: '', family: '', type: '', use: '' });
    store.set('filters', state.filters);
    go('plants');
    return;
  }
  if (e.target.closest('[data-chatrecord]')) { closeSheet(); openRecord(''); return; }
  const c = e.target.closest('[data-consult]');
  if (c) { openConsult(c.dataset.consult); return; }
  if (e.target.closest('#brandBird') || e.target.closest('[data-openchat]')) openChat();
});

// ---------- 画像から庭を読み取る（無料のAIチャットを使う） ----------
function initImagePlan() {
  aiTexts.img = () => imagePrompt($('#imgNote').value, chatContext());
  $('#imgApps').innerHTML = aiAppButtons('img');
  $('#imgCopy').addEventListener('click', async () => {
    toast((await copyText(imagePrompt($('#imgNote').value, chatContext()))) ? '依頼文をコピーしました。AIアプリで画像と一緒に送ってください' : 'コピーできませんでした');
  });
  $('#imgGo').addEventListener('click', () => {
    const st = $('#imgStatus');
    const res = parseBedsReply($('#imgReply').value);
    st.classList.toggle('error', !!res.error);
    st.textContent = res.error || '';
    if (res.result) { state.imgResult = res.result; renderImageResult(); $('#imgResult').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  $('#imgResult').addEventListener('click', (e) => {
    const b = e.target.closest('[data-bed]');
    if (!b) return;
    const bed = state.imgResult.beds[Number(b.dataset.bed)];
    Object.assign(state.planInput, { text: bed.keywords, width: bed.width_m, depth: bed.depth_m, sun: bed.sun, moist: bed.moist === 'mid' ? '' : bed.moist, view: bed.view });
    state.planBedName = bed.name;
    $('#planText').value = bed.keywords; $('#planW').value = bed.width_m; $('#planD').value = bed.depth_m;
    syncPlanSegs(); syncPresetChips();
    makePlan(0);
  });
}
function renderImageResult() {
  const r = state.imgResult;
  const box = $('#imgResult');
  if (!r) { box.innerHTML = ''; return; }
  const MO = { dry: '乾きぎみ', mid: '普通', wet: '湿りぎみ' };
  box.innerHTML = `<div class="img-res">
    <p>${esc(r.summary)}</p>
    <p class="hint">方角：${esc(r.north)}</p>
    ${r.beds.map((b, i) => `<div class="bed">
      <h3>${esc(b.name)}</h3>
      <p class="calc">約${b.width_m}m × ${b.depth_m}m・${SUN[b.sun]}・土 ${MO[b.moist]}・${b.view === 'island' ? '四方から眺める' : '片側から眺める'}</p>
      <p>${esc(b.reason)}</p>
      <p class="hint">イメージ：${esc(b.keywords)}</p>
      <button type="button" class="btn primary small" data-bed="${i}">${icon('plan', 15)}この場所のプランをつくる</button>
    </div>`).join('')}
    ${r.cautions.length ? `<div class="alert warn"><b>現地で確かめてほしいこと</b><ul>${r.cautions.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}
    <p class="note">広さや日当たりは画像からの推定です。プランを作ったあと、幅・奥行き・日当たりを実際に合わせて直してください。</p>
  </div>`;
}

/** ホーム：記録からのお知らせ */
function insightsCard() {
  const ins = insights(diaryCache, new Date(), nameOfPlant).slice(0, 5);
  if (!ins.length) return '';
  const ICON = { trouble: 'eye', frost: 'thermo', work: 'scissors', bloom: 'leaf', memory: 'note', lesson: 'bulb' };
  return `<section class="card ins"><header class="sec"><span class="en">From Your Notes</span><h2>ノートからのお知らせ</h2></header>
    ${ins.map((i) => `<div class="ins-row t-${i.type}">${i.photo ? `<img src="${i.photo}" alt="" loading="lazy">` : `<span class="ic">${icon(ICON[i.type], 17)}</span>`}<div><b>${esc(i.title)}</b><p>${esc(i.text)}</p></div></div>`).join('')}
  </section>`;
}

// ---------- バックアップ ----------
async function renderBackup() {
  const box = $('#backupBox');
  const info = await storageInfo();
  const last = store.get('lastBackup', null);
  const days = last ? Math.floor((Date.now() - new Date(last)) / 86400000) : null;
  box.innerHTML = `<div class="card">
    <h2>${icon('save', 19)} データと表示</h2>
    <p class="hint">場所・すべての庭・プラン・登録した品種・自分の写真・庭ノートは、この端末のアプリ内に保存されています。機種変更や万一に備えて、ときどきファイルにバックアップしましょう。</p>
    <ul class="advice">
      <li>端末への永続保存：${info.persisted === true ? '有効（ブラウザが自動で消さない設定）' : info.persisted === false ? '未許可（ホーム画面に追加して使うと消えにくくなります）' : '—'}</li>
      <li>最後のバックアップ：${last ? `${esc(new Date(last).toLocaleDateString('ja-JP'))}（${days}日前）` : 'まだありません'}</li>
      ${info.usage != null ? `<li>使用容量：約${(info.usage / 1024 / 1024).toFixed(1)}MB</li>` : ''}
    </ul>
    <div class="field"><span class="label">表示テーマ</span>
      <div class="seg" id="themeSeg">${[['auto', '自動'], ['light', 'ライト'], ['dark', 'ダーク']].map(([k, v]) => `<button type="button" data-v="${k}" class="${state.theme === k ? 'on' : ''}">${v}</button>`).join('')}</div></div>
    ${days == null || days > 30 ? '<div class="alert warn">しばらくバックアップしていません。下のボタンで保存しておくと安心です。</div>' : ''}
    <div class="row" style="margin-top:10px">
      <button type="button" class="btn primary" id="bExport">バックアップを保存</button>
      <label class="btn" for="bImport">バックアップから復元</label>
      <input type="file" id="bImport" accept="application/json,.json" hidden>
    </div>
    <p class="note">iPhoneでは共有メニューから「ファイルに保存」→ iCloud Drive を選ぶと、機種変更後も復元できます。</p>
  </div>`;
  $('#themeSeg').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    state.theme = b.dataset.v;
    store.set('theme', state.theme);
    applyTheme();
    renderBackup();
  });
  $('#bExport').addEventListener('click', async () => {
    const data = await exportAll();
    const name = `garden-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const r = await saveFile(name, JSON.stringify(data));
    if (r !== 'cancel') { store.set('lastBackup', new Date().toISOString()); toast('バックアップを保存しました'); renderBackup(); }
  });
  $('#bImport').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!confirm('現在のデータをバックアップの内容で置き換えます。よろしいですか？')) return;
    try {
      await importAll(JSON.parse(await f.text()));
      toast('復元しました。再読み込みします');
      setTimeout(() => location.reload(), 800);
    } catch (err) { toast(err.message || '復元できませんでした'); }
  });
}

// ---------- 今週の天気と庭仕事 ----------
async function getForecast() {
  if (!state.loc) return null;
  const key = `pg:wx:${state.loc.lat.toFixed(2)},${state.loc.lon.toFixed(2)}`;
  try { const c = JSON.parse(sessionStorage.getItem(key) || 'null'); if (c && Date.now() - c.t < 3 * 3600e3) return c.d; } catch { /* なし */ }
  try {
    const days = await fetchForecast(state.loc.lat, state.loc.lon);
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: days })); } catch { /* 保存不可 */ }
    return days;
  } catch { return null; }
}
async function weatherCard() {
  const days = await getForecast();
  if (!days) return '';
  const month = new Date().getMonth() + 1;
  const adv = weatherAdvice(days, state.climate ? localMonth(month, state.climate.south) : month);
  return `<div class="card wx">
    <h2>${icon('cloud', 19)} 今週の天気と庭仕事</h2>
    <div class="wxrow">${days.map((d) => `<div class="wd"><span>${md(d.date).replace(/\(.\)/, '')}</span><span class="wi">${weatherIcon(d.code)}</span><b>${Math.round(d.tmax)}°</b><small>${Math.round(d.tmin)}°</small>${d.rain >= 1 ? `<small class="rn">${Math.round(d.rain)}mm</small>` : '<small>&nbsp;</small>'}</div>`).join('')}</div>
    ${adv.map((a) => `<div class="task"><div class="ic">${a.icon}</div><div><div class="t">${esc(a.title)}</div><div class="d">${esc(a.text)}</div></div></div>`).join('') || '<p class="hint">特に注意が必要な天気はありません。</p>'}
  </div>`;
}


// ---------- ホーム（今日の庭） ----------
function applyTheme() {
  if (state.theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = state.theme;
}
function fillIcons(root = document) {
  root.querySelectorAll('[data-ico]').forEach((el) => { el.innerHTML = icon(el.dataset.ico, el.closest('.tabbar') ? 23 : 17); });
}
async function renderHome() {
  const box = $('#homeBox');
  const c = state.climate;
  if (!state.loc) {
    box.innerHTML = tsupiSays('はじめまして、案内役のツピです。まずは庭の場所を教えてね。その土地の気候に合う植物を、いっしょに探そう！', 'hello');
    return;
  }
  if (!c) { box.innerHTML = tsupiSays('気象データを調べているよ。少し待っててね。', 'think'); return; }
  const now = new Date().getMonth() + 1;
  const north = localMonth(now, c.south);
  const mine = state.garden.map((id) => byId.get(id)).filter(Boolean);
  const blooming = mine.filter((p) => p.bloom.includes(north));
  const tasks = [...buildTasks(c, mine), ...pestTasks(c, mine)].filter((t) => t.month === now).slice(0, 3);
  const ideas = ideasFor(north);
  const idea = ideas[new Date().getDate() % Math.max(1, ideas.length)];
  const word = MONTHLY_WORDS[north - 1] + (mine.length ? '' : ' まずは「プラン」で、庭のイメージを作ってみない？');
  const pose = !mine.length ? 'sprout' : north === 12 || north <= 2 ? 'idle' : 'happy';
  box.innerHTML = `
    ${tsupiSays(esc(word), pose, `<div class="bubble-acts"><button type="button" class="btn small" data-openchat>${icon('search', 15)}ツピに聞く</button><button type="button" class="btn small" data-consult="">AIに相談</button><button type="button" class="btn small" data-record="">${icon('plus', 15)}今日の記録</button></div>`)}
    ${visitorsHtml(mine, north, c)}
    ${insightsCard()}
    <section class="card today">
      <header class="sec"><span class="en">Today in the Garden</span><h2>今日の庭</h2></header>
      ${gardenPicker()}
      <div id="homeWx"></div>
      <div class="today-block">
        <h3>${icon('calendar', 17)}今月の作業</h3>
        ${tasks.length ? tasks.map((t) => `<div class="mini-task"><span class="ic">${icon(TASK_ICON[t.kind] || 'leaf', 16)}</span><span>${esc(t.title)}</span></div>`).join('') : '<p class="hint">急ぎの作業はありません。庭を眺めて楽しみましょう。</p>'}
        <button type="button" class="link" data-go="tasks">作業暦を見る ${icon('arrow', 14)}</button>
      </div>
      ${blooming.length ? `<div class="today-block">
        <h3>${icon('leaf', 17)}いま見頃</h3>
        <div class="blooming">${blooming.slice(0, 8).map((p) => `<span class="chip"><span class="dot" style="background:${COLORS[p.color[0]].hex}"></span>${esc(p.cv || p.groupJa)}</span>`).join('')}</div>
      </div>` : ''}
      ${idea ? `<button type="button" class="today-idea" data-go="enjoy">
        <span class="art-box">${art(ART_BY_ICON[idea.icon])}</span>
        <span class="ti"><span class="en">This Month</span><b>${esc(idea.title)}</b><small>${esc(idea.text)}</small></span>
      </button>` : ''}
    </section>
    <div class="quick">
      <button type="button" data-go="plan">${icon('plan', 22)}<span>プラン作成</span></button>
      <button type="button" data-go="plants">${icon('book', 22)}<span>図鑑</span></button>
      <button type="button" data-gotab="diary">${icon('note', 22)}<span>園芸ノート</span></button>
      <button type="button" data-go="enjoy">${icon('cup', 22)}<span>楽しむ</span></button>
    </div>
    <header class="sec" style="margin-top:22px"><span class="en">Climate</span><h2>庭の気候</h2></header>`;
  const days = await getForecast();
  const slot = $('#homeWx');
  if (!days || !slot) return;
  const adv = weatherAdvice(days, north).sort((a, b) => b.level - a.level).slice(0, 2);
  const d0 = days[0];
  slot.innerHTML = `<div class="wx-today"><span class="wi">${weatherIcon(d0.code)}</span><span><b>今日 ${Math.round(d0.tmax)}°</b> / ${Math.round(d0.tmin)}°${d0.rain >= 1 ? `・雨 ${Math.round(d0.rain)}mm` : ''}</span></div>
    ${adv.map((a) => `<div class="wx-adv lv${a.level}"><b>${esc(a.title)}</b>${esc(a.text)}</div>`).join('')}`;
}


// ---------- 複数の庭 ----------
function gardenPicker() {
  if (state.gardens.length < 2) return '';
  return `<label class="gpick">${icon('pot', 16)}<select data-gpick aria-label="庭を選ぶ">${state.gardens.map((g) => `<option value="${g.id}" ${g.id === activeGarden().id ? 'selected' : ''}>${esc(g.name)}（${g.plants.length}）</option>`).join('')}</select></label>`;
}
function gardenBar() {
  const g = activeGarden();
  const seg = (key, opts) => `<div class="seg" data-gset="${key}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${(g[key] || '') === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  return `<div class="garden-bar">
    <div class="gtabs">${state.gardens.map((x) => `<button type="button" class="gtab ${x.id === g.id ? 'on' : ''}" data-garden="${x.id}">${esc(x.name)}<small>${x.plants.length}</small></button>`).join('')}
      <button type="button" class="gtab add" id="gardenAdd">${icon('plus', 15)}庭を追加</button></div>
    <details class="card gset">
      <summary>${icon('pot', 17)}「${esc(g.name)}」の設定<span class="sum-hint">${g.sun ? SUN[g.sun] : '日当たり未設定'}・${g.area}㎡</span></summary>
      <label class="field"><span class="label">庭の名前</span><input type="text" id="gName" value="${esc(g.name)}" maxlength="30"></label>
      <div class="field"><span class="label">日当たり</span>${seg('sun', [['', '未設定'], ['full', '日向'], ['part', '半日陰'], ['shade', '日陰']])}</div>
      <div class="field"><span class="label">土の湿り気</span>${seg('moist', [['', '未設定'], ['dry', '乾きぎみ'], ['mid', '普通'], ['wet', '湿りぎみ']])}</div>
      <label class="field"><span class="label">メモ（場所・土の様子など）</span><textarea id="gMemo" rows="2" maxlength="300">${esc(g.memo || '')}</textarea></label>
      <div class="row">
        ${g.sun || g.moist ? `<button type="button" class="btn small" id="gFind">${icon('search', 15)}この庭に合う植物を図鑑で探す</button>` : ''}
      </div>
    </details>
    <button type="button" class="link danger" id="gDelete">「${esc(g.name)}」を削除する</button>
  </div>`;
}
function switchGarden(id) {
  state.gardenId = id;
  saveGardens();
  render();
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-garden]');
  if (t) return switchGarden(t.dataset.garden);
  if (e.target.closest('#gardenAdd')) {
    const name = prompt('新しい庭の名前（例：玄関前、裏庭、ベランダ）');
    if (!name || !name.trim()) return;
    const g = { id: 'g' + Date.now().toString(36), name: name.trim().slice(0, 30), plants: [], area: 3, sun: '', moist: '', have: {} };
    state.gardens.push(g);
    return switchGarden(g.id);
  }
  if (e.target.closest('#gDelete')) {
    const g = activeGarden();
    if (!confirm(`「${g.name}」を削除しますか？\nこの庭の植物リストと設定が消えます（園芸ノートの記録は残ります）。`)) return;
    state.gardens = state.gardens.filter((x) => x.id !== g.id);
    // 最後の1つを消したときは、空の庭を1つ用意する
    if (!state.gardens.length) state.gardens.push({ id: 'g' + Date.now().toString(36), name: 'わたしの庭', plants: [], area: 3, sun: '', moist: '', have: {} });
    toast(`「${g.name}」を削除しました`);
    return switchGarden(state.gardens[0].id);
  }
  if (e.target.closest('#gFind')) {
    const g = activeGarden();
    Object.assign(state.filters, { sun: g.sun || '', moist: g.moist || '', q: '' });
    store.set('filters', state.filters);
    return go('plants');
  }
  const gs = e.target.closest('[data-gset] button');
  if (gs) {
    activeGarden()[gs.parentElement.dataset.gset] = gs.dataset.v;
    saveGardens();
    const open = gs.closest('details').open;
    renderGarden();
    if (open) $('.gset').open = true;
    return;
  }
  const h = e.target.closest('[data-have]');
  if (h) {
    const g = activeGarden();
    if (g.have[h.dataset.have]) delete g.have[h.dataset.have]; else g.have[h.dataset.have] = true;
    saveGardens();
    const y = window.scrollY;
    renderGarden();
    window.scrollTo({ top: y });
    return;
  }
  const f = e.target.closest('[data-find]');
  if (f) {
    Object.assign(state.filters, { q: f.dataset.find.replace(/（.*?）/g, ''), sun: '', moist: '', height: '', month: '', color: '', tag: '', family: '', type: '', use: '' });
    store.set('filters', state.filters);
    state.openCards.clear();
    state.zukan = 'plants';
    if (state.view === 'plants') { renderZukan(); window.scrollTo({ top: 0, behavior: 'smooth' }); } else go('plants');
  }
});
document.addEventListener('change', (e) => {
  if (e.target.matches('[data-gpick]')) return switchGarden(e.target.value);
  if (e.target.id === 'gName') {
    const v = e.target.value.trim();
    if (v) { activeGarden().name = v.slice(0, 30); saveGardens(); renderGarden(); $('.gset').open = true; }
    return;
  }
  if (e.target.id === 'gMemo') { activeGarden().memo = e.target.value; saveGardens(); }
});

/** 買い物リスト：まだ植えていない植物 */
function shoppingCard(plants) {
  const g = activeGarden();
  const want = plants.filter((p) => !g.have[p.id]);
  if (!want.length) return `<div class="card"><h2>${icon('cart', 19)}買い物リスト</h2><p class="hint" style="margin:0">すべて「植えた」になっています。</p></div>`;
  const total = want.reduce((t, p) => t + qtyFor(p, plants) * p.price, 0);
  return `<details class="card shop"><summary><h2>${icon('cart', 19)}買い物リスト</h2><span class="sum-hint">${want.length}種・約${yen(total)}</span></summary>
    <p class="hint">まだ植えていない植物です。下の一覧で「植えた」にするとここから消えます。</p>
    ${want.map((p) => `<div class="shop-row"><span class="dot" style="background:${COLORS[p.color[0]].hex}"></span><span class="sn">${esc(p.ja)}</span><span class="sq">${qtyFor(p, plants)}株・${yen(qtyFor(p, plants) * p.price)}</span><a class="btn small" href="${shopUrl(p)}" target="_blank" rel="noopener" aria-label="${esc(p.ja)}を${esc(shopLabel())}で探す">${icon('cart', 15)}</a></div>`).join('')}
  </details>`;
}

// ---------- 自分の写真 ----------
document.addEventListener('change', async (e) => {
  const inp = e.target.closest('[data-myphoto]');
  if (!inp || !inp.files[0]) return;
  try {
    const photo = await shrinkImage(inp.files[0], 1000, 0.8);
    await savePhoto(inp.dataset.myphoto, photo);
    userPhotos.set(inp.dataset.myphoto, photo);
    toast('写真を設定しました');
    render();
  } catch (err) { toast(err.message); }
});
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-delphoto]');
  if (!b) return;
  await deletePhoto(b.dataset.delphoto);
  userPhotos.delete(b.dataset.delphoto);
  render();
});

// ---------- 起動 ----------
applyTheme();
fillIcons();
$('#brandBird').innerHTML = tsupi('idle', 34);
if (state.loc) $('#locCard').open = false;
initFilters();
initPlanForm();
initImagePlan();
initCustomForm();
if (state.planInput.text || state.planInput.seed) { computePlan(); state.planMonth = state.plan.peak; }
if (state.loc) loadClimate(); else render();
go('site');
requestPersist();
try { localStorage.removeItem('pg:aikey'); } catch { /* 以前の版で保存したAPIキーがあれば消す */ }
loadDiary().then((list) => { if (list.length) render(); });
listPhotos().then((list) => { if (!list.length) return; list.forEach((x) => userPhotos.set(x.id, x.photo)); render(); });

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
