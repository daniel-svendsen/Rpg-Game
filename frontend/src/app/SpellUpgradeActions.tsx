import { balanceConfig } from "../game/config/balanceConfig";
import { resolveSpell } from "../game/domain/spells/spellEngine";
import {
  canUpgradeSpell,
  getSpellLevel,
  getSpellUpgradeGemcuttersPrismCost,
  getSpellUpgradeGoldCost,
  getSpellUpgradeShardCost
} from "../game/domain/spells/spellProgression";
import type { CharacterRecord } from "../shared/types/saveTypes";

interface SpellUpgradeActionsProps {
  character: CharacterRecord | null;
  spellId: string;
  onUpgradeSpell: (spellId: string) => void;
}

const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;

export const SpellUpgradeActions = ({ character, spellId, onUpgradeSpell }: SpellUpgradeActionsProps) => {
  if (!character) {
    return null;
  }

  const spellLevel = getSpellLevel(character, spellId);
  const goldCost = getSpellUpgradeGoldCost(spellLevel);
  const shardCost = getSpellUpgradeShardCost(spellLevel);
  const prismCost = getSpellUpgradeGemcuttersPrismCost(spellLevel);
  const isUpgradeable = canUpgradeSpell(character, spellId);
  const isMaxLevel = spellLevel >= balanceConfig.spellProgression.maxLevel;
  const matchingLoadout = character.spellLoadout.find((loadout) => loadout.mainSpellId === spellId);
  const supportSpellIds = matchingLoadout?.supportSpellIds ?? [];
  const currentResolved = resolveSpell(character, spellId, supportSpellIds);
  const previewCharacter = {
    ...character,
    spellProgress: character.spellProgress.map((entry) =>
      entry.spellId === spellId
        ? { ...entry, level: Math.min(balanceConfig.spellProgression.maxLevel, entry.level + 1) }
        : entry
    )
  };
  const nextResolved = isMaxLevel ? null : resolveSpell(previewCharacter, spellId, supportSpellIds);

  return (
    <div className="stack compact-stack">
      <div className="status-text">
        {isMaxLevel
          ? "Max level reached"
          : `Upgrade cost: ${goldCost} gold${shardCost > 0 ? ` | ${shardCost} Map Shard${shardCost > 1 ? "s" : ""}` : ""} | ${prismCost} Gemcutter's Prism${prismCost > 1 ? "s" : ""}`}
      </div>
      {nextResolved ? (
        <div className="spell-upgrade-preview">
          <div className="spell-upgrade-preview__title">Next Level Preview</div>
          <div className="spell-upgrade-preview__grid">
            <span className="spell-upgrade-preview__label">Damage</span>
            <span className="spell-upgrade-preview__value">
              {currentResolved.damage} {"->"} {nextResolved.damage}
            </span>
            <span className="spell-upgrade-preview__label">Cooldown</span>
            <span className="spell-upgrade-preview__value">
              {(currentResolved.cooldownMs / 1000).toFixed(2)}s {"->"} {(nextResolved.cooldownMs / 1000).toFixed(2)}s
            </span>
            <span className="spell-upgrade-preview__label">Crit chance</span>
            <span className="spell-upgrade-preview__value">
              {formatPercent(currentResolved.critChance)} {"->"} {formatPercent(nextResolved.critChance)}
            </span>
            <span className="spell-upgrade-preview__label">Projectiles</span>
            <span className="spell-upgrade-preview__value">
              {currentResolved.projectileCount} {"->"} {nextResolved.projectileCount}
            </span>
          </div>
        </div>
      ) : null}
      <div className="actions">
        <button
          className="secondary-button"
          disabled={!isUpgradeable}
          onClick={() => onUpgradeSpell(spellId)}
          type="button"
        >
          {isMaxLevel ? "Maxed" : "Upgrade"}
        </button>
      </div>
    </div>
  );
};
