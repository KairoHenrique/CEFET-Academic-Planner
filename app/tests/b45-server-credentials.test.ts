import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeCpf } from "../src/lib/auth/account/cpf";

describe("B45 — credenciais SIGAA server-side (AES)", () => {
  it("seal/open round-trip com CREDENTIALS_ENCRYPTION_KEY", async () => {
    process.env.CREDENTIALS_ENCRYPTION_KEY = "test-encryption-key-32-chars!!";

    const { sealServerSigaaPassword, openServerSigaaPassword } = await import(
      "../src/lib/crypto/server-sigaa-credential-store"
    );

    const sealed = sealServerSigaaPassword("sigaa-secret");
    assert.notEqual(sealed, "sigaa-secret");
    assert.equal(openServerSigaaPassword(sealed), "sigaa-secret");
  });

  it("resolveSigaaPasswordSync usa senha inline no SQLite", async () => {
    delete process.env.PLANNER_DATABASE;
    delete process.env.DATABASE_URL;

    const { resolveSigaaPasswordSync } = await import(
      "../src/lib/crypto/resolve-sigaa-password"
    );

    assert.equal(
      resolveSigaaPasswordSync({
        username: "11144477735",
        password: "inline",
      }),
      "inline"
    );
  });

  it("resolveSigaaPasswordSync rejeita postgres sem senha inline", async () => {
    process.env.PLANNER_DATABASE = "postgres";
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/postgres";

    const { resolveSigaaPasswordSync } = await import(
      "../src/lib/crypto/resolve-sigaa-password"
    );

    assert.throws(() =>
      resolveSigaaPasswordSync({
        username: "11144477735",
      })
    );

    delete process.env.PLANNER_DATABASE;
    delete process.env.DATABASE_URL;
  });

  it("normalizeCpf alinha username do worker ao CPF persistido", () => {
    assert.equal(normalizeCpf("111.444.777-35"), "11144477735");
  });
});
