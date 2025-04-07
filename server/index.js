import express from 'express'
import cors from 'cors'
import youtubedl from 'youtube-dl-exec'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = 3001

// Créer le dossier temporaire s'il n'existe pas
const tempDir = path.join(__dirname, 'temp')
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir)
}

app.use(cors())
app.use(express.json())
app.use('/temp', express.static(tempDir))

// Route pour extraire l'URL audio d'une vidéo YouTube
app.get('/api/youtube/audio-url', async (req, res) => {
  try {
    const { videoUrl } = req.query
    console.log('URL reçue:', videoUrl)

    if (!videoUrl) {
      return res.status(400).json({ error: 'URL de la vidéo YouTube requise' })
    }

    // Générer un nom de fichier unique
    const videoId = youtubedl.getVideoID(videoUrl)
    const outputPath = path.join(tempDir, `${videoId}.mp3`)

    // Télécharger l'audio
    console.log('Téléchargement de l\'audio...')
    await youtubedl(videoUrl, {
      output: outputPath,
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: 0, // meilleure qualité
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true
    })

    console.log('Audio téléchargé avec succès:', outputPath)

    // Vérifier que le fichier existe
    if (!fs.existsSync(outputPath)) {
      throw new Error('Le fichier audio n\'a pas été créé')
    }

    // Créer une URL accessible
    const audioUrl = `http://localhost:${port}/temp/${videoId}.mp3`
    console.log('URL audio générée:', audioUrl)

    res.json({ audioUrl })
  } catch (error) {
    console.error('Erreur détaillée:', error)
    if (error.message.includes('private')) {
      return res.status(403).json({ error: 'La vidéo est privée ou protégée' })
    }
    if (error.message.includes('unavailable')) {
      return res.status(404).json({ error: 'La vidéo n\'est pas disponible' })
    }
    res.status(500).json({ 
      error: 'Erreur lors de l\'extraction de l\'URL audio',
      details: error.message 
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
}) 