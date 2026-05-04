export interface WeightedEntry<T> {
  key: T;
  weight: number;
}

export const pickWeighted = <T>(entries: WeightedEntry<T>[]): T | null => {
  const normalizedEntries = entries.filter((entry) => entry.weight > 0);

  if (normalizedEntries.length === 0) {
    return null;
  }

  const totalWeight = normalizedEntries.reduce((sum, entry) => sum + entry.weight, 0);
  const roll = Math.random() * totalWeight;
  let cumulative = 0;

  for (const entry of normalizedEntries) {
    cumulative += entry.weight;

    if (roll <= cumulative) {
      return entry.key;
    }
  }

  return normalizedEntries[normalizedEntries.length - 1].key;
};
