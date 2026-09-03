const CACHE = "proglog-v3";
const SHELL = [
  "/ProgLog/",
  "/ProgLog/index.html",
  "/ProgLog/overview.html",
  "/ProgLog/assets/css/styles.css",
  "/ProgLog/assets/js/app.js",
  "/ProgLog/assets/images/favicon.svg",
];
self.addEventListener("install", (e) =>
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (u.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(
        (c) =>
          c ||
          fetch(e.request)
            .then((r) => {
              if (e.request.method === "GET" && r.ok) {
                const clone = r.clone();
                caches.open(CACHE).then((x) => x.put(e.request, clone));
              }
              return r;
            })
            .catch(() => caches.match("/ProgLog/404.html")),
      ),
    );
  }
});
