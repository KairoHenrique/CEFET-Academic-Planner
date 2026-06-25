"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { TaskDetailContent } from "@/components/ui/ActivityDetail";
import {
  getTasksBySubjectCode,
  type AcademicTask,
} from "@/config/mock/tasks";

interface SubjectTasksPanelProps {
  subjectCode: string;
}

export function SubjectTasksPanel({ subjectCode }: SubjectTasksPanelProps) {
  const tasks = getTasksBySubjectCode(subjectCode);
  const [selectedTask, setSelectedTask] = useState<AcademicTask | null>(null);

  const selectedFromState =
    selectedTask && tasks.find((task) => task.id === selectedTask.id);

  if (tasks.length === 0) {
    return (
      <div className="card">
        <SectionHeader title="Tarefas e Atividades" icon="clipboard" />
        <p className="panel-footer-note">Nenhuma tarefa cadastrada nesta disciplina.</p>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <SectionHeader title="Tarefas e Atividades" icon="clipboard" />
        <ul className="event-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                className="event-list-item event-list-btn"
                onClick={() => setSelectedTask(task)}
              >
                <span className="section-header-icon" aria-hidden="true">
                  <Icon name="clipboard" size={14} />
                </span>
                <div>
                  <p className="event-title">{task.title}</p>
                  <p className="event-meta">{task.date}</p>
                </div>
                <span className="badge info">
                  {task.type === "grupo" ? "Grupo" : "Individual"}
                </span>
                <Icon name="chevron-right" size={14} className="task-chevron" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Modal
        open={Boolean(selectedFromState)}
        onClose={() => setSelectedTask(null)}
        title={selectedFromState?.title ?? "Tarefa"}
      >
        {selectedFromState && (
          <TaskDetailContent
            task={selectedFromState}
            onClose={() => setSelectedTask(null)}
          />
        )}
      </Modal>
    </>
  );
}
