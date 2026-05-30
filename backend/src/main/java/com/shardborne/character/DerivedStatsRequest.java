package com.shardborne.character;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;

public record DerivedStatsRequest(
        @Min(1) int maxHealth,
        @DecimalMin("1.0") double castSpeedMultiplier,
        @DecimalMin("0.0") double critChance,
        @DecimalMin("1.0") double spellPowerMultiplier
) {
}

