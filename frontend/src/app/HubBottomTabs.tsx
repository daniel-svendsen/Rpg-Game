import type { HubTab } from "./appTypes";

interface HubBottomTabsProps {
  activeTab: HubTab;
  onSelectTab: (tab: HubTab) => void;
}

const tabs: Array<{ id: HubTab; label: string; icon: string }> = [
  { id: "maps", label: "Maps", icon: "◈" },
  { id: "boss", label: "Boss", icon: "☠" },
  { id: "equipment", label: "Gear", icon: "⚔" },
  { id: "spells", label: "Spells", icon: "✦" },
  { id: "shop", label: "Shop", icon: "◎" },
  { id: "character", label: "Character", icon: "⊙" }
];

export const HubBottomTabs = ({ activeTab, onSelectTab }: HubBottomTabsProps) => (
  <nav className="bottom-tabs">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        className={activeTab === tab.id ? "bottom-tab active-tab" : "bottom-tab"}
        onClick={() => onSelectTab(tab.id)}
      >
        <span className="tab-icon">{tab.icon}</span>
        <span className="tab-label">{tab.label}</span>
      </button>
    ))}
  </nav>
);
