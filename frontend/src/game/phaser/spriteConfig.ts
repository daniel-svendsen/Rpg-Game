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

// New spell effect sheets (64x64 frame size)
export const FX_SHEETS = {
  impacts: {
    key: "fx-impacts-64",
    path: "/assets/spelleffects/1010.png",
    frameWidth: 64,
    frameHeight: 64,
  },
  stars: {
    key: "fx-stars-64",
    path: "/assets/spelleffects/1011.png",
    frameWidth: 64,
    frameHeight: 64,
  },
  spray: {
    key: "fx-spray-64",
    path: "/assets/spelleffects/1012.png",
    frameWidth: 64,
    frameHeight: 64,
  },
  waves: {
    key: "fx-waves-64",
    path: "/assets/spelleffects/1013.png",
    frameWidth: 64,
    frameHeight: 64,
  },
  arcs: {
    key: "fx-arcs-64",
    path: "/assets/spelleffects/1020.png",
    frameWidth: 64,
    frameHeight: 64,
  },
} as const;

// Frame ranges: sheets have 8 frames per row. Row index × 8 = startFrame.
// Color row order per file:
//   1010 (impacts): Red, Blue, Purple, Green, Brown, Gray, Pink, Orange
//   1011 (stars):   Red, Purple, Blue, Green, Brown, Gray, Pink, Orange
//   1012 (spray):   Red, Orange, Yellow, Purple, Blue, Green, Brown, Gray
//   1013 (waves):   Red, Yellow, Purple, Blue, Green, Brown, Gray
//   1020 (arcs):    Red, Orange, Purple, Blue, Green, Brown, Gray
export const FX_ANIMS = {
  fire:        { key: "fx-fire",         sheet: "fx-impacts-64",  startFrame: 0,  frameCount: 8, frameRate: 12 }, // 1010 row 0 — Red
  fireWave:    { key: "fx-fire-wave",    sheet: "fx-waves-64",    startFrame: 0,  frameCount: 8, frameRate: 12 }, // 1013 row 0 — Red
  electric:    { key: "fx-electric",     sheet: "fx-stars-64",    startFrame: 8,  frameCount: 8, frameRate: 14 }, // 1011 row 1 — Purple
  electricArc: { key: "fx-electric-arc", sheet: "fx-arcs-64",     startFrame: 24, frameCount: 8, frameRate: 14 }, // 1020 row 3 — Blue
  ice:         { key: "fx-ice",          sheet: "fx-spray-64",    startFrame: 32, frameCount: 8, frameRate: 10 }, // 1012 row 4 — Blue
  iceWave:     { key: "fx-ice-wave",     sheet: "fx-waves-64",    startFrame: 24, frameCount: 8, frameRate: 10 }, // 1013 row 3 — Blue
} as const;
