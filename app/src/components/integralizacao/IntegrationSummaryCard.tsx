import { SectionHeader } from "@/components/ui/SectionHeader";
import type { IntegralizacaoCategoryDetail } from "@/lib/types/integralizacao-api";

interface IntegrationSummaryCardProps {
  categories: IntegralizacaoCategoryDetail[];
}

export function IntegrationSummaryCard({
  categories,
}: IntegrationSummaryCardProps) {
  return (
    <div className="card integration-summary-card">
      <SectionHeader title="Resumo por Categoria" icon="chart" />
      <div className="integration-summary-body">
        <div className="progress-category-list integration-category-list">
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
                <div
                  className="progress-bar progress-bar-lg"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${cat.label}: ${pct}%`}
                >
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
