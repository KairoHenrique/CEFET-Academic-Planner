"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { FilterBar } from "@/components/ui/FilterBar";
import { TaskDetailContent } from "@/components/ui/ActivityDetail";
import { patchTarefa } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { AcademicTask } from "@/lib/types/task";
import {
  formatTaskDueLabel,
  matchesTaskDueFilter,
  shouldHideTaskFromDashboard,
  type TaskDueFilter,
} from "@/lib/tasks/dates";

interface UpcomingTasksProps {
  tasks: AcademicTask[];
}

const FILTER_LABELS: Record<TaskDueFilter, string> = {
  todas: "Todas",
  semana: "Esta semana",
  mes: "Este mês",
  atrasadas: "Atrasadas",
  concluidas: "Concluídas",
};

const FILTER_OPTIONS = Object.values(FILTER_LABELS);

export function UpcomingTasks({ tasks: initialTasks }: UpcomingTasksProps) {
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState<AcademicTask[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<AcademicTask | null>(null);
  const [dueFilter, setDueFilter] = useState("Todas");

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const toggleMutation = useMutation({
    mutationFn: ({ id, concluida }: { id: number; concluida: boolean }) =>
      patchTarefa(id, { action: "toggle", concluida }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === variables.id ? { ...t, done: variables.concluida } : t
        )
      );
      setSelectedTask((prev) =>
        prev?.id === variables.id
          ? { ...prev, done: variables.concluida }
          : prev
      );
    },
  });

  const filterKey = (Object.entries(FILTER_LABELS).find(
    ([, label]) => label === dueFilter
  )?.[0] ?? "todas") as TaskDueFilter;

  const visibleTasks = useMemo(
    () =>
      tasks
        .filter((task) =>
          filterKey === "concluidas"
            ? true
            : !shouldHideTaskFromDashboard(task)
        )
        .filter((task) => matchesTaskDueFilter(task, filterKey)),
    [tasks, filterKey]
  );

  const toggleTask = (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || toggleMutation.isPending) return;
    toggleMutation.mutate({ id, concluida: !task.done });
  };

  const pendingTasks = visibleTasks.filter((t) => !t.done);
  const completedTasks = visibleTasks.filter((t) => t.done);

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

        <div className="tasks-panel-filters">
          <FilterBar
            filters={FILTER_OPTIONS}
            active={dueFilter}
            onChange={setDueFilter}
          />
        </div>

        <div className="task-list">
          {visibleTasks.length === 0 && (
            <p className="page-state-message">Nenhuma tarefa neste filtro.</p>
          )}

          {filterKey === "concluidas" ? (
            visibleTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onOpen={setSelectedTask}
                faded
                disabled={toggleMutation.isPending}
              />
            ))
          ) : (
            <>
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
          {formatTaskDueLabel(task.date, task.dueTime)}
          <Icon name="chevron-right" size={14} className="task-chevron" />
        </div>
      </button>
    </div>
  );
}
