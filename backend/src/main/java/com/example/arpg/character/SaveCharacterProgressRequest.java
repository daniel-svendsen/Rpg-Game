package com.example.arpg.character;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SaveCharacterProgressRequest(
        @NotBlank String name,
        @Min(1) int level,
        @Min(0) int experience,
        @Min(1) int experienceToNextLevel,
        @Min(0) int unspentStatPoints,
        @Min(0) int currentHealth,
        @Min(0) int gold,
        @NotNull @Valid LifeFlaskRequest lifeFlask,
        @NotNull @Valid CharacterStatsRequest baseStats,
        @NotNull @Valid DerivedStatsRequest derivedStats,
        @NotNull List<@Valid InventoryItemRequest> inventory,
        @NotNull Map<String, @Valid InventoryItemRequest> equippedItems,
        @NotNull List<@NotBlank String> unlockedSpellIds,
        @NotNull List<@NotBlank String> unlockedSupportSpellIds,
        @NotNull List<@Valid SpellProgressRequest> spellProgress,
        @NotNull List<@Valid SpellLinkRequest> spellLoadout,
        @NotNull List<@Valid CurrencyStackRequest> currencies,
        @NotNull @Valid MapProgressRequest mapProgress
) {
}
