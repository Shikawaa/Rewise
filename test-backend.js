import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Charger les variables d'environnement
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_URL = 'http://localhost:3001';

// Chemin vers un fichier audio de test
const testAudioFile = 'n5BpkETXrLM.mp3';
const localAudioUrl = `http://localhost:3001/temp/${testAudioFile}`;

async function testBackend() {
  console.log('=== TEST DE L\'ENDPOINT BACKEND ===');
  console.log('URL backend:', BACKEND_URL);
  console.log('Fichier audio de test:', testAudioFile);
  console.log('URL locale du fichier audio:', localAudioUrl);

  try {
    // Test de l'endpoint de transcription
    console.log('\nTest de l\'endpoint /api/transcribe...');
    
    try {
      console.log('Envoi de la requête avec les données:', { audioUrl: localAudioUrl });
      
      const response = await axios.post(
        `${BACKEND_URL}/api/transcribe`,
        { audioUrl: localAudioUrl },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log('✅ Réponse reçue:', response.status);
      console.log('Headers:', JSON.stringify(response.headers, null, 2));
      console.log('Data:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.error('❌ Erreur lors de la requête:', error.message);
      
      if (error.response) {
        console.error('Statut de la réponse:', error.response.status);
        console.error('Détails de l\'erreur:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('Aucune réponse reçue');
      } else {
        console.error('Erreur de configuration de la requête');
      }
      
      if (error.code) {
        console.error('Code d\'erreur:', error.code);
      }
      
      throw new Error('Échec du test de l\'endpoint backend');
    }

    console.log('\n=== TEST TERMINÉ AVEC SUCCÈS ===');
  } catch (error) {
    console.error('\n=== TEST ÉCHOUÉ ===');
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter le test
testBackend(); 