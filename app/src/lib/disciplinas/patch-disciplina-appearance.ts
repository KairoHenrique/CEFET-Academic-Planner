import { notFoundError, validationError } from "@/lib/api/errors";
import { normalizeHexColor } from "@/lib/colors/palette";
import {
  getSemestreAtualByCodigo,
  updateSemestreAtualColor,
} from "@/lib/db/queries";
import type { PatchDisciplinaAppearanceBody } from "@/lib/types/disciplinas-api";

export function patchDisciplinaAppearance(
  code: string,
  body: PatchDisciplinaAppearanceBody
): { code: string; color: string } {
  const semestre = getSemestreAtualByCodigo(code);
  if (!semestre) {
    throw notFoundError("Disciplina não encontrada no semestre atual.");
  }

  const color = normalizeHexColor(body.color);
  if (!color) {
    throw validationError("Cor inválida. Use formato #RRGGBB.");
  }

  const changes = updateSemestreAtualColor(semestre.disciplina_id, color);
  if (changes === 0) {
    throw validationError("Não foi possível atualizar a cor.");
  }

  return { code: semestre.disciplina_id, color };
}
