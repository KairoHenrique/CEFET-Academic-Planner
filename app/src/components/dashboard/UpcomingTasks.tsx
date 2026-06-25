"use client";

import { useState } from "react";

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
    subjectColor: "var(--blue-400)",
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
    subjectColor: "var(--blue-400)",
    date: "16/06/2026",
    type: "grupo",
    done: false,
  },
  {
    id: 4,
    title: "Seminário Metodologia Ágil",
    subject: "Eng. de Software",
    subjectColor: "var(--blue-400)",
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
    <div className="card" style={{ height: "100%" }}>
      <div className="card-header">
        <h3>📋 Próximas Entregas</h3>
        <span className="badge danger">{pendingTasks.length} pendentes</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {pendingTasks.map((task) => (
          <div key={task.id} className="task-item">
            <button
              className={`task-checkbox ${task.done ? "checked" : ""}`}
              onClick={() => toggleTask(task.id)}
              aria-label={`Marcar ${task.title} como concluída`}
            >
              {task.done && (
                <span style={{ color: "white", fontSize: "0.7rem" }}>✓</span>
              )}
            </button>
            <div className="task-info">
              <div className={`task-title ${task.done ? "completed" : ""}`}>
                {task.title}
              </div>
              <div className="task-subtitle">
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: task.subjectColor,
                    marginRight: 6,
                  }}
                />
                {task.subject}
                <span className="badge info" style={{ marginLeft: 8 }}>
                  {task.type === "grupo" ? "Grupo" : "Individual"}
                </span>
              </div>
            </div>
            <div className="task-date">📅 {task.date}</div>
          </div>
        ))}

        {completedTasks.length > 0 && (
          <>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-tertiary)",
                padding: "var(--space-3) var(--space-4)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginTop: "var(--space-2)",
              }}
            >
              Concluídas ({completedTasks.length})
            </div>
            {completedTasks.map((task) => (
              <div key={task.id} className="task-item" style={{ opacity: 0.5 }}>
                <button
                  className="task-checkbox checked"
                  onClick={() => toggleTask(task.id)}
                  aria-label={`Desmarcar ${task.title}`}
                >
                  <span style={{ color: "white", fontSize: "0.7rem" }}>✓</span>
                </button>
                <div className="task-info">
                  <div className="task-title completed">{task.title}</div>
                  <div className="task-subtitle">{task.subject}</div>
                </div>
                <div className="task-date">📅 {task.date}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
