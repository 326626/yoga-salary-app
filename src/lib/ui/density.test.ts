import { describe, expect, it } from "vitest";

import { defaultDisplayDensity, displayDensityLabels, isDisplayDensity, resolveDisplayDensity } from "./density";

describe("display density helpers", () => {
  it("recognizes supported display densities", () => {
    expect(isDisplayDensity("compact")).toBe(true);
    expect(isDisplayDensity("standard")).toBe(true);
    expect(isDisplayDensity("comfortable")).toBe(true);
    expect(isDisplayDensity("tiny")).toBe(false);
  });

  it("falls back to standard density for invalid values", () => {
    expect(resolveDisplayDensity("tiny")).toBe(defaultDisplayDensity);
    expect(resolveDisplayDensity(null)).toBe(defaultDisplayDensity);
  });

  it("keeps Chinese labels for the mine setting", () => {
    expect(displayDensityLabels.compact).toBe("紧凑");
    expect(displayDensityLabels.standard).toBe("标准");
    expect(displayDensityLabels.comfortable).toBe("舒适");
  });
});
