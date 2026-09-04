const CACHE = "proglog-v4";
const OFFLINE_FALLBACK = "/ProgLog/404.html";

const SHELL = [
  "/ProgLog/",
  "/ProgLog/index.html",
  "/ProgLog/overview.html",
  "/ProgLog/assets/css/styles.css",
  "/ProgLog/assets/js/app.js",
  "/ProgLog/assets/images/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Always prefer the newest deployed HTML, CSS, and JS.
  // If the network is unavailable, fall back to the cached version.
  const isAppAsset =
    request.mode === "navigate" ||
    request.destination === "style" ||
    request.destination === "script";

  if (isAppAsset) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(OFFLINE_FALLBACK)),
        ),
    );
    return;
  }

  // Cache other same-origin GET requests for offline use, but fetch
  // uncached resources normally when they are not already available.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    }),
  );
});
