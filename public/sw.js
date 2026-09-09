// Cache minimal : l'application reste utilisable sans connexion.
// Tous les chemins sont relatifs à l'emplacement de ce fichier, pour que
// l'application fonctionne aussi dans un sous-dossier (GitHub Pages).
//
// Stratégie :
//   - la page elle-même passe par le réseau d'abord, sinon une nouvelle version
//     mise en ligne ne parviendrait jamais à qui a déjà ouvert l'application ;
//   - les fichiers construits (assets/) passent par le cache d'abord : leur nom
//     change à chaque construction, ils ne peuvent pas être périmés.
const CACHE = 'cabinet-v4'
const ACCUEIL = new URL('./index.html', self.location).href
const RACINE = new URL('./', self.location).pathname

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

/** Met en cache une réponse valable, puis la renvoie. */
function memoriser(req, rep) {
  if (rep && rep.ok && rep.type === 'basic') {
    const copie = rep.clone()
    caches.open(CACHE).then((c) => c.put(req, copie))
  }
  return rep
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  // Ne rien intercepter en dehors du dossier de l'application.
  if (!url.pathname.startsWith(RACINE)) return

  // La page : réseau d'abord, cache en secours hors connexion.
  // « no-store » saute le cache HTTP du navigateur : GitHub Pages sert la page
  // avec dix minutes de validité, ce qui retarderait d'autant chaque mise à jour.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((rep) => memoriser(req, rep))
        .catch(() => caches.match(req).then((hit) => hit || caches.match(ACCUEIL))),
    )
    return
  }

  // Le reste : cache d'abord, réseau ensuite.
  e.respondWith(
    caches.match(req).then((hit) =>
      hit || fetch(req).then((rep) => memoriser(req, rep)).catch(() => caches.match(ACCUEIL)),
    ),
  )
})
