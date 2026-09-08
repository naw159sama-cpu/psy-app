import { useState } from 'react'
import ListeCreneaux from '../composants/ListeCreneaux'
import { useDonnees } from '../lib/store'
import {
  aujourdhui, ajouterJours, debutSemaine, dateDeIso, jourDeIso, JOURS, MOIS,
} from '../lib/dates'
import { da } from '../lib/format'
import { bilan } from '../lib/argent'
import { FlecheDroite, FlecheGauche } from '../composants/Icones'

interface Props {
  onOuvrirSeance: (seanceId: string) => void
  onCreneauLibre: (date: string, creneau: number) => void
}

function libelleSemaine(debut: string): string {
  const d1 = dateDeIso(debut)
  const d2 = dateDeIso(ajouterJours(debut, 6))
  const m1 = MOIS[d1.getMonth()].slice(0, 4)
  const m2 = MOIS[d2.getMonth()].slice(0, 4)
  if (d1.getMonth() === d2.getMonth()) return `${d1.getDate()} – ${d2.getDate()} ${MOIS[d2.getMonth()]}`
  return `${d1.getDate()} ${m1}. – ${d2.getDate()} ${m2}.`
}

export default function Agenda({ onOuvrirSeance, onCreneauLibre }: Props) {
  const { seances, reglages } = useDonnees()
  const [debut, setDebut] = useState(() => debutSemaine(aujourdhui()))
  const today = aujourdhui()

  const jours = Array.from({ length: 7 }, (_, i) => ajouterJours(debut, i))
    .filter((d) => reglages.joursTravail.includes(jourDeIso(d)))

  const dansLaSemaine = seances.filter((s) => s.date >= debut && s.date <= ajouterJours(debut, 6))
  const b = bilan(dansLaSemaine)
  const capacite = jours.length * reglages.creneaux.length

  return (
    <>
      <div className="periode">
        <button className="fleche" aria-label="Semaine précédente" onClick={() => setDebut(ajouterJours(debut, -7))}>
          <FlecheGauche />
        </button>
        <div className="periode-titre">{libelleSemaine(debut)}</div>
        <button className="fleche" aria-label="Semaine suivante" onClick={() => setDebut(ajouterJours(debut, 7))}>
          <FlecheDroite />
        </button>
      </div>

      {debutSemaine(today) !== debut && (
        <button
          className="btn bloc"
          style={{ marginBottom: 6 }}
          onClick={() => setDebut(debutSemaine(today))}
        >
          Revenir à cette semaine
        </button>
      )}

      <div className="chiffres" style={{ marginTop: 12 }}>
        <div className="chiffre">
          <div className="val">
            {dansLaSemaine.length}
            <span style={{ fontSize: '.9rem', fontWeight: 500, color: 'var(--doux)' }}> / {capacite}</span>
          </div>
          <div className="lib">Créneaux pris</div>
        </div>
        <div className="chiffre plein">
          <div className="val">{da(b.partPsy)}</div>
          <div className="lib">Ma part sur la semaine</div>
        </div>
      </div>

      {jours.map((d) => (
        <div key={d}>
          <div className={`jour-titre${d === today ? ' actuel' : ''}`}>
            {JOURS[jourDeIso(d)]}
            <small>{dateDeIso(d).getDate()} {MOIS[dateDeIso(d).getMonth()]}</small>
            {d === today && <small style={{ color: 'var(--accent)' }}>· aujourd’hui</small>}
          </div>
          <ListeCreneaux date={d} onOuvrirSeance={onOuvrirSeance} onCreneauLibre={onCreneauLibre} />
        </div>
      ))}

      {jours.length === 0 && (
        <div className="vide">
          <strong>Aucun jour de travail configuré</strong>
          Choisissez vos jours dans les réglages.
        </div>
      )}
    </>
  )
}
