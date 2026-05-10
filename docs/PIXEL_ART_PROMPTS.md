# Pixel Art Prompt Library

## Purpose

This document provides reusable prompt templates and current asset data for generating monster and spell pixel art sprite sheets.

Use it when creating new enemy sprites or combat effect sprites in external image models such as Gemini Nano Banana.

---

## Monster Master Prompt

Copy this prompt first, then append one monster data block from the list below.

```text
Create a pixel art enemy sprite sheet for a retro dungeon RPG.
Output format: one single PNG image with a true transparent background and real alpha channel.
Important: background pixels must be fully transparent. Do not include any checkerboard preview pattern, gray transparency grid, solid background color, or frame divider lines.
Canvas size: 128x32 pixels total.
Frame layout: 4 idle animation frames in one horizontal row.
Frame size: 32x32 pixels per frame.
Keep each frame fully contained inside its own 32x32 area with 1-2 pixels of transparent padding around the sprite.
Style: dark retro dungeon RPG, similar in spirit to 0x72 DungeonTilesetII.
Use crisp readable pixel clusters, clean black outlines, muted base colors, minimal selective shading, and no anti-aliasing.
Animation: idle only, 4 frames of subtle motion.
Prioritize strong silhouette readability at very small size during crowded combat.
Do not include UI, text, backgrounds, frame separator lines, floor shadows outside the sprite, blur, soft airbrush gradients, or glow outside sprite bounds.
Technical requirement: the PNG must contain real transparency in the alpha channel. Do not simulate transparency with a checkerboard pattern.
Use this enemy data:
```

---

## Spell / Effect Master Prompt

Copy this prompt first, then append one spell/effect data block from the list below.

```text
Create a pixel art spell effect sprite sheet for a retro dungeon RPG.
Output format: one single PNG image with a true transparent background and real alpha channel.
Important: background pixels must be fully transparent. Do not include any checkerboard preview pattern, gray transparency grid, solid background color, or frame divider lines.
Canvas size: 128x32 pixels total.
Frame layout: 4 animation frames in one horizontal row.
Frame size: 32x32 pixels per frame.
Keep each frame fully contained inside its own 32x32 area with 1-2 pixels of transparent padding around the effect.
Style: readable retro dungeon RPG combat effect, crisp pixel art, controlled brightness, clean shape language, no anti-aliasing, no blurry gradients.
Prioritize readability in fast combat at very small size.
Do not include background, UI, text, frame separator lines, smoke clouds unless requested, or particles extending outside frame bounds.
Technical requirement: the PNG must contain real transparency in the alpha channel. Do not simulate transparency with a checkerboard pattern.
Use this effect data:
```

---

## Monster Data Blocks

### Scrap Crawler

```text
Name: Scrap Crawler
Description: small armored insect creature with a slightly mechanical shell
Silhouette: low, wide, squat, beetle-like
Key visual features: segmented shell plates, small legs, compact armored body, hard shell silhouette
Palette: grey, silver, dark steel
Element accent: none, optional faint cold metal glint only
Motion: subtle shell bob, tiny leg twitch
Avoid: oversized claws, sci-fi robot parts, background debris
```

### Cinder Grub

```text
Name: Cinder Grub
Description: small glowing larva creature with an ember core and dripping fire energy
Silhouette: short, rounded, low-to-the-ground worm-like body
Key visual features: ember core visible through body segments, molten mouth, heat cracks, tiny fire drips
Palette: dark charcoal, ember red, orange, hot yellow
Element accent: fire glow contained inside sprite bounds
Motion: ember pulse, body breathing, tiny molten flicker
Avoid: large flames outside body, smoke clouds, complex horns
```

### Frost Sprite

```text
Name: Frost Sprite
Description: tiny wispy fairy silhouette with ice crystal wings
Silhouette: small floating fairy, narrow body, delicate wing shape
Key visual features: crystal wings, faint glowing core, icy pointed wing tips, ethereal body
Palette: icy blue, pale cyan, white
Element accent: cold glow contained inside sprite bounds
Motion: gentle hover, wing shimmer, soft cold pulse
Avoid: butterfly look, warm colors, thick heavy body
```

### Storm Hound

