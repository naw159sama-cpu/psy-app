import { useDonnees } from '../lib/store'
import { JOURS, MOIS, dateDeIso, jourDeIso } from '../lib/dates'
import { couleurStatut, nomAffiche } from '../lib/affichage'
import { Chevron } from './Icones'

interface Props {
  date: string
  estAujourdhui: boolean
  onOuvrir: (date: string) => void
}

/**
 * Une journée de la semaine, résumée en une carte qui s'ouvre au toucher.
 * La semaine sert à voir, la fenêtre du jour sert à agir : c'est la même
 * logique que la grille du mois.
 */
export default function CarteJourSemaine({ date, estAujourdhui, onOuvrir }: Props) {
  const { seances, patients, reglages } = useDonnees()

  const duJour = seances
    .filter((s) => s.date === date)
    .sort((a, b) => a.creneau - b.creneau)
  const capacite = reglages.creneaux.length
  const libres = capacite - duJour.length
  const taux = capacite > 0 ? Math.min(1, duJour.length / capacite) : 0
  const d = dateDeIso(date)

  return (
    <button
      className={`jour-semaine${estAujourdhui ? ' actuel' : ''}`}
      onClick={() => onOuvrir(date)}
      aria-label={`${JOURS[jourDeIso(date)]} ${d.getDate()} — ${duJour.length} rendez-vous`}
    >
      <div className="js-entete">
        <span className="js-jour">
          {JOURS[jourDeIso(date)]}
          <small>{d.getDate()} {MOIS[d.getMonth()]}</small>
        </span>
        <span className="js-droite">
          {estAujourdhui && <span className="pastille-date">aujourd’hui</span>}
          <span className="js-compte">{duJour.length}/{capacite}</span>
          <Chevron taille={15} />
        </span>
      </div>

      {duJour.length === 0 ? (
        <p className="js-vide">Journée libre</p>
      ) : (
        <ul className="js-liste">
          {duJour.map((s) => {
            const p = patients.find((x) => x.id === s.patientId)
            const manquee = s.statut === 'absent' || s.statut.startsWith('annule')
            return (
              <li key={s.id} className={`js-rdv t${s.creneau % 4}${manquee ? ' manquee' : ''}${s.modePresence === 'visio' ? ' visio' : ''}`}>
                <span className="js-heure">{reglages.creneaux[s.creneau]?.debut ?? ''}</span>
                <span className={`js-nom${reglages.masquerNoms ? ' flou' : ''}`}>
                  {nomAffiche(p, false)}
                </span>
                <span className="js-motif">
                  {s.description.trim() || p?.motif || ''}
                </span>
                {manquee && (
                  <span className={`puce ${couleurStatut(s.statut)}`}>
                    {s.statut === 'absent' ? 'Absence' : 'Annulée'}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className="js-pied">
        <span className="js-densite">
          <span className={taux >= 1 ? 'pleine' : undefined} style={{ width: `${taux * 100}%` }} />
        </span>
        <span className="js-libres">
          {libres === 0 ? 'complet' : `${libres} libre${libres > 1 ? 's' : ''}`}
        </span>
      </div>
    </button>
  )
}
