import { ApiError } from "@/lib/api/errors";
import type { CreatePixChargeParams, PixChargeResult, PixGatewayProvider } from "../types";

/** Adapter reservado — implementação completa pós-go-live se necessário. */
export class AsaasPixGateway implements PixGatewayProvider {
  readonly id = "asaas" as const;

  constructor(private readonly apiKey: string) {
    if (!apiKey.trim()) {
      throw new ApiError(
        "INTERNAL_ERROR",
        "Asaas não configurado (ASAAS_API_KEY).",
        503
      );
    }
  }

  async createPixCharge(_params: CreatePixChargeParams): Promise<PixChargeResult> {
    throw new ApiError(
      "INTERNAL_ERROR",
      "Gateway Asaas reservado — use mercadopago ou mock na v1.",
      501
    );
  }
}

export function createAsaasPixGateway(apiKey: string): AsaasPixGateway {
  return new AsaasPixGateway(apiKey);
}
