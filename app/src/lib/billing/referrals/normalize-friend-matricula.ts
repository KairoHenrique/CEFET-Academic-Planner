const MIN_MATRICULA_LENGTH = 6;
const MAX_MATRICULA_LENGTH = 20;

/**
 * Normaliza matrícula informada no cadastro (trim + remove espaços internos).
 * Aceita dígitos e letras (SIGAA pode variar por campus).
 */
export function normalizeFriendMatricula(raw: string): string {
  return raw.trim().replace(/\s+/g, "");
}

export function isValidFriendMatricula(matricula: string): boolean {
  if (
    matricula.length < MIN_MATRICULA_LENGTH ||
    matricula.length > MAX_MATRICULA_LENGTH
  ) {
    return false;
  }
  return /^[A-Za-z0-9/-]+$/.test(matricula);
}
