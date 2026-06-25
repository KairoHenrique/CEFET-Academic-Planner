import { StatsRow } from "@/components/dashboard/StatsRow";
import { SubjectsGrid } from "@/components/dashboard/SubjectsGrid";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { WeeklySchedulePreview } from "@/components/dashboard/WeeklySchedulePreview";
import { IntegrationProgress } from "@/components/dashboard/IntegrationProgress";

export default function DashboardPage() {
  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <p className="page-header-eyebrow">Semestre 2026.1</p>
        <h1>
          Bom dia, <span className="highlight">Kairo</span>
        </h1>
        <p className="subtitle">
          Engenharia de Computação · CEFET-MG Divinópolis
        </p>
      </header>

      <StatsRow />

      <div className="dashboard-grid dashboard-section">
        <div className="col-8">
          <UpcomingTasks />
        </div>

        <div className="col-4">
          <IntegrationProgress />
        </div>

        <div className="col-12">
          <WeeklySchedulePreview />
        </div>

        <div className="col-12">
          <SubjectsGrid />
        </div>
      </div>
    </div>
  );
}
