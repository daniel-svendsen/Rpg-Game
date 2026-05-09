import { useEffect, useRef, type ReactNode } from "react";
import { PhaserGame } from "../game/phaser/PhaserGame";
import { canUseLifeFlask } from "../game/domain/player/lifeFlask";
import { balanceConfig } from "../game/config/balanceConfig";
import type { ArenaSnapshot, CharacterRecord, LootEntry } from "../shared/types/saveTypes";
import { LootPanel } from "./LootPanel";

interface ArenaScreenProps {
  arenaSnapshot: ArenaSnapshot | null;
  character: CharacterRecord | null;
  recentLoot: LootEntry[];
  feedback: ReactNode;
  onBackToHub: () => void;
  onManualSave: () => Promise<void>;
  onUseLifeFlask: () => void;
}

const ArenaScreen = ({
  arenaSnapshot,
  character,
  recentLoot,
  feedback,
  onBackToHub,
  onManualSave,
  onUseLifeFlask
}: ArenaScreenProps) => {
  const phaserContainerRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<PhaserGame | null>(null);

  useEffect(() => {
    if (!phaserContainerRef.current || phaserGameRef.current) {
      return;
    }

    phaserGameRef.current = new PhaserGame(phaserContainerRef.current);

    return () => {
      phaserGameRef.current?.destroy();
      phaserGameRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!arenaSnapshot) {
      return;
    }

    phaserGameRef.current?.updateSnapshot(arenaSnapshot);
  }, [arenaSnapshot]);

  const currentCharacter = arenaSnapshot?.player ?? character;
  const currentHealth = currentCharacter?.currentHealth ?? 0;
  const maxHealth = currentCharacter?.derivedStats?.maxHealth ?? 1;
  const healthPct = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));
  const flaskCharges = currentCharacter?.lifeFlask?.currentCharges ?? 0;
  const maxFlaskCharges = balanceConfig.healing.lifeFlask.maxCharges;
  const canFlask = currentCharacter ? canUseLifeFlask(currentCharacter) : false;

  const hpFillClass =
    healthPct > 66 ? "arena-hp-fill--high" : healthPct > 33 ? "arena-hp-fill--mid" : "arena-hp-fill--low";

  const enemyCount = arenaSnapshot?.enemies.length ?? 0;
  const isComplete = arenaSnapshot?.isComplete ?? false;
  const mapName = arenaSnapshot?.mapName ?? "";

  return (
    <div className="content arena-layout">
      <div className="mobile-only-feedback">{feedback}</div>
      <section className="panel arena-host">
        <div className="arena-top-hud">
          {mapName ? <span className="arena-hud-map-name">{mapName}</span> : null}
          {isComplete ? (
            <div className="overlay-chip overlay-chip--complete">Map Complete!</div>
          ) : (
            <div className="overlay-chip">{enemyCount} enemies remaining</div>
          )}
        </div>
        <div ref={phaserContainerRef} />
        <div className="arena-bottom-hud">
          <div className="arena-hp-section">
            <div className="arena-hp-label">
              {currentHealth} / {maxHealth} HP
            </div>
            <div className="arena-hp-track">
              <div className={`arena-hp-fill ${hpFillClass}`} style={{ width: `${healthPct}%` }} />
            </div>
          </div>
          <button
            className="arena-flask-btn"
            disabled={!canFlask}
            onClick={onUseLifeFlask}
            title="Use Life Flask"
            type="button"
          >
            Flask {flaskCharges}/{maxFlaskCharges}
          </button>
        </div>
      </section>
      <div className="arena-action-bar">
        <button className="primary-button" onClick={() => void onManualSave()}>
          Save progress
        </button>
        <button className="secondary-button" onClick={onBackToHub}>
          Back to hub
        </button>
      </div>
      <aside className="stack">
        <LootPanel recentLoot={recentLoot} />
      </aside>
    </div>
  );
};

export default ArenaScreen;
