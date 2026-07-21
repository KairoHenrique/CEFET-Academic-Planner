/**
 * Extrai texto do buffer PDF do histórico SIGAA usando pdf-parse v1.1.1.
 */
export async function extractHistoricoPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;

  try {
    const result = await pdfParse(buffer);
    return result.text ?? "";
  } catch (error) {
    console.error("Erro ao extrair texto do PDF:", error);
    return "";
  }
}
