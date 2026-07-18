import { validationError } from "@/lib/api/errors";
import {
  findReferrerByMatricula,
  insertPendingReferral,
} from "@/lib/billing/referrals/referral-repository";
import {
  isValidFriendMatricula,
  normalizeFriendMatricula,
} from "@/lib/billing/referrals/normalize-friend-matricula";

export async function createPendingReferralForRegister(input: {
  referredUserId: string;
  referredCpf: string;
  friendMatricula: string;
}): Promise<void> {
  const matricula = normalizeFriendMatricula(input.friendMatricula);
  if (!matricula) {
    return;
  }

  if (!isValidFriendMatricula(matricula)) {
    throw validationError(
      "Matrícula do amigo inválida. Use a matrícula do SIGAA (sem espaços)."
    );
  }

  const referrer = await findReferrerByMatricula(matricula);
  if (!referrer) {
    throw validationError(
      "Matrícula não encontrada. O amigo precisa ter sincronizado o SIGAA ao menos uma vez."
    );
  }

  if (
    referrer.userId === input.referredUserId ||
    referrer.cpf === input.referredCpf
  ) {
    throw validationError("Você não pode indicar a si mesmo.");
  }

  await insertPendingReferral({
    referredUserId: input.referredUserId,
    referredCpf: input.referredCpf,
    referrerUserId: referrer.userId,
    referrerCpf: referrer.cpf,
    referrerMatricula: referrer.matricula,
  });
}
