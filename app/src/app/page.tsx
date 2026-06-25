import { StatsRow } from "@/components/dashboard/StatsRow";
import { SubjectsGrid } from "@/components/dashboard/SubjectsGrid";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { WeeklySchedulePreview } from "@/components/dashboard/WeeklySchedulePreview";
import { IntegrationProgress } from "@/components/dashboard/IntegrationProgress";

export default function DashboardPage() {
  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1>Bom dia, Kairo 👋</h1>
        <p className="subtitle">
          Semestre 2026.1 · Engenharia de Computação · CEFET-MG Divinópolis
        </p>
      </div>

      {/* Stats Row (RG, Integralização, Faltas, Tarefas) */}
      <StatsRow />

      {/* Main Grid */}
      <div className="dashboard-grid" style={{ marginTop: "var(--space-6)" }}>
        {/* Próximas Entregas */}
        <div className="col-8">
          <UpcomingTasks />
        </div>

        {/* Progresso de Integralização */}
        <div className="col-4">
          <IntegrationProgress />
        </div>

        {/* Grade da Semana (Preview) */}
        <div className="col-12">
          <WeeklySchedulePreview />
        </div>

        {/* Disciplinas do Semestre */}
        <div className="col-12">
          <SubjectsGrid />
        </div>
      </div>
    </div>
  );
}
