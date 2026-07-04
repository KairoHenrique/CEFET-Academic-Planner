import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isTaskEligibleForNotification } from "../src/lib/notifications/build-notification-snapshot";

describe("notification-snapshot — tarefas", () => {
  test("ignora tarefa concluída", () => {
    assert.equal(
      isTaskEligibleForNotification({
        concluida: 1,
        data_fim: "2026-07-10",
      }),
      false
    );
  });

  test("ignora tarefa sem prazo", () => {
    assert.equal(
      isTaskEligibleForNotification({
        concluida: 0,
        data_fim: "",
      }),
      false
    );
  });

  test("aceita tarefa pendente com prazo", () => {
    assert.equal(
      isTaskEligibleForNotification({
        concluida: 0,
        data_fim: "2026-07-10",
      }),
      true
    );
  });
});
