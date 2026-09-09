import type { Patient } from './types'
import { normaliser } from './format.ts'

/**
 * Les thèmes de consultation, et la façon de les compter puis de les dessiner.
 *
 * Le motif reste un texte libre : c'est là qu'elle écrit ce qui est vrai pour
 * cette personne-là. Les thèmes sont l'autre besoin — celui de compter. Une
 * fiche peut en porter plusieurs : un deuil qui empêche de dormir compte dans
 * les deux.
 */

/** Un thème proposé d'emblée, avec les mots qui le font reconnaître dans un motif. */
export interface ThemeSuggere {
  nom: string
  /** Racines sans accent : le motif est normalisé avant la comparaison. */
  indices: string[]
}

export const THEMES_SUGGERES: ThemeSuggere[] = [
  { nom: 'Anxiété', indices: ['anxi', 'angoiss', 'panique', 'phobi'] },
  { nom: 'Stress', indices: ['stress', 'surmenage', 'burn', 'epuisement'] },
  { nom: 'Dépression', indices: ['depress', 'deprim', 'tristesse'] },
  { nom: 'Deuil', indices: ['deuil', 'endeuill', 'perte d'] },
  { nom: 'Sommeil', indices: ['sommeil', 'insomnie', 'cauchemar'] },
  { nom: 'Estime de soi', indices: ['estime', 'confiance en soi'] },
  { nom: 'Couple', indices: ['couple', 'conjugal', 'divorce', 'separation'] },
  { nom: 'Famille', indices: ['famill', 'parental', 'fratrie'] },
  { nom: 'Traumatisme', indices: ['trauma', 'agress', 'violence', 'accident'] },
  { nom: 'Scolarité', indices: ['scolaire', 'ecole', 'etudes', 'examen', 'lycee'] },
  { nom: 'Travail', indices: ['travail', 'profession', 'harcelement', 'chomage'] },
  { nom: 'Alimentation', indices: ['alimentaire', 'boulim', 'anorex', 'poids'] },
  { nom: 'Addiction', indices: ['addict', 'dependance', 'alcool', 'tabac'] },
  { nom: 'Colère', indices: ['coler', 'agressivit', 'irritabilit'] },
  { nom: 'Enfance', indices: ['enfant', 'developpement', 'langage'] },
  { nom: 'Adolescence', indices: ['adolesc'] },
]

/** Les dossiers dont on ne sait encore rien : ils forment leur propre bulle. */
export const THEME_ABSENT = 'Non précisé'

/** Deux orthographes du même thème doivent tomber dans la même bulle. */
export function cleTheme(nom: string): string {
  return normaliser(nom).replace(/\s+/g, ' ')
}

/**
 * Thèmes devinés à partir du motif écrit à la main. Sert à deux choses :
 * remplir le nuage sans ressaisir les anciens dossiers, et proposer les bons
 * thèmes en tête de liste dans la fiche.
 */
export function themesDeduits(motif: string): string[] {
  const m = normaliser(motif)
  if (!m) return []
  return THEMES_SUGGERES.filter((t) => t.indices.some((i) => m.includes(i))).map((t) => t.nom)
}

/** Ce que porte une fiche : ses thèmes, sinon ceux que son motif laisse deviner. */
export function themesDuPatient(p: Patient): string[] {
  const choisis = (p.themes ?? []).map((t) => t.trim()).filter(Boolean)
  if (choisis.length > 0) return choisis
  return themesDeduits(p.motif ?? '')
}

/** Une bulle du nuage : un thème, son effectif, et qui il regroupe. */
export interface Bulle {
  cle: string
  nom: string
  nb: number
  patientIds: string[]
  /** Rang de teinte, de 0 à TEINTES − 1. */
  teinte: number
  /** Vrai quand la bulle regroupe les dossiers sans thème. */
  absent: boolean
}

/** Nombre de familles de couleurs disponibles dans la feuille de style. */
export const TEINTES = 10

/** Teinte de départ d'un thème : la même d'un mois à l'autre, quel que soit son rang. */
function teinteDeBase(cle: string): number {
  let h = 0
  for (let i = 0; i < cle.length; i++) h = (h * 31 + cle.charCodeAt(i)) % 100_003
  return h % TEINTES
}

/**
 * Compte les patients par thème, du plus fréquent au moins fréquent.
 * Les couleurs sont attribuées dans cet ordre : chaque thème garde la sienne,
 * et deux thèmes voisins n'héritent jamais de la même.
 */
