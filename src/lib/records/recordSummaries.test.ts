import { describe, expect, it } from "vitest";

import { mockClasses, mockMembers, mockPackages, mockStudios } from "@/lib/mock-data";

import { buildClassSummary, buildPackageSummary } from "./recordSummaries";

describe("record summaries", () => {
  it("builds compact package summary with member studio remaining sessions and unit price", () => {
    const summary = buildPackageSummary({
      item: mockPackages[0],
      members: mockMembers,
      studios: mockStudios,
      remainingLabel: "还剩 6 节"
    });

    expect(summary.title).toContain("李女士");
    expect(summary.title).toContain("禅悦瑜伽馆");
    expect(summary.meta).toContain("还剩 6 节");
    expect(summary.meta).toContain("300.00");
  });

  it("builds compact class summary with date course member package and studio", () => {
    const summary = buildClassSummary({
      record: mockClasses[1],
      members: mockMembers,
      packages: mockPackages,
      studios: mockStudios,
      courseTypeLabel: "私教"
    });

    expect(summary.title).toContain(mockClasses[1].date);
    expect(summary.subtitle).toContain("李女士");
    expect(summary.subtitle).toContain("私教 10 节");
    expect(summary.meta).toContain("禅悦瑜伽馆");
  });
});
