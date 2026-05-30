package com.shardborne.character;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MapProgressData(
        int highestUnlockedTier,
        int lastCompletedTier,
        List<OwnedMapStackData> consumableMaps,
        List<Integer> clearedBossTiers
) {
}
