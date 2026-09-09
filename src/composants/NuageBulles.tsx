import { useMemo } from 'react'
import { disposerBulles, type Bulle } from '../lib/themes'

interface Props {
  bulles: Bulle[]
  /** Clé du thème mis en avant, ou null. */
  choisi: string | null
  onChoisir: (cle: string) => void
}

/** Repère de dessin. Le SVG s'étire ensuite à la largeur du téléphone. */
const LARGEUR = 360
const HAUTEUR = 300
/** Au-delà, les bulles deviennent illisibles : la légende prend le relais. */
const MAX_BULLES = 14

/**
 * Coupe un nom en deux lignes au plus, à la largeur disponible dans le disque.
 * Il n'y a pas de mesure de texte en SVG : on estime à partir de la taille de
 * police, ce qui suffit pour décider entre une et deux lignes.
 */
function couper(nom: string, largeurMax: number, taille: number): string[] {
  const parCaractere = taille * 0.54
  const max = Math.max(4, Math.floor(largeurMax / parCaractere))
  const lignes: string[] = []
  let courante = ''
  for (const mot of nom.split(' ')) {
    const essai = courante ? `${courante} ${mot}` : mot
    if (essai.length <= max) { courante = essai; continue }
    if (courante) lignes.push(courante)
    courante = mot
    if (lignes.length === 2) break
  }
  if (courante && lignes.length < 2) lignes.push(courante)
  return lignes.slice(0, 2).map((l) => (l.length > max ? `${l.slice(0, max - 1)}…` : l))
}

/**
 * Le nuage de thèmes : un disque par motif de consultation, dont la surface
 * dit combien de personnes il regroupe. Dix personnes stressées font un disque
 * quatre fois plus large que deux personnes anxieuses — l'œil compare des
 * surfaces, et la comparaison est juste.
 *
 * Toucher un disque met son thème en avant ; la légende dessous dit la même
 * chose en chiffres, pour ce que le dessin ne peut pas montrer.
 */
export default function NuageBulles({ bulles, choisi, onChoisir }: Props) {
  const dessinees = bulles.slice(0, MAX_BULLES)

  const disques = useMemo(
    () => disposerBulles(dessinees.map((b) => b.nb), LARGEUR, HAUTEUR),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dessinees.map((b) => `${b.cle}:${b.nb}`).join('|')],
  )

  const total = bulles.reduce((t, b) => t + b.nb, 0)
  const maximum = Math.max(1, ...bulles.map((b) => b.nb))

  return (
    <div className="nuage">
      <svg
        className="nuage-toile"
        viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
        role="group"
        aria-label="Thèmes de consultation, par nombre de personnes"
      >
        {dessinees.map((b, i) => {
          const d = disques[i]
          if (!d) return null
          const tailleNombre = Math.max(11, Math.min(34, d.r * 0.58))
          const tailleNom = Math.max(8, Math.min(12.5, d.r * 0.25))
          const avecNom = d.r >= 32
          const lignes = avecNom ? couper(b.nom, d.r * 1.7, tailleNom) : []
          const estompee = choisi !== null && choisi !== b.cle

          return (
            <g
              key={b.cle}
              className={`nuage-bulle tb${b.teinte}${b.absent ? ' absente' : ''}` +
                `${choisi === b.cle ? ' choisie' : ''}${estompee ? ' effacee' : ''}`}
              style={{ animationDelay: `${i * 0.055}s` }}
              role="button"
              tabIndex={0}
              aria-pressed={choisi === b.cle}
              aria-label={`${b.nom} : ${b.nb} personne${b.nb > 1 ? 's' : ''}`}
              onClick={() => onChoisir(b.cle)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChoisir(b.cle) }
              }}
            >
              <g
                className="nuage-flotte"
                style={{
                  animationDelay: `${(i % 5) * 0.7}s`,
                  animationDuration: `${5.5 + (i % 4) * 0.9}s`,
                }}
              >
                <circle className="nuage-disque" cx={d.x} cy={d.y} r={d.r} />
                <circle
                  className="nuage-reflet"
                  cx={d.x - d.r * 0.3} cy={d.y - d.r * 0.34} r={d.r * 0.42}
                />
                {d.r >= 15 && (
                  <text
                    className="nuage-nombre"
                    x={d.x}
                    y={avecNom ? d.y - d.r * 0.06 : d.y}
                    fontSize={tailleNombre}
                  >
                    {b.nb}
                  </text>
                )}
                {lignes.map((l, j) => (
                  <text
                    key={j}
                    className="nuage-nom"
                    x={d.x}
                    y={d.y + d.r * 0.34 + j * tailleNom * 1.15}
                    fontSize={tailleNom}
                  >
                    {l}
                  </text>
                ))}
              </g>
            </g>
          )
        })}
      </svg>

      <ul className="nuage-legende">
        {bulles.map((b) => (
          <li key={b.cle}>
            <button
              className={`legende-ligne tb${b.teinte}${choisi === b.cle ? ' choisie' : ''}`}
              aria-pressed={choisi === b.cle}
              onClick={() => onChoisir(b.cle)}
            >
              <span className="legende-pastille" />
              <span className="legende-nom">{b.nom}</span>
              <span className="legende-jauge">
                <span style={{ width: `${(b.nb / maximum) * 100}%` }} />
              </span>
              <span className="legende-nb">{b.nb}</span>
            </button>
          </li>
        ))}
      </ul>

      {bulles.length > MAX_BULLES && (
        <p className="aide">
          Les {MAX_BULLES} thèmes les plus fréquents sont dessinés ; la liste les donne tous.
        </p>
      )}
      <p className="aide">
        {total} rattachement{total > 1 ? 's' : ''} au total — une même personne peut compter
        dans plusieurs thèmes.
      </p>
    </div>
  )
}
