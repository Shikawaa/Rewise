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
          target: 'https://www.youtube.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    // Permettre d'utiliser les variables d'environnement sans préfixe VITE_
    define: {
      'import.meta.env.MISTRAL_API_KEY': JSON.stringify(env.MISTRAL_API_KEY),
      'import.meta.env.ASSEMBLYAI_API_KEY': JSON.stringify(env.ASSEMBLYAI_API_KEY),
    }
  }
})
