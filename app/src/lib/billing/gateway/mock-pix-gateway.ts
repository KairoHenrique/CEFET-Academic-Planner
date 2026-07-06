import type {
  CreatePixChargeParams,
  PixChargeResult,
  PixGatewayProvider,
} from "./types";

const DEFAULT_EXPIRES_MINUTES = 30;

function buildMockQrCode(externalReference: string): string {
  const payload = `MOCK-PIX-${externalReference}`.slice(0, 32);
  return `00020126580014BR.GOV.BCB.PIX0136${payload}5204000053039865802BR5925ACME HUB MOCK6009SAO PAULO62070503***6304ABCD`;
}

export class MockPixGateway implements PixGatewayProvider {
  readonly id = "mock" as const;

  async createPixCharge(params: CreatePixChargeParams): Promise<PixChargeResult> {
    const expiresMinutes = params.expiresInMinutes ?? DEFAULT_EXPIRES_MINUTES;
    const expiresAt = new Date(
      Date.now() + expiresMinutes * 60 * 1000
    ).toISOString();

    const qrCode = buildMockQrCode(params.externalReference);

    return {
      gateway: "mock",
      gatewayPaymentId: `mock_${params.externalReference}`,
      status: "pending",
      qrCode,
      qrCodeBase64: null,
      ticketUrl: null,
      expiresAt,
    };
  }
}

export const mockPixGateway = new MockPixGateway();
