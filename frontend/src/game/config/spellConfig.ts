import { balanceConfig } from "./balanceConfig";
import type { Tag } from "../../shared/types/saveTypes";

export interface SpellDefinition {
  id: string;
  name: string;
  tags: Tag[];
  description: string;
  baseDamage: number;
  cooldownMs: number;
  projectileCount: number;
  chainCount: number;
  chainRange: number;
  areaRadius: number;
  criticalBonus: number;
  levelScaling: {
    damageMultiplierPerLevel: number;
    cooldownMultiplierStep: number;
    chainRangePerLevel: number;
    areaRadiusPerLevel: number;
    critChancePerLevel: number;
  };
}

export interface SupportSpellDefinition {
  id: string;
  name: string;
  tags: Tag[];
  apply: {
    criticalChanceBonus?: number;
    castSpeedMultiplierBonus?: number;
    moreDamageMultiplier?: number;
    bonusChains?: number;
    bonusProjectiles?: number;
    bonusAreaRadius?: number;
  };
}

export const starterSpellIds = ["stormChain", "emberBurst"] as const;
export const droppableSpellIds = ["glacierNova"] as const;

export const spellConfig: Record<string, SpellDefinition> = {
  stormChain: {
    id: "stormChain",
    name: "Storm Chain",
    tags: ["Lightning", "Projectile", "Chain", "SpellDamage"],
    description: "Launches a lightning arc that jumps between nearby enemies.",
    baseDamage: 16,
    cooldownMs: 900,
    projectileCount: 1,
    chainCount: 2,
    chainRange: 140,
    areaRadius: 0,
    criticalBonus: 0.04,
    levelScaling: {
      damageMultiplierPerLevel: 0.18,
      cooldownMultiplierStep: 0.03,
      chainRangePerLevel: 10,
      areaRadiusPerLevel: 0,
      critChancePerLevel: 0.005
    }
  },
  emberBurst: {
    id: "emberBurst",
    name: "Ember Burst",
    tags: ["Fire", "Area", "Explosion", "SpellDamage"],
    description: "Detonates around the target and burns clustered enemies.",
    baseDamage: 22,
    cooldownMs: 1400,
    projectileCount: 0,
    chainCount: 0,
    chainRange: 0,
    areaRadius: 38,
    criticalBonus: 0.02,
    levelScaling: {
      damageMultiplierPerLevel: 0.2,
      cooldownMultiplierStep: 0.025,
      chainRangePerLevel: 0,
      areaRadiusPerLevel: 4,
      critChancePerLevel: 0.004
    }
  },
  glacierNova: {
    id: "glacierNova",
    name: "Glacier Nova",
    tags: ["Cold", "Area", "Critical", "SpellDamage"],
    description: "Releases a larger cold blast with stronger critical scaling.",
    baseDamage: 18,
    cooldownMs: 1250,
    projectileCount: 0,
    chainCount: 0,
    chainRange: 0,
    areaRadius: 54,
    criticalBonus: 0.07,
    levelScaling: {
      damageMultiplierPerLevel: 0.17,
      cooldownMultiplierStep: 0.02,
      chainRangePerLevel: 0,
      areaRadiusPerLevel: 5,
      critChancePerLevel: 0.007
    }
  }
};

export const supportSpellConfig: Record<string, SupportSpellDefinition> = {
  increasedCriticalChance: {
    id: "increasedCriticalChance",
    name: "Increased Critical Chance",
    tags: ["Critical", "SpellDamage"],
    apply: {
      criticalChanceBonus: balanceConfig.supportSpellModifiers.increasedCriticalChance
    }
  },
  fasterCasting: {
    id: "fasterCasting",
    name: "Faster Casting",
    tags: ["CastSpeed"],
    apply: {
      castSpeedMultiplierBonus: balanceConfig.supportSpellModifiers.fasterCasting
    }
  },
  moreDamage: {
    id: "moreDamage",
    name: "More Damage",
    tags: ["SpellDamage"],
    apply: {
      moreDamageMultiplier: balanceConfig.supportSpellModifiers.moreDamage
    }
  },
  chainSupport: {
    id: "chainSupport",
    name: "Chain Support",
    tags: ["Chain", "Projectile"],
    apply: {
      bonusChains: balanceConfig.supportSpellModifiers.chainSupport
    }
  },
  areaSupport: {
    id: "areaSupport",
    name: "Area Support",
    tags: ["Area"],
    apply: {
      bonusAreaRadius: balanceConfig.supportSpellModifiers.areaSupport
    }
  },
  projectileSupport: {
    id: "projectileSupport",
    name: "Projectile Support",
    tags: ["Projectile"],
    apply: {
      bonusProjectiles: balanceConfig.supportSpellModifiers.projectileSupport
    }
  }
};
