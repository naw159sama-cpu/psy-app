import { useState } from 'react'
import Feuille from './Feuille'
import { DetailCoffre } from './EtatCoffre'
import { changerMotDePasse, deconnecter, ErreurCoffre } from '../lib/nuage'
import { arreter } from '../lib/synchro'

interface Props {
  email: string
  onFermer: () => void
  onDeconnectee: () => void
}

/**
 * Mon compte : l'état du coffre, le mot de passe, et la sortie. Rien d'autre —
 * tout ce qui touche aux dossiers eux-mêmes est ailleurs.
 */
export default function FeuilleCompte({ email, onFermer, onDeconnectee }: Props) {
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState(false)
  const [confirmeSortie, setConfirmeSortie] = useState(false)

  const changeable = nouveau.length >= 8 && nouveau === confirmation

  const changer = async () => {
    if (!changeable || occupe) return
    setOccupe(true)
    setErreur('')
    setMessage('')
    try {
      await changerMotDePasse(nouveau)
      setNouveau('')
      setConfirmation('')
      setMessage('Mot de passe changé.')
    } catch (e) {
      setErreur(e instanceof ErreurCoffre ? e.message : 'Changement impossible.')
    } finally {
      setOccupe(false)
    }
  }

  const sortir = async () => {
    setOccupe(true)
    arreter()
    await deconnecter()
    onDeconnectee()
  }

  return (
    <Feuille titre="Mon compte" sous={email} onFermer={onFermer}>
      <section>
        <div className="entete-section"><h3>Le coffre</h3></div>
        <DetailCoffre email={email} />
      </section>

      <section>
        <div className="entete-section"><h3>Mot de passe</h3></div>
        <div className="champ">
          <label htmlFor="mc-nouveau">Nouveau mot de passe</label>
          <input
            id="mc-nouveau"
            type="password"
            autoComplete="new-password"
            value={nouveau}
            onChange={(e) => setNouveau(e.target.value)}
          />
          <p className="aide">Huit caractères au moins. Choisissez-en un que vous n’utilisez nulle part ailleurs.</p>
        </div>
        <div className="champ">
          <label htmlFor="mc-confirme">Répétez-le</label>
          <input
            id="mc-confirme"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
          {confirmation.length > 0 && nouveau !== confirmation && (
            <p className="aide erreur">Les deux ne sont pas identiques.</p>
          )}
        </div>
        {erreur && <p className="aide erreur">{erreur}</p>}
        {message && <p className="aide">{message}</p>}
        <button className="btn principal bloc" disabled={!changeable || occupe} onClick={changer}>
          {occupe ? 'Enregistrement…' : 'Changer le mot de passe'}
        </button>
      </section>

      <section>
        <div className="entete-section"><h3>Quitter</h3></div>
        {confirmeSortie ? (
          <>
            <p className="aide">
              Assurez-vous que le témoin du coffre indique « Enregistré » avant
              de sortir : ce qui n’est pas encore parti resterait sur ce téléphone.
            </p>
            <div className="btn-rang">
              <button className="btn" onClick={() => setConfirmeSortie(false)}>Annuler</button>
              <button className="btn danger" disabled={occupe} onClick={sortir}>
                Se déconnecter
              </button>
            </div>
          </>
        ) : (
          <button className="btn bloc" onClick={() => setConfirmeSortie(true)}>
            Se déconnecter
          </button>
        )}
      </section>
    </Feuille>
  )
}
