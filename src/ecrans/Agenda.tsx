import { useEffect, useMemo, useState } from 'react'
import ListeCreneaux from '../composants/ListeCreneaux'
import GrilleMois from '../composants/GrilleMois'
import CarteJourSemaine from '../composants/CarteJourSemaine'
import Anneau from '../composants/Anneau'
import { useCompteur } from '../composants/Compteur'
import { useDonnees } from '../lib/store'
import {
  aujourdhui, ajouterJours, ajouterMois, debutSemaine, dateDeIso, dateLongue,
  jourDeIso, moisCourant, moisLibelle, JOURS, MOIS,
} from '../lib/dates'
import { montantSeul, pourcent } from '../lib/format'
import { bilan, partPsy } from '../lib/argent'
import { joursDuMois } from '../lib/calendrier'
import {
  FlecheDroite, FlecheGauche, IconeAgenda, IconeGrille, IconePortefeuille,
} from '../composants/Icones'

type Vue = 'jour' | 'semaine' | 'mois'
const CLE_VUE = 'psy-app:vue-agenda'

interface Props {
  onOuvrirSeance: (seanceId: string) => void
  onCreneauLibre: (date: string, creneau: number) => void
  /** Ouvre la journée dans une fenêtre, depuis la grille du mois. */
  onOuvrirJour: (date: string) => void
}

function libelleSemaine(debut: string): string {
  const d1 = dateDeIso(debut)
  const d2 = dateDeIso(ajouterJours(debut, 6))
  if (d1.getMonth() === d2.getMonth()) {
    return `${d1.getDate()} – ${d2.getDate()} ${MOIS[d2.getMonth()]}`
  }
  return `${d1.getDate()} ${MOIS[d1.getMonth()].slice(0, 4)}. – ${d2.getDate()} ${MOIS[d2.getMonth()].slice(0, 4)}.`
}

function vueEnregistree(): Vue {
  const v = localStorage.getItem(CLE_VUE)
  return v === 'jour' || v === 'semaine' || v === 'mois' ? v : 'semaine'
}

