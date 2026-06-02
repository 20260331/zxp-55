export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  orbSpawnInterval: number;
  orbLifetime: number;
  orbSpeed: number;
  targetScore: number;
  timeLimit: number;
  orbScore: number;
  unlockRequired: number;
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
}

export interface TaskConfig {
  id: string;
  name: string;
  description: string;
  type: 'score' | 'combo' | 'level' | 'total_click' | 'play_time';
  target: number;
  reward: number;
}

export interface PlayerData {
  level: number;
  exp: number;
  expToNext: number;
  totalScore: number;
  totalClicks: number;
  playTime: number;
  maxCombo: number;
  unlockedLevels: number[];
  completedLevels: number[];
  levelScores: Record<number, number>;
  completedTasks: string[];
  currency: number;
  lastPlayed: number;
}

export interface GameSession {
  currentLevel: number;
  score: number;
  combo: number;
  maxCombo: number;
  orbsClicked: number;
  orbsMissed: number;
  startTime: number;
  timeRemaining: number;
  isPaused: boolean;
  isGameOver: boolean;
  isVictory: boolean;
}

export interface SaveData {
  version: string;
  player: PlayerData;
  createdAt: number;
  updatedAt: number;
}

export const EXP_PER_LEVEL = (level: number) => Math.floor(100 * Math.pow(1.2, level - 1));
export const CURRENCY_PER_SCORE = 0.1;
