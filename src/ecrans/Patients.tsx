import { useMemo, useState } from 'react'
import { useDonnees } from '../lib/store'
import { initiales, normaliser } from '../lib/format'
import { LIBELLE_STATUT_PATIENT, nomAffiche } from '../lib/affichage'
import { cleTheme, compterThemes, THEME_ABSENT, themesDuPatient } from '../lib/themes'
import NuageBulles from '../composants/NuageBulles'
import { Chevron, IconeCroix, IconePatients, IconeStats } from '../composants/Icones'
import type { StatutPatient } from '../lib/types'

interface Props {
  onOuvrirPatient: (id: string) => void
  onNouveauPatient: () => void
  /** Vue courante. Tenue par l'application : le bouton flottant s'efface sur l'aperçu. */
  vue: 'liste' | 'apercu'
  onVue: (v: 'liste' | 'apercu') => void
}

const FILTRES: Array<{ cle: StatutPatient | 'tous'; libelle: string }> = [
  { cle: 'actif', libelle: 'En suivi' },
  { cle: 'pause', libelle: 'En pause' },
  { cle: 'cloture', libelle: 'Terminés' },
  { cle: 'tous', libelle: 'Tous' },
]

export default function Patients({ onOuvrirPatient, onNouveauPatient, vue, onVue }: Props) {
  const { patients, seances, reglages } = useDonnees()
  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState<StatutPatient | 'tous'>('actif')
  const [theme, setTheme] = useState<string | null>(null)

  // Le filtre par statut s'applique aux deux vues : le nuage compte exactement
  // les dossiers que la liste montrerait. Un chiffre affiché doit toujours
  // pouvoir être retrouvé en touchant la bulle.
  const parStatut = useMemo(
    () => patients.filter((p) => (filtre === 'tous' ? true : p.statut === filtre)),
    [patients, filtre],
  )

  const bulles = useMemo(() => compterThemes(parStatut), [parStatut])
  const bulleChoisie = bulles.find((b) => b.cle === theme) ?? null

  const liste = useMemo(() => {
    const q = normaliser(recherche)
    return parStatut
      .filter((p) => !q || normaliser(`${p.prenom} ${p.nom} ${p.telephone} ${p.motif}`).includes(q))
      .filter((p) => {
        if (!theme) return true
        const cles = themesDuPatient(p).map(cleTheme)
        return cles.length > 0 ? cles.includes(theme) : theme === cleTheme(THEME_ABSENT)
      })
      .sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`, 'fr'))
  }, [parStatut, recherche, theme])

  const compte = (cle: StatutPatient | 'tous') =>
    cle === 'tous' ? patients.length : patients.filter((p) => p.statut === cle).length

  /** Toucher une bulle, c'est demander « qui sont ces personnes ? ». */
  const choisirTheme = (cle: string) => {
    if (theme === cle) { setTheme(null); return }
    setTheme(cle)
    onVue('liste')
  }

  return (
    <>
      <div className="segments">
        <button aria-pressed={vue === 'liste'} onClick={() => onVue('liste')}>
          Liste
        </button>
        <button aria-pressed={vue === 'apercu'} onClick={() => onVue('apercu')}>
          <IconeStats taille={15} /> Aperçu
        </button>
      </div>

      <div className="choix">
        {FILTRES.map((f) => (
          <button key={f.cle} aria-pressed={filtre === f.cle} onClick={() => setFiltre(f.cle)}>
            {f.libelle} · {compte(f.cle)}
          </button>
        ))}
      </div>

      {vue === 'apercu' ? (
        bulles.length === 0 ? (
          <div className="vide">
            <span className="disque grand"><IconeStats taille={22} /></span>
            <strong>Rien à représenter</strong>
            Les thèmes apparaîtront dès qu’un dossier en portera un.
          </div>
        ) : (
          <section>
            <div className="entete-section">
              <h3>Ce qui amène les patients</h3>
              <span className="entete-note">
                <strong>{parStatut.length}</strong> dossier{parStatut.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="carte">
              <NuageBulles bulles={bulles} choisi={theme} onChoisir={choisirTheme} />
            </div>
            <p className="aide" style={{ margin: '10px 4px 0' }}>
              Touchez une bulle pour voir les dossiers qu’elle regroupe. Les thèmes se
              choisissent dans chaque fiche, sous « Suivi clinique ».
            </p>
          </section>
        )
      ) : (
        <>
          <input
            className="recherche"
            placeholder="Rechercher un nom, un téléphone…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />

          {bulleChoisie && (
            <div className="filtre-actif">
              <span className={`legende-pastille tb${bulleChoisie.teinte}`} />
              <span>
                Thème : <strong>{bulleChoisie.nom}</strong> · {bulleChoisie.nb} dossier
                {bulleChoisie.nb > 1 ? 's' : ''}
              </span>
              <button aria-label="Retirer le filtre par thème" onClick={() => setTheme(null)}>
                <IconeCroix taille={14} />
              </button>
            </div>
          )}

          {liste.length === 0 ? (
            <div className="vide">
              <span className="disque grand"><IconePatients taille={22} /></span>
              <strong>Aucun dossier à afficher</strong>
              {patients.length === 0 ? (
                <>
                  Créez le premier avec le bouton « Nouveau patient ».
                  <div style={{ marginTop: 16 }}>
                    <button className="btn principal" onClick={onNouveauPatient}>
                      Nouveau patient
                    </button>
                  </div>
                </>
              ) : (
                'Essayez un autre filtre ou une autre recherche.'
              )}
            </div>
          ) : (
            <div className="pile">
              {liste.map((p) => {
                const siennes = seances.filter((s) => s.patientId === p.id)
                const nb = siennes.filter((s) => s.statut === 'effectue').length
                const impaye = siennes.some((s) => !s.paye && (s.statut === 'effectue' || s.statut === 'absent' || s.statut === 'annule_hors_delai'))
                return (
                  <button key={p.id} className="carte-ligne" onClick={() => onOuvrirPatient(p.id)}>
                    <span className={`monogramme ${p.statut === 'actif' ? '' : p.statut}`}>
                      {initiales(p.prenom, p.nom)}
                    </span>
                    <span className="ligne-corps">
                      <span className="ligne-titre">
                        <span className={`nom${reglages.masquerNoms ? ' flou' : ''}`}>
                          {nomAffiche(p, false)}
                        </span>
                        {p.statut !== 'actif' && (
                          <span className="puce gris">{LIBELLE_STATUT_PATIENT[p.statut]}</span>
                        )}
                        {impaye && <span className="puce attente">Impayé</span>}
                      </span>
                      <span className="ligne-sous">
                        <span>{nb} séance{nb > 1 ? 's' : ''}</span>
                        {p.motif && <><span>·</span><span>{p.motif}</span></>}
                      </span>
                    </span>
                    <Chevron />
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}
    </>
  )
}
