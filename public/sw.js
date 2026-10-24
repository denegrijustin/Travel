// Offline support: the app files and photos are cached after the first visit; map tiles you have looked at are kept too.
const V = "travel-v9";
const TILES = "travel-tiles-v1";
const SHELL = ["/", "/app.css", "/app.js", "/lib.js", "/data.js", "/map.js", "/places.js", "/config.js", "/airlines.js", "/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-192.png"];

self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V && k !== TILES).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function trim(cache, max) { const ks = await cache.keys(); for (let i = 0; i < ks.length - max; i++) await cache.delete(ks[i]); }

self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.origin === location.origin && url.pathname.startsWith("/api/")) return; // sync and share are always live
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(V).then((c) => c.put("/", copy)); return r; }).catch(() => caches.match("/")));
    return;
  }
  if (url.hostname === "tile.openstreetmap.org" || url.hostname === "server.arcgisonline.com") {
    e.respondWith(caches.open(TILES).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok) { c.put(req, r.clone()); trim(c, 600); }
      return r;
    }).catch(() => new Response("", { status: 504 })));
    return;
  }
  const same = url.origin === location.origin, lib = url.hostname === "cdnjs.cloudflare.com";
  if (same || lib) {
    e.respondWith(caches.open(V).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
