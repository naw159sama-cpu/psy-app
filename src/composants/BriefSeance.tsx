import { useDonnees, basculerObjectif } from '../lib/store'
import { briefSeance, depuis, rangSeance } from '../lib/suivi'
import { dateBreve } from '../lib/dates'
import type { Seance } from '../lib/types'
import {
  IconeAttente, IconeCheckSimple, IconeCible, IconeReprise,
} from './Icones'

interface Props {
  seance: Seance
}

/**
 * Ce qu'il faut avoir en tête avant de faire entrer la personne.
 * Se lit en trente secondes, dans l'ordre de ce qui compte le plus.
 */
export default function BriefSeance({ seance }: Props) {
  const { seances, patients } = useDonnees()
  const p = patients.find((x) => x.id === seance.patientId)
  const b = briefSeance(seance, seances, p)

  return (
    <section className="brief">
      <div className="brief-haut">
        <span className="brief-titre">
          <IconeReprise taille={15} />
          Reprise du suivi
        </span>
        <span className="brief-compteur">
          {rangSeance(b.rang)}
          <small>· {depuis(b.ecartJours)}</small>
        </span>
      </div>

      {b.alertes.length > 0 && (
        <div className="brief-alertes">
          {b.alertes.map((a) => (
            <span key={a.cle} className={`brief-alerte ${a.ton}`}>
              <IconeAttente taille={15} />
              {a.texte}
            </span>
          ))}
        </div>
      )}

      {b.premiereSeance ? (
        <div className="brief-vide">
          <span className="disque"><IconeCible /></span>
          Première rencontre : rien à reprendre, tout à découvrir.
        </div>
      ) : (
        <>
          {b.aReprendre && (
            <div className="brief-bloc brief-reprise">
              <span className="brief-etiquette">À reprendre aujourd’hui</span>
              <p className="brief-texte">{b.aReprendre}</p>
            </div>
          )}

          {b.derniere && (b.resume || b.etatPrecedent) && (
            <div className="brief-bloc">
              <span className="brief-etiquette">
                Séance du {dateBreve(b.derniere.date)}
              </span>
              {b.etatPrecedent && <p className="brief-texte">{b.etatPrecedent}.</p>}
              {b.resume && <p className="brief-texte citation">{b.resume}</p>}
            </div>
          )}

          {!b.aReprendre && !b.resume && !b.etatPrecedent && (
            <div className="brief-vide">
              <span className="disque"><IconeReprise taille={15} /></span>
              Aucun compte rendu sur les séances précédentes.
            </div>
          )}
        </>
      )}

      {b.objectifsEnCours.length > 0 && (
        <div className="brief-bloc">
          <span className="brief-etiquette">
            Objectifs en cours
            {b.nbObjectifsAtteints > 0 && ` · ${b.nbObjectifsAtteints} atteint${b.nbObjectifsAtteints > 1 ? 's' : ''}`}
          </span>
          <div className="brief-objectifs">
            {b.objectifsEnCours.map((o) => (
              <button
                key={o.id}
                className="brief-objectif"
                onClick={() => p && basculerObjectif(p.id, o.id)}
              >
                <span className="coche"><IconeCheckSimple taille={11} /></span>
                <span className="texte-objectif">{o.texte}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
