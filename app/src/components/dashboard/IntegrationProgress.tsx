import { SectionHeader } from "@/components/ui/SectionHeader";
import type { DashboardIntegralizacao } from "@/lib/types/dashboard";

interface IntegrationProgressProps {
  integralizacao: DashboardIntegralizacao;
}

export function IntegrationProgress({ integralizacao }: IntegrationProgressProps) {
  const percentage = Math.round(
    (integralizacao.totalDone / integralizacao.totalHours) * 100
  );

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
            {integralizacao.totalDone}h / {integralizacao.totalHours}h
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
        {integralizacao.categories.map((cat) => {
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
