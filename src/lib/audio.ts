
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

// Chemins des fichiers audio avec le chemin corrigé
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
    
    // Fallback sounds - use in-memory generated sounds
    const createFallbackSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        return { audioContext, oscillator, gainNode };
      } catch (e) {
        console.warn("Couldn't create fallback audio:", e);
        return null;
      }
    };
    
    // Précharger chaque son
    Object.entries(soundPaths).forEach(([key, path]) => {
      try {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.volume = 0.5; // Volume légèrement réduit
        audioCache[key as ChessSoundType] = audio;
        
        // Log seulement en cas d'erreur
        audio.addEventListener('error', (e) => {
          console.error(`Erreur de chargement du son ${key} depuis ${path}:`, e);
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
    // Utiliser un simple bip si le son ne peut pas être chargé
    const playFallbackSound = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'sine';
        
        // Différentes fréquences selon le type de son
        switch (type) {
          case 'move': oscillator.frequency.value = 440; break;
          case 'capture': oscillator.frequency.value = 300; break;
          case 'check': oscillator.frequency.value = 550; break;
          case 'illegal': oscillator.frequency.value = 220; break;
          default: oscillator.frequency.value = 440; break;
        }
        
        gainNode.gain.value = 0.1;
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start();
        setTimeout(() => oscillator.stop(), 150);
      } catch (e) {
        console.warn("Could not play fallback sound:", e);
      }
    };
    
    // Utiliser le son du cache s'il existe
    if (audioCache[type]) {
      const sound = audioCache[type].cloneNode() as HTMLAudioElement;
      sound.volume = 0.5;
      sound.play().catch(err => {
        console.warn(`Impossible de jouer le son ${type}, utilisation d'un son de remplacement:`, err);
        playFallbackSound();
      });
      return;
    }
    
    // Utiliser le son de remplacement si le son n'est pas dans le cache
    playFallbackSound();
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
