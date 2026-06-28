"use client";

import { ChGlossaryHelpButton } from "@/components/integralizacao/ChGlossaryHelpButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { DashboardIntegralizacao } from "@/lib/types/dashboard";

interface IntegrationProgressProps {
  integralizacao: DashboardIntegralizacao;
}

export function IntegrationProgress({ integralizacao }: IntegrationProgressProps) {
  const percentage = integralizacao.percent;

  return (
    <div className="card card-full-height">
      <div className="integration-progress-header">
        <SectionHeader
          title="Integralização"
          icon="chart"
          badge={<span className="badge info">{percentage}%</span>}
        />
        <ChGlossaryHelpButton callout="Tipos de carga horária no PPC" />
      </div>

      <div className="progress-overall">
        <div className="progress-label-row">
          <span className="progress-label">Total do Currículo</span>
          <span className="progress-value">
            {integralizacao.totalDone}h / {integralizacao.totalHours}h
          </span>
        </div>
        <div className="progress-bar progress-bar-lg">
          <div
            className="progress-bar-fill"
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
                  {cat.pending > 0
                    ? `${cat.pending}h pendentes`
                    : `${cat.done}h / ${cat.total}h`}
                </span>
              </div>
              <div className="progress-bar">
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
  );
}
