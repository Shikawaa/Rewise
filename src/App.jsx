import { useState } from 'react'
import { VideoIcon, FileTextIcon, ActivityLogIcon } from "@radix-ui/react-icons"
import { transcribeYouTubeVideo } from './services/assemblyAI'
import { generateTranscriptSummary, generateTextSummary, generateFlashcards } from './services/mistralAI'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Input, Textarea } from './components/ui/input'
import { Markdown } from './components/ui/Markdown'
import FlashcardList from './components/FlashcardList'

function App() {
  // Inputs
  const [youtubeInput, setYoutubeInput] = useState('')
  const [textInput, setTextInput] = useState('')
  
  // États pour le mode YouTube
  const [youtubeTranscript, setYoutubeTranscript] = useState('')
  const [youtubeSummary, setYoutubeSummary] = useState('')
  const [youtubeFlashcards, setYoutubeFlashcards] = useState('')
  const [youtubeIsLoading, setYoutubeIsLoading] = useState(false)
  const [youtubeIsLoadingFlashcards, setYoutubeIsLoadingFlashcards] = useState(false)
  
  // États pour le mode Texte
  const [textTranscript, setTextTranscript] = useState('')
  const [textSummary, setTextSummary] = useState('')
  const [textFlashcards, setTextFlashcards] = useState('')
  const [textIsLoading, setTextIsLoading] = useState(false)
  const [textIsLoadingFlashcards, setTextIsLoadingFlashcards] = useState(false)
  
  // États communs
  const [error, setError] = useState('')
  const [inputType, setInputType] = useState('youtube') // 'youtube' ou 'text'

  // Obtenir les états actifs en fonction du mode
  const getActiveInput = () => inputType === 'youtube' ? youtubeInput : textInput;
  const getActiveTranscript = () => inputType === 'youtube' ? youtubeTranscript : textTranscript;
  const getActiveSummary = () => inputType === 'youtube' ? youtubeSummary : textSummary;
  const getActiveFlashcards = () => inputType === 'youtube' ? youtubeFlashcards : textFlashcards;
  const getIsLoading = () => inputType === 'youtube' ? youtubeIsLoading : textIsLoading;
  const getIsLoadingFlashcards = () => inputType === 'youtube' ? youtubeIsLoadingFlashcards : textIsLoadingFlashcards;

  // Mettre à jour les états actifs
  const setActiveTranscript = (value) => {
    if (inputType === 'youtube') {
      setYoutubeTranscript(value);
    } else {
      setTextTranscript(value);
    }
  };
  
  const setActiveSummary = (value) => {
    if (inputType === 'youtube') {
      setYoutubeSummary(value);
    } else {
      setTextSummary(value);
    }
  };
  
  const setActiveFlashcards = (value) => {
    if (inputType === 'youtube') {
      setYoutubeFlashcards(value);
    } else {
      setTextFlashcards(value);
    }
  };
  
  const setActiveIsLoading = (value) => {
    if (inputType === 'youtube') {
      setYoutubeIsLoading(value);
    } else {
      setTextIsLoading(value);
    }
  };
  
  const setActiveIsLoadingFlashcards = (value) => {
    if (inputType === 'youtube') {
      setYoutubeIsLoadingFlashcards(value);
    } else {
      setTextIsLoadingFlashcards(value);
    }
  };

  const handleGenerate = async () => {
    // Récupérer l'input correspondant au mode actuel
    const input = getActiveInput();
    if (!input.trim()) {
      setError('Veuillez entrer ' + (inputType === 'youtube' ? 'une URL YouTube' : 'du texte'));
      return;
    }

    // Réinitialiser les états du mode actif
    setActiveIsLoading(true)
    setError('')
    setActiveSummary('')
    setActiveFlashcards('')
    setActiveTranscript('')

    try {
      if (inputType === 'youtube') {
        // Traitement d'une URL YouTube
        console.log('Début de la transcription de la vidéo YouTube...')
        console.log('URL fournie:', input)
        
        // Validation basique de l'URL YouTube
        if (!input.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)) {
          throw new Error('URL YouTube invalide. Veuillez fournir une URL au format https://www.youtube.com/watch?v=...')
        }
        
        const transcription = await transcribeYouTubeVideo(input)
        console.log('Transcription obtenue:', transcription ? 'OK' : 'ÉCHEC')
        
        // Stocker la transcription pour une utilisation ultérieure
        setYoutubeTranscript(transcription)
        
        // Génération du résumé spécifique pour les transcriptions
        console.log('Génération du résumé de la transcription...')
        const transcriptSummary = await generateTranscriptSummary(transcription)
        setYoutubeSummary(transcriptSummary)
      } else {
        // Traitement d'un texte collé
        console.log('Traitement du texte collé...')
        
        // Stocker le texte pour une utilisation ultérieure
        setTextTranscript(input)
        
        // Génération du résumé spécifique pour les textes
        console.log('Génération du résumé du texte...')
        const textSummary = await generateTextSummary(input)
        setTextSummary(textSummary)
      }
      
      // Faire défiler la page vers le titre "Résumé" après un court délai
      setTimeout(() => {
        // Cibler directement le CardHeader qui contient le titre "Résumé"
        const summaryHeader = document.querySelector('.summary-card > div > header');
        if (summaryHeader) {
          // Ajouter un petit décalage vertical pour voir complètement le titre et le bouton
          const yOffset = -20; // décalage de 20px vers le haut
          const y = summaryHeader.getBoundingClientRect().top + window.pageYOffset + yOffset;
          
          window.scrollTo({
            top: y,
            behavior: 'smooth'
          });
        } else {
          // Fallback au cas où la structure DOM aurait changé
          const summaryCard = document.querySelector('.summary-card');
          if (summaryCard) {
            const yOffset = -20;
            const y = summaryCard.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({
              top: y,
              behavior: 'smooth'
            });
          }
        }
      }, 300);
      
    } catch (error) {
      console.error('Erreur:', error)
      setError(error.message || 'Une erreur est survenue')
    } finally {
      setActiveIsLoading(false)
    }
  }
  
  const handleGenerateFlashcards = async () => {
    const transcript = getActiveTranscript();
    if (!transcript) {
      setError('Veuillez d\'abord générer un résumé pour obtenir des flashcards')
      return
    }
    
    setActiveIsLoadingFlashcards(true)
    setError('')
    setActiveFlashcards('')
    
    try {
      console.log('Génération des flashcards...')
      const generatedFlashcards = await generateFlashcards(transcript)
      setActiveFlashcards(generatedFlashcards)
      
      // Afficher la notification de succès
      showFlashcardsGeneratedNotification();
      
      // Faire défiler la page vers la section des flashcards
      setTimeout(() => {
        const flashcardsContainer = document.querySelector('.bounce-in');
        if (flashcardsContainer) {
          const header = flashcardsContainer.querySelector('h2') || flashcardsContainer.querySelector('header');
          if (header) {
            header.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            flashcardsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 300);
    } catch (error) {
      console.error('Erreur lors de la génération des flashcards:', error)
      setError('Erreur lors de la génération des flashcards: ' + (error.message || 'Une erreur est survenue'))
    } finally {
      setActiveIsLoadingFlashcards(false)
    }
  }

  const handleDownload = () => {
    const flashcards = getActiveFlashcards();
    if (!flashcards) {
      console.error('Aucune flashcard à télécharger');
      return;
    }

    try {
      // Formater les flashcards pour le téléchargement
      let downloadContent = 'FLASHCARDS - REWISE\n\n';
      
      // Traiter chaque flashcard
      const cards = flashcards.split(/Flashcard \d+/).filter(card => card.trim());
      console.log(`Préparation de ${cards.length} flashcards pour le téléchargement`);
      
      cards.forEach((card, index) => {
        const questionMatch = card.match(/Question: (.+?)(?=\nRéponse:|\n\n|$)/s);
        const answerMatch = card.match(/Réponse: (.+?)(?=\n\n|$)/s);
        
        const question = questionMatch ? questionMatch[1].trim() : '';
        const answer = answerMatch ? answerMatch[1].trim() : '';
        
        if (question || answer) {
          downloadContent += `FLASHCARD ${index + 1}\n`;
          downloadContent += question ? `Question: ${question}\n` : '';
          downloadContent += answer ? `Réponse: ${answer}\n` : '';
          downloadContent += '\n';
        }
      });
      
      // Générer un nom de fichier qui inclut le type de contenu
      const contentType = inputType === 'youtube' ? 'youtube' : 'texte';
      const filename = `flashcards_${contentType}_${new Date().toISOString().slice(0,10)}.txt`;
      
      // Approche simplifiée de téléchargement
      // Créer un élément invisible mais fonctionnel
      const element = document.createElement('a');
      
      // Créer l'URL de l'objet blob
      const file = new Blob([downloadContent], {type: 'text/plain;charset=utf-8'});
      const fileURL = URL.createObjectURL(file);
      
      // Configuration de l'élément de téléchargement
      element.href = fileURL;
      element.download = filename; 
      element.target = '_blank';
      
      // Ajouter à la page
      document.body.appendChild(element);
      
      // Déclencher le téléchargement
      console.log('Clic sur l\'élément de téléchargement...');
      element.click();
      
      // Attendre plus longtemps avant de nettoyer
      console.log('Attente avant nettoyage des ressources...');
      
      // Maintenir l'élément dans le DOM pendant 2 secondes
      setTimeout(() => {
        console.log('Nettoyage des ressources de téléchargement');
        URL.revokeObjectURL(fileURL);
        document.body.removeChild(element);
        
        // Afficher la notification de succès
        showDownloadNotification();
      }, 2000);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      // Afficher une notification d'erreur
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md fade-in';
      errorMessage.style.zIndex = 1000;
      errorMessage.innerHTML = `<div class="flex items-center"><span>Erreur de téléchargement: ${error.message}</span></div>`;
      document.body.appendChild(errorMessage);
      
      setTimeout(() => {
        if (document.body.contains(errorMessage)) {
          document.body.removeChild(errorMessage);
        }
      }, 3000);
    }
  };
  
  // Fonction pour afficher la notification de téléchargement réussi
  const showDownloadNotification = () => {
    // Créer l'élément de notification
    const message = document.createElement('div');
    message.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-green-500 text-gray-800 px-6 py-5 rounded-lg shadow-xl z-50';
    message.style.minWidth = '300px';
    message.style.animation = 'fadeInOut 4s ease-in-out';
    
    // Ajouter un style pour l'animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -40%); }
        15% { opacity: 1; transform: translate(-50%, -50%); }
        85% { opacity: 1; transform: translate(-50%, -50%); }
        100% { opacity: 0; transform: translate(-50%, -60%); }
      }
    `;
    document.head.appendChild(style);
    
    // Contenu de la notification avec icône plus grande et texte plus visible
    message.innerHTML = `
      <div class="flex flex-col items-center text-center">
        <div class="bg-green-100 p-3 rounded-full mb-3">
          <svg class="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h3 class="text-lg font-bold mb-1">Téléchargement réussi!</h3>
        <p class="text-gray-600">Vos flashcards ont été enregistrées</p>
      </div>
    `;
    
    // Ajouter au DOM
    document.body.appendChild(message);
    
    // Supprimer le message et le style après l'animation
    setTimeout(() => {
      if (document.body.contains(message)) {
        document.body.removeChild(message);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    }, 4000);
    
    console.log('Notification de téléchargement améliorée affichée');
  };

  // Fonction pour afficher la notification de génération des flashcards
  const showFlashcardsGeneratedNotification = () => {
    // Créer l'élément de notification
    const message = document.createElement('div');
    message.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-purple-500 text-gray-800 px-6 py-5 rounded-lg shadow-xl z-50';
    message.style.minWidth = '300px';
    message.style.animation = 'fadeInOut 3s ease-in-out';
    
    // Ajouter un style pour l'animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -40%); }
        15% { opacity: 1; transform: translate(-50%, -50%); }
        85% { opacity: 1; transform: translate(-50%, -50%); }
        100% { opacity: 0; transform: translate(-50%, -60%); }
      }
    `;
    document.head.appendChild(style);
    
    // Contenu de la notification
    message.innerHTML = `
      <div class="flex flex-col items-center text-center">
        <div class="bg-purple-100 p-3 rounded-full mb-3">
          <svg class="h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-bold mb-1">Flashcards générées !</h3>
        <p class="text-gray-600">Vos flashcards sont prêtes à être utilisées</p>
      </div>
    `;
    
    // Ajouter au DOM
    document.body.appendChild(message);
    
    // Supprimer le message et le style après l'animation
    setTimeout(() => {
      if (document.body.contains(message)) {
        document.body.removeChild(message);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    }, 3000);
    
    console.log('Notification de génération des flashcards affichée');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto max-w-screen-xl px-6 py-4 flex items-center">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-600">
              <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M11 7.5H18C20.2091 7.5 22 9.29086 22 11.5C22 13.7091 20.2091 15.5 18 15.5H15L21 24.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 7.5V24.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 15.5H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M24 9C18 15 18 17 24 23" stroke="#9F7AEA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-xl font-semibold text-purple-600">Rewise</h1>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto max-w-screen-xl px-6 py-8">
        <div className="space-y-8">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant={inputType === 'youtube' ? 'default' : 'outline'}
                    onClick={() => {
                      // Juste changer le mode sans réinitialiser les résultats
                      setInputType('youtube');
                      setError('');
                    }}
                    className="flex items-center gap-2"
                    aria-label="Mode YouTube"
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-current"
                    >
                      <rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
                      <path d="M10 9.5L15 12L10 14.5V9.5Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    YouTube
                  </Button>
                  <Button 
                    variant={inputType === 'text' ? 'default' : 'outline'}
                    onClick={() => {
                      // Juste changer le mode sans réinitialiser les résultats
                      setInputType('text');
                      setError('');
                    }}
                    className="flex items-center gap-2"
                    aria-label="Mode Texte"
                  >
                    <FileTextIcon className="h-4 w-4" />
                    Texte
                  </Button>
                </div>
                
                {inputType === 'youtube' ? (
                  <Input
                    placeholder="Entrez l'URL de la vidéo YouTube"
                    value={youtubeInput}
                    onChange={(e) => setYoutubeInput(e.target.value)}
                    className="text-gray-800"
                  />
                ) : (
                  <Textarea
                    placeholder="Collez votre texte ici"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={6}
                    className="text-gray-800"
                  />
                )}
                
                <Button 
                  onClick={handleGenerate}
                  disabled={!getActiveInput() || getIsLoading()}
                  fullWidth
                  size="lg"
                  aria-label="Générer le résumé"
                  className="transition-all duration-200 ease-in-out hover:scale-[1.01] shadow-sm"
                >
                  {getIsLoading() ? 'Traitement en cours...' : 'Générer le résumé'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {error && (
            <Card className="border-red-300 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}
          
          {getActiveSummary() && (
            <div className="space-y-6">
              <Card className="fade-in summary-card animate-summary">
                <CardHeader className="flex flex-row items-center justify-between p-6 pb-0">
                  <CardTitle className="text-3xl font-bold">Résumé</CardTitle>
                  <Button
                    onClick={handleGenerateFlashcards}
                    disabled={getIsLoadingFlashcards()}
                    aria-label="Générer des flashcards"
                    size="md"
                    className="hover:scale-[1.02] transition-transform"
                  >
                    {getIsLoadingFlashcards() ? 'Génération...' : 'Générer des flashcards'}
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <Markdown content={getActiveSummary()} className="prose max-w-none text-reveal prose-headings:mt-8 prose-p:mb-6 prose-headings:mb-4 prose-h2:mt-10 [&_h2:last-of-type]:mt-14 [&_p:last-of-type]:mt-10 [&_p:last-of-type]:pt-4 prose-ul:-mt-6 prose-ol:-mt-6 prose-li:mt-1" />
                </CardContent>
              </Card>
              
              {getActiveFlashcards() && (
                <div className="bounce-in">
                  <FlashcardList 
                    flashcards={getActiveFlashcards()} 
                    onDownload={handleDownload}
                    useStaggeredAnimation={true}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
