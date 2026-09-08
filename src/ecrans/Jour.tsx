import { useMemo } from 'react'
import ListeCreneaux from '../composants/ListeCreneaux'
import { useDonnees, majSeance } from '../lib/store'
import {
  aujourdhui, ajouterJours, dateBreve, dateJourMois, dateLongue, jourDeIso, JOURS,
} from '../lib/dates'
import { estDue } from '../lib/argent'
import { nomAffiche } from '../lib/affichage'
import {
  Chevron, IconeAgenda, IconeCadenas, IconeCheckSimple, IconeCloche, IconeFeuille,
  IconeLecture, IconeSouffle,
} from '../composants/Icones'

interface Props {
  onOuvrirSeance: (seanceId: string) => void
  onCreneauLibre: (date: string, creneau: number) => void
  onVoirAgenda: () => void
  onVoirRappels: () => void
  /** Rappels du prochain jour de consultation encore à envoyer. */
  rappelsRestants: number
  /** L'heure de préparation est passée : la carte se met en avant. */
  rappelsUrgents: boolean
  /** Jour visé par ces rappels : le prochain qui porte des rendez-vous. */
  jourARappeler: string | null
  onSouffle: () => void
}

function prochainJourTravaille(jours: number[]): string {
  let d = aujourdhui()
  for (let i = 0; i < 14; i++) {
    if (jours.includes(jourDeIso(d))) return d
    d = ajouterJours(d, 1)
  }
  return aujourdhui()
}

/** Une phrase qui décrit la journée, sans jargon. */
function resume(nbSeances: number, nbNotes: number, estAujourdhui: boolean): string {
  const quand = estAujourdhui ? 'Une journée' : 'Votre prochaine journée'
  if (nbSeances === 0) {
    return `${quand} sans consultation : du temps pour les comptes rendus et pour souffler.`
  }
  const rythme = nbSeances >= 4 ? 'bien remplie' : nbSeances >= 2 ? 'équilibrée' : 'légère'
  const debut = `${quand} ${rythme} : ${nbSeances} consultation${nbSeances > 1 ? 's' : ''} prévue${nbSeances > 1 ? 's' : ''}`
  return nbNotes > 0
    ? `${debut}, et ${nbNotes} compte${nbNotes > 1 ? 's' : ''} rendu${nbNotes > 1 ? 's' : ''} qui attend${nbNotes > 1 ? 'ent' : ''}.`
    : `${debut}, et des temps de respiration entre chacune.`
}

