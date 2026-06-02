import Phaser from 'phaser';
import { LEVELS, getDifficultyColor, getDifficultyLabel } from '../config/levels';
import { StorageManager } from '../managers/StorageManager';
import { GameStateManager } from '../managers/GameState';
import { LevelConfig } from '../types';

export class LevelSelectScene extends Phaser.Scene {
  private selectedLevel: LevelConfig | null = null;
  private detailPanel!: Phaser.GameObjects.Container;
  private panelWidth = 230;
  private panelHeight = 380;

  constructor() {
    super('level-select-scene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#081019');

    this.add.rectangle(480, 270, 960, 540, 0x081019);

    this.add.text(44, 34, '选择关卡', {
      fontFamily: 'Segoe UI',
      fontSize: '32px',
      color: '#f8fafc',
      fontStyle: 'bold'
    });

    this.createBackButton();
    this.createLevelGrid();
    this.createDetailPanel();
  }

  private createBackButton(): void {
    const backBtn = this.add.rectangle(880, 50, 100, 40, 0x1e293b, 0.9);
    backBtn.setStrokeStyle(2, 0x64748b, 0.8);
    backBtn.setInteractive({ useHandCursor: true });

    this.add.text(880, 50, '返回', {
      fontFamily: 'Segoe UI',
      fontSize: '18px',
      color: '#9fb3c8'
    }).setOrigin(0.5);

    backBtn.on('pointerdown', () => {
      this.scene.start('menu-scene');
    });

    backBtn.on('pointerover', () => {
      backBtn.setFillStyle(0x334155, 0.9);
    });

    backBtn.on('pointerout', () => {
      backBtn.setFillStyle(0x1e293b, 0.9);
    });
  }

  private createLevelGrid(): void {
    const storage = StorageManager.getInstance();
    const startX = 80;
    const startY = 110;
    const colWidth = 200;
    const rowHeight = 140;
    const cols = 3;

    LEVELS.forEach((level, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * colWidth;
      const y = startY + row * rowHeight;

      const isUnlocked = storage.isLevelUnlocked(level.id);
      const isCompleted = storage.isLevelCompleted(level.id);
      const bestScore = storage.getLevelBestScore(level.id);

      this.createLevelCard(x, y, level, isUnlocked, isCompleted, bestScore);
    });
  }

  private createLevelCard(x: number, y: number, level: LevelConfig, isUnlocked: boolean, isCompleted: boolean, bestScore: number): void {
    const width = 180;
    const height = 120;

    const card = this.add.graphics();
    const diffColor = getDifficultyColor(level.difficulty);

    if (!isUnlocked) {
      card.fillStyle(0x0f172a, 0.8);
      card.lineStyle(2, 0x334155, 0.5);
    } else {
      card.fillStyle(0x1e293b, 0.9);
      card.lineStyle(2, parseInt(diffColor.replace('#', ''), 16), 0.7);
    }
    card.fillRoundedRect(x, y, width, height, 8);
    card.strokeRoundedRect(x, y, width, height, 8);

    if (isCompleted) {
      this.add.text(x + width - 25, y + 15, '✓', {
        fontFamily: 'Segoe UI',
        fontSize: '20px',
        color: '#4ade80'
      }).setOrigin(0.5);
    }

    this.add.text(x + 15, y + 20, `#${level.id}`, {
      fontFamily: 'Segoe UI',
      fontSize: '14px',
      color: isUnlocked ? '#64748b' : '#475569'
    });

    this.add.text(x + 15, y + 42, level.name, {
      fontFamily: 'Segoe UI',
      fontSize: '18px',
      color: isUnlocked ? '#f8fafc' : '#475569',
      fontStyle: 'bold'
    });

    this.add.text(x + 15, y + 65, getDifficultyLabel(level.difficulty), {
      fontFamily: 'Segoe UI',
      fontSize: '13px',
      color: isUnlocked ? diffColor : '#475569'
    });

    if (!isUnlocked) {
      this.add.text(x + width / 2, y + 90, `🔒 需要 ${level.unlockRequired} 总分`, {
        fontFamily: 'Segoe UI',
        fontSize: '11px',
        color: '#64748b'
      }).setOrigin(0.5);
    } else if (bestScore > 0) {
      this.add.text(x + 15, y + 90, `最佳: ${bestScore}`, {
        fontFamily: 'Segoe UI',
        fontSize: '13px',
        color: '#f59e0b'
      });
    } else {
      this.add.text(x + 15, y + 90, `目标: ${level.targetScore}`, {
        fontFamily: 'Segoe UI',
        fontSize: '13px',
        color: '#9fb3c8'
      });
    }

    if (isUnlocked) {
      card.setInteractive(new Phaser.Geom.Rectangle(x, y, width, height), Phaser.Geom.Rectangle.Contains);

      card.on('pointerover', () => {
        card.clear();
        card.fillStyle(0x334155, 0.95);
        card.lineStyle(3, parseInt(diffColor.replace('#', ''), 16), 1);
        card.fillRoundedRect(x, y, width, height, 8);
        card.strokeRoundedRect(x, y, width, height, 8);
      });

      card.on('pointerout', () => {
        card.clear();
        card.fillStyle(0x1e293b, 0.9);
        card.lineStyle(2, parseInt(diffColor.replace('#', ''), 16), 0.7);
        card.fillRoundedRect(x, y, width, height, 8);
        card.strokeRoundedRect(x, y, width, height, 8);
      });

      card.on('pointerdown', () => {
        this.selectedLevel = level;
        this.updateDetailPanel(level);
      });
    }
  }

