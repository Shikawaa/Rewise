import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charger les variables d'environnement
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          // Pas besoin de réécrire les chemins puisque le serveur backend n'a pas de préfixe /api
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
      // Autoriser les hôtes ngrok
      allowedHosts: [
        '890c-185-226-32-80.ngrok-free.app',
        'endless-mule-totally.ngrok-free.app',
        '*.ngrok-free.app', // Permet tous les sous-domaines ngrok
        'localhost',
      ],
      // Configurer le CORS
      cors: true,
      // Écouter sur toutes les interfaces réseau pour permettre l'accès externe
      host: '0.0.0.0'
    },
    // Permettre d'utiliser les variables d'environnement sans préfixe VITE_
    define: {
      'import.meta.env.MISTRAL_API_KEY': JSON.stringify(env.MISTRAL_API_KEY),
      'import.meta.env.ASSEMBLYAI_API_KEY': JSON.stringify(env.ASSEMBLYAI_API_KEY),
    }
  }
})
