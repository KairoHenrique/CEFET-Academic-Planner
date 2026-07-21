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

      const items = textContent.items.filter((i: any) => {
        if (!("str" in i)) return false;
        const text = i.str.trim();
        if (text === "") return false;
        
        // Ignorar textos de cabeçalho/rodapé baseando-se na coordenada Y
        const y = i.transform[5];
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

      let lastY: number | null = null;
      let lastXEnd: number | null = null;
      let pageText = "";

      for (const item of items) {
        const currentY = item.transform[5];
        const currentX = item.transform[4];
        const width = item.width;
        const str = item.str;
        
        // Se a diferença de Y for pequena (ex: < 4), consideramos na mesma linha
        if (lastY !== null && Math.abs(lastY - currentY) < 4) {
          // Se a distância X entre o fim do último item e o começo deste for maior que 3 (aprox 1 espaço)
          if (lastXEnd !== null && currentX - lastXEnd > 3) {
            pageText += " " + str;
          } else {
            pageText += str;
          }
        } else {
          // Nova linha
          pageText += "\n" + str;
        }
        
        lastY = currentY;
        lastXEnd = currentX + width;
      }

      fullText += pageText + "\n\n";
    }

    return fullText;
  } catch (error) {
    console.error("Erro ao extrair texto do PDF com pdfjs-dist:", error);
    return "";
  }
}

