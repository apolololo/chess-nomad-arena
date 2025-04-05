
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
export const preloadSounds = (): void => {
  try {
    console.log("Préchargement des sons...");
    Object.entries(soundPaths).forEach(([key, path]) => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = path;
      
      // Forcer le préchargement
      audio.addEventListener('canplaythrough', () => {
        console.log(`Son préchargé: ${key}`);
      }, { once: true });
      
      // Gérer les erreurs de chargement
      audio.addEventListener('error', (e) => {
        console.error(`Erreur lors du chargement du son ${key}:`, e);
      });
      
      audioCache[key] = audio;
    });
  } catch (err) {
    console.error("Erreur lors du préchargement des sons:", err);
  }
};

// Jouer un son
export const playSound = (type: ChessSoundType): void => {
  if (!soundsEnabled) return;
  
  try {
    console.log(`Jouer le son: ${type}`);
    
    // Si le son n'est pas encore en cache, le créer
    if (!audioCache[type]) {
      console.log(`Création du son: ${type}`);
      const audio = new Audio();
      audio.src = soundPaths[type];
      audioCache[type] = audio;
    }
    
    // Réinitialiser et jouer le son
    const sound = audioCache[type];
    sound.currentTime = 0;
    sound.volume = 0.7; // Réduire légèrement le volume
    
    // Assurer que le son est chargé avant de le jouer
    if (sound.readyState >= 2) {
      sound.play().catch(err => {
        console.warn(`Impossible de jouer le son ${type}:`, err);
      });
    } else {
      sound.addEventListener('canplaythrough', () => {
        sound.play().catch(err => {
          console.warn(`Impossible de jouer le son ${type} après chargement:`, err);
        });
      }, { once: true });
    }
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
