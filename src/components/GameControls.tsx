
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  RotateCcw, 
  Flag, 
  Handshake, 
  ArrowLeftRight, 
  Share2,
  ChevronLeft
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

type GameControlsProps = {
  onFlipBoard: () => void;
  onResign?: () => void;
  onOfferDraw?: () => void;
  onNewGame?: () => void;
  onBackToMenu: () => void;
  gameId?: string;
  showShare?: boolean;
};

const GameControls: React.FC<GameControlsProps> = ({
  onFlipBoard,
  onResign,
  onOfferDraw,
  onNewGame,
  onBackToMenu,
  gameId,
  showShare = false
}) => {
  const { toast } = useToast();

  const handleCopyGameLink = () => {
    if (!gameId) return;
    
    const url = `${window.location.origin}/play/friend/${gameId}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        toast({
          title: "Lien copié !",
          description: "Vous pouvez maintenant partager ce lien avec votre ami pour qu'il rejoigne la partie.",
        });
      })
      .catch(err => {
        toast({
          title: "Erreur",
          description: "Impossible de copier le lien. " + err,
          variant: "destructive"
        });
      });
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button variant="outline" size="sm" onClick={onBackToMenu}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Menu
      </Button>
      
      <Button variant="outline" size="sm" onClick={onFlipBoard}>
        <ArrowLeftRight className="mr-1 h-4 w-4" />
        Retourner
      </Button>
      
      {onNewGame && (
        <Button variant="outline" size="sm" onClick={onNewGame}>
          <RotateCcw className="mr-1 h-4 w-4" />
          Nouvelle partie
        </Button>
      )}
      
      {onResign && (
        <Button variant="outline" size="sm" onClick={onResign}>
          <Flag className="mr-1 h-4 w-4" />
          Abandonner
        </Button>
      )}
      
      {onOfferDraw && (
        <Button variant="outline" size="sm" onClick={onOfferDraw}>
          <Handshake className="mr-1 h-4 w-4" />
          Proposer nulle
        </Button>
      )}
      
      {showShare && gameId && (
        <Button variant="default" size="sm" onClick={handleCopyGameLink}>
          <Share2 className="mr-1 h-4 w-4" />
          Inviter un ami
        </Button>
      )}
    </div>
  );
};

export default GameControls;
