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
  assetPath?: string;
}

export const MONSTER_SPRITE_CONFIG: Record<string, MonsterSpriteConfig> = {
  // Regular monsters (80x80 spritesheets from assets/monsters/)
  scrapCrawler: {
    spriteName: "02",
    frameWidth: 80, frameHeight: 80, scale: 1.2,
    idleFrameCount: 5, healthBarOffsetY: -28
  },
  cinderGrub: {
    spriteName: "05",
    frameWidth: 80, frameHeight: 80, scale: 1.2,
    idleFrameCount: 5, healthBarOffsetY: -28
  },
  frostSprite: {
    spriteName: "03",
    frameWidth: 80, frameHeight: 80, scale: 1.2,
    idleFrameCount: 5, healthBarOffsetY: -28
  },
  stormHound: {
    spriteName: "06",
    frameWidth: 80, frameHeight: 80, scale: 1.2,
    idleFrameCount: 5, healthBarOffsetY: -28
  },
  voidStalker: {
    spriteName: "08",
    frameWidth: 80, frameHeight: 80, scale: 1.2,
    idleFrameCount: 5, healthBarOffsetY: -28
  },
  blazeWarden: {
    spriteName: "24",
    frameWidth: 80, frameHeight: 80, scale: 1.2,
    idleFrameCount: 5, healthBarOffsetY: -28
  },
  // Spellcaster monsters (Rare)
  fireElemental: {
    spriteName: "10",
    frameWidth: 80, frameHeight: 80, scale: 1.2,
    idleFrameCount: 5, healthBarOffsetY: -28
  },
  frostMage: {
    spriteName: "12",
    frameWidth: 80, frameHeight: 80, scale: 1.2,
    idleFrameCount: 5, healthBarOffsetY: -28
  },
  stormCaller: {
    spriteName: "13",
    frameWidth: 80, frameHeight: 80, scale: 1.2,
    idleFrameCount: 5, healthBarOffsetY: -28
  },
  voidAdept: {
    spriteName: "14",
    frameWidth: 80, frameHeight: 80, scale: 1.2,
    idleFrameCount: 5, healthBarOffsetY: -28
  },
  // Tier boss monsters
  tier1Boss: {
    spriteName: "01",
    frameWidth: 80, frameHeight: 80, scale: 1.4,
    idleFrameCount: 5, healthBarOffsetY: -32
  },
  tier2Boss: {
    spriteName: "04",
    frameWidth: 80, frameHeight: 80, scale: 1.4,
    idleFrameCount: 5, healthBarOffsetY: -32
  },
  tier3Boss: {
    spriteName: "07",
    frameWidth: 80, frameHeight: 80, scale: 1.4,
    idleFrameCount: 5, healthBarOffsetY: -32
  },
  tier4Boss: {
    spriteName: "09",
    frameWidth: 80, frameHeight: 80, scale: 1.4,
    idleFrameCount: 5, healthBarOffsetY: -32
  },
  tier5Boss: {
    spriteName: "11",
    frameWidth: 80, frameHeight: 80, scale: 1.4,
    idleFrameCount: 5, healthBarOffsetY: -32
  },
  tier6Boss: {
    spriteName: "16",
    frameWidth: 80, frameHeight: 80, scale: 1.4,
    idleFrameCount: 5, healthBarOffsetY: -32
  },
  tier7Boss: {
    spriteName: "17",
    frameWidth: 80, frameHeight: 80, scale: 1.4,
    idleFrameCount: 5, healthBarOffsetY: -32
  },
  tier8Boss: {
    spriteName: "18",
    frameWidth: 80, frameHeight: 80, scale: 1.4,
    idleFrameCount: 5, healthBarOffsetY: -32
  },
  tier9Boss: {
    spriteName: "21",
    frameWidth: 80, frameHeight: 80, scale: 1.4,
    idleFrameCount: 5, healthBarOffsetY: -32
  },
  tier10Boss: {
    spriteName: "25",
    frameWidth: 80, frameHeight: 80, scale: 1.4,
    idleFrameCount: 5, healthBarOffsetY: -32
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
  monsterSheet?: boolean;
}

export const PLAYER_SPRITE_CONFIG: PlayerSpriteConfig = {
  spriteName: "30",
  frameWidth: 80,
  frameHeight: 80,
  scale: 1.0,
  idleFrameCount: 5,
  monsterSheet: true
};

export const FALLBACK_MONSTER_CONFIG: MonsterSpriteConfig = {
  spriteName: "02",
  frameWidth: 80, frameHeight: 80, scale: 1.2,
  idleFrameCount: 5, healthBarOffsetY: -28
};

// ─── Asset paths ─────────────────────────────────────────────────────────────

export const SPRITE_BASE_PATH = "/assets/0x72_DungeonTilesetII_v1.7/frames";

// Spell effect sheets (64x64 frame size)
export const FX_SHEETS = {
  s872: { key: "fx-sheet-872", path: "/assets/spelleffects/872.png", frameWidth: 64, frameHeight: 64 },
  s838: { key: "fx-sheet-838", path: "/assets/spelleffects/838.png", frameWidth: 64, frameHeight: 64 },
  s975: { key: "fx-sheet-975", path: "/assets/spelleffects/975.png", frameWidth: 64, frameHeight: 64 },
  s884: { key: "fx-sheet-884", path: "/assets/spelleffects/884.png", frameWidth: 64, frameHeight: 64 },
  s766: { key: "fx-sheet-766", path: "/assets/spelleffects/766.png", frameWidth: 64, frameHeight: 64 },
  s835: { key: "fx-sheet-835", path: "/assets/spelleffects/835.png", frameWidth: 64, frameHeight: 64 },
  s1263: { key: "fx-sheet-1263", path: "/assets/spelleffects/1263.png", frameWidth: 64, frameHeight: 64 },
  s776: { key: "fx-sheet-776", path: "/assets/spelleffects/776.png", frameWidth: 64, frameHeight: 64 },
  s928: { key: "fx-sheet-928", path: "/assets/spelleffects/928.png", frameWidth: 64, frameHeight: 64 },
  s936: { key: "fx-sheet-936", path: "/assets/spelleffects/936.png", frameWidth: 64, frameHeight: 64 },
  s1668: { key: "fx-sheet-1668", path: "/assets/spelleffects/1668.png", frameWidth: 64, frameHeight: 64 }
} as const;

// Each sheet can have a different number of columns.
// Start frame = (row - 1) * columns-in-that-sheet.
export const FX_ANIMS = {
  stormChain: { key: "fx-storm-chain", sheet: "fx-sheet-872", startFrame: 22, frameCount: 11, frameRate: 12 }, // 872 row 3 (11 cols)
  emberBurst: { key: "fx-ember-burst", sheet: "fx-sheet-838", startFrame: 0, frameCount: 10, frameRate: 12 }, // 838 row 1
  glacierNova: { key: "fx-glacier-nova", sheet: "fx-sheet-975", startFrame: 24, frameCount: 12, frameRate: 12 }, // 975 row 3 (12 cols)
  arcLance: { key: "fx-arc-lance", sheet: "fx-sheet-884", startFrame: 22, frameCount: 11, frameRate: 12 }, // 884 row 3 (11 cols)
  ashenOrbit: { key: "fx-ashen-orbit", sheet: "fx-sheet-766", startFrame: 40, frameCount: 8, frameRate: 12 }, // 766 row 6 (8 cols)
  tempestBloom: { key: "fx-tempest-bloom", sheet: "fx-sheet-835", startFrame: 20, frameCount: 10, frameRate: 12 }, // 835 row 3
  monsterSlash: { key: "fx-monster-slash", sheet: "fx-sheet-1263", startFrame: 20, frameCount: 10, frameRate: 12 }, // 1263 row 3
  monsterFireBurst: { key: "fx-monster-fire-burst", sheet: "fx-sheet-776", startFrame: 0, frameCount: 8, frameRate: 12 }, // 776 row 1 (8 cols)
  monsterFrostBolt: { key: "fx-monster-frost-bolt", sheet: "fx-sheet-928", startFrame: 24, frameCount: 12, frameRate: 12 }, // 928 row 3 (12 cols)
  monsterLightningStrike: { key: "fx-monster-lightning-strike", sheet: "fx-sheet-936", startFrame: 24, frameCount: 12, frameRate: 12 }, // 936 row 3 (12 cols)
  orbFire: { key: "fx-orb-fire", sheet: "fx-sheet-1668", startFrame: 0, frameCount: 14, frameRate: 14 }, // 1668 row 1 (14 cols)
  orbCold: { key: "fx-orb-cold", sheet: "fx-sheet-1668", startFrame: 28, frameCount: 14, frameRate: 14 }, // 1668 row 3 (14 cols)
  orbLightning: { key: "fx-orb-lightning", sheet: "fx-sheet-1668", startFrame: 70, frameCount: 14, frameRate: 14 } // 1668 row 6 (14 cols)
} as const;

