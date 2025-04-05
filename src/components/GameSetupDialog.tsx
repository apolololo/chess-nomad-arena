
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIDifficulty, GameMode, TimeControl } from '@/lib/chess-utils';

interface GameSetupProps {
  open: boolean;
  onClose: () => void;
  onStartGame: (gameMode: GameMode, settings: GameSettings) => void;
}

export interface GameSettings {
  aiDifficulty?: AIDifficulty;
  timeControl: TimeControl;
  playerColor?: 'white' | 'black' | 'random';
  startWithFlippedBoard?: boolean;
}

const defaultTimeControls: TimeControl[] = [
  { minutes: 1, increment: 0 },
  { minutes: 3, increment: 0 },
  { minutes: 3, increment: 2 },
  { minutes: 5, increment: 0 },
  { minutes: 5, increment: 3 },
  { minutes: 10, increment: 0 },
  { minutes: 10, increment: 5 },
  { minutes: 15, increment: 10 },
  { minutes: 30, increment: 0 },
  { minutes: 60, increment: 0 }
];

const GameSetupDialog: React.FC<GameSetupProps> = ({ open, onClose, onStartGame }) => {
  const [activeTab, setActiveTab] = useState<GameMode>(GameMode.AI);
  const [settings, setSettings] = useState<GameSettings>({
    aiDifficulty: AIDifficulty.MEDIUM,
    timeControl: { minutes: 5, increment: 0 },
    playerColor: 'white',
    startWithFlippedBoard: false
  });

  const handleTimeChange = (value: string) => {
    const [minutes, increment] = value.split('+').map(Number);
    setSettings({ ...settings, timeControl: { minutes, increment: increment || 0 } });
  };

  const handleDifficultyChange = (value: string) => {
    setSettings({ ...settings, aiDifficulty: value as AIDifficulty });
  };

  const handleColorChange = (value: string) => {
    setSettings({ ...settings, playerColor: value as 'white' | 'black' | 'random' });
  };

  const handleStartGame = () => {
    onStartGame(activeTab, settings);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle partie</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={GameMode.AI} onValueChange={(v) => setActiveTab(v as GameMode)}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value={GameMode.AI}>Ordinateur</TabsTrigger>
            <TabsTrigger value={GameMode.FRIEND}>Ami</TabsTrigger>
            <TabsTrigger value={GameMode.RANDOM}>Aléatoire</TabsTrigger>
          </TabsList>
          
          <TabsContent value={GameMode.AI} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-difficulty">Niveau de difficulté</Label>
              <Select 
                value={settings.aiDifficulty} 
                onValueChange={handleDifficultyChange}
              >
                <SelectTrigger id="ai-difficulty">
                  <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AIDifficulty).map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {difficulty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="player-color">Jouer avec</Label>
              <Select 
                value={settings.playerColor} 
                onValueChange={handleColorChange}
              >
                <SelectTrigger id="player-color">
                  <SelectValue placeholder="Sélectionner une couleur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">Blancs</SelectItem>
                  <SelectItem value="black">Noirs</SelectItem>
                  <SelectItem value="random">Aléatoire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value={GameMode.FRIEND} className="space-y-4">
            <p className="text-sm text-gray-500">Créez une partie et partagez le lien avec un ami pour qu'il vous rejoigne.</p>
          </TabsContent>
          
          <TabsContent value={GameMode.RANDOM} className="space-y-4">
            <p className="text-sm text-gray-500">Trouvez un adversaire aléatoire en ligne pour jouer.</p>
          </TabsContent>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="time-control">Contrôle du temps</Label>
              <Select 
                value={`${settings.timeControl.minutes}+${settings.timeControl.increment}`} 
                onValueChange={handleTimeChange}
              >
                <SelectTrigger id="time-control">
                  <SelectValue placeholder="Sélectionner un contrôle du temps" />
                </SelectTrigger>
                <SelectContent>
                  {defaultTimeControls.map((tc) => (
                    <SelectItem key={`${tc.minutes}+${tc.increment}`} value={`${tc.minutes}+${tc.increment}`}>
                      {tc.minutes} min {tc.increment > 0 ? `+ ${tc.increment} sec` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="flip-board" 
                checked={settings.startWithFlippedBoard}
                onCheckedChange={(checked) => setSettings({ ...settings, startWithFlippedBoard: checked })}
              />
              <Label htmlFor="flip-board">Retourner l'échiquier</Label>
            </div>
          </div>
        </Tabs>
        
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="button" onClick={handleStartGame}>Commencer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GameSetupDialog;
