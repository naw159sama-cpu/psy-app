import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Chemins relatifs : l'application fonctionne aussi bien à la racine d'un domaine
// (Netlify, Vercel) que dans un sous-dossier (GitHub Pages : /nom-du-depot/).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5183 },
})
