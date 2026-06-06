import "server-only";

import OpenAI from "openai";

import { extractJsonObject } from "./json";
import { buildSalaryRuleParserUserPrompt, salaryRuleParserSystemPrompt } from "./prompts";
import type { SalaryRuleAiProvider, StructuredSalaryRuleParseResult } from "./provider";

export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEEPSEEK_DEFAULT_MODEL = "deepseek-v4-flash";

type DeepSeekClient = {
  chat: {
    completions: {
      create(input: {
        model: string;
        messages: Array<{ role: "system" | "user"; content: string }>;
        temperature: number;
        response_format: { type: "json_object" };
      }): Promise<{ choices: Array<{ message?: { content?: string | null } }> }>;
    };
  };
};

export class DeepSeekConfigurationError extends Error {
  constructor() {
    super("还没有配置 AI Key，当前可以先使用示例识别～");
    this.name = "DeepSeekConfigurationError";
  }
}

export class DeepSeekProvider implements SalaryRuleAiProvider {
  name = "deepseek";

  constructor(
    private readonly options: {
      apiKey?: string;
      model?: string;
      client?: DeepSeekClient;
    } = {}
  ) {}

  private getClient() {
    if (this.options.client) return this.options.client;
    const apiKey = this.options.apiKey ?? process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new DeepSeekConfigurationError();
    }
    return new OpenAI({
      apiKey,
      baseURL: DEEPSEEK_BASE_URL
    }) as DeepSeekClient;
  }

  async parseSalaryRuleFromText({ rawText }: { rawText: string }): Promise<StructuredSalaryRuleParseResult> {
    const client = this.getClient();
    const response = await client.chat.completions.create({
      model: this.options.model ?? DEEPSEEK_DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: salaryRuleParserSystemPrompt
        },
        {
          role: "user",
          content: buildSalaryRuleParserUserPrompt(rawText)
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    const raw_ai_text = response.choices[0]?.message?.content?.trim();
    if (!raw_ai_text) {
      throw new Error("识别失败，请稍后再试，或手动调整规则～");
    }

    return {
      structured_rule: extractJsonObject(raw_ai_text),
      raw_ai_text
    };
  }
}

export const deepSeekProvider = new DeepSeekProvider();
