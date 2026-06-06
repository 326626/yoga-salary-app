import { describe, expect, it } from "vitest";

import { extractJsonObject } from "./json";

describe("extractJsonObject", () => {
  it("parses plain JSON", () => {
    expect(extractJsonObject('{"commission_mode":"unknown"}')).toEqual({ commission_mode: "unknown" });
  });

  it("parses JSON wrapped in a code block", () => {
    expect(extractJsonObject('```json\n{"commission_mode":"tiered"}\n```')).toEqual({ commission_mode: "tiered" });
  });

  it("throws on invalid JSON", () => {
    expect(() => extractJsonObject("not json")).toThrow();
  });
});
