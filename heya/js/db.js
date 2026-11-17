// ユーザーのデータ（端末の IndexedDB に保存）
//
// spots  置き場所 { id, name, window: S|E|W|N|none, distance: window|near|mid|far, sheer: bool, lux?: number, winterMinC?: number, createdAt }
// plants マイ植物 { id, taxonId, nickname, spotId, acquiredOn: 'YYYY-MM-DD', potCm?: number, memo, createdAt, archivedAt? }
// events お世話の記録 { id, plantId, type: water|check|fertilize|repot|prune|pest|move|note, date: 'YYYY-MM-DD', memo, createdAt }
// meta   設定など { key, value }
// photos 写真 { id, plantId, date: 'YYYY-MM-DD', data: 'data:image/jpeg;base64,...', memo, createdAt }（v2 で追加）
//
// 形式を変えるときは MIGRATIONS に関数を1つ足す（既存の関数は書き換えない）。
// バージョン番号 = MIGRATIONS の数。

const DB_NAME = 'heyamidori';
export const EVENT_TYPES = {
  water: { ja: '水やり', icon: '💧' },
  check: { ja: '土を確認（水やり不要）', icon: '👆' },
  fertilize: { ja: '肥料', icon: '🧪' },
  repot: { ja: '植え替え', icon: '🪴' },
  prune: { ja: '剪定・切り戻し', icon: '✂️' },
  pest: { ja: '病害虫の対処', icon: '🐛' },
  move: { ja: '置き場所の移動', icon: '🚚' },
  note: { ja: 'メモ', icon: '📝' },
};

export const MIGRATIONS = [
  (db) => {
    db.createObjectStore('spots', { keyPath: 'id' });
    const p = db.createObjectStore('plants', { keyPath: 'id' });
    p.createIndex('spotId', 'spotId');
    const e = db.createObjectStore('events', { keyPath: 'id' });
    e.createIndex('plantId', 'plantId');
    db.createObjectStore('meta', { keyPath: 'key' });
  },
  (db) => {
    const ph = db.createObjectStore('photos', { keyPath: 'id' });
    ph.createIndex('plantId', 'plantId');
  },
];
export const SCHEMA_VERSION = MIGRATIONS.length;

let dbp = null;
export function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, SCHEMA_VERSION);
    req.onupgradeneeded = (ev) => {
      const db = req.result;
      for (let v = ev.oldVersion; v < SCHEMA_VERSION; v++) MIGRATIONS[v](db, req.transaction);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

const wrap = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
async function store(name, mode = 'readonly') { return (await open()).transaction(name, mode).objectStore(name); }

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);

export const all = async (name) => wrap((await store(name)).getAll());
export const get = async (name, id) => wrap((await store(name)).get(id));
export const put = async (name, rec) => { await wrap((await store(name, 'readwrite')).put(rec)); return rec; };
export const del = async (name, id) => wrap((await store(name, 'readwrite')).delete(id));
export const byIndex = async (name, index, key) => wrap((await store(name)).index(index).getAll(key));

export async function getSetting(key, fallback) { const r = await get('meta', key); return r ? r.value : fallback; }
export const setSetting = (key, value) => put('meta', { key, value });

/** 植物を消すときは記録と写真も消す */
export async function deletePlant(id) {
  const db = await open();
  const tx = db.transaction(['plants', 'events', 'photos'], 'readwrite');
  tx.objectStore('plants').delete(id);
  for (const name of ['events', 'photos']) {
    const st = tx.objectStore(name);
    for (const k of await wrap(st.index('plantId').getAllKeys(id))) st.delete(k);
  }
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
}

/** 置き場所を消すとき、そこにある植物は「置き場所なし」にする */
export async function deleteSpot(id) {
  for (const p of await byIndex('plants', 'spotId', id)) await put('plants', { ...p, spotId: null });
  await del('spots', id);
}

// ---- バックアップ ----
export const EXPORT_APP = 'heyamidori';
export async function exportAll() {
  return { app: EXPORT_APP, schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(),
    spots: await all('spots'), plants: await all('plants'), events: await all('events'), meta: await all('meta'), photos: await all('photos') };
}

/** バックアップの形を確かめる。問題があればメッセージを返す */
export function checkBackup(data) {
  if (!data || data.app !== EXPORT_APP) return 'このアプリのバックアップではありません';
  if (!(data.schemaVersion >= 1 && data.schemaVersion <= SCHEMA_VERSION)) return 'このバックアップは新しい版のアプリで作られています';
  for (const k of ['spots', 'plants', 'events', 'meta']) if (!Array.isArray(data[k])) return `${k} がありません`;
  if (data.photos !== undefined && !Array.isArray(data.photos)) return 'photos の形が違います';
  if (![...data.spots, ...data.plants, ...data.events, ...(data.photos ?? [])].every((r) => r && typeof r.id === 'string')) return 'id のない記録があります';
  return null;
}

export async function importAll(data) {
  const err = checkBackup(data);
  if (err) throw new Error(err);
  const db = await open();
  const names = ['spots', 'plants', 'events', 'meta', 'photos'];
  const tx = db.transaction(names, 'readwrite');
  for (const n of names) { const s = tx.objectStore(n); s.clear(); for (const r of data[n] ?? []) s.put(r); }
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
}

/** 写真を縮小して JPEG の data URL にする（容量を抑える） */
export function shrinkImage(file, max = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = Object.assign(document.createElement('canvas'), { width: Math.round(img.width * k), height: Math.round(img.height * k) });
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('画像を読み込めませんでした')); };
    img.src = url;
  });
}
