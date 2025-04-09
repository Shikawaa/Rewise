import axios from 'axios'

const MISTRAL_API_KEY = import.meta.env.MISTRAL_API_KEY
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
            content: 'Tu es un expert en résumé de contenu qui crée des résumés bien structurés et organisés. Utilise une structure simple et efficace avec un nombre limité de titres principaux - seulement les plus importants. Tout titre doit avoir un contenu substantiel, jamais un titre sans paragraphe explicatif.'
          },
          {
            role: 'user',
            content: `Crée un résumé structuré de cette transcription de vidéo YouTube avec une hiérarchisation simple et claire. Utilise le format suivant:

# TITRE PRINCIPAL

Introduction brève qui pose le contexte général.

# DÉVELOPPEMENT

Contenu principal organisé en paragraphes concis et informatifs. Ne crée PAS trop de sections, simplifie la structure.

Points clés:
- Premier point important
- Deuxième point important
- Etc.

# CONCLUSION

Synthèse finale des points essentiels.

Assure-toi que:
1. Tu n'utilises QUE les sections essentielles (max 3-4 titres principaux)
2. L'information est organisée logiquement sans trop de niveaux hiérarchiques
3. Les points clés sont mis en évidence uniquement quand nécessaire
4. Le résumé reste fidèle au contenu original mais le restructure pour plus de clarté
5. Tu utilises des paragraphes courts et concis
6. Tu évites de créer une structure trop complexe avec de nombreux sous-titres

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

    // Vérification supplémentaire pour s'assurer qu'aucun titre n'est laissé sans contenu
    let content = response.data.choices[0].message.content;
    
    // Fonction pour détecter et supprimer les titres sans contenu
    const fixEmptyTitles = (text) => {
      const lines = text.split('\n');
      const result = [];
      let skipNextTitle = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Si on a marqué un titre à sauter, vérifier si on est sur un nouveau titre
        if (skipNextTitle) {
          if (line.startsWith('# ') || line.startsWith('## ')) {
            // On continue à sauter
            skipNextTitle = true;
          } else if (line !== '') {
            // Si on a du contenu, on arrête de sauter
            skipNextTitle = false;
            result.push(lines[i]);
          }
          // Si la ligne est vide, on continue à sauter
          continue;
        }
        
        // Détecter si c'est un titre (commence par # ou ##)
        if ((line.startsWith('# ') || line.startsWith('## ')) && i < lines.length - 1) {
          // Vérifier si la ligne suivante est vide ou un autre titre
          const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
          if (nextLine === '' || nextLine.startsWith('# ') || nextLine.startsWith('## ')) {
            // Marquer ce titre pour être sauté
            skipNextTitle = true;
            continue;
          }
        }
        
        // Ajouter la ligne au résultat si elle n'est pas marquée à sauter
        result.push(lines[i]);
      }
      
      return result.join('\n');
    };
    
    content = fixEmptyTitles(content);
    
    return content;
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
            content: `Tu es un expert en résumé de contenu pédagogique qui crée des résumés bien structurés et organisés.
            Tu écris avec un style fluide, simple, sans jargon inutile, comme si tu faisais des fiches de révision.
            Utilise une structure simple et efficace avec un nombre limité de titres principaux - seulement les plus importants.
            Tout titre doit avoir un contenu substantiel, jamais un titre sans paragraphe explicatif.`
          },
          {
            role: 'user',
            content: `Crée un résumé structuré de ce texte avec une hiérarchisation simple et claire. Utilise le format suivant:
            
            # TITRE PRINCIPAL
            Introduction brève qui pose le contexte général.
            
            # DÉVELOPPEMENT
            
            Contenu principal organisé en paragraphes concis et informatifs. Ne crée PAS trop de sections, simplifie la structure.
            
            Points clés : 
            - Premier point important
            - Deuxième point important
            - Etc.
            
            # CONCLUSION

            Synthèse finale des points essentiels.

            Assure-toi que:
            1. Tu n'utilises QUE les sections essentielles (max 3-4 titres principaux)
            2. L'information est organisée logiquement sans trop de niveaux hiérarchiques
            3. Les points clés sont mis en évidence uniquement quand nécessaire
            4. Le résumé reste fidèle au contenu original mais le restructure pour plus de clarté
            5. Tu utilises des paragraphes courts et concis
            6. Tu évites de créer une structure trop complexe avec de nombreux sous-titres

            Voici le texte à résumer:${text}`
          }
        ],
        max_tokens: 10000,
        temperature: 0.2
      },
      {
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    // Vérification supplémentaire pour s'assurer qu'aucun titre n'est laissé sans contenu
    let content = response.data.choices[0].message.content;
    
    // Fonction pour détecter et supprimer les titres sans contenu
    const fixEmptyTitles = (text) => {
      const lines = text.split('\n');
      const result = [];
      let skipNextTitle = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Si on a marqué un titre à sauter, vérifier si on est sur un nouveau titre
        if (skipNextTitle) {
          if (line.startsWith('# ') || line.startsWith('## ')) {
            // On continue à sauter
            skipNextTitle = true;
          } else if (line !== '') {
            // Si on a du contenu, on arrête de sauter
            skipNextTitle = false;
            result.push(lines[i]);
          }
          // Si la ligne est vide, on continue à sauter
          continue;
        }
        
        // Détecter si c'est un titre (commence par # ou ##)
        if ((line.startsWith('# ') || line.startsWith('## ')) && i < lines.length - 1) {
          // Vérifier si la ligne suivante est vide ou un autre titre
          const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
          if (nextLine === '' || nextLine.startsWith('# ') || nextLine.startsWith('## ')) {
            // Marquer ce titre pour être sauté
            skipNextTitle = true;
            continue;
          }
        }
        
        // Ajouter la ligne au résultat si elle n'est pas marquée à sauter
        result.push(lines[i]);
      }
      
      return result.join('\n');
    };
    
    content = fixEmptyTitles(content);
    
    return content;
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
            content: `Tu es un assistant expert en pédagogie et en création de fiches de révision efficaces. 
            Ton objectif est de transformer un contenu résumé (cours, article, vidéo éducative) en un ensemble de flashcards claires, pertinentes et adaptées à la mémorisation à long terme. 
            Les questions doivent porter sur les concepts clés, les définitions importantes, les faits marquants et les idées principales. Les cartes doivent être formulées en français simple et précis.`
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

            Et ainsi de suite. Assure-toi que les questions soient claires et concises. 
            Concentre-toi sur les concepts importants du texte.

            Texte: ${text}`
          }
        ],
        max_tokens: 10000,
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