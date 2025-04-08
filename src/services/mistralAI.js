import axios from 'axios'

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions'

console.log('Clé API Mistral:', MISTRAL_API_KEY)

export const generateSummary = async (transcription) => {
  try {
    const response = await axios.post(
      MISTRAL_API_URL,
      {
        model: 'mistral-tiny',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en résumé de contenu. Ton rôle est de créer un résumé clair et concis du texte fourni, en mettant en évidence les points clés.'
          },
          {
            role: 'user',
            content: `Voici la transcription d'une vidéo YouTube. Peux-tu en faire un résumé structuré et détaillé ?\n\n${transcription}`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('Erreur lors de la génération du résumé:', error)
    if (error.response?.status === 401) {
      throw new Error('Clé API Mistral invalide ou manquante')
    }
    throw new Error('Impossible de générer le résumé')
  }
}

export const generateFlashcards = async (text) => {
  try {
    const response = await axios.post(
      MISTRAL_API_URL,
      {
        model: 'mistral-tiny',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en création de flashcards. Ton rôle est de créer des questions/réponses basées sur le texte fourni.'
          },
          {
            role: 'user',
            content: `Crée 5 flashcards (questions/réponses) basées sur le texte suivant. Format : Question: [question] Réponse: [réponse]\n\n${text}`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('Erreur lors de la génération des flashcards:', error)
    if (error.response?.status === 401) {
      throw new Error('Clé API Mistral invalide ou manquante')
    }
    throw error
  }
} 