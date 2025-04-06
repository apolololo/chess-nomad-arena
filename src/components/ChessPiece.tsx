
import React from 'react';

type ChessPieceProps = {
  type: string;
  position: string;
  isDragging?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  isFlipped?: boolean;
};

const ChessPiece: React.FC<ChessPieceProps> = () => {
  return null;
};

export default ChessPiece;
