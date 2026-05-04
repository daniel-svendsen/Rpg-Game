package com.example.arpg.character;

import jakarta.validation.constraints.NotBlank;

public record MapEnhancementRequest(
        @NotBlank String id
) {
}
