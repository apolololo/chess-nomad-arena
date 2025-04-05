
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  RotateCcw, 
  Flag, 
  Handshake, 
  ArrowLeftRight, 
  Share2,
  Home,
  Settings,
  Volume2,
  VolumeX,
  HelpCircle,
  ChevronLeft
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { toggleSounds, playSound } from "@/lib/audio";

type GameControlsProps = {
  onFlipBoard: () => void;
  onResign?: () => void;
  onOfferDraw?: () => void;
  onNewGame?: () => void;
  onBackToMenu: () => void;
  gameId?: string;
  showShare?: boolean;
  soundEnabled?: boolean;
  onToggleSound?: (enabled: boolean) => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
};

const GameControls: React.FC<GameControlsProps> = ({
  onFlipBoard,
  onResign,
  onOfferDraw,
  onNewGame,
  onBackToMenu,
  gameId,
  showShare = false,
  soundEnabled = true,
  onToggleSound,
  onOpenSettings,
  onOpenHelp
}) => {
  const { toast } = useToast();

  const handleCopyGameLink = () => {
    if (!gameId) return;
    
    const url = `${window.location.origin}/play/friend/${gameId}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        playSound('notify');
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

  const handleToggleSound = () => {
    if (onToggleSound) {
      onToggleSound(!soundEnabled);
    }
    toggleSounds(!soundEnabled);
    toast({
      title: soundEnabled ? "Sons désactivés" : "Sons activés",
      description: soundEnabled 
        ? "Les sons du jeu ont été désactivés." 
        : "Les sons du jeu ont été activés.",
    });
  };

  return (
    <div className="game-controls">
      <Button variant="secondary" size="sm" onClick={onBackToMenu} className="hover:bg-secondary/60">
        <Home className="mr-1 h-4 w-4" />
        Accueil
      </Button>
      
      <Button variant="secondary" size="sm" onClick={onFlipBoard} className="hover:bg-secondary/60">
        <ArrowLeftRight className="mr-1 h-4 w-4" />
        Retourner
      </Button>
      
      {onNewGame && (
        <Button variant="secondary" size="sm" onClick={onNewGame} className="hover:bg-secondary/60">
          <RotateCcw className="mr-1 h-4 w-4" />
          Nouvelle partie
        </Button>
      )}
      
      {onResign && (
        <Button variant="secondary" size="sm" onClick={onResign} className="hover:bg-secondary/60">
          <Flag className="mr-1 h-4 w-4" />
          Abandonner
        </Button>
      )}
      
      {onOfferDraw && (
        <Button variant="secondary" size="sm" onClick={onOfferDraw} className="hover:bg-secondary/60">
          <Handshake className="mr-1 h-4 w-4" />
          Proposer nulle
        </Button>
      )}
      
      <Button 
        variant="secondary" 
        size="sm" 
        onClick={handleToggleSound}
        className="hover:bg-secondary/60"
      >
        {soundEnabled ? (
          <Volume2 className="mr-1 h-4 w-4" />
        ) : (
          <VolumeX className="mr-1 h-4 w-4" />
        )}
        Son
      </Button>
      
      {onOpenSettings && (
        <Button variant="secondary" size="sm" onClick={onOpenSettings} className="hover:bg-secondary/60">
          <Settings className="mr-1 h-4 w-4" />
          Options
        </Button>
      )}
      
      {onOpenHelp && (
        <Button variant="secondary" size="sm" onClick={onOpenHelp} className="hover:bg-secondary/60">
          <HelpCircle className="mr-1 h-4 w-4" />
          Aide
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
