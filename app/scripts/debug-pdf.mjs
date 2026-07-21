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

    const anchors = [];
    const nonAnchors = [];

    for (const item of items) {
      if (/^(?:19|20)\d{2}\.[12]$/.test(item.str.trim()) && item.transform[4] < 60) {
        anchors.push({ y: item.transform[5], items: [item] });
      } else {
        nonAnchors.push(item);
      }
    }

    if (anchors.length === 0) {
      const sortedItems = items.sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) > 2) return yDiff;
        return a.transform[4] - b.transform[4];
      });
      text += sortedItems.map(i => i.str.trim()).join(" ") + "\n\n";
      continue;
    }

    anchors.sort((a, b) => b.y - a.y);

    const orphanItems = [];
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

      if (closestAnchor && minDistance < 25) {
        closestAnchor.items.push(item);
      } else {
        orphanItems.push(item);
      }
    }

    const headerItems = orphanItems.filter(i => i.transform[5] > anchors[0].y + 10);
    if (headerItems.length > 0) {
      const sortedHeader = headerItems.sort((a, b) => (b.transform[5] - a.transform[5]) || (a.transform[4] - b.transform[4]));
      text += sortedHeader.map(i => i.str.trim()).join(" ") + "\n";
    }

    for (const anchor of anchors) {
      const rowItems = anchor.items.sort((a, b) => a.transform[4] - b.transform[4]);
      text += rowItems.map(i => i.str.trim()).join(" ") + "\n";
    }

    const footerItems = orphanItems.filter(i => i.transform[5] < anchors[anchors.length - 1].y - 10);
    if (footerItems.length > 0) {
      const sortedFooter = footerItems.sort((a, b) => (b.transform[5] - a.transform[5]) || (a.transform[4] - b.transform[4]));
      text += sortedFooter.map(i => i.str.trim()).join(" ") + "\n";
    }
    
    text += "\n";
  }
  
  console.log("\n--- INÍCIO DO TEXTO EXTRAÍDO ---");
  const lines = text.split('\n');
  console.log(lines.slice(0, 60).join('\n'));
  console.log("\n[...]\n");
  console.log(lines.slice(-60).join('\n'));
  console.log("--- FIM DO TEXTO EXTRAÍDO ---");
}

debugPdf();
