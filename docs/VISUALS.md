# Visual System Guide

How to add and modify monster sprites, player sprites, and spell effects in the current Shardborne runtime.

---

## How it works

The visual layer is separate from gameplay logic. Each simulation tick produces an `ArenaSnapshot` in `frontend/src/game/domain/combat/arenaSimulation.ts`. `frontend/src/game/phaser/scenes/ArenaScene.ts` reads the snapshot and renders it; Phaser does not write back into game state.

Spell visuals are driven by `SpellVisualEvent` objects inside the snapshot. Each event carries the spell tags, origin point, and impact positions. `ArenaScene` processes each event exactly once by tracking `processedSpellEventIds`.

```text
Domain tick -> ArenaSnapshot.spellEvents[] -> ArenaScene.animateSpellEvent()
                                            |- travel orb (elemental)
                                            `- impact animation (spell-specific)
```

---

## Central config file

`frontend/src/game/phaser/spriteConfig.ts` is the main file for visual assignments.

It exports:

- `MONSTER_SPRITE_CONFIG` -> maps `monsterTypeId` to runtime sprite metadata
- `PLAYER_SPRITE_CONFIG` -> player runtime sprite metadata
- `FALLBACK_MONSTER_CONFIG` -> used when a monster has no explicit config
- `FX_SHEETS` -> spell effect sheet paths and frame sizes
- `FX_ANIMS` -> named animation ranges inside the effect sheets

The current runtime uses numbered spritesheets from `frontend/public/assets/monsters/` and `frontend/public/assets/spelleffects/`.

---

## Asset locations

| Asset pack | Location |
|---|---|
| Monster spritesheets | `frontend/public/assets/monsters/` |
| Spell effect spritesheets | `frontend/public/assets/spelleffects/` |

Notes:

- Monster sprites are currently loaded as numbered `80x80` spritesheets such as `02.png`, `24.png`, and `30.png`.
- Spell effects are currently loaded as numbered `64x64` spritesheets such as `1010.png`, `1011.png`, and `1020.png`.
- Older experimental asset paths such as `monstersprites/` are not part of the active runtime.

---

## How to add a new enemy type

### Step 1 -> Define the monster in game config

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

### Step 2 -> Assign a runtime sprite in `spriteConfig.ts`

Add a matching entry to `MONSTER_SPRITE_CONFIG` using the same `id`:

```typescript
ashWalker: {
  spriteName: "31",
  frameWidth: 80,
  frameHeight: 80,
  scale: 1.2,
  idleFrameCount: 5,
  healthBarOffsetY: -28
},
```

That is enough for the current runtime. `ArenaScene.preload()` will load `/assets/monsters/31.png` automatically.

If you omit the `spriteConfig.ts` entry, the monster falls back to `FALLBACK_MONSTER_CONFIG` so it still renders.

### Choosing a monster sheet

Before assigning a new numbered sheet:

- check `docs/ASSET_MAPPING.md`
- avoid boss-reserved sheets for regular monsters
- make sure the silhouette matches the monster role, not just the color theme

Current boss-reserved monster sheets are:

- `01`, `04`, `07`, `09`, `11`, `16`, `17`, `18`, `21`, `25`

Do not assign those to regular monsters.

---

## How to add or swap the player sprite

Update `PLAYER_SPRITE_CONFIG` in `frontend/src/game/phaser/spriteConfig.ts`:

```typescript
export const PLAYER_SPRITE_CONFIG: PlayerSpriteConfig = {
  spriteName: "30",
  frameWidth: 80,
  frameHeight: 80,
  scale: 1.0,
  idleFrameCount: 5,
  monsterSheet: true
};
```

The current player sprite is loaded from `/assets/monsters/30.png`.

If you change it, keep an eye on:

- `frameWidth`
- `frameHeight`
- `scale`
- whether it should still use `monsterSheet: true`

---

## How to add a new spell

### Step 1 -> Define the spell in game config

Add the spell to `frontend/src/game/config/spellConfig.ts`. The `tags` array controls both gameplay and visual routing.

| Tag | Effect |
|---|---|
| `"Projectile"` | Straight beam animation unless `"Chain"` is also present |
| `"Chain"` | Jagged bolt hopping between enemies |
| `"Area"` | Area explosion logic |
| `"Fire"` | Fire-colored FX routing |
| `"Cold"` | Ice-colored FX routing |
| `"Lightning"` | Electric-colored FX routing |

Example:

```typescript
voidBeam: {
  id: "voidBeam",
  name: "Void Beam",
  tags: ["Lightning", "Projectile", "SpellDamage"],
  ...
}
```

### Step 2 -> Visual routing

Current runtime rule:

- one spell id -> one impact animation
- chain/projectile/secondary repeats that same impact animation
- travel uses element orb by tag (`Lightning` / `Cold` / `Fire`)
- no extra overlay lines, rings, or non-spell FX

### Step 3 -> FX sheet wiring

Spell effect sheets are registered in `FX_SHEETS` and animation ranges are defined in `FX_ANIMS`.

To add a new effect:

1. add a new sheet entry in `FX_SHEETS` if needed
2. add a named animation range in `FX_ANIMS`
3. map spell id to that animation in `ArenaScene.getSpellFxAnim()`

---

## Frame Mapping Guardrail (Important)

Do not assume all sheets have the same number of columns.

- frame size is `64x64`, but sheet widths vary
- columns must be computed per sheet: `columns = imageWidth / 64`
- start frame must be computed with sheet-specific columns:
  - `startFrame = (row - 1) * columns`
- frame count should normally match one full row:
  - `frameCount = columns`

If these are wrong, animations spill into the next row and can change color/theme (for example blue -> purple/green mid-animation).

### Required validation before merging FX changes

1. Check PNG dimensions and compute columns for each referenced sheet.
2. Verify `startFrame` and `frameCount` in `FX_ANIMS` use that sheet's columns.
3. In-game sanity pass for at least:
- one cold spell
- one lightning spell
- one fire spell
- one chain setup

---

## How to swap an existing monster sprite

Open `frontend/src/game/phaser/spriteConfig.ts` and update the monster entry:

```typescript
// Before
blazeWarden: {
  spriteName: "24",
  frameWidth: 80,
  frameHeight: 80,
  scale: 1.2,
  idleFrameCount: 5,
  healthBarOffsetY: -28
}

// After
blazeWarden: {
  spriteName: "15",
  frameWidth: 80,
  frameHeight: 80,
  scale: 1.2,
  idleFrameCount: 5,
  healthBarOffsetY: -28
}
```

When changing the asset, also review:

- whether the sheet is boss-reserved
- whether the silhouette still matches the monster role
- `scale`
- `healthBarOffsetY`

---

## Current assignments

### Monsters

For the current recommended mapping set, use:

- `docs/ASSET_MAPPING.md`

That file is the maintained reference for:

- regular monster sheet choices
- boss-reserved sheet assignments
- recommended fallback candidates

### Spells

Current visual families:

| Spell ID | Tags | Visual |
|---|---|---|
| `stormChain` | Lightning, Projectile, Chain | Jagged lightning bolt hopping between enemies |
| `arcLance` | Lightning, Projectile | Straight beam with electric impact |
| `emberBurst` | Fire, Area, Explosion | Fire-themed area impact |
| `ashenOrbit` | Fire, Area, Explosion | Fire-themed area impact |
| `glacierNova` | Cold, Area, Critical | Cold ring / ice impact |
| `tempestBloom` | Lightning, Cold, Area, Chain | Cold-leaning area impact with chained logic underneath |

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
| `docs/ASSET_MAPPING.md` | Current runtime monster and spell-effect mapping reference |
