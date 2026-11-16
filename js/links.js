// iPhone の「ショートカット」アプリとの連携
// ・URL の ?do=… で、記録や画面を開く（Safari で開いたとき用）
// ・ショートカットが iCloud Drive のテキストファイルにためた記録（「2026-11-16 07:30,水やり,ラベンダー」など）を取り込む
import { EVENTS } from './diary.js';

export const ACTIONS = {
  water: '水やりを記録',
  record: '記録を書く画面を開く',
  today: '今日の庭（ホーム）を開く',
  tasks: '作業暦を開く',
  doctor: '困ったとき（症状から調べる）を開く',
  sun: '日当たりチェッカーを開く',
  photo: '定点カメラを開く',
};

/** URL から連携の指示を読む */
export function parseAction(search) {
  const q = new URLSearchParams(search || '');
  const act = q.get('do');
  if (!act || !ACTIONS[act]) return null;
  return { act, plant: q.get('plant') || '', spot: q.get('spot') || '', garden: q.get('garden') || '', memo: (q.get('memo') || '').slice(0, 200) };
}

/** できごとの言葉 → EVENTS のキー（「水やり」「水やりした」「植え付け」など） */
export function eventOf(word) {
  const w = String(word || '').trim().replace(/(した|しました|済み|完了)$/, '');
  if (!w) return null;
  for (const [k, v] of Object.entries(EVENTS)) if (v.ja === w || v.ja.startsWith(w) || w.startsWith(v.ja)) return k;
  if (/水/.test(w)) return 'water';
  return null;
}

/**
 * ショートカットでためた記録を読む。1行に1件：日付[ 時刻],できごと[,植物名][,メモ]
 * 区切りは「,」「、」「タブ」。日付は 2026-11-16 / 2026/11/16 / 2026年11月16日 のどれでもよい。
 * 戻り値 [{ date, time, event, plantName, memo, key }]
 */
export function parseShortcutLog(text) {
  const out = [];
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.normalize('NFKC').trim();
    const m = line.match(/^(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})日?(?:[ T]+(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?\s*[,、\t]\s*(.+)$/);
    if (!m) continue;
    const [, y, mo, d, hh, mm, rest] = m;
    const parts = rest.split(/\s*[,、\t]\s*/);
    const event = eventOf(parts[0]);
    const date = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    const time = hh ? `${hh.padStart(2, '0')}:${mm}` : '';
    out.push({ date, time, event, eventText: parts[0], plantName: parts[1] || '', memo: parts.slice(2).join('、'), key: `${date} ${time}|${parts.join('|')}` });
  }
  return out;
}

/** 毎朝の通知用：今日の雨と最高気温だけを返す Open-Meteo の URL */
export function morningURL(lat, lon) {
  const p = new URLSearchParams({ latitude: lat.toFixed(3), longitude: lon.toFixed(3), daily: 'precipitation_sum,temperature_2m_max', forecast_days: '1', timezone: 'auto' });
  return `https://api.open-meteo.com/v1/forecast?${p}`;
}
