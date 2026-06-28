"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FilterBar } from "@/components/ui/FilterBar";
import { Modal } from "@/components/ui/Modal";
import { TaskDetailContent } from "@/components/ui/ActivityDetail";
import { TaskListRow } from "@/components/tasks/TaskListRow";
import { TaskSortSelect } from "@/components/tasks/TaskSortSelect";
import { patchTarefa } from "@/lib/api/client";
import { invalidateTaskSyncQueries } from "@/lib/query/invalidate-task-sync";
import { sortTasks } from "@/lib/priority/sort";
import type { AcademicTask } from "@/lib/types/task";
import {
  matchesTaskDueFilter,
  shouldHideTaskFromDashboard,
  type TaskDueFilter,
} from "@/lib/tasks/dates";
import { useTaskPriorities } from "@/hooks/useStoredPriorities";
import { useTaskSortMode } from "@/hooks/useTaskSortMode";

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
  const { getPriority, setTaskPriority, map: taskPriorityMap } =
    useTaskPriorities();
  const { mode: sortMode, setSortMode, hydrated: sortReady } = useTaskSortMode();

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const toggleMutation = useMutation({
    mutationFn: ({ id, concluida }: { id: number; concluida: boolean }) =>
      patchTarefa(id, { action: "toggle", concluida }),
    onSuccess: (_data, variables) => {
      const task = tasks.find((item) => item.id === variables.id);
      invalidateTaskSyncQueries(queryClient, {
        subjectCode: task?.subjectCode,
      });
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

  const visibleTasks = useMemo(() => {
    const filtered = tasks
      .filter((task) =>
        filterKey === "concluidas" ? true : !shouldHideTaskFromDashboard(task)
      )
      .filter((task) => matchesTaskDueFilter(task, filterKey));

    if (!sortReady) return filtered;
    return sortTasks(filtered, getPriority, sortMode);
  }, [tasks, filterKey, getPriority, sortReady, sortMode, taskPriorityMap]);

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
          <div className="tasks-panel-filters__chips">
            <FilterBar
              filters={FILTER_OPTIONS}
              active={dueFilter}
              onChange={setDueFilter}
              nowrap
            />
          </div>
          <TaskSortSelect mode={sortMode} onChange={setSortMode} />
        </div>

        <div className="task-list">
          {visibleTasks.length === 0 && (
            <p className="page-state-message">Nenhuma tarefa neste filtro.</p>
          )}

          {filterKey === "concluidas" ? (
            visibleTasks.map((task) => (
              <TaskListRow
                key={task.id}
                task={task}
                priority={getPriority(task.id)}
                onSetPriority={(level) => setTaskPriority(task.id, level)}
                onToggle={toggleTask}
                onOpen={setSelectedTask}
                showSubject
                faded
                disabled={toggleMutation.isPending}
              />
            ))
          ) : (
            <>
              {pendingTasks.map((task) => (
                <TaskListRow
                  key={task.id}
                  task={task}
                  priority={getPriority(task.id)}
                  onSetPriority={(level) => setTaskPriority(task.id, level)}
                  onToggle={toggleTask}
                  onOpen={setSelectedTask}
                  showSubject
                  disabled={toggleMutation.isPending}
                />
              ))}

              {completedTasks.length > 0 && (
                <>
                  <p className="task-section-label">
                    Concluídas ({completedTasks.length})
                  </p>
                  {completedTasks.map((task) => (
                    <TaskListRow
                      key={task.id}
                      task={task}
                      priority={getPriority(task.id)}
                      onSetPriority={(level) => setTaskPriority(task.id, level)}
                      onToggle={toggleTask}
                      onOpen={setSelectedTask}
                      showSubject
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
