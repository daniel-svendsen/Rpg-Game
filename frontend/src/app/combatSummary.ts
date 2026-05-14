import { balanceConfig } from "../game/config/balanceConfig";
import type { CharacterRecord } from "../shared/types/saveTypes";

export interface CombatSummary {
  totalDamage: number;
  totalSurvival: number;
}

const clampPositive = (value: number): number => Math.max(1, value);

export const getCharacterCombatSummary = (character: CharacterRecord): CombatSummary => {
  const stats = character.derivedStats;

  const critFactor = 1 + stats.critChance * Math.max(0, stats.critMultiplier - 1);
  const totalDamage = clampPositive(stats.spellPowerMultiplier * stats.castSpeedMultiplier * critFactor * 100);

  const averageResistance = (stats.resistances.Fire + stats.resistances.Cold + stats.resistances.Lightning) / 3;
  const resistanceFactor = 1 + averageResistance;
  const armorFactor = 1 + Math.min(
    balanceConfig.combat.mitigation.armorMaxReduction,
    stats.armor / (stats.armor + 500)
  );
  const evasionFactor = 1 + Math.min(
    balanceConfig.combat.mitigation.evasionMaxChance,
    stats.evasion / (stats.evasion + 400)
  );
  const totalSurvival = clampPositive(stats.maxHealth * resistanceFactor * armorFactor * evasionFactor);

  return {
    totalDamage,
    totalSurvival
  };
};

export const getPercentDelta = (before: number, after: number): number => {
  if (before <= 0) {
    return 0;
  }

  return ((after - before) / before) * 100;
};
