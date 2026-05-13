import type { CharacterStats, DerivedStats } from "../../../shared/types/saveTypes";
import { balanceConfig } from "../../config/balanceConfig";

export const deriveStats = (baseStats: CharacterStats): DerivedStats => ({
  maxHealth:
    balanceConfig.statScaling.baseHealth +
    baseStats.vitality * balanceConfig.statScaling.vitalityHealthMultiplier,
  castSpeedMultiplier: 1 + baseStats.intelligence * balanceConfig.statScaling.intelligenceCastSpeedMultiplier,
  attackSpeedMultiplier:
    1 +
    baseStats.strength * balanceConfig.statScaling.strengthAttackSpeedMultiplier +
    baseStats.agility * balanceConfig.statScaling.agilityAttackSpeedMultiplier,
  movementSpeedMultiplier: 1,
  armor: 0,
  evasion: 0,
  resistances: {
    Fire: 0,
    Cold: 0,
    Lightning: 0
  },
  critChance: Math.min(
    balanceConfig.statScaling.critChanceCap,
    baseStats.dexterity * balanceConfig.statScaling.dexterityCritChanceMultiplier
  ),
  critMultiplier: 1.6,
  spellPowerMultiplier: 1 + baseStats.intelligence * balanceConfig.statScaling.intelligenceSpellPowerMultiplier
});
