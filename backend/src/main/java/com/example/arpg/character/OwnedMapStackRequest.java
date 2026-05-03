package com.example.arpg.character;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record OwnedMapStackRequest(
        @NotBlank String mapId,
        @Min(0) int tier,
        @Min(1) int quantity
) {
}