export function compterThemes(patients: Patient[]): Bulle[] {
  const par = new Map<string, Bulle>()

  for (const p of patients) {
    const noms = themesDuPatient(p)
    const liste = noms.length > 0 ? noms : [THEME_ABSENT]
    const vus = new Set<string>()
    for (const nom of liste) {
      const cle = cleTheme(nom)
      if (!cle || vus.has(cle)) continue // deux fois le même thème sur une fiche
      vus.add(cle)
      const b = par.get(cle)
      if (b) {
        b.nb++
        b.patientIds.push(p.id)
      } else {
        par.set(cle, {
          cle, nom, nb: 1, patientIds: [p.id],
          teinte: 0, absent: cle === cleTheme(THEME_ABSENT),
        })
      }
    }
  }

  const bulles = [...par.values()].sort(
    (a, b) => b.nb - a.nb || a.nom.localeCompare(b.nom, 'fr'),
  )

  const prises = new Set<number>()
  for (const b of bulles) {
    let t = teinteDeBase(b.cle)
    for (let i = 0; i < TEINTES && prises.has(t); i++) t = (t + 1) % TEINTES
    prises.add(t)
    b.teinte = t
  }
  return bulles
}

/* ------------------------------------------------------------------ *
 * Placement des bulles                                               *
 * ------------------------------------------------------------------ */

export interface Disque { x: number; y: number; r: number }

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by)
}

function libre(c: Disque, poses: Disque[], ecart: number): boolean {
  return poses.every((p) => distance(c.x, c.y, p.x, p.y) >= c.r + p.r + ecart - 1e-6)
}

/**
 * Les deux positions où un cercle de rayon `r` touche à la fois `a` et `b`.
 * C'est l'intersection de deux cercles : rien de plus qu'un peu de Pythagore.
 */
function tangentes(a: Disque, b: Disque, r: number, ecart: number): Disque[] {
  const ra = a.r + r + ecart
  const rb = b.r + r + ecart
  const d = distance(a.x, a.y, b.x, b.y)
  if (d === 0 || d > ra + rb || d < Math.abs(ra - rb)) return []
  const m = (ra * ra - rb * rb + d * d) / (2 * d)
  const h2 = ra * ra - m * m
  if (h2 < 0) return []
  const h = Math.sqrt(h2)
  const ux = (b.x - a.x) / d
  const uy = (b.y - a.y) / d
  const px = a.x + m * ux
  const py = a.y + m * uy
  return [
    { x: px - h * uy, y: py + h * ux, r },
    { x: px + h * uy, y: py - h * ux, r },
  ]
}

/**
 * Range les bulles en grappe, de la plus grosse au centre vers les plus petites
 * autour. À chaque tour on essaie toutes les places où la bulle viendrait
 * toucher deux voisines, et on garde la plus proche du centre : c'est ce qui
 * donne une grappe ronde plutôt qu'une file.
 *
 * L'aire — et non le diamètre — est proportionnelle à l'effectif : c'est la
 * surface que l'œil compare, pas le trait.
 */
export function disposerBulles(
  valeurs: number[], largeur: number, hauteur: number, marge = 3,
): Disque[] {
  if (valeurs.length === 0 || largeur <= 0 || hauteur <= 0) return []

  const rayons = valeurs.map((v) => Math.sqrt(Math.max(v, 0)) || 0.001)
  const ecart = Math.max(...rayons) * 0.07
  const poses: Disque[] = []

  rayons.forEach((r, i) => {
    if (i === 0) { poses.push({ x: 0, y: 0, r }); return }
    if (i === 1) { poses.push({ x: poses[0].r + r + ecart, y: 0, r }); return }

    const candidats: Disque[] = []
    for (let a = 0; a < poses.length; a++) {
      const pa = poses[a]
      const d = pa.r + r + ecart
      candidats.push(
        { x: pa.x + d, y: pa.y, r }, { x: pa.x - d, y: pa.y, r },
        { x: pa.x, y: pa.y + d, r }, { x: pa.x, y: pa.y - d, r },
      )
      for (let b = a + 1; b < poses.length; b++) {
        candidats.push(...tangentes(pa, poses[b], r, ecart))
      }
    }

    let meilleur: Disque | null = null
    let meilleureDistance = Infinity
    for (const c of candidats) {
      if (!libre(c, poses, ecart)) continue
      const d = distance(c.x, c.y, 0, 0)
      if (d < meilleureDistance) { meilleureDistance = d; meilleur = c }
    }
    // Aucune place tangente : on repousse la bulle sur le côté, à distance sûre.
    poses.push(meilleur ?? { x: Math.max(...poses.map((p) => p.x + p.r)) + r + ecart, y: 0, r })
  })

  // Recadrage : la grappe occupe tout l'espace donné, sans jamais en sortir.
  const minX = Math.min(...poses.map((p) => p.x - p.r))
  const maxX = Math.max(...poses.map((p) => p.x + p.r))
  const minY = Math.min(...poses.map((p) => p.y - p.r))
  const maxY = Math.max(...poses.map((p) => p.y + p.r))
  const l = Math.max(1e-6, maxX - minX)
  const h = Math.max(1e-6, maxY - minY)
  const k = Math.min((largeur - 2 * marge) / l, (hauteur - 2 * marge) / h)
  const decalageX = (largeur - l * k) / 2 - minX * k
  const decalageY = (hauteur - h * k) / 2 - minY * k

  return poses.map((p) => ({ x: p.x * k + decalageX, y: p.y * k + decalageY, r: p.r * k }))
}
