import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { DEFAULT_SYNC_POLICY } from "../src/lib/sync-policy/defaults";
import { mergeSyncPolicyOverrides } from "../src/lib/sync-policy/merge-effective-policy";
import { isGlobalRefreshDue } from "../src/lib/sync-orchestrator/global-refresh-scheduler";
import {
  createEmptyOrchestratorState,
  planOrchestratorTick,
} from "../src/lib/sync-orchestrator/plan-orchestrator-tick";
import {
  isWithinNightlyWindow,
  isWithinTimeWindow,
} from "../src/lib/sync-orchestrator/nightly-window";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "planner-b68e-"));
process.env.PLANNER_DATA_ROOT = tmpDir;
process.env.SYNC_QUEUE_DB_PATH = path.join(tmpDir, "sync-queue.db");

function spTime(isoLocal: string): Date {
  return new Date(isoLocal);
}

describe("B68e — janela noturna 03:00-06:00", () => {
  const window = "03:00-06:00";

  it("04:00 BRT está dentro da janela", () => {
    const now = spTime("2026-07-06T04:00:00-03:00");
    assert.equal(isWithinTimeWindow(window, now), true);
    assert.equal(isWithinNightlyWindow(window, now), true);
  });

  it("06:00 BRT está fora (fim exclusivo)", () => {
    const now = spTime("2026-07-06T06:00:00-03:00");
    assert.equal(isWithinTimeWindow(window, now), false);
  });

  it("02:59 BRT está fora", () => {
    const now = spTime("2026-07-06T02:59:00-03:00");
    assert.equal(isWithinTimeWindow(window, now), false);
  });
});

describe("B68e — TTL global R2/R3", () => {
  it("dispara quando nunca rodou", () => {
    const now = spTime("2026-07-06T12:00:00-03:00");
    assert.equal(
      isGlobalRefreshDue(DEFAULT_SYNC_POLICY.globalCalendario, null, now),
      true
    );
  });

  it("não dispara dentro do intervalo de 7 dias", () => {
    const now = spTime("2026-07-06T12:00:00-03:00");
    const last = spTime("2026-07-05T12:00:00-03:00").toISOString();
    assert.equal(
      isGlobalRefreshDue(DEFAULT_SYNC_POLICY.globalCalendario, last, now),
      false
    );
  });

  it("force ignora TTL", () => {
    const now = spTime("2026-07-06T12:00:00-03:00");
    const last = now.toISOString();
    assert.equal(
      isGlobalRefreshDue(
        DEFAULT_SYNC_POLICY.globalCalendario,
        last,
        now,
        true
      ),
      true
    );
  });
});

describe("B68e — plano do orquestrador", () => {
  const policy = mergeSyncPolicyOverrides(null);
  const cpfs = ["11111111111", "22222222222"];

  it("fora da janela noturna: R2/R3 se TTL vencido, sem R1-deep", () => {
    const now = spTime("2026-07-06T12:00:00-03:00");
    const plan = planOrchestratorTick({
      now,
      policy,
      state: createEmptyOrchestratorState(),
      eligibleCpfs: cpfs,
    });

    assert.equal(plan.inNightlyWindow, false);
    assert.ok(
      plan.actions.some((a) => a.type === "run_global_calendario"),
      "calendário global deve estar no plano"
    );
    assert.ok(
      plan.actions.some((a) => a.type === "run_global_turmas"),
      "turmas global por curso"
    );
    assert.equal(
      plan.actions.filter((a) => a.type === "enqueue_r1_deep").length,
      0
    );
  });

  it("dentro da janela noturna: enfileira R1-deep por CPF", () => {
    const now = spTime("2026-07-06T04:00:00-03:00");
    const state = createEmptyOrchestratorState();
    state.calendarioLastAt = now.toISOString();
    for (const cursoId of [
      "eng-computacao",
      "eng-mecatronica",
      "design-moda",
    ] as const) {
      state.turmasLastAtByCurso[cursoId] = now.toISOString();
    }

    const plan = planOrchestratorTick({
      now,
      policy,
      state,
      eligibleCpfs: cpfs,
    });

    assert.equal(plan.inNightlyWindow, true);
    const deep = plan.actions.filter((a) => a.type === "enqueue_r1_deep");
    assert.equal(deep.length, cpfs.length);
    assert.deepEqual(
      deep.map((a) => (a.type === "enqueue_r1_deep" ? a.cpf : "")),
      cpfs
    );
  });

  it("force=1 inclui deep mesmo fora da janela", () => {
    const now = spTime("2026-07-06T12:00:00-03:00");
    const plan = planOrchestratorTick({
      now,
      policy,
      state: createEmptyOrchestratorState(),
      eligibleCpfs: ["33333333333"],
      force: true,
    });

    assert.equal(
      plan.actions.filter((a) => a.type === "enqueue_r1_deep").length,
      1
    );
  });
});

describe("B68e — fila max_concurrent CPFs distintos", () => {
  before(() => {
    process.env.PLANNER_ALLOW_SQLITE = "true";
  });

  after(async () => {
    const { resetSyncQueueDatabaseForTests } = await import(
      "../src/lib/sync-queue/sync-queue-store"
    );
    resetSyncQueueDatabaseForTests();
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore EPERM on Windows
    }
  });

  function makeJob(
    id: string,
    username: string,
    status: "queued" | "running"
  ) {
    const now = new Date().toISOString();
    return {
      id,
      username,
      lane: "normal" as const,
      trigger: "auto" as const,
      mode: "deep" as const,
      status,
      savePassword: 0,
      idempotencyKey: null,
      passwordEnc: "",
      createdAt: now,
      startedAt: status === "running" ? now : null,
      finishedAt: null,
      resultJson: null,
      errorCode: null,
      errorMessage: null,
    };
  }

  it("evita enfileirar segundo job do mesmo CPF em execução", async () => {
    const {
      insertSyncJob,
      dequeueNextSyncJob,
      resetSyncQueueDatabaseForTests,
    } = await import("../src/lib/sync-queue/sync-queue-store");

    resetSyncQueueDatabaseForTests();

    insertSyncJob(makeJob("run-a", "cpf-a", "running"));
    insertSyncJob(makeJob("q-a-dup", "cpf-a", "queued"));
    insertSyncJob(makeJob("q-c", "cpf-c", "queued"));

    const next = dequeueNextSyncJob(2);
    assert.ok(next);
    assert.equal(next.username, "cpf-c");
  });

  it("respeita max_concurrent quando fila cheia", async () => {
    const {
      insertSyncJob,
      dequeueNextSyncJob,
      resetSyncQueueDatabaseForTests,
    } = await import("../src/lib/sync-queue/sync-queue-store");

    resetSyncQueueDatabaseForTests();

    insertSyncJob(makeJob("run-a", "cpf-a", "running"));
    insertSyncJob(makeJob("run-b", "cpf-b", "running"));
    insertSyncJob(makeJob("q-c", "cpf-c", "queued"));

    assert.equal(dequeueNextSyncJob(2), null);
  });

  it("libera slot quando running < max_concurrent", async () => {
    const {
      insertSyncJob,
      dequeueNextSyncJob,
      resetSyncQueueDatabaseForTests,
    } = await import("../src/lib/sync-queue/sync-queue-store");

    resetSyncQueueDatabaseForTests();

    insertSyncJob(makeJob("run-only", "cpf-x", "running"));
    insertSyncJob(makeJob("q-y", "cpf-y", "queued"));

    const next = dequeueNextSyncJob(2);
    assert.ok(next);
    assert.equal(next.id, "q-y");
  });
});
