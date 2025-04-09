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
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState('')
  const [flashcards, setFlashcards] = useState('')
  const [transcript, setTranscript] = useState('')
  const [inputType, setInputType] = useState('youtube') // 'youtube' ou 'text'

  const handleGenerate = async () => {
    // Réinitialiser tous les états au début
    setIsLoading(true)
    setError('')
    setSummary('')
    setFlashcards('')
    setTranscript('')

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
        setTranscript(transcription)
        
        // Génération du résumé spécifique pour les transcriptions
        console.log('Génération du résumé de la transcription...')
        const transcriptSummary = await generateTranscriptSummary(transcription)
        setSummary(transcriptSummary)
      } else {
        // Traitement d'un texte collé
        console.log('Traitement du texte collé...')
        
        // Stocker le texte pour une utilisation ultérieure
        setTranscript(input)
        
        // Génération du résumé spécifique pour les textes
        console.log('Génération du résumé du texte...')
        const textSummary = await generateTextSummary(input)
        setSummary(textSummary)
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError(error.message || 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleGenerateFlashcards = async () => {
    if (!transcript) {
      setError('Veuillez d\'abord générer un résumé pour obtenir des flashcards')
      return
    }
    
    setIsLoadingFlashcards(true)
    setError('')
    setFlashcards('')
    
    try {
      console.log('Génération des flashcards...')
      const generatedFlashcards = await generateFlashcards(transcript)
      setFlashcards(generatedFlashcards)
    } catch (error) {
      console.error('Erreur lors de la génération des flashcards:', error)
      setError('Erreur lors de la génération des flashcards: ' + (error.message || 'Une erreur est survenue'))
    } finally {
      setIsLoadingFlashcards(false)
    }
  }

  const handleDownload = () => {
    if (!flashcards) {
      console.error('Aucune flashcard à télécharger');
      return;
    }

    try {
      // Formater les flashcards pour le téléchargement
      let downloadContent = 'FLASHCARDS - SIMPLIFIED KNOWLEDGE\n\n';
      
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
      
      console.log('Contenu du fichier préparé pour téléchargement');
      
      // Approche simplifiée de téléchargement
      const filename = `flashcards_${new Date().toISOString().slice(0,10)}.txt`;
      
      // Créer un élément invisible mais fonctionnel
      const element = document.createElement('a');
      
      // Créer l'URL de l'objet blob
      const file = new Blob([downloadContent], {type: 'text/plain;charset=utf-8'});
      const fileURL = URL.createObjectURL(file);
      
      // Configuration de l'élément de téléchargement
      element.href = fileURL;
      element.download = filename; 
      element.target = '_blank';
      
      // Ajouter à la page (mais sans le cacher)
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

  // Fonction pour générer des flashcards de test
  const handleTestFlashcards = () => {
    const testFlashcards = `Flashcard 1
Question: Qu'est-ce que React?
Réponse: React est une bibliothèque JavaScript pour construire des interfaces utilisateur, développée par Facebook.

Flashcard 2
Question: Quelle est la différence entre props et state dans React?
Réponse: Les props sont transmises d'un composant parent à un composant enfant et sont immuables, tandis que le state est géré à l'intérieur d'un composant et peut changer.

Flashcard 3
Question: Qu'est-ce qu'un hook dans React?
Réponse: Les hooks sont des fonctions qui permettent aux composants fonctionnels d'utiliser l'état et d'autres fonctionnalités de React sans écrire une classe.`;

    setTranscript("Test de transcription");
    setFlashcards(testFlashcards);
    console.log("Flashcards de test générées");
  };

  // Fonction pour tester l'ensemble du processus avec un transcript prédéfini
  const handleTestComplet = async () => {
    setIsLoading(true);
    setError('');
    setSummary('');
    setFlashcards('');
    
    const testTranscript = `Le React est une bibliothèque JavaScript développée par Facebook qui est devenue l'un des outils les plus populaires pour créer des interfaces utilisateur web.

React utilise un paradigme de programmation déclaratif, où les développeurs décrivent à quoi l'interface utilisateur devrait ressembler, et React s'occupe de mettre à jour le DOM quand les données sous-jacentes changent. Cette approche est différente du développement impératif traditionnel.

Le concept central dans React est le composant, qui est une unité réutilisable et indépendante qui encapsule une partie de l'interface utilisateur. Les composants peuvent être assemblés comme des blocs de construction pour créer des applications complexes.

React utilise un DOM virtuel pour améliorer les performances. Au lieu de mettre à jour directement le DOM du navigateur, React crée une représentation virtuelle du DOM en mémoire, calcule les différences avant et après un changement d'état, puis met à jour le DOM réel de la manière la plus efficace possible.

Les hooks, introduits dans React 16.8, permettent aux composants fonctionnels d'utiliser les fonctionnalités qui étaient auparavant réservées aux composants de classe, comme l'état et les effets secondaires.`;
    
    try {
      // Définir le transcript
      console.log('Utilisation du transcript de test');
      setTranscript(testTranscript);
      
      // Générer le résumé
      console.log('Génération du résumé à partir du transcript de test');
      const testSummary = await generateTextSummary(testTranscript);
      setSummary(testSummary);
      
      // Générer les flashcards
      console.log('Génération des flashcards à partir du transcript de test');
      const generatedFlashcards = await generateFlashcards(testTranscript);
      setFlashcards(generatedFlashcards);
      
      console.log('Test complet terminé avec succès');
    } catch (error) {
      console.error('Erreur pendant le test complet:', error);
      setError('Erreur pendant le test: ' + (error.message || 'Une erreur est survenue'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto max-w-screen-xl px-6 py-4 flex items-center">
          <div className="flex items-center gap-2">
            <ActivityLogIcon className="h-6 w-6 text-purple-600" />
            <h1 className="text-xl font-semibold">Simplified Knowledge</h1>
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
                      // Réinitialiser les états lors du changement de mode
                      setInputType('youtube');
                      setSummary('');
                      setFlashcards('');
                      setTranscript('');
                      setError('');
                    }}
                    className="flex items-center gap-2"
                    aria-label="Mode YouTube"
                  >
                    <VideoIcon className="h-4 w-4" />
                    YouTube
                  </Button>
                  <Button 
                    variant={inputType === 'text' ? 'default' : 'outline'}
                    onClick={() => {
                      // Réinitialiser les états lors du changement de mode
                      setInputType('text');
                      setSummary('');
                      setFlashcards('');
                      setTranscript('');
                      setError('');
                    }}
                    className="flex items-center gap-2"
                    aria-label="Mode Texte"
                  >
                    <FileTextIcon className="h-4 w-4" />
                    Texte
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleTestComplet}
                    className="flex items-center gap-2 ml-auto"
                    aria-label="Test Complet"
                  >
                    Test Complet
                  </Button>
                </div>
                
                {inputType === 'youtube' ? (
                  <Input
                    placeholder="Entrez l'URL de la vidéo YouTube"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="text-gray-800"
                  />
                ) : (
                  <Textarea
                    placeholder="Collez votre texte ici"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={6}
                    className="text-gray-800"
                  />
                )}
                
                <Button 
                  onClick={handleGenerate}
                  disabled={!input || isLoading}
                  fullWidth
                  aria-label="Générer le résumé"
                  className="transition-all duration-200 ease-in-out"
                >
                  {isLoading ? 'Traitement en cours...' : 'Générer le résumé'}
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
          
          {summary && (
            <div className="space-y-6">
              <Card className="fade-in">
                <CardHeader className="flex flex-row items-center justify-between p-6 pb-0">
                  <CardTitle>Résumé</CardTitle>
                  <Button
                    onClick={handleGenerateFlashcards}
                    disabled={isLoadingFlashcards}
                    aria-label="Générer des flashcards"
                  >
                    {isLoadingFlashcards ? 'Génération...' : 'Générer des flashcards'}
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <Markdown content={summary} className="prose max-w-none" />
                </CardContent>
              </Card>
              
              {flashcards && (
                <div className="fade-in">
                  <FlashcardList 
                    flashcards={flashcards} 
                    onDownload={handleDownload}
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
