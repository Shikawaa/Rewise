import { useState } from 'react'
import { Layout, Typography, Input, Button, Card, Space, message } from 'antd'
import { YoutubeOutlined, FileTextOutlined, DownloadOutlined } from '@ant-design/icons'
import { transcribeYouTubeVideo } from './services/assemblyAI'
import { generateSummary, generateFlashcards } from './services/mistralAI'
import './App.css'

const { Header, Content } = Layout
const { Title } = Typography
const { TextArea } = Input

function App() {
  const [inputType, setInputType] = useState('youtube')
  const [inputValue, setInputValue] = useState('')
  const [summary, setSummary] = useState('')
  const [flashcards, setFlashcards] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false)

  const handleInputTypeChange = (type) => {
    setInputType(type)
    setInputValue('')
    setSummary('')
    setFlashcards('')
  }

  const handleGenerate = async () => {
    if (!inputValue) {
      message.error('Veuillez entrer une URL YouTube ou un texte')
      return
    }

    setLoading(true)
    try {
      let text = inputValue
      
      if (inputType === 'youtube') {
        try {
          text = await transcribeYouTubeVideo(inputValue)
        } catch (error) {
          if (error.message === 'URL YouTube invalide') {
            message.error('L\'URL YouTube fournie est invalide')
          } else if (error.message === 'Délai d\'attente dépassé pour la transcription') {
            message.error('La transcription prend plus de temps que prévu. Veuillez réessayer plus tard.')
          } else {
            message.error('Erreur lors de la transcription de la vidéo YouTube')
          }
          return
        }
      }

      const generatedSummary = await generateSummary(text)
      setSummary(generatedSummary)
      message.success('Résumé généré avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      message.error('Une erreur est survenue lors de la génération du résumé')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateFlashcards = async () => {
    if (!summary) {
      message.error('Veuillez d\'abord générer un résumé')
      return
    }

    setGeneratingFlashcards(true)
    try {
      const generatedFlashcards = await generateFlashcards(summary)
      setFlashcards(generatedFlashcards)
      message.success('Flashcards générées avec succès')
    } catch (error) {
      message.error('Une erreur est survenue lors de la génération des flashcards')
    } finally {
      setGeneratingFlashcards(false)
    }
  }

  const handleDownload = () => {
    if (!flashcards) {
      message.error('Aucune flashcard à télécharger')
      return
    }

    const element = document.createElement('a')
    const file = new Blob([flashcards], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = 'flashcards.txt'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <Layout className="layout">
      <Header className="header">
        <Title level={2} style={{ color: 'white', margin: 0 }}>
          Simplified Knowledge
        </Title>
      </Header>
      <Content className="content">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space>
                <Button
                  type={inputType === 'youtube' ? 'primary' : 'default'}
                  icon={<YoutubeOutlined />}
                  onClick={() => handleInputTypeChange('youtube')}
                >
                  YouTube
                </Button>
                <Button
                  type={inputType === 'text' ? 'primary' : 'default'}
                  icon={<FileTextOutlined />}
                  onClick={() => handleInputTypeChange('text')}
                >
                  Texte
                </Button>
              </Space>

              {inputType === 'youtube' ? (
                <Input
                  placeholder="Entrez l'URL de la vidéo YouTube"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              ) : (
                <TextArea
                  placeholder="Collez votre texte ici"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  rows={6}
                />
              )}

              <Button
                type="primary"
                onClick={handleGenerate}
                loading={loading}
                block
              >
                Générer le résumé
              </Button>
            </Space>
          </Card>

          {summary && (
            <Card title="Résumé">
              <p>{summary}</p>
              <Space style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  onClick={handleGenerateFlashcards}
                  loading={generatingFlashcards}
                >
                  Générer des flashcards
                </Button>
              </Space>
            </Card>
          )}

          {flashcards && (
            <Card title="Flashcards">
              <pre style={{ whiteSpace: 'pre-wrap' }}>{flashcards}</pre>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                style={{ marginTop: 16 }}
              >
                Télécharger
              </Button>
            </Card>
          )}
        </Space>
      </Content>
    </Layout>
  )
}

export default App
