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
      const items = textContent.items.filter((i: any) => {
        if (!("str" in i)) return false;
        const text = i.str.trim();
        if (text === "") return false;
        
        // Ignorar textos de cabeçalho/rodapé baseando-se na coordenada Y
        // Y próximo de 0 é rodapé, Y alto (ex: > 750) é cabeçalho.
        // O histórico SIGAA tem cabeçalhos altos e rodapé (autenticidade, página) na altura Y=38.
        // A última disciplina da página pode chegar a Y=57, então cortamos em 45.
        const y = i.transform[5];
        if (y < 45) return false; // Filtra tudo no rodapé da página (Para verificar a autenticidade, Página X de Y, etc)
        if (y > 770) return false; // Filtra cabeçalho muito alto
        
        // Mantém filtro seguro para coisas que podem cruzar (embora raro)
        const junk = [
          "MINISTÉRIO DA EDUCAÇÃO",
          "Secretaria de Educação",
          "SECRETARIA DE REGISTRO",
          "17.220.203/0001-96",
          "Componente Curricular",
          "Hora",
          "Aula",
          "Turma",
          "Freq %",
          "Média",
          "Conceito",
          "Situação",
          "Ano/Período Letivo",
          "CH"
        ];
        if (junk.some(j => text.includes(j))) return false;
        if (/^[a-f0-9]{10}$/i.test(text)) return false;
        
        return true;
      });

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
        // Aumentado para 60 para não órfãr textos de disciplinas que ocupam 4 linhas (como IPC)
        if (closestAnchor && minDistance < 60) {
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

