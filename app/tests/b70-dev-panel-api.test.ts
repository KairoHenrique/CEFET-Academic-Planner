import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { ApiError } from "../src/lib/api/errors";
import {
  appendDevAuditLog,
  listDevAuditLog,
  resetDevAuditLogForTests,
} from "../src/lib/dev-panel/dev-audit-log";
import { cpfLast4, maskCpf } from "../src/lib/dev-panel/mask-cpf";
import {
  assertDevOperatorsConfigured,
  listDevOperatorsFromEnv,
  verifyDevOperatorCredentials,
} from "../src/lib/dev-panel/operator-registry";
import {
  buildDevSessionSetCookie,
  createDevOperatorSession,
  readDevOperatorSessionFromCookie,
} from "../src/lib/dev-panel/operator-session";
import {
  parseDevLoginRequest,
  parseDevRobotRunRequest,
  parseSyncPolicyPatchBody,
} from "../src/lib/dev-panel/parse-dev-requests";
import { requireDevOperator } from "../src/lib/dev-panel/require-dev-operator";
import {
  getDevSyncPolicy,
  patchDevSyncPolicy,
  resetDevSyncPolicy,
} from "../src/lib/dev-panel/sync-policy-admin";
import {
  resetAppConfigStoreForTests,
  setSyncPolicyStoreModeForTests,
} from "../src/lib/sync-policy/app-config-store";

const ENV_BACKUP = { ...process.env };

function withDevEnv(): void {
  process.env.EMAIL_DEV = "ops@cefet.test";
  process.env.PASSWORD_DEV = "secret-ops-123";
  process.env.PLANNER_DEV_2_EMAIL = "ops2@cefet.test";
  process.env.PLANNER_DEV_2_PASSWORD = "secret-ops-456";
  process.env.PLANNER_DEV_SESSION_SECRET = "test-dev-session-secret";
  process.env.SYNC_POLICY_STORE = "memory";
  process.env.DEV_AUDIT_STORE = "memory";
}

describe("B70 — operadores dev (env registry)", () => {
  beforeEach(() => {
    process.env = { ...ENV_BACKUP, ...process.env };
    withDevEnv();
  });

  afterEach(() => {
    process.env = { ...ENV_BACKUP };
  });

  it("lista operadores primário + PLANNER_DEV_N_* sem duplicatas", () => {
    const operators = listDevOperatorsFromEnv();
    assert.equal(operators.length, 2);
    assert.equal(operators[0]?.email, "ops@cefet.test");
    assert.equal(operators[1]?.email, "ops2@cefet.test");
  });

  it("valida credenciais com comparação timing-safe", () => {
    const ok = verifyDevOperatorCredentials({
      email: "ops@cefet.test",
      password: "secret-ops-123",
    });
    assert.ok(ok);

    const bad = verifyDevOperatorCredentials({
      email: "ops@cefet.test",
      password: "wrong",
    });
    assert.equal(bad, null);
  });

  it("assertDevOperatorsConfigured falha sem env", () => {
    delete process.env.EMAIL_DEV;
    delete process.env.PASSWORD_DEV;
    delete process.env.PLANNER_DEV_EMAIL;
    delete process.env.PLANNER_DEV_PASSWORD;
    for (let index = 2; index <= 10; index += 1) {
      delete process.env[`PLANNER_DEV_${index}_EMAIL`];
      delete process.env[`PLANNER_DEV_${index}_PASSWORD`];
    }
    assert.throws(() => assertDevOperatorsConfigured(), /Nenhum operador dev/);
  });
});

describe("B70 — sessão operador (cookie HMAC)", () => {
  beforeEach(() => {
    process.env = { ...ENV_BACKUP, ...process.env };
    withDevEnv();
  });

  afterEach(() => {
    process.env = { ...ENV_BACKUP };
  });

  it("cria e lê sessão via cookie httpOnly", () => {
    const { token, session } = createDevOperatorSession("ops@cefet.test");
    assert.equal(session.email, "ops@cefet.test");
    assert.ok(session.expiresAt > session.issuedAt);

    const cookie = buildDevSessionSetCookie(token);
    const read = readDevOperatorSessionFromCookie(cookie);
    assert.equal(read?.email, "ops@cefet.test");
  });

  it("rejeita token adulterado", () => {
    const { token } = createDevOperatorSession("ops@cefet.test");
    const tampered = `${token}x`;
    const cookie = buildDevSessionSetCookie(tampered);
    assert.equal(readDevOperatorSessionFromCookie(cookie), null);
  });
});

