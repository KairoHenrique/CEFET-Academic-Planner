export function IntegrationProgress() {
  const categories = [
    { label: "Obrigatória", done: 545, total: 3080, color: "blue" },
    { label: "Optativa", done: 0, total: 240, color: "gold" },
    { label: "Complementar", done: 0, total: 375, color: "success" },
    { label: "Extensão", done: 0, total: 450, color: "warning" },
    { label: "Flexibilizada", done: 0, total: 30, color: "blue" },
  ];

  const totalDone = categories.reduce((acc, c) => acc + c.done, 0);
  const totalNeeded = 4320;
  const percentage = Math.round((totalDone / totalNeeded) * 100);

  return (
    <div className="card" style={{ height: "100%" }}>
      <div className="card-header">
        <h3>📈 Integralização</h3>
        <span className="badge info">{percentage}%</span>
      </div>

      {/* Overall Progress */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "var(--space-2)",
          }}
        >
          <span
            style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}
          >
            Total do Currículo
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-primary)", fontWeight: 600 }}>
            {totalDone}h / {totalNeeded}h
          </span>
        </div>
        <div className="progress-bar" style={{ height: 12 }}>
          <div
            className="progress-bar-fill blue"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Per-category */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {categories.map((cat) => {
          const pct = cat.total > 0 ? Math.round((cat.done / cat.total) * 100) : 0;
          return (
            <div key={cat.label}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "var(--space-1)",
                }}
              >
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  {cat.label}
                </span>
                <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
                  {cat.done}h / {cat.total}h
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-bar-fill ${cat.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
