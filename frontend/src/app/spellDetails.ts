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
  const lines = [`Level ${resolvedSpell.level}`];

  if (resolvedSpell.chainCount > 0) {
    lines.push(`Chains up to ${targetCount} enemies within ${resolvedSpell.chainRange} range`);
  }

  if (resolvedSpell.areaRadius > 0) {
    lines.push(`Explosion radius ${resolvedSpell.areaRadius}`);
  }

  return lines;
};
