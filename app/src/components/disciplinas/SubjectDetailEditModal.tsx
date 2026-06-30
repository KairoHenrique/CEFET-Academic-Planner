"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import {
  SUBJECT_DISPLAY_NAME_MAX_LENGTH,
  SUBJECT_NICKNAME_MAX_LENGTH,
  suggestSubjectNickname,
} from "@/lib/disciplinas/subject-display-name";
import { SUBJECT_ROOM_MAX_LENGTH } from "@/lib/disciplinas/subject-room";
import {
  SUBJECT_PROFESSOR_MAX_LENGTH,
  SUBJECT_SCHEDULE_MAX_LENGTH,
  SUBJECT_WEEKLY_HOURS_MAX,
} from "@/lib/disciplinas/subject-schedule-meta";
import type { Subject } from "@/lib/types/subject";

export interface SubjectDetailEditPayload {
  nome: string | null;
  apelido: string | null;
  sala: string | null;
  horario: string | null;
  professor: string | null;
  horasSemanais: number | null;
}

interface SubjectDetailEditModalProps {
  open: boolean;
  onClose: () => void;
  subject: Pick<
    Subject,
    | "officialName"
    | "name"
    | "code"
    | "nickname"
    | "room"
    | "syncedRoom"
    | "schedule"
    | "syncedSchedule"
    | "professor"
    | "syncedProfessor"
    | "ch"
    | "syncedWeeklyHours"
  >;
  isSaving?: boolean;
  onSave: (payload: SubjectDetailEditPayload) => void;
}

function equalsPt(a: string, b: string): boolean {
  return a.localeCompare(b, "pt-BR", { sensitivity: "accent" }) === 0;
}

export function SubjectDetailEditModal({
  open,
  onClose,
  subject,
  isSaving = false,
  onSave,
}: SubjectDetailEditModalProps) {
  const suggestion = suggestSubjectNickname(subject.officialName, subject.code);
  const portalRoom = subject.syncedRoom ?? subject.room;
  const portalSchedule = subject.syncedSchedule ?? subject.schedule ?? "";
  const portalProfessor = subject.syncedProfessor ?? subject.professor ?? "";
  const portalHours =
    subject.syncedWeeklyHours ?? subject.ch ?? null;

  const [nameValue, setNameValue] = useState(subject.name);
  const [nicknameValue, setNicknameValue] = useState(subject.nickname ?? suggestion);
  const [roomValue, setRoomValue] = useState(subject.room);
  const [scheduleValue, setScheduleValue] = useState(subject.schedule ?? "");
  const [professorValue, setProfessorValue] = useState(subject.professor ?? "");
  const [hoursValue, setHoursValue] = useState(
    subject.ch != null ? String(subject.ch) : ""
  );

  useEffect(() => {
    if (!open) return;
    setNameValue(subject.name);
    setNicknameValue(subject.nickname ?? suggestion);
    setRoomValue(subject.room);
    setScheduleValue(subject.schedule ?? "");
    setProfessorValue(subject.professor ?? "");
    setHoursValue(subject.ch != null ? String(subject.ch) : "");
  }, [open, subject, suggestion]);

  const handleSave = () => {
    const trimmedName = nameValue.trim();
    const trimmedNickname = nicknameValue.trim();
    const trimmedRoom = roomValue.trim();
    const trimmedSchedule = scheduleValue.trim();
    const trimmedProfessor = professorValue.trim();
    const parsedHours = hoursValue.trim() ? Number.parseInt(hoursValue, 10) : null;

    onSave({
      nome: equalsPt(trimmedName, subject.officialName) ? null : trimmedName || null,
      apelido: trimmedNickname || null,
      sala: equalsPt(trimmedRoom, portalRoom) ? null : trimmedRoom || null,
      horario: equalsPt(trimmedSchedule, portalSchedule) ? null : trimmedSchedule || null,
      professor: equalsPt(trimmedProfessor, portalProfessor)
        ? null
        : trimmedProfessor || null,
      horasSemanais:
        parsedHours != null && portalHours != null && parsedHours === portalHours
          ? null
          : parsedHours,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar disciplina">
      <div className="modal-form-stack">
        <Input
          label="Nome da matéria"
          value={nameValue}
          onChange={(event) => setNameValue(event.target.value)}
          maxLength={SUBJECT_DISPLAY_NAME_MAX_LENGTH}
          disabled={isSaving}
          hint={
            !equalsPt(subject.officialName, nameValue)
              ? `Nome no SIGAA: ${subject.officialName}`
              : "Como aparece no topo da página da disciplina."
          }
        />
        <Input
          label="Apelido"
          value={nicknameValue}
          onChange={(event) => setNicknameValue(event.target.value)}
          maxLength={SUBJECT_NICKNAME_MAX_LENGTH}
          disabled={isSaving}
          hint={`Até ${SUBJECT_NICKNAME_MAX_LENGTH} caracteres. Usado na grade e no calendário.`}
        />
        <Input
          label="Sala"
          value={roomValue}
          onChange={(event) => setRoomValue(event.target.value)}
          maxLength={SUBJECT_ROOM_MAX_LENGTH}
          disabled={isSaving}
          hint={
            subject.syncedRoom && !equalsPt(roomValue, subject.syncedRoom)
              ? `Sala no portal: ${subject.syncedRoom}`
              : "Como aparece no horário do SIGAA."
          }
        />
        <Input
          label="Horário"
          value={scheduleValue}
          onChange={(event) => setScheduleValue(event.target.value)}
          maxLength={SUBJECT_SCHEDULE_MAX_LENGTH}
          disabled={isSaving}
          hint={
            subject.syncedSchedule && !equalsPt(scheduleValue, subject.syncedSchedule)
              ? `Horário no portal: ${subject.syncedSchedule}`
              : "Dias e horários das aulas neste semestre."
          }
        />
        <Input
          label="Horas semanais"
          value={hoursValue}
          onChange={(event) => setHoursValue(event.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          maxLength={2}
          disabled={isSaving}
          hint={
            subject.syncedWeeklyHours != null &&
            hoursValue &&
            Number.parseInt(hoursValue, 10) !== subject.syncedWeeklyHours
              ? `Calculado pelo horário: ${subject.syncedWeeklyHours}h/sem`
              : "Derivado dos blocos do horário SIGAA (2h por aula)."
          }
        />
        <Input
          label="Professor(a)"
          value={professorValue}
          onChange={(event) => setProfessorValue(event.target.value)}
          maxLength={SUBJECT_PROFESSOR_MAX_LENGTH}
          disabled={isSaving}
          hint={
            subject.syncedProfessor && !equalsPt(professorValue, subject.syncedProfessor)
              ? `No portal: ${subject.syncedProfessor}`
              : "Docente da turma, se disponível no sync."
          }
        />
      </div>
      <div className="modal-form-actions subject-edit-actions">
        <button
          type="button"
          className="btn-gold"
          onClick={handleSave}
          disabled={isSaving || !nameValue.trim()}
        >
          {isSaving ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={() => setNicknameValue(suggestion)}
          disabled={isSaving}
        >
          Restaurar apelido
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={() => {
            setRoomValue(portalRoom === "—" ? "" : portalRoom);
            setScheduleValue(portalSchedule);
            setProfessorValue(portalProfessor);
            setHoursValue(portalHours != null ? String(portalHours) : "");
          }}
          disabled={isSaving}
        >
          Restaurar portal
        </button>
        <button type="button" className="btn-outline" onClick={onClose} disabled={isSaving}>
          Cancelar
        </button>
      </div>
    </Modal>
  );
}
