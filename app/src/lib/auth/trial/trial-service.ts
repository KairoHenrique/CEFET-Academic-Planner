import {
  claimTrialForCpf,
  findTrialStartedAtByCpf,
} from "@/lib/auth/trial/trial-repository";
import {
  buildTrialSubscriptionSnapshot,
  type TrialSubscriptionSnapshot,
} from "@/lib/auth/trial/trial-status";

export async function ensureTrialRecordForCpf(
  cpf: string
): Promise<TrialSubscriptionSnapshot> {
  const trialStartedAt = await claimTrialForCpf(cpf);
  return buildTrialSubscriptionSnapshot(trialStartedAt);
}

export async function resolveTrialSubscriptionForCpf(
  cpf: string
): Promise<TrialSubscriptionSnapshot | null> {
  const trialStartedAt = await findTrialStartedAtByCpf(cpf);
  if (!trialStartedAt) {
    return null;
  }

  return buildTrialSubscriptionSnapshot(trialStartedAt);
}
