import { useState } from "react";
import type { HubTab } from "./appTypes";

interface HubBottomTabsProps {
  activeTab: HubTab;
  onSelectTab: (tab: HubTab) => void;
}

const mainTabs: Array<{ id: HubTab; label: string; icon: string }> = [
  { id: "maps", label: "Maps", icon: "◈" },
  { id: "boss", label: "Boss", icon: "☠" },
  { id: "equipment", label: "Gear", icon: "⚔" },
  { id: "spells", label: "Spells", icon: "✦" },
  { id: "craft", label: "Craft", icon: "⚗" }
];

const menuTabs: Array<{ id: HubTab; label: string }> = [
  { id: "shop", label: "Shop" },
  { id: "character", label: "Character" },
  { id: "account", label: "Account" }
];

export const HubBottomTabs = ({ activeTab, onSelectTab }: HubBottomTabsProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMenuTab = menuTabs.some((t) => t.id === activeTab);

  const handleMenuSelect = (tab: HubTab) => {
    onSelectTab(tab);
    setMenuOpen(false);
  };

  return (
    <nav className="bottom-tabs">
      {mainTabs.map((tab) => (
        <button
          key={tab.id}
          className={activeTab === tab.id ? "bottom-tab active-tab" : "bottom-tab"}
          onClick={() => onSelectTab(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
      <div className="bottom-tab-menu-wrapper">
        <button
          className={isMenuTab || menuOpen ? "bottom-tab active-tab" : "bottom-tab"}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span className="tab-icon">☰</span>
          <span className="tab-label">More</span>
        </button>
        {menuOpen && (
          <div className="bottom-tab-menu">
            {menuTabs.map((tab) => (
              <button
                key={tab.id}
                className={activeTab === tab.id ? "bottom-tab-menu-item active" : "bottom-tab-menu-item"}
                onClick={() => handleMenuSelect(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};
