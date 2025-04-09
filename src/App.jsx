import { useState } from 'react'
import { Layout, Typography, Input, Button, Card, Space, message } from 'antd'
import { YoutubeOutlined, FileTextOutlined, DownloadOutlined } from '@ant-design/icons'
import { transcribeYouTubeVideo, testAssemblyAI } from './services/assemblyAI'
import { generateTranscriptSummary, generateTextSummary, generateFlashcards } from './services/mistralAI'
import './App.css'

const { Header, Content } = Layout
const { Title } = Typography
const { TextArea } = Input

function App() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false)
  const [error, setError] = useState('')
  const [testResult, setTestResult] = useState('')
  const [summary, setSummary] = useState('')
  const [flashcards, setFlashcards] = useState('')
  const [transcript, setTranscript] = useState('')
  const [inputType, setInputType] = useState('youtube') // 'youtube' ou 'text'

  const handleTest = async () => {
    setIsLoading(true)
    setTestResult('')
    setError('')
    
    try {
      const result = await testAssemblyAI()
      setTestResult(result)
    } catch (error) {
      console.error('Erreur lors du test:', error)
      setError('Erreur lors du test AssemblyAI: ' + (error.message || 'Une erreur est survenue'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    setIsLoading(true)
    setError('')
    setSummary('')
    setFlashcards('')
    setTranscript('')

    try {
      let content = ''
      
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
        
        // Les flashcards ne sont plus générées automatiquement
      } else {
        // Traitement d'un texte collé
        console.log('Traitement du texte collé...')
        
        // Stocker le texte pour une utilisation ultérieure
        setTranscript(input)
        
        // Génération du résumé spécifique pour les textes
        console.log('Génération du résumé du texte...')
        const textSummary = await generateTextSummary(input)
        setSummary(textSummary)
        
        // Les flashcards ne sont plus générées automatiquement
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
      message.error('Aucune flashcard à télécharger')
      return
    }

    // Formater les flashcards pour le téléchargement
    let downloadContent = 'FLASHCARDS - SIMPLIFIED KNOWLEDGE\n\n';
    
    // Traiter chaque flashcard
    const cards = flashcards.split(/Flashcard \d+/).filter(card => card.trim());
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

    const element = document.createElement('a')
    const file = new Blob([downloadContent], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = 'flashcards.txt'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    
    message.success('Flashcards téléchargées avec succès')
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ backgroundColor: '#fff', padding: '0 20px' }}>
        <Typography.Title level={2}>Simplified Knowledge</Typography.Title>
      </Layout.Header>
      
      <Layout.Content style={{ padding: '20px 50px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space>
                <Button 
                  type={inputType === 'youtube' ? 'primary' : 'default'}
                  icon={<YoutubeOutlined />}
                  onClick={() => setInputType('youtube')}
                >
                  YouTube
                </Button>
                <Button 
                  type={inputType === 'text' ? 'primary' : 'default'}
                  icon={<FileTextOutlined />}
                  onClick={() => setInputType('text')}
                >
                  Texte
                </Button>
              </Space>
              
              {inputType === 'youtube' ? (
                <Input
                  placeholder="Entrez l'URL de la vidéo YouTube"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              ) : (
                <Input.TextArea
                  placeholder="Collez votre texte ici"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={6}
                />
              )}
              
              <Space>
                <Button 
                  type="primary"
                  onClick={handleGenerate}
                  loading={isLoading}
                  disabled={!input}
                  block
                >
                  Générer le résumé
                </Button>
                
                <Button 
                  onClick={handleTest}
                  loading={isLoading}
                  icon={<DownloadOutlined />}
                >
                  Tester AssemblyAI
                </Button>
              </Space>
            </Space>
          </Card>
          
          {error && (
            <Card title="Erreur" className="error-card">
              <Typography.Text type="danger">{error}</Typography.Text>
            </Card>
          )}
          
          {testResult && (
            <Card title="Résultat du test AssemblyAI" className="test-result-card">
              <Typography.Text>{testResult}</Typography.Text>
            </Card>
          )}

          {summary && (
            <Card 
              title={
                <div className="summary-header">
                  <Typography.Title level={3} style={{ margin: 0 }}>Résumé</Typography.Title>
                  <Button
                    type="primary"
                    onClick={handleGenerateFlashcards}
                    loading={isLoadingFlashcards}
                    icon={<FileTextOutlined />}
                  >
                    Générer des flashcards
                  </Button>
                </div>
              }
              className="summary-card"
            >
              <div className="summary-content">
                {summary.split('\n\n').map((paragraph, index) => {
                  // Détection des titres (commençant par # ou ##)
                  if (paragraph.startsWith('#')) {
                    const titleLevel = paragraph.startsWith('##') ? 4 : 3;
                    const titleText = paragraph.replace(/^#+\s*/, '');
                    return (
                      <Typography.Title 
                        key={index} 
                        level={titleLevel}
                        className="summary-section-title"
                      >
                        {titleText}
                      </Typography.Title>
                    );
                  } 
                  // Détection des listes (commençant par - ou *)
                  else if (paragraph.includes('\n-') || paragraph.includes('\n*')) {
                    const listItems = paragraph.split('\n').filter(item => item.trim());
                    
                    // Si le premier élément n'est pas une liste, c'est un titre de liste
                    const hasTitle = !listItems[0].trim().startsWith('-') && !listItems[0].trim().startsWith('*');
                    const title = hasTitle ? listItems.shift() : null;
                    
                    return (
                      <div key={index} className="summary-list-container">
                        {title && <Typography.Text strong className="summary-list-title">{title}</Typography.Text>}
                        <ul className="summary-list">
                          {listItems.map((item, i) => (
                            <li key={i}>
                              <Typography.Text>
                                {item.replace(/^[-*]\s*/, '')}
                              </Typography.Text>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  } 
                  // Détection des sections importantes (en majuscules)
                  else if (paragraph.toUpperCase() === paragraph && paragraph.length > 15) {
                    return (
                      <Typography.Title 
                        key={index} 
                        level={4}
                        className="summary-important-section"
                      >
                        {paragraph}
                      </Typography.Title>
                    );
                  }
                  // Paragraphes normaux
                  else {
                    return (
                      <Typography.Paragraph key={index} className="summary-paragraph">
                        {paragraph}
                      </Typography.Paragraph>
                    );
                  }
                })}
              </div>
            </Card>
          )}
          
          {flashcards && (
            <Card title="Flashcards">
              <div className="flashcards-container">
                {flashcards.split(/Flashcard \d+/).filter(card => card.trim()).map((card, index) => {
                  // Extraire la question et la réponse
                  const questionMatch = card.match(/Question: (.+?)(?=\nRéponse:|\n\n|$)/s);
                  const answerMatch = card.match(/Réponse: (.+?)(?=\n\n|$)/s);
                  
                  const question = questionMatch ? questionMatch[1].trim() : '';
                  const answer = answerMatch ? answerMatch[1].trim() : '';
                  
                  if (!question && !answer) return null;
                  
                  return (
                    <Card 
                      key={index} 
                      title={`Flashcard ${index + 1}`}
                      className="flashcard-item"
                      style={{ marginBottom: '16px' }}
                    >
                      <Typography.Text strong>Question:</Typography.Text>
                      <Typography.Paragraph>{question}</Typography.Paragraph>
                      
                      <Typography.Text strong>Réponse:</Typography.Text>
                      <Typography.Paragraph>{answer}</Typography.Paragraph>
                    </Card>
                  );
                })}
              </div>
              
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                style={{ marginTop: '16px' }}
              >
                Télécharger les flashcards
              </Button>
            </Card>
          )}
        </Space>
      </Layout.Content>
      
      <Layout.Footer style={{ textAlign: 'center' }}>
        Simplified Knowledge ©{new Date().getFullYear()}
      </Layout.Footer>
    </Layout>
  )
}

export default App
