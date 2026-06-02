import { GameSession, LevelConfig } from '../types';

export class GameStateManager {
  private static instance: GameStateManager | null = null;
  private session: GameSession | null = null;
  private currentLevelConfig: LevelConfig | null = null;

  private constructor() {}

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  startSession(levelConfig: LevelConfig): void {
    this.currentLevelConfig = levelConfig;
    this.session = {
      currentLevel: levelConfig.id,
      score: 0,
      combo: 0,
      maxCombo: 0,
      orbsClicked: 0,
      orbsMissed: 0,
      startTime: Date.now(),
      timeRemaining: levelConfig.timeLimit,
      isPaused: false,
      isGameOver: false,
      isVictory: false
    };
  }

  getSession(): GameSession {
    if (!this.session) {
      throw new Error('No active game session');
    }
    return this.session;
  }

  getLevelConfig(): LevelConfig {
    if (!this.currentLevelConfig) {
      throw new Error('No active level config');
    }
    return this.currentLevelConfig;
  }

  addScore(points: number): void {
    if (!this.session || this.session.isGameOver) return;
    this.session.score += points;
    this.session.orbsClicked++;
    this.session.combo++;

    if (this.session.combo > this.session.maxCombo) {
      this.session.maxCombo = this.session.combo;
    }

    if (this.currentLevelConfig && this.session.score >= this.currentLevelConfig.targetScore) {
      this.session.isVictory = true;
      this.session.isGameOver = true;
    }
  }

  missOrb(): void {
    if (!this.session || this.session.isGameOver) return;
    this.session.orbsMissed++;
    this.session.combo = 0;
  }

  updateTime(delta: number): void {
    if (!this.session || this.session.isPaused || this.session.isGameOver) return;
    this.session.timeRemaining -= delta;

    if (this.session.timeRemaining <= 0) {
      this.session.timeRemaining = 0;
      this.session.isGameOver = true;
      if (this.currentLevelConfig && this.session.score >= this.currentLevelConfig.targetScore) {
        this.session.isVictory = true;
      }
    }
  }

  togglePause(): boolean {
    if (!this.session || this.session.isGameOver) return false;
    this.session.isPaused = !this.session.isPaused;
    return this.session.isPaused;
  }

  pause(): void {
    if (this.session && !this.session.isGameOver) {
      this.session.isPaused = true;
    }
  }

  resume(): void {
    if (this.session) {
      this.session.isPaused = false;
    }
  }

  isActive(): boolean {
    return this.session !== null && !this.session.isGameOver;
  }

  getComboMultiplier(): number {
    if (!this.session) return 1;
    const combo = this.session.combo;
    if (combo >= 20) return 3;
    if (combo >= 10) return 2;
    if (combo >= 5) return 1.5;
    return 1;
  }

  endSession(): void {
    this.session = null;
    this.currentLevelConfig = null;
  }

  getAccuracy(): number {
    if (!this.session) return 0;
    const total = this.session.orbsClicked + this.session.orbsMissed;
    if (total === 0) return 100;
    return Math.round((this.session.orbsClicked / total) * 100);
  }
}
