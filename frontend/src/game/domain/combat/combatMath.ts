import type { DamageType } from "../../../shared/types/saveTypes";
import { balanceConfig } from "../../config/balanceConfig";
import { monsterBalance } from "../../config/balance";

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const clampPlayerResistance = (resistance: number): number =>
  clamp(resistance, -1, balanceConfig.combat.resistances.playerCap);

export const clampEnemyResistance = (resistance: number): number =>
  clamp(resistance, balanceConfig.combat.resistances.minEffectiveResistance, monsterBalance.maxResistance);

export const applyResistanceToDamage = (baseDamage: number, resistance: number): number =>
  Math.max(1, Math.round(baseDamage * (1 - resistance)));

// Armor reduces physical damage with diminishing returns.
// Formula: reduction = armor / (armor + rawDamage * 5), capped by combat balance.
export const getArmorReductionFraction = (damage: number, armor: number): number => {
  if (armor <= 0 || damage <= 0) return 0;
  return Math.min(
    balanceConfig.combat.mitigation.armorMaxReduction,
    armor / (armor + damage * 5)
  );
};

export const applyArmorMitigation = (damage: number, armor: number): number => {
  if (damage <= 0) return damage;
  const reductionFraction = getArmorReductionFraction(damage, armor);
  return Math.max(1, Math.round(damage * (1 - reductionFraction)));
};

// Evasion gives a chance to completely avoid a hit.
// Formula: evadeChance = evasion / (evasion + 400), capped by combat balance.
export const getEvasionChance = (evasion: number): number => {
  if (evasion <= 0) return 0;
  return Math.min(
    balanceConfig.combat.mitigation.evasionMaxChance,
    evasion / (evasion + 400)
  );
};

export const rollEvasion = (evasion: number): boolean => {
  const evadeChance = getEvasionChance(evasion);
  return Math.random() < evadeChance;
};

export const resolveEnemyDamageType = (tags: readonly string[]): DamageType => {
  if (tags.includes("Fire")) {
    return "Fire";
  }
  if (tags.includes("Cold")) {
    return "Cold";
  }
  if (tags.includes("Lightning")) {
    return "Lightning";
  }
  return "Physical";
};
