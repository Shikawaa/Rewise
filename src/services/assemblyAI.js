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
export const getYouTubeAudioUrl = async (audioUrl) => {
  try {
    console.log('Tentative d\'extraction de l\'URL audio pour:', audioUrl)
    const response = await axios.get(`${BACKEND_URL}/api/youtube/audio-url`, {
      params: { audioUrl }
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
export const transcribeYouTubeVideo = async (audioUrl) => {
  try {
    console.log('Début du processus de transcription...')
    
    // Vérifier d'abord le statut du compte
    await checkAccountStatus()
    console.log('Statut du compte vérifié avec succès')

    // Obtenir l'URL audio
    const publicAudioUrl = await getYouTubeAudioUrl(audioUrl)
    console.log('URL audio obtenue avec succès:', publicAudioUrl)

    // Utiliser le nouvel endpoint de transcription
    const response = await axios.post(
      `${BACKEND_URL}/api/transcribe`,
      { audioUrl: publicAudioUrl },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.data.transcript) {
      throw new Error('Transcription non trouvée dans la réponse')
    }

    return response.data.transcript
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