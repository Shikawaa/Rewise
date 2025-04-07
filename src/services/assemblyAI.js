import axios from 'axios'

const ASSEMBLYAI_API_KEY = 'e809ce08ec254c7c835d6bbb9cd9bc64'
const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2'

const assemblyAI = axios.create({
  baseURL: ASSEMBLYAI_API_URL,
  headers: {
    authorization: ASSEMBLYAI_API_KEY,
    'content-type': 'application/json',
  },
})

const extractYouTubeId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

export const transcribeYouTubeVideo = async (videoUrl) => {
  try {
    const videoId = extractYouTubeId(videoUrl)
    if (!videoId) {
      throw new Error('URL YouTube invalide')
    }

    // Construire l'URL du fichier audio
    const audioUrl = `https://www.youtube.com/watch?v=${videoId}`

    // 1. Créer une transcription
    const response = await assemblyAI.post('/transcript', {
      audio_url: audioUrl,
    })

    const transcriptId = response.data.id

    // 2. Attendre que la transcription soit terminée
    let transcript = null
    let attempts = 0
    const maxAttempts = 20 // Maximum 60 secondes d'attente

    while (!transcript && attempts < maxAttempts) {
      const pollingResponse = await assemblyAI.get(`/transcript/${transcriptId}`)
      if (pollingResponse.data.status === 'completed') {
        transcript = pollingResponse.data.text
      } else if (pollingResponse.data.status === 'error') {
        throw new Error('Erreur lors de la transcription')
      }
      // Attendre 3 secondes avant de réessayer
      await new Promise((resolve) => setTimeout(resolve, 3000))
      attempts++
    }

    if (!transcript) {
      throw new Error('Délai d\'attente dépassé pour la transcription')
    }

    return transcript
  } catch (error) {
    console.error('Erreur lors de la transcription:', error)
    throw error
  }
} 