import { Fragment, type ReactNode } from "react";
import { getSpellDescription, getSpellName } from "../game/domain/spells/spellDrops";
import { spellConfig, supportSpellConfig } from "../game/config/spellConfig";
import { resolveSpell } from "../game/domain/spells/spellEngine";
import { getSupportEffectDetails, getSupportPassiveDetails, getSupportRoleTags } from "./supportSpellPresentation";
import { getSpellAccentClassName, getSupportAccentClassName } from "./appUiHelpers";
import { SpellUpgradeActions } from "./SpellUpgradeActions";
import { SupportUpgradeActions } from "./SupportUpgradeActions";

const getSpellElementSymbol = (spellId: string): string => {
  const tags = spellConfig[spellId]?.tags ?? [];
  if (tags.includes("Lightning")) return "⚡";
  if (tags.includes("Fire")) return "✦";
  if (tags.includes("Cold")) return "❄";
  return "◈";
};

const getSupportElementSymbol = (supportId: string): string => {
  const tags = supportSpellConfig[supportId]?.tags ?? [];
  if (tags.includes("CastSpeed")) return "⟳";
  if (tags.includes("Critical")) return "◆";
  if (tags.includes("Chain") || tags.includes("Projectile")) return "➤";
  if (tags.includes("Area")) return "◉";
  return "✦";
};
import type { CharacterRecord } from "../shared/types/saveTypes";

interface SpellsTabProps {
  topBar: ReactNode;
  character: CharacterRecord | null;
  getSpellDetailLines: (spellId: string, supportSpellIds: string[]) => string[];
  onOpenMainSpellPicker: () => void;
  onOpenSupportPicker: (slotIndex: 0 | 1) => void;
  onOpenPassivePicker: (slotIndex: 0 | 1 | 2) => void;
  onUpgradeSpell: (spellId: string) => void;
  onUpgradeSupport: (supportSpellId: string) => void;
}

