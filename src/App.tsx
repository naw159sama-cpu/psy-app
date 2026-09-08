import { useEffect, useMemo, useState } from 'react'
import Jour from './ecrans/Jour'
import Agenda from './ecrans/Agenda'
import Patients from './ecrans/Patients'
import FichePatient from './ecrans/FichePatient'
import Argent from './ecrans/Argent'
import Stats from './ecrans/Stats'
import Reglages from './ecrans/Reglages'
import FeuilleSeance from './composants/FeuilleSeance'
import FeuilleChoixPatient from './composants/FeuilleChoixPatient'
import FeuilleNouveauPatient from './composants/FeuilleNouveauPatient'
import FeuilleRappels from './composants/FeuilleRappels'
import {
  IconeAgenda, IconeArgent, IconeCloche, IconeJour, IconeOeil, IconePatients,
  IconePlus, IconeReglages, IconeRetour, IconeStats,
} from './composants/Icones'
import { useDonnees, basculerMasquage } from './lib/store'
import { aujourdhui, ajouterJours, dateLongue, jourDeIso } from './lib/dates'
import { estDue } from './lib/argent'
import { initiales } from './lib/format'
import { nomAffiche } from './lib/affichage'

type Onglet = 'jour' | 'agenda' | 'patients' | 'argent' | 'stats'
type Vue =
  | { type: 'onglet' }
  | { type: 'patient'; id: string }
  | { type: 'reglages' }
type Panneau =
  | { type: 'seance'; id: string }
  | { type: 'choix'; date: string; creneau: number }
  | { type: 'nouveau-patient' }
  | { type: 'rappels' }
  | null

const ONGLETS: Array<{ cle: Onglet; libelle: string; Icone: typeof IconeJour }> = [
  { cle: 'jour', libelle: 'Ma journée', Icone: IconeJour },
  { cle: 'agenda', libelle: 'Agenda', Icone: IconeAgenda },
  { cle: 'patients', libelle: 'Patients', Icone: IconePatients },
  { cle: 'argent', libelle: 'Argent', Icone: IconeArgent },
  { cle: 'stats', libelle: 'Bilan', Icone: IconeStats },
]

const TITRES: Record<Onglet, { surtitre: string; titre: string }> = {
  jour: { surtitre: 'Consultations du jour', titre: 'Ma journée' },
  agenda: { surtitre: 'Planning de la semaine', titre: 'Agenda' },
  patients: { surtitre: 'Dossiers cliniques', titre: 'Patients' },
  argent: { surtitre: 'Facturation & honoraires', titre: 'Argent' },
  stats: { surtitre: 'Activité du cabinet', titre: 'Bilan' },
}

/** Prochain jour travaillé, aujourd'hui compris — sert au bouton « nouveau rendez-vous ». */
function prochainJourTravaille(jours: number[]): string {
  let d = aujourdhui()
  for (let i = 0; i < 14; i++) {
    if (jours.includes(jourDeIso(d))) return d
    d = ajouterJours(d, 1)
  }
  return aujourdhui()
}

