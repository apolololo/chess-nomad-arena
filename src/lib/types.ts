export type GameMode = 'ai' | 'friend' | 'matchmaking';

export type TimeControl = {
  minutes: number;
  increment: number;
};

export type GameSettings = {
  timeControl: TimeControl;
  rated: boolean;
};

export type GameState = {
  id: string;
  mode: GameMode;
  settings: GameSettings;
  fen: string;
  pgn: string;
  status: 'waiting' | 'playing' | 'finished';
  winner?: 'white' | 'black' | 'draw';
  whiteTime?: number;
  blackTime?: number;
  lastMoveTime?: number;
};

export type AILevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;