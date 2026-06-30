import { PDFParse } from "pdf-parse";

/**
 * Extrai texto do buffer PDF do histórico SIGAA (pdf-parse v2 / PDFParse).
 */
export async function extractHistoricoPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}
