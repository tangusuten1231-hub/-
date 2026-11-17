import { PLANTS, COLORS, SUN, MOIST, TAGS, LEAF, FORMS, addCustom, removeCustom, speciesKey } from './plants.js';
import { STYLES } from './styles.js';
import { pestsForPlant, regionRisks, pestTasks, KIND_ICON, RISK_JA } from './pests.js';
import { guideSteps } from './guide.js';
import { SOC_JA } from './designer.js';
import { SYMPTOMS, diagnose } from './doctor.js';
import { horizonFn, sunReport, angleOf, sunPath, sunWindows, sunNow, lightToday, luxJa, plantFit, clockJa } from './suncheck.js';
import { INAT_GROUPS, fetchNearby, matchLocal } from './inat.js';
import { mergeLog, pastDaysNeeded, lastDays, logSummary, compareJa } from './wxlog.js';
import { seedlings, bedSoil, potLiters, potSoil, fertilizer, liquid, mulch, toICS, firstSaturday, waterAdvice } from './tools.js';
import { zoneJa, zoneRangeJa, CHILL_SRC } from './fit.js';
import { NCSU_NOTES } from './verified.js';
import { generatePlan, slotCandidates, BED_SHAPES, DENSITY, VARIETY, PRESETS, LAYER_JA, SKILLS } from './plan.js';
import { elevationSVG, planSVG, plantThumbSVG, mapColors } from './illust.js';
import { loadImages, imageOf, placeImage } from './images.js';
import { ROLES } from './roles.js';
import { potGuide, potGuideSVG } from './pots.js';
import { REGIONS, worldMapSVG, sceneSVG } from './origin.js';
import { generateBalcony, sectionSVG, frontSVG, sunChartSVG, FACING, SUN_JA as BSUN } from './balcony.js';
import { TYPE_JA, USES, FAMILY } from './meta.js';
import { ideasFor, RECIPES, plantsForNeed } from './enjoy.js';
import { icon, tsupi, tsupiSays, TASK_ICON, PEST_ICON, MONTHLY_WORDS } from './mascot.js';
import { art, ART_BY_ICON, ART_BY_RECIPE, MONTH_OLD, SEASON_EN, sekkiOf } from './art.js';
import { fetchForecast, fetchLight, weatherAdvice, weatherIcon, md } from './weather.js';
import { listNotes, saveNote, deleteNote, shrinkImage, requestPersist, storageInfo, exportAll, importAll, saveFile, listPhotos, savePhoto, deletePhoto, svgToPngBlob } from './db.js';
import { describe, companions } from './describe.js';
import { EVENTS, EVENT_GROUPS, insights, actualBloom, yearStats } from './diary.js';
import { reply as tsupiReply, STARTERS, findPlant } from './chat.js';
import { ACTIONS, parseAction, parseShortcutLog, morningURL } from './links.js';
import { consultPrompt, consultPromptShort, imagePrompt, parseBedsReply, AI_APPS, aiLink } from './handoff.js';
import { fetchDaily, fetchCoast, analyzeClimate, searchPlace, reverseGeocode, formatDoy, humidityStress } from './climate.js';
import { sunSeasons, declination } from './sun.js';
import { generateSite, siteSVG, polyEditorSVG, polygonArea, isSimple, ITEMS, BED_ITEMS, DEFAULT_ITEMS, DIR_JA } from './site.js';
import { creaturesForPlant, creaturesForGarden, biodiversity, WILD_GOALS, FEATURES } from './wildlife.js';
import { plantCritters, bioHtml, crittersHtml, featureChips, regionHtml, kindTag, monthsText } from './wildview.js';
import { CREATURES, KINDS, relation, creaturesForRegion, LEVEL_JA } from './wildlife.js';
import { INFO } from './critterinfo.js';
import { critterSVG } from './critterart.js';
import { foodWeb, foodWebSVG, foodWebSummary } from './ecoweb.js';
import { visitors, friendSVG, FRIENDS, FRIEND_EXTRA, friendLevel, FRIEND_LEVELS } from './friends.js';
import { tsupiLine } from './tsupiwords.js';
import { INGREDIENTS, MOODS, TEA_RECIPES, teaStatus, teaIngredientsFor, teaCupSVG, ingOwned } from './tea.js';
import {
  LEVEL, GRADE, findPlants, evaluate, heightClass, HEIGHT_LABEL, bloomGaps, plantsPerSqm,
  buildTasks, TASK_KIND, localMonth, plantingTime, monthsJa, scheduleSteps, relayText, fillSuggestions, coldTemp, sunHours, soilPH,
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
  filters: { sun: '', moist: '', height: '', month: '', color: '', q: '', tag: '', family: '', type: '', use: '', grade: '', sort: 'fit', view: 'list', ...store.get('filters', {}) },
  planInput: { style: 'border', ...store.get('planInput', { text: '', width: 3, depth: 1.2, view: 'border', sun: 'full', moist: '', budget: '', seed: 0 }) },
  plan: null,
  planMonth: null,
  site: null, // 庭まるごとプラン
  siteBed: null, // 庭まるごとプランの中で詳しく見ている花壇
  siteLayer: 'tour',
  zukan: 'plants', // 図鑑：植物 / 生き物
  critF: { kind: '', show: 'all', q: '' },
  region: 'japan', // 原産地モードで選んでいる地域
  enjoyTab: 'season',
  teaF: { mood: '', show: 'garden' },
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
// 旧「挑戦枠」（こだわり設定）は、園芸の腕前の「挑戦したい」へ
if (state.planInput.k?.challenge) { state.planInput.skill = state.planInput.skill || 'challenge'; delete state.planInput.k.challenge; }
document.addEventListener('change', (e) => { if (e.target.id === 'planSkill') $('#planSkillHint').textContent = SKILLS[e.target.value]?.text || ''; });

// プラン入力の既定値（古い保存データにない項目を補う）
{
  const pi = state.planInput;
  pi.mode = ['site', 'balcony'].includes(pi.mode) ? pi.mode : 'bed';
  pi.balcony = { width: 3.6, depth: 1.2, facing: 's', floor: 3, railType: 'solid', railH: 110, roof: 'yes', ceilH: 250, obstacle: 'none', shelf: 2, shelfAt: 'wall', hang: false, water: false, ...(pi.balcony || {}) };
  if (!pi.shape) pi.shape = 'rect';
  if (!pi.pick) pi.pick = 'auto';
  if (!Array.isArray(pi.presets)) pi.presets = [];
  if (!pi.swaps) pi.swaps = {};
  pi.site = { form: 'organic', shape: 'rect', width: 10, depth: 8, cut: 'right', points: [], size: 15, area: '', house: 'n', ...(pi.site || {}) };
  pi.items = Array.isArray(pi.items) ? pi.items.filter((k) => ITEMS[k]) : [...DEFAULT_ITEMS];
  pi.wild = Array.isArray(pi.wild) ? pi.wild.filter((k) => WILD_GOALS[k]) : [];
  pi.layoutSeed = Number(pi.layoutSeed) || 0;
}

const activeGarden = () => state.gardens.find((g) => g.id === state.gardenId) || state.gardens[0];
/** 庭を保存。書き込めたかを返す（容量不足・プライベートモードなどで失敗することがある） */
function saveGardens() {
  store.set('gardens', state.gardens); store.set('gardenId', activeGarden().id);
  try { return JSON.parse(localStorage.getItem('pg:gardens') || '[]').length === state.gardens.length; } catch { return false; }
}
/** 保存ボタンの違いの説明 */
function saveHelp() {
  return `<details class="save-help"><summary>${icon('guide', 14)}保存ボタンの違い</summary><ul>
    <li><b>「${esc(activeGarden().name)}」に反映</b>：いま選んでいる庭の植物を、このプランの植物に置き換えます。</li>
    <li><b>新しい庭として保存</b>：マイ庭に別の庭を追加して保存します。いまの庭はそのまま残ります。</li>
    <li><b>この案を保存して比べる</b>：マイ庭は変えずに、プランの案だけを保存します。プラン画面の「保存した案」で並べて比べられます。</li>
  </ul></details>`;
}
/** 同じ名前の庭があれば（2）（3）…を付ける */
function uniqueGardenName(base) {
  const b = String(base || '新しい庭').trim().slice(0, 26) || '新しい庭';
  let n = b, k = 2;
  while (state.gardens.some((g) => g.name === n)) n = `${b}（${k++}）`;
  return n;
}
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
  t.classList.remove('friend');
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
  setStatus(`<span class="spinner"></span>「${esc(q)}」を検索しています…（地名のデータベースに問い合わせ中。10秒ほどかかることがあります）`);
  $('#searchForm button[type=submit]')?.setAttribute('disabled', '');
  try {
    const list = await searchPlace(q);
    setStatus(list.length ? `${list.length}件見つかりました。庭の場所を選んでください。` : `「${esc(q)}」は見つかりませんでした。「旭市」のように市区町村名だけ、または「千葉県 旭市」のように区切って試してください。`, !list.length);
    ul.innerHTML = list.map((r, i) => `<li><button type="button" data-i="${i}">${esc(r.name)}</button></li>`).join('');
    ul.onclick = (ev) => {
      const b = ev.target.closest('button[data-i]');
      if (!b) return;
      ul.innerHTML = '';
      setLocation(list[Number(b.dataset.i)]);
    };
  } catch (err) {
    setStatus(esc(err.message) + '。通信状況を確かめて、もう一度お試しください。', true);
  } finally {
    $('#searchForm button[type=submit]')?.removeAttribute('disabled');
  }
});

async function setLocation(loc) {
  state.loc = loc;
  store.set('loc', loc);
  await loadClimate();
}

/** 海からの距離（潮風の注意と植物選びに使う） */
async function loadCoast() {
  if (!state.loc || !state.climate) return;
  const key = `coast:${state.loc.lat.toFixed(2)},${state.loc.lon.toFixed(2)}`;
  const c = store.get(key, undefined);
  if (c !== undefined && c !== null && typeof c === 'object') { state.climate.coastKm = c.km; return; }
  try {
    const km = await fetchCoast(state.loc.lat, state.loc.lon);
    store.set(key, { km });
    state.climate.coastKm = km;
    if (state.view === 'site') renderSite();
  } catch { /* 取得できないときは表示しない */ }
}
async function loadClimate() {
  const { lat, lon } = state.loc;
  const key = `climate:${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = store.get(key, null);
  if (cached && cached.v === 2) {
    state.climate = cached.data;
    if (state.plan) computePlan();
    setStatus('');
    $('#locCard').open = false;
    render();
    loadCoast();
    return;
  }
  // 進み具合を段階と経過秒数で表示（止まって見えないように）
  const t0 = Date.now();
  let stage = 0;
  const STAGES = ['過去10年分の気温・降水量・雪のデータを取り寄せています', '1日ごとのデータを月別に集計しています', '冬の最低気温から耐寒性ゾーンを、霜の日から植え付け時期を判定しています'];
  const show = () => setStatus(`<span class="spinner"></span><b>気候を解析中（${stage + 1}/3）</b>　${STAGES[stage]}…<br><small>経過 ${Math.round((Date.now() - t0) / 1000)}秒・ふつうは10〜30秒ほど。2回目からはすぐに表示されます。</small>`);
  show();
  const timer = setInterval(show, 1000);
  try {
    const json = await fetchDaily(lat, lon);
    stage = 1; show();
    await new Promise((r) => setTimeout(r, 30));
    const an = analyzeClimate(json.daily, lat);
    stage = 2; show();
    await new Promise((r) => setTimeout(r, 30));
    state.climate = { ...an, elevation: json.elevation };
    store.set(key, { v: 2, data: state.climate });
    if (state.plan) computePlan();
    setStatus('');
    $('#locCard').open = false;
  } catch (err) {
    setStatus(esc(err.message) + '　通信環境を確認してもう一度お試しください。', true);
  } finally {
    clearInterval(timer);
  }
  render();
  loadCoast();
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
  if (state.view === 'enjoy') {
    document.querySelectorAll('#enjoyTabs button').forEach((b) => b.classList.toggle('on', b.dataset.v === state.enjoyTab));
    $('#enjoyBox').hidden = state.enjoyTab !== 'season';
    $('#teaBox').hidden = state.enjoyTab !== 'tea';
    if (state.enjoyTab === 'tea') renderTea(); else renderEnjoy();
  }
  if (state.view === 'garden') {
    const t = state.gardenTab;
    document.querySelectorAll('#gardenTabs button').forEach((b) => b.classList.toggle('on', b.dataset.v === t));
    $('#gardenBox').hidden = t !== 'plants';
    $('#journalBox').hidden = t !== 'diary';
    $('#backupBox').hidden = t !== 'data';
    $('#sunBox').hidden = t !== 'sun';
    if (t === 'sun') renderSunSpots();
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
  if (c.coastKm != null && c.coastKm <= 4) out.push(`海から約${c.coastKm}km。潮風（塩分）で葉が傷みやすいので、ガザニア・ローズマリー・ハマナス・ツワブキ・アガパンサスなど潮風に強い植物を海側に、弱い植物は建物の陰に。台風や強風のあとは、葉についた塩分を水で洗い流しましょう。`);
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
    ? `<div class="v">ほぼなし</div><div class="s">${c.frostYears === 0 ? `過去${c.years}年、0℃以下の日はありませんでした` : `霜が降りる年は${c.years}年中${c.frostYears ?? '数'}年`}${c.lastFrostTypical ? `。降りる年は終霜 ${formatDoy(c.lastFrostTypical)}・初霜 ${formatDoy(c.firstFrostTypical) || '—'}ごろ` : ''}</div>`
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
        ${c.coastKm !== undefined ? `<div class="tile"><div class="k">海からの距離（目安）</div><div class="v">${c.coastKm == null ? '8km以上' : `約${c.coastKm}<small>km</small>`}</div><div class="s">${c.coastKm == null ? '潮風の影響は小さい' : c.coastKm <= 2 ? '潮風・塩害に注意' : c.coastKm <= 4 ? '強風の日は潮風に注意' : '台風のときは潮風に注意'}</div></div>` : ''}
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
      <p class="hint" style="margin:0">縦軸は0mmから。棒の高さは雨の量に比例します。</p>
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
  return `<svg class="chart" viewBox="0 0 ${CW} ${CH}" role="img" aria-label="月別の平均降水量（縦軸は0mmから）">
    ${axes(s, '')}<text x="${PL - 4}" y="${PT + 2}" text-anchor="end" font-size="8">mm</text>${bars}
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
  const roleCount = {};
  for (const p of PLANTS) for (const r of p.roles || []) (roleCount[r] = roleCount[r] || new Set()).add(p.group);
  $('#fRole').innerHTML = '<option value="">すべて</option>' + Object.entries(ROLES).map(([k, v]) => `<option value="${k}">${v.ja}（${roleCount[k]?.size || 0}種）</option>`).join('');
  for (const [id, key] of [['#fFamily', 'family'], ['#fType', 'type'], ['#fUse', 'use'], ['#fRole', 'role'], ['#fSort', 'sort']]) {
    $(id).addEventListener('change', (e) => { state.filters[key] = e.target.value; saveFilters(); });
  }
  $('#fView').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) { state.filters.view = b.dataset.v; saveFilters(); }
  });
  $('#fReset').addEventListener('click', () => {
    Object.assign(state.filters, { sun: '', moist: '', height: '', month: '', color: '', q: '', tag: '', family: '', type: '', use: '', role: '', origin: '', grade: '' });
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
  $('#fGrade').addEventListener('change', (e) => { f.grade = e.target.value; saveFilters(); });
  $('#gradeHelp').innerHTML = [6, 5, 4, 3, 2, 1].map((g) => `<li><span class="gr gr-${g}">${GRADE[g].ja}</span>${esc(GRADE[g].note)}</li>`).join('')
    + '<li class="gh-src">場所の気象データ（耐寒ゾーン・ヒートゾーン・熱帯夜・いちばん寒い月の気温）と、図鑑の植物ごとの値（耐寒ゾーン・ヒートゾーン・蒸れへの強さ・冬の低温の必要・手間いらず）で決めています。</li>';
}
/** 育てやすさの絞り込みの選択肢（件数つき）。byGrade：段階 → その段階の品種がある種（group）の集合 */
const GRADE_OPTS = [['', 'すべて'], ['ge5', 'よく育つ以上（簡単に育つ・よく育つ）'], ['ge4', '育つ以上'], ['6'], ['5'], ['4'], ['3'], ['2'], ['1']];
function gradeOptions(byGrade) {
  const n = (v) => { if (!byGrade) return ''; const m = String(v).match(/^(ge)?(\d)$/); if (!m) return ''; const u = new Set(); for (const [g, set] of Object.entries(byGrade)) if (m[1] ? +g >= +m[2] : +g === +m[2]) set.forEach((x) => u.add(x)); return `（${u.size}種）`; };
  return GRADE_OPTS.map(([v, ja]) => `<option value="${v}">${ja || GRADE[v].ja}${n(v)}</option>`).join('');
}
/** プランの腕前と、選ばれた植物の育てやすさの内訳 */
function skillSummary(skillId, grades) {
  const sk = SKILLS[skillId] || SKILLS.standard;
  const cnt = {};
  for (const g of grades) if (g) cnt[g] = (cnt[g] || 0) + 1;
  const rows = [6, 5, 4, 3, 2, 1].filter((g) => cnt[g]);
  return `<div class="skill-sum"><p><b>園芸の腕前：${esc(sk.ja)}</b><small>${esc(sk.text)}</small></p>
    <div class="gg-bar" aria-hidden="true">${rows.map((g) => `<span class="gr-${g}" style="flex:${cnt[g]}"></span>`).join('')}</div>
    <p class="gg-legend">${rows.map((g) => `<span class="lv gr gr-${g}">${GRADE[g].ja} ${cnt[g]}種</span>`).join('')}</p></div>`;
}
const gradeBadge = (r, short = false) => (r.grade ? `<span class="lv gr gr-${r.grade}" title="${esc(GRADE[r.grade].note)}">${GRADE[r.grade].mark} ${short && r.grade === 2 ? '工夫が必要' : GRADE[r.grade].ja}</span>` : '');
function saveFilters() { store.set('filters', state.filters); renderPlants(); }

const noBloomJa = (p) => (p.harvest?.length ? '花は観賞対象外（収穫を楽しむ）' : '花は観賞対象外（葉を楽しむ）');
function monthBar(p, south) {
  if (!p.bloom.length) return `<p class="no-bloom">${icon('leaf', 13)}${noBloomJa(p)}</p>`;
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
  const lv = gradeBadge(r);
  const chips = multi ? `<div class="cv-row">
      <span class="label" style="margin:0">品種 ${rs.length < p.cvCount ? `（条件に合う ${rs.length}/${p.cvCount}）` : `（${p.cvCount}）`}</span>
      <div class="chips">${rs.map((x) => `<button type="button" class="chip cv${x.plant.id === p.id ? ' on' : ''}" data-cv="${x.plant.id}" data-group="${group}"><span class="dot" style="background:${COLORS[x.plant.color[0]].hex}"></span>${esc(x.plant.cv)}${x.grade && x.grade < 5 ? ` <small>${GRADE[x.grade].mark}</small>` : ''}${state.garden.includes(x.plant.id) ? ' ✓' : ''}</button>`).join('')}</div>
    </div>` : '';
  return `<article class="plant" data-card="${group}">
    ${photoHtml(p)}
    <div class="top">
      <div>
        <div class="name">${esc(multi ? p.groupJa : p.ja)}</div>
        ${multi ? `<div class="cvname">${esc(p.ja)}</div>` : ''}
        <div class="latin">${esc(p.latin)}</div>
        ${p.aka?.length ? `<div class="aka">別名・通称：${p.aka.map(esc).join('、')}</div>` : ''}
        <div class="dots">${p.color.map((c) => `<span class="dot" title="${COLORS[c].ja}" style="background:${COLORS[c].hex}"></span>`).join('')}</div>
      </div>
      ${lv}
    </div>
    ${chips}
    <div class="famline">${esc(p.family.ja)}・${esc(p.tags.includes('veg') && p.harvest ? (p.type === 'annual' ? '野菜' : '野菜（多年草）') : TYPE_JA[p.type] || '')}${p.tags.includes('native') ? '・日本の在来種' : ''}${p.tags.includes('herb') ? '・ハーブ' : ''}</div>
    ${p.soc ? `<p class="soc-line">${icon('leaf', 14)}植え方の目安：<b>${esc(SOC_JA[p.soc])}</b></p>` : ''}
    <div class="rolerow">${(p.roles || []).map((k) => `<button type="button" class="role-chip" data-role="${k}" title="${esc(ROLES[k].text)}">${esc(ROLES[k].ja)}</button>`).join('')}${(p.origin || []).map((o) => `<button type="button" class="origin-chip" data-region="${o}">${icon('pin', 13)}${esc(REGIONS[o].ja)}</button>`).join('')}</div>
    ${r.level ? `<ul class="reasons">${r.reasons.map((t) => (t.startsWith('工夫：') ? `<li class="tip"><b>工夫</b>${esc(t.slice(3))}</li>` : `<li>${esc(t)}</li>`)).join('')}</ul>` : ''}
    ${monthBar(p, south)}
    <div class="meta">
      <span>草丈 ${p.h[0]}〜${p.h[1]}cm</span>
      <span>${p.sun.map((s) => SUN[s]).join('・')}</span>
      <span>土：${p.moist.map((m) => MOIST[m]).join('・')}</span>
      <span>${p.type === 'annual' ? (p.sow === 'cool' ? '涼しい季節に育つ' : '暖かい季節に育つ') : `耐寒ゾーン ${zoneRangeJa(p.zone)}`}</span>
      <span>蒸れ ${{ weak: '弱い', normal: '普通', strong: '強い' }[p.fit.heatHumidityTolerance] || '—'}${p.fit.humidVerified ? '' : '（目安）'}</span>
      <span>${FORMS[p.form].ja}</span>
      <span>${LEAF[p.leaf].ja}</span>
      <span>株間 ${p.spread}cm</span>
      <span class="price">${yen(p.price)}／${p.type === 'bulb' && p.price <= 300 ? '球' : '株'}</span>
    </div>
    ${timingHtml(p)}
    <div class="tagrow">${p.tags.map((t) => `<span class="tag">${TAGS[t]}</span>`).join('')}</div>
    <p class="note-p lead-note">${esc(p.note)}</p>
    <div class="row plant-acts"><button type="button" class="btn small" data-doctor="${p.id}">${icon('search', 14)}調子が悪いときは</button></div>
    <div class="desc">${describe(p).map((d) => `<h4>${d.h}</h4><p>${esc(d.t)}</p>`).join('')}
      <h4>相性のよい植物</h4><div class="comp">${companions(p).map((q) => `<button type="button" class="chip" data-find="${esc(q.groupJa)}"><span class="dot" style="background:${COLORS[q.color[0]].hex}"></span>${esc(q.groupJa)}</button>`).join('')}</div>
      ${plantCritters(creaturesForPlant(p, state.climate))}
    </div>
    ${p.uses?.length ? `<div class="uses">${p.uses.map((u) => `<span class="use" data-use="${u}">${USES[u].icon} ${USES[u].ja}</span>`).join('')}</div>` : ''}
    ${p.tags.includes('veg') && p.harvest?.length ? `<p class="note-p annual-note veg-note">${icon('basket', 15)}野菜：収穫は${monthsText(p.harvest, south)}ごろ。${p.type === 'annual' ? '種まき・植え付けの時期は作業暦に表示されます。' : '植えたら何年も収穫できます。'}</p>`
      : p.type === 'annual' ? `<p class="note-p annual-note">${icon('sprout', 15)}一年草・二年草：毎年の種まき、またはこぼれ種で更新します。</p>` : ''}
    ${p.tags.includes('medicinal') ? `<p class="note-p med-note">${icon('guide', 15)}薬用として知られる植物です。体質や服薬によっては害になることがあります。利用する前に医師・薬剤師に相談し、自己判断で病気の治療に使わないでください。</p>` : ''}
    ${p.tips?.length ? `<div class="tipbox">${p.tips.map((t) => `<p>${icon('bulb', 15)}${esc(t)}</p>`).join('')}</div>` : ''}
    ${teaLinks(p)}
    ${pestBox(p)}
    ${potBox(p)}
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
  $('#fRole').value = f.role || '';
  $('#fSort').value = f.sort || 'fit';
  document.querySelectorAll('#fView button').forEach((b) => b.classList.toggle('on', b.dataset.v === (f.view || 'list')));
  if ($('#fQ').value !== (f.q || '')) $('#fQ').value = f.q || '';
  if (!keepPage) state.shown = PAGE;

  const all = findPlants(state.climate, f);
  // 育てやすさの選択肢：ほかの条件で絞り込んだうえでの、段階ごとの種の数
  const fg = $('#fGrade');
  $('#fGradeBox').hidden = !state.climate;
  if (state.climate) {
    const byGrade = {};
    for (const r of findPlants(state.climate, { ...f, grade: '' })) (byGrade[r.grade] = byGrade[r.grade] || new Set()).add(r.plant.group);
    fg.innerHTML = gradeOptions(byGrade);
    fg.value = f.grade || '';
  }
  // 「工夫が必要」「育てられない」は、表示を選んだときか、育てやすさでその段階を選んだときだけ表示
  const pickedLow = /^[12]$/.test(f.grade || '');
  const list = state.showHard || pickedLow ? all : all.filter((r) => r.level !== 1);
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
    + `${arr.length}種・${list.length}品種${f.grade ? `・育てやすさ「${f.grade.startsWith('ge') ? GRADE_OPTS.find((o) => o[0] === f.grade)[1].replace(/（.*）/, '') : GRADE[f.grade].ja}」` : ''}${hiddenGroups > 0 ? `（工夫が必要・育てられない${hiddenGroups}種を非表示）` : ''}${f.role ? `・役割「${ROLES[f.role].ja}」で絞り込み中` : ''}`;
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
/** マイ庭の植物の、この地域での育てやすさ（6段階）のまとめ */
function gardenGradeCard(plants, c) {
  const by = {};
  for (const p of plants) { const r = evaluate(p, c); (by[r.grade] = by[r.grade] || []).push({ p, r }); }
  const rows = [6, 5, 4, 3, 2, 1].filter((g) => by[g]);
  const hard = (by[2] || []).length + (by[1] || []).length;
  return `<div class="card grade-card">
    <h2>${icon('leaf', 19)} この地域での育てやすさ</h2>
    <p class="hint">${plants.length}種のうち、よく育つ以上 ${(by[6] || []).length + (by[5] || []).length}種${hard ? `・工夫が必要か育てられない ${hard}種` : ''}。植物名をタップすると、下の一覧の場所へ移動します。</p>
    <div class="gg-bar" aria-hidden="true">${rows.map((g) => `<span class="gr-${g}" style="flex:${by[g].length}"></span>`).join('')}</div>
    ${rows.map((g) => `<div class="gg-row"><span class="lv gr gr-${g}">${GRADE[g].mark} ${GRADE[g].ja}</span><div class="gg-list">${by[g].map(({ p }) => `<button type="button" class="chip" data-jump="gp-${p.id}">${esc(p.ja)}</button>`).join('')}</div></div>`).join('')}
  </div>`;
}
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
      return `<div class="n jumpable" title="${esc(p.ja)}" data-jump="gp-${p.id}" role="button">${esc(p.ja)}${p.bloom.length ? '' : '<small class="nb">葉を楽しむ</small>'}</div>${MONTHS.map((m) => `<div class="c${m === now ? ' now' : ''}"${on.has(m) ? ` style="background:${col}"` : ''} title="${m}月${on.has(m) ? '：開花' : ''}${act?.has(m) ? '（ノートに開花の記録あり）' : ''}">${act?.has(m) ? '<i class="act"></i>' : ''}</div>`).join('')}`;
    }).join('')}
    <div class="n" style="color:var(--muted);font-size:.72rem">咲いている種類</div>${counts.map((n) => `<div class="sum${n ? '' : ' zero'}">${n}</div>`).join('')}
  </div>`;

  const gapHtml = gaps.length
    ? gaps.map((g) => `<div class="gap"><strong>${g.month}月</strong> は咲いている花がありません。${g.suggestions.length ? 'おすすめ：' : ''}
        <div class="sugg">${g.suggestions.map((s) => `<button type="button" class="chip" data-toggle="${s.plant.id}"><span class="dot" style="background:${COLORS[s.plant.color[0]].hex}"></span>＋ ${esc(s.plant.ja)}${s.level ? ` ${LEVEL[s.level].mark}` : ''}</button>`).join('')}</div></div>`).join('')
    : (() => { const r = relayText(counts); const sg = r.zero.length ? fillSuggestions(r.zero, c, south, new Set(plants.map((p) => p.id))) : []; return `<p class="hint">${esc(r.text)}</p>${sg.length ? `<div class="gap">${monthsJa(r.zero)}に咲く植物を加えるなら：<div class="sugg">${sg.map((x) => `<button type="button" class="chip" data-toggle="${x.plant.id}"><span class="dot" style="background:${COLORS[x.plant.color[0]].hex}"></span>＋ ${esc(x.plant.ja)}${x.level ? ` ${LEVEL[x.level].mark}` : ''}</button>`).join('')}</div></div>` : ''}`; })();

  const layers = ['back', 'middle', 'front'].map((k) => {
    const list = plants.filter((p) => heightClass(p) === k);
    if (!list.length) return '';
    return `<div class="layer"><h3>${HEIGHT_LABEL[k]}<small>${k === 'back' ? '花壇の奥・北側' : k === 'front' ? '手前・縁取り' : '中ほど'}</small></h3>
      ${list.map((p) => {
        const r = evaluate(p, c);
        const per = plantsPerSqm(p);
        const share = state.area / plants.length;
        const qty = qtyFor(p, plants);
        return `<div class="gplant" id="gp-${p.id}">
          <span class="dot" style="background:${COLORS[p.color[0]].hex}"></span>
          <div class="grow"><div>${esc(p.ja)} ${gradeBadge(r, true)}</div>
          ${r.grade && r.grade <= 4 ? `<div class="sub g-note">${esc(r.tips?.length ? `工夫：${r.tips[0]}` : r.reasons[0] || '')}</div>` : ''}
          <div class="sub">株間 約${p.spread}cm・1㎡に${per}株・${p.h[0]}〜${p.h[1]}cm・植え時 ${monthsJa(plantingTime(p, c).plant.best)}</div>
          ${infoLine(activeGarden(), p.id)}</div>
          <span class="qty">約${qty}株</span>
          <button type="button" class="icon-btn rec-btn" data-record="${p.id}" aria-label="${esc(p.ja)}の記録を書く">${icon('note', 17)}</button>
          <button type="button" class="icon-btn" data-doctor="${p.id}" aria-label="${esc(p.ja)}の調子が悪いとき">${icon('search', 17)}</button>
          <button type="button" class="have ${activeGarden().have[p.id] ? 'on' : ''}" data-have="${p.id}">${activeGarden().have[p.id] ? '植えた' : 'ほしい'}</button>
          <button type="button" class="icon-btn" data-toggle="${p.id}" aria-label="${esc(p.ja)}を外す">✕</button>
        </div>`;
      }).join('')}</div>`;
  }).join('');

  box.innerHTML = `
    ${gardenBar()}
    ${shoppingCard(plants)}
    ${growthCard(activeGarden())}
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
    ${c ? gardenGradeCard(plants, c) : ''}
    <div class="card">
      <h2>配置と株数の目安</h2>
      ${activeGarden().siteArea ? `<p class="site-area">庭全体 <b>${activeGarden().siteArea}㎡</b>・うち花壇 <b>${state.area}㎡</b>（${Math.round((state.area / activeGarden().siteArea) * 1000) / 10}%）</p>` : ''}
      <label class="area">花壇の面積 <input type="number" id="area" min="0.5" step="0.5" value="${state.area}" inputmode="decimal"> ㎡</label>
      <p class="hint" style="margin-top:6px">面積を植物の種類数で等分した場合の株数です。同じ植物を3〜5株まとめて植えると自然で見栄えがよくなります。</p>
      ${layers}
      ${gardenCost(plants)}
    </div>`;

  bindGrowth(box, activeGarden());
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
let taskDone = store.get('taskDone', {});
const plantFirst = (a, b) => (b.plants?.length ? 1 : 0) - (a.plants?.length ? 1 : 0);
/** 今月の作業（作業暦・ホーム・ツピで共通）：庭づくりの段取り → 自分の庭の植物の作業 → 一般的な作業。やったものは除く */
function monthTasks() {
  const c = state.climate;
  if (!c) return [];
  const now = new Date().getMonth() + 1, y = new Date().getFullYear();
  const mine = state.garden.map((id) => byId.get(id)).filter(Boolean);
  const steps = buildDue(activeGarden(), ymOf(), true).filter((b) => !b.done).map((b) => ({ kind: 'plant', title: `庭づくり：${b.title}`, detail: b.detail, build: true }));
  const list = [...buildTasks(c, mine), ...pestTasks(c, mine)].filter((t) => t.month === now && !taskDone[y]?.[doneKey(y, now, t)]).sort(plantFirst);
  return [...steps, ...list];
}
const doneKey = (y, m, t) => `${m}|${t.title}`;
/** 作業暦をカレンダー（.ics）に書き出す：今月から12か月分。各月の最初の土曜日（今月は次の土曜日）の朝9時に通知 */
async function exportICS(tasks, order, now) {
  const ev = [];
  const t0 = new Date();
  for (const m of order) {
    const y = t0.getFullYear() + (m < now ? 1 : 0);
    let d = firstSaturday(y, m);
    if (m === now && d < new Date(t0.getFullYear(), t0.getMonth(), t0.getDate())) { d = new Date(t0); while (d.getDay() !== 6) d.setDate(d.getDate() + 1); }
    for (const t of tasks.filter((x) => x.month === m)) if (!taskDone[y]?.[doneKey(y, m, t)]) ev.push({ date: d, title: t.title, detail: `${t.detail}${t.plants?.length ? `\n対象：${t.plants.map((p) => p.ja).join('、')}` : ''}` });
    for (const b of buildDue(activeGarden(), `${y}-${String(m).padStart(2, '0')}`)) if (!b.done) ev.push({ date: d, title: `庭づくり：${b.title}`, detail: b.detail });
  }
  if (!ev.length) { toast('登録する作業がありません'); return; }
  const ics = toICS(ev, `庭の作業（${activeGarden().name}）`);
  const name = `garden-tasks-${t0.getFullYear()}${String(t0.getMonth() + 1).padStart(2, '0')}.ics`;
  // iPhone・iPad の Safari は、カレンダー形式のデータを開くと「カレンダーに追加」の画面になる
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) { location.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics); return; }
  const r = await saveFile(name, ics, 'text/calendar');
  if (r !== 'cancel') toast(`${ev.length}件の作業を書き出しました。開くと、カレンダーに追加できます（各月の最初の土曜の朝9時に通知）`);
}
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

  box.innerHTML = gardenPicker() + `<div class="row cal-acts"><button type="button" class="btn small" id="btnICS">${icon('calendar', 15)}スマホのカレンダーに登録</button><button type="button" class="btn small" data-calc>${icon('list', 15)}計算機</button><button type="button" class="btn small" data-doctor="">${icon('search', 15)}困ったとき</button></div>` + '<div id="wxSlot"></div>' + guideCard()
    + (plants.length ? '' : `<div class="card"><p class="hint" style="margin:0">マイ庭に植物を追加すると、植物ごとの切り戻し・株分け・病害虫の見回り時期も表示されます。</p></div>`)
    + order.map((m) => {
      const list = tasks.filter((t) => t.month === m).sort(plantFirst);
      const cur = m === now;
      const d0 = new Date(); const yy = d0.getFullYear() + (m < now ? 1 : 0);
      const due = buildDue(activeGarden(), `${yy}-${String(m).padStart(2, '0')}`, cur);
      if (!list.length && !cur && !due.length) return '';
      return `<div class="card month-block${cur ? ' current' : ''}" id="month-${m}">
        <h2>${m}月${cur ? '<span class="pill">今月</span>' : ''}</h2>
        ${cur && blooming.length ? `<div class="blooming" style="margin-bottom:6px">${blooming.map((p) => `<span class="chip"><span class="dot" style="background:${COLORS[p.color[0]].hex}"></span>${esc(p.ja)} が見頃</span>`).join('')}</div>` : ''}
        ${due.length ? `<div class="build-due"><span class="label">${icon('steps', 14)}庭づくりの段取り</span>${due.map((b) => `<label class="bd-item${b.done ? ' done' : ''}"><input type="checkbox" data-bdone="${b.id}" ${b.done ? 'checked' : ''}><span><b>${esc(b.title)}</b>${b.ym < ymOf() ? '<em>先月までの分</em>' : ''}<small>${esc(b.detail)}</small>${b.plants.length ? `<small>対象：${esc(b.plants.join('、'))}</small>` : ''}</span></label>`).join('')}</div>` : ''}
        ${list.map((t) => { const dk = doneKey(yy, m, t); const dn = taskDone[yy]?.[dk]; return `<div class="task${dn ? ' done' : ''}"><div class="ic" aria-hidden="true">${icon(TASK_ICON[t.kind] || 'leaf', 18)}</div><div>
          <div class="t">${esc(t.title)}${t.risk ? ` <span class="risk r${t.risk}">${RISK_JA[t.risk]}</span>` : ''}</div><div class="d">${esc(t.detail)}</div>
          ${t.plants && !(t.plants.length === 1 && t.title.startsWith(t.plants[0].ja)) ? `<div class="p">対象：${t.plants.map((p) => esc(p.ja)).join('、')}</div>` : ''}
        </div><label class="tdone"><input type="checkbox" data-tdone="${yy}|${esc(dk)}" ${dn ? 'checked' : ''}><span>${dn ? `${Number(dn.slice(5, 7))}/${Number(dn.slice(8, 10))} 済` : 'やった'}</span></label></div>`; }).join('') || '<p class="hint">特別な作業はありません。庭を観察して楽しみましょう。</p>'}
      </div>`;
    }).join('')
    + `<p class="note">時期は${esc(state.loc.name)}の過去10年の終霜・初霜・暑さから計算した目安です。その年の天候に合わせて調整してください。</p>`;
  weatherCard().then(async (h) => { const el = $('#wxSlot'); if (el) el.innerHTML = h + await wxLogHtml(); });
  box.querySelectorAll('[data-tdone]').forEach((c) => c.addEventListener('change', () => {
    const [y, ...rest] = c.dataset.tdone.split('|');
    const k = rest.join('|');
    taskDone[y] = taskDone[y] || {};
    if (c.checked) taskDone[y][k] = todayStr(); else delete taskDone[y][k];
    store.set('taskDone', taskDone);
    const row = c.closest('.task');
    row.classList.toggle('done', c.checked);
    c.nextElementSibling.textContent = c.checked ? `${new Date().getMonth() + 1}/${new Date().getDate()} 済` : 'やった';
  }));
  $('#btnICS').addEventListener('click', () => exportICS(tasks, order, now));
  box.querySelectorAll('[data-bdone]').forEach((c) => c.addEventListener('change', () => {
    const g = activeGarden();
    const b = (g.buildPlan || []).find((x) => x.id === c.dataset.bdone);
    if (!b) return;
    b.done = c.checked;
    saveGardens();
    c.closest('.bd-item').classList.toggle('done', c.checked);
    if ((g.buildPlan || []).every((x) => x.done)) toast('庭づくりの段取りが、すべて終わりました。おつかれさまでした！');
  }));
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
    ${rows.map(({ p, color, label, jump }) => {
      const on = new Set(p.bloom.map((m) => localMonth(m, south)));
      const col = COLORS[color || p.color[0]].hex;
      return `<div class="n${jump ? ' jumpable' : ''}" title="${esc(p.ja)}"${jump ? ` data-jump="${jump}" role="button"` : ''}>${label ? label + ' ' : ''}${esc(p.ja)}${p.bloom.length ? '' : '<small class="nb">葉を楽しむ</small>'}</div>${MONTHS.map((m) => `<div class="c${m === now ? ' now' : ''}"${on.has(m) ? ` style="background:${col}"` : ''} title="${m}月${on.has(m) ? '：開花' : ''}"></div>`).join('')}`;
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
  $('#planGround').checked = !!pi.ground;
  $('#balW').value = pi.balcony.width; $('#balD').value = pi.balcony.depth; $('#balFloor').value = pi.balcony.floor;
  $('#balRailH').value = pi.balcony.railH; $('#balCeil').value = pi.balcony.ceilH; $('#balShelf').value = String(pi.balcony.shelf);
  $('#balHang').checked = !!pi.balcony.hang; $('#balWater').checked = !!pi.balcony.water;
  document.querySelectorAll('[data-bal]').forEach((seg) => seg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    state.planInput.balcony[seg.dataset.bal] = b.dataset.v;
    syncPlanSegs();
  }));
  $('#siteW').value = pi.site.width;
  $('#siteD').value = pi.site.depth;
  $('#siteArea').value = pi.site.area || '';
  $('#polySize').value = String(pi.site.size || 15);
  $('#planStyle').innerHTML = Object.entries(STYLES).map(([k, v]) => `<option value="${k}">${v.ja}</option>`).join('');
  $('#planStyle').value = pi.style || 'border';
  const syncStyle = () => {
    const st = STYLES[$('#planStyle').value];
    $('#styleDesc').innerHTML = `${esc(st.summary)}${st.fit ? `<br><b class="style-fit">向いている庭・暮らし：</b>${esc(st.fit)}` : ''}`;
    document.querySelectorAll('#styleCards .style-card').forEach((c) => c.classList.toggle('on', c.dataset.style === $('#planStyle').value));
  };
  $('#styleCards').innerHTML = Object.entries(STYLES).map(([k, v]) => `<button type="button" class="style-card" data-style="${k}" role="listitem"><span class="sc-art">${styleArt(k)}</span><b>${esc(v.ja.replace(/（.*?）/g, ''))}</b>${v.by ? `<small>${esc(v.by)}</small>` : ''}${v.fit ? `<em class="sc-fit">${esc(v.fit.split('。')[0])}</em>` : ''}</button>`).join('');
  $('#styleCards').addEventListener('click', (e) => {
    const c = e.target.closest('[data-style]');
    if (!c) return;
    $('#planStyle').value = c.dataset.style;
    state.planInput.style = c.dataset.style;
    syncStyle();
  });
  $('#planStyle').addEventListener('change', () => { state.planInput.style = $('#planStyle').value; syncStyle(); });
  syncStyle();
  $('#planPresets').innerHTML = PRESETS.map((w) => `<button type="button" class="chip" data-w="${w}">${w}</button>`).join('');
  $('#planPresets').addEventListener('click', (e) => {
    const b = e.target.closest('[data-w]');
    if (!b) return;
    // チップは入力欄とは別の選択。入力した文章は書き換えない
    const pi = state.planInput;
    const w = b.dataset.w;
    pi.presets = (pi.presets || []).includes(w) ? pi.presets.filter((x) => x !== w) : [...(pi.presets || []), w];
    store.set('planInput', pi);
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
  const bal = pi.mode === 'balcony';
  document.querySelectorAll('[data-bal]').forEach((seg) => {
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === String(pi.balcony[seg.dataset.bal])));
  });
  $('#planMode').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === pi.mode));
  $('#planForm').classList.toggle('is-site', site);
  document.querySelectorAll('#view-plan .site-only').forEach((el) => { el.hidden = !site; });
  document.querySelectorAll('#view-plan .bed-only').forEach((el) => { el.hidden = pi.mode !== 'bed'; });
  document.querySelectorAll('#view-plan .balcony-only').forEach((el) => { el.hidden = !bal; });
  document.querySelectorAll('#view-plan .not-balcony').forEach((el) => { el.hidden = bal; });
  $('#balFields .bal-roof').hidden = pi.balcony.roof === 'no';
  $('#planFormTitle').textContent = site ? '庭まるごとプランをつくる' : bal ? 'ベランダ・鉢植えのプランをつくる' : '植栽プランをつくる';
  $('#btnPlanLabel').textContent = site ? '庭のプランをつくる' : bal ? 'ベランダのプランをつくる' : 'プランをつくる';
  const bs = pi.shape || 'rect';
  $('#planDField').hidden = bs === 'circle';
  $('#planW').previousElementSibling.textContent = bs === 'circle' ? '直径（m）' : bs === 'rect' ? '花壇の幅（m）' : '幅（いちばん広いところ・m）';
  $('#viewField').hidden = pi.mode !== 'bed' || ['circle', 'oval', 'half', 'wave'].includes(bs);
  $('#shapeHint').textContent = BED_SHAPES[bs].text + (['circle', 'oval'].includes(bs) ? '。四方から眺める花壇として、中央を高く植えます。' : ['half', 'wave'].includes(bs) ? '。奥（まっすぐな側）を高く、曲線の手前を低く植えます。' : bs === 'kidney' ? '。片側から眺めるときは奥を高く、四方から眺めるときは中央を高くします。' : '');
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
  const on = new Set(state.planInput.presets || []);
  document.querySelectorAll('#planPresets .chip').forEach((c) => { c.classList.toggle('on', on.has(c.dataset.w)); c.setAttribute('aria-pressed', on.has(c.dataset.w)); });
}
/** プランの条件の文章：入力した文章と、選んだチップを合わせる */
function planText(pi) {
  return [pi.text || '', ...(pi.presets || []).filter((w) => !(pi.text || '').includes(w))].filter(Boolean).join('、');
}
// ---------- 植物ごとの記録（植えた日・場所・鉢植え） ----------
const plantInfo = (g, id) => g.info?.[id] || {};
function ageOf(date) {
  if (!date) return null;
  const d = (Date.now() - new Date(date + 'T00:00:00')) / 864e5;
  return d < 0 ? null : d;
}
function infoLine(g, id) {
  const inf = plantInfo(g, id);
  const age = ageOf(inf.planted);
  const parts = [];
  if (inf.planted) parts.push(`植えた日 ${dateJa(inf.planted)}${age != null ? (age < 60 ? `（${Math.round(age)}日目）` : age < 730 ? `（${Math.round(age / 30)}か月）` : `（${Math.floor(age / 365)}年）`) : ''}`);
  if (inf.pot) parts.push('鉢植え');
  if (inf.where) parts.push(`場所：${inf.where}`);
  return `<div class="sub info-line">${parts.length ? esc(parts.join('・')) : '<span class="muted">植えた日・場所は未記録</span>'} <button type="button" class="link" data-pinfo="${id}">✎ 記録</button></div>`;
}
function openPlantInfo(id) {
  const g = activeGarden();
  const p = byId.get(id);
  const inf = plantInfo(g, id);
  openSheet(`${icon('pot', 19)} ${esc(p?.ja || '')}の記録`, `<div class="pinfo">
    <label class="field"><span class="label">植えた日</span><input type="date" id="piDate" value="${esc(inf.planted || '')}" max="${todayStr()}"></label>
    <label class="field"><span class="label">植えた場所（例：南の花壇の右奥、玄関の青い鉢）</span><input type="text" id="piWhere" maxlength="60" value="${esc(inf.where || '')}"></label>
    <label class="toggle"><input type="checkbox" id="piPot" ${inf.pot ? 'checked' : ''}> 鉢植え（水やりナビと診断で鉢として扱います）</label>
    <label class="field"><span class="label">メモ（買ったお店・値段・品種名のラベルなど）</span><textarea id="piMemo" rows="2" maxlength="300">${esc(inf.memo || '')}</textarea></label>
    <button type="button" class="btn primary wide" id="piSave">保存する</button>
  </div>`, 'sheet-pinfo');
  $('#piSave').addEventListener('click', () => {
    g.info = g.info || {};
    g.info[id] = { planted: $('#piDate').value || '', where: $('#piWhere').value.trim(), pot: $('#piPot').checked, memo: $('#piMemo').value.trim() };
    if (g.info[id].planted) g.have[id] = true;
    saveGardens();
    closeSheet();
    toast('記録しました');
    if (state.view === 'garden') renderGarden();
  });
}

