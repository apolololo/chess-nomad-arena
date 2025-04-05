
import React, { useState, useEffect } from 'react';
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
  ChessColor, 
  generateAIMove
} from '@/lib/chess-utils';
import { useToast } from "@/hooks/use-toast";

const AIGame = () => {
  const { username, rating, updateRating } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Récupérer les paramètres du jeu
  const { settings } = location.state || {
    settings: {
      aiDifficulty: AIDifficulty.MEDIUM,
      timeControl: { minutes: 5, increment: 0 },
      playerColor: 'white',
      startWithFlippedBoard: false
    }
  };

  // Initialiser le jeu
  const [game, setGame] = useState<ChessGame>(new Chess());
  const [isFlipped, setIsFlipped] = useState(
    settings.startWithFlippedBoard || 
    settings.playerColor === 'black'
  );
  const [isGameOver, setIsGameOver] = useState(false);
  const [playerColor, setPlayerColor] = useState<ChessColor>(
    settings.playerColor === 'random' 
      ? Math.random() < 0.5 ? 'w' : 'b'
      : settings.playerColor === 'black' ? 'b' : 'w'
  );
  
  const aiName = `IA ${settings.aiDifficulty}`;
  
  // Si l'IA joue les blancs, faire le premier coup
  useEffect(() => {
    if (playerColor === 'b' && game.turn() === 'w') {
      setTimeout(() => {
        const aiMove = generateAIMove(game, settings.aiDifficulty!);
        if (aiMove) {
          makeMove(aiMove);
        }
      }, 500);
    }
  }, []);
  
  // Vérifier si c'est le tour de l'IA après chaque coup du joueur
  useEffect(() => {
    if (!isGameOver && game.turn() !== playerColor) {
      // Délai pour simuler la réflexion de l'IA
      const delay = Math.random() * 700 + 300; // Entre 300 et 1000ms
      
      setTimeout(() => {
        const aiMove = generateAIMove(game, settings.aiDifficulty!);
        if (aiMove) {
          makeMove(aiMove);
        }
      }, delay);
    }
  }, [game.turn(), isGameOver]);
  
  // Vérifier si le jeu est terminé
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
        toast({
          title: "Partie nulle",
          description: game.isStalemate() 
            ? "Pat !" 
            : game.isThreefoldRepetition() 
              ? "Répétition triple de la position !" 
              : "Matériel insuffisant pour mater !",
        });
      }
      
      // Mise à jour du classement (simple simulation)
      if (result === 'win') {
        updateRating(rating + 10);
      } else if (result === 'loss') {
        updateRating(Math.max(0, rating - 5));
      }
    }
  }, [game]);
  
  // Jouer un coup
  const makeMove = (moveNotation: string) => {
    try {
      const newGame = new Chess(game.fen());
      newGame.move(moveNotation);
      setGame(newGame);
    } catch (error) {
      console.error("Coup invalide :", error);
    }
  };
  
  // Gestion du coup du joueur
  const handleMove = ({ from, to }: { from: ChessSquare; to: ChessSquare }) => {
    if (game.turn() !== playerColor || isGameOver) return;
    
    try {
      const move: Move = { from, to } as unknown as Move;
      
      // Vérifier si c'est une promotion
      const piece = game.get(from);
      const targetRank = to.charAt(1);
      if (piece && piece.type === 'p' && 
          ((piece.color === 'w' && targetRank === '8') || 
           (piece.color === 'b' && targetRank === '1'))) {
        // Toujours promouvoir en dame pour simplifier
        move.promotion = 'q';
      }
      
      const newGame = new Chess(game.fen());
      newGame.move(move);
      setGame(newGame);
    } catch (error) {
      console.error("Coup invalide :", error);
    }
  };
  
  // Temps écoulé
  const handleTimeout = (color: ChessColor) => {
    setIsGameOver(true);
    toast({
      title: color === playerColor ? "Défaite !" : "Victoire !",
      description: `Temps écoulé pour les ${color === 'w' ? 'blancs' : 'noirs'} !`,
    });
    
    // Mise à jour du classement
    if (color === playerColor) {
      updateRating(Math.max(0, rating - 5));
    } else {
      updateRating(rating + 10);
    }
  };
  
  // Retour au menu
  const handleBackToMenu = () => {
    navigate('/');
  };
  
  // Nouvelle partie
  const handleNewGame = () => {
    setGame(new Chess());
    setIsGameOver(false);
    
    // Changer la couleur si randomisée
    if (settings.playerColor === 'random') {
      const newColor = Math.random() < 0.5 ? 'w' : 'b';
      setPlayerColor(newColor);
      setIsFlipped(settings.startWithFlippedBoard || newColor === 'b');
    }
    
    // Si l'IA joue les blancs, faire le premier coup
    if (playerColor === 'b') {
      setTimeout(() => {
        const aiMove = generateAIMove(game, settings.aiDifficulty!);
        if (aiMove) {
          makeMove(aiMove);
        }
      }, 500);
    }
  };
  
  return (
    <div className="min-h-screen bg-chess-dark text-white p-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Colonne de gauche (infos) - visible sur desktop */}
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
          
          {/* Colonne centrale (échiquier) */}
          <div className="md:col-span-2">
            <div className="flex flex-col gap-4">
              {/* Timer mobile */}
              <GameTimer 
                initialTimeInSeconds={settings.timeControl.minutes * 60}
                increment={settings.timeControl.increment}
                activeColor={game.turn()}
                isGameOver={isGameOver}
                onTimeout={handleTimeout}
              />
              
              {/* Échiquier */}
              <div className="aspect-square">
                <Chessboard 
                  game={game} 
                  onMove={handleMove} 
                  isFlipped={isFlipped}
                  disabled={isGameOver || game.turn() !== playerColor}
                />
              </div>
              
              {/* Contrôles */}
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
              
              {/* Infos mobile */}
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