  private createDetailPanel(): void {
    const x = 700;
    const y = 110;

    this.detailPanel = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x1e293b, 0.95);
    bg.lineStyle(2, 0x4fd1c5, 0.5);
    bg.fillRoundedRect(0, 0, this.panelWidth, this.panelHeight, 12);
    bg.strokeRoundedRect(0, 0, this.panelWidth, this.panelHeight, 12);
    this.detailPanel.add(bg);

    this.detailPanel.add(this.add.text(15, 15, '关卡详情', {
      fontFamily: 'Segoe UI',
      fontSize: '18px',
      color: '#4fd1c5',
      fontStyle: 'bold'
    }));

    this.detailPanel.add(this.add.text(15, 50, '请选择一个关卡', {
      fontFamily: 'Segoe UI',
      fontSize: '14px',
      color: '#64748b'
    }));
  }

  private updateDetailPanel(level: LevelConfig): void {
    this.detailPanel.each((child: Phaser.GameObjects.GameObject) => {
      if (child !== this.detailPanel.first) {
        child.destroy();
      }
    });

    const storage = StorageManager.getInstance();
    const bestScore = storage.getLevelBestScore(level.id);
    const isCompleted = storage.isLevelCompleted(level.id);
    const diffColor = getDifficultyColor(level.difficulty);

    const items = [
      { text: level.name, style: { fontSize: '22px', color: '#f8fafc', fontStyle: 'bold' } },
      { text: level.description, style: { fontSize: '13px', color: '#9fb3c8' } },
      { text: `难度: ${getDifficultyLabel(level.difficulty)}`, style: { fontSize: '14px', color: diffColor } },
      { text: `目标分数: ${level.targetScore}`, style: { fontSize: '14px', color: '#f59e0b' } },
      { text: `时间限制: ${level.timeLimit}秒`, style: { fontSize: '14px', color: '#60a5fa' } },
      { text: `光球间隔: ${level.orbSpawnInterval}ms`, style: { fontSize: '13px', color: '#94a3b8' } },
      { text: `光球存在: ${level.orbLifetime}ms`, style: { fontSize: '13px', color: '#94a3b8' } },
      { text: `最佳记录: ${bestScore > 0 ? bestScore : '-'}`, style: { fontSize: '14px', color: '#f59e0b' } },
      { text: `状态: ${isCompleted ? '✓ 已通关' : '未通关'}`, style: { fontSize: '14px', color: isCompleted ? '#4ade80' : '#94a3b8' } }
    ];

    let yOffset = 50;
    items.forEach((item, index) => {
      if (index === 1) yOffset += 10;
      if (index === 2) yOffset += 15;
      const textObj = this.add.text(15, yOffset, item.text, {
        fontFamily: 'Segoe UI',
        ...item.style
      });
      this.detailPanel.add(textObj);
      yOffset += 26;
    });

    const startBtn = this.add.rectangle(this.panelWidth / 2, this.panelHeight - 45, this.panelWidth - 30, 45, 0x4fd1c5, 0.9);
    startBtn.setInteractive({ useHandCursor: true });
    this.detailPanel.add(startBtn);

    this.detailPanel.add(this.add.text(this.panelWidth / 2, this.panelHeight - 45, '开始挑战', {
      fontFamily: 'Segoe UI',
      fontSize: '18px',
      color: '#081019',
      fontStyle: 'bold'
    }).setOrigin(0.5));

    startBtn.on('pointerover', () => {
      startBtn.setFillStyle(0x5eead4, 1);
    });

    startBtn.on('pointerout', () => {
      startBtn.setFillStyle(0x4fd1c5, 0.9);
    });

    startBtn.on('pointerdown', () => {
      GameStateManager.getInstance().startSession(level);
      this.scene.start('game-scene');
    });
  }
}
