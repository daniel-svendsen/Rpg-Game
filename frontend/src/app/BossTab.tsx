import type { ReactNode } from "react";
import { mapBalance } from "../game/config/balance";
import { isBossTierCleared } from "../game/domain/maps/mapProgress";
import type { CharacterRecord } from "../shared/types/saveTypes";

interface BossTabProps {
  topBar: ReactNode;
  healthHud: ReactNode;
  character: CharacterRecord | null;
  onStartBossTier: (tier: number) => void;
}

const countBossKeysByTier = (character: CharacterRecord | null): Record<number, number> => {
  if (!character) {
    return {};
  }

  return character.mapProgress.consumableMaps.reduce<Record<number, number>>((totals, entry) => {
    if (!entry.mapId.startsWith("bossTier")) {
      return totals;
    }

    totals[entry.tier] = (totals[entry.tier] ?? 0) + entry.quantity;
    return totals;
  }, {});
};

export const BossTab = ({ topBar, healthHud, character, onStartBossTier }: BossTabProps) => {
  const highestUnlockedTier = character?.mapProgress.highestUnlockedTier ?? 1;
  const bossKeysByTier = countBossKeysByTier(character);
  const nextTier = character
    ? Array.from({ length: mapBalance.maxTier }, (_, index) => index + 1).find(
        (tier) => tier <= highestUnlockedTier && !isBossTierCleared(character.mapProgress, tier)
      ) ?? Math.min(mapBalance.maxTier, highestUnlockedTier)
    : 1;

  return (
    <div className="content stack mobile-content">
      {topBar}
      {healthHud}
      <section className="panel stack">
        <h4>Bosses</h4>
        <p className="status-text">
          Each tier boss requires a boss key. If you fail, leave, or refresh mid-run, the key stays with you until the boss is cleared.
        </p>
        <p className="status-text">
          Next unlock target: Tier {nextTier} boss.
        </p>

        {Array.from({ length: mapBalance.maxTier }, (_, index) => index + 1).map((tier) => {
          const keyCount = bossKeysByTier[tier] ?? 0;
          const isCleared = character ? isBossTierCleared(character.mapProgress, tier) : false;
          const isAvailable = highestUnlockedTier >= tier;
          const canChallenge = isAvailable && keyCount > 0;
          const availabilityLabel = !isAvailable
            ? "Not available yet"
            : isCleared
              ? "Cleared"
              : keyCount > 0
                ? "Ready"
                : "Need key";

          return (
            <div key={`boss-${tier}`} className="map-card">
              <div className="inventory-row">
                <div>
                  <strong>Tier {tier} Boss</strong>
                  <div className="status-text">
                    Keys: {keyCount} | {availabilityLabel}
                  </div>
                  {isAvailable && !isCleared ? (
                    <div className="status-text">
                      {tier < mapBalance.maxTier
                        ? `First kill unlocks Tier ${tier + 1} maps.`
                        : "Final boss: first kill completes the current tier ladder."}
                    </div>
                  ) : null}
                  {!isAvailable ? (
                    <div className="status-text">Unlock Tier {tier} maps first.</div>
                  ) : null}
                </div>
                <button
                  className={canChallenge ? "primary-button" : "secondary-button"}
                  disabled={!canChallenge}
                  onClick={() => onStartBossTier(tier)}
                  type="button"
                >
                  {canChallenge ? "Challenge" : "Need key"}
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

