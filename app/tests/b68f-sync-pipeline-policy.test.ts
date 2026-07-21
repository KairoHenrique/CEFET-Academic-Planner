import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { parseSyncRequest } from "../src/lib/api/validate";
import {
  normalizeSyncMode,
  resolveSyncModeForTrigger,
  resolveTurmaSubpagesForMode,
  shouldRunHistoricoForMode,
} from "../src/lib/sync-policy/resolve-sync-mode";
import {
  readEffectiveSyncPolicySync,
  resetAppConfigStoreForTests,
  setSyncPolicyStoreModeForTests,
  writeSyncPolicyOverridesSync,
} from "../src/lib/sync-policy/app-config-store";
import { shouldRunHistoricoStage } from "../src/lib/sync/sync-stage-plan";

describe("B68f — resolveSyncMode por gatilho (policy §6.6)", () => {
  it("first_login sempre full", () => {
    assert.equal(
      resolveSyncModeForTrigger({ trigger: "first_login", buttonScope: "lite" }),
      "full"
    );
  });

  it("manual/auto usa buttonScope lite → lite", () => {
    assert.equal(
      resolveSyncModeForTrigger({ trigger: "manual", buttonScope: "lite" }),
      "lite"
    );
    assert.equal(
      resolveSyncModeForTrigger({ trigger: "auto", buttonScope: "lite" }),
      "lite"
    );
  });

  it("manual/auto com buttonScope full → full", () => {
    assert.equal(
      resolveSyncModeForTrigger({ trigger: "manual", buttonScope: "full" }),
      "full"
    );
  });

  it("requestedMode deep sobrescreve buttonScope", () => {
    assert.equal(
      resolveSyncModeForTrigger({
        trigger: "manual",
        requestedMode: "deep",
        buttonScope: "lite",
      }),
      "deep"
    );
  });

  it("incremental normaliza para lite", () => {
    assert.equal(normalizeSyncMode("incremental"), "lite");
  });
});

describe("B68f — camadas lite vs deep", () => {
  it("lite: subpáginas notas+tarefas; sem histórico", () => {
    assert.deepEqual(resolveTurmaSubpagesForMode("lite"), ["notas", "tarefas"]);
    assert.equal(shouldRunHistoricoForMode("lite"), false);
  });

  it("deep/full: todas subpáginas + histórico", () => {
    assert.deepEqual(resolveTurmaSubpagesForMode("deep"), [
      "notas",
      "frequencia",
      "grupo",
      "tarefas",
    ]);
    assert.equal(shouldRunHistoricoForMode("deep"), true);
    assert.equal(shouldRunHistoricoForMode("full"), true);
  });

  it("shouldRunHistoricoStage: lite nunca", () => {
    assert.equal(shouldRunHistoricoStage("lite"), false);
  });
});

describe("B68f — runtime lê policy no enqueue", () => {
  after(() => {
    resetAppConfigStoreForTests();
  });

  it("manual sem mode explícito usa buttonScope da policy", async () => {
    resetAppConfigStoreForTests();
    setSyncPolicyStoreModeForTests("memory");
    writeSyncPolicyOverridesSync({ buttonScope: "lite" });

    const { parseEnqueueSyncQueueRequest } = await import(
      "../src/lib/sync-queue/validate-enqueue-request"
    );

    const lite = parseEnqueueSyncQueueRequest({
      username: "12345678901",
      password: "x",
      trigger: "manual",
    });
    assert.equal(lite.mode, "lite");
    assert.equal(readEffectiveSyncPolicySync().buttonScope, "lite");

    writeSyncPolicyOverridesSync({ buttonScope: "full" });
    const full = parseEnqueueSyncQueueRequest({
      username: "12345678901",
      password: "x",
      trigger: "manual",
    });
    assert.equal(full.mode, "full");
  });
});

describe("B68f — parseSyncRequest API", () => {
  it("aceita lite/deep/incremental", () => {
    const lite = parseSyncRequest({
      username: "1",
      password: "p",
      mode: "lite",
    });
    assert.equal(lite.mode, "lite");

    const deep = parseSyncRequest({
      username: "1",
      password: "p",
      mode: "deep",
    });
    assert.equal(deep.mode, "deep");

    const inc = parseSyncRequest({
      username: "1",
      password: "p",
      mode: "incremental",
    });
    assert.equal(inc.mode, "lite");
  });
});
