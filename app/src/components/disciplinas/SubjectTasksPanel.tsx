"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { PlannerSelect } from "@/components/ui/PlannerSelect";
import { FilterBar } from "@/components/ui/FilterBar";
import { TaskDetailContent } from "@/components/ui/ActivityDetail";
import { TaskListRow } from "@/components/tasks/TaskListRow";
import { TaskSortSelect } from "@/components/tasks/TaskSortSelect";
import {
  createDisciplinaTarefa,
  patchTarefa,
} from "@/lib/api/client";
import { invalidateTaskSyncQueries } from "@/lib/query/invalidate-task-sync";
import type { AcademicTask } from "@/lib/types/task";
import {
  matchesTaskDueFilter,
  type TaskDueFilter,
} from "@/lib/tasks/dates";
import { sortTasks } from "@/lib/priority/sort";
import { useTaskPriorities } from "@/hooks/useStoredPriorities";
import { useTaskSortMode } from "@/hooks/useTaskSortMode";

interface SubjectTasksPanelProps {
  subjectCode: string;
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

export function SubjectTasksPanel({
  subjectCode,
  tasks: initialTasks,
}: SubjectTasksPanelProps) {
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState<AcademicTask[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<AcademicTask | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AcademicTask | null>(null);
  const [dueFilter, setDueFilter] = useState("Todas");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("23:59");
  const [formType, setFormType] = useState<"individual" | "grupo">("individual");
  const { getPriority, setTaskPriority, map: taskPriorityMap } =
    useTaskPriorities();
  const { mode: sortMode, setSortMode, hydrated: sortReady } = useTaskSortMode();

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const invalidate = (subjectCodeOverride?: string) => {
    invalidateTaskSyncQueries(queryClient, {
      subjectCode: subjectCodeOverride ?? subjectCode,
    });
  };

  const toggleMutation = useMutation({
    mutationFn: ({ id, concluida }: { id: number; concluida: boolean }) =>
      patchTarefa(id, { action: "toggle", concluida }),
    onSuccess: (_data, variables) => {
      invalidate();
      setTasks((prev) =>
        prev.map((task) =>
          task.id === variables.id
            ? { ...task, done: variables.concluida }
            : task
        )
      );
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingTask) {
        return patchTarefa(editingTask.id, {
          action: "update",
          titulo: formTitle,
          descricao: formDescription,
          data_fim: formDate,
          hora_fim: formTime,
          tipo: formType,
        });
      }
      return createDisciplinaTarefa(subjectCode, {
        titulo: formTitle,
        descricao: formDescription,
        data_fim: formDate,
        hora_fim: formTime,
        tipo: formType,
      });
    },
    onSuccess: () => {
      invalidate();
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => patchTarefa(id, { action: "delete" }),
    onSuccess: (_data, id) => {
      invalidate();
      setTasks((prev) => prev.filter((task) => task.id !== id));
      setSelectedTask(null);
      closeForm();
    },
  });

  const filterKey = (Object.entries(FILTER_LABELS).find(
    ([, label]) => label === dueFilter
  )?.[0] ?? "todas") as TaskDueFilter;

  const visibleTasks = useMemo(() => {
    const filtered = tasks.filter((task) =>
      matchesTaskDueFilter(task, filterKey)
    );
    if (!sortReady) return filtered;
    return sortTasks(filtered, getPriority, sortMode);
  }, [tasks, filterKey, getPriority, sortReady, sortMode, taskPriorityMap]);

  const pendingTasks = visibleTasks.filter((task) => !task.done);
  const completedTasks = visibleTasks.filter((task) => task.done);

  const openCreate = () => {
    setEditingTask(null);
    setFormTitle("");
    setFormDescription("");
    setFormDate("");
    setFormTime("23:59");
    setFormType("individual");
    setFormOpen(true);
  };

  const openEditForm = (task: AcademicTask) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description);
    setFormDate(task.dueDateIso);
    setFormTime(task.dueTime);
    setFormType(task.type);
    setFormOpen(true);
    setSelectedTask(null);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingTask(null);
  };

  const toggleTask = (id: number) => {
    const task = tasks.find((item) => item.id === id);
    if (!task || toggleMutation.isPending) return;
    toggleMutation.mutate({ id, concluida: !task.done });
  };

