import Phaser from 'phaser';
import { GameSession, SurvivalSession, SKILLS } from '../types';
import { getLevelById, getDifficultyColor, getDifficultyLabel } from '../config/levels';
import { getTaskById } from '../config/tasks';
import { getDailyQuestById } from '../config/dailyQuests';
import { GameStateManager } from '../managers/GameState';
import { StorageManager } from '../managers/StorageManager';

interface ResultSceneData {
  session?: GameSession;
  survivalSession?: SurvivalSession;
  levelUp: {
    leveledUp: boolean;
    newLevel: number;
    completedTasks: string[];
    earnedCurrency: number;
    isNewRecord?: boolean;
    dailyQuestProgress?: {
      completedQuests: string[];
      progressUpdates: { questId: string; oldValue: number; newValue: number }[];
    };
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
    const { levelUp } = this.resultData;

    this.add.rectangle(centerX, 270, 960, 540, 0x081019);

    if (this.resultData.survivalSession) {
      this.createSurvivalResult(centerX, this.resultData.survivalSession, levelUp);
    } else if (this.resultData.session) {
      this.createClassicResult(centerX, this.resultData.session, levelUp);
    }
  }

  private createClassicResult(centerX: number, session: GameSession, levelUp: ResultSceneData['levelUp']): void {
    const levelConfig = getLevelById(session.currentLevel);

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

    let panelY = levelUp.leveledUp ? 180 : 150;
    this.createStatsPanel(centerX, panelY, session, levelUp);

    let nextY = panelY + 220;
    
    if (levelUp.completedTasks.length > 0) {
      this.createTaskRewards(centerX, nextY, levelUp.completedTasks);
      nextY += 40 + levelUp.completedTasks.length * 40;
    }

    if (levelUp.dailyQuestProgress && (levelUp.dailyQuestProgress.completedQuests.length > 0 || levelUp.dailyQuestProgress.progressUpdates.length > 0)) {
      this.createDailyQuestProgress(centerX, nextY, levelUp.dailyQuestProgress);
    }

    this.createButtons(centerX, 470, session);
  }

