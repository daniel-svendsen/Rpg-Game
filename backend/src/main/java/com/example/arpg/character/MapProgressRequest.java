package com.example.arpg.character;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record MapProgressRequest(
        @Min(0) int highestUnlockedTier,
        @Min(0) int lastCompletedTier,
        @NotNull List<@Valid OwnedMapStackRequest> consumableMaps
) {
}

