import React, { useState } from 'react';
import type { GameSettings, AILevel } from '../lib/types';

interface GameSettingsProps {
  onSubmit: (settings: GameSettings, aiLevel?: AILevel) => void;
  mode: 'ai' | 'friend' | 'matchmaking';
}

export function GameSettingsDialog({ onSubmit, mode }: GameSettingsProps) {
  const [settings, setSettings] = useState<GameSettings>({
    timeControl: { minutes: 10, increment: 0 },
    rated: mode === 'matchmaking',
  });
  const [aiLevel, setAiLevel] = useState<AILevel>(3);

  const timeControls = [
    { minutes: 1, increment: 0, label: '1 min (Bullet)' },
    { minutes: 3, increment: 2, label: '3+2 (Blitz)' },
    { minutes: 5, increment: 3, label: '5+3 (Blitz)' },
    { minutes: 10, increment: 0, label: '10 min (Rapide)' },
    { minutes: 15, increment: 10, label: '15+10 (Rapide)' },
    { minutes: 30, increment: 0, label: '30 min (Classique)' },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
      <h3 className="text-xl font-semibold mb-4">Paramètres de la partie</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contrôle du temps
          </label>
          <select
            className="w-full border rounded-lg p-2"
            value={`${settings.timeControl.minutes}-${settings.timeControl.increment}`}
            onChange={(e) => {
              const [minutes, increment] = e.target.value.split('-').map(Number);
              setSettings({
                ...settings,
                timeControl: { minutes, increment },
              });
            }}
          >
            {timeControls.map((tc) => (
              <option key={tc.label} value={`${tc.minutes}-${tc.increment}`}>
                {tc.label}
              </option>
            ))}
          </select>
        </div>

        {mode === 'ai' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Niveau de l'IA
            </label>
            <input
              type="range"
              min="1"
              max="8"
              value={aiLevel}
              onChange={(e) => setAiLevel(Number(e.target.value) as AILevel)}
              className="w-full"
            />
            <div className="text-center text-gray-600">
              Niveau {aiLevel}
            </div>
          </div>
        )}

        {mode === 'matchmaking' && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rated"
              checked={settings.rated}
              onChange={(e) => setSettings({ ...settings, rated: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="rated" className="text-sm text-gray-700">
              Partie classée
            </label>
          </div>
        )}

        <button
          onClick={() => onSubmit(settings, mode === 'ai' ? aiLevel : undefined)}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Commencer la partie
        </button>
      </div>
    </div>
  );
}