export const displayDensities = ["compact", "standard", "comfortable"] as const;

export type DisplayDensity = (typeof displayDensities)[number];

export const defaultDisplayDensity: DisplayDensity = "standard";

export const displayDensityLabels: Record<DisplayDensity, string> = {
  compact: "紧凑",
  standard: "标准",
  comfortable: "舒适"
};

export function isDisplayDensity(value: unknown): value is DisplayDensity {
  return typeof value === "string" && displayDensities.includes(value as DisplayDensity);
}

export function resolveDisplayDensity(value: unknown): DisplayDensity {
  return isDisplayDensity(value) ? value : defaultDisplayDensity;
}
