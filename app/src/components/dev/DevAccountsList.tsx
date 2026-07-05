"use client";

import type { DevAccountView } from "@/lib/dev-panel/types";
import { DevSectionHeader } from "@/components/dev/DevSectionHeader";
import {
  formatDevDateTime,
  subscriptionStatusLabel,
} from "@/components/dev/dev-panel-formatters";
import { Icon } from "@/components/ui/Icon";

interface DevAccountsListProps {
  accounts: DevAccountView[];
  selectedCpf: string | null;
  onSelect: (cpf: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  loading?: boolean;
  className?: string;
}

function formatLastSync(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DevAccountsList({
  accounts,
  selectedCpf,
  onSelect,
  search,
  onSearchChange,
  loading = false,
  className = "col-7",
}: DevAccountsListProps) {
  const searchField = (
    <label className="dev-search-field">
      <Icon name="search" size={16} aria-hidden />
      <input
        type="search"
        className="form-input"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar nome ou CPF…"
        aria-label="Buscar contas"
      />
    </label>
  );

  return (
    <section
      className={`card data-table-wrap dev-accounts-card ${className}`}
    >
      <DevSectionHeader
        icon="users"
        title="Contas & assinaturas"
        subtitle="Trial, plano e credencial SIGAA — clique para disparo individual."
        actions={searchField}
      />

      {loading ? (
        <p className="dev-empty-state" role="status">
          Carregando contas…
        </p>
      ) : accounts.length === 0 ? (
        <p className="dev-empty-state">Nenhuma conta encontrada.</p>
      ) : (
        <table className="data-table dev-accounts-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Expira</th>
              <th>Dias</th>
              <th>Credencial</th>
              <th>Último sync</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => {
              const selected = selectedCpf === account.cpf;

              return (
                <tr
                  key={account.cpf}
                  className={`data-table-row-clickable ${
                    selected ? "dev-table-row--selected" : ""
                  }`}
                  tabIndex={0}
                  onClick={() => onSelect(account.cpf)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(account.cpf);
                    }
                  }}
                  aria-selected={selected}
                >
                  <td>
                    <span className="dev-table-name">{account.displayName}</span>
                    {account.email ? (
                      <span className="dev-table-meta">{account.email}</span>
                    ) : null}
                  </td>
                  <td>{account.cpfMasked}</td>
                  <td>{account.subscription?.planLabel ?? "—"}</td>
                  <td>
                    {account.subscription ? (
                      <span
                        className={`profile-plan-status profile-plan-status--${account.subscription.status}`}
                      >
                        {subscriptionStatusLabel(account.subscription.status)}
                      </span>
                    ) : (
                      <span className="enrollment-status-pill enrollment-status-pill--muted">
                        Sem registro
                      </span>
                    )}
                  </td>
                  <td>
                    {account.subscription
                      ? formatDevDateTime(account.subscription.expiresAt)
                      : "—"}
                  </td>
                  <td>
                    {account.subscription
                      ? account.subscription.daysRemaining
                      : "—"}
                  </td>
                  <td>
                    <span
                      className={`enrollment-status-pill ${
                        account.hasSigaaPassword
                          ? "enrollment-status-pill--success"
                          : "enrollment-status-pill--muted"
                      }`}
                    >
                      {account.hasSigaaPassword ? "Salva" : "Ausente"}
                    </span>
                  </td>
                  <td>{formatLastSync(account.lastSyncAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
