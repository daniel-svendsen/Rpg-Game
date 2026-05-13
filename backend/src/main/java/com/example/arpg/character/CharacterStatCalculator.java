package com.example.arpg.character;

import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class CharacterStatCalculator {

    private static final int BASE_HEALTH = 100;
    private static final int VITALITY_HEALTH_MULTIPLIER = 8;
    private static final double STRENGTH_ATTACK_SPEED_MULTIPLIER = 0.005;
    private static final double AGILITY_ATTACK_SPEED_MULTIPLIER = 0.01;
    private static final double DEXTERITY_CRIT_CHANCE_MULTIPLIER = 0.0025;
    private static final double CRIT_CHANCE_CAP = 0.75;
    private static final double INTELLIGENCE_SPELL_POWER_MULTIPLIER = 0.015;
    private static final double INTELLIGENCE_CAST_SPEED_MULTIPLIER = 0.005;

    public Map<String, Object> deriveStats(CharacterStatsRequest baseStats) {
        return Map.of(
                "maxHealth", BASE_HEALTH + baseStats.vitality() * VITALITY_HEALTH_MULTIPLIER,
                "castSpeedMultiplier", 1 + baseStats.intelligence() * INTELLIGENCE_CAST_SPEED_MULTIPLIER,
                "attackSpeedMultiplier", 1 + baseStats.strength() * STRENGTH_ATTACK_SPEED_MULTIPLIER + baseStats.agility() * AGILITY_ATTACK_SPEED_MULTIPLIER,
                "critChance", Math.min(CRIT_CHANCE_CAP, baseStats.dexterity() * DEXTERITY_CRIT_CHANCE_MULTIPLIER),
                "spellPowerMultiplier", 1 + baseStats.intelligence() * INTELLIGENCE_SPELL_POWER_MULTIPLIER
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
                "dexterity", baseStats.dexterity(),
                "intelligence", baseStats.intelligence()
        );
    }
}
