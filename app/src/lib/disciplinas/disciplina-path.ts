/** Rota de detalhe — codifica `/` em códigos PPC (ex.: `01/4` → `01%2F4`). */
export function disciplinaDetailPath(code: string): string {
  return `/disciplinas/${encodeURIComponent(code)}`;
}
