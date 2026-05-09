// ─── Monster sprite config ──────────────────────────────────────────────────
// Change spriteName to swap which 0x72 sprite is used for each monster type.
// Available names (all in 0x72_DungeonTilesetII_v1.7/frames/):
//   goblin, imp, chort, wogol, masked_orc, big_demon, big_zombie, skelet,
//   tiny_zombie, orc_warrior, orc_shaman, pumpkin_dude, ogre, angel ...

export interface MonsterSpriteConfig {
  spriteName: string;
  frameWidth: number;
  frameHeight: number;
  scale: number;
  idleFrameCount: number;
  healthBarOffsetY: number;
}

export const MONSTER_SPRITE_CONFIG: Record<string, MonsterSpriteConfig> = {
  scrapCrawler: {
    spriteName: "goblin",
    frameWidth: 16, frameHeight: 16, scale: 2.5,
    idleFrameCount: 4, healthBarOffsetY: -26
  },
  cinderGrub: {
    spriteName: "imp",
    frameWidth: 16, frameHeight: 16, scale: 2.5,
    idleFrameCount: 4, healthBarOffsetY: -26
  },
  frostSprite: {
    spriteName: "chort",
    frameWidth: 16, frameHeight: 23, scale: 2.5,
    idleFrameCount: 4, healthBarOffsetY: -34
  },
  stormHound: {
    spriteName: "wogol",
    frameWidth: 16, frameHeight: 23, scale: 2.5,
    idleFrameCount: 4, healthBarOffsetY: -34
  },
  voidStalker: {
    spriteName: "masked_orc",
    frameWidth: 16, frameHeight: 23, scale: 2.5,
    idleFrameCount: 4, healthBarOffsetY: -34
  },
  blazeWarden: {
    spriteName: "big_demon",
    frameWidth: 32, frameHeight: 36, scale: 2.0,
    idleFrameCount: 4, healthBarOffsetY: -42
  },
};

// ─── Player sprite config ─────────────────────────────────────────────────────
// Change spriteName here to swap the player sprite (knight_m, knight_f,
// wizzard_f, elf_m, lizard_m, etc.)

export interface PlayerSpriteConfig {
  spriteName: string;
  frameWidth: number;
  frameHeight: number;
  scale: number;
  idleFrameCount: number;
}

export const PLAYER_SPRITE_CONFIG: PlayerSpriteConfig = {
  spriteName: "wizzard_m",
  frameWidth: 16,
  frameHeight: 28,
  scale: 2.5,
  idleFrameCount: 4
};

export const FALLBACK_MONSTER_CONFIG: MonsterSpriteConfig = {
  spriteName: "goblin",
  frameWidth: 16, frameHeight: 16, scale: 2.5,
  idleFrameCount: 4, healthBarOffsetY: -26
};

// ─── Asset paths ─────────────────────────────────────────────────────────────

export const SPRITE_BASE_PATH = "/assets/0x72_DungeonTilesetII_v1.7/frames";

// Gizmo Effect pack — 32x32 spritesheet (192×352px, 6 cols × 11 rows)
export const FX_SHEET = {
  key: "fx-32",
  path: "/assets/Gizmo%20Pixel%20Art%20-%20Effect%20pack/sheets/32x32.png",
  frameWidth: 32,
  frameHeight: 32,
} as const;

// Frame ranges inside the 32x32 sheet (row * 6 + col)
export const FX_ANIMS = {
  fire:     { key: "fx-fire",     startFrame: 12, frameCount: 6, frameRate: 12 },
  electric: { key: "fx-electric", startFrame: 18, frameCount: 4, frameRate: 12 },
  ice:      { key: "fx-ice",      startFrame: 24, frameCount: 3, frameRate: 10 },
} as const;
