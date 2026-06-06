import { describe, expect, it } from "vitest";

import { DEEPSEEK_BASE_URL, DEEPSEEK_DEFAULT_MODEL, DeepSeekConfigurationError, DeepSeekProvider } from "./deepseek";

describe("DeepSeekProvider", () => {
  it("uses the expected base URL and default model constants", () => {
    expect(DEEPSEEK_BASE_URL).toBe("https://api.deepseek.com");
    expect(DEEPSEEK_DEFAULT_MODEL).toBe("deepseek-v4-flash");
  });

  it("returns a controlled error when API key is missing", async () => {
    const provider = new DeepSeekProvider({ apiKey: "" });

    await expect(provider.parseSalaryRuleFromText({ rawText: "团课 100" })).rejects.toBeInstanceOf(DeepSeekConfigurationError);
  });

  it("builds chat completion request with deepseek-v4-flash", async () => {
    const calls: unknown[] = [];
    const provider = new DeepSeekProvider({
      apiKey: "test-key",
      client: {
        chat: {
          completions: {
            async create(input) {
              calls.push(input);
              return {
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
                        class_fee_rules: [],
                        commission_rules: [],
                        commission_mode: "unknown",
                        bonus_rules: [],
                        deduction_rules: [],
                        uncertain_items: []
                      })
                    }
                  }
                ]
              };
            }
          }
        }
      }
    });

    await provider.parseSalaryRuleFromText({ rawText: "团课 100" });

    expect(calls[0]).toMatchObject({
      model: "deepseek-v4-flash",
      response_format: { type: "json_object" }
    });
  });
});
