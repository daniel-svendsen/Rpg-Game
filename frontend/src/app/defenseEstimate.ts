import { getTierBalanceTweaks, monsterBalance } from "../game/config/balance";
import { mapConfig, type MapDefinition } from "../game/config/mapConfig";
import { getArmorReductionFraction, getEvasionChance } from "../game/domain/combat/combatMath";
import type { CharacterRecord, DamageType } from "../shared/types/saveTypes";

export interface DefenseEstimateContext {
  map: MapDefinition;
  source: "selected" | "recent" | "unlocked";
}

export interface CharacterDefenseEstimate {
  context: DefenseEstimateContext;
  incomingHit: number;
  armorReduction: number;
  physicalDamageAfterArmor: number;
  evasionChance: number;
  expectedPhysicalPrevention: number;
  elementalDamageTaken: Record<Exclude<DamageType, "Physical">, number>;
}

const elementalDamageTypes = ["Fire", "Cold", "Lightning"] as const;

const getTierMapId = (tier: number): string => `tier${Math.max(1, tier)}Map`;

export const getDefenseEstimateContext = (
  character: CharacterRecord,
  selectedMapId: string
): DefenseEstimateContext => {
  const selectedMap = mapConfig[selectedMapId];

  if (selectedMap && selectedMap.tier > 0) {
    return {
      map: selectedMap,
      source: "selected"
    };
  }

  if (character.mapProgress.lastCompletedTier > 0) {
    const recentMap = mapConfig[getTierMapId(character.mapProgress.lastCompletedTier)];

    if (recentMap) {
      return {
        map: recentMap,
        source: "recent"
      };
    }
  }

  const unlockedMap = mapConfig[getTierMapId(character.mapProgress.highestUnlockedTier)] ?? mapConfig.tier1Map;

  return {
    map: unlockedMap,
    source: "unlocked"
  };
};

export const getCharacterDefenseEstimate = (
  character: CharacterRecord,
  selectedMapId: string
): CharacterDefenseEstimate => {
  const context = getDefenseEstimateContext(character, selectedMapId);
  const tierTweaks = getTierBalanceTweaks(context.map.tier);
  const bossDamageMultiplier = context.map.id.startsWith("bossTier") ? tierTweaks.bossDamageMultiplier : 1;
  const incomingHit = Math.max(
    1,
    Math.round(
      monsterBalance.baseDamage *
        context.map.enemyDamageMultiplier *
        tierTweaks.enemyDamageMultiplier *
        bossDamageMultiplier
    )
  );
  const armorReduction = getArmorReductionFraction(incomingHit, character.derivedStats.armor);
  const evasionChance = getEvasionChance(character.derivedStats.evasion);

  return {
    context,
    incomingHit,
    armorReduction,
    physicalDamageAfterArmor: Math.max(1, Math.round(incomingHit * (1 - armorReduction))),
    evasionChance,
    expectedPhysicalPrevention: 1 - (1 - evasionChance) * (1 - armorReduction),
    elementalDamageTaken: elementalDamageTypes.reduce<CharacterDefenseEstimate["elementalDamageTaken"]>(
      (totals, type) => ({
        ...totals,
        [type]: Math.max(1, Math.round(incomingHit * (1 - character.derivedStats.resistances[type])))
      }),
      { Fire: incomingHit, Cold: incomingHit, Lightning: incomingHit }
    )
  };
};

