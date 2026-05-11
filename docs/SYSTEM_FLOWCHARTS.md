# System Flowcharts

This document captures the current technical flow for a few high-value systems in Shardborne.

These diagrams aim to reflect shared domain and persistence behavior, not just UI navigation.
When behavior changes, update the relevant diagram alongside the code.

## Combat

Primary code paths:

- `frontend/src/game/domain/combat/arenaSimulation.ts`
- `frontend/src/game/domain/spells/spellEngine.ts`
- `frontend/src/game/domain/combat/combatMath.ts`

```mermaid
flowchart TD
  A["Arena run is active"] --> B["stepArenaRuntime(deltaMs)"]
  B --> C["Advance time and clone runtime state"]
  C --> D{"Auto-move enabled?"}
  D -- Yes --> E["Choose nearest loot target or nearest living pack"]
  E --> F["Move player toward loot or pack center"]
  D -- No --> G["Keep current player position"]
  F --> H["Track moving / fighting telemetry"]
  G --> H
  H --> I["Pick up ground loot within auto-pickup radius"]
  I --> J["Aggro enemies inside aggro radius"]
  J --> K{"Enemy in contact range and damage interval ready?"}
  K -- Yes --> L["Roll evasion, then apply resistance / armor mitigation and damage player"]
  K -- No --> M["Skip enemy contact damage"]
  L --> N{"Active spell loadout and cooldown ready?"}
  M --> N
  N -- No --> O["Continue tick"]
  N -- Yes --> P["Resolve spell from main spell + linked supports"]
  P --> Q["Collect enemies in targeting range"]
  Q --> R{"Area spell?"}
  R -- Yes --> S["Target enemies inside area radius around primary target"]
  R -- No --> T["Build chain / projectile target list"]
  S --> U["Emit SpellVisualEvent for snapshot consumers"]
  T --> U
  U --> V["For each targeted enemy: roll crit, apply penetration and resistance-aware damage"]
  V --> W{"Enemy survives?"}
  W -- Yes --> X["Keep enemy with reduced health"]
  W -- No --> Y["Grant gold, experience, flask charges, telemetry"]
  Y --> Z["Roll ground drops for the kill context"]
  Z --> AA{"Was enemy the key guardian?"}
  AA -- Yes --> AB["Also spawn boss key as ground map item"]
  AA -- No --> AC["No guardian bonus drop"]
  AB --> AD["Remove dead enemy and continue"]
  AC --> AD
  X --> AD
  O --> AD
  AD --> AE["Update cleared packs and retarget auto-move"]
  AE --> AF{"All enemies dead?"}
  AF -- No --> AG["Build snapshot and continue next tick"]
  AF -- Yes --> AH["Start or continue completion delay"]
  AH --> AI{"Completion delay elapsed?"}
  AI -- No --> AG
  AI -- Yes --> AJ["Resolve map completion rewards / boss completion rules"]
  AJ --> AK["Build final ArenaSnapshot"]
```

## Lootdrop

Primary code paths:

- `frontend/src/game/domain/combat/arenaSimulation.ts`
- `frontend/src/game/domain/items/itemGenerator.ts`
- `frontend/src/game/domain/spells/spellDrops.ts`
- `frontend/src/game/config/balance/mapBalance.ts`

```mermaid
flowchart TD
  A["Enemy dies inside arenaSimulation"] --> B["rollGroundDrops(character, mapTier, rarity, map, dropX, dropY)"]
  B --> C["Load tier balance and map context"]
  C --> D{"Item drop roll passes? tier itemDropRate x map drop multipliers"}
  D -- No --> E["Skip item drop path"]
  D -- Yes --> F["Generate item for character"]
  F --> G["Pick item rarity from weighted rarity pool"]
  G --> H{"Rarity is Unique?"}
  H -- Yes --> I["Roll from global unique item pool filtered by minTier and unique weight modifiers"]
  H -- No --> J["Pick eligible item base by tier"]
  I --> K{"Unique found?"}
  K -- Yes --> L["Create unique item payload"]
  K -- No --> J
  J --> M["Roll affixes from slot-specific prefix/suffix pools"]
  M --> N["Apply tier ranges, rarity affix counts, base armor/evasion/speed stats"]
  N --> O["Maybe upgrade Rare into Exceptional Rare"]
  O --> P["Create ground Item payload"]
  L --> P
  E --> Q{"Currency roll passes? map shard / other currency logic"}
  P --> Q
  Q -- Yes --> R["Create ground Currency payload"]
  Q -- No --> S["Skip currency path"]
  R --> T{"Spell drop roll passes?"}
  S --> T
  Q --> T
  T -- Yes --> U["Roll missing spell from spell drop pool gated by map tier and owned spells"]
  T -- No --> V["Skip spell path"]
  U --> W{"Spell id returned?"}
  W -- Yes --> X["Create ground Spell payload"]
  W -- No --> V
  X --> Y{"Map drop roll passes?"}
  V --> Y
  Y -- Yes --> Z["Create same-tier map ground payload"]
  Y -- No --> AA["Skip same-tier map"]
  Z --> AB{"Next-tier maps unlocked by cleared boss?"}
  AA --> AB
  AB -- Yes --> AC{"Next-tier map roll passes?"}
  AB -- No --> AD["No next-tier map eligible"]
  AC -- Yes --> AE["Create next-tier map ground payload"]
  AC -- No --> AD
  AE --> AF["Return all ground loot entries"]
  AD --> AF
```

