import axios from 'axios'

const MISTRAL_API_KEY = '4t6I3WEaaOaRObul3YsjtNmcjmYol5tP'
const MISTRAL_API_URL = 'https://api.mistral.ai/v1'

const mistralAI = axios.create({
  baseURL: MISTRAL_API_URL,
  headers: {
    'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    'Content-Type': 'application/json',
  },
})

export const generateSummary = async (text) => {
  try {
    const response = await mistralAI.post('/chat/completions', {
      model: 'mistral-tiny',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en résumé de texte. Ton rôle est de créer un résumé concis et clair du texte fourni.'
        },
        {
          role: 'user',
          content: `Résume le texte suivant de manière concise et claire :\n\n${text}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('Erreur lors de la génération du résumé:', error)
    throw error
  }
}

export const generateFlashcards = async (text) => {
  try {
    const response = await mistralAI.post('/chat/completions', {
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
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('Erreur lors de la génération des flashcards:', error)
    throw error
  }
} 