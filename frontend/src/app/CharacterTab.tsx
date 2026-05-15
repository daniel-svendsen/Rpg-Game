import { useState, type ReactNode } from "react";
import type { CharacterRecord } from "../shared/types/saveTypes";
import { getCharacterCombatSummary } from "./combatSummary";
import { getCharacterDefenseEstimate } from "./defenseEstimate";

interface CharacterTabProps {
  topBar: ReactNode;
  healthHud: ReactNode;
  accountEmail: string;
  character: CharacterRecord | null;
  selectedMapId: string;
  onLogout: () => void;
  onSwitchCharacter: () => void;
  onDeleteCharacter: () => Promise<void>;
  onSpendStatPoint: (statKey: "strength" | "agility" | "vitality" | "dexterity" | "intelligence") => void;
}

export const CharacterTab = ({
  topBar,
  healthHud,
  accountEmail,
  character,
  selectedMapId,
  onLogout,
  onSwitchCharacter,
  onDeleteCharacter,
  onSpendStatPoint
}: CharacterTabProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const combatSummary = character ? getCharacterCombatSummary(character) : null;
  const defenseEstimate = character ? getCharacterDefenseEstimate(character, selectedMapId) : null;
  const defenseContextLabel = defenseEstimate
    ? defenseEstimate.context.source === "recent"
      ? `Recent Tier ${defenseEstimate.context.map.tier}`
      : `Tier ${defenseEstimate.context.map.tier}`
    : "-";

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
          <button className="secondary-button" onClick={onSwitchCharacter}>
            Switch Character
          </button>
          <button className="secondary-button" onClick={onLogout}>
            Log out
          </button>
        </div>
        {character ? (
          <div className="actions">
            {showDeleteConfirm ? (
              <>
                <p className="status-text">Delete {character.name}? This cannot be undone.</p>
                <button
                  className="secondary-button"
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    await onDeleteCharacter();
                    setIsDeleting(false);
                    setShowDeleteConfirm(false);
                  }}
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
                <button className="secondary-button" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="secondary-button" onClick={() => setShowDeleteConfirm(true)}>
                Delete Character
              </button>
            )}
          </div>
        ) : null}
      </section>
      <section className="panel stack">
        <h4>Character Stats</h4>
        <div className="stat-section stack">
          <h5>Offensive</h5>
          <div className="status-text">Total Damage: {combatSummary ? Math.round(combatSummary.totalDamage) : 0}</div>
          <div className="status-text">
            Cast Speed: +{Math.round((character?.derivedStats.castSpeedMultiplier ?? 1) * 100 - 100)}%
          </div>
          <div className="status-text">
            Attack Speed: +{Math.round((character?.derivedStats.attackSpeedMultiplier ?? 1) * 100 - 100)}%
          </div>
          <div className="status-text">
            Crit Chance: {Math.round((character?.derivedStats.critChance ?? 0) * 100)}%
          </div>
          <div className="status-text">
            Spell Damage: +{Math.round(((character?.derivedStats.spellPowerMultiplier ?? 1) - 1) * 100)}%
          </div>
        </div>
        <div className="stat-section stack">
          <h5>Defensive</h5>
          <div className="status-text">Total Survival: {combatSummary ? Math.round(combatSummary.totalSurvival) : 0}</div>
          <div className="status-text">Max Health: {character?.derivedStats.maxHealth ?? 0}</div>
          <div className="status-text">Armor: {character?.derivedStats.armor ?? 0}</div>
          <div className="status-text">Evasion: {character?.derivedStats.evasion ?? 0}</div>
          <div className="status-text">
            Resistances:{" "}
            {character
              ? `Fire ${Math.round(character.derivedStats.resistances.Fire * 100)}% | Cold ${Math.round(character.derivedStats.resistances.Cold * 100)}% | Lightning ${Math.round(character.derivedStats.resistances.Lightning * 100)}%`
              : "-"}
          </div>
          {defenseEstimate ? (
            <div className="defense-estimate stack">
              <div className="status-text">Defense Estimate: {defenseContextLabel}</div>
              <div className="status-text">Incoming Hit: ~{defenseEstimate.incomingHit}</div>
              <div className="status-text">
                Armor Outcome: {Math.round(defenseEstimate.armorReduction * 100)}% physical reduction, ~
                {defenseEstimate.physicalDamageAfterArmor} damage taken
              </div>
              <div className="status-text">
                Evasion Outcome: {Math.round(defenseEstimate.evasionChance * 100)}% evade chance
              </div>
              <div className="status-text">
                Physical Prevention: {Math.round(defenseEstimate.expectedPhysicalPrevention * 100)}% expected per hit
              </div>
              <div className="status-text">
                Elemental Hit Taken: Fire ~{defenseEstimate.elementalDamageTaken.Fire} | Cold ~
                {defenseEstimate.elementalDamageTaken.Cold} | Lightning ~
                {defenseEstimate.elementalDamageTaken.Lightning}
              </div>
            </div>
          ) : null}
        </div>
        <div className="stat-section stack">
          <h5>Utility</h5>
          <div className="status-text">
            Movement Speed: +{Math.round(((character?.derivedStats.movementSpeedMultiplier ?? 1) - 1) * 100)}%
          </div>
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
