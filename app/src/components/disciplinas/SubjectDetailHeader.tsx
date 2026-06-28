"use client";

import type { Subject } from "@/lib/types/subject";
import { Icon } from "@/components/ui/Icon";
import { PrioritySelect } from "@/components/ui/PrioritySelect";
import { ColorPickerField } from "@/components/ui/ColorPickerField";
import { useSubjectPriorities } from "@/hooks/useStoredPriorities";
import { useSubjectColor } from "@/hooks/useSubjectColor";

interface SubjectDetailHeaderProps {
  subject: Subject;
}

export function SubjectDetailHeader({ subject }: SubjectDetailHeaderProps) {
  const { getPriority, setSubjectPriority } = useSubjectPriorities();
  const { updateColor, isSaving } = useSubjectColor(subject.code, subject.color);

  return (
    <div className="card subject-detail-header">
      <div className="subject-detail-top">
        <div>
          <p className="page-header-eyebrow">{subject.code}</p>
          <h2 className="subject-detail-title">{subject.name}</h2>
        </div>
        <div className="subject-detail-actions">
          <PrioritySelect
            level={getPriority(subject.code)}
            onChange={(level) => setSubjectPriority(subject.code, level)}
          />
        </div>
      </div>
      <ColorPickerField
        label={isSaving ? "Cor da matéria (salvando…)" : "Cor da matéria"}
        value={subject.color}
        onChange={updateColor}
        compact
        disabled={isSaving}
      />
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
    </div>
  );
}
