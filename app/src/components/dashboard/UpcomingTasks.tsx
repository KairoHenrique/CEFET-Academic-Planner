"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { TaskDetailContent } from "@/components/ui/ActivityDetail";
import type { AcademicTask } from "@/lib/types/task";

interface UpcomingTasksProps {
  tasks: AcademicTask[];
}

export function UpcomingTasks({ tasks: initialTasks }: UpcomingTasksProps) {
  const [tasks, setTasks] = useState<AcademicTask[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<AcademicTask | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
    setSelectedTask((prev) =>
      prev?.id === id ? { ...prev, done: !prev.done } : prev
    );
  };

  const pendingTasks = tasks.filter((t) => !t.done);
  const completedTasks = tasks.filter((t) => t.done);

  const selectedFromState =
    selectedTask && tasks.find((task) => task.id === selectedTask.id);

  return (
    <>
      <div className="card card-full-height">
        <SectionHeader
          title="Próximas Entregas"
          icon="clipboard"
          badge={
            <span className="badge danger">{pendingTasks.length} pendentes</span>
          }
        />

        <div className="task-list">
          {pendingTasks.length === 0 && completedTasks.length === 0 && (
            <p className="page-state-message">Nenhuma tarefa cadastrada.</p>
          )}

          {pendingTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onOpen={setSelectedTask}
            />
          ))}

          {completedTasks.length > 0 && (
            <>
              <p className="task-section-label">
                Concluídas ({completedTasks.length})
              </p>
              {completedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onOpen={setSelectedTask}
                  faded
                />
              ))}
            </>
          )}
        </div>
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
            onToggleDone={() => toggleTask(selectedFromState.id)}
          />
        )}
      </Modal>
    </>
  );
}

interface TaskRowProps {
  task: AcademicTask;
  onToggle: (id: number) => void;
  onOpen: (task: AcademicTask) => void;
  faded?: boolean;
}

function TaskRow({ task, onToggle, onOpen, faded }: TaskRowProps) {
  return (
    <div className={`task-item ${faded ? "completed-section" : ""}`}>
      <button
        type="button"
        className={`task-checkbox ${task.done ? "checked" : ""}`}
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
          <div className={`task-title ${task.done ? "completed" : ""}`}>
            {task.title}
          </div>
          <div className="task-subtitle">
            <span
              className="subject-dot"
              style={{ background: task.subjectColor }}
            />
            {task.subject}
            <span className="badge info">
              {task.type === "grupo" ? "Grupo" : "Individual"}
            </span>
          </div>
        </div>
        <div className="task-date">
          <Icon name="calendar" size={12} />
          {task.date}
          <Icon name="chevron-right" size={14} className="task-chevron" />
        </div>
      </button>
    </div>
  );
}
