/**
 * Extrai texto do buffer PDF do histórico SIGAA usando pdf2json (puro JS).
 */
export async function extractHistoricoPdfText(buffer: Buffer): Promise<string> {
  const PDFParser = (await import("pdf2json")).default;
  return new Promise((resolve) => {
    const pdfParser = new PDFParser(null, 1);

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      console.error("Erro no pdf2json:", errData.parserError);
      resolve(""); 
    });

    pdfParser.on("pdfParser_dataReady", () => {
      resolve(pdfParser.getRawTextContent());
    });

    try {
      pdfParser.parseBuffer(buffer);
    } catch (error) {
      console.error("Exceção ao chamar pdfParser.parseBuffer:", error);
      resolve("");
    }
  });
}

