
import React, { useState, useEffect } from 'react';
import { Chess, Move } from 'chess.js';
import { useLocation, useNavigate } from 'react-router-dom';
import Chessboard from '@/components/Chessboard';
import GameControls from '@/components/GameControls';
import GameInfo from '@/components/GameInfo';
import GameTimer from '@/components/GameTimer';
import { useUser } from '@/contexts/UserContext';
import { 
  ChessGame, 
  ChessSquare, 
  ChessColor 
} from '@/lib/chess-utils';
import { useToast } from "@/hooks/use-toast";
import { 
  P2PManager, 
  P2PEventType, 
  P2PCallbacks 
} from '@/lib/p2p';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

// On simule un serveur de matchmaking avec cette URL
const MATCHMAKING_URL = "https://chesspeer.nomad/api/matchmaking";

const RandomGame = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, rating } = useUser();
  const { toast } = useToast();

  // Récupérer les paramètres du jeu
  const { settings } = location.state || {
    settings: {
      timeControl: { minutes: 5, increment: 0 },
      startWithFlippedBoard: false
    }
  };

  // Initialiser le jeu
  const [game, setGame] = useState<ChessGame>(new Chess());
  const [isFlipped, setIsFlipped] = useState(settings.startWithFlippedBoard || false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [playerColor, setPlayerColor] = useState<ChessColor>('w');
  const [opponentName, setOpponentName] = useState<string>("En recherche...");
  const [opponentRating, setOpponentRating] = useState<number | undefined>(undefined);
  const [p2pManager, setP2pManager] = useState<P2PManager | null>(null);
  const [isSearching, setIsSearching] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [searchTimeElapsed, setSearchTimeElapsed] = useState(0);
  const [resignConfirmOpen, setResignConfirmOpen] = useState(false);
  const [drawOffered, setDrawOffered] = useState(false);
  const [drawOfferReceived, setDrawOfferReceived] = useState(false);
  
  // Timer de recherche
  useEffect(() => {
    if (isSearching) {
      const timer = setInterval(() => {
        setSearchTimeElapsed(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isSearching]);
  
  // Formater le temps de recherche
  const formatSearchTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };
  
  // Simuler la recherche d'un adversaire
  useEffect(() => {
    if (!isSearching) return;
    
    const simulateMatchmaking = async () => {
      try {
        // Simuler un délai de recherche aléatoire entre 3 et 10 secondes
        const searchDelay = Math.floor(Math.random() * 7000) + 3000;
        
        setTimeout(() => {
          // Simuler un adversaire trouvé
          const randomRating = rating + Math.floor(Math.random() * 200) - 100;
          const randomName = `Joueur${Math.floor(Math.random() * 10000)}`;
          
          setOpponentName(randomName);
          setOpponentRating(randomRating);
          setIsSearching(false);
          setIsConnecting(true);
          
          // Initialiser la connexion P2P
          initP2P(randomName, randomRating);
        }, searchDelay);
      } catch (error) {
        console.error("Erreur de matchmaking:", error);
        toast({
          title: "Erreur",
          description: "Erreur lors de la recherche d'un adversaire.",
          variant: "destructive"
        });
      }
    };
    
    simulateMatchmaking();
  }, [isSearching]);
  
  // Initialiser la connexion P2P
  const initP2P = (opponentName: string, opponentRating?: number) => {
    const callbacks: P2PCallbacks = {
      onMove: (moveNotation) => {
        makeMove(moveNotation);
      },
      onGameOver: (result) => {
        setIsGameOver(true);
        toast({
          title: "Partie terminée",
          description: result,
        });
      },
      onResign: () => {
        setIsGameOver(true);
        toast({
          title: "Victoire !",
          description: "Votre adversaire a abandonné.",
        });
      },
      onDrawOffer: () => {
        setDrawOfferReceived(true);
        toast({
          title: "Proposition de nulle",
          description: "Votre adversaire propose une partie nulle.",
        });
      },
      onDrawAccept: () => {
        setIsGameOver(true);
        toast({
          title: "Partie nulle",
          description: "Votre adversaire a accepté la nulle.",
        });
      },
      onDrawDecline: () => {
        toast({
          title: "Nulle refusée",
          description: "Votre adversaire a refusé la nulle.",
        });
        setDrawOffered(false);
      },
      onConnect: () => {
        setIsConnecting(false);
        toast({
          title: "Connecté !",
          description: `Vous êtes connecté à ${opponentName}.`,
        });
      },
      onDisconnect: () => {
        toast({
          title: "Déconnecté",
          description: "Votre adversaire s'est déconnecté.",
          variant: "destructive"
        });
      },
      onError: (error) => {
        console.error("P2P error:", error);
        toast({
          title: "Erreur de connexion",
          description: "Une erreur est survenue lors de la connexion.",
          variant: "destructive"
        });
      },
      onConnectionStatus: (status) => {
        if (status === 'connected') {
          setIsConnecting(false);
        } else if (status === 'connecting') {
          setIsConnecting(true);
        }
      }
    };
    
    const manager = new P2PManager(username, callbacks);
    
    // Initialiser la connexion en simulant un serveur central
    manager.init().then((peerId) => {
      console.log("Mon ID peer:", peerId);
      
      // Simuler une connexion après un court délai
      setTimeout(() => {
        // Simuler la détermination aléatoire des couleurs
        const randomColor = Math.random() < 0.5 ? 'w' : 'b';
        setPlayerColor(randomColor);
        setIsFlipped(settings.startWithFlippedBoard || randomColor === 'b');
        
        // Simuler une connexion établie
        setIsConnecting(false);
        
        setP2pManager(manager);
      }, 1500);
    }).catch((error) => {
      console.error("Erreur d'initialisation P2P:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'initialiser la connexion P2P.",
        variant: "destructive"
      });
    });
    
    return () => {
      if (manager) {
        manager.disconnect();
      }
    };
  };
  
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
    if (game.turn() !== playerColor || isGameOver || isConnecting || isSearching) return;
    
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
      const result = newGame.move(move);
      
      if (result) {
        setGame(newGame);
        
        // Envoyer le coup à l'adversaire
        if (p2pManager) {
          p2pManager.sendMove(result.san);
        }
        
        // Réinitialiser l'offre de nulle
        if (drawOffered) {
          setDrawOffered(false);
        }
        if (drawOfferReceived) {
          setDrawOfferReceived(false);
        }
        
        // Vérifier si le jeu est terminé
        if (newGame.isGameOver()) {
          setIsGameOver(true);
          if (p2pManager) {
            let result;
            if (newGame.isCheckmate()) {
              result = `Échec et mat ! ${newGame.turn() === 'w' ? 'Noirs' : 'Blancs'} gagnent.`;
            } else if (newGame.isDraw()) {
              result = newGame.isStalemate() 
                ? "Pat ! Partie nulle." 
                : newGame.isThreefoldRepetition() 
                  ? "Répétition triple de la position ! Partie nulle." 
                  : "Matériel insuffisant pour mater ! Partie nulle.";
            }
            p2pManager.sendMessage(P2PEventType.GAME_OVER, result);
          }
        }
      }
    } catch (error) {
      console.error("Coup invalide :", error);
    }
  };
  
  // Temps écoulé
  const handleTimeout = (color: ChessColor) => {
    setIsGameOver(true);
    const result = `Temps écoulé pour les ${color === 'w' ? 'blancs' : 'noirs'} ! ${color === playerColor ? 'Vous avez' : 'Votre adversaire a'} perdu la partie.`;
    
    toast({
      title: "Temps écoulé",
      description: result,
    });
    
    if (p2pManager) {
      p2pManager.sendMessage(P2PEventType.GAME_OVER, result);
    }
  };
  
  // Abandonner
  const handleResign = () => {
    if (!isGameOver && p2pManager) {
      p2pManager.resign();
      setIsGameOver(true);
      toast({
        title: "Abandon",
        description: "Vous avez abandonné la partie.",
      });
    }
    setResignConfirmOpen(false);
  };
  
  // Proposer nulle
  const handleOfferDraw = () => {
    if (!isGameOver && p2pManager && !drawOffered && !drawOfferReceived) {
      p2pManager.offerDraw();
      setDrawOffered(true);
      toast({
        title: "Nulle proposée",
        description: "Vous avez proposé une partie nulle.",
      });
    }
  };
  
  // Accepter nulle
  const handleAcceptDraw = () => {
    if (!isGameOver && p2pManager && drawOfferReceived) {
      p2pManager.acceptDraw();
      setIsGameOver(true);
      setDrawOfferReceived(false);
      toast({
        title: "Partie nulle",
        description: "Vous avez accepté la nulle.",
      });
    }
  };
  
  // Refuser nulle
  const handleDeclineDraw = () => {
    if (!isGameOver && p2pManager && drawOfferReceived) {
      p2pManager.declineDraw();
      setDrawOfferReceived(false);
      toast({
        title: "Nulle refusée",
        description: "Vous avez refusé la nulle.",
      });
    }
  };
  
  // Retour au menu
  const handleBackToMenu = () => {
    navigate('/');
  };
  
  // Annuler la recherche
  const handleCancelSearch = () => {
    navigate('/');
  };
  
  // Vérifier si le jeu est terminé
  useEffect(() => {
    if (game.isGameOver()) {
      setIsGameOver(true);
      
      let result;
      if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? 'b' : 'w';
        toast({
          title: winner === playerColor ? "Victoire !" : "Défaite !",
          description: "Échec et mat !",
        });
      } else if (game.isDraw()) {
        toast({
          title: "Partie nulle",
          description: game.isStalemate() 
            ? "Pat !" 
            : game.isThreefoldRepetition() 
              ? "Répétition triple de la position !" 
              : "Matériel insuffisant pour mater !",
        });
      }
    }
  }, [game]);
  
  return (
    <div className="min-h-screen bg-chess-dark text-white p-4">
      <div className="container mx-auto">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <h1 className="text-2xl font-bold mb-4">Recherche d'un adversaire...</h1>
            <div className="w-16 h-16 mb-4">
              <Loader2 className="animate-spin h-16 w-16 text-chess-blue" />
            </div>
            <p className="text-lg mb-2">Temps écoulé: {formatSearchTime(searchTimeElapsed)}</p>
            <p className="text-sm text-gray-400 mb-8">Recherche d'un adversaire avec un classement similaire ({rating})</p>
            
            <Button 
              variant="outline" 
              onClick={handleCancelSearch}
              className="flex items-center"
            >
              <X className="mr-2 h-4 w-4" />
              Annuler la recherche
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Colonne de gauche (infos) - visible sur desktop */}
            <div className="hidden md:block">
              <h1 className="text-2xl font-bold mb-4">Partie en ligne</h1>
              <GameInfo 
                game={game}
                whiteUsername={playerColor === 'w' ? username : opponentName}
                blackUsername={playerColor === 'b' ? username : opponentName}
                whiteRating={playerColor === 'w' ? rating : opponentRating}
                blackRating={playerColor === 'b' ? rating : opponentRating}
              />
              
              {/* Statut de la connexion */}
              {isConnecting && (
                <div className="mt-4 p-3 bg-yellow-800 bg-opacity-30 rounded-md flex items-center">
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  <span>Connexion en cours...</span>
                </div>
              )}
              
              {/* Propositions de nulle */}
              {drawOffered && (
                <div className="mt-4 p-3 bg-blue-800 bg-opacity-30 rounded-md">
                  <p>Vous avez proposé la nulle.</p>
                  <p className="text-sm mt-1">En attente de la réponse de votre adversaire...</p>
                </div>
              )}
              
              {drawOfferReceived && (
                <div className="mt-4 p-3 bg-green-800 bg-opacity-30 rounded-md">
                  <p>Votre adversaire propose la nulle.</p>
                  <div className="flex gap-2 mt-2">
                    <button 
                      className="px-3 py-1 bg-green-600 rounded text-sm"
                      onClick={handleAcceptDraw}
                    >
                      Accepter
                    </button>
                    <button 
                      className="px-3 py-1 bg-red-600 rounded text-sm"
                      onClick={handleDeclineDraw}
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Colonne centrale (échiquier) */}
            <div className="md:col-span-2">
              <div className="flex flex-col gap-4">
                {/* Timer */}
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
                    disabled={isGameOver || game.turn() !== playerColor || isConnecting}
                  />
                </div>
                
                {/* Contrôles */}
                <div className="flex justify-center mt-4">
                  <GameControls 
                    onFlipBoard={() => setIsFlipped(!isFlipped)}
                    onResign={() => setResignConfirmOpen(true)}
                    onOfferDraw={handleOfferDraw}
                    onBackToMenu={handleBackToMenu}
                  />
                </div>
                
                {/* Infos mobile */}
                <div className="block md:hidden mt-4">
                  <GameInfo 
                    game={game}
                    whiteUsername={playerColor === 'w' ? username : opponentName}
                    blackUsername={playerColor === 'b' ? username : opponentName}
                    whiteRating={playerColor === 'w' ? rating : opponentRating}
                    blackRating={playerColor === 'b' ? rating : opponentRating}
                  />
                  
                  {/* Statut de la connexion (mobile) */}
                  {isConnecting && (
                    <div className="mt-4 p-3 bg-yellow-800 bg-opacity-30 rounded-md flex items-center">
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      <span>Connexion en cours...</span>
                    </div>
                  )}
                  
                  {/* Propositions de nulle (mobile) */}
                  {drawOffered && (
                    <div className="mt-4 p-3 bg-blue-800 bg-opacity-30 rounded-md">
                      <p>Vous avez proposé la nulle.</p>
                      <p className="text-sm mt-1">En attente de la réponse de votre adversaire...</p>
                    </div>
                  )}
                  
                  {drawOfferReceived && (
                    <div className="mt-4 p-3 bg-green-800 bg-opacity-30 rounded-md">
                      <p>Votre adversaire propose la nulle.</p>
                      <div className="flex gap-2 mt-2">
                        <button 
                          className="px-3 py-1 bg-green-600 rounded text-sm"
                          onClick={handleAcceptDraw}
                        >
                          Accepter
                        </button>
                        <button 
                          className="px-3 py-1 bg-red-600 rounded text-sm"
                          onClick={handleDeclineDraw}
                        >
                          Refuser
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Confirmation d'abandon */}
      <Dialog open={resignConfirmOpen} onOpenChange={setResignConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abandonner la partie ?</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir abandonner cette partie ? Cette action est définitive.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <button 
              className="px-4 py-2 bg-gray-200 rounded text-gray-800"
              onClick={() => setResignConfirmOpen(false)}
            >
              Annuler
            </button>
            <button 
              className="px-4 py-2 bg-red-600 rounded text-white"
              onClick={handleResign}
            >
              Abandonner
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RandomGame;
