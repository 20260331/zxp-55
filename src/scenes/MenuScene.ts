import Phaser from 'phaser';
import { StorageManager } from '../managers/StorageManager';

export class MenuScene extends Phaser.Scene {
  private buttons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super('menu-scene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#081019');

    const centerX = this.cameras.main.width / 2;
    const player = StorageManager.getInstance().getPlayer();

    this.add.rectangle(centerX, 270, 960, 540, 0x081019);

    this.add.text(centerX, 70, '霓虹跃迁', {
      fontFamily: 'Segoe UI',
      fontSize: '48px',
      color: '#4fd1c5',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(centerX, 115, 'NEON TRANSITION', {
      fontFamily: 'Segoe UI',
      fontSize: '16px',
      color: '#9fb3c8',
      letterSpacing: 4
    }).setOrigin(0.5);

    this.createPlayerInfo(44, 24);

    const buttonConfigs = [
      { label: '🎮 关卡模式', y: 165, color: '#4fd1c5', action: () => this.scene.start('level-select-scene') },
      { label: '💀 生存模式', y: 225, color: '#ef4444', action: () => this.scene.start('skill-select-scene') },
      { label: '📋 每日悬赏', y: 285, color: '#a78bfa', action: () => this.scene.start('daily-quest-scene') },
      { label: '任务成就', y: 345, color: '#f59e0b', action: () => this.scene.start('task-scene') },
      { label: '玩家档案', y: 405, color: '#60a5fa', action: () => this.scene.start('profile-scene') },
      { label: '退出游戏', y: 465, color: '#ef4444', action: () => this.showResetConfirm() }
    ];

    for (const config of buttonConfigs) {
      this.createButton(centerX, config.y, config.label, config.color, config.action);
    }

    this.add.text(centerX, 515, '在光球消失前完成点击，持续累积分数。', {
      fontFamily: 'Segoe UI',
      fontSize: '12px',
      color: '#64748b'
    }).setOrigin(0.5);

    this.createDailyQuestBadge(centerX + 170, 285);
  }

  private createPlayerInfo(x: number, y: number): void {
    const player = StorageManager.getInstance().getPlayer();
    const expProgress = player.exp / player.expToNext;

    const container = this.add.container(x, y);

    container.add(this.add.text(0, 0, `Lv.${player.level}`, {
      fontFamily: 'Segoe UI',
      fontSize: '20px',
      color: '#f59e0b',
      fontStyle: 'bold'
    }));

    const expBarBg = this.add.graphics();
    expBarBg.fillStyle(0x1e293b, 0.8);
    expBarBg.fillRect(0, 30, 180, 12);
    container.add(expBarBg);

    const expBar = this.add.graphics();
    expBar.fillStyle(0xf59e0b, 1);
    expBar.fillRect(0, 30, 180 * expProgress, 12);
    container.add(expBar);

    container.add(this.add.text(0, 48, `${player.exp} / ${player.expToNext} EXP`, {
      fontFamily: 'Segoe UI',
      fontSize: '12px',
      color: '#9fb3c8'
    }));

    container.add(this.add.text(0, 70, `💎 ${player.currency}`, {
      fontFamily: 'Segoe UI',
      fontSize: '16px',
      color: '#60a5fa'
    }));
  }

  private createDailyQuestBadge(x: number, y: number): void {
    const storage = StorageManager.getInstance();
    const claimableCount = storage.getClaimableDailyQuestCount();
    
    if (claimableCount > 0) {
      const badgeBg = this.add.circle(x, y - 20, 14, 0xef4444, 0.9);
      badgeBg.setStrokeStyle(2, 0xfca5a5, 0.8);
      
      this.add.text(x, y - 20, claimableCount.toString(), {
        fontFamily: 'Segoe UI',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }
  }

  private createButton(x: number, y: number, label: string, color: string, action: () => void): void {
    const container = this.add.container(x, y);

    const width = 280;
    const height = 50;

    const bg = this.add.rectangle(0, 0, width, height, 0x1e293b, 0.9);
    bg.setStrokeStyle(2, parseInt(color.replace('#', ''), 16), 0.8);
    bg.setInteractive({ useHandCursor: true });

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Segoe UI',
      fontSize: '22px',
      color: color
    }).setOrigin(0.5);

    container.add([bg, text]);
    this.buttons.push(container);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x334155, 0.9);
      bg.setStrokeStyle(3, parseInt(color.replace('#', ''), 16), 1);
      text.setFontSize('24px');
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x1e293b, 0.9);
      bg.setStrokeStyle(2, parseInt(color.replace('#', ''), 16), 0.8);
      text.setFontSize('22px');
    });

    bg.on('pointerdown', () => {
      action();
    });
  }

  private showResetConfirm(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const overlay = this.add.rectangle(centerX, centerY, 960, 540, 0x000000, 0.7);

    const confirmBox = this.add.graphics();
    confirmBox.fillStyle(0x1e293b, 0.95);
    confirmBox.fillRoundedRect(centerX - 200, centerY - 80, 400, 160, 12);
    confirmBox.lineStyle(2, 0xef4444, 0.8);
    confirmBox.strokeRoundedRect(centerX - 200, centerY - 80, 400, 160, 12);

    this.add.text(centerX, centerY - 30, '确定要重置所有存档吗？', {
      fontFamily: 'Segoe UI',
      fontSize: '20px',
      color: '#f8fafc'
    }).setOrigin(0.5);

    this.add.text(centerX, centerY, '此操作无法撤销！', {
      fontFamily: 'Segoe UI',
      fontSize: '14px',
      color: '#ef4444'
    }).setOrigin(0.5);

    const noBtn = this.add.rectangle(centerX - 80, centerY + 45, 120, 40, 0x475569, 0.9);
    noBtn.setInteractive({ useHandCursor: true });
    this.add.text(centerX - 80, centerY + 45, '取消', {
      fontFamily: 'Segoe UI',
      fontSize: '16px',
      color: '#f8fafc'
    }).setOrigin(0.5);

    const yesBtn = this.add.rectangle(centerX + 80, centerY + 45, 120, 40, 0xef4444, 0.9);
    yesBtn.setInteractive({ useHandCursor: true });
    this.add.text(centerX + 80, centerY + 45, '确认重置', {
      fontFamily: 'Segoe UI',
      fontSize: '16px',
      color: '#f8fafc'
    }).setOrigin(0.5);

    noBtn.on('pointerdown', () => {
      overlay.destroy();
      confirmBox.destroy();
      noBtn.destroy();
      yesBtn.destroy();
      this.children.each((child: Phaser.GameObjects.GameObject) => {
        const textChild = child as Phaser.GameObjects.Text;
        if (textChild.type === 'Text' && textChild.y > centerY - 50 && textChild.y < centerY + 60) {
          textChild.destroy();
        }
      });
    });

    yesBtn.on('pointerdown', () => {
      StorageManager.getInstance().resetSave();
      this.scene.restart();
    });
  }
}
