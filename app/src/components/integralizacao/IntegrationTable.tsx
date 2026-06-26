import {
  integrationCategories,
  INTEGRATION_TOTAL_HOURS,
} from "@/config/mock/integration";
import { IntegrationDonutChart } from "@/components/integralizacao/IntegrationDonutChart";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";

export function IntegrationTotalCard() {
  const totalDone = integrationCategories.reduce((a, c) => a + c.done, 0);
  const percentage = Math.round((totalDone / INTEGRATION_TOTAL_HOURS) * 100);

  return (
    <div className="card stat-card integration-total-card">
      <header className="integration-total-header">
        <p className="section-header-title">Total Integralizado</p>
        <p className="integration-total-subtitle">Progresso da formação</p>
      </header>
      <IntegrationDonutChart
        percentage={percentage}
        totalDone={totalDone}
        totalHours={INTEGRATION_TOTAL_HOURS}
      />
    </div>
  );
}

export function IntegrationSummaryCard() {
  return (
    <div className="card integration-summary-card">
      <SectionHeader title="Resumo por Categoria" icon="chart" />
      <div className="integration-summary-body">
        <div className="progress-category-list integration-category-list">
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

export function IntegrationDetailTable() {
  return (
    <div className="data-table-wrap card integration-detail-card">
      <div className="table-toolbar">
        <SectionHeader title="Detalhamento de Horas" icon="clipboard" />
        <button type="button" className="btn-gold">
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
          {integrationCategories.map((cat) => {
            const pending = cat.total - cat.done;
            const pct =
              cat.total > 0 ? Math.round((cat.done / cat.total) * 100) : 0;
            return (
              <tr key={cat.label}>
                <td>{cat.label}</td>
                <td>{cat.done}h</td>
                <td>{cat.total}h</td>
                <td>{pending}h</td>
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