// ---------- 庭仕事の計算機 ----------
function openCalc(tab = 'plants') {
  const g = activeGarden();
  const mine = g.plants.map((id) => byId.get(id)).filter(Boolean);
  const area0 = g.area || 3;
  const tabs = { plants: '苗の数', soil: '土づくり', pot: '鉢の土', feed: '肥料', mulch: 'マルチ' };
  const num = (id, label, v, step = 0.1, unit = '') => `<label class="field cnum"><span class="label">${label}</span><span class="cin"><input type="number" id="${id}" value="${v}" min="0" step="${step}" inputmode="decimal">${unit ? `<small>${unit}</small>` : ''}</span></label>`;
  const forms = {
    plants: `${num('cA', '植える面積', area0, 0.1, '㎡')}
      <label class="field"><span class="label">植物（株間を自動で入れます）</span><select id="cPl"><option value="">株間を自分で入れる</option>${mine.map((p) => `<option value="${p.spread}">${esc(p.ja)}（株間${p.spread}cm）</option>`).join('')}</select></label>
      ${num('cS', '株間', 40, 5, 'cm')}`,
    soil: `${num('cA', '花壇の面積', area0, 0.1, '㎡')}${num('cD', '耕す深さ', 30, 5, 'cm')}`,
    pot: `<label class="field"><span class="label">鉢の大きさ</span><select id="cG">${[3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map((n) => `<option value="${n}"${n === 7 ? ' selected' : ''}>${n}号（直径${n * 3}cm・約${potLiters(n)}L）</option>`).join('')}</select></label>${num('cN', '鉢の数', 1, 1, '鉢')}`,
    feed: `${num('cA', '地植えの面積', area0, 0.1, '㎡')}<label class="field"><span class="label">鉢（置き肥）</span><select id="cG"><option value="0">鉢なし</option>${[4, 5, 6, 7, 8, 10, 12].map((n) => `<option value="${n}">${n}号</option>`).join('')}</select></label>${num('cN', '鉢の数', 1, 1, '鉢')}${num('cW', '液体肥料をつくる水の量', 2, 0.5, 'L')}<label class="field"><span class="label">うすめる倍率</span><select id="cX">${[500, 1000, 2000].map((n) => `<option value="${n}"${n === 1000 ? ' selected' : ''}>${n}倍</option>`).join('')}</select></label>`,
    mulch: `${num('cA', '覆う面積', area0, 0.1, '㎡')}${num('cT', '厚さ', 5, 1, 'cm')}`,
  };
  const result = () => {
    const v = (id) => Number($('#' + id)?.value) || 0;
    if (tab === 'plants') { const r = seedlings(v('cA'), v('cS')); return `<p class="cres"><b>${r.tri}</b>株<small>千鳥（三角形）に植える場合</small></p><p class="cres sub"><b>${r.square}</b>株<small>ます目に植える場合</small></p><p class="hint">株間は育ったときの株張りが目安。早く埋めたいときは株間を2割ほど詰めます（その分、苗代が増えます）。</p>`; }
    if (tab === 'soil') { const r = bedSoil(v('cA'), v('cD')); return `<p class="cres"><b>${r.compost}</b>L<small>混ぜる堆肥・腐葉土（耕す土の約4分の1）・40L袋で約${r.bags40}袋</small></p><p class="cres sub"><b>${r.soil}</b>L<small>耕す土の量（面積×深さ）</small></p><p class="hint">水はけが悪い土は、さらに軽石や川砂を1割ほど混ぜます。粘土質なら土を盛って花壇を高くするのも効果的。</p>`; }
    if (tab === 'pot') { const r = potSoil(v('cG') || Number($('#cG').value), v('cN') || 1); return `<p class="cres"><b>${r.liters}</b>L<small>培養土の量・14L袋で約${r.bags14}袋</small></p><p class="cres sub"><b>${r.stone}</b>L<small>鉢底石（鉢の深さの1割ほど）</small></p><p class="hint">鉢の形（深鉢・浅鉢）で量は変わります。少し多めに用意すると安心です。</p>`; }
    if (tab === 'feed') { const r = fertilizer(v('cA'), Number($('#cG').value), v('cN') || 1); const l = liquid(v('cW'), Number($('#cX').value)); return `<p class="cres"><b>${r.base}</b>g<small>植え付け時の元肥（緩効性肥料・1㎡あたり約80g）</small></p><p class="cres sub"><b>${r.top}</b>g<small>春の追肥（1㎡あたり約30g）</small></p>${r.pot ? `<p class="cres sub"><b>${r.pot}</b>g<small>鉢の置き肥（合計）。2か月ほどで置き直す</small></p>` : ''}<p class="cres sub"><b>${l}</b>mL<small>液体肥料の原液（水${v('cW')}Lを${$('#cX').value}倍に）</small></p><p class="hint">宿根草は肥料が少なめでよく育ちます。量は肥料の袋の表示を優先してください。</p>`; }
    const r = mulch(v('cA'), v('cT')); return `<p class="cres"><b>${r.liters}</b>L<small>バークチップ・腐葉土などの量・40L袋で約${r.bags40}袋</small></p><p class="hint">厚さ5cmで雑草と乾燥をよく防げます。株元は少しあけて、茎が蒸れないように。</p>`;
  };
  openSheet(`${icon('list', 19)} 庭仕事の計算機`, `<div class="calc">
    <div class="seg small calc-tabs">${Object.entries(tabs).map(([k, t]) => `<button type="button" data-ctab="${k}" class="${k === tab ? 'on' : ''}">${t}</button>`).join('')}</div>
    <div class="calc-form">${forms[tab]}</div>
    <div class="calc-out" id="calcOut">${''}</div>
  </div>`, 'sheet-calc');
  const body = $('#sheetBody');
  const upd = () => { $('#calcOut').innerHTML = result(); };
  body.oninput = upd;
  body.onchange = (e) => { if (e.target.id === 'cPl' && e.target.value) $('#cS').value = e.target.value; upd(); };
  body.onclick = (e) => { const t = e.target.closest('[data-ctab]'); if (t) openCalc(t.dataset.ctab); };
  upd();
}

// ---------- 印刷とプランの概要 ----------
/** いま表示しているプランの植物（名前・数・単価）と概要 */
function planSummaryData() {
  const pi = state.planInput;
  if (pi.mode === 'site' && state.site && !state.siteBed) {
    const s = state.site;
    const agg = new Map();
    for (const b of s.beds) for (const sp of b.plan.species) { const x = agg.get(sp.plant.id) || { p: sp.plant, qty: 0, beds: [] }; x.qty += sp.qty; if (!x.beds.includes(b.id)) x.beds.push(b.id); agg.set(sp.plant.id, x); }
    const items = [...agg.values()];
    return { title: $('#planBox h1')?.textContent || '庭まるごとプラン', lines: [`敷地 ${s.area}㎡（花壇${s.beds.length}か所・${s.areas.bed}㎡）`, `スタイル：${(STYLES[pi.style]?.ja || '').replace(/（.*?）/g, '')}`, `概算 ${yen(s.cost.total)}（材料費・DIY）`], items, cost: s.cost.total };
  }
  const plan = state.plan;
  if (!plan) return null;
  return { title: $('#planBox h1')?.textContent || '花壇プラン', lines: [`花壇 ${Math.round(plan.area * 10) / 10}㎡（幅${plan.width}m×奥行き${plan.depth}m）`, `スタイル：${(STYLES[plan.style]?.ja || '').replace(/（.*?）/g, '')}`, `概算 ${yen(plan.cost.total)}（苗・土づくり・マルチ）`], items: plan.species.map((sp) => ({ p: sp.plant, qty: sp.qty })), cost: plan.cost.total };
}
function planSummaryText() {
  const d = planSummaryData();
  if (!d) return '';
  const south = !!state.climate?.south;
  const bloom = new Set(d.items.flatMap((x) => x.p.bloom.map((m) => localMonth(m, south))));
  return [`【${d.title}】`, ...d.lines, `花の咲く月：${monthsJa([...bloom])}`, `場所：${state.loc?.name || ''}${state.climate ? `（耐寒性ゾーン${state.climate.zone.label}）` : ''}`, '', '■ 植える植物',
    ...d.items.map((x, i) => `${i + 1}. ${x.p.ja} × ${x.qty}${x.p.type === 'bulb' ? '球' : '株'}${x.beds ? `（花壇${x.beds.join('・')}）` : ''}　約${yen(x.qty * x.p.price)}`),
    `合計 ${d.items.length}種・${d.items.reduce((t, x) => t + x.qty, 0)}株`, '', '庭づくりアプリで作成'].join('\n');
}
/** 印刷用の買い物メモ（画面には出さない） */
function printMemoHtml() {
  const d = planSummaryData();
  if (!d) return '';
  return `<section class="print-only print-memo"><h2>買い物メモ・概要</h2><p>${d.lines.map(esc).join('　')}</p>
    <table><tr><th></th><th>植物</th><th>数</th><th>目安</th>${d.items[0]?.beds ? '<th>花壇</th>' : ''}</tr>${d.items.map((x, i) => `<tr><td>□</td><td>${esc(x.p.ja)}</td><td>${x.qty}${x.p.type === 'bulb' ? '球' : '株'}</td><td>${yen(x.qty * x.p.price)}</td>${x.beds ? `<td>${x.beds.join('・')}</td>` : ''}</tr>`).join('')}</table></section>`;
}
document.addEventListener('click', async (e) => {
  if (e.target.closest('[data-print]')) {
    const box = $('#planBox');
    box.querySelector('.print-memo')?.remove();
    box.insertAdjacentHTML('beforeend', printMemoHtml());
    const closed = [...box.querySelectorAll('details:not([open])')];
    closed.forEach((d) => { d.open = true; });
    document.body.classList.add('printing');
    window.print();
    setTimeout(() => { closed.forEach((d) => { d.open = false; }); document.body.classList.remove('printing'); }, 500);
    return;
  }
  if (e.target.closest('[data-copysum]')) {
    toast((await copyText(planSummaryText())) ? 'プランの概要をコピーしました。メールやメモに貼り付けられます' : 'コピーできませんでした');
  }
});

