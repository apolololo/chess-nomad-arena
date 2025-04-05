
import React, { useState, useEffect } from 'react';
import { ChessColor } from '@/lib/chess-utils';

type GameTimerProps = {
  initialTimeInSeconds: number;
  increment: number;
  activeColor: ChessColor;
  isGameOver: boolean;
  onTimeout: (color: ChessColor) => void;
};

const GameTimer: React.FC<GameTimerProps> = ({
  initialTimeInSeconds,
  increment,
  activeColor,
  isGameOver,
  onTimeout
}) => {
  const [whiteTime, setWhiteTime] = useState(initialTimeInSeconds);
  const [blackTime, setBlackTime] = useState(initialTimeInSeconds);
  const [lastTick, setLastTick] = useState<number | null>(null);

  // Format le temps en mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  // Effet pour gérer le décompte du temps
  useEffect(() => {
    if (isGameOver) return;

    if (lastTick === null) {
      // Premier tick, initialiser lastTick
      setLastTick(Date.now());
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = (now - lastTick) / 1000;
      setLastTick(now);

      if (activeColor === 'w') {
        setWhiteTime(prev => {
          const newTime = Math.max(0, prev - deltaSeconds);
          if (newTime === 0) {
            onTimeout('w');
          }
          return newTime;
        });
      } else {
        setBlackTime(prev => {
          const newTime = Math.max(0, prev - deltaSeconds);
          if (newTime === 0) {
            onTimeout('b');
          }
          return newTime;
        });
      }
    }, 100); // Mettre à jour plus fréquemment pour plus de précision

    return () => clearInterval(interval);
  }, [activeColor, isGameOver, lastTick, onTimeout]);

  // Ajouter l'incrément lorsque le tour change
  useEffect(() => {
    setLastTick(Date.now());
    
    // N'ajouter l'incrément que si ce n'est pas le premier coup
    if (lastTick !== null) {
      if (activeColor === 'b') {
        // Le noir vient de jouer, ajouter l'incrément au blanc
        setWhiteTime(prev => prev + increment);
      } else {
        // Le blanc vient de jouer, ajouter l'incrément au noir
        setBlackTime(prev => prev + increment);
      }
    }
  }, [activeColor]);

  return (
    <div className="flex flex-col md:flex-row justify-between w-full gap-2 text-lg font-mono">
      <div className={`p-3 rounded-md ${activeColor === 'b' ? 'bg-gray-800 text-white animate-pulse-light' : 'bg-gray-600 text-white'}`}>
        Noir: {formatTime(Math.ceil(blackTime))}
      </div>
      <div className={`p-3 rounded-md ${activeColor === 'w' ? 'bg-gray-100 text-gray-800 animate-pulse-light' : 'bg-gray-300 text-gray-800'}`}>
        Blanc: {formatTime(Math.ceil(whiteTime))}
      </div>
    </div>
  );
};

export default GameTimer;
