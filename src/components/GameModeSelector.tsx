import React from 'react';
import { Users, Bot, Swords, Clock, Settings } from 'lucide-react';
import type { GameMode, GameSettings } from '../lib/types';

interface GameModeSelectorProps {
  onSelectMode: (mode: GameMode) => void;
}

export function GameModeSelector({ onSelectMode }: GameModeSelectorProps) {
  const modes = [
    {
      id: 'friend',
      title: 'Jouer avec un ami',
      description: 'Créez une partie privée et invitez un ami via un lien',
      icon: Users,
    },
    {
      id: 'matchmaking',
      title: 'Partie classée',
      description: 'Affrontez un joueur de votre niveau',
      icon: Swords,
    },
    {
      id: 'ai',
      title: 'Jouer contre l\'IA',
      description: 'Entraînez-vous contre différents niveaux d\'IA',
      icon: Bot,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onSelectMode(mode.id as GameMode)}
          className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
        >
          <mode.icon className="w-12 h-12 mb-4 text-blue-600" />
          <h3 className="text-xl font-semibold mb-2">{mode.title}</h3>
          <p className="text-gray-600">{mode.description}</p>
        </button>
      ))}
    </div>
  );
}