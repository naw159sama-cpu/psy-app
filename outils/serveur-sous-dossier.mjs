/**
 * Sert `dist/` sous le chemin /psy-app/, pour reproduire exactement les
 * conditions de GitHub Pages avant de publier.
 *
 *   node outils/serveur-sous-dossier.mjs
 *   -> http://localhost:4283/psy-app/
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist')
const PREFIXE = '/psy-app/'
const PORT = 4283

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  if (!url.pathname.startsWith(PREFIXE)) {
    res.writeHead(302, { Location: PREFIXE })
    res.end()
    return
  }
  let rel = url.pathname.slice(PREFIXE.length) || 'index.html'
  if (rel.endsWith('/')) rel += 'index.html'
  const fichier = join(RACINE, normalize(rel).replace(/^(\.\.[/\\])+/, ''))
  try {
    const contenu = await readFile(fichier)
    res.writeHead(200, { 'Content-Type': TYPES[extname(fichier)] ?? 'application/octet-stream' })
    res.end(contenu)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Introuvable')
  }
}).listen(PORT, () => {
  console.log(`Aperçu « sous-dossier » : http://localhost:${PORT}${PREFIXE}`)
})
