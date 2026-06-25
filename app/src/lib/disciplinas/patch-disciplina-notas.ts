import { notFoundError, validationError } from "@/lib/api/errors";
import {
  getNotasByDisciplina,
  getNotaById,
  getSemestreAtualByCodigo,
  notaNomeExists,
  saveNota,
  updateNotaObtida,
} from "@/lib/db/queries";
import type {
  PatchNotasBody,
  PatchNotasResponse,
} from "@/lib/types/disciplinas-api";
import { computeGrade } from "./grade";
import { mapNotasToEvaluations } from "./mappers";

function validateNotaScore(
  score: number | null | undefined,
  max: number
): void {
  if (score === null || score === undefined) return;
  if (score < 0 || score > max) {
    throw validationError(`Nota obtida deve estar entre 0 e ${max}.`);
  }
}

function assertDisciplinaSemestre(code: string) {
  const semestre = getSemestreAtualByCodigo(code);
  if (!semestre) {
    throw notFoundError("Disciplina não encontrada no semestre atual.");
  }
  return semestre;
}

function addManualNota(
  disciplinaId: string,
  body: Extract<PatchNotasBody, { action: "add" }>
): void {
  const nome = body.avaliacao_nome.trim();
  if (!nome) {
    throw validationError("Nome da avaliação é obrigatório.");
  }
  if (body.nota_maxima <= 0) {
    throw validationError("Nota máxima deve ser maior que zero.");
  }
  if (notaNomeExists(disciplinaId, nome)) {
    throw validationError("Já existe uma avaliação com este nome.");
  }
  validateNotaScore(body.nota_obtida, body.nota_maxima);

  saveNota({
    disciplina_id: disciplinaId,
    avaliacao_nome: nome,
    nota_maxima: body.nota_maxima,
    nota_obtida: body.nota_obtida ?? null,
    manual: 1,
  });
}

function updateManualNota(
  disciplinaId: string,
  body: Extract<PatchNotasBody, { action: "update" }>
): void {
  const nota = getNotaById(body.id);
  if (
    !nota ||
    nota.disciplina_id.toLowerCase() !== disciplinaId.toLowerCase()
  ) {
    throw notFoundError("Avaliação não encontrada nesta disciplina.");
  }
  if (nota.manual !== 1) {
    throw validationError("Apenas avaliações manuais podem ser editadas.");
  }

  const max = nota.nota_maxima ?? 0;
  validateNotaScore(body.nota_obtida, max);

  const changes = updateNotaObtida(body.id, body.nota_obtida);
  if (changes === 0) {
    throw validationError("Não foi possível atualizar a avaliação.");
  }
}

export function patchDisciplinaNotas(
  code: string,
  body: PatchNotasBody
): PatchNotasResponse {
  const semestre = assertDisciplinaSemestre(code);
  const disciplinaId = semestre.disciplina_id;

  if (body.action === "add") {
    addManualNota(disciplinaId, body);
  } else {
    updateManualNota(disciplinaId, body);
  }

  const notas = getNotasByDisciplina(disciplinaId);
  return {
    evaluations: mapNotasToEvaluations(notas),
    grade: computeGrade(disciplinaId),
  };
}
