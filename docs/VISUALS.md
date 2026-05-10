# Visual System Guide

How to add and modify sprites, animations, and spell effects in Shardborne.

---

## How it works

The visual layer is separate from gameplay logic. Each simulation tick produces an `ArenaSnapshot` in `frontend/src/game/domain/combat/arenaSimulation.ts`. `frontend/src/game/phaser/scenes/ArenaScene.ts` reads the snapshot and renders it; Phaser does not write back into game state.

Spell visuals are driven by `SpellVisualEvent` objects inside the snapshot. Each event carries the spell tags, origin point, and impact positions. `ArenaScene` processes each event exactly once by tracking `processedSpellEventIds`.

```text
Domain tick -> ArenaSnapshot.spellEvents[] -> ArenaScene.animateSpellEvent()
                                            |- animateAreaExplosion()
                                            |- animateProjectileLance()
                                            `- animateLightningChain()
```

---

## Central config file

`frontend/src/game/phaser/spriteConfig.ts` is the main file for visual assignments.

It exports:

- `MONSTER_SPRITE_CONFIG` — maps `monsterTypeId` to sprite metadata
- `PLAYER_SPRITE_CONFIG` — player sprite metadata
- `FALLBACK_MONSTER_CONFIG` — used when a monster has no explicit config
- `FX_SHEET` — the spell effect spritesheet path and frame size
- `FX_ANIMS` — named animation ranges inside the effect sheet
- `SPRITE_BASE_PATH` — root path for the 0x72 dungeon frame files

---

## Asset locations

| Asset pack | Location |
|---|---|
| Monster and player frame files | `frontend/public/assets/0x72_DungeonTilesetII_v1.7/frames/` |
| Custom generated monster sheets | `frontend/public/assets/monstersprites/` |
| Effect spritesheet | `frontend/public/assets/Gizmo Pixel Art - Effect pack/sheets/32x32.png` |

### 0x72 frame naming convention

The 0x72 assets are individual PNG files with four idle frames:

```text
{name}_idle_anim_f0.png
{name}_idle_anim_f1.png
{name}_idle_anim_f2.png
{name}_idle_anim_f3.png
```

Common names include `goblin`, `imp`, `chort`, `wogol`, `masked_orc`, `big_demon`, `big_zombie`, `skelet`, `orc_warrior`, `orc_shaman`, and `pumpkin_dude`.

Frame sizes vary. Measure the PNG before wiring it:

- Small sprites: `16x16`
- Medium sprites: `16x23`
- Large sprites: `32x36`

### Gizmo effect sheet layout

The bundled effect sheet is `192x352`, arranged as `6` columns by `11` rows. Each frame is `32x32`. Frame index uses `row * 6 + col`.

| Effect | Row | Frames | `startFrame` | `frameCount` |
|---|---|---|---|---|
| Fire | 2 | 12-17 | 12 | 6 |
| Electric | 3 | 18-21 | 18 | 4 |
| Ice | 4 | 24-26 | 24 | 3 |

To add a new effect row, extend `FX_ANIMS` in `spriteConfig.ts`. `ArenaScene.createAnimations()` registers every entry automatically.

---

## How to add a new enemy type

### Step 1 — Define the monster in game config

Add an entry to `frontend/src/game/config/monsterConfig.ts`:

```typescript
{
  id: "ashWalker",
  name: "Ash Walker",
  tags: ["Fire"],
  rarity: "Normal",
  radius: monsterBalance.normalRadius,
  minTier: 5,
  resistances: { Fire: 0.1 }
}
```

### Step 2 — Assign a sprite in `spriteConfig.ts`

Add a matching entry to `MONSTER_SPRITE_CONFIG` using the same `id`:

```typescript
ashWalker: {
  spriteName: "pumpkin_dude",
  frameWidth: 16,
  frameHeight: 16,
  scale: 2.5,
  idleFrameCount: 4,
  healthBarOffsetY: -26
},
```

That is enough for normal 0x72 frame-file monsters. `ArenaScene.preload()` iterates the config and loads the frames automatically.

If you omit the `spriteConfig.ts` entry, the monster falls back to `FALLBACK_MONSTER_CONFIG` so it still renders.

### Optional — Use a custom generated spritesheet

If a monster uses one horizontal spritesheet instead of the built-in 0x72 frame files, point the config at a custom PNG with `assetPath`:

```typescript
scrapCrawler: {
  spriteName: "scrap-crawler-custom",
  assetPath: "/assets/monstersprites/scrap_crawler_clean.png",
  frameWidth: 1032,
  frameHeight: 1024,
  scale: 0.04,
  idleFrameCount: 4,
  healthBarOffsetY: -26
},
```

Notes:

- `frameWidth` is one frame width inside the sheet, not the full image width.
- Keep the sheet as one PNG with all idle frames in a single horizontal row.
- The background must use real alpha transparency. If the image model bakes in a checkerboard preview, clean it before using it in-game.
- Use `docs/PIXEL_ART_PROMPTS.md` for the current master prompts and asset data blocks when generating new monster or spell art externally.

---

## How to add a new spell

### Step 1 — Define the spell in game config

Add the spell to `frontend/src/game/config/spellConfig.ts`. The `tags` array controls both gameplay and visual routing.

| Tag | Effect |
|---|---|
| `"Projectile"` | Straight beam animation unless `"Chain"` is also present |
| `"Chain"` | Jagged bolt hopping between enemies |
| `"Area"` | Explosion circle plus sprite at the center |
| `"Fire"` | Fire FX sprite plus orange-red color |
| `"Cold"` | Ice FX sprite plus blue color |
| `"Lightning"` | Electric FX sprite plus yellow-violet color |

Example:

```typescript
voidBeam: {
  id: "voidBeam",
  name: "Void Beam",
  tags: ["Lightning", "Projectile", "SpellDamage"],
  ...
}
```

### Step 2 — Visual routing

`ArenaScene.animateSpellEvent()` routes visuals from the spell tags:

```typescript
const isArea = event.areaRadius > 0;
const isProjectile = event.tags.includes("Projectile") && !event.tags.includes("Chain");

