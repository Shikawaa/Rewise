import axios from 'axios'

const ASSEMBLYAI_API_KEY = import.meta.env.VITE_ASSEMBLYAI_API_KEY
const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2'
const BACKEND_URL = 'http://localhost:3001'

console.log('Clé API AssemblyAI:', ASSEMBLYAI_API_KEY)

// Vérifier le statut du compte AssemblyAI
export const checkAccountStatus = async () => {
  try {
    console.log('Vérification du statut du compte AssemblyAI...')
    console.log('Clé API AssemblyAI utilisée:', ASSEMBLYAI_API_KEY ? 'Disponible' : 'Manquante')
    
    const response = await axios.get(`${ASSEMBLYAI_API_URL}/account`, {
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY
      },
      timeout: 5000
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
      params: { audioUrl: videoUrl }
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
    console.log('Début du processus de transcription pour:', videoUrl)
    
    // Vérifier d'abord le statut du compte
    await checkAccountStatus()
    console.log('Statut du compte vérifié avec succès')

    // Extraire l'ID de la vidéo de l'URL
    const videoId = extractVideoId(videoUrl)
    if (!videoId) {
      throw new Error('URL YouTube invalide, impossible d\'extraire l\'ID de la vidéo')
    }
    console.log('ID de la vidéo extrait:', videoId)

    // Obtenir l'URL audio
    console.log('Demande d\'extraction de l\'URL audio au serveur backend...')
    const response = await axios.get(`${BACKEND_URL}/api/youtube/audio-url`, {
      params: { audioUrl: videoUrl }
    })
    
    if (!response.data.audioUrl) {
      throw new Error('URL audio non trouvée dans la réponse du serveur')
    }
    
    const publicAudioUrl = response.data.audioUrl
    console.log('URL audio obtenue avec succès:', publicAudioUrl)

    // Utiliser l'API de transcription du backend
    console.log('Envoi de la requête de transcription au backend...')
    
    const transcriptionResponse = await axios.post(
      `${BACKEND_URL}/api/transcribe`,
      { audioUrl: publicAudioUrl },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 180000 // 3 minutes de timeout
      }
    )

    console.log('Réponse de transcription reçue:', transcriptionResponse.status)
    
    if (!transcriptionResponse.data.transcript) {
      console.error('Transcription reçue mais vide')
      throw new Error('Transcription non trouvée dans la réponse')
    }

    // Afficher la transcription complète dans la console
    console.log('=== TRANSCRIPTION COMPLÈTE ===');
    console.log(transcriptionResponse.data.transcript);
    console.log('=== FIN DE LA TRANSCRIPTION ===');
    
    return transcriptionResponse.data.transcript
  } catch (error) {
    console.error('Erreur détaillée lors de la transcription:', error)
    
    // Afficher les détails de la réponse d'erreur si disponible
    if (error.response) {
      console.error('Statut de la réponse d\'erreur:', error.response.status)
      console.error('Données de la réponse d\'erreur:', error.response.data)
      
      // Extraire et propager les messages d'erreur du backend
      if (error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error)
      }
    }
    
    // Si nous avons une erreur avec un message, la propager
    if (error.message) {
      throw error
    }
    
    // Erreur par défaut
    throw new Error('Erreur inconnue lors de la transcription')
  }
}

// Fonction pour extraire l'ID de la vidéo YouTube
function extractVideoId(url) {
  // Format pour youtube.com
  let match = url.match(/[?&]v=([^?&]+)/)
  
  if (match) {
    return match[1]
  }
  
  // Format pour youtu.be
  match = url.match(/youtu\.be\/([^?&]+)/)
  
  if (match) {
    return match[1]
  }
  
  return null
}

