import { TaskConfig } from '../types';

export const TASKS: TaskConfig[] = [
  {
    id: 'score_100',
    name: '初露锋芒',
    description: '单局得分达到100',
    type: 'score',
    target: 100,
    reward: 50
  },
  {
    id: 'score_500',
    name: '渐入佳境',
    description: '单局得分达到500',
    type: 'score',
    target: 500,
    reward: 100
  },
  {
    id: 'score_1000',
    name: '霓虹王者',
    description: '单局得分达到1000',
    type: 'score',
    target: 1000,
    reward: 300
  },
  {
    id: 'combo_5',
    name: '连击新手',
    description: '达成5连击',
    type: 'combo',
    target: 5,
    reward: 30
  },
  {
    id: 'combo_10',
    name: '连击达人',
    description: '达成10连击',
    type: 'combo',
    target: 10,
    reward: 80
  },
  {
    id: 'combo_20',
    name: '连击大师',
    description: '达成20连击',
    type: 'combo',
    target: 20,
    reward: 200
  },
  {
    id: 'level_complete_3',
    name: '闯关先锋',
    description: '通关3个关卡',
    type: 'level',
    target: 3,
    reward: 150
  },
  {
    id: 'level_complete_6',
    name: '全图征服者',
    description: '通关所有关卡',
    type: 'level',
    target: 6,
    reward: 500
  },
  {
    id: 'total_click_100',
    name: '点石成金',
    description: '累计点击100次',
    type: 'total_click',
    target: 100,
    reward: 40
  },
  {
    id: 'total_click_500',
    name: '多指联动',
    description: '累计点击500次',
    type: 'total_click',
    target: 500,
    reward: 120
  },
  {
    id: 'play_time_10',
    name: '休闲玩家',
    description: '累计游戏10分钟',
    type: 'play_time',
    target: 600,
    reward: 60
  },
  {
    id: 'play_time_60',
    name: '资深玩家',
    description: '累计游戏60分钟',
    type: 'play_time',
    target: 3600,
    reward: 250
  }
];

export const getTaskById = (id: string): TaskConfig | undefined => {
  return TASKS.find(task => task.id === id);
};