if (isArea) animateAreaExplosion(event);
else if (isProjectile) animateProjectileLance(event);
else animateLightningChain(event);
```

If none of the three visual families fits, add a new `animate*()` method in `ArenaScene.ts` and extend the router.

### Step 3 — Color and FX customization

Inside the animation methods, the element color and effect animation are selected from the spell tags:

```typescript
const isFire = event.tags.includes("Fire");
const isCold = event.tags.includes("Cold");
const fxAnim = isCold ? FX_ANIMS.ice.key : isFire ? FX_ANIMS.fire.key : FX_ANIMS.electric.key;
const color = isFire ? 0xf97316 : isCold ? 0x38bdf8 : 0xa78bfa;
```

To add a new element such as poison, add a `poison` entry to `FX_ANIMS`, a `"Poison"` tag in spell config, and matching selection logic in the Phaser animation methods.

---

## How to swap an existing sprite

Open `frontend/src/game/phaser/spriteConfig.ts` and update the monster entry:

```typescript
// Before
scrapCrawler: { spriteName: "goblin", ... }

// After
scrapCrawler: {
  spriteName: "skelet",
  frameWidth: 16,
  frameHeight: 16,
  scale: 2.5,
  idleFrameCount: 4,
  healthBarOffsetY: -26
},
```

When changing the asset, also review:

- `frameWidth`
- `frameHeight`
- `scale`
- `healthBarOffsetY`

To swap the player, update `PLAYER_SPRITE_CONFIG.spriteName`.

---

## Current assignments

### Monsters

| Monster ID | Sprite | Size | Rarity |
|---|---|---|---|
| `scrapCrawler` | custom `scrap_crawler_clean.png` sheet | `1032x1024` per frame, scaled to `0.04` | Normal |
| `cinderGrub` | `imp` | `16x16` | Normal |
| `frostSprite` | `chort` | `16x23` | Normal |
| `stormHound` | `wogol` | `16x23` | Normal |
| `voidStalker` | `masked_orc` | `16x23` | Rare |
| `blazeWarden` | `big_demon` | `32x36` | Rare |

### Spells

| Spell ID | Tags | Visual |
|---|---|---|
| `stormChain` | Lightning, Projectile, Chain | Jagged lightning bolt that hops between enemies |
| `arcLance` | Lightning, Projectile | Straight beam with electric impact |
| `emberBurst` | Fire, Area, Explosion | Fire sprite plus orange ring at radius |
| `ashenOrbit` | Fire, Area, Explosion | Fire sprite plus orange ring at radius |
| `glacierNova` | Cold, Area, Critical | Ice sprite plus blue ring at radius |
| `tempestBloom` | Lightning, Cold, Area, Chain | Area explosion using cold FX plus blue ring |

---

## Relevant files

| File | Purpose |
|---|---|
| `frontend/src/game/phaser/spriteConfig.ts` | All sprite and FX assignments |
| `frontend/src/game/phaser/scenes/ArenaScene.ts` | Phaser scene loading, animations, and rendering |
| `frontend/src/game/config/monsterConfig.ts` | Monster definitions |
| `frontend/src/game/config/spellConfig.ts` | Spell definitions and tags |
| `frontend/src/shared/types/saveTypes.ts` | `SpellVisualEvent` and arena visual types |
| `frontend/src/game/domain/combat/arenaSimulation.ts` | Emits `SpellVisualEvent` when spells fire |
| `frontend/src/app/useArenaSession.ts` | Forwards snapshots and bypasses throttle when spell events exist |
| `docs/PIXEL_ART_PROMPTS.md` | Prompt templates and current asset data blocks for generated art |
