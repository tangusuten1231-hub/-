// オフライン用のキャッシュ。ファイルを変えたら VERSION を上げる
// 同じサイトに庭づくりアプリがあるので、消すのは自分のキャッシュ（heyamidori-）だけ
const VERSION = 'heyamidori-v2';
const FILES = ['./', 'index.html', 'css/style.css', 'manifest.webmanifest', 'icon.svg',
  'js/app.js', 'js/catalog.data.js', 'js/schema.js', 'js/care.js', 'js/db.js', 'js/guide.js', 'js/derive.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('heyamidori-') && k !== VERSION).map((k) => caches.delete(k)))));
  self.clients.claim();
});
// 自分のファイルはネット優先（取れなければキャッシュ）
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
