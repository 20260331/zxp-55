import Phaser from 'phaser';
import { TASKS, getTaskById } from '../config/tasks';
import { StorageManager } from '../managers/StorageManager';

export class TaskScene extends Phaser.Scene {
  constructor() {
    super('task-scene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#081019');
    this.add.rectangle(480, 270, 960, 540, 0x081019);

    const storage = StorageManager.getInstance();
    const completedCount = storage.getPlayer().completedTasks.length;

    this.add.text(44, 34, '任务成就', {
      fontFamily: 'Segoe UI',
      fontSize: '32px',
      color: '#f8fafc',
      fontStyle: 'bold'
    });

    this.add.text(44, 74, `已完成：${completedCount} / ${TASKS.length}`, {
      fontFamily: 'Segoe UI',
      fontSize: '16px',
      color: '#9fb3c8'
    });

    this.createBackButton();
    this.createTaskList();
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

  private createTaskList(): void {
    const storage = StorageManager.getInstance();
    const startX = 44;
    const startY = 110;
    const width = 872;
    const height = 55;

    TASKS.forEach((task, index) => {
      const y = startY + index * (height + 8);
      const isCompleted = storage.isTaskCompleted(task.id);
      const progress = storage.getTaskProgress(task.id);

      this.createTaskCard(startX, y, width, height, task, isCompleted, progress);
    });
  }

  private createTaskCard(x: number, y: number, width: number, height: number, task: any, isCompleted: boolean, progress: number): void {
    const card = this.add.graphics();

    if (isCompleted) {
      card.fillStyle(0x166534, 0.4);
      card.lineStyle(2, 0x4ade80, 0.6);
    } else {
      card.fillStyle(0x1e293b, 0.9);
      card.lineStyle(2, 0x334155, 0.5);
    }
    card.fillRoundedRect(x, y, width, height, 8);
    card.strokeRoundedRect(x, y, width, height, 8);

    if (isCompleted) {
      this.add.text(x + 20, y + height / 2, '✓', {
        fontFamily: 'Segoe UI',
        fontSize: '24px',
        color: '#4ade80',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
    }

    const iconOffset = isCompleted ? 50 : 20;
    const typeIcons: Record<string, string> = {
      score: '🎯',
      combo: '🔥',
      level: '⭐',
      total_click: '👆',
      play_time: '⏱'
    };

    this.add.text(x + iconOffset, y + height / 2, typeIcons[task.type] || '📋', {
      fontFamily: 'Segoe UI',
      fontSize: '22px'
    }).setOrigin(0, 0.5);

    this.add.text(x + iconOffset + 35, y + 14, task.name, {
      fontFamily: 'Segoe UI',
      fontSize: '16px',
      color: isCompleted ? '#4ade80' : '#f8fafc',
      fontStyle: 'bold'
    });

    this.add.text(x + iconOffset + 35, y + 34, task.description, {
      fontFamily: 'Segoe UI',
      fontSize: '12px',
      color: '#94a3b8'
    });

    if (!isCompleted) {
      const progressWidth = 180;
      const progressX = x + width - progressWidth - 110;
      const progressY = y + height / 2 - 6;

      const progressBg = this.add.graphics();
      progressBg.fillStyle(0x334155, 0.8);
      progressBg.fillRoundedRect(progressX, progressY, progressWidth, 12, 4);

      const progressFill = this.add.graphics();
      const fillWidth = Math.min((progress / task.target) * progressWidth, progressWidth);
      progressFill.fillStyle(0x60a5fa, 1);
      progressFill.fillRoundedRect(progressX, progressY, fillWidth, 12, 4);

      this.add.text(progressX + progressWidth / 2, progressY + 6, `${progress} / ${task.target}`, {
        fontFamily: 'Segoe UI',
        fontSize: '11px',
        color: '#f8fafc'
      }).setOrigin(0.5);
    }

    this.add.text(x + width - 20, y + height / 2, `+${task.reward} 💎`, {
      fontFamily: 'Segoe UI',
      fontSize: '16px',
      color: isCompleted ? '#4ade80' : '#60a5fa',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);
  }
}
