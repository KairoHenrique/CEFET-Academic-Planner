import { getDisciplinas } from "@/lib/db/queries";

export function normalizeDisciplinaNome(value: string): string {
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

  const target = normalizeDisciplinaNome(trimmed);
  const disciplinas = getDisciplinas();

  const exact = disciplinas.find(
    (disciplina) => normalizeDisciplinaNome(disciplina.nome) === target
  );
  if (exact) return exact.codigo;

  const contains = disciplinas.find((disciplina) => {
    const candidate = normalizeDisciplinaNome(disciplina.nome);
    return candidate.includes(target) || target.includes(candidate);
  });
  if (contains) return contains.codigo;

  return trimmed.slice(0, 24).replace(/\s+/g, "-").toUpperCase();
}

export function resolveDisciplinaCodigoFromSemestre(
  ref: string,
  semestreByNome: ReadonlyMap<string, string>,
  activeIds: ReadonlySet<string>
): string | null {
  const target = normalizeDisciplinaNome(ref);
  const direct = semestreByNome.get(target);
  if (direct && activeIds.has(direct)) return direct;

  for (const [nome, codigo] of semestreByNome) {
    if (!activeIds.has(codigo)) continue;
    if (nome.includes(target) || target.includes(nome)) return codigo;
  }

  const fallback = resolveDisciplinaCodigoByNome(ref);
  return activeIds.has(fallback) ? fallback : null;
}