  const handleSaveTask = async () => {
    if (!formTitle.trim() || !formDate) return;
    await saveMutation.mutateAsync();
  };

  const selectedFromState =
    selectedTask && tasks.find((task) => task.id === selectedTask.id);

  const closeDetailModal = useCallback(() => setSelectedTask(null), []);

  const handleDetailToggle = useCallback(() => {
    if (!selectedFromState) return;
    toggleTask(selectedFromState.id);
  }, [selectedFromState]);

  const handleDetailEdit = useCallback(() => {
    if (!selectedFromState) return;
    openEditForm(selectedFromState);
  }, [selectedFromState]);

  const isSaving =
    toggleMutation.isPending ||
    saveMutation.isPending ||
    deleteMutation.isPending;

  const saveError =
    (saveMutation.error ?? deleteMutation.error) instanceof Error
      ? (saveMutation.error ?? deleteMutation.error)?.message
      : null;

  return (
    <>
      <div className="card card-full-height">
        <div className="tasks-panel-header">
          <SectionHeader
            title="Tarefas e Atividades"
            icon="clipboard"
            badge={
              pendingTasks.length > 0 ? (
                <span className="badge danger">{pendingTasks.length} pendentes</span>
              ) : undefined
            }
          />
          <button type="button" className="btn-outline" onClick={openCreate}>
            <Icon name="plus" size={14} />
            Tarefa
          </button>
        </div>

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

        {visibleTasks.length === 0 ? (
          <p className="panel-footer-note">
            {tasks.length === 0
              ? "Nenhuma tarefa cadastrada nesta disciplina."
              : "Nenhuma tarefa neste filtro."}
          </p>
        ) : filterKey === "concluidas" ? (
          <div className="task-list">
            {visibleTasks.map((task) => (
              <TaskListRow
                key={task.id}
                task={task}
                priority={getPriority(task.id)}
                onSetPriority={(level) => setTaskPriority(task.id, level)}
                onToggle={toggleTask}
                onOpen={setSelectedTask}
                onEdit={openEditForm}
                faded
                disabled={isSaving}
              />
            ))}
          </div>
        ) : (
          <div className="task-list">
            {pendingTasks.map((task) => (
              <TaskListRow
                key={task.id}
                task={task}
                priority={getPriority(task.id)}
                onSetPriority={(level) => setTaskPriority(task.id, level)}
                onToggle={toggleTask}
                onOpen={setSelectedTask}
                onEdit={openEditForm}
                disabled={isSaving}
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
                    onEdit={openEditForm}
                    faded
                    disabled={isSaving}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingTask ? "Editar tarefa" : "Nova tarefa"}
      >
        <div className="modal-form-stack">
          <Input
            label="Título"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Ex.: Trabalho 1"
          />
          <Input
            label="Descrição"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Opcional"
          />
          <Input
            label="Data de entrega"
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
          />
          <Input
            label="Hora máxima de entrega"
            type="time"
            value={formTime}
            onChange={(e) => setFormTime(e.target.value)}
          />
          <PlannerSelect
            label="Tipo"
            value={formType}
            fullWidth
            options={[
              { value: "individual", label: "Individual" },
              { value: "grupo", label: "Grupo" },
            ]}
            onChange={(next) => setFormType(next)}
          />
        </div>
        <div className="modal-form-actions">
          {saveError && (
            <p className="form-error" role="alert">
              {saveError}
            </p>
          )}
          {editingTask?.manual && (
            <button
              type="button"
              className="btn-outline btn-danger"
              onClick={() => void deleteMutation.mutateAsync(editingTask.id)}
              disabled={isSaving}
            >
              Excluir
            </button>
          )}
          <button
            type="button"
            className="btn-gold"
            onClick={() => void handleSaveTask()}
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
          <button type="button" className="btn-outline" onClick={closeForm}>
            Cancelar
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(selectedFromState)}
        onClose={closeDetailModal}
        title={selectedFromState?.title ?? "Tarefa"}
        scrollOptimized
      >
        {selectedFromState && (
          <TaskDetailContent
            task={selectedFromState}
            onClose={closeDetailModal}
            onToggleDone={handleDetailToggle}
            onEdit={handleDetailEdit}
          />
        )}
      </Modal>
    </>
  );
}
