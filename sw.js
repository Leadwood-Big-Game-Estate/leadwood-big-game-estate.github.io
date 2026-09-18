/* ------------------------------------------------------------------ *
 *  Leadwood Tracker — service worker
 *
 *  IMPORTANT : tous les chemins sont RELATIFS ("./"), car l'application
 *  est servie depuis un sous-dossier (github.io/leadwood-tracker/).
 *  Un chemin absolu ("/index.html") pointerait vers la racine du domaine,
 *  addAll() échouerait et l'installation entière serait annulée.
 * ------------------------------------------------------------------ */
const VERSION = "v4";
const CACHE   = "leadwood-" + VERSION;

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./vendor/pdfjs/pdf.min.js",
  "./vendor/pdfjs/pdf.worker.min.js"
];

/* ------------------------------ Install ---------------------------- */
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // addAll() est tout-ou-rien : on ajoute fichier par fichier pour qu'une
    // ressource manquante ne fasse pas échouer l'installation complète.
    await Promise.allSettled(PRECACHE.map(u => cache.add(new Request(u, { cache: "reload" }))));
    await self.skipWaiting();
  })());
});

/* ------------------------------ Activate --------------------------- */
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

/* -------------------------------- Fetch ---------------------------- */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // La page elle-même : réseau d'abord, cache en secours.
  // (sinon une mise à jour publiée sur GitHub n'atteint jamais l'appareil)
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put("./index.html", fresh.clone());
        return fresh;
      } catch (e) {
        return (await caches.match("./index.html")) || Response.error();
      }
    })());
    return;
  }

  // Le reste (pdf.js, icônes, polices) : cache d'abord.
  event.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === "opaque")) {
        // On ne met en cache que nos fichiers et les polices Google.
        // Nos fichiers, les polices Google, et pdf.js si l'on est passé
        // par le repli CDN (dossier vendor/ absent du serveur).
        if (url.origin === self.location.origin
            || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)
            || url.hostname === "cdnjs.cloudflare.com") {
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
