import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

async function debugPdf() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dataDir = path.join(__dirname, '..', '.data');
  if (!fs.existsSync(dataDir)) {
    console.log("Pasta .data não encontrada.");
    return;
  }
  
  // Encontrar recursivamente o PDF
  let pdfPath = null;
  function search(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
              search(fullPath);
          } else if (entry.name.endsWith('historico-escolar.pdf')) {
              pdfPath = fullPath;
          }
      }
  }
  search(dataDir);
  
  if (!pdfPath) {
    console.log("Nenhum PDF de histórico encontrado em .data");
    return;
  }

  console.log(`Lendo PDF: ${pdfPath}`);
  
  const buffer = fs.readFileSync(pdfPath);
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");
  pdfjs.GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.js");

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdfDocument = await loadingTask.promise;
  let text = "";

  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    
    const items = textContent.items.filter(i => "str" in i && i.str.trim() !== "");
    
    for (const item of items) {
      const text = item.str.trim();
      if (text.includes("2024.2") || text.includes("G05PPYT0") || text.includes("GT05FEC") || text.includes("PROGRAMAÇÃO EM PYTHON")) {
        console.log(`TEXT: "${text}" | X: ${item.transform[4].toFixed(2)} | Y: ${item.transform[5].toFixed(2)}`);
      }
    }
  }
  
  console.log("\n--- INÍCIO DO TEXTO EXTRAÍDO ---");
  const lines = text.split('\n');
  console.log(lines.slice(0, 60).join('\n'));
  console.log("\n[...]\n");
  console.log(lines.slice(-60).join('\n'));
  console.log("--- FIM DO TEXTO EXTRAÍDO ---");
}

debugPdf();
