package com.example.arpg.character;

import jakarta.validation.constraints.Min;

public record LifeFlaskRequest(
        @Min(0) int currentCharges
) {
}
