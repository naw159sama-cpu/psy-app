import { useState } from 'react'
import { connecter, envoyerReinitialisation, ErreurCoffre, type Session } from '../lib/nuage'
import { IconeCadenas } from './Icones'

interface Props {
  onConnectee: (s: Session) => void
  /** Message laissé par la session précédente, s'il y en a un. */
  avis?: string
}

/**
 * La porte d'entrée. Elle ne s'affiche que si un coffre en ligne est
 * configuré : sans coffre, l'application s'ouvre directement, comme avant.
 */
export default function Connexion({ onConnectee, avis }: Props) {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [occupe, setOccupe] = useState(false)
  const [oubli, setOubli] = useState(false)

  const valide = email.trim().length > 3 && motDePasse.length > 0

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valide || occupe) return
    setOccupe(true)
    setErreur('')
    setMessage('')
    try {
      onConnectee(await connecter(email, motDePasse))
    } catch (x) {
      setErreur(x instanceof ErreurCoffre ? x.message : 'Connexion impossible.')
    } finally {
      setOccupe(false)
    }
  }

  const reinitialiser = async () => {
    if (email.trim().length < 4) { setErreur('Écrivez d’abord votre adresse.'); return }
    setOccupe(true)
    setErreur('')
    try {
      await envoyerReinitialisation(email)
      // On ne dit jamais si l'adresse existe : ce serait renseigner un curieux.
      setMessage('Si cette adresse a un compte, un lien vient de lui être envoyé.')
      setOubli(false)
    } catch (x) {
      setErreur(x instanceof ErreurCoffre ? x.message : 'Envoi impossible.')
    } finally {
      setOccupe(false)
    }
  }

  return (
    <div className="porte">
      <div className="porte-carte">
        <span className="porte-sceau"><IconeCadenas taille={22} /></span>
        <h1>Cabinet de psychologie</h1>
        <p className="porte-sous">
          Les dossiers sont gardés en ligne, dans un coffre qui n’est ouvert que
          par ce compte.
        </p>

        {avis && <p className="porte-avis">{avis}</p>}

        <form onSubmit={soumettre}>
          <div className="champ">
            <label htmlFor="c-email">Adresse e-mail</label>
            <input
              id="c-email"
              type="email"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {!oubli && (
            <div className="champ">
              <label htmlFor="c-mdp">Mot de passe</label>
              <input
                id="c-mdp"
                type="password"
                autoComplete="current-password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
              />
            </div>
          )}

          {erreur && <p className="porte-erreur">{erreur}</p>}
          {message && <p className="porte-message">{message}</p>}

          {oubli ? (
            <>
              <button
                type="button"
                className="btn principal bloc"
                disabled={occupe}
                onClick={reinitialiser}
              >
                {occupe ? 'Envoi…' : 'Envoyer le lien'}
              </button>
              <button type="button" className="lien-porte" onClick={() => setOubli(false)}>
                Revenir à la connexion
              </button>
            </>
          ) : (
            <>
              <button type="submit" className="btn principal bloc" disabled={!valide || occupe}>
                {occupe ? 'Connexion…' : 'Ouvrir le cabinet'}
              </button>
              <button type="button" className="lien-porte" onClick={() => setOubli(true)}>
                Mot de passe oublié
              </button>
            </>
          )}
        </form>
      </div>

      <p className="porte-pied">
        Une fois connectée, l’application fonctionne sans réseau et se remet à
        jour toute seule en revenant.
      </p>
    </div>
  )
}
