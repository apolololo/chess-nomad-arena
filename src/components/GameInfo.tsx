
import React from 'react';
import { ChessGame, evaluatePosition } from '@/lib/chess-utils';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type GameInfoProps = {
  game: ChessGame;
  whiteUsername: string;
  blackUsername: string;
  whiteRating?: number;
  blackRating?: number;
};

const GameInfo: React.FC<GameInfoProps> = ({
  game,
  whiteUsername,
  blackUsername,
  whiteRating,
  blackRating
}) => {
  // Évaluation simple de la position
  const evaluation = evaluatePosition(game);
  
  // Formater l'avantage
  const formatAdvantage = (eval: number) => {
    if (eval === 0) return "Égalité";
    const advantage = Math.abs(eval);
    const color = eval > 0 ? "Blancs" : "Noirs";
    return `${color} +${advantage}`;
  };

  // Liste des coups
  const moves = game.history({ verbose: true });
  
  // Formater la notation des coups
  const formatMoveList = () => {
    const formattedMoves = [];
    
    for (let i = 0; i < moves.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = moves[i]?.san;
      const blackMove = moves[i + 1]?.san;
      
      formattedMoves.push(
        <div key={i} className="flex">
          <div className="w-8 text-gray-500">{moveNumber}.</div>
          <div className="w-14">{whiteMove}</div>
          <div className="w-14">{blackMove || ''}</div>
        </div>
      );
    }
    
    return formattedMoves;
  };

  return (
    <div className="bg-white rounded-md shadow p-4 text-gray-800 w-full">
      <div className="flex justify-between items-center mb-2">
        <div className="font-semibold text-sm">
          {blackUsername}
          {blackRating && <span className="ml-2 text-gray-500">({blackRating})</span>}
        </div>
        <div className="font-semibold text-sm">
          {whiteUsername}
          {whiteRating && <span className="ml-2 text-gray-500">({whiteRating})</span>}
        </div>
      </div>
      
      <Separator className="my-2" />
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-center mb-2 text-sm font-medium cursor-help">
              {formatAdvantage(evaluation)}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Évaluation basée sur l'avantage matériel</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Separator className="my-2" />
      
      <div className="text-xs font-medium mb-1">Historique des coups</div>
      <div className="max-h-40 overflow-y-auto text-xs">
        {formatMoveList()}
      </div>
      
      {game.isGameOver() && (
        <div className="mt-3 p-2 bg-gray-100 rounded text-center font-medium">
          {game.isCheckmate() 
            ? `Échec et mat ! ${game.turn() === 'w' ? 'Noirs' : 'Blancs'} gagnent` 
            : game.isDraw() 
              ? `Partie nulle (${game.isStalemate() ? 'pat' : game.isThreefoldRepetition() ? 'répétition' : game.isInsufficientMaterial() ? 'matériel insuffisant' : 'règle des 50 coups'})`
              : 'Partie terminée'}
        </div>
      )}
    </div>
  );
};

export default GameInfo;
