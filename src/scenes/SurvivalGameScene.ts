import Phaser from 'phaser';
import { GameStateManager } from '../managers/GameState';
import { StorageManager } from '../managers/StorageManager';
import { OrbType, SkillType, SURVIVAL_CONFIG, SKILLS, SurvivalOrb } from '../types';

export class SurvivalGameScene extends Phaser.Scene {
  private gameState!: GameStateManager;
  private storage!: StorageManager;
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private livesContainer!: Phaser.GameObjects.Container;
  private shieldContainer!: Phaser.GameObjects.Container;
  private frenzyText!: Phaser.GameObjects.Text;
  private skillButton!: Phaser.GameObjects.Container;
  private skillCooldownText!: Phaser.GameObjects.Text;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private frenzyOverlay!: Phaser.GameObjects.Container;
  private orbs: SurvivalOrb[] = [];
  private spawnEvent!: Phaser.Time.TimerEvent;
  private isGameOverShown: boolean = false;
  private damageFlash!: Phaser.GameObjects.Rectangle;
  private screenShakeTween!: Phaser.Tweens.Tween | null;

  constructor() {
    super('survival-game-scene');
  }

  create(): void {
    this.gameState = GameStateManager.getInstance();
    this.storage = StorageManager.getInstance();

    if (!this.gameState.isActive() || this.gameState.getCurrentMode() !== 'survival') {
      this.scene.start('menu-scene');
      return;
    }

    this.cameras.main.setBackgroundColor('#081019');
    this.add.rectangle(480, 270, 960, 540, 0x081019);

    this.damageFlash = this.add.rectangle(480, 270, 960, 540, 0xef4444, 0);
    this.damageFlash.setDepth(1000);

    this.createUI();
    this.setupInput();
    this.startSpawning();
    this.createPauseOverlay();
    this.createFrenzyOverlay();
  }

