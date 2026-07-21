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
      const textContent = await page.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false
      });

      const items = textContent.items.filter((item: any) => {
        if (!("str" in item)) return false;
        const text = item.str.trim();
        if (text === "") return false;
        
        // Ignorar textos de cabeçalho/rodapé baseando-se na coordenada Y
        const y = item.transform[5];
        if (y < 45) return false; 
        if (y > 770) return false; 
        
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

      // Ordenação Global Y/X (Lê a página exatamente como um humano: de cima pra baixo, da esquerda pra direita)
      items.sort((a: any, b: any) => {
        const yDiff = b.transform[5] - a.transform[5];
        // Tolerância de 5 pontos na mesma linha (resolve desalinhamentos visuais)
        if (Math.abs(yDiff) > 5) return yDiff;
        return a.transform[4] - b.transform[4];
      });

      let lastY: number | null = null;
      let pageText = "";

      for (const item of items) {
        const currentY = item.transform[5];
        const str = item.str.trim();
        if (!str) continue;
        
        if (lastY !== null && Math.abs(lastY - currentY) <= 5) {
          // Mesma linha visual: injeta espaço para garantir que as palavras não colem
          pageText += " " + str;
        } else {
          // Nova linha visual
          pageText += "\n" + str;
        }
        
        lastY = currentY;
      }

      fullText += pageText + "\n\n";
    }

    return fullText;
  } catch (error) {
    console.error("Erro ao extrair texto do PDF com pdfjs-dist:", error);
    return "";
  }
}

