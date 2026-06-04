import { DailyQuestConfig } from '../types';

export const DAILY_QUEST_POOL: DailyQuestConfig[] = [
  {
    id: 'daily_score_200',
    type: 'daily_score',
    name: '小有成就',
    description: '单局得分达到200',
    target: 200,
    reward: 30,
    difficulty: 'easy'
  },
  {
    id: 'daily_score_500',
    type: 'daily_score',
    name: '得分达人',
    description: '单局得分达到500',
    target: 500,
    reward: 60,
    difficulty: 'medium'
  },
  {
    id: 'daily_score_800',
    type: 'daily_score',
    name: '高分挑战',
    description: '单局得分达到800',
    target: 800,
    reward: 100,
    difficulty: 'hard'
  },
  {
    id: 'daily_combo_5',
    type: 'daily_combo',
    name: '连击新手',
    description: '达成5连击',
    target: 5,
    reward: 25,
    difficulty: 'easy'
  },
  {
    id: 'daily_combo_10',
    type: 'daily_combo',
    name: '连击能手',
    description: '达成10连击',
    target: 10,
    reward: 50,
    difficulty: 'medium'
  },
  {
    id: 'daily_combo_15',
    type: 'daily_combo',
    name: '连击大师',
    description: '达成15连击',
    target: 15,
    reward: 80,
    difficulty: 'hard'
  },
  {
    id: 'daily_click_30',
    type: 'daily_click',
    name: '活跃手指',
    description: '累计点击30次',
    target: 30,
    reward: 20,
    difficulty: 'easy'
  },
  {
    id: 'daily_click_60',
    type: 'daily_click',
    name: '多指联动',
    description: '累计点击60次',
    target: 60,
    reward: 45,
    difficulty: 'medium'
  },
  {
    id: 'daily_click_100',
    type: 'daily_click',
    name: '点击狂魔',
    description: '累计点击100次',
    target: 100,
    reward: 75,
    difficulty: 'hard'
  },
  {
    id: 'daily_play_60',
    type: 'daily_play',
    name: '休闲时光',
    description: '累计游戏60秒',
    target: 60,
    reward: 25,
    difficulty: 'easy'
  },
  {
    id: 'daily_play_180',
    type: 'daily_play',
    name: '沉浸体验',
    description: '累计游戏180秒',
    target: 180,
    reward: 55,
    difficulty: 'medium'
  },
  {
    id: 'daily_play_300',
    type: 'daily_play',
    name: '沉迷其中',
    description: '累计游戏300秒',
    target: 300,
    reward: 90,
    difficulty: 'hard'
  },
  {
    id: 'daily_survival_30',
    type: 'daily_survival',
    name: '生存入门',
    description: '生存模式存活30秒',
    target: 30,
    reward: 35,
    difficulty: 'easy'
  },
  {
    id: 'daily_survival_60',
    type: 'daily_survival',
    name: '生存能手',
    description: '生存模式存活60秒',
    target: 60,
    reward: 70,
    difficulty: 'medium'
  },
  {
    id: 'daily_survival_120',
    type: 'daily_survival',
    name: '生存大师',
    description: '生存模式存活120秒',
    target: 120,
    reward: 120,
    difficulty: 'hard'
  },
  {
    id: 'daily_level_1',
    type: 'daily_level',
    name: '闯关先锋',
    description: '通关1个关卡',
    target: 1,
    reward: 40,
    difficulty: 'easy'
  },
  {
    id: 'daily_level_2',
    type: 'daily_level',
    name: '闯关达人',
    description: '通关2个关卡',
    target: 2,
    reward: 80,
    difficulty: 'medium'
  },
  {
    id: 'daily_level_3',
    type: 'daily_level',
    name: '闯关狂魔',
    description: '通关3个关卡',
    target: 3,
    reward: 130,
    difficulty: 'hard'
  }
];

export const getDailyQuestById = (id: string): DailyQuestConfig | undefined => {
  return DAILY_QUEST_POOL.find(quest => quest.id === id);
};

export const generateDailyQuests = (): DailyQuestConfig[] => {
  const today = new Date().toDateString();
  const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const easyQuests = DAILY_QUEST_POOL.filter(q => q.difficulty === 'easy');
  const mediumQuests = DAILY_QUEST_POOL.filter(q => q.difficulty === 'medium');
  const hardQuests = DAILY_QUEST_POOL.filter(q => q.difficulty === 'hard');
  
  const seededRandom = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };
  
  const selected: DailyQuestConfig[] = [];
  
  const easyIndex = Math.floor(seededRandom(1) * easyQuests.length);
  selected.push(easyQuests[easyIndex]);
  
  const mediumIndex = Math.floor(seededRandom(2) * mediumQuests.length);
  selected.push(mediumQuests[mediumIndex]);
  
  const hardIndex = Math.floor(seededRandom(3) * hardQuests.length);
  selected.push(hardQuests[hardIndex]);
  
  return selected;
};
