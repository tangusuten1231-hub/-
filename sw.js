// オフラインでもアプリ本体を開けるようにするサービスワーカー
const CACHE = 'garden-nav-v1';
const SHELL = [
  './', 'index.html', 'css/style.css', 'icon.svg', 'manifest.webmanifest',
  'js/app.js', 'js/plants.js', 'js/climate.js', 'js/garden.js', 'js/sun.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // 外部APIは素通し
  // ネットワーク優先、失敗時はキャッシュ
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request)),
  );
});
