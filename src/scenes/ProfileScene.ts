import Phaser from 'phaser';
import { StorageManager } from '../managers/StorageManager';
import { LEVELS } from '../config/levels';
import { TASKS } from '../config/tasks';
import { generateDailyQuests } from '../config/dailyQuests';

export class ProfileScene extends Phaser.Scene {
  constructor() {
    super('profile-scene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#081019');
    this.add.rectangle(480, 270, 960, 540, 0x081019);

    const storage = StorageManager.getInstance();
    const player = storage.getPlayer();

    this.add.text(44, 34, '玩家档案', {
      fontFamily: 'Segoe UI',
      fontSize: '32px',
      color: '#f8fafc',
      fontStyle: 'bold'
    });

    this.createBackButton();
    this.createPlayerCard(44, 100, player);
    this.createStatsPanel(44, 240, player);
    this.createLevelProgress(520, 100, player);
    this.createTaskProgress(520, 290, player);
    this.createDailyQuestOverview(44, 490);
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

  private createPlayerCard(x: number, y: number, player: any): void {
    const width = 430;
    const height = 120;

    const card = this.add.graphics();
    card.fillStyle(0x1e293b, 0.95);
    card.lineStyle(2, 0xf59e0b, 0.6);
    card.fillRoundedRect(x, y, width, height, 12);
    card.strokeRoundedRect(x, y, width, height, 12);

    const avatarBg = this.add.graphics();
    avatarBg.fillStyle(0xf59e0b, 0.2);
    avatarBg.lineStyle(3, 0xf59e0b, 0.8);
    avatarBg.fillCircle(x + 60, y + height / 2, 40);
    avatarBg.strokeCircle(x + 60, y + height / 2, 40);

    this.add.text(x + 60, y + height / 2, `Lv${player.level}`, {
      fontFamily: 'Segoe UI',
      fontSize: '18px',
      color: '#f59e0b',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(x + 120, y + 28, `玩家 #${player.level.toString().padStart(4, '0')}`, {
      fontFamily: 'Segoe UI',
      fontSize: '22px',
      color: '#f8fafc',
      fontStyle: 'bold'
    });

    const expProgress = player.exp / player.expToNext;
    const expBarWidth = 280;
    const expBarY = y + 65;

    const expBg = this.add.graphics();
    expBg.fillStyle(0x334155, 0.8);
    expBg.fillRoundedRect(x + 120, expBarY, expBarWidth, 14, 4);

    const expFill = this.add.graphics();
    expFill.fillStyle(0xf59e0b, 1);
    expFill.fillRoundedRect(x + 120, expBarY, expBarWidth * expProgress, 14, 4);

    this.add.text(x + 120, expBarY + 24, `经验值：${player.exp} / ${player.expToNext}`, {
      fontFamily: 'Segoe UI',
      fontSize: '13px',
      color: '#94a3b8'
    });

    this.add.text(x + width - 20, y + 28, `💎 ${player.currency}`, {
      fontFamily: 'Segoe UI',
      fontSize: '20px',
      color: '#60a5fa',
      fontStyle: 'bold'
    }).setOrigin(1, 0);
  }

  private createStatsPanel(x: number, y: number, player: any): void {
    const width = 430;
    const height = 240;

    const panel = this.add.graphics();
    panel.fillStyle(0x1e293b, 0.95);
    panel.lineStyle(2, 0x4fd1c5, 0.4);
    panel.fillRoundedRect(x, y, width, height, 12);
    panel.strokeRoundedRect(x, y, width, height, 12);

    this.add.text(x + 25, y + 20, '📊 统计数据', {
      fontFamily: 'Segoe UI',
      fontSize: '18px',
      color: '#4fd1c5',
      fontStyle: 'bold'
    });

    const stats = [
      { label: '累计得分', value: player.totalScore.toLocaleString(), icon: '🏆', color: '#f59e0b' },
      { label: '累计点击', value: player.totalClicks.toLocaleString(), icon: '👆', color: '#60a5fa' },
      { label: '最高连击', value: player.maxCombo.toString(), icon: '🔥', color: '#ef4444' },
      { label: '游戏时长', value: this.formatTime(player.playTime), icon: '⏱', color: '#a78bfa' },
      { label: '已通关', value: `${player.completedLevels.length} 关`, icon: '⭐', color: '#4ade80' },
      { label: '最后上线', value: this.formatDate(player.lastPlayed), icon: '📅', color: '#94a3b8' }
    ];

    stats.forEach((stat, index) => {
      const colX = x + 25 + (index % 2) * 205;
      const rowY = y + 55 + Math.floor(index / 2) * 55;

      this.add.text(colX, rowY, stat.icon, {
        fontFamily: 'Segoe UI',
        fontSize: '18px'
      });

      this.add.text(colX + 30, rowY - 2, stat.label, {
        fontFamily: 'Segoe UI',
        fontSize: '12px',
        color: '#94a3b8'
      });

      this.add.text(colX + 30, rowY + 16, stat.value, {
        fontFamily: 'Segoe UI',
        fontSize: '18px',
        color: stat.color,
        fontStyle: 'bold'
      });
    });
  }

  private createLevelProgress(x: number, y: number, player: any): void {
    const width = 396;
    const height = 170;

    const panel = this.add.graphics();
    panel.fillStyle(0x1e293b, 0.95);
    panel.lineStyle(2, 0x60a5fa, 0.4);
    panel.fillRoundedRect(x, y, width, height, 12);
    panel.strokeRoundedRect(x, y, width, height, 12);

    this.add.text(x + 20, y + 18, '🎮 关卡进度', {
      fontFamily: 'Segoe UI',
      fontSize: '16px',
      color: '#60a5fa',
      fontStyle: 'bold'
    });

    const totalWidth = width - 40;
    const itemWidth = totalWidth / LEVELS.length;

    LEVELS.forEach((level, index) => {
      const itemX = x + 20 + index * itemWidth;
      const itemY = y + 60;
      const isCompleted = player.completedLevels.includes(level.id);
      const isUnlocked = player.unlockedLevels.includes(level.id);
      const hasScore = player.levelScores[level.id] > 0;

      if (isCompleted) {
        this.add.rectangle(itemX + itemWidth / 2 - 4, itemY, itemWidth - 8, 70, 0x166534, 0.6);
        this.add.text(itemX + itemWidth / 2 - 4, itemY - 20, level.id.toString(), {
          fontFamily: 'Segoe UI',
          fontSize: '14px',
          color: '#4ade80',
          fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(itemX + itemWidth / 2 - 4, itemY, '✓', {
          fontFamily: 'Segoe UI',
          fontSize: '24px',
          color: '#4ade80'
        }).setOrigin(0.5);
        if (hasScore) {
          this.add.text(itemX + itemWidth / 2 - 4, itemY + 24, player.levelScores[level.id].toString(), {
            fontFamily: 'Segoe UI',
            fontSize: '11px',
            color: '#f59e0b'
          }).setOrigin(0.5);
        }
      } else if (isUnlocked) {
        this.add.rectangle(itemX + itemWidth / 2 - 4, itemY, itemWidth - 8, 70, 0x1e3a5f, 0.6);
        this.add.text(itemX + itemWidth / 2 - 4, itemY - 20, level.id.toString(), {
          fontFamily: 'Segoe UI',
          fontSize: '14px',
          color: '#60a5fa',
          fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(itemX + itemWidth / 2 - 4, itemY, '●', {
          fontFamily: 'Segoe UI',
          fontSize: '16px',
          color: '#60a5fa'
        }).setOrigin(0.5);
        if (hasScore) {
          this.add.text(itemX + itemWidth / 2 - 4, itemY + 24, player.levelScores[level.id].toString(), {
            fontFamily: 'Segoe UI',
            fontSize: '11px',
            color: '#94a3b8'
          }).setOrigin(0.5);
        }
      } else {
        this.add.rectangle(itemX + itemWidth / 2 - 4, itemY, itemWidth - 8, 70, 0x0f172a, 0.6);
        this.add.text(itemX + itemWidth / 2 - 4, itemY, '🔒', {
          fontFamily: 'Segoe UI',
          fontSize: '16px'
        }).setOrigin(0.5);
      }
    });

    const unlockedCount = player.unlockedLevels.length;
    const completedCount = player.completedLevels.length;
    this.add.text(x + width / 2, y + 145, `${unlockedCount} 已解锁 / ${completedCount} 已通关`, {
      fontFamily: 'Segoe UI',
      fontSize: '13px',
      color: '#94a3b8'
    }).setOrigin(0.5);
  }

  private createTaskProgress(x: number, y: number, player: any): void {
    const width = 396;
    const height = 190;

    const panel = this.add.graphics();
    panel.fillStyle(0x1e293b, 0.95);
    panel.lineStyle(2, 0xf59e0b, 0.4);
    panel.fillRoundedRect(x, y, width, height, 12);
    panel.strokeRoundedRect(x, y, width, height, 12);

    this.add.text(x + 20, y + 18, '🏆 任务进度', {
      fontFamily: 'Segoe UI',
      fontSize: '16px',
      color: '#f59e0b',
      fontStyle: 'bold'
    });

    const completedCount = player.completedTasks.length;
    const totalCount = TASKS.length;
    const progress = completedCount / totalCount;

    const progressWidth = width - 40;
    const progressY = y + 55;

    const progressBg = this.add.graphics();
    progressBg.fillStyle(0x334155, 0.8);
    progressBg.fillRoundedRect(x + 20, progressY, progressWidth, 16, 6);

    const progressFill = this.add.graphics();
    progressFill.fillStyle(0xf59e0b, 1);
    progressFill.fillRoundedRect(x + 20, progressY, progressWidth * progress, 16, 6);

    this.add.text(x + width / 2, progressY + 30, `${completedCount} / ${totalCount} 任务已完成`, {
      fontFamily: 'Segoe UI',
      fontSize: '14px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const taskTypes = [
      { label: '得分', count: TASKS.filter(t => t.type === 'score').length, color: '#f59e0b' },
      { label: '连击', count: TASKS.filter(t => t.type === 'combo').length, color: '#ef4444' },
      { label: '关卡', count: TASKS.filter(t => t.type === 'level').length, color: '#4ade80' },
      { label: '点击', count: TASKS.filter(t => t.type === 'total_click').length, color: '#60a5fa' },
      { label: '时长', count: TASKS.filter(t => t.type === 'play_time').length, color: '#a78bfa' }
    ];

    taskTypes.forEach((type, index) => {
      const typeX = x + 20 + index * 75;
      const typeY = y + 115;
      const completed = player.completedTasks.filter((id: string) => {
        const task = TASKS.find(t => t.id === id);
        return task && task.type === TASKS.find(t => t.type === type.label.toLowerCase() ||
          (type.label === '得分' && t.type === 'score') ||
          (type.label === '连击' && t.type === 'combo') ||
          (type.label === '关卡' && t.type === 'level') ||
          (type.label === '点击' && t.type === 'total_click') ||
          (type.label === '时长' && t.type === 'play_time'))?.type;
      }).length;

      this.add.circle(typeX, typeY, 12, parseInt(type.color.replace('#', ''), 16), 0.3);
      this.add.text(typeX, typeY, `${completed}/${type.count}`, {
        fontFamily: 'Segoe UI',
        fontSize: '10px',
        color: type.color,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      this.add.text(typeX, typeY + 22, type.label, {
        fontFamily: 'Segoe UI',
        fontSize: '11px',
        color: '#94a3b8'
      }).setOrigin(0.5);
    });
  }

  private formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分`;
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  private createDailyQuestOverview(x: number, y: number): void {
    const width = 872;
    const height = 40;

    const storage = StorageManager.getInstance();
    const dailyQuests = storage.getDailyQuestsWithConfig();
    const completedCount = dailyQuests.filter(q => q.progress.completed).length;
    const claimedCount = dailyQuests.filter(q => q.progress.claimed).length;
    const claimableCount = storage.getClaimableDailyQuestCount();

    const panel = this.add.graphics();
    panel.fillStyle(0x1e293b, 0.95);
    panel.lineStyle(2, 0xa78bfa, 0.4);
    panel.fillRoundedRect(x, y, width, height, 10);
    panel.strokeRoundedRect(x, y, width, height, 10);

    this.add.text(x + 20, y + height / 2, '📋 每日悬赏', {
      fontFamily: 'Segoe UI',
      fontSize: '16px',
      color: '#a78bfa',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    const progressWidth = 200;
    const progressX = x + 140;
    const progressY = y + height / 2 - 6;

    const progressBg = this.add.graphics();
    progressBg.fillStyle(0x334155, 0.8);
    progressBg.fillRoundedRect(progressX, progressY, progressWidth, 12, 4);

    const progressFill = this.add.graphics();
    const fillWidth = (completedCount / dailyQuests.length) * progressWidth;
    progressFill.fillStyle(0xa78bfa, 1);
    progressFill.fillRoundedRect(progressX, progressY, fillWidth, 12, 4);

    this.add.text(progressX + progressWidth / 2, progressY + 6, `${completedCount} / ${dailyQuests.length} 已完成`, {
      fontFamily: 'Segoe UI',
      fontSize: '11px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    if (claimableCount > 0) {
      this.add.text(x + 380, y + height / 2, `${claimableCount} 个可领取`, {
        fontFamily: 'Segoe UI',
        fontSize: '14px',
        color: '#4ade80',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
    } else if (claimedCount === dailyQuests.length) {
      this.add.text(x + 380, y + height / 2, '✓ 全部已领取', {
        fontFamily: 'Segoe UI',
        fontSize: '14px',
        color: '#64748b',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
    } else {
      this.add.text(x + 380, y + height / 2, '继续加油！', {
        fontFamily: 'Segoe UI',
        fontSize: '14px',
        color: '#94a3b8'
      }).setOrigin(0, 0.5);
    }

    const viewBtn = this.add.rectangle(x + width - 70, y + height / 2, 100, 28, 0xa78bfa, 0.9);
    viewBtn.setStrokeStyle(2, 0xa78bfa, 0.8);
    viewBtn.setInteractive({ useHandCursor: true });

    this.add.text(x + width - 70, y + height / 2, '查看详情', {
      fontFamily: 'Segoe UI',
      fontSize: '13px',
      color: '#081019',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    viewBtn.on('pointerover', () => viewBtn.setFillStyle(0xc4b5fd, 1));
    viewBtn.on('pointerout', () => viewBtn.setFillStyle(0xa78bfa, 0.9));
    viewBtn.on('pointerdown', () => {
      this.scene.start('daily-quest-scene');
    });
  }
}
