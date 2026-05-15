package com.example.arpg.character;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/characters")
public class CharacterProfileController {

    private final CharacterProfileService characterProfileService;

    public CharacterProfileController(CharacterProfileService characterProfileService) {
        this.characterProfileService = characterProfileService;
    }

    @GetMapping
    public List<CharacterSummaryResponse> listCharacters(Authentication authentication) {
        return characterProfileService.listCharacters(authentication.getName());
    }

    @GetMapping("/{characterId}")
    public CharacterResponse getCharacterById(
            Authentication authentication,
            @PathVariable Long characterId
    ) {
        return characterProfileService.getCharacterById(authentication.getName(), characterId);
    }

    @DeleteMapping("/{characterId}")
    public ResponseEntity<Void> deleteCharacter(
            Authentication authentication,
            @PathVariable Long characterId
    ) {
        characterProfileService.deleteCharacter(authentication.getName(), characterId);
        return ResponseEntity.noContent().build();
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
