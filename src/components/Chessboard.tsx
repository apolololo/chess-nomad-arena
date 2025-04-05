
import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import ChessPiece from './ChessPiece';
import { ChessSquare, ChessGame, getLegalMoves, convertChessPosition } from '@/lib/chess-utils';

type ChessboardProps = {
  game: ChessGame;
  onMove?: (move: { from: ChessSquare; to: ChessSquare }) => void;
  isFlipped?: boolean;
  disabled?: boolean;
  highlightLastMove?: boolean;
};

const Chessboard: React.FC<ChessboardProps> = ({ 
  game, 
  onMove, 
  isFlipped = false,
  disabled = false,
  highlightLastMove = true
}) => {
  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [legalMoves, setLegalMoves] = useState<ChessSquare[]>([]);
  const [lastMove, setLastMove] = useState<{ from: ChessSquare; to: ChessSquare } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Mettre à jour le dernier coup joué
  useEffect(() => {
    const history = game.history({ verbose: true });
    if (history.length > 0) {
      const lastMoveObj = history[history.length - 1];
      setLastMove({
        from: lastMoveObj.from as ChessSquare,
        to: lastMoveObj.to as ChessSquare
      });
    } else {
      setLastMove(null);
    }
  }, [game]);

  // Gérer la sélection d'une case
  const handleSquareClick = (square: ChessSquare) => {
    if (disabled) return;
    
    // Si aucune pièce n'est sélectionnée et qu'il y a une pièce sur la case
    if (!selectedSquare) {
      const piece = game.get(square);
      // Vérifier si la pièce appartient au joueur dont c'est le tour
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        setLegalMoves(getLegalMoves(game, square));
      }
    } 
    // Si une pièce est déjà sélectionnée
    else {
      // Si la case cliquée est une destination légale, jouer le coup
      if (legalMoves.includes(square)) {
        if (onMove) {
          onMove({ from: selectedSquare, to: square });
        }
        // Réinitialiser la sélection
        setSelectedSquare(null);
        setLegalMoves([]);
      } 
      // Si on clique sur une autre pièce de la même couleur, changer la sélection
      else {
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
          setLegalMoves(getLegalMoves(game, square));
        } else {
          // Sinon, annuler la sélection
          setSelectedSquare(null);
          setLegalMoves([]);
        }
      }
    }
  };

  // Rendu de l'échiquier
  const renderBoard = () => {
    const squares = [];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

    // Si l'échiquier est retourné, inverser les rangs et les colonnes
    const displayFiles = isFlipped ? [...files].reverse() : files;
    const displayRanks = isFlipped ? [...ranks].reverse() : ranks;

    for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
      for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
        const file = displayFiles[fileIndex];
        const rank = displayRanks[rankIndex];
        const square = `${file}${rank}` as ChessSquare;
        const isLightSquare = (fileIndex + rankIndex) % 2 === 0;
        const piece = game.get(square);
        
        const isSelected = selectedSquare === square;
        const isLegalMove = legalMoves.includes(square);
        const isLastMoveFrom = lastMove && lastMove.from === square;
        const isLastMoveTo = lastMove && lastMove.to === square;

        squares.push(
          <div
            key={square}
            className={`chess-square ${isLightSquare ? 'bg-chess-light-square' : 'bg-chess-dark-square'}`}
            onClick={() => handleSquareClick(square)}
          >
            {(isLastMoveFrom || isLastMoveTo) && highlightLastMove && <div className="last-move" />}
            {isSelected && <div className="square-highlight" />}
            {piece && (
              <ChessPiece
                type={`${piece.color}${piece.type.toUpperCase()}`}
                position={square}
                isFlipped={isFlipped}
              />
            )}
            {isLegalMove && !piece && <div className="legal-move-marker" />}
            {isLegalMove && piece && <div className="square-highlight" />}
          </div>
        );
      }
    }
    return squares;
  };

  return (
    <div className="relative border border-gray-800 rounded shadow-lg" ref={boardRef}>
      <div className="chessboard">
        {renderBoard()}
      </div>
    </div>
  );
};

export default Chessboard;
