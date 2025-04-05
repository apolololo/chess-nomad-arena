
import { Chess } from 'chess.js';
import { AIDifficulty, ChessGame } from './chess-utils';

// Valeurs des pièces (en centipawns - 100 = valeur d'un pion)
const PIECE_VALUES = {
  p: 100,   // Pion
  n: 320,   // Cavalier
  b: 330,   // Fou
  r: 500,   // Tour
  q: 900,   // Dame
  k: 20000  // Roi (valeur élevée pour éviter sa capture)
};

// Bonus de position pour chaque type de pièce (encourager un bon développement)
// Pour les blancs - à inverser pour les noirs
const POSITION_BONUS = {
  p: [ // Pion
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ],
  n: [ // Cavalier
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ],
  b: [ // Fou
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5,  5,  5,  5,  5,-10],
    [-10,  0,  5,  0,  0,  5,  0,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ],
  r: [ // Tour
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
  ],
  q: [ // Dame
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
  ],
  k: [ // Roi (milieu de jeu)
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
  ]
};

// Évaluation de la position actuelle (en centipawns)
const evaluatePosition = (game: ChessGame): number => {
  // Si le jeu est terminé, retourner une valeur extrême
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -10000 : 10000; // Le joueur qui a le trait a perdu
  }
  
  if (game.isDraw()) {
    return 0; // Match nul
  }

  const board = game.board();
  let score = 0;

  // Calcul du matériel et des bonus de position
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (!piece) continue;
      
      // Valeur de base de la pièce
      const value = PIECE_VALUES[piece.type];
      
      // Ajouter la valeur au score (positif pour blanc, négatif pour noir)
      if (piece.color === 'w') {
        score += value;
        // Ajouter bonus de position pour blanc
        score += POSITION_BONUS[piece.type][i][j];
      } else {
        score -= value;
        // Ajouter bonus de position pour noir (inversé)
        score -= POSITION_BONUS[piece.type][7-i][j];
      }
    }
  }

  // Petits bonus supplémentaires
  const moves = game.moves();
  const mobility = moves.length * 2; // Bonus de mobilité
  score += game.turn() === 'w' ? mobility : -mobility;
  
  // Bonus pour les échecs
  if (game.inCheck()) {
    score += game.turn() === 'w' ? -50 : 50;
  }

  return score;
};

// Minimax avec élagage alpha-beta pour déterminer le meilleur coup
const minimax = (game: ChessGame, depth: number, alpha: number, beta: number, isMaximizing: boolean): [number, string | null] => {
  // Cas de base : profondeur 0 ou fin de jeu
  if (depth === 0 || game.isGameOver()) {
    return [evaluatePosition(game), null];
  }

  let bestMove: string | null = null;
  const moves = game.moves();
  
  // Trier les coups pour améliorer l'élagage alpha-beta (captures d'abord)
  moves.sort((a, b) => {
    const captureValueA = a.includes('x') ? 10 : 0;
    const captureValueB = b.includes('x') ? 10 : 0;
    return captureValueB - captureValueA;
  });

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const move of moves) {
      const gameCopy = new Chess(game.fen());
      gameCopy.move(move);
      const [score] = minimax(gameCopy, depth - 1, alpha, beta, false);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break; // Élagage alpha
    }
    return [bestScore, bestMove];
  } else {
    let bestScore = Infinity;
    for (const move of moves) {
      const gameCopy = new Chess(game.fen());
      gameCopy.move(move);
      const [score] = minimax(gameCopy, depth - 1, alpha, beta, true);
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
      beta = Math.min(beta, bestScore);
      if (beta <= alpha) break; // Élagage beta
    }
    return [bestScore, bestMove];
  }
};

// Générer un coup en fonction de la difficulté
export const generateAIMove = (game: ChessGame, difficulty: AIDifficulty): string | null => {
  const moves = game.moves();
  if (moves.length === 0) return null;

  switch (difficulty) {
    case AIDifficulty.EASY:
      // Niveau débutant: profondeur 1 + aléatoire
      if (Math.random() < 0.5) {
        // 50% du temps, juste un coup aléatoire
        return moves[Math.floor(Math.random() * moves.length)];
      } else {
        // 50% du temps, un coup basique calculé
        const [_, move] = minimax(game, 1, -Infinity, Infinity, game.turn() === 'w');
        return move;
      }
    
    case AIDifficulty.MEDIUM:
      // Niveau intermédiaire: profondeur 2
      const [_, mediumMove] = minimax(game, 2, -Infinity, Infinity, game.turn() === 'w');
      return mediumMove;
    
    case AIDifficulty.HARD:
      // Niveau avancé: profondeur 3
      const [__, hardMove] = minimax(game, 3, -Infinity, Infinity, game.turn() === 'w');
      return hardMove;
    
    case AIDifficulty.EXPERT:
      // Niveau expert: profondeur 4
      const [___, expertMove] = minimax(game, 4, -Infinity, Infinity, game.turn() === 'w');
      return expertMove;
    
    default:
      // Par défaut, niveau intermédiaire
      return moves[Math.floor(Math.random() * moves.length)];
  }
};
