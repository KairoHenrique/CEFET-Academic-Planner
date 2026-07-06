const EXTERNAL_REFERENCE_PREFIX = "planner-pay";

export function buildPaymentExternalReference(paymentId: string): string {
  return `${EXTERNAL_REFERENCE_PREFIX}-${paymentId}`;
}

export function isPlannerPaymentExternalReference(value: string): boolean {
  return value.startsWith(`${EXTERNAL_REFERENCE_PREFIX}-`);
}