  private createSurvivalResult(centerX: number, session: SurvivalSession, levelUp: ResultSceneData['levelUp']): void {
    const resultText = '💀 游戏结束';
    const resultColor = '#ef4444';

    this.add.text(centerX, 50, resultText, {
      fontFamily: 'Segoe UI',
      fontSize: '42px',
      color: resultColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(centerX, 95, '生存模式', {
      fontFamily: 'Segoe UI',
      fontSize: '18px',
      color: '#a78bfa'
    }).setOrigin(0.5);

    if (levelUp.isNewRecord) {
      this.add.text(centerX, 130, '🏆 新纪录！', {
        fontFamily: 'Segoe UI',
        fontSize: '20px',
        color: '#f59e0b',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    if (levelUp.leveledUp) {
      const yOffset = levelUp.isNewRecord ? 165 : 130;
      this.add.text(centerX, yOffset, `🎊 恭喜升级！达到 Lv.${levelUp.newLevel}`, {
        fontFamily: 'Segoe UI',
        fontSize: '20px',
        color: '#f59e0b',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    let panelY = 150;
    if (levelUp.isNewRecord) panelY += 35;
    if (levelUp.leveledUp) panelY += 35;

    this.createSurvivalStatsPanel(centerX, panelY, session, levelUp);

    let nextY = panelY + 240;
    
    if (levelUp.completedTasks.length > 0) {
      this.createTaskRewards(centerX, nextY, levelUp.completedTasks);
      nextY += 40 + levelUp.completedTasks.length * 40;
    }

    if (levelUp.dailyQuestProgress && (levelUp.dailyQuestProgress.completedQuests.length > 0 || levelUp.dailyQuestProgress.progressUpdates.length > 0)) {
      this.createDailyQuestProgress(centerX, nextY, levelUp.dailyQuestProgress);
    }

    this.createSurvivalButtons(centerX, 490, session);
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

  private createSurvivalStatsPanel(x: number, y: number, session: SurvivalSession, levelUp: any): void {
    const width = 420;
    const height = 230;

    const panel = this.add.graphics();
    panel.fillStyle(0x1e293b, 0.95);
    panel.lineStyle(2, 0xef4444, 0.6);
    panel.fillRoundedRect(x - width / 2, y, width, height, 12);
    panel.strokeRoundedRect(x - width / 2, y, width, height, 12);

    const stats = [
      { label: '存活时间', value: `${Math.floor(session.survivalTime)}秒`, color: '#60a5fa' },
      { label: '抵达波数', value: `第 ${session.wave} 波`, color: '#a78bfa' },
      { label: '最终得分', value: session.score.toString(), color: '#f59e0b' },
      { label: '狂热波次', value: `${session.frenzyWaveCount} 次`, color: '#ef4444' },
      { label: '最高连击', value: `${session.maxCombo}`, color: '#4fd1c5' },
      { label: '普通球', value: `${session.normalOrbsClicked}`, color: '#4fd1c5' },
      { label: '陷阱球', value: `${session.trapOrbsClicked}`, color: '#ef4444' },
      { label: '护盾球', value: `${session.shieldOrbsClicked}`, color: '#60a5fa' },
      { label: '命中率', value: `${this.getSurvivalAccuracy(session)}%`, color: '#a78bfa' },
      { label: '获得金币', value: `+${levelUp.earnedCurrency} 💎`, color: '#60a5fa' }
    ];

    const startX = x - width / 2 + 25;
    let offsetY = y + 22;

    stats.forEach((stat, index) => {
      const colX = startX + (index % 2) * 210;
      const rowY = offsetY + Math.floor(index / 2) * 42;

      this.add.text(colX, rowY, stat.label, {
        fontFamily: 'Segoe UI',
        fontSize: '12px',
        color: '#94a3b8'
      });

      this.add.text(colX, rowY + 18, stat.value, {
        fontFamily: 'Segoe UI',
        fontSize: '18px',
        color: stat.color,
        fontStyle: 'bold'
      });
    });
  }

  private getSurvivalAccuracy(session: SurvivalSession): number {
    const total = session.totalOrbsClicked + session.orbsMissed;
    if (total === 0) return 100;
    return Math.round((session.totalOrbsClicked / total) * 100);
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

  private createDailyQuestProgress(
    x: number, 
    y: number, 
    progress: {
      completedQuests: string[];
      progressUpdates: { questId: string; oldValue: number; newValue: number }[];
    }
  ): void {
    const width = 400;
    const itemHeight = 36;
    const totalItems = progress.completedQuests.length + progress.progressUpdates.filter(
      p => !progress.completedQuests.includes(p.questId)
    ).length;
    const height = Math.min(totalItems, 4) * itemHeight + 60;

    const panel = this.add.graphics();
    panel.fillStyle(0x1e293b, 0.95);
    panel.lineStyle(2, 0xa78bfa, 0.6);
    panel.fillRoundedRect(x - width / 2, y, width, height, 12);
    panel.strokeRoundedRect(x - width / 2, y, width, height, 12);

    this.add.text(x, y + 20, '📋 每日悬赏进度', {
      fontFamily: 'Segoe UI',
      fontSize: '18px',
      color: '#a78bfa',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    let itemIndex = 0;
    const maxItems = 4;

    progress.completedQuests.slice(0, maxItems).forEach((questId) => {
      const quest = getDailyQuestById(questId);
      if (quest) {
        const itemY = y + 50 + itemIndex * itemHeight;
        this.add.text(x - width / 2 + 25, itemY, `✓ ${quest.name}`, {
          fontFamily: 'Segoe UI',
          fontSize: '13px',
          color: '#4ade80',
          fontStyle: 'bold'
        });

        this.add.text(x + width / 2 - 25, itemY, `+${quest.reward} 💎`, {
          fontFamily: 'Segoe UI',
          fontSize: '13px',
          color: '#60a5fa',
          fontStyle: 'bold'
        }).setOrigin(1, 0);
        
        itemIndex++;
      }
    });

    if (itemIndex < maxItems) {
      progress.progressUpdates
        .filter(p => !progress.completedQuests.includes(p.questId))
        .slice(0, maxItems - itemIndex)
        .forEach((update) => {
          const quest = getDailyQuestById(update.questId);
          if (quest) {
            const itemY = y + 50 + itemIndex * itemHeight;
            this.add.text(x - width / 2 + 25, itemY, quest.name, {
              fontFamily: 'Segoe UI',
              fontSize: '13px',
              color: '#f8fafc'
            });

            this.add.text(x + width / 2 - 25, itemY, `${update.oldValue} → ${update.newValue}`, {
              fontFamily: 'Segoe UI',
              fontSize: '13px',
              color: '#60a5fa',
              fontStyle: 'bold'
            }).setOrigin(1, 0);
            
            itemIndex++;
          }
        });
    }

    const remainingItems = totalItems - maxItems;
    if (remainingItems > 0) {
      this.add.text(x, y + height - 20, `还有 ${remainingItems} 项进度已更新...`, {
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

  private createSurvivalButtons(x: number, y: number, session: SurvivalSession): void {
    const retryBtn = this.add.rectangle(x - 110, y, 200, 50, 0x4fd1c5, 0.9);
    retryBtn.setStrokeStyle(2, 0x4fd1c5, 0.8);
    retryBtn.setInteractive({ useHandCursor: true });

    this.add.text(x - 110, y, '再来一局', {
      fontFamily: 'Segoe UI',
      fontSize: '18px',
      color: '#081019',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const backBtn = this.add.rectangle(x + 110, y, 200, 50, 0x1e293b, 0.9);
    backBtn.setStrokeStyle(2, 0x64748b, 0.8);
    backBtn.setInteractive({ useHandCursor: true });

    this.add.text(x + 110, y, '选择技能', {
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
      const storage = StorageManager.getInstance();
      const player = storage.getPlayer();
      GameStateManager.getInstance().startSurvivalSession(player.selectedSkill);
      this.scene.start('survival-game-scene');
    });

    backBtn.on('pointerover', () => backBtn.setFillStyle(0x334155, 0.9));
    backBtn.on('pointerout', () => backBtn.setFillStyle(0x1e293b, 0.9));
    backBtn.on('pointerdown', () => {
      this.scene.start('skill-select-scene');
    });

    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x475569, 0.9));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x334155, 0.9));
    menuBtn.on('pointerdown', () => {
      this.scene.start('menu-scene');
    });
  }
}
