package com.example.arpg.character;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record CreateCharacterRequest(
        @NotBlank String name,
        @NotNull Map<String, Object> baseStats
) {
}