describe("B70 — máscara CPF", () => {
  it("mascara CPF mantendo últimos 4 dígitos", () => {
    assert.equal(maskCpf("12345678901"), "***.***.***-8901");
    assert.equal(cpfLast4("12345678901"), "8901");
  });
});

describe("B70 — parse de requests", () => {
  it("parseDevLoginRequest exige email e senha", () => {
    assert.throws(
      () => parseDevLoginRequest({ email: "a@b.c" }),
      (error: unknown) =>
        error instanceof ApiError && error.code === "VALIDATION_ERROR"
    );
  });

  it("parseDevRobotRunRequest valida escopo e robôs", () => {
    const individual = parseDevRobotRunRequest({
      scope: "individual",
      accountRef: "11111111-1111-4111-8111-111111111111",
      robots: { r1: true, r2: false, r3: false },
    });
    assert.equal(individual.scope, "individual");
    assert.equal(individual.accountRef, "11111111-1111-4111-8111-111111111111");
    assert.equal(individual.mode, "deep");

    assert.throws(
      () =>
        parseDevRobotRunRequest({
          scope: "global",
          robots: { r1: false, r2: false, r3: false },
        }),
      /ao menos um robô/
    );
  });

  it("parseSyncPolicyPatchBody rejeita corpo inválido", () => {
    assert.throws(
      () => parseSyncPolicyPatchBody([]),
      /objeto JSON/
    );
  });
});

describe("B70 — guard requireDevOperator", () => {
  beforeEach(() => {
    process.env = { ...ENV_BACKUP, ...process.env };
    withDevEnv();
  });

  afterEach(() => {
    process.env = { ...ENV_BACKUP };
  });

  it("401 sem cookie de sessão", () => {
    assert.throws(
      () => requireDevOperator(new Request("http://localhost/api/dev/accounts")),
      (error: unknown) =>
        error instanceof ApiError && error.code === "UNAUTHORIZED"
    );
  });

  it("aceita cookie válido", () => {
    const { token } = createDevOperatorSession("ops@cefet.test");
    const cookie = buildDevSessionSetCookie(token);
    const request = new Request("http://localhost/api/dev/accounts", {
      headers: { cookie },
    });
    const session = requireDevOperator(request);
    assert.equal(session.email, "ops@cefet.test");
  });
});

describe("B70 — sync-policy admin", () => {
  beforeEach(() => {
    process.env = { ...ENV_BACKUP, ...process.env };
    withDevEnv();
    setSyncPolicyStoreModeForTests("memory");
    resetAppConfigStoreForTests();
  });

  afterEach(() => {
    resetAppConfigStoreForTests();
    process.env = { ...ENV_BACKUP };
  });

  it("GET retorna effective + overrides nulos quando vazio", async () => {
    const policy = await getDevSyncPolicy();
    assert.equal(policy.overrides, null);
    assert.equal(policy.effective.buttonScope, "lite");
    assert.equal(policy.effective.autoIntervalHours, 3);
  });

  it("PATCH persiste overrides e reset restaura defaults", async () => {
    await patchDevSyncPolicy({ autoIntervalHours: 5, buttonScope: "deep" });
    const patched = await getDevSyncPolicy();
    assert.equal(patched.overrides?.autoIntervalHours, 5);
    assert.equal(patched.effective.autoIntervalHours, 5);

    await resetDevSyncPolicy();
    const reset = await getDevSyncPolicy();
    assert.equal(reset.overrides, null);
    assert.equal(reset.effective.autoIntervalHours, 3);
  });

  it("PATCH rejeita workerMaxConcurrent inválido", async () => {
    await assert.rejects(
      () => patchDevSyncPolicy({ workerMaxConcurrent: 0 }),
      (error: unknown) =>
        error instanceof ApiError && error.code === "VALIDATION_ERROR"
    );
  });
});

describe("B70 — auditoria dev", () => {
  beforeEach(() => {
    process.env = { ...ENV_BACKUP, ...process.env };
    withDevEnv();
    process.env.DEV_AUDIT_STORE = "memory";
    resetDevAuditLogForTests();
  });

  afterEach(() => {
    resetDevAuditLogForTests();
    process.env = { ...ENV_BACKUP };
  });

  it("append e list mantém ordem mais recente primeiro", async () => {
    await appendDevAuditLog({
      operatorEmail: "ops@cefet.test",
      action: "dev.login",
    });
    await appendDevAuditLog({
      operatorEmail: "ops@cefet.test",
      action: "dev.robots.run",
      detail: { scope: "global" },
    });

    const entries = await listDevAuditLog(10);
    assert.equal(entries.length, 2);
    assert.equal(entries[0]?.action, "dev.robots.run");
    assert.equal(entries[1]?.action, "dev.login");
  });
});
