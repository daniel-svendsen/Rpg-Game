package com.example.arpg.character;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/characters")
public class CharacterProfileController {

    private final CharacterProfileService characterProfileService;

    public CharacterProfileController(CharacterProfileService characterProfileService) {
        this.characterProfileService = characterProfileService;
    }

    @GetMapping("/me")
    public CharacterResponse getCurrentCharacter(Authentication authentication) {
        return characterProfileService.getCurrentCharacter(authentication.getName());
    }

    @PostMapping
    public CharacterResponse createCharacter(
            Authentication authentication,
            @Valid @RequestBody CreateCharacterRequest request
    ) {
        return characterProfileService.createCharacter(authentication.getName(), request);
    }

    @PutMapping("/{characterId}/progress")
    public CharacterResponse saveProgress(
            Authentication authentication,
            @PathVariable Long characterId,
            @Valid @RequestBody SaveCharacterProgressRequest request
    ) {
        return characterProfileService.saveProgress(authentication.getName(), characterId, request);
    }
}
