import { notFoundError, validationError } from "@/lib/api/errors";
import {
  mDeleteNota,
  mGetNotaById,
  mGetNotasByDisciplina,
  mGetSemestreAtualByCodigo,
  mInsertNota,
  mNotaNomeExists,
  mUpdateNotaFields,
  mUpdateNotaScore,
} from "@/lib/db/mutations/mutation-ports";
import type {
  PatchNotasBody,
  PatchNotasResponse,
} from "@/lib/types/disciplinas-api";
import { computeGradeFromNotas } from "./grade";
import { mapNotasToEvaluations } from "./mappers";
import { SUBJECT_DISPLAY_GRADE_MAX } from "@/lib/disciplinas/grade-display";
import { computeRemainingDistributionBudget } from "@/lib/disciplinas/grade-risk";

async function validateNotaScore(
  score: number | null | undefined,
  max: number,
  extra: boolean,
  disciplinaId: string,
  notaId?: number
): Promise<void> {
  if (score === null || score === undefined) return;
  if (score < 0) {
    throw validationError("Nota obtida não pode ser negativa.");
  }

  if (!extra && score > max) {
    throw validationError(`Nota obtida deve estar entre 0 e ${max}.`);
  }

  if (extra) {
    const notas = await mGetNotasByDisciplina(disciplinaId);
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

async function validateDistributionBudget(
  disciplinaId: string,
  newMax: number,
  isExtra: boolean,
  excludeNotaId?: number
): Promise<void> {
  if (isExtra) return;

  const notas = await mGetNotasByDisciplina(disciplinaId);
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

async function assertDisciplinaSemestre(code: string) {
  const semestre = await mGetSemestreAtualByCodigo(code);
  if (!semestre) {
    throw notFoundError("Disciplina não encontrada no semestre atual.");
  }
  return semestre;
}

async function assertNotaDisciplina(notaId: number, disciplinaId: string) {
  const nota = await mGetNotaById(notaId);
  if (
    !nota ||
    nota.disciplina_id.toLowerCase() !== disciplinaId.toLowerCase()
  ) {
    throw notFoundError("Avaliação não encontrada nesta disciplina.");
  }
  return nota;
}

async function addManualNota(
  disciplinaId: string,
  body: Extract<PatchNotasBody, { action: "add" }>
): Promise<void> {
  const nome = body.avaliacao_nome.trim();
  if (!nome) {
    throw validationError("Nome da avaliação é obrigatório.");
  }
  if (body.nota_maxima <= 0) {
    throw validationError("Nota máxima deve ser maior que zero.");
  }
  if (await mNotaNomeExists(disciplinaId, nome)) {
    throw validationError("Já existe uma avaliação com este nome.");
  }
  await validateDistributionBudget(
    disciplinaId,
    body.nota_maxima,
    body.nota_extra ?? false
  );
  await validateNotaScore(
    body.nota_obtida,
    body.nota_maxima,
    body.nota_extra ?? false,
    disciplinaId
  );

  await mInsertNota({
    disciplina_id: disciplinaId,
    avaliacao_nome: nome,
    nota_maxima: body.nota_maxima,
    nota_obtida: body.nota_obtida ?? null,
    manual: 1,
    nota_override: body.nota_obtida != null ? 1 : 0,
    nota_extra: body.nota_extra ? 1 : 0,
  });
}

async function updateNotaScoreEntry(
  disciplinaId: string,
  body: Extract<PatchNotasBody, { action: "update" }>
): Promise<void> {
  const nota = await assertNotaDisciplina(body.id, disciplinaId);
  const max = nota.nota_maxima ?? 0;
  const extra = nota.nota_extra === 1;
  await validateNotaScore(body.nota_obtida, max, extra, disciplinaId, body.id);

  const changes = await mUpdateNotaScore(body.id, body.nota_obtida);
  if (changes === 0) {
    throw validationError("Não foi possível atualizar a avaliação.");
  }
}

async function updateNotaEntry(
  disciplinaId: string,
  body: Extract<PatchNotasBody, { action: "update_manual" }>
): Promise<void> {
  const nota = await assertNotaDisciplina(body.id, disciplinaId);

  const nome = body.avaliacao_nome?.trim();
  if (body.avaliacao_nome !== undefined && !nome) {
    throw validationError("Nome da avaliação é obrigatório.");
  }
  if (nome && (await mNotaNomeExists(disciplinaId, nome, body.id))) {
    throw validationError("Já existe uma avaliação com este nome.");
  }
  if (body.nota_maxima !== undefined && body.nota_maxima <= 0) {
    throw validationError("Nota máxima deve ser maior que zero.");
  }

  const max = body.nota_maxima ?? nota.nota_maxima ?? 0;
  const extra =
    body.nota_extra !== undefined ? body.nota_extra : nota.nota_extra === 1;

  if (body.nota_maxima !== undefined) {
    await validateDistributionBudget(disciplinaId, body.nota_maxima, extra, body.id);
  }

  await validateNotaScore(body.nota_obtida, max, extra, disciplinaId, body.id);

  const changes = await mUpdateNotaFields(body.id, {
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

async function deleteNotaEntry(
  disciplinaId: string,
  body: Extract<PatchNotasBody, { action: "delete" }>
): Promise<void> {
  await assertNotaDisciplina(body.id, disciplinaId);

  const changes = await mDeleteNota(body.id);
  if (changes === 0) {
    throw validationError("Não foi possível excluir a avaliação.");
  }
}

export async function patchDisciplinaNotas(
  code: string,
  body: PatchNotasBody
): Promise<PatchNotasResponse> {
  const semestre = await assertDisciplinaSemestre(code);
  const disciplinaId = semestre.disciplina_id;

  switch (body.action) {
    case "add":
      await addManualNota(disciplinaId, body);
      break;
    case "update":
      await updateNotaScoreEntry(disciplinaId, body);
      break;
    case "update_manual":
      await updateNotaEntry(disciplinaId, body);
      break;
    case "delete":
      await deleteNotaEntry(disciplinaId, body);
      break;
  }

  const notas = await mGetNotasByDisciplina(disciplinaId);
  return {
    evaluations: mapNotasToEvaluations(notas),
    grade: computeGradeFromNotas(notas),
  };
}
