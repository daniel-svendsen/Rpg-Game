import { describe, expect, it } from "vitest";
import {
  arenaSessionTiming,
  shouldSyncArenaCharacter,
  shouldSyncArenaSnapshot
} from "./arenaSessionTiming";

describe("arenaSessionTiming", () => {
  it("publishes snapshots at the configured cadence", () => {
    expect(shouldSyncArenaSnapshot(0, 0)).toBe(false);
    expect(shouldSyncArenaSnapshot(arenaSessionTiming.snapshotUpdateIntervalMs - 1, 0)).toBe(false);
    expect(shouldSyncArenaSnapshot(arenaSessionTiming.snapshotUpdateIntervalMs, 0)).toBe(true);
  });

  it("syncs character state less frequently than visual snapshots", () => {
    expect(shouldSyncArenaCharacter(0, 0)).toBe(false);
    expect(shouldSyncArenaCharacter(arenaSessionTiming.characterSyncIntervalMs - 1, 0)).toBe(false);
    expect(shouldSyncArenaCharacter(arenaSessionTiming.characterSyncIntervalMs, 0)).toBe(true);
  });
});
