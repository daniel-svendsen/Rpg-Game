package com.example.arpg.character;

import java.util.List;
import java.util.Map;

public record InventoryItemData(
        String id,
        String name,
        String slot,
        String rarity,
        int tier,
        List<String> tags,
        String uniqueEffectId,
        String uniqueEffectDescription,
        List<Map<String, Object>> affixes,
        Map<String, Object> statBonuses
) {
}
