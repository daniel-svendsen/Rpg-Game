import type { CharacterStats, DerivedStats } from "../../../shared/types/saveTypes";
import { balanceConfig } from "../../config/balanceConfig";

export const deriveStats = (baseStats: CharacterStats): DerivedStats => ({
  maxHealth:
    balanceConfig.statScaling.baseHealth +
    baseStats.vitality * balanceConfig.statScaling.vitalityHealthMultiplier,
  castSpeedMultiplier: 1 + baseStats.agility * balanceConfig.statScaling.agilityCastSpeedMultiplier,
  attackSpeedMultiplier: 1,
  movementSpeedMultiplier: 1,
  armor: 0,
  evasion: 0,
  resistances: {
    Fire: 0,
    Cold: 0,
    Lightning: 0
  },
  critChance: baseStats.dexterity * balanceConfig.statScaling.dexterityCritChanceMultiplier,
  critMultiplier: 1.6,
  spellPowerMultiplier: 1 + baseStats.strength * balanceConfig.statScaling.strengthSpellPowerMultiplier
});
