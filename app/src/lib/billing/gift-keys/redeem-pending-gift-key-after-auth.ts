import { postBillingRedeemKey } from "@/lib/api/client";
import { clearPendingGiftKey, readPendingGiftKey } from "./pending-gift-key-storage";

export async function redeemPendingGiftKeyAfterAuth(): Promise<{
  redeemed: boolean;
  planLabel?: string;
  errorMessage?: string;
}> {
  const code = readPendingGiftKey();
  if (!code) {
    return { redeemed: false };
  }

  try {
    const result = await postBillingRedeemKey({ code });
    clearPendingGiftKey();
    return { redeemed: true, planLabel: result.planLabel };
  } catch (error) {
    clearPendingGiftKey();
    return {
      redeemed: false,
      errorMessage:
        error instanceof Error
          ? error.message
          : "Não foi possível resgatar a chave.",
    };
  }
}
