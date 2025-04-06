
import React, { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { ChessGame } from './components/ChessGame';
import { GameModeSelector } from './components/GameModeSelector';
import { GameSettingsDialog } from './components/GameSettings';
import { Copy, ChevronRight } from 'lucide-react';
import type { GameMode, GameSettings, GameState, AILevel } from './lib/types';
import { supabase } from './lib/supabase';
import { toast, Toaster } from './components/ui/toast';

function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // Check if there's a game ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('game');
    if (id) {
      setGameId(id);
      setPlayerColor('black');
      setGameMode('friend');
    }
  }, []);

  const startGame = async (settings: GameSettings, aiLevel?: AILevel) => {
    const newGameId = nanoid();
    const initialState: GameState = {
      id: newGameId,
      mode: gameMode!,
      settings: {
        ...settings,
        aiLevel: aiLevel || 3
      },
      fen: 'start',
      pgn: '',
      status: gameMode === 'matchmaking' ? 'waiting' : 'playing',
      whiteTime: settings.timeControl.minutes * 60,
      blackTime: settings.timeControl.minutes * 60,
    };

    if (gameMode === 'friend') {
      window.history.pushState({}, '', `?game=${newGameId}`);
      
      // For friend games, save the game state to Supabase
      await supabase
        .from('games')
        .insert([initialState])
        .then(({ error }) => {
          if (error) console.error('Error creating game:', error);
        });

      // Notify user that the game has been created
      toast({
        title: "Partie créée",
        description: "Partagez le lien avec un ami pour commencer à jouer",
      });
    }

    setGameId(newGameId);
    setGameState(initialState);
    setShowSettings(false);

    if (gameMode === 'matchmaking') {
      setSearching(true);
      // Subscribe to matchmaking channel
      const channel = supabase
        .channel('matchmaking')
        .on('broadcast', { event: 'match_found' }, ({ payload }) => {
          setGameId(payload.gameId);
          setPlayerColor(payload.color);
          setGameState(payload.gameState);
          setSearching(false);
          
          toast({
            title: "Adversaire trouvé !",
            description: "La partie commence maintenant",
          });
        })
        .subscribe();

      // Broadcast that we're searching
      await channel.send({
        type: 'broadcast',
        event: 'searching',
        payload: { settings, gameId: newGameId }
      });
    }
  };

  const handleGameEnd = async (result: 'white' | 'black' | 'draw') => {
    if (!gameState) return;

    const updatedState: GameState = {
      ...gameState,
      status: 'finished',
      winner: result,
    };

    setGameState(updatedState);

    if (gameMode === 'matchmaking' || gameMode === 'friend') {
      // Update game history in Supabase
      await supabase
        .from('games')
        .update(updatedState)
        .eq('id', gameId)
        .then(({ error }) => {
          if (error) console.error('Error updating game:', error);
        });
    }
  };

  const handleRematch = () => {
    if (!gameState) return;
    
    // Swap colors for the rematch
    const newPlayerColor = playerColor === 'white' ? 'black' : 'white';
    setPlayerColor(newPlayerColor);
    
    // Create a new game with the same settings
    const newGameId = nanoid();
    const newGameState: GameState = {
      id: newGameId,
      mode: gameState.mode,
      settings: gameState.settings,
      fen: 'start',
      pgn: '',
      status: 'playing',
      whiteTime: gameState.settings.timeControl.minutes * 60,
      blackTime: gameState.settings.timeControl.minutes * 60,
    };
    
    setGameId(newGameId);
    setGameState(newGameState);
    
    if (gameState.mode === 'friend') {
      // Update URL with new game ID
      window.history.pushState({}, '', `?game=${newGameId}`);
      
      // Save new game to Supabase
      supabase
        .from('games')
        .insert([newGameState])
        .then(({ error }) => {
          if (error) console.error('Error creating rematch game:', error);
        });
      
      toast({
        title: "Revanche créée",
        description: "Partagez à nouveau le lien avec votre ami",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-2">
            <ChevronRight className="w-8 h-8" />
            <h1 className="text-2xl font-bold text-gray-900">Échecs en ligne</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!gameMode ? (
          <GameModeSelector onSelectMode={(mode) => {
            setGameMode(mode);
            setShowSettings(true);
          }} />
        ) : showSettings ? (
          <div className="flex justify-center">
            <GameSettingsDialog
              mode={gameMode}
              onSubmit={startGame}
            />
          </div>
        ) : searching ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg">Recherche d'un adversaire...</p>
            <button
              onClick={() => {
                setSearching(false);
                setGameMode(null);
              }}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Annuler
            </button>
          </div>
        ) : gameState ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
              <div>
                <p className="text-gray-600">Mode: {
                  gameMode === 'friend' ? 'Partie amicale' :
                  gameMode === 'ai' ? 'Contre l\'IA' :
                  'Partie classée'
                }</p>
                <p className="text-gray-600">Vous jouez les {playerColor === 'white' ? 'blancs' : 'noirs'}</p>
              </div>
              {gameMode === 'friend' && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: "Lien copié !",
                      description: "Vous pouvez maintenant le partager avec un ami",
                    });
                  }}
                  className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copier le lien</span>
                </button>
              )}
            </div>
            
            <div className="flex justify-center">
              <ChessGame
                gameId={gameId!}
                playerColor={playerColor}
                gameState={gameState}
                onGameEnd={handleGameEnd}
                onRematch={handleRematch}
              />
            </div>
          </div>
        ) : null}
      </main>
      <Toaster />
    </div>
  );
}

export default App;
