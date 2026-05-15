package com.example.arpg.character;

import java.time.Instant;

public record CharacterSummaryResponse(
        Long id,
        String name,
        int level,
        Instant createdAt
) {}
