"use client";

import { useState } from "react";
import type { Subject } from "@/lib/types/subject";
import type { DisciplinaGrupoDto } from "@/lib/types/disciplinas-api";
import { Icon } from "@/components/ui/Icon";
import { PrioritySelect } from "@/components/ui/PrioritySelect";
import { ColorDotPicker } from "@/components/ui/ColorDotPicker";
import { PageTutorialHelpButton } from "@/components/tutorial/PageTutorialHelpButton";
import { SubjectDetailEditModal } from "@/components/disciplinas/SubjectDetailEditModal";
import { SubjectGroupModal } from "@/components/disciplinas/SubjectGroupModal";
import { useSubjectPriorities } from "@/hooks/useStoredPriorities";
import { useSubjectAppearance } from "@/hooks/useSubjectAppearance";

interface SubjectDetailHeaderProps {
  subject: Subject;
  grupo?: DisciplinaGrupoDto;
}

function MetaPortalHint({ label, value }: { label: string; value: string }) {
  return (
    <span className="subject-meta-item subject-meta-item--portal">
      <Icon name="sync" size={14} />
      {label}: {value}
    </span>
  );
}

export function SubjectDetailHeader({ subject, grupo }: SubjectDetailHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const members = grupo?.membros ?? [];
  const hasGrupo = members.length > 0;
  const { getPriority, setSubjectPriority } = useSubjectPriorities();
  const { updateColor, updateDisplay, isSaving } = useSubjectAppearance(
    subject.code,
    { color: subject.color, nickname: subject.nickname }
  );

  const scheduleLabel = subject.schedule?.trim() || "—";
  const hoursLabel = subject.ch != null ? `${subject.ch}h/sem` : "—";
  const professorLabel = subject.professor?.trim() || "—";

  return (
    <div className="card subject-detail-header">
      <div className="subject-detail-top">
        <div className="subject-detail-head">
          <p className="page-header-eyebrow">{subject.shortLabel}</p>
          <h2 className="subject-detail-title">{subject.name}</h2>
        </div>
        <div className="subject-detail-top-aside">
          {hasGrupo ? (
            <button
              type="button"
              className="btn-outline subject-group-trigger"
              onClick={() => setGroupOpen(true)}
              aria-label={`Ver grupo com ${members.length} integrante${members.length === 1 ? "" : "s"}`}
            >
              <Icon name="users" size={16} />
              Ver grupo
              <span className="subject-group-count" aria-hidden="true">
                {members.length}
              </span>
            </button>
          ) : null}
          <PageTutorialHelpButton
            tutorialId="disciplina-detail"
            label="Como usar esta disciplina"
          />
        </div>
        <div
          className="subject-detail-actions"
          data-tutorial-id="tutorial-discipline-properties"
        >
          <button
            type="button"
            className="subject-nickname-trigger"
            onClick={() => setEditOpen(true)}
            disabled={isSaving}
            aria-label="Editar informações da disciplina"
            title="Editar disciplina"
          >
            <Icon name="edit" size={16} />
          </button>
          <ColorDotPicker
            value={subject.color}
            onChange={updateColor}
            disabled={isSaving}
            ariaLabel={
              isSaving ? "Cor da matéria (salvando…)" : "Alterar cor da matéria"
            }
            modalTitle="Cor da matéria"
            pickerLabel="Escolha uma cor"
            size="md"
          />
          <PrioritySelect
            level={getPriority(subject.code)}
            onChange={(level) => setSubjectPriority(subject.code, level)}
          />
        </div>
      </div>

      <div className="subject-detail-meta">
        <span className="subject-meta-item">
          <Icon name="building" size={14} />
          Sala {subject.room}
        </span>
        {subject.syncedRoom &&
          subject.syncedRoom.localeCompare(subject.room, "pt-BR", {
            sensitivity: "accent",
          }) !== 0 && <MetaPortalHint label="Portal" value={subject.syncedRoom} />}
        <span className="subject-meta-item">
          <Icon name="calendar" size={14} />
          {scheduleLabel}
        </span>
        {subject.syncedSchedule &&
          subject.schedule &&
          subject.syncedSchedule.localeCompare(subject.schedule, "pt-BR", {
            sensitivity: "accent",
          }) !== 0 && (
            <MetaPortalHint label="Horário portal" value={subject.syncedSchedule} />
          )}
        <span className="subject-meta-item">
          <Icon name="books" size={14} />
          {hoursLabel}
          {professorLabel !== "—" ? ` · ${professorLabel}` : ""}
        </span>
        {subject.syncedProfessor &&
          subject.professor &&
          subject.syncedProfessor.localeCompare(subject.professor, "pt-BR", {
            sensitivity: "accent",
          }) !== 0 && (
            <MetaPortalHint label="Professor portal" value={subject.syncedProfessor} />
          )}
      </div>

      <SubjectDetailEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        subject={subject}
        isSaving={isSaving}
        onSave={(payload) => updateDisplay(payload)}
      />
      {hasGrupo ? (
        <SubjectGroupModal
          open={groupOpen}
          onClose={() => setGroupOpen(false)}
          groupName={grupo?.nome ?? null}
          members={members}
        />
      ) : null}
    </div>
  );
}
