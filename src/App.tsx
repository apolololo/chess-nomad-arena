import React, { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { ChessGame } from './components/ChessGame';
import { GameModeSelector } from './components/GameModeSelector';
import { GameSettingsDialog } from './components/GameSettings';
import { Copy, ChevronRight } from 'lucide-react';
import type { GameMode, GameSettings, GameState, AILevel } from './lib/types';
import { supabase } from './lib/supabase';

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
      settings,
      fen: 'start',
      pgn: '',
      status: gameMode === 'matchmaking' ? 'waiting' : 'playing',
      whiteTime: settings.timeControl.minutes * 60,
      blackTime: settings.timeControl.minutes * 60,
    };

    if (gameMode === 'friend') {
      window.history.pushState({}, '', `?game=${newGameId}`);
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

    if (gameMode === 'matchmaking') {
      // Update ratings, save game history, etc.
      await supabase
        .from('games')
        .insert([updatedState]);
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
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
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
              />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default App;