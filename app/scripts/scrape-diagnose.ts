/**
 * Diagnóstico de raspagem SIGAA — roda login + turma virtual e imprime resumo.
 *
 * Uso (na pasta app/):
 *   $env:SIGAA_HEADLESS="false"
 *   $env:SIGAA_SCRAPER_DEBUG="true"
 *   npx tsx scripts/scrape-diagnose.ts
 *
 * Credenciais: SIGAA_TEST_USER e SIGAA_TEST_PASSWORD no ambiente,
 * ou argumentos: npx tsx scripts/scrape-diagnose.ts CPF SENHA
 */
import { loginSigaaOnPage } from "../src/lib/scraper/auth";
import { withSyncBrowser } from "../src/lib/scraper/session-context";
import { scrapePortalDiscente } from "../src/lib/scraper/portal-discente/scrape-portal-discente";
import { scrapeTurmaVirtual } from "../src/lib/scraper/turma-virtual/scrape-turma-virtual";

async function main(): Promise<void> {
  const username = process.argv[2] ?? process.env.SIGAA_TEST_USER;
  const password = process.argv[3] ?? process.env.SIGAA_TEST_PASSWORD;

  if (!username || !password) {
    console.error("Informe SIGAA_TEST_USER e SIGAA_TEST_PASSWORD ou CPF SENHA como argumentos.");
    process.exit(1);
  }

  await withSyncBrowser(async (page) => {
    console.info("→ Login…");
    await loginSigaaOnPage(page, { username, password, savePassword: false });

    console.info("→ Portal…");
    const portal = await scrapePortalDiscente(page);
    console.info(
      `  Aluno: ${portal.aluno.nome} | Disciplinas: ${portal.semestreAtual.length} | Atividades: ${portal.atividades.length}`
    );

    console.info("→ Turma virtual…");
    const turma = await scrapeTurmaVirtual(page);

    for (const disciplina of turma.disciplinas) {
      const warnings = disciplina.scrapeWarnings?.join("; ") ?? "";
      console.info(
        `  ${disciplina.sigaaNome}: notas=${disciplina.notas.length} faltas=${disciplina.faltas.length} tarefas=${disciplina.tarefas.length}${warnings ? ` ⚠ ${warnings}` : ""}`
      );
    }

    const totalNotas = turma.disciplinas.reduce((n, d) => n + d.notas.length, 0);
    const totalFaltas = turma.disciplinas.reduce((n, d) => n + d.faltas.length, 0);
    const totalTarefas = turma.disciplinas.reduce((n, d) => n + d.tarefas.length, 0);

    console.info(
      `\nResumo: ${turma.disciplinas.length} disciplinas | ${totalNotas} notas | ${totalFaltas} faltas | ${totalTarefas} tarefas`
    );

    if (process.env.SIGAA_SCRAPER_DEBUG === "true") {
      console.info("HTML de debug em app/.data/scrape-debug/");
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
