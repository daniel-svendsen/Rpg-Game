package com.shardborne.character;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CurrencyStackRequest(
        @NotBlank String code,
        @Min(0) int amount
) {
}

