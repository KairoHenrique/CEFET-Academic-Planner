"use client";

import { Icon } from "@/components/ui/Icon";
import { ChGlossaryHelpButton } from "@/components/integralizacao/ChGlossaryHelpButton";
import type { IntegralizacaoCategoryDetail } from "@/lib/types/integralizacao-api";

interface IntegrationDetailTableProps {
  categories: IntegralizacaoCategoryDetail[];
  onRegisterClick: () => void;
}

export function IntegrationDetailTable({
  categories,
  onRegisterClick,
}: IntegrationDetailTableProps) {
  return (
    <div className="data-table-wrap card integration-detail-card">
      <div className="table-toolbar">
        <div className="integration-table-header">
          <span className="section-header-icon" aria-hidden="true">
            <Icon name="clipboard" size={16} />
          </span>
          <h3 className="section-header-title">Detalhamento de Horas</h3>
          <ChGlossaryHelpButton />
        </div>
        <button type="button" className="btn-gold" onClick={onRegisterClick}>
          <Icon name="plus" size={14} />
          Cadastrar Horas
        </button>
      </div>
      <table className="data-table integration-table">
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Concluído</th>
            <th>Necessário</th>
            <th>Pendente</th>
            <th>Progresso</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const pct =
              cat.total > 0 ? Math.round((cat.done / cat.total) * 100) : 0;
            const manualCount = cat.manualEntries.length;

            return (
              <tr key={cat.label}>
                <td>
                  <span className="integration-table-category">{cat.label}</span>
                  {manualCount > 0 ? (
                    <span className="integration-manual-badge">
                      {manualCount}{" "}
                      {manualCount === 1
                        ? "lançamento manual"
                        : "lançamentos manuais"}
                    </span>
                  ) : null}
                </td>
                <td>{cat.done}h</td>
                <td>{cat.total}h</td>
                <td>{cat.pending}h</td>
                <td>
                  <div className="table-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span>{pct}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