// ---------- 症状から調べる ----------
function openDoctor(plantId = '') {
  const g = activeGarden();
  const mine = g.plants.map((id) => byId.get(id)).filter(Boolean);
  const sel = { plant: plantId, sym: [], pot: !!plantInfo(g, plantId).pot || activeGarden().kind === 'balcony' };
  openSheet(`${icon('search', 19)} 症状から調べる`, `<div class="doctor">
    <p class="hint">見た目の症状を選ぶと、考えられる原因と対処を、植物・季節・地域・置き場所から推定します。</p>
    <label class="field"><span class="label">どの植物？</span><select id="drPlant"><option value="">選ばない・わからない</option>
      ${mine.length ? `<optgroup label="${esc(g.name)}">${mine.map((p) => `<option value="${p.id}"${p.id === plantId ? ' selected' : ''}>${esc(p.ja)}</option>`).join('')}</optgroup>` : ''}
      ${plantId && !mine.some((p) => p.id === plantId) ? `<option value="${plantId}" selected>${esc(byId.get(plantId)?.ja || '')}</option>` : ''}
    </select></label>
    <div class="seg small" id="drPot"><button type="button" data-v="0">地植え</button><button type="button" data-v="1">鉢植え</button></div>
    <span class="label" style="margin-top:10px">症状（いくつでも）</span>
    <div class="chips dr-sym">${Object.entries(SYMPTOMS).map(([k, v]) => `<button type="button" class="chip" data-sym="${k}">${esc(v)}</button>`).join('')}</div>
    <div id="drOut"></div>
  </div>`, 'sheet-doctor');
  const body = $('#sheetBody');
  const run = () => {
    body.querySelectorAll('#drPot button').forEach((b) => b.classList.toggle('on', b.dataset.v === (sel.pot ? '1' : '0')));
    const p = byId.get(sel.plant);
    const c = state.climate;
    const month = localMonth(new Date().getMonth() + 1, !!c?.south);
    const age = ageOf(plantInfo(g, sel.plant).planted);
    const res = diagnose(sel.sym, p, month, { pot: sel.pot, climate: c, humidHot: (c?.tropicalNights || 0) >= 20, firstYear: age != null && age < 365, years: age != null ? Math.floor(age / 365) : 0 });
    const q = sel.sym.length ? `${p ? p.ja : '庭の植物'}（${sel.pot ? '鉢植え' : '地植え'}）が「${sel.sym.map((s) => SYMPTOMS[s]).join('」「')}」という状態です。考えられる原因と、今すぐできる対処を教えてください。写真も添えます。` : '';
    $('#drOut').innerHTML = !sel.sym.length ? '' : `<h3 class="dr-h">考えられる原因</h3>
      <div class="dr-list">${res.map((r, i) => `<details class="dr-item ${r.level}"${i === 0 ? ' open' : ''}><summary><span class="dr-lv">${{ high: '可能性が高い', mid: 'ありうる', low: '念のため' }[r.level]}</span><b>${esc(r.ja)}</b><small>${esc(r.kind)}</small></summary>
        <p class="dr-why">${esc(r.why.join('・'))}</p>
        <h4>確かめること</h4><ul>${r.check.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <h4>対処</h4><ul>${r.fix.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      </details>`).join('')}</div>
      <p class="hint">迷ったら、症状の出た葉や株元の写真を撮って、AIアプリに見てもらうのもおすすめです。</p>
      <div class="row"><button type="button" class="btn small" data-consult="${esc(q)}">${icon('search', 14)}写真といっしょにAIに相談</button><button type="button" class="btn small" data-record="${sel.plant}">${icon('note', 14)}ノートに記録</button></div>`;
  };
  body.onclick = (e) => {
    const s2 = e.target.closest('[data-sym]');
    if (s2) { s2.classList.toggle('on'); sel.sym = [...body.querySelectorAll('[data-sym].on')].map((x) => x.dataset.sym); run(); return; }
    const pb = e.target.closest('#drPot button');
    if (pb) { sel.pot = pb.dataset.v === '1'; run(); }
  };
  $('#drPlant').addEventListener('change', (e) => { sel.plant = e.target.value; sel.pot = !!plantInfo(g, sel.plant).pot || g.kind === 'balcony'; run(); });
  run();
}
document.addEventListener('click', (e) => {
  const d = e.target.closest('[data-doctor]');
  if (d) { openDoctor(d.dataset.doctor); return; }
  const pi = e.target.closest('[data-pinfo]');
  if (pi) { openPlantInfo(pi.dataset.pinfo); return; }
  if (e.target.closest('[data-calc]')) { openCalc(); }
});

// ---------- 定点カメラ（前回の写真を半透明で重ねて、同じ構図で撮る） ----------
let camStream = null;
function stopCamera() { if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; } }
async function openFixedCamera(spotId = '') {
  const g = activeGarden();
  const spots = g.spots || [];
  let spot = spots.find((x) => x.id === spotId) || spots[0] || null;
  const lastOf = (sp) => diaryCache.filter((n) => n.photo && n.spot === sp?.id && (n.gardenId === g.id || !n.gardenId)).sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  openSheet(`${icon('camera', 19)} 定点カメラ`, `<div class="fcam-wrap">
    ${spots.length ? `<label class="field"><span class="label">定点</span><select id="fcSpot">${spots.map((x) => `<option value="${x.id}"${x === spot ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>` : '<p class="hint">定点がまだありません。撮った写真は、定点「いつもの場所」として保存します。</p>'}
    <div class="fcam"><video id="fcVideo" playsinline autoplay muted></video><img id="fcGhost" alt="" hidden><div class="fc-grid"></div><p class="fc-msg" id="fcMsg">カメラを準備しています…</p></div>
    <label class="field fc-op"><span class="label">前回の写真の濃さ</span><input type="range" id="fcOp" min="0" max="80" value="40"></label>
    <p class="hint" id="fcInfo"></p>
    <div class="row fc-btns"><button type="button" class="btn primary" id="fcShot">${icon('camera', 18)}撮影して記録</button>
      <label class="btn" for="fcFile">写真を選ぶ</label><input type="file" id="fcFile" accept="image/*" capture="environment" hidden></div>
  </div>`, 'sheet-fcam');
  const ghost = $('#fcGhost'), video = $('#fcVideo');
  const showGhost = () => {
    const last = lastOf(spot);
    ghost.hidden = !last;
    if (last) ghost.src = last.photo;
    $('#fcInfo').textContent = last ? `前回（${dateJa(last.date)}）の写真を重ねています。輪郭を合わせて撮ると、同じ構図で比べられます。` : 'この定点の写真はまだありません。今日の1枚が基準になります。';
  };
  showGhost();
  $('#fcOp').addEventListener('input', (e) => { ghost.style.opacity = e.target.value / 100; });
  ghost.style.opacity = 0.4;
  $('#fcSpot')?.addEventListener('change', (e) => { spot = spots.find((x) => x.id === e.target.value); showGhost(); });
  const save = async (dataUrl) => {
    if (!spot) { g.spots = [{ id: 's' + Date.now().toString(36), name: 'いつもの場所' }]; spot = g.spots[0]; saveGardens(); }
    await saveNote({ id: Date.now().toString(36), date: todayStr(), plants: [], events: [], text: '', photo: dataUrl, spot: spot.id, garden: g.name, gardenId: g.id });
    await loadDiary();
    closeSheet();
    growPick.spot = spot.id; growPick.open = true; growPick.a = growPick.b = null;
    toast(`定点「${spot.name}」の写真を記録しました`);
    if (state.view === 'garden') { renderGarden(); document.getElementById('growCard')?.scrollIntoView({ block: 'start' }); } else render();
  };
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('nocam');
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
    video.srcObject = camStream;
    $('#fcMsg').hidden = true;
  } catch {
    $('#fcMsg').textContent = 'この端末・ブラウザではカメラを直接使えません。「写真を選ぶ」から撮影してください（前回の写真は上の見本として表示します）。';
    $('#fcShot').hidden = true;
  }
  $('#fcShot').addEventListener('click', async () => {
    if (!video.videoWidth) { toast('カメラの準備ができていません'); return; }
    const k = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(video.videoWidth * k); c.height = Math.round(video.videoHeight * k);
    c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
    await save(c.toDataURL('image/jpeg', 0.85));
  });
  $('#fcFile').addEventListener('change', async (e) => { const f = e.target.files[0]; if (!f) return; try { await save(await shrinkImage(f, 1600, 0.85)); } catch (err) { toast(err.message); } });
}
document.addEventListener('click', (e) => { const f = e.target.closest('[data-fcam]'); if (f) openFixedCamera(f.dataset.fcam); });

// ---------- iNaturalist：近くで実際に観察された生き物 ----------
let inatGroup = 'bird';
function inatCard() {
  if (!state.loc) return '';
  return `<section class="mag" id="inatCard">
    ${secHead('Nearby Records', '近くで実際に観察された生き物', `${esc(state.loc.name)}のまわり約5kmで、市民が写真つきで記録し、ほかの人が種を確かめた観察記録（iNaturalist）です。庭に来る生き物の手がかりになります。`)}
    <div class="seg small inat-tabs">${Object.entries(INAT_GROUPS).map(([k, v]) => `<button type="button" data-inat="${k}" class="${k === inatGroup ? 'on' : ''}">${v.ja}</button>`).join('')}</div>
    <div id="inatList"><button type="button" class="btn" data-inat="${inatGroup}">${icon('search', 15)}観察記録を読み込む</button></div>
    <p class="note">データ・写真：<a href="https://www.inaturalist.org/" target="_blank" rel="noopener">iNaturalist</a>（写真の権利は各撮影者にあります）。記録の多さは、観察する人の多さにも左右されます。</p>
  </section>`;
}
async function loadInat(group) {
  inatGroup = group;
  document.querySelectorAll('.inat-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.inat === group));
  const box = $('#inatList');
  if (!box || !state.loc) return;
  const key = `inat:${state.loc.lat.toFixed(2)},${state.loc.lon.toFixed(2)}:${group}`;
  let list = null;
  const c = store.get(key, null);
  if (c && Date.now() - c.t < 7 * 864e5) list = c.d;
  if (!list) {
    box.innerHTML = '<p class="hint"><span class="spinner"></span>観察記録を取り寄せています…</p>';
    try { list = await fetchNearby(state.loc.lat, state.loc.lon, group); store.set(key, { t: Date.now(), d: list }); }
    catch (e) { box.innerHTML = `<p class="hint">${esc(e.message)}。通信状況を確かめて、もう一度お試しください。</p><button type="button" class="btn small" data-inat="${group}">もう一度</button>`; return; }
  }
  const items = matchLocal(list, CREATURES, group === 'plant' ? PLANTS : null);
  const mine = new Set(state.garden.map((id) => byId.get(id)?.group));
  box.innerHTML = items.length ? `<div class="inat-grid">${items.map((x) => `<div class="inat-item">
      ${x.photo ? `<img src="${esc(x.photo)}" alt="${esc(x.ja)}" loading="lazy">` : '<span class="inat-noimg"></span>'}
      <b>${esc(x.ja)}</b><small><i>${esc(x.latin)}</i>・${x.count}件</small>
      ${x.critter ? `<button type="button" class="chip" data-critter="${x.critter}">生き物図鑑</button>` : ''}${x.plant ? `<button type="button" class="chip" data-find="${esc(x.plant.groupJa)}">${mine.has(x.plant.group) ? '✓ 庭にある' : '植物図鑑'}</button>` : ''}
      <a class="inat-link" href="${esc(x.url)}" target="_blank" rel="noopener" title="${esc(x.credit)}">iNaturalist ↗</a>
    </div>`).join('')}</div>` : '<p class="hint">この範囲では、まだ記録がありません。</p>';
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-inat]'); if (b) loadInat(b.dataset.inat); });

// ---------- 日当たりチェッカー ----------
const DIR8 = [['北', 0], ['北東', 45], ['東', 90], ['南東', 135], ['南', 180], ['南西', 225], ['西', 270], ['北西', 315]];
const dirJa = (az) => ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'][Math.round((((az % 360) + 360) % 360) / 22.5) % 16];
function skyChartSVG(lat, points) {
  const R = 120, C = 140, h = horizonFn(points);
  const xy = (az, alt) => { const r = ((90 - Math.max(0, alt)) / 90) * R; const a = (az * Math.PI) / 180; return [C + r * Math.sin(a), C - r * Math.cos(a)]; };
  const sky = [];
  for (let az = 0; az <= 360; az += 3) sky.push(xy(az, h(az)));
  const block = `M${C - R},${C}a${R},${R} 0 1,0 ${2 * R},0a${R},${R} 0 1,0 ${-2 * R},0Z M${sky.map((p) => p.map((v) => v.toFixed(1)).join(',')).join('L')}Z`;
  const days = [[5, 21, '#e9852f', '夏至'], [2, 20, '#7aa95c', '春分・秋分'], [11, 22, '#5b8ee6', '冬至']];
  const paths = days.map(([mo, d, col]) => {
    const pts = sunPath(lat, declination(new Date(2026, mo, d))).filter((p) => p.alt >= 0);
    return pts.slice(1).map((p, i) => { const q = pts[i]; const lit = p.alt > h(p.az) && q.alt > h(q.az); const [x1, y1] = xy(q.az, q.alt), [x2, y2] = xy(p.az, p.alt); return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="${lit ? 3 : 1.5}" ${lit ? '' : 'stroke-dasharray="3 3" opacity=".6"'}/>`; }).join('');
  }).join('');
  const rings = [30, 60].map((a) => `<circle cx="${C}" cy="${C}" r="${((90 - a) / 90) * R}" fill="none" stroke="currentColor" stroke-opacity=".15"/>`).join('');
  const labels = DIR8.filter((_, i) => i % 2 === 0).map(([n, az]) => { const [x, y] = xy(az, -8); return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" font-size="12" fill="currentColor">${n}</text>`; }).join('');
  const dots = (points || []).map((p) => { const [x, y] = xy(p.az, p.alt); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#3f4a26"/>`; }).join('');
  return `<svg class="sunchart" viewBox="0 0 280 280" role="img" aria-label="空の見え方と太陽の通り道"><circle cx="${C}" cy="${C}" r="${R}" fill="#dcebf5"/><path d="${block}" fill="#8a7a5a" fill-opacity=".55" fill-rule="evenodd"/>${rings}${paths}${dots}${labels}</svg>
    <div class="legend">${days.map(([, , col, n]) => `<span><i style="background:${col}"></i>${n}</span>`).join('')}<span><i style="background:#8a7a5a"></i>建物・木などで空が見えない部分</span></div>
    <p class="hint">真上から見た空の図です。中心が真上、外側の円が地平線。太い線は日が当たる時間、点線は障害物の陰になる時間です。</p>`;
}
function openSunCheck(opts = {}) {
  const lat = state.loc?.lat ?? 35.7, lon = state.loc?.lon ?? 139.7;
  const g = activeGarden();
  const spot = opts.spotId ? (g.sunSpots || []).find((x) => x.id === opts.spotId) : null;
  const st = { points: spot && spot.mode !== 'manual' ? [...spot.points] : [], sensor: null, heading: null, alt: null, manual: Object.fromEntries(DIR8.map(([, az]) => [az, spot?.mode === 'manual' ? (spot.points.find((p) => p.az === az)?.alt ?? 0) : 0])), check: [...(spot?.plants || [])] };
  const fromPlan = opts.from === 'plan';
  const SUN_JA = { full: '日向', part: '半日陰', shade: '日陰' };
  openSheet(`${icon('sun', 19)} 日当たりチェッカー`, `<div class="suncheck">
    <p class="hint">植えたい場所に立ち、まわりの建物・塀・木の「てっぺん」の方向と高さを記録すると、太陽の通り道と重ねて、季節ごとの日照時間を計算します（${state.loc ? esc(state.loc.name) + 'の緯度' : '緯度 35.7°'}で計算）。</p>
    ${spot ? `<p class="sc-spot">${icon('pin', 15)}<b>${esc(spot.name)}</b>（${esc(dateJa(spot.date))}に測定）</p>` : ''}
    <div class="seg small" id="scMode"><button type="button" data-v="sensor" class="${spot?.mode === 'manual' ? '' : 'on'}">スマホのセンサーで測る</button><button type="button" data-v="manual" class="${spot?.mode === 'manual' ? 'on' : ''}">方位ごとに入力する</button></div>
    <div id="scSensor"${spot?.mode === 'manual' ? ' hidden' : ''}>
      <div class="sc-cam"><video id="scVideo" playsinline autoplay muted></video><div class="sc-cross"></div><p class="sc-read" id="scRead">「センサーを使う」を押してください</p></div>
      <div class="row"><button type="button" class="btn" id="scStart">${icon('pin', 15)}センサーを使う</button><button type="button" class="btn primary" id="scAdd" disabled>${icon('plus', 15)}障害物のてっぺんを記録</button></div>
      <p class="hint">スマホを縦に持ち、カメラを障害物の上の端（屋根・塀・木のてっぺん）に向けて「記録」。左右に少しずつ向きを変えながら、空が隠れている範囲をなぞるように何点か記録します。空が開けている方向は記録しなくてかまいません。</p>
    </div>
    <div id="scManual"${spot?.mode === 'manual' ? '' : ' hidden'}>
      <p class="hint">方位ごとに、いちばん高く見える障害物を選びます。高さと距離がわかるときは数字で入れると正確です。</p>
      <div class="sc-dirs">${DIR8.map(([n, az]) => `<div class="sc-dir"><b>${n}</b><select data-scaz="${az}"><option value="0">開けている</option><option value="10">遠くに建物・低い塀</option><option value="25">2階建てくらいが少し離れて</option><option value="40">2階建てくらいがすぐ近く</option><option value="60">高い建物・大きな木がすぐ近く</option></select>
        <span class="sc-hd"><input type="number" min="0" step="0.5" placeholder="高さm" data-sch="${az}" inputmode="decimal"><input type="number" min="0" step="0.5" placeholder="距離m" data-scd="${az}" inputmode="decimal"></span></div>`).join('')}</div>
    </div>
    <div id="scPoints"></div>
    <div id="scOut"></div>
  </div>`, 'sheet-sun');
  const out = () => {
    const pts = $('#scManual').hidden ? st.points : DIR8.map(([, az]) => ({ az, alt: st.manual[az] }));
    $('#scPoints').innerHTML = $('#scManual').hidden && st.points.length ? `<p class="hint">記録した点：${st.points.map((p, i) => `<button type="button" class="chip" data-scdel="${i}">${dirJa(p.az)} ${Math.round(p.alt)}° ×</button>`).join(' ')}</p>` : '';
    const r = sunReport(lat, pts);
    $('#scOut').innerHTML = `${skyChartSVG(lat, pts)}
      <div class="tiles"><div class="tile"><div class="k">生育期（4〜9月）の平均</div><div class="v">${r.avg}<small>時間/日</small></div><div class="s">この場所は「${SUN_JA[r.sun]}」</div></div>
      <div class="tile"><div class="k">夏至のころ</div><div class="v">${r.summer}<small>時間</small></div><div class="s">さえぎるものがなければ ${r.months[5].open}時間</div></div>
      <div class="tile"><div class="k">冬至のころ</div><div class="v">${r.winter}<small>時間</small></div><div class="s">冬は太陽が低く、影が長くなる</div></div></div>
      <div class="scroll-x"><table class="data sc-months"><tr>${r.months.map((x) => `<th>${x.m}月</th>`).join('')}</tr><tr>${r.months.map((x) => `<td>${x.hours}</td>`).join('')}</tr></table></div>
      <p class="hint">日向＝生育期に1日6時間以上、半日陰＝3〜6時間、日陰＝3時間未満。木の葉の茂りぐあいや、照り返しは計算に入っていません。</p>
      <div id="scToday" class="sc-today"></div>
      <div class="scx-fit">
        <h3 class="dn-h">${icon('leaf', 15)}植物はここで育つ？</h3>
        <div class="k-search"><input type="search" id="scPlantQ" list="scPlantList" placeholder="植物名（買う予定の植物など）" autocomplete="off"><button type="button" class="btn small" id="scPlantAdd">調べる</button></div>
        <datalist id="scPlantList">${[...new Map(PLANTS.map((p) => [p.ja, p])).keys()].map((n) => `<option value="${esc(n)}"></option>`).join('')}</datalist>
        ${g.plants.length ? `<div class="chips sc-mine">${g.plants.map((id) => byId.get(id)).filter(Boolean).map((p) => `<button type="button" class="chip${st.check.includes(p.id) ? ' on' : ''}" data-sccheck="${p.id}">${esc(p.groupJa.replace(/（.*?）/g, ''))}</button>`).join('')}</div><p class="hint" style="margin:0">↑ ${esc(g.name)}の植物をタップすると判定します（この場所に植えている植物の確認に）。</p>` : ''}
        <div id="scFitList"></div>
      </div>
      <div class="scx-find">
        <h3 class="dn-h">${icon('search', 15)}この日当たり（${SUN_JA[r.sun]}）で育つ植物</h3>
        ${(() => { const c = state.climate; const ok = PLANTS.filter((p) => p.sun.includes(r.sun) && (!c || evaluate(p, c).level >= 2)); const groups = [...new Map(ok.map((p) => [p.group, p])).values()]; const pick = groups.sort(() => 0).filter((p, i) => i % Math.max(1, Math.floor(groups.length / 12)) === 0).slice(0, 12);
          return `<p class="hint">図鑑の${groups.length}種（${ok.length}品種）が、この日当たり${c ? 'と地域の気候' : ''}に合います。</p><div class="chips">${pick.map((p) => `<button type="button" class="chip" data-find="${esc(p.groupJa)}"><span class="dot" style="background:${COLORS[p.color[0]].hex}"></span>${esc(p.groupJa.replace(/（.*?）/g, ''))}</button>`).join('')}</div>
          <button type="button" class="btn small" data-scfind="${r.sun}">${icon('book', 15)}図鑑で全部見る（日当たり：${SUN_JA[r.sun]}で絞り込み）</button>`; })()}
      </div>
      <div class="scx-save">
        <label class="field"><span class="label">この場所の名前（保存して、あとで見返したり測り直したりできます）</span><input type="text" id="scName" maxlength="30" value="${esc(spot?.name || '')}" placeholder="例：南の花壇の奥、玄関前の鉢"></label>
        <div class="row"><button type="button" class="btn primary" id="scSave">${icon('save', 15)}${spot ? '上書き保存' : 'この場所を保存'}</button>${fromPlan || state.view === 'plan' ? `<button type="button" class="btn" id="scUse">${icon('plan', 15)}「${SUN_JA[r.sun]}」としてプランに使う</button>` : ''}</div>
      </div>`;
    const curPts = pts;
    if ($('#scUse')) $('#scUse').onclick = () => { state.planInput.sun = r.sun; store.set('planInput', state.planInput); syncPlanSegs(); closeSheet(); toast(`日当たりを「${SUN_JA[r.sun]}」にしました（平均${r.avg}時間/日）`); };
    $('#scSave').onclick = () => {
      const name = $('#scName').value.trim() || `測った場所 ${(g.sunSpots || []).length + 1}`;
      g.sunSpots = g.sunSpots || [];
      const rec = { id: spot?.id || 'sun' + Date.now().toString(36), name, date: todayStr(), mode: $('#scManual').hidden ? 'sensor' : 'manual', points: curPts, plants: st.check };
      const i = g.sunSpots.findIndex((x) => x.id === rec.id);
      if (i >= 0) g.sunSpots[i] = rec; else g.sunSpots.push(rec);
      saveGardens();
      closeSheet();
      toast(`「${name}」を保存しました（マイ庭の「日当たり」で見返せます）`);
      if (state.view === 'garden') render();
    };
    const fit = () => {
      $('#scFitList').innerHTML = st.check.map((id) => { const p = byId.get(id); if (!p) return ''; const f = plantFit(p, r.sun, r.avg); const ev = state.climate ? evaluate(p, state.climate) : null;
        return `<div class="sc-fitrow lv${f.level}"><span class="mk">${f.mark}</span><div><b>${esc(p.ja)}</b><small>好む日当たり：${p.sun.map((x) => SUN_JA[x]).join('・')}。${esc(f.text)}${ev && ev.level < 3 ? `　気候：${LEVEL[ev.level].mark}${esc(ev.reasons[0] || '')}` : ''}</small></div><button type="button" class="icon-btn" data-scuncheck="${id}" aria-label="外す">✕</button></div>`; }).join('') || '<p class="hint" style="margin:0">植物名を入れるか、庭の植物をタップしてください。</p>';
    };
    fit();
    st.fit = fit;
    loadToday(curPts, r);
  };
  const loadToday = async (pts, r) => {
    const box = $('#scToday');
    if (!box) return;
    const now = new Date();
    const w = sunWindows(lat, lon, pts, now);
    const sn = sunNow(lat, lon, pts, now);
    const m = now.getMonth() + 1;
    const base = `<h3 class="dn-h">${icon('calendar', 15)}今日（${m}月${now.getDate()}日）のこの場所</h3>
      <p>直射日光が当たるのは <b>${w.wins.length ? w.wins.map((x) => `${clockJa(x.from)}〜${clockJa(x.to)}`).join('・') : '一日中ありません'}</b>（約${w.hours}時間）。${r.months[m - 1] ? `この時期の目安どおりです（月の平均${r.months[m - 1].hours}時間）。` : ''}</p>
      <p>いまは ${!sn.up ? '<b>日の出前・日の入り後</b>' : sn.lit ? `<b>日なた</b>（太陽は${dirJa(sn.az)}・高さ${sn.alt}°）` : `<b>日陰</b>（太陽は${dirJa(sn.az)}・高さ${sn.alt}°で、障害物の陰）`}。</p>`;
    box.innerHTML = base + '<p class="hint"><span class="spinner"></span>今日の天気（日射の予報）を調べています…</p>';
    let hourly = null;
    const key = `pg:light:${lat.toFixed(2)},${lon.toFixed(2)}`;
    try { const c = JSON.parse(sessionStorage.getItem(key) || 'null'); if (c && Date.now() - c.t < 3600e3) hourly = c.d; } catch { /* なし */ }
    if (!hourly) { try { hourly = await fetchLight(lat, lon); sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: hourly })); } catch { hourly = null; } }
    if (!$('#scToday')) return;
    const L = hourly ? lightToday(hourly, lat, lon, pts, now) : null;
    if (!L) { box.innerHTML = base + '<p class="hint">天気の予報を取得できませんでした（オフラインなど）。上の日照時間は、晴れた場合の計算です。</p>'; return; }
    const verdict = L.dli >= 20 ? '日向の植物にも十分な光の量' : L.dli >= 8 ? '半日陰の植物に向く光の量' : '日陰の植物に向く光の量';
    box.innerHTML = base + `<p>今日の天気は<b>${esc(L.sky)}</b>（雲量 平均${L.cloud}%）。${sn.up && L.nowLux != null ? `いまの明るさは推定 <b>約${L.nowLux >= 10000 ? (Math.round(L.nowLux / 1000) / 10) + '万' : L.nowLux.toLocaleString()}ルクス</b>（${esc(luxJa(L.nowLux))}）。` : ''}</p>
      <p>今日この場所に届く光の量は約<b>${L.dli}</b>（植物が使う光の1日の合計・mol/㎡）。さえぎるもののない場所（${L.openDli}）の<b>${L.ratio}%</b>で、${verdict}です。${[11, 12, 1, 2].includes(m) ? '冬は太陽が低く日も短いので、どこでも少なめになります。' : ''}</p>
      <div class="sc-hours">${L.hours.filter((x) => x.hr >= 5 && x.hr <= 19).map((x) => `<span title="${x.hr}時 約${x.w}W/㎡${x.lit ? '・日なた' : '・日陰'}" style="height:${Math.max(2, Math.min(100, x.w / 9))}%" class="${x.lit ? 'lit' : ''}"></span>`).join('')}</div>
      <div class="sc-hlab"><span>5時</span><span>12時</span><span>19時</span></div>
      <p class="hint">明るさと光の量は、気象予報の日射量とこの場所の障害物から計算した推定値です（iPhoneのブラウザからは照度センサーを使えないため）。色の濃い棒が直射日光の当たる時間。木の葉の茂りや壁の照り返しは含みません。</p>`;
  };
  const body = $('#sheetBody');
  // 保存した場所を開いたとき、方位ごとの入力を戻す
  if (spot?.mode === 'manual') for (const [, az] of DIR8) {
    const sel = body.querySelector(`[data-scaz="${az}"]`), v = st.manual[az];
    if (![...sel.options].some((o) => Number(o.value) === v)) sel.insertAdjacentHTML('beforeend', `<option value="${v}">記録した角度 ${v}°</option>`);
    sel.value = String(v);
  }
  body.onclick = (e) => {
    const m = e.target.closest('#scMode button');
    if (m) { body.querySelectorAll('#scMode button').forEach((b) => b.classList.toggle('on', b === m)); $('#scSensor').hidden = m.dataset.v !== 'sensor'; $('#scManual').hidden = m.dataset.v !== 'manual'; out(); return; }
    const d = e.target.closest('[data-scdel]');
    if (d) { st.points.splice(Number(d.dataset.scdel), 1); out(); return; }
    const ck = e.target.closest('[data-sccheck]');
    if (ck) { const id = ck.dataset.sccheck; st.check = st.check.includes(id) ? st.check.filter((x) => x !== id) : [...st.check, id]; ck.classList.toggle('on'); st.fit?.(); return; }
    const un = e.target.closest('[data-scuncheck]');
    if (un) { st.check = st.check.filter((x) => x !== un.dataset.scuncheck); body.querySelector(`[data-sccheck="${un.dataset.scuncheck}"]`)?.classList.remove('on'); st.fit?.(); return; }
    if (e.target.closest('#scPlantAdd')) {
      const q = $('#scPlantQ').value.trim();
      const p = PLANTS.find((x) => x.ja === q) || findPlant(q, []);
      if (!p) { toast('図鑑に見つかりませんでした'); return; }
      if (!st.check.includes(p.id)) st.check.push(p.id);
      $('#scPlantQ').value = '';
      st.fit?.();
      return;
    }
    const f = e.target.closest('[data-scfind]');
    if (f) { Object.assign(state.filters, { sun: f.dataset.scfind, moist: '', height: '', month: '', color: '', q: '', tag: '', family: '', type: '', use: '', role: '', origin: '' }); closeSheet(); go('plants'); saveFilters(); syncFilterUI(); }
  };
  body.oninput = (e) => {
    const az = e.target.dataset.scaz ?? e.target.dataset.sch ?? e.target.dataset.scd;
    if (az == null) return;
    const H = Number(body.querySelector(`[data-sch="${az}"]`).value), D = Number(body.querySelector(`[data-scd="${az}"]`).value);
    st.manual[az] = H > 0 && D > 0 ? angleOf(H, D) : Number(body.querySelector(`[data-scaz="${az}"]`).value);
    out();
  };
  body.onchange = (e) => { if (e.target.dataset.scaz != null) body.oninput(e); };
  const onOri = (e) => {
    let hd = e.webkitCompassHeading;
    if (hd == null && e.absolute && e.alpha != null) hd = (360 - e.alpha) % 360;
    if (hd == null || e.beta == null) return;
    st.heading = hd; st.alt = Math.max(0, e.beta - 90);
    $('#scRead').textContent = `方位 ${dirJa(hd)}（${Math.round(hd)}°）・見上げる角度 ${Math.round(st.alt)}°`;
    $('#scAdd').disabled = false;
  };
  $('#scStart').addEventListener('click', async () => {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const ok = await DeviceOrientationEvent.requestPermission();
        if (ok !== 'granted') throw new Error('許可されませんでした');
      }
      window.addEventListener('deviceorientationabsolute', onOri);
      window.addEventListener('deviceorientation', onOri);
      st.sensor = true;
      $('#scRead').textContent = 'スマホを縦に持って、障害物のてっぺんに向けてください';
      setTimeout(() => { if (st.heading == null) $('#scRead').textContent = '方位センサーの値が届きません。この端末では「方位ごとに入力する」を使ってください。'; }, 2500);
    } catch (err) { $('#scRead').textContent = `センサーを使えませんでした（${err.message || ''}）。「方位ごとに入力する」を使ってください。`; }
    try { camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); $('#scVideo').srcObject = camStream; } catch { /* カメラなしでも測れる */ }
  });
  $('#scAdd').addEventListener('click', () => { if (st.heading == null) return; st.points.push({ az: st.heading, alt: st.alt }); toast(`${dirJa(st.heading)}・${Math.round(st.alt)}°を記録しました`); out(); });
  const stop = () => { window.removeEventListener('deviceorientationabsolute', onOri); window.removeEventListener('deviceorientation', onOri); };
  $('#sheetClose').addEventListener('click', stop, { once: true });
  out();
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-suncheck]'); if (b) openSunCheck({ spotId: b.dataset.suncheck || '', from: b.dataset.from || '' }); });
/** 図鑑の絞り込みの表示を、いまの条件に合わせる */
function syncFilterUI() {
  document.querySelectorAll('#filters .seg').forEach((seg) => seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === (state.filters[seg.dataset.filter] || ''))));
}
/** マイ庭の「日当たり」タブ：保存した場所の一覧 */
function renderSunSpots() {
  const box = $('#sunBox');
  const g = activeGarden();
  const spots = g.sunSpots || [];
  const lat = state.loc?.lat ?? 35.7, lon = state.loc?.lon ?? 139.7;
  const SUN_JA = { full: '日向', part: '半日陰', shade: '日陰' };
  const now = new Date();
  box.innerHTML = `<div class="card">
    <h2>${icon('sun', 19)} 日当たり</h2>
    <p class="hint">庭のいろいろな場所で日当たりを測って保存できます。植物を買う前の下見や、いま植えている場所の光が足りているかの確認に。保存した場所は、今日の天気と時刻をふまえて判定し直します。</p>
    <button type="button" class="btn primary" data-suncheck="">${icon('plus', 15)}新しい場所を測る</button>
  </div>
  ${spots.length ? spots.map((sp) => {
    const r = sunReport(lat, sp.points);
    const w = sunWindows(lat, lon, sp.points, now);
    const sn = sunNow(lat, lon, sp.points, now);
    const plants = (sp.plants || []).map((id) => byId.get(id)).filter(Boolean);
    return `<div class="card sun-spot">
      <div class="ss-head"><div class="ss-art">${skyChartMini(lat, sp.points)}</div><div><h3>${esc(sp.name)}</h3>
        <p class="calc"><b class="ss-cls ${r.sun}">${SUN_JA[r.sun]}</b> 生育期の平均 ${r.avg}時間/日・冬至 ${r.winter}時間</p>
        <p class="calc">今日 ${w.hours}時間（${w.wins.map((x) => `${clockJa(x.from)}〜${clockJa(x.to)}`).join('・') || 'なし'}）・いまは${!sn.up ? '夜' : sn.lit ? '日なた' : '日陰'}</p>
        <small class="muted">${esc(dateJa(sp.date))}に測定</small></div></div>
      ${plants.length ? `<div class="ss-fit">${plants.map((p) => { const f = plantFit(p, r.sun, r.avg); return `<span class="chip lv${f.level}" title="${esc(f.text)}">${f.mark} ${esc(p.groupJa.replace(/（.*?）/g, ''))}</span>`; }).join('')}</div>` : ''}
      <div class="row"><button type="button" class="btn small" data-suncheck="${sp.id}">${icon('search', 14)}くわしく・今日の判定</button><button type="button" class="btn small" data-scfind="${r.sun}" data-scfindgo>${icon('book', 14)}育つ植物を図鑑で</button><button type="button" class="icon-btn" data-sundel="${sp.id}" aria-label="削除">${icon('trash', 16)}</button></div>
    </div>`;
  }).join('') : '<p class="hint" style="padding:0 4px">まだ保存した場所はありません。</p>'}`;
}
/** 小さな空の図（一覧用） */
function skyChartMini(lat, points) {
  const R = 34, C = 38, h = horizonFn(points);
  const xy = (az, alt) => { const r = ((90 - Math.max(0, alt)) / 90) * R; const a = (az * Math.PI) / 180; return [C + r * Math.sin(a), C - r * Math.cos(a)]; };
  const sky = []; for (let az = 0; az <= 360; az += 6) sky.push(xy(az, h(az)));
  const path = (mo, d, col) => { const pts = sunPath(lat, declination(new Date(2026, mo, d))).filter((p) => p.alt >= 0); return `<path d="M${pts.map((p) => xy(p.az, p.alt).map((v) => v.toFixed(1)).join(',')).join('L')}" fill="none" stroke="${col}" stroke-width="1.6"/>`; };
  return `<svg viewBox="0 0 76 76" width="76" height="76" aria-hidden="true"><circle cx="${C}" cy="${C}" r="${R}" fill="#dcebf5"/><path d="M${C - R},${C}a${R},${R} 0 1,0 ${2 * R},0a${R},${R} 0 1,0 ${-2 * R},0Z M${sky.map((p) => p.map((v) => v.toFixed(1)).join(',')).join('L')}Z" fill="#8a7a5a" fill-opacity=".55" fill-rule="evenodd"/>${path(5, 21, '#e9852f')}${path(11, 22, '#5b8ee6')}<text x="${C}" y="9" text-anchor="middle" font-size="8" fill="currentColor">北</text></svg>`;
}
document.addEventListener('click', (e) => {
  const d = e.target.closest('[data-sundel]');
  if (d) { const g = activeGarden(); const sp = (g.sunSpots || []).find((x) => x.id === d.dataset.sundel); if (sp && confirm(`「${sp.name}」を削除しますか？`)) { g.sunSpots = g.sunSpots.filter((x) => x !== sp); saveGardens(); renderSunSpots(); } return; }
  const f = e.target.closest('[data-scfindgo]');
  if (f) { Object.assign(state.filters, { sun: f.dataset.scfind, moist: '', height: '', month: '', color: '', q: '', tag: '', family: '', type: '', use: '', role: '', origin: '' }); go('plants'); saveFilters(); syncFilterUI(); }
});

