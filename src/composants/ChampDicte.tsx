import { useEffect, useRef, useState } from 'react'
import { majReglages, useDonnees } from '../lib/store'
import {
  demarrerDictee, dicteeDisponible, fusionner, type SessionDictee,
} from '../lib/dictee'
import { IconeMicro } from './Icones'

interface Props {
  id: string
  label: string
  valeur: string
  onChange: (v: string) => void
  placeholder?: string
  /** Zone de texte plutôt qu'une simple ligne. */
  lignes?: number
  aide?: string
  autoFocus?: boolean
}

/**
 * Un champ de texte clinique, avec la dictée à côté du libellé.
 * Le bouton n'apparaît que si le navigateur sait dicter.
 */
export default function ChampDicte({
  id, label, valeur, onChange, placeholder, lignes, aide, autoFocus,
}: Props) {
  const { reglages } = useDonnees()
  const [session, setSession] = useState<SessionDictee | null>(null)
  const [provisoire, setProvisoire] = useState('')
  const [erreur, setErreur] = useState('')
  const [avertir, setAvertir] = useState(false)
  const valeurRef = useRef(valeur)
  valeurRef.current = valeur

  const possible = dicteeDisponible() && reglages.dicteeActive

  // Ne jamais laisser le micro ouvert quand le champ disparaît.
  useEffect(() => () => session?.arreter(), [session])

  const arreter = () => {
    session?.arreter()
    setSession(null)
    setProvisoire('')
  }

  const demarrer = () => {
    setErreur('')
    // Le micro s'ouvre dans le geste de l'utilisatrice : pas d'attente avant.
    const s = demarrerDictee({
      surTexte: (morceau) => {
        onChange(fusionner(valeurRef.current, morceau))
        setProvisoire('')
      },
      surProvisoire: setProvisoire,
      surErreur: (m) => { setErreur(m); setProvisoire('') },
      surFin: () => { setSession(null); setProvisoire('') },
    })
    if (!s) { setErreur('La dictée n’a pas pu démarrer.'); return }
    setSession(s)
  }

  const basculer = () => {
    if (session) { arreter(); return }
    if (!reglages.avertissementDicteeVu) { setAvertir(true); return }
    demarrer()
  }

  const accepter = () => {
    majReglages({ avertissementDicteeVu: true })
    setAvertir(false)
    demarrer()
  }

  const champ = lignes
    ? (
        <textarea
          id={id}
          rows={lignes}
          value={valeur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    : (
        <input
          id={id}
          value={valeur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
        />
      )

  return (
    <div className="champ champ-dicte">
      <div className="champ-entete">
        <label htmlFor={id}>{label}</label>
        {possible && (
          <button
            type="button"
            className={`micro${session ? ' ecoute' : ''}`}
            aria-pressed={!!session}
            aria-label={session ? 'Arrêter la dictée' : 'Dicter'}
            onClick={basculer}
          >
            <IconeMicro taille={15} />
            {session ? 'J’écoute' : 'Dicter'}
          </button>
        )}
      </div>

      {champ}

      {provisoire && <p className="dictee-provisoire">{provisoire}…</p>}
      {erreur && <p className="aide erreur">{erreur}</p>}
      {aide && !erreur && <p className="aide">{aide}</p>}

      {avertir && (
        <div className="dictee-avis">
          <p>
            <strong>La voix sort du téléphone.</strong> Le navigateur envoie
            l’enregistrement à son service de transcription — Google sur Chrome,
            Apple sur Safari. Le texte revient ici et n’en repart plus, mais la
            voix, elle, a été transmise.
          </p>
          <p>
            Pour une dictée qui ne sort pas de l’appareil, utilisez plutôt la
            touche micro du clavier de votre téléphone, dans ce même champ.
          </p>
          <div className="btn-rang">
            <button className="btn petit" onClick={() => setAvertir(false)}>Annuler</button>
            <button className="btn petit principal" onClick={accepter}>J’ai compris, dicter</button>
          </div>
        </div>
      )}
    </div>
  )
}
