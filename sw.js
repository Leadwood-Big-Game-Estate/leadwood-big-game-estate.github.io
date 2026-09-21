/* ------------------------------------------------------------------ *
 *  Leadwood Tracker — service worker
 *
 *  All paths are RELATIVE ("./") so the app can be served from a
 *  sub-folder as well as from the root of a domain.
 *
 *  The reserve road data is NOT cached here: it comes from the private
 *  Supabase bucket and is kept by the app itself, only once signed in.
 * ------------------------------------------------------------------ */
const VERSION = "v21";
const CACHE   = "leadwood-" + VERSION;
// Satellite tiles: separate cache, kept across versions (otherwise every
// app update would wipe the areas already downloaded).
const TILES     = "leadwood-tuiles";
const MAX_TILES = 4000;               // roughly 60 to 80 MB at most

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./config.js",
  "./leaflet.js",
  "./leaflet.css",
  "./icon-192.png",
  "./icon-512.png"
];

/* ------------------------------ Install ---------------------------- */
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // One file at a time: a missing file must not abort the whole install.
    await Promise.allSettled(PRECACHE.map(u => cache.add(new Request(u, { cache: "reload" }))));
    await self.skipWaiting();
  })());
});

/* ------------------------------ Activate --------------------------- */
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    // Old versions go, together with the old PDF map and reserve.js they held.
    await Promise.all(names.filter(n => n !== CACHE && n !== TILES).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

/* ------------------------------ Helpers ---------------------------- */
// Network first, but no longer than 4 s: in the bush a weak connection
// can leave a request hanging for a minute. After that, serve the cache.
async function networkFirst(req, key) {
  const cache = await caches.open(CACHE);
  const net = fetch(req, { cache: "no-store" }).then(res => {
    if (res.ok) cache.put(key || req, res.clone());
    return res;
  });
  const cached = await cache.match(key || req);
  if (!cached) return net.catch(() => new Response("", { status: 504 }));
  const timeout = new Promise(r => setTimeout(() => r(null), 4000));
  try {
    const res = await Promise.race([net, timeout]);
    return res || cached;
  } catch (e) {
    return cached;
  }
}

let added = 0;
async function trimTiles() {
  const c = await caches.open(TILES);
  const keys = await c.keys();
  if (keys.length <= MAX_TILES) return;
  // Keys come in insertion order: drop the oldest ones.
  await Promise.all(keys.slice(0, keys.length - MAX_TILES).map(k => c.delete(k)));
}

/* ------------------------------- Fetch ----------------------------- */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // The page itself: otherwise a published update never reaches the phone.
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, "./index.html"));
    return;
  }

  // config.js (vehicles, password, display time): always the latest
  // published version when the network allows it.
  if (url.origin === self.location.origin && /\/config\.js$/.test(url.pathname)) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Satellite tiles: cache first, for offline use.
  if (url.hostname === "server.arcgisonline.com") {
    event.respondWith((async () => {
      const c = await caches.open(TILES);
      const hit = await c.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok) {
          c.put(req, res.clone());
          if (++added % 100 === 0) trimTiles();
        }
        return res;
      } catch (e) {
        return new Response("", { status: 504, statusText: "Offline" });
      }
    })());
    return;
  }

  // Supabase (sightings, sign-in, road data): never cached here.
  if (/\.supabase\.co$/.test(url.hostname)) return;

  // Everything else (Leaflet, icons, fonts): cache first.
  event.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === "opaque")) {
        if (url.origin === self.location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
          const cache = await caches.open(CACHE);
          cache.put(req, res.clone());
        }
      }
      return res;
    } catch (e) {
      return new Response("", { status: 504, statusText: "Offline" });
    }
  })());
});

self.addEventListener("message", (e) => { if (e.data === "skipWaiting") self.skipWaiting(); });
