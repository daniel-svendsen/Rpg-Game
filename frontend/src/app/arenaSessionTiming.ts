export const arenaSessionTiming = {
  snapshotUpdateIntervalMs: 33,
  characterSyncIntervalMs: 120
} as const;

export const shouldSyncArenaSnapshot = (timestamp: number, lastSnapshotUpdateAt: number): boolean =>
  timestamp - lastSnapshotUpdateAt >= arenaSessionTiming.snapshotUpdateIntervalMs;

export const shouldSyncArenaCharacter = (timestamp: number, lastCharacterSyncAt: number): boolean =>
  timestamp - lastCharacterSyncAt >= arenaSessionTiming.characterSyncIntervalMs;
