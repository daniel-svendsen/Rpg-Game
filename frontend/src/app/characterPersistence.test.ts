import { describe, expect, it } from "vitest";
import { createTestCharacter } from "../test/createTestCharacter";
import {
  resolveManualSaveCharacter,
  serializeCharacterForPersistence,
  shouldHydrateSaveResponse,
  shouldAutosaveCharacter
} from "./characterPersistence";

describe("characterPersistence", () => {
  it("serializes persisted character state deterministically for comparisons", () => {
    const character = createTestCharacter();

    expect(serializeCharacterForPersistence(character)).toBe(JSON.stringify(character));
    expect(serializeCharacterForPersistence(null)).toBeNull();
  });

  it("skips autosave when nothing changed or saving is blocked", () => {
    const character = createTestCharacter();
    const persistedSnapshot = serializeCharacterForPersistence(character);

    expect(
      shouldAutosaveCharacter({
        token: "token",
        isAutosaveEnabled: true,
        latestCharacter: character,
        lastPersistedSnapshot: persistedSnapshot,
        isSaveInFlight: false
      })
    ).toBe(false);

    expect(
      shouldAutosaveCharacter({
        token: "token",
        isAutosaveEnabled: true,
        latestCharacter: character,
        lastPersistedSnapshot: null,
        isSaveInFlight: true
      })
    ).toBe(false);
  });

  it("requests autosave when tracked character state changed", () => {
    const character = createTestCharacter();
    const changedCharacter = {
      ...character,
      gold: character.gold + 10
    };

    expect(
      shouldAutosaveCharacter({
        token: "token",
        isAutosaveEnabled: true,
        latestCharacter: changedCharacter,
        lastPersistedSnapshot: serializeCharacterForPersistence(character),
        isSaveInFlight: false
      })
    ).toBe(true);
  });

  it("does not hydrate a save response after newer local progress exists", () => {
    const character = createTestCharacter();
    const staleSnapshot = serializeCharacterForPersistence(character);
    const progressedCharacter = {
      ...character,
      mapProgress: {
        ...character.mapProgress,
        clearedBossTiers: [1]
      }
    };

    expect(
      shouldHydrateSaveResponse({
        latestCharacter: progressedCharacter,
        requestedSnapshot: staleSnapshot
      })
    ).toBe(false);
  });

  it("hydrates a save response when local state still matches the saved request", () => {
    const character = createTestCharacter();
    const requestedSnapshot = serializeCharacterForPersistence(character);

    expect(
      shouldHydrateSaveResponse({
        latestCharacter: character,
        requestedSnapshot
      })
    ).toBe(true);
  });

  it("prefers the live arena character for manual saves during combat", () => {
    const appCharacter = createTestCharacter();
    const syncedCharacter = {
      ...appCharacter,
      gold: appCharacter.gold + 10
    };
    const arenaCharacter = {
      ...syncedCharacter,
      mapProgress: {
        ...syncedCharacter.mapProgress,
        clearedBossTiers: [1]
      }
    };

    expect(
      resolveManualSaveCharacter({
        screenMode: "arena",
        character: appCharacter,
        latestCharacter: syncedCharacter,
        arenaCharacter
      })
    ).toBe(arenaCharacter);
  });

  it("falls back to the latest synced character outside the arena", () => {
    const appCharacter = createTestCharacter();
    const latestCharacter = {
      ...appCharacter,
      gold: appCharacter.gold + 25
    };

    expect(
      resolveManualSaveCharacter({
        screenMode: "hub",
        character: appCharacter,
        latestCharacter,
        arenaCharacter: null
      })
    ).toBe(latestCharacter);
  });
});