export default function Jour({
  onOuvrirSeance, onCreneauLibre, onVoirAgenda, onVoirRappels,
  rappelsRestants, rappelsUrgents, jourARappeler, onSouffle,
}: Props) {
  const { seances, patients, reglages } = useDonnees()
  const today = aujourdhui()
  const date = useMemo(
    () => prochainJourTravaille(reglages.joursTravail),
    [reglages.joursTravail],
  )
  const estAujourdhui = date === today

  const duJour = seances.filter((s) => s.date === date)
  const notesEnRetard = seances
    .filter((s) => s.date <= today && s.statut === 'effectue' && !s.note.trim())
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  const impayes = seances
    .filter((s) => s.date <= today && estDue(s.statut) && !s.paye)
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  const prenom = (reglages.nomPraticienne.trim().split(' ')[0] || '').trim()
  const salutation = new Date().getHours() >= 18 ? 'Bonsoir' : 'Bonjour'

  // Les tâches du jour : d'abord les comptes rendus, puis les encaissements.
  const taches = [
    ...notesEnRetard.slice(0, 3).map((s) => ({
      id: s.id,
      texte: `Rédiger le compte-rendu de ${nomAffiche(patients.find((p) => p.id === s.patientId), false)}`,
      etiquette: s.date === today ? "Aujourd'hui" : dateBreve(s.date),
      urgente: s.date === today,
      masquable: true,
      action: 'ouvrir' as const,
    })),
    ...impayes.slice(0, 3).map((s) => ({
      id: s.id,
      texte: `Encaisser la séance de ${nomAffiche(patients.find((p) => p.id === s.patientId), false)}`,
      etiquette: s.date === today ? "Aujourd'hui" : dateBreve(s.date),
      urgente: s.date < today,
      masquable: true,
      action: 'encaisser' as const,
    })),
  ]
  const nbUrgentes = taches.filter((t) => t.urgente).length

  const traiter = (t: (typeof taches)[number]) => {
    if (t.action === 'encaisser') {
      majSeance(t.id, { paye: true, modePaiement: 'especes', datePaiement: today })
    } else {
      onOuvrirSeance(t.id)
    }
  }

  return (
    <>
      <section className="carte-accueil">
        <div className="accueil-haut">
          <div style={{ minWidth: 0 }}>
            <span className="accueil-surtitre">Synthèse clinique du jour</span>
            <h2 className="accueil-titre">
              {prenom ? (
                <>
                  {salutation},{' '}
                  <span className={`leger${reglages.masquerNoms ? ' flou' : ''}`}>{prenom}.</span>
                </>
              ) : (
                <>{salutation}.</>
              )}
            </h2>
            <p className="accueil-texte">
              {resume(duJour.length, notesEnRetard.length, estAujourdhui)}
            </p>
          </div>
          <span className="disque-accueil"><IconeFeuille taille={19} /></span>
        </div>

        <div className="bulles no-scroll">
          <span className="bulle verte">
            <span className="point" />
            {duJour.length} séance{duJour.length > 1 ? 's' : ''}
          </span>
          {notesEnRetard.length > 0 && (
            <span className="bulle rouge">
              <span className="point" />
              {notesEnRetard.length} note{notesEnRetard.length > 1 ? 's' : ''} à rédiger
            </span>
          )}
          {impayes.length > 0 && (
            <span className="bulle bleue">
              <span className="point" />
              {impayes.length} séance{impayes.length > 1 ? 's' : ''} à encaisser
            </span>
          )}
          {notesEnRetard.length === 0 && impayes.length === 0 && (
            <span className="bulle">
              <span className="point" style={{ background: 'var(--texte-doux)' }} />
              Rien en retard
            </span>
          )}
        </div>
      </section>

      {rappelsRestants > 0 && (
        <button className={`carte-rappel-entree${rappelsUrgents ? ' urgente' : ''}`} onClick={onVoirRappels}>
          <span className="disque grand"><IconeCloche taille={19} /></span>
          <span className="entree-corps">
            <span className="entree-titre">
              {rappelsRestants} rappel{rappelsRestants > 1 ? 's' : ''} à envoyer
              {jourARappeler === ajouterJours(today, 1)
                ? ' pour demain'
                : jourARappeler ? ` pour ${JOURS[jourDeIso(jourARappeler)]}` : ''}
            </span>
            <span className="entree-sous">
              {rappelsUrgents
                ? 'C’est le moment de les préparer'
                : `À préparer vers ${reglages.heureRappelQuotidien}`}
            </span>
          </span>
          <Chevron />
        </button>
      )}

      {!estAujourdhui && (
        <div className="note-contexte">
          <IconeAgenda taille={18} />
          <span>
            <strong>Vous ne travaillez pas aujourd’hui.</strong>
            Voici votre prochaine journée, {JOURS[jourDeIso(date)]} — {dateLongue(date)}.
          </span>
        </div>
      )}

      <section>
        <div className="entete-section">
          <h3>
            {estAujourdhui ? "Aujourd'hui" : 'Prochaine journée'}
            <span className="pastille-date">{dateJourMois(date)}</span>
          </h3>
          <button className="lien-section" onClick={onVoirAgenda}>
            Vue agenda
            <Chevron taille={15} />
          </button>
        </div>
        <ListeCreneaux date={date} onOuvrirSeance={onOuvrirSeance} onCreneauLibre={onCreneauLibre} />
      </section>

      {taches.length > 0 && (
        <section>
          <div className="entete-section">
            <h3>Tâches cliniques</h3>
            <span className="entete-note">
              {nbUrgentes > 0 ? `${nbUrgentes} urgente${nbUrgentes > 1 ? 's' : ''}` : 'rien d’urgent'}
            </span>
          </div>
          <div className="pile-taches">
            {taches.map((t) => (
              <div key={`${t.action}-${t.id}`} className="carte-tache">
                <span className="tache-gauche">
                  <button
                    className="case"
                    aria-label={t.action === 'encaisser' ? 'Marquer comme encaissée' : 'Ouvrir la séance'}
                    onClick={(e) => { e.stopPropagation(); traiter(t) }}
                  >
                    <IconeCheckSimple taille={13} />
                  </button>
                  <span
                    className={`tache-texte${reglages.masquerNoms && t.masquable ? ' flou' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOuvrirSeance(t.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') onOuvrirSeance(t.id) }}
                    style={{ cursor: 'pointer' }}
                  >
                    {t.texte}
                  </span>
                </span>
                <span className={`etiquette${t.urgente ? ' terre' : ''}`}>{t.etiquette}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="carte-souffle">
        <div className="souffle-gauche">
          <span className="disque-souffle"><IconeSouffle taille={19} /></span>
          <div style={{ minWidth: 0 }}>
            <h4>Sas de décompression</h4>
            <p>Respiration guidée · 3 min</p>
          </div>
        </div>
        <button className="btn-lecture" aria-label="Lancer la respiration guidée" onClick={onSouffle}>
          <IconeLecture taille={17} />
        </button>
      </section>

      {reglages.masquerNoms && (
        <div className="note-contexte terre">
          <IconeCadenas taille={17} />
          <span>
            <strong>Mode discrétion actif</strong>
            Les noms des patients sont floutés. Touchez l’œil en haut pour les réafficher.
          </span>
        </div>
      )}
    </>
  )
}
