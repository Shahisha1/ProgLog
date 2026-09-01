const CACHE = 'proglog-v5';
const CORE = ['./', './index.html', './404.html', './manifest.webmanifest', './assets/img/proglog-icon.png', './assets/img/proglog-logo.png', './assets/css/vars.css', './assets/css/reset.css', './assets/css/layout.css', './assets/css/components.css', './assets/css/phase45.css', './assets/js/phase45.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => { if (e.request.method !== 'GET') return; e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r }).catch(() => caches.match(e.request).then(r => r || caches.match('./404.html')))) });
