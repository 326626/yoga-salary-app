import { describe, expect, it } from "vitest";

import { parseRuleDocuments, validateRuleDocumentFiles } from "./documentParser";

describe("rule document parser", () => {
  it("accepts txt and csv files and extracts text", async () => {
    const file = {
      name: "rule.txt",
      type: "text/plain",
      size: 16,
      text: async () => "团课每节 100"
    } as File;
    const result = await parseRuleDocuments([file]);

    expect(result.documents[0].extractedText).toContain("团课");
  });

  it("accepts images and prepares data URLs for vision model", async () => {
    const file = {
      name: "rule.png",
      type: "image/png",
      size: 5,
      arrayBuffer: async () => new TextEncoder().encode("image").buffer
    } as File;
    const result = await parseRuleDocuments([file]);

    expect(result.documents[0].extractedText).toBe("");
    expect(result.documents[0].imageDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(result.messages).toEqual([]);
  });

  it("rejects unsupported files", () => {
    const file = new File(["pdf"], "rule.pdf", { type: "application/pdf" });
    const result = validateRuleDocumentFiles([file]);

    expect(result.ok).toBe(false);
  });

  it("rejects files larger than 5MB", () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.txt", { type: "text/plain" });
    const result = validateRuleDocumentFiles([file]);

    expect(result.ok).toBe(false);
  });

  it("rejects more than five files", () => {
    const files = Array.from({ length: 6 }, (_, index) => new File(["x"], `${index}.txt`, { type: "text/plain" }));
    const result = validateRuleDocumentFiles(files);

    expect(result.ok).toBe(false);
  });
});
