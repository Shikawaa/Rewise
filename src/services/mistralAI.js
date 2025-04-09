import axios from 'axios'

const MISTRAL_API_KEY = import.meta.env.MISTRAL_API_KEY
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions'
const MISTRAL_MODEL = 'mistral-large-latest'

// Configuration par défaut pour les appels à l'API Mistral
const DEFAULT_CONFIG = {
  model: MISTRAL_MODEL,
  max_tokens: 10000,
  temperature: 0.2,
}

// Prompt système pour les résumés
const SUMMARY_SYSTEM_PROMPT = `Tu es un expert en synthèse de contenu qui structure l'information de manière claire et hiérarchisée avec un format Markdown soigné.

Ton objectif est de produire des résumés qui soient:
1. Fidèles au contenu original et informatifs
2. Bien structurés avec une hiérarchie visuelle (titres, sous-titres)
3. Faciles à lire avec des paragraphes bien développés et des listes à puces
4. Complets et substantiels, couvrant les points essentiels sans simplification excessive
5. Capables de transmettre les nuances et complexités du contenu original`

// Template pour les résumés
const SUMMARY_TEMPLATE = `Crée un résumé structuré, substantiel et informatif en Markdown du contenu suivant.

Le résumé doit être de haute qualité, semblable à un article de blog bien écrit. Il s'adresse à quelqu'un qui veut comprendre le contenu sans le consulter en entier mais en saisissant toutes les informations importantes.

Respecte impérativement ce format:

# TITRE PRINCIPAL ACCROCHEUR

Introduction développée qui pose le contexte général et présente les enjeux principaux (3-5 phrases).

## [Titre thématique explicite et pertinent]

Paragraphe détaillé et substantiel présentant les concepts principaux de cette thématique. Ne pas hésiter à développer sur 6-8 phrases pour couvrir les points complexes de manière claire. Inclure des exemples concrets si pertinents.

Points clés:
- Premier point important (une phrase complète et informative)
- Deuxième point important (avec contexte si nécessaire)
- Etc.

## [Autre titre thématique pertinent]
Développement approfondi d'un autre aspect important du contenu (6-8 phrases). Assure-toi d'offrir un niveau de détail qui permettrait à quelqu'un qui n'a pas vu la vidéo/lu le texte original de vraiment comprendre le sujet.

Paragraphe de conclusion synthétisant les points essentiels et offrant une perspective globale (4-5 phrases). Cette conclusion doit apporter une vraie valeur ajoutée et ne pas être une simple répétition.

Exigences techniques:
1. Les titres doivent être pertinents et descriptifs (jamais numérotés comme "Section 1")
2. L'information doit être organisée logiquement avec 2-3 sections principales maximum
3. Les points clés doivent être mis en évidence sous forme de listes
4. Pour un contenu de 20 minutes de vidéo, le résumé doit être substantiel (au moins 300-400 mots)
5. Utilise correctement la syntaxe Markdown: # pour titre principal, ## pour sections
6. La conclusion doit être un paragraphe final sans titre spécifique
7. Évite les simplifications excessives qui feraient perdre la valeur du contenu original
8. N'utilise JAMAIS le format "**terme**:" pour mettre en évidence des concepts

Contenu à résumer: {{content}}`

// Prompt système pour les flashcards
const FLASHCARD_SYSTEM_PROMPT = `Tu es un expert en création de flashcards éducatives qui extrait les concepts clés d'un contenu et les transforme en questions/réponses efficaces pour l'apprentissage.`

// Template pour les flashcards
const FLASHCARD_TEMPLATE = `Crée exactement 10 flashcards à partir du contenu suivant.

Respecte impérativement ce format pour chaque flashcard:

Flashcard 1
Question: [Question concise et précise]
Réponse: [Réponse complète mais concise]

Flashcard 2
Question: [Question concise et précise]
Réponse: [Réponse complète mais concise]

Exigences:
1. Numérote chaque flashcard de 1 à 10
2. Utilise exactement le format "Flashcard X", puis "Question:" et "Réponse:" sur des lignes séparées
3. Concentre-toi sur les concepts essentiels et importants
4. Les questions doivent être claires et directes
5. Les réponses doivent être informatives mais concises

Contenu: {{content}}`

