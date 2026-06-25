import type { Subject } from "@/config/mock/subjects";
import { Icon } from "@/components/ui/Icon";

interface SubjectDetailHeaderProps {
  subject: Subject;
}

export function SubjectDetailHeader({ subject }: SubjectDetailHeaderProps) {
  return (
    <div className="card subject-detail-header">
      <div className="subject-detail-top">
        <div>
          <p className="page-header-eyebrow">{subject.code}</p>
          <h2 className="subject-detail-title">{subject.name}</h2>
        </div>
        <span
          className="subject-detail-accent"
          style={{ background: subject.color }}
          aria-hidden="true"
        />
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
    </div>
  );
}