```text
Name: Storm Hound
Description: wolf-like creature with crackling electricity along its spine
Silhouette: medium quadruped, forward-leaning, fast predator stance
Key visual features: sharp muzzle, arched back, electric spine sparks, tense legs
Palette: dark fur, electric yellow, purple accents
Element accent: lightning crackle along spine only
Motion: subtle breathing, tail twitch, electric flicker
Avoid: oversized mane, fire effects, bulky bear-like proportions
```

### Void Stalker

```text
Name: Void Stalker
Description: tall shadowy humanoid in a dark cloak with no visible face
Silhouette: tall, narrow, upright, ominous hooded figure
Key visual features: hood, empty face shadow, long sleeves or cloak folds, faint void core or eyes
Palette: dark purple, black, muted violet
Element accent: faint void glow in eyes or chest only
Motion: slow cloak sway, eerie stillness, subtle shadow pulse
Avoid: bright colors, obvious armor, visible human face
```

### Blaze Warden

```text
Name: Blaze Warden
Description: armored fire demon with a heavy build and flames on its shoulders
Silhouette: large, broad, imposing, heavy armored demon
Key visual features: thick armor plates, horned or demonic head, shoulder flames, powerful torso
Palette: deep red, dark iron, orange, ember highlights
Element accent: contained shoulder flames and inner fire vents
Motion: heavy idle breathing, shoulder flame flicker, subtle armor shift
Avoid: thin agile body, oversized wings, chaotic flame explosion
```

---

## Spell / Effect Data Blocks

### Storm Chain

```text
Name: Storm Chain
Effect type: chain lightning
Shape language: jagged, branching, sharp
Element: lightning
Palette: electric yellow, pale gold, slight violet accent
Motion: crackle, snap, hop between targets
Visual goal: readable chain lightning between enemies
Avoid: round fireball shapes, large smoke clouds, thick laser beam
```

### Arc Lance

```text
Name: Arc Lance
Effect type: projectile beam
Shape language: straight, narrow, piercing
Element: lightning
Palette: bright yellow, pale gold, faint white core
Motion: fast thrusting beam, brief electric impact flicker
Visual goal: straight piercing lance of lightning
Avoid: branching chain pattern, circular nova, bulky orb
```

### Ember Burst

```text
Name: Ember Burst
Effect type: area explosion
Shape language: circular burst with sharp flame tongues
Element: fire
Palette: orange, ember red, yellow core
Motion: expand outward, flare, fade
Visual goal: compact fiery explosion for area hit
Avoid: long projectile trail, smoky bomb cloud, giant screen-filling blast
```

### Ashen Orbit

```text
Name: Ashen Orbit
Effect type: area explosion
Shape language: circular ember burst, slightly ring-like
Element: fire
Palette: dark ember red, orange, ash grey, yellow highlights
Motion: pulse outward, ember swirl, quick collapse
Visual goal: fiery orbit-style burst with controlled radius feel
Avoid: lightning bolts, icy shards, oversized flames
```

### Glacier Nova

```text
Name: Glacier Nova
Effect type: area explosion
Shape language: circular icy burst, spiked crystalline edges
Element: cold
Palette: pale blue, icy cyan, white
Motion: flash, expand, crystal sparkle fade
Visual goal: cold nova with crisp ice read
Avoid: warm glow, smoke, soft blurry cloud
```

### Tempest Bloom

```text
Name: Tempest Bloom
Effect type: area explosion
Shape language: circular magical burst with mixed jagged and crystalline feel
Element: lightning and cold
Palette: icy blue, pale cyan, electric violet, white highlights
Motion: pulse outward, crackle, shimmer
Visual goal: hybrid storm-and-frost magical bloom
Avoid: pure fire colors, muddy gray smoke, thick solid orb
```

---

## Usage Notes

- Generate one asset at a time.
- If the model keeps adding a fake transparent background, append this line:

```text
Final output must have real alpha transparency and absolutely no visible checkerboard background.
```

- If the model adds vertical separators between frames, append this line:

```text
Do not draw separator lines or borders between frames.
```

- If the model draws the asset too large inside the frame, append this line:

```text
Keep the sprite comfortably inside each 32x32 frame with visible transparent padding on all sides.
```
