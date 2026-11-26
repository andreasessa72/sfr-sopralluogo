/* Contrassegnatura di campo – funzionamento offline.
   Quando pubblichi una nuova versione di index.html, aumenta il numero di VERSIONE. */
const VERSIONE = "contrassegnatura-v2.1";
const FILE_APP = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(FILE_APP)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(n => n.startsWith("contrassegnatura-") && n !== VERSIONE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Pagina dell'app: prima la rete (per gli aggiornamenti), se manca il campo la copia salvata
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(r => { const c = r.clone(); caches.open(VERSIONE).then(x => x.put("./index.html", c)); return r; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Caratteri di Google Fonts e file dell'app: prima la copia salvata, poi la rete
  if (url.origin === location.origin || url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(r => {
        if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(VERSIONE).then(x => x.put(req, c)); }
        return r;
      }).catch(() => hit))
    );
  }
});
