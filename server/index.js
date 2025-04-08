import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'
import axios from 'axios'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = 3001

// URL publique pour les fichiers audio
const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:3001'

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY
const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2'

console.log('Clé API AssemblyAI chargée:', ASSEMBLYAI_API_KEY ? 'Oui' : 'Non')

// Créer le dossier temporaire s'il n'existe pas
const tempDir = path.join(__dirname, 'temp')
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir)
}

// Configuration CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Length', 'Content-Type', 'Accept-Ranges', 'Content-Range']
}))

app.use(express.json())

// Middleware pour servir les fichiers audio avec les bons en-têtes
app.use('/temp', (req, res, next) => {
  console.log('Requête pour le fichier:', req.path)
  console.log('Headers de la requête:', req.headers)
  
  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Accept-Ranges', 'bytes')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range')
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Accept-Ranges, Content-Range')
  
  // Gérer les requêtes partielles (streaming)
  const filePath = path.join(__dirname, 'temp', req.path)
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath)
    const total = stat.size
    
    if (req.headers.range) {
      const range = req.headers.range
      const parts = range.replace(/bytes=/, '').split('-')
      const partialstart = parts[0]
      const partialend = parts[1]
      
      const start = parseInt(partialstart, 10)
      const end = partialend ? parseInt(partialend, 10) : total - 1
      const chunksize = (end - start) + 1
      
      console.log('Requête partielle:', { start, end, total })
      
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`)
      res.setHeader('Content-Length', chunksize)
      res.status(206)
      
      const fileStream = fs.createReadStream(filePath, { start, end })
      fileStream.pipe(res)
    } else {
      console.log('Requête complète, taille:', total)
      res.setHeader('Content-Length', total)
      const fileStream = fs.createReadStream(filePath)
      fileStream.pipe(res)
    }
  } else {
    next()
  }
})

// Route spécifique pour les fichiers audio
app.get('/temp/:filename', (req, res) => {
  const filename = req.params.filename
  const filePath = path.join(tempDir, filename)
  console.log('Tentative d\'accès au fichier:', filePath)

  if (!fs.existsSync(filePath)) {
    console.error('Fichier non trouvé:', filePath)
    return res.status(404).json({ error: 'Fichier non trouvé' })
  }

  const stats = fs.statSync(filePath)
  if (stats.size === 0) {
    console.error('Fichier vide:', filePath)
    return res.status(500).json({ error: 'Fichier vide' })
  }

  console.log('Envoi du fichier:', filename, 'Taille:', stats.size)
  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Content-Length', stats.size)
  res.setHeader('Accept-Ranges', 'bytes')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  const fileStream = fs.createReadStream(filePath)
  fileStream.pipe(res)
})

// Extraire l'ID de la vidéo YouTube
function getVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  const match = url.match(regex)
  return match ? match[1] : null
}

app.get('/api/youtube/audio-url', async (req, res) => {
  try {
    const { audioUrl: inputUrl } = req.query
    console.log('URL reçue:', inputUrl)

    if (!inputUrl) {
      return res.status(400).json({ error: 'URL de la vidéo YouTube requise' })
    }

    const videoId = getVideoId(inputUrl)
    if (!videoId) {
      return res.status(400).json({ error: 'URL YouTube invalide' })
    }

    console.log('ID vidéo:', videoId)
    const outputPath = path.join(tempDir, `${videoId}.mp3`)

    // Supprimer le fichier s'il existe déjà
    if (fs.existsSync(outputPath)) {
      console.log('Suppression du fichier existant:', outputPath)
      fs.unlinkSync(outputPath)
    }

    console.log('Début du téléchargement...')
    const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputPath}" "${inputUrl}"`
    console.log('Commande:', command)

    const { stdout, stderr } = await execAsync(command)
    console.log('Sortie standard:', stdout)
    if (stderr) console.error('Erreur standard:', stderr)

    // Vérifier que le fichier existe et n'est pas vide
    if (!fs.existsSync(outputPath)) {
      throw new Error('Le fichier audio n\'a pas été créé')
    }

    const stats = fs.statSync(outputPath)
    if (stats.size === 0) {
      throw new Error('Le fichier audio est vide')
    }

    console.log('Fichier créé:', outputPath)
    console.log('Taille:', stats.size, 'octets')

    // Créer une URL accessible
    const publicAudioUrl = `${PUBLIC_URL}/temp/${videoId}.mp3`
    console.log('URL audio générée:', publicAudioUrl)

    res.json({ audioUrl: publicAudioUrl })
  } catch (error) {
    console.error('Erreur détaillée:', error)
    console.error('Stack trace:', error.stack)
    
    res.status(500).json({ 
      error: 'Erreur lors de l\'extraction de l\'URL audio',
      details: error.message,
      stack: error.stack
    })
  }
})

