import { SectionHeader } from "@/components/ui/SectionHeader";

const categories = [
  { label: "Obrigatória", done: 545, total: 3080, color: "blue" },
  { label: "Optativa", done: 0, total: 240, color: "gold" },
  { label: "Complementar", done: 0, total: 375, color: "success" },
  { label: "Extensão", done: 0, total: 450, color: "warning" },
  { label: "Flexibilizada", done: 0, total: 30, color: "blue" },
] as const;

export function IntegrationProgress() {
  const totalDone = categories.reduce((acc, c) => acc + c.done, 0);
  const totalNeeded = 4320;
  const percentage = Math.round((totalDone / totalNeeded) * 100);

  return (
    <div className="card card-full-height">
      <SectionHeader
        title="Integralização"
        icon="chart"
        badge={<span className="badge info">{percentage}%</span>}
      />

      <div className="progress-overall">
        <div className="progress-label-row">
          <span className="progress-label">Total do Currículo</span>
          <span className="progress-value">
            {totalDone}h / {totalNeeded}h
          </span>
        </div>
        <div className="progress-bar progress-bar-lg">
          <div
            className="progress-bar-fill blue"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="progress-category-list">
        {categories.map((cat) => {
          const pct =
            cat.total > 0 ? Math.round((cat.done / cat.total) * 100) : 0;
          return (
            <div key={cat.label} className="progress-category-item">
              <div className="progress-label-row">
                <span className="progress-label">{cat.label}</span>
                <span className="progress-value">
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
