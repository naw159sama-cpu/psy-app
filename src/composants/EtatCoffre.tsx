import { forcerEnvoi, libelleEtat, tonEtat, useSynchro } from '../lib/synchro'
import { IconeCheckSimple, IconeCoffre, IconeCroix, IconeSablier } from './Icones'

/**
 * Le témoin du coffre, dans la barre du haut. Trois états seulement, lisibles
 * d'un coup d'œil : enregistré, en cours, ou quelque chose ne va pas. Il n'y a
 * jamais rien à faire — mais il faut pouvoir vérifier.
 */
export default function EtatCoffre({ onDetail }: { onDetail: () => void }) {
  const e = useSynchro()
  if (e.phase === 'local') return null

  const ton = tonEtat(e)
  const Icone = ton === 'ok' ? IconeCheckSimple : ton === 'alerte' ? IconeCroix : IconeSablier

  return (
    <button
      className={`temoin-coffre ${ton}`}
      onClick={onDetail}
      aria-label={`Coffre : ${libelleEtat(e)}`}
      title={libelleEtat(e)}
    >
      <Icone taille={12} />
      <span className="temoin-texte">{libelleEtat(e)}</span>
    </button>
  )
}

/** Le détail, quand elle touche le témoin. */
export function DetailCoffre({ email }: { email: string }) {
  const e = useSynchro()

  const quand = e.dernierEnvoi
    ? new Date(e.dernierEnvoi).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div className="carte">
      <div className="rang">
        <span className="rang-lib">
          <span className="disque"><IconeCoffre taille={16} /></span> État
        </span>
        <span className={`puce ${tonEtat(e) === 'ok' ? 'ok' : tonEtat(e) === 'alerte' ? 'alerte' : 'attente'}`}>
          {libelleEtat(e)}
        </span>
      </div>
      <div className="rang">
        <span className="rang-lib doux">Compte</span>
        <span className="rang-val">{email || '—'}</span>
      </div>
      <div className="rang">
        <span className="rang-lib doux">Dernier enregistrement</span>
        <span className="rang-val">{quand ?? 'Jamais'}</span>
      </div>

      {e.message && <p className="aide">{e.message}</p>}

      {e.enAttente && (
        <p className="aide">
          Des modifications attendent d’être enregistrées en ligne. Elles sont
          gardées sur le téléphone en attendant : rien n’est perdu.
        </p>
      )}

      {(e.enAttente || e.phase === 'erreur') && (
        <button className="btn bloc" style={{ marginTop: 10 }} onClick={forcerEnvoi}>
          Enregistrer maintenant
        </button>
      )}
    </div>
  )
}
