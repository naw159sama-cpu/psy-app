import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Rend l'application utilisable hors connexion une fois installée.
// Le chemin suit la base de déploiement : racine d'un domaine ou sous-dossier.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const sw = new URL('sw.js', new URL(import.meta.env.BASE_URL, location.href)).href
    navigator.serviceWorker.register(sw).catch(() => {})
  })
}
