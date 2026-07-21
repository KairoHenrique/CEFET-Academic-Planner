import PDFParser from "pdf2json";
import fs from "fs";

async function run() {
  const buffer = fs.readFileSync("package.json"); // Just dummy to test import
  const pdfParser = new PDFParser(null, 1);
  console.log("pdfParser initialized!");
}
run();
