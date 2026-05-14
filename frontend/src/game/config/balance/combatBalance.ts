export const combatBalance = {
  autoPickupRadius: 36,
  enemyAggroRadius: 420,
  playerTargetingRange: 180,
  enemyContactRange: 26,
  resistances: {
    playerCap: 0.75,
    minEffectiveResistance: -0.25,
    bossPenaltyMilestones: [3, 6, 9],
    bossPenaltyPerMilestone: 0.15
  },
  mitigation: {
    armorMaxReduction: 0.9,
    evasionMaxChance: 0.4
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
    scattershotProjectiles: 1,
    scattershotLessDamage: -0.2,
    impactCascadeChains: 1,
    impactCascadeAreaRadius: 14,
    impactCascadeLessDamage: -0.1,
    precisionCriticalChance: 0.05,
    focusedCooldownRecovery: 0.12,
    overloadDamage: 0.14,
    concentratedEffect: 0.35,
    concentratedEffectAreaPenalty: -0.25,
    swiftnessAura: 0.0935,
    wardingAura: 0.1402,
    ironSkinAuraArmor: 140.2,
    ironSkinAuraEvasion: 140.2,
    arcaneResonanceSpellPower: 0.1402,
    arcaneResonanceCrit: 0.0467,
  }
} as const;
