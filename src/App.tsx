import { useEffect, useState } from 'react'
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
import {
  IconeAgenda, IconeArgent, IconeJour, IconeOeil, IconePatients, IconeReglages,
  IconeRetour, IconeStats,
} from './composants/Icones'
import { useDonnees, basculerMasquage } from './lib/store'
import { aujourdhui, dateLongue } from './lib/dates'
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
  | null

const ONGLETS: Array<{ cle: Onglet; libelle: string; Icone: typeof IconeJour }> = [
  { cle: 'jour', libelle: 'Ma journée', Icone: IconeJour },
  { cle: 'agenda', libelle: 'Agenda', Icone: IconeAgenda },
  { cle: 'patients', libelle: 'Patients', Icone: IconePatients },
  { cle: 'argent', libelle: 'Argent', Icone: IconeArgent },
  { cle: 'stats', libelle: 'Bilan', Icone: IconeStats },
]

export default function App() {
  const { patients, reglages } = useDonnees()
  const [onglet, setOnglet] = useState<Onglet>('jour')
  const [vue, setVue] = useState<Vue>({ type: 'onglet' })
  const [panneau, setPanneau] = useState<Panneau>(null)

  // Confort de lecture choisi dans les réglages.
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

  const ouvrirSeance = (id: string) => setPanneau({ type: 'seance', id })
  const creneauLibre = (date: string, creneau: number) => setPanneau({ type: 'choix', date, creneau })
  const ouvrirPatient = (id: string) => { setPanneau(null); setVue({ type: 'patient', id }) }
  const allerOnglet = (o: Onglet) => { setOnglet(o); setVue({ type: 'onglet' }) }

  let titre = ''
  let sous: string | null = null
  let retour: (() => void) | null = null

  if (vue.type === 'patient') {
    const p = patients.find((x) => x.id === vue.id)
    titre = nomAffiche(p, reglages.masquerNoms)
    sous = p?.motif || 'Dossier patient'
    retour = () => setVue({ type: 'onglet' })
  } else if (vue.type === 'reglages') {
    titre = 'Réglages'
    retour = () => setVue({ type: 'onglet' })
  } else {
    switch (onglet) {
      case 'jour':
        titre = 'Ma journée'
        sous = dateLongue(aujourdhui())
        break
      case 'agenda': titre = 'Agenda'; break
      case 'patients': titre = 'Patients'; break
      case 'argent': titre = 'Argent'; break
      case 'stats': titre = 'Bilan'; break
    }
  }

  return (
    <div className="app">
      <header className="entete">
        <div className="entete-ligne">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
            {retour && (
              <button className="fleche" aria-label="Retour" onClick={retour} style={{ flex: '0 0 auto' }}>
                <IconeRetour />
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <h1 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {titre}
              </h1>
              {sous && <p className="sous">{sous}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
            <button
              className="fleche"
              aria-label={reglages.masquerNoms ? 'Afficher les noms' : 'Masquer les noms'}
              aria-pressed={reglages.masquerNoms}
              title="Masquer les noms (Ctrl+M)"
              onClick={basculerMasquage}
              style={reglages.masquerNoms ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
            >
              <IconeOeil barre={reglages.masquerNoms} />
            </button>
            {vue.type !== 'reglages' && (
              <button
                className="fleche"
                aria-label="Réglages"
                onClick={() => setVue({ type: 'reglages' })}
              >
                <IconeReglages taille={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="contenu">
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
    </div>
  )
}
