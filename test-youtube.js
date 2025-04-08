import axios from 'axios';
import readline from 'readline';

// URL pour l'API de test
const TEST_API_URL = 'http://localhost:3001/api/test-youtube';

// Créer une interface readline pour l'entrée utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour tester l'API
async function testYouTubeAPI() {
  try {
    console.log('=== TEST DE L\'API YOUTUBE ===');
    
    // Demander l'URL YouTube à l'utilisateur
    const videoUrl = await new Promise(resolve => {
      rl.question('Entrez l\'URL YouTube à tester: ', (answer) => {
        resolve(answer.trim());
      });
    });
    
    if (!videoUrl) {
      console.error('URL YouTube requise');
      process.exit(1);
    }
    
    console.log('URL YouTube fournie:', videoUrl);
    
    // Envoyer la requête à l'API
    console.log('Envoi de la requête à l\'API...');
    
    const response = await axios.post(
      TEST_API_URL,
      { videoUrl },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 secondes
      }
    );
    
    console.log('✅ Réponse reçue avec succès:', response.status);
    console.log('Détails:');
    console.log('- ID de la vidéo:', response.data.videoId);
    console.log('- URL audio locale:', response.data.audioUrl);
    console.log('- URL d\'upload AssemblyAI:', response.data.uploadUrl);
    console.log('- Message:', response.data.message);
    
    console.log('\n=== TEST TERMINÉ AVEC SUCCÈS ===');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:');
    
    if (error.response) {
      console.error('Statut:', error.response.status);
      console.error('Détails:', error.response.data);
    } else if (error.request) {
      console.error('Aucune réponse reçue du serveur');
    } else {
      console.error('Erreur:', error.message);
    }
    
    console.error('\n=== TEST ÉCHOUÉ ===');
  } finally {
    rl.close();
  }
}

// Exécuter le test
testYouTubeAPI(); 