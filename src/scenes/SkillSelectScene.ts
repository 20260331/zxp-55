import Phaser from 'phaser';
import { SKILLS, SkillType, SURVIVAL_CONFIG } from '../types';
import { StorageManager } from '../managers/StorageManager';
import { GameStateManager } from '../managers/GameState';

export class SkillSelectScene extends Phaser.Scene {
  private storage!: StorageManager;
  private selectedSkill!: SkillType;
  private skillCards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super('skill-select-scene');
  }

  create(): void {
    this.storage = StorageManager.getInstance();
    this.selectedSkill = this.storage.getPlayer().selectedSkill;

    this.cameras.main.setBackgroundColor('#081019');
    this.add.rectangle(480, 270, 960, 540, 0x081019);

    this.add.text(480, 40, '🎯 选择技能', {
      fontFamily: 'Segoe UI',
      fontSize: '32px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(480, 75, '生存模式中只能携带一个主动技能', {
      fontFamily: 'Segoe UI',
      fontSize: '14px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.createBackButton();
    this.createBestRecords();
    this.createSkillCards();
    this.createStartButton();
  }

  private createBackButton(): void {
    const backBtn = this.add.rectangle(70, 40, 90, 36, 0x1e293b, 0.9);
    backBtn.setStrokeStyle(2, 0x64748b, 0.8);
    backBtn.setInteractive({ useHandCursor: true });

    this.add.text(70, 40, '返回', {
      fontFamily: 'Segoe UI',
      fontSize: '16px',
      color: '#9fb3c8'
    }).setOrigin(0.5);

    backBtn.on('pointerdown', () => {
      this.scene.start('menu-scene');
    });

    backBtn.on('pointerover', () => backBtn.setFillStyle(0x334155, 0.9));
    backBtn.on('pointerout', () => backBtn.setFillStyle(0x1e293b, 0.9));
  }

  private createBestRecords(): void {
    const player = this.storage.getPlayer();
    const x = 480;
    const y = 112;

    const panel = this.add.graphics();
    panel.fillStyle(0x1e293b, 0.9);
    panel.lineStyle(2, 0xa78bfa, 0.6);
    panel.fillRoundedRect(x - 180, y, 360, 60, 10);
    panel.strokeRoundedRect(x - 180, y, 360, 60, 10);

    this.add.text(x, y + 12, '🏆 最佳记录', {
      fontFamily: 'Segoe UI',
      fontSize: '14px',
      color: '#a78bfa',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const records = [
      { label: '存活', value: player.bestSurvivalTime > 0 ? `${player.bestSurvivalTime}s` : '-' },
      { label: '波数', value: player.bestSurvivalWave > 0 ? `${player.bestSurvivalWave}` : '-' },
      { label: '分数', value: player.bestSurvivalScore > 0 ? player.bestSurvivalScore.toString() : '-' }
    ];

    const colWidth = 120;
    const startX = x - 150;
    records.forEach((record, index) => {
      const colX = startX + index * colWidth;
      this.add.text(colX + colWidth / 2, y + 32, `${record.label} ${record.value}`, {
        fontFamily: 'Segoe UI',
        fontSize: '13px',
        color: '#f59e0b',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    });
  }

  private createSkillCards(): void {
    const skills = Object.values(SKILLS);
    const cardWidth = 200;
    const totalWidth = skills.length * cardWidth + (skills.length - 1) * 30;
    const startX = 480 - totalWidth / 2 + cardWidth / 2;

    skills.forEach((skill, index) => {
      const x = startX + index * (cardWidth + 30);
      const y = 280;
      this.createSkillCard(x, y, skill.type, cardWidth);
    });
  }

  private createSkillCard(x: number, y: number, skillType: SkillType, cardWidth: number): void {
    const skill = SKILLS[skillType];
    const isSelected = this.selectedSkill === skillType;
    const width = cardWidth;
    const height = 210;

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    this.drawCardBg(bg, width, height, isSelected);
    container.add(bg);

    const iconBg = this.add.circle(0, -50, 35, 0x334155, 0.9);
    iconBg.setStrokeStyle(2, 0x4fd1c5, 0.6);
    container.add(iconBg);

    const icon = this.add.text(0, -50, skill.icon, {
      fontFamily: 'Segoe UI',
      fontSize: '28px'
    }).setOrigin(0.5);
    container.add(icon);

    const name = this.add.text(0, 5, skill.name, {
      fontFamily: 'Segoe UI',
      fontSize: '18px',
      color: '#f8fafc',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(name);

    const desc = this.add.text(0, 32, skill.description, {
      fontFamily: 'Segoe UI',
      fontSize: '12px',
      color: '#94a3b8',
      align: 'center',
      wordWrap: { width: width - 30 }
    }).setOrigin(0.5);
    container.add(desc);

    const cooldown = this.add.text(0, 60, `冷却: ${skill.cooldown}秒`, {
      fontFamily: 'Segoe UI',
      fontSize: '13px',
      color: '#f59e0b'
    }).setOrigin(0.5);
    container.add(cooldown);

    if (isSelected) {
      const selectedMark = this.add.text(0, 85, '✓ 已选择', {
        fontFamily: 'Segoe UI',
        fontSize: '13px',
        color: '#4ade80',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      container.add(selectedMark);
    }

    const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x334155, 0.95);
      if (this.selectedSkill === skillType) {
        bg.lineStyle(3, 0x4fd1c5, 1);
      } else {
        bg.lineStyle(2, 0x64748b, 1);
      }
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    });

    hitArea.on('pointerout', () => {
      this.drawCardBg(bg, width, height, this.selectedSkill === skillType);
    });

    hitArea.on('pointerdown', () => {
      this.selectedSkill = skillType;
      this.storage.setSelectedSkill(skillType);
      this.refreshSkillCards();
    });

    this.skillCards.push(container);
  }

  private drawCardBg(bg: Phaser.GameObjects.Graphics, width: number, height: number, isSelected: boolean): void {
    bg.clear();
    if (isSelected) {
      bg.fillStyle(0x4fd1c5, 0.2);
      bg.lineStyle(3, 0x4fd1c5, 1);
    } else {
      bg.fillStyle(0x1e293b, 0.9);
      bg.lineStyle(2, 0x475569, 0.8);
    }
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
  }

  private refreshSkillCards(): void {
    this.skillCards.forEach(card => card.destroy());
    this.skillCards = [];
    this.createSkillCards();
  }

  private createStartButton(): void {
    const startBtn = this.add.rectangle(480, 460, 260, 50, 0x4fd1c5, 0.9);
    startBtn.setStrokeStyle(2, 0x4fd1c5, 0.8);
    startBtn.setInteractive({ useHandCursor: true });

    this.add.text(480, 460, '🚀 开始生存', {
      fontFamily: 'Segoe UI',
      fontSize: '20px',
      color: '#081019',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    startBtn.on('pointerover', () => startBtn.setFillStyle(0x5eead4, 1));
    startBtn.on('pointerout', () => startBtn.setFillStyle(0x4fd1c5, 0.9));

    startBtn.on('pointerdown', () => {
      GameStateManager.getInstance().startSurvivalSession(this.selectedSkill);
      this.scene.start('survival-game-scene');
    });
  }
}
