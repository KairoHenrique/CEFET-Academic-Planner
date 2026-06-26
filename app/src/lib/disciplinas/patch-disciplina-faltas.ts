import { notFoundError, validationError } from "@/lib/api/errors";
import {
  countFaltasByDisciplina,
  getFaltaById,
  getFaltasByDisciplina,
  getSemestreAtualByCodigo,
  updateFaltaStatus,
} from "@/lib/db/queries";
import type {
  PatchFaltaBody,
  PatchFaltaResponse,
} from "@/lib/types/disciplinas-api";
import { buildAttendanceSummary } from "./attendance";

const VALID_STATUS = new Set(["presente", "falta", "nao_registrada"]);

export function patchDisciplinaFalta(
  code: string,
  body: PatchFaltaBody
): PatchFaltaResponse {
  const semestre = getSemestreAtualByCodigo(code);
  if (!semestre) {
    throw notFoundError("Disciplina não encontrada no semestre atual.");
  }

  const disciplinaId = semestre.disciplina_id;
  const falta = getFaltaById(body.id);

  if (
    !falta ||
    falta.disciplina_id.toLowerCase() !== disciplinaId.toLowerCase()
  ) {
    throw notFoundError("Registro de frequência não encontrado.");
  }

  if (!VALID_STATUS.has(body.status)) {
    throw validationError("Status de frequência inválido.");
  }

  const changes = updateFaltaStatus(body.id, body.status);
  if (changes === 0) {
    throw validationError("Não foi possível atualizar a frequência.");
  }

  const faltas = getFaltasByDisciplina(disciplinaId);
  const maxAbsences = semestre.max_faltas ?? 15;
  const attendance = buildAttendanceSummary(faltas, maxAbsences);

  return {
    attendance,
    absences: countFaltasByDisciplina(disciplinaId),
  };
}