/**
 * Appelle l'API Mistral avec les paramètres fournis
 * @param {string} systemPrompt - Le prompt système pour définir le comportement du modèle
 * @param {string} userPrompt - Le prompt utilisateur contenant les instructions et le contenu
 * @param {Object} config - Configuration supplémentaire pour l'API
 * @returns {Promise<string>} - Le contenu généré
 */
const callMistralAPI = async (systemPrompt, userPrompt, config = {}) => {
  try {
    // Vérification de la clé API
    if (!MISTRAL_API_KEY) {
      throw new Error("Clé API Mistral manquante dans les variables d'environnement")
    }

    console.log(`Appel de l'API Mistral (${MISTRAL_MODEL})...`)
    
    // Fusion de la configuration par défaut avec la configuration personnalisée
    const apiConfig = { ...DEFAULT_CONFIG, ...config }
    
    const response = await axios.post(
      MISTRAL_API_URL,
      {
        ...apiConfig,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
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

    // Validation de la réponse
    if (!response.data || !response.data.choices || !response.data.choices[0]?.message?.content) {
      throw new Error('Format de réponse Mistral invalide')
    }

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('Erreur lors de l\'appel à l\'API Mistral:', error)
    
    // Gestion détaillée des erreurs
    if (!error.response) {
      throw new Error(`Erreur réseau: ${error.message}`)
    }
    
    switch (error.response?.status) {
      case 401:
        throw new Error('Authentification échouée: clé API Mistral invalide ou expirée')
      case 403:
        throw new Error('Accès refusé: votre compte n\'a pas les permissions nécessaires')
      case 429:
        throw new Error('Quota dépassé: limite d\'appels API atteinte')
      case 500:
      case 502:
      case 503:
      case 504:
        throw new Error(`Erreur serveur Mistral (${error.response.status}): veuillez réessayer plus tard`)
      default:
        throw new Error(`Erreur API Mistral (${error.response?.status || 'inconnue'}): ${error.message}`)
    }
  }
}

/**
 * Valide et nettoie le format Markdown d'un résumé
 * @param {string} summary - Le résumé à valider
 * @returns {string} - Le résumé nettoyé et validé
 */
const validateSummaryFormat = (summary) => {
  if (!summary) return ''

  let validatedSummary = summary
  
  // Vérifier la présence de titres et sections
  const hasTitles = /^#\s.+/m.test(summary)
  const hasSections = /^##\s.+/m.test(summary)
  
  if (!hasTitles || !hasSections) {
    console.warn('Le résumé ne respecte pas le format Markdown attendu (titres manquants)')
  }
  
  // Vérifier et améliorer l'espacement
  validatedSummary = validatedSummary
    // Assurer une ligne vide après les titres
    .replace(/^(#.+)$(?!\n\n)/gm, '$1\n')
    // Assurer une ligne vide avant les titres (sauf début)
    .replace(/([^\n])\n(#)/g, '$1\n\n$2')
    // Assurer des listes à puces bien formatées
    .replace(/^(\s*[-*]\s.+)$(?!\n)/gm, '$1\n')
    // Corriger les problèmes courants de formatage gras
    .replace(/\*\*([^*:]+):\*\*/g, '**$1**:')
    // Assurer que les termes en gras sont correctement formatés
    .replace(/\*\*([^*]+)\*\*(\s*):(\s*)/g, '**$1**: ')
    
  return validatedSummary.trim()
}

/**
 * Valide et nettoie le format des flashcards
 * @param {string} flashcards - Les flashcards à valider
 * @returns {string} - Les flashcards nettoyées et validées
 */
const validateFlashcardFormat = (flashcards) => {
  if (!flashcards) return ''
  
  // Vérifier le format de base
  const hasCorrectFormat = /^Flashcard\s\d+\s*\nQuestion:\s.+\s*\nRéponse:\s.+/m.test(flashcards)
  
  if (!hasCorrectFormat) {
    console.warn('Les flashcards ne respectent pas le format attendu, tentative de reformatage...')
    
    // Reformater les flashcards
    const lines = flashcards.split('\n')
    let formattedCards = ''
    let cardCount = 1
    let inQuestion = false
    let inAnswer = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.match(/^(flashcard|carte)\s*\d*:?\s*$/i) || 
          (line.match(/^\d+\.?\s*$/) && !inQuestion && !inAnswer)) {
        // Nouvelle flashcard détectée
        if (formattedCards && !formattedCards.endsWith('\n\n')) {
          formattedCards += '\n\n'
        }
        formattedCards += `Flashcard ${cardCount}\n`
        cardCount++
        inQuestion = true
        inAnswer = false
      } 
      else if (line.match(/^q(uestion)?:?\s+/i) || (inQuestion && !line.match(/^r(éponse|eponse)?:?\s+/i) && line)) {
        // Ligne de question
        if (line.match(/^q(uestion)?:?\s+/i)) {
          // Formatter la ligne de question
          formattedCards += `Question: ${line.replace(/^q(uestion)?:?\s+/i, '')}\n`
        } else if (inQuestion) {
          // Suite de la question
          formattedCards += `${line}\n`
        }
        inQuestion = true
        inAnswer = false
      }
      else if (line.match(/^r(éponse|eponse)?:?\s+/i) || (inAnswer && line)) {
        // Ligne de réponse
        if (line.match(/^r(éponse|eponse)?:?\s+/i)) {
          // Formatter la ligne de réponse
          formattedCards += `Réponse: ${line.replace(/^r(éponse|eponse)?:?\s+/i, '')}\n`
          inQuestion = false
          inAnswer = true
        } else if (inAnswer) {
          // Suite de la réponse
          formattedCards += `${line}\n`
        }
      }
      else if (line === '' && formattedCards) {
        // Ligne vide qui sépare les flashcards
        if (!formattedCards.endsWith('\n\n')) {
          formattedCards += '\n'
        }
      }
    }
    
    return formattedCards.trim()
  }
  
  return flashcards.trim()
}

/**
 * Génère un résumé à partir d'un contenu (texte ou transcription)
 * @param {string} content - Le contenu à résumer
 * @param {string} type - Le type de contenu ('text' ou 'transcript')
 * @returns {Promise<string>} - Le résumé généré
 */
const generateSummary = async (content, type = 'text') => {
  try {
    console.log(`Génération du résumé de ${type}...`)
    
    if (!content || typeof content !== 'string') {
      throw new Error(`Contenu ${type} invalide ou manquant`)
    }
    
    // Ajuster le prompt en fonction du type de contenu
    let userPrompt = SUMMARY_TEMPLATE.replace('{{content}}', content)
    
    if (type === 'transcript') {
      userPrompt = userPrompt.replace('du contenu suivant', 'de cette transcription vidéo')
    }
    
    // Appel à l'API Mistral
    const rawSummary = await callMistralAPI(SUMMARY_SYSTEM_PROMPT, userPrompt)
    
    // Validation et nettoyage du résumé
    return validateSummaryFormat(rawSummary)
  } catch (error) {
    console.error(`Erreur lors de la génération du résumé de ${type}:`, error)
    throw new Error(`Échec de la génération du résumé: ${error.message}`)
  }
}

/**
 * Génère un résumé à partir d'une transcription
 * @param {string} transcription - La transcription à résumer
 * @returns {Promise<string>} - Le résumé généré
 */
export const generateTranscriptSummary = async (transcription) => {
  return generateSummary(transcription, 'transcript')
}

/**
 * Génère un résumé à partir d'un texte
 * @param {string} text - Le texte à résumer
 * @returns {Promise<string>} - Le résumé généré
 */
export const generateTextSummary = async (text) => {
  return generateSummary(text, 'text')
}

/**
 * Génère des flashcards à partir d'un texte
 * @param {string} text - Le texte à partir duquel générer des flashcards
 * @returns {Promise<string>} - Les flashcards générées
 */
export const generateFlashcards = async (text) => {
  try {
    console.log('Génération des flashcards...')
    
    if (!text || typeof text !== 'string') {
      throw new Error('Contenu invalide ou manquant')
    }
    
    // Préparation du prompt pour les flashcards
    const userPrompt = FLASHCARD_TEMPLATE.replace('{{content}}', text)
    
    // Configuration spécifique pour les flashcards
    const config = {
      max_tokens: 1500,
      temperature: 0.5
    }
    
    // Appel à l'API Mistral
    const rawFlashcards = await callMistralAPI(FLASHCARD_SYSTEM_PROMPT, userPrompt, config)
    
    // Validation et nettoyage des flashcards
    return validateFlashcardFormat(rawFlashcards)
  } catch (error) {
    console.error('Erreur lors de la génération des flashcards:', error)
    throw new Error(`Échec de la génération des flashcards: ${error.message}`)
  }
} 