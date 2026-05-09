# Visual System Guide

How to add and modify sprites, animations, and spell effects in Shardborne.

---

## How it works

The visual layer is completely separate from game logic. Each simulation tick produces an `ArenaSnapshot` (in `arenaSimulation.ts`). `ArenaScene.ts` (Phaser) reads the snapshot and renders it — it never writes back to game state.

Spell visuals ride on `SpellVisualEvent` objects inside the snapshot. Each event carries the spell's tags, origin point, and impact positions. `ArenaScene` processes each event exactly once (tracked by `processedSpellEventIds: Set<string>`).

```
Domain tick → ArenaSnapshot.spellEvents[] → ArenaScene.animateSpellEvent()
                                               ├── animateAreaExplosion()   (areaRadius > 0)
                                               ├── animateProjectileLance() (Projectile, not Chain)
                                               └── animateLightningChain()  (everything else)
```

---

## Central config file

**`frontend/src/game/phaser/spriteConfig.ts`** — the only file you normally need to edit for visual assignments.

It exports:
- `MONSTER_SPRITE_CONFIG` — maps `monsterTypeId → sprite name + frame info`
- `PLAYER_SPRITE_CONFIG` — player sprite name + frame info
- `FALLBACK_MONSTER_CONFIG` — used when a monster has no entry in the map
- `FX_SHEET` — Gizmo effect spritesheet path + frame dimensions
- `FX_ANIMS` — named animation ranges inside the effect sheet (`fire`, `electric`, `ice`)
- `SPRITE_BASE_PATH` — root path for 0x72 dungeon frames

---

## Asset locations

| Asset pack | Location |
|---|---|
| Monster / player frames | `frontend/public/assets/0x72_DungeonTilesetII_v1.7/frames/` |
| Effect spritesheet | `frontend/public/assets/Gizmo Pixel Art - Effect pack/sheets/32x32.png` |

### 0x72 frame naming convention

Individual PNG files, four idle frames each:

```
{name}_idle_anim_f0.png
{name}_idle_anim_f1.png
{name}_idle_anim_f2.png
{name}_idle_anim_f3.png
```

Available names include: `goblin`, `imp`, `chort`, `wogol`, `masked_orc`, `big_demon`,
`big_zombie`, `skelet`, `tiny_zombie`, `orc_warrior`, `orc_shaman`, `pumpkin_dude`, `ogre`,
`knight_m`, `knight_f`, `wizzard_m`, `wizzard_f`, `elf_m`, `lizard_m`, and more.

Frame sizes vary — measure the PNG before setting `frameWidth`/`frameHeight`:
- Small sprites (goblin, imp, etc.): 16×16
- Medium sprites (chort, wogol, masked_orc): 16×23
- Large sprites (big_demon, big_zombie): 32×36

### Gizmo effect sheet layout

The sheet is 192×352 px, 6 columns × 11 rows, each cell 32×32. Frame index = `row * 6 + col`.

| Effect | Row | Frames | `startFrame` | `frameCount` |
|---|---|---|---|---|
| Fire | 2 | 12–17 | 12 | 6 |
| Electric | 3 | 18–21 | 18 | 4 |
| Ice | 4 | 24–26 | 24 | 3 |

To add a new FX animation, add an entry to `FX_ANIMS` in `spriteConfig.ts`:

```typescript
export const FX_ANIMS = {
  fire:     { key: "fx-fire",     startFrame: 12, frameCount: 6, frameRate: 12 },
  electric: { key: "fx-electric", startFrame: 18, frameCount: 4, frameRate: 12 },
  ice:      { key: "fx-ice",      startFrame: 24, frameCount: 3, frameRate: 10 },
  // Add new rows here
  poison:   { key: "fx-poison",   startFrame: 30, frameCount: 5, frameRate: 10 },
} as const;
```

`ArenaScene.createAnimations()` automatically registers every entry in `FX_ANIMS` on startup — no changes needed there.

---

## How to add a new enemy type

### Step 1 — Define the monster in game config

Add an entry to `monsterDefinitions` in `frontend/src/game/config/monsterConfig.ts`:

```typescript
{
  id: "ashWalker",          // must be unique, used as monsterTypeId
  name: "Ash Walker",
  tags: ["Fire"],
  rarity: "Normal",
  radius: monsterBalance.normalRadius,
  minTier: 5,
  resistances: { Fire: 0.1 }
}
```

### Step 2 — Assign a sprite in spriteConfig.ts

Add a matching entry to `MONSTER_SPRITE_CONFIG` using the same `id` as key:

```typescript
ashWalker: {
  spriteName: "pumpkin_dude",   // filename prefix inside frames/
  frameWidth: 16,
  frameHeight: 16,
  scale: 2.5,
  idleFrameCount: 4,
  healthBarOffsetY: -26         // px above sprite center where the health bar sits
},
```

That's it. `ArenaScene.preload()` iterates all configs and loads the frames automatically. The idle animation is created and played without any further changes.

