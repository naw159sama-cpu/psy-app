import { useRef, useState } from 'react'
import {
  useDonnees, majReglages, exporter, importer, toutEffacer, lire,
} from '../lib/store'
import { genererDemo } from '../lib/demo'
import { aujourdhui, JOURS_COURTS } from '../lib/dates'
import { da } from '../lib/format'

const CLE_ECHELLE = 'psy-app:echelle'

export default function Reglages() {
  const { reglages, patients, seances } = useDonnees()
  const fichier = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [confirmeEffacer, setConfirmeEffacer] = useState(false)
  const [echelle, setEchelle] = useState(
    () => Number(localStorage.getItem(CLE_ECHELLE) ?? '1'),
  )

  const changerEchelle = (v: number) => {
    setEchelle(v)
    localStorage.setItem(CLE_ECHELLE, String(v))
    document.documentElement.style.setProperty('--echelle', String(v))
  }

  const telecharger = () => {
    const blob = new Blob([exporter()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sauvegarde-cabinet-${aujourdhui()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('Sauvegarde téléchargée. Rangez-la ailleurs que sur le téléphone.')
  }

  const restaurer = (f: File) => {
    const lecteur = new FileReader()
    lecteur.onload = () => {
      const r = importer(String(lecteur.result))
      setMessage(r.ok ? 'Sauvegarde restaurée.' : r.erreur)
    }
    lecteur.readAsText(f)
  }

  const chargerDemo = () => {
    const d = genererDemo()
    const r = importer(JSON.stringify(d))
    setMessage(r.ok ? 'Données de démonstration chargées.' : 'Échec du chargement.')
  }

  const basculerJour = (j: number) => {
    const actuels = reglages.joursTravail
    const suivants = actuels.includes(j) ? actuels.filter((x) => x !== j) : [...actuels, j]
    majReglages({ joursTravail: suivants.sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)) })
  }

  const majCreneau = (i: number, champ: 'debut' | 'fin', valeur: string) => {
    const suivants = reglages.creneaux.map((c, k) => (k === i ? { ...c, [champ]: valeur } : c))
    majReglages({ creneaux: suivants })
  }

  const ajouterCreneau = () => {
    majReglages({ creneaux: [...reglages.creneaux, { debut: '17:00', fin: '18:30' }] })
  }

  const retirerCreneau = (i: number) => {
    majReglages({ creneaux: reglages.creneaux.filter((_, k) => k !== i) })
  }

  const partCabinetPct = 100 - reglages.partPsyPct

  return (
    <>
      <div className="section-titre">Mon cabinet</div>
      <div className="champ">
        <label htmlFor="r-nom">Mon nom</label>
        <input
          id="r-nom"
          value={reglages.nomPraticienne}
          placeholder="Prénom Nom"
          onChange={(e) => majReglages({ nomPraticienne: e.target.value })}
        />
      </div>
      <div className="champ">
        <label htmlFor="r-cabinet">Nom du cabinet</label>
        <input
          id="r-cabinet"
          value={reglages.nomCabinet}
          onChange={(e) => majReglages({ nomCabinet: e.target.value })}
        />
      </div>

      <div className="section-titre">Tarif et partage</div>
      <div className="duo">
        <div className="champ">
          <label htmlFor="r-tarif">Prix d’une séance</label>
          <input
            id="r-tarif"
            type="number"
            inputMode="numeric"
            value={reglages.tarifDefaut}
            onChange={(e) => majReglages({ tarifDefaut: Math.max(0, Number(e.target.value)) })}
          />
        </div>
        <div className="champ">
          <label htmlFor="r-part">Ma part (%)</label>
          <input
            id="r-part"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={reglages.partPsyPct}
            onChange={(e) =>
              majReglages({ partPsyPct: Math.min(100, Math.max(0, Number(e.target.value))) })}
          />
        </div>
      </div>
      <div className="carte">
        <div className="rang">
          <span className="rang-lib">Pour moi ({reglages.partPsyPct} %)</span>
          <span className="rang-val gros">
            {da(Math.round((reglages.tarifDefaut * reglages.partPsyPct) / 100))}
          </span>
        </div>
        <div className="rang">
          <span className="rang-lib">Pour le cabinet ({partCabinetPct} %)</span>
          <span className="rang-val gros">
            {da(reglages.tarifDefaut - Math.round((reglages.tarifDefaut * reglages.partPsyPct) / 100))}
          </span>
        </div>
      </div>
      <p className="aide" style={{ color: 'var(--doux)', fontSize: '.82rem', margin: '8px 2px 0' }}>
        Les séances déjà enregistrées gardent le tarif et le partage en vigueur au moment
        où elles ont été créées.
      </p>

      <div className="section-titre">Jours de travail</div>
      <div className="choix">
        {[6, 0, 1, 2, 3, 4, 5].map((j) => (
          <button key={j} aria-pressed={reglages.joursTravail.includes(j)} onClick={() => basculerJour(j)}>
            {JOURS_COURTS[j]}
          </button>
        ))}
      </div>

      <div className="section-titre">Horaires des séances</div>
      {reglages.creneaux.map((c, i) => (
        <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-end', marginBottom: 10 }}>
          <div className="champ" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor={`c-deb-${i}`}>Début</label>
            <input id={`c-deb-${i}`} type="time" value={c.debut} onChange={(e) => majCreneau(i, 'debut', e.target.value)} />
          </div>
          <div className="champ" style={{ flex: 1, marginBottom: 0 }}>
            <label htmlFor={`c-fin-${i}`}>Fin</label>
            <input id={`c-fin-${i}`} type="time" value={c.fin} onChange={(e) => majCreneau(i, 'fin', e.target.value)} />
          </div>
          <button
            className="btn danger"
            aria-label={`Retirer le créneau ${c.debut}`}
            onClick={() => retirerCreneau(i)}
            style={{ flex: '0 0 auto' }}
          >
            −
          </button>
        </div>
      ))}
      <button className="btn bloc" onClick={ajouterCreneau}>Ajouter un créneau</button>
      <p className="aide" style={{ color: 'var(--doux)', fontSize: '.82rem', margin: '8px 2px 0' }}>
        Retirer un créneau ne supprime pas les séances déjà posées dessus.
      </p>

      <div className="section-titre">Confort de lecture</div>
      <div className="choix">
        {[{ v: 1, l: 'Normal' }, { v: 1.12, l: 'Grand' }, { v: 1.25, l: 'Très grand' }].map((o) => (
          <button key={o.v} aria-pressed={echelle === o.v} onClick={() => changerEchelle(o.v)}>
            {o.l}
          </button>
        ))}
      </div>

      <div className="section-titre">Sauvegarde</div>
      <div className="avert" style={{ marginBottom: 12 }}>
        <strong>À faire une fois par semaine.</strong>
        Tout est stocké dans ce téléphone uniquement. Si vous le perdez sans sauvegarde,
        les dossiers sont perdus.
      </div>
      <div className="btn-rang">
        <button className="btn principal" onClick={telecharger}>Sauvegarder</button>
        <button className="btn" onClick={() => fichier.current?.click()}>Restaurer</button>
      </div>
      <input
        ref={fichier}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) restaurer(f); e.target.value = '' }}
      />
      <p className="aide" style={{ color: 'var(--doux)', fontSize: '.82rem', margin: '8px 2px 0' }}>
        Actuellement : {patients.length} dossier{patients.length > 1 ? 's' : ''} et {seances.length} séance
        {seances.length > 1 ? 's' : ''}.
      </p>

      <div className="section-titre">Essayer l’application</div>
      <button className="btn bloc" onClick={chargerDemo}>
        Charger des données de démonstration
      </button>
      <p className="aide" style={{ color: 'var(--doux)', fontSize: '.82rem', margin: '8px 2px 0' }}>
        Remplace tout par des dossiers fictifs nommés « Démo ». À ne jamais laisser en place
        pour un usage réel.
      </p>

      <div className="section-titre">Tout effacer</div>
      {confirmeEffacer ? (
        <>
          <div className="avert" style={{ marginBottom: 10 }}>
            <strong>Cette action est définitive.</strong>
            {lire().patients.length} dossiers et {lire().seances.length} séances seront effacés.
          </div>
          <div className="btn-rang">
            <button className="btn" onClick={() => setConfirmeEffacer(false)}>Annuler</button>
            <button
              className="btn danger"
              onClick={() => { toutEffacer(); setConfirmeEffacer(false); setMessage('Toutes les données ont été effacées.') }}
            >
              Tout effacer
            </button>
          </div>
        </>
      ) : (
        <button className="btn danger bloc" onClick={() => setConfirmeEffacer(true)}>
          Effacer toutes les données
        </button>
      )}

      {message && (
        <p style={{ marginTop: 16, color: 'var(--accent)', fontWeight: 600, fontSize: '.9rem' }}>
          {message}
        </p>
      )}
    </>
  )
}
