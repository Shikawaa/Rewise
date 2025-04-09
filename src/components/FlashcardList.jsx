import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { DownloadIcon } from '@radix-ui/react-icons';

// Ajouter un style pour les animations de retournement
const cardStyles = `
  .flashcard-container {
    perspective: 1000px; /* Pour l'effet 3D */
    height: 320px; /* Hauteur fixe pour toutes les cartes */
  }
  
  .flashcard {
    transition: transform 0.6s;
    transform-style: preserve-3d;
    position: relative;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
  
  .flashcard.flipped {
    transform: rotateY(180deg);
  }
  
  .flashcard-front, .flashcard-back {
    backface-visibility: hidden;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    border-radius: 0.75rem;
    overflow: hidden;
  }
  
  .flashcard-front {
    z-index: 2;
    transform: rotateY(0deg);
  }
  
  .flashcard-back {
    transform: rotateY(180deg);
  }

  .card-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .card-footer {
    border-top: 1px solid #e5e7eb;
    padding: 0.75rem;
    text-align: center;
    background-color: #f9fafb;
  }
`;

const FlashcardList = ({ flashcards, onDownload }) => {
  // État pour suivre les cartes retournées
  const [flippedCards, setFlippedCards] = useState({});
  
  if (!flashcards) return null;

  // Traiter chaque flashcard
  const cards = flashcards
    .split(/Flashcard \d+/)
    .filter(card => card.trim())
    .map(card => {
      const questionMatch = card.match(/Question: (.+?)(?=\nRéponse:|\n\n|$)/s);
      const answerMatch = card.match(/Réponse: (.+?)(?=\n\n|$)/s);
      
      return {
        question: questionMatch ? questionMatch[1].trim() : '',
        answer: answerMatch ? answerMatch[1].trim() : ''
      };
    });

  // Fonction pour retourner une carte
  const flipCard = (index) => {
    setFlippedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Insérer le style pour les animations */}
      <style>{cardStyles}</style>
      
      <div className="flex justify-between items-center">
        <h2 className="title-lg">Flashcards</h2>
        <Button 
          onClick={onDownload}
          className="flex items-center gap-2"
          aria-label="Télécharger les flashcards"
        >
          <DownloadIcon className="h-4 w-4" />
          Télécharger
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="flashcard-container fade-in">
            <div 
              className={`flashcard ${flippedCards[index] ? 'flipped' : ''}`} 
              onClick={() => flipCard(index)}
            >
              {/* Côté recto (question) */}
              <div className="flashcard-front bg-white border border-gray-200 shadow-sm hover:shadow-md">
                <CardHeader className="border-b border-gray-100 bg-gray-50 py-3 px-4">
                  <CardTitle className="text-lg font-semibold">Question {index + 1}</CardTitle>
                </CardHeader>
                <div className="card-content">
                  <p className="text-gray-800">{card.question}</p>
                </div>
                <div className="card-footer text-gray-500 text-sm">
                  Cliquez pour voir la réponse
                </div>
              </div>
              
              {/* Côté verso (réponse) */}
              <div className="flashcard-back bg-purple-100 border border-purple-300 shadow-sm hover:shadow-md">
                <CardHeader className="border-b border-purple-200 bg-purple-600 py-3 px-4">
                  <CardTitle className="text-lg font-semibold text-white">Réponse {index + 1}</CardTitle>
                </CardHeader>
                <div className="card-content bg-purple-50">
                  <p className="text-gray-800">{card.answer}</p>
                </div>
                <div className="card-footer text-purple-700 text-sm bg-purple-100">
                  Cliquez pour voir la question
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlashcardList; 