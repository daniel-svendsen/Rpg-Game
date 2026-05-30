package com.shardborne.character;

import java.util.List;

public record OwnedMapStackData(
        String stackId,
        String mapId,
        int tier,
        int quantity,
        List<MapEnhancementData> enhancements
) {
}
