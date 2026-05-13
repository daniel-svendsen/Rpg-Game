import { describe, expect, it } from "vitest";
import { createTestCharacter } from "../../../test/createTestCharacter";
import { getNextDroppableSupportSpellId } from "./supportSpellDrops";

describe("supportSpellDrops", () => {
  it("does not offer any droppable support before minimum tier", () => {
    const character = createTestCharacter();
    const next = getNextDroppableSupportSpellId(character.unlockedSupportSpellIds, 1);
    expect(next).toBeNull();
  });

  it("offers chain support once tier requirement is met and not owned", () => {
    const character = createTestCharacter();
    const next = getNextDroppableSupportSpellId(character.unlockedSupportSpellIds, 2);
    expect(next).toBe("chainSupport");
  });

  it("only offers supports that are still missing from inventory", () => {
    const character = createTestCharacter({
      unlockedSupportSpellIds: [
        ...createTestCharacter().unlockedSupportSpellIds,
        "chainSupport",
        "scattershotProjectiles"
      ]
    });
    const next = getNextDroppableSupportSpellId(character.unlockedSupportSpellIds, 5);
    expect(next).toBe("impactCascade");
  });
});
