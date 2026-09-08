// Cache minimal : l'application reste utilisable sans connexion.
const CACHE = 'cabinet-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/index.html'])))
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
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req)
        .then((rep) => {
          const copie = rep.clone()
          caches.open(CACHE).then((c) => c.put(req, copie))
          return rep
        })
        .catch(() => caches.match('/index.html')),
    ),
  )
})
