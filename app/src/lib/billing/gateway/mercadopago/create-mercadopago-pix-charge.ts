import { ApiError } from "@/lib/api/errors";
import type { CreatePixChargeParams, PixGatewayProvider } from "../types";
import {
  parseMercadoPagoPixPaymentResponse,
  type MercadoPagoPixPaymentResponse,
} from "./parse-pix-payment-response";

const MERCADOPAGO_API = "https://api.mercadopago.com/v1/payments";
const DEFAULT_EXPIRES_MINUTES = 30;

function sanitizeCpf(cpf: string | undefined): string | undefined {
  const digits = cpf?.replace(/\D/g, "") ?? "";
  return digits.length === 11 ? digits : undefined;
}

function buildExpirationIso(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

export class MercadoPagoPixGateway implements PixGatewayProvider {
  readonly id = "mercadopago" as const;

  constructor(private readonly accessToken: string) {}

  async createPixCharge(params: CreatePixChargeParams) {
    const expiresMinutes = params.expiresInMinutes ?? DEFAULT_EXPIRES_MINUTES;
    const amount = params.amountCents / 100;
    const cpf = sanitizeCpf(params.payerCpf);

    const body: Record<string, unknown> = {
      transaction_amount: amount,
      description: params.description,
      payment_method_id: "pix",
      external_reference: params.externalReference,
      date_of_expiration: buildExpirationIso(expiresMinutes),
      payer: {
        email: params.payerEmail?.trim() || "pagamento@acme-hub.local",
        ...(cpf
          ? {
              identification: {
                type: "CPF",
                number: cpf,
              },
            }
          : {}),
      },
    };

    const response = await fetch(MERCADOPAGO_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": params.externalReference,
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as MercadoPagoPixPaymentResponse;

    if (!response.ok) {
      const cause = payload.cause?.[0]?.description ?? payload.message;
      throw new ApiError(
        "INTERNAL_ERROR",
        "Falha ao criar cobrança PIX no Mercado Pago.",
        502,
        { status: response.status, cause }
      );
    }

    return parseMercadoPagoPixPaymentResponse(payload);
  }
}

export function createMercadoPagoPixGateway(
  accessToken: string
): MercadoPagoPixGateway {
  const trimmed = accessToken.trim();
  if (!trimmed) {
    throw new ApiError(
      "INTERNAL_ERROR",
      "Mercado Pago não configurado (MERCADOPAGO_ACCESS_TOKEN).",
      503
    );
  }

  return new MercadoPagoPixGateway(trimmed);
}
