import Phaser from 'phaser';
import { GameStateManager } from '../managers/GameState';
import { StorageManager } from '../managers/StorageManager';

export class GameScene extends Phaser.Scene {
  private gameState!: GameStateManager;
  private storage!: StorageManager;
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private orbs: Phaser.GameObjects.Arc[] = [];
  private spawnEvent!: Phaser.Time.TimerEvent;
  private isGameOverShown: boolean = false;

  constructor() {
    super('game-scene');
  }

  create(): void {
    this.gameState = GameStateManager.getInstance();
    this.storage = StorageManager.getInstance();

    if (!this.gameState.isActive()) {
      this.scene.start('level-select-scene');
      return;
    }

    this.cameras.main.setBackgroundColor('#081019');
    this.add.rectangle(480, 270, 960, 540, 0x081019);

    this.createUI();
    this.setupInput();
    this.startSpawning();
    this.createPauseOverlay();
  }

  private createUI(): void {
    const session = this.gameState.getSession();
    const config = this.gameState.getLevelConfig();

    this.add.text(44, 24, config.name, {
      fontFamily: 'Segoe UI',
      fontSize: '24px',
      color: '#f8fafc',
      fontStyle: 'bold'
    });

    this.scoreText = this.add.text(44, 60, `分数：${session.score}`, {
      fontFamily: 'Segoe UI',
      fontSize: '22px',
      color: '#f59e0b'
    });

    this.comboText = this.add.text(44, 90, '', {
      fontFamily: 'Segoe UI',
      fontSize: '18px',
      color: '#4fd1c5'
    });

    this.timerText = this.add.text(760, 24, `⏱ ${Math.ceil(session.timeRemaining)}s`, {
      fontFamily: 'Segoe UI',
      fontSize: '24px',
      color: '#60a5fa'
    });

    this.targetText = this.add.text(760, 58, `目标：${config.targetScore}`, {
      fontFamily: 'Segoe UI',
      fontSize: '16px',
      color: '#9fb3c8'
    });

    const pauseBtn = this.add.rectangle(900, 24, 40, 40, 0x1e293b, 0.9);
    pauseBtn.setStrokeStyle(2, 0x64748b, 0.8);
    pauseBtn.setInteractive({ useHandCursor: true });

    this.add.text(900, 24, '⏸', {
      fontFamily: 'Segoe UI',
      fontSize: '20px',
      color: '#9fb3c8'
    }).setOrigin(0.5);

    pauseBtn.on('pointerdown', () => {
      this.togglePause();
    });
  }

