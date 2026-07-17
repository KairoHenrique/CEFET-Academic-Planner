/**
 * Saudação personalizada dos e-mails (B62c).
 *
 * Usa apenas os N primeiros nomes do aluno (padrão 2) para deixar o e-mail
 * pessoal sem expor o nome completo (minimização de dados / LGPD). Quando o
 * nome não está disponível (ex.: cadastro antes do 1º sync), cai em "Olá!".
 */
const DEFAULT_MAX_NAMES = 2;

export function resolveFirstNames(
  fullName: string | null | undefined,
  maxNames = DEFAULT_MAX_NAMES
): string | null {
  if (!fullName) {
    return null;
  }

  const parts = fullName
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return null;
  }

  const picked = parts.slice(0, Math.max(1, maxNames)).join(" ");
  return picked.length > 0 ? picked : null;
}

export function buildGreeting(firstNames: string | null): string {
  return firstNames ? `Olá, ${firstNames}!` : "Olá!";
}
