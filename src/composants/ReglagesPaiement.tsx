import { useState } from 'react'
import { MOYENS_PAIEMENT_DEFAUT, majReglages, useDonnees, id as nouvelId } from '../lib/store'
import type { MoyenPaiement } from '../lib/types'
import { IconePlus, IconePortefeuille } from './Icones'

/**
 * Les comptes sur lesquels elle est réglée. Chaque cabinet a les siens —
 * CCP, telle banque — d'où une liste qu'elle nomme elle-même.
 */
export default function ReglagesPaiement() {
  const { reglages, seances } = useDonnees()
  const [nouveau, setNouveau] = useState('')

  const maj = (idMoyen: string, champs: Partial<MoyenPaiement>) => {
    majReglages({
      modesPaiement: reglages.modesPaiement.map((m) => (m.id === idMoyen ? { ...m, ...champs } : m)),
    })
  }

  const ajouter = () => {
    const nom = nouveau.trim()
    if (!nom) return
    majReglages({
      modesPaiement: [...reglages.modesPaiement, { id: nouvelId(), nom, actif: true }],
    })
    setNouveau('')
  }

  /** Un moyen déjà employé ne s'efface pas : l'historique deviendrait faux. */
  const employe = (idMoyen: string) => seances.some((s) => s.modePaiement === idMoyen)

  const supprimer = (idMoyen: string) => {
    majReglages({ modesPaiement: reglages.modesPaiement.filter((m) => m.id !== idMoyen) })
  }

  return (
    <section>
      <div className="entete-section">
        <h3>Moyens de paiement</h3>
        <button className="lien" onClick={() => majReglages({ modesPaiement: MOYENS_PAIEMENT_DEFAUT })}>
          Rétablir la liste d’origine
        </button>
      </div>

      <div className="pile" style={{ marginBottom: 12 }}>
        {reglages.modesPaiement.map((m) => (
          <div className="ligne-moyen" key={m.id}>
            <span className="disque"><IconePortefeuille /></span>
            <input
              className="moyen-nom"
              value={m.nom}
              aria-label={`Nom du moyen de paiement ${m.nom}`}
              onChange={(e) => maj(m.id, { nom: e.target.value })}
            />
            <button
              className={`interrupteur${m.actif ? ' actif' : ''}`}
              aria-label={m.actif ? `Masquer ${m.nom}` : `Proposer ${m.nom}`}
              aria-pressed={m.actif}
              onClick={() => maj(m.id, { actif: !m.actif })}
            />
            {!employe(m.id) && (
              <button
                className="btn petit danger"
                aria-label={`Retirer ${m.nom}`}
                onClick={() => supprimer(m.id)}
              >
                −
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="ajout-moyen">
        <input
          value={nouveau}
          placeholder="Société Générale, BNA, Baridimob…"
          aria-label="Nouveau moyen de paiement"
          onChange={(e) => setNouveau(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') ajouter() }}
        />
        <button className="btn principal" disabled={!nouveau.trim()} onClick={ajouter}>
          <IconePlus taille={17} />
          Ajouter
        </button>
      </div>

      <p className="aide">
        L’interrupteur décide de ce qui est proposé à l’encaissement. Un moyen déjà
        employé ne peut pas être supprimé : l’historique resterait sans nom.
      </p>
    </section>
  )
}
