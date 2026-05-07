import Phaser from "phaser";
import type { ArenaSnapshot } from "../../../shared/types/saveTypes";

const ARENA_WIDTH = 2000;
const ARENA_HEIGHT = 1400;

export class ArenaScene extends Phaser.Scene {
  private latestSnapshot: ArenaSnapshot | null = null;
  private playerCircle?: Phaser.GameObjects.Arc;
  private enemyCircles = new Map<string, Phaser.GameObjects.Arc>();
  private enemyHealthBars = new Map<string, Phaser.GameObjects.Rectangle>();
  private floatingTexts = new Map<string, Phaser.GameObjects.Text>();
  private background?: Phaser.GameObjects.TileSprite;

  constructor() {
    super("ArenaScene");
  }

  setSnapshot(snapshot: ArenaSnapshot): void {
    this.latestSnapshot = snapshot;
    this.renderSnapshot();
  }

  update(): void {
    if (!this.background) {
      return;
    }

    const camera = this.cameras.main;
    this.background.tilePositionX = camera.scrollX;
    this.background.tilePositionY = camera.scrollY;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#050a12");
    this.cameras.main.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    const gridKey = "arena-grid";

    if (!this.textures.exists(gridKey)) {
      const gridSize = 96;
      const grid = this.add.graphics();
      grid.fillStyle(0x0b1220, 1);
      grid.fillRect(0, 0, gridSize, gridSize);
      grid.lineStyle(1, 0x1f2937, 0.55);
      grid.strokeRect(0, 0, gridSize, gridSize);
      grid.lineStyle(1, 0x111827, 0.35);
      grid.beginPath();
      grid.moveTo(gridSize / 2, 0);
      grid.lineTo(gridSize / 2, gridSize);
      grid.moveTo(0, gridSize / 2);
      grid.lineTo(gridSize, gridSize / 2);
      grid.strokePath();
      grid.generateTexture(gridKey, gridSize, gridSize);
      grid.destroy();
    }

    this.background = this.add
      .tileSprite(0, 0, ARENA_WIDTH, ARENA_HEIGHT, gridKey)
      .setOrigin(0, 0)
      .setDepth(-10);

    this.add.rectangle(1000, 700, 1920, 1320, 0x0b1220, 0).setStrokeStyle(2, 0x1f2937);
    this.playerCircle = this.add.circle(1000, 700, 18, 0xf59e0b).setDepth(10);
    this.cameras.main.startFollow(this.playerCircle, true, 0.08, 0.08);
    this.renderSnapshot();
  }

  private renderSnapshot(): void {
    if (!this.latestSnapshot || !this.playerCircle) {
      return;
    }

    this.playerCircle.setPosition(this.latestSnapshot.playerX, this.latestSnapshot.playerY);

    const activeEnemyIds = new Set<string>();

    this.latestSnapshot.enemies.forEach((enemy) => {
      activeEnemyIds.add(enemy.id);

      let enemyCircle = this.enemyCircles.get(enemy.id);
      let healthBar = this.enemyHealthBars.get(enemy.id);

      if (!enemyCircle) {
        enemyCircle = this.add.circle(
          enemy.x,
          enemy.y,
          enemy.rarity === "Rare" ? 20 : 16,
          enemy.rarity === "Rare" ? 0xa855f7 : 0xef4444
        );
        this.enemyCircles.set(enemy.id, enemyCircle);
      }

      if (!healthBar) {
        healthBar = this.add.rectangle(enemy.x, enemy.y - 24, 34, 4, 0x22c55e);
        this.enemyHealthBars.set(enemy.id, healthBar);
      }

      enemyCircle.setPosition(enemy.x, enemy.y);
      healthBar.setPosition(enemy.x, enemy.y - 24);
      healthBar.setDisplaySize((enemy.health / enemy.maxHealth) * 34, 4);
    });

    [...this.enemyCircles.entries()].forEach(([enemyId, enemyCircle]) => {
      if (activeEnemyIds.has(enemyId)) {
        return;
      }

      enemyCircle.destroy();
      this.enemyCircles.delete(enemyId);

      const healthBar = this.enemyHealthBars.get(enemyId);

      if (healthBar) {
        healthBar.destroy();
        this.enemyHealthBars.delete(enemyId);
      }
    });

    this.latestSnapshot.floatingTexts.forEach((entry) => {
      const existing = this.floatingTexts.get(entry.id);

      if (existing) {
        return;
      }

      const text = this.add.text(entry.x, entry.y, entry.text, {
        color: "#fef3c7",
        fontSize: "14px"
      });

      this.tweens.add({
        targets: text,
        y: entry.y - 24,
        alpha: 0,
        duration: 650,
        onComplete: () => {
          text.destroy();
          this.floatingTexts.delete(entry.id);
        }
      });

      this.floatingTexts.set(entry.id, text);
    });
  }
}
