import test from "node:test";
import assert from "node:assert/strict";
import {
  isPaymentAwaitingConfirmation,
  isPaymentTerminalFailure,
  isPaymentTerminalSuccess,
} from "../src/lib/billing/payments/payment-view";
import {
  paymentStatusLabel,
  paymentStatusTone,
} from "../src/lib/billing/payments/payment-status-labels";

test("payment status helpers classify PIX lifecycle", () => {
  assert.equal(isPaymentAwaitingConfirmation("pending"), true);
  assert.equal(isPaymentTerminalSuccess("approved"), true);
  assert.equal(isPaymentTerminalFailure("expired"), true);
});

test("paymentStatusLabel returns pt-BR labels", () => {
  assert.equal(paymentStatusLabel("pending"), "Aguardando PIX");
  assert.equal(paymentStatusTone("approved"), "success");
});
