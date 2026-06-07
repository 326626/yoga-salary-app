import "server-only";

export class OcrProviderNotSupportedError extends Error {
  constructor() {
    super("图片识别能力正在接入中，可以先把图片里的文字复制到补充说明里～");
    this.name = "OcrProviderNotSupportedError";
  }
}

export type OcrProvider = {
  name: string;
  extractTextFromImage(file: File): Promise<string>;
};

export const unsupportedOcrProvider: OcrProvider = {
  name: "not_supported",
  async extractTextFromImage() {
    throw new OcrProviderNotSupportedError();
  }
};
