/* ------------------------------------------------------------------ *
 *  Leadwood Tracker — service worker
 *
 *  Tous les chemins sont RELATIFS ("./") : l'application peut être
 *  servie depuis un sous-dossier.
 * ------------------------------------------------------------------ */
const VERSION = "v19";
const CACHE   = "leadwood-" + VERSION;
// Tuiles satellite : cache séparé, conservé d'une version à l'autre (sinon
// chaque mise à jour de l'app effacerait les zones déjà téléchargées).
const TUILES  = "leadwood-tuiles";
const MAX_TUILES = 4000;              // ~60 à 80 Mo au maximum

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./config.js",
  "./reserve.js",
  "./leaflet.js",
  "./leaflet.css",
  "./icon-192.png",
  "./icon-512.png"
];

/* ------------------------------ Install ---------------------------- */
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Fichier par fichier : une ressource manquante ne doit pas faire
    // échouer toute l'installation.
    await Promise.allSettled(PRECACHE.map(u => cache.add(new Request(u, { cache: "reload" }))));
    await self.skipWaiting();
  })());
});

/* ------------------------------ Activate --------------------------- */
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    // Les anciennes versions partent, avec l'ancienne carte PDF qu'elles contenaient.
    await Promise.all(names.filter(n => n !== CACHE && n !== TUILES).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

/* -------------------------------- Outils --------------------------- */
// Réseau d'abord, mais pas plus de 4 s : en brousse, une connexion faible
// peut laisser une requête pendre une minute. Au-delà, on sert le cache.
async function reseauDabord(req, cle) {
  const cache = await caches.open(CACHE);
  const net = fetch(req, { cache: "no-store" }).then(res => {
    if (res.ok) cache.put(cle || req, res.clone());
    return res;
  });
  const enCache = await cache.match(cle || req);
  if (!enCache) return net.catch(() => new Response("", { status: 504 }));
  const delai = new Promise(r => setTimeout(() => r(null), 4000));
  try {
    const res = await Promise.race([net, delai]);
    return res || enCache;
  } catch (e) {
    return enCache;
  }
}

let ajouts = 0;
async function rogner() {
  const c = await caches.open(TUILES);
  const cles = await c.keys();
  if (cles.length <= MAX_TUILES) return;
  // Les clés sont dans l'ordre d'insertion : on retire les plus anciennes.
  await Promise.all(cles.slice(0, cles.length - MAX_TUILES).map(k => c.delete(k)));
}

/* -------------------------------- Fetch ---------------------------- */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // La page elle-même : sinon une mise à jour publiée n'atteint jamais l'appareil.
  if (req.mode === "navigate") {
    event.respondWith(reseauDabord(req, "./index.html"));
    return;
  }

  // config.js (véhicules, mot de passe) et reserve.js (tracés) : toujours
  // la dernière version publiée quand le réseau le permet.
  if (url.origin === self.location.origin && /\/(config|reserve)\.js$/.test(url.pathname)) {
    event.respondWith(reseauDabord(req));
    return;
  }

  // Tuiles satellite : cache d'abord, pour le hors-ligne.
  if (url.hostname === "server.arcgisonline.com") {
    event.respondWith((async () => {
      const c = await caches.open(TUILES);
      const hit = await c.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok) {
          c.put(req, res.clone());
          if (++ajouts % 100 === 0) rogner();
        }
        return res;
      } catch (e) {
        return new Response("", { status: 504, statusText: "Hors ligne" });
      }
    })());
    return;
  }

  // Le reste (Leaflet, icônes, polices) : cache d'abord.
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
      return new Response("", { status: 504, statusText: "Hors ligne" });
    }
  })());
});

self.addEventListener("message", (e) => { if (e.data === "skipWaiting") self.skipWaiting(); });
