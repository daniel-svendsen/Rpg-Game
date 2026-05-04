import { spellConfig, supportSpellConfig } from "../../config/spellConfig";
import type { CharacterRecord } from "../../../shared/types/saveTypes";
import { getEquippedUniqueModifiers } from "../items/uniqueEffects";
import { getSpellLevel } from "./spellProgression";

export interface ResolvedSpell {
  id: string;
  name: string;
  level: number;
  damage: number;
  cooldownMs: number;
  projectileCount: number;
  chainCount: number;
  chainRange: number;
  areaRadius: number;
  critChance: number;
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

    if (!support) {
      return;
    }

    damageMultiplier *= 1 + (support.apply.moreDamageMultiplier ?? 0);
    cooldownMs = Math.round(cooldownMs / (1 + (support.apply.castSpeedMultiplierBonus ?? 0)));
    projectileCount += support.apply.bonusProjectiles ?? 0;
    chainCount += support.apply.bonusChains ?? 0;
    areaRadius += support.apply.bonusAreaRadius ?? 0;
    critChance += support.apply.criticalChanceBonus ?? 0;
  });

  if (baseSpell.tags.includes("Chain")) {
    chainCount += equippedUniqueModifiers.bonusChainsForChainSpells;
    chainRange += equippedUniqueModifiers.bonusChainRangeForChainSpells;
  }

  if (baseSpell.tags.includes("Area")) {
    areaRadius += equippedUniqueModifiers.bonusAreaRadiusForAreaSpells;
  }

  if (baseSpell.tags.includes("Area") || baseSpell.tags.includes("Fire")) {
    damageMultiplier *= 1 + equippedUniqueModifiers.moreDamageForAreaAndFireSpells;
  }

  critChance += equippedUniqueModifiers.bonusCritChanceForSpells;

  return {
    id: baseSpell.id,
    name: baseSpell.name,
    level: spellLevel,
    damage: Math.round(scaledBaseDamage * damageMultiplier),
    cooldownMs,
    projectileCount,
    chainCount,
    chainRange,
    areaRadius,
    critChance
  };
};
