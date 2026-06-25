import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";

const mockTasks = [
  { title: "Diagramas UML", date: "20/05/2026", type: "individual" as const },
  { title: "Projeto Final", date: "16/06/2026", type: "grupo" as const },
];

export function SubjectTasksPanel() {
  return (
    <div className="card">
      <SectionHeader title="Tarefas e Atividades" icon="clipboard" />
      <ul className="event-list">
        {mockTasks.map((task) => (
          <li key={task.title} className="event-list-item">
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
          </li>
        ))}
      </ul>
    </div>
  );
}
