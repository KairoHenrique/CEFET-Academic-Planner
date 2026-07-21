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
    });

    const pdfDocument = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items.filter((i: any) => "str" in i && i.str.trim() !== "");
      
      // Ordenar estritamente por Y decrescente (de cima para baixo)
      // Se Y for igual, ordena por X crescente (esquerda para direita)
      items.sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) > 2) return yDiff;
        return a.transform[4] - b.transform[4];
      });

      let currentBlock = [];
      const blocks = [];

      for (const item of items) {
        const text = item.str.trim();
        // Detectar nova disciplina: Semestre (2024.1) no início da linha (X pequeno)
        if (/^(?:19|20)\d{2}\.[12]$/.test(text) && item.transform[4] < 60) {
          if (currentBlock.length > 0) blocks.push(currentBlock);
          currentBlock = [item];
        } else {
          currentBlock.push(item);
        }
      }
      if (currentBlock.length > 0) blocks.push(currentBlock);

      for (const block of blocks) {
        // Para cada bloco, extrair texto ordenando da esquerda para a direita (X)
        const blockText = block.sort((a, b) => a.transform[4] - b.transform[4])
                               .map(i => i.str.trim())
                               .join(" ");
        fullText += blockText + "\n";
      }
      fullText += "\n";
    }

    return fullText;
  } catch (error) {
    console.error("Erro ao extrair texto do PDF com pdfjs-dist:", error);
    return "";
  }
}

