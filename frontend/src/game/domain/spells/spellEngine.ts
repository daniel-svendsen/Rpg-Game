import { spellConfig, supportSpellConfig } from "../../config/spellConfig";
import type { CharacterRecord } from "../../../shared/types/saveTypes";
import { getEquippedUniqueModifiers } from "../items/uniqueEffects";
import { getSpellLevel } from "./spellProgression";
import { getSupportEffectMultiplier, getSupportLevel } from "./supportProgression";

export interface ResolvedSpell {
  id: string;
  name: string;
  tags: string[];
  level: number;
  damage: number;
  cooldownMs: number;
  projectileCount: number;
  chainCount: number;
  chainRange: number;
  areaRadius: number;
  critChance: number;
  resistancePenetration: {
    Fire: number;
    Cold: number;
    Lightning: number;
  };
}

export const resolveSpell = (
  character: CharacterRecord,
  mainSpellId: string,
  supportSpellIds: string[]
): ResolvedSpell => {
  const baseSpell = spellConfig[mainSpellId];
  const equippedUniqueModifiers = getEquippedUniqueModifiers(character);
  const spellLevel = getSpellLevel(character, mainSpellId);
  const levelBonus = spellLevel - 1;
  const scaledBaseDamage = baseSpell.baseDamage * (1 + baseSpell.levelScaling.damageMultiplierPerLevel * levelBonus);
  let damageMultiplier = character.derivedStats.spellPowerMultiplier;
  let cooldownMs = Math.round(
    (baseSpell.cooldownMs * Math.max(0.45, 1 - baseSpell.levelScaling.cooldownMultiplierStep * levelBonus)) /
      character.derivedStats.castSpeedMultiplier
  );
  let projectileCount = baseSpell.projectileCount;
  let chainCount = baseSpell.chainCount;
  let chainRange = baseSpell.chainRange + baseSpell.levelScaling.chainRangePerLevel * levelBonus;
  let areaRadius = baseSpell.areaRadius + baseSpell.levelScaling.areaRadiusPerLevel * levelBonus;
  let critChance =
    character.derivedStats.critChance +
    baseSpell.criticalBonus +
    baseSpell.levelScaling.critChancePerLevel * levelBonus;

  supportSpellIds.forEach((supportSpellId) => {
    const support = supportSpellConfig[supportSpellId];

    if (!support || support.passiveOnly) {
      return;
    }

    const effectMultiplier = getSupportEffectMultiplier(getSupportLevel(character, supportSpellId));
    const moreDamageMultiplier = support.apply.moreDamageMultiplier ?? 0;
    const bonusAreaRadius = support.apply.bonusAreaRadius ?? 0;
    const scaledMoreDamageMultiplier =
      moreDamageMultiplier < 0 ? moreDamageMultiplier : moreDamageMultiplier * effectMultiplier;

    damageMultiplier *= 1 + scaledMoreDamageMultiplier;
    cooldownMs = Math.round(cooldownMs / (1 + (support.apply.castSpeedMultiplierBonus ?? 0) * effectMultiplier));
    projectileCount += (support.apply.bonusProjectiles ?? 0) * effectMultiplier;
    chainCount += (support.apply.bonusChains ?? 0) * effectMultiplier;
    if (bonusAreaRadius < 0 && bonusAreaRadius > -1) {
      areaRadius *= 1 + bonusAreaRadius;
    } else {
      areaRadius += bonusAreaRadius < 0 ? bonusAreaRadius : bonusAreaRadius * effectMultiplier;
    }
    critChance += (support.apply.criticalChanceBonus ?? 0) * effectMultiplier;
  });

  cooldownMs = Math.round(cooldownMs / equippedUniqueModifiers.castSpeedMultiplierForSpells);

  if (baseSpell.tags.includes("Fire")) {
    cooldownMs = Math.round(cooldownMs / equippedUniqueModifiers.castSpeedMultiplierForFireSpells);
  }

  if (baseSpell.tags.includes("Cold")) {
    cooldownMs = Math.round(cooldownMs / equippedUniqueModifiers.castSpeedMultiplierForColdSpells);
  }

  if (baseSpell.tags.includes("Lightning")) {
    cooldownMs = Math.round(cooldownMs / equippedUniqueModifiers.castSpeedMultiplierForLightningSpells);
  }

  damageMultiplier *= 1 + equippedUniqueModifiers.moreDamageForSpells;

  if (baseSpell.tags.includes("Chain")) {
    chainCount += equippedUniqueModifiers.bonusChainsForChainSpells;
    chainRange += equippedUniqueModifiers.bonusChainRangeForChainSpells;

    if (baseSpell.tags.includes("Lightning")) {
      chainCount += equippedUniqueModifiers.bonusChainsForLightningSpells;
      chainRange += equippedUniqueModifiers.bonusChainRangeForLightningSpells;
    }
  }

  if (baseSpell.tags.includes("Area")) {
    areaRadius += equippedUniqueModifiers.bonusAreaRadiusForAreaSpells;

    if (baseSpell.tags.includes("Fire")) {
      areaRadius += equippedUniqueModifiers.bonusAreaRadiusForFireSpells;
    }

    if (baseSpell.tags.includes("Cold")) {
      areaRadius += equippedUniqueModifiers.bonusAreaRadiusForColdSpells;
    }
  }

  if (baseSpell.tags.includes("Area") || baseSpell.tags.includes("Fire")) {
    damageMultiplier *= 1 + equippedUniqueModifiers.moreDamageForAreaAndFireSpells;
  }

  if (baseSpell.tags.includes("Projectile")) {
    projectileCount += equippedUniqueModifiers.bonusProjectilesForProjectileSpells;

    if (baseSpell.tags.includes("Lightning")) {
      projectileCount += equippedUniqueModifiers.bonusProjectilesForLightningSpells;
    }

    damageMultiplier *= Math.max(0.1, 1 - equippedUniqueModifiers.lessDamageForProjectileSpells);
  }

  critChance += equippedUniqueModifiers.bonusCritChanceForSpells;

  return {
    id: baseSpell.id,
    name: baseSpell.name,
    tags: [...baseSpell.tags],
    level: spellLevel,
    damage: Math.round(scaledBaseDamage * damageMultiplier),
    cooldownMs,
    projectileCount: Math.max(0, Math.round(projectileCount)),
    chainCount: Math.max(0, Math.round(chainCount)),
    chainRange,
    areaRadius: Math.round(areaRadius),
    critChance,
    resistancePenetration: {
      Fire: (baseSpell.tags.includes("Fire") ? equippedUniqueModifiers.resistancePenetrationForFireSpells : 0) + equippedUniqueModifiers.resistancePenetrationForAllSpells,
      Cold: equippedUniqueModifiers.resistancePenetrationForAllSpells,
      Lightning: equippedUniqueModifiers.resistancePenetrationForAllSpells
    }
  };
};
