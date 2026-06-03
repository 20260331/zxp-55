export type OrbType = 'normal' | 'trap' | 'shield';
export type GameMode = 'classic' | 'survival';
export type SkillType = 'freeze' | 'clear' | 'heal';

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

export interface SkillConfig {
  type: SkillType;
  name: string;
  description: string;
  icon: string;
  cooldown: number;
}

export interface SurvivalConfig {
  initialLives: number;
  baseSpawnInterval: number;
  orbLifetime: number;
  orbSpeed: number;
  orbScore: number;
  trapProbability: number;
  shieldProbability: number;
  frenzyInterval: number;
  frenzyDuration: number;
  frenzyMultiplier: number;
  missDamageChance: number;
}

export interface SurvivalOrb {
  orb: Phaser.GameObjects.Arc;
  type: OrbType;
  spawnTime: number;
}

export interface SurvivalSession {
  gameMode: 'survival';
  score: number;
  combo: number;
  maxCombo: number;
  lives: number;
  maxLives: number;
  shield: number;
  wave: number;
  totalOrbsClicked: number;
  normalOrbsClicked: number;
  trapOrbsClicked: number;
  shieldOrbsClicked: number;
  orbsMissed: number;
  survivalTime: number;
  isFrenzy: boolean;
  frenzyRemaining: number;
  frenzyWaveCount: number;
  isPaused: boolean;
  isGameOver: boolean;
  activeSkill: SkillType | null;
  skillCooldowns: Record<SkillType, number>;
  isTimeFrozen: boolean;
  freezeRemaining: number;
  startTime: number;
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
  bestSurvivalTime: number;
  bestSurvivalWave: number;
  bestSurvivalScore: number;
  selectedSkill: SkillType;
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

export const SKILLS: Record<SkillType, SkillConfig> = {
  freeze: {
    type: 'freeze',
    name: '时间冻结',
    description: '冻结所有球体3秒',
    icon: '❄️',
    cooldown: 20
  },
  clear: {
    type: 'clear',
    name: '全屏清除',
    description: '清除场上所有普通球',
    icon: '💥',
    cooldown: 25
  },
  heal: {
    type: 'heal',
    name: '紧急修复',
    description: '恢复1点生命',
    icon: '💚',
    cooldown: 30
  }
};

export const SURVIVAL_CONFIG: SurvivalConfig = {
  initialLives: 3,
  baseSpawnInterval: 1000,
  orbLifetime: 3000,
  orbSpeed: 900,
  orbScore: 10,
  trapProbability: 0.2,
  shieldProbability: 0.1,
  frenzyInterval: 20,
  frenzyDuration: 8,
  frenzyMultiplier: 2,
  missDamageChance: 0.3
};
