import { summarizeComparison } from "./itemComparison";

type Summary = ReturnType<typeof summarizeComparison>;

export const getDeltaChipClass = (
  value: number
): "delta-chip--positive" | "delta-chip--negative" | "delta-chip--neutral" => {
  if (!Number.isFinite(value)) {
    return "delta-chip--neutral";
  }
  if (value > 0) {
    return "delta-chip--positive";
  }
  if (value < 0) {
    return "delta-chip--negative";
  }
  return "delta-chip--neutral";
};

export const formatSignedPercent = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${value > 0 ? "+" : ""}${value}%`;
};

export const toChipModel = (
  summary: Summary | null
): null | {
  damageClass: string;
  damageText: string;
  survivalClass: string;
  survivalText: string;
} => {
  if (!summary) {
    return null;
  }

  const damagePercentDelta = Number.isFinite(summary.damagePercentDelta) ? summary.damagePercentDelta : 0;
  const survivalPercentDelta = Number.isFinite(summary.survivalPercentDelta) ? summary.survivalPercentDelta : 0;

  return {
    damageClass: getDeltaChipClass(damagePercentDelta),
    damageText: formatSignedPercent(damagePercentDelta),
    survivalClass: getDeltaChipClass(survivalPercentDelta),
    survivalText: formatSignedPercent(survivalPercentDelta)
  };
};
