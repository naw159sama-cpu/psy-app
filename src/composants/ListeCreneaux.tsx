import { useDonnees } from '../lib/store'
import { aujourdhui } from '../lib/dates'
import { LIBELLE_STATUT, couleurStatut, nomAffiche } from '../lib/affichage'
import { estDue } from '../lib/argent'
import { IconePlus } from './Icones'

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

/** Les créneaux fixes d'une journée, occupés ou libres. */
export default function ListeCreneaux({ date, onOuvrirSeance, onCreneauLibre }: Props) {
  const { seances, patients, reglages } = useDonnees()
  const duJour = seances.filter((s) => s.date === date)
  const today = aujourdhui()
  const now = new Date()
  const maintenant = now.getHours() * 60 + now.getMinutes()

  return (
    <div className="pile-creneaux">
      {reglages.creneaux.map((c, i) => {
        const enCours = date === today && maintenant >= minutes(c.debut) && maintenant < minutes(c.fin)
        const termine = date < today || (date === today && maintenant >= minutes(c.fin))
        const s = duJour.find((x) => x.creneau === i)

        if (!s) {
          return (
            <button
              key={i}
              className="creneau libre"
              onClick={() => onCreneauLibre(date, i)}
            >
              <span className="creneau-heure">
                {c.debut}
                <small>{c.fin}</small>
              </span>
              <span className="creneau-corps">
                <span className="creneau-info">Créneau libre</span>
              </span>
              <span className="creneau-fin"><IconePlus taille={18} /></span>
            </button>
          )
        }

        const p = patients.find((x) => x.id === s.patientId)
        const aNoter = termine && s.statut === 'effectue' && !s.note.trim()
        const aEncaisser = estDue(s.statut) && !s.paye

        const classes = ['creneau']
        if (enCours) classes.push('en-cours')
        else if (termine) classes.push('passee')

        return (
          <button key={i} className={classes.join(' ')} onClick={() => onOuvrirSeance(s.id)}>
            <span className="creneau-heure">
              {c.debut}
              <small>{c.fin}</small>
            </span>
            <span className="creneau-corps">
              <span className={`creneau-nom${reglages.masquerNoms ? ' flou' : ''}`}>
                {nomAffiche(p, false)}
              </span>
              <span className="creneau-info">
                {enCours ? 'Séance en cours' : aNoter ? 'Note à écrire' : (p?.motif || 'Séance')}
              </span>
            </span>
            <span className="creneau-fin">
              {s.statut !== 'effectue' && s.statut !== 'prevu' && (
                <span className={`puce ${couleurStatut(s.statut)}`}>{LIBELLE_STATUT[s.statut]}</span>
              )}
              {aEncaisser
                ? <span className="puce attente">À encaisser</span>
                : s.paye && <span className="puce ok">Payée</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
