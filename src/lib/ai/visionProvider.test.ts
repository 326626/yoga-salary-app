import { describe, expect, it } from "vitest";

import { buildVisionContent, DEEPSEEK_DEFAULT_VISION_MODEL, DeepSeekVisionProvider, DeepSeekVisionUnsupportedError } from "./visionProvider";

const validRule = {
  class_fee_rules: [
    {
      course_type: "private",
      fee_type: "percentage_of_unit_price",
      rate: 0.4
    }
  ],
  commission_rules: [],
  commission_mode: "unknown",
  bonus_rules: [],
  deduction_rules: [],
  uncertain_items: []
};

describe("DeepSeek vision provider", () => {
  it("builds text and image_url content", () => {
    const content = buildVisionContent({
      text: "私教按客单价 40%",
      images: [{ fileName: "rule.png", mimeType: "image/png", dataUrl: "data:image/png;base64,abc" }]
    });

    expect(content[0]).toMatchObject({ type: "text" });
    expect(content[1]).toMatchObject({ type: "image_url", image_url: { url: "data:image/png;base64,abc" } });
  });

  it("uses deepseek-v4-pro as default vision model", async () => {
    const calls: unknown[] = [];
    const provider = new DeepSeekVisionProvider({
      apiKey: "test-key",
      client: {
        chat: {
          completions: {
            async create(input) {
              calls.push(input);
              return { choices: [{ message: { content: JSON.stringify(validRule) } }] };
            }
          }
        }
      }
    });

    await provider.parseSalaryRuleWithVision({
      text: "私教按客单价 40%",
      images: [{ fileName: "rule.png", mimeType: "image/png", dataUrl: "data:image/png;base64,abc" }]
    });

    expect(calls[0]).toMatchObject({
      model: DEEPSEEK_DEFAULT_VISION_MODEL,
      response_format: { type: "json_object" }
    });
  });

  it("validates JSON returned by DeepSeek", async () => {
    const provider = new DeepSeekVisionProvider({
      apiKey: "test-key",
      client: {
        chat: {
          completions: {
            async create() {
              return { choices: [{ message: { content: `\`\`\`json\n${JSON.stringify(validRule)}\n\`\`\`` } }] };
            }
          }
        }
      }
    });

    const result = await provider.parseSalaryRuleWithVision({
      text: "",
      images: [{ fileName: "rule.png", mimeType: "image/png", dataUrl: "data:image/png;base64,abc" }]
    });

    expect(result.structured_rule.class_fee_rules[0]).toMatchObject({ fee_type: "percentage_of_unit_price", rate: 0.4 });
  });

  it("returns a friendly error when image input is unsupported", async () => {
    const provider = new DeepSeekVisionProvider({
      apiKey: "test-key",
      client: {
        chat: {
          completions: {
            async create() {
              throw new Error("400 unsupported image input");
            }
          }
        }
      }
    });

    await expect(provider.parseSalaryRuleWithVision({
      text: "",
      images: [{ fileName: "rule.png", mimeType: "image/png", dataUrl: "data:image/png;base64,abc" }]
    })).rejects.toBeInstanceOf(DeepSeekVisionUnsupportedError);
  });
});
