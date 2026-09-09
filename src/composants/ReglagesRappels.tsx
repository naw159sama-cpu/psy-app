import { useMemo, useState } from 'react'
import { majReglages, useDonnees } from '../lib/store'
import {
  LONGUEUR_ALERTE, MODELES_DEFAUT, VARIABLES, rendreModele, variablesDe,
} from '../lib/rappels'
import { normaliserNumero } from '../lib/telephone'
import { aujourdhui, ajouterJours } from '../lib/dates'
import type { Modele, Patient, Seance } from '../lib/types'
import { IconeCrayon, IconeMicro } from './Icones'
import { dicteeDisponible } from '../lib/dictee'

/** Patient d'exemple, quand aucun dossier réel n'existe encore. */
const EXEMPLE: Patient = {
  id: 'exemple', prenom: 'Amina', nom: 'B.', telephone: '0551 23 45 67',
  dateNaissance: '1994-03-12', motif: '', adressePar: '', statut: 'actif',
  anamnese: '', objectifs: [], canalRappel: 'whatsapp', consentementLe: null,
  messageNeutreRenforce: false, representant: null, tarifPerso: null, creeLe: '',
}

export default function ReglagesRappels() {
  const { reglages, patients, seances } = useDonnees()
  const [enEdition, setEnEdition] = useState<string | null>(null)

  const numeroTest = normaliserNumero('0551 23 45 67', reglages.indicatifPays)

  // L'aperçu se fait sur un vrai rendez-vous quand il y en a un à venir.
  const { patientApercu, seanceApercu } = useMemo(() => {
    const prochaine = seances
      .filter((s) => s.date >= aujourdhui() && s.statut === 'prevu')
      .sort((a, b) => (a.date === b.date ? a.creneau - b.creneau : (a.date < b.date ? -1 : 1)))[0]
    const p = prochaine ? patients.find((x) => x.id === prochaine.patientId) : undefined
    const seanceFictive: Seance = {
      id: 'exemple', patientId: 'exemple', date: ajouterJours(aujourdhui(), 1), creneau: 0,
      statut: 'prevu', tarif: reglages.tarifDefaut, partPsyPct: reglages.partPsyPct,
      paye: false, modePaiement: null, datePaiement: null, description: '',
      etatObserve: '', note: '',
      aReprendre: '', noteMajLe: null, motifAnnulation: '', rappelEnvoyeLe: null,
      rappelModele: null, creeLe: '',
    }
    return {
      patientApercu: p ?? EXEMPLE,
      seanceApercu: prochaine ?? seanceFictive,
    }
  }, [seances, patients, reglages.tarifDefaut, reglages.partPsyPct])

  const valeurs = variablesDe(seanceApercu, patientApercu, reglages)

  const majModele = (id: string, champs: Partial<Modele>) => {
    majReglages({
      modelesRappel: reglages.modelesRappel.map((m) => (m.id === id ? { ...m, ...champs } : m)),
    })
  }

  const remettreDefaut = () => majReglages({ modelesRappel: MODELES_DEFAUT })

  return (
    <>
      <section>
        <div className="entete-section"><h3>Dictée vocale</h3></div>
        {dicteeDisponible() ? (
          <>
            <button
              className="rang rang-cliquable carte"
              onClick={() => majReglages({ dicteeActive: !reglages.dicteeActive })}
            >
              <span className="rang-lib">
                <span className="disque"><IconeMicro taille={15} /></span>
                <span className="exclusion-textes">
                  <span className="exclusion-nom">Bouton « Dicter » dans les champs</span>
                  <span className="exclusion-motif">Anamnèse, motif, comptes rendus</span>
                </span>
              </span>
              <span className={`interrupteur${reglages.dicteeActive ? ' actif' : ''}`} aria-hidden />
            </button>
            <p className="aide">
              Le navigateur transmet la voix à son service de transcription, chez Google
              ou Apple selon le téléphone. Pour une dictée qui ne sort pas de l’appareil,
              utilisez la touche micro du clavier plutôt que ce bouton.
            </p>
          </>
        ) : (
          <p className="aide">
            Ce navigateur ne sait pas dicter. La touche micro du clavier du téléphone
            fonctionne dans tous les champs.
          </p>
        )}
      </section>

      <section>
        <div className="entete-section"><h3>Rappels aux patients</h3></div>

        <div className="duo">
          <div className="champ">
            <label htmlFor="r-indicatif">Indicatif du pays</label>
            <input
              id="r-indicatif"
              inputMode="numeric"
              value={reglages.indicatifPays}
              placeholder="213"
              onChange={(e) => majReglages({ indicatifPays: e.target.value.replace(/\D/g, '') })}
            />
            <p className={`aide${numeroTest.valide ? ' apercu-numero' : ' erreur'}`}>
              {numeroTest.valide
                ? `0551 23 45 67 → ${numeroTest.international}`
                : numeroTest.probleme}
            </p>
          </div>
          <div className="champ">
            <label htmlFor="r-heure">Préparer les rappels à</label>
            <input
              id="r-heure"
              type="time"
              value={reglages.heureRappelQuotidien}
              onChange={(e) => majReglages({ heureRappelQuotidien: e.target.value })}
            />
            <p className="aide">La carte passe en avant sur l’accueil à partir de cette heure.</p>
          </div>
        </div>

        <div className="champ">
          <label htmlFor="r-signature">Signature des messages</label>
          <input
            id="r-signature"
            value={reglages.signatureRappel}
            placeholder="Votre prénom, ou rien du tout"
            onChange={(e) => majReglages({ signatureRappel: e.target.value })}
          />
          <p className="aide">
            Un prénom seul suffit. Évitez « Dr » et le nom du cabinet.
          </p>
        </div>

        <div className="champ">
          <label htmlFor="r-adresse">Adresse du cabinet</label>
          <input
            id="r-adresse"
            value={reglages.adresseCabinet}
            placeholder="12 rue des Oliviers, El Achour"
            onChange={(e) => majReglages({ adresseCabinet: e.target.value })}
          />
          <p className="aide">Insérée par {'{adresse}'}, pour les premières rencontres.</p>
        </div>

        <div className="champ">
          <label htmlFor="r-visio">Lien de visioconférence</label>
          <input
            id="r-visio"
            value={reglages.lienVisioParDefaut}
            placeholder="https://…"
            onChange={(e) => majReglages({ lienVisioParDefaut: e.target.value })}
          />
          <p className="aide">Votre salle permanente, insérée par {'{lien_visio}'}.</p>
        </div>
      </section>

      <section>
        <div className="entete-section">
          <h3>Modèles de message</h3>
          <button className="lien" onClick={remettreDefaut}>Rétablir les modèles d’origine</button>
        </div>

        <div className="note-contexte">
          <IconeCrayon taille={16} />
          <span>
            <strong>Aucun message ne doit trahir la nature du rendez-vous.</strong>
            Le téléphone peut être lu par un proche : ni « séance », ni « psychologue »,
            ni nom de cabinet.
          </span>
        </div>

        <div className="pile" style={{ marginTop: 12 }}>
          {reglages.modelesRappel.map((m) => {
            const rendu = rendreModele(m.corps, valeurs)
            const trop = rendu.length > LONGUEUR_ALERTE
            const ouvert = enEdition === m.id
            return (
              <div key={m.id} className="carte-modele">
                <div className="modele-haut">
                  <span className="modele-nom">{m.nom}</span>
                  <div className="modele-actions">
                    <button
                      className={`interrupteur${m.actif ? ' actif' : ''}`}
                      aria-label={m.actif ? 'Désactiver ce modèle' : 'Activer ce modèle'}
                      aria-pressed={m.actif}
                      onClick={() => majModele(m.id, { actif: !m.actif })}
                    />
                    <button
                      className="btn petit"
                      onClick={() => setEnEdition(ouvert ? null : m.id)}
                    >
                      {ouvert ? 'Terminer' : 'Modifier'}
                    </button>
                  </div>
                </div>

                {ouvert && (
                  <>
                    <div className="champ" style={{ marginBottom: 8 }}>
                      <textarea
                        rows={3}
                        value={m.corps}
                        onChange={(e) => majModele(m.id, { corps: e.target.value })}
                      />
                    </div>
                    <div className="suggestions">
                      {VARIABLES.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => majModele(m.id, { corps: `${m.corps}{${v}}` })}
                        >
                          {`{${v}}`}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <p className="modele-apercu">{rendu}</p>
                <p className={`modele-compte${trop ? ' trop' : ''}`}>
                  {rendu.length} caractères
                  {trop && ' — trop long, le lien risque d’être coupé'}
                </p>
              </div>
            )
          })}
        </div>
        <p className="aide">
          Aperçu calculé sur {patientApercu.id === 'exemple' ? 'un exemple' : 'votre prochain rendez-vous'}.
        </p>
      </section>
    </>
  )
}
