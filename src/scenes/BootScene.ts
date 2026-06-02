import Phaser from 'phaser';
import { StorageManager } from '../managers/StorageManager';

export class BootScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;

  constructor() {
    super('boot-scene');
  }

  preload(): void {
    this.cameras.main.setBackgroundColor('#081019');

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.add.text(centerX, centerY - 100, '霓虹跃迁', {
      fontFamily: 'Segoe UI',
      fontSize: '48px',
      color: '#4fd1c5'
    }).setOrigin(0.5);

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x1e293b, 0.8);
    this.progressBox.fillRect(centerX - 160, centerY, 320, 30);

    this.progressBar = this.add.graphics();

    this.loadingText = this.add.text(centerX, centerY + 50, '正在加载... 0%', {
      fontFamily: 'Segoe UI',
      fontSize: '18px',
      color: '#9fb3c8'
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x4fd1c5, 1);
      this.progressBar.fillRect(centerX - 155, centerY + 5, 310 * value, 20);
      this.loadingText.setText(`正在加载... ${Math.round(value * 100)}%`);
    });

    this.load.on('complete', () => {
      this.loadingText.setText('加载完成！');
    });
  }

  create(): void {
    const hasExistingSave = StorageManager.getInstance().load();

    this.time.delayedCall(800, () => {
      if (hasExistingSave) {
        this.scene.start('menu-scene');
      } else {
        this.scene.start('menu-scene');
      }
    });
  }
}
