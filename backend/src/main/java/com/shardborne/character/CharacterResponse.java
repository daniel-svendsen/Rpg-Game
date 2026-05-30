package com.shardborne.character;

import java.util.List;
import java.util.Map;

public record CharacterResponse(
        Long id,
        String name,
        int level,
        int experience,
        int experienceToNextLevel,
        int unspentStatPoints,
        int currentHealth,
        int gold,
        LifeFlaskState lifeFlask,
        Map<String, Object> baseStats,
        Map<String, Object> derivedStats,
        List<InventoryItemData> inventory,
        Map<String, InventoryItemData> equippedItems,
        List<String> unlockedSpellIds,
        List<String> unlockedSupportSpellIds,
        List<String> passiveSupportIds,
        List<SpellProgressState> spellProgress,
        List<SupportProgressState> supportProgress,
        List<SpellLoadoutEntry> spellLoadout,
        List<CurrencyStackData> currencies,
        MapProgressData mapProgress
) {
}
