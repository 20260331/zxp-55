import { LevelConfig } from '../types';

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: '新手街区',
    description: '熟悉游戏节奏，轻松上手',
    orbSpawnInterval: 1500,
    orbLifetime: 4000,
    orbSpeed: 800,
    targetScore: 100,
    timeLimit: 30,
    orbScore: 10,
    unlockRequired: 0,
    difficulty: 'easy'
  },
  {
    id: 2,
    name: '霓虹广场',
    description: '速度略有提升，保持专注',
    orbSpawnInterval: 1300,
    orbLifetime: 3500,
    orbSpeed: 900,
    targetScore: 200,
    timeLimit: 35,
    orbScore: 10,
    unlockRequired: 50,
    difficulty: 'easy'
  },
  {
    id: 3,
    name: '赛博大道',
    description: '中等挑战，考验反应',
    orbSpawnInterval: 1100,
    orbLifetime: 3000,
    orbSpeed: 1000,
    targetScore: 350,
    timeLimit: 40,
    orbScore: 10,
    unlockRequired: 150,
    difficulty: 'normal'
  },
  {
    id: 4,
    name: '数据洪流',
    description: '快速刷新，连击为王',
    orbSpawnInterval: 900,
    orbLifetime: 2500,
    orbSpeed: 1100,
    targetScore: 500,
    timeLimit: 45,
    orbScore: 10,
    unlockRequired: 300,
    difficulty: 'normal'
  },
  {
    id: 5,
    name: '量子迷宫',
    description: '高速挑战，极限反应',
    orbSpawnInterval: 750,
    orbLifetime: 2200,
    orbSpeed: 1200,
    targetScore: 700,
    timeLimit: 50,
    orbScore: 10,
    unlockRequired: 500,
    difficulty: 'hard'
  },
  {
    id: 6,
    name: '虚空裂隙',
    description: '终极试炼，只有强者能通关',
    orbSpawnInterval: 600,
    orbLifetime: 1800,
    orbSpeed: 1300,
    targetScore: 1000,
    timeLimit: 60,
    orbScore: 10,
    unlockRequired: 800,
    difficulty: 'extreme'
  }
];

export const getLevelById = (id: number): LevelConfig | undefined => {
  return LEVELS.find(level => level.id === id);
};

export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return '#4ade80';
    case 'normal': return '#60a5fa';
    case 'hard': return '#f59e0b';
    case 'extreme': return '#ef4444';
    default: return '#94a3b8';
  }
};

export const getDifficultyLabel = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return '简单';
    case 'normal': return '普通';
    case 'hard': return '困难';
    case 'extreme': return '极限';
    default: return '未知';
  }
};
