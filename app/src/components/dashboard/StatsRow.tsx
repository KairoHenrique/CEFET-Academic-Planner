export function StatsRow() {
  const stats = [
    {
      label: "Rendimento Global",
      value: "56.33",
      color: "gold" as const,
      detail: "RG Acumulado",
      icon: "⭐",
    },
    {
      label: "Integralização",
      value: "16%",
      color: "blue" as const,
      detail: "do curso concluído",
      icon: "📊",
    },
    {
      label: "Disciplinas",
      value: "7",
      color: "blue" as const,
      detail: "cursando este semestre",
      icon: "📚",
    },
    {
      label: "Tarefas Pendentes",
      value: "3",
      color: "danger" as const,
      detail: "entregas próximas",
      icon: "📋",
    },
  ];

  return (
    <div className="dashboard-grid stagger-children">
      {stats.map((stat) => (
        <div key={stat.label} className="col-3">
          <div className="card">
            <div className="card-header">
              <h3>{stat.label}</h3>
              <span style={{ fontSize: "1.4rem" }}>{stat.icon}</span>
            </div>
            <div className={`card-stat ${stat.color}`}>{stat.value}</div>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.8rem",
                marginTop: "var(--space-2)",
              }}
            >
              {stat.detail}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
