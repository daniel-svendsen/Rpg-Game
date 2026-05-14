import { useState, useEffect, type ReactNode } from "react";
import type { CharacterRecord, InventoryItem } from "../shared/types/saveTypes";
import {
  craftingOrbs,
  craftingRecipes,
  craftingCurrencyNames,
  type CraftingOrbId,
  type CraftingCurrencyCode
} from "../game/config/craftingConfig";
import { canApplyOrb } from "../game/domain/crafting/craftingDomain";
import { getCurrencyAmount } from "./mapFlow";
import { getItemStatEntries, getStatLabel, type StatEntry } from "../game/domain/items/itemStats";

interface CraftTabProps {
  topBar: ReactNode;
  character: CharacterRecord | null;
  onApplyCraftingOrb: (itemId: string, orbCode: string) => void;
  onCombineOrbs: (outputCode: string) => void;
}

const buildKindByLabel = (item: InventoryItem): Map<string, "Prefix" | "Suffix"> =>
  new Map((item.affixes ?? []).map((a) => [getStatLabel(a.statKey), a.kind]));

const orbOrder: CraftingOrbId[] = [
  "orbOfAwakening",
  "orbOfBinding",
  "orbOfAscension",
  "orbOfUnmaking",
  "orbOfUnraveling"
];

const rarityClass: Record<string, string> = {
  Normal: "rarity-normal",
  Magic: "rarity-magic",
  Rare: "rarity-rare",
  Unique: "rarity-unique"
};

const renderStatEntries = (
  entries: StatEntry[],
  highlightLabels: ReadonlySet<string>,
  removedLabels: ReadonlySet<string>,
  kindByLabel: ReadonlyMap<string, "Prefix" | "Suffix">
) => {
  const base = entries.filter((e) => e.isBase);
  const allAffixes = entries.filter((e) => !e.isBase);
  const prefixes = allAffixes.filter((e) => kindByLabel.get(e.label) === "Prefix");
  const suffixes = allAffixes.filter((e) => kindByLabel.get(e.label) === "Suffix");
  const ungrouped = allAffixes.filter((e) => !kindByLabel.has(e.label));
  const hasGroups = prefixes.length > 0 || suffixes.length > 0;

  const renderLine = (e: StatEntry) => (
    <div
      key={e.label}
      className={["stat-line", e.tier !== null ? `stat-tier-${e.tier}` : "", highlightLabels.has(e.label) ? "craft-stat-new" : "", removedLabels.has(e.label) ? "craft-stat-removed" : ""].filter(Boolean).join(" ")}
    >
      {e.tier !== null && <span className="stat-tier-dot" />}
      <span className="stat-label">
        {e.label}
        {e.tier !== null && <span className={`craft-tier-badge craft-tier-badge--${e.tier}`}>T{e.tier}</span>}
      </span>
      <span className="stat-value">{e.formattedValue}</span>
    </div>
  );

  return (
    <>
      {base.length > 0 && <p className="affix-group-label">Base Stat</p>}
      {base.map((e) => (
        <div
          key={e.label}
          className={["stat-line", highlightLabels.has(e.label) ? "craft-stat-new" : "", removedLabels.has(e.label) ? "craft-stat-removed" : ""].filter(Boolean).join(" ")}
        >
          <span className="stat-label">{e.label}</span>
          <span className="stat-value">{e.formattedValue}</span>
        </div>
      ))}
      {allAffixes.length > 0 && <div className="item-divider" />}
      {ungrouped.map(renderLine)}
      {hasGroups && ungrouped.length > 0 && <div className="item-divider" />}
      {prefixes.length > 0 && (
        <>
          <p className="affix-group-label">Prefix</p>
          {prefixes.map(renderLine)}
        </>
      )}
      {prefixes.length > 0 && suffixes.length > 0 && <div className="item-divider" />}
      {suffixes.length > 0 && (
        <>
          <p className="affix-group-label">Suffix</p>
          {suffixes.map(renderLine)}
        </>
      )}
    </>
  );
};

