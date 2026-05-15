import { monsterBalance } from "./balance";

export type RareModId =
  | "swift"
  | "berserker"
  | "fortified"
  | "armored"
  | "regenerating"
  | "volatile"
  | "enraged"
  | "packHaste"
  | "packFury"
  | "packTough"
  | "packProtection"
  | "packResilient"
  | "packAlacrity"
  | "packRegen";

export interface RareMod {
  id: RareModId;
  label: string;
  minTier: number;
  effectType: "selfStat" | "packAura";
  selfMovementSpeedMultiplier?: number;
  selfDamageMultiplier?: number;
  selfHealthMultiplier?: number;
  selfResistanceBonus?: number;
  selfHpRegenPercentPerSecond?: number;
  packMovementSpeedMultiplier?: number;
  packDamageMultiplier?: number;
  packDamageTakenMultiplier?: number;
  packHealthMultiplier?: number;
  packResistanceBonus?: number;
  packContactCooldownMultiplier?: number;
  packHpRegenPercentPerSecond?: number;
}

export const rareModCatalog: RareMod[] = [
  { id: "swift",          label: "Swift",                  minTier: 1, effectType: "selfStat", selfMovementSpeedMultiplier: 1.35 },
  { id: "berserker",      label: "Berserker",              minTier: 1, effectType: "selfStat", selfDamageMultiplier: 1.5 },
  { id: "fortified",      label: "Fortified",              minTier: 1, effectType: "selfStat", selfHealthMultiplier: 2.0 },
  { id: "armored",        label: "Armored",                minTier: 1, effectType: "selfStat", selfResistanceBonus: 0.20 },
  { id: "regenerating",   label: "Regenerating",           minTier: 3, effectType: "selfStat", selfHpRegenPercentPerSecond: 0.02 },
  { id: "volatile",       label: "Volatile",               minTier: 5, effectType: "selfStat" },
  { id: "enraged",        label: "Enraged",                minTier: 5, effectType: "selfStat" },
  { id: "packHaste",      label: "Aura: Pack Haste",       minTier: 4, effectType: "packAura", packMovementSpeedMultiplier: 1.30 },
  { id: "packFury",       label: "Aura: Pack Fury",        minTier: 4, effectType: "packAura", packDamageMultiplier: 1.30 },
  { id: "packTough",      label: "Aura: Pack Toughness",   minTier: 4, effectType: "packAura", packHealthMultiplier: 1.60 },
  { id: "packAlacrity",   label: "Aura: Pack Alacrity",    minTier: 4, effectType: "packAura", packContactCooldownMultiplier: 0.60 },
  { id: "packProtection", label: "Aura: Pack Protection",  minTier: 7, effectType: "packAura", packDamageTakenMultiplier: 0.70 },
  { id: "packResilient",  label: "Aura: Pack Resilience",  minTier: 7, effectType: "packAura", packResistanceBonus: 0.15 },
  { id: "packRegen",      label: "Aura: Pack Regeneration",minTier: 6, effectType: "packAura", packHpRegenPercentPerSecond: 0.015 },
];

function modCountForTier(tier: number): number {
  if (tier <= 3) return 1 + Math.floor(Math.random() * 2);
  if (tier <= 6) return 2 + Math.floor(Math.random() * 2);
  return 3 + Math.floor(Math.random() * 2);
}

export function selectRareMods(tier: number): RareModId[] {
  const eligible = rareModCatalog.filter((m) => m.minTier <= tier);
  const shuffled = eligible.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, modCountForTier(tier)).map((m) => m.id);
}

export function applyRareSelfMods(
  stats: {
    maxHealth: number;
    damage: number;
    movementSpeed: number;
    resistances: { Fire: number; Cold: number; Lightning: number };
    hpRegenPercentPerSecond: number;
  },
  modIds: RareModId[]
): void {
  for (const id of modIds) {
    const mod = rareModCatalog.find((m) => m.id === id);
    if (!mod || mod.effectType !== "selfStat") continue;
    if (mod.selfHealthMultiplier) {
      stats.maxHealth = Math.round(stats.maxHealth * mod.selfHealthMultiplier);
    }
    if (mod.selfDamageMultiplier) {
      stats.damage = Math.round(stats.damage * mod.selfDamageMultiplier);
    }
    if (mod.selfMovementSpeedMultiplier) {
      stats.movementSpeed *= mod.selfMovementSpeedMultiplier;
    }
    if (mod.selfResistanceBonus) {
      const cap = monsterBalance.maxResistance;
      const bonus = mod.selfResistanceBonus;
      stats.resistances.Fire = Math.min(cap, stats.resistances.Fire + bonus);
      stats.resistances.Cold = Math.min(cap, stats.resistances.Cold + bonus);
      stats.resistances.Lightning = Math.min(cap, stats.resistances.Lightning + bonus);
    }
    if (mod.selfHpRegenPercentPerSecond) {
      stats.hpRegenPercentPerSecond += mod.selfHpRegenPercentPerSecond;
    }
  }
}

export function applyPackAuraMods(
  member: {
    maxHealth: number;
    damage: number;
    movementSpeed: number;
    resistances: { Fire: number; Cold: number; Lightning: number };
    damageTakenMultiplier: number;
    contactCooldownMultiplier: number;
    hpRegenPercentPerSecond: number;
  },
  modIds: RareModId[]
): void {
  for (const id of modIds) {
    const mod = rareModCatalog.find((m) => m.id === id);
    if (!mod || mod.effectType !== "packAura") continue;
    if (mod.packHealthMultiplier) {
      member.maxHealth = Math.round(member.maxHealth * mod.packHealthMultiplier);
    }
    if (mod.packDamageMultiplier) {
      member.damage = Math.round(member.damage * mod.packDamageMultiplier);
    }
    if (mod.packMovementSpeedMultiplier) {
      member.movementSpeed *= mod.packMovementSpeedMultiplier;
    }
    if (mod.packDamageTakenMultiplier) {
      member.damageTakenMultiplier *= mod.packDamageTakenMultiplier;
    }
    if (mod.packResistanceBonus) {
      const cap = monsterBalance.maxResistance;
      const bonus = mod.packResistanceBonus;
      member.resistances.Fire = Math.min(cap, member.resistances.Fire + bonus);
      member.resistances.Cold = Math.min(cap, member.resistances.Cold + bonus);
      member.resistances.Lightning = Math.min(cap, member.resistances.Lightning + bonus);
    }
    if (mod.packContactCooldownMultiplier) {
      member.contactCooldownMultiplier *= mod.packContactCooldownMultiplier;
    }
    if (mod.packHpRegenPercentPerSecond) {
      member.hpRegenPercentPerSecond += mod.packHpRegenPercentPerSecond;
    }
  }
}

export const VOLATILE_EXPLOSION_RADIUS = 120;
export const VOLATILE_EXPLOSION_DAMAGE_PERCENT = 0.25;
export const ENRAGED_THRESHOLD = 0.4;
export const ENRAGED_DAMAGE_MULTIPLIER = 1.5;
export const ENRAGED_SPEED_MULTIPLIER = 1.3;
