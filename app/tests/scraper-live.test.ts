/**
 * Teste opcional contra SIGAA real — só roda com credenciais no ambiente.
 * SIGAA_TEST_USER + SIGAA_TEST_PASSWORD (nunca commitar).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";

const user = process.env.SIGAA_TEST_USER?.trim();
const password = process.env.SIGAA_TEST_PASSWORD;
const hasLiveCredentials = Boolean(user && password);

describe("B24 — login SIGAA (live)", () => {
  test(
    "login real no portal",
    { skip: !hasLiveCredentials },
    async () => {
      process.env.SIGAA_SCRAPER_MOCK = "false";
      process.env.SIGAA_HEADLESS = process.env.SIGAA_HEADLESS ?? "true";

      const { loginSigaa } = await import("../src/lib/scraper/auth");
      const session = await loginSigaa({ username: user!, password: password! });

      assert.equal(session.username, user);
      assert.ok(session.cookies.length > 0, "sessão deve ter cookies");
    }
  );
});

if (!hasLiveCredentials) {
  console.log(
    "[test:scraper:live] Pulado — defina SIGAA_TEST_USER e SIGAA_TEST_PASSWORD."
  );
}
