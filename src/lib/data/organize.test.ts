import { describe, expect, it } from "vitest";

import { buildAssignStudioPayload } from "./organize";

describe("organize payload helpers", () => {
  it("assign payload only contains studio_id", () => {
    const payload = buildAssignStudioPayload("99999999-9999-4999-8999-999999999901", "99999999-9999-4999-8999-999999999999");

    expect(payload).toEqual({ studio_id: "99999999-9999-4999-8999-999999999901" });
    expect(payload).not.toHaveProperty("user_id");
  });
});
