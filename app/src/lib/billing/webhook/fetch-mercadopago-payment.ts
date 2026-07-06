import { ApiError } from "@/lib/api/errors";
import { mapMercadoPagoPaymentStatus } from "./map-mercadopago-payment-status";

export interface MercadoPagoPaymentDetails {
  id: string;
  status: string;
  externalReference: string | null;
  mappedStatus: ReturnType<typeof mapMercadoPagoPaymentStatus>;
}

interface MercadoPagoPaymentApiResponse {
  id?: number | string;
  status?: string;
  external_reference?: string | null;
  message?: string;
}

const MERCADOPAGO_API = "https://api.mercadopago.com/v1/payments";

export async function fetchMercadoPagoPaymentDetails(
  gatewayPaymentId: string,
  accessToken: string
): Promise<MercadoPagoPaymentDetails> {
  const trimmedId = gatewayPaymentId.trim();
  if (!trimmedId) {
    throw new ApiError("VALIDATION_ERROR", "ID de pagamento Mercado Pago ausente.", 400);
  }

  const response = await fetch(`${MERCADOPAGO_API}/${encodeURIComponent(trimmedId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken.trim()}`,
    },
  });

  const payload = (await response.json()) as MercadoPagoPaymentApiResponse;

  if (!response.ok) {
    throw new ApiError(
      "INTERNAL_ERROR",
      "Falha ao consultar pagamento no Mercado Pago.",
      502,
      { status: response.status, message: payload.message }
    );
  }

  const id = String(payload.id ?? trimmedId).trim();
  const status = payload.status?.trim() ?? "";

  return {
    id,
    status,
    externalReference: payload.external_reference?.trim() || null,
    mappedStatus: mapMercadoPagoPaymentStatus(status),
  };
}
