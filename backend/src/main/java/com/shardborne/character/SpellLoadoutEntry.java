package com.shardborne.character;

import java.util.List;

public record SpellLoadoutEntry(
        String mainSpellId,
        List<String> supportSpellIds
) {
}
