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
      
      const items = textContent.items.filter((i: any) => "str" in i);
      
      // Agrupar por coordenada Y com tolerância de 12 pontos
      const linesByY: { y: number; items: any[] }[] = [];
      for (const item of items) {
        const y = item.transform[5];
        let found = false;
        for (const line of linesByY) {
          if (Math.abs(line.y - y) < 12) {
            line.items.push(item);
            found = true;
            break;
          }
        }
        if (!found) {
          linesByY.push({ y, items: [item] });
        }
      }
      
      // Ordenar os Y em ordem decrescente (do topo da página para baixo)
      linesByY.sort((a, b) => b.y - a.y);
      
      let pageText = "";
      for (const line of linesByY) {
        // Ordenar os itens na mesma linha por coordenada X crescente
        const rowItems = line.items.sort((a, b) => a.transform[4] - b.transform[4]);
        pageText += rowItems.map(i => i.str.trim()).filter(s => s).join(" ") + "\n";
      }
      fullText += pageText + "\n\n";
    }

    return fullText;
  } catch (error) {
    console.error("Erro ao extrair texto do PDF com pdfjs-dist:", error);
    return "";
  }
}

