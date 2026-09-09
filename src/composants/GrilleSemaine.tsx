import { useDonnees } from '../lib/store'
import { JOURS_COURTS, ajouterJours, dateDeIso, jourDeIso } from '../lib/dates'
import { estDue } from '../lib/argent'
import type { Seance } from '../lib/types'

interface Props {
  /** Samedi qui ouvre la semaine. */
  debut: string
  aujourdHui: string
  /** « 5 – 11 septembre », affiché sous la grille. */
  libelle: string
  onOuvrirJour: (date: string) => void
}

/**
 * La semaine dans le même langage que la grille du mois — mêmes cellules,
 * mêmes pastilles, même barre de densité — mais sur les seuls jours
 * travaillés. Quatre colonnes au lieu de sept : le prénom tient enfin.
 */
export default function GrilleSemaine({ debut, aujourdHui, libelle, onOuvrirJour }: Props) {
  const { seances, patients, reglages } = useDonnees()

  const jours = Array.from({ length: 7 }, (_, i) => ajouterJours(debut, i))
    .filter((d) => reglages.joursTravail.includes(jourDeIso(d)))

  const parJour = new Map<string, Seance[]>()
  for (const s of seances) {
    if (s.date < debut || s.date > ajouterJours(debut, 6)) continue
    const liste = parJour.get(s.date)
    if (liste) liste.push(s)
    else parJour.set(s.date, [s])
  }
  for (const l of parJour.values()) l.sort((a, b) => a.creneau - b.creneau)

  const prenom = (patientId: string) => {
    const p = patients.find((x) => x.id === patientId)
    if (!p) return '—'
    return reglages.masquerNoms ? `${(p.prenom[0] ?? '').toUpperCase()}.` : p.prenom
  }

  if (jours.length === 0) return null

  return (
    <div
      className="grille-semaine"
      style={{ gridTemplateColumns: `repeat(${jours.length}, minmax(0, 1fr))` }}
    >
      {jours.map((d) => {
        const date = dateDeIso(d)
        const duJour = parJour.get(d) ?? []
        const capacite = reglages.creneaux.length
        const taux = capacite > 0 ? Math.min(1, duJour.length / capacite) : 0
        const estAujourdHui = d === aujourdHui

        return (
          <button
            key={d}
            className={`gs-case${estAujourdHui ? ' actuel' : ''}`}
            onClick={() => onOuvrirJour(d)}
            aria-label={`${JOURS_COURTS[jourDeIso(d)]} ${date.getDate()} — ${duJour.length} rendez-vous`}
          >
            <span className="gs-entete">
              <span className="gs-jour">{JOURS_COURTS[jourDeIso(d)]}</span>
              <span className="gs-numero">{date.getDate()}</span>
            </span>

            <span className="gs-rdvs">
              {duJour.length === 0 ? (
                <span className="gs-libre">libre</span>
              ) : (
                duJour.map((s) => {
                  const manquee = s.statut === 'absent' || s.statut.startsWith('annule')
                  const aEncaisser = estDue(s.statut) && !s.paye
                  return (
                    <span
                      key={s.id}
                      className={`gs-rdv t${s.creneau % 4}${manquee ? ' manquee' : ''}${s.modePresence === 'visio' ? ' visio' : ''}`}
                    >
                      <span className="gs-heure">
                        {reglages.creneaux[s.creneau]?.debut ?? '--:--'}
                      </span>
                      <span className="gs-nom">{prenom(s.patientId)}</span>
                      {aEncaisser && <span className="gs-point" aria-label="à encaisser" />}
                    </span>
                  )
                })
              )}
            </span>

            <span className="gs-densite">
              <span
                className={taux >= 1 ? 'pleine' : undefined}
                style={{ width: `${Math.round(taux * 100)}%` }}
              />
            </span>
          </button>
        )
      })}

      <p className="gs-mois">{libelle}</p>
    </div>
  )
}