  private createPauseOverlay(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.pauseOverlay = this.add.container(0, 0);
    this.pauseOverlay.setVisible(false);

    const overlay = this.add.rectangle(centerX, centerY, 960, 540, 0x000000, 0.8);
    this.pauseOverlay.add(overlay);

    this.pauseOverlay.add(this.add.text(centerX, centerY - 60, '游戏暂停', {
      fontFamily: 'Segoe UI',
      fontSize: '42px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    const resumeBtn = this.add.rectangle(centerX, centerY + 10, 200, 50, 0x4fd1c5, 0.9);
    resumeBtn.setInteractive({ useHandCursor: true });
    this.pauseOverlay.add(resumeBtn);

    this.pauseOverlay.add(this.add.text(centerX, centerY + 10, '继续游戏', {
      fontFamily: 'Segoe UI',
      fontSize: '20px',
      color: '#081019',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    const quitBtn = this.add.rectangle(centerX, centerY + 80, 200, 50, 0xef4444, 0.9);
    quitBtn.setInteractive({ useHandCursor: true });
    this.pauseOverlay.add(quitBtn);

    this.pauseOverlay.add(this.add.text(centerX, centerY + 80, '退出关卡', {
      fontFamily: 'Segoe UI',
      fontSize: '20px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    resumeBtn.on('pointerdown', () => {
      this.togglePause();
    });

    quitBtn.on('pointerdown', () => {
      this.gameState.endSession();
      this.scene.start('level-select-scene');
    });
  }

  private setupInput(): void {
    this.input.keyboard?.on('keydown-ESC', () => {
      this.togglePause();
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (!this.gameState.getSession().isPaused) {
        this.togglePause();
      }
    });
  }

  private startSpawning(): void {
    const config = this.gameState.getLevelConfig();

    this.spawnOrb();

    this.spawnEvent = this.time.addEvent({
      delay: config.orbSpawnInterval,
      loop: true,
      callback: () => this.spawnOrb()
    });
  }

  private spawnOrb(): void {
    const session = this.gameState.getSession();
    if (session.isPaused || session.isGameOver) return;

    const config = this.gameState.getLevelConfig();
    const x = Phaser.Math.Between(120, 840);
    const y = Phaser.Math.Between(140, 470);
    const orb = this.add.circle(x, y, 18, 0x4fd1c5, 0.95);
    orb.setStrokeStyle(5, 0xffa94d, 0.9);
    orb.setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: orb,
      scale: { from: 0.75, to: 1.2 },
      alpha: { from: 0.9, to: 0.2 },
      duration: config.orbSpeed,
      yoyo: true,
      repeat: -1
    });

    orb.on('pointerdown', () => {
      if (session.isPaused || session.isGameOver) return;
      this.handleOrbClick(orb);
    });

    this.time.delayedCall(config.orbLifetime, () => {
      if (orb.active && !session.isGameOver) {
        this.handleOrbMiss(orb);
      }
    });

    this.orbs.push(orb);
  }

  private handleOrbClick(orb: Phaser.GameObjects.Arc): void {
    const config = this.gameState.getLevelConfig();
    const multiplier = this.gameState.getComboMultiplier();
    const points = Math.floor(config.orbScore * multiplier);

    this.gameState.addScore(points);
    this.showScorePopup(orb.x, orb.y, points, multiplier);
    this.updateUI();

    this.tweens.killTweensOf(orb);
    orb.destroy();

    this.orbs = this.orbs.filter(o => o !== orb);

    const session = this.gameState.getSession();
    if (session.isGameOver) {
      this.endGame();
    }
  }

  private handleOrbMiss(orb: Phaser.GameObjects.Arc): void {
    const session = this.gameState.getSession();
    if (session.isPaused || session.isGameOver || !orb.active) return;

    this.gameState.missOrb();
    this.tweens.killTweensOf(orb);
    orb.destroy();

    this.orbs = this.orbs.filter(o => o !== orb);
    this.updateUI();
  }

  private showScorePopup(x: number, y: number, points: number, multiplier: number): void {
    let color = '#f59e0b';
    let text = `+${points}`;

    if (multiplier > 1) {
      text = `+${points} x${multiplier}!`;
      if (multiplier >= 3) color = '#ef4444';
      else if (multiplier >= 2) color = '#f59e0b';
      else color = '#4fd1c5';
    }

    const popup = this.add.text(x, y, text, {
      fontFamily: 'Segoe UI',
      fontSize: '24px',
      color: color,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: y - 50,
      alpha: { from: 1, to: 0 },
      duration: 600,
      onComplete: () => popup.destroy()
    });
  }

  private updateUI(): void {
    const session = this.gameState.getSession();

    this.scoreText.setText(`分数：${session.score}`);

    if (session.combo > 0) {
      this.comboText.setText(`连击：${session.combo}${session.combo >= 5 ? ` 🔥` : ''}`);
      if (session.combo >= 20) {
        this.comboText.setColor('#ef4444');
      } else if (session.combo >= 10) {
        this.comboText.setColor('#f59e0b');
      } else if (session.combo >= 5) {
        this.comboText.setColor('#4fd1c5');
      }
    } else {
      this.comboText.setText('');
    }

    if (session.timeRemaining <= 10) {
      this.timerText.setColor('#ef4444');
    } else if (session.timeRemaining <= 20) {
      this.timerText.setColor('#f59e0b');
    } else {
      this.timerText.setColor('#60a5fa');
    }
    this.timerText.setText(`⏱ ${Math.ceil(session.timeRemaining)}s`);
  }

  private togglePause(): void {
    const isPaused = this.gameState.togglePause();
    this.pauseOverlay.setVisible(isPaused);

    if (isPaused) {
      this.spawnEvent.paused = true;
    } else {
      this.spawnEvent.paused = false;
    }
  }

  update(_time: number, delta: number): void {
    if (!this.gameState.isActive()) return;

    const session = this.gameState.getSession();
    if (!session.isPaused && !session.isGameOver) {
      this.gameState.updateTime(delta / 1000);
      this.updateUI();

      if (session.isGameOver && !this.isGameOverShown) {
        this.endGame();
      }
    }
  }

  private endGame(): void {
    this.isGameOverShown = true;
    this.spawnEvent.remove();

    this.orbs.forEach(orb => {
      this.tweens.killTweensOf(orb);
      orb.destroy();
    });
    this.orbs = [];

    this.time.delayedCall(500, () => {
      const session = this.gameState.getSession();
      const result = this.storage.updatePlayerFromSession(session);
      this.gameState.endSession();

      this.scene.start('result-scene', {
        session: session,
        levelUp: result
      });
    });
  }
}
