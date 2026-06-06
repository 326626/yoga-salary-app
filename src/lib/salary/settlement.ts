import { roundMoney } from "./formatMoney";

export type SettlementTone = "neutral" | "positive" | "negative";

export function calculateSettlementDifference(expectedAmount: number, actualPaidAmount?: number | null) {
  if (actualPaidAmount === null || typeof actualPaidAmount === "undefined") return null;
  return roundMoney(actualPaidAmount - expectedAmount);
}

export function getSettlementLabel(expectedAmount: number, actualPaidAmount?: number | null) {
  const difference = calculateSettlementDifference(expectedAmount, actualPaidAmount);
  if (difference === null) return "";
  if (difference === 0) return "和预计工资一致";
  if (difference > 0) return `比预计多 ¥${Math.abs(difference).toFixed(2)}`;
  return `比预计少 ¥${Math.abs(difference).toFixed(2)}`;
}

export function getSettlementTone(expectedAmount: number, actualPaidAmount?: number | null): SettlementTone {
  const difference = calculateSettlementDifference(expectedAmount, actualPaidAmount);
  if (difference === null || difference === 0) return "neutral";
  return difference > 0 ? "positive" : "negative";
}
