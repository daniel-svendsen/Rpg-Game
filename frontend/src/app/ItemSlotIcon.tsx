import type { ItemSlot, EquipmentSlot } from "../shared/types/saveTypes";

type AnySlot = ItemSlot | EquipmentSlot;

const normalize = (slot: AnySlot): ItemSlot => {
  if (slot === "Ring1" || slot === "Ring2") return "Ring";
  return slot as ItemSlot;
};

interface ItemSlotIconProps {
  slot: AnySlot;
  size?: number;
}

export const ItemSlotIcon = ({ slot, size = 18 }: ItemSlotIconProps) => {
  const base = {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    className: "slot-icon",
    "aria-hidden": true as const,
    focusable: "false" as const
  };

  switch (normalize(slot)) {
    case "Weapon":
      return (
        <svg {...base} fill="none" stroke="currentColor" strokeLinecap="round">
          <line x1="6" y1="18" x2="18" y2="6" strokeWidth="1.9" />
          <line x1="9" y1="9" x2="15" y2="15" strokeWidth="2.6" />
        </svg>
      );

    case "Helmet":
      return (
        <svg {...base} fill="currentColor">
          <path d="M4 16 Q4 5 12 5 Q20 5 20 16 L17 18 L7 18 Z" />
        </svg>
      );

    case "BodyArmor":
      return (
        <svg {...base} fill="currentColor">
          <path d="M8 4 L4 9 L4 18 L20 18 L20 9 L16 4 Q13 7 12 7 Q11 7 8 4 Z" />
        </svg>
      );

    case "Belt":
      return (
        <svg {...base} fill="none" stroke="currentColor">
          <rect x="3" y="10" width="18" height="4" rx="2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="2" strokeWidth="1.6" />
        </svg>
      );

    case "Gloves":
      return (
        <svg {...base} fill="currentColor">
          <path d="M7 19 L7 9 Q7 6 10 6 L14 6 Q17 6 17 9 L17 19 Q12 21 7 19 Z" />
        </svg>
      );

    case "Boots":
      return (
        <svg {...base} fill="currentColor">
          <path d="M8 4 L8 16 L5 19 L17 19 L17 17 L10 17 L10 4 Z" />
        </svg>
      );

    case "Amulet":
      return (
        <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
          <path d="M12 4 L18 12 L12 20 L6 12 Z" />
        </svg>
      );

    case "Ring":
      return (
        <svg {...base} fill="none" stroke="currentColor" strokeWidth="2.4">
          <circle cx="12" cy="12" r="6" />
        </svg>
      );

    default:
      return null;
  }
};
