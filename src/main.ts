import Phaser from "phaser";

class SkylineScene extends Phaser.Scene {
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super("skyline-scene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#081019");

    this.add.rectangle(480, 270, 960, 540, 0x081019);
    this.add.text(44, 34, "霓虹跃迁", {
      fontFamily: "Segoe UI",
      fontSize: "34px",
      color: "#f8fafc"
    });

    this.add.text(44, 78, "在光球消失前完成点击，持续累积分数。", {
      fontFamily: "Segoe UI",
      fontSize: "18px",
      color: "#9fb3c8"
    });

    this.scoreText = this.add.text(760, 38, "分数：0", {
      fontFamily: "Segoe UI",
      fontSize: "26px",
      color: "#f59e0b"
    });

    this.spawnOrb();
    this.time.addEvent({
      delay: 1200,
      loop: true,
      callback: () => this.spawnOrb()
    });
  }

  private spawnOrb() {
    const x = Phaser.Math.Between(120, 840);
    const y = Phaser.Math.Between(140, 470);
    const orb = this.add.circle(x, y, 18, 0x4fd1c5, 0.95);
    orb.setStrokeStyle(5, 0xffa94d, 0.9);
    orb.setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: orb,
      scale: { from: 0.75, to: 1.2 },
      alpha: { from: 0.9, to: 0.2 },
      duration: 900,
      yoyo: true,
      repeat: -1
    });

    orb.on("pointerdown", () => {
      this.score += 10;
      this.scoreText.setText(`分数：${this.score}`);
      this.tweens.killTweensOf(orb);
      orb.destroy();
    });

    this.time.delayedCall(3500, () => {
      if (orb.active) {
        this.tweens.killTweensOf(orb);
        orb.destroy();
      }
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  width: 960,
  height: 540,
  backgroundColor: "#081019",
  scene: SkylineScene,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
});