If you omit the `spriteConfig.ts` entry, the monster renders with `FALLBACK_MONSTER_CONFIG` (goblin sprite) so it always shows something.

---

## How to add a new spell

### Step 1 — Define the spell in game config

Add to `spellConfig` in `frontend/src/game/config/spellConfig.ts`. The `tags` array controls both gameplay and visual routing:

| Tag | Effect |
|---|---|
| `"Projectile"` | Straight beam animation (unless `"Chain"` is also present) |
| `"Chain"` | Jagged bolt hopping between enemies |
| `"Area"` | Explosion circle + sprite at center |
| `"Fire"` | Fire FX sprite + orange/red color |
| `"Cold"` | Ice FX sprite + blue color |
| `"Lightning"` | Electric FX sprite + yellow color |

Tags can be combined. `"Area"` takes priority over `"Projectile"` and `"Chain"` in the visual router.

```typescript
voidBeam: {
  id: "voidBeam",
  name: "Void Beam",
  tags: ["Lightning", "Projectile", "SpellDamage"],  // → straight beam
  ...
}
```

### Step 2 — Visual routing (usually no code needed)

The routing in `ArenaScene.animateSpellEvent()` is tag-driven:

```typescript
const isArea       = event.areaRadius > 0;
const isProjectile = event.tags.includes("Projectile") && !event.tags.includes("Chain");

if (isArea)            animateAreaExplosion(event);
else if (isProjectile) animateProjectileLance(event);
else                   animateLightningChain(event);
```

If none of the three existing visuals fits your new spell, add a new `animate*()` method in `ArenaScene.ts` and extend the routing block.

### Step 3 — Color/FX customization per spell

Inside each `animate*()` method, element colors and which FX animation to use are determined by checking `event.tags`:

```typescript
const isFire = event.tags.includes("Fire");
const isCold = event.tags.includes("Cold");
// isLightning implied by else / default
const fxAnim  = isCold ? FX_ANIMS.ice.key : isFire ? FX_ANIMS.fire.key : FX_ANIMS.electric.key;
const color   = isFire ? 0xf97316 : isCold ? 0x38bdf8 : 0xa78bfa;
```

To add a new element (e.g. poison), add a `poison` entry to `FX_ANIMS`, add a `"Poison"` tag to the spell, and extend the color/FX selection in each `animate*` method.

---

## How to swap an existing sprite

Open `frontend/src/game/phaser/spriteConfig.ts` and change `spriteName` for any entry:

```typescript
// Before
scrapCrawler: { spriteName: "goblin", ... }

// After
scrapCrawler: { spriteName: "skelet", frameWidth: 16, frameHeight: 16, scale: 2.5,
                idleFrameCount: 4, healthBarOffsetY: -26 },
```

Also update `frameWidth`, `frameHeight`, and `healthBarOffsetY` if the new sprite has different dimensions.

To swap the player, change `PLAYER_SPRITE_CONFIG.spriteName`.

---

## Current assignments

### Monsters

| Monster ID | Sprite | Size | Rarity |
|---|---|---|---|
| `scrapCrawler` | goblin | 16×16 | Normal |
| `cinderGrub` | imp | 16×16 | Normal |
| `frostSprite` | chort | 16×23 | Normal |
| `stormHound` | wogol | 16×23 | Normal |
| `voidStalker` | masked_orc | 16×23 | Rare |
| `blazeWarden` | big_demon | 32×36 | Rare |

### Spells

| Spell ID | Tags | Visual |
|---|---|---|
| `stormChain` | Lightning, Projectile, Chain | Jagged yellow bolt, hops between enemies |
| `arcLance` | Lightning, Projectile | Straight yellow beam with electric impact |
| `emberBurst` | Fire, Area, Explosion | Fire sprite + orange ring at radius |
| `ashenOrbit` | Fire, Area, Explosion | Fire sprite + orange ring at radius |
| `glacierNova` | Cold, Area, Critical | Ice sprite + blue ring at radius |
| `tempestBloom` | Lightning, Cold, Area, Chain | Area explosion (Cold FX + blue ring) |

---

## Relevant files

| File | Purpose |
|---|---|
| `frontend/src/game/phaser/spriteConfig.ts` | All sprite/FX assignments — start here |
| `frontend/src/game/phaser/scenes/ArenaScene.ts` | Phaser scene: loading, animations, rendering |
| `frontend/src/game/config/monsterConfig.ts` | Monster definitions (id, tags, rarity) |
| `frontend/src/game/config/spellConfig.ts` | Spell definitions (id, tags, areaRadius, chainCount) |
| `frontend/src/shared/types/saveTypes.ts` | `SpellVisualEvent`, `ArenaEnemyState` type definitions |
| `frontend/src/game/domain/combat/arenaSimulation.ts` | Emits `SpellVisualEvent` when a spell fires |
| `frontend/src/app/useArenaSession.ts` | Forwards snapshot to React; bypasses throttle when spell events are present |
