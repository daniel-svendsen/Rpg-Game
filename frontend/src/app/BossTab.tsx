import type { ReactNode } from "react";
import { mapBalance } from "../game/config/balance";
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
  const nextTier = Math.min(mapBalance.maxTier, Math.max(2, highestUnlockedTier + 1));

  return (
    <div className="content stack mobile-content">
      {topBar}
      {healthHud}
      <section className="panel stack">
        <h4>Bosses</h4>
        <p className="status-text">
          Boss keys drop from rare enemies. Defeating a boss unlocks its tier of maps.
        </p>
        <p className="status-text">
          Next unlock target: Tier {nextTier} boss ({bossKeysByTier[nextTier] ?? 0} key
          {(bossKeysByTier[nextTier] ?? 0) === 1 ? "" : "s"}).
        </p>

        {Array.from({ length: mapBalance.maxTier - 1 }, (_, index) => index + 2).map((tier) => {
          const keyCount = bossKeysByTier[tier] ?? 0;
          const isUnlocked = highestUnlockedTier >= tier;
          const isAvailable = tier <= highestUnlockedTier + 1;
          const canChallenge = keyCount > 0 && isAvailable;

          return (
            <div key={`boss-${tier}`} className="map-card">
              <div className="inventory-row">
                <div>
                  <strong>Tier {tier} Boss</strong>
                  <div className="status-text">
                    Keys: {keyCount} â€¢ {isUnlocked ? "Unlocked" : isAvailable ? "Locked" : "Not available yet"}
                  </div>
                  {!isUnlocked && !isAvailable ? (
                    <div className="status-text">Unlock Tier {tier - 1} first.</div>
                  ) : null}
                </div>
                <button
                  className={canChallenge ? "primary-button" : "secondary-button"}
                  disabled={!canChallenge}
                  onClick={() => onStartBossTier(tier)}
                  type="button"
                >
                  {keyCount <= 0 ? "Need key" : "Challenge"}
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

