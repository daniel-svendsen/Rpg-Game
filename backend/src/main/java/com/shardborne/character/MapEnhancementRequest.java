package com.shardborne.character;

import jakarta.validation.constraints.NotBlank;

public record MapEnhancementRequest(
        @NotBlank String id
) {
}
