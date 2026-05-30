package com.shardborne.character;

import jakarta.validation.constraints.Min;

public record LifeFlaskRequest(
        @Min(0) int currentCharges
) {
}
