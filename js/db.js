// 端末内の永続保存：庭ノート（写真付き）は IndexedDB、設定や庭のデータは localStorage。
// バックアップ（ファイルへの書き出し）と復元もここで行う。

const DB = 'pg-garden';
const STORE = 'notes';
let dbp = null;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('IndexedDB なし')); return; }
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE, { keyPath: 'id' }); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const st = t.objectStore(STORE);
    const r = fn(st);
    t.oncomplete = () => resolve(r?.result ?? r);
    t.onerror = () => reject(t.error);
  });
}

export async function listNotes() {
  try {
    const all = await tx('readonly', (st) => st.getAll());
    return (all || []).sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  } catch { return []; }
}
export const saveNote = (n) => tx('readwrite', (st) => st.put(n));
export const deleteNote = (id) => tx('readwrite', (st) => st.delete(id));
export const clearNotes = () => tx('readwrite', (st) => st.clear());

/** 写真を縮小して JPEG の data URL にする（容量節約） */
export function shrinkImage(file, max = 1280, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('画像を読み込めませんでした')); };
    img.src = url;
  });
}

/** ブラウザにデータを消さないよう依頼（対応ブラウザのみ） */
export async function requestPersist() {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch { return null; }
}
export async function storageInfo() {
  try {
    const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : null;
    const est = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
    return { persisted, usage: est?.usage ?? null };
  } catch { return { persisted: null, usage: null }; }
}

/** すべてのデータを1つの JSON にまとめる */
export async function exportAll() {
  const local = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('pg:') && !k.startsWith('pg:img:') && !k.startsWith('pg:climate:')) local[k] = localStorage.getItem(k);
  }
  const notes = await listNotes();
  return { app: '宿根草ガーデンナビ', version: 1, exportedAt: new Date().toISOString(), local, notes };
}

/** バックアップから復元（既存データは上書き） */
export async function importAll(data) {
  if (!data || data.app !== '宿根草ガーデンナビ' || typeof data.local !== 'object') throw new Error('このアプリのバックアップファイルではありません');
  for (const [k, v] of Object.entries(data.local)) if (k.startsWith('pg:') && typeof v === 'string') localStorage.setItem(k, v);
  if (Array.isArray(data.notes)) {
    await clearNotes();
    for (const n of data.notes) if (n && n.id) await saveNote(n);
  }
}

/** ファイルとして保存（iPhone は共有シート→「ファイルに保存」） */
export async function saveFile(name, text) {
  const file = new File([text], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancel'; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  return 'downloaded';
}
