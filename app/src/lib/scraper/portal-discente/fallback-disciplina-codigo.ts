export const FALLBACK_CODIGO_MAX_LENGTH = 24;

export function normalizeDisciplinaNomePure(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fnv1a32Hex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).toUpperCase().padStart(8, "0");
}

/** Gera código determinístico (<=24 chars) sem colisão de prefixo em Tópicos Especiais. */
export function buildFallbackDisciplinaCodigo(nome: string): string {
  const normalized = normalizeDisciplinaNomePure(nome);
  if (!normalized) return "DISC";

  const slug = normalized.replace(/\s+/g, "-").toUpperCase();
  if (slug.length <= FALLBACK_CODIGO_MAX_LENGTH) return slug;

  const hash = fnv1a32Hex(normalized);
  const prefix = slug.slice(0, 15).replace(/-+$/, "") || "DISC";
  return `${prefix}-${hash}`;
}

/** Identifica código legado truncado em 24 chars sem hash (causava colisão entre tópicos). */
export function isLegacyTruncatedFallbackCodigo(
  codigo: string,
  nome: string
): boolean {
  const trimmedNome = nome.trim();
  if (trimmedNome.length <= FALLBACK_CODIGO_MAX_LENGTH) return false;

  const legacy = trimmedNome
    .slice(0, FALLBACK_CODIGO_MAX_LENGTH)
    .replace(/\s+/g, "-")
    .toUpperCase();
  return codigo.trim().toUpperCase() === legacy;
}
