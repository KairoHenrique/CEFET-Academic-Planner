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
  validateNotaScore(body.nota_obtida, body.nota_maxima);

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
  validateNotaScore(body.nota_obtida, max);

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
  validateNotaScore(body.nota_obtida, max);

  const changes = updateNotaFields(body.id, {
    avaliacao_nome: nome,
    nota_maxima: body.nota_maxima,
    nota_obtida: body.nota_obtida,
    nota_override: body.nota_obtida !== undefined ? 1 : undefined,
    nota_extra:
      body.nota_extra === undefined ? undefined : body.nota_extra ? 1 : 0,
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
