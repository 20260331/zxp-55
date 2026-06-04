import Phaser from 'phaser';
import { StorageManager } from '../managers/StorageManager';
import { getDailyQuestById } from '../config/dailyQuests';
import { DailyQuestConfig, DailyQuestProgress } from '../types';

export class DailyQuestScene extends Phaser.Scene {
  private claimableCount: number = 0;

  constructor() {
    super('daily-quest-scene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#081019');
    this.add.rectangle(480, 270, 960, 540, 0x081019);

    const storage = StorageManager.getInstance();
    const dailyQuests = storage.getDailyQuestsWithConfig();
    this.claimableCount = storage.getClaimableDailyQuestCount();

    this.add.text(44, 34, '每日悬赏', {
      fontFamily: 'Segoe UI',
      fontSize: '32px',
      color: '#f8fafc',
      fontStyle: 'bold'
    });

    const today = new Date();
    const dateStr = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
    this.add.text(44, 74, `今日任务 · ${dateStr}`, {
      fontFamily: 'Segoe UI',
      fontSize: '16px',
      color: '#9fb3c8'
    });

    const completedCount = dailyQuests.filter(q => q.progress.completed).length;
    this.add.text(44, 100, `已完成：${completedCount} / ${dailyQuests.length}`, {
      fontFamily: 'Segoe UI',
      fontSize: '14px',
      color: '#94a3b8'
    });

    this.createBackButton();
    this.createQuestList(dailyQuests);
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

    backBtn.on('pointerover', () => backBtn.setFillStyle(0x334155, 0.9));
    backBtn.on('pointerout', () => backBtn.setFillStyle(0x1e293b, 0.9));
  }

  private createQuestList(quests: { quest: DailyQuestConfig; progress: DailyQuestProgress }[]): void {
    const startX = 44;
    const startY = 130;
    const width = 872;
    const height = 90;

    quests.forEach((item, index) => {
      const y = startY + index * (height + 12);
      this.createQuestCard(startX, y, width, height, item.quest, item.progress);
    });
  }

  private createQuestCard(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    quest: DailyQuestConfig, 
    progress: DailyQuestProgress
  ): void {
    const card = this.add.graphics();
    
    let borderColor: number;
    let bgColor: number;
    if (progress.claimed) {
      bgColor = 0x1e293b;
      borderColor = 0x334155;
    } else if (progress.completed) {
      bgColor = 0x166534;
      borderColor = 0x4ade80;
    } else {
      bgColor = 0x1e293b;
      borderColor = 0x334155;
    }

    card.fillStyle(bgColor, 0.9);
    card.lineStyle(2, borderColor, progress.claimed ? 0.4 : 0.6);
    card.fillRoundedRect(x, y, width, height, 12);
    card.strokeRoundedRect(x, y, width, height, 12);

    const difficultyColors: Record<string, string> = {
      easy: '#4ade80',
      medium: '#f59e0b',
      hard: '#ef4444'
    };

    const difficultyLabels: Record<string, string> = {
      easy: '简单',
      medium: '中等',
      hard: '困难'
    };

    const typeIcons: Record<string, string> = {
      daily_score: '🎯',
      daily_combo: '🔥',
      daily_click: '👆',
      daily_play: '⏱',
      daily_survival: '💀',
      daily_level: '⭐'
    };

    this.add.text(x + 20, y + 22, typeIcons[quest.type] || '📋', {
      fontFamily: 'Segoe UI',
      fontSize: '28px'
    });

    this.add.text(x + 65, y + 20, quest.name, {
      fontFamily: 'Segoe UI',
      fontSize: '18px',
      color: progress.claimed ? '#64748b' : '#f8fafc',
      fontStyle: 'bold'
    });

    this.add.text(x + 65, y + 45, quest.description, {
      fontFamily: 'Segoe UI',
      fontSize: '13px',
      color: '#94a3b8'
    });

    const difficultyBadge = this.add.graphics();
    const diffColor = parseInt(difficultyColors[quest.difficulty].replace('#', ''), 16);
    difficultyBadge.fillStyle(diffColor, 0.2);
    difficultyBadge.fillRoundedRect(x + 65, y + 65, 50, 20, 4);
    
    this.add.text(x + 90, y + 75, difficultyLabels[quest.difficulty], {
      fontFamily: 'Segoe UI',
      fontSize: '11px',
      color: difficultyColors[quest.difficulty],
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const rewardX = x + width - 120;
    this.add.text(rewardX, y + 25, `+${quest.reward} 💎`, {
      fontFamily: 'Segoe UI',
      fontSize: '18px',
      color: progress.claimed ? '#64748b' : '#60a5fa',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    if (!progress.claimed) {
      const progressWidth = 180;
      const progressX = x + width - progressWidth - 20;
      const progressY = y + height - 30;

      const progressBg = this.add.graphics();
      progressBg.fillStyle(0x334155, 0.8);
      progressBg.fillRoundedRect(progressX, progressY, progressWidth, 16, 6);

      const progressFill = this.add.graphics();
      const fillWidth = Math.min((progress.current / progress.target) * progressWidth, progressWidth);
      
      if (progress.completed) {
        progressFill.fillStyle(0x4ade80, 1);
      } else {
        progressFill.fillStyle(0x60a5fa, 1);
      }
      progressFill.fillRoundedRect(progressX, progressY, fillWidth, 16, 6);

      const progressText = progress.completed 
        ? '已完成' 
        : `${progress.current} / ${progress.target}`;
      
      this.add.text(progressX + progressWidth / 2, progressY + 8, progressText, {
        fontFamily: 'Segoe UI',
        fontSize: '12px',
        color: '#f8fafc',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      if (progress.completed && !progress.claimed) {
        const claimBtn = this.add.rectangle(x + width - 70, y + 35, 100, 36, 0x4ade80, 0.9);
        claimBtn.setStrokeStyle(2, 0x4ade80, 0.8);
        claimBtn.setInteractive({ useHandCursor: true });

        this.add.text(x + width - 70, y + 35, '领取奖励', {
          fontFamily: 'Segoe UI',
          fontSize: '14px',
          color: '#081019',
          fontStyle: 'bold'
        }).setOrigin(0.5);

        claimBtn.on('pointerover', () => claimBtn.setFillStyle(0x5eead4, 1));
        claimBtn.on('pointerout', () => claimBtn.setFillStyle(0x4ade80, 0.9));
        claimBtn.on('pointerdown', () => {
          const storage = StorageManager.getInstance();
          if (storage.claimDailyQuestReward(quest.id)) {
            this.scene.restart();
          }
        });
      }
    } else {
      this.add.text(x + width - 30, y + height / 2, '✓ 已领取', {
        fontFamily: 'Segoe UI',
        fontSize: '14px',
        color: '#64748b',
        fontStyle: 'bold'
      }).setOrigin(1, 0.5);
    }
  }
}
