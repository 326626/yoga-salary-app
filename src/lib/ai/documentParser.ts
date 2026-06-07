import "server-only";

import { Buffer } from "node:buffer";

export const MAX_AI_RULE_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_AI_RULE_FILE_COUNT = 5;

export const supportedRuleDocumentTypes = ["text/plain", "text/csv", "image/jpeg", "image/png", "image/webp"] as const;
export const readableRuleDocumentTypes = ["text/plain", "text/csv"] as const;
export const imageRuleDocumentTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export type ParsedRuleDocument = {
  fileName: string;
  fileType: string;
  size: number;
  extractedText: string;
  imageDataUrl?: string;
  message?: string;
};

export function validateRuleDocumentFiles(files: File[]) {
  if (files.length > MAX_AI_RULE_FILE_COUNT) {
    return { ok: false as const, message: "一次最多上传 5 个文件～" };
  }

  for (const file of files) {
    if (file.size > MAX_AI_RULE_FILE_SIZE) {
      return { ok: false as const, message: "文件有点大，请上传 5MB 以内的文件～" };
    }
    if (!supportedRuleDocumentTypes.includes(file.type as (typeof supportedRuleDocumentTypes)[number])) {
      return { ok: false as const, message: "这个文件暂时不能识别，可以先复制里面的文字到补充说明里～" };
    }
  }

  return { ok: true as const, files };
}

export async function parseRuleDocuments(files: File[]): Promise<{ documents: ParsedRuleDocument[]; messages: string[] }> {
  const validation = validateRuleDocumentFiles(files);
  if (!validation.ok) throw new Error(validation.message);

  const documents: ParsedRuleDocument[] = [];
  const messages: string[] = [];

  for (const file of files) {
    if (readableRuleDocumentTypes.includes(file.type as (typeof readableRuleDocumentTypes)[number])) {
      const extractedText = (await readFileText(file)).slice(0, 12000);
      documents.push({ fileName: file.name, fileType: file.type, size: file.size, extractedText });
      continue;
    }

    if (imageRuleDocumentTypes.includes(file.type as (typeof imageRuleDocumentTypes)[number])) {
      documents.push({
        fileName: file.name,
        fileType: file.type,
        size: file.size,
        extractedText: "",
        imageDataUrl: await readImageDataUrl(file)
      });
    }
  }

  return { documents, messages: Array.from(new Set(messages)) };
}

async function readFileText(file: File) {
  if (typeof file.text === "function") return file.text();
  if (typeof file.arrayBuffer === "function") {
    return new TextDecoder().decode(await file.arrayBuffer());
  }
  return new Response(file).text();
}

async function readImageDataUrl(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const base64 = Buffer.from(bytes).toString("base64");
  return `data:${file.type};base64,${base64}`;
}
