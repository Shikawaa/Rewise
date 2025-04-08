import { exec, spawn } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

// Démarrer ngrok
async function startNgrok() {
  console.log('Démarrage de ngrok...');
  
  // Tuer les instances existantes de ngrok
  try {
    await execAsync('pkill -f ngrok');
    console.log('Anciennes instances de ngrok terminées');
  } catch (error) {
    // Ignorer les erreurs si aucune instance n'est en cours d'exécution
  }
  
  // Démarrer ngrok en arrière-plan
  const ngrok = spawn('ngrok', ['http', '3001'], { detached: true });
  
  // Ignorer la sortie standard et d'erreur pour permettre au processus de s'exécuter en arrière-plan
  ngrok.stdout.on('data', (data) => {});
  ngrok.stderr.on('data', (data) => {});
  
  // Détacher le processus pour qu'il continue à s'exécuter après la fin du script
  ngrok.unref();
  
  // Attendre que ngrok soit prêt
  console.log('Attente de l\'initialisation de ngrok...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Récupérer l'URL de ngrok depuis l'API locale
  try {
    const response = await axios.get('http://localhost:4040/api/tunnels');
    const publicUrl = response.data.tunnels[0].public_url;
    console.log('URL ngrok générée:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'URL ngrok:', error.message);
    throw new Error('Impossible de récupérer l\'URL ngrok');
  }
}

// Mettre à jour le fichier .env
async function updateEnvFile(publicUrl) {
  console.log('Mise à jour du fichier .env...');
  
  try {
    let envContent = fs.readFileSync('.env', 'utf8');
    
    // Vérifier si PUBLIC_URL existe déjà dans le fichier
    if (envContent.includes('PUBLIC_URL=')) {
      // Remplacer la valeur existante
      envContent = envContent.replace(/PUBLIC_URL=.*$/m, `PUBLIC_URL=${publicUrl}`);
    } else {
      // Ajouter la variable à la fin du fichier
      envContent += `\nPUBLIC_URL=${publicUrl}`;
    }
    
    fs.writeFileSync('.env', envContent);
    console.log('Fichier .env mis à jour avec succès');
  } catch (error) {
    console.error('Erreur lors de la mise à jour du fichier .env:', error.message);
    throw new Error('Impossible de mettre à jour le fichier .env');
  }
}

// Démarrer le serveur
async function startServer() {
  console.log('Démarrage du serveur...');
  
  // Démarrer le serveur avec yarn dev
  const server = spawn('yarn', ['dev'], { stdio: 'inherit' });
  
  // Gérer les erreurs
  server.on('error', (error) => {
    console.error('Erreur lors du démarrage du serveur:', error.message);
  });
  
  // Gérer la fermeture du serveur
  server.on('close', (code) => {
    console.log(`Serveur arrêté avec le code: ${code}`);
  });
}

// Fonction principale
async function main() {
  try {
    const publicUrl = await startNgrok();
    await updateEnvFile(publicUrl);
    await startServer();
  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter la fonction principale
main(); 