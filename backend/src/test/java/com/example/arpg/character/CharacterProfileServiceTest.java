package com.example.arpg.character;

import com.example.arpg.user.UserAccountEntity;
import com.example.arpg.user.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CharacterProfileServiceTest {

    @Mock
    private CharacterProfileRepository characterProfileRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private CharacterStatCalculator characterStatCalculator;

    @InjectMocks
    private CharacterProfileService characterProfileService;

    @Test
    void saveProgressRecalculatesDerivedStatsAndClampsCurrentHealth() {
        CharacterProfileEntity entity = new CharacterProfileEntity();
        UserAccountEntity user = new UserAccountEntity();
        user.setEmail("player@example.com");
        entity.setUser(user);

        CharacterStatsRequest baseStats = new CharacterStatsRequest(2, 3, 4, 5);
        Map<String, Object> derivedStats = Map.of(
                "maxHealth", 200,
                "castSpeedMultiplier", 1.045,
                "critChance", 0.02,
                "spellPowerMultiplier", 1.05
        );
        SaveCharacterProgressRequest request = new SaveCharacterProgressRequest(
                "Warden",
                7,
                80,
                140,
                2,
                999,
                30,
                new LifeFlaskRequest(12),
                baseStats,
                new DerivedStatsRequest(1, 1.0, 0.0, 1.0),
                List.of(),
                Map.of(),
                List.of("stormChain"),
                List.of("fasterCasting"),
                List.of(new SpellProgressRequest("stormChain", 3)),
                List.of(new SpellLinkRequest("stormChain", List.of("fasterCasting"))),
                List.of(new CurrencyStackRequest("mapShard", 4)),
                new MapProgressRequest(2, 1, List.of())
        );

        when(characterProfileRepository.findById(42L)).thenReturn(Optional.of(entity));
        when(characterStatCalculator.deriveStats(baseStats)).thenReturn(derivedStats);
        when(characterStatCalculator.toBaseStatsMap(baseStats)).thenReturn(Map.of(
                "strength", 2,
                "agility", 3,
                "vitality", 4,
                "dexterity", 5
        ));
        when(characterStatCalculator.clampCurrentHealth(999, derivedStats)).thenReturn(200);
        when(characterProfileRepository.save(any(CharacterProfileEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        characterProfileService.saveProgress("player@example.com", 42L, request);

        ArgumentCaptor<CharacterProfileEntity> savedEntity = ArgumentCaptor.forClass(CharacterProfileEntity.class);
        verify(characterProfileRepository).save(savedEntity.capture());
        assertThat(savedEntity.getValue().getDerivedStats()).isEqualTo(derivedStats);
        assertThat(savedEntity.getValue().getCurrentHealth()).isEqualTo(200);
        assertThat(savedEntity.getValue().getBaseStats()).isEqualTo(Map.of(
                "strength", 2,
                "agility", 3,
                "vitality", 4,
                "dexterity", 5
        ));
    }

    @Test
    void saveProgressPreservesUniqueItemEffectFields() {
        CharacterProfileEntity entity = new CharacterProfileEntity();
        UserAccountEntity user = new UserAccountEntity();
        user.setEmail("player@example.com");
        entity.setUser(user);

        CharacterStatsRequest baseStats = new CharacterStatsRequest(1, 1, 1, 1);
        Map<String, Object> derivedStats = Map.of(
                "maxHealth", 120,
                "castSpeedMultiplier", 1.0,
                "critChance", 0.01,
                "spellPowerMultiplier", 1.0
        );
        InventoryItemRequest uniqueItem = new InventoryItemRequest(
                "unique-ring-1",
                "Twinstar Loop",
                "Ring",
                "Unique",
                3,
                List.of("Lightning", "Projectile", "Unique"),
                "twinstarLoop",
                "Projectile spells fire +2 projectiles but deal 10% less damage.",
                Map.of("dexterity", 4, "critChance", 0.03)
        );
        SaveCharacterProgressRequest request = new SaveCharacterProgressRequest(
                "Warden",
                3,
                15,
                140,
                0,
                100,
                250,
                new LifeFlaskRequest(10),
                baseStats,
                new DerivedStatsRequest(1, 1.0, 0.0, 1.0),
                List.of(uniqueItem),
                Map.of("Ring1", uniqueItem),
                List.of("stormChain"),
                List.of("fasterCasting"),
                List.of(new SpellProgressRequest("stormChain", 2)),
                List.of(new SpellLinkRequest("stormChain", List.of("fasterCasting"))),
                List.of(),
                new MapProgressRequest(1, 1, List.of())
        );

        when(characterProfileRepository.findById(7L)).thenReturn(Optional.of(entity));
        when(characterStatCalculator.deriveStats(baseStats)).thenReturn(derivedStats);
        when(characterStatCalculator.toBaseStatsMap(baseStats)).thenReturn(Map.of(
                "strength", 1,
                "agility", 1,
                "vitality", 1,
                "dexterity", 1
        ));
        when(characterStatCalculator.clampCurrentHealth(100, derivedStats)).thenReturn(100);
        when(characterProfileRepository.save(any(CharacterProfileEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        characterProfileService.saveProgress("player@example.com", 7L, request);

        ArgumentCaptor<CharacterProfileEntity> savedEntity = ArgumentCaptor.forClass(CharacterProfileEntity.class);
        verify(characterProfileRepository).save(savedEntity.capture());
        assertThat(savedEntity.getValue().getInventory()).containsExactly(
                Map.of(
                        "id", "unique-ring-1",
                        "name", "Twinstar Loop",
                        "slot", "Ring",
                        "rarity", "Unique",
                        "tier", 3,
                        "tags", List.of("Lightning", "Projectile", "Unique"),
                        "uniqueEffectId", "twinstarLoop",
                        "uniqueEffectDescription", "Projectile spells fire +2 projectiles but deal 10% less damage.",
                        "statBonuses", Map.of("dexterity", 4, "critChance", 0.03)
                )
        );
        assertThat(savedEntity.getValue().getEquippedItems()).containsEntry(
                "Ring1",
                Map.of(
                        "id", "unique-ring-1",
                        "name", "Twinstar Loop",
                        "slot", "Ring",
                        "rarity", "Unique",
                        "tier", 3,
                        "tags", List.of("Lightning", "Projectile", "Unique"),
                        "uniqueEffectId", "twinstarLoop",
                        "uniqueEffectDescription", "Projectile spells fire +2 projectiles but deal 10% less damage.",
                        "statBonuses", Map.of("dexterity", 4, "critChance", 0.03)
                )
        );
    }
}
