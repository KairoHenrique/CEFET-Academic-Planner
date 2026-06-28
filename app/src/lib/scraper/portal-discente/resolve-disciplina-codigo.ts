import { getDisciplinas } from "@/lib/db/queries";

function normalizeNome(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Resolve código PPC a partir do nome exibido no portal SIGAA. */
export function resolveDisciplinaCodigoByNome(nomeOuCodigo: string): string {
  const trimmed = nomeOuCodigo.trim();
  if (/^[A-Z0-9-]{2,12}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  const target = normalizeNome(trimmed);
  const disciplinas = getDisciplinas();

  const exact = disciplinas.find(
    (disciplina) => normalizeNome(disciplina.nome) === target
  );
  if (exact) return exact.codigo;

  const contains = disciplinas.find((disciplina) => {
    const candidate = normalizeNome(disciplina.nome);
    return candidate.includes(target) || target.includes(candidate);
  });
  if (contains) return contains.codigo;

  return trimmed.slice(0, 24).replace(/\s+/g, "-").toUpperCase();
}
