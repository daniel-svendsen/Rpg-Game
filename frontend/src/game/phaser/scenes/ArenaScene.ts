import Phaser from "phaser";
import type { ArenaEnemyState, ArenaSnapshot, SpellVisualEvent } from "../../../shared/types/saveTypes";
import {
  FALLBACK_MONSTER_CONFIG,
  FX_ANIMS,
  FX_SHEET,
  MONSTER_SPRITE_CONFIG,
  PLAYER_SPRITE_CONFIG,
  SPRITE_BASE_PATH,
  type MonsterSpriteConfig
} from "../spriteConfig";

const ARENA_WIDTH = 2000;
const ARENA_HEIGHT = 1400;

export class ArenaScene extends Phaser.Scene {
  private latestSnapshot: ArenaSnapshot | null = null;
  private playerSprite?: Phaser.GameObjects.Sprite;
  private enemySprites = new Map<string, Phaser.GameObjects.Sprite>();
  private enemyHealthBars = new Map<string, Phaser.GameObjects.Rectangle>();
  private floatingTexts = new Map<string, Phaser.GameObjects.Text>();
  private processedSpellEventIds = new Set<string>();
  private background?: Phaser.GameObjects.TileSprite;

  constructor() {
    super("ArenaScene");
  }

  setSnapshot(snapshot: ArenaSnapshot): void {
    this.latestSnapshot = snapshot;
    this.renderSnapshot();
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  preload(): void {
    // Load effect spritesheet
    this.load.spritesheet(FX_SHEET.key, FX_SHEET.path, {
      frameWidth: FX_SHEET.frameWidth,
      frameHeight: FX_SHEET.frameHeight
    });

    // Load player sprite frames
    for (let i = 0; i < PLAYER_SPRITE_CONFIG.idleFrameCount; i++) {
      this.load.image(
        `${PLAYER_SPRITE_CONFIG.spriteName}-idle-${i}`,
        `${SPRITE_BASE_PATH}/${PLAYER_SPRITE_CONFIG.spriteName}_idle_anim_f${i}.png`
      );
    }

    // Load individual frames for each monster type used in the config
    const loaded = new Set<string>();
    const allConfigs = [
      ...Object.values(MONSTER_SPRITE_CONFIG),
      FALLBACK_MONSTER_CONFIG
    ];

    for (const cfg of allConfigs) {
      if (loaded.has(cfg.spriteName)) continue;
      loaded.add(cfg.spriteName);
      for (let i = 0; i < cfg.idleFrameCount; i++) {
        this.load.image(
          `${cfg.spriteName}-idle-${i}`,
          `${SPRITE_BASE_PATH}/${cfg.spriteName}_idle_anim_f${i}.png`
        );
      }
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#050a12");
    this.cameras.main.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    this.generateBackground();
    this.createAnimations();

    this.add.rectangle(1000, 700, 1920, 1320, 0x0b1220, 0).setStrokeStyle(2, 0x1f2937);

    const pcfg = PLAYER_SPRITE_CONFIG;
    const playerAnimKey = `${pcfg.spriteName}-idle`;
    if (!this.anims.exists(playerAnimKey)) {
      this.anims.create({
        key: playerAnimKey,
        frames: Array.from({ length: pcfg.idleFrameCount }, (_, i) => ({
          key: `${pcfg.spriteName}-idle-${i}`
        })),
        frameRate: 8,
        repeat: -1
      });
    }

    this.playerSprite = this.add
      .sprite(1000, 700, `${pcfg.spriteName}-idle-0`)
      .setScale(pcfg.scale)
      .setDepth(10);

    if (this.anims.exists(playerAnimKey)) {
      this.playerSprite.play(playerAnimKey);
    }

    this.cameras.main.startFollow(this.playerSprite, true, 0.08, 0.08);
    this.renderSnapshot();
  }

  update(): void {
    if (!this.background) return;
    const camera = this.cameras.main;
    this.background.tilePositionX = camera.scrollX;
    this.background.tilePositionY = camera.scrollY;
  }

  // ─── Background ────────────────────────────────────────────────────────────

  private generateBackground(): void {
    const brickKey = "arena-bricks";
    if (this.textures.exists(brickKey)) {
      this.background = this.add
        .tileSprite(0, 0, ARENA_WIDTH, ARENA_HEIGHT, brickKey)
        .setOrigin(0, 0)
        .setDepth(-10);
      return;
    }

    const tileSize = 128;
    const brickWidth = 44;
    const brickHeight = 22;
    const mortar = 3;
    const brickColorBase = 0x111827;
    const mortarColor = 0x1f2937;

    const gfx = this.add.graphics();
    gfx.fillStyle(0x0b1220, 1);
    gfx.fillRect(0, 0, tileSize, tileSize);

    const rowCount = Math.ceil(tileSize / brickHeight) + 1;
    const colCount = Math.ceil(tileSize / brickWidth) + 1;

    for (let row = 0; row < rowCount; row += 1) {
      const y = row * brickHeight;
      const offset = row % 2 === 0 ? 0 : Math.floor(brickWidth / 2);
      for (let col = 0; col < colCount; col += 1) {
        const x = col * brickWidth - offset;
        const variation = (row * 17 + col * 31) % 12;
        const tint = brickColorBase + variation * 0x020202;
        gfx.fillStyle(tint, 1);
        gfx.fillRect(
          x + mortar, y + mortar,
          Math.max(0, brickWidth - mortar * 2),
          Math.max(0, brickHeight - mortar * 2)
        );
      }
    }

    gfx.lineStyle(1, mortarColor, 0.8);
    for (let y = 0; y <= tileSize; y += brickHeight) gfx.lineBetween(0, y, tileSize, y);
    for (let x = 0; x <= tileSize; x += brickWidth / 2) gfx.lineBetween(x, 0, x, tileSize);

    gfx.generateTexture(brickKey, tileSize, tileSize);
    gfx.destroy();

    this.background = this.add
      .tileSprite(0, 0, ARENA_WIDTH, ARENA_HEIGHT, brickKey)
      .setOrigin(0, 0)
      .setDepth(-10);
  }

  // ─── Animation definitions ──────────────────────────────────────────────────

  private createAnimations(): void {
    // Effect animations from the Gizmo sheet
    for (const anim of Object.values(FX_ANIMS)) {
      if (this.anims.exists(anim.key)) continue;
      const frames = Array.from({ length: anim.frameCount }, (_, i) => ({
        key: FX_SHEET.key,
        frame: anim.startFrame + i
      }));
      this.anims.create({ key: anim.key, frames, frameRate: anim.frameRate, repeat: 0 });
    }

    // Idle animations for each monster sprite
    const done = new Set<string>();
    const allConfigs = [...Object.values(MONSTER_SPRITE_CONFIG), FALLBACK_MONSTER_CONFIG];

    for (const cfg of allConfigs) {
      const animKey = `${cfg.spriteName}-idle`;
      if (done.has(animKey) || this.anims.exists(animKey)) { done.add(animKey); continue; }
      done.add(animKey);

      const frames = Array.from({ length: cfg.idleFrameCount }, (_, i) => ({
        key: `${cfg.spriteName}-idle-${i}`
      }));
      this.anims.create({ key: animKey, frames, frameRate: 8, repeat: -1 });
    }
  }

  // ─── Snapshot rendering ─────────────────────────────────────────────────────

  private renderSnapshot(): void {
    if (!this.latestSnapshot || !this.playerSprite) return;

    this.playerSprite.setPosition(this.latestSnapshot.playerX, this.latestSnapshot.playerY);

    const activeIds = new Set<string>();

    for (const enemy of this.latestSnapshot.enemies) {
      activeIds.add(enemy.id);

      let sprite = this.enemySprites.get(enemy.id);
      if (!sprite) {
        sprite = this.createEnemySprite(enemy);
        this.enemySprites.set(enemy.id, sprite);
      }

      const cfg = this.getSpriteConfig(enemy.monsterTypeId);
      let bar = this.enemyHealthBars.get(enemy.id);
      if (!bar) {
        bar = this.add.rectangle(enemy.x, enemy.y + cfg.healthBarOffsetY, 36, 4, 0x22c55e).setDepth(6);
        this.enemyHealthBars.set(enemy.id, bar);
      }

      sprite.setPosition(enemy.x, enemy.y);
      bar.setPosition(enemy.x, enemy.y + cfg.healthBarOffsetY);
      bar.setDisplaySize((enemy.health / enemy.maxHealth) * 36, 4);
    }

    // Clean up dead enemies with death animation
    for (const [id, sprite] of this.enemySprites) {
      if (activeIds.has(id)) continue;
      this.enemySprites.delete(id);

      const bar = this.enemyHealthBars.get(id);
      if (bar) { bar.destroy(); this.enemyHealthBars.delete(id); }

      sprite.stop();
      this.tweens.add({
        targets: sprite,
        scale: sprite.scale * 1.8,
        alpha: 0,
        duration: 280,
        ease: "Quad.easeOut",
        onComplete: () => { sprite.destroy(); }
      });
    }

    // Floating damage text
    for (const entry of this.latestSnapshot.floatingTexts) {
      if (this.floatingTexts.has(entry.id)) continue;
      const isCrit = entry.text.startsWith("Crit");
      const text = this.add.text(entry.x, entry.y, entry.text, {
        color: isCrit ? "#fcd34d" : "#fef3c7",
        fontSize: isCrit ? "16px" : "14px"
      }).setDepth(20);
      this.tweens.add({
        targets: text,
        y: entry.y - 32,
        alpha: 0,
        duration: 700,
        onComplete: () => { text.destroy(); this.floatingTexts.delete(entry.id); }
      });
      this.floatingTexts.set(entry.id, text);
    }

    // Spell visual events — process each only once
    for (const event of this.latestSnapshot.spellEvents) {
      if (this.processedSpellEventIds.has(event.id)) continue;
      this.processedSpellEventIds.add(event.id);
      this.animateSpellEvent(event);
    }
  }

  private getSpriteConfig(monsterTypeId: string): MonsterSpriteConfig {
    return MONSTER_SPRITE_CONFIG[monsterTypeId] ?? FALLBACK_MONSTER_CONFIG;
  }

  private createEnemySprite(enemy: ArenaEnemyState): Phaser.GameObjects.Sprite {
    const cfg = this.getSpriteConfig(enemy.monsterTypeId);
    const animKey = `${cfg.spriteName}-idle`;
    const firstFrameKey = `${cfg.spriteName}-idle-0`;

    const sprite = this.add
      .sprite(enemy.x, enemy.y, firstFrameKey)
      .setScale(cfg.scale)
      .setDepth(5);

    if (this.anims.exists(animKey)) {
      sprite.play(animKey);
    }

    return sprite;
  }

  // ─── Spell animations ───────────────────────────────────────────────────────

  private animateSpellEvent(event: SpellVisualEvent): void {
    if (event.chainPositions.length === 0) return;

    const isArea = event.areaRadius > 0;
    const isProjectile = event.tags.includes("Projectile") && !event.tags.includes("Chain");

    if (isArea) {
      this.animateAreaExplosion(event);
    } else if (isProjectile) {
      this.animateProjectileLance(event);
    } else {
      this.animateLightningChain(event);
    }
  }

  private animateProjectileLance(event: SpellVisualEvent): void {
    const target = event.chainPositions[0];
    if (!target) return;

    const isLightning = event.tags.includes("Lightning");
    const isCold = event.tags.includes("Cold");
    const color = isLightning ? 0xfbbf24 : isCold ? 0x38bdf8 : 0xa78bfa;

    const gfx = this.add.graphics().setDepth(12);

    const drawLine = (width: number, col: number, alpha: number) => {
      gfx.lineStyle(width, col, alpha);
      gfx.beginPath();
      gfx.moveTo(event.originX, event.originY);
      gfx.lineTo(target.x, target.y);
      gfx.strokePath();
    };

    drawLine(10, color, 0.15);
    drawLine(4, color, 0.7);
    drawLine(1.5, 0xffffff, 1.0);

    this.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 200,
      ease: "Quad.easeIn",
      onComplete: () => { gfx.destroy(); }
    });

    this.spawnFxSprite(target.x, target.y, FX_ANIMS.electric.key, 3.0);
  }

