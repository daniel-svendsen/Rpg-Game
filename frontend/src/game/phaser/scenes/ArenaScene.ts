import Phaser from "phaser";
import type { ArenaEnemyState, ArenaSnapshot, MonsterSpellVisualEvent, SpellVisualEvent } from "../../../shared/types/saveTypes";
import {
  FALLBACK_MONSTER_CONFIG,
  FX_ANIMS,
  FX_SHEETS,
  MAP_TILE_THEMES,
  MONSTER_SPRITE_CONFIG,
  PLAYER_SPRITE_CONFIG,
  SPRITE_BASE_PATH,
  type MonsterSpriteConfig
} from "../spriteConfig";

const ARENA_WIDTH = 2000;
const ARENA_HEIGHT = 1400;
type ArenaGroundLoot = ArenaSnapshot["groundLoot"][number];

export class ArenaScene extends Phaser.Scene {
  private latestSnapshot: ArenaSnapshot | null = null;
  private playerSprite?: Phaser.GameObjects.Sprite;
  private enemySprites = new Map<string, Phaser.GameObjects.Sprite>();
  private enemyHealthBars = new Map<string, Phaser.GameObjects.Rectangle>();
  private groundLootObjects = new Map<string, Phaser.GameObjects.Container>();
  private floatingTexts = new Map<string, Phaser.GameObjects.Text>();
  private processedSpellEventIds = new Set<string>();
  private processedMonsterSpellEventIds = new Set<string>();
  private background?: Phaser.GameObjects.TileSprite;
  private readonly mapTileTheme = MAP_TILE_THEMES[Math.floor(Math.random() * MAP_TILE_THEMES.length)];

  constructor() {
    super("ArenaScene");
  }

  setSnapshot(snapshot: ArenaSnapshot): void {
    this.latestSnapshot = snapshot;
    this.renderSnapshot();
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  preload(): void {
    // Load all new effect spritesheets (64x64 files)
    for (const sheet of Object.values(FX_SHEETS)) {
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight
      });
    }

    // Load player sprite
    const pcfgPreload = PLAYER_SPRITE_CONFIG;
    if (pcfgPreload.monsterSheet) {
      this.load.spritesheet(`player-sheet`, `/assets/monsters/${pcfgPreload.spriteName}.png`, {
        frameWidth: pcfgPreload.frameWidth,
        frameHeight: pcfgPreload.frameHeight
      });
    } else {
      for (let i = 0; i < pcfgPreload.idleFrameCount; i++) {
        this.load.image(
          `${pcfgPreload.spriteName}-idle-${i}`,
          `${SPRITE_BASE_PATH}/${pcfgPreload.spriteName}_idle_anim_f${i}.png`
        );
      }
    }

    // Load selected map tile theme (chosen once at scene creation)
    this.load.image(`maptile-${this.mapTileTheme}`, `/assets/maptiles/${this.mapTileTheme}.webp`);

    // Load monster spritesheets (80x80 files from assets/monsters/)
    const loaded = new Set<string>();
    const allConfigs = [
      ...Object.values(MONSTER_SPRITE_CONFIG),
      FALLBACK_MONSTER_CONFIG
    ];

