package com.example.arpg.character;

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
        Map<String, Object> lifeFlask,
        Map<String, Object> baseStats,
        Map<String, Object> derivedStats,
        List<Map<String, Object>> inventory,
        Map<String, Object> equippedItems,
        List<String> unlockedSpellIds,
        List<String> unlockedSupportSpellIds,
        List<Map<String, Object>> spellProgress,
        List<Map<String, Object>> spellLoadout,
        List<Map<String, Object>> currencies,
        Map<String, Object> mapProgress
) {
}
