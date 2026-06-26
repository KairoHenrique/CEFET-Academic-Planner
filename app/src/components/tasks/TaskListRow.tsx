"use client";

import type { AcademicTask } from "@/lib/types/task";
import type { PriorityLevel } from "@/lib/types/priority";
import { PrioritySelect } from "@/components/ui/PrioritySelect";
import { Icon } from "@/components/ui/Icon";
import { formatTaskDueLabel } from "@/lib/tasks/dates";

export interface TaskListRowProps {
  task: AcademicTask;
  priority: PriorityLevel;
  onSetPriority: (level: PriorityLevel) => void;
  onToggle: (id: number) => void;
  onOpen: (task: AcademicTask) => void;
  onEdit?: (task: AcademicTask) => void;
  showSubject?: boolean;
  faded?: boolean;
  disabled?: boolean;
}

export function TaskListRow({
  task,
  priority,
  onSetPriority,
  onToggle,
  onOpen,
  onEdit,
  showSubject = false,
  faded,
  disabled,
}: TaskListRowProps) {
  return (
    <div className={`task-item ${faded ? "completed-section" : ""}`}>
      <PrioritySelect
        className="task-priority-select"
        level={priority}
        compact
        onChange={onSetPriority}
      />

      <button
        type="button"
        className={`task-checkbox ${task.done ? "checked" : ""}`}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        aria-label={`${task.done ? "Desmarcar" : "Marcar"} ${task.title}`}
      >
        {task.done && <Icon name="check" size={11} />}
      </button>

      <button
        type="button"
        className="task-open-btn"
        onClick={() => onOpen(task)}
        aria-label={`Ver detalhes de ${task.title}`}
      >
        <div className="task-info">
          <div className="task-meta-row">
            <span className={`task-title ${task.done ? "completed" : ""}`}>
              {task.title}
            </span>
            <span className="badge info task-type-badge">
              {task.type === "grupo" ? "Grupo" : "Individual"}
            </span>
          </div>
          {showSubject && (
            <div className="task-subtitle">
              <span
                className="subject-dot"
                style={{ background: task.subjectColor }}
              />
              {task.subject}
            </div>
          )}
        </div>
        <div className="task-date">
          <Icon name="calendar" size={12} />
          {formatTaskDueLabel(task.date, task.dueTime)}
          <Icon name="chevron-right" size={14} className="task-chevron" />
        </div>
      </button>

      {onEdit && (
        <button
          type="button"
          className="task-edit-btn"
          onClick={() => onEdit(task)}
          aria-label={`Editar ${task.title}`}
          disabled={disabled}
        >
          Editar
        </button>
      )}
    </div>
  );
}