  private animateLightningChain(event: SpellVisualEvent): void {
    const isLightning = event.tags.includes("Lightning");
    const isCold = event.tags.includes("Cold");
    const boltColor = isLightning ? 0xfbbf24 : isCold ? 0x38bdf8 : 0xa78bfa;
    const fxAnim = isCold ? FX_ANIMS.ice.key : FX_ANIMS.electric.key;

    const positions = [{ x: event.originX, y: event.originY }, ...event.chainPositions];

    for (let i = 0; i < positions.length - 1; i++) {
      this.time.delayedCall(i * 85, () => {
        const from = positions[i];
        const to = positions[i + 1];
        if (!from || !to) return;
        this.drawLightningBolt(from.x, from.y, to.x, to.y, boltColor);
        this.spawnFxSprite(to.x, to.y, fxAnim, 3.0);
      });
    }
  }

  private animateAreaExplosion(event: SpellVisualEvent): void {
    const isFire = event.tags.includes("Fire");
    const isCold = event.tags.includes("Cold");
    const target = event.chainPositions[0];
    if (!target) return;

    const fxAnim = isCold ? FX_ANIMS.ice.key : isFire ? FX_ANIMS.fire.key : FX_ANIMS.electric.key;
    const boltColor = isFire ? 0xf97316 : isCold ? 0x38bdf8 : 0xa78bfa;
    const radius = Math.max(event.areaRadius, 30);

    // Sprite effect at center
    this.spawnFxSprite(target.x, target.y, fxAnim, 4.0);

    // Procedural ring to show actual area radius
    const gfx = this.add.graphics().setDepth(12);
    gfx.lineStyle(2, boltColor, 0.7);
    gfx.strokeCircle(target.x, target.y, radius);
    gfx.fillStyle(boltColor, 0.1);
    gfx.fillCircle(target.x, target.y, radius);
    this.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 500,
      ease: "Quad.easeIn",
      onComplete: () => { gfx.destroy(); }
    });
  }

  // Spawns a one-shot effect sprite that destroys itself when the animation ends
  private spawnFxSprite(x: number, y: number, animKey: string, scale: number): void {
    if (!this.anims.exists(animKey)) return;

    const sprite = this.add
      .sprite(x, y, FX_SHEET.key, 0)
      .setScale(scale)
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.ADD);

    sprite.play(animKey);
    sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { sprite.destroy(); });
  }

  // Procedural jagged lightning bolt — kept intentionally to show chain path
  private drawLightningBolt(x1: number, y1: number, x2: number, y2: number, color: number): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const perpX = -dy / len;
    const perpY = dx / len;
    const maxOffset = Math.min(len * 0.22, 22);
    const segments = 6;

    const pts: Array<{ x: number; y: number }> = [{ x: x1, y: y1 }];
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const offset = (Math.random() - 0.5) * 2 * maxOffset;
      pts.push({ x: x1 + dx * t + perpX * offset, y: y1 + dy * t + perpY * offset });
    }
    pts.push({ x: x2, y: y2 });

    const gfx = this.add.graphics().setDepth(12);

    const drawPath = (width: number, col: number, alpha: number) => {
      gfx.lineStyle(width, col, alpha);
      gfx.beginPath();
      gfx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) gfx.lineTo(pts[i].x, pts[i].y);
      gfx.strokePath();
    };

    drawPath(7, color, 0.2);
    drawPath(3, color, 0.6);
    drawPath(1.5, 0xffffff, 1.0);

    this.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 380,
      ease: "Quad.easeIn",
      onComplete: () => { gfx.destroy(); }
    });
  }
}
