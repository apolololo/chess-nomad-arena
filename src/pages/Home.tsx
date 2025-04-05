import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Gamepad2, User, Users, ChevronsDown } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import GameSetupDialog, { GameSettings } from '@/components/GameSetupDialog';
import { GameMode } from '@/lib/chess-utils';
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';

const Home = () => {
  const { username } = useUser();
  const [isGameSetupOpen, setIsGameSetupOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.AI);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleOpenGameSetup = (mode: GameMode) => {
    setSelectedMode(mode);
    setIsGameSetupOpen(true);
  };

  const handleStartGame = (mode: GameMode, settings: GameSettings) => {
    switch (mode) {
      case GameMode.AI:
        navigate(`/play/ai`, { 
          state: { 
            settings,
            timestamp: new Date().getTime() // Force a new game on navigation
          } 
        });
        break;
      case GameMode.FRIEND:
        const gameId = uuidv4();
        navigate(`/play/friend/${gameId}`, { 
          state: { 
            settings,
            isCreator: true
          } 
        });
        break;
      case GameMode.RANDOM:
        toast({
          title: "Recherche en cours...",
          description: "Nous cherchons un adversaire pour vous...",
        });
        navigate(`/play/random`, { 
          state: { 
            settings
          } 
        });
        break;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-chess-dark p-4 text-white">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-chess-blue">Chess Nomad Arena</h1>
          <div className="flex items-center gap-2">
            <div className="bg-chess-blue bg-opacity-20 p-2 rounded-md">
              <User className="h-4 w-4 inline mr-1" />
              <span className="text-sm font-medium">{username}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">Bienvenue sur Chess Nomad Arena</h2>
          <p className="text-lg mb-8 text-gray-300">
            Jouez aux échecs en ligne sans inscription. <br />
            Vos parties, vos règles, votre liberté.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <Button 
              variant="outline" 
              size="lg" 
              className="h-32 flex flex-col gap-2 bg-opacity-10 bg-white hover:bg-opacity-20"
              onClick={() => handleOpenGameSetup(GameMode.AI)}
            >
              <Gamepad2 className="h-8 w-8" />
              <span>Jouer contre l'ordinateur</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="h-32 flex flex-col gap-2 bg-opacity-10 bg-white hover:bg-opacity-20"
              onClick={() => handleOpenGameSetup(GameMode.FRIEND)}
            >
              <User className="h-8 w-8" />
              <span>Jouer avec un ami</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="h-32 flex flex-col gap-2 bg-opacity-10 bg-white hover:bg-opacity-20"
              onClick={() => handleOpenGameSetup(GameMode.RANDOM)}
            >
              <Users className="h-8 w-8" />
              <span>Trouver un adversaire</span>
            </Button>
          </div>
          
          <div className="animate-bounce text-gray-400 flex justify-center mt-8">
            <ChevronsDown className="h-6 w-6" />
          </div>
        </div>
      </main>
      
      <footer className="bg-chess-dark border-t border-gray-800 p-4 text-gray-400">
        <div className="container mx-auto text-center">
          <p className="text-sm">
            Chess Nomad Arena © 2025 - Jouez aux échecs en toute liberté
          </p>
        </div>
      </footer>
      
      <GameSetupDialog 
        open={isGameSetupOpen} 
        onClose={() => setIsGameSetupOpen(false)}
        onStartGame={handleStartGame}
      />
    </div>
  );
};

export default Home;
