"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";

interface Task {
  id: number;
  title: string;
  subject: string;
  subjectColor: string;
  date: string;
  type: "individual" | "grupo";
  done: boolean;
}

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Diagramas UML",
    subject: "Eng. de Software",
    subjectColor: "var(--jersey-sky)",
    date: "20/05/2026",
    type: "individual",
    done: false,
  },
  {
    id: 2,
    title: "MIC1 — A Unidade Lógica e Aritmética",
    subject: "Lab. Arq. e Org. de Comp. I",
    subjectColor: "var(--gold-400)",
    date: "06/07/2026",
    type: "individual",
    done: false,
  },
  {
    id: 3,
    title: "Projeto Final",
    subject: "Eng. de Software",
    subjectColor: "var(--jersey-sky)",
    date: "16/06/2026",
    type: "grupo",
    done: false,
  },
  {
    id: 4,
    title: "Seminário Metodologia Ágil",
    subject: "Eng. de Software",
    subjectColor: "var(--jersey-sky)",
    date: "26/04/2026",
    type: "grupo",
    done: true,
  },
  {
    id: 5,
    title: "1ª Avaliação",
    subject: "Lab. Arq. e Org. de Comp. I",
    subjectColor: "var(--gold-400)",
    date: "18/06/2026",
    type: "individual",
    done: false,
  },
];

export function UpcomingTasks() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const pendingTasks = tasks.filter((t) => !t.done);
  const completedTasks = tasks.filter((t) => t.done);

  return (
    <div className="card card-full-height">
      <SectionHeader
        title="Próximas Entregas"
        icon="clipboard"
        badge={<span className="badge danger">{pendingTasks.length} pendentes</span>}
      />

      <div className="task-list">
        {pendingTasks.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={toggleTask} />
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
                faded
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  faded,
}: {
  task: Task;
  onToggle: (id: number) => void;
  faded?: boolean;
}) {
  return (
    <div className={`task-item ${faded ? "completed-section" : ""}`}>
      <button
        className={`task-checkbox ${task.done ? "checked" : ""}`}
        onClick={() => onToggle(task.id)}
        aria-label={`${task.done ? "Desmarcar" : "Marcar"} ${task.title}`}
      >
        {task.done && <Icon name="check" size={11} />}
      </button>
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
      </div>
    </div>
  );
}
