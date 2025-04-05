
// Gestionnaire de sons pour le jeu d'échecs
const audioCache: Record<string, HTMLAudioElement> = {};
let soundsEnabled = true;

// Types de sons d'échecs
export type ChessSoundType = 
  | 'move'      // Déplacement normal
  | 'capture'   // Capture d'une pièce
  | 'check'     // Mise en échec
  | 'castle'    // Roque
  | 'promote'   // Promotion d'un pion
  | 'checkmate' // Échec et mat
  | 'draw'      // Partie nulle
  | 'illegal'   // Coup illégal
  | 'notify';   // Notification

// Chemins des fichiers audio
const soundPaths: Record<ChessSoundType, string> = {
  move: '/sounds/move.mp3',
  capture: '/sounds/capture.mp3',
  check: '/sounds/check.mp3',
  castle: '/sounds/castle.mp3',
  promote: '/sounds/promote.mp3',
  checkmate: '/sounds/checkmate.mp3',
  draw: '/sounds/draw.mp3',
  illegal: '/sounds/illegal.mp3',
  notify: '/sounds/notify.mp3'
};

// Activer/désactiver les sons
export const toggleSounds = (enabled: boolean): void => {
  soundsEnabled = enabled;
};

// Précharger les sons
export const preloadSounds = async (): Promise<void> => {
  try {
    console.log("Préchargement des sons...");
    
    // Création de fichiers audio fictifs si dans un environnement de test
    if (typeof Audio === 'undefined') {
      console.warn("Audio API non disponible dans cet environnement");
      return;
    }
    
    const audioPromises = Object.entries(soundPaths).map(([key, path]) => {
      return new Promise<void>((resolve) => {
        try {
          const audio = new Audio();
          audio.preload = 'auto';
          
          // Gérer les erreurs de chargement silencieusement
          audio.addEventListener('error', () => {
            console.warn(`Impossible de charger le son ${key} depuis ${path}`);
            resolve();
          });
          
          // Considérer le son comme chargé dès qu'il peut jouer
          audio.addEventListener('canplaythrough', () => {
            console.log(`Son préchargé: ${key}`);
            resolve();
          }, { once: true });
          
          // Assurer la résolution même si les événements ne se déclenchent pas
          setTimeout(resolve, 3000);
          
          audio.src = path;
          audioCache[key] = audio;
        } catch (err) {
          console.error(`Erreur lors du préchargement du son ${key}:`, err);
          resolve();
        }
      });
    });
    
    // Attendre que tous les sons soient chargés (ou timeout)
    await Promise.all(audioPromises);
    console.log("Préchargement des sons terminé");
  } catch (err) {
    console.error("Erreur lors du préchargement des sons:", err);
  }
};

// Jouer un son avec un système de fallback
export const playSound = (type: ChessSoundType): void => {
  if (!soundsEnabled) return;
  
  try {
    console.log(`Jouer le son: ${type}`);
    
    // Créer un nouvel élément audio à chaque fois pour éviter les problèmes
    // de lecture simultanée ou d'état de lecture
    const sound = new Audio(soundPaths[type]);
    sound.volume = 0.7;
    
    // Utiliser une promesse pour gérer la lecture
    sound.play()
      .then(() => {
        // Lecture réussie
      })
      .catch(err => {
        // Fallback en cas d'échec - souvent causé par des restrictions du navigateur
        console.warn(`Impossible de jouer le son ${type} automatiquement:`, err);
        
        // Ajouter au cache pour les tentatives futures
        if (!audioCache[type]) {
          audioCache[type] = sound;
        }
      });
  } catch (err) {
    console.error(`Erreur lors de la lecture du son ${type}:`, err);
  }
};

// Déterminer quel son jouer en fonction de l'action d'échecs
export const playSoundForMove = (move: any, isCheck: boolean, isCheckmate: boolean): void => {
  if (isCheckmate) {
    playSound('checkmate');
  } else if (isCheck) {
    playSound('check');
  } else if (move.flags && move.flags.includes('c')) {
    playSound('capture');
  } else if (move.flags && move.flags.includes('k')) {
    playSound('castle');
  } else if (move.flags && move.flags.includes('p')) {
    playSound('promote');
  } else {
    playSound('move');
  }
};
