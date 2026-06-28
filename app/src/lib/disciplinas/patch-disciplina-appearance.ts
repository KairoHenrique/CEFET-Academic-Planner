import { notFoundError, validationError } from "@/lib/api/errors";
import { normalizeHexColor } from "@/lib/colors/palette";
import {
  getSemestreAtualByCodigo,
  updateSemestreAtualAppearance,
} from "@/lib/db/queries";
import {
  sanitizeSubjectDisplayName,
  sanitizeSubjectNickname,
} from "@/lib/disciplinas/subject-display-name";
import type { PatchDisciplinaAppearanceBody } from "@/lib/types/disciplinas-api";

export function patchDisciplinaAppearance(
  code: string,
  body: PatchDisciplinaAppearanceBody
): {
  code: string;
  color?: string;
  apelido?: string | null;
  nome?: string | null;
} {
  const semestre = getSemestreAtualByCodigo(code);
  if (!semestre) {
    throw notFoundError("Disciplina não encontrada no semestre atual.");
  }

  const updates: {
    cor?: string;
    apelido?: string | null;
    nome_exibicao?: string | null;
  } = {};

  if (body.color !== undefined) {
    const color = normalizeHexColor(body.color);
    if (!color) {
      throw validationError("Cor inválida. Use formato #RRGGBB.");
    }
    updates.cor = color;
  }

  if (body.apelido !== undefined) {
    if (body.apelido === null || body.apelido === "") {
      updates.apelido = null;
    } else {
      const apelido = sanitizeSubjectNickname(body.apelido);
      if (!apelido) {
        throw validationError("Apelido inválido.");
      }
      updates.apelido = apelido;
    }
  }

  if (body.nome !== undefined) {
    if (body.nome === null || body.nome === "") {
      updates.nome_exibicao = null;
    } else {
      const nome = sanitizeSubjectDisplayName(body.nome);
      if (!nome) {
        throw validationError("Nome da matéria inválido.");
      }
      updates.nome_exibicao =
        nome.localeCompare(semestre.nome, "pt-BR", { sensitivity: "accent" }) ===
        0
          ? null
          : nome;
    }
  }

  if (Object.keys(updates).length === 0) {
    throw validationError("Informe cor, apelido ou nome para atualizar.");
  }

  const changes = updateSemestreAtualAppearance(semestre.disciplina_id, updates);
  if (changes === 0) {
    throw validationError("Não foi possível atualizar a aparência da disciplina.");
  }

  return {
    code: semestre.disciplina_id,
    ...(updates.cor !== undefined ? { color: updates.cor } : {}),
    ...(updates.apelido !== undefined ? { apelido: updates.apelido } : {}),
    ...(updates.nome_exibicao !== undefined
      ? { nome: updates.nome_exibicao }
      : {}),
  };
}
