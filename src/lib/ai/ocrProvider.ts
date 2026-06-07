import "server-only";

export class OcrProviderNotSupportedError extends Error {
  constructor() {
    super("当前模型暂时没有成功识别图片，可以把图片里的文字发给我，我继续帮你整理～");
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
