export function buildMultiHorarioBadgeLabel(variantCount: number): string {
  return `×${variantCount}`;
}

export function buildMultiHorarioTooltip(variantCount: number): string {
  if (variantCount <= 1) {
    return "Mais de um horário disponível para esta disciplina.";
  }

  return `${variantCount} horários disponíveis para a mesma disciplina. Escolha um deles abaixo e depois clique na grade para alocar.`;
}

export const ENROLLMENT_SCHEDULE_PLACED_HINT =
  "Na grade, clique para remover";

export const ENROLLMENT_COREQUISITO_PAIR_HINT =
  "Corequisito em par: inclua a disciplina parceira na grade (ou já tenha sido aprovado nela).";

export const ENROLLMENT_COREQUISITO_AFTER_HINT_PREFIX =
  "Depois inclua na grade:";

export const ENROLLMENT_COREQUISITO_ACTIVE_PREFIX = "Corequisito em par com:";

export const ENROLLMENT_COREQUISITO_CANCEL_TITLE = "Cancelar corequisito?";

export const ENROLLMENT_COREQUISITO_REMOVE_TITLE = "Remover corequisito?";

export const ENROLLMENT_COREQUISITO_ROLLBACK_KICKER = "Corequisito em par";

export const ENROLLMENT_COREQUISITO_ROLLBACK_CANCEL_HINT =
  "Corequisitos em par precisam ficar juntos na grade. Cancelar remove a disciplina já alocada.";

export const ENROLLMENT_COREQUISITO_ROLLBACK_REMOVE_HINT =
  "Corequisitos em par precisam ficar juntos na grade. Esta ação remove o par inteiro da simulação.";
