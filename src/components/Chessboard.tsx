
import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import ChessPiece from './ChessPiece';
import { ChessSquare, ChessGame, getLegalMoves, convertChessPosition } from '@/lib/chess-utils';
import { playSound, playSoundForMove, preloadSounds } from '@/lib/audio';

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
  const [draggedPiece, setDraggedPiece] = useState<{ square: ChessSquare, position: { x: number, y: number } } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const touchMoveRef = useRef<boolean>(false);
  
  // Précharger les sons au montage du composant
  useEffect(() => {
    preloadSounds();
  }, []);

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

  // Gérer le début du glisser-déposer avec la souris
  const handleDragStart = (e: React.MouseEvent, square: ChessSquare) => {
    if (disabled) return;
    
    const piece = game.get(square);
    if (!piece || piece.color !== game.turn()) {
      playSound('illegal');
      return;
    }
    
    // Calculer la position initiale
    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;
    
    const squareSize = boardRect.width / 8;
    const offsetX = e.clientX - boardRect.left;
    const offsetY = e.clientY - boardRect.top;
    
    // Démarrer le glissement
    setDraggedPiece({
      square,
      position: { x: offsetX - squareSize / 2, y: offsetY - squareSize / 2 }
    });
    
    // Jouer un son de sélection
    playSound('move');
    
    // Définir les mouvements légaux pour cette pièce
    setLegalMoves(getLegalMoves(game, square));
    
    // Ajouter les gestionnaires d'événements
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  // Gérer le début du glisser-déposer avec le toucher
  const handleTouchStart = (e: React.TouchEvent, square: ChessSquare) => {
    if (disabled) return;
    
    const piece = game.get(square);
    if (!piece || piece.color !== game.turn()) {
      playSound('illegal');
      return;
    }
    
    touchMoveRef.current = false;
    
    // Calculer la position initiale
    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;
    
    const touch = e.touches[0];
    const squareSize = boardRect.width / 8;
    const offsetX = touch.clientX - boardRect.left;
    const offsetY = touch.clientY - boardRect.top;
    
    // Démarrer le glissement
    setDraggedPiece({
      square,
      position: { x: offsetX - squareSize / 2, y: offsetY - squareSize / 2 }
    });
    
    // Jouer un son de sélection
    playSound('move');
    
    // Définir les mouvements légaux pour cette pièce
    setLegalMoves(getLegalMoves(game, square));
    
    // Ajouter les gestionnaires d'événements
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    // Empêcher le scroll et autres comportements par défaut
    e.preventDefault();
  };
  
  // Gérer le mouvement pendant le glisser-déposer avec la souris
  const handleDragMove = (e: MouseEvent) => {
    if (!draggedPiece || !boardRef.current) return;
    
    const boardRect = boardRef.current.getBoundingClientRect();
    const offsetX = e.clientX - boardRect.left;
    const offsetY = e.clientY - boardRect.top;
    const squareSize = boardRect.width / 8;
    
    setDraggedPiece({
      ...draggedPiece,
      position: { x: offsetX - squareSize / 2, y: offsetY - squareSize / 2 }
    });
  };
  
  // Gérer le mouvement pendant le glisser-déposer avec le toucher
  const handleTouchMove = (e: TouchEvent) => {
    if (!draggedPiece || !boardRef.current) return;
    
    touchMoveRef.current = true;
    
    const boardRect = boardRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const offsetX = touch.clientX - boardRect.left;
    const offsetY = touch.clientY - boardRect.top;
    const squareSize = boardRect.width / 8;
    
    setDraggedPiece({
      ...draggedPiece,
      position: { x: offsetX - squareSize / 2, y: offsetY - squareSize / 2 }
    });
    
    // Empêcher le scroll et autres comportements par défaut
    e.preventDefault();
  };
  
  // Gérer la fin du glisser-déposer avec la souris
  const handleDragEnd = (e: MouseEvent) => {
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    
    if (!draggedPiece || !boardRef.current) {
      setDraggedPiece(null);
      setLegalMoves([]);
      return;
    }
    
    // Déterminer la case de destination
    const boardRect = boardRef.current.getBoundingClientRect();
    const squareSize = boardRect.width / 8;
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
    
    // Ajuster pour l'échiquier inversé
    const displayFiles = isFlipped ? [...files].reverse() : files;
    const displayRanks = isFlipped ? [...ranks].reverse() : ranks;
    
    const x = e.clientX - boardRect.left;
    const y = e.clientY - boardRect.top;
    
    // Vérifier si le relâchement est hors de l'échiquier
    if (x < 0 || x >= boardRect.width || y < 0 || y >= boardRect.height) {
      setDraggedPiece(null);
      setLegalMoves([]);
      return;
    }
    
    const fileIndex = Math.floor(x / squareSize);
    const rankIndex = Math.floor(y / squareSize);
    
    if (fileIndex >= 0 && fileIndex < 8 && rankIndex >= 0 && rankIndex < 8) {
      const toSquare = `${displayFiles[fileIndex]}${displayRanks[rankIndex]}` as ChessSquare;
      
      // Si le coup est légal, le jouer
      if (legalMoves.includes(toSquare)) {
        if (onMove) {
          onMove({ from: draggedPiece.square, to: toSquare });
        }
      } else {
        // Jouer un son d'erreur pour un mouvement illégal
        playSound('illegal');
      }
    }
    
    setDraggedPiece(null);
    setLegalMoves([]);
  };
  
  // Gérer la fin du glisser-déposer avec le toucher
  const handleTouchEnd = (e: TouchEvent) => {
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    
    // Si c'était juste un tap (pas un mouvement), traiter comme un clic
    if (!touchMoveRef.current) {
      if (draggedPiece) {
        handleSquareClick(draggedPiece.square);
      }
      setDraggedPiece(null);
      setLegalMoves([]);
      return;
    }
    
    if (!draggedPiece || !boardRef.current) {
      setDraggedPiece(null);
      setLegalMoves([]);
      return;
    }
    
    // Déterminer la case de destination
    const boardRect = boardRef.current.getBoundingClientRect();
    const squareSize = boardRect.width / 8;
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
    
    // Ajuster pour l'échiquier inversé
    const displayFiles = isFlipped ? [...files].reverse() : files;
    const displayRanks = isFlipped ? [...ranks].reverse() : ranks;
    
    const touch = e.changedTouches[0];
    const x = touch.clientX - boardRect.left;
    const y = touch.clientY - boardRect.top;
    
    // Vérifier si le relâchement est hors de l'échiquier
    if (x < 0 || x >= boardRect.width || y < 0 || y >= boardRect.height) {
      setDraggedPiece(null);
      setLegalMoves([]);
      return;
    }
    
    const fileIndex = Math.floor(x / squareSize);
    const rankIndex = Math.floor(y / squareSize);
    
    if (fileIndex >= 0 && fileIndex < 8 && rankIndex >= 0 && rankIndex < 8) {
      const toSquare = `${displayFiles[fileIndex]}${displayRanks[rankIndex]}` as ChessSquare;
      
      // Si le coup est légal, le jouer
      if (legalMoves.includes(toSquare)) {
        if (onMove) {
          onMove({ from: draggedPiece.square, to: toSquare });
        }
      } else {
        // Jouer un son d'erreur pour un mouvement illégal
        playSound('illegal');
      }
    }
    
    setDraggedPiece(null);
    setLegalMoves([]);
  };

  // Gérer la sélection d'une case (clic)
  const handleSquareClick = (square: ChessSquare) => {
    if (disabled || draggedPiece) return;
    
    // Si aucune pièce n'est sélectionnée et qu'il y a une pièce sur la case
    if (!selectedSquare) {
      const piece = game.get(square);
      // Vérifier si la pièce appartient au joueur dont c'est le tour
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        setLegalMoves(getLegalMoves(game, square));
        // Jouer un son de sélection
        playSound('move');
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
          // Jouer un son de sélection
          playSound('move');
        } else {
          // Sinon, annuler la sélection
          setSelectedSquare(null);
          setLegalMoves([]);
          // Jouer un son de désélection
          playSound('illegal');
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
        const isDragOrigin = draggedPiece && draggedPiece.square === square;

        squares.push(
          <div
            key={square}
            className={`chess-square relative ${isLightSquare ? 'bg-chess-light-square' : 'bg-chess-dark-square'}`}
            onClick={() => handleSquareClick(square)}
          >
            {/* Coordonnées */}
            {(fileIndex === 0 || fileIndex === 7) && (rankIndex === 0 || rankIndex === 7) && (
              <div className={`absolute text-xs ${isLightSquare ? 'text-chess-dark-square' : 'text-chess-light-square'} font-semibold opacity-70 pointer-events-none
                ${fileIndex === 0 ? 'bottom-0.5 left-0.5' : 'bottom-0.5 right-0.5'}`}>
                {fileIndex === 0 ? rank : file}
              </div>
            )}
            
            {(isLastMoveFrom || isLastMoveTo) && highlightLastMove && (
              <div className="absolute inset-0 bg-blue-400 bg-opacity-30 z-10" />
            )}
            
            {isSelected && (
              <div className="absolute inset-0 bg-yellow-400 bg-opacity-40 z-10" />
            )}
            
            {piece && !isDragOrigin && (
              <ChessPiece
                type={`${piece.color}${piece.type.toUpperCase()}`}
                position={square}
                isFlipped={isFlipped}
                onMouseDown={(e) => handleDragStart(e, square)}
                onTouchStart={(e) => handleTouchStart(e, square)}
              />
            )}
            
            {isLegalMove && !piece && (
              <div className="absolute w-1/4 h-1/4 rounded-full bg-black bg-opacity-20 z-10 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            )}
            
            {isLegalMove && piece && (
              <div className="absolute inset-0 border-2 border-yellow-400 z-10" />
            )}
          </div>
        );
      }
    }
    return squares;
  };

  return (
    <div className="relative rounded-lg shadow-lg overflow-hidden touch-none" ref={boardRef}>
      <div className="chessboard">
        {renderBoard()}
      </div>
      
      {/* Pièce en cours de déplacement */}
      {draggedPiece && boardRef.current && (
        <div 
          className="absolute pointer-events-none z-50"
          style={{
            left: `${draggedPiece.position.x}px`,
            top: `${draggedPiece.position.y}px`,
            width: `${boardRef.current.offsetWidth / 8}px`,
            height: `${boardRef.current.offsetHeight / 8}px`,
          }}
        >
          <ChessPiece
            type={`${game.get(draggedPiece.square)?.color}${game.get(draggedPiece.square)?.type.toUpperCase()}`}
            position={draggedPiece.square}
            isDragging
            isFlipped={isFlipped}
          />
        </div>
      )}
    </div>
  );
};

export default Chessboard;
