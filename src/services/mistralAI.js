import axios from 'axios'

const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions'

console.log('Clé API Mistral:', MISTRAL_API_KEY)

export const generateTranscriptSummary = async (transcription) => {
  try {
    console.log('Génération du résumé avec Mistral AI...')
    console.log('Clé API Mistral:', MISTRAL_API_KEY ? 'Disponible' : 'Manquante')

    if (!MISTRAL_API_KEY) {
      throw new Error('Clé API Mistral manquante')
    }

    const response = await axios.post(
      MISTRAL_API_URL,
      {
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en résumé de contenu qui crée des résumés bien structurés, organisés et hiérarchisés.'
          },
          {
            role: 'user',
            content: `Crée un résumé structuré et hiérarchisé de cette transcription de vidéo YouTube. Utilise des sections claires avec des titres et des sous-titres pour organiser l'information. Utilise le format suivant:

# TITRE PRINCIPAL

Introduction brève qui pose le contexte général.

## Section 1
Contenu de la section, paragraphes concis et informatifs.

Points clés:
- Premier point important
- Deuxième point important
- Etc.

## Section 2
...et ainsi de suite.

# CONCLUSION

Synthèse finale des points essentiels.

Assure-toi que:
1. Les titres sont pertinents et reflètent bien le contenu
2. L'information est organisée logiquement
3. Les points clés sont mis en évidence
4. Le résumé reste fidèle au contenu original mais le restructure pour plus de clarté
5. Tu utilises des paragraphes courts et concis

Voici la transcription à résumer:

${transcription}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.2
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
      throw new Error('Clé API Mistral invalide ou expirée')
    }
    throw error
  }
}

export const generateTextSummary = async (text) => {
  try {
    console.log('Génération du résumé de texte avec Mistral AI...')
    console.log('Clé API Mistral:', MISTRAL_API_KEY ? 'Disponible' : 'Manquante')

    if (!MISTRAL_API_KEY) {
      throw new Error('Clé API Mistral manquante')
    }

    const response = await axios.post(
      MISTRAL_API_URL,
      {
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en résumé de contenu qui crée des résumés bien structurés, organisés et hiérarchisés.'
          },
          {
            role: 'user',
            content: `Crée un résumé structuré et hiérarchisé de ce texte. Utilise des sections claires avec des titres et des sous-titres pour organiser l'information. Utilise le format suivant:

# TITRE PRINCIPAL

Introduction brève qui pose le contexte général.

## Section 1
Contenu de la section, paragraphes concis et informatifs.

Points clés:
- Premier point important
- Deuxième point important
- Etc.

## Section 2
...et ainsi de suite.

# CONCLUSION

Synthèse finale des points essentiels.

Assure-toi que:
1. Les titres sont pertinents et reflètent bien le contenu
2. L'information est organisée logiquement
3. Les points clés sont mis en évidence
4. Le résumé reste fidèle au contenu original mais le restructure pour plus de clarté
5. Tu utilises des paragraphes courts et concis

Voici le texte à résumer:

${text}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.2
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
      throw new Error('Clé API Mistral invalide ou expirée')
    }
    throw error
  }
}

export const generateFlashcards = async (text) => {
  try {
    console.log('Génération des flashcards avec Mistral AI...')
    console.log('Clé API Mistral:', MISTRAL_API_KEY ? 'Disponible' : 'Manquante')

    if (!MISTRAL_API_KEY) {
      throw new Error('Clé API Mistral manquante')
    }

    const response = await axios.post(
      MISTRAL_API_URL,
      {
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en création de cartes mémoire éducatives (flashcards). Tu dois créer des flashcards bien formatées et faciles à lire à partir du texte fourni.'
          },
          {
            role: 'user',
            content: `Crée 10 flashcards à partir du texte suivant. Formate-les exactement comme ceci:

Flashcard 1
Question: [texte de la question]
Réponse: [texte de la réponse]

Flashcard 2
Question: [texte de la question]
Réponse: [texte de la réponse]

Et ainsi de suite. Assure-toi que les questions soient claires et concises. Concentre-toi sur les concepts importants du texte.

Texte: ${text}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.5
      },
      {
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    let formattedFlashcards = response.data.choices[0].message.content;
    
    // Post-traitement pour s'assurer que le format est correct
    if (!formattedFlashcards.includes('Flashcard 1')) {
      // Si le modèle n'a pas respecté le format demandé, on reformate
      const flashcardLines = formattedFlashcards.split('\n');
      let newFormat = '';
      let flashcardCount = 1;
      
      for (let i = 0; i < flashcardLines.length; i++) {
        const line = flashcardLines[i].trim();
        if (line.startsWith('Question:') || line.startsWith('Q:')) {
          if (newFormat && !newFormat.endsWith('\n\n')) {
            newFormat += '\n\n';
          }
          newFormat += `Flashcard ${flashcardCount}\n${line}\n`;
          flashcardCount++;
        } else if (line.startsWith('Réponse:') || line.startsWith('R:')) {
          newFormat += `${line}\n`;
        } else if (line && newFormat) {
          // Ligne supplémentaire de réponse ou question
          newFormat += `${line}\n`;
        }
      }
      
      formattedFlashcards = newFormat;
    }
    
    return formattedFlashcards;
  } catch (error) {
    console.error('Erreur lors de la génération des flashcards:', error)
    if (error.response?.status === 401) {
      throw new Error('Clé API Mistral invalide ou expirée')
    }
    throw error
  }
} 