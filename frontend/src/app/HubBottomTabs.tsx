type HubTab = "maps" | "equipment" | "spells" | "inventory" | "shop" | "character";

interface HubBottomTabsProps {
  activeTab: HubTab;
  onSelectTab: (tab: HubTab) => void;
}

const tabs: Array<{ id: HubTab; label: string }> = [
  { id: "maps", label: "Maps" },
  { id: "equipment", label: "Gear" },
  { id: "spells", label: "Spells" },
  { id: "inventory", label: "Bag" },
  { id: "shop", label: "Shop" },
  { id: "character", label: "Account" }
];

export const HubBottomTabs = ({ activeTab, onSelectTab }: HubBottomTabsProps) => (
  <nav className="bottom-tabs">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        className={activeTab === tab.id ? "bottom-tab active-tab" : "bottom-tab"}
        onClick={() => onSelectTab(tab.id)}
      >
        {tab.label}
      </button>
    ))}
  </nav>
);
