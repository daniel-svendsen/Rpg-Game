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
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
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

        CharacterStatsRequest baseStats = new CharacterStatsRequest(2, 3, 4, 5, 0);
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
                List.of(),
                List.of(new SpellProgressRequest("stormChain", 3)),
                List.of(new SupportProgressRequest("fasterCasting", 2)),
                List.of(new SpellLinkRequest("stormChain", List.of("fasterCasting"))),
                List.of(new CurrencyStackRequest("mapShard", 4)),
                new MapProgressRequest(2, 1, List.of(), List.of())
        );

        when(characterProfileRepository.findById(42L)).thenReturn(Optional.of(entity));
        when(characterStatCalculator.deriveStats(baseStats)).thenReturn(derivedStats);
        when(characterStatCalculator.toBaseStatsMap(baseStats)).thenReturn(Map.of(
                "strength", 2,
                "agility", 3,
                "vitality", 4,
                "dexterity", 5,
                "intelligence", 0
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
                "dexterity", 5,
                "intelligence", 0
        ));
    }

    @Test
    void saveProgressPreservesUniqueItemEffectFields() {
        CharacterProfileEntity entity = new CharacterProfileEntity();
        UserAccountEntity user = new UserAccountEntity();
        user.setEmail("player@example.com");
        entity.setUser(user);

        CharacterStatsRequest baseStats = new CharacterStatsRequest(1, 1, 1, 1, 0);
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
                List.of(),
                List.of(new SpellProgressRequest("stormChain", 2)),
                List.of(new SupportProgressRequest("fasterCasting", 2)),
                List.of(new SpellLinkRequest("stormChain", List.of("fasterCasting"))),
                List.of(),
                new MapProgressRequest(1, 1, List.of(), List.of())
        );

        when(characterProfileRepository.findById(7L)).thenReturn(Optional.of(entity));
        when(characterStatCalculator.deriveStats(baseStats)).thenReturn(derivedStats);
        when(characterStatCalculator.toBaseStatsMap(baseStats)).thenReturn(Map.of(
                "strength", 1,
                "agility", 1,
                "vitality", 1,
                "dexterity", 1,
                "intelligence", 0
        ));
        when(characterStatCalculator.clampCurrentHealth(100, derivedStats)).thenReturn(100);
        when(characterProfileRepository.save(any(CharacterProfileEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        characterProfileService.saveProgress("player@example.com", 7L, request);

        ArgumentCaptor<CharacterProfileEntity> savedEntity = ArgumentCaptor.forClass(CharacterProfileEntity.class);
        verify(characterProfileRepository).save(savedEntity.capture());
        assertThat(savedEntity.getValue().getInventory()).containsExactly(
                new InventoryItemData(
                        "unique-ring-1",
                        "Twinstar Loop",
                        "Ring",
                        "Unique",
                        3,
                        List.of("Lightning", "Projectile", "Unique"),
                        "twinstarLoop",
                        "Projectile spells fire +2 projectiles but deal 10% less damage.",
                        Map.of("dexterity", 4, "critChance", 0.03)
                )
        );
        assertThat(savedEntity.getValue().getEquippedItems()).containsEntry(
                "Ring1",
                new InventoryItemData(
                        "unique-ring-1",
                        "Twinstar Loop",
                        "Ring",
                        "Unique",
                        3,
                        List.of("Lightning", "Projectile", "Unique"),
                        "twinstarLoop",
                        "Projectile spells fire +2 projectiles but deal 10% less damage.",
                        Map.of("dexterity", 4, "critChance", 0.03)
                )
        );
    }

    @Test
    void createSaveAndLoadRoundTripsProgressionState() {
        UserAccountEntity user = new UserAccountEntity();
        user.setEmail("player@example.com");
        AtomicLong nextId = new AtomicLong(1);
        AtomicReference<CharacterProfileEntity> storedCharacter = new AtomicReference<>();

        when(userAccountRepository.findByEmail("player@example.com")).thenReturn(Optional.of(user));
        when(characterProfileRepository.findByUserEmail("player@example.com"))
                .thenAnswer(invocation -> Optional.ofNullable(storedCharacter.get()));
        when(characterProfileRepository.findById(any())).thenAnswer(invocation -> {
            CharacterProfileEntity entity = storedCharacter.get();
            if (entity != null && entity.getId().equals(invocation.getArgument(0))) {
                return Optional.of(entity);
            }
            return Optional.empty();
        });
        when(characterProfileRepository.save(any(CharacterProfileEntity.class))).thenAnswer(invocation -> {
            CharacterProfileEntity entity = invocation.getArgument(0);
            if (entity.getId() == null) {
                setEntityId(entity, nextId.getAndIncrement());
            }
            storedCharacter.set(entity);
            return entity;
        });

        CharacterStatsRequest createStats = new CharacterStatsRequest(2, 1, 3, 0, 0);
        Map<String, Object> initialDerivedStats = Map.of(
                "maxHealth", 140,
                "castSpeedMultiplier", 1.01,
                "critChance", 0.01,
                "spellPowerMultiplier", 1.0
        );
        when(characterStatCalculator.deriveStats(createStats)).thenReturn(initialDerivedStats);
        when(characterStatCalculator.toBaseStatsMap(createStats)).thenReturn(Map.of(
                "strength", 2,
                "agility", 1,
                "vitality", 3,
                "dexterity", 0,
                "intelligence", 0
        ));

        CharacterResponse created = characterProfileService.createCharacter(
                "player@example.com",
                new CreateCharacterRequest("Warden", createStats)
        );

        assertThat(created.id()).isEqualTo(1L);
        assertThat(created.lifeFlask()).isEqualTo(new LifeFlaskState(18));
        assertThat(created.unlockedSpellIds()).containsExactly("stormChain", "emberBurst");

        CharacterStatsRequest updatedStats = new CharacterStatsRequest(4, 3, 5, 2, 2);
        Map<String, Object> updatedDerivedStats = Map.of(
                "maxHealth", 220,
                "castSpeedMultiplier", 1.08,
                "critChance", 0.05,
                "spellPowerMultiplier", 1.12
        );
        when(characterStatCalculator.deriveStats(updatedStats)).thenReturn(updatedDerivedStats);
        when(characterStatCalculator.toBaseStatsMap(updatedStats)).thenReturn(Map.of(
                "strength", 4,
                "agility", 3,
                "vitality", 5,
                "dexterity", 2,
                "intelligence", 2
        ));
        when(characterStatCalculator.clampCurrentHealth(999, updatedDerivedStats)).thenReturn(220);

        InventoryItemRequest bodyArmor = new InventoryItemRequest(
                "armor-1",
                "Titan Carapace",
                "BodyArmor",
                "Unique",
                5,
                List.of("Physical", "Unique"),
                "titanCarapace",
                "14% less contact damage taken.",
                Map.of("vitality", 8, "maxHealth", 25)
        );
        SaveCharacterProgressRequest saveRequest = new SaveCharacterProgressRequest(
                "Warden",
                8,
                275,
                320,
                2,
                999,
                640,
                new LifeFlaskRequest(7),
                updatedStats,
                new DerivedStatsRequest(1, 1.0, 0.0, 1.0),
                List.of(bodyArmor),
                Map.of("BodyArmor", bodyArmor),
                List.of("stormChain", "emberBurst", "glacialNova"),
                List.of("fasterCasting", "moreDamage"),
                List.of("swiftnessAura"),
                List.of(
                        new SpellProgressRequest("stormChain", 5),
                        new SpellProgressRequest("emberBurst", 3)
                ),
                List.of(
                        new SupportProgressRequest("fasterCasting", 4),
                        new SupportProgressRequest("swiftnessAura", 6)
                ),
                List.of(new SpellLinkRequest("stormChain", List.of("fasterCasting", "moreDamage"))),
                List.of(
                        new CurrencyStackRequest("mapShard", 9),
                        new CurrencyStackRequest("chaosShard", 2)
                ),
                new MapProgressRequest(
                        3,
                        2,
                        List.of(new OwnedMapStackRequest(
                                "tier-3-map",
                                "cryptDepths",
                                3,
                                2,
                                List.of(new MapEnhancementRequest("overflowingSpoils"))
                        )),
                        List.of(1)
                )
        );

        characterProfileService.saveProgress("player@example.com", created.id(), saveRequest);
        CharacterResponse loaded = characterProfileService.getCurrentCharacter("player@example.com");

        assertThat(loaded.level()).isEqualTo(8);
        assertThat(loaded.currentHealth()).isEqualTo(220);
        assertThat(loaded.baseStats()).containsEntry("intelligence", 2);
        assertThat(loaded.lifeFlask()).isEqualTo(new LifeFlaskState(7));
        assertThat(loaded.inventory()).containsExactly(
                new InventoryItemData(
                        "armor-1",
                        "Titan Carapace",
                        "BodyArmor",
                        "Unique",
                        5,
                        List.of("Physical", "Unique"),
                        "titanCarapace",
                        "14% less contact damage taken.",
                        Map.of("vitality", 8, "maxHealth", 25)
                )
        );
        assertThat(loaded.equippedItems()).containsEntry(
                "BodyArmor",
                new InventoryItemData(
                        "armor-1",
                        "Titan Carapace",
                        "BodyArmor",
                        "Unique",
                        5,
                        List.of("Physical", "Unique"),
                        "titanCarapace",
                        "14% less contact damage taken.",
                        Map.of("vitality", 8, "maxHealth", 25)
                )
        );
        assertThat(loaded.spellProgress()).containsExactly(
                new SpellProgressState("stormChain", 5),
                new SpellProgressState("emberBurst", 3)
        );
        assertThat(loaded.passiveSupportIds()).containsExactly("swiftnessAura");
        assertThat(loaded.supportProgress()).containsExactly(
                new SupportProgressState("fasterCasting", 4),
                new SupportProgressState("swiftnessAura", 6)
        );
        assertThat(loaded.spellLoadout()).containsExactly(
                new SpellLoadoutEntry("stormChain", List.of("fasterCasting", "moreDamage"))
        );
        assertThat(loaded.currencies()).containsExactly(
                new CurrencyStackData("mapShard", 9),
                new CurrencyStackData("chaosShard", 2)
        );
        assertThat(loaded.mapProgress()).isEqualTo(new MapProgressData(
                3,
                2,
                List.of(new OwnedMapStackData(
                        "tier-3-map",
                        "cryptDepths",
                        3,
                        2,
                        List.of(new MapEnhancementData("overflowingSpoils"))
                )),
                List.of(1)
        ));
    }

    private void setEntityId(CharacterProfileEntity entity, long id) {
        try {
            var field = CharacterProfileEntity.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (ReflectiveOperationException exception) {
            throw new AssertionError("Failed to assign test entity id", exception);
        }
    }
}
