"use client";

import { useState } from "react";
import type { Subject } from "@/lib/types/subject";
import { Icon } from "@/components/ui/Icon";
import { PrioritySelect } from "@/components/ui/PrioritySelect";
import { ColorDotPicker } from "@/components/ui/ColorDotPicker";
import { SubjectNicknameModal } from "@/components/disciplinas/SubjectNicknameModal";
import { useSubjectPriorities } from "@/hooks/useStoredPriorities";
import { useSubjectAppearance } from "@/hooks/useSubjectAppearance";

interface SubjectDetailHeaderProps {
  subject: Subject;
}

export function SubjectDetailHeader({ subject }: SubjectDetailHeaderProps) {
  const [nicknameOpen, setNicknameOpen] = useState(false);
  const { getPriority, setSubjectPriority } = useSubjectPriorities();
  const { updateColor, updateDisplay, isSaving } = useSubjectAppearance(
    subject.code,
    { color: subject.color, nickname: subject.nickname }
  );

  return (
    <div className="card subject-detail-header">
      <div className="subject-detail-top">
        <div>
          <p className="page-header-eyebrow">{subject.shortLabel}</p>
          <h2 className="subject-detail-title">{subject.name}</h2>
        </div>
        <div className="subject-detail-actions">
          <button
            type="button"
            className="subject-nickname-trigger"
            onClick={() => setNicknameOpen(true)}
            disabled={isSaving}
            aria-label="Editar nome e apelido da matéria"
            title="Editar nome e apelido"
          >
            <Icon name="edit" size={16} />
          </button>
          <ColorDotPicker
            value={subject.color}
            onChange={updateColor}
            disabled={isSaving}
            ariaLabel={
              isSaving
                ? "Cor da matéria (salvando…)"
                : "Alterar cor da matéria"
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
        <span className="subject-meta-item">
          <Icon name="calendar" size={14} />
          {subject.schedule}
        </span>
        <span className="subject-meta-item">
          <Icon name="books" size={14} />
          {subject.ch}h · {subject.professor}
        </span>
      </div>

      <SubjectNicknameModal
        open={nicknameOpen}
        onClose={() => setNicknameOpen(false)}
        officialName={subject.officialName}
        displayName={subject.name}
        code={subject.code}
        nickname={subject.nickname}
        isSaving={isSaving}
        onSave={(payload) => updateDisplay(payload)}
      />
    </div>
  );
}
