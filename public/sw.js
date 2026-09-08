// Cache minimal : l'application reste utilisable sans connexion.
// Tous les chemins sont relatifs à l'emplacement de ce fichier, pour que
// l'application fonctionne aussi dans un sous-dossier (GitHub Pages).
const CACHE = 'cabinet-v2'
const ACCUEIL = new URL('./index.html', self.location).href

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html'])))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cles) =>
      Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  // Ne rien intercepter en dehors du dossier de l'application.
  if (!url.pathname.startsWith(new URL('./', self.location).pathname)) return

  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req)
        .then((rep) => {
          const copie = rep.clone()
          caches.open(CACHE).then((c) => c.put(req, copie))
          return rep
        })
        .catch(() => caches.match(ACCUEIL)),
    ),
  )
})
