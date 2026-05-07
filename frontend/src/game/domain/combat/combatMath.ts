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

