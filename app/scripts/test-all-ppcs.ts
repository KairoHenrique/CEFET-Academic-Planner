import { jaccardTokenize, jaccardIndex, findBestJaccardMatch } from "../src/lib/scraper/portal-discente/jaccard-matcher";
import { isPpcCanonicalCodigo } from "../src/lib/scraper/portal-discente/resolve-disciplina-codigo";
import { loadPpcSeedData } from "../src/lib/db/ppc-seed-loader";

function testCurso(cursoId: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  PPC: ${cursoId}`);
  console.log(`${"=".repeat(60)}`);
  
  const seed = loadPpcSeedData(cursoId);
  console.log(`Total disciplinas: ${seed.length}`);
  
  // Check code format
  const codes = seed.map(s => s.disciplina.codigo);
  const validCodes = codes.filter(c => isPpcCanonicalCodigo(c));
  const invalidCodes = codes.filter(c => !isPpcCanonicalCodigo(c));
  console.log(`Códigos PPC válidos: ${validCodes.length}/${codes.length}`);
  if (invalidCodes.length > 0) {
    console.log(`❌ Códigos inválidos:`, invalidCodes);
  }
  
  // Show tokenization samples
  console.log(`\nAmostra de tokenização:`);
  for (const s of seed.slice(0, 5)) {
    const tokens = jaccardTokenize(s.disciplina.nome);
    console.log(`  ${s.disciplina.codigo} "${s.disciplina.nome}" => [${[...tokens].join(", ")}]`);
  }
  
  // Cross-course test: find matches across courses
  return seed.map(s => ({
    codigo: s.disciplina.codigo,
    nome: s.disciplina.nome,
    ementa: s.disciplina.ementa,
    carga_horaria: s.disciplina.carga_horaria,
    tokens: jaccardTokenize(s.disciplina.nome),
  }));
}

const comp = testCurso("eng-computacao");
const meca = testCurso("eng-mecatronica");
const moda = testCurso("design-moda");

// Cross-course matching test
console.log(`\n${"=".repeat(60)}`);
console.log(`  CROSS-COURSE MATCHING`);
console.log(`${"=".repeat(60)}`);

// Find subjects that exist in multiple courses (shared classes)
const sharedSubjects: string[] = [];
for (const c of comp) {
  for (const m of meca) {
    const score = jaccardIndex(c.tokens, m.tokens);
    if (score >= 0.5 && c.codigo !== m.codigo) {
      sharedSubjects.push(`  COMP ${c.codigo} "${c.nome}" <=> MECA ${m.codigo} "${m.nome}" (Jaccard: ${score.toFixed(3)})`);
    }
  }
}

console.log(`\nMatérias compartilhadas COMP↔MECA (Jaccard ≥ 0.5):`);
if (sharedSubjects.length === 0) {
  console.log("  Nenhuma encontrada");
} else {
  for (const s of sharedSubjects) console.log(s);
}

// Check token length distribution
console.log(`\n${"=".repeat(60)}`);
console.log(`  DISTRIBUIÇÃO DE TOKENS`);
console.log(`${"=".repeat(60)}`);

const allTokens = new Set<string>();
for (const d of [...comp, ...meca, ...moda]) {
  for (const t of d.tokens) allTokens.add(t);
}

const byLength: Record<number, string[]> = {};
for (const t of allTokens) {
  const len = t.length;
  if (!byLength[len]) byLength[len] = [];
  byLength[len].push(t);
}

for (const len of Object.keys(byLength).map(Number).sort()) {
  const tokens = byLength[len];
  console.log(`  len=${len}: ${tokens.length} tokens ${len <= 3 ? "⚠️ (seriam descartados)" : ""}`);
  if (len <= 4) console.log(`    Exemplos: ${tokens.slice(0, 10).join(", ")}`);
}
