
import { Chess, Square } from 'chess.js';
import { AIDifficulty, ChessGame, evaluatePosition } from './chess-utils';

// Valeurs des pièces pour l'évaluation
const PIECE_VALUES: Record<string, number> = {
  p: 10,  // Pion
  n: 30,  // Cavalier
  b: 30,  // Fou
  r: 50,  // Tour
  q: 90,  // Dame
  k: 900  // Roi
};

// Table de position pour les pions (blanc, perspective des blancs)
const PAWN_TABLE: number[] = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];

// Table de position pour les cavaliers
const KNIGHT_TABLE: number[] = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

// Table de position pour les fous
const BISHOP_TABLE: number[] = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5,  5,  5,  5,  5,-10,
  -10,  0,  5,  0,  0,  5,  0,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

// Table de position pour les tours
const ROOK_TABLE: number[] = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0
];

// Table de position pour les dames
const QUEEN_TABLE: number[] = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
  0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

// Table de position pour le roi (milieu de partie)
const KING_MIDDLE_TABLE: number[] = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20
];

// Obtenir la valeur positionnelle pour une pièce donnée
const getPositionValue = (piece: string, square: string, isEndgame: boolean): number => {
  const file = square.charCodeAt(0) - 97; // 'a' -> 0, 'b' -> 1, etc.
  const rank = 8 - parseInt(square[1]); // '1' -> 7, '2' -> 6, etc.
  const index = rank * 8 + file;
  
  // Inverser l'index pour les pièces noires
  const color = piece[0];
  const invertedIndex = color === 'b' ? 63 - index : index;
  
  switch (piece[1]) {
    case 'p': return PAWN_TABLE[invertedIndex];
    case 'n': return KNIGHT_TABLE[invertedIndex];
    case 'b': return BISHOP_TABLE[invertedIndex];
    case 'r': return ROOK_TABLE[invertedIndex];
    case 'q': return QUEEN_TABLE[invertedIndex];
    case 'k': return KING_MIDDLE_TABLE[invertedIndex];
    default: return 0;
  }
};

// Évaluation avancée de la position actuelle
const evaluatePositionAdvanced = (game: ChessGame): number => {
  if (game.isCheckmate()) {
    // Si c'est échec et mat, c'est une victoire totale
    return game.turn() === 'w' ? -10000 : 10000;
  }
  
  if (game.isDraw() || game.isStalemate()) {
    return 0; // Un match nul vaut 0
  }
  
  const board = game.board();
  let score = 0;
  let material = 0;
  
  // On compte d'abord le matériel pour déterminer si on est en fin de partie
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const pieceValue = PIECE_VALUES[piece.type];
        material += pieceValue;
      }
    }
  }
  
  const isEndgame = material < 30; // Seuil arbitraire pour la fin de partie
  
  // Maintenant on calcule le score précis
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const square = String.fromCharCode(97 + j) + (8 - i);
        const pieceValue = PIECE_VALUES[piece.type];
        const positionValue = getPositionValue(piece.color + piece.type, square, isEndgame);
        
        if (piece.color === 'w') {
          score += pieceValue + positionValue / 10;
        } else {
          score -= pieceValue + positionValue / 10;
        }
        
        // Bonus pour les pièces protégées
        if (game.isAttacked(square as Square, piece.color)) {
          score += piece.color === 'w' ? 0.5 : -0.5;
        }
      }
    }
  }
  
  // Mobilité (nombre de coups légaux)
  const moves = game.moves();
  const mobility = moves.length / 10;
  score += game.turn() === 'w' ? mobility : -mobility;
  
  // Pénalité pour le roi exposé
  const whiteKingSquare = findKing(game, 'w');
  const blackKingSquare = findKing(game, 'b');
  
  if (whiteKingSquare && isKingExposed(game, whiteKingSquare)) {
    score -= 5;
  }
  
  if (blackKingSquare && isKingExposed(game, blackKingSquare)) {
    score += 5;
  }
  
  // Vérifier les échecs
  if (game.inCheck()) {
    score += game.turn() === 'w' ? -2 : 2;
  }
  
  return score;
};

// Trouver la position du roi
const findKing = (game: ChessGame, color: 'w' | 'b'): string | null => {
  const board = game.board();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && piece.type === 'k' && piece.color === color) {
        return String.fromCharCode(97 + j) + (8 - i);
      }
    }
  }
  return null;
};

