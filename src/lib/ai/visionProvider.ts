import "server-only";

import OpenAI from "openai";

import { structuredSalaryRuleSchema } from "@/lib/validation";
import type { StructuredSalaryRule } from "@/types";

import { DEEPSEEK_BASE_URL, DeepSeekConfigurationError } from "./deepseek";
import { extractJsonObject } from "./json";
import { buildSalaryRuleParserUserPrompt, salaryRuleParserSystemPrompt } from "./prompts";
import type { StructuredSalaryRuleParseResult } from "./provider";

export const DEEPSEEK_DEFAULT_VISION_MODEL = "deepseek-v4-pro";

export type SalaryRuleVisionImage = {
  fileName: string;
  mimeType: string;
  dataUrl: string;
};

export type ParseSalaryRuleVisionInput = {
  text: string;
  images: SalaryRuleVisionImage[];
  extractedTexts?: string[];
  previousStructuredRule?: StructuredSalaryRule | null;
};

type VisionContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type DeepSeekVisionClient = {
  chat: {
    completions: {
      create(input: {
        model: string;
        messages: Array<
          | { role: "system"; content: string }
          | { role: "user"; content: VisionContentPart[] }
        >;
        temperature: number;
        response_format: { type: "json_object" };
      }): Promise<{ choices: Array<{ message?: { content?: string | null } }> }>;
    };
  };
};

export class DeepSeekVisionUnsupportedError extends Error {
  constructor() {
    super("当前模型暂时没有成功识别图片，可以把图片里的文字发给我，我继续帮你整理～");
    this.name = "DeepSeekVisionUnsupportedError";
  }
}

export class DeepSeekVisionProvider {
  name = "deepseek-vision";

  constructor(
    private readonly options: {
      apiKey?: string;
      model?: string;
      client?: DeepSeekVisionClient;
    } = {}
  ) {}

  private getClient() {
    if (this.options.client) return this.options.client;
    const apiKey = this.options.apiKey ?? process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new DeepSeekConfigurationError();
    return new OpenAI({ apiKey, baseURL: DEEPSEEK_BASE_URL }) as DeepSeekVisionClient;
  }

  getModel() {
    return this.options.model ?? process.env.DEEPSEEK_VISION_MODEL ?? process.env.DEEPSEEK_MODEL ?? DEEPSEEK_DEFAULT_VISION_MODEL;
  }

  async parseSalaryRuleWithVision(input: ParseSalaryRuleVisionInput): Promise<StructuredSalaryRuleParseResult> {
    const client = this.getClient();
    const content = buildVisionContent(input);

    try {
      const response = await client.chat.completions.create({
        model: this.getModel(),
        messages: [
          { role: "system", content: salaryRuleParserSystemPrompt },
          { role: "user", content }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const rawAiText = response.choices[0]?.message?.content?.trim();
      if (!rawAiText) throw new Error("识别失败，请稍后再试，或手动调整规则～");

      const parsed = extractJsonObject(rawAiText);
      const validation = structuredSalaryRuleSchema.safeParse(parsed);
      if (!validation.success) {
        throw new Error("规则有点复杂，我没完全识别出来，你可以手动调整一下～");
      }

      return {
        structured_rule: validation.data,
        raw_ai_text: rawAiText
      };
    } catch (error) {
      if (isVisionUnsupportedError(error)) {
        throw new DeepSeekVisionUnsupportedError();
      }
      throw error;
    }
  }
}

export function buildVisionContent(input: ParseSalaryRuleVisionInput): VisionContentPart[] {
  const text = [
    input.previousStructuredRule ? `上一版结构化规则 JSON：\n${JSON.stringify(input.previousStructuredRule)}` : "",
    input.text ? buildSalaryRuleParserUserPrompt(input.text) : "",
    input.extractedTexts?.length ? `附件中提取到的文字：\n${input.extractedTexts.filter(Boolean).join("\n\n")}` : "",
    input.images.length ? "请同时阅读用户上传的图片，识别图片里的工资规则、表格或聊天记录内容，并整理成结构化 JSON。" : ""
  ].filter(Boolean).join("\n\n---\n\n");

  return [
    { type: "text", text },
    ...input.images.map((image) => ({
      type: "image_url" as const,
      image_url: { url: image.dataUrl }
    }))
  ];
}

function isVisionUnsupportedError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("image") || message.includes("vision") || message.includes("unsupported") || message.includes("400") || message.includes("415");
}

export const deepSeekVisionProvider = new DeepSeekVisionProvider();
