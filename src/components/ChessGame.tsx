import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { supabase } from '../lib/supabase';
import { sounds } from '../lib/sounds';
import type { GameState, AILevel } from '../lib/types';
import { Flag, Clock, RotateCcw, Share2, RefreshCw, Volume2, VolumeX } from 'lucide-react';

interface ChessGameProps {
  gameId: string;
  playerColor: 'white' | 'black';
  gameState: GameState;
  onGameEnd?: (result: 'white' | 'black' | 'draw') => void;
  onRematch?: () => void;
}

export function ChessGame({ gameId, playerColor, gameState, onGameEnd, onRematch }: ChessGameProps) {
  const [game, setGame] = useState(new Chess());
  const [whiteTime, setWhiteTime] = useState(gameState.settings.timeControl.minutes * 60);
  const [blackTime, setBlackTime] = useState(gameState.settings.timeControl.minutes * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [optionSquares, setOptionSquares] = useState({});
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [showGameEndDialog, setShowGameEndDialog] = useState(false);
  const [gameResult, setGameResult] = useState<'white' | 'black' | 'draw' | null>(null);
  const engineRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialiser Stockfish
    if (gameState.mode === 'ai') {
      const worker = new Worker('/stockfish.js');
      engineRef.current = worker;
      
      worker.postMessage('uci');
      worker.postMessage('setoption name Skill Level value ' + (gameState.settings.aiLevel || 10));
      
      worker.onmessage = (e) => {
        const match = e.data.match(/bestmove ([a-h][1-8][a-h][1-8])/);
        if (match) {
          const [from, to] = [match[1].slice(0, 2), match[1].slice(2, 4)];
          makeMove({ from, to, promotion: 'q' });
        }
      };

      return () => worker.terminate();
    }
  }, []);

  useEffect(() => {
    if (gameState.pgn) {
      const newGame = new Chess();
      newGame.loadPgn(gameState.pgn);
      setGame(newGame);
    }
  }, [gameState.pgn]);

  // ... [Autres useEffects existants pour le timer et Supabase restent identiques]

  const makeAIMove = useCallback(() => {
    if (!engineRef.current || gameState.mode !== 'ai' || game.turn() === playerColor[0]) return;

    engineRef.current.postMessage('position fen ' + game.fen());
    engineRef.current.postMessage('go depth ' + (gameState.settings.aiLevel || 15));
  }, [game, playerColor]);

  const makeMove = useCallback((move: any) => {
    try {
      const newGame = new Chess(game.fen());
      const result = newGame.move(move);

      if (result) {
        // Effets sonores
        if (isSoundEnabled) {
          if (newGame.isCheck()) {
            sounds.check.play();
          } else if (result.captured) {
            sounds.capture.play();
          } else {
            sounds.move.play();
          }
        }

        setGame(newGame);
        setLastMove({ from: move.from, to: move.to });
        setIsTimerRunning(true);

        // ... [Reste de la logique de makeMove existante]

        if (newGame.isGameOver()) {
          if (isSoundEnabled) {
            sounds.gameEnd.play();
          }
          let result: 'white' | 'black' | 'draw' = 'draw';
          if (newGame.isCheckmate()) {
            result = game.turn() === 'w' ? 'black' : 'white';
          }
          setGameResult(result);
          setShowGameEndDialog(true);
          onGameEnd?.(result);
        }

        setMoveFrom(null);
        setOptionSquares({});

        // Déclencher le coup de l'IA si nécessaire
        if (gameState.mode === 'ai' && !newGame.isGameOver()) {
          makeAIMove();
        }
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
  }, [game, gameId, whiteTime, blackTime, isSoundEnabled]);

  // ... [Fonctions getMoveOptions, onSquareClick, onPieceDrop restent identiques]

  const getSquareStyles = () => {
    const squares: Record<string, { background: string }> = {};
    
    // Style pour le dernier coup
    if (lastMove) {
      squares[lastMove.from] = { background: 'rgba(255, 255, 0, 0.2)' };
      squares[lastMove.to] = { background: 'rgba(255, 255, 0, 0.2)' };
    }

    // Ajouter les styles des coups possibles
    return { ...squares, ...optionSquares };
  };

  return (
    <div className="w-full max-w-[600px]">
      <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span className="font-mono text-xl">
            {playerColor === 'black' ? formatTime(whiteTime) : formatTime(blackTime)}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="p-2 hover:bg-gray-100 rounded-full"
            title={isSoundEnabled ? 'Désactiver le son' : 'Activer le son'}
          >
            {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            onClick={() => onGameEnd?.('draw')}
            className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            <Flag className="w-4 h-4" />
            <span>Abandonner</span>
          </button>
          {gameState.mode === 'friend' && (
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Partager le lien"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span className="font-mono text-xl">
            {playerColor === 'black' ? formatTime(blackTime) : formatTime(whiteTime)}
          </span>
        </div>
      </div>

      <Chessboard 
        position={game.fen()} 
        onPieceDrop={onPieceDrop}
        onSquareClick={onSquareClick}
        boardOrientation={playerColor}
        customBoardStyle={{
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        }}
        customSquareStyles={getSquareStyles()}
      />

      {showGameEndDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-4">
              {gameResult === 'draw' ? 'Partie nulle !' : 
               gameResult === playerColor ? 'Victoire !' : 'Défaite !'}
            </h2>
            <div className="flex space-x-4">
              <button
                onClick={onRematch}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Revanche</span>
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Nouvelle partie</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}