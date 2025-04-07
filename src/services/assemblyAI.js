import axios from 'axios'

const ASSEMBLYAI_API_KEY = import.meta.env.VITE_ASSEMBLYAI_API_KEY
const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2'
const BACKEND_URL = 'http://localhost:3001'

// Vérifier le statut du compte AssemblyAI
export const checkAccountStatus = async () => {
  try {
    console.log('Vérification du statut du compte AssemblyAI...')
    const response = await axios.get(`${ASSEMBLYAI_API_URL}/account`, {
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY
      }
    })
    console.log('Statut du compte AssemblyAI:', response.data)
    return response.data
  } catch (error) {
    console.error('Erreur lors de la vérification du statut du compte:', error)
    if (error.response?.status === 401) {
      throw new Error('Clé API AssemblyAI invalide ou manquante')
    }
    throw error
  }
}

// Obtenir l'URL audio d'une vidéo YouTube
export const getYouTubeAudioUrl = async (videoUrl) => {
  try {
    console.log('Tentative d\'extraction de l\'URL audio pour:', videoUrl)
    const response = await axios.get(`${BACKEND_URL}/api/youtube/audio-url`, {
      params: { videoUrl }
    })
    
    if (!response.data.audioUrl) {
      throw new Error('URL audio non trouvée dans la réponse')
    }
    
    console.log('URL audio extraite avec succès:', response.data.audioUrl)
    return response.data.audioUrl
  } catch (error) {
    console.error('Erreur détaillée lors de l\'extraction de l\'URL audio:', error)
    if (error.response?.status === 403) {
      throw new Error('La vidéo YouTube est privée ou protégée')
    }
    if (error.response?.status === 404) {
      throw new Error('La vidéo YouTube n\'est pas disponible')
    }
    throw new Error('Impossible d\'extraire l\'URL audio de la vidéo YouTube')
  }
}

// Transcrire une vidéo YouTube
export const transcribeYouTubeVideo = async (videoUrl) => {
  try {
    console.log('Début du processus de transcription...')
    
    // Vérifier d'abord le statut du compte
    await checkAccountStatus()
    console.log('Statut du compte vérifié avec succès')

    // Obtenir l'URL audio
    const audioUrl = await getYouTubeAudioUrl(videoUrl)
    console.log('URL audio obtenue avec succès')

    // Démarrer la transcription
    console.log('Démarrage de la transcription avec AssemblyAI...')
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
        }
      }
    )

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
          }
        }
      )

      console.log('Statut de la transcription:', pollingResponse.data.status)

      if (pollingResponse.data.status === 'completed') {
        transcript = pollingResponse.data.text
        console.log('Transcription terminée avec succès')
      } else if (pollingResponse.data.status === 'error') {
        console.error('Erreur de transcription:', pollingResponse.data)
        throw new Error('Erreur lors de la transcription')
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

    return transcript
  } catch (error) {
    console.error('Erreur détaillée lors de la transcription:', error)
    if (error.response?.status === 401) {
      throw new Error('Clé API AssemblyAI invalide ou manquante')
    }
    if (error.response?.data?.error) {
      throw new Error(`Erreur AssemblyAI: ${error.response.data.error}`)
    }
    throw error
  }
} 