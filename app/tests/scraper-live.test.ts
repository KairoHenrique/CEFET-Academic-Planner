/**
 * Teste opcional contra SIGAA real — só roda com credenciais no ambiente.
 * SIGAA_TEST_USER + SIGAA_TEST_PASSWORD (nunca commitar).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { withSyncBrowser } from "../src/lib/scraper/session-context";
import { loginSigaaOnPage } from "../src/lib/scraper/auth";
import { scrapePortalDiscente } from "../src/lib/scraper/portal-discente/scrape-portal-discente";
import { scrapeTurmaVirtual } from "../src/lib/scraper/turma-virtual/scrape-turma-virtual";

const user = process.env.SIGAA_TEST_USER?.trim();
const password = process.env.SIGAA_TEST_PASSWORD;
const hasLiveCredentials = Boolean(user && password);

describe("Sync Completo (live)", () => {
  test(
    "realiza o sync completo em uma única sessão",
    { skip: !hasLiveCredentials },
    async () => {
      process.env.SIGAA_SCRAPER_MOCK = "false";
      process.env.SIGAA_HEADLESS = process.env.SIGAA_HEADLESS ?? "true";

      await withSyncBrowser(async (page) => {
        // 1. Login
        await loginSigaaOnPage(page, { username: user!, password: password! });
        const cookies = await page.context().cookies();
        assert.ok(cookies.length > 0, "sessão deve ter cookies");

        // 2. Portal
        const portalSnapshot = await scrapePortalDiscente(page);
        assert.ok(portalSnapshot.aluno.matricula.length >= 8);
        assert.notEqual(portalSnapshot.aluno.nome, "Discente");

        // 3. Turma Virtual
        const turmaSnapshot = await scrapeTurmaVirtual(page);
        assert.ok(turmaSnapshot.disciplinas.length >= 3);
        const withNotas = turmaSnapshot.disciplinas.filter((item) => item.notas.length > 0);
        assert.ok(withNotas.length >= 1, "ao menos uma disciplina com notas");
      });
    }
  );
});

if (!hasLiveCredentials) {
  console.log(
    "[test:scraper:live] Pulado — defina SIGAA_TEST_USER e SIGAA_TEST_PASSWORD."
  );
}
