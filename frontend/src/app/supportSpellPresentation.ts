import { supportSpellConfig } from "../game/config/spellConfig";

export const getSupportEffectDetails = (supportSpellId: string): string[] => {
  const support = supportSpellConfig[supportSpellId];
  if (!support) {
    return [];
  }

  const details: string[] = [];
  if (support.apply.moreDamageMultiplier) {
    const value = Math.round(support.apply.moreDamageMultiplier * 100);
    details.push(`${value > 0 ? "+" : ""}${value}% damage`);
  }
  if (support.apply.castSpeedMultiplierBonus) {
    details.push(`+${Math.round(support.apply.castSpeedMultiplierBonus * 100)}% cast speed`);
  }
  if (support.apply.criticalChanceBonus) {
    details.push(`+${Math.round(support.apply.criticalChanceBonus * 100)}% crit chance`);
  }
  if (support.apply.bonusProjectiles) {
    details.push(`+${support.apply.bonusProjectiles} projectile`);
  }
  if (support.apply.bonusChains) {
    details.push(`+${support.apply.bonusChains} chain`);
  }
  if (support.apply.bonusAreaRadius) {
    details.push(`+${support.apply.bonusAreaRadius} area radius`);
  }

  return details;
};

export const getSupportRoleTags = (supportSpellId: string): string[] => {
  const support = supportSpellConfig[supportSpellId];
  if (!support) {
    return [];
  }

  const tags: string[] = [];
  if (support.apply.moreDamageMultiplier) tags.push("Damage");
  if (support.apply.criticalChanceBonus) tags.push("Crit");
  if (support.apply.castSpeedMultiplierBonus) tags.push("Speed");
  if (support.apply.bonusProjectiles) tags.push("Projectile");
  if (support.apply.bonusChains) tags.push("Chain");
  if (support.apply.bonusAreaRadius) tags.push("Area");
  return tags;
};
