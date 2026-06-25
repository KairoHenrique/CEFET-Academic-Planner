import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  integrationCategories,
  INTEGRATION_TOTAL_HOURS,
} from "@/config/mock/integration";

export function IntegrationProgress() {
  const totalDone = integrationCategories.reduce((acc, c) => acc + c.done, 0);
  const percentage = Math.round((totalDone / INTEGRATION_TOTAL_HOURS) * 100);

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
            {totalDone}h / {INTEGRATION_TOTAL_HOURS}h
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
        {integrationCategories.map((cat) => {
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
