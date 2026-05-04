package com.example.arpg.character;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record OwnedMapStackRequest(
        @NotBlank String stackId,
        @NotBlank String mapId,
        @Min(0) int tier,
        @Min(1) int quantity,
        List<@Valid MapEnhancementRequest> enhancements
) {
}