export const SpellsTab = ({
  topBar,
  character,
  getSpellDetailLines,
  onOpenMainSpellPicker,
  onOpenSupportPicker,
  onOpenPassivePicker,
  onUpgradeSpell,
  onUpgradeSupport
}: SpellsTabProps) => {
  const activeMainSpellId = character?.spellLoadout[0]?.mainSpellId ?? "";
  const supportSlots = character?.spellLoadout[0]?.supportSpellIds ?? [];
  const activeSupportSpellIds = supportSlots.filter(Boolean) as string[];
  const resolvedSpell = character && activeMainSpellId
    ? resolveSpell(character, activeMainSpellId, activeSupportSpellIds)
    : null;
  const critMultiplier = character?.derivedStats.critMultiplier ?? 1.6;

  const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;
  const supportEffectRows = activeSupportSpellIds
    .map((supportSpellId) => {
      const support = supportSpellConfig[supportSpellId];
      if (!support) {
        return null;
      }

      return {
        id: support.id,
        name: support.name,
        details: getSupportEffectDetails(support.id).join(", ") || "No direct stat modifier",
        roleTags: getSupportRoleTags(support.id)
      };
    })
    .filter((row): row is { id: string; name: string; details: string; roleTags: string[] } => Boolean(row));
  const supplementalMainSpellLines = getSpellDetailLines(activeMainSpellId, activeSupportSpellIds);
  const passiveSlots = character?.passiveSupportIds ?? [];

  return (
    <div className="content stack mobile-content">
      {topBar}
      <section className="panel stack">
        <div className="spell-panel-header">
          <p className="status-text">Link supports to your spell to enhance its effects. Tap an orb to change it.</p>
          {activeMainSpellId ? (
            <p className="status-text spell-description">{getSpellDescription(activeMainSpellId)}</p>
          ) : null}
        </div>
        <div className="materia-strip">
          <div className="materia-node">
            <button
              className={`materia-orb main-materia ${getSpellAccentClassName(activeMainSpellId)}`}
              onClick={onOpenMainSpellPicker}
              type="button"
              title={getSpellName(activeMainSpellId)}
            >
              <span className="materia-orb-icon">{getSpellElementSymbol(activeMainSpellId)}</span>
            </button>
            <div className="materia-node-caption">{getSpellName(activeMainSpellId) || "Choose spell"}</div>
          </div>
          <div className="materia-link" />
          {[0, 1].map((slotIndex) => {
            const supportId = supportSlots[slotIndex];
            const supportName = supportId ? (supportSpellConfig[supportId]?.name ?? supportId) : null;

            return (
              <Fragment key={slotIndex}>
                <div className="materia-node">
                  <button
                    className={`materia-orb support-materia ${
                      supportId ? getSupportAccentClassName(supportId) : "empty-materia"
                    }`}
                    onClick={() => onOpenSupportPicker(slotIndex as 0 | 1)}
                    type="button"
                    title={supportName ?? `Support slot ${slotIndex + 1}`}
                  >
                    <span className="materia-orb-icon">
                      {supportId ? getSupportElementSymbol(supportId) : "+"}
                    </span>
                  </button>
                  <div className="materia-node-caption">
                    {supportName ?? "Link support"}
                  </div>
                </div>
                {slotIndex === 0 ? <div className="materia-link" /> : null}
              </Fragment>
            );
          })}
        </div>
        <div className="materia-strip">
          {([0, 1, 2] as const).map((slotIndex) => {
            const passiveId = passiveSlots[slotIndex];
            const passiveName = passiveId ? (supportSpellConfig[passiveId]?.name ?? passiveId) : null;
            const passiveTags = passiveId ? (supportSpellConfig[passiveId]?.tags ?? []) : [];
            const passiveSymbol = passiveId
              ? (passiveTags.includes("CastSpeed") ? "⟳" : passiveTags.includes("Critical") ? "◆" : passiveTags.includes("Chain") || passiveTags.includes("Projectile") ? "➤" : passiveTags.includes("Area") ? "◉" : "✦")
              : "◈";

            return (
              <div key={slotIndex} className="materia-node">
                <button
                  className={`materia-orb support-materia ${
                    passiveId ? getSupportAccentClassName(passiveId) : "empty-materia"
                  }`}
                  onClick={() => onOpenPassivePicker(slotIndex)}
                  type="button"
                  title={passiveName ?? `Passive slot ${slotIndex + 1}`}
                >
                  <span className="materia-orb-icon">{passiveSymbol}</span>
                </button>
                <div className="materia-node-caption">
                  {passiveName ?? `Passive ${slotIndex + 1}`}
                </div>
              </div>
            );
          })}
        </div>
        {passiveSlots.filter(Boolean).length > 0 ? (
          <div className="stack compact-stack">
            {passiveSlots.filter(Boolean).map((passiveId, index) => {
              const passiveDetails = getSupportPassiveDetails(passiveId).join(", ");
              const passiveName = supportSpellConfig[passiveId]?.name ?? passiveId;
              return passiveDetails ? (
                <div key={`${passiveId}-${index}`} className="active-result-support-card">
                  <strong>{passiveName}</strong>
                  <span className="status-text">{passiveDetails}</span>
                  <SupportUpgradeActions
                    character={character}
                    supportSpellId={passiveId}
                    onUpgradeSupport={onUpgradeSupport}
                  />
                </div>
              ) : null;
            })}
          </div>
        ) : null}
        {resolvedSpell ? (
          <section className="final-output-panel stack compact-stack">
            <h4>Active Result</h4>
            <div className="active-result-section">
              <div className="active-result-section__title">Main Spell</div>
              <strong className="active-result-main-spell-name">
                {getSpellName(activeMainSpellId) || "Linked Spell"}
              </strong>
              {supplementalMainSpellLines.length > 0 ? (
                <div className="active-result-main-spell-notes">
                  {supplementalMainSpellLines.map((line) => (
                    <span key={`active-result-${line}`} className="status-text">
                      {line}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="final-output-grid">
                <span className="status-text">Damage / hit</span>
                <strong>{resolvedSpell.damage}</strong>
                <span className="status-text">Cooldown</span>
                <strong>{(resolvedSpell.cooldownMs / 1000).toFixed(2)}s</strong>
                <span className="status-text">Cast rate</span>
                <strong>{(1000 / resolvedSpell.cooldownMs).toFixed(2)} casts/s</strong>
                <span className="status-text">Projectiles</span>
                <strong>{resolvedSpell.projectileCount}</strong>
                <span className="status-text">Chains</span>
                <strong>{resolvedSpell.chainCount}</strong>
                <span className="status-text">Area radius</span>
                <strong>{resolvedSpell.areaRadius}</strong>
                <span className="status-text">Crit chance</span>
                <strong>{formatPercent(resolvedSpell.critChance)}</strong>
                <span className="status-text">Crit multiplier</span>
                <strong>{critMultiplier.toFixed(2)}x</strong>
                <span className="status-text">Penetration (Fire/Cold/Lightning)</span>
                <strong>
                  {formatPercent(resolvedSpell.resistancePenetration.Fire)} / {formatPercent(resolvedSpell.resistancePenetration.Cold)} / {formatPercent(resolvedSpell.resistancePenetration.Lightning)}
                </strong>
              </div>
            </div>
            <div className="active-result-supports">
              <div className="active-result-section__title">Supports</div>
              {supportEffectRows.length > 0 ? (
                supportEffectRows.map((support, index) => (
                  <div key={support.id} className="active-result-support-card">
                    <div className="active-result-support-card__slot">Support {index + 1}</div>
                    <strong>{support.name}</strong>
                    {support.roleTags.length > 0 ? (
                      <div className="support-role-tag-row">
                        {support.roleTags.map((tag) => (
                          <span
                            key={`${support.id}-${tag}`}
                            className={`support-role-tag support-role-tag--${tag.toLowerCase()}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <span className="status-text">{support.details}</span>
                    <SupportUpgradeActions
                      character={character}
                      supportSpellId={support.id}
                      onUpgradeSupport={onUpgradeSupport}
                    />
                  </div>
                ))
              ) : (
                <span className="status-text">No linked supports</span>
              )}
            </div>
          </section>
        ) : null}
        <SpellUpgradeActions
          character={character}
          spellId={activeMainSpellId}
          onUpgradeSpell={onUpgradeSpell}
        />
      </section>
    </div>
  );
};
