package com.example.arpg.character;

import com.example.arpg.user.UserAccountEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "character_profile")
public class CharacterProfileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccountEntity user;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private int level;

    @Column(nullable = false)
    private int experience;

    @Column(name = "experience_to_next_level", nullable = false)
    private int experienceToNextLevel;

    @Column(name = "unspent_stat_points", nullable = false)
    private int unspentStatPoints;

    @Column(name = "current_health", nullable = false)
    private int currentHealth;

    @Column(nullable = false)
    private int gold;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "life_flask", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> lifeFlask;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "base_stats", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> baseStats;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "derived_stats", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> derivedStats;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<Map<String, Object>> inventory;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "equipped_items", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> equippedItems;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "unlocked_spell_ids", nullable = false, columnDefinition = "jsonb")
    private List<String> unlockedSpellIds;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "unlocked_support_spell_ids", nullable = false, columnDefinition = "jsonb")
    private List<String> unlockedSupportSpellIds;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "spell_progress", nullable = false, columnDefinition = "jsonb")
    private List<Map<String, Object>> spellProgress;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "spell_loadout", nullable = false, columnDefinition = "jsonb")
    private List<Map<String, Object>> spellLoadout;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<Map<String, Object>> currencies;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "map_progress", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> mapProgress;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Long getId() {
        return id;
    }

    public UserAccountEntity getUser() {
        return user;
    }

    public void setUser(UserAccountEntity user) {
        this.user = user;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public int getExperience() {
        return experience;
    }

    public void setExperience(int experience) {
        this.experience = experience;
    }

    public int getExperienceToNextLevel() {
        return experienceToNextLevel;
    }

    public void setExperienceToNextLevel(int experienceToNextLevel) {
        this.experienceToNextLevel = experienceToNextLevel;
    }

    public int getUnspentStatPoints() {
        return unspentStatPoints;
    }

    public void setUnspentStatPoints(int unspentStatPoints) {
        this.unspentStatPoints = unspentStatPoints;
    }

    public int getCurrentHealth() {
        return currentHealth;
    }

    public void setCurrentHealth(int currentHealth) {
        this.currentHealth = currentHealth;
    }

    public int getGold() {
        return gold;
    }

    public void setGold(int gold) {
        this.gold = gold;
    }

    public Map<String, Object> getLifeFlask() {
        return lifeFlask;
    }

    public void setLifeFlask(Map<String, Object> lifeFlask) {
        this.lifeFlask = lifeFlask;
    }

    public Map<String, Object> getBaseStats() {
        return baseStats;
    }

    public void setBaseStats(Map<String, Object> baseStats) {
        this.baseStats = baseStats;
    }

    public Map<String, Object> getDerivedStats() {
        return derivedStats;
    }

    public void setDerivedStats(Map<String, Object> derivedStats) {
        this.derivedStats = derivedStats;
    }

    public List<Map<String, Object>> getInventory() {
        return inventory;
    }

    public void setInventory(List<Map<String, Object>> inventory) {
        this.inventory = inventory;
    }

    public Map<String, Object> getEquippedItems() {
        return equippedItems;
    }

    public void setEquippedItems(Map<String, Object> equippedItems) {
        this.equippedItems = equippedItems;
    }

    public List<String> getUnlockedSpellIds() {
        return unlockedSpellIds;
    }

    public void setUnlockedSpellIds(List<String> unlockedSpellIds) {
        this.unlockedSpellIds = unlockedSpellIds;
    }

    public List<String> getUnlockedSupportSpellIds() {
        return unlockedSupportSpellIds;
    }

    public void setUnlockedSupportSpellIds(List<String> unlockedSupportSpellIds) {
        this.unlockedSupportSpellIds = unlockedSupportSpellIds;
    }

    public List<Map<String, Object>> getSpellProgress() {
        return spellProgress;
    }

    public void setSpellProgress(List<Map<String, Object>> spellProgress) {
        this.spellProgress = spellProgress;
    }

    public List<Map<String, Object>> getSpellLoadout() {
        return spellLoadout;
    }

    public void setSpellLoadout(List<Map<String, Object>> spellLoadout) {
        this.spellLoadout = spellLoadout;
    }

    public List<Map<String, Object>> getCurrencies() {
        return currencies;
    }

    public void setCurrencies(List<Map<String, Object>> currencies) {
        this.currencies = currencies;
    }

    public Map<String, Object> getMapProgress() {
        return mapProgress;
    }

    public void setMapProgress(Map<String, Object> mapProgress) {
        this.mapProgress = mapProgress;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
