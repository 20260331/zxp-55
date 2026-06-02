import { SaveData, PlayerData, EXP_PER_LEVEL, GameSession, CURRENCY_PER_SCORE } from '../types';
import { TASKS, getTaskById } from '../config/tasks';
import { LEVELS } from '../config/levels';

const STORAGE_KEY = 'neon_transition_save_v1';
const SAVE_VERSION = '1.0.0';

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
        this.migrateIfNeeded();
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
      createdAt: now,
      updatedAt: now
    };
    this.save();
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
      lastPlayed: Date.now()
    };
  }

  private migrateIfNeeded(): void {
    if (!this.saveData) return;
    if (this.saveData.version === SAVE_VERSION) return;
    this.saveData.version = SAVE_VERSION;
    this.save();
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

  updatePlayerFromSession(session: GameSession): { leveledUp: boolean; newLevel: number; completedTasks: string[]; earnedCurrency: number } {
    const player = this.getPlayer();
    const levelUpResult = { leveledUp: false, newLevel: player.level, completedTasks: [] as string[], earnedCurrency: 0 };

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

    this.save();
    return levelUpResult;
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

  getSaveData(): SaveData | null {
    return this.saveData;
  }
}
