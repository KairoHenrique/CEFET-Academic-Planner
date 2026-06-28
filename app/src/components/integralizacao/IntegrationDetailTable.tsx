"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";
import { ChTypeInfoButton } from "@/components/integralizacao/ChTypeInfoButton";
import type { ChType } from "@/lib/integralizacao/ch-catalog";
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
        <SectionHeader title="Detalhamento de Horas" icon="clipboard" />
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
                  <span className="integration-table-category">
                    {cat.label}
                    <ChTypeInfoButton
                      tipoCh={cat.label as ChType}
                      compact
                    />
                  </span>
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
