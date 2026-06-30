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
import { sanitizeSubjectRoom } from "@/lib/disciplinas/subject-room";
import {
  resolveSyncedProfessor,
  resolveSyncedSchedule,
  resolveSyncedWeeklyHours,
  sanitizeSubjectProfessor,
  sanitizeSubjectSchedule,
  sanitizeWeeklyHours,
} from "@/lib/disciplinas/subject-schedule-meta";
import type { PatchDisciplinaAppearanceBody } from "@/lib/types/disciplinas-api";

function equalsIgnoringAccent(a: string, b: string): boolean {
  return a.localeCompare(b, "pt-BR", { sensitivity: "accent" }) === 0;
}

export function patchDisciplinaAppearance(
  code: string,
  body: PatchDisciplinaAppearanceBody
) {
  const semestre = getSemestreAtualByCodigo(code);
  if (!semestre) {
    throw notFoundError("Disciplina não encontrada no semestre atual.");
  }

  const updates: Parameters<typeof updateSemestreAtualAppearance>[1] = {};

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
      updates.nome_exibicao = equalsIgnoringAccent(nome, semestre.nome) ? null : nome;
    }
  }

  if (body.sala !== undefined) {
    if (body.sala === null || body.sala === "") {
      updates.local_exibicao = null;
    } else {
      const sala = sanitizeSubjectRoom(body.sala);
      if (!sala) {
        throw validationError("Sala inválida.");
      }
      const synced = semestre.local?.trim() ?? "";
      updates.local_exibicao = equalsIgnoringAccent(sala, synced) ? null : sala;
    }
  }

  if (body.horario !== undefined) {
    if (body.horario === null || body.horario === "") {
      updates.horario_exibicao = null;
    } else {
      const horario = sanitizeSubjectSchedule(body.horario);
      if (!horario) {
        throw validationError("Horário inválido.");
      }
      const synced = resolveSyncedSchedule(semestre) ?? "";
      updates.horario_exibicao = equalsIgnoringAccent(horario, synced) ? null : horario;
    }
  }

  if (body.professor !== undefined) {
    if (body.professor === null || body.professor === "") {
      updates.professor_exibicao = null;
    } else {
      const professor = sanitizeSubjectProfessor(body.professor);
      if (!professor) {
        throw validationError("Professor inválido.");
      }
      const synced = resolveSyncedProfessor(semestre) ?? "";
      updates.professor_exibicao = equalsIgnoringAccent(professor, synced)
        ? null
        : professor;
    }
  }

  if (body.horasSemanais !== undefined) {
    if (body.horasSemanais === null) {
      updates.horas_semanais_exibicao = null;
    } else {
      const horas = sanitizeWeeklyHours(body.horasSemanais);
      if (!horas) {
        throw validationError("Horas semanais inválidas.");
      }
      const synced = resolveSyncedWeeklyHours(semestre);
      updates.horas_semanais_exibicao = synced === horas ? null : horas;
    }
  }

  if (Object.keys(updates).length === 0) {
    throw validationError(
      "Informe cor, apelido, nome, sala, horário, professor ou horas semanais."
    );
  }

  const changes = updateSemestreAtualAppearance(semestre.disciplina_id, updates);
  if (changes === 0) {
    throw validationError("Não foi possível atualizar a aparência da disciplina.");
  }

  return {
    code: semestre.disciplina_id,
    ...(updates.cor !== undefined ? { color: updates.cor } : {}),
    ...(updates.apelido !== undefined ? { apelido: updates.apelido } : {}),
    ...(updates.nome_exibicao !== undefined ? { nome: updates.nome_exibicao } : {}),
    ...(updates.local_exibicao !== undefined ? { sala: updates.local_exibicao } : {}),
    ...(updates.horario_exibicao !== undefined
      ? { horario: updates.horario_exibicao }
      : {}),
    ...(updates.professor_exibicao !== undefined
      ? { professor: updates.professor_exibicao }
      : {}),
    ...(updates.horas_semanais_exibicao !== undefined
      ? { horasSemanais: updates.horas_semanais_exibicao }
      : {}),
  };
}