// Fonction de test avec une URL audio publique
export const testAssemblyAI = async () => {
  try {
    // Utilisation d'une URL audio publique de test fournie par AssemblyAI
    const testUrl = 'https://storage.googleapis.com/aai-web-samples/news.mp4'
    console.log('Test AssemblyAI avec URL publique:', testUrl)
    
    if (!ASSEMBLYAI_API_KEY) {
      throw new Error('Clé API AssemblyAI manquante')
    }

    // Création d'une transcription de test
    const response = await axios.post(
      `${ASSEMBLYAI_API_URL}/transcript`,
      {
        audio_url: testUrl,
        language_code: 'en'  // Audio de test en anglais
      },
      {
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('Réponse de création de transcription de test:', response.data)
    
    // Attendre et récupérer la transcription complète
    const transcriptId = response.data.id
    let transcript = null
    let attempts = 0
    const maxAttempts = 20
    
    while (!transcript && attempts < maxAttempts) {
      const statusResponse = await axios.get(
        `${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`,
        {
          headers: {
            'Authorization': ASSEMBLYAI_API_KEY
          }
        }
      )
      
      console.log('Statut de la transcription de test:', statusResponse.data.status)
      
      if (statusResponse.data.status === 'completed') {
        transcript = statusResponse.data.text
        console.log('=== TRANSCRIPTION DE TEST COMPLÈTE ===')
        console.log(transcript)
        console.log('=== FIN DE LA TRANSCRIPTION DE TEST ===')
      } else if (statusResponse.data.status === 'error') {
        throw new Error(`Erreur de transcription: ${statusResponse.data.error || 'Erreur inconnue'}`)
      } else {
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 2000))
        attempts++
      }
    }
    
    if (transcript) {
      return 'Test AssemblyAI réussi: transcription créée et récupérée avec succès'
    } else {
      return 'Test AssemblyAI réussi: transcription créée mais non récupérée (délai dépassé)'
    }
  } catch (error) {
    console.error('Échec du test AssemblyAI:', error)
    if (error.response) {
      console.error('Statut de l\'erreur:', error.response.status)
      console.error('Données de l\'erreur:', error.response.data)
    }
    return `Échec du test AssemblyAI: ${error.message}`
  }
}

export const transcribeVideo = async (videoUrl) => {
  try {
    // Vérification de la clé API
    if (!ASSEMBLYAI_API_KEY) {
      throw new Error('Clé API AssemblyAI manquante')
    }

    console.log('Tentative de transcription avec AssemblyAI pour:', videoUrl)
    
    // Vérification si l'URL est une URL YouTube
    const isYouTubeUrl = videoUrl.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)
    
    // Pour les URLs YouTube, AssemblyAI a besoin d'un format spécifique
    let audioUrl = videoUrl
    if (isYouTubeUrl) {
      console.log('URL YouTube détectée, conversion en format compatible...')
      if (videoUrl.includes('youtu.be/')) {
        // Convertir les URLs courtes (youtu.be) en URLs complètes
        const videoId = videoUrl.split('youtu.be/')[1].split('?')[0]
        audioUrl = `https://www.youtube.com/watch?v=${videoId}`
      }
      console.log('URL utilisée pour AssemblyAI:', audioUrl)
    }

    // Envoi de l'URL à AssemblyAI
    const response = await axios.post(
      `${ASSEMBLYAI_API_URL}/transcript`,
      {
        audio_url: audioUrl,
        language_code: 'fr'
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

    // Attente de la fin de la transcription
    let transcript = null
    let retryCount = 0
    const maxRetries = 30 // 30 essais = 150 secondes maximum
    
    while (!transcript && retryCount < maxRetries) {
      try {
        const statusResponse = await axios.get(
          `${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`,
          {
            headers: {
              'Authorization': ASSEMBLYAI_API_KEY
            }
          }
        )

        console.log('Statut de la transcription:', statusResponse.data.status)
        
        if (statusResponse.data.status === 'completed') {
          transcript = statusResponse.data.text
          console.log('Transcription terminée:', transcript?.substring(0, 50) + '...')
        } else if (statusResponse.data.status === 'error') {
          console.error('Erreur retournée par AssemblyAI:', statusResponse.data.error)
          throw new Error(`Erreur AssemblyAI: ${statusResponse.data.error || 'Erreur inconnue'}`)
        } else if (retryCount >= maxRetries - 1) {
          throw new Error('Délai d\'attente dépassé pour la transcription')
        } else {
          console.log(`Attente de la transcription... (essai ${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 5000)) // Attente de 5 secondes
        }
        
        retryCount++
      } catch (pollingError) {
        console.error('Erreur lors de la vérification du statut:', pollingError)
        throw pollingError
      }
    }

    if (!transcript) {
      throw new Error('Transcription non réussie après plusieurs tentatives')
    }

    return transcript
  } catch (error) {
    console.error('Erreur détaillée lors de la transcription:', error)
    
    if (error.response) {
      console.error('Statut de la réponse:', error.response.status)
      console.error('Données de la réponse:', error.response.data)
      
      if (error.response.status === 401) {
        throw new Error('Clé API AssemblyAI invalide')
      } else if (error.response.status === 402) {
        throw new Error('Crédits insuffisants sur le compte AssemblyAI')
      } else if (error.response.status === 400) {
        throw new Error(`Erreur de requête: ${error.response.data.error || 'URL audio invalide'}`)
      } else if (error.response.status === 500) {
        throw new Error('Erreur serveur AssemblyAI')
      }
    }
    
    // Si on arrive ici, c'est une erreur non spécifique
    if (error.message) {
      throw error // Propagation de l'erreur avec son message
    } else {
      throw new Error('Erreur inconnue lors de la transcription')
    }
  }
} 