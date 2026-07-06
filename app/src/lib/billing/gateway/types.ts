import type { PaidPlanId } from "@/lib/billing/types";

export type PixGatewayId = "mock" | "mercadopago" | "asaas";

export type PixGatewayMode = "mock" | "sandbox" | "production";

export interface PixGatewayConfig {
  id: PixGatewayId;
  mode: PixGatewayMode;
  configured: boolean;
  checkoutReady: boolean;
}

export interface CreatePixChargeParams {
  planId: PaidPlanId;
  amountCents: number;
  description: string;
  externalReference: string;
  payerEmail?: string;
  payerCpf?: string;
  expiresInMinutes?: number;
}

export interface PixChargeResult {
  gateway: PixGatewayId;
  gatewayPaymentId: string;
  status: "pending";
  qrCode: string;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  expiresAt: string;
}

export interface PixGatewayProvider {
  readonly id: PixGatewayId;
  createPixCharge(params: CreatePixChargeParams): Promise<PixChargeResult>;
}
