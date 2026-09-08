import { useMemo, useRef } from 'react'
import { useDonnees } from '../lib/store'
import { grilleMois, JOURS_GRILLE, moisVoisins } from '../lib/calendrier'
import { jourDeIso } from '../lib/dates'
import type { Seance } from '../lib/types'

interface Props {
  mois: string
  /** Jour actuellement ouvert sous la grille. */
  selection: string
  onSelectionner: (date: string) => void
  /** Appui long sur une case : proposer un rendez-vous ce jour-là. */
  onNouveauRdv: (date: string) => void
  onMoisPrecedent: () => void
  onMoisSuivant: () => void
}

const DUREE_APPUI_LONG = 650
/** Au-delà, le doigt glisse : ce n'est plus un appui long. */
const TOLERANCE_APPUI = 10

export default function GrilleMois({
  mois, selection, onSelectionner, onNouveauRdv, onMoisPrecedent, onMoisSuivant,
}: Props) {
  const { seances, patients, reglages } = useDonnees()

  // Le mois affiché et ses deux voisins sont regroupés d'un coup : changer de
  // mois ne relit alors plus la liste complète des séances.
  const [precedent, courant, suivant] = moisVoisins(mois)
  const parJour = useMemo(() => {
    const carte = new Map<string, Seance[]>()
    for (const s of seances) {
      const m = s.date.slice(0, 7)
      if (m !== precedent && m !== courant && m !== suivant) continue
      const liste = carte.get(s.date)
      if (liste) liste.push(s)
      else carte.set(s.date, [s])
    }
    for (const liste of carte.values()) liste.sort((a, b) => a.creneau - b.creneau)
    return carte
  }, [seances, precedent, courant, suivant])

  const cases = useMemo(() => grilleMois(mois), [mois])

  const minuteur = useRef<number | null>(null)
  const glissement = useRef({ x: 0, y: 0, actif: false })

  const annulerAppui = () => {
    if (minuteur.current !== null) { clearTimeout(minuteur.current); minuteur.current = null }
  }

  const debutAppui = (date: string) => {
    annulerAppui()
    minuteur.current = window.setTimeout(() => {
      minuteur.current = null
      onNouveauRdv(date)
    }, DUREE_APPUI_LONG)
  }

  // Balayage horizontal : mois précédent ou suivant.
  const onPointerDown = (e: React.PointerEvent) => {
    glissement.current = { x: e.clientX, y: e.clientY, actif: true }
  }
  // Un doigt qui bouge annule l'appui long : sinon un simple balayage ouvrirait
  // la prise de rendez-vous.
  const onPointerMove = (e: React.PointerEvent) => {
    const g = glissement.current
    if (!g.actif) return
    if (Math.abs(e.clientX - g.x) > TOLERANCE_APPUI || Math.abs(e.clientY - g.y) > TOLERANCE_APPUI) {
      annulerAppui()
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const g = glissement.current
    if (!g.actif) return
    g.actif = false
    const dx = e.clientX - g.x
    const dy = e.clientY - g.y
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      annulerAppui()
      if (dx < 0) onMoisSuivant()
      else onMoisPrecedent()
    }
  }

  const prenom = (patientId: string) => {
    const p = patients.find((x) => x.id === patientId)
    if (!p) return '—'
    if (reglages.masquerNoms) return `${(p.prenom[0] ?? '').toUpperCase()}.`
    return p.prenom
  }

  return (
    <div
      className="mois-grille"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { glissement.current.actif = false; annulerAppui() }}
    >
      <div className="mois-entetes" aria-hidden>
        {JOURS_GRILLE.map((j, i) => <span key={i}>{j}</span>)}
      </div>

      <div className="mois-lignes">
        {cases.map((c, i) => {
          const chomee = !reglages.joursTravail.includes(jourDeIso(c.date))
          const duJour = parJour.get(c.date) ?? []
          const capacite = chomee ? 0 : reglages.creneaux.length
          const taux = capacite > 0 ? Math.min(1, duJour.length / capacite) : 0
          const classes = ['mois-case']
          if (!c.dansLeMois) classes.push('dehors')
          if (chomee) classes.push('chomee')
          if (c.estAujourdhui) classes.push('actuel')
          if (c.date === selection) classes.push('choisi')

          return (
            <button
              key={c.date}
              className={classes.join(' ')}
              style={{ animationDelay: `${Math.min(i, 20) * 0.008}s` }}
              aria-label={`${c.date} — ${duJour.length} rendez-vous`}
              aria-current={c.date === selection ? 'date' : undefined}
              onClick={() => onSelectionner(c.date)}
              onPointerDown={() => !chomee && debutAppui(c.date)}
              onPointerUp={annulerAppui}
              onPointerLeave={annulerAppui}
              onContextMenu={(e) => { e.preventDefault(); if (!chomee) onNouveauRdv(c.date) }}
            >
              <span className="mois-numero">{Number(c.date.slice(8))}</span>

              {duJour.slice(0, 3).map((s) => {
                const manquee = s.statut === 'absent' || s.statut.startsWith('annule')
                return (
                  <span key={s.id} className={`mois-rdv${manquee ? ' manquee' : ''}`}>
                    {reglages.creneaux[s.creneau]?.debut.slice(0, 2) ?? '--'}h {prenom(s.patientId)}
                  </span>
                )
              })}
              {duJour.length > 3 && (
                <span className="mois-reste">+{duJour.length - 3} autres</span>
              )}

              {capacite > 0 && (
                <span className="mois-densite">
                  <span
                    className={taux >= 1 ? 'pleine' : undefined}
                    style={{ width: `${Math.round(taux * 100)}%` }}
                  />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mois-legende">
        <span><i /> Séance prévue</span>
        <span><i className="manquee" /> Annulée ou absence</span>
        <span><i className="chomee" /> Jour non travaillé</span>
      </div>
    </div>
  )
}
