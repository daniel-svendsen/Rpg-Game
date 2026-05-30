package com.shardborne.character;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record SpellProgressRequest(
        @NotBlank String spellId,
        @Min(1) int level
) {
}
