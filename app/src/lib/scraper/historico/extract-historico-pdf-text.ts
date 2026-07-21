import { createRequire } from "module";

export async function extractHistoricoPdfText(buffer: Buffer): Promise<string> {
  const require = createRequire(import.meta.url);
  // pdfjs-dist@3.11.174 legacy build avoids canvas issues
  const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

  // Avoid worker warning
  pdfjs.GlobalWorkerOptions.workerSrc = require.resolve(
    "pdfjs-dist/legacy/build/pdf.worker.js"
  );

  try {
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
      standardFontDataUrl: require.resolve("pdfjs-dist/standard_fonts/"),
    });

    const pdfDocument = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      
      const items = textContent.items.filter((i: any) => "str" in i);
      
      // Agrupar por coordenada Y (arredondada para evitar micro-diferenças)
      const linesByY: Record<number, any[]> = {};
      for (const item of items) {
        const y = Math.round(item.transform[5]);
        if (!linesByY[y]) linesByY[y] = [];
        linesByY[y].push(item);
      }
      
      // Ordenar os Y em ordem decrescente (do topo da página para baixo)
      const yKeys = Object.keys(linesByY)
        .map(Number)
        .sort((a, b) => b - a);
      
      let pageText = "";
      for (const y of yKeys) {
        // Ordenar os itens na mesma linha por coordenada X crescente (da esquerda para a direita)
        const rowItems = linesByY[y].sort((a, b) => a.transform[4] - b.transform[4]);
        pageText += rowItems.map(i => i.str).join(" ") + "\n";
      }
      fullText += pageText + "\n\n";
    }

    return fullText;
  } catch (error) {
    console.error("Erro ao extrair texto do PDF com pdfjs-dist:", error);
    return "";
  }
}