// ---------- iPhone のショートカット・Siri との連携 ----------
/** URL の ?do=… を実行（ショートカットや NFC タグから開いたとき） */
async function handleURLAction() {
  const a = parseAction(location.search);
  if (!a) return;
  try { history.replaceState(null, '', location.pathname); } catch { /* 古いブラウザ */ }
  if (a.garden && state.gardens.some((g) => g.id === a.garden)) { state.gardenId = a.garden; saveGardens(); }
  const g = activeGarden();
  if (a.act === 'water') {
    const plant = a.plant ? (byId.get(a.plant) || findPlant(a.plant, g.plants.map((id) => byId.get(id)).filter(Boolean))) : null;
    await saveNote({ id: Date.now().toString(36), date: todayStr(), plants: plant ? [plant.id] : [], events: ['water'], text: a.memo, garden: g.name, gardenId: g.id, from: 'link' });
    await loadDiary();
    render();
    toast(`${plant ? plant.ja + 'の' : ''}水やりを記録しました（${g.name}）。園芸ノートで確認・削除できます`);
  } else if (a.act === 'record') openRecord(a.plant);
  else if (a.act === 'tasks') go('tasks');
  else if (a.act === 'doctor') openDoctor(a.plant);
  else if (a.act === 'sun') openSunCheck();
  else if (a.act === 'photo') openFixedCamera(a.spot);
  else go('site');
}
/** ショートカットでためた記録ファイルを取り込む */
async function importShortcutLog(file) {
  const text = await file.text();
  const rows = parseShortcutLog(text);
  if (!rows.length) { toast('記録が見つかりませんでした。1行に「日付,できごと」の形で書かれているか確かめてください'); return; }
  const done = new Set(store.get('importedLog', []));
  const g = activeGarden();
  const mine = g.plants.map((id) => byId.get(id)).filter(Boolean);
  let n = 0;
  for (const r of rows) {
    if (done.has(r.key)) continue;
    const plant = r.plantName ? findPlant(r.plantName, mine) : null;
    await saveNote({ id: Date.now().toString(36) + n, date: r.date, plants: plant ? [plant.id] : [], events: r.event ? [r.event] : [], text: [r.time && `${r.time}`, r.event ? '' : r.eventText, r.memo].filter(Boolean).join(' '), garden: g.name, gardenId: g.id, from: 'shortcut' });
    done.add(r.key); n++;
  }
  store.set('importedLog', [...done].slice(-3000));
  await loadDiary();
  render();
  toast(n ? `${n}件の記録を「${g.name}」のノートに取り込みました（取り込み済みの${rows.length - n}件は省きました）` : 'すべて取り込み済みでした');
}
function openLinks() {
  const base = location.origin + location.pathname;
  const g = activeGarden();
  const murl = state.loc ? morningURL(state.loc.lat, state.loc.lon) : '';
  const copyRow = (label, text) => `<div class="lk-row"><span>${esc(label)}</span><code>${esc(text)}</code><button type="button" class="btn small" data-copytext="${esc(text)}">コピー</button></div>`;
  openSheet(`${icon('steps', 19)} iPhoneのショートカット・Siriと連携`, `<div class="links">
    <p class="hint">iPhoneに最初から入っている「ショートカット」アプリと組み合わせると、Siriやタグで記録したり、毎朝の水やり通知を受け取れたりします。料金はかかりません。</p>

    <h3>① 毎朝の水やり通知</h3>
    ${state.loc ? `<ol class="lk-steps">
      <li>ショートカットアプリの「オートメーション」→「＋」→「時刻」で、毎朝7:00などを選び、「すぐに実行」にする。</li>
      <li>アクション「URLの内容を取得」を追加し、下のURL（あなたの庭の場所の今日の予報）を貼る。${copyRow('予報のURL', murl)}</li>
      <li>「辞書の値を取得」でキー <b>daily</b> → もう一度「辞書の値を取得」でキー <b>precipitation_sum</b> → 「リストから項目を取得」で<b>最初の項目</b>（今日の雨の予報 mm）。</li>
      <li>「if」で「が次より大きい 4」のとき「通知を表示」＝「今日は雨の予報。水やりはお休み」、それ以外は「通知を表示」＝「雨が少ない日。鉢植えは土を触って水やりを」。</li>
    </ol>` : '<p class="hint">先に庭の場所を設定すると、ここに予報のURLが表示されます。</p>'}

    <h3>② 「Hey Siri、水やりした」で記録</h3>
    <ol class="lk-steps">
      <li>ショートカットアプリで新しいショートカットを作り、名前を「水やりした」にする（Siriにこの名前で頼めるようになる）。</li>
      <li>アクション「テキスト」に「現在の日付」（形式は「ISO 8601」）と「,水やり」を入れる。植物を決めたいときは「,水やり,ラベンダー」。</li>
      <li>アクション「ファイルに追加」で、iCloud Drive の「Shortcuts」フォルダの <b>garden-log.txt</b> に追加（「新しい行に追加」をオン）。</li>
      <li>ときどき、このアプリで下の「ショートカットの記録を取り込む」を押して、garden-log.txt を選ぶ。取り込み済みの行は二重に入りません。</li>
    </ol>
    <p class="hint">「植え付け」「咲き始め」など、ノートのできごとの名前ならほかの記録にも使えます。</p>
    <label class="btn primary" for="lkImport">${icon('note', 15)}ショートカットの記録を取り込む</label><input type="file" id="lkImport" accept=".txt,.csv,text/plain" hidden>

    <h3>③ NFCタグにタッチして記録</h3>
    <p>市販のNFCタグ（シール）を鉢や水栓に貼り、ショートカットアプリの「オートメーション」→「NFC」でタグを読み取らせ、②のショートカットを実行するよう設定します。タッチするだけで記録されます。</p>

    <h3>④ URLで開く（Safariでこのアプリを使っている場合）</h3>
    <p class="hint">ショートカットの「URLを開く」はSafariで開きます。iPhoneでは、ホーム画面に追加したアプリとSafariとで、保存されるデータが別になります。ホーム画面のアプリで使っているときは、②の方法がおすすめです。</p>
    ${copyRow(ACTIONS.water, `${base}?do=water`)}
    ${copyRow('ラベンダーの水やりを記録', `${base}?do=water&plant=${encodeURIComponent('ラベンダー')}`)}
    ${copyRow(ACTIONS.record, `${base}?do=record`)}
    ${copyRow(ACTIONS.tasks, `${base}?do=tasks`)}
    ${copyRow(ACTIONS.photo, `${base}?do=photo`)}
    ${copyRow(ACTIONS.sun, `${base}?do=sun`)}
    <p class="hint">記録は、いま選んでいる庭（${esc(g.name)}）に入ります。</p>
  </div>`, 'sheet-links');
  $('#lkImport').addEventListener('change', async (e) => { const f = e.target.files[0]; if (f) { await importShortcutLog(f); closeSheet(); } });
}
document.addEventListener('click', async (e) => {
  const c = e.target.closest('[data-copytext]');
  if (c) { toast((await copyText(c.dataset.copytext)) ? 'コピーしました' : 'コピーできませんでした'); return; }
  if (e.target.closest('[data-links]')) openLinks();
});

// ---------- セミオート（枠ごとに植物を選ぶ） ----------
const sizeJa = (p) => `高さ${p.h[0]}〜${p.h[1]}cm・株張り${p.spread}cm`;
function slotsHtml(plan) {
  const n = Object.keys(state.planInput.swaps || {}).length;
  return `<section class="mag paper" id="sec-slots">
    ${secHead('Choose Plants', '植物を選ぶ（セミオート）', `役割と大きさに合わせて${plan.species.length}つの枠を用意しました。いまはアプリのおすすめが入っています。「選ぶ」で、同じ役割に合う候補から好きな植物にできます。配置と株数は、選んだ植物に合わせて自動で直します。`)}
    <ol class="slots">${plan.species.map((sp) => `<li class="slot${sp.chosen ? ' chosen' : ''}" id="slot-${sp.no}">
      <span class="sl-no">${sp.no}</span>
      <div class="sl-photo">${photoHtml(sp.plant, 'slot-photo', sp.color)}</div>
      <div class="sl-body"><span class="role">${esc(sp.roleJa)}</span><b>${esc(sp.plant.ja)}</b>
        <small>枠の目安：${esc(sizeJa(sp.plant))}・${sp.qty}${sp.plant.type === 'bulb' ? '球' : '株'}</small>
        ${sp.chosen ? '<em>自分で選んだ植物</em>' : ''}</div>
      <button type="button" class="btn small primary" data-swap="${sp.no}">選ぶ</button>
    </li>`).join('')}</ol>
    ${n ? `<div class="row"><button type="button" class="btn small" data-swapreset>${icon('refresh', 14)}選んだ植物をすべておまかせに戻す（${n}件）</button></div>` : ''}
  </section>`;
}
function openSwap(no) {
  const plan = state.plan;
  const sp = plan?.species.find((x) => x.no === no);
  if (!sp) return;
  const cands = slotCandidates(plan, no, { climate: state.climate, annuals: state.planInput.annuals });
  const orig = byId.get(sp.orig);
  openSheet(`${no}番の枠：${esc(sp.roleJa)}`, `<div class="swap">
    <p class="hint">いまの植物：<b>${esc(sp.plant.ja)}</b>（${esc(sizeJa(sp.plant))}）。同じ日当たり・土・気候で育ち、この枠の役割と大きさに合う植物です。</p>
    ${sp.chosen && orig ? `<button type="button" class="btn small" data-swapto="${orig.id}" data-no="${no}">${icon('refresh', 14)}おすすめ（${esc(orig.ja)}）に戻す</button>` : ''}
    <div class="swap-filter chips">${['すべて', '同じ形', '同じ色', '同じ時期に咲く'].map((f, i) => `<button type="button" class="chip${i ? '' : ' on'}" data-swf="${f}">${f}</button>`).join('')}</div>
    <div class="swap-grid">${cands.map((c) => `<button type="button" class="swap-card" data-swapto="${c.p.id}" data-no="${no}" data-same="${c.same.join(' ')}">
      ${photoHtml(c.p, 'swap-photo', c.p.color[0])}
      <b>${esc(c.p.ja)}</b>
      <small>${c.p.h[0]}〜${c.p.h[1]}cm・${c.p.color.map((x) => COLORS[x].ja).join('/')}${c.level ? `・${LEVEL[c.level].mark}` : ''}</small>
      ${c.same.length ? `<span class="sw-same">${esc(c.same.join('・'))}</span>` : ''}
    </button>`).join('') || '<p class="hint">この枠に合うほかの候補が見つかりませんでした。日当たりや土の条件をゆるめると候補が増えます。</p>'}</div>
  </div>`, 'sheet-swap');
  hydratePhotos($('#sheetBody'), cands.map((c) => c.p));
}
document.addEventListener('click', (e) => {
  const sw = e.target.closest('[data-swap]');
  if (sw) { openSwap(Number(sw.dataset.swap)); return; }
  const f = e.target.closest('[data-swf]');
  if (f) {
    f.parentElement.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === f));
    document.querySelectorAll('.swap-card').forEach((c) => { c.hidden = f.dataset.swf !== 'すべて' && !c.dataset.same.includes(f.dataset.swf); });
    return;
  }
  const to = e.target.closest('[data-swapto]');
  if (to) {
    const plan = state.plan;
    const sp = plan.species.find((x) => x.no === Number(to.dataset.no));
    const pi = state.planInput;
    pi.swaps = { ...(pi.swaps || {}) };
    if (to.dataset.swapto === sp.orig) delete pi.swaps[sp.orig]; else pi.swaps[sp.orig] = to.dataset.swapto;
    store.set('planInput', pi);
    closeSheet();
    computePlan();
    renderPlan();
    const nsp = state.plan.species.find((x) => x.orig === sp.orig);
    toast(`${byId.get(to.dataset.swapto)?.ja || ''}にしました。配置と株数を直しました`);
    if (nsp) setTimeout(() => jumpTo(pi.pick === 'semi' ? `slot-${nsp.no}` : `cast-${nsp.no}`), 100);
    return;
  }
  if (e.target.closest('[data-swapreset]')) {
    state.planInput.swaps = {};
    store.set('planInput', state.planInput);
    computePlan(); renderPlan();
    toast('おまかせの植物に戻しました');
  }
});

// ---------- こだわり設定 ----------
const K_DEFAULT = { must: [], exclude: [], colors: [], colorMode: 'prefer', leafs: [], density: 'standard', variety: 'standard', maxH: 0, months: [], winter: false };
/** こだわり設定の値（何も変えていなければ undefined＝おまかせ） */
function kOpts(pi) {
  const k = { ...K_DEFAULT, ...(pi.k || {}) };
  return JSON.stringify(k) === JSON.stringify(K_DEFAULT) ? undefined : k;
}
const LEAF_PICK = { silver: '銀葉', bronze: '銅葉', gold: '黄金葉', variegated: '斑入り', blue: '青みの葉' };
function kSummaryText(k) {
  const t = [];
  if (k.must.length) t.push(`入れたい${k.must.length}種`);
  if (k.exclude.length) t.push(`避けたい${k.exclude.length}種`);
  if (k.colors.length) t.push(`${k.colors.map((c) => COLORS[c].ja).join('・')}${k.colorMode === 'only' ? 'だけ' : '中心'}`);
  if (k.leafs.length) t.push(k.leafs.map((x) => LEAF_PICK[x]).join('・'));
  if (k.density !== 'standard') t.push(`密度：${DENSITY[k.density].ja}`);
  if (k.variety !== 'standard') t.push(`種類：${VARIETY[k.variety].ja}`);
  if (k.maxH) t.push(`${k.maxH}cmまで`);
  if (k.months.length) t.push(`${monthsJa(k.months)}に咲かせる`);
  if (k.winter) t.push('冬も楽しむ');
  return t.join('・') || '入れたい植物・色・密度・種類の数など（おまかせ）';
}
function renderKodawari() {
  const pi = state.planInput;
  const k = (pi.k = { ...K_DEFAULT, ...(pi.k || {}) });
  const chip = (id, list) => { const p = byId.get(id); return p ? `<span class="chip on k-pl"><span class="dot" style="background:${COLORS[p.color[0]].hex}"></span>${esc(p.ja)}<button type="button" data-kdel="${list}|${id}" aria-label="${esc(p.ja)}を外す">×</button></span>` : ''; };
  const seg = (key, table) => `<div class="seg small" data-kseg="${key}">${Object.entries(table).map(([v, x]) => `<button type="button" data-v="${v}" class="${String(k[key]) === v ? 'on' : ''}">${esc(x.ja || x)}</button>`).join('')}</div>`;
  $('#kBody').innerHTML = `
    <div class="k-row"><span class="label">入れたい植物（必ず使う）</span>
      <div class="k-search"><input type="search" id="kMustQ" list="kPlantList" placeholder="植物名で探す（例：ガザニア）" autocomplete="off"><button type="button" class="btn small" data-kadd="must">追加</button></div>
      <div class="chips">${k.must.map((id) => chip(id, 'must')).join('') || '<span class="hint">指定なし</span>'}</div></div>
    <div class="k-row"><span class="label">避けたい植物</span>
      <div class="k-search"><input type="search" id="kExQ" list="kPlantList" placeholder="植物名で探す" autocomplete="off"><button type="button" class="btn small" data-kadd="exclude">追加</button></div>
      <div class="chips">${k.exclude.map((id) => chip(id, 'exclude')).join('') || '<span class="hint">指定なし</span>'}</div></div>
    <div class="k-row"><span class="label">花の色</span>
      <div class="chips">${Object.entries(COLORS).filter(([c]) => c !== 'green').map(([c, v]) => `<button type="button" class="chip${k.colors.includes(c) ? ' on' : ''}" data-kcolor="${c}"><span class="dot" style="background:${v.hex}"></span>${v.ja}</button>`).join('')}</div>
      ${seg('colorMode', { prefer: '中心に使う', only: 'この色だけ' })}</div>
    <div class="k-row"><span class="label">葉の色を入れる</span>
      <div class="chips">${Object.entries(LEAF_PICK).map(([c, v]) => `<button type="button" class="chip${k.leafs.includes(c) ? ' on' : ''}" data-kleaf="${c}">${v}</button>`).join('')}</div></div>
    <div class="k-row"><span class="label">植栽密度</span>${seg('density', DENSITY)}<p class="hint">標準は、育つと株どうしが触れ合う密度。密植は早く地面が埋まりますが、苗代が増えます。</p></div>
    <div class="k-row"><span class="label">種類の数</span>${seg('variety', VARIETY)}</div>
    <div class="k-row"><span class="label">いちばん高い植物</span>${seg('maxH', { 0: '制限なし', 60: '60cmまで', 90: '90cmまで', 120: '120cmまで', 150: '150cmまで' })}</div>
    <div class="k-row"><span class="label">とくに咲かせたい月</span>
      <div class="chips k-months">${MONTHS.map((m) => `<button type="button" class="chip${k.months.includes(m) ? ' on' : ''}" data-kmonth="${m}">${m}月</button>`).join('')}</div></div>
    <label class="toggle"><input type="checkbox" id="kWinter" ${k.winter ? 'checked' : ''}> 冬も楽しむ（常緑・種の頭・枯れ姿の美しい植物を優先）</label>
    <div class="row"><button type="button" class="btn small" data-kreset>${icon('refresh', 14)}こだわりをリセット</button></div>
    <datalist id="kPlantList">${PLANTS.filter((p) => !p.custom).map((p) => `<option value="${esc(p.ja)}"></option>`).join('')}</datalist>`;
  $('#kSummary').textContent = kSummaryText(k);
  $('#kodawari').classList.toggle('set', !!kOpts(pi));
}
function initKodawari() {
  renderKodawari();
  const box = $('#kodawari');
  const save = () => { store.set('planInput', state.planInput); renderKodawari(); };
  const addBy = (list, q) => {
    const name = q.trim();
    if (!name) return;
    const p = PLANTS.find((x) => x.ja === name) || PLANTS.find((x) => x.ja.includes(name) || x.aka?.some((a) => a.includes(name)));
    if (!p) { toast('図鑑に見つかりませんでした'); return; }
    const k = state.planInput.k;
    if (!k[list].includes(p.id)) k[list].push(p.id);
    if (list === 'must') k.exclude = k.exclude.filter((x) => x !== p.id); else k.must = k.must.filter((x) => x !== p.id);
    save();
  };
  box.addEventListener('click', (e) => {
    const k = state.planInput.k;
    const t = e.target.closest('[data-kadd],[data-kdel],[data-kcolor],[data-kleaf],[data-kmonth],[data-kseg] button,[data-kreset]');
    if (!t) return;
    if (t.dataset.kadd) { addBy(t.dataset.kadd, $(t.dataset.kadd === 'must' ? '#kMustQ' : '#kExQ').value); return; }
    if (t.dataset.kdel) { const [l, id] = t.dataset.kdel.split('|'); k[l] = k[l].filter((x) => x !== id); }
    else if (t.dataset.kcolor) { const c = t.dataset.kcolor; k.colors = k.colors.includes(c) ? k.colors.filter((x) => x !== c) : [...k.colors, c]; }
    else if (t.dataset.kleaf) { const c = t.dataset.kleaf; k.leafs = k.leafs.includes(c) ? k.leafs.filter((x) => x !== c) : [...k.leafs, c]; }
    else if (t.dataset.kmonth) { const m = Number(t.dataset.kmonth); k.months = k.months.includes(m) ? k.months.filter((x) => x !== m) : [...k.months, m].sort((a, b) => a - b); }
    else if (t.hasAttribute('data-kreset')) state.planInput.k = { ...K_DEFAULT };
    else { const key = t.closest('[data-kseg]').dataset.kseg; k[key] = key === 'maxH' ? Number(t.dataset.v) : t.dataset.v; }
    save();
  });
  box.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('#kMustQ,#kExQ')) { e.preventDefault(); addBy(e.target.id === 'kMustQ' ? 'must' : 'exclude', e.target.value); } });
  box.addEventListener('change', (e) => {
    if (e.target.id === 'kWinter') { state.planInput.k.winter = e.target.checked; save(); }
  });
}

/** 保存した案を開いたとき、入力欄を案の内容に戻す */
function fillPlanForm() {
  const pi = state.planInput;
  $('#planText').value = pi.text || '';
  $('#planW').value = pi.width; $('#planD').value = pi.depth;
  $('#planBudget').value = pi.budget || '';
  $('#planAnnuals').checked = !!pi.annuals; $('#planGround').checked = !!pi.ground;
  $('#planSkill').value = SKILLS[pi.skill] ? pi.skill : 'standard'; $('#planSkillHint').textContent = SKILLS[$('#planSkill').value].text;
  $('#balW').value = pi.balcony.width; $('#balD').value = pi.balcony.depth; $('#balFloor').value = pi.balcony.floor;
  $('#balRailH').value = pi.balcony.railH; $('#balCeil').value = pi.balcony.ceilH; $('#balShelf').value = String(pi.balcony.shelf);
  $('#balHang').checked = !!pi.balcony.hang; $('#balWater').checked = !!pi.balcony.water;
  $('#siteW').value = pi.site.width; $('#siteD').value = pi.site.depth; $('#siteArea').value = pi.site.area || '';
  $('#planStyle').value = pi.style || 'border';
  $('#planStyle').dispatchEvent(new Event('change'));
  const sb = state.siteBed; syncPlanSegs(); state.siteBed = sb;
  syncPresetChips();
  renderKodawari();
}
function readPlanForm() {
  const pi = state.planInput;
  pi.text = $('#planText').value.trim();
  pi.width = Math.min(30, Math.max(0.5, parseFloat($('#planW').value) || 3));
  pi.depth = Math.min(10, Math.max(0.4, parseFloat($('#planD').value) || 1.2));
  pi.budget = $('#planBudget').value;
  pi.annuals = $('#planAnnuals').checked;
  pi.skill = $('#planSkill').value;
  pi.ground = $('#planGround').checked;
  const B = pi.balcony;
  B.width = Math.min(20, Math.max(1, parseFloat($('#balW').value) || 3.6));
  B.depth = Math.min(4, Math.max(0.6, parseFloat($('#balD').value) || 1.2));
  B.floor = Math.min(60, Math.max(1, parseInt($('#balFloor').value, 10) || 2));
  B.railH = Math.min(160, Math.max(60, parseInt($('#balRailH').value, 10) || 110));
  B.ceilH = Math.min(400, Math.max(200, parseInt($('#balCeil').value, 10) || 250));
  B.shelf = Number($('#balShelf').value) || 0;
  B.hang = $('#balHang').checked; B.water = $('#balWater').checked;
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
  pi.swaps = {}; // 新しい案では、セミオートで選んだ植物をリセット
  store.set('planInput', pi);
  computePlan();
  state.planMonth = state.plan?.peak ?? 6;
  renderPlan();
  scrollToResult();
}
/** 生成した結果の見出しへ移動（写真の読み込みで位置がずれても、もう一度合わせる） */
function scrollToResult() {
  const go = () => { const h = document.querySelector('#planBox .plan-hero, #planBox .site-hero, #planBox .bal-hero, #planBox'); if (!h) return; const top = h.getBoundingClientRect().top + window.scrollY - (document.querySelector('.app-header')?.offsetHeight || 64) - 6; window.scrollTo({ top, behavior: 'auto' }); };
  requestAnimationFrame(go);
  setTimeout(go, 350);
  setTimeout(go, 1000);
}
function computePlan() {
  const pi = state.planInput;
  if (pi.mode === 'balcony') {
    state.balcony = generateBalcony({ ...pi.balcony, roof: pi.balcony.roof !== 'no', text: planText(pi), style: pi.style, wild: pi.wild, climate: state.climate, lat: state.loc?.lat ?? 35.7, seed: pi.seed, annuals: pi.annuals, budget: pi.budget });
    state.plan = null;
    return;
  }
  if (pi.mode === 'site') {
    state.site = generateSite({ ...pi.site, items: pi.items, wild: pi.wild, roles: pi.ground ? ['groundcover'] : [], text: planText(pi), style: pi.style, sun: pi.sun, moist: pi.moist, climate: state.climate, seed: pi.seed, layoutSeed: pi.layoutSeed, annuals: pi.annuals, budget: pi.budget, k: kOpts(pi), skill: pi.skill });
    state.siteBed = null;
    state.plan = null;
    return;
  }
  state.plan = generatePlan({ ...pi, text: planText(pi), k: kOpts(pi), roles: pi.ground ? ['groundcover'] : [], climate: state.climate });
}

