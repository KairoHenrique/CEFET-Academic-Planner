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

      // Encontrar âncoras (Semestres na primeira coluna)
      const anchors: { y: number; items: any[] }[] = [];
      const nonAnchors: any[] = [];

      for (const item of items) {
        if (/^(?:19|20)\d{2}\.[12]$/.test(item.str.trim()) && item.transform[4] < 60) {
          anchors.push({ y: item.transform[5], items: [item] });
        } else {
          nonAnchors.push(item);
        }
      }

      // Se não houver âncoras, apenas agrupa tudo por Y (cabeçalho da página)
      if (anchors.length === 0) {
        const sortedItems = items.sort((a, b) => {
          const yDiff = b.transform[5] - a.transform[5];
          if (Math.abs(yDiff) > 2) return yDiff;
          return a.transform[4] - b.transform[4];
        });
        fullText += sortedItems.map(i => i.str.trim()).join(" ") + "\n\n";
        continue;
      }

      // Ordenar âncoras de cima para baixo
      anchors.sort((a, b) => b.y - a.y);

      // Atribuir cada item não-âncora à âncora mais próxima em Y
      const orphanItems: any[] = [];
      for (const item of nonAnchors) {
        let closestAnchor = null;
        let minDistance = Infinity;

        for (const anchor of anchors) {
          const distance = Math.abs(anchor.y - item.transform[5]);
          if (distance < minDistance) {
            minDistance = distance;
            closestAnchor = anchor;
          }
        }

        // Se a distância for muito grande, não pertence à tabela (ex: cabeçalho da página)
        if (closestAnchor && minDistance < 25) {
          closestAnchor.items.push(item);
        } else {
          orphanItems.push(item);
        }
      }

      // Adicionar os itens órfãos do cabeçalho (Y maior que a primeira âncora)
      const headerItems = orphanItems.filter(i => i.transform[5] > anchors[0].y + 10);
      if (headerItems.length > 0) {
        const sortedHeader = headerItems.sort((a, b) => (b.transform[5] - a.transform[5]) || (a.transform[4] - b.transform[4]));
        fullText += sortedHeader.map(i => i.str.trim()).join(" ") + "\n";
      }

      // Processar cada bloco (linha da tabela)
      for (const anchor of anchors) {
        // Ordenar os itens da linha da esquerda para a direita (X crescente)
        const rowItems = anchor.items.sort((a, b) => a.transform[4] - b.transform[4]);
        fullText += rowItems.map(i => i.str.trim()).join(" ") + "\n";
      }

      // Adicionar os itens órfãos do rodapé
      const footerItems = orphanItems.filter(i => i.transform[5] < anchors[anchors.length - 1].y - 10);
      if (footerItems.length > 0) {
        const sortedFooter = footerItems.sort((a, b) => (b.transform[5] - a.transform[5]) || (a.transform[4] - b.transform[4]));
        fullText += sortedFooter.map(i => i.str.trim()).join(" ") + "\n";
      }
      
      fullText += "\n";
    }

    return fullText;
  } catch (error) {
    console.error("Erro ao extrair texto do PDF com pdfjs-dist:", error);
    return "";
  }
}

