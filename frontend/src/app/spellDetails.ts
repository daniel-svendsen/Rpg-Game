import { supportSpellConfig } from "../game/config/spellConfig";
import { resolveSpell } from "../game/domain/spells/spellEngine";
import type { CharacterRecord } from "../shared/types/saveTypes";

export const getSpellDetailLines = (
  character: CharacterRecord | null,
  spellId: string,
  supportSpellIds: string[]
): string[] => {
  if (!character) {
    return [];
  }

  const resolvedSpell = resolveSpell(character, spellId, supportSpellIds);
  const targetCount = Math.max(1, resolvedSpell.projectileCount + resolvedSpell.chainCount);
  const lines = [
    `Level ${resolvedSpell.level}`,
    `Damage ${resolvedSpell.damage}`,
    `Cooldown ${(resolvedSpell.cooldownMs / 1000).toFixed(2)}s`,
    `Critical chance ${(resolvedSpell.critChance * 100).toFixed(1)}%`
  ];

  if (resolvedSpell.chainCount > 0) {
    lines.push(`Chains up to ${targetCount} enemies within ${resolvedSpell.chainRange} range`);
  }

  if (resolvedSpell.areaRadius > 0) {
    lines.push(`Explosion radius ${resolvedSpell.areaRadius}`);
  }

  if (supportSpellIds.length > 0) {
    lines.push(
      `Linked supports: ${supportSpellIds
        .map((supportSpellId) => supportSpellConfig[supportSpellId]?.name ?? supportSpellId)
        .join(", ")}`
    );
  }

  return lines;
};
