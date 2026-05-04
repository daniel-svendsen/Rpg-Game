import type { ReactNode } from "react";
import type { CharacterRecord } from "../shared/types/saveTypes";

interface CharacterTabProps {
  topBar: ReactNode;
  healthHud: ReactNode;
  accountEmail: string;
  character: CharacterRecord | null;
  onLogout: () => void;
  onSpendStatPoint: (statKey: "strength" | "agility" | "vitality" | "dexterity") => void;
}

export const CharacterTab = ({
  topBar,
  healthHud,
  accountEmail,
  character,
  onLogout,
  onSpendStatPoint
}: CharacterTabProps) => (
  <div className="content stack mobile-content">
    {topBar}
    {healthHud}
    <section className="panel stack">
      <h4>Account</h4>
      <div className="status-text">Email: {accountEmail || "Current session"}</div>
      <div className="status-text">Character: {character?.name ?? "None"}</div>
      <div className="status-text">Level: {character?.level ?? 0}</div>
      <div className="actions">
        <button className="secondary-button" onClick={onLogout}>
          Log out
        </button>
      </div>
    </section>
    <section className="panel stack">
      <h4>Level Up Stats</h4>
      <p className="status-text">Unspent points: {character?.unspentStatPoints ?? 0}</p>
      {(["strength", "agility", "vitality", "dexterity"] as const).map((statKey) => (
        <div key={statKey} className="inventory-row">
          <span>
            {statKey}: {character?.baseStats[statKey] ?? 0}
          </span>
          <button className="secondary-button" onClick={() => onSpendStatPoint(statKey)}>
            Add point
          </button>
        </div>
      ))}
      <div className="status-text">
        Strength improves spell power, Agility improves cast speed, Vitality improves life, Dexterity improves crit chance.
      </div>
      <div className="status-text">
        Healing: you refill to full when a new map starts and use a life flask that gains charges from kills.
      </div>
    </section>
  </div>
);
