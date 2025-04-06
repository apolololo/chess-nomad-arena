
import React from 'react';

type ChessPieceProps = {
  type: string;
  position: string;
  isDragging?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  isFlipped?: boolean;
};

const ChessPiece: React.FC<ChessPieceProps> = ({ 
  type, 
  position, 
  isDragging = false, 
  onMouseDown,
  onTouchStart,
  isFlipped = false 
}) => {
  // Le type sera comme 'wP' pour un pion blanc ou 'bQ' pour une reine noire
  const color = type.charAt(0); // 'w' ou 'b'
  const piece = type.charAt(1); // 'P', 'N', 'B', 'R', 'Q', 'K'

  const getPieceImage = () => {
    const pieceName = `${color === 'w' ? 'white' : 'black'}_${getPieceName(piece)}`;
    return `/chess/${pieceName}.svg`;
  };

  const getPieceName = (piece: string) => {
    switch (piece.toUpperCase()) {
      case 'P': return 'pawn';
      case 'N': return 'knight';
      case 'B': return 'bishop';
      case 'R': return 'rook';
      case 'Q': return 'queen';
      case 'K': return 'king';
      default: return 'pawn';
    }
  };

  // Important: s'assurer que la pièce occupe toute la case et gère correctement les événements
  return (
    <div 
      className={`chess-piece-container absolute inset-0 flex items-center justify-center z-20 cursor-grab ${isDragging ? 'z-50' : ''}`}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      style={{ touchAction: 'none' }}
    >
      <img
        src={getPieceImage()}
        alt={`${color === 'w' ? 'White' : 'Black'} ${getPieceName(piece)}`}
        className={`chess-piece w-4/5 h-4/5 ${isDragging ? 'opacity-80' : ''} select-none`}
        draggable={false}
        style={{
          transform: isDragging ? 'scale(1.1)' : 'scale(1)',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          filter: isDragging ? 'drop-shadow(0 0 5px rgba(0,0,0,0.5))' : 'none',
        }}
      />
    </div>
  );
};

export default ChessPiece;
