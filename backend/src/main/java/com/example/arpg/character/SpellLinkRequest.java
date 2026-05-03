package com.example.arpg.character;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SpellLinkRequest(
        @NotBlank String mainSpellId,
        @NotNull @Size(max = 2) List<@NotBlank String> supportSpellIds
) {
}