function renderPlan() {
  const box = $('#planBox');
  if (state.planInput.mode === 'site' && !state.siteBed) { renderSitePlan(); return; }
  if (state.planInput.mode === 'balcony') { renderBalconyPlan(); return; }
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
        ${tocHtml([...(!bedOfSite && state.planInput.pick === 'semi' ? [['sec-slots', '植物を選ぶ']] : []), ['sec-cast', '植物'], ['sec-roles', '役割'], ['sec-design', 'デザイン'], ['sec-planview', '配置図'], ['sec-relay', '開花'], ['sec-wildlife', '生き物'], ['sec-estimate', '費用']])}
      </div>
    </section>

    <div class="figures">
      <div><span class="fig">${plan.species.length}</span><span class="cap">種類・${plan.totalPlants}株</span></div>
      <div><span class="fig">${Math.round(plan.area * 10) / 10}<small>㎡</small></span><span class="cap">${plan.shape && plan.shape !== 'rect' ? BED_SHAPES[plan.shape].ja + '・' : ''}${plan.width}×${plan.depth}m・${SUN[plan.sun]}</span></div>
      <div><span class="fig">${yen(c.total)}</span><span class="cap">概算・1㎡ ${yen(c.perSqm)}</span></div>
    </div>
    <p class="pnote ${relayText(plan.counts).zero.length ? 'warn' : 'ok'}">${esc(relayText(plan.counts).text)}</p>
    ${plan.peakNote ? `<p class="pnote ${plan.peakNote.ok ? 'ok' : 'warn'}">${esc(plan.peakNote.text)}</p>` : ''}
    <details class="basis"><summary>${icon('guide', 14)}数字の根拠</summary><ul>
      <li><b>株数：</b>植物ごとの育ったときの株張りの約0.85倍の間隔で、花壇の形の中に並べた数です（こだわり設定の密度で変わります）。</li>
      <li><b>植物の適合度：</b>◎よく育つ／○工夫すれば育つ／△難しい。この場所の過去10年の気象から求めた耐寒性ゾーン（${esc(state.climate?.zone.label || '—')}）・夏の暑さ・蒸し暑さを、植物ごとの耐寒・耐暑・蒸れへの強さと比べて判定しています。</li>
      <li><b>費用：</b>9〜10.5cmポット苗（球根は1球）の一般的な価格と、土づくり・マルチの材料費の目安です。</li>
    </ul></details>

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
      ${imageSlot('style', plan.style, styleArt(plan.style), stylePrompt(plan.style, plan))}
      <ol class="steps-num">${STYLES[plan.style].principles.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
    </section>
    ${plan.k ? `<div class="k-applied"><b>${icon('list', 15)}こだわり設定</b><span>${esc(kSummaryText({ ...K_DEFAULT, ...plan.k }))}</span></div>` : ''}
    ${state.climate ? skillSummary(plan.skill, plan.species.map((sp) => sp.grade)) : ''}
    ${plan.warnings?.length ? `<div class="alert warn">${plan.warnings.map(esc).join('<br>')}${plan.warnings.some((w) => /苦手です|育てにくい植物です/.test(w)) ? '指定どおり入れていますが、植える場所や鉢植えで工夫してください。' : ''}</div>` : ''}

    ${!bedOfSite && state.planInput.pick === 'semi' ? slotsHtml(plan) : ''}

    <section class="mag" id="sec-cast">
      ${secHead('Planting List', '植える植物')}
      <div class="cast">${plan.species.map((sp) => `<article class="cast-card" id="cast-${sp.no}">
        <div class="cast-art">${photoHtml(sp.plant, 'cast-photo', sp.color)}<span class="no">${sp.no}</span></div>
        <div class="cbody">
          <span class="role">${esc(sp.roleJa)}</span>
          <h3>${esc(sp.plant.ja)}</h3>
          <p class="latin">${esc(sp.plant.latin)}</p>
          <p class="calc"><span class="dot" style="background:${COLORS[sp.color].hex};width:9px;height:9px"></span> ${COLORS[sp.color].ja}・${sp.plant.h[0]}〜${sp.plant.h[1]}cm ${gradeBadge(sp, true)}</p>
          ${monthBar({ ...sp.plant, color: [sp.color] }, south)}
          <p class="calc">${sp.qty}株 × ${yen(sp.plant.price)} = <b>${yen(sp.subtotal)}</b></p>
          <p class="grow-mini">植え時 ${esc(monthsJa(plantingTime(sp.plant, state.climate).plant.best))}</p>${growHtml(sp.plant, true)}
          <div class="why${sp.challenge ? ' challenge' : ''}">${sp.why.map((w) => `<span>${esc(w)}</span>`).join('')}</div>
          ${sp.plant.roles?.length ? `<div class="rolerow small">${sp.plant.roles.slice(0, 3).map((k) => `<span class="role-chip">${esc(ROLES[k].ja)}</span>`).join('')}${sp.plant.soc ? `<span class="role-chip soc">${esc(SOC_JA[sp.plant.soc])}</span>` : ''}</div>` : ''}
          ${bedOfSite ? '' : `<button type="button" class="btn small swap-btn" data-swap="${sp.no}">${icon('refresh', 14)}ほかの植物に替える</button>`}
        </div>
      </article>`).join('')}</div>
    </section>

    <section class="mag" id="sec-roles">
      ${secHead('Planting Roles', '植栽の役割', 'それぞれの植物が花壇の中でどんな役目を果たしているか。バランスがよいと、季節を通して形が整います。')}
      ${roleBalanceHtml(plan)}
    </section>

    <section class="mag paper" id="sec-design">
      ${secHead('Design Notes', 'デザイナーの視点', 'この花壇の設計の考え方と、植栽の数字。')}
      ${designNotes(plan.species.map((sp) => ({ plant: sp.plant, qty: sp.qty, color: sp.color, role: sp.role })), { area: plan.area, organic: plan.shape && plan.shape !== 'rect' ? true : null, scope: 'bed', style: plan.style })}
    </section>

    <section class="mag paper" id="sec-planview">
      ${secHead('Planting Plan', '配置図（植栽図）', '濃い点が苗を植える位置（1点＝1株）、まわりのうすい色が育ったときの広がり。同じ色のまとまりが1つの群れです。番号をタップすると植物の説明へ移動します。')}
      <div class="scroll-x plan-scroll">${planSVG(plan)}</div>
      ${planLegend(plan)}
      ${plantingSteps(plan)}
    </section>

    <section class="mag" id="sec-relay">
      ${secHead('Bloom Relay', '開花リレー', '植物名をタップすると、その植物の説明へ移動します。')}
      <div class="scroll-x">${calHtml(plan.species.map((sp) => ({ p: sp.plant, color: sp.color, label: sp.no, jump: `cast-${sp.no}` })), south, plan.counts)}</div>
    </section>

    <section class="mag" id="sec-wildlife">
      ${secHead('Wildlife', '来てくれる生き物', plan.wild?.length ? `「${plan.wild.map((g) => WILD_GOALS[g]).join('・')}」を呼べるよう、食草や蜜源になる植物を優先しました。` : 'この花壇の植物に集まりそうな生き物と、生物多様性度の目安です。')}
      ${bioHtml(bio)}
      ${crittersHtml(crit, south, 8, seenSet())}
      ${webHtml(crit, plan.species.map((sp) => sp.plant), planFeatures())}
    </section>
    ${plan.harvest?.some(Boolean) ? `<section class="mag">
      ${secHead('Harvest', '収穫カレンダー', '野菜やハーブを収穫できる月の目安です。')}
      <div class="scroll-x">${harvestCal(plan.species.filter((sp) => sp.plant.harvest?.length).map((sp) => sp.plant), south)}</div>
    </section>` : ''}

    <section class="mag receipt" id="sec-estimate">
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
      <button class="btn" type="button" data-print>${icon('note', 16)}印刷する</button>
      <button class="btn" type="button" data-copysum>${icon('list', 16)}プランの概要をコピー</button>
      <button class="btn" type="button" data-consult="${esc(`${plan.width}×${plan.depth}mの花壇（${(STYLES[plan.style]?.ja || '').replace(/（.*?）/g, '')}）に、${plan.species.slice(0, 10).map((sp) => sp.plant.groupJa.replace(/（.*?）/g, '')).join('・')}を植えるプランです。もっとよくするアイデアと、育てるときの注意点を教えてください。`)}">${icon('search', 16)}AIに相談</button>
      <button class="btn" type="button" data-keepplan>${icon('save', 16)}この案を保存して比べる</button>
    </div>
    ${saveHelp()}`;

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
    g.planSnap = planSnap();
    delete g.siteArea; // 花壇プランは庭全体の面積を持たない
    g.plants = plan.species.map((sp) => sp.plant.id);
    g.area = Math.round(plan.area * 10) / 10;
    g.sun = plan.sun;
    g.moist = plan.moist || g.moist || '';
    g.features = { ...(g.features || {}), ...planFeatures() };
    state.gardenId = g.id;
    if (!saveGardens()) { toast('保存できませんでした。端末の空き容量やブラウザの設定（プライベートモードなど）を確かめてください'); return; }
    toast(`「${g.name}」にプランを反映しました（植物${g.plants.length}種）`);
    go('garden');
  };
  $('#btnApply').addEventListener('click', () => {
    const g = activeGarden();
    if (g.plants.length && !confirm(`「${g.name}」の植物をこのプランで置き換えます。よろしいですか？`)) { toast(`置き換えをやめました（「${g.name}」はそのままです）`); return; }
    applyTo(g);
  });
  $('#btnApplyNew').addEventListener('click', () => {
    const g = { id: 'g' + Date.now().toString(36), name: uniqueGardenName(bedOfSite?.name || state.planBedName || title), plants: [], area: 3, sun: '', moist: '', have: {} };
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


// ---------- ベランダ・鉢植えプラン ----------
function renderBalconyPlan() {
  const box = $('#planBox');
  const bp = state.balcony;
  $('#btnPlanAlt').hidden = true;
  if (!bp) {
    box.innerHTML = tsupiSays('ベランダの向きと手すりの高さを教えてね。場所ごとの日当たりを太陽の動きから計算して、鉢の置き場所と植物を考えるよ。' + (state.loc ? '' : '（先に「ホーム」で場所を設定すると、より正確になるよ）'), 'think');
    return;
  }
  const pi = state.planInput;
  const south = !!state.climate?.south;
  const title = bp.pref.matched.length || pi.style === 'cottage' ? (pi.style === 'cottage' ? '鉢で楽しむコテージガーデン' : planTitle(bp.pref.matched, pi.style).replace(/庭$/, 'ベランダ')) : `${FACING[bp.facing][0]}向きベランダの小さな庭`;
  const c = bp.cost;
  const budgetMsg = c.budget ? (c.total <= c.budget ? `<div class="alert ok">予算 ${yen(c.budget)} 内に収まっています。</div>` : `<div class="alert warn">予算 ${yen(c.budget)} を ${yen(c.total - c.budget)} 超えています。鉢の数を減らすか、小さな苗から育てて調整を。</div>`) : '';
  const species = bp.plants.map((p) => ({ p, color: bp.slots.find((s) => s.plant.id === p.id)?.color || p.color[0], label: bp.slots.filter((s) => s.plant.id === p.id).map((s) => s.no).join(',') }));
  const ZJ = { big: '大鉢', rail: '手すりぎわ', shelf: '棚', hang: '手すり掛け' };
  box.innerHTML = `
    <section class="hero plan-hero bal-hero">
      <div class="hero-art" id="balArt">${frontSVG(bp)}</div>
      <div class="hero-text">
        <span class="kicker">Balcony Garden · ${esc(STYLES[pi.style]?.by || 'Container Planting')}</span>
        <h1>${esc(title)}</h1>
        <p class="sekki">${bp.width}×${bp.depth}m・${FACING[bp.facing][0]}向き・${bp.floor}階・手すり${Math.round(bp.railH * 100)}cm（${bp.railType === 'solid' ? '壁' : '格子'}）${bp.roof ? '・屋根あり' : ''}</p>
        ${tocHtml([['sec-cast', '植物'], ['sec-sun', '日当たり'], ['sec-pots', '鉢のリスト'], ['sec-bloom', '開花'], ['sec-wild', '生き物'], ['sec-care', '水やり'], ['sec-cost', '費用'], ['sec-notes', '注意']])}
      </div>
    </section>
    <div class="figures four">
      <div><span class="fig">${bp.slots.length}<small>鉢</small></span><span class="cap">植物 ${bp.plants.length}種</span></div>
      <div><span class="fig">${bp.soilL}<small>L</small></span><span class="cap">用土の量</span></div>
      <div><span class="fig">${bp.weight}<small>kg</small></span><span class="cap">水やり後の重さの目安</span></div>
      <div><span class="fig">${yen(c.total)}</span><span class="cap">概算（苗・鉢・土）</span></div>
    </div>

    <section class="mag" id="sec-sun">
      ${secHead('Sunlight', '場所ごとの日当たり', `${esc(state.loc?.name || '北緯35.7°')}の太陽の動きから、季節ごとに直射日光が当たる時間を計算しました。手すり・上の階・両端の仕切り板の影を考えています。`)}
      <div class="scroll-x">${sectionSVG(bp)}</div>
      <div class="scroll-x">${sunChartSVG(bp)}</div>
      <p class="hint">5時間以上を「日向」、2.5時間以上を「半日陰」としています。断面図の円の数字は、春〜秋（夏至と春分・秋分の平均）の日照時間です。</p>
    </section>

    <section class="mag" id="sec-cast">
      ${secHead('Plant Cast', '植物の紹介', 'このベランダの主役たち。番号は正面図の鉢の番号です。')}
      <div class="cast">${bp.plants.map((p) => { const ss = bp.slots.filter((x) => x.plant.id === p.id); const s0 = ss[0]; const lv = state.climate ? evaluate(p, state.climate).level : null; return `<article class="cast-card">
        <div class="cast-art">${photoHtml(p, 'cast-photo', s0.color)}<span class="no">${ss.map((x) => x.no).join('・')}</span></div>
        <div class="cbody">
          <span class="role">${esc(ZJ[s0.zone])}・${esc(BSUN[s0.spot.sun])}${p.roles?.includes('hanging') ? '・垂れて広がる' : ''}</span>
          <h3>${esc(p.ja)}</h3>
          <p class="latin">${esc(p.latin)}</p>
          <p class="calc"><span class="dot" style="background:${COLORS[s0.color].hex};width:9px;height:9px"></span> ${COLORS[s0.color].ja}・${p.h[0]}〜${p.h[1]}cm${lv ? `・${LEVEL[lv].mark}` : ''}</p>
          ${monthBar({ ...p, color: [s0.color] }, south)}
          <p class="cnote">${esc(p.note)}</p>
          <div class="why">${[p.tags.includes('balcony') ? '鉢向き' : '', p.tender ? '冬は取り込み' : '', p.harvest?.length ? `収穫 ${monthsJa(p.harvest.map((m) => localMonth(m, south)))}` : '', p.tags.includes('fragrant') ? '香り' : '', p.tags.includes('herb') ? 'ハーブ' : '', `植え時 ${monthsJa(plantingTime(p, state.climate).plant.best)}`].filter(Boolean).map((w) => `<span>${esc(w)}</span>`).join('')}</div>
          <button type="button" class="btn small" data-jump="pot-${s0.no}">鉢と土を見る</button>
        </div>
      </article>`; }).join('')}</div>
    </section>

    <section class="mag" id="sec-pots">
      ${secHead('Pots & Plants', '鉢のリスト', '上の正面図の番号と対応しています。タップすると植物図鑑を開きます。')}
      <div class="pot-list">${bp.slots.map((s) => `<article class="pot-card" id="pot-${s.no}">
        <div class="pc-no">${s.no}</div>
        <div class="pc-body">
          <span class="role">${esc(ZJ[s.zone])}${s.tier ? ` ${s.tier}段目` : ''}${s.stand ? '・スタンド' : ''}・${esc(BSUN[s.spot.sun])}（${s.spot.grow}時間）</span>
          <h3><button type="button" class="linkish" data-find="${esc(s.plant.groupJa)}"><span class="dot" style="background:${COLORS[s.color].hex}"></span>${esc(s.plant.ja)}</button></h3>
          <p class="calc">${s.planter ? '65cmプランター' : `${s.go}号鉢（直径${s.go * 3}cm）`}・${s.qty}株・土 ${s.liters}L・${esc(s.guide.depth)}</p>
          <div class="mixbar" title="${esc(s.guide.mix.ja)}">${s.guide.mix.parts.map((x) => `<i style="flex:${x.part};background:${x.color}" title="${esc(x.ja)} ${x.part}"></i>`).join('')}</div>
          <p class="hint" style="margin:2px 0 0">${esc(s.guide.mix.ja)}：${s.guide.mix.parts.map((x) => `${esc(x.ja)}${x.part}`).join('・')}</p>
          <p class="pc-time">${icon('calendar', 13)}植え時 ${esc(monthsJa(plantingTime(s.plant, state.climate).plant.best))}</p>
          ${s.plant.tender ? '<p class="pc-warn">冬は室内か軒下へ取り込み</p>' : ''}
          <p class="calc">${yen(s.cost.plant)}（苗）＋${yen(s.cost.pot)}（鉢）＋${yen(s.cost.soil)}（土）</p>
        </div>
      </article>`).join('')}</div>
    </section>

    <section class="mag" id="sec-bloom">
      ${secHead('Bloom Relay', '開花リレー')}
      <div class="scroll-x">${calHtml(species, south, bp.counts)}</div>
      ${bp.harvest.some(Boolean) ? `<h3 style="margin-top:14px">収穫カレンダー</h3><div class="scroll-x">${harvestCal(bp.plants.filter((p) => p.harvest?.length), south)}</div>` : ''}
    </section>

    <section class="mag" id="sec-wild">
      ${secHead('Wildlife', 'ベランダに来る生き物', '高い階でも、蜂や蝶、小鳥は花や水を見つけてやってきます。')}
      ${bioHtml(bp.bio)}
      ${crittersHtml(bp.critters, south, 8, seenSet())}
    </section>

    <section class="mag" id="sec-care">
      ${secHead('Care', '水やりと季節の手入れ')}
      <dl class="potdl">${bp.watering.map((w) => `<dt>${esc(w.season)}</dt><dd>${esc(w.text)}</dd>`).join('')}</dl>
      ${bp.tender.length ? `<p class="pnote">冬に取り込む植物：${bp.tender.map((p) => esc(p.groupJa)).join('・')}</p>` : ''}
    </section>

    <section class="mag receipt" id="sec-cost">
      ${secHead('Estimate', '概算費用')}
      <ul>
        <li><span>苗</span><i></i><b>${yen(c.plants)}</b></li>
        <li><span>鉢・プランター</span><i></i><b>${yen(c.pots)}</b></li>
        <li><span>用土（${bp.soilL}L）</span><i></i><b>${yen(c.soil)}</b></li>
        ${c.extras.map((e) => `<li><span>${esc(e.ja)}</span><i></i><b>${yen(e.cost)}</b></li>`).join('')}
        <li class="total"><span>合計の目安</span><i></i><b>${yen(c.total)}</b></li>
      </ul>
      ${budgetMsg}
    </section>

    <section class="mag" id="sec-notes">
      ${secHead('Notes', 'このベランダのポイント')}
      <ul class="role-advice">${bp.notes.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    </section>

    <div class="big-row">
      <button class="btn primary" type="button" id="btnBalNew">新しい庭（ベランダ）として保存</button>
      <button class="btn" type="button" id="btnBalImg">${icon('save', 16)}配置図を保存</button>
      <button class="btn" type="button" id="btnBalAlt">${icon('refresh', 16)}別の植物で考える</button>
      <button class="btn" type="button" data-keepplan>${icon('save', 16)}この案を保存して比べる</button>
      <button class="btn" type="button" data-consult="${esc(`${FACING[bp.facing][0]}向き・${bp.floor}階・${bp.width}×${bp.depth}mのベランダで、${bp.plants.slice(0, 10).map((p) => p.groupJa.replace(/（.*?）/g, '')).join('・')}を鉢で育てる計画です。よりよくするアイデアと注意点を教えてください。`)}">${icon('search', 16)}AIに相談</button>
    </div>
    ${saveHelp()}`;
  hydratePhotos(box, bp.plants);
  $('#btnBalAlt').addEventListener('click', () => { makePlan(state.planInput.seed + 1); toast('植物を選び直しました'); });
  $('#btnBalImg').addEventListener('click', async () => {
    try { const blob = await svgToPngBlob($('#balArt svg')); const r = await saveFile('balcony-plan.png', blob, 'image/png'); if (r !== 'cancel') toast('配置図を保存しました'); } catch (err) { toast(err.message); }
  });
  $('#btnBalNew').addEventListener('click', () => {
    const g = { id: 'g' + Date.now().toString(36), name: uniqueGardenName(`${FACING[bp.facing][0]}向きのベランダ`), plants: bp.plants.map((p) => p.id), area: bp.area, sun: '', moist: '', have: {}, features: { ...bp.features }, kind: 'balcony', planSnap: planSnap() };
    state.gardens.push(g);
    state.gardenId = g.id;
    if (!saveGardens()) { toast('保存できませんでした。端末の空き容量やブラウザの設定（プライベートモードなど）を確かめてください'); return; }
    toast(`新しい庭「${g.name}」として保存しました（マイ庭の庭が${state.gardens.length}つになりました。名前はマイ庭で変えられます）`);
    go('garden');
  });
}

/** ページ内ジャンプ：data-jump="要素のID"。data-gojump="画面|ID" は別の画面へ移ってから */
function jumpTo(id) {
  const el = document.getElementById(id);
  if (!el) return false;
  if (el.tagName === 'DETAILS') el.open = true;
  el.closest('details')?.setAttribute('open', '');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 1600);
  return true;
}
document.addEventListener('click', (e) => {
  const j = e.target.closest('[data-jump]');
  if (j) { e.preventDefault(); jumpTo(j.dataset.jump); return; }
  const g = e.target.closest('[data-gojump]');
  if (g) {
    const [view, id] = g.dataset.gojump.split('|');
    go(view);
    setTimeout(() => jumpTo(id), 120);
  }
});

/** 庭まるごとプラン：つくる順番のデータ（下準備→構造物→木・低木→宿根草→球根→一年草・野菜→仕上げ）。ms は適した月 */
function siteStepData(s, sitePlants) {
  const bestMonths = (list) => {
    const cnt = Array(13).fill(0);
    list.forEach((x) => plantingTime(x.plant, state.climate).plant.best.forEach((m) => cnt[m]++));
    const top = Math.max(...cnt);
    return top ? cnt.map((v, m) => (m && v >= top * 0.5 ? m : 0)).filter(Boolean) : [];
  };
  const shrubs = sitePlants.filter((x) => ['shrub', 'tree'].includes(x.plant.type));
  const bulbs = sitePlants.filter((x) => x.plant.type === 'bulb');
  const annual = sitePlants.filter((x) => x.plant.type === 'annual' || (x.plant.tags || []).includes('veg'));
  const pere = sitePlants.filter((x) => !shrubs.includes(x) && !bulbs.includes(x) && !annual.includes(x));
  const built = [...new Set(s.structs.map((x) => ITEMS[x.type]?.ja).filter(Boolean))];
  if (s.areas.path) built.unshift('小道');
  if (s.areas.terrace) built.unshift('テラス');
  const allM = bestMonths(sitePlants);
  const first = monthsJa(allM);
  const before = allM.map((m) => ((m + 10) % 12) + 1);
  const pm = bestMonths(pere), sm = bestMonths(shrubs), bm = bestMonths(bulbs), am = bestMonths(annual);
  return [
    { key: 'prep', t: '下準備', w: first ? `植え付けの2〜4週間前（${first}の前）` : '植え付けの2〜4週間前', x: '雑草を根から抜き、花壇になる場所を深さ30cmほど耕して、堆肥を混ぜておきます。水はけの悪い場所は、土を盛って少し高くします。', ms: before },
    built.length && { key: 'build', t: '構造物をつくる', w: '植物より先に', x: `${[...new Set(built)].join('・')}を先に作ると、作業で苗を踏まずにすみます。小道とテラスの位置が決まると、花壇の形もはっきりします。`, ms: before },
    (shrubs.length || s.structs.some((x) => x.type === 'tree')) && { key: 'shrub', free: true, t: '木と低木を植える', w: monthsJa(sm) || '落葉している時期', x: '庭の骨格になるものから。育ったときの大きさを考えて、まわりの草花との間をあけておきます。', l: shrubs, ms: sm.length ? sm : [11, 12, 2, 3] },
    pere.length && { key: 'pere', free: true, t: '宿根草とグラスを植える', w: monthsJa(pm), x: '背の高いものから順に、植栽図のとおり苗をポットのまま並べて、見え方を確かめてから植えます。', l: pere, ms: pm },
    bulbs.length && { key: 'bulb', free: true, t: '球根を植え込む', w: monthsJa(bm), x: '宿根草の株の間に、5〜9球ずつまとめて植えます。植えた場所に目印をさしておくと、あとで掘り返さずにすみます。', l: bulbs, ms: bm },
    annual.length && { key: 'annual', free: true, t: '一年草・野菜', w: monthsJa(am), x: '空いた場所や手前を、季節ごとに入れ替えて楽しみます。', l: annual, ms: am },
    { key: 'finish', first: true, t: '仕上げと最初の1年', w: '植え付けの直後から', x: '腐葉土やウッドチップで地面を覆い（マルチング）、乾燥と雑草を防ぎます。根づくまでの最初の夏は、土が乾いたらたっぷり水やりを。', ms: [] },
  ].filter(Boolean);
}
function siteSteps(s, sitePlants) {
  const no = new Map(sitePlants.map((x, i) => [x.plant.id, i + 1]));
  const chip1 = (x) => `<button type="button" class="chip" data-jump="scast-${no.get(x.plant.id)}"><span class="dot" style="background:${COLORS[x.color].hex}"></span>${esc(x.plant.ja)}</button>`;
  const chips = (list) => list.length > 8 ? `<div class="hl-stars">${list.slice(0, 6).map(chip1).join('')}</div><details class="more-chips"><summary>ほか${list.length - 6}種を見る</summary><div class="hl-stars">${list.slice(6).map(chip1).join('')}</div></details>` : `<div class="hl-stars">${list.map(chip1).join('')}</div>`;
  const steps = scheduleSteps(siteStepData(s, sitePlants));
  const ymJa = (ym) => { const [y, m] = ym.split('-').map(Number); return `${y === new Date().getFullYear() ? '' : y + '年'}${m}月`; };
  const g = activeGarden();
  const has = (g.buildPlan || []).length;
  return `<ol class="build-steps">${steps.map((st, i) => `<li><span class="bs-no">${i + 1}</span><div><h3>${st.t}<small>${esc(st.w)}</small></h3><p>${st.x}</p>${st.l?.length ? chips(st.l) : ''}<p class="bs-when">${icon('calendar', 13)}予定：${ymJa(st.ym)}${st.first ? 'の植え付けのあとから' : 'ごろ'}</p></div></li>`).join('')}</ol>
    <div class="row"><button type="button" class="btn primary small" id="btnStepsCal">${icon('calendar', 15)}${has ? '作業暦の段取りを更新' : 'この順番を作業暦に登録'}</button></div>
    <p class="hint">登録すると、「${esc(g.name)}」の作業暦とホームの「今月の作業」に、その月の段取りが表示されます。終わったらチェックを付けましょう。</p>`;
}
/** つくる順番を、庭の作業暦（段取り）として登録する */
function registerSteps(s, sitePlants) {
  const g = activeGarden();
  const steps = scheduleSteps(siteStepData(s, sitePlants));
  if ((g.buildPlan || []).length && !confirm(`「${g.name}」に登録済みの段取りを、このプランの順番で置き換えますか？`)) return;
  g.buildPlan = steps.map((st, i) => ({ id: `b${i}`, ym: st.ym, title: st.t, detail: st.x, plants: (st.l || []).map((x) => x.plant.ja).slice(0, 12), done: false }));
  saveGardens();
  toast(`「${g.name}」の作業暦に、庭づくりの段取りを${steps.length}件登録しました`);
}
/** 段取りのうち、ある年月のもの（今月の場合は、終わっていない過去の分も含める） */
function buildDue(g, ym, includeLate = false) {
  return (g.buildPlan || []).filter((b) => b.ym === ym || (includeLate && !b.done && b.ym < ym));
}
const ymOf = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** ページ内の目次（タップで該当の場所へ） */
function tocHtml(items) {
  return `<details class="toc"><summary>${icon('list', 15)}このページの目次<small>${items.length}項目・タップで移動</small></summary><nav aria-label="このページの目次"><ol>${items.map(([id, t], i) => `<li><button type="button" data-jump="${id}"><span class="tn">${i + 1}</span>${esc(t)}</button></li>`).join('')}</ol></nav></details>`;
}

// ---------- デザイナーの視点（設計の考え方と数字） ----------
/** 植物の設計上の層：骨格（形を保つ高い植物・低木）／季節の主役／地面を覆う（地模様・グラウンドカバー・縁取り） */
function designLayer(p) {
  const r = p.roles || [];
  if (p.type === 'shrub' || p.type === 'tree' || r.includes('screen') || (r.includes('structure') && p.h[1] >= 120)) return 'structure';
  if (r.includes('groundcover') || r.includes('matrix') || r.includes('edging') || r.includes('shadecover') || (p.form === 'grass' && p.h[1] <= 90)) return 'ground';
  return 'theme';
}
const DL = {
  structure: { ja: '骨格', col: '#5d6b3a', target: [10, 20], text: '背が高く形が崩れない植物・低木。冬の枯れ姿まで庭の形を保つ' },
  theme: { ja: '季節の主役', col: '#c2678d', target: [25, 45], text: '花や葉で季節ごとの見せ場をつくる植物' },
  ground: { ja: '地面を覆う', col: '#c9b77a', target: [40, 60], text: 'グラスやグラウンドカバー。すき間を埋めて雑草と乾燥を防ぐ「緑の布」' },
};
/** スタイルごとの層の割合の目安（%）。マトリクス植栽はレイナー＆ウェストの「地面を覆う層を半分」、ボーダーは季節の主役が中心 */
const DESIGN_TARGET = {
  matrix: { structure: [5, 15], theme: [25, 45], ground: [40, 60] },
  oudolf: { structure: [10, 25], theme: [40, 65], ground: [15, 35] },
  chatto: { structure: [10, 25], theme: [30, 55], ground: [25, 45] },
  composition: { structure: [10, 25], theme: [30, 50], ground: [25, 45] },
  cottage: { structure: [3, 15], theme: [45, 70], ground: [20, 40] },
  _: { structure: [10, 25], theme: [45, 70], ground: [15, 35] },
};
const HUE = { red: 0, orange: 30, yellow: 55, green: 120, blue: 220, purple: 275, pink: 330 };
/**
 * デザインノート。items: [{ plant, qty, color }]、ctx: { area, organic, repeats:[plant], beds, islands, focal:[名前], scope:'site'|'bed' }
 */
function designNotes(items, ctx) {
  const main = items.filter((x) => !(x.role === 'under'));
  const total = main.reduce((t, x) => t + x.qty, 0) || 1;
  const by = { structure: 0, theme: 0, ground: 0 };
  main.forEach((x) => { by[designLayer(x.plant)] += x.qty; });
  const pct = Object.fromEntries(Object.entries(by).map(([k, v]) => [k, Math.round((v / total) * 100)]));
  const bar = `<div class="dn-bar">${Object.keys(DL).map((k) => pct[k] ? `<i style="width:${pct[k]}%;background:${DL[k].col}" title="${DL[k].ja} ${pct[k]}%"></i>` : '').join('')}</div>
    <ul class="dn-layers">${Object.entries(DL).map(([k, d]) => {
      const tg = (DESIGN_TARGET[ctx.style] || DESIGN_TARGET._)[k];
      const v = pct[k], ok = v >= tg[0] && v <= tg[1];
      return `<li><span class="sw" style="background:${d.col}"></span><b>${d.ja} ${v}%</b><small>目安 ${tg[0]}〜${tg[1]}%・${esc(d.text)}</small><em class="${ok ? 'ok' : 'warn'}">${ok ? 'ちょうどよい' : v < d.target[0] ? 'やや少なめ' : 'やや多め'}</em></li>`;
    }).join('')}</ul>`;
  const cover = Math.round((main.reduce((t, x) => t + x.qty * Math.PI * (x.plant.spread / 200) ** 2, 0) / ctx.area) * 100);
  const dens = Math.round((total / ctx.area) * 10) / 10;
  // 配色
  const cq = {};
  main.forEach((x) => { cq[x.color] = (cq[x.color] || 0) + x.qty; });
  const cols = Object.entries(cq).sort((a, b) => b[1] - a[1]);
  const hues = cols.filter(([c]) => HUE[c] != null && c !== 'green').map(([c]) => HUE[c]);
  const spreadHue = hues.length > 1 ? Math.max(...hues.map((h) => Math.max(...hues.map((g) => Math.min(Math.abs(h - g), 360 - Math.abs(h - g)))))) : 0;
  const harmony = !hues.length ? '白と緑を中心にした、静かで明るい配色' : spreadHue <= 70 ? '隣り合う色でまとめた「類似色」の配色。穏やかで統一感がある' : spreadHue >= 150 ? '反対の色を組み合わせた「補色」の配色。互いを引き立て合い、生き生きと見える' : '暖色と寒色をほどよく混ぜた配色。白やグラスの色が全体をつないでいる';
  const palette = `<div class="dn-pal">${cols.map(([c, q]) => `<i style="flex:${q};background:${COLORS[c]?.hex || '#999'}" title="${COLORS[c]?.ja || ''}"></i>`).join('')}</div>`;
  // 四季
  const south = !!state.climate?.south;
  const months = new Set(main.flatMap((x) => x.plant.bloom.map((m) => localMonth(m, south))));
  const winter = main.filter((x) => x.plant.uses?.includes('winter') || x.plant.uses?.includes('seed') || x.plant.tags.includes('evergreen') || x.plant.form === 'grass');
  const points = [
    ctx.organic != null && (ctx.organic ? `<b>曲線の縁</b>：花壇の手前をふくらみとくびれのある曲線にし${ctx.islands ? `、芝生に${ctx.islands}つの島花壇を浮かべて` : ''}、視線が奥へ流れる自然な庭にしました。` : '<b>直線の構成</b>：小道と花壇をまっすぐに通して、整った印象と歩きやすさを優先しました。'),
    ctx.repeats?.length ? `<b>くり返し（リピート）</b>：${ctx.repeats.slice(0, 5).map((p) => esc(p.groupJa.replace(/（.*?）/g, ''))).join('・')}を複数の花壇に植え、庭全体をひとつにつないでいます。` : ctx.scope === 'site' ? '<b>くり返し</b>：花壇ごとに植物を変え、場所ごとの個性を出しています。' : '',
    `<b>群れで植える</b>：同じ植物を3株・5株…と奇数のまとまりで植え、遠くからでも形が読めるようにしています。`,
    `<b>季節の連続</b>：${monthsJa([...months])}に花があり、冬も${winter.length}種のグラス・種の頭・常緑の葉が景色を保ちます。`,
    ctx.focal?.length ? `<b>見せ場（フォーカルポイント）</b>：${ctx.focal.map(esc).join('・')}を視線の止まる場所に置きました。` : '',
    cover < 85 ? '<b>密度</b>：育ちきるまで地面が見えるので、1〜2年目はマルチングで覆うか、一年草ですき間を埋めると雑草を防げます。' : '<b>密度</b>：2〜3年で株どうしが触れ合い、地面がほとんど見えなくなる密度です。雑草が生えにくく、手入れが楽になります。',
  ].filter(Boolean);
  return `<div class="design-notes">
    <div class="dn-grid">
      <div class="dn-fig"><span class="fig">${dens}<small>株/㎡</small></span><span class="cap">植え付け密度（球根を除く）</span></div>
      <div class="dn-fig"><span class="fig">${Math.min(cover, 999)}<small>%</small></span><span class="cap">育ったときに地面を覆う割合</span></div>
      <div class="dn-fig"><span class="fig">${months.size}<small>か月</small></span><span class="cap">花のある月</span></div>
      <div class="dn-fig"><span class="fig">${winter.length}<small>種</small></span><span class="cap">冬も見どころがある植物</span></div>
    </div>
    <h3 class="dn-h">層の構成（株数の割合・${esc((STYLES[ctx.style]?.ja || '').replace(/（.*?）/g, ''))}の目安と比較）</h3>${bar}
    <h3 class="dn-h">配色</h3>${palette}<p class="dn-p">${harmony}。</p>
    <h3 class="dn-h">デザインの考え方</h3><ul class="dn-points">${points.map((t) => `<li>${t}</li>`).join('')}</ul>
  </div>`;
}

// ---------- 育ち具合の写真くらべ ----------
/** 今のプランの入力を控える（庭に反映したとき、あとで植栽図を作り直して写真と見比べるため） */
function planSnap() {
  const pi = state.planInput;
  return { input: JSON.parse(JSON.stringify(pi)), bed: pi.mode === 'site' ? state.siteBed || null : null };
}
function fromSnap(snap) {
  if (!snap?.input) return null;
  try {
    const x = rebuildPlan(snap.input);
    if (snap.bed) { const b = x.beds.find((q) => q.id === snap.bed); return b ? { mode: 'bed', obj: b.plan } : null; }
    return { mode: snap.input.mode || 'bed', obj: x };
  } catch { return null; }
}
/** その月の「計画どおりならこう見える」図 */
function expectedArt(snap, month) {
  const r = fromSnap(snap);
  if (!r) return '';
  const south = !!state.climate?.south;
  if (r.mode === 'bed') return elevationSVG(r.obj, month, south, { label: false });
  if (r.mode === 'site') { const b = r.obj.beds.find((q) => q.plan.species.length); return b ? elevationSVG(b.plan, month, south, { label: false }) : ''; }
  return frontSVG(r.obj);
}
const growPick = {};
function growthCard(g) {
  const spots = g.spots || [];
  const shots = diaryCache.filter((n) => n.photo && (n.gardenId === g.id || (!n.gardenId && n.garden === g.name)));
  const bySpot = new Map(spots.map((sp) => [sp.id, shots.filter((n) => n.spot === sp.id).sort((a, b) => a.date.localeCompare(b.date))]));
  const loose = shots.filter((n) => !n.spot || !bySpot.has(n.spot)).sort((a, b) => a.date.localeCompare(b.date));
  const cur = growPick.spot && (bySpot.has(growPick.spot) || growPick.spot === '_all') ? growPick.spot : spots.find((sp) => bySpot.get(sp.id).length)?.id || (loose.length ? '_all' : spots[0]?.id || '');
  const list = cur === '_all' ? loose : bySpot.get(cur) || [];
  const tabs = [...spots.map((sp) => [sp.id, `${sp.name}（${bySpot.get(sp.id).length}）`]), ...(loose.length ? [['_all', `定点なしの写真（${loose.length}）`]] : [])];
  const a = list.find((n) => n.id === growPick.a) || list[0];
  const b = list.find((n) => n.id === growPick.b) || list[list.length - 1];
  const md = (n) => { const d = new Date(n.date + 'T00:00:00'); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`; };
  const mon = (n) => Number(n.date.slice(5, 7));
  const body = !list.length
    ? `<p class="hint">${spots.length ? 'この定点の写真はまだありません。' : ''}「記録を書く」で写真を添えるとき、<b>定点</b>（いつも同じ場所・同じ向きから撮る場所）を選ぶと、ここで月ごとに並べて育ち具合を比べられます。</p>`
    : `<div class="grow-strip">${list.map((n) => `<button type="button" class="gs-item${n === a ? ' a' : ''}${n === b ? ' b' : ''}" data-gpick="${n.id}"><img src="${n.photo}" alt="${esc(md(n))}の写真" loading="lazy"><span>${mon(n)}月${n === a ? '<i>前</i>' : ''}${n === b && n !== a ? '<i>後</i>' : ''}</span></button>`).join('')}</div>
      <p class="hint" style="margin:4px 0 8px">写真をタップすると「前」、もう一度別の写真をタップすると「後」を選べます。</p>
      ${a && b && a !== b ? `<div class="ba" style="--p:50%">
        <img src="${b.photo}" alt="後：${esc(md(b))}"><div class="ba-front"><img src="${a.photo}" alt="前：${esc(md(a))}"></div>
        <span class="ba-lab l">前・${esc(md(a))}</span><span class="ba-lab r">後・${esc(md(b))}</span>
        <input type="range" min="0" max="100" value="50" aria-label="前後の写真の境目" id="baRange">
      </div><p class="calc" style="text-align:center">${Math.round((new Date(b.date) - new Date(a.date)) / 864e5)}日で、こんなに育ちました</p>` : ''}
      ${g.planSnap && b ? `<div class="grow-plan"><div><span class="label">${esc(md(b))}の写真</span><img src="${b.photo}" alt=""></div><div><span class="label">プランどおりなら（${mon(b)}月の姿）</span><div class="gp-art">${expectedArt(g.planSnap, mon(b))}</div></div></div>
        <p class="hint">プランの絵は、植物が育ちきったときの${mon(b)}月の姿です。1〜2年目はまだ小さく、すき間があって当たり前です。</p>` : list.length ? '<p class="hint">プランから「この庭に反映」すると、写真の月に合わせたプランの絵と並べて見比べられます。</p>' : ''}`;
  return `<details class="card grow" id="growCard"${growPick.open ? ' open' : ''}><summary><h2>${icon('camera', 19)}育ち具合の写真くらべ</h2><span class="sum-hint">${shots.length}枚</span></summary>
    ${tabs.length ? `<div class="chips grow-tabs">${tabs.map(([id, t]) => `<button type="button" class="chip${id === cur ? ' on' : ''}" data-gspot="${id}">${esc(t)}</button>`).join('')}</div>` : ''}
    ${body}
    <div class="row" style="margin-top:8px"><button type="button" class="btn small" data-gnew>${icon('plus', 15)}定点をつくる</button>${spots.length ? `<button type="button" class="btn small" data-gdel="${cur}" ${cur === '_all' ? 'hidden' : ''}>この定点を削除</button>` : ''}<button type="button" class="btn small primary" data-fcam="${cur === '_all' ? '' : cur}">${icon('camera', 15)}定点カメラで撮る</button><button type="button" class="btn small" data-grec>${icon('plus', 15)}写真を選んで記録</button></div>
  </details>`;
}
function bindGrowth(box, g) {
  const card = box.querySelector('#growCard');
  if (!card) return;
  card.addEventListener('toggle', () => { growPick.open = card.open; });
  card.addEventListener('click', (e) => {
    const t = e.target.closest('[data-gspot],[data-gpick],[data-gnew],[data-gdel],[data-grec]');
    if (!t) return;
    if (t.dataset.gspot) { growPick.spot = t.dataset.gspot; growPick.a = growPick.b = null; }
    else if (t.dataset.gpick) {
      const id = t.dataset.gpick;
      if (!growPick.a || growPick.b || growPick.a === id) { growPick.a = id; growPick.b = null; } else growPick.b = id;
      if (growPick.a && growPick.b) { const all = diaryCache; const da = all.find((n) => n.id === growPick.a)?.date, db = all.find((n) => n.id === growPick.b)?.date; if (da > db) [growPick.a, growPick.b] = [growPick.b, growPick.a]; }
    } else if (t.hasAttribute('data-gnew')) {
      const name = prompt('定点の名前（例：南の花壇を通路から）');
      if (!name?.trim()) return;
      g.spots = [...(g.spots || []), { id: 's' + Date.now().toString(36), name: name.trim().slice(0, 24) }];
      growPick.spot = g.spots[g.spots.length - 1].id;
      saveGardens();
      toast('定点をつくりました。写真を記録するときに選べます');
    } else if (t.dataset.gdel) {
      const sp = (g.spots || []).find((x) => x.id === t.dataset.gdel);
      if (!sp || !confirm(`定点「${sp.name}」を削除しますか？（写真はノートに残ります）`)) return;
      g.spots = g.spots.filter((x) => x !== sp);
      growPick.spot = null;
      saveGardens();
    } else if (t.hasAttribute('data-grec')) { openRecord('', growPick.spot && growPick.spot !== '_all' ? growPick.spot : ''); return; }
    growPick.open = true;
    renderGarden();
    document.getElementById('growCard')?.scrollIntoView({ block: 'start' });
  });
  const r = card.querySelector('#baRange');
  if (r) r.addEventListener('input', () => r.parentElement.style.setProperty('--p', r.value + '%'));
}

// ---------- 保存した案と比較 ----------
let savedPlans = store.get('savedPlans', []);
const cmpPick = new Set();
const MODE_JA = { bed: '花壇', site: '庭まるごと', balcony: 'ベランダ' };
// 植物の選び方の版。保存した案は入力から作り直すので、選び方を変えた版より前に保存した案は、植物が一部変わることがある
const SEL_VER = 2;
/** 保存した入力からプランを作り直す（同じ入力と案番号なら同じプランになる） */
function rebuildPlan(input) {
  const pi = input;
  if (pi.mode === 'balcony') return generateBalcony({ ...pi.balcony, roof: pi.balcony.roof !== 'no', text: planText(pi), style: pi.style, wild: pi.wild, climate: state.climate, lat: state.loc?.lat ?? 35.7, seed: pi.seed, annuals: pi.annuals, budget: pi.budget });
  if (pi.mode === 'site') return generateSite({ ...pi.site, items: pi.items, wild: pi.wild, roles: pi.ground ? ['groundcover'] : [], text: planText(pi), style: pi.style, sun: pi.sun, moist: pi.moist, climate: state.climate, seed: pi.seed, layoutSeed: pi.layoutSeed, annuals: pi.annuals, budget: pi.budget, k: kOpts(pi), skill: pi.skill });
  return generatePlan({ ...pi, text: planText(pi), k: kOpts(pi), roles: pi.ground ? ['groundcover'] : [], climate: state.climate });
}
/** 比較用のまとめ */
function planFacts(mode, x) {
  const south = !!state.climate?.south;
  const plants = mode === 'site' ? x.plants : mode === 'balcony' ? x.plants : x.species.map((s) => s.plant);
  const months = new Set(plants.flatMap((p) => p.bloom.map((m) => localMonth(m, south))));
  const qty = mode === 'site' ? x.beds.reduce((t, b) => t + b.plan.totalPlants, 0) : mode === 'balcony' ? x.slots.length : x.totalPlants;
  const area = mode === 'balcony' ? Math.round(x.width * x.depth * 10) / 10 : x.area;
  const wildCount = plants.filter((p) => p.tags?.includes('pollinator')).length;
  return {
    species: plants.length, qty, qtyUnit: mode === 'balcony' ? '鉢' : '株', cost: x.cost.total, area, months: months.size,
    monthsJa: monthsJa([...months]), evergreen: plants.filter((p) => p.tags?.includes('evergreen')).length, wild: wildCount,
    easy: plants.filter((p) => p.tags?.includes('easy')).length,
    perSqm: area ? Math.round(x.cost.total / area) : 0,
  };
}
function planThumb(mode, x, k = 0) {
  if (mode === 'site') return siteSVG(x, { uid: 'cmp' + k });
  if (mode === 'balcony') return frontSVG(x);
  return planSVG(x);
}
function keepCurrentPlan() {
  const pi = state.planInput;
  const mode = pi.mode === 'site' && state.siteBed ? 'site' : pi.mode || 'bed';
  const obj = mode === 'site' ? state.site : mode === 'balcony' ? state.balcony : state.plan;
  if (!obj) return;
  const input = JSON.parse(JSON.stringify({ ...pi, mode }));
  if (savedPlans.some((p) => JSON.stringify(p.input) === JSON.stringify(input))) { toast('この案はもう保存されています'); openSaved(); return; }
  const n = savedPlans.filter((p) => p.mode === mode).length + 1;
  const title = (mode === 'site' && state.siteBed ? '' : $('#planBox h1')?.textContent) || `${MODE_JA[mode]}の案`;
  savedPlans.unshift({ id: 'p' + Date.now().toString(36), at: new Date().toISOString(), sel: SEL_VER, mode, name: `${MODE_JA[mode]}の案${n}`, title, style: (STYLES[pi.style]?.ja || '').replace(/（.*?）/g, ''), input, facts: planFacts(mode, obj) });
  if (savedPlans.length > 30) savedPlans.length = 30;
  store.set('savedPlans', savedPlans);
  cmpPick.add(savedPlans[0].id);
  while (cmpPick.size > 3) cmpPick.delete([...cmpPick][0]);
  renderSaved();
  toast('案を保存しました。「保存した案」で並べて比べられます');
}
function openSaved() { const d = $('#savedPlans'); d.hidden = false; d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
function renderSaved() {
  const d = $('#savedPlans');
  d.hidden = !savedPlans.length;
  $('#savedCount').textContent = savedPlans.length ? `${savedPlans.length}件・${cmpPick.size}件を比較中` : '';
  for (const id of [...cmpPick]) if (!savedPlans.some((p) => p.id === id)) cmpPick.delete(id);
  const list = savedPlans.map((p) => `<li class="sp-item${cmpPick.has(p.id) ? ' on' : ''}">
      <label class="sp-pick"><input type="checkbox" data-cmp="${p.id}" ${cmpPick.has(p.id) ? 'checked' : ''}><span></span></label>
      <div class="sp-body"><b>${esc(p.name)}</b><small>${esc(MODE_JA[p.mode])}・${esc(p.style)}${p.input.shape && p.input.shape !== 'rect' && p.mode === 'bed' ? '・' + esc(BED_SHAPES[p.input.shape].ja) : ''}・${p.facts.species}種・${yen(p.facts.cost)}・${esc(new Date(p.at).toLocaleDateString('ja-JP'))}</small></div>
      <div class="sp-acts"><button type="button" class="btn small" data-spopen="${p.id}">開く</button><button type="button" class="icon-btn" data-spren="${p.id}" aria-label="名前を変える">${icon('pen', 16)}</button><button type="button" class="icon-btn" data-spdel="${p.id}" aria-label="削除">${icon('trash', 16)}</button></div>
    </li>`).join('');
  const picks = savedPlans.filter((p) => cmpPick.has(p.id));
  let cmp = '';
  if (picks.length >= 2) {
    const built = picks.map((p) => { try { return rebuildPlan(p.input); } catch { return null; } });
    const rows = [
      ['種類', (f) => `${f.species}種`, (f) => f.species, 'max'],
      ['株数', (f) => `${f.qty}${f.qtyUnit}`, null],
      ['広さ', (f) => `${f.area}㎡`, null],
      ['費用の目安', (f) => yen(f.cost), (f) => f.cost, 'min'],
      ['1㎡あたり', (f) => yen(f.perSqm), (f) => f.perSqm, 'min'],
      ['花の咲く月', (f) => `${f.months}か月`, (f) => f.months, 'max'],
      ['冬も緑', (f) => `${f.evergreen}種`, (f) => f.evergreen, 'max'],
      ['蝶・蜂が来る', (f) => `${f.wild}種`, (f) => f.wild, 'max'],
      ['手間いらず', (f) => `${f.easy}種`, (f) => f.easy, 'max'],
    ];
    const best = (fn, how) => { if (!fn) return null; const v = picks.map((p) => fn(p.facts)); const b = how === 'max' ? Math.max(...v) : Math.min(...v); return v.every((x) => x === b) ? null : b; };
    cmp = `<div class="cmp" style="--n:${picks.length}">
      <div class="cmp-row cmp-head"><span></span>${picks.map((p, k) => `<div><div class="cmp-art">${built[k] ? planThumb(p.mode, built[k], k) : ''}</div><b>${esc(p.name)}</b><small>${esc(p.title)}</small></div>`).join('')}</div>
      ${rows.map(([lab, show, fn, how]) => { const b = best(fn, how); return `<div class="cmp-row"><span>${lab}</span>${picks.map((p) => `<div class="${b != null && fn(p.facts) === b ? 'win' : ''}">${show(p.facts)}</div>`).join('')}</div>`; }).join('')}
      <div class="cmp-row"><span>咲く時期</span>${picks.map((p) => `<div class="small">${esc(p.facts.monthsJa)}</div>`).join('')}</div>
      <div class="cmp-row"><span>共通の植物</span><div class="small" style="grid-column: 2 / -1">${(() => {
        const sets = built.map((x, k) => new Set(x ? (picks[k].mode === 'bed' ? x.species.map((s) => s.plant.ja) : x.plants.map((q) => q.ja)) : []));
        const common = [...sets[0]].filter((n) => sets.every((st) => st.has(n)));
        return common.length ? esc(common.join('・')) : 'なし（まったく違う植物の組み合わせです）';
      })()}</div></div>
    </div>
    <p class="hint">緑の文字は、その項目でいちばん良い案です。費用は苗と土づくり（庭まるごとは構造物も）の目安です。</p>`;
  } else cmp = `<p class="hint">${savedPlans.length >= 2 ? '左の丸をタップして、比べたい案を2〜3件選んでください。' : 'プランを作ったら、下の「この案を保存して比べる」で保存できます。2件以上保存すると、並べて比べられます。'}</p>`;
  $('#savedBody').innerHTML = `<ul class="sp-list">${list}</ul>${cmp}`;
}
function initSaved() {
  const d = $('#savedPlans');
  d.addEventListener('change', (e) => {
    const c = e.target.closest('[data-cmp]');
    if (!c) return;
    if (c.checked) { cmpPick.add(c.dataset.cmp); while (cmpPick.size > 3) cmpPick.delete([...cmpPick][0]); } else cmpPick.delete(c.dataset.cmp);
    renderSaved();
  });
  d.addEventListener('click', (e) => {
    const o = e.target.closest('[data-spopen]'), r = e.target.closest('[data-spren]'), x = e.target.closest('[data-spdel]');
    if (o) {
      const p = savedPlans.find((q) => q.id === o.dataset.spopen);
      Object.assign(state.planInput, JSON.parse(JSON.stringify(p.input)));
      store.set('planInput', state.planInput);
      fillPlanForm();
      computePlan();
      state.planMonth = state.plan?.peak ?? 6;
      renderPlan();
      $('#planBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast(p.sel === SEL_VER ? `「${p.name}」を開きました` : `「${p.name}」を開きました。植物の選び方（気候の判定）を改良したため、保存したときと植物が一部変わることがあります`);
    } else if (r) {
      const p = savedPlans.find((q) => q.id === r.dataset.spren);
      const n = prompt('案の名前', p.name);
      if (n && n.trim()) { p.name = n.trim().slice(0, 30); store.set('savedPlans', savedPlans); renderSaved(); }
    } else if (x) {
      const p = savedPlans.find((q) => q.id === x.dataset.spdel);
      if (!confirm(`「${p.name}」を削除しますか？`)) return;
      savedPlans = savedPlans.filter((q) => q !== p);
      cmpPick.delete(p.id);
      store.set('savedPlans', savedPlans);
      renderSaved();
    }
  });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-keepplan]')) keepCurrentPlan(); });
  renderSaved();
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
  // 庭全体の植物の一覧（花壇をまたいで集計）
  const agg = new Map();
  for (const b of s.beds) for (const sp of b.plan.species) {
    const x = agg.get(sp.plant.id) || { plant: sp.plant, color: sp.color, qty: 0, beds: [], roleJa: sp.roleJa, role: sp.role, why: sp.why || [], challenge: sp.challenge, grade: sp.grade };
    x.qty += sp.qty;
    if (!x.beds.includes(b.id)) x.beds.push(b.id);
    agg.set(sp.plant.id, x);
  }
  const sitePlants = [...agg.values()].sort((a, b) => b.plant.h[1] - a.plant.h[1]);
  const siteCounts = Array(12).fill(0);
  sitePlants.forEach((x) => x.plant.bloom.forEach((m) => siteCounts[localMonth(m, south) - 1]++));
  const midMonth = (h) => localMonth(h.months[Math.floor(h.months.length / 2)], south);
  const bedFor = (h) => s.beds.find((b) => h.stars[0] && b.plan.species.some((sp) => sp.plant.id === h.stars[0].p.id)) || s.beds[0];

  box.innerHTML = `
    <section class="hero plan-hero site-hero">
      <div class="hero-art site-art" id="siteArt">${siteSVG(s, { tour: layer === 'tour', photos: layer === 'photo', nums: new Map(sitePlants.map((x, i) => [x.plant.id, i + 1])) })}</div>
      <div class="hero-text">
        <span class="kicker">Garden Design · ${esc(STYLES[pi.style]?.by || 'Whole Garden')}</span>
        <h1>${esc(title)}</h1>
        <p class="sekki">${esc(SHAPE_JA[pi.site.shape])}の敷地・家は${DIR_JA[s.house]}側・${esc(STYLES[pi.style]?.ja || '')}</p>
        <div class="seg small" id="siteLayer">${Object.entries(SITE_LAYERS).map(([k, v]) => `<button type="button" data-v="${k}" class="${k === layer ? 'on' : ''}">${v}</button>`).join('')}</div>
        ${tocHtml([['sec-design', 'デザイン'], ['sec-hl', '見どころ'], ['sec-tour', '園内の案内'], ['sec-photo', 'フォトスポット'], ['sec-splants', '植物の一覧'], ['sec-ssteps', 'つくる順番'], ['sec-srelay', '開花'], ['sec-swild', '生き物'], ['sec-beds', '花壇'], ['sec-scost', '費用']])}
        <div class="alt-row"><span>別の案：</span><button type="button" class="btn small" data-sitealt="plants">${icon('leaf', 15)}植栽だけ変える</button><button type="button" class="btn small" data-sitealt="layout">${icon('refresh', 15)}配置も変える</button></div>
      </div>
    </section>
    <div class="legend">${[['#cfdcae', '芝生'], ['#b9a079', '花壇'], ['#e8dcc0', '小道'], ['#d6c29c', 'テラス'], ['#9cc4cf', '水辺']].map(([col, t]) => `<span><i style="background:${col}"></i>${t}</span>`).join('')}${layer === 'tour' ? '<span><i class="ln"></i>案内ルート</span>' : ''}${layer === 'photo' ? '<span><i class="cam"></i>撮影位置と向き</span>' : ''}</div>
    <p class="hint site-key">${layer === 'plain' ? '色のまとまりは同じ植物の群れ（ドリフト）、太い線が花壇の範囲です。<b>A・B…</b>は花壇、<b>黒丸の番号</b>は下の「植える植物」の番号で、タップすると説明へ移動します。株の正確な位置は、花壇ごとの「この花壇を詳しく」の植栽図で確認できます。' : '平面図の植物の番号は「平面図」の表示で確認できます。'}</p>
    <div class="bed-key">${s.beds.map((b) => `<button type="button" data-jump="bed-${b.id}"><span class="bid">${b.id}</span><span class="bk-name">${esc(b.name)}</span><span class="bk-dots">${b.plan.species.filter((x) => x.role !== 'under').slice(0, 6).map((x) => `<i style="background:${COLORS[x.color].hex}"></i>`).join('')}</span><small>${b.area}㎡・${b.plan.species.length}種</small></button>`).join('')}</div>

    <div class="figures four">
      <div><span class="fig">${s.area}<small>㎡</small></span><span class="cap">敷地・約${Math.round(s.W * 10) / 10}×${Math.round(s.H * 10) / 10}m</span></div>
      <div><span class="fig">${s.beds.length}<small>か所</small></span><span class="cap">花壇 ${s.areas.bed}㎡・${nPlants}種${totalQty}株</span></div>
      <div><span class="fig">${yen(c.total)}</span><span class="cap">概算（材料費・DIY）</span></div>
      <div><span class="fig">${s.bio.total}<small>点</small></span><span class="cap">生物多様性度・${esc(s.bio.label)}</span></div>
    </div>
    <details class="basis"><summary>${icon('guide', 14)}数字の根拠</summary><ul>
      <li><b>面積の内訳：</b>敷地${s.area}㎡のうち、花壇${s.areas.bed}㎡（${Math.round((s.areas.bed / s.area) * 1000) / 10}%）・小道${s.areas.path}㎡・テラス${s.areas.terrace}㎡・芝生${s.areas.lawn}㎡${s.areas.pond ? `・池${s.areas.pond}㎡` : ''}。花壇は、境界ぞいに奥行き約${Math.round(Math.max(...s.beds.map((b) => b.depth)) * 10) / 10}mまでの帯と島花壇を合わせたもので、${Math.round(s.c * 100)}cm角のマス目で数えています。</li>
      <li><b>植物の適合度：</b>◎よく育つ／○工夫すれば育つ／△難しい。この場所の過去10年の気象から求めた耐寒性ゾーン（${esc(state.climate?.zone.label || '—')}）・夏の暑さ（30℃以上の日数）・蒸し暑さ（熱帯夜）を、植物ごとの耐寒・耐暑・蒸れへの強さと比べて判定しています。○の理由は植物の説明に書いてあります。</li>
      <li><b>費用：</b>苗はポット苗の一般的な価格、構造物は材料を買ってDIYする場合の目安です。</li>
    </ul></details>
    ${s.skipped?.length ? `<p class="pnote warn">敷地が小さいため、${s.skipped.map(esc).join('・')}は入れずに、花壇を優先しました。</p>` : ''}
    ${structNames.length ? `<p class="pnote">庭にあるもの：${structNames.map(esc).join('・')}</p>` : ''}

    <section class="mag paper" id="sec-design">
      ${secHead('Design Notes', 'デザイナーの視点', 'この庭の設計の考え方と、植栽の数字。層の割合や密度は、宿根草の植栽設計でよく使われる目安と比べています。')}
      ${designNotes(sitePlants.map((x) => ({ plant: x.plant, qty: x.qty, color: x.color, role: x.role })), { area: s.areas.bed, organic: s.organic, repeats: sitePlants.filter((x) => x.beds.length >= 2).sort((a, b) => b.beds.length - a.beds.length).map((x) => x.plant), islands: s.beds.filter((b) => b.zone === 'island').length, focal: [...new Set(s.structs.map((x) => ({ water: 'バードバス', pond: '池', tree: 'シンボルツリー', pergola: 'パーゴラ', bench: 'ベンチ' })[x.type]).filter(Boolean))], scope: 'site', style: pi.style })}
    </section>

    <section class="mag" id="sec-hl">
      ${secHead('Highlights', '季節の見どころ', '一年を通して、この庭がいちばん輝く瞬間。')}
      <div class="carousel hl-cards">${s.highlights.map((h) => { const b = bedFor(h); return `<article class="hl-card">
        <div class="hl-art">${b ? elevationSVG(b.plan, midMonth(h), south, { label: false }) : ''}</div>
        <div class="hb"><span class="en">${h.en}</span><h3>${h.ja}</h3><p>${esc(h.text)}</p>
        ${h.stars.length ? `<div class="hl-stars">${h.stars.slice(0, 4).map((x) => `<span class="chip"><span class="dot" style="background:${COLORS[x.color]?.hex}"></span>${esc(x.p.groupJa.replace(/（.*?）/g, ''))}</span>`).join('')}</div>` : ''}</div>
      </article>`; }).join('')}</div>
    </section>

    <section class="mag" id="sec-tour">
      ${secHead('Garden Tour', '園内の案内', 'テラスから小道をたどって、庭をひとめぐり。番号は平面図の「園内の案内」と対応しています。')}
      <ol class="tour">${s.tour.map((t) => `<li id="tour-${t.no}"><span class="tno">${t.no}</span><div><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p></div></li>`).join('')}</ol>
    </section>

    <section class="mag" id="sec-photo">
      ${secHead('Photo Spots', 'フォトスポット', '平面図の「フォトスポット」で、撮る位置と向きを確認できます。')}
      <div class="photo-spots">${s.photos.map((ph) => `<article class="ps-card" id="photo-${ph.no}">
        <div class="ps-no">${icon('camera', 16)}<b>${ph.no}</b></div>
        <div><h3>${esc(ph.title)}</h3><p>${esc(ph.shot)}</p><p class="ps-when">${icon('sun', 14)}${esc(ph.when)}</p><p class="ps-tip">${esc(ph.tip)}</p></div>
      </article>`).join('') || '<p class="hint">パーゴラや水場を入れると、フォトスポットがふえます。</p>'}</div>
    </section>

    <section class="mag" id="sec-swild">
      ${secHead('Wildlife', '生き物と生物多様性', pi.wild.length ? `「${pi.wild.map((g) => WILD_GOALS[g]).join('・')}」を呼べるよう植物を選びました。` : '植物と庭の環境（水場・木・堆肥置き場など）から、来てくれそうな生き物を見積もりました。')}
      ${bioHtml(s.bio)}
      ${crittersHtml(s.critters, south, 12, seenSet())}
      ${webHtml(s.critters, s.plants, s.features, true)}
    </section>

    <section class="mag" id="sec-splants">
      ${secHead('Planting List', '植える植物（庭全体）', `${sitePlants.length}種・${sitePlants.reduce((t, x) => t + x.qty, 0)}株。どの花壇に植えるかは、花壇の記号をタップすると移動します。`)}
      ${state.climate ? skillSummary(s.beds[0]?.plan.skill, sitePlants.map((x) => x.grade)) : ''}
      ${(() => { const w = [...new Set(s.beds.flatMap((b) => b.plan.warnings || []))]; return w.length ? `<div class="alert warn">${w.map(esc).join('<br>')}</div>` : ''; })()}
      <div class="row"><button type="button" class="btn small" id="btnSiteMemo">${icon('cart', 15)}買い物メモをコピー</button></div>
      <div class="cast">${sitePlants.map((x, i) => `<article class="cast-card" id="scast-${i + 1}">
        <div class="cast-art">${photoHtml(x.plant, 'cast-photo', x.color)}<span class="no">${i + 1}</span></div>
        <div class="cbody">
          <span class="role">${esc(x.roleJa)}</span> ${gradeBadge(x, true)}
          <h3>${esc(x.plant.ja)}</h3>
          <p class="latin">${esc(x.plant.latin)}</p>
          <p class="calc"><span class="dot" style="background:${COLORS[x.color].hex};width:9px;height:9px"></span> ${COLORS[x.color].ja}・${x.plant.h[0]}〜${x.plant.h[1]}cm・株間${x.plant.spread}cm</p>
          ${monthBar({ ...x.plant, color: [x.color] }, south)}
          <p class="calc">${x.qty}${x.plant.type === 'bulb' ? '球' : '株'} × ${yen(x.plant.price)} = <b>${yen(x.qty * x.plant.price)}</b></p>
          <div class="bed-tags">${x.beds.map((id) => `<button type="button" class="chip" data-jump="bed-${id}"><span class="bid">${id}</span>${esc(s.beds.find((b) => b.id === id)?.name.replace(/（.*?）/g, '') || '')}</button>`).join('')}</div>
          ${x.why.length ? `<p class="sel-why${x.challenge ? ' challenge' : ''}"><b>${x.challenge ? '工夫が必要（挑戦）' : '選んだ理由'}</b>${x.why.filter((w) => !w.startsWith('工夫が必要')).map(esc).join('／')}</p>` : ''}
          <div class="why"><span>植え時 ${esc(monthsJa(plantingTime(x.plant, state.climate).plant.best))}</span>${(x.plant.roles || []).slice(0, 2).map((k) => `<span>${esc(ROLES[k].ja)}</span>`).join('')}</div>
        </div>
      </article>`).join('')}</div>
    </section>

    <section class="mag" id="sec-ssteps">
      ${secHead('Build Order', 'つくる順番', 'どこから手をつけるかの目安です。月はこの地域の気候に合わせています。植物名をタップすると説明へ移動します。')}
      ${siteSteps(s, sitePlants)}
    </section>

    <section class="mag" id="sec-srelay">
      ${secHead('Bloom Relay', '庭全体の開花リレー', '植物名をタップすると説明へ移動します。')}
      <p class="pnote ${relayText(siteCounts).zero.length ? 'warn' : 'ok'}">${esc(relayText(siteCounts).text)}</p>
      ${s.peakNote ? `<p class="pnote ${s.peakNote.ok ? 'ok' : 'warn'}">${esc(s.peakNote.text)}</p>` : ''}
      <div class="scroll-x">${calHtml(sitePlants.map((x, i) => ({ p: x.plant, color: x.color, label: i + 1, jump: `scast-${i + 1}` })), south, siteCounts)}</div>
    </section>

    <section class="mag" id="sec-beds">
      ${secHead('Beds', '花壇ごとの植栽', '塀や家・木の影を考えて、花壇ごとに日当たりを判断しています。')}
      <div class="bed-cards">${s.beds.map((b) => `<article class="bed-card" data-bedcard="${b.id}" id="bed-${b.id}">
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
      <ul id="sec-scost">
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
      <button class="btn" type="button" data-print>${icon('note', 16)}印刷する</button>
      <button class="btn" type="button" data-copysum>${icon('list', 16)}プランの概要をコピー</button>
      <button class="btn" type="button" data-keepplan>${icon('save', 16)}この案を保存して比べる</button>
      <button class="btn" type="button" data-consult="${esc(`庭まるごとプラン（敷地 約${s.area}㎡、家は${DIR_JA[s.house]}側、${structNames.join('・')}、花壇${s.beds.length}か所、植物：${s.plants.slice(0, 12).map((p) => p.groupJa.replace(/（.*?）/g, '')).join('・')}）を、もっと魅力的にするアイデアを教えてください。`)}">${icon('search', 16)}AIに相談</button>
    </div>
    ${saveHelp()}
    <div class="alt-box">
      <b>別の案をつくる</b>
      <p class="hint">構造物の配置はそのままで植物だけ選び直すか、小道の形やテラス・池・木の位置も含めて配置から考え直すかを選べます。</p>
      <div class="row"><button type="button" class="btn" data-sitealt="plants">${icon('leaf', 16)}植栽だけ変える</button><button type="button" class="btn" data-sitealt="layout">${icon('refresh', 16)}配置も変える</button></div>
    </div>`;

  hydratePhotos(box, sitePlants.map((x) => x.plant));
  $('#btnStepsCal').addEventListener('click', () => { registerSteps(s, sitePlants); renderSitePlan(); jumpTo('sec-ssteps'); });
  $('#btnSiteMemo').addEventListener('click', async () => {
    const lines = sitePlants.map((x, i) => `${i + 1}. ${x.plant.ja} × ${x.qty}${x.plant.type === 'bulb' ? '球' : '株'}（花壇${x.beds.join('・')}）約${yen(x.qty * x.plant.price)}`);
    const text = `【${title}】苗の買い物メモ\n${lines.join('\n')}\n――\n合計 ${sitePlants.length}種・${sitePlants.reduce((t, x) => t + x.qty, 0)}株・約${yen(sitePlants.reduce((t, x) => t + x.qty * x.plant.price, 0))}`;
    toast((await copyText(text)) ? '買い物メモをコピーしました。メモアプリなどに貼り付けて使えます' : 'コピーできませんでした');
  });
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
    g.planSnap = planSnap();
    g.plants = s.plants.map((p) => p.id);
    g.area = s.areas.bed; // 花壇の面積（株数の計算に使う）
    g.siteArea = s.area; // 庭全体の面積
    g.sun = pi.sun || '';
    g.moist = pi.moist || '';
    g.features = { ...s.features };
    state.gardenId = g.id;
    if (!saveGardens()) { toast('保存できませんでした。端末の空き容量やブラウザの設定（プライベートモードなど）を確かめてください'); return; }
    toast(`「${g.name}」に庭のプランを反映しました（植物${g.plants.length}種）`);
    go('garden');
  };
  $('#btnSiteApply').addEventListener('click', () => {
    const g = activeGarden();
    if (g.plants.length && !confirm(`「${g.name}」の植物をこのプランで置き換えます。よろしいですか？`)) { toast(`置き換えをやめました（「${g.name}」はそのままです）`); return; }
    applyTo(g);
  });
  $('#btnSiteNew').addEventListener('click', () => {
    const g = { id: 'g' + Date.now().toString(36), name: uniqueGardenName(title), plants: [], area: 3, sun: '', moist: '', have: {}, features: {} };
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
  $('#originPane').hidden = state.zukan !== 'origin';
  if (state.zukan === 'critters') renderCritters();
  else if (state.zukan === 'origin') renderOrigin();
  else renderPlants();
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
// ---------- 庭の仲間たち（なかよし度・おみやげ・アルバム） ----------
let friendLog = store.get('friends', {});
const dayHash = (str) => { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const dayRand = (key) => { let a = dayHash(key); return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const heartsHtml = (n, max = 4) => `<span class="hearts" aria-label="なかよし度 ${n}">${'♥'.repeat(n)}<i>${'♥'.repeat(Math.max(0, max - n))}</i></span>`;
/** 今日の来客を記録（1日1回、なかよし度が上がる。ときどきおみやげ） */
function meetFriends(vs, rand) {
  const today = todayStr();
  let changed = false;
  for (const v of vs) {
    const id = v.friend.id;
    const e = friendLog[id] || { days: 0, first: today, gifts: [] };
    if (e.last !== today) {
      e.days++; e.last = today; changed = true;
      const gifts = FRIEND_EXTRA[id]?.gifts || [];
      const lv = friendLevel(e.days).hearts;
      if (e.gifts.length < gifts.length && e.days >= 2 && rand() < 0.2 + lv * 0.06) { e.gifts.push(e.gifts.length); e.giftNew = true; }
    }
    friendLog[id] = e;
  }
  if (changed) store.set('friends', friendLog);
}
function visitorsHtml(mine, north, c) {
  const groups = new Set(mine.map((p) => p.group));
  const ctx = {
    month: north,
    blooming: [...new Set(mine.filter((p) => p.bloom.includes(north)).map((p) => p.groupJa.replace(/（.*?）/g, '')))],
    plants: mine, features: activeGarden().features || {}, rain: false,
    has: (id) => (id === 'grass' ? mine.some((p) => p.form === 'grass') : groups.has(id)),
  };
  state.friendCtx = ctx;
  // 来客は日ごとに決まる（画面を開き直しても同じ顔ぶれ）
  const rand = dayRand(todayStr() + activeGarden().id);
  const vs = visitors(ctx, rand);
  if (!vs.length) return '';
  meetFriends(vs, rand);
  return `<section class="visitors">
    <header><span class="en">Garden Friends</span><h3>今日の庭のお客さん</h3><button type="button" class="link" data-friendalbum>${icon('book', 14)}仲間アルバム</button></header>
    <div class="vis-row">${vs.map((v) => {
      const e = friendLog[v.friend.id] || { days: 0, gifts: [] };
      const lv = friendLevel(e.days);
      return `<div class="visitor" data-fid="${v.friend.id}">
        <button type="button" class="v-art" data-talk="${v.friend.id}" aria-label="${esc(v.friend.name)}に話しかける">${friendSVG(v.friend, 60)}</button>
        <div class="v-say"><b>${esc(v.friend.who)}の${esc(v.friend.name)} ${heartsHtml(lv.hearts)}</b><span class="v-line">${esc(v.line)}</span>
          <span class="v-acts"><button type="button" class="chip" data-talk="${v.friend.id}">話しかける</button>${e.giftNew ? `<button type="button" class="chip gift" data-gift="${v.friend.id}">🎁 おみやげ</button>` : ''}<button type="button" class="chip" data-critter="${v.friend.critter}">図鑑</button></span>
        </div>
      </div>`;
    }).join('')}</div>
  </section>`;
}
/** 仲間アルバム（楽しむ） */
function friendAlbumHtml() {
  const met = FRIENDS.filter((f) => friendLog[f.id]?.days);
  const giftN = Object.values(friendLog).reduce((t, e) => t + (e.gifts?.length || 0), 0);
  const giftAll = Object.values(FRIEND_EXTRA).reduce((t, x) => t + x.gifts.length, 0);
  return `<section class="mag" id="friendAlbum">
    ${secHead('Garden Friends', '庭の仲間アルバム', `会えた仲間 ${met.length}/${FRIENDS.length}・おみやげ ${giftN}/${giftAll}。毎日ホームを開くと、庭に遊びに来た仲間と、なかよしになれます。`)}
    <div class="album">${FRIENDS.map((f) => {
      const e = friendLog[f.id];
      if (!e?.days) {
        const ms = f.months;
        return `<div class="al-card unmet"><span class="al-art">${friendSVG(f, 56)}</span><b>？？？</b><small>${ms.length >= 9 ? '春から秋' : monthsJa(ms.map((m) => localMonth(m, !!state.climate?.south)))}に来るかも</small></div>`;
      }
      const lv = friendLevel(e.days);
      return `<button type="button" class="al-card" data-friend="${f.id}"><span class="al-art">${friendSVG(f, 56)}</span><b>${esc(f.name)}</b><small>${esc(f.who)}</small>${heartsHtml(lv.hearts)}<small>${esc(lv.ja)}</small>${e.giftNew ? '<em>🎁</em>' : ''}</button>`;
    }).join('')}</div>
  </section>`;
}
function openFriend(id) {
  const f = FRIENDS.find((x) => x.id === id);
  const e = friendLog[id] || { days: 0, gifts: [] };
  const x = FRIEND_EXTRA[id];
  const lv = friendLevel(e.days);
  const next = FRIEND_LEVELS.find((l) => l.min > e.days);
  if (e.giftNew) { e.giftNew = false; store.set('friends', friendLog); }
  const lines = f.lines(state.friendCtx || { month: new Date().getMonth() + 1, blooming: [], plants: [], features: {}, rain: false, has: () => false }).filter(Boolean);
  openSheet(`${esc(f.who)}の${esc(f.name)}`, `<div class="friend-prof">
    <div class="fp-top"><span class="fp-art">${friendSVG(f, 96)}</span><div>
      <p>${heartsHtml(lv.hearts)} <b>${esc(lv.ja)}</b></p>
      <p class="hint" style="margin:2px 0">会った日 ${e.days}日・はじめて会った日 ${e.first ? esc(dateJa(e.first)) : '—'}</p>
      ${next ? `<p class="hint" style="margin:2px 0">あと${next.min - e.days}日会うと「${esc(next.ja)}」</p>` : '<p class="hint" style="margin:2px 0">いちばんの親友です。</p>'}
    </div></div>
    <p class="fp-say">「${esc(lines[Math.floor(Math.random() * lines.length)] || '')}」</p>
    <dl class="fp-dl"><dt>好きなもの</dt><dd>${esc(x?.likes || '')}</dd>
      <dt>ひみつ</dt><dd>${lv.hearts >= 3 ? esc(x?.secret || '') : '🔒 「なかよし」になると教えてくれます。'}</dd></dl>
    <h3 class="fp-h">おみやげ（庭づくりのコツ）</h3>
    <div class="gift-cards">${(x?.gifts || []).map((g, i) => e.gifts.includes(i) ? `<div class="gift-card"><b>${esc(g.title)}</b><p>${esc(g.text)}</p></div>` : '<div class="gift-card locked"><b>？</b><p>また会いに来たときに、置いていってくれるかも。</p></div>').join('')}</div>
    <button type="button" class="btn small" data-critter="${f.critter}">${icon('book', 15)}生き物図鑑で見る</button>
  </div>`, 'sheet-friend');
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-talk]');
  if (t) {
    const f = FRIENDS.find((x) => x.id === t.dataset.talk);
    const card = t.closest('.visitor');
    const el = card?.querySelector('.v-line');
    if (!f || !el) return;
    const lines = f.lines(state.friendCtx).filter(Boolean);
    let w = el.textContent;
    for (let i = 0; i < 6 && w === el.textContent; i++) w = lines[Math.floor(Math.random() * lines.length)];
    el.textContent = w;
    const art = card.querySelector('.v-art');
    art.classList.remove('hop'); void art.offsetWidth; art.classList.add('hop');
    return;
  }
  const g = e.target.closest('[data-gift]');
  if (g) { openFriend(g.dataset.gift); g.remove(); return; }
  const a = e.target.closest('[data-friend]');
  if (a) { openFriend(a.dataset.friend); return; }
  if (e.target.closest('[data-friendalbum]')) { state.enjoyTab = 'season'; go('enjoy'); setTimeout(() => jumpTo('friendAlbum'), 150); }
});
/** 記録したときに、庭の仲間がひとこと */
const THANKS = ['記録ありがとう！あとで見返すと、きっと楽しいよ。', 'いい記録だね。来年の今ごろ、くらべてみよう。', 'ちゃんと見てくれてるの、うれしいな。', '庭のこと、ノートに残しておくと仲間もふえるよ。'];
function friendToast() {
  const met = FRIENDS.filter((f) => friendLog[f.id]?.days && f.months.includes(localMonth(new Date().getMonth() + 1, !!state.climate?.south)));
  const f = met[Math.floor(Math.random() * met.length)];
  if (!f) { toast('記録しました'); return; }
  const t = $('#toast');
  t.innerHTML = `<span class="ft-art">${friendSVG(f, 34)}</span><span><b>${esc(f.name)}</b>：${esc(THANKS[Math.floor(Math.random() * THANKS.length)])}</span>`;
  t.classList.add('friend');
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; t.classList.remove('friend'); }, 3200);
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


document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-tsupinext]') || !state.tsupiCtx) return;
  const el = $('#tsupiWord');
  if (!el) return;
  let w = el.textContent;
  for (let i = 0; i < 6 && w === el.textContent; i++) w = tsupiLine(state.tsupiCtx);
  el.textContent = w;
});

/** 平面図の凡例（色・番号・名前・株数） */
function planLegend(plan) {
  const col = mapColors(plan);
  return `<ol class="plan-legend">${plan.species.map((sp) => `<li><button type="button" data-jump="cast-${sp.no}"><span class="lg-sw${sp.role === 'under' ? ' bulb' : ''}" style="background:${col.get(sp.no)}"></span><b>${sp.no}</b><span class="lg-name">${esc(sp.plant.ja)}</span><small>${sp.qty}${sp.plant.type === 'bulb' ? '球' : '株'}・${sp.plant.h[1]}cm・株間${sp.plant.spread}cm</small></button></li>`).join('')}</ol>`;
}
/** 植え付けの手順（この花壇の場合） */
function plantingSteps(plan) {
  const under = plan.species.filter((sp) => sp.role === 'under');
  const big = [...plan.species].filter((sp) => sp.role !== 'under').sort((a, b) => b.plant.h[1] - a.plant.h[1]).slice(0, 2);
  const curve = plan.shape && plan.shape !== 'rect';
  const steps = [
    curve ? (plan.shape === 'circle' ? `円の中心に杭を打ち、半径${plan.width / 2}mのひもを結んで一周させ、砂や小麦粉で縁の線を引く。` : plan.shape === 'oval' ? `楕円は、中心から左右に約${Math.round(Math.sqrt(Math.max(0, (plan.width / 2) ** 2 - (plan.depth / 2) ** 2)) * 100) / 100}mの所へ杭を2本打ち、長さ${plan.width}mの輪にしたひもを杭にかけて、ぴんと張りながら一周すると描ける。` : 'ホースやロープを地面に置いて、配置図の曲線になるよう形を整え、砂や小麦粉で縁の線を引く。離れて眺め、なめらかな曲線になっているか確かめる。') + '縁にはレンガやエッジ材を埋めると、芝生や雑草が入り込みにくい。' : '',
    `植える場所の土を30cmほど掘り返し、堆肥と腐葉土を混ぜておく（${plan.area.toFixed(1)}㎡で堆肥 約${Math.ceil(plan.area * 10)}L）。`,
    `配置図の方眼（50cm）を目安に、苗をポットのまま地面に並べてみる。背の高い${big.map((sp) => sp.plant.groupJa.replace(/（.*?）/g, '')).join('・')}から置くと位置が決めやすい。`,
    '同じ植物はまとめて置き、群れの形が三角形や不等辺になるようにすると自然に見える。株間は植物の「株間」の数字を守る（苗が小さくても、育つと広がる）。',
    under.length ? `${under.map((sp) => sp.plant.groupJa.replace(/（.*?）/g, '')).join('・')}の球根は、秋に宿根草の株の間へ5〜9球ずつまとめて植える（深さは球根の高さの2〜3倍）。花後に葉が消えたあとは、まわりの宿根草が場所を埋めてくれる。` : '',
    '植えたらたっぷり水をやり、株元をバークチップや腐葉土で覆う（マルチング）。最初の1か月は乾かさないように。',
    '1年目は株がまばらに見えても大丈夫。2〜3年で配置図の「広がり」くらいまで育ち、すき間が埋まる。',
  ].filter(Boolean);
  return `<details class="plant-steps"><summary>${icon('trowel', 16)}この花壇の植え付け手順</summary><ol class="steps-num">${steps.map((t) => `<li>${esc(t)}</li>`).join('')}</ol></details>`;
}

/** 植栽の役割のバランスとアドバイス */
function roleBalanceHtml(plan) {
  const rc = plan.roleCount || {};
  const keys = ['structure', 'accent', 'filler', 'matrix', 'edging', 'groundcover', 'shadecover', 'screen', 'hanging'];
  const advice = [];
  if (!rc.groundcover && !rc.shadecover && plan.area >= 2) advice.push('グラウンドカバーがありません。足元を覆う植物を加えると、雑草や土の乾燥を防げます（プランの「足元をグラウンドカバーで覆う」で追加できます）。');
  if (!rc.structure && plan.depth >= 0.8) advice.push('冬も形を保つ「骨格」の植物がないので、冬は寂しく見えるかもしれません。グラスや背の高い穂の植物を足すと締まります。');
  if (!rc.accent) advice.push('目を引く「主役」がないので、球形の花や銀葉の植物をひとつ入れるとメリハリが出ます。');
  if (!rc.edging && !rc.groundcover && plan.view === 'border') advice.push('手前の縁に低くまとまる植物を並べると、花壇の輪郭がきれいに見えます。');
  return `<div class="role-bars">${keys.filter((k) => rc[k]).map((k) => `<button type="button" class="role-bar" data-role="${k}" title="${esc(ROLES[k].text)}"><span>${esc(ROLES[k].ja)}</span><i style="width:${Math.min(100, (rc[k] / plan.species.length) * 100)}%"></i><b>${rc[k]}種</b></button>`).join('')}</div>
    ${advice.length ? `<ul class="role-advice">${advice.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="pnote ok">骨格・主役・足元まで、役割のバランスがとれた植栽です。</p>'}`;
}

// ---------- ハーブティー ----------
$('#enjoyTabs').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  state.enjoyTab = b.dataset.v;
  render();
  window.scrollTo({ top: 0 });
});
function teaLinks(p) {
  const ings = teaIngredientsFor(p);
  if (!ings.length) return '';
  const recs = [...new Map(ings.flatMap((i) => i.recipes).map((r) => [r.id, r])).values()];
  return `<div class="tealinks"><b>${icon('cup', 15)}ハーブティーに（${esc(ings.map((i) => i.part).join('・'))}）</b>
    <div class="chips">${recs.slice(0, 6).map((r) => `<button type="button" class="chip" data-tea="${r.id}">${esc(r.name)}</button>`).join('')}</div></div>`;
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-tea]');
  if (!t) return;
  state.enjoyTab = 'tea';
  state.teaF = { mood: '', show: 'all' };
  state.teaOpen = t.dataset.tea;
  go('enjoy');
  setTimeout(() => jumpTo(`tea-${t.dataset.tea}`), 120);
});

