import { useEffect, useMemo, useState } from 'react'
import Jour from './ecrans/Jour'
import Agenda from './ecrans/Agenda'
import Patients from './ecrans/Patients'
import FichePatient from './ecrans/FichePatient'
import Argent from './ecrans/Argent'
import Reglages from './ecrans/Reglages'
import Rappels from './ecrans/Rappels'
import FeuilleSeance from './composants/FeuilleSeance'
import FeuilleChoixPatient from './composants/FeuilleChoixPatient'
import FeuilleNouveauPatient from './composants/FeuilleNouveauPatient'
import FeuilleRappels from './composants/FeuilleRappels'
import FeuilleSouffle from './composants/FeuilleSouffle'
import {
  IconeAgenda, IconeArgent, IconeCloche, IconeJour, IconeOeil, IconePatients,
  IconePlus, IconeReglages, IconeRetour,
} from './composants/Icones'
import { useDonnees, basculerMasquage } from './lib/store'
import { aujourdhui, ajouterJours, dateLongue, jourDeIso } from './lib/dates'
import { estDue } from './lib/argent'
import { heurePassee, prochainJourARappeler, rappelsEnAttente } from './lib/rappels'
import { initiales } from './lib/format'
import { nomAffiche } from './lib/affichage'

type Onglet = 'accueil' | 'agenda' | 'patients' | 'finances' | 'reglages'
type Vue = { type: 'onglet' } | { type: 'patient'; id: string } | { type: 'rappels' }
type Panneau =
  | { type: 'seance'; id: string }
  | { type: 'choix'; date: string; creneau: number }
  | { type: 'nouveau-patient' }
  | { type: 'rappels' }
  | { type: 'souffle' }
  | null

const ONGLETS: Array<{ cle: Onglet; libelle: string; Icone: typeof IconeJour }> = [
  { cle: 'accueil', libelle: 'Accueil', Icone: IconeJour },
  { cle: 'agenda', libelle: 'Agenda', Icone: IconeAgenda },
  { cle: 'patients', libelle: 'Patients', Icone: IconePatients },
  { cle: 'finances', libelle: 'Finances', Icone: IconeArgent },
  { cle: 'reglages', libelle: 'Réglages', Icone: IconeReglages },
]

const TITRES: Record<Exclude<Onglet, 'accueil'>, { surtitre: string; titre: string }> = {
  agenda: { surtitre: 'Planning de la semaine', titre: 'Agenda' },
  patients: { surtitre: 'Dossiers cliniques', titre: 'Patients' },
  finances: { surtitre: 'Honoraires & activité', titre: 'Finances' },
  reglages: { surtitre: 'Configuration du cabinet', titre: 'Réglages' },
}

function prochainJourTravaille(jours: number[]): string {
  let d = aujourdhui()
  for (let i = 0; i < 14; i++) {
    if (jours.includes(jourDeIso(d))) return d
    d = ajouterJours(d, 1)
  }
  return aujourdhui()
}