### Pickup And Outcome

```mermaid
flowchart TD
  A["Player enters auto-pickup radius of ground loot"] --> B["applyGroundLootPickup(character, entry, autoSellSettings)"]
  B --> C{"Payload kind?"}
  C -- Item --> D{"Auto-sell enabled for rarity and item not Unique?"}
  D -- Yes --> E["Convert to gold using power-score sell price floor/multiplier"]
  D -- No --> F["Append item to inventory and compute upgrade metadata"]
  C -- Currency --> G["Add or merge currency stack"]
  C -- Spell --> H["Append spell id to unlockedSpellIds"]
  C -- Map --> I["Add consumable map stack to map inventory"]
  I --> J{"Boss key mapId?"}
  J -- Yes --> K["Show boss-key-specific loot message"]
  J -- No --> L["Show normal map loot message"]
  E --> M["Emit loot event and remove ground loot"]
  F --> M
  G --> M
  H --> M
  K --> M
  L --> M
```

## Login

Primary code paths:

- `frontend/src/app/App.tsx`
- `frontend/src/api/authApi.ts`
- `backend/src/main/java/com/example/arpg/auth/AuthController.java`
- `backend/src/main/java/com/example/arpg/auth/AuthService.java`
- `backend/src/main/java/com/example/arpg/config/SecurityConfig.java`
- `backend/src/main/java/com/example/arpg/security/JwtAuthenticationFilter.java`

```mermaid
flowchart TD
  A["User submits login or register form in App"] --> B["Frontend calls authApi.register or authApi.login"]
  B --> C["POST /api/auth/register or /api/auth/login"]
  C --> D["authSecurityFilterChain matches /api/auth/** and permits request"]
  D --> E["AuthController receives validated AuthRequest"]
  E --> F{"Register path?"}
  F -- Register --> G{"Email already exists?"}
  G -- Yes --> H["Throw AuthException CONFLICT / EMAIL_ALREADY_REGISTERED"]
  G -- No --> I["Hash password and save user account"]
  I --> J["Generate JWT for saved user"]
  F -- Login --> K["AuthenticationManager authenticates email + password"]
  K --> L{"Authentication succeeded?"}
  L -- No --> M["Throw AuthException UNAUTHORIZED / INVALID_CREDENTIALS"]
  L -- Yes --> N["Generate JWT for authenticated user"]
  J --> O["Return AuthResponse token"]
  N --> O
  H --> P["ApiExceptionHandler returns structured error JSON"]
  M --> P
  O --> Q["Frontend stores token in localStorage and updates app state"]
  Q --> R["Frontend loads /api/characters/me with token"]
  R --> S["applicationSecurityFilterChain applies JwtAuthenticationFilter"]
  S --> T{"Bearer token present and valid?"}
  T -- Yes --> U["Set authenticated SecurityContext and allow protected request"]
  T -- No --> V["Leave request unauthenticated; protected endpoints return 401/403"]
```

## Boss

Primary code paths:

- `frontend/src/app/useMapActions.ts`
- `frontend/src/game/domain/combat/arenaSimulation.ts`
- `frontend/src/game/domain/maps/mapProgress.ts`

```mermaid
flowchart TD
  A["Player runs a non-boss tier map"] --> B["createMonsterPacks() decides whether a key guardian should exist"]
  B --> C{"Eligible tier map and guardian spawn roll passes? 10% uncleared / 5% cleared"}
  C -- No --> D["Map proceeds without key guardian"]
  C -- Yes --> E["Mark one Rare monster as isKeyGuardian"]
  E --> F{"Guardian dies?"}
  F -- No --> G["No boss key drops this run"]
  F -- Yes --> H["Spawn ground Map payload bossTierN at guardian location"]
  H --> I["Player picks up boss key as consumable map item"]
  I --> J["Boss key stays in map inventory until a boss run succeeds"]
  J --> K["Player chooses Start Boss Tier in hub"]
  K --> L{"Boss tier <= highestUnlockedTier and boss key owned?"}
  L -- No --> M["Show locked / missing-key error"]
  L -- Yes --> N["useMapActions consumes one key up front to enter arena"]
  N --> O["Arena runtime starts bossTierN map with 1 boss pack"]
  O --> P{"Boss run completes successfully?"}
  P -- No --> Q["Run ends; no extra progression unlocks"]
  P -- Yes --> R["stepArenaRuntime completion logic checks first-clear state"]
  R --> S{"First clear of this boss tier?"}
  S -- Yes --> T["Mark boss tier cleared and raise highestUnlockedTier to tier+1"]
  T --> U["Grant 3 starter maps of next tier if below max tier"]
  T --> V["Consume boss key stack from inventory on successful clear"]
  S -- No --> W["Consume one boss key stack on repeat successful clear"]
  V --> X["Boss run ends with updated progression"]
  W --> X
  Q --> X
```