// Vérifier si le roi est exposé
const isKingExposed = (game: ChessGame, kingSquare: string): boolean => {
  const file = kingSquare.charCodeAt(0) - 97;
  const rank = 8 - parseInt(kingSquare[1]);
  
  // Vérifier si le roi est au centre (plus exposé)
  const centralExposure = (file > 1 && file < 6) && (rank > 1 && rank < 6);
  
  // Vérifier si le roi est attaqué
  const kingColor = game.get(kingSquare as Square)?.color;
  const isAttacked = kingColor && game.isAttacked(kingSquare as Square, kingColor === 'w' ? 'b' : 'w');
  
  return centralExposure || isAttacked;
};

// Algorithme Minimax avec élagage alpha-bêta
const minimax = (
  game: ChessGame, 
  depth: number, 
  alpha: number, 
  beta: number, 
  isMaximizingPlayer: boolean
): number => {
  if (depth === 0 || game.isGameOver()) {
    return evaluatePositionAdvanced(game);
  }
  
  const moves = game.moves({ verbose: true });
  
  // Trier les coups pour optimiser l'élagage
  moves.sort((a, b) => {
    // Priorité aux captures
    const captureValueA = a.captured ? PIECE_VALUES[a.captured] : 0;
    const captureValueB = b.captured ? PIECE_VALUES[b.captured] : 0;
    return captureValueB - captureValueA;
  });
  
  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break; // Élagage alpha
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break; // Élagage bêta
    }
    return minEval;
  }
};

// Fonction pour générer un coup d'IA
export const generateAIMove = (game: ChessGame, difficulty: AIDifficulty): string | null => {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;
  
  let selectedMove;
  
  switch (difficulty) {
    case AIDifficulty.EASY:
      // En mode facile, jouer parfois au hasard, parfois avec un peu de stratégie
      if (Math.random() < 0.7) {
        // Coup complètement aléatoire
        selectedMove = moves[Math.floor(Math.random() * moves.length)];
      } else {
        // Coup un peu stratégique (profondeur 1)
        selectedMove = findBestMove(game, 1);
      }
      break;
      
    case AIDifficulty.MEDIUM:
      // En mode moyen, mélanger les coups aléatoires et stratégiques
      if (Math.random() < 0.3) {
        // Coup aléatoire parmi les captures ou les échecs
        const goodMoves = moves.filter(move => 
          move.flags.includes('c') || move.san.includes('+')
        );
        
        selectedMove = goodMoves.length > 0 
          ? goodMoves[Math.floor(Math.random() * goodMoves.length)]
          : moves[Math.floor(Math.random() * moves.length)];
      } else {
        // Coup plus stratégique (profondeur 2)
        selectedMove = findBestMove(game, 2);
      }
      break;
      
    case AIDifficulty.HARD:
      // En mode difficile, jouer de manière plus cohérente
      selectedMove = findBestMove(game, 3);
      break;
      
    case AIDifficulty.EXPERT:
      // En mode expert, utiliser une profondeur plus grande
      selectedMove = findBestMove(game, 4);
      break;
      
    default:
      selectedMove = moves[Math.floor(Math.random() * moves.length)];
  }
  
  return selectedMove.san;
};

// Trouver le meilleur coup avec Minimax
const findBestMove = (game: ChessGame, depth: number) => {
  const isMaximizing = game.turn() === 'w';
  const moves = game.moves({ verbose: true });
  let bestMove = null;
  let bestValue = isMaximizing ? -Infinity : Infinity;
  
  // Ajouter un peu d'aléatoire pour ne pas toujours jouer le même coup
  const randomFactor = 0.1;
  
  for (const move of moves) {
    game.move(move);
    const value = minimax(game, depth - 1, -Infinity, Infinity, !isMaximizing) + 
                  (Math.random() * 2 - 1) * randomFactor; // Petit facteur aléatoire
    game.undo();
    
    if (isMaximizing && value > bestValue) {
      bestValue = value;
      bestMove = move;
    } else if (!isMaximizing && value < bestValue) {
      bestValue = value;
      bestMove = move;
    }
  }
  
  return bestMove || moves[Math.floor(Math.random() * moves.length)];
};