/** "mardi 8 septembre" -> "Mardi 8 septembre". */
function capitale(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function App() {
  const { patients, seances, reglages } = useDonnees()
  const [onglet, setOnglet] = useState<Onglet>('accueil')
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
    const notes = seances.filter((s) => s.date <= today && s.statut === 'effectue' && !s.note.trim())
    const impayes = seances.filter((s) => s.date <= today && estDue(s.statut) && !s.paye)
    return notes.length + impayes.length
  }, [seances, today])

  const jourARappeler = useMemo(
    () => prochainJourARappeler(seances, ajouterJours(today, 1)),
    [seances, today],
  )
  const rappelsRestants = useMemo(
    () => (jourARappeler ? rappelsEnAttente(seances, patients, reglages, jourARappeler) : 0),
    [seances, patients, reglages, jourARappeler],
  )
  const rappelsUrgents = rappelsRestants > 0 && heurePassee(reglages.heureRappelQuotidien)

  const ouvrirSeance = (id: string) => setPanneau({ type: 'seance', id })
  const creneauLibre = (date: string, creneau: number) => setPanneau({ type: 'choix', date, creneau })
  const ouvrirPatient = (id: string) => { setPanneau(null); setVue({ type: 'patient', id }) }
  const allerOnglet = (o: Onglet) => { setOnglet(o); setVue({ type: 'onglet' }) }

  /** Place un rendez-vous sur le premier créneau libre de la prochaine journée travaillée. */
  const nouveauRendezVous = () => {
    const date = prochainJourTravaille(reglages.joursTravail)
    const pris = new Set(seances.filter((s) => s.date === date).map((s) => s.creneau))
    const libre = reglages.creneaux.findIndex((_, i) => !pris.has(i))
    if (libre === -1) { allerOnglet('agenda'); return }
    creneauLibre(date, libre)
  }

  let fab: { libelle: string; action: () => void } | null = null
  if (vue.type === 'onglet') {
    if (onglet === 'accueil' || onglet === 'agenda') {
      fab = { libelle: 'Nouveau rendez-vous', action: nouveauRendezVous }
    } else if (onglet === 'patients') {
      fab = { libelle: 'Nouveau patient', action: () => setPanneau({ type: 'nouveau-patient' }) }
    }
  }

  const nomCabinet = reglages.nomCabinet.trim() || 'Cabinet de psychologie'
  const nomPraticienne = reglages.nomPraticienne.trim()
  const monogramme = nomPraticienne
    ? initiales(nomPraticienne.split(' ')[0] ?? '', nomPraticienne.split(' ').slice(1).join(' '))
    : 'MC'

  // En-tête de page : la carte d'accueil fait ce travail sur l'écran Accueil.
  const patientOuvert = vue.type === 'patient'
    ? patients.find((x) => x.id === vue.id)
    : undefined
  const enTete = vue.type === 'rappels'
    ? {
        surtitre: 'Messages aux patients',
        titre: 'Rappels',
        legende: 'Vous préparez, vous envoyez' as string | null,
        retour: () => setVue({ type: 'onglet' }),
      }
    : vue.type === 'patient'
    ? {
        surtitre: 'Dossier clinique',
        titre: nomAffiche(patientOuvert, reglages.masquerNoms),
        legende: patientOuvert?.motif || 'Suivi en cours',
        retour: () => setVue({ type: 'onglet' }),
      }
    : onglet === 'accueil'
      ? null
      : { ...TITRES[onglet], legende: null as string | null, retour: null }

  return (
    <div className="app">
      <header className="barre-haut">
        <div className="identite">
          <div className="avatar-cabinet">{monogramme}</div>
          <div className="identite-textes">
            <h1 className="identite-titre">{nomCabinet}</h1>
            <p className="identite-sous">
              {capitale(dateLongue(today))}
              {nomPraticienne ? ` · ${nomPraticienne}` : ''}
            </p>
          </div>
        </div>
        <div className="actions-haut">
          <button
            className={`bouton-rond${reglages.masquerNoms ? ' actif' : ''}`}
            aria-label={reglages.masquerNoms ? 'Afficher les noms' : 'Masquer les noms'}
            aria-pressed={reglages.masquerNoms}
            title="Mode discrétion (Ctrl+M)"
            onClick={basculerMasquage}
          >
            <IconeOeil barre={reglages.masquerNoms} />
          </button>
          <button
            className="bouton-rond"
            aria-label={`À traiter${nbRappels > 0 ? ` (${nbRappels})` : ''}`}
            onClick={() => setPanneau({ type: 'rappels' })}
          >
            <IconeCloche taille={21} />
            {nbRappels > 0 && <span className="point-alerte" />}
          </button>
        </div>
      </header>

      <main className="contenu" key={vue.type === 'onglet' ? onglet : vue.type === 'rappels' ? 'rappels' : `patient-${vue.id}`}>
        {enTete && (
          <div className="titre-page">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
              {enTete.retour && (
                <button className="rond-contour" aria-label="Retour" onClick={enTete.retour}>
                  <IconeRetour />
                </button>
              )}
              <div style={{ minWidth: 0 }}>
                <span className="surtitre">{enTete.surtitre}</span>
                <h2 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {enTete.titre}
                </h2>
                {enTete.legende && <p className="legende">{enTete.legende}</p>}
              </div>
            </div>
          </div>
        )}

        {vue.type === 'rappels' ? (
          <Rappels
            jourInitial={jourARappeler}
            onOuvrirPatient={(id) => setVue({ type: 'patient', id })}
          />
        ) : vue.type === 'patient' ? (
          <FichePatient
            patientId={vue.id}
            onOuvrirSeance={ouvrirSeance}
            onSupprime={() => setVue({ type: 'onglet' })}
          />
        ) : onglet === 'accueil' ? (
          <Jour
            onOuvrirSeance={ouvrirSeance}
            onCreneauLibre={creneauLibre}
            onVoirAgenda={() => allerOnglet('agenda')}
            onVoirRappels={() => setVue({ type: 'rappels' })}
            rappelsRestants={rappelsRestants}
            rappelsUrgents={rappelsUrgents}
            jourARappeler={jourARappeler}
            onSouffle={() => setPanneau({ type: 'souffle' })}
          />
        ) : onglet === 'agenda' ? (
          <Agenda onOuvrirSeance={ouvrirSeance} onCreneauLibre={creneauLibre} />
        ) : onglet === 'patients' ? (
          <Patients
            onOuvrirPatient={(id) => setVue({ type: 'patient', id })}
            onNouveauPatient={() => setPanneau({ type: 'nouveau-patient' })}
          />
        ) : onglet === 'finances' ? (
          <Argent onOuvrirSeance={ouvrirSeance} />
        ) : (
          <Reglages />
        )}
      </main>

      {fab && (
        <button className="fab" key={fab.libelle} onClick={fab.action}>
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
              <Icone taille={20} />
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
        <FeuilleRappels onFermer={() => setPanneau(null)} onOuvrirSeance={ouvrirSeance} />
      )}
      {panneau?.type === 'souffle' && (
        <FeuilleSouffle onFermer={() => setPanneau(null)} />
      )}
    </div>
  )
}
