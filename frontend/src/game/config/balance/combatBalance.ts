export const combatBalance = {
  autoPickupRadius: 9999,
  resistances: {
    playerCap: 0.75,
    minEffectiveResistance: -0.25
  },
  healing: {
    refillToFullOnMapStart: true,
    lifeFlask: {
      maxCharges: 18,
      chargesPerUse: 6,
      healPercentPerUse: 0.4,
      normalKillCharges: 1,
      rareKillCharges: 3
    }
  },
  supportSpellModifiers: {
    increasedCriticalChance: 0.08,
    fasterCasting: 0.18,
    moreDamage: 0.22,
    chainSupport: 1,
    areaSupport: 12,
    projectileSupport: 1
  }
} as const;
