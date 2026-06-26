"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { FilterBar } from "@/components/ui/FilterBar";
import { TaskDetailContent } from "@/components/ui/ActivityDetail";
import {
  createDisciplinaTarefa,
  patchTarefa,
} from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { AcademicTask } from "@/lib/types/task";
import {
  formatTaskDueLabel,
  matchesTaskDueFilter,
  type TaskDueFilter,
} from "@/lib/tasks/dates";

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

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.disciplina(subjectCode),
    });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.disciplinas() });
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

  const visibleTasks = useMemo(
    () => tasks.filter((task) => matchesTaskDueFilter(task, filterKey)),
    [tasks, filterKey]
  );

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
          <FilterBar
            filters={FILTER_OPTIONS}
            active={dueFilter}
            onChange={setDueFilter}
          />
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
              <TaskRow
                key={task.id}
                task={task}
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
              <TaskRow
                key={task.id}
                task={task}
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
                  <TaskRow
                    key={task.id}
                    task={task}
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
          <label className="form-field">
            <span className="form-label">Tipo</span>
            <select
              className="form-input"
              value={formType}
              onChange={(e) =>
                setFormType(e.target.value as "individual" | "grupo")
              }
            >
              <option value="individual">Individual</option>
              <option value="grupo">Grupo</option>
            </select>
          </label>
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
        onClose={() => setSelectedTask(null)}
        title={selectedFromState?.title ?? "Tarefa"}
      >
        {selectedFromState && (
          <TaskDetailContent
            task={selectedFromState}
            onClose={() => setSelectedTask(null)}
            onToggleDone={() => toggleTask(selectedFromState.id)}
            onEdit={() => openEditForm(selectedFromState)}
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
  onEdit: (task: AcademicTask) => void;
  faded?: boolean;
  disabled?: boolean;
}

function TaskRow({
  task,
  onToggle,
  onOpen,
  onEdit,
  faded,
  disabled,
}: TaskRowProps) {
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
          <div className="task-meta-row">
            <span className={`task-title ${task.done ? "completed" : ""}`}>
              {task.title}
            </span>
            <span className="badge info task-type-badge">
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
      <button
        type="button"
        className="task-edit-btn"
        onClick={() => onEdit(task)}
        aria-label={`Editar ${task.title}`}
        disabled={disabled}
      >
        Editar
      </button>
    </div>
  );
}
