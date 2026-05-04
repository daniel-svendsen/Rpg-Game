package com.example.arpg.character;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public record InventoryItemRequest(
        @NotBlank String id,
        @NotBlank String name,
        String slot,
        @NotBlank String rarity,
        @Min(1) int tier,
        @NotEmpty List<@NotBlank String> tags,
        String uniqueEffectId,
        String uniqueEffectDescription,
        @NotNull Map<String, Object> statBonuses
) {
}
