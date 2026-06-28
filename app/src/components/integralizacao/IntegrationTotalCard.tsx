import { IntegrationDonutChart } from "@/components/integralizacao/IntegrationDonutChart";

interface IntegrationTotalCardProps {
  totalDone: number;
  totalHours: number;
  percent: number;
}

export function IntegrationTotalCard({
  totalDone,
  totalHours,
  percent,
}: IntegrationTotalCardProps) {
  return (
    <div className="card stat-card integration-total-card">
      <header className="integration-total-header">
        <p className="section-header-title">Total Integralizado</p>
        <p className="integration-total-subtitle">Progresso da formação</p>
      </header>
      <IntegrationDonutChart
        percentage={percent}
        totalDone={totalDone}
        totalHours={totalHours}
      />
    </div>
  );
}
