// sw.js - Service Worker for PWA
const CACHE_NAME = 'walk-tracker-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// Install Event - Pre-cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Serve cached assets if available, fallback to network
self.addEventListener('fetch', (event) => {
  // Geolocationなどの特殊な外部APIや外部地図タイルは、オフライン時は取得不可とするか、
  // あるいはブラウザに任せるため、Leaflet等のCDNのみネットワークを優先します。
  const url = new URL(event.request.url);

  // Leafletの地図タイル（OpenStreetMap）やCDNは、ネットワークで取得して
  // オフライン用に必要であればキャッシュすることもできますが、
  // タイル数は膨大なため、基本的にはネットワークからフェッチさせます。
  if (url.origin !== self.location.origin) {
    // 外部リクエスト（CDNなど）はキャッシュ優先ではなくネットワーク優先
    event.respondWith(
      fetch(event.request).catch(() => {
        // オフラインで外部リソースが取得できない場合、キャッシュにあるものを探す
        return caches.match(event.request);
      })
    );
    return;
  }

  // ローカル静的アセットはキャッシュ優先
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // 動的なファイルを念のためキャッシュに追加（新規作成されたファイルなど）
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