  private createUI(): void {
    const session = this.gameState.getSurvivalSession();
    const skill = session.activeSkill ? SKILLS[session.activeSkill] : null;

    this.add.text(44, 24, '🎮 生存模式', {
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

    this.waveText = this.add.text(44, 118, `第 ${session.wave} 波`, {
      fontFamily: 'Segoe UI',
      fontSize: '16px',
      color: '#a78bfa'
    });

    this.timeText = this.add.text(760, 24, `⏱ ${Math.floor(session.survivalTime)}s`, {
      fontFamily: 'Segoe UI',
      fontSize: '24px',
      color: '#60a5fa'
    });

    this.frenzyText = this.add.text(760, 58, '', {
      fontFamily: 'Segoe UI',
      fontSize: '16px',
      color: '#ef4444',
      fontStyle: 'bold'
    });

    this.livesContainer = this.add.container(760, 90);
    this.shieldContainer = this.add.container(760, 115);
    this.updateLivesUI();
    this.updateShieldUI();

    if (skill) {
      this.createSkillButton(skill);
    }

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

  private createSkillButton(skill: typeof SKILLS[SkillType]): void {
    this.skillButton = this.add.container(480, 490);

    const bg = this.add.rectangle(0, 0, 80, 80, 0x1e293b, 0.9);
    bg.setStrokeStyle(3, 0x4fd1c5, 0.8);
    bg.setInteractive({ useHandCursor: true });
    this.skillButton.add(bg);

    const icon = this.add.text(0, -5, skill.icon, {
      fontFamily: 'Segoe UI',
      fontSize: '32px'
    }).setOrigin(0.5);
    this.skillButton.add(icon);

    const name = this.add.text(0, 25, skill.name, {
      fontFamily: 'Segoe UI',
      fontSize: '12px',
      color: '#9fb3c8'
    }).setOrigin(0.5);
    this.skillButton.add(name);

    this.skillCooldownText = this.add.text(0, 0, '', {
      fontFamily: 'Segoe UI',
      fontSize: '24px',
      color: '#ef4444',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.skillCooldownText.setDepth(10);
    this.skillButton.add(this.skillCooldownText);

    bg.on('pointerdown', () => {
      this.useActiveSkill();
    });
  }

  private updateLivesUI(): void {
    const session = this.gameState.getSurvivalSession();
    this.livesContainer.removeAll(true);

    for (let i = 0; i < session.maxLives; i++) {
      const heart = this.add.text(i * 28, 0, i < session.lives ? '❤️' : '🖤', {
        fontFamily: 'Segoe UI',
        fontSize: '20px'
      });
      this.livesContainer.add(heart);
    }
  }

  private updateShieldUI(): void {
    const session = this.gameState.getSurvivalSession();
    this.shieldContainer.removeAll(true);

    if (session.shield > 0) {
      const shieldText = this.add.text(0, 0, `🛡️ x${session.shield}`, {
        fontFamily: 'Segoe UI',
        fontSize: '16px',
        color: '#60a5fa'
      });
      this.shieldContainer.add(shieldText);
    }
  }

  private createPauseOverlay(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.pauseOverlay = this.add.container(0, 0);
    this.pauseOverlay.setVisible(false);
    this.pauseOverlay.setDepth(500);

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

    this.pauseOverlay.add(this.add.text(centerX, centerY + 80, '退出游戏', {
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
      this.scene.start('menu-scene');
    });
  }

  private createFrenzyOverlay(): void {
    const centerX = this.cameras.main.width / 2;
    this.frenzyOverlay = this.add.container(0, 0);
    this.frenzyOverlay.setVisible(false);
    this.frenzyOverlay.setDepth(100);

    const leftGlow = this.add.rectangle(20, 270, 40, 540, 0xef4444, 0.3);
    const rightGlow = this.add.rectangle(940, 270, 40, 540, 0xef4444, 0.3);
    this.frenzyOverlay.add([leftGlow, rightGlow]);
  }

  private setupInput(): void {
    this.input.keyboard?.on('keydown-ESC', () => {
      this.togglePause();
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      const session = this.gameState.getSurvivalSession();
      if (!session.isPaused) {
        this.useActiveSkill();
      }
    });
  }

  private useActiveSkill(): void {
    const session = this.gameState.getSurvivalSession();
    if (session.isPaused || session.isGameOver || !session.activeSkill) return;

    const skillType = session.activeSkill;
    if (session.skillCooldowns[skillType] > 0) return;

    const success = this.gameState.useSkill(skillType);
    if (!success) return;

    const skill = SKILLS[skillType];
    this.showSkillEffect(skillType);

    this.cameras.main.flash(300, 79, 209, 197);
  }

  private showSkillEffect(skillType: SkillType): void {
    const session = this.gameState.getSurvivalSession();

    switch (skillType) {
      case 'freeze':
        this.gameState.activateFreeze(3);
        this.orbs.forEach(survivalOrb => {
          this.tweens.killTweensOf(survivalOrb.orb);
          survivalOrb.orb.setStrokeStyle(5, 0x60a5fa, 1);
        });
        this.cameras.main.setBackgroundColor('#1e3a5f');
        this.time.delayedCall(3000, () => {
          this.cameras.main.setBackgroundColor('#081019');
          this.orbs.forEach(survivalOrb => {
            if (survivalOrb.orb.active) {
              this.startOrbTween(survivalOrb.orb);
              this.setOrbStroke(survivalOrb.orb, survivalOrb.type);
            }
          });
        });
        break;

      case 'clear':
        const clearedOrbs: SurvivalOrb[] = [];
        this.orbs.forEach(survivalOrb => {
          if (survivalOrb.type === 'normal' && survivalOrb.orb.active) {
            this.tweens.killTweensOf(survivalOrb.orb);
            this.gameState.addSurvivalScore(SURVIVAL_CONFIG.orbScore);
            this.showScorePopup(survivalOrb.orb.x, survivalOrb.orb.y, SURVIVAL_CONFIG.orbScore, 1);
            this.createExplosion(survivalOrb.orb.x, survivalOrb.orb.y, 0x4fd1c5);
            survivalOrb.orb.destroy();
            clearedOrbs.push(survivalOrb);
          }
        });
        this.orbs = this.orbs.filter(o => !clearedOrbs.includes(o));
        break;

      case 'heal':
        this.gameState.heal(1);
        this.updateLivesUI();
        this.add.text(480, 270, '+1 ❤️', {
          fontFamily: 'Segoe UI',
          fontSize: '48px',
          color: '#4ade80',
          fontStyle: 'bold'
        }).setOrigin(0.5);
        break;
    }

    this.updateUI();
  }

  private createExplosion(x: number, y: number, color: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const particle = this.add.circle(x, y, 4, color, 0.8);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 40,
        y: y + Math.sin(angle) * 40,
        alpha: 0,
        scale: 0,
        duration: 400,
        onComplete: () => particle.destroy()
      });
    }
  }

  private startSpawning(): void {
    this.spawnOrb();
    this.scheduleNextSpawn();
  }

  private scheduleNextSpawn(): void {
    const interval = this.gameState.getSpawnInterval();
    this.spawnEvent = this.time.delayedCall(interval, () => {
      const session = this.gameState.getSurvivalSession();
      if (!session.isPaused && !session.isGameOver) {
        this.spawnOrb();
      }
      this.scheduleNextSpawn();
    });
  }

  private spawnOrb(): void {
    const session = this.gameState.getSurvivalSession();
    if (session.isPaused || session.isGameOver) return;

    const orbType = this.getRandomOrbType();
    const x = Phaser.Math.Between(120, 840);
    const y = Phaser.Math.Between(140, 420);

    let color: number;
    let strokeColor: number;
    let icon: string = '';

    switch (orbType) {
      case 'normal':
        color = session.isFrenzy ? 0xf59e0b : 0x4fd1c5;
        strokeColor = 0xffa94d;
        break;
      case 'trap':
        color = 0x7c3aed;
        strokeColor = 0xef4444;
        icon = '💀';
        break;
      case 'shield':
        color = 0x3b82f6;
        strokeColor = 0x60a5fa;
        icon = '🛡️';
        break;
      default:
        color = 0x4fd1c5;
        strokeColor = 0xffa94d;
    }

    const orb = this.add.circle(x, y, 22, color, 0.95);
    orb.setStrokeStyle(5, strokeColor, 0.9);
    orb.setInteractive({ useHandCursor: true });

    if (icon) {
      const iconText = this.add.text(x, y, icon, {
        fontFamily: 'Segoe UI',
        fontSize: '18px'
      }).setOrigin(0.5);
      iconText.setDepth(1);
      (orb as any).iconText = iconText;
    }

    this.startOrbTween(orb);

    orb.on('pointerdown', () => {
      if (session.isPaused || session.isGameOver) return;
      this.handleOrbClick(orb, orbType);
    });

    const lifetime = session.isFrenzy 
      ? SURVIVAL_CONFIG.orbLifetime * 0.8 
      : SURVIVAL_CONFIG.orbLifetime;

    this.time.delayedCall(lifetime, () => {
      if (orb.active && !session.isGameOver) {
        this.handleOrbMiss(orb, orbType);
      }
    });

    this.orbs.push({ orb, type: orbType, spawnTime: Date.now() });
  }

  private getRandomOrbType(): OrbType {
    const rand = Math.random();
    if (rand < SURVIVAL_CONFIG.trapProbability) {
      return 'trap';
    } else if (rand < SURVIVAL_CONFIG.trapProbability + SURVIVAL_CONFIG.shieldProbability) {
      return 'shield';
    }
    return 'normal';
  }

  private startOrbTween(orb: Phaser.GameObjects.Arc): void {
    this.tweens.add({
      targets: orb,
      scale: { from: 0.75, to: 1.2 },
      alpha: { from: 0.9, to: 0.2 },
      duration: SURVIVAL_CONFIG.orbSpeed,
      yoyo: true,
      repeat: -1
    });

    const iconText = (orb as any).iconText;
    if (iconText) {
      this.tweens.add({
        targets: iconText,
        scale: { from: 0.75, to: 1.2 },
        alpha: { from: 0.9, to: 0.2 },
        duration: SURVIVAL_CONFIG.orbSpeed,
        yoyo: true,
        repeat: -1
      });
    }
  }

  private setOrbStroke(orb: Phaser.GameObjects.Arc, type: OrbType): void {
    let strokeColor: number;
    switch (type) {
      case 'normal':
        strokeColor = 0xffa94d;
        break;
      case 'trap':
        strokeColor = 0xef4444;
        break;
      case 'shield':
        strokeColor = 0x60a5fa;
        break;
      default:
        strokeColor = 0xffa94d;
    }
    orb.setStrokeStyle(5, strokeColor, 0.9);
  }

  private handleOrbClick(orb: Phaser.GameObjects.Arc, type: OrbType): void {
    const session = this.gameState.getSurvivalSession();
    const multiplier = this.gameState.getComboMultiplier();

    switch (type) {
      case 'normal':
        const points = Math.floor(SURVIVAL_CONFIG.orbScore * multiplier);
        this.gameState.addSurvivalScore(points);
        this.showScorePopup(orb.x, orb.y, points, multiplier);
        this.createExplosion(orb.x, orb.y, 0x4fd1c5);
        break;

      case 'trap':
        this.gameState.handleTrapClick();
        this.showDamagePopup(orb.x, orb.y);
        this.createExplosion(orb.x, orb.y, 0xef4444);
        this.triggerDamageFlash();
        this.triggerScreenShake();
        this.updateLivesUI();
        this.updateShieldUI();
        break;

      case 'shield':
        this.gameState.handleShieldClick();
        this.showShieldPopup(orb.x, orb.y);
        this.createExplosion(orb.x, orb.y, 0x60a5fa);
        this.updateShieldUI();
        break;
    }

    this.tweens.killTweensOf(orb);
    const iconText = (orb as any).iconText;
    if (iconText) {
      this.tweens.killTweensOf(iconText);
      iconText.destroy();
    }
    orb.destroy();

    this.orbs = this.orbs.filter(o => o.orb !== orb);
    this.updateUI();

    if (session.isGameOver) {
      this.endGame();
    }
  }

  private handleOrbMiss(orb: Phaser.GameObjects.Arc, type: OrbType): void {
    const session = this.gameState.getSurvivalSession();
    if (session.isPaused || session.isGameOver || !orb.active) return;

    this.gameState.missSurvivalOrb(type);
    this.tweens.killTweensOf(orb);
    const iconText = (orb as any).iconText;
    if (iconText) {
      this.tweens.killTweensOf(iconText);
      iconText.destroy();
    }
    orb.destroy();

    this.orbs = this.orbs.filter(o => o.orb !== orb);
    
    if (type === 'normal' && Math.random() < SURVIVAL_CONFIG.missDamageChance) {
      this.triggerDamageFlash();
      this.updateLivesUI();
      this.updateShieldUI();
    }
    
    this.updateUI();

    if (session.isGameOver) {
      this.endGame();
    }
  }

  private showScorePopup(x: number, y: number, points: number, multiplier: number): void {
    const session = this.gameState.getSurvivalSession();
    const isFrenzy = session.isFrenzy;
    let color = '#f59e0b';
    let text = `+${points}`;

    if (isFrenzy) {
      text = `+${points} 🔥`;
      color = '#ef4444';
    } else if (multiplier > 1) {
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

  private showDamagePopup(x: number, y: number): void {
    const popup = this.add.text(x, y, '-1 ❤️', {
      fontFamily: 'Segoe UI',
      fontSize: '28px',
      color: '#ef4444',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: y - 60,
      alpha: { from: 1, to: 0 },
      duration: 700,
      onComplete: () => popup.destroy()
    });
  }

  private showShieldPopup(x: number, y: number): void {
    const popup = this.add.text(x, y, '+1 🛡️', {
      fontFamily: 'Segoe UI',
      fontSize: '28px',
      color: '#60a5fa',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: y - 60,
      alpha: { from: 1, to: 0 },
      duration: 700,
      onComplete: () => popup.destroy()
    });
  }

  private triggerDamageFlash(): void {
    this.tweens.add({
      targets: this.damageFlash,
      alpha: { from: 0.4, to: 0 },
      duration: 200
    });
  }

  private triggerScreenShake(): void {
    if (this.screenShakeTween) {
      this.screenShakeTween.stop();
    }
    this.cameras.main.shake(200, 0.015);
  }

  private updateUI(): void {
    const session = this.gameState.getSurvivalSession();

    this.scoreText.setText(`分数：${session.score}`);
    this.timeText.setText(`⏱ ${Math.floor(session.survivalTime)}s`);
    this.waveText.setText(`第 ${session.wave} 波`);

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

    if (session.isFrenzy) {
      this.frenzyText.setText(`🔥 狂热波！x${SURVIVAL_CONFIG.frenzyMultiplier} ${Math.ceil(session.frenzyRemaining)}s`);
      this.frenzyOverlay.setVisible(true);
    } else {
      this.frenzyText.setText('');
      this.frenzyOverlay.setVisible(false);
    }

    if (this.skillCooldownText && session.activeSkill) {
      const cd = session.skillCooldowns[session.activeSkill];
      if (cd > 0) {
        this.skillCooldownText.setText(Math.ceil(cd).toString());
        this.skillCooldownText.setVisible(true);
      } else {
        this.skillCooldownText.setVisible(false);
      }
    }
  }

  private togglePause(): void {
    const isPaused = this.gameState.togglePause();
    this.pauseOverlay.setVisible(isPaused);
  }

  update(_time: number, delta: number): void {
    if (!this.gameState.isActive()) return;

    const session = this.gameState.getSurvivalSession();
    if (!session.isPaused && !session.isGameOver) {
      this.gameState.updateSurvivalTime(delta / 1000);
      this.updateUI();

      if (session.isGameOver && !this.isGameOverShown) {
        this.endGame();
      }
    }
  }

  private endGame(): void {
    this.isGameOverShown = true;
    if (this.spawnEvent) {
      this.spawnEvent.remove();
    }

    this.orbs.forEach(survivalOrb => {
      this.tweens.killTweensOf(survivalOrb.orb);
      const iconText = (survivalOrb.orb as any).iconText;
      if (iconText) {
        this.tweens.killTweensOf(iconText);
        iconText.destroy();
      }
      survivalOrb.orb.destroy();
    });
    this.orbs = [];

    this.time.delayedCall(500, () => {
      const session = this.gameState.getSurvivalSession();
      const result = this.storage.updatePlayerFromSurvivalSession(session);
      this.gameState.endSession();

      this.scene.start('result-scene', {
        survivalSession: session,
        levelUp: result
      });
    });
  }
}
