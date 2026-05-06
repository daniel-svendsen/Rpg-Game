package com.example.arpg.character;

import com.example.arpg.user.UserAccountEntity;
import com.example.arpg.user.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class CharacterProfileService {

    private final CharacterProfileRepository characterProfileRepository;
    private final UserAccountRepository userAccountRepository;
    private final CharacterStatCalculator characterStatCalculator;

    public CharacterProfileService(
            CharacterProfileRepository characterProfileRepository,
            UserAccountRepository userAccountRepository,
            CharacterStatCalculator characterStatCalculator
    ) {
        this.characterProfileRepository = characterProfileRepository;
        this.userAccountRepository = userAccountRepository;
        this.characterStatCalculator = characterStatCalculator;
    }

    @Transactional(readOnly = true)
    public CharacterResponse getCurrentCharacter(String email) {
        return characterProfileRepository.findByUserEmail(email)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Character not found"));
    }

    @Transactional
    public CharacterResponse createCharacter(String email, CreateCharacterRequest request) {
        UserAccountEntity user = userAccountRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        if (characterProfileRepository.findByUserEmail(email).isPresent()) {
            throw new ResponseStatusException(CONFLICT, "A character already exists for this account");
        }

        CharacterProfileEntity character = new CharacterProfileEntity();
        character.setUser(user);
        character.setName(request.name());
        character.setLevel(1);
        character.setExperience(0);
        character.setExperienceToNextLevel(120);
        character.setUnspentStatPoints(0);
        character.setGold(0);
        character.setLifeFlask(new LifeFlaskState(18));
        Map<String, Object> derivedStats = characterStatCalculator.deriveStats(request.baseStats());
        character.setBaseStats(characterStatCalculator.toBaseStatsMap(request.baseStats()));
        character.setDerivedStats(derivedStats);
        character.setCurrentHealth((int) character.getDerivedStats().get("maxHealth"));
        character.setInventory(List.of());
        character.setEquippedItems(Map.of());
        character.setUnlockedSpellIds(List.of("stormChain", "emberBurst"));
        character.setUnlockedSupportSpellIds(List.of("increasedCriticalChance", "fasterCasting", "moreDamage"));
        character.setSpellProgress(List.of(
                new SpellProgressState("stormChain", 1),
                new SpellProgressState("emberBurst", 1)
        ));
        character.setSpellLoadout(List.of(new SpellLoadoutEntry("stormChain", List.of())));
        character.setCurrencies(List.of());
        character.setMapProgress(new MapProgressData(0, 0, List.of()));

        return toResponse(characterProfileRepository.save(character));
    }

    @Transactional
    public CharacterResponse saveProgress(String email, Long characterId, SaveCharacterProgressRequest request) {
        CharacterProfileEntity character = characterProfileRepository.findById(characterId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Character not found"));

        if (!character.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(NOT_FOUND, "Character not found");
        }

        character.setName(request.name());
        character.setLevel(request.level());
        character.setExperience(request.experience());
        character.setExperienceToNextLevel(request.experienceToNextLevel());
        character.setUnspentStatPoints(request.unspentStatPoints());
        Map<String, Object> derivedStats = characterStatCalculator.deriveStats(request.baseStats());
        character.setCurrentHealth(characterStatCalculator.clampCurrentHealth(request.currentHealth(), derivedStats));
        character.setGold(request.gold());
        character.setLifeFlask(new LifeFlaskState(request.lifeFlask().currentCharges()));
        character.setBaseStats(characterStatCalculator.toBaseStatsMap(request.baseStats()));
        character.setDerivedStats(derivedStats);
        character.setInventory(request.inventory().stream().map(this::toInventoryItemData).toList());
        Map<String, InventoryItemData> equippedItems = request.equippedItems().entrySet().stream()
                .collect(java.util.stream.Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> toInventoryItemData(entry.getValue())
                ));
        character.setEquippedItems(equippedItems);
        character.setUnlockedSpellIds(new ArrayList<>(request.unlockedSpellIds()));
        character.setUnlockedSupportSpellIds(new ArrayList<>(request.unlockedSupportSpellIds()));
        List<SpellProgressState> spellProgress = request.spellProgress().stream()
                .map(progress -> new SpellProgressState(progress.spellId(), progress.level()))
                .toList();
        character.setSpellProgress(spellProgress);
        List<SpellLoadoutEntry> spellLoadout = request.spellLoadout().stream()
                .map(link -> new SpellLoadoutEntry(link.mainSpellId(), List.copyOf(link.supportSpellIds())))
                .toList();
        character.setSpellLoadout(spellLoadout);

        List<CurrencyStackData> currencies = request.currencies().stream()
                .map(currency -> new CurrencyStackData(currency.code(), currency.amount()))
                .toList();
        character.setCurrencies(currencies);

        List<OwnedMapStackData> consumableMaps = request.mapProgress().consumableMaps().stream()
                .map(map -> new OwnedMapStackData(
                        map.stackId(),
                        map.mapId(),
                        map.tier(),
                        map.quantity(),
                        map.enhancements().stream()
                                .map(enhancement -> new MapEnhancementData(enhancement.id()))
                                .toList()
                ))
                .toList();
        character.setMapProgress(new MapProgressData(
                request.mapProgress().highestUnlockedTier(),
                request.mapProgress().lastCompletedTier(),
                consumableMaps
        ));
        character.setUpdatedAt(Instant.now());

        return toResponse(characterProfileRepository.save(character));
    }

    private InventoryItemData toInventoryItemData(InventoryItemRequest item) {
        return new InventoryItemData(
                item.id(),
                item.name(),
                item.slot(),
                item.rarity(),
                item.tier(),
                List.copyOf(item.tags()),
                item.uniqueEffectId(),
                item.uniqueEffectDescription(),
                item.statBonuses()
        );
    }

    private CharacterResponse toResponse(CharacterProfileEntity entity) {
        return new CharacterResponse(
                entity.getId(),
                entity.getName(),
                entity.getLevel(),
                entity.getExperience(),
                entity.getExperienceToNextLevel(),
                entity.getUnspentStatPoints(),
                entity.getCurrentHealth(),
                entity.getGold(),
                entity.getLifeFlask(),
                entity.getBaseStats(),
                entity.getDerivedStats(),
                entity.getInventory(),
                entity.getEquippedItems(),
                entity.getUnlockedSpellIds(),
                entity.getUnlockedSupportSpellIds(),
                entity.getSpellProgress(),
                entity.getSpellLoadout(),
                entity.getCurrencies(),
                entity.getMapProgress()
        );
    }
}
