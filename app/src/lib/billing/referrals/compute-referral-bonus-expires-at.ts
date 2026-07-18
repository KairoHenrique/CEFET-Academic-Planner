import { resolveTrialSubscriptionForCpf } from "@/lib/auth/trial/trial-service";
import { findLatestActiveSubscriptionForUser } from "@/lib/billing/checkout/billing-subscription-repository";

/**
 * Base para empilhar bônus de indicação: fim da assinatura ativa, ou fim do
 * trial ativo, ou agora — o trial de 7 dias nunca é encurtado.
 */
export async function computeReferralBonusExpiresAt(input: {
  userId: string;
  cpf: string;
  durationDays: number;
  now?: Date;
}): Promise<Date> {
  const now = input.now ?? new Date();
  let base = now;

  const previous = await findLatestActiveSubscriptionForUser(input.userId);
  if (previous) {
    const previousExpires = Date.parse(previous.expires_at);
    if (previousExpires > now.getTime()) {
      base = new Date(previousExpires);
    }
  } else {
    const trial = await resolveTrialSubscriptionForCpf(input.cpf);
    if (trial?.status === "trial_active" && trial.expiresAt) {
      const trialEnds = Date.parse(trial.expiresAt);
      if (trialEnds > now.getTime()) {
        base = new Date(trialEnds);
      }
    }
  }

  return new Date(base.getTime() + input.durationDays * 24 * 60 * 60 * 1000);
}
