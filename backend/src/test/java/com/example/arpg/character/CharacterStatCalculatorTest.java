package com.example.arpg.character;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class CharacterStatCalculatorTest {

    private final CharacterStatCalculator calculator = new CharacterStatCalculator();

    @Test
    void deriveStatsUsesConfiguredScaling() {
        CharacterStatsRequest baseStats = new CharacterStatsRequest(3, 4, 5, 6, 7);

        Map<String, Object> derivedStats = calculator.deriveStats(baseStats);

        assertThat(derivedStats).containsEntry("maxHealth", 140);
        assertThat(derivedStats).containsEntry("castSpeedMultiplier", 1.035);
        assertThat(derivedStats).containsEntry("attackSpeedMultiplier", 1.055);
        assertThat(derivedStats).containsEntry("critChance", 0.015);
        assertThat(derivedStats).containsEntry("spellPowerMultiplier", 1.105);
    }

    @Test
    void clampCurrentHealthKeepsValuesWithinAllowedRange() {
        Map<String, Object> derivedStats = Map.of("maxHealth", 156);

        assertThat(calculator.clampCurrentHealth(999, derivedStats)).isEqualTo(156);
        assertThat(calculator.clampCurrentHealth(-4, derivedStats)).isZero();
        assertThat(calculator.clampCurrentHealth(80, derivedStats)).isEqualTo(80);
    }
}