// Endpoint pour la transcription
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioUrl } = req.body
    console.log('Démarrage de la transcription pour:', audioUrl)
    console.log('Clé API AssemblyAI disponible:', ASSEMBLYAI_API_KEY ? 'Oui' : 'Non')

    if (!ASSEMBLYAI_API_KEY) {
      throw new Error('Clé API AssemblyAI manquante')
    }

    // Vérifier d'abord que l'URL audio est accessible
    try {
      console.log('Vérification de l\'accessibilité de l\'URL audio...')
      const checkResponse = await axios.head(audioUrl)
      console.log('URL audio accessible:', checkResponse.status)
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'URL audio:', error.message)
      throw new Error(`L'URL audio n'est pas accessible: ${error.message}`)
    }

    // Démarrer la transcription
    console.log('Envoi de la requête à AssemblyAI...')
    const response = await axios.post(
      `${ASSEMBLYAI_API_URL}/transcript`,
      {
        audio_url: audioUrl,
        language_detection: true
      },
      {
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // Timeout de 30s
      }
    )

    console.log('Réponse d\'AssemblyAI:', JSON.stringify(response.data, null, 2))
    const transcriptId = response.data.id
    console.log('ID de transcription:', transcriptId)

    // Attendre que la transcription soit terminée
    let transcript = null
    let attempts = 0
    const maxAttempts = 20 // Maximum 60 secondes d'attente

    while (!transcript && attempts < maxAttempts) {
      console.log(`Tentative ${attempts + 1}/${maxAttempts} de récupération de la transcription...`)
      
      const pollingResponse = await axios.get(
        `${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`,
        {
          headers: {
            'Authorization': ASSEMBLYAI_API_KEY
          },
          timeout: 10000 // Timeout de 10s
        }
      )

      console.log('Statut de la transcription:', pollingResponse.data.status)
      console.log('Réponse complète:', JSON.stringify(pollingResponse.data, null, 2))

      if (pollingResponse.data.status === 'completed') {
        transcript = pollingResponse.data.text
        console.log('Transcription terminée avec succès')
      } else if (pollingResponse.data.status === 'error') {
        console.error('Erreur de transcription:', pollingResponse.data.error)
        throw new Error(`Erreur lors de la transcription: ${pollingResponse.data.error || 'Erreur inconnue'}`)
      } else {
        // Attendre 3 secondes avant de réessayer
        console.log('Transcription en cours, attente de 3 secondes...')
        await new Promise(resolve => setTimeout(resolve, 3000))
        attempts++
      }
    }

    if (!transcript) {
      throw new Error('Délai d\'attente dépassé pour la transcription')
    }

    res.json({ transcript })
  } catch (error) {
    console.error('Erreur détaillée lors de la transcription:', error)
    console.error('Stack trace:', error.stack)
    
    let errorMessage = 'Erreur lors de la transcription'
    let statusCode = 500
    
    // Erreurs spécifiques à AssemblyAI
    if (error.response) {
      console.error('Réponse d\'erreur:', error.response.data)
      
      if (error.response.status === 401) {
        errorMessage = 'Clé API AssemblyAI invalide'
        statusCode = 401
      } else if (error.response.status === 400) {
        errorMessage = 'Requête invalide: ' + (error.response.data.error || 'Format de requête incorrect')
        statusCode = 400
      } else if (error.response.status === 429) {
        errorMessage = 'Limite de requêtes atteinte pour AssemblyAI'
        statusCode = 429
      } else if (error.response.status === 404) {
        errorMessage = 'Ressource non trouvée'
        statusCode = 404
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Délai d\'attente dépassé pour la connexion à AssemblyAI'
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Impossible de se connecter à AssemblyAI'
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: error.message,
      response: error.response?.data
    })
  }
})

// Nettoyer les fichiers temporaires toutes les heures
setInterval(() => {
  fs.readdir(tempDir, (err, files) => {
    if (err) {
      console.error('Erreur lors du nettoyage des fichiers temporaires:', err)
      return
    }

    const now = Date.now()
    files.forEach(file => {
      const filePath = path.join(tempDir, file)
      fs.stat(filePath, (err, stats) => {
        if (err) return
        // Supprimer les fichiers de plus d'une heure
        if (now - stats.mtime.getTime() > 3600000) {
          fs.unlink(filePath, err => {
            if (err) console.error('Erreur lors de la suppression du fichier:', err)
          })
        }
      })
    })
  })
}, 3600000)

app.listen(port, () => {
  console.log(`Serveur backend démarré sur le port ${port}`)
  console.log(`URL publique: ${PUBLIC_URL}`)
  console.log(`Dossier temporaire: ${tempDir}`)
  console.log('Configuration CORS:', {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposedHeaders: ['Content-Length', 'Content-Type', 'Accept-Ranges', 'Content-Range']
  })
}) 