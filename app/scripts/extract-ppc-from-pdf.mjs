/**
 * Extrai texto dos PDFs PPC em docs/referencias/ para revisão / regeneração de seeds.
 * Uso: node scripts/extract-ppc-from-pdf.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const refsDir = path.resolve(__dirname, "../../docs/referencias");

const TARGETS = [
  {
    match: /mecatr/i,
    cursoId: "eng-mecatronica",
  },
  {
    match: /Design.?de.?Moda|Moda/i,
    cursoId: "design-moda",
  },
];

async function extractOne(filePath, cursoId) {
  const buf = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buf });
  try {
    const result = await parser.getText();
    const out = path.join(__dirname, `ppc-extract-${cursoId}.txt`);
    fs.writeFileSync(out, result.text ?? "", "utf8");
    console.log(
      `${path.basename(filePath)} → ${out} (${result.total ?? "?"} págs, ${(result.text || "").length} chars)`
    );
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function main() {
  const files = fs.readdirSync(refsDir).filter((f) => f.toLowerCase().endsWith(".pdf"));
  for (const target of TARGETS) {
    const file = files.find((f) => target.match.test(f));
    if (!file) {
      console.warn(`PDF não encontrado para ${target.cursoId}`);
      continue;
    }
    await extractOne(path.join(refsDir, file), target.cursoId);
  }
  console.log("Próximo: revisar TSV e rodar node scripts/build-multi-ppc-seeds.mjs");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
