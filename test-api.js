import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Charger les variables d'environnement
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2';

// Chemin vers un fichier audio de test
const testAudioPath = path.join(__dirname, 'server', 'temp', 'n5BpkETXrLM.mp3');

async function testAPI() {
  console.log('=== TEST DE L\'API ASSEMBLYAI ===');
  console.log('Clé API AssemblyAI disponible:', ASSEMBLYAI_API_KEY ? 'Oui' : 'Non');
  console.log('Chemin du fichier audio de test:', testAudioPath);

  try {
    // 1. Vérifier si le fichier audio existe
    console.log('\n1. Vérification de l\'existence du fichier audio...');
    if (!fs.existsSync(testAudioPath)) {
      console.error('❌ Fichier audio de test non trouvé');
      throw new Error('Fichier audio de test non trouvé');
    }

    const stats = fs.statSync(testAudioPath);
    console.log('✅ Fichier audio de test trouvé, taille:', stats.size, 'octets');

    // 2. Vérifier le statut du compte AssemblyAI
    console.log('\n2. Vérification du statut du compte AssemblyAI...');
    try {
      const accountResponse = await axios.get(`${ASSEMBLYAI_API_URL}/account`, {
        headers: { 'Authorization': ASSEMBLYAI_API_KEY },
        timeout: 5000
      });
      console.log('✅ Compte AssemblyAI actif:', JSON.stringify(accountResponse.data, null, 2));
    } catch (error) {
      console.error('❌ Erreur de vérification du compte:', error.message);
      if (error.response) {
        console.error('Statut:', error.response.status);
        console.error('Données:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error('Échec de la vérification du compte');
    }

    // 3. Tester l'upload du fichier audio
    console.log('\n3. Test de l\'upload du fichier audio...');
    try {
      const fileStream = fs.createReadStream(testAudioPath);
      const uploadResponse = await axios.post(
        `${ASSEMBLYAI_API_URL}/upload`,
        fileStream,
        {
          headers: {
            'Authorization': ASSEMBLYAI_API_KEY,
            'Content-Type': 'audio/mpeg'
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 30000
        }
      );
      
      const uploadUrl = uploadResponse.data.upload_url;
      console.log('✅ Fichier audio uploadé avec succès, URL:', uploadUrl);
      
      // 4. Tester l'API de transcription
      console.log('\n4. Test de l\'API de transcription...');
      const transcriptResponse = await axios.post(
        `${ASSEMBLYAI_API_URL}/transcript`,
        { audio_url: uploadUrl, language_detection: true },
        {
          headers: {
            'Authorization': ASSEMBLYAI_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      console.log('✅ Requête de transcription acceptée:', JSON.stringify(transcriptResponse.data, null, 2));
      
      // 5. Vérifier l'état de la transcription
      const transcriptId = transcriptResponse.data.id;
      console.log('\n5. Vérification de l\'état de la transcription...');
      
      const pollingResponse = await axios.get(
        `${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`,
        {
          headers: { 'Authorization': ASSEMBLYAI_API_KEY },
          timeout: 5000
        }
      );
      console.log('✅ État de la transcription:', pollingResponse.data.status);
      console.log('Données:', JSON.stringify(pollingResponse.data, null, 2));
      
    } catch (error) {
      console.error('❌ Erreur lors du test:', error.message);
      if (error.response) {
        console.error('Statut:', error.response.status);
        console.error('Données:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error('Échec du test');
    }

    console.log('\n=== TEST TERMINÉ AVEC SUCCÈS ===');
  } catch (error) {
    console.error('\n=== TEST ÉCHOUÉ ===');
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter le test
testAPI(); 