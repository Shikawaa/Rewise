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

// Chemin pour les fichiers temporaires
const tempDir = path.join(__dirname, 'temp')
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir)
}

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY
const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2'

console.log('Clé API AssemblyAI chargée:', ASSEMBLYAI_API_KEY ? 'Oui' : 'Non')

// Configuration CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Length', 'Content-Type', 'Accept-Ranges', 'Content-Range']
}))

app.use(express.json())

// Middleware pour servir les fichiers audio avec les bons en-têtes
app.use('/temp', express.static(tempDir, {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.mp3') {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// Route spécifique pour les fichiers audio
app.get('/temp/:filename', (req, res, next) => {
  const filename = req.params.filename;
  const filePath = path.join(tempDir, filename);
  console.log('Tentative d\'accès au fichier:', filePath);

  if (!fs.existsSync(filePath)) {
    console.error('Fichier non trouvé:', filePath);
    return res.status(404).json({ error: 'Fichier non trouvé' });
  }

  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    console.error('Fichier vide:', filePath);
    return res.status(500).json({ error: 'Fichier vide' });
  }

  console.log('Envoi du fichier:', filename, 'Taille:', stats.size);
  
  // Si le middleware static n'a pas géré la réponse, le faire manuellement
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } else {
    next();
  }
});

// Extraire l'ID de la vidéo YouTube
function getVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  const match = url.match(regex)
  return match ? match[1] : null
}

app.get('/api/youtube/audio-url', async (req, res) => {
  try {
    const { audioUrl } = req.query
    console.log('=== EXTRACTION AUDIO YOUTUBE ===')
    console.log('URL reçue:', audioUrl)
    
    if (!audioUrl) {
      return res.status(400).json({ error: 'URL de la vidéo YouTube requise' })
    }

    // Extraire l'ID de la vidéo
    const videoId = getVideoId(audioUrl)
    if (!videoId) {
      return res.status(400).json({ error: 'URL YouTube invalide' })
    }

    console.log('ID vidéo:', videoId)
    const outputPath = path.join(tempDir, `${videoId}.mp3`)

    // Vérifier si le fichier existe déjà
    if (fs.existsSync(outputPath)) {
      console.log('Fichier audio déjà existant:', outputPath)
      const stats = fs.statSync(outputPath)
      console.log('Taille du fichier:', stats.size, 'octets')
      
      if (stats.size === 0) {
        console.log('Fichier vide, suppression et téléchargement à nouveau')
        fs.unlinkSync(outputPath)
      } else {
        // Le fichier existe et n'est pas vide, on peut l'utiliser
        const audioUrl = `http://localhost:3001/temp/${videoId}.mp3`
        console.log('URL audio générée:', audioUrl)
        return res.json({ audioUrl })
      }
    }

    // Si on arrive ici, il faut télécharger le fichier
    console.log('Début du téléchargement...')
    const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputPath}" "${audioUrl}"`
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
    const localAudioUrl = `http://localhost:3001/temp/${videoId}.mp3`
    console.log('URL audio générée:', localAudioUrl)

    res.json({ audioUrl: localAudioUrl })
  } catch (error) {
    console.error('=== ERREUR LORS DE L\'EXTRACTION AUDIO ===')
    console.error('Message:', error.message)
    console.error('Stack:', error.stack)
    
    res.status(500).json({ 
      error: 'Erreur lors de l\'extraction de l\'URL audio',
      details: error.message
    })
  }
})

