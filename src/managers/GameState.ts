import { GameSession, LevelConfig, SurvivalSession, SkillType, SURVIVAL_CONFIG, OrbType } from '../types';

export class GameStateManager {
  private static instance: GameStateManager | null = null;
  private session: GameSession | null = null;
  private survivalSession: SurvivalSession | null = null;
  private currentLevelConfig: LevelConfig | null = null;
  private currentMode: 'classic' | 'survival' | null = null;

  private constructor() {}

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  startSession(levelConfig: LevelConfig): void {
    this.currentMode = 'classic';
    this.survivalSession = null;
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

  startSurvivalSession(selectedSkill: SkillType = 'freeze'): void {
    this.currentMode = 'survival';
    this.session = null;
    this.currentLevelConfig = null;
    this.survivalSession = {
      gameMode: 'survival',
      score: 0,
      combo: 0,
      maxCombo: 0,
      lives: SURVIVAL_CONFIG.initialLives,
      maxLives: SURVIVAL_CONFIG.initialLives,
      shield: 0,
      wave: 1,
      totalOrbsClicked: 0,
      normalOrbsClicked: 0,
      trapOrbsClicked: 0,
      shieldOrbsClicked: 0,
      orbsMissed: 0,
      survivalTime: 0,
      isFrenzy: false,
      frenzyRemaining: 0,
      frenzyWaveCount: 0,
      isPaused: false,
      isGameOver: false,
      activeSkill: selectedSkill,
      skillCooldowns: {
        freeze: 0,
        clear: 0,
        heal: 0
      },
      isTimeFrozen: false,
      freezeRemaining: 0,
      startTime: Date.now()
    };
  }

  getSession(): GameSession {
    if (!this.session) {
      throw new Error('No active game session');
    }
    return this.session;
  }

  getSurvivalSession(): SurvivalSession {
    if (!this.survivalSession) {
      throw new Error('No active survival session');
    }
    return this.survivalSession;
  }

  getLevelConfig(): LevelConfig {
    if (!this.currentLevelConfig) {
      throw new Error('No active level config');
    }
    return this.currentLevelConfig;
  }

  getCurrentMode(): 'classic' | 'survival' | null {
    return this.currentMode;
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

  addSurvivalScore(points: number): void {
    if (!this.survivalSession || this.survivalSession.isGameOver) return;
    const multiplier = this.survivalSession.isFrenzy ? SURVIVAL_CONFIG.frenzyMultiplier : 1;
    const finalPoints = Math.floor(points * multiplier);
    this.survivalSession.score += finalPoints;
    this.survivalSession.totalOrbsClicked++;
    this.survivalSession.normalOrbsClicked++;
    this.survivalSession.combo++;

    if (this.survivalSession.combo > this.survivalSession.maxCombo) {
      this.survivalSession.maxCombo = this.survivalSession.combo;
    }
  }

  handleTrapClick(): void {
    if (!this.survivalSession || this.survivalSession.isGameOver) return;
    this.survivalSession.trapOrbsClicked++;
    this.survivalSession.combo = 0;
    this.takeDamage(1);
  }

  handleShieldClick(): void {
    if (!this.survivalSession || this.survivalSession.isGameOver) return;
    this.survivalSession.shieldOrbsClicked++;
    this.survivalSession.shield = Math.min(this.survivalSession.shield + 1, 3);
    this.survivalSession.combo++;
    if (this.survivalSession.combo > this.survivalSession.maxCombo) {
      this.survivalSession.maxCombo = this.survivalSession.combo;
    }
  }

  missOrb(): void {
    if (!this.session || this.session.isGameOver) return;
    this.session.orbsMissed++;
    this.session.combo = 0;
  }

  missSurvivalOrb(orbType: OrbType): void {
    if (!this.survivalSession || this.survivalSession.isGameOver) return;
    this.survivalSession.orbsMissed++;
    
    if (orbType === 'normal') {
      this.survivalSession.combo = 0;
      if (Math.random() < SURVIVAL_CONFIG.missDamageChance) {
        this.takeDamage(1);
      }
    }
  }

  takeDamage(amount: number): void {
    if (!this.survivalSession || this.survivalSession.isGameOver) return;
    
    if (this.survivalSession.shield > 0) {
      const shieldAbsorbed = Math.min(this.survivalSession.shield, amount);
      this.survivalSession.shield -= shieldAbsorbed;
      amount -= shieldAbsorbed;
    }
    
    if (amount > 0) {
      this.survivalSession.lives -= amount;
      if (this.survivalSession.lives <= 0) {
        this.survivalSession.lives = 0;
        this.survivalSession.isGameOver = true;
      }
    }
  }

  heal(amount: number): void {
    if (!this.survivalSession || this.survivalSession.isGameOver) return;
    this.survivalSession.lives = Math.min(
      this.survivalSession.lives + amount,
      this.survivalSession.maxLives
    );
  }

  activateFreeze(duration: number): void {
    if (!this.survivalSession || this.survivalSession.isGameOver) return;
    this.survivalSession.isTimeFrozen = true;
    this.survivalSession.freezeRemaining = duration;
  }

  triggerFrenzy(): void {
    if (!this.survivalSession || this.survivalSession.isGameOver) return;
    this.survivalSession.isFrenzy = true;
    this.survivalSession.frenzyRemaining = SURVIVAL_CONFIG.frenzyDuration;
    this.survivalSession.frenzyWaveCount++;
    this.survivalSession.wave++;
  }

  useSkill(skillType: SkillType): boolean {
    if (!this.survivalSession || this.survivalSession.isGameOver) return false;
    if (this.survivalSession.skillCooldowns[skillType] > 0) return false;
    if (this.survivalSession.activeSkill !== skillType) return false;

    const skill = SURVIVAL_CONFIG;
    this.survivalSession.skillCooldowns[skillType] = SURVIVAL_CONFIG.frenzyInterval;
    return true;
  }

  updateSurvivalTime(delta: number): void {
    if (!this.survivalSession || this.survivalSession.isPaused || this.survivalSession.isGameOver) return;
    
    if (!this.survivalSession.isTimeFrozen) {
      this.survivalSession.survivalTime += delta;
    }

    if (this.survivalSession.isTimeFrozen) {
      this.survivalSession.freezeRemaining -= delta;
      if (this.survivalSession.freezeRemaining <= 0) {
        this.survivalSession.isTimeFrozen = false;
        this.survivalSession.freezeRemaining = 0;
      }
    }

    if (this.survivalSession.isFrenzy) {
      this.survivalSession.frenzyRemaining -= delta;
      if (this.survivalSession.frenzyRemaining <= 0) {
        this.survivalSession.isFrenzy = false;
        this.survivalSession.frenzyRemaining = 0;
      }
    }

    (['freeze', 'clear', 'heal'] as SkillType[]).forEach(skill => {
      if (this.survivalSession!.skillCooldowns[skill] > 0) {
        this.survivalSession!.skillCooldowns[skill] = Math.max(0, this.survivalSession!.skillCooldowns[skill] - delta);
      }
    });

    const timeForNextFrenzy = this.survivalSession.frenzyWaveCount * SURVIVAL_CONFIG.frenzyInterval;
    if (!this.survivalSession.isFrenzy && this.survivalSession.survivalTime >= timeForNextFrenzy) {
      this.triggerFrenzy();
    }
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
    if (this.currentMode === 'classic' && this.session) {
      if (this.session.isGameOver) return false;
      this.session.isPaused = !this.session.isPaused;
      return this.session.isPaused;
    } else if (this.currentMode === 'survival' && this.survivalSession) {
      if (this.survivalSession.isGameOver) return false;
      this.survivalSession.isPaused = !this.survivalSession.isPaused;
      return this.survivalSession.isPaused;
    }
    return false;
  }

  pause(): void {
    if (this.currentMode === 'classic' && this.session && !this.session.isGameOver) {
      this.session.isPaused = true;
    } else if (this.currentMode === 'survival' && this.survivalSession && !this.survivalSession.isGameOver) {
      this.survivalSession.isPaused = true;
    }
  }

  resume(): void {
    if (this.currentMode === 'classic' && this.session) {
      this.session.isPaused = false;
    } else if (this.currentMode === 'survival' && this.survivalSession) {
      this.survivalSession.isPaused = false;
    }
  }

  isActive(): boolean {
    if (this.currentMode === 'classic') {
      return this.session !== null && !this.session.isGameOver;
    } else if (this.currentMode === 'survival') {
      return this.survivalSession !== null && !this.survivalSession.isGameOver;
    }
    return false;
  }

  getComboMultiplier(): number {
    if (this.currentMode === 'classic' && this.session) {
      const combo = this.session.combo;
      if (combo >= 20) return 3;
      if (combo >= 10) return 2;
      if (combo >= 5) return 1.5;
      return 1;
    } else if (this.currentMode === 'survival' && this.survivalSession) {
      const combo = this.survivalSession.combo;
      if (combo >= 20) return 3;
      if (combo >= 10) return 2;
      if (combo >= 5) return 1.5;
      return 1;
    }
    return 1;
  }

  getSpawnInterval(): number {
    if (!this.survivalSession) return SURVIVAL_CONFIG.baseSpawnInterval;
    const waveFactor = 1 - (this.survivalSession.wave - 1) * 0.05;
    const frenzyFactor = this.survivalSession.isFrenzy ? 0.6 : 1;
    return Math.max(400, SURVIVAL_CONFIG.baseSpawnInterval * waveFactor * frenzyFactor);
  }

  endSession(): void {
    this.session = null;
    this.survivalSession = null;
    this.currentLevelConfig = null;
    this.currentMode = null;
  }

  getAccuracy(): number {
    if (this.currentMode === 'classic' && this.session) {
      const total = this.session.orbsClicked + this.session.orbsMissed;
      if (total === 0) return 100;
      return Math.round((this.session.orbsClicked / total) * 100);
    } else if (this.currentMode === 'survival' && this.survivalSession) {
      const total = this.survivalSession.totalOrbsClicked + this.survivalSession.orbsMissed;
      if (total === 0) return 100;
      return Math.round((this.survivalSession.totalOrbsClicked / total) * 100);
    }
    return 0;
  }
}