export default function App() {
  const { patients, seances, reglages } = useDonnees()
  const [onglet, setOnglet] = useState<Onglet>('jour')
  const [vue, setVue] = useState<Vue>({ type: 'onglet' })
  const [panneau, setPanneau] = useState<Panneau>(null)

  useEffect(() => {
    const e = localStorage.getItem('psy-app:echelle')
    if (e) document.documentElement.style.setProperty('--echelle', e)
  }, [])

  // Ctrl+M : masquer les noms d'un geste quand quelqu'un regarde l'écran.
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        basculerMasquage()
      }
    }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [])

  const today = aujourdhui()
  const nbRappels = useMemo(() => {
    const notes = seances.filter((s) => s.date < today && s.statut === 'effectue' && !s.note.trim())
    const impayes = seances.filter((s) => s.date <= today && estDue(s.statut) && !s.paye)
    return notes.length + impayes.length
  }, [seances, today])

  const ouvrirSeance = (id: string) => setPanneau({ type: 'seance', id })
  const creneauLibre = (date: string, creneau: number) => setPanneau({ type: 'choix', date, creneau })
  const ouvrirPatient = (id: string) => { setPanneau(null); setVue({ type: 'patient', id }) }
  const allerOnglet = (o: Onglet) => { setOnglet(o); setVue({ type: 'onglet' }) }

  /** Place un rendez-vous sur le premier créneau libre de la prochaine journée travaillée. */
  const nouveauRendezVous = () => {
    const date = prochainJourTravaille(reglages.joursTravail)
    const pris = new Set(seances.filter((s) => s.date === date).map((s) => s.creneau))
    const libre = reglages.creneaux.findIndex((_, i) => !pris.has(i))
    if (libre === -1) {
      setOnglet('agenda')
      setVue({ type: 'onglet' })
      return
    }
    creneauLibre(date, libre)
  }

  // Titre de page, bouton retour, et l'unique action corail de l'écran.
  let surtitre = ''
  let titre = ''
  let legende: string | null = null
  let retour: (() => void) | null = null
  let fab: { libelle: string; action: () => void } | null = null

  if (vue.type === 'patient') {
    const p = patients.find((x) => x.id === vue.id)
    surtitre = 'Dossier clinique'
    titre = nomAffiche(p, reglages.masquerNoms)
    legende = p?.motif || 'Suivi en cours'
    retour = () => setVue({ type: 'onglet' })
  } else if (vue.type === 'reglages') {
    surtitre = 'Configuration'
    titre = 'Réglages'
    retour = () => setVue({ type: 'onglet' })
  } else {
    surtitre = TITRES[onglet].surtitre
    titre = TITRES[onglet].titre
    if (onglet === 'jour') {
      legende = dateLongue(today)
      fab = { libelle: 'Nouveau rendez-vous', action: nouveauRendezVous }
    }
    if (onglet === 'agenda') fab = { libelle: 'Nouveau rendez-vous', action: nouveauRendezVous }
    if (onglet === 'patients') {
      fab = { libelle: 'Nouveau patient', action: () => setPanneau({ type: 'nouveau-patient' }) }
    }
  }

  const nomCabinet = reglages.nomCabinet.trim() || 'Cabinet de psychologie'
  const nomPraticienne = reglages.nomPraticienne.trim()
  const monogramme = nomPraticienne
    ? initiales(nomPraticienne.split(' ')[0] ?? '', nomPraticienne.split(' ').slice(1).join(' '))
    : 'MC'

  return (
    <div className="app">
      <header className="barre-haut">
        <div className="identite">
          <div className="avatar-cabinet">{monogramme}</div>
          <div className="identite-textes">
            <h1 className="identite-titre">{nomCabinet}</h1>
            <p className="identite-sous">
              {nomPraticienne ? `${nomPraticienne} · Psychologue` : 'Psychologue clinicienne'}
            </p>
          </div>
        </div>
        <div className="actions-haut">
          <button
            className={`bouton-rond${reglages.masquerNoms ? ' actif' : ''}`}
            aria-label={reglages.masquerNoms ? 'Afficher les noms' : 'Masquer les noms'}
            aria-pressed={reglages.masquerNoms}
            title="Masquer les noms (Ctrl+M)"
            onClick={basculerMasquage}
          >
            <IconeOeil barre={reglages.masquerNoms} />
          </button>
          <button
            className="bouton-rond"
            aria-label={`Rappels${nbRappels > 0 ? ` (${nbRappels})` : ''}`}
            onClick={() => setPanneau({ type: 'rappels' })}
          >
            <IconeCloche />
            {nbRappels > 0 && <span className="point-alerte" />}
          </button>
          {vue.type !== 'reglages' && (
            <button
              className="bouton-rond"
              aria-label="Réglages"
              onClick={() => setVue({ type: 'reglages' })}
            >
              <IconeReglages />
            </button>
          )}
        </div>
      </header>

      <main className="contenu" key={vue.type === 'onglet' ? onglet : vue.type}>
        <div className="titre-page">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
            {retour && (
              <button className="rond-contour" aria-label="Retour" onClick={retour}>
                <IconeRetour />
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <span className="surtitre">{surtitre}</span>
              <h2 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {titre}
              </h2>
              {legende && <p className="legende">{legende}</p>}
            </div>
          </div>
        </div>

        {vue.type === 'patient' ? (
          <FichePatient
            patientId={vue.id}
            onOuvrirSeance={ouvrirSeance}
            onSupprime={() => setVue({ type: 'onglet' })}
          />
        ) : vue.type === 'reglages' ? (
          <Reglages />
        ) : onglet === 'jour' ? (
          <Jour onOuvrirSeance={ouvrirSeance} onCreneauLibre={creneauLibre} />
        ) : onglet === 'agenda' ? (
          <Agenda onOuvrirSeance={ouvrirSeance} onCreneauLibre={creneauLibre} />
        ) : onglet === 'patients' ? (
          <Patients
            onOuvrirPatient={(id) => setVue({ type: 'patient', id })}
            onNouveauPatient={() => setPanneau({ type: 'nouveau-patient' })}
          />
        ) : onglet === 'argent' ? (
          <Argent onOuvrirSeance={ouvrirSeance} />
        ) : (
          <Stats />
        )}
      </main>

      {fab && (
        <button className="fab" key={titre} onClick={fab.action}>
          <IconePlus />
          {fab.libelle}
        </button>
      )}

      <nav className="onglets" aria-label="Navigation principale">
        <div className="onglets-int">
          {ONGLETS.map(({ cle, libelle, Icone }) => (
            <button
              key={cle}
              className="onglet"
              aria-current={vue.type === 'onglet' && onglet === cle ? 'page' : undefined}
              onClick={() => allerOnglet(cle)}
            >
              <Icone />
              {libelle}
            </button>
          ))}
        </div>
      </nav>

      {panneau?.type === 'seance' && (
        <FeuilleSeance
          seanceId={panneau.id}
          onFermer={() => setPanneau(null)}
          onOuvrirPatient={ouvrirPatient}
        />
      )}
      {panneau?.type === 'choix' && (
        <FeuilleChoixPatient
          date={panneau.date}
          creneau={panneau.creneau}
          onFermer={() => setPanneau(null)}
          onSeanceCreee={(id) => setPanneau({ type: 'seance', id })}
        />
      )}
      {panneau?.type === 'nouveau-patient' && (
        <FeuilleNouveauPatient
          onFermer={() => setPanneau(null)}
          onCree={(id) => ouvrirPatient(id)}
        />
      )}
      {panneau?.type === 'rappels' && (
        <FeuilleRappels
          onFermer={() => setPanneau(null)}
          onOuvrirSeance={ouvrirSeance}
        />
      )}
    </div>
  )
}

