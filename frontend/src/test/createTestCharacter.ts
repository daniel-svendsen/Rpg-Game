import { createNewCharacter } from "../game/domain/player/playerTypes";
import type { CharacterRecord } from "../shared/types/saveTypes";

export const createTestCharacter = (overrides: Partial<CharacterRecord> = {}): CharacterRecord => {
  const baseCharacter = createNewCharacter("Test Warden", {
    strength: 0,
    agility: 0,
    vitality: 0,
    dexterity: 0,
    intelligence: 0
  });

  return {
    ...baseCharacter,
    ...overrides,
    baseStats: overrides.baseStats ?? baseCharacter.baseStats,
    derivedStats: overrides.derivedStats ?? baseCharacter.derivedStats,
    lifeFlask: overrides.lifeFlask ?? baseCharacter.lifeFlask,
    inventory: overrides.inventory ?? baseCharacter.inventory,
    equippedItems: overrides.equippedItems ?? baseCharacter.equippedItems,
    unlockedSpellIds: overrides.unlockedSpellIds ?? baseCharacter.unlockedSpellIds,
    unlockedSupportSpellIds: overrides.unlockedSupportSpellIds ?? baseCharacter.unlockedSupportSpellIds,
    spellProgress: overrides.spellProgress ?? baseCharacter.spellProgress,
    spellLoadout: overrides.spellLoadout ?? baseCharacter.spellLoadout,
    currencies: overrides.currencies ?? baseCharacter.currencies,
    mapProgress: overrides.mapProgress ?? baseCharacter.mapProgress
  };
};
