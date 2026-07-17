import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveHomeWorkerEmailDispatchConfig } from "../src/lib/email/home-worker-email-sender";
import { parseWorkerEmailSendRequest } from "../src/lib/worker/parse-email-send-request";

describe("home-gmail e-mail dispatch", () => {
  it("só liga com ACCOUNT_EMAIL_VIA_HOME_WORKER + worker URL/secret", () => {
    assert.equal(
      resolveHomeWorkerEmailDispatchConfig({
        ACCOUNT_EMAIL_VIA_HOME_WORKER: "true",
        SIGAA_WORKER_URL: "https://tunnel.example",
        WORKER_SHARED_SECRET: "segredo-minimo-16c",
      } as NodeJS.ProcessEnv)?.workerUrl,
      "https://tunnel.example"
    );

    assert.equal(
      resolveHomeWorkerEmailDispatchConfig({
        SIGAA_WORKER_URL: "https://tunnel.example",
        WORKER_SHARED_SECRET: "segredo-minimo-16c",
      } as NodeJS.ProcessEnv),
      null
    );
  });

  it("valida corpo do POST /email/send", () => {
    const parsed = parseWorkerEmailSendRequest({
      toEmail: "aluno@gmail.com",
      subject: "Oi",
      bodyText: "corpo",
    });
    assert.equal(parsed.toEmail, "aluno@gmail.com");
    assert.throws(
      () => parseWorkerEmailSendRequest({ toEmail: "x", subject: "a", bodyText: "b" }),
      /toEmail/
    );
  });
});
