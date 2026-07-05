"use client";

import type { DevAuditEntry } from "@/lib/dev-panel/types";
import { DevSectionHeader } from "@/components/dev/DevSectionHeader";

interface DevAuditSectionProps {
  entries: DevAuditEntry[];
  loading?: boolean;
}

export function DevAuditSection({ entries, loading = false }: DevAuditSectionProps) {
  return (
    <section className="card col-12 data-table-wrap" aria-labelledby="dev-audit-title">
      <DevSectionHeader
        icon="clipboard"
        title="Auditoria recente"
        titleId="dev-audit-title"
        subtitle="Ações sensíveis registradas no ambiente."
      />

      {loading ? (
        <p className="dev-empty-state" role="status">
          Carregando auditoria…
        </p>
      ) : entries.length === 0 ? (
        <p className="dev-empty-state">Nenhuma ação registrada ainda.</p>
      ) : (
        <table className="data-table dev-audit-table">
          <thead>
            <tr>
              <th>Quando</th>
              <th>Ação</th>
              <th>Operador</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <time dateTime={entry.at}>
                    {new Date(entry.at).toLocaleString("pt-BR")}
                  </time>
                </td>
                <td>{entry.action}</td>
                <td>{entry.operatorEmail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
