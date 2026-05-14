import { describe, expect, it } from "vitest";
import { createTestCharacter } from "../../../test/createTestCharacter";
import { getNextDroppableSupportSpellId } from "./supportSpellDrops";

describe("supportSpellDrops", () => {
  it("does not offer any droppable support before minimum tier", () => {
    const character = createTestCharacter();
    const next = getNextDroppableSupportSpellId(character.unlockedSupportSpellIds, 0);
    expect(next).toBeNull();
  });

  it("offers tier-eligible supports once their requirements are met and not owned", () => {
    const character = createTestCharacter();
    const next = getNextDroppableSupportSpellId(character.unlockedSupportSpellIds, 2);
    expect(["areaSupport", "chainSupport", "concentratedEffect", "swiftnessAura"]).toContain(next);
  });

  it("only offers supports that are still missing from inventory", () => {
    const character = createTestCharacter({
      unlockedSupportSpellIds: [
        ...createTestCharacter().unlockedSupportSpellIds,
        "areaSupport",
        "chainSupport",
        "scattershotProjectiles",
        "impactCascade",
        "concentratedEffect",
        "swiftnessAura",
        "wardingAura",
        "ironSkinAura"
      ]
    });
    const next = getNextDroppableSupportSpellId(character.unlockedSupportSpellIds, 5);
    expect(next).toBe("arcaneResonance");
  });
});
