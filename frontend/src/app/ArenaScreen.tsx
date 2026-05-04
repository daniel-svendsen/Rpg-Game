import { useEffect, useRef, type ReactNode } from "react";
import { PhaserGame } from "../game/phaser/PhaserGame";
import { canUseLifeFlask } from "../game/domain/player/lifeFlask";
import { getSpellName } from "../game/domain/spells/spellDrops";
import { supportSpellConfig } from "../game/config/spellConfig";
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
  getSpellDetailLines: (spellId: string, supportSpellIds: string[]) => string[];
}

const ArenaScreen = ({
  arenaSnapshot,
  character,
  recentLoot,
  feedback,
  onBackToHub,
  onManualSave,
  onUseLifeFlask,
  getSpellDetailLines
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

  const activeSpellId = character?.spellLoadout[0]?.mainSpellId ?? "";
  const currentCharacter = arenaSnapshot?.player ?? character;

  return (
    <div className="content arena-layout">
      <div className="mobile-only-feedback">{feedback}</div>
      <section className="panel arena-host">
        <div className="arena-overlay">
          <div className="overlay-chip">
            <strong>{character?.name}</strong>
            <span>{activeSpellId ? getSpellName(activeSpellId) : "No spell"}</span>
          </div>
        </div>
        <div ref={phaserContainerRef} />
      </section>
      <aside className="stack">
        <HealthHud
          character={currentCharacter}
          canUseLifeFlask={currentCharacter ? canUseLifeFlask(currentCharacter) : false}
          onUseLifeFlask={onUseLifeFlask}
        />
        <section className="panel">
          <h4>Active spell</h4>
          <div className="badge-row">
            <span className="badge">{character ? getSpellName(character.spellLoadout[0]?.mainSpellId ?? "") : ""}</span>
          </div>
          <div className="fact-grid">
            {character
              ? getSpellDetailLines(
                  character.spellLoadout[0]?.mainSpellId ?? "",
                  character.spellLoadout[0]?.supportSpellIds ?? []
                ).map((line) => (
                  <span key={`arena-${line}`} className="fact-chip">
                    {line}
                  </span>
                ))
              : null}
          </div>
          <p className="status-text">
            Supports: {(character?.spellLoadout[0]?.supportSpellIds ?? [])
              .map((id) => supportSpellConfig[id]?.name ?? id)
              .join(", ") || "None"}
          </p>
        </section>
        <section className="panel">
          <h4>Map state</h4>
          <p>
            {arenaSnapshot?.mapName} Tier {arenaSnapshot?.mapTier}
          </p>
          <p>Enemies alive: {arenaSnapshot?.enemies.length ?? 0}</p>
          <p>{arenaSnapshot?.isComplete ? "Map complete." : "Map in progress."}</p>
          <div className="actions">
            <button className="primary-button" onClick={() => void onManualSave()}>
              Save progress
            </button>
            <button className="secondary-button" onClick={onBackToHub}>
              Back to hub
            </button>
          </div>
        </section>
        <LootPanel recentLoot={recentLoot} />
      </aside>
    </div>
  );
};

export default ArenaScreen;
