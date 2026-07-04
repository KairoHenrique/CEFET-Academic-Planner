import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { BrowserJobSlot } from "../src/lib/worker/browser-job-slot";
import { loadWorkerConfig } from "../src/lib/worker/config";
import { parseWorkerJobRequest } from "../src/lib/worker/validate-job-request";
import { WorkerRuntimeState } from "../src/lib/worker/worker-runtime-state";
import { createWorkerServer } from "../worker/server";

describe("B54 — browser job slot", () => {
  test("maxConcurrent=1 serializa jobs", async () => {
    const slot = new BrowserJobSlot(1);
    const order: string[] = [];

    await Promise.all([
      slot.run(async () => {
        order.push("a-start");
        await new Promise((r) => setTimeout(r, 40));
        order.push("a-end");
      }),
      slot.run(async () => {
        order.push("b-start");
        order.push("b-end");
      }),
    ]);

    assert.deepEqual(order, ["a-start", "a-end", "b-start", "b-end"]);
  });

  test("snapshot reflete fila", async () => {
    const slot = new BrowserJobSlot(1);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const first = slot.run(async () => {
      await gate;
    });

    await new Promise((r) => setTimeout(r, 10));
    const snap = slot.snapshot();
    assert.equal(snap.activeSlots, 1);
    assert.equal(snap.queued, 0);

    release();
    await first;
  });
});

describe("B54 — worker config", () => {
  test("exige WORKER_SHARED_SECRET", () => {
    assert.throws(
      () => loadWorkerConfig({ WORKER_SHARED_SECRET: "curta" }),
      /WORKER_SHARED_SECRET/
    );
  });

  test("defaults seguros", () => {
    const config = loadWorkerConfig({
      WORKER_SHARED_SECRET: "segredo-minimo-16c",
    });
    assert.equal(config.maxConcurrent, 1);
    assert.equal(config.port, 8787);
  });
});

describe("B54 — validate job", () => {
  test("parse job r1", () => {
    const job = parseWorkerJobRequest({
      jobId: "job-1",
      robot: "r1",
      username: "123",
      password: "x",
      mode: "incremental",
    });
    assert.equal(job.robot, "r1");
    assert.equal(job.mode, "incremental");
  });
});

describe("B54 — HTTP worker", () => {
  test("health e status sem auth", async () => {
    const config = loadWorkerConfig({
      WORKER_SHARED_SECRET: "segredo-minimo-16c",
      WORKER_PORT: "0",
    });

    const { server } = createWorkerServer({ config });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const base = `http://127.0.0.1:${address.port}`;

    try {
      const health = await fetch(`${base}/health`);
      assert.equal(health.status, 200);

      const status = (await (
        await fetch(`${base}/status`)
      ).json()) as { ok: boolean; slot: { maxConcurrent: number } };
      assert.equal(status.ok, true);
      assert.equal(status.slot.maxConcurrent, 1);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
    }
  });

  test("POST /jobs exige bearer", async () => {
    const config = loadWorkerConfig({
      WORKER_SHARED_SECRET: "segredo-minimo-16c",
    });
    const runtime = new WorkerRuntimeState();
    const { server } = createWorkerServer({ config, runtime });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const base = `http://127.0.0.1:${address.port}`;

    try {
      const response = await fetch(`${base}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: "x",
          robot: "r1",
          username: "1",
          password: "p",
        }),
      });
      assert.equal(response.status, 401);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
    }
  });
});
