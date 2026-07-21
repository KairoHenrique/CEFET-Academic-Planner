import fs from 'fs';
import path from 'path';

async function debugPdf() {
  const debugDir = path.join(process.cwd(), '.data', 'scrape-debug');
  if (!fs.existsSync(debugDir)) {
    console.log("Pasta de debug não encontrada.");
    return;
  }
  const files = fs.readdirSync(debugDir).filter(f => f.endsWith('historico-escolar.pdf'));
  if (files.length === 0) {
    console.log("Nenhum PDF de histórico encontrado.");
    return;
  }
  // Pega o mais recente
  files.sort();
  const latest = files[files.length - 1];
  console.log(`Lendo PDF: ${latest}`);
  
  const buffer = fs.readFileSync(path.join(debugDir, latest));
  const PDFParser = (await import('pdf2json')).default;
  
  const pdfParser = new PDFParser(null, 1);
  pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
  pdfParser.on("pdfParser_dataReady", () => {
      const text = pdfParser.getRawTextContent();
      console.log("\n--- INÍCIO DO TEXTO EXTRAÍDO ---");
      // Imprime as primeiras 60 linhas e as últimas 60 linhas para não flodar o console
      const lines = text.split('\n');
      console.log(lines.slice(0, 60).join('\n'));
      console.log("\n[...]\n");
      console.log(lines.slice(-60).join('\n'));
      console.log("--- FIM DO TEXTO EXTRAÍDO ---");
  });
  pdfParser.parseBuffer(buffer);
}

debugPdf();
