
import { Chess } from 'chess.js';

export type ChessGame = Chess;
export type ChessSquare = `${'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
export type ChessColor = 'w' | 'b';
export type TimeControl = {
  minutes: number;
  increment: number;
};

// Niveaux de difficulté
export enum AIDifficulty {
  EASY = "Débutant",
  MEDIUM = "Intermédiaire",
  HARD = "Avancé",
  EXPERT = "Expert"
}

// Modes de jeu
export enum GameMode {
  AI = "ai",
  FRIEND = "friend",
  RANDOM = "random"
}

// Convertit la position interne de l'échiquier pour l'affichage
export const convertChessPosition = (position: string, isFlipped: boolean = false): string => {
  // Si l'échiquier est flippé (vue des noirs), nous inversons les coordonnées
  if (isFlipped) {
    const file = position.charAt(0);
    const rank = position.charAt(1);
    const newFile = String.fromCharCode(219 - file.charCodeAt(0)); // 'a' devient 'h', 'b' devient 'g', etc.
    const newRank = 9 - parseInt(rank); // 1 devient 8, 2 devient 7, etc.
    return `${newFile}${newRank}`;
  }
  return position;
};

// Génère un coup d'IA simple basé sur le niveau de difficulté
export const generateAIMove = (game: ChessGame, difficulty: AIDifficulty): string | null => {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  // Plus la difficulté est élevée, plus l'IA fait de meilleurs coups
  let selectedMove;
  
  switch (difficulty) {
    case AIDifficulty.EASY:
      // Coup complètement aléatoire
      selectedMove = moves[Math.floor(Math.random() * moves.length)];
      break;
    case AIDifficulty.MEDIUM:
      // Préfère les captures mais parfois joue aléatoirement
      const captureMoves = moves.filter(move => move.flags.includes('c'));
      if (captureMoves.length > 0 && Math.random() > 0.3) {
        selectedMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
      } else {
        selectedMove = moves[Math.floor(Math.random() * moves.length)];
      }
      break;
    case AIDifficulty.HARD:
      // TODO: Implémentation plus avancée pour niveau expert
      // Pour le moment, on sélectionne parmi les coups capturant des pièces de valeur
      const valuableMoves = moves.filter(move => 
        move.flags.includes('c') && 
        (move.captured === 'q' || move.captured === 'r' || move.captured === 'b' || move.captured === 'n')
      );
      
      if (valuableMoves.length > 0 && Math.random() > 0.2) {
        selectedMove = valuableMoves[Math.floor(Math.random() * valuableMoves.length)];
      } else {
        selectedMove = moves[Math.floor(Math.random() * moves.length)];
      }
      break;
    case AIDifficulty.EXPERT:
      // Pour une vraie IA expert, il faudrait intégrer un moteur d'échecs
      // Pour l'instant, on simule en choisissant des coups un peu plus intelligents
      // Préfère les échecs, puis les captures de pièces de valeur, puis d'autres captures
      const checkMoves = moves.filter(move => move.san.includes('+'));
      const captures = moves.filter(move => move.flags.includes('c'));
      
      if (checkMoves.length > 0 && Math.random() > 0.1) {
        selectedMove = checkMoves[Math.floor(Math.random() * checkMoves.length)];
      } else if (captures.length > 0 && Math.random() > 0.2) {
        selectedMove = captures[Math.floor(Math.random() * captures.length)];
      } else {
        selectedMove = moves[Math.floor(Math.random() * moves.length)];
      }
      break;
    default:
      selectedMove = moves[Math.floor(Math.random() * moves.length)];
  }

  return selectedMove.san;
};

// Obtient toutes les cases où la pièce sélectionnée peut se déplacer
export const getLegalMoves = (game: ChessGame, square: ChessSquare): ChessSquare[] => {
  return game.moves({ 
    square: square as any, 
    verbose: true 
  }).map(move => move.to as ChessSquare);
};

// Evalue la position actuelle et donne un score (utilisé pour l'IA et l'affichage)
export const evaluatePosition = (game: ChessGame): number => {
  // Valeurs des pièces
  const pieceValues: Record<string, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0 // Le roi n'a pas de valeur matérielle pour ce calcul simple
  };

  // Récupérer la position
  const board = game.board();
  
  // Calculer l'avantage matériel
  let score = 0;
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const value = pieceValues[piece.type];
        if (piece.color === 'w') {
          score += value;
        } else {
          score -= value;
        }
      }
    }
  }
  
  return score;
};
