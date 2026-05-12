# Asset Mapping Reference

Auto-generated visual asset inventory. Use this to match sprite files with gameplay elements.

**Generated:** 2026-05-12  
**Purpose:** Document which spritesheet contains what, and recommend mappings to spells/monsters.

**Asset Locations:**
- Spell effects: `C:\Users\danie\Documents\New project\frontend\dist\assets\spelleffects\` (1010.png, 1011.png, etc)
- Monster sprites: `C:\Users\danie\Documents\New project\frontend\dist\assets\monsters\` (00.png-59.png)

---

## Spell Effects (64x64 spritesheet files)

Files are organized in series. Each file shows animation frames of the same effect type in different colors.

### 1010-1013 Series: Basic Impact/Spray Effects
- **1010.png** → Spheres/bubbles (colored particle impacts)
  - Colors: Red, Blue, Purple, Green, Brown, Gray, Pink, Orange
  - Use for: Any impact/hit effect
  - Best match: **emberBurst** (Fire), **ashenOrbit** (Fire) — red/orange variant
  
- **1011.png** → Star/X-shaped projectiles (lightning-style)
  - Colors: Red, Purple, Blue, Green, Brown, Gray, Pink, Orange
  - Use for: Lightning/chain projectiles
  - Best match: **stormChain** (Lightning), **arcLance** (Lightning), **tempestBloom** (Lightning)
  
- **1012.png** → Curved spray/splash projectiles (fast-moving)
  - Colors: Red, Orange, Yellow, Purple, Blue, Green, Brown, Gray
  - Use for: Projectile sprays
  - Best match: **stormChain** (fast), **arcLance** (focused)
  
- **1013.png** → Wave/ripple arc effects (expanding dome-like)
  - Colors: Red, Yellow, Purple, Blue, Green, Brown, Gray
  - Use for: Area/explosion effects
  - Best match: **emberBurst** (Area), **glacierNova** (Cold), **ashenOrbit** (Area), **tempestBloom** (Area)

### 1020-1023 Series: Curved Arc Projectiles
- **1020.png** → Half-circle arc (boomerang-style)
  - Colors: Red, Orange, Purple, Blue, Green, Brown, Gray
  - Use for: Arc projectiles, ranged spells
  - Best match: **arcLance** (sharp projectile)
  
- **1021.png** → Spiral/curved projectiles
  - Colors: Multiple
  - Use for: Swirling projectiles
  
- **1022.png** → Similar to 1020
  
- **1023.png** → Similar to 1020

### 1030-1033 Series: Wavy/Curved Projectiles & Arcs
- **1030.png** → Wavy/curved projectiles (flowing shapes)
  - Colors: Red, Orange, Purple, Blue, Green, Brown, Gray
  - Use for: Wave/flow effects
  
- **1031-1033.png** → Similar wavy variations

### 1101+ Series: Splash & Advanced Effects
- **1101.png** → Textured splash/ink effects
  - Colors: Red, Purple, Blue, Green, Brown, Gray
  - Use for: Impact splash, explosion textures
  - Best match: **emberBurst** (splashy explosive feel)

---

## Monsters (80x80 spritesheet files)

Each file contains animation frames (idle, walk, attack, death) of one or more monster types.

### 00.png: Collection Sheet
- Contains many small silhouettes (30+ different monster variations)
- Appears to be an overview/variety sheet
- Includes humanoids, creatures, ghosts, etc.
- Use for: Fallback variety, or pick specific characters from this sheet

### 01-03 Series: Specific Monster Types
- **01.png** → Dark humanoids (likely Orcs/Warriors)
  - Color: Dark red/maroon
  - Multiple animation frames showing same monster type
  - Looks like: Orc Warrior or similar elite melee unit
  
- **02.png** → Green humanoids (likely Goblins)
  - Color: Green
  - Similar animation structure to 01.png
  - Looks like: Goblin or Goblin-class unit
  
- **03.png** → Large green warrior with yellow/gold accents
  - Single prominent character with detailed animation frames
  - Looks like: Orc Warlord or Boss-tier unit
  - Shows: Idle, walk, attack, casting(?), death sequence

### 04-09 Series: More Monster Types
- **04.png** → Dark/maroon humanoids (variant of 01?)
  - Similar structure to 01 but possibly different animation angles
  
- **10.png** → Dark humanoids with slight variations
  
- **20.png** → Brown humanoids (variant color of same type as 01)
  - Appears to be same character model, different color

### Observation
Monster files seem to follow a pattern where **each number represents a different color/variant of the same base model**, rather than completely different monsters. Files 01, 04, 10, 20 all appear to be the same humanoid unit type in different colors/conditions.

---

## Recommended Mappings

### Current Spells → Effect Files

**Starter Spells:**
- **stormChain** (Lightning, Chain) → **1011.png** (star projectiles, blue/purple variant)
- **emberBurst** (Fire, Area) → **1013.png** (wave arc, red/orange variant)

**Other Spells:**
- **glacierNova** (Cold, Area) → **1013.png** (wave arc, blue/cyan variant)
- **arcLance** (Lightning, Projectile) → **1020.png** (arc projectile, blue variant)
- **ashenOrbit** (Fire, Area) → **1013.png** (wave arc, red/orange variant, thicker)
- **tempestBloom** (Lightning, Cold, Area, Chain) → **1011.png** (star, multi-color variant) or **1020.png**

**Support Spells:**
- Visual effects typically don't need custom spritesheets; use existing FX_ANIMS or reuse main spell effects

### Boss Tier Assignments (Rare Monsters - First Row Only)

**Tier 1-10 Boss Sprites (all use first row of spritesheet):**
- **Tier 1 Boss:** 01.png (row 0)
- **Tier 2 Boss:** 04.png (row 0)
- **Tier 3 Boss:** 07.png (row 0)
- **Tier 4 Boss:** 09.png (row 0)
- **Tier 5 Boss:** 11.png (row 0)
- **Tier 6 Boss:** 16.png (row 0)
- **Tier 7 Boss:** 17.png (row 0)
- **Tier 8 Boss:** 18.png (row 0)
- **Tier 9 Boss:** 21.png (row 0)
- **Tier 10 Boss:** 25.png (row 0)

### Regular Monster Assignments (Freely Chosen)

**Existing 6 monsters → New Sprites:**
- **scrapCrawler** → **02.png** (dark variant)
- **cinderGrub** → **05.png** (orange/fire sprite)
- **frostSprite** → **03.png** (green/frost variant)
- **stormHound** → **06.png** (lightning-themed)
- **voidStalker** → **08.png** (void-themed)
- **blazeWarden** → (Will be replaced by tier boss system)

**New Spellcaster Monsters (Rare, tier-gated):**
- **fireElemental** (Rare, minTier: 2) → **10.png** (fire-themed)
- **frostMage** (Rare, minTier: 3) → **12.png** (frost-themed mage)
- **stormCaller** (Rare, minTier: 4) → **13.png** (storm-themed)
- **voidAdept** (Rare, minTier: 5) → **14.png** (void-themed)

---

## File Structure Notes

- Each PNG is a **spritesheet** containing multiple animation frames
- **Spell effects:** 64x64 frame size, 6-8 columns × multiple rows (animation progression)
- **Monsters:** 80x80 frame size, multiple animation frames per monster
- **Colors within each file:** Same effect/monster type, different color variations (for recoloring in code or theme selection)

---

## Next Steps for Implementation

1. Choose color variant from each file that matches the spell/monster aesthetic
2. Update `spriteConfig.ts` to reference these files and their frame dimensions
3. Create animation configs for each effect type
4. Test frame count and animation timing
