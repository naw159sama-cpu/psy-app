import Feuille from './Feuille'
import { dureeTotale, EXERCICES, type Exercice } from '../lib/exercices'
import { IconeFeuille, IconeLecture, IconeSouffle } from './Icones'

interface Props {
  onFermer: () => void
  onChoisir: (id: string) => void
}

const GROUPES = [
  { cle: 'respirer' as const, titre: 'Respirer', sous: 'Le souffle guidé', Icone: IconeSouffle },
  { cle: 'se-poser' as const, titre: 'Se poser', sous: 'Étape par étape', Icone: IconeFeuille },
]

function minutes(e: Exercice): string {
  const m = Math.round(dureeTotale(e) / 60)
  return `${Math.max(1, m)} min`
}

/**
 * Mon espace : ce qui est là pour elle, et non pour ses patients. Chaque
 * exercice dit d'abord *quand* y venir — c'est ce qui décide du choix quand
 * on a trois minutes entre deux séances, pas la technique.
 */
export default function FeuilleEspace({ onFermer, onChoisir }: Props) {
  return (
    <Feuille
      titre="Mon espace"
      sous="Rien de clinique ici. Ces quelques minutes sont pour vous."
      onFermer={onFermer}
    >
      {GROUPES.map((g) => (
        <section key={g.cle}>
          <div className="entete-section">
            <h3>{g.titre}</h3>
            <span className="entete-note">{g.sous}</span>
          </div>
          <div className="pile">
            {EXERCICES.filter((e) => e.groupe === g.cle).map((e) => (
              <button
                key={e.id}
                className={`exo-carte ${e.famille}`}
                onClick={() => onChoisir(e.id)}
              >
                <span className="exo-disque"><g.Icone taille={18} /></span>
                <span className="exo-corps">
                  <span className="exo-titre">
                    {e.nom}
                    <span className="exo-duree">{minutes(e)}</span>
                  </span>
                  <span className="exo-sous">{e.sous}</span>
                  <span className="exo-quand">{e.quand}</span>
                </span>
                <span className="exo-lecture"><IconeLecture taille={15} /></span>
              </button>
            ))}
          </div>
        </section>
      ))}

      <p className="aide">
        Rien n’est enregistré : ces exercices ne laissent aucune trace dans
        l’application.
      </p>
    </Feuille>
  )
}
