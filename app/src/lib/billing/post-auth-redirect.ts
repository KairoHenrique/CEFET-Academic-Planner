/**
 * Destino pós-login/cadastro.
 * App gratuito: sempre entra no app (`/`).
 */
export function resolvePostAuthRedirect(_subscription: {
  status: string;
}): string {
  return "/";
}
