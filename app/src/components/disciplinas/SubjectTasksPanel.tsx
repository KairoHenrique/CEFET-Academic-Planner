"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { TaskDetailContent } from "@/components/ui/ActivityDetail";
import { patchTarefa } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { AcademicTask } from "@/lib/types/task";

interface SubjectTasksPanelProps {
  subjectCode: string;
  tasks: AcademicTask[];
}

export function SubjectTasksPanel({
  subjectCode,
  tasks: initialTasks,
}: SubjectTasksPanelProps) {
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState<AcademicTask[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<AcademicTask | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const toggleMutation = useMutation({
    mutationFn: ({ id, concluida }: { id: number; concluida: boolean }) =>
      patchTarefa(id, { concluida }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.disciplina(subjectCode),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      setTasks((prev) =>
        prev.map((task) =>
          task.id === variables.id
            ? { ...task, done: variables.concluida }
            : task
        )
      );
      setSelectedTask((prev) =>
        prev?.id === variables.id
          ? { ...prev, done: variables.concluida }
          : prev
      );
    },
  });

  const toggleTask = (id: number) => {
    const task = tasks.find((item) => item.id === id);
    if (!task || toggleMutation.isPending) return;
    toggleMutation.mutate({ id, concluida: !task.done });
  };

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

  const pendingTasks = tasks.filter((task) => !task.done);
  const completedTasks = tasks.filter((task) => task.done);

  return (
    <>
      <div className="card card-full-height">
        <SectionHeader
          title="Tarefas e Atividades"
          icon="clipboard"
          badge={
            pendingTasks.length > 0 ? (
              <span className="badge danger">{pendingTasks.length} pendentes</span>
            ) : undefined
          }
        />

        <div className="task-list">
          {pendingTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onOpen={setSelectedTask}
              disabled={toggleMutation.isPending}
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
                  disabled={toggleMutation.isPending}
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
  disabled?: boolean;
}

function TaskRow({ task, onToggle, onOpen, faded, disabled }: TaskRowProps) {
  return (
    <div className={`task-item ${faded ? "completed-section" : ""}`}>
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
          <div className={`task-title ${task.done ? "completed" : ""}`}>
            {task.title}
          </div>
          <div className="task-subtitle">
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
