import type { ReactNode } from "react";
import type { CharacterRecord } from "../shared/types/saveTypes";
import { getCharacterCombatSummary } from "./combatSummary";

interface CharacterTabProps {
  topBar: ReactNode;
  healthHud: ReactNode;
  accountEmail: string;
  character: CharacterRecord | null;
  onLogout: () => void;
  onSpendStatPoint: (statKey: "strength" | "agility" | "vitality" | "dexterity" | "intelligence") => void;
}

export const CharacterTab = ({
  topBar,
  healthHud,
  accountEmail,
  character,
  onLogout,
  onSpendStatPoint
}: CharacterTabProps) => {
  const combatSummary = character ? getCharacterCombatSummary(character) : null;

  return (
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
        <h4>Character Stats</h4>
        <div className="status-text">Total Damage: {combatSummary ? Math.round(combatSummary.totalDamage) : 0}</div>
        <div className="status-text">Total Survival: {combatSummary ? Math.round(combatSummary.totalSurvival) : 0}</div>
        <div className="status-text">Max Health: {character?.derivedStats.maxHealth ?? 0}</div>
        <div className="status-text">Armor: {character?.derivedStats.armor ?? 0}</div>
        <div className="status-text">Evasion: {character?.derivedStats.evasion ?? 0}</div>
        <div className="status-text">
          Cast Speed: +{Math.round((character?.derivedStats.castSpeedMultiplier ?? 1) * 100 - 100)}%
        </div>
        <div className="status-text">
          Attack Speed: +{Math.round((character?.derivedStats.attackSpeedMultiplier ?? 1) * 100 - 100)}%
        </div>
        <div className="status-text">
          Movement Speed: +{Math.round(((character?.derivedStats.movementSpeedMultiplier ?? 1) - 1) * 100)}%
        </div>
        <div className="status-text">
          Crit Chance: {Math.round((character?.derivedStats.critChance ?? 0) * 100)}%
        </div>
        <div className="status-text">
          Spell Damage: +{Math.round(((character?.derivedStats.spellPowerMultiplier ?? 1) - 1) * 100)}%
        </div>
        <div className="status-text">
          Resistances:{" "}
          {character
            ? `Fire ${Math.round(character.derivedStats.resistances.Fire * 100)}% | Cold ${Math.round(character.derivedStats.resistances.Cold * 100)}% | Lightning ${Math.round(character.derivedStats.resistances.Lightning * 100)}%`
            : "-"}
        </div>
      </section>
      <section className="panel stack">
        <h4>Level Up Stats</h4>
        <p className="status-text">Unspent points: {character?.unspentStatPoints ?? 0}</p>
        {(["strength", "agility", "vitality", "dexterity", "intelligence"] as const).map((statKey) => (
          <div key={statKey} className="inventory-row">
            <span>
              {statKey.charAt(0).toUpperCase() + statKey.slice(1)}: {character?.baseStats[statKey] ?? 0}
            </span>
            <button className="secondary-button" onClick={() => onSpendStatPoint(statKey)}>
              Add point
            </button>
          </div>
        ))}
        <div className="status-text">
          Strength improves physical damage and attack speed, Agility improves attack speed, Vitality improves life,
          Dexterity improves crit chance, Intelligence improves spell damage and cast speed.
        </div>
        <div className="status-text">
          Healing: you refill to full when a new map starts and use a life flask that gains charges from kills.
        </div>
      </section>
    </div>
  );
};
