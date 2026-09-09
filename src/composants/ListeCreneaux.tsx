import { useDonnees } from '../lib/store'
import { aujourdhui } from '../lib/dates'
import { LIBELLE_STATUT, nomAffiche } from '../lib/affichage'
import { estDue } from '../lib/argent'
import type { StatutSeance } from '../lib/types'
import {
  IconeChrono, IconeExterne, IconeNoteEdit, IconePlus, IconePoints,
} from './Icones'

interface Props {
  date: string
  onOuvrirSeance: (seanceId: string) => void
  onCreneauLibre: (date: string, creneau: number) => void
}

/** "09:30" -> minutes depuis minuit. */
function minutes(heure: string): number {
  const [h, m] = heure.split(':').map(Number)
  return h * 60 + m
}

/** 90 -> "1h30", 50 -> "50m". */
function duree(debut: string, fin: string): string {
  const d = minutes(fin) - minutes(debut)
  if (d <= 0) return ''
  const h = Math.floor(d / 60)
  const m = d % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

/** Pastille d'état, dans le vocabulaire visuel du système. */
function classePuce(statut: StatutSeance): string {
  switch (statut) {
    case 'effectue': return 'faite'
    case 'prevu': return 'avenir'
    case 'absent': return 'alerte'
    case 'annule_hors_delai': return 'attente'
    case 'annule_delai': return 'gris'
  }
}

export default function ListeCreneaux({ date, onOuvrirSeance, onCreneauLibre }: Props) {
  const { seances, patients, reglages } = useDonnees()
  const duJour = seances.filter((s) => s.date === date)
  const today = aujourdhui()
  const now = new Date()
  const maintenant = now.getHours() * 60 + now.getMinutes()

  return (
    <div className="pile">
      {reglages.creneaux.map((c, i) => {
        const enCours = date === today && maintenant >= minutes(c.debut) && maintenant < minutes(c.fin)
        const termine = date < today || (date === today && maintenant >= minutes(c.fin))
        const s = duJour.find((x) => x.creneau === i)

        if (!s) {
          return (
            <button key={i} className="carte-seance libre" onClick={() => onCreneauLibre(date, i)}>
              <span className={`bloc-heure t${i % 4}`}>
                <span className="heure">{c.debut}</span>
                <span className="duree">{duree(c.debut, c.fin)}</span>
              </span>
              <span className="seance-corps">
                <span className="seance-sous">Créneau libre</span>
              </span>
              <span className="bouton-carre"><IconePlus taille={17} /></span>
            </button>
          )
        }

        const p = patients.find((x) => x.id === s.patientId)
        const nom = nomAffiche(p, false)
        const aNoter = termine && s.statut === 'effectue' && !s.note.trim()
        const aEncaisser = estDue(s.statut) && !s.paye

        // Séance en cours : la carte sombre, mise en avant.
        if (enCours) {
          const reste = minutes(c.fin) - maintenant
          return (
            <button key={i} className="carte-active" onClick={() => onOuvrirSeance(s.id)}>
              <span className="vague" />
              <span className="active-haut">
                <span className="active-gauche">
                  <span className="point-live">
                    <span className="onde" />
                    <span className="noyau" />
                  </span>
                  <span className="badge-live">En consultation</span>
                </span>
                <span className="active-horaire">{c.debut} – {c.fin}</span>
              </span>
              <h4 className={reglages.masquerNoms ? 'flou' : undefined}>{nom}</h4>
              <p className="active-sous">{p?.motif || 'Séance de suivi'}</p>
              <span className="active-pied">
                <span className="active-reste">
                  <IconeChrono taille={15} />
                  {reste > 0 ? `${reste} min restantes` : 'séance terminée'}
                </span>
                <span className="btn-clair">
                  Dossier clinique
                  <IconeExterne taille={13} />
                </span>
              </span>
            </button>
          )
        }

        return (
          <button
            key={i}
            className={`carte-seance${termine ? ' passee' : ''}`}
            onClick={() => onOuvrirSeance(s.id)}
          >
            <span className={`bloc-heure t${i % 4}`}>
              <span className="heure">{c.debut}</span>
              <span className="duree">{duree(c.debut, c.fin)}</span>
            </span>
            <span className="seance-corps">
              <span className="seance-titre">
                <span className={`seance-nom${reglages.masquerNoms ? ' flou' : ''}`}>{nom}</span>
                {/* Une seule pastille par carte : le statut porte déjà l'information
                    quand la séance est une absence ou une annulation. */}
                {s.statut === 'effectue' && aEncaisser
                  ? <span className="puce attente">À encaisser</span>
                  : <span className={`puce ${classePuce(s.statut)}`}>{LIBELLE_STATUT[s.statut]}</span>}
              </span>
              <span className="seance-sous">
                {aNoter ? 'Compte-rendu à rédiger' : (p?.motif || 'Séance de suivi')}
              </span>
            </span>
            <span className="bouton-carre">
              {aNoter ? <IconeNoteEdit taille={17} /> : <IconePoints taille={17} />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
