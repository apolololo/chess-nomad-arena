
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

// Format time display
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize Stockfish
    if (gameState.mode === 'ai') {
      try {
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
      } catch (error) {
        console.error('Error initializing Stockfish:', error);
      }
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        if (game.turn() === 'w') {
          setWhiteTime(prev => Math.max(0, prev - 1));
        } else {
          setBlackTime(prev => Math.max(0, prev - 1));
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, game]);

  // Check for time out
  useEffect(() => {
    if (whiteTime === 0) {
      handleGameEnd('black');
    } else if (blackTime === 0) {
      handleGameEnd('white');
    }
  }, [whiteTime, blackTime]);

  useEffect(() => {
    if (gameState.pgn) {
      try {
        const newGame = new Chess();
        newGame.loadPgn(gameState.pgn);
        setGame(newGame);
      } catch (error) {
        console.error('Error loading PGN:', error);
      }
    }
  }, [gameState.pgn]);

  const handleGameEnd = (result: 'white' | 'black' | 'draw') => {
    setIsTimerRunning(false);
    setGameResult(result);
    setShowGameEndDialog(true);
    if (onGameEnd) {
      onGameEnd(result);
    }
  };

  const makeAIMove = useCallback(() => {
    if (!engineRef.current || gameState.mode !== 'ai' || game.turn() === playerColor[0]) return;

    engineRef.current.postMessage('position fen ' + game.fen());
    engineRef.current.postMessage('go depth ' + (gameState.settings.aiLevel || 15));
  }, [game, playerColor, gameState.mode, gameState.settings.aiLevel]);

  const makeMove = useCallback((move: any) => {
    try {
      const newGame = new Chess(game.fen());
      const result = newGame.move(move);

      if (result) {
        // Sound effects
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

        // Update game state in Supabase for multiplayer games
        if (gameState.mode === 'friend' || gameState.mode === 'matchmaking') {
          const updatedState = {
            ...gameState,
            pgn: newGame.pgn(),
            fen: newGame.fen(),
            whiteTime,
            blackTime,
            lastMoveTime: Date.now(),
          };

          // Update the game in the database
          supabase
            .from('games')
            .update(updatedState)
            .eq('id', gameId)
            .then(({ error }) => {
              if (error) console.error('Error updating game:', error);
            });
        }

        if (newGame.isGameOver()) {
          if (isSoundEnabled) {
            sounds.gameEnd.play();
          }
          let result: 'white' | 'black' | 'draw' = 'draw';
          if (newGame.isCheckmate()) {
            result = game.turn() === 'w' ? 'black' : 'white';
          }
          handleGameEnd(result);
        }

        setMoveFrom(null);
        setOptionSquares({});

        // Trigger AI move if necessary
        if (gameState.mode === 'ai' && !newGame.isGameOver()) {
          setTimeout(() => {
            makeAIMove();
          }, 300);
        }
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
  }, [game, gameId, whiteTime, blackTime, isSoundEnabled, gameState, makeAIMove]);

  const getMoveOptions = useCallback((square: string) => {
    // No piece selected yet
    if (!square) return {};

    const moves = game.moves({
      square,
      verbose: true
    });
    
    if (moves.length === 0) return {};

    const newSquares: Record<string, { background: string }> = {};
    moves.forEach((move) => {
      newSquares[move.to] = {
        background: 'rgba(0, 255, 0, 0.2)',
      };
    });
    return newSquares;
  }, [game]);

  const onSquareClick = useCallback((square: string) => {
    // Check if it's the player's turn
    const isPlayerTurn = 
      (playerColor === 'white' && game.turn() === 'w') || 
      (playerColor === 'black' && game.turn() === 'b');
    
    if (!isPlayerTurn) return;

    // If we already have a piece selected
    if (moveFrom) {
      const move = {
        from: moveFrom,
        to: square,
        promotion: 'q' // always promote to queen for simplicity
      };
      
      const moveResult = game.move(move);
      
      // If the move is legal, make it
      if (moveResult) {
        makeMove(move);
      }
      // Reset the selected piece either way
      setMoveFrom(null);
      setOptionSquares({});
    } else {
      // No piece previously selected
      const piece = game.get(square);
      
      // Check if there's a piece and it belongs to the current player
      if (piece && ((piece.color === 'w' && playerColor === 'white') || 
                  (piece.color === 'b' && playerColor === 'black'))) {
        setMoveFrom(square);
        setOptionSquares(getMoveOptions(square));
      }
    }
  }, [game, moveFrom, playerColor, getMoveOptions, makeMove]);

  const onPieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      // Check if it's the player's turn
      const isPlayerTurn = 
        (playerColor === 'white' && game.turn() === 'w') || 
        (playerColor === 'black' && game.turn() === 'b');
      
      if (!isPlayerTurn) return false;

      const move = {
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // always promote to queen for simplicity
      };

      makeMove(move);
      return true;
    },
    [game, playerColor, makeMove]
  );

  const getSquareStyles = () => {
    const squares: Record<string, { background: string }> = {};
    
    // Style for the last move
    if (lastMove) {
      squares[lastMove.from] = { background: 'rgba(255, 255, 0, 0.2)' };
      squares[lastMove.to] = { background: 'rgba(255, 255, 0, 0.2)' };
    }

    // Add styles for possible moves
    return { ...squares, ...optionSquares };
  };

  // Always configure board to have player at bottom
  const boardOrientation = playerColor;

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
            onClick={() => handleGameEnd('draw')}
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
        boardOrientation={boardOrientation}
        customBoardStyle={{
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        }}
        customSquareStyles={getSquareStyles()}
        areArrowsAllowed={false}
      />

      {showGameEndDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
