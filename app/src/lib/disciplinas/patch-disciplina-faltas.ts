import { notFoundError, validationError } from "@/lib/api/errors";
import {
  mGetFaltaById,
  mGetFaltasByDisciplina,
  mGetSemestreAtualByCodigo,
  mUpdateFaltaStatus,
} from "@/lib/db/mutations/mutation-ports";
import { countFaltasFromRows } from "@/lib/disciplinas/build-subject-source";
import type {
  PatchFaltaBody,
  PatchFaltaResponse,
} from "@/lib/types/disciplinas-api";
import { buildAttendanceSummary } from "./attendance";

const VALID_STATUS = new Set(["presente", "falta", "nao_registrada"]);

export async function patchDisciplinaFalta(
  code: string,
  body: PatchFaltaBody
): Promise<PatchFaltaResponse> {
  const semestre = await mGetSemestreAtualByCodigo(code);
  if (!semestre) {
    throw notFoundError("Disciplina não encontrada no semestre atual.");
  }

  const disciplinaId = semestre.disciplina_id;
  const falta = await mGetFaltaById(body.id);

  if (
    !falta ||
    falta.disciplina_id.toLowerCase() !== disciplinaId.toLowerCase()
  ) {
    throw notFoundError("Registro de frequência não encontrado.");
  }

  if (!VALID_STATUS.has(body.status)) {
    throw validationError("Status de frequência inválido.");
  }

  const changes = await mUpdateFaltaStatus(body.id, body.status);
  if (changes === 0) {
    throw validationError("Não foi possível atualizar a frequência.");
  }

  const faltas = await mGetFaltasByDisciplina(disciplinaId);
  const maxAbsences = semestre.max_faltas ?? 15;
  const attendance = buildAttendanceSummary(faltas, maxAbsences);

  return {
    attendance,
    absences: countFaltasFromRows(faltas),
  };
}
