package com.shardborne.character;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCharacterRequest(
        @NotBlank String name,
        @NotNull @Valid CharacterStatsRequest baseStats
) {
}
