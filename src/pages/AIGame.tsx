
import React, { useState, useEffect, useCallback } from 'react';
import { Chess, Move } from 'chess.js';
import { useLocation, useNavigate } from 'react-router-dom';
import Chessboard from '@/components/Chessboard';
import GameControls from '@/components/GameControls';
import GameInfo from '@/components/GameInfo';
import GameTimer from '@/components/GameTimer';
import { useUser } from '@/contexts/UserContext';
import { 
  AIDifficulty, 
  ChessGame, 
  ChessSquare, 
  ChessColor
} from '@/lib/chess-utils';
import { generateAIMove } from '@/lib/chess-ai';
import { useToast } from "@/hooks/use-toast";
import { playSound, playSoundForMove, preloadSounds } from "@/lib/audio";

const AIGame = () => {
  const { username, rating, updateRating } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { settings } = location.state || {
    settings: {
      aiDifficulty: AIDifficulty.MEDIUM,
      timeControl: { minutes: 5, increment: 0 },
      playerColor: 'white',
      startWithFlippedBoard: false
    }
  };

  const [game, setGame] = useState<ChessGame>(new Chess());
  const [isFlipped, setIsFlipped] = useState(
    settings.startWithFlippedBoard || 
    settings.playerColor === 'black'
  );
  const [isGameOver, setIsGameOver] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [playerColor, setPlayerColor] = useState<ChessColor>(
    settings.playerColor === 'random' 
      ? Math.random() < 0.5 ? 'w' : 'b'
      : settings.playerColor === 'black' ? 'b' : 'w'
  );
  
  const aiName = `IA ${settings.aiDifficulty}`;
  
  useEffect(() => {
    preloadSounds();
  }, []);
  
  const makeAIMove = useCallback(() => {
    setIsThinking(true);
    
    // Délai variable selon la difficulté pour simuler la "réflexion"
    const delay = 
      settings.aiDifficulty === AIDifficulty.EASY ? 300 :
      settings.aiDifficulty === AIDifficulty.MEDIUM ? 800 :
      settings.aiDifficulty === AIDifficulty.HARD ? 1200 :
      1800; // Expert
    
    setTimeout(() => {
      try {
        const aiMove = generateAIMove(game, settings.aiDifficulty!);
        if (aiMove) {
          makeMove(aiMove);
        }
        setIsThinking(false);
      } catch (error) {
        console.error("Erreur lors du coup de l'IA:", error);
        setIsThinking(false);
        toast({
          title: "Erreur de l'IA",
          description: "Une erreur est survenue lors du calcul du coup de l'IA.",
          variant: "destructive"
        });
      }
    }, delay);
  }, [game, settings.aiDifficulty, toast]);
  
  useEffect(() => {
    if (playerColor === 'b' && game.turn() === 'w' && !isGameOver) {
      makeAIMove();
    }
  }, []);
  
  useEffect(() => {
    if (!isGameOver && game.turn() !== playerColor && !isThinking) {
      makeAIMove();
    }
  }, [game.turn(), isGameOver, isThinking, makeAIMove, playerColor]);
  
  useEffect(() => {
    if (game.isGameOver()) {
      setIsGameOver(true);
      
      let result;
      if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? 'b' : 'w';
        result = winner === playerColor ? 'win' : 'loss';
        toast({
          title: winner === playerColor ? "Victoire !" : "Défaite !",
          description: "Échec et mat !",
        });
      } else if (game.isDraw()) {
        result = 'draw';
        playSound('draw');
        toast({
          title: "Partie nulle",
          description: game.isStalemate() 
            ? "Pat !" 
            : game.isThreefoldRepetition() 
              ? "Répétition triple de la position !" 
              : "Matériel insuffisant pour mater !",
        });
      }
      
      if (result === 'win') {
        updateRating(rating + 10);
      } else if (result === 'loss') {
        updateRating(Math.max(0, rating - 5));
      }
    }
  }, [game, playerColor, rating, toast, updateRating]);
  
  const makeMove = (moveNotation: string) => {
    try {
      const newGame = new Chess(game.fen());
      const move = newGame.move(moveNotation);
      
      if (move) {
        const isCheck = newGame.inCheck();
        const isCheckmate = newGame.isCheckmate();
        
        playSoundForMove(move, isCheck, isCheckmate);
        
        setGame(newGame);
      }
    } catch (error) {
      console.error("Coup invalide :", error);
      playSound('illegal');
    }
  };
  
  const handleMove = ({ from, to }: { from: ChessSquare; to: ChessSquare }) => {
    if (game.turn() !== playerColor || isGameOver || isThinking) return;
    
    try {
      const move: Move = { from, to } as unknown as Move;
      
      const piece = game.get(from);
      const targetRank = to.charAt(1);
      if (piece && piece.type === 'p' && 
          ((piece.color === 'w' && targetRank === '8') || 
           (piece.color === 'b' && targetRank === '1'))) {
        move.promotion = 'q';
      }
      
      const newGame = new Chess(game.fen());
      const result = newGame.move(move);
      
      if (result) {
        const isCheck = newGame.inCheck();
        const isCheckmate = newGame.isCheckmate();
        
        playSoundForMove(result, isCheck, isCheckmate);
        
        setGame(newGame);
      } else {
        playSound('illegal');
      }
    } catch (error) {
      console.error("Coup invalide :", error);
      playSound('illegal');
    }
  };
  
  const handleTimeout = (color: ChessColor) => {
    setIsGameOver(true);
    toast({
      title: color === playerColor ? "Défaite !" : "Victoire !",
      description: `Temps écoulé pour les ${color === 'w' ? 'blancs' : 'noirs'} !`,
    });
    
    if (color === playerColor) {
      updateRating(Math.max(0, rating - 5));
    } else {
      updateRating(rating + 10);
    }
  };
  
  const handleBackToMenu = () => {
    navigate('/');
  };
  
  const handleNewGame = () => {
    setGame(new Chess());
    setIsGameOver(false);
    setIsThinking(false);
    
    if (settings.playerColor === 'random') {
      const newColor = Math.random() < 0.5 ? 'w' : 'b';
      setPlayerColor(newColor);
      setIsFlipped(settings.startWithFlippedBoard || newColor === 'b');
    }
    
    // Si le joueur est noir, l'IA (blancs) doit jouer en premier
    if (playerColor === 'b') {
      setTimeout(() => {
        makeAIMove();
      }, 500);
    }
  };
  
  return (
    <div className="min-h-screen bg-chess-dark text-white p-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="hidden md:block">
            <h1 className="text-2xl font-bold mb-4">Partie contre {aiName}</h1>
            <GameInfo 
              game={game}
              whiteUsername={playerColor === 'w' ? username : aiName}
              blackUsername={playerColor === 'b' ? username : aiName}
              whiteRating={playerColor === 'w' ? rating : undefined}
              blackRating={playerColor === 'b' ? rating : undefined}
            />
          </div>
          
          <div className="md:col-span-2">
            <div className="flex flex-col gap-4">
              <GameTimer 
                initialTimeInSeconds={settings.timeControl.minutes * 60}
                increment={settings.timeControl.increment}
                activeColor={game.turn()}
                isGameOver={isGameOver}
                onTimeout={handleTimeout}
              />
              
              <div className="aspect-square">
                <Chessboard 
                  game={game} 
                  onMove={handleMove} 
                  isFlipped={isFlipped}
                  disabled={isGameOver || game.turn() !== playerColor || isThinking}
                />
              </div>
              
              {isThinking && game.turn() !== playerColor && !isGameOver && (
                <div className="text-center text-sm text-chess-blue animate-pulse">
                  L'IA réfléchit...
                </div>
              )}
              
              <div className="flex justify-center mt-4">
                <GameControls 
                  onFlipBoard={() => setIsFlipped(!isFlipped)}
                  onResign={() => {
                    setIsGameOver(true);
                    updateRating(Math.max(0, rating - 5));
                    toast({
                      title: "Abandon",
                      description: "Vous avez abandonné la partie.",
                    });
                  }}
                  onNewGame={handleNewGame}
                  onBackToMenu={handleBackToMenu}
                />
              </div>
              
              <div className="block md:hidden mt-4">
                <GameInfo 
                  game={game}
                  whiteUsername={playerColor === 'w' ? username : aiName}
                  blackUsername={playerColor === 'b' ? username : aiName}
                  whiteRating={playerColor === 'w' ? rating : undefined}
                  blackRating={playerColor === 'b' ? rating : undefined}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGame;
