package com.example.arpg.character;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record SupportProgressRequest(
        @NotBlank String supportSpellId,
        @Min(1) int level
) {
}
