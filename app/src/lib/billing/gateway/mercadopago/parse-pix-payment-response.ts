import { ApiError } from "@/lib/api/errors";
import type { PixChargeResult } from "../types";

export interface MercadoPagoPixPaymentResponse {
  id?: number | string;
  status?: string;
  date_of_expiration?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
  message?: string;
  cause?: Array<{ description?: string }>;
}

export function parseMercadoPagoPixPaymentResponse(
  data: MercadoPagoPixPaymentResponse
): PixChargeResult {
  const qrCode = data.point_of_interaction?.transaction_data?.qr_code?.trim();

  if (!qrCode) {
    const cause = data.cause?.[0]?.description ?? data.message ?? "Resposta inválida";
    throw new ApiError(
      "INTERNAL_ERROR",
      "Mercado Pago não retornou QR PIX.",
      502,
      { cause }
    );
  }

  const gatewayPaymentId = String(data.id ?? "").trim();
  if (!gatewayPaymentId) {
    throw new ApiError(
      "INTERNAL_ERROR",
      "Mercado Pago não retornou ID do pagamento.",
      502
    );
  }

  const expiresAt =
    data.date_of_expiration?.trim() ||
    new Date(Date.now() + 30 * 60 * 1000).toISOString();

  return {
    gateway: "mercadopago",
    gatewayPaymentId,
    status: "pending",
    qrCode,
    qrCodeBase64:
      data.point_of_interaction?.transaction_data?.qr_code_base64?.trim() ??
      null,
    ticketUrl:
      data.point_of_interaction?.transaction_data?.ticket_url?.trim() ?? null,
    expiresAt,
  };
}
