package com.example.arpg.character;

import com.example.arpg.user.UserAccountEntity;
import com.example.arpg.user.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class CharacterProfileService {

    private final CharacterProfileRepository characterProfileRepository;
    private final UserAccountRepository userAccountRepository;

    public CharacterProfileService(
            CharacterProfileRepository characterProfileRepository,
            UserAccountRepository userAccountRepository
    ) {
        this.characterProfileRepository = characterProfileRepository;
        this.userAccountRepository = userAccountRepository;
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
        character.setLifeFlask(Map.of("currentCharges", 18));
        character.setBaseStats(request.baseStats());
        character.setDerivedStats(calculateDerivedStats(request.baseStats()));
        character.setCurrentHealth((int) character.getDerivedStats().get("maxHealth"));
        character.setInventory(List.of());
        character.setEquippedItems(Map.of());
        character.setUnlockedSpellIds(List.of("stormChain", "emberBurst"));
        character.setUnlockedSupportSpellIds(List.of("increasedCriticalChance", "fasterCasting", "moreDamage"));
        character.setSpellProgress(List.of(
                Map.of("spellId", "stormChain", "level", 1),
                Map.of("spellId", "emberBurst", "level", 1)
        ));
        character.setSpellLoadout(List.of(Map.of("mainSpellId", "stormChain", "supportSpellIds", List.of())));
        character.setCurrencies(List.of());
        character.setMapProgress(Map.of("highestUnlockedTier", 0, "lastCompletedTier", 0, "consumableMaps", List.of()));

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
        character.setCurrentHealth(request.currentHealth());
        character.setGold(request.gold());
        character.setLifeFlask(Map.of("currentCharges", request.lifeFlask().currentCharges()));
        character.setBaseStats(Map.of(
                "strength", request.baseStats().strength(),
                "agility", request.baseStats().agility(),
                "vitality", request.baseStats().vitality(),
                "dexterity", request.baseStats().dexterity()
        ));
        character.setDerivedStats(Map.of(
                "maxHealth", request.derivedStats().maxHealth(),
                "castSpeedMultiplier", request.derivedStats().castSpeedMultiplier(),
                "critChance", request.derivedStats().critChance(),
                "spellPowerMultiplier", request.derivedStats().spellPowerMultiplier()
        ));
        character.setInventory(request.inventory().stream().map(this::toItemMap).toList());
        Map<String, Object> equippedItems = new HashMap<>();
        request.equippedItems().forEach((slot, item) -> equippedItems.put(slot, toItemMap(item)));
        character.setEquippedItems(equippedItems);
        character.setUnlockedSpellIds(new ArrayList<>(request.unlockedSpellIds()));
        character.setUnlockedSupportSpellIds(new ArrayList<>(request.unlockedSupportSpellIds()));
        List<Map<String, Object>> spellProgress = request.spellProgress().stream()
                .map(progress -> {
                    Map<String, Object> progressMap = new HashMap<>();
                    progressMap.put("spellId", progress.spellId());
                    progressMap.put("level", progress.level());
                    return progressMap;
                })
                .toList();
        character.setSpellProgress(spellProgress);
        List<Map<String, Object>> spellLoadout = request.spellLoadout().stream()
                .map(link -> {
                    Map<String, Object> linkMap = new HashMap<>();
                    linkMap.put("mainSpellId", link.mainSpellId());
                    linkMap.put("supportSpellIds", link.supportSpellIds());
                    return linkMap;
                })
                .toList();
        character.setSpellLoadout(spellLoadout);

        List<Map<String, Object>> currencies = request.currencies().stream()
                .map(currency -> {
                    Map<String, Object> currencyMap = new HashMap<>();
                    currencyMap.put("code", currency.code());
                    currencyMap.put("amount", currency.amount());
                    return currencyMap;
                })
                .toList();
        character.setCurrencies(currencies);

        List<Map<String, Object>> consumableMaps = request.mapProgress().consumableMaps().stream()
                .map(map -> {
                    Map<String, Object> mapStack = new HashMap<>();
                    mapStack.put("mapId", map.mapId());
                    mapStack.put("tier", map.tier());
                    mapStack.put("quantity", map.quantity());
                    return mapStack;
                })
                .toList();

        Map<String, Object> mapProgress = new HashMap<>();
        mapProgress.put("highestUnlockedTier", request.mapProgress().highestUnlockedTier());
        mapProgress.put("lastCompletedTier", request.mapProgress().lastCompletedTier());
        mapProgress.put("consumableMaps", consumableMaps);
        character.setMapProgress(mapProgress);
        character.setUpdatedAt(Instant.now());

        return toResponse(characterProfileRepository.save(character));
    }

    private Map<String, Object> calculateDerivedStats(Map<String, Object> baseStats) {
        int strength = ((Number) baseStats.getOrDefault("strength", 0)).intValue();
        int agility = ((Number) baseStats.getOrDefault("agility", 0)).intValue();
        int vitality = ((Number) baseStats.getOrDefault("vitality", 0)).intValue();
        int dexterity = ((Number) baseStats.getOrDefault("dexterity", 0)).intValue();

        return Map.of(
                "maxHealth", 100 + vitality * 14,
                "castSpeedMultiplier", 1 + agility * 0.015,
                "critChance", dexterity * 0.004,
                "spellPowerMultiplier", 1 + strength * 0.025
        );
    }

    private Map<String, Object> toItemMap(InventoryItemRequest item) {
        Map<String, Object> itemMap = new HashMap<>();
        itemMap.put("id", item.id());
        itemMap.put("name", item.name());
        itemMap.put("slot", item.slot());
        itemMap.put("rarity", item.rarity());
        itemMap.put("tier", item.tier());
        itemMap.put("tags", item.tags());
        itemMap.put("statBonuses", item.statBonuses());
        return itemMap;
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