    for (const cfg of allConfigs) {
      if (loaded.has(cfg.spriteName)) continue;
      if (cfg.spriteName === PLAYER_SPRITE_CONFIG.spriteName) {
        console.error(`Monster sprite "${cfg.spriteName}" conflicts with player sprite — assign a different spriteName.`);
        continue;
      }
      loaded.add(cfg.spriteName);
      this.load.spritesheet(`monster-${cfg.spriteName}`, `/assets/monsters/${cfg.spriteName}.png`, {
        frameWidth: cfg.frameWidth,
        frameHeight: cfg.frameHeight
      });
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#050a12");
    this.cameras.main.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    this.generateBackground();
    this.createAnimations();

    this.add.rectangle(1000, 700, 1920, 1320, 0x0b1220, 0).setStrokeStyle(2, 0x1f2937);

    const pcfg = PLAYER_SPRITE_CONFIG;
    const playerAnimKey = `player-idle`;
    if (!this.anims.exists(playerAnimKey)) {
      if (pcfg.monsterSheet) {
        this.anims.create({
          key: playerAnimKey,
          frames: this.anims.generateFrameNumbers("player-sheet", { start: 0, end: pcfg.idleFrameCount - 1 }),
          frameRate: 8,
          repeat: -1
        });
      } else {
        this.anims.create({
          key: playerAnimKey,
          frames: Array.from({ length: pcfg.idleFrameCount }, (_, i) => ({
            key: `${pcfg.spriteName}-idle-${i}`
          })),
          frameRate: 8,
          repeat: -1
        });
      }
    }

    this.playerSprite = this.add
      .sprite(1000, 700, pcfg.monsterSheet ? "player-sheet" : `${pcfg.spriteName}-idle-0`, 0)
      .setScale(pcfg.scale)
      .setDepth(10);

    if (this.anims.exists(playerAnimKey)) {
      this.playerSprite.play(playerAnimKey);
    }

    this.cameras.main.setZoom(2);
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
    const tileKey = `maptile-${this.mapTileTheme}`;
    if (this.textures.exists(tileKey)) {
      this.background = this.add
        .tileSprite(0, 0, ARENA_WIDTH, ARENA_HEIGHT, tileKey)
        .setOrigin(0, 0)
        .setTileScale(0.25, 0.25)
        .setDepth(-10);
      return;
    }

    // Fallback: procedurally generated brick pattern
    const brickKey = "arena-bricks";
    if (!this.textures.exists(brickKey)) {
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
    }

    this.background = this.add
      .tileSprite(0, 0, ARENA_WIDTH, ARENA_HEIGHT, brickKey)
      .setOrigin(0, 0)
      .setDepth(-10);
  }

  // ─── Animation definitions ──────────────────────────────────────────────────

