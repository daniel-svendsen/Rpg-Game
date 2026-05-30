package com.shardborne.character;

import jakarta.validation.constraints.Min;

public record CharacterStatsRequest(
        @Min(0) int strength,
        @Min(0) int agility,
        @Min(0) int vitality,
        @Min(0) int dexterity,
        @Min(0) int intelligence
) {
}

