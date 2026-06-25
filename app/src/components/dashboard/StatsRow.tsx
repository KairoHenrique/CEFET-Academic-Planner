import { Icon, type IconName } from "@/components/ui/Icon";

const stats: {
  label: string;
  value: string;
  color: "gold" | "blue" | "danger";
  detail: string;
  icon: IconName;
}[] = [
  {
    label: "Rendimento Global",
    value: "56.33",
    color: "gold",
    detail: "RG acumulado",
    icon: "star",
  },
  {
    label: "Integralização",
    value: "16%",
    color: "blue",
    detail: "do curso concluído",
    icon: "chart",
  },
  {
    label: "Disciplinas",
    value: "7",
    color: "blue",
    detail: "cursando este semestre",
    icon: "books",
  },
  {
    label: "Tarefas Pendentes",
    value: "3",
    color: "danger",
    detail: "entregas próximas",
    icon: "clipboard",
  },
];

export function StatsRow() {
  return (
    <>
      {stats.map((stat) => (
        <div key={stat.label} className="col-3 col-stat">
          <div className="card stat-card">
            <p className="card-header">
              <span className="section-header-title">{stat.label}</span>
            </p>
            <div className="card-stat-row">
              <div>
                <div className={`card-stat ${stat.color}`}>{stat.value}</div>
                <p className="card-stat-detail">{stat.detail}</p>
              </div>
              <span className="card-stat-icon" aria-hidden="true">
                <Icon name={stat.icon} size={18} />
              </span>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
