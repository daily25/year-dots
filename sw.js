// Year Dots Service Worker
const CACHE_NAME = 'year-dots-v5';
// Keep in step with the ?v= stamps in index.html.
const ASSET_VERSION = '2';
const BASE_PATH = self.location.pathname.replace(/sw\.js$/, '');
const urlsToCache = [
    BASE_PATH,
    BASE_PATH + 'index.html',
    BASE_PATH + 'index.css?v=' + ASSET_VERSION,
    BASE_PATH + 'app.js?v=' + ASSET_VERSION,
    BASE_PATH + 'manifest.json',
    BASE_PATH + 'icons/icon-192.png',
    BASE_PATH + 'icons/icon-512.png'
];

// Install event - cache assets, bypassing the HTTP cache so a stale copy
// never gets baked into this version's cache.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return Promise.all(urlsToCache.map((url) => {
                    return fetch(new Request(url, { cache: 'reload' }))
                        .then((response) => response.ok ? cache.put(url, response) : null)
                        .catch(() => null);
                }));
            })
            .catch((err) => {
                console.log('Cache failed:', err);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200 && event.request.method === 'GET') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((response) => {
                    return response || caches.match(BASE_PATH + 'index.html');
                });
            })
    );
});
