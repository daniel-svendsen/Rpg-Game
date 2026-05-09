import { useEffect, useRef, type ReactNode } from "react";
import { PhaserGame } from "../game/phaser/PhaserGame";
import { canUseLifeFlask } from "../game/domain/player/lifeFlask";
import type { ArenaSnapshot, CharacterRecord, LootEntry } from "../shared/types/saveTypes";
import { HealthHud } from "./HealthHud";
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

  const enemyCount = arenaSnapshot?.enemies.length ?? 0;
  const isComplete = arenaSnapshot?.isComplete ?? false;

  return (
    <div className="content arena-layout">
      <div className="mobile-only-feedback">{feedback}</div>
      <section className="panel arena-host">
        <div className="arena-overlay">
          {isComplete ? (
            <div className="overlay-chip overlay-chip--complete">Map complete!</div>
          ) : (
            <div className="overlay-chip">{enemyCount} enemies</div>
          )}
        </div>
        <div ref={phaserContainerRef} />
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
        <HealthHud
          character={currentCharacter}
          canUseLifeFlask={currentCharacter ? canUseLifeFlask(currentCharacter) : false}
          onUseLifeFlask={onUseLifeFlask}
        />
        <LootPanel recentLoot={recentLoot} />
      </aside>
    </div>
  );
};

export default ArenaScreen;
