package com.example.arpg.character;

import java.util.List;

public record OwnedMapStackData(
        String stackId,
        String mapId,
        int tier,
        int quantity,
        List<MapEnhancementData> enhancements
) {
}