function renderTea() {
  const box = $('#teaBox');
  const south = !!state.climate?.south;
  const north = localMonth(new Date().getMonth() + 1, south);
  const mine = state.garden.map((id) => byId.get(id)).filter(Boolean);
  const groups = new Set([...mine.map((p) => p.group), ...mine.map((p) => p.id)]);
  const f = state.teaF;
  const statusOf = new Map(TEA_RECIPES.map((r) => [r.id, teaStatus(r, groups)]));
  let list = TEA_RECIPES.filter((r) => !f.mood || r.moods.includes(f.mood));
  if (f.show === 'garden') list = list.filter((r) => statusOf.get(r.id).canMake);
  list.sort((a, b) => statusOf.get(b.id).have.length - statusOf.get(a.id).have.length);
  const myIngs = Object.entries(INGREDIENTS).filter(([, v]) => v.group && ingOwned(v, groups));
  const canCount = TEA_RECIPES.filter((r) => statusOf.get(r.id).canMake).length;
  const ingLine = (x) => {
    const ing = INGREDIENTS[x.k];
    const have = ing.store ? 'store' : ingOwned(ing, groups) ? 'have' : 'need';
    const mark = have === 'have' ? '<span class="ing-ok">✓ 庭</span>' : have === 'store' ? '<span class="ing-store">買う</span>' : `<button type="button" class="ing-need" data-find="${esc(byGroupJa(ing.group))}">＋ 育てる</button>`;
    return `<li>${mark}<b>${esc(ing.ja)}</b>${ing.part ? `<small>（${esc(ing.part)}）</small>` : ''}<span>${esc(x.amt)}</span></li>`;
  };
  box.innerHTML = `
    <section class="hero tea-hero">
      <div class="hero-text" style="margin-top:0">
        <span class="kicker">Garden Tisanes</span>
        <h1>庭のハーブティー</h1>
        <p class="sekki">${groups.size ? `「${esc(activeGarden().name)}」の植物で作れるお茶が <b>${canCount}</b> 種類あります。` : 'マイ庭にハーブを加えると、庭で作れるお茶がわかります。'}</p>
      </div>
    </section>
    ${myIngs.length ? `<section class="mag">
      ${secHead('From Your Garden', '庭で採れるお茶の材料', '摘みどきと乾かし方の目安です。')}
      <div class="tea-ings">${myIngs.map(([k, v]) => `<div class="tea-ing"><b>${esc(v.ja)}</b><small>${esc(v.part)}</small><p>${icon('calendar', 13)}${esc(v.harvest)}</p><p>${icon('leaf', 13)}${esc(v.dry)}</p></div>`).join('')}</div>
    </section>` : ''}
    <section class="mag">
      ${secHead('Recipes', 'レシピを探す', '気分や用途で選んでみてください。')}
      <div class="chips mood-chips"><button type="button" class="chip${!f.mood ? ' on' : ''}" data-mood="">すべて</button>${Object.entries(MOODS).map(([k, v]) => `<button type="button" class="chip${f.mood === k ? ' on' : ''}" data-mood="${k}">${esc(v)}</button>`).join('')}</div>
      <div class="seg small tea-show"><button type="button" data-show="garden" class="${f.show === 'garden' ? 'on' : ''}">庭の材料で作れる</button><button type="button" data-show="all" class="${f.show === 'all' ? 'on' : ''}">レシピ図鑑（すべて${TEA_RECIPES.length}種）</button></div>
      <p class="count">${list.length}種類</p>
      <div class="tea-list">${list.map((r) => { const st = statusOf.get(r.id); const inSeason = r.ings.some((x) => { const g = INGREDIENTS[x.k]?.group; const p = g && mine.find((q) => q.group === g); return p && (p.bloom.includes(north) || p.harvest?.includes(north) || ['葉', '葉・茎', '枝・葉'].includes(INGREDIENTS[x.k].part)); }); return `<article class="tea-card" id="tea-${r.id}">
        <div class="tc-head">${teaCupSVG(r.color, 60)}<div><h3>${esc(r.name)}</h3><div class="tc-moods">${r.moods.map((m) => `<span>${esc(MOODS[m])}</span>`).join('')}</div>
          ${st.all ? '<span class="tc-ok">庭の材料だけで作れる</span>' : st.canMake ? '<span class="tc-ok part">庭の材料で作れる</span>' : st.have.length ? `<span class="tc-part">庭の材料 ${st.have.length}/${st.garden.length}</span>` : ''}${inSeason && st.have.length ? '<span class="tc-season">いま摘める</span>' : ''}</div></div>
        <p class="tc-taste">${esc(r.taste)}</p>
        <ul class="tc-ings">${r.ings.map(ingLine).join('')}</ul>
        <details${state.teaOpen === r.id ? ' open' : ''}><summary>淹れ方（${esc(r.temp)}・${esc(r.time)}）</summary>
          <ol class="steps-num">${r.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
          ${r.tip ? `<p class="tc-tip">${icon('bulb', 14)}${esc(r.tip)}</p>` : ''}
          ${r.caution ? `<p class="tc-caution">${esc(r.caution)}</p>` : ''}
        </details>
      </article>`; }).join('') || '<p class="empty">この条件で作れるお茶はまだありません。「レシピ図鑑」で全部のレシピを見て、育てたいハーブを探してみてください。</p>'}</div>
    </section>
    <p class="note">ハーブティーは香りと味を楽しむためのものです。病気の治療を目的にしないでください。妊娠中・授乳中の人、持病のある人、薬を飲んでいる人は医師や薬剤師に相談を。農薬を使った植物や、種類のはっきりしない植物は使わないでください。</p>`;
  state.teaOpen = null;
  box.querySelector('.mood-chips').addEventListener('click', (e) => { const b = e.target.closest('[data-mood]'); if (b) { f.mood = b.dataset.mood; renderTea(); } });
  box.querySelector('.tea-show').addEventListener('click', (e) => { const b = e.target.closest('[data-show]'); if (b) { f.show = b.dataset.show; renderTea(); } });
}
const byGroupJa = (g) => PLANTS.find((p) => p.group === g)?.groupJa || g;

// ---------- 原産地モード（図鑑） ----------
function renderOrigin() {
  const box = $('#originPane');
  const id = REGIONS[state.region] ? state.region : 'japan';
  const R = REGIONS[id];
  const groups = new Map();
  for (const p of PLANTS) if (!groups.has(p.group)) groups.set(p.group, p);
  const all = [...groups.values()];
  const counts = {};
  for (const p of all) for (const o of p.origin || []) counts[o] = (counts[o] || 0) + 1;
  const here = all.filter((p) => p.origin?.includes(id)).sort((a, b) => ORDER.get(a.id) - ORDER.get(b.id));
  const mine = new Set(state.garden.map((x) => byId.get(x)?.group));
  const c = state.climate;
  const byType = {};
  for (const p of here) { const t = p.tags.includes('veg') && p.harvest ? '野菜' : TYPE_JA[p.type] || 'その他'; (byType[t] = byType[t] || []).push(p); }
  box.innerHTML = `
    <section class="card origin-top">
      <span class="en">Plants of the World</span><h2>原産地から見る図鑑</h2>
      <p class="hint" style="margin:2px 0 8px">地図の地域をタップすると、その土地生まれの植物と風景を表示します。数字は図鑑に載っている種類の数です。</p>
      <div class="map-wrap">${worldMapSVG({ selected: id, counts })}</div>
      <div class="chips region-chips">${Object.entries(REGIONS).sort((a, b) => (counts[b[0]] || 0) - (counts[a[0]] || 0)).map(([k, v]) => `<button type="button" class="chip${k === id ? ' on' : ''}" data-region-pick="${k}">${esc(v.ja)}<small>${counts[k] || 0}</small></button>`).join('')}</div>
    </section>
    <section class="card region-card">
      <div class="scene">${userPhotos.has(`img:region:${id}`) ? `<img class="user-img" src="${userPhotos.get(`img:region:${id}`)}" alt="${esc(R.ja)}の風景（登録した画像）">` : sceneSVG(id)}<figure class="scene-photo" id="scenePhoto" hidden></figure></div>
      ${imageSlot('region', id, '', regionPrompt(id), true)}
      <span class="en">Native Landscape</span><h2>${esc(R.ja)}</h2>
      <p class="region-text">${esc(R.text)}</p>
      ${c ? `<p class="hint">あなたの庭では、${here.filter((p) => evaluate(p, c).level === 3).length}種が◎よく育つ見込みです。${mine.size ? `マイ庭にはこの地域の植物が${here.filter((p) => mine.has(p.group)).length}種あります。` : ''}</p>` : ''}
    </section>
    ${Object.entries(byType).map(([t, list]) => `<section class="mag"><header class="sec"><h2>${esc(t)}<small>（${list.length}種）</small></h2></header>
      <div class="origin-list">${list.map((p) => { const lv = c ? evaluate(p, c).level : null; return `<button type="button" class="origin-item" data-find="${esc(p.groupJa)}">
        <span class="dot" style="background:${COLORS[p.color[0]].hex}"></span><span class="oi-name" title="${esc(p.groupJa)}">${esc(p.groupJa)}${mine.has(p.group) ? ' <small>✓マイ庭</small>' : ''}</span>
        <span class="oi-sub">${esc(p.latin.split(/ '/)[0])}${lv ? `・${LEVEL[lv].mark}` : ''}</span></button>`; }).join('')}</div></section>`).join('')}
    <p class="note">原産地は、種（園芸品種は交配のもとになった種）が自生するおおまかな地域です。風景はイメージのイラストです。</p>`;
  box.querySelector('.map-wrap').addEventListener('click', (e) => { const g = e.target.closest('[data-region]'); if (g) { state.region = g.dataset.region; renderOrigin(); } });
  box.querySelector('.region-chips').addEventListener('click', (e) => { const b = e.target.closest('[data-region-pick]'); if (b) { state.region = b.dataset.regionPick; renderOrigin(); box.querySelector('.region-card').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  // その土地の写真（Wikipedia。取得できなければイラストのみ）
  placeImage(R.wiki).then((img) => {
    const fig = $('#scenePhoto');
    if (!img || !fig || state.region !== id) return;
    fig.innerHTML = `<img src="${esc(img.src)}" alt="${esc(R.ja)}の風景" loading="lazy"><figcaption><a href="${esc(img.url)}" target="_blank" rel="noopener">写真：${esc(img.site)}</a></figcaption>`;
    fig.hidden = false;
  });
}

// ---------- イメージ画像（スタイル・風景）：自動のイラスト＋画像生成AIへの依頼文＋自分の画像の登録 ----------
const styleSample = new Map();
function styleArt(k) {
  const mine = userPhotos.get(`img:style:${k}`);
  if (mine) return `<img class="user-img" src="${mine}" alt="${esc(STYLES[k].ja)}のイメージ（登録した画像）">`;
  if (!styleSample.has(k)) {
    const pl = generatePlan({ climate: state.climate, sun: 'full', moist: '', width: 4, depth: 1.6, text: '', style: k, annuals: true, seed: 3 });
    styleSample.set(k, pl.species.length ? elevationSVG(pl, pl.peak, !!state.climate?.south, { label: false }) : '');
  }
  return styleSample.get(k);
}
function stylePrompt(k, plan) {
  const st = STYLES[k];
  const names = (plan?.species || []).slice(0, 8).map((sp) => sp.plant.groupJa.replace(/（.*?）/g, '')).join('、');
  const m = plan?.peak || 6;
  return `「${st.ja}」の植栽スタイルでつくった、家庭の庭の花壇の画像を作ってください。
スタイルの特徴：${st.summary}
${names ? `植える植物：${names}\n` : ''}季節：${m}月ごろ
人物・文字・ロゴは入れず、やわらかな自然光の写真風で、横長（16:9）にしてください。`;
}
function regionPrompt(id) {
  const R = REGIONS[id];
  return `「${R.ja}」で、野生の植物が育っている典型的な自然の風景の画像を作ってください。
特徴：${R.text}
人物・建物・文字は入れず、自然な写真風で、横長（16:9）にしてください。`;
}
/** 画像の枠：登録した画像の表示と、画像生成AIへの依頼・登録ボタン */
function imageSlot(kind, id, fallback, prompt, compact = false) {
  const key = `img:${kind}:${id}`;
  const mine = userPhotos.get(key);
  aiTexts[`gen-${kind}-${id}`] = () => prompt;
  return `<div class="img-slot${compact ? ' compact' : ''}">
    ${compact ? '' : `<div class="is-art">${mine ? `<img class="user-img" src="${mine}" alt="イメージ画像（登録した画像）">` : fallback}</div>`}
    <div class="is-acts">
      <button type="button" class="btn small" data-genimg="${kind}|${id}">${icon('camera', 15)}画像生成AIでイメージを作る</button>
      <label class="btn small">${icon('plus', 15)}${mine ? '画像を変更' : '画像を登録'}<input type="file" accept="image/*" data-imgreg="${key}" hidden></label>
      ${mine ? `<button type="button" class="btn small" data-imgdel="${key}">登録した画像を外す</button>` : ''}
    </div>
  </div>`;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-genimg]');
  if (b) {
    const [kind, id] = b.dataset.genimg.split('|');
    const key = `gen-${kind}-${id}`;
    const prompt = aiTexts[key]?.() || '';
    openSheet(`${icon('camera', 19)} 画像生成AIでイメージを作る`, `
      <div class="consult">
        <p class="hint">無料で使えるAIアプリ（ChatGPT・Gemini など）の画像生成で、イメージ画像を作れます。できた画像を保存して「画像を登録」から選ぶと、このアプリに表示されます。このアプリからAIに送信はせず、料金もかかりません（各アプリの無料の範囲には回数の上限があります）。</p>
        <ol class="howto steps3">
          <li><b>AIアプリを選ぶ</b><div class="row ai-apps">${aiAppButtons(key)}</div><p class="hint" style="margin:6px 0 0">ボタンを押すと依頼文がコピーされます。文が入っていなければ貼り付けてください。</p></li>
          <li><b>できた画像を長押しして保存</b></li>
          <li><b>このアプリに登録</b><label class="btn small primary">${icon('plus', 15)}画像を登録<input type="file" accept="image/*" data-imgreg="img:${kind}:${id}" hidden></label></li>
        </ol>
        <details><summary>依頼文の中身を見る</summary><pre class="prompt-view">${esc(prompt)}</pre></details>
        <p class="note">AIが作る画像は想像図です。実在の場所や植物の正確な姿とは異なることがあります。</p>
      </div>`, 'sheet-consult');
    return;
  }
  const d = e.target.closest('[data-imgdel]');
  if (d) {
    deletePhoto(d.dataset.imgdel).then(() => { userPhotos.delete(d.dataset.imgdel); styleSample.clear(); toast('登録した画像を外しました'); refreshImgViews(); });
  }
});
document.addEventListener('change', async (e) => {
  const inp = e.target.closest('[data-imgreg]');
  if (!inp || !inp.files?.[0]) return;
  try {
    const photo = await shrinkImage(inp.files[0], 1400, 0.82);
    await savePhoto(inp.dataset.imgreg, photo);
    userPhotos.set(inp.dataset.imgreg, photo);
    if (!$('#sheet').hidden) closeSheet();
    toast('画像を登録しました');
    refreshImgViews();
  } catch (err) { toast(err.message); }
});
function refreshImgViews() {
  const y = window.scrollY;
  if (state.view === 'plan') { initStyleCards(); renderPlan(); }
  else if (state.view === 'plants') renderZukan();
  window.scrollTo({ top: y });
}
function initStyleCards() {
  document.querySelectorAll('#styleCards .style-card').forEach((c) => { c.querySelector('.sc-art').innerHTML = styleArt(c.dataset.style); });
}

// ---------- 植え時（図鑑） ----------
/** 育てる条件：耐寒温度・日照時間・土の酸度・潮風 */
function growHtml(p, compact = false) {
  const ct = coldTemp(p);
  const ph = soilPH(p);
  const items = [
    ['耐寒温度', ct == null ? '一年草（冬越しなし）' : `約${ct}℃まで（耐寒ゾーン${zoneJa(p.zone[0])}${p.fit?.zoneVerified ? '' : '・目安'}）`],
    ['夏の暑さ', heatJa(p)],
    ['日照', sunHours(p)],
    ['土の酸度', `pH ${ph.range}・${ph.ja}`],
    ...(p.fit?.saltTolerance ? [['潮風', '比較的強い']] : []),
    ...(p.fit?.chillRequirement ? [['冬の低温', p.fit.chillRequirement === 'high' ? '冬に低温に当たらないと咲かない（暖地では冷蔵処理など）' : '低温に当たると花つきがよい（なくても咲く）']] : []),
  ];
  const src = sourceOf(p);
  if (compact) return `<p class="grow-mini">${items.map(([k, v]) => `${k} ${esc(v.replace(/（.*?）/g, ''))}`).join('・')}</p>`;
  return `<dl class="grow-dl">${items.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>${src}`;
}
/** 夏の暑さへの強さ（出典で確かめたものと、目安を区別して表示） */
function heatJa(p) {
  const v = p.verified;
  if (v?.heatMax != null) return v.heatMax >= 8 ? '米国南部の特に暑い地域の夏には弱い（出典）' : '暑さ・蒸し暑さに弱い（出典）';
  if (v?.heatMin != null) return `暑さに強い（米国ノースカロライナ州の、夏が暑く蒸す沿岸平野でも育つ）`;
  if (v?.regionCool) return `米国ノースカロライナ州では${v.region.includes('P') ? '丘陵・山地' : '山地'}向き（夏の暑い沿岸平野は推奨地域外）`;
  if (p.type === 'annual') return p.sow === 'cool' ? '暑さが苦手（夏前に咲き終わる）' : '暑さに強い';
  return `目安：ヒートゾーン${p.heat}まで（出典未確認）`;
}
/** 生育条件の出典 */
function sourceOf(p) {
  const out = [];
  if (p.verified?.src === 'ncsu') { const q = NCSU_NOTES[speciesKey(p.latin)]; out.push(`<a href="${p.verified.url}" target="_blank" rel="noopener">NC State Extension Plant Toolbox</a>（耐寒ゾーン・推奨地域・暑さ／湿気／塩への強さ、CC BY 4.0）${q ? `本文：“${esc(q)}”` : ''}`); }
  if (p.climateSrc) out.push(esc(p.climateSrc));
  if (p.fit?.chillRequirement && (CHILL_SRC[p.id] || CHILL_SRC[p.group])) out.push(`冬の低温：${esc(CHILL_SRC[p.id] || CHILL_SRC[p.group])}`);
  return `<p class="grow-src">${out.length ? `出典：${out.join('／')}` : '生育条件は一般的な栽培情報にもとづく目安です（出典の確認はまだ）。'}</p>`;
}
function timingHtml(p) {
  const t = plantingTime(p, state.climate);
  const now = new Date().getMonth() + 1;
  const cells = MONTHS.map((m) => {
    const cls = t.plant.best.includes(m) ? 'b' : t.plant.ok.includes(m) ? 'o' : t.avoid.includes(m) ? 'x' : '';
    return `<span class="${cls}${m === now ? ' now' : ''}">${m}${t.sow?.best.includes(m) ? '<i>種</i>' : ''}</span>`;
  }).join('');
  return `<div class="timing">
    <b>${icon('calendar', 15)}植え時${state.loc ? `<small>（${esc(state.loc.name)}の気候から）</small>` : ''}</b>
    <div class="tbar" aria-label="植え時のカレンダー">${cells}</div>
    <p>${esc(t.text)}。${esc(t.why)}。</p>
    <p class="tlegend"><i class="b"></i>適期 <i class="o"></i>植えられる <i class="x"></i>避けたい ${t.sow ? '<em>種</em>種まき' : ''}　鉢植えなら：${esc(t.pot)}</p>
  </div>
  ${growHtml(p)}`;
}

// ---------- 鉢植えガイド（図鑑） ----------
function potBox(p) {
  const g = potGuide(p);
  return `<details class="potbox"><summary>${icon('pot', 16)}鉢植えにするなら<span class="suit s${g.suit}">${esc(g.suitText)}</span></summary>
    <div class="scroll-x">${potGuideSVG(g)}</div>
    <dl class="potdl">
      <dt>鉢の大きさ</dt><dd><b>${g.go}号</b>（直径約${g.cm}cm・土 約${g.liters}L）・${esc(g.depth)}<small>${esc(g.count)}</small></dd>
      <dt>用土</dt><dd>${esc(g.mix.ja)}：${g.mix.parts.map((x) => `${esc(x.ja)} ${x.part}`).join('：')}</dd>
      <dt>水やり</dt><dd>${esc(g.water)}</dd>
      <dt>肥料</dt><dd>${esc(g.feed)}</dd>
      <dt>植え替え</dt><dd>${esc(g.repot)}</dd>
    </dl>
    ${g.notes.length ? `<ul class="potnotes">${g.notes.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    <p class="note">市販の「草花用培養土」や「野菜用培養土」でも育ちます。配合は、自分で土を作るときの目安です。</p>
  </details>`;
}
document.addEventListener('click', (e) => {
  const r = e.target.closest('[data-role]');
  if (r) {
    Object.assign(state.filters, { q: '', role: r.dataset.role, origin: '', family: '', type: '', use: '', tag: '' });
    store.set('filters', state.filters);
    state.zukan = 'plants';
    if (state.view === 'plants') { renderZukan(); window.scrollTo({ top: 0, behavior: 'smooth' }); } else go('plants');
    toast(`「${ROLES[r.dataset.role].ja}」の植物を表示しています`);
    return;
  }
  const g = e.target.closest('.origin-chip[data-region], [data-goregion]');
  if (g) {
    state.region = g.dataset.region || g.dataset.goregion;
    state.zukan = 'origin';
    if (state.view === 'plants') { renderZukan(); window.scrollTo({ top: 0, behavior: 'smooth' }); } else go('plants');
  }
});

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
    ${gradeBadge(r, true)}
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
  // 季節の言葉が2つ以上なら「春から秋まで」とまとめる
  const SEASONS = ['春', '初夏', '夏', '秋', '冬'];
  const ss = words.filter((w) => SEASONS.includes(w)).sort((a, b) => SEASONS.indexOf(a) - SEASONS.indexOf(b));
  if (ss.length >= 2) { words = [...words.filter((w) => !SEASONS.includes(w)), '__season']; DESC.__season = `${ss[0]}から${ss[ss.length - 1]}まで咲き継ぐ`; }
  const colors = words.filter((w) => COLOR.includes(w));
  const STYLE = ['ナチュラル', 'イングリッシュ', '和風', 'プレーリー', 'ドライガーデン', 'シェード'];
  const descs = [...words.filter((w) => DESC[w] && !STYLE.includes(w)), ...words.filter((w) => STYLE.includes(w))].map((w) => DESC[w]).slice(0, 2);
  if (!colors.length && !descs.length) return style === 'cottage' ? '花があふれるコテージガーデン' : style === 'oudolf' ? '風に揺れるニューパレニアル' : style === 'chatto' ? '乾いた砂利の庭' : style === 'composition' ? '点・線・面で組み立てる庭' : 'あなたの庭のプラン';
  if (style === 'cottage') return `${colors.length ? colors.join('と') + 'の' : ''}${descs.join('')}コテージガーデン`;
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
    if (m.length) return `<p class="mine">${icon('leaf', 13)}あなたの庭の${[...new Set(m.map((p) => p.groupJa.replace(/（.*?）/g, '')))].slice(0, 5).map(esc).join('・')}で作れます</p>`;
    const any = [...new Map(plantsForNeed(need, PLANTS).map((p) => [p.group, p]))].slice(0, 5).map(([, p]) => p);
    return any.length ? `<p class="mine muted">植えると作れるようになる植物 — ${any.map((p) => `<button type="button" class="linkish" data-find="${esc(p.groupJa)}">${esc(p.groupJa.replace(/（.*?）/g, ''))}</button>`).join('・')}</p>` : '';
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

    ${inatCard()}

    ${friendAlbumHtml()}

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
  stopCamera();
  $('#sheetTitle').innerHTML = title;
  const body = $('#sheetBody');
  body.onclick = body.oninput = body.onchange = null; // 前のシートの操作を引き継がない
  body.innerHTML = html;
  $('#sheet').className = `sheet ${cls}`;
  $('#sheet').hidden = false;
  $('#sheetBack').hidden = false;
  document.body.classList.add('sheet-open');
}
function closeSheet() {
  stopCamera();
  $('#sheet').hidden = true;
  $('#sheetBack').hidden = true;
  document.body.classList.remove('sheet-open');
}
$('#sheetClose').addEventListener('click', closeSheet);
$('#sheetBack').addEventListener('click', closeSheet);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

// ---------- 記録を書く ----------
function openRecord(plantId = '', spotId = '') {
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
      ${(g.spots || []).length ? `<div class="rec-spot"><span class="label">定点の写真にする（育ち具合の写真くらべに並びます）</span><div class="chips">${[['', 'しない'], ...g.spots.map((sp) => [sp.id, sp.name])].map(([id, n]) => `<button type="button" class="chip spot-pick${id === spotId ? ' on' : ''}" data-spot="${id}">${esc(n)}</button>`).join('')}</div></div>` : ''}
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
    const sp = e.target.closest('.spot-pick');
    if (sp) body.querySelectorAll('.spot-pick').forEach((x) => x.classList.toggle('on', x === sp));
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
    const spot = photo ? body.querySelector('.spot-pick.on')?.dataset.spot || '' : '';
    await saveNote({ id: Date.now().toString(36), date, plants, events, text, photo, weather, garden: g.name, gardenId: g.id, ...(spot ? { spot } : {}) });
    // 「植え付け」を記録した植物は「植えた」にする
    if (events.includes('plant')) { plants.forEach((id) => { g.have[id] = true; }); saveGardens(); }
    await loadDiary();
    closeSheet();
    friendToast();
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
  try { const k = state.loc && `pg:wx2:${state.loc.lat.toFixed(2)},${state.loc.lon.toFixed(2)}`; forecast = k ? (JSON.parse(sessionStorage.getItem(k) || 'null')?.d ?? null)?.filter((d) => !d.past) ?? null : null; } catch { forecast = null; }
  return { climate: state.climate, locName: state.loc?.name, garden: g, plants: g.plants.map((id) => byId.get(id)).filter(Boolean), entries: diaryCache, forecast, now: new Date(), monthTasks: monthTasks() };
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
    <div class="row" style="margin-top:8px"><button type="button" class="btn" data-links>${icon('steps', 15)}iPhoneのショートカット・Siriと連携</button></div>
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
/** 予報（今日から7日）。full=true なら過去3日を含む（水やりの判断用） */
async function getForecast(full = false) {
  if (!state.loc) return null;
  const key = `pg:wx2:${state.loc.lat.toFixed(2)},${state.loc.lon.toFixed(2)}`;
  let days = null;
  try { const c = JSON.parse(sessionStorage.getItem(key) || 'null'); if (c && Date.now() - c.t < 3 * 3600e3) days = c.d; } catch { /* なし */ }
  const logKey = wxLogKey();
  const need = pastDaysNeeded(store.get(logKey, {}));
  if (!days || need > 3) {
    try {
      // 天気の記録が途切れていたら、その日数分（最大92日）さかのぼって取り寄せる
      days = await fetchForecast(state.loc.lat, state.loc.lon, Math.max(3, need));
      try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: days })); } catch { /* 保存不可 */ }
    } catch { if (!days) return null; }
  }
  store.set(logKey, mergeLog(store.get(logKey, {}), days));
  return full ? days : days.filter((d) => !d.past);
}
const wxLogKey = () => `wxlog:${state.loc.lat.toFixed(2)},${state.loc.lon.toFixed(2)}`;
/** わたしの庭の天気の記録（作業暦） */
async function wxLogHtml() {
  if (!state.loc) return '';
  await getForecast(true);
  const log = store.get(wxLogKey(), {});
  const sm = logSummary(log, state.climate?.monthly);
  if (!sm) return '';
  const d30 = lastDays(log, 30);
  const dj = (k) => `${Number(k.slice(5, 7))}/${Number(k.slice(8, 10))}`;
  const cmp = compareJa(sm.monthRain, sm.monthNormalToDate);
  return `<div class="card wxlog">
    <h2>${icon('cloud', 19)} わたしの庭の天気の記録</h2>
    <p class="hint">${dj(sm.first)}から${sm.count}日分を、この端末にためています（開くたびに自動で追加）。値は約10km四方の気象解析値で、平年は過去10年の平均です。</p>
    <div class="tiles">
      <div class="tile"><div class="k">今月の雨（${sm.monthDays}日間）</div><div class="v">${sm.monthRain}<small>mm</small></div><div class="s">${sm.monthNormalToDate != null ? `平年の同じ時期 約${sm.monthNormalToDate}mm・${cmp}` : ''}</div></div>
      <div class="tile"><div class="k">直近7日の雨</div><div class="v">${sm.rain7}<small>mm</small></div><div class="s">${sm.dry >= 3 ? `${sm.dry}日間、雨らしい雨なし` : '最近も雨がありました'}</div></div>
      <div class="tile"><div class="k">記録した中でいちばん暑い日</div><div class="v">${Math.round(sm.hot.v)}<small>℃</small></div><div class="s">${dj(sm.hot.date)}</div></div>
      <div class="tile"><div class="k">いちばん寒い朝</div><div class="v">${Math.round(sm.cold.v)}<small>℃</small></div><div class="s">${dj(sm.cold.date)}</div></div>
    </div>
    <h3 class="dn-h">最近30日</h3>
    <div class="chart-wrap">${wxLogChart(d30)}</div>
    ${sm.months.length ? `<h3 class="dn-h">月ごとの雨と気温（平年との比較）</h3><table class="data wl-months"><tr><th>月</th><th>雨（平年）</th><th>平均最高（平年）</th></tr>${sm.months.map((x) => `<tr><td>${String(x.y).slice(2)}年${x.m}月</td><td><b>${x.rain}</b>mm<small>（${x.normal ?? '—'}）${esc(compareJa(x.rain, x.normal))}</small></td><td><b>${x.tmax}</b>℃<small>（${x.normalTmax ?? '—'}）${x.normalTmax != null ? (x.tmax - x.normalTmax >= 1 ? '暑め' : x.tmax - x.normalTmax <= -1 ? '涼しめ' : '平年並み') : ''}</small></td></tr>`).join('')}</table>` : '<p class="hint">1か月分たまると、月ごとの平年比較が表示されます。</p>'}
  </div>`;
}
function wxLogChart(days) {
  const W = 340, H = 140, L = 30, R = 30, T = 8, B = 20;
  const n = days.length, bw = (W - L - R) / n;
  const temps = days.flatMap((d) => (d.tmax != null ? [d.tmax, d.tmin] : []));
  if (!temps.length) return '<p class="hint">まだ記録がありません。</p>';
  const tLo = Math.floor(Math.min(...temps) / 5) * 5, tHi = Math.ceil(Math.max(...temps) / 5) * 5 || 5;
  const rMax = Math.max(10, ...days.map((d) => d.rain || 0));
  const ty = (v) => T + (H - T - B) * (1 - (v - tLo) / (tHi - tLo || 1));
  const ry = (v) => H - B - (H - T - B) * (v / rMax);
  const bars = days.map((d, i) => (d.rain ? `<rect x="${(L + i * bw + 1).toFixed(1)}" y="${ry(d.rain).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${(H - B - ry(d.rain)).toFixed(1)}" fill="var(--prcp)" opacity=".75"><title>${d.date} 雨${d.rain}mm</title></rect>` : '')).join('');
  const line = (k, col) => `<path d="${days.map((d, i) => (d[k] == null ? '' : `${i && days[i - 1][k] != null ? 'L' : 'M'}${(L + (i + 0.5) * bw).toFixed(1)},${ty(d[k]).toFixed(1)}`)).join('')}" fill="none" stroke="${col}" stroke-width="1.8"/>`;
  const ticks = [tLo, (tLo + tHi) / 2, tHi].map((v) => `<text x="${L - 4}" y="${ty(v) + 3}" text-anchor="end" font-size="8" fill="currentColor" opacity=".6">${v}°</text>`).join('')
    + `<text x="${W - R + 4}" y="${ry(rMax) + 3}" font-size="8" fill="currentColor" opacity=".6">${Math.round(rMax)}mm</text><text x="${W - R + 4}" y="${H - B + 3}" font-size="8" fill="currentColor" opacity=".6">0mm</text>`;
  const xl = days.map((d, i) => (i % 7 === 0 ? `<text x="${(L + (i + 0.5) * bw).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="8" fill="currentColor" opacity=".6">${Number(d.date.slice(5, 7))}/${Number(d.date.slice(8, 10))}</text>` : '')).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="最近30日の気温と雨">${bars}${line('tmax', 'var(--tmax)')}${line('tmin', 'var(--tmin)')}${ticks}${xl}</svg>
    <div class="legend"><span><i style="background:var(--tmax)"></i>最高気温</span><span><i style="background:var(--tmin)"></i>最低気温</span><span><i style="background:var(--prcp)"></i>雨（右の目盛り）</span></div>`;
}
/** 今日の水やり（ホーム） */
async function waterHtml() {
  const days = await getForecast(true);
  if (!days) return '';
  const g = activeGarden();
  const month = localMonth(new Date().getMonth() + 1, !!state.climate?.south);
  const mine = g.plants.map((id) => byId.get(id)).filter(Boolean);
  const pots = mine.filter((p) => plantInfo(g, p.id).pot);
  const young = mine.filter((p) => { const a = ageOf(plantInfo(g, p.id).planted); return a != null && a <= 30; });
  const rows = [];
  if (g.kind === 'balcony' || pots.length) rows.push({ ...waterAdvice(days, { pot: true, month }), who: g.kind === 'balcony' ? '' : pots.slice(0, 4).map((p) => p.groupJa.replace(/（.*?）/g, '')).join('・') });
  if (g.kind !== 'balcony') {
    if (young.length) rows.push({ ...waterAdvice(days, { young: true, month }), who: young.slice(0, 4).map((p) => p.groupJa.replace(/（.*?）/g, '')).join('・') });
    rows.push(waterAdvice(days, { month }));
  }
  const ic = { none: '☂️', check: '👆', yes: '💧', twice: '💧💧' };
  return `<div class="today-block water">
    <h3>${icon('drop', 17)}今日の水やり</h3>
    ${rows.filter(Boolean).map((r) => `<div class="wt ${r.need}"><span class="wt-ic">${ic[r.need]}</span><div><b>${esc(r.title)}</b><small>${esc(r.text)}</small>${r.who ? `<small class="wt-who">対象：${esc(r.who)}</small>` : ''}</div></div>`).join('')}
    ${(() => { const sm = logSummary(store.get(wxLogKey(), {}), state.climate?.monthly); return sm ? `<p class="hint" style="margin:4px 0 0">記録では、直近7日の雨は${sm.rain7}mm${sm.dry >= 3 ? `・${sm.dry}日間雨なし` : ''}。<button type="button" class="link" data-go="tasks">天気の記録を見る</button></p>` : ''; })()}
    <p class="hint" style="margin:2px 0 0"><button type="button" class="link" data-links>毎朝、水やりの要否を通知する（ショートカット）</button></p>
    ${!pots.length && g.kind !== 'balcony' ? '<p class="hint" style="margin:4px 0 0">鉢植えの植物は、マイ庭の「✎ 記録」で「鉢植え」にすると、鉢の水やりも表示します。</p>' : ''}
  </div>`;
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
  const allTasks = monthTasks();
  const tasks = allTasks.slice(0, 4);
  const ideas = ideasFor(north);
  const idea = ideas[new Date().getDate() % Math.max(1, ideas.length)];
  state.tsupiCtx = {
    month: north, empty: !mine.length,
    blooming: [...new Set(blooming.map((p) => p.groupJa.replace(/（.*?）/g, '')))],
    harvest: [...new Set(mine.filter((p) => p.harvest?.includes(north)).map((p) => p.groupJa.replace(/（.*?）/g, '')))],
    tasks: tasks.map((t) => t.title), seen: new Set(state.sightings.map((x) => x.c)).size,
  };
  const word = tsupiLine(state.tsupiCtx);
  const pose = !mine.length ? 'sprout' : north === 12 || north <= 2 ? 'idle' : 'happy';
  box.innerHTML = `
    ${tsupiSays(`<span id="tsupiWord">${esc(word)}</span>`, pose, `<div class="bubble-acts"><button type="button" class="btn small" data-tsupinext>${icon('refresh', 15)}ほかの話</button><button type="button" class="btn small" data-openchat>${icon('search', 15)}ツピに聞く</button><button type="button" class="btn small" data-consult="">AIに相談</button><button type="button" class="btn small" data-record="">${icon('plus', 15)}今日の記録</button></div>`)}
    ${visitorsHtml(mine, north, c)}
    ${insightsCard()}
    <section class="card today">
      <header class="sec"><span class="en">Today in the Garden</span><h2>今日の庭</h2></header>
      ${gardenPicker()}
      <div id="homeWx"></div>
      <div class="today-block">
        <h3>${icon('calendar', 17)}今月の作業</h3>
        ${tasks.length ? tasks.map((t) => `<button type="button" class="mini-task${t.build ? ' build' : ''}" data-gojump="tasks|month-${now}"><span class="ic">${icon(t.build ? 'steps' : TASK_ICON[t.kind] || 'leaf', 16)}</span><span>${esc(t.title)}</span></button>`).join('') + (allTasks.length > tasks.length ? `<p class="hint" style="margin:2px 0 0">ほかに${allTasks.length - tasks.length}件あります</p>` : '') : '<p class="hint">今月の作業は、すべて済んでいるか、急ぎのものはありません。庭を眺めて楽しみましょう。</p>'}
        <button type="button" class="link" data-go="tasks">作業暦を見る ${icon('arrow', 14)}</button>
      </div>
      ${blooming.length ? `<div class="today-block">
        <h3>${icon('leaf', 17)}いま見頃</h3>
        <div class="blooming">${blooming.slice(0, 8).map((p) => `<button type="button" class="chip" data-find="${esc(p.groupJa)}"><span class="dot" style="background:${COLORS[p.color[0]].hex}"></span>${esc(p.cv || p.groupJa)}</button>`).join('')}</div>
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
      <button type="button" data-doctor="">${icon('search', 22)}<span>困ったとき</span></button>
      <button type="button" data-calc>${icon('list', 22)}<span>計算機</span></button>
      <button type="button" data-gotab="sun">${icon('sun', 22)}<span>日当たり</span></button>
      <button type="button" data-go="tasks">${icon('cloud', 22)}<span>天気の記録</span></button>
      <button type="button" data-links>${icon('steps', 22)}<span>iPhone連携</span></button>
    </div>
    <header class="sec" style="margin-top:22px"><span class="en">Climate</span><h2>庭の気候</h2></header>`;
  const days = await getForecast();
  const slot = $('#homeWx');
  if (!days || !slot) return;
  const adv = weatherAdvice(days, north).sort((a, b) => b.level - a.level).slice(0, 2);
  const d0 = days[0];
  slot.innerHTML = `<div class="wx-today"><span class="wi">${weatherIcon(d0.code)}</span><span><b>今日 ${Math.round(d0.tmax)}°</b> / ${Math.round(d0.tmin)}°${d0.rain >= 1 ? `・雨 ${Math.round(d0.rain)}mm` : ''}</span></div>
    ${adv.map((a) => `<div class="wx-adv lv${a.level}"><b>${esc(a.title)}</b>${esc(a.text)}</div>`).join('')}
    ${await waterHtml()}`;
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
    if (g.have[h.dataset.have]) delete g.have[h.dataset.have];
    else {
      g.have[h.dataset.have] = true;
      g.info = g.info || {};
      const inf = (g.info[h.dataset.have] ||= {});
      if (!inf.planted) { inf.planted = todayStr(); toast('「植えた」にしました。植えた日は今日として記録しました（✎で変更できます）'); }
    }
    saveGardens();
    const y = window.scrollY;
    renderGarden();
    window.scrollTo({ top: y });
    return;
  }
  const f = e.target.closest('[data-find]');
  if (f) {
    Object.assign(state.filters, { q: f.dataset.find.replace(/（.*?）/g, ''), sun: '', moist: '', height: '', month: '', color: '', tag: '', family: '', type: '', use: '', role: '', origin: '' });
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
initSaved();
initKodawari();
initImagePlan();
initCustomForm();
if (state.planInput.text || state.planInput.seed) { try { computePlan(); state.planMonth = state.plan?.peak ?? 6; } catch { /* 入力が古い形式でも起動は続ける */ } }
if (state.loc) loadClimate(); else render();
go('site');
requestPersist();
try { localStorage.removeItem('pg:aikey'); } catch { /* 以前の版で保存したAPIキーがあれば消す */ }
loadDiary().then((list) => { if (list.length) render(); handleURLAction(); });
listPhotos().then((list) => { if (!list.length) return; list.forEach((x) => userPhotos.set(x.id, x.photo)); initStyleCards(); render(); });

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
