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
      
      let lastY;
      let pageText = "";
      for (const item of textContent.items) {
        if (!("str" in item)) continue;
        if (lastY === item.transform[5] || lastY === undefined) {
          pageText += item.str + " ";
        } else {
          pageText += "\n" + item.str + " ";
        }
        lastY = item.transform[5];
      }
      fullText += pageText + "\n\n";
    }

    return fullText;
  } catch (error) {
    console.error("Erro ao extrair texto do PDF com pdfjs-dist:", error);
    return "";
  }
}

