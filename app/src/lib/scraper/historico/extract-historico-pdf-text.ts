import { createRequire } from "module";

/**
 * Extrai texto do buffer PDF do histórico SIGAA usando pdf-parse v1.1.1.
 */
export async function extractHistoricoPdfText(buffer: Buffer): Promise<string> {
  const require = createRequire(import.meta.url);
  const pdfParse = require("pdf-parse");

  try {
    const result = await pdfParse(buffer);
    return result.text ?? "";
  } catch (error) {
    console.error("Erro ao extrair texto do PDF:", error);
    return "";
  }
}
