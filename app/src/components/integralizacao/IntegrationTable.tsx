import {
  integrationCategories,
  INTEGRATION_TOTAL_HOURS,
} from "@/config/mock/integration";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";

export function IntegrationTable() {
  const totalDone = integrationCategories.reduce((a, c) => a + c.done, 0);
  const percentage = Math.round((totalDone / INTEGRATION_TOTAL_HOURS) * 100);

  return (
    <>
      <div className="col-4">
        <div className="card stat-card">
          <p className="section-header-title">Total Integralizado</p>
          <p className="card-stat gold">{percentage}%</p>
          <p className="card-stat-detail">
            {totalDone}h de {INTEGRATION_TOTAL_HOURS}h
          </p>
        </div>
      </div>

      <div className="col-8">
        <div className="card">
          <SectionHeader title="Resumo por Categoria" icon="chart" />
          <div className="progress-category-list">
            {integrationCategories.map((cat) => {
              const pct =
                cat.total > 0
                  ? Math.round((cat.done / cat.total) * 100)
                  : 0;
              return (
                <div key={cat.label} className="progress-category-item">
                  <div className="progress-label-row">
                    <span className="progress-label">{cat.label}</span>
                    <span className="progress-value">
                      {cat.done}h / {cat.total}h
                    </span>
                  </div>
                  <div className="progress-bar progress-bar-lg">
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
      </div>

      <div className="col-12">
        <div className="data-table-wrap card">
          <div className="table-toolbar">
            <SectionHeader title="Detalhamento de Horas" icon="clipboard" />
            <button type="button" className="btn-gold">
              <Icon name="plus" size={14} />
              Cadastrar Horas
            </button>
          </div>
          <table className="data-table">
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
                  cat.total > 0
                    ? Math.round((cat.done / cat.total) * 100)
                    : 0;
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
                            className={`progress-bar-fill ${cat.color}`}
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
      </div>
    </>
  );
}