## Save / Load / Autosave

Primary code paths:

- `frontend/src/app/App.tsx`
- `frontend/src/app/useCharacterPersistence.ts`
- `frontend/src/app/characterPersistence.ts`
- `frontend/src/app/useArenaSession.ts`
- `frontend/src/api/gameApi.ts`
- `backend/src/main/java/com/example/arpg/character/CharacterProfileService.java`

```mermaid
flowchart TD
  A["App starts with token in localStorage?"] --> B{"Token exists?"}
  B -- No --> C["Show auth screen and clear local character state"]
  B -- Yes --> D["loadCharacterWithAuthState(token)"]
  D --> E{"Unauthorized?"}
  E -- Yes --> F["Remove token, send user back to auth"]
  E -- No --> G{"Character returned?"}
  G -- No --> H["Show character creation screen"]
  G -- Yes --> I["Normalize character and hydrateCharacter()"]
  I --> J["latestCharacterRef, lastPersistedSnapshot, and UI state sync to backend state"]
  J --> K["User plays in hub or arena"]
  K --> L["commitCharacter() updates latestCharacterRef and UI state as local truth"]
  L --> M{"Autosave interval fires?"}
  M -- No --> N["Wait for next state change or interval"]
  M -- Yes --> O{"shouldAutosaveCharacter? token, enabled, changed snapshot, no in-flight save"}
  O -- No --> N
  O -- Yes --> P["Serialize current local character snapshot"]
  P --> Q["PUT /api/characters/{id}/progress"]
  Q --> R["Backend saveProgress maps request into persistence shape and saves entity"]
  R --> S["Backend returns saved CharacterResponse"]
  S --> T["Frontend normalizes returned character"]
  T --> U{"Local latestCharacter still matches requested snapshot?"}
  U -- Yes --> V["Hydrate save response into refs and UI state"]
  U -- No --> W["Only update lastPersistedSnapshot; keep newer local state"]
  V --> N
  W --> N
```

### Manual Save And Arena Priority

```mermaid
flowchart TD
  A["User presses Save"] --> B["resolveManualSaveCharacter()"]
  B --> C{"Currently in arena?"}
  C -- Yes --> D["Prefer arenaRuntime.snapshot.player"]
  D --> E{"Arena runtime missing?"}
  E -- Yes --> F["Fallback to latestCharacterRef, then character state"]
  E -- No --> G["Use live arena character state"]
  C -- No --> H["Use latestCharacterRef, then character state"]
  F --> I["saveCharacterManually(nextCharacter)"]
  G --> I
  H --> I
  I --> J["Serialize request snapshot and PUT progress"]
  J --> K["Hydrate response only if local state still matches request"]
```

## Map Progression

Primary code paths:

- `frontend/src/app/useMapActions.ts`
- `frontend/src/app/mapFlow.ts`
- `frontend/src/game/domain/maps/mapProgress.ts`
- `frontend/src/game/domain/combat/arenaSimulation.ts`

```mermaid
flowchart TD
  A["New character starts"] --> B["Initial mapProgress: highestUnlockedTier=1, lastCompletedTier=0, no consumable maps"]
  B --> C["Training Grounds is always available without map ownership"]
  C --> D["Player earns Map Shards, maps, and boss keys through runs"]
  D --> E{"Craft or obtain a consumable map?"}
  E -- Yes --> F["addOwnedMap() merges stack by mapId+tier+enhancements signature"]
  E -- No --> G["Stay on current progression state"]
  F --> H["Map inventory sorted by tier, mapId, enhancement count, stackId"]
  H --> I["Player selects a map stack or Training Grounds"]
  I --> J{"Starting normal tier map?"}
  J -- Yes --> K{"Owned stack exists and tier <= highestUnlockedTier?"}
  K -- No --> L["Reject start: map locked or not owned"]
  K -- Yes --> M["Consume one map stack entry up front and enter arena"]
  J -- No --> N{"Starting boss map?"}
  N -- Yes --> O{"Boss key owned and boss tier <= highestUnlockedTier?"}
  O -- No --> P["Reject start: boss lair locked or key missing"]
  O -- Yes --> Q["Consume one boss key item up front and enter boss arena"]
  M --> R["Arena run updates lastCompletedTier on successful completion"]
  Q --> R
  R --> S{"Boss map first clear?"}
  S -- No --> T["No tier unlock change"]
  S -- Yes --> U["clearBossTier() marks tier cleared and raises highestUnlockedTier to tier+1"]
  U --> V["Grant 3 next-tier starter maps"]
  R --> W{"Enemy drop logic checks if boss tier is already cleared"}
  W --> X{"Cleared relevant boss tier?"}
  X -- Yes --> Y["Next-tier map drops are eligible"]
  X -- No --> Z["Only same-tier map progression drops stay eligible"]
  Y --> AA["Player can keep farming same tier or push upward"]
  Z --> AA
  T --> AA
  V --> AA
```