  private createAnimations(): void {
    // Effect animations from new effect spritesheets
    for (const anim of Object.values(FX_ANIMS)) {
      if (this.anims.exists(anim.key)) continue;
      const sheetKey = (anim as any).sheet; // Reference to sheet key in FX_SHEETS
      if (!sheetKey) continue;
      const frames = Array.from({ length: anim.frameCount }, (_, i) => ({
        key: sheetKey,
        frame: anim.startFrame + i
      }));
      this.anims.create({ key: anim.key, frames, frameRate: anim.frameRate, repeat: 0 });
    }

    // Idle animations for each monster sprite (all now from assets/monsters/ spritesheets)
    const done = new Set<string>();
    const allConfigs = [...Object.values(MONSTER_SPRITE_CONFIG), FALLBACK_MONSTER_CONFIG];

    for (const cfg of allConfigs) {
      const animKey = `${cfg.spriteName}-idle`;
      if (done.has(animKey) || this.anims.exists(animKey)) { done.add(animKey); continue; }
      done.add(animKey);

      const spriteSheetKey = `monster-${cfg.spriteName}`;
      const frames = Array.from({ length: cfg.idleFrameCount }, (_, i) => ({
        key: spriteSheetKey,
        frame: i
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

    this.renderGroundLoot();

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

    // Monster spell visual events
    for (const event of this.latestSnapshot.monsterSpellEvents) {
      if (this.processedMonsterSpellEventIds.has(event.id)) continue;
      this.processedMonsterSpellEventIds.add(event.id);
      this.animateMonsterSpellEvent(event);
    }
  }

  private getSpriteConfig(monsterTypeId: string): MonsterSpriteConfig {
    return MONSTER_SPRITE_CONFIG[monsterTypeId] ?? FALLBACK_MONSTER_CONFIG;
  }

  private createEnemySprite(enemy: ArenaEnemyState): Phaser.GameObjects.Sprite {
    const cfg = this.getSpriteConfig(enemy.monsterTypeId);
    const animKey = `${cfg.spriteName}-idle`;
    const spriteSheetKey = `monster-${cfg.spriteName}`;

    const sprite = this.add
      .sprite(enemy.x, enemy.y, spriteSheetKey, 0)
      .setScale(cfg.scale)
      .setDepth(5);

    if (this.anims.exists(animKey)) {
      sprite.play(animKey);
    }

    return sprite;
  }

  // ─── Spell animations ───────────────────────────────────────────────────────

  private renderGroundLoot(): void {
    if (!this.latestSnapshot) return;

    const activeLootIds = new Set<string>();

    for (const loot of this.latestSnapshot.groundLoot) {
      activeLootIds.add(loot.id);
      let object = this.groundLootObjects.get(loot.id);

      if (!object) {
        object = this.createGroundLootObject(loot);
        this.groundLootObjects.set(loot.id, object);
      }

      object.setPosition(loot.x, loot.y);
    }

    for (const [id, object] of this.groundLootObjects) {
      if (activeLootIds.has(id)) continue;
      this.groundLootObjects.delete(id);
      this.tweens.add({
        targets: object,
        scale: 1.35,
        alpha: 0,
        duration: 160,
        ease: "Quad.easeOut",
        onComplete: () => { object.destroy(); }
      });
    }
  }

  private createGroundLootObject(loot: ArenaGroundLoot): Phaser.GameObjects.Container {
    const color = this.getGroundLootColor(loot);
    const container = this.add.container(loot.x, loot.y).setDepth(4);

    if (loot.beam) {
      const beamColor = loot.beam === "Chase" ? 0xb47cff : color;
      const beam = this.add.rectangle(0, -48, 10, 88, beamColor, 0.34)
        .setBlendMode(Phaser.BlendModes.ADD);
      const beamCore = this.add.rectangle(0, -48, 3, 92, 0xffffff, 0.28)
        .setBlendMode(Phaser.BlendModes.ADD);
      const beamGlow = this.add.ellipse(0, -90, 28, 12, beamColor, 0.22)
        .setBlendMode(Phaser.BlendModes.ADD);
      container.add([beam, beamCore, beamGlow]);

      this.tweens.add({
        targets: [beam, beamCore, beamGlow],
        alpha: { from: 0.22, to: 0.52 },
        duration: loot.beam === "Chase" ? 520 : 700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    }

    const shadow = this.add.ellipse(0, 8, 24, 10, 0x000000, 0.38);
    const glow = this.add.ellipse(0, 0, loot.beam ? 28 : 20, loot.beam ? 18 : 12, color, loot.beam ? 0.28 : 0.16)
      .setBlendMode(Phaser.BlendModes.ADD);
    const item = this.add.polygon(0, -1, [0, -10, 10, 0, 0, 10, -10, 0], color, 1)
      .setStrokeStyle(2, 0xfef3c7, loot.beam ? 0.82 : 0.48);

    container.add([shadow, glow, item]);

    this.tweens.add({
      targets: item,
      y: -4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    return container;
  }

  private getGroundLootColor(loot: ArenaGroundLoot): number {
    if (loot.beam === "Chase") return 0xb47cff;
    if (loot.kind === "Spell" || loot.kind === "Support") return 0x86efac;

    if (loot.rarity === "Unique") return 0xffb172;
    if (loot.rarity === "Rare") return 0xffd879;
    if (loot.rarity === "Magic") return 0x9fd5ff;
    if (loot.rarity === "Normal") return 0xbba990;

    if (loot.kind === "Currency") return 0x67e8f9;
    if (loot.kind === "Map") return 0x86efac;

    return 0xfef3c7;
  }

  private animateSpellEvent(event: SpellVisualEvent): void {
    if (event.chainPositions.length === 0) return;
    const impactAnim = this.getSpellFxAnim(event.spellId, event.tags);
    const orbAnim = this.getOrbFxAnim(event.tags);
    const impactScale = this.fxScale(event.areaRadius, 0.5);

    if (event.stage === "primary") {
      const primaryTarget = event.chainPositions[0];
      if (!primaryTarget) return;
      this.spawnTravelingFx(
        event.originX,
        event.originY,
        primaryTarget.x,
        primaryTarget.y,
        orbAnim,
        impactAnim,
        impactScale,
        0
      );
      return;
    }

    let fromX = event.originX;
    let fromY = event.originY;
    event.chainPositions.forEach((target, index) => {
      this.spawnTravelingFx(
        fromX,
        fromY,
        target.x,
        target.y,
        orbAnim,
        impactAnim,
        impactScale,
        index * 50
      );
      fromX = target.x;
      fromY = target.y;
    });
  }

  private getSpellFxAnim(spellId: string, tags: string[]): string {
    const byId: Record<string, string> = {
      stormChain: FX_ANIMS.stormChain.key,
      emberBurst: FX_ANIMS.emberBurst.key,
      glacierNova: FX_ANIMS.glacierNova.key,
      arcLance: FX_ANIMS.arcLance.key,
      ashenOrbit: FX_ANIMS.ashenOrbit.key,
      tempestBloom: FX_ANIMS.tempestBloom.key,
      monsterSlash: FX_ANIMS.monsterSlash.key,
      monsterFireBurst: FX_ANIMS.monsterFireBurst.key,
      monsterFrostBolt: FX_ANIMS.monsterFrostBolt.key,
      monsterLightningStrike: FX_ANIMS.monsterLightningStrike.key
    };
    const fromId = byId[spellId];
    if (fromId) return fromId;

    const isLightning = tags.includes("Lightning");
    const isCold = tags.includes("Cold");
    const isFire = tags.includes("Fire");

    if (isLightning) {
      return FX_ANIMS.stormChain.key;
    }

    if (isCold) {
      return FX_ANIMS.glacierNova.key;
    }

    if (isFire) {
      return FX_ANIMS.emberBurst.key;
    }

    return FX_ANIMS.stormChain.key;
  }

  private animateMonsterSpellEvent(event: MonsterSpellVisualEvent): void {
    const impactAnim = this.getSpellFxAnim(event.spellId, event.tags);
    const orbAnim = this.getOrbFxAnim(event.tags);
    this.spawnTravelingFx(
      event.originX,
      event.originY,
      event.targetX,
      event.targetY,
      orbAnim,
      impactAnim,
      this.fxScale(event.areaRadius, 0.6),
      0
    );
  }

  private getOrbFxAnim(tags: string[]): string {
    if (tags.includes("Lightning")) return FX_ANIMS.orbLightning.key;
    if (tags.includes("Cold")) return FX_ANIMS.orbCold.key;
    if (tags.includes("Fire")) return FX_ANIMS.orbFire.key;
    return FX_ANIMS.orbLightning.key;
  }

  // Returns FX sprite scale: if the spell has an area radius, size the sprite to match it.
  // For projectiles/chain with no area, uses the provided fallback scale.
  private fxScale(areaRadius: number, fallback: number): number {
    return areaRadius > 0 ? Math.max(0.6, areaRadius / 32) : fallback;
  }

  private spawnTravelingFx(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    orbAnimKey: string,
    impactAnimKey: string,
    impactScale: number,
    delayMs: number
  ): void {
    this.time.delayedCall(delayMs, () => {
      if (!this.anims.exists(orbAnimKey)) return;

      const anim = Object.values(FX_ANIMS).find((entry) => entry.key === orbAnimKey) as any;
      const sheetKey = anim?.sheet || Object.values(FX_SHEETS)[0].key;
      const sprite = this.add
        .sprite(fromX, fromY, sheetKey, 0)
        .setScale(0.45)
        .setDepth(15)
        .setBlendMode(Phaser.BlendModes.ADD);

      sprite.play(orbAnimKey);

      const distanceToTarget = Phaser.Math.Distance.Between(fromX, fromY, toX, toY);
      const travelDuration = Phaser.Math.Clamp(Math.round(distanceToTarget * 1.2), 60, 180);
      const angle = Math.atan2(toY - fromY, toX - fromX);

      this.tweens.add({
        targets: sprite,
        x: toX,
        y: toY,
        duration: travelDuration,
        ease: "Linear",
        onComplete: () => {
          if (sprite.active) {
            sprite.destroy();
          }
          this.spawnImpactFx(toX, toY, impactAnimKey, impactScale, angle);
        }
      });
    });
  }

  private spawnImpactFx(x: number, y: number, animKey: string, scale: number, angle = 0): void {
    if (!this.anims.exists(animKey)) return;

    const anim = Object.values(FX_ANIMS).find((entry) => entry.key === animKey) as any;
    const sheetKey = anim?.sheet || Object.values(FX_SHEETS)[0].key;
    const sprite = this.add
      .sprite(x, y, sheetKey, 0)
      .setScale(scale)
      .setDepth(16)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setRotation(angle);

    sprite.play(animKey);
    sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (sprite.active) {
        sprite.destroy();
      }
    });
  }

}
