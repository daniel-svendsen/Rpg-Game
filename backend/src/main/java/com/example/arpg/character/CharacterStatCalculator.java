package com.example.arpg.character;

import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class CharacterStatCalculator {

    private static final int BASE_HEALTH = 100;
    private static final int VITALITY_HEALTH_MULTIPLIER = 14;
    private static final double AGILITY_CAST_SPEED_MULTIPLIER = 0.015;
    private static final double DEXTERITY_CRIT_CHANCE_MULTIPLIER = 0.004;
    private static final double STRENGTH_SPELL_POWER_MULTIPLIER = 0.025;

    public Map<String, Object> deriveStats(CharacterStatsRequest baseStats) {
        return Map.of(
                "maxHealth", BASE_HEALTH + baseStats.vitality() * VITALITY_HEALTH_MULTIPLIER,
                "castSpeedMultiplier", 1 + baseStats.agility() * AGILITY_CAST_SPEED_MULTIPLIER,
                "critChance", baseStats.dexterity() * DEXTERITY_CRIT_CHANCE_MULTIPLIER,
                "spellPowerMultiplier", 1 + baseStats.strength() * STRENGTH_SPELL_POWER_MULTIPLIER
        );
    }

    public int clampCurrentHealth(int currentHealth, Map<String, Object> derivedStats) {
        int maxHealth = ((Number) derivedStats.getOrDefault("maxHealth", BASE_HEALTH)).intValue();
        return Math.max(0, Math.min(currentHealth, maxHealth));
    }

    public Map<String, Object> toBaseStatsMap(CharacterStatsRequest baseStats) {
        return Map.of(
                "strength", baseStats.strength(),
                "agility", baseStats.agility(),
                "vitality", baseStats.vitality(),
                "dexterity", baseStats.dexterity()
        );
    }
}