export default function Agenda({ onOuvrirSeance, onCreneauLibre, onOuvrirJour }: Props) {
  const { seances, reglages } = useDonnees()
  const today = aujourdhui()

  const [vue, setVue] = useState<Vue>(vueEnregistree)
  const [jour, setJour] = useState(today)
  const [debut, setDebut] = useState(() => debutSemaine(today))
  const [mois, setMois] = useState(moisCourant)

  // La vue choisie est retrouvée à la prochaine ouverture.
  useEffect(() => { localStorage.setItem(CLE_VUE, vue) }, [vue])

  const changerVue = (v: Vue) => {
    // Passer d'une vue à l'autre garde le jour qu'on regardait.
    if (v === 'semaine') setDebut(debutSemaine(jour))
    if (v === 'mois') setMois(jour.slice(0, 7))
    setVue(v)
  }

  const choisirJour = (date: string) => {
    setJour(date)
    if (date.slice(0, 7) !== mois) setMois(date.slice(0, 7))
    // La journée s'ouvre en fenêtre : c'est le geste attendu d'un agenda.
    onOuvrirJour(date)
  }

  /** Premier créneau libre d'une journée, pour l'appui long sur la grille. */
  const premierLibre = (date: string): number | null => {
    const pris = new Set(seances.filter((s) => s.date === date).map((s) => s.creneau))
    const i = reglages.creneaux.findIndex((_, k) => !pris.has(k))
    return i === -1 ? null : i
  }

  const nouveauRdv = (date: string) => {
    const libre = premierLibre(date)
    setJour(date)
    if (libre !== null) onCreneauLibre(date, libre)
  }

  const joursSemaine = Array.from({ length: 7 }, (_, i) => ajouterJours(debut, i))
    .filter((d) => reglages.joursTravail.includes(jourDeIso(d)))

  const dansLaSemaine = seances.filter((s) => s.date >= debut && s.date <= ajouterJours(debut, 6))
  const bSemaine = bilan(dansLaSemaine)
  const capaciteSemaine = joursSemaine.length * reglages.creneaux.length
  const partSemaine = useCompteur(bSemaine.partPsy)

  // Synthèse du mois : ce que la grille ne peut pas montrer case par case.
  const synthese = useMemo(() => {
    const duMois = seances.filter((s) => s.date.startsWith(mois))
    const [a, m] = mois.split('-').map(Number)
    let joursOuvrables = 0
    for (let j = 1; j <= joursDuMois(mois); j++) {
      if (reglages.joursTravail.includes(new Date(a, m - 1, j).getDay())) joursOuvrables++
    }
    const capacite = joursOuvrables * reglages.creneaux.length
    // Prévisionnel : ce que rapporterait le mois si tout se déroule comme prévu.
    const previsionnel = duMois.reduce(
      (t, s) => t + (s.statut === 'prevu' ? Math.round((s.tarif * s.partPsyPct) / 100) : partPsy(s)),
      0,
    )
    return {
      nb: duMois.length,
      capacite,
      taux: capacite > 0 ? Math.round((duMois.length / capacite) * 100) : 0,
      libres: Math.max(0, capacite - duMois.length),
      previsionnel,
    }
  }, [seances, mois, reglages.joursTravail, reglages.creneaux.length])

  const previsionnelAnime = useCompteur(synthese.previsionnel)

  const segments = (
    <div className="segments" role="tablist" aria-label="Vue de l’agenda">
      {(['jour', 'semaine', 'mois'] as Vue[]).map((v) => (
        <button key={v} role="tab" aria-pressed={vue === v} onClick={() => changerVue(v)}>
          {v === 'jour' ? 'Jour' : v === 'semaine' ? 'Semaine' : 'Mois'}
        </button>
      ))}
    </div>
  )

  /* ---------------- Vue jour ---------------- */

  if (vue === 'jour') {
    const chome = !reglages.joursTravail.includes(jourDeIso(jour))
    return (
      <>
        {segments}
        <div className="periode">
          <button className="fleche" aria-label="Jour précédent" onClick={() => setJour(ajouterJours(jour, -1))}>
            <FlecheGauche />
          </button>
          <span className="periode-titre">{dateLongue(jour)}</span>
          <button className="fleche" aria-label="Jour suivant" onClick={() => setJour(ajouterJours(jour, 1))}>
            <FlecheDroite />
          </button>
        </div>

        {jour !== today && (
          <button className="btn bloc" onClick={() => setJour(today)}>Aujourd’hui</button>
        )}

        {chome ? (
          <div className="vide">
            <span className="disque grand"><IconeAgenda taille={22} /></span>
            <strong>Jour non travaillé</strong>
            Vous ne consultez pas le {JOURS[jourDeIso(jour)]}.
          </div>
        ) : (
          <ListeCreneaux date={jour} onOuvrirSeance={onOuvrirSeance} onCreneauLibre={onCreneauLibre} />
        )}
      </>
    )
  }

  /* ---------------- Vue mois ---------------- */

  if (vue === 'mois') {
    const jourDuMois = jour.slice(0, 7) === mois ? jour : `${mois}-01`
    return (
      <>
        {segments}
        <div className="periode">
          <button className="fleche" aria-label="Mois précédent" onClick={() => setMois(ajouterMois(mois, -1))}>
            <FlecheGauche />
          </button>
          <span className="periode-titre">{moisLibelle(mois)}</span>
          <button className="fleche" aria-label="Mois suivant" onClick={() => setMois(ajouterMois(mois, 1))}>
            <FlecheDroite />
          </button>
        </div>

        {mois !== moisCourant() && (
          <button
            className="btn bloc"
            onClick={() => { setMois(moisCourant()); setJour(today) }}
          >
            Aujourd’hui
          </button>
        )}

        <GrilleMois
          mois={mois}
          selection={jourDuMois}
          onSelectionner={choisirJour}
          onNouveauRdv={nouveauRdv}
          onMoisPrecedent={() => setMois(ajouterMois(mois, -1))}
          onMoisSuivant={() => setMois(ajouterMois(mois, 1))}
        />

        <button className="btn bloc" onClick={() => onOuvrirJour(jourDuMois)}>
          Ouvrir {dateLongue(jourDuMois)}
        </button>

        <section className="duo-cartes">
          <div className="carte-stat">
            <div className="stat-entete">
              <span className="disque"><IconeGrille taille={16} /></span>
              <span className="stat-libelle">Séances du mois</span>
            </div>
            <div className="stat-valeur">
              <span className="nombre">{synthese.nb}</span>
              <span className="unite">/ {synthese.capacite}</span>
            </div>
            <p className="stat-detail">
              {pourcent(synthese.taux)} rempli · {synthese.libres} créneau
              {synthese.libres > 1 ? 'x' : ''} libre{synthese.libres > 1 ? 's' : ''}
            </p>
          </div>
          <div className="carte-stat">
            <div className="stat-entete">
              <span className="disque"><IconePortefeuille /></span>
              <span className="stat-libelle">Prévisionnel</span>
            </div>
            <div className="stat-valeur">
              <span className="nombre">{montantSeul(previsionnelAnime)}</span>
              <span className="unite">DA</span>
            </div>
            <p className="stat-detail">Ma part, si tout se fait</p>
          </div>
        </section>

      </>
    )
  }

  /* ---------------- Vue semaine ---------------- */

  return (
    <>
      {segments}
      <div className="periode">
        <button className="fleche" aria-label="Semaine précédente" onClick={() => setDebut(ajouterJours(debut, -7))}>
          <FlecheGauche />
        </button>
        <span className="periode-titre">{libelleSemaine(debut)}</span>
        <button className="fleche" aria-label="Semaine suivante" onClick={() => setDebut(ajouterJours(debut, 7))}>
          <FlecheDroite />
        </button>
      </div>

      {debutSemaine(today) !== debut && (
        <button
          className="btn bloc"
          onClick={() => { setDebut(debutSemaine(today)); setJour(today) }}
        >
          Aujourd’hui
        </button>
      )}

      <section className="duo-cartes">
        <div className="carte-stat">
          <div className="stat-entete">
            <span className="stat-libelle">Taux d’occupation</span>
            <Anneau
              pourcent={capaciteSemaine > 0 ? (dansLaSemaine.length / capaciteSemaine) * 100 : 0}
            />
          </div>
          <div className="stat-valeur">
            <span className="nombre">{dansLaSemaine.length}</span>
            <span className="unite">/ {capaciteSemaine}</span>
          </div>
          <p className="stat-detail">créneaux réservés</p>
        </div>
        <div className="carte-stat pleine">
          <div className="stat-entete">
            <span className="stat-libelle">Honoraires estimés</span>
            <span className="disque"><IconePortefeuille /></span>
          </div>
          <div className="stat-valeur">
            <span className="nombre">{montantSeul(partSemaine)}</span>
            <span className="unite">DA</span>
          </div>
          <p className="stat-detail">
            Semaine · {bSemaine.nbDues} séance{bSemaine.nbDues > 1 ? 's' : ''} due{bSemaine.nbDues > 1 ? 's' : ''}
          </p>
        </div>
      </section>

      <div className="pile-semaine">
        {joursSemaine.map((d) => (
          <CarteJourSemaine
            key={d}
            date={d}
            estAujourdhui={d === today}
            onOuvrir={(date) => { setJour(date); onOuvrirJour(date) }}
          />
        ))}
      </div>

      {joursSemaine.length === 0 && (
        <div className="vide">
          <span className="disque grand"><IconeAgenda taille={22} /></span>
          <strong>Aucun jour de travail configuré</strong>
          Choisissez vos jours dans les réglages.
        </div>
      )}
    </>
  )
}
