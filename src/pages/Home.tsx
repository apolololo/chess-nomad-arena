
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Gamepad2, User, Users, ChevronsDown, Trophy, Settings, Info, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import GameSetupDialog, { GameSettings } from '@/components/GameSetupDialog';
import { GameMode } from '@/lib/chess-utils';
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { preloadSounds, toggleSounds } from '@/lib/audio';

const Home = () => {
  const { username } = useUser();
  const [isGameSetupOpen, setIsGameSetupOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.AI);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Précharger les sons au chargement de la page
  useEffect(() => {
    preloadSounds().then(() => {
      setIsLoaded(true);
    });
  }, []);

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

  const handleToggleSound = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    toggleSounds(newSoundEnabled);
    toast({
      title: newSoundEnabled ? "Sons activés" : "Sons désactivés",
      description: newSoundEnabled 
        ? "Les sons du jeu ont été activés." 
        : "Les sons du jeu ont été désactivés.",
    });
  };

  return (
    <div className="page-container bg-gradient-to-b from-chess-dark to-slate-900">
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto py-4 px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold">
              <span className="heading-gradient">Chess Nomad Arena</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleToggleSound}
              className="rounded-full"
            >
              {soundEnabled ? <Volume2 /> : <VolumeX />}
            </Button>
            
            <div className="username-badge">
              <User className="h-4 w-4" />
              <span className="font-medium">{username}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="content-container flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto animate-fade-in">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="heading-gradient">Bienvenue sur Chess Nomad Arena</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
              Jouez aux échecs en ligne sans inscription. <br className="hidden md:block" />
              Vos parties, vos règles, votre liberté.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div 
              className="game-mode-card"
              onClick={() => handleOpenGameSetup(GameMode.AI)}
            >
              <div className="p-4 bg-blue-500/20 rounded-full">
                <Gamepad2 className="h-10 w-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold">Jouer contre l'IA</h3>
              <p className="text-gray-400 text-center">Affrontez une intelligence artificielle avec différents niveaux de difficulté</p>
              <Button variant="default" className="mt-2 w-full">
                Commencer
              </Button>
            </div>
            
            <div 
              className="game-mode-card"
              onClick={() => handleOpenGameSetup(GameMode.FRIEND)}
            >
              <div className="p-4 bg-green-500/20 rounded-full">
                <User className="h-10 w-10 text-green-400" />
              </div>
              <h3 className="text-xl font-bold">Jouer avec un ami</h3>
              <p className="text-gray-400 text-center">Invitez un ami en partageant simplement un lien et jouez ensemble</p>
              <Button variant="default" className="mt-2 w-full">
                Créer une partie
              </Button>
            </div>
            
            <div 
              className="game-mode-card"
              onClick={() => handleOpenGameSetup(GameMode.RANDOM)}
            >
              <div className="p-4 bg-purple-500/20 rounded-full">
                <Users className="h-10 w-10 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold">Trouver un adversaire</h3>
              <p className="text-gray-400 text-center">Jouez contre un autre joueur aléatoire en ligne</p>
              <Button variant="default" className="mt-2 w-full">
                Rechercher
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center mt-12 mb-6">
            <Button variant="ghost" size="icon" className="animate-bounce">
              <ChevronsDown className="h-6 w-6 text-gray-400" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="p-6 rounded-xl border border-white/10 bg-secondary/10 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="h-6 w-6 text-yellow-400" />
                <h3 className="text-xl font-bold">Classement</h3>
              </div>
              <p className="text-gray-400">
                Améliorez votre classement en gagnant des parties contre l'IA et d'autres joueurs.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-white/10 bg-secondary/10 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <Info className="h-6 w-6 text-blue-400" />
                <h3 className="text-xl font-bold">À propos</h3>
              </div>
              <p className="text-gray-400">
                Chess Nomad Arena est une plateforme d'échecs en ligne sans inscription, simple et accessible à tous.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-white/10 py-6">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">
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
