import "server-only";

import type { ParseSalaryRuleImageInput, StructuredSalaryRuleParseResult } from "./provider";

export type VisionOcrProvider = {
  name: string;
  parseSalaryRuleFromImage(input: ParseSalaryRuleImageInput): Promise<StructuredSalaryRuleParseResult>;
};

export class VisionProviderNotSupportedError extends Error {
  constructor() {
    super("图片识别能力已预留，当前请先复制图片中的文字进行识别～");
    this.name = "VisionProviderNotSupportedError";
  }
}

export const unsupportedVisionProvider: VisionOcrProvider = {
  name: "not-supported",
  async parseSalaryRuleFromImage() {
    throw new VisionProviderNotSupportedError();
  }
};
