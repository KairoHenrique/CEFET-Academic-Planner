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
  const { extractHistoricoPdfText } = await import('../src/lib/scraper/historico/extract-historico-pdf-text.js');
  const text = await extractHistoricoPdfText(buffer);
  
  console.log("\n--- INÍCIO DO TEXTO EXTRAÍDO ---");
  const lines = text.split('\n');
  console.log(lines.slice(0, 60).join('\n'));
  console.log("\n[...]\n");
  console.log(lines.slice(-60).join('\n'));
  console.log("--- FIM DO TEXTO EXTRAÍDO ---");
}

debugPdf();
