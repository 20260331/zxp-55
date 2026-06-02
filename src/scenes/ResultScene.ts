import Phaser from 'phaser';
import { GameSession } from '../types';
import { getLevelById, getDifficultyColor, getDifficultyLabel } from '../config/levels';
import { getTaskById } from '../config/tasks';
import { GameStateManager } from '../managers/GameState';

interface ResultSceneData {
  session: GameSession;
  levelUp: {
    leveledUp: boolean;
    newLevel: number;
    completedTasks: string[];
    earnedCurrency: number;
  };
}

export class ResultScene extends Phaser.Scene {
  private resultData!: ResultSceneData;

  constructor() {
    super('result-scene');
  }

  init(data: ResultSceneData): void {
    this.resultData = data;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#081019');

    const centerX = this.cameras.main.width / 2;
    const { session, levelUp } = this.resultData;
    const levelConfig = getLevelById(session.currentLevel);

    this.add.rectangle(centerX, 270, 960, 540, 0x081019);

    const resultColor = session.isVictory ? '#4ade80' : '#ef4444';
    const resultText = session.isVictory ? '🎉 挑战成功！' : '⏱ 时间到！';

    this.add.text(centerX, 60, resultText, {
      fontFamily: 'Segoe UI',
      fontSize: '42px',
      color: resultColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    if (levelConfig) {
      this.add.text(centerX, 105, levelConfig.name, {
        fontFamily: 'Segoe UI',
        fontSize: '18px',
        color: getDifficultyColor(levelConfig.difficulty)
      }).setOrigin(0.5);
    }

    if (levelUp.leveledUp) {
      this.add.text(centerX, 140, `🎊 恭喜升级！达到 Lv.${levelUp.newLevel}`, {
        fontFamily: 'Segoe UI',
        fontSize: '20px',
        color: '#f59e0b',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    const panelY = levelUp.leveledUp ? 180 : 150;
    this.createStatsPanel(centerX, panelY, session, levelUp);

    if (levelUp.completedTasks.length > 0) {
      this.createTaskRewards(centerX, panelY + 220, levelUp.completedTasks);
    }

    this.createButtons(centerX, 470, session);
  }

  private createStatsPanel(x: number, y: number, session: GameSession, levelUp: any): void {
    const width = 400;
    const height = 200;

    const panel = this.add.graphics();
    panel.fillStyle(0x1e293b, 0.95);
    panel.lineStyle(2, session.isVictory ? 0x4ade80 : 0xef4444, 0.6);
    panel.fillRoundedRect(x - width / 2, y, width, height, 12);
    panel.strokeRoundedRect(x - width / 2, y, width, height, 12);

    const stats = [
      { label: '最终得分', value: session.score.toString(), color: '#f59e0b' },
      { label: '最高连击', value: `${session.maxCombo}`, color: '#4fd1c5' },
      { label: '命中光球', value: `${session.orbsClicked}`, color: '#60a5fa' },
      { label: '错失光球', value: `${session.orbsMissed}`, color: '#94a3b8' },
      { label: '命中率', value: `${this.getAccuracy(session)}%`, color: '#a78bfa' },
      { label: '获得金币', value: `+${levelUp.earnedCurrency} 💎`, color: '#60a5fa' }
    ];

    const startX = x - width / 2 + 30;
    let offsetY = y + 25;

    stats.forEach((stat, index) => {
      const colX = startX + (index % 2) * 200;
      const rowY = offsetY + Math.floor(index / 2) * 55;

      this.add.text(colX, rowY, stat.label, {
        fontFamily: 'Segoe UI',
        fontSize: '13px',
        color: '#94a3b8'
      });

      this.add.text(colX, rowY + 20, stat.value, {
        fontFamily: 'Segoe UI',
        fontSize: '20px',
        color: stat.color,
        fontStyle: 'bold'
      });
    });
  }

  private getAccuracy(session: GameSession): number {
    const total = session.orbsClicked + session.orbsMissed;
    if (total === 0) return 100;
    return Math.round((session.orbsClicked / total) * 100);
  }

  private createTaskRewards(x: number, y: number, taskIds: string[]): void {
    const width = 400;
    const itemHeight = 40;
    const height = itemHeight * Math.min(taskIds.length, 3) + 60;

    const panel = this.add.graphics();
    panel.fillStyle(0x1e293b, 0.95);
    panel.lineStyle(2, 0xf59e0b, 0.6);
    panel.fillRoundedRect(x - width / 2, y, width, height, 12);
    panel.strokeRoundedRect(x - width / 2, y, width, height, 12);

    this.add.text(x, y + 20, '🏆 完成任务', {
      fontFamily: 'Segoe UI',
      fontSize: '18px',
      color: '#f59e0b',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    taskIds.slice(0, 3).forEach((taskId, index) => {
      const task = getTaskById(taskId);
      if (task) {
        const itemY = y + 50 + index * itemHeight;
        this.add.text(x - width / 2 + 25, itemY, task.name, {
          fontFamily: 'Segoe UI',
          fontSize: '14px',
          color: '#f8fafc'
        });

        this.add.text(x + width / 2 - 25, itemY, `+${task.reward} 💎`, {
          fontFamily: 'Segoe UI',
          fontSize: '14px',
          color: '#60a5fa',
          fontStyle: 'bold'
        }).setOrigin(1, 0);
      }
    });

    if (taskIds.length > 3) {
      this.add.text(x, y + height - 20, `还有 ${taskIds.length - 3} 个任务已完成...`, {
        fontFamily: 'Segoe UI',
        fontSize: '13px',
        color: '#94a3b8'
      }).setOrigin(0.5);
    }
  }

  private createButtons(x: number, y: number, session: GameSession): void {
    const retryBtn = this.add.rectangle(x - 110, y, 200, 50, 0x4fd1c5, 0.9);
    retryBtn.setStrokeStyle(2, 0x4fd1c5, 0.8);
    retryBtn.setInteractive({ useHandCursor: true });

    this.add.text(x - 110, y, '再次挑战', {
      fontFamily: 'Segoe UI',
      fontSize: '18px',
      color: '#081019',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const backBtn = this.add.rectangle(x + 110, y, 200, 50, 0x1e293b, 0.9);
    backBtn.setStrokeStyle(2, 0x64748b, 0.8);
    backBtn.setInteractive({ useHandCursor: true });

    this.add.text(x + 110, y, '返回选关', {
      fontFamily: 'Segoe UI',
      fontSize: '18px',
      color: '#9fb3c8',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const menuBtn = this.add.rectangle(x, y + 70, 200, 40, 0x334155, 0.9);
    menuBtn.setInteractive({ useHandCursor: true });

    this.add.text(x, y + 70, '返回主菜单', {
      fontFamily: 'Segoe UI',
      fontSize: '15px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    retryBtn.on('pointerover', () => retryBtn.setFillStyle(0x5eead4, 1));
    retryBtn.on('pointerout', () => retryBtn.setFillStyle(0x4fd1c5, 0.9));
    retryBtn.on('pointerdown', () => {
      const levelConfig = getLevelById(session.currentLevel);
      if (levelConfig) {
        GameStateManager.getInstance().startSession(levelConfig);
      }
      this.scene.start('game-scene');
    });

    backBtn.on('pointerover', () => backBtn.setFillStyle(0x334155, 0.9));
    backBtn.on('pointerout', () => backBtn.setFillStyle(0x1e293b, 0.9));
    backBtn.on('pointerdown', () => {
      this.scene.start('level-select-scene');
    });

    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x475569, 0.9));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x334155, 0.9));
    menuBtn.on('pointerdown', () => {
      this.scene.start('menu-scene');
    });
  }
}