// Endpoint pour la transcription
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioUrl } = req.body
    console.log('=== DÉBUT DE LA TRANSCRIPTION ===')
    console.log('URL audio reçue:', audioUrl)
    console.log('Clé API AssemblyAI disponible:', ASSEMBLYAI_API_KEY ? 'Oui' : 'Non')

    if (!ASSEMBLYAI_API_KEY) {
      throw new Error('Clé API AssemblyAI manquante')
    }

    if (!audioUrl) {
      throw new Error('URL audio manquante')
    }

    // Extraire le nom du fichier à partir de l'URL
    const urlParts = audioUrl.split('/')
    const filename = urlParts[urlParts.length - 1]
    console.log('Nom du fichier extrait:', filename)
    
    // Vérifier si le fichier existe localement
    const filePath = path.join(tempDir, filename)
    console.log('Chemin du fichier local:', filePath)
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Fichier non trouvé: ${filename}`)
    }
    
    // Lire le fichier
    console.log('Lecture du fichier audio depuis le système de fichiers...')
    const fileStats = fs.statSync(filePath)
    console.log('Taille du fichier:', fileStats.size, 'octets')
    
    if (fileStats.size === 0) {
      throw new Error('Fichier audio vide')
    }

    // 1. Upload du fichier audio directement à AssemblyAI
    console.log('Début de l\'upload du fichier à AssemblyAI...')
    const fileStream = fs.createReadStream(filePath)
    
    const uploadResponse = await axios.post(
      `${ASSEMBLYAI_API_URL}/upload`,
      fileStream,
      {
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY,
          'Content-Type': 'audio/mpeg'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000 // 60 secondes
      }
    )

    if (!uploadResponse.data || !uploadResponse.data.upload_url) {
      throw new Error('URL d\'upload non reçue de AssemblyAI')
    }

    const uploadUrl = uploadResponse.data.upload_url
    console.log('Fichier uploadé avec succès, URL:', uploadUrl)

    // 2. Démarrer la transcription avec l'URL d'upload
    console.log('Démarrage de la transcription avec l\'URL d\'upload...')
    const transcriptResponse = await axios.post(
      `${ASSEMBLYAI_API_URL}/transcript`,
      {
        audio_url: uploadUrl,
        language_detection: true
      },
      {
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 secondes
      }
    )

    console.log('Réponse de la création de transcription:', JSON.stringify(transcriptResponse.data, null, 2))
    const transcriptId = transcriptResponse.data.id
    console.log('ID de transcription obtenu:', transcriptId)

    // 3. Attendre que la transcription soit terminée
    let transcript = null
    let attempts = 0
    const maxAttempts = 30 // Maximum 90 secondes d'attente

    while (!transcript && attempts < maxAttempts) {
      console.log(`Tentative ${attempts + 1}/${maxAttempts} de récupération de la transcription...`)
      
      const pollingResponse = await axios.get(
        `${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`,
        {
          headers: {
            'Authorization': ASSEMBLYAI_API_KEY
          },
          timeout: 10000 // 10 secondes
        }
      )

      console.log('Statut de la transcription:', pollingResponse.data.status)
      
      if (pollingResponse.data.status === 'completed') {
        transcript = pollingResponse.data.text
        console.log('Transcription terminée avec succès')
        console.log('Extrait de la transcription:', transcript.substring(0, 100) + '...')
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

    console.log('=== FIN DE LA TRANSCRIPTION AVEC SUCCÈS ===')
    res.json({ transcript })
  } catch (error) {
    console.error('=== ERREUR LORS DE LA TRANSCRIPTION ===')
    console.error('Message d\'erreur:', error.message)
    console.error('Stack trace:', error.stack)
    
    let errorMessage = 'Erreur lors de la transcription'
    let statusCode = 500
    let errorDetails = {
      message: error.message,
      type: error.constructor.name
    }
    
    // Erreurs spécifiques à AssemblyAI
    if (error.response) {
      console.error('Code HTTP:', error.response.status)
      console.error('Réponse d\'erreur:', JSON.stringify(error.response.data, null, 2))
      errorDetails.response = error.response.data
      
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
      errorDetails.code = error.code
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Impossible de se connecter à AssemblyAI'
      errorDetails.code = error.code
    } else if (error.code) {
      errorDetails.code = error.code
    }
    
    console.error('Réponse d\'erreur envoyée:', { error: errorMessage, details: errorDetails })
    res.status(statusCode).json({ 
      error: errorMessage,
      details: errorDetails
    })
  }
})

// Endpoint de test pour vérifier la réception de l'URL YouTube
app.post('/api/test-youtube', async (req, res) => {
  try {
    const { videoUrl } = req.body;
    console.log('=== TEST DE RÉCEPTION URL YOUTUBE ===');
    console.log('URL vidéo reçue:', videoUrl);
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'URL YouTube manquante' });
    }
    
    // Extraire l'ID de la vidéo
    const videoId = getVideoId(videoUrl);
    if (!videoId) {
      return res.status(400).json({ error: 'URL YouTube invalide' });
    }
    
    console.log('ID vidéo extrait:', videoId);
    
    // Récupérer et sauvegarder l'audio
    const outputPath = path.join(tempDir, `${videoId}.mp3`);
    
    // Vérifier si le fichier existe déjà
    if (fs.existsSync(outputPath)) {
      console.log('Fichier audio déjà existant:', outputPath);
      const stats = fs.statSync(outputPath);
      console.log('Taille du fichier:', stats.size, 'octets');
    } else {
      console.log('Début du téléchargement de l\'audio...');
      const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputPath}" "${videoUrl}"`;
      console.log('Commande:', command);
      
      const { stdout, stderr } = await execAsync(command);
      console.log('Téléchargement terminé');
      console.log('Sortie standard:', stdout);
      if (stderr) console.error('Erreur standard:', stderr);
      
      // Vérifier le fichier téléchargé
      if (!fs.existsSync(outputPath)) {
        throw new Error('Le fichier audio n\'a pas été créé');
      }
      
      const stats = fs.statSync(outputPath);
      console.log('Fichier créé:', outputPath);
      console.log('Taille:', stats.size, 'octets');
    }
    
    // Créer l'URL locale
    const audioUrl = `http://localhost:3001/temp/${videoId}.mp3`;
    console.log('URL audio locale générée:', audioUrl);
    
    // Tester l'upload à AssemblyAI
    console.log('Test d\'upload à AssemblyAI...');
    try {
      const fileStream = fs.createReadStream(outputPath);
      const uploadResponse = await axios.post(
        `${ASSEMBLYAI_API_URL}/upload`,
        fileStream,
        {
          headers: {
            'Authorization': ASSEMBLYAI_API_KEY,
            'Content-Type': 'audio/mpeg'
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      
      console.log('Réponse d\'upload:', uploadResponse.data);
      
      if (!uploadResponse.data || !uploadResponse.data.upload_url) {
        throw new Error('Erreur lors de l\'upload: URL non reçue');
      }
      
      const uploadUrl = uploadResponse.data.upload_url;
      console.log('URL d\'upload:', uploadUrl);
      
      res.json({ 
        success: true, 
        videoId, 
        audioUrl,
        uploadUrl,
        message: 'URL YouTube bien reçue et traitée'
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload à AssemblyAI:', error.message);
      if (error.response) {
        console.error('Statut:', error.response.status);
        console.error('Données:', error.response.data);
      }
      throw new Error(`Erreur lors de l'upload à AssemblyAI: ${error.message}`);
    }
  } catch (error) {
    console.error('=== ERREUR ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      error: 'Erreur lors du test',
      details: error.message
    });
  }
});

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
  console.log(`Dossier temporaire: ${tempDir}`)
  console.log('Configuration CORS:', {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposedHeaders: ['Content-Length', 'Content-Type', 'Accept-Ranges', 'Content-Range']
  })
}) 