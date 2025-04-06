
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

// Chemins des fichiers audio (avec le bon chemin cette fois)
const soundPaths: Record<ChessSoundType, string> = {
  move: '/assets/sounds/move.mp3',
  capture: '/assets/sounds/capture.mp3',
  check: '/assets/sounds/check.mp3',
  castle: '/assets/sounds/castle.mp3',
  promote: '/assets/sounds/promote.mp3',
  checkmate: '/assets/sounds/checkmate.mp3',
  draw: '/assets/sounds/draw.mp3',
  illegal: '/assets/sounds/illegal.mp3',
  notify: '/assets/sounds/notify.mp3'
};

// Activer/désactiver les sons
export const toggleSounds = (enabled: boolean): void => {
  soundsEnabled = enabled;
};

// Précharger les sons
export const preloadSounds = async (): Promise<void> => {
  try {
    console.log("Préchargement des sons...");
    
    // Vérifier si Audio API est disponible
    if (typeof Audio === 'undefined') {
      console.warn("Audio API non disponible dans cet environnement");
      return;
    }
    
    // Précharger chaque son
    Object.entries(soundPaths).forEach(([key, path]) => {
      try {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.volume = 0.7;
        audioCache[key as ChessSoundType] = audio;
        
        // Log seulement en cas d'erreur
        audio.addEventListener('error', () => {
          console.error(`Erreur de chargement du son ${key} depuis ${path}`);
        });
      } catch (err) {
        console.error(`Erreur lors du préchargement du son ${key}:`, err);
      }
    });
    
    console.log("Sons préchargés");
  } catch (err) {
    console.error("Erreur lors du préchargement des sons:", err);
  }
};

// Jouer un son
export const playSound = (type: ChessSoundType): void => {
  if (!soundsEnabled) return;
  
  try {
    // Utiliser le son du cache s'il existe
    if (audioCache[type]) {
      const sound = audioCache[type].cloneNode() as HTMLAudioElement;
      sound.volume = 0.7;
      sound.play().catch(err => {
        console.warn(`Impossible de jouer le son ${type}:`, err);
      });
      return;
    }
    
    // Sinon, créer un nouveau son
    const sound = new Audio(soundPaths[type]);
    sound.volume = 0.7;
    sound.play().catch(err => {
      console.warn(`Impossible de jouer le son ${type}:`, err);
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
