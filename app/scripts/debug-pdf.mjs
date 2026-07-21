import fs from 'fs';
import path from 'path';

async function debugPdf() {
  const dataDir = path.join(process.cwd(), '.data');
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
  const PDFParser = (await import('pdf2json')).default;
  
  const pdfParser = new PDFParser(null, 1);
  pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
  pdfParser.on("pdfParser_dataReady", () => {
      const text = pdfParser.getRawTextContent();
      console.log("\n--- INÍCIO DO TEXTO EXTRAÍDO ---");
      const lines = text.split('\n');
      console.log(lines.slice(0, 60).join('\n'));
      console.log("\n[...]\n");
      console.log(lines.slice(-60).join('\n'));
      console.log("--- FIM DO TEXTO EXTRAÍDO ---");
  });
  pdfParser.parseBuffer(buffer);
}

debugPdf();
