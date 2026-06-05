import { SaveData, PlayerData, EXP_PER_LEVEL, GameSession, CURRENCY_PER_SCORE, SurvivalSession, SkillType, DailyQuestData, DailyQuestProgress, DailyQuestConfig } from '../types';
import { TASKS, getTaskById } from '../config/tasks';
import { LEVELS } from '../config/levels';
import { generateDailyQuests, getDailyQuestById } from '../config/dailyQuests';

const STORAGE_KEY = 'neon_transition_save_v1';
const SAVE_VERSION = '1.2.0';

export class StorageManager {
  private static instance: StorageManager | null = null;
  private saveData: SaveData | null = null;

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  load(): boolean {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.saveData = JSON.parse(saved);
        if (!this.saveData || !this.saveData.player) {
          console.warn('Save data is corrupted, creating new save');
          this.createNewSave();
          return false;
        }
        this.migrateIfNeeded();
        if (!this.saveData.dailyQuests) {
          this.saveData.dailyQuests = this.createDefaultDailyQuests();
          this.save();
        }
        return true;
      }
    } catch (e) {
      console.error('Failed to load save data:', e);
    }
    this.createNewSave();
    return false;
  }

  private createNewSave(): void {
    const now = Date.now();
    this.saveData = {
      version: SAVE_VERSION,
      player: this.createDefaultPlayer(),
      dailyQuests: this.createDefaultDailyQuests(),
      createdAt: now,
      updatedAt: now
    };
    this.save();
  }

  private createDefaultDailyQuests(): DailyQuestData {
    const today = new Date().toDateString();
    const selectedQuests = generateDailyQuests();
    const quests: DailyQuestProgress[] = selectedQuests.map(quest => ({
      questId: quest.id,
      current: 0,
      target: quest.target,
      completed: false,
      claimed: false
    }));

    return {
      date: today,
      quests,
      lastReset: Date.now()
    };
  }

  private createDefaultPlayer(): PlayerData {
    return {
      level: 1,
      exp: 0,
      expToNext: EXP_PER_LEVEL(1),
      totalScore: 0,
      totalClicks: 0,
      playTime: 0,
      maxCombo: 0,
      unlockedLevels: [1],
      completedLevels: [],
      levelScores: {},
      completedTasks: [],
      currency: 0,
      lastPlayed: Date.now(),
      bestSurvivalTime: 0,
      bestSurvivalWave: 0,
      bestSurvivalScore: 0,
      selectedSkill: 'freeze'
    };
  }

  private migrateIfNeeded(): void {
    if (!this.saveData) return;
    if (this.saveData.version === SAVE_VERSION && this.saveData.dailyQuests) return;
    
    const player = this.saveData.player;
    if (player.bestSurvivalTime === undefined) player.bestSurvivalTime = 0;
    if (player.bestSurvivalWave === undefined) player.bestSurvivalWave = 0;
    if (player.bestSurvivalScore === undefined) player.bestSurvivalScore = 0;
    if (player.selectedSkill === undefined) player.selectedSkill = 'freeze' as SkillType;
    if (!this.saveData.dailyQuests) this.saveData.dailyQuests = this.createDefaultDailyQuests();
    
    this.saveData.version = SAVE_VERSION;
    this.save();
  }

  private checkDailyReset(): void {
    if (!this.saveData) return;
    
    if (!this.saveData.dailyQuests) {
      this.saveData.dailyQuests = this.createDefaultDailyQuests();
      this.save();
      return;
    }
    
    const today = new Date().toDateString();
    if (this.saveData.dailyQuests.date !== today) {
      this.saveData.dailyQuests = this.createDefaultDailyQuests();
      this.save();
    }
  }

  save(): void {
    if (!this.saveData) return;
    try {
      this.saveData.updatedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saveData));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }

  getPlayer(): PlayerData {
    if (!this.saveData) {
      this.load();
    }
    return this.saveData!.player;
  }

  getDailyQuests(): DailyQuestData {
    if (!this.saveData) {
      this.load();
    }
    this.checkDailyReset();
    if (!this.saveData!.dailyQuests) {
      this.saveData!.dailyQuests = this.createDefaultDailyQuests();
      this.save();
    }
    return this.saveData!.dailyQuests!;
  }

  getDailyQuestsWithConfig(): { quest: DailyQuestConfig; progress: DailyQuestProgress }[] {
    const dailyData = this.getDailyQuests();
    return dailyData.quests.map(progress => {
      const config = getDailyQuestById(progress.questId);
      return { quest: config!, progress };
    }).filter(item => item.quest !== undefined);
  }

  updateDailyQuestProgress(session: GameSession | SurvivalSession, isSurvival: boolean): { completedQuests: string[]; progressUpdates: { questId: string; oldValue: number; newValue: number }[] } {
    const dailyData = this.getDailyQuests();
    const completedQuests: string[] = [];
    const progressUpdates: { questId: string; oldValue: number; newValue: number }[] = [];

    for (const progress of dailyData.quests) {
      if (progress.completed || progress.claimed) continue;

      const quest = getDailyQuestById(progress.questId);
      if (!quest) continue;

      const oldValue = progress.current;
      let newValue = oldValue;

      switch (quest.type) {
        case 'daily_score':
          const score = isSurvival ? (session as SurvivalSession).score : (session as GameSession).score;
          newValue = Math.max(oldValue, score);
          break;
        case 'daily_combo':
          const maxCombo = isSurvival ? (session as SurvivalSession).maxCombo : (session as GameSession).maxCombo;
          newValue = Math.max(oldValue, maxCombo);
          break;
        case 'daily_click':
          const clicks = isSurvival ? (session as SurvivalSession).totalOrbsClicked : (session as GameSession).orbsClicked;
          newValue = oldValue + clicks;
          break;
        case 'daily_play':
          const playTime = isSurvival 
            ? Math.floor((session as SurvivalSession).survivalTime) 
            : Math.floor((Date.now() - (session as GameSession).startTime) / 1000);
          newValue = oldValue + playTime;
          break;
        case 'daily_survival':
          if (isSurvival) {
            const survivalTime = Math.floor((session as SurvivalSession).survivalTime);
            newValue = Math.max(oldValue, survivalTime);
          }
          break;
        case 'daily_level':
          if (!isSurvival && (session as GameSession).isVictory) {
            newValue = oldValue + 1;
          }
          break;
      }

      newValue = Math.min(newValue, quest.target);
      
      if (newValue !== oldValue) {
        progress.current = newValue;
        progressUpdates.push({ questId: progress.questId, oldValue, newValue });
        
        if (newValue >= quest.target && !progress.completed) {
          progress.completed = true;
          completedQuests.push(progress.questId);
        }
      }
    }

    this.save();
    return { completedQuests, progressUpdates };
  }

  claimDailyQuestReward(questId: string): boolean {
    const dailyData = this.getDailyQuests();
    const progress = dailyData.quests.find(q => q.questId === questId);
    
    if (!progress || !progress.completed || progress.claimed) {
      return false;
    }

    const quest = getDailyQuestById(questId);
    if (!quest) return false;

    progress.claimed = true;
    const player = this.getPlayer();
    player.currency += quest.reward;
    
    this.save();
    return true;
  }

  getClaimableDailyQuestCount(): number {
    const dailyData = this.getDailyQuests();
    return dailyData.quests.filter(q => q.completed && !q.claimed).length;
  }

  updatePlayerFromSession(session: GameSession): { 
    leveledUp: boolean; 
    newLevel: number; 
    completedTasks: string[]; 
    earnedCurrency: number;
    dailyQuestProgress: { completedQuests: string[]; progressUpdates: { questId: string; oldValue: number; newValue: number }[] };
  } {
    const player = this.getPlayer();
    const levelUpResult = { 
      leveledUp: false, 
      newLevel: player.level, 
      completedTasks: [] as string[], 
      earnedCurrency: 0,
      dailyQuestProgress: { completedQuests: [] as string[], progressUpdates: [] as { questId: string; oldValue: number; newValue: number }[] }
    };

    player.totalScore += session.score;
    player.totalClicks += session.orbsClicked;
    player.playTime += Math.floor((Date.now() - session.startTime) / 1000);
    player.lastPlayed = Date.now();

    if (session.maxCombo > player.maxCombo) {
      player.maxCombo = session.maxCombo;
    }

    const earnedExp = Math.floor(session.score * 0.5);
    levelUpResult.leveledUp = this.addExp(earnedExp);
    levelUpResult.newLevel = player.level;

    levelUpResult.earnedCurrency = Math.floor(session.score * CURRENCY_PER_SCORE);
    player.currency += levelUpResult.earnedCurrency;

    if (session.isVictory) {
      if (!player.completedLevels.includes(session.currentLevel)) {
        player.completedLevels.push(session.currentLevel);
      }
      const prevBest = player.levelScores[session.currentLevel] || 0;
      if (session.score > prevBest) {
        player.levelScores[session.currentLevel] = session.score;
      }
      this.unlockNextLevels(session.currentLevel);
    } else {
      const prevBest = player.levelScores[session.currentLevel] || 0;
      if (session.score > prevBest) {
        player.levelScores[session.currentLevel] = session.score;
      }
    }

    levelUpResult.completedTasks = this.checkAndCompleteTasks(session);
    levelUpResult.dailyQuestProgress = this.updateDailyQuestProgress(session, false);

    this.save();
    return levelUpResult;
  }

  updatePlayerFromSurvivalSession(session: SurvivalSession): { 
    leveledUp: boolean; 
    newLevel: number; 
    completedTasks: string[]; 
    earnedCurrency: number; 
    isNewRecord: boolean;
    dailyQuestProgress: { completedQuests: string[]; progressUpdates: { questId: string; oldValue: number; newValue: number }[] };
  } {
    const player = this.getPlayer();
    const result = { 
      leveledUp: false, 
      newLevel: player.level, 
      completedTasks: [] as string[], 
      earnedCurrency: 0,
      isNewRecord: false,
      dailyQuestProgress: { completedQuests: [] as string[], progressUpdates: [] as { questId: string; oldValue: number; newValue: number }[] }
    };

    player.totalScore += session.score;
    player.totalClicks += session.totalOrbsClicked;
    player.playTime += Math.floor(session.survivalTime);
    player.lastPlayed = Date.now();

    if (session.maxCombo > player.maxCombo) {
      player.maxCombo = session.maxCombo;
    }

    const survivalTime = Math.floor(session.survivalTime);
    if (survivalTime > player.bestSurvivalTime) {
      player.bestSurvivalTime = survivalTime;
      result.isNewRecord = true;
    }
    if (session.wave > player.bestSurvivalWave) {
      player.bestSurvivalWave = session.wave;
    }
    if (session.score > player.bestSurvivalScore) {
      player.bestSurvivalScore = session.score;
    }

    const earnedExp = Math.floor(session.score * 0.5 + survivalTime * 2);
    result.leveledUp = this.addExp(earnedExp);
    result.newLevel = player.level;

    result.earnedCurrency = Math.floor(session.score * CURRENCY_PER_SCORE + survivalTime * 0.5);
    player.currency += result.earnedCurrency;

    result.completedTasks = this.checkAndCompleteSurvivalTasks(session);
    result.dailyQuestProgress = this.updateDailyQuestProgress(session, true);

    this.save();
    return result;
  }

  setSelectedSkill(skill: SkillType): void {
    const player = this.getPlayer();
    player.selectedSkill = skill;
    this.save();
  }

  private checkAndCompleteSurvivalTasks(session: SurvivalSession): string[] {
    const player = this.getPlayer();
    const newlyCompleted: string[] = [];

    for (const task of TASKS) {
      if (player.completedTasks.includes(task.id)) continue;

      let progress = 0;
      switch (task.type) {
        case 'score':
          progress = session.score;
          break;
        case 'combo':
          progress = session.maxCombo;
          break;
        case 'level':
          progress = player.completedLevels.length;
          break;
        case 'total_click':
          progress = player.totalClicks;
          break;
        case 'play_time':
          progress = player.playTime;
          break;
      }

      if (progress >= task.target) {
        player.completedTasks.push(task.id);
        player.currency += task.reward;
        newlyCompleted.push(task.id);
      }
    }

    return newlyCompleted;
  }

  private addExp(exp: number): boolean {
    const player = this.getPlayer();
    player.exp += exp;
    let leveledUp = false;

    while (player.exp >= player.expToNext) {
      player.exp -= player.expToNext;
      player.level++;
      player.expToNext = EXP_PER_LEVEL(player.level);
      leveledUp = true;
    }

    return leveledUp;
  }

  private unlockNextLevels(completedLevelId: number): void {
    const player = this.getPlayer();
    const totalScore = player.totalScore;

    for (const level of LEVELS) {
      if (!player.unlockedLevels.includes(level.id)) {
        if (level.unlockRequired <= totalScore) {
          player.unlockedLevels.push(level.id);
        } else if (level.id === completedLevelId + 1) {
          player.unlockedLevels.push(level.id);
        }
      }
    }
  }

  private checkAndCompleteTasks(session: GameSession): string[] {
    const player = this.getPlayer();
    const newlyCompleted: string[] = [];

    for (const task of TASKS) {
      if (player.completedTasks.includes(task.id)) continue;

      let progress = 0;
      switch (task.type) {
        case 'score':
          progress = session.score;
          break;
        case 'combo':
          progress = session.maxCombo;
          break;
        case 'level':
          progress = player.completedLevels.length;
          break;
        case 'total_click':
          progress = player.totalClicks;
          break;
        case 'play_time':
          progress = player.playTime;
          break;
      }

      if (progress >= task.target) {
        player.completedTasks.push(task.id);
        player.currency += task.reward;
        newlyCompleted.push(task.id);
      }
    }

    return newlyCompleted;
  }

  isLevelUnlocked(levelId: number): boolean {
    return this.getPlayer().unlockedLevels.includes(levelId);
  }

  isLevelCompleted(levelId: number): boolean {
    return this.getPlayer().completedLevels.includes(levelId);
  }

  getLevelBestScore(levelId: number): number {
    return this.getPlayer().levelScores[levelId] || 0;
  }

  isTaskCompleted(taskId: string): boolean {
    return this.getPlayer().completedTasks.includes(taskId);
  }

  getTaskProgress(taskId: string): number {
    const player = this.getPlayer();
    const task = getTaskById(taskId);
    if (!task) return 0;

    switch (task.type) {
      case 'score':
        return 0;
      case 'combo':
        return Math.min(player.maxCombo, task.target);
      case 'level':
        return Math.min(player.completedLevels.length, task.target);
      case 'total_click':
        return Math.min(player.totalClicks, task.target);
      case 'play_time':
        return Math.min(player.playTime, task.target);
      default:
        return 0;
    }
  }

  resetSave(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.createNewSave();
  }

  refreshDailyQuests(): void {
    if (!this.saveData) return;
    this.saveData.dailyQuests = this.createDefaultDailyQuests();
    this.save();
  }

  getSaveData(): SaveData | null {
    return this.saveData;
  }
}
