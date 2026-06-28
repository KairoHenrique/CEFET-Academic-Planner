import { notFoundError, validationError } from "@/lib/api/errors";
import {
  deleteNota,
  getNotaById,
  getNotasByDisciplina,
  getSemestreAtualByCodigo,
  notaNomeExists,
  saveNota,
  updateNotaFields,
  updateNotaScore,
} from "@/lib/db/queries";
import type {
  PatchNotasBody,
  PatchNotasResponse,
} from "@/lib/types/disciplinas-api";
import { computeGrade } from "./grade";
import { mapNotasToEvaluations } from "./mappers";
import { SUBJECT_DISPLAY_GRADE_MAX } from "@/lib/disciplinas/grade-display";
import { computeRemainingDistributionBudget } from "@/lib/disciplinas/grade-risk";

function validateNotaScore(
  score: number | null | undefined,
  max: number,
  extra: boolean,
  disciplinaId: string,
  notaId?: number
): void {
  if (score === null || score === undefined) return;
  if (score < 0) {
    throw validationError("Nota obtida não pode ser negativa.");
  }

  if (!extra && score > max) {
    throw validationError(`Nota obtida deve estar entre 0 e ${max}.`);
  }

  if (extra) {
    const notas = getNotasByDisciplina(disciplinaId);
    const othersTotal = notas
      .filter((nota) => nota.id !== notaId)
      .reduce((acc, nota) => acc + (nota.nota_obtida ?? 0), 0);

    if (othersTotal + score > SUBJECT_DISPLAY_GRADE_MAX) {
      const remaining = Math.max(0, SUBJECT_DISPLAY_GRADE_MAX - othersTotal);
      throw validationError(
        `Nota extra não pode ultrapassar ${remaining} pts (total máximo ${SUBJECT_DISPLAY_GRADE_MAX}).`
      );
    }
  }
}

function validateDistributionBudget(
  disciplinaId: string,
  newMax: number,
  isExtra: boolean,
  excludeNotaId?: number
): void {
  if (isExtra) return;

  const notas = getNotasByDisciplina(disciplinaId);
  const evaluations = mapNotasToEvaluations(notas);
  const budget = computeRemainingDistributionBudget(evaluations, SUBJECT_DISPLAY_GRADE_MAX, {
    excludeEvaluationId: excludeNotaId,
  });

  if (newMax > budget) {
    throw validationError(
      budget <= 0
        ? "Não há pontos disponíveis para distribuir nesta matéria."
        : `Só restam ${budget} pts para distribuir nesta matéria.`
    );
  }
}

function assertDisciplinaSemestre(code: string) {
  const semestre = getSemestreAtualByCodigo(code);
  if (!semestre) {
    throw notFoundError("Disciplina não encontrada no semestre atual.");
  }
  return semestre;
}

function assertNotaDisciplina(notaId: number, disciplinaId: string) {
  const nota = getNotaById(notaId);
  if (
    !nota ||
    nota.disciplina_id.toLowerCase() !== disciplinaId.toLowerCase()
  ) {
    throw notFoundError("Avaliação não encontrada nesta disciplina.");
  }
  return nota;
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
  validateDistributionBudget(
    disciplinaId,
    body.nota_maxima,
    body.nota_extra ?? false
  );
  validateNotaScore(
    body.nota_obtida,
    body.nota_maxima,
    body.nota_extra ?? false,
    disciplinaId
  );

  saveNota({
    disciplina_id: disciplinaId,
    avaliacao_nome: nome,
    nota_maxima: body.nota_maxima,
    nota_obtida: body.nota_obtida ?? null,
    manual: 1,
    nota_override: body.nota_obtida != null ? 1 : 0,
    nota_extra: body.nota_extra ? 1 : 0,
  });
}

function updateNotaScoreEntry(
  disciplinaId: string,
  body: Extract<PatchNotasBody, { action: "update" }>
): void {
  const nota = assertNotaDisciplina(body.id, disciplinaId);
  const max = nota.nota_maxima ?? 0;
  const extra = nota.nota_extra === 1;
  validateNotaScore(body.nota_obtida, max, extra, disciplinaId, body.id);

  const changes = updateNotaScore(body.id, body.nota_obtida);
  if (changes === 0) {
    throw validationError("Não foi possível atualizar a avaliação.");
  }
}

function updateNotaEntry(
  disciplinaId: string,
  body: Extract<PatchNotasBody, { action: "update_manual" }>
): void {
  const nota = assertNotaDisciplina(body.id, disciplinaId);

  const nome = body.avaliacao_nome?.trim();
  if (body.avaliacao_nome !== undefined && !nome) {
    throw validationError("Nome da avaliação é obrigatório.");
  }
  if (nome && notaNomeExists(disciplinaId, nome, body.id)) {
    throw validationError("Já existe uma avaliação com este nome.");
  }
  if (body.nota_maxima !== undefined && body.nota_maxima <= 0) {
    throw validationError("Nota máxima deve ser maior que zero.");
  }

  const max = body.nota_maxima ?? nota.nota_maxima ?? 0;
  const extra =
    body.nota_extra !== undefined ? body.nota_extra : nota.nota_extra === 1;

  if (body.nota_maxima !== undefined) {
    validateDistributionBudget(disciplinaId, body.nota_maxima, extra, body.id);
  }

  validateNotaScore(body.nota_obtida, max, extra, disciplinaId, body.id);

  const changes = updateNotaFields(body.id, {
    avaliacao_nome: nome,
    nota_maxima: body.nota_maxima,
    nota_obtida: body.nota_obtida,
    nota_override: body.nota_obtida !== undefined ? 1 : undefined,
    nota_extra:
      body.nota_extra === undefined ? undefined : body.nota_extra ? 1 : 0,
    manual: 1,
  });
  if (changes === 0) {
    throw validationError("Nenhuma alteração informada.");
  }
}

function deleteNotaEntry(
  disciplinaId: string,
  body: Extract<PatchNotasBody, { action: "delete" }>
): void {
  assertNotaDisciplina(body.id, disciplinaId);

  const changes = deleteNota(body.id);
  if (changes === 0) {
    throw validationError("Não foi possível excluir a avaliação.");
  }
}

export function patchDisciplinaNotas(
  code: string,
  body: PatchNotasBody
): PatchNotasResponse {
  const semestre = assertDisciplinaSemestre(code);
  const disciplinaId = semestre.disciplina_id;

  switch (body.action) {
    case "add":
      addManualNota(disciplinaId, body);
      break;
    case "update":
      updateNotaScoreEntry(disciplinaId, body);
      break;
    case "update_manual":
      updateNotaEntry(disciplinaId, body);
      break;
    case "delete":
      deleteNotaEntry(disciplinaId, body);
      break;
  }

  const notas = getNotasByDisciplina(disciplinaId);
  return {
    evaluations: mapNotasToEvaluations(notas),
    grade: computeGrade(disciplinaId),
  };
}
