package com.example.arpg.character;

import java.util.List;

public record MapProgressData(
        int highestUnlockedTier,
        int lastCompletedTier,
        List<OwnedMapStackData> consumableMaps
) {
}
