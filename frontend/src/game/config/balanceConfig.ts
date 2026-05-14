import {
  combatBalance,
  economyBalance,
  getMapTierBalance,
  mapBalance,
  monsterBalance,
  progressionBalance
} from "./balance";

const itemTierStatRanges = {
  1: getMapTierBalance(1).itemStatRanges,
  2: getMapTierBalance(2).itemStatRanges,
  3: getMapTierBalance(3).itemStatRanges,
  4: getMapTierBalance(4).itemStatRanges,
  5: getMapTierBalance(5).itemStatRanges,
  6: getMapTierBalance(6).itemStatRanges,
  7: getMapTierBalance(7).itemStatRanges,
  8: getMapTierBalance(8).itemStatRanges,
  9: getMapTierBalance(9).itemStatRanges,
  10: getMapTierBalance(10).itemStatRanges
} as const;

export const balanceConfig = {
  progression: progressionBalance.progression,
  statScaling: progressionBalance.statScaling,
  itemTierStatRanges,
  combat: {
    autoPickupRadius: combatBalance.autoPickupRadius,
    enemyAggroRadius: combatBalance.enemyAggroRadius,
    playerTargetingRange: combatBalance.playerTargetingRange,
    enemyContactRange: combatBalance.enemyContactRange,
    enemyContactDamageIntervalMs: monsterBalance.contactDamageIntervalMs,
    resistances: combatBalance.resistances,
    mitigation: combatBalance.mitigation
  },
  healing: combatBalance.healing,
  economy: economyBalance.economy,
  mapCrafting: economyBalance.mapCrafting,
  spellProgression: progressionBalance.spellProgression,
  supportProgression: progressionBalance.supportProgression,
  supportSpellModifiers: combatBalance.supportSpellModifiers,
  mapTierScaling: {
    maxTier: mapBalance.maxTier
  }
} as const;

export type BalanceConfig = typeof balanceConfig;
