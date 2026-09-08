import { useState } from 'react'
import ListeCreneaux from '../composants/ListeCreneaux'
import { useCompteur } from '../composants/Compteur'
import { useDonnees } from '../lib/store'
import {
  aujourdhui, ajouterJours, debutSemaine, dateDeIso, jourDeIso, JOURS, MOIS,
} from '../lib/dates'
import { montantSeul, pourcent } from '../lib/format'
import { bilan } from '../lib/argent'
import {
  FlecheDroite, FlecheGauche, IconeAgenda, IconePortefeuille,
} from '../composants/Icones'

interface Props {
  onOuvrirSeance: (seanceId: string) => void
  onCreneauLibre: (date: string, creneau: number) => void
}

function libelleSemaine(debut: string): string {
  const d1 = dateDeIso(debut)
  const d2 = dateDeIso(ajouterJours(debut, 6))
  if (d1.getMonth() === d2.getMonth()) {
    return `${d1.getDate()} – ${d2.getDate()} ${MOIS[d2.getMonth()]}`
  }
  return `${d1.getDate()} ${MOIS[d1.getMonth()].slice(0, 4)}. – ${d2.getDate()} ${MOIS[d2.getMonth()].slice(0, 4)}.`
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
  const partAnimee = useCompteur(b.partPsy)
  const cetteSemaine = debutSemaine(today) === debut

  return (
    <>
      <div className="periode">
        <button className="fleche" aria-label="Semaine précédente" onClick={() => setDebut(ajouterJours(debut, -7))}>
          <FlecheGauche />
        </button>
        <span className="periode-titre">{libelleSemaine(debut)}</span>
        <button className="fleche" aria-label="Semaine suivante" onClick={() => setDebut(ajouterJours(debut, 7))}>
          <FlecheDroite />
        </button>
      </div>

      {!cetteSemaine && (
        <button className="btn bloc" onClick={() => setDebut(debutSemaine(today))}>
          Revenir à cette semaine
        </button>
      )}

      <section className="duo-cartes">
        <div className="carte-stat">
          <div className="stat-entete">
            <span className="disque"><IconeAgenda taille={16} /></span>
            <span className="stat-libelle">Créneaux pris</span>
          </div>
          <div className="stat-valeur">
            <span className="nombre">{dansLaSemaine.length}</span>
            <span className="unite">/ {capacite}</span>
          </div>
          <p className="stat-detail">
            {pourcent(capacite > 0 ? Math.round((dansLaSemaine.length / capacite) * 100) : 0)} de la semaine
          </p>
        </div>
        <div className="carte-stat">
          <div className="stat-entete">
            <span className="disque"><IconePortefeuille /></span>
            <span className="stat-libelle">Ma part</span>
          </div>
          <div className="stat-valeur">
            <span className="nombre">{montantSeul(partAnimee)}</span>
            <span className="unite">DA</span>
          </div>
          <p className="stat-detail">{b.nbDues} séance{b.nbDues > 1 ? 's' : ''} due{b.nbDues > 1 ? 's' : ''}</p>
        </div>
      </section>

      {jours.map((d) => (
        <section key={d}>
          <div className="jour-titre">
            {JOURS[jourDeIso(d)]}
            <small>{dateDeIso(d).getDate()} {MOIS[dateDeIso(d).getMonth()]}</small>
            {d === today && <span className="pastille-date">aujourd’hui</span>}
          </div>
          <ListeCreneaux date={d} onOuvrirSeance={onOuvrirSeance} onCreneauLibre={onCreneauLibre} />
        </section>
      ))}

      {jours.length === 0 && (
        <div className="vide">
          <span className="disque grand"><IconeAgenda taille={22} /></span>
          <strong>Aucun jour de travail configuré</strong>
          Choisissez vos jours dans les réglages.
        </div>
      )}
    </>
  )
}
