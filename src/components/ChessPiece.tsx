
import React from 'react';

type ChessPieceProps = {
  type: string;
  position: string;
  isDragging?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  isFlipped?: boolean;
};

const ChessPiece: React.FC<ChessPieceProps> = ({ 
  type, 
  position, 
  isDragging = false, 
  onMouseDown,
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

  return (
    <img
      src={getPieceImage()}
      alt={`${color === 'w' ? 'White' : 'Black'} ${getPieceName(piece)}`}
      className={`chess-piece ${isDragging ? 'opacity-70' : ''} transition-transform cursor-grab`}
      onMouseDown={onMouseDown}
      draggable={false}
      style={{
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.1s',
        filter: isDragging ? 'drop-shadow(0 0 5px rgba(0,0,0,0.5))' : 'none'
      }}
    />
  );
};

export default ChessPiece;