export const CraftTab = ({ topBar, character, onApplyCraftingOrb, onCombineOrbs }: CraftTabProps) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [craftBefore, setCraftBefore] = useState<InventoryItem | null>(null);

  useEffect(() => {
    setCraftBefore(null);
  }, [selectedItemId]);

  if (!character) {
    return (
      <div className="content mobile-content">
        {topBar}
      </div>
    );
  }

  const allItems: InventoryItem[] = [
    ...Object.values(character.equippedItems).filter((item): item is InventoryItem => item !== undefined),
    ...character.inventory
  ];

  const equippedIds = new Set(
    Object.values(character.equippedItems)
      .filter((item): item is InventoryItem => item !== undefined)
      .map((item) => item.id)
  );

  const craftableItems = allItems.filter((item) => item.slot !== null && item.rarity !== "Unique");
  const selectedItem = craftableItems.find((item) => item.id === selectedItemId) ?? null;

  const getOrbCount = (code: CraftingCurrencyCode): number =>
    getCurrencyAmount(character, code);

  const canCombine = (outputCode: CraftingCurrencyCode): boolean => {
    const recipe = craftingRecipes.find((r) => r.outputCode === outputCode);
    if (!recipe) return false;
    return recipe.inputs.every((input) => getOrbCount(input.code) >= input.amount);
  };

  const handleApplyOrb = (itemId: string, orbId: CraftingOrbId) => {
    const snapshot = craftableItems.find((i) => i.id === itemId) ?? null;
    setCraftBefore(snapshot);
    onApplyCraftingOrb(itemId, orbId);
  };

  const afterEntries = selectedItem ? getItemStatEntries(selectedItem) : [];
  const beforeEntries = craftBefore ? getItemStatEntries(craftBefore) : [];

  const beforeValueByLabel = new Map(beforeEntries.map((e) => [e.label, e.formattedValue]));
  const newLabels = new Set(
    afterEntries.filter((e) => beforeValueByLabel.get(e.label) !== e.formattedValue).map((e) => e.label)
  );
  const afterLabelSet = new Set(afterEntries.map((e) => e.label));
  const removedLabels = new Set(beforeEntries.filter((e) => !afterLabelSet.has(e.label)).map((e) => e.label));
  const rarityChanged = craftBefore !== null && selectedItem !== null && craftBefore.rarity !== selectedItem.rarity;

  const kindByLabelAfter = selectedItem ? buildKindByLabel(selectedItem) : new Map<string, "Prefix" | "Suffix">();
  const kindByLabelBefore = craftBefore ? buildKindByLabel(craftBefore) : new Map<string, "Prefix" | "Suffix">();

  return (
    <div className="content mobile-content">
      {topBar}
      <div className="craft-tab">

        {/* Apply orb section */}
        <section className="craft-section">
          {selectedItem ? (
            <>
              <div className="craft-selected-item">
                <span className={["craft-selected-item-name", rarityClass[selectedItem.rarity] ?? ""].join(" ")}>
                  {selectedItem.name}
                </span>
                <span className="craft-selected-item-meta">
                  {selectedItem.rarity} · T{selectedItem.tier}
                  {equippedIds.has(selectedItem.id) ? " · Equipped" : ""}
                </span>
              </div>

              {craftBefore ? (
                <div className="craft-item-preview">
                  {rarityChanged && (
                    <p className="craft-rarity-change">
                      {craftBefore.rarity} → {selectedItem.rarity}
                    </p>
                  )}
                  <span className="craft-preview-label craft-preview-label--after">After</span>
                  <div className="craft-stat-block">
                    {renderStatEntries(afterEntries, newLabels, new Set(), kindByLabelAfter)}
                  </div>
                  <div className="craft-preview-divider" />
                  <span className="craft-preview-label">Before</span>
                  <div className="craft-stat-block craft-stat-block--before">
                    {renderStatEntries(beforeEntries, new Set(), removedLabels, kindByLabelBefore)}
                  </div>
                </div>
              ) : (
                <div className="craft-stat-block">
                  {renderStatEntries(afterEntries, new Set(), new Set(), kindByLabelAfter)}
                </div>
              )}

              <div className="craft-orb-list">
                {orbOrder.map((orbId) => {
                  const orb = craftingOrbs[orbId];
                  const count = getOrbCount(orbId);
                  const blockReason = canApplyOrb(selectedItem, orbId);
                  const disabled = count === 0 || blockReason !== null;
                  const tooltip = blockReason ? blockReason.message : orb.description;
                  return (
                    <button
                      key={orbId}
                      className={["craft-orb-btn", disabled ? "disabled" : ""].join(" ").trim()}
                      disabled={disabled}
                      title={tooltip}
                      onClick={() => handleApplyOrb(selectedItem.id, orbId)}
                    >
                      <div className="craft-orb-btn-top">
                        <span className="craft-orb-name">{orb.name}</span>
                        <span className="craft-orb-count">×{count}</span>
                      </div>
                      <span className="craft-orb-desc">{orb.description}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="craft-hint">Select an item below to apply an orb.</p>
          )}
        </section>

        {/* Item picker */}
        <section className="craft-section">
          <h3 className="craft-section-title">Select Item</h3>
          <div className="craft-item-list">
            {craftableItems.map((item) => {
              const isEquipped = equippedIds.has(item.id);
              return (
                <button
                  key={item.id}
                  className={[
                    "craft-item-row",
                    selectedItemId === item.id ? "selected" : "",
                    rarityClass[item.rarity] ?? "",
                    isEquipped ? "craft-item-row-equipped" : ""
                  ].join(" ").trim()}
                  onClick={() => setSelectedItemId(item.id === selectedItemId ? null : item.id)}
                >
                  <span className="craft-item-name">{item.name}</span>
                  <span className="craft-item-meta">{item.rarity} · T{item.tier}</span>
                  {isEquipped && <span className="craft-item-equipped-badge">Equipped</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Currency + combine */}
        <section className="craft-section">
          <h3 className="craft-section-title">Crafting Materials</h3>
          <div className="craft-currency-grid">
            <div className="craft-currency-row">
              <span className="craft-currency-name">{craftingCurrencyNames.craftingShard}</span>
              <span className="craft-currency-amount">{getOrbCount("craftingShard")}</span>
            </div>
            {orbOrder.map((orbId) => {
              const orb = craftingOrbs[orbId];
              const count = getOrbCount(orbId);
              const recipe = craftingRecipes.find((r) => r.outputCode === orbId);
              return (
                <div key={orbId} className="craft-currency-row craft-currency-row-orb">
                  <div className="craft-currency-orb-info">
                    <span className="craft-currency-name">{orb.name}</span>
                    <span className="craft-currency-orb-desc">{orb.description}</span>
                  </div>
                  <span className="craft-currency-amount">{count}</span>
                  {recipe && (
                    <button
                      className="craft-combine-btn"
                      disabled={!canCombine(orbId)}
                      onClick={() => onCombineOrbs(orbId)}
                      title={recipe.inputs.map((i) => `${i.amount}x ${craftingCurrencyNames[i.code]}`).join(", ")}
                    >
                      {recipe.inputs[0].amount}×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
};
